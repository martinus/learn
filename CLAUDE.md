# learn.ankerl.com

This repository is the website https://learn.ankerl.com. It contains explainers: single pages that explain one topic in plain language, with interactive graphics. AI models make the pages. Martin Leitner-Ankerl publishes them.

## Use the skill

For each of these tasks, load the skill `explainer` (`.claude/skills/explainer/SKILL.md`) and follow it:

- make a new explainer
- update, correct or translate an explainer
- change the shared theme

## Layout

```
site/                       the website (source)
  assets/theme.css          shared styles: colours, type, all shared parts
  assets/theme.js           bright/dark mode, language switch, chart helpers
  assets/fonts/             font files with their licences
  YYYY-MM-DD-slug/          one explainer: index.html and cover.svg
templates/                  page parts that the build inserts, and the start template
tools/learn.py              check, build, serve, new, shots, texts (Python standard library only; Chrome is optional, for pictures)
site.json                   name, address, publisher, contact address, names of the tags
docs/decisions.md           decisions about the site, with reasons
docs/ideas.md               things that are not built
_site/                      build result (not in git)
_shots/                     pictures from the shots command (not in git)
```

## Commands

```
python3 tools/learn.py check
python3 tools/learn.py serve
python3 tools/learn.py new YYYY-MM-DD-slug
python3 tools/learn.py shots [slug]      # pictures of the pages into _shots/, to look at the result (needs Chrome)
python3 tools/learn.py texts slug        # English and German text of one page, key by key
```

## Before you start

1. Update your copy: `git checkout main && git pull`. Then make a branch.
2. Read `docs/decisions.md`. It gives the reasons for how the site works.
3. Look at the open pull requests. Do not change files that an open pull request changes.

## Before you hand over

1. `python3 tools/learn.py check` shows no errors.
2. You looked at the pictures from `python3 tools/learn.py shots`.
3. The pull request says what you changed, which sources you used, what is uncertain and what you did not test.

## Rules

- Write all documentation and all page text in plain language: short sentences, active voice, one word for one thing.
- No frameworks and no packages. Plain HTML, CSS and JavaScript. Python standard library for tools.
- A page loads nothing from other servers. Visits are counted by Cloudflare Web Analytics, which Cloudflare adds when it delivers the site. Do not add other analytics or trackers.
- If the site starts to process data in a new way, update `templates/privacy.html` in the same pull request.
- Work on a branch and open a pull request. Do not push to `main`. Do not merge without a request from the user. Merge method: squash.
- A merge to `main` deploys the site.
- Text and graphics have the licence CC BY 4.0. Code has the MIT licence.
