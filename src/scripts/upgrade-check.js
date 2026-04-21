#!/usr/bin/env node
const { execFileSync, execSync } = require("child_process");
const path = require("path");

function findPython() {
  for (const cmd of ["python3", "python"]) {
    try {
      const version = execSync(`${cmd} --version`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
      const major = parseInt(version.split(" ")[1]);
      if (major >= 3) return cmd;
    } catch {}
  }
  return null;
}

const python = findPython();

if (!python) {
  console.error(
    "Error: Python 3 is required but was not found.\n\n" +
    "Install it from https://www.python.org/downloads/ or via your package manager:\n" +
    "  macOS:   brew install python3\n" +
    "  Ubuntu:  sudo apt install python3\n" +
    "  Windows: winget install Python.Python.3"
  );
  process.exit(1);
}

const script = path.join(__dirname, "upgrade-check.py");

try {
  execFileSync(python, [script, ...process.argv.slice(2)], { stdio: "inherit" });
} catch (e) {
  process.exit(e.status || 1);
}
