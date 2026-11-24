# Decisions

This file lists decisions about the site and the reason for each. Read it before you change how the site works. If you change a decision, change this file in the same pull request.

## Content

- **Each page says that an AI made it.** The byline and the footer name the model and the publisher. Reason: honesty to the reader, and the transparency rules of the EU for AI text.
- **No page says that a person reviewed it.** Martin publishes the pages, but he does not check the content. For this reason the model must check each fact against its source a second time before the hand-over.
- **The pages are written for one reader: Martin.** He is a software engineer with experience in C++ and lives in Austria. A page does not explain what a software engineer knows. It explains the mechanism of its topic, and it describes Austria first if a topic is different in each country. Reason: a text for a reader without knowledge is slow to read for him, and it leaves out the part that he wants to know. The pages stay public, so they do not name him or give personal data. The two pages of November 2026 were written for a reader without knowledge.
- **Each fact that can change or that a person could dispute has a source in the list at the end.** Stable textbook knowledge can come from the knowledge of the model. At most one short quote from each source. Reason: the reader can check the page, and the page respects the work of other authors.
- **The model searches for the current state before it states a fact.** It prefers primary sources and gives the date of each source. Reason: the knowledge of a model ends at its training, and the world changed after that.
- **Each page shows what is sourced, what is inferred and what is uncertain.** An inference and an uncertain statement are marked in their sentence. The section "How sure is this?" before the sources gives the overview. Reason: the reader must know how much weight each statement can carry.
- **A story in progress has a status box with a date and a change list.** Reason: readers must see how old the facts are, and what changed since their last visit.
- **A page is in English only.** A page gets German text only if Martin asks for it. Then English is the base language, German is a full translation, and the page starts in German for a browser with German as language. Reason: Martin reads English, and a translation makes each page two times the work to write, to check and to update. The two pages of November 2026 have German text and keep it. The home page and the privacy page stay in the two languages.
- **On a page with German text, German numbers use a dot between thousands and a comma before decimals:** 1.000.000 and 30,1. The theme formats them with the locale `de-DE`, not `de-AT`, because `de-AT` writes a space (1 000 000). Reason: the dot is the common form for readers in Austria and Germany, and the text of a page uses it too, so a page shows one format.
- **Plain language** (the idea of ISO 24495 and Simplified Technical English) for pages and for documents in this repository. Reason: short and exact sentences are fast to read, also for a reader who knows the subject. Plain language is a rule for the sentences. It is not a rule to make the content simple: a page uses the exact terms of software.

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
- **German text, where a page has it, is a dictionary with keys, not a second copy of the HTML.** The check compares the keys. Reason: a missing translation is an error that a program can find.
- **Chrome is an optional tool** for preview pictures (`share.png`), for review pictures (`shots`) and for the test of the controls (`try`). Reason: Python alone cannot draw a web page. GitHub has Chrome, so the live site always gets preview pictures.
- **Addresses:** a page is `/<date>-<slug>/`. The folder name never changes after publication. `#de` and `#en` set the language. `#s03` opens a section. A link cannot have the two at the same time.

## Comments from the reader

- **The reader can write comments on a page, and the comments stay in the browser** (`localStorage`). There is no server and no account. The panel copies the comments as one prompt for an AI agent, or opens a GitHub issue with the prompt. Reason: the site has no backend, and the reader is the only reviewer, so a short way from a comment to an updated page is useful. The browser keeps the comments until the reader deletes them, so a comment does not get lost before it reaches the agent.
- **The button is in the footer, and comments are off until the reader presses it.** Reason: most readers do not need it, and the page stays clean for them. A GitHub issue needs a GitHub account and is public, so a visitor who sends one makes a public comment by their own action.
- **The prompt points to the skill instead of repeating the rules.** The rules for answering comments are in `SKILL.md` ("Comments from the reader"). Reason: the rules can change without a change of the script, and one place holds them.

## Work on the repository

- **All changes go through a pull request.** A rule on GitHub blocks a direct push to `main`. Merge method: squash.
- **Martin decides about each merge.** An AI model does not merge without his request. A merge is a decision to publish. It is not a review of the facts.
- **A merge to `main` deploys the site** with GitHub Actions. If the check fails, the old site stays online.
- **`CLAUDE.md` and the files of the skill are written for AI agents only.** They are short and specific, each rule has its reason, and the skill loads a reference file only when the work needs it. They follow the guidelines of Anthropic for skills and for `CLAUDE.md`: `SKILL.md` has fewer than 500 lines, `CLAUDE.md` has fewer than 200 lines. Reason: no person reads these files, and an agent follows short and specific instructions better. There is no separate list of lessons.
- **Each task of an agent ends with a reflection.** The agent goes through its session and changes the tool, the theme or the agent files so that the next session needs less work. It prefers a check in the tool to a new rule, and it removes rules that did not help. The changes are a separate pull request. Reason: an agent starts each session without the last one, so these files and the tool are its only memory. A separate pull request lets Martin see what changes the work of all later sessions.
- **Licences:** MIT for code, CC BY 4.0 for text and graphics, SIL OFL for the fonts.

## Hosting

- GitHub Pages, source "GitHub Actions", custom domain `learn.ankerl.com`.
- DNS at Cloudflare: `CNAME learn -> martinus.github.io`, proxied.
- An AI model in a cloud session cannot change GitHub settings. Martin changes them.
