import { CallExpression, Node } from "estel-estree-builder/generated/es2015";
import R from 'ramda';

import { byType, searchBy } from "./node-ops";

export interface IReduxDetails {
  connected: boolean;
  funcNames: string[];
  mstpFunc: Node | undefined;
  returnedPropNames: string[];
  subject: string;
}

export const getReduxDetails = (ast: Node): IReduxDetails => {
  const connectCall = searchBy(
    ast,
    (node) => byType('CallExpression') && R.path(['callee', 'callee', 'name'], node) === 'connect') as CallExpression;

  let mstpFunc;
  const funcNames = [];
  const returnedProp = [];

  if (connectCall === undefined) {
    return {
      connected: false,
      funcNames,
      mstpFunc,
      returnedPropNames,
      subject: '',
    };
  } else {
    const subject = connectCall.arguments[0] as string;
    const calleeArgs = R.pathOr<[]>([], ['callee', 'arguments'], connectCall);

    return {
      connected: true,
      funcNames,
      mstpFunc,
      returnedPropNames,
      subject,
    };
  }
};
