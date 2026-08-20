import{Fragment as Vo,useCallback as O,useEffect as X,useMemo as H,useRef as le,useState as R}from"react";import{AlertTriangle as gr,
Bot as Ls,Check as mr,ChevronRight as de,Check as fr,Clock as wr,Package as Os,ExternalLink as Mn,MessageSquare as $n,RefreshCw as zs,
Shield as qs,Waves as hr,Search as Gs,Tag as Fs,Users as Qt,Zap as js}from"lucide-react";import{useAppApi as Us,useNavigate as Ys,
useNavBadge as Hs,ChatEmbed as Vs}from"@kirocrew/app-sdk";import{Badge as te,Btn as q,ContentSkeleton as Jo,EmptyState as Qo,
Input as Js,PageHeader as Qs}from"@kirocrew/app-sdk/ui";function Fe(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),r=t%
60;return r===0?`${n} hour${n===1?"":"s"}`:`${n}h ${r}m`}function Yr(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function wn(e){let t=St(e);return t==="merged"?"merged":t==="conflict"||t==="ci-failing"||
t==="changes-requested"?"failing":t==="checks-running"?"running":"other"}var hn={merged:"Merged",closed:"Closed",draft:"\
Draft",conflict:"Conflict","ci-failing":"CI failing",behind:"Behind base","checks-running":"Checks running","changes-req\
uested":"Changes requested","comments-open":"Comments open","needs-review":"Needs review",ready:"Ready",open:"Open"},mo={
merged:"muted",closed:"muted",draft:"muted",conflict:"err","ci-failing":"err",behind:"warn","checks-running":"warn","cha\
nges-requested":"err","comments-open":"warn","needs-review":"warn",ready:"ok",open:"muted"},Hr=2;function fo(e){return e.
mergeable==="conflicting"||e.mergeState==="dirty"?!0:e.mergeable||e.mergeState?!1:e.status==="conflict"}function St(e){let t=(e.
state??"").toUpperCase(),n=!!e.available&&(e.total??0)>0;return t==="MERGED"||!t&&e.status==="merged"?"merged":t==="CLOS\
ED"?"closed":e.isDraft||e.mergeState==="draft"?"draft":fo(e)?"conflict":(e.failing??0)>0||!n&&e.status==="checks failing"?
"ci-failing":e.review==="changes-requested"?"changes-requested":(e.unresolved??0)>0?"comments-open":e.mergeState==="behi\
nd"||e.mergeState==="need_rebase"?"behind":(e.pending??0)>0||!n&&e.status==="checks running"?"checks-running":e.mergeState===
"blocked"?"needs-review":e.review==="approved"||e.mergeState==="clean"&&n&&(e.failing??0)===0?"ready":"open"}var Vr=4;function wo(e,t=Date.
now()){let n=[],r=(e.state??"").toUpperCase();if(r==="MERGED"||e.status==="merged")return[];if(r==="CLOSED")return[];(e.
isDraft||e.mergeState==="draft")&&n.push("Draft"),e.review==="changes-requested"?n.push("Changes requested"):e.review===
"approved"&&n.push("Approved");let s=e.failing??0,i=e.pending??0;s>0?n.push(`${s} check${s===1?"":"s"} failing`):i>0?n.push(
`${i} check${i===1?"":"s"} running`):e.available&&(e.total??0)>0&&n.push("All checks passing"),fo(e)?n.push(`merge confl\
ict with ${e.base||"the base branch"}`):(e.mergeState==="behind"||e.mergeState==="need_rebase")&&n.push(`behind ${e.base||
"the base branch"}`);let d=e.unresolved??0;d>0&&n.push(`${d} unresolved comment${d===1?"":"s"}`),e.mergeState==="blocked"&&
e.review!=="changes-requested"&&n.push("waiting on review"),e.autoMerge?n.push("auto-merge armed"):St(e)==="ready"&&n.push(
"ready to merge");let u=e.updatedAt?Math.floor((t-e.updatedAt)/864e5):0;u>=Hr&&n.push(`no activity in ${u} days`);let f=hn[St(
e)].toLowerCase();return n.filter(w=>w.toLowerCase()!==f).slice(0,Vr)}function ho(e){let t=new Map;for(let r of e){if(r.
kind!=="review")continue;let s=(r.state??"").toUpperCase();if(s!=="APPROVED"&&s!=="CHANGES_REQUESTED")continue;let i=r.createdAt&&
Date.parse(r.createdAt)||0,d=r.author??"",u=t.get(d);(!u||i>=u.at)&&t.set(d,{at:i,state:s})}let n=[...t.values()].map(r=>r.
state);return n.includes("CHANGES_REQUESTED")?"changes-requested":n.includes("APPROVED")?"approved":"none"}function bo(e){
let t=new Set;for(let n of e)!n.resolvable||n.resolved||t.add(n.threadId||n.id||"");return t.size}function vo(e){if(!e)return;
let t;try{t=new URL(e).pathname}catch{return}let n=t.split("/").filter(Boolean),r=n.indexOf("-");if(r>0)return n[r-1];let s=n.
findIndex(i=>i==="pull"||i==="pulls"||i==="merge_requests");return s>0?n[s-1]:n.length>1?n[1]:void 0}function yo(e,t,n){
let r=new Set(t.filter(Boolean));if(r.size===0)return[];let s=new Set,i=[];for(let d of e){let u=d.slot;!u||!r.has(u)||!d.
id||s.has(d.id)||(s.add(d.id),i.push({id:d.id,sessionKey:u,sessionLabel:n(u),tool:d.tool||"a tool",purpose:d.tool_purpose}))}
return i}var Zn=5,eo={"needs-you":0,running:1,done:2};function U(e){if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;
let t=Date.parse(e);return Number.isFinite(t)?t:0}function Jr(e,t){if(e.paused)return"";let n=U(e.next_run_ts);if(!n)return"";
let r=Math.round((n-t)/1e3);return r<=0?"":Fe(r)}var to=72;function qe(e,t){let n=e?.replace(/\s+/g," ").trim();if(!n)return t;
let s=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(/[.;,]$/,"");if(s.length<=to)return s;let i=s.
slice(0,to),d=i.lastIndexOf(" ");return`${(d>24?i.slice(0,d):i).trim()}\u2026`}function Ge(e){return!!e.source_links?.some(
t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var Qr=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
Xr=/^\((?:code|diff|widget|image)\)$/,Zr=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
es=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,ts=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
ns=/[?？]["'”’)\]]*$/;function ko(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||Xr.test(t)||Qr.test(
t)?null:t}function bn(e){if(!e.waiting_for_input)return null;let t=ko(e);return!t||Zr.test(t)||es.test(t)?null:ts.test(t)||
ns.test(t)?t:null}function no(e){return e.pending_approval||bn(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":Ge(e)?"needs-you":"done"}function os(e,t){if(e.pending_approval)return t("approval_waiting");let n=bn(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):Ge(e)?t("linked_change_issue"):ko(e)??t("recent_w\
ork_ready"))}function un(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function rs(e){return e.pending_approval?"review-approval":bn(e)?"reply":"open"}function xo(e){
return(e.source_links??[]).map(t=>({number:String(t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.
kind==="issue"?`issue #${t.number}`:`${t.provider} #${t.number}`,url:t.url,sessionKey:e.key,status:Yr(t)}}))}function ss(e,t){
let n=xo(e).map(r=>r.ref);return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:os(e,t),state:no(e),moving:no(
e)==="running"||void 0,issue:Ge(e),updatedAt:U(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:un(
e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:Ge(e)||void 0,action:rs(e),references:[{kind:"session",id:e.key,label:e.
title||t("untitled_work"),sessionKey:e.key},...n]}}function vn(e,t){e.references.some(n=>n.kind===t.kind&&n.id===t.id)||
e.references.push(t)}function _o(e){return(e.source||"").toLowerCase()==="subagent"}function as(e,t,n){let r=_o(t);e.state=
"needs-you",e.updatedAt=Math.max(e.updatedAt,U(t.ts)),e.summary=n(r?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=
r?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=
t.tool_purpose,e.permissionInput=t.tool_input,vn(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),sessionKey:t.
slot||e.sessionKey})}function is(e,t,n){e.updatedAt=Math.max(e.updatedAt,U(t.started)),e.issue||=!!(t.done&&(t.error||t.
outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_failed",{task:t.
task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),vn(e,{kind:"agent",id:t.id,label:t.agent||
n("agent"),sessionKey:t.parent||e.sessionKey})}function ls(e,t,n){e.issue||=t.status==="failed",t.status==="running"&&e.
state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow_failed",{name:t.
name})),vn(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function ds(e,t){
if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"dropped":return"\
done";case"in-progress":return"running";default:return null}}function cs(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function us(e){let t=null,n=-1;for(let r of e){let s=r.last_touched_turn??0;s>n&&(n=s,t=r)}return t}function ps(e,t){let n=e.next_steps?.find(s=>s.what?.trim())?.what?.trim();if(n)return n;let r=[...e.progress??[]].reverse().
find(s=>s.trim());return r?r.trim():e.initial_intent?.trim()||t("work_in_progress")}var gs=3;function ms(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function fs(e,t){if(!t)return!1;
let n=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${n}\\b`,"u").test(e)}function oo(e,t){if(e.length===
0)return[];let n=ms(t);return e.filter(r=>fs(n,r.number)).map(r=>r.ref)}function ws(e,t,n){if(!t?.enabled)return[];let r=t.
intents??[];if(r.length===0)return[];let s=xo(e),i=[],d=us(r),f=!!(e.running||e.subagents_running||e.orchestrating)?[]:r.
filter(l=>l.state==="in-progress");f.forEach(l=>{let p=r.indexOf(l),b=(l.next_steps??[]).filter(C=>C.what?.trim());i.push(
{id:`unattended:${e.key}:${p}`,title:qe(l.title,e.title||n("untitled_work")),summary:b[0]?.what?.trim()||n("no_next_step"),
state:"needs-you",issue:Ge(e),updatedAt:U(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:un(e,n),
queuedBehind:e.queue_depth||void 0,changeBlocked:Ge(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...oo(s,l)],nextSteps:b,progress:(l.progress??[]).filter(
C=>C.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0})}),r.forEach((l,p)=>{if(f.includes(l))return;let b=ds(
l,e);if(!b)return;let C=(l.next_steps??[]).filter(S=>S.what?.trim());i.push({id:`intent:${e.key}:${p}`,title:qe(l.title,
e.title||n("untitled_work")),summary:ps(l,n),state:b,issue:!1,updatedAt:U(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.
key,provenance:un(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:Ge(e)||void 0,unverified:l.verified===!1||void 0,
action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...oo(s,l)],nextSteps:C,
progress:(l.progress??[]).filter(S=>S.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0,moving:cs(l,e,d)||void 0})});
let w=i.filter(l=>l.state==="needs-you"),x=i.filter(l=>l.state!=="needs-you").sort((l,p)=>(p.lastTouchedTurn??0)-(l.lastTouchedTurn??
0));return[...w,...x].slice(0,Math.max(gs,w.length))}var So=new Set(["crew-manager-conductor","overwatch-conductor"]),hs={
approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,
stalled:50,change_blocked:40,merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},bs=3;
function vs(e,t){return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var qt=5;function No(e,t,n=Date.now()){
let r=kn(e),s=Bo(e.filter(d=>d.state==="needs-you"),n),i=[`Fleet: ${r["needs-you"]} waiting on the user, ${r.running} in\
 progress, ${r.done} finished recently.`];return s.length===0?(i.push("Nothing is waiting on the user."),i):(i.push(`Wai\
ting on the user, in the order the list shows them (top ${Math.min(qt,s.length)}):`),s.slice(0,qt).forEach((d,u)=>{let f=it(
Pe(d,n),t),w=d.sessionKey?` [session ${d.sessionKey}]`:"";i.push(`${u+1}. ${d.title} \u2014 ${d.summary} (${f})${w}`)}),
s.length>qt&&i.push(`\u2026and ${s.length-qt} more waiting.`),i)}var je=new Set(["the","a","an","and","or","to","for","o\
f","in","on","at","is","it","this","that","with","from","into","be","do","so","as","by","fix","add","make","update","wor\
k","session","app","new","use","run","why","what","how","again","still","not"]),ro=.6,so=2,Ro=new Set;function pn(e){return[
...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(t=>t.length>2&&!je.has(t)))]}function Gt(e,t){
let n=pn(e),r=pn(t);if(n.length<so||r.length<so)return 0;let s=n.length<=r.length?n:r,i=new Set(n.length<=r.length?r:n);
return s.filter(u=>i.has(u)).length/s.length}function ao(e){return e.references.filter(t=>t.kind==="change"||t.kind==="i\
ssue").map(t=>t.id)}function io(e){return e.references.filter(t=>t.kind==="artifact").map(t=>t.id)}function lo(e){return(e.
nextSteps??[]).map(t=>t.what).filter(Boolean)}var ys=new Set(["pull request","pull requests","status update","work in pr\
ogress","code review","follow up","next step","next steps","action item","action items","kiro crew","in progress","needs\
 you"]);function st(e){let t=new Set,n=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??[];for(let r of n){
let s=r.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(i=>i.length>3&&i.endsWith("s")&&
!i.endsWith("ss")?i.slice(0,-1):i);for(;s.length&&je.has(s[0]);)s.shift();for(;s.length&&je.has(s[s.length-1]);)s.pop();
if(!(s.length<2))for(let i=s.length;i>=2;i-=1)for(let d=0;d+i<=s.length;d+=1){let u=s.slice(d,d+i).join(" ");ys.has(u)||
t.add(u)}}return[...t]}function Co(e){let t=new Set;if(e.length<ks)return t;let n=new Map;for(let r of e)for(let s of st(
r.title))n.set(s,(n.get(s)??0)+1);for(let[r,s]of n)s/e.length>=xs&&t.add(r);return t}var ks=4,xs=.75;function at(e,t,n=Ro){
if(ao(e).find(d=>ao(t).includes(d)))return"same_change";if(io(e).find(d=>io(t).includes(d)))return"same_artifact";let i=st(
t.title).filter(d=>!n.has(d));if(st(e.title).some(d=>i.includes(d)))return"same_deliverable";if(Gt(e.title,t.title)>=ro)
return"same_topic";for(let d of lo(e))for(let u of lo(t))if(Gt(d,u)>=ro)return"same_step";return null}function Io(e,t){return e.
parentId===t.id||t.parentId===e.id?"spawned":co(e).includes(t.id)||co(t).includes(e.id)?"references":null}function co(e){
let t=[];for(let n of e.references)n.kind==="artifact"?t.push(`artifact:${n.id}`):n.kind==="workflow"?t.push(`workflow:${n.
id}`):n.kind==="agent"?t.push(`agent:${n.id}`):n.kind==="monitor"&&t.push(`monitor:${n.id}`,`loop:${n.id}`);return t.filter(
n=>n!==e.id)}var Nt={merged:[],split:[]};function Ft(e){return`${e.sessionKey??e.id}|${pn(e.title).join(" ")}`}function ge(e,t){
return[Ft(e),Ft(t)].sort().join("")}function _s(e,t=Nt){let n=e.filter(s=>s.state!=="done"&&s.sessionKey).sort((s,i)=>(s.
updatedAt||0)-(i.updatedAt||0)),r=Co(n);for(let s=1;s<n.length;s+=1){let i=n[s];for(let d=0;d<s;d+=1){let u=n[d];if(u.sessionKey===
i.sessionKey||t.split.includes(ge(i,u)))continue;let f=at(i,u,r);if(f){i.duplicateOf={sessionKey:u.sessionKey,title:u.title,
because:f};break}}}Ss(n,t,r)}var cn=3,jt=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function Ss(e,t,n=Ro){
for(let r of e){let s=[],i=new Set;for(let d of e){let u=d.sessionKey;if(u===r.sessionKey||i.has(u)||t.split.includes(ge(
r,d)))continue;let f=at(r,d,n);f&&(i.add(u),s.push({sessionKey:u,title:d.title,because:f}))}s.length!==0&&(s.sort((d,u)=>jt.
indexOf(d.because)-jt.indexOf(u.because)),r.relatedSessions=s.slice(0,cn),s.length>cn&&(r.relatedMore=s.length-cn))}}var Ns=3e4;
function Ao(e,t,n=Date.now()){return Object.keys(t).length===0?e:e.map(r=>{let s=t[r.id];return!s||n-s>Ns||r.state==="ru\
nning"?r:{...r,state:"running",moving:!0,instructed:!0}})}function Pe(e,t=Date.now()){let n=[],r=(i,d,u=1)=>{n.push({signal:i,
weight:hs[i]*u,values:d})};e.approvalKind==="subagent"?r("subagent_gate"):e.approvalKind==="tool"&&r("approval_owed"),e.
action==="reply"&&r("input_requested"),e.unverified&&r("unverified_completion"),e.loopRepeats&&r("error_loop",{repeats:String(
e.loopRepeats)}),e.changesRequested&&r("changes_requested"),e.runFailed&&r("run_failed"),e.stalledFor&&r("stalled",{duration:Fe(
e.stalledFor)}),e.assignedToYou&&r("assigned_to_you"),e.changeBlocked&&r("change_blocked"),e.mergeReady&&r("merge_ready"),
e.unattendedGoals&&r("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&r("queued_behind",{count:String(e.
queuedBehind)},Math.min(e.queuedBehind,3));let s=vs(e,t);return s>0&&r("waiting_a_while",{hours:String(s)},Math.min(s,bs)),
n.sort((i,d)=>d.weight-i.weight),{score:n.reduce((i,d)=>i+d.weight,0),signals:n}}var Rs={approval_owed:"unblock",subagent_gate:"\
unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"un\
block",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"unblock",assigned_to_you:"followup",nobody_on_it:"\
followup"};function Ut(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let n of Pe(e,t).signals){let r=Rs[n.signal];
if(r)return r}return null}var Wo=14400*1e3;function Po(e,t,n,r=Date.now()){let s=0,i=[];for(let d of e){if(d.state!=="ne\
eds-you"){i.push(d);continue}let u=t[d.id];if(u&&u>r){s+=1;continue}let f=n[d.id];if(f!==void 0&&d.updatedAt<=f){i.push(
{...d,state:"done",issue:!1});continue}i.push(d)}return{items:i,snoozedCount:s}}var yn=4320*60*1e3;function Eo(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=yn}var Cs={"needs-you":1,running:-1,done:-1};function Is(e,t,n){
let r=e.updatedAt>0,s=t.updatedAt>0;return!r&&!s?0:r?s?(e.updatedAt-t.updatedAt)*n:-1:1}function it(e,t){let n=e.signals.
slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(s=>t(`rank_${s.signal}`,s.values)).join(t("rank_join"))}
function Bo(e,t=Date.now()){let n=new Map(e.map(r=>[r.id,Pe(r,t)]));return[...e].sort((r,s)=>{let i=eo[r.state]-eo[s.state];
if(i!==0)return i;if(r.state==="needs-you"){let d=(n.get(s.id)?.score??0)-(n.get(r.id)?.score??0);if(d!==0)return d}else if(r.
issue!==s.issue)return r.issue?-1:1;return Is(r,s,Cs[r.state])})}function Mo(e,t,n={},r={},s={},i=Nt,d=Date.now()){let u=new Map,
f=new Map;for(let l of e.slots){if(!l.key||So.has(l.key)||l.memory_mode==="incognito")continue;let p=ws(l,n[l.key],t);if(p.
length>0){for(let S of p)u.set(S.id,S);let C=p.find(S=>S.state==="needs-you")??p[0];f.set(l.key,C);continue}let b=ss(l,t);
u.set(b.id,b),f.set(l.key,b)}if(e.assigned?.length){let l=new Map;for(let k of u.values())for(let N of k.references)(N.kind===
"change"||N.kind==="issue")&&N.url&&!l.has(N.url)&&l.set(N.url,k);let p={changes_requested:0,conflict:1,checks_failing:2,
ready_to_merge:3,assigned:4},b=new Map;for(let k of e.assigned){if(!k?.url||l.has(k.url)||!(k.status in p))continue;let N=b.
get(k.status);N?N.push(k):b.set(k.status,[k])}let C=[...b.entries()].sort((k,N)=>(p[k[0]]??9)-(p[N[0]]??9)).map(k=>k[1]),
S=[];for(let k=0;S.length<Zn;k+=1){let N=!1;for(let B of C){if(S.length>=Zn)break;let z=B[k];z&&(S.push(z),N=!0)}if(!N)break}
let M=new Set(S.map(k=>k.url));for(let k of e.assigned){if(!k?.url||!l.has(k.url)&&!M.has(k.url))continue;let N=k.kind===
"issue"?"issue":"pull",B=k.status==="conflict"||k.status==="checks_failing",z=k.status==="changes_requested",$=k.status===
"ready_to_merge",G=N==="issue",A=l.get(k.url);if(A){A.owned=N,B&&(A.changeBlocked=!0,A.issue=!0),z&&(A.changesRequested=
!0),$&&(A.mergeReady=!0),(B||z||$)&&A.state==="done"&&(A.state="needs-you");continue}let me=B||z||$||G,W=N==="issue"?"ow\
ned_issue_assigned":k.status==="conflict"?"owned_pull_conflict":k.status==="checks_failing"?"owned_pull_failing":k.status===
"changes_requested"?"owned_pull_changes_requested":k.status==="ready_to_merge"?"owned_pull_merge_ready":k.status==="chec\
ks_running"?"owned_pull_checks_running":"owned_pull_awaiting_review",ce=N==="issue"?`issue #${k.number}`:`#${k.number}`;
u.set(`owned:${k.url}`,{id:`owned:${k.url}`,title:k.title||ce,summary:t(W,{count:String(k.status==="checks_failing"?k.failing:
k.pending)}),state:me?"needs-you":"running",issue:B,updatedAt:U(k.updated_at),provenance:t("owned_provenance",{repo:k.repo}),
references:[{kind:N==="issue"?"issue":"change",id:k.url,label:`${k.repo} ${ce}`,url:k.url,status:k.status==="awaiting_re\
view"?void 0:k.status.replace(/_/g," ")}],action:void 0,owned:N,changeBlocked:B||void 0,changesRequested:z||void 0,mergeReady:$||
void 0,assignedToYou:G||void 0})}}for(let[l,p]of Object.entries(r)){let b=f.get(l);b&&(b.state="needs-you",b.issue=!0,b.
stalledFor=p.silent_secs,b.summary=p.reason?t("stalled_because",{reason:p.reason,duration:Fe(p.silent_secs)}):t("stalled\
_for",{duration:Fe(p.silent_secs)}),b.action="open")}for(let[l,p]of Object.entries(s)){let b=f.get(l);b&&(b.state="needs\
-you",b.issue=!0,b.loopRepeats=p.repeats,b.summary=t("error_loop",{tool:p.tool,repeats:String(p.repeats)}),b.action="ope\
n")}for(let l of e.approvals){let p=l.slot?f.get(l.slot):void 0;if(p){as(p,l,t);continue}u.set(`approval:${l.id}`,{id:`a\
pproval:${l.id}`,title:qe(l.tool||l.source,t("approval_needed")),summary:l.tool_purpose||t("tool_call_waiting"),state:"n\
eeds-you",issue:!1,updatedAt:U(l.ts),provenance:t("approval"),action:"review-approval",approvalKind:_o(l)?"subagent":"to\
ol",permissionId:l.id,permissionTool:l.tool||l.source,permissionPurpose:l.tool_purpose,permissionInput:l.tool_input,references:[
{kind:"approval",id:l.id,label:l.tool||l.source||t("approval")}]})}for(let l of e.agents){let p=l.parent?f.get(l.parent):
void 0;if(p){is(p,l,t);continue}let b=!!(l.done&&(l.error||l.outcome==="failed"));l.parent&&!b||u.set(`agent:${l.id}`,{id:`\
agent:${l.id}`,title:qe(l.task||l.agent,t("agent_work")),summary:b?l.error?.trim()||t("agent_failed",{task:l.task}):l.done?
t("agent_done"):t("work_in_progress"),state:b?"needs-you":l.done?"done":"running",issue:b,runFailed:b||void 0,retryPath:b&&
!l.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(l.id)}/retry`:void 0,updatedAt:U(l.started),provenance:l.agent||
t("agent"),action:"discuss",references:[{kind:"agent",id:l.id,label:l.agent||t("agent")}]})}for(let l of e.workflows){let p=l.
session_key?f.get(l.session_key):void 0;if(p){ls(p,l,t);continue}let b=l.status==="failed";u.set(`workflow:${l.run_id}`,
{id:`workflow:${l.run_id}`,title:qe(l.name,l.run_id),summary:b?t("workflow_failed_generic"):l.status==="running"?t("work\
flow_running"):t("workflow_finished"),state:b?"needs-you":l.status==="running"?"running":"done",issue:b,runFailed:b||void 0,
retryPath:b?`/api/workflows/runs/${encodeURIComponent(l.run_id)}/rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"\
discuss",references:[{kind:"workflow",id:l.run_id,label:l.name||l.run_id}]})}for(let l of e.crons){if(!l.is_running&&l.last_status!==
"error")continue;let p=l.last_status==="error",b=Jr(l,d),C=t(p?"monitor_failed":"monitor_running");u.set(`monitor:${l.id}`,
{id:`monitor:${l.id}`,title:l.name,summary:b?`${C} ${t("monitor_next_check",{duration:b})}`:C,state:p?"needs-you":"runni\
ng",issue:p,runFailed:p||void 0,retryPath:p?`/api/crons/${encodeURIComponent(l.id)}/run`:void 0,updatedAt:U(l.running_since||
l.last_run_ts||l.created_ts),provenance:t("monitor"),action:p?"discuss":void 0,references:[{kind:"monitor",id:l.id,label:l.
name}]})}for(let l of e.loops||[]){if(!l.active)continue;let p=String(l.id||"");if(!p)continue;let b=Math.max(0,Number(l.
cycle_count)||0),C=Math.max(0,Number(l.max_cycles)||0),S=l.slot_key&&f.has(l.slot_key)?l.slot_key:void 0;u.set(`loop:${p}`,
{id:`loop:${p}`,title:qe(l.message||"",t("loop")),summary:C?t("loop_watching_capped",{cycles:String(b),cap:String(C)}):t(
"loop_watching",{cycles:String(b)}),state:"running",issue:!1,updatedAt:U(l.last_fire_ts||l.created_ts),sessionKey:S,parentId:S?
f.get(S)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(p)}`,action:S?"open":void 0,references:[
{kind:"monitor",id:p,label:t("loop"),sessionKey:S},...S?[{kind:"session",id:S,label:f.get(S)?.title||S,sessionKey:S}]:[]]})}
let w=[...e.artifacts].sort((l,p)=>U(p.updated_at)-U(l.updated_at)).slice(0,8);for(let l of w){let p=l.session_key&&f.has(
l.session_key)?l.session_key:void 0;u.set(`artifact:${l.slug}`,{id:`artifact:${l.slug}`,title:qe(l.name,t("artifact")),summary:l.
description||t("artifact_ready",{kind:l.kind}),state:"done",issue:!1,updatedAt:U(l.updated_at||l.created_at),sessionKey:p,
parentId:p?f.get(p)?.id:void 0,provenance:l.session_title||l.source||t("artifact"),action:p?"open":void 0,references:[{kind:"\
artifact",id:l.slug,label:l.name,sessionKey:p},...p?[{kind:"session",id:p,label:l.session_title||p,sessionKey:p}]:[]]})}
let x=[...u.values()];return _s(x,i),Bo(x)}function kn(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-y\
ou").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function xn(e){let t=[],n=new Map;for(let r of e){let s=r.sessionKey;if(!s)continue;let i=n.get(s);if(i){i.count+=1;continue}
let d=r.references.find(f=>f.kind==="session")?.label??r.provenance,u={sessionKey:s,label:d,leading:r,count:1};n.set(s,u),
t.push(u)}return t}function Yt(e,t,n=Nt,r){if(t==="pr")return As(e);if(t==="goal")return gn(e,n,r);let s=[],i=new Map;for(let d of e){
let u=d.sessionKey;if(!u){s.push({key:d.id,items:[d],header:null,sessionKey:null,changeRef:null});continue}let f=i.get(u);
if(f){f.items.push(d);continue}let w={key:u,items:[d],header:"session",sessionKey:d.sessionKey??null,changeRef:null};i.set(
u,w),s.push(w)}return s}function As(e){let t=[],n=new Map;for(let r of e){let s=r.references.filter(i=>i.kind==="change"||
i.kind==="issue");for(let i of s){let d=`${i.kind}:${i.id}`,u=n.get(d);if(u){u.items.push(r);continue}let f={key:d,items:[
r],header:"pr",sessionKey:null,changeRef:i};n.set(d,f),t.push(f)}}return t.sort((r,s)=>Math.max(...s.items.map(i=>i.updatedAt))-
Math.max(...r.items.map(i=>i.updatedAt))),t}var $o=["same_change","same_artifact","same_deliverable"];function gn(e,t,n){
let r=Co(e),s=e.map((w,x)=>x),i=w=>{for(;s[w]!==w;)s[w]=s[s[w]],w=s[w];return w},d=(w,x)=>{s[i(x)]=i(w)};for(let w=0;w<e.
length;w+=1)for(let x=w+1;x<e.length;x+=1){let l=e[w],p=e[x],b=ge(l,p);if(t.split.includes(b))continue;if(Io(l,p)){d(w,x);
continue}if(t.merged.includes(b)){d(w,x);continue}if(n?.has(b)){d(w,x);continue}if(!l.sessionKey||!p.sessionKey||l.sessionKey===
p.sessionKey)continue;let C=at(l,p,r);C&&$o.includes(C)&&d(w,x)}let u=[],f=new Map;for(let w=0;w<e.length;w+=1){let x=i(
w),l=f.get(x);if(l){l.items.push(e[w]),l.header="goal";continue}let p={key:`goal:${e[w].id}`,items:[e[w]],header:null,sessionKey:null,
changeRef:null};f.set(x,p),u.push(p)}for(let w of u)w.key=Ws(w.items);return u}function Ws(e){return`goal:${[...e.map(t=>t.
id)].sort()[0]}`}var Ps=.5;function Es(e,t){let n=new Set,r=new Set,s=[...e].sort((i,d)=>d.items.length-i.items.length);
for(let i of s){let d=new Set(i.items.map(Ft)),u=null;for(let f of t){if(n.has(f.key))continue;let w=f.members.filter(l=>d.
has(l)).length;if(!w)continue;let x=w/Math.min(d.size,f.members.length);x<Ps||(!u||x>u.score)&&(u={key:f.key,score:x})}if(u&&
(n.add(u.key),i.key=u.key),r.has(i.key)){let f=2;for(;r.has(`${i.key}~${f}`);)f+=1;i.key=`${i.key}~${f}`}r.add(i.key)}return e}
function Ko(e){return e.map(t=>({key:t.key,members:t.items.map(Ft)}))}function mn(e,t){let n=t.split(" ").map(r=>`${Bs(r)}\
s?`).join("[\\s/_,-]+");return e.match(new RegExp(n,"iu"))?.[0]??null}function Bs(e){return e.replace(/[.*+?^${}()|[\]\\]/g,
"\\$&")}function To(e,t=Nt,n){if(e.length<2)return null;let r=null,s=null,i=null;for(let d=0;d<e.length;d+=1)for(let u=d+
1;u<e.length;u+=1){let f=e[d],w=e[u];if(Io(f,w))return`${w.parentId===f.id?w.title:f.title} was started by this work`;if(t.
merged.includes(ge(f,w)))return"you merged these";i??=n?.get(ge(f,w))??null;let x=at(f,w);if(!(!x||!$o.includes(x))&&(!r||
jt.indexOf(x)<jt.indexOf(r))&&(r=x,x==="same_deliverable")){let l=st(w.title),p=st(f.title).find(b=>l.includes(b))??null;
s=p?mn(f.title,p)??mn(w.title,p)??p:null}}return r==="same_change"?"these sessions work on the same change":r==="same_ar\
tifact"?"these sessions share the same output":r==="same_deliverable"?s?`both are about ${s}`:"both name the same delive\
rable":i}var Ms=12;function Do(e){if(e.length<2)return null;let t=new Map;for(let f of e)for(let w of st(f.title))t.set(
w,(t.get(w)??0)+1);let n=uo(t);if(n)return po(e,n)??n;let r=new Map;for(let f of e)for(let w of f.references){if(w.kind!==
"change"&&w.kind!=="issue")continue;let x=r.get(w.id);r.set(w.id,{label:w.label,members:(x?.members??0)+1})}let s=[...r.
values()].filter(f=>f.members>=2).sort((f,w)=>w.members-f.members)[0];if(s)return s.label;let i=new Map;e.forEach((f,w)=>{
for(let x of $s(f.title))i.has(x)||i.set(x,new Set),i.get(x).add(w)});let d=new Map;for(let[f,w]of i)d.set(f,w.size);let u=uo(
d);return u?po(e,u)??u:null}function uo(e){return[...e.entries()].filter(([,t])=>t>=2).sort((t,n)=>n[1]-t[1]||n[0].length-
t[0].length)[0]?.[0]??null}function po(e,t){let n=null;for(let r of e){let s=mn(r.title,t);if(s){if(/^\p{Lu}/u.test(s))return s;
n??=s}}return n}function $s(e){let t=e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean),n=[];
for(let r=Math.min(t.length,Ms);r>=2;r-=1)for(let s=0;s+r<=t.length;s+=1){let i=t.slice(s,s+r);je.has(i[0])||je.has(i[r-
1])||i[0].length<2||i[r-1].length<2||n.push(i.join(" "))}return n}function Lo(e,t){let n=e.references.find(r=>r.kind==="\
session")?.label??"";for(let r of[e.title,n,e.provenance]){let s=fn(r,t);if(s)return s}return null}function fn(e,t){let n=e.
toLowerCase(),r=null;for(let s of t)for(let i of s.aliases)!i||!n.includes(i.toLowerCase())||(!r||i.length>r.length)&&(r=
{name:s.name,length:i.length});return r?.name??null}function Oo(e,t){let n=e.references.find(d=>d.kind==="session")?.label??
"";if(!n)return null;let r=fn(e.title,t);if(!r)return null;let s=t.find(d=>d.name===r);if(s&&s.aliases.some(d=>d&&n.toLowerCase().
includes(d.toLowerCase())))return null;let i=fn(n,t);return!i||i===r?null:{itemGoal:r,sessionGoal:i}}function zo(e,t){let n=t.
flatMap(i=>i.aliases.map(d=>d.toLowerCase())),r=new Set(["workspace","workspaces","home","src","tmp","documents","deskto\
p"]),s=new Map;for(let i of e){if(!i.key||So.has(i.key)||i.memory_mode==="incognito")continue;let d=i.project;if(!d)continue;
let u=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!u||r.has(u.toLowerCase())||n.some(f=>u.toLowerCase().includes(
f)||f.includes(u.toLowerCase()))||s.set(u,(s.get(u)??0)+1)}return[...s.entries()].map(([i,d])=>({name:i,sessions:d})).sort(
(i,d)=>d.sessions-i.sessions)}function qo(e,t){let n=new Map;for(let i of e){if(!i.sessionKey||Lo(i,t)!==null)continue;let d=i.
references.find(u=>u.kind==="session")?.label??"";for(let u of[i.title,d]){let f=u.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean);for(let w of[3,2])for(let x=0;x+w<=f.length;x+=1){let l=f.slice(x,x+w);if(je.has(l[0])||
je.has(l[w-1])||l[0].length<3||l[w-1].length<3)continue;let p=l.join(" ");n.has(p)||n.set(p,new Set),n.get(p).add(i.sessionKey)}}}
let r=[...n.entries()].map(([i,d])=>({phrase:i,sessions:d.size})).filter(i=>i.sessions>=2);return r.filter(i=>!r.some(d=>d.
phrase!==i.phrase&&d.phrase.includes(i.phrase)&&d.sessions>=i.sessions)).sort((i,d)=>d.sessions-i.sessions||d.phrase.length-
i.phrase.length).map(i=>({name:i.phrase.replace(/\p{L}+/gu,d=>d[0].toUpperCase()+d.slice(1)),sessions:i.sessions}))}function go(e){
return e.some(t=>t.state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function Go(e,t=Date.
now()){return e.issue?"crit":e.state==="needs-you"?Ut(e,t)==="followup"?"idle":"warn":"good"}function lt(e){let t=new Set,n=new Set,r=new Set,s=0,i=0,d=0,u=0,f=0;for(let w of e){w.sessionKey&&t.add(w.sessionKey);for(let x of w.
references)x.kind==="change"?n.add(x.id):x.kind==="issue"&&r.add(x.id);w.id.startsWith("workflow:")?s+=1:w.id.startsWith(
"monitor:")?i+=1:w.id.startsWith("agent:")&&(d+=1),w.state==="needs-you"&&(u+=1),w.updatedAt>f&&(f=w.updatedAt)}return{sessions:t.
size,prs:n.size,issues:r.size,loops:s,crons:i,agents:d,needsYou:u,lastActivityAt:f}}function Fo(e){let t=e.find(r=>r.moving);
if(t)return t;let n=e.find(r=>r.state==="running");return n||[...e].sort((r,s)=>(s.updatedAt||0)-(r.updatedAt||0))[0]}function Ks(e){
let t=[],n=new Set;for(let r of e){let s=r.sessionKey;!s||n.has(s)||(n.add(s),t.push(r.references.find(i=>i.kind==="sess\
ion")?.label??r.provenance))}return t}function jo(e,t,n=Nt,r=[],s){let i=new Map,d=[],u=new Map;for(let p of e){let b=Lo(
p,t);if(u.set(p.id,b),b===null){d.push(p);continue}i.has(b)||i.set(b,[]),i.get(b).push(p)}let f=Es(gn(d,n,s),r),w=new Map;
for(let p of f)w.set(p.items[0].id,p);let x=[],l=new Set;for(let p of e){let b=u.get(p.id)??null;if(b!==null){if(l.has(b))
continue;l.add(b);let S=i.get(b);x.push({key:`initiative:${b}`,name:b,status:go(S),sessions:Ks(S),blocks:gn(S,n,s)});continue}
let C=w.get(p.id);C&&x.push({key:C.key,name:null,status:go(C.items),sessions:[],blocks:[C]})}return x}var Ts=12;function Sn(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Ds(e,t=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let n=_n(e);return n===0?!0:t-n<=yn}function Uo(e,t,n=Date.
now(),r=()=>!1){return e.filter(s=>s.key&&s.key!==t&&s.memory_mode!=="incognito").filter(s=>Ds(s,n)).filter(s=>!r(s)).sort(
(s,i)=>_n(i)-_n(s)).slice(0,Ts)}function _n(e){let t=e.last_ts??e.last_activity_ts??e.created;if(typeof t=="number")return t>
1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Yo(e,t){let n={},r="unknown";
for(let s of e)try{let i=await t(`/api/chat/slots/${encodeURIComponent(s.key)}/summary`);if(!i||typeof i!="object"){r="u\
nsupported";break}if(i.enabled===!1){r="disabled";break}n[s.key]=i,r="available"}catch{r="unsupported";break}return{summaries:n,
support:r}}var Ho=String.raw`
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
    grid-template-columns: var(--ow-work-w, minmax(0, 1fr)) 6px minmax(0, 1fr);
    gap: 12px;
    padding: 16px;
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
    background: var(--border);
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
  .ow-tabs { display: flex; gap: 4px; }
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
  .ow-tab {
    padding: 4px 8px;
    border: 0;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: none;
    color: var(--muted);
    font-size: 13px;
    font-weight: 650;
  }
  .ow-tab:hover { background: none; color: var(--text); }
  .ow-tab[data-selected='true'] {
    border-bottom-color: var(--text-strong);
    color: var(--text-strong);
  }
  .ow-listcard-tools { display: flex; flex: none; flex-direction: column; gap: 10px; padding: 0 14px 12px; }
  .ow-listcard-sub { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* The only scroll container in the column. */
  .ow-work { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .ow-work-inner { padding: 0 14px 14px; }
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
  /* Hugs its text like the "N need you" count pill so the two read as one
     family; sentence-case labels make a fixed alignment width pointless. */
  .ow-verb { flex: none; font-size: 11px; }
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
  /* Sizing only. The resizer hairline to its left is the divider now, so the
     column carries no border-left of its own. */
  .ow-conductor {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: var(--bg);
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
  .ow-pr-verdict {
    flex: none;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 650;
    white-space: nowrap;
  }
  .ow-pr-verdict::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 6px;
    border-radius: 50%;
    background: currentColor;
    vertical-align: 1px;
  }
  .ow-pr-verdict[data-tone='err'] { background: color-mix(in srgb, var(--danger) 16%, transparent); color: var(--danger); }
  .ow-pr-verdict[data-tone='warn'] { background: color-mix(in srgb, var(--warn) 18%, transparent); color: var(--warn); }
  .ow-pr-verdict[data-tone='ok'] { background: color-mix(in srgb, var(--ok) 16%, transparent); color: var(--ok); }
  .ow-pr-verdict[data-tone='muted'] { background: var(--bg-hover); color: var(--muted); }
  .ow-pr-tools { flex: none; padding: 8px 14px 4px; }
  .ow-pr-sublabel { padding: 6px 12px 2px; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
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
  .ow-pr-sessions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 6px 16px 12px;
  }
  .ow-pr-sublabel-inline { color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  /* A jump-link, not a title: quieter and smaller than the PR name above it,
     matching the goal card's secondary text rather than inheriting the 14px base. */
  .ow-pr-session-chip { border: 0; background: none; padding: 0; font: inherit; font-size: 12px; color: var(--muted); cursor: pointer; }
  .ow-pr-session-chip .ow-icon { width: 13px; height: 13px; }
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
  /* A session card's title is a label, not a hit area — its Open button is the
     only way in, so the hover underline would promise an action it does not have. */
  .ow-goalcard-static { cursor: default; }
  .ow-goalcard-static:hover .ow-goalcard-title { text-decoration: none; }
  .ow-goalcard-header[data-selected='true'] .ow-goalcard-title { color: var(--accent); }
  .ow-goalcard-title { flex: 1; min-width: 0; overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: none; }
  .ow-goalcard .ow-block-open { flex: none; margin: 0; }
  /* Split is a correction, not a primary action, so it stays out of the way
     until the card is hovered. Kept reachable without a mouse: it also shows
     while it (or anything in the card) holds focus, and reduced-motion users
     get no fade. */
  .ow-goal-split {
    opacity: 0;
    transition: opacity 120ms ease;
  }
  .ow-goalcard:hover .ow-goal-split,
  .ow-goalcard:focus-within .ow-goal-split,
  .ow-goal-split:focus-visible { opacity: 1; }
  @media (prefers-reduced-motion: reduce) { .ow-goal-split { transition: none; } }
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
    .ow-conductor { min-height: 560px; border-left: 0; border-top: 1px solid var(--border); }
  }
`;import{Fragment as Re,jsx as a,jsxs as m}from"react/jsx-runtime";var Rt=["work","prs","loops","schedule"],Xo=["prs","loo\
ps","schedule","work"],br={work:"Goals / Sessions",prs:"PRs",loops:"Loops",schedule:"Scheduled tasks"};function Ht({id:e,
onPromote:t}){return a(q,{className:"ow-promote","aria-label":`Move ${br[e]} to the first column`,onClick:n=>{n.preventDefault(),
n.stopPropagation(),t(e)},children:"Make primary"})}function Vt({lastUpdated:e,refreshing:t,onRefresh:n}){let r=e?Zt(e):
null;return m("span",{className:"ow-refreshbar",children:[r&&m("span",{className:"ow-updated","aria-live":"polite",children:[
"updated ",r]}),a(q,{className:"ow-refresh",onClick:s=>{s.preventDefault(),s.stopPropagation(),n()},disabled:t,"aria-lab\
el":"Refresh",title:"Refresh",children:a(zs,{className:`ow-icon${t?" ow-spin":""}`,"aria-hidden":"true"})})]})}var Nn="c\
rew-manager.snoozed",Zo="crew-manager.handled",er="crew-manager.done-collapsed",Rn="crew-manager.goal-verdicts",tr="crew\
-manager.goal-memory",vr="crew-manager.goal-semantic.v5",Cn="crew-manager.goal-names.v2",Xs=.7;function nr(e){return V(vr,
{pairs:[...e.pairs],why:[...e.why.entries()],stamp:e.stamp}),e}var or="crew-manager.initiative-collapsed",In="crew-manag\
er.stack-open-v2",rr="crew-manager.tab",An="crew-manager.primary-v1";function re(e,t={}){try{let n=localStorage.getItem(
e);return n?JSON.parse(n):t}catch{return t}}function V(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Zt(e,t=Date.
now()){if(!e)return null;let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let r=Math.round(n/60);if(r<60)
return`${r}m ago`;let s=Math.round(r/60);return s<24?`${s}h ago`:`${Math.round(s/24)}d ago`}function sr(e){return e?new Date(
e).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}function dt(e,t,n){return e<=0?null:`${e} ${e===1?t:n}`}function Jt(e,t=Date.
now(),n=!1){let r=lt(e),s=[n?null:dt(r.sessions,"session","sessions"),dt(r.prs,"PR","PRs"),dt(r.issues,"issue","issues"),
dt(r.loops,"loop","loops"),dt(r.crons,"cron","crons"),dt(r.agents,"agent","agents")].filter(d=>!!d),i=Zt(r.lastActivityAt,
t);return i&&s.push(`last active ${i}`),s.join(" \xB7 ")}var Ee="crew-manager-conductor",Zs=5e3,ea={session:"Session",approval:"\
Approval",agent:"Agent",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending a\
pproval request",subagent_gate_waiting:"Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer t\
he request in the work thread",decision_ready:"Make the decision this work is waiting on",work_in_progress:"Work is in p\
rogress",linked_change_issue:"Open the linked change \u2014 a check is failing or it conflicts",recent_work_ready:"Pick \
this back up, or let it go",approval_needed_for:"Review the pending {{tool}} request",approval_needed:"Approval needed",
tool_call_waiting:"Allow or refuse a waiting tool call",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"\
This agent stopped before finishing \u2014 nothing to do here",workflow_failed:"This workflow stopped before finishing",
workflow_failed_generic:"This workflow stopped before finishing",workflow_running:"Workflow is running",workflow_finished:"\
Workflow finished",monitor_failed:"The latest check stopped before finishing",monitor_running:"Monitor is checking now",
monitor_next_check:"Checks again in {{duration}}.",loop:"Monitor loop",loop_watching:"Re-prompting its own session \u2014 {{c\
ycles}} cycles so far, no limit set",loop_watching_capped:"Re-prompting its own session \u2014 cycle {{cycles}} of {{cap}}",
artifact_ready:"{{kind}} output is ready",stalled_for:"Check on it \u2014 no activity for {{duration}}, still marked running",
stalled_because:"{{reason}} Silent for {{duration}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same lin\
ked change",duplicate_same_artifact:"Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_deliverable:"\
Also being worked in \u201C{{title}}\u201D \u2014 same deliverable",duplicate_same_topic:"Looks like the same work as \u201C{\
{title}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same work",related_sessions:"\
{{count}} other session(s) on this same work",related_same_change:"same change",related_same_artifact:"same artifact",related_same_deliverable:"\
same deliverable",related_same_topic:"similar goal",related_same_step:"same next step",related_more:"and {{count}} more",
rank_approval_owed:"only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"\
the agent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failu\
re has repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{\
duration}}",rank_change_blocked:"a linked change is failing or conflicting",rank_changes_requested:"a reviewer asked you\
 for changes",rank_assigned_to_you:"assigned to you and nobody has started it",rank_merge_ready:"approved and green \u2014 on\
ly you can merge it",rank_nobody_on_it:"nobody is on {{count}} unfinished goal(s) in this session",no_next_step:"No next\
 step recorded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",owned_pull_conflict:"Your pull request has a conflict to resolve.",owned_pull_failing:"Your pull req\
uest has {{count}} failing check(s).",owned_pull_changes_requested:"A reviewer has requested changes on your pull reques\
t.",owned_pull_merge_ready:"Approved with nothing red. Only you can merge it.",owned_pull_awaiting_review:"Waiting on re\
viewers, not on you.",owned_pull_checks_running:"{{count}} check(s) still running.",owned_issue_assigned:"Assigned to yo\
u.",owned_provenance:"{{repo}}",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"\
{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work"};function ye(e,t={}){return ea[e].
replace(/\{\{(\w+)\}\}/g,(n,r)=>t[r]??"")}var ta={followup:"Follow up",unblock:"Unblock"},Ne={"needs-you":"Needs you",running:"\
Running",done:"Done"},Wn={all:"All","needs-you":"Needs you",running:"Running",done:"Done"},ar={all:"All",failing:"Failin\
g",running:"Running",merged:"Merged"},na={session:$n,approval:gr,agent:Ls,workflow:js,monitor:hr,artifact:Os,change:Mn,issue:Fs};
function Be({children:e,onActivate:t,...n}){return a("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:r=>{(r.key===
"Enter"||r.key===" ")&&(r.preventDefault(),t())},children:e})}function ir({label:e,count:t,subtitle:n}){return m("div",{
className:"ow-section-header",children:[m("div",{className:"ow-section-heading",children:[a("h2",{className:"ow-section-\
title",children:e}),a("span",{className:"ow-section-count",children:t})]}),n&&a("p",{className:"ow-section-subtitle",children:n})]})}
function oa(e){if(e.state==="needs-you"){let t=Ut(e);return t?a(te,{variant:"warn",className:"ow-verb",children:ta[t]}):
null}return e.state==="running"?e.moving?m(te,{variant:"aim",children:[a(wr,{className:"ow-icon"}),Ne[e.state]]}):a(te,{
variant:"muted",children:"Queued"}):m(te,{variant:"ok",children:[a(fr,{className:"ow-icon"}),Ne[e.state]]})}function ra({tool:e,purpose:t,busy:n,onAnswer:r,where:s}){return m("div",{className:"ow-permission",children:[m("div",{className:"\
ow-permission-body",children:[m("div",{className:"ow-permission-head",children:[a(qs,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),m("p",{className:"ow-permi\
ssion-what",children:[s&&m("span",{className:"ow-truncate",children:[s," "]}),s?"wants to run ":"Wants to run ",a("code",
{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),m("div",{className:"ow-permission-actions",children:[
a(q,{onClick:()=>r(!0),disabled:n,children:"Approve"}),a(q,{onClick:()=>r(!1),disabled:n,children:"Reject"})]})]})}function Ct({
children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"ow-expand-inner",children:e})})}var Pn=3;
function lr(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function sa({
item:e,busy:t,onDecide:n}){let[r,s]=R(!1),i=e.permissionInput||"",d=i.trim().split(/\s+/)[0]||e.permissionTool||"";return m(
"div",{className:"ow-formal-approval",role:"presentation",onClick:u=>u.stopPropagation(),onKeyDown:u=>u.stopPropagation(),
children:[a("div",{className:"ow-formal-badge",children:"Waiting for approval"}),m("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&m("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),m("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("span",{className:"ow-formal-val ow-formal-mon\
o",children:i||"(no input details)"})]})]}),m("div",{className:"ow-formal-actions",children:[a(q,{disabled:t,onClick:()=>n(
"approved"),children:"Allow once"}),m("span",{className:"ow-trust-wrap",children:[m(q,{disabled:t,onClick:()=>s(u=>!u),"\
aria-expanded":r,children:["Trust ",a(de,{className:"ow-icon ow-trust-caret","data-open":r?"true":void 0,"aria-hidden":"\
true"})]}),r&&m("span",{className:"ow-trust-menu",role:"menu",children:[i&&a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{s(!1),n("trust_command")},children:"Trust this exact command"}),d&&m("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{s(!1),n("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{s(!1),
n("trust")},children:"Trust everything in this session"})]})]}),a(q,{className:"ow-formal-reject",disabled:t,onClick:()=>n(
"rejected"),children:"Reject"})]})]})}function aa({candidates:e,prominent:t,busy:n,onAdd:r}){let[s,i]=R(""),d=t?e:e.filter(
u=>u.sessions>=2);return m("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{className:"\
ow-bootstrap-head",children:t?"No big goals defined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&a(
"div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, or name\
 your own."}),d.length>0&&a("div",{className:"ow-bootstrap-chips",children:d.slice(0,4).map(u=>m("button",{type:"button",
className:"ow-bootstrap-chip",disabled:n,onClick:()=>r(u.name,[u.name]),children:[u.name," ",m("span",{className:"ow-boo\
tstrap-count",children:[u.sessions," session",u.sessions===1?"":"s"]})]},u.name))}),m("div",{className:"ow-bootstrap-cus\
tom",children:[a(Js,{value:s,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:u=>i(u.target.
value),onKeyDown:u=>{u.key==="Enter"&&s.trim()&&(r(s),i(""))}}),a(q,{disabled:n||!s.trim(),onClick:()=>{r(s),i("")},children:"\
Add goal"})]})]})}function dr({members:e}){let t=e[0],n=new Set(e.map(u=>u.sessionKey).filter(Boolean)).size,r=e.filter(
u=>u.state==="needs-you").length,s=e.filter(u=>u.state==="running").length,i=e.filter(u=>u.state==="done").length,d=[`${n}\
 session${n===1?"":"s"}`];return r&&d.push(`${r} need${r===1?"s":""} you`),s&&d.push(`${s} running`),i&&d.push(`${i} don\
e`),m("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),a("d\
iv",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}function En({open:e,onToggle:t,label:n,flag:r,flagWarn:s,
meta:i,why:d,header:u,action:f,children:w}){return m("div",{className:"ow-block ow-goalcard","data-grouped":"true","data\
-open":e?"true":void 0,children:[m("div",{className:"ow-goalcard-summary",children:[t&&a("button",{type:"button",className:"\
ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":"Expand"} ${n??"goal"}`,onClick:t,children:a(de,{className:"\
ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-hidden":"true"})}),u,f,a("span",{className:`ow-goal-flag${s?"\
 ow-goal-flag-warn":""}`,children:r})]}),a("div",{className:"ow-goal-meta",children:i}),d&&m("div",{className:"ow-goal-w\
hy",children:["Grouped because ",d,"."]}),w]})}function ia({block:e,status:t,folded:n,onToggle:r,onSplit:s,selected:i,onSelect:d}){
let u=e.items[0],f=new Set(e.items.map(l=>l.sessionKey).filter(Boolean)).size,w=[];for(let l=0;l<e.items.length;l+=1)for(let p=l+
1;p<e.items.length;p+=1)e.items[l].sessionKey!==e.items[p].sessionKey&&w.push(ge(e.items[l],e.items[p]));let x=m(Re,{children:[
r&&a("button",{type:"button",className:"ow-goal-fold","aria-label":n?`Expand ${u.title}`:`Collapse ${u.title}`,"aria-exp\
anded":!n,onClick:l=>{l.stopPropagation(),r()},children:a(de,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"\
true","aria-hidden":"true"})}),a(Qt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-bloc\
k-name",children:u.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:Ne[t]}),m("span",{className:"\
ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),m("span",{className:"ow-truncate",children:[
f," sessions, one goal"]})]}),s&&a(q,{className:"ow-block-open ow-goal-split",title:"Not the same goal \u2014 split into sepa\
rate cards","aria-label":`Split ${u.title}`,onClick:l=>{l.stopPropagation(),s(w)},children:"Split"})]});return d?a(Be,{onActivate:d,
className:"ow-block-tab ow-goal-tab","aria-pressed":i,"data-selected":i?"true":void 0,children:x}):a("div",{className:"o\
w-block-tab",children:x})}var la=.3;function cr({item:e,items:t,onMerge:n}){let r=t.filter(s=>s.id!==e.id&&s.sessionKey&&
e.sessionKey&&s.sessionKey!==e.sessionKey).map(s=>({other:s,score:at(e,s)?1:Gt(e.title,s.title)})).filter(s=>s.score>=la).
sort((s,i)=>i.score-s.score).slice(0,2);return r.length===0?null:m("div",{className:"ow-merge-hint",children:[a("span",{
className:"ow-merge-hint-label",children:"Same goal?"}),r.map(({other:s})=>m("button",{type:"button",className:"ow-merge\
-hint-btn ow-truncate",onClick:()=>n(ge(e,s)),children:["Merge with \u201C",s.title,"\u201D"]},s.id))]})}function da({item:e,
items:t,folded:n,onToggle:r,onOpen:s}){let d=e.references.find(l=>l.kind==="session")?.label??e.provenance,u=lt(t),f=u.needsYou>
0?"needs-you":t.some(l=>l.state==="running")?"running":"done",w=u.needsYou>0?n?`${u.needsYou} need you`:null:Ne[f],x=Jt(
t,Date.now(),!0);return m(Re,{children:[m("div",{className:"ow-goalcard-summary",children:[r&&a("button",{type:"button",
className:"ow-goalcard-chevron","aria-expanded":!n,"aria-label":`${n?"Expand":"Collapse"} ${d}`,onClick:r,children:a(de,
{className:"ow-icon ow-init-chevron","data-open":n?void 0:"true","aria-hidden":"true"})}),m("span",{className:"ow-goalca\
rd-header ow-goalcard-static",children:[a($n,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncat\
e ow-block-name ow-goalcard-title",children:d})]}),a(q,{className:"ow-block-open",onClick:s,"aria-label":`Open ${d}`,children:"\
Open"}),w&&a("span",{className:`ow-goal-flag${u.needsYou>0?" ow-goal-flag-warn":""}`,children:w})]}),x&&a("div",{className:"\
ow-goal-meta",children:x})]})}function ca(e){let t=(e.checks??[]).filter(r=>r.bucket!=="skipped"),n=e.comments??[];return{
available:!0,total:t.length,passing:t.filter(r=>r.bucket==="passed").length,failing:t.filter(r=>r.bucket==="failed").length,
pending:t.filter(r=>r.bucket==="pending").length,title:e.title,state:e.state?e.state.toUpperCase():void 0,is_draft:!!e.draft,
head:e.headBranch,base:e.baseBranch,author:e.author,updated_at:e.updatedAt,additions:e.additions,deletions:e.deletions,changed_files:e.
changedFiles,merge_state:e.mergeStateStatus?e.mergeStateStatus.toLowerCase():void 0,mergeable:e.mergeable?e.mergeable.toLowerCase():
void 0,auto_merge:!!e.autoMerge,review:ho(n),unresolved:bo(n)}}function Kn(e,t){let n=t?.updated_at?Date.parse(t.updated_at):
0;return{status:e.status,state:t?.state,isDraft:t?.is_draft,mergeState:t?.merge_state,mergeable:t?.mergeable,autoMerge:t?.
auto_merge,base:t?.base,available:t?.available,total:t?.total,passing:t?.passing,failing:t?.failing,pending:t?.pending,unresolved:t?.
unresolved,review:t?.review,updatedAt:n||void 0}}function ua({reference:e,checks:t,folded:n,onToggle:r,selected:s,onSelect:i}){
let d=t?.title||e.label,u=vo(e.url),f=t?.updated_at?Date.parse(t.updated_at):0,w=Kn(e,t),x=St(w),l=wo(w),p=f?Zt(f):null,
b=e.label.replace(/^github\s*/,""),C=[u,b,t?.author,p??void 0,...l].filter(Boolean).join(" \xB7 "),S=m(Re,{children:[a(Mn,
{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:d})]});
return m(Re,{children:[m("div",{className:"ow-goalcard-summary",children:[r&&a("button",{type:"button",className:"ow-goa\
lcard-chevron","aria-expanded":!n,"aria-label":`${n?"Expand":"Collapse"} ${d}`,onClick:r,children:a(de,{className:"ow-ic\
on ow-init-chevron","data-open":n?void 0:"true","aria-hidden":"true"})}),i?a(Be,{onActivate:i,className:"ow-goalcard-hea\
der ow-pr-header","aria-pressed":s,"data-selected":s?"true":void 0,children:S}):a("span",{className:"ow-goalcard-header \
ow-goalcard-static",children:S}),e.url&&a(q,{className:"ow-block-open","aria-label":`Open ${e.label} on the forge`,onClick:M=>{
M.stopPropagation(),window.open(e.url,"_blank","noopener,noreferrer")},children:"Open"}),a("span",{className:"ow-pr-verd\
ict","data-tone":mo[x],children:hn[x]})]}),C&&a("div",{className:"ow-goal-meta",children:C})]})}function pa({reference:e,
onOpenSession:t}){let n=na[e.kind],r=m(Re,{children:[a(n,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.
label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noref\
errer",onClick:s=>s.stopPropagation(),children:r}):e.sessionKey?a(Be,{className:"ow-reference ow-reference-link",onActivate:()=>t(
e.sessionKey),children:r}):a("span",{className:"ow-reference",children:r})}function Bn({item:e,selected:t,continuation:n,
whyRanked:r,onSelect:s,onOpenSession:i,onAnswerPermission:d,permissionBusy:u,onRetry:f,retryBusy:w,onStop:x,stopBusy:l,onPickStep:p,
onSnooze:b,onHandled:C,hideBadge:S,compact:M,headless:k,dot:N,simple:B,onDecideApproval:z,sessionMismatch:$,onFixSessionName:G}){
let[A,me]=R(!1);return m(Be,{onActivate:s,className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?
"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.id}`,children:[m("div",{className:"ow-row\
-layout",children:[m("div",{className:"ow-row-content",children:[!k&&m("div",{className:"ow-row-heading",children:[N&&a(
"span",{className:`ow-dot ow-dot-${N}`,"aria-hidden":"true"}),!B&&(S?e.state==="done"&&a(mr,{className:"ow-icon ow-row-c\
heck","aria-hidden":"true"}):oa(e)),a("span",{className:"ow-row-title",children:e.title})]}),(!M&&!B||t)&&e.summary&&!(e.
nextSteps??[]).some(W=>W.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&
(!B||t)&&m(Be,{className:"ow-row-duplicate",onActivate:()=>i(e.duplicateOf.sessionKey),children:[a(Qt,{className:"ow-ico\
n","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:ye(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.
title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&a(Ct,{children:m("div",{className:"ow-related",children:[
a("span",{className:"ow-related-label",children:ye("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.
map(W=>m(Be,{className:"ow-related-row",onActivate:()=>i(W.sessionKey),children:[a(Qt,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-truncate",children:W.title}),a("span",{className:"ow-related-why",children:ye(`related_${W.
because}`)})]},W.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:ye("related_more",{count:String(
e.relatedMore)})}):null]})}),r&&(!B||t)&&a("div",{className:"ow-row-why",children:r}),!n&&(!B||t)&&m("div",{className:"o\
w-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),lr(e).length>0&&a("span",{"aria-hidden":"\
true",children:"\xB7"}),a("span",{className:"ow-references",children:lr(e).slice(0,3).map(W=>a(pa,{reference:W,onOpenSession:i},
`${W.kind}:${W.id}`))})]}),$&&G&&m("div",{className:"ow-row-mismatch",children:[m("span",{className:"ow-truncate",children:[
"This session's name only mentions ",$.sessionGoal," \u2014 this is ",$.itemGoal," work"]}),a("button",{type:"button",className:"\
ow-mismatch-fix",onClick:W=>{W.stopPropagation(),G()},children:"Rename session to cover both"})]})]}),a("div",{className:"\
ow-row-actions",children:a(de,{className:"ow-icon","aria-hidden":"true"})})]}),t&&p&&e.nextSteps&&e.nextSteps.length>0&&
a(Ct,{children:m("div",{className:"ow-row-steps",children:[a("div",{className:"ow-steps-head",children:"Suggested next s\
teps"}),e.nextSteps.slice(0,A?void 0:Pn).map((W,ce)=>a("button",{type:"button",className:"ow-quote-step",title:W.why??W.
what,onClick:ut=>{ut.stopPropagation(),p(W.what)},children:W.what},`${ce}:${W.what}`)),e.nextSteps.length>Pn&&a("button",
{type:"button",className:"ow-steps-more",onClick:W=>{W.stopPropagation(),me(ce=>!ce)},children:A?"Show fewer":`+${e.nextSteps.
length-Pn} more`})]})}),t&&e.retryPath&&f&&a(Ct,{children:a("div",{className:"ow-retry",children:a(q,{onClick:()=>f(e.retryPath),
disabled:!!w,children:"Retry"})})}),t&&e.stopPath&&x&&a(Ct,{children:a("div",{className:"ow-retry",children:a(q,{onClick:()=>x(
e.stopPath),disabled:!!l,children:l?"Stopping\u2026":"Stop this loop"})})}),t&&e.permissionId&&z&&a(Ct,{children:a(sa,{item:e,
busy:!!u,onDecide:W=>z(e,W)})}),e.state==="needs-you"&&b&&C&&m("div",{className:"ow-row-aside",children:[a("button",{type:"\
button",className:"ow-aside-btn",onClick:W=>{W.stopPropagation(),b(e.id)},children:"Later"}),a("button",{type:"button",className:"\
ow-aside-btn",onClick:W=>{W.stopPropagation(),C(e.id,e.updatedAt)},children:"Handled"})]})]})}var ga=["unblock","followu\
p","running","done"],ma={unblock:{label:"Unblock",cls:"ow-lane-unblock"},followup:{label:"Follow up",cls:"ow-lane-follow\
up"}};function fa(e){return e.state==="done"?"done":e.state==="running"?"running":Ut(e)??"unblock"}function wa({items:e,
selectedId:t,onSelect:n,onOpenSession:r,onAnswerPermission:s,onDecideApproval:i,permissionBusy:d,onRetry:u,retryBusy:f,onPickStep:w,
onSnooze:x,onHandled:l,doneTitles:p}){let[b,C]=R(!1),S=new Map;for(let M of e){let k=fa(M),N=S.get(k);N?N.push(M):S.set(
k,[M])}return m(Re,{children:[ga.filter(M=>S.has(M)).map(M=>{let k=S.get(M),N=M==="unblock"||M==="followup"?ma[M]:null,B=N?
k.map($=>$.action!=="resume"?it(Pe($),ye):""):[],z=N&&B.length>0&&B.every($=>$&&$===B[0])?B[0]:void 0;return m("div",{className:"\
ow-lane",children:[N&&m("div",{className:"ow-lane-head",children:[a("span",{className:`ow-lane-badge ${N.cls}`,children:N.
label}),z&&a("span",{className:"ow-lane-reason",children:z})]}),k.map($=>a(Bn,{item:$,hideBadge:!0,compact:!0,selected:t===
$.id,continuation:!0,whyRanked:z?void 0:$.state==="needs-you"&&$.action!=="resume"?it(Pe($),ye):void 0,onSelect:()=>n($),
onOpenSession:r,onAnswerPermission:s,onDecideApproval:i,permissionBusy:d,onRetry:u,retryBusy:f,onPickStep:w,onSnooze:x,onHandled:l},
$.id))]},M)}),!S.has("done")&&p&&p.length>0&&m("div",{className:"ow-lane ow-lane-done",children:[m("button",{type:"butto\
n",className:"ow-goals-toggle","aria-expanded":b,onClick:()=>C(M=>!M),children:[a(de,{className:"ow-icon","data-open":b?
"true":void 0,"aria-hidden":"true"}),p.length," done"]}),b&&a("ul",{className:"ow-done-list",children:p.map(M=>m("li",{className:"\
ow-row-goal-done",children:[a(mr,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:M})]},
M))})]})]})}function ct({title:e,items:t,selectedId:n,onSelect:r,onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,
permissionBusy:u,onRetry:f,retryBusy:w,onStop:x,stopBusy:l,onPickStep:p,onSnooze:b,onHandled:C,footer:S,collapsed:M,onToggleCollapsed:k,
groupBy:N,prChecks:B,prFilter:z,doneBySession:$,goalVerdicts:G,onSplitGoal:A,onMergeGoal:me,initiativeBlocks:W,initiatives:ce,
onRenameSession:ut,semanticWhy:en,goalNames:Ue,collapsedInitiatives:Me,onToggleInitiative:ke,selectedGoalKey:Ye,onSelectGoal:pt,
selectedPrKey:It,onSelectPr:gt,subtitle:mt,hideHeader:At,emptyLabel:ft}){let Z=Yt(t,N,G),Ce=N==="pr"&&z&&z!=="all"?Z.filter(
y=>y.changeRef&&wn(Kn(y.changeRef,B?.[y.changeRef.url??""]))===z):Z,se=W??[],wt=N==="goal"?se.length:N==="pr"?Ce.length:
t.length,xe=y=>{let P=y.changeRef?B?.[y.changeRef.url??""]:void 0,J=y.header==="pr"?Me?.[y.key]??!((P?.failing??0)>0||y.
items.some(F=>F.state==="needs-you")):!1,Y=y.header==="session"?!!Me?.[y.key]:!1;return m("div",{className:`ow-block${y.
header==="session"||y.header==="pr"?" ow-goalcard":""}`,"data-grouped":y.header?"true":void 0,"data-open":y.header==="se\
ssion"&&!Y||y.header==="pr"&&!J?"true":void 0,children:[y.header==="session"&&y.sessionKey&&a(da,{item:y.items[0],items:y.
items,folded:Y,onToggle:ke?()=>ke(y.key,!Y):void 0,onOpen:()=>s(y.sessionKey)}),y.header==="pr"&&y.changeRef&&a(ua,{reference:y.
changeRef,checks:P,folded:J,onToggle:ke?()=>ke(y.key,!J):void 0,selected:It===y.key,onSelect:gt?()=>gt(y.key):void 0}),y.
header==="goal"&&a(ia,{block:y,onSplit:A,selected:Ye===y.key,onSelect:pt?()=>pt(y.key):void 0}),y.header==="pr"?!J&&a(Re,
{children:m("div",{className:"ow-pr-sessions",children:[a("span",{className:"ow-pr-sublabel-inline",children:"Sessions"}),
xn(y.items).map(F=>m("button",{type:"button",className:"ow-reference ow-reference-link ow-pr-session-chip",onClick:()=>s(
F.sessionKey),children:[a($n,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:F.label})]},
F.sessionKey))]})}):y.header==="session"?!Y&&a(wa,{items:y.items,doneTitles:y.sessionKey?$?.[y.sessionKey]:void 0,selectedId:n,
onSelect:r,onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:f,retryBusy:w,onPickStep:p,onSnooze:b,
onHandled:C}):y.items.map(F=>m(Vo,{children:[a(Bn,{item:F,selected:n===F.id,continuation:y.header==="session",whyRanked:F.
state==="needs-you"&&F.action!=="resume"?it(Pe(F),ye):void 0,onSelect:()=>r(F),onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,
permissionBusy:u,onRetry:f,retryBusy:w,onStop:x,stopBusy:l,onPickStep:p,onSnooze:b,onHandled:C}),N==="goal"&&me&&n===F.id&&
a(cr,{item:F,items:t,onMerge:me})]},F.id))]},y.key)},$e=y=>{let P=ce&&ut?Oo(y,ce):null,J=y.references.find(Y=>Y.kind==="\
session")?.label??"";return m(Vo,{children:[a(Bn,{item:y,selected:n===y.id,dot:Go(y),simple:!0,sessionMismatch:P??void 0,
onFixSessionName:P&&y.sessionKey?()=>ut(y.sessionKey,`${J} & ${P.itemGoal}`.slice(0,200)):void 0,whyRanked:y.state==="ne\
eds-you"&&y.action!=="resume"?it(Pe(y),ye):void 0,onSelect:()=>r(y),onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,
permissionBusy:u,onRetry:f,retryBusy:w,onPickStep:p,onSnooze:b,onHandled:C}),me&&n===y.id&&a(cr,{item:y,items:t,onMerge:me})]},
y.id)},Wt=y=>{if(y.name){let j=Me?.[y.key]??y.status!=="needs-you",ae=y.blocks.flatMap(ee=>ee.items),fe=lt(ae);return a(
En,{open:!j,onToggle:()=>ke?.(y.key,!j),label:y.name,flag:fe.needsYou>0?`${fe.needsYou} need you`:Ne[y.status],flagWarn:fe.
needsYou>0,meta:Jt(ae),header:a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:y.name}),children:j?
a(dr,{members:ae}):ae.map(ee=>$e(ee))},y.key)}let P=y.blocks[0];if(P.header==="goal"){let j=Me?.[y.key]??y.status!=="nee\
ds-you",ae=P.items[0],fe=lt(P.items),ee=[];for(let Q=0;Q<P.items.length;Q+=1)for(let Ae=Q+1;Ae<P.items.length;Ae+=1)ee.push(
ge(P.items[Q],P.items[Ae]));let ht=new Set(P.items.map(Q=>Q.sessionKey).filter(Boolean)).size,Te=Ue?.[P.key]??Do(P.items)??
(ht>1?`${ht} sessions, one goal`:ae.references.find(Q=>Q.kind==="session")?.label??ae.title);return a(En,{open:!j,onToggle:()=>ke?.(
y.key,!j),label:Te,flag:fe.needsYou>0?`${fe.needsYou} need you`:Ne[y.status],flagWarn:fe.needsYou>0,meta:Jt(P.items),why:To(
P.items,G,en),header:a(Be,{onActivate:()=>pt?.(P.key),className:"ow-goalcard-header ow-goal-tab","aria-pressed":Ye===P.key,
"data-selected":Ye===P.key?"true":void 0,children:a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:Te})}),
action:A&&a(q,{className:"ow-block-open ow-goal-split",title:"Not the same goal \u2014 split into separate cards","aria-\
label":`Split ${ae.title}`,onClick:Q=>{Q.stopPropagation(),A(ee)},children:"Split"}),children:j?a(dr,{members:P.items}):
P.items.map(Q=>$e(Q))},y.key)}let J=P.items[0],Y=Ue?.[`item:${J.id}`],F=J.references.find(j=>j.kind==="session")?.label,
Ie=Y??F;if(!Ie||Ie===J.title)return $e(J);let Ke=lt(P.items);return a(En,{open:!0,label:Ie,flag:Ke.needsYou>0?`${Ke.needsYou}\
 need you`:Ne[J.state],flagWarn:Ke.needsYou>0,meta:Jt(P.items),header:a("span",{className:"ow-truncate ow-block-name ow-\
goalcard-title",children:Ie}),children:$e(J)},y.key)};return m("section",{className:"ow-section","aria-label":e,children:[
At?null:k?m(Be,{onActivate:k,className:"ow-section-toggle",children:[a(ir,{label:e,count:wt,subtitle:mt}),a(de,{className:"\
ow-icon ow-section-chevron","data-open":M?void 0:"true","aria-hidden":"true"})]}):a(ir,{label:e,count:wt,subtitle:mt}),M?
null:a("div",{className:"ow-section-list",children:N==="goal"?se.length===0?a("p",{className:"ow-section-empty",children:ft}):
se.map(Wt):Ce.length===0?a("p",{className:"ow-section-empty",children:ft}):Ce.map(xe)}),S]})}function ha(e,t,n=[]){let r=No(
t,ye),s=n.length?[`Noticed since you last spoke (${n.length}):`,...n.map(u=>`- ${u}`),"Mention these only if they matter\
 to what the user asked."]:[];if(!e)return["Crew Manager context: workspace overview.",...r,...s,"Answer the user about \
the state of their work. This is a conversation, not an action channel."].join(`
`);let i=e.references.map(u=>`${u.kind}: ${u.label} (${u.id})`).join(`
`),d=[e.stalledFor?`Silent for ${Fe(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(u=>!!u);return[`Crew Manager context: ${e.title}`,...r,`Selected item: ${e.title}`,
`State: ${Ne[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...d.length>0?[`Why it is on the board:
${d.join(`
`)}`]:[],`References:
${i}`,...s,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(u=>!!u).join(`
`)}var ur="crew-manager.panel-widths";function ba(e,t){let n=e?.first_seen;if(!n)return[];let r=typeof t=="number"?t<=1e10?
t*1e3:t:t?Date.parse(t):NaN;if(!Number.isFinite(r))return[];let s=[];for(let d of e?.stalls??[]){let u=n[d.key];typeof u==
"number"&&(u*1e3<=r||s.push(d.reason?`${d.label} went quiet \u2014 ${d.reason}`:`${d.label} went quiet after ${Fe(d.silent_secs)}`))}
for(let d of e?.error_loops??[]){let u=n[d.key];typeof u=="number"&&(u*1e3<=r||s.push(`${d.label} repeated the same ${d.
tool} failure ${d.repeats} times`))}let i=5;return s.length>i?[...s.slice(0,i),`and ${s.length-i} more`]:s}var ve={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function Xt(e,t,n,r,s){let i=Math.min(s,Math.max(n,t-
r));return Math.max(n,Math.min(i,e))}function pr({side:e,containerRef:t,min:n,reserve:r,max:s,value:i,onChange:d,label:u}){
let f=(l,p)=>{let b=p.getBoundingClientRect(),C=e==="start"?l-b.left:b.right-l;return Xt(C,p.clientWidth,n,r,s)};return a(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":u,tabIndex:0,onPointerDown:l=>{
let p=t.current;if(!p)return;l.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let b=S=>d(f(S.clientX,p)),C=()=>{window.removeEventListener("pointermove",b),window.removeEventListener("pointeru\
p",C),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",b),window.addEventListener(
"pointerup",C)},onKeyDown:l=>{if(l.key!=="ArrowLeft"&&l.key!=="ArrowRight")return;let p=t.current;if(!p)return;l.preventDefault();
let b=(l.shiftKey?48:16)*(l.key==="ArrowRight"?1:-1),C=i??(e==="start"?p.clientWidth/2:Math.round(p.clientWidth*.3));d(Xt(
C+(e==="start"?b:-b),p.clientWidth,n,r,s))}})}function va(){let e=Us(),t=le(e);t.current=e;let n=Ys(),r=Hs(),[s,i]=R("al\
l"),[d,u]=R(()=>{let o=re(An,null);return o&&Rt.includes(o)?o:"work"}),[f,w]=R(()=>{let o=re(In,null)??"prs",c=Rt.includes(
o)?o:"prs",g=re(An,null),h=g&&Rt.includes(g)?g:"work";return c===h?Xo.find(v=>v!==h)??null:c}),x=O(o=>{w(c=>{let g=c===o?
null:o;return V(In,g),g})},[]),[l,p]=R(()=>re(rr,null)==="session"?"session":"goal"),[b,C]=R("all"),[S,M]=R({}),[k,N]=R(
null),[B,z]=R("session"),[$,G]=R(null),[A,me]=R(null),[W,ce]=R({}),[ut,en]=R("unknown"),Ue=le("unknown"),Me=le(new Map),
[ke,Ye]=R({}),[pt,It]=R(null),[gt,mt]=R({}),[At,ft]=R([]),[Z,Ce]=R(null),[se,wt]=R(null),[xe,$e]=R(null),[Wt,y]=R(()=>re(
Nn)),[P,J]=R(()=>re(Zo)),[Y,F]=R(()=>re(Rn,{merged:[],split:[]})),Ie=le(null),Ke=le(null),[j,ae]=R(()=>re(ur,{work:null,
conductor:null}));X(()=>{V(ur,j)},[j]),X(()=>{let o=()=>ae(c=>{let g=Ke.current?.clientWidth??0,h=Ie.current?.clientWidth??
0;return{work:c.work==null||g===0?c.work:Xt(c.work,g,ve.workMin,ve.railReserve,1/0),conductor:c.conductor==null||h===0?c.
conductor:Xt(c.conductor,h,ve.conductorMin,ve.mainReserve,ve.conductorMax)}});return o(),window.addEventListener("resize",
o),()=>window.removeEventListener("resize",o)},[]);let fe=le(re(tr,[])),[ee,ht]=R(()=>{let o=re(vr,null);return{pairs:new Set(
o?.pairs??[]),why:new Map(o?.why??[]),stamp:o?.stamp??""}}),[Te,Q]=R(()=>re(Cn,{})),Ae=le([]),tn=le(!1),[De,Tn]=R([]),[He,
yr]=R(()=>re(or)),[Pt,bt]=R(null),[Et,vt]=R(null),[kr,xr]=R(()=>re(er,null)??!0),[Dn,Ln]=R({}),[On,nn]=R([]),[on,_r]=R([]),
[Sr,rn]=R(!1),Ve=O(o=>{if(o===d)return;let c=f===o?Xo.find(g=>g!==o)??null:f;V(An,o),V(In,c),u(o),w(c)},[d,f]),Nr=O((o,c)=>{
o.dataTransfer.setData("text/x-crew-panel",c),o.dataTransfer.effectAllowed="move";let g=o.currentTarget.querySelector("s\
ummary");if(!g)return;let h=g.getBoundingClientRect();o.dataTransfer.setDragImage(g,Math.min(Math.max(o.clientX-h.left,0),
h.width),Math.min(Math.max(o.clientY-h.top,0),h.height))},[]),Rr=O(o=>{o.preventDefault(),rn(!1);let c=o.dataTransfer.getData(
"text/x-crew-panel");!c||!Rt.includes(c)||Ve(c)},[Ve]),zn=H(()=>Rt.filter(o=>o!==d),[d]),Cr=f&&f!==d?String(zn.indexOf(f)):
"none",Bt=o=>{let c=o===d;return{className:"ow-card ow-stack-card",open:c||f===o,draggable:!0,"data-panel":o,"data-prima\
ry":c?"true":"false","data-rail-index":c?void 0:zn.indexOf(o),"data-dragover":c&&Sr?"true":void 0,onDragStart:g=>Nr(g,o),
onDragOver:c?g=>{g.preventDefault(),rn(!0)}:void 0,onDragLeave:c?()=>rn(!1):void 0,onDrop:c?Rr:void 0}},qn=le(!0),[Ir,Gn]=R(
!0),[Fn,sn]=R(null),[Mt,Ar]=R(null),[Je,jn]=R(!1),[Wr,Pr]=R(!1),[Un,_e]=R(null),T=le(!0),yt=le(0),an=le(!1);X(()=>(T.current=
!0,()=>{T.current=!1,yt.current+=1}),[]);let D=O(async()=>{let o=++yt.current,c=t.current;try{let[g,h,v,_,pe,he,K,ie]=await Promise.
all([c.get("/api/chat/slots"),c.get("/api/approvals"),c.get("/api/spawn"),c.get("/api/workflows/runs"),c.get("/api/crons"),
c.get("/api/artifacts"),c.get("/api/autonudge").catch(()=>({loops:[]})),c.get("/api/crons/history?limit=200").catch(()=>({
runs:[]}))]);if(!T.current||o!==yt.current)return;me({slots:Array.isArray(g)?g:[],approvals:Array.isArray(h)?h:[],agents:Array.
isArray(v.agents)?v.agents:[],workflows:Array.isArray(_.runs)?_.runs:[],crons:Array.isArray(pe.jobs)?pe.jobs:[],artifacts:Array.
isArray(he.artifacts)?he.artifacts:[],loops:Array.isArray(K?.loops)?K.loops:[]}),_r(Array.isArray(ie?.runs)?ie.runs:[]),
sn(null),Ar(Date.now())}catch(g){T.current&&o===yt.current&&sn(g instanceof Error?g:new Error("Unable to load Crew Manag\
er sources"))}finally{T.current&&o===yt.current&&Gn(!1)}},[]);X(()=>{D();let o=window.setInterval(()=>{D()},Zs);return()=>window.
clearInterval(o)},[D]);let Er=()=>{Gn(!0),sn(null),D()},$t=O(()=>{Je||(jn(!0),D().finally(()=>{T.current&&jn(!1)}))},[D,
Je]);X(()=>{if(!A||Ue.current==="unsupported"||Ue.current==="disabled")return;let o=Uo(A.slots,Ee,Date.now(),g=>Me.current.
get(g.key)===Sn(g));if(o.length===0)return;let c=!1;return(async()=>{let{summaries:g,support:h}=await Yo(o,v=>t.current.
get(v));if(!(c||!T.current)&&(Ue.current=h,en(h),h==="available")){for(let v of o)g[v.key]&&Me.current.set(v.key,Sn(v));
ce(v=>({...v,...g}))}})(),()=>{c=!0}},[A]),X(()=>{if(!A||!qn.current)return;let o=!1;return(async()=>{try{let c=await t.
current.get("/api/apps/crew-manager/stalls");if(o||!T.current)return;let g={};for(let v of c?.stalls??[])v?.key&&(g[v.key]=
v);Ye(g);let h={};for(let v of c?.error_loops??[])v?.key&&(h[v.key]=v);Ln(h),It(c??null);try{let v=await t.current.get("\
/api/apps/crew-manager/assigned");!o&&T.current&&nn(v?.available&&Array.isArray(v.rows)?v.rows:[])}catch{T.current&&nn([])}}catch{
qn.current=!1,T.current&&(Ye({}),Ln({}),It(null),nn([]))}})(),()=>{o=!0}},[A]),X(()=>{let o=!1;return(async()=>{try{let c=await t.
current.get("/api/apps/crew-manager/initiatives");if(o||!T.current)return;Tn((c?.initiatives??[]).filter(g=>g?.name))}catch{}})(),
()=>{o=!0}},[]);let Yn=H(()=>Ao(Mo({...A??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},
assigned:On},ye,W,ke,Dn,Y),gt),[A,W,ke,Dn,gt,Y,On]),Kt=H(()=>Po(Yn,Wt,P),[Yn,Wt,P]),E=H(()=>Kt.items.filter(o=>Eo(o)),[Kt]),
Tt=H(()=>kn(E),[E]),Hn=H(()=>{let o={};for(let c of E){if(c.state!=="done"||!c.sessionKey)continue;let g=o[c.sessionKey];
g?g.push(c.title):o[c.sessionKey]=[c.title]}return o},[E]),We=H(()=>E.find(o=>o.id===k)??null,[E,k]),kt=H(()=>s==="all"?
E:E.filter(o=>o.state===s),[s,E]),Dt=H(()=>{let o={all:0,failing:0,running:0,merged:0};for(let c of Yt(E,"pr")){if(!c.changeRef)
continue;o.all++;let g=wn(Kn(c.changeRef,S[c.changeRef.url??""]));g!=="other"&&o[g]++}return o},[E,S]);X(()=>{let o=new Set;
for(let g of E)for(let h of g.references)h.kind==="change"&&h.url&&/\/pull\/\d|\/merge_requests\/\d/.test(h.url)&&o.add(
h.url);let c=!1;for(let g of o)S[g]||t.current.post("/api/source/pull-request",{url:g}).then(h=>{!c&&T.current&&h?.title&&
M(v=>({...v,[g]:ca(h)}))}).catch(()=>{});return()=>{c=!0}},[E,S]),X(()=>r(Tt["needs-you"]),[Tt,r]),X(()=>{k&&!E.some(o=>o.
id===k)&&N(null)},[E,k]),X(()=>{V(rr,l)},[l]);let Lt=A?.slots.find(o=>o.key===Ee),Br=!!(Lt||Wr);X(()=>{!A||Lt||an.current||
(an.current=!0,e.get("/api/apps/crew-manager/conductor-agent").then(o=>o?.available&&o.agent?o.agent:null).catch(()=>null).
then(o=>e.post("/api/chat/slots",{name:Ee,title:"Conductor",...o?{agent:o}:{}})).then(()=>{T.current&&(Pr(!0),D())}).catch(
o=>{T.current&&(an.current=!1,_e(o instanceof Error?`Conductor session could not be created: ${o.message}`:"Conductor se\
ssion could not be created"))}))},[e,Lt,D,A]);let Vn=H(()=>yo(A?.approvals??[],At,o=>E.find(c=>c.sessionKey===o)?.title??
A?.slots?.find(c=>c.key===o)?.title??o),[E,A,At]),Qe=We&&!We.permissionId?We:null,ue=H(()=>jo(E,De,Y,fe.current,ee.pairs),
[E,De,Y,ee]);X(()=>{let o=Ko(ue.filter(c=>c.name===null).flatMap(c=>c.blocks));fe.current=o,V(tr,o)},[ue]),X(()=>{if(Ae.
current.length===0)return;let o=ue.filter(h=>h.name===null).flatMap(h=>h.blocks),c={},g=[];for(let h of Ae.current){let v=o.
find(_=>_.items.length>1&&h.ids.filter(pe=>_.items.some(he=>he.id===pe)).length>=2);v?c[v.key]=h.name:g.push(h)}Ae.current=
g,Object.keys(c).length>0&&Q(h=>{let v={...h,...c};return V(Cn,v),v})},[ue]),X(()=>{let o=ue.filter(v=>v.name===null).flatMap(
v=>v.blocks),c=o.filter(v=>v.items.length>1).map(v=>({key:v.key,name:Te[v.key]??null,items:v.items.map(_=>({id:_.id,title:_.
title}))})),g=o.filter(v=>v.items.length===1).map(v=>({id:v.items[0].id,title:v.items[0].title,detail:v.items[0].summary??
""}));if(g.length===0&&c.every(v=>v.name))return;let h=JSON.stringify([c.map(v=>[v.key,v.name]),g.map(v=>v.id).sort()]);
h===ee.stamp||tn.current||(tn.current=!0,(async()=>{try{let v=await t.current.post("/api/apps/crew-manager/goal-pass",{clusters:c,
ungrouped:g});if(!T.current)return;if(!v?.available){ht(I=>nr({pairs:I.pairs,why:I.why,stamp:h}));return}let _=new Map;for(let I of o)
for(let L of I.items)_.set(L.id,L);let pe=new Map(o.map(I=>[I.key,I])),he=new Set(ee.pairs),K=new Map(ee.why),ie=new Map,
oe=new Map;for(let I of v.assignments??[]){if((I.confidence??0)<Xs)continue;let L=I.item_id?_.get(I.item_id):void 0;if(!(!L?.
sessionKey||!I.cluster)){if(I.cluster.startsWith("existing:")){let be=pe.get(I.cluster.slice(9))?.items.find(zt=>zt.id!==
L.id);if(!be)continue;let ze=ge(L,be);he.add(ze),I.why&&K.set(ze,I.why)}else if(I.cluster.startsWith("new:")){let rt=ie.
get(I.cluster)??[];rt.push(L),ie.set(I.cluster,rt),I.why&&oe.set(L.id,I.why)}}}let _t=new Map;for(let I of v.names??[])I.
cluster&&I.name&&_t.set(I.cluster,I.name);let Qn=[];for(let[I,L]of ie){if(L.length<2)continue;for(let be=0;be<L.length;be+=
1)for(let ze=be+1;ze<L.length;ze+=1){let zt=ge(L[be],L[ze]);he.add(zt);let Xn=oe.get(L[be].id)??oe.get(L[ze].id);Xn&&K.set(
zt,Xn)}let rt=_t.get(I);rt&&Qn.push({ids:L.map(be=>be.id),name:rt})}Ae.current=Qn;let Ot={};for(let[I,L]of _t)I.startsWith(
"new:")||(I.startsWith("item:")?!Te[I]&&_.has(I.slice(5))&&(Ot[I]=L):pe.has(I)&&(Ot[I]=L));Object.keys(Ot).length>0&&Q(I=>{
let L={...I,...Ot};return V(Cn,L),L}),ht(nr({pairs:he,why:K,stamp:h}))}catch{}finally{tn.current=!1}})())},[ue,Te,ee]);let we=H(
()=>{if(!Pt)return null;for(let o of ue){let c=o.blocks.find(g=>g.key===Pt);if(c&&c.items.length>0)return c}return null},
[Pt,ue]),ne=we?Fo(we.items):null,Se=H(()=>{if(!Et)return null;let o=Yt(E,"pr",Y).find(c=>c.key===Et&&c.header==="pr");return o&&
o.changeRef?o:null},[Et,E,Y]),ln=H(()=>{let o=(A?.loops??[]).filter(h=>h&&h.active!==!1&&h.slot_key);if(o.length===0)return[];
let c=new Map,g=new Map;for(let h of E)for(let v of h.references)v.kind!=="session"||!v.id||v.label&&!c.has(v.id)&&c.set(
v.id,v.label);for(let h of ue)if(h.name)for(let v of h.blocks)for(let _ of v.items)_.sessionKey&&!g.has(_.sessionKey)&&g.
set(_.sessionKey,h.name);return o.map(h=>{let v=Number(h.cycle_count)||0,_=Number(h.max_cycles)||0;return{key:h.slot_key,
title:c.get(h.slot_key)??h.slot_key,goalName:g.get(h.slot_key)??null,progress:_>0?`${v}/${_}`:`${v} ${v===1?"cycle":"cyc\
les"}`,remaining:_>0?Math.max(0,_-v):null,instruction:(h.message??"").replace(/\s+/g," ").trim(),lastFire:U(h.last_fire_ts)}})},
[A,E,ue]),Xe=H(()=>{let o=new Date;o.setHours(0,0,0,0);let c=o.getTime(),g=c+864e5,h=A?.crons??[],v=new Map;for(let K of on){
let ie=U(K.started_at);if(!K.job_id||ie<c||ie>=g)continue;let oe=v.get(K.job_id)??{count:0,failed:0,last:0};oe.count+=1,
K.status&&K.status!=="success"&&(oe.failed+=1),oe.last=Math.max(oe.last,ie),v.set(K.job_id,oe)}let _=h.map(K=>{let ie=v.
get(K.id),oe=U(K.next_run_ts),_t=oe>=c&&oe<g;return{job:K,ran:ie,next:oe,dueToday:_t}}).filter(K=>K.ran||K.dueToday||K.job.
is_running),pe=_.filter(K=>K.ran&&K.ran.failed===0).length,he=_.filter(K=>K.ran&&K.ran.failed>0).length;return{rows:_,done:pe,
failed:he,total:_.length,historyKnown:on.length>0}},[A,on]),[Mr,Jn]=R(!1),$r=H(()=>{if(l!=="goal")return[];let o=zo(A?.slots??
[],De),c=qo(E,De),g=new Set,h=[];for(let v of[...c,...o])g.has(v.name.toLowerCase())||(g.add(v.name.toLowerCase()),h.push(
v));return h.sort((v,_)=>_.sessions-v.sessions)},[l,A,E,De]),Kr=O(async(o,c)=>{try{await t.current.patch(`/api/chat/slot\
s/${encodeURIComponent(o)}/title`,{title:c}),D()}catch{}},[D]),Tr=O(async(o,c=[])=>{if(o.trim()){Jn(!0);try{let g=await t.
current.post("/api/apps/crew-manager/initiatives",{name:o.trim(),aliases:c});T.current&&g?.initiatives&&Tn(g.initiatives.
filter(h=>h?.name))}catch{}finally{T.current&&Jn(!1)}}},[]),Le=O(async(o,c)=>{if(!Z){Ce(o),_e(null);try{await t.current.
post(`/api/approvals/${encodeURIComponent(o)}/${c?"approve":"reject"}`,{}),D()}catch(g){_e(g instanceof Error?`Could not\
 answer that request: ${g.message}`:"Could not answer that request"),D()}finally{T.current&&Ce(null)}}},[D,Z]),Ze=O(async(o,c)=>{
if(!(Z||!o.permissionId||!o.sessionKey)){Ce(o.permissionId),_e(null);try{await t.current.post(`/api/chat/slots/${encodeURIComponent(
o.sessionKey)}/approve`,{action:c,request_id:o.permissionId}),D()}catch(g){_e(g instanceof Error?`Could not answer that \
request: ${g.message}`:"Could not answer that request"),D()}finally{T.current&&Ce(null)}}},[D,Z]),Dr=O(o=>{y(c=>{let g=Object.
fromEntries(Object.entries(c).filter(([,h])=>h>Date.now()));return g[o]=Date.now()+Wo,V(Nn,g),g}),N(null)},[]),Lr=O((o,c)=>{
J(g=>{let h={...g,[o]:c};return V(Zo,h),h}),N(null)},[]),Or=O(()=>{y({}),V(Nn,{})},[]),zr=O(o=>{F(c=>{let g={merged:c.merged.
filter(h=>!o.includes(h)),split:[...new Set([...c.split,...o])]};return V(Rn,g),g})},[]),qr=O(o=>{F(c=>{let g={merged:[...new Set(
[...c.merged,o])],split:c.split.filter(h=>h!==o)};return V(Rn,g),g})},[]),Gr=O(()=>{xr(o=>(V(er,!o),!o))},[]),et=O(async o=>{
if(!se){wt(o),_e(null);try{await t.current.post(o,{}),D()}catch(c){_e(c instanceof Error?`Could not re-run it: ${c.message}`:
"Could not re-run it"),D()}finally{T.current&&wt(null)}}},[D,se]),xt=O(async o=>{if(!xe){$e(o),_e(null);try{await t.current.
del(o),G("Stopped the monitor loop. Re-arming it is done from the session itself."),D()}catch(c){let g=c instanceof Error?
c.message:"";/404|not found/i.test(g)?G("That loop had already stopped."):_e(g?`Could not stop it: ${g}`:"Could not stop\
 it"),D()}finally{T.current&&$e(null)}}},[D,xe]),Oe=O(async o=>{if(Se&&Se.changeRef){let g=Se.changeRef,h=xn(Se.items),v=[
`Crew Manager: this concerns the pull request ${g.label}${g.url?` (${g.url})`:""}.`,h.length?`Sessions that produced it:\

${h.map(_=>`- ${_.label}`).join(`
`)}`:void 0,"Advise on it \u2014 you cannot merge or push, so recommend the session that should act rather than acting."].
filter(Boolean).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(Ee)}/context`,{content:v,source:"crew-manager",ephemeral:!0}).
catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:Ee}).catch(_=>{if(!(_ instanceof SyntaxError))throw _}),!T.
current)return;G(`Asked the Conductor about ${g.label}`),vt(null);return}if(we&&ne?.sessionKey){let g=ne.sessionKey,h=we.
items.map(_=>`- ${_.references.find(pe=>pe.kind==="session")?.label??_.sessionKey}: ${Ne[_.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(g)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${we.items[0].title}", which spans sessions:`,h,"You are the session actively on it, so the instructi\
on is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:g}).catch(_=>{if(!(_ instanceof
SyntaxError))throw _}),!T.current)return;mt(_=>({..._,[ne.id]:Date.now()})),ft(_=>_.includes(g)?_:[..._,g]);let v=ne.references.
find(_=>_.kind==="session")?.label??ne.title;G(ne.moving||ne.state==="running"?`Sent to ${v} \u2014 the active session on thi\
s goal`:`Sent to ${v} \u2014 resuming the last session on this goal`),bt(null),D();return}let c=We&&!We.permissionId?We:
null;if(B==="session"&&c?.sessionKey){let g=c.sessionKey;if(await t.current.post("/api/chat",{message:o,slot:g}).catch(h=>{
if(!(h instanceof SyntaxError))throw h}),!T.current)return;mt(h=>({...h,[c.id]:Date.now()})),ft(h=>h.includes(g)?h:[...h,
g]),G(`Sent new instructions to ${c.title}`),N(null),D();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(
Ee)}/context`,{content:ha(We,E,ba(pt,Lt?.last_ts)),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post(
"/api/chat",{message:o,slot:Ee}).catch(g=>{if(!(g instanceof SyntaxError))throw g})},[We,Se,we,ne,E,D,B]),dn={"needs-you":kt.
filter(o=>o.state==="needs-you"),running:kt.filter(o=>o.state==="running"),done:kt.filter(o=>o.state==="done")},tt=O((o,c)=>{
yr(g=>{let h={...g,[o]:c};return V(or,h),h})},[]),Fr=O(o=>{bt(c=>c===o?null:o),N(null),vt(null),G(null)},[]),jr=O(o=>{vt(
c=>c===o?null:o),N(null),bt(null),G(null)},[]),nt=o=>n(`/chat?sid=${encodeURIComponent(o)}`),ot=o=>{N(c=>c===o.id?null:o.
id),bt(null),vt(null),G(null),z("session")},Ur=Se?m("div",{className:"ow-quote ow-quote-docked",children:[m("div",{className:"\
ow-quote-body ow-quote-goal",children:[m("div",{className:"ow-quote-line",children:[a("span",{className:"ow-eyebrow",children:"\
Asking about PR"}),a("span",{className:"ow-quote-title",title:Se.changeRef?.label,children:Se.changeRef?.label?.replace(
/^github\s*/,"")})]}),a("span",{className:"ow-quote-route ow-truncate",children:"\u2192 Conductor"})]}),a(q,{className:"\
ow-quote-clear","aria-label":"Remove the quoted PR",onClick:()=>{vt(null),G(null)},children:"Clear"})]}):we&&ne?m("div",
{className:"ow-quote ow-quote-docked",children:[m("div",{className:"ow-quote-body ow-quote-goal",children:[m("div",{className:"\
ow-quote-line",children:[a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"ow-quote-ti\
tle",title:we.items[0].title,children:we.items[0].title})]}),m("span",{className:"ow-quote-route ow-truncate",children:[
"\u2192 ",ne.references.find(o=>o.kind==="session")?.label??ne.title,ne.moving||ne.state==="running"?" (active)":" (will\
 resume)"]})]}),a(q,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{bt(null),G(null)},children:"\
Clear"})]}):Qe?m("div",{className:"ow-quote ow-quote-docked",children:[m("div",{className:"ow-quote-body",children:[Qe.sessionKey?
a("button",{type:"button",className:"ow-scope-toggle","aria-pressed":B==="conductor","aria-label":B==="session"?"Sending\
 to this session. Activate to send to the Conductor instead.":"Sending to the Conductor. Activate to send to this sessio\
n instead.",onClick:()=>z(o=>o==="session"?"conductor":"session"),children:B==="session"?"Instructing":"To Conductor"}):
a("span",{className:"ow-eyebrow",children:"Quoted"}),a("span",{className:"ow-quote-title",title:Qe.title,children:Qe.title})]}),
a(q,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{N(null),G(null)},children:"Clear"})]}):
null;return m("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[a("style",{children:Ho}),a("d\
iv",{className:"ow-titlebar",children:a(Qs,{title:m("span",{className:"ow-title-line",children:["Crew Manager",a("span",
{className:"ow-beta","aria-label":"Beta preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still\
 running, and what finished recently."})}),a("div",{className:"ow-body",children:m("div",{className:"ow-layout",ref:Ie,style:j.
conductor!=null?{"--ow-conductor-w":`${j.conductor}px`}:void 0,children:[m("div",{className:"ow-main","data-open-row":Cr,
ref:Ke,style:j.work!=null?{"--ow-work-w":`${j.work}px`}:void 0,children:[m("details",{...Bt("work"),"aria-label":"Work",
children:[m("summary",{onClick:o=>{o.preventDefault(),d!=="work"&&x("work")},children:[m("span",{className:"ow-stack-tit\
le",children:[a(de,{className:"ow-icon ow-stack-chevron"}),a(Qt,{className:"ow-icon"}),d==="work"?a("span",{className:"o\
w-tabs",role:"tablist","aria-label":"View",children:["goal","session"].map(o=>a(q,{role:"tab","aria-selected":l===o,"dat\
a-selected":l===o,className:"ow-tab",onClick:()=>p(o),children:o==="goal"?"Goals":"Sessions"},o))}):br.work]}),m("span",
{className:"ow-stack-actions",children:[a(te,{variant:"muted",children:Tt.all}),d==="work"?a(Vt,{lastUpdated:Mt,refreshing:Je,
onRefresh:$t}):a(Ht,{id:"work",onPromote:Ve})]})]}),m("div",{className:"ow-listcard-tools",children:[a("p",{className:"o\
w-listcard-sub",children:l==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each sessio\
n needs from you"}),l==="session"&&a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.
keys(Wn).map(o=>m(q,{onClick:()=>i(o),"aria-pressed":s===o,"data-selected":s===o,className:"ow-filter",children:[Wn[o],a(
"span",{className:"ow-count",children:Tt[o]})]},o))})]}),a("main",{className:"ow-work",children:a("div",{className:"ow-w\
ork-inner",children:Ir?a(Jo,{rows:7}):Fn&&!A?a(Qo,{icon:a(gr,{className:"ow-icon"}),title:"Crew Manager could not load t\
he work view",subtitle:Fn.message,action:a(q,{onClick:Er,children:"Try again"})}):(l==="goal"?E.length===0:kt.length===0)?
a(Qo,{icon:a(Gs,{className:"ow-icon"}),title:"No matching work",subtitle:l==="goal"?"No sessions are running yet.":"Chan\
ge the filter to see sessions in another state."}):l==="goal"?a(ct,{title:"Work by goal",hideHeader:!0,items:E,selectedId:k,
onSelect:ot,onOpenSession:nt,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,
onRetry:o=>{et(o)},retryBusy:se!==null,onPickStep:o=>{Oe(o)},groupBy:l,goalVerdicts:Y,onSplitGoal:zr,onMergeGoal:qr,initiativeBlocks:ue,
initiatives:De,onRenameSession:(o,c)=>{Kr(o,c)},semanticWhy:ee.why,goalNames:Te,collapsedInitiatives:He,onToggleInitiative:tt,
selectedGoalKey:Pt,onSelectGoal:Fr,footer:a(aa,{candidates:$r,prominent:De.length===0,busy:Mr,onAdd:(o,c)=>{Tr(o,c)}}),emptyLabel:"\
No matching work"}):s==="all"?m(Re,{children:[a(ct,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",
items:dn["needs-you"],doneBySession:Hn,selectedId:k,onSelect:ot,onSnooze:Dr,onHandled:Lr,footer:Kt.snoozedCount>0?m("but\
ton",{type:"button",className:"ow-aside-note",onClick:Or,children:[Kt.snoozedCount," set aside for later \u2014 bring back"]}):
void 0,onOpenSession:nt,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{
et(o)},retryBusy:se!==null,onStop:o=>{xt(o)},stopBusy:xe!==null,onPickStep:o=>{Oe(o)},collapsedInitiatives:He,onToggleInitiative:tt,
groupBy:l,emptyLabel:"Nothing needs your input right now."}),a(ct,{title:"In progress",subtitle:"Being worked on right n\
ow",items:dn.running,doneBySession:Hn,selectedId:k,onSelect:ot,onOpenSession:nt,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{
Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{et(o)},retryBusy:se!==null,onStop:o=>{xt(o)},stopBusy:xe!==null,onPickStep:o=>{
Oe(o)},collapsedInitiatives:He,onToggleInitiative:tt,groupBy:l,emptyLabel:"Nothing is in progress right now."}),a(ct,{title:"\
Done recently",subtitle:"Finished in the last few days",items:dn.done,selectedId:k,onSelect:ot,collapsed:kr,onToggleCollapsed:Gr,
onOpenSession:nt,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{
et(o)},retryBusy:se!==null,onStop:o=>{xt(o)},stopBusy:xe!==null,onPickStep:o=>{Oe(o)},collapsedInitiatives:He,onToggleInitiative:tt,
groupBy:l,emptyLabel:"No recent completed work."})]}):a(ct,{title:Wn[s],items:kt,selectedId:k,onSelect:ot,onOpenSession:nt,
onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{et(o)},retryBusy:se!==
null,onStop:o=>{xt(o)},stopBusy:xe!==null,onPickStep:o=>{Oe(o)},collapsedInitiatives:He,onToggleInitiative:tt,groupBy:l,
emptyLabel:"No matching work"})})})]}),m("details",{...Bt("prs"),children:[m("summary",{onClick:o=>{o.preventDefault(),d!==
"prs"&&x("prs")},children:[m("span",{className:"ow-stack-title",children:[a(de,{className:"ow-icon ow-stack-chevron"}),a(
Mn,{className:"ow-icon"}),"PRs"]}),m("span",{className:"ow-stack-actions",children:[a(te,{variant:"muted",children:Dt.all}),
d==="prs"?a(Vt,{lastUpdated:Mt,refreshing:Je,onRefresh:$t}):a(Ht,{id:"prs",onPromote:Ve})]})]}),a("p",{className:"ow-sta\
ck-sub",children:"Pull requests your work touches, and what is holding each one up"}),Dt.all>0&&a("div",{className:"ow-p\
r-tools",children:a("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(ar).
map(o=>m(q,{onClick:()=>C(o),"aria-pressed":b===o,"data-selected":b===o,className:"ow-filter",children:[ar[o],a("span",{
className:"ow-count",children:Dt[o]})]},o))})}),a("div",{className:"ow-stack-body",children:Dt.all===0?a("p",{className:"\
ow-stack-empty",children:"No work is linked to a PR right now. Work links to one when a session mentions its URL."}):a(Re,
{children:a(ct,{title:"Work by PR",hideHeader:!0,items:E,prChecks:S,prFilter:b,collapsedInitiatives:He,onToggleInitiative:tt,
selectedId:k,onSelect:ot,onOpenSession:nt,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==
null,onRetry:o=>{et(o)},retryBusy:se!==null,onStop:o=>{xt(o)},stopBusy:xe!==null,onPickStep:o=>{Oe(o)},selectedPrKey:Et,
onSelectPr:jr,groupBy:"pr",emptyLabel:"No PR matches that status."})})})]}),m("details",{...Bt("loops"),children:[m("sum\
mary",{onClick:o=>{o.preventDefault(),d!=="loops"&&x("loops")},children:[m("span",{className:"ow-stack-title",children:[
a(de,{className:"ow-icon ow-stack-chevron"}),a(hr,{className:"ow-icon"}),"Loops"]}),m("span",{className:"ow-stack-action\
s",children:[a(te,{variant:"muted",children:ln.length}),d==="loops"?a(Vt,{lastUpdated:Mt,refreshing:Je,onRefresh:$t}):a(
Ht,{id:"loops",onPromote:Ve})]})]}),a("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),
a("div",{className:"ow-stack-body",children:ln.length===0?a("p",{className:"ow-stack-empty",children:"No loop is running\
 right now."}):ln.map(o=>{let c=Zt(o.lastFire),g=[c&&`last tick ${c}`,o.remaining!==null&&`${o.remaining} remaining`].filter(
Boolean).join(" \xB7 ");return m("div",{className:"ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:"\
var(--warn)"}}),m("div",{children:[m("div",{className:"ow-mini-title",children:[o.goalName??o.title,a("span",{className:"\
ow-mini-chip",children:o.progress})]}),o.instruction&&a("div",{className:"ow-mini-desc",title:o.instruction,children:o.instruction}),
g&&a("div",{className:"ow-mini-when",children:g})]}),a(te,{variant:"ok",children:"Active"})]},o.key)})})]}),m("details",
{...Bt("schedule"),children:[m("summary",{onClick:o=>{o.preventDefault(),d!=="schedule"&&x("schedule")},children:[m("spa\
n",{className:"ow-stack-title",children:[a(de,{className:"ow-icon ow-stack-chevron"}),a(wr,{className:"ow-icon"}),"Sched\
uled tasks"]}),m("span",{className:"ow-stack-actions",children:[m(te,{variant:Xe.failed>0?"err":"muted",children:[Xe.done,
"/",Xe.total," today"]}),d==="schedule"?a(Vt,{lastUpdated:Mt,refreshing:Je,onRefresh:$t}):a(Ht,{id:"schedule",onPromote:Ve})]})]}),
a("p",{className:"ow-stack-sub",children:Xe.historyKnown?"Today's runs only \u2014 jobs with nothing scheduled today are hidd\
en":"Run history is unavailable, so completed counts may be low"}),a("div",{className:"ow-stack-body",children:Xe.rows.length===
0?a("p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):Xe.rows.map(({job:o,ran:c,next:g,dueToday:h})=>{
let v=!!(c&&c.failed>0),_=[c&&`ran today ${sr(c.last)}${c.count>1?` (${c.count}x)`:""}`,h&&g?`next ${sr(g)}`:null].filter(
Boolean).join(" \xB7 ");return m("div",{className:"ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:v?
"var(--danger)":o.enabled===!1?"var(--muted)":"var(--warn)"}}),m("div",{children:[a("div",{className:"ow-mini-title",children:o.
name}),o.schedule&&m("div",{className:"ow-mini-desc",children:[o.schedule,o.cron_expr&&a("span",{className:"ow-mini-chip",
children:o.cron_expr})]}),_&&a("div",{className:"ow-mini-when",children:_})]}),o.is_running?a(te,{variant:"aim",children:"\
Running"}):v?a(te,{variant:"err",children:"Failed"}):o.enabled===!1?a(te,{variant:"muted",children:"Paused"}):c?a(te,{variant:"\
ok",children:"Success"}):a(te,{variant:"warn",children:"Pending"})]},o.id)})})]}),a(pr,{side:"start",containerRef:Ke,min:ve.
workMin,reserve:ve.railReserve,max:1/0,value:j.work,onChange:o=>ae(c=>({...c,work:o})),label:"Resize the work column"})]}),
a(pr,{side:"end",containerRef:Ie,min:ve.conductorMin,reserve:ve.mainReserve,max:ve.conductorMax,value:j.conductor,onChange:o=>ae(
c=>({...c,conductor:o})),label:"Resize the Conductor panel"}),m("aside",{className:"ow-conductor","aria-label":"Conducto\
r",children:[a("div",{className:"ow-conductor-header",children:m("div",{className:"ow-conductor-title",children:[a("h2",
{children:"Conductor"}),!Qe&&a("span",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),a("\
div",{className:"ow-chat",children:Br?m("div",{className:"ow-chat-panel",children:[Vn.length>0&&a("div",{className:"ow-p\
ermissions",role:"alert",children:Vn.map(o=>a(ra,{tool:o.tool,purpose:o.purpose,where:o.sessionLabel,busy:Z!==null,onAnswer:c=>{
Le(o.id,c)}},o.id))}),$&&m("div",{className:"ow-conductor-receipt",role:"status",children:[a(fr,{className:"ow-icon"}),$]}),
Un&&a("div",{className:"ow-chat-error",role:"alert",children:Un}),a("div",{className:"ow-embed",children:a(Vs,{slotKey:Ee,
frameless:!0,startAtBottom:!0,slotControls:!0,placeholder:Se?"Ask the Conductor about this PR\u2026":we?"Instruction for\
 this goal\u2026":Qe?.sessionKey&&B==="session"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:Oe,
aboveComposer:Ur})})]}):a("div",{className:"ow-chat-loading",children:a(Jo,{rows:4})})})]})]})})]})}export{va as default,ba as noticedSinceLastTurn};
