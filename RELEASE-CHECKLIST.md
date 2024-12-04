## Intercooler Release Checklist

### Ready
* Ensure correct version numbers are in `bower.json` and `package.json`
* Run /test/gen_tests.rb to ensure all tests are up to date
* Run /node_modules/.bin/grunt to generate latest version of intercooler release and tests
* Search and replace current version for new version in `/www`
  * Do not replace in `download.html`, `CHANGES.html`, and `www/release`

### Aim

* Ensure there is an entry in `CHANGES.html` with a proper anchor
* Add an entry in `downloads.html` for the new release, that points to the proper files in `/releases`
* _OPTIONAL:_ Hide an older release by moving it to the `#older` list
* Create a blog post for the release in `www/_posts`
* Run **ALL** test files in Chrome, Firefox and Safari browsers (run jekyll locally)

### Fire!

* Run `git tag vRELEASEVERSION`
* Checkout `master` and merge `development`
* Run `git push origin --tags`
* Run `npm publish` to publish to NPM
