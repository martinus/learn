# Theme parts

All parts live in `site/assets/theme.css` and `site/assets/theme.js`. Use them as they are. `site/2026-11-21-riemann-hypothesis-claim/index.html` shows every part in use. That page has German text, so its elements carry `data-i18n` keys. An English page has none.

Contents: Page frame · What the build adds · Colours · Text parts · Figures · Chart helpers · Rules for graphics · Pitfalls · A second language · Review mode · Cover

## Page frame

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Title in English</title>
<script type="application/json" id="explainer-meta">{ ... }</script>
<!-- learn:head -->
<style>/* only what this page needs */</style>
</head>
<body>
<!-- learn:header -->
<main class="explainer">
  <header> ... <h1>...</h1> <!-- learn:byline --> ... </header>
  <section> ... </section>
</main>
<!-- learn:footer -->
<script>/* page script */</script>
</body>
</html>
```

The build replaces the four `learn:` markers. The viewport tag, font links, site bar and footer come from the build.

## What the build adds

- **Section ids and anchors.** Write each section exactly as `<section>` followed by `<span class="num">01</span>` and one `<h2>`. The build turns this into `<section id="s01">` and makes the number a link. Write no ids yourself. Every section has its own number.
- **Section navigation.** With three or more sections, the current section shows under the site bar, and on a wide screen all sections show in the left margin. The text is the `<h2>`, so keep headings short.
- **Wide figures.** On a desktop, a `<figure>` that is a direct child of a section is 10 rem wider than the text.
- **"Read next"** cards for up to three other pages.
- **`share.png`** from the English title, the tags and `cover.svg`. Chat programs show it for a link. The cover appears large on white there.

## Colours

Use the variables and write no colour values in a page, because the dark mode swaps the variables.

| Variable | Use |
|---|---|
| `--paper`, `--surface` | page background, background of cards and figures |
| `--ink`, `--muted`, `--rule` | text, secondary text, lines |
| `--c1` | main series of a chart, links, active controls |
| `--c2` | second series, or a permitted range (`--band` is its transparent fill) |
| `--c3` | highlight: the thing the reader must look at |
| `--good`, `--warn` | state only (passed, open), never decoration |
| `--tint` | quiet background for small boxes |

Give each colour one meaning per page and keep it.

The fixed-width font (`--font-mono`) means code: a code block, terminal output, a log, and a code word with the class `mono`. Do not use it as a style for labels, dates, numbers or chart text, and not for a formula. `check` rejects it in the `<style>` of a page.

## Text parts

```html
<span class="eyebrow">Physics</span>             <!-- topic line above the title -->
<p class="lead">...</p>                          <!-- opening paragraph -->
<span class="num">01</span>                      <!-- section number, above each h2 -->
<p class="aside">...</p>                         <!-- a comparison, or a limit of the page -->
<p class="small">...</p>                         <!-- a less important note -->
<span class="mono">canvas.rs</span>              <!-- code word inside a sentence: a file, a command, an identifier -->
<ul class="plain"> <li>...</li> </ul>            <!-- normal list -->
<p class="page-note">...</p>                     <!-- last element in main: limits, date of the facts -->
```

### Code block

Escape `<`, `>` and `&`. A phone shows about 42 characters per line and scrolls a longer line inside the block, so keep lines short. Put a comment where the reader should look.

```html
<pre class="code" data-lang="cpp"><code>// C++20
std::span&lt;const int&gt; s{v};
</code></pre>
```

`data-lang` switches on syntax colours: `cpp`, `c`, `js`, `py`, `sh` or `rust`. `theme.js` colours comments, strings, numbers and keywords when the page loads. Write plain text inside `<code>`, with no `<span>` of your own. Leave `data-lang` out for output, pseudocode or any other language. A new language needs its keyword list in `KEYWORDS` in `theme.js`.

### Formula

Write mathematics as MathML, which browsers draw without a library. `writing.md` says when a formula is the right form. Inline: `<math>` inside the sentence, also for a single symbol, so that a symbol looks the same in the text and in the formula. On its own line:

```html
<div class="formula"><math display="block">
  <mi>D</mi><mo stretchy="false">(</mo><mi>z</mi><mo stretchy="false">)</mo><mo>=</mo>
  <mfrac><mi>c</mi><msub><mi>H</mi><mn>0</mn></msub></mfrac>
  <msubsup><mo>&int;</mo><mn>0</mn><mi>z</mi></msubsup>
  <mfrac><mrow><mi>d</mi><mi>x</mi></mrow><mrow><mi>E</mi><mo stretchy="false">(</mo><mi>x</mi><mo stretchy="false">)</mo></mrow></mfrac>
</math></div>
```

- `<mi>` variable or function name, `<mn>` number, `<mo>` operator or bracket. `<msub>`, `<msup>`, `<msubsup>`, `<mfrac>`, `<msqrt>` take their parts as children. Group several elements into one part with `<mrow>`.
- Put `stretchy="false"` on every bracket around flat content. Without it, a bracket grows to the height of the tallest element in the row, for example a fraction next to it.
- Write a sign as `<mo form="prefix">&minus;</mo>` when it follows another operator, as in "= −1". Without it the minus gets the wide spacing of a subtraction.
- Do not write `xmlns` on `<math>`. HTML does not need it.
- A formula wider than a phone scrolls inside its block. Aim for under about 330 px at 390 px width: name a long term in the text and use the name.
- The formula uses a math font of the device and loads none. A device without one shows plainer signs, and a tall root or bracket does not grow there. So keep the content of `<msqrt>` and of stretching brackets flat.

### Status box

For a story in progress or one important limit. At most one per page, directly under the lead.

```html
<div class="status">
  <b>Status: first checks passed, one check open</b>
  <span>Two or three sentences with a date.</span>
</div>
```

### Change list

For a story in progress, directly under the status box. Closed at the start, newest entry first. Each entry says in one or two sentences what changed for the reader.

```html
<details class="changes">
  <summary><span>What changed on this page</span></summary>
  <ol>
    <li><time>22 Nov 2026</time><span>New section 06 about the second proof.</span></li>
    <li><time>21 Nov 2026</time><span>First version.</span></li>
  </ol>
</details>
```

### Summary cards

Two to four cards under the lead.

```html
<div class="short">
  <div><h3>The riddle</h3><span>Two sentences.</span></div>
  ...
</div>
```

### Comparison cards

Two things side by side. `done` and `open` show a state, `a` and `b` show two equal sides.

```html
<div class="worlds">
  <div class="world a">
    <span class="tag">Proof 1</span>
    <h3>Name</h3>
    <dl><dt>Form</dt><dd>computer file</dd></dl>
  </div>
  <div class="world b"> ... </div>
</div>
```

### Boxes for people or roles

```html
<div class="who">
  <div><strong>Name</strong> did this.</div>
</div>
```

### Check list with state pills

```html
<ul class="checks">
  <li><span class="pill done">Passed</span>
      <span><span>What was checked.</span><span class="d">Detail and source.</span></span></li>
</ul>
```

Pills: `done` (passed), `rep` (reported, not confirmed), `prog` (in progress or open), `no` (not yet). The word in the pill carries the state. The colour only supports it.

### "How sure is this?"

The section directly before "Sources". It uses the check list with three fixed pills. `research.md` says what each row contains. A group may have more than one row.

```html
<ul class="checks">
  <li><span class="pill done">Sourced</span>
      <span><span>Main statements that rest on primary sources.</span><span class="d">What rests only on reporting.</span></span></li>
  <li><span class="pill rep">Inferred</span>
      <span><span>Every important inference of the page.</span></span></li>
  <li><span class="pill prog">Uncertain</span>
      <span><span>What is disputed, unresolved or weakly sourced.</span><span class="d">Sources read only as an abstract.</span></span></li>
</ul>
```

### Timeline, glossary, sources, table

```html
<ol class="steps"><li><time>6 Oct</time><span>What occurred.</span></li></ol>

<dl class="gloss"><div><dt>Term</dt><dd>One sentence.</dd></div></dl>

<ul class="sources"><li><a href="https://...">Who: what</a> &middot; kind of source, date</li></ul>

<div class="scroll-x"><table> ... </table></div>   <!-- a table may scroll sideways, the page may not -->
```

## Figures

Every graphic sits in a `<figure>`. The order inside is fixed: title, controls, legend, chart, numbers, caption.

```html
<figure>
  <div class="fig-title">True count and prediction</div>
  <div class="ctl">
    <label for="xs"><span>Count the primes up to X</span> <output id="xo">X = 100</output></label>
    <input type="range" id="xs" min="2" max="6" step="0.01" value="2">
  </div>
  <div class="legend">
    <span><i class="sw"></i><span>true count</span></span>
    <span><i class="sw c2"></i><span>prediction</span></span>
  </div>
  <svg class="chart" id="cA" role="img" aria-label="One sentence that says what the chart shows"></svg>
  <div class="stats">
    <div><small>Primes up to X</small><b id="rPi">25</b></div>
  </div>
  <figcaption>What the reader must see.</figcaption>
</figure>
```

- Legend marks: `sw` (line in `--c1`), `sw c2` (dashed), `sw c3`, `sw ink`, `sw band` (filled range).
- Action button: `<button type="button" class="act">`.
- Small picture next to text: `<div class="split"><svg ...></svg><div class="txt">...</div></div>`. It stacks on a phone.
- Chart mark classes: lines `l-c1`, `l-c2`, `l-c3`, `l-ink`, `l-base`; filled range `f-band`; dots `d-c1`, `d-c3`; text `lbl`, `t-c2`, `t-c3`.
- A picture with a fixed layout (diagram, map) is a normal inline `<svg viewBox="...">` with `max-width` and the classes above.

## Chart helpers in `theme.js`

```js
var L = window.Learn;
L.fmt(1234567)                // "1,234,567"
L.sgn(-5.13, 1)               // "−5.1": fixed decimals, real minus sign
L.short(250000)               // "250k": short axis label
L.mk('path', {d: d, 'class': 'l-c1'}, svg)   // create an SVG element and append it
L.clear(svg)                  // remove all children

// Prepare a chart at its real pixel width. Draws the grid and the axis labels.
var p = L.plot(svg, {h: 220, x0: 0, x1: 100, y0: 0, y1: 30});
p.sx(x); p.sy(y);             // data value to pixel
p.w; p.h; p.m;                // width, height, margins {l, r, t, b}

L.onChange(draw);             // calls draw now, and again when the page width or the language changes
```

`L.plot` uses the real width of the element, so chart text has the same size on a phone and on a desktop. This is why a chart is redrawn through `L.onChange` when the width changes.

## Rules for graphics

1. **One graphic, one message.** The caption states it. If it does not fit into one sentence, make two graphics.
2. **Useful at rest.** The start position of each control shows the most instructive state.
3. **The reader changes one thing.** One slider or button with a clear effect beats a static picture. Three controls on one chart are too many.
4. **Real data.** Compute the values, or take them from a source and name it with the date of the data. Never draw a curve that only looks about right.
5. **Honest scales.** Bars start at zero. Charts that are compared share a scale. Say when an axis is logarithmic.
6. **Direct labels.** Names at the lines or in a legend above the chart. Axes carry units.
7. **Colour is never the only signal.** Add a dash pattern, a label or a shape.
8. **Phone first.** Readable at 340 px. Sliders work with a finger. Nothing depends on hover.
9. **Motion on request.** An animation starts with a button, and the button stops it.
10. **Numbers through the helpers:** `L.fmt` or `L.sgn` for every number the script writes.
11. **Described.** Each chart has `role="img"` and an `aria-label` that says what it shows.

## Pitfalls

Each of these happened on an earlier page.

- **A chart in a hidden element has no width.** Redraw it when it becomes visible, or do not hide it.
- **A fixed-size picture inside a wide figure does not grow.** Check it at 1440 px.
- **Sticky parts cover content.** After a jump to a section, the site bar and the section row sit above the text. The theme reserves space with `scroll-padding-top`. If you add a sticky part, test a jump to every section.
- **Pictures find what `check` cannot:** text that touches, a row that covers a heading, a menu with a transparent background. Look at every picture.

## A second language

An English page has `"languages": ["en"]`, no `data-i18n` attributes and no `#i18n-de`. For German text, on request only:

- Set `"languages": ["en", "de"]`. The site bar then shows the language switch, and the page starts in German in a browser set to German.
- English stays in the HTML. Every element with text gets `data-i18n="key"`. The German text per key goes into `<script type="application/json" id="i18n-de">{ ... }</script>`, directly before the page script. Values may contain HTML such as `<strong>` and `&middot;`.
- An `aria-label` gets `data-i18n-aria="key"`, with its German text in the same JSON.
- Put the key on the smallest element that contains only text. The switch replaces the whole content of the element, so a key on an element that contains an `<output>`, a control or a chart deletes that child.
- The same key on two elements is fine when the text is the same.
- Keys are short and follow the page: `s1h`, `s1p1` for section 1, `f1t`, `f1c` for figure 1.
- `check` requires identical key sets in HTML and JSON. It cannot see a stale translation, so change both languages in the same commit.
- Text written by the script needs both languages: `L.t({en: 'tones', de: 'Töne'})`. `L.lang()` returns `"en"` or `"de"`. `L.fmt` and `L.sgn` follow the language (1,234,567 or 1.234.567). This text is the easiest to forget: chart labels, slider results, buttons that change their label.
- German labels run about 30 % longer. Check buttons, pills, legends and number boxes in German at 390 px.
- A code block gets no key and is not translated.

## Review mode

URL settings for screenshots. They apply to one page view and are not stored. Combine them with `&`. `python3 tools/learn.py shots` uses them.

| Setting | Effect |
|---|---|
| `?theme=dark` or `?theme=light` | colour mode |
| `?lang=de` or `?lang=en` | language, on a page with German text |
| `?only=s03` | show only section 03. `?only=top` shows only the page header |
| `?review=1` | the page writes its content height into `data-review-height` on `<html>` |

## Comments

`assets/comments.js` and `assets/comments.css` let the reader write comments on an explainer and turn them into a prompt for an agent ("Comments from the reader" in `SKILL.md`). A page needs nothing for this. The build writes `data-repo`, `data-src` and `data-updated` on `<html>` and the footer button `[data-comments-on]`. `theme.js` loads the two files only after the reader presses the button, and in review mode it never loads them.

- A comment finds its text again by the text itself and the number of the occurrence in its section. A change of the text, or the other language, loses the mark but keeps the comment.
- Elements with the class `cm-ui` belong to the comments. The text search skips them. Do not use the prefix `cm-` in a page.
- A page script that rewrites text with `innerHTML` removes the marks in that part until the next `Learn.onChange` call.

## Cover

`cover.svg` has `viewBox="0 0 320 180"`. The home page inlines it into the card, so theme variables work: write `style="stroke:var(--c1)"`, not fixed colours. No text. Keep it simple, because it is small on a phone and large in `share.png`.
