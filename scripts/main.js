document.addEventListener("DOMContentLoaded", () => {

    loadWasm();

    ipv4TxtBox.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            main();
        }
    });

    submitBtn.addEventListener("click", () => {
        main();
    });
});

let result = {
    addr: '',
    netAddr: '',
    firstHost: '',
    lastHost: '',
    brdcastAddr: '',
    intId: '',
    binaryId: '',
    hexId: '',
    class: '',
    type: '',
    cidrBlock: '',
    addrType: '',
    addrClass: '',
    binaryMask: '',
    decimalMask: '',
    totalAddrs: '',
    hostAddrs: '',
}

function showResult(result) {
    
    resultTable.style.display = "block";

    ipv4Addr.innerText = result.addr;
    cidrBlock.innerText = result.cidrBlock;
    intVal.innerText = result.intId;
    hexVal.innerText = result.hexId;
    binVal.innerText = result.binaryId;
    addrType.innerText = result.addrType;
    addrClass.innerText = result.addrClass;
    binMask.innerText = result.binaryMask;
    decimalMask.innerText = result.decimalMask;
    netAddr.innerText = result.netAddr;
    brdcastAddr.innerText = result.brdcastAddr;
    hostRange.innerText = result.firstHost == 0 || result.lastHost == 0 ? "N/A" : `${result.firstHost} - ${result.lastHost}`;
    totalAddrs.innerText = result.totalAddrs.toLocaleString('en-US');
    hostAddrs.innerText = result.hostAddrs.toLocaleString('en-US');
}

function checkErr(parseResult) {
    
    switch (parseResult.status) {
        case 0:
            return true;
        case -1:
            error.innerText = `Invalid IPv4: '${ipv4TxtBox.value.trim()}'`;
            break;
        case 1:
            error.innerText = `Invalid 1st octet '${parseResult.ipv4.o1 | 0}'`;
            break;
        case 2:
            error.innerText = `Invalid 2nd octet '${parseResult.ipv4.o2 | 0}'`;
            break;
        case 3:
            error.innerText = `Invalid 3rd octet '${parseResult.ipv4.o3 | 0}'`;
            break;
        case 4:
            error.innerText = `Invalid 4th octet '${parseResult.ipv4.o4 | 0}'`;
            break;
        case 5:
            error.innerText = `Invalid prefix '${parseResult.ipv4.prefix | 0}'`;
            break;
        default:
            error.innerText = "Unknown error occured";
            break;
    }

    return false;
}

function main() {

    error.innerText = '';
    resultTable.style.display = "none";

    try {
        
        const ret = ParseIPv4(ipv4TxtBox.value.trim());
        
        if (!checkErr(ret)) {
            return;
        }

        const intVal = withIPv4Struct(ret.ipv4, exports.ipv4_to_int) >>> 0;
        const addrType = withIPv4Struct(ret.ipv4, exports.resolve_ipv4_type) == 1 ? "Public" : "Private";
        const addrClass = String.fromCharCode(withIPv4Struct(ret.ipv4, exports.resolve_ipv4_class));
        const intMask = exports.prefix_to_mask(ret.ipv4.prefix) >>> 0
        const decimalNetAddr = intVal & intMask;
        const decimalbrdCastAddr = decimalNetAddr | ~intMask;
        
        result.addr = `${ret.ipv4.o1}.${ret.ipv4.o2}.${ret.ipv4.o3}.${ret.ipv4.o4}`
        result.cidrBlock = `${result.addr}/${ret.ipv4.prefix}`;
        result.intId = intVal;
        result.binaryId = intVal.toString(2).padStart(32, "0");
        result.hexId =  '0x' + intVal.toString(16).toUpperCase();
        result.addrType = addrType;
        result.addrClass = addrClass;
        result.binaryMask = toDotted(intMask.toString(2).padStart(32, "0"), base=2);
        result.decimalMask = toDottedDecimal(intMask);
        result.netAddr = toDottedDecimal(decimalNetAddr); 
        result.brdcastAddr =  toDottedDecimal(decimalbrdCastAddr);
        result.totalAddrs = 2 ** (32 - ret.ipv4.prefix)
        result.hostAddrs = result.totalAddrs >= 2 ? result.totalAddrs - 2 : 0;
        result.firstHost = result.hostAddrs > 0 ? toDottedDecimal(decimalNetAddr + 1) : 0;
        result.lastHost = result.hostAddrs > 0 ? toDottedDecimal(decimalbrdCastAddr - 1) : 0;

        showResult(result); 
    } catch(err) {
        error.innerText = err;
    }
    
}