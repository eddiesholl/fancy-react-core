import R from 'ramda';

import e, { ImportDeclaration, Property } from 'estel-estree-builder/generated/es2015';
import Result from 'folktale/result';
import path from 'path';

import { ComponentGeneration } from './tcomb';
import { validComponentName } from './utils';

import { parse } from './acorn';
import { printNode, searchByLocationAndType } from './node-ops';

import { genJsList } from './js-gen';
import {
  assign,
  buildClass,
  buildImportStmts,
  dot,
  fnArgs,
  raw,
} from './tree-builders';

export const generateComponent = (inputText, point, sourcePath) => {
  const tree = parse(inputText);
  printNode(tree);
  const jsxBlock = searchByLocationAndType(
    tree,
    // Note difference between Point and Position
    { line: point.row + 1, column: point.column },
    'JSXElement');

  if (!jsxBlock) { throw new Error(`Could not locate a JSX snippet near point ${point}`); }

  const jsxOpening = jsxBlock.openingElement;
  const componentName = jsxOpening.name.name;

  const componentDefinitionCode = generateComponents(jsxOpening);

  return componentDefinitionCode.map((c) => {
    const changesToCaller = importNewComponent(tree.body, componentName, sourcePath);
    const importStmts = generateImports(componentName);
    const ast = importStmts.concat(c);

    return ComponentGeneration({
      ast,
      changesToCaller,
      componentName,
      content: genJsList(ast),
    });
  });
};

export const generateImports = (componentName) => {
  const namedImports = {
    react: ['Component'],
  };
  const defaultImports = {
    'prop-types': 'PropTypes',
    react: 'React',
  };
  defaultImports[`./${componentName}.scss`] = 'styles';

  return buildImportStmts([namedImports], [defaultImports]);
};

export const generateComponents = (jsxNode: any) => {
  const className = R.path(['name', 'name'], jsxNode) as string;

  if (!validComponentName(className)) {
    return Result.Error(`The element name '${className}' is not valid for a component`);
  }

  const classDecl = buildClass(className, 'Component', {
    render: generateRender(className, jsxNode.attributes),
  });

  const defProps = generateProps(className, jsxNode.attributes);

  const defExport = raw(`export default ${className}`);
  return Result.Ok([classDecl, defProps, defExport]);
};

export const importNewComponent = (nodes: ImportDeclaration[], compName: string, sourcePath: string) => {
  const newImportPath = path.join(sourcePath, 'components', compName, compName);
  const newImportStmt = `import ${compName} from '${newImportPath}'`;

  const importNodes = nodes.filter(R.propEq("type", "ImportDeclaration"));
  const lastImport = importNodes.slice(-1)[0];

  if (lastImport !== undefined) {
    const alreadyImported = R.find((n: ImportDeclaration) => {
      return R.path(['source', 'value'], n) === newImportPath;
    }, importNodes);

    if (alreadyImported) {
      return [];
    } else {
      return [{ lineNumber: lastImport.loc!.end.line + 1, content: newImportStmt }];
    }
  } else {
    return [{ lineNumber: 0, content: newImportStmt }];
  }

};

const generateRender = (className: string, attributeNodes: Node[]) => {
  const propVars = attributeNodes.map((a: Node) => {
    return e.assignmentProperty(e.identifier('wut'), R.path(['name', 'name'], a));
  });
  const objPattern = e.objectPattern(propVars);
  const thisDotProps = dot(e.thisExpression(), 'props');
  return fnArgs(
    [],
    e.variableDeclaration([e.variableDeclarator(objPattern, thisDotProps)], 'const'),
    e.returnStatement(e.identifier(`(
      <div>
        Here is a '${className}'
      </div>
    )`)),
  );
};

/*    var {a, b} = this.props;
return (
  <div>
    Here is a 'Nested'
  </div>*/

const generateProps = (className: string, attributeNodes: any[]) => {
  const objProps = attributeNodes.map((a) => {
    return e.property(e.identifier(a.name.name), dot(dot(e.identifier('PropTypes'), 'object'), 'isRequired'), 'init');
  });
  return assign(dot(e.identifier(className), 'propTypes'), e.objectExpression(objProps));
};
