const { parse } = require('./acorn');

describe('parse', () => {
  describe('handling empty input', () => {
    let output

    beforeEach(() => {
      output = parse('')
    })

    it('get no comments', () => {
      expect(output.comments).toEqual([])
    })

    it('gets no body', () => {
      expect(output.body).toEqual([])
    })
  })
})
