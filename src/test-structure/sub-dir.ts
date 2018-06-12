import { FancyReactSettings, ProjectFuncs, ProjectPaths } from "../types";

const path = require('path');

const { removeExtension, trimLeadingFolders } = require('../path-helpers');

export const subDir = (
  projectFuncs: ProjectFuncs,
  projectPaths: ProjectPaths,
  settings: FancyReactSettings,
) => {
  const { testSuffix, packagePath, sourcePath, testPath } = settings;
  return {
    sourceFileWPToTestFileWP: (sourceFileWithinProject) => {
      const srcDir = path.dirname(sourceFileWithinProject);
      const fileName = path.basename(sourceFileWithinProject);
      return path.join(
        srcDir,
        testPath,
        removeExtension(fileName) + testSuffix + '.js');
    },

    isPathWPTestFile: (filePath) => {
      const trimmedPathResult = trimLeadingFolders(filePath, [packagePath, sourcePath]);
      if (!trimmedPathResult.success) { return false; }

      return removeExtension(trimmedPathResult.value).endsWith(testSuffix);
    },

    testFileWPToSourceFileWP: (p) => {
      const fileName = path.basename(p);
      const baseFileName = removeExtension(fileName).slice(0, -testSuffix.length);
      const parentDir = path.dirname(path.dirname(p));

      return `${parentDir}/${baseFileName}.js`;
    },
  };
};
