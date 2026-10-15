/* A small but genuine C interpreter for a constrained subset — enough to
   actually EXECUTE the lab's functions, so results depend on the real logic
   (and real bugs show up as wrong output or an out-of-bounds trap).

   Supported: functions with params (int, char, const char *);
   local decls (int, char, with optional init); assignment (= += -= ++ --);
   if/else, for, while, return; blocks; expressions with + - * / %,
   == != < > <= >=, && || !, unary -, parentheses; integer and char literals;
   string PARAMS indexed as s[i] (returns the char code; s[len]==0 is the NUL,
   beyond that is a trap); strlen() builtin. Scope is a single function body
   plus its params — no globals, no pointers beyond string params, no arrays
   of strings. That's all the C lab needs, and keeping it small keeps it correct. */

function tokenize(src) {
  const toks = []; let i = 0; const n = src.length;
  const nl = []; for (let k = 0; k < n; k++) if (src[k] === "\n") nl.push(k);
  const lineOf = (pos) => { let lo = 0, hi = nl.length; while (lo < hi) { const m = (lo + hi) >> 1; if (nl[m] < pos) lo = m + 1; else hi = m; } return lo + 1; };
  let cur = 0;
  const push = (t) => { t.line = lineOf(cur); toks.push(t); };
  const two = ["==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/="];
  while (i < n) {
    cur = i;
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { i += 2; while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    if (c === "'") { // char literal, with simple escapes
      let v;
      if (src[i + 1] === "\\") { const e = src[i + 2]; v = { "n": 10, "t": 9, "0": 0, "\\": 92, "'": 39 }[e]; if (v === undefined) v = e.charCodeAt(0); i += 4; }
      else { v = src.charCodeAt(i + 1); i += 3; }
      push({ t: "num", v }); continue;
    }
    if (c === '"') { let j = i + 1, s = ""; while (j < n && src[j] !== '"') { if (src[j] === "\\") { s += { n: "\n", t: "\t", "0": "\0", "\\": "\\", '"': '"' }[src[j + 1]] || src[j + 1]; j += 2; } else { s += src[j++]; } } push({ t: "str", v: s }); i = j + 1; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < n && /[0-9xXa-fA-F]/.test(src[j])) j++; push({ t: "num", v: parseInt(src.slice(i, j), src.slice(i, j).startsWith("0x") ? 16 : 10) }); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++; push({ t: "id", v: src.slice(i, j) }); i = j; continue; }
    const t2 = src.slice(i, i + 2);
    if (two.indexOf(t2) >= 0) { push({ t: "op", v: t2 }); i += 2; continue; }
    push({ t: "op", v: c }); i++;
  }
  cur = n; push({ t: "eof", v: null });
  return toks;
}

// Parser: produces function ASTs { name, params:[{type,name}], body:[stmts] }
function parseProgram(src) {
  const toks = tokenize(src); let p = 0;
  const PREC = [["||"], ["&&"], ["==", "!="], ["<", ">", "<=", ">="], ["+", "-"], ["*", "/", "%"]];
  const peek = (k) => toks[p + (k || 0)];
  const next = () => toks[p++];
  const expect = (v) => { const t = next(); if (t.v !== v) throw new CError(`expected '${v}' but found '${t.v}'`); return t; };
  const isType = (t) => t && t.t === "id" && ["int", "char", "const", "void"].indexOf(t.v) >= 0;

  function parseType() { // returns a string tag; we only track int/char/string
    let str = false, ptr = false;
    if (peek().v === "const") next();
    const base = next().v; // int | char | void
    while (peek().v === "*") { next(); ptr = true; }
    if (base === "char" && ptr) str = true;
    return str ? "string" : (ptr ? "ptr" : base);
  }

  const funcs = [];
  while (peek().t !== "eof") {
    if (!isType(peek())) throw new CError(`expected a type at top level, found '${peek().v}'`);
    parseType();                 // return type (ignored; everything is int-ish)
    const name = next().v;
    expect("(");
    const params = [];
    if (peek().v !== ")") {
      do { const ty = parseType(); const pn = next().v; params.push({ type: ty, name: pn }); } while (peek().v === "," && next());
    }
    expect(")");
    const body = parseBlock();
    funcs.push({ name, params, body });
  }
  return funcs;

  function parseBlock() { expect("{"); const s = []; while (peek().v !== "}") s.push(parseStmt()); expect("}"); return s; }

  function parseStmt() { const ln = peek().line; const st = parseStmt0(); if (st && st.line === undefined) st.line = ln; return st; }
  function parseStmt0() {
    const t = peek();
    if (t.v === "{") return { k: "block", body: parseBlock() };
    if (t.v === "if") { next(); expect("("); const c = parseExpr(); expect(")"); const then = parseStmt(); let els = null; if (peek().v === "else") { next(); els = parseStmt(); } return { k: "if", c, then, els }; }
    if (t.v === "while") { next(); expect("("); const c = parseExpr(); expect(")"); return { k: "while", c, body: parseStmt() }; }
    if (t.v === "for") { next(); expect("("); const init = peek().v === ";" ? null : parseSimple(); expect(";"); const c = peek().v === ";" ? null : parseExpr(); expect(";"); const step = peek().v === ")" ? null : parseSimple(); expect(")"); return { k: "for", init, c, step, body: parseStmt() }; }
    if (t.v === "return") { next(); const e = peek().v === ";" ? null : parseExpr(); expect(";"); return { k: "return", e }; }
    if (isType(t)) { const d = parseDecl(); expect(";"); return d; }
    const s = parseSimple(); expect(";"); return s;
  }

  function parseDecl() {
    const ty = parseType();
    const decls = [];
    do {
      const nm = next().v; let init = null, arraySize = null;
      if (peek().v === "[") { next(); arraySize = parseExpr(); expect("]"); }   // int buf[8];
      if (peek().v === "=") { next(); init = parseExpr(); }
      decls.push({ name: nm, init, arraySize });
    } while (peek().v === "," && next());
    return { k: "decl", ty, decls };
  }

  // a "simple" statement-expression: assignment or ++/-- or a bare call
  function parseSimple() {
    if (isType(peek())) return parseDecl();
    const start = p;
    // lvalue: id possibly indexed (not needed for assignment target here) then =,+=,...
    if (peek().t === "id" && (peek(1).v === "=" || peek(1).v === "+=" || peek(1).v === "-=" || peek(1).v === "*=" || peek(1).v === "/=")) {
      const name = next().v; const op = next().v; const e = parseExpr(); return { k: "assign", name, op, e };
    }
    if (peek().t === "id" && (peek(1).v === "++" || peek(1).v === "--")) { const name = next().v; const op = next().v; return { k: "postfix", name, op }; }
    if ((peek().v === "++" || peek().v === "--") && peek(1).t === "id") { const op = next().v; const name = next().v; return { k: "prefix", name, op }; }
    p = start; return { k: "exprstmt", e: parseExpr() };
  }

  // expression parser with precedence (PREC declared at the top of parseProgram)
  function parseExpr() { return parseBin(0); }
  function parseBin(level) {
    if (level >= PREC.length) return parseUnary();
    let left = parseBin(level + 1);
    while (peek().t === "op" && PREC[level].indexOf(peek().v) >= 0) { const op = next().v; const right = parseBin(level + 1); left = { k: "bin", op, left, right }; }
    return left;
  }
  function parseUnary() {
    if (peek().v === "!" || peek().v === "-") { const op = next().v; return { k: "unary", op, e: parseUnary() }; }
    return parsePostfix();
  }
  function parsePostfix() {
    let e = parsePrimary();
    while (peek().v === "[") { next(); const idx = parseExpr(); expect("]"); e = { k: "index", base: e, idx }; }
    return e;
  }
  function parsePrimary() {
    const t = peek();
    if (t.v === "(") { next(); const e = parseExpr(); expect(")"); return e; }
    if (t.t === "num") { next(); return { k: "num", v: t.v }; }
    if (t.t === "str") { next(); return { k: "str", v: t.v }; }
    if (t.t === "id") {
      next();
      if (peek().v === "(") { next(); const args = []; if (peek().v !== ")") { do { args.push(parseExpr()); } while (peek().v === "," && next()); } expect(")"); return { k: "call", name: t.v, args }; }
      if (peek().v === "++" || peek().v === "--") { const op = next().v; return { k: "postval", name: t.v, op }; }
      return { k: "var", name: t.v };
    }
    throw new CError(`unexpected '${t.v}' in expression`);
  }
}

function CError(msg) { this.message = msg; this.cError = true; }

// Execute one function by name with JS arg values. Strings pass as JS strings.
function runFunc(funcs, name, args, opts) {
  const trace = opts && opts.trace;
  const fn = funcs.find((f) => f.name === name);
  if (!fn) throw new CError(`no function named ${name}`);
  const scope = {};
  fn.params.forEach((prm, i) => { scope[prm.name] = { type: prm.type, val: args[i] }; });
  const RET = {};
  let steps = 0;
  function guard() { if (++steps > 2e6) throw new CError("execution did not terminate (possible infinite loop)"); }

  function truthy(v) { return v !== 0; }
  function ev(node) {
    guard();
    switch (node.k) {
      case "num": return node.v;
      case "str": return node.v;
      case "var": { const s = scope[node.name]; if (!s) throw new CError(`use of undeclared '${node.name}'`); if (s.val === undefined) throw new CError(`use of uninitialized '${node.name}'`); return s.val; }
      case "postval": { const s = scope[node.name]; const old = s.val; s.val = old + (node.op === "++" ? 1 : -1); return old; }
      case "index": {
        const base = evName(node.base); const str = scope[base] ? scope[base].val : evalStr(node.base);
        const idx = evInt(node.idx);
        if (typeof str !== "string") throw new CError(`cannot index non-string`);
        if (idx < 0 || idx > str.length) throw new CError(`out-of-bounds read: index ${idx} into a ${str.length}-char string (valid 0..${str.length})`);
        return idx === str.length ? 0 : str.charCodeAt(idx);   // s[len] is the NUL terminator
      }
      case "unary": { const v = evInt(node.e); return node.op === "!" ? (v ? 0 : 1) : -v; }
      case "bin": {
        if (node.op === "&&") return truthy(evInt(node.left)) ? (truthy(evInt(node.right)) ? 1 : 0) : 0;
        if (node.op === "||") return truthy(evInt(node.left)) ? 1 : (truthy(evInt(node.right)) ? 1 : 0);
        const a = evInt(node.left), b = evInt(node.right);
        switch (node.op) {
          case "+": return a + b; case "-": return a - b; case "*": return a * b;
          case "/": if (b === 0) throw new CError("division by zero"); return Math.trunc(a / b);
          case "%": if (b === 0) throw new CError("modulo by zero"); return a % b;
          case "==": return a === b ? 1 : 0; case "!=": return a !== b ? 1 : 0;
          case "<": return a < b ? 1 : 0; case ">": return a > b ? 1 : 0;
          case "<=": return a <= b ? 1 : 0; case ">=": return a >= b ? 1 : 0;
        }
        throw new CError(`unknown operator ${node.op}`);
      }
      case "call": {
        if (node.name === "strlen") { const s = evalStr(node.args[0]); return s.length; }
        // allow calling other defined functions
        const other = funcs.find((f) => f.name === node.name);
        if (other) return runFunc(funcs, node.name, node.args.map((a) => ev(a)), opts);
        throw new CError(`unknown function '${node.name}'`);
      }
    }
    throw new CError(`cannot evaluate ${node.k}`);
  }
  function evName(node) { return node.k === "var" ? node.name : null; }
  function evalStr(node) { const v = ev(node); if (typeof v !== "string") throw new CError("expected a string"); return v; }
  function evInt(node) { const v = ev(node); if (typeof v !== "number") throw new CError("expected an integer"); return v | 0; }

  function assign(name, op, value) {
    const s = scope[name]; if (!s) throw new CError(`assignment to undeclared '${name}'`);
    if (op === "=") s.val = value; else if (op === "+=") s.val += value; else if (op === "-=") s.val -= value; else if (op === "*=") s.val *= value; else if (op === "/=") s.val = Math.trunc(s.val / value);
  }

  function snap() { const o = {}; for (const k in scope) if (scope[k].val !== undefined) o[k] = scope[k].val; return o; }
  function exec(st) {
    guard();
    if (trace && st.line !== undefined && st.k !== "block" && st.k !== "for") trace({ fn: name, line: st.line, kind: st.k, vars: snap() });
    switch (st.k) {
      case "block": for (const s of st.body) { const r = exec(s); if (r === RET) return RET; } return;
      case "decl": for (const d of st.decls) scope[d.name] = { type: st.ty, val: d.init ? ev(d.init) : undefined }; return;
      case "assign": assign(st.name, st.op, evInt(st.e)); return;
      case "postfix": case "prefix": assign(st.name, "+=", st.op === "++" ? 1 : -1); return;
      case "exprstmt": ev(st.e); return;
      case "if": if (truthy(evInt(st.c))) { if (exec(st.then) === RET) return RET; } else if (st.els) { if (exec(st.els) === RET) return RET; } return;
      case "while": while ((trace && trace({ fn: name, line: st.line, kind: "while", vars: snap() }), truthy(evInt(st.c)))) { if (exec(st.body) === RET) return RET; } return;
      case "for": { if (st.init) exec(st.init); while ((trace && trace({ fn: name, line: st.line, kind: "for", vars: snap() }), st.c === null || truthy(evInt(st.c)))) { if (exec(st.body) === RET) return RET; if (st.step) exec(st.step); } return; }
      case "return": RET.value = st.e ? ev(st.e) : 0; return RET;
    }
    throw new CError(`cannot exec ${st.k}`);
  }

  for (const st of fn.body) { if (exec(st) === RET) return RET.value; }
  return 0;
}

// gcc-lite: a quick structural check (balanced braces/parens, required funcs present)
function compileCheck(src, required) {
  try {
    const funcs = parseProgram(src);
    const names = funcs.map((f) => f.name);
    const missing = (required || []).filter((r) => names.indexOf(r) < 0);
    if (missing.length) return { ok: false, error: `undefined reference to ${missing.join(", ")}` };
    return { ok: true, funcs };
  } catch (e) {
    if (e.cError) return { ok: false, error: e.message };
    throw e;
  }
}

if (typeof module !== "undefined") module.exports = { tokenize, parseProgram, runFunc, compileCheck, CError };
if (typeof window !== "undefined") window.CI = { tokenize: tokenize, parseProgram: parseProgram, runFunc: runFunc, compileCheck: compileCheck, CError: CError };
