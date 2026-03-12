// This loads all middlewares exposed on the middleware object and then starts
// the invocation chain. The big idea is that we can add these to the middleware
// export dynamically through wrangler, or we can potentially let users directly
// add them as a sort of "plugin" system.

import ENTRY, { __INTERNAL_WRANGLER_MIDDLEWARE__ } from "/Users/chris/Projects/htmx/tools/cdn-worker/.wrangler/tmp/bundle-ZjfZhg/middleware-insertion-facade.js";
import { __facade_invoke__, __facade_register__, Dispatcher } from "/Users/chris/.npm-global/lib/node_modules/wrangler/templates/middleware/common.ts";
import type { WorkerEntrypointConstructor } from "/Users/chris/Projects/htmx/tools/cdn-worker/.wrangler/tmp/bundle-ZjfZhg/middleware-insertion-facade.js";

// Preserve all the exports from the worker
export * from "/Users/chris/Projects/htmx/tools/cdn-worker/.wrangler/tmp/bundle-ZjfZhg/middleware-insertion-facade.js";

class __Facade_ScheduledController__ implements ScheduledController {
	readonly #noRetry: ScheduledController["noRetry"];

	constructor(
		readonly scheduledTime: number,
		readonly cron: string,
		noRetry: ScheduledController["noRetry"]
	) {
		this.#noRetry = noRetry;
	}

	noRetry() {
		if (!(this instanceof __Facade_ScheduledController__)) {
			throw new TypeError("Illegal invocation");
		}
		// Need to call native method immediately in case uncaught error thrown
		this.#noRetry();
	}
}

function wrapExportedHandler(worker: ExportedHandler): ExportedHandler {
	// If we don't have any middleware defined, just return the handler as is
	if (
		__INTERNAL_WRANGLER_MIDDLEWARE__ === undefined ||
		__INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
	) {
		return worker;
	}
	// Otherwise, register all middleware once
	for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
		__facade_register__(middleware);
	}

	const fetchDispatcher: ExportedHandlerFetchHandler = function (
		request,
		env,
		ctx
	) {
		if (worker.fetch === undefined) {
			throw new Error("Handler does not export a fetch() function.");
		}
		return worker.fetch(request, env, ctx);
	};

	return {
		...worker,
		fetch(request, env, ctx) {
			const dispatcher: Dispatcher = function (type, init) {
				if (type === "scheduled" && worker.scheduled !== undefined) {
					const controller = new __Facade_ScheduledController__(
						Date.now(),
						init.cron ?? "",
						() => {}
					);
					return worker.scheduled(controller, env, ctx);
				}
			};
			return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
		},
	};
}

function wrapWorkerEntrypoint(
	klass: WorkerEntrypointConstructor
): WorkerEntrypointConstructor {
	// If we don't have any middleware defined, just return the handler as is
	if (
		__INTERNAL_WRANGLER_MIDDLEWARE__ === undefined ||
		__INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
	) {
		return klass;
	}
	// Otherwise, register all middleware once
	for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
		__facade_register__(middleware);
	}

	// `extend`ing `klass` here so other RPC methods remain callable
	return class extends klass {
		#fetchDispatcher: ExportedHandlerFetchHandler<Record<string, unknown>> = (
			request,
			env,
			ctx
		) => {
			this.env = env;
			this.ctx = ctx;
			if (super.fetch === undefined) {
				throw new Error("Entrypoint class does not define a fetch() function.");
			}
			return super.fetch(request);
		};

		#dispatcher: Dispatcher = (type, init) => {
			if (type === "scheduled" && super.scheduled !== undefined) {
				const controller = new __Facade_ScheduledController__(
					Date.now(),
					init.cron ?? "",
					() => {}
				);
				return super.scheduled(controller);
			}
		};

		fetch(request: Request<unknown, IncomingRequestCfProperties>) {
			return __facade_invoke__(
				request,
				this.env,
				this.ctx,
				this.#dispatcher,
				this.#fetchDispatcher
			);
		}
	};
}

let WRAPPED_ENTRY: ExportedHandler | WorkerEntrypointConstructor | undefined;
if (typeof ENTRY === "object") {
	WRAPPED_ENTRY = wrapExportedHandler(ENTRY);
} else if (typeof ENTRY === "function") {
	WRAPPED_ENTRY = wrapWorkerEntrypoint(ENTRY);
}
export default WRAPPED_ENTRY;
