import e, { CallExpression, ExportNamedDeclaration, Node } from 'estel-estree-builder/generated/es2015';
import R from 'ramda';

import { parse } from './acorn';
import {
  byType,
  filterByType,
  searchByIdName,
  searchBySuperClass,
  searchByType,
  // printNode,
  searchForPropTypes,
} from './node-ops';
import {
  arrow,
  buildBeforeEach,
  buildImportStmts,
  buildItBlock,
  buildRenderFunc,
  callFn,
  cnst,
  dot,
  lt,
} from './tree-builders';
import { noNulls } from './utils';

const { genJs, genJsList } = require('./js-gen');

interface IBuilderOptions {
  exportName: string;
  inputModulePath: string;
  isDefaultExport: boolean;
}

interface IBuilderResult {
  namedSut: string;
  suite: Node;
}

interface ITestSuite {
  namedSut: string;
  suite: Node;
  defaultSut: string;
  inputModulePath: string;
}

const varDecName = (vd) => {
  return vd && vd.id && vd.id.name;
};

export const letForPropTypes = (propDefs) => {
  if (propDefs && propDefs.map) {
    return propDefs.map((p) => p.mockVar);
  }
};

export const jestMockFn = callFn(dot(e.identifier('jest'), 'fn'), []);
const stringMock = (n) => e.literal(n + 'MockValue');

export const propTypeToMock = {
  func: () => jestMockFn,
  number: () => e.literal(1),
  object: () => e.objectExpression([]),
};

const propTypeMockName = (name, type) => {
  if (type === 'func') {
    return name + 'Mock';
  } else {
    return name + 'MockData';
  }
};
export const processPropTypes = (propDefs) => {
  if (propDefs && propDefs.map) {
    return propDefs.map((p) => {
      const propName = p.key.value || p.key.name;
      const propTypeName = p.value.property.name;
      const propTypeType =
        propTypeName === 'isRequired' ?
          p.value.object.property.name :
          propTypeName;
      const mockName = propTypeMockName(propName, propTypeType);
      const mockGen = propTypeToMock[propTypeType] || stringMock;
      const mockVal = mockGen(propName);

      return {
        mockName,
        mockVal,
        mockVar: lt(mockName),
        propName,
      };
    });
  } else {
    return [];
  }
};

const buildSuiteForClassBased = (classComponentNode, builderOptions, allNodes) => {
  // allNodes.map(n => printNode(n))
  const className = varDecName(classComponentNode);
  const generateResult = cnst(
    'result',
    callFn('renderComponent', []));
  const expectResult = callFn('expect', [e.identifier('result')]);
  const checkResult = callFn(
    dot(dot(dot(expectResult, 'to'), 'deep'), 'equal'), [e.identifier('result')]);

  const propTypes = searchForPropTypes(allNodes, className);
  const propTypeOutputs = processPropTypes(propTypes);
  const beforeEach = buildBeforeEach(propTypeOutputs);

  const suite = callFn(
    e.identifier('describe'),
    [
      e.literal(`render ${className}`),
      arrow(
        ...letForPropTypes(propTypeOutputs),
        beforeEach,
        buildRenderFunc(className, propTypeOutputs),
        buildItBlock('can render', [generateResult, checkResult])),
    ]);

  return {
    defaultDepImports: {
      react: 'React',
    },
    namedDepImports: {
      chai: ['expect'],
      enzyme: ['shallow'],
    },
    namedSut: className,
    suite,
  };
};

const buildSuiteForJsx = (exportNode, { exportName }) => {
  const generateResult = cnst('result', callFn('renderComponent', [e.identifier(exportName)]));
  const expectResult = callFn('expect', [e.identifier('result')]);
  const checkResult = callFn(
    dot(dot(expectResult, 'to'), 'deepEqual'), [e.identifier('result')]);

  const suite = callFn(
    'describe',
    [
      e.literal(`render ${exportName}`),
      arrow(
        buildRenderFunc(exportName),
        buildItBlock('can render', [generateResult, checkResult])),
    ]);

  return {
    namedSut: exportName,
    suite,
  };
};

const buildSuiteForMapStateToProps = (exportNode, { exportName }) => {
  const generateResult = cnst(
    'result',
    callFn(
      exportName,
      [e.identifier('state')],
    ),
  );

  const suite = callFn(
    'describe',
    [
      e.literal(exportName),
      arrow(
        buildItBlock('can render', [generateResult]),
      ),
    ],
  );

  return {
    namedSut: exportName,
    suite,
  };
};

const buildSuiteForBasicFunc = (exportNode: Node, { exportName }: IBuilderOptions): IBuilderResult => {
  const generateResult = cnst('result', callFn(exportName, []));
  const expectResult = callFn('expect', [e.identifier('result')]);
  const checkResult = callFn(
    dot(dot(expectResult, 'to'), 'deepEqual'), [e.objectExpression([])]);

  const suite = callFn(
    'describe',
    [
      e.literal(exportName),
      arrow(buildItBlock('works', [generateResult, checkResult])),
    ]);

  return {
    namedSut: exportName,
    suite,
  };
};

const addSut = (
  builderResult: IBuilderResult,
  { isDefaultExport, exportName, inputModulePath }: IBuilderOptions,
): ITestSuite => {
  const sutName = exportName || builderResult.namedSut;
  const namedSut = isDefaultExport ? null : sutName;
  const defaultSut = isDefaultExport ? sutName : null;

  return {
    ...builderResult,
    defaultSut,
    inputModulePath,
    namedSut,
  };
};

// REVISIT: The exportNode should be the content of exportNode.declaration, to iterate multi export statements
// Right now it only catches the first one
const buildSuiteFor = (exportNode: ExportNamedDeclaration, allNodes, inputModulePath): ITestSuite | undefined => {
  const exportDecl = exportNode.declaration as any;
  const isTransitiveExport = exportDecl.type === 'Identifier';
  const declaringNode =
    isTransitiveExport ?
      searchByIdName(allNodes, exportDecl.name) :
      exportNode;

  // Bail out if the export is for something wrapped in a call to connect
  // This implies its a connected component and it can't be tested
  // This *could* be applied to anything that is a wrapped export
  if (exportDecl.callee &&
      exportDecl.callee.callee &&
      exportDecl.callee.callee.name === 'connect') {
    return;
  }

  // printNode(exportNode, 0)
  const varDec = searchByType(declaringNode, "VariableDeclarator");
  const classComponentNode = searchBySuperClass(declaringNode, "Component");
  const exportName = varDecName(classComponentNode || varDec);
  const hasJsx = searchByType(declaringNode, "JSXElement");
  const arrowFunc = searchByType(declaringNode, "ArrowFunctionExpression");

  const builderOptions = {
    exportName,
    inputModulePath,
    isDefaultExport: exportNode.type === "ExportDefaultDeclaration",
  };

  let builderResult;
  if (exportName === 'mapStateToProps') {
    builderResult = buildSuiteForMapStateToProps(exportNode, builderOptions);
  } else if (classComponentNode) {
    builderResult = buildSuiteForClassBased(classComponentNode, builderOptions, allNodes);
  } else if (hasJsx) {
    builderResult = buildSuiteForJsx(exportNode, builderOptions);
  } else if (arrowFunc) {
    builderResult = buildSuiteForBasicFunc(exportNode, builderOptions);
  } else {
    return;
  }

  return addSut(builderResult, builderOptions);
};

const buildSuitesFor = (exportingNodes, allNodes, inputModulePath) => {
  return noNulls(exportingNodes.map((en) => buildSuiteFor(en, allNodes, inputModulePath)));
};

const bySuiteName = (nodes: any[]) => {
  return R.indexBy((n) => n.arguments[0].value, nodes.map((n) => n.suite));
};

const mergeSuites = (existing, incoming) => {
  const existingByName = bySuiteName(existing);
  const incomingByName = bySuiteName(incoming);

  return R.values(R.merge(existingByName, incomingByName));
};

export const generateTests = (inputText: string, existingText, inputModulePath): string => {

  if (!inputText) { return ''; }

  const inputAST = parse(inputText);
  const inputNodes = inputAST.body;
  // const namedExportNames = namedExports.map(findExportName)

  // Grab the top level export statements
  const namedExportNodes = inputNodes.filter(byType("ExportNamedDeclaration"));
  const defaultExportNode = inputNodes.find(byType("ExportDefaultDeclaration"));
  const exportNodes =
    defaultExportNode ? namedExportNodes.concat(defaultExportNode) : namedExportNodes;

  const exportSuiteTrees = buildSuitesFor(exportNodes, inputNodes, inputModulePath);
  const outputAST = parse(existingText);
  const outputNodes = outputAST.body;
  const existingTopLevelSuites =
     filterByType<CallExpression>(outputNodes, "CallExpression")
      .filter(R.pathEq(['callee', 'name'], 'describe'))
      .map((exp) => {
        const arg0 = exp.arguments[0];
        return {
          name: R.propOr('mystery describe block', 'value', arg0) as string,
          suite: exp,
        };
      });

  const mergedSuites = mergeSuites(existingTopLevelSuites, exportSuiteTrees);

  const namedImportMaps = noNulls(exportSuiteTrees
    .map((t) => t.namedDepImports));
  const defaultImportMaps = noNulls(exportSuiteTrees
    .map((t) => t.defaultDepImports));

  const importStmts = buildImportStmts(namedImportMaps, defaultImportMaps, exportSuiteTrees);

  const namedExportSuites =
    mergedSuites.map(genJs).join('\n');

  const content = `
${genJsList(importStmts)}

${namedExportSuites}`;

  return content;
};
