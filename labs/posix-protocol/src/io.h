#ifndef NORTHSTAR_IO_H
#define NORTHSTAR_IO_H
#include <stddef.h>
/* Return 0 only after exactly count bytes transfer; otherwise -1. */
int read_exact(int fd, void *buf, size_t count);
int write_exact(int fd, const void *buf, size_t count);
#endif
