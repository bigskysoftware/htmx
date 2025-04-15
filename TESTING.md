# HTMX Testing Guide

This guide outlines how to test htmx, focusing on running tests headlessly or in a browser environment, running individual tests, and other testing concerns.

## Prerequisites

1. Ensure you have a currently supported Node.js and npm installed.
2. Install dependencies by running:
   ```bash
   npm install
   npm run test
   ```
During test runs it will auto install playwrite

## Running All Tests

To run all tests in headless mode, execute:
```bash
npm test
```
This will run all the tests using headless Chrome.

To run all tests against all browsers in headless mode, execute:
```bash
npm run test:all
```
This will run the tests using Playwright’s headless browser setup across Chrome, Firefox, and WebKit (Safari-adjacent).

To run all tests against a specific browser, execute:
```bash
npm run test:chrome
npm run test:firefox
npm run test:webkit
```

## Running Individual Tests

### Headless Mode
To run a specific test file headlessly, for example `test/core/ajax.js`, use the following command:
```bash
npm test test/core/ajax.js
```
If you want to run only one specific test, you can temporarily change `it("...` to `it.only("...` in the test file, and then specify the test file as above. Don't forget to undo this before you commit! You will get eslint warnings now to let you know when you have temporary `.only` in place to help avoid commiting these.

### Browser Mode
To run tests directly in the browser, simply `open test/index.html` in a browser.
On Ubuntu you can run:

```bash
xdg-open test/index.html
```
This runs all the tests in the browser using Mocha instead of web-test-runner for easier and faster debugging.

From the Mocha browser view you can rerun a just a single test file by clicking the header name or you can click on the play icon to re-play a single test. This makes it easy to update this test/code and refresh to re-run this single test. The browser console also now logs the names of the running tests so you can check here to find any errors or logs produced during each test execution. Adding debugger statements in your code or breakpoints in the browser lets you step though the test execution.

If you really want to open web-test-runner in headed mode, you can run:
```bash
npm run test:debug
```
This will start the server, and open the test runner in a browser. From there you can choose a test file to run. Note that all test logs will show up only in dev tools console unlike Mocha.

## Code Coverage Report
Lines of code coverage reporting will only work when running the default chrome headless testing

After a test run completes, you can open `coverage/lcov-report/index.html` to view the code coverage report. On Ubuntu you can run:
```bash
xdg-open coverage/lcov-report/index.html
```

## Test Locations
- All tests are located in the `test/attribues` and `test/core` directories. Only .js files in these directory will be discovered by the test runner.
- The `web-test-runner.config.mjs` file in the root directory contains the boilerplate HTML for the test runs, including `<script>` tags for the test dependencies.

### Local CI prediction
You can run `npm run test:ci` to locally simulate the result of the CI run. This is useful to run before pushing to GitHub to avoid fixup commits and CI reruns.
