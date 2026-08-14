import htmx, { type HxLive } from '../../../src/htmx';

const live = htmx.live!;
const aria = live.q('#item').aria;

const busy: boolean | undefined = aria.busy;
aria.busy = true;
aria.busy = current => !current;
aria.current = 'page';
aria.controls = ['label', 'hint'];

// @ts-expect-error ARIA booleans reject strings
aria.busy = 'true';
// @ts-expect-error ARIA tokens reject unknown values
aria.current = 'other';
// @ts-expect-error ARIA lists reject scalar strings
aria.controls = 'label';
// @ts-expect-error updater results must match the attribute
aria.busy = () => 'true';

const data: HxLive.DataProxy = live.q('#item').data;
const classes: HxLive.ClassProxy = live.q('#item').class;
const closest: HxLive.Scope = live.q('#item').closest;
const classList: DOMTokenList = live.q('#item').class;
closest.class.toggle('active');
live.q('#item').toggle('data-count', 1, 2);
const increment: HxLive.Updater<number> = value => value + 1;

void busy;
void data;
void classes;
void closest;
void classList;
void increment;
