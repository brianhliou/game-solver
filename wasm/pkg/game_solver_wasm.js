/* @ts-self-types="./game_solver_wasm.d.ts" */

/**
 * One morris board + its loaded WLD tablebase.
 */
export class Explorer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExplorerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_explorer_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    board_points() {
        const ret = wasm.explorer_board_points(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    has_tablebase() {
        const ret = wasm.explorer_has_tablebase(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Legal moves as flat `u32` groups of 6: `[white, black, w_hand, b_hand,
     * turn, value]`, where `value` is the move's worth *to the mover*
     * (0 win, 1 loss, 2 draw, 3 unknown).
     * @param {number} white
     * @param {number} black
     * @param {number} w_hand
     * @param {number} b_hand
     * @param {number} turn
     * @returns {Uint32Array}
     */
    legal_moves(white, black, w_hand, b_hand, turn) {
        const ret = wasm.explorer_legal_moves(this.__wbg_ptr, white, black, w_hand, b_hand, turn);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * `rings` = 2 (six men's, 16 points) or 3 (nine men's, 24 points); `men` per side.
     * @param {number} rings
     * @param {number} men
     */
    constructor(rings, men) {
        const ret = wasm.explorer_new(rings, men);
        this.__wbg_ptr = ret;
        ExplorerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Number of dense-index slots (the tablebase addresses these). f64 because it
     * can exceed u32.
     * @returns {number}
     */
    num_states() {
        const ret = wasm.explorer_num_states(this.__wbg_ptr);
        return ret;
    }
    /**
     * Load the packed 2-bit WLD tablebase (gzip-decompressed bytes).
     * @param {Uint8Array} bytes
     */
    set_tablebase(bytes) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.explorer_set_tablebase(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * The starting position `[white, black, w_hand, b_hand, turn]`.
     * @returns {Uint32Array}
     */
    start() {
        const ret = wasm.explorer_start(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * `Some` terminal value (0/1/2) for the side to move, or 3 if not terminal.
     * @param {number} white
     * @param {number} black
     * @param {number} w_hand
     * @param {number} b_hand
     * @param {number} turn
     * @returns {number}
     */
    terminal(white, black, w_hand, b_hand, turn) {
        const ret = wasm.explorer_terminal(this.__wbg_ptr, white, black, w_hand, b_hand, turn);
        return ret >>> 0;
    }
    /**
     * Perfect-play value for the side to move: 0 win, 1 loss, 2 draw, 3 unknown.
     * @param {number} white
     * @param {number} black
     * @param {number} w_hand
     * @param {number} b_hand
     * @param {number} turn
     * @returns {number}
     */
    value(white, black, w_hand, b_hand, turn) {
        const ret = wasm.explorer_value(this.__wbg_ptr, white, black, w_hand, b_hand, turn);
        return ret >>> 0;
    }
}
if (Symbol.dispose) Explorer.prototype[Symbol.dispose] = Explorer.prototype.free;

/**
 * One Y board (the Schensted-Titus connection game) plus its solved value table.
 *
 * Y at side <= 5 is small enough (side-5 = 3.49M dense-index positions) to solve
 * in the browser, so — unlike the morris explorer, which ships a precomputed tablebase —
 * the table is computed live by [`solve_y`] (in a worker) and wrapped here. The
 * wire format is `[p1, p2]` for a position (two stone bitmasks; the side to move
 * is derived from the counts) and groups of 3 (`p1, p2, value`) for moves, value
 * `0=win 1=loss 2=draw 3=unknown` for the mover.
 */
export class YExplorer {
    static __wrap(ptr) {
        const obj = Object.create(YExplorer.prototype);
        obj.__wbg_ptr = ptr;
        YExplorerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        YExplorerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_yexplorer_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    cells() {
        const ret = wasm.yexplorer_cells(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Wrap a precomputed value table (from [`solve_y`], typically solved off the
     * main thread) into a probe-able explorer. `values` must have one byte per
     * dense index of the side-`n` board, exactly as `solve_y` returns.
     * @param {number} side
     * @param {Uint8Array} values
     * @returns {YExplorer}
     */
    static from_solution(side, values) {
        const ptr0 = passArray8ToWasm0(values, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.yexplorer_from_solution(side, ptr0, len0);
        return YExplorer.__wrap(ret);
    }
    /**
     * Legal moves as flat `u32` groups of 3: `[p1, p2, value]`, where `value` is
     * the move's worth *to the mover* (0 win, 1 loss, 2 draw, 3 unknown).
     * @param {number} p1
     * @param {number} p2
     * @returns {Uint32Array}
     */
    legal_moves(p1, p2) {
        const ret = wasm.yexplorer_legal_moves(this.__wbg_ptr, p1, p2);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Build the side-`n` board and strongly solve it inline (dense solver). This
     * blocks the caller; prefer the worker path ([`solve_y`] +
     * [`YExplorer::from_solution`]) for interactive use. Kept as a fallback.
     * @param {number} side
     */
    constructor(side) {
        const ret = wasm.yexplorer_new(side);
        this.__wbg_ptr = ret;
        YExplorerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    side() {
        const ret = wasm.yexplorer_side(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The starting position `[p1, p2]` (empty board).
     * @returns {Uint32Array}
     */
    start() {
        const ret = wasm.yexplorer_start(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * `Some` terminal value (0/1/2) for the side to move, or 3 if not terminal.
     * @param {number} p1
     * @param {number} p2
     * @returns {number}
     */
    terminal(p1, p2) {
        const ret = wasm.yexplorer_terminal(this.__wbg_ptr, p1, p2);
        return ret >>> 0;
    }
    /**
     * Perfect-play value for the side to move: 0 win, 1 loss, 2 draw, 3 unknown.
     * @param {number} p1
     * @param {number} p2
     * @returns {number}
     */
    value(p1, p2) {
        const ret = wasm.yexplorer_value(this.__wbg_ptr, p1, p2);
        return ret >>> 0;
    }
}
if (Symbol.dispose) YExplorer.prototype[Symbol.dispose] = YExplorer.prototype.free;

/**
 * Strongly solve the side-`n` Y board and return the raw per-index value bytes
 * (`1=win 2=loss 3=draw`, one byte each). This is the heavy call; the explorer
 * runs it inside a Web Worker so the page never blocks, then hands the bytes to
 * [`YExplorer::from_solution`] on the main thread for synchronous probing.
 * @param {number} side
 * @returns {Uint8Array}
 */
export function solve_y(side) {
    const ret = wasm.solve_y(side);
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
}

/**
 * Number of dense-index slots for the side-`n` Y board, i.e. how many positions
 * `solve_y` will resolve. Cheap (a few binomials) — the UI shows it before the
 * solve starts. `f64` to stay safe past `u32`, though interactive sides fit easily.
 * @param {number} side
 * @returns {number}
 */
export function y_num_states(side) {
    const ret = wasm.y_num_states(side);
    return ret;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_ea4887a5f8f9a9db: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./game_solver_wasm_bg.js": import0,
    };
}

const ExplorerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_explorer_free(ptr, 1));
const YExplorerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_yexplorer_free(ptr, 1));

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('game_solver_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
