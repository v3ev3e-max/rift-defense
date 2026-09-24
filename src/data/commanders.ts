export const commanders=[
  {id:'commander-01',name:'한서윤',gender:'female'},
  {id:'commander-02',name:'아마라 콜',gender:'female'},
  {id:'commander-03',name:'쿠로사와 린',gender:'female'},
  {id:'commander-04',name:'아니카 라오',gender:'female'},
  {id:'commander-05',name:'에바 슈타인',gender:'female'},
  {id:'commander-06',name:'린 민쩌우',gender:'female'},
  {id:'commander-07',name:'라일라 하디드',gender:'female'},
  {id:'commander-08',name:'카밀라 로하스',gender:'female'},
  {id:'commander-09',name:'강도윤',gender:'male'},
  {id:'commander-10',name:'마커스 리드',gender:'male'},
] as const;

export const defaultCommanderId=commanders[0].id;
export const commanderById=Object.fromEntries(commanders.map(v=>[v.id,v])) as Record<string,(typeof commanders)[number]>;
export const commanderPortrait=(id:string)=>`/assets/commanders/${commanderById[id]?.id??defaultCommanderId}.png`;
