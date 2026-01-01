function toCString(str, memory, malloc) {

    str += '\0';
    const ptr = malloc(str.length);
    let buff = new Uint8Array(memory.buffer, ptr, str.length);

    for (let i = 0; i < buff.length; i++) {
        buff[i] = str[i].charCodeAt(0);
    }
    
    return ptr;
}

function getCString(ptr) {
    
    let bytes = new Uint8Array(memory.buffer, ptr);
    let strlen = 0;

    while (bytes[strlen] != 0) {
        strlen++;
    }
    
    return new TextDecoder("utf8").decode(bytes.slice(0, strlen));
}

function toDotted(ipLike, base=10) {

    switch (base) {
        case 2:
            return `${ipLike.slice(0, 8)}.${ipLike.slice(8, 16)}.${ipLike.slice(16, 24)}.${ipLike.slice(24, 32)}`;
        default:
            throw Error(`Invalid base '${base}'`);
    }
}

function toDottedDecimal(mask) {
    mask >>>= 0;
    return `${(mask >>> 24) & 255}.${(mask >>> 16) & 255}.${(mask >>> 8) & 255}.${mask & 255}`;
}