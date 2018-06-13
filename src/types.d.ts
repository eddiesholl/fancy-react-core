export * from './formatter';
export * from './index';

export type TestStructure = "ParallelDirs" | "SameDir" | "SubDir";

export interface ProjectPaths {
  projectRoot: string;
  srcInsideProject: string;
  testInsideProject: string;
}

export interface ProjectFuncs {
  fullPathToProjectPath: (sourceFile: string) => string;
  componentDetails: (name: string) => ComponentDetails;
  sourceFileToModulePath: (name: string) => string;
  sourcePathWithinSrc: (testFilePath: string) => string;
}

export interface TestFuncs {
  sourceFileWPToTestFileWP: (sourceFileWithinProject: string) => string;
  isPathWPTestFile: (filePath: string) => boolean;
  testFileWPToSourceFileWP: (testFilePath: string) => string;
}
export interface Project extends ProjectFuncs, ProjectPaths, TestFuncs {
  isPathTestFile: (name: string) => boolean;
  sourceFileToTestFile: (name: string) => string;
  testFileToSourceFile: (name: string) => string;
}

export interface ComponentDetails {
  projectRoot: string;
  componentName: string;
  folderPath: string;
  componentPath: string;
  stylesPath: string;
}

export declare const fancyReactSettingsKeys: Array<string>;

export type PkgJson = any;
type MaybeSettingValue = string | undefined;
export interface FancyReactSettings {
  packagePath: string;
  projectRoot: string;
  sourcePath: string;
  testPath: string;
  testStructure: TestStructure;
  testSuffix: string;
  pkgJson: PkgJson;
}

export interface IState {
  ide: IIDE;
  project: Project;
  settings: FancyReactSettings;
  fileSystem: IFileSystem;
  formatter: Formatter;
}

export interface IIDE {
  log: (msg: string) => void;
  getEditor: () => IEditor;
  open: (filePath: string) => Promise<IEditor>;
  getSetting: (name: string) => MaybeSettingValue;
  getPkgJson: () => PkgJson;
  getProjectRoot: () => string;
}

export interface IFileSystem {
  createComponent: (component: ComponentDetails) => void;
  ensureFolderExists: (path: string) => void;
  ensureFileExists: (path: string) => void;
}

export class FileSystem implements IFileSystem {
  createComponent: (component: ComponentDetails) => void;
  ensureFolderExists: (path: string) => void;
  ensureFileExists: (path: string) => void;
}

export interface IFormatter {
  format: (input: string, fileName: string) => string;
}

export declare class Formatter implements IFormatter {
  constructor(project: Project, ide: IIDE);
  format: (input: string, fileName: string) => string;
}

export type Position = {
  line: number;
  character: number;
}

export interface IEditor {
  getText: () => string;
  getFilePath: () => string;
  getCursorPosition: () => Position;
  insertText: (position: Position, newText: string) => Promise<boolean>;
  setText: (text: string) => void;
  // insertNewline
  // moveUp(
}
