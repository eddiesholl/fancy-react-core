import acorn = require('acorn');
import injectAcornJsx from 'acorn-jsx/inject';
import injectAcornStaticClassPropertyInitializer from 'acorn-static-class-property-initializer/inject';

injectAcornJsx(acorn);
injectAcornStaticClassPropertyInitializer(acorn);

const defaultAcornOptions = {
  ecmaVersion: 9,
  locations: true,
  plugins: { jsx: true, staticClassPropertyInitializer: true },
  sourceType: 'module',
};

export const parse = (input: string) => {
  const comments = [];
  const tokens = [];
  const result = acorn.parse(
    input,
    {
      ...defaultAcornOptions,
      onComment: comments,
      onToken: tokens,
      ranges: true,
    });

  return {
    ...result,
    comments,
    tokens,
  };
};
