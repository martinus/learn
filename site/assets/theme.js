/* learn.ankerl.com: shared behaviour.
   Load this file in <head> without "defer". It sets colour mode and language before the first paint.

   What a page gets:
     Learn.lang()            "en" or "de"
     Learn.loc()             locale string for number formats
     Learn.t({en:..,de:..})  select the text for the current language
     Learn.onChange(fn)      call fn at start, and again when language or page width changes
     Learn.mk, Learn.plot, Learn.ticks, Learn.fmt, Learn.sgn, Learn.short   chart helpers
     Learn.frame, Learn.label, Learn.press                                  helpers for a chart without Learn.plot
   Review mode, for pictures of a page (tools/learn.py shots uses it). Add to the address:
     ?theme=dark   ?lang=de   ?only=s03 (show one section; "top" is the page header)   ?review=1
     ?set=id:value,id:value (move controls: a value for a slider or a select, the number of the button for a group)
   These settings apply to one page view. The page does not store them.
   Term tips: <a class="term" href="#t-x"> shows the glossary entry with id t-x in a small box (see initTips).
   Comments: the footer button [data-comments-on] loads comments.js and comments.css from this folder.
   The browser remembers that comments are on, and loads them again on the next explainer.
   Text of a page: English is in the HTML. German is in <script type="application/json" id="i18n-de">,
   with one entry for each data-i18n and data-i18n-aria key. */
(function(){
'use strict';
var root=document.documentElement;
var NS='http://www.w3.org/2000/svg';
var SELF=(document.currentScript&&document.currentScript.src)||'';
var store={get:function(k){try{return localStorage.getItem(k);}catch(e){return null;}},set:function(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

/* ---- review mode: settings from the address ---- */
var Q={};
(location.search||'').replace(/^\?/,'').split('&').forEach(function(kv){var i=kv.indexOf('=');if(i>0){try{Q[decodeURIComponent(kv.slice(0,i))]=decodeURIComponent(kv.slice(i+1));}catch(e){}}});

/* ---- colour mode: set as early as possible ---- */
var savedTheme=store.get('learn-theme');
if(Q.theme==='light'||Q.theme==='dark')root.setAttribute('data-theme',Q.theme);
else if(savedTheme==='light'||savedTheme==='dark')root.setAttribute('data-theme',savedTheme);
function curTheme(){var a=root.getAttribute('data-theme');if(a==='dark'||a==='light')return a;return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}

/* ---- language: set as early as possible ---- */
var langs=(root.getAttribute('data-langs')||'en').split(/\s+/);
function pickLang(){
  if(Q.lang&&langs.indexOf(Q.lang)>=0)return Q.lang;
  var h=(location.hash||'').replace('#','');
  if(langs.indexOf(h)>=0)return h;
  var s=store.get('learn-lang');
  if(s&&langs.indexOf(s)>=0)return s;
  var n=(navigator.language||'en').slice(0,2).toLowerCase();
  return langs.indexOf(n)>=0?n:langs[0];
}
var lang=pickLang();
root.setAttribute('lang',lang);

var DICT={},EN={},EN_ARIA={},EN_TITLE='',i18nEls=[],ariaEls=[],listeners=[],started=false;
/* Number formats. German uses de-DE: 1.000.000 and 30,1, as references/writing.md asks. de-AT writes 1 000 000. */
var LOC={en:'en-US',de:'de-DE'};

function applyLang(l,save){
  tipHide();
  if(langs.indexOf(l)<0)l=langs[0];
  lang=l;root.setAttribute('lang',l);
  if(save)store.set('learn-lang',l);
  var d=l==='en'?null:DICT[l]||{};
  i18nEls.forEach(function(e){var k=e.getAttribute('data-i18n'),v=d?d[k]:EN[k];if(v!=null)e.innerHTML=v;});
  ariaEls.forEach(function(e){var k=e.getAttribute('data-i18n-aria'),v=d?d[k]:EN_ARIA[k];if(v)e.setAttribute('aria-label',v);});
  var tl=root.getAttribute('data-title-'+l);
  document.title=tl||EN_TITLE;
  [].forEach.call(document.querySelectorAll('[data-set-lang]'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-set-lang')===l);});
  fillNav();
  fire();
}
function showTheme(){var t=curTheme();[].forEach.call(document.querySelectorAll('[data-set-theme]'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-set-theme')===t);});}
function fire(){if(!started)return;listeners.forEach(function(f){try{f();}catch(e){if(window.console)console.error(e);}});}

/* ---- comments: a panel that collects the comments of the reader (assets/comments.js) ---- */
function loadComments(open){
  if(open)window.LEARN_COMMENTS_OPEN=true;
  if(window.LearnComments){if(open)window.LearnComments.open();return;}
  if(document.getElementById('learn-comments-js')||!SELF)return;
  var css=document.createElement('link');css.rel='stylesheet';css.href=SELF.replace('theme.js','comments.css');document.head.appendChild(css);
  var js=document.createElement('script');js.id='learn-comments-js';js.src=SELF.replace('theme.js','comments.js');document.head.appendChild(js);
}

/* ---- section navigation: a row under the site bar, and a rail in the left margin on wide screens ---- */
var NAV=null;
var NAV_TXT={label:{en:'Sections of this page',de:'Abschnitte dieser Seite'},open:{en:'Show all sections',de:'Alle Abschnitte zeigen'}};
function navLink(sec){
  var a=document.createElement('a');a.href='#'+sec.id;
  var n=document.createElement('span');n.className='n';n.textContent=sec.id.replace(/^s/,'');
  var t=document.createElement('span');t.className='t';
  a.appendChild(n);a.appendChild(t);return a;
}
function buildNav(){
  var main=document.querySelector('main.explainer'),bar=document.querySelector('.site-bar');
  if(!main||!bar)return;
  var secs=[].filter.call(main.querySelectorAll('section[id]'),function(s){return s.parentNode===main&&s.querySelector('h2');});
  if(secs.length<3)return;
  var rail=document.createElement('nav');rail.className='rail';
  var now=document.createElement('div');now.className='sec-now';
  var btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','sec-menu');
  btn.innerHTML='<span class="n"></span><span class="t"></span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var menu=document.createElement('nav');menu.className='sec-menu';menu.id='sec-menu';menu.hidden=true;
  secs.forEach(function(s){rail.appendChild(navLink(s));menu.appendChild(navLink(s));});
  now.appendChild(btn);now.appendChild(menu);bar.appendChild(now);document.body.appendChild(rail);
  function close(){menu.hidden=true;btn.setAttribute('aria-expanded','false');}
  btn.addEventListener('click',function(){var o=menu.hidden;menu.hidden=!o;btn.setAttribute('aria-expanded',o);});
  menu.addEventListener('click',function(e){if(e.target.closest('a'))close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  document.addEventListener('click',function(e){if(!now.contains(e.target))close();});
  NAV={main:main,secs:secs,rail:rail,now:now,btn:btn,menu:menu,cur:-2};
  var raf=0;
  window.addEventListener('scroll',function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;markNav();});},{passive:true});
}
function fillNav(){
  if(!NAV)return;
  var lists=[NAV.rail,NAV.menu];
  NAV.secs.forEach(function(s,i){var t=s.querySelector('h2').textContent.trim();lists.forEach(function(l){l.children[i].querySelector('.t').textContent=t;});});
  var lab=NAV_TXT.label[lang]||NAV_TXT.label.en;
  NAV.rail.setAttribute('aria-label',lab);NAV.menu.setAttribute('aria-label',lab);
  NAV.btn.setAttribute('aria-label',NAV_TXT.open[lang]||NAV_TXT.open.en);
  NAV.cur=-2;markNav();
}
function markNav(){
  if(!NAV)return;
  var cur=-1,i,end=NAV.main.getBoundingClientRect().bottom;
  for(i=0;i<NAV.secs.length;i++){if(NAV.secs[i].getClientRects().length&&NAV.secs[i].getBoundingClientRect().top<=120)cur=i;}
  if(end<120)cur=-1;
  NAV.rail.classList.toggle('off',end<220);
  if(cur===NAV.cur)return;
  NAV.cur=cur;
  [NAV.rail,NAV.menu].forEach(function(l){[].forEach.call(l.children,function(a,k){if(k===cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});});
  NAV.now.classList.toggle('on',cur>=0);
  if(cur>=0){NAV.btn.querySelector('.n').textContent=NAV.secs[cur].id.replace(/^s/,'');NAV.btn.querySelector('.t').textContent=NAV.secs[cur].querySelector('h2').textContent.trim();}
  else{NAV.menu.hidden=true;NAV.btn.setAttribute('aria-expanded','false');}
}

/* ---- term tips: a term in the text shows its glossary entry in a small box ----
   <a class="term" href="#t-cmb">CMB</a> in a sentence, or <mi data-term="t-w" tabindex="0">w</mi> in a formula,
   points to <div id="t-cmb"><dt>..</dt><dd>..</dd></div> in <dl class="gloss">.
   Mouse: the box opens on hover. Touch and click: a tap opens or closes it. Keyboard: it opens on focus, Escape closes it.
   Without this script, the link jumps to the glossary entry. */
var TIP=null;
function tipEntry(el){
  var id=el.getAttribute('data-term')||(el.getAttribute('href')||'').replace(/^#/,'');
  var g=id&&document.getElementById(id);
  return g&&g.querySelector('dt')&&g.querySelector('dd')?g:null;
}
function tipFind(t){return t&&t.closest?t.closest('a.term,[data-term]'):null;}
function tipShow(el,pin){
  clearTimeout(TIP.t);
  var g=tipEntry(el);if(!g)return;
  if(TIP.el&&TIP.el!==el)TIP.el.removeAttribute('aria-describedby');
  TIP.el=el;TIP.pin=pin;
  var b=TIP.box;
  b.innerHTML='<b class="tip-t"></b><span class="tip-d"></span>';
  b.firstChild.innerHTML=g.querySelector('dt').innerHTML;
  b.lastChild.innerHTML=g.querySelector('dd').innerHTML;
  /* a term inside the box stays plain text: one box at a time */
  [].forEach.call(b.querySelectorAll('[data-term]'),function(e){e.removeAttribute('data-term');e.removeAttribute('tabindex');});
  [].forEach.call(b.querySelectorAll('a.term'),function(a){var s=document.createElement('span');s.innerHTML=a.innerHTML;a.parentNode.replaceChild(s,a);});
  [].forEach.call(b.querySelectorAll('[id]'),function(e){e.removeAttribute('id');});
  el.setAttribute('aria-describedby','tip-pop');
  b.hidden=false;tipPlace();
}
function tipHide(){
  if(!TIP||!TIP.el)return;
  clearTimeout(TIP.t);TIP.el.removeAttribute('aria-describedby');TIP.el=null;TIP.pin=false;TIP.box.hidden=true;
}
function tipPlace(){
  var el=TIP.el,b=TIP.box;if(!el)return;
  var rs=el.getClientRects(),r=rs.length?rs[0]:el.getBoundingClientRect(),m=8,vw=root.clientWidth,vh=window.innerHeight;
  /* the site bar and the section row are sticky: the box must not go under them */
  var top=m;[].forEach.call(document.querySelectorAll('.site-bar,.sec-now.on'),function(e){top=Math.max(top,e.getBoundingClientRect().bottom+m);});
  /* 100vw in CSS counts the scroll bar, so the width limit comes from here */
  b.style.left='0px';b.style.top='0px';b.style.maxWidth=Math.min(368,vw-2*m)+'px';
  var w=b.offsetWidth,h=b.offsetHeight;
  var x=Math.max(m,Math.min(r.left+r.width/2-w/2,vw-w-m));
  var y=r.bottom+6;
  if(y+h>vh-m&&r.top-6-h>=top)y=r.top-6-h;
  b.style.left=Math.round(x+window.pageXOffset)+'px';b.style.top=Math.round(y+window.pageYOffset)+'px';
}
function initTips(){
  if(!document.querySelector('a.term,[data-term]'))return;
  var box=document.createElement('div');box.className='tip-pop';box.id='tip-pop';box.setAttribute('role','tooltip');box.hidden=true;
  document.body.appendChild(box);
  TIP={box:box,el:null,pin:false,t:0};
  document.addEventListener('mouseover',function(e){
    if(box.contains(e.target)){clearTimeout(TIP.t);return;}
    var el=tipFind(e.target);if(!el)return;
    clearTimeout(TIP.t);
    if(el!==TIP.el)TIP.t=setTimeout(function(){tipShow(el,false);},120);
  });
  document.addEventListener('mouseout',function(e){
    var from=box.contains(e.target)?box:tipFind(e.target);if(!from)return;
    var to=e.relatedTarget;
    if(to&&(from.contains(to)||box.contains(to)||(TIP.el&&TIP.el.contains(to))))return;
    clearTimeout(TIP.t);
    if(!TIP.pin)TIP.t=setTimeout(tipHide,250);
  });
  document.addEventListener('click',function(e){
    var el=tipFind(e.target);
    if(el&&!box.contains(el)){e.preventDefault();if(TIP.el===el&&TIP.pin)tipHide();else tipShow(el,true);return;}
    if(!box.contains(e.target))tipHide();
  });
  document.addEventListener('focusin',function(e){
    var el=tipFind(e.target);
    if(el&&!box.contains(el)){if(el!==TIP.el)tipShow(el,false);}
    else if(!box.contains(e.target))tipHide();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&TIP.el){var el=TIP.el;tipHide();if(el.focus)el.focus();}});
  window.addEventListener('resize',function(){if(TIP.el)tipPlace();});
}

/* ---- syntax colours for <pre class="code" data-lang="cpp"> ----
   Marks comments, strings, numbers and keywords. A block without data-lang stays plain.
   The site uses no packages, so this is a small scanner and no full parser. */
var KEYWORDS={
  cpp:'alignas alignof auto bool break case catch char class concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept nullptr operator private protected public reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typename union unsigned using virtual void volatile while',
  js:'async await break case catch class const continue default delete do else export extends false finally for function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield',
  py:'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield',
  sh:'case do done elif else esac export fi for function if in local return then until while',
  rust:'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while'
};
KEYWORDS.c=KEYWORDS.cpp;
function colourCode(code){
  var lang=code.parentNode.getAttribute('data-lang'),words=KEYWORDS[lang];
  if(!words)return;
  var kw={};words.split(' ').forEach(function(w){kw[w]=1;});
  var hash=lang==='py'||lang==='sh';
  /* groups: 1 comment, 2 string, 3 number, 4 word */
  var re=new RegExp((hash?'(#[^\\n]*)':'(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)')+
    '|("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\''+(lang==='js'?'|`(?:\\\\.|[^`\\\\])*`':'')+')'+
    '|(\\b(?:0[xX][\\da-fA-F\']+|\\d[\\d\']*\\.?\\d*(?:[eE][+-]?\\d+)?)\\w*)'+
    '|([A-Za-z_#]\\w*)','g');
  var src=code.textContent,out=document.createDocumentFragment(),last=0,m;
  function add(text,cls){if(!text)return;if(!cls){out.appendChild(document.createTextNode(text));return;}var e=document.createElement('span');e.className=cls;e.textContent=text;out.appendChild(e);}
  while((m=re.exec(src))){
    var cls=m[1]?'tk-c':m[2]?'tk-s':m[3]?'tk-n':(kw[m[4]]||(!hash&&m[4].charAt(0)==='#'))?'tk-k':'';
    if(!cls)continue;
    add(src.slice(last,m.index));add(m[0],cls);last=m.index+m[0].length;
  }
  add(src.slice(last));
  code.textContent='';code.appendChild(out);
}

function start(){
  EN_TITLE=document.title;
  var dj=document.getElementById('i18n-de');
  if(dj){try{DICT.de=JSON.parse(dj.textContent);}catch(e){DICT.de={};}}
  i18nEls=[].slice.call(document.querySelectorAll('[data-i18n]'));
  ariaEls=[].slice.call(document.querySelectorAll('[data-i18n-aria]'));
  i18nEls.forEach(function(e){var k=e.getAttribute('data-i18n');if(!(k in EN))EN[k]=e.innerHTML;});
  ariaEls.forEach(function(e){EN_ARIA[e.getAttribute('data-i18n-aria')]=e.getAttribute('aria-label');});

  [].forEach.call(document.querySelectorAll('[data-lang-switch]'),function(g){g.hidden=langs.length<2;});
  [].forEach.call(document.querySelectorAll('[data-set-lang]'),function(b){b.addEventListener('click',function(){applyLang(b.getAttribute('data-set-lang'),true);});});
  [].forEach.call(document.querySelectorAll('[data-set-theme]'),function(b){b.addEventListener('click',function(){var t=b.getAttribute('data-set-theme');root.setAttribute('data-theme',t);store.set('learn-theme',t);showTheme();});});
  if(window.MutationObserver)new MutationObserver(showTheme).observe(root,{attributes:true,attributeFilter:['data-theme']});
  if(window.matchMedia){var mq=window.matchMedia('(prefers-color-scheme: dark)');if(mq.addEventListener)mq.addEventListener('change',showTheme);}
  showTheme();

  window.addEventListener('hashchange',function(){var h=(location.hash||'').replace('#','');if(langs.indexOf(h)>=0)applyLang(h,false);});

  var bar=document.querySelector('.progress i');
  if(bar){var upd=function(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;bar.style.width=(max>0?Math.min(100,h.scrollTop/max*100):0)+'%';};window.addEventListener('scroll',upd,{passive:true});upd();}

  var raf=0,lastW=root.clientWidth;
  window.addEventListener('resize',function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){var w=root.clientWidth;if(w!==lastW){lastW=w;fire();}});});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fire);

  buildNav();
  initTips();
  [].forEach.call(document.querySelectorAll('pre.code[data-lang] > code'),colourCode);
  if(document.querySelector('main.explainer')&&!Q.review&&!Q.only){
    [].forEach.call(document.querySelectorAll('[data-comments-on]'),function(b){b.addEventListener('click',function(){store.set('learn-comments','on');loadComments(true);});});
    if(store.get('learn-comments')==='on')loadComments(false);
  }else{
    [].forEach.call(document.querySelectorAll('[data-comments-on]'),function(b){b.hidden=true;});
  }
  if(Q.only){
    root.classList.add('review-only');
    var mainEl=document.querySelector('main.explainer');
    if(mainEl){[].forEach.call(mainEl.children,function(c){var keep=Q.only==='top'?c.tagName==='HEADER':c.id===Q.only;if(!keep)c.style.display='none';});}
    [].forEach.call(document.querySelectorAll('.next,.site-foot'),function(c){c.style.display='none';});
  }
  started=true;
  applyLang(lang,false);
  if(Q.set){
    /* Review mode: a picture of a figure in a position that the reader can reach, but that the page does not start in. */
    Q.set.split(',').forEach(function(kv){
      var i=kv.indexOf(':'),e=i>0?document.getElementById(kv.slice(0,i)):null,v=kv.slice(i+1);
      if(!e)return;
      if(e.tagName==='INPUT'||e.tagName==='SELECT'){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
      else{var b=e.tagName==='BUTTON'?e:e.querySelectorAll('button')[+v];if(b)b.click();}
    });
  }
  if(Q.review||Q.only){
    /* The tool reads this value to make a picture with the exact height of the content. */
    var measure=function(){root.setAttribute('data-review-height',Math.ceil(document.documentElement.scrollHeight));};
    measure();setTimeout(measure,300);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){setTimeout(measure,50);});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

/* ---- helpers for charts ---- */
function loc(){return LOC[lang]||'en-US';}
function mk(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function fmt(n){return Math.round(n).toLocaleString(loc());}
function sgn(v,d){var s=Math.abs(v).toLocaleString(loc(),{maximumFractionDigits:d,minimumFractionDigits:d});return (v<0?'−':'')+s;}
function short(v){var a=Math.abs(v),s;if(a>=1e6)s=(a/1e6).toLocaleString(loc())+'M';else if(a>=1e3)s=(a/1e3).toLocaleString(loc())+'k';else s=a.toLocaleString(loc());return (v<0?'−':'')+s;}
function ticks(lo,hi,n){var raw=(hi-lo)/n,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p,step=(m<1.5?1:m<3.5?2:m<7.5?5:10)*p,out=[];for(var v=Math.ceil(lo/step-1e-9)*step;v<=hi+step*1e-6;v+=step)out.push(+v.toPrecision(10));return out;}
function clear(svg){while(svg.firstChild)svg.removeChild(svg.firstChild);}
/* For a chart that does not use plot: empty the <svg>, give it the height h at its real pixel width, return the width. */
function frame(svg,h){var w=Math.max(260,svg.getBoundingClientRect().width||640);svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('height',h);clear(svg);return w;}
/* A text in a chart. cls is "lbl" if left out, anchor is "start", "middle" or "end". */
function label(svg,x,y,s,cls,anchor){var t=mk('text',{x:x,y:y,'class':cls||'lbl'},svg);if(anchor)t.setAttribute('text-anchor',anchor);t.textContent=s;return t;}
/* Mark one button of a group (<div class="seg">) as pressed. */
function press(group,btn){[].forEach.call(group.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',b===btn?'true':'false');});}
/* Prepare an <svg class="chart"> at the real pixel width, draw grid and axis labels,
   and return the scale functions. o = {h, x0, x1, y0, y1}. Text keeps its real size on a phone. */
function plot(svg,o){
  var w=Math.max(260,svg.getBoundingClientRect().width||640),h=o.h;
  svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('height',h);clear(svg);
  var m={l:44,r:10,t:10,b:24};
  function sx(x){return m.l+(x-o.x0)/(o.x1-o.x0)*(w-m.l-m.r);}
  function sy(y){return h-m.b-(y-o.y0)/(o.y1-o.y0)*(h-m.t-m.b);}
  var g=mk('g',{'class':'ax'},svg);
  ticks(o.y0,o.y1,4).forEach(function(v){mk('line',{x1:m.l,x2:w-m.r,y1:sy(v),y2:sy(v)},g);mk('text',{x:m.l-6,y:sy(v)+4,'text-anchor':'end'},g).textContent=short(v);});
  ticks(o.x0,o.x1,w<430?4:6).forEach(function(v){if(sx(v)>w-m.r+1)return;mk('text',{x:sx(v),y:h-6,'text-anchor':v===o.x1?'end':'middle'},g).textContent=short(v);});
  return {sx:sx,sy:sy,w:w,h:h,m:m};
}

window.Learn={
  lang:function(){return lang;},
  loc:loc,
  t:function(o){return o[lang]!=null?o[lang]:o.en;},
  store:store,
  onChange:function(f){listeners.push(f);if(started){try{f();}catch(e){if(window.console)console.error(e);}}},
  mk:mk,plot:plot,ticks:ticks,fmt:fmt,sgn:sgn,short:short,clear:clear,frame:frame,label:label,press:press
};
})();
