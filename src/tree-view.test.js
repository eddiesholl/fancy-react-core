const { extractProp } = require("./tree-view");

const simpleDefinition = {
  type: 'Property',
  key: {
    type: 'Identifier',
    name: 'propName'
  },
  value: {
    type: 'MemberExpression',
    object: {
      type: 'MemberExpression',
      property: {
        type: 'Identifier',
        name: 'func'
      }
    },
    property: {
      name: 'isRequired',
      type: 'Identifier'
    }
  }
};
const optionalDefinition = {
  type: 'Property',
  key: {
    type: 'Identifier',
    name: 'propName'
  },
  value: {
    type: 'MemberExpression',
    object: {
      name: 'PropTypes',
      type: 'Identifier',
    },
    property: {
      name: 'node',
      type: 'Identifier'
    }
  }
};
const callDefinition = {
  type: 'Property',
  key: {
    type: 'Identifier',
    name: 'propName'
  },
  value: {
    type: 'CallExpression',
    arguments: [{
      type: 'Identifier',
      name: 'arg0'
    }],
    callee: {
      type: 'MemberExpression',
      object: {
        name: 'PropTypes',
        type: 'Identifier'
      },
      property: {
        type: 'Identifier',
        name: 'oneOf',
      }
    }
  }
}

describe('extractProp', () => {
  describe('when the prop is a simple definition', () => {
    it('extracts the prop', () => {
      expect(extractProp(simpleDefinition)).toEqual({
        default: undefined,
        optional: false,
        name: 'propName',
        type: 'func',
      })
    })
  })

  describe('when the prop is optional', () => {
    it('extracts the prop', () => {
      expect(extractProp(optionalDefinition)).toEqual({
        default: undefined,
        optional: true,
        name: 'propName',
        type: 'node',
      })
    })
  })

  describe('when the prop type is complex', () => {
    it('extracts the prop', () => {
      expect(extractProp(callDefinition)).toEqual({
        default: undefined,
        optional: false,
        name: 'propName',
        type: 'PropTypes.oneOf(arg0)',
      })
    })
  })
})
