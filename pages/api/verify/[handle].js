const Twitter = require('twitter')
const {checkIfVerifiedAr, persistVerificationAr, signDocumentAr} = require("../../../arweave/server")
const {sigCache} = require("../_common")

const TWEET_TEMPLATE = "I am verifying for @verses_xyz: sig:"

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  bearer_token: process.env.BEARER_TOKEN
})


// post: include address (from MM)
export default function handler(req, res) {
  const handle = req.query.handle
  const {
    address: signature,
  } = req.body

  if (sigCache.has(handle)) {
    console.log(`already verified user: @${handle}`)
    const txId = sigCache.get(handle)
    res.json({ tx: txId })
    return
  }

  client.get('statuses/user_timeline', {
    screen_name: handle,
    include_rts: false,
    count: 5,
    tweet_mode: 'extended',
  }, (error, tweets, response) => {

    if (!error) {
      for (const tweet of tweets) {
        const parsedSignature = tweet.full_text.slice(TWEET_TEMPLATE.length).split(" ")[0];
        if (tweet.full_text.startsWith(TWEET_TEMPLATE) && (parsedSignature === signature)) {
          // check to see if already linked

          checkIfVerifiedAr(handle, signature)
            .then(result => {
              if (result) {
                // already linked
                console.log(`already verified user: @${handle}`)
                sigCache.set(handle, result)
                res.json({ tx: result })
              } else {
                // need to link
                persistVerificationAr(handle, signature)
                  .then((tx) => {
                    console.log(`new verified user: @${handle}, ${signature}`)
                    sigCache.set(handle, tx)
                    res.status(201).json(tx)
                  })
                  .catch(e => {
                    console.log(`err @ /verify/:handle : ${e}`)
                    res.status(500).send(JSON.stringify(e))
                  });
              }
            });
          return
        }
      }
      res.status(500).json({message: 'No matching Tweets found'})
    } else {
      res.status(500).send({message: 'Internal Error'})
    }
  })
}
