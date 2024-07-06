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
    const defineExtension: (name: string, extension: any) => void;
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
type HttpVerb = 'get' | 'head' | 'post' | 'put' | 'delete' | 'connect' | 'options' | 'trace' | 'patch';
type SwapOptions = {
    select?: string;
    selectOOB?: string;
    eventInfo?: any;
    anchor?: string;
    contextElement?: Element;
    afterSwapCallback?: swapCallback;
    afterSettleCallback?: swapCallback;
};
type swapCallback = () => any;
type HtmxSwapStyle = 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend' | 'delete' | 'none' | string;
type HtmxSwapSpecification = {
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
type ConditionalFunction = ((this: Node, evt: Event) => boolean) & {
    source: string;
};
type HtmxTriggerSpecification = {
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
type HtmxElementValidationError = {
    elt: Element;
    message: string;
    validity: ValidityState;
};
type HtmxHeaderSpecification = Record<string, string>;
type HtmxAjaxHelperContext = {
    source?: Element | string;
    event?: Event;
    handler?: HtmxAjaxHandler;
    target?: Element | string;
    swap?: HtmxSwapStyle;
    values?: any | FormData;
    headers?: Record<string, string>;
    select?: string;
};
type HtmxRequestConfig = {
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
type HtmxResponseInfo = {
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
};
type HtmxAjaxEtc = {
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
type HtmxResponseHandlingConfig = {
    code?: string;
    swap: boolean;
    error?: boolean;
    ignoreTitle?: boolean;
    select?: string;
    target?: string;
    swapOverride?: string;
    event?: string;
};
type HtmxBeforeSwapDetails = HtmxResponseInfo & {
    shouldSwap: boolean;
    serverResponse: any;
    isError: boolean;
    ignoreTitle: boolean;
    selectOverride: string;
};
type HtmxAjaxHandler = (elt: Element, responseInfo: HtmxResponseInfo) => any;
type HtmxSettleTask = (() => void);
type HtmxSettleInfo = {
    tasks: HtmxSettleTask[];
    elts: Element[];
    title?: string;
};
type HtmxExtension = any;
