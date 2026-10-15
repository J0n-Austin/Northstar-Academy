#define _POSIX_C_SOURCE 200809L
#include "io.h"
#include <stdio.h>
#include <stdint.h>
#include <sys/socket.h>
#include <sys/wait.h>
#include <unistd.h>
#include <time.h>
#include <string.h>
static int pass, fail;
static void check(const char *label, int value) {
    printf("%s %s\n",value ? "PASS" : "FAIL",label);
    if (value) pass++; else fail++;
}
int main(void) {
    int sockets[2];
    if (socketpair(AF_UNIX,SOCK_STREAM,0,sockets) != 0) return 2;
    const char *message = "HELLO";
    check("write_exact sends 5 bytes",write_exact(sockets[0],message,5) == 0);
    char buf[6] = {0};
    check("read_exact reads 5 bytes",read_exact(sockets[1],buf,5) == 0 && strcmp(buf,"HELLO") == 0);
    close(sockets[0]); close(sockets[1]);

    if (socketpair(AF_UNIX,SOCK_STREAM,0,sockets) != 0) return 2;
    pid_t child = fork();
    if (child < 0) return 2;
    if (child == 0) {
        close(sockets[0]);
        if (write_exact(sockets[1],"AB",2) != 0) _exit(2);
        /* Real socket streams may deliver data in multiple fragments. */
        struct timespec delay = {0, 250000000};
        nanosleep(&delay,NULL);
        if (write_exact(sockets[1],"CDE",3) != 0) _exit(3);
        close(sockets[1]); _exit(0);
    }
    close(sockets[1]);
    memset(buf,0,sizeof buf);
    int got = read_exact(sockets[0],buf,5);
    check("read_exact reassembles fragmented writes",got == 0 && strcmp(buf,"ABCDE") == 0);
    int child_status;
    waitpid(child,&child_status,0);
    close(sockets[0]);
    check("child successfully transferred chunks",WIFEXITED(child_status) && WEXITSTATUS(child_status) == 0);
    printf("RESULT %d passed, %d failed\n",pass,fail);
    return fail ? 1 : 0;
}
