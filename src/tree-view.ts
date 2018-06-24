import {
  ClassDeclaration,
  Expression,
  Node,
  Program,
  Property,
} from 'estel-estree-builder/generated/es2015';
const fs = require('fs');
const path = require('path');
import R from 'ramda';

import { parse } from './acorn';
import { genJs } from './js-gen';
import { searchBySuperClass, searchForPropDefaults, searchForPropTypes } from './node-ops';
import { getReduxDetails, IReduxDetails } from './redux';

export interface IReactComponent {
  componentName: string;
  definition: Node;
  props: IReactProperty[];
  redux: IReduxDetails;
}

export enum PropStyle {
  Input,
  ReduxFunc,
  State,
}

export interface IReactProperty {
  default: any;
  name: string;
  optional: boolean;
  style: PropStyle;
  type: string;
}

export type ParseResult = Program | undefined;

export interface ICachedSourceFile {
  ast: ParseResult;
  component?: IReactComponent;
  content: string;
  fileName: string;
  filePath: string;
}

const propListToMap = (props: Property[]): Map<string, string> => {
  const result = new Map<string, string>();

  props.forEach((p) => {
    const key = R.path<string>(['key', 'name'], p);

    if (key !== undefined) {
      const val = R.path<string>(['value', 'raw'], p);
      result.set(key, val);
    }
  });

  return result;
};

export const extractProp =
  (propNode: Property, propDefaults: Map<string, string>, redux: IReduxDetails): IReactProperty => {
  const val = propNode.value;

  const name = R.path<string>(['key', 'name'], propNode);
  const defaultValue = propDefaults.get(name);
  let propType = '?';
  let optional = false;

  if (val.type === 'CallExpression') {
    propType = genJs(val);
  } else {
    if (R.pathEq(['object', 'type'], 'Identifier', val)) {
      propType = R.path<string>(['property', 'name'], val);
      optional = true;
    } else {
      propType = R.path<string>(['object', 'property', 'name'], val);
    }
  }

  let style = PropStyle.Input;
  if (redux.funcNames.some(R.equals(name))) {
    style = PropStyle.ReduxFunc;
  } else if (redux.returnedPropNames.some(R.equals(name))) {
    style = PropStyle.State;
  }

  return {
    default: defaultValue,
    name,
    optional,
    style,
    type: propType,
  };
};

const extractComponent = (ast: ParseResult): IReactComponent | undefined => {
  if (ast === undefined) { return; }

  const componentClass = searchBySuperClass(ast, 'Component');

  if (componentClass !== undefined) {
    const className = componentClass.id.name;
    const propDefaults = propListToMap(searchForPropDefaults(ast, className));
    const redux = getReduxDetails(ast);

    const props = searchForPropTypes(ast, className)
      .map((prop) => extractProp(prop, propDefaults, redux))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      componentName: className,
      definition: ast,
      props,
      redux,
    };
  }
};

const processFile = (filePath: string): Promise<ICachedSourceFile> => {
  return new Promise<ICachedSourceFile>((resolve, reject) => {
    fs.readFile(filePath, (err, content) => {
      if (err) {
        reject(err);
      } else {
        let ast;
        let component;

        try {
          ast = parse(content);
          component = extractComponent(ast);
        } catch (e) {
          // console.log(`Could not parse ${filePath}: ${e}`);
        }

        resolve({
          ast,
          component,
          content,
          fileName: path.basename(filePath),
          filePath,
        });
      }
    });
  });
};

export class SourceFileCache {
  private data: Map<string, Promise<ICachedSourceFile>>;

  constructor() {
    this.data = new Map<string, Promise<ICachedSourceFile>>();
  }

  public getFile(filePath: string): Promise<ICachedSourceFile> {
    if (this.data.has(filePath)) {
      return this.data.get(filePath);
    } else {
      const parsePromise = processFile(filePath);

      this.data.set(filePath, parsePromise);

      return parsePromise;
    }
  }

  public fileNames(): string[] {
    return Array.from(this.data.keys());
  }

  public cachedFiles(): Array<Promise<ICachedSourceFile>> {
    return Array.from(this.data.values());
  }

  public refresh(filePath: string): void {
    const parsePromise = processFile(filePath);
    this.data.set(filePath, parsePromise);
  }

  public clear(filePath: string): void {
    this.data.delete(filePath);
  }
}
