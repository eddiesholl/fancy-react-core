/* tslint:disable:max-classes-per-file */
const R = require('ramda');

import { ComponentDetails, IFileSystem, IFormatter, IIDE, IState, Project } from "./types";
const { generateComponent } = require("./react-content");

export const generate = ( { fileSystem, formatter, ide, project }: IState) => {
  const editor = ide.getEditor();
  const inputText = editor.getText();
  const cursorPosition = editor.getCursorPosition();

  const result = generateComponent(inputText, cursorPosition, project.sourcePath);

  result.matchWith({
    Error: ({ value }) => ide.log(`Component generation failed: ${value}`),
    Ok: ({ value }) => {
      const componentDetails = project.componentDetails(value.componentName);

      fileSystem.createComponent(componentDetails);

      if (value.changesToCaller) {
        value.changesToCaller.forEach((change, ix) => {
          // editor.setCursorScreenPosition(
          //   { row: change.lineNumber + ix - 1, column: 0 });
          // editor.insertNewline();
          // editor.moveUp(1);
          editor.insertText({line: change.lineNumber + ix - 1, character: 0}, change.content);
          // editor.insertText(change.content);
        });
      }
      ide.open(componentDetails.componentPath).then((newEditor) => {
        const formattedContent = formatter.format(
          value.content,
          componentDetails.componentPath,
        );
        newEditor.setText(formattedContent);
      });
    },
  });
};

export const tests = ({ fileSystem, formatter, ide, project }: IState) => {
  return;
};
