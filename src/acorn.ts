import acorn = require('acorn');
import injectAcornJsx from 'acorn-jsx/inject';
import injectAcornObjectSpreadJsx from 'acorn-object-spread/inject';
import injectAcornStaticClassPropertyInitializer from 'acorn-static-class-property-initializer/inject';

injectAcornJsx(acorn);
injectAcornStaticClassPropertyInitializer(acorn);
injectAcornObjectSpreadJsx(acorn);

const defaultAcornOptions = {
  ecmaVersion: 6,
  locations: true,
  plugins: { jsx: true, staticClassPropertyInitializer: true, objectSpread: true },
  sourceType: 'module',
};

export const parse = (input) => {
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
