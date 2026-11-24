# learn.ankerl.com

Source of https://learn.ankerl.com. The site consists of explainers: each is one self-contained page that answers one question, with interactive graphics. AI models write the pages. Martin Leitner-Ankerl publishes them and is their reader: a software engineer in Austria. Pages are in English.

## Use the `explainer` skill

Load it for these tasks. It holds the workflow, the source rules and the quality bar.

- create, update, correct or translate a page under `site/`
- change `site/assets/theme.css`, `site/assets/theme.js`, `templates/` or `tools/learn.py`

## Commands

```
python3 tools/learn.py check            # validate all pages; the pass/fail gate, also in CI
python3 tools/learn.py shots [slug]     # build, then screenshots into _shots/ (needs Chrome)
python3 tools/learn.py try slug         # use every slider and button once, report script errors (needs Chrome)
python3 tools/learn.py texts slug       # page text as plain lines
python3 tools/learn.py terms slug       # each abbreviation and symbol with the sentence of its first use
python3 tools/learn.py serve            # build into _site/, then http://localhost:8000
python3 tools/learn.py new YYYY-MM-DD-slug
```

`check` cannot see layout faults or script errors. Open the pictures from `shots` for every page your change can affect, and run `try` for one of them.

## Workflow

- Start from a fresh `main` (`git checkout main && git pull`), then branch. `main` is protected and rejects direct pushes.
- Look at the open pull requests first and stay out of the files they touch. Two pull requests that both change the theme block each other. One topic per pull request.
- Read `docs/decisions.md` before you change how the site works (theme, tool, templates, privacy, hosting). It gives the reason behind each rule. If you change a decision, update the file in the same pull request.
- Hand over as a pull request that says what changed and what you did not test. For page content it also lists the sources and what is sourced, inferred and uncertain.
- End every task with the reflection of the skill ("Reflect"): it turns what the session showed into a change of these files or of the tool, in its own pull request. Reason: the next session starts without this one.
- Merge only when the user asks, with squash. A merge to `main` publishes: GitHub Actions deploys in about a minute, and a failing `check` leaves the old site online. After a merge, open the live page to confirm.

## Rules

- No frameworks and no packages: plain HTML, CSS and JavaScript, and the Python standard library for the tool. The site should build unchanged in ten years, and an agent should be able to read all of it.
- A page loads nothing from other servers, for privacy law in Austria and the EU. Cloudflare injects its cookie-free Web Analytics at delivery, so it is not in this repository. Add no other analytics or trackers.
- If the site starts to process visitor data in a new way, update `templates/privacy.html` in the same pull request.
- Add no personal data about Martin beyond what `site.json` and the privacy page already contain.
- Before you write a fact that can change on a page, search for its current state. Your training data is older than the page.
- Licences: CC BY 4.0 for text and graphics, MIT for code.

## Who reads which file

- `CLAUDE.md` and `.claude/skills/**`: agents only. Keep them short and specific, give each rule its reason, and remove what no longer holds.
- Page text, `README.md`, `templates/privacy.html` and `docs/`: people. Write them in plain language: short sentences, active voice, one word for one thing.
