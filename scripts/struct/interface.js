// Convert object to struct and put into memory
/** 
 *      - get struct size
 *      - allocate space for struct in memory
 *      - insert struct values into memory
 *      - return pointer to struct
 */

// Get struct from memory and convert to object
/**
 *      - iterate through object
 *      - take first attribute, read that many bytes from memory
 *      - advance offset by that many bytes
 */

let Structs = {};

function objToStruct(name, structFormat, memory, malloc) {

    let size = calcStructSize(structFormat);
    Structs[name] = size;

    let ptr = malloc(size);

    offset = ptr;
    for (const value of Object.values(structFormat)) {
        writeToMemory(value, offset, memory);
        offset += value.type.size;
    }

    return ptr;
}

function writeToMemory(entity, offset, memory) {
    
    let buff; 
    
    if (entity.type instanceof string_t) {
        
        buff = new entity.type.buffer(memory.buffer, offset, entity.type.size);
        //entity.value += '\0';
        for (let i = 0; i < entity.value.length; i++) {
            buff[i] = entity.value[i].charCodeAt(0);
        }
    } else {
        buff = new entity.type.buffer(memory.buffer, offset, 1);
        buff[0] = entity.value;
    }
}

function structToObj(structPtr, structFormat, memory) {

    let ret = {}

    for (const [key, value] of Object.entries(structFormat)) {
        ret[key] = readFromMemory(value, structPtr, memory);
        structPtr += value.type.size;
    }

    return ret;
}

function readFromMemory(entity, offset, memory) {

    let view;

    if (entity.type instanceof string_t) {
        view = new entity.type.buffer(memory.buffer, offset);
        let str = new TextDecoder("utf8").decode(view.slice(0, entity.type.size));
        return str;
    }

    view = new entity.type.buffer(memory.buffer, offset, 1);
    return view[0];
}

function calcStructSize(structFormat) {

    let size = 0;

    for (const value of Object.values(structFormat)) {
        size += value.type.size;
    }

    return size;
}