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
  inlineScriptNonce: string;
  inlineStyleNonce: string;
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

export interface Htmx {
  version: string;
  config: HtmxConfig;
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
  trigger(elt: Element | string, event: string, detail?: any): boolean;
  timeout(ms: number): Promise<void>;
  parseInterval(str: string): number;
  forEvent(event: string, timeout?: number, on?: EventTarget): Promise<Event | null>;
  swap(ctx: HtmxSwapContext): Promise<void>;
  takeClass(elt: Element, className: string, container?: Element): void;
}

declare const htmx: Htmx;
export default htmx;
