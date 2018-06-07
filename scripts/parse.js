const { parse } = require('../lib/acorn');
const { printNode } = require('../lib/node-ops');

const input = `    var {a, b} = this.props;`

const output = parse(input);

printNode(output)
