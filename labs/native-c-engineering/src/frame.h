#ifndef NORTHSTAR_FRAME_H
#define NORTHSTAR_FRAME_H
#include <stddef.h>
#include <stdint.h>

#define NS_LABEL_MAX 15

/* Frame: version(1)=1, flags(1)=0 or 1, signed reading(2) big-endian,
 * label length(1), ASCII label(1..15). No trailing bytes allowed.
 * Return 0 on success, -1 on invalid input; never read past data[len]. */
struct sensor_frame {
    uint8_t flags;
    int16_t reading;
    char label[NS_LABEL_MAX + 1];
};
int parse_sensor_frame(const uint8_t *data, size_t len, struct sensor_frame *out);
#endif
