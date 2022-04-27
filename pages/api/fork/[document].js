const {forkDocumentAr} = require("../_arweave")

export default function handler(req, res) {
  const documentId = req.params.document // if undefined, create new document
  const {
    authors,
    text,
    title,
  } = req.body

  const totalSize = [authors, text, title]
    .map(arg => arg || "")
    .map(txt => Buffer.from(txt).byteLength)
    .reduce((size, total) => size + total, 0)

  if (totalSize >= (2 << 22)) {
    res.status(400).json({ status: "too large"})
    return
  }

  forkDocumentAr(documentId, text, title, authors)
    .then((data) => res.json(data))
    .catch(e => {
      console.log(`err @ /fork/:document : ${e}`)
      res.status(500)
    })
}
