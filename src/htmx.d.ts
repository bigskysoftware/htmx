export interface HtmxApi {
    config?: HtmxConfig
    logger?: (a: HTMLElement, b: Event, c: any) => void | null
    on: (event:string, listener:EventListener) => void
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
    addedClass?: string;
    allowEval?: boolean;
    timeout: number;
    attributesToSettle?: ["class", "style", "width", "height"] | string[];
    withCredentials?: boolean;
    wsReconnectDelay?: 'full-jitter' | string;
    disableSelector?: "[hx-disable], [data-hx-disable]" | string;
    useTemplateFragments?: boolean;
    scrollBehavior: string;
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

export interface HtmxInternalApi {
    bodyContains: (element: HTMLElement) => boolean
    hasAttribute: (element: HTMLElement, qualifiedName: string) => boolean
    getAttributeValue: (element: HTMLElement, qualifiedName: string) => string | null
    getInternalData: (element: HTMLElement) => Object
    getSwapSpecification: (element: HTMLElement) => HtmxSwapSpecification
    getTarget: (element: HTMLElement) => object
    oobSwap: (oobValue: string, oobElement: HTMLElement, settleInfo: *) => void
    makeSettleInfo: (element: Element) => HtmxSettleInfo
    makeFragment: () => Element
    selectAndSwap: (swapStyle: any, target: any, elt: any, responseText: any, settleInfo: any) => void // TODO: improve parameter definitions
    settleImmediately: (tasks: any) => void // TODO: improve parameter definitions
    triggerEvent: (element: HTMLElement, eventName: string, detail: any) => void
    triggerErrorEvent: (element: HTMLElement, eventName: string, detail: any) => void
    withExtensions: (element: HTMLElement, toDo:(ext:HtmxExtension) => void) => void
}

export interface HtmxSwapSpecification {
    swapStyle: string
    swapDelay: number
    settleDelay: number
    show?: string
    showTarget?: string
    scroll?: string
    scrollTarget?: string
}

export interface HtmxSettleInfo {
    tasks: *[], 
    elts: HTMLELement[]
}