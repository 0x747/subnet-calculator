#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

typedef struct {
    uint32_t o1, o2, o3, o4, prefix, is_cidr;
    char pretty[19];
} IPv4;

int parse_ipv4(char *ipv4, IPv4 *ip);
int validate_ipv4(IPv4 *ip);
uint32_t ipv4_to_int(IPv4 *ip);
int resolve_ipv4_type(IPv4 *ip);
char resolve_ipv4_class(IPv4 *ip);
uint32_t prefix_to_mask(int prefix);

// Memory
void *wasm_alloc(size_t size);
void wasm_free(void *ptr);

int main() { return 0; }

EMSCRIPTEN_KEEPALIVE
int parse_ipv4(char *ipv4, IPv4 *ip) {
    
    int chars_read = 0;
    memset(ip, 0, sizeof(IPv4));

    if (sscanf(ipv4, "%u.%u.%u.%u/%u%n", 
               &ip->o1, &ip->o2, &ip->o3, &ip->o4, &ip->prefix, &chars_read) == 5 
        && ipv4[chars_read] == '\0') {

        snprintf(ip->pretty, sizeof ip->pretty, "%u.%u.%u.%u/%u", 
                 ip->o1, ip->o2, ip->o3, ip->o4, ip->prefix);
        
        ip->is_cidr = 1;

        return validate_ipv4(ip);
    } 
    if (sscanf(ipv4, "%u.%u.%u.%u%n", 
               &ip->o1, &ip->o2, &ip->o3, &ip->o4, &chars_read) == 4 
        && ipv4[chars_read] == '\0') {
        
        snprintf(ip->pretty, sizeof ip->pretty, "%u.%u.%u.%u", 
                 ip->o1, ip->o2, ip->o3, ip->o4);

        ip->is_cidr = 0;

        return validate_ipv4(ip);
    } 

    return -1;
}

EMSCRIPTEN_KEEPALIVE
int validate_ipv4(IPv4 *ip) {

    if (ip->o1 < 0 || ip->o1 > 255)
        return 1;
    if (ip->o2 < 0 || ip->o2 > 255)
        return 2;
    if (ip->o3 < 0 || ip->o3 > 255)
        return 3;
    if (ip->o4 < 0 || ip->o4 > 255)
        return 4;
    if (ip->prefix < 0 || ip->prefix > 32)
        return 5;

    return 0;
}

EMSCRIPTEN_KEEPALIVE
uint32_t ipv4_to_int(IPv4 *ip) {
    return ((uint32_t)ip->o1 << 24 |
            (uint32_t)ip->o2 << 16 |
            (uint32_t)ip->o3 << 8  |
            (uint32_t)ip->o4);
}

EMSCRIPTEN_KEEPALIVE
int resolve_ipv4_type(IPv4 *ip) {
    
    uint32_t i = ipv4_to_int(ip);

    // 10.0.0.0 - 10.255.255.255
    if ((i >= 167772160 && i <= 184549375) ||
        // 172.16.0.0 - 172.31.255.255
        (i >= 2886729728 && i <= 2887778303) ||
        // 192.168.0.0 - 192.168.255.255
        (i >= 3232235520 && i <= 3232301055)) {
            // Private
            return 0;
    }

    // Public
    return 1;
}

EMSCRIPTEN_KEEPALIVE
char resolve_ipv4_class(IPv4 *ip) {
    /*
    A: 0 - 127      0 2147483647
    B: 128 - 191    2147483648 3221225471
    C: 192 - 223    3221225472 3758096383
    D: 224 - 239    3758096384 4026531839
    E: 240 - 255    4026531840 4294967295
    */

    uint32_t i = ipv4_to_int(ip);

    if (i >= 0 && i <= 2147483647) {
        return 'A';
    }
    if (i >= 2147483648 && i <= 3221225471) {
        return 'B';
    }
    if (i >= 3221225472 && i <= 3758096383) {
        return 'C';
    }
    if (i >= 3758096384 && i <= 4026531839) {
        return 'D';
    }
    if (i >= 4026531840 && i <= 4294967295) {
        return 'E';
    }

    return 'X';
}

EMSCRIPTEN_KEEPALIVE
uint32_t prefix_to_mask(int prefix) {
    return prefix == 0 ? 0 : 0xFFFFFFFF << (32 - prefix);
}

EMSCRIPTEN_KEEPALIVE
void *wasm_alloc(size_t size) {
    return malloc(size);
}

EMSCRIPTEN_KEEPALIVE
void wasm_free(void *ptr) {
    free(ptr);
}