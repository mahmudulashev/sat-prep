/**
 * A small, safe math expression engine for the calculators (no eval).
 *
 * Supports: + - * / ^ !, parentheses, implicit multiplication (2x, 3(x+1), 2pi),
 * constants pi and e, variables, and the functions below.
 */

export type AngleMode = "rad" | "deg";

type Node =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "neg"; a: Node }
  | { t: "bin"; op: "+" | "-" | "*" | "/" | "^"; a: Node; b: Node }
  | { t: "fact"; a: Node }
  | { t: "call"; fn: string; args: Node[] };

type Token =
  | { k: "num"; v: number }
  | { k: "id"; v: string }
  | { k: "op"; v: string }
  | { k: "("; v: "(" }
  | { k: ")"; v: ")" }
  | { k: ","; v: "," };

const FUNCTIONS: Record<string, (mode: AngleMode, ...a: number[]) => number> = {
  sin: (m, x) => Math.sin(toRad(m, x)),
  cos: (m, x) => Math.cos(toRad(m, x)),
  tan: (m, x) => Math.tan(toRad(m, x)),
  asin: (m, x) => fromRad(m, Math.asin(x)),
  acos: (m, x) => fromRad(m, Math.acos(x)),
  atan: (m, x) => fromRad(m, Math.atan(x)),
  sqrt: (_m, x) => Math.sqrt(x),
  cbrt: (_m, x) => Math.cbrt(x),
  abs: (_m, x) => Math.abs(x),
  ln: (_m, x) => Math.log(x),
  log: (_m, x, base) => (base === undefined ? Math.log10(x) : Math.log(x) / Math.log(base)),
  exp: (_m, x) => Math.exp(x),
  floor: (_m, x) => Math.floor(x),
  ceil: (_m, x) => Math.ceil(x),
  round: (_m, x) => Math.round(x),
  min: (_m, ...a) => Math.min(...a),
  max: (_m, ...a) => Math.max(...a),
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

const toRad = (m: AngleMode, x: number) => (m === "deg" ? (x * Math.PI) / 180 : x);
const fromRad = (m: AngleMode, x: number) => (m === "deg" ? (x * 180) / Math.PI : x);

export class ExpressionError extends Error {}

function normalize(input: string) {
  return input
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .trim();
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const v = Number(src.slice(i, j));
      if (Number.isNaN(v)) throw new ExpressionError("Invalid number");
      tokens.push({ k: "num", v });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      tokens.push(...splitIdentifier(src.slice(i, j)));
      i = j;
    } else if ("+-*/^!".includes(c)) {
      tokens.push({ k: "op", v: c });
      i++;
    } else if (c === "(" || c === "[") {
      tokens.push({ k: "(", v: "(" });
      i++;
    } else if (c === ")" || c === "]") {
      tokens.push({ k: ")", v: ")" });
      i++;
    } else if (c === ",") {
      tokens.push({ k: ",", v: "," });
      i++;
    } else {
      throw new ExpressionError(`Unexpected "${c}"`);
    }
  }
  return tokens;
}

/** "xy" -> x*y, "sinx" -> sin x, "pix" -> pi*x. Longest known names win. */
function splitIdentifier(word: string): Token[] {
  const out: Token[] = [];
  const names = [...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS)].sort((a, b) => b.length - a.length);
  let rest = word;
  while (rest) {
    const known = names.find((n) => rest.toLowerCase().startsWith(n));
    if (known) {
      out.push({ k: "id", v: known });
      rest = rest.slice(known.length);
    } else {
      out.push({ k: "id", v: rest[0] });
      rest = rest.slice(1);
    }
  }
  return out;
}

class Parser {
  private i = 0;
  private tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Node {
    const node = this.expr(0);
    if (this.i < this.tokens.length) throw new ExpressionError("Unexpected input");
    return node;
  }

  private peek() {
    return this.tokens[this.i];
  }

  private next() {
    return this.tokens[this.i++];
  }

  private startsOperand(t: Token | undefined) {
    return Boolean(t && (t.k === "num" || t.k === "id" || t.k === "("));
  }

  // Precedence: + - (1) < * / implicit (2) < unary - (3) < ^ (4, right) < ! (5)
  private expr(minPrec: number): Node {
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      let op: "+" | "-" | "*" | "/" | "^" | null = null;
      let prec = 0;
      let implicit = false;
      if (t?.k === "op" && "+-".includes(t.v)) [op, prec] = [t.v as "+" | "-", 1];
      else if (t?.k === "op" && "*/".includes(t.v)) [op, prec] = [t.v as "*" | "/", 2];
      else if (t?.k === "op" && t.v === "^") [op, prec] = ["^", 4];
      else if (this.startsOperand(t)) [op, prec, implicit] = ["*", 2, true];
      if (!op || prec < minPrec) return left;
      if (!implicit) this.next();
      const right = this.expr(op === "^" ? prec : prec + 1);
      left = { t: "bin", op, a: left, b: right };
    }
  }

  private unary(): Node {
    const t = this.peek();
    if (t?.k === "op" && t.v === "-") {
      this.next();
      return { t: "neg", a: this.expr(3) };
    }
    if (t?.k === "op" && t.v === "+") {
      this.next();
      return this.expr(3);
    }
    return this.postfix(this.primary());
  }

  private postfix(node: Node): Node {
    while (this.peek()?.k === "op" && this.peek()!.v === "!") {
      this.next();
      node = { t: "fact", a: node };
    }
    return node;
  }

  private primary(): Node {
    const t = this.next();
    if (!t) throw new ExpressionError("Incomplete expression");
    if (t.k === "num") return { t: "num", v: t.v };
    if (t.k === "(") {
      const inner = this.expr(0);
      if (this.next()?.k !== ")") throw new ExpressionError("Missing )");
      return inner;
    }
    if (t.k === "id") {
      if (t.v in FUNCTIONS) {
        if (this.peek()?.k === "(") {
          this.next();
          const args: Node[] = [];
          if (this.peek()?.k !== ")") {
            args.push(this.expr(0));
            while (this.peek()?.k === ",") {
              this.next();
              args.push(this.expr(0));
            }
          }
          if (this.next()?.k !== ")") throw new ExpressionError("Missing )");
          return { t: "call", fn: t.v, args };
        }
        // sin x, sqrt 2 — applies to the next factor.
        return { t: "call", fn: t.v, args: [this.expr(4)] };
      }
      if (t.v in CONSTANTS) return { t: "num", v: CONSTANTS[t.v] };
      return { t: "var", name: t.v };
    }
    throw new ExpressionError("Unexpected token");
  }
}

function factorial(n: number) {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function evaluate(node: Node, scope: Record<string, number>, mode: AngleMode): number {
  switch (node.t) {
    case "num":
      return node.v;
    case "var":
      if (!(node.name in scope)) throw new ExpressionError(`Unknown variable ${node.name}`);
      return scope[node.name];
    case "neg":
      return -evaluate(node.a, scope, mode);
    case "fact":
      return factorial(evaluate(node.a, scope, mode));
    case "call":
      return FUNCTIONS[node.fn](mode, ...node.args.map((a) => evaluate(a, scope, mode)));
    case "bin": {
      const a = evaluate(node.a, scope, mode);
      const b = evaluate(node.b, scope, mode);
      switch (node.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "^": {
          // Real odd roots of negative numbers, e.g. (-8)^(1/3) = -2.
          const inverse = Math.round(1 / b);
          const oddRoot = a < 0 && !Number.isInteger(b) && Math.abs(1 / b - inverse) < 1e-9 && inverse % 2 !== 0;
          return oddRoot ? -Math.pow(-a, b) : Math.pow(a, b);
        }
      }
    }
  }
}

function variables(node: Node, into = new Set<string>()) {
  switch (node.t) {
    case "var":
      into.add(node.name);
      break;
    case "neg":
    case "fact":
      variables(node.a, into);
      break;
    case "bin":
      variables(node.a, into);
      variables(node.b, into);
      break;
    case "call":
      node.args.forEach((a) => variables(a, into));
      break;
  }
  return into;
}

export type Compiled = {
  vars: Set<string>;
  run: (scope?: Record<string, number>, mode?: AngleMode) => number;
};

export function compile(input: string): Compiled {
  const ast = new Parser(tokenize(normalize(input))).parse();
  return {
    vars: variables(ast),
    run: (scope = {}, mode = "rad") => evaluate(ast, scope, mode),
  };
}

/** Formats a result the way calculators do: up to 10 significant digits. */
export function formatNumber(value: number) {
  if (!Number.isFinite(value)) return Number.isNaN(value) ? "undefined" : value > 0 ? "∞" : "-∞";
  if (Math.abs(value) < 1e-12) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-6) return value.toExponential(6).replace(/\.?0+e/, "e");
  return String(Number(value.toPrecision(10)));
}

export type GraphExpression =
  | { kind: "function"; fn: (x: number) => number }
  | { kind: "vertical"; x: number }
  | { kind: "point"; x: number; y: number }
  | { kind: "value"; value: number }
  | { kind: "empty" }
  | { kind: "error"; message: string };

/** Interprets one line of the graphing calculator. */
export function interpretGraphLine(line: string, mode: AngleMode = "rad"): GraphExpression {
  const src = line.trim();
  if (!src) return { kind: "empty" };
  try {
    const point = src.match(/^\(\s*([^,]+),([^)]+)\)$/);
    if (point) {
      return { kind: "point", x: compile(point[1]).run({}, mode), y: compile(point[2]).run({}, mode) };
    }

    const [lhs, rhs, ...extra] = src.split("=");
    if (extra.length) throw new ExpressionError("Too many =");

    if (rhs !== undefined) {
      const left = lhs.trim().replace(/\s/g, "");
      if (left === "x") {
        const c = compile(rhs);
        if (c.vars.size === 0) return { kind: "vertical", x: c.run({}, mode) };
      }
      if (left === "y" || /^[a-z]\(x\)$/.test(left)) {
        const c = compile(rhs);
        const unknown = [...c.vars].filter((v) => v !== "x");
        if (unknown.length) throw new ExpressionError(`Unknown variable ${unknown[0]}`);
        return { kind: "function", fn: (x) => c.run({ x }, mode) };
      }
      throw new ExpressionError("Use the form y = …");
    }

    const c = compile(src);
    if (c.vars.size === 0) return { kind: "value", value: c.run({}, mode) };
    const unknown = [...c.vars].filter((v) => v !== "x");
    if (unknown.length) throw new ExpressionError(`Unknown variable ${unknown[0]}`);
    return { kind: "function", fn: (x) => c.run({ x }, mode) };
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : "Invalid expression" };
  }
}
