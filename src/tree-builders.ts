import e, {
  ArrowFunctionExpression,
  AssignmentExpression,
  CallExpression,
  Class,
  Expression,
  Function,
  FunctionExpression,
  Identifier,
  MemberExpression,
  VariableDeclaration,
} from 'estel-estree-builder/generated/es2015';

import R from 'ramda';

import { isString, mergeArrays, noNulls, pad } from './utils';

export const arrow = (...body): ArrowFunctionExpression => {
  return e.arrowFunctionExpression(e.functionBody(noNulls(body)), []);
};

export const callFn = (callee, args): CallExpression => {
  return e.callExpression(isString(callee) ? e.identifier(callee) : callee, args || []);
};

export const buildBeforeEach = (propDefs) => {
  const mocks = propDefs.map((p) => {
    return e.assignmentExpression('=', e.identifier(p.mockName), p.mockVal);
  });
  return callFn('beforeEach', [
    arrow(
      ...mocks,
    ),
  ]);
};

const space = (c) => R.repeat(' ', c).join('');
const s6 = space(6);
const s8 = space(8);
const propPad = `\n${s8}`;

export const buildRenderFunc = (name, propTypes = []): Function => { // tslint:disable-line
  const propAssigns = propTypes.map((p) => {
    return `${p.propName}={${p.mockName}}`;
  }).join(propPad);
  const propAssignsWithPad = propAssigns ? `${propPad}${propAssigns}${propPad}` : ' ';

  return e.functionDeclaration(
    e.identifier('renderComponent'),
    [e.identifier('props')],
    e.functionBody([
      e.assignmentExpression(
        '=',
        e.identifier('props'),
        e.logicalExpression('||', e.identifier('props'), e.objectExpression([]))),
      // return render(<Foo a=a, b=b, {...props})
      e.returnStatement(
        callFn(
          'shallow',
          [e.identifier(`
${s6}<${name}${propAssignsWithPad}{...props} />`)])),
    ]),
  );
};

export const buildItBlock = (desc, expressions: Expression[]) => {
  return callFn(
    'it',
    [e.literal(desc), e.arrowFunctionExpression(e.functionBody(expressions), [])]);
};

export const buildClass = (className: string, superClass: string, methods): Class => {
  const methodDefs = Object.keys(methods).map((k) => {
    const def = methods[k];
    return e.methodDefinition(e.identifier(k), def, 'get');
  });
  return e.class(e.classBody(methodDefs), "ClassDeclaration", e.identifier(className), e.identifier(superClass));
};

export const buildImportStmts = (namedImportMaps, defaultImportMaps, exportSuiteTrees?: any[]): Identifier[] => {
  const imports = {};

  if (exportSuiteTrees) {
    exportSuiteTrees.forEach((t) => {
      const sutImports = imports[t.inputModulePath] || {};
      const sutImportsNamed = sutImports.named || [];
      if (t.defaultSut) {
        sutImports.default = t.defaultSut;
      }
      if (t.namedSut) {
        sutImportsNamed.push(t.namedSut);
        sutImports.named = sutImportsNamed;
      }
      if (sutImports.named || sutImports.default) {
        imports[t.inputModulePath] = sutImports;
      }
    });
  }

  namedImportMaps.forEach((curr) => {
    Object.keys(curr).forEach((k) => {
      const namedList = curr[k];
      const existing = imports[k] || { named: [] };
      const prevList = existing.named || [];
      existing.named = mergeArrays(namedList, prevList);
      imports[k] = existing;
    });
  });

  defaultImportMaps.forEach((curr) => {
    Object.keys(curr).forEach((k) => {
      const defaultName = curr[k];
      const existing = imports[k] || {};
      existing.default = defaultName;
      imports[k] = existing;
    });
  });

  const importStmts = Object.keys(imports).map((p) => {
    const i = imports[p];
    const named = i.named;
    const namedBrackets = named ? `{ ${named.join(', ')} } ` : '';
    const def = pad(i.default, named ? ',' : '');
    return e.identifier(`import${def}${namedBrackets}from '${p}'`);
  });

  return importStmts;
};

export const dot = (target, prop): MemberExpression => {
  return e.memberExpression(target, e.identifier(prop));
};

export const assign = (left, right): AssignmentExpression => {
  return e.assignmentExpression('=', left, right);
};

export const fnArgs = (args, ...rest): FunctionExpression => {
  return e.functionExpression(args, e.functionBody(noNulls(rest)));
};

export const fn = (...body) => {
  return fnArgs([], body);
};

export const vr = (name, val): VariableDeclaration => {
  return e.variableDeclaration([e.variableDeclarator(e.identifier(name), val)], "var");
};

export const cnst = (name, val): VariableDeclaration => {
  return e.variableDeclaration([e.variableDeclarator(e.identifier(name), val)], "const");
};

export const lt = (name, val = undefined): VariableDeclaration => {
  return e.variableDeclaration([e.variableDeclarator(e.identifier(name), val)], "let");
};

export const raw = e.identifier;
