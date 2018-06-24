import { CallExpression, Node } from "estel-estree-builder/generated/es2015";
import R from 'ramda';

import { byType, searchBy, searchByIdName } from "./node-ops";
import { noNulls } from "./utils";

export interface IReduxDetails {
  connected: boolean;
  funcNames: string[];
  mstpFunc: Node | undefined;
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

const findMSTPReturnArgs = (mstpArg: Node): string[] => {
  return [];
};

export const getReduxDetails = (ast: Node): IReduxDetails => {
  const connectCall = searchBy(
    ast,
    (node) => byType('CallExpression') && R.path(['callee', 'callee', 'name'], node) === 'connect') as CallExpression;

  let mstpFunc;
  let funcNames = [];
  const returnedPropNames = [];

  if (connectCall === undefined) {
    return {
      connected: false,
      funcNames,
      mstpFunc,
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

    return {
      connected: true,
      funcNames,
      mstpFunc,
      returnedPropNames,
      subject,
    };
  }
};
