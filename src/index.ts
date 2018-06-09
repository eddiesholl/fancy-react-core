/* tslint:disable:max-classes-per-file */

import { ComponentDetails, IFileSystem, IFormatter, IIDE, IState, Project } from "./types";
const R = require('ramda');

import { Eslinter } from './eslint';
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

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

export * from './actions';
