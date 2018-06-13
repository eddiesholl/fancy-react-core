/* tslint:disable:max-classes-per-file */
const path = require('path');
const fs = require('fs');

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

export const tests = ({ fileSystem, formatter, ide, project, settings }: IState) => {
  const activeEditor = ide.getEditor();

  const inputFilePath = activeEditor.getFilePath();
  const inputText = activeEditor.getText();

  const sourceFileWithinProject = project.fullPathToProjectPath(inputFilePath);

  if (!sourceFileWithinProject.startsWith(project.srcInsideProject)) {
    throw new Error(`Source file ${sourceFileWithinProject} not inside src folder ${project.srcInsideProject}`);
  }

  const testFilePath = path.join(
    settings.projectRoot,
    project.sourceFileWPToTestFileWP(sourceFileWithinProject));

  const inputModulePath = project.sourceFileToModulePath(inputFilePath);

  fileSystem.ensureFileExists(testFilePath);

  ide.open(testFilePath).then((editor) => {
    const existingText = editor.getText();

    // initModulePaths(this.config.projectRoot);

    const generatedTests = testContent.generate(inputText, existingText, inputModulePath);
    const formattedContent = formatter.format(
      generatedTests.content,
      testFilePath);

    editor.setText(formattedContent);
  })
  .catch((e) => {
    ide.log(`Failed to open test file ${testFilePath}: ${e}`);
  });
};

export const switchFiles = ({ fileSystem, formatter, ide, project, settings }: IState) => {
  const currentFilePath = ide.getEditor().getFilePath();
  const isCurrentFileTest = project.isPathTestFile(currentFilePath);

  if (isCurrentFileTest) {
    const sourceFilePath = project.testFileToSourceFile(currentFilePath);

    if (fs.existsSync(sourceFilePath)) {
      ide.open(sourceFilePath);
    } else {
      ide.log(`The source file ${sourceFilePath} doesn't seem to exist :(`);
    }
  } else {
    const testFilePath = project.sourceFileToTestFile(currentFilePath);

    if (fs.existsSync(testFilePath)) {
      ide.open(testFilePath);
    } else {
      // TODO We could generate here
      ide.log(`The test file ${testFilePath} doesn't seem to exist :(`);
    }
  }
};
