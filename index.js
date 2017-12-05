const fs = require('fs');
const path = require('path');
const babylon = require('babylon');

const nativeModule = {
  assert: 1,
  buffer: 1,
  child_process: 1,
  cluster: 1,
  crypto: 1,
  dgram: 1,
  dns: 1,
  events: 1,
  fs: 1,
  http: 1,
  https: 1,
  net: 1,
  os: 1,
  path: 1,
  process: 1,
  querystring: 1,
  readline: 1,
  repl: 1,
  stream: 1,
  string_decoder: 1,
  tls: 1,
  tty: 1,
  url: 1,
  util: 1,
  v8: 1,
  vm: 1,
  zlib: 1
};

function isNativeModel(m) {
  return nativeModule[m];
}

/**
 * Get deps
 * return the list the file require
 * @param filepath
 */
function Get(filepath) {
  if (!path.isAbsolute(filepath)) {
    filepath = path.join(process.cwd(), filepath);
  }

  const raw = fs.readFileSync(filepath, 'utf8');

  return GetFromRaw(raw);
}

function tokenParser(token) {
  let deps = [];

  // example: function(){ require('http') }
  if (token.type === 'FunctionDeclaration') {
    const nestBody = token.body.body;
    for (let i = 0; i < nestBody.length; i++) {
      const t = nestBody[i];
      deps = deps.concat(tokenParser(t));
    }
  }

  // example: require('http')
  if (
    token.type === 'ExpressionStatement' &&
    token.expression.type === 'CallExpression' &&
    token.expression.callee.name === 'require'
  ) {
    const dep = token.expression.arguments[0];

    if (!dep) {
      throw new Error(`require(${dep.value}) is not allow!`);
    }

    switch (dep.type) {
      case 'StringLiteral':
        deps.push(dep.value);
        return deps;
        break;
      case 'BinaryExpression':
        // not support dynamic loading
        // example: require(path.join(process.cwd(), 'index.js'))
        break;
      default:
        break;
    }
  }

  // example: var http = require('http');
  if (
    token.type === 'VariableDeclaration' &&
    (token.kind === 'const' || token.kind === 'var' || token.kind === 'let')
  ) {
    const declarations = token.declarations;

    declarations
      .filter(v => v.type === 'VariableDeclarator') // var xxx
      .filter(v => v.init.type === 'CallExpression')
      .filter(v => v.init.callee.name === 'require') // require('http');
      .forEach(VariableDeclarator => {
        const dep = VariableDeclarator.init.arguments[0];
        if (!dep) {
          throw new Error(`require(${dep.value}) is not allow!`);
        }
        deps.push(dep.value);
      });
    return deps;
  }

  // example: import { EventEmitter } from 'events';
  if (token.type === 'ImportDeclaration') {
    deps.push(token.source.value);
  }
  return deps;
}

function GetFromRaw(jsRawCode, filepath = '') {
  let deps = [];
  const ast = babylon.parse(jsRawCode, {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    sourceFilename: path.basename(filepath),
    plugins: []
  });

  ast.program.body.forEach(token => {
    const d = tokenParser(token);
    deps = deps.concat(d);
  });

  return deps.map(v => {
    if (path.isAbsolute(v)) {
      return v;
    } else if (v.indexOf('.') === 0) {
      return path.join(path.dirname(filepath), v);
    } else if (isNativeModel(v)) {
      return v;
    } else {
      return v;
    }
  });
}

module.exports = Get;
module.exports.Get = Get;
module.exports.default = Get;
module.exports.GetFromRaw = GetFromRaw;
