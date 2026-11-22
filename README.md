# learn.ankerl.com

Hard topics, made clear: https://learn.ankerl.com

Each page explains one topic in plain language, with graphics that the reader can change. The pages work on a phone, have a bright and a dark mode, and are available in English and German.

AI models write the text and draw the graphics. Each page names the model, the date and its sources. Martin Leitner-Ankerl publishes the pages and is responsible for the content.

## Make a new explainer

Open the repository in Claude Code and write, for example:

```
/explainer How does GPS find my position?
```

The skill in `.claude/skills/explainer/` tells the AI model how to do the work: collect the facts, plan the page, write the text, make the graphics, add the German text, check the page and open a pull request. You read the page in the pull request and merge it. The merge publishes the page.

To update a page, write for example:

```
/explainer Update the Riemann page with the news of today.
```

## Look at the site on your computer

You need only Python 3.

```
python3 tools/learn.py serve
```

Then open http://localhost:8000. Run the command again after a change.

Other commands:

```
python3 tools/learn.py check                 # examine all pages, change nothing
python3 tools/learn.py build                 # write the site to _site/
python3 tools/learn.py new 2026-12-01-topic  # start a page from the template
python3 tools/learn.py shots                 # pictures of all pages into _shots/ (needs Chrome)
python3 tools/learn.py texts 2026-12-01-topic  # English and German text, key by key
```

## How the repository is organized

| Path | Content |
|---|---|
| `site/YYYY-MM-DD-slug/` | one explainer: `index.html` and `cover.svg` |
| `site/assets/` | the shared theme (`theme.css`, `theme.js`) and the fonts |
| `templates/` | page parts that the build inserts, and the start template |
| `tools/learn.py` | the build tool |
| `site.json` | name and address of the site, publisher, contact address, names of the tags |
| `.claude/skills/explainer/` | the instructions for the AI model |
| `docs/decisions.md` | decisions about the site, with reasons |
| `docs/ideas.md` | things that are not built |

The build puts the site bar, the byline, links to the sections, "Read next" cards and the footer into each page. It writes the home page, the privacy page, `sitemap.xml` and `404.html`.

The build also writes a preview picture (`share.png`) for each page. Chat programs and social networks show it when a person shares a link. For this, the build uses Chrome or Chromium, if it is installed. Without it, the build works, but writes no preview pictures. On GitHub, Chrome is available. The check stops the build if a page has an error, for example a missing German text or a file that loads from a different server.

## Hosting

GitHub Pages serves the site. The workflow `.github/workflows/pages.yml` builds and deploys it after each push to `main`.

Settings that are necessary one time:

1. Repository settings, Pages, Source: "GitHub Actions".
2. Repository settings, Pages, Custom domain: `learn.ankerl.com`.
3. DNS: a `CNAME` record with the name `learn` and the target `martinus.github.io`.

The pages load no files from other servers. The fonts are part of the site.

## Counting visits

The site uses Cloudflare Web Analytics. It works without cookies. It is not in this repository: Cloudflare delivers the site and adds a small script to each page (Cloudflare dashboard, Web Analytics, automatic setup). The page `/privacy/` tells visitors about it. Its text is in `templates/privacy.html`.

## Licences

- **Text and graphics of the explainers** (`site/`, without `site/assets/`): [Creative Commons Attribution 4.0 International](LICENSE-CONTENT) (CC BY 4.0). You can copy, change and share them, also for commercial use. Name the source: "learn.ankerl.com", with a link to the page.
- **Code** (theme, templates, tools, skill): [MIT](LICENSE).
- **Fonts** (`site/assets/fonts/`): SIL Open Font License 1.1. The licence files are in that folder.

AI models made the content. In some countries, text that an AI made has no copyright protection, or only limited protection. The licences apply to the extent that rights exist.

## Report an error

AI models make mistakes, and news changes. If you find an error, [open an issue](https://github.com/martinus/learn/issues/new).
