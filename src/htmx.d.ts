export interface HtmxApi {
    config?: HtmxConfig
    logger?: (a: HTMLElement, b: Event, c: any) => void | null
}

export interface HtmxConfig {
    historyEnabled?: boolean;
    historyCacheSize?: number;
    refreshOnHistoryMiss?: boolean;
    defaultSwapStyle?: 'innerHTML' | string;
    defaultSwapDelay?: number;
    defaultSettleDelay?: number;
    includeIndicatorStyles?: boolean;
    indicatorClass?: 'htmx-indicator' | string;
    requestClass?: 'htmx-request' | string;
    settlingClass?: 'htmx-settling' | string;
    swappingClass?: 'htmx-swapping' | string;
    allowEval?: boolean;
    attributesToSettle?: ["class", "style", "width", "height"] | string[];
    withCredentials?: boolean;
    wsReconnectDelay?: 'full-jitter' | string;
    disableSelector?: "[hx-disable], [data-hx-disable]" | string;
    useTemplateFragments?: boolean;
}

export declare var htmx: HtmxApi

export interface HtmxExtension {
    init: (api: HtmxInternalApi) => void;
    onEvent: (name: string, event: Event) => boolean;
    transformResponse: (text: string, xhr: XMLHttpRequest, elt: HTMLElement) => string;
    isInlineSwap: (swapStyle: string) => boolean;
    handleSwap: (swapStyle: string, target: HTMLElement, fragment: string, settleInfo: Object) => boolean;
    encodeParameters: (xhr: XMLHttpRequest, parameters: Object, elt: HTMLElement) => void;
}

export interface HtmxExtensionApi {
    bodyContains: (element: HTMLElement) => boolean;
    hasAttribute: (element: HTMLElement, qualifiedName: string) => boolean;
    getAttributeValue: (element: HTMLElement, qualifiedName: string) => string | null;
    getInternalData: (element: HTMLElement) => Object;
    triggerEvent: (element: HTMLElement, eventName: string, detail: any) => void;
    triggerErrorEvent: (element: HTMLElement, eventName: string, detail: any) => void;
    swap:  (element: HTMLElement, content: string) => void;
}