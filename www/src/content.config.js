/**
 * Astro requires every folder under src/content to be declared, or it
 * auto-generates collections and warns that doing so is deprecated.
 *
 * Nothing reads these. All content loading goes through lib/content.js.
 * They exist to keep the build quiet, so they carry no schemas.
 */

import {defineCollection} from "astro:content";
import {glob} from "astro/loaders";

const folder = (name) => defineCollection({
    loader: glob({base: `./src/content/${name}`, pattern: "**/*.{md,mdx}"}),
});

export const collections = {
    announcements: folder("announcements"),
    essays: folder("essays"),
    extensions: folder("extensions"),
    interviews: folder("interviews"),
    memes: folder("memes"),
    patterns: folder("patterns"),
    podcasts: folder("podcasts"),
    reference: folder("reference"),
};
