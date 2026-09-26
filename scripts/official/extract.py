"""
Builds the private official question set from the PDFs in SATBOOKS/ and
QUESTIONS BANK/ (both git-ignored).

    python3 scripts/official/extract.py

Writes content/official/official.json and content/official/assets/*.png
(both git-ignored). Push them to Supabase with `npm run seed:official`.

Reading and Writing questions are extracted as text (so they can be
highlighted), with tables and graphs cropped as images. Math questions are
cropped as images because their equations and graphs are drawn as vector
shapes rather than text.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
BOOKS = ROOT / "SATBOOKS"
BANK = ROOT / "QUESTIONS BANK"
OUT = ROOT / "content" / "official"
ASSETS = OUT / "assets"

BOOK_TESTS = [4, 5, 6, 7, 8, 10, 11]

# CSS pixels per PDF point, chosen so printed text matches the size of the test interface's own text.
BOOK_SCALE = 1.85
BANK_SCALE = 1.9
# Images are stored at twice their CSS size so they stay sharp on retina screens.
DEVICE_RATIO = 2

LETTERS = "ABCD"

warnings: list[str] = []


def warn(message: str) -> None:
    warnings.append(message)


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------


class AssetStore:
    def __init__(self) -> None:
        ASSETS.mkdir(parents=True, exist_ok=True)
        self.ids: set[str] = set()

    def crop(self, page: fitz.Page, rect: fitz.Rect, scale: float) -> dict:
        zoom = scale * DEVICE_RATIO
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=rect, colorspace=fitz.csGRAY, alpha=False)
        data = pix.tobytes("png")
        asset_id = hashlib.sha256(data).hexdigest()[:24]
        if asset_id not in self.ids:
            (ASSETS / f"{asset_id}.png").write_bytes(data)
            self.ids.add(asset_id)
        return {"id": asset_id, "w": round(rect.width * scale), "h": round(rect.height * scale)}


def image_token(asset: dict) -> str:
    return f"{{{{img:{asset['id']}:{asset['w']}:{asset['h']}}}}}"


def image_block(asset: dict) -> dict:
    return {"type": "image", "asset": asset["id"], "width": asset["w"], "height": asset["h"]}


# ---------------------------------------------------------------------------
# Page geometry helpers
# ---------------------------------------------------------------------------


@dataclass
class Span:
    text: str
    bbox: fitz.Rect
    italic: bool
    bold: bool


@dataclass
class Line:
    bbox: fitz.Rect
    spans: list[Span]

    @property
    def text(self) -> str:
        return "".join(s.text for s in self.spans)


def lines_in(page: fitz.Page, clip: fitz.Rect) -> list[Line]:
    out: list[Line] = []
    data = page.get_text("dict", clip=clip)
    for block in data["blocks"]:
        for line in block.get("lines", []):
            spans = []
            for s in line["spans"]:
                if not s["text"]:
                    continue
                font = s["font"].lower()
                spans.append(
                    Span(
                        text=s["text"],
                        bbox=fitz.Rect(s["bbox"]),
                        italic=bool(s["flags"] & 2) or "italic" in font or "-it" in font,
                        bold=bool(s["flags"] & 16) or "bold" in font or "semibold" in font,
                    )
                )
            if spans and "".join(s.text for s in spans).strip():
                out.append(Line(bbox=fitz.Rect(line["bbox"]), spans=spans))
    # Merge fragments that sit on the same line (PDFs often split lines into
    # pieces, and taller glyphs like parentheses shift a fragment's top).
    out.sort(key=lambda l: ((l.bbox.y0 + l.bbox.y1) / 2, l.bbox.x0))
    rows: list[list[Line]] = []
    for line in out:
        mid = (line.bbox.y0 + line.bbox.y1) / 2
        row = rows[-1] if rows else None
        if row:
            ref = row[0].bbox
            ref_mid = (ref.y0 + ref.y1) / 2
            if abs(mid - ref_mid) < max(3.0, min(ref.height, line.bbox.height) * 0.45):
                row.append(line)
                continue
        rows.append([line])
    merged: list[Line] = []
    for row in rows:
        row.sort(key=lambda l: l.bbox.x0)
        spans: list[Span] = []
        box = fitz.Rect(row[0].bbox)
        for i, frag in enumerate(row):
            if i:
                prev = row[i - 1]
                gap = frag.bbox.x0 - prev.bbox.x1
                if gap > 1.5 and spans[-1].text[-1:] != " " and frag.spans[0].text[:1] != " ":
                    spans.append(Span(" ", fitz.Rect(prev.bbox.x1, prev.bbox.y0, frag.bbox.x0, prev.bbox.y1), False, False))
            spans.extend(frag.spans)
            box |= frag.bbox
        merged.append(Line(bbox=box, spans=spans))
    return merged


def drawings_in(page: fitz.Page, clip: fitz.Rect, ignore: list[fitz.Rect] = ()) -> list[fitz.Rect]:
    rects = []
    for d in page.get_drawings():
        r = fitz.Rect(d["rect"])
        if r.is_empty and (r.width < 0.5 and r.height < 0.5):
            continue
        if not clip.intersects(r):
            continue
        if any(i.contains(r) for i in ignore):
            continue
        rects.append(r & clip)
    for img in page.get_images(full=True):
        try:
            r = page.get_image_bbox(img)
        except Exception:
            continue
        if clip.intersects(r):
            rects.append(r & clip)
    return rects


def content_box(lines: list[Line], drawings: list[fitz.Rect]) -> fitz.Rect | None:
    box = None
    for r in [l.bbox for l in lines] + drawings:
        box = fitz.Rect(r) if box is None else box | r
    return box


def pad(rect: fitz.Rect, amount: float, within: fitz.Rect) -> fitz.Rect:
    return fitz.Rect(rect.x0 - amount, rect.y0 - amount, rect.x1 + amount, rect.y1 + amount) & within


def cluster(rects: list[fitz.Rect], gap: float) -> list[fitz.Rect]:
    groups = [fitz.Rect(r) for r in rects]
    changed = True
    while changed:
        changed = False
        out: list[fitz.Rect] = []
        for r in groups:
            for o in out:
                if fitz.Rect(o.x0 - gap, o.y0 - gap, o.x1 + gap, o.y1 + gap).intersects(r):
                    o |= r
                    changed = True
                    break
            else:
                out.append(fitz.Rect(r))
        groups = out
    return groups


# ---------------------------------------------------------------------------
# Text assembly for Reading and Writing
# ---------------------------------------------------------------------------

ESCAPE = re.compile(r"([\\$*+_])")


def escape(text: str) -> str:
    return ESCAPE.sub(r"\\\1", text)


def line_markup(line: Line) -> str:
    parts: list[str] = []
    for span in line.spans:
        raw = span.text
        # Blanks are printed as runs of underscores.
        pieces = re.split(r"(_{3,})", raw)
        rendered = "".join("___" if re.fullmatch(r"_{3,}", p) else escape(p) for p in pieces)
        core = rendered.strip()
        if span.italic and core and not span.bold and "___" not in core:
            lead = rendered[: len(rendered) - len(rendered.lstrip())]
            trail = rendered[len(rendered.rstrip()) :]
            rendered = f"{lead}*{core}*{trail}"
        parts.append(rendered)
    text = "".join(parts)
    # Adjacent italic spans: "*a**b*" -> "*ab*"
    text = text.replace("**", "") if "\\*" not in text else text
    return re.sub(r"\s+", " ", text)


def join_lines(lines: list[Line]) -> str:
    out = ""
    for line in lines:
        piece = line_markup(line).strip()
        if not out:
            out = piece
        elif out.endswith("-") and not out.endswith(" -"):
            out += piece
        else:
            out += " " + piece
    return out.strip()


def paragraphs(lines: list[Line]) -> list[list[Line]]:
    """Groups consecutive lines into paragraphs using vertical gaps."""
    if not lines:
        return []
    heights = sorted(l.bbox.height for l in lines)
    typical = heights[len(heights) // 2] or 10
    groups: list[list[Line]] = [[lines[0]]]
    for prev, line in zip(lines, lines[1:]):
        gap = line.bbox.y0 - prev.bbox.y1
        if gap > typical * 0.55:
            groups.append([line])
        else:
            groups[-1].append(line)
    return groups


def is_bullet(line: Line) -> bool:
    return line.text.lstrip()[:1] in ("•", "●", "▪", "◦", "-") and len(line.text.strip()) > 2


PROMPT_START = re.compile(
    r"(Which choice|Which finding|Which quotation|Which statement|Which of the following|Based on the text|"
    r"According to the text|What does the text|As used in the text|The student wants|How would|What is the)"
)


def english_blocks(pieces: list[tuple[fitz.Page, list[Line], list[fitz.Rect]]], scale: float, store: AssetStore):
    """Turns the lines and figures of a Reading and Writing stem into stimulus
    blocks plus the question prompt (the final paragraph). A stem can run over
    several pieces (e.g. continue in the next column)."""
    items: list[tuple[tuple[int, float], str, object, fitz.Page]] = []
    for pi, (page, lines, figures) in enumerate(pieces):
        groups = paragraphs(lines)
        # A paragraph cut off at the bottom of a column continues in the next piece.
        if groups and items:
            last = next((it for it in reversed(items) if it[1] == "para"), None)
            if last is not None and last is items[-1]:
                tail = join_lines(last[2][-1:]).rstrip("*")
                if not re.search(r"[.?!:\"”]$", tail):
                    last[2].extend(groups.pop(0))
        for group in groups:
            items.append(((pi, group[0].bbox.y0), "para", group, page))
        for fig in figures:
            items.append(((pi, fig.y0), "figure", fig, page))
        items.sort(key=lambda x: x[0])

    # The question sentence normally has its own paragraph; when the spacing
    # doesn't separate it, split the last paragraph at the line where it starts.
    if items and items[-1][1] == "para":
        key, _, group, page = items[-1]
        for i, line in enumerate(group[1:], 1):
            if PROMPT_START.match(line.text.strip()):
                items[-1] = (key, "para", group[:i], page)
                items.append(((key[0], line.bbox.y0), "para", group[i:], page))
                break

    prompt = ""
    prompt_pos = None
    if items and items[-1][1] == "para":
        prompt_pos = items[-1][0]
        prompt = join_lines(items.pop()[2])

    # With a table or graph, show everything above the prompt exactly as
    # printed so the figure and its labels stay intact.
    if any(kind == "figure" for _, kind, _, _ in items):
        blocks = []
        for pi, (page, lines, figures) in enumerate(pieces):
            rects = [l.bbox for l in lines] + figures
            if prompt_pos is not None and pi == prompt_pos[0]:
                rects = [r for r in rects if r.y1 <= prompt_pos[1] + 1]
            elif prompt_pos is not None and pi > prompt_pos[0]:
                rects = []
            box = None
            for r in rects:
                box = fitz.Rect(r) if box is None else box | r
            if box is not None:
                blocks.append(image_block(store.crop(page, pad(box, 3, page.rect), scale)))
        return blocks, prompt

    blocks: list[dict] = []
    pending_title: str | None = None
    for _, kind, value, page in items:
        if kind == "figure":
            blocks.append(image_block(store.crop(page, pad(value, 3, page.rect), scale)))
            continue
        group: list[Line] = value
        text = join_lines(group)
        plain = re.sub(r"[*\\]", "", text).strip()
        if len(group) == 1 and re.fullmatch(r"Text \d", plain):
            pending_title = plain
            continue
        bullets = [l for l in group if is_bullet(l)]
        if bullets:
            first_bullet = group.index(bullets[0])
            intro = join_lines(group[:first_bullet]) if first_bullet else None
            items_text: list[list[Line]] = []
            for l in group[first_bullet:]:
                if is_bullet(l):
                    items_text.append([l])
                else:
                    items_text[-1].append(l)
            cleaned = [re.sub(r"^[•●▪◦\-]\s*", "", join_lines(it)) for it in items_text]
            if blocks and blocks[-1]["type"] == "list" and not intro:
                blocks[-1]["items"].extend(cleaned)
                continue
            block = {"type": "list", "items": cleaned}
            if intro:
                block["intro"] = intro
            elif blocks and blocks[-1]["type"] == "text" and blocks[-1]["text"].endswith(":"):
                block["intro"] = blocks.pop()["text"]
            blocks.append(block)
            continue
        block = {"type": "text", "text": text}
        if pending_title:
            block["title"] = pending_title
            pending_title = None
        blocks.append(block)
    return blocks, prompt


def mark_blanks(page: fitz.Page, lines: list[Line]) -> None:
    """The books print each blank with the hidden replacement text "blank"."""
    for line in lines:
        for span in line.spans:
            span.text = re.sub(r"(?<=[a-z])blank\b", " _____", span.text)
            span.text = re.sub(r"\bblank\b", "_____", span.text)


def max_gap(line: Line) -> float:
    spans = [sp for sp in line.spans if sp.text.strip()]
    return max((b.bbox.x0 - a.bbox.x1 for a, b in zip(spans, spans[1:])), default=0.0)


def figure_regions(page: fitz.Page, clip: fitz.Rect, lines: list[Line], ignore: list[fitz.Rect]):
    """Finds tables and graphs (vector drawings) and the text lines that belong
    to them (titles, headers, cells, labels, legends)."""
    drawn = [r for r in drawings_in(page, clip, ignore) if r.width > 2 or r.height > 2]
    # Short horizontal rules under a word are underlines or blanks, not figures.
    drawn = [r for r in drawn if not (r.height < 2 and r.width < 120)]
    figures = [f for f in cluster(drawn, 16) if f.width > 40 and f.height > 12]
    inside: set[int] = set()
    width = clip.width
    changed = True
    while changed:
        changed = False
        for fig in figures:
            for i, line in enumerate(lines):
                if i in inside:
                    continue
                c = fitz.Point((line.bbox.x0 + line.bbox.x1) / 2, (line.bbox.y0 + line.bbox.y1) / 2)
                within = pad(fig, 4, clip).contains(c)
                near = -2 <= fig.y0 - line.bbox.y1 <= 12 or -2 <= line.bbox.y0 - fig.y1 <= 12
                tabular = max_gap(line) >= 8 or line.bbox.width < width * 0.8
                if within or (near and tabular):
                    inside.add(i)
                    fig |= line.bbox
                    changed = True
    figures = [f for f in figures if f.height > 25]
    return figures, [l for i, l in enumerate(lines) if i not in inside]


# ---------------------------------------------------------------------------
# Classification (the practice books don't label domains)
# ---------------------------------------------------------------------------

RW_SKILLS = [
    (r"most logical and precise word or phrase|as used in the text, what does the word", "Craft and Structure", "Words in Context"),
    (r"main purpose|overall structure|best describes the function|functions? of the underlined", "Craft and Structure", "Text Structure and Purpose"),
    (r"text 2 would most likely respond|based on the texts|both texts|author of text 2", "Craft and Structure", "Cross-Text Connections"),
    (r"data from the (graph|table|chart)|uses data from|information from the (graph|table)", "Information and Ideas", "Command of Evidence (Quantitative)"),
    (r"conventions of standard english", "Standard English Conventions", "Boundaries"),
    (r"most logical transition", "Expression of Ideas", "Transitions"),
    (r"relevant information from the notes|most effectively uses", "Expression of Ideas", "Rhetorical Synthesis"),
    (r"quotation|most directly support|most directly (undermine|weaken|challenge)|would most strongly support", "Information and Ideas", "Command of Evidence (Textual)"),
    (r"most logically completes the text", "Information and Ideas", "Inferences"),
    (r"main idea|best states the main|according to the text|based on the text", "Information and Ideas", "Central Ideas and Details"),
]


def classify_rw(prompt: str, choices: list[str]) -> tuple[str, str]:
    p = re.sub(r"[*\\]", "", prompt).lower()
    for pattern, domain, skill in RW_SKILLS:
        if re.search(pattern, p):
            if skill == "Boundaries":
                # Choices that differ only in punctuation test boundaries;
                # otherwise the question is about form, structure and sense.
                words = {re.sub(r"[^a-z ]", "", c.lower()).split().__str__() for c in choices}
                if len(words) > 1:
                    return domain, "Form, Structure, and Sense"
            return domain, skill
    return "Information and Ideas", "Central Ideas and Details"


MATH_RULES = [
    ("Geometry and Trigonometry", r"\b(triangles?|circles?|radius|diameter|angles?|degrees|perimeter|rectangles?|rectangular|squares? (?:has|with|is)|polygon|cubes?|cylinders?|spheres?|cones?|volume|area|sin|cos|tan|radians?|arcs?|chords?|hypotenuse|parallelogram|trapezoid|prism|pyramid|congruent|similar triangles|circumference|isosceles|equilateral|vertices of)\b|°|∠|△"),
    ("Problem-Solving and Data Analysis", r"\b(percent|probability|mean|median|mode|standard deviation|survey|sample|margin of error|scatterplot|data|table shows|ratio|rate|proportion|histogram|dot plot|frequency|population|estimate|miles|kilometers|dollars|per hour|per minute|density)\b|%|\$"),
    ("Advanced Math", r"\b(quadratic|exponential|polynomial|parabola|vertex|zeros?|roots?|function [fghpqrst]\b|nonlinear|factor|asymptote|squared)\b|[²³√]|\^|[fghpq]\(x\) ?=.*x ?\d"),
]


def classify_math(text: str) -> tuple[str, str]:
    t = text.lower()
    for domain, pattern in MATH_RULES:
        if re.search(pattern, t):
            return domain, domain
    return "Algebra", "Algebra"


# ---------------------------------------------------------------------------
# Student-produced responses
# ---------------------------------------------------------------------------


def numeric(value: str) -> float | None:
    v = value.strip().replace("−", "-")
    try:
        if "/" in v:
            n, d = v.split("/")
            return float(n) / float(d)
        return float(v)
    except (ValueError, ZeroDivisionError):
        return None


def spr_answer(raw: str) -> dict:
    parts = [p.strip().replace("−", "-") for p in re.split(r"[;,]| or ", raw) if p.strip()]
    values: list[float] = []
    for p in parts:
        n = numeric(p)
        if n is None:
            continue
        if not any(abs(n - v) < 0.01 * max(1, abs(v)) for v in values):
            values.append(n)
    if not parts or not values:
        warn(f"Unparsed SPR answer {raw!r}")
    return {"value": values[0] if values else None, "values": values, "accepted": parts}


# ---------------------------------------------------------------------------
# Practice test books
# ---------------------------------------------------------------------------

BAR_FILL = (0.82, 0.826, 0.832)


def find_bars(page: fitz.Page) -> list[tuple[int, fitz.Rect]]:
    bars = []
    for d in page.get_drawings():
        fill = d.get("fill")
        r = fitz.Rect(d["rect"])
        if not fill or not (8 <= r.height <= 16 and 150 <= r.width <= 560):
            continue
        if any(abs(a - b) > 0.06 for a, b in zip(fill, BAR_FILL)):
            continue
        label = re.findall(r"\b\d{1,2}\b", page.get_textbox(fitz.Rect(r.x0, r.y0 - 1, r.x0 + 40, r.y1 + 1)))
        if len(label) == 1:
            bars.append((int(label[0]), r))
    return bars


def page_bottom(page: fitz.Page) -> float:
    for block in page.get_text("blocks"):
        if "Unauthorized copying" in block[4]:
            return block[1] - 4
    return page.rect.height - 48


def full_size_pages(doc: fitz.Document, marker: str) -> list[fitz.Page]:
    """Pages containing `marker`, last first. The guide's opening pages show
    small thumbnails of the worksheets with the same headings but a sample
    key, so the real, full-size worksheets are the later pages."""
    return [page for page in reversed(list(doc)) if marker in page.get_text()]


def parse_answer_key(n: int) -> list[list[str]]:
    doc = fitz.open(BOOKS / f"scoring-sat-practice-test-{n}-digital.pdf")
    for page in full_size_pages(doc, "Answer Key"):
        text = page.get_text()
        modules: list[list[str]] = []
        chunks = re.split(r"MARK YOUR\s*\n\s*CORRECT\s*\n\s*ANSWERS\s*\n", text)[1:]
        for chunk in chunks:
            answers: list[str] = []
            pending: int | None = None
            for raw in chunk.split("\n"):
                line = raw.strip()
                if not line:
                    continue
                m = re.match(r"^(\d+)\s+(.+)$", line)
                if pending is None and m and int(m.group(1)) == len(answers) + 1:
                    answers.append(m.group(2).strip())
                elif pending is None and line.isdigit() and int(line) == len(answers) + 1:
                    pending = int(line)
                elif pending is not None:
                    answers.append(line)
                    pending = None
                else:
                    break
            modules.append(answers)
        return modules
    raise RuntimeError(f"No answer key in scoring guide {n}")


def parse_score_table(n: int) -> dict:
    doc = fitz.open(BOOKS / f"scoring-sat-practice-test-{n}-digital.pdf")
    for page in full_size_pages(doc, "(# OF CORRECT ANSWERS)"):
        text = page.get_text()
        if "(# OF CORRECT ANSWERS)" not in text:
            continue
        body = text.split("(# OF CORRECT ANSWERS)", 1)[1]
        nums = [int(x) for x in re.findall(r"^\s*(\d+)\s*$", body, flags=re.M)]
        english: list[list[int]] = []
        math: list[list[int]] = []
        i = 0
        raw = 0
        while i < len(nums) and raw <= 66:
            if nums[i] != raw:
                i += 1
                continue
            if raw <= 54:
                if i + 4 >= len(nums):
                    break
                english.append(nums[i + 1 : i + 3])
                math.append(nums[i + 3 : i + 5])
                i += 5
            else:
                english.append(nums[i + 1 : i + 3])
                i += 3
            raw += 1
        if len(english) != 67 or len(math) != 55:
            raise RuntimeError(f"Score table {n}: got {len(english)} R&W and {len(math)} Math rows")
        return {"english": english, "math": math}
    raise RuntimeError(f"No score table in scoring guide {n}")


@dataclass
class Segment:
    page: fitz.Page
    rect: fitz.Rect
    lines: list[Line] = field(default_factory=list)
    drawn: list[fitz.Rect] = field(default_factory=list)


@dataclass
class BookQuestion:
    number: int
    segments: list[Segment]
    wide: bool = False


COLUMN_WIDTH = 252.0
COLUMN_GAP = 278.4
CONTENT_TOP = 110


def page_columns(page: fitz.Page, bars: list[tuple[int, fitz.Rect]]) -> list[fitz.Rect]:
    bottom = page_bottom(page)
    left = None
    for _, b in bars:
        left = b.x0 if b.x0 < 300 else b.x0 - COLUMN_GAP
        break
    if left is None:
        xs = [l.bbox.x0 for l in lines_in(page, fitz.Rect(0, CONTENT_TOP, page.rect.width, bottom)) if l.bbox.x0 < 300]
        left = 36 if (min(xs) if xs else 36) < 50 else 54
    return [
        fitz.Rect(left, CONTENT_TOP, left + COLUMN_WIDTH, bottom),
        fitz.Rect(left + COLUMN_GAP, CONTENT_TOP, left + COLUMN_GAP + COLUMN_WIDTH, bottom),
    ]


def book_questions(n: int) -> list[list[BookQuestion]]:
    doc = fitz.open(BOOKS / f"sat-practice-test-{n}-digital.pdf")
    ordered: list[BookQuestion] = []
    started = False
    for page in doc:
        bars = find_bars(page)
        if not bars and not started:
            continue
        if bars:
            started = True
        text = page.get_text()
        if not bars and ("STOP" in text or "Test begins" in text or len(text.strip()) < 40):
            continue
        cols = page_columns(page, bars)
        wide = [(num, b) for num, b in bars if b.width > 300]
        full_width_continuation = False
        for ci, col in enumerate(cols):
            col_bars = sorted(
                ((num, b) for num, b in bars if (b.x0 < 300) == (ci == 0)), key=lambda nb: nb[1].y0
            )
            # Content above the first question in a column continues the previous question.
            first_top = col_bars[0][1].y0 - 3 if col_bars else col.y1
            if ordered and first_top - col.y0 > 20 and not (wide and ci == 1) and not full_width_continuation:
                area = fitz.Rect(col.x0, col.y0, col.x1, first_top)
                if ci == 0 and ordered[-1].wide:
                    # A wide question continues across the full page width.
                    right_bars = [b.y0 for num, b in bars if b.x0 >= 300]
                    bottom = min([first_top] + [y - 3 for y in right_bars])
                    area = fitz.Rect(cols[0].x0, col.y0, cols[1].x1, bottom)
                    full_width_continuation = True
                # Full-width text there (e.g. module directions) is not a continuation.
                band = page.get_text("dict", clip=fitz.Rect(cols[0].x0, area.y0, cols[1].x1, area.y1))["blocks"]
                crosses = any(
                    l["bbox"][0] < cols[0].x1 - 10 and l["bbox"][2] > cols[1].x0 + 10
                    for b in band
                    for l in b.get("lines", [])
                )
                if not crosses and (lines_in(page, area) or drawings_in(page, area)):
                    ordered[-1].segments.append(Segment(page, area))
            for i, (num, bar) in enumerate(col_bars):
                y1 = col_bars[i + 1][1].y0 - 3 if i + 1 < len(col_bars) else col.y1
                x1 = cols[1].x1 if bar.width > 300 else max(bar.x1, col.x1)
                ordered.append(BookQuestion(num, [Segment(page, fitz.Rect(bar.x0, bar.y1 + 1, x1, y1))], wide=bar.width > 300))
    # A new module starts whenever numbering restarts at 1.
    modules: list[list[BookQuestion]] = []
    for q in ordered:
        if q.number == 1 or not modules:
            modules.append([])
        modules[-1].append(q)
    for mod in modules:
        for q in mod:
            for seg in q.segments:
                # The end-of-module "STOP" box is not part of the last question.
                stop = [
                    r
                    for phrase in ("If you finish before time", "check your work on this module only", "Do not turn to any other module")
                    for r in seg.page.search_for(phrase, clip=seg.rect)
                ]
                if stop:
                    # Cut above the whole box: its "STOP" heading sits well above the text.
                    top = min(r.y0 for r in stop)
                    # search_for ignores case, so keep only the big "STOP" heading itself.
                    heading = [
                        r for r in seg.page.search_for("STOP")
                        if r.y1 <= top + 2 and top - r.y1 < 80 and "STOP" in seg.page.get_textbox(r + (-1, -1, 1, 1))
                    ]
                    box = [d for d in drawings_in(seg.page, seg.rect) if d.y0 < top < d.y1 and d.width > 60 and d.height < 160]
                    cut = min([top - 14] + [r.y0 - 6 for r in heading] + [d.y0 - 4 for d in box])
                    seg.rect.y1 = max(seg.rect.y0 + 1, cut)
                seg.lines = lines_in(seg.page, seg.rect)
                bar_rect = fitz.Rect(seg.rect.x0, seg.rect.y0 - 14, seg.rect.x1, seg.rect.y0)
                seg.drawn = drawings_in(seg.page, seg.rect, ignore=[bar_rect])
                mark_blanks(seg.page, seg.lines)
            q.segments = [seg for i, seg in enumerate(q.segments) if i == 0 or seg.lines or seg.drawn]
    return modules


def row_chars(page: fitz.Page, line: Line) -> list[tuple[str, tuple]]:
    """Characters of a line, excluding stray glyphs from neighbouring lines."""
    raw = page.get_text("rawdict", clip=fitz.Rect(line.bbox.x0 - 1, line.bbox.y0 - 0.5, line.bbox.x1 + 1, line.bbox.y1 + 0.5))
    chars = [(ch["c"], ch["bbox"]) for b in raw["blocks"] for l in b.get("lines", []) for sp in l["spans"] for ch in sp["chars"]]
    if not chars:
        return []
    mids = sorted((c[1][1] + c[1][3]) / 2 for c in chars if c[0].strip())
    mid = mids[len(mids) // 2] if mids else (line.bbox.y0 + line.bbox.y1) / 2
    row = [c for c in chars if abs((c[1][1] + c[1][3]) / 2 - mid) < 5]
    return sorted(row, key=lambda c: c[1][0])


def line_labels(page: fitz.Page, line: Line) -> list[tuple[str, float, float]]:
    """Choice labels ("A)" ... "D)") in a line with their x extent. Choices can
    sit side by side, e.g. four graphs in a 2x2 grid."""
    raw = page.get_text("rawdict", clip=fitz.Rect(line.bbox.x0 - 1, line.bbox.y0 - 0.5, line.bbox.x1 + 1, line.bbox.y1 + 0.5))
    chars = [(ch["c"], ch["bbox"]) for b in raw["blocks"] for l in b.get("lines", []) for sp in l["spans"] for ch in sp["chars"]]
    found = []
    for c, box in chars:
        if c not in LETTERS:
            continue
        cy = (box[1] + box[3]) / 2
        if not (line.bbox.y0 <= cy <= line.bbox.y1):
            continue
        close = [o for o in chars if o[0] == ")" and abs((o[1][1] + o[1][3]) / 2 - cy) < 2.5 and -1 <= o[1][0] - box[2] <= 2]
        if not close:
            continue
        before = [o for o in chars if o[0].strip() and abs((o[1][1] + o[1][3]) / 2 - cy) < 5 and o[1][2] <= box[0] + 0.5]
        if before and box[0] - max(o[1][2] for o in before) <= 3:
            continue
        found.append((c, box[0], close[0][1][2]))
    return sorted(found, key=lambda f: f[1])


@dataclass
class ChoiceSpot:
    si: int
    line: Line
    x0: float
    x1: float


def choice_spots(q: BookQuestion) -> dict[str, ChoiceSpot]:
    found: dict[str, ChoiceSpot] = {}
    for si, seg in enumerate(q.segments):
        for line in seg.lines:
            if not re.search(r"[A-D]\)", line.text):
                continue
            for letter, x0, x1 in line_labels(seg.page, line):
                if letter in found:
                    continue
                # A label starts the line, or sits mid-line in a grid of choices.
                if x0 < seg.rect.x0 + 24 or (found and any(abs(f.line.bbox.y0 - line.bbox.y0) < 3 for f in found.values())):
                    found[letter] = ChoiceSpot(si, line, x0, x1)
    if len(found) < 4:
        # Some books print the letters in a symbol font that extracts as "•";
        # the choices are then the last four such markers.
        marks: list[tuple[tuple[int, float, float], ChoiceSpot]] = []
        for si, seg in enumerate(q.segments):
            for line in seg.lines:
                if "•" not in line.text:
                    continue
                chars = row_chars(seg.page, line)
                for i, (c, box) in enumerate(chars):
                    if c == "•" and (i == 0 or box[0] - chars[i - 1][1][2] > 3 or chars[i - 1][0] == " "):
                        marks.append(((si, line.bbox.y0, box[0]), ChoiceSpot(si, line, box[0], box[2])))
        marks.sort(key=lambda m: (m[0][0], round(m[0][1]), m[0][2]))
        if len(marks) >= 4:
            found = {L: spot for L, (_, spot) in zip(LETTERS, marks[-4:])}
    return found


def label_end(page: fitz.Page, line: Line, marker: str) -> float:
    """x coordinate just after a choice label such as "A)"."""
    for letter, _, x1 in line_labels(page, line):
        if marker.startswith(letter):
            return x1
    return line.bbox.x0 + 14


def span_pieces(q: BookQuestion, start: tuple[int, float], end: tuple[int, float]) -> list[tuple[Segment, fitz.Rect]]:
    """Rectangles covering positions start..end, which may cross segments."""
    out = []
    for si in range(start[0], end[0] + 1):
        seg = q.segments[si]
        y0 = start[1] if si == start[0] else seg.rect.y0
        y1 = end[1] if si == end[0] else seg.rect.y1
        if y1 - y0 > 1:
            out.append((seg, fitz.Rect(seg.rect.x0, y0, seg.rect.x1, y1)))
    return out


def piece_content(seg: Segment, rect: fitz.Rect, x_from: float | None = None, x_to: float | None = None):
    inner = fitz.Rect(x_from if x_from is not None else rect.x0, rect.y0, x_to if x_to is not None else rect.x1, rect.y1)
    lines = [l for l in seg.lines if inner.contains(fitz.Point(max(l.bbox.x0, inner.x0) + 0.5, (l.bbox.y0 + l.bbox.y1) / 2))]
    drawn = [r for r in seg.drawn if inner.intersects(r)]
    return inner, lines, drawn


def build_book(n: int, store: AssetStore) -> tuple[list[dict], list[dict]]:
    keys = parse_answer_key(n)
    table = parse_score_table(n)
    modules = book_questions(n)
    expected = [33, 33, 27, 27]
    if [len(m) for m in modules] != expected or [len(k) for k in keys] != expected:
        raise RuntimeError(f"Test {n}: modules {[len(m) for m in modules]}, keys {[len(k) for k in keys]}")

    questions: list[dict] = []
    module_ids: list[list[str]] = []
    for mi, (mod, key) in enumerate(zip(modules, keys)):
        subject = "english" if mi < 2 else "math"
        ids: list[str] = []
        for q, answer in zip(mod, key):
            qid = f"pt{n}-{'rw' if subject == 'english' else 'm'}{mi % 2 + 1}-{q.number:02d}"
            if q.number != len(ids) + 1:
                raise RuntimeError(f"{qid}: out of order")
            last = q.segments[-1]
            box = content_box(last.lines, last.drawn)
            end = (len(q.segments) - 1, (box.y1 + 1.5) if box else last.rect.y1)

            letters = choice_spots(q)
            is_mcq = answer in LETTERS
            if is_mcq and sorted(letters) != list(LETTERS):
                raise RuntimeError(f"{qid}: found choices {sorted(letters)}")
            if not is_mcq and subject == "english":
                raise RuntimeError(f"{qid}: Reading and Writing answer {answer!r} is not a letter")

            begin = (0, q.segments[0].rect.y0)
            # Where a row of labels starts. Fractions stick out above and below
            # their row, so rows are split at the widest empty band between them
            # rather than at the label's top edge.
            def row_mid(spot: ChoiceSpot) -> float:
                return (spot.line.bbox.y0 + spot.line.bbox.y1) / 2

            def cut_between(si: int, y_lo: float, y_hi: float, default: float) -> float:
                seg = q.segments[si]
                spans = sorted(
                    (max(r.y0, y_lo), min(r.y1, y_hi))
                    for r in [l.bbox for l in seg.lines] + seg.drawn
                    if r.y1 > y_lo and r.y0 < y_hi and r.height < (y_hi - y_lo)
                )
                best, cursor = None, y_lo
                for a, b in spans:
                    if a > cursor and (best is None or a - cursor > best[1] - best[0]):
                        best = (cursor, a)
                    cursor = max(cursor, b)
                return (best[0] + best[1]) / 2 if best and best[1] - best[0] >= 1 else default

            stem_end = end
            if is_mcq:
                a = letters["A"]
                stem_end = (a.si, cut_between(a.si, max(q.segments[a.si].rect.y0, a.line.bbox.y0 - 30), row_mid(a), a.line.bbox.y0 - 2))
            # Each choice spans from the cut above it to the cut above the next
            # row of labels, and from its label to the next label on the same row.
            choice_ranges = []
            if is_mcq:
                rows = sorted({(o.si, round(o.line.bbox.y0)) for o in letters.values()})
                row_top: dict[tuple, tuple[int, float]] = {}
                for i, row in enumerate(rows):
                    spot = next(o for o in letters.values() if (o.si, round(o.line.bbox.y0)) == row)
                    if i == 0:
                        row_top[row] = stem_end
                    else:
                        prev = next(o for o in letters.values() if (o.si, round(o.line.bbox.y0)) == rows[i - 1])
                        if prev.si == spot.si:
                            row_top[row] = (spot.si, cut_between(spot.si, row_mid(prev), row_mid(spot), spot.line.bbox.y0 - 2))
                        else:
                            row_top[row] = (spot.si, spot.line.bbox.y0 - 2)
                for L in LETTERS:
                    spot = letters[L]
                    row = (spot.si, round(spot.line.bbox.y0))
                    i = rows.index(row)
                    stop = row_top[rows[i + 1]] if i + 1 < len(rows) else end
                    right = [o.x0 for o in letters.values() if o.si == spot.si and abs(o.line.bbox.y0 - spot.line.bbox.y0) < 3 and o.x0 > spot.x0]
                    x_to = min(right) - 2 if right else None
                    choice_ranges.append((row_top[row], stop, spot, x_to))

            record: dict = {"id": qid, "subject": subject, "type": "mcq" if is_mcq else "spr", "explanation": ""}

            if subject == "english":
                pieces = []
                for seg, rect in span_pieces(q, begin, stem_end):
                    _, lines, _ = piece_content(seg, rect)
                    ignore = [fitz.Rect(seg.rect.x0, seg.rect.y0 - 14, seg.rect.x1, seg.rect.y0)]
                    figures, text_lines = figure_regions(seg.page, rect, lines, ignore)
                    pieces.append((seg.page, text_lines, figures))
                stimulus, prompt = english_blocks(pieces, BOOK_SCALE, store)
                choices = []
                for L, (start, stop, _, x_to) in zip(LETTERS, choice_ranges):
                    cl: list[Line] = []
                    for seg, rect in span_pieces(q, start, stop):
                        cl += piece_content(seg, rect, None, x_to)[1]
                    choices.append(re.sub(rf"^({L}\\?\)|•)\s*", "", join_lines(cl)).strip())
                if not prompt:
                    warn(f"{qid}: no prompt found")
                domain, skill = classify_rw(prompt, choices)
                record.update(stimulus=stimulus, prompt=prompt, choices=choices, domain=domain, skill=skill, difficulty="medium")
            else:
                tokens = []
                all_text = []
                for seg, rect in span_pieces(q, begin, stem_end):
                    inner, lines, drawn = piece_content(seg, rect)
                    all_text += [l.text for l in lines]
                    cbox = content_box(lines, drawn)
                    if cbox:
                        tokens.append(image_token(store.crop(seg.page, pad(cbox & inner, 2, inner), BOOK_SCALE)))
                choices = []
                for L, (start, stop, spot, x_to) in zip(LETTERS, choice_ranges):
                    parts = []
                    for seg, rect in span_pieces(q, start, stop):
                        x_from = spot.x1 + 2 if start[0] == q.segments.index(seg) else spot.x0
                        inner, lines, drawn = piece_content(seg, rect, x_from, x_to)
                        all_text += [l.text for l in lines]
                        cbox = content_box(lines, drawn)
                        if cbox:
                            parts.append(image_token(store.crop(seg.page, pad(cbox & inner, 1.5, inner), BOOK_SCALE)))
                    if not parts:
                        raise RuntimeError(f"{qid}: empty choice {L}")
                    choices.append("".join(parts))
                domain, skill = classify_math(" ".join(all_text))
                position = (q.number - 1) / 27
                difficulty = "easy" if position < 0.34 else "medium" if position < 0.7 else "hard"
                record.update(
                    stimulus=[],
                    prompt="".join(tokens),
                    choices=choices if is_mcq else None,
                    domain=domain,
                    skill=skill,
                    difficulty=difficulty,
                )

            record["answer"] = {"choice": answer} if is_mcq else spr_answer(answer)
            questions.append(record)
            ids.append(qid)
        module_ids.append(ids)

    def rw(ids: list[str]) -> dict:
        return {"title": "Reading and Writing", "subject": "english", "duration_seconds": 39 * 60, "break_seconds": 0, "question_ids": ids}

    def math(ids: list[str], brk: int = 0) -> dict:
        return {"title": "Math", "subject": "math", "duration_seconds": 43 * 60, "break_seconds": brk * 60, "question_ids": ids}

    forms = [
        {
            "id": f"official-{n}",
            "section": "general",
            "title": f"Official Practice Test {n}",
            "description": "The College Board practice test in its paper format: two 39-minute Reading and Writing modules, a 10-minute break, then two 43-minute Math modules.",
            "sort": 100 + n,
            "score_table": table,
            "modules": [rw(module_ids[0]), rw(module_ids[1]), math(module_ids[2], 10), math(module_ids[3])],
        },
        {
            "id": f"official-{n}-english",
            "section": "english",
            "title": f"Official Practice Test {n} · Reading and Writing",
            "description": "Both Reading and Writing modules of the official practice test, 33 questions each.",
            "sort": 100 + n,
            "score_table": {"english": table["english"]},
            "modules": [rw(module_ids[0]), rw(module_ids[1])],
        },
        {
            "id": f"official-{n}-math",
            "section": "math",
            "title": f"Official Practice Test {n} · Math",
            "description": "Both Math modules of the official practice test, 27 questions each.",
            "sort": 100 + n,
            "score_table": {"math": table["math"]},
            "modules": [math(module_ids[2]), math(module_ids[3])],
        },
    ]
    return questions, forms


# ---------------------------------------------------------------------------
# Question bank
# ---------------------------------------------------------------------------

HEADER_COLUMNS = {"Assessment": 0, "Test": 1, "Domain": 2, "Skill": 3, "Difficulty": 4}


@dataclass
class BankItem:
    qid: str
    segments: list[tuple[fitz.Page, fitz.Rect]] = field(default_factory=list)


def bank_items(doc: fitz.Document) -> list[BankItem]:
    items: list[BankItem] = []
    for page in doc:
        starts = []
        for line in lines_in(page, page.rect):
            m = re.match(r"Question ID:\s*(\w+)", line.text.strip())
            if m:
                starts.append((line.bbox.y0, m.group(1)))
        bottom = page.rect.height - 20
        top = 15.0
        if not starts:
            if items:
                items[-1].segments.append((page, fitz.Rect(0, top, page.rect.width, bottom)))
            continue
        if items and starts[0][0] > top + 30:
            items[-1].segments.append((page, fitz.Rect(0, top, page.rect.width, starts[0][0] - 4)))
        for i, (y, qid) in enumerate(starts):
            y1 = starts[i + 1][0] - 4 if i + 1 < len(starts) else bottom
            items.append(BankItem(qid, [(page, fitz.Rect(0, y, page.rect.width, y1))]))
    return items


def bank_metadata(page: fitz.Page, region: fitz.Rect) -> dict:
    words = page.get_text("words", clip=region)
    header = {w[4]: w for w in words if w[4] in HEADER_COLUMNS}
    if "Assessment" not in header or "Difficulty" not in header:
        raise RuntimeError("No metadata header")
    top = header["Assessment"][3]
    question = next((w for w in words if w[4] == "Question" and w[1] > top), None)
    bottom = question[1] if question else top + 70
    cols = sorted(((name, w[0]) for name, w in header.items()), key=lambda kv: kv[1])
    values: dict[str, list[tuple[float, float, str]]] = {name: [] for name, _ in cols}
    for w in words:
        if not (top + 2 < w[1] < bottom - 2):
            continue
        for i, (name, x) in enumerate(cols):
            nxt = cols[i + 1][1] if i + 1 < len(cols) else 10_000
            if x - 4 <= w[0] < nxt - 4:
                values[name].append((round(w[1]), w[0], w[4]))
    return {k: " ".join(t for _, _, t in sorted(v)) for k, v in values.items()}


def labels(page: fitz.Page, region: fitz.Rect, lines: list[Line]) -> tuple[dict[str, fitz.Rect], str | None]:
    """Section labels of a question bank item (Question, Answer, A.-D.,
    Correct Answer, Rationale) as rectangles, plus the correct answer text."""
    found: dict[str, fitz.Rect] = {}
    correct: str | None = None
    for w in page.get_text("words", clip=region):
        if w[0] > 30:
            continue
        t = w[4]
        r = fitz.Rect(w[:4])
        if t == "Question" and any(o[4].startswith("ID") and abs(o[1] - w[1]) < 2 for o in page.get_text("words", clip=fitz.Rect(0, w[1] - 2, 200, w[3] + 2))):
            continue
        if t in ("Question", "Answer", "Rationale") and t not in found:
            found[t] = r
        elif re.fullmatch(r"[A-D]\.", t) and t[0] not in found:
            found[t[0]] = r
    for l in lines:
        t = l.text.strip()
        if l.bbox.x0 < 30 and re.match(r"Correct\s*Answer", t) and "Correct" not in found:
            found["Correct"] = fitz.Rect(l.bbox)
            correct = t.split(":", 1)[1].strip() if ":" in t else ""
    return found, correct


def answer_from_rationale(text: str) -> str:
    """SPR items sometimes give the answer only in the rationale, e.g. "The
    correct answer is 22.4. ... Note that 22.4 and 112/5 are examples of ways
    to enter a correct answer." """
    flat = re.sub(r"\s+", " ", text)
    note = re.search(r"Note that (.+?) (?:are|is) examples? of ways to enter", flat)
    if note:
        return re.sub(r",? and |, ", "; ", note.group(1))
    m = re.search(r"The correct answer is (-?[\d./]*\d)", flat)
    return m.group(1) if m else ""


def build_bank(file: Path, subject: str, store: AssetStore) -> list[dict]:
    doc = fitz.open(file)
    out: list[dict] = []
    for item in bank_items(doc):
        try:
            first_page, first_region = item.segments[0]
            meta = bank_metadata(first_page, first_region)
            difficulty = meta.get("Difficulty", "").lower().replace(" ", "")
            if difficulty not in ("easy", "medium", "hard"):
                raise RuntimeError(f"difficulty {difficulty!r}")

            # Labels can be spread over several pages.
            lab: dict[str, tuple[int, fitz.Rect]] = {}
            correct_text: str | None = None
            seg_lines: list[list[Line]] = []
            for si, (pg, region) in enumerate(item.segments):
                lines = lines_in(pg, region)
                seg_lines.append(lines)
                found, correct = labels(pg, region, lines)
                for key, rect in found.items():
                    lab.setdefault(key, (si, rect))
                if correct_text is None and correct is not None:
                    correct_text = correct
            for need in ("Question", "Rationale"):
                if need not in lab:
                    raise RuntimeError(f"missing {need}")
            is_mcq = all(L in lab for L in LETTERS)

            def seg_bottom(si: int) -> float:
                pg, region = item.segments[si]
                box = content_box(seg_lines[si], drawings_in(pg, region))
                return min(region.y1, box.y1 + 2) if box else region.y1

            def until(si: int, keys: list[str]) -> float:
                """y of the first label after position si among keys, or the segment bottom."""
                ys = [rect.y0 for k, (s_i, rect) in lab.items() if k in keys and s_i == si]
                return min(ys) - 3 if ys else seg_bottom(si)

            qsi, qrect = lab["Question"]
            page, region = item.segments[qsi]
            stem_bottom = until(qsi, ["Answer", "A", "Correct", "Rationale"])
            stem_rect = fitz.Rect(12, qrect.y1 + 3, page.rect.width - 12, stem_bottom)
            stem_lines = [l for l in seg_lines[qsi] if stem_rect.contains(l.bbox.tl + (1, 1))]

            choice_spots: list[tuple[fitz.Page, fitz.Rect]] = []
            if is_mcq:
                for i, L in enumerate(LETTERS):
                    si, rect = lab[L]
                    pg, _ = item.segments[si]
                    later = [LETTERS[j] for j in range(i + 1, 4)] + ["Correct", "Rationale"]
                    bottom = until(si, later)
                    choice_spots.append((pg, fitz.Rect(rect.x1 + 3, rect.y0 - 2, pg.rect.width - 12, bottom)))

            record: dict = {
                "id": f"qb-{item.qid}",
                "subject": subject,
                "domain": meta.get("Domain", ""),
                "skill": meta.get("Skill", ""),
                "difficulty": difficulty,
                "type": "mcq" if is_mcq else "spr",
            }

            if subject == "english":
                figures, text_lines = figure_regions(page, stem_rect, stem_lines, [])
                stimulus, prompt = english_blocks([(page, text_lines, figures)], BANK_SCALE, store)
                choices = [join_lines(lines_in(pg, rect)) for pg, rect in choice_spots]
                if is_mcq and not all(choices):
                    raise RuntimeError("empty choice text")
                record.update(stimulus=stimulus, prompt=prompt, choices=choices if is_mcq else None)
            else:
                box = content_box(stem_lines, drawings_in(page, stem_rect))
                prompt = image_token(store.crop(page, pad(box, 2, stem_rect), BANK_SCALE)) if box else ""
                choices = []
                for pg, rect in choice_spots:
                    cbox = content_box(lines_in(pg, rect), drawings_in(pg, rect))
                    if cbox is None:
                        raise RuntimeError("empty choice")
                    choices.append(image_token(store.crop(pg, pad(cbox & rect, 1.5, rect), BANK_SCALE)))
                record.update(stimulus=[], prompt=prompt, choices=choices if is_mcq else None)

            # Rationale: from the label to the end of the item, possibly
            # continuing on following pages.
            rsi, rrect = lab["Rationale"]
            parts: list[str] = []
            raw_text: list[str] = []
            for si in range(rsi, len(item.segments)):
                pg, region = item.segments[si]
                seg = fitz.Rect(0, rrect.y1 + 2, pg.rect.width, region.y1) if si == rsi else region
                if si == rsi and "Correct" in lab and lab["Correct"][0] == si and lab["Correct"][1].y0 > rrect.y0:
                    seg.y1 = lab["Correct"][1].y0 - 3
                lines = lines_in(pg, seg)
                drawn = drawings_in(pg, seg)
                raw_text += [l.text for l in lines]
                if not lines and not drawn:
                    continue
                if subject == "english":
                    parts.extend(join_lines(p) for p in paragraphs(lines))
                else:
                    box = content_box(lines, drawn)
                    parts.append(image_token(store.crop(pg, pad(box, 2, seg), BANK_SCALE)))
            record["explanation"] = "\n\n".join(p for p in parts if p)

            correct_raw = correct_text or ""
            if not correct_raw and not is_mcq:
                correct_raw = answer_from_rationale(" ".join(raw_text))
            if not correct_raw:
                raise RuntimeError("no correct answer")
            record["answer"] = {"choice": correct_raw[:1]} if is_mcq else spr_answer(correct_raw)
            if is_mcq and record["answer"]["choice"] not in LETTERS:
                raise RuntimeError(f"answer {correct_raw!r}")
            if not is_mcq and not record["answer"]["values"]:
                raise RuntimeError(f"unreadable answer {correct_raw!r}")
            out.append(record)
        except Exception as exc:  # noqa: BLE001 - report and keep going
            warn(f"{file.name} {item.qid}: skipped ({exc})")
    return out


# ---------------------------------------------------------------------------
# Adaptive tests assembled from the question bank
# ---------------------------------------------------------------------------

RW_ORDER = [
    "Craft and Structure",
    "Information and Ideas",
    "Standard English Conventions",
    "Expression of Ideas",
]


def adaptive_forms(bank: list[dict]) -> list[dict]:
    """Builds adaptive tests: Module 1 mixes easy, medium and hard questions;
    Module 2 has a lower (easier) and an upper (harder) version, and the
    student gets one depending on how they did on Module 1. The two versions
    share a few medium questions, since a student only ever sees one of them.
    Questions left over become single-module practice sets."""
    rank = {"easy": 0, "medium": 1, "hard": 2}

    def pools(subject: str) -> dict[str, list[dict]]:
        by: dict[str, list[dict]] = {"easy": [], "medium": [], "hard": []}
        for q in bank:
            if q["subject"] == subject:
                by[q["difficulty"]].append(q)
        # Interleave domains so each module gets a spread of topics.
        for level, items in by.items():
            buckets: dict[str, list[dict]] = {}
            for q in sorted(items, key=lambda q: (q["domain"], q["skill"], q["id"])):
                buckets.setdefault(q["domain"], []).append(q)
            interleaved = []
            while any(buckets.values()):
                for key in sorted(buckets):
                    if buckets[key]:
                        interleaved.append(buckets[key].pop(0))
            by[level] = interleaved
        return by

    def order(subject: str, items: list[dict]) -> list[str]:
        if subject == "english":
            items = sorted(items, key=lambda q: (RW_ORDER.index(q["domain"]) if q["domain"] in RW_ORDER else 9, q["skill"], rank[q["difficulty"]]))
        else:
            items = sorted(items, key=lambda q: rank[q["difficulty"]])
        return [q["id"] for q in items]

    def take(pool: list[dict], n: int) -> list[dict]:
        taken = pool[:n]
        del pool[:n]
        return taken

    forms: list[dict] = []
    # (easy, medium, hard) per module; `shared` medium questions appear in both Module 2 versions.
    plans = {
        "english": dict(size=27, minutes=32, label="Reading and Writing", m1=(8, 10, 9), lower=(12, 12, 3), upper=(0, 8, 19), shared=8),
        "math": dict(size=22, minutes=35, label="Math", m1=(6, 7, 9), lower=(9, 9, 4), upper=(0, 5, 17), shared=5),
    }
    for subject, plan in plans.items():
        p = pools(subject)
        m1_mix, lo, up, shared = plan["m1"], plan["lower"], plan["upper"], plan["shared"]
        pack = 0
        while True:
            need = {
                "easy": m1_mix[0] + lo[0] + up[0],
                "medium": m1_mix[1] + lo[1] + up[1] - shared,
                "hard": m1_mix[2] + lo[2] + up[2],
            }
            if any(len(p[k]) < v for k, v in need.items()):
                break
            m1 = take(p["easy"], m1_mix[0]) + take(p["medium"], m1_mix[1]) + take(p["hard"], m1_mix[2])
            common = take(p["medium"], shared)
            lower = take(p["easy"], lo[0]) + common + take(p["medium"], lo[1] - shared) + take(p["hard"], lo[2])
            upper = take(p["easy"], up[0]) + common[: up[1]] + take(p["medium"], max(0, up[1] - shared)) + take(p["hard"], up[2])
            size = plan["size"]
            assert len(m1) == size and len(lower) == size and len(upper) == size, (subject, len(m1), len(lower), len(upper))
            pack += 1
            letter = chr(ord("A") + pack - 1)
            base = {"title": plan["label"], "subject": subject, "duration_seconds": plan["minutes"] * 60, "break_seconds": 0}
            forms.append(
                {
                    "id": f"adaptive-{subject}-{letter.lower()}",
                    "section": subject,
                    "title": f"Adaptive {plan['label']} Test {letter}",
                    "description": f"Official question bank items in the adaptive format: Module 2 gets easier or harder depending on your Module 1 score. {size} questions per module.",
                    "sort": 50 + pack,
                    "modules": [
                        {**base, "question_ids": order(subject, m1)},
                        {
                            **base,
                            "question_ids": [],
                            "adaptive": {"from": 0, "threshold": 0.6, "lower": order(subject, lower), "upper": order(subject, upper)},
                        },
                    ],
                }
            )

        # Practice sets from the questions that are left.
        rest = sorted(p["easy"] + p["medium"] + p["hard"], key=lambda q: (rank[q["difficulty"]], q["domain"], q["id"]))
        size = plan["size"]
        chunks = [rest[i : i + size] for i in range(0, len(rest), size)]
        if len(chunks) > 1 and len(chunks[-1]) < size // 2:
            chunks[-2] += chunks.pop()
        for i, chunk in enumerate(chunks):
            levels = sorted({q["difficulty"] for q in chunk}, key=rank.get)
            forms.append(
                {
                    "id": f"bank-{subject}-{i + 1}",
                    "section": subject,
                    "title": f"Question Bank {plan['label']} Set {i + 1}",
                    "description": f"{len(chunk)} official question bank items ({', '.join(levels)}) in one timed module, with full explanations.",
                    "sort": 80 + i,
                    "modules": [
                        {
                            "title": plan["label"],
                            "subject": subject,
                            "duration_seconds": round(plan["minutes"] * 60 * len(chunk) / size / 60) * 60,
                            "break_seconds": 0,
                            "question_ids": order(subject, chunk),
                        }
                    ],
                }
            )
        print(f"Adaptive {subject}: {pack} test(s), {len(chunks)} practice set(s) from {len(rest)} remaining questions")

    # Full-length adaptive tests pair Reading and Writing with Math packs.
    english = [f for f in forms if f["id"].startswith("adaptive-english")]
    math = [f for f in forms if f["id"].startswith("adaptive-math")]
    for i, (e, m) in enumerate(zip(english, math)):
        letter = chr(ord("A") + i)
        math_modules = [dict(mod) for mod in m["modules"]]
        math_modules[0]["break_seconds"] = 600
        forms.append(
            {
                "id": f"adaptive-full-{letter.lower()}",
                "section": "general",
                "title": f"Adaptive Full-Length Test {letter}",
                "description": "Both sections in the adaptive digital format, with a 10-minute break between Reading and Writing and Math. Each section's Module 2 adapts to your Module 1.",
                "sort": 50 + i + 1,
                "modules": [*e["modules"], *math_modules],
            }
        )
    return forms


# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Adaptive mock tests in the digital SAT format
# ---------------------------------------------------------------------------

RW_SKILL_ORDER = [
    "Words in Context",
    "Text Structure and Purpose",
    "Cross-Text Connections",
    "Central Ideas and Details",
    "Command of Evidence (Textual)",
    "Command of Evidence (Quantitative)",
    "Inferences",
    "Boundaries",
    "Form, Structure, and Sense",
    "Transitions",
    "Rhetorical Synthesis",
]
LEVEL = {"easy": 0.2, "medium": 0.5, "hard": 0.85}

# Which book each mock draws from; no question appears in two mocks.
MOCKS = {
    "math": [4, 5, 6],
    "english": [7, 8, 10],
    "full": [(4, 7), (5, 8), (6, 10)],  # (Reading and Writing book, Math book)
}


def mock_forms(questions: list[dict], bank: list[dict]) -> list[dict]:
    """Digital-format adaptive mocks. Module 1 is drawn from an official
    practice test; Module 2 has an easier version (more of that test plus easy
    and medium question bank items) and a harder one (the test's harder items
    plus hard question bank items)."""
    by_id = {q["id"]: q for q in questions}

    def book(n: int, subject: str) -> list[dict]:
        prefix = f"pt{n}-{'rw' if subject == 'english' else 'm'}"
        return [q for q in questions if q["id"].startswith(prefix)]

    pools = {
        (s, lvl): sorted((q for q in bank if q["subject"] == s and q["difficulty"] in lvl), key=lambda q: q["id"])
        for s in ("english", "math")
        for lvl in (("easy", "medium"), ("hard",))
    }

    def take_bank(subject: str, levels: tuple, n: int) -> list[dict]:
        pool = pools[(subject, levels)]
        # Spread across domains.
        chosen: list[dict] = []
        domains = sorted({q["domain"] for q in pool})
        while len(chosen) < n and pool:
            for d in domains:
                match = next((q for q in pool if q["domain"] == d), None)
                if match and len(chosen) < n:
                    chosen.append(match)
                    pool.remove(match)
        if len(chosen) < n:
            raise RuntimeError(f"Not enough {subject} {levels} question bank items")
        return chosen

    def difficulty(q: dict) -> float:
        if q["id"].startswith("pt") and q["subject"] == "math":
            return (int(q["id"].rsplit("-", 1)[1]) - 1) / 26
        return LEVEL[q["difficulty"]]

    def ordered(subject: str, items: list[dict]) -> list[str]:
        if subject == "english":
            key = lambda q: (RW_SKILL_ORDER.index(q["skill"]) if q["skill"] in RW_SKILL_ORDER else 99, difficulty(q))
        else:
            key = difficulty
        return [q["id"] for q in sorted(items, key=key)]

    def spread(items: list[dict], n: int) -> tuple[list[dict], list[dict]]:
        """Picks n items evenly across a list, returning (picked, rest)."""
        step = len(items) / n
        idx = {int(i * step + step / 2) for i in range(n)}
        return [q for i, q in enumerate(items) if i in idx], [q for i, q in enumerate(items) if i not in idx]

    def section(subject: str, n: int) -> tuple[list[str], dict]:
        items = book(n, subject)
        if subject == "english":
            size, lower_book, upper_book, lower_bank, upper_bank = 27, 19, 17, 8, 10
            # Keep the official mix of question types in Module 1.
            items = sorted(items, key=lambda q: (RW_SKILL_ORDER.index(q["skill"]) if q["skill"] in RW_SKILL_ORDER else 99, q["id"]))
        else:
            size, lower_book, upper_book, lower_bank, upper_bank = 22, 16, 12, 6, 10
            items = sorted(items, key=difficulty)
        m1, rest = spread(items, size)
        rest = sorted(rest, key=difficulty)
        if subject == "english":
            lower = rest[:lower_book]
            upper = rest[len(rest) - upper_book :]
        else:
            lower = rest[:lower_book]
            upper = rest[-upper_book:]
        lower = lower + take_bank(subject, ("easy", "medium"), lower_bank)
        upper = upper + take_bank(subject, ("hard",), upper_bank)
        assert len(m1) == size and len(lower) == size and len(upper) == size
        return ordered(subject, m1), {"from": 0, "threshold": 0.6, "lower": ordered(subject, lower), "upper": ordered(subject, upper)}

    def modules(subject: str, n: int, from_index: int = 0, break_before: int = 0) -> list[dict]:
        m1, adaptive = section(subject, n)
        adaptive["from"] = from_index
        label, minutes = ("Reading and Writing", 32) if subject == "english" else ("Math", 35)
        base = {"title": label, "subject": subject, "duration_seconds": minutes * 60}
        return [
            {**base, "break_seconds": break_before, "question_ids": m1},
            {**base, "break_seconds": 0, "question_ids": [], "adaptive": adaptive},
        ]

    forms: list[dict] = []
    for i, n in enumerate(MOCKS["math"], 1):
        forms.append({
            "id": f"mock-math-{i}", "section": "math", "title": f"Math Mock Test {i}", "sort": i, "listed": True,
            "description": "Two adaptive 35-minute modules of 22 questions, built from official practice test questions.",
            "modules": modules("math", n),
        })
    for i, n in enumerate(MOCKS["english"], 1):
        forms.append({
            "id": f"mock-english-{i}", "section": "english", "title": f"Reading and Writing Mock Test {i}", "sort": i, "listed": True,
            "description": "Two adaptive 32-minute modules of 27 questions, built from official practice test questions.",
            "modules": modules("english", n),
        })
    for i, (rw, m) in enumerate(MOCKS["full"], 1):
        forms.append({
            "id": f"mock-full-{i}", "section": "general", "title": f"Full-Length Mock Test {i}", "sort": i, "listed": True,
            "description": "The complete adaptive digital SAT: Reading and Writing, a 10-minute break, then Math. Scored 400-1600.",
            "modules": modules("english", rw) + modules("math", m, from_index=2, break_before=600),
        })

    used = [qid for f in forms for m in f["modules"] for qid in m["question_ids"] + m.get("adaptive", {}).get("lower", []) + m.get("adaptive", {}).get("upper", [])]
    per_form = {}
    for f in forms:
        ids = {qid for m in f["modules"] for qid in m["question_ids"] + m.get("adaptive", {}).get("lower", []) + m.get("adaptive", {}).get("upper", [])}
        per_form[f["id"]] = ids
    all_ids = [qid for ids in per_form.values() for qid in ids]
    if len(all_ids) != len(set(all_ids)):
        raise RuntimeError("A question appears in more than one mock")
    missing = [qid for qid in used if qid not in by_id]
    if missing:
        raise RuntimeError(f"Unknown questions {missing[:3]}")
    print(f"Mocks: {len(forms)} tests using {len(set(all_ids))} distinct questions")
    return forms


def main() -> None:
    store = AssetStore()
    questions: list[dict] = []
    forms: list[dict] = []

    for n in BOOK_TESTS:
        qs, fs = build_book(n, store)
        questions += qs
        forms += fs
        print(f"Practice test {n}: {len(qs)} questions")

    bank: list[dict] = []
    for name, subject in [
        ("medium-easy-english.pdf", "english"),
        ("hard-english.pdf", "english"),
        ("medium-easy-math.pdf", "math"),
        ("hard-math.pdf", "math"),
    ]:
        items = build_bank(BANK / name, subject, store)
        print(f"Question bank {name}: {len(items)} questions")
        bank += items
    questions += bank
    # Only the adaptive mocks are listed; other forms stay unlisted.
    forms = [{**f, "listed": False} for f in forms + adaptive_forms(bank)]
    forms += mock_forms(questions, bank)

    ids = [q["id"] for q in questions]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Duplicate question ids")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "official.json").write_text(json.dumps({"questions": questions, "forms": forms}, ensure_ascii=False))
    print(f"\n{len(questions)} questions, {len(forms)} tests, {len(store.ids)} images -> {OUT.relative_to(ROOT)}")
    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings:
            print("  " + w)


if __name__ == "__main__":
    sys.exit(main())
