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
