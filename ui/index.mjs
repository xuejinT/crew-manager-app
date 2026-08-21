import{useCallback as te,useEffect as ce,useId as br,useMemo as se,useRef as ue,useState as E}from"react";import{AlertTriangle as Qo,
ArrowRight as xr,Bot as yr,Check as kr,ChevronRight as ge,Check as Xo,Clock as _r,Package as Sr,ExternalLink as Nr,MessageSquare as Rr,
RefreshCw as Cr,Shield as Ar,Waves as en,Search as Ir,Tag as Wr,Users as Dt,Zap as Tr}from"lucide-react";import{useCallback as re,useEffect as Sn,useRef as to,useState as ye}from"react";import{Badge as Nn,Btn as V,Input as Ne}from"@kirocrew/app-sdk/ui";
import{Fragment as no,jsx as y,jsxs as I}from"react/jsx-runtime";var Y="/api/apps/crew-manager/conductor",Rn=5e3;function Cn(e){
return e?e.startsWith("cm-")?e.slice(e.lastIndexOf("-")+1):e:""}function An(e){if(!e)return"";try{return new Date(e*1e3).
toLocaleTimeString()}catch{return""}}function oo(e){let t=e.leaves;if(t&&typeof t=="object"&&!Array.isArray(t)){let n=t;
if(typeof n.total=="number")return`${n.closed??0}/${n.total} leaves`}return""}var In={id:"",title:"",task:"",produces:"",
after:""},Wn=new Set(["done","abandoned"]),Tn=new Set(["draft","ready","holding","blocked"]),$n={session_create:"act",session_continue:"\
act",session_resume:"act",context_inject:"act",escalate:"act",operator_notify:"act",narrate:"act",loop_arm:"propose",cron_create:"\
propose",pr_comment:"propose"},En={wip:3,turns:200,wall_clock_secs:21600,actions:{session_create:12,session_continue:60,
context_inject:120,escalate:20,operator_notify:20}};function xt({api:e,view:t="goals"}){let[n,s]=ye(null),[a,u]=ye([]),[
l,p]=ye(""),[S,x]=ye(""),[_,i]=ye({title:"",statement:"",root:"",trust:"trust",steps:[]}),[g,h]=ye(!1),[A,C]=ye(""),[G,f]=ye(
""),b=to(!0),P=to(e);P.current=e;let $=re(async()=>{try{let[d,v]=await Promise.all([P.current.get(`${Y}/state`),P.current.
get(`${Y}/ledger?limit=40`)]);if(!b.current)return;s(d??null),u(Array.isArray(v?.rows)?v.rows:[])}catch(d){b.current&&x(
d instanceof Error?d.message:"could not read the conductor")}},[]);Sn(()=>{b.current=!0,$();let d=window.setInterval(()=>{
$()},Rn);return()=>{b.current=!1,window.clearInterval(d)}},[$]);let L=re(async(d,v,R)=>{p(d),x("");try{await P.current.post(
v,R??{}),x(`${d} ok`)}catch(W){x(W instanceof Error?`${d} failed: ${W.message}`:`${d} failed`)}finally{b.current&&p(""),
$()}},[$]),J=re((d,v)=>{i(R=>({...R,[d]:v}))},[]),M=re((d,v,R)=>{i(W=>({...W,steps:W.steps.map((ie,z)=>z===d?{...ie,[v]:R}:
ie)}))},[]),K=re(()=>{i(d=>({...d,steps:[...d.steps,{...In}]}))},[]),F=re(d=>{i(v=>({...v,steps:v.steps.filter((R,W)=>W!==
d)}))},[]),Q=re(()=>{let d=_.title.trim(),v=_.root.trim();if(!d){x("give the goal a name");return}if(!v.startsWith("/")){
x('the working directory must be an absolute path \u2014 it is where "did this step finish" is checked');return}let R=_.
steps.filter(z=>z.id.trim()||z.task.trim()),W=new Set;for(let z of R){let X=z.id.trim();if(!X){x("every step needs a sho\
rt id");return}if(!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(X)){x(`step id ${X} may only use letters, digits, dot, dash, und\
erscore or colon`);return}if(W.has(X)){x(`two steps share the id ${X}`);return}if(W.add(X),!z.task.trim()){x(`step ${X} \
has no instruction \u2014 that worker would sit idle`);return}}return{...A?{id:A}:{},title:d,statement:_.statement.trim()||
d,scope:{root:v,worker_trust:_.trust==="normal"?"":_.trust,paths_allow:["**"],paths_deny:[".git/**",".github/**"]},authority:$n,
budgets:En,done_when:[{kind:"all_leaves_closed"}],leaves:R.map(z=>{let X=z.produces.trim();return{id:z.id.trim(),title:z.
title.trim()||z.id.trim(),intent_text:z.task.trim(),depends_on:z.after.split(",").map(le=>le.trim()).filter(Boolean),done_when:X?
[{kind:"file_exists",path:X}]:[],predicted_paths:X?[X]:[],status:"open"}})}},[_]),ee=re(async d=>{let v=Q();if(!v)return"";
p(d),x("");try{let W=(await P.current.post(`${Y}/goals`,v))?.goal?.id??v.id??"";return x(W?`${d} ok`:`${d} ok (no id ret\
urned)`),W}catch(R){return x(R instanceof Error?`${d} failed: ${R.message}`:`${d} failed`),""}finally{b.current&&p("")}},
[Q]),B=re(async()=>{if(!await ee(A?"save":"declare")){$();return}b.current&&(i({title:"",statement:"",root:"",trust:"tru\
st",steps:[]}),h(!1),C("")),$()},[ee,A,$]),we=re(async()=>{let d=n?.goals??[],v=d.filter(W=>W.status==="ready"||W.status===
"draft"&&(W.leaf_rows?.length??0)>0),R=d.filter(W=>W.status==="draft"&&(W.leaf_rows?.length??0)===0);p("start"),x("");try{
for(let z of v)z.id&&(x(`activating ${z.title||z.id}\u2026`),await P.current.post(`${Y}/goals`,{id:z.id,status:"active"}));
x("arming\u2026"),await P.current.post(`${Y}/start`,{mode:"autonomous"});let W=v.length+d.filter(z=>z.status==="active").
length,ie=R.length>0?` \u2014 ${R.length} goal(s) have no steps yet and were left alone`:"";x(W>0?`running ${W} goal(s)${ie}`:
`armed, but nothing is active yet${ie}`)}catch(W){x(W instanceof Error?`start failed: ${W.message}`:"start failed")}finally{
b.current&&p(""),$()}},[n,$]),$e=re(async()=>{let d=await ee(A?"save":"declare");if(!d){$();return}b.current&&(i({title:"",
statement:"",root:"",trust:"trust",steps:[]}),h(!1),C("")),p("decompose"),x("saved \u2014 planning steps, this can take a few\
 minutes\u2026");try{await P.current.post(`${Y}/goals/decompose`,{id:d}),x("steps planned")}catch(v){x(v instanceof Error?
`planning failed: ${v.message}`:"planning failed")}finally{b.current&&p(""),$()}},[ee,A,$]),me=re(async d=>{let v=d.id??
"";if(!v)return;let R=d.leaves&&typeof d.leaves=="object"&&!Array.isArray(d.leaves)?d.leaves.total??0:0;p("start"),x("");
try{R===0&&(x("planning steps\u2026"),await P.current.post(`${Y}/goals/decompose`,{id:v})),d.status==="draft"&&(x("activ\
ating\u2026"),await P.current.post(`${Y}/goals`,{id:v,status:"active"})),x("starting\u2026"),await P.current.post(`${Y}/\
start`,{mode:"autonomous",goal_ids:[v]}),x("running")}catch(W){x(W instanceof Error?`start failed: ${W.message}`:"start \
failed")}finally{b.current&&p(""),$()}},[$]),ke=re(d=>{let v=Array.isArray(d.leaf_rows)?d.leaf_rows:[];i({title:d.title??
"",statement:d.statement??"",root:d.scope?.root??"",trust:d.scope?.worker_trust||"normal",steps:v.map(R=>({id:R.id??"",title:R.
title??"",task:R.intent_text??"",produces:R.produces??"",after:(R.depends_on??[]).join(", ")}))}),C(d.id??""),h(!0),x("")},
[]),j=n?.goals??[],_e=j.filter(d=>d.status==="active"),ne=j.filter(d=>d.status==="active"||d.status==="ready"||d.status===
"draft"&&(d.leaf_rows?.length??0)>0),k=!!n?.running,H=n?.mode??"advisory";return I("div",{className:"ow-stack-body ow-co\
nd",children:[I("div",{className:"ow-mini",style:{alignItems:"center"},children:[y("span",{className:"ow-mini-rail",style:{
background:k?"var(--ok)":"var(--muted)"}}),I("div",{children:[I("div",{className:"ow-mini-title",children:[k?"Running au\
tonomously":"Stopped",y("span",{className:"ow-mini-chip",children:H}),n?.holding&&y("span",{className:"ow-mini-chip",children:"\
holding"})]}),n?.blocking_reason?y("div",{className:"ow-mini-when",children:n.blocking_reason}):I("div",{className:"ow-m\
ini-when",children:[j.length," goal(s) declared"]})]}),y("span",{className:"ow-stack-actions",children:k?y(V,{disabled:l!==
"",onClick:()=>void L("stop",`${Y}/stop`,{verb:"drain"}),children:"Stop"}):y(V,{disabled:l!=="",title:ne.length>0?`start\
 ${ne.length} goal(s) and arm the loop`:"arm the loop \u2014 no goal is ready, so it will idle until one is",onClick:()=>void we(),
children:"Start"})})]}),I("div",{className:"ow-cond-setting",children:[y("span",{children:"Planner may think for"}),y(Ne,
{className:"ow-cond-secs",value:G!==""?G:String(n?.planner_timeout_secs??300),inputMode:"numeric",onChange:d=>f(d.target.
value.replace(/[^0-9]/g,""))}),y("span",{children:"seconds"}),y(V,{disabled:l!==""||G==="",onClick:()=>{L("settings",`${Y}\
/settings`,{planner_timeout_secs:Number(G)}),f("")},children:"Save"}),(n?.planner_timeout_bounds?.length??0)===2&&I("spa\
n",{className:"ow-cond-hint",children:[n?.planner_timeout_bounds?.[0],"\u2013",n?.planner_timeout_bounds?.[1],"s"]})]}),
S&&y("p",{className:"ow-stack-sub ow-cond-note",children:S}),t==="goals"&&I(no,{children:[j.length===0?y("p",{className:"\
ow-stack-empty",children:"No goals yet. Declare one below."}):j.map(d=>I("div",{className:"ow-mini",children:[y("span",{
className:"ow-mini-rail",style:{background:d.dispatchable?"var(--ok)":"var(--warn)"}}),I("div",{children:[I("div",{className:"\
ow-mini-title",children:[d.title||d.id,y("span",{className:"ow-mini-chip",children:d.status}),oo(d)&&y("span",{className:"\
ow-mini-chip",children:oo(d)})]}),d.why&&y("div",{className:"ow-mini-desc",title:d.why,children:d.why}),(d.leaf_rows?.length??
0)>0&&y("ol",{className:"ow-cond-plan",children:(d.leaf_rows??[]).map(v=>I("li",{"data-closed":v.status==="closed"?"true":
void 0,children:[y("code",{children:v.id})," ",v.title,v.status&&v.status!=="open"&&y("span",{className:"ow-mini-chip",children:v.
status}),v.produces&&I("span",{className:"ow-cond-plan-file",children:[" \u2192 ",v.produces]}),(v.depends_on?.length??0)>
0&&I("span",{className:"ow-cond-plan-after",children:[" after ",v.depends_on?.join(", ")]})]},v.id))}),(d.workers?.length??
0)>0&&I("div",{className:"ow-cond-workers",children:[I("span",{className:"ow-cond-workers-head",children:[d.workers?.length,
" worker session(s)"]}),(d.workers??[]).map(v=>I("div",{className:"ow-cond-worker",children:[y("span",{className:"ow-tru\
ncate",children:v.title||v.slot}),v.running&&y("span",{className:"ow-mini-chip",children:"running"}),I("span",{className:"\
ow-cond-worker-rows",children:[v.messages??0," rows"]}),y(V,{disabled:l!=="",title:"retire this worker session (its tran\
script is archived)",onClick:()=>{window.confirm(`Remove worker session \u201C${v.title||v.slot}\u201D?`+(v.running?`

It is mid-turn and will be stopped.`:"")+`

The transcript is archived, not deleted.`)&&L("remove session",`${Y}/sessions/remove`,{slot:v.slot,force:!!v.running})},
children:"Remove"})]},v.slot))]}),y("div",{className:"ow-mini-when",children:d.id})]}),I("span",{className:"ow-stack-act\
ions",children:[(d.status==="draft"||d.status==="ready")&&y(V,{disabled:l!=="",title:d.status==="ready"?"plan it again \u2014\
 nothing has started, so re-planning is safe":"ask the planner to break this goal into steps",onClick:()=>void L("decomp\
ose",`${Y}/goals/decompose`,{id:d.id}),children:l==="decompose"?"Planning\u2026":d.status==="ready"?"Re-plan steps":"Dec\
ompose to steps"}),!Wn.has(d.status??"")&&y(V,{disabled:l!=="",title:d.status==="draft"?"edit this draft":"edit the obje\
ctive, scope and steps of this running goal",onClick:()=>ke(d),children:"Edit"}),(d.status==="draft"||d.status==="ready")&&
y(V,{disabled:l!=="",title:"mark it active without arming the loop",onClick:()=>void L("activate",`${Y}/goals`,{id:d.id,
status:"active"}),children:"Activate"}),Tn.has(d.status??"")&&y(V,{disabled:l!=="",title:"plan if needed, activate, and \
start running",onClick:()=>void me(d),children:l==="start"?"\u2026":d.status==="draft"||d.status==="ready"?"Start":"Resu\
me"}),d.status==="awaiting_confirmation"&&y(V,{disabled:l!=="",title:"every step is finished \u2014 confirm the objective is \
met",onClick:()=>void L("confirm",`${Y}/goals`,{id:d.id,status:"done"}),children:l==="confirm"?"\u2026":"Mark done"}),y(
V,{disabled:l!=="",title:"remove this goal and its worker sessions",onClick:()=>{let v=d.workers??[],R=v.filter(ie=>ie.running).
length,W=[`Remove \u201C${d.title||d.id}\u201D?`];v.length>0&&(W.push("",`This also removes ${v.length} worker session(s\
).`),R>0&&W.push(`${R} of them ${R===1?"is":"are"} mid-turn and will be stopped.`),W.push("Transcripts are archived, not\
 deleted.")),window.confirm(W.join(`
`))&&L("remove",`${Y}/goals/remove`,{id:d.id,force:R>0})},children:"Remove"})]})]},d.id??Math.random())),I("div",{className:"\
ow-mini",children:[y("span",{className:"ow-mini-rail",style:{background:"var(--muted)"}}),I("div",{style:{width:"100%"},
children:[I("div",{className:"ow-mini-title",children:[A?"Edit goal":"Declare a goal",A&&y("span",{className:"ow-mini-ch\
ip",children:A})]}),g?I("div",{className:"ow-cond-form",children:[I("label",{className:"ow-cond-field",children:[y("span",
{children:"Goal"}),y(Ne,{value:_.title,placeholder:"Chess engine",onChange:d=>J("title",d.target.value)})]}),I("label",{
className:"ow-cond-field",children:[y("span",{children:"What done looks like"}),y("textarea",{className:"ow-cond-text",rows:3,
value:_.statement,placeholder:"Build a chess engine in pure Python with no dependencies. Every module carries its own ru\
nnable tests.",onChange:d=>J("statement",d.target.value)})]}),I("label",{className:"ow-cond-field",children:[y("span",{children:"\
Working directory"}),y(Ne,{value:_.root,placeholder:"/path/to/your/project",onChange:d=>J("root",d.target.value)})]}),I(
"label",{className:"ow-cond-field",children:[y("span",{children:"Worker permissions"}),I("select",{className:"ow-cond-se\
lect",value:_.trust,onChange:d=>J("trust",d.target.value),children:[y("option",{value:"trust",children:"Full \u2014 workers m\
ay read, write and run (unattended)"}),y("option",{value:"trust_reads",children:"Reads only \u2014 writes still ask you"}),
y("option",{value:"normal",children:"Ask me for everything (will stall unattended)"})]})]}),I("div",{className:"ow-cond-\
steps-head",children:[y("span",{children:"Steps \u2014 write them yourself, or have the planner propose them"}),I("span",
{className:"ow-cond-step-actions",children:[y(V,{onClick:K,children:"+ Add step"}),y(V,{disabled:l!=="",title:"save this\
 goal, then have the planner break it into steps",onClick:()=>void $e(),children:l==="decompose"?"Planning\u2026":"Decom\
pose to steps"})]})]}),_.steps.length===0&&y("p",{className:"ow-cond-hint",children:"No steps yet. Add them by hand, or \
press \u201CDecompose to steps\u201D \u2014 that saves the goal and asks the planner to propose them (it can take a few minutes; progre\
ss appears in the Conductor chat)."}),_.steps.map((d,v)=>I("div",{className:"ow-cond-step",children:[I("div",{className:"\
ow-cond-step-row",children:[y(Ne,{value:d.id,placeholder:"id (e.g. board)",onChange:R=>M(v,"id",R.target.value)}),y(Ne,{
value:d.title,placeholder:"what this step is",onChange:R=>M(v,"title",R.target.value)}),y(V,{title:"remove this step",onClick:()=>F(
v),children:"\xD7"})]}),y("textarea",{className:"ow-cond-text",rows:3,value:d.task,placeholder:"The explicit instruction\
 delivered to this worker. Say what to build, which files it owns, and what done means.",onChange:R=>M(v,"task",R.target.
value)}),I("div",{className:"ow-cond-step-row",children:[y(Ne,{value:d.produces,placeholder:"file it must produce (src/b\
oard.py)",onChange:R=>M(v,"produces",R.target.value)}),y(Ne,{value:d.after,placeholder:"runs after (comma-separated ids)",
onChange:R=>M(v,"after",R.target.value)})]})]},v)),I("div",{className:"ow-stack-actions",children:[y(V,{disabled:l!=="",
onClick:()=>void B(),children:A?"Save":"Declare"}),y(V,{disabled:l!=="",onClick:()=>{h(!1),C(""),x("")},children:"Cancel"})]})]}):
y(V,{onClick:()=>{C(""),h(!0)},children:"New goal\u2026"})]})]})]}),t==="events"&&I(no,{children:[I("div",{className:"ow\
-cond-events-head",children:[y("span",{className:"ow-stack-sub",children:"Events \u2014 newest last"}),I("span",{className:"\
ow-cond-step-actions",children:[y(V,{disabled:l!=="",title:"empty the Conductor chat and the agent's memory of it (the t\
ranscript is archived, not deleted)",onClick:()=>{window.confirm(`Clear the Conductor chat?

This removes the visible messages AND the agent's memory of them, so it starts fresh. The transcript is archived rather \
than deleted.`)&&L("clear chat",`${Y}/chat/clear`)},children:l==="clear chat"?"Clearing\u2026":"Clear chat"}),y(V,{disabled:l!==
"",title:"start a fresh event list; the current rows are kept in the previous ledger generation",onClick:async()=>{if(window.
confirm(`Clear the event list?

The rows are rolled into the previous ledger generation, not deleted, so the audit trail survives.`)){p("clear events"),
x("");try{await P.current.post(`${Y}/events/clear`,{}),x("events cleared")}catch(d){let v=d instanceof Error?d.message:String(
d);if(/outcome|409/i.test(v)&&window.confirm(`Some actions have no recorded outcome yet.

Clearing now discards what the recovery pass uses to close them. Clear anyway?`))try{await P.current.post(`${Y}/events/c\
lear`,{force:!0}),x("events cleared (forced)")}catch(R){x(R instanceof Error?`clear events failed: ${R.message}`:"clear \
events failed")}else x(`clear events failed: ${v}`)}finally{b.current&&p(""),$()}}},children:l==="clear events"?"Clearin\
g\u2026":"Clear events"})]})]}),a.length===0?y("p",{className:"ow-stack-empty",children:"Nothing yet. Events appear here\
 as the driver acts."}):y("div",{className:"ow-cond-events",children:a.filter(d=>d.event_type==="outcome"||d.verdict==="\
escalate"||d.verdict==="refuse").slice(-24).map((d,v)=>{let R=d.outcome==="success";return I("div",{className:"ow-cond-e\
vent",children:[y("span",{className:"ow-cond-when",children:An(d.ts)}),y(Nn,{variant:R?"ok":"warn",children:d.action_class??
"?"}),y("span",{className:"ow-cond-target",children:Cn(String(d.resource??""))}),y("span",{className:"ow-cond-why",title:d.
detail||d.reason||"",children:d.detail||d.reason||""})]},`${d.ts??v}-${v}`)})})]})]})}import{useAppApi as $r,useNavigate as Er,useNavBadge as Pr,ChatEmbed as Br}from"@kirocrew/app-sdk";import{Badge as ve,Btn as ae,
ContentSkeleton as Fo,EmptyState as jo,PageHeader as Mr}from"@kirocrew/app-sdk/ui";function Re(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),s=t%
60;return s===0?`${n} hour${n===1?"":"s"}`:`${n}h ${s}m`}function Pn(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function vo(e,t,n){let s=new Set(t.filter(Boolean));if(s.size===0)return[];let a=new Set,
u=[];for(let l of e){let p=l.slot;!p||!s.has(p)||!l.id||a.has(l.id)||(a.add(l.id),u.push({id:l.id,sessionKey:p,sessionLabel:n(
p),tool:l.tool||"a tool",purpose:l.tool_purpose}))}return u}var ro=5,so={"needs-you":0,running:1,done:2};function Z(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function Bn(e,t){if(e.paused)
return"";let n=Z(e.next_run_ts);if(!n)return"";let s=Math.round((n-t)/1e3);return s<=0?"":Re(s)}var ao=72;function ze(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let a=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(a.length<=ao)return a;let u=a.slice(0,ao),l=u.lastIndexOf(" ");return`${(l>24?u.slice(0,l):u).trim()}\u2026`}
function st(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var Mn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
zn=/^\((?:code|diff|widget|image)\)$/,Dn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
Ln=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,Kn=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
On=/[?？]["'”’)\]]*$/;function bo(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||zn.test(t)||Mn.test(
t)?null:t}function Nt(e){if(!e.waiting_for_input)return null;let t=bo(e);return!t||Dn.test(t)||Ln.test(t)?null:Kn.test(t)||
On.test(t)?t:null}function io(e){return e.pending_approval||Nt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":"done"}function qn(e,t){if(e.pending_approval)return t("approval_waiting");let n=Nt(e);return n||(e.running||e.
subagents_running||e.orchestrating?t("work_in_progress"):st(e)?t("linked_change_issue"):bo(e)??t("recent_work_ready"))}function xo(e,t){
let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop()||t("session")}function Fn(e){
return e.pending_approval?"review-approval":Nt(e)?"reply":"open"}function yo(e){return(e.source_links??[]).map(t=>({number:String(
t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.kind==="issue"?`issue #${t.number}`:`${t.provider===
"gitlab"?"MR":"PR"} #${t.number}`,url:t.url,sessionKey:e.key,status:Pn(t)}}))}function jn(e,t){let n=yo(e).map(s=>s.ref);
return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:qn(e,t),state:io(e),moving:io(e)==="running"||void 0,
issue:st(e),updatedAt:Z(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:xo(e,t),queuedBehind:e.queue_depth||
void 0,changeBlocked:st(e)||void 0,action:Fn(e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.
key},...n]}}function Rt(e,t){e.references.some(n=>n.kind===t.kind&&n.id===t.id)||e.references.push(t)}function ko(e){return(e.
source||"").toLowerCase()==="subagent"}function Gn(e,t,n){let s=ko(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,
Z(t.ts)),e.summary=n(s?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=s?"subagent":"tool",e.action="review-a\
pproval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=t.tool_purpose,e.permissionInput=t.tool_input,
Rt(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),sessionKey:t.slot||e.sessionKey})}function Hn(e,t,n){
e.updatedAt=Math.max(e.updatedAt,Z(t.started)),e.issue||=!!(t.done&&(t.error||t.outcome==="failed")),t.done?(t.error||t.
outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_failed",{task:t.task})):e.state!=="needs-you"&&(e.state=
"running",e.summary=n("work_in_progress")),Rt(e,{kind:"agent",id:t.id,label:t.agent||n("agent"),sessionKey:t.parent||e.sessionKey})}
var lo=160;function _o(e,t){let n=[],s=e.last_log?.trim(),a=e.phase?.trim();s&&n.push(t("workflow_fact_last_log",{log:s})),
a&&!(s&&s.toLowerCase().includes(a.toLowerCase()))&&n.push(t("workflow_fact_phase",{phase:a}));let u=e.error?.trim();u&&
n.push(t("workflow_fact_error",{error:So(u)}));let l=e.agent_error_count??0;l>0&&n.push(t("workflow_fact_agent_errors",{
count:String(l)}));let p=e.partial_result_count??0;return p>0&&n.push(t("workflow_fact_partials",{count:String(p)})),n}function So(e){
let t=/^([A-Za-z_][\w.]*)\((['"])([\s\S]*)\2,?\s*\)$/.exec(e.trim()),n=(t?t[3]:e).trim()||e.trim();return n.length>lo?`${n.
slice(0,lo-1)}\u2026`:n}function No(e,t){if(e.status!=="failed")return[];let n=e.error?.trim(),s=e.name||e.run_id;return[
{what:t("workflow_step_diagnose",{name:s}),why:n?t("workflow_step_why_error",{error:So(n)}):t("workflow_step_why_generic"),
expect:(e.partial_result_count??0)>0?t("workflow_step_expect_partials",{count:String(e.partial_result_count??0)}):t("wor\
kflow_step_expect_generic")}]}function Un(e,t,n){e.issue||=t.status==="failed",t.status==="running"&&e.state!=="needs-yo\
u"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow_failed",{name:t.name}));let s=_o(
t,n);s.length>0&&(e.progress=[...e.progress??[],...s.filter(u=>!(e.progress??[]).includes(u))]);let a=No(t,n);a.length>0&&
(e.nextSteps=[...e.nextSteps??[],...a.filter(u=>!(e.nextSteps??[]).some(l=>l.what===u.what))]),Rt(e,{kind:"workflow",id:t.
run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function Yn(e){switch(e.state){case"needs-you":return"\
needs-you";case"done":case"dropped":return"done";case"in-progress":return"running";default:return null}}function Vn(e,t,n){
return!(t.running||t.subagents_running||t.orchestrating)?!1:e===n}function Jn(e){let t=null,n=-1;for(let s of e){let a=s.
last_touched_turn??0;a>n&&(n=a,t=s)}return t}function Zn(e,t){let n=e.next_steps?.find(a=>a.what?.trim())?.what?.trim();if(n)return n;let s=[...e.progress??[]].reverse().
find(a=>a.trim());return s?s.trim():e.initial_intent?.trim()||t("work_in_progress")}var Qn=3;function Xn(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function er(e,t){if(!t)return!1;
let n=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${n}\\b`,"u").test(e)}function tr(e,t){if(e.length===
0)return[];let n=Xn(t);return e.filter(s=>er(n,s.number)).map(s=>s.ref)}function or(e,t,n){if(!t?.enabled)return[];let s=t.
intents??[];if(s.length===0)return[];let a=yo(e),u=[],l=Jn(s),p=!!(e.running||e.subagents_running||e.orchestrating);s.forEach(
(_,i)=>{let g=!p&&_.state==="in-progress",h=g?"needs-you":Yn(_);if(!h)return;let A=(_.next_steps??[]).filter(C=>C.what?.
trim());u.push({id:`intent:${e.key}:${i}`,title:ze(_.title,e.title||n("untitled_work")),summary:Zn(_,n),state:h,issue:!1,
updatedAt:Z(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:xo(e,n),queuedBehind:e.queue_depth||void 0,
changeBlocked:st(e)||void 0,unverified:_.verified===!1||void 0,unattendedGoals:g?1:void 0,action:g?"resume":"open",references:[
{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...tr(a,_)],nextSteps:A,initialIntent:_.initial_intent?.
trim()||void 0,progress:(_.progress??[]).filter(C=>C.trim()),stale:!!t.stale,lastTouchedTurn:_.last_touched_turn??0,sessionTurns:t.
user_turns||void 0,sessionChanges:a.map(C=>C.ref),moving:Vn(_,e,l)||void 0})});let S=u.filter(_=>_.state==="needs-you"),
x=u.filter(_=>_.state!=="needs-you").sort((_,i)=>(i.lastTouchedTurn??0)-(_.lastTouchedTurn??0));return[...S,...x].slice(
0,Math.max(Qn,S.length))}var nr=new Set(["crew-manager-conductor","overwatch-conductor"]),rr={approval_owed:100,subagent_gate:95,
input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,stalled:50,change_blocked:40,
merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},sr=3;function ar(e,t){return e.updatedAt?
Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var rt=5;function Ro(e,t,n=Date.now()){let s=It(e),a=Mo(e.filter(l=>l.state===
"needs-you"),n),u=[`Fleet: ${s["needs-you"]} waiting on the user, ${s.running} in progress, ${s.done} finished recently.`];
return a.length===0?(u.push("Nothing is waiting on the user."),u):(u.push(`Waiting on the user, in the order the list sh\
ows them (top ${Math.min(rt,a.length)}):`),a.slice(0,rt).forEach((l,p)=>{let S=At(Je(l,n),t),x=l.sessionKey?` [session ${l.
sessionKey}]`:"";u.push(`${p+1}. ${l.title} \u2014 ${l.summary} (${S})${x}`)}),a.length>rt&&u.push(`\u2026and ${a.length-
rt} more waiting.`),u)}var kt=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that",
"with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run","why",
"what","how","again","still","not"]),co=.6,uo=2,Co=new Set;function _t(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!kt.has(t)))]}function po(e,t){let n=_t(e),s=_t(t);if(n.length<uo||s.length<uo)return 0;
let a=n.length<=s.length?n:s,u=new Set(n.length<=s.length?s:n);return a.filter(p=>u.has(p)).length/a.length}function go(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function wo(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function mo(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}var ir=new Set(
["pull request","pull requests","status update","work in progress","code review","follow up","next step","next steps","a\
ction item","action items","kiro crew","in progress","needs you"]);function St(e){let t=new Set,n=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??
[];for(let s of n){let a=s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(u=>u.length>
3&&u.endsWith("s")&&!u.endsWith("ss")?u.slice(0,-1):u);for(;a.length&&kt.has(a[0]);)a.shift();for(;a.length&&kt.has(a[a.
length-1]);)a.pop();if(!(a.length<2))for(let u=a.length;u>=2;u-=1)for(let l=0;l+u<=a.length;l+=1){let p=a.slice(l,l+u).join(
" ");ir.has(p)||t.add(p)}}return[...t]}function lr(e){let t=new Set;if(e.length<dr)return t;let n=new Map;for(let s of e)
for(let a of St(s.title))n.set(a,(n.get(a)??0)+1);for(let[s,a]of n)a/e.length>=cr&&t.add(s);return t}var dr=4,cr=.75;function Ao(e,t,n=Co){
if(go(e).find(l=>go(t).includes(l)))return"same_change";if(wo(e).find(l=>wo(t).includes(l)))return"same_artifact";let u=St(
t.title).filter(l=>!n.has(l));if(St(e.title).some(l=>u.includes(l)))return"same_deliverable";if(po(e.title,t.title)>=co)
return"same_topic";for(let l of mo(e))for(let p of mo(t))if(po(l,p)>=co)return"same_step";return null}var Io={merged:[],
split:[]};function ho(e){return`${e.sessionKey??e.id}|${_t(e.title).join(" ")}`}function Wo(e,t){return[ho(e),ho(t)].sort().
join("")}function ur(e,t=Io){let n=e.filter(a=>a.state!=="done"&&a.sessionKey).sort((a,u)=>(a.updatedAt||0)-(u.updatedAt||
0)),s=lr(n);for(let a=1;a<n.length;a+=1){let u=n[a];for(let l=0;l<a;l+=1){let p=n[l];if(p.sessionKey===u.sessionKey||t.split.
includes(Wo(u,p)))continue;let S=Ao(u,p,s);if(S){u.duplicateOf={sessionKey:p.sessionKey,title:p.title,because:S};break}}}
pr(n,t,s)}var yt=3,fo=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function pr(e,t,n=Co){
for(let s of e){let a=[],u=new Set;for(let l of e){let p=l.sessionKey;if(p===s.sessionKey||u.has(p)||t.split.includes(Wo(
s,l)))continue;let S=Ao(s,l,n);S&&(u.add(p),a.push({sessionKey:p,title:l.title,because:S}))}a.length!==0&&(a.sort((l,p)=>fo.
indexOf(l.because)-fo.indexOf(p.because)),s.relatedSessions=a.slice(0,yt),a.length>yt&&(s.relatedMore=a.length-yt))}}var gr=3e4;
function To(e,t,n=Date.now()){return Object.keys(t).length===0?e:e.map(s=>{let a=t[s.id];return!a||n-a>gr||s.state==="ru\
nning"?s:{...s,state:"running",moving:!0,instructed:!0}})}function Je(e,t=Date.now()){let n=[],s=(u,l,p=1)=>{n.push({signal:u,
weight:rr[u]*p,values:l})};e.approvalKind==="subagent"?s("subagent_gate"):e.approvalKind==="tool"&&s("approval_owed"),e.
action==="reply"&&s("input_requested"),e.unverified&&s("unverified_completion"),e.loopRepeats&&s("error_loop",{repeats:String(
e.loopRepeats)}),e.changesRequested&&s("changes_requested"),e.runFailed&&s("run_failed"),e.stalledFor&&s("stalled",{duration:Re(
e.stalledFor)}),e.assignedToYou&&s("assigned_to_you"),e.changeBlocked&&s("change_blocked"),e.mergeReady&&s("merge_ready"),
e.unattendedGoals&&s("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&s("queued_behind",{count:String(e.
queuedBehind)},Math.min(e.queuedBehind,3));let a=ar(e,t);return a>0&&s("waiting_a_while",{hours:String(a)},Math.min(a,sr)),
n.sort((u,l)=>l.weight-u.weight),{score:n.reduce((u,l)=>u+l.weight,0),signals:n}}var wr={approval_owed:"unblock",subagent_gate:"\
unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"un\
block",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"unblock",assigned_to_you:"followup",nobody_on_it:"\
followup"};function $o(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let n of Je(e,t).signals){let s=wr[n.signal];
if(s)return s}return null}var Eo=14400*1e3;function Po(e,t,n,s=Date.now()){let a=0,u=[];for(let l of e){if(l.state!=="ne\
eds-you"){u.push(l);continue}let p=t[l.id];if(p&&p>s){a+=1;continue}let S=n[l.id];if(S!==void 0&&l.updatedAt<=S){u.push(
{...l,state:"done",issue:!1});continue}u.push(l)}return{items:u,snoozedCount:a}}var Ct=4320*60*1e3;function Bo(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=Ct}var mr={"needs-you":1,running:-1,done:-1};function hr(e,t,n){
let s=e.updatedAt>0,a=t.updatedAt>0;return!s&&!a?0:s?a?(e.updatedAt-t.updatedAt)*n:-1:1}function At(e,t){let n=e.signals.
slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(a=>t(`rank_${a.signal}`,a.values)).join(t("rank_join"))}
function Mo(e,t=Date.now()){let n=new Map(e.map(s=>[s.id,Je(s,t)]));return[...e].sort((s,a)=>{let u=so[s.state]-so[a.state];
if(u!==0)return u;if(s.state==="needs-you"){let l=(n.get(a.id)?.score??0)-(n.get(s.id)?.score??0);if(l!==0)return l}else if(s.
issue!==a.issue)return s.issue?-1:1;return hr(s,a,mr[s.state])})}function zo(e,t,n={},s={},a={},u=Io,l=Date.now()){let p=new Map,
S=new Map;for(let i of e.slots){if(!i.key||nr.has(i.key)||i.memory_mode==="incognito")continue;let g=or(i,n[i.key],t);if(g.
length>0){for(let C of g)p.set(C.id,C);let A=g.find(C=>C.state==="needs-you")??g[0];S.set(i.key,A);continue}let h=jn(i,t);
p.set(h.id,h),S.set(i.key,h)}if(e.assigned?.length){let i=new Map;for(let f of p.values())for(let b of f.references)(b.kind===
"change"||b.kind==="issue")&&b.url&&!i.has(b.url)&&i.set(b.url,f);let g={changes_requested:0,conflict:1,checks_failing:2,
ready_to_merge:3,assigned:4},h=new Map;for(let f of e.assigned){if(!f?.url||i.has(f.url)||!(f.status in g))continue;let b=h.
get(f.status);b?b.push(f):h.set(f.status,[f])}let A=[...h.entries()].sort((f,b)=>(g[f[0]]??9)-(g[b[0]]??9)).map(f=>f[1]),
C=[];for(let f=0;C.length<ro;f+=1){let b=!1;for(let P of A){if(C.length>=ro)break;let $=P[f];$&&(C.push($),b=!0)}if(!b)break}
let G=new Set(C.map(f=>f.url));for(let f of e.assigned){if(!f?.url||!i.has(f.url)&&!G.has(f.url))continue;let b=f.kind===
"issue"?"issue":"pull",P=f.status==="conflict"||f.status==="checks_failing",$=f.status==="changes_requested",L=f.status===
"ready_to_merge",J=b==="issue",M=i.get(f.url);if(M){M.owned=b,P&&(M.changeBlocked=!0,M.issue=!0),$&&(M.changesRequested=
!0),L&&(M.mergeReady=!0),(P||$||L)&&M.state==="done"&&(M.state="needs-you");continue}let K=P||$||L||J,F=b==="issue"?"own\
ed_issue_assigned":f.status==="conflict"?"owned_pull_conflict":f.status==="checks_failing"?"owned_pull_failing":f.status===
"changes_requested"?"owned_pull_changes_requested":f.status==="ready_to_merge"?"owned_pull_merge_ready":f.status==="chec\
ks_running"?"owned_pull_checks_running":"owned_pull_awaiting_review",Q=b==="issue"?`issue #${f.number}`:`#${f.number}`;p.
set(`owned:${f.url}`,{id:`owned:${f.url}`,title:f.title||Q,summary:t(F,{count:String(f.status==="checks_failing"?f.failing:
f.pending)}),state:K?"needs-you":"running",issue:P,updatedAt:Z(f.updated_at),provenance:t("owned_provenance",{repo:f.repo}),
references:[{kind:b==="issue"?"issue":"change",id:f.url,label:`${f.repo} ${Q}`,url:f.url,status:f.status==="awaiting_rev\
iew"?void 0:f.status.replace(/_/g," ")}],action:void 0,owned:b,changeBlocked:P||void 0,changesRequested:$||void 0,mergeReady:L||
void 0,assignedToYou:J||void 0})}}for(let[i,g]of Object.entries(s)){let h=S.get(i);h&&(h.state="needs-you",h.issue=!0,h.
stalledFor=g.silent_secs,h.summary=g.reason?t("stalled_because",{reason:g.reason,duration:Re(g.silent_secs)}):t("stalled\
_for",{duration:Re(g.silent_secs)}),h.action="open")}for(let[i,g]of Object.entries(a)){let h=S.get(i);h&&(h.state="needs\
-you",h.issue=!0,h.loopRepeats=g.repeats,h.summary=t("error_loop",{tool:g.tool,repeats:String(g.repeats)}),h.action="ope\
n")}for(let i of e.approvals){let g=i.slot?S.get(i.slot):void 0;if(g){Gn(g,i,t);continue}p.set(`approval:${i.id}`,{id:`a\
pproval:${i.id}`,title:ze(i.tool||i.source,t("approval_needed")),summary:i.tool_purpose||t("tool_call_waiting"),state:"n\
eeds-you",issue:!1,updatedAt:Z(i.ts),provenance:t("approval"),action:"review-approval",approvalKind:ko(i)?"subagent":"to\
ol",permissionId:i.id,permissionTool:i.tool||i.source,permissionPurpose:i.tool_purpose,permissionInput:i.tool_input,references:[
{kind:"approval",id:i.id,label:i.tool||i.source||t("approval")}]})}for(let i of e.agents){let g=i.parent?S.get(i.parent):
void 0;if(g){Hn(g,i,t);continue}let h=!!(i.done&&(i.error||i.outcome==="failed"));i.parent&&!h||p.set(`agent:${i.id}`,{id:`\
agent:${i.id}`,title:ze(i.task||i.agent,t("agent_work")),summary:h?i.error?.trim()||t("agent_failed",{task:i.task}):i.done?
t("agent_done"):t("work_in_progress"),state:h?"needs-you":i.done?"done":"running",issue:h,runFailed:h||void 0,retryPath:h&&
!i.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(i.id)}/retry`:void 0,updatedAt:Z(i.started),provenance:i.agent||
t("agent"),action:"discuss",references:[{kind:"agent",id:i.id,label:i.agent||t("agent")}]})}for(let i of e.workflows){let g=i.
session_key?S.get(i.session_key):void 0;if(g){Un(g,i,t);continue}let h=i.status==="failed";p.set(`workflow:${i.run_id}`,
{id:`workflow:${i.run_id}`,title:ze(i.name,i.run_id),summary:h?t("workflow_failed_generic"):i.status==="running"?t("work\
flow_running"):t("workflow_finished"),state:h?"needs-you":i.status==="running"?"running":"done",issue:h,runFailed:h||void 0,
progress:_o(i,t),nextSteps:No(i,t),retryPath:h?`/api/workflows/runs/${encodeURIComponent(i.run_id)}/rerun`:void 0,updatedAt:0,
provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:i.run_id,label:i.name||i.run_id}]})}for(let i of e.
crons){if(!i.is_running&&i.last_status!=="error")continue;let g=i.last_status==="error",h=Bn(i,l),A=t(g?"monitor_failed":
"monitor_running");p.set(`monitor:${i.id}`,{id:`monitor:${i.id}`,title:i.name,summary:h?`${A} ${t("monitor_next_check",{
duration:h})}`:A,state:g?"needs-you":"running",issue:g,runFailed:g||void 0,retryPath:g?`/api/crons/${encodeURIComponent(
i.id)}/run`:void 0,updatedAt:Z(i.running_since||i.last_run_ts||i.created_ts),provenance:t("monitor"),action:g?"discuss":
void 0,references:[{kind:"monitor",id:i.id,label:i.name}]})}for(let i of e.loops||[]){if(!i.active)continue;let g=String(
i.id||"");if(!g)continue;let h=Math.max(0,Number(i.cycle_count)||0),A=Math.max(0,Number(i.max_cycles)||0),C=i.slot_key&&
S.has(i.slot_key)?i.slot_key:void 0;p.set(`loop:${g}`,{id:`loop:${g}`,title:ze(i.message||"",t("loop")),summary:A?t("loo\
p_watching_capped",{cycles:String(h),cap:String(A)}):t("loop_watching",{cycles:String(h)}),state:"running",issue:!1,updatedAt:Z(
i.last_fire_ts||i.created_ts),sessionKey:C,parentId:C?S.get(C)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(
g)}`,action:C?"open":void 0,references:[{kind:"monitor",id:g,label:t("loop"),sessionKey:C},...C?[{kind:"session",id:C,label:S.
get(C)?.title||C,sessionKey:C}]:[]]})}let x=[...e.artifacts].sort((i,g)=>Z(g.updated_at)-Z(i.updated_at)).slice(0,8);for(let i of x){
let g=i.session_key&&S.has(i.session_key)?i.session_key:void 0;p.set(`artifact:${i.slug}`,{id:`artifact:${i.slug}`,title:ze(
i.name,t("artifact")),summary:i.description||t("artifact_ready",{kind:i.kind}),state:"done",issue:!1,updatedAt:Z(i.updated_at||
i.created_at),sessionKey:g,parentId:g?S.get(g)?.id:void 0,provenance:i.session_title||i.source||t("artifact"),action:g?"\
open":void 0,references:[{kind:"artifact",id:i.slug,label:i.name,sessionKey:g},...g?[{kind:"session",id:g,label:i.session_title||
g,sessionKey:g}]:[]]})}let _=[...p.values()];return ur(_,u),Mo(_)}function It(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function Do(e){let t=[],n=new Map;for(let s of e){let a=s.sessionKey;if(!a){t.push({key:s.id,items:[s],header:null,sessionKey:null});
continue}let u=n.get(a);if(u){u.items.push(s);continue}let l={key:a,items:[s],header:"session",sessionKey:s.sessionKey??
null};n.set(a,l),t.push(l)}return t}function Lo(e){let t=new Set,n=new Set,s=new Set,a=0,u=0,l=0,p=0,S=0;for(let x of e){
x.sessionKey&&t.add(x.sessionKey);for(let _ of x.references)_.kind==="change"?n.add(_.id):_.kind==="issue"&&s.add(_.id);
x.id.startsWith("workflow:")?a+=1:x.id.startsWith("monitor:")?u+=1:x.id.startsWith("agent:")&&(l+=1),x.state==="needs-yo\
u"&&(p+=1),x.updatedAt>S&&(S=x.updatedAt)}return{sessions:t.size,prs:n.size,issues:s.size,loops:a,crons:u,agents:l,needsYou:p,
lastActivityAt:S}}var fr=12;function Tt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function vr(e,t=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let n=Wt(e);return n===0?!0:t-n<=Ct}function Ko(e,t,n=Date.
now(),s=()=>!1){return e.filter(a=>a.key&&a.key!==t&&a.memory_mode!=="incognito").filter(a=>vr(a,n)).filter(a=>!s(a)).sort(
(a,u)=>Wt(u)-Wt(a)).slice(0,fr)}function Wt(e){let t=e.last_ts??e.last_activity_ts??e.created;if(typeof t=="number")return t>
1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Oo(e,t){let n={},s="unknown";
for(let a of e)try{let u=await t(`/api/chat/slots/${encodeURIComponent(a.key)}/summary`);if(!u||typeof u!="object"){s="u\
nsupported";break}if(u.enabled===!1){s="disabled";break}n[a.key]=u,s="available"}catch{s="unsupported";break}return{summaries:n,
support:s}}var qo=String.raw`
  .ow-root {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    color: var(--text);
    background: var(--bg);
  }
  /* Beta pill sits inline right after the name so the two read as one label. */
  .ow-title-line { display: inline-flex; align-items: center; gap: 8px; }
  .ow-beta {
    /* Size to the label, not the title: line-height:1 drops the tall inherited
       line box, align-self stops the flex item stretching to the title height. */
    line-height: 1;
    align-self: center;
    padding: 2px 9px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  /*
   * No page gutter. The 24px px-2/md:px-6 gutter belongs to DOCUMENT pages,
   * where content is cards floating on a page — Artifacts, Logs, Agents, Apps,
   * System all use it. A full-height workspace does not: ChatPage, the closest
   * sibling to this three-column layout, uses that class ZERO times and runs
   * edge to edge. Applying the document gutter here was the wrong convention,
   * and it cost 24px on both sides plus 24px at the bottom of a layout whose
   * columns are supposed to fill the viewport.
   */
  .ow-body { flex: 1; min-height: 0; padding: 0; }
  /*
   * No frame of its own. Every other dashboard page puts content directly in the
   * page gutter; this app used to draw a bordered, rounded, shadowed box INSIDE
   * that gutter and then inset the list again within it. Padding stacks and the
   * eye reads the sum, so the same content sat 41px in where other pages sit
   * 24px in — and the frame is what made this page look unlike the rest.
   *
   * The column divisions do not depend on it: the rail and the work column each
   * carry their own border-right, and the rail and Conductor carry their own
   * background.
   */
  .ow-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 6px var(--ow-conductor-w, 30%);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--bg);
  }
  /* Work 35% + utilities 35% inside the 7fr track; Conductor holds the 3fr.
     All four panels live here as siblings in fixed DOM order — nothing reorders,
     the grid coordinates below decide which one is primary. */
  .ow-main {
    display: grid;
    min-width: 0;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    padding: 6px 6px 16px 16px;
  }
  /* Column 2's rows: the open card's row takes the remainder, the other two
     shrink to their header. A grid row cannot size itself from its item, so the
     open card's index arrives as data-open-row. With nothing open the slack goes
     to the last row, so the primary's 1 / -1 span still fills the height. */
  .ow-main[data-open-row='0'] { grid-template-rows: minmax(0, 1fr) min-content min-content; }
  .ow-main[data-open-row='1'] { grid-template-rows: min-content minmax(0, 1fr) min-content; }
  .ow-main[data-open-row='2'],
  .ow-main[data-open-row='none'] { grid-template-rows: min-content min-content minmax(0, 1fr); }
  .ow-main > .ow-stack-card[data-primary='true'] { grid-column: 1; grid-row: 1 / -1; }
  .ow-main > .ow-stack-card[data-rail-index='0'] { grid-column: 3; grid-row: 1; }
  .ow-main > .ow-stack-card[data-rail-index='1'] { grid-column: 3; grid-row: 2; }
  .ow-main > .ow-stack-card[data-rail-index='2'] { grid-column: 3; grid-row: 3; }
  /* The work|rail handle spans the full column height; the layout handle sits
     in .ow-layout's own middle track and needs no placement. */
  .ow-main > .ow-resizer { grid-column: 2; grid-row: 1 / -1; }
  /* A closed card must not be stretched by its row — only the open one grows. */
  .ow-main > .ow-stack-card:not([open]) { align-self: start; }
  /* Drag handle between two panels. A 6px grab strip with a centred hairline
     that brightens on hover/focus; it is the only divider between the columns. */
  .ow-resizer {
    align-self: stretch;
    position: relative;
    cursor: col-resize;
    touch-action: none;
  }
  .ow-resizer::before {
    content: '';
    position: absolute;
    inset: 0 2px;
    border-radius: 2px;
    background: transparent;
    transition: background 0.12s ease;
  }
  .ow-resizer:hover::before,
  .ow-resizer:focus-visible::before { background: var(--accent); }
  .ow-resizer:focus-visible { outline: none; }
  .ow-filter[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    color: var(--accent);
  }
  .ow-count { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  /* Card shell, shared by the tabbed list and every utility-rail card. */
  .ow-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
  }
  /* Every panel is this card. The primary one is the same shell, expanded. */
  .ow-stack-card {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  /* Chrome wraps every non-summary child in a ::details-content BLOCK box, so
     the card's flex column holds only the summary and that wrapper — a body
     asking to flex was sizing itself against the wrapper and growing to its own
     content, which clipped the overflow with no way to scroll to it. Making the
     wrapper the flex column restores the bounded, internally scrolling body.
     Browsers without the pseudo drop this rule and keep the children as direct
     flex items, which is the same result. */
  .ow-stack-card::details-content {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    flex-direction: column;
    overflow: hidden;
  }
  /* Grab a card by its header; the body keeps normal text selection. */
  .ow-stack-card > summary { cursor: grab; }
  .ow-stack-card:active > summary { cursor: grabbing; }
  .ow-stack-card[data-dragover='true'] {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  /* The primary card cannot collapse, so it must not offer a collapse affordance. */
  .ow-stack-card[data-primary='true'] .ow-stack-chevron { display: none; }
  .ow-stack-actions { display: flex; flex: none; align-items: center; gap: 8px; }
  .ow-promote { padding: 2px 8px; font-size: 11px; }
  .ow-refreshbar { display: flex; flex: none; align-items: center; gap: 6px; }
  .ow-updated { color: var(--muted); font-size: 11px; white-space: nowrap; }
  /* Icon-only refresh: no chrome at rest, a subtle tint on hover, matching the
     other icon buttons. */
  .ow-refresh {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-md, 8px);
    background: none;
    color: var(--muted);
  }
  .ow-refresh:hover { background: var(--bg-hover); color: var(--text); }
  .ow-refresh:disabled { cursor: default; opacity: 0.7; }
  .ow-spin { animation: ow-spin 0.8s linear infinite; }
  @keyframes ow-spin { to { transform: rotate(360deg); } }
  /* Underline tabs, not the pill treatment the rail used: these switch what the
     list IS, so they read as the card's own header row rather than a filter.
     Symmetric padding and the same 13px as every other card title — the tab row
     shares a header line with the count badge, and asymmetric padding pushed the
     badge off the tab's text baseline. */
  .ow-listcard-tools { display: flex; flex: none; flex-direction: column; gap: 10px; padding: 0 14px 12px; }
  .ow-listcard-sub { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* The only scroll container in the column. */
  .ow-work { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .ow-work-inner { padding: 0 14px 14px; }
  /* Layout C — left rail: the state filter as a vertical nav beside the list.
     The rail holds still (its own scroll); .ow-work scrolls the list. */
  .ow-worksplit { flex: 1 1 auto; min-height: 0; display: flex; align-items: stretch; }
  .ow-railnav {
    flex: none; width: 150px; display: flex; flex-direction: column; gap: 2px;
    padding: 2px 10px 14px 14px; border-right: 1px solid var(--border); overflow-y: auto;
  }
  .ow-railnav .ow-railitem { width: 100%; justify-content: space-between; text-align: left; padding: 7px 10px; font-size: 12.5px; }
  .ow-railitem-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ow-stack-card > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 14px;
    list-style: none;
    cursor: pointer;
  }
  .ow-stack-card > summary::-webkit-details-marker { display: none; }
  .ow-stack-card > summary:hover { background: var(--bg-hover); }
  .ow-stack-card > summary:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .ow-stack-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-strong);
    font-size: 13px;
    font-weight: 650;
  }
  .ow-stack-chevron { flex: none; color: var(--muted); transition: transform 140ms ease; }
  .ow-stack-card[open] .ow-stack-chevron { transform: rotate(90deg); }
  .ow-stack-sub { margin: 0; padding: 0 14px; color: var(--muted); font-size: 12px; }
  .ow-stack-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 6px 14px 12px; }
  .ow-stack-empty { margin: 0; padding: 6px 0 2px; color: var(--muted); font-size: 13px; }
  /* Loop and cron rows: a type rail, the text block, then the status pill. */
  .ow-mini {
    display: grid;
    grid-template-columns: 3px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .ow-mini:last-child { border-bottom: none; }
  .ow-mini-rail { align-self: stretch; border-radius: 999px; }
  .ow-mini-title { color: var(--text-strong); font-size: 13px; font-weight: 600; }
  .ow-mini-desc {
    margin-top: 2px;
    overflow: hidden;
    color: var(--text);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ow-mini-when { margin-top: 3px; color: var(--muted); font-size: 11px; }
  .ow-mini-chip {
    margin-left: 6px;
    padding: 1px 6px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg);
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
  }
  .ow-section { margin: 0 0 28px; }
  /* Airy, and pinned: the header sticks to the top of the scrolling list so you
     always know which group you are in. The --card background covers rows that
     scroll up beneath it. */
  .ow-section-header {
    display: flex; flex-direction: column; gap: 3px;
    position: sticky; top: 0; z-index: 2;
    background: var(--card);
    padding: 14px 0 10px;
  }
  /* The first section sits right under the panel header, so it needs no airy
     top gap — that space reads as empty at the top of the list. */
  .ow-section:first-child .ow-section-header { padding-top: 2px; }
  .ow-section-heading { display: flex; align-items: baseline; gap: 8px; }
  .ow-section-title {
    margin: 0;
    color: var(--text-strong);
    font-size: 15px;
    font-weight: 650;
  }
  .ow-section-count { color: var(--muted); font-size: 13px; }
  .ow-section-subtitle { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.4; }
  .ow-section-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  .ow-section-empty { margin: 0; padding: 12px 4px; color: var(--muted); font-size: 14px; }
  .ow-row {
    position: relative;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
    cursor: pointer;
    outline: none;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
  }
  /* State rail on the left edge (option D). The selected / instructed accent
     rails are defined later in this sheet and outrank these, so an active row
     still reads as accent rather than its lane colour. */
  .ow-row[data-lane='unblock'] { box-shadow: inset 3px 0 0 var(--warn); }
  .ow-row[data-lane='followup'] { box-shadow: inset 3px 0 0 color-mix(in srgb, var(--warn) 55%, transparent); }
  .ow-row[data-lane='running'] { box-shadow: inset 3px 0 0 var(--accent); }
  .ow-row[data-lane='done'] { box-shadow: inset 3px 0 0 var(--ok); }
  .ow-row:hover { border-color: var(--border-strong); background: var(--bg-hover); }
  /* Focus ring via outline, not box-shadow, so it never replaces the lane rail.
     Keyboard-focus only; a mouse click to select shows nothing. */
  .ow-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  /* Selection recolours nothing on the row — the expanded detail and the
     Conductor quote are the feedback, so the rail and edges never change. */
  .ow-row-layout { display: flex; align-items: flex-start; gap: 12px; }
  .ow-row-content { min-width: 0; flex: 1; }
  /* Title line. The chevron is pushed to the trailing edge by the title's own
     flex growth, so it lands in the same place on every card. */
  .ow-row-heading { display: flex; min-width: 0; align-items: flex-start; gap: 8px; }
  .ow-row-chevron { flex: none; margin-top: 3px; color: var(--muted); transition: transform 140ms ease, color 140ms ease; }
  .ow-row-chevron[data-expanded='true'] { transform: rotate(90deg); }
  .ow-row:hover .ow-row-chevron { color: var(--text-strong); }
  /* Status line (option B): the state badge, then the one-line reason. */
  .ow-row-status { display: flex; min-width: 0; align-items: center; gap: 8px; margin-top: 6px; }
  .ow-row-statustext {
    min-width: 0;
    flex: 1 1 auto;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Turn rides at the trailing edge of the title line; monospace so a number
     reads as a coordinate into the transcript rather than as prose. */
  .ow-row-turn {
    flex: none;
    margin-left: auto;
    margin-top: 1px;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    white-space: nowrap;
  }
  /* State pill — one shape for all four states, colour + leading glyph vary.
     Translucent fills are mixed from the theme tokens so they track the theme. */
  .ow-rowstate {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .ow-rowstate .ow-icon { width: 11px; height: 11px; }
  .ow-rowstate-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .ow-rowstate-spin {
    flex: none; width: 9px; height: 9px; border-radius: 50%;
    border: 1.5px solid currentColor; border-right-color: transparent;
    animation: ow-rowstate-spin 0.9s linear infinite;
  }
  @keyframes ow-rowstate-spin { to { transform: rotate(360deg); } }
  .ow-rowstate--need   { color: var(--warn);   background: color-mix(in srgb, var(--warn) 14%, transparent);   border-color: color-mix(in srgb, var(--warn) 34%, transparent); }
  .ow-rowstate--follow { color: var(--warn);   background: color-mix(in srgb, var(--warn) 7%, transparent);    border-color: color-mix(in srgb, var(--warn) 20%, transparent); }
  .ow-rowstate--run    { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); border-color: color-mix(in srgb, var(--accent) 34%, transparent); }
  .ow-rowstate--queued { color: var(--muted);  background: color-mix(in srgb, var(--muted) 12%, transparent);  border-color: color-mix(in srgb, var(--muted) 26%, transparent); }
  .ow-rowstate--done   { color: var(--ok);     background: color-mix(in srgb, var(--ok) 13%, transparent);     border-color: color-mix(in srgb, var(--ok) 30%, transparent); }
  .ow-row-title {
    min-width: 0;
    color: var(--text-strong);
    font-weight: 650;
    /* TWO lines, not one line with an ellipsis.
       Auto-generated session titles frequently share a long leading phrase, so a
       single-line clamp cut away the only part that differed: five separate rows
       all read "Open ONE PR on kirodotdev/KiroCrew fixin…" and were impossible to
       tell apart. Two lines is still bounded -- the row cannot grow without
       limit -- while reaching the words that distinguish one from another. */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  .ow-row-summary {
    display: -webkit-box;
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--text);
    font-size: 14px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .ow-row-meta { display: flex; min-width: 0; align-items: center; gap: 8px; margin-top: 8px; color: var(--muted); font-size: 12px; }
  .ow-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ow-references { display: flex; min-width: 0; align-items: center; gap: 4px; overflow: hidden; }
  .ow-reference { display: inline-flex; min-width: 0; align-items: center; gap: 4px; }
  .ow-primary-action { flex-shrink: 0; }
  .ow-icon { width: 14px; height: 14px; flex-shrink: 0; }
  /* Sizing only. The resizer hairline to its left is the divider now, so the
     column carries no border-left of its own. */
  .ow-conductor {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
    /* Match the Sessions card's inset so the two boxes read as siblings and the
       border never hugs the resizer hairline. Left inset is tighter than the
       outer edge so the gutter between the two boxes stays small. */
    margin: 6px 16px 16px 6px;
  }
  .ow-conductor-header { padding: 8px 10px; border-bottom: 1px solid var(--border); }
  .ow-conductor-title { display: flex; align-items: baseline; gap: 8px; }
  .ow-conductor-title h2 { margin: 0; color: var(--text-strong); font-size: 15px; font-weight: 650; }
  .ow-conductor-sub { color: var(--muted); font-size: 12px; font-weight: 500; }
  .ow-lane-head { display: flex; align-items: baseline; gap: 8px; padding: 10px 16px 2px; }
  .ow-lane-badge { flex: 0 0 auto; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 5px; }
  .ow-lane-unblock { background: rgba(240, 185, 70, 0.15); color: #f0b946; }
  .ow-lane-followup { background: rgba(110, 168, 254, 0.16); color: #6ea8fe; }
  .ow-lane-reason { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 12px; }
  .ow-row-check { color: #5bbf7a; }
  /* The card's collapsed ledger: this session's finished goals, offered as
     context under the lanes rather than only in the Done section. */
  .ow-lane-done { padding: 8px 16px; }
  .ow-goals-toggle { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; color: var(--muted); font: inherit; font-size: 12px; cursor: pointer; }
  .ow-goals-toggle:hover { color: var(--text); }
  .ow-goals-toggle .ow-icon { width: 12px; height: 12px; transition: transform 0.15s ease; }
  .ow-goals-toggle .ow-icon[data-open="true"] { transform: rotate(90deg); }
  .ow-done-list { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .ow-eyebrow { color: var(--muted); font-size: 12px; font-weight: 550; }
    min-width: 0;
    overflow: hidden;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-align: left;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .ow-block { display: flex; flex-direction: column; gap: 8px; }
  /*
   * Option 2: the group IS a card, its goals are rows inside it.
   *
   * Option 5 (a tinted region holding filled cards) put two "lighter, rounded,
   * filled" rectangles at DIFFERENT levels into one list, so a container and an
   * item spoke the same visual language and the hierarchy stopped reading —
   * a lone card looked like it might be a group. Here the list has exactly one
   * visual category: a card is either one item, or one session holding rows.
   */
  .ow-block[data-grouped='true'] {
    gap: 0;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
  }
  /*
   * The session header. Its base rule was lost in an earlier edit, leaving the
   * element as a default <button> — which is why its icon wrapped onto its own
   * line rather than sitting beside the name.
   */
  .ow-block-name { font-weight: 600; }
  /* Rows give up their own frame: the enclosing card already provides it. */
  .ow-block[data-grouped='true'] .ow-row {
    border: 0;
    border-radius: 0;
    background: none;
  }
  /* A lane is the group inside a session card: its verb head labels the rows
     directly beneath it with NO line between them. Dividers fall between lanes,
     and between stacked rows within a lane — never right under a head, which is
     what made the badge read as part of the session header instead of its rows. */
  .ow-block[data-grouped='true'] .ow-lane + .ow-lane { border-top: 1px solid var(--border); }
  .ow-block[data-grouped='true'] .ow-lane .ow-row + .ow-row { border-top: 1px solid var(--border); }
  .ow-block[data-grouped='true'] .ow-row:hover { background: var(--bg-hover); }
  .ow-block[data-grouped='true'] .ow-row[data-selected='true'] {
    background: var(--aim-subtle);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .ow-reference-link {
    background: none;
    border: 0;
    padding: 0;
    color: inherit;
    cursor: pointer;
    text-decoration: none;
  }
  .ow-reference-link:hover { color: var(--text); text-decoration: underline; }
  /*
   * A recalled row is quieter than a live one. It reports no state and demands
   * nothing — flattening its background keeps it from competing with the work
   * that is actually in front of the user.
   */
  .ow-recall-row { background: none; }
  .ow-recall-row:hover { background: var(--bg-hover); }
  .ow-recall-age {
    flex: 0 0 auto;
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
  }
  /* An acknowledged item is in progress on the user's word, not the platform's. */
  .ow-row[data-instructed='true'] { box-shadow: inset 2px 0 0 var(--accent); }
  .ow-row-duplicate {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
    padding: 0;
    min-width: 0;
    max-width: 100%;
    background: none;
    border: 0;
    color: var(--warn);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
  }
  .ow-row-duplicate:hover { text-decoration: underline; }
  .ow-row-goals {
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12.5px;
    color: var(--text);
  }
  .ow-row-goals li { position: relative; padding-left: 12px; }
  .ow-row-goals li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 7px;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
  }
  .ow-row-goal-done { display: flex; align-items: center; gap: 6px; color: var(--muted); }
  .ow-row-goal-done .ow-icon { flex: none; color: var(--ok); width: 13px; height: 13px; }
  .ow-row-goals-more { color: var(--muted); }
  .ow-row-why {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .ow-row-why::before {
    content: '';
    flex: 0 0 auto;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
    transform: translateY(-3px);
    opacity: 0.7;
  }
  .ow-rank-why { margin: 8px 0 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
  .ow-next-steps { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .ow-next-step-list { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 0; padding-left: 18px; }
  .ow-next-step-list li { color: var(--text); font-size: 13px; line-height: 1.45; }
  .ow-next-step-what { display: block; font-weight: 550; }
  .ow-next-step-why { display: block; color: var(--muted); font-size: 12px; }
  .ow-chat { display: flex; min-height: 0; flex: 1; }
  .ow-chat-loading { width: 100%; padding: 16px; }
  .ow-chat-panel { position: relative; display: flex; min-height: 0; width: 100%; flex-direction: column; padding: 8px 10px; gap: 8px; }
  .ow-chat-panel > .ow-quote,
  .ow-chat-panel > .ow-permissions,
  .ow-chat-panel > .ow-conductor-receipt,
  .ow-chat-panel > .ow-chat-error { flex: none; }
  /* The embed fills the rest and scrolls inside itself, so the banner above it
     stays put instead of being overrun by the transcript. */
  .ow-embed { display: flex; flex: 1; min-height: 0; }
  .ow-embed > * { flex: 1; min-height: 0; }
  /* The shared chat message rows carry px-4 (16px) on top of the panel's own
     side padding, which pushes the transcript further in than the title/composer.
     Cancel it inside the embed only, so the transcript lines up at the panel's
     10px edge like the header row. */
  .ow-embed .px-4 { padding-left: 0; padding-right: 0; }
  /* One visible way in, pushed to the trailing edge of the session header. */
  .ow-block-open { margin-left: auto; flex: none; }
  /* Icon-only open affordance in the PR header — replaces the redundant "Open"
     text that duplicated the leading external-link glyph. */
  .ow-icon-link { display: inline-flex; align-items: center; padding: 4px; border-radius: 6px; color: var(--muted); }
  .ow-icon-link:hover { background: var(--bg-hover); color: var(--text); }
  .ow-toolbar { display: flex; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }
  .ow-toolbar .ow-search { flex: 1 1 240px; min-width: 200px; width: auto; order: 2; }
  .ow-filters { display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; order: 1; }
  .ow-filter { justify-content: center; gap: 5px; padding: 3px 10px; font-size: 12px; }
  .ow-filter .ow-count { font-size: 11px; }
  /* Title block takes the width; the verdict and the forge link hold the right
     edge, so the pill lands in the same place on every row. */
  .ow-pr-head-row { display: flex; align-items: flex-start; gap: 8px; }
  .ow-pr-head-click { display: block; min-width: 0; flex: 1; cursor: pointer; }
  /* The row's one plain-English line: what is holding this PR up. */
  .ow-pr-status-line { margin-top: 5px; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* One line, never two. The repo is the overflow valve — a wrapped timestamp
     put a stray "ago" on its own row on most cards. */
  .ow-pr-idline {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
  }
  .ow-pr-when { flex: none; }
  .ow-pr-number { flex: none; color: var(--muted); font-size: 12px; }
  /* Which repository — the board spans several, so the row has to say. */
  .ow-pr-repo { flex: none; color: var(--text-strong); font-size: 13px; font-weight: 650; }
  .ow-pr-title-line {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    margin-top: 2px;
  }
  /* Two lines at most, then ellipsis — the title owns the full row width, so it
     is legible before it is ever cut. */
  .ow-pr-title-line .ow-block-name {
    display: -webkit-box;
    overflow: hidden;
    min-width: 0;
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .ow-focus-head {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    color: var(--text);
  }
  .ow-focus-head strong { color: var(--text-strong); }
  .ow-focus-back { margin-left: auto; flex: none; }
  .ow-formal-approval {
    flex: none;
    margin: 10px 12px 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--warn);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
  }
  .ow-formal-badge {
    display: inline-block;
    padding: 2px 10px;
    border: 1px solid var(--warn);
    border-radius: 999px;
    color: var(--warn);
    font-size: 12px;
  }
  .ow-formal-detail {
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--bg-elevated);
  }
  .ow-formal-kv { display: flex; gap: 12px; min-width: 0; padding: 2px 0; font-size: 12px; }
  .ow-formal-key { flex: none; width: 15ch; color: var(--accent); font-family: ui-monospace, monospace; }
  .ow-formal-val { min-width: 0; overflow-wrap: anywhere; color: var(--text); }
  .ow-formal-mono { font-family: ui-monospace, monospace; }
  .ow-formal-actions { display: flex; gap: 8px; margin-top: 10px; justify-content: flex-end; }
  .ow-formal-reject:hover { color: var(--danger); border-color: var(--danger); }
  .ow-trust-wrap { position: relative; display: inline-flex; }
  .ow-trust-caret { transition: transform 0.15s ease; }
  .ow-trust-caret[data-open='true'] { transform: rotate(90deg); }
  .ow-trust-menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 4px);
    z-index: 10;
    display: flex;
    flex-direction: column;
    min-width: 220px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-elevated);
    box-shadow: 0 6px 20px rgba(0,0,0,.3);
  }
  .ow-trust-item {
    border: 0;
    background: none;
    padding: 6px 10px;
    border-radius: 4px;
    color: var(--text);
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }
  .ow-trust-item:hover { background: var(--bg-hover); }
  .ow-init-chevron { flex: none; transition: transform 0.15s ease; }
  .ow-init-chevron[data-open='true'] { transform: rotate(90deg); }

  /* ── Goal cards — the dashboard-mockup anatomy ──
     A plain bordered card: a collapse chevron + the goal name + an optional Split
     + a "N need you" flag, then a one-line composition meta, then the member rows
     (each a dot + label + chevron that expands on select). */
  .ow-goalcard { display: flex; flex-direction: column; gap: 0; padding: 12px 14px; }
  .ow-goalcard-summary { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .ow-goalcard-chevron {
    flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer;
  }
  .ow-goalcard-chevron:hover { color: var(--text); }
  .ow-goalcard-header {
    display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;
    padding: 0; background: none; border: 0; text-align: left; cursor: pointer;
  }
  .ow-goalcard-header .ow-icon { color: var(--muted); }
  .ow-goalcard-header:hover .ow-goalcard-title { text-decoration: underline; }
  /* A session card's title is a label, not a hit area — its Open button is the
     only way in, so the hover underline would promise an action it does not have. */
  .ow-goalcard-static { cursor: default; }
  .ow-goalcard-static:hover .ow-goalcard-title { text-decoration: none; }
  .ow-goalcard-header[data-selected='true'] .ow-goalcard-title { color: var(--accent); }
  /* The session name reads as a labelled chip now that the icon is gone: a
     subtle background marks "this is a session" in the icon's place, hugging the
     name (flex 0 1 auto) and still truncating a long one. */
  .ow-goalcard-title { flex: 1; min-width: 0; overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: none; }
  .ow-goalcard .ow-block-open { flex: none; margin: 0; }
  /* ---- Conductor panel (the operator surface for autonomous work) ----
     Namespaced ow-cond- rather than ow-conductor-: that name already belongs to
     the Conductor CHAT column, whose stacked-layout rule would otherwise apply
     a 560px min-height to this card. */
  .ow-cond { display: flex; flex-direction: column; gap: 8px; }
  .ow-cond-json {
    width: 100%;
    margin: 6px 0;
    padding: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    line-height: 1.45;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    resize: vertical;
  }
  .ow-cond-events { display: flex; flex-direction: column; gap: 2px; }
  /* One row per event, columns aligned so a column can be scanned rather than
     read: time, class, target, reason. */
  .ow-cond-event {
    display: grid;
    grid-template-columns: 62px auto minmax(0, 90px) minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    font-size: 11px;
  }
  .ow-cond-when { color: var(--muted); font-variant-numeric: tabular-nums; }
  .ow-cond-target {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .ow-cond-why {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--muted);
  }

  /* The collapsible automation shell inside the Conductor column. Bounded height
     so an event stream cannot push the chat off screen — the chat is the column's
     primary tenant. */
  .ow-cond-shell {
    border-bottom: 1px solid var(--border);
    max-height: 46vh;
    overflow-y: auto;
    flex: none;
  }
  .ow-cond-summary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
    user-select: none;
  }
  .ow-cond-shell[open] > .ow-cond-summary { color: var(--text); }
  .ow-cond-shell[open] .ow-stack-chevron { transform: rotate(90deg); }
  .ow-cond-note { margin: 2px 10px; }

  /* Inline variant: inside the work card the shell is a strip, not a column
     tenant, so it must not claim viewport height of its own. */
  /* Its own scroll, because it sits in the card's HEADER area rather than the
     scrolling body: an open edit form with six steps is taller than the region,
     and without this the Declare/Save buttons sit below the fold with no way to
     reach them. Capped rather than unbounded so the goal list underneath is never
     pushed entirely off screen. overflow auto means a short list still shows no bar. */
  .ow-cond-inline {
    border-bottom: 1px solid var(--border);
    max-height: 55vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .ow-cond-inline > .ow-cond { padding: 6px 10px 10px; }
  /* Inputs must not widen the section into a horizontal scroll. */
  .ow-cond-inline input,
  .ow-cond-inline textarea,
  .ow-cond-inline select { max-width: 100%; box-sizing: border-box; }

  /* ---- the goal form ---- */
  .ow-cond-form { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
  .ow-cond-field { display: flex; flex-direction: column; gap: 3px; }
  .ow-cond-field > span { font-size: 11px; color: var(--muted); }
  .ow-cond-text {
    width: 100%;
    padding: 6px 8px;
    font: inherit;
    font-size: 12px;
    line-height: 1.45;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    resize: vertical;
  }
  .ow-cond-select {
    padding: 5px 8px;
    font: inherit;
    font-size: 12px;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .ow-cond-steps-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 11px;
    color: var(--muted);
  }
  /* A step is one visually grouped unit: without the rule, six steps read as
     eighteen loose inputs. */
  .ow-cond-step {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .ow-cond-step-row { display: flex; gap: 4px; align-items: center; }
  .ow-cond-step-row > * { min-width: 0; flex: 1; }
  .ow-cond-step-row > button { flex: none; }

  /* A draft's planned steps, readable before the operator accepts them. */
  .ow-cond-plan { margin: 4px 0 2px; padding-left: 18px; font-size: 11px; color: var(--text); }
  .ow-cond-plan > li { margin: 1px 0; }
  .ow-cond-plan code { font-size: 10px; padding: 0 3px; border: 1px solid var(--border); border-radius: 3px; }
  .ow-cond-plan-file, .ow-cond-plan-after { color: var(--muted); }

  .ow-cond-setting {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--muted);
    flex-wrap: wrap;
  }
  .ow-cond-setting .ow-cond-secs { width: 72px; flex: none; }
  .ow-cond-hint { color: var(--muted); }
  /* Two buttons side by side in the steps header: Add step, and Decompose. */
  .ow-cond-step-actions { display: inline-flex; gap: 6px; flex-wrap: wrap; }
  /* Header row for the events pane: label on the left, Clear chat on the right. */
  .ow-cond-events-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  /* The per-goal worker list: one row per session, with its own Remove. */
  .ow-cond-workers { margin: 6px 0 0; display: flex; flex-direction: column; gap: 4px; }
  .ow-cond-workers-head { color: var(--muted); font-size: 11px; }
  .ow-cond-worker { display: flex; align-items: center; gap: 6px; font-size: 12px; }
  .ow-cond-worker-rows { color: var(--muted); margin-left: auto; white-space: nowrap; }

  /* A closed step reads as done at a glance without needing the chip. */
  .ow-cond-plan > li[data-closed] { color: var(--muted); text-decoration: line-through; }

  .ow-goal-flag {
    flex: none; margin-left: auto; padding: 1px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
    color: var(--muted); background: var(--bg-hover); border: 1px solid var(--border);
  }
  .ow-goal-flag-warn { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  /* The whole header is a filled band that bleeds to the card's inner edges
     (cancelling the card's 12/14 padding); the card's overflow:hidden rounds its
     top corners. Left padding lands the content at 23px, aligned with the rows. */
  .ow-goalcard-head {
    margin: -12px -14px 10px;
    padding: 10px 14px 10px 23px;
    background: var(--bg-hover);
  }
  .ow-goal-meta { margin: 4px 0 0; color: var(--muted); font-size: 11px; }
  /* --- Session card: one session = one card (status/name/turns, PRs, latest
     goal summary + first next step, everything else behind expand). --- */
  .ow-sessioncard {
    position: relative; display: flex; flex-direction: column;
  }
  /* Selection tints the WHOLE goal card, not just the headline: the expanded
     section is a sibling of .ow-sessioncard, so the tint lives on the enclosing
     card container and covers both (headline + expanded). The card body itself
     is inert — quoting is the deliberate "Reference in chat" hover action, not a
     stray click, so no pointer cursor / focus ring here. */
  .ow-block[data-grouped='true']:has(.ow-sessioncard[data-selected='true']) { background: var(--aim-subtle); }
  .ow-sessioncard:hover .ow-row-aside,
  .ow-sessioncard:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  .ow-card-top { display: flex; align-items: center; gap: 8px; }
  .ow-card-meta {
    margin-left: auto; display: flex; align-items: center; gap: 6px;
    min-width: 0; color: var(--muted); font-size: 12px;
  }
  .ow-card-meta > * + *::before { content: '·'; margin-right: 6px; color: var(--border); }
  .ow-card-name {
    padding: 0; border: 0; background: none; font: inherit; font-size: 12px;
    color: var(--muted); font-weight: 500; max-width: 240px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; cursor: pointer;
  }
  .ow-card-name:hover { color: var(--accent); text-decoration: underline; }
  .ow-card-metapart { white-space: nowrap; }
  .ow-card-title { margin: 8px 0 0; color: var(--text-strong); font-size: 16px; font-weight: 600; line-height: 1.3; }
  .ow-card-prs { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; }
  .ow-card-pr {
    display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px;
    font-size: 12px; color: var(--text); background: var(--bg-hover);
    border: 1px solid var(--border); text-decoration: none; white-space: nowrap;
  }
  .ow-card-pr:hover { border-color: var(--border-strong); }
  .ow-card-pr-status { color: var(--muted); }
  .ow-card-pr[data-status='merged'] { color: var(--ok); background: var(--ok-subtle, rgba(52,211,153,.12)); border-color: transparent; }
  .ow-card-pr[data-status='merged'] .ow-card-pr-status { color: var(--ok); }
  .ow-card-pr[data-status='checks running'] { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
  .ow-card-pr[data-status='checks running'] .ow-card-pr-status { color: var(--accent); }
  .ow-card-pr[data-status='checks failing'], .ow-card-pr[data-status='conflict'] { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  .ow-card-pr[data-status='checks failing'] .ow-card-pr-status, .ow-card-pr[data-status='conflict'] .ow-card-pr-status { color: var(--warn); }
  .ow-card-pr[data-status='closed'] { color: var(--muted); }
  .ow-card-summary { margin: 10px 0 0; color: var(--text); font-size: 13px; line-height: 1.5; }
  /* Suggested next step: a label, then the step as one CTA (arrow + what + its
     quieter "why"). The whole button is the hit area and highlights together. */
  /* Spacing-only wrapper: the "Suggested next step" heading now uses the shared
     .ow-detail-label (a caption + trailing rule) so it matches "You asked for". */
  .ow-card-nextstep { margin-top: 12px; }
  .ow-card-step {
    display: flex; gap: 8px; align-items: flex-start; width: 100%;
    padding: 6px 8px; margin: 0 -8px; border: 0; border-radius: 6px;
    background: none; text-align: left; cursor: pointer; color: var(--text);
  }
  .ow-card-step:hover { background: var(--bg-hover); }
  .ow-card-step:hover .ow-card-step-what { color: var(--accent); }
  .ow-card-step-arrow { flex: none; margin-top: 1px; color: var(--warn); }
  .ow-card-step-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .ow-card-step-what { font-size: 13px; }
  .ow-card-step-why { color: var(--muted); font-size: 12px; font-style: italic; }
  .ow-card-expanded { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
  /* A clear section break: the session's OTHER items are distinct from the
     headline goal's own detail above, so give the group a rule + real space. */
  .ow-card-morelabel {
    margin: 20px 0 4px; padding-top: 16px; border-top: 1px solid var(--border-strong, var(--border));
    color: var(--muted-strong, var(--muted)); font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .04em;
  }
  /* One of the session's other items, in the expand — same treatment as the
     headline (status, title, its own next-step CTA, hover actions). */
  .ow-moreitem {
    position: relative; display: flex; flex-direction: column; gap: 6px;
    padding-top: 8px; border-top: 1px solid var(--border);
  }
  /* The first item sits directly under the section label's rule — don't draw a
     second line right beneath it. */
  .ow-card-morelabel + .ow-moreitem { border-top: 0; padding-top: 4px; }
  .ow-moreitem:hover .ow-row-aside,
  .ow-moreitem:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  .ow-moreitem-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .ow-moreitem-title { min-width: 0; color: var(--text-strong); font-size: 13px; font-weight: 600; }
  .ow-moreitem-summary { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
  /* A more-item's own expanded detail (rest of its steps + ask/progress). */
  .ow-moreitem-detail { display: flex; flex-direction: column; gap: 8px; padding: 2px 0 6px; }
  /* PR/issue links share the line and the muted look of the rest of the meta;
     a dot separates each piece the way the text parts are joined. */
  .ow-goal-meta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .ow-goal-meta-row > * + *::before { content: '·'; margin-right: 6px; color: var(--border); }
  .ow-goal-meta-row .ow-reference { color: var(--muted); font-size: 11px; }
  .ow-goal-meta-row .ow-reference .ow-icon { width: 12px; height: 12px; }
  .ow-goal-meta-row .ow-reference-link:hover { color: var(--text); text-decoration: underline; }
  /* Why the merge happened. Subdued below the meta: it answers a question the
     user only asks when the grouping looks wrong, so it must not compete with
     the goal's own name or its composition. */
  /* Member rows: content aligns with the header title's text (the icon that
     used to force a 26px indent is gone); the state rail sits in the gutter. */
  .ow-goalcard .ow-row { padding: 7px 4px 7px 9px; }
  .ow-goalcard .ow-row + .ow-row { border-top: 1px solid var(--border); }
  .ow-goalcard .ow-row-title { color: var(--text); font-weight: 500; }
  .ow-goalcard .ow-row[data-selected='true'] .ow-row-title { color: var(--text-strong); font-weight: 700; }
  .ow-quote-docked .ow-eyebrow { flex: none; white-space: nowrap; }
  /* Looks like the eyebrow but reads as a control: accent colour + pointer signal
     the destination is switchable. Text carries the active target. */
  .ow-scope-toggle {
    flex: none; white-space: nowrap;
    padding: 0; border: 0; background: none;
    color: var(--accent); font-family: inherit; font-size: 12px; font-weight: 550;
    cursor: pointer;
  }
  .ow-scope-toggle:hover { text-decoration: underline; }
  .ow-srow { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-top: 1px solid var(--border); cursor: pointer; }
  .ow-srow[data-selected='true'] { background: var(--aim-subtle); }
  .ow-srow-body { min-width: 0; flex: 1; }
  .ow-srow-name { color: var(--text-strong); font-weight: 600; }
  .ow-srow-state { margin-top: 2px; color: var(--muted); font-size: 12px; }
  .ow-srow-badge { flex: none; }
  .ow-srow-open { flex: none; }
  .ow-pr-status { color: var(--muted); }
  .ow-pr-status[data-bad='true'] { color: var(--danger); }


  /* The decision inside a list row: flush to the row's own padding. */
  .ow-row .ow-permission { margin: 10px 0 2px; }

  @keyframes ow-expand { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
  .ow-expand { display: grid; animation: ow-expand 160ms ease; }
  .ow-expand-inner { min-height: 0; overflow: hidden; }
  .ow-steps-more { padding: 2px 0; border: 0; background: none; color: var(--muted); font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
  .ow-steps-more:hover { color: var(--text); text-decoration: underline; }
  /*
   * The expanded card's three sections. One rule per section, drawn as part of
   * the LABEL rather than as a separate element, so a section that has no data
   * takes its rule with it when it is not rendered — no stray hairline over a
   * gap.
   */
  .ow-row-detail { display: flex; flex-direction: column; gap: 12px; margin: 12px 0 2px; }
  .ow-detail { display: flex; flex-direction: column; gap: 6px; }
  .ow-detail-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ow-detail-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  /* Indented with a left border: the visual grammar of a quotation, because this
     is the user's own sentence reproduced rather than the app's account of it. */
  .ow-detail-quote {
    margin: 0;
    padding: 2px 0 2px 10px;
    border-left: 2px solid var(--border-strong, var(--border));
    color: var(--text);
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .ow-detail-facts {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text);
    font-size: 13px;
    line-height: 1.45;
  }
  .ow-detail-facts li { position: relative; padding-left: 12px; overflow-wrap: anywhere; }
  .ow-detail-facts li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 8px;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
  }
  /* Each suggestion is one clickable block of three tiers. The accent edge marks
     it as the actionable part of the card — the only thing here that does
     something when clicked. Two classes deep on purpose: .ow-quote-step sets the
     border SHORTHAND further down this sheet, which at equal specificity would
     win on source order and flatten this edge back to a plain hairline. */
  .ow-quote-step.ow-detail-step {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    border-left: 2px solid var(--accent);
    border-radius: 0 8px 8px 0;
  }
  .ow-detail-step-what { color: var(--text); font-size: 13px; font-weight: 400; line-height: 1.45; }
  .ow-detail-step-why { color: var(--muted); font-size: 12px; line-height: 1.45; }
  .ow-detail-step-expect { color: var(--muted); font-size: 12px; font-style: italic; line-height: 1.45; opacity: 0.8; }
  /* Reveal-on-hover, top-right. Hidden and non-interactive at rest so the card
     is clean; shown on hover OR keyboard focus so it is not mouse-only. Floated
     over the corner (not in flow) so appearing shifts no layout. A backing panel
     keeps the labels legible over whatever text sits behind them. */
  /* Management CTAs (Later / Handled) float top-right and appear on hover/focus
     only, so the resting row stays clean. */
  .ow-row-aside {
    position: absolute; top: 8px; right: 10px; z-index: 1;
    display: flex; gap: 2px; padding: 2px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--card);
    opacity: 0; pointer-events: none; transition: opacity 120ms ease;
  }
  .ow-row:hover .ow-row-aside,
  .ow-row:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  .ow-aside-btn {
    padding: 2px 8px; border: 0; background: none; border-radius: 6px;
    color: var(--muted); font: inherit; font-size: 12px; cursor: pointer;
  }
  .ow-aside-btn:hover { background: var(--bg-hover); color: var(--text); }
  /* The primary aside action: quote this goal to the Conductor. */
  .ow-aside-btn--ref { color: var(--accent); font-weight: 600; }
  .ow-aside-btn--ref:hover { background: var(--accent-subtle, var(--bg-hover)); color: var(--accent); }
  .ow-section-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; cursor: pointer; }
  .ow-section-chevron { transition: transform 120ms ease; }
  .ow-section-chevron[data-open='true'] { transform: rotate(90deg); }
  .ow-aside-note {
    margin-top: 6px; padding: 0; border: 0; background: none;
    color: var(--muted); font: inherit; font-size: 12px; cursor: pointer; text-align: left;
  }
  .ow-aside-note:hover { color: var(--text); text-decoration: underline; }
  .ow-retry { margin: 10px 0 2px; }

  .ow-permissions { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px 0; }
  .ow-permission {
    display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border));
    border-radius: var(--radius-lg, 8px);
    background: color-mix(in srgb, var(--accent) 8%, var(--card));
  }
  .ow-permission-body { min-width: 0; flex: 1; }
  .ow-permission-head { display: flex; align-items: center; gap: 6px; }
  .ow-permission-title { color: var(--text-strong); font-size: 13px; font-weight: 650; }
  .ow-permission-what { margin: 4px 0 0; color: var(--text); font-size: 13px; }
  .ow-permission-what code { padding: 1px 4px; border-radius: 4px; background: var(--bg-hover); font-size: 12px; }
  .ow-permission-why { margin: 4px 0 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  .ow-permission-actions { display: flex; flex: none; gap: 6px; }

  .ow-quote {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 10px; border-left: 3px solid var(--accent);
    border-radius: 0 var(--radius-lg, 8px) var(--radius-lg, 8px) 0;
    background: color-mix(in srgb, var(--text) 5%, var(--card));
  }
  /* One line: eyebrow, gap, title. The spans previously abutted ("InstructingCrew…"). */
  .ow-quote-body { display: flex; min-width: 0; flex: 1; align-items: baseline; gap: 8px; }
  /* Rendered in ChatEmbed's aboveComposer slot: normal flow directly above the
     composer, so there is no absolute offset to keep in sync with its height. */
  .ow-quote-docked { margin: 0 0 6px; }
  .ow-quote-title { overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
  /* Full text, wrapped. These are sentences the user is deciding whether to
     SEND — a suggestion cut to "Implement the receipt + scope chip in the Cond…"
     cannot be judged. Rounded rectangle instead of a pill because a wrapped
     two-line pill reads as a blob. */
  .ow-quote-step {
    max-width: 100%; padding: 4px 10px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--card);
    color: var(--text); font-size: 12px; line-height: 1.45; text-align: left;
    white-space: normal; cursor: pointer;
  }
  .ow-quote-step:hover { border-color: var(--accent); color: var(--text-strong); }
    border: 0; background: none; padding: 0; color: var(--muted);
    font: inherit; cursor: pointer;
  }
  .ow-quote-clear { flex: none; }

  .ow-chat-composer { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--border); }
  .ow-chat-composer > :first-child { min-width: 0; flex: 1; }
  .ow-chat-error { padding: 0 12px 10px; color: var(--danger); font-size: 12px; }
  .ow-conductor-receipt { display: flex; align-items: center; gap: 8px; padding: 0 12px 10px; color: var(--ok); font-size: 12px; }
  @media (max-width: 1100px) {
    /* Rows must size to content, not split the viewport height: .ow-main has no
       overflow of its own, so a stretched row let its panels paint over the
       Conductor row below. The whole stack scrolls in .ow-layout instead. */
    .ow-layout {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: min-content min-content;
      align-content: start;
      overflow-y: auto;
    }
    .ow-main { grid-template-columns: minmax(0, 1fr); }
    /* One column, four panels in DOM order. Same specificity as the placement
       rules above and later in the sheet, so these win without !important. */
    .ow-main[data-open-row] { grid-template-rows: auto; grid-auto-rows: min-content; }
    .ow-main > .ow-stack-card[data-primary] { grid-column: 1; grid-row: auto; }
    .ow-main > .ow-stack-card[data-primary='true'] { min-height: 70vh; }
    .ow-main > .ow-stack-card[data-rail-index] { grid-column: 1; grid-row: auto; }
    /* No side-by-side columns to divide once everything stacks. */
    .ow-resizer { display: none; }
    .ow-conductor { min-height: 560px; margin: 0 16px 16px; }
    /* The left rail folds back into a horizontal filter row above the list. */
    .ow-worksplit { flex-direction: column; }
    .ow-railnav {
      flex-direction: row; flex-wrap: wrap; width: auto; overflow: visible;
      border-right: 0; border-bottom: 1px solid var(--border); padding: 0 14px 10px;
    }
    .ow-railnav .ow-railitem { width: auto; }
  }
`;import{Fragment as Xe,jsx as r,jsxs as w}from"react/jsx-runtime";var Ce=["work"],Go=["work"],tn={work:"Sessions",loops:"\
Loops",schedule:"Scheduled tasks"};function $t({id:e,onPromote:t}){return r(ae,{className:"ow-promote","aria-label":`Mov\
e ${tn[e]} to the first column`,onClick:n=>{n.preventDefault(),n.stopPropagation(),t(e)},children:"Make primary"})}function Et({
lastUpdated:e,refreshing:t,onRefresh:n}){let s=e?Lt(e):null;return w("span",{className:"ow-refreshbar",children:[s&&w("s\
pan",{className:"ow-updated","aria-live":"polite",children:["updated ",s]}),r(ae,{className:"ow-refresh",onClick:a=>{a.preventDefault(),
a.stopPropagation(),n()},disabled:t,"aria-label":"Refresh",title:"Refresh",children:r(Cr,{className:`ow-icon${t?" ow-spi\
n":""}`,"aria-hidden":"true"})})]})}var Pt="crew-manager.snoozed",Ho="crew-manager.handled",Bt="crew-manager.stack-open-\
v2",Mt="crew-manager.primary-v1";function De(e,t={}){try{let n=localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}
function Ae(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Lt(e,t=Date.now()){if(!e)return null;let n=Math.
max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let s=Math.round(n/60);if(s<60)return`${s}m ago`;let a=Math.round(
s/60);return a<24?`${a}h ago`:`${Math.round(a/24)}d ago`}function Uo(e){return e?new Date(e).toLocaleTimeString([],{hour:"\
numeric",minute:"2-digit"}):""}var Ie="crew-manager-conductor",zr=5e3,Dr={session:"Session",approval:"Approval",agent:"Agent",workflow:"Workflow",monitor:"\
Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"Allow or refu\
se a sub-agent held at the spawn gate",information_needed:"Answer the request in the work thread",decision_ready:"Make t\
he decision this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"Open the linked change \
\u2014 a check is failing or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"Revi\
ew the pending {{tool}} request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool cal\
l",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"This agent stopped before finishing \u2014 noth\
ing to do here",workflow_failed:"This workflow stopped before finishing",workflow_failed_generic:"This workflow stopped \
before finishing",workflow_running:"Workflow is running",workflow_finished:"Workflow finished",workflow_fact_last_log:"G\
ot as far as: {{log}}",workflow_fact_phase:"It was in the {{phase}} phase",workflow_fact_error:"It stopped with: {{error\
}}",workflow_fact_agent_errors:"{{count}} of its agents reported an error",workflow_fact_partials:"{{count}} agents fini\
shed first, so their output survived",workflow_step_diagnose:"Find out why {{name}} stopped, then re-run it",workflow_step_why_error:"\
it failed with {{error}}, so re-running it as-is repeats that",workflow_step_why_generic:"it has not been re-run, and no\
thing says the cause is fixed",workflow_step_expect_partials:"a diagnosis, and {{count}} finished agents worth reusing",
workflow_step_expect_generic:"a diagnosis you can act on before spending another run",monitor_failed:"The latest check s\
topped before finishing",monitor_running:"Monitor is checking now",monitor_next_check:"Checks again in {{duration}}.",loop:"\
Monitor loop",loop_watching:"Re-prompting its own session \u2014 {{cycles}} cycles so far, no limit set",loop_watching_capped:"\
Re-prompting its own session \u2014 cycle {{cycles}} of {{cap}}",artifact_ready:"{{kind}} output is ready",stalled_for:"\
Check on it \u2014 no activity for {{duration}}, still marked running",stalled_because:"{{reason}} Silent for {{duration\
}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same linked change",duplicate_same_artifact:"\
Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_deliverable:"Also being worked in \u201C{{tit\
le}}\u201D \u2014 same deliverable",duplicate_same_topic:"Looks like the same work as \u201C{{title}}\u201D",duplicate_same_step:"\
Next step matches \u201C{{title}}\u201D \u2014 may be the same work",related_sessions:"{{count}} other session(s) on thi\
s same work",related_same_change:"same change",related_same_artifact:"same artifact",related_same_deliverable:"same deli\
verable",related_same_topic:"similar item",related_same_step:"same next step",related_more:"and {{count}} more",rank_approval_owed:"\
only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"the a\
gent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failure ha\
s repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{durat\
ion}}",rank_change_blocked:"a linked change is failing or conflicting",rank_changes_requested:"a reviewer asked you for \
changes",rank_assigned_to_you:"assigned to you and nobody has started it",rank_merge_ready:"approved and green \u2014 only yo\
u can merge it",rank_nobody_on_it:"nobody is on {{count}} unfinished item(s) in this session",no_next_step:"No next step\
 recorded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",owned_pull_conflict:"Your pull request has a conflict to resolve.",owned_pull_failing:"Your pull req\
uest has {{count}} failing check(s).",owned_pull_changes_requested:"A reviewer has requested changes on your pull reques\
t.",owned_pull_merge_ready:"Approved with nothing red. Only you can merge it.",owned_pull_awaiting_review:"Waiting on re\
viewers, not on you.",owned_pull_checks_running:"{{count}} check(s) still running.",owned_issue_assigned:"Assigned to yo\
u.",owned_provenance:"{{repo}}",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"\
{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work",card_asked_for:"You asked for",
card_where_it_stands:"Where it stands",card_suggested_next:"Suggested next",card_turn:"turn {{turn}}"};function oe(e,t={}){
return Dr[e].replace(/\{\{(\w+)\}\}/g,(n,s)=>t[s]??"")}var Lr={"needs-you":"Needs you",running:"Running",done:"Done"},zt={
all:"All","needs-you":"Needs you","follow-up":"Follow up",running:"Running",done:"Done"},Kr={session:Rr,approval:Qo,agent:yr,
workflow:Tr,monitor:en,artifact:Sr,change:Nr,issue:Wr};function Qe({children:e,onActivate:t,...n}){return r("div",{...n,
role:"button",tabIndex:0,onClick:t,onKeyDown:s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),t())},children:e})}
function Yo({label:e,count:t,subtitle:n}){return w("div",{className:"ow-section-header",children:[w("div",{className:"ow\
-section-heading",children:[r("h2",{className:"ow-section-title",children:e}),r("span",{className:"ow-section-count",children:t})]}),
n&&r("p",{className:"ow-section-subtitle",children:n})]})}function Kt(e){let t=We(e);return t==="unblock"?w("span",{className:"\
ow-rowstate ow-rowstate--need",children:[r("span",{className:"ow-rowstate-dot","aria-hidden":"true"}),"Needs you"]}):t===
"followup"?w("span",{className:"ow-rowstate ow-rowstate--follow",children:[r("span",{className:"ow-rowstate-dot","aria-h\
idden":"true"}),"Follow up"]}):t==="running"?e.moving?w("span",{className:"ow-rowstate ow-rowstate--run",children:[r("sp\
an",{className:"ow-rowstate-spin","aria-hidden":"true"}),"Running"]}):r("span",{className:"ow-rowstate ow-rowstate--queu\
ed",children:"Queued"}):w("span",{className:"ow-rowstate ow-rowstate--done",children:[r(Xo,{className:"ow-icon","aria-hi\
dden":"true"}),"Done"]})}function Or({tool:e,purpose:t,busy:n,onAnswer:s,where:a}){return w("div",{className:"ow-permiss\
ion",children:[w("div",{className:"ow-permission-body",children:[w("div",{className:"ow-permission-head",children:[r(Ar,
{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-permission-title",children:"Waiting for your permiss\
ion"})]}),w("p",{className:"ow-permission-what",children:[a&&w("span",{className:"ow-truncate",children:[a," "]}),a?"wan\
ts to run ":"Wants to run ",r("code",{children:e})]}),t&&r("p",{className:"ow-permission-why",children:t})]}),w("div",{className:"\
ow-permission-actions",children:[r(ae,{onClick:()=>s(!0),disabled:n,children:"Approve"}),r(ae,{onClick:()=>s(!1),disabled:n,
children:"Reject"})]})]})}function Le({children:e}){return r("div",{className:"ow-expand",children:r("div",{className:"o\
w-expand-inner",children:e})})}function Te({label:e,children:t}){let n=br();return w("div",{className:"ow-detail",role:"\
group","aria-labelledby":n,children:[r("div",{className:"ow-detail-label",id:n,children:e}),t]})}function Vo(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function on({
item:e,busy:t,onDecide:n}){let[s,a]=E(!1),u=e.permissionInput||"",l=u.trim().split(/\s+/)[0]||e.permissionTool||"";return w(
"div",{className:"ow-formal-approval",role:"presentation",onClick:p=>p.stopPropagation(),onKeyDown:p=>p.stopPropagation(),
children:[r("div",{className:"ow-formal-badge",children:"Waiting for approval"}),w("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&w("div",{className:"ow-formal-kv",children:[r("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),r("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),w("div",{className:"ow-formal-kv",children:[
r("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),r("span",{className:"ow-formal-val ow-formal-mon\
o",children:u||"(no input details)"})]})]}),w("div",{className:"ow-formal-actions",children:[r(ae,{disabled:t,onClick:()=>n(
"approved"),children:"Allow once"}),w("span",{className:"ow-trust-wrap",children:[w(ae,{disabled:t,onClick:()=>a(p=>!p),
"aria-expanded":s,children:["Trust ",r(ge,{className:"ow-icon ow-trust-caret","data-open":s?"true":void 0,"aria-hidden":"\
true"})]}),s&&w("span",{className:"ow-trust-menu",role:"menu",children:[u&&r("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{a(!1),n("trust_command")},children:"Trust this exact command"}),l&&w("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),n("trust_base")},children:["Trust \u201C",
l,"\u201D commands"]}),r("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),
n("trust")},children:"Trust everything in this session"})]})]}),r(ae,{className:"ow-formal-reject",disabled:t,onClick:()=>n(
"rejected"),children:"Reject"})]})]})}function qr({reference:e,onOpenSession:t}){let n=Kr[e.kind],s=w(Xe,{children:[r(n,{className:"ow-icon"}),r("span",{className:"\
ow-truncate",children:e.label})]});return e.url?r("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_bl\
ank",rel:"noopener noreferrer",onClick:a=>a.stopPropagation(),children:s}):e.sessionKey?r(Qe,{className:"ow-reference ow\
-reference-link",onActivate:()=>t(e.sessionKey),children:s}):r("span",{className:"ow-reference",children:s})}function Fr({
item:e,selected:t,continuation:n,whyRanked:s,onSelect:a,onOpenSession:u,onAnswerPermission:l,permissionBusy:p,onRetry:S,
retryBusy:x,onStop:_,stopBusy:i,onPickStep:g,onSnooze:h,onHandled:A,compact:C,headless:G,showBadge:f=!0,onDecideApproval:b}){
let P=(e.nextSteps??[]).filter(B=>B.what?.trim()),$=(e.progress??[]).filter(B=>B.trim()),L=e.initialIntent?.trim(),J=!!L||
$.length>0,M=Kt(e),K=e.lastTouchedTurn?oe("card_turn",{turn:String(e.lastTouchedTurn)}):null,F=!!e.summary&&(P.some(B=>B.
what?.trim()===e.summary)||t&&L===e.summary?.trim()),Q=!!e.summary&&(C&&!t?!s:!F),ee=s||(Q?e.summary:null);return w(Qe,{
onActivate:a,className:"ow-row","aria-label":e.title,"aria-pressed":t,"aria-expanded":J?t:void 0,"data-selected":t,"data\
-lane":We(e),"data-instructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.
id}`,children:[r("div",{className:"ow-row-layout",children:w("div",{className:"ow-row-content",children:[!G&&w(Xe,{children:[
w("div",{className:"ow-row-heading",children:[r("span",{className:"ow-row-title",children:e.title}),K&&r("span",{className:"\
ow-row-turn",children:K}),r(ge,{className:"ow-icon ow-row-chevron","data-expanded":t?"true":void 0,"aria-hidden":"true"})]}),
(f&&M||ee)&&w("div",{className:"ow-row-status",children:[f&&M,ee&&r("span",{className:"ow-row-statustext",children:ee})]})]}),
e.duplicateOf&&w(Qe,{className:"ow-row-duplicate",onActivate:()=>u(e.duplicateOf.sessionKey),children:[r(Dt,{className:"\
ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:oe(`duplicate_${e.duplicateOf.because}`,{title:e.
duplicateOf.title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&r(Le,{children:w("div",{className:"ow-related",
children:[r("span",{className:"ow-related-label",children:oe("related_sessions",{count:String(e.relatedSessions.length)})}),
e.relatedSessions.map(B=>w(Qe,{className:"ow-related-row",onActivate:()=>u(B.sessionKey),children:[r(Dt,{className:"ow-i\
con","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:B.title}),r("span",{className:"ow-related-why",children:oe(
`related_${B.because}`)})]},B.sessionKey)),e.relatedMore?r("span",{className:"ow-related-more",children:oe("related_more",
{count:String(e.relatedMore)})}):null]})}),!n&&w("div",{className:"ow-row-meta",children:[r("span",{className:"ow-trunca\
te",children:e.provenance}),Vo(e).length>0&&r("span",{"aria-hidden":"true",children:"\xB7"}),r("span",{className:"ow-ref\
erences",children:Vo(e).slice(0,3).map(B=>r(qr,{reference:B,onOpenSession:u},`${B.kind}:${B.id}`))})]})]})}),t&&J&&r(Le,
{children:w("div",{className:"ow-row-detail",children:[L&&r(Te,{label:oe("card_asked_for"),children:r("blockquote",{className:"\
ow-detail-quote",children:L})}),$.length>0&&r(Te,{label:oe("card_where_it_stands"),children:r("ul",{className:"ow-detail\
-facts",children:$.map((B,we)=>r("li",{children:B},`${we}:${B}`))})})]})}),e.retryPath&&S&&r(Le,{children:r("div",{className:"\
ow-retry",children:r(ae,{onClick:()=>S(e.retryPath),disabled:!!x,children:"Retry"})})}),e.stopPath&&_&&r(Le,{children:r(
"div",{className:"ow-retry",children:r(ae,{onClick:()=>_(e.stopPath),disabled:!!i,children:i?"Stopping\u2026":"Stop this\
 loop"})})}),e.permissionId&&b&&r(Le,{children:r(on,{item:e,busy:!!p,onDecide:B=>b(e,B)})}),e.state==="needs-you"&&h&&A&&
w("div",{className:"ow-row-aside",children:[r("button",{type:"button",className:"ow-aside-btn",onClick:B=>{B.stopPropagation(),
h(e.id)},children:"Later"}),r("button",{type:"button",className:"ow-aside-btn",onClick:B=>{B.stopPropagation(),A(e.id,e.
updatedAt)},children:"Handled"})]})]})}function We(e){return e.state==="done"?"done":e.state==="running"?"running":$o(e)??
"unblock"}function at({step:e,onPick:t}){return w("button",{type:"button",className:"ow-card-step",title:e.why??e.what,onClick:n=>{
n.stopPropagation(),t?.(e.what)},children:[r(xr,{className:"ow-icon ow-card-step-arrow","aria-hidden":"true"}),w("span",
{className:"ow-card-step-body",children:[r("span",{className:"ow-card-step-what",children:e.what}),e.why&&r("span",{className:"\
ow-card-step-why",children:e.why})]})]})}function jr({item:e,selected:t,onSelect:n,onSnooze:s,onHandled:a,onPickStep:u}){
let[l,p]=E(!1),S=e.state==="done"?[]:(e.nextSteps??[]).filter(g=>g.what?.trim()),x=e.initialIntent?.trim(),_=(e.progress??
[]).filter(g=>g.trim()),i=S.length>1||!!x||_.length>0;return w(Xe,{children:[w("div",{className:"ow-moreitem","data-sele\
cted":t?"true":void 0,"data-testid":`work-item-${e.id}`,children:[w("div",{className:"ow-moreitem-head",children:[Kt(e),
r("span",{className:"ow-moreitem-title ow-truncate",children:e.title})]}),e.summary&&r("p",{className:"ow-moreitem-summa\
ry",children:e.summary}),S[0]&&r(at,{step:S[0],onPick:u}),i&&w("button",{type:"button",className:"ow-goals-toggle","aria\
-expanded":l,onClick:()=>p(g=>!g),children:[r(ge,{className:"ow-icon","data-open":l?"true":void 0,"aria-hidden":"true"}),
l?"Show less":"Show more"]}),w("div",{className:"ow-row-aside",children:[r("button",{type:"button",className:"ow-aside-b\
tn ow-aside-btn--ref",onClick:()=>n(e),children:"Reference in chat"}),e.state==="needs-you"&&s&&r("button",{type:"button",
className:"ow-aside-btn",onClick:()=>s(e.id),children:"Later"}),e.state==="needs-you"&&a&&r("button",{type:"button",className:"\
ow-aside-btn",onClick:()=>a(e.id,e.updatedAt),children:"Already done"})]})]}),l&&w("div",{className:"ow-moreitem-detail",
children:[S.slice(1).map((g,h)=>r(at,{step:g,onPick:u},`${e.id}:${h+1}`)),x&&r(Te,{label:oe("card_asked_for"),children:r(
"blockquote",{className:"ow-detail-quote",children:x})}),_.length>0&&r(Te,{label:oe("card_where_it_stands"),children:r("\
ul",{className:"ow-detail-facts",children:_.map((g,h)=>r("li",{children:g},`${h}:${g}`))})})]})]})}function Gr({items:e,
doneTitles:t,selectedId:n,onSelect:s,onOpenSession:a,onAnswerPermission:u,onDecideApproval:l,permissionBusy:p,onRetry:S,
retryBusy:x,onPickStep:_,onSnooze:i,onHandled:g}){let[h,A]=E(!1),[C,G]=E(!1),f=[...e].sort((k,H)=>(H.lastTouchedTurn??0)-
(k.lastTouchedTurn??0)),b=f[0],P=f.slice(1),$=b.sessionKey,L=e.find(k=>k.state==="needs-you")??e.find(k=>k.state==="runn\
ing")??b,J=Lo(e),M=b.references.find(k=>k.kind==="session")?.label??b.provenance,K=Lt(J.lastActivityAt),F=b.sessionTurns?
`${b.sessionTurns} ${b.sessionTurns===1?"turn":"turns"}`:null,Q=[K,F].filter(Boolean),ee=[],B=new Set;for(let k of b.sessionChanges??
[])k.url&&!B.has(k.url)&&(B.add(k.url),ee.push(k));let we=(b.progress??[]).map(k=>k.trim()).filter(Boolean).map(k=>/[.!?]$/.
test(k)?k:`${k}.`).join(" "),$e=we?we.split(/(?<=[.!?])\s+/).filter(k=>k.trim()).slice(0,2).join(" "):"",me=b.state==="d\
one"?[]:(b.nextSteps??[]).filter(k=>k.what?.trim()),ke=b.initialIntent?.trim(),j=(b.progress??[]).filter(k=>k.trim()),_e=me.
length>1||!!ke||j.length>0||P.length>0,ne=n===b.id;return w(Xe,{children:[w("div",{className:"ow-sessioncard","data-sele\
cted":ne?"true":void 0,"data-testid":`work-item-${b.id}`,children:[w("div",{className:"ow-card-top",children:[Kt(L),w("s\
pan",{className:"ow-card-meta",children:[r("button",{type:"button",className:"ow-card-name",onClick:k=>{k.stopPropagation(),
a($)},children:M}),Q.map(k=>r("span",{className:"ow-card-metapart",children:k},k))]})]}),r("h3",{className:"ow-card-titl\
e",children:b.title}),ee.length>0&&r("div",{className:"ow-card-prs",children:ee.map(k=>w("a",{className:"ow-card-pr","da\
ta-status":k.status||void 0,href:k.url,target:"_blank",rel:"noopener noreferrer",onClick:H=>H.stopPropagation(),children:[
k.label,k.status&&w("span",{className:"ow-card-pr-status",children:[" \xB7 ",k.status]})]},k.id))}),$e&&r("p",{className:"\
ow-card-summary",children:$e}),me[0]&&r("div",{className:"ow-card-nextstep",children:r(Te,{label:"Suggested next step",children:r(
at,{step:me[0],onPick:_})})}),ne&&b.permissionId&&l&&r(Le,{children:r(on,{item:b,busy:!!p,onDecide:k=>l(b,k)})}),_e&&w("\
button",{type:"button",className:"ow-goals-toggle","aria-expanded":h,onClick:k=>{k.stopPropagation(),A(H=>!H)},children:[
r(ge,{className:"ow-icon","data-open":h?"true":void 0,"aria-hidden":"true"}),h?"Show less":"Show more"]}),w("div",{className:"\
ow-row-aside",children:[r("button",{type:"button",className:"ow-aside-btn ow-aside-btn--ref",onClick:()=>s(b),children:"\
Reference in chat"}),b.state==="needs-you"&&i&&r("button",{type:"button",className:"ow-aside-btn",onClick:()=>i(b.id),children:"\
Later"}),b.state==="needs-you"&&g&&r("button",{type:"button",className:"ow-aside-btn",onClick:()=>g(b.id,b.updatedAt),children:"\
Already done"})]})]}),h&&w("div",{className:"ow-card-expanded",children:[me.slice(1).map((k,H)=>r(at,{step:k,onPick:_},`${H+
1}:${k.what}`)),ke&&r(Te,{label:oe("card_asked_for"),children:r("blockquote",{className:"ow-detail-quote",children:ke})}),
j.length>0&&r(Te,{label:oe("card_where_it_stands"),children:r("ul",{className:"ow-detail-facts",children:j.map((k,H)=>r(
"li",{children:k},`${H}:${k}`))})}),P.length>0&&r("div",{className:"ow-card-morelabel",children:b.state==="needs-you"?"M\
ore that needs you":b.state==="running"?"More in progress":"More done"}),P.map(k=>r(jr,{item:k,selected:n===k.id,onSelect:s,
onSnooze:i,onHandled:g,onPickStep:_},k.id)),t&&t.length>0&&w("div",{className:"ow-lane ow-lane-done",children:[w("button",
{type:"button",className:"ow-goals-toggle","aria-expanded":C,onClick:()=>G(k=>!k),children:[r(ge,{className:"ow-icon","d\
ata-open":C?"true":void 0,"aria-hidden":"true"}),t.length," done"]}),C&&r("ul",{className:"ow-done-list",children:t.map(
k=>w("li",{className:"ow-row-goal-done",children:[r(kr,{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"\
ow-truncate",children:k})]},k))})]})]})]})}function Ze({title:e,items:t,selectedId:n,onSelect:s,onOpenSession:a,onAnswerPermission:u,
onDecideApproval:l,permissionBusy:p,onRetry:S,retryBusy:x,onStop:_,stopBusy:i,onPickStep:g,onSnooze:h,onHandled:A,footer:C,
collapsed:G,onToggleCollapsed:f,doneBySession:b,subtitle:P,hideHeader:$,emptyLabel:L}){let J=Do(t).sort((K,F)=>Math.max(
...F.items.map(Q=>Q.updatedAt))-Math.max(...K.items.map(Q=>Q.updatedAt))),M=K=>r("div",{className:`ow-block${K.header===
"session"?" ow-goalcard":""}`,"data-grouped":K.header?"true":void 0,"data-open":K.header==="session"?"true":void 0,children:K.
header==="session"&&K.sessionKey?r(Gr,{items:K.items,doneTitles:b?.[K.sessionKey],selectedId:n,onSelect:s,onOpenSession:a,
onAnswerPermission:u,onDecideApproval:l,permissionBusy:p,onRetry:S,retryBusy:x,onPickStep:g,onSnooze:h,onHandled:A}):K.items.
map(F=>r(Fr,{item:F,selected:n===F.id,whyRanked:F.state==="needs-you"&&F.action!=="resume"?At(Je(F),oe):void 0,onSelect:()=>s(
F),onOpenSession:a,onAnswerPermission:u,onDecideApproval:l,permissionBusy:p,onRetry:S,retryBusy:x,onStop:_,stopBusy:i,onPickStep:g,
onSnooze:h,onHandled:A},F.id))},K.key);return w("section",{className:"ow-section","aria-label":e,children:[$?null:f?w(Qe,
{onActivate:f,className:"ow-section-toggle",children:[r(Yo,{label:e,count:t.length,subtitle:P}),r(ge,{className:"ow-icon\
 ow-section-chevron","data-open":G?void 0:"true","aria-hidden":"true"})]}):r(Yo,{label:e,count:t.length,subtitle:P}),G?null:
r("div",{className:"ow-section-list",children:J.length===0?r("p",{className:"ow-section-empty",children:L}):J.map(M)}),C]})}
function Hr(e,t,n=[]){let s=Ro(t,oe),a=n.length?[`Noticed since you last spoke (${n.length}):`,...n.map(p=>`- ${p}`),"Me\
ntion these only if they matter to what the user asked."]:[];if(!e)return["Crew Manager context: workspace overview.",...s,
...a,"Answer the user about the state of their work. This is a conversation, not an action channel."].join(`
`);let u=e.references.map(p=>`${p.kind}: ${p.label} (${p.id})`).join(`
`),l=[e.stalledFor?`Silent for ${Re(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(p=>!!p);return[`Crew Manager context: ${e.title}`,...s,`Selected item: ${e.title}`,
`State: ${Lr[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...l.length>0?[`Why it is on the board:
${l.join(`
`)}`]:[],`References:
${u}`,...a,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(p=>!!p).join(`
`)}var Jo="crew-manager.panel-widths";function Ur(e,t){let n=e?.first_seen;if(!n)return[];let s=typeof t=="number"?t<=1e10?
t*1e3:t:t?Date.parse(t):NaN;if(!Number.isFinite(s))return[];let a=[];for(let l of e?.stalls??[]){let p=n[l.key];typeof p==
"number"&&(p*1e3<=s||a.push(l.reason?`${l.label} went quiet \u2014 ${l.reason}`:`${l.label} went quiet after ${Re(l.silent_secs)}`))}
for(let l of e?.error_loops??[]){let p=n[l.key];typeof p=="number"&&(p*1e3<=s||a.push(`${l.label} repeated the same ${l.
tool} failure ${l.repeats} times`))}let u=5;return a.length>u?[...a.slice(0,u),`and ${a.length-u} more`]:a}var pe={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function it(e,t,n,s,a){let u=Math.min(a,Math.max(n,t-
s));return Math.max(n,Math.min(u,e))}function Zo({side:e,containerRef:t,min:n,reserve:s,max:a,value:u,onChange:l,label:p}){
let S=(i,g)=>{let h=g.getBoundingClientRect(),A=e==="start"?i-h.left:h.right-i;return it(A,g.clientWidth,n,s,a)};return r(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":p,tabIndex:0,onPointerDown:i=>{
let g=t.current;if(!g)return;i.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let h=C=>l(S(C.clientX,g)),A=()=>{window.removeEventListener("pointermove",h),window.removeEventListener("pointeru\
p",A),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",h),window.addEventListener(
"pointerup",A)},onKeyDown:i=>{if(i.key!=="ArrowLeft"&&i.key!=="ArrowRight")return;let g=t.current;if(!g)return;i.preventDefault();
let h=(i.shiftKey?48:16)*(i.key==="ArrowRight"?1:-1),A=u??(e==="start"?g.clientWidth/2:Math.round(g.clientWidth*.3));l(it(
A+(e==="start"?h:-h),g.clientWidth,n,s,a))}})}function Yr(){let e=$r(),t=ue(e);t.current=e;let n=Er(),s=Pr(),[a,u]=E("al\
l"),[l,p]=E(()=>{let o=De(Mt,null);return o&&Ce.includes(o)?o:"work"}),[S,x]=E(()=>{let o=De(Bt,null),c=o&&Ce.includes(o)?
o:null,m=De(Mt,null),N=m&&Ce.includes(m)?m:"work";return c&&c!==N?c:Go.find(T=>T!==N)??null}),_=te(o=>{x(c=>{let m=c===o?
null:o;return Ae(Bt,m),m})},[]),[i,g]=E(null),[h,A]=E("session"),[C,G]=E(null),[f,b]=E(null),[P,$]=E({}),[L,J]=E("unknow\
n"),M=ue("unknown"),K=ue(new Map),[F,Q]=E({}),[ee,B]=E(null),[we,$e]=E({}),[me,ke]=E([]),[j,_e]=E(null),[ne,k]=E(null),[
H,d]=E(null),[v,R]=E(()=>De(Pt)),[W,ie]=E(()=>De(Ho)),z=ue(null),X=ue(null),[le,lt]=E(()=>De(Jo,{work:null,conductor:null}));
ce(()=>{Ae(Jo,le)},[le]),ce(()=>{let o=()=>lt(c=>{let m=X.current?.clientWidth??0,N=z.current?.clientWidth??0;return{work:c.
work==null||m===0?c.work:it(c.work,m,pe.workMin,pe.railReserve,1/0),conductor:c.conductor==null||N===0?c.conductor:it(c.
conductor,N,pe.conductorMin,pe.mainReserve,pe.conductorMax)}});return o(),window.addEventListener("resize",o),()=>window.
removeEventListener("resize",o)},[]);let[nn,rn]=E(!0),[Ot,qt]=E({}),[Ft,dt]=E([]),[ct,sn]=E([]),[an,ut]=E(!1),Ke=te(o=>{
if(o===l)return;let c=S===o?Go.find(m=>m!==o)??null:S;Ae(Mt,o),Ae(Bt,c),p(o),x(c)},[l,S]),ln=te((o,c)=>{o.dataTransfer.setData(
"text/x-crew-panel",c),o.dataTransfer.effectAllowed="move";let m=o.currentTarget.querySelector("summary");if(!m)return;let N=m.
getBoundingClientRect();o.dataTransfer.setDragImage(m,Math.min(Math.max(o.clientX-N.left,0),N.width),Math.min(Math.max(o.
clientY-N.top,0),N.height))},[]),dn=te(o=>{o.preventDefault(),ut(!1);let c=o.dataTransfer.getData("text/x-crew-panel");!c||
!Ce.includes(c)||Ke(c)},[Ke]),pt=se(()=>Ce.filter(o=>o!==l),[l]),cn=S&&S!==l?String(pt.indexOf(S)):"none",gt=o=>{let c=o===
l;return{className:"ow-card ow-stack-card",open:c||S===o,draggable:!0,"data-panel":o,"data-primary":c?"true":"false","da\
ta-rail-index":c?void 0:pt.indexOf(o),"data-dragover":c&&an?"true":void 0,onDragStart:m=>ln(m,o),onDragOver:c?m=>{m.preventDefault(),
ut(!0)}:void 0,onDragLeave:c?()=>ut(!1):void 0,onDrop:c?dn:void 0}},jt=ue(!0),[un,Gt]=E(!0),[Ht,wt]=E(null),[mt,pn]=E(null),
[Oe,Ut]=E(!1),[gn,wn]=E(!1),[Yt,he]=E(null),U=ue(!0),qe=ue(0),ht=ue(!1);ce(()=>(U.current=!0,()=>{U.current=!1,qe.current+=
1}),[]);let D=te(async()=>{let o=++qe.current,c=t.current;try{let[m,N,T,de,ot,nt,O,xe]=await Promise.all([c.get("/api/ch\
at/slots"),c.get("/api/approvals"),c.get("/api/spawn"),c.get("/api/workflows/runs"),c.get("/api/crons"),c.get("/api/arti\
facts"),c.get("/api/autonudge").catch(()=>({loops:[]})),c.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!U.
current||o!==qe.current)return;b({slots:Array.isArray(m)?m:[],approvals:Array.isArray(N)?N:[],agents:Array.isArray(T.agents)?
T.agents:[],workflows:Array.isArray(de.runs)?de.runs:[],crons:Array.isArray(ot.jobs)?ot.jobs:[],artifacts:Array.isArray(
nt.artifacts)?nt.artifacts:[],loops:Array.isArray(O?.loops)?O.loops:[]}),sn(Array.isArray(xe?.runs)?xe.runs:[]),wt(null),
pn(Date.now())}catch(m){U.current&&o===qe.current&&wt(m instanceof Error?m:new Error("Unable to load Crew Manager source\
s"))}finally{U.current&&o===qe.current&&Gt(!1)}},[]);ce(()=>{D();let o=window.setInterval(()=>{D()},zr);return()=>window.
clearInterval(o)},[D]);let mn=()=>{Gt(!0),wt(null),D()},ft=te(()=>{Oe||(Ut(!0),D().finally(()=>{U.current&&Ut(!1)}))},[D,
Oe]);ce(()=>{if(!f||M.current==="unsupported"||M.current==="disabled")return;let o=Ko(f.slots,Ie,Date.now(),m=>K.current.
get(m.key)===Tt(m));if(o.length===0)return;let c=!1;return(async()=>{let{summaries:m,support:N}=await Oo(o,T=>t.current.
get(T));if(!(c||!U.current)&&(M.current=N,J(N),N==="available")){for(let T of o)m[T.key]&&K.current.set(T.key,Tt(T));$(T=>({
...T,...m}))}})(),()=>{c=!0}},[f]),ce(()=>{if(!f||!jt.current)return;let o=!1;return(async()=>{try{let c=await t.current.
get("/api/apps/crew-manager/stalls");if(o||!U.current)return;let m={};for(let T of c?.stalls??[])T?.key&&(m[T.key]=T);Q(
m);let N={};for(let T of c?.error_loops??[])T?.key&&(N[T.key]=T);qt(N),B(c??null);try{let T=await t.current.get("/api/ap\
ps/crew-manager/assigned");!o&&U.current&&dt(T?.available&&Array.isArray(T.rows)?T.rows:[])}catch{U.current&&dt([])}}catch{
jt.current=!1,U.current&&(Q({}),qt({}),B(null),dt([]))}})(),()=>{o=!0}},[f]);let Vt=se(()=>To(zo({...f??{slots:[],approvals:[],
agents:[],workflows:[],crons:[],artifacts:[],loops:[]},assigned:Ft},oe,P,F,Ot),we),[f,P,F,Ot,we,Ft]),et=se(()=>Po(Vt,v,W),
[Vt,v,W]),q=se(()=>et.items.filter(o=>Bo(o)),[et]),Fe=se(()=>It(q),[q]),Jt=se(()=>q.filter(o=>o.state==="needs-you"&&We(
o)==="followup").length,[q]),hn={...Fe,"needs-you":Math.max(0,(Fe["needs-you"]??0)-Jt),"follow-up":Jt},vt=se(()=>{let o={};
for(let c of q){if(c.state!=="done"||!c.sessionKey)continue;let m=o[c.sessionKey];m?m.push(c.title):o[c.sessionKey]=[c.title]}
return o},[q]),be=se(()=>q.find(o=>o.id===i)??null,[q,i]),je=se(()=>a==="all"?q:a==="follow-up"?q.filter(o=>o.state==="n\
eeds-you"&&We(o)==="followup"):a==="needs-you"?q.filter(o=>o.state==="needs-you"&&We(o)!=="followup"):q.filter(o=>o.state===
a),[a,q]);ce(()=>s(Fe["needs-you"]),[Fe,s]),ce(()=>{i&&!q.some(o=>o.id===i)&&g(null)},[q,i]);let Se=f?.slots.find(o=>o.key===
Ie),fn=!!(Se||gn),Zt=ue(!1);ce(()=>{let o=Se;if(!o||Zt.current||o.agent)return;Zt.current=!0;let c=t.current;c.get("/api\
/apps/crew-manager/conductor-agent").then(m=>m?.available&&m.agent?m.agent:null).catch(()=>null).then(m=>{if(!(!m||!U.current))
return c.post(`/api/chat/slots/${encodeURIComponent(Ie)}/agent`,{agent:m}).then(()=>{D()})}).catch(()=>{})},[Se,D]),ce(()=>{
!f||Se||ht.current||(ht.current=!0,e.get("/api/apps/crew-manager/conductor-agent").then(o=>o?.available&&o.agent?o.agent:
null).catch(()=>null).then(o=>e.post("/api/chat/slots",{name:Ie,title:"Conductor",...o?{agent:o}:{}})).then(()=>{U.current&&
(wn(!0),D())}).catch(o=>{U.current&&(ht.current=!1,he(o instanceof Error?`Conductor session could not be created: ${o.message}`:
"Conductor session could not be created"))}))},[e,Se,D,f]);let Qt=se(()=>vo(f?.approvals??[],me,o=>q.find(c=>c.sessionKey===
o)?.title??f?.slots?.find(c=>c.key===o)?.title??o),[q,f,me]),Ee=be&&!be.permissionId?be:null,bt=se(()=>{let o=(f?.loops??
[]).filter(m=>m&&m.active!==!1&&m.slot_key);if(o.length===0)return[];let c=new Map;for(let m of q)for(let N of m.references)
N.kind!=="session"||!N.id||N.label&&!c.has(N.id)&&c.set(N.id,N.label);return o.map(m=>{let N=Number(m.cycle_count)||0,T=Number(
m.max_cycles)||0;return{key:m.slot_key,title:c.get(m.slot_key)??m.slot_key,progress:T>0?`${N}/${T}`:`${N} ${N===1?"cycle":
"cycles"}`,remaining:T>0?Math.max(0,T-N):null,instruction:(m.message??"").replace(/\s+/g," ").trim(),lastFire:Z(m.last_fire_ts)}})},
[f,q]),Pe=se(()=>{let o=new Date;o.setHours(0,0,0,0);let c=o.getTime(),m=c+864e5,N=f?.crons??[],T=new Map;for(let O of ct){
let xe=Z(O.started_at);if(!O.job_id||xe<c||xe>=m)continue;let fe=T.get(O.job_id)??{count:0,failed:0,last:0};fe.count+=1,
O.status&&O.status!=="success"&&(fe.failed+=1),fe.last=Math.max(fe.last,xe),T.set(O.job_id,fe)}let de=N.map(O=>{let xe=T.
get(O.id),fe=Z(O.next_run_ts),_n=fe>=c&&fe<m;return{job:O,ran:xe,next:fe,dueToday:_n}}).filter(O=>O.ran||O.dueToday||O.job.
is_running),ot=de.filter(O=>O.ran&&O.ran.failed===0).length,nt=de.filter(O=>O.ran&&O.ran.failed>0).length;return{rows:de,
done:ot,failed:nt,total:de.length,historyKnown:ct.length>0}},[f,ct]),Be=te(async(o,c)=>{if(!j){_e(o),he(null);try{await t.
current.post(`/api/approvals/${encodeURIComponent(o)}/${c?"approve":"reject"}`,{}),D()}catch(m){he(m instanceof Error?`C\
ould not answer that request: ${m.message}`:"Could not answer that request"),D()}finally{U.current&&_e(null)}}},[D,j]),Ge=te(
async(o,c)=>{if(!(j||!o.permissionId||!o.sessionKey)){_e(o.permissionId),he(null);try{await t.current.post(`/api/chat/sl\
ots/${encodeURIComponent(o.sessionKey)}/approve`,{action:c,request_id:o.permissionId}),D()}catch(m){he(m instanceof Error?
`Could not answer that request: ${m.message}`:"Could not answer that request"),D()}finally{U.current&&_e(null)}}},[D,j]),
Xt=te(o=>{R(c=>{let m=Object.fromEntries(Object.entries(c).filter(([,N])=>N>Date.now()));return m[o]=Date.now()+Eo,Ae(Pt,
m),m}),g(null)},[]),eo=te((o,c)=>{ie(m=>{let N={...m,[o]:c};return Ae(Ho,N),N}),g(null)},[]),vn=te(()=>{R({}),Ae(Pt,{})},
[]),bn=te(()=>{rn(o=>!o)},[]),He=te(async o=>{if(!ne){k(o),he(null);try{await t.current.post(o,{}),D()}catch(c){he(c instanceof
Error?`Could not re-run it: ${c.message}`:"Could not re-run it"),D()}finally{U.current&&k(null)}}},[D,ne]),Ue=te(async o=>{
if(!H){d(o),he(null);try{await t.current.del(o),G("Stopped the monitor loop. Re-arming it is done from the session itsel\
f."),D()}catch(c){let m=c instanceof Error?c.message:"";/404|not found/i.test(m)?G("That loop had already stopped."):he(
m?`Could not stop it: ${m}`:"Could not stop it"),D()}finally{U.current&&d(null)}}},[D,H]),Me=te(async o=>{let c=be&&!be.
permissionId?be:null;if(h==="session"&&c?.sessionKey){let m=c.sessionKey;if(await t.current.post("/api/chat",{message:o,
slot:m}).catch(N=>{if(!(N instanceof SyntaxError))throw N}),!U.current)return;$e(N=>({...N,[c.id]:Date.now()})),ke(N=>N.
includes(m)?N:[...N,m]),G(`Sent new instructions to ${c.title}`),g(null),D();return}await t.current.post(`/api/chat/slot\
s/${encodeURIComponent(Ie)}/context`,{content:Hr(be,q,Ur(ee,Se?.last_ts)),source:"crew-manager",ephemeral:!0}).catch(()=>{}),
await t.current.post("/api/chat",{message:o,slot:Ie}).catch(m=>{if(!(m instanceof SyntaxError))throw m})},[be,q,D,h,ee,Se]),
tt={"needs-you":je.filter(o=>o.state==="needs-you"),running:je.filter(o=>o.state==="running"),done:je.filter(o=>o.state===
"done")},xn=tt["needs-you"].filter(o=>We(o)!=="followup"),yn=tt["needs-you"].filter(o=>We(o)==="followup"),Ye=o=>n(`/cha\
t?sid=${encodeURIComponent(o)}`),Ve=o=>{g(c=>c===o.id?null:o.id),G(null),A("session")},kn=Ee?w("div",{className:"ow-quot\
e ow-quote-docked",children:[w("div",{className:"ow-quote-body",children:[Ee.sessionKey?r("button",{type:"button",className:"\
ow-scope-toggle","aria-pressed":h==="conductor","aria-label":h==="session"?"Sending to this session. Activate to send to\
 the Conductor instead.":"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>A(o=>o==="ses\
sion"?"conductor":"session"),children:h==="session"?"Instructing":"To Conductor"}):r("span",{className:"ow-eyebrow",children:"\
Quoted"}),r("span",{className:"ow-quote-title",title:Ee.title,children:Ee.title})]}),r(ae,{className:"ow-quote-clear","a\
ria-label":"Remove the quoted work item",onClick:()=>{g(null),G(null)},children:"Clear"})]}):null;return w("div",{className:"\
ow-root","data-crew-manager-shell":"quiet-split",children:[r("style",{children:qo}),r("div",{className:"ow-titlebar",children:r(
Mr,{title:w("span",{className:"ow-title-line",children:["Crew Manager",r("span",{className:"ow-beta","aria-label":"Beta \
preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still running, and what finished recently."})}),
r("div",{className:"ow-body",children:w("div",{className:"ow-layout",ref:z,style:le.conductor!=null?{"--ow-conductor-w":`${le.
conductor}px`}:void 0,children:[w("div",{className:"ow-main","data-open-row":cn,ref:X,style:le.work!=null?{"--ow-work-w":`${le.
work}px`}:void 0,children:[w("details",{...gt("work"),"aria-label":"Work",children:[w("summary",{onClick:o=>{o.preventDefault(),
l!=="work"&&_("work")},children:[w("span",{className:"ow-stack-title",children:[r(ge,{className:"ow-icon ow-stack-chevro\
n"}),r(Dt,{className:"ow-icon"}),tn.work,r(ve,{variant:"muted",children:Fe.all})]}),r("span",{className:"ow-stack-action\
s",children:l==="work"?r(Et,{lastUpdated:mt,refreshing:Oe,onRefresh:ft}):r($t,{id:"work",onPromote:Ke})})]}),w("div",{className:"\
ow-worksplit",children:[r("nav",{className:"ow-railnav",role:"group","aria-label":"Filter by state",children:Object.keys(
zt).map(o=>w(ae,{onClick:()=>u(o),"aria-pressed":a===o,"data-selected":a===o,className:"ow-filter ow-railitem",children:[
r("span",{className:"ow-railitem-label",children:zt[o]}),r("span",{className:"ow-count",children:hn[o]})]},o))}),r("main",
{className:"ow-work",children:w("div",{className:"ow-work-inner",children:[r("section",{className:"ow-cond-inline","aria\
-label":"Automation",children:r(xt,{api:e,view:"goals"})}),un?r(Fo,{rows:7}):Ht&&!f?r(jo,{icon:r(Qo,{className:"ow-icon"}),
title:"Crew Manager could not load the work view",subtitle:Ht.message,action:r(ae,{onClick:mn,children:"Try again"})}):je.
length===0?r(jo,{icon:r(Ir,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter to see sessions i\
n another state."}):a==="all"?w(Xe,{children:[r(Ze,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",
items:xn,doneBySession:vt,selectedId:i,onSelect:Ve,onSnooze:Xt,onHandled:eo,footer:et.snoozedCount>0?w("button",{type:"b\
utton",className:"ow-aside-note",onClick:vn,children:[et.snoozedCount," set aside for later \u2014 bring back"]}):void 0,
onOpenSession:Ye,onAnswerPermission:(o,c)=>{Be(o,c)},onDecideApproval:(o,c)=>{Ge(o,c)},permissionBusy:j!==null,onRetry:o=>{
He(o)},retryBusy:ne!==null,onStop:o=>{Ue(o)},stopBusy:H!==null,onPickStep:o=>{Me(o)},emptyLabel:"Nothing needs your inpu\
t right now."}),r(Ze,{title:"Follow up",subtitle:"Pick back up where a session left off",items:yn,doneBySession:vt,selectedId:i,
onSelect:Ve,onSnooze:Xt,onHandled:eo,onOpenSession:Ye,onAnswerPermission:(o,c)=>{Be(o,c)},onDecideApproval:(o,c)=>{Ge(o,
c)},permissionBusy:j!==null,onRetry:o=>{He(o)},retryBusy:ne!==null,onStop:o=>{Ue(o)},stopBusy:H!==null,onPickStep:o=>{Me(
o)},emptyLabel:"Nothing to follow up on."}),r(Ze,{title:"In progress",subtitle:"Being worked on right now",items:tt.running,
doneBySession:vt,selectedId:i,onSelect:Ve,onOpenSession:Ye,onAnswerPermission:(o,c)=>{Be(o,c)},onDecideApproval:(o,c)=>{
Ge(o,c)},permissionBusy:j!==null,onRetry:o=>{He(o)},retryBusy:ne!==null,onStop:o=>{Ue(o)},stopBusy:H!==null,onPickStep:o=>{
Me(o)},emptyLabel:"Nothing is in progress right now."}),r(Ze,{title:"Done recently",subtitle:"Finished in the last few d\
ays",items:tt.done,selectedId:i,onSelect:Ve,collapsed:nn,onToggleCollapsed:bn,onOpenSession:Ye,onAnswerPermission:(o,c)=>{
Be(o,c)},onDecideApproval:(o,c)=>{Ge(o,c)},permissionBusy:j!==null,onRetry:o=>{He(o)},retryBusy:ne!==null,onStop:o=>{Ue(
o)},stopBusy:H!==null,onPickStep:o=>{Me(o)},emptyLabel:"No recent completed work."})]}):r(Ze,{title:zt[a],items:je,selectedId:i,
onSelect:Ve,onOpenSession:Ye,onAnswerPermission:(o,c)=>{Be(o,c)},onDecideApproval:(o,c)=>{Ge(o,c)},permissionBusy:j!==null,
onRetry:o=>{He(o)},retryBusy:ne!==null,onStop:o=>{Ue(o)},stopBusy:H!==null,onPickStep:o=>{Me(o)},emptyLabel:"No matching\
 work"})]})})]})]}),Ce.includes("loops")&&w("details",{...gt("loops"),children:[w("summary",{onClick:o=>{o.preventDefault(),
l!=="loops"&&_("loops")},children:[w("span",{className:"ow-stack-title",children:[r(ge,{className:"ow-icon ow-stack-chev\
ron"}),r(en,{className:"ow-icon"}),"Loops"]}),w("span",{className:"ow-stack-actions",children:[r(ve,{variant:"muted",children:bt.
length}),l==="loops"?r(Et,{lastUpdated:mt,refreshing:Oe,onRefresh:ft}):r($t,{id:"loops",onPromote:Ke})]})]}),r("p",{className:"\
ow-stack-sub",children:"Sessions repeating a goal until it is done"}),r("div",{className:"ow-stack-body",children:bt.length===
0?r("p",{className:"ow-stack-empty",children:"No loop is running right now."}):bt.map(o=>{let c=Lt(o.lastFire),m=[c&&`la\
st tick ${c}`,o.remaining!==null&&`${o.remaining} remaining`].filter(Boolean).join(" \xB7 ");return w("div",{className:"\
ow-mini",children:[r("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),w("div",{children:[w("div",{className:"\
ow-mini-title",children:[o.title,r("span",{className:"ow-mini-chip",children:o.progress})]}),o.instruction&&r("div",{className:"\
ow-mini-desc",title:o.instruction,children:o.instruction}),m&&r("div",{className:"ow-mini-when",children:m})]}),r(ve,{variant:"\
ok",children:"Active"})]},o.key)})})]}),Ce.includes("schedule")&&w("details",{...gt("schedule"),children:[w("summary",{onClick:o=>{
o.preventDefault(),l!=="schedule"&&_("schedule")},children:[w("span",{className:"ow-stack-title",children:[r(ge,{className:"\
ow-icon ow-stack-chevron"}),r(_r,{className:"ow-icon"}),"Scheduled tasks"]}),w("span",{className:"ow-stack-actions",children:[
w(ve,{variant:Pe.failed>0?"err":"muted",children:[Pe.done,"/",Pe.total," today"]}),l==="schedule"?r(Et,{lastUpdated:mt,refreshing:Oe,
onRefresh:ft}):r($t,{id:"schedule",onPromote:Ke})]})]}),r("p",{className:"ow-stack-sub",children:Pe.historyKnown?"Today'\
s runs only \u2014 jobs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be\
 low"}),r("div",{className:"ow-stack-body",children:Pe.rows.length===0?r("p",{className:"ow-stack-empty",children:"Nothi\
ng is scheduled for today."}):Pe.rows.map(({job:o,ran:c,next:m,dueToday:N})=>{let T=!!(c&&c.failed>0),de=[c&&`ran today ${Uo(
c.last)}${c.count>1?` (${c.count}x)`:""}`,N&&m?`next ${Uo(m)}`:null].filter(Boolean).join(" \xB7 ");return w("div",{className:"\
ow-mini",children:[r("span",{className:"ow-mini-rail",style:{background:T?"var(--danger)":o.enabled===!1?"var(--muted)":
"var(--warn)"}}),w("div",{children:[r("div",{className:"ow-mini-title",children:o.name}),o.schedule&&w("div",{className:"\
ow-mini-desc",children:[o.schedule,o.cron_expr&&r("span",{className:"ow-mini-chip",children:o.cron_expr})]}),de&&r("div",
{className:"ow-mini-when",children:de})]}),o.is_running?r(ve,{variant:"aim",children:"Running"}):T?r(ve,{variant:"err",children:"\
Failed"}):o.enabled===!1?r(ve,{variant:"muted",children:"Paused"}):c?r(ve,{variant:"ok",children:"Success"}):r(ve,{variant:"\
warn",children:"Pending"})]},o.id)})})]}),pt.length>0&&r(Zo,{side:"start",containerRef:X,min:pe.workMin,reserve:pe.railReserve,
max:1/0,value:le.work,onChange:o=>lt(c=>({...c,work:o})),label:"Resize the work column"})]}),r(Zo,{side:"end",containerRef:z,
min:pe.conductorMin,reserve:pe.mainReserve,max:pe.conductorMax,value:le.conductor,onChange:o=>lt(c=>({...c,conductor:o})),
label:"Resize the Conductor panel"}),w("aside",{className:"ow-conductor","aria-label":"Conductor",children:[r("div",{className:"\
ow-conductor-header",children:w("div",{className:"ow-conductor-title",children:[r("h2",{children:"Conductor"}),!Ee&&r("s\
pan",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),w("details",{className:"ow-cond-shel\
l",children:[w("summary",{className:"ow-cond-summary",children:[r(ge,{className:"ow-icon ow-stack-chevron"}),"Conductor \
events"]}),r(xt,{api:e,view:"events"})]}),r("div",{className:"ow-chat",children:fn?w("div",{className:"ow-chat-panel",children:[
Qt.length>0&&r("div",{className:"ow-permissions",role:"alert",children:Qt.map(o=>r(Or,{tool:o.tool,purpose:o.purpose,where:o.
sessionLabel,busy:j!==null,onAnswer:c=>{Be(o.id,c)}},o.id))}),C&&w("div",{className:"ow-conductor-receipt",role:"status",
children:[r(Xo,{className:"ow-icon"}),C]}),Yt&&r("div",{className:"ow-chat-error",role:"alert",children:Yt}),r("div",{className:"\
ow-embed",children:r(Br,{slotKey:Ie,frameless:!0,startAtBottom:!0,slotControls:!0,placeholder:Ee?.sessionKey&&h==="sessi\
on"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:Me,aboveComposer:kn})})]}):r("div",{className:"\
ow-chat-loading",children:r(Fo,{rows:4})})})]})]})})]})}export{Yr as default,Ur as noticedSinceLastTurn};
