#include "frame.h"
#include <stdint.h>
#include <stdio.h>
#include <string.h>
static int checked, failed;
static void check(int condition, const char *name) {
    checked++;
    printf("%s %s\n", condition ? "PASS" : "FAIL", name);
    if (!condition) failed++;
}
int main(void) {
    struct sensor_frame result = {0};
    const uint8_t healthy[] = {1, 1, 0, 25, 4, 't', 'e', 'm', 'p'};
    check(parse_sensor_frame(healthy, sizeof healthy, &result) == 0, "valid frame accepted");
    check(result.flags == 1 && strcmp(result.label,"temp") == 0, "flag and label extracted");
    check(result.reading == 25, "big-endian positive reading");
    const uint8_t negative[] = {1, 0, 0xff, 0xf6, 5, 'p','r','e','s','s'};
    check(parse_sensor_frame(negative, sizeof negative, &result) == 0 && result.reading == -10, "negative signed reading");
    const uint8_t extra[] = {1, 0, 0, 10, 1, 'x', 0};
    check(parse_sensor_frame(extra,sizeof extra,&result) == -1,"trailing bytes rejected");
    const uint8_t truncated[] = {1,0,0,1,3,'a'};
    check(parse_sensor_frame(truncated,sizeof truncated,&result) == -1,"truncation rejected");
    const uint8_t bad_flag[] = {1,2,0,1,1,'a'};
    check(parse_sensor_frame(bad_flag,sizeof bad_flag,&result) == -1,"invalid flags rejected");
    const uint8_t bad_name[] = {1,0,0,1,1,'!'};
    check(parse_sensor_frame(bad_name,sizeof bad_name,&result) == -1,"invalid label rejected");
    check(parse_sensor_frame(NULL, sizeof healthy, &result) == -1,"NULL data rejected");
    check(parse_sensor_frame(healthy, sizeof healthy, NULL) == -1,"NULL output rejected");
    const uint8_t empty[] = {1,0,0,1,0};
    check(parse_sensor_frame(empty,sizeof empty,&result) == -1,"empty label rejected");
    printf("RESULT %d/%d passed\n", checked - failed, checked);
    return failed ? 1 : 0;
}
