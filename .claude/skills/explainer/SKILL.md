---
name: explainer
description: Create a new explainer for learn.ankerl.com, or update one. Use this skill when the user wants a topic explained as a page of the site, wants to refresh or correct a page, wants a translation of a page, or wants a change to the shared theme.
---

# Explainer

An explainer is one page of learn.ankerl.com. It answers one question for a reader who has no special knowledge. It uses plain language and graphics that the reader can change.

Read these three files before you write:

- `references/writing.md`: rules for the text, in English and German.
- `references/components.md`: the HTML parts of the theme, the chart helpers, and the rules for graphics.
- `references/lessons.md`: problems from earlier work, and how to prevent them.

`docs/decisions.md` in the repository gives the reasons for how the site works. Read it before you change the theme or the tool.

The best example is the newest folder in `site/`. Read its `index.html` to see the level of quality that is necessary.

## How the site works

- Each explainer is a folder `site/YYYY-MM-DD-slug/` with `index.html` and `cover.svg`. The date is the day of publication.
- `site/assets/theme.css` and `site/assets/theme.js` are the shared theme. They supply the colours, the bright and dark mode, the language switch and the chart helpers.
- `tools/learn.py` builds the site into `_site/`. The build adds the site bar, the byline, the section links, the "Read next" cards and the footer to each page. It writes the home page and a preview picture for each page. The preview pictures need Chrome or Chromium on the computer. Without it, the build works but writes no pictures.
- A push to `main` starts the deployment to GitHub Pages. You do not start it yourself.

Commands:

```
python3 tools/learn.py new 2026-12-01-how-gps-works   # start from the template
python3 tools/learn.py check                          # examine all pages
python3 tools/learn.py serve                          # build and open http://localhost:8000
python3 tools/learn.py shots 2026-12-01-how-gps-works # pictures of each section, into _shots/
python3 tools/learn.py texts 2026-12-01-how-gps-works # English and German text, key by key
```

## Make a new explainer

Do the steps in this sequence.

### 1. Make the task clear

You must know these four things. If the user did not give them, select a sensible default and tell the user which one you selected.

- **The question.** One sentence, for example "How does GPS find my position?".
- **The reader.** Default: an adult with interest, but without knowledge of the subject.
- **The languages.** Default: English and German.
- **The sources.** Documents or links from the user, and what you find yourself.

Ask the user only if the question itself is unclear.

### 2. Collect the facts

- Read all sources that the user gave, fully.
- Search for more sources if you have a search tool. Prefer original sources: papers, official pages, the people who did the work.
- Keep a list: fact, source, date of the source.
- For news that is still in progress, find the newest state. Write down the time of each state.
- Do not use a fact that you cannot connect to a source. Do not fill a gap with a guess.

### 3. Plan the page

Write the plan before you write HTML:

- The one sentence that a reader must remember.
- 4 to 8 sections. Each section answers one smaller question.
- One graphic for each main section. Decide what the reader sees and what the reader can change.
- One comparison from daily life for each difficult idea.
- What the page cannot explain, and where it simplifies.

### 4. Start from the template

Run `python3 tools/learn.py new YYYY-MM-DD-slug`. Use today's date. The slug has small letters, digits and hyphens, and is short.

The template contains the word `TODO` in many places. The check fails until all of them are gone. This is intended.

### 5. Write the English page

- Follow `references/writing.md`.
- Use the parts from `references/components.md`. Do not invent a new style for something that the theme already has.
- Give each element with text a `data-i18n` key. Give each `aria-label` a `data-i18n-aria` key.
- Keep these markers. Each must be in the page one time: `<!-- learn:head -->`, `<!-- learn:header -->`, `<!-- learn:byline -->`, `<!-- learn:footer -->`.
- End with a section "Sources" that contains `<ul class="sources">`.

### 6. Make the graphics

- Follow the rules for graphics in `references/components.md`.
- Calculate the data in the page script. If a number comes from a source, name the source in the caption.
- Each graphic must show something useful before the reader touches it.
- Register one function with `Learn.onChange(...)` that draws all graphics again.

### 7. Add the German text

- Put the German text into `<script type="application/json" id="i18n-de">`: one entry for each key.
- Translate the meaning, not word by word. Follow the German rules in `references/writing.md`.
- Text that the script writes (labels, results of a slider) needs the two languages too. Use `Learn.t({en: '...', de: '...'})` and `Learn.fmt(...)` for numbers.

### 8. Fill the metadata and the cover

In `<script type="application/json" id="explainer-meta">`:

- `title`, `summary`: one text for each language. The summary has two or three sentences. It is the text of the card on the home page.
- `published`: the date in the folder name. `updated`: the same date for a new page.
- `tags`: one to three. Use tags from `site.json` if they fit. Add a new tag to `site.json` with its English and German name.
- `model`: your own model name, as exactly as you know it. Do not copy the name from a different page.
- `reviewed_by`: keep it empty. Fill it only when the user says that a person read and confirmed the page.

Draw `cover.svg` (320 x 180): one simple picture of the main idea, with the colours of the theme. Use no text in it.

### 9. Check, build, look

1. Run `python3 tools/learn.py check`. Correct all errors.
2. Run `python3 tools/learn.py shots <slug>`. It writes one picture for each section into `_shots/<slug>/`: at 390 px in bright mode and English, at 390 px in dark mode and German, and at 1440 px. Look at all pictures. Correct what is wrong, and run the command again.
3. If you have a browser tool, also open the page with `python3 tools/learn.py serve`. Scroll down at 390 px and open the list of sections under the site bar. The pictures from step 2 do not show this.
4. Look at `_site/<slug>/share.png`, if the build wrote it. The title must fit and the cover must be clear.
5. If you have a browser tool, use each control one time and look for errors in the browser console. If you have none, read the page script one more time, and say in the pull request that nobody used the controls.
6. Run `python3 tools/learn.py texts <slug>`. Read the full text one more time as the reader, in each language. Each sentence must be clear without the sentences after it. The German text must say the same as the English text.

Then go through the checklist at the end of this file.

### 10. Hand over

- Make a branch `explainer/<slug>`. Commit. Push. Open a pull request.
- Do not merge. The user merges after reading the page. Merging is the review by a person.
- In the pull request, give: the question of the page, the sources, what is uncertain, and what you could not check.

## Update an explainer

- **A small correction:** change the text in English and in German. Set `updated` to today.
- **New state of a story:** collect the new facts with sources first. Change the status box, the lists and the text that are no longer correct. Do not only add a paragraph at the end. Update each date in the text ("status of ..."). Add an entry at the top of the change list (`details.changes`, see `references/components.md`). If the page has no change list, add one. Set `updated` to today.
- Do not change the folder name. The address of a page must stay the same.
- Do not delete an old statement silently if it was wrong. Say in the pull request what was wrong.
- Then do steps 9 and 10.

## Change the theme

- A change in `site/assets/theme.css` or `theme.js` changes all pages. After the change, look at each explainer, not only at one.
- Add a part to the theme only if a second explainer needs it. Until then, keep it in the `<style>` of the page.
- Add each new shared part to `references/components.md`.
- Run `python3 tools/learn.py shots` without a name. It makes pictures of all pages. Look at them.
- If you change how the site works, update `docs/decisions.md`.
- Keep the names of the colour variables. Pages use them.

## Rules that have no exception

- **Honesty before effect.** Say what is known, what is claimed and what is open. For a story in progress, start with a status box and a date.
- **Each fact has a source.** The reader can find each source in the list at the end.
- **No invented quotes, numbers or people.** Quote at most one short phrase from each source. Say all other things in your own words.
- **The page loads nothing from other servers.** No fonts, scripts, pictures or trackers from outside. The check enforces this.
- **No pictures of real people, and no logos.**
- **The page says that an AI made it.** The build writes this from `model`. Do not remove the markers.
- **The page works without a build framework.** Plain HTML, CSS and JavaScript. `tools/learn.py` uses only the Python standard library.

## Checklist before the pull request

- [ ] `python3 tools/learn.py check` shows no errors.
- [ ] The first screen tells the reader what the page is about and why it matters.
- [ ] Each section has one clear statement. Each main section has a graphic.
- [ ] Each graphic is correct: the axes, the units, the numbers in the caption.
- [ ] Each difficult word is explained where it first occurs, or it is replaced.
- [ ] The page is good at 390 px: no horizontal scrolling, text is readable, controls are large enough for a finger.
- [ ] The page is good at 1440 px: wide figures are sharp and complete, the list of sections in the margin is correct.
- [ ] The headings of the sections are short enough for the navigation.
- [ ] Bright mode and dark mode are both readable.
- [ ] English and German are complete. Numbers and dates use the format of the language.
- [ ] The sources are complete and the links are correct.
- [ ] The page says where it simplifies and what it cannot tell.
- [ ] `updated` has today's date.
