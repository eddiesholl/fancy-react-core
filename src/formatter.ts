const R = require('ramda');

import { Eslinter } from './eslint';
import { IFormatter, IIDE, Project } from "./types";

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
