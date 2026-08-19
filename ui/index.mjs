import{Fragment as Xn,useCallback as O,useEffect as V,useMemo as j,useRef as le,useState as S}from"react";import{AlertTriangle as mo,
Bot as Ns,Check as wo,ChevronRight as ne,Check as ho,Clock as bo,Package as Rs,ExternalLink as jt,MessageSquare as Ut,Shield as Is,
Waves as vo,Search as Cs,Tag as Ws,Users as mt,Zap as As}from"lucide-react";import{useAppApi as Bs,useNavigate as Ks,useNavBadge as $s,
ChatEmbed as Ps}from"@kirocrew/app-sdk";import{Badge as Y,Btn as G,ContentSkeleton as Qn,EmptyState as Zn,Input as Ms,PageHeader as Ls}from"@kirocrew/app-sdk/ui";function De(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),o=t%
60;return o===0?`${n} hour${n===1?"":"s"}`:`${n}h ${o}m`}function xn(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function Kt(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function kn(e,t,n){let o=new Set(t.filter(Boolean));if(o.size===0)return[];
let r=new Set,l=[];for(let d of e){let c=d.slot;!c||!o.has(c)||!d.id||r.has(d.id)||(r.add(d.id),l.push({id:d.id,sessionKey:c,
sessionLabel:n(c),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return l}var dn={"needs-you":0,running:1,done:2};function z(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function zo(e,t){
if(e.paused)return"";let n=z(e.next_run_ts);if(!n)return"";let o=Math.round((n-t)/1e3);return o<=0?"":De(o)}var cn=72;function Ce(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let r=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(r.length<=cn)return r;let l=r.slice(0,cn),d=l.lastIndexOf(" ");return`${(d>24?l.slice(0,d):l).trim()}\u2026`}
function We(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var Oo=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
Go=/^\((?:code|diff|widget|image)\)$/,Do=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
qo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,Fo=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
jo=/[?？]["'”’)\]]*$/;function _n(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||Go.test(t)||Oo.test(
t)?null:t}function $t(e){if(!e.waiting_for_input)return null;let t=_n(e);return!t||Do.test(t)||qo.test(t)?null:Fo.test(t)||
jo.test(t)?t:null}function un(e){return e.pending_approval||$t(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":We(e)?"needs-you":"done"}function Uo(e,t){if(e.pending_approval)return t("approval_waiting");let n=$t(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):We(e)?t("linked_change_issue"):_n(e)??t("recent_w\
ork_ready"))}function It(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function Ho(e){return e.pending_approval?"review-approval":$t(e)?"reply":"open"}function Vo(e,t){
let n=(e.source_links??[]).map(o=>({kind:o.kind==="issue"?"issue":"change",id:o.url,label:o.kind==="issue"?`issue #${o.number}`:
`${o.provider} #${o.number}`,url:o.url,sessionKey:e.key,status:xn(o)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:Uo(e,t),state:un(e),moving:un(e)==="running"||void 0,issue:We(e),updatedAt:z(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:It(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:We(e)||void 0,action:Ho(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...n]}}function Pt(e,t){e.references.
some(n=>n.kind===t.kind&&n.id===t.id)||e.references.push(t)}function Sn(e){return(e.source||"").toLowerCase()==="subagen\
t"}function Yo(e,t,n){let o=Sn(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,z(t.ts)),e.summary=n(o?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=o?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,e.permissionInput=t.tool_input,Pt(e,{kind:"approval",id:t.id,label:t.
tool||t.source||n("approval"),sessionKey:t.slot||e.sessionKey})}function Jo(e,t,n){e.updatedAt=Math.max(e.updatedAt,z(t.
started)),e.issue||=!!(t.done&&(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs\
-you"&&(e.summary=n("agent_failed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progre\
ss")),Pt(e,{kind:"agent",id:t.id,label:t.agent||n("agent"),sessionKey:t.parent||e.sessionKey})}function Xo(e,t,n){e.issue||=
t.status==="failed",t.status==="running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="nee\
ds-you"&&(e.summary=n("workflow_failed",{name:t.name})),Pt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.
session_key||e.sessionKey})}function Qo(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"\
needs-you";case"done":case"dropped":return"done";case"in-progress":return"running";default:return null}}function Zo(e,t,n){
return!(t.running||t.subagents_running||t.orchestrating)?!1:e===n}function es(e){let t=null,n=-1;for(let o of e){let r=o.
last_touched_turn??0;r>n&&(n=r,t=o)}return t}function ts(e,t){let n=e.next_steps?.find(r=>r.what?.trim())?.what?.trim();if(n)return n;let o=[...e.progress??[]].reverse().
find(r=>r.trim());return o?o.trim():e.initial_intent?.trim()||t("work_in_progress")}var ns=3;function os(e,t,n){if(!t?.enabled)
return[];let o=t.intents??[];if(o.length===0)return[];let r=(e.source_links??[]).map(i=>({kind:i.kind==="issue"?"issue":
"change",id:i.url,label:i.kind==="issue"?`issue #${i.number}`:`${i.provider} #${i.number}`,url:i.url,sessionKey:e.key,status:xn(
i)})),l=[],d=es(o),g=!!(e.running||e.subagents_running||e.orchestrating)?[]:o.filter(i=>i.state==="in-progress");g.forEach(
i=>{let m=o.indexOf(i),v=(i.next_steps??[]).filter(W=>W.what?.trim());l.push({id:`unattended:${e.key}:${m}`,title:Ce(i.title,
e.title||n("untitled_work")),summary:v[0]?.what?.trim()||n("no_next_step"),state:"needs-you",issue:We(e),updatedAt:z(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:It(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:We(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.
key},...r],nextSteps:v,progress:(i.progress??[]).filter(W=>W.trim()),stale:!!t.stale,lastTouchedTurn:i.last_touched_turn??
0})}),o.forEach((i,m)=>{if(g.includes(i))return;let v=Qo(i,e);if(!v)return;let W=(i.next_steps??[]).filter(k=>k.what?.trim());
l.push({id:`intent:${e.key}:${m}`,title:Ce(i.title,e.title||n("untitled_work")),summary:ts(i,n),state:v,issue:!1,updatedAt:z(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:It(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:We(
e)||void 0,unverified:i.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untit\
led_work"),sessionKey:e.key},...r],nextSteps:W,progress:(i.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:i.
last_touched_turn??0,moving:Zo(i,e,d)||void 0})});let f=l.filter(i=>i.state==="needs-you"),y=l.filter(i=>i.state!=="need\
s-you").sort((i,m)=>(m.lastTouchedTurn??0)-(i.lastTouchedTurn??0));return[...f,...y].slice(0,Math.max(ns,f.length))}var Nn=new Set(
["crew-manager-conductor","overwatch-conductor"]),ss={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},rs=3;function as(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var ct=5;function Rn(e,t,n=Date.now()){let o=Mt(e),r=Pn(
e.filter(d=>d.state==="needs-you"),n),l=[`Fleet: ${o["needs-you"]} waiting on the user, ${o.running} in progress, ${o.done}\
 finished recently.`];return r.length===0?(l.push("Nothing is waiting on the user."),l):(l.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(ct,r.length)}):`),r.slice(0,ct).forEach((d,c)=>{let g=je(be(d,n),t),f=d.sessionKey?
` [session ${d.sessionKey}]`:"";l.push(`${c+1}. ${d.title} \u2014 ${d.summary} (${g})${f}`)}),r.length>ct&&l.push(`\u2026and ${r.
length-ct} more waiting.`),l)}var Ae=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),pn=.6,gn=2,In=new Set;function Ct(e){return[...new Set(e.toLowerCase().replace(
/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(t=>t.length>2&&!Ae.has(t)))]}function ut(e,t){let n=Ct(e),o=Ct(t);if(n.length<
gn||o.length<gn)return 0;let r=n.length<=o.length?n:o,l=new Set(n.length<=o.length?o:n);return r.filter(c=>l.has(c)).length/
r.length}function fn(e){return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function mn(e){return e.
references.filter(t=>t.kind==="artifact").map(t=>t.id)}function wn(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}
var is=new Set(["pull request","pull requests","status update","work in progress","code review","follow up","next step",
"next steps","action item","action items","kiro crew","in progress","needs you"]);function qe(e){let t=new Set,n=e.match(
/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??[];for(let o of n){let r=o.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean).map(l=>l.length>3&&l.endsWith("s")&&!l.endsWith("ss")?l.slice(0,-1):l);for(;r.length&&
Ae.has(r[0]);)r.shift();for(;r.length&&Ae.has(r[r.length-1]);)r.pop();if(!(r.length<2))for(let l=r.length;l>=2;l-=1)for(let d=0;d+
l<=r.length;d+=1){let c=r.slice(d,d+l).join(" ");is.has(c)||t.add(c)}}return[...t]}function Cn(e){let t=new Set;if(e.length<
ls)return t;let n=new Map;for(let o of e)for(let r of qe(o.title))n.set(r,(n.get(r)??0)+1);for(let[o,r]of n)r/e.length>=
ds&&t.add(o);return t}var ls=4,ds=.75;function Fe(e,t,n=In){if(fn(e).find(d=>fn(t).includes(d)))return"same_change";if(mn(
e).find(d=>mn(t).includes(d)))return"same_artifact";let l=qe(t.title).filter(d=>!n.has(d));if(qe(e.title).some(d=>l.includes(
d)))return"same_deliverable";if(ut(e.title,t.title)>=pn)return"same_topic";for(let d of wn(e))for(let c of wn(t))if(ut(d,
c)>=pn)return"same_step";return null}function Wn(e,t){return e.parentId===t.id||t.parentId===e.id?"spawned":hn(e).includes(
t.id)||hn(t).includes(e.id)?"references":null}function hn(e){let t=[];for(let n of e.references)n.kind==="artifact"?t.push(
`artifact:${n.id}`):n.kind==="workflow"?t.push(`workflow:${n.id}`):n.kind==="agent"?t.push(`agent:${n.id}`):n.kind==="mo\
nitor"&&t.push(`monitor:${n.id}`,`loop:${n.id}`);return t.filter(n=>n!==e.id)}var nt={merged:[],split:[]};function pt(e){
return`${e.sessionKey??e.id}|${Ct(e.title).join(" ")}`}function he(e,t){return[pt(e),pt(t)].sort().join("")}function cs(e,t=nt){
let n=e.filter(r=>r.state!=="done"&&r.sessionKey).sort((r,l)=>(r.updatedAt||0)-(l.updatedAt||0)),o=Cn(n);for(let r=1;r<n.
length;r+=1){let l=n[r];for(let d=0;d<r;d+=1){let c=n[d];if(c.sessionKey===l.sessionKey||t.split.includes(he(l,c)))continue;
let g=Fe(l,c,o);if(g){l.duplicateOf={sessionKey:c.sessionKey,title:c.title,because:g};break}}}us(n,t,o)}var Rt=3,gt=["sa\
me_change","same_artifact","same_deliverable","same_topic","same_step"];function us(e,t,n=In){for(let o of e){let r=[],l=new Set;
for(let d of e){let c=d.sessionKey;if(c===o.sessionKey||l.has(c)||t.split.includes(he(o,d)))continue;let g=Fe(o,d,n);g&&
(l.add(c),r.push({sessionKey:c,title:d.title,because:g}))}r.length!==0&&(r.sort((d,c)=>gt.indexOf(d.because)-gt.indexOf(
c.because)),o.relatedSessions=r.slice(0,Rt),r.length>Rt&&(o.relatedMore=r.length-Rt))}}var ps=3e4;function An(e,t,n=Date.
now()){return Object.keys(t).length===0?e:e.map(o=>{let r=t[o.id];return!r||n-r>ps||o.state==="running"?o:{...o,state:"r\
unning",moving:!0,instructed:!0}})}function be(e,t=Date.now()){let n=[],o=(l,d,c=1)=>{n.push({signal:l,weight:ss[l]*c,values:d})};
e.approvalKind==="subagent"?o("subagent_gate"):e.approvalKind==="tool"&&o("approval_owed"),e.action==="reply"&&o("input_\
requested"),e.unverified&&o("unverified_completion"),e.loopRepeats&&o("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&
o("run_failed"),e.stalledFor&&o("stalled",{duration:De(e.stalledFor)}),e.changeBlocked&&o("change_blocked"),e.unattendedGoals&&
o("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&o("queued_behind",{count:String(e.queuedBehind)},Math.
min(e.queuedBehind,3));let r=as(e,t);return r>0&&o("waiting_a_while",{hours:String(r)},Math.min(r,rs)),n.sort((l,d)=>d.weight-
l.weight),{score:n.reduce((l,d)=>l+d.weight,0),signals:n}}var gs={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"\
unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",change_blocked:"unb\
lock",nobody_on_it:"followup"};function ft(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let n of be(e,t).signals){
let o=gs[n.signal];if(o)return o}return null}var Bn=14400*1e3;function Kn(e,t,n,o=Date.now()){let r=0,l=[];for(let d of e){
if(d.state!=="needs-you"){l.push(d);continue}let c=t[d.id];if(c&&c>o){r+=1;continue}let g=n[d.id];if(g!==void 0&&d.updatedAt<=
g){l.push({...d,state:"done",issue:!1});continue}l.push(d)}return{items:l,snoozedCount:r}}var fs=4320*60*1e3;function $n(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=fs}var ms={"needs-you":1,running:-1,done:-1};function ws(e,t,n){
let o=e.updatedAt>0,r=t.updatedAt>0;return!o&&!r?0:o?r?(e.updatedAt-t.updatedAt)*n:-1:1}function je(e,t){let n=e.signals.
slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(r=>t(`rank_${r.signal}`,r.values)).join(t("rank_join"))}
function Pn(e,t=Date.now()){let n=new Map(e.map(o=>[o.id,be(o,t)]));return[...e].sort((o,r)=>{let l=dn[o.state]-dn[r.state];
if(l!==0)return l;if(o.state==="needs-you"){let d=(n.get(r.id)?.score??0)-(n.get(o.id)?.score??0);if(d!==0)return d}else if(o.
issue!==r.issue)return o.issue?-1:1;return ws(o,r,ms[o.state])})}function Mn(e,t,n={},o={},r={},l=nt,d=Date.now()){let c=new Map,
g=new Map;for(let i of e.slots){if(!i.key||Nn.has(i.key)||i.memory_mode==="incognito")continue;let m=os(i,n[i.key],t);if(m.
length>0){for(let k of m)c.set(k.id,k);let W=m.find(k=>k.state==="needs-you")??m[0];g.set(i.key,W);continue}let v=Vo(i,t);
c.set(v.id,v),g.set(i.key,v)}for(let[i,m]of Object.entries(o)){let v=g.get(i);v&&(v.state="needs-you",v.issue=!0,v.stalledFor=
m.silent_secs,v.summary=m.reason?t("stalled_because",{reason:m.reason,duration:De(m.silent_secs)}):t("stalled_for",{duration:De(
m.silent_secs)}),v.action="open")}for(let[i,m]of Object.entries(r)){let v=g.get(i);v&&(v.state="needs-you",v.issue=!0,v.
loopRepeats=m.repeats,v.summary=t("error_loop",{tool:m.tool,repeats:String(m.repeats)}),v.action="open")}for(let i of e.
approvals){let m=i.slot?g.get(i.slot):void 0;if(m){Yo(m,i,t);continue}c.set(`approval:${i.id}`,{id:`approval:${i.id}`,title:Ce(
i.tool||i.source,t("approval_needed")),summary:i.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:z(
i.ts),provenance:t("approval"),action:"review-approval",approvalKind:Sn(i)?"subagent":"tool",permissionId:i.id,permissionTool:i.
tool||i.source,permissionPurpose:i.tool_purpose,permissionInput:i.tool_input,references:[{kind:"approval",id:i.id,label:i.
tool||i.source||t("approval")}]})}for(let i of e.agents){let m=i.parent?g.get(i.parent):void 0;if(m){Jo(m,i,t);continue}
let v=!!(i.done&&(i.error||i.outcome==="failed"));i.parent&&!v||c.set(`agent:${i.id}`,{id:`agent:${i.id}`,title:Ce(i.task||
i.agent,t("agent_work")),summary:v?i.error?.trim()||t("agent_failed",{task:i.task}):i.done?t("agent_done"):t("work_in_pr\
ogress"),state:v?"needs-you":i.done?"done":"running",issue:v,runFailed:v||void 0,retryPath:v&&!i.id.startsWith("native:")?
`/api/spawn/${encodeURIComponent(i.id)}/retry`:void 0,updatedAt:z(i.started),provenance:i.agent||t("agent"),action:"disc\
uss",references:[{kind:"agent",id:i.id,label:i.agent||t("agent")}]})}for(let i of e.workflows){let m=i.session_key?g.get(
i.session_key):void 0;if(m){Xo(m,i,t);continue}let v=i.status==="failed";c.set(`workflow:${i.run_id}`,{id:`workflow:${i.
run_id}`,title:Ce(i.name,i.run_id),summary:v?t("workflow_failed_generic"):i.status==="running"?t("workflow_running"):t("\
workflow_finished"),state:v?"needs-you":i.status==="running"?"running":"done",issue:v,runFailed:v||void 0,retryPath:v?`/\
api/workflows/runs/${encodeURIComponent(i.run_id)}/rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[
{kind:"workflow",id:i.run_id,label:i.name||i.run_id}]})}for(let i of e.crons){if(!i.is_running&&i.last_status!=="error")
continue;let m=i.last_status==="error",v=zo(i,d),W=t(m?"monitor_failed":"monitor_running");c.set(`monitor:${i.id}`,{id:`\
monitor:${i.id}`,title:i.name,summary:v?`${W} ${t("monitor_next_check",{duration:v})}`:W,state:m?"needs-you":"running",issue:m,
runFailed:m||void 0,retryPath:m?`/api/crons/${encodeURIComponent(i.id)}/run`:void 0,updatedAt:z(i.running_since||i.last_run_ts||
i.created_ts),provenance:t("monitor"),action:m?"discuss":void 0,references:[{kind:"monitor",id:i.id,label:i.name}]})}for(let i of e.
loops||[]){if(!i.active)continue;let m=String(i.id||"");if(!m)continue;let v=Math.max(0,Number(i.cycle_count)||0),W=Math.
max(0,Number(i.max_cycles)||0),k=i.slot_key&&g.has(i.slot_key)?i.slot_key:void 0;c.set(`loop:${m}`,{id:`loop:${m}`,title:Ce(
i.message||"",t("loop")),summary:W?t("loop_watching_capped",{cycles:String(v),cap:String(W)}):t("loop_watching",{cycles:String(
v)}),state:"running",issue:!1,updatedAt:z(i.last_fire_ts||i.created_ts),sessionKey:k,parentId:k?g.get(k)?.id:void 0,provenance:t(
"loop"),stopPath:`/api/autonudge/${encodeURIComponent(m)}`,action:k?"open":void 0,references:[{kind:"monitor",id:m,label:t(
"loop"),sessionKey:k},...k?[{kind:"session",id:k,label:g.get(k)?.title||k,sessionKey:k}]:[]]})}let f=[...e.artifacts].sort(
(i,m)=>z(m.updated_at)-z(i.updated_at)).slice(0,8);for(let i of f){let m=i.session_key&&g.has(i.session_key)?i.session_key:
void 0;c.set(`artifact:${i.slug}`,{id:`artifact:${i.slug}`,title:Ce(i.name,t("artifact")),summary:i.description||t("arti\
fact_ready",{kind:i.kind}),state:"done",issue:!1,updatedAt:z(i.updated_at||i.created_at),sessionKey:m,parentId:m?g.get(m)?.
id:void 0,provenance:i.session_title||i.source||t("artifact"),action:m?"open":void 0,references:[{kind:"artifact",id:i.slug,
label:i.name,sessionKey:m},...m?[{kind:"session",id:m,label:i.session_title||m,sessionKey:m}]:[]]})}let y=[...c.values()];
return cs(y,l),Pn(y)}function Mt(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.
filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function Ln(e){let t=[],n=new Map;for(let o of e){let r=o.sessionKey;if(!r)continue;let l=n.get(r);if(l){l.count+=1;continue}
let d=o.references.find(g=>g.kind==="session")?.label??o.provenance,c={sessionKey:r,label:d,leading:o,count:1};n.set(r,c),
t.push(c)}return t}function Lt(e,t,n=nt){if(t==="pr")return hs(e);if(t==="goal")return Wt(e,n);let o=[],r=new Map;for(let l of e){
let d=l.sessionKey;if(!d){o.push({key:l.id,items:[l],header:null,sessionKey:null,changeRef:null});continue}let c=r.get(d);
if(c){c.items.push(l);continue}let g={key:d,items:[l],header:"session",sessionKey:l.sessionKey??null,changeRef:null};r.set(
d,g),o.push(g)}return o}function hs(e){let t=[],n=new Map;for(let o of e){let r=o.references.filter(l=>l.kind==="change"||
l.kind==="issue");for(let l of r){let d=`${l.kind}:${l.id}`,c=n.get(d);if(c){c.items.push(o);continue}let g={key:d,items:[
o],header:"pr",sessionKey:null,changeRef:l};n.set(d,g),t.push(g)}}return t}function Wt(e,t){let n=Cn(e),o=e.map((g,f)=>f),
r=g=>{for(;o[g]!==g;)o[g]=o[o[g]],g=o[g];return g},l=(g,f)=>{o[r(f)]=r(g)};for(let g=0;g<e.length;g+=1)for(let f=g+1;f<e.
length;f+=1){let y=e[g],i=e[f],m=he(y,i);if(!t.split.includes(m)){if(Wn(y,i)){l(g,f);continue}if(t.merged.includes(m)){l(
g,f);continue}!y.sessionKey||!i.sessionKey||y.sessionKey===i.sessionKey||Fe(y,i,n)&&l(g,f)}}let d=[],c=new Map;for(let g=0;g<
e.length;g+=1){let f=r(g),y=c.get(f);if(y){y.items.push(e[g]),y.header="goal";continue}let i={key:`goal:${e[g].id}`,items:[
e[g]],header:null,sessionKey:null,changeRef:null};c.set(f,i),d.push(i)}for(let g of d)g.key=bs(g.items);return d}function bs(e){
return`goal:${[...e.map(t=>t.id)].sort()[0]}`}var vs=.5;function ys(e,t){let n=new Set,o=[...e].sort((r,l)=>l.items.length-
r.items.length);for(let r of o){let l=new Set(r.items.map(pt)),d=null;for(let c of t){if(n.has(c.key))continue;let g=c.members.
filter(y=>l.has(y)).length;if(!g)continue;let f=g/Math.min(l.size,c.members.length);f<vs||(!d||f>d.score)&&(d={key:c.key,
score:f})}d&&(n.add(d.key),r.key=d.key)}return e}function En(e){return e.map(t=>({key:t.key,members:t.items.map(pt)}))}function At(e,t){
let n=t.split(" ").map(o=>`${xs(o)}s?`).join("[\\s/_,-]+");return e.match(new RegExp(n,"iu"))?.[0]??null}function xs(e){
return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Tn(e,t=nt){if(e.length<2)return null;let n=null,o=null;for(let r=0;r<
e.length;r+=1)for(let l=r+1;l<e.length;l+=1){let d=e[r],c=e[l];if(Wn(d,c))return`${c.parentId===d.id?c.title:d.title} wa\
s started by this work`;if(t.merged.includes(he(d,c)))return"you merged these";let g=Fe(d,c);if(g&&(!n||gt.indexOf(g)<gt.
indexOf(n))&&(n=g,g==="same_deliverable")){let f=qe(c.title),y=qe(d.title).find(i=>f.includes(i))??null;o=y?At(d.title,y)??
At(c.title,y)??y:null}}return n?n==="same_change"?"these sessions work on the same change":n==="same_artifact"?"these se\
ssions share the same output":n==="same_deliverable"?o?`both are about ${o}`:"both name the same deliverable":n==="same_\
step"?"these sessions have the same next step":"these sessions describe the same work":null}var ks=12;function zn(e){if(e.
length<2)return null;let t=new Map;for(let g of e)for(let f of qe(g.title))t.set(f,(t.get(f)??0)+1);let n=bn(t);if(n)return vn(
e,n)??n;let o=new Map;for(let g of e)for(let f of g.references){if(f.kind!=="change"&&f.kind!=="issue")continue;let y=o.
get(f.id);o.set(f.id,{label:f.label,members:(y?.members??0)+1})}let r=[...o.values()].filter(g=>g.members>=2).sort((g,f)=>f.
members-g.members)[0];if(r)return r.label;let l=new Map;e.forEach((g,f)=>{for(let y of _s(g.title))l.has(y)||l.set(y,new Set),
l.get(y).add(f)});let d=new Map;for(let[g,f]of l)d.set(g,f.size);let c=bn(d);return c?vn(e,c)??c:null}function bn(e){return[
...e.entries()].filter(([,t])=>t>=2).sort((t,n)=>n[1]-t[1]||n[0].length-t[0].length)[0]?.[0]??null}function vn(e,t){let n=null;
for(let o of e){let r=At(o.title,t);if(r){if(/^\p{Lu}/u.test(r))return r;n??=r}}return n}function _s(e){let t=e.toLowerCase().
replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean),n=[];for(let o=Math.min(t.length,ks);o>=2;o-=1)for(let r=0;r+
o<=t.length;r+=1){let l=t.slice(r,r+o);Ae.has(l[0])||Ae.has(l[o-1])||l[0].length<2||l[o-1].length<2||n.push(l.join(" "))}
return n}function On(e,t){let n=e.references.find(o=>o.kind==="session")?.label??"";for(let o of[e.title,n,e.provenance]){
let r=Bt(o,t);if(r)return r}return null}function Bt(e,t){let n=e.toLowerCase(),o=null;for(let r of t)for(let l of r.aliases)
!l||!n.includes(l.toLowerCase())||(!o||l.length>o.length)&&(o={name:r.name,length:l.length});return o?.name??null}function Gn(e,t){
let n=e.references.find(d=>d.kind==="session")?.label??"";if(!n)return null;let o=Bt(e.title,t);if(!o)return null;let r=t.
find(d=>d.name===o);if(r&&r.aliases.some(d=>d&&n.toLowerCase().includes(d.toLowerCase())))return null;let l=Bt(n,t);return!l||
l===o?null:{itemGoal:o,sessionGoal:l}}function Dn(e,t){let n=t.flatMap(l=>l.aliases.map(d=>d.toLowerCase())),o=new Set([
"workspace","workspaces","home","src","tmp","documents","desktop"]),r=new Map;for(let l of e){if(!l.key||Nn.has(l.key)||
l.memory_mode==="incognito")continue;let d=l.project;if(!d)continue;let c=d.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop();!c||o.has(c.toLowerCase())||n.some(g=>c.toLowerCase().includes(g)||g.includes(c.toLowerCase()))||r.set(c,(r.get(
c)??0)+1)}return[...r.entries()].map(([l,d])=>({name:l,sessions:d})).sort((l,d)=>d.sessions-l.sessions)}function qn(e,t){
let n=new Map;for(let l of e){if(!l.sessionKey||On(l,t)!==null)continue;let d=l.references.find(c=>c.kind==="session")?.
label??"";for(let c of[l.title,d]){let g=c.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);
for(let f of[3,2])for(let y=0;y+f<=g.length;y+=1){let i=g.slice(y,y+f);if(Ae.has(i[0])||Ae.has(i[f-1])||i[0].length<3||i[f-
1].length<3)continue;let m=i.join(" ");n.has(m)||n.set(m,new Set),n.get(m).add(l.sessionKey)}}}let o=[...n.entries()].map(
([l,d])=>({phrase:l,sessions:d.size})).filter(l=>l.sessions>=2);return o.filter(l=>!o.some(d=>d.phrase!==l.phrase&&d.phrase.
includes(l.phrase)&&d.sessions>=l.sessions)).sort((l,d)=>d.sessions-l.sessions||d.phrase.length-l.phrase.length).map(l=>({
name:l.phrase.replace(/\p{L}+/gu,d=>d[0].toUpperCase()+d.slice(1)),sessions:l.sessions}))}function yn(e){return e.some(t=>t.
state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function Fn(e,t=Date.now()){return e.issue?
"crit":e.state==="needs-you"?ft(e,t)==="followup"?"idle":"warn":"good"}function ot(e){let t=new Set,n=new Set,o=new Set,r=0,l=0,d=0,c=0,g=0;for(let f of e){f.sessionKey&&t.add(f.sessionKey);for(let y of f.
references)y.kind==="change"?n.add(y.id):y.kind==="issue"&&o.add(y.id);f.id.startsWith("workflow:")?r+=1:f.id.startsWith(
"monitor:")?l+=1:f.id.startsWith("agent:")&&(d+=1),f.state==="needs-you"&&(c+=1),f.updatedAt>g&&(g=f.updatedAt)}return{sessions:t.
size,prs:n.size,issues:o.size,loops:r,crons:l,agents:d,needsYou:c,lastActivityAt:g}}function jn(e){let t=e.find(o=>o.moving);
if(t)return t;let n=e.find(o=>o.state==="running");return n||[...e].sort((o,r)=>(r.updatedAt||0)-(o.updatedAt||0))[0]}function Ss(e){
let t=[],n=new Set;for(let o of e){let r=o.sessionKey;!r||n.has(r)||(n.add(r),t.push(o.references.find(l=>l.kind==="sess\
ion")?.label??o.provenance))}return t}function Un(e,t,n=nt,o=[]){let r=new Map,l=[],d=new Map;for(let i of e){let m=On(i,
t);if(d.set(i.id,m),m===null){l.push(i);continue}r.has(m)||r.set(m,[]),r.get(m).push(i)}let c=ys(Wt(l,n),o),g=new Map;for(let i of c)
g.set(i.items[0].id,i);let f=[],y=new Set;for(let i of e){let m=d.get(i.id)??null;if(m!==null){if(y.has(m))continue;y.add(
m);let W=r.get(m);f.push({key:`initiative:${m}`,name:m,status:yn(W),sessions:Ss(W),blocks:Wt(W,n)});continue}let v=g.get(
i.id);v&&f.push({key:v.key,name:null,status:yn(v.items),sessions:[],blocks:[v]})}return f}function Et(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Vn(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,o)=>Hn(o)-Hn(n)).slice(0,12)}function Hn(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Yn(e,t){
let n={},o="unknown";for(let r of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(r.key)}/summary`);if(!l||typeof l!=
"object"){o="unsupported";break}if(l.enabled===!1){o="disabled";break}n[r.key]=l,o="available"}catch{o="unsupported";break}
return{summaries:n,support:o}}var Jn=String.raw`
  .ow-root {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    color: var(--text);
    background: var(--bg);
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
  .ow-body { flex: 1; min-height: 0; padding: 0; border-top: 1px solid var(--border); }
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
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--bg);
  }
  /*
   * The left column. Group by is gone from a 156px rail: Goal and Session became
   * the tabs of the list card, and PR became the bottom stack's PRs card, so no
   * lens was deleted — each just has a permanent home instead of a switch.
   *
   * Flex, not viewport maths. This app renders as a flex child of the dashboard
   * shell (.ow-root{flex:1;min-height:0}), so a calc(100vh - …) height would
   * ignore the chrome above it and overflow. Height comes from the parent and
   * every scroll container below repeats min-height:0, which is what lets an
   * internal scroller actually shrink instead of growing.
   *
   * flex-basis is the resizer's live handle; min-width keeps a dragged-shut
   * column readable rather than collapsed to nothing.
   */
  .ow-main {
    display: flex;
    flex: 0 0 40%;
    min-width: 320px;
    min-height: 0;
    flex-direction: column;
    gap: 10px;
    padding: 16px 0 16px 16px;
  }
  /* A 10px hit area around a 3px visual line: the line stays hairline-quiet at
     rest, the target stays large enough to grab. */
  .ow-resizer {
    display: flex;
    flex: 0 0 10px;
    align-self: stretch;
    align-items: center;
    justify-content: center;
    border: 0;
    padding: 0;
    background: none;
    cursor: col-resize;
  }
  .ow-resizer::before {
    content: '';
    width: 3px;
    height: 44px;
    border-radius: 999px;
    background: var(--border);
    transition: background 140ms ease;
  }
  .ow-resizer:hover::before,
  .ow-resizer[data-dragging='true']::before { background: var(--muted); }
  .ow-resizer:focus-visible::before { background: var(--accent); }
  /* Dragging must not leave the cursor flickering between the I-beam and the
     resize arrow, nor select the text it sweeps over. */
  .ow-root[data-resizing='true'] { cursor: col-resize; user-select: none; }
  .ow-filter[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    color: var(--accent);
  }
  .ow-count { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  /* Card shell, shared by the tabbed list and every bottom-stack card. */
  .ow-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
  }
  /*
   * The Goals/Sessions card owns the column's remaining height and scrolls
   * INSIDE itself, so its tabs, subtitle and filter pills stay put while the
   * list moves — and so the bottom stack below can never be pushed off screen.
   */
  .ow-listcard {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  .ow-listcard-head { flex: none; padding: 12px 14px 0; }
  .ow-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
  /* Underline tabs, not the pill treatment the rail used: these switch what the
     list IS, so they read as the card's own title row rather than a filter. */
  .ow-tab {
    margin-bottom: -1px;
    padding: 2px 10px 8px;
    border: 0;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: none;
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
  }
  .ow-tab:hover { background: none; color: var(--text); }
  .ow-tab[data-selected='true'] {
    border-bottom-color: var(--text-strong);
    color: var(--text-strong);
  }
  .ow-listcard-tools { display: flex; flex-direction: column; gap: 10px; padding: 10px 0 12px; }
  .ow-listcard-sub { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* The only scroll container in the column. */
  .ow-work { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .ow-work-inner { padding: 0 14px 14px; }
  /* Bottom stack: companion surfaces pinned below the scrolling list. Each is a
     real <details>, so the browser owns the disclosure state and keyboard. */
  .ow-stack { display: flex; flex: none; flex-direction: column; gap: 10px; }
  .ow-stack-card { overflow: hidden; }
  .ow-stack-card > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 11px 14px;
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
  /* Capped so an open card cannot eat the list above it; scrolls past the cap. */
  .ow-stack-body { max-height: 40vh; overflow-y: auto; padding: 6px 14px 12px; }
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
  .ow-section { margin: 0 0 24px; }
  .ow-section-header { display: flex; flex-direction: column; gap: 2px; }
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
  .ow-row:hover { border-color: var(--border-strong); background: var(--bg-hover); }
  .ow-row:focus-visible { box-shadow: 0 0 0 2px var(--accent); }
  .ow-row[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .ow-row-layout { display: flex; align-items: flex-start; gap: 12px; }
  .ow-row-content { min-width: 0; flex: 1; }
  .ow-row-heading { display: flex; min-width: 0; align-items: center; gap: 8px; }
  /* The host Badge is 13px / medium / mono. Only two overrides earn their place:
     uppercase marks a closed set of categories rather than a description, and an
     equal width makes the verbs a column you can run your eye down.

     Width is 7ch, not a pixel guess. The ch unit resolves against this element's
     own font, which is monospace, so 7ch is exactly the width of the longest verb
     (UNBLOCK) and every verb renders identically wide — which is what makes the
     titles after them start at the same x. A min-width of 76px was only a FLOOR:
     UNBLOCK exceeded it and grew, so the pills came out different widths and
     nothing aligned. Letter-spacing is gone because it added width per character
     that 7ch does not account for, and it was the weakest of the overrides.
     Left-aligned, not centred: a column is made by first letters lining up.

     box-sizing is stated rather than inherited: under border-box the badge's own
     8px side padding would eat into the 7ch and clip UNBLOCK. */
  .ow-verb {
    flex: none; box-sizing: content-box; width: 7ch;
    justify-content: flex-start; font-size: 11px;
  }
  .ow-row-title { overflow: hidden; color: var(--text-strong); font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
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
  .ow-row-actions { display: flex; flex-shrink: 0; align-self: center; align-items: center; gap: 4px; }
  .ow-primary-action { flex-shrink: 0; }
  .ow-icon { width: 14px; height: 14px; flex-shrink: 0; }
  /* Sizing only: the layout moved from a grid track to a flex row, so the column
     takes its width from flex + the resizer instead of a grid template. Nothing
     inside the Conductor changed. */
  .ow-conductor { display: flex; flex: 1 1 auto; min-width: 0; min-height: 0; flex-direction: column; background: var(--bg); border-left: 1px solid var(--border); }
  .ow-conductor-header { padding: 10px 16px; border-bottom: 1px solid var(--border); }
  .ow-conductor-title { display: flex; align-items: baseline; gap: 8px; }
  .ow-conductor-title h2 { margin: 0; color: var(--text-strong); font-size: 15px; font-weight: 650; }
  .ow-conductor-sub { color: var(--muted); font-size: 12px; font-weight: 500; }
  .ow-lane-head { display: flex; align-items: baseline; gap: 8px; padding: 10px 16px 2px; }
  .ow-lane-badge { flex: 0 0 auto; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 7px; border-radius: 5px; }
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
  .ow-block-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-width: 0;
    flex-wrap: nowrap;
    overflow: hidden;
    /*
     * No single theme token is reliably distinct from --card: --bg-accent EQUALS
     * --card in monokai (#2d2e27) and solarized (#073642), and --bg-elevated
     * equals it (#ffffff) in every light theme. Mixing the FOREGROUND into the
     * card guarantees a visible delta on every theme by definition, with
     * --bg-accent kept as the fallback for engines without color-mix.
     */
    background: var(--bg-accent);
    background: color-mix(in srgb, var(--text) 6%, var(--card));
    border: 0;
    padding: 10px 16px;
    font-size: 12px;
    color: var(--text);
    cursor: pointer;
    text-align: left;
  }
  .ow-block-name { font-weight: 600; }
  /* The NAME is the point of the header — the meta list yields, never the name. */
  .ow-block-tab .ow-block-name { flex: none; max-width: 40ch; }
  /* The NAME is the point of the header — the meta list yields, never the name. */
  .ow-block-tab .ow-block-name { flex: none; max-width: 40ch; }
  .ow-block-tab:hover .ow-block-name { text-decoration: underline; }
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
  .ow-block-tab-meta {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    color: var(--muted);
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
  .ow-chat-panel { position: relative; display: flex; min-height: 0; width: 100%; flex-direction: column; padding: 12px 16px; gap: 8px; }
  .ow-chat-panel > .ow-quote,
  .ow-chat-panel > .ow-permissions,
  .ow-chat-panel > .ow-conductor-receipt,
  .ow-chat-panel > .ow-chat-error { flex: none; }
  /* The embed fills the rest and scrolls inside itself, so the banner above it
     stays put instead of being overrun by the transcript. */
  .ow-embed { display: flex; flex: 1; min-height: 0; }
  .ow-embed > * { flex: 1; min-height: 0; }
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
  /* Group by — vertical in the rail: label, then the two modes stacked. */
  .ow-groupby { display: flex; flex-direction: column; gap: 4px; }
  .ow-groupby-label { color: var(--muted); font-size: 12px; }
  .ow-groupby-opt { width: 100%; justify-content: center; padding: 4px 12px; font-size: 12px; }
  .ow-groupby-opt[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    color: var(--accent);
  }
  .ow-pr-head { padding: 10px 12px; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--text) 6%, var(--card)); }
  .ow-pr-head-top { display: flex; align-items: center; gap: 8px; }
  .ow-pr-head-click { display: block; width: 100%; cursor: pointer; }
  .ow-pr-status-line { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; color: var(--muted); font-size: 12px; }
  .ow-pr-dot { display: inline-flex; align-items: center; gap: 6px; color: var(--ok); }
  .ow-pr-dot::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .ow-pr-dot[data-bad='true'] { color: var(--danger); }
  .ow-pr-sublabel { padding: 6px 12px 2px; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .ow-pr-number { flex: none; color: var(--muted); font-size: 12px; }
  .ow-pr-branches { flex: 1; min-width: 0; color: var(--muted); font-size: 12px; }
  .ow-pr-title-line {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    padding-top: 2px;
  }
  .ow-pr-title-line .ow-block-name { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
  .ow-pr-files-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding-bottom: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    border-bottom: 1px solid var(--border);
  }
  .ow-pr-files-head > span:first-child { flex: 1; }
  .ow-pr-detail { padding: 8px 16px 4px; }
  .ow-pr-adds { flex: none; color: var(--ok); font-size: 12px; }
  .ow-pr-dels { flex: none; color: var(--danger); font-size: 12px; }
  .ow-pr-files { margin-top: 2px; }
  .ow-pr-file {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    padding: 3px 0;
    font-size: 12px;
    color: var(--text);
  }
  .ow-pr-file > .ow-truncate { flex: 1; min-width: 0; }
  .ow-pr-more { color: var(--muted); }
  .ow-pr-sessions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 6px 16px 12px;
  }
  .ow-pr-sublabel-inline { color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .ow-pr-session-chip { border: 0; background: none; padding: 0; font: inherit; cursor: pointer; }
  .ow-goal-digest { padding: 10px 16px 12px; border-top: 1px solid var(--border); }
  .ow-digest-line {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--text);
    font-size: 13px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .ow-digest-counts { margin-top: 4px; color: var(--muted); font-size: 12px; }
  .ow-goal-fold {
    display: inline-flex;
    flex: none;
    align-items: center;
    padding: 2px;
    border: 0;
    border-radius: 4px;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .ow-goal-fold:hover { background: var(--bg-hover); color: var(--text); }
  .ow-row-mismatch {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    margin-top: 6px;
    font-size: 12px;
    color: var(--warn);
  }
  .ow-mismatch-fix {
    flex: none;
    border: 0;
    background: none;
    padding: 0;
    font-size: 12px;
    color: var(--accent);
    cursor: pointer;
  }
  .ow-mismatch-fix:hover { text-decoration: underline; }
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
  .ow-goalcard-header[data-selected='true'] .ow-goalcard-title { color: var(--accent); }
  .ow-goalcard-title { flex: 1; min-width: 0; overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: none; }
  .ow-goalcard .ow-block-open { flex: none; margin: 0; }
  .ow-goal-flag {
    flex: none; margin-left: auto; padding: 1px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
    color: var(--muted); background: var(--bg-hover); border: 1px solid var(--border);
  }
  .ow-goal-flag-warn { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  .ow-goal-meta { margin: 4px 0 0 26px; color: var(--muted); font-size: 11px; }
  /* Why the merge happened. Subdued below the meta: it answers a question the
     user only asks when the grouping looks wrong, so it must not compete with
     the goal's own name or its composition. */
  .ow-goal-why { margin: 2px 0 0 26px; color: var(--muted); font-size: 11px; font-style: italic; opacity: 0.85; }
  /* Member rows: indent under the title, a divider between them, lighter label. */
  .ow-goalcard .ow-row { padding: 7px 4px 7px 26px; }
  .ow-goalcard .ow-row + .ow-row { border-top: 1px solid var(--border); }
  .ow-goalcard .ow-row-title { color: var(--text); font-weight: 500; }
  .ow-goalcard .ow-row-actions .ow-icon { transition: transform 0.15s ease; }
  .ow-goalcard .ow-row[data-selected='true'] .ow-row-actions .ow-icon { transform: rotate(90deg); }
  .ow-goalcard .ow-row[data-selected='true'] .ow-row-title { color: var(--text-strong); font-weight: 700; }
  .ow-goalcard .ow-goal-digest { border-top: 0; padding: 8px 0 0 26px; }
  /* Status dot on a goal member row (mockup goal-item language). */
  .ow-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
  .ow-dot-good { background: var(--ok); }
  .ow-dot-warn { background: var(--warn); }
  .ow-dot-crit { background: var(--danger); }
  .ow-dot-idle { background: var(--muted); }
  .ow-init-status {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted-strong);
    background: var(--bg-hover);
  }
  .ow-init-status[data-status='needs-you'] { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); }
  .ow-init-status[data-status='running'] { color: var(--info); background: var(--accent-subtle); }
  .ow-goal-tab { cursor: pointer; }
  .ow-goal-tab .ow-block-open { flex: none; }
  .ow-goal-tab[data-selected='true'] {
    background: var(--aim-subtle);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .ow-quote-route { flex: none; min-width: 0; color: var(--muted); font-size: 12px; }
  .ow-quote-goal { flex-direction: column; align-items: stretch; gap: 2px; }
  .ow-quote-line { display: flex; min-width: 0; align-items: baseline; gap: 8px; }
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
  .ow-bootstrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
    padding: 12px 14px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-lg, 8px);
    color: var(--muted);
  }
  .ow-bootstrap[data-prominent='true'] { border-style: solid; background: var(--bg-elevated); }
  .ow-bootstrap-head { color: var(--text-strong); font-size: 13px; font-weight: 600; }
  .ow-bootstrap-sub { font-size: 12px; }
  .ow-bootstrap-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .ow-bootstrap-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--card);
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
  }
  .ow-bootstrap-chip:hover { border-color: var(--accent); }
  .ow-bootstrap-chip:disabled { opacity: 0.6; cursor: default; }
  .ow-bootstrap-count { color: var(--muted); font-size: 11px; }
  .ow-bootstrap-custom { display: flex; gap: 8px; }
  .ow-bootstrap-custom input { flex: 1; min-width: 0; }
  .ow-merge-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 4px 12px 2px;
    font-size: 12px;
  }
  .ow-merge-hint-label { color: var(--muted); flex: none; }
  .ow-merge-hint-btn {
    max-width: 46ch;
    border: 0;
    background: none;
    padding: 2px 0;
    font-size: 12px;
    color: var(--accent);
    cursor: pointer;
    text-align: left;
  }
  .ow-merge-hint-btn:hover { text-decoration: underline; }
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
  .ow-steps-head { color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .ow-steps-more { padding: 2px 0; border: 0; background: none; color: var(--muted); font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
  .ow-steps-more:hover { color: var(--text); text-decoration: underline; }
  .ow-row-steps { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin: 10px 0 2px; }
  /* Reveal-on-hover, top-right. Hidden and non-interactive at rest so the card
     is clean; shown on hover OR keyboard focus so it is not mouse-only. Floated
     over the corner (not in flow) so appearing shifts no layout. A backing panel
     keeps the labels legible over whatever text sits behind them. */
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
  /* The instructing target floats just above the composer. ChatEmbed exposes no
     slot inside itself, so this is pinned to the panel with an offset roughly the
     composer's height; opaque background so the transcript foot does not bleed. */
  .ow-quote-docked {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 64px;
    z-index: 3;
    background: var(--card);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  }
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
  @media (max-width: 980px) {
    .ow-body { min-height: 960px; }
    .ow-layout { grid-template-columns: 1fr; grid-template-rows: auto minmax(320px, 1fr) minmax(320px, 1fr); }
    .ow-rail { border-right: 0; border-bottom: 1px solid var(--border); }
    .ow-rail-inner { height: auto; flex-direction: row; align-items: center; }
    .ow-search { max-width: 320px; }
    .ow-work { border-right: 0; border-bottom: 1px solid var(--border); }
  }
`;import{Fragment as ce,jsx as a,jsxs as p}from"react/jsx-runtime";var Tt="crew-manager.snoozed",eo="crew-manager.handled",
to="crew-manager.done-collapsed",zt="crew-manager.goal-verdicts",no="crew-manager.goal-memory",oo="crew-manager.initiati\
ve-collapsed",so="crew-manager.open-stack",ro="crew-manager.split",ao="crew-manager.tab",io=40,Es=25,Ts=75;function de(e,t={}){
try{let n=localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}function Q(e,t){try{localStorage.setItem(e,JSON.
stringify(t))}catch{}}function Ht(e,t=Date.now()){if(!e)return null;let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return"\
just now";let o=Math.round(n/60);if(o<60)return`${o}m ago`;let r=Math.round(o/60);return r<24?`${r}h ago`:`${Math.round(
r/24)}d ago`}function lo(e){return e?new Date(e).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}function Ue(e,t,n){
return e<=0?null:`${e} ${e===1?t:n}`}function Ot(e,t=Date.now()){let n=ot(e),o=[Ue(n.sessions,"session","sessions"),Ue(n.
prs,"PR","PRs"),Ue(n.issues,"issue","issues"),Ue(n.loops,"loop","loops"),Ue(n.crons,"cron","crons"),Ue(n.agents,"agent",
"agents")].filter(l=>!!l),r=Ht(n.lastActivityAt,t);return r&&o.push(`last active ${r}`),o.join(" \xB7 ")}var He="crew-ma\
nager-conductor",zs=5e3,Os={session:"Session",approval:"Approval",agent:"Agent",workflow:"Workflow",monitor:"Monitor",artifact:"\
Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"Allow or refuse a sub-agent held\
 at the spawn gate",information_needed:"Answer the request in the work thread",decision_ready:"Make the decision this wo\
rk is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"Open the linked change \u2014 a check is failin\
g or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"Review the pending {{tool}} \
request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool call",agent_work:"Agent wor\
k",agent_done:"This agent run finished",agent_failed:"This agent stopped before finishing \u2014 nothing to do here",workflow_failed:"\
This workflow stopped before finishing",workflow_failed_generic:"This workflow stopped before finishing",workflow_running:"\
Workflow is running",workflow_finished:"Workflow finished",monitor_failed:"The latest check stopped before finishing",monitor_running:"\
Monitor is checking now",monitor_next_check:"Checks again in {{duration}}.",loop:"Monitor loop",loop_watching:"Re-prompt\
ing its own session \u2014 {{cycles}} cycles so far, no limit set",loop_watching_capped:"Re-prompting its own session \u2014 \
cycle {{cycles}} of {{cap}}",artifact_ready:"{{kind}} output is ready",stalled_for:"Check on it \u2014 no activity for {{dura\
tion}}, still marked running",stalled_because:"{{reason}} Silent for {{duration}}.",duplicate_same_change:"Also being wo\
rked in \u201C{{title}}\u201D \u2014 same linked change",duplicate_same_artifact:"Also being worked in \u201C{{title}}\u201D \u2014 sam\
e artifact",duplicate_same_deliverable:"Also being worked in \u201C{{title}}\u201D \u2014 same deliverable",duplicate_same_topic:"\
Looks like the same work as \u201C{{title}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same \
work",related_sessions:"{{count}} other session(s) on this same work",related_same_change:"same change",related_same_artifact:"\
same artifact",related_same_deliverable:"same deliverable",related_same_topic:"similar goal",related_same_step:"same nex\
t step",related_more:"and {{count}} more",rank_approval_owed:"only you can clear this approval",rank_subagent_gate:"a su\
b-agent is held at the spawn gate",rank_input_requested:"the agent asked you a question",rank_unverified_completion:"fin\
ished but never verified",rank_error_loop:"the same failure has repeated {{repeats}} times",rank_run_failed:"the run fai\
led and has not been retried",rank_stalled:"silent for {{duration}}",rank_change_blocked:"a linked change is failing or \
conflicting",rank_nobody_on_it:"nobody is on {{count}} unfinished goal(s) in this session",no_next_step:"No next step re\
corded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"{{\
tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work"};function te(e,t={}){return Os[e].
replace(/\{\{(\w+)\}\}/g,(n,o)=>t[o]??"")}var Gs={followup:"FOLLOW UP",unblock:"UNBLOCK"},ve={"needs-you":"Needs you",running:"\
Running",done:"Done"},Gt={all:"All","needs-you":"Needs you",running:"Running",done:"Done"},co={all:"All",failing:"Failin\
g",running:"Running",merged:"Merged"},Ds={session:Ut,approval:mo,agent:Ns,workflow:As,monitor:vo,artifact:Rs,change:jt,issue:Ws};
function ye({children:e,onActivate:t,...n}){return a("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:o=>{(o.key===
"Enter"||o.key===" ")&&(o.preventDefault(),t())},children:e})}function uo({label:e,count:t,subtitle:n}){return p("div",{
className:"ow-section-header",children:[p("div",{className:"ow-section-heading",children:[a("h2",{className:"ow-section-\
title",children:e}),a("span",{className:"ow-section-count",children:t})]}),n&&a("p",{className:"ow-section-subtitle",children:n})]})}
function qs(e){if(e.state==="needs-you"){let t=ft(e);return t?a(Y,{variant:"warn",className:"ow-verb",children:Gs[t]}):null}
return e.state==="running"?e.moving?p(Y,{variant:"aim",children:[a(bo,{className:"ow-icon"}),ve[e.state]]}):a(Y,{variant:"\
muted",children:"Queued"}):p(Y,{variant:"ok",children:[a(ho,{className:"ow-icon"}),ve[e.state]]})}function Fs({tool:e,purpose:t,busy:n,onAnswer:o,where:r}){return p("div",{className:"ow-permission",children:[p("div",{className:"\
ow-permission-body",children:[p("div",{className:"ow-permission-head",children:[a(Is,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),p("p",{className:"ow-permi\
ssion-what",children:[r&&p("span",{className:"ow-truncate",children:[r," "]}),r?"wants to run ":"Wants to run ",a("code",
{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),p("div",{className:"ow-permission-actions",children:[
a(G,{onClick:()=>o(!0),disabled:n,children:"Approve"}),a(G,{onClick:()=>o(!1),disabled:n,children:"Reject"})]})]})}function st({
children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"ow-expand-inner",children:e})})}var Dt=3;
function po(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function js({
item:e,busy:t,onDecide:n}){let[o,r]=S(!1),l=e.permissionInput||"",d=l.trim().split(/\s+/)[0]||e.permissionTool||"";return p(
"div",{className:"ow-formal-approval",role:"presentation",onClick:c=>c.stopPropagation(),onKeyDown:c=>c.stopPropagation(),
children:[a("div",{className:"ow-formal-badge",children:"Waiting for approval"}),p("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&p("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),p("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("span",{className:"ow-formal-val ow-formal-mon\
o",children:l||"(no input details)"})]})]}),p("div",{className:"ow-formal-actions",children:[a(G,{disabled:t,onClick:()=>n(
"approved"),children:"Allow once"}),p("span",{className:"ow-trust-wrap",children:[p(G,{disabled:t,onClick:()=>r(c=>!c),"\
aria-expanded":o,children:["Trust ",a(ne,{className:"ow-icon ow-trust-caret","data-open":o?"true":void 0,"aria-hidden":"\
true"})]}),o&&p("span",{className:"ow-trust-menu",role:"menu",children:[l&&a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{r(!1),n("trust_command")},children:"Trust this exact command"}),d&&p("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{r(!1),n("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{r(!1),
n("trust")},children:"Trust everything in this session"})]})]}),a(G,{className:"ow-formal-reject",disabled:t,onClick:()=>n(
"rejected"),children:"Reject"})]})]})}function Us({candidates:e,prominent:t,busy:n,onAdd:o}){let[r,l]=S(""),d=t?e:e.filter(
c=>c.sessions>=2);return p("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{className:"\
ow-bootstrap-head",children:t?"No big goals defined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&a(
"div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, or name\
 your own."}),d.length>0&&a("div",{className:"ow-bootstrap-chips",children:d.slice(0,4).map(c=>p("button",{type:"button",
className:"ow-bootstrap-chip",disabled:n,onClick:()=>o(c.name,[c.name]),children:[c.name," ",p("span",{className:"ow-boo\
tstrap-count",children:[c.sessions," session",c.sessions===1?"":"s"]})]},c.name))}),p("div",{className:"ow-bootstrap-cus\
tom",children:[a(Ms,{value:r,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:c=>l(c.target.
value),onKeyDown:c=>{c.key==="Enter"&&r.trim()&&(o(r),l(""))}}),a(G,{disabled:n||!r.trim(),onClick:()=>{o(r),l("")},children:"\
Add goal"})]})]})}function go({members:e}){let t=e[0],n=new Set(e.map(c=>c.sessionKey).filter(Boolean)).size,o=e.filter(
c=>c.state==="needs-you").length,r=e.filter(c=>c.state==="running").length,l=e.filter(c=>c.state==="done").length,d=[`${n}\
 session${n===1?"":"s"}`];return o&&d.push(`${o} need${o===1?"s":""} you`),r&&d.push(`${r} running`),l&&d.push(`${l} don\
e`),p("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),a("d\
iv",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}function qt({open:e,onToggle:t,label:n,flag:o,flagWarn:r,
meta:l,why:d,header:c,action:g,children:f}){return p("div",{className:"ow-block ow-goalcard","data-grouped":"true","data\
-open":e?"true":void 0,children:[p("div",{className:"ow-goalcard-summary",children:[t&&a("button",{type:"button",className:"\
ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":"Expand"} ${n??"goal"}`,onClick:t,children:a(ne,{className:"\
ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-hidden":"true"})}),c,g,a("span",{className:`ow-goal-flag${r?"\
 ow-goal-flag-warn":""}`,children:o})]}),a("div",{className:"ow-goal-meta",children:l}),d&&p("div",{className:"ow-goal-w\
hy",children:["Grouped because ",d,"."]}),f]})}function Hs({block:e,status:t,folded:n,onToggle:o,onSplit:r,selected:l,onSelect:d}){
let c=e.items[0],g=new Set(e.items.map(i=>i.sessionKey).filter(Boolean)).size,f=[];for(let i=0;i<e.items.length;i+=1)for(let m=i+
1;m<e.items.length;m+=1)e.items[i].sessionKey!==e.items[m].sessionKey&&f.push(he(e.items[i],e.items[m]));let y=p(ce,{children:[
o&&a("button",{type:"button",className:"ow-goal-fold","aria-label":n?`Expand ${c.title}`:`Collapse ${c.title}`,"aria-exp\
anded":!n,onClick:i=>{i.stopPropagation(),o()},children:a(ne,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"\
true","aria-hidden":"true"})}),a(mt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-bloc\
k-name",children:c.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:ve[t]}),p("span",{className:"\
ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),p("span",{className:"ow-truncate",children:[
g," sessions, one goal"]})]}),r&&a(G,{className:"ow-block-open",title:"Not the same goal \u2014 split into separate cards",
"aria-label":`Split ${c.title}`,onClick:i=>{i.stopPropagation(),r(f)},children:"Split"})]});return d?a(ye,{onActivate:d,
className:"ow-block-tab ow-goal-tab","aria-pressed":l,"data-selected":l?"true":void 0,children:y}):a("div",{className:"o\
w-block-tab",children:y})}var Vs=.3;function fo({item:e,items:t,onMerge:n}){let o=t.filter(r=>r.id!==e.id&&r.sessionKey&&
e.sessionKey&&r.sessionKey!==e.sessionKey).map(r=>({other:r,score:Fe(e,r)?1:ut(e.title,r.title)})).filter(r=>r.score>=Vs).
sort((r,l)=>l.score-r.score).slice(0,2);return o.length===0?null:p("div",{className:"ow-merge-hint",children:[a("span",{
className:"ow-merge-hint-label",children:"Same goal?"}),o.map(({other:r})=>p("button",{type:"button",className:"ow-merge\
-hint-btn ow-truncate",onClick:()=>n(he(e,r)),children:["Merge with \u201C",r.title,"\u201D"]},r.id))]})}function Ys({item:e,
onOpen:t}){let n=e.references.find(r=>r.kind==="session"),o=e.references.filter(r=>r.kind!=="session");return p("div",{className:"\
ow-block-tab",children:[a(Ut,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",
children:n?.label??e.provenance}),p("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\
\xB7"}),a("span",{className:"ow-truncate",children:e.provenance}),o.slice(0,2).map(r=>a("span",{className:"ow-truncate",
children:r.label},`${r.kind}:${r.id}`))]}),a(G,{className:"ow-block-open",onClick:t,"aria-label":`Open ${n?.label??e.provenance}`,
children:"Open"})]})}var Js=12;function Xs(e){let t=(e.checks??[]).filter(n=>n.bucket!=="skipped");return{available:!0,total:t.
length,passing:t.filter(n=>n.bucket==="passed").length,failing:t.filter(n=>n.bucket==="failed").length,pending:t.filter(
n=>n.bucket==="pending").length,title:e.title,state:e.state?e.state.toUpperCase():void 0,is_draft:!!e.draft,head:e.headBranch,
base:e.baseBranch,author:e.author,updated_at:e.updatedAt,additions:e.additions,deletions:e.deletions,changed_files:e.changedFiles,
files:(e.files??[]).slice(0,Js).map(n=>({path:n.path,additions:n.additions,deletions:n.deletions}))}}function Qs({reference:e,
checks:t,folded:n,onToggle:o}){let r=e.status?/fail|conflict|closed/.test(e.status):!1,l=t?.title||e.label,d=t?.is_draft?
"Draft":t?.state?t.state.charAt(0)+t.state.slice(1).toLowerCase():null,c=p(ce,{children:[o&&a(ne,{className:"ow-icon ow-\
init-chevron","data-open":n?void 0:"true","aria-hidden":"true"}),d&&a("span",{className:"ow-init-status","data-status":t?.
state==="MERGED"?"done":(t?.failing??0)>0?"needs-you":"running",children:d}),t?.head&&t?.base&&p("span",{className:"ow-t\
runcate ow-pr-branches ow-formal-mono",children:[t.head," \u2192 ",t.base]}),!(t?.head&&t?.base)&&a("span",{className:"o\
w-pr-branches"}),e.url&&a("a",{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferre\
r","aria-label":`Open ${e.label}`,onClick:i=>i.stopPropagation(),children:a(jt,{className:"ow-icon","aria-hidden":"true"})})]}),
g=t?.updated_at?Date.parse(t.updated_at):0,f=g?Ht(g):null,y=p(ce,{children:[a("div",{className:"ow-pr-head-top",children:c}),
p("div",{className:"ow-pr-title-line",children:[a("span",{className:"ow-block-name",children:l}),t?.title&&a("span",{className:"\
ow-pr-number",children:e.label.replace(/^github\s*/,"")})]})]});return p("div",{className:"ow-pr-head",children:[o?a(ye,
{onActivate:o,className:"ow-pr-head-click","aria-expanded":!n,children:y}):y,p("div",{className:"ow-pr-status-line",children:[
t?.author&&a("span",{children:t.author}),t?.title&&p(ce,{children:[p("span",{className:"ow-pr-adds",children:["+",t.additions??
0]}),p("span",{className:"ow-pr-dels",children:["\u2212",t.deletions??0]})]}),f&&p("span",{children:["Updated ",f]}),t?.
available&&(t.total??0)>0?a("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:(t.failing??
0)>0?`${t.failing} failing \xB7 ${t.passing??0}/${t.total} passing`:(t.pending??0)>0?`${t.passing??0}/${t.total} checks \
passing`:`All checks passed ${t.passing??0}/${t.total}`}):e.status&&a("span",{className:"ow-pr-dot","data-bad":r?"true":
void 0,children:e.status})]})]})}function Zs({checks:e}){return e?.title?p("div",{className:"ow-pr-detail",children:[p("\
div",{className:"ow-pr-files-head",children:[p("span",{children:[e.changed_files??0," Files Changed"]}),p("span",{className:"\
ow-pr-adds",children:["+",e.additions??0]}),p("span",{className:"ow-pr-dels",children:["\u2212",e.deletions??0]})]}),(e.
files??[]).length>0&&p("div",{className:"ow-pr-files",children:[(e.files??[]).map(t=>p("div",{className:"ow-pr-file",children:[
a("span",{className:"ow-truncate ow-formal-mono",children:t.path}),p("span",{className:"ow-pr-adds",children:["+",t.additions]}),
p("span",{className:"ow-pr-dels",children:["\u2212",t.deletions]})]},t.path)),(e.changed_files??0)>(e.files??[]).length&&
p("div",{className:"ow-pr-file ow-pr-more",children:["+",(e.changed_files??0)-(e.files??[]).length," more files"]})]})]}):
null}function er({reference:e,onOpenSession:t}){let n=Ds[e.kind],o=p(ce,{children:[a(n,{className:"ow-icon"}),a("span",{
className:"ow-truncate",children:e.label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.url,
target:"_blank",rel:"noopener noreferrer",onClick:r=>r.stopPropagation(),children:o}):e.sessionKey?a(ye,{className:"ow-r\
eference ow-reference-link",onActivate:()=>t(e.sessionKey),children:o}):a("span",{className:"ow-reference",children:o})}
function Ft({item:e,selected:t,continuation:n,whyRanked:o,onSelect:r,onOpenSession:l,onAnswerPermission:d,permissionBusy:c,
onRetry:g,retryBusy:f,onStop:y,stopBusy:i,onPickStep:m,onSnooze:v,onHandled:W,hideBadge:k,compact:I,headless:E,dot:P,simple:D,
onDecideApproval:L,sessionMismatch:_,onFixSessionName:xe}){let[oe,ue]=S(!1);return p(ye,{onActivate:r,className:"ow-row",
"aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"dat\
a-testid":`work-item-${e.id}`,children:[p("div",{className:"ow-row-layout",children:[p("div",{className:"ow-row-content",
children:[!E&&p("div",{className:"ow-row-heading",children:[P&&a("span",{className:`ow-dot ow-dot-${P}`,"aria-hidden":"t\
rue"}),!D&&(k?e.state==="done"&&a(wo,{className:"ow-icon ow-row-check","aria-hidden":"true"}):qs(e)),a("span",{className:"\
ow-row-title",children:e.title})]}),(!I&&!D||t)&&e.summary&&!(e.nextSteps??[]).some(C=>C.what?.trim()===e.summary)&&a("p",
{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&(!D||t)&&p(ye,{className:"ow-row-duplicate",onActivate:()=>l(
e.duplicateOf.sessionKey),children:[a(mt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:te(
`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&
a(st,{children:p("div",{className:"ow-related",children:[a("span",{className:"ow-related-label",children:te("related_ses\
sions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.map(C=>p(ye,{className:"ow-related-row",onActivate:()=>l(
C.sessionKey),children:[a(mt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:C.title}),
a("span",{className:"ow-related-why",children:te(`related_${C.because}`)})]},C.sessionKey)),e.relatedMore?a("span",{className:"\
ow-related-more",children:te("related_more",{count:String(e.relatedMore)})}):null]})}),o&&(!D||t)&&a("div",{className:"o\
w-row-why",children:o}),!n&&(!D||t)&&p("div",{className:"ow-row-meta",children:[a("span",{className:"ow-truncate",children:e.
provenance}),po(e).length>0&&a("span",{"aria-hidden":"true",children:"\xB7"}),a("span",{className:"ow-references",children:po(
e).slice(0,3).map(C=>a(er,{reference:C,onOpenSession:l},`${C.kind}:${C.id}`))})]}),_&&xe&&p("div",{className:"ow-row-mis\
match",children:[p("span",{className:"ow-truncate",children:["This session's name only mentions ",_.sessionGoal," \u2014 this\
 is ",_.itemGoal," work"]}),a("button",{type:"button",className:"ow-mismatch-fix",onClick:C=>{C.stopPropagation(),xe()},
children:"Rename session to cover both"})]})]}),a("div",{className:"ow-row-actions",children:a(ne,{className:"ow-icon","\
aria-hidden":"true"})})]}),t&&m&&e.nextSteps&&e.nextSteps.length>0&&a(st,{children:p("div",{className:"ow-row-steps",children:[
a("div",{className:"ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,oe?void 0:Dt).map((C,pe)=>a("bu\
tton",{type:"button",className:"ow-quote-step",title:C.why??C.what,onClick:ge=>{ge.stopPropagation(),m(C.what)},children:C.
what},`${pe}:${C.what}`)),e.nextSteps.length>Dt&&a("button",{type:"button",className:"ow-steps-more",onClick:C=>{C.stopPropagation(),
ue(pe=>!pe)},children:oe?"Show fewer":`+${e.nextSteps.length-Dt} more`})]})}),t&&e.retryPath&&g&&a(st,{children:a("div",
{className:"ow-retry",children:a(G,{onClick:()=>g(e.retryPath),disabled:!!f,children:"Retry"})})}),t&&e.stopPath&&y&&a(st,
{children:a("div",{className:"ow-retry",children:a(G,{onClick:()=>y(e.stopPath),disabled:!!i,children:i?"Stopping\u2026":
"Stop this loop"})})}),t&&e.permissionId&&L&&a(st,{children:a(js,{item:e,busy:!!c,onDecide:C=>L(e,C)})}),e.state==="need\
s-you"&&v&&W&&p("div",{className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-aside-btn",onClick:C=>{
C.stopPropagation(),v(e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",onClick:C=>{C.stopPropagation(),
W(e.id,e.updatedAt)},children:"Handled"})]})]})}var tr=["unblock","followup","running","done"],nr={unblock:{label:"UNBLO\
CK",cls:"ow-lane-unblock"},followup:{label:"FOLLOW UP",cls:"ow-lane-followup"}};function or(e){return e.state==="done"?"\
done":e.state==="running"?"running":ft(e)??"unblock"}function sr({items:e,selectedId:t,onSelect:n,onOpenSession:o,onAnswerPermission:r,
onDecideApproval:l,permissionBusy:d,onRetry:c,retryBusy:g,onPickStep:f,onSnooze:y,onHandled:i,doneTitles:m}){let[v,W]=S(
!1),k=new Map;for(let I of e){let E=or(I),P=k.get(E);P?P.push(I):k.set(E,[I])}return p(ce,{children:[tr.filter(I=>k.has(
I)).map(I=>{let E=k.get(I),P=I==="unblock"||I==="followup"?nr[I]:null,D=P?E.map(_=>_.action!=="resume"?je(be(_),te):""):
[],L=P&&D.length>0&&D.every(_=>_&&_===D[0])?D[0]:void 0;return p("div",{className:"ow-lane",children:[P&&p("div",{className:"\
ow-lane-head",children:[a("span",{className:`ow-lane-badge ${P.cls}`,children:P.label}),L&&a("span",{className:"ow-lane-\
reason",children:L})]}),E.map(_=>a(Ft,{item:_,hideBadge:!0,compact:!0,selected:t===_.id,continuation:!0,whyRanked:L?void 0:
_.state==="needs-you"&&_.action!=="resume"?je(be(_),te):void 0,onSelect:()=>n(_),onOpenSession:o,onAnswerPermission:r,onDecideApproval:l,
permissionBusy:d,onRetry:c,retryBusy:g,onPickStep:f,onSnooze:y,onHandled:i},_.id))]},I)}),!k.has("done")&&m&&m.length>0&&
p("div",{className:"ow-lane ow-lane-done",children:[p("button",{type:"button",className:"ow-goals-toggle","aria-expanded":v,
onClick:()=>W(I=>!I),children:[a(ne,{className:"ow-icon","data-open":v?"true":void 0,"aria-hidden":"true"}),m.length," d\
one"]}),v&&a("ul",{className:"ow-done-list",children:m.map(I=>p("li",{className:"ow-row-goal-done",children:[a(wo,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:I})]},I))})]})]})}function Ve({title:e,items:t,
selectedId:n,onSelect:o,onOpenSession:r,onAnswerPermission:l,onDecideApproval:d,permissionBusy:c,onRetry:g,retryBusy:f,onStop:y,
stopBusy:i,onPickStep:m,onSnooze:v,onHandled:W,footer:k,collapsed:I,onToggleCollapsed:E,groupBy:P,prChecks:D,prFilter:L,
doneBySession:_,goalVerdicts:xe,onSplitGoal:oe,onMergeGoal:ue,initiativeBlocks:C,initiatives:pe,onRenameSession:ge,collapsedInitiatives:Be,
onToggleInitiative:ke,selectedGoalKey:Ke,onSelectGoal:$e,subtitle:Ye,hideHeader:rt,emptyLabel:Je}){let F=Lt(t,P,xe),fe=P===
"pr"&&L&&L!=="all"?F.filter(b=>b.changeRef&&Kt(b.changeRef,D?.[b.changeRef.url??""])===L):F,J=C??[],Xe=P==="goal"?J.length:
P==="pr"?fe.length:t.length,se=b=>{let R=b.changeRef?D?.[b.changeRef.url??""]:void 0,U=b.header==="pr"?Be?.[b.key]??!((R?.
failing??0)>0||b.items.some(A=>A.state==="needs-you")):!1;return p("div",{className:"ow-block","data-grouped":b.header?"\
true":void 0,children:[b.header==="session"&&b.sessionKey&&a(Ys,{item:b.items[0],onOpen:()=>r(b.sessionKey)}),b.header===
"pr"&&b.changeRef&&a(Qs,{reference:b.changeRef,checks:R,folded:U,onToggle:ke?()=>ke(b.key,!U):void 0}),b.header==="goal"&&
a(Hs,{block:b,onSplit:oe,selected:Ke===b.key,onSelect:$e?()=>$e(b.key):void 0}),b.header==="pr"?!U&&p(ce,{children:[a(Zs,
{checks:R}),p("div",{className:"ow-pr-sessions",children:[a("span",{className:"ow-pr-sublabel-inline",children:"Sessions"}),
Ln(b.items).map(A=>p("button",{type:"button",className:"ow-reference ow-reference-link ow-pr-session-chip",onClick:()=>r(
A.sessionKey),children:[a(Ut,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:A.label})]},
A.sessionKey))]})]}):b.header==="session"?a(sr,{items:b.items,doneTitles:b.sessionKey?_?.[b.sessionKey]:void 0,selectedId:n,
onSelect:o,onOpenSession:r,onAnswerPermission:l,onDecideApproval:d,permissionBusy:c,onRetry:g,retryBusy:f,onPickStep:m,onSnooze:v,
onHandled:W}):b.items.map(A=>p(Xn,{children:[a(Ft,{item:A,selected:n===A.id,continuation:b.header==="session",whyRanked:A.
state==="needs-you"&&A.action!=="resume"?je(be(A),te):void 0,onSelect:()=>o(A),onOpenSession:r,onAnswerPermission:l,onDecideApproval:d,
permissionBusy:c,onRetry:g,retryBusy:f,onStop:y,stopBusy:i,onPickStep:m,onSnooze:v,onHandled:W}),P==="goal"&&ue&&n===A.id&&
a(fo,{item:A,items:t,onMerge:ue})]},A.id))]},b.key)},_e=b=>{let R=pe&&ge?Gn(b,pe):null,U=b.references.find(A=>A.kind==="\
session")?.label??"";return p(Xn,{children:[a(Ft,{item:b,selected:n===b.id,dot:Fn(b),simple:!0,sessionMismatch:R??void 0,
onFixSessionName:R&&b.sessionKey?()=>ge(b.sessionKey,`${U} & ${R.itemGoal}`.slice(0,200)):void 0,whyRanked:b.state==="ne\
eds-you"&&b.action!=="resume"?je(be(b),te):void 0,onSelect:()=>o(b),onOpenSession:r,onAnswerPermission:l,onDecideApproval:d,
permissionBusy:c,onRetry:g,retryBusy:f,onPickStep:m,onSnooze:v,onHandled:W}),ue&&n===b.id&&a(fo,{item:b,items:t,onMerge:ue})]},
b.id)},at=b=>{if(b.name){let X=Be?.[b.key]??b.status!=="needs-you",q=b.blocks.flatMap(re=>re.items),Z=ot(q);return a(qt,
{open:!X,onToggle:()=>ke?.(b.key,!X),label:b.name,flag:Z.needsYou>0?`${Z.needsYou} need you`:ve[b.status],flagWarn:Z.needsYou>
0,meta:Ot(q),header:a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:b.name}),children:X?a(go,
{members:q}):q.map(re=>_e(re))},b.key)}let R=b.blocks[0];if(R.header==="goal"){let X=Be?.[b.key]??b.status!=="needs-you",
q=R.items[0],Z=ot(R.items),re=[];for(let T=0;T<R.items.length;T+=1)for(let Qe=T+1;Qe<R.items.length;Qe+=1)re.push(he(R.items[T],
R.items[Qe]));let it=new Set(R.items.map(T=>T.sessionKey).filter(Boolean)).size,Se=zn(R.items)??(it>1?`${it} sessions, o\
ne goal`:q.references.find(T=>T.kind==="session")?.label??q.title);return a(qt,{open:!X,onToggle:()=>ke?.(b.key,!X),label:Se,
flag:Z.needsYou>0?`${Z.needsYou} need you`:ve[b.status],flagWarn:Z.needsYou>0,meta:Ot(R.items),why:Tn(R.items,xe),header:p(
ye,{onActivate:()=>$e?.(R.key),className:"ow-goalcard-header ow-goal-tab","aria-pressed":Ke===R.key,"data-selected":Ke===
R.key?"true":void 0,children:[a(mt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block\
-name ow-goalcard-title",children:Se})]}),action:oe&&a(G,{className:"ow-block-open",title:"Not the same goal \u2014 split int\
o separate cards","aria-label":`Split ${q.title}`,onClick:T=>{T.stopPropagation(),oe(re)},children:"Split"}),children:X?
a(go,{members:R.items}):R.items.map(T=>_e(T))},b.key)}let U=R.items[0],A=U.references.find(X=>X.kind==="session")?.label;
if(!A||A===U.title)return _e(U);let Pe=ot(R.items);return a(qt,{open:!0,label:A,flag:Pe.needsYou>0?`${Pe.needsYou} need \
you`:ve[U.state],flagWarn:Pe.needsYou>0,meta:Ot(R.items),header:a("span",{className:"ow-truncate ow-block-name ow-goalca\
rd-title",children:A}),children:_e(U)},b.key)};return p("section",{className:"ow-section","aria-label":e,children:[rt?null:
E?p(ye,{onActivate:E,className:"ow-section-toggle",children:[a(uo,{label:e,count:Xe,subtitle:Ye}),a(ne,{className:"ow-ic\
on ow-section-chevron","data-open":I?void 0:"true","aria-hidden":"true"})]}):a(uo,{label:e,count:Xe,subtitle:Ye}),I?null:
a("div",{className:"ow-section-list",children:P==="goal"?J.length===0?a("p",{className:"ow-section-empty",children:Je}):
J.map(at):fe.length===0?a("p",{className:"ow-section-empty",children:Je}):fe.map(se)}),k]})}function rr(e,t){let n=Rn(t,
te);if(!e)return["Crew Manager context: workspace overview.",...n,"Answer the user about the state of their work. This i\
s a conversation, not an action channel."].join(`
`);let o=e.references.map(l=>`${l.kind}: ${l.label} (${l.id})`).join(`
`),r=[e.stalledFor?`Silent for ${De(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(l=>!!l);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,
`State: ${ve[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...r.length>0?[`Why it is on the board:
${r.join(`
`)}`]:[],`References:
${o}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(l=>!!l).join(`
`)}function ar(){let e=Bs(),t=le(e);t.current=e;let n=Ks(),o=$s(),[r,l]=S("all"),[d,c]=S(()=>de(so,null)??"prs"),g=O(s=>{
c(u=>{let w=u===s?null:s;return Q(so,w),w})},[]),[f,y]=S(()=>de(ao,null)==="session"?"session":"goal"),[i,m]=S("all"),[v,
W]=S({}),[k,I]=S(null),[E,P]=S("session"),[D,L]=S(null),[_,xe]=S(null),[oe,ue]=S({}),[C,pe]=S("unknown"),ge=le("unknown"),
Be=le(new Map),[ke,Ke]=S({}),[$e,Ye]=S({}),[rt,Je]=S([]),[F,fe]=S(null),[J,Xe]=S(null),[se,_e]=S(null),[at,b]=S(()=>de(Tt)),
[R,U]=S(()=>de(eo)),[A,Pe]=S(()=>de(zt,{merged:[],split:[]})),X=le(de(no,[])),[q,Z]=S([]),[re,it]=S(()=>de(oo)),[Se,T]=S(
null),[Qe,yo]=S(()=>de(to,null)??!0),[Vt,Yt]=S({}),[wt,xo]=S([]),[ht,Jt]=S(()=>de(ro,null)??io),[bt,Xt]=S(!1),Qt=le(!0),
[ko,Zt]=S(!0),[en,vt]=S(null),[_o,So]=S(!1),[tn,ae]=S(null),M=le(!0),Ze=le(0),yt=le(!1);V(()=>(M.current=!0,()=>{M.current=
!1,Ze.current+=1}),[]);let K=O(async()=>{let s=++Ze.current,u=t.current;try{let[w,h,x,N,Ge,dt,$,we]=await Promise.all([u.
get("/api/chat/slots"),u.get("/api/approvals"),u.get("/api/spawn"),u.get("/api/workflows/runs"),u.get("/api/crons"),u.get(
"/api/artifacts"),u.get("/api/autonudge").catch(()=>({loops:[]})),u.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);
if(!M.current||s!==Ze.current)return;xe({slots:Array.isArray(w)?w:[],approvals:Array.isArray(h)?h:[],agents:Array.isArray(
x.agents)?x.agents:[],workflows:Array.isArray(N.runs)?N.runs:[],crons:Array.isArray(Ge.jobs)?Ge.jobs:[],artifacts:Array.
isArray(dt.artifacts)?dt.artifacts:[],loops:Array.isArray($?.loops)?$.loops:[]}),xo(Array.isArray(we?.runs)?we.runs:[]),
vt(null)}catch(w){M.current&&s===Ze.current&&vt(w instanceof Error?w:new Error("Unable to load Crew Manager sources"))}finally{
M.current&&s===Ze.current&&Zt(!1)}},[]);V(()=>{K();let s=window.setInterval(()=>{K()},zs);return()=>window.clearInterval(
s)},[K]);let No=()=>{Zt(!0),vt(null),K()};V(()=>{if(!_||ge.current==="unsupported"||ge.current==="disabled")return;let s=Vn(
_.slots,He).filter(w=>Be.current.get(w.key)!==Et(w));if(s.length===0)return;let u=!1;return(async()=>{let{summaries:w,support:h}=await Yn(
s,x=>t.current.get(x));if(!(u||!M.current)&&(ge.current=h,pe(h),h==="available")){for(let x of s)w[x.key]&&Be.current.set(
x.key,Et(x));ue(x=>({...x,...w}))}})(),()=>{u=!0}},[_]),V(()=>{if(!_||!Qt.current)return;let s=!1;return(async()=>{try{let u=await t.
current.get("/api/apps/crew-manager/stalls");if(s||!M.current)return;let w={};for(let x of u?.stalls??[])x?.key&&(w[x.key]=
x);Ke(w);let h={};for(let x of u?.error_loops??[])x?.key&&(h[x.key]=x);Yt(h)}catch{Qt.current=!1,M.current&&(Ke({}),Yt({}))}})(),
()=>{s=!0}},[_]),V(()=>{let s=!1;return(async()=>{try{let u=await t.current.get("/api/apps/crew-manager/initiatives");if(s||
!M.current)return;Z((u?.initiatives??[]).filter(w=>w?.name))}catch{}})(),()=>{s=!0}},[]);let nn=j(()=>An(Mn(_??{slots:[],
approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},te,oe,ke,Vt,A),$e),[_,oe,ke,Vt,$e,A]),lt=j(()=>Kn(nn,
at,R),[nn,at,R]),B=j(()=>lt.items.filter(s=>$n(s)),[lt]),xt=j(()=>Mt(B),[B]),on=j(()=>{let s={};for(let u of B){if(u.state!==
"done"||!u.sessionKey)continue;let w=s[u.sessionKey];w?w.push(u.title):s[u.sessionKey]=[u.title]}return s},[B]),me=j(()=>B.
find(s=>s.id===k)??null,[B,k]),et=j(()=>r==="all"?B:B.filter(s=>s.state===r),[r,B]),kt=j(()=>{let s={all:0,failing:0,running:0,
merged:0};for(let u of Lt(B,"pr")){if(!u.changeRef)continue;s.all++;let w=Kt(u.changeRef,v[u.changeRef.url??""]);w!=="ot\
her"&&s[w]++}return s},[B,v]);V(()=>{let s=new Set;for(let w of B)for(let h of w.references)h.kind==="change"&&h.url&&/\/pull\/\d|\/merge_requests\/\d/.
test(h.url)&&s.add(h.url);let u=!1;for(let w of s)v[w]||t.current.post("/api/source/pull-request",{url:w}).then(h=>{!u&&
M.current&&h?.title&&W(x=>({...x,[w]:Xs(h)}))}).catch(()=>{});return()=>{u=!0}},[B,v]),V(()=>o(xt["needs-you"]),[xt,o]),
V(()=>{k&&!B.some(s=>s.id===k)&&I(null)},[B,k]),V(()=>{Q(ao,f)},[f]),V(()=>{Q(ro,ht)},[ht]);let sn=le(null);V(()=>{if(!bt)
return;let s=w=>{let h=sn.current?.getBoundingClientRect();if(!h||h.width===0)return;let x=(w.clientX-h.left)/h.width*100;
Jt(Math.max(Es,Math.min(Ts,x)))},u=()=>Xt(!1);return window.addEventListener("mousemove",s),window.addEventListener("mou\
seup",u),()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",u)}},[bt]);let _t=_?.slots.
find(s=>s.key===He),Ro=!!(_t||_o);V(()=>{!_||_t||yt.current||(yt.current=!0,e.post("/api/chat/slots",{name:He,title:"Con\
ductor"}).then(()=>{M.current&&(So(!0),K())}).catch(s=>{M.current&&(yt.current=!1,ae(s instanceof Error?`Conductor sessi\
on could not be created: ${s.message}`:"Conductor session could not be created"))}))},[e,_t,K,_]);let rn=j(()=>kn(_?.approvals??
[],rt,s=>B.find(u=>u.sessionKey===s)?.title??_?.slots?.find(u=>u.key===s)?.title??s),[B,_,rt]),Me=me&&!me.permissionId?me:
null,Ne=j(()=>Un(B,q,A,X.current),[B,q,A]);V(()=>{let s=En(Ne.filter(u=>u.name===null).flatMap(u=>u.blocks));X.current=s,
Q(no,s)},[Ne]);let ee=j(()=>{if(!Se)return null;for(let s of Ne){let u=s.blocks.find(w=>w.key===Se);if(u&&u.items.length>
0)return u}return null},[Se,Ne]),H=ee?jn(ee.items):null,St=j(()=>{let s=(_?.loops??[]).filter(h=>h&&h.active!==!1&&h.slot_key);
if(s.length===0)return[];let u=new Map,w=new Map;for(let h of B)for(let x of h.references)x.kind!=="session"||!x.id||x.label&&
!u.has(x.id)&&u.set(x.id,x.label);for(let h of Ne)if(h.name)for(let x of h.blocks)for(let N of x.items)N.sessionKey&&!w.
has(N.sessionKey)&&w.set(N.sessionKey,h.name);return s.map(h=>{let x=Number(h.cycle_count)||0,N=Number(h.max_cycles)||0;
return{key:h.slot_key,title:u.get(h.slot_key)??h.slot_key,goalName:w.get(h.slot_key)??null,progress:N>0?`${x}/${N}`:`${x}\
 ${x===1?"cycle":"cycles"}`,remaining:N>0?Math.max(0,N-x):null,instruction:(h.message??"").replace(/\s+/g," ").trim(),lastFire:z(
h.last_fire_ts)}})},[_,B,Ne]),Le=j(()=>{let s=new Date;s.setHours(0,0,0,0);let u=s.getTime(),w=u+864e5,h=_?.crons??[],x=new Map;
for(let $ of wt){let we=z($.started_at);if(!$.job_id||we<u||we>=w)continue;let ie=x.get($.job_id)??{count:0,failed:0,last:0};
ie.count+=1,$.status&&$.status!=="success"&&(ie.failed+=1),ie.last=Math.max(ie.last,we),x.set($.job_id,ie)}let N=h.map($=>{
let we=x.get($.id),ie=z($.next_run_ts),To=ie>=u&&ie<w;return{job:$,ran:we,next:ie,dueToday:To}}).filter($=>$.ran||$.dueToday||
$.job.is_running),Ge=N.filter($=>$.ran&&$.ran.failed===0).length,dt=N.filter($=>$.ran&&$.ran.failed>0).length;return{rows:N,
done:Ge,failed:dt,total:N.length,historyKnown:wt.length>0}},[_,wt]),[Io,an]=S(!1),Co=j(()=>{if(f!=="goal")return[];let s=Dn(
_?.slots??[],q),u=qn(B,q),w=new Set,h=[];for(let x of[...u,...s])w.has(x.name.toLowerCase())||(w.add(x.name.toLowerCase()),
h.push(x));return h.sort((x,N)=>N.sessions-x.sessions)},[f,_,B,q]),Wo=O(async(s,u)=>{try{await t.current.patch(`/api/cha\
t/slots/${encodeURIComponent(s)}/title`,{title:u}),K()}catch{}},[K]),Ao=O(async(s,u=[])=>{if(s.trim()){an(!0);try{let w=await t.
current.post("/api/apps/crew-manager/initiatives",{name:s.trim(),aliases:u});M.current&&w?.initiatives&&Z(w.initiatives.
filter(h=>h?.name))}catch{}finally{M.current&&an(!1)}}},[]),Re=O(async(s,u)=>{if(!F){fe(s),ae(null);try{await t.current.
post(`/api/approvals/${encodeURIComponent(s)}/${u?"approve":"reject"}`,{}),K()}catch(w){ae(w instanceof Error?`Could not\
 answer that request: ${w.message}`:"Could not answer that request"),K()}finally{M.current&&fe(null)}}},[K,F]),Ee=O(async(s,u)=>{
if(!(F||!s.permissionId||!s.sessionKey)){fe(s.permissionId),ae(null);try{await t.current.post(`/api/chat/slots/${encodeURIComponent(
s.sessionKey)}/approve`,{action:u,request_id:s.permissionId}),K()}catch(w){ae(w instanceof Error?`Could not answer that \
request: ${w.message}`:"Could not answer that request"),K()}finally{M.current&&fe(null)}}},[K,F]),Bo=O(s=>{b(u=>{let w=Object.
fromEntries(Object.entries(u).filter(([,h])=>h>Date.now()));return w[s]=Date.now()+Bn,Q(Tt,w),w}),I(null)},[]),Ko=O((s,u)=>{
U(w=>{let h={...w,[s]:u};return Q(eo,h),h}),I(null)},[]),$o=O(()=>{b({}),Q(Tt,{})},[]),Po=O(s=>{Pe(u=>{let w={merged:u.merged.
filter(h=>!s.includes(h)),split:[...new Set([...u.split,...s])]};return Q(zt,w),w})},[]),Mo=O(s=>{Pe(u=>{let w={merged:[
...new Set([...u.merged,s])],split:u.split.filter(h=>h!==s)};return Q(zt,w),w})},[]),Lo=O(()=>{yo(s=>(Q(to,!s),!s))},[]),
Te=O(async s=>{if(!J){Xe(s),ae(null);try{await t.current.post(s,{}),K()}catch(u){ae(u instanceof Error?`Could not re-run\
 it: ${u.message}`:"Could not re-run it"),K()}finally{M.current&&Xe(null)}}},[K,J]),tt=O(async s=>{if(!se){_e(s),ae(null);
try{await t.current.del(s),L("Stopped the monitor loop. Re-arming it is done from the session itself."),K()}catch(u){let w=u instanceof
Error?u.message:"";/404|not found/i.test(w)?L("That loop had already stopped."):ae(w?`Could not stop it: ${w}`:"Could no\
t stop it"),K()}finally{M.current&&_e(null)}}},[K,se]),Ie=O(async s=>{if(ee&&H?.sessionKey){let w=H.sessionKey,h=ee.items.
map(N=>`- ${N.references.find(Ge=>Ge.kind==="session")?.label??N.sessionKey}: ${ve[N.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(w)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${ee.items[0].title}", which spans sessions:`,h,"You are the session actively on it, so the instructi\
on is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:w}).catch(N=>{if(!(N instanceof
SyntaxError))throw N}),!M.current)return;Ye(N=>({...N,[H.id]:Date.now()})),Je(N=>N.includes(w)?N:[...N,w]);let x=H.references.
find(N=>N.kind==="session")?.label??H.title;L(H.moving||H.state==="running"?`Sent to ${x} \u2014 the active session on this g\
oal`:`Sent to ${x} \u2014 resuming the last session on this goal`),T(null),K();return}let u=me&&!me.permissionId?me:null;
if(E==="session"&&u?.sessionKey){let w=u.sessionKey;if(await t.current.post("/api/chat",{message:s,slot:w}).catch(h=>{if(!(h instanceof
SyntaxError))throw h}),!M.current)return;Ye(h=>({...h,[u.id]:Date.now()})),Je(h=>h.includes(w)?h:[...h,w]),L(`Sent new i\
nstructions to ${u.title}`),I(null),K();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(He)}/context`,
{content:rr(me,B),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:He}).
catch(w=>{if(!(w instanceof SyntaxError))throw w})},[me,ee,H,B,K,E]),Nt={"needs-you":et.filter(s=>s.state==="needs-you"),
running:et.filter(s=>s.state==="running"),done:et.filter(s=>s.state==="done")},ln=O((s,u)=>{it(w=>{let h={...w,[s]:u};return Q(
oo,h),h})},[]),Eo=O(s=>{T(u=>u===s?null:s),I(null),L(null)},[]),ze=s=>n(`/chat?sid=${encodeURIComponent(s)}`),Oe=s=>{I(u=>u===
s.id?null:s.id),T(null),L(null),P("session")};return p("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",
children:[a("style",{children:Jn}),a(Ls,{title:"Crew Manager",subtitle:"See what needs your input, what is still running\
, and what finished recently."}),a("div",{className:"ow-body",children:p("div",{className:"ow-layout",ref:sn,children:[p(
"div",{className:"ow-main",style:{flexBasis:`${ht}%`},children:[p("section",{className:"ow-card ow-listcard","aria-label":"\
Work",children:[p("div",{className:"ow-listcard-head",children:[a("div",{className:"ow-tabs",role:"tablist","aria-label":"\
View",children:["goal","session"].map(s=>a(G,{role:"tab","aria-selected":f===s,"data-selected":f===s,className:"ow-tab",
onClick:()=>y(s),children:s==="goal"?"Goals":"Sessions"},s))}),p("div",{className:"ow-listcard-tools",children:[a("p",{className:"\
ow-listcard-sub",children:f==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each sessi\
on needs from you"}),f==="session"&&a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.
keys(Gt).map(s=>p(G,{onClick:()=>l(s),"aria-pressed":r===s,"data-selected":r===s,className:"ow-filter",children:[Gt[s],a(
"span",{className:"ow-count",children:xt[s]})]},s))})]})]}),a("main",{className:"ow-work",children:a("div",{className:"o\
w-work-inner",children:ko?a(Qn,{rows:7}):en&&!_?a(Zn,{icon:a(mo,{className:"ow-icon"}),title:"Crew Manager could not loa\
d the work view",subtitle:en.message,action:a(G,{onClick:No,children:"Try again"})}):(f==="goal"?B.length===0:et.length===
0)?a(Zn,{icon:a(Cs,{className:"ow-icon"}),title:"No matching work",subtitle:f==="goal"?"No sessions are running yet.":"C\
hange the filter to see sessions in another state."}):f==="goal"?a(Ve,{title:"Work by goal",hideHeader:!0,items:B,selectedId:k,
onSelect:Oe,onOpenSession:ze,onAnswerPermission:(s,u)=>{Re(s,u)},onDecideApproval:(s,u)=>{Ee(s,u)},permissionBusy:F!==null,
onRetry:s=>{Te(s)},retryBusy:J!==null,onPickStep:s=>{Ie(s)},groupBy:f,goalVerdicts:A,onSplitGoal:Po,onMergeGoal:Mo,initiativeBlocks:Ne,
initiatives:q,onRenameSession:(s,u)=>{Wo(s,u)},collapsedInitiatives:re,onToggleInitiative:ln,selectedGoalKey:Se,onSelectGoal:Eo,
footer:a(Us,{candidates:Co,prominent:q.length===0,busy:Io,onAdd:(s,u)=>{Ao(s,u)}}),emptyLabel:"No matching work"}):r==="\
all"?p(ce,{children:[a(Ve,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:Nt["needs-you"],doneBySession:on,
selectedId:k,onSelect:Oe,onSnooze:Bo,onHandled:Ko,footer:lt.snoozedCount>0?p("button",{type:"button",className:"ow-aside\
-note",onClick:$o,children:[lt.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:ze,onAnswerPermission:(s,u)=>{
Re(s,u)},onDecideApproval:(s,u)=>{Ee(s,u)},permissionBusy:F!==null,onRetry:s=>{Te(s)},retryBusy:J!==null,onStop:s=>{tt(s)},
stopBusy:se!==null,onPickStep:s=>{Ie(s)},groupBy:f,emptyLabel:"Nothing needs your input right now."}),a(Ve,{title:"In pr\
ogress",subtitle:"Being worked on right now",items:Nt.running,doneBySession:on,selectedId:k,onSelect:Oe,onOpenSession:ze,
onAnswerPermission:(s,u)=>{Re(s,u)},onDecideApproval:(s,u)=>{Ee(s,u)},permissionBusy:F!==null,onRetry:s=>{Te(s)},retryBusy:J!==
null,onStop:s=>{tt(s)},stopBusy:se!==null,onPickStep:s=>{Ie(s)},groupBy:f,emptyLabel:"Nothing is in progress right now."}),
a(Ve,{title:"Done recently",subtitle:"Finished in the last few days",items:Nt.done,selectedId:k,onSelect:Oe,collapsed:Qe,
onToggleCollapsed:Lo,onOpenSession:ze,onAnswerPermission:(s,u)=>{Re(s,u)},onDecideApproval:(s,u)=>{Ee(s,u)},permissionBusy:F!==
null,onRetry:s=>{Te(s)},retryBusy:J!==null,onStop:s=>{tt(s)},stopBusy:se!==null,onPickStep:s=>{Ie(s)},groupBy:f,emptyLabel:"\
No recent completed work."})]}):a(Ve,{title:Gt[r],items:et,selectedId:k,onSelect:Oe,onOpenSession:ze,onAnswerPermission:(s,u)=>{
Re(s,u)},onDecideApproval:(s,u)=>{Ee(s,u)},permissionBusy:F!==null,onRetry:s=>{Te(s)},retryBusy:J!==null,onStop:s=>{tt(s)},
stopBusy:se!==null,onPickStep:s=>{Ie(s)},groupBy:f,emptyLabel:"No matching work"})})})]}),p("div",{className:"ow-stack",
children:[p("details",{className:"ow-card ow-stack-card",open:d==="prs",children:[p("summary",{onClick:s=>{s.preventDefault(),
g("prs")},children:[p("span",{className:"ow-stack-title",children:[a(ne,{className:"ow-icon ow-stack-chevron"}),a(jt,{className:"\
ow-icon"}),"PRs"]}),p(Y,{variant:"muted",children:[kt.all," open"]})]}),a("p",{className:"ow-stack-sub",children:"Open p\
ull requests your work touches"}),a("div",{className:"ow-stack-body",children:kt.all===0?a("p",{className:"ow-stack-empt\
y",children:"No work is linked to a PR right now. Work links to one when a session mentions its URL."}):p(ce,{children:[
a("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(co).map(s=>p(G,{onClick:()=>m(
s),"aria-pressed":i===s,"data-selected":i===s,className:"ow-filter",children:[co[s],a("span",{className:"ow-count",children:kt[s]})]},
s))}),a(Ve,{title:"Work by PR",items:B,prChecks:v,prFilter:i,collapsedInitiatives:re,onToggleInitiative:ln,selectedId:k,
onSelect:Oe,onOpenSession:ze,onAnswerPermission:(s,u)=>{Re(s,u)},onDecideApproval:(s,u)=>{Ee(s,u)},permissionBusy:F!==null,
onRetry:s=>{Te(s)},retryBusy:J!==null,onStop:s=>{tt(s)},stopBusy:se!==null,onPickStep:s=>{Ie(s)},groupBy:"pr",emptyLabel:"\
No PR matches that status."})]})})]}),p("details",{className:"ow-card ow-stack-card",open:d==="loops",children:[p("summa\
ry",{onClick:s=>{s.preventDefault(),g("loops")},children:[p("span",{className:"ow-stack-title",children:[a(ne,{className:"\
ow-icon ow-stack-chevron"}),a(vo,{className:"ow-icon"}),"Loops"]}),a(Y,{variant:"muted",children:St.length})]}),a("p",{className:"\
ow-stack-sub",children:"Sessions repeating a goal until it is done"}),a("div",{className:"ow-stack-body",children:St.length===
0?a("p",{className:"ow-stack-empty",children:"No loop is running right now."}):St.map(s=>{let u=Ht(s.lastFire),w=[u&&`la\
st tick ${u}`,s.remaining!==null&&`${s.remaining} remaining`].filter(Boolean).join(" \xB7 ");return p("div",{className:"\
ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),p("div",{children:[p("div",{className:"\
ow-mini-title",children:[s.goalName??s.title,a("span",{className:"ow-mini-chip",children:s.progress})]}),s.instruction&&
a("div",{className:"ow-mini-desc",title:s.instruction,children:s.instruction}),w&&a("div",{className:"ow-mini-when",children:w})]}),
a(Y,{variant:"ok",children:"Active"})]},s.key)})})]}),p("details",{className:"ow-card ow-stack-card",open:d==="schedule",
children:[p("summary",{onClick:s=>{s.preventDefault(),g("schedule")},children:[p("span",{className:"ow-stack-title",children:[
a(ne,{className:"ow-icon ow-stack-chevron"}),a(bo,{className:"ow-icon"}),"Scheduled tasks"]}),p(Y,{variant:Le.failed>0?"\
err":"muted",children:[Le.done,"/",Le.total," today"]})]}),a("p",{className:"ow-stack-sub",children:Le.historyKnown?"Tod\
ay's runs only \u2014 jobs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may\
 be low"}),a("div",{className:"ow-stack-body",children:Le.rows.length===0?a("p",{className:"ow-stack-empty",children:"No\
thing is scheduled for today."}):Le.rows.map(({job:s,ran:u,next:w,dueToday:h})=>{let x=!!(u&&u.failed>0),N=[u&&`ran toda\
y ${lo(u.last)}${u.count>1?` (${u.count}x)`:""}`,h&&w?`next ${lo(w)}`:null].filter(Boolean).join(" \xB7 ");return p("div",
{className:"ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:x?"var(--danger)":s.enabled===!1?"va\
r(--muted)":"var(--warn)"}}),p("div",{children:[a("div",{className:"ow-mini-title",children:s.name}),s.schedule&&p("div",
{className:"ow-mini-desc",children:[s.schedule,s.cron_expr&&a("span",{className:"ow-mini-chip",children:s.cron_expr})]}),
N&&a("div",{className:"ow-mini-when",children:N})]}),s.is_running?a(Y,{variant:"aim",children:"Running"}):x?a(Y,{variant:"\
err",children:"Failed"}):s.enabled===!1?a(Y,{variant:"muted",children:"Paused"}):u?a(Y,{variant:"ok",children:"Success"}):
a(Y,{variant:"warn",children:"Pending"})]},s.id)})})]})]})]}),a("button",{type:"button",className:"ow-resizer","aria-lab\
el":"Resize columns","data-dragging":bt?"true":void 0,onMouseDown:s=>{s.preventDefault(),Xt(!0)},onDoubleClick:()=>Jt(io)}),
p("aside",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:p(
"div",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!Me&&a("span",{className:"ow-conductor-su\
b",children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:Ro?p("div",{className:"ow-chat\
-panel",children:[rn.length>0&&a("div",{className:"ow-permissions",role:"alert",children:rn.map(s=>a(Fs,{tool:s.tool,purpose:s.
purpose,where:s.sessionLabel,busy:F!==null,onAnswer:u=>{Re(s.id,u)}},s.id))}),D&&p("div",{className:"ow-conductor-receip\
t",role:"status",children:[a(ho,{className:"ow-icon"}),D]}),tn&&a("div",{className:"ow-chat-error",role:"alert",children:tn}),
a("div",{className:"ow-embed",children:a(Ps,{slotKey:He,frameless:!0,startAtBottom:!0,placeholder:ee?"Instruction for th\
is goal\u2026":Me?.sessionKey&&E==="session"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:Ie})}),
ee&&H?p("div",{className:"ow-quote ow-quote-docked",children:[p("div",{className:"ow-quote-body ow-quote-goal",children:[
p("div",{className:"ow-quote-line",children:[a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"\
ow-quote-title",title:ee.items[0].title,children:ee.items[0].title})]}),p("span",{className:"ow-quote-route ow-truncate",
children:["\u2192 ",H.references.find(s=>s.kind==="session")?.label??H.title,H.moving||H.state==="running"?" (active)":"\
 (will resume)"]})]}),a(G,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{T(null),L(null)},
children:"Clear"})]}):Me&&p("div",{className:"ow-quote ow-quote-docked",children:[p("div",{className:"ow-quote-body",children:[
Me.sessionKey?a("button",{type:"button",className:"ow-scope-toggle","aria-pressed":E==="conductor","aria-label":E==="ses\
sion"?"Sending to this session. Activate to send to the Conductor instead.":"Sending to the Conductor. Activate to send \
to this session instead.",onClick:()=>P(s=>s==="session"?"conductor":"session"),children:E==="session"?"Instructing":"To\
 Conductor"}):a("span",{className:"ow-eyebrow",children:"Quoted"}),a("span",{className:"ow-quote-title",title:Me.title,children:Me.
title})]}),a(G,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{I(null),L(null)},children:"\
Clear"})]})]}):a("div",{className:"ow-chat-loading",children:a(Qn,{rows:4})})})]})]})})]})}export{ar as default};
