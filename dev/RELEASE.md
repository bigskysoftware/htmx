# Release checklist

* Ensure CHANGELOG.md is updated
* Bump version by hand in:
  * `package.json` (then `npm install` to sync `package-lock.json`)
  * `src/htmx.js`
  * `README.md`
* Ensure build is up to date: `npm install; npm run build`
* `npm run check:dist` (fails if `dist/ext` has leftovers or missing files)
* Update SHA `npm run update-sha` (also writes version to `www/src/data/integrity.json`)
* Run Tests
  * `npm run test:all`
  * `npm run upgrade-check:test`
* Update website `npm run www:build`
* Commit all changes
* Tag `git tag vX.Y.Z`
* Push (including tags)
* Publish to npm. While 2.x remains `latest`, 4.x releases use:
  `npm publish --tag next`
* Create github release with all dist assets. If the version contains `-`
  (`-alpha`, `-beta`, `-rc`), pass `--prerelease` so GitHub Latest stays on a
  real GA tag:
  ```bash
  gh release create vX.Y.Z --title "vX.Y.Z" --notes-from-tag \
    [--prerelease] \
    dist/*.js dist/*.br dist/*.map dist/*.d.ts \
    dist/ext/*.js dist/ext/*.br dist/ext/*.map
  ```
* Announce
