// Synthetic geometry cases, not claims about a real application or process.
export function collisionCase(name='dense') {
 const nodes=[],edges=[];
 const node=(id,kind='operation',label=id,extra={})=>{nodes.push({id:'node_'+id,kind,label,sourceIds:['src_layout'],...extra});return 'node_'+id;};
 const edge=(from,to,kind='next',label)=>edges.push({id:'edge_layout_'+edges.length,from:'node_'+from,to:'node_'+to,kind,mode:kind==='receive'?'async':'sync',sourceIds:['src_layout'],...(label?{label}:{})});
 if(name==='parallel') {node('start','decision','Validation outcome?');node('work');node('end','terminal');for(const label of ['accepted','deferred','rejected'])edge('start','work','branch',label);edge('work','end','return');edge('work','end','exception');}
 else if(name==='long-span') {node('start');for(let i=0;i<7;i++)node('step'+i,i===4?'decision':'operation','A long Unicode step 民지 상태 '.repeat(4));node('end','terminal');edge('start','step0');for(let i=0;i<6;i++)edge('step'+i,'step'+(i+1),i===4?'branch':'next',i===4?'continue':undefined);edge('step6','end');edge('start','end','call','A long-span relationship label that occupied the outer node column');edge('step6','start','call','Repeated execution with an explicitly documented return path');edge('step3','step3','call','Revisit this step');}
 else {node('start','decision','Choose one documented outcome 民지');for(let i=0;i<12;i++)node('lane'+String(i).padStart(2,'0'),i%4===0?'external':i%4===1?'decision':'operation',`Branch ${i} with a long human-readable title 民지 `.repeat(2),i%4===0?{external:{kind:i===0?'library':'other'}}:{});node('merge','operation','Merge normal paths',{expandFlowId:'flow_detail'});node('error','terminal','A bounded exception outcome');node('end','terminal','Normal completion');for(let i=0;i<12;i++){const id='lane'+String(i).padStart(2,'0');edge('start',id,'branch',`Outcome ${i} after evidence-backed verification`);edge(id,'merge',i%4===1?'branch':'next',i%4===1?'continue':undefined);edge(id,'error','exception',`Failure reported at step ${i}`);}edge('merge','end','return');edge('start','end','call','Direct externally described completion');edge('merge','start','call','Revisit the start when explicitly recorded');}
 const detail={id:'flow_detail',label:'Documented detail',startNodeId:'node_detail',nodes:[{id:'node_detail',kind:'operation',label:'Read the supported detail',sourceIds:['src_layout']}],edges:[]};
 const flows=[{id:'flow_layout',label:`Synthetic ${name} layout`,startNodeId:nodes[0].id,nodes,edges},...(nodes.some(n=>n.expandFlowId)?[detail]:[])];
 for(const f of flows){f.docs=[{path:f.id+'.md',anchor:f.id}];for(const n of f.nodes)n.docs=[{path:f.id+'.md',anchor:n.id}];}
 return {modelVersion:'1.0.0',entryPoints:[{id:'entry_layout',label:'Synthetic start',flowId:flows[0].id,sourceIds:['src_layout'],trigger:'Explicit synthetic geometry fixture'}],sources:[{id:'src_layout',path:'evidence.txt',startLine:1,endLine:1}],flows};
}
export function documentsFor(graph) {
 return Object.fromEntries([['index.md','# Synthetic layout cases\n\nThese are geometry fixtures, not analyzed process claims.\n\n'+graph.flows.map(f=>`- [${f.label}](${f.id}.md#${f.id})`).join('\n')+'\n'],...graph.flows.map(f=>[f.id+'.md',`# ${f.label}\n\n<a id="${f.id}"></a>\n## ${f.label}\n\nSynthetic layout evidence: [src_layout].\n\n`+f.nodes.map(n=>`<a id="${n.id}"></a>\n### ${n.label}\n\nRecorded synthetic step. Evidence: [src_layout].\n`).join('\n')+'\n## Evidence\n\n[src_layout]: ../../evidence.txt#L1\n'])]);
}
export const overlap=(a,b,pad=0)=>a.x<b.x+b.width+pad&&a.x+a.width+pad>b.x&&a.y<b.y+b.height+pad&&a.y+a.height+pad>b.y;
export const labelBox=r=>({x:r.labelX-r.labelWidth/2,y:r.labelY-10,width:r.labelWidth,height:20});
export function geometryIssues(layout) {
 const labels=layout.edges.map(r=>({id:r.edge.id,...labelBox(r)})),issues=[];
 for(let i=0;i<labels.length;i++){
  for(const n of layout.nodes)if(overlap(labels[i],n))issues.push(['label-node',labels[i].id,n.id]);
  for(let j=i+1;j<labels.length;j++)if(overlap(labels[i],labels[j]))issues.push(['label-label',labels[i].id,labels[j].id]);
 }
 for(const r of layout.edges)for(let i=1;i<r.points.length;i++){
  const [a,b]=[r.points[i-1],r.points[i]];for(const n of labels.filter(n=>n.id!==r.edge.id))if(a[0]===b[0]?a[0]>n.x&&a[0]<n.x+n.width&&Math.max(a[1],b[1])>n.y&&Math.min(a[1],b[1])<n.y+n.height:a[1]>n.y&&a[1]<n.y+n.height&&Math.max(a[0],b[0])>n.x&&Math.min(a[0],b[0])<n.x+n.width)issues.push(['edge-label',r.edge.id,n.id]);for(const n of layout.nodes.filter(n=>n.id!==r.edge.from&&n.id!==r.edge.to))if(a[0]===b[0]?a[0]>n.x&&a[0]<n.x+n.width&&Math.max(a[1],b[1])>n.y&&Math.min(a[1],b[1])<n.y+n.height:a[1]>n.y&&a[1]<n.y+n.height&&Math.max(a[0],b[0])>n.x&&Math.min(a[0],b[0])<n.x+n.width)issues.push(['edge-node',r.edge.id,n.id]);
 }
 return issues;
}
