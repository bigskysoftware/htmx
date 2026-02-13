export interface HtmxConfig {
  version: string;
  logAll: boolean;
  prefix: string;
  transitions: boolean;
  history: boolean;
  historyReload: boolean;
  mode: 'same-origin' | 'cors' | 'no-cors';
  defaultSwap: string;
  indicatorClass: string;
  requestClass: string;
  includeIndicatorCSS: boolean;
  defaultTimeout: number;
  inlineScriptNonce: string;
  inlineStyleNonce: string;
  extensions: string;
  morphIgnore: string[];
  noSwap: number[];
  implicitInheritance: boolean;
  metaCharacter?: string;
  streams?: {
    reconnect: boolean;
    reconnectMaxAttempts: number;
    reconnectDelay: number;
    reconnectMaxDelay: number;
    reconnectJitter: number;
    pauseInBackground: boolean;
  };
}

export interface Htmx {
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
  registerExtension(name: string, ext: any): boolean;
  trigger(elt: Element | string, event: string, detail?: any): boolean;
  timeout(ms: number): Promise<void>;
  parseInterval(str: string): number;
  forEvent(event: string, timeout?: number): Promise<Event | null>;
  swap(target: Element | string, content: string, swapSpec: any): void;
  takeClass(elt: Element, className: string, container?: Element): void;
}

declare const htmx: Htmx;
export default htmx;
