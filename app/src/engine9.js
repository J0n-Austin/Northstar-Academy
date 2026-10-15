/* Linux Internals lab pack (Stage 3 — understanding). A read-and-reason range
   over a simulated Linux host: the process table, open file descriptors, and
   mounts. Mirrors the Windows pack. No code executes; the learner inspects and
   reports. One process is quietly suspicious (a listener whose deleted binary
   is still running), which the tools reveal. Static, fictional data. */

var LX_PROCS = [
  { pid: 1,    ppid: 0,    user: "root", cmd: "/sbin/init", stat: "Ss" },
  { pid: 420,  ppid: 1,    user: "root", cmd: "/lib/systemd/systemd-journald" },
  { pid: 611,  ppid: 1,    user: "root", cmd: "/usr/sbin/sshd -D" },
  { pid: 902,  ppid: 1,    user: "northstar", cmd: "/usr/bin/telemetryd --config /etc/telemetryd.conf" },
  { pid: 1455, ppid: 611,  user: "sam",  cmd: "-bash" },
  { pid: 1460, ppid: 1455, user: "sam",  cmd: "vim notes.md" },
  // a report job that forks workers and never wait()s for them -> zombies pile up
  { pid: 2201, ppid: 1,    user: "northstar", cmd: "/opt/reportgen/reportgen --daemon", stat: "S" },
  { pid: 2240, ppid: 2201, user: "northstar", cmd: "[reportgen] <defunct>", stat: "Z" },
  { pid: 2241, ppid: 2201, user: "northstar", cmd: "[reportgen] <defunct>", stat: "Z" },
  { pid: 2242, ppid: 2201, user: "northstar", cmd: "[reportgen] <defunct>", stat: "Z" },
  // the odd one: a listener running from a binary that has been deleted on disk
  { pid: 3177, ppid: 1,    user: "www-data", cmd: "/tmp/.cache/httpd" },
];

// open file descriptors per pid
var LX_FDS = {
  902: [
    { fd: 0, target: "/dev/null" }, { fd: 1, target: "/var/log/telemetryd.log" },
    { fd: 3, target: "/etc/telemetryd.conf" }, { fd: 4, target: "socket:[tcp:0.0.0.0:9443]" },
    { fd: 5, target: "/var/lib/telemetryd/agent.key" },
    // logrotate renamed + unlinked this, but telemetryd still holds it open: the space is never freed
    { fd: 6, target: "/var/log/telemetryd.log.1 (deleted)", size: "17.9G" },
  ],
  2201: [{ fd: 0, target: "/dev/null" }, { fd: 1, target: "/var/log/reportgen.log", size: "2.1M" }],
  3177: [
    { fd: 0, target: "/dev/null" }, { fd: 1, target: "/dev/null" },
    { fd: 3, target: "socket:[tcp:0.0.0.0:8081 LISTEN]" },
    { fd: 4, target: "/tmp/.cache/httpd (deleted)" },     // running from a deleted binary
    { fd: 5, target: "socket:[tcp:198.51.100.23:443 ESTABLISHED]" },
  ],
  1455: [{ fd: 0, target: "/dev/pts/0" }, { fd: 1, target: "/dev/pts/0" }, { fd: 2, target: "/dev/pts/0" }],
};

var LX_MOUNTS = [
  { dev: "/dev/sda1", mount: "/", type: "ext4", opts: "rw,relatime", size: "40G", used: "11.2G", pct: 28 },
  { dev: "tmpfs", mount: "/tmp", type: "tmpfs", opts: "rw,nosuid,nodev", size: "2G", used: "41M", pct: 2 },
  { dev: "/dev/sda2", mount: "/var", type: "ext4", opts: "rw,relatime", size: "20G", used: "19.4G", pct: 97 },
  { dev: "proc", mount: "/proc", type: "proc", opts: "rw,nosuid,nodev,noexec" },
];

function lxpad(s, n) { s = String(s); return s + " ".repeat(Math.max(0, n - s.length)); }

function installLinux(shell) {
  shell._addDirs(["answers"]);
  shell._addFiles({ "README.txt": { content: "Linux internals range (read-only).\nTools: ps, lsof <pid>, procstat <pid>, df, du <dir>, mounts. Report findings to answers/.\n", mode: "644" } });

  shell._addCommand("ps", function () {
    var out = [lxpad("PID", 6) + lxpad("PPID", 6) + lxpad("STAT", 6) + lxpad("USER", 11) + "CMD"];
    LX_PROCS.slice().sort(function (a, b) { return a.pid - b.pid; }).forEach(function (p) { out.push(lxpad(p.pid, 6) + lxpad(p.ppid, 6) + lxpad(p.stat || "S", 6) + lxpad(p.user, 11) + p.cmd); });
    return { out: out.join("\n"), code: 0 };
  });

  shell._addCommand("lsof", function (a) {
    var pid = parseInt((shell._parseFlags(a).rest[0] || ""), 10);
    if (!pid) return { out: "", err: "usage: lsof <pid>", code: 2 };
    var proc = LX_PROCS.find(function (p) { return p.pid === pid; });
    if (!proc) return { out: "", err: "lsof: no such process " + pid, code: 1 };
    var fds = LX_FDS[pid] || [];
    var out = [proc.cmd.split(" ")[0] + " (pid " + pid + ") open files:"];
    if (!fds.length) out.push("  (none recorded)");
    fds.forEach(function (f) { out.push("  fd " + lxpad(f.fd, 3) + " -> " + f.target + (f.size ? "   [" + f.size + "]" : "")); });
    return { out: out.join("\n"), code: 0 };
  });

  shell._addCommand("df", function () {
    var out = [lxpad("Filesystem", 11) + lxpad("Size", 6) + lxpad("Used", 7) + lxpad("Use%", 6) + "Mounted on"];
    LX_MOUNTS.filter(function (m) { return m.size; }).forEach(function (m) { out.push(lxpad(m.dev, 11) + lxpad(m.size, 6) + lxpad(m.used, 7) + lxpad(m.pct + "%", 6) + m.mount); });
    return { out: out.join("\n"), code: 0 };
  });
  // du only sees files that still have a name -- the deleted log is invisible to it
  shell._addCommand("du", function (a) {
    var t = shell._parseFlags(a).rest[0] || ".";
    if (/^\/var\/log\/?$/.test(t) || /^\/var\/?$/.test(t)) return { out: "1.2G\t/var/log/telemetryd.log\n2.1M\t/var/log/reportgen.log\n1.4G\t" + (t.replace(/\/$/, "")), code: 0 };
    return { out: "12K\t" + t, code: 0 };
  });
  // a /proc reader for the fields this lab needs
  shell._addCommand("procstat", function (a) {
    var pid = parseInt((shell._parseFlags(a).rest[0] || ""), 10), p = LX_PROCS.find(function (x) { return x.pid === pid; });
    if (!p) return { out: "", err: "usage: procstat <pid>  (reads /proc/<pid>/status)", code: 2 };
    var st = p.stat || "S", state = st[0] === "Z" ? "Z (zombie)" : "S (sleeping)";
    return { out: ["Name:\t" + p.cmd.split(" ")[0].replace(/^.*\//, "").replace(/[\[\]]/g, ""), "State:\t" + state, "Pid:\t" + p.pid, "PPid:\t" + p.ppid, "Uid:\t" + p.user].join("\n"), code: 0 };
  });

  shell._addCommand("mounts", function () {
    return { out: LX_MOUNTS.map(function (m) { return lxpad(m.dev, 10) + " on " + lxpad(m.mount, 7) + " type " + lxpad(m.type, 7) + "(" + m.opts + ")"; }).join("\n"), code: 0 };
  });

  // expose raw data for any future grading needs
  shell.linuxModel = function () { return { procs: LX_PROCS, fds: LX_FDS, mounts: LX_MOUNTS }; };
}

if (typeof module !== "undefined") module.exports = { installLinux: installLinux, PROCS: LX_PROCS, FDS: LX_FDS, MOUNTS: LX_MOUNTS };
