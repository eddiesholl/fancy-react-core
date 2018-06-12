/* tslint:disable:no-console */
import R from 'ramda';
import { Position } from './types';

const hasValue = (n) => !!n;

const pointAfter = (p: Position, a) => {
  return p && a &&
    ((p.line === a.line && p.character > a.column) || (p.line > a.line));
};

const pointWithin = (p: Position, a, b) => {
  return pointAfter(p, a) && pointAfter(b, p);
};

export const byType = (type) => {
  return (n) => {
    return n.type === type;
  };
};
export const byLocation = (point: Position) => {
  return (n) => {
    if (!point || !n || !n.loc) { return false; }
    const start = n.loc.start;
    const end = n.loc.end;
    return pointWithin(point, start, end);
  };
};

const firstVal = (a) => {
  return a.filter(hasValue).shift();
};
const nodesToDescend = [
  'declaration', 'id', 'init', 'body', 'expression',
  'left', 'right', 'value', 'argument', 'openingElement',
  'declarations', 'children',
];

interface ISearchOptions { lower: boolean; }

export const searchBy = (currentNode, tester, options: ISearchOptions = { lower: false }) => {
  if (!currentNode) { return; }

  let currentResult;
  let lowerResult;

  if (Array.isArray(currentNode)) {
    lowerResult = firstVal(
      currentNode
        .map((n) => {
          return searchBy(n, tester, options);
        }));
  } else {
    const currentTesterResult = tester(currentNode);
    if (currentTesterResult) {
      // allow testers to return a 'lookahead' node match
      currentResult = (currentTesterResult === true)
        ? currentNode
        : currentTesterResult;
    }

    lowerResult = firstVal(
      nodesToDescend.map((s) => {
        const nextDescent = currentNode[s];
        if (nextDescent) {
          if (nextDescent.map) {
            return firstVal(
              nextDescent.map((d) => {
                return searchBy(d, tester, options);
              }));
          } else {
            return searchBy(nextDescent, tester, options);
          }
        }
      }));
  }

  const result = options.lower ?
    lowerResult || currentResult :
    currentResult || lowerResult;

  return result;
};
export const searchByType = (node, type) => {
  return searchBy(node, byType(type));
};
export const searchByLocation = (node, point) => {
  return searchBy(node, byLocation(point));
};
export const searchByLocationAndType = (node, point: Position, type: string) => {
  const bl = byLocation(point);
  const bt = byType(type);
  return searchBy(node, (n) => bt(n) && bl(n), { lower: true });
};

export const searchBySuperClass = (node, superClassName) => {
  const tester = (n) => {
    const superClass = n.superClass;
    return byType("ClassDeclaration")(n) &&
      superClass && superClass.name === superClassName;
  };
  return searchBy(node, tester);
};

export const searchForPropTypes = (node, componentName) => {
  const legacyTester = (n) => {
    const isAssignment = byType('AssignmentExpression')(n);
    const left = n.left;

    if (isAssignment && byType('MemberExpression')(left)) {
      const subjectName = left.object.name;
      const propName = left.property.name;

      if (subjectName === componentName && propName === 'propTypes') {
        const isRightObject = byType('ObjectExpression')(n.right);
        return isRightObject && n.right.properties;
      }
    }
  };
  const staticPropTypesTester = (n) => {
    return byType('ClassProperty')(n) &&
      n.static &&
      n.key && node.key.name === 'propTypes';
  };

  const legacyMatch = searchBy(node, legacyTester);
  if (legacyMatch) { return legacyMatch; }

  const classDef = searchBySuperClass(node, 'Component');
  const staticProps = searchBy(classDef, staticPropTypesTester);
  if (staticProps && staticProps.value) {
    return staticProps.value.properties;
  }
};

export const searchByIdName = (node, idName) => {
  const tester = R.pathEq(['id', 'name'], idName);
  return searchBy(node, tester);
};

export const printNode = (node, depth = 0) => {
  const indent = depth || 0;
  if (!node) {
    // console.log('undefined node :(');
    return;
  }

  const pad = R.range(0,  indent).map(() => '|  ').join('');
  const nextDepth = indent + 1;
  const sub = (s) => {
    const next = node[s];
    if (next) {
      if (next.forEach) {
        console.log(pad + s + ':');
        next.forEach((n) => printNode(n, nextDepth));
      } else {
        console.log(pad + s + ':');
        printNode(next, nextDepth);
      }
    }
  };
  const iter = (s) => {
    if (node[s]) {
      console.log(pad + s + ':');
      node[s].forEach((n) => printNode(n, nextDepth));
    }
  };
  console.log(pad + node.type + " " + (node.name || node.operator || ''));

  const subs = ['id', 'init', 'body', 'declaration', 'key', 'argument',
    'expression', 'callee', 'object', 'property', 'source', 'local',
    'left', 'right', 'value'];
  subs.forEach(sub);

  const iters = ['declarations', 'params', 'properties', 'arguments', 'specifiers'];
  iters.forEach(iter);
};
