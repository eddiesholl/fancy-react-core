const { extractProp, PropStyle } = require("./tree-view");

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

const reduxEmpty = {
  connected: false,
  funcNames: [],
  returnedPropNames: [],
  subject: '',
};

describe('extractProp', () => {
  let emptyMap
  beforeEach(() => {
    emptyMap = new Map();
  })

  describe('when the prop is a simple definition', () => {
    it('extracts the prop', () => {
      expect(extractProp(simpleDefinition, emptyMap, reduxEmpty)).toEqual({
        default: undefined,
        optional: false,
        name: 'propName',
        style: PropStyle.Input,
        type: 'func',
      })
    })
  })

  describe('when the prop is optional', () => {
    it('extracts the prop', () => {
      expect(extractProp(optionalDefinition, emptyMap, reduxEmpty)).toEqual({
        default: undefined,
        optional: true,
        name: 'propName',
        style: PropStyle.Input,
        type: 'node',
      })
    })
  })

  describe('when the prop type is complex', () => {
    it('extracts the prop', () => {
      expect(extractProp(callDefinition, emptyMap, reduxEmpty)).toEqual({
        default: undefined,
        optional: false,
        name: 'propName',
        style: PropStyle.Input,
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
      expect(extractProp(callDefinition, mapWithFoo, reduxEmpty)).toEqual({
        default: 'foo',
        optional: false,
        name: 'propName',
        style: PropStyle.Input,
        type: 'PropTypes.oneOf(arg0)',
      })
    })
  })
})
