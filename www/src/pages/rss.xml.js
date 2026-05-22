/**
 * /rss.xml — RSS 2.0 feed of essays + interviews.
 *
 * New endpoint (the old Zola site only emitted Atom). Both feeds are built
 * from the same source via lib/feed.js → drift is impossible.
 */

import { buildFeed } from '../lib/feed';

/** @type {import('astro').APIRoute} */
export const GET = async (context) => {
    const feed = await buildFeed(context.site);
    return new Response(feed.rss2(), {
        status: 200,
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
};
