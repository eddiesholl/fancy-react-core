import { CallExpression, Node } from "estel-estree-builder/generated/es2015";
import R from 'ramda';

import { byType, searchBy, searchByIdName, searchByType } from "./node-ops";
import { noNulls } from "./utils";

export interface IReduxDetails {
  connected: boolean;
  funcNames: string[];
  returnedPropNames: string[];
  subject: string;
}

const findActionCreators = (ast: Node, actionCreatorsArg: Node): string[] => {
  if (actionCreatorsArg.type === "Identifier") {
    const name = R.propOr(undefined, 'name', actionCreatorsArg);
    if (name === 'undefined') {
      return [];
    } else {
      const decl = searchByIdName(ast, name);
      const props = R.pathOr([], ['init', 'properties'], decl);

      return noNulls(props.map(R.path(['key', 'name'])));
    }
  }
};

const findMSTPReturnArgs = (ast: Node, mapStateArg: Node): string[] => {
  if (mapStateArg.type === "Identifier") {
    const name = R.propOr(undefined, 'name', mapStateArg);
    if (name === 'undefined') {
      return [];
    } else {
      const decl = searchByIdName(ast, name);
      const returnStmt = searchByType(decl, 'ReturnStatement');
      const props = R.pathOr([], ['argument', 'properties'], returnStmt);

      return noNulls(props.map(R.path(['key', 'name'])));
    }
  }
};

export const getReduxDetails = (ast: Node): IReduxDetails => {
  const connectCall = searchBy(
    ast,
    (node) => byType('CallExpression') && R.path(['callee', 'callee', 'name'], node) === 'connect') as CallExpression;

  let funcNames = [];
  let returnedPropNames = [];

  if (connectCall === undefined) {
    return {
      connected: false,
      funcNames,
      returnedPropNames,
      subject: '',
    };
  } else {
    const subject = R.propOr('unknown', 'name', connectCall.arguments[0]) as string;
    // const subject = connectCall.arguments[0] as string;
    const calleeArgs = R.pathOr<Node[]>([], ['callee', 'arguments'], connectCall);

    const actionCreatorsArg = calleeArgs[0];
    const mapStateArg = calleeArgs[1];

    funcNames = findActionCreators(ast, actionCreatorsArg);
    returnedPropNames = findMSTPReturnArgs(ast, mapStateArg);

    return {
      connected: true,
      funcNames,
      returnedPropNames,
      subject,
    };
  }
};
