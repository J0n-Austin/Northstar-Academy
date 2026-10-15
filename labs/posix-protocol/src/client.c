#define _POSIX_C_SOURCE 200809L
#include "io.h"
#include <arpa/inet.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>
int main(int argc, char **argv) {
    if (argc < 2 || argc > 3) { fprintf(stderr,"usage: %s <port> [message]\n",argv[0]); return 2; }
    char *end = NULL;
    long port = strtol(argv[1], &end, 10);
    if (!end || *end || port < 1024 || port > 65535) return 2;
    const char *message = argc == 3 ? argv[2] : "PING";
    size_t n = strlen(message);
    if (n < 1 || n > 256) return 2;
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) return 1;
    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_port = htons((uint16_t)port);
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    if (connect(fd,(struct sockaddr *)&addr,sizeof addr) != 0) { perror("connect"); close(fd); return 1; }
    uint8_t buf[258] = {(uint8_t)(n >> 8),(uint8_t)n};
    memcpy(buf+2,message,n);
    if (write_exact(fd,buf,n+2) != 0) { close(fd); return 1; }
    uint8_t hdr[2];
    if (read_exact(fd,hdr,2) != 0) { close(fd); return 1; }
    size_t reply_n = ((size_t)hdr[0] << 8) | hdr[1];
    if (reply_n < 1 || reply_n > 256 || read_exact(fd,buf,reply_n) != 0) { close(fd); return 1; }
    buf[reply_n] = '\0';
    printf("%s\n",(char *)buf);
    close(fd);
    return 0;
}
