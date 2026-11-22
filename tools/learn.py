#!/usr/bin/env python3
"""Build tool for learn.ankerl.com. Python standard library only.

  python3 tools/learn.py check            examine all explainers, change nothing
  python3 tools/learn.py build            write the full site to _site/
  python3 tools/learn.py serve [port]     build, then serve _site/ on http://localhost:8000
  python3 tools/learn.py new DATE-SLUG    start a new explainer from the template,
                                          for example: new 2026-12-01-how-gps-works
  python3 tools/learn.py shots [SLUG]     write pictures of the pages into _shots/, to look at
                                          the result (needs Chrome). Without SLUG: all pages.
  python3 tools/learn.py texts SLUG       print the English and German text of one explainer,
                                          key by key, to compare the two languages

An explainer is a folder site/YYYY-MM-DD-slug/ with index.html and cover.svg.
The build puts the shared head, site bar, byline and footer into each page
(at the comment markers "learn:head", "learn:header", "learn:byline", "learn:footer")
and writes the home page, the privacy page, sitemap.xml and 404.html.

If Chrome or Chromium is installed, the build also writes a preview picture
(share.png) for each page. Social networks and chat programs show it for a link.
Without Chrome the build works, but writes no preview pictures.
"""
import datetime
import functools
import hashlib
import html
import http.server
import json
import concurrent.futures
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "_site"
TPL = ROOT / "templates"
CFG = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))

SLUG_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$")
MARKERS = ("head", "header", "byline", "footer")
LANGS = {"en": "English", "de": "Deutsch"}
MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July",
           "August", "September", "October", "November", "December"],
    "de": ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli",
           "August", "September", "Oktober", "November", "Dezember"],
}
WORDS_PER_MINUTE = 200


def marker(name):
    return "<!-- learn:%s -->" % name


def fill(template, values):
    """Replace {{name}} in the template. An unknown name is an error."""
    def repl(m):
        key = m.group(1)
        if key not in values:
            raise KeyError("template value missing: " + key)
        return str(values[key])
    return re.sub(r"\{\{(\w+)\}\}", repl, template)


def tpl(name):
    return (TPL / name).read_text(encoding="utf-8")


def esc(text):
    return html.escape(text, quote=True)


def fmt_date(iso, lang):
    d = datetime.date.fromisoformat(iso)
    if lang == "de":
        return "%d. %s %d" % (d.day, MONTHS["de"][d.month - 1], d.year)
    return "%d %s %d" % (d.day, MONTHS["en"][d.month - 1], d.year)


def asset_version():
    h = hashlib.sha256()
    for p in sorted((SITE / "assets").glob("theme.*")):
        h.update(p.read_bytes())
    return h.hexdigest()[:10]


def strip_tags(fragment):
    fragment = re.sub(r"<(script|style|svg)\b.*?</\1>", " ", fragment, flags=re.S | re.I)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return html.unescape(fragment)


class Explainer:
    def __init__(self, folder):
        self.folder = folder
        self.slug = folder.name
        self.errors = []
        self.source = ""
        self.meta = {}
        self.minutes = 1
        self.load()

    def err(self, text):
        self.errors.append("%s: %s" % (self.slug, text))

    def load(self):
        m = SLUG_RE.match(self.slug)
        if not m:
            self.err("folder name must be YYYY-MM-DD-slug with small letters, digits and hyphens")
        page = self.folder / "index.html"
        if not page.is_file():
            self.err("index.html is missing")
            return
        self.source = page.read_text(encoding="utf-8")
        src = self.source

        mm = re.search(r'<script type="application/json" id="explainer-meta">(.*?)</script>', src, re.S)
        if not mm:
            self.err('<script type="application/json" id="explainer-meta"> is missing')
            return
        try:
            self.meta = json.loads(mm.group(1))
        except ValueError as e:
            self.err("explainer-meta is not valid JSON: %s" % e)
            return
        meta = self.meta

        langs = meta.get("languages") or []
        if not langs or langs[0] != "en" or any(l not in LANGS for l in langs):
            self.err('"languages" must start with "en" and can contain only: %s' % ", ".join(LANGS))
            langs = ["en"]
        for field in ("title", "summary"):
            value = meta.get(field)
            if not isinstance(value, dict):
                self.err('"%s" must be an object with one text for each language' % field)
                continue
            for lang in langs:
                if not str(value.get(lang, "")).strip():
                    self.err('"%s" has no text for language "%s"' % (field, lang))
        for field in ("published", "updated"):
            try:
                datetime.date.fromisoformat(meta.get(field, ""))
            except (TypeError, ValueError):
                self.err('"%s" must be a date in the form YYYY-MM-DD' % field)
        if m and meta.get("published") and meta["published"] != m.group(1):
            self.err('the date in the folder name must be the "published" date (%s)' % meta["published"])
        if not str(meta.get("model", "")).strip():
            self.err('"model" must name the AI model that made the page')
        if not isinstance(meta.get("tags"), list) or not meta["tags"]:
            self.err('"tags" must be a list with one tag or more')

        for name in MARKERS:
            if src.count(marker(name)) != 1:
                self.err("the marker %s must be in the page exactly one time" % marker(name))
        if '<main class="explainer">' not in src:
            self.err('<main class="explainer"> is missing')
        # The build gives each section an id and builds the section navigation from the numbers.
        nums = re.findall(r'<section>\s*<span class="num">(\d+)</span>', src)
        if len(nums) != len(re.findall(r"<section\b", src)):
            self.err('each section must start with <section> and then <span class="num">01</span> (with its own number)')
        if len(set(nums)) != len(nums):
            self.err("two sections have the same number")
        if not re.search(r"<title>[^<]+</title>", src):
            self.err("<title> is missing")
        if not (self.folder / "cover.svg").is_file():
            self.err("cover.svg is missing")
        if not re.search(r'class="sources"[^>]*>.*?<a\s[^>]*href="https?://', src, re.S):
            self.err('a list of sources is missing: <ul class="sources"> with one link or more')

        # The page must not load files from other servers (privacy, and the page must work offline).
        for pat, what in (
            (r'<script[^>]+src="(?:https?:)?//', "a script from a different server"),
            (r'<link[^>]+href="(?:https?:)?//', "a stylesheet or font from a different server"),
            (r'<(?:img|iframe|video|audio|source)[^>]+src="(?:https?:)?//', "media from a different server"),
            (r'url\(\s*["\']?(?:https?:)?//', "a CSS url() to a different server"),
            (r'@import', "a CSS @import"),
        ):
            if re.search(pat, src, re.I):
                self.err("the page loads %s. Put the file into the folder of the explainer." % what)
        for bad in ("lorem ipsum", "TODO", "FIXME"):
            if bad.lower() in src.lower():
                self.err('placeholder text found: "%s"' % bad)

        keys = set(re.findall(r'data-i18n="([^"]+)"', src)) | set(re.findall(r'data-i18n-aria="([^"]+)"', src))
        dm = re.search(r'<script type="application/json" id="i18n-de">(.*?)</script>', src, re.S)
        if "de" in langs:
            if not dm:
                self.err('language "de" is declared, but <script type="application/json" id="i18n-de"> is missing')
            else:
                try:
                    de = json.loads(dm.group(1))
                except ValueError as e:
                    self.err("i18n-de is not valid JSON: %s" % e)
                    de = None
                if de is not None:
                    missing = sorted(keys - set(de))
                    unused = sorted(set(de) - keys)
                    empty = sorted(k for k, v in de.items() if not str(v).strip())
                    if missing:
                        self.err("German text is missing for: %s" % ", ".join(missing))
                    if unused:
                        self.err("German text without an element in the page: %s" % ", ".join(unused))
                    if empty:
                        self.err("German text is empty for: %s" % ", ".join(empty))
        elif dm or keys:
            self.err('the page has data-i18n keys or i18n-de, but "de" is not in "languages"')

        body = re.search(r'<main class="explainer">(.*?)</main>', src, re.S)
        words = len(strip_tags(body.group(1)).split()) if body else 0
        self.minutes = max(1, math.ceil(words / WORDS_PER_MINUTE))

    # ----- output -----
    def langs(self):
        return self.meta.get("languages") or ["en"]

    def text(self, field, lang):
        value = self.meta.get(field) or {}
        return value.get(lang) or value.get("en") or ""

    def render(self, version, others=(), share=False):
        meta = self.meta
        langs = self.langs()
        root = "../"
        url = "%s/%s/" % (CFG["url"], self.slug)
        head = fill(tpl("_head.html"), {
            "description": esc(self.text("summary", "en")), "title": esc(self.text("title", "en")),
            "site_name": esc(CFG["name"]), "og_type": "article", "url": url, "root": root, "v": version,
            "og_image": og_image_tags(url + "share.png") if share else "",
        })
        reviewed = str(meta.get("reviewed_by", "")).strip()
        upd = meta["updated"] != meta["published"]
        byline = fill(tpl("_byline.html"), {
            "model": esc(meta["model"]), "publisher": esc(CFG["publisher"]), "minutes": self.minutes,
            "date_en": fmt_date(meta["published"], "en"), "date_de": fmt_date(meta["published"], "de"),
            "updated_en": ", updated %s" % fmt_date(meta["updated"], "en") if upd else "",
            "updated_de": ", aktualisiert am %s" % fmt_date(meta["updated"], "de") if upd else "",
            "reviewed_en": " &middot; Reviewed by <b>%s</b>" % esc(reviewed) if reviewed else "",
            "reviewed_de": " &middot; Gepr&uuml;ft von <b>%s</b>" % esc(reviewed) if reviewed else "",
        })
        src_url = "%s/tree/%s/site/%s" % (CFG["repo"], CFG["branch"], self.slug)
        issue_url = "%s/issues/new?title=%s" % (CFG["repo"], esc("Error in " + self.slug))
        nav = (
            '<a href="%s"><span class="l-en">All explainers</span><span class="l-de">Alle Erkl&auml;rst&uuml;cke</span></a>'
            '<a href="%s"><span class="l-en">Report an error</span><span class="l-de">Fehler melden</span></a>'
            '<a href="%s"><span class="l-en">Source of this page</span><span class="l-de">Quelltext dieser Seite</span></a>'
            '<a href="%sprivacy/"><span class="l-en">Privacy</span><span class="l-de">Datenschutz</span></a>'
        ) % (root, issue_url, src_url, root)
        made_en = "An AI model (%s) made the text and graphics of this page. %s published it and is responsible for the content. AI models make mistakes." % (esc(meta["model"]), esc(CFG["publisher"]))
        made_de = "Ein KI-Modell (%s) hat Text und Grafiken dieser Seite erstellt. %s hat sie ver&ouml;ffentlicht und ist f&uuml;r den Inhalt verantwortlich. KI-Modelle machen Fehler." % (esc(meta["model"]), esc(CFG["publisher"]))
        out = self.source
        # Each numbered section gets an id, and its number becomes a link to the section.
        out = re.sub(r'<section>(\s*)<span class="num">(\d+)</span>', section_start, out)
        out = out.replace(marker("head"), head.rstrip("\n"))
        out = out.replace(marker("header"), site_header(root, langs, progress=True))
        out = out.replace(marker("byline"), byline.rstrip("\n"))
        out = out.replace(marker("footer"), read_next(others) + fill(tpl("_footer.html"), {
            "wide": "", "made_en": made_en, "made_de": made_de, "repo": CFG["repo"], "branch": CFG["branch"], "nav": nav,
        }).rstrip("\n"))
        attrs = 'lang="en" data-langs="%s"' % " ".join(langs)
        for lang in langs[1:]:
            attrs += ' data-title-%s="%s"' % (lang, esc(self.text("title", lang)))
        out, n = re.subn(r"<html\b[^>]*>", "<html %s>" % attrs, out, count=1)
        if n != 1:
            raise SystemExit("%s: <html> tag not found" % self.slug)
        return out

    def card(self, root="", feature=False, heading="h2"):
        meta = self.meta
        cover = (self.folder / "cover.svg").read_text(encoding="utf-8")
        cover = re.sub(r"<\?xml.*?\?>", "", cover).strip()
        tags = "".join('<span>%s</span>' % two_lang(CFG["tags"].get(t, {"en": t, "de": t})) for t in meta["tags"])
        title = two_lang({l: esc(self.text("title", l)) for l in LANGS})
        summary = two_lang({l: esc(self.text("summary", l)) for l in LANGS})
        date = two_lang({l: fmt_date(meta["updated"], l) for l in LANGS})
        minutes = two_lang({"en": "%d min" % self.minutes, "de": "%d Min." % self.minutes})
        langs = " &middot; ".join(l.upper() for l in self.langs())
        return (
            '      <a class="card%s" href="%s%s/">\n'
            '        <span class="cover" aria-hidden="true">%s</span>\n'
            '        <span class="body">\n'
            '          <span class="tags">%s</span>\n'
            '          <%s>%s</%s>\n'
            '          <p>%s</p>\n'
            '          <span class="meta"><span>%s</span><span>%s</span><span>%s</span></span>\n'
            '        </span>\n'
            '      </a>'
        ) % (" feature" if feature else "", root, self.slug, cover, tags, heading, title, heading, summary, date, minutes, langs)


def section_start(m):
    num = m.group(2)
    return (
        '<section id="s%s">%s<a class="num" href="#s%s">%s<span class="hash" aria-hidden="true"> #</span>'
        '<span class="vh l-en"> Link to this section</span><span class="vh l-de"> Link zu diesem Abschnitt</span></a>'
    ) % (num, m.group(1), num, num)


def read_next(others):
    """Cards for up to three other explainers, at the end of a page."""
    others = list(others)[:3]
    if not others:
        return ""
    return (
        '<aside class="next">\n  <div class="in">\n'
        '    <h2><span class="l-en">Read next</span><span class="l-de">Weiterlesen</span></h2>\n'
        '    <div class="cards">\n%s\n    </div>\n  </div>\n</aside>\n'
    ) % "\n".join(o.card(root="../", heading="h3") for o in others)


def og_image_tags(url):
    return (
        '<meta property="og:image" content="%s">\n'
        '<meta property="og:image:width" content="1200">\n'
        '<meta property="og:image:height" content="630">\n'
        '<meta name="twitter:card" content="summary_large_image">'
    ) % url


def find_chrome():
    names = [os.environ.get("CHROME"), "google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome",
             "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    for name in names:
        if name and (shutil.which(name) or os.path.isfile(name)):
            return shutil.which(name) or name
    return None


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if len(head) < 24 or head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", head[16:24])


def share_card(title, tags, cover):
    """HTML of one preview picture. Chrome makes a PNG of 1200 x 630 pixels from it."""
    size = "t1" if len(title) <= 34 else "t2" if len(title) <= 60 else "t3"
    return fill(tpl("share.html"), {"title": esc(title), "size": size, "tags": tags, "cover": cover,
                                     "plain": "" if cover else "plain"})


def write_share_images(chrome, cards):
    """cards: list of (target png path, html text). Returns a list of error texts."""
    errors = []
    work = OUT / "_share"
    work.mkdir()
    with tempfile.TemporaryDirectory() as profile:
        for i, (target, text) in enumerate(cards):
            page = work / ("%d.html" % i)
            page.write_text(text, encoding="utf-8")
            cmd = [chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                   "--force-device-scale-factor=1", "--window-size=1200,630", "--virtual-time-budget=3000",
                   "--user-data-dir=" + profile, "--screenshot=" + str(target), page.as_uri()]
            try:
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90, check=False)
            except (OSError, subprocess.TimeoutExpired) as e:
                errors.append("preview picture: Chrome did not run: %s" % e)
                break
            size = png_size(target) if target.is_file() else None
            if size != (1200, 630):
                errors.append("preview picture %s: expected 1200 x 630 pixels, got %s" % (target.relative_to(OUT), size))
    shutil.rmtree(work)
    return errors


def two_lang(value):
    en = value.get("en", "")
    de = value.get("de", en)
    if en == de:
        return en
    return '<span class="l-en">%s</span><span class="l-de">%s</span>' % (en, de)


def site_header(root, langs, progress=False, wide=False):
    buttons = "".join(
        '<button type="button" data-set-lang="%s" aria-pressed="false" lang="%s" title="%s">%s</button>'
        % (l, l, LANGS[l], l.upper()) for l in langs)
    return fill(tpl("_header.html"), {
        "root": root, "lang_buttons": buttons, "wide": " wide" if wide else "",
        "progress": '<div class="progress" aria-hidden="true"><i></i></div>' if progress else "",
    }).rstrip("\n")


def site_page(template_name, version, values, url, title, root="", title_de=None, wide=True, share=False):
    """Home page, 404 and privacy page: both languages."""
    page = fill(tpl(template_name), values)
    page = re.sub(r'<section>(\s*)<span class="num">(\d+)</span>', section_start, page)
    head = fill(tpl("_head.html"), {
        "description": esc(CFG["description"]["en"]), "title": esc(title), "site_name": esc(CFG["name"]),
        "og_type": "website", "url": url, "root": root, "v": version,
        "og_image": og_image_tags(CFG["url"] + "/share.png") if share else "",
    })
    nav = (
        '<a href="%s"><span class="l-en">All explainers</span><span class="l-de">Alle Erkl&auml;rst&uuml;cke</span></a>'
        '<a href="%s"><span class="l-en">Source on GitHub</span><span class="l-de">Quelltext auf GitHub</span></a>'
        '<a href="%sprivacy/"><span class="l-en">Privacy</span><span class="l-de">Datenschutz</span></a>'
    ) % (root or "./", CFG["repo"], root)
    made_en = "AI models made the text and graphics of this site. %s publishes it and is responsible for the content." % esc(CFG["publisher"])
    made_de = "KI-Modelle haben Text und Grafiken dieser Website erstellt. %s ver&ouml;ffentlicht sie und ist f&uuml;r den Inhalt verantwortlich." % esc(CFG["publisher"])
    page = page.replace(marker("head"), head.rstrip("\n"))
    page = page.replace(marker("header"), site_header(root, list(LANGS), wide=wide))
    page = page.replace(marker("footer"), fill(tpl("_footer.html"), {
        "wide": " wide" if wide else "", "made_en": made_en, "made_de": made_de, "repo": CFG["repo"], "branch": CFG["branch"], "nav": nav,
    }).rstrip("\n"))
    attrs = 'lang="en" data-langs="%s" data-title-de="%s"' % (" ".join(LANGS), esc(title_de or title))
    return re.sub(r"<html\b[^>]*>", "<html %s>" % attrs, page, count=1)


def load_all():
    items = []
    for folder in sorted(SITE.iterdir()):
        if folder.is_dir() and folder.name != "assets":
            items.append(Explainer(folder))
    return items


def report(items):
    errors = [e for it in items for e in it.errors]
    for e in errors:
        print("ERROR  " + e, file=sys.stderr)
    return errors


def cmd_check():
    items = load_all()
    if report(items):
        return 1
    print("OK: %d explainer(s), no errors." % len(items))
    return 0


def cmd_build():
    items = load_all()
    if report(items):
        print("Build stopped. Correct the errors first.", file=sys.stderr)
        return 1
    version = asset_version()
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SITE, OUT)
    items.sort(key=lambda it: (it.meta["updated"], it.slug), reverse=True)
    chrome = find_chrome()
    share = bool(chrome)
    if not share:
        if os.environ.get("CI"):
            print("ERROR  Chrome is necessary for the preview pictures, but the build did not find it.", file=sys.stderr)
            return 1
        print("Note: Chrome not found. The build writes no preview pictures (share.png).")
    for it in items:
        others = [o for o in items if o is not it]
        (OUT / it.slug / "index.html").write_text(it.render(version, others, share), encoding="utf-8")
    n = len(items)
    count = two_lang({"en": "%d explainer%s" % (n, "" if n == 1 else "s"),
                      "de": "%d Erkl&auml;rst&uuml;ck%s" % (n, "" if n == 1 else "e")})
    feature = items[0].card(feature=True) if items else ""
    cards = '    <div class="cards">\n%s\n    </div>' % "\n".join(it.card() for it in items[1:]) if n > 1 else ""
    home = site_page("home.html", version, {"feature": feature, "cards": cards, "count": count},
                     CFG["url"] + "/", CFG["name"], share=share)
    (OUT / "index.html").write_text(home, encoding="utf-8")
    # 404 page: GitHub Pages serves it for all unknown paths, so its links must start at the root.
    (OUT / "404.html").write_text(site_page("404.html", version, {}, CFG["url"] + "/404.html", "Page not found", root="/"), encoding="utf-8")
    (OUT / "privacy").mkdir()
    privacy = site_page("privacy.html", version, {"publisher": esc(CFG["publisher"]), "email": esc(CFG["contact_email"])},
                        CFG["url"] + "/privacy/", "Privacy", root="../", title_de="Datenschutz", wide=False)
    (OUT / "privacy" / "index.html").write_text(privacy, encoding="utf-8")
    urls = [(CFG["url"] + "/", max([it.meta["updated"] for it in items] or [datetime.date.today().isoformat()]))]
    urls += [("%s/%s/" % (CFG["url"], it.slug), it.meta["updated"]) for it in items]
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "".join("  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % u for u in urls) + "</urlset>\n"
    (OUT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (OUT / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % CFG["url"], encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    if share:
        def tag_spans(tags):
            return "".join("<span>%s</span>" % esc(CFG["tags"].get(t, {"en": t})["en"]) for t in tags)
        cards = [(OUT / "share.png", share_card(CFG["description"]["en"].split(". ")[0] + ".", "", ""))]
        for it in items:
            cover = re.sub(r"<\?xml.*?\?>", "", (it.folder / "cover.svg").read_text(encoding="utf-8")).strip()
            cards.append((OUT / it.slug / "share.png", share_card(it.text("title", "en"), tag_spans(it.meta["tags"]), cover)))
        errors = write_share_images(chrome, cards)
        for e in errors:
            print("ERROR  " + e, file=sys.stderr)
        if errors:
            return 1
    print("Built %d explainer(s) into %s" % (n, OUT.relative_to(ROOT)))
    return 0


def cmd_serve(port):
    if cmd_build():
        return 1
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(OUT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as srv:
        print("Open http://localhost:%d/  (Ctrl+C stops the server. Run again after a change.)" % port)
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


SHOTS = ROOT / "_shots"
VARIANTS = (("390-light-en", 390, "light", "en"), ("390-dark-de", 390, "dark", "de"), ("1440-light-en", 1440, "light", "en"))


def chrome_run(chrome, args, url, profile):
    cmd = [chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
           "--force-device-scale-factor=1", "--virtual-time-budget=4000", "--user-data-dir=" + profile] + args + [url]
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=120, check=False)


def take_shot(chrome, job):
    """job: (page file, query, width, target png). First measure the height of the content, then make the picture."""
    page, query, width, target = job
    url = page.as_uri() + "?review=1&" + query
    with tempfile.TemporaryDirectory() as profile:
        dom = chrome_run(chrome, ["--window-size=%d,200" % width, "--dump-dom"], url, profile).stdout.decode("utf-8", "replace")
        m = re.search(r'data-review-height="(\d+)"', dom)
        height = min(max(int(m.group(1)) if m else 1600, 300), 9000)
        chrome_run(chrome, ["--window-size=%d,%d" % (width, height), "--screenshot=" + str(target)], url, profile)
    return target if target.is_file() else None


def cmd_shots(slug):
    chrome = find_chrome()
    if not chrome:
        print("Chrome or Chromium is necessary for pictures, but it was not found. Set the variable CHROME to its path.", file=sys.stderr)
        return 1
    if cmd_build():
        return 1
    items = [it for it in load_all() if slug in (None, it.slug)]
    if slug and not items:
        print("No explainer with the name %s." % slug, file=sys.stderr)
        return 1
    if SHOTS.exists():
        shutil.rmtree(SHOTS)
    jobs = []
    for it in items:
        folder = SHOTS / it.slug
        folder.mkdir(parents=True)
        built = OUT / it.slug / "index.html"
        parts = ["top"] + re.findall(r'<section id="(s\d+)">', built.read_text(encoding="utf-8"))
        for name, width, theme, lang in VARIANTS:
            lang = lang if lang in it.langs() else "en"
            for part in parts:
                jobs.append((built, "only=%s&theme=%s&lang=%s" % (part, theme, lang), width, folder / ("%s-%s.png" % (name, part))))
    if not slug:
        (SHOTS / "home").mkdir(parents=True)
        for name, width, theme, lang in VARIANTS:
            jobs.append((OUT / "index.html", "theme=%s&lang=%s" % (theme, lang), width, SHOTS / "home" / (name + ".png")))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        done = list(pool.map(lambda job: take_shot(chrome, job), jobs))
    failed = [str(job[3].relative_to(ROOT)) for job, ok in zip(jobs, done) if not ok]
    for f in failed:
        print("ERROR  no picture: " + f, file=sys.stderr)
    print("Wrote %d picture(s) into %s/. One file for each section: width, colour mode, language, section." % (len(jobs) - len(failed), SHOTS.relative_to(ROOT)))
    print("These pictures show the page at rest. They do not show what a slider or a button does.")
    return 1 if failed else 0


def cmd_texts(slug):
    folder = SITE / slug
    if not (folder / "index.html").is_file():
        print("No explainer with the name %s." % slug, file=sys.stderr)
        return 1
    src = (folder / "index.html").read_text(encoding="utf-8")
    dm = re.search(r'<script type="application/json" id="i18n-de">(.*?)</script>', src, re.S)
    de = json.loads(dm.group(1)) if dm else {}
    seen = set()
    for m in re.finditer(r'<(\w+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>(.*?)</\1>', src, re.S):
        key = m.group(2)
        if key in seen:
            continue
        seen.add(key)
        print("[%s]\n  EN: %s\n  DE: %s\n" % (key, " ".join(strip_tags(m.group(3)).split()),
                                              " ".join(strip_tags(str(de.get(key, "(missing)"))).split())))
    for m in re.finditer(r'aria-label="([^"]*)"[^>]*data-i18n-aria="([^"]+)"', src):
        print("[%s] (label for screen readers)\n  EN: %s\n  DE: %s\n" % (m.group(2), html.unescape(m.group(1)), de.get(m.group(2), "(missing)")))
    return 0


def cmd_new(slug):
    m = SLUG_RE.match(slug)
    if not m:
        print("The name must be YYYY-MM-DD-slug, for example 2026-12-01-how-gps-works", file=sys.stderr)
        return 1
    target = SITE / slug
    if target.exists():
        print("The folder %s exists already." % target.relative_to(ROOT), file=sys.stderr)
        return 1
    shutil.copytree(TPL / "explainer", target)
    page = target / "index.html"
    page.write_text(page.read_text(encoding="utf-8").replace("YYYY-MM-DD", m.group(1)), encoding="utf-8")
    print("Created %s. Now follow .claude/skills/explainer/SKILL.md." % target.relative_to(ROOT))
    return 0


def main(argv):
    cmd = argv[1] if len(argv) > 1 else ""
    if cmd == "check":
        return cmd_check()
    if cmd == "build":
        return cmd_build()
    if cmd == "serve":
        return cmd_serve(int(argv[2]) if len(argv) > 2 else 8000)
    if cmd == "new" and len(argv) == 3:
        return cmd_new(argv[2])
    if cmd == "shots":
        return cmd_shots(argv[2] if len(argv) > 2 else None)
    if cmd == "texts" and len(argv) == 3:
        return cmd_texts(argv[2])
    print(__doc__)
    return 2


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except BrokenPipeError:
        # The reader of the output stopped early, for example "| head". This is not an error.
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
        sys.exit(0)
