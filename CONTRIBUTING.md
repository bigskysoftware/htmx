# Contributing
Thank you for your interest in contributing! Because we're a small team, we have a couple
contribution guidelines that make it easier for us to triage all the incoming suggestions.

tl;dr: if proposing a new feature, start with an issue; if you think your change is a bugfix or otherwise uncontroversial, feel free to PR, but know that we might close it and kick you back to an issue if more discussion is required.

Want to contribute but don't know where to start? Look for issues with the "help wanted" tag.

## Issues
1. Issues are the best place to propose a new feature. Keep in mind that htmx is a small library, so there are lots of great ideas that don't fit in the core; it's always best to check in about an idea before doing a bunch of work on it.
1. If you are adding a feature, consider doing it as an [extension](https://htmx.org/extensions). Even if we don't end up supporting it officially, you can publish it yourself and we can link to it.
1. Search the issues before proposing a feature to see if it is already under discussion. Referencing existing issues is a good way to increase the priority of your own.
1. We don't have an issue template yet, but the more detailed your explanation, the more quickly we'll be able to evaluate it.
1. See an issue that you also have? Give it a reaction (and comment, if you have something to add). We note that!

## Pull Requests
1. Open PRs represent issues that we're actively thinking working on merging (at a pace we can manage). If we think a proposal needs more discussion, or that the existing code would require a lot of back-and-forth to merge, we might close it and suggest you make an issue.
1. All PRs should be made against the `dev` branch, except documentation PRs (`www/` directory) which can be made against `master`.
1. Code, including tests, must be written in ES5 for [IE 11 compatibility](https://stackoverflow.com/questions/39902809/support-for-es6-in-internet-explorer-11).
1. Please include test cases in [`/test`](https://github.com/bigskysoftware/htmx/tree/dev/test) and docs in [`/www`](https://github.com/bigskysoftware/htmx/tree/dev/www).
1. Refactors that do not make functional changes will be automatically closed, unless explicitly solicited. Imagine someone came into your house unannounced, rearranged a bunch of furniture, and left.
1. Typo fixes in documentation are welcome, but if it's at all debatable we might just close it.

## Misc
1. If you think we closed something incorrectly, feel free to (politely) tell us why! We're human and make mistakes.
