#include "frame.h"
#include <stdint.h>
#include <string.h>
#include <stdio.h>
int main(void) {
    const uint8_t frame[] = {1,0,0,0,3,'a','p','p'};
    struct sensor_frame value = {0};
    if (parse_sensor_frame(frame, sizeof frame, &value) != 0 || strcmp(value.label,"app") != 0) return 1;
    puts("PASS native parser happy-path smoke test");
    return 0;
}
