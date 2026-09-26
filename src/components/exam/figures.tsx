"use client";

import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import type { BarFigure, Figure as FigureSpec, LineFigure, ScatterFigure } from "@/lib/exam/types";
import { Rich } from "./rich-text";

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];

export function Figure({ figure, caption }: { figure: FigureSpec; caption?: string }) {
  const [zoomIndex, setZoomIndex] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const zoom = ZOOM_STEPS[zoomIndex];

  return (
    <figure className="flex flex-col items-center">
      <div className="inline-flex max-w-full flex-col overflow-hidden rounded-[3px] border border-[#c9c9c9]">
        <div className="flex items-center justify-center gap-3 border-b border-[#d4d4d4] bg-[#f3f3f3] px-3 py-1.5 font-exam text-[13px] text-bb-ink">
          <button
            type="button"
            className="rounded p-0.5 hover:bg-black/5 disabled:opacity-30"
            onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-[18px]" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            className="rounded p-0.5 hover:bg-black/5 disabled:opacity-30"
            onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-[18px]" strokeWidth={1.6} />
          </button>
          <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button type="button" className="rounded px-1 hover:bg-black/5" onClick={() => setZoomIndex(1)}>
            Reset
          </button>
          <span className="h-4 w-px bg-[#c9c9c9]" />
          <button type="button" className="rounded p-0.5 hover:bg-black/5" onClick={() => setExpanded(true)} aria-label="Expand figure">
            <Maximize2 className="size-4" strokeWidth={1.8} />
          </button>
        </div>
        <div className="overflow-auto bg-white p-2" style={{ maxHeight: 520 }}>
          <div style={{ width: `${zoom * 100}%`, minWidth: zoom * 320 }}>
            <FigureBody figure={figure} />
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-[15px] italic">
          <Rich text={caption} />
        </figcaption>
      )}

      {expanded && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-6" onClick={() => setExpanded(false)}>
          <div className="relative w-full max-w-3xl rounded-lg bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="absolute top-3 right-3 rounded-full p-1.5 hover:bg-black/5"
              onClick={() => setExpanded(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <FigureBody figure={figure} />
          </div>
        </div>
      )}
    </figure>
  );
}

function FigureBody({ figure }: { figure: FigureSpec }) {
  switch (figure.kind) {
    case "scatter":
    case "line":
      return <Plot figure={figure} />;
    case "bar":
      return <Bars figure={figure} />;
    case "svg":
      return (
        <div
          className="mx-auto text-bb-ink [&_svg]:h-auto [&_svg]:w-full"
          style={{ maxWidth: figure.width * 1.4 }}
          dangerouslySetInnerHTML={{ __html: figure.svg }}
        />
      );
  }
}

const FONT = "'Noto Serif', Georgia, serif";

function ticks([min, max, step]: [number, number, number]) {
  const out: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

function Plot({ figure }: { figure: ScatterFigure | LineFigure }) {
  const W = 340;
  const H = 300;
  const m = { l: 44, r: 26, t: 26, b: 40 };
  const [xMin, xMax] = figure.x;
  const [yMin, yMax] = figure.y;
  const sx = (v: number) => m.l + ((v - xMin) / (xMax - xMin)) * (W - m.l - m.r);
  const sy = (v: number) => H - m.b - ((v - yMin) / (yMax - yMin)) * (H - m.t - m.b);
  const xTicks = ticks(figure.x);
  const yTicks = ticks(figure.y);
  const minorX = ticks([xMin, xMax, figure.x[2] / 2]);
  const minorY = ticks([yMin, yMax, figure.y[2] / 2]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" fontFamily={FONT} fontSize="15" role="img" aria-label={`${figure.kind} plot`}>
      <g stroke="#1e1e1e" strokeWidth="0.8">
        {minorX.map((x) => (
          <line key={`gx${x}`} x1={sx(x)} x2={sx(x)} y1={sy(yMin)} y2={sy(yMax)} opacity={0.9} />
        ))}
        {minorY.map((y) => (
          <line key={`gy${y}`} x1={sx(xMin)} x2={sx(xMax)} y1={sy(y)} y2={sy(y)} opacity={0.9} />
        ))}
      </g>
      <g stroke="#1e1e1e" strokeWidth="1.4" fill="#1e1e1e">
        <line x1={sx(xMin)} x2={sx(xMax) + 14} y1={sy(yMin)} y2={sy(yMin)} />
        <line x1={sx(xMin)} x2={sx(xMin)} y1={sy(yMin)} y2={sy(yMax) - 14} />
        <path d={`M${sx(xMax) + 18} ${sy(yMin)} l-8 -4 v8 z`} />
        <path d={`M${sx(xMin)} ${sy(yMax) - 18} l-4 8 h8 z`} />
      </g>
      {xTicks.map((x) => (
        <text key={`tx${x}`} x={sx(x)} y={sy(yMin) + 20} textAnchor="middle">
          {x}
        </text>
      ))}
      {yTicks.map((y) => (
        <text key={`ty${y}`} x={sx(xMin) - 8} y={sy(y) + 5} textAnchor="end">
          {y}
        </text>
      ))}
      <text x={sx(xMax) + 24} y={sy(yMin) + 5} fontStyle="italic">
        {figure.kind === "scatter" ? figure.xLabel : ""}
      </text>
      <text x={sx(xMin) - 4} y={sy(yMax) - 22} fontStyle="italic" textAnchor="middle">
        {figure.kind === "scatter" ? figure.yLabel : ""}
      </text>

      {figure.kind === "scatter" && figure.line && (
        <line
          x1={sx(figure.line[0][0])}
          y1={sy(figure.line[0][1])}
          x2={sx(figure.line[1][0])}
          y2={sy(figure.line[1][1])}
          stroke="#1e1e1e"
          strokeWidth="2"
        />
      )}
      {figure.kind === "line" && (
        <polyline
          points={figure.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")}
          fill="none"
          stroke="#1e1e1e"
          strokeWidth="2"
        />
      )}
      {figure.points.map(([x, y], i) => (
        <circle key={i} cx={sx(x)} cy={sy(y)} r="4" fill="#1e1e1e" />
      ))}

      {figure.kind === "line" && (
        <>
          <text x={(sx(xMin) + sx(xMax)) / 2} y={H - 2} textAnchor="middle" fontSize="14">
            {figure.xLabel}
          </text>
          <text
            transform={`translate(12 ${(sy(yMin) + sy(yMax)) / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="14"
          >
            {figure.yLabel}
          </text>
        </>
      )}
    </svg>
  );
}

function Bars({ figure }: { figure: BarFigure }) {
  const W = 380;
  const H = 300;
  const m = { l: 58, r: 16, t: 20, b: 58 };
  const [yMin, yMax] = figure.y;
  const sy = (v: number) => H - m.b - ((v - yMin) / (yMax - yMin)) * (H - m.t - m.b);
  const band = (W - m.l - m.r) / figure.bars.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" fontFamily={FONT} fontSize="14" role="img" aria-label="bar graph">
      {ticks(figure.y).map((y) => (
        <g key={y}>
          <line x1={m.l} x2={W - m.r} y1={sy(y)} y2={sy(y)} stroke="#1e1e1e" strokeWidth={y === yMin ? 1.4 : 0.6} opacity={y === yMin ? 1 : 0.5} />
          <text x={m.l - 8} y={sy(y) + 5} textAnchor="end">
            {y}
          </text>
        </g>
      ))}
      <line x1={m.l} x2={m.l} y1={sy(yMin)} y2={sy(yMax)} stroke="#1e1e1e" strokeWidth="1.4" />
      {figure.bars.map((bar, i) => {
        const x = m.l + i * band + band * 0.2;
        return (
          <g key={bar.label}>
            <rect x={x} y={sy(bar.value)} width={band * 0.6} height={sy(yMin) - sy(bar.value)} fill="#6b6b6b" stroke="#1e1e1e" />
            <text x={x + band * 0.3} y={sy(bar.value) - 6} textAnchor="middle" fontSize="13">
              {bar.value}
            </text>
            <text x={x + band * 0.3} y={sy(yMin) + 18} textAnchor="middle" fontSize="12.5">
              {bar.label}
            </text>
          </g>
        );
      })}
      {figure.xLabel && (
        <text x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle">
          {figure.xLabel}
        </text>
      )}
      <text transform={`translate(16 ${(sy(yMin) + sy(yMax)) / 2}) rotate(-90)`} textAnchor="middle">
        {figure.yLabel}
      </text>
    </svg>
  );
}
