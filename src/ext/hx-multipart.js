//==========================================================
// hx-multipart.js
//
// Handles multipart htmx responses entirely from the extension.
// Includes the fetch-multipart parser prollyfill so
// Response.prototype.parts() is available when the extension loads.
//==========================================================
(() => {
    let api;

    function getReconnectDelay(config, attempt) {
        let baseDelay = htmx.parseInterval(config.reconnectDelay) ?? config.reconnectDelay;
        let maxDelay = htmx.parseInterval(config.reconnectMaxDelay) ?? config.reconnectMaxDelay;
        let delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

        if (config.reconnectJitter > 0) {
            let jitterRange = delay * config.reconnectJitter;
            delay = Math.max(0, delay + (Math.random() * 2 - 1) * jitterRange);
        }

        return delay;
    }

    function cleanup(element, reason) {
        let connection = element?._htmx?.multipart;
        if (!connection) return;

        connection.cancelled = true;
        connection.abort?.();
        connection.abortController?.abort();
        connection.iterator?.return?.().catch?.(() => {
        });
        connection.delayCanceller?.();
        if (connection.visibilityHandler) {
            document.removeEventListener('visibilitychange', connection.visibilityHandler);
        }
        api.triggerHtmxEvent(element, 'htmx:multipart:close', {
            connection,
            reason: reason || 'cleanup'
        });
        delete element._htmx.multipart;
    }

    async function handleMultipartResponse(ctx, type) {
        let element = ctx.sourceElement;
        let hasConnect = api.attributeValue(element, 'hx-multipart:connect') != null;
        let hxConfig = api.HCON.parse(api.attributeValue(element, 'hx-config')).multipart || {};
        let config = {
            reconnect: hasConnect,
            reconnectDelay: 500,
            reconnectMaxDelay: 60000,
            reconnectMaxAttempts: Infinity,
            reconnectJitter: 0.3,
            pauseOnBackground: hasConnect,
            ...htmx.config.multipart,
            ...hxConfig
        };
        let connection = {
            url: ctx.request.action,
            config,
            abort: ctx.request.abort,
            abortController: null,
            iterator: null,
            delayCanceller: null,
            visibilityHandler: null,
            unpauseResolver: null,
            attempt: 0,
            cancelled: false,
            reconnectRequested: false,
            status: ctx.response.status
        };
        api.htmxProp(element).multipart = connection;

        if (!api.triggerHtmxEvent(element, 'htmx:multipart:before:connection', {connection}) || connection.cancelled) {
            cleanup(element, 'cancelled');
            return;
        }
        api.triggerHtmxEvent(element, 'htmx:multipart:after:connection', {connection});

        if (config.pauseOnBackground) {
            connection.visibilityHandler = () => {
                if (document.hidden) {
                    connection.reconnectRequested = true;
                    connection.iterator?.return?.().catch?.(() => {
                    });
                    connection.abort?.();
                    connection.abortController?.abort();
                } else {
                    connection.unpauseResolver?.();
                }
            };
            document.addEventListener('visibilitychange', connection.visibilityHandler);
        }

        let currentResponse = ctx.response.raw;
        let {
            target: envelopeTarget,
            swap: envelopeSwap,
            select: envelopeSelect,
            retarget: envelopeRetarget,
            reswap: envelopeReswap,
            reselect: envelopeReselect
        } = extractPartActions(currentResponse.headers);
        let {
            content,
            target: requestTarget,
            ...defaultSwap
        } = ctx.swap;
        let defaultTarget = envelopeRetarget ?? envelopeTarget ?? requestTarget;
        let defaultSwapValue = envelopeReswap ?? envelopeSwap;
        let defaultSelect = envelopeReselect ?? envelopeSelect ?? defaultSwap.select;

        try {
            while (element.isConnected && !connection.cancelled) {
                if (connection.attempt > 0) {
                    if (!config.reconnect || connection.attempt > config.reconnectMaxAttempts) break;

                    if (config.pauseOnBackground && document.hidden) {
                        await new Promise(resolve => connection.unpauseResolver = resolve);
                        connection.unpauseResolver = null;
                        if (!element.isConnected || connection.cancelled) break;
                    }

                    connection.cancelled = false;
                    if (!api.triggerHtmxEvent(element, 'htmx:multipart:before:connection', {connection}) || connection.cancelled) break;

                    await new Promise(resolve => {
                        let done = () => {
                            connection.delayCanceller = null;
                            resolve();
                        };
                        let timer = setTimeout(done, getReconnectDelay(config, connection.attempt));
                        connection.delayCanceller = () => {
                            clearTimeout(timer);
                            done();
                        };
                    });
                    if (!element.isConnected || connection.cancelled) break;

                    let ac = new AbortController();
                    connection.abortController = ac;
                    try {
                        currentResponse = await fetch(ctx.request.action, {
                            ...ctx.request,
                            signal: ac.signal
                        });
                    } catch (error) {
                        if (!ac.signal.aborted) {
                            api.triggerHtmxEvent(element, 'htmx:multipart:error', {
                                error,
                                url: ctx.request.action
                            });
                        }
                        connection.attempt++;
                        continue;
                    }

                    if (!currentResponse.ok) {
                        api.triggerHtmxEvent(element, 'htmx:multipart:error', {
                            error: new Error(`Multipart reconnect failed with status ${currentResponse.status}`),
                            status: currentResponse.status,
                            url: ctx.request.action
                        });
                        connection.attempt++;
                        continue;
                    }

                    let contentType = currentResponse.headers.get('Content-Type') || '';
                    let nextType = contentType.split(';', 1)[0].trim().toLowerCase();
                    if (nextType !== type) {
                        api.triggerHtmxEvent(element, 'htmx:multipart:error', {
                            error: new Error(`Multipart reconnect returned ${nextType || 'no Content-Type'}`),
                            status: currentResponse.status,
                            url: ctx.request.action
                        });
                        connection.attempt++;
                        continue;
                    }

                    connection.status = currentResponse.status;
                    connection.reconnectRequested = false;
                    connection.attempt = 0;
                    api.triggerHtmxEvent(element, 'htmx:multipart:after:connection', {connection});
                }

                let pending = new Set();
                let iterator = currentResponse.parts()[Symbol.asyncIterator]();
                connection.iterator = iterator;

                try {
                    while (true) {
                        let {done, value: part} = await iterator.next();
                        if (done) break;

                        let pendingWork = [];
                        let detail = {
                            ctx,
                            part,
                            cancelled: false,
                            waitUntil: promise => pendingWork.push(Promise.resolve(promise))
                        };
                        let shouldProcess = api.triggerHtmxEvent(
                            ctx.sourceElement,
                            'htmx:multipart:before:part',
                            detail
                        );

                        await Promise.all(pendingWork);
                        if (!shouldProcess || detail.cancelled) continue;

                        let {
                            swap,     // HX-Swap
                            target,   // HX-Target
                            select,   // HX-Select
                            reswap,   // HX-Reswap
                            retarget, // HX-Retarget
                            reselect, // HX-Reselect
                            ...actions // other HX-* headers in camelCase
                        } = extractPartActions(part.headers);

                        // Let part headers override envelope and request defaults.
                        swap = reswap ?? swap ?? defaultSwapValue;
                        target = retarget ?? target ?? defaultTarget;
                        select = reselect ?? select ?? defaultSelect;

                        let text = await part.text();
                        let handling = (async () => {
                            let skipSwap = api.runActions(actions, ctx.sourceElement, {ctx, part});

                            if (!skipSwap) {
                                let options = {source: ctx.sourceElement};
                                if (swap) {
                                    options.swap = swap;
                                    if (defaultSwap.select !== undefined) options.select = defaultSwap.select;
                                    if (defaultSwap.selectOOB !== undefined) options.selectOOB = defaultSwap.selectOOB;
                                } else {
                                    for (let key in defaultSwap) {
                                        if (defaultSwap[key] !== undefined) options[key] = defaultSwap[key];
                                    }
                                }
                                if (select) options.select = select;
                                await htmx.swap(text, target, options);
                            }

                            api.triggerHtmxEvent(ctx.sourceElement, 'htmx:multipart:after:part', {ctx, part});
                        })();

                        if (type === 'multipart/parallel') {
                            pending.add(handling);
                            handling.then(
                                () => pending.delete(handling),
                                () => {}
                            );
                        } else {
                            await handling;
                        }
                    }
                    await Promise.all(pending);
                } catch (error) {
                    if (!connection.cancelled) {
                        api.triggerHtmxEvent(element, 'htmx:multipart:error', {
                            error,
                            url: ctx.request.action
                        });
                    }
                } finally {
                    connection.iterator = null;
                }

                if (!config.reconnect && !connection.reconnectRequested) break;
                if (!element.isConnected || connection.cancelled) break;
                connection.reconnectRequested = false;
                connection.attempt++;
            }
        } finally {
            cleanup(element, element.isConnected ? 'ended' : 'removed');
        }
    }

    function extractPartActions(headers) {
        let actions = {};
        for (let [name, value] of headers) {
            name = name.toLowerCase();
            if (name.startsWith('hx-')) {
                actions[name.slice(3).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = value;
            }
        }
        return actions;
    }

    htmx.registerExtension('hx-multipart', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        /**
         * Add `multipart/mixed` and `multipart/parallel` to every htmx request's `Accept` header.
         */
        htmx_config_request: (element, {ctx: {request}}) => {
            request.headers['Accept'] = `${request.headers['Accept'] ?? request.headers['accept'] ?? 'text/html'}, multipart/mixed, multipart/parallel`;
        },

        /**
         * Connect each `hx-multipart:connect` element on `hx-trigger`, or on load.
         */
        htmx_after_process: (element) => {
            let metaCharacter = htmx.config.metaCharacter || ':';
            let selector = [
                `hx-multipart${metaCharacter}connect`,
                htmx.config.prefix && `${htmx.config.prefix}multipart${metaCharacter}connect`
            ]
                .filter(Boolean)
                .map(name => `[${CSS.escape(name)}]`)
                .join(',');

            // Find elements with hx-multipart:connect
            let connectElements = [
                element,
                ...element.querySelectorAll(selector)
            ].filter(elt => elt.matches?.(selector));

            for (let connectElt of connectElements) {
                let hxMultipartConnect = api.attributeValue(connectElt, 'hx-multipart:connect');
                let hxMultipartClose = api.attributeValue(connectElt, 'hx-multipart:close');
                let hxTrigger = api.attributeValue(connectElt, 'hx-trigger');

                let url = hxMultipartConnect;

                api.onTrigger(
                    connectElt,
                    hxTrigger || 'load',
                    () => {
                        if (connectElt._htmx?.multipart) return;

                        htmx.ajax(
                            'GET',
                            url,
                            {
                                source: connectElt,
                                request: {timeout: 0}
                            });
                    }
                );

                if (hxMultipartClose) {
                    api.onTrigger(connectElt, hxMultipartClose, () => cleanup(connectElt, 'part'));
                }
            }
        },

        htmx_before_response: (element, detail) => {
            let ctx = detail.ctx;
            let response = ctx.response.raw;
            let contentType = response.headers.get('Content-Type') || '';
            let type = contentType.split(';', 1)[0].trim().toLowerCase();
            if (type !== 'multipart/mixed' && type !== 'multipart/parallel') return;

            let handled = false;
            response.text = async () => {
                if (handled) return '';
                handled = true;
                await handleMultipartResponse(ctx, type);
                ctx.swap.style = 'none';
                return '';
            };
        },

        htmx_before_cleanup: (element) => {
            cleanup(element, 'removed');
        }
    });

// BEGIN vendored fetch-multipart parser from https://github.com/scriptogre/fetch-multipart @ e08a100de2
// Copied so this extension can parse multipart responses without requiring core htmx changes.
// @ts-self-types="./fetch-multipart.d.ts"
// Streaming multipart parser for the browser.
//
// Public API:
//   Response.prototype.parts()            -> AsyncIterable<BodyPart>
//   BodyPart.prototype.parts()            -> AsyncIterable<BodyPart>
//   getMultipartBoundary(contentType)     -> string | null
//   parseContentDisposition(header)       -> { type, name, filename }
//   class BodyPart implements Body
//   class MultipartParser
//   class MultipartParseError extends Error
//
// Parser engine ported from @remix-run/multipart-parser (MIT, Shopify Inc).
// https://github.com/remix-run/remix/tree/main/packages/multipart-parser

/**
 * Thrown when a multipart stream cannot be parsed.
 */
class MultipartParseError extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'MultipartParseError'
  }
}

// ---------- byte search ----------

const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder()

// Boyer-Moore-Horspool over a Uint8Array.
function createSearch(pattern) {
  const needle = utf8Encoder.encode(pattern)
  const needleEnd = needle.length - 1
  const skipTable = new Uint8Array(256).fill(needle.length)
  for (let i = 0; i < needleEnd; ++i) skipTable[needle[i]] = needleEnd - i

  return (haystack, start = 0) => {
    const haystackLength = haystack.length
    let i = start + needleEnd
    while (i < haystackLength) {
      for (let j = needleEnd, k = i; j >= 0 && haystack[k] === needle[j]; --j, --k) {
        if (j === 0) return k
      }
      i += skipTable[haystack[i]]
    }
    return -1
  }
}

// Find the start index (within `haystack[from..]`) where a suffix of haystack
// matches a prefix of `pattern`. Used to detect a boundary split across chunks.
function createPartialTailSearch(pattern) {
  const needle = utf8Encoder.encode(pattern)
  const byteIndexes = Object.create(null)
  for (let i = 0; i < needle.length; ++i) {
    const byte = needle[i]
    if (byteIndexes[byte] === undefined) byteIndexes[byte] = []
    byteIndexes[byte].push(i)
  }

  return (haystack, from = 0) => {
    const haystackEnd = haystack.length - 1
    if (haystackEnd < from) return -1
    const indexes = byteIndexes[haystack[haystackEnd]]
    if (indexes) {
      for (let i = indexes.length - 1; i >= 0; --i) {
        for (let j = indexes[i], k = haystackEnd; j >= 0 && k >= from && haystack[k] === needle[j]; --j, --k) {
          if (j === 0) return k
        }
      }
    }
    return -1
  }
}

// ---------- parser state machine ----------

const State = Object.freeze({
  // Scan for the opening "--boundary", discarding any preamble bytes.
  START: 0,
  // After a boundary, read "\r\n" or "--".
  READING_BOUNDARY_SUFFIX: 1,
  // Read part headers through "\r\n\r\n".
  READING_HEADERS: 2,
  // No Content-Length. Scan for the next boundary.
  READING_BODY_UNTIL_BOUNDARY: 3,
  // Read exactly the declared Content-Length bytes.
  READING_BODY_WITH_CONTENT_LENGTH: 4,
  // Content-Length body is complete. Validate the following boundary.
  EXPECTING_BOUNDARY: 5,
  // Final "--" after a boundary was read.
  DONE: 6,
})

const findDoubleNewline = createSearch('\r\n\r\n')
const contentLengthRegex = /^content-length:\s*(\d+)/im

function extractContentLength(headerBytes) {
  const match = contentLengthRegex.exec(utf8Decoder.decode(headerBytes))
  return match ? Number(match[1]) : -1
}

class MultipartParser {
  #findOpeningBoundary
  #openingBoundaryLength
  #findBoundary
  #findPartialTailBoundary
  #boundaryLength
  #boundaryBytes

  #state = State.START
  #buffer = null
  #currentHeader = null
  #remainingBodyBytes = 0
  #activePart = null

  /**
   * Driver hook: called when the active part's body stream wants more bytes.
   * The driver should pump from its source until the controller is satisfied.
   *
   * @type {((part: BodyPart) => Promise<void>) | null}
   */
  onPull = null

  constructor(boundary) {
    // RFC 2046 §5.1.1 limits the boundary to 1-70 ASCII characters from a
    // small subset. Real-world implementations stick to printable ASCII; we
    // enforce that broader range so non-ASCII boundaries fail loudly instead
    // of silently misaligning the parser's char-length arithmetic.
    if (!/^[\x20-\x7E]{1,70}$/.test(boundary)) {
      throw new MultipartParseError(
        'Invalid boundary: must be 1-70 printable ASCII characters',
      )
    }

    this.boundary = boundary
    this.#findOpeningBoundary = createSearch(`--${boundary}`)
    this.#openingBoundaryLength = 2 + boundary.length
    const boundaryPattern = `\r\n--${boundary}`
    this.#findBoundary = createSearch(boundaryPattern)
    this.#findPartialTailBoundary = createPartialTailSearch(boundaryPattern)
    this.#boundaryLength = 4 + boundary.length
    this.#boundaryBytes = utf8Encoder.encode(boundaryPattern)
  }

  /** The part currently receiving body bytes, or null. */
  get activePart() {
    return this.#activePart
  }

  /**
   * Feed a chunk to the parser. Invokes `onPart` (if provided) for each
   * BodyPart that opens during this call. Body bytes for the active part
   * are routed to its body stream synchronously.
   *
   * @param {Uint8Array} chunk
   * @param {((part: BodyPart) => void) | null} [onPart]
   */
  write(chunk, onPart = null) {
    // Discard epilogue bytes after the closing boundary (RFC 2046 §5.1.1).
    if (this.#state === State.DONE) return

    let index = 0
    let chunkLength = chunk.length

    if (this.#buffer !== null) {
      if (this.#state === State.READING_BODY_UNTIL_BOUNDARY) {
        const carry = this.#buffer
        this.#buffer = null
        const carryResult = this.#analyzeCarryBoundary(carry, chunk)

        if (carryResult.kind === 'none') {
          this.#routeBody(carry)
        } else if (carryResult.kind === 'partial') {
          if (carryResult.start > 0) this.#routeBody(carry.subarray(0, carryResult.start))
          const tailLength = carry.length + chunk.length - carryResult.start
          const tail = new Uint8Array(tailLength)
          const carryTail = carry.subarray(carryResult.start)
          tail.set(carryTail, 0)
          tail.set(chunk, carryTail.length)
          this.#buffer = tail
          return
        } else {
          if (carryResult.start > 0) this.#routeBody(carry.subarray(0, carryResult.start))
          this.#finalizeActivePart()
          this.#state = State.READING_BOUNDARY_SUFFIX
          const carryAfterStart = carry.length - carryResult.start
          index = this.#boundaryLength - carryAfterStart
        }
      } else {
        const newChunk = new Uint8Array(this.#buffer.length + chunkLength)
        newChunk.set(this.#buffer, 0)
        newChunk.set(chunk, this.#buffer.length)
        chunk = newChunk
        chunkLength = chunk.length
        this.#buffer = null
      }
    }

    while (true) {
      if (this.#state === State.READING_BODY_UNTIL_BOUNDARY) {
        const boundaryIndex = this.#findBoundary(chunk, index)
        if (boundaryIndex === -1) {
          const partialTailIndex = this.#findPartialTailBoundary(chunk, index)
          if (partialTailIndex === -1) {
            this.#routeBody(index === 0 ? chunk : chunk.subarray(index))
          } else {
            if (partialTailIndex > index) this.#routeBody(chunk.subarray(index, partialTailIndex))
            this.#buffer = chunk.subarray(partialTailIndex)
          }
          break
        }

        if (boundaryIndex > index) this.#routeBody(chunk.subarray(index, boundaryIndex))
        this.#finalizeActivePart()
        index = boundaryIndex + this.#boundaryLength
        this.#state = State.READING_BOUNDARY_SUFFIX
      }

      if (this.#state === State.READING_BOUNDARY_SUFFIX) {
        if (chunkLength - index < 2) {
          this.#buffer = chunk.subarray(index)
          break
        }
        // Closing boundary is followed by '--'.
        if (chunk[index] === 45 && chunk[index + 1] === 45) {
          this.#state = State.DONE
          break
        }
        index += 2 // skip \r\n
        this.#state = State.READING_HEADERS
      }

      if (this.#state === State.READING_HEADERS) {
        if (chunkLength - index < 4) {
          this.#buffer = chunk.subarray(index)
          break
        }
        const headerEndIndex = findDoubleNewline(chunk, index)
        if (headerEndIndex === -1) {
          this.#buffer = chunk.subarray(index)
          break
        }
        this.#currentHeader = chunk.subarray(index, headerEndIndex)
        index = headerEndIndex + 4 // skip \r\n\r\n
        const contentLength = extractContentLength(this.#currentHeader)
        this.#activePart = new BodyPart(this.#currentHeader, this.onPull)
        if (onPart) onPart(this.#activePart)
        if (contentLength >= 0) {
          this.#remainingBodyBytes = contentLength
          this.#state = State.READING_BODY_WITH_CONTENT_LENGTH
        } else {
          this.#state = State.READING_BODY_UNTIL_BOUNDARY
        }
        continue
      }

      // Fast path: the part declared its size, so read exactly that many
      // body bytes and close its stream without waiting for more wire data.
      if (this.#state === State.READING_BODY_WITH_CONTENT_LENGTH) {
        const bodyBytes = Math.min(this.#remainingBodyBytes, chunkLength - index)
        if (bodyBytes > 0) this.#routeBody(chunk.subarray(index, index + bodyBytes))
        this.#remainingBodyBytes -= bodyBytes
        index += bodyBytes

        if (this.#remainingBodyBytes > 0) {
          this.#buffer = chunk.subarray(index)
          break
        }
        this.#finalizeActivePart()
        this.#state = State.EXPECTING_BOUNDARY
      }

      if (this.#state === State.EXPECTING_BOUNDARY) {
        if (chunkLength - index < this.#boundaryLength) {
          this.#buffer = chunk.subarray(index)
          break
        }
        for (let i = 0; i < this.#boundaryLength; i++) {
          if (chunk[index + i] !== this.#boundaryBytes[i]) {
            throw new MultipartParseError(
              'Content-Length body is not followed by boundary',
            )
          }
        }

        index += this.#boundaryLength
        this.#state = State.READING_BOUNDARY_SUFFIX
      }

      if (this.#state === State.START) {
        if (chunkLength < this.#openingBoundaryLength) {
          this.#buffer = chunk
          break
        }
        // Discard preamble bytes before the opening boundary (RFC 2046 §5.1.1).
        const openingIndex = this.#findOpeningBoundary(chunk)
        if (openingIndex === -1) {
          const tailStart = chunkLength - (this.#openingBoundaryLength - 1)
          this.#buffer = chunk.subarray(tailStart)
          break
        }
        index = openingIndex + this.#openingBoundaryLength
        this.#state = State.READING_BOUNDARY_SUFFIX
      }
    }
  }

  finish() {
    // Flush any body bytes still in the carry buffer.
    if (this.#buffer && this.#state === State.READING_BODY_UNTIL_BOUNDARY) {
      this.#routeBody(this.#buffer)
      this.#buffer = null
    }
    if (this.#state !== State.DONE) {
      const message = this.#state === State.READING_BODY_WITH_CONTENT_LENGTH
        ? 'Stream ended before Content-Length body completed'
        : 'Stream ended before final boundary'
      const err = new MultipartParseError(message)
      this.abortActive(err)
      throw err
    }
  }

  /** Errors the active part's body stream. Used when the source stream errors. */
  abortActive(err) {
    if (this.#activePart) {
      this.#activePart._error(err)
      this.#activePart = null
    }
  }

  #routeBody(chunk) {
    if (chunk.length === 0) return
    if (this.#activePart) this.#activePart._enqueue(chunk)
  }

  #finalizeActivePart() {
    if (this.#activePart) {
      this.#activePart._close()
      this.#activePart = null
    }
  }

  // Detect a boundary whose start lies inside the carry buffer (from the
  // previous chunk) and continues into the current chunk.
  #analyzeCarryBoundary(carry, chunk) {
    const totalLength = carry.length + chunk.length

    for (let start = 0; start < carry.length; ++start) {
      const availableLength = totalLength - start
      const compareLength = Math.min(this.#boundaryLength, availableLength)

      let matched = true
      for (let i = 0; i < compareLength; ++i) {
        const sourceIndex = start + i
        const sourceByte =
          sourceIndex < carry.length ? carry[sourceIndex] : chunk[sourceIndex - carry.length]
        if (sourceByte !== this.#boundaryBytes[i]) {
          matched = false
          break
        }
      }
      if (!matched) continue

      if (availableLength >= this.#boundaryLength) return { kind: 'full', start }
      return { kind: 'partial', start }
    }

    return { kind: 'none' }
  }
}

// ---------- BodyPart (implements Body) ----------

function parseHeaderBytes(raw) {
  const headers = new Headers()
  const text = utf8Decoder.decode(raw)
  for (const line of text.split('\r\n')) {
    const match = line.match(/^([^:]+):(.*)/)
    if (match) headers.append(match[1].trim(), match[2].trim())
  }
  return headers
}

/**
 * A MIME body part. Implements the WHATWG Fetch `Body` interface plus a
 * `parts()` method for recursing into nested `multipart/*` bodies.
 *
 * The body is a live `ReadableStream<Uint8Array>` that receives bytes as the
 * parser sees them. Callers must consume each part's body (or cancel it)
 * before iterating to the next part; iterating past an unread body
 * auto-drains it.
 */
class BodyPart {
  /** @type {Uint8Array} */ #headerBytes
  /** @type {Headers | null} */ #headers = null
  #bodyUsed = false
  #closed = false
  /** @type {Error | null} */ #error = null

  // Body bytes accumulate here until something accesses `body` or `bytes()` etc.
  // If the parser finishes the part before the consumer touches it, the bytes
  // are returned directly (no ReadableStream construction).
  /** @type {Uint8Array[] | null} */ #pendingChunks = []

  /** @type {ReadableStream<Uint8Array> | null} */ #body = null
  /** @type {ReadableStreamDefaultController<Uint8Array> | null} */ #controller = null
  /** @type {((part: BodyPart) => Promise<void>) | null} */ #pullHook

  /**
   * @param {Uint8Array} headerBytes
   * @param {((part: BodyPart) => Promise<void>) | null} pullHook
   */
  constructor(headerBytes, pullHook) {
    this.#headerBytes = headerBytes
    this.#pullHook = pullHook
  }

  /** @returns {Headers} */
  get headers() {
    if (this.#headers === null) this.#headers = parseHeaderBytes(this.#headerBytes)
    return this.#headers
  }

  /** @returns {boolean} */
  get bodyUsed() {
    return this.#bodyUsed
  }

  /** @returns {ReadableStream<Uint8Array>} */
  get body() {
    if (this.#body === null) this.#materializeBody()
    return this.#body
  }

  /** @returns {Promise<Uint8Array>} */
  async bytes() {
    if (this.#bodyUsed) throw new TypeError('Body already used')
    this.#bodyUsed = true
    if (this.#body === null && this.#closed) {
      if (this.#error) throw this.#error
      const out = concatChunks(this.#pendingChunks)
      this.#pendingChunks = null
      return out
    }
    return new Response(this.body).bytes()
  }

  /** @returns {Promise<ArrayBuffer>} */
  async arrayBuffer() {
    return /** @type {ArrayBuffer} */ ((await this.bytes()).buffer)
  }

  /** @returns {Promise<string>} */
  async text() {
    return utf8Decoder.decode(await this.bytes())
  }

  /** @returns {Promise<any>} */
  async json() {
    return JSON.parse(await this.text())
  }

  /** @returns {Promise<Blob>} */
  async blob() {
    if (this.#bodyUsed) throw new TypeError('Body already used')
    this.#bodyUsed = true
    const type = this.headers.get('content-type') ?? ''
    if (this.#body === null && this.#closed) {
      if (this.#error) throw this.#error
      const blob = new Blob([concatChunks(this.#pendingChunks)], { type })
      this.#pendingChunks = null
      return blob
    }
    return new Response(this.body, { headers: { 'content-type': type } }).blob()
  }

  /**
   * Parse this part's body as a nested `multipart/*` message.
   *
   * @returns {AsyncGenerator<BodyPart, void, unknown>}
   */
  async *parts() {
    if (this.#bodyUsed) throw new TypeError('Body already used')
    this.#bodyUsed = true
    const contentType = this.headers.get('content-type')
    if (!contentType || !contentType.toLowerCase().startsWith('multipart/')) {
      throw new MultipartParseError('Content-Type is not multipart/*')
    }
    const boundary = getMultipartBoundary(contentType)
    if (!boundary) {
      throw new MultipartParseError('Content-Type has no boundary parameter')
    }
    yield* iterateStreamParts(this.body, boundary)
  }

  #materializeBody() {
    const self = this
    const pending = this.#pendingChunks
    this.#pendingChunks = null
    this.#body = new ReadableStream({
      start(controller) {
        self.#controller = controller
        for (const chunk of pending) controller.enqueue(chunk)
        if (self.#error) controller.error(self.#error)
        else if (self.#closed) controller.close()
      },
      async pull() {
        if (self.#pullHook && !self.#closed) await self.#pullHook(self)
      },
      cancel() {
        self.#closed = true
        self.#bodyUsed = true
      },
    })
  }

  // ---- internal: parser ----

  _enqueue(chunk) {
    if (this.#closed) return
    if (this.#controller) this.#controller.enqueue(chunk)
    else this.#pendingChunks.push(chunk)
  }

  _close() {
    if (this.#closed) return
    this.#closed = true
    if (this.#controller) this.#controller.close()
  }

  _error(err) {
    if (this.#closed) return
    this.#closed = true
    if (this.#controller) this.#controller.error(err)
    else this.#error = err
  }

  /** Drop incoming bytes; used when the iterator advances past an unread body. */
  _drain() {
    this.#closed = true
    this.#bodyUsed = true
    this.#pendingChunks = null
  }

  _wantsMore() {
    if (this.#closed) return false
    if (this.#controller) return (this.#controller.desiredSize ?? 0) > 0
    return true
  }
}

function concatChunks(chunks) {
  // Always copy. A returned Uint8Array's `.buffer` should be sized to the body,
  // not the source chunk it was subarray'd from.
  let total = 0
  for (const c of chunks) total += c.length
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

// ---------- public API ----------

/**
 * @param {string} contentType
 * @returns {string | null}
 */
function getMultipartBoundary(contentType) {
  const match = /boundary\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(contentType)
  return match ? (match[1] ?? match[2].trim()) : null
}

/**
 * @typedef {Object} ContentDispositionParts
 * @property {string | null} type - 'form-data', 'attachment', 'inline', etc.
 * @property {string | null} name - form field name from the `name=` parameter
 * @property {string | null} filename - decoded filename (`filename*=` wins over `filename=`)
 */

/**
 * Parse a `Content-Disposition` header into its components.
 *
 * @param {string | null} header
 * @returns {ContentDispositionParts}
 */
function parseContentDisposition(header) {
  if (typeof header !== 'string') return { type: null, name: null, filename: null }

  const segments = splitOnUnquotedSemicolon(header)
  const type = segments[0].trim().toLowerCase() || null

  const params = Object.create(null)
  for (let i = 1; i < segments.length; i++) {
    const eq = segments[i].indexOf('=')
    if (eq === -1) continue
    const key = segments[i].slice(0, eq).trim().toLowerCase()
    let value = segments[i].slice(eq + 1).trim()
    if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
      value = value.slice(1, -1)
    }
    params[key] = value
  }

  const filenameStar = params['filename*']
  const filename = filenameStar != null
    ? decodeRfc5987(filenameStar)
    : (params.filename ?? null)

  return { type, name: params.name ?? null, filename }
}

// Split on `;` but ignore semicolons inside a quoted-string.
function splitOnUnquotedSemicolon(input) {
  const parts = []
  let inQuotes = false
  let start = 0
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    if (ch === 34 /* " */) inQuotes = !inQuotes
    else if (ch === 59 /* ; */ && !inQuotes) {
      parts.push(input.slice(start, i))
      start = i + 1
    }
  }
  parts.push(input.slice(start))
  return parts
}

// Decode an RFC 5987 ext-value: charset'language'percent-encoded.
// https://www.rfc-editor.org/rfc/rfc5987#section-3.2.1
function decodeRfc5987(value) {
  const firstQuote = value.indexOf("'")
  if (firstQuote === -1) return null
  const secondQuote = value.indexOf("'", firstQuote + 1)
  if (secondQuote === -1) return null
  const charset = value.slice(0, firstQuote).toLowerCase()
  const encoded = value.slice(secondQuote + 1)
  if (charset !== 'utf-8') return null
  try {
    return decodeURIComponent(encoded)
  } catch {
    return null
  }
}

// Iterate the parts of a `Response` whose Content-Type is `multipart/*`.
async function* iterateResponseParts(response) {
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.toLowerCase().startsWith('multipart/')) {
    throw new MultipartParseError('Content-Type is not multipart/*')
  }
  if (!response.body) {
    throw new MultipartParseError('Response body is null')
  }
  const boundary = getMultipartBoundary(contentType)
  if (!boundary) {
    throw new MultipartParseError('Content-Type has no boundary parameter')
  }
  yield* iterateStreamParts(response.body, boundary)
}

// Drive the parser over a `ReadableStream<Uint8Array>` with a known boundary.
// Reads source bytes only when the active part's body controller wants more,
// propagating backpressure from consumer to source.
async function* iterateStreamParts(stream, boundary) {
  const parser = new MultipartParser(boundary)
  const reader = stream.getReader()

  // Head-pointer queue. shift() is O(1) on Arrays in V8 for queue-like usage,
  // but head-pointer avoids index walking entirely and lets us hoist the
  // common "queue has next part" fast path.
  const queue = []
  let head = 0
  let sourceDone = false
  let sourceError = null
  let pumpInflight = null

  const enqueuePart = (part) => queue.push(part)

  async function pump() {
    if (pumpInflight) return pumpInflight
    pumpInflight = (async () => {
      try {
        const { done, value } = await reader.read()
        if (done) {
          sourceDone = true
          try { parser.finish() } catch (err) { sourceError = err }
          return
        }
        if (value.length > 0) parser.write(value, enqueuePart)
      } catch (err) {
        sourceError = err
        sourceDone = true
        parser.abortActive(err)
      } finally {
        pumpInflight = null
      }
    })()
    return pumpInflight
  }

  parser.onPull = async (part) => {
    while (!sourceDone && !sourceError && part._wantsMore()) await pump()
  }

  try {
    while (true) {
      if (head < queue.length) {
        const part = queue[head++]
        if (head === queue.length) { queue.length = 0; head = 0 }
        yield part
        continue
      }
      if (sourceError) throw sourceError
      if (sourceDone) return

      // No queued parts and source still running. If the caller iterated past
      // an unread body, drop subsequent bytes for it while we scan for the
      // next boundary.
      const active = parser.activePart
      if (active) active._drain()

      await pump()
    }
  } finally {
    reader.releaseLock()
    parser.abortActive(new MultipartParseError('Iterator exited before stream ended'))
  }
}

// ---------- prollyfill: Response.prototype.parts() ----------
//
// Speculative install of a `parts()` method on Response. Mirrors the shape of
// `Response.prototype.formData()`. Conditional so a future native version wins
// automatically.

if (typeof Response !== 'undefined' && typeof Response.prototype.parts !== 'function') {
  Object.defineProperty(Response.prototype, 'parts', {
    value: function parts() {
      return iterateResponseParts(this)
    },
    writable: true,
    configurable: true,
  })
}
// END vendored fetch-multipart parser
})();
