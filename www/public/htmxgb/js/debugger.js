/* global EVENT_NEW_FRAME, EVENT_AUDIO_BUFFER_FULL, EVENT_UNTIL_TICKS, vm, emulator, API */

let debug;

// Consts

const EVENT_BREAKPOINT = 8;
const EXECUTING_CTX_SYMBOL = "_executing_ctx";
const FIRST_CTX_SYMBOL = "_first_ctx";
const SCRIPT_MEMORY_SYMBOL = "_script_memory";
const CURRENT_SCENE_SYMBOL = "_current_scene";
const MAX_GLOBAL_VARS = "MAX_GLOBAL_VARS";

// Helpers

const toAddrHex = (value) =>
  ("0000" + value.toString(16).toUpperCase()).slice(-4);

const parseDebuggerSymbol = (input) => {
  const match = input.match(
    /GBVM\$([^$]+)\$([^$]+)\$([^$]+)\$([^$]+)\$([^$]+)\$([^$]+)/
  );
  if (!match) {
    return undefined;
  }
  return {
    scriptSymbol: match[1],
    scriptEventId: match[2].replace(/_/g, "-"),
    sceneId: match[3].replace(/_/g, "-"),
    entityType: match[4],
    entityId: match[5].replace(/_/g, "-"),
    scriptKey: match[6],
  };
};

const parseDebuggerEndSymbol = (input) => {
  const match = input.match(/GBVM_END\$([^$]+)\$([^$]+)/);
  if (!match) {
    return undefined;
  }
  return {
    scriptSymbol: match[1],
  };
};

// Debugger

class Debug {
  constructor(emulator) {
    this.emulator = emulator;
    this.module = emulator.module;
    this.e = emulator.e;

    this.vramCanvas = document.createElement("canvas");
    this.vramCanvas.width = 256;
    this.vramCanvas.height = 256;

    this.memoryMap = {};
    this.globalVariables = {};
    this.variableMap = {};
    this.memoryDict = new Map();

    this.breakpoints = [];
    this.pauseOnScriptChanged = false;
    this.pauseOnWatchedVariableChanged = true;
    this.pauseOnVMStep = false;
    this.currentScriptSymbol = "";
    this.scriptContexts = [];
    this.pausedUI = null;
    this.prevGlobals = [];
    this.watchedVariables = [];

    this.debugRunUntil = (ticks) => {
      while (true) {
        const event = this.module._emulator_run_until_f64(this.e, ticks);
        if (event & EVENT_NEW_FRAME) {
          this.emulator.rewind.pushBuffer();
          this.emulator.video.uploadTexture();
        }
        if (event & EVENT_BREAKPOINT) {
          // Breakpoint hit
          const firstCtxAddr = this.memoryMap[FIRST_CTX_SYMBOL];
          const executingCtxAddr = this.memoryMap[EXECUTING_CTX_SYMBOL];

          const currentCtx = this.readMemInt16(executingCtxAddr);
          let firstCtx = debug.readMemInt16(firstCtxAddr);
          let scriptContexts = [];
          let currentCtxData = undefined;
          const prevCtxs = this.scriptContexts;

          while (firstCtx !== 0) {
            const ctxAddr = debug.readMemInt16(firstCtx);
            const ctxBank = debug.readMem(firstCtx + 2);
            const ctxStackPtrAddr = debug.readMemInt16(firstCtx + 8);
            const ctxStackBaseAddr = debug.readMemInt16(firstCtx + 10);

            const closestAddr = debug.getClosestAddress(ctxBank, ctxAddr);
            const closestSymbol = debug.getSymbol(ctxBank, closestAddr);
            const closestGBVMSymbol = parseDebuggerSymbol(closestSymbol);
            const prevCtx = prevCtxs[scriptContexts.length];

            let stackString = "";
            for (var i = ctxStackBaseAddr; i < ctxStackPtrAddr + 4; i += 2) {
              stackString += `${i === ctxStackPtrAddr ? "->" : "  "}${toAddrHex(
                i
              )}: ${debug.readMemInt16(i)}\n`;
            }

            const ctxData = {
              address: ctxAddr,
              bank: ctxBank,
              current: currentCtx === firstCtx,
              closestAddr,
              closestSymbol,
              closestGBVMSymbol,
              prevClosestSymbol: prevCtx?.closestSymbol,
              prevClosestGBVMSymbol: prevCtx?.closestGBVMSymbol,
              stackString,
            };

            scriptContexts.push(ctxData);
            if (ctxData.current) {
              currentCtxData = ctxData;
            }

            firstCtx = debug.readMemInt16(firstCtx + 3);
          }
          this.scriptContexts = scriptContexts;

          if (currentCtxData) {
            // If pausing on VM Step and current script block changed
            if (
              this.pauseOnVMStep &&
              currentCtxData.closestGBVMSymbol &&
              currentCtxData.closestGBVMSymbol.scriptEventId !== "end" &&
              currentCtxData.closestSymbol !== currentCtxData.prevClosestSymbol
            ) {
              emulator.pause();
              this.pauseOnVMStep = false;
              break;
            }
            // If manual breakpoint is hit
            if (
              currentCtxData.closestGBVMSymbol &&
              currentCtxData.address === currentCtxData.closestAddr &&
              currentCtxData.closestSymbol !==
                currentCtxData.prevClosestSymbol &&
              this.breakpoints.includes(
                currentCtxData.closestGBVMSymbol.scriptEventId
              )
            ) {
              this.pauseOnVMStep = true;
              emulator.pause();
              break;
            }

            if (
              this.pauseOnScriptChanged &&
              // Found matching GBVM event
              currentCtxData.closestGBVMSymbol &&
              // GBVM event has changed since last pause
              (!currentCtxData.prevClosestGBVMSymbol ||
                currentCtxData.closestGBVMSymbol.scriptSymbol !==
                  currentCtxData.prevClosestGBVMSymbol.scriptSymbol)
            ) {
              this.pauseOnVMStep = true;
              emulator.pause();
              break;
            }

            if (this.pauseOnWatchedVariableChanged) {
              const globals = this.getGlobals();
              if (this.prevGlobals.length > 0) {
                // Check if watched has change
                const modified = !this.prevGlobals.every(
                  (v, i) => v === globals[i]
                );
                if (modified) {
                  const changedVariable = this.watchedVariables.find(
                    (variableId) => {
                      const variableData = this.variableMap[variableId];
                      const symbol = variableData?.symbol;
                      const variableIndex = this.globalVariables[symbol];
                      if (variableIndex !== undefined) {
                        return (
                          this.prevGlobals[variableIndex] !== undefined &&
                          globals[variableIndex] !==
                            this.prevGlobals[variableIndex]
                        );
                      }
                      return false;
                    }
                  );
                  if (changedVariable) {
                    this.pauseOnVMStep = true;
                    emulator.pause();
                  }
                }
              }
              this.prevGlobals = globals;
            }
          }
        }
        if (event & EVENT_AUDIO_BUFFER_FULL && !this.emulator.isRewinding) {
          this.emulator.audio.pushBuffer();
        }
        if (event & EVENT_UNTIL_TICKS) {
          break;
        }
      }
      if (this.module._emulator_was_ext_ram_updated(this.e)) {
        vm.extRamUpdated = true;
      }
    };

    // replace the emulator run method with the debug one
    this.emulator.runUntil = this.debugRunUntil;
  }

  initialize(
    memoryMap,
    globalVariables,
    variableMap,
    pauseOnScriptChanged,
    pauseOnWatchedVarChanged,
    breakpoints,
    watchedVariables
  ) {
    this.memoryMap = memoryMap;
    this.globalVariables = globalVariables;
    this.variableMap = variableMap;
    this.pauseOnScriptChanged = pauseOnScriptChanged;
    this.pauseOnWatchedVariableChanged = pauseOnWatchedVarChanged;
    this.breakpoints = breakpoints;
    this.watchedVariables = watchedVariables;

    const memoryDict = new Map();
    Object.keys(memoryMap).forEach((k) => {
      // Banked resources
      const match = k.match(/___bank_(.*)/);
      if (match) {
        const label = `_${match[1]}`;
        const bank = memoryMap[k];
        if (memoryMap[label]) {
          const n = memoryDict.get(bank) ?? new Map();
          const ptr = memoryMap[label] & 0x0ffff;
          n.set(ptr, label);
          memoryDict.set(bank, n);
        }
      }
      // Script debug symbols
      // const matchGBVM = k.match(/GBVM\$([^$]*)\$([^$]*)/);
      const matchGBVM = parseDebuggerSymbol(k);
      if (matchGBVM) {
        const bankLabel = `___bank_${matchGBVM.scriptSymbol}`;
        const label = k;
        const bank = memoryMap[bankLabel];
        if (memoryMap[label]) {
          const n = memoryDict.get(bank) ?? new Map();
          const ptr = memoryMap[label] & 0x0ffff;
          n.set(ptr, label);
          memoryDict.set(bank, n);
        }
      }

      const matchEnd = parseDebuggerEndSymbol(k);
      if (matchEnd) {
        const bankLabel = `___bank_${matchEnd.scriptSymbol}`;
        const label = k;
        const bank = memoryMap[bankLabel];
        if (memoryMap[label]) {
          const n = memoryDict.get(bank) ?? new Map();
          const ptr = memoryMap[label] & 0x0ffff;
          if (!n.get(ptr)) {
            n.set(ptr, label);
            memoryDict.set(bank, n);
          }
        }
      }
    });

    this.memoryDict = memoryDict;

    // Break on VM_STEP
    this.module._emulator_set_breakpoint(this.e, memoryMap["_VM_STEP"]);

    // Add paused UI

    this.initializeUI();
    this.initializeKeyboardShortcuts();
  }

  initializeUI() {
    const pausedUI = document.createElement("div");
    const pausedUIContainer = document.createElement("div");
    const pausedUILabel = document.createElement("span");
    const pausedUIResumeBtn = document.createElement("button");
    const pausedUIStepBtn = document.createElement("button");
    const pausedUIStepFrameBtn = document.createElement("button");

    document.body.appendChild(pausedUI);
    pausedUI.appendChild(pausedUIContainer);
    pausedUIContainer.appendChild(pausedUILabel);
    pausedUIContainer.appendChild(pausedUIResumeBtn);
    pausedUIContainer.appendChild(pausedUIStepBtn);
    pausedUIContainer.appendChild(pausedUIStepFrameBtn);

    pausedUI.id = "debug";
    pausedUILabel.innerHTML = "Paused in debugger";

    pausedUIResumeBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24"><path d="M2 3H6V21H2V3Z" /><path d="M22 12L7 21L7 3L22 12Z" /></svg>`;
    pausedUIResumeBtn.title = "Resume execution - F8";
    pausedUIResumeBtn.addEventListener("click", this.resume.bind(this));

    pausedUIStepBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24"><path d="M16 8v-4l8 8-8 8v-4h-5v-8h5zm-7 0h-2v8h2v-8zm-4.014 0h-1.986v8h1.986v-8zm-3.986 0h-1v8h1v-8z" /></svg>`;
    pausedUIStepBtn.title = "Step - F9";
    pausedUIStepBtn.addEventListener("click", this.step.bind(this));

    pausedUIStepFrameBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24"><path d="M19 12l-18 12v-24l18 12zm4-11h-4v22h4v-22z" /></svg>`;
    pausedUIStepFrameBtn.title = "Step Frame - F10";
    pausedUIStepFrameBtn.addEventListener("click", this.stepFrame.bind(this));

    this.pausedUI = pausedUI;
  }

  initializeKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "F8") {
        this.togglePlayPause();
      } else if (e.key === "F9") {
        this.step();
      } else if (e.key === "F10") {
        this.stepFrame();
      }
    });
  }

  getClosestAddress(bank, address) {
    const bankScripts = this.memoryDict.get(bank);
    const currentAddress = address;
    let closestAddress = -1;
    if (bankScripts) {
      const addresses = Array.from(bankScripts.keys()).sort();
      for (let i = 0; i < addresses.length; i++) {
        if (addresses[i] > currentAddress) {
          break;
        } else {
          closestAddress = addresses[i];
        }
      }
    }
    return closestAddress;
  }

  getSymbol(bank, address) {
    const symbol = this.memoryDict.get(bank)?.get(address) ?? "";
    return symbol.replace(/^_/, "");
  }

  readMem(addr) {
    return this.module._emulator_read_mem(this.e, addr);
  }

  readMemInt16(addr) {
    return (
      (this.module._emulator_read_mem(this.e, addr + 1) << 8) |
      this.module._emulator_read_mem(this.e, addr)
    );
  }

  writeMem(addr, value) {
    this.module._emulator_write_mem(this.e, addr, value & 0xff);
  }

  writeMemInt16(addr, value) {
    this.module._emulator_write_mem(this.e, addr, value & 0xff);
    this.module._emulator_write_mem(this.e, addr + 1, value >> 8);
  }

  readVariables(addr, size) {
    const ptr = this.module._emulator_get_wram_ptr(this.e) - 0xc000;
    return new Int16Array(
      this.module.HEAP8.buffer.slice(ptr + addr, ptr + addr + size * 2)
    );
  }

  renderVRam() {
    var ctx = this.vramCanvas.getContext("2d");
    var imgData = ctx.createImageData(256, 256);
    var ptr = this.module._malloc(4 * 256 * 256);
    this.module._emulator_render_vram(this.e, ptr);
    var buffer = new Uint8Array(this.module.HEAP8.buffer, ptr, 4 * 256 * 256);
    imgData.data.set(buffer);
    ctx.putImageData(imgData, 0, 0);
    this.module._free(ptr);
    return this.vramCanvas.toDataURL("image/png");
  }

  setBreakPoints(breakpoints) {
    this.breakpoints = breakpoints;
  }

  setWatchedVariables(watchedVariables) {
    this.watchedVariables = watchedVariables;
  }

  pause() {
    this.pauseOnVMStep = true;
    this.emulator.pause();
  }

  resume() {
    this.pauseOnVMStep = false;
    this.emulator.resume();
  }

  togglePlayPause() {
    if (this.isPaused()) {
      this.resume();
    } else {
      this.pause();
    }
  }

  step() {
    if (this.isPaused()) {
      this.resume();
      this.pauseOnVMStep = true;
    }
  }

  stepFrame() {
    if (this.isPaused()) {
      const ticks = this.module._emulator_get_ticks_f64(this.e) + 70224;
      this.emulator.runUntil(ticks);
      this.emulator.video.renderTexture();
    }
  }

  isPaused() {
    return this.emulator.isPaused || this.pauseOnVMStep;
  }

  getGlobals() {
    const variablesStartAddr = this.memoryMap[SCRIPT_MEMORY_SYMBOL];
    const variablesLength = this.globalVariables[MAX_GLOBAL_VARS];
    return this.readVariables(variablesStartAddr, variablesLength);
  }

  setGlobal(symbol, value) {
    const offset = (this.globalVariables[symbol] ?? 0) * 2;
    const variablesStartAddr = this.memoryMap[SCRIPT_MEMORY_SYMBOL];
    this.writeMemInt16(variablesStartAddr + offset, value);
    this.prevGlobals = this.getGlobals();
  }

  getCurrentSceneSymbol() {
    const currentSceneAddr = this.memoryMap[CURRENT_SCENE_SYMBOL];
    return this.getSymbol(
      this.readMem(currentSceneAddr),
      this.readMemInt16(currentSceneAddr + 1)
    );
  }

  getNumScriptCtxs() {
    const firstCtxAddr = this.memoryMap[FIRST_CTX_SYMBOL];
    let firstCtx = debug.readMemInt16(firstCtxAddr);
    let numCtxs = 0;
    while (firstCtx !== 0) {
      numCtxs++;
      firstCtx = debug.readMemInt16(firstCtx + 3);
    }
    return numCtxs;
  }
}

// Debugger Initialisation

let ready = setInterval(() => {
  const debugEnabled = window.location.href.includes("debug=true");
  if (!debugEnabled) {
    // Debugging not enabled
    clearInterval(ready);
    return;
  }

  console.log("Waiting for emulator...", emulator);
  if (emulator !== null) {
    debug = new Debug(emulator);
    clearInterval(ready);

    API.debugger.sendToProjectWindow({
      action: "initialized",
    });

    API.events.debugger.data.subscribe((_, packet) => {
      const { action, data } = packet;

      switch (action) {
        case "listener-ready":
          debug.initialize(
            data.memoryMap,
            data.globalVariables,
            data.variableMap,
            data.pauseOnScriptChanged,
            data.pauseOnWatchedVariableChanged,
            data.breakpoints,
            data.watchedVariables
          );

          setInterval(() => {
            if (debug.pausedUI) {
              debug.pausedUI.style.visibility = debug.isPaused()
                ? "visible"
                : "hidden";
            }

            const scriptContexts =
              debug.getNumScriptCtxs() > 0 ? debug.scriptContexts : [];

            if (scriptContexts.length === 0) {
              debug.pauseOnVMStep = false;
            }

            API.debugger.sendToProjectWindow({
              action: "update-globals",
              data: debug.getGlobals(),
              vram: debug.renderVRam(),
              isPaused: debug.isPaused(),
              scriptContexts,
              currentSceneSymbol: debug.getCurrentSceneSymbol(),
            });
          }, 100);
          break;
        case "set-breakpoints":
          debug.setBreakPoints(data);
          break;
        case "pause":
          debug.pause();
          break;
        case "resume":
          debug.resume();
          break;
        case "step":
          debug.step();
          break;
        case "step-frame":
          debug.stepFrame();
          break;
        case "pause-on-script":
          debug.pauseOnScriptChanged = data;
          break;
        case "pause-on-var":
          debug.pauseOnWatchedVariableChanged = data;
          break;
        case "set-global":
          debug.setGlobal(data.symbol, data.value);
          break;
        case "set-watched":
          debug.setWatchedVariables(data);
          break;
        default:
        // console.warn(event);
      }
    });
  }
}, 200);
