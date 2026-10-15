/* Module 01 extension: the telemetryd simulation on top of the base shell.
   Adds config files + conf.d overrides, a `telemetryd` command with
   --check / --stress validation matching the downloadable module, and an
   `rm` command so learners can remove the stale override. Reuses the base
   shell's FS model by registering extra files and a couple of commands. */

function module01Files() {
  return {
    "etc/telemetryd.conf": {
      content:
        "# telemetryd base configuration\n" +
        "endpoint  = https://telemetry.northstar.internal/v1/ingest\n" +
        "interval  = 0\n" +
        "key_file  = etc/telemetryd.key\n" +
        "max_batch = 250\n",
      mode: "644",
    },
    "etc/telemetryd.d/90-local.conf": {
      content:
        "# added 2027-02 during the ingest backlog incident - review before keeping\n" +
        "max_batch = 100000\n",
      mode: "644",
    },
    "etc/telemetryd.key": {
      content:
        "# Northstar telemetry signing key (SIMULATED - not a real secret)\n" +
        "NORTHSTAR_TELEMETRY_KEY=sim-train-0000-not-real\n",
      mode: "644",
    },
    "var/log/telemetryd.log": {
      content: [
        "2027-02-11T06:02:14Z INFO  telemetryd boot sequence begin host=plt-ingest-3",
        "2027-02-11T06:02:14Z INFO  loaded config endpoint=https://telemetry.northstar.internal/v1/ingest",
        "2027-02-11T06:02:15Z INFO  healthy interval=15s batch=250",
        "2027-02-11T09:41:02Z WARN  ingest latency rising p95=820ms",
        "2027-02-11T09:58:37Z ERROR start failed E_LOAD: max_batch 100000 exceeds the safe limit of 500 under load",
        "2027-02-11T10:03:11Z INFO  operator applied override etc/telemetryd.d/90-local.conf",
        "2027-02-11T10:03:12Z ERROR start failed E_LOAD: max_batch 100000 exceeds the safe limit of 500 under load",
        "2027-02-12T22:14:49Z WARN  disk usage on /var above 80 percent",
        "2027-02-13T01:20:05Z ERROR start failed E_CONF_INTERVAL: interval must be a positive integer (got '0')",
        "2027-02-13T08:30:41Z INFO  config edited by apprentice onboarding script",
        "2027-02-13T08:31:00Z ERROR start failed E_PERM: key file etc/telemetryd.key must be mode 600, found 644",
        "",
      ].join("\n"),
      mode: "644",
    },
  };
}

/* Resolve config: base conf then sorted conf.d, last value wins. */
function resolveConf(read, listConfd) {
  const cfg = {};
  function readInto(path) {
    const r = read(path);
    if (!r) return;
    for (let line of r.split("\n")) {
      line = line.replace(/#.*/, "").trim();
      if (!line) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      cfg[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  readInto("etc/telemetryd.conf");
  for (const f of listConfd().sort()) readInto(f);
  return cfg;
}

/* Register module-01 behavior onto a base shell created by createShell().
   We pass in small accessors the base shell exposes. */
function installModule01(shell) {
  // seed files
  shell._addFiles(module01Files());

  // rm/mkdir/cp/mv come from the base shell.

  shell._addCommand("telemetryd", function (a) {
    const { flags } = shell._parseFlags(a);
    // accept --check / --stress as long flags
    const raw = a.join(" ");
    const stress = /--stress/.test(raw);
    const read = (p) => { const f = shell._fs()[shell._root(p)]; return f ? f.content : null; };
    const listConfd = () => Object.keys(shell._fs()).filter((f) => f.startsWith("etc/telemetryd.d/") && f.endsWith(".conf"));
    const cfg = resolveConf(read, listConfd);
    const die = (m) => ({ out: "", err: "telemetryd: start failed\n  " + m, code: 1 });

    const endpoint = cfg.endpoint || "";
    if (!endpoint) return die("E_CONF_ENDPOINT: endpoint is not set");
    if (!/^https:\/\//.test(endpoint)) return die(`E_CONF_ENDPOINT: endpoint must be an https URL (got '${endpoint}')`);

    const interval = cfg.interval;
    if (!/^[1-9][0-9]*$/.test(interval || "")) return die(`E_CONF_INTERVAL: interval must be a positive integer (got '${interval || ""}')`);

    const keyFile = cfg.key_file || "";
    if (!keyFile) return die("E_CONF_KEY: key_file is not set");
    const keyNode = shell._fs()[shell._root(keyFile)];
    if (!keyNode) return die(`E_KEY_MISSING: key file not found at ${keyFile}`);
    if (keyNode.mode.slice(-3) !== "600") return die(`E_PERM: key file ${keyFile} must be mode 600, found ${keyNode.mode.slice(-3)}`);

    if (stress) {
      const mb = cfg.max_batch;
      if (!/^[0-9]+$/.test(mb || "")) return die(`E_LOAD: max_batch must be an integer (got '${mb || ""}')`);
      if (parseInt(mb, 10) > 500) return die(`E_LOAD: max_batch ${mb} exceeds the safe limit of 500 under load - events are being dropped`);
    }
    return {
      out: "telemetryd: healthy\n  endpoint=" + endpoint + " interval=" + interval + "s max_batch=" + (cfg.max_batch || "") + " mode=" + (stress ? "stress" : "check"),
      code: 0,
    };
  });
}

if (typeof module !== "undefined") module.exports = { installModule01, module01Files };
