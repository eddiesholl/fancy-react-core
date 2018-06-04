export * from './index';

export interface IState {
  ide: IIDE;
}

export interface IState {
  ide: IIDE;
}

export interface IIDE {
  log: (msg: string) => void;
  getEditor: () => IEditor;
  open: (filePath: string) => Promise<IEditor>;
}

export interface IPosition {
  line: number;
  character: number;
}

export interface IEditor {
  getText: () => string;
  getCursorPosition: () => IPosition;
  insertText: (position: IPosition, newText: string) => Promise<boolean>;
  setText: (text: string) => void;
  // insertNewline
  // moveUp(
}
