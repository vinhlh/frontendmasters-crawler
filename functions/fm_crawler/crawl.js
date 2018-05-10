const fetch = require('node-fetch')
const aws = require('aws-sdk')
const fs = require('fs')
const Promise = require('bluebird')

aws.config.update({ region: 'ap-southeast-1' })

const API_SERVER = 'https://api.frontendmasters.com/v1/kabuki'

const getApiEndpoint = (name, { id }) =>
  API_SERVER +
  {
    courseInfo: `/courses/${id}`,
    lessonVideo: `/video/${id}/source?r=1080&f=webm`
  }[name]

const sleep = ms => value =>
  new Promise(resolve => setTimeout(() => resolve(value, ms)))

const notifyToSlack = (slack, courseId, error) =>
  request.post(slack.hook, {
    form: {
      payload: JSON.stringify({
        channel: slack.channel,
        attachments: [
          {
            color: 'danger',
            footer: 'VL',
            mrkdwn_in: ['text', 'pretext'],
            text: `Download *${courseId}* segment URLs failingly. Detail: ${error}`
          }
        ]
      })
    }
  })

const crawl = configs => {
  const { cookie, bucketName, courseId, slack } = configs
  const authenticatedOptions = {
    headers: {
      Cookie: cookie.name + '=' + cookie.value,
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3425.0 Safari/537.36',
      Origin: 'https://frontendmasters.com',
      Referer:
        'https://frontendmasters.com/courses/advanced-react-patterns/introducing-advanced-react-patterns/'
    }
  }

  const s3 = new aws.S3()

  const makeLog = logger => value => {
    console.warn(logger(value))
    return value
  }

  return fetch(getApiEndpoint('courseInfo', { id: courseId }), authenticatedOptions)
    .then(body => body.json())
    .then(makeLog(courseInfo => `Found courseName = ${courseInfo.title}`))
    .then(courseInfo => s3
        .putObject({
          Bucket: bucketName,
          Key: `${courseId}/info.json`,
          Body: JSON.stringify(courseInfo),
          ContentType: 'application/json',
          ACL: 'public-read'
        })
        .promise()
        .then(() => Promise.resolve(courseInfo)))
    .then(sleep(5000))
    .then(courseInfo =>
      Promise.mapSeries(courseInfo.lessonHashes, lessonHash =>
        fetch(
          getApiEndpoint('lessonVideo', {
            id: lessonHash
          }),
          authenticatedOptions
        )
          .then(resp => resp.json())
          .then(resp => {
            if (resp.code === 400 || !resp.url) {
              console.warn(resp)
              throw new Error('Rate limited')
            }
            return resp
          })
          .then(data => data.url)
          .then(makeLog(url => `Downloading ${url}`))
          .then(url => fetch(url))
          .then(resp => resp.buffer())
          .then(buffer =>
            s3
              .putObject({
                Bucket: bucketName,
                Key: `${courseId}/${lessonHash}.webm`,
                Body: buffer,
                ContentType: 'video/webm',
                ACL: 'public-read'
              })
              .promise()
          )
          .then(sleep(3000))
          .catch(error => {
            notifyToSlack(slack, courseId, error)
            console.warn(courseId, error)
          })
      )
    )
    .catch(error => {
      notifyToSlack(slack, courseId, error)
      console.warn(courseId, error)
    })
}

module.exports = crawl
