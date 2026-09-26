"use client";

import { Calculator as CalculatorIcon, ChevronsDown, ChevronsUp, Delete, Minus, Plus, Redo2, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  compile,
  formatNumber,
  interpretGraphLine,
  type AngleMode,
  type GraphExpression,
} from "@/lib/calc/expression";
import { cn } from "@/lib/utils";

const COLORS = ["#c74440", "#2d70b3", "#388c46", "#6042a6", "#fa7e19", "#000000"];

type Mode = "graphing" | "scientific";

export function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("graphing");

  return (
    <div className="flex h-full flex-col bg-white font-exam text-bb-ink">
      <div className="flex h-11 shrink-0 items-center justify-between bg-[#1e1e1e] px-3 text-white">
        <div className="flex items-center rounded-md border border-white/40 p-0.5 text-[13px]">
          {(["graphing", "scientific"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 font-medium capitalize",
                mode === m ? "bg-white text-bb-ink underline underline-offset-2" : "text-white hover:bg-white/10",
              )}
            >
              {m === "graphing" ? <GraphGlyph /> : <CalculatorIcon className="size-3.5" />}
              {m}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close calculator">
          <X className="size-5" />
        </button>
      </div>
      {mode === "graphing" ? <Graphing /> : <Scientific />}
    </div>
  );
}

function GraphGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 12c3 0 3-8 6-8s3 8 7 8" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Graphing                                                                    */
/* -------------------------------------------------------------------------- */

type Viewport = { cx: number; cy: number; scale: number };

function Graphing() {
  const [lines, setLines] = useState<string[]>([""]);
  const [active, setActive] = useState(0);
  const [history, setHistory] = useState<{ past: string[][]; future: string[][] }>({ past: [], future: [] });
  const [keypad, setKeypad] = useState(true);
  const [view, setView] = useState<Viewport>({ cx: 0, cy: 0, scale: 20 });
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const parsed = useMemo(() => lines.map((l) => interpretGraphLine(l)), [lines]);

  const commit = (next: string[]) => {
    setHistory((h) => ({ past: [...h.past.slice(-50), lines], future: [] }));
    setLines(next);
  };

  const update = (index: number, value: string) => {
    const next = [...lines];
    next[index] = value;
    commit(next);
  };

  const addLine = (after = active) => {
    const next = [...lines];
    next.splice(after + 1, 0, "");
    commit(next);
    setActive(after + 1);
    requestAnimationFrame(() => inputs.current[after + 1]?.focus());
  };

  const removeLine = (index: number) => {
    const next = lines.length === 1 ? [""] : lines.filter((_, i) => i !== index);
    commit(next);
    setActive(Math.max(0, Math.min(active, next.length - 1)));
  };

  const undo = () =>
    setHistory((h) => {
      if (!h.past.length) return h;
      setLines(h.past[h.past.length - 1]);
      return { past: h.past.slice(0, -1), future: [lines, ...h.future] };
    });

  const redo = () =>
    setHistory((h) => {
      if (!h.future.length) return h;
      setLines(h.future[0]);
      return { past: [...h.past, lines], future: h.future.slice(1) };
    });

  const insert = (text: string) => {
    const el = inputs.current[active];
    const value = lines[active] ?? "";
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    update(active, next);
    requestAnimationFrame(() => {
      el?.focus();
      const caret = start + text.length - (text.endsWith("()") ? 1 : 0);
      el?.setSelectionRange(caret, caret);
    });
  };

  const keyAction = (key: string) => {
    const el = inputs.current[active];
    const value = lines[active] ?? "";
    const pos = el?.selectionStart ?? value.length;
    switch (key) {
      case "⌫":
        if (pos > 0) {
          update(active, value.slice(0, pos - 1) + value.slice(el?.selectionEnd ?? pos));
          requestAnimationFrame(() => el?.setSelectionRange(pos - 1, pos - 1));
        }
        break;
      case "←":
        el?.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
        el?.focus();
        break;
      case "→":
        el?.setSelectionRange(pos + 1, pos + 1);
        el?.focus();
        break;
      case "↵":
        addLine();
        break;
      default:
        insert(key);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GraphCanvas expressions={parsed} view={view} onView={setView} />

      <div className="flex h-11 shrink-0 items-center gap-1 border-y border-[#dcdcdc] bg-[#f3f3f3] px-2">
        <IconButton label="Add expression" onClick={() => addLine(lines.length - 1)}>
          <Plus className="size-5" />
        </IconButton>
        <IconButton label="Toggle keypad" onClick={() => setKeypad((k) => !k)} active={keypad}>
          <svg viewBox="0 0 24 16" className="h-4 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="22" height="14" rx="2" />
            <path d="M5 5h1M9 5h1M13 5h1M17 5h1M5 9h1M9 9h1M13 9h1M17 9h1M7 12h10" />
          </svg>
        </IconButton>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Undo" onClick={undo} disabled={!history.past.length}>
            <Undo2 className="size-4" />
          </IconButton>
          <IconButton label="Redo" onClick={redo} disabled={!history.future.length}>
            <Redo2 className="size-4" />
          </IconButton>
          <IconButton label="Reset graph view" onClick={() => setView({ cx: 0, cy: 0, scale: 20 })}>
            <span className="text-xs font-semibold">1:1</span>
          </IconButton>
          <IconButton label={keypad ? "Hide keypad" : "Show keypad"} onClick={() => setKeypad((k) => !k)}>
            {keypad ? <ChevronsDown className="size-5" /> : <ChevronsUp className="size-5" />}
          </IconButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {lines.map((line, i) => (
          <ExpressionRow
            key={i}
            index={i}
            value={line}
            color={COLORS[i % COLORS.length]}
            parsed={parsed[i]}
            active={i === active}
            inputRef={(el) => {
              inputs.current[i] = el;
            }}
            onFocus={() => setActive(i)}
            onChange={(v) => update(i, v)}
            onEnter={() => addLine(i)}
            onRemove={() => removeLine(i)}
          />
        ))}
      </div>

      {keypad && <Keypad onKey={keyAction} />}
    </div>
  );
}

function ExpressionRow({
  index,
  value,
  color,
  parsed,
  active,
  inputRef,
  onFocus,
  onChange,
  onEnter,
  onRemove,
}: {
  index: number;
  value: string;
  color: string;
  parsed: GraphExpression;
  active: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onFocus: () => void;
  onChange: (v: string) => void;
  onEnter: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={cn("flex min-h-14 border-b border-[#e3e3e3]", active && "outline-2 -outline-offset-2 outline-bb-blue")}>
      <div className={cn("flex w-10 shrink-0 flex-col items-center gap-1 pt-1 text-[11px]", active ? "bg-bb-blue text-white" : "bg-[#f3f3f3] text-[#777]")}>
        <span>{index + 1}</span>
        {(parsed.kind === "function" || parsed.kind === "point" || parsed.kind === "vertical") && (
          <span className="size-4 rounded-full border-2 border-white" style={{ background: color }} />
        )}
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col justify-center px-3">
        <input
          ref={inputRef}
          value={value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter();
            }
          }}
          spellCheck={false}
          autoComplete="off"
          className="w-full bg-transparent font-serif text-[17px] italic outline-none"
          aria-label={`Expression ${index + 1}`}
        />
        {parsed.kind === "value" && (
          <span className="self-end rounded bg-[#f0f0f0] px-2 text-sm text-[#444]">= {formatNumber(parsed.value)}</span>
        )}
        {parsed.kind === "error" && value.trim() && <span className="text-xs text-bb-review">{parsed.message}</span>}
      </div>
      <button type="button" onClick={onRemove} className="px-2 text-[#999] hover:text-bb-ink" aria-label={`Delete expression ${index + 1}`}>
        <X className="size-5" />
      </button>
    </div>
  );
}

function GraphCanvas({
  expressions,
  view,
  onView,
}: {
  expressions: GraphExpression[];
  view: Viewport;
  onView: (v: Viewport) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; view: Viewport } | null>(null);
  const [size, setSize] = useState({ w: 400, h: 260 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const toX = (x: number) => size.w / 2 + (x - view.cx) * view.scale;
    const toY = (y: number) => size.h / 2 - (y - view.cy) * view.scale;
    const fromX = (px: number) => view.cx + (px - size.w / 2) / view.scale;

    // Grid step that keeps lines ~40-100px apart.
    const raw = 60 / view.scale;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? pow * 10;

    const xStart = Math.floor(fromX(0) / step) * step;
    const yTop = view.cy + size.h / 2 / view.scale;
    const yStart = Math.floor((view.cy - size.h / 2 / view.scale) / step) * step;

    ctx.lineWidth = 1;
    for (let minor = 0; minor < 2; minor++) {
      const s = minor === 0 ? step / 5 : step;
      ctx.strokeStyle = minor === 0 ? "#f0f0f0" : "#dcdcdc";
      ctx.beginPath();
      for (let x = Math.floor(fromX(0) / s) * s; x <= fromX(size.w); x += s) {
        ctx.moveTo(Math.round(toX(x)) + 0.5, 0);
        ctx.lineTo(Math.round(toX(x)) + 0.5, size.h);
      }
      for (let y = Math.floor((view.cy - size.h / 2 / view.scale) / s) * s; y <= yTop; y += s) {
        ctx.moveTo(0, Math.round(toY(y)) + 0.5);
        ctx.lineTo(size.w, Math.round(toY(y)) + 0.5);
      }
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, toY(0));
    ctx.lineTo(size.w, toY(0));
    ctx.moveTo(toX(0), 0);
    ctx.lineTo(toX(0), size.h);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#333";
    ctx.font = "12px Roboto, Arial, sans-serif";
    const label = (v: number) => formatNumber(Number(v.toPrecision(12)));
    const axisY = Math.min(Math.max(toY(0) + 14, 12), size.h - 4);
    ctx.textAlign = "center";
    for (let x = xStart; x <= fromX(size.w); x += step) {
      if (Math.abs(x) < step / 2) continue;
      ctx.fillText(label(x), toX(x), axisY);
    }
    ctx.textAlign = "right";
    const axisX = Math.min(Math.max(toX(0) - 5, 22), size.w - 4);
    for (let y = yStart; y <= yTop; y += step) {
      if (Math.abs(y) < step / 2) continue;
      ctx.fillText(label(y), axisX, toY(y) + 4);
    }
    ctx.fillText("0", toX(0) - 5, toY(0) + 14);

    // Curves
    expressions.forEach((expr, i) => {
      const color = COLORS[i % COLORS.length];
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      if (expr.kind === "function") {
        ctx.beginPath();
        let penDown = false;
        let prevY = 0;
        for (let px = 0; px <= size.w; px += 1) {
          let y: number;
          try {
            y = expr.fn(fromX(px));
          } catch {
            penDown = false;
            continue;
          }
          const py = toY(y);
          if (!Number.isFinite(py) || Math.abs(py - prevY) > size.h * 3) {
            penDown = false;
            prevY = py;
            continue;
          }
          if (penDown) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
          penDown = true;
          prevY = py;
        }
        ctx.stroke();
      } else if (expr.kind === "vertical") {
        ctx.beginPath();
        ctx.moveTo(toX(expr.x), 0);
        ctx.lineTo(toX(expr.x), size.h);
        ctx.stroke();
      } else if (expr.kind === "point") {
        ctx.beginPath();
        ctx.arc(toX(expr.x), toY(expr.y), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#333";
        ctx.textAlign = "left";
        ctx.fillText(`(${formatNumber(expr.x)}, ${formatNumber(expr.y)})`, toX(expr.x) + 8, toY(expr.y) - 8);
      }
    });
  }, [expressions, size, view]);

  useEffect(() => {
    draw();
  }, [draw]);

  const zoom = (factor: number) => onView({ ...view, scale: Math.min(Math.max(view.scale * factor, 0.5), 4000) });

  return (
    <div ref={wrapRef} className="relative h-[40%] min-h-44 shrink-0 cursor-grab touch-none active:cursor-grabbing">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, view };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const d = drag.current;
          onView({
            ...d.view,
            cx: d.view.cx - (e.clientX - d.x) / d.view.scale,
            cy: d.view.cy + (e.clientY - d.y) / d.view.scale,
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onWheel={(e) => zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12)}
      />
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button type="button" onClick={() => zoom(1.4)} className="grid size-8 place-items-center rounded border border-[#ccc] bg-white shadow-sm hover:bg-[#f5f5f5]" aria-label="Zoom in">
          <Plus className="size-4" />
        </button>
        <button type="button" onClick={() => zoom(1 / 1.4)} className="grid size-8 place-items-center rounded border border-[#ccc] bg-white shadow-sm hover:bg-[#f5f5f5]" aria-label="Zoom out">
          <Minus className="size-4" />
        </button>
      </div>
    </div>
  );
}

const GRAPH_KEYS: { label: React.ReactNode; value: string; tone?: "dark" | "blue" | "light" }[][] = [
  [
    { label: <i>x</i>, value: "x" },
    { label: <i>y</i>, value: "y" },
    { label: <span><i>a</i><sup>2</sup></span>, value: "^2" },
    { label: <span><i>a</i><sup>b</sup></span>, value: "^" },
    { label: "7", value: "7", tone: "dark" },
    { label: "8", value: "8", tone: "dark" },
    { label: "9", value: "9", tone: "dark" },
    { label: "÷", value: "/" },
    { label: "√", value: "sqrt()", tone: "light" },
  ],
  [
    { label: "(", value: "(" },
    { label: ")", value: ")" },
    { label: <i>e</i>, value: "e" },
    { label: "n!", value: "!" },
    { label: "4", value: "4", tone: "dark" },
    { label: "5", value: "5", tone: "dark" },
    { label: "6", value: "6", tone: "dark" },
    { label: "×", value: "*" },
    { label: "←", value: "←", tone: "light" },
  ],
  [
    { label: "|a|", value: "abs()" },
    { label: ",", value: "," },
    { label: "sin", value: "sin()" },
    { label: "cos", value: "cos()" },
    { label: "1", value: "1", tone: "dark" },
    { label: "2", value: "2", tone: "dark" },
    { label: "3", value: "3", tone: "dark" },
    { label: "−", value: "-" },
    { label: <Delete className="mx-auto size-4" />, value: "⌫", tone: "light" },
  ],
  [
    { label: "tan", value: "tan()" },
    { label: "ln", value: "ln()" },
    { label: "log", value: "log()" },
    { label: "π", value: "pi" },
    { label: "0", value: "0", tone: "dark" },
    { label: ".", value: ".", tone: "dark" },
    { label: "=", value: "=" },
    { label: "+", value: "+" },
    { label: "↵", value: "↵", tone: "blue" },
  ],
];

function Keypad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <div className="grid shrink-0 grid-cols-9 gap-1 border-t border-[#dcdcdc] bg-[#f3f3f3] p-1.5">
      {GRAPH_KEYS.flat().map((key, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onKey(key.value)}
          className={cn(
            "h-9 rounded-[3px] border font-serif text-[15px] shadow-[0_1px_0_rgba(0,0,0,0.15)] active:translate-y-px",
            key.tone === "dark" && "border-[#c9c9c9] bg-[#d9d9d9] font-exam",
            key.tone === "blue" && "border-bb-blue bg-bb-blue text-white",
            key.tone === "light" && "border-[#c9c9c9] bg-[#e8e8e8] font-exam",
            !key.tone && "border-[#dcdcdc] bg-white",
          )}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("grid h-8 min-w-8 place-items-center rounded px-1 text-[#555] hover:bg-black/5 disabled:opacity-30", active && "bg-black/10")}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Scientific                                                                  */
/* -------------------------------------------------------------------------- */

function Scientific() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [ans, setAns] = useState(0);
  const [angle, setAngle] = useState<AngleMode>("deg");
  const [log, setLog] = useState<{ expr: string; value: string }[]>([]);

  const preview = useMemo(() => {
    if (!expr.trim()) return "";
    try {
      const c = compile(expr);
      if ([...c.vars].some((v) => v !== "ans")) return "";
      return formatNumber(c.run({ ans }, angle));
    } catch {
      return "";
    }
  }, [expr, ans, angle]);

  const press = (key: string) => {
    if (key === "AC") {
      setExpr("");
      setResult(null);
      return;
    }
    if (key === "⌫") {
      setExpr((e) => e.slice(0, -1));
      return;
    }
    if (key === "=") {
      try {
        const value = compile(expr).run({ ans }, angle);
        const formatted = formatNumber(value);
        setLog((l) => [...l.slice(-20), { expr, value: formatted }]);
        setAns(value);
        setResult(formatted);
        setExpr("");
      } catch {
        setResult("Error");
      }
      return;
    }
    setResult(null);
    setExpr((e) => (result && /^[+\-*/^]/.test(key) ? `ans${key}` : e + key));
  };

  const keys = [
    ["sin(", "cos(", "tan(", "(", ")", "AC"],
    ["asin(", "acos(", "atan(", "^", "√(", "⌫"],
    ["ln(", "log(", "π", "7", "8", "9"],
    ["x²", "!", "e", "4", "5", "6"],
    ["ans", "%", "/", "1", "2", "3"],
    ["*", "-", "+", "0", ".", "="],
  ];

  const display = (k: string) =>
    ({ "*": "×", "/": "÷", "-": "−", "sin(": "sin", "cos(": "cos", "tan(": "tan", "asin(": "sin⁻¹", "acos(": "cos⁻¹", "atan(": "tan⁻¹", "ln(": "ln", "log(": "log", "√(": "√" })[k] ?? k;

  const value = (k: string) => ({ "x²": "^2", "π": "π", "%": "/100", "√(": "sqrt(" })[k] ?? k;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1 overflow-y-auto bg-[#fafafa] px-4 py-3">
        {log.map((entry, i) => (
          <div key={i} className="flex justify-between text-sm text-[#777]">
            <span className="truncate">{entry.expr}</span>
            <span>= {entry.value}</span>
          </div>
        ))}
      </div>
      <div className="border-y border-[#dcdcdc] px-4 py-3">
        <input
          value={expr}
          onChange={(e) => {
            setExpr(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") press("=");
          }}
          className="w-full bg-transparent text-right text-2xl outline-none"
          aria-label="Calculator input"
          placeholder="0"
          spellCheck={false}
        />
        <p className="h-6 text-right text-lg text-[#666]">{result ?? (preview && `= ${preview}`)}</p>
      </div>
      <div className="flex items-center gap-2 px-3 pt-2 text-xs">
        {(["deg", "rad"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setAngle(m)}
            className={cn("rounded px-2 py-1 font-semibold uppercase", angle === m ? "bg-bb-ink text-white" : "bg-[#eee]")}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-6 gap-1 p-2">
        {keys.flat().map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k === "=" || k === "AC" || k === "⌫" ? k : value(k))}
            className={cn(
              "h-10 rounded-[3px] border text-[15px] shadow-[0_1px_0_rgba(0,0,0,0.15)] active:translate-y-px",
              /^[0-9.]$/.test(k) ? "border-[#c9c9c9] bg-[#d9d9d9]" : "border-[#dcdcdc] bg-white",
              k === "=" && "border-bb-blue bg-bb-blue text-white",
            )}
          >
            {display(k)}
          </button>
        ))}
      </div>
    </div>
  );
}
