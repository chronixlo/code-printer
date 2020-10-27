const fs = require('fs')
const minify = require('minify')
const imageToAscii = require('image-to-ascii')
const { createCanvas } = require('canvas')
const canvas = createCanvas(1000, 10000)
const ctx = canvas.getContext('2d')
const hljs = require('highlight.js');

ctx.font = '24px monospace'
ctx.fillStyle = '#fff'

async function main() {
  const file = fs.readFileSync(require.main.filename).toString()
  
  const highlighted = hljs.highlightAuto(file).value
  // console.log(highlighted)
  const minified = (await minify(require.main.filename))
  // .replace(/;/g, ';\n')


  // <span class="hljs-keyword">const</span>
  //  fs =
  // <span class="hljs-built_in">require</span>
  // (
  // <span class="hljs-string">

  const tokenized = []
  let i = 0
  let leftover = highlighted

  while (true) {
    const nextTagIndex = leftover.indexOf('<')

    if (nextTagIndex === 0) {
      const firstIndex = leftover.indexOf('>') + 1
      const lastIndex = leftover.slice(firstIndex).indexOf('>') + 1
      const index = firstIndex + lastIndex
      const a = leftover.slice(0, index);
      const type = a.match(/class="(.*)"/)
      const content = a.match(/>(.*)</)[1]
      tokenized.push({ content, type: type && type[1] })
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

  const lines = file.split('\n')

  const rowHeight = 32

  tokenized.forEach((line, idx) => {
    ctx.fillText(line.content, 10, idx * rowHeight)
  })

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
