# Decisions

This file lists decisions about the site and the reason for each. Read it before you change how the site works. If you change a decision, change this file in the same pull request.

## Content

- **Each page says that an AI made it.** The byline and the footer name the model and the publisher. Reason: honesty to the reader, and the transparency rules of the EU for AI text.
- **No page says that a person reviewed it.** Martin publishes the pages, but he does not check the content. For this reason the model must check each fact against its source a second time before the hand-over.
- **Each fact has a source in the list at the end.** At most one short quote from each source. Reason: the reader can check the page, and the page respects the work of other authors.
- **A story in progress has a status box with a date and a change list.** Reason: readers must see how old the facts are, and what changed since their last visit.
- **English is the base language. German is a full translation.** The page starts in German for a browser with German as language. Reason: the main readers are in Austria, but English reaches more people.
- **German numbers use a dot between thousands and a comma before decimals:** 1.000.000 and 30,1. The theme formats them with the locale `de-DE`, not `de-AT`, because `de-AT` writes a space (1 000 000). Reason: the dot is the common form for readers in Austria and Germany, and the text of a page uses it too, so a page shows one format.
- **Plain language** (the idea of ISO 24495 and Simplified Technical English) for pages and for documents in this repository. Reason: the reader has no knowledge of the subject, and many readers do not have English as first language.

## Privacy

- **A page loads nothing from other servers.** Fonts are files of the site. Reason: privacy law in Austria and Germany, and the page must work without other services.
- **No Google Analytics.** Reason: in Austria it needs a consent banner. Martin decided against a banner.
- **Visits are counted with Cloudflare Web Analytics.** It uses no cookies. Cloudflare adds its script when it delivers the site, so it is not in this repository. The privacy page describes it.
- **The privacy page shows a contact e-mail address and "Austria", but no home address.** Martin decides what personal data is on the site. Do not add personal data without his request.

## Technology

- **No framework and no packages.** Plain HTML, CSS and JavaScript. The tool uses the Python standard library. Reason: the site must be easy to build in ten years, and an AI model can read all of it.
- **One self-contained `index.html` for each explainer,** with its own script and its German text. Reason: a page is easy to move, to review and to repair.
- **The build inserts the shared parts** (head, site bar, byline, section links, "Read next", footer). Reason: a change of the shared parts reaches all pages without an edit of each page.
- **The home page is not in git.** The build writes it. Reason: two branches with two new explainers do not conflict.
- **German text is a dictionary with keys, not a second copy of the HTML.** The check compares the keys. Reason: a missing translation is an error that a program can find.
- **Chrome is an optional tool** for preview pictures (`share.png`) and for review pictures (`shots`). Reason: Python alone cannot draw a web page. GitHub has Chrome, so the live site always gets preview pictures.
- **Addresses:** a page is `/<date>-<slug>/`. The folder name never changes after publication. `#de` and `#en` set the language. `#s03` opens a section. A link cannot have the two at the same time.

## Work on the repository

- **All changes go through a pull request.** A rule on GitHub blocks a direct push to `main`. Merge method: squash.
- **Martin decides about each merge.** An AI model does not merge without his request. A merge is a decision to publish. It is not a review of the facts.
- **A merge to `main` deploys the site** with GitHub Actions. If the check fails, the old site stays online.
- **Licences:** MIT for code, CC BY 4.0 for text and graphics, SIL OFL for the fonts.

## Hosting

- GitHub Pages, source "GitHub Actions", custom domain `learn.ankerl.com`.
- DNS at Cloudflare: `CNAME learn -> martinus.github.io`, proxied.
- An AI model in a cloud session cannot change GitHub settings. Martin changes them.
