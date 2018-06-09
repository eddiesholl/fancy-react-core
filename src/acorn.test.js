const { parse } = require('./acorn');

describe('parse', () => {
  it('handles empty input', () => {
    expect(parse('')).toEqual({
      comments: []
    })
  })
})
