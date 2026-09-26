"use client";

import { Droplet, Trash2, Underline } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HighlightColor = "yellow" | "blue" | "pink";
export type Highlight = { id: string; start: number; end: number; color: HighlightColor; underline: boolean };

const COLORS: { color: HighlightColor; swatch: string; ring: string }[] = [
  { color: "yellow", swatch: "#fde68a", ring: "#e0b800" },
  { color: "blue", swatch: "#dbeafe", ring: "#93b4e8" },
  { color: "pink", swatch: "#fce7f3", ring: "#e7a4c8" },
];

/** Text nodes that count toward highlight offsets (math is skipped). */
function textNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(".katex") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

function pointToOffset(root: HTMLElement, node: Node, offset: number) {
  const nodes = textNodes(root);
  if (node.nodeType === Node.TEXT_NODE) {
    let total = 0;
    for (const t of nodes) {
      if (t === node) return total + offset;
      total += t.length;
    }
    return total;
  }
  // An element boundary: count every text node that ends before it.
  const boundary = document.createRange();
  boundary.setStart(node, offset);
  return nodes
    .filter((t) => boundary.comparePoint(t, t.length) < 0)
    .reduce((sum, t) => sum + t.length, 0);
}

function wrap(node: Text, from: number, to: number, h: Highlight) {
  const range = document.createRange();
  range.setStart(node, from);
  range.setEnd(node, to);
  const mark = document.createElement("mark");
  mark.dataset.hl = h.color;
  mark.dataset.id = h.id;
  mark.dataset.underline = String(h.underline);
  range.surroundContents(mark);
}

/** Wraps each highlighted span of text in <mark>, one text node at a time. */
function applyHighlights(root: HTMLElement, highlights: Highlight[]) {
  for (const h of highlights) {
    for (let guard = 0; guard < 200; guard++) {
      let pos = 0;
      let wrapped = false;
      for (const node of textNodes(root)) {
        const nodeStart = pos;
        pos += node.length;
        if (pos <= h.start || nodeStart >= h.end) continue;
        if (node.parentElement?.closest("mark[data-id]")) continue;
        const from = Math.max(h.start - nodeStart, 0);
        const to = Math.min(h.end - nodeStart, node.length);
        if (to <= from) continue;
        wrap(node, from, to, h);
        wrapped = true;
        break;
      }
      if (!wrapped) break;
    }
  }
}

type Toolbar = { x: number; y: number; start: number; end: number; activeId?: string };

export function Highlightable({
  highlights,
  onChange,
  enabled = true,
  className,
  children,
}: {
  highlights: Highlight[];
  onChange: (next: Highlight[]) => void;
  enabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<Toolbar | null>(null);
  const signature = highlights.map((h) => `${h.id}:${h.start}-${h.end}:${h.color}:${h.underline}`).join("|");

  useLayoutEffect(() => {
    if (ref.current) applyHighlights(ref.current, highlights);
    // Highlights are applied to a freshly mounted subtree (see `key` below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const root = ref.current;
      if (!enabled || !root) return;

      const markEl = (e.target as HTMLElement).closest("mark[data-id]") as HTMLElement | null;
      const selection = window.getSelection();

      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!root.contains(range.commonAncestorContainer)) return;
        const start = pointToOffset(root, range.startContainer, range.startOffset);
        const end = pointToOffset(root, range.endContainer, range.endOffset);
        if (end - start < 1) return;
        const rect = range.getBoundingClientRect();
        setToolbar({ x: rect.left + rect.width / 2, y: rect.top, start, end });
        return;
      }

      if (markEl) {
        const h = highlights.find((x) => x.id === markEl.dataset.id);
        if (!h) return;
        const rect = markEl.getBoundingClientRect();
        setToolbar({ x: rect.left + rect.width / 2, y: rect.top, start: h.start, end: h.end, activeId: h.id });
        return;
      }

      setToolbar(null);
    },
    [enabled, highlights],
  );

  const addOrUpdate = (patch: Partial<Highlight>) => {
    if (!toolbar) return;
    const existing = toolbar.activeId ? highlights.find((h) => h.id === toolbar.activeId) : undefined;
    const base: Highlight = existing ?? {
      id: crypto.randomUUID(),
      start: toolbar.start,
      end: toolbar.end,
      color: "yellow",
      underline: false,
    };
    const next = { ...base, ...patch };
    const others = highlights.filter((h) => h.id !== base.id && (h.end <= next.start || h.start >= next.end));
    onChange([...others, next]);
    setToolbar({ ...toolbar, activeId: next.id });
    window.getSelection()?.removeAllRanges();
  };

  const remove = () => {
    if (!toolbar) return;
    onChange(highlights.filter((h) => h.id !== toolbar.activeId && (h.end <= toolbar.start || h.start >= toolbar.end)));
    setToolbar(null);
    window.getSelection()?.removeAllRanges();
  };

  const active = toolbar?.activeId ? highlights.find((h) => h.id === toolbar.activeId) : undefined;

  return (
    <div className={cn("relative", enabled && "select-text", className)} onMouseUp={onMouseUp}>
      <div ref={ref} key={signature}>
        {children}
      </div>

      {toolbar && (
        <div
          className="fixed z-[70] flex -translate-x-1/2 -translate-y-[calc(100%+10px)] items-center gap-2 rounded-full bg-white px-2.5 py-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.22)]"
          style={{ left: toolbar.x, top: toolbar.y }}
          onMouseUp={(e) => e.stopPropagation()}
        >
          {COLORS.map(({ color, swatch, ring }) => (
            <button
              key={color}
              type="button"
              aria-label={`Highlight ${color}`}
              onClick={() => addOrUpdate({ color, underline: false })}
              className="grid size-8 place-items-center rounded-full border-2"
              style={{ background: swatch, borderColor: active?.color === color && !active.underline ? "#1e1e1e" : ring }}
            >
              {color === "yellow" && <Droplet className="size-3.5" />}
            </button>
          ))}
          <button
            type="button"
            aria-label="Underline"
            onClick={() => addOrUpdate({ underline: !active?.underline })}
            className={cn("grid size-8 place-items-center rounded-full hover:bg-black/5", active?.underline && "bg-black/10")}
          >
            <Underline className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Delete highlight"
            onClick={remove}
            className="grid size-8 place-items-center rounded-full border border-[#1e1e1e] hover:bg-black/5"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
