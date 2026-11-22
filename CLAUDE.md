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
tools/learn.py              check, build, serve, new (Python standard library only)
site.json                   name, address, publisher, contact address, names of the tags
_site/                      build result (not in git)
```

## Commands

```
python3 tools/learn.py check
python3 tools/learn.py serve
python3 tools/learn.py new YYYY-MM-DD-slug
```

## Rules

- Write all documentation and all page text in plain language: short sentences, active voice, one word for one thing.
- No frameworks and no packages. Plain HTML, CSS and JavaScript. Python standard library for tools.
- A page loads nothing from other servers. Visits are counted by Cloudflare Web Analytics, which Cloudflare adds when it delivers the site. Do not add other analytics or trackers.
- If the site starts to process data in a new way, update `templates/privacy.html` in the same pull request.
- Work on a branch and open a pull request. Do not push to `main`. Do not merge without a request from the user.
- A merge to `main` deploys the site.
- Text and graphics have the licence CC BY 4.0. Code has the MIT licence.
