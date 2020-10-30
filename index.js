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
  
  const highlighted = hljs.highlightAuto(file).value

  const minified = (await minify(require.main.filename))
  // .replace(/;/g, ';\n')

  const split = highlighted.split('\n')
  const all = []

  split.forEach(row => {
    const tokenized = []
    let i = 0
    let leftover = row

    while (true) {
      const nextTagIndex = leftover.indexOf('<')

      if (nextTagIndex === 0) {
        const firstIndex = leftover.indexOf('>') + 1
        const lastIndex = leftover.slice(firstIndex).indexOf('>') + 1
        const index = firstIndex + lastIndex
        const a = leftover.slice(0, index);
        const type = a.match(/class="(.*)"/)
        const content = entities.decode(a.match(/>(.*)</)[1])
        tokenized.push({ content, type: type && type[1].replace('hljs-', '') })
        i = index
      } else {
        tokenized.push({ content: leftover.slice(0, nextTagIndex) })
        if (nextTagIndex === -1) {
          break
        }
        i = nextTagIndex
      }
      leftover = leftover.slice(i)
      if (!leftover.length) {
        break;
      }
    }

    all.push(tokenized)
  })

  const rowHeight = 32

  const types = {}

  const longestLine = 100

  const width = longestLine * 16
  const height = all.length * rowHeight
  
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.font = '24px monospace'
  ctx.fillStyle = '#1e1e1e'
  ctx.fillRect(0, 0, width, height)

  all.forEach((row, idx) => {
    let col = 0;
    row.forEach((line) => {
      types[line.type] = 1
      if (line.type) {
        ctx.fillStyle = COLORS[line.type] || '#ccc'
      } else {
        ctx.fillStyle = '#fff'
      }
      ctx.fillText(line.content, 10 + col * 16, idx * rowHeight)
      col += line.content.length
    })
  })

  console.log(Object.keys(types))

  canvas.toBuffer((err, buf) => {
    if (err) {
      throw err
    }
    fs.writeFileSync(__dirname + '/result.jpg', buf);
  }, 'image/jpeg', { quality: 0.95 })
}

main()

// imageToAscii("https://octodex.github.com/images/octofez.png", (err, converted) => {
//   console.log(err || converted);
// });
