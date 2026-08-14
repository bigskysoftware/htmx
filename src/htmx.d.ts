export namespace HxLive {
  /** Configures the hx-live extension. */
  export interface Config {
    /**
     * Debounces `input` events by a number of milliseconds or an interval string.
     * @default 100
     */
    inputDebounce?: number | string;
    /**
     * Sets the short binding prefix (`':'` -> `:text`, `'hx:'` -> `hx:text`, `''`/`false` -> disabled).
     * Alpine.js detection disables the default.
     * @default ":"
     */
    bindPrefix?: string | false;
    /**
     * Adds `$()` as a `q()` alias in `hx-live`, `:attr`, `hx-on`, `js:` attributes, and `hx-trigger` filters.
     * @default false
     */
    useDollar?: boolean;
  }
}

export interface HtmxConfig {
  /**
   * Log all htmx events to the console.
   * @default false
   */
  logAll: boolean;
  /**
   * Secondary attribute prefix alongside `hx-`. Set to `""` to disable.
   * Must be set via `<meta name="htmx-config">`. Changing after page load has no effect.
   * @default "data-hx-"
   */
  prefix: string;
  /**
   * Use the View Transitions API for swap animations.
   * @default false
   */
  transitions: boolean;
  /**
   * Controls browser history management.
   * - `true`: push URLs and restore via AJAX on back/forward
   * - `false`: disable history entirely
   * - `"reload"`: push URLs but use `location.reload()` on back/forward
   * @default true
   */
  history: boolean | 'reload';
  /**
   * Fetch `mode` for all htmx requests. Per-element overrides are ignored.
   * @default "same-origin"
   */
  mode: 'same-origin' | 'cors' | 'no-cors';
  /**
   * Default swap style when `hx-swap` is not specified.
   * @default "innerHTML"
   */
  defaultSwap: string;
  /**
   * Scroll the focused element into view after each swap.
   * @default false
   */
  defaultFocusScroll: boolean;
  /**
   * Delay in ms between the swap and settle phases.
   * @default 1
   */
  defaultSettleDelay: number;
  /**
   * CSS class applied to `hx-indicator` targets during requests.
   * @default "htmx-indicator"
   */
  indicatorClass: string;
  /**
   * CSS class applied to the requesting element.
   * @default "htmx-request"
   */
  requestClass: string;
  /**
   * Include htmx's built-in CSS for the indicator class.
   * @default true
   */
  includeIndicatorCSS: boolean;
  /**
   * Default request timeout in ms.
   * @default 60000
   */
  defaultTimeout: number;
  /**
   * `nonce` for inline `<script>` elements htmx generates (for CSP).
   * @default undefined
   */
  inlineScriptNonce?: string;
  /**
   * Comma-separated list of extensions to auto-load.
   * @default ""
   */
  extensions: string;
  /**
   * Attribute name prefixes preserved during morphing (ignored if name starts with any entry).
   * @default ["data-htmx-powered"]
   */
  morphIgnore: string[];
  /**
   * Max siblings scanned when matching nodes during a morph swap.
   * @default 10
   */
  morphScanLimit: number;
  /**
   * CSS selector for elements skipped entirely during morphing.
   * @default "[hx-morph-skip]"
   */
  morphSkip?: string;
  /**
   * CSS selector for elements whose children are frozen during morphing (attributes still update).
   * @default "[hx-morph-skip-children]"
   */
  morphSkipChildren?: string;
  /**
   * HTTP status codes for which htmx will not perform a content swap.
   * @default [204, 304]
   */
  noSwap: number[];
  /**
   * Child elements implicitly inherit htmx attributes from parents.
   * @default false
   */
  implicitInheritance: boolean;
  /**
   * Replaces `:` in attribute modifiers (e.g. `hx-get:inherited`).
   * Useful when templating engines treat `:` specially.
   * @default undefined (uses `:`)
   */
  metaCharacter?: string;
  /**
   * Whether an empty response body performs the main swap.
   * - `true`: swap (clears target)
   * - `false`: skip swap
   * - `undefined`: swap unless response contained only `<hx-partial>` elements
   * Overridable per element via the `swapEmpty` modifier on `hx-swap`.
   * @default undefined
   */
  defaultSwapEmpty?: boolean;
  /** Requires hx-live. */
  live?: HxLive.Config;
}

/** Context object passed to `htmx.swap()` */
export interface HtmxSwapContext {
  /** HTML string to swap into the DOM */
  text: string;
  /** Element that triggered the swap, used for history and event firing */
  sourceElement?: Element;
  /** Swap style (e.g. `'innerHTML'`, `'outerHTML'`). Defaults to `htmx.config.defaultSwap` */
  swap?: string;
  /** CSS selector to extract content from the response */
  select?: string;
  /** Selector for out-of-band swaps */
  selectOOB?: string;
  /** Target element to swap into. Defaults to `document.body` */
  target?: Element;
  /** Whether to use the View Transitions API for this swap */
  transition?: boolean;
  /** `hx-push-url` value: push a URL into history after the swap */
  push?: string | boolean;
  /** `hx-replace-url` value: replace the current history entry after the swap */
  replace?: string | boolean;
  /** URL fragment to scroll into view after the swap */
  anchor?: string;
}

export namespace HxLive {
  /** Boolean class membership and class operations. */
  export interface ClassProxy {
    assign(classes: Record<string, any>): void;
    add(...classes: string[]): void;
    remove(...classes: string[]): void;
    toggle(className: string, force?: boolean): boolean;
    replace(oldClass: string, newClass: string): boolean;
    contains(className: string): boolean;
    [name: string]: any;
  }

  export type Updater<Current, Next = Current> = (current: Current) => Next;
  type AriaWrite<T> = T | null | undefined | Updater<T | undefined, T | null | undefined>;
  type AriaTristate = boolean | 'mixed' | 'undefined';
  type AriaOptionalBoolean = boolean | 'undefined';
  type AriaCurrent = boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  type AriaHasPopup = boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  type AriaInvalid = boolean | 'grammar' | 'spelling';
  type AriaDropEffect = Array<'copy' | 'execute' | 'link' | 'move' | 'none' | 'popup'>;
  type AriaRelevant = Array<'additions' | 'removals' | 'text' | 'all'>;

  /** Typed WAI-ARIA 1.2 state. Assign a function to update the current value. */
  export interface AriaProxy {
    /** Strings and ID references. */
    get activeDescendant(): string | undefined; set activeDescendant(value: AriaWrite<string>);
    get details(): string | undefined; set details(value: AriaWrite<string>);
    get errorMessage(): string | undefined; set errorMessage(value: AriaWrite<string>);
    get keyShortcuts(): string | undefined; set keyShortcuts(value: AriaWrite<string>);
    get label(): string | undefined; set label(value: AriaWrite<string>);
    get placeholder(): string | undefined; set placeholder(value: AriaWrite<string>);
    get roleDescription(): string | undefined; set roleDescription(value: AriaWrite<string>);
    get valueText(): string | undefined; set valueText(value: AriaWrite<string>);

    /** Booleans and states. */
    get atomic(): boolean | undefined; set atomic(value: AriaWrite<boolean>);
    get busy(): boolean | undefined; set busy(value: AriaWrite<boolean>);
    get checked(): AriaTristate | undefined; set checked(value: AriaWrite<AriaTristate>);
    get disabled(): boolean | undefined; set disabled(value: AriaWrite<boolean>);
    get expanded(): AriaOptionalBoolean | undefined; set expanded(value: AriaWrite<AriaOptionalBoolean>);
    get grabbed(): AriaOptionalBoolean | undefined; set grabbed(value: AriaWrite<AriaOptionalBoolean>);
    get hidden(): AriaOptionalBoolean | undefined; set hidden(value: AriaWrite<AriaOptionalBoolean>);
    get modal(): boolean | undefined; set modal(value: AriaWrite<boolean>);
    get multiLine(): boolean | undefined; set multiLine(value: AriaWrite<boolean>);
    get multiSelectable(): boolean | undefined; set multiSelectable(value: AriaWrite<boolean>);
    get pressed(): AriaTristate | undefined; set pressed(value: AriaWrite<AriaTristate>);
    get readOnly(): boolean | undefined; set readOnly(value: AriaWrite<boolean>);
    get required(): boolean | undefined; set required(value: AriaWrite<boolean>);
    get selected(): AriaOptionalBoolean | undefined; set selected(value: AriaWrite<AriaOptionalBoolean>);

    /** Tokens. */
    get autoComplete(): 'inline' | 'list' | 'both' | 'none' | undefined; set autoComplete(value: AriaWrite<'inline' | 'list' | 'both' | 'none'>);
    get current(): AriaCurrent | undefined; set current(value: AriaWrite<AriaCurrent>);
    get hasPopup(): AriaHasPopup | undefined; set hasPopup(value: AriaWrite<AriaHasPopup>);
    get invalid(): AriaInvalid | undefined; set invalid(value: AriaWrite<AriaInvalid>);
    get live(): 'assertive' | 'off' | 'polite' | undefined; set live(value: AriaWrite<'assertive' | 'off' | 'polite'>);
    get orientation(): 'horizontal' | 'undefined' | 'vertical' | undefined; set orientation(value: AriaWrite<'horizontal' | 'undefined' | 'vertical'>);
    get sort(): 'ascending' | 'descending' | 'none' | 'other' | undefined; set sort(value: AriaWrite<'ascending' | 'descending' | 'none' | 'other'>);

    /** Integers and numbers. */
    get colCount(): number | undefined; set colCount(value: AriaWrite<number>);
    get colIndex(): number | undefined; set colIndex(value: AriaWrite<number>);
    get colSpan(): number | undefined; set colSpan(value: AriaWrite<number>);
    get level(): number | undefined; set level(value: AriaWrite<number>);
    get posInSet(): number | undefined; set posInSet(value: AriaWrite<number>);
    get rowCount(): number | undefined; set rowCount(value: AriaWrite<number>);
    get rowIndex(): number | undefined; set rowIndex(value: AriaWrite<number>);
    get rowSpan(): number | undefined; set rowSpan(value: AriaWrite<number>);
    get setSize(): number | undefined; set setSize(value: AriaWrite<number>);
    get valueMax(): number | undefined; set valueMax(value: AriaWrite<number>);
    get valueMin(): number | undefined; set valueMin(value: AriaWrite<number>);
    get valueNow(): number | undefined; set valueNow(value: AriaWrite<number>);

    /** ID reference lists and token lists. */
    get controls(): string[] | undefined; set controls(value: AriaWrite<string[]>);
    get describedBy(): string[] | undefined; set describedBy(value: AriaWrite<string[]>);
    get flowTo(): string[] | undefined; set flowTo(value: AriaWrite<string[]>);
    get labelledBy(): string[] | undefined; set labelledBy(value: AriaWrite<string[]>);
    get owns(): string[] | undefined; set owns(value: AriaWrite<string[]>);
    get dropEffect(): AriaDropEffect | undefined; set dropEffect(value: AriaWrite<AriaDropEffect>);
    get relevant(): AriaRelevant | undefined; set relevant(value: AriaWrite<AriaRelevant>);
  }

  export interface AttrProxy {
    readonly class: ClassProxy & DOMTokenList;
    [name: string]: any;
  }

  /** Typed application-defined `data-*` state. */
  export interface DataProxy {
    [name: string]: any;
  }

  /** State bags that resolve each key from the nearest owning element. */
  export interface Scope {
    /** Typed attributes from the nearest element carrying each attribute. */
    readonly attr: AttrProxy;
    /** Typed `data-*` values from the nearest element carrying each key. */
    readonly data: DataProxy;
    /** Typed ARIA values from the nearest element carrying each attribute. */
    readonly aria: AriaProxy;
    /** Class membership from the nearest element carrying each class. */
    readonly class: ClassProxy;
  }

  export interface Query {
    /** Number of matched elements. */
    count: number;
    /** Returns a plain array of the matched elements. */
    arr(): Element[];
    /**
     * Re-runs the selector grammar with each matched element as the anchor.
     * Supports `next`, `previous`, `closest`, `first`, `last`, and `in` scoping.
     */
    q(selector: string): Query;
    /** Typed attributes on the selected elements themselves. */
    readonly attr: AttrProxy;
    /** Typed `data-*` values on the selected elements themselves. */
    readonly data: DataProxy;
    /** Typed `aria-*` values on the selected elements themselves. */
    readonly aria: AriaProxy;
    /** Class state and `classList` methods on the selected elements themselves. */
    readonly class: ClassProxy & DOMTokenList;
    /** Typed state on the nearest owner of each selected element. */
    readonly closest: Scope;
    /**
     * Move a class or attribute from sibling/scoped elements to all matched elements.
     * @param scope - CSS selector, DOM node, or `{ from: string }`. Defaults to parent element.
     */
    take(name: string, scope?: string | Node | { from: string }): Query;
    /**
     * Toggle (binary flip) or cycle (with `values`) a class or attribute on all matched elements.
     * @param values - Pipe-delimited string (`'grid|list'`) or array to cycle through.
     */
    toggle(name: string, ...values: any[]): Query;
    /**
     * Dispatch a `CustomEvent` from all matched elements.
     * @param bubbles - Defaults to `true`.
     */
    trigger(type: string, detail?: any, bubbles?: boolean): Query;
    /**
     * Insert HTML relative to all matched elements.
     * - `'before'`/`'after'`: sibling before/after
     * - `'start'`/`'end'`: first/last child
     */
    insert(pos: 'before' | 'after' | 'start' | 'end', html: string): Query;
    /** Iterate over matched elements. */
    [Symbol.iterator](): IterableIterator<Element>;
    /** DOM property passthrough: reads from first element, writes to all. */
    [key: string]: any;
  }
}

export interface HxLive {
  /**
   * Returns a query proxy over elements matching a selector, element, or collection.
   * Directional keywords (`next`, `previous`, `closest`) only work inside `hx-live`/`hx-on` expressions.
   */
  q(selector: string): HxLive.Query;
  q(element: Element): HxLive.Query;
  q(elements: Iterable<Element>): HxLive.Query;
  /** Aliases `q()`. */
  $(selector: string): HxLive.Query;
  $(element: Element): HxLive.Query;
  $(elements: Iterable<Element>): HxLive.Query;
  /**
   * Awaitable debounce: resolves after `ms` ms. Cancels any pending call on the same element.
   */
  debounce(ms: number): Promise<void>;
  /** Callback debounce: calls `fn` after `ms` ms, cancelling any pending call. */
  debounce(ms: number, fn: () => void): void;
  /**
   * Force a recompute of all live expressions.
   * Use when an expression reads from a source the observer cannot track (JS variable, getter, external store).
   */
  refresh(): void;
  /** Move a class or attribute from sibling/scoped elements to the target. */
  take(target: string | Element | NodeList, name: string, scope?: string | Node | { from: string }): void;
  /** Toggle or cycle a class or attribute on the target. */
  toggle(target: string | Element | NodeList, name: string, ...values: any[]): void;
  /**
   * Resolves on the next matching event, timeout, or interval, whichever fires first.
   * - `string`: event name on the current element
   * - `number`: timeout in ms
   * - `EventTarget`: redirects listeners to that target
   */
  forEvent(...args: (string | number | EventTarget)[]): Promise<Event | null>;
  /**
   * Resolves on the next animation frame. Useful to force a style recalc between two DOM writes.
   */
  nextFrame(): Promise<void>;
}

/** Fetch request options, modifiable in htmx:config:request */
export interface HtmxRequestOptions {
  /** Whether to validate the form before sending */
  validate: boolean;
  /** Request URL without its fragment */
  action: string;
  /** URL fragment used for history and scrolling */
  anchor?: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body. FormData during htmx:config:request, then encoded for Fetch */
  body?: BodyInit | null;
  /** Abort htmx's request controller */
  abort: () => void;
  /** Signal passed to fetch() */
  signal: AbortSignal;
  /** Fetch credentials mode */
  credentials: RequestCredentials;
  /** Fetch mode */
  mode: RequestMode;
  /** Fetch cache mode */
  cache?: RequestCache;
  /** Per-request htmx timeout */
  timeout?: number | string | null;
  [key: string]: any;
}

/** Response object available after a fetch completes */
export interface HtmxResponse {
  /** Raw Fetch API Response (body not yet consumed in htmx:before:response) */
  raw: Response;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
}

/** Request context passed as evt.detail.ctx on most htmx request lifecycle events */
export interface HtmxRequestCtx {
  /** Element that triggered the request */
  sourceElement: Element;
  /** Event that triggered the request */
  sourceEvent: Event | null;
  /** Target element where the response will be swapped */
  target: Element;
  /** hx-select value */
  select: string;
  /** hx-select-oob value */
  selectOOB: string;
  /** hx-swap value */
  swap: string;
  /** hx-push-url value */
  push: string | boolean;
  /** hx-replace-url value */
  replace: string | boolean;
  /** Whether to use view transitions */
  transition: boolean;
  /** Fetch request options: modify here in htmx:config:request */
  request: HtmxRequestOptions;
  /** Response object, available after fetch resolves */
  response?: HtmxResponse;
  /** Response body text, available during htmx:after:request */
  text?: string;
}

/** History detail shared by htmx:before:history:update and htmx:after:history:update */
export interface HtmxHistoryDetail {
  /** "push" or "replace" */
  type: 'push' | 'replace';
  /** The URL path */
  path: string;
}

export interface HtmxEventMap {
  /**
   * Fires after request values are collected and validated, but before encoding and sending.
   * Modify `ctx.request` to change headers, timeout, credentials, etc.
   * Call `evt.preventDefault()` to cancel the request.
   */
  'htmx:config:request': { ctx: HtmxRequestCtx };

  /**
   * Fires immediately before `fetch()` is called, after all configuration.
   * Cancel to prevent the request from being sent.
   */
  'htmx:before:request': { ctx: HtmxRequestCtx };

  /**
   * Fires after the fetch resolves and the response is received, before swapping.
   * `ctx.response` is available with status and headers.
   */
  'htmx:after:request': { ctx: HtmxRequestCtx };

  /**
   * Fires when request completes, fails, or is cancelled.
   * Does not run if processing stops before the request begins issuing.
   */
  'htmx:finally:request': { ctx: HtmxRequestCtx };

  /**
   * Fires after the network response arrives but before htmx reads the response body.
   * `ctx.response.raw` is the unconsumed Fetch `Response`.
   * Cancel to skip body consumption and the swap entirely.
   */
  'htmx:before:response': { ctx: HtmxRequestCtx };

  /**
   * Fires after response content is parsed but before it is inserted into the DOM.
   * Cancel to prevent the swap from occurring.
   */
  'htmx:before:swap': { ctx: HtmxRequestCtx; tasks: any[] };

  /**
   * Fires after new content has been swapped into the DOM, before elements are processed.
   */
  'htmx:after:swap': { ctx: HtmxRequestCtx };

  /**
   * Fires at the end of the swap lifecycle whether successful or failed.
   * Equivalent to a `finally` block for swaps.
   */
  'htmx:finally:swap': { ctx: HtmxRequestCtx };

  /**
   * Fires after new content is inserted but before CSS transitions are applied.
   * Modify `newContent` elements before transitions run.
   */
  'htmx:before:settle': { task: any; newContent: Element[]; settleTasks: any[] };

  /**
   * Fires after the settle phase completes, including all CSS transitions.
   * The DOM is fully stable at this point.
   */
  'htmx:after:settle': { task: any; newContent: Element[]; settleTasks: any[] };

  /**
   * Fires before htmx removes listeners and internal data from an element.
   * Fires before element removal during a swap or before re-processing.
   */
  'htmx:before:cleanup': Record<string, never>;

  /**
   * Fires after htmx has removed all listeners and internal data from an element.
   */
  'htmx:after:cleanup': Record<string, never>;

  /**
   * Fires when an element with `hx-confirm` is triggered, before the request is sent.
   * Call `evt.preventDefault()` to replace the default `window.confirm()` dialog,
   * then call either `issueRequest()` or `dropRequest()`. Failing to call one
   * will leave the request pending indefinitely.
   */
  'htmx:confirm': {
    ctx: HtmxRequestCtx;
    /** Call to proceed with the request */
    issueRequest: () => void;
    /** Call to cancel the request */
    dropRequest: () => void;
  };

  /**
   * Fires when an exception occurs during the request or swap process.
   * Does NOT fire for HTTP 4xx/5xx. Use htmx:response:error for those.
   * Note: `ctx` is absent when the error occurs before the request context is established.
   */
  'htmx:error': { ctx?: HtmxRequestCtx; error: unknown };

  /**
   * Fires when the server responds with HTTP 400 or higher.
   * Does NOT fire for network errors. Use htmx:error for those.
   */
  'htmx:response:error': { ctx: HtmxRequestCtx };

  /**
   * Control event: fire this on an element to abort its ongoing request.
   * @example htmx.trigger('#myElement', 'htmx:abort')
   */
  'htmx:abort': Record<string, never>;

  /**
   * Fires before htmx attaches its internal metadata structure to an element.
   */
  'htmx:before:init': Record<string, never>;

  /**
   * Fires after an element is fully initialized with all behaviors and event listeners.
   */
  'htmx:after:init': Record<string, never>;

  /**
   * Fires before htmx begins processing a DOM node or subtree.
   * Cancel to prevent htmx from processing the element.
   */
  'htmx:before:process': Record<string, never>;

  /**
   * Fires after htmx has finished processing a DOM node or subtree.
   */
  'htmx:after:process': Record<string, never>;

  /**
   * Fires before htmx attaches `hx-on` event listeners to an element.
   * Cancel to prevent `hx-on` handlers from being registered on the element.
   */
  'htmx:before:on:init': Record<string, never>;

  /**
   * Fires when htmx encounters an `<hx-partial>` element in a response.
   * Built-in instance of the `htmx:process:{type}` pattern. Extensions can handle
   * custom types via `htmx.on('htmx:process:mytype', ...)` (not statically typed).
   */
  'htmx:process:partial': { ctx: any; tasks: any[] };

  /**
   * Fires when htmx handles implicit attribute inheritance from parent to child elements.
   * Only fires when `htmx.config.implicitInheritance` is enabled.
   */
  'htmx:after:implicitInheritance': { elt: Element; name: string; parent: Element };

  /**
   * Fires before `history.pushState()` or `history.replaceState()` is called.
   * Cancel to prevent the history update.
   */
  'htmx:before:history:update': { history: HtmxHistoryDetail; sourceElement: Element; response: HtmxResponse };

  /**
   * Fires after `history.pushState()` or `history.replaceState()` completes.
   */
  'htmx:after:history:update': { history: HtmxHistoryDetail; sourceElement: Element; response: HtmxResponse };

  /**
   * Fires after a `history.pushState()` operation (new history entry created).
   */
  'htmx:after:history:push': { path: string };

  /**
   * Fires after a `history.replaceState()` operation (current entry replaced).
   */
  'htmx:after:history:replace': { path: string };

  /**
   * Fires when the user navigates back/forward (popstate), before content is restored.
   * Cancel to prevent history restoration and handle it manually.
   * `cacheMiss` is always `true` from core; extensions such as `hx-history-cache`
   * intercept this event and set `detail.cancelled = true` to handle cache hits themselves.
   */
  'htmx:before:history:restore': { path: string; cacheMiss: boolean };

  /**
   * Fires before a View Transition starts.
   * Only fires when `htmx.config.transitions` is `true` and the browser supports the View Transitions API.
   * Cancel to skip the view transition for this swap.
   */
  'htmx:before:viewTransition': { task: () => Promise<void> };

  /**
   * Fires after a View Transition animation completes.
   */
  'htmx:after:viewTransition': { task: () => Promise<void> };
}

export type HtmxEvent<K extends keyof HtmxEventMap> = CustomEvent<HtmxEventMap[K]>;

/** Options accepted by `htmx.ajax()` */
export interface HtmxAjaxOptions {
  /** Element to use as the request source (for headers, inheritance, etc.) */
  source?: Element | string;
  /** Event that triggered the request */
  event?: Event;
  /** Target element or CSS selector to swap the response into */
  target?: Element | string;
  /** Swap style (e.g. `'innerHTML'`, `'outerHTML'`) */
  swap?: string;
  /** Additional values to include in the request body */
  values?: Record<string, any>;
  /** Additional request headers */
  headers?: Record<string, string>;
  /** CSS selector to extract content from the response */
  select?: string;
  /** Selector for out-of-band swaps */
  selectOOB?: string;
  /** Push a URL into browser history after the swap. `true` uses the request URL */
  push?: string | boolean;
  /** Replace the current history entry after the swap. `true` uses the request URL */
  replace?: string | boolean;
}

export interface Htmx {
  /** htmx version string */
  version: string;
  /** Global htmx configuration */
  config: HtmxConfig;
  /** hx-live extension API, available when the extension is loaded */
  live?: HxLive;
  /**
   * Issues an htmx-style AJAX request programmatically.
   * Returns a Promise that resolves after the response has been swapped into the DOM.
   * @param verb - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param path - URL to request
   * @param options - Swap target element, CSS selector, or full request context object
   * @example
   * htmx.ajax('GET', '/items', '#list')
   * htmx.ajax('POST', '/save', { target: '#result', swap: 'outerHTML' })
   */
  ajax(verb: string, path: string, options?: Element | string | HtmxAjaxOptions): Promise<void>;
  /**
   * Find the first element matching `selector` in the document.
   */
  find(selector: string): Element | null;
  /**
   * Find the first element matching `selector` within `elt`.
   */
  find(elt: Element, selector: string): Element | null;
  /**
   * Find all elements matching `selector` in the document.
   */
  findAll(selector: string): Element[];
  /**
   * Find all elements matching `selector` within `elt`.
   */
  findAll(elt: Element, selector: string): Element[];
  /**
   * Register an event listener on `document` for an htmx event, with full type inference on `evt.detail`.
   */
  on<K extends keyof HtmxEventMap>(event: K, handler: (evt: HtmxEvent<K>) => void): (evt: HtmxEvent<K>) => void;
  /**
   * Register an event listener on a specific element for an htmx event.
   */
  on<K extends keyof HtmxEventMap>(target: string | Element, event: K, handler: (evt: HtmxEvent<K>) => void): (evt: HtmxEvent<K>) => void;
  on<K extends keyof HTMLElementEventMap>(event: K, handler: (evt: HTMLElementEventMap[K]) => void): (evt: HTMLElementEventMap[K]) => void;
  on<K extends keyof HTMLElementEventMap>(target: string | Element, event: K, handler: (evt: HTMLElementEventMap[K]) => void): (evt: HTMLElementEventMap[K]) => void;
  on<K extends keyof WindowEventMap>(target: Window, event: K, handler: (evt: WindowEventMap[K]) => void): (evt: WindowEventMap[K]) => void;
  on(event: string, handler: (evt: Event) => void): (evt: Event) => void;
  on(target: string | Element, event: string, handler: (evt: Event) => void): (evt: Event) => void;
  /**
   * Register a callback that fires whenever htmx finishes processing a new element.
   * Equivalent to listening for `htmx:after:process`.
   */
  onLoad(callback: (elt: Element) => void): void;
  /**
   * Sets up history handling and processes `document.body`.
   * Called automatically on `DOMContentLoaded` (or next tick if the document is already loaded).
   * Safe to call multiple times. History listeners are only registered once.
   * Call manually when loading htmx asynchronously or after a streaming response delivers the full page.
   */
  initialize(): void;
  /**
   * Initialize htmx attributes on `root` and all its descendants.
   * When `force` is `true`, tears down and re-initializes already-processed elements.
   * Use this after manually mutating `hx-*` attributes on a live element.
   */
  process(root: Element | ShadowRoot, force?: boolean): void;
  /**
   * Register an htmx extension. The extension must be listed in `htmx.config.extensions`
   * (unless that list is empty). Duplicate registrations are silently ignored.
   */
  registerExtension(name: string, ext: any): void;
  /**
   * Dispatch a `CustomEvent` on `elt` and return `true` if it was not cancelled.
   */
  trigger<K extends keyof HtmxEventMap>(elt: Element | string, event: K, detail: HtmxEventMap[K], bubbles?: boolean): boolean;
  trigger(elt: Element | string, event: string, detail?: any, bubbles?: boolean): boolean;
  /**
   * Returns a Promise that resolves after `time` milliseconds.
   * Accepts a number (ms) or an interval string (`'2s'`, `'500ms'`, `'1m'`).
   * Returns `undefined` if `time` is 0 or falsy.
   */
  timeout(time: number | string): Promise<void> | undefined;
  /**
   * Parse a time interval string or number into milliseconds.
   * Accepts a number (returned as-is) or a string with units: `ms`, `s`, `m`.
   * Returns `undefined` if parsing fails.
   * @example
   * htmx.parseInterval('2s')    // 2000
   * htmx.parseInterval('500ms') // 500
   * htmx.parseInterval(1000)    // 1000
   */
  parseInterval(str: string | number): number | undefined;
  /**
   * Perform an HTML content swap into the DOM.
   * Primarily used by extensions and advanced integrations. Prefer `htmx.ajax()` for most use cases.
   */
  swap(ctx: HtmxSwapContext): Promise<void>;
}

declare const htmx: Htmx;
export default htmx;

type HtmxEventMapAsCustomEvents = { [K in keyof HtmxEventMap]: CustomEvent<HtmxEventMap[K]> };

declare global {
  interface HTMLElementEventMap extends HtmxEventMapAsCustomEvents {}
  interface DocumentEventMap extends HtmxEventMapAsCustomEvents {}
  interface WindowEventMap extends HtmxEventMapAsCustomEvents {}
}
