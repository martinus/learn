---
name: explainer
description: Creates, updates and translates explainer pages for learn.ankerl.com, and changes the shared theme. Use when the user wants a topic or question explained as a page of the site, wants an existing page refreshed, corrected or translated, or wants a change to the theme in site/assets, the page template or tools/learn.py.
argument-hint: "<question to explain> | update <page>: <what changed>"
---

# Explainer

An explainer is one self-contained page that answers one question: `site/YYYY-MM-DD-slug/index.html` plus `cover.svg`. Defaults, unless the user says otherwise in this task:

- **Reader:** one person. A software engineer, 45, long C++ experience, lives in Austria. Skip what this reader knows and explain the mechanism. Profile: `references/writing.md`.
- **Language:** English only. German only on explicit request ("Add German").
- **Evidence:** current sources, searched in this session. The reader can tell for every statement whether it is sourced, inferred or uncertain.

## Constraints

They hold for every task. Each has its reason, so you can judge cases that the text does not cover.

- **You are the only fact check.** The user merges without reviewing content, and a merge publishes. Verify every fact against its source yourself, twice (step 8).
- **Every fact that can change or be disputed has a source** in the list at the end of the page. Only stable textbook knowledge may come from your own knowledge, and the page says where it does. Rules: `references/research.md`.
- **Nothing invented:** no quotes, numbers or people that a source does not give. Quote at most one phrase under 15 words per source and say the rest in your own words, because the page must respect the copyright of its sources.
- **A page loads nothing from other servers:** no fonts, scripts, images or trackers. Austrian and EU privacy law is the reason, and `check` rejects it.
- **No pictures of real people, no logos.**
- **The AI disclosure stays.** The build writes it from `model` at the four `<!-- learn:... -->` markers. Keep each marker exactly once. Never state that a person checked or reviewed the page, because nobody did.
- **Plain HTML, CSS and JavaScript, no frameworks or packages.** `tools/learn.py` uses only the Python standard library. The site should still build in ten years.
- **Open a pull request and stop.** The user decides every merge.

## Reference files

Read each file when you reach the work it covers. A new page needs the first three.

| File | Read before |
|---|---|
| `references/research.md` | collecting or updating facts; writing "How sure is this?" and "Sources" |
| `references/writing.md` | planning the page and writing any page text |
| `references/components.md` | writing HTML, charts or the cover; changing the theme |
| `docs/decisions.md` | changing the theme, the tool, a template or a site-wide rule |

`site/2026-11-21-*` and `site/2026-11-22-*` show the layout and the quality of the graphics. Their text targets a lay reader and they carry German `data-i18n` keys, so copy neither their depth nor their keys.

## Commands

```
python3 tools/learn.py new YYYY-MM-DD-slug   # copy the template into site/
python3 tools/learn.py check                 # validate all pages, change nothing
python3 tools/learn.py shots [slug]          # build, then screenshots into _shots/ (needs Chrome)
python3 tools/learn.py texts slug            # page text as plain lines, for the final read
python3 tools/learn.py serve                 # build, then http://localhost:8000
```

The build inserts the site bar, byline, section navigation, "Read next" cards and footer, and writes the home page and `share.png`. Write none of these by hand.

## New page

### 1. Scope

Fix the question (one sentence), the reader, the language and the sources. Where the user gave none, take the default and say so in your reply. Ask only if the question itself is unclear.

### 2. Research

Follow `references/research.md`. Result: a fact list in your working notes (not committed). Each entry has the statement, the source URL, the dates, how you read the source, the kind (sourced, inferred, own knowledge) and the state.

### 3. Plan

Decide before you write HTML:

- The one sentence the reader should remember.
- What this reader already knows. The page skips it.
- 4 to 8 sections, each answering one sub-question. One explains how the thing works at the level of the mechanism.
- One graphic per main section: what it shows at rest, and the one thing the reader can change.
- Where code explains faster than prose.
- Where the page simplifies, and what is uncertain.

### 4. Scaffold

`python3 tools/learn.py new YYYY-MM-DD-slug` with today's date. Slug: lowercase letters, digits, hyphens, short. The folder name is the permanent URL. The template is full of `TODO`, and `check` fails until every one is replaced. This is intended.

### 5. Write

- Text: `references/writing.md`. Parts: `references/components.md`. Reuse existing theme parts instead of styling new ones.
- No `data-i18n` attributes. They belong to pages with German text, and `check` rejects them on an English page.
- Mark every inference and every uncertain statement in its own sentence.
- The last two sections are "How sure is this?" and "Sources" (`<ul class="sources">`), followed by `<p class="page-note">`.

### 6. Graphics

Rules: `references/components.md`. Compute the data in the page script. For data from a source, name the source and the date of the data in the caption. Each graphic shows something useful before the reader touches it. Register one redraw function with `Learn.onChange(...)`.

### 7. Metadata and cover

In `<script type="application/json" id="explainer-meta">`:

- `title`: `{"en": "..."}`, at most 60 characters, because longer titles break the preview picture and the section list.
- `summary`: `{"en": "..."}`, two or three sentences. It is the card text on the home page.
- `published`: the date of the folder name. `updated`: the same date on a new page.
- `languages`: `["en"]`.
- `tags`: one to three, from `site.json`. A new tag needs an English and a German name there, because the home page is bilingual.
- `model`: your own model name, as exactly as you know it. Do not copy it from another page.

`cover.svg`: `viewBox="0 0 320 180"`, one simple picture of the main idea, theme colour variables, no text.

### 8. Verify

Repeat until a full pass finds nothing: run, look, fix.

1. `python3 tools/learn.py check` reports no errors.
2. `python3 tools/learn.py shots <slug>`, then open every picture in `_shots/<slug>/`. Files are `<width>-<mode>-<lang>-<part>.png`: 390 px light, 390 px dark, 1440 px light, for `top` and each section. Every earlier page had a layout fault that `check` did not catch and the pictures showed.
3. Open `_site/<slug>/share.png` if the build wrote it. The title fits and the cover is clear.
4. The pictures show the page at rest. With a browser tool, also run `serve`, scroll at 390 px, open the section list under the site bar, use every control once and read the console. Without a browser tool, re-read the page script and state in the pull request that nobody used the controls.
5. Second fact check. Re-open every source and compare every fact, number, name and date on the page with it. Remove what you cannot confirm. Search once more for news that is newer than your sources.
6. Find every statement without a source. It is marked as an inference, or it is stable textbook knowledge. Otherwise find a source or delete it.
7. `python3 tools/learn.py texts <slug>` and read the whole text as the reader. Each sentence is clear without the sentences after it. Each section tells this reader something new.
8. Compile and run every code example if a compiler is available.

Then go through "Done when".

### 9. Hand over

Branch `explainer/<slug>`, commit, push, open a pull request. The description gives: the question, the sources, what is sourced, what is inferred, what is uncertain, and what you could not check or test (a link that did not open, a paywall, controls nobody used, code that was not compiled).

## Add German

Only on request. The tool supports `en` and `de`. Any other language first needs changes in `tools/learn.py` and `theme.js`.

1. Metadata: `"languages": ["en", "de"]`, and a `de` text in `title` and `summary`.
2. Keys and the `#i18n-de` dictionary: "A second language" in `references/components.md`.
3. German style: the German section of `references/writing.md`.
4. `python3 tools/learn.py texts <slug>` prints EN and DE per key. Read them side by side. They say the same things with the same limits.
5. Look at the German pictures at 390 px. German labels run about 30 % longer.

## Update a page

- **Small correction:** fix the text and set `updated` to today.
- **New state of a story:** research first (step 2). Then revise every place that repeats the state: status box, summary cards, lists, body text, `summary` in the metadata, "How sure is this?" and the page note. They must agree, so re-read the whole page instead of appending a paragraph. Update every "status of ..." date, add an entry at the top of the change list (`details.changes`; add the list if the page has none), and set `updated` to today.
- **A page that has German text keeps it.** Change the German value of a key in the same commit as the English text. `check` finds a missing key but not a stale translation. Remove German only on request.
- The folder name never changes, because it is the URL.
- If an old statement was wrong, say so in the pull request instead of silently replacing it.
- Then do steps 8 and 9.

## Comments from the reader

The reader writes comments on a live page (footer button "Comment on this page"). The panel makes one prompt from them, by "Copy prompt" or as a GitHub issue. The prompt names the page, the version date and each comment with its section and quoted text. The reader is the only reviewer of the site, so treat each comment as a review finding.

1. Read the whole page first. The page can be newer than the comment: the prompt gives the version date the reader saw. If a quote is no longer in the page, find the place where it moved, or report that it is gone.
2. Sort each comment: a question, a correction, or a request (more depth, a graphic, shorter text).
3. **Question:** answer it in the pull request. If this reader needs the answer to understand the page, also add it to the page.
4. **Correction:** research it (`references/research.md`) before you change anything. The reader can be wrong. Change the page only if current sources support the correction. If they do not, keep the text and give the sources in the pull request.
5. **Request:** do it if it fits this skill. If it does not, say why in the pull request.
6. Then "Update a page": `updated` is today, and a story in progress gets an entry in the change list. Then steps 8 and 9. Branch: `explainer/<slug>-comments`.
7. The pull request lists each comment (short), what you did, and the sources. If the prompt came from a GitHub issue, write `Closes #<number>`.

## Change the theme or the tool

- `site/assets/theme.css` and `theme.js` affect every page. Run `python3 tools/learn.py shots` (no slug) and look at all pages.
- A new part goes into the theme only when a second page needs it. Until then it lives in the `<style>` of its page.
- Document every shared part in `references/components.md`.
- Keep the names of the colour variables, because pages use them.
- A change to how the site works also updates `docs/decisions.md` in the same pull request.

## Improve these instructions

When you hit a problem that the next agent would also hit, add the rule with its reason to the file where it applies, in the same pull request. These files are read only by agents. Keep them short and specific, and remove a rule that no longer holds.

## Done when

- [ ] `check` passes, and you looked at every picture from `shots`: 390 px without horizontal scrolling, controls large enough for a finger, 1440 px with sharp and complete figures and a correct section list, light and dark both readable.
- [ ] The first screen says what the page answers and why it matters.
- [ ] The page explains the mechanism, and explains nothing that a software engineer already knows.
- [ ] Each section makes one clear statement, and each main section has a graphic with correct axes, units and caption numbers.
- [ ] Every fact that can change was searched in this session and carries a date.
- [ ] Every fact, number, name and date was compared with its source a second time.
- [ ] Every inference and every uncertain statement is marked in its sentence, and "How sure is this?" is complete and true.
- [ ] Every source entry has its kind and date, and its link opens the exact page.
- [ ] Every code example is correct, and was compiled or is reported as not compiled.
- [ ] Every term from outside software is explained where it first occurs.
- [ ] Section headings are short enough for the navigation.
- [ ] The page note says where the page simplifies and gives the date of the facts.
- [ ] `updated` is today.
- [ ] With German text: every key is translated and says the same as the English.
