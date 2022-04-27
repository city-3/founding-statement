require('dotenv').config()

const { publishStatement } = require('../pages/api/_arweave')

const transaction = publishStatement(JSON.stringify({
  statement: "This is a test statement"
}))