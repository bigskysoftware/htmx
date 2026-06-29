/**
 * /atom.xml — Atom 1.0 feed of essays + interviews.
 *
 * Preserves the old htmx.org Zola-generated feed URL so existing RSS
 * subscriptions and inbound backlinks keep working after the Astro migration.
 */

import { buildFeed } from '../lib/feed';

/** @type {import('astro').APIRoute} */
export const GET = async (context) => {
    const feed = await buildFeed(context.site);
    return new Response(feed.atom1(), {
        status: 200,
        headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
    });
};
