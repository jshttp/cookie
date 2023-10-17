'use strict'

/* Generate the ESM version of the library by prepending an export statement
 * Makes the following assumptions about index.js:
 * - that `parse` and `serialize` are functions that get hoisted
 * - the CJS file references `exports`, not `module.exports`
 *
 * Although modules use strict mode by default,
 * this script does not remove the 'use strict' pragma.
 */

var fs = require('fs')
var path = require('path')

var srcFile = path.join(__dirname, '../index.js')
var destFile = path.join(__dirname, '../index.mjs')

var cjsCode = fs.readFileSync(srcFile, 'utf-8')
var esmCode =  `const exports = {}
export {
  parse,
  serialize,
  exports as default
}

${cjsCode}`

fs.writeFileSync(destFile, esmCode);
