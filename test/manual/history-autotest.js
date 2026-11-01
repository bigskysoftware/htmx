const http = require('http')
const fs = require('fs')
const path = require('path')

const LS_KEY = 'htmx_autotest'


// ---------------------------------------------------------------------------
// HOW TO READ THE OUTPUT
// ---------------------------------------------------------------------------
// Each line is prefixed [LOG]. Paste the full console output into an LLM and
// ask: "Did all tests pass? List any FAILs and their test IDs."
//
// PASS/FAIL lines look like:
//   [LOG] /t1/a | t1 | PASS - htmx restored /t1/a (history.state.htmx=true)
//   [LOG] /t1/a | t1 | FAIL - /t1/a not htmx-restored (historyState=null)
//
// What each test verifies:
//
//   T1  fresh load -> partial swaps (no push) -> htmx push to B -> back
//       PASS = history.state.htmx=true on back (stamp-on-swap tagged the entry)
//       FAIL = history.state is null/missing (entry was never stamped)
//
//   T2  plain location.href nav to B -> back
//       PASS = bfcache restored page A with the JS-appended div still present
//       FAIL = div is gone (bfcache was bypassed, page reloaded fresh)
//       NOTE: Chrome with DevTools open may disable bfcache -> FAIL is expected there
//
//   T3  htmx push A -> push B -> back -> back (two levels)
//       PASS = both backs show history.state.htmx=true
//       FAIL = either back lands without htmx state
//
//   T4  htmx push A -> back -> forward
//       PASS = both back and forward show history.state.htmx=true
//       FAIL = either traversal lands without htmx state
//
//   T5  POST form submit -> check history.state on result page
//       PASS = history.state=null (browser will prompt resubmit on F5, correct)
//       FAIL = history.state={htmx:true} (htmx wrongly tagged a POST result)
//
//   T6  long A -> htmx push short B -> back
//       PASS = scrollY on return to A is within 10% of saved position
//       FAIL = scrollY is 0 or far off (scroll not restored)
//       NOTE: Firefox may FAIL T6 — scroll restores before htmx outerSync swap
//             completes on a short B page. Known issue, not a regression.
//
//   T7  long A -> htmx push long B -> back
//       Same scroll check as T6 but B is also long (equal page heights).
//       PASS/FAIL criteria identical to T6.
//
//   T8  partial swap on A (no push) -> plain location.href to B -> back
//       PASS = history.state.htmx=true (stamp-on-swap tagged entry before nav)
//       FAIL = bfcache restored stale DOM, or plain reload without htmx state
//
//   T9  history-cache ext: push A -> push B -> back
//       PASS = content restored from sessionStorage cache (no HX-History-Restore server request)
//       FAIL = server was fetched (cache miss or ext not working)
//
//   T10 history-cache ext: POST form -> check history.state on result page
//       PASS = history.state=null (ext did NOT stamp the POST result entry)
//       FAIL = history.state has htmx/htmxId (ext wrongly stamped it, F5 won't prompt resubmit)
//
// Expected results:
//   Chrome (DevTools closed): T1-T10 all PASS
//   Chrome (DevTools open):   T1,T3-T10 PASS; T2 may FAIL (bfcache disabled)
//   Firefox:                  T1-T5,T7-T10 PASS; T6 may FAIL (scroll timing)
// ---------------------------------------------------------------------------

const masterScript = `
<script>
(function() {
    const LS = '${LS_KEY}'

    function log(msg) {
        const entry = location.pathname + ' | ' + msg
        console.log(entry)
        fetch('/log?' + encodeURIComponent(entry))
    }

    function getState() {
        try { return JSON.parse(localStorage.getItem(LS)) || {} } catch { return {} }
    }

    function setState(patch) {
        localStorage.setItem(LS, JSON.stringify(Object.assign(getState(), patch)))
    }

    function navInfo() {
        const nav = performance.getEntriesByType('navigation')[0]
        return 'navType=' + (nav ? nav.type : '?') +
               ' referrer=' + (document.referrer || '(none)') +
               ' historyState=' + JSON.stringify(history.state)
    }

    function htmxRestored() {
        return !!(history.state && history.state.htmx)
    }

    function next(test) {
        const order = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10']
        const idx = order.indexOf(test)
        const nextTest = order[idx + 1]
        if (nextTest) {
            log('--- advancing to ' + nextTest + ' ---')
            setState({ test: nextTest, step: 'navigate-to-a' })
            setTimeout(() => location.href = '/' + nextTest + '/a', 500)
        } else {
            log('ALL DONE')
            setState({ step: 'all-done' })
        }
    }

    function run() {
        const s = getState()
        log('run | test=' + s.test + ' step=' + s.step + ' | ' + navInfo())

        if (!s.test || location.pathname === '/') {
            localStorage.clear()
            setState({ test: 't1', step: 'navigate-to-a' })
            log('init -> navigating to /t1/a in 500ms')
            setTimeout(() => location.href = '/t1/a', 500)

        } else if (s.test === 't1') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t1/a') {
                setState({ step: 'swap1' })
                log('t1 | /t1/a fresh -> firing swap1')
                setTimeout(() => {
                    htmx.ajax('GET', '/t1/partial', { target: '#partial', swap: 'innerHTML' })
                        .then(() => {
                            log('t1 | swap1 done | ' + navInfo())
                            setState({ step: 'swap2' })
                            return htmx.ajax('GET', '/t1/partial', { target: '#partial', swap: 'innerHTML' })
                        })
                        .then(() => {
                            log('t1 | swap2 done | ' + navInfo())
                            setState({ step: 'push-to-b' })
                            setTimeout(() => htmx.ajax('GET', '/t1/b', { target: 'body', swap: 'outerHTML', push: 'true' }), 300)
                        })
                }, 500)
            } else if (s.step === 'push-to-b' && location.pathname === '/t1/b') {
                log('t1 | /t1/b arrived | ' + navInfo())
                setState({ step: 'back-to-a' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t1/a') {
                log('t1 | /t1/a back arrived | ' + navInfo())
                if (htmxRestored()) {
                    log('t1 | PASS - htmx restored /t1/a (history.state.htmx=true)')
                } else {
                    log('t1 | FAIL - /t1/a not htmx-restored (historyState=' + JSON.stringify(history.state) + ')')
                }
                setState({ step: 'done' })
                log('t1 | DONE')
                next('t1')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        } else if (s.test === 't2') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t2/a') {
                const marker = 't2-marker-' + Date.now()
                const div = document.createElement('div')
                div.id = marker
                div.textContent = marker
                document.body.appendChild(div)
                setState({ step: 'plain-link', t2Marker: marker })
                log('t2 | /t2/a fresh load | appended div id=' + marker + ' | ' + navInfo())
                setTimeout(() => location.href = '/t2/b', 500)
            } else if (s.step === 'plain-link' && location.pathname === '/t2/b') {
                log('t2 | /t2/b arrived | ' + navInfo())
                setState({ step: 'back-to-a' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t2/a') {
                const marker = getState().t2Marker
                const found = !!document.getElementById(marker)
                log('t2 | /t2/a back arrived | ' + navInfo())
                log('t2 | marker=' + marker + ' found=' + found)
                if (found) {
                    log('t2 | PASS - bfcache restored page with JS mutation intact')
                } else {
                    log('t2 | FAIL - mutation gone, bfcache was bypassed')
                }
                setState({ step: 'done' })
                log('t2 | DONE')
                next('t2')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        } else if (s.test === 't3') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t3/a') {
                setState({ step: 'push-to-b' })
                log('t3 | /t3/a arrived -> pushing to /t3/b')
                setTimeout(() => htmx.ajax('GET', '/t3/b', { target: 'body', swap: 'outerHTML', push: 'true' }), 500)
            } else if (s.step === 'push-to-b' && location.pathname === '/t3/b') {
                log('t3 | /t3/b arrived | ' + navInfo())
                setState({ step: 'push-to-c' })
                setTimeout(() => htmx.ajax('GET', '/t3/c', { target: 'body', swap: 'outerHTML', push: 'true' }), 500)
            } else if (s.step === 'push-to-c' && location.pathname === '/t3/c') {
                log('t3 | /t3/c arrived | ' + navInfo())
                setState({ step: 'back-to-b' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-b' && location.pathname === '/t3/b') {
                log('t3 | /t3/b back arrived | ' + navInfo())
                if (htmxRestored()) {
                    log('t3 | back#1 PASS - htmx restored /t3/b')
                } else {
                    log('t3 | back#1 FAIL - /t3/b not htmx-restored')
                }
                setState({ step: 'back-to-a' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t3/a') {
                log('t3 | /t3/a back arrived | ' + navInfo())
                if (htmxRestored()) {
                    log('t3 | back#2 PASS - htmx restored /t3/a')
                } else {
                    log('t3 | back#2 FAIL - /t3/a not htmx-restored')
                }
                setState({ step: 'done' })
                log('t3 | DONE')
                next('t3')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        } else if (s.test === 't4') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t4/a') {
                setState({ step: 'push-to-b' })
                log('t4 | /t4/a arrived -> pushing to /t4/b')
                setTimeout(() => htmx.ajax('GET', '/t4/b', { target: 'body', swap: 'outerHTML', push: 'true' }), 500)
            } else if (s.step === 'push-to-b' && location.pathname === '/t4/b') {
                log('t4 | /t4/b arrived | ' + navInfo())
                setState({ step: 'back-to-a' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t4/a') {
                log('t4 | /t4/a back arrived | ' + navInfo())
                if (htmxRestored()) {
                    log('t4 | back PASS - htmx restored /t4/a')
                } else {
                    log('t4 | back FAIL - /t4/a not htmx-restored')
                }
                setState({ step: 'forward-to-b' })
                setTimeout(() => history.forward(), 500)
            } else if (s.step === 'forward-to-b' && location.pathname === '/t4/b') {
                log('t4 | /t4/b forward arrived | ' + navInfo())
                if (htmxRestored()) {
                    log('t4 | forward PASS - htmx restored /t4/b')
                } else {
                    log('t4 | forward FAIL - /t4/b not htmx-restored')
                }
                setState({ step: 'done' })
                log('t4 | DONE')
                next('t4')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        } else if (s.test === 't5') {
            if (s.step === 'navigate-to-a' && (location.pathname === '/t5/form' || location.pathname === '/t5/a')) {
                setState({ step: 'submitted' })
                log('t5 | /t5/form arrived -> submitting form in 500ms')
                setTimeout(() => document.getElementById('t5form').submit(), 500)
            } else if (s.step === 'submitted' && location.pathname === '/t5/result') {
                log('t5 | /t5/result arrived | ' + navInfo())
                if (history.state === null) {
                    log('t5 | PASS - history.state=null on POST result (F5 will prompt resubmit)')
                } else {
                    log('t5 | FAIL - history.state=' + JSON.stringify(history.state) + ' (htmx tagged POST result)')
                }
                setState({ step: 'done' })
                log('t5 | DONE')
                next('t5')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        } else if (s.test === 't6') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t6/a') {
                log('t6 | /t6/a arrived')
                setTimeout(() => {
                    const target = Math.round(document.body.scrollHeight * 0.5)
                    window.scrollTo(0, target)
                    setTimeout(() => {
                        const actual = Math.round(window.scrollY)
                        setState({ step: 'push-to-b', t6ScrollY: actual })
                        log('t6 | scrolled to ' + actual + ' (target=' + target + ') scrollHeight=' + document.body.scrollHeight)
                        htmx.ajax('GET', '/t6/b-short', { target: 'body', swap: 'outerHTML', push: 'true' })
                    }, 300)
                }, 500)
            } else if (s.step === 'push-to-b' && location.pathname === '/t6/b-short') {
                log('t6 | /t6/b-short arrived | ' + navInfo())
                setState({ step: 'back-to-a' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t6/a') {
                const saved = getState().t6ScrollY
                setTimeout(() => {
                    const restored = Math.round(window.scrollY)
                    const diff = Math.abs(restored - saved)
                    const tolerance = Math.max(50, Math.round(saved * 0.1))
                    log('t6 | back | scrollY=' + restored + ' saved=' + saved + ' diff=' + diff + ' tolerance=' + tolerance)
                    if (diff <= tolerance) {
                        log('t6 | PASS - scroll restored (scrollY=' + restored + ' ~= saved=' + saved + ')')
                    } else {
                        log('t6 | FAIL - scroll not restored (scrollY=' + restored + ' saved=' + saved + ' diff=' + diff + ')')
                    }
                    setState({ step: 'done' })
                    log('t6 | DONE')
                    next('t6')
                }, 600)
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        } else if (s.test === 't7') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t7/a') {
                log('t7 | /t7/a arrived')
                setTimeout(() => {
                    const target = Math.round(document.body.scrollHeight * 0.5)
                    window.scrollTo(0, target)
                    setTimeout(() => {
                        const actual = Math.round(window.scrollY)
                        setState({ step: 'push-to-b', t7ScrollY: actual })
                        log('t7 | scrolled to ' + actual + ' (target=' + target + ') scrollHeight=' + document.body.scrollHeight)
                        htmx.ajax('GET', '/t7/b-long', { target: 'body', swap: 'outerHTML', push: 'true' })
                    }, 300)
                }, 500)
            } else if (s.step === 'push-to-b' && location.pathname === '/t7/b-long') {
                log('t7 | /t7/b-long arrived | ' + navInfo())
                setState({ step: 'back-to-a' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t7/a') {
                const saved = getState().t7ScrollY
                setTimeout(() => {
                    const restored = Math.round(window.scrollY)
                    const diff = Math.abs(restored - saved)
                    const tolerance = Math.max(50, Math.round(saved * 0.1))
                    log('t7 | back | scrollY=' + restored + ' saved=' + saved + ' diff=' + diff + ' tolerance=' + tolerance)
                    if (diff <= tolerance) {
                        log('t7 | PASS - scroll restored (scrollY=' + restored + ' ~= saved=' + saved + ')')
                    } else {
                        log('t7 | FAIL - scroll not restored (scrollY=' + restored + ' saved=' + saved + ' diff=' + diff + ')')
                    }
                    setState({ step: 'done' })
                    log('t7 | DONE')
                    next('t7')
                }, 600)
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        } else if (s.test === 't8') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t8/a') {
                setState({ step: 'swap-partial' })
                log('t8 | /t8/a arrived -> firing non-pushing partial swap')
                setTimeout(() => {
                    htmx.ajax('GET', '/t8/partial', { target: '#t8-partial', swap: 'innerHTML' })
                        .then(() => {
                            log('t8 | partial swap done | ' + navInfo())
                            setState({ step: 'plain-link' })
                            log('t8 | navigating to /t8/b via plain link')
                            setTimeout(() => location.href = '/t8/b', 300)
                        })
                }, 500)
            } else if (s.step === 'plain-link' && location.pathname === '/t8/b') {
                log('t8 | /t8/b arrived | ' + navInfo())
                setState({ step: 'back-to-a' })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t8/a') {
                log('t8 | /t8/a back arrived | ' + navInfo())
                if (htmxRestored()) {
                    log('t8 | PASS - htmx restored /t8/a (stamp-on-swap worked)')
                } else if (window._t2PageshowPersisted) {
                    log('t8 | FAIL - bfcache restored stale DOM (persisted=true)')
                } else {
                    const nav = performance.getEntriesByType('navigation')[0]
                    log('t8 | FAIL - plain reload, htmx did not tag entry (navType=' + (nav ? nav.type : '?') + ')')
                }
                setState({ step: 'done' })
                log('t8 | DONE')
                next('t8')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        // ---------------------------------------------------------------
        // TEST 9: history-cache ext: push A -> push B -> back
        // PASS: back restores from sessionStorage cache (no server fetch)
        // FAIL: server was hit with HX-History-Restore-Request (cache miss)
        // ---------------------------------------------------------------
        } else if (s.test === 't9') {
            if (s.step === 'navigate-to-a' && location.pathname === '/t9/a') {
                setState({ step: 'push-to-b' })
                log('t9 | /t9/a arrived -> pushing to /t9/b')
                setTimeout(() => htmx.ajax('GET', '/t9/b', { target: 'body', swap: 'outerHTML', push: 'true' }), 500)
            } else if (s.step === 'push-to-b' && location.pathname === '/t9/b') {
                log('t9 | /t9/b arrived | ' + navInfo())
                setState({ step: 'back-to-a' })
                // listen for cache hit before going back
                document.addEventListener('htmx:history:cache:hit', function onHit() {
                    document.removeEventListener('htmx:history:cache:hit', onHit)
                    setState({ t9CacheHit: true })
                    log('t9 | htmx:history:cache:hit fired')
                })
                setTimeout(() => history.back(), 500)
            } else if (s.step === 'back-to-a' && location.pathname === '/t9/a') {
                log('t9 | /t9/a back arrived | ' + navInfo())
                const cacheHit = !!getState().t9CacheHit
                log('t9 | cacheHit=' + cacheHit)
                if (cacheHit) {
                    log('t9 | PASS - content restored from cache (no server fetch)')
                } else {
                    log('t9 | FAIL - cache miss, server was fetched')
                }
                setState({ step: 'done' })
                log('t9 | DONE')
                next('t9')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }

        // ---------------------------------------------------------------
        // TEST 10: history-cache ext: POST form -> history.state must be null
        // PASS: history.state=null (ext did not stamp the POST result entry)
        // FAIL: history.state has htmx/htmxId (ext wrongly stamped it)
        // ---------------------------------------------------------------
        } else if (s.test === 't10') {
            if (s.step === 'navigate-to-a' && (location.pathname === '/t10/form' || location.pathname === '/t10/a')) {
                setState({ step: 'submitted' })
                log('t10 | /t10/form arrived -> submitting form in 500ms')
                setTimeout(() => document.getElementById('t10form').submit(), 500)
            } else if (s.step === 'submitted' && location.pathname === '/t10/result') {
                log('t10 | /t10/result arrived | ' + navInfo())
                if (history.state === null) {
                    log('t10 | PASS - history.state=null on POST result (ext did not stamp)')
                } else {
                    log('t10 | FAIL - history.state=' + JSON.stringify(history.state) + ' (ext stamped POST result)')
                }
                setState({ step: 'done' })
                log('t10 | DONE')
                next('t10')
            } else {
                log('unhandled | test=' + s.test + ' step=' + s.step + ' path=' + location.pathname)
            }
        }
    }

    let ran = false
    if (typeof htmx !== 'undefined') {
        htmx.on('htmx:after:process', function() {
            if (ran) return
            ran = true
            run()
        })
    } else {
        run()
    }

    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            ran = false
            run()
        }
    })
})()
</script>`


const longContent = (id) => Array.from({length: 40}, (_, i) =>
    `<p id="${id}-p${i}">Paragraph ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`
).join('')

const layoutWithCache = (title, body) => `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <script src="/htmx.js"><\/script>
    <script>htmx.config.extensions = 'history-cache'<\/script>
    <script src="/hx-history-cache.js"><\/script>
    <style>
        body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; }
        h1 { font-size: 1.2em; }
    </style>
</head>
<body>
    ${body}
    ${masterScript}
</body>
</html>`

const layout = (title, body) => `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <script src="/htmx.js"><\/script>
    <style>
        body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; }
        h1 { font-size: 1.2em; }
        .status { background: #f5f5f5; padding: 10px 14px; border-radius: 4px; font-family: monospace; font-size: 0.85em; }
    </style>
</head>
<body>
    ${body}
    ${masterScript}
</body>
</html>`

const pages = {
    '/': () => layout('htmx History Auto Tests', `
        <h1>htmx History Auto Tests</h1>
        <p class="status">Tests running &mdash; watch the server console for [LOG] lines.<br>
        The suite finishes automatically. Paste the full output into an LLM to verify results.</p>
    `),

    '/t1/a':       () => layout('T1: Page A', `<h1>T1 &mdash; Page A</h1><div id="partial">partial target</div>`),
    '/t1/partial': () => `<span>swapped at ${new Date().toISOString()}</span>`,
    '/t1/b':       () => layout('T1: Page B', `<h1>T1 &mdash; Page B</h1>`),

    '/t2/a': () => layout('T2: Page A', `<h1>T2 &mdash; Page A</h1>`),
    '/t2/b': () => layout('T2: Page B', `<h1>T2 &mdash; Page B</h1>`),

    '/t3/a': () => layout('T3: Page A', `<h1>T3 &mdash; Page A</h1>`),
    '/t3/b': () => layout('T3: Page B', `<h1>T3 &mdash; Page B</h1>`),
    '/t3/c': () => layout('T3: Page C', `<h1>T3 &mdash; Page C</h1>`),

    '/t4/a': () => layout('T4: Page A', `<h1>T4 &mdash; Page A</h1>`),
    '/t4/b': () => layout('T4: Page B', `<h1>T4 &mdash; Page B</h1>`),

    '/t5/form': () => layout('T5: POST Form', `
        <h1>T5 &mdash; POST form</h1>
        <form id="t5form" method="POST" action="/t5/result">
            <input type="hidden" name="data" value="test">
        </form>
    `),
    '/t5/result': (req) => new Promise(resolve => {
        let body = ''
        req.on('data', c => body += c)
        req.on('end', () => resolve(layout('T5: POST Result', `<h1>T5 &mdash; POST Result</h1>`)))
    }),

    '/t6/a':       () => layout('T6: Long Page A', `<h1>T6 &mdash; Long Page A (scroll test, short B)</h1>${longContent('t6a')}`),
    '/t6/b-short': () => layout('T6: Short Page B', `<h1>T6 &mdash; Short Page B</h1><p>This page is short.</p>`),

    '/t7/a':      () => layout('T7: Long Page A', `<h1>T7 &mdash; Long Page A (scroll test, long B)</h1>${longContent('t7a')}`),
    '/t7/b-long': () => layout('T7: Long Page B', `<h1>T7 &mdash; Long Page B</h1>${longContent('t7b')}`),

    '/t8/a':       () => layout('T8: Page A', `<h1>T8 &mdash; Page A</h1><div id="t8-partial">original content</div>`),
    '/t8/partial': () => `<span>swapped at ${new Date().toISOString()}</span>`,
    '/t8/b':       () => layout('T8: Page B', `<h1>T8 &mdash; Page B</h1>`),

    // T9 — uses history-cache extension
    '/t9/a': () => layoutWithCache('T9: Page A', `<h1>T9 &mdash; Page A (history-cache)</h1><p id="t9-content">original A content</p>`),
    '/t9/b': () => layoutWithCache('T9: Page B', `<h1>T9 &mdash; Page B (history-cache)</h1>`),

    // T10 — uses history-cache extension, POST form
    '/t10/form': () => layoutWithCache('T10: POST Form', `
        <h1>T10 &mdash; POST form (history-cache)</h1>
        <form id="t10form" method="POST" action="/t10/result">
            <input type="hidden" name="data" value="test">
        </form>
    `),
    '/t10/result': (req) => new Promise(resolve => {
        let body = ''
        req.on('data', c => body += c)
        req.on('end', () => resolve(layoutWithCache('T10: POST Result', `<h1>T10 &mdash; POST Result</h1>`)))
    }),
}

pages['/t5/a'] = pages['/t5/form']
pages['/t10/a'] = pages['/t10/form']

function shutdown(reason) {
    console.log('\n[EXIT]', reason)
    server.close(() => process.exit(0))
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const pathname = url.pathname

    if (pathname === '/hx-history-cache.js') {
        try {
            const content = fs.readFileSync(path.join(__dirname, '../../src/ext/hx-history-cache.js'), 'utf8')
            res.writeHead(200, { 'Content-Type': 'application/javascript' })
            return res.end(content)
        } catch (e) {
            res.writeHead(500)
            return res.end('Could not read ../../src/ext/hx-history-cache.js: ' + e.message)
        }
    }

    if (pathname === '/htmx.js') {
        try {
            const content = fs.readFileSync(path.join(__dirname, '../../src/htmx.js'), 'utf8')
            res.writeHead(200, { 'Content-Type': 'application/javascript' })
            return res.end(content)
        } catch (e) {
            res.writeHead(500)
            return res.end('Could not read ../../src/htmx.js: ' + e.message)
        }
    }

    if (pathname === '/log') {
        const msg = decodeURIComponent(url.search.slice(1))
        console.log('[LOG]', msg)
        if (msg.includes('ALL DONE')) shutdown('all tests done')
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' })
        return res.end('ok')
    }

    const handler = pages[pathname]
    if (!handler) { res.writeHead(404); return res.end('Not found') }

    const isHtmxRestore = req.headers['hx-history-restore-request'] === 'true'
    const isHtmxRequest = req.headers['hx-request'] === 'true'
    console.log(`${req.method} ${req.url}` + (isHtmxRestore ? ' [HX-History-Restore]' : isHtmxRequest ? ' [HX-Request]' : ''))
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(await handler(req))
})

const killTimer = setTimeout(() => shutdown('60s timeout'), 60000)
killTimer.unref()

server.listen(3002, () => {
    console.log('htmx History Auto Test Suite')
    console.log('http://localhost:3002')
    console.log('')
    console.log('  Open the URL in a browser (DevTools CLOSED for accurate bfcache results).')
    console.log('  Tests run automatically. This process exits when all tests complete.')
    console.log('')
    console.log('  T1  partial swaps (no push) -> htmx push -> back          PASS: history.state.htmx=true')
    console.log('  T2  plain nav to B -> back                                 PASS: bfcache preserved JS mutation')
    console.log('  T3  push A -> push B -> back -> back (two levels)          PASS: both backs htmx-restored')
    console.log('  T4  push -> back -> forward                                PASS: both traversals htmx-restored')
    console.log('  T5  POST form -> result page                               PASS: history.state=null')
    console.log('  T6  long A -> push short B -> back                         PASS: scrollY restored within 10%')
    console.log('  T7  long A -> push long B -> back                          PASS: scrollY restored within 10%')
    console.log('  T8  partial swap (no push) -> plain nav -> back            PASS: history.state.htmx=true')
    console.log('  T9  history-cache: push A -> push B -> back                PASS: cache hit, no server fetch')
    console.log('  T10 history-cache: POST form -> result page                PASS: history.state=null')
    console.log('')
    console.log('  Known: T2 may FAIL in Chrome with DevTools open (bfcache disabled).')
    console.log('  Known: T6 may FAIL in Firefox (scroll timing with short B page).')
    console.log('')
    console.log('  Paste the full [LOG] output into an LLM to verify all results.')
    console.log('')
    console.log('Serving htmx from ../../src/htmx.js')
    console.log('Serving history-cache ext from ../../src/ext/hx-history-cache.js')
})
