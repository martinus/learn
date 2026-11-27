# Research and sources

The reader wants to know, for every statement on a page, whether it is sourced, inferred or uncertain. Nobody checks the facts after you, so these rules are the only quality control of the content.

Contents: When to search · Which sources · Is the source current? · Read the source itself · Contested topics · Fact list · How the three kinds appear on the page · Section "How sure is this?" · Source list · Stories in progress

## When to search

Your training data ends at a cutoff and the world has moved on since. Treat what you remember as a hint where to look, not as a fact.

- Take today's date from the environment. Use it in queries and in every "status of ..." on the page.
- Search for every fact that can change or be disputed, even when you feel sure: software versions, prices, laws, records, counts, who holds a position, the state of a project, the newest study, anything from the last few years.
- Skip the search for stable common knowledge (mathematics, the definition of an algorithm, the text of a published standard) and for work that needs no outside facts (layout, a calculation). Searching for these wastes the session.
- Without a search tool, tell the user before you start. The page then rests on the user's sources and on stable knowledge only, and "How sure is this?" says so.

## Which sources

Use the highest level that you can read.

1. **Primary:** official data, the study itself, the standard, the guideline, the text of the law, a company filing, the documentation, the source code, release notes, the own writing of the people who did the work.
2. **Reporting:** a careful article about a primary source. Use it to find the primary source and for context. If the primary source is not readable, the page says who reports the fact.
3. **Weak:** forums, aggregators, SEO pages, pages without author or date, AI-generated summaries, Wikipedia. Use them only to find better sources.

- A statement with only a weak source is removed or labelled as weakly sourced on the page.
- A forum post is primary for what its author said, not for whether it is true. A press release is primary for what an organization claims. Read the study or the data behind it.
- Where a topic differs by country, start with Austria and the EU: RIS and EUR-Lex for law, Statistik Austria and Eurostat for data, the responsible authority for rules.

## Is the source current?

- Record two dates per source: the publication date and the date of the data in it. An article from this year can rest on data that is four years old.
- Look for a newer version: a new edition of the standard, a newer data release, a correction, a retraction, a follow-up study, the documentation of a newer release. Put the current year into the query.
- Software: read the documentation and the release notes of the current release, and name the version on the page. A "latest" link drifts, so link the specific version when the page describes its behaviour.
- A preprint is not a reviewed paper. Say which one the source is.
- For a paper, list what cites it: `curl -s 'https://api.semanticscholar.org/graph/v1/paper/arXiv:<id>/citations?fields=title,publicationDate,externalIds&limit=200'`. Later papers of the same authors show the current state. `https://api.crossref.org/works/<doi>` gives the venue, the date and the pages for a DOI, and `https://export.arxiv.org/api/query?id_list=<id>` gives the journal reference of a preprint. The first address answers 429 after a few requests in a row.
- Some servers refuse automatic access, also when the link is correct: the ACM, AIP and the Royal Society answer a DOI with 403, ScienceDirect shows a captcha, and `feynmanlectures.caltech.edu` blocks `curl` and the fetch tool. Do not work around a refusal. Confirm a DOI with Crossref, take the fact from a source that you can read, and name the refusal in the pull request.
- If the newest source is old, the page says how old.
- Every number that can change carries its date on the page.

## Read the source itself

- Read the full text. A search snippet, an abstract or a press release is not the source, because it shows a sentence without its context.
- A summary from a fetch tool or a subagent is not the source either. It rewords the text and can change a number: in one session a table value of 6 came back as 66. Use the summary to find the passage. Then load the raw page (`curl`), search it for each number that goes on the page, and read the lines around it. For a paper on arXiv, the full text is at `https://arxiv.org/html/<id>`. For a PDF, `pdftotext -layout` gives text that `grep` can search. For a post on X, `https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=a` returns the text as JSON, and of a long post only the first 280 characters.
- If you saw only a snippet or an abstract (paywall), record that in the fact list and show it in the source entry on the page.
- Read each number in context: unit, year, region, and what exactly was counted.
- Numbers from two sources may be combined only when they measure the same thing. A combined number is an inference.
- A benchmark of a library measures the library, not the algorithm of the paper behind it. Before you explain one of its numbers, read what the library adds, in its README and in the code of the measured path. In one session a fast lookup came from a filter that the library had added.
- Link the exact page, not the home page of a site. Open every link once more before the hand-over, also the links in the text and in the glossary: `curl -sIL --max-time 30 -o /dev/null -w '%{http_code} %{url_effective}\n' <url>` shows the status and where a redirect ends. Give every `curl` call `--max-time`, because a server that does not answer otherwise blocks the command for minutes.

## Contested topics

- Check more than one side. Read each side in its own words and in its strongest form.
- The page says who holds which position and what evidence each side gives, and separates what all sides accept from what is disputed.
- Do not settle on the page what the sources do not settle. Reporting what most experts think is fine, with a source for that.

## Fact list

Keep it while you collect. It stays in your working notes. Its content goes into the page and the pull request.

| Field | Content |
|---|---|
| Statement | one fact, number, name or date |
| Source | URL of the exact page |
| Dates | published, date of the data, day you read it |
| Read as | full text, abstract only, snippet only |
| Kind | sourced, inferred, own knowledge |
| State | confirmed by a primary source, single source, disputed, unresolved, weak |

## How the three kinds appear on the page

**Sourced:** a source says it and you read the source. Name the source in the sentence when the statement is important or surprising, with the date when timing matters: "Eurostat counts ... (data of 2025)".

**Inferred:** you conclude it and no source says it, for example a result computed from two numbers, a comparison, a cause, a forecast. Mark it in the sentence ("This page infers ...", "No source says this directly. It follows from ...") and show the calculation or the steps, so the reader can check it.

**Uncertain:** disputed, unresolved, or weakly supported (single source, weak source, abstract only). Say it in the same sentence and say why. If you cannot say why it is uncertain, you do not know enough about it: search more or remove it.

**Own knowledge:** stable textbook knowledge may be explained without a source (how a hash table works, what a derivative is). If a main statement of the page rests on your own knowledge, find a source for it anyway.

## Section "How sure is this?"

It comes directly before "Sources" and gives the overview in three rows (markup in `components.md`):

- **Sourced:** which main statements rest on primary sources, and which only on reporting.
- **Inferred:** every important inference of the page, and what comes from the model's own knowledge.
- **Uncertain:** what is disputed, unresolved or weakly sourced, and which sources were read only as a snippet or an abstract.

Write the true state. For an empty group, say so: "This page makes no inferences beyond its sources."

## Source list

One entry per source, primary sources first: who, what, then kind and date. Append "abstract only" or "reported by ..." where it applies.

```html
<ul class="sources">
  <li><a href="https://...">Eurostat: Electricity prices for household consumers</a> &middot; official data, second half of 2025</li>
  <li><a href="https://...">Miller et al.: Name of the study</a> &middot; reviewed paper, March 2026, abstract only</li>
  <li><a href="https://...">Der Standard: Name of the article</a> &middot; reporting, 3 November 2026</li>
</ul>
```

## Stories in progress

- The page starts with a status box that carries a date. Write the time of the last update of a source into the text. "Now" is not a time.
- When the state changes, every place that repeats it must change too. See "Update a page" in `SKILL.md`.
