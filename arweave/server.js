const Arweave = require('arweave')
const fetch = require('node-fetch')
const {
  DOC_TYPE,
  DOC_REF,
  SIG_NAME,
  SIG_HANDLE,
  SIG_ADDR,
  SIG_ISVERIFIED,
  SIG_SIG,
  VERIFICATION_HANDLE,
  VERIFICATION_ADDR,
} = require('./config')

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: false,
})

const ADMIN_ADDR = process.env.ARWEAVE_ADDRESS
const KEY = JSON.parse(process.env.ARWEAVE_KEY)

async function checkIfVerifiedAr(handle, address) {
  const req = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
      query {
        transactions(
          tags: [
            {
              name: "${DOC_TYPE}",
              values: ["verification"]
            }
          ],
          owners: ["${ADMIN_ADDR}"]
        ) {
          edges {
            node {
              id
              owner {
                address
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
      `
    })
  })

  const json = await req.json()
  for (const edge of json.data.transactions.edges) {
    const n = edge.node
    if (n.owner.address === ADMIN_ADDR) {
      const parsedHandle = n.tags.find(tag => tag.name === VERIFICATION_HANDLE).value
      const parsedAddress = n.tags.find(tag => tag.name === VERIFICATION_ADDR).value
      if (handle === parsedHandle && address === parsedAddress) {
        return n.id
      }
    }
  }
  return false
}

async function persistVerificationAr(handle, address) {
  let transaction = await arweave.createTransaction({
    data: handle
  }, KEY)
  transaction.addTag(DOC_TYPE, 'verification')
  transaction.addTag(VERIFICATION_HANDLE, handle)
  transaction.addTag(VERIFICATION_ADDR, address)
  await arweave.transactions.sign(transaction, KEY)
  return {
    ...await arweave.transactions.post(transaction),
    id: transaction.id,
  }
}

async function signDocumentAr(documentId, address, name, handle, signature, isVerified) {
  let transaction = await arweave.createTransaction({ data: address }, KEY)
  transaction.addTag(DOC_TYPE, 'signature')
  transaction.addTag(DOC_REF, documentId)
  transaction.addTag(SIG_NAME, name)
  transaction.addTag(SIG_HANDLE, handle)
  transaction.addTag(SIG_ADDR, address)
  transaction.addTag(SIG_SIG, signature)
  transaction.addTag(SIG_ISVERIFIED, isVerified)
  await arweave.transactions.sign(transaction, KEY)
  return await arweave.transactions.post(transaction)
}

async function publishStatement(data) {
  let transaction = await arweave.createTransaction({ data }, KEY)
  transaction.addTag(DOC_TYPE, 'statement')
  await arweave.transactions.sign(transaction, KEY)
  return await arweave.transactions.post(transaction)
}

module.exports = {
  checkIfVerifiedAr,
  persistVerificationAr,
  signDocumentAr,
  publishStatement
}
