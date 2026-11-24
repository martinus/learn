/* learn.ankerl.com: comments of the reader on an explainer.
   theme.js loads this file when the reader turns comments on (footer button "Comment on this page").

   What the reader can do. All writing, editing and deleting happens in the panel at the side (bottom on a phone):
     select text in the page, then press "Comment"      the panel opens with a new comment on that text
     press the comment button of a section               the panel opens with a new comment on the section
     click marked text                                   the panel opens with that comment, ready to edit
     open the panel (button at the bottom right)         see all comments in page order, copy them as one
                                                         prompt for an AI agent, or open them as a GitHub issue
   Storage: localStorage of the browser, key "learn-comments:<path of the page>". Nothing goes to a server.
   A comment finds its text again with the text itself (whitespace collapsed) and the number of the
   occurrence in its section. If the page text changed, the comment stays in the list as "text not found".
   All elements of this file have the class "cm-ui". The text search skips them. */
(function(){
'use strict';
if(window.LearnComments||!window.Learn)return;
var main=document.querySelector('main.explainer');
if(!main)return;
var root=document.documentElement;
var KEY='learn-comments:'+location.pathname;
var store=Learn.store;
var alive=true; /* false after "Turn off comments": the listeners on document and main then do nothing */

var TXT={
  comment:{en:'Comment',de:'Kommentieren'},
  comments:{en:'Comments',de:'Kommentare'},
  panelTitle:{en:'Your comments on this page',de:'Ihre Kommentare zu dieser Seite'},
  hint:{en:'Select text and press “Comment”, or use the comment button of a section. A click on marked text opens its comment. The comments stay in this browser until you copy or send them.',de:'Markieren Sie Text und drücken Sie „Kommentieren“, oder verwenden Sie die Kommentar-Schaltfläche eines Abschnitts. Ein Klick auf markierten Text öffnet seinen Kommentar. Die Kommentare bleiben in diesem Browser, bis Sie sie kopieren oder senden.'},
  none:{en:'No comments yet.',de:'Noch keine Kommentare.'},
  whole:{en:'Comment on the whole page',de:'Ganze Seite kommentieren'},
  copy:{en:'Copy prompt',de:'Prompt kopieren'},
  issue:{en:'Open as GitHub issue',de:'Als GitHub-Issue öffnen'},
  show:{en:'Show the prompt',de:'Prompt anzeigen'},
  delAll:{en:'Delete all',de:'Alle löschen'},
  off:{en:'Turn off comments',de:'Kommentare ausschalten'},
  close:{en:'Close',de:'Schließen'},
  save:{en:'Save',de:'Speichern'},
  cancel:{en:'Cancel',de:'Abbrechen'},
  del:{en:'Delete',de:'Löschen'},
  edit:{en:'Edit',de:'Bearbeiten'},
  go:{en:'Show in page',de:'In der Seite zeigen'},
  placeholder:{en:'Your question, correction or request',de:'Ihre Frage, Korrektur oder Bitte'},
  page:{en:'Whole page',de:'Ganze Seite'},
  top:{en:'Page header',de:'Seitenkopf'},
  lost:{en:'Text not found in the page. The page changed, or it shows a different language.',de:'Text nicht in der Seite gefunden. Die Seite hat sich geändert, oder sie zeigt eine andere Sprache.'},
  copied:{en:'Copied. Paste the prompt into the agent.',de:'Kopiert. Fügen Sie den Prompt beim Agenten ein.'},
  copyFail:{en:'The browser did not allow the copy. Open “Show the prompt” and copy the text.',de:'Der Browser hat das Kopieren nicht erlaubt. Öffnen Sie „Prompt anzeigen“ und kopieren Sie den Text.'},
  long:{en:'The prompt is too long for a link. It is on your clipboard: paste it into the issue.',de:'Der Prompt ist zu lang für einen Link. Er ist in der Zwischenablage: Fügen Sie ihn in das Issue ein.'},
  deleted:{en:'Comment deleted.',de:'Kommentar gelöscht.'},
  undo:{en:'Undo',de:'Rückgängig'},
  confirmAll:{en:'Delete all comments on this page?',de:'Alle Kommentare zu dieser Seite löschen?'}
};
function t(k){return Learn.t(TXT[k]);}

/* ---------- storage ---------- */
var list=[];
try{list=JSON.parse(store.get(KEY)||'[]');if(!Array.isArray(list))list=[];}catch(e){list=[];}
function save(){store.set(KEY,JSON.stringify(list.map(function(c){return {id:c.id,sec:c.sec,head:c.head,quote:c.quote,occ:c.occ,lang:c.lang,text:c.text,time:c.time};})));}

/* ---------- parts of the page ---------- */
/* A part is the page header ("top") or a numbered section ("s03"). */
function parts(){return [].filter.call(main.children,function(e){return e.tagName==='HEADER'||(e.tagName==='SECTION'&&e.id);});}
function partOf(node){
  var e=node&&(node.nodeType===1?node:node.parentNode);
  while(e&&e.parentNode!==main)e=e.parentNode;
  if(!e||(e.tagName!=='HEADER'&&!(e.tagName==='SECTION'&&e.id)))return null;
  return e;
}
function partId(e){return e.tagName==='HEADER'?'top':e.id;}
function partEl(id){if(id==='top')return main.querySelector(':scope > header');return id?document.getElementById(id):null;}
function partHead(e){var h=e.querySelector(e.tagName==='HEADER'?'h1':'h2');return h?h.textContent.replace(/\s+/g,' ').trim():'';}
function partLabel(c){
  if(!c.sec)return t('page');
  if(c.sec==='top')return t('top')+(c.head?' · '+c.head:'');
  return c.sec.replace(/^s/,'')+' · '+c.head;
}

/* ---------- text map: visible text of a part, whitespace collapsed, with the position of each character ---------- */
function isWs(c){return c===32||c===9||c===10||c===13||c===160;}
function textMap(el){
  var text='',nodes=[],offs=[],sp=true,n,d,i;
  var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:function(x){
    var p=x.parentElement;
    if(!p||p.closest('script,style,.cm-ui'))return NodeFilter.FILTER_REJECT;
    if(!p.getClientRects().length)return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  while((n=w.nextNode())){
    d=n.data;
    for(i=0;i<d.length;i++){
      if(isWs(d.charCodeAt(i))){if(!sp){text+=' ';nodes.push(n);offs.push(i);sp=true;}}
      else{text+=d[i];nodes.push(n);offs.push(i);sp=false;}
    }
  }
  return {text:text,nodes:nodes,offs:offs};
}
function norm(s){return String(s).replace(/[\s ]+/g,' ').trim();}
/* Range of the selection -> [start, end) in the text map */
function rangeToIdx(r,m){
  var s=-1,e=-1,k,n,o,last=null,inside=false;
  for(k=0;k<m.text.length;k++){
    n=m.nodes[k];o=m.offs[k];
    if(n!==last){last=n;inside=r.intersectsNode(n);}
    if(!inside)continue;
    if(n===r.startContainer&&o<r.startOffset)continue;
    if(n===r.endContainer&&o>=r.endOffset)continue;
    if(s<0)s=k;
    e=k+1;
  }
  if(s<0)return null;
  while(s<e&&m.text[s]===' ')s++;
  while(e>s&&m.text[e-1]===' ')e--;
  return e>s?[s,e]:null;
}
function idxToRange(m,s,e){
  var r=document.createRange();
  r.setStart(m.nodes[s],m.offs[s]);
  r.setEnd(m.nodes[e-1],m.offs[e-1]+1);
  return r;
}
function nth(text,q,n){var i=-1,k;for(k=0;k<=n;k++){i=text.indexOf(q,i+1);if(i<0)return -1;}return i;}
function locate(c){
  if(!c.quote)return null;
  var el=partEl(c.sec);if(!el)return null;
  var m=textMap(el),i=nth(m.text,c.quote,c.occ||0);
  if(i<0)i=m.text.indexOf(c.quote);
  return i<0?null:idxToRange(m,i,i+c.quote.length);
}

/* ---------- highlights (CSS Custom Highlight API; without it, the page shows no marks) ---------- */
var HL=window.CSS&&CSS.highlights&&window.Highlight;
var hlAll=HL?new Highlight():null,hlNow=HL?new Highlight():null;
if(HL){CSS.highlights.set('learn-comment',hlAll);CSS.highlights.set('learn-comment-now',hlNow);}
function relocate(){
  list.forEach(function(c){c.range=locate(c);});
  if(hlAll){hlAll.clear();list.forEach(function(c){if(c.range)hlAll.add(c.range);});}
}
function markNow(r){if(!hlNow)return;hlNow.clear();if(r)hlNow.add(r);}

/* ---------- small DOM helper ---------- */
function el(tag,cls,parent,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;if(parent)parent.appendChild(e);return e;}
function btn(cls,parent,text,fn){var b=el('button',cls,parent,text);b.type='button';if(fn)b.addEventListener('click',fn);return b;}
var ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>';

/* ---------- button at the selection ---------- */
var selBtn=btn('cm-ui cm-sel',document.body,'');
selBtn.innerHTML=ICON+'<span></span>';
selBtn.hidden=true;
var pending=null,WORD=/[\p{L}\p{N}]/u;
selBtn.addEventListener('mousedown',function(e){e.preventDefault();});
selBtn.addEventListener('click',function(){
  if(!pending)return;
  var p=pending;selBtn.hidden=true;
  startDraft({sec:p.sec,head:p.head,quote:p.quote,occ:p.occ,range:p.range},true);
  var s=window.getSelection();if(s)s.removeAllRanges();
});
function readSelection(){
  var s=window.getSelection();
  if(!s||s.rangeCount===0||s.isCollapsed){pending=null;selBtn.hidden=true;return;}
  var r=s.getRangeAt(0),part=partOf(r.startContainer);
  if(!part||(r.commonAncestorContainer.nodeType===1&&r.commonAncestorContainer.closest&&r.commonAncestorContainer.closest('.cm-ui'))){pending=null;selBtn.hidden=true;return;}
  var m=textMap(part),ix=rangeToIdx(r,m);
  if(!ix){pending=null;selBtn.hidden=true;return;}
  /* a selection that starts or ends inside a word gets the whole word */
  while(ix[0]>0&&WORD.test(m.text[ix[0]-1])&&WORD.test(m.text[ix[0]]))ix[0]--;
  while(ix[1]<m.text.length&&WORD.test(m.text[ix[1]])&&WORD.test(m.text[ix[1]-1]))ix[1]++;
  var q=m.text.slice(ix[0],ix[1]),occ=0,i=-1;
  while((i=m.text.indexOf(q,i+1))>=0&&i<ix[0])occ++;
  pending={sec:partId(part),head:partHead(part),quote:q,occ:occ,range:idxToRange(m,ix[0],ix[1])};
  /* the last line of the selection: the rect with the lowest bottom, and in it the right end */
  var rects=[].filter.call(r.getClientRects(),function(x){return x.width>0;}),b=null;
  rects.forEach(function(x){if(!b||x.bottom>b.bottom+2||(Math.abs(x.bottom-b.bottom)<=2&&x.right>b.right))b=x;});
  if(!b)b=r.getBoundingClientRect();
  selBtn.querySelector('span').textContent=t('comment');
  selBtn.hidden=false;
  var w=selBtn.offsetWidth||120,vw=root.clientWidth;
  /* below the end of the selection: on a phone, the menu of the system is above it */
  var x=Math.min(Math.max(8,b.right-w/2),vw-w-8),y=b.bottom+window.scrollY+(matchMedia('(pointer:coarse)').matches?30:8);
  selBtn.style.left=x+'px';selBtn.style.top=y+'px';
}
var selT=0;
document.addEventListener('selectionchange',function(){if(!alive)return;clearTimeout(selT);selT=setTimeout(readSelection,250);});
window.addEventListener('resize',function(){if(!alive||selBtn.hidden)return;clearTimeout(selT);selT=setTimeout(readSelection,250);});

/* ---------- comment buttons of the parts ---------- */
function addPartButtons(){
  parts().forEach(function(p){
    if(p.querySelector(':scope > .cm-part'))return;
    var b=btn('cm-ui cm-part',p,'',function(){startDraft({sec:partId(p),head:partHead(p),quote:'',occ:0},true);});
    b.innerHTML=ICON;
    b.setAttribute('aria-label',t('comment')+': '+partHead(p));
    b.title=t('comment');
  });
}

/* ---------- editing: all in the panel ----------
   The draft is the one comment that the panel shows with a text field: a new comment, or one of the list. */
var draft=null,undo=null;
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function startDraft(c,isNew){
  keepDraft();
  draft={c:c,isNew:isNew,text:c.text||''};
  open();
  markNow(c.range||null);
  focusDraft(true);
}
/* A draft with text is saved when a different draft starts or the panel closes, so typed text does not get lost. */
function keepDraft(){if(draft&&draft.text.trim())commit();else endDraft();}
function commit(){
  var d=draft;if(!d)return;
  var v=d.text.trim();
  if(v){
    d.c.text=v;
    if(d.isNew){d.c.id=newId();d.c.time=new Date().toISOString();d.c.lang=Learn.lang();list.push(d.c);}
    save();
  }
  endDraft();relocate();
}
function endDraft(){draft=null;markNow(null);}
function remove(c){
  var i=list.indexOf(c);if(i<0)return;
  list.splice(i,1);undo={c:c,i:i};
  if(draft&&draft.c===c)endDraft();
  save();relocate();render();
  msg(t('deleted'),t('undo'),function(){if(!undo)return;list.splice(Math.min(undo.i,list.length),0,undo.c);undo=null;save();relocate();render();msg('');});
}
/* after Save or Cancel: the keyboard focus stays in the panel */
function done(){render();panel.focus({preventScroll:true});}
function focusDraft(scroll){
  var ta=P('.cm-input');if(!ta)return;
  if(scroll)ta.closest('li').scrollIntoView({block:'nearest'});
  ta.focus({preventScroll:true});
  var n=ta.value.length;try{ta.setSelectionRange(n,n);}catch(e){}
}
/* A click on marked text opens its comment in the panel. */
main.addEventListener('click',function(e){
  if(!alive)return;
  if(e.target.closest('a,button,input,select,textarea,label,.cm-ui'))return;
  var s=window.getSelection();if(s&&!s.isCollapsed)return;
  var node,off;
  if(document.caretPositionFromPoint){var cp=document.caretPositionFromPoint(e.clientX,e.clientY);if(!cp)return;node=cp.offsetNode;off=cp.offset;}
  else if(document.caretRangeFromPoint){var cr=document.caretRangeFromPoint(e.clientX,e.clientY);if(!cr)return;node=cr.startContainer;off=cr.startOffset;}
  else return;
  for(var i=0;i<list.length;i++){
    var r=list[i].range;
    try{if(r&&r.isPointInRange(node,off)&&!(r.endContainer===node&&r.endOffset===off)){startDraft(list[i],false);return;}}catch(err){}
  }
});

/* ---------- order: as in the page ---------- */
function partIndex(c){if(!c.sec)return -1;var i=parts().indexOf(partEl(c.sec));return i<0?999:i;}
function sorted(items){
  return items.slice().sort(function(a,b){
    var d=partIndex(a)-partIndex(b);if(d)return d;
    if(!a.quote!==!b.quote)return a.quote?1:-1;   /* a comment on the whole section comes first */
    if(a.range&&b.range){d=a.range.compareBoundaryPoints(Range.START_TO_START,b.range);if(d)return d;}
    else if(a.range||b.range)return a.range?-1:1; /* text not found: at the end of its section */
    return (a.time||'~')<(b.time||'~')?-1:1;
  });
}

/* ---------- panel ---------- */
var fab=btn('cm-ui cm-fab',document.body,'',function(){if(panel.hidden)open();else closePanel();});
fab.innerHTML=ICON+'<span class="cm-count"></span>';
var panel=el('aside','cm-ui cm-panel',document.body);panel.hidden=true;panel.id='cm-panel';panel.tabIndex=-1;
fab.setAttribute('aria-controls','cm-panel');
panel.innerHTML='<div class="cm-head"><h2></h2><button type="button" class="cm-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
  '<div class="cm-body"><p class="cm-hint"></p><ol class="cm-list"></ol>'+
  '<button type="button" class="cm-whole"></button>'+
  '<div class="cm-act"><button type="button" class="cm-primary cm-copy"></button><button type="button" class="cm-issue"></button></div>'+
  '<p class="cm-msg" role="status"><span></span><button type="button"></button></p>'+
  '<details class="cm-prompt"><summary></summary><textarea readonly rows="12"></textarea></details>'+
  '<div class="cm-more"><button type="button" class="cm-delall"></button><button type="button" class="cm-off"></button></div></div>';
var P=function(s){return panel.querySelector(s);};
P('.cm-x').addEventListener('click',closePanel);
P('.cm-whole').addEventListener('click',function(){startDraft({sec:'',head:'',quote:'',occ:0},true);});
P('.cm-copy').addEventListener('click',function(){keepDraft();render();copy(prompt(),function(ok){msg(ok?t('copied'):t('copyFail'));if(!ok)P('.cm-prompt').open=true;});});
P('.cm-issue').addEventListener('click',function(){keepDraft();render();openIssue();});
P('.cm-delall').addEventListener('click',function(){if(list.length&&window.confirm(t('confirmAll'))){list=[];endDraft();save();relocate();render();}});
P('.cm-off').addEventListener('click',function(){keepDraft();store.set('learn-comments','off');closePanel();teardown();});
var msgFn=null;
P('.cm-msg button').addEventListener('click',function(){if(msgFn)msgFn();});
panel.addEventListener('keydown',function(e){if(e.key==='Escape')closePanel();});
function open(){
  var was=!panel.hidden;
  panel.hidden=false;fab.setAttribute('aria-expanded','true');render();
  if(!was&&!draft)panel.focus();
}
function closePanel(){keepDraft();panel.hidden=true;fab.setAttribute('aria-expanded','false');msg('');render();}
function msg(s,action,fn){
  P('.cm-msg span').textContent=s;
  var b=P('.cm-msg button');b.textContent=action||'';b.hidden=!action;msgFn=fn||null;
  P('.cm-msg').hidden=!s;
}

function render(){
  var n=list.length;
  fab.querySelector('.cm-count').textContent=n?String(n):'';
  fab.setAttribute('aria-label',t('comments')+(n?' ('+n+')':''));
  fab.title=t('comments');
  P('h2').textContent=t('panelTitle');
  P('.cm-x').setAttribute('aria-label',t('close'));
  P('.cm-hint').textContent=t('hint');
  P('.cm-whole').textContent=t('whole');
  P('.cm-copy').textContent=t('copy');
  P('.cm-issue').textContent=t('issue');
  P('.cm-prompt summary').textContent=t('show');
  P('.cm-delall').textContent=t('delAll');
  P('.cm-off').textContent=t('off');
  P('.cm-copy').disabled=!n;P('.cm-issue').disabled=!n;P('.cm-delall').disabled=!n;
  P('.cm-prompt').hidden=!n;
  P('.cm-prompt textarea').value=n?prompt():'';
  [].forEach.call(document.querySelectorAll('.cm-part'),function(b){b.title=t('comment');});
  var ol=P('.cm-list'),ae=document.activeElement,hadFocus=!!(draft&&ae&&ae.classList&&ae.classList.contains('cm-input'));
  ol.innerHTML='';
  var items=list.slice();if(draft&&draft.isNew)items.push(draft.c);
  if(!items.length){el('li','cm-none',ol,t('none'));return;}
  sorted(items).forEach(function(c){
    var li=el('li','',ol),ed=!!(draft&&draft.c===c),row;
    el('span','cm-where',li,partLabel(c));
    if(c.quote)el('blockquote','cm-quote',li,shorten(c.quote,200));
    if(c.quote&&!c.range)el('span','cm-lost',li,t('lost'));
    if(ed){
      li.className='cm-editing';
      var ta=el('textarea','cm-input',li);ta.rows=4;ta.value=draft.text;ta.placeholder=t('placeholder');ta.setAttribute('aria-label',t('placeholder'));
      ta.addEventListener('input',function(){draft.text=ta.value;});
      ta.addEventListener('keydown',function(e){
        if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();commit();done();}
        else if(e.key==='Escape'){e.stopPropagation();endDraft();done();}
      });
      row=el('div','cm-row',li);
      btn('cm-primary',row,t('save'),function(){commit();done();});
      btn('cm-plain',row,t('cancel'),function(){endDraft();done();});
      if(!draft.isNew)btn('cm-plain cm-delbtn',row,t('del'),function(){remove(c);});
    }else{
      el('p','cm-text',li,c.text);
      row=el('div','cm-row',li);
      btn('cm-link',row,t('edit'),function(){startDraft(c,false);});
      if(c.range||(!c.quote&&partEl(c.sec)))btn('cm-link',row,t('go'),function(){goTo(c);});
      btn('cm-link cm-delbtn',row,t('del'),function(){remove(c);});
    }
  });
  if(hadFocus)focusDraft(false);
}
function goTo(c){
  var r=c.range,target=r?r.getBoundingClientRect():partEl(c.sec).getBoundingClientRect();
  if(root.clientWidth<900)closePanel();
  window.scrollTo({top:Math.max(0,target.top+window.scrollY-window.innerHeight*0.3),behavior:'smooth'});
  if(r){markNow(r);setTimeout(function(){markNow(null);},1600);}
}

/* ---------- the prompt for the agent ---------- */
function shorten(s,max){if(s.length<=max)return s;var a=Math.round(max*0.6);return s.slice(0,a)+' […] '+s.slice(s.length-(max-a));}
function pageUrl(){return location.origin+location.pathname;}
function prompt(){
  var src=root.getAttribute('data-src')||location.pathname,upd=root.getAttribute('data-updated')||'',repo=(root.getAttribute('data-repo')||'').replace(/^https:\/\/github\.com\//,'');
  var L=[];
  L.push('Update the explainer '+src+(repo?' in the GitHub repository '+repo:'')+'.');
  L.push('Page: '+pageUrl()+(upd?' (version of '+upd+')':''));
  L.push('Load the skill `explainer` and follow "Comments from the reader". It says how to answer a question, how to check a correction, and what the pull request must list.');
  L.push('');
  L.push('The reader left '+list.length+' comment'+(list.length===1?'':'s')+'.');
  sorted(list).forEach(function(c,i){
    L.push('');
    L.push('## Comment '+(i+1));
    L.push('Section: '+(c.sec?(c.sec==='top'?'page header':c.sec.replace(/^s/,'')+' "'+c.head+'"'):'whole page'));
    if(c.quote)L.push('Quoted text'+(c.lang&&c.lang!=='en'?' ('+c.lang+')':'')+': "'+shorten(c.quote,500)+'"');
    if(c.quote&&!c.range&&(c.lang||'en')===Learn.lang())L.push('Note: this quote was not found in the page as the reader saw it last.');
    L.push('Comment:');
    c.text.split('\n').forEach(function(line){L.push('> '+line);});
  });
  return L.join('\n');
}
function copy(text,done){
  function fallback(){
    var ta=el('textarea','cm-ui',document.body);ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.top='-1000px';
    ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}
    ta.remove();done(ok);
  }
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){done(true);},fallback);
  else fallback();
}
function openIssue(){
  var repo=root.getAttribute('data-repo');if(!repo||!list.length)return;
  var slug=location.pathname.replace(/^\/|\/$/g,'').split('/').pop()||'page';
  var title='Comments on '+slug,body=prompt();
  var url=repo+'/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body);
  if(url.length>7500){
    copy(body,function(){msg(t('long'));});
    url=repo+'/issues/new?title='+encodeURIComponent(title);
  }
  window.open(url,'_blank','noopener');
}

/* ---------- start and stop ---------- */
function teardown(){
  alive=false;
  [].forEach.call(document.querySelectorAll('link[href*="comments.css"]'),function(e){e.remove();});
  [].forEach.call(document.querySelectorAll('.cm-ui'),function(e){e.remove();});
  if(HL){CSS.highlights.delete('learn-comment');CSS.highlights.delete('learn-comment-now');}
  root.classList.remove('cm-on');
  window.LearnComments=null;
  var s=document.getElementById('learn-comments-js');if(s)s.remove();
}
root.classList.add('cm-on');
addPartButtons();
/* Language change or new width: the text can move or change, so find each comment again. */
Learn.onChange(function(){if(!alive)return;relocate();render();});
window.LearnComments={open:open,prompt:prompt,list:function(){return list;}};
msg('');relocate();render();
if(window.LEARN_COMMENTS_OPEN)open();
})();
