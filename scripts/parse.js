const { parse } = require('../lib/acorn');
const { printNode } = require('../lib/node-ops');
const fs = require('fs');
const path = require('path');

const input = fs.readFileSync(path.join(__dirname, 'parse-subject.js'));

const output = parse(input);

printNode(output)
