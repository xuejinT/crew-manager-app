import{Fragment as vo,useCallback as O,useEffect as j,useMemo as Y,useRef as de,useState as S}from"react";import{AlertTriangle as Lo,
Bot as Zs,Check as To,ChevronRight as me,Check as Oo,Clock as zo,Package as er,ExternalLink as ln,MessageSquare as dn,RefreshCw as tr,
Shield as nr,Waves as Go,Search as or,Tag as sr,Users as rn,Zap as rr}from"lucide-react";import{useAppApi as ar,useNavigate as ir,
useNavBadge as lr,ChatEmbed as dr}from"@kirocrew/app-sdk";import{Badge as ee,Btn as z,ContentSkeleton as yo,EmptyState as ko,
Input as cr,PageHeader as ur}from"@kirocrew/app-sdk/ui";function Xe(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),s=t%
60;return s===0?`${n} hour${n===1?"":"s"}`:`${n}h ${s}m`}function cs(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function Ut(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function Gn(e,t,n){let s=new Set(t.filter(Boolean));if(s.size===0)return[];
let r=new Set,i=[];for(let d of e){let u=d.slot;!u||!s.has(u)||!d.id||r.has(d.id)||(r.add(d.id),i.push({id:d.id,sessionKey:u,
sessionLabel:n(u),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return i}var Cn={"needs-you":0,running:1,done:2};function D(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function us(e,t){
if(e.paused)return"";let n=D(e.next_run_ts);if(!n)return"";let s=Math.round((n-t)/1e3);return s<=0?"":Xe(s)}var Wn=72;function Le(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let r=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(r.length<=Wn)return r;let i=r.slice(0,Wn),d=i.lastIndexOf(" ");return`${(d>24?i.slice(0,d):i).trim()}\u2026`}
function Te(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var ps=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
gs=/^\((?:code|diff|widget|image)\)$/,fs=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
ms=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,ws=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
hs=/[?？]["'”’)\]]*$/;function Dn(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||gs.test(t)||ps.test(
t)?null:t}function Ht(e){if(!e.waiting_for_input)return null;let t=Dn(e);return!t||fs.test(t)||ms.test(t)?null:ws.test(t)||
hs.test(t)?t:null}function An(e){return e.pending_approval||Ht(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":Te(e)?"needs-you":"done"}function bs(e,t){if(e.pending_approval)return t("approval_waiting");let n=Ht(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):Te(e)?t("linked_change_issue"):Dn(e)??t("recent_w\
ork_ready"))}function Gt(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function vs(e){return e.pending_approval?"review-approval":Ht(e)?"reply":"open"}function qn(e){
return(e.source_links??[]).map(t=>({number:String(t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.
kind==="issue"?`issue #${t.number}`:`${t.provider} #${t.number}`,url:t.url,sessionKey:e.key,status:cs(t)}}))}function ys(e,t){
let n=qn(e).map(s=>s.ref);return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:bs(e,t),state:An(e),moving:An(
e)==="running"||void 0,issue:Te(e),updatedAt:D(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:Gt(
e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:Te(e)||void 0,action:vs(e),references:[{kind:"session",id:e.key,label:e.
title||t("untitled_work"),sessionKey:e.key},...n]}}function Yt(e,t){e.references.some(n=>n.kind===t.kind&&n.id===t.id)||
e.references.push(t)}function Fn(e){return(e.source||"").toLowerCase()==="subagent"}function ks(e,t,n){let s=Fn(t);e.state=
"needs-you",e.updatedAt=Math.max(e.updatedAt,D(t.ts)),e.summary=n(s?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=
s?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=
t.tool_purpose,e.permissionInput=t.tool_input,Yt(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),sessionKey:t.
slot||e.sessionKey})}function xs(e,t,n){e.updatedAt=Math.max(e.updatedAt,D(t.started)),e.issue||=!!(t.done&&(t.error||t.
outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_failed",{task:t.
task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),Yt(e,{kind:"agent",id:t.id,label:t.agent||
n("agent"),sessionKey:t.parent||e.sessionKey})}function _s(e,t,n){e.issue||=t.status==="failed",t.status==="running"&&e.
state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow_failed",{name:t.
name})),Yt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function Ss(e,t){
if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"dropped":return"\
done";case"in-progress":return"running";default:return null}}function Ns(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function Rs(e){let t=null,n=-1;for(let s of e){let r=s.last_touched_turn??0;r>n&&(n=r,t=s)}return t}function Is(e,t){let n=e.next_steps?.find(r=>r.what?.trim())?.what?.trim();if(n)return n;let s=[...e.progress??[]].reverse().
find(r=>r.trim());return s?s.trim():e.initial_intent?.trim()||t("work_in_progress")}var Cs=3;function Ws(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function As(e,t){if(!t)return!1;
let n=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${n}\\b`,"u").test(e)}function Bn(e,t){if(e.length===
0)return[];let n=Ws(t);return e.filter(s=>As(n,s.number)).map(s=>s.ref)}function Bs(e,t,n){if(!t?.enabled)return[];let s=t.
intents??[];if(s.length===0)return[];let r=qn(e),i=[],d=Rs(s),m=!!(e.running||e.subagents_running||e.orchestrating)?[]:s.
filter(l=>l.state==="in-progress");m.forEach(l=>{let f=s.indexOf(l),v=(l.next_steps??[]).filter(C=>C.what?.trim());i.push(
{id:`unattended:${e.key}:${f}`,title:Le(l.title,e.title||n("untitled_work")),summary:v[0]?.what?.trim()||n("no_next_step"),
state:"needs-you",issue:Te(e),updatedAt:D(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:Gt(e,n),
queuedBehind:e.queue_depth||void 0,changeBlocked:Te(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...Bn(r,l)],nextSteps:v,progress:(l.progress??[]).filter(
C=>C.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0})}),s.forEach((l,f)=>{if(m.includes(l))return;let v=Ss(
l,e);if(!v)return;let C=(l.next_steps??[]).filter(_=>_.what?.trim());i.push({id:`intent:${e.key}:${f}`,title:Le(l.title,
e.title||n("untitled_work")),summary:Is(l,n),state:v,issue:!1,updatedAt:D(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.
key,provenance:Gt(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:Te(e)||void 0,unverified:l.verified===!1||void 0,
action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...Bn(r,l)],nextSteps:C,
progress:(l.progress??[]).filter(_=>_.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0,moving:Ns(l,e,d)||void 0})});
let g=i.filter(l=>l.state==="needs-you"),k=i.filter(l=>l.state!=="needs-you").sort((l,f)=>(f.lastTouchedTurn??0)-(l.lastTouchedTurn??
0));return[...g,...k].slice(0,Math.max(Cs,g.length))}var jn=new Set(["crew-manager-conductor","overwatch-conductor"]),Ms={
approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,run_failed:55,stalled:50,change_blocked:40,
nobody_on_it:30,queued_behind:12,waiting_a_while:8},Ks=3;function $s(e,t){return e.updatedAt?Math.max(0,Math.floor((t-e.
updatedAt)/36e5)):0}var St=5;function Un(e,t,n=Date.now()){let s=Vt(e),r=eo(e.filter(d=>d.state==="needs-you"),n),i=[`Fl\
eet: ${s["needs-you"]} waiting on the user, ${s.running} in progress, ${s.done} finished recently.`];return r.length===0?
(i.push("Nothing is waiting on the user."),i):(i.push(`Waiting on the user, in the order the list shows them (top ${Math.
min(St,r.length)}):`),r.slice(0,St).forEach((d,u)=>{let m=et(Re(d,n),t),g=d.sessionKey?` [session ${d.sessionKey}]`:"";i.
push(`${u+1}. ${d.title} \u2014 ${d.summary} (${m})${g}`)}),r.length>St&&i.push(`\u2026and ${r.length-St} more waiting.`),
i)}var Oe=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that","with","from","into",
"be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run","why","what","how","again",
"still","not"]),Mn=.6,Kn=2,Hn=new Set;function Dt(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").
split(/\s+/).filter(t=>t.length>2&&!Oe.has(t)))]}function Nt(e,t){let n=Dt(e),s=Dt(t);if(n.length<Kn||s.length<Kn)return 0;
let r=n.length<=s.length?n:s,i=new Set(n.length<=s.length?s:n);return r.filter(u=>i.has(u)).length/r.length}function $n(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Pn(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function En(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}var Ps=new Set(
["pull request","pull requests","status update","work in progress","code review","follow up","next step","next steps","a\
ction item","action items","kiro crew","in progress","needs you"]);function Qe(e){let t=new Set,n=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??
[];for(let s of n){let r=s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(i=>i.length>
3&&i.endsWith("s")&&!i.endsWith("ss")?i.slice(0,-1):i);for(;r.length&&Oe.has(r[0]);)r.shift();for(;r.length&&Oe.has(r[r.
length-1]);)r.pop();if(!(r.length<2))for(let i=r.length;i>=2;i-=1)for(let d=0;d+i<=r.length;d+=1){let u=r.slice(d,d+i).join(
" ");Ps.has(u)||t.add(u)}}return[...t]}function Yn(e){let t=new Set;if(e.length<Es)return t;let n=new Map;for(let s of e)
for(let r of Qe(s.title))n.set(r,(n.get(r)??0)+1);for(let[s,r]of n)r/e.length>=Ls&&t.add(s);return t}var Es=4,Ls=.75;function Ze(e,t,n=Hn){
if($n(e).find(d=>$n(t).includes(d)))return"same_change";if(Pn(e).find(d=>Pn(t).includes(d)))return"same_artifact";let i=Qe(
t.title).filter(d=>!n.has(d));if(Qe(e.title).some(d=>i.includes(d)))return"same_deliverable";if(Nt(e.title,t.title)>=Mn)
return"same_topic";for(let d of En(e))for(let u of En(t))if(Nt(d,u)>=Mn)return"same_step";return null}function Vn(e,t){return e.
parentId===t.id||t.parentId===e.id?"spawned":Ln(e).includes(t.id)||Ln(t).includes(e.id)?"references":null}function Ln(e){
let t=[];for(let n of e.references)n.kind==="artifact"?t.push(`artifact:${n.id}`):n.kind==="workflow"?t.push(`workflow:${n.
id}`):n.kind==="agent"?t.push(`agent:${n.id}`):n.kind==="monitor"&&t.push(`monitor:${n.id}`,`loop:${n.id}`);return t.filter(
n=>n!==e.id)}var gt={merged:[],split:[]};function Rt(e){return`${e.sessionKey??e.id}|${Dt(e.title).join(" ")}`}function le(e,t){
return[Rt(e),Rt(t)].sort().join("")}function Ts(e,t=gt){let n=e.filter(r=>r.state!=="done"&&r.sessionKey).sort((r,i)=>(r.
updatedAt||0)-(i.updatedAt||0)),s=Yn(n);for(let r=1;r<n.length;r+=1){let i=n[r];for(let d=0;d<r;d+=1){let u=n[d];if(u.sessionKey===
i.sessionKey||t.split.includes(le(i,u)))continue;let m=Ze(i,u,s);if(m){i.duplicateOf={sessionKey:u.sessionKey,title:u.title,
because:m};break}}}Os(n,t,s)}var zt=3,It=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function Os(e,t,n=Hn){
for(let s of e){let r=[],i=new Set;for(let d of e){let u=d.sessionKey;if(u===s.sessionKey||i.has(u)||t.split.includes(le(
s,d)))continue;let m=Ze(s,d,n);m&&(i.add(u),r.push({sessionKey:u,title:d.title,because:m}))}r.length!==0&&(r.sort((d,u)=>It.
indexOf(d.because)-It.indexOf(u.because)),s.relatedSessions=r.slice(0,zt),r.length>zt&&(s.relatedMore=r.length-zt))}}var zs=3e4;
function Jn(e,t,n=Date.now()){return Object.keys(t).length===0?e:e.map(s=>{let r=t[s.id];return!r||n-r>zs||s.state==="ru\
nning"?s:{...s,state:"running",moving:!0,instructed:!0}})}function Re(e,t=Date.now()){let n=[],s=(i,d,u=1)=>{n.push({signal:i,
weight:Ms[i]*u,values:d})};e.approvalKind==="subagent"?s("subagent_gate"):e.approvalKind==="tool"&&s("approval_owed"),e.
action==="reply"&&s("input_requested"),e.unverified&&s("unverified_completion"),e.loopRepeats&&s("error_loop",{repeats:String(
e.loopRepeats)}),e.runFailed&&s("run_failed"),e.stalledFor&&s("stalled",{duration:Xe(e.stalledFor)}),e.changeBlocked&&s(
"change_blocked"),e.unattendedGoals&&s("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&s("queued_behin\
d",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let r=$s(e,t);return r>0&&s("waiting_a_while",{hours:String(
r)},Math.min(r,Ks)),n.sort((i,d)=>d.weight-i.weight),{score:n.reduce((i,d)=>i+d.weight,0),signals:n}}var Gs={approval_owed:"\
unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"\
unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function Ct(e,t=Date.now()){if(e.state!=="n\
eeds-you")return null;for(let n of Re(e,t).signals){let s=Gs[n.signal];if(s)return s}return null}var Xn=14400*1e3;function Qn(e,t,n,s=Date.
now()){let r=0,i=[];for(let d of e){if(d.state!=="needs-you"){i.push(d);continue}let u=t[d.id];if(u&&u>s){r+=1;continue}
let m=n[d.id];if(m!==void 0&&d.updatedAt<=m){i.push({...d,state:"done",issue:!1});continue}i.push(d)}return{items:i,snoozedCount:r}}
var Ds=4320*60*1e3;function Zn(e,t=Date.now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=Ds}var qs={"ne\
eds-you":1,running:-1,done:-1};function Fs(e,t,n){let s=e.updatedAt>0,r=t.updatedAt>0;return!s&&!r?0:s?r?(e.updatedAt-t.
updatedAt)*n:-1:1}function et(e,t){let n=e.signals.slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(r=>t(
`rank_${r.signal}`,r.values)).join(t("rank_join"))}function eo(e,t=Date.now()){let n=new Map(e.map(s=>[s.id,Re(s,t)]));return[
...e].sort((s,r)=>{let i=Cn[s.state]-Cn[r.state];if(i!==0)return i;if(s.state==="needs-you"){let d=(n.get(r.id)?.score??
0)-(n.get(s.id)?.score??0);if(d!==0)return d}else if(s.issue!==r.issue)return s.issue?-1:1;return Fs(s,r,qs[s.state])})}
function to(e,t,n={},s={},r={},i=gt,d=Date.now()){let u=new Map,m=new Map;for(let l of e.slots){if(!l.key||jn.has(l.key)||
l.memory_mode==="incognito")continue;let f=Bs(l,n[l.key],t);if(f.length>0){for(let _ of f)u.set(_.id,_);let C=f.find(_=>_.
state==="needs-you")??f[0];m.set(l.key,C);continue}let v=ys(l,t);u.set(v.id,v),m.set(l.key,v)}for(let[l,f]of Object.entries(
s)){let v=m.get(l);v&&(v.state="needs-you",v.issue=!0,v.stalledFor=f.silent_secs,v.summary=f.reason?t("stalled_because",
{reason:f.reason,duration:Xe(f.silent_secs)}):t("stalled_for",{duration:Xe(f.silent_secs)}),v.action="open")}for(let[l,f]of Object.
entries(r)){let v=m.get(l);v&&(v.state="needs-you",v.issue=!0,v.loopRepeats=f.repeats,v.summary=t("error_loop",{tool:f.tool,
repeats:String(f.repeats)}),v.action="open")}for(let l of e.approvals){let f=l.slot?m.get(l.slot):void 0;if(f){ks(f,l,t);
continue}u.set(`approval:${l.id}`,{id:`approval:${l.id}`,title:Le(l.tool||l.source,t("approval_needed")),summary:l.tool_purpose||
t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:D(l.ts),provenance:t("approval"),action:"review-approval",approvalKind:Fn(
l)?"subagent":"tool",permissionId:l.id,permissionTool:l.tool||l.source,permissionPurpose:l.tool_purpose,permissionInput:l.
tool_input,references:[{kind:"approval",id:l.id,label:l.tool||l.source||t("approval")}]})}for(let l of e.agents){let f=l.
parent?m.get(l.parent):void 0;if(f){xs(f,l,t);continue}let v=!!(l.done&&(l.error||l.outcome==="failed"));l.parent&&!v||u.
set(`agent:${l.id}`,{id:`agent:${l.id}`,title:Le(l.task||l.agent,t("agent_work")),summary:v?l.error?.trim()||t("agent_fa\
iled",{task:l.task}):l.done?t("agent_done"):t("work_in_progress"),state:v?"needs-you":l.done?"done":"running",issue:v,runFailed:v||
void 0,retryPath:v&&!l.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(l.id)}/retry`:void 0,updatedAt:D(l.started),
provenance:l.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:l.id,label:l.agent||t("agent")}]})}for(let l of e.
workflows){let f=l.session_key?m.get(l.session_key):void 0;if(f){_s(f,l,t);continue}let v=l.status==="failed";u.set(`wor\
kflow:${l.run_id}`,{id:`workflow:${l.run_id}`,title:Le(l.name,l.run_id),summary:v?t("workflow_failed_generic"):l.status===
"running"?t("workflow_running"):t("workflow_finished"),state:v?"needs-you":l.status==="running"?"running":"done",issue:v,
runFailed:v||void 0,retryPath:v?`/api/workflows/runs/${encodeURIComponent(l.run_id)}/rerun`:void 0,updatedAt:0,provenance:t(
"workflow"),action:"discuss",references:[{kind:"workflow",id:l.run_id,label:l.name||l.run_id}]})}for(let l of e.crons){if(!l.
is_running&&l.last_status!=="error")continue;let f=l.last_status==="error",v=us(l,d),C=t(f?"monitor_failed":"monitor_run\
ning");u.set(`monitor:${l.id}`,{id:`monitor:${l.id}`,title:l.name,summary:v?`${C} ${t("monitor_next_check",{duration:v})}`:
C,state:f?"needs-you":"running",issue:f,runFailed:f||void 0,retryPath:f?`/api/crons/${encodeURIComponent(l.id)}/run`:void 0,
updatedAt:D(l.running_since||l.last_run_ts||l.created_ts),provenance:t("monitor"),action:f?"discuss":void 0,references:[
{kind:"monitor",id:l.id,label:l.name}]})}for(let l of e.loops||[]){if(!l.active)continue;let f=String(l.id||"");if(!f)continue;
let v=Math.max(0,Number(l.cycle_count)||0),C=Math.max(0,Number(l.max_cycles)||0),_=l.slot_key&&m.has(l.slot_key)?l.slot_key:
void 0;u.set(`loop:${f}`,{id:`loop:${f}`,title:Le(l.message||"",t("loop")),summary:C?t("loop_watching_capped",{cycles:String(
v),cap:String(C)}):t("loop_watching",{cycles:String(v)}),state:"running",issue:!1,updatedAt:D(l.last_fire_ts||l.created_ts),
sessionKey:_,parentId:_?m.get(_)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(f)}`,action:_?
"open":void 0,references:[{kind:"monitor",id:f,label:t("loop"),sessionKey:_},..._?[{kind:"session",id:_,label:m.get(_)?.
title||_,sessionKey:_}]:[]]})}let g=[...e.artifacts].sort((l,f)=>D(f.updated_at)-D(l.updated_at)).slice(0,8);for(let l of g){
let f=l.session_key&&m.has(l.session_key)?l.session_key:void 0;u.set(`artifact:${l.slug}`,{id:`artifact:${l.slug}`,title:Le(
l.name,t("artifact")),summary:l.description||t("artifact_ready",{kind:l.kind}),state:"done",issue:!1,updatedAt:D(l.updated_at||
l.created_at),sessionKey:f,parentId:f?m.get(f)?.id:void 0,provenance:l.session_title||l.source||t("artifact"),action:f?"\
open":void 0,references:[{kind:"artifact",id:l.slug,label:l.name,sessionKey:f},...f?[{kind:"session",id:f,label:l.session_title||
f,sessionKey:f}]:[]]})}let k=[...u.values()];return Ts(k,i),eo(k)}function Vt(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function no(e){let t=[],n=new Map;for(let s of e){let r=s.sessionKey;if(!r)continue;let i=n.get(r);if(i){i.count+=1;continue}
let d=s.references.find(m=>m.kind==="session")?.label??s.provenance,u={sessionKey:r,label:d,leading:s,count:1};n.set(r,u),
t.push(u)}return t}function Jt(e,t,n=gt,s){if(t==="pr")return js(e);if(t==="goal")return qt(e,n,s);let r=[],i=new Map;for(let d of e){
let u=d.sessionKey;if(!u){r.push({key:d.id,items:[d],header:null,sessionKey:null,changeRef:null});continue}let m=i.get(u);
if(m){m.items.push(d);continue}let g={key:u,items:[d],header:"session",sessionKey:d.sessionKey??null,changeRef:null};i.set(
u,g),r.push(g)}return r}function js(e){let t=[],n=new Map;for(let s of e){let r=s.references.filter(i=>i.kind==="change"||
i.kind==="issue");for(let i of r){let d=`${i.kind}:${i.id}`,u=n.get(d);if(u){u.items.push(s);continue}let m={key:d,items:[
s],header:"pr",sessionKey:null,changeRef:i};n.set(d,m),t.push(m)}}return t}var oo=["same_change","same_artifact","same_d\
eliverable"];function qt(e,t,n){let s=Yn(e),r=e.map((g,k)=>k),i=g=>{for(;r[g]!==g;)r[g]=r[r[g]],g=r[g];return g},d=(g,k)=>{
r[i(k)]=i(g)};for(let g=0;g<e.length;g+=1)for(let k=g+1;k<e.length;k+=1){let l=e[g],f=e[k],v=le(l,f);if(t.split.includes(
v))continue;if(Vn(l,f)){d(g,k);continue}if(t.merged.includes(v)){d(g,k);continue}if(n?.has(v)){d(g,k);continue}if(!l.sessionKey||
!f.sessionKey||l.sessionKey===f.sessionKey)continue;let C=Ze(l,f,s);C&&oo.includes(C)&&d(g,k)}let u=[],m=new Map;for(let g=0;g<
e.length;g+=1){let k=i(g),l=m.get(k);if(l){l.items.push(e[g]),l.header="goal";continue}let f={key:`goal:${e[g].id}`,items:[
e[g]],header:null,sessionKey:null,changeRef:null};m.set(k,f),u.push(f)}for(let g of u)g.key=Us(g.items);return u}function Us(e){
return`goal:${[...e.map(t=>t.id)].sort()[0]}`}var Hs=.5;function Ys(e,t){let n=new Set,s=new Set,r=[...e].sort((i,d)=>d.
items.length-i.items.length);for(let i of r){let d=new Set(i.items.map(Rt)),u=null;for(let m of t){if(n.has(m.key))continue;
let g=m.members.filter(l=>d.has(l)).length;if(!g)continue;let k=g/Math.min(d.size,m.members.length);k<Hs||(!u||k>u.score)&&
(u={key:m.key,score:k})}if(u&&(n.add(u.key),i.key=u.key),s.has(i.key)){let m=2;for(;s.has(`${i.key}~${m}`);)m+=1;i.key=`${i.
key}~${m}`}s.add(i.key)}return e}function so(e){return e.map(t=>({key:t.key,members:t.items.map(Rt)}))}function Ft(e,t){
let n=t.split(" ").map(s=>`${Vs(s)}s?`).join("[\\s/_,-]+");return e.match(new RegExp(n,"iu"))?.[0]??null}function Vs(e){
return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function ro(e,t=gt,n){if(e.length<2)return null;let s=null,r=null,i=null;
for(let d=0;d<e.length;d+=1)for(let u=d+1;u<e.length;u+=1){let m=e[d],g=e[u];if(Vn(m,g))return`${g.parentId===m.id?g.title:
m.title} was started by this work`;if(t.merged.includes(le(m,g)))return"you merged these";i??=n?.get(le(m,g))??null;let k=Ze(
m,g);if(!(!k||!oo.includes(k))&&(!s||It.indexOf(k)<It.indexOf(s))&&(s=k,k==="same_deliverable")){let l=Qe(g.title),f=Qe(
m.title).find(v=>l.includes(v))??null;r=f?Ft(m.title,f)??Ft(g.title,f)??f:null}}return s==="same_change"?"these sessions\
 work on the same change":s==="same_artifact"?"these sessions share the same output":s==="same_deliverable"?r?`both are \
about ${r}`:"both name the same deliverable":i}var Js=12;function ao(e){if(e.length<2)return null;let t=new Map;for(let m of e)
for(let g of Qe(m.title))t.set(g,(t.get(g)??0)+1);let n=Tn(t);if(n)return On(e,n)??n;let s=new Map;for(let m of e)for(let g of m.
references){if(g.kind!=="change"&&g.kind!=="issue")continue;let k=s.get(g.id);s.set(g.id,{label:g.label,members:(k?.members??
0)+1})}let r=[...s.values()].filter(m=>m.members>=2).sort((m,g)=>g.members-m.members)[0];if(r)return r.label;let i=new Map;
e.forEach((m,g)=>{for(let k of Xs(m.title))i.has(k)||i.set(k,new Set),i.get(k).add(g)});let d=new Map;for(let[m,g]of i)d.
set(m,g.size);let u=Tn(d);return u?On(e,u)??u:null}function Tn(e){return[...e.entries()].filter(([,t])=>t>=2).sort((t,n)=>n[1]-
t[1]||n[0].length-t[0].length)[0]?.[0]??null}function On(e,t){let n=null;for(let s of e){let r=Ft(s.title,t);if(r){if(/^\p{Lu}/u.
test(r))return r;n??=r}}return n}function Xs(e){let t=e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(
Boolean),n=[];for(let s=Math.min(t.length,Js);s>=2;s-=1)for(let r=0;r+s<=t.length;r+=1){let i=t.slice(r,r+s);Oe.has(i[0])||
Oe.has(i[s-1])||i[0].length<2||i[s-1].length<2||n.push(i.join(" "))}return n}function io(e,t){let n=e.references.find(s=>s.
kind==="session")?.label??"";for(let s of[e.title,n,e.provenance]){let r=jt(s,t);if(r)return r}return null}function jt(e,t){
let n=e.toLowerCase(),s=null;for(let r of t)for(let i of r.aliases)!i||!n.includes(i.toLowerCase())||(!s||i.length>s.length)&&
(s={name:r.name,length:i.length});return s?.name??null}function lo(e,t){let n=e.references.find(d=>d.kind==="session")?.
label??"";if(!n)return null;let s=jt(e.title,t);if(!s)return null;let r=t.find(d=>d.name===s);if(r&&r.aliases.some(d=>d&&
n.toLowerCase().includes(d.toLowerCase())))return null;let i=jt(n,t);return!i||i===s?null:{itemGoal:s,sessionGoal:i}}function co(e,t){
let n=t.flatMap(i=>i.aliases.map(d=>d.toLowerCase())),s=new Set(["workspace","workspaces","home","src","tmp","documents",
"desktop"]),r=new Map;for(let i of e){if(!i.key||jn.has(i.key)||i.memory_mode==="incognito")continue;let d=i.project;if(!d)
continue;let u=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!u||s.has(u.toLowerCase())||n.some(m=>u.toLowerCase().
includes(m)||m.includes(u.toLowerCase()))||r.set(u,(r.get(u)??0)+1)}return[...r.entries()].map(([i,d])=>({name:i,sessions:d})).
sort((i,d)=>d.sessions-i.sessions)}function uo(e,t){let n=new Map;for(let i of e){if(!i.sessionKey||io(i,t)!==null)continue;
let d=i.references.find(u=>u.kind==="session")?.label??"";for(let u of[i.title,d]){let m=u.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean);for(let g of[3,2])for(let k=0;k+g<=m.length;k+=1){let l=m.slice(k,k+g);if(Oe.has(l[0])||
Oe.has(l[g-1])||l[0].length<3||l[g-1].length<3)continue;let f=l.join(" ");n.has(f)||n.set(f,new Set),n.get(f).add(i.sessionKey)}}}
let s=[...n.entries()].map(([i,d])=>({phrase:i,sessions:d.size})).filter(i=>i.sessions>=2);return s.filter(i=>!s.some(d=>d.
phrase!==i.phrase&&d.phrase.includes(i.phrase)&&d.sessions>=i.sessions)).sort((i,d)=>d.sessions-i.sessions||d.phrase.length-
i.phrase.length).map(i=>({name:i.phrase.replace(/\p{L}+/gu,d=>d[0].toUpperCase()+d.slice(1)),sessions:i.sessions}))}function zn(e){
return e.some(t=>t.state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function po(e,t=Date.
now()){return e.issue?"crit":e.state==="needs-you"?Ct(e,t)==="followup"?"idle":"warn":"good"}function ft(e){let t=new Set,n=new Set,s=new Set,r=0,i=0,d=0,u=0,m=0;for(let g of e){g.sessionKey&&t.add(g.sessionKey);for(let k of g.
references)k.kind==="change"?n.add(k.id):k.kind==="issue"&&s.add(k.id);g.id.startsWith("workflow:")?r+=1:g.id.startsWith(
"monitor:")?i+=1:g.id.startsWith("agent:")&&(d+=1),g.state==="needs-you"&&(u+=1),g.updatedAt>m&&(m=g.updatedAt)}return{sessions:t.
size,prs:n.size,issues:s.size,loops:r,crons:i,agents:d,needsYou:u,lastActivityAt:m}}function go(e){let t=e.find(s=>s.moving);
if(t)return t;let n=e.find(s=>s.state==="running");return n||[...e].sort((s,r)=>(r.updatedAt||0)-(s.updatedAt||0))[0]}function Qs(e){
let t=[],n=new Set;for(let s of e){let r=s.sessionKey;!r||n.has(r)||(n.add(r),t.push(s.references.find(i=>i.kind==="sess\
ion")?.label??s.provenance))}return t}function fo(e,t,n=gt,s=[],r){let i=new Map,d=[],u=new Map;for(let f of e){let v=io(
f,t);if(u.set(f.id,v),v===null){d.push(f);continue}i.has(v)||i.set(v,[]),i.get(v).push(f)}let m=Ys(qt(d,n,r),s),g=new Map;
for(let f of m)g.set(f.items[0].id,f);let k=[],l=new Set;for(let f of e){let v=u.get(f.id)??null;if(v!==null){if(l.has(v))
continue;l.add(v);let _=i.get(v);k.push({key:`initiative:${v}`,name:v,status:zn(_),sessions:Qs(_),blocks:qt(_,n,r)});continue}
let C=g.get(f.id);C&&k.push({key:C.key,name:null,status:zn(C.items),sessions:[],blocks:[C]})}return k}function Xt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function wo(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,s)=>mo(s)-mo(n)).slice(0,12)}function mo(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function ho(e,t){
let n={},s="unknown";for(let r of e)try{let i=await t(`/api/chat/slots/${encodeURIComponent(r.key)}/summary`);if(!i||typeof i!=
"object"){s="unsupported";break}if(i.enabled===!1){s="disabled";break}n[r.key]=i,s="available"}catch{s="unsupported";break}
return{summaries:n,support:s}}var bo=String.raw`
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
  /* Tabs on the left, the updated-label + refresh on the right, sharing one
     baseline. The underline spans the whole row (moved here from .ow-tabs) so
     the right-side controls sit on the same rule as the tabs. */
  .ow-tabrow { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border); }
  .ow-tabs { display: flex; gap: 4px; }
  .ow-refreshbar { display: flex; align-items: center; gap: 8px; padding-bottom: 6px; }
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
`;import{Fragment as ve,jsx as a,jsxs as p}from"react/jsx-runtime";var Qt="crew-manager.snoozed",xo="crew-manager.handled",
_o="crew-manager.done-collapsed",Zt="crew-manager.goal-verdicts",So="crew-manager.goal-memory",Do="crew-manager.goal-sem\
antic.v5",en="crew-manager.goal-names.v2",pr=.7;function No(e){return V(Do,{pairs:[...e.pairs],why:[...e.why.entries()],
stamp:e.stamp}),e}var Ro="crew-manager.initiative-collapsed",Io="crew-manager.open-stack",Co="crew-manager.split",Wo="cr\
ew-manager.tab",Ao=40,gr=25,fr=75;function ce(e,t={}){try{let n=localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}
function V(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Wt(e,t=Date.now()){if(!e)return null;let n=Math.
max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let s=Math.round(n/60);if(s<60)return`${s}m ago`;let r=Math.round(
s/60);return r<24?`${r}h ago`:`${Math.round(r/24)}d ago`}function Bo(e){return e?new Date(e).toLocaleTimeString([],{hour:"\
numeric",minute:"2-digit"}):""}function tt(e,t,n){return e<=0?null:`${e} ${e===1?t:n}`}function tn(e,t=Date.now()){let n=ft(
e),s=[tt(n.sessions,"session","sessions"),tt(n.prs,"PR","PRs"),tt(n.issues,"issue","issues"),tt(n.loops,"loop","loops"),
tt(n.crons,"cron","crons"),tt(n.agents,"agent","agents")].filter(i=>!!i),r=Wt(n.lastActivityAt,t);return r&&s.push(`last\
 active ${r}`),s.join(" \xB7 ")}var nt="crew-manager-conductor",mr=5e3,wr={session:"Session",approval:"Approval",agent:"\
Agent",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval request",
subagent_gate_waiting:"Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer the request in the\
 work thread",decision_ready:"Make the decision this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"\
Open the linked change \u2014 a check is failing or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"\
Review the pending {{tool}} request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool\
 call",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"This agent stopped before finishing \u2014 \
nothing to do here",workflow_failed:"This workflow stopped before finishing",workflow_failed_generic:"This workflow stop\
ped before finishing",workflow_running:"Workflow is running",workflow_finished:"Workflow finished",monitor_failed:"The l\
atest check stopped before finishing",monitor_running:"Monitor is checking now",monitor_next_check:"Checks again in {{du\
ration}}.",loop:"Monitor loop",loop_watching:"Re-prompting its own session \u2014 {{cycles}} cycles so far, no limit set",
loop_watching_capped:"Re-prompting its own session \u2014 cycle {{cycles}} of {{cap}}",artifact_ready:"{{kind}} output i\
s ready",stalled_for:"Check on it \u2014 no activity for {{duration}}, still marked running",stalled_because:"{{reason}}\
 Silent for {{duration}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same linked change",
duplicate_same_artifact:"Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_deliverable:"Al\
so being worked in \u201C{{title}}\u201D \u2014 same deliverable",duplicate_same_topic:"Looks like the same work as \u201C{{t\
itle}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same work",related_sessions:"\
{{count}} other session(s) on this same work",related_same_change:"same change",related_same_artifact:"same artifact",related_same_deliverable:"\
same deliverable",related_same_topic:"similar goal",related_same_step:"same next step",related_more:"and {{count}} more",
rank_approval_owed:"only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"\
the agent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failu\
re has repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{\
duration}}",rank_change_blocked:"a linked change is failing or conflicting",rank_nobody_on_it:"nobody is on {{count}} un\
finished goal(s) in this session",no_next_step:"No next step recorded \u2014 nobody is on this",rank_queued_behind:"{{co\
unt}} more prompt(s) queued in this session",rank_waiting_a_while:"waiting {{hours}}h",rank_nothing_pressing:"nothing pr\
essing \u2014 ordered by recency",rank_join:", and ",error_loop:"{{tool}} has failed the same way {{repeats}} times in a\
 row",untitled_work:"Untitled work"};function fe(e,t={}){return wr[e].replace(/\{\{(\w+)\}\}/g,(n,s)=>t[s]??"")}var hr={
followup:"FOLLOW UP",unblock:"UNBLOCK"},Ie={"needs-you":"Needs you",running:"Running",done:"Done"},nn={all:"All","needs-\
you":"Needs you",running:"Running",done:"Done"},Mo={all:"All",failing:"Failing",running:"Running",merged:"Merged"},br={session:dn,
approval:Lo,agent:Zs,workflow:rr,monitor:Go,artifact:er,change:ln,issue:sr};function Ce({children:e,onActivate:t,...n}){
return a("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),
t())},children:e})}function Ko({label:e,count:t,subtitle:n}){return p("div",{className:"ow-section-header",children:[p("\
div",{className:"ow-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow\
-section-count",children:t})]}),n&&a("p",{className:"ow-section-subtitle",children:n})]})}function vr(e){if(e.state==="n\
eeds-you"){let t=Ct(e);return t?a(ee,{variant:"warn",className:"ow-verb",children:hr[t]}):null}return e.state==="running"?
e.moving?p(ee,{variant:"aim",children:[a(zo,{className:"ow-icon"}),Ie[e.state]]}):a(ee,{variant:"muted",children:"Queued"}):
p(ee,{variant:"ok",children:[a(Oo,{className:"ow-icon"}),Ie[e.state]]})}function yr({tool:e,purpose:t,busy:n,onAnswer:s,where:r}){return p("div",{className:"ow-permission",children:[p("div",{className:"\
ow-permission-body",children:[p("div",{className:"ow-permission-head",children:[a(nr,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),p("p",{className:"ow-permi\
ssion-what",children:[r&&p("span",{className:"ow-truncate",children:[r," "]}),r?"wants to run ":"Wants to run ",a("code",
{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),p("div",{className:"ow-permission-actions",children:[
a(z,{onClick:()=>s(!0),disabled:n,children:"Approve"}),a(z,{onClick:()=>s(!1),disabled:n,children:"Reject"})]})]})}function mt({
children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"ow-expand-inner",children:e})})}var on=3;
function $o(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function kr({
item:e,busy:t,onDecide:n}){let[s,r]=S(!1),i=e.permissionInput||"",d=i.trim().split(/\s+/)[0]||e.permissionTool||"";return p(
"div",{className:"ow-formal-approval",role:"presentation",onClick:u=>u.stopPropagation(),onKeyDown:u=>u.stopPropagation(),
children:[a("div",{className:"ow-formal-badge",children:"Waiting for approval"}),p("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&p("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),p("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("span",{className:"ow-formal-val ow-formal-mon\
o",children:i||"(no input details)"})]})]}),p("div",{className:"ow-formal-actions",children:[a(z,{disabled:t,onClick:()=>n(
"approved"),children:"Allow once"}),p("span",{className:"ow-trust-wrap",children:[p(z,{disabled:t,onClick:()=>r(u=>!u),"\
aria-expanded":s,children:["Trust ",a(me,{className:"ow-icon ow-trust-caret","data-open":s?"true":void 0,"aria-hidden":"\
true"})]}),s&&p("span",{className:"ow-trust-menu",role:"menu",children:[i&&a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{r(!1),n("trust_command")},children:"Trust this exact command"}),d&&p("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{r(!1),n("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{r(!1),
n("trust")},children:"Trust everything in this session"})]})]}),a(z,{className:"ow-formal-reject",disabled:t,onClick:()=>n(
"rejected"),children:"Reject"})]})]})}function xr({candidates:e,prominent:t,busy:n,onAdd:s}){let[r,i]=S(""),d=t?e:e.filter(
u=>u.sessions>=2);return p("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{className:"\
ow-bootstrap-head",children:t?"No big goals defined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&a(
"div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, or name\
 your own."}),d.length>0&&a("div",{className:"ow-bootstrap-chips",children:d.slice(0,4).map(u=>p("button",{type:"button",
className:"ow-bootstrap-chip",disabled:n,onClick:()=>s(u.name,[u.name]),children:[u.name," ",p("span",{className:"ow-boo\
tstrap-count",children:[u.sessions," session",u.sessions===1?"":"s"]})]},u.name))}),p("div",{className:"ow-bootstrap-cus\
tom",children:[a(cr,{value:r,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:u=>i(u.target.
value),onKeyDown:u=>{u.key==="Enter"&&r.trim()&&(s(r),i(""))}}),a(z,{disabled:n||!r.trim(),onClick:()=>{s(r),i("")},children:"\
Add goal"})]})]})}function Po({members:e}){let t=e[0],n=new Set(e.map(u=>u.sessionKey).filter(Boolean)).size,s=e.filter(
u=>u.state==="needs-you").length,r=e.filter(u=>u.state==="running").length,i=e.filter(u=>u.state==="done").length,d=[`${n}\
 session${n===1?"":"s"}`];return s&&d.push(`${s} need${s===1?"s":""} you`),r&&d.push(`${r} running`),i&&d.push(`${i} don\
e`),p("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),a("d\
iv",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}function sn({open:e,onToggle:t,label:n,flag:s,flagWarn:r,
meta:i,why:d,header:u,action:m,children:g}){return p("div",{className:"ow-block ow-goalcard","data-grouped":"true","data\
-open":e?"true":void 0,children:[p("div",{className:"ow-goalcard-summary",children:[t&&a("button",{type:"button",className:"\
ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":"Expand"} ${n??"goal"}`,onClick:t,children:a(me,{className:"\
ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-hidden":"true"})}),u,m,a("span",{className:`ow-goal-flag${r?"\
 ow-goal-flag-warn":""}`,children:s})]}),a("div",{className:"ow-goal-meta",children:i}),d&&p("div",{className:"ow-goal-w\
hy",children:["Grouped because ",d,"."]}),g]})}function _r({block:e,status:t,folded:n,onToggle:s,onSplit:r,selected:i,onSelect:d}){
let u=e.items[0],m=new Set(e.items.map(l=>l.sessionKey).filter(Boolean)).size,g=[];for(let l=0;l<e.items.length;l+=1)for(let f=l+
1;f<e.items.length;f+=1)e.items[l].sessionKey!==e.items[f].sessionKey&&g.push(le(e.items[l],e.items[f]));let k=p(ve,{children:[
s&&a("button",{type:"button",className:"ow-goal-fold","aria-label":n?`Expand ${u.title}`:`Collapse ${u.title}`,"aria-exp\
anded":!n,onClick:l=>{l.stopPropagation(),s()},children:a(me,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"\
true","aria-hidden":"true"})}),a(rn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-bloc\
k-name",children:u.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:Ie[t]}),p("span",{className:"\
ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),p("span",{className:"ow-truncate",children:[
m," sessions, one goal"]})]}),r&&a(z,{className:"ow-block-open",title:"Not the same goal \u2014 split into separate cards",
"aria-label":`Split ${u.title}`,onClick:l=>{l.stopPropagation(),r(g)},children:"Split"})]});return d?a(Ce,{onActivate:d,
className:"ow-block-tab ow-goal-tab","aria-pressed":i,"data-selected":i?"true":void 0,children:k}):a("div",{className:"o\
w-block-tab",children:k})}var Sr=.3;function Eo({item:e,items:t,onMerge:n}){let s=t.filter(r=>r.id!==e.id&&r.sessionKey&&
e.sessionKey&&r.sessionKey!==e.sessionKey).map(r=>({other:r,score:Ze(e,r)?1:Nt(e.title,r.title)})).filter(r=>r.score>=Sr).
sort((r,i)=>i.score-r.score).slice(0,2);return s.length===0?null:p("div",{className:"ow-merge-hint",children:[a("span",{
className:"ow-merge-hint-label",children:"Same goal?"}),s.map(({other:r})=>p("button",{type:"button",className:"ow-merge\
-hint-btn ow-truncate",onClick:()=>n(le(e,r)),children:["Merge with \u201C",r.title,"\u201D"]},r.id))]})}function Nr({item:e,
onOpen:t}){let n=e.references.find(r=>r.kind==="session"),s=e.references.filter(r=>r.kind!=="session");return p("div",{className:"\
ow-block-tab",children:[a(dn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",
children:n?.label??e.provenance}),p("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\
\xB7"}),a("span",{className:"ow-truncate",children:e.provenance}),s.slice(0,2).map(r=>a("span",{className:"ow-truncate",
children:r.label},`${r.kind}:${r.id}`))]}),a(z,{className:"ow-block-open",onClick:t,"aria-label":`Open ${n?.label??e.provenance}`,
children:"Open"})]})}var Rr=12;function Ir(e){let t=(e.checks??[]).filter(n=>n.bucket!=="skipped");return{available:!0,total:t.
length,passing:t.filter(n=>n.bucket==="passed").length,failing:t.filter(n=>n.bucket==="failed").length,pending:t.filter(
n=>n.bucket==="pending").length,title:e.title,state:e.state?e.state.toUpperCase():void 0,is_draft:!!e.draft,head:e.headBranch,
base:e.baseBranch,author:e.author,updated_at:e.updatedAt,additions:e.additions,deletions:e.deletions,changed_files:e.changedFiles,
files:(e.files??[]).slice(0,Rr).map(n=>({path:n.path,additions:n.additions,deletions:n.deletions}))}}function Cr({reference:e,
checks:t,folded:n,onToggle:s}){let r=e.status?/fail|conflict|closed/.test(e.status):!1,i=t?.title||e.label,d=t?.is_draft?
"Draft":t?.state?t.state.charAt(0)+t.state.slice(1).toLowerCase():null,u=p(ve,{children:[s&&a(me,{className:"ow-icon ow-\
init-chevron","data-open":n?void 0:"true","aria-hidden":"true"}),d&&a("span",{className:"ow-init-status","data-status":t?.
state==="MERGED"?"done":(t?.failing??0)>0?"needs-you":"running",children:d}),t?.head&&t?.base&&p("span",{className:"ow-t\
runcate ow-pr-branches ow-formal-mono",children:[t.head," \u2192 ",t.base]}),!(t?.head&&t?.base)&&a("span",{className:"o\
w-pr-branches"}),e.url&&a("a",{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferre\
r","aria-label":`Open ${e.label}`,onClick:l=>l.stopPropagation(),children:a(ln,{className:"ow-icon","aria-hidden":"true"})})]}),
m=t?.updated_at?Date.parse(t.updated_at):0,g=m?Wt(m):null,k=p(ve,{children:[a("div",{className:"ow-pr-head-top",children:u}),
p("div",{className:"ow-pr-title-line",children:[a("span",{className:"ow-block-name",children:i}),t?.title&&a("span",{className:"\
ow-pr-number",children:e.label.replace(/^github\s*/,"")})]})]});return p("div",{className:"ow-pr-head",children:[s?a(Ce,
{onActivate:s,className:"ow-pr-head-click","aria-expanded":!n,children:k}):k,p("div",{className:"ow-pr-status-line",children:[
t?.author&&a("span",{children:t.author}),t?.title&&p(ve,{children:[p("span",{className:"ow-pr-adds",children:["+",t.additions??
0]}),p("span",{className:"ow-pr-dels",children:["\u2212",t.deletions??0]})]}),g&&p("span",{children:["Updated ",g]}),t?.
available&&(t.total??0)>0?a("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:(t.failing??
0)>0?`${t.failing} failing \xB7 ${t.passing??0}/${t.total} passing`:(t.pending??0)>0?`${t.passing??0}/${t.total} checks \
passing`:`All checks passed ${t.passing??0}/${t.total}`}):e.status&&a("span",{className:"ow-pr-dot","data-bad":r?"true":
void 0,children:e.status})]})]})}function Wr({checks:e}){return e?.title?p("div",{className:"ow-pr-detail",children:[p("\
div",{className:"ow-pr-files-head",children:[p("span",{children:[e.changed_files??0," Files Changed"]}),p("span",{className:"\
ow-pr-adds",children:["+",e.additions??0]}),p("span",{className:"ow-pr-dels",children:["\u2212",e.deletions??0]})]}),(e.
files??[]).length>0&&p("div",{className:"ow-pr-files",children:[(e.files??[]).map(t=>p("div",{className:"ow-pr-file",children:[
a("span",{className:"ow-truncate ow-formal-mono",children:t.path}),p("span",{className:"ow-pr-adds",children:["+",t.additions]}),
p("span",{className:"ow-pr-dels",children:["\u2212",t.deletions]})]},t.path)),(e.changed_files??0)>(e.files??[]).length&&
p("div",{className:"ow-pr-file ow-pr-more",children:["+",(e.changed_files??0)-(e.files??[]).length," more files"]})]})]}):
null}function Ar({reference:e,onOpenSession:t}){let n=br[e.kind],s=p(ve,{children:[a(n,{className:"ow-icon"}),a("span",{
className:"ow-truncate",children:e.label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.url,
target:"_blank",rel:"noopener noreferrer",onClick:r=>r.stopPropagation(),children:s}):e.sessionKey?a(Ce,{className:"ow-r\
eference ow-reference-link",onActivate:()=>t(e.sessionKey),children:s}):a("span",{className:"ow-reference",children:s})}
function an({item:e,selected:t,continuation:n,whyRanked:s,onSelect:r,onOpenSession:i,onAnswerPermission:d,permissionBusy:u,
onRetry:m,retryBusy:g,onStop:k,stopBusy:l,onPickStep:f,onSnooze:v,onHandled:C,hideBadge:_,compact:W,headless:G,dot:L,simple:q,
onDecideApproval:T,sessionMismatch:N,onFixSessionName:We}){let[we,ye]=S(!1);return p(Ce,{onActivate:r,className:"ow-row",
"aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"dat\
a-testid":`work-item-${e.id}`,children:[p("div",{className:"ow-row-layout",children:[p("div",{className:"ow-row-content",
children:[!G&&p("div",{className:"ow-row-heading",children:[L&&a("span",{className:`ow-dot ow-dot-${L}`,"aria-hidden":"t\
rue"}),!q&&(_?e.state==="done"&&a(To,{className:"ow-icon ow-row-check","aria-hidden":"true"}):vr(e)),a("span",{className:"\
ow-row-title",children:e.title})]}),(!W&&!q||t)&&e.summary&&!(e.nextSteps??[]).some(A=>A.what?.trim()===e.summary)&&a("p",
{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&(!q||t)&&p(Ce,{className:"ow-row-duplicate",onActivate:()=>i(
e.duplicateOf.sessionKey),children:[a(rn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:fe(
`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&
a(mt,{children:p("div",{className:"ow-related",children:[a("span",{className:"ow-related-label",children:fe("related_ses\
sions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.map(A=>p(Ce,{className:"ow-related-row",onActivate:()=>i(
A.sessionKey),children:[a(rn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:A.title}),
a("span",{className:"ow-related-why",children:fe(`related_${A.because}`)})]},A.sessionKey)),e.relatedMore?a("span",{className:"\
ow-related-more",children:fe("related_more",{count:String(e.relatedMore)})}):null]})}),s&&(!q||t)&&a("div",{className:"o\
w-row-why",children:s}),!n&&(!q||t)&&p("div",{className:"ow-row-meta",children:[a("span",{className:"ow-truncate",children:e.
provenance}),$o(e).length>0&&a("span",{"aria-hidden":"true",children:"\xB7"}),a("span",{className:"ow-references",children:$o(
e).slice(0,3).map(A=>a(Ar,{reference:A,onOpenSession:i},`${A.kind}:${A.id}`))})]}),N&&We&&p("div",{className:"ow-row-mis\
match",children:[p("span",{className:"ow-truncate",children:["This session's name only mentions ",N.sessionGoal," \u2014 this\
 is ",N.itemGoal," work"]}),a("button",{type:"button",className:"ow-mismatch-fix",onClick:A=>{A.stopPropagation(),We()},
children:"Rename session to cover both"})]})]}),a("div",{className:"ow-row-actions",children:a(me,{className:"ow-icon","\
aria-hidden":"true"})})]}),t&&f&&e.nextSteps&&e.nextSteps.length>0&&a(mt,{children:p("div",{className:"ow-row-steps",children:[
a("div",{className:"ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,we?void 0:on).map((A,ke)=>a("bu\
tton",{type:"button",className:"ow-quote-step",title:A.why??A.what,onClick:xe=>{xe.stopPropagation(),f(A.what)},children:A.
what},`${ke}:${A.what}`)),e.nextSteps.length>on&&a("button",{type:"button",className:"ow-steps-more",onClick:A=>{A.stopPropagation(),
ye(ke=>!ke)},children:we?"Show fewer":`+${e.nextSteps.length-on} more`})]})}),t&&e.retryPath&&m&&a(mt,{children:a("div",
{className:"ow-retry",children:a(z,{onClick:()=>m(e.retryPath),disabled:!!g,children:"Retry"})})}),t&&e.stopPath&&k&&a(mt,
{children:a("div",{className:"ow-retry",children:a(z,{onClick:()=>k(e.stopPath),disabled:!!l,children:l?"Stopping\u2026":
"Stop this loop"})})}),t&&e.permissionId&&T&&a(mt,{children:a(kr,{item:e,busy:!!u,onDecide:A=>T(e,A)})}),e.state==="need\
s-you"&&v&&C&&p("div",{className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-aside-btn",onClick:A=>{
A.stopPropagation(),v(e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",onClick:A=>{A.stopPropagation(),
C(e.id,e.updatedAt)},children:"Handled"})]})]})}var Br=["unblock","followup","running","done"],Mr={unblock:{label:"UNBLO\
CK",cls:"ow-lane-unblock"},followup:{label:"FOLLOW UP",cls:"ow-lane-followup"}};function Kr(e){return e.state==="done"?"\
done":e.state==="running"?"running":Ct(e)??"unblock"}function $r({items:e,selectedId:t,onSelect:n,onOpenSession:s,onAnswerPermission:r,
onDecideApproval:i,permissionBusy:d,onRetry:u,retryBusy:m,onPickStep:g,onSnooze:k,onHandled:l,doneTitles:f}){let[v,C]=S(
!1),_=new Map;for(let W of e){let G=Kr(W),L=_.get(G);L?L.push(W):_.set(G,[W])}return p(ve,{children:[Br.filter(W=>_.has(
W)).map(W=>{let G=_.get(W),L=W==="unblock"||W==="followup"?Mr[W]:null,q=L?G.map(N=>N.action!=="resume"?et(Re(N),fe):""):
[],T=L&&q.length>0&&q.every(N=>N&&N===q[0])?q[0]:void 0;return p("div",{className:"ow-lane",children:[L&&p("div",{className:"\
ow-lane-head",children:[a("span",{className:`ow-lane-badge ${L.cls}`,children:L.label}),T&&a("span",{className:"ow-lane-\
reason",children:T})]}),G.map(N=>a(an,{item:N,hideBadge:!0,compact:!0,selected:t===N.id,continuation:!0,whyRanked:T?void 0:
N.state==="needs-you"&&N.action!=="resume"?et(Re(N),fe):void 0,onSelect:()=>n(N),onOpenSession:s,onAnswerPermission:r,onDecideApproval:i,
permissionBusy:d,onRetry:u,retryBusy:m,onPickStep:g,onSnooze:k,onHandled:l},N.id))]},W)}),!_.has("done")&&f&&f.length>0&&
p("div",{className:"ow-lane ow-lane-done",children:[p("button",{type:"button",className:"ow-goals-toggle","aria-expanded":v,
onClick:()=>C(W=>!W),children:[a(me,{className:"ow-icon","data-open":v?"true":void 0,"aria-hidden":"true"}),f.length," d\
one"]}),v&&a("ul",{className:"ow-done-list",children:f.map(W=>p("li",{className:"ow-row-goal-done",children:[a(To,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:W})]},W))})]})]})}function ot({title:e,items:t,
selectedId:n,onSelect:s,onOpenSession:r,onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:m,retryBusy:g,onStop:k,
stopBusy:l,onPickStep:f,onSnooze:v,onHandled:C,footer:_,collapsed:W,onToggleCollapsed:G,groupBy:L,prChecks:q,prFilter:T,
doneBySession:N,goalVerdicts:We,onSplitGoal:we,onMergeGoal:ye,initiativeBlocks:A,initiatives:ke,onRenameSession:xe,semanticWhy:wt,
goalNames:st,collapsedInitiatives:ze,onToggleInitiative:Ae,selectedGoalKey:Ge,onSelectGoal:De,subtitle:rt,hideHeader:J,emptyLabel:Be}){
let oe=Jt(t,L,We),qe=L==="pr"&&T&&T!=="all"?oe.filter(y=>y.changeRef&&Ut(y.changeRef,q?.[y.changeRef.url??""])===T):oe,se=A??
[],at=L==="goal"?se.length:L==="pr"?qe.length:t.length,ht=y=>{let I=y.changeRef?q?.[y.changeRef.url??""]:void 0,F=y.header===
"pr"?ze?.[y.key]??!((I?.failing??0)>0||y.items.some(P=>P.state==="needs-you")):!1;return p("div",{className:"ow-block","\
data-grouped":y.header?"true":void 0,children:[y.header==="session"&&y.sessionKey&&a(Nr,{item:y.items[0],onOpen:()=>r(y.
sessionKey)}),y.header==="pr"&&y.changeRef&&a(Cr,{reference:y.changeRef,checks:I,folded:F,onToggle:Ae?()=>Ae(y.key,!F):void 0}),
y.header==="goal"&&a(_r,{block:y,onSplit:we,selected:Ge===y.key,onSelect:De?()=>De(y.key):void 0}),y.header==="pr"?!F&&p(
ve,{children:[a(Wr,{checks:I}),p("div",{className:"ow-pr-sessions",children:[a("span",{className:"ow-pr-sublabel-inline",
children:"Sessions"}),no(y.items).map(P=>p("button",{type:"button",className:"ow-reference ow-reference-link ow-pr-sessi\
on-chip",onClick:()=>r(P.sessionKey),children:[a(dn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-\
truncate",children:P.label})]},P.sessionKey))]})]}):y.header==="session"?a($r,{items:y.items,doneTitles:y.sessionKey?N?.[y.
sessionKey]:void 0,selectedId:n,onSelect:s,onOpenSession:r,onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:m,
retryBusy:g,onPickStep:f,onSnooze:v,onHandled:C}):y.items.map(P=>p(vo,{children:[a(an,{item:P,selected:n===P.id,continuation:y.
header==="session",whyRanked:P.state==="needs-you"&&P.action!=="resume"?et(Re(P),fe):void 0,onSelect:()=>s(P),onOpenSession:r,
onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:m,retryBusy:g,onStop:k,stopBusy:l,onPickStep:f,onSnooze:v,
onHandled:C}),L==="goal"&&ye&&n===P.id&&a(Eo,{item:P,items:t,onMerge:ye})]},P.id))]},y.key)},Me=y=>{let I=ke&&xe?lo(y,ke):
null,F=y.references.find(P=>P.kind==="session")?.label??"";return p(vo,{children:[a(an,{item:y,selected:n===y.id,dot:po(
y),simple:!0,sessionMismatch:I??void 0,onFixSessionName:I&&y.sessionKey?()=>xe(y.sessionKey,`${F} & ${I.itemGoal}`.slice(
0,200)):void 0,whyRanked:y.state==="needs-you"&&y.action!=="resume"?et(Re(y),fe):void 0,onSelect:()=>s(y),onOpenSession:r,
onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:m,retryBusy:g,onPickStep:f,onSnooze:v,onHandled:C}),ye&&
n===y.id&&a(Eo,{item:y,items:t,onMerge:ye})]},y.id)},bt=y=>{if(y.name){let te=ze?.[y.key]??y.status!=="needs-you",X=y.blocks.
flatMap(U=>U.items),re=ft(X);return a(sn,{open:!te,onToggle:()=>Ae?.(y.key,!te),label:y.name,flag:re.needsYou>0?`${re.needsYou}\
 need you`:Ie[y.status],flagWarn:re.needsYou>0,meta:tn(X),header:a("span",{className:"ow-truncate ow-block-name ow-goalc\
ard-title",children:y.name}),children:te?a(Po,{members:X}):X.map(U=>Me(U))},y.key)}let I=y.blocks[0];if(I.header==="goal"){
let te=ze?.[y.key]??y.status!=="needs-you",X=I.items[0],re=ft(I.items),U=[];for(let H=0;H<I.items.length;H+=1)for(let Se=H+
1;Se<I.items.length;Se+=1)U.push(le(I.items[H],I.items[Se]));let it=new Set(I.items.map(H=>H.sessionKey).filter(Boolean)).
size,lt=st?.[I.key]??ao(I.items)??(it>1?`${it} sessions, one goal`:X.references.find(H=>H.kind==="session")?.label??X.title);
return a(sn,{open:!te,onToggle:()=>Ae?.(y.key,!te),label:lt,flag:re.needsYou>0?`${re.needsYou} need you`:Ie[y.status],flagWarn:re.
needsYou>0,meta:tn(I.items),why:ro(I.items,We,wt),header:a(Ce,{onActivate:()=>De?.(I.key),className:"ow-goalcard-header \
ow-goal-tab","aria-pressed":Ge===I.key,"data-selected":Ge===I.key?"true":void 0,children:a("span",{className:"ow-truncat\
e ow-block-name ow-goalcard-title",children:lt})}),action:we&&a(z,{className:"ow-block-open",title:"Not the same goal \u2014 \
split into separate cards","aria-label":`Split ${X.title}`,onClick:H=>{H.stopPropagation(),we(U)},children:"Split"}),children:te?
a(Po,{members:I.items}):I.items.map(H=>Me(H))},y.key)}let F=I.items[0],P=st?.[`item:${F.id}`],he=F.references.find(te=>te.
kind==="session")?.label,Ke=P??he;if(!Ke||Ke===F.title)return Me(F);let _e=ft(I.items);return a(sn,{open:!0,label:Ke,flag:_e.
needsYou>0?`${_e.needsYou} need you`:Ie[F.state],flagWarn:_e.needsYou>0,meta:tn(I.items),header:a("span",{className:"ow-\
truncate ow-block-name ow-goalcard-title",children:Ke}),children:Me(F)},y.key)};return p("section",{className:"ow-sectio\
n","aria-label":e,children:[J?null:G?p(Ce,{onActivate:G,className:"ow-section-toggle",children:[a(Ko,{label:e,count:at,subtitle:rt}),
a(me,{className:"ow-icon ow-section-chevron","data-open":W?void 0:"true","aria-hidden":"true"})]}):a(Ko,{label:e,count:at,
subtitle:rt}),W?null:a("div",{className:"ow-section-list",children:L==="goal"?se.length===0?a("p",{className:"ow-section\
-empty",children:Be}):se.map(bt):qe.length===0?a("p",{className:"ow-section-empty",children:Be}):qe.map(ht)}),_]})}function Pr(e,t){
let n=Un(t,fe);if(!e)return["Crew Manager context: workspace overview.",...n,"Answer the user about the state of their w\
ork. This is a conversation, not an action channel."].join(`
`);let s=e.references.map(i=>`${i.kind}: ${i.label} (${i.id})`).join(`
`),r=[e.stalledFor?`Silent for ${Xe(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(i=>!!i);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,
`State: ${Ie[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...r.length>0?[`Why it is on the board:
${r.join(`
`)}`]:[],`References:
${s}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(i=>!!i).join(`
`)}function Er(){let e=ar(),t=de(e);t.current=e;let n=ir(),s=lr(),[r,i]=S("all"),[d,u]=S(()=>ce(Io,null)??"prs"),m=O(o=>{
u(c=>{let w=c===o?null:o;return V(Io,w),w})},[]),[g,k]=S(()=>ce(Wo,null)==="session"?"session":"goal"),[l,f]=S("all"),[v,
C]=S({}),[_,W]=S(null),[G,L]=S("session"),[q,T]=S(null),[N,We]=S(null),[we,ye]=S({}),[A,ke]=S("unknown"),xe=de("unknown"),
wt=de(new Map),[st,ze]=S({}),[Ae,Ge]=S({}),[De,rt]=S([]),[J,Be]=S(null),[oe,qe]=S(null),[se,at]=S(null),[ht,Me]=S(()=>ce(
Qt)),[bt,y]=S(()=>ce(xo)),[I,F]=S(()=>ce(Zt,{merged:[],split:[]})),P=de(ce(So,[])),[he,Ke]=S(()=>{let o=ce(Do,null);return{
pairs:new Set(o?.pairs??[]),why:new Map(o?.why??[]),stamp:o?.stamp??""}}),[_e,te]=S(()=>ce(en,{})),X=de([]),re=de(!1),[U,
it]=S([]),[lt,H]=S(()=>ce(Ro)),[Se,vt]=S(null),[qo,Fo]=S(()=>ce(_o,null)??!0),[cn,un]=S({}),[At,jo]=S([]),[Bt,pn]=S(()=>ce(
Co,null)??Ao),[Mt,gn]=S(!1),fn=de(!0),[Uo,mn]=S(!0),[wn,Kt]=S(null),[hn,Ho]=S(null),[yt,bn]=S(!1),[Yo,Vo]=S(!1),[vn,be]=S(
null),E=de(!0),dt=de(0),$t=de(!1);j(()=>(E.current=!0,()=>{E.current=!1,dt.current+=1}),[]);let K=O(async()=>{let o=++dt.
current,c=t.current;try{let[w,h,b,x,ie,pe,M,ne]=await Promise.all([c.get("/api/chat/slots"),c.get("/api/approvals"),c.get(
"/api/spawn"),c.get("/api/workflows/runs"),c.get("/api/crons"),c.get("/api/artifacts"),c.get("/api/autonudge").catch(()=>({
loops:[]})),c.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!E.current||o!==dt.current)return;We({slots:Array.
isArray(w)?w:[],approvals:Array.isArray(h)?h:[],agents:Array.isArray(b.agents)?b.agents:[],workflows:Array.isArray(x.runs)?
x.runs:[],crons:Array.isArray(ie.jobs)?ie.jobs:[],artifacts:Array.isArray(pe.artifacts)?pe.artifacts:[],loops:Array.isArray(
M?.loops)?M.loops:[]}),jo(Array.isArray(ne?.runs)?ne.runs:[]),Kt(null),Ho(Date.now())}catch(w){E.current&&o===dt.current&&
Kt(w instanceof Error?w:new Error("Unable to load Crew Manager sources"))}finally{E.current&&o===dt.current&&mn(!1)}},[]);
j(()=>{K();let o=window.setInterval(()=>{K()},mr);return()=>window.clearInterval(o)},[K]);let Jo=()=>{mn(!0),Kt(null),K()},
Xo=O(()=>{yt||(bn(!0),K().finally(()=>{E.current&&bn(!1)}))},[K,yt]);j(()=>{if(!N||xe.current==="unsupported"||xe.current===
"disabled")return;let o=wo(N.slots,nt).filter(w=>wt.current.get(w.key)!==Xt(w));if(o.length===0)return;let c=!1;return(async()=>{
let{summaries:w,support:h}=await ho(o,b=>t.current.get(b));if(!(c||!E.current)&&(xe.current=h,ke(h),h==="available")){for(let b of o)
w[b.key]&&wt.current.set(b.key,Xt(b));ye(b=>({...b,...w}))}})(),()=>{c=!0}},[N]),j(()=>{if(!N||!fn.current)return;let o=!1;
return(async()=>{try{let c=await t.current.get("/api/apps/crew-manager/stalls");if(o||!E.current)return;let w={};for(let b of c?.
stalls??[])b?.key&&(w[b.key]=b);ze(w);let h={};for(let b of c?.error_loops??[])b?.key&&(h[b.key]=b);un(h)}catch{fn.current=
!1,E.current&&(ze({}),un({}))}})(),()=>{o=!0}},[N]),j(()=>{let o=!1;return(async()=>{try{let c=await t.current.get("/api\
/apps/crew-manager/initiatives");if(o||!E.current)return;it((c?.initiatives??[]).filter(w=>w?.name))}catch{}})(),()=>{o=
!0}},[]);let yn=Y(()=>Jn(to(N??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},fe,we,st,cn,
I),Ae),[N,we,st,cn,Ae,I]),kt=Y(()=>Qn(yn,ht,bt),[yn,ht,bt]),B=Y(()=>kt.items.filter(o=>Zn(o)),[kt]),Pt=Y(()=>Vt(B),[B]),
kn=Y(()=>{let o={};for(let c of B){if(c.state!=="done"||!c.sessionKey)continue;let w=o[c.sessionKey];w?w.push(c.title):o[c.
sessionKey]=[c.title]}return o},[B]),Ne=Y(()=>B.find(o=>o.id===_)??null,[B,_]),ct=Y(()=>r==="all"?B:B.filter(o=>o.state===
r),[r,B]),Et=Y(()=>{let o={all:0,failing:0,running:0,merged:0};for(let c of Jt(B,"pr")){if(!c.changeRef)continue;o.all++;
let w=Ut(c.changeRef,v[c.changeRef.url??""]);w!=="other"&&o[w]++}return o},[B,v]);j(()=>{let o=new Set;for(let w of B)for(let h of w.
references)h.kind==="change"&&h.url&&/\/pull\/\d|\/merge_requests\/\d/.test(h.url)&&o.add(h.url);let c=!1;for(let w of o)
v[w]||t.current.post("/api/source/pull-request",{url:w}).then(h=>{!c&&E.current&&h?.title&&C(b=>({...b,[w]:Ir(h)}))}).catch(
()=>{});return()=>{c=!0}},[B,v]),j(()=>s(Pt["needs-you"]),[Pt,s]),j(()=>{_&&!B.some(o=>o.id===_)&&W(null)},[B,_]),j(()=>{
V(Wo,g)},[g]),j(()=>{V(Co,Bt)},[Bt]);let xn=de(null);j(()=>{if(!Mt)return;let o=w=>{let h=xn.current?.getBoundingClientRect();
if(!h||h.width===0)return;let b=(w.clientX-h.left)/h.width*100;pn(Math.max(gr,Math.min(fr,b)))},c=()=>gn(!1);return window.
addEventListener("mousemove",o),window.addEventListener("mouseup",c),()=>{window.removeEventListener("mousemove",o),window.
removeEventListener("mouseup",c)}},[Mt]);let Lt=N?.slots.find(o=>o.key===nt),Qo=!!(Lt||Yo);j(()=>{!N||Lt||$t.current||($t.
current=!0,e.post("/api/chat/slots",{name:nt,title:"Conductor"}).then(()=>{E.current&&(Vo(!0),K())}).catch(o=>{E.current&&
($t.current=!1,be(o instanceof Error?`Conductor session could not be created: ${o.message}`:"Conductor session could not\
 be created"))}))},[e,Lt,K,N]);let _n=Y(()=>Gn(N?.approvals??[],De,o=>B.find(c=>c.sessionKey===o)?.title??N?.slots?.find(
c=>c.key===o)?.title??o),[B,N,De]),Fe=Ne&&!Ne.permissionId?Ne:null,ae=Y(()=>fo(B,U,I,P.current,he.pairs),[B,U,I,he]);j(()=>{
let o=so(ae.filter(c=>c.name===null).flatMap(c=>c.blocks));P.current=o,V(So,o)},[ae]),j(()=>{if(X.current.length===0)return;
let o=ae.filter(h=>h.name===null).flatMap(h=>h.blocks),c={},w=[];for(let h of X.current){let b=o.find(x=>x.items.length>
1&&h.ids.filter(ie=>x.items.some(pe=>pe.id===ie)).length>=2);b?c[b.key]=h.name:w.push(h)}X.current=w,Object.keys(c).length>
0&&te(h=>{let b={...h,...c};return V(en,b),b})},[ae]),j(()=>{let o=ae.filter(b=>b.name===null).flatMap(b=>b.blocks),c=o.
filter(b=>b.items.length>1).map(b=>({key:b.key,name:_e[b.key]??null,items:b.items.map(x=>({id:x.id,title:x.title}))})),w=o.
filter(b=>b.items.length===1).map(b=>({id:b.items[0].id,title:b.items[0].title,detail:b.items[0].summary??""}));if(w.length===
0&&c.every(b=>b.name))return;let h=JSON.stringify([c.map(b=>[b.key,b.name]),w.map(b=>b.id).sort()]);h===he.stamp||re.current||
(re.current=!0,(async()=>{try{let b=await t.current.post("/api/apps/crew-manager/goal-pass",{clusters:c,ungrouped:w});if(!E.
current)return;if(!b?.available){Ke(R=>No({pairs:R.pairs,why:R.why,stamp:h}));return}let x=new Map;for(let R of o)for(let $ of R.
items)x.set($.id,$);let ie=new Map(o.map(R=>[R.key,R])),pe=new Set(he.pairs),M=new Map(he.why),ne=new Map,Z=new Map;for(let R of b.
assignments??[]){if((R.confidence??0)<pr)continue;let $=R.item_id?x.get(R.item_id):void 0;if(!(!$?.sessionKey||!R.cluster)){
if(R.cluster.startsWith("existing:")){let ge=ie.get(R.cluster.slice(9))?.items.find(_t=>_t.id!==$.id);if(!ge)continue;let Ee=le(
$,ge);pe.add(Ee),R.why&&M.set(Ee,R.why)}else if(R.cluster.startsWith("new:")){let Je=ne.get(R.cluster)??[];Je.push($),ne.
set(R.cluster,Je),R.why&&Z.set($.id,R.why)}}}let pt=new Map;for(let R of b.names??[])R.cluster&&R.name&&pt.set(R.cluster,
R.name);let Rn=[];for(let[R,$]of ne){if($.length<2)continue;for(let ge=0;ge<$.length;ge+=1)for(let Ee=ge+1;Ee<$.length;Ee+=
1){let _t=le($[ge],$[Ee]);pe.add(_t);let In=Z.get($[ge].id)??Z.get($[Ee].id);In&&M.set(_t,In)}let Je=pt.get(R);Je&&Rn.push(
{ids:$.map(ge=>ge.id),name:Je})}X.current=Rn;let xt={};for(let[R,$]of pt)R.startsWith("new:")||(R.startsWith("item:")?!_e[R]&&
x.has(R.slice(5))&&(xt[R]=$):ie.has(R)&&(xt[R]=$));Object.keys(xt).length>0&&te(R=>{let $={...R,...xt};return V(en,$),$}),
Ke(No({pairs:pe,why:M,stamp:h}))}catch{}finally{re.current=!1}})())},[ae,_e,he]);let ue=Y(()=>{if(!Se)return null;for(let o of ae){
let c=o.blocks.find(w=>w.key===Se);if(c&&c.items.length>0)return c}return null},[Se,ae]),Q=ue?go(ue.items):null,Tt=Y(()=>{
let o=(N?.loops??[]).filter(h=>h&&h.active!==!1&&h.slot_key);if(o.length===0)return[];let c=new Map,w=new Map;for(let h of B)
for(let b of h.references)b.kind!=="session"||!b.id||b.label&&!c.has(b.id)&&c.set(b.id,b.label);for(let h of ae)if(h.name)
for(let b of h.blocks)for(let x of b.items)x.sessionKey&&!w.has(x.sessionKey)&&w.set(x.sessionKey,h.name);return o.map(h=>{
let b=Number(h.cycle_count)||0,x=Number(h.max_cycles)||0;return{key:h.slot_key,title:c.get(h.slot_key)??h.slot_key,goalName:w.
get(h.slot_key)??null,progress:x>0?`${b}/${x}`:`${b} ${b===1?"cycle":"cycles"}`,remaining:x>0?Math.max(0,x-b):null,instruction:(h.
message??"").replace(/\s+/g," ").trim(),lastFire:D(h.last_fire_ts)}})},[N,B,ae]),je=Y(()=>{let o=new Date;o.setHours(0,0,
0,0);let c=o.getTime(),w=c+864e5,h=N?.crons??[],b=new Map;for(let M of At){let ne=D(M.started_at);if(!M.job_id||ne<c||ne>=
w)continue;let Z=b.get(M.job_id)??{count:0,failed:0,last:0};Z.count+=1,M.status&&M.status!=="success"&&(Z.failed+=1),Z.last=
Math.max(Z.last,ne),b.set(M.job_id,Z)}let x=h.map(M=>{let ne=b.get(M.id),Z=D(M.next_run_ts),pt=Z>=c&&Z<w;return{job:M,ran:ne,
next:Z,dueToday:pt}}).filter(M=>M.ran||M.dueToday||M.job.is_running),ie=x.filter(M=>M.ran&&M.ran.failed===0).length,pe=x.
filter(M=>M.ran&&M.ran.failed>0).length;return{rows:x,done:ie,failed:pe,total:x.length,historyKnown:At.length>0}},[N,At]),
[Zo,Sn]=S(!1),es=Y(()=>{if(g!=="goal")return[];let o=co(N?.slots??[],U),c=uo(B,U),w=new Set,h=[];for(let b of[...c,...o])
w.has(b.name.toLowerCase())||(w.add(b.name.toLowerCase()),h.push(b));return h.sort((b,x)=>x.sessions-b.sessions)},[g,N,B,
U]),ts=O(async(o,c)=>{try{await t.current.patch(`/api/chat/slots/${encodeURIComponent(o)}/title`,{title:c}),K()}catch{}},
[K]),ns=O(async(o,c=[])=>{if(o.trim()){Sn(!0);try{let w=await t.current.post("/api/apps/crew-manager/initiatives",{name:o.
trim(),aliases:c});E.current&&w?.initiatives&&it(w.initiatives.filter(h=>h?.name))}catch{}finally{E.current&&Sn(!1)}}},[]),
$e=O(async(o,c)=>{if(!J){Be(o),be(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(o)}/${c?"approve":
"reject"}`,{}),K()}catch(w){be(w instanceof Error?`Could not answer that request: ${w.message}`:"Could not answer that r\
equest"),K()}finally{E.current&&Be(null)}}},[K,J]),Ue=O(async(o,c)=>{if(!(J||!o.permissionId||!o.sessionKey)){Be(o.permissionId),
be(null);try{await t.current.post(`/api/chat/slots/${encodeURIComponent(o.sessionKey)}/approve`,{action:c,request_id:o.permissionId}),
K()}catch(w){be(w instanceof Error?`Could not answer that request: ${w.message}`:"Could not answer that request"),K()}finally{
E.current&&Be(null)}}},[K,J]),os=O(o=>{Me(c=>{let w=Object.fromEntries(Object.entries(c).filter(([,h])=>h>Date.now()));return w[o]=
Date.now()+Xn,V(Qt,w),w}),W(null)},[]),ss=O((o,c)=>{y(w=>{let h={...w,[o]:c};return V(xo,h),h}),W(null)},[]),rs=O(()=>{Me(
{}),V(Qt,{})},[]),as=O(o=>{F(c=>{let w={merged:c.merged.filter(h=>!o.includes(h)),split:[...new Set([...c.split,...o])]};
return V(Zt,w),w})},[]),is=O(o=>{F(c=>{let w={merged:[...new Set([...c.merged,o])],split:c.split.filter(h=>h!==o)};return V(
Zt,w),w})},[]),ls=O(()=>{Fo(o=>(V(_o,!o),!o))},[]),He=O(async o=>{if(!oe){qe(o),be(null);try{await t.current.post(o,{}),
K()}catch(c){be(c instanceof Error?`Could not re-run it: ${c.message}`:"Could not re-run it"),K()}finally{E.current&&qe(
null)}}},[K,oe]),ut=O(async o=>{if(!se){at(o),be(null);try{await t.current.del(o),T("Stopped the monitor loop. Re-arming\
 it is done from the session itself."),K()}catch(c){let w=c instanceof Error?c.message:"";/404|not found/i.test(w)?T("Th\
at loop had already stopped."):be(w?`Could not stop it: ${w}`:"Could not stop it"),K()}finally{E.current&&at(null)}}},[K,
se]),Pe=O(async o=>{if(ue&&Q?.sessionKey){let w=Q.sessionKey,h=ue.items.map(x=>`- ${x.references.find(ie=>ie.kind==="ses\
sion")?.label??x.sessionKey}: ${Ie[x.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(w)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${ue.items[0].title}", which spans sessions:`,h,"You are the session actively on it, so the instructi\
on is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:w}).catch(x=>{if(!(x instanceof
SyntaxError))throw x}),!E.current)return;Ge(x=>({...x,[Q.id]:Date.now()})),rt(x=>x.includes(w)?x:[...x,w]);let b=Q.references.
find(x=>x.kind==="session")?.label??Q.title;T(Q.moving||Q.state==="running"?`Sent to ${b} \u2014 the active session on this g\
oal`:`Sent to ${b} \u2014 resuming the last session on this goal`),vt(null),K();return}let c=Ne&&!Ne.permissionId?Ne:null;
if(G==="session"&&c?.sessionKey){let w=c.sessionKey;if(await t.current.post("/api/chat",{message:o,slot:w}).catch(h=>{if(!(h instanceof
SyntaxError))throw h}),!E.current)return;Ge(h=>({...h,[c.id]:Date.now()})),rt(h=>h.includes(w)?h:[...h,w]),T(`Sent new i\
nstructions to ${c.title}`),W(null),K();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(nt)}/context`,
{content:Pr(Ne,B),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:nt}).
catch(w=>{if(!(w instanceof SyntaxError))throw w})},[Ne,ue,Q,B,K,G]),Ot={"needs-you":ct.filter(o=>o.state==="needs-you"),
running:ct.filter(o=>o.state==="running"),done:ct.filter(o=>o.state==="done")},Nn=O((o,c)=>{H(w=>{let h={...w,[o]:c};return V(
Ro,h),h})},[]),ds=O(o=>{vt(c=>c===o?null:o),W(null),T(null)},[]),Ye=o=>n(`/chat?sid=${encodeURIComponent(o)}`),Ve=o=>{W(
c=>c===o.id?null:o.id),vt(null),T(null),L("session")};return p("div",{className:"ow-root","data-crew-manager-shell":"qui\
et-split",children:[a("style",{children:bo}),a(ur,{title:"Crew Manager",subtitle:"See what needs your input, what is sti\
ll running, and what finished recently."}),a("div",{className:"ow-body",children:p("div",{className:"ow-layout",ref:xn,children:[
p("div",{className:"ow-main",style:{flexBasis:`${Bt}%`},children:[p("section",{className:"ow-card ow-listcard","aria-lab\
el":"Work",children:[p("div",{className:"ow-listcard-head",children:[p("div",{className:"ow-tabrow",children:[a("div",{className:"\
ow-tabs",role:"tablist","aria-label":"View",children:["goal","session"].map(o=>a(z,{role:"tab","aria-selected":g===o,"da\
ta-selected":g===o,className:"ow-tab",onClick:()=>k(o),children:o==="goal"?"Goals":"Sessions"},o))}),p("div",{className:"\
ow-refreshbar",children:[hn&&p("span",{className:"ow-updated","aria-live":"polite",children:["updated ",Wt(hn)]}),a(z,{className:"\
ow-refresh",onClick:Xo,disabled:yt,"aria-label":"Refresh",title:"Refresh",children:a(tr,{className:`ow-icon${yt?" ow-spi\
n":""}`,"aria-hidden":"true"})})]})]}),p("div",{className:"ow-listcard-tools",children:[a("p",{className:"ow-listcard-su\
b",children:g==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each session needs from \
you"}),g==="session"&&a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.keys(nn).
map(o=>p(z,{onClick:()=>i(o),"aria-pressed":r===o,"data-selected":r===o,className:"ow-filter",children:[nn[o],a("span",{
className:"ow-count",children:Pt[o]})]},o))})]})]}),a("main",{className:"ow-work",children:a("div",{className:"ow-work-i\
nner",children:Uo?a(yo,{rows:7}):wn&&!N?a(ko,{icon:a(Lo,{className:"ow-icon"}),title:"Crew Manager could not load the wo\
rk view",subtitle:wn.message,action:a(z,{onClick:Jo,children:"Try again"})}):(g==="goal"?B.length===0:ct.length===0)?a(ko,
{icon:a(or,{className:"ow-icon"}),title:"No matching work",subtitle:g==="goal"?"No sessions are running yet.":"Change th\
e filter to see sessions in another state."}):g==="goal"?a(ot,{title:"Work by goal",hideHeader:!0,items:B,selectedId:_,onSelect:Ve,
onOpenSession:Ye,onAnswerPermission:(o,c)=>{$e(o,c)},onDecideApproval:(o,c)=>{Ue(o,c)},permissionBusy:J!==null,onRetry:o=>{
He(o)},retryBusy:oe!==null,onPickStep:o=>{Pe(o)},groupBy:g,goalVerdicts:I,onSplitGoal:as,onMergeGoal:is,initiativeBlocks:ae,
initiatives:U,onRenameSession:(o,c)=>{ts(o,c)},semanticWhy:he.why,goalNames:_e,collapsedInitiatives:lt,onToggleInitiative:Nn,
selectedGoalKey:Se,onSelectGoal:ds,footer:a(xr,{candidates:es,prominent:U.length===0,busy:Zo,onAdd:(o,c)=>{ns(o,c)}}),emptyLabel:"\
No matching work"}):r==="all"?p(ve,{children:[a(ot,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",
items:Ot["needs-you"],doneBySession:kn,selectedId:_,onSelect:Ve,onSnooze:os,onHandled:ss,footer:kt.snoozedCount>0?p("but\
ton",{type:"button",className:"ow-aside-note",onClick:rs,children:[kt.snoozedCount," set aside for later \u2014 bring back"]}):
void 0,onOpenSession:Ye,onAnswerPermission:(o,c)=>{$e(o,c)},onDecideApproval:(o,c)=>{Ue(o,c)},permissionBusy:J!==null,onRetry:o=>{
He(o)},retryBusy:oe!==null,onStop:o=>{ut(o)},stopBusy:se!==null,onPickStep:o=>{Pe(o)},groupBy:g,emptyLabel:"Nothing need\
s your input right now."}),a(ot,{title:"In progress",subtitle:"Being worked on right now",items:Ot.running,doneBySession:kn,
selectedId:_,onSelect:Ve,onOpenSession:Ye,onAnswerPermission:(o,c)=>{$e(o,c)},onDecideApproval:(o,c)=>{Ue(o,c)},permissionBusy:J!==
null,onRetry:o=>{He(o)},retryBusy:oe!==null,onStop:o=>{ut(o)},stopBusy:se!==null,onPickStep:o=>{Pe(o)},groupBy:g,emptyLabel:"\
Nothing is in progress right now."}),a(ot,{title:"Done recently",subtitle:"Finished in the last few days",items:Ot.done,
selectedId:_,onSelect:Ve,collapsed:qo,onToggleCollapsed:ls,onOpenSession:Ye,onAnswerPermission:(o,c)=>{$e(o,c)},onDecideApproval:(o,c)=>{
Ue(o,c)},permissionBusy:J!==null,onRetry:o=>{He(o)},retryBusy:oe!==null,onStop:o=>{ut(o)},stopBusy:se!==null,onPickStep:o=>{
Pe(o)},groupBy:g,emptyLabel:"No recent completed work."})]}):a(ot,{title:nn[r],items:ct,selectedId:_,onSelect:Ve,onOpenSession:Ye,
onAnswerPermission:(o,c)=>{$e(o,c)},onDecideApproval:(o,c)=>{Ue(o,c)},permissionBusy:J!==null,onRetry:o=>{He(o)},retryBusy:oe!==
null,onStop:o=>{ut(o)},stopBusy:se!==null,onPickStep:o=>{Pe(o)},groupBy:g,emptyLabel:"No matching work"})})})]}),p("div",
{className:"ow-stack",children:[p("details",{className:"ow-card ow-stack-card",open:d==="prs",children:[p("summary",{onClick:o=>{
o.preventDefault(),m("prs")},children:[p("span",{className:"ow-stack-title",children:[a(me,{className:"ow-icon ow-stack-\
chevron"}),a(ln,{className:"ow-icon"}),"PRs"]}),p(ee,{variant:"muted",children:[Et.all," open"]})]}),a("p",{className:"o\
w-stack-sub",children:"Open pull requests your work touches"}),a("div",{className:"ow-stack-body",children:Et.all===0?a(
"p",{className:"ow-stack-empty",children:"No work is linked to a PR right now. Work links to one when a session mentions\
 its URL."}):p(ve,{children:[a("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.
keys(Mo).map(o=>p(z,{onClick:()=>f(o),"aria-pressed":l===o,"data-selected":l===o,className:"ow-filter",children:[Mo[o],a(
"span",{className:"ow-count",children:Et[o]})]},o))}),a(ot,{title:"Work by PR",items:B,prChecks:v,prFilter:l,collapsedInitiatives:lt,
onToggleInitiative:Nn,selectedId:_,onSelect:Ve,onOpenSession:Ye,onAnswerPermission:(o,c)=>{$e(o,c)},onDecideApproval:(o,c)=>{
Ue(o,c)},permissionBusy:J!==null,onRetry:o=>{He(o)},retryBusy:oe!==null,onStop:o=>{ut(o)},stopBusy:se!==null,onPickStep:o=>{
Pe(o)},groupBy:"pr",emptyLabel:"No PR matches that status."})]})})]}),p("details",{className:"ow-card ow-stack-card",open:d===
"loops",children:[p("summary",{onClick:o=>{o.preventDefault(),m("loops")},children:[p("span",{className:"ow-stack-title",
children:[a(me,{className:"ow-icon ow-stack-chevron"}),a(Go,{className:"ow-icon"}),"Loops"]}),a(ee,{variant:"muted",children:Tt.
length})]}),a("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),a("div",{className:"\
ow-stack-body",children:Tt.length===0?a("p",{className:"ow-stack-empty",children:"No loop is running right now."}):Tt.map(
o=>{let c=Wt(o.lastFire),w=[c&&`last tick ${c}`,o.remaining!==null&&`${o.remaining} remaining`].filter(Boolean).join(" \xB7\
 ");return p("div",{className:"ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),
p("div",{children:[p("div",{className:"ow-mini-title",children:[o.goalName??o.title,a("span",{className:"ow-mini-chip",children:o.
progress})]}),o.instruction&&a("div",{className:"ow-mini-desc",title:o.instruction,children:o.instruction}),w&&a("div",{
className:"ow-mini-when",children:w})]}),a(ee,{variant:"ok",children:"Active"})]},o.key)})})]}),p("details",{className:"\
ow-card ow-stack-card",open:d==="schedule",children:[p("summary",{onClick:o=>{o.preventDefault(),m("schedule")},children:[
p("span",{className:"ow-stack-title",children:[a(me,{className:"ow-icon ow-stack-chevron"}),a(zo,{className:"ow-icon"}),
"Scheduled tasks"]}),p(ee,{variant:je.failed>0?"err":"muted",children:[je.done,"/",je.total," today"]})]}),a("p",{className:"\
ow-stack-sub",children:je.historyKnown?"Today's runs only \u2014 jobs with nothing scheduled today are hidden":"Run hist\
ory is unavailable, so completed counts may be low"}),a("div",{className:"ow-stack-body",children:je.rows.length===0?a("\
p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):je.rows.map(({job:o,ran:c,next:w,dueToday:h})=>{
let b=!!(c&&c.failed>0),x=[c&&`ran today ${Bo(c.last)}${c.count>1?` (${c.count}x)`:""}`,h&&w?`next ${Bo(w)}`:null].filter(
Boolean).join(" \xB7 ");return p("div",{className:"ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:b?
"var(--danger)":o.enabled===!1?"var(--muted)":"var(--warn)"}}),p("div",{children:[a("div",{className:"ow-mini-title",children:o.
name}),o.schedule&&p("div",{className:"ow-mini-desc",children:[o.schedule,o.cron_expr&&a("span",{className:"ow-mini-chip",
children:o.cron_expr})]}),x&&a("div",{className:"ow-mini-when",children:x})]}),o.is_running?a(ee,{variant:"aim",children:"\
Running"}):b?a(ee,{variant:"err",children:"Failed"}):o.enabled===!1?a(ee,{variant:"muted",children:"Paused"}):c?a(ee,{variant:"\
ok",children:"Success"}):a(ee,{variant:"warn",children:"Pending"})]},o.id)})})]})]})]}),a("button",{type:"button",className:"\
ow-resizer","aria-label":"Resize columns","data-dragging":Mt?"true":void 0,onMouseDown:o=>{o.preventDefault(),gn(!0)},onDoubleClick:()=>pn(
Ao)}),p("aside",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:p(
"div",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!Fe&&a("span",{className:"ow-conductor-su\
b",children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:Qo?p("div",{className:"ow-chat\
-panel",children:[_n.length>0&&a("div",{className:"ow-permissions",role:"alert",children:_n.map(o=>a(yr,{tool:o.tool,purpose:o.
purpose,where:o.sessionLabel,busy:J!==null,onAnswer:c=>{$e(o.id,c)}},o.id))}),q&&p("div",{className:"ow-conductor-receip\
t",role:"status",children:[a(Oo,{className:"ow-icon"}),q]}),vn&&a("div",{className:"ow-chat-error",role:"alert",children:vn}),
a("div",{className:"ow-embed",children:a(dr,{slotKey:nt,frameless:!0,startAtBottom:!0,placeholder:ue?"Instruction for th\
is goal\u2026":Fe?.sessionKey&&G==="session"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:Pe})}),
ue&&Q?p("div",{className:"ow-quote ow-quote-docked",children:[p("div",{className:"ow-quote-body ow-quote-goal",children:[
p("div",{className:"ow-quote-line",children:[a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"\
ow-quote-title",title:ue.items[0].title,children:ue.items[0].title})]}),p("span",{className:"ow-quote-route ow-truncate",
children:["\u2192 ",Q.references.find(o=>o.kind==="session")?.label??Q.title,Q.moving||Q.state==="running"?" (active)":"\
 (will resume)"]})]}),a(z,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{vt(null),T(null)},
children:"Clear"})]}):Fe&&p("div",{className:"ow-quote ow-quote-docked",children:[p("div",{className:"ow-quote-body",children:[
Fe.sessionKey?a("button",{type:"button",className:"ow-scope-toggle","aria-pressed":G==="conductor","aria-label":G==="ses\
sion"?"Sending to this session. Activate to send to the Conductor instead.":"Sending to the Conductor. Activate to send \
to this session instead.",onClick:()=>L(o=>o==="session"?"conductor":"session"),children:G==="session"?"Instructing":"To\
 Conductor"}):a("span",{className:"ow-eyebrow",children:"Quoted"}),a("span",{className:"ow-quote-title",title:Fe.title,children:Fe.
title})]}),a(z,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{W(null),T(null)},children:"\
Clear"})]})]}):a("div",{className:"ow-chat-loading",children:a(yo,{rows:4})})})]})]})})]})}export{Er as default};
