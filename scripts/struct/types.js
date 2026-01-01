class string_t {
    constructor(size) {
        this.size = size;
        this.buffer = Uint8Array;
    }
}

let uint32_t = {
    size: 4,
    buffer: Uint32Array,
}

let int32_t = {
    size: 4,
    buffer: Int32Array,
}

let char_t = {
    size: 1,
    buffer: Uint8Array,
}