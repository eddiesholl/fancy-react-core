const { allowUnsafeNewFunction } = require("loophole");

let eslint;
allowUnsafeNewFunction(() => {
  eslint = require("eslint");
});

// let CLIEngine = eslint.CLIEngine
// let Linter = eslint.Linter;

export class Eslinter {
  private linter;
  private engine;
  constructor(cwd) {
    this.engine = new eslint.CLIEngine({ cwd });
    this.linter = new eslint.Linter();
  }

  public format(text, filePath) {
    const e = this.engine;
    let config;
    allowUnsafeNewFunction(() => {
      config = e.getConfigForFile(filePath);
    });
    const linterResult = this.linter.verifyAndFix(
      text,
      config,
    );

    return linterResult.output;
  }
}
