"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Subject } from "@/lib/exam/types";

/** Validated categorical order (see dataviz check): R&W teal, Math violet. */
export const SUBJECT_COLOR: Record<Subject, string> = {
  english: "#14b8a6",
  math: "#7b6cff",
};
export const SUBJECT_LABEL: Record<Subject, string> = {
  english: "Reading and Writing",
  math: "Math",
};

const INK = "#11132a";
const MUTED = "#6b7089";
const GRID = "#ebebf3";
const NEUTRAL = "#d5d6e2";
const AXIS_TICK = { fill: MUTED, fontSize: "0.75rem" };

/** Chart area sized in rem (from a px height at the default text size), so charts grow with the page. */
function ChartBox({ height, grow, children }: { height: number; grow?: boolean; children: React.ReactElement }) {
  return (
    <div className={grow ? "min-h-0 flex-1" : undefined} style={grow ? { minHeight: `${height / 16}rem` } : { height: `${height / 16}rem` }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function TooltipCard({ title, rows }: { title?: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-[0_8px_24px_-8px_rgba(17,19,42,0.25)]">
      {title && <p className="mb-1 font-semibold text-ink">{title}</p>}
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-ink-2">
          {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}
          <span>{r.label}</span>
          <span className="ml-auto pl-3 font-semibold text-ink tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export type DomainDatum = { domain: string; subject: Subject; correct: number; total: number };

/** Accuracy by domain, one horizontal bar each, colored by section. */
export function DomainBars({ data }: { data: DomainDatum[] }) {
  const rows = data.map((d) => ({ ...d, pct: d.total ? Math.round((d.correct / d.total) * 100) : 0 }));
  const subjects = [...new Set(rows.map((r) => r.subject))];
  return (
    <div>
      {subjects.length > 1 && (
        <div className="mb-3">
          <Legend items={subjects.map((s) => ({ label: SUBJECT_LABEL[s], color: SUBJECT_COLOR[s] }))} />
        </div>
      )}
      <ChartBox height={Math.max(160, rows.length * 44)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }} barCategoryGap={12}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="domain" width={190} tick={{ ...AXIS_TICK, fill: INK }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(108,92,231,0.06)" }}
            content={({ active, payload }) => {
              const d = active && payload?.[0]?.payload;
              if (!d) return null;
              return (
                <TooltipCard
                  title={d.domain}
                  rows={[
                    { label: "Accuracy", value: `${d.pct}%`, color: SUBJECT_COLOR[d.subject as Subject] },
                    { label: "Correct", value: `${d.correct} of ${d.total}` },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {rows.map((r) => (
              <Cell key={r.domain} fill={SUBJECT_COLOR[r.subject]} />
            ))}
            <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} style={{ fill: INK, fontSize: "0.75rem", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ChartBox>
    </div>
  );
}

/** Skill profile as a radar (single series). */
export function SkillRadar({ data, color = "#6c5ce7" }: { data: DomainDatum[]; color?: string }) {
  const rows = data.map((d) => ({
    domain: d.domain.replace("Problem-Solving and Data Analysis", "Data Analysis").replace("Standard English Conventions", "Conventions").replace("Geometry and Trigonometry", "Geometry"),
    pct: d.total ? Math.round((d.correct / d.total) * 100) : 0,
    correct: d.correct,
    total: d.total,
  }));
  return (
    <ChartBox height={280}>
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="domain" tick={{ fill: INK, fontSize: "0.72rem" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip
          content={({ active, payload }) => {
            const d = active && payload?.[0]?.payload;
            if (!d) return null;
            return <TooltipCard title={d.domain} rows={[{ label: "Accuracy", value: `${d.pct}% (${d.correct}/${d.total})`, color }]} />;
          }}
        />
        <Radar dataKey="pct" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.12} dot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }} />
      </RadarChart>
    </ChartBox>
  );
}

export type DifficultyDatum = { level: string; correct: number; total: number };

export function DifficultyColumns({ data }: { data: DifficultyDatum[] }) {
  const rows = data.map((d) => ({ ...d, pct: d.total ? Math.round((d.correct / d.total) * 100) : 0 }));
  return (
    <ChartBox height={220}>
      <BarChart data={rows} margin={{ top: 22, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="level" tick={{ ...AXIS_TICK, fill: INK }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(108,92,231,0.06)" }}
          content={({ active, payload }) => {
            const d = active && payload?.[0]?.payload;
            if (!d) return null;
            return <TooltipCard title={d.level} rows={[{ label: "Correct", value: `${d.correct} of ${d.total} (${d.pct}%)`, color: "#6c5ce7" }]} />;
          }}
        />
        <Bar dataKey="pct" fill="#6c5ce7" radius={[4, 4, 0, 0]} maxBarSize={24}>
          <LabelList dataKey="pct" position="top" formatter={(v) => `${v}%`} style={{ fill: INK, fontSize: "0.75rem", fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ChartBox>
  );
}

export type TimingDatum = { label: string; seconds: number; correct: boolean; subject: Subject };

/** Seconds spent per question; correct answers in the section color, others neutral. */
export function TimingBars({ data }: { data: TimingDatum[] }) {
  const subjects = [...new Set(data.map((d) => d.subject))];
  return (
    <div>
      <div className="mb-3">
        <Legend
          items={[
            ...subjects.map((s) => ({
              label: subjects.length > 1 ? `Correct · ${SUBJECT_LABEL[s]}` : "Correct",
              color: SUBJECT_COLOR[s],
            })),
            { label: "Incorrect or skipped", color: NEUTRAL },
          ]}
        />
      </div>
      <ChartBox height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}s`} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(108,92,231,0.06)" }}
            content={({ active, payload }) => {
              const d = active && payload?.[0]?.payload;
              if (!d) return null;
              return (
                <TooltipCard
                  title={`Question ${d.label}`}
                  rows={[
                    { label: "Time", value: `${d.seconds}s` },
                    {
                      label: "Result",
                      value: d.correct ? "Correct" : "Incorrect",
                      color: d.correct ? SUBJECT_COLOR[d.subject as Subject] : NEUTRAL,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="seconds" radius={[4, 4, 0, 0]} maxBarSize={18}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.correct ? SUBJECT_COLOR[d.subject] : NEUTRAL} />
            ))}
          </Bar>
        </BarChart>
      </ChartBox>
    </div>
  );
}

export type TrendDatum = { label: string; english: number | null; math: number | null };

/** Section scores (200–800) over time: one shared axis, two series. */
export function ScoreTrend({ data }: { data: TrendDatum[] }) {
  const hasEnglish = data.some((d) => d.english !== null);
  const hasMath = data.some((d) => d.math !== null);
  const series = [
    ...(hasEnglish ? [{ key: "english" as const, label: "Reading and Writing", color: SUBJECT_COLOR.english }] : []),
    ...(hasMath ? [{ key: "math" as const, label: "Math", color: SUBJECT_COLOR.math }] : []),
  ];
  return (
    <div className="flex h-full flex-col">
      {series.length > 1 && (
        <div className="mb-3">
          <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
        </div>
      )}
      <ChartBox height={250} grow>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis domain={[200, 800]} ticks={[200, 400, 600, 800]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ stroke: NEUTRAL, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <TooltipCard
                  title={String(label)}
                  rows={payload
                    .filter((p) => p.value !== null && p.value !== undefined)
                    .map((p) => ({
                      label: p.dataKey === "english" ? "Reading and Writing" : "Math",
                      value: String(p.value),
                      color: p.dataKey === "english" ? SUBJECT_COLOR.english : SUBJECT_COLOR.math,
                    }))}
                />
              );
            }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              connectNulls
              dot={{ r: 4, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ChartBox>
    </div>
  );
}

/** Tiny single-series trend for stat tiles (no axes). */
export function Sparkline({ values, color = "#6c5ce7" }: { values: number[]; color?: string }) {
  if (values.length < 2) return <div className="h-10" />;
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ChartBox height={40}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartBox>
  );
}
