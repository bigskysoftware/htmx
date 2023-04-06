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
