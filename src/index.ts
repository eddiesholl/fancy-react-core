/* tslint:disable:max-classes-per-file */

import { ComponentDetails, IFileSystem, IFormatter, IIDE, IState, Project } from "./types";
const R = require('ramda');

import { Eslinter } from './eslint';
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

const { generateComponent } = require("./react-content");

export const baz = () => { return; };

export class Formatter implements IFormatter {
  private ide: IIDE;
  private linter;
  constructor(project: Project, ide: IIDE) {
    this.ide = ide;

    const eslintDep = R.path(['dependencies', 'eslint'], project.pkgJson);
    const eslintDevDep = R.path(['devDependencies', 'eslint'], project.pkgJson);

    if (eslintDep || eslintDevDep) {
      this.linter = new Eslinter(project.projectRoot);
    }
  }

  public format(text, fileName) {
    try {
      return this.linter ?
        this.linter.format(text, fileName) :
        text;
    } catch (e) {
      this.ide.log(`Failed to format output: ${e.message}`);

      return text;
    }
  }
}

export class FileSystem implements IFileSystem {
  public createComponent(component: ComponentDetails) {
    this.ensureFolderExists(component.folderPath);
    this.ensureFileExists(component.stylesPath);
    this.ensureFileExists(component.componentPath);
  }

  public ensureFolderExists(pathToCheck: string) {
    const dirPath = path.extname(pathToCheck) ? path.dirname(pathToCheck) : pathToCheck;
    if (!fs.existsSync(dirPath)) {
      mkdirp.sync(dirPath);
    }
  }

  public ensureFileExists(pathToCheck: string) {
    if (!fs.existsSync(pathToCheck)) {
      fs.closeSync(fs.openSync(pathToCheck, 'w'));
    }
  }
}

export const fancyReactSettings: string[] =
    ["testStructure", "packagePath", "sourcePath", "testPath", "testSuffix"];

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
