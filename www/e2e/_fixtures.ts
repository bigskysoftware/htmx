import { test as base, expect } from '@playwright/test';

export const test = base;
export { expect };

/** Pages that use the content layout with main#main-content */
export const TOP_LEVEL_PAGES = ['/', '/docs', '/reference', '/patterns', '/essays'];

/** Standalone pages without main#main-content */
export const STANDALONE_PAGES = ['/about', '/webring'];

/** Navigation items in header */
export const NAV_ITEMS = ['docs', 'reference', 'patterns', 'essays', 'about'];
