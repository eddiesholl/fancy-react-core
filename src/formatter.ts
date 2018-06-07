const R = require('ramda');

import { Eslinter } from './eslint';
import { IFormatter, IIDE, Project } from "./types";

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
