const {checkIfVerifiedAr, persistVerificationAr, signDocumentAr} = require("../../../arweave/server")
const {sigCache} = require("../_common")

// post: include name, address (from MM), handle
export default function handler(req, res) {
  const documentId = req.query.document
  const {
    name,
    address,
    handle,
    signature,
  } = req.body

  // did the user include a handle?
  if (handle) {
    // check if user is verified
    const promise = sigCache.has(handle) ?
      signDocumentAr(documentId, address, name, handle, signature, true) :
      checkIfVerifiedAr(handle, signature).then(result => {
        const verified = !!result
        return signDocumentAr(documentId, address, name, handle, signature, verified)
      })

    return promise
      .then((data) => {
        console.log(`new signee: ${name}, @${handle}, ${address}`)
        res.json(data)
      })
      .catch(e => {
        console.log(`err @ /sign/:document : ${e}`)
        res.status(500)
      });
  } else {
    // pure metamask sig
    return signDocumentAr(documentId, address, name, '', signature, false)
      .then((data) => {
          res.json(data)
      })
      .catch(e => {
        console.log(`err @ /sign/:document : ${e}`)
        res.status(500)
      })
  }
}
