/** Split text into sentence-ish spans that are verbatim substrings of the input. */
export function spans(text: string): string[] {
  const out: string[] = [];
  const re = /[^.!?\n]+[.!?]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const s = m[0].trim();
    if (s) out.push(s);
  }
  return out;
}

export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Find `quote` inside `text` ignoring case/whitespace/curly quotes; return the verbatim original span or null. */
export function findVerbatim(text: string, quote: string): string | null {
  const q = norm(quote).replace(/^["'\s]+|["'\s.]+$/g, "");
  if (q.length < 3) return null;
  // Build normalized text with index map back to original.
  const map: number[] = [];
  let n = "";
  let prevSpace = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i].toLowerCase();
    if (c === "\u2018" || c === "\u2019") c = "'";
    if (c === "\u201c" || c === "\u201d") c = '"';
    if (c === "\u2013" || c === "\u2014") c = "-";
    if (/\s/.test(c)) {
      if (prevSpace) continue;
      c = " ";
      prevSpace = true;
    } else prevSpace = false;
    n += c;
    map.push(i);
  }
  const at = n.indexOf(q);
  if (at < 0) return null;
  const start = map[at];
  const end = map[at + q.length - 1] + 1;
  return text.slice(start, end);
}

const WORD_NUMS: Record<string, number> = {
  ten: 10, fifteen: 15, twenty: 20, "twenty five": 25, "twenty-five": 25, thirty: 30, "thirty five": 35,
  forty: 40, "forty five": 45, fifty: 50, sixty: 60, seventy: 70, "seventy five": 75, eighty: 80, ninety: 90,
};

/** Percent-off figures mentioned in a text: "50% off", "up to 30%", "thirty percent off". */
export function percents(text: string): { value: number; span: string }[] {
  const out: { value: number; span: string }[] = [];
  const t = text;
  const num = /(\d{1,3})\s?(%|percent)/gi;
  let m: RegExpExecArray | null;
  while ((m = num.exec(t))) out.push({ value: Number(m[1]), span: m[0] });
  const words = Object.keys(WORD_NUMS).sort((a, b) => b.length - a.length).join("|");
  const wre = new RegExp(`\\b(${words})\\s+percent`, "gi");
  while ((m = wre.exec(t))) out.push({ value: WORD_NUMS[m[1].toLowerCase()], span: m[0] });
  return out;
}

const EN = new Set("the a an and or but to of in on for with my me i is it this that you your so just at be was are have has get like not".split(" "));
const OTHER = new Set(
  "el la los las de del que y con mi mis es por para una un se muy pero le les des et je est pas avec pour une der die das und ist nicht mit ich ein eine o os as da do em não com uma".split(" ")
);

/** Very small language heuristic: true when non-English function words outnumber English ones. */
export function looksNonEnglish(text: string): boolean {
  const words = text.toLowerCase().replace(/[^\p{L}\s']/gu, " ").split(/\s+/).filter(Boolean);
  let en = 0, other = 0;
  for (const w of words) {
    if (EN.has(w)) en++;
    if (OTHER.has(w)) other++;
  }
  return other >= 3 && other > en * 1.5;
}
