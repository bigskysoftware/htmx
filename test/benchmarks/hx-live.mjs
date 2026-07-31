import path from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright'

const { values } = parseArgs({
    options: {
        case: { type: 'string', multiple: true, default: [] },
        rounds: { type: 'string', default: '6' },
        samples: { type: 'string', default: '20' }
    }
})

const cases = values.case.map(value => {
    let separator = value.indexOf('=')
    if (separator < 1 || separator === value.length - 1) {
        throw new Error(`Invalid case: ${value}. Use name=path.`)
    }
    return {
        name: value.slice(0, separator),
        root: path.resolve(value.slice(separator + 1))
    }
})

if (cases.length < 2) {
    console.error('Usage: bun run benchmark:hx-live -- --case <name=repo> --case <name=repo> [...]')
    process.exit(1)
}

const rounds = Number(values.rounds)
const samples = Number(values.samples)
const counts = [100, 500, 1000]

const percentile = (values, value) => {
    let sorted = values.toSorted((a, b) => a - b)
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))]
}

async function runRound(browser, root, expressionCount) {
    let page = await browser.newPage()
    await page.addScriptTag({ path: path.join(root, 'src/htmx.js') })
    await page.evaluate(() => {
        htmx.config.extensions = 'hx-live'
        htmx.__approvedExt = 'hx-live'
    })
    await page.addScriptTag({ path: path.join(root, 'src/ext/hx-live.js') })

    let result = await page.evaluate(async ({ expressionCount, samples }) => {
        let rows = expressionCount / 10
        document.body.innerHTML = `
            <input id="quantity" type="number" value="2">
            ${Array.from({ length: rows }, (_, index) => `
                <article class="row" data-price="${index + 1}">
                    <output :text="q('#quantity').value * data.price"></output>
                    <button :disabled="q('#quantity').value == 0">Buy</button>
                    <span :.bulk="q('#quantity').value >= 10">Bulk</span>
                    <span :aria-hidden="q('#quantity').value == 0">Details</span>
                    <output :data-total="q('#quantity').value * data.price"></output>
                    <input :value="q('#quantity').value">
                    <input type="checkbox" :checked="q('#quantity').value == 0">
                    <span class="state-marker" :class="{ zero: q('#quantity').value == 0, bulk: q('#quantity').value >= 10 }"></span>
                    <span :style="{ opacity: q('#quantity').value == 0 ? 0.5 : 1 }"></span>
                    <output :html="'<b>' + q('#quantity').value + '</b>'"></output>
                </article>
            `).join('')}
        `

        let start = performance.now()
        htmx.process(document.body)
        let registration = performance.now() - start

        let found = [...document.querySelectorAll('.row *')]
            .flatMap(elt => elt.getAttributeNames())
            .filter(name => name.startsWith(':')).length
        if (found !== expressionCount) throw new Error(`Expected ${expressionCount} expressions, found ${found}`)

        let refresh = async () => {
            htmx.live.refresh()
            // Flush the scheduled run and async binding continuations.
            await Promise.resolve()
            await Promise.resolve()
        }

        await new Promise(resolve => setTimeout(resolve))
        for (let index = 0; index < 5; index++) await refresh()

        let unchanged = []
        for (let index = 0; index < samples; index++) {
            start = performance.now()
            await refresh()
            unchanged.push(performance.now() - start)
        }

        let changed = []
        let quantity = document.querySelector('#quantity')
        let row = document.querySelector('.row')
        let [text, total, html] = row.querySelectorAll('output')
        let button = row.querySelector('button')
        let bulk = row.querySelector('span')
        let details = row.querySelector('span[aria-hidden]')
        let [valueInput, checkedInput] = row.querySelectorAll('input')
        let state = row.querySelector('.state-marker')
        let styled = row.querySelector('span[style]')

        for (let index = 0; index < samples; index++) {
            let value = index % 2 ? 0 : 10
            quantity.value = value
            start = performance.now()
            await refresh()
            changed.push(performance.now() - start)

            if (text.textContent !== String(value)) throw new Error('Text binding did not finish')
            if (button.disabled !== (value === 0)) throw new Error('Boolean binding did not finish')
            if (bulk.classList.contains('bulk') !== (value >= 10)) throw new Error('Class binding did not finish')
            if (details.getAttribute('aria-hidden') !== String(value === 0)) throw new Error('ARIA binding did not finish')
            if (total.dataset.total !== String(value)) throw new Error('Attribute binding did not finish')
            if (valueInput.value !== String(value)) throw new Error('Value binding did not finish')
            if (checkedInput.checked !== (value === 0)) throw new Error('Checked binding did not finish')
            if (state.classList.contains('zero') !== (value === 0)) throw new Error('Object class binding did not finish')
            if (state.classList.contains('bulk') !== (value >= 10)) throw new Error('Object class binding did not finish')
            if (styled.style.opacity !== (value === 0 ? '0.5' : '1')) throw new Error('Style binding did not finish')
            if (html.innerHTML !== `<b>${value}</b>`) throw new Error('HTML binding did not finish')
        }

        return { registration, unchanged, changed }
    }, { expressionCount, samples })
    await page.close()
    return result
}

const emptyMeasurements = () => ({ registration: [], unchanged: [], changed: [] })
for (let entry of cases) {
    entry.results = new Map(counts.map(count => [count, emptyMeasurements()]))
}

const format = values => `${percentile(values, 0.5).toFixed(2)} / ${percentile(values, 0.95).toFixed(2)}`
const speedup = (before, after) => `${(percentile(before, 0.5) / percentile(after, 0.5)).toFixed(1)}×`

let browser = await chromium.launch({ headless: true })
try {
    for (let entry of cases) console.log(`${entry.name}: ${entry.root}`)
    console.log(`Samples: ${rounds} rounds × ${samples}\n`)

    for (let expressionCount of counts) {
        for (let round = 0; round < rounds; round++) {
            let offset = round % cases.length
            let order = [...cases.slice(offset), ...cases.slice(0, offset)]
            for (let entry of order) {
                let run = await runRound(browser, entry.root, expressionCount)
                let result = entry.results.get(expressionCount)
                result.registration.push(run.registration)
                result.unchanged.push(...run.unchanged)
                result.changed.push(...run.changed)
            }
        }
    }

    console.log('Times are p50 / p95 milliseconds. Speedups compare with the first case.')
    for (let expressionCount of counts) {
        let before = cases[0].results.get(expressionCount)
        console.log(`\n${expressionCount} expressions`)
        console.table(cases.map(entry => {
            let result = entry.results.get(expressionCount)
            return {
                case: entry.name,
                registration: format(result.registration),
                unchanged: format(result.unchanged),
                changed: format(result.changed),
                'unchanged speedup': speedup(before.unchanged, result.unchanged),
                'changed speedup': speedup(before.changed, result.changed)
            }
        }))
    }
} finally {
    await browser.close()
}
