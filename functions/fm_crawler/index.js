import λ from 'apex.js'
const crawl = require('./crawl')

exports.handle = λ(event => {
  await crawl(event)
  return { success: true }
}
