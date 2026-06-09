export interface HtmxConfig {
  logAll: boolean;
  prefix: string;
  transitions: boolean;
  history: boolean | 'reload';
  mode: 'same-origin' | 'cors' | 'no-cors';
  defaultSwap: string;
  defaultFocusScroll: boolean;
  defaultSettleDelay: number;
  indicatorClass: string;
  requestClass: string;
  includeIndicatorCSS: boolean;
  defaultTimeout: number;
  inlineScriptNonce?: string;
  extensions: string;
  morphIgnore: string[];
  morphScanLimit: number;
  morphSkip?: string;
  morphSkipChildren?: string;
  noSwap: number[];
  implicitInheritance: boolean;
  metaCharacter?: string;
}

export interface HtmxSwapContext {
  text: string;
  sourceElement: Element;
  swap?: string;
  select?: string;
  selectOOB?: string;
  target?: Element;
  transition?: boolean;
  push?: string | boolean;
  replace?: string | boolean;
  anchor?: string;
}

export interface QProxy {
  count: number;
  arr(): Element[];
  q(selector: string): QProxy;
  attr(name: string): any;
  attr(name: string, value: any): QProxy;
  take(name: string, scope?: string | { from: string }): QProxy;
  toggle(name: string, values?: string | string[]): QProxy;
  trigger(type: string, detail?: any, bubbles?: boolean): QProxy;
  insert(pos: 'before' | 'after' | 'start' | 'end', html: string): QProxy;
  data?: Record<string, any>;
  [Symbol.iterator](): IterableIterator<Element>;
  [key: string]: any;
}

export interface HtmxLive {
  q(selector: string): QProxy;
  q(element: Element): QProxy;
  q(elements: Iterable<Element>): QProxy;
  debounce(ms: number, fn?: () => void): Promise<void> | void;
  refresh(): void;
  take(target: string | Element | NodeList, name: string, scope?: string | { from: string }): void;
  toggle(target: string | Element | NodeList, name: string, values?: string | string[]): void;
  attr(target: string | Element | NodeList, name: string): any;
  attr(target: string | Element | NodeList, name: string, value: any): void;
  forEvent(...args: (string | number | EventTarget | null)[]): Promise<Event | null>;
  nextFrame(): Promise<void>;
}

export interface Htmx {
  version: string;
  config: HtmxConfig;
  live?: HtmxLive;
  ajax(verb: string, path: string, context?: any): Promise<void>;
  find(selector: string): Element | null;
  find(elt: Element, selector: string): Element | null;
  findAll(selector: string): Element[];
  findAll(elt: Element, selector: string): Element[];
  on(event: string, handler: (evt: Event) => void): void;
  on(target: string | Element, event: string, handler: (evt: Event) => void): void;
  onLoad(callback: (elt: Element) => void): void;
  process(elt: Element): void;
  registerExtension(name: string, ext: any): void;
  trigger(elt: Element | string, event: string, detail?: any, bubbles?: boolean): boolean;
  timeout(ms: number): Promise<void>;
  parseInterval(str: string): number;
  swap(ctx: HtmxSwapContext): Promise<void>;
}

declare const htmx: Htmx;
export default htmx;
