#define _POSIX_C_SOURCE 200809L
#include "io.h"
#include <errno.h>
#include <stdint.h>
#include <unistd.h>

/* CORE-NET01 ticket: read_exact incorrectly assumes read() returns a message. */
int read_exact(int fd, void *buf, size_t count) {
    ssize_t received = read(fd, buf, count);
    return received == (ssize_t)count ? 0 : -1;
}

int write_exact(int fd, const void *buf, size_t count) {
    const uint8_t *p = (const uint8_t *)buf;
    size_t written = 0;
    while (written < count) {
        ssize_t n = write(fd, p + written, count - written);
        if (n < 0 && errno == EINTR) continue;
        if (n <= 0) return -1;
        written += (size_t)n;
    }
    return 0;
}
