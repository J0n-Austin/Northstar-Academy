/* Windows Internals lab pack (Stage 3 — understanding, not operation).
   A read-and-reason range over simulated Windows artifacts. No code runs;
   the learner inspects a process tree, handle tables, PE headers and tokens
   and reports what they find. Everything is static, fictional data. The
   commands all read one consistent model so the facts line up across tools. */

var PROCS = [
  { pid: 4,    ppid: 0,    name: "System",        user: "SYSTEM",        session: 0 },
  { pid: 388,  ppid: 4,    name: "smss.exe",      user: "SYSTEM",        session: 0 },
  { pid: 512,  ppid: 388,  name: "csrss.exe",     user: "SYSTEM",        session: 0 },
  { pid: 604,  ppid: 388,  name: "wininit.exe",   user: "SYSTEM",        session: 0 },
  { pid: 668,  ppid: 604,  name: "services.exe",  user: "SYSTEM",        session: 0 },
  { pid: 720,  ppid: 668,  name: "svchost.exe",   user: "SYSTEM",        session: 0 },
  { pid: 980,  ppid: 668,  name: "spoolsv.exe",   user: "SYSTEM",        session: 0 },
  { pid: 1120, ppid: 668,  name: "telemetryd.exe",user: "NETWORK SERVICE",session: 0 },
  { pid: 2044, ppid: 1532, name: "explorer.exe",  user: "sam",           session: 1 },
  { pid: 3312, ppid: 2044, name: "chrome.exe",    user: "sam",           session: 1 },
  { pid: 3410, ppid: 2044, name: "powershell.exe",user: "sam",           session: 1 },
  // the odd one out: a cmd.exe parented by spoolsv.exe (a service), not explorer
  { pid: 4820, ppid: 980,  name: "cmd.exe",       user: "SYSTEM",        session: 0 },
];

// handles held per pid (a small, realistic slice)
var HANDLES = {
  1120: [
    { type: "File", name: "C:\\ProgramData\\Northstar\\telemetry.db" },
    { type: "File", name: "C:\\ProgramData\\Northstar\\agent.key" },
    { type: "Key",  name: "HKLM\\SOFTWARE\\Northstar\\Agent" },
    { type: "Mutant", name: "\\Sessions\\0\\BaseNamedObjects\\NorthstarAgentSingleton" },
  ],
  4820: [
    { type: "File", name: "C:\\ProgramData\\Northstar\\telemetry.db" },  // also open here (!)
    { type: "Key",  name: "HKLM\\SYSTEM\\CurrentControlSet\\Services\\spooler" },
  ],
  3410: [
    { type: "File", name: "C:\\Users\\sam\\notes.txt" },
    { type: "Thread", name: "Thread (TID 3414)" },
  ],
};

// PE headers for the binaries in the range
var PE = {
  "telemetryd.exe": { machine: "x64", subsystem: "Windows CUI", sections: ["\.text", "\.rdata", "\.data", "\.pdata", "\.reloc"], imports: ["KERNEL32.dll", "ADVAPI32.dll", "WS2_32.dll"], entry: "0x1400018a0" },
  "northsync.dll":  { machine: "x64", subsystem: "Windows GUI", sections: ["\.text", "\.rdata", "\.data", "\.reloc"], imports: ["KERNEL32.dll", "ole32.dll"], entry: "0x180004120" },
};

// token / privileges per pid
var TOKENS = {
  1120: { user: "NETWORK SERVICE", integrity: "System", privs: ["SeChangeNotifyPrivilege", "SeCreateGlobalPrivilege"] },
  4820: { user: "SYSTEM", integrity: "System", privs: ["SeDebugPrivilege", "SeChangeNotifyPrivilege", "SeTcbPrivilege", "SeImpersonatePrivilege"] },
  3410: { user: "sam", integrity: "Medium", privs: ["SeChangeNotifyPrivilege", "SeShutdownPrivilege"] },
};

function pad(s, n) { s = String(s); return s + " ".repeat(Math.max(0, n - s.length)); }

function installWindows(shell) {
  shell._addDirs(["bin", "answers"]);
  // a couple of PE files on disk so `ls`/`pe` agree
  shell._addFiles({
    "bin/telemetryd.exe": { content: "MZ\x90\x00 ... (simulated PE, not a real binary)\n", mode: "644" },
    "bin/northsync.dll":  { content: "MZ\x90\x00 ... (simulated PE, not a real binary)\n", mode: "644" },
    "README.txt": { content: "Windows internals range (read-only).\nTools: tasklist, handle <pid>, pe <file>, token <pid>.\nEverything here is simulated, static data.\n", mode: "644" },
  });

  shell._addCommand("tasklist", function (a) {
    var raw = a.join(" ");
    var tree = /\/t|--tree/.test(raw);
    var rows = PROCS.slice().sort(function (x, y) { return x.pid - y.pid; });
    var out = [pad("PID", 6) + pad("PPID", 6) + pad("SESS", 5) + pad("USER", 18) + "NAME"];
    for (var i = 0; i < rows.length; i++) { var p = rows[i]; out.push(pad(p.pid, 6) + pad(p.ppid, 6) + pad(p.session, 5) + pad(p.user, 18) + p.name); }
    return { out: out.join("\n"), code: 0 };
  });

  shell._addCommand("handle", function (a) {
    var pid = parseInt((shell._parseFlags(a).rest[0] || ""), 10);
    if (!pid) return { out: "", err: "usage: handle <pid>", code: 2 };
    var proc = PROCS.find(function (p) { return p.pid === pid; });
    if (!proc) return { out: "", err: "handle: no such process " + pid, code: 1 };
    var hs = HANDLES[pid] || [];
    var out = [proc.name + " (pid " + pid + ") handles:"];
    if (!hs.length) out.push("  (none recorded)");
    for (var i = 0; i < hs.length; i++) out.push("  " + pad(hs[i].type, 8) + hs[i].name);
    return { out: out.join("\n"), code: 0 };
  });

  shell._addCommand("pe", function (a) {
    var f = (shell._parseFlags(a).rest[0] || "").split(/[\\/]/).pop();
    var info = PE[f];
    if (!info) return { out: "", err: "pe: no PE data for '" + (f || "") + "' (try telemetryd.exe or northsync.dll)", code: 1 };
    return {
      out: [
        "PE header: " + f,
        "  machine:    " + info.machine,
        "  subsystem:  " + info.subsystem,
        "  entry:      " + info.entry,
        "  sections:   " + info.sections.join(" "),
        "  imports:    " + info.imports.join(" "),
      ].join("\n"), code: 0,
    };
  });

  shell._addCommand("token", function (a) {
    var pid = parseInt((shell._parseFlags(a).rest[0] || ""), 10);
    if (!pid) return { out: "", err: "usage: token <pid>", code: 2 };
    var t = TOKENS[pid];
    if (!t) return { out: "", err: "token: no token data for pid " + pid, code: 1 };
    return {
      out: [
        "Token for pid " + pid + ":",
        "  user:       " + t.user,
        "  integrity:  " + t.integrity,
        "  privileges: " + t.privs.join(" "),
      ].join("\n"), code: 0,
    };
  });
}

if (typeof module !== "undefined") module.exports = { installWindows, PROCS, HANDLES, PE, TOKENS };
