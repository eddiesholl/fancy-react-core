import { ClassDeclaration, Node, Program, Property } from 'estel-estree-builder/generated/es2015';
const fs = require('fs');
const path = require('path');
import R from 'ramda';

import { parse } from './acorn';
import { searchBySuperClass, searchForPropTypes } from './node-ops';

export interface IReactComponent {
  componentName: string;
  definition: Node;
  props: IReactProperty[];
}

export interface IReactProperty {
  name: string;
  type: string;
  default: any;
}

export type ParseResult = Program | undefined;

export interface ICachedSourceFile {
  ast: ParseResult;
  component?: IReactComponent;
  content: string;
  fileName: string;
  filePath: string;
}

const extractProp = (propNode: Property): IReactProperty => {
  return {
    default: undefined,
    name:  R.path<string>(['key', 'name'], propNode),
    type: R.path<string>(['value', 'object', 'property', 'name'], propNode),
  };
};

const extractComponent = (ast: ParseResult): IReactComponent | undefined => {
  if (ast === undefined) { return; }

  const componentClass = searchBySuperClass(ast, 'Component');

  if (componentClass !== undefined) {
    const className = componentClass.id.name;
    const props = searchForPropTypes(ast, className).map(extractProp);

    return {
      componentName: className,
      definition: ast,
      props,
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

  public clear(filePath: string): void {
    this.data.delete(filePath);
  }
}
