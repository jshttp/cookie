var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn

var exe = process.argv[0]
var cwd = process.cwd()

for (var dep in process.versions) {
  console.log('  %s@%s', dep, process.versions[dep])
}

console.log('')

runScripts(fs.readdirSync(__dirname))

function runScripts (fileNames) {
  var fileName = fileNames.shift()

  if (!fileName) return
  if (!/\.js$/i.test(fileName)) return runScripts(fileNames)
  if (fileName.toLowerCase() === 'index.js') return runScripts(fileNames)

  var fullPath = path.join(__dirname, fileName)

  console.log('> %s %s', exe, path.relative(cwd, fullPath))

  var proc = spawn(exe, [fullPath], {
    'stdio': 'inherit'
  })

  proc.on('exit', function () {
    runScripts(fileNames)
  })
}
