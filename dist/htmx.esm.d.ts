export default htmx;
export type HttpVerb = 'get' | 'head' | 'post' | 'put' | 'delete' | 'connect' | 'options' | 'trace' | 'patch';
export type SwapOptions = {
    select?: string;
    selectOOB?: string;
    eventInfo?: any;
    anchor?: string;
    contextElement?: Element;
    afterSwapCallback?: swapCallback;
    afterSettleCallback?: swapCallback;
};
export type swapCallback = () => any;
export type HtmxSwapStyle = 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend' | 'delete' | 'none' | string;
export type HtmxSwapSpecification = {
    swapStyle: HtmxSwapStyle;
    swapDelay: number;
    settleDelay: number;
    transition?: boolean;
    ignoreTitle?: boolean;
    head?: string;
    scroll?: 'top' | 'bottom';
    scrollTarget?: string;
    show?: string;
    showTarget?: string;
    focusScroll?: boolean;
};
export type ConditionalFunction = ((this: Node, evt: Event) => boolean) & {
    source: string;
};
export type HtmxTriggerSpecification = {
    trigger: string;
    pollInterval?: number;
    eventFilter?: ConditionalFunction;
    changed?: boolean;
    once?: boolean;
    consume?: boolean;
    delay?: number;
    from?: string;
    target?: string;
    throttle?: number;
    queue?: string;
    root?: string;
    threshold?: string;
};
export type HtmxElementValidationError = {
    elt: Element;
    message: string;
    validity: ValidityState;
};
export type HtmxHeaderSpecification = Record<string, string>;
export type HtmxAjaxHelperContext = {
    source?: Element | string;
    event?: Event;
    handler?: HtmxAjaxHandler;
    target?: Element | string;
    swap?: HtmxSwapStyle;
    values?: any | FormData;
    headers?: Record<string, string>;
    select?: string;
};
export type HtmxRequestConfig = {
    boosted: boolean;
    useUrlParams: boolean;
    formData: FormData;
    /**
     * formData proxy
     */
    parameters: any;
    unfilteredFormData: FormData;
    /**
     * unfilteredFormData proxy
     */
    unfilteredParameters: any;
    headers: HtmxHeaderSpecification;
    target: Element;
    verb: HttpVerb;
    errors: HtmxElementValidationError[];
    withCredentials: boolean;
    timeout: number;
    path: string;
    triggeringEvent: Event;
};
export type HtmxResponseInfo = {
    xhr: XMLHttpRequest;
    target: Element;
    requestConfig: HtmxRequestConfig;
    etc: HtmxAjaxEtc;
    boosted: boolean;
    select: string;
    pathInfo: {
        requestPath: string;
        finalRequestPath: string;
        responsePath: string | null;
        anchor: string;
    };
    failed?: boolean;
    successful?: boolean;
    keepIndicators?: boolean;
};
export type HtmxAjaxEtc = {
    returnPromise?: boolean;
    handler?: HtmxAjaxHandler;
    select?: string;
    targetOverride?: Element;
    swapOverride?: HtmxSwapStyle;
    headers?: Record<string, string>;
    values?: any | FormData;
    credentials?: boolean;
    timeout?: number;
};
export type HtmxResponseHandlingConfig = {
    code?: string;
    swap: boolean;
    error?: boolean;
    ignoreTitle?: boolean;
    select?: string;
    target?: string;
    swapOverride?: string;
    event?: string;
};
export type HtmxBeforeSwapDetails = HtmxResponseInfo & {
    shouldSwap: boolean;
    serverResponse: any;
    isError: boolean;
    ignoreTitle: boolean;
    selectOverride: string;
};
export type HtmxAjaxHandler = (elt: Element, responseInfo: HtmxResponseInfo) => any;
export type HtmxSettleTask = (() => void);
export type HtmxSettleInfo = {
    tasks: HtmxSettleTask[];
    elts: Element[];
    title?: string;
};
export type HtmxExtension = {
    init: (api: any) => void;
    onEvent: (name: string, event: Event | CustomEvent) => boolean;
    transformResponse: (text: string, xhr: XMLHttpRequest, elt: Element) => string;
    isInlineSwap: (swapStyle: HtmxSwapStyle) => boolean;
    handleSwap: (swapStyle: HtmxSwapStyle, target: Node, fragment: Node, settleInfo: HtmxSettleInfo) => boolean | Node[];
    encodeParameters: (xhr: XMLHttpRequest, parameters: FormData, elt: Node) => any | string | null;
    getSelectors: () => string[] | null;
};
declare namespace htmx {
    const onLoad: (callback: (elt: Node) => void) => EventListener;
    const process: (elt: string | Element) => void;
    const on: (arg1: string | EventTarget, arg2: string | EventListener, arg3?: EventListener) => EventListener;
    const off: (arg1: string | EventTarget, arg2: string | EventListener, arg3?: EventListener) => EventListener;
    const trigger: (elt: string | EventTarget, eventName: string, detail?: any) => boolean;
    const ajax: (verb: HttpVerb, path: string, context: string | Element | HtmxAjaxHelperContext) => Promise<void>;
    const find: (eltOrSelector: string | ParentNode, selector?: string) => Element;
    const findAll: (eltOrSelector: string | ParentNode, selector?: string) => NodeListOf<Element>;
    const closest: (elt: string | Element, selector: string) => Element;
    function values(elt: Element, type: HttpVerb): any;
    const remove: (elt: Node, delay?: number) => void;
    const addClass: (elt: string | Element, clazz: string, delay?: number) => void;
    const removeClass: (node: string | Node, clazz: string, delay?: number) => void;
    const toggleClass: (elt: string | Element, clazz: string) => void;
    const takeClass: (elt: string | Node, clazz: string) => void;
    const swap: (target: string | Element, content: string, swapSpec: HtmxSwapSpecification, swapOptions?: SwapOptions) => void;
    const defineExtension: (name: string, extension: HtmxExtension) => void;
    const removeExtension: (name: string) => void;
    const logAll: () => void;
    const logNone: () => void;
    const logger: any;
    namespace config {
        const historyEnabled: boolean;
        const historyCacheSize: number;
        const refreshOnHistoryMiss: boolean;
        const defaultSwapStyle: HtmxSwapStyle;
        const defaultSwapDelay: number;
        const defaultSettleDelay: number;
        const includeIndicatorStyles: boolean;
        const indicatorClass: string;
        const requestClass: string;
        const addedClass: string;
        const settlingClass: string;
        const swappingClass: string;
        const allowEval: boolean;
        const allowScriptTags: boolean;
        const inlineScriptNonce: string;
        const inlineStyleNonce: string;
        const attributesToSettle: string[];
        const withCredentials: boolean;
        const timeout: number;
        const wsReconnectDelay: "full-jitter" | ((retryCount: number) => number);
        const wsBinaryType: BinaryType;
        const disableSelector: string;
        const scrollBehavior: 'auto' | 'instant' | 'smooth';
        const defaultFocusScroll: boolean;
        const getCacheBusterParam: boolean;
        const globalViewTransitions: boolean;
        const methodsThatUseUrlParams: (HttpVerb)[];
        const selfRequestsOnly: boolean;
        const ignoreTitle: boolean;
        const scrollIntoViewOnBoost: boolean;
        const triggerSpecsCache: any | null;
        const disableInheritance: boolean;
        const responseHandling: HtmxResponseHandlingConfig[];
        const allowNestedOobSwaps: boolean;
    }
    const parseInterval: (str: string) => number;
    const _: (str: string) => any;
    const version: string;
}
