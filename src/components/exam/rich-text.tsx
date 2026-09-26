import katex from "katex";
import { Fragment, memo, type ReactNode } from "react";
import type { RichText as RichTextValue, StimulusBlock } from "@/lib/exam/types";
import { cn } from "@/lib/utils";
import { Figure } from "./figures";

type Token =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean }
  | { kind: "bold" | "italic" | "underline"; children: Token[] }
  | { kind: "blank" };

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

    if (rest.startsWith("\\$")) {
      buffer += "$";
      i += 2;
      continue;
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

function StimulusBlockView({ block }: { block: StimulusBlock }) {
  switch (block.type) {
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
