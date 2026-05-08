# Release checklist

* Ensure CHANGELOG.md is updated
* Bump version in all relevant files (js, package.json, markdown docs)
* Ensure build is up to date: `npm install; npm build`
* Update SHA `npm run update-sha`
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
