# Publishing htmx

Run the `npm run publish` task, which will run all tests against all three major browsers and publish only if they succeed

## Moving code to the main repo

* Create a new branch of `master` called `trinity`
* Update following files/directories:
  .github - keep
  dist - delete
  editors/jetbrains - keep
  scripts - keep for `www`
  src - delete
  test - delete
  www - keep
  .gitignore - keep
  CHANGELOG.md - keep
  CONTRIBUTING.md - move to /dev
  LICENSE - keep
  README.md - keep
  SECURITY.md - keep
  TESTING.md - move to /dev
  netlify.toml - move to /www?
  package-lock.json - keep
  package.json - keep
  web-test-runner.config.mjs - delete (moved into /test)
* Copy the `htmx4` repo over the existing code
* Sanity check new codebase
* Commit, Push & Announce

## Merging 2.0 code

Merging from the 2.0 branch should be done via the `npm run merge` command, which will ignore changes in `/src`, `/dist` & `/test`
