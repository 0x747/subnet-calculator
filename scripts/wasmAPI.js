const FREED = 7339;         // freed
const NULL = 9349;          // dead (null) / already freed
const NOT_DELETED = 7417    // fail

let exports;
let memory;
let activePtrs = new Set(); 
let Malloc;
let Free;

const structIPv4 = {
    o1: { value: 0, type: uint32_t },
    o2: { value: 0, type: uint32_t },
    o3: { value: 0, type: uint32_t },
    o4: { value: 0, type: uint32_t },
    prefix: { value: 0, type: uint32_t },
    is_cidr: { value: 0, type: uint32_t },
    pretty: { value: "", type: new string_t(19) },
}

const importObject = {
    // Fix from: https://blog.jcm.re/posts/2025/03/creating-a-website-with-modern-c-and-webassembly/
    wasi_snapshot_preview1: {
        fd_close: () => {},
        fd_seek: () => {},
        fd_read: () => {},
        fd_write: () => {},
        fd_fdstat_get: () => {},
        fd_prestat_get: () => {},
        fd_prestat_dir_name: () => {},
        environ_get: () => {},
        environ_sizes_get: () => {},
        proc_exit: () => {},
    },
    js: {
        mem: new WebAssembly.Memory({ initial: 1, maximum: 10, }),
    }
}

function loadWasm() {
    
    WebAssembly.instantiateStreaming(fetch("wasm/ipv4.wasm"), importObject)
    .then( (results) => {
        
        exports = results.instance.exports;
        memory = exports.memory;
        
        Malloc = function(size) {
            const ptr = exports.wasm_alloc(size);
            activePtrs.add(ptr);
            return ptr;
        }
        
        Free = function(ptr) {
            let status = NULL;
            if (activePtrs.has(ptr)) {
                exports.wasm_free(ptr);
                status = activePtrs.delete(ptr) ? FREED : NOT_DELETED;
            }

            return status;
        }
    });
}

// Uppercase = wrapper function for C function call

function ParseIPv4(ipv4) {

    if (ipv4.trim().length == 0) {
        throw Error("IPv4 is empty");
    }

    let pAddr = toCString(ipv4, memory, Malloc);
    let pStruct = objToStruct("IPv4", structIPv4, memory, Malloc);

    let res = exports.parse_ipv4(pAddr, pStruct);
    let obj = structToObj(pStruct, structIPv4, memory);

    Free(pAddr);
    Free(pStruct);

    return {
        status: res,
        ipv4: obj,
    };
}

function withIPv4Struct(obj, wasmFunc) {
    
    let pStruct = objToStruct("IPv4", {
            o1: { value: obj.o1, type: uint32_t },
            o2: { value: obj.o2, type: uint32_t },
            o3: { value: obj.o3, type: uint32_t },
            o4: { value: obj.o4, type: uint32_t },
            prefix: { value: obj.prefix, type: uint32_t },
            is_cidr: { value: obj.is_cidr, type: uint32_t },
            pretty: { value: obj.pretty, type: new string_t(obj.pretty.length + 1) },
        }
        , memory, Malloc);

    let ret = wasmFunc(pStruct);

    Free(pStruct);

    return ret;
}