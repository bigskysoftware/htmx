import { expect, test } from './_fixtures';

const ATOM = '/atom.xml';
const RSS  = '/rss.xml';

test.describe('Feeds', () => {
    // Content-Type subtype check uses a loose XML regex. Prerendered .xml
    // files are served by extension by static hosts (Astro preview emits
    // `text/xml`; Netlify production emits `application/atom+xml` via
    // public/_headers). Readers sniff content rather than the subtype.
    test(`${ATOM} responds 200 with XML Content-Type`, async ({ request }) => {
        const res = await request.get(ATOM);
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toMatch(/xml/);
    });

    test(`${RSS} responds 200 with XML Content-Type`, async ({ request }) => {
        const res = await request.get(RSS);
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toMatch(/xml/);
    });

    test(`${ATOM} parses as Atom 1.0 with entries`, async ({ request }) => {
        const body = await (await request.get(ATOM)).text();
        expect(body).toMatch(/<feed[^>]*xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
        const entries = body.match(/<entry>/g) ?? [];
        expect(entries.length).toBeGreaterThan(10);
    });

    test(`${RSS} parses as RSS 2.0 with items`, async ({ request }) => {
        const body = await (await request.get(RSS)).text();
        expect(body).toMatch(/<rss[^>]*version="2\.0"/);
        const items = body.match(/<item>/g) ?? [];
        expect(items.length).toBeGreaterThan(10);
    });

    test('atom and rss have identical entry counts', async ({ request }) => {
        const atomBody = await (await request.get(ATOM)).text();
        const rssBody  = await (await request.get(RSS)).text();
        const atomCount = (atomBody.match(/<entry>/g) ?? []).length;
        const rssCount  = (rssBody.match(/<item>/g) ?? []).length;
        expect(atomCount).toBe(rssCount);
    });

    test(`${ATOM} entry links are absolute https URLs`, async ({ request }) => {
        const body = await (await request.get(ATOM)).text();
        // Every <link href="..."/> inside an <entry> must be absolute.
        const entryBlock = body.split('<entry>').slice(1).join('<entry>');
        const links = [...entryBlock.matchAll(/<link[^>]*href="([^"]+)"/g)].map(m => m[1]);
        expect(links.length).toBeGreaterThan(0);
        for (const href of links) {
            expect(href).toMatch(/^https?:\/\//);
        }
    });

    test('feed content does not leak raw MDX imports or JSX', async ({ request }) => {
        const body = await (await request.get(ATOM)).text();
        // MDX `import` statements and bare JSX opener tags must be stripped.
        expect(body).not.toMatch(/^\s*import\s+\w+\s+from\s+['"]/m);
        expect(body).not.toMatch(/<[A-Z][A-Za-z0-9]+\s/);
    });

    test('feed content embeds absolutized root-relative URLs', async ({ request }) => {
        const body = await (await request.get(ATOM)).text();
        // Active hrefs/srcs in entry HTML must be absolute. Strip <pre>/<code>
        // first: those contain pedagogical HTML examples where literal relative
        // paths are intentional (and the `<` is entity-escaped, so they are not
        // active markup — they render as text).
        const cdataBlocks = [...body.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)].map(m => m[1]).join('\n');
        const stripped = cdataBlocks
            .replace(/<pre\b[\s\S]*?<\/pre>/gi, '')
            .replace(/<code\b[\s\S]*?<\/code>/gi, '');
        expect(stripped).not.toMatch(/\s(href|src)="\/[^/]/);
    });
});
