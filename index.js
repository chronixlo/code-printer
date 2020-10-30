const fs = require('fs')
const minify = require('minify')
const imageToAscii = require('image-to-ascii')
const { createCanvas } = require('canvas')
const hljs = require('highlight.js')
const { parse } = require('node-html-parser')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

const COLORS = {
  keyword: '#569CD6',
  comment: '#0b0',
  regexp: '#D16969',
  string: '#CE9178',
  number: '#0bb',
  function: '#DCDCAA',
}

async function main() {
  const file = fs.readFileSync(require.main.filename).toString()
  const minified = await minify(require.main.filename)

  const highlighted = hljs.highlightAuto(file).value

  const lines = highlighted.split('\n').map(parse)

  const rowHeight = 32

  const types = {}

  const longestLine = 100

  const width = longestLine * 16
  const height = lines.length * rowHeight

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.font = '24px monospace'
  ctx.fillStyle = '#1e1e1e'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#fff'

  let col = 0
  let row = 0

  const print = (childNodes, resetCol) => {
    if (resetCol) {
      row++
      col = 0
    }
    childNodes.forEach((childNode) => {
      if (childNode.childNodes.length) {
        print(childNode.childNodes)
        return
      }

      ctx.fillText(childNode.rawText, 10 + col * 16, row * rowHeight)
      col += childNode.rawText.length
    })
  }

  lines.forEach((line) => {
    print(line.childNodes, true)
  })

  // console.log(Object.keys(types))

  canvas.toBuffer(
    (err, buf) => {
      if (err) {
        throw err
      }
      fs.writeFileSync(__dirname + '/result.jpg', buf)
    },
    'image/jpeg',
    { quality: 0.95 },
  )
}

main()

// imageToAscii("https://octodex.github.com/images/octofez.png", (err, converted) => {
//   console.log(err || converted);
// });
