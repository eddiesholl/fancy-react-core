import { FancyReactSettings, ProjectFuncs, ProjectPaths, TestFuncs } from "../types";

const { parallelDirs } = require('./parallel-dirs');
const { sameDir } = require('./same-dir');
const { subDir } = require('./sub-dir');

export const getTestFuncs = (
  projectFuncs: ProjectFuncs,
  projectPaths: ProjectPaths,
  settings: FancyReactSettings,
): TestFuncs => {
  const { testStructure } = settings;

  switch (testStructure) {
    case 'ParallelDirs':
      return parallelDirs(projectFuncs, projectPaths, settings);

    case 'SameDir':
      return sameDir(projectFuncs, projectPaths, settings);

    case 'SubDir':
      return subDir(projectFuncs, projectPaths, settings);

    default:
      throw new Error(`${testStructure} is not a supported test structure`);
  }
};
