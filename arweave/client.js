// Arweave and Ethereum signing utilities.
import Arweave from 'arweave';
import {ethers} from "ethers";
import {
  ADMIN_ACCT,
  DOC_TYPE,
  DOC_REF,
  SIG_NAME,
  SIG_HANDLE,
  SIG_ADDR,
  SIG_ISVERIFIED,
  SIG_SIG
} from './config';

function init() {
  return Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
  });
}

const arweave = init();

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000/api";

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

export async function generateSignature(statement) {
  if (!window.ethereum) {
    throw new Error("No wallet found. Please install Metamask or another Web3 wallet provider.");
  }

  // Sign the statement. Any errors here should be handled by the caller.
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return await signer.signMessage(statement.trim())
}

const cleanHandle = handle => handle && handle[0] === "@" ? handle.substring(1) : handle;

export async function signStatement(txId, name, userProvidedHandle, statement, signature) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  // Verify the signature, and print to console for convenience
  const verifyingAddress = ethers.utils.verifyMessage(statement.trim(), signature);
  if (verifyingAddress !== address) {
    throw new Error("Signature mismatch")
  }

  const formData = new URLSearchParams({
    name,
    address,
    signature,
    handle: cleanHandle(userProvidedHandle),
  });

  await fetch(`${SERVER_URL}/sign/${txId}`, {
    method: 'post',
    body: formData,
  }).then(jsonOrErrorHandler)
}

export async function verifyTwitter(sig, handle) {
  const formData = new URLSearchParams({
    address: sig,
  });

  return fetch(`${SERVER_URL}/verify/${cleanHandle(handle)}`, {
    method: 'post',
    body: formData,
  }).then(jsonOrErrorHandler)
}

{/* 
Transactions are mined into Arweave blocks in 60 mins
So signature query order is roughly buckets by that
*/}
export async function fetchSignatures(txId, prevTx) {
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
          first: 50,
          sort: HEIGHT_ASC,
          ${prevTx ? `after: "${prevTx}",` : ''}
          tags: [
            {
              name: "${DOC_TYPE}",
              values: ["signature"]
            },
            {
              name: "${DOC_REF}",
              values: ["${txId}"]
            }
          ],
          owners: ["${ADMIN_ACCT}"],
        ) {
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

  const safeTag = (node, tagName, defaultValue) => {
    const tag = node.tags.find(tag => tag.name === tagName)
    return tag ? tag.value : defaultValue;
  }

  return req.data.transactions.edges.flatMap(nodeItem => {
    const cursor = nodeItem.cursor;
    const n = nodeItem.node;
    const sig = safeTag(n, SIG_ADDR, "UNKWN");
    const handle = safeTag(n, SIG_HANDLE, "UNSIGNED");
    const verified = safeTag(n, SIG_ISVERIFIED, 'false') === 'true'

    return [{
      CURSOR: cursor,
      SIG_ID: n.id,
      SIG_ADDR: sig,
      SIG_NAME: safeTag(n, SIG_NAME, "Anonymous"),
      SIG_HANDLE: handle === 'null' ? 'UNSIGNED' : handle,
      SIG_ISVERIFIED: verified,
      SIG_SIG: safeTag(n, SIG_SIG, "UNKWN"),
    }];
  });
}

export function dedupe(sigs) {
  const unique_set = sigs.reduce((total, cur) => {
    if (!total.hasOwnProperty(cur.SIG_ADDR)) {
      // unique addr
      total[cur.SIG_ADDR] = cur
    } else {
      const old = total[cur.SIG_ADDR]
      // dupe, can overwrite it current one is verified or old one is not verified
      if (cur.SIG_ISVERIFIED || !old.SIG_ISVERIFIED) {
        total[cur.SIG_ADDR] = cur
      }
    }
    return total
  }, {})
  return Object.values(unique_set)
}

export function sortSigs(sigs) {
  const TEAM = {
    // Add team addresses here to sort them to top
  }

  const priority = sig => {
    if (sig.SIG_ADDR in TEAM) {
      return TEAM[sig.SIG_ADDR]
    }
    return 1
  }

  return sigs.sort((a, b) => priority(a) - priority(b));
}

export async function getStatement(txId) {
  const res = {
    txId,
    data: {},
    sigs: [],
    status: 404,
  };
  const txStatus = await arweave.transactions.getStatus(txId);
  if (txStatus.status !== 200) {
    res.status = txStatus.status;
    return res;
  }

  const transactionMetadata = await arweave.transactions.get(txId);
  const tags = transactionMetadata.get('tags').reduce((prev, tag) => {
    let key = tag.get('name', {decode: true, string: true});
    prev[key] = tag.get('value', {decode: true, string: true});
    return prev;
  }, {});

  // ensure correct type, return undefined otherwise
  if (!(DOC_TYPE in tags) || !['statement'].includes(tags[DOC_TYPE])) {
    return res;
  }

  // otherwise metadata seems correct, go ahead and fetch
  const blockId = txStatus.confirmed.block_indep_hash;
  const blockMeta = await arweave.blocks.get(blockId);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const time = new Date(blockMeta.timestamp * 1000);
  const data = JSON.parse(await arweave.transactions.getData(txId, {
    decode: true,
    string: true,
  }));
  data.body = data.statement // backwards compatability

  res.data = {
    ...data,
    timestamp: time.toLocaleDateString('en-US', options)
  };

  res.status = 200;
  return res;
}