const fs = require('fs')
const minify = require('minify')
const imageToAscii = require('image-to-ascii')
const { createCanvas } = require('canvas')
const hljs = require('highlight.js')
const { parse } = require('node-html-parser')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()
const cssParser = require('css')

async function main() {
  const css = fs
    .readFileSync('node_modules/highlight.js/styles/androidstudio.css')
    .toString()

  const json = cssParser.parse(css)

  const getBackgroundColor = (selector) => {
    const rule = json.stylesheet.rules.find(
      (rule) => rule.type === 'rule' && rule.selectors.includes('.hljs'),
    )
    const color =
      rule && rule.declarations.find((dec) => dec.property === 'background')
    if (!color) {
      return
    }
    return color.value
  }

  const getColor = (selector) => {
    const rule = json.stylesheet.rules.find(
      (rule) => rule.type === 'rule' && rule.selectors.includes('.' + selector),
    )
    const color =
      rule && rule.declarations.find((dec) => dec.property === 'color')
    if (!color) {
      return
    }
    return color.value
  }

  const file = fs.readFileSync(require.main.filename).toString()
  const minified = await minify(require.main.filename)

  const highlighted = hljs.highlightAuto(file).value

  const lines = highlighted.split('\n').map(parse)

  const rowHeight = 32

  const longestLine = 100

  const width = longestLine * 16
  const height = lines.length * rowHeight

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const defaultColor = getColor('hljs')

  ctx.font = '24px monospace'
  ctx.fillStyle = getBackgroundColor()
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = defaultColor

  let col = 0
  let row = 0

  const print = (childNodes, parentNode, resetCol) => {
    if (resetCol) {
      row++
      col = 0
    }
    childNodes.forEach((childNode) => {
      if (childNode.childNodes.length) {
        print(childNode.childNodes, childNode)
        return
      }

      const text = entities.decode(childNode.rawText)
      const color = getColor(parentNode.classNames[0])

      if (color) {
        ctx.fillStyle = color
      } else {
        ctx.fillStyle = defaultColor
      }
      ctx.fillText(text, 10 + col * 14, row * rowHeight)
      col += text.length
    })
  }

  lines.forEach((line) => {
    print(line.childNodes, line, true)
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
