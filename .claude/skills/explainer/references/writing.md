# Page text

Aim: the reader understands each sentence on the first reading and learns something from it.

## The reader

Write for this reader unless the user names another:

- A software engineer, 45 years old in 2026, with a long career and C++ experience. Lives in Austria.
- Intelligent, short of time, sceptical. Asks "How do they know that?" and "What does it cost?". Answer both.

This is Martin, the publisher. The page is public and others read it, so do not name or describe the reader on the page, and put no personal data there.

**Knows, so do not explain:** programming, data structures, algorithms and their cost, how a computer works (memory, caches, threads, networks), the usual tools (compiler, Git, shell), and the mathematics and logic an engineer uses. Use the exact terms.

**Does not know, so explain at first use, in one sentence:** terms of other fields (medicine, law, finance, biology, physics beyond school, history). Specialist corners of software outside daily work (database internals, the inside of a machine learning model) also need an explanation, starting from what an engineer knows.

**Depth:**

- Explain the mechanism: how it works, with which numbers, at what cost, within which limits, and how it fails.
- Say how a result was measured. A number without its method is worth little to this reader.
- Start where a news article stops. Skip what a headline already says.
- Keep the difficult part. It is the reason for the page.
- Delete a section that tells this reader nothing new.

**Focus:**

- Metric units, euro, 24-hour clock.
- Where a topic differs by country (law, tax, prices, health system, energy, product availability): Austria first, then the EU, then elsewhere. Do not explain what everyone in Austria knows.
- Where a topic depends on age or life situation (health, money, work), take a person of about 45 in mid-career as the main case.

## Sentences

The page text uses plain language: short, exact sentences are fast to read, also for an expert. Plain sentences do not mean simple content.

- One statement per sentence, mostly under 20 words. Active voice.
- One word for one thing across the page. If it is "zone", it stays "zone".
- Verbs instead of nouns built from verbs: "check", not "perform a verification". The simple word: "use", not "utilize".
- No idioms, irony or wordplay. They slow reading and invite misreading.
- Avoid these patterns: "not X, but Y", a colon before a surprise, rhetorical questions in a series, filler such as "it is worth noting".
- Section headings say what the section tells: "Why it took 167 years", not "Background". Keep them short, because the navigation shows them.

## Terms and comparisons

- Software terms need no explanation: "cache miss", "race condition", "amortized O(1)".
- Keep the exact term. "Latency" is better than "a kind of delay".
- Three or more terms from outside software: add a short glossary near the end.
- Use a comparison only where it speeds up a new idea, and prefer an exact one from software (a cache, a queue, a checksum, interface and implementation). Say where it stops holding. One comparison per idea.

## Formulas and code

- For a mathematical relation, show the formula (markup: "Formula" in `components.md`). Do not write an equation as code: a function that only evaluates a formula says less than the formula and takes longer to read.
- Use the same notation in the formula and in the text around it, and explain each symbol where it first occurs.
- For an algorithm, a data layout or an interface, show code. This reader reads ten lines of code faster than a paragraph about them.
- C++ unless the topic has its own language. Name the required standard, for example C++20.
- At most about 25 lines per example, and only the parts the idea needs.
- The code must be correct. Compile and run it when a compiler is available. Otherwise say in the pull request that it was not compiled.

## Page structure

1. **Opening:** topic line, title, three or four sentences on what the question is and why it matters.
2. **Status box:** only for a story in progress or one important limit.
3. **Three summary cards.** A reader who stops here has the essentials.
4. **Numbered sections,** each answering one sub-question.
5. **"What this means in practice":** if the topic affects the reader's work or life. If it does not, say so.
6. **Glossary:** if needed.
7. **"How sure is this?"** then **"Sources"** (`research.md`).
8. **Page note:** where the page simplifies, and the date of the facts.

Length: about 1,500 to 3,000 words. A topic that needs more becomes two pages.

## Numbers and times

- Exact value with unit, plus what was measured and when. Round only when the exact value carries no meaning.
- Give a very large or very small number a relation: a ratio, an order of magnitude, a value the reader knows.
- Format: 1,000,000 and 30.1.
- Times with zone, in UTC. Add Austrian time (CET or CEST) when the time of day matters to the reader.

## Honesty in the text

- Keep three things apart in the wording: what a source says, what the page infers, what is uncertain (`research.md`).
- Name who says it: "Scientific American reports ...", "The author writes ...".
- Date every state that can change: "status of 21 November 2026".
- Say where you simplify and what you could not check.
- Keep the story as large as the facts. No "revolution" unless the sources use the word.
- On contested topics, present the positions fairly and give no verdict of your own.
- Build the page from the reader's question. Do not follow the structure of a source article.

## German (only on a page with German text)

- Address: "Sie", used rarely.
- German as written in Austria: "Jänner", "Bankomatkarte".
- Short main clauses with the verb early. No long noun chains.
- Use the German term where one is common ("Primzahl"). Keep English terms that German-speaking engineers use ("Cache", "Thread", "Commit") and proper names ("Lean", "GitHub").
- Quotation marks: „so“. Numbers: 1.000.000 and 30,1. Times in Austrian time with "MEZ" or "MESZ".
- Mark English sources with "(englisch)" in the source list.
- Translate the meaning, not the words. Both texts say the same things with the same limits.

## Final read

Read the whole text once as the reader and test every sentence twice:

- Would a software engineer who is new to this subject understand it now? If not, change it or add the missing step before it.
- Does it tell this reader something? If not, delete it.
