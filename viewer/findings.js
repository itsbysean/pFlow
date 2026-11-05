/* Optional read-only findings. All displayed strings remain untrusted plain text. */
globalThis.pFlow=globalThis.pFlow||{};
globalThis.pFlow.createFindingsPanel=function createFindingsPanel({onOpen}) {
  const byId=id=>document.getElementById(id),report=byId('findings-report');let sample,flow,selection,rows=[];
  const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;};
  const allRows=()=>globalThis.pFlowContent?.[sample?.key]?.findings||[];
  const matches=(finding,chosen)=>finding.targets.some(t=>t.flowId===chosen.ownerFlow.id&&(chosen.type==='node'?t.nodeId===chosen.entity.id:t.edgeId===chosen.entity.id));
  function render(all=false) {
    const available=allRows(),active=available.filter(f=>f.active);
    byId('open-findings').hidden=!available.length;byId('open-findings').textContent=`Issue report (${available.length})`;
    byId('open-findings').title=`${active.length} current potential issues; ${available.filter(f=>f.state==='stale').length} need revalidation. Read-only report.`;
    rows=all?available:selection?available.filter(f=>matches(f,selection)):available.filter(f=>f.targets.some(t=>t.flowId===flow?.id));
    report.replaceChildren();report.hidden=!rows.length;byId('findings-disclosure').hidden=!rows.length;if(!rows.length)return;
    report.append(text('h3',all?'Potential issues — all findings':'Potential issues'),text('p','AI-reported possibilities, not proven failures. Review the conditions and code evidence.','panel-note'));
    for(const finding of rows) {
      const item=document.createElement('article');item.className='finding-item';item.dataset.findingId=finding.id;
      item.append(text('h4',finding.title),text('p',`${finding.severity} severity · ${finding.confidence} confidence · ${finding.status}${finding.state==='stale'?' · Needs revalidation':''}`,'finding-metadata'),text('p',finding.description));
      if(finding.state==='stale')item.append(text('p',finding.reasons.join(' '),'finding-stale'));
      const actions=document.createElement('div');actions.className='section-actions';
      if(finding.state==='current')for(const target of finding.targets) {
        const owner=sample.architecture.flows.find(f=>f.id===target.flowId),entity=target.nodeId?owner?.nodes.find(n=>n.id===target.nodeId):target.edgeId?owner?.edges.find(e=>e.id===target.edgeId):owner;
        if(!entity)continue;
        const button=text('button',`Locate: ${entity.label||entity.kind}`);button.type='button';button.addEventListener('click',()=>onOpen(target));actions.append(button);
      }
      if(actions.children.length)item.append(actions);
      const evidence=document.createElement('details');evidence.append(text('summary','Code evidence'));
      for(const entry of finding.evidence) {
        const source=entry.source;evidence.append(text('p',`${source.path}:${source.startLine}–${source.endLine}${source.symbol?' · '+source.symbol:''}`,'finding-location'));
        const snippet=finding.snippets.find(s=>s.source.id===source.id);
        if(snippet) {const list=document.createElement('ol');list.className='source-snippet';list.start=source.startLine;for(const line of snippet.lines){const li=document.createElement('li');li.value=line.number;li.append(text('code',line.text));list.append(li);}evidence.append(list);}
        else evidence.append(text('p','No current verified excerpt available.'));
      }
      item.append(evidence);
      const reviews=document.createElement('details');reviews.append(text('summary','Review history'));
      for(const review of finding.reviews)reviews.append(text('p',`${review.status}: ${review.rationale}`));item.append(reviews);report.append(item);
    }
  }
  function showAll() {render(true);report.hidden=false;byId('findings-disclosure').open=true;report.tabIndex=-1;report.focus({preventScroll:true});report.scrollIntoView({block:'nearest'});}
  return {setContext(nextSample,nextFlow,nextSelection){sample=nextSample;flow=nextFlow;selection=nextSelection;render();},active(){return allRows().filter(f=>f.active);},showAll,reveal(){byId('findings-disclosure').open=true;report.scrollIntoView({block:'nearest'});}};
};
