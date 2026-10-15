/* Northstar interactive-lab shell engine.
   A deliberately small POSIX-ish shell over an in-memory filesystem.
   Supports exactly what the Linux Fundamentals lab needs, robustly:
   ls/cat/cd/pwd/echo, grep (-i -c -w -h -r -o -n -v -E), wc (-l -w),
   head/tail (-n or -N), sort (-r -n), uniq (-c), cut (-d -f), sed (s///[g]),
   awk ({print ...}), a focused jq, chmod, pipes |, and > >> redirection. */

function labData() {
  const app = [
    "2026-10-02T08:14:03Z INFO  app started pid=4120 version=1.8.2",
    "2026-10-02T08:14:03Z INFO  config loaded from /etc/northstar/app.yaml",
    "2026-10-02T08:14:05Z INFO  listening on 0.0.0.0:8080",
    "2026-10-02T08:15:11Z INFO  request handled path=/health status=200 ms=3",
    "2026-10-02T08:15:40Z WARN  slow query detected ms=812 query=users.lookup",
    "2026-10-02T08:16:02Z ERROR database connection failed code=E500",
    "2026-10-02T08:16:02Z INFO  retrying database connection attempt=1",
    "2026-10-02T08:16:09Z ERROR upstream request timeout after 30s code=E408",
    "2026-10-02T08:16:20Z INFO  request handled path=/login status=200 ms=42",
    "2026-10-02T08:17:01Z WARN  cache miss rate high pct=61",
    "2026-10-02T08:17:30Z ERROR resource not found code=E404",
    "2026-10-02T08:18:12Z ERROR gateway timeout talking to auth code=E408",
    "2026-10-02T08:18:44Z INFO  request handled path=/jobs status=200 ms=18",
    "2026-10-02T08:19:03Z ERROR unhandled exception in handler code=E500",
    "2026-10-02T08:19:50Z WARN  disk usage above threshold pct=78 mount=/var",
    "2026-10-02T08:20:15Z ERROR service unavailable code=E503",
    "2026-10-02T08:20:41Z ERROR missing config key code=E404",
    "2026-10-02T08:21:07Z ERROR read timeout on socket code=E408",
    "2026-10-02T08:21:33Z INFO  request handled path=/metrics status=200 ms=6",
    "2026-10-02T08:22:10Z ERROR null pointer in worker code=E500",
    "2026-10-02T08:22:55Z WARN  retry budget low remaining=2",
    "2026-10-02T08:23:19Z ERROR unauthorized token code=E401",
    "2026-10-02T08:23:48Z ERROR connection timeout to cache code=E408",
    "2026-10-02T08:24:11Z INFO  request handled path=/jobs status=201 ms=57",
    "2026-10-02T08:24:52Z ERROR internal error serializing response code=E500",
    "2026-10-02T08:25:20Z ERROR template not found code=E404",
    "2026-10-02T08:25:59Z ERROR dependency timeout caused unavailability code=E503",
    "2026-10-02T08:26:33Z INFO  request handled path=/health status=200 ms=2",
    "2026-10-02T08:27:04Z ERROR internal error code=E500",
    "2026-10-02T08:27:41Z ERROR request timeout code=E408",
    "2026-10-02T08:28:09Z WARN  connection pool near capacity used=95 max=100",
    "2026-10-02T08:28:50Z ERROR invalid credentials code=E401",
    "2026-10-02T08:29:22Z ERROR route not found code=E404",
    "2026-10-02T08:30:00Z ERROR segfault recovered code=E500",
    "2026-10-02T08:30:38Z ERROR circuit breaker open code=E503",
    "2026-10-02T08:31:12Z INFO  request handled path=/login status=200 ms=39",
    "2026-10-02T08:31:55Z INFO  background compaction complete freed_mb=204",
    "2026-10-02T08:32:40Z WARN  slow query detected ms=905 query=jobs.scan",
    "2026-10-02T08:33:18Z INFO  request handled path=/health status=200 ms=3",
    "",
  ].join("\n");
  const auth = [
    "2026-10-02T08:14:04Z INFO  auth service ready provider=local",
    "2026-10-02T08:15:22Z INFO  login success user=ambefore",
    "2026-10-02T08:16:48Z WARN  repeated failed login user=guest attempts=3",
    "2026-10-02T08:17:59Z ERROR invalid signature on token user=guest",
    "2026-10-02T08:19:12Z INFO  login success user=tchen",
    "2026-10-02T08:20:33Z ERROR token expired user=svc-batch",
    "2026-10-02T08:22:07Z WARN  mfa challenge not completed user=ambefore",
    "2026-10-02T08:24:40Z INFO  logout user=tchen",
    "2026-10-02T08:26:15Z ERROR account locked after failed attempts user=guest",
    "2026-10-02T08:29:01Z INFO  login success user=amber",
    "",
  ].join("\n");
  const worker = [
    "2026-10-02T08:14:06Z INFO  worker pool started size=8",
    "2026-10-02T08:16:11Z INFO  job started id=9001 type=export",
    "2026-10-02T08:16:41Z ERROR job failed timeout waiting for database lock id=9001",
    "2026-10-02T08:18:20Z INFO  job started id=9002 type=report",
    "2026-10-02T08:18:59Z INFO  job finished id=9002 ms=38210",
    "2026-10-02T08:21:15Z WARN  queue depth high depth=340",
    "2026-10-02T08:23:02Z ERROR job failed read timeout from storage backend id=9003",
    "2026-10-02T08:25:44Z INFO  job finished id=9004 ms=1120",
    "2026-10-02T08:28:30Z WARN  worker restarted after oom worker=3",
    "2026-10-02T08:31:02Z INFO  job finished id=9005 ms=642",
    "",
  ].join("\n");
  const status = JSON.stringify({
    generated_at: "2026-10-02T08:33:00Z", region: "us-east-1",
    services: [
      { name: "api-gateway", state: "healthy", latency_ms: 12, owner: "platform" },
      { name: "auth", state: "degraded", latency_ms: 480, owner: "identity" },
      { name: "billing", state: "down", latency_ms: null, owner: "payments" },
      { name: "cache", state: "degraded", latency_ms: 210, owner: "platform" },
      { name: "database", state: "healthy", latency_ms: 8, owner: "data" },
      { name: "metrics", state: "degraded", latency_ms: 390, owner: "observability" },
      { name: "scheduler", state: "healthy", latency_ms: 20, owner: "platform" },
      { name: "storage", state: "degraded", latency_ms: 540, owner: "data" },
    ],
  }, null, 2) + "\n";
  const key = "# Northstar telemetry signing key (SIMULATED - not a real secret)\nNORTHSTAR_SERVICE_KEY=sim-0000-not-a-real-key\n";
  return {
    "scenario/logs/app.log": { content: app, mode: "644" },
    "scenario/logs/auth.log": { content: auth, mode: "644" },
    "scenario/logs/worker.log": { content: worker, mode: "644" },
    "scenario/service/status.json": { content: status, mode: "644" },
    "scenario/secrets/service.key": { content: key, mode: "644" },
  };
}

function createShell() {
  let fs = labData();
  let cwd = "";
  const seedDirs = ["answers"];
  let dirs = new Set(seedDirs);
  let scriptRunner = null;   // set by the automation pack to run script files

  function reset() { fs = labData(); cwd = ""; dirs = new Set(seedDirs); }

  function norm(p) {
    // map the learner's home paths onto the lab root
    if (p === "~" || p === "/home/sam/lab") p = "/";
    else if (p.startsWith("~/")) p = "/" + p.slice(2);
    else if (p.startsWith("/home/sam/lab/")) p = "/" + p.slice("/home/sam/lab/".length);
    const base = p.startsWith("/") ? [] : cwd.split("/").filter(Boolean);
    const parts = p.split("/").filter(Boolean);
    const out = p.startsWith("/") ? [] : base.slice();
    for (const seg of parts) {
      if (seg === ".") continue;
      else if (seg === "..") out.pop();
      else out.push(seg);
    }
    return out.join("/");
  }
  function isDir(path) {
    if (path === "") return true;
    if (dirs.has(path)) return true;
    const pre = path + "/";
    return Object.keys(fs).some((f) => f.startsWith(pre)) || [...dirs].some((d) => d.startsWith(pre));
  }
  // every path that exists as a file or directory, for listing
  function allEntries() { return Object.keys(fs).concat([...dirs]); }
  // Expand * the way bash does: results keep the prefix exactly as typed
  // (../scenario/logs/app.log, not a root path), so they resolve correctly
  // from whatever directory the learner is in.
  function expandGlob(arg) {
    if (!arg.includes("*")) return [arg];
    const path = norm(arg);
    const re = new RegExp("^" + path.split("*").map(escapeRe).join("[^/]*") + "$");
    const hits = Object.keys(fs).filter((f) => re.test(f)).sort();
    if (!hits.length) return [arg];
    const slash = arg.lastIndexOf("/");
    const typedDir = slash >= 0 ? arg.slice(0, slash + 1) : "";
    // glob only in the last segment: rebuild with the typed prefix
    if (!typedDir.includes("*")) return hits.map((h) => typedDir + h.split("/").pop());
    return hits.map((h) => "/" + h);   // glob in a directory segment: use lab-absolute paths
  }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function readFile(arg) {
    const p = norm(arg);
    if (fs[p]) return { ok: true, content: fs[p].content, path: p };
    return { ok: false, path: arg };
  }

  // ---- tokenize one command segment into argv (quotes honored) ----
  function argv(seg) {
    const out = [];
    let cur = "", q = null, has = false;
    for (let i = 0; i < seg.length; i++) {
      const c = seg[i];
      if (q) { if (c === q) q = null; else cur += c; has = true; }
      else if (c === "'" || c === '"') { q = c; has = true; }
      else if (/\s/.test(c)) { if (has) { out.push(cur); cur = ""; has = false; } }
      else { cur += c; has = true; }
    }
    if (has) out.push(cur);
    return out;
  }

  // ---- parse flags of form -abc or -a value ----
  function parseFlags(args, withValue = []) {
    const flags = {}, rest = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a.length > 1 && a[0] === "-" && !/^-?\d+$/.test(a)) {
        const body = a.slice(1);
        // -dX style (value attached) for value flags
        let consumed = false;
        for (const vf of withValue) {
          if (body[0] === vf) {
            flags[vf] = body.length > 1 ? body.slice(1) : args[++i];
            consumed = true; break;
          }
        }
        if (consumed) continue;
        if (a.startsWith("-n") && /^-n\d+$/.test(a)) { flags.n = a.slice(2); continue; }
        for (const ch of body) flags[ch] = true;
      } else rest.push(a);
    }
    return { flags, rest };
  }

  // ---------------- commands ----------------
  const cmds = {
    pwd: () => ({ out: "/home/sam/lab" + (cwd ? "/" + cwd : ""), code: 0 }),
    cd: (a) => {
      const t = a[0] ? norm(a[0]) : "";
      if (t === "" || isDir(t)) { cwd = t; return { out: "", code: 0 }; }
      return { out: "", err: `cd: ${a[0]}: No such file or directory`, code: 1 };
    },
    echo: (a) => {
      let i = 0, esc = false;
      while (a[i] && /^-[neE]+$/.test(a[i])) { if (a[i].includes("e")) esc = true; i++; }
      let out = a.slice(i).join(" ");
      if (esc) out = out.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      return { out, code: 0 };
    },
    printf: (a) => {
      if (!a.length) return { out: "", err: "printf: usage: printf format [arguments]", code: 2 };
      const args = a.slice(1); let k = 0;
      const unesc = (t) => t.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
      const one = () => unesc(a[0]).replace(/%%|%[-0-9]*[sd]/g, (m) => m === "%%" ? "%" : (m.endsWith("d") ? String(parseInt(args[k++] || "0", 10) || 0) : (args[k++] ?? "")));
      let out = one();
      while (k > 0 && k < args.length) out += one();   // printf reuses the format for extra args
      return { out: out.replace(/\n$/, ""), code: 0 };
    },
    ls: (a) => {
      const { flags, rest } = parseFlags(a);
      const children = (dir) => {
        const pre = dir === "" ? "" : dir + "/";
        const set = new Set();
        for (const f of allEntries()) {
          if (dir === "" || f.startsWith(pre)) {
            const r = dir === "" ? f : f.slice(pre.length);
            const name = r.split("/")[0];
            if (name && (flags.a || !name.startsWith("."))) set.add(name);
          }
        }
        return [...set].sort();
      };
      const items = []; // {label, path|null, missing?}
      const addChild = (dir, n) => { const p = norm(dir ? dir + "/" + n : n); items.push({ label: n, path: fs[p] ? p : null }); };
      if (!rest.length) { for (const n of children(cwd)) addChild(cwd, n); }
      else {
        for (const t of rest.flatMap(expandGlob)) {
          const p = norm(t);
          if (fs[p]) items.push({ label: t.split("/").pop(), path: p });
          else if (isDir(p)) { for (const n of children(p)) addChild(p, n); }
          else items.push({ label: t, path: null, missing: true });
        }
      }
      if (flags.l) {
        const miss = items.filter((it) => it.missing).map((it) => `ls: cannot access '${it.label}': No such file or directory`);
        return {
          out: items.filter((it) => !it.missing).map((it) => it.path
            ? `${octalToRwx(fs[it.path].mode)} 1 sam sam ${String(fs[it.path].content.length).padStart(5)} ${it.label}`
            : `drwxr-xr-x 2 sam sam  4096 ${it.label}`).join("\n"),
          err: miss.join("\n"), code: miss.length ? 2 : 0,
          dirs: items.filter((it) => !it.path && !it.missing).map((it) => it.label),
        };
      }
      const mark = (it) => it.label + (flags.F && !it.path ? "/" : "");
      const dirNames = items.filter((it) => !it.path && !it.missing).map((it) => it.label);
      if (items.some((it) => it.missing)) {
        const miss = items.filter((it) => it.missing).map((it) => `ls: cannot access '${it.label}': No such file or directory`);
        const ok = items.filter((it) => !it.missing);
        return { out: ok.map(mark).join("  "), err: miss.join("\n"), code: 2, dirs: dirNames };
      }
      return { out: items.map(mark).join("  "), code: 0, dirs: dirNames };
    },
    mkdir: (a) => {
      const { flags, rest } = parseFlags(a);
      if (!rest.length) return { out: "", err: "mkdir: missing operand", code: 1 };
      for (const arg of rest) {
        const p = norm(arg);
        if (fs[p]) return { out: "", err: `mkdir: cannot create directory '${arg}': File exists`, code: 1 };
        if (isDir(p) && !flags.p) return { out: "", err: `mkdir: cannot create directory '${arg}': File exists`, code: 1 };
        const parent = p.split("/").slice(0, -1).join("/");
        if (!flags.p && parent && !isDir(parent)) return { out: "", err: `mkdir: cannot create directory '${arg}': No such file or directory`, code: 1 };
        dirs.add(p);
      }
      return { out: "", code: 0 };
    },
    touch: (a) => {
      const { rest } = parseFlags(a);
      for (const arg of rest) {
        const p = norm(arg), parent = p.split("/").slice(0, -1).join("/");
        if (parent && !isDir(parent)) return { out: "", err: `touch: cannot touch '${arg}': No such file or directory`, code: 1 };
        if (!fs[p] && !isDir(p)) fs[p] = { content: "", mode: "644" };
      }
      return { out: "", code: 0 };
    },
    rm: (a) => {
      const { flags, rest } = parseFlags(a);
      const err = [];
      for (const arg of rest.flatMap(expandGlob)) {
        const p = norm(arg);
        if (fs[p]) { delete fs[p]; continue; }
        if (isDir(p) && p !== "") {
          if (!flags.r && !flags.R) { err.push(`rm: cannot remove '${arg}': Is a directory`); continue; }
          for (const f of Object.keys(fs)) if (f.startsWith(p + "/")) delete fs[f];
          for (const d of [...dirs]) if (d === p || d.startsWith(p + "/")) dirs.delete(d);
          continue;
        }
        if (!flags.f) err.push(`rm: cannot remove '${arg}': No such file or directory`);
      }
      return { out: "", err: err.join("\n"), code: err.length ? 1 : 0 };
    },
    cp: (a) => {
      const { rest } = parseFlags(a);
      if (rest.length < 2) return { out: "", err: "cp: missing destination file operand", code: 1 };
      const src = norm(rest[0]); let dst = norm(rest[1]);
      if (!fs[src]) return { out: "", err: `cp: cannot stat '${rest[0]}': No such file or directory`, code: 1 };
      if (isDir(dst) && !fs[dst]) dst = (dst ? dst + "/" : "") + src.split("/").pop();
      fs[dst] = { content: fs[src].content, mode: fs[src].mode };
      return { out: "", code: 0 };
    },
    mv: (a) => {
      const { rest } = parseFlags(a);
      if (rest.length < 2) return { out: "", err: "mv: missing destination file operand", code: 1 };
      const src = norm(rest[0]); let dst = norm(rest[1]);
      if (!fs[src]) return { out: "", err: `mv: cannot stat '${rest[0]}': No such file or directory`, code: 1 };
      if (isDir(dst) && !fs[dst]) dst = (dst ? dst + "/" : "") + src.split("/").pop();
      fs[dst] = fs[src]; delete fs[src];
      return { out: "", code: 0 };
    },
    cat: (a) => {
      const parts = a.flatMap(expandGlob);
      let out = [], code = 0, err = [];
      for (const f of parts) {
        const r = readFile(f);
        if (r.ok) out.push(r.content.replace(/\n$/, "")); else { err.push(`cat: ${f}: No such file or directory`); code = 1; }
      }
      return { out: out.join("\n"), err: err.join("\n"), code };
    },
    grep: (a, stdin) => {
      const { flags, rest } = parseFlags(a);
      const pat = rest.shift();
      let files = rest.flatMap(expandGlob);
      // each input: name = what to print (relative, as typed), path = how to read it
      let sources = files.map((f) => ({ name: f, path: f }));
      if (flags.r || flags.R) {
        sources = [];
        for (const d of (files.length ? files : ["."])) {
          const rd = norm(d);
          if (fs[rd]) { sources.push({ name: d, path: d }); continue; }
          const shown = d === "." ? "" : d.replace(/\/+$/, "") + "/";
          for (const f of Object.keys(fs).sort()) {
            if (rd === "" || f.startsWith(rd + "/")) sources.push({ name: shown + (rd === "" ? f : f.slice(rd.length + 1)), path: "/" + f });
          }
        }
      }
      let reSrc = pat;
      if (flags.w) reSrc = "\\b(?:" + pat + ")\\b";
      const re = new RegExp(reSrc, flags.i ? "i" : "");
      const multi = (sources.length > 1 || flags.r || flags.R) && !flags.h;
      const missing = sources.filter((s) => !readFile(s.path).ok).map((s) => `grep: ${s.name}: No such file or directory`);
      const inputs = sources.length
        ? sources.filter((s) => readFile(s.path).ok).map((s) => ({ name: s.name, lines: readFile(s.path).content.split("\n") }))
        : [{ name: null, lines: (stdin || "").split("\n") }];
      let outLines = [], count = 0;
      for (const inp of inputs) {
        let fcount = 0;
        for (let i = 0; i < inp.lines.length; i++) {
          const line = inp.lines[i];
          if (i === inp.lines.length - 1 && line === "") continue; // trailing newline
          let matched = re.test(line);
          if (flags.v) matched = !matched;
          if (!matched) continue;
          fcount++; count++;
          if (flags.c) continue;
          let piece = line;
          if (flags.o) { const m = line.match(new RegExp(reSrc, "g" + (flags.i ? "i" : ""))); if (m) { for (const mm of m) outLines.push(prefix(inp.name) + mm); } continue; }
          outLines.push(prefix(inp.name) + (flags.n ? (i + 1) + ":" : "") + piece);
        }
        if (flags.c && multi) outLines.push(`${inp.name}:${fcount}`);
      }
      function prefix(name) { return multi && name ? name + ":" : ""; }
      const err = missing.join("\n");
      if (flags.c && !multi) return { out: String(count), err, code: missing.length ? 2 : count ? 0 : 1 };
      return { out: outLines.join("\n"), err, code: missing.length ? 2 : outLines.length ? 0 : 1 };
    },
    wc: (a, stdin) => {
      const { flags, rest } = parseFlags(a);
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      const lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
      if (flags.l) return { out: String(lines.length), code: 0 };
      if (flags.w) return { out: String(text.split(/\s+/).filter(Boolean).length), code: 0 };
      return { out: `${lines.length} ${text.split(/\s+/).filter(Boolean).length} ${text.length}`, code: 0 };
    },
    head: (a, stdin) => {
      a = a.flatMap((x) => /^-\d+$/.test(x) ? ["-n", x.slice(1)] : [x]);
      const { flags, rest } = parseFlags(a, ["n"]);
      const nn = parseInt(flags.n || "10", 10);
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      const lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
      return { out: lines.slice(0, nn).join("\n"), code: 0 };
    },
    tail: (a, stdin) => {
      a = a.flatMap((x) => /^-\d+$/.test(x) ? ["-n", x.slice(1)] : [x]);
      const { flags, rest } = parseFlags(a, ["n"]);
      const nn = parseInt(flags.n || "10", 10);
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      const lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
      return { out: lines.slice(-nn).join("\n"), code: 0 };
    },
    sort: (a, stdin) => {
      const { flags, rest } = parseFlags(a);
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      let lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
      lines = lines.slice().sort((x, y) => flags.n ? (parseFloat(x) || 0) - (parseFloat(y) || 0) : (x < y ? -1 : x > y ? 1 : 0));
      if (flags.r) lines.reverse();
      return { out: lines.join("\n"), code: 0 };
    },
    uniq: (a, stdin) => {
      const { flags, rest } = parseFlags(a);
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      const lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
      const out = []; let prev = null, c = 0;
      for (const l of lines) {
        if (l === prev) c++;
        else { if (prev !== null) out.push(flags.c ? `${String(c).padStart(7)} ${prev}` : prev); prev = l; c = 1; }
      }
      if (prev !== null) out.push(flags.c ? `${String(c).padStart(7)} ${prev}` : prev);
      return { out: out.join("\n"), code: 0 };
    },
    cut: (a, stdin) => {
      const { flags, rest } = parseFlags(a, ["d", "f"]);
      const d = flags.d || "\t"; const fields = (flags.f || "1").split(",").map((n) => parseInt(n, 10));
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      const lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
      const out = lines.map((l) => { const p = l.split(d); return fields.map((f) => p[f - 1] ?? "").join(d); });
      return { out: out.join("\n"), code: 0 };
    },
    sed: (a, stdin) => {
      const { flags, rest } = parseFlags(a);
      const prog = rest.shift() || "";
      const fileArg = rest[0];
      const text = fileArg ? (readFile(fileArg).content || "") : (stdin || "");
      const m = prog.match(/^s\/((?:\\.|[^/])*)\/((?:\\.|[^/])*)\/(g?)$/);
      let lines = text.split("\n"); const trailing = lines[lines.length - 1] === ""; if (trailing) lines.pop();
      if (m) { const re = new RegExp(m[1], m[3] ? "g" : ""); lines = lines.map((l) => l.replace(re, m[2])); }
      let out = lines.join("\n") + (trailing ? "\n" : "");
      if (flags.i && fileArg) { const p = norm(fileArg); if (fs[p]) { fs[p].content = out; } return { out: "", code: 0 }; }
      return { out: out.replace(/\n$/, ""), code: 0 };
    },
    awk: (a, stdin) => {
      // supports: -F sep, optional pattern ($N op v, /re/, $N ~ /re/, NR op n, joined by && / ||), {print ...}
      let sep = null; const rest = [];
      for (let i = 0; i < a.length; i++) {
        const x = a[i];
        if (x === "-F") { sep = a[++i] || " "; continue; }
        if (/^-F./.test(x)) { sep = x.slice(2); continue; }
        rest.push(x);
      }
      if (sep !== null) sep = sep.replace(/^["']|["']$/g, "").replace(/^\\t$/, "\t");
      const prog = (rest.shift() || "").trim();
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      const lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
      const m = prog.match(/^(.*?)\s*(\{[\s\S]*\})?\s*$/);
      const pattern = (m[1] || "").trim(), action = m[2] || "{print $0}";
      const pm = action.match(/^\{\s*print\s*(.*?)\s*;?\s*\}$/);
      if (!pm) return { out: "", err: "awk: only {print ...} actions are supported here", code: 2 };
      const items = (pm[1] || "$0").split(",").map((t) => t.trim());
      const fieldsOf = (l) => sep === null ? l.trim().split(/\s+/) : l.split(sep);
      const val = (tok, f, nr) => {
        tok = tok.trim();
        if (tok === "$0") return f.line;
        const fm = tok.match(/^\$(\d+)$/); if (fm) return f[parseInt(fm[1], 10) - 1] ?? "";
        if (tok === "NR") return String(nr); if (tok === "NF") return String(f.length);
        return tok.replace(/^["']|["']$/g, "");
      };
      const isNum = (v) => v !== "" && !isNaN(Number(v));
      const cond = (expr, f, nr) => {
        expr = expr.trim(); if (!expr) return true;
        if (expr.includes("||")) return expr.split("||").some((e) => cond(e, f, nr));
        if (expr.includes("&&")) return expr.split("&&").every((e) => cond(e, f, nr));
        if (expr[0] === "!" && expr[1] !== "=") return !cond(expr.slice(1), f, nr);
        let r = expr.match(/^\/(.*)\/$/); if (r) return new RegExp(r[1]).test(f.line);
        r = expr.match(/^(\S+)\s*(!?~)\s*\/(.*)\/$/);
        if (r) { const t = new RegExp(r[3]).test(val(r[1], f, nr)); return r[2] === "~" ? t : !t; }
        r = expr.match(/^(\S+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
        if (!r) return false;
        let x = val(r[1], f, nr), y = val(r[3], f, nr);
        if (isNum(x) && isNum(y)) { x = Number(x); y = Number(y); }
        switch (r[2]) { case "==": return x == y; case "!=": return x != y; case ">": return x > y; case "<": return x < y; case ">=": return x >= y; case "<=": return x <= y; }
        return false;
      };
      const out = [];
      lines.forEach((l, i) => {
        const f = fieldsOf(l); f.line = l;
        if (!cond(pattern, f, i + 1)) return;
        out.push(items.map((it) => val(it, f, i + 1)).join(" "));
      });
      return { out: out.join("\n"), code: 0 };
    },
    jq: (a, stdin) => {
      const { flags, rest } = parseFlags(a);
      const filter = rest.shift() || ".";
      const text = rest.length ? (readFile(rest[0]).content || "") : (stdin || "");
      let data; try { data = JSON.parse(text); } catch (e) { return { out: "", err: "jq: parse error", code: 2 }; }
      let stream = [data];
      for (let step of filter.split("|").map((s) => s.trim())) {
        const next = [];
        for (const v of stream) {
          if (/^\.\w+\[\]$/.test(step)) { const k = step.slice(1, -2); const arr = v && v[k]; if (Array.isArray(arr)) next.push(...arr); }
          else if (step === ".[]") { if (Array.isArray(v)) next.push(...v); }
          else if (/^select\(/.test(step)) {
            const cm = step.match(/^select\(\s*\.(\w+)\s*==\s*"([^"]*)"\s*\)$/);
            if (cm && v && v[cm[1]] === cm[2]) next.push(v);
          }
          else if (/^\.\w+$/.test(step)) { next.push(v ? v[step.slice(1)] : null); }
          else if (step === ".") { next.push(v); }
        }
        stream = next;
      }
      const out = stream.map((v) => (flags.r && typeof v === "string") ? v : (typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v)));
      return { out: out.join("\n"), code: 0 };
    },
    chmod: (a) => {
      // chmod leads with a mode that looks like a flag (+x, -w), so parse by hand
      const args = a.slice();
      const spec = args.shift(); const target = args[0];
      const file = norm(target || "");
      if (!fs[file]) return { out: "", err: `chmod: cannot access '${target}': No such file or directory`, code: 1 };
      if (/^[0-7]{3,4}$/.test(spec)) { fs[file].mode = spec.replace(/^0/, "").padStart(3, "0").slice(-3); return { out: "", code: 0 }; }
      // symbolic: [ugoa][+-=][rwx], default scope a
      const sm = spec.match(/^([ugoa]*)([+\-=])([rwx]+)$/);
      if (!sm) return { out: "", err: `chmod: invalid mode: '${spec}'`, code: 1 };
      const who = sm[1] || "a", op = sm[2], bits = sm[3];
      const add = (bits.includes("r") ? 4 : 0) + (bits.includes("w") ? 2 : 0) + (bits.includes("x") ? 1 : 0);
      const scopes = who === "a" ? [0, 1, 2] : [...who].map((c) => ({ u: 0, g: 1, o: 2 }[c]));
      const digits = fs[file].mode.slice(-3).split("").map((d) => parseInt(d, 10));
      for (const s of scopes) digits[s] = op === "=" ? add : op === "+" ? (digits[s] | add) : (digits[s] & ~add);
      fs[file].mode = digits.join("");
      return { out: "", code: 0 };
    },
    // Opens the in-browser editor. The engine resolves the path; the UI shows
    // the editor and saves back through writeFile().
    edit: (a) => {
      const { rest } = parseFlags(a);
      if (!rest.length) return { out: "", err: "usage: edit <file>", code: 1 };
      const p = norm(rest[0]);
      if (isDir(p) && !fs[p]) return { out: "", err: `edit: ${rest[0]}: Is a directory`, code: 1 };
      const parent = p.split("/").slice(0, -1).join("/");
      if (parent && !isDir(parent)) return { out: "", err: `edit: ${rest[0]}: No such file or directory`, code: 1 };
      return { out: "", code: 0, open: { path: p, name: rest[0], content: fs[p] ? fs[p].content : "", isNew: !fs[p] } };
    },
    clear: () => ({ out: "\f", code: 0 }),
    help: () => ({ out: "available: " + Object.keys(cmds).filter((c) => c !== "help").sort().join(", ") + "\nTab completes commands and paths. Up/down recalls history.", code: 0 }),
  };

  cmds.nano = cmds.edit; cmds.vim = cmds.edit; cmds.vi = cmds.edit;

  function octalToRwx(mode) {
    const map = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
    const d = mode.padStart(3, "0").slice(-3);
    return "-" + [...d].map((n) => map[parseInt(n, 10)]).join("");
  }

  // ---- run one full line: a pipeline with optional > redirect ----
  function run(line) {
    line = line.trim();
    if (!line) return { out: "", err: "", code: 0 };
    // redirection
    let redir = null, redirAppend = false;
    const rm = line.match(/\s(>>?)\s*(\S+)\s*$/);
    if (rm) { redirAppend = rm[1] === ">>"; redir = rm[2]; line = line.slice(0, rm.index); }
    // input redirection: cmd < file
    let stdinInit = null;
    const im = line.match(/\s<\s*(\S+)/);
    if (im) { const r = readFile(im[1]); stdinInit = r.ok ? r.content : ""; line = line.slice(0, im.index) + line.slice(im.index + im[0].length); }
    const segs = splitPipes(line);
    let stdin = stdinInit, res = { out: "", err: "", code: 0 };
    for (const seg of segs) {
      const parts = argv(seg);
      const name = parts.shift();
      const fn = cmds[name];
      if (!fn) {
        if (name && name.includes("/")) {        // path invocation of a script
          const p = norm(name);
          if (!fs[p]) return { out: "", err: `bash: ${name}: No such file or directory`, code: 127 };
          const ownerDigit = parseInt(fs[p].mode.slice(-3)[0], 10);
          if (!(ownerDigit & 1)) return { out: "", err: `bash: ${name}: Permission denied`, code: 126 };
          if (scriptRunner) { res = scriptRunner(fs[p].content, parts, stdin); stdin = res.out; continue; }
        }
        return { out: "", err: `${name}: command not found`, code: 127 };
      }
      res = fn(parts, stdin);
      if (res.err && res.code !== 0 && !res.out) { return { out: res.out || "", err: res.err, code: res.code }; }
      stdin = res.out;
    }
    if (redir) {
      const p = norm(redir);
      const parent = p.split("/").slice(0, -1).join("/");
      if (parent && !isDir(parent)) return { out: "", err: `bash: ${redir}: No such file or directory`, code: 1 };
      if (isDir(p) && !fs[p]) return { out: "", err: `bash: ${redir}: Is a directory`, code: 1 };
      const data = (res.out || "") + "\n";
      fs[p] = { content: redirAppend && fs[p] ? fs[p].content + data : data, mode: fs[p] ? fs[p].mode : "644" };
      return { out: "", err: res.err || "", code: res.code };
    }
    return {
      out: res.out || "", err: res.err || "", code: res.code,
      dirs: segs.length === 1 ? res.dirs : undefined,
      open: segs.length === 1 ? res.open : undefined,
    };
  }

  // Save from the editor. Takes a lab-root path (what edit returned).
  function writeFile(path, content) {
    const p = rootPath("/" + path.replace(/^\/+/, ""));
    const parent = p.split("/").slice(0, -1).join("/");
    if (parent && !isDir(parent)) return false;
    fs[p] = { content, mode: fs[p] ? fs[p].mode : "644" };
    return true;
  }

  function splitPipes(line) {
    const out = []; let cur = "", q = null;
    for (const c of line) {
      if (q) { cur += c; if (c === q) q = null; }
      else if (c === "'" || c === '"') { q = c; cur += c; }
      else if (c === "|") { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim()).filter(Boolean);
  }

  // Checkers and simulated services address files from the lab root,
  // regardless of where the learner has cd'd to.
  function rootPath(path) { return norm(path.startsWith("/") || path.startsWith("~") ? path : "/" + path); }
  function fileMode(path) { const p = rootPath(path); return fs[p] ? fs[p].mode.slice(-3) : null; }
  function fileContent(path) { const p = rootPath(path); return fs[p] ? fs[p].content : null; }

  // ---- extension points (used by module packs) ----
  let extraSeed = {};                 // files re-applied on reset
  function _addFiles(obj) { Object.assign(extraSeed, obj); for (const k in obj) fs[k] = { content: obj[k].content, mode: obj[k].mode }; }
  function _addCommand(name, fn) { cmds[name] = fn; }
  const _reset = reset;
  function resetAll() { _reset(); for (const k in extraSeed) fs[k] = { content: extraSeed[k].content, mode: extraSeed[k].mode }; }

  // the prompt path, e.g. "~/lab/scenario/logs"
  function promptPath() { return "~/lab" + (cwd ? "/" + cwd : ""); }

  // tab completion: first word completes commands, later words complete paths
  function complete(line) {
    const m = line.match(/^(.*?)(\S*)$/);
    const before = m[1], word = m[2];
    const firstWord = !before.trim() || /[|]\s*$/.test(before);
    if (firstWord) {
      const hits = Object.keys(cmds).filter((c) => c.startsWith(word)).sort();
      return { matches: hits, line: hits.length === 1 ? before + hits[0] + " " : before + commonPrefix(hits, word) };
    }
    const slash = word.lastIndexOf("/");
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
    const stem = slash >= 0 ? word.slice(slash + 1) : word;
    const base = norm(dirPart || ".");
    if (!isDir(base)) return { matches: [], line };
    const pre = base === "" ? "" : base + "/";
    const names = new Set();
    for (const f of allEntries()) {
      if (base === "" || f.startsWith(pre)) {
        const rest = base === "" ? f : f.slice(pre.length);
        const n = rest.split("/")[0];
        if (n && n.startsWith(stem) && (stem.startsWith(".") || !n.startsWith("."))) names.add(n);
      }
    }
    const hits = [...names].sort();
    const isD = (n) => isDir(norm(dirPart + n)) && !fs[norm(dirPart + n)];
    if (hits.length === 1) return { matches: hits, line: before + dirPart + hits[0] + (isD(hits[0]) ? "/" : " ") };
    return { matches: hits.map((n) => n + (isD(n) ? "/" : "")), line: before + dirPart + commonPrefix(hits, stem) };
  }
  function commonPrefix(list, fallback) {
    if (!list.length) return fallback;
    let p = list[0];
    for (const s of list) while (!s.startsWith(p)) p = p.slice(0, -1);
    return p.length >= fallback.length ? p : fallback;
  }

  return {
    run, reset: resetAll, fileMode, fileContent, writeFile, promptPath, complete,
    _addFiles, _addCommand, _addDirs: (list) => { for (const d of list) { seedDirs.push(d); dirs.add(d); } },
    _setScriptRunner: (fn) => { scriptRunner = fn; },
    _fs: () => fs, _norm: norm, _root: rootPath, _parseFlags: parseFlags, _isDir: isDir,
  };
}

if (typeof module !== "undefined") module.exports = { createShell };
