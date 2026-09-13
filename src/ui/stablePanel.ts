type ScrollEntry={selector:string;index:number;top:number;left:number};
/** Preserve the page and every nested scroll container across a DOM replacement. */
export function preserveScroll<T>(mutate:()=>T):T{
  const x=window.scrollX,y=window.scrollY,root=document.body;
  const entries:ScrollEntry[]=[];
  for(const el of root.querySelectorAll<HTMLElement>('*')){
    if(!el.scrollTop&&!el.scrollLeft)continue;
    const selector=el.id?`#${CSS.escape(el.id)}`:[el.tagName.toLowerCase(),...Array.from(el.classList).filter(v=>!['selected','active','open','saved','empty'].includes(v)).map(v=>`.${CSS.escape(v)}`)].join('');
    if(!selector)continue;const matches=[...root.querySelectorAll(selector)];entries.push({selector,index:matches.indexOf(el),top:el.scrollTop,left:el.scrollLeft});
  }
  const restore=()=>{
    window.scrollTo({left:x,top:y,behavior:'instant'});
    for(const p of entries){const el=document.body.querySelectorAll<HTMLElement>(p.selector)[p.index];if(el){el.scrollTop=p.top;el.scrollLeft=p.left;}}
  };
  const result=mutate();restore();requestAnimationFrame(()=>{restore();requestAnimationFrame(restore);});return result;
}
// HUD data changes must not reset nested lists, open details or reading position.
export function updatePanel(host: HTMLElement, html: string) {
  if (host.dataset.panelHtml === html) return;
  const nodes = [host, ...host.querySelectorAll<HTMLElement>('*')];
  const positions = nodes.filter(el => el.scrollTop || el.scrollLeft).map(el => ({
    el, index: nodes.indexOf(el), top: el.scrollTop, left: el.scrollLeft,
  }));
  const details = [...host.querySelectorAll('details')].map(el => el.open);
  const active=document.activeElement instanceof HTMLElement&&host.contains(document.activeElement)?document.activeElement:undefined;
  const focus=active?.dataset.action?{action:active.dataset.action,id:active.dataset.id}:undefined;
  const ancestors: {el: HTMLElement; top: number; left: number}[] = [];
  for (let el = host.parentElement; el; el = el.parentElement)
    ancestors.push({el, top: el.scrollTop, left: el.scrollLeft});
  host.innerHTML = html;
  host.dataset.panelHtml = html;
  host.querySelectorAll('details').forEach((el, i) => { if (details[i] !== undefined) el.open = details[i]; });
  if(focus)[...host.querySelectorAll<HTMLElement>('[data-action]')].find(el=>el.dataset.action===focus.action&&el.dataset.id===focus.id)?.focus({preventScroll:true});
  const replacements = [host, ...host.querySelectorAll<HTMLElement>('*')];
  for (const p of positions) {
    const el = replacements[p.index];
    if (el) { el.scrollTop = p.top; el.scrollLeft = p.left; }
  }
  for (const p of ancestors) { p.el.scrollTop = p.top; p.el.scrollLeft = p.left; }
}

export function replacePanel(host:Element,html:string){
  preserveScroll(()=>{const template=document.createElement('template');template.innerHTML=html.trim();host.replaceWith(template.content.firstElementChild!);});
}
