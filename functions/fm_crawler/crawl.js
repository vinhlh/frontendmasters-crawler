const fetch = require('node-fetch')
const aws = require('aws-sdk')
const fs = require('fs')
const Promise = require('bluebird')

aws.config.update({ region: 'ap-southeast-1' })

const s3 = new aws.S3()

const API_SERVER = 'https://api.frontendmasters.com/v1/kabuki'

const DELAY_BETWEEN_LESSIONS = 22000

const getApiEndpoint = (name, { id }) =>
  API_SERVER +
  {
    courseInfo: `/courses/${id}`,
    lessonVideo: `/video/${id}/source?r=1080&f=webm`
  }[name]

const sleep = async ms => {
  console.warn('Sleep', ms)
  return new Promise(resolve => setTimeout(resolve, ms))
}

const pickAvailableCourse = courses => {
  if (process.env.DEV) {
    return 'testing-modular-front-end'
  }

  const courseIds = Object.keys(courses)
  const noneCourseId = courseIds.find(courseId => courses[courseId] === 'none')
  if (noneCourseId) {
    return noneCourseId
  }

  const failedCourseId = courseIds.find(courseId => courses[courseId] === 'failed')

  if (failedCourseId) {
    return failedCourseId
  }

  return courseIds.find(courseId => courses[courseId] === 'downloading')
}

const makeLog = logger => value => {
  console.warn(logger(value))
  return value
}

const storeInfoToS3 = async (courseId, courseInfo, bucketName) =>
  s3
    .putObject({
      Bucket: bucketName,
      Key: `${courseId}/info.json`,
      Body: JSON.stringify(courseInfo),
      ContentType: 'application/json',
      ACL: 'public-read'
    })
    .promise()

const updateBucketJsonFile = (bucketName, inputFile, content) =>
  s3
    .putObject({
      Bucket: bucketName,
      Key: inputFile,
      Body: JSON.stringify(content),
      ContentType: 'application/json',
      ACL: 'public-read'
    })
    .promise()

const fetchAllCourses = (bucketName, inputFile) =>
  s3
    .getObject({ Bucket: bucketName, Key: inputFile })
    .promise()
    .then(data => data.Body.toString())
    .then(JSON.parse)

const isVideoExistOnS3 = async (bucketName, courseId, lessonHash) => {
  try {
    await s3
      .headObject({
        Bucket: bucketName,
        Key: getLessonLocation(courseId, lessonHash)
      }, err => !!err)
      .promise()
    return true
  } catch (error) {
    if (error.name !== 'NotFound') {
      console.warn(error)
    }

    // prevent downloading again
    if (error.name === 'Forbidden') {
      return true
    }

    return false
  }
}

const setVideoAclToPrivate = async (bucketName, courseId, lessonHash) =>
  await s3.putObjectAcl({
    Bucket: bucketName,
    Key: getLessonLocation(courseId, lessonHash),
    ACL: 'private'
  })
  .promise()


const makeAuthenticatedOptions = cookie => ({
  headers: {
    Cookie: cookie.name + '=' + cookie.value,
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3425.0 Safari/537.36',
    Origin: 'https://frontendmasters.com',
    Referer:
      'https://frontendmasters.com/courses/advanced-react-patterns/introducing-advanced-react-patterns/'
  }
})

const getCourseInfo = (courseId, authenticatedOptions) =>
  fetch(
    getApiEndpoint('courseInfo', {
      id: courseId
    }),
    authenticatedOptions
  ).then(body => body.json())

const getVideoUrl = (lessonHash, authenticatedOptions) =>
  fetch(
    getApiEndpoint('lessonVideo', {
      id: lessonHash
    }),
    authenticatedOptions
  )
    .then(resp => resp.json())
    .then(resp => {
      if (resp.code || !resp.url) {
        console.warn(resp)
        throw new Error('Rate limited')
      }
      return resp.url
    })

const getVideoBuffer = url => fetch(url).then(resp => resp.buffer())

const getLessonLocation = (courseId, lessonHash) => `${courseId}/${lessonHash}.webm`

const saveVideoToS3 = (bucketName, courseId, lessonHash, buffer) =>
  s3
    .putObject({
      Bucket: bucketName,
      Key: getLessonLocation(courseId, lessonHash),
      Body: buffer,
      ContentType: 'video/webm',
      ACL: 'private'
    })
    .promise()

const crawl = async configs => {
  const { cookie, bucketName, slack, inputFile } = configs

  const authenticatedOptions = makeAuthenticatedOptions(cookie)

  const allCourses = await fetchAllCourses(bucketName, inputFile)
  const courseId = pickAvailableCourse(allCourses)

  if (!courseId) {
    return
  }

  await updateBucketJsonFile(bucketName, inputFile, {
    ...allCourses,
    [courseId]: 'downloading'
  })

  try {
    const courseInfo = await getCourseInfo(courseId, authenticatedOptions)

    console.warn(`Found courseName = ${courseInfo.title}`)

    await storeInfoToS3(courseId, courseInfo, bucketName)

    await Promise.mapSeries(courseInfo.lessonHashes, async lessonHash => {
      console.warn('Checking if video existed', lessonHash)
      const existed = await isVideoExistOnS3(bucketName, courseId, lessonHash)

      if (existed) {
        console.warn('Found', lessonHash)

        // reset ACL
        await setVideoAclToPrivate(bucketName, courseId, lessonHash)
        return
      }

      const videoUrl = await getVideoUrl(lessonHash, authenticatedOptions)

      console.warn(`Downloading ${videoUrl}`)

      const buffer = await getVideoBuffer(videoUrl)

      console.warn('Saving to bucket', lessonHash)

      await saveVideoToS3(bucketName, courseId, lessonHash, buffer)

      await sleep(DELAY_BETWEEN_LESSIONS)
    })

    const latestCourses = await fetchAllCourses(bucketName, inputFile)
    await updateBucketJsonFile(bucketName, inputFile, {
      ...latestCourses,
      [courseId]: 'downloaded'
    })
  } catch (error) {
    const latestCourses = await fetchAllCourses(bucketName, inputFile)
    await updateBucketJsonFile(bucketName, inputFile, {
      ...latestCourses,
      [courseId]: 'failed'
    })

    console.warn(courseId, error)
  }
}

module.exports = crawl
