const λ = require('apex.js')
const crawl = require('./crawl')

exports.handle = λ(async event => {
  await crawl(event)
  return { success: true }
})
