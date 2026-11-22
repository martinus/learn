/* learn.ankerl.com: shared behaviour.
   Load this file in <head> without "defer". It sets colour mode and language before the first paint.

   What a page gets:
     Learn.lang()            "en" or "de"
     Learn.loc()             locale string for number formats
     Learn.t({en:..,de:..})  select the text for the current language
     Learn.onChange(fn)      call fn at start, and again when language or page width changes
     Learn.mk, Learn.plot, Learn.ticks, Learn.fmt, Learn.sgn, Learn.short   chart helpers
   Text of a page: English is in the HTML. German is in <script type="application/json" id="i18n-de">,
   with one entry for each data-i18n and data-i18n-aria key. */
(function(){
'use strict';
var root=document.documentElement;
var NS='http://www.w3.org/2000/svg';
var store={get:function(k){try{return localStorage.getItem(k);}catch(e){return null;}},set:function(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

/* ---- colour mode: set as early as possible ---- */
var savedTheme=store.get('learn-theme');
if(savedTheme==='light'||savedTheme==='dark')root.setAttribute('data-theme',savedTheme);
function curTheme(){var a=root.getAttribute('data-theme');if(a==='dark'||a==='light')return a;return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}

/* ---- language: set as early as possible ---- */
var langs=(root.getAttribute('data-langs')||'en').split(/\s+/);
function pickLang(){
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
var LOC={en:'en-US',de:'de-AT'};

function applyLang(l,save){
  if(langs.indexOf(l)<0)l=langs[0];
  lang=l;root.setAttribute('lang',l);
  if(save)store.set('learn-lang',l);
  var d=l==='en'?null:DICT[l]||{};
  i18nEls.forEach(function(e){var k=e.getAttribute('data-i18n'),v=d?d[k]:EN[k];if(v!=null)e.innerHTML=v;});
  ariaEls.forEach(function(e){var k=e.getAttribute('data-i18n-aria'),v=d?d[k]:EN_ARIA[k];if(v)e.setAttribute('aria-label',v);});
  var tl=root.getAttribute('data-title-'+l);
  document.title=tl||EN_TITLE;
  [].forEach.call(document.querySelectorAll('[data-set-lang]'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-set-lang')===l);});
  fire();
}
function showTheme(){var t=curTheme();[].forEach.call(document.querySelectorAll('[data-set-theme]'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-set-theme')===t);});}
function fire(){if(!started)return;listeners.forEach(function(f){try{f();}catch(e){if(window.console)console.error(e);}});}

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

  started=true;
  applyLang(lang,false);
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
  onChange:function(f){listeners.push(f);if(started){try{f();}catch(e){if(window.console)console.error(e);}}},
  mk:mk,plot:plot,ticks:ticks,fmt:fmt,sgn:sgn,short:short,clear:clear
};
})();
