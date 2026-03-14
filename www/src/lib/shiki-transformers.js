/**
 * Shiki transformer that adds a macOS-style header with dots and a copy button to code blocks
 */
export const codeBlockTransformer = {
    pre(node) {
        // Add 'group' class to pre for hover effects
        const existingClasses = node.properties.class || '';
        node.properties.class = `${existingClasses} group`.trim();

        // Add macOS-style header with dots
        /** @type {import('hast').Element} */
        const header = {
            type: 'element',
            tagName: 'div',
            properties: {
                class: 'sticky left-0 z-10 flex gap-1.5 px-3 py-2 bg-neutral-50 dark:bg-neutral-920 border-b border-neutral-100 dark:border-neutral-900 rounded-t-[3px]'
            },
            children: [
                {
                    type: 'element',
                    tagName: 'div',
                    properties: {class: 'size-2.25 rounded-full bg-neutral-200 dark:bg-neutral-800'},
                    children: []
                },
                {
                    type: 'element',
                    tagName: 'div',
                    properties: {class: 'size-2.25 rounded-full bg-neutral-200 dark:bg-neutral-800'},
                    children: []
                },
                {
                    type: 'element',
                    tagName: 'div',
                    properties: {class: 'size-2.25 rounded-full bg-neutral-200 dark:bg-neutral-800'},
                    children: []
                }
            ]
        };

        // Add copy button (visible on mobile, hover on desktop)
        /** @type {import('hast').Element} */
        const button = {
            type: 'element',
            tagName: 'button',
            properties: {
                class: 'z-20 absolute top-9 right-2 size-8 flex items-center justify-center select-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded opacity-100 lg:opacity-0 data-copied:opacity-100 group-interact:opacity-100 focus-visible:opacity-100 transition text-neutral-600 dark:text-neutral-400 interact:bg-neutral-75 dark:interact:bg-neutral-875 interact:border-neutral-400 dark:interact:border-neutral-600 interact:text-neutral-900 dark:interact:text-white outline-hidden focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-400 cursor-pointer before:content-["Copied!"] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:mr-2 before:px-2 before:py-1 before:text-xs before:font-semibold before:text-white before:bg-neutral-900 dark:before:bg-neutral-100 dark:before:text-neutral-900 before:rounded before:whitespace-nowrap before:opacity-0 before:pointer-events-none data-copied:before:opacity-100 before:transition',
                _: `on click
                        -- Note: iOS Safari requires HTTPS for clipboard API (won't work on localhost)
                        writeText(textContent of last <code/> in closest <pre/>) into navigator.clipboard
                        add .icon-\\[radix-icons--check\\] to first <i/> in me
                        remove .icon-\\[radix-icons--copy\\] from first <i/> in me
                        set @title of me to 'Copied!'
                        add @data-copied
                        put 'Copied!' into #status-bar
                        wait 2s
                        add .icon-\\[radix-icons--copy\\] to first <i/> in me
                        remove .icon-\\[radix-icons--check\\] from first <i/> in me
                        set @title of me to 'Copy to clipboard'
                        remove @data-copied
                        put '' into #status-bar`,
                title: 'Copy to clipboard'
            },
            children: [
                {
                    type: 'element',
                    tagName: 'i',
                    properties: {
                        class: 'size-4 icon-[radix-icons--copy]',
                    },
                    children: []
                }
            ]
        };

        // Make pre unfocusable (code inside is the scrollable element)
        node.properties.tabindex = '-1';

        // Add header and button as first children
        // @ts-ignore - type inference issue with hast nodes
        node.children.unshift(button, header);
    }
};
