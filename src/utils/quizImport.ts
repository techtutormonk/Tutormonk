// Bulk quiz import: accepts JSON (preferred) or plain text produced by an AI tool.
export interface ImportedQuestion { question: string; options: string[]; correct: number }
export interface ImportResult { title?: string; questions: ImportedQuestion[]; errors: string[] }

const LETTERS = 'ABCDEF';

export const AI_PROMPT_TEMPLATE = `Create a multiple-choice quiz for me.

Topic: [WRITE TOPIC HERE]
Class / level: [WRITE CLASS HERE]
Number of questions: [e.g. 25]

Reply in PLAIN TEXT only, exactly in this format. No bold, no tables, no extra sentences before or after.

Title: Quiz title here

1. Question text here?
A) First option
B) Second option
C) Third option
D) Fourth option
Answer: B

2. Next question text here?
A) First option
B) Second option
C) Third option
D) Fourth option
Answer: C

(continue the same way until the last question)`;

const stripFences = (t: string) =>
  t.trim().replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim();

const clean = (s: any) => String(s ?? '').replace(/\s+/g, ' ').trim();
const stripLetter = (s: string) => s.replace(/^\(?[A-Fa-f][\).:\-]\s+/, '').trim();

function resolveAnswer(ans: any, options: string[]): number {
  if (typeof ans === 'number') {
    // accept 0-based index (0..n-1); also tolerate 1-based when it clearly cannot be 0-based
    return ans >= 0 && ans < options.length ? ans : (ans >= 1 && ans <= options.length ? ans - 1 : -1);
  }
  const a = clean(ans);
  if (!a) return -1;
  const exact = options.findIndex(o => o.toLowerCase() === stripLetter(a).toLowerCase());
  if (exact >= 0) return exact;
  const m = /^\(?([A-Fa-f])(?:[\).:]|\s|$)/.exec(a);
  if (m) return LETTERS.indexOf(m[1].toUpperCase());
  if (/^\d+$/.test(a)) { const n = Number(a); return n >= 1 && n <= options.length ? n - 1 : -1; }
  const idx = options.findIndex(o => o.toLowerCase() === stripLetter(a).toLowerCase());
  return idx;
}

function fromObjects(arr: any[], errors: string[]): ImportedQuestion[] {
  const out: ImportedQuestion[] = [];
  arr.forEach((q, i) => {
    const n = i + 1;
    const question = clean(q?.question ?? q?.q ?? q?.text);
    let rawOpts = q?.options ?? q?.choices ?? q?.answers;
    if (rawOpts && !Array.isArray(rawOpts) && typeof rawOpts === 'object') rawOpts = Object.values(rawOpts);
    const options: string[] = (Array.isArray(rawOpts) ? rawOpts : []).map((o: any) => stripLetter(clean(o))).filter(Boolean);
    if (!question) return void errors.push(`Question ${n}: missing question text.`);
    if (options.length < 2) return void errors.push(`Question ${n}: needs at least 2 options.`);
    if (options.length > 6) return void errors.push(`Question ${n}: at most 6 options are allowed.`);
    const correct = resolveAnswer(q?.answer ?? q?.correct ?? q?.correct_option ?? q?.correct_option_index ?? q?.correctAnswer, options);
    if (correct < 0 || correct >= options.length) return void errors.push(`Question ${n}: the correct answer is missing or does not match an option.`);
    out.push({ question, options, correct });
  });
  return out;
}

function fromText(text: string, errors: string[]): ImportedQuestion[] {
  const lines = text.replace(/\r/g, '').replace(/[*_`#>]/g, '').replace(/\\/g, '').split('\n').map(l => l.trim());
  const blocks: string[][] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (!l) { if (cur.length) { blocks.push(cur); cur = []; } continue; }
    // a new numbered question ("1." / "Q1:" / "Question 1") starts a new block even without a blank line
    if (cur.length && /^(?:q(?:uestion)?\s*)?\d+\s*[\).:\-]/i.test(l) && cur.some(x => /^\(?[A-F][\).:]/i.test(x))) { blocks.push(cur); cur = []; }
    cur.push(l);
  }
  if (cur.length) blocks.push(cur);

  const objs: any[] = [];
  for (const b of blocks) {
    let question = ''; const options: string[] = []; let answer = '';
    for (const l of b) {
      if (/^(?:quiz\s+)?title\s*[:\-]/i.test(l)) continue;
      const ans = /^(?:correct\s+)?(?:answer|ans)\s*[:\-]\s*(.+)$/i.exec(l);
      const opt = /^\(?([A-F])[\).:]\s*(.+)$/i.exec(l);
      if (ans) answer = ans[1].trim();
      else if (opt) options.push(opt[2].trim());
      else if (!options.length) question += (question ? ' ' : '') + l.replace(/^(?:q(?:uestion)?\s*)?\d+\s*[\).:\-]\s*/i, '').replace(/^q\s*[:\-]\s*/i, '');
    }
    if (question || options.length) objs.push({ question, options, answer });
  }
  return fromObjects(objs, errors);
}

// Parses JSON and repairs the usual copy/paste damage: backslash-escaped brackets (\[ \{ \_), smart quotes,
// trailing commas and text before/after the JSON.
function tryJson(text: string): any {
  const attempt = (t: string) => { try { return JSON.parse(t); } catch { return undefined; } };
  let r = attempt(text);
  if (r !== undefined) return r;
  let t = text
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/[\u2018\u2019]/g, "'")
    .replace(/\\(?!["\\\/bfnrtu])/g, '')      // remove backslashes that are not valid JSON escapes
    .replace(/,\s*([\]}])/g, '$1');             // trailing commas
  r = attempt(t);
  if (r !== undefined) return r;
  const a = Math.min(...['{', '['].map(c => { const i = t.indexOf(c); return i < 0 ? Infinity : i; }));
  const b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (isFinite(a) && b > a) return attempt(t.slice(a, b + 1).replace(/,\s*([\]}])/g, '$1'));
  return undefined;
}

export function parseQuizImport(input: string): ImportResult {
  const errors: string[] = [];
  const text = stripFences(input);
  if (!text) return { questions: [], errors: ['Paste the quiz content first.'] };

  const looksJson = /[\[{]/.test(text.slice(0, 40)) && /"?question"?\s*:/i.test(text);
  if (text.startsWith('{') || text.startsWith('[') || looksJson) {
    const data = tryJson(text);
    if (data === undefined) return { questions: [], errors: ['Could not read this JSON. Copy the full AI answer again (from the first { to the last }) and paste it here.'] };
    const arr = Array.isArray(data) ? data : (data.questions ?? data.quiz?.questions);
    if (!Array.isArray(arr)) return { questions: [], errors: ['JSON must be a list of questions or an object with a "questions" list.'] };
    const questions = fromObjects(arr, errors);
    return { title: clean(data?.title ?? data?.quiz?.title) || undefined, questions, errors };
  }
  const tm = /^\s*(?:quiz\s+)?title\s*[:\-]\s*(.+)$/im.exec(text.replace(/[*_`#]/g, ''));
  const questions = fromText(text, errors);
  if (!questions.length && !errors.length) errors.push('No questions were found.');
  return { title: tm ? clean(tm[1]) : undefined, questions, errors };
}
