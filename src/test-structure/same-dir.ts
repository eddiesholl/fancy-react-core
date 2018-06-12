import { FancyReactSettings, ProjectFuncs, ProjectPaths } from "../types";

const { removeExtension, trimLeadingFolders } = require('../path-helpers');

export const sameDir = (
  projectFuncs: ProjectFuncs,
  projectPaths: ProjectPaths,
  settings: FancyReactSettings,
) => {
  const { testSuffix, packagePath, sourcePath } = settings;
  return {
    sourceFileWPToTestFileWP: (sourceFileWithinProject) => {
      return removeExtension(sourceFileWithinProject) + testSuffix + '.js';
    },

    isPathWPTestFile: (p) => {
      const trimmedPathResult = trimLeadingFolders(p, [packagePath, sourcePath]);
      if (!trimmedPathResult.success) { return false; }

      return removeExtension(trimmedPathResult.value).endsWith(testSuffix);
    },

    testFileWPToSourceFileWP: (p) => {
      const baseFile = removeExtension(p).slice(0, -testSuffix.length);

      return `${baseFile}.js`;
    },
  };
};
