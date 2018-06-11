/* tslint:disable:max-classes-per-file */
import { ComponentDetails, IFileSystem, IIDE, IState, Project } from "./types";
const { generateComponent } = require("./react-content");
const testContent = require('./test-content');

export const generate = ( { fileSystem, formatter, ide, project, settings }: IState) => {
  const editor = ide.getEditor();
  const inputText = editor.getText();
  const cursorPosition = editor.getCursorPosition();

  const result = generateComponent(inputText, cursorPosition, settings.sourcePath);

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
    const activeEditor = ide.getEditor();

    const inputFilePath = activeEditor.getFilePath();
    const inputText = activeEditor.getText();
    const testFilePath = project.sourceFileToTestFile(inputFilePath);
    const inputModulePath = project.sourceFileToModulePath(inputFilePath);

    fileSystem.ensureFolderExists(testFilePath);

    ide.open(testFilePath).then((editor) => {
      const existingText = editor.getText();
      const generatedTests = testContent.generate(inputText, existingText, inputModulePath);

      // initModulePaths(this.config.projectRoot);

      const formattedContent = formatter.format(
        generatedTests.content,
        testFilePath);
      editor.setText(formattedContent);
    });
};
