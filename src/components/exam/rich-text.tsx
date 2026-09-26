import katex from "katex";
import "katex/dist/katex.min.css";
import { Fragment, memo, type ReactNode } from "react";
import { assetUrl } from "@/lib/exam/assets";
import type { RichText as RichTextValue, StimulusBlock } from "@/lib/exam/types";
import { cn } from "@/lib/utils";
import { Figure } from "./figures";

type Token =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean }
  | { kind: "bold" | "italic" | "underline"; children: Token[] }
  | { kind: "blank" }
  | { kind: "image"; id: string; width: number; height: number }
  | { kind: "flow"; id: string; width: number; height: number; pieces: number[][] };

const EMPHASIS = [
  ["**", "bold"],
  ["++", "underline"],
  ["*", "italic"],
] as const;

const katexCache = new Map<string, string>();

function renderMath(tex: string, display: boolean) {
  const key = `${display ? "D" : "I"}${tex}`;
  let html = katexCache.get(key);
  if (!html) {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: false, output: "html" });
    katexCache.set(key, html);
  }
  return html;
}

/**
 * Tokenizes the question-bank markup:
 *   $$display$$  $inline$  \$  **bold**  *italic*  ++underline++  ___
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) tokens.push({ kind: "text", value: buffer });
    buffer = "";
  };

  const readUntil = (marker: string, from: number) => {
    const end = input.indexOf(marker, from);
    return end === -1 ? null : end;
  };

  while (i < input.length) {
    const rest = input.slice(i);

    // Backslash escapes a markup character: \$ \* \+ \_ \\
    if (rest[0] === "\\" && rest.length > 1 && "$*+_\\".includes(rest[1])) {
      buffer += rest[1];
      i += 2;
      continue;
    }

    if (rest.startsWith("{{img:")) {
      const end = input.indexOf("}}", i);
      const [id, width, height] = (end === -1 ? "" : input.slice(i + 6, end)).split(":");
      if (id && Number(width) > 0 && Number(height) > 0) {
        flush();
        tokens.push({ kind: "image", id, width: Number(width), height: Number(height) });
        i = end + 2;
        continue;
      }
    }

    // {{flow:id:w:h:x,y,w,h;...}} - an image shown as word-sized pieces that wrap like text.
    if (rest.startsWith("{{flow:")) {
      const end = input.indexOf("}}", i);
      const [id, width, height, list] = (end === -1 ? "" : input.slice(i + 7, end)).split(":");
      const pieces = (list ?? "").split(";").map((p) => p.split(",").map(Number));
      if (id && Number(width) > 0 && pieces.every((p) => p.length === 4 && p.every(Number.isFinite))) {
        flush();
        tokens.push({ kind: "flow", id, width: Number(width), height: Number(height), pieces });
        i = end + 2;
        continue;
      }
    }

    if (rest.startsWith("$$")) {
      const end = readUntil("$$", i + 2);
      if (end !== null) {
        flush();
        tokens.push({ kind: "math", value: input.slice(i + 2, end), display: true });
        i = end + 2;
        continue;
      }
    }

    if (rest.startsWith("$")) {
      let end = i + 1;
      while (end < input.length && !(input[end] === "$" && input[end - 1] !== "\\")) end++;
      if (end < input.length) {
        flush();
        tokens.push({ kind: "math", value: input.slice(i + 1, end), display: false });
        i = end + 1;
        continue;
      }
    }

    if (rest.startsWith("___")) {
      flush();
      tokens.push({ kind: "blank" });
      i += 3;
      while (input[i] === "_") i++;
      continue;
    }

    let matched = false;
    for (const [marker, kind] of EMPHASIS) {
      if (!rest.startsWith(marker)) continue;
      const end = readUntil(marker, i + marker.length);
      if (end !== null && end > i + marker.length) {
        flush();
        tokens.push({ kind, children: tokenize(input.slice(i + marker.length, end)) });
        i = end + marker.length;
        matched = true;
      }
      break;
    }
    if (!matched) {
      buffer += input[i];
      i += 1;
    }
  }

  flush();
  return tokens;
}

function renderTokens(tokens: Token[]): ReactNode[] {
  return tokens.map((token, index) => {
    switch (token.kind) {
      case "text":
        return <Fragment key={index}>{token.value}</Fragment>;
      case "math":
        return (
          <span
            key={index}
            className={token.display ? "my-3 block text-center" : undefined}
            dangerouslySetInnerHTML={{ __html: renderMath(token.value, token.display) }}
          />
        );
      case "bold":
        return <strong key={index}>{renderTokens(token.children)}</strong>;
      case "italic":
        return <em key={index}>{renderTokens(token.children)}</em>;
      case "underline":
        return (
          <u key={index} className="underline decoration-1 underline-offset-[3px]">
            {renderTokens(token.children)}
          </u>
        );
      case "blank":
        return (
          <span key={index} aria-label="blank">
            ______
          </span>
        );
      case "image":
        return <QuestionImage key={index} id={token.id} width={token.width} height={token.height} />;
      case "flow":
        return <FlowImage key={index} {...token} />;
    }
  });
}

export const Rich = memo(function Rich({ text, className }: { text: RichTextValue; className?: string }) {
  return <span className={className}>{renderTokens(tokenize(text))}</span>;
});

export function StimulusBlocks({ blocks, className }: { blocks: StimulusBlock[]; className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      {blocks.map((block, index) => (
        <StimulusBlockView key={index} block={block} />
      ))}
    </div>
  );
}

/** A cropped image of an official question (equations, graphs, tables). */
export function QuestionImage({ id, width, height }: { id: string; width: number; height: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- served from our own asset route, sized exactly
    <img
      src={assetUrl(id)}
      width={width}
      height={height}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      className="question-image"
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  );
}

/** Drawn math cut into word-sized pieces of one image, wrapping like text. */
function FlowImage({ id, width, height, pieces }: { id: string; width: number; height: number; pieces: number[][] }) {
  const src = `url(${assetUrl(id)})`;
  return (
    <span className="question-flow">
      {pieces.map(([x, y, w, h], i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span
            className="inline-block align-middle"
            style={{
              width: w,
              height: h,
              backgroundImage: src,
              backgroundSize: `${width}px ${height}px`,
              backgroundPosition: `-${x}px -${y}px`,
            }}
          />
        </Fragment>
      ))}
    </span>
  );
}

function StimulusBlockView({ block }: { block: StimulusBlock }) {
  switch (block.type) {
    case "image":
      return <QuestionImage id={block.asset} width={block.width} height={block.height} />;
    case "text":
      return (
        <div>
          {block.title && <p className="mb-1 font-bold">{block.title}</p>}
          <p>
            <Rich text={block.text} />
          </p>
        </div>
      );
    case "list":
      return (
        <div>
          {block.intro && (
            <p className="mb-2">
              <Rich text={block.intro} />
            </p>
          )}
          <ul className="list-disc space-y-1.5 pl-7">
            {block.items.map((item, i) => (
              <li key={i}>
                <Rich text={item} />
              </li>
            ))}
          </ul>
        </div>
      );
    case "table":
      return (
        <figure className="overflow-x-auto">
          {block.title && (
            <figcaption className="mx-auto mb-2 max-w-[640px] text-center">
              <Rich text={block.title} />
            </figcaption>
          )}
          <table className="mx-auto border-collapse border border-bb-ink text-center">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="border border-bb-ink px-4 py-3 font-normal">
                    <Rich text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className={cn("border border-bb-ink px-4 py-3", c === 0 && "text-left")}>
                      <Rich text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.note && (
            <p className="mt-2">
              <Rich text={block.note} />
            </p>
          )}
        </figure>
      );
    case "figure":
      return <Figure figure={block.figure} caption={block.caption} />;
  }
}
