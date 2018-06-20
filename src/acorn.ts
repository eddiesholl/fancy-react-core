import acorn = require('acorn');
import injectAcornJsx from 'acorn-jsx/inject';
import injectAcornStaticClassPropertyInitializer from 'acorn-static-class-property-initializer/inject';
import { ParseResult } from './tree-view';

injectAcornJsx(acorn);
injectAcornStaticClassPropertyInitializer(acorn);

const defaultAcornOptions = {
  ecmaVersion: 9,
  locations: true,
  plugins: { jsx: true, staticClassPropertyInitializer: true },
  sourceType: 'module',
};

export const parse = (input: string): ParseResult => {
  const comments = [];
  const tokens = [];

  try {
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
  } catch {
    return undefined;
  }
};
