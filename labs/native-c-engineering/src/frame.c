#include "frame.h"
#include <string.h>

/* Apprentice ticket CORE-C01: the starter implementation has two logic defects.
 * Fix the bugs; preserve this public function signature and error contract. */
int parse_sensor_frame(const uint8_t *data, size_t len, struct sensor_frame *out) {
    if (!data || !out || len < 5 || data[0] != 1 || data[1] > 1) return -1;
    size_t n = data[4];
    if (n == 0 || n > NS_LABEL_MAX || len < 5 + n) return -1;
    for (size_t i = 0; i < n; i++) {
        if ((data[5 + i] < 'a' || data[5 + i] > 'z') && data[5 + i] != '-') return -1;
    }
    struct sensor_frame candidate = {0};
    candidate.flags = data[1];
    /* BUG: this byte order is not the protocol's specified big-endian order. */
    candidate.reading = (int16_t)((uint16_t)data[2] | ((uint16_t)data[3] << 8));
    memcpy(candidate.label, data + 5, n);
    candidate.label[n] = '\0';
    *out = candidate;
    return 0;
}
