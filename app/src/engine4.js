/* Shell Scripting & Automation pack (Course 1).
   A deliberately small bash interpreter so learners can write and run real
   scripts in the browser: comments, variables (NAME=value), positional
   params ($1, $#, $@), parameter expansion (${NAME}), command substitution
   $( ... ), and for ... in ... ; do ... done. Scripts run their commands
   through the base shell, so grep/wc/etc. behave exactly as elsewhere.
   Plus `bash`/`sh` to run a script, `./script.sh` once it's executable,
   and `crontab -l`/`-e` to schedule it. */

function automationFiles() {
  const svc = [
    "2027-03-01T00:01:12Z INFO  scheduler tick",
    "2027-03-01T00:04:55Z WARN  job queue depth 112",
    "2027-03-01T00:09:03Z ERROR export job 5521 failed: timeout",
    "2027-03-01T00:12:40Z INFO  job 5522 complete",
    "2027-03-01T00:18:21Z ERROR export job 5523 failed: storage 500",
    "2027-03-01T00:21:09Z INFO  job 5524 complete",
    "2027-03-01T00:27:33Z WARN  retry budget low",
    "2027-03-01T00:31:47Z ERROR export job 5525 failed: timeout",
    "2027-03-01T00:38:02Z INFO  job 5526 complete",
    "2027-03-01T00:44:50Z INFO  scheduler tick",
    "",
  ].join("\n");
  const audit = [   // different counts: a correct script must generalize to this
    "2027-03-02T06:00:00Z INFO  audit run started",
    "2027-03-02T06:00:01Z ERROR access denied user=guest resource=/admin",
    "2027-03-02T06:00:03Z INFO  policy reloaded",
    "2027-03-02T06:00:05Z ERROR access denied user=guest resource=/keys",
    "2027-03-02T06:00:08Z WARN  slow policy eval 240ms",
    "2027-03-02T06:00:09Z ERROR token rejected: expired",
    "2027-03-02T06:00:12Z INFO  audit run complete",
    "",
  ].join("\n");
  return {
    "logs/service.log": { content: svc, mode: "644" },
    "logs/audit.log": { content: audit, mode: "644" },
  };
}

function installAutomation(shell) {
  shell._addDirs(["logs", "bin", "var", "var/spool", "var/spool/cron"]);
  shell._addFiles(automationFiles());
  const CRON = "var/spool/cron/sam";

  // expand a single line against variables + positional params
  function expand(str, vars, pos) {
    // command substitution first: $( ... )
    str = str.replace(/\$\(([^()]*)\)/g, (_, inner) => {
      const r = shell.run(expand(inner, vars, pos));
      return (r.out || "").replace(/\n+$/, "");
    });
    // ${NAME} or ${1} (positional)
    str = str.replace(/\$\{(\w+)\}/g, (_, n) => {
      if (/^\d+$/.test(n)) { const i = parseInt(n, 10); return i === 0 ? "script.sh" : (pos[i - 1] !== undefined ? pos[i - 1] : ""); }
      return vars[n] !== undefined ? vars[n] : "";
    });
    // $1..$9, $#, $@, $0
    str = str.replace(/\$(\d|#|@)/g, (_, k) => {
      if (k === "#") return String(pos.length);
      if (k === "@") return pos.join(" ");
      const i = parseInt(k, 10);
      return i === 0 ? "script.sh" : (pos[i - 1] !== undefined ? pos[i - 1] : "");
    });
    // $NAME
    str = str.replace(/\$(\w+)/g, (_, n) => (vars[n] !== undefined ? vars[n] : ""));
    return str;
  }

  function stripComment(line) {
    // drop a full-line comment or shebang; leave quoted # alone by only
    // stripping an inline comment when the line has no quotes
    if (/^\s*#/.test(line)) return "";
    if (!/["']/.test(line)) return line.replace(/\s+#.*$/, "");
    return line;
  }

  function runScript(content, args) {
    const vars = {}, pos = args || [];
    const rawLines = content.split("\n");
    let out = [], code = 0;

    function execRange(lines) {
      let i = 0;
      while (i < lines.length) {
        let line = stripComment(lines[i]).trim();
        if (!line) { i++; continue; }

        // for VAR in LIST  (with `; do` inline or `do` on the next line)
        const fm = line.match(/^for\s+(\w+)\s+in\s+(.+)$/);
        if (fm) {
          const v = fm[1];
          let listStr = fm[2], inlineDo = false;
          const dm = listStr.match(/^(.*?)\s*;\s*do\s*$/);
          if (dm) { listStr = dm[1]; inlineDo = true; }
          const list = expand(listStr, vars, pos).split(/\s+/).filter(Boolean);
          i++;
          if (!inlineDo) {
            while (i < lines.length && !stripComment(lines[i]).trim()) i++;
            if (i < lines.length && stripComment(lines[i]).trim() === "do") i++;
          }
          // gather body until the matching done (supports nesting)
          const body = []; let depth = 1;
          while (i < lines.length) {
            const t = stripComment(lines[i]).trim();
            if (/^for\s+\w+\s+in\b/.test(t)) depth++;
            if (/^done\b/.test(t)) { depth--; if (depth === 0) break; }
            body.push(lines[i]); i++;
          }
          for (const item of list) { vars[v] = item; execRange(body); }
          i++; continue;
        }

        // assignment: NAME=value (no spaces around =)
        const am = line.match(/^(\w+)=(.*)$/);
        if (am && !/\s/.test(am[1])) { vars[am[1]] = expand(am[2], vars, pos).replace(/^["']|["']$/g, ""); i++; continue; }

        // otherwise a command line
        const r = shell.run(expand(line, vars, pos));
        if (r.out) out.push(r.out);
        if (r.err) out.push(r.err);
        code = r.code;
        i++;
      }
    }
    execRange(rawLines);
    return { out: out.join("\n"), err: "", code };
  }
  shell._setScriptRunner(runScript);

  function bashCmd(a) {
    const { rest } = shell._parseFlags(a);
    const file = rest.shift();
    if (!file) return { out: "", err: "usage: bash <script>", code: 2 };
    const node = shell._fs()[shell._norm(file)];
    if (!node) return { out: "", err: `bash: ${file}: No such file or directory`, code: 127 };
    return runScript(node.content, rest);
  }
  shell._addCommand("bash", bashCmd);
  shell._addCommand("sh", bashCmd);

  shell._addCommand("crontab", function (a) {
    const { flags, rest } = shell._parseFlags(a);
    const cur = shell._fs()[CRON];
    if (flags.l) {
      if (!cur || !cur.content.trim()) return { out: "", err: "no crontab for sam", code: 1 };
      return { out: cur.content.replace(/\n$/, ""), code: 0 };
    }
    if (flags.e) {
      return { out: "", code: 0, open: { path: CRON, name: "crontab (sam)", content: cur ? cur.content : "# m h dom mon dow   command\n", isNew: !cur } };
    }
    if (flags.r) { delete shell._fs()[CRON]; return { out: "", code: 0 }; }
    if (rest[0]) { // install from a file
      const f = shell._fs()[shell._norm(rest[0])];
      if (!f) return { out: "", err: `crontab: ${rest[0]}: No such file or directory`, code: 1 };
      shell._fs()[CRON] = { content: f.content, mode: "600" };
      return { out: "", code: 0 };
    }
    return { out: "", err: "usage: crontab -l | -e | <file>", code: 2 };
  });
}

if (typeof module !== "undefined") module.exports = { installAutomation, automationFiles };
