/* tslint:disable:max-classes-per-file */

import { ComponentDetails, FancyReactSettings, IFileSystem, IFormatter, IIDE, Project } from "./types";
const R = require('ramda');

const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

import { Eslinter } from './eslint';
const { removeExtension } = require('./path-helpers');

export const getSettings = (ide: IIDE): FancyReactSettings => {
  const pkgJson = ide.getPkgJson();

  const mergeSetting = (settingName: string, defaultValue: string) => {
    const userSetting = R.pathOr(ide.getSetting(settingName), ['fancyReact', settingName], pkgJson);
    return userSetting || defaultValue;
  };

  return {
    packagePath: mergeSetting("packagePath", "client"),
    pkgJson,
    projectRoot: ide.getProjectRoot(),
    sourcePath: mergeSetting("sourcePath", "src"),
    testPath: mergeSetting("testPath", "test"),
    testStructure: mergeSetting("testStructure", "ParallelDirs"),
    testSuffix: mergeSetting("testSuffix", "-test"),
  };
};

export const getProject = (settings: FancyReactSettings): Project => {

  const srcInsideProject = path.join('/' + settings.packagePath, settings.sourcePath);

  const componentDetails = (componentName: string) => {
    const folderPath =
      `${settings.projectRoot}/${settings.packagePath}/${settings.sourcePath}/components/${componentName}`;
    const componentPath = `${folderPath}/${componentName}.js`;
    const stylesPath = `${folderPath}/${componentName}.scss`;

    return {
      componentName,
      componentPath,
      folderPath,
      projectRoot: settings.projectRoot,
      stylesPath,
    };
  };

  const fullPathToProjectPath = (sourceFile: string) => {
    if (!sourceFile.startsWith(settings.projectRoot)) {
      throw new Error(`Source file ${sourceFile} not part of project ${settings.projectRoot}`);
    }

    return sourceFile.slice(settings.projectRoot.length);
  };

  const sourceFileToTestFile = (sourceFile: string) => {
    const sourceFileWithinProject = fullPathToProjectPath(sourceFile);

    if (!sourceFileWithinProject.startsWith(srcInsideProject)) {
      throw new Error(`Source file ${sourceFileWithinProject} not inside src folder ${srcInsideProject}`);
    }

    return path.join(
      settings.projectRoot,
      testStructureFuncs.sourceFileWPToTestFileWP(sourceFileWithinProject));
  };

  const sourcePathWithinSrc = (sourceFileWithinProject: string) => {
    return sourceFileWithinProject.slice(srcInsideProject.length);
  };

  const sourceFileToModulePath = (sourceFile: string) => {
    const sourceFileWithinProject = fullPathToProjectPath(sourceFile);
    return 'src' + removeExtension(sourcePathWithinSrc(sourceFileWithinProject));
  };

  return {
    componentDetails,
    projectRoot: settings.projectRoot,
    sourceFileToModulePath,
    sourceFileToTestFile,
    srcInsideProject: path.join('/' + settings.packagePath, settings.sourcePath),
    testInsideProject: path.join('/' + settings.packagePath, settings.testPath),
  };
};

export class Formatter implements IFormatter {
  private ide: IIDE;
  private linter;
  constructor(project: Project, ide: IIDE) {
    this.ide = ide;

    const pkgJson = ide.getPkgJson();

    const eslintDep = R.path(['dependencies', 'eslint'], pkgJson);
    const eslintDevDep = R.path(['devDependencies', 'eslint'], pkgJson);

    if (eslintDep || eslintDevDep) {
      this.linter = new Eslinter(ide.getProjectRoot());
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
