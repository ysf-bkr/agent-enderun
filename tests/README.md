# 🧪 Enderun CLI Integration & Testing Workspace

This folder is dedicated to isolated CLI test runs, mock workspaces, and unit/integration testing.

## 🚀 How to Test the CLI Locally

To test the initialization or execution of the CLI without polluting the root folder of the repository, always run commands inside this directory or another isolated sub-folder:

### 1. Initialize a Mock Project
Create a temporary folder under `tests/` (e.g. `tests/mock-project/`) and run init there:
```bash
mkdir -p tests/mock-project
cd tests/mock-project
node ../../bin/cli.js init gemini
```

### 2. Verify and Check
Run the check command inside your mock directory:
```bash
node ../../bin/cli.js check
```

## 🧹 Cleaning Up
Temporary folders under `tests/` starting with `mock-` or `init-` are gitignored. You can safely clean them up with:
```bash
rm -rf tests/mock-* tests/init-*
```
