import t from 'tcomb';

const specificString = (str) => t.refinement(t.String, (s) => s === str);

const ParallelDirs = specificString('ParallelDirs');
const SameDir = specificString('SameDir');
const SubDir = specificString('SubDir');

const TestStructure = t.union([ParallelDirs, SameDir, SubDir]);

export const Config = t.struct({
  packagePath: t.String,
  pkgJson: t.Object,
  projectRoot: t.String,
  sourcePath: t.String,
  testPath: t.String,
  testStructure: TestStructure,
  testSuffix: t.String,
}, 'Config');

export const Paths = t.struct({
  packagePath: t.String,
  projectRoot: t.String,
  sourcePath: t.String,
  srcInsideProject: t.String,
  testInsideProject: t.String,
  testPath: t.String,
}, 'Paths');

export const ComponentGeneration = t.struct({
  ast: t.Object,
  changesToCaller: t.Array,
  componentName: t.String,
  content: t.String,
}, 'ComponentGeneration');

declare module 'fancy-react-core' {

  export interface State {
    ide: IDE;
  }

  export interface IDE {
    log : (msg: string) => void;
    getEditor : () => Editor;
    open : (filePath: string) => Promise<Editor>;
  }

  export interface Position {
    line: number;
    character: number;
  }

  export interface Editor {
    getText : () => string;
    getCursorPosition : () => Position;
    insertText : (position: Position, newText: string) => Promise<boolean>;
    setText : (text: string) => void;
    // insertNewline
    // moveUp(
  }

}
