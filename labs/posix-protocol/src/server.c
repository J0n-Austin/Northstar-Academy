#define _POSIX_C_SOURCE 200809L
#include "io.h"
#include <arpa/inet.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static int send_reply(int client, const char *message) {
    size_t n = strlen(message);
    uint8_t frame[2 + 256] = {(uint8_t)(n >> 8), (uint8_t)n};
    memcpy(frame + 2, message, n);
    return write_exact(client, frame, 2 + n);
}
int main(int argc, char **argv) {
    if (argc != 2) { fprintf(stderr,"usage: %s <port>\n",argv[0]); return 2; }
    char *end = NULL;
    long port = strtol(argv[1], &end, 10);
    if (!end || *end || port < 1024 || port > 65535) return 2;
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (listen_fd < 0) { perror("socket"); return 1; }
    int enable = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof enable);
    struct sockaddr_in addr = {0};
    addr.sin_family = AF_INET;
    addr.sin_port = htons((uint16_t)port);
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK); // loopback only
    if (bind(listen_fd,(struct sockaddr *)&addr,sizeof addr) != 0 || listen(listen_fd,1) != 0) {
        perror("bind/listen"); close(listen_fd); return 1;
    }
    printf("LISTEN 127.0.0.1:%ld\n",port); fflush(stdout);
    int client = accept(listen_fd,NULL,NULL);
    if (client < 0) { perror("accept"); close(listen_fd); return 1; }
    uint8_t hdr[2], body[257];
    int status = 1;
    if (read_exact(client,hdr,2) != 0) goto done;
    size_t n = ((size_t)hdr[0] << 8) | hdr[1];
    if (n < 1 || n > 256 || read_exact(client,body,n) != 0) goto done;
    body[n] = '\0';
    status = send_reply(client,(n == 4 && memcmp(body,"PING",4) == 0) ? "PONG" : "ERR") == 0 ? 0 : 1;
done:
    close(client);
    close(listen_fd);
    return status;
}
