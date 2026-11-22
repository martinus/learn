# Lessons from earlier work

Problems that occurred when explainers were made or changed. Read this list before you start, and add to it when you find a new problem.

## Text and translation

- **German text is longer.** A German label can be 30 % longer than the English one. Look at buttons, pills, legends and the small boxes with numbers in German at 390 px.
- **The check finds a missing key. It does not find an old translation.** When you change an English text, change the German text with the same key in the same commit. Then run `python3 tools/learn.py texts <slug>` and read the two languages side by side.
- **Text from the script is easy to forget.** Labels in charts, the text of a result, the text of a button that changes: all of them need `Learn.t` and `Learn.fmt`.
- **Give times with the zone.** English text: UTC. German text: the time in Austria, with "MEZ" or "MESZ".
- **Titles:** at most 60 characters. Longer titles do not fit the preview picture and the section list.

## Facts

- **Go to the first source.** A news site that reports what a blog says is not the blog. If you cannot read the first source, say in the text who reports it.
- **A status page has a time of its last update.** Write this time into the page. Do not write "now".
- **When the state changes, read the full page again.** The status box, the comparison cards, the summary in the metadata and the note at the end repeat the state. All of them must agree.
- **Say what you could not check** in the pull request, not only in your answer to the user.

## Layout and graphics

- **Look before you hand over.** Each time pictures were made, they showed a problem that the check did not find: text that touched, a row that covered a heading, a menu with a transparent background.
- **A chart draws at the real width of its element.** A chart in a hidden element has no width. Draw it again when it becomes visible, or do not hide it.
- **Do not put `data-i18n` on an element with controls inside.** The language switch replaces the full content, and the control is gone.
- **Sticky parts cover content.** After a jump to a section, the site bar and the section row are above the text. The theme keeps space for them (`scroll-padding-top`). If you add a sticky part, test a jump to each section.
- **Wide figures:** a figure is 10 rem wider than the text on a desktop. A picture with a fixed size inside it does not grow. Test at 1440 px.

## Work with git

- Start each task from a new `main`: `git checkout main && git pull`.
- One topic for each pull request. Two open pull requests that change the theme files block each other.
- After a merge, the deployment takes about one minute. Open the live page to confirm it.
