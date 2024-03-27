# Contributing
Thank you for your interest in contributing! Because we're a small team, we have a couple contribution guidelines that make it easier for us to triage all the incoming suggestions.

## Issues
1. Issues are the best place to propose a new feature. Keep in mind that htmx is a small library, so there are lots of great ideas that don't fit in the core; it's always best to check in about an idea before doing a bunch of work on it.
1. When proposing a new features, we will often suggest that you implement it as an [extension](https://htmx.org/extensions), so try that first. Even if we don't end up supporting it officially, you can publish it yourself and we can link to it.
1. Search the issues before proposing a feature to see if it is already under discussion. Referencing existing issues is a good way to increase the priority of your own.
1. We don't have an issue template yet, but the more detailed your description of the issue, the more quickly we'll be able to evaluate it.
1. See an issue that you also have? Give it a reaction (and comment, if you have something to add). We note that!
1. If you haven't gotten any traction on an issue, feel free to bump it in the #issues-and-pull-requests channel on our Discord.
1. Want to contribute but don't know where to start? Look for issues with the "help wanted" tag.

## Pull Requests
### Technical Requirements
1. Code, including tests, must be written in ES5 for [IE 11 compatibility](https://stackoverflow.com/questions/39902809/support-for-es6-in-internet-explorer-11).
1. All PRs must be made against the `dev` branch, except documentation PRs (that only modify the `www/` directory) which can be made against `master`.
1. Please avoid sending the `dist` files along your PR, only include the `src` ones.
1. Please include test cases in [`/test`](https://github.com/bigskysoftware/htmx/tree/dev/test) and docs in [`/www`](https://github.com/bigskysoftware/htmx/tree/dev/www).
1. We squash all PRs, so you're welcome to submit with as many commits as you like; they will be evaluated as a single, standalone change.

### Review Guidelines
1. Open PRs represent issues that we're actively thinking working on merging (at a pace we can manage). If we think a proposal needs more discussion, or that the existing code would require a lot of back-and-forth to merge, we might close it and suggest you make an issue.
1. Smaller PRs are easier and quicker to review. If we feel that the scope of your changes is too large, we will close the PR and try to suggest ways that the change could be broken down.
1. Please do not PR new features unless you have already made an issue proposing the feature, and had it accepted by a core maintainer. This helps us triage the features we can support before you put a lot of work into them.
1. Correspondingly, it is fine to directly PR bugfixes for behavior that htmx already guarantees, but please check if there's an issue first, and if you're not sure whether this *is* a bug, make an issue where we can hash it out..
1. Refactors that do not make functional changes will be automatically closed, unless explicitly solicited. Imagine someone came into your house unannounced, rearranged a bunch of furniture, and left.
1. Typo fixes in the documentation (not the code comments) are welcome, but formatting or debatable grammar changes will be automatically closed.

## Misc
1. If you think we closed something incorrectly, feel free to (politely) tell us why! We're human and make mistakes.
1. There are lots of ways to improve htmx besides code changes. Sometimes a problem can be solved with better docs, usage patterns, extensions, or community support. Talk to us and we can almost always help you get to a solution.
