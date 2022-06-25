require('dotenv').config()
const fetch = require('node-fetch')
const config = require('../arweave/config')
const { stringify } = require('csv-stringify')

const jsonOrErrorHandler = async response => {
  const resp = response.json()
  if (response.ok) {
    return resp;
  }

  if (resp) {
    const error = await resp
    throw new Error(error.message ?? error.errors[0].message)
  } else {
    throw new Error('Internal server error')
  }
}

async function query(txId, prevTx) {
  return await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
      query {
        transactions(
          first: 100,
          sort: HEIGHT_ASC,
          ${prevTx ? `after: "${prevTx}",` : ''}
          tags: [
            {
              name: "${config.DOC_TYPE}",
              values: ["signature"]
            },
            {
              name: "${config.DOC_REF}",
              values: ["${txId}"]
            }
          ],
          owners: ["${config.ADMIN_ACCT}"],
        ) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              tags {
                name
                value
              }
              block {
                  id
                  timestamp
                  height
              }
            }
          }
        }
      }
      `
    })
  }).then(jsonOrErrorHandler);
}

async function fetchSignatures(txId) {
  let completed = false
  let transactions = []
  let prevTx = undefined
  while (!completed) {
    let req = await query(txId, prevTx)
    if (req.data.transactions.pageInfo.hasNextPage) {
      prevTx = req.data.transactions.edges[req.data.transactions.edges.length - 1].cursor
    } else {
      completed = true
    }
    transactions = transactions.concat(req.data.transactions.edges)
  }

  const safeTag = (node, tagName, defaultValue) => {
    const tag = node.tags.find(tag => tag.name === tagName)
    return tag ? tag.value : defaultValue;
  }

  return transactions.flatMap(nodeItem => {
    const n = nodeItem.node;

    return [{
      txId: n.id,
      address: safeTag(n, config.SIG_ADDR, "UNKWN"),
      name: safeTag(n, config.SIG_NAME, "Anonymous"),
      handle: safeTag(n, config.SIG_HANDLE, "UNSIGNED") ,
      isVerified: safeTag(n, config.SIG_ISVERIFIED, 'false') === 'true',
      signature: safeTag(n, config.SIG_SIG, "UNKWN"),
      date: new Date(n.block.timestamp * 1000)
    }];
  });
}

fetchSignatures(config.CANONICAL_TX_ID).then(async (signatures) => {
  stringify(signatures, {
    header: true,
    columns: {
      name: 'Name',
      address: 'Address',
      signature: 'Signature',
      date: 'Date'
    },
    cast: {
      date: (v) => v.toISOString()
    }
  }).pipe(process.stdout)
})