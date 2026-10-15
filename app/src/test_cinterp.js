const { runFunc, parseProgram, compileCheck } = require("./cinterp.js");
let pass = 0, fail = 0;
const eq = (l, g, w) => { if (g === w) { console.log("PASS", l); pass++; } else { console.log("FAIL", l, "\n  got: ", JSON.stringify(g), "\n  want:", JSON.stringify(w)); fail++; } };
const run = (src, fn, args) => runFunc(parseProgram(src), fn, args);
const traps = (src, fn, args, rx) => { try { run(src, fn, args); return false; } catch (e) { return e.cError && (!rx || rx.test(e.message)); } };

// --- basics ---
eq("return literal", run("int f(){ return 42; }", "f", []), 42);
eq("arithmetic precedence", run("int f(){ return 2 + 3 * 4; }", "f", []), 14);
eq("parens", run("int f(){ return (2 + 3) * 4; }", "f", []), 20);
eq("integer division truncates", run("int f(){ return 7 / 2; }", "f", []), 3);
eq("modulo", run("int f(){ return 17 % 5; }", "f", []), 2);
eq("comparison + logical", run("int f(){ return 3 > 2 && 1 < 0; }", "f", []), 0);
eq("unary not", run("int f(){ return !0; }", "f", []), 1);
eq("params", run("int add(int a, int b){ return a + b; }", "add", [3, 4]), 7);

// --- control flow ---
eq("if/else", run("int f(int x){ if (x > 0) return 1; else return -1; }", "f", [-5]), -1);
eq("for loop sum", run("int f(int n){ int s = 0; for (int i = 1; i <= n; i++) s += i; return s; }", "f", [5]), 15);
eq("while loop", run("int f(int n){ int c = 0; while (n > 0) { n = n / 2; c++; } return c; }", "f", [8]), 4);
eq("nested + early return", run("int f(int n){ for (int i=0;i<n;i++){ if (i==3) return i; } return -1; }", "f", [10]), 3);

// --- strings as char* params ---
eq("strlen builtin", run("int f(const char *s){ return strlen(s); }", "f", ["hello"]), 5);
eq("index returns char code", run("int f(const char *s){ return s[0]; }", "f", ["A"]), 65);
eq("NUL terminator at s[len]", run("int f(const char *s){ return s[strlen(s)]; }", "f", ["hi"]), 0);
eq("count a char (correct)", run("int f(const char *s, char c){ int n=0; for (int i=0; s[i] != 0; i++) if (s[i]==c) n++; return n; }", "f", ["banana", "a".charCodeAt(0)]), 3);
eq("char arithmetic s[i]-'0'", run("int f(const char *s){ return s[0] - '0'; }", "f", ["7"]), 7);

// --- the kind of real bug the lab plants: off-by-one reads past the NUL ---
const buggy = "int f(const char *s, char c){ int n=0; for (int i=0; i <= strlen(s); i++) if (s[i]==c) n++; return n; }";
eq("off-by-one still returns a value on normal input (<=len reads the NUL, which isn't c)", run(buggy, "f", ["banana", "a".charCodeAt(0)]), 3);
// but reading past the NUL is a trap when i exceeds len
eq("reading past the end traps", traps("int f(const char *s){ return s[strlen(s)+1]; }", "f", ["hi"], /out-of-bounds/), true);

// --- runtime error detection ---
eq("division by zero traps", traps("int f(){ return 1 / 0; }", "f", [], /division by zero/), true);
eq("uninitialized use traps", traps("int f(){ int x; return x + 1; }", "f", [], /uninitialized/), true);
eq("infinite loop is caught", traps("int f(){ while (1) { } return 0; }", "f", [], /terminate/), true);

// --- function calling function ---
const two = "int sq(int x){ return x*x; }\nint f(int a){ return sq(a) + sq(a); }";
eq("one function calls another", run(two, "f", [3]), 18);

// --- compileCheck (gcc-lite) ---
eq("compileCheck ok", compileCheck("int f(){ return 0; }", ["f"]).ok, true);
eq("compileCheck missing function", compileCheck("int g(){ return 0; }", ["f"]).ok, false);
eq("compileCheck syntax error", compileCheck("int f(){ return 0 }", ["f"]).ok, false);
eq("compileCheck reports unbalanced brace", compileCheck("int f(){ return 0;", ["f"]).ok, false);

// a realistic to_int with validation
const toint = "int to_int(const char *s){ int v=0; for (int i=0; s[i]!=0; i++){ if (s[i] < '0' || s[i] > '9') return -1; v = v*10 + (s[i]-'0'); } return v; }";
eq("to_int parses", run(toint, "to_int", ["2048"]), 2048);
eq("to_int rejects non-digit", run(toint, "to_int", ["20x8"]), -1);
eq("to_int empty is 0", run(toint, "to_int", [""]), 0);

// longest run
const lr = "int longest_run(const char *s, char c){ int best=0; int cur=0; for (int i=0; s[i]!=0; i++){ if (s[i]==c){ cur++; if (cur>best) best=cur; } else cur=0; } return best; }";
eq("longest_run", run(lr, "longest_run", ["aabbbbac", "b".charCodeAt(0)]), 4);
eq("longest_run none", run(lr, "longest_run", ["xyz", "b".charCodeAt(0)]), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
