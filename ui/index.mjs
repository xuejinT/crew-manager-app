import{Fragment as qo,useCallback as D,useEffect as J,useMemo as V,useRef as ie,useState as S}from"react";import{AlertTriangle as ir,
Bot as Es,Check as lr,ChevronRight as le,Check as dr,Clock as cr,Package as Bs,ExternalLink as An,MessageSquare as Wn,RefreshCw as Ms,
Shield as $s,Waves as ur,Search as Ks,Tag as Ls,Users as Yt,Zap as Ts}from"lucide-react";import{useAppApi as Ds,useNavigate as Os,
useNavBadge as zs,ChatEmbed as Gs}from"@kirocrew/app-sdk";import{Badge as Q,Btn as z,ContentSkeleton as Fo,EmptyState as jo,
Input as qs,PageHeader as Fs}from"@kirocrew/app-sdk/ui";function st(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),r=t%
60;return r===0?`${n} hour${n===1?"":"s"}`:`${n}h ${r}m`}function zr(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function gn(e){let t=_t(e);return t==="merged"?"merged":t==="conflict"||t==="ci-failing"||
t==="changes-requested"?"failing":t==="checks-running"?"running":"other"}var mn={merged:"Merged",closed:"Closed",draft:"\
Draft",conflict:"Conflict","ci-failing":"CI failing",behind:"Behind base","checks-running":"Checks running","changes-req\
uested":"Changes requested","comments-open":"Comments open","needs-review":"Needs review",ready:"Ready",open:"Open"},ao={
merged:"muted",closed:"muted",draft:"muted",conflict:"err","ci-failing":"err",behind:"warn","checks-running":"warn","cha\
nges-requested":"err","comments-open":"warn","needs-review":"warn",ready:"ok",open:"muted"},Gr=2;function io(e){return e.
mergeable==="conflicting"||e.mergeState==="dirty"?!0:e.mergeable||e.mergeState?!1:e.status==="conflict"}function _t(e){let t=(e.
state??"").toUpperCase(),n=!!e.available&&(e.total??0)>0;return t==="MERGED"||!t&&e.status==="merged"?"merged":t==="CLOS\
ED"?"closed":e.isDraft||e.mergeState==="draft"?"draft":io(e)?"conflict":(e.failing??0)>0||!n&&e.status==="checks failing"?
"ci-failing":e.review==="changes-requested"?"changes-requested":(e.unresolved??0)>0?"comments-open":e.mergeState==="behi\
nd"||e.mergeState==="need_rebase"?"behind":(e.pending??0)>0||!n&&e.status==="checks running"?"checks-running":e.mergeState===
"blocked"?"needs-review":e.review==="approved"||e.mergeState==="clean"&&n&&(e.failing??0)===0?"ready":"open"}var qr=4;function lo(e,t=Date.
now()){let n=[],r=(e.state??"").toUpperCase();if(r==="MERGED"||e.status==="merged")return[];if(r==="CLOSED")return[];(e.
isDraft||e.mergeState==="draft")&&n.push("Draft"),e.review==="changes-requested"?n.push("Changes requested"):e.review===
"approved"&&n.push("Approved");let s=e.failing??0,i=e.pending??0;s>0?n.push(`${s} check${s===1?"":"s"} failing`):i>0?n.push(
`${i} check${i===1?"":"s"} running`):e.available&&(e.total??0)>0&&n.push("All checks passing"),io(e)?n.push(`merge confl\
ict with ${e.base||"the base branch"}`):(e.mergeState==="behind"||e.mergeState==="need_rebase")&&n.push(`behind ${e.base||
"the base branch"}`);let d=e.unresolved??0;d>0&&n.push(`${d} unresolved comment${d===1?"":"s"}`),e.mergeState==="blocked"&&
e.review!=="changes-requested"&&n.push("waiting on review"),e.autoMerge?n.push("auto-merge armed"):_t(e)==="ready"&&n.push(
"ready to merge");let u=e.updatedAt?Math.floor((t-e.updatedAt)/864e5):0;u>=Gr&&n.push(`no activity in ${u} days`);let f=mn[_t(
e)].toLowerCase();return n.filter(w=>w.toLowerCase()!==f).slice(0,qr)}function co(e){let t=new Map;for(let r of e){if(r.
kind!=="review")continue;let s=(r.state??"").toUpperCase();if(s!=="APPROVED"&&s!=="CHANGES_REQUESTED")continue;let i=r.createdAt&&
Date.parse(r.createdAt)||0,d=r.author??"",u=t.get(d);(!u||i>=u.at)&&t.set(d,{at:i,state:s})}let n=[...t.values()].map(r=>r.
state);return n.includes("CHANGES_REQUESTED")?"changes-requested":n.includes("APPROVED")?"approved":"none"}function uo(e){
let t=new Set;for(let n of e)!n.resolvable||n.resolved||t.add(n.threadId||n.id||"");return t.size}function po(e){if(!e)return;
let t;try{t=new URL(e).pathname}catch{return}let n=t.split("/").filter(Boolean),r=n.indexOf("-");if(r>0)return n[r-1];let s=n.
findIndex(i=>i==="pull"||i==="pulls"||i==="merge_requests");return s>0?n[s-1]:n.length>1?n[1]:void 0}function go(e,t,n){
let r=new Set(t.filter(Boolean));if(r.size===0)return[];let s=new Set,i=[];for(let d of e){let u=d.slot;!u||!r.has(u)||!d.
id||s.has(d.id)||(s.add(d.id),i.push({id:d.id,sessionKey:u,sessionLabel:n(u),tool:d.tool||"a tool",purpose:d.tool_purpose}))}
return i}var Hn={"needs-you":0,running:1,done:2};function F(e){if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;
let t=Date.parse(e);return Number.isFinite(t)?t:0}function Fr(e,t){if(e.paused)return"";let n=F(e.next_run_ts);if(!n)return"";
let r=Math.round((n-t)/1e3);return r<=0?"":st(r)}var Vn=72;function ze(e,t){let n=e?.replace(/\s+/g," ").trim();if(!n)return t;
let s=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(/[.;,]$/,"");if(s.length<=Vn)return s;let i=s.
slice(0,Vn),d=i.lastIndexOf(" ");return`${(d>24?i.slice(0,d):i).trim()}\u2026`}function Ge(e){return!!e.source_links?.some(
t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var jr=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
Ur=/^\((?:code|diff|widget|image)\)$/,Hr=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
Vr=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,Yr=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
Jr=/[?？]["'”’)\]]*$/;function mo(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||Ur.test(t)||jr.test(
t)?null:t}function fn(e){if(!e.waiting_for_input)return null;let t=mo(e);return!t||Hr.test(t)||Vr.test(t)?null:Yr.test(t)||
Jr.test(t)?t:null}function Yn(e){return e.pending_approval||fn(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":Ge(e)?"needs-you":"done"}function Qr(e,t){if(e.pending_approval)return t("approval_waiting");let n=fn(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):Ge(e)?t("linked_change_issue"):mo(e)??t("recent_w\
ork_ready"))}function ln(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function Xr(e){return e.pending_approval?"review-approval":fn(e)?"reply":"open"}function fo(e){
return(e.source_links??[]).map(t=>({number:String(t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.
kind==="issue"?`issue #${t.number}`:`${t.provider} #${t.number}`,url:t.url,sessionKey:e.key,status:zr(t)}}))}function Zr(e,t){
let n=fo(e).map(r=>r.ref);return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:Qr(e,t),state:Yn(e),moving:Yn(
e)==="running"||void 0,issue:Ge(e),updatedAt:F(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:ln(
e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:Ge(e)||void 0,action:Xr(e),references:[{kind:"session",id:e.key,label:e.
title||t("untitled_work"),sessionKey:e.key},...n]}}function wn(e,t){e.references.some(n=>n.kind===t.kind&&n.id===t.id)||
e.references.push(t)}function wo(e){return(e.source||"").toLowerCase()==="subagent"}function es(e,t,n){let r=wo(t);e.state=
"needs-you",e.updatedAt=Math.max(e.updatedAt,F(t.ts)),e.summary=n(r?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=
r?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=
t.tool_purpose,e.permissionInput=t.tool_input,wn(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),sessionKey:t.
slot||e.sessionKey})}function ts(e,t,n){e.updatedAt=Math.max(e.updatedAt,F(t.started)),e.issue||=!!(t.done&&(t.error||t.
outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_failed",{task:t.
task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),wn(e,{kind:"agent",id:t.id,label:t.agent||
n("agent"),sessionKey:t.parent||e.sessionKey})}function ns(e,t,n){e.issue||=t.status==="failed",t.status==="running"&&e.
state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow_failed",{name:t.
name})),wn(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function os(e,t){
if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"dropped":return"\
done";case"in-progress":return"running";default:return null}}function rs(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function ss(e){let t=null,n=-1;for(let r of e){let s=r.last_touched_turn??0;s>n&&(n=s,t=r)}return t}function as(e,t){let n=e.next_steps?.find(s=>s.what?.trim())?.what?.trim();if(n)return n;let r=[...e.progress??[]].reverse().
find(s=>s.trim());return r?r.trim():e.initial_intent?.trim()||t("work_in_progress")}var is=3;function ls(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function ds(e,t){if(!t)return!1;
let n=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${n}\\b`,"u").test(e)}function Jn(e,t){if(e.length===
0)return[];let n=ls(t);return e.filter(r=>ds(n,r.number)).map(r=>r.ref)}function cs(e,t,n){if(!t?.enabled)return[];let r=t.
intents??[];if(r.length===0)return[];let s=fo(e),i=[],d=ss(r),f=!!(e.running||e.subagents_running||e.orchestrating)?[]:r.
filter(l=>l.state==="in-progress");f.forEach(l=>{let g=r.indexOf(l),b=(l.next_steps??[]).filter(N=>N.what?.trim());i.push(
{id:`unattended:${e.key}:${g}`,title:ze(l.title,e.title||n("untitled_work")),summary:b[0]?.what?.trim()||n("no_next_step"),
state:"needs-you",issue:Ge(e),updatedAt:F(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:ln(e,n),
queuedBehind:e.queue_depth||void 0,changeBlocked:Ge(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...Jn(s,l)],nextSteps:b,progress:(l.progress??[]).filter(
N=>N.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0})}),r.forEach((l,g)=>{if(f.includes(l))return;let b=os(
l,e);if(!b)return;let N=(l.next_steps??[]).filter(_=>_.what?.trim());i.push({id:`intent:${e.key}:${g}`,title:ze(l.title,
e.title||n("untitled_work")),summary:as(l,n),state:b,issue:!1,updatedAt:F(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.
key,provenance:ln(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:Ge(e)||void 0,unverified:l.verified===!1||void 0,
action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...Jn(s,l)],nextSteps:N,
progress:(l.progress??[]).filter(_=>_.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0,moving:rs(l,e,d)||void 0})});
let w=i.filter(l=>l.state==="needs-you"),k=i.filter(l=>l.state!=="needs-you").sort((l,g)=>(g.lastTouchedTurn??0)-(l.lastTouchedTurn??
0));return[...w,...k].slice(0,Math.max(is,w.length))}var ho=new Set(["crew-manager-conductor","overwatch-conductor"]),us={
approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,run_failed:55,stalled:50,change_blocked:40,
nobody_on_it:30,queued_behind:12,waiting_a_while:8},ps=3;function gs(e,t){return e.updatedAt?Math.max(0,Math.floor((t-e.
updatedAt)/36e5)):0}var Ot=5;function bo(e,t,n=Date.now()){let r=hn(e),s=Ro(e.filter(d=>d.state==="needs-you"),n),i=[`Fl\
eet: ${r["needs-you"]} waiting on the user, ${r.running} in progress, ${r.done} finished recently.`];return s.length===0?
(i.push("Nothing is waiting on the user."),i):(i.push(`Waiting on the user, in the order the list shows them (top ${Math.
min(Ot,s.length)}):`),s.slice(0,Ot).forEach((d,u)=>{let f=lt(We(d,n),t),w=d.sessionKey?` [session ${d.sessionKey}]`:"";i.
push(`${u+1}. ${d.title} \u2014 ${d.summary} (${f})${w}`)}),s.length>Ot&&i.push(`\u2026and ${s.length-Ot} more waiting.`),
i)}var qe=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that","with","from","into",
"be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run","why","what","how","again",
"still","not"]),Qn=.6,Xn=2,vo=new Set;function dn(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").
split(/\s+/).filter(t=>t.length>2&&!qe.has(t)))]}function zt(e,t){let n=dn(e),r=dn(t);if(n.length<Xn||r.length<Xn)return 0;
let s=n.length<=r.length?n:r,i=new Set(n.length<=r.length?r:n);return s.filter(u=>i.has(u)).length/s.length}function Zn(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function eo(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function to(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}var ms=new Set(
["pull request","pull requests","status update","work in progress","code review","follow up","next step","next steps","a\
ction item","action items","kiro crew","in progress","needs you"]);function at(e){let t=new Set,n=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??
[];for(let r of n){let s=r.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(i=>i.length>
3&&i.endsWith("s")&&!i.endsWith("ss")?i.slice(0,-1):i);for(;s.length&&qe.has(s[0]);)s.shift();for(;s.length&&qe.has(s[s.
length-1]);)s.pop();if(!(s.length<2))for(let i=s.length;i>=2;i-=1)for(let d=0;d+i<=s.length;d+=1){let u=s.slice(d,d+i).join(
" ");ms.has(u)||t.add(u)}}return[...t]}function yo(e){let t=new Set;if(e.length<fs)return t;let n=new Map;for(let r of e)
for(let s of at(r.title))n.set(s,(n.get(s)??0)+1);for(let[r,s]of n)s/e.length>=ws&&t.add(r);return t}var fs=4,ws=.75;function it(e,t,n=vo){
if(Zn(e).find(d=>Zn(t).includes(d)))return"same_change";if(eo(e).find(d=>eo(t).includes(d)))return"same_artifact";let i=at(
t.title).filter(d=>!n.has(d));if(at(e.title).some(d=>i.includes(d)))return"same_deliverable";if(zt(e.title,t.title)>=Qn)
return"same_topic";for(let d of to(e))for(let u of to(t))if(zt(d,u)>=Qn)return"same_step";return null}function ko(e,t){return e.
parentId===t.id||t.parentId===e.id?"spawned":no(e).includes(t.id)||no(t).includes(e.id)?"references":null}function no(e){
let t=[];for(let n of e.references)n.kind==="artifact"?t.push(`artifact:${n.id}`):n.kind==="workflow"?t.push(`workflow:${n.
id}`):n.kind==="agent"?t.push(`agent:${n.id}`):n.kind==="monitor"&&t.push(`monitor:${n.id}`,`loop:${n.id}`);return t.filter(
n=>n!==e.id)}var St={merged:[],split:[]};function Gt(e){return`${e.sessionKey??e.id}|${dn(e.title).join(" ")}`}function fe(e,t){
return[Gt(e),Gt(t)].sort().join("")}function hs(e,t=St){let n=e.filter(s=>s.state!=="done"&&s.sessionKey).sort((s,i)=>(s.
updatedAt||0)-(i.updatedAt||0)),r=yo(n);for(let s=1;s<n.length;s+=1){let i=n[s];for(let d=0;d<s;d+=1){let u=n[d];if(u.sessionKey===
i.sessionKey||t.split.includes(fe(i,u)))continue;let f=it(i,u,r);if(f){i.duplicateOf={sessionKey:u.sessionKey,title:u.title,
because:f};break}}}bs(n,t,r)}var an=3,qt=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function bs(e,t,n=vo){
for(let r of e){let s=[],i=new Set;for(let d of e){let u=d.sessionKey;if(u===r.sessionKey||i.has(u)||t.split.includes(fe(
r,d)))continue;let f=it(r,d,n);f&&(i.add(u),s.push({sessionKey:u,title:d.title,because:f}))}s.length!==0&&(s.sort((d,u)=>qt.
indexOf(d.because)-qt.indexOf(u.because)),r.relatedSessions=s.slice(0,an),s.length>an&&(r.relatedMore=s.length-an))}}var vs=3e4;
function xo(e,t,n=Date.now()){return Object.keys(t).length===0?e:e.map(r=>{let s=t[r.id];return!s||n-s>vs||r.state==="ru\
nning"?r:{...r,state:"running",moving:!0,instructed:!0}})}function We(e,t=Date.now()){let n=[],r=(i,d,u=1)=>{n.push({signal:i,
weight:us[i]*u,values:d})};e.approvalKind==="subagent"?r("subagent_gate"):e.approvalKind==="tool"&&r("approval_owed"),e.
action==="reply"&&r("input_requested"),e.unverified&&r("unverified_completion"),e.loopRepeats&&r("error_loop",{repeats:String(
e.loopRepeats)}),e.runFailed&&r("run_failed"),e.stalledFor&&r("stalled",{duration:st(e.stalledFor)}),e.changeBlocked&&r(
"change_blocked"),e.unattendedGoals&&r("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&r("queued_behin\
d",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let s=gs(e,t);return s>0&&r("waiting_a_while",{hours:String(
s)},Math.min(s,ps)),n.sort((i,d)=>d.weight-i.weight),{score:n.reduce((i,d)=>i+d.weight,0),signals:n}}var ys={approval_owed:"\
unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"\
unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function Ft(e,t=Date.now()){if(e.state!=="n\
eeds-you")return null;for(let n of We(e,t).signals){let r=ys[n.signal];if(r)return r}return null}var _o=14400*1e3;function So(e,t,n,r=Date.
now()){let s=0,i=[];for(let d of e){if(d.state!=="needs-you"){i.push(d);continue}let u=t[d.id];if(u&&u>r){s+=1;continue}
let f=n[d.id];if(f!==void 0&&d.updatedAt<=f){i.push({...d,state:"done",issue:!1});continue}i.push(d)}return{items:i,snoozedCount:s}}
var ks=4320*60*1e3;function No(e,t=Date.now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=ks}var xs={"ne\
eds-you":1,running:-1,done:-1};function _s(e,t,n){let r=e.updatedAt>0,s=t.updatedAt>0;return!r&&!s?0:r?s?(e.updatedAt-t.
updatedAt)*n:-1:1}function lt(e,t){let n=e.signals.slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(s=>t(
`rank_${s.signal}`,s.values)).join(t("rank_join"))}function Ro(e,t=Date.now()){let n=new Map(e.map(r=>[r.id,We(r,t)]));return[
...e].sort((r,s)=>{let i=Hn[r.state]-Hn[s.state];if(i!==0)return i;if(r.state==="needs-you"){let d=(n.get(s.id)?.score??
0)-(n.get(r.id)?.score??0);if(d!==0)return d}else if(r.issue!==s.issue)return r.issue?-1:1;return _s(r,s,xs[r.state])})}
function Co(e,t,n={},r={},s={},i=St,d=Date.now()){let u=new Map,f=new Map;for(let l of e.slots){if(!l.key||ho.has(l.key)||
l.memory_mode==="incognito")continue;let g=cs(l,n[l.key],t);if(g.length>0){for(let _ of g)u.set(_.id,_);let N=g.find(_=>_.
state==="needs-you")??g[0];f.set(l.key,N);continue}let b=Zr(l,t);u.set(b.id,b),f.set(l.key,b)}for(let[l,g]of Object.entries(
r)){let b=f.get(l);b&&(b.state="needs-you",b.issue=!0,b.stalledFor=g.silent_secs,b.summary=g.reason?t("stalled_because",
{reason:g.reason,duration:st(g.silent_secs)}):t("stalled_for",{duration:st(g.silent_secs)}),b.action="open")}for(let[l,g]of Object.
entries(s)){let b=f.get(l);b&&(b.state="needs-you",b.issue=!0,b.loopRepeats=g.repeats,b.summary=t("error_loop",{tool:g.tool,
repeats:String(g.repeats)}),b.action="open")}for(let l of e.approvals){let g=l.slot?f.get(l.slot):void 0;if(g){es(g,l,t);
continue}u.set(`approval:${l.id}`,{id:`approval:${l.id}`,title:ze(l.tool||l.source,t("approval_needed")),summary:l.tool_purpose||
t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:F(l.ts),provenance:t("approval"),action:"review-approval",approvalKind:wo(
l)?"subagent":"tool",permissionId:l.id,permissionTool:l.tool||l.source,permissionPurpose:l.tool_purpose,permissionInput:l.
tool_input,references:[{kind:"approval",id:l.id,label:l.tool||l.source||t("approval")}]})}for(let l of e.agents){let g=l.
parent?f.get(l.parent):void 0;if(g){ts(g,l,t);continue}let b=!!(l.done&&(l.error||l.outcome==="failed"));l.parent&&!b||u.
set(`agent:${l.id}`,{id:`agent:${l.id}`,title:ze(l.task||l.agent,t("agent_work")),summary:b?l.error?.trim()||t("agent_fa\
iled",{task:l.task}):l.done?t("agent_done"):t("work_in_progress"),state:b?"needs-you":l.done?"done":"running",issue:b,runFailed:b||
void 0,retryPath:b&&!l.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(l.id)}/retry`:void 0,updatedAt:F(l.started),
provenance:l.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:l.id,label:l.agent||t("agent")}]})}for(let l of e.
workflows){let g=l.session_key?f.get(l.session_key):void 0;if(g){ns(g,l,t);continue}let b=l.status==="failed";u.set(`wor\
kflow:${l.run_id}`,{id:`workflow:${l.run_id}`,title:ze(l.name,l.run_id),summary:b?t("workflow_failed_generic"):l.status===
"running"?t("workflow_running"):t("workflow_finished"),state:b?"needs-you":l.status==="running"?"running":"done",issue:b,
runFailed:b||void 0,retryPath:b?`/api/workflows/runs/${encodeURIComponent(l.run_id)}/rerun`:void 0,updatedAt:0,provenance:t(
"workflow"),action:"discuss",references:[{kind:"workflow",id:l.run_id,label:l.name||l.run_id}]})}for(let l of e.crons){if(!l.
is_running&&l.last_status!=="error")continue;let g=l.last_status==="error",b=Fr(l,d),N=t(g?"monitor_failed":"monitor_run\
ning");u.set(`monitor:${l.id}`,{id:`monitor:${l.id}`,title:l.name,summary:b?`${N} ${t("monitor_next_check",{duration:b})}`:
N,state:g?"needs-you":"running",issue:g,runFailed:g||void 0,retryPath:g?`/api/crons/${encodeURIComponent(l.id)}/run`:void 0,
updatedAt:F(l.running_since||l.last_run_ts||l.created_ts),provenance:t("monitor"),action:g?"discuss":void 0,references:[
{kind:"monitor",id:l.id,label:l.name}]})}for(let l of e.loops||[]){if(!l.active)continue;let g=String(l.id||"");if(!g)continue;
let b=Math.max(0,Number(l.cycle_count)||0),N=Math.max(0,Number(l.max_cycles)||0),_=l.slot_key&&f.has(l.slot_key)?l.slot_key:
void 0;u.set(`loop:${g}`,{id:`loop:${g}`,title:ze(l.message||"",t("loop")),summary:N?t("loop_watching_capped",{cycles:String(
b),cap:String(N)}):t("loop_watching",{cycles:String(b)}),state:"running",issue:!1,updatedAt:F(l.last_fire_ts||l.created_ts),
sessionKey:_,parentId:_?f.get(_)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(g)}`,action:_?
"open":void 0,references:[{kind:"monitor",id:g,label:t("loop"),sessionKey:_},..._?[{kind:"session",id:_,label:f.get(_)?.
title||_,sessionKey:_}]:[]]})}let w=[...e.artifacts].sort((l,g)=>F(g.updated_at)-F(l.updated_at)).slice(0,8);for(let l of w){
let g=l.session_key&&f.has(l.session_key)?l.session_key:void 0;u.set(`artifact:${l.slug}`,{id:`artifact:${l.slug}`,title:ze(
l.name,t("artifact")),summary:l.description||t("artifact_ready",{kind:l.kind}),state:"done",issue:!1,updatedAt:F(l.updated_at||
l.created_at),sessionKey:g,parentId:g?f.get(g)?.id:void 0,provenance:l.session_title||l.source||t("artifact"),action:g?"\
open":void 0,references:[{kind:"artifact",id:l.slug,label:l.name,sessionKey:g},...g?[{kind:"session",id:g,label:l.session_title||
g,sessionKey:g}]:[]]})}let k=[...u.values()];return hs(k,i),Ro(k)}function hn(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function bn(e){let t=[],n=new Map;for(let r of e){let s=r.sessionKey;if(!s)continue;let i=n.get(s);if(i){i.count+=1;continue}
let d=r.references.find(f=>f.kind==="session")?.label??r.provenance,u={sessionKey:s,label:d,leading:r,count:1};n.set(s,u),
t.push(u)}return t}function jt(e,t,n=St,r){if(t==="pr")return Ss(e);if(t==="goal")return cn(e,n,r);let s=[],i=new Map;for(let d of e){
let u=d.sessionKey;if(!u){s.push({key:d.id,items:[d],header:null,sessionKey:null,changeRef:null});continue}let f=i.get(u);
if(f){f.items.push(d);continue}let w={key:u,items:[d],header:"session",sessionKey:d.sessionKey??null,changeRef:null};i.set(
u,w),s.push(w)}return s}function Ss(e){let t=[],n=new Map;for(let r of e){let s=r.references.filter(i=>i.kind==="change"||
i.kind==="issue");for(let i of s){let d=`${i.kind}:${i.id}`,u=n.get(d);if(u){u.items.push(r);continue}let f={key:d,items:[
r],header:"pr",sessionKey:null,changeRef:i};n.set(d,f),t.push(f)}}return t.sort((r,s)=>Math.max(...s.items.map(i=>i.updatedAt))-
Math.max(...r.items.map(i=>i.updatedAt))),t}var Io=["same_change","same_artifact","same_deliverable"];function cn(e,t,n){
let r=yo(e),s=e.map((w,k)=>k),i=w=>{for(;s[w]!==w;)s[w]=s[s[w]],w=s[w];return w},d=(w,k)=>{s[i(k)]=i(w)};for(let w=0;w<e.
length;w+=1)for(let k=w+1;k<e.length;k+=1){let l=e[w],g=e[k],b=fe(l,g);if(t.split.includes(b))continue;if(ko(l,g)){d(w,k);
continue}if(t.merged.includes(b)){d(w,k);continue}if(n?.has(b)){d(w,k);continue}if(!l.sessionKey||!g.sessionKey||l.sessionKey===
g.sessionKey)continue;let N=it(l,g,r);N&&Io.includes(N)&&d(w,k)}let u=[],f=new Map;for(let w=0;w<e.length;w+=1){let k=i(
w),l=f.get(k);if(l){l.items.push(e[w]),l.header="goal";continue}let g={key:`goal:${e[w].id}`,items:[e[w]],header:null,sessionKey:null,
changeRef:null};f.set(k,g),u.push(g)}for(let w of u)w.key=Ns(w.items);return u}function Ns(e){return`goal:${[...e.map(t=>t.
id)].sort()[0]}`}var Rs=.5;function Cs(e,t){let n=new Set,r=new Set,s=[...e].sort((i,d)=>d.items.length-i.items.length);
for(let i of s){let d=new Set(i.items.map(Gt)),u=null;for(let f of t){if(n.has(f.key))continue;let w=f.members.filter(l=>d.
has(l)).length;if(!w)continue;let k=w/Math.min(d.size,f.members.length);k<Rs||(!u||k>u.score)&&(u={key:f.key,score:k})}if(u&&
(n.add(u.key),i.key=u.key),r.has(i.key)){let f=2;for(;r.has(`${i.key}~${f}`);)f+=1;i.key=`${i.key}~${f}`}r.add(i.key)}return e}
function Ao(e){return e.map(t=>({key:t.key,members:t.items.map(Gt)}))}function un(e,t){let n=t.split(" ").map(r=>`${Is(r)}\
s?`).join("[\\s/_,-]+");return e.match(new RegExp(n,"iu"))?.[0]??null}function Is(e){return e.replace(/[.*+?^${}()|[\]\\]/g,
"\\$&")}function Wo(e,t=St,n){if(e.length<2)return null;let r=null,s=null,i=null;for(let d=0;d<e.length;d+=1)for(let u=d+
1;u<e.length;u+=1){let f=e[d],w=e[u];if(ko(f,w))return`${w.parentId===f.id?w.title:f.title} was started by this work`;if(t.
merged.includes(fe(f,w)))return"you merged these";i??=n?.get(fe(f,w))??null;let k=it(f,w);if(!(!k||!Io.includes(k))&&(!r||
qt.indexOf(k)<qt.indexOf(r))&&(r=k,k==="same_deliverable")){let l=at(w.title),g=at(f.title).find(b=>l.includes(b))??null;
s=g?un(f.title,g)??un(w.title,g)??g:null}}return r==="same_change"?"these sessions work on the same change":r==="same_ar\
tifact"?"these sessions share the same output":r==="same_deliverable"?s?`both are about ${s}`:"both name the same delive\
rable":i}var As=12;function Po(e){if(e.length<2)return null;let t=new Map;for(let f of e)for(let w of at(f.title))t.set(
w,(t.get(w)??0)+1);let n=oo(t);if(n)return ro(e,n)??n;let r=new Map;for(let f of e)for(let w of f.references){if(w.kind!==
"change"&&w.kind!=="issue")continue;let k=r.get(w.id);r.set(w.id,{label:w.label,members:(k?.members??0)+1})}let s=[...r.
values()].filter(f=>f.members>=2).sort((f,w)=>w.members-f.members)[0];if(s)return s.label;let i=new Map;e.forEach((f,w)=>{
for(let k of Ws(f.title))i.has(k)||i.set(k,new Set),i.get(k).add(w)});let d=new Map;for(let[f,w]of i)d.set(f,w.size);let u=oo(
d);return u?ro(e,u)??u:null}function oo(e){return[...e.entries()].filter(([,t])=>t>=2).sort((t,n)=>n[1]-t[1]||n[0].length-
t[0].length)[0]?.[0]??null}function ro(e,t){let n=null;for(let r of e){let s=un(r.title,t);if(s){if(/^\p{Lu}/u.test(s))return s;
n??=s}}return n}function Ws(e){let t=e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean),n=[];
for(let r=Math.min(t.length,As);r>=2;r-=1)for(let s=0;s+r<=t.length;s+=1){let i=t.slice(s,s+r);qe.has(i[0])||qe.has(i[r-
1])||i[0].length<2||i[r-1].length<2||n.push(i.join(" "))}return n}function Eo(e,t){let n=e.references.find(r=>r.kind==="\
session")?.label??"";for(let r of[e.title,n,e.provenance]){let s=pn(r,t);if(s)return s}return null}function pn(e,t){let n=e.
toLowerCase(),r=null;for(let s of t)for(let i of s.aliases)!i||!n.includes(i.toLowerCase())||(!r||i.length>r.length)&&(r=
{name:s.name,length:i.length});return r?.name??null}function Bo(e,t){let n=e.references.find(d=>d.kind==="session")?.label??
"";if(!n)return null;let r=pn(e.title,t);if(!r)return null;let s=t.find(d=>d.name===r);if(s&&s.aliases.some(d=>d&&n.toLowerCase().
includes(d.toLowerCase())))return null;let i=pn(n,t);return!i||i===r?null:{itemGoal:r,sessionGoal:i}}function Mo(e,t){let n=t.
flatMap(i=>i.aliases.map(d=>d.toLowerCase())),r=new Set(["workspace","workspaces","home","src","tmp","documents","deskto\
p"]),s=new Map;for(let i of e){if(!i.key||ho.has(i.key)||i.memory_mode==="incognito")continue;let d=i.project;if(!d)continue;
let u=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!u||r.has(u.toLowerCase())||n.some(f=>u.toLowerCase().includes(
f)||f.includes(u.toLowerCase()))||s.set(u,(s.get(u)??0)+1)}return[...s.entries()].map(([i,d])=>({name:i,sessions:d})).sort(
(i,d)=>d.sessions-i.sessions)}function $o(e,t){let n=new Map;for(let i of e){if(!i.sessionKey||Eo(i,t)!==null)continue;let d=i.
references.find(u=>u.kind==="session")?.label??"";for(let u of[i.title,d]){let f=u.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean);for(let w of[3,2])for(let k=0;k+w<=f.length;k+=1){let l=f.slice(k,k+w);if(qe.has(l[0])||
qe.has(l[w-1])||l[0].length<3||l[w-1].length<3)continue;let g=l.join(" ");n.has(g)||n.set(g,new Set),n.get(g).add(i.sessionKey)}}}
let r=[...n.entries()].map(([i,d])=>({phrase:i,sessions:d.size})).filter(i=>i.sessions>=2);return r.filter(i=>!r.some(d=>d.
phrase!==i.phrase&&d.phrase.includes(i.phrase)&&d.sessions>=i.sessions)).sort((i,d)=>d.sessions-i.sessions||d.phrase.length-
i.phrase.length).map(i=>({name:i.phrase.replace(/\p{L}+/gu,d=>d[0].toUpperCase()+d.slice(1)),sessions:i.sessions}))}function so(e){
return e.some(t=>t.state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function Ko(e,t=Date.
now()){return e.issue?"crit":e.state==="needs-you"?Ft(e,t)==="followup"?"idle":"warn":"good"}function dt(e){let t=new Set,n=new Set,r=new Set,s=0,i=0,d=0,u=0,f=0;for(let w of e){w.sessionKey&&t.add(w.sessionKey);for(let k of w.
references)k.kind==="change"?n.add(k.id):k.kind==="issue"&&r.add(k.id);w.id.startsWith("workflow:")?s+=1:w.id.startsWith(
"monitor:")?i+=1:w.id.startsWith("agent:")&&(d+=1),w.state==="needs-you"&&(u+=1),w.updatedAt>f&&(f=w.updatedAt)}return{sessions:t.
size,prs:n.size,issues:r.size,loops:s,crons:i,agents:d,needsYou:u,lastActivityAt:f}}function Lo(e){let t=e.find(r=>r.moving);
if(t)return t;let n=e.find(r=>r.state==="running");return n||[...e].sort((r,s)=>(s.updatedAt||0)-(r.updatedAt||0))[0]}function Ps(e){
let t=[],n=new Set;for(let r of e){let s=r.sessionKey;!s||n.has(s)||(n.add(s),t.push(r.references.find(i=>i.kind==="sess\
ion")?.label??r.provenance))}return t}function To(e,t,n=St,r=[],s){let i=new Map,d=[],u=new Map;for(let g of e){let b=Eo(
g,t);if(u.set(g.id,b),b===null){d.push(g);continue}i.has(b)||i.set(b,[]),i.get(b).push(g)}let f=Cs(cn(d,n,s),r),w=new Map;
for(let g of f)w.set(g.items[0].id,g);let k=[],l=new Set;for(let g of e){let b=u.get(g.id)??null;if(b!==null){if(l.has(b))
continue;l.add(b);let _=i.get(b);k.push({key:`initiative:${b}`,name:b,status:so(_),sessions:Ps(_),blocks:cn(_,n,s)});continue}
let N=w.get(g.id);N&&k.push({key:N.key,name:null,status:so(N.items),sessions:[],blocks:[N]})}return k}function vn(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Oo(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,r)=>Do(r)-Do(n)).slice(0,12)}function Do(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function zo(e,t){
let n={},r="unknown";for(let s of e)try{let i=await t(`/api/chat/slots/${encodeURIComponent(s.key)}/summary`);if(!i||typeof i!=
"object"){r="unsupported";break}if(i.enabled===!1){r="disabled";break}n[s.key]=i,r="available"}catch{r="unsupported";break}
return{summaries:n,support:r}}var Go=String.raw`
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
`;import{Fragment as Re,jsx as a,jsxs as m}from"react/jsx-runtime";var Nt=["work","prs","loops","schedule"],Uo=["prs","loo\
ps","schedule","work"],pr={work:"Goals / Sessions",prs:"PRs",loops:"Loops",schedule:"Scheduled tasks"};function Ut({id:e,
onPromote:t}){return a(z,{className:"ow-promote","aria-label":`Move ${pr[e]} to the first column`,onClick:n=>{n.preventDefault(),
n.stopPropagation(),t(e)},children:"Make primary"})}function Ht({lastUpdated:e,refreshing:t,onRefresh:n}){let r=e?Qt(e):
null;return m("span",{className:"ow-refreshbar",children:[r&&m("span",{className:"ow-updated","aria-live":"polite",children:[
"updated ",r]}),a(z,{className:"ow-refresh",onClick:s=>{s.preventDefault(),s.stopPropagation(),n()},disabled:t,"aria-lab\
el":"Refresh",title:"Refresh",children:a(Ms,{className:`ow-icon${t?" ow-spin":""}`,"aria-hidden":"true"})})]})}var yn="c\
rew-manager.snoozed",Ho="crew-manager.handled",Vo="crew-manager.done-collapsed",kn="crew-manager.goal-verdicts",Yo="crew\
-manager.goal-memory",gr="crew-manager.goal-semantic.v5",xn="crew-manager.goal-names.v2",js=.7;function Jo(e){return Y(gr,
{pairs:[...e.pairs],why:[...e.why.entries()],stamp:e.stamp}),e}var Qo="crew-manager.initiative-collapsed",_n="crew-manag\
er.stack-open-v2",Xo="crew-manager.tab",Sn="crew-manager.primary-v1";function oe(e,t={}){try{let n=localStorage.getItem(
e);return n?JSON.parse(n):t}catch{return t}}function Y(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Qt(e,t=Date.
now()){if(!e)return null;let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let r=Math.round(n/60);if(r<60)
return`${r}m ago`;let s=Math.round(r/60);return s<24?`${s}h ago`:`${Math.round(s/24)}d ago`}function Zo(e){return e?new Date(
e).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}function ct(e,t,n){return e<=0?null:`${e} ${e===1?t:n}`}function Vt(e,t=Date.
now(),n=!1){let r=dt(e),s=[n?null:ct(r.sessions,"session","sessions"),ct(r.prs,"PR","PRs"),ct(r.issues,"issue","issues"),
ct(r.loops,"loop","loops"),ct(r.crons,"cron","crons"),ct(r.agents,"agent","agents")].filter(d=>!!d),i=Qt(r.lastActivityAt,
t);return i&&s.push(`last active ${i}`),s.join(" \xB7 ")}var Pe="crew-manager-conductor",Us=5e3,Hs={session:"Session",approval:"\
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
duration}}",rank_change_blocked:"a linked change is failing or conflicting",rank_nobody_on_it:"nobody is on {{count}} un\
finished goal(s) in this session",no_next_step:"No next step recorded \u2014 nobody is on this",rank_queued_behind:"{{co\
unt}} more prompt(s) queued in this session",rank_waiting_a_while:"waiting {{hours}}h",rank_nothing_pressing:"nothing pr\
essing \u2014 ordered by recency",rank_join:", and ",error_loop:"{{tool}} has failed the same way {{repeats}} times in a\
 row",untitled_work:"Untitled work"};function ke(e,t={}){return Hs[e].replace(/\{\{(\w+)\}\}/g,(n,r)=>t[r]??"")}var Vs={
followup:"Follow up",unblock:"Unblock"},Ne={"needs-you":"Needs you",running:"Running",done:"Done"},Nn={all:"All","needs-\
you":"Needs you",running:"Running",done:"Done"},er={all:"All",failing:"Failing",running:"Running",merged:"Merged"},Ys={session:Wn,
approval:ir,agent:Es,workflow:Ts,monitor:ur,artifact:Bs,change:An,issue:Ls};function Ee({children:e,onActivate:t,...n}){
return a("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),
t())},children:e})}function tr({label:e,count:t,subtitle:n}){return m("div",{className:"ow-section-header",children:[m("\
div",{className:"ow-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow\
-section-count",children:t})]}),n&&a("p",{className:"ow-section-subtitle",children:n})]})}function Js(e){if(e.state==="n\
eeds-you"){let t=Ft(e);return t?a(Q,{variant:"warn",className:"ow-verb",children:Vs[t]}):null}return e.state==="running"?
e.moving?m(Q,{variant:"aim",children:[a(cr,{className:"ow-icon"}),Ne[e.state]]}):a(Q,{variant:"muted",children:"Queued"}):
m(Q,{variant:"ok",children:[a(dr,{className:"ow-icon"}),Ne[e.state]]})}function Qs({tool:e,purpose:t,busy:n,onAnswer:r,where:s}){return m("div",{className:"ow-permission",children:[m("div",{className:"\
ow-permission-body",children:[m("div",{className:"ow-permission-head",children:[a($s,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),m("p",{className:"ow-permi\
ssion-what",children:[s&&m("span",{className:"ow-truncate",children:[s," "]}),s?"wants to run ":"Wants to run ",a("code",
{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),m("div",{className:"ow-permission-actions",children:[
a(z,{onClick:()=>r(!0),disabled:n,children:"Approve"}),a(z,{onClick:()=>r(!1),disabled:n,children:"Reject"})]})]})}function Rt({
children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"ow-expand-inner",children:e})})}var Rn=3;
function nr(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function Xs({
item:e,busy:t,onDecide:n}){let[r,s]=S(!1),i=e.permissionInput||"",d=i.trim().split(/\s+/)[0]||e.permissionTool||"";return m(
"div",{className:"ow-formal-approval",role:"presentation",onClick:u=>u.stopPropagation(),onKeyDown:u=>u.stopPropagation(),
children:[a("div",{className:"ow-formal-badge",children:"Waiting for approval"}),m("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&m("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),m("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("span",{className:"ow-formal-val ow-formal-mon\
o",children:i||"(no input details)"})]})]}),m("div",{className:"ow-formal-actions",children:[a(z,{disabled:t,onClick:()=>n(
"approved"),children:"Allow once"}),m("span",{className:"ow-trust-wrap",children:[m(z,{disabled:t,onClick:()=>s(u=>!u),"\
aria-expanded":r,children:["Trust ",a(le,{className:"ow-icon ow-trust-caret","data-open":r?"true":void 0,"aria-hidden":"\
true"})]}),r&&m("span",{className:"ow-trust-menu",role:"menu",children:[i&&a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{s(!1),n("trust_command")},children:"Trust this exact command"}),d&&m("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{s(!1),n("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{s(!1),
n("trust")},children:"Trust everything in this session"})]})]}),a(z,{className:"ow-formal-reject",disabled:t,onClick:()=>n(
"rejected"),children:"Reject"})]})]})}function Zs({candidates:e,prominent:t,busy:n,onAdd:r}){let[s,i]=S(""),d=t?e:e.filter(
u=>u.sessions>=2);return m("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{className:"\
ow-bootstrap-head",children:t?"No big goals defined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&a(
"div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, or name\
 your own."}),d.length>0&&a("div",{className:"ow-bootstrap-chips",children:d.slice(0,4).map(u=>m("button",{type:"button",
className:"ow-bootstrap-chip",disabled:n,onClick:()=>r(u.name,[u.name]),children:[u.name," ",m("span",{className:"ow-boo\
tstrap-count",children:[u.sessions," session",u.sessions===1?"":"s"]})]},u.name))}),m("div",{className:"ow-bootstrap-cus\
tom",children:[a(qs,{value:s,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:u=>i(u.target.
value),onKeyDown:u=>{u.key==="Enter"&&s.trim()&&(r(s),i(""))}}),a(z,{disabled:n||!s.trim(),onClick:()=>{r(s),i("")},children:"\
Add goal"})]})]})}function or({members:e}){let t=e[0],n=new Set(e.map(u=>u.sessionKey).filter(Boolean)).size,r=e.filter(
u=>u.state==="needs-you").length,s=e.filter(u=>u.state==="running").length,i=e.filter(u=>u.state==="done").length,d=[`${n}\
 session${n===1?"":"s"}`];return r&&d.push(`${r} need${r===1?"s":""} you`),s&&d.push(`${s} running`),i&&d.push(`${i} don\
e`),m("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),a("d\
iv",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}function Cn({open:e,onToggle:t,label:n,flag:r,flagWarn:s,
meta:i,why:d,header:u,action:f,children:w}){return m("div",{className:"ow-block ow-goalcard","data-grouped":"true","data\
-open":e?"true":void 0,children:[m("div",{className:"ow-goalcard-summary",children:[t&&a("button",{type:"button",className:"\
ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":"Expand"} ${n??"goal"}`,onClick:t,children:a(le,{className:"\
ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-hidden":"true"})}),u,f,a("span",{className:`ow-goal-flag${s?"\
 ow-goal-flag-warn":""}`,children:r})]}),a("div",{className:"ow-goal-meta",children:i}),d&&m("div",{className:"ow-goal-w\
hy",children:["Grouped because ",d,"."]}),w]})}function ea({block:e,status:t,folded:n,onToggle:r,onSplit:s,selected:i,onSelect:d}){
let u=e.items[0],f=new Set(e.items.map(l=>l.sessionKey).filter(Boolean)).size,w=[];for(let l=0;l<e.items.length;l+=1)for(let g=l+
1;g<e.items.length;g+=1)e.items[l].sessionKey!==e.items[g].sessionKey&&w.push(fe(e.items[l],e.items[g]));let k=m(Re,{children:[
r&&a("button",{type:"button",className:"ow-goal-fold","aria-label":n?`Expand ${u.title}`:`Collapse ${u.title}`,"aria-exp\
anded":!n,onClick:l=>{l.stopPropagation(),r()},children:a(le,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"\
true","aria-hidden":"true"})}),a(Yt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-bloc\
k-name",children:u.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:Ne[t]}),m("span",{className:"\
ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),m("span",{className:"ow-truncate",children:[
f," sessions, one goal"]})]}),s&&a(z,{className:"ow-block-open ow-goal-split",title:"Not the same goal \u2014 split into sepa\
rate cards","aria-label":`Split ${u.title}`,onClick:l=>{l.stopPropagation(),s(w)},children:"Split"})]});return d?a(Ee,{onActivate:d,
className:"ow-block-tab ow-goal-tab","aria-pressed":i,"data-selected":i?"true":void 0,children:k}):a("div",{className:"o\
w-block-tab",children:k})}var ta=.3;function rr({item:e,items:t,onMerge:n}){let r=t.filter(s=>s.id!==e.id&&s.sessionKey&&
e.sessionKey&&s.sessionKey!==e.sessionKey).map(s=>({other:s,score:it(e,s)?1:zt(e.title,s.title)})).filter(s=>s.score>=ta).
sort((s,i)=>i.score-s.score).slice(0,2);return r.length===0?null:m("div",{className:"ow-merge-hint",children:[a("span",{
className:"ow-merge-hint-label",children:"Same goal?"}),r.map(({other:s})=>m("button",{type:"button",className:"ow-merge\
-hint-btn ow-truncate",onClick:()=>n(fe(e,s)),children:["Merge with \u201C",s.title,"\u201D"]},s.id))]})}function na({item:e,
items:t,folded:n,onToggle:r,onOpen:s}){let d=e.references.find(l=>l.kind==="session")?.label??e.provenance,u=dt(t),f=u.needsYou>
0?"needs-you":t.some(l=>l.state==="running")?"running":"done",w=u.needsYou>0?n?`${u.needsYou} need you`:null:Ne[f],k=Vt(
t,Date.now(),!0);return m(Re,{children:[m("div",{className:"ow-goalcard-summary",children:[r&&a("button",{type:"button",
className:"ow-goalcard-chevron","aria-expanded":!n,"aria-label":`${n?"Expand":"Collapse"} ${d}`,onClick:r,children:a(le,
{className:"ow-icon ow-init-chevron","data-open":n?void 0:"true","aria-hidden":"true"})}),m("span",{className:"ow-goalca\
rd-header ow-goalcard-static",children:[a(Wn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncat\
e ow-block-name ow-goalcard-title",children:d})]}),a(z,{className:"ow-block-open",onClick:s,"aria-label":`Open ${d}`,children:"\
Open"}),w&&a("span",{className:`ow-goal-flag${u.needsYou>0?" ow-goal-flag-warn":""}`,children:w})]}),k&&a("div",{className:"\
ow-goal-meta",children:k})]})}function oa(e){let t=(e.checks??[]).filter(r=>r.bucket!=="skipped"),n=e.comments??[];return{
available:!0,total:t.length,passing:t.filter(r=>r.bucket==="passed").length,failing:t.filter(r=>r.bucket==="failed").length,
pending:t.filter(r=>r.bucket==="pending").length,title:e.title,state:e.state?e.state.toUpperCase():void 0,is_draft:!!e.draft,
head:e.headBranch,base:e.baseBranch,author:e.author,updated_at:e.updatedAt,additions:e.additions,deletions:e.deletions,changed_files:e.
changedFiles,merge_state:e.mergeStateStatus?e.mergeStateStatus.toLowerCase():void 0,mergeable:e.mergeable?e.mergeable.toLowerCase():
void 0,auto_merge:!!e.autoMerge,review:co(n),unresolved:uo(n)}}function Pn(e,t){let n=t?.updated_at?Date.parse(t.updated_at):
0;return{status:e.status,state:t?.state,isDraft:t?.is_draft,mergeState:t?.merge_state,mergeable:t?.mergeable,autoMerge:t?.
auto_merge,base:t?.base,available:t?.available,total:t?.total,passing:t?.passing,failing:t?.failing,pending:t?.pending,unresolved:t?.
unresolved,review:t?.review,updatedAt:n||void 0}}function ra({reference:e,checks:t,folded:n,onToggle:r,selected:s,onSelect:i}){
let d=t?.title||e.label,u=po(e.url),f=t?.updated_at?Date.parse(t.updated_at):0,w=Pn(e,t),k=_t(w),l=lo(w),g=f?Qt(f):null,
b=e.label.replace(/^github\s*/,""),N=[u,b,t?.author,g??void 0,...l].filter(Boolean).join(" \xB7 "),_=m(Re,{children:[a(An,
{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:d})]});
return m(Re,{children:[m("div",{className:"ow-goalcard-summary",children:[r&&a("button",{type:"button",className:"ow-goa\
lcard-chevron","aria-expanded":!n,"aria-label":`${n?"Expand":"Collapse"} ${d}`,onClick:r,children:a(le,{className:"ow-ic\
on ow-init-chevron","data-open":n?void 0:"true","aria-hidden":"true"})}),i?a(Ee,{onActivate:i,className:"ow-goalcard-hea\
der ow-pr-header","aria-pressed":s,"data-selected":s?"true":void 0,children:_}):a("span",{className:"ow-goalcard-header \
ow-goalcard-static",children:_}),e.url&&a(z,{className:"ow-block-open","aria-label":`Open ${e.label} on the forge`,onClick:B=>{
B.stopPropagation(),window.open(e.url,"_blank","noopener,noreferrer")},children:"Open"}),a("span",{className:"ow-pr-verd\
ict","data-tone":ao[k],children:mn[k]})]}),N&&a("div",{className:"ow-goal-meta",children:N})]})}function sa({reference:e,
onOpenSession:t}){let n=Ys[e.kind],r=m(Re,{children:[a(n,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.
label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noref\
errer",onClick:s=>s.stopPropagation(),children:r}):e.sessionKey?a(Ee,{className:"ow-reference ow-reference-link",onActivate:()=>t(
e.sessionKey),children:r}):a("span",{className:"ow-reference",children:r})}function In({item:e,selected:t,continuation:n,
whyRanked:r,onSelect:s,onOpenSession:i,onAnswerPermission:d,permissionBusy:u,onRetry:f,retryBusy:w,onStop:k,stopBusy:l,onPickStep:g,
onSnooze:b,onHandled:N,hideBadge:_,compact:B,headless:L,dot:W,simple:G,onDecideApproval:X,sessionMismatch:T,onFixSessionName:q}){
let[P,Ce]=S(!1);return m(Ee,{onActivate:s,className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?
"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.id}`,children:[m("div",{className:"ow-row\
-layout",children:[m("div",{className:"ow-row-content",children:[!L&&m("div",{className:"ow-row-heading",children:[W&&a(
"span",{className:`ow-dot ow-dot-${W}`,"aria-hidden":"true"}),!G&&(_?e.state==="done"&&a(lr,{className:"ow-icon ow-row-c\
heck","aria-hidden":"true"}):Js(e)),a("span",{className:"ow-row-title",children:e.title})]}),(!B&&!G||t)&&e.summary&&!(e.
nextSteps??[]).some(I=>I.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&
(!G||t)&&m(Ee,{className:"ow-row-duplicate",onActivate:()=>i(e.duplicateOf.sessionKey),children:[a(Yt,{className:"ow-ico\
n","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:ke(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.
title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&a(Rt,{children:m("div",{className:"ow-related",children:[
a("span",{className:"ow-related-label",children:ke("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.
map(I=>m(Ee,{className:"ow-related-row",onActivate:()=>i(I.sessionKey),children:[a(Yt,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-truncate",children:I.title}),a("span",{className:"ow-related-why",children:ke(`related_${I.
because}`)})]},I.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:ke("related_more",{count:String(
e.relatedMore)})}):null]})}),r&&(!G||t)&&a("div",{className:"ow-row-why",children:r}),!n&&(!G||t)&&m("div",{className:"o\
w-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),nr(e).length>0&&a("span",{"aria-hidden":"\
true",children:"\xB7"}),a("span",{className:"ow-references",children:nr(e).slice(0,3).map(I=>a(sa,{reference:I,onOpenSession:i},
`${I.kind}:${I.id}`))})]}),T&&q&&m("div",{className:"ow-row-mismatch",children:[m("span",{className:"ow-truncate",children:[
"This session's name only mentions ",T.sessionGoal," \u2014 this is ",T.itemGoal," work"]}),a("button",{type:"button",className:"\
ow-mismatch-fix",onClick:I=>{I.stopPropagation(),q()},children:"Rename session to cover both"})]})]}),a("div",{className:"\
ow-row-actions",children:a(le,{className:"ow-icon","aria-hidden":"true"})})]}),t&&g&&e.nextSteps&&e.nextSteps.length>0&&
a(Rt,{children:m("div",{className:"ow-row-steps",children:[a("div",{className:"ow-steps-head",children:"Suggested next s\
teps"}),e.nextSteps.slice(0,P?void 0:Rn).map((I,Ie)=>a("button",{type:"button",className:"ow-quote-step",title:I.why??I.
what,onClick:pt=>{pt.stopPropagation(),g(I.what)},children:I.what},`${Ie}:${I.what}`)),e.nextSteps.length>Rn&&a("button",
{type:"button",className:"ow-steps-more",onClick:I=>{I.stopPropagation(),Ce(Ie=>!Ie)},children:P?"Show fewer":`+${e.nextSteps.
length-Rn} more`})]})}),t&&e.retryPath&&f&&a(Rt,{children:a("div",{className:"ow-retry",children:a(z,{onClick:()=>f(e.retryPath),
disabled:!!w,children:"Retry"})})}),t&&e.stopPath&&k&&a(Rt,{children:a("div",{className:"ow-retry",children:a(z,{onClick:()=>k(
e.stopPath),disabled:!!l,children:l?"Stopping\u2026":"Stop this loop"})})}),t&&e.permissionId&&X&&a(Rt,{children:a(Xs,{item:e,
busy:!!u,onDecide:I=>X(e,I)})}),e.state==="needs-you"&&b&&N&&m("div",{className:"ow-row-aside",children:[a("button",{type:"\
button",className:"ow-aside-btn",onClick:I=>{I.stopPropagation(),b(e.id)},children:"Later"}),a("button",{type:"button",className:"\
ow-aside-btn",onClick:I=>{I.stopPropagation(),N(e.id,e.updatedAt)},children:"Handled"})]})]})}var aa=["unblock","followu\
p","running","done"],ia={unblock:{label:"Unblock",cls:"ow-lane-unblock"},followup:{label:"Follow up",cls:"ow-lane-follow\
up"}};function la(e){return e.state==="done"?"done":e.state==="running"?"running":Ft(e)??"unblock"}function da({items:e,
selectedId:t,onSelect:n,onOpenSession:r,onAnswerPermission:s,onDecideApproval:i,permissionBusy:d,onRetry:u,retryBusy:f,onPickStep:w,
onSnooze:k,onHandled:l,doneTitles:g}){let[b,N]=S(!1),_=new Map;for(let B of e){let L=la(B),W=_.get(L);W?W.push(B):_.set(
L,[B])}return m(Re,{children:[aa.filter(B=>_.has(B)).map(B=>{let L=_.get(B),W=B==="unblock"||B==="followup"?ia[B]:null,G=W?
L.map(T=>T.action!=="resume"?lt(We(T),ke):""):[],X=W&&G.length>0&&G.every(T=>T&&T===G[0])?G[0]:void 0;return m("div",{className:"\
ow-lane",children:[W&&m("div",{className:"ow-lane-head",children:[a("span",{className:`ow-lane-badge ${W.cls}`,children:W.
label}),X&&a("span",{className:"ow-lane-reason",children:X})]}),L.map(T=>a(In,{item:T,hideBadge:!0,compact:!0,selected:t===
T.id,continuation:!0,whyRanked:X?void 0:T.state==="needs-you"&&T.action!=="resume"?lt(We(T),ke):void 0,onSelect:()=>n(T),
onOpenSession:r,onAnswerPermission:s,onDecideApproval:i,permissionBusy:d,onRetry:u,retryBusy:f,onPickStep:w,onSnooze:k,onHandled:l},
T.id))]},B)}),!_.has("done")&&g&&g.length>0&&m("div",{className:"ow-lane ow-lane-done",children:[m("button",{type:"butto\
n",className:"ow-goals-toggle","aria-expanded":b,onClick:()=>N(B=>!B),children:[a(le,{className:"ow-icon","data-open":b?
"true":void 0,"aria-hidden":"true"}),g.length," done"]}),b&&a("ul",{className:"ow-done-list",children:g.map(B=>m("li",{className:"\
ow-row-goal-done",children:[a(lr,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:B})]},
B))})]})]})}function ut({title:e,items:t,selectedId:n,onSelect:r,onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,
permissionBusy:u,onRetry:f,retryBusy:w,onStop:k,stopBusy:l,onPickStep:g,onSnooze:b,onHandled:N,footer:_,collapsed:B,onToggleCollapsed:L,
groupBy:W,prChecks:G,prFilter:X,doneBySession:T,goalVerdicts:q,onSplitGoal:P,onMergeGoal:Ce,initiativeBlocks:I,initiatives:Ie,
onRenameSession:pt,semanticWhy:Xt,goalNames:Fe,collapsedInitiatives:Be,onToggleInitiative:xe,selectedGoalKey:je,onSelectGoal:Ue,
selectedPrKey:Ct,onSelectPr:gt,subtitle:mt,hideHeader:Z,emptyLabel:Me}){let de=jt(t,W,q),He=W==="pr"&&X&&X!=="all"?de.filter(
y=>y.changeRef&&gn(Pn(y.changeRef,G?.[y.changeRef.url??""]))===X):de,ce=I??[],ft=W==="goal"?ce.length:W==="pr"?He.length:
t.length,It=y=>{let C=y.changeRef?G?.[y.changeRef.url??""]:void 0,j=y.header==="pr"?Be?.[y.key]??!((C?.failing??0)>0||y.
items.some(O=>O.state==="needs-you")):!1,re=y.header==="session"?!!Be?.[y.key]:!1;return m("div",{className:`ow-block${y.
header==="session"||y.header==="pr"?" ow-goalcard":""}`,"data-grouped":y.header?"true":void 0,"data-open":y.header==="se\
ssion"&&!re||y.header==="pr"&&!j?"true":void 0,children:[y.header==="session"&&y.sessionKey&&a(na,{item:y.items[0],items:y.
items,folded:re,onToggle:xe?()=>xe(y.key,!re):void 0,onOpen:()=>s(y.sessionKey)}),y.header==="pr"&&y.changeRef&&a(ra,{reference:y.
changeRef,checks:C,folded:j,onToggle:xe?()=>xe(y.key,!j):void 0,selected:Ct===y.key,onSelect:gt?()=>gt(y.key):void 0}),y.
header==="goal"&&a(ea,{block:y,onSplit:P,selected:je===y.key,onSelect:Ue?()=>Ue(y.key):void 0}),y.header==="pr"?!j&&a(Re,
{children:m("div",{className:"ow-pr-sessions",children:[a("span",{className:"ow-pr-sublabel-inline",children:"Sessions"}),
bn(y.items).map(O=>m("button",{type:"button",className:"ow-reference ow-reference-link ow-pr-session-chip",onClick:()=>s(
O.sessionKey),children:[a(Wn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:O.label})]},
O.sessionKey))]})}):y.header==="session"?!re&&a(da,{items:y.items,doneTitles:y.sessionKey?T?.[y.sessionKey]:void 0,selectedId:n,
onSelect:r,onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:f,retryBusy:w,onPickStep:g,onSnooze:b,
onHandled:N}):y.items.map(O=>m(qo,{children:[a(In,{item:O,selected:n===O.id,continuation:y.header==="session",whyRanked:O.
state==="needs-you"&&O.action!=="resume"?lt(We(O),ke):void 0,onSelect:()=>r(O),onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,
permissionBusy:u,onRetry:f,retryBusy:w,onStop:k,stopBusy:l,onPickStep:g,onSnooze:b,onHandled:N}),W==="goal"&&Ce&&n===O.id&&
a(rr,{item:O,items:t,onMerge:Ce})]},O.id))]},y.key)},$e=y=>{let C=Ie&&pt?Bo(y,Ie):null,j=y.references.find(re=>re.kind===
"session")?.label??"";return m(qo,{children:[a(In,{item:y,selected:n===y.id,dot:Ko(y),simple:!0,sessionMismatch:C??void 0,
onFixSessionName:C&&y.sessionKey?()=>pt(y.sessionKey,`${j} & ${C.itemGoal}`.slice(0,200)):void 0,whyRanked:y.state==="ne\
eds-you"&&y.action!=="resume"?lt(We(y),ke):void 0,onSelect:()=>r(y),onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,
permissionBusy:u,onRetry:f,retryBusy:w,onPickStep:g,onSnooze:b,onHandled:N}),Ce&&n===y.id&&a(rr,{item:y,items:t,onMerge:Ce})]},
y.id)},At=y=>{if(y.name){let se=Be?.[y.key]??y.status!=="needs-you",U=y.blocks.flatMap(ue=>ue.items),we=dt(U);return a(Cn,
{open:!se,onToggle:()=>xe?.(y.key,!se),label:y.name,flag:we.needsYou>0?`${we.needsYou} need you`:Ne[y.status],flagWarn:we.
needsYou>0,meta:Vt(U),header:a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:y.name}),children:se?
a(or,{members:U}):U.map(ue=>$e(ue))},y.key)}let C=y.blocks[0];if(C.header==="goal"){let se=Be?.[y.key]??y.status!=="need\
s-you",U=C.items[0],we=dt(C.items),ue=[];for(let H=0;H<C.items.length;H+=1)for(let pe=H+1;pe<C.items.length;pe+=1)ue.push(
fe(C.items[H],C.items[pe]));let wt=new Set(C.items.map(H=>H.sessionKey).filter(Boolean)).size,Le=Fe?.[C.key]??Po(C.items)??
(wt>1?`${wt} sessions, one goal`:U.references.find(H=>H.kind==="session")?.label??U.title);return a(Cn,{open:!se,onToggle:()=>xe?.(
y.key,!se),label:Le,flag:we.needsYou>0?`${we.needsYou} need you`:Ne[y.status],flagWarn:we.needsYou>0,meta:Vt(C.items),why:Wo(
C.items,q,Xt),header:a(Ee,{onActivate:()=>Ue?.(C.key),className:"ow-goalcard-header ow-goal-tab","aria-pressed":je===C.key,
"data-selected":je===C.key?"true":void 0,children:a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:Le})}),
action:P&&a(z,{className:"ow-block-open ow-goal-split",title:"Not the same goal \u2014 split into separate cards","aria-\
label":`Split ${U.title}`,onClick:H=>{H.stopPropagation(),P(ue)},children:"Split"}),children:se?a(or,{members:C.items}):
C.items.map(H=>$e(H))},y.key)}let j=C.items[0],re=Fe?.[`item:${j.id}`],O=j.references.find(se=>se.kind==="session")?.label,
ee=re??O;if(!ee||ee===j.title)return $e(j);let Ke=dt(C.items);return a(Cn,{open:!0,label:ee,flag:Ke.needsYou>0?`${Ke.needsYou}\
 need you`:Ne[j.state],flagWarn:Ke.needsYou>0,meta:Vt(C.items),header:a("span",{className:"ow-truncate ow-block-name ow-\
goalcard-title",children:ee}),children:$e(j)},y.key)};return m("section",{className:"ow-section","aria-label":e,children:[
Z?null:L?m(Ee,{onActivate:L,className:"ow-section-toggle",children:[a(tr,{label:e,count:ft,subtitle:mt}),a(le,{className:"\
ow-icon ow-section-chevron","data-open":B?void 0:"true","aria-hidden":"true"})]}):a(tr,{label:e,count:ft,subtitle:mt}),B?
null:a("div",{className:"ow-section-list",children:W==="goal"?ce.length===0?a("p",{className:"ow-section-empty",children:Me}):
ce.map(At):He.length===0?a("p",{className:"ow-section-empty",children:Me}):He.map(It)}),_]})}function ca(e,t){let n=bo(t,
ke);if(!e)return["Crew Manager context: workspace overview.",...n,"Answer the user about the state of their work. This i\
s a conversation, not an action channel."].join(`
`);let r=e.references.map(i=>`${i.kind}: ${i.label} (${i.id})`).join(`
`),s=[e.stalledFor?`Silent for ${st(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(i=>!!i);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,
`State: ${Ne[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...s.length>0?[`Why it is on the board:
${s.join(`
`)}`]:[],`References:
${r}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(i=>!!i).join(`
`)}var sr="crew-manager.panel-widths",ye={workMin:300,railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};
function Jt(e,t,n,r,s){let i=Math.min(s,Math.max(n,t-r));return Math.max(n,Math.min(i,e))}function ar({side:e,containerRef:t,
min:n,reserve:r,max:s,value:i,onChange:d,label:u}){let f=(l,g)=>{let b=g.getBoundingClientRect(),N=e==="start"?l-b.left:
b.right-l;return Jt(N,g.clientWidth,n,r,s)};return a("div",{className:"ow-resizer",role:"separator","aria-orientation":"\
vertical","aria-label":u,tabIndex:0,onPointerDown:l=>{let g=t.current;if(!g)return;l.preventDefault(),document.body.style.
cursor="col-resize",document.body.style.userSelect="none";let b=_=>d(f(_.clientX,g)),N=()=>{window.removeEventListener("\
pointermove",b),window.removeEventListener("pointerup",N),document.body.style.cursor="",document.body.style.userSelect=""};
window.addEventListener("pointermove",b),window.addEventListener("pointerup",N)},onKeyDown:l=>{if(l.key!=="ArrowLeft"&&l.
key!=="ArrowRight")return;let g=t.current;if(!g)return;l.preventDefault();let b=(l.shiftKey?48:16)*(l.key==="ArrowRight"?
1:-1),N=i??(e==="start"?g.clientWidth/2:Math.round(g.clientWidth*.3));d(Jt(N+(e==="start"?b:-b),g.clientWidth,n,r,s))}})}
function ua(){let e=Ds(),t=ie(e);t.current=e;let n=Os(),r=zs(),[s,i]=S("all"),[d,u]=S(()=>{let o=oe(Sn,null);return o&&Nt.
includes(o)?o:"work"}),[f,w]=S(()=>{let o=oe(_n,null)??"prs",c=Nt.includes(o)?o:"prs",p=oe(Sn,null),h=p&&Nt.includes(p)?
p:"work";return c===h?Uo.find(v=>v!==h)??null:c}),k=D(o=>{w(c=>{let p=c===o?null:o;return Y(_n,p),p})},[]),[l,g]=S(()=>oe(
Xo,null)==="session"?"session":"goal"),[b,N]=S("all"),[_,B]=S({}),[L,W]=S(null),[G,X]=S("session"),[T,q]=S(null),[P,Ce]=S(
null),[I,Ie]=S({}),[pt,Xt]=S("unknown"),Fe=ie("unknown"),Be=ie(new Map),[xe,je]=S({}),[Ue,Ct]=S({}),[gt,mt]=S([]),[Z,Me]=S(
null),[de,He]=S(null),[ce,ft]=S(null),[It,$e]=S(()=>oe(yn)),[At,y]=S(()=>oe(Ho)),[C,j]=S(()=>oe(kn,{merged:[],split:[]})),
re=ie(null),O=ie(null),[ee,Ke]=S(()=>oe(sr,{work:null,conductor:null}));J(()=>{Y(sr,ee)},[ee]),J(()=>{let o=()=>Ke(c=>{let p=O.
current?.clientWidth??0,h=re.current?.clientWidth??0;return{work:c.work==null||p===0?c.work:Jt(c.work,p,ye.workMin,ye.railReserve,
1/0),conductor:c.conductor==null||h===0?c.conductor:Jt(c.conductor,h,ye.conductorMin,ye.mainReserve,ye.conductorMax)}});
return o(),window.addEventListener("resize",o),()=>window.removeEventListener("resize",o)},[]);let se=ie(oe(Yo,[])),[U,we]=S(
()=>{let o=oe(gr,null);return{pairs:new Set(o?.pairs??[]),why:new Map(o?.why??[]),stamp:o?.stamp??""}}),[ue,wt]=S(()=>oe(
xn,{})),Le=ie([]),H=ie(!1),[pe,En]=S([]),[Ve,mr]=S(()=>oe(Qo)),[Wt,ht]=S(null),[Pt,bt]=S(null),[fr,wr]=S(()=>oe(Vo,null)??
!0),[Bn,Mn]=S({}),[Zt,hr]=S([]),[br,en]=S(!1),Ye=D(o=>{if(o===d)return;let c=f===o?Uo.find(p=>p!==o)??null:f;Y(Sn,o),Y(_n,
c),u(o),w(c)},[d,f]),vr=D((o,c)=>{o.dataTransfer.setData("text/x-crew-panel",c),o.dataTransfer.effectAllowed="move";let p=o.
currentTarget.querySelector("summary");if(!p)return;let h=p.getBoundingClientRect();o.dataTransfer.setDragImage(p,Math.min(
Math.max(o.clientX-h.left,0),h.width),Math.min(Math.max(o.clientY-h.top,0),h.height))},[]),yr=D(o=>{o.preventDefault(),en(
!1);let c=o.dataTransfer.getData("text/x-crew-panel");!c||!Nt.includes(c)||Ye(c)},[Ye]),$n=V(()=>Nt.filter(o=>o!==d),[d]),
kr=f&&f!==d?String($n.indexOf(f)):"none",Et=o=>{let c=o===d;return{className:"ow-card ow-stack-card",open:c||f===o,draggable:!0,
"data-panel":o,"data-primary":c?"true":"false","data-rail-index":c?void 0:$n.indexOf(o),"data-dragover":c&&br?"true":void 0,
onDragStart:p=>vr(p,o),onDragOver:c?p=>{p.preventDefault(),en(!0)}:void 0,onDragLeave:c?()=>en(!1):void 0,onDrop:c?yr:void 0}},
Kn=ie(!0),[xr,Ln]=S(!0),[Tn,tn]=S(null),[Bt,_r]=S(null),[Je,Dn]=S(!1),[Sr,Nr]=S(!1),[On,_e]=S(null),$=ie(!0),vt=ie(0),nn=ie(
!1);J(()=>($.current=!0,()=>{$.current=!1,vt.current+=1}),[]);let M=D(async()=>{let o=++vt.current,c=t.current;try{let[p,
h,v,x,me,be,E,ae]=await Promise.all([c.get("/api/chat/slots"),c.get("/api/approvals"),c.get("/api/spawn"),c.get("/api/wo\
rkflows/runs"),c.get("/api/crons"),c.get("/api/artifacts"),c.get("/api/autonudge").catch(()=>({loops:[]})),c.get("/api/c\
rons/history?limit=200").catch(()=>({runs:[]}))]);if(!$.current||o!==vt.current)return;Ce({slots:Array.isArray(p)?p:[],approvals:Array.
isArray(h)?h:[],agents:Array.isArray(v.agents)?v.agents:[],workflows:Array.isArray(x.runs)?x.runs:[],crons:Array.isArray(
me.jobs)?me.jobs:[],artifacts:Array.isArray(be.artifacts)?be.artifacts:[],loops:Array.isArray(E?.loops)?E.loops:[]}),hr(
Array.isArray(ae?.runs)?ae.runs:[]),tn(null),_r(Date.now())}catch(p){$.current&&o===vt.current&&tn(p instanceof Error?p:
new Error("Unable to load Crew Manager sources"))}finally{$.current&&o===vt.current&&Ln(!1)}},[]);J(()=>{M();let o=window.
setInterval(()=>{M()},Us);return()=>window.clearInterval(o)},[M]);let Rr=()=>{Ln(!0),tn(null),M()},Mt=D(()=>{Je||(Dn(!0),
M().finally(()=>{$.current&&Dn(!1)}))},[M,Je]);J(()=>{if(!P||Fe.current==="unsupported"||Fe.current==="disabled")return;
let o=Oo(P.slots,Pe).filter(p=>Be.current.get(p.key)!==vn(p));if(o.length===0)return;let c=!1;return(async()=>{let{summaries:p,
support:h}=await zo(o,v=>t.current.get(v));if(!(c||!$.current)&&(Fe.current=h,Xt(h),h==="available")){for(let v of o)p[v.
key]&&Be.current.set(v.key,vn(v));Ie(v=>({...v,...p}))}})(),()=>{c=!0}},[P]),J(()=>{if(!P||!Kn.current)return;let o=!1;return(async()=>{
try{let c=await t.current.get("/api/apps/crew-manager/stalls");if(o||!$.current)return;let p={};for(let v of c?.stalls??
[])v?.key&&(p[v.key]=v);je(p);let h={};for(let v of c?.error_loops??[])v?.key&&(h[v.key]=v);Mn(h)}catch{Kn.current=!1,$.
current&&(je({}),Mn({}))}})(),()=>{o=!0}},[P]),J(()=>{let o=!1;return(async()=>{try{let c=await t.current.get("/api/apps\
/crew-manager/initiatives");if(o||!$.current)return;En((c?.initiatives??[]).filter(p=>p?.name))}catch{}})(),()=>{o=!0}},
[]);let zn=V(()=>xo(Co(P??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},ke,I,xe,Bn,C),Ue),
[P,I,xe,Bn,Ue,C]),$t=V(()=>So(zn,It,At),[zn,It,At]),A=V(()=>$t.items.filter(o=>No(o)),[$t]),Kt=V(()=>hn(A),[A]),Gn=V(()=>{
let o={};for(let c of A){if(c.state!=="done"||!c.sessionKey)continue;let p=o[c.sessionKey];p?p.push(c.title):o[c.sessionKey]=
[c.title]}return o},[A]),Ae=V(()=>A.find(o=>o.id===L)??null,[A,L]),yt=V(()=>s==="all"?A:A.filter(o=>o.state===s),[s,A]),
Lt=V(()=>{let o={all:0,failing:0,running:0,merged:0};for(let c of jt(A,"pr")){if(!c.changeRef)continue;o.all++;let p=gn(
Pn(c.changeRef,_[c.changeRef.url??""]));p!=="other"&&o[p]++}return o},[A,_]);J(()=>{let o=new Set;for(let p of A)for(let h of p.
references)h.kind==="change"&&h.url&&/\/pull\/\d|\/merge_requests\/\d/.test(h.url)&&o.add(h.url);let c=!1;for(let p of o)
_[p]||t.current.post("/api/source/pull-request",{url:p}).then(h=>{!c&&$.current&&h?.title&&B(v=>({...v,[p]:oa(h)}))}).catch(
()=>{});return()=>{c=!0}},[A,_]),J(()=>r(Kt["needs-you"]),[Kt,r]),J(()=>{L&&!A.some(o=>o.id===L)&&W(null)},[A,L]),J(()=>{
Y(Xo,l)},[l]);let on=P?.slots.find(o=>o.key===Pe),Cr=!!(on||Sr);J(()=>{!P||on||nn.current||(nn.current=!0,e.get("/api/ap\
ps/crew-manager/conductor-agent").then(o=>o?.available&&o.agent?o.agent:null).catch(()=>null).then(o=>e.post("/api/chat/\
slots",{name:Pe,title:"Conductor",...o?{agent:o}:{}})).then(()=>{$.current&&(Nr(!0),M())}).catch(o=>{$.current&&(nn.current=
!1,_e(o instanceof Error?`Conductor session could not be created: ${o.message}`:"Conductor session could not be created"))}))},
[e,on,M,P]);let qn=V(()=>go(P?.approvals??[],gt,o=>A.find(c=>c.sessionKey===o)?.title??P?.slots?.find(c=>c.key===o)?.title??
o),[A,P,gt]),Qe=Ae&&!Ae.permissionId?Ae:null,ge=V(()=>To(A,pe,C,se.current,U.pairs),[A,pe,C,U]);J(()=>{let o=Ao(ge.filter(
c=>c.name===null).flatMap(c=>c.blocks));se.current=o,Y(Yo,o)},[ge]),J(()=>{if(Le.current.length===0)return;let o=ge.filter(
h=>h.name===null).flatMap(h=>h.blocks),c={},p=[];for(let h of Le.current){let v=o.find(x=>x.items.length>1&&h.ids.filter(
me=>x.items.some(be=>be.id===me)).length>=2);v?c[v.key]=h.name:p.push(h)}Le.current=p,Object.keys(c).length>0&&wt(h=>{let v={
...h,...c};return Y(xn,v),v})},[ge]),J(()=>{let o=ge.filter(v=>v.name===null).flatMap(v=>v.blocks),c=o.filter(v=>v.items.
length>1).map(v=>({key:v.key,name:ue[v.key]??null,items:v.items.map(x=>({id:x.id,title:x.title}))})),p=o.filter(v=>v.items.
length===1).map(v=>({id:v.items[0].id,title:v.items[0].title,detail:v.items[0].summary??""}));if(p.length===0&&c.every(v=>v.
name))return;let h=JSON.stringify([c.map(v=>[v.key,v.name]),p.map(v=>v.id).sort()]);h===U.stamp||H.current||(H.current=!0,
(async()=>{try{let v=await t.current.post("/api/apps/crew-manager/goal-pass",{clusters:c,ungrouped:p});if(!$.current)return;
if(!v?.available){we(R=>Jo({pairs:R.pairs,why:R.why,stamp:h}));return}let x=new Map;for(let R of o)for(let K of R.items)
x.set(K.id,K);let me=new Map(o.map(R=>[R.key,R])),be=new Set(U.pairs),E=new Map(U.why),ae=new Map,ne=new Map;for(let R of v.
assignments??[]){if((R.confidence??0)<js)continue;let K=R.item_id?x.get(R.item_id):void 0;if(!(!K?.sessionKey||!R.cluster)){
if(R.cluster.startsWith("existing:")){let ve=me.get(R.cluster.slice(9))?.items.find(Dt=>Dt.id!==K.id);if(!ve)continue;let Oe=fe(
K,ve);be.add(Oe),R.why&&E.set(Oe,R.why)}else if(R.cluster.startsWith("new:")){let rt=ae.get(R.cluster)??[];rt.push(K),ae.
set(R.cluster,rt),R.why&&ne.set(K.id,R.why)}}}let xt=new Map;for(let R of v.names??[])R.cluster&&R.name&&xt.set(R.cluster,
R.name);let jn=[];for(let[R,K]of ae){if(K.length<2)continue;for(let ve=0;ve<K.length;ve+=1)for(let Oe=ve+1;Oe<K.length;Oe+=
1){let Dt=fe(K[ve],K[Oe]);be.add(Dt);let Un=ne.get(K[ve].id)??ne.get(K[Oe].id);Un&&E.set(Dt,Un)}let rt=xt.get(R);rt&&jn.
push({ids:K.map(ve=>ve.id),name:rt})}Le.current=jn;let Tt={};for(let[R,K]of xt)R.startsWith("new:")||(R.startsWith("item\
:")?!ue[R]&&x.has(R.slice(5))&&(Tt[R]=K):me.has(R)&&(Tt[R]=K));Object.keys(Tt).length>0&&wt(R=>{let K={...R,...Tt};return Y(
xn,K),K}),we(Jo({pairs:be,why:E,stamp:h}))}catch{}finally{H.current=!1}})())},[ge,ue,U]);let he=V(()=>{if(!Wt)return null;
for(let o of ge){let c=o.blocks.find(p=>p.key===Wt);if(c&&c.items.length>0)return c}return null},[Wt,ge]),te=he?Lo(he.items):
null,Se=V(()=>{if(!Pt)return null;let o=jt(A,"pr",C).find(c=>c.key===Pt&&c.header==="pr");return o&&o.changeRef?o:null},
[Pt,A,C]),rn=V(()=>{let o=(P?.loops??[]).filter(h=>h&&h.active!==!1&&h.slot_key);if(o.length===0)return[];let c=new Map,
p=new Map;for(let h of A)for(let v of h.references)v.kind!=="session"||!v.id||v.label&&!c.has(v.id)&&c.set(v.id,v.label);
for(let h of ge)if(h.name)for(let v of h.blocks)for(let x of v.items)x.sessionKey&&!p.has(x.sessionKey)&&p.set(x.sessionKey,
h.name);return o.map(h=>{let v=Number(h.cycle_count)||0,x=Number(h.max_cycles)||0;return{key:h.slot_key,title:c.get(h.slot_key)??
h.slot_key,goalName:p.get(h.slot_key)??null,progress:x>0?`${v}/${x}`:`${v} ${v===1?"cycle":"cycles"}`,remaining:x>0?Math.
max(0,x-v):null,instruction:(h.message??"").replace(/\s+/g," ").trim(),lastFire:F(h.last_fire_ts)}})},[P,A,ge]),Xe=V(()=>{
let o=new Date;o.setHours(0,0,0,0);let c=o.getTime(),p=c+864e5,h=P?.crons??[],v=new Map;for(let E of Zt){let ae=F(E.started_at);
if(!E.job_id||ae<c||ae>=p)continue;let ne=v.get(E.job_id)??{count:0,failed:0,last:0};ne.count+=1,E.status&&E.status!=="s\
uccess"&&(ne.failed+=1),ne.last=Math.max(ne.last,ae),v.set(E.job_id,ne)}let x=h.map(E=>{let ae=v.get(E.id),ne=F(E.next_run_ts),
xt=ne>=c&&ne<p;return{job:E,ran:ae,next:ne,dueToday:xt}}).filter(E=>E.ran||E.dueToday||E.job.is_running),me=x.filter(E=>E.
ran&&E.ran.failed===0).length,be=x.filter(E=>E.ran&&E.ran.failed>0).length;return{rows:x,done:me,failed:be,total:x.length,
historyKnown:Zt.length>0}},[P,Zt]),[Ir,Fn]=S(!1),Ar=V(()=>{if(l!=="goal")return[];let o=Mo(P?.slots??[],pe),c=$o(A,pe),p=new Set,
h=[];for(let v of[...c,...o])p.has(v.name.toLowerCase())||(p.add(v.name.toLowerCase()),h.push(v));return h.sort((v,x)=>x.
sessions-v.sessions)},[l,P,A,pe]),Wr=D(async(o,c)=>{try{await t.current.patch(`/api/chat/slots/${encodeURIComponent(o)}/\
title`,{title:c}),M()}catch{}},[M]),Pr=D(async(o,c=[])=>{if(o.trim()){Fn(!0);try{let p=await t.current.post("/api/apps/c\
rew-manager/initiatives",{name:o.trim(),aliases:c});$.current&&p?.initiatives&&En(p.initiatives.filter(h=>h?.name))}catch{}finally{
$.current&&Fn(!1)}}},[]),Te=D(async(o,c)=>{if(!Z){Me(o),_e(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(
o)}/${c?"approve":"reject"}`,{}),M()}catch(p){_e(p instanceof Error?`Could not answer that request: ${p.message}`:"Could\
 not answer that request"),M()}finally{$.current&&Me(null)}}},[M,Z]),Ze=D(async(o,c)=>{if(!(Z||!o.permissionId||!o.sessionKey)){
Me(o.permissionId),_e(null);try{await t.current.post(`/api/chat/slots/${encodeURIComponent(o.sessionKey)}/approve`,{action:c,
request_id:o.permissionId}),M()}catch(p){_e(p instanceof Error?`Could not answer that request: ${p.message}`:"Could not \
answer that request"),M()}finally{$.current&&Me(null)}}},[M,Z]),Er=D(o=>{$e(c=>{let p=Object.fromEntries(Object.entries(
c).filter(([,h])=>h>Date.now()));return p[o]=Date.now()+_o,Y(yn,p),p}),W(null)},[]),Br=D((o,c)=>{y(p=>{let h={...p,[o]:c};
return Y(Ho,h),h}),W(null)},[]),Mr=D(()=>{$e({}),Y(yn,{})},[]),$r=D(o=>{j(c=>{let p={merged:c.merged.filter(h=>!o.includes(
h)),split:[...new Set([...c.split,...o])]};return Y(kn,p),p})},[]),Kr=D(o=>{j(c=>{let p={merged:[...new Set([...c.merged,
o])],split:c.split.filter(h=>h!==o)};return Y(kn,p),p})},[]),Lr=D(()=>{wr(o=>(Y(Vo,!o),!o))},[]),et=D(async o=>{if(!de){
He(o),_e(null);try{await t.current.post(o,{}),M()}catch(c){_e(c instanceof Error?`Could not re-run it: ${c.message}`:"Co\
uld not re-run it"),M()}finally{$.current&&He(null)}}},[M,de]),kt=D(async o=>{if(!ce){ft(o),_e(null);try{await t.current.
del(o),q("Stopped the monitor loop. Re-arming it is done from the session itself."),M()}catch(c){let p=c instanceof Error?
c.message:"";/404|not found/i.test(p)?q("That loop had already stopped."):_e(p?`Could not stop it: ${p}`:"Could not stop\
 it"),M()}finally{$.current&&ft(null)}}},[M,ce]),De=D(async o=>{if(Se&&Se.changeRef){let p=Se.changeRef,h=bn(Se.items),v=[
`Crew Manager: this concerns the pull request ${p.label}${p.url?` (${p.url})`:""}.`,h.length?`Sessions that produced it:\

${h.map(x=>`- ${x.label}`).join(`
`)}`:void 0,"Advise on it \u2014 you cannot merge or push, so recommend the session that should act rather than acting."].
filter(Boolean).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(Pe)}/context`,{content:v,source:"crew-manager",ephemeral:!0}).
catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:Pe}).catch(x=>{if(!(x instanceof SyntaxError))throw x}),!$.
current)return;q(`Asked the Conductor about ${p.label}`),bt(null);return}if(he&&te?.sessionKey){let p=te.sessionKey,h=he.
items.map(x=>`- ${x.references.find(me=>me.kind==="session")?.label??x.sessionKey}: ${Ne[x.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(p)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${he.items[0].title}", which spans sessions:`,h,"You are the session actively on it, so the instructi\
on is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:p}).catch(x=>{if(!(x instanceof
SyntaxError))throw x}),!$.current)return;Ct(x=>({...x,[te.id]:Date.now()})),mt(x=>x.includes(p)?x:[...x,p]);let v=te.references.
find(x=>x.kind==="session")?.label??te.title;q(te.moving||te.state==="running"?`Sent to ${v} \u2014 the active session on thi\
s goal`:`Sent to ${v} \u2014 resuming the last session on this goal`),ht(null),M();return}let c=Ae&&!Ae.permissionId?Ae:
null;if(G==="session"&&c?.sessionKey){let p=c.sessionKey;if(await t.current.post("/api/chat",{message:o,slot:p}).catch(h=>{
if(!(h instanceof SyntaxError))throw h}),!$.current)return;Ct(h=>({...h,[c.id]:Date.now()})),mt(h=>h.includes(p)?h:[...h,
p]),q(`Sent new instructions to ${c.title}`),W(null),M();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(
Pe)}/context`,{content:ca(Ae,A),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,
slot:Pe}).catch(p=>{if(!(p instanceof SyntaxError))throw p})},[Ae,Se,he,te,A,M,G]),sn={"needs-you":yt.filter(o=>o.state===
"needs-you"),running:yt.filter(o=>o.state==="running"),done:yt.filter(o=>o.state==="done")},tt=D((o,c)=>{mr(p=>{let h={...p,
[o]:c};return Y(Qo,h),h})},[]),Tr=D(o=>{ht(c=>c===o?null:o),W(null),bt(null),q(null)},[]),Dr=D(o=>{bt(c=>c===o?null:o),W(
null),ht(null),q(null)},[]),nt=o=>n(`/chat?sid=${encodeURIComponent(o)}`),ot=o=>{W(c=>c===o.id?null:o.id),ht(null),bt(null),
q(null),X("session")},Or=Se?m("div",{className:"ow-quote ow-quote-docked",children:[m("div",{className:"ow-quote-body ow\
-quote-goal",children:[m("div",{className:"ow-quote-line",children:[a("span",{className:"ow-eyebrow",children:"Asking ab\
out PR"}),a("span",{className:"ow-quote-title",title:Se.changeRef?.label,children:Se.changeRef?.label?.replace(/^github\s*/,
"")})]}),a("span",{className:"ow-quote-route ow-truncate",children:"\u2192 Conductor"})]}),a(z,{className:"ow-quote-clea\
r","aria-label":"Remove the quoted PR",onClick:()=>{bt(null),q(null)},children:"Clear"})]}):he&&te?m("div",{className:"o\
w-quote ow-quote-docked",children:[m("div",{className:"ow-quote-body ow-quote-goal",children:[m("div",{className:"ow-quo\
te-line",children:[a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"ow-quote-title",title:he.
items[0].title,children:he.items[0].title})]}),m("span",{className:"ow-quote-route ow-truncate",children:["\u2192 ",te.references.
find(o=>o.kind==="session")?.label??te.title,te.moving||te.state==="running"?" (active)":" (will resume)"]})]}),a(z,{className:"\
ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{ht(null),q(null)},children:"Clear"})]}):Qe?m("div",{className:"\
ow-quote ow-quote-docked",children:[m("div",{className:"ow-quote-body",children:[Qe.sessionKey?a("button",{type:"button",
className:"ow-scope-toggle","aria-pressed":G==="conductor","aria-label":G==="session"?"Sending to this session. Activate\
 to send to the Conductor instead.":"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>X(
o=>o==="session"?"conductor":"session"),children:G==="session"?"Instructing":"To Conductor"}):a("span",{className:"ow-ey\
ebrow",children:"Quoted"}),a("span",{className:"ow-quote-title",title:Qe.title,children:Qe.title})]}),a(z,{className:"ow\
-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{W(null),q(null)},children:"Clear"})]}):null;return m(
"div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[a("style",{children:Go}),a("div",{className:"\
ow-titlebar",children:a(Fs,{title:m("span",{className:"ow-title-line",children:["Crew Manager",a("span",{className:"ow-b\
eta","aria-label":"Beta preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still running, and wh\
at finished recently."})}),a("div",{className:"ow-body",children:m("div",{className:"ow-layout",ref:re,style:ee.conductor!=
null?{"--ow-conductor-w":`${ee.conductor}px`}:void 0,children:[m("div",{className:"ow-main","data-open-row":kr,ref:O,style:ee.
work!=null?{"--ow-work-w":`${ee.work}px`}:void 0,children:[m("details",{...Et("work"),"aria-label":"Work",children:[m("s\
ummary",{onClick:o=>{o.preventDefault(),d!=="work"&&k("work")},children:[m("span",{className:"ow-stack-title",children:[
a(le,{className:"ow-icon ow-stack-chevron"}),a(Yt,{className:"ow-icon"}),d==="work"?a("span",{className:"ow-tabs",role:"\
tablist","aria-label":"View",children:["goal","session"].map(o=>a(z,{role:"tab","aria-selected":l===o,"data-selected":l===
o,className:"ow-tab",onClick:()=>g(o),children:o==="goal"?"Goals":"Sessions"},o))}):pr.work]}),m("span",{className:"ow-s\
tack-actions",children:[a(Q,{variant:"muted",children:Kt.all}),d==="work"?a(Ht,{lastUpdated:Bt,refreshing:Je,onRefresh:Mt}):
a(Ut,{id:"work",onPromote:Ye})]})]}),m("div",{className:"ow-listcard-tools",children:[a("p",{className:"ow-listcard-sub",
children:l==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each session needs from you"}),
l==="session"&&a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.keys(Nn).map(
o=>m(z,{onClick:()=>i(o),"aria-pressed":s===o,"data-selected":s===o,className:"ow-filter",children:[Nn[o],a("span",{className:"\
ow-count",children:Kt[o]})]},o))})]}),a("main",{className:"ow-work",children:a("div",{className:"ow-work-inner",children:xr?
a(Fo,{rows:7}):Tn&&!P?a(jo,{icon:a(ir,{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:Tn.
message,action:a(z,{onClick:Rr,children:"Try again"})}):(l==="goal"?A.length===0:yt.length===0)?a(jo,{icon:a(Ks,{className:"\
ow-icon"}),title:"No matching work",subtitle:l==="goal"?"No sessions are running yet.":"Change the filter to see session\
s in another state."}):l==="goal"?a(ut,{title:"Work by goal",hideHeader:!0,items:A,selectedId:L,onSelect:ot,onOpenSession:nt,
onAnswerPermission:(o,c)=>{Te(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{et(o)},retryBusy:de!==
null,onPickStep:o=>{De(o)},groupBy:l,goalVerdicts:C,onSplitGoal:$r,onMergeGoal:Kr,initiativeBlocks:ge,initiatives:pe,onRenameSession:(o,c)=>{
Wr(o,c)},semanticWhy:U.why,goalNames:ue,collapsedInitiatives:Ve,onToggleInitiative:tt,selectedGoalKey:Wt,onSelectGoal:Tr,
footer:a(Zs,{candidates:Ar,prominent:pe.length===0,busy:Ir,onAdd:(o,c)=>{Pr(o,c)}}),emptyLabel:"No matching work"}):s===
"all"?m(Re,{children:[a(ut,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:sn["needs-you"],doneBySession:Gn,
selectedId:L,onSelect:ot,onSnooze:Er,onHandled:Br,footer:$t.snoozedCount>0?m("button",{type:"button",className:"ow-aside\
-note",onClick:Mr,children:[$t.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:nt,onAnswerPermission:(o,c)=>{
Te(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{et(o)},retryBusy:de!==null,onStop:o=>{kt(
o)},stopBusy:ce!==null,onPickStep:o=>{De(o)},collapsedInitiatives:Ve,onToggleInitiative:tt,groupBy:l,emptyLabel:"Nothing\
 needs your input right now."}),a(ut,{title:"In progress",subtitle:"Being worked on right now",items:sn.running,doneBySession:Gn,
selectedId:L,onSelect:ot,onOpenSession:nt,onAnswerPermission:(o,c)=>{Te(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==
null,onRetry:o=>{et(o)},retryBusy:de!==null,onStop:o=>{kt(o)},stopBusy:ce!==null,onPickStep:o=>{De(o)},collapsedInitiatives:Ve,
onToggleInitiative:tt,groupBy:l,emptyLabel:"Nothing is in progress right now."}),a(ut,{title:"Done recently",subtitle:"F\
inished in the last few days",items:sn.done,selectedId:L,onSelect:ot,collapsed:fr,onToggleCollapsed:Lr,onOpenSession:nt,
onAnswerPermission:(o,c)=>{Te(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{et(o)},retryBusy:de!==
null,onStop:o=>{kt(o)},stopBusy:ce!==null,onPickStep:o=>{De(o)},collapsedInitiatives:Ve,onToggleInitiative:tt,groupBy:l,
emptyLabel:"No recent completed work."})]}):a(ut,{title:Nn[s],items:yt,selectedId:L,onSelect:ot,onOpenSession:nt,onAnswerPermission:(o,c)=>{
Te(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{et(o)},retryBusy:de!==null,onStop:o=>{kt(
o)},stopBusy:ce!==null,onPickStep:o=>{De(o)},collapsedInitiatives:Ve,onToggleInitiative:tt,groupBy:l,emptyLabel:"No matc\
hing work"})})})]}),m("details",{...Et("prs"),children:[m("summary",{onClick:o=>{o.preventDefault(),d!=="prs"&&k("prs")},
children:[m("span",{className:"ow-stack-title",children:[a(le,{className:"ow-icon ow-stack-chevron"}),a(An,{className:"o\
w-icon"}),"PRs"]}),m("span",{className:"ow-stack-actions",children:[a(Q,{variant:"muted",children:Lt.all}),d==="prs"?a(Ht,
{lastUpdated:Bt,refreshing:Je,onRefresh:Mt}):a(Ut,{id:"prs",onPromote:Ye})]})]}),a("p",{className:"ow-stack-sub",children:"\
Pull requests your work touches, and what is holding each one up"}),Lt.all>0&&a("div",{className:"ow-pr-tools",children:a(
"div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(er).map(o=>m(z,{onClick:()=>N(
o),"aria-pressed":b===o,"data-selected":b===o,className:"ow-filter",children:[er[o],a("span",{className:"ow-count",children:Lt[o]})]},
o))})}),a("div",{className:"ow-stack-body",children:Lt.all===0?a("p",{className:"ow-stack-empty",children:"No work is li\
nked to a PR right now. Work links to one when a session mentions its URL."}):a(Re,{children:a(ut,{title:"Work by PR",hideHeader:!0,
items:A,prChecks:_,prFilter:b,collapsedInitiatives:Ve,onToggleInitiative:tt,selectedId:L,onSelect:ot,onOpenSession:nt,onAnswerPermission:(o,c)=>{
Te(o,c)},onDecideApproval:(o,c)=>{Ze(o,c)},permissionBusy:Z!==null,onRetry:o=>{et(o)},retryBusy:de!==null,onStop:o=>{kt(
o)},stopBusy:ce!==null,onPickStep:o=>{De(o)},selectedPrKey:Pt,onSelectPr:Dr,groupBy:"pr",emptyLabel:"No PR matches that \
status."})})})]}),m("details",{...Et("loops"),children:[m("summary",{onClick:o=>{o.preventDefault(),d!=="loops"&&k("loop\
s")},children:[m("span",{className:"ow-stack-title",children:[a(le,{className:"ow-icon ow-stack-chevron"}),a(ur,{className:"\
ow-icon"}),"Loops"]}),m("span",{className:"ow-stack-actions",children:[a(Q,{variant:"muted",children:rn.length}),d==="lo\
ops"?a(Ht,{lastUpdated:Bt,refreshing:Je,onRefresh:Mt}):a(Ut,{id:"loops",onPromote:Ye})]})]}),a("p",{className:"ow-stack-\
sub",children:"Sessions repeating a goal until it is done"}),a("div",{className:"ow-stack-body",children:rn.length===0?a(
"p",{className:"ow-stack-empty",children:"No loop is running right now."}):rn.map(o=>{let c=Qt(o.lastFire),p=[c&&`last t\
ick ${c}`,o.remaining!==null&&`${o.remaining} remaining`].filter(Boolean).join(" \xB7 ");return m("div",{className:"ow-m\
ini",children:[a("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),m("div",{children:[m("div",{className:"\
ow-mini-title",children:[o.goalName??o.title,a("span",{className:"ow-mini-chip",children:o.progress})]}),o.instruction&&
a("div",{className:"ow-mini-desc",title:o.instruction,children:o.instruction}),p&&a("div",{className:"ow-mini-when",children:p})]}),
a(Q,{variant:"ok",children:"Active"})]},o.key)})})]}),m("details",{...Et("schedule"),children:[m("summary",{onClick:o=>{
o.preventDefault(),d!=="schedule"&&k("schedule")},children:[m("span",{className:"ow-stack-title",children:[a(le,{className:"\
ow-icon ow-stack-chevron"}),a(cr,{className:"ow-icon"}),"Scheduled tasks"]}),m("span",{className:"ow-stack-actions",children:[
m(Q,{variant:Xe.failed>0?"err":"muted",children:[Xe.done,"/",Xe.total," today"]}),d==="schedule"?a(Ht,{lastUpdated:Bt,refreshing:Je,
onRefresh:Mt}):a(Ut,{id:"schedule",onPromote:Ye})]})]}),a("p",{className:"ow-stack-sub",children:Xe.historyKnown?"Today'\
s runs only \u2014 jobs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be\
 low"}),a("div",{className:"ow-stack-body",children:Xe.rows.length===0?a("p",{className:"ow-stack-empty",children:"Nothi\
ng is scheduled for today."}):Xe.rows.map(({job:o,ran:c,next:p,dueToday:h})=>{let v=!!(c&&c.failed>0),x=[c&&`ran today ${Zo(
c.last)}${c.count>1?` (${c.count}x)`:""}`,h&&p?`next ${Zo(p)}`:null].filter(Boolean).join(" \xB7 ");return m("div",{className:"\
ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:v?"var(--danger)":o.enabled===!1?"var(--muted)":
"var(--warn)"}}),m("div",{children:[a("div",{className:"ow-mini-title",children:o.name}),o.schedule&&m("div",{className:"\
ow-mini-desc",children:[o.schedule,o.cron_expr&&a("span",{className:"ow-mini-chip",children:o.cron_expr})]}),x&&a("div",
{className:"ow-mini-when",children:x})]}),o.is_running?a(Q,{variant:"aim",children:"Running"}):v?a(Q,{variant:"err",children:"\
Failed"}):o.enabled===!1?a(Q,{variant:"muted",children:"Paused"}):c?a(Q,{variant:"ok",children:"Success"}):a(Q,{variant:"\
warn",children:"Pending"})]},o.id)})})]}),a(ar,{side:"start",containerRef:O,min:ye.workMin,reserve:ye.railReserve,max:1/0,
value:ee.work,onChange:o=>Ke(c=>({...c,work:o})),label:"Resize the work column"})]}),a(ar,{side:"end",containerRef:re,min:ye.
conductorMin,reserve:ye.mainReserve,max:ye.conductorMax,value:ee.conductor,onChange:o=>Ke(c=>({...c,conductor:o})),label:"\
Resize the Conductor panel"}),m("aside",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"\
ow-conductor-header",children:m("div",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!Qe&&a("s\
pan",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:Cr?
m("div",{className:"ow-chat-panel",children:[qn.length>0&&a("div",{className:"ow-permissions",role:"alert",children:qn.map(
o=>a(Qs,{tool:o.tool,purpose:o.purpose,where:o.sessionLabel,busy:Z!==null,onAnswer:c=>{Te(o.id,c)}},o.id))}),T&&m("div",
{className:"ow-conductor-receipt",role:"status",children:[a(dr,{className:"ow-icon"}),T]}),On&&a("div",{className:"ow-ch\
at-error",role:"alert",children:On}),a("div",{className:"ow-embed",children:a(Gs,{slotKey:Pe,frameless:!0,startAtBottom:!0,
slotControls:!0,placeholder:Se?"Ask the Conductor about this PR\u2026":he?"Instruction for this goal\u2026":Qe?.sessionKey&&
G==="session"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:De,aboveComposer:Or})})]}):a(
"div",{className:"ow-chat-loading",children:a(Fo,{rows:4})})})]})]})})]})}export{ua as default};
