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
  let emptyMap
  beforeEach(() => {
    emptyMap = new Map();
  })

  describe('when the prop is a simple definition', () => {
    it('extracts the prop', () => {
      expect(extractProp(simpleDefinition, emptyMap)).toEqual({
        default: undefined,
        optional: false,
        name: 'propName',
        type: 'func',
      })
    })
  })

  describe('when the prop is optional', () => {
    it('extracts the prop', () => {
      expect(extractProp(optionalDefinition, emptyMap)).toEqual({
        default: undefined,
        optional: true,
        name: 'propName',
        type: 'node',
      })
    })
  })

  describe('when the prop type is complex', () => {
    it('extracts the prop', () => {
      expect(extractProp(callDefinition, emptyMap)).toEqual({
        default: undefined,
        optional: false,
        name: 'propName',
        type: 'PropTypes.oneOf(arg0)',
      })
    })
  })

  describe('when the prop has a default', () => {
    let mapWithFoo
    beforeEach(() => {
      mapWithFoo = new Map();
      mapWithFoo.set('propName', 'foo');
    })
    it('grabs the default', () => {
      expect(extractProp(callDefinition, mapWithFoo)).toEqual({
        default: 'foo',
        optional: false,
        name: 'propName',
        type: 'PropTypes.oneOf(arg0)',
      })
    })
  })
})
