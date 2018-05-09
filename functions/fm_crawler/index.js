const crawl = require('./crawl')

exports.handle = function(event, ctx, cb) {
  console.log('processing event: %j', event)
  crawl(event).then(() => {
    cb(null, { success: true })
  })
}
