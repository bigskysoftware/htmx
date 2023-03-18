// https://htmx.org/reference/#api

/**
 * This method adds a class to the given element.
 *
 * https://htmx.org/api/#addClass
 *
 * @param elt the element to add the class to
 * @param clazz the class to add
 * @param delay the delay (in milliseconds before class is added)
 */
export function addClass(elt: Element, clazz: string, delay?: number): void;

/**
 * Issues an htmx-style AJAX request
 *
 * https://htmx.org/api/#ajax
 *
 * @param verb 'GET', 'POST', etc.
 * @param path the URL path to make the AJAX
 * @param element the element to target (defaults to the **body**)
 */
export function ajax(verb: string, path: string, element: Element): void;

/**
 * Issues an htmx-style AJAX request
 *
 * https://htmx.org/api/#ajax
 *
 * @param verb 'GET', 'POST', etc.
 * @param path the URL path to make the AJAX
 * @param selector a selector for the target
 */
export function ajax(verb: string, path: string, selector: string): void;

/**
 * Issues an htmx-style AJAX request
 *
 * https://htmx.org/api/#ajax
 *
 * @param verb 'GET', 'POST', etc.
 * @param path the URL path to make the AJAX
 * @param context a context object that contains any of the following
 */
export function ajax(
    verb: string,
    path: string,
    context: Partial<{ source: any; event: any; handler: any; target: any; values: any; headers: any }>
): void;

/**
 * Finds the closest matching element in the given elements parentage, inclusive of the element
 *
 * https://htmx.org/api/#closest
 *
 * @param elt the element to find the selector from
 * @param selector the selector to find
 */
export function closest(elt: Element, selector: string): Element | null;

/**
 * A property holding the configuration htmx uses at runtime.
 *
 * Note that using a [meta tag](https://htmx.org/docs/#config) is the preferred mechanism for setting these properties.
 *
 * https://htmx.org/api/#config
 */
export var config: HtmxConfig;

/**
 * A property used to create new [Server Sent Event](https://htmx.org/docs/#sse) sources. This can be updated to provide custom SSE setup.
 *
 * https://htmx.org/api/#createEventSource
 */
export var createEventSource: (url: string) => EventSource;

/**
 * A property used to create new [WebSocket](https://htmx.org/docs/#websockets). This can be updated to provide custom WebSocket setup.
 *
 * https://htmx.org/api/#createWebSocket
 */
export var createWebSocket: (url: string) => WebSocket;

/**
 * Defines a new htmx [extension](https://htmx.org/extensions).
 *
 * https://htmx.org/api/#defineExtension
 *
 * @param name the extension name
 * @param ext the extension definition
 */
export function defineExtension(name: string, ext: HtmxExtension): void;

/**
 * Finds an element matching the selector
 *
 * https://htmx.org/api/#find
 *
 * @param selector the selector to match
 */
export function find(selector: string): Element | null;

/**
 * Finds an element matching the selector
 *
 * https://htmx.org/api/#find
 *
 * @param elt the root element to find the matching element in, inclusive
 * @param selector the selector to match
 */
export function find(elt: Element, selector: string): Element | null;

/**
 * Finds all elements matching the selector
 *
 * https://htmx.org/api/#findAll
 *
 * @param selector the selector to match
 */
export function findAll(selector: string): NodeListOf<Element>;

/**
 * Finds all elements matching the selector
 *
 * https://htmx.org/api/#findAll
 *
 * @param elt the root element to find the matching elements in, inclusive
 * @param selector the selector to match
 */
export function findAll(elt: Element, selector: string): NodeListOf<Element>;

/**
 * Log all htmx events, useful for debugging.
 *
 * https://htmx.org/api/#logAll
 */
export function logAll(): void;

/**
 * The logger htmx uses to log with
 *
 * https://htmx.org/api/#logger
 */
export var logger: (elt: Element, eventName: string, detail: any) => void | null;

/**
 * Removes an event listener from an element
 *
 * https://htmx.org/api/#off
 *
 * @param eventName the event name to remove the listener from
 * @param listener the listener to remove
 */
export function off(eventName: string, listener: (evt: Event) => void): (evt: Event) => void;

/**
 * Removes an event listener from an element
 *
 * https://htmx.org/api/#off
 *
 * @param target the element to remove the listener from
 * @param eventName the event name to remove the listener from
 * @param listener the listener to remove
 */
export function off(target: string, eventName: string, listener: (evt: Event) => void): (evt: Event) => void;

/**
 * Adds an event listener to an element
 *
 * https://htmx.org/api/#on
 *
 * @param eventName the event name to add the listener for
 * @param listener the listener to add
 */
export function on(eventName: string, listener: (evt: Event) => void): (evt: Event) => void;

/**
 * Adds an event listener to an element
 *
 * https://htmx.org/api/#on
 *
 * @param target the element to add the listener to
 * @param eventName the event name to add the listener for
 * @param listener the listener to add
 */
export function on(target: string, eventName: string, listener: (evt: Event) => void): (evt: Event) => void;

/**
 * Adds a callback for the **htmx:load** event. This can be used to process new content, for example initializing the content with a javascript library
 *
 * https://htmx.org/api/#onLoad
 *
 * @param callback the callback to call on newly loaded content
 */
export function onLoad(callback: (element: Element) => void): void;

/**
 * Parses an interval string consistent with the way htmx does. Useful for plugins that have timing-related attributes.
 *
 * Caution: Accepts an int followed by either **s** or **ms**. All other values use **parseFloat**
 *
 * https://htmx.org/api/#parseInterval
 *
 * @param str timing string
 */
export function parseInterval(str: string): number;

/**
 * Processes new content, enabling htmx behavior. This can be useful if you have content that is added to the DOM outside of the normal htmx request cycle but still want htmx attributes to work.
 *
 * https://htmx.org/api/#process
 *
 * @param element element to process
 */
export function process(element: Element): void;

/**
 * Removes an element from the DOM
 *
 * https://htmx.org/api/#remove
 *
 * @param elt element to remove
 * @param delay the delay (in milliseconds before element is removed)
 */
export function remove(elt: Element, delay?: number): void;

/**
 * Removes a class from the given element
 *
 * https://htmx.org/api/#removeClass
 *
 * @param elt element to remove the class from
 * @param clazz the class to remove
 * @param delay the delay (in milliseconds before class is removed)
 */
export function removeClass(elt: Element, clazz: string, delay?: number): void;

/**
 * Removes the given extension from htmx
 *
 * https://htmx.org/api/#removeExtension
 *
 * @param name the name of the extension to remove
 */
export function removeExtension(name: string): void;

/**
 * Takes the given class from its siblings, so that among its siblings, only the given element will have the class.
 *
 * https://htmx.org/api/#takeClass
 *
 * @param elt the element that will take the class
 * @param clazz the class to take
 */
export function takeClass(elt: Element, clazz: string): void;

/**
 * Toggles the given class on an element
 *
 * https://htmx.org/api/#toggleClass
 *
 * @param elt the element to toggle the class on
 * @param clazz the class to toggle
 */
export function toggleClass(elt: Element, clazz: string): void;

/**
 * Triggers a given event on an element
 *
 * https://htmx.org/api/#trigger
 *
 * @param elt the element to trigger the event on
 * @param name the name of the event to trigger
 * @param detail details for the event
 */
export function trigger(elt: Element, name: string, detail: any): void;

/**
 * Returns the input values that would resolve for a given element via the htmx value resolution mechanism
 *
 * https://htmx.org/api/#values
 *
 * @param elt the element to resolve values on
 * @param requestType the request type (e.g. **get** or **post**) non-GET's will include the enclosing form of the element. Defaults to **post**
 */
export function values(elt: Element, requestType?: string): any;

export const version: string;

export interface HtmxConfig {
    /** array of strings: the attributes to settle during the settling phase */
    attributesToSettle?: ["class", "style", "width", "height"] | string[];
    /** the default delay between completing the content swap and settling attributes */
    defaultSettleDelay?: number;
    /** the default delay between receiving a response from the server and doing the swap */
    defaultSwapDelay?: number;
    /** the default swap style to use if **[hx-swap](https://htmx.org/attributes/hx-swap)** is omitted */
    defaultSwapStyle?: "innerHTML" | string;
    /** the number of pages to keep in **localStorage** for history support */
    historyCacheSize?: number;
    /** whether or not to use history */
    historyEnabled?: boolean;
    /** if true, htmx will inject a small amount of CSS into the page to make indicators invisible unless the **htmx-indicator** class is present */
    includeIndicatorStyles?: boolean;
    /** the class to place on indicators when a request is in flight */
    indicatorClass?: "htmx-indicator" | string;
    /** the class to place on triggering elements when a request is in flight */
    requestClass?: "htmx-request" | string;
    /** the class to temporarily place on elements that htmx has added to the DOM */
    addedClass?: "htmx-added" | string;
    /** the class to place on target elements when htmx is in the settling phase */
    settlingClass?: "htmx-settling" | string;
    /** the class to place on target elements when htmx is in the swapping phase */
    swappingClass?: "htmx-swapping" | string;
    /** allows the use of eval-like functionality in htmx, to enable **hx-vars**, trigger conditions & script tag evaluation. Can be set to **false** for CSP compatibility */
    allowEval?: boolean;
    /** use HTML template tags for parsing content from the server. This allows you to use Out of Band content when returning things like table rows, but it is *not* IE11 compatible. */
    useTemplateFragments?: boolean;
    /** allow cross-site Access-Control requests using credentials such as cookies, authorization headers or TLS client certificates */
    withCredentials?: boolean;
    /** the default implementation of **getWebSocketReconnectDelay** for reconnecting after unexpected connection loss by the event code **Abnormal Closure**, **Service Restart** or **Try Again Later** */
    wsReconnectDelay?: "full-jitter" | string | ((retryCount: number) => number);
    // following don't appear in the docs
    refreshOnHistoryMiss?: boolean;
    timeout?: number;
    disableSelector?: "[hx-disable], [data-hx-disable]" | string;
    scrollBehavior?: "smooth";
}

/**
 * https://htmx.org/extensions/#defining
 */
export interface HtmxExtension {
    onEvent?: (name: string, evt: CustomEvent) => any;
    transformResponse?: (text: any, xhr: XMLHttpRequest, elt: any) => any;
    isInlineSwap?: (swapStyle: any) => any;
    handleSwap?: (swapStyle: any, target: any, fragment: any, settleInfo: any) => any;
    encodeParameters?: (xhr: XMLHttpRequest, parameters: any, elt: any) => any;
}
