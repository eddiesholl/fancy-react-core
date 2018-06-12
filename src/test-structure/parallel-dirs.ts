import { FancyReactSettings, ProjectFuncs, ProjectPaths } from "../types";

const path = require('path');

const { removeExtension, trimLeadingFolders, attachLeadingFolders } = require('../path-helpers');

export const parallelDirs = (
  projectFuncs: ProjectFuncs,
  projectPaths: ProjectPaths,
  settings: FancyReactSettings,
) => {
  const { packagePath, sourcePath, testPath, testSuffix } = settings;
  const { testInsideProject } = projectPaths;

  const flipSrcPathToTestPath = (sourceFileWithinProject) => {
    const sourceFileMinusExt = removeExtension(projectFuncs.sourcePathWithinSrc(sourceFileWithinProject));

    const pathPieces = [testInsideProject, sourceFileMinusExt, testSuffix, '.js'];
    return path.normalize(pathPieces.join(''));
  };

  return {
    sourceFileWPToTestFileWP: (sourceFileWithinProject) => {
      return flipSrcPathToTestPath(sourceFileWithinProject);
    },

    isPathWPTestFile: (p) => {
      const trimmedPathResult = trimLeadingFolders(p, [packagePath, testPath]);
      if (!trimmedPathResult.success) { return false; }

      return removeExtension(trimmedPathResult.value).endsWith(testSuffix);
    },

    testFileWPToSourceFileWP: (p) => {
      const trimmedPathResult = trimLeadingFolders(p, [packagePath, testPath]);
      const baseFile = removeExtension(trimmedPathResult.value).slice(0, -testSuffix.length);
      const baseFilePlusPrefix = attachLeadingFolders(baseFile, [packagePath, sourcePath]);

      return `${baseFilePlusPrefix}.js`;
    },
  };
};
