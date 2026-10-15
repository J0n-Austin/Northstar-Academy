/* Networking lab pack (Course 1). A tiny, consistent network model:
   - DNS resolves names from etc/hosts
   - the auth service really listens at 10.0.3.12:8443 (shown by `ss -ltn`)
   - a gateway config points at an upstream host+port
   Tools dig / ss / curl / gateway all read the SAME model, so fixing the
   config actually changes what the tools report. Two seeded bugs:
   a wrong DNS record and a wrong upstream port. */

var AUTH_IP = "10.0.3.12", AUTH_PORT = "8443";

function networkingFiles() {
  return {
    "etc/hosts": {
      content:
        "127.0.0.1       localhost\n" +
        "10.0.3.99       auth.northstar.internal\n" +   // wrong IP (bug 1)
        "10.0.3.20       db.northstar.internal\n",
      mode: "644",
    },
    "etc/gateway.conf": {
      content:
        "# api-gateway upstream configuration\n" +
        "upstream_host = auth.northstar.internal\n" +
        "upstream_port = 8080\n" +                       // wrong port (bug 2)
        "timeout_ms    = 3000\n",
      mode: "644",
    },
    "README.txt": {
      content:
        "The api-gateway can't reach the auth service.\n" +
        "Tools: dig <name>, ss -ltn, curl -s <url>, gateway --check.\n" +
        "Config: etc/hosts (DNS), etc/gateway.conf (upstream). Edit with sed -i.\n",
      mode: "644",
    },
  };
}

function resolveHost(read, name) {
  const hosts = read("etc/hosts") || "";
  for (const line of hosts.split("\n")) {
    const t = line.replace(/#.*/, "").trim();
    if (!t) continue;
    const parts = t.split(/\s+/);
    const ip = parts.shift();
    if (parts.includes(name)) return ip;
  }
  return null;
}

function installNetworking(shell) {
  shell._addFiles(networkingFiles());
  const read = (p) => { const f = shell._fs()[shell._root(p)]; return f ? f.content : null; };

  shell._addCommand("dig", function (a) {
    const { flags, rest } = shell._parseFlags(a);
    const name = rest.find((x) => !x.startsWith("+")) || "";
    const short = rest.includes("+short") || flags.short;
    const ip = resolveHost(read, name);
    if (short) return { out: ip || "", code: ip ? 0 : 1 };
    if (!ip) return { out: `; <<>> dig ${name}\n;; status: NXDOMAIN\n;; no A record for ${name}`, code: 1 };
    return { out: `; <<>> dig ${name}\n;; status: NOERROR\n${name}.\t300\tIN\tA\t${ip}`, code: 0 };
  });

  shell._addCommand("ss", function () {
    return {
      out:
        "State   Recv-Q  Send-Q   Local Address:Port\n" +
        "LISTEN  0       128      " + AUTH_IP + ":" + AUTH_PORT + "\n" +
        "LISTEN  0       128      10.0.3.20:5432\n" +
        "LISTEN  0       128      127.0.0.1:9100",
      code: 0,
    };
  });

  shell._addCommand("curl", function (a) {
    const { rest } = shell._parseFlags(a);
    const url = rest.find((x) => /^https?:\/\//.test(x)) || "";
    const m = url.match(/^https?:\/\/([^:/]+)(?::(\d+))?(\/\S*)?$/);
    if (!m) return { out: "", err: "curl: no URL", code: 2 };
    const host = m[1], port = m[2] || "443";
    const ip = resolveHost(read, host);
    if (!ip) return { out: "", err: `curl: (6) Could not resolve host: ${host}`, code: 6 };
    if (ip === AUTH_IP && port === AUTH_PORT) return { out: '{"status":"healthy","service":"auth"}', code: 0 };
    return { out: "", err: `curl: (7) Failed to connect to ${host} port ${port}: Connection refused`, code: 7 };
  });

  shell._addCommand("gateway", function (a) {
    const raw = a.join(" ");
    if (!/--check/.test(raw)) return { out: "gateway: usage: gateway --check", code: 2 };
    const conf = read("etc/gateway.conf") || "";
    const cfg = {};
    for (const line of conf.split("\n")) { const t = line.replace(/#.*/, "").trim(); if (!t) continue; const i = t.indexOf("="); if (i > 0) cfg[t.slice(0, i).trim()] = t.slice(i + 1).trim(); }
    const host = cfg.upstream_host, port = cfg.upstream_port;
    const ip = resolveHost(read, host);
    const die = (m) => ({ out: "", err: "gateway: upstream unreachable\n  " + m, code: 1 });
    if (!ip) return die(`E_DNS: ${host} does not resolve`);
    if (ip !== AUTH_IP) return die(`E_DNS: ${host} resolves to ${ip}, not the auth service`);
    if (port !== AUTH_PORT) return die(`E_PORT: upstream_port ${port} refused by ${host} (auth listens on ${AUTH_PORT})`);
    return { out: "gateway: upstream healthy\n  " + host + " -> " + ip + ":" + port, code: 0 };
  });
}

if (typeof module !== "undefined") module.exports = { installNetworking, networkingFiles, AUTH_IP, AUTH_PORT };
