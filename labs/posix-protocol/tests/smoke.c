#include "io.h"
#include <stdio.h>
#include <sys/socket.h>
#include <unistd.h>
#include <string.h>
int main(void) {
    int fd[2]; char buf[5] = {0};
    if (socketpair(AF_UNIX,SOCK_STREAM,0,fd) != 0) return 1;
    int passed = write_exact(fd[0],"PING",4) == 0 && read_exact(fd[1],buf,4) == 0 && strcmp(buf,"PING") == 0;
    close(fd[0]); close(fd[1]);
    if (passed) puts("PASS real socket smoke test");
    return passed ? 0 : 1;
}
