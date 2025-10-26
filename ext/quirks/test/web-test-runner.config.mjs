import {
  summaryReporter,
  defaultReporter
} from '@web/test-runner'

const config = {
  testRunnerHtml: (testFramework) => `
  <html lang="en">
<head>
    <meta charset="utf-8" />
    <title>htmx-quirks-mode Tests</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="htmx:config" content='{"sse":true,"logAll":true}'>
    <style>
        ::view-transition-group(*),
        ::view-transition-old(*),
        ::view-transition-new(*) {
            animation-duration: 0s;
        }
    </style>
</head>
<body>

<h2>htmx-quirks-mode Extension Test Suite</h2>

<script src="test/lib/chai.js"></script>
<script src="test/lib/fetch-mock.js"></script>
<script src="test/lib/sse-mock.js"></script>
<script src="test/lib/htmx.js"></script>
<script src="src/htmxQuirks.js"></script>

<script class="quirks-init">
    htmxQuirks.enableAllQuirks()
</script>

<script class="mocha-init">
    window.should = window.chai.should()
    window.assert = window.chai.assert
</script>

<script src="test/lib/helpers.js"></script>
<script type="module" src="${testFramework}"></script>

<div id="test-playground"></div>

</body>
</html>`,

  nodeResolve: {
    exportConditions: ['browser', 'development']
  },
  files: [
    'test/tests/**/*.js'
  ],
  reporters: [summaryReporter({ flatten: false, reportTestLogs: false, reportTestErrors: true }), defaultReporter({ reportTestProgress: true, reportTestResults: true })]
}

export default config