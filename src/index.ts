/* tslint:disable:max-classes-per-file */

const R = require('ramda');
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

import { Eslinter } from './eslint';
import { getTestFuncs } from './test-structure/factory';
import {
  ComponentDetails,
  FancyReactSettings,
  IFileSystem,
  IFormatter,
  IIDE,
  Project,
  ProjectFuncs,
  ProjectPaths,
} from "./types";
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

const getProjectPaths = (settings: FancyReactSettings): ProjectPaths => {
  return {
    projectRoot: settings.projectRoot,
    srcInsideProject: path.join('/' + settings.packagePath, settings.sourcePath),
    testInsideProject: path.join('/' + settings.packagePath, settings.testPath),
  };
};

const getProjectFuncs = (projectPaths: ProjectPaths, settings: FancyReactSettings): ProjectFuncs => {
  const { packagePath, projectRoot, sourcePath } = settings;
  const { srcInsideProject } = projectPaths;

  const componentDetails = (componentName: string) => {
    const folderPath = `${projectRoot}/${packagePath}/${sourcePath}/components/${componentName}`;
    const componentPath = `${folderPath}/${componentName}.js`;
    const stylesPath = `${folderPath}/${componentName}.scss`;

    return {
      componentName,
      componentPath,
      folderPath,
      projectRoot,
      stylesPath,
    };
  };

  const fullPathToProjectPath = (sourceFile: string) => {
    if (!sourceFile.startsWith(settings.projectRoot)) {
      throw new Error(`Source file ${sourceFile} not part of project ${settings.projectRoot}`);
    }

    return sourceFile.slice(settings.projectRoot.length);
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
    fullPathToProjectPath,
    sourceFileToModulePath,
    sourcePathWithinSrc,
  };
};

export const getProject = (settings: FancyReactSettings): Project => {
  const { projectRoot } = settings;
  const projectPaths = getProjectPaths(settings);
  const { srcInsideProject, testInsideProject } = projectPaths;

  const projectFuncs = getProjectFuncs(projectPaths, settings);
  const {
    componentDetails,
    fullPathToProjectPath,
    sourceFileToModulePath,
    sourcePathWithinSrc,
  } = projectFuncs;

  const testFuncs = getTestFuncs(projectFuncs, projectPaths, settings);
  const { sourceFileWPToTestFileWP, isPathWPTestFile, testFileWPToSourceFileWP } = testFuncs;

  const isPathTestFile = (filePath) => {
    const filePathWithinProject = filePath.startsWith(projectRoot) ?
      filePath.slice(projectRoot.length) :
      filePath;

    return isPathWPTestFile(filePathWithinProject);
  };

  const testFileToSourceFile = (testFile) => {
    const testFileWithinProject = fullPathToProjectPath(testFile);

    return path.join(
      projectRoot,
      testFileWPToSourceFileWP(testFileWithinProject));
  };

  const sourceFileToTestFile = (sourceFile) => {
    const sourceFileWithinProject = fullPathToProjectPath(sourceFile);

    if (!sourceFileWithinProject.startsWith(srcInsideProject)) {
      throw new Error(`Source file ${sourceFileWithinProject} not inside src folder ${srcInsideProject}`);
    }

    return path.join(
      projectRoot,
      sourceFileWPToTestFileWP(sourceFileWithinProject));
  };

  return {
    componentDetails,
    fullPathToProjectPath,
    isPathTestFile,
    isPathWPTestFile,
    projectRoot,
    sourceFileToModulePath,
    sourceFileToTestFile,
    sourceFileWPToTestFileWP,
    sourcePathWithinSrc,
    srcInsideProject,
    testFileToSourceFile,
    testFileWPToSourceFileWP,
    testInsideProject,
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
