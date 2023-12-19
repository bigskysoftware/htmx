interface HtmxTriggerSpecification {
  sseEvent?: string;
  trigger: string;
  root?: Element | Document | null;
  threshold?: string;
  delay?: number;
  pollInterval?: number;
}

interface HtmxSwapSpecification {
  swapStyle: SwapStyle;
  swapDelay: number;
  settleDelay: number;
}

interface HtmxSettleInfo {
  title?: string;
  tasks?: (() => void)[];
  elts?: Element[];
}

interface ListenerInfo {
  listener: EventListener;
  on: HTMLElement;
  trigger: string;
}

/** the http verb used in the request (lowercase) */
type Verb = "get" | "post" | "put" | "delete" | "patch";

interface KnownInternalData {
  initHash?: number | null;
  listenerInfos?: ListenerInfo[];
  path?: string;
  streamPaused?: boolean;
  streamReader?: ReadableStreamDefaultReader;
  verb?: Verb;
  lastButtonClicked?: Element | null;
  timeout?: number;
  webSocket?: WebSocket;
  sseEventSource?: EventSource;
  onHandlers?: { event: string; listener: EventListener }[];
  xhr?: XMLHttpRequest;
  requestCount?: number;
}

type InternalData = KnownInternalData & Record<PropertyKey, any>;

interface InputValues {
  errors: any[];
  values: Record<string, string>;
}

interface Pollable {
  polling: boolean;
}

interface TriggerHandler {
  (elt: Element, evt: Event): void;
  (): void;
}

type SwapStyle =
  | "innerHTML"
  | "outerHTML"
  | "afterbegin"
  | "beforebegin"
  | "afterend"
  | "beforeend"
  | "none"
  | "delete";

interface HtmxInternalApi {
  addTriggerHandler(
    elt: Element,
    triggerSpec: HtmxTriggerSpecification,
    nodeData: Pollable,
    handler: TriggerHandler
  ): void;
  bodyContains(elt: Node): boolean;
  canAccessLocalStorage(): boolean;
  findThisElement(elt: HTMLElement, attribute: string): HTMLElement | null;
  filterValues(
    inputValues: Record<string, string>,
    elt: HTMLElement
  ): Record<string, string>;
  hasAttribute(
    elt: { hasAttribute: (arg0: string) => boolean },
    qualifiedName: string
  ): boolean;
  getAttributeValue(elt: HTMLElement, qualifiedName: string): string | null;
  getClosestAttributeValue(
    elt: HTMLElement,
    attributeName: string
  ): string | null;
  getClosestMatch(
    elt: HTMLElement,
    condition: (e: HTMLElement) => boolean
  ): HTMLElement | null;
  getExpressionVars(elt: HTMLElement): Record<string, string>;
  getHeaders(
    elt: HTMLElement,
    target: HTMLElement,
    prompt: string
  ): Record<string, string>;
  getInputValues(elt: HTMLElement, verb: string): InputValues;
  getInternalData(elt: HTMLElement): InternalData;
  getSwapSpecification(
    elt: HTMLElement,
    swapInfoOverride?: string
  ): HtmxSwapSpecification;
  getTriggerSpecs(elt: HTMLElement): HtmxTriggerSpecification[];
  getTarget(elt: HTMLElement): Element | null;
  makeFragment(resp: any): Element | DocumentFragment;
  mergeObjects<A extends object, B extends object>(obj1: A, obj2: B): A & B;
  makeSettleInfo(target: Element): HtmxSettleInfo;
  oobSwap(
    oobValue: string,
    oobElement: HTMLElement,
    settleInfo: HtmxSettleInfo
  ): string;
  querySelectorExt(eltOrSelector: any, selector: string): Element | null;
  selectAndSwap(
    swapStyle: SwapStyle,
    target: Element | null,
    elt: Element | null,
    responseText: string,
    settleInfo: HtmxSettleInfo,
    selectOverride?: string | null
  ): void;
  settleImmediately(tasks: { call: () => void }[]): void;
  shouldCancel(evt: Event, elt: HTMLElement): boolean;
  triggerEvent(
    elt: Element | null,
    eventName: string,
    detail?: EventDetail
  ): boolean;
  triggerErrorEvent(
    elt: HTMLElement,
    eventName: string,
    detail?: EventDetail
  ): void;
  withExtensions(
    elt: HTMLElement,
    toDo: (extension: HtmxExtension) => void
  ): void;
}

type EventDetail = {
  [key: PropertyKey]: unknown;
};
