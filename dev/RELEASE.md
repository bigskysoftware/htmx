# Release checklist

* Ensure CHANGELOG.md is updated
* Bump version by hand in:
  * `package.json` (then `npm install` to sync `package-lock.json`)
  * `src/htmx.js`
  * `README.md`
* Ensure build is up to date: `npm install; npm build`
* Update SHA `npm run update-sha` (also writes version to `www/src/data/integrity.json`)
* Run Tests
  * `npm run test:all`
  * `npm run upgrade-check:test`
* Update website `npm run www:build`
* Commit all changes
* Tag `git tag vX.Y.Z`
* Push (including tags)
* `npm publish`
* Create github release with all dist assets:
  ```bash
  gh release create vX.Y.Z --title "vX.Y.Z" --notes-from-tag \
    dist/*.js dist/*.br dist/*.map dist/*.d.ts \
    dist/ext/*.js dist/ext/*.br dist/ext/*.map
  ```
* Announce
