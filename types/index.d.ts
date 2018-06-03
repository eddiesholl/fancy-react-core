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
