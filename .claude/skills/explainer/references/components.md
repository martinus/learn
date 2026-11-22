# Parts of the theme

All parts are in `site/assets/theme.css` and `site/assets/theme.js`. Use them as they are. A working example of each part is in `site/2026-11-21-riemann-hypothesis-claim/index.html`.

## Frame of a page

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
<script type="application/json" id="i18n-de">{ ... }</script>
<script>/* page script */</script>
</body>
</html>
```

The build replaces the four `learn:` markers. Do not write a viewport tag, font links, the site bar or the footer yourself.

## What the build and the theme add without your help

- **Section ids and link marks.** Write each section exactly as `<section>` and then `<span class="num">01</span>`. The build makes `<section id="s01">` from it, and makes the number a link to the section. Do not write ids yourself. Each section needs its own number and one `<h2>`.
- **Section navigation.** With three or more sections, the theme shows the current section under the site bar. On a wide screen it shows all sections in the left margin. The text comes from the `<h2>` of each section, so keep the headings short.
- **Wider figures.** On a desktop, each `<figure>` that is a direct child of a section is wider than the text. A chart must draw again when its width changes. `Learn.onChange` does that.
- **"Read next".** The build adds cards for up to three other explainers at the end of the page.
- **Preview picture.** The build makes `share.png` from the English title, the tags and `cover.svg`. Chat programs and social networks show it for a link. The cover is large there, on a white background, so it must look good in that size too.

## Colours

Use the variables. Do not write colour values in a page.

| Variable | Use |
|---|---|
| `--paper`, `--surface` | background of the page, background of cards and figures |
| `--ink`, `--muted`, `--rule` | text, secondary text, lines |
| `--c1` | the main series of a chart, links, active controls |
| `--c2` | the second series, or a permitted range (`--band` is its transparent fill) |
| `--c3` | a highlight: the thing the reader must look at |
| `--good`, `--warn` | state only: passed, open. Never as decoration |
| `--tint` | a quiet background for small boxes |

Give each colour one meaning on a page and keep it. In the Riemann page, blue is always "the true count" and raspberry is always "zeros and tones".

## Text parts

```html
<span class="eyebrow" data-i18n="ey">Physics</span>          <!-- topic line above the title -->
<p class="lead" data-i18n="lead">...</p>                      <!-- opening paragraph -->
<span class="num">01</span>                                   <!-- section number, above each h2 -->
<p class="aside" data-i18n="...">...</p>                      <!-- a comparison, or a limit of the page -->
<p class="small" data-i18n="...">...</p>                      <!-- a less important note -->
<span class="mono">ln(t)</span>                               <!-- a formula or a code word -->
<ul class="plain"> <li>...</li> </ul>                         <!-- a normal list -->
<p class="page-note" data-i18n="foot">...</p>                 <!-- last element in main: limits, date of the facts -->
```

### Status box

For a story in progress, or for one important limit. At most one on a page, directly under the lead.

```html
<div class="status">
  <b data-i18n="st_b">Status: first checks passed, one check open</b>
  <span data-i18n="st_t">Two or three sentences with a date.</span>
</div>
```

### Change list

For a story in progress. Put it directly under the status box. It is closed at the start. The newest entry is first. Each entry says what changed for the reader, in one or two sentences.

```html
<details class="changes">
  <summary><span data-i18n="chg_h">What changed on this page</span></summary>
  <ol>
    <li><time data-i18n="chg2d">22 Nov 2026</time><span data-i18n="chg2t">New section 06 about the second proof.</span></li>
    <li><time data-i18n="chg1d">21 Nov 2026</time><span data-i18n="chg1t">First version.</span></li>
  </ol>
</details>
```

### Summary cards

Two to four cards under the lead. A reader who stops here has the essentials.

```html
<div class="short">
  <div><h3 data-i18n="c1h">The riddle</h3><span data-i18n="c1t">Two sentences.</span></div>
  ...
</div>
```

### Comparison cards

Two things next to each other. `done` and `open` show a state. `a` and `b` show two equal sides.

```html
<div class="worlds">
  <div class="world a">
    <span class="tag" data-i18n="...">Proof 1</span>
    <h3 data-i18n="...">Name</h3>
    <dl><dt data-i18n="...">Form</dt><dd data-i18n="...">computer file</dd></dl>
  </div>
  <div class="world b"> ... </div>
</div>
```

### Boxes for people or roles

```html
<div class="who">
  <div data-i18n="who1"><strong>Name</strong> did this.</div>
</div>
```

### Check list with state

```html
<ul class="checks">
  <li><span class="pill done" data-i18n="plOk">Passed</span>
      <span><span data-i18n="k1t">What was checked.</span><span class="d" data-i18n="k1d">Detail and source.</span></span></li>
</ul>
```

Pills: `done` (passed), `rep` (reported, not confirmed), `prog` (in progress or open), `no` (not yet). The word in the pill says the state. The colour only supports it.

### Timeline list, glossary, sources, table

```html
<ol class="steps"><li><time>6 Oct</time><span data-i18n="...">What occurred.</span></li></ol>

<dl class="gloss"><div><dt data-i18n="g1t">Term</dt><dd data-i18n="g1d">One sentence.</dd></div></dl>

<ul class="sources"><li><a href="https://..." data-i18n="src1">Who: what</a></li></ul>

<div class="scroll-x"><table> ... </table></div>   <!-- a table can scroll sideways, the page cannot -->
```

## Figures

Each graphic is in a `<figure>`. The sequence inside is fixed: title, controls, legend, chart, numbers, caption.

```html
<figure>
  <div class="fig-title" data-i18n="f1t">True count and prediction</div>
  <div class="ctl">
    <label for="xs"><span data-i18n="f1l">Count the primes up to X</span> <output id="xo">X = 100</output></label>
    <input type="range" id="xs" min="2" max="6" step="0.01" value="2">
  </div>
  <div class="legend">
    <span><i class="sw"></i><span data-i18n="lg1a">true count</span></span>
    <span><i class="sw c2"></i><span data-i18n="lg1b">prediction</span></span>
  </div>
  <svg class="chart" id="cA" role="img" aria-label="One sentence that says what the chart shows" data-i18n-aria="aA"></svg>
  <div class="stats">
    <div><small data-i18n="stA">Primes up to X</small><b id="rPi">25</b></div>
  </div>
  <figcaption data-i18n="f1c">What the reader must see.</figcaption>
</figure>
```

- Legend marks: `sw` (line in `--c1`), `sw c2` (dashed), `sw c3`, `sw ink`, `sw band` (filled range).
- A button that starts an action: `<button type="button" class="act">`.
- A small picture next to text: `<div class="split"><svg ...></svg><div class="txt">...</div></div>`. It stacks on a phone.
- Classes for chart marks: lines `l-c1`, `l-c2`, `l-c3`, `l-ink`, `l-base`; filled range `f-band`; dots `d-c1`, `d-c3`; text `lbl`, `t-c2`, `t-c3`.

## Chart helpers in `theme.js`

```js
var L = window.Learn;
L.lang()                      // "en" or "de"
L.t({en: 'tones', de: 'Töne'})// text for the current language
L.fmt(1234567)                // "1,234,567" or "1.234.567"
L.sgn(-5.13, 1)               // "−5.1" or "−5,1": fixed decimals, real minus sign
L.short(250000)               // "250k": short axis label
L.mk('path', {d: d, 'class': 'l-c1'}, svg)   // make an SVG element and add it
L.clear(svg)                  // remove all children

// Prepare a chart at its real pixel width. Draws the grid and the axis labels.
var p = L.plot(svg, {h: 220, x0: 0, x1: 100, y0: 0, y1: 30});
p.sx(x); p.sy(y);             // data value to pixel
p.w; p.h; p.m;                // width, height, margins {l, r, t, b}

// Call draw at the start, and again when language or page width changes.
L.onChange(draw);
```

`L.plot` uses the real width of the element, so text in a chart has the same size on a phone and on a desktop. Because of this, a chart must be drawn again when the width changes. `L.onChange` does that.

For a picture with a fixed layout (a diagram, a map), write a normal inline `<svg viewBox="...">` with `max-width` and use the classes above.

## Rules for graphics

1. **One graphic, one message.** Write the message into the caption. If you cannot say it in one sentence, make two graphics.
2. **Useful at rest.** The start position of each control must show the most instructive state.
3. **Let the reader change one thing.** A slider or a button with a clear effect is better than a static picture. Three controls on one chart are too many.
4. **Real data.** Calculate the values, or take them from a source and name it. Never draw a curve "that looks about right".
5. **Honest scales.** Bars start at zero. If two charts are compared, they have the same scale. Say it if an axis is logarithmic.
6. **Label directly.** Put names at the lines or in a legend above the chart. Give axes their units.
7. **Colour is never the only signal.** Use a dashed line, a label or a shape too.
8. **Phone first.** A chart must be readable at a width of 340 px. Sliders must be easy to use with a finger. Nothing depends on hover.
9. **Motion only on request.** An animation starts with a button, and the button can stop it.
10. **Both languages.** Each label that the script writes uses `L.t` or `L.fmt`.
11. **Describe it.** Each chart has `role="img"` and an `aria-label` that says what it shows.

## Two languages

- English text is in the HTML. Each element with text has `data-i18n="key"`. The German text for the key is in `#i18n-de`. Values can contain HTML such as `<strong>` and `&middot;`.
- An `aria-label` gets `data-i18n-aria="key"`. Its German text is in the same JSON.
- Put the key on the smallest element that contains only text. Do not put it on an element that contains an `<output>`, a control or a chart, because the switch replaces the full content of the element.
- The same key on two elements is permitted if the text is the same (for example the word "Passed" in a list).
- Keys are short and follow the page: `s1h`, `s1p1` for section 1, `f1t`, `f1c` for figure 1.
- The check compares the keys of the HTML with the keys of the JSON. They must be identical.
- A page in one language has `"languages": ["en"]`, no `data-i18n` keys and no `#i18n-de`.

## Cover

`cover.svg` has `viewBox="0 0 320 180"`. The home page puts it into the card, so the theme variables work. Use `style="stroke:var(--c1)"` and not fixed colours. Use no text. Keep it simple: the cover is small on a phone.
