export * from './formatter';
export * from './index';

export type TestStructure = "ParallelDirs" | "SameDir" | "SubDir";

export interface Project {
  packagePath: string;
  sourcePath: string;
  testPath: string;
  testStructure: TestStructure;
  testSuffix: string;
  pkgJson: any;
  projectRoot: string;
  srcInsideProject: string;
  testInsideProject: string;
  componentDetails: (name: string) => ComponentDetails;
}

export interface ComponentDetails {
  projectRoot: string;
  componentName: string;
  folderPath: string;
  componentPath: string;
  stylesPath: string;
}

export declare const fancyReactSettingsKeys: Array<string>;
type MaybeSettingValue = string | undefined;
export interface FancyReactSettings {
  packagePath: MaybeSettingValue;
  sourcePath: MaybeSettingValue;
  testPath: MaybeSettingValue;
  testStructure: MaybeSettingValue;
  testSuffix: MaybeSettingValue;
}

export interface IState {
  ide: IIDE;
  project: Project;
  fileSystem: IFileSystem;
  formatter: Formatter;
}

export interface IIDE {
  log: (msg: string) => void;
  getEditor: () => IEditor;
  open: (filePath: string) => Promise<IEditor>;
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
  getCursorPosition: () => Position;
  insertText: (position: Position, newText: string) => Promise<boolean>;
  setText: (text: string) => void;
  // insertNewline
  // moveUp(
}
