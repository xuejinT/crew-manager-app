import{Fragment as Oo,useCallback as D,useEffect as H,useMemo as V,useRef as le,useState as _}from"react";import{AlertTriangle as rr,
Bot as Is,Check as sr,ChevronRight as de,Check as ar,Clock as ir,Package as Cs,ExternalLink as Nn,MessageSquare as Rn,RefreshCw as As,
Shield as Ws,Waves as lr,Search as Ps,Tag as Es,Users as Ft,Zap as Bs}from"lucide-react";import{useAppApi as Ms,useNavigate as Ks,
useNavBadge as $s,ChatEmbed as Ls}from"@kirocrew/app-sdk";import{Badge as ee,Btn as G,ContentSkeleton as zo,EmptyState as Go,
Input as Ts,PageHeader as Ds}from"@kirocrew/app-sdk/ui";function ot(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),r=t%
60;return r===0?`${n} hour${n===1?"":"s"}`:`${n}h ${r}m`}function $r(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function dn(e){let t=yt(e);return t==="merged"?"merged":t==="conflict"||t==="ci-failing"||
t==="changes-requested"?"failing":t==="checks-running"?"running":"other"}var cn={merged:"Merged",closed:"Closed",draft:"\
Draft",conflict:"Conflict","ci-failing":"CI failing",behind:"Behind base","checks-running":"Checks running","changes-req\
uested":"Changes requested","comments-open":"Comments open","needs-review":"Needs review",ready:"Ready",open:"Open"},no={
merged:"muted",closed:"muted",draft:"muted",conflict:"err","ci-failing":"err",behind:"warn","checks-running":"warn","cha\
nges-requested":"err","comments-open":"warn","needs-review":"warn",ready:"ok",open:"muted"},Lr=2;function oo(e){return e.
mergeable==="conflicting"||e.mergeState==="dirty"?!0:e.mergeable||e.mergeState?!1:e.status==="conflict"}function yt(e){let t=(e.
state??"").toUpperCase(),n=!!e.available&&(e.total??0)>0;return t==="MERGED"||!t&&e.status==="merged"?"merged":t==="CLOS\
ED"?"closed":e.isDraft||e.mergeState==="draft"?"draft":oo(e)?"conflict":(e.failing??0)>0||!n&&e.status==="checks failing"?
"ci-failing":e.review==="changes-requested"?"changes-requested":(e.unresolved??0)>0?"comments-open":e.mergeState==="behi\
nd"||e.mergeState==="need_rebase"?"behind":(e.pending??0)>0||!n&&e.status==="checks running"?"checks-running":e.mergeState===
"blocked"?"needs-review":e.review==="approved"||e.mergeState==="clean"&&n&&(e.failing??0)===0?"ready":"open"}var Tr=4;function ro(e,t=Date.
now()){let n=[],r=(e.state??"").toUpperCase();if(r==="MERGED"||e.status==="merged")return[];if(r==="CLOSED")return[];(e.
isDraft||e.mergeState==="draft")&&n.push("Draft"),e.review==="changes-requested"?n.push("Changes requested"):e.review===
"approved"&&n.push("Approved");let s=e.failing??0,i=e.pending??0;s>0?n.push(`${s} check${s===1?"":"s"} failing`):i>0?n.push(
`${i} check${i===1?"":"s"} running`):e.available&&(e.total??0)>0&&n.push("All checks passing"),oo(e)?n.push(`merge confl\
ict with ${e.base||"the base branch"}`):(e.mergeState==="behind"||e.mergeState==="need_rebase")&&n.push(`behind ${e.base||
"the base branch"}`);let d=e.unresolved??0;d>0&&n.push(`${d} unresolved comment${d===1?"":"s"}`),e.mergeState==="blocked"&&
e.review!=="changes-requested"&&n.push("waiting on review"),e.autoMerge?n.push("auto-merge armed"):yt(e)==="ready"&&n.push(
"ready to merge");let u=e.updatedAt?Math.floor((t-e.updatedAt)/864e5):0;u>=Lr&&n.push(`no activity in ${u} days`);let m=cn[yt(
e)].toLowerCase();return n.filter(f=>f.toLowerCase()!==m).slice(0,Tr)}function so(e){let t=new Map;for(let r of e){if(r.
kind!=="review")continue;let s=(r.state??"").toUpperCase();if(s!=="APPROVED"&&s!=="CHANGES_REQUESTED")continue;let i=r.createdAt&&
Date.parse(r.createdAt)||0,d=r.author??"",u=t.get(d);(!u||i>=u.at)&&t.set(d,{at:i,state:s})}let n=[...t.values()].map(r=>r.
state);return n.includes("CHANGES_REQUESTED")?"changes-requested":n.includes("APPROVED")?"approved":"none"}function ao(e){
let t=new Set;for(let n of e)!n.resolvable||n.resolved||t.add(n.threadId||n.id||"");return t.size}function io(e){if(!e)return;
let t;try{t=new URL(e).pathname}catch{return}let n=t.split("/").filter(Boolean),r=n.indexOf("-");if(r>0)return n[r-1];let s=n.
findIndex(i=>i==="pull"||i==="pulls"||i==="merge_requests");return s>0?n[s-1]:n.length>1?n[1]:void 0}function lo(e,t,n){
let r=new Set(t.filter(Boolean));if(r.size===0)return[];let s=new Set,i=[];for(let d of e){let u=d.slot;!u||!r.has(u)||!d.
id||s.has(d.id)||(s.add(d.id),i.push({id:d.id,sessionKey:u,sessionLabel:n(u),tool:d.tool||"a tool",purpose:d.tool_purpose}))}
return i}var qn={"needs-you":0,running:1,done:2};function F(e){if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;
let t=Date.parse(e);return Number.isFinite(t)?t:0}function Dr(e,t){if(e.paused)return"";let n=F(e.next_run_ts);if(!n)return"";
let r=Math.round((n-t)/1e3);return r<=0?"":ot(r)}var Fn=72;function Oe(e,t){let n=e?.replace(/\s+/g," ").trim();if(!n)return t;
let s=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(/[.;,]$/,"");if(s.length<=Fn)return s;let i=s.
slice(0,Fn),d=i.lastIndexOf(" ");return`${(d>24?i.slice(0,d):i).trim()}\u2026`}function ze(e){return!!e.source_links?.some(
t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var Or=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
zr=/^\((?:code|diff|widget|image)\)$/,Gr=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
qr=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,Fr=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
jr=/[?？]["'”’)\]]*$/;function co(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||zr.test(t)||Or.test(
t)?null:t}function un(e){if(!e.waiting_for_input)return null;let t=co(e);return!t||Gr.test(t)||qr.test(t)?null:Fr.test(t)||
jr.test(t)?t:null}function jn(e){return e.pending_approval||un(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":ze(e)?"needs-you":"done"}function Ur(e,t){if(e.pending_approval)return t("approval_waiting");let n=un(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):ze(e)?t("linked_change_issue"):co(e)??t("recent_w\
ork_ready"))}function on(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function Hr(e){return e.pending_approval?"review-approval":un(e)?"reply":"open"}function uo(e){
return(e.source_links??[]).map(t=>({number:String(t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.
kind==="issue"?`issue #${t.number}`:`${t.provider} #${t.number}`,url:t.url,sessionKey:e.key,status:$r(t)}}))}function Vr(e,t){
let n=uo(e).map(r=>r.ref);return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:Ur(e,t),state:jn(e),moving:jn(
e)==="running"||void 0,issue:ze(e),updatedAt:F(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:on(
e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:ze(e)||void 0,action:Hr(e),references:[{kind:"session",id:e.key,label:e.
title||t("untitled_work"),sessionKey:e.key},...n]}}function pn(e,t){e.references.some(n=>n.kind===t.kind&&n.id===t.id)||
e.references.push(t)}function po(e){return(e.source||"").toLowerCase()==="subagent"}function Yr(e,t,n){let r=po(t);e.state=
"needs-you",e.updatedAt=Math.max(e.updatedAt,F(t.ts)),e.summary=n(r?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=
r?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=
t.tool_purpose,e.permissionInput=t.tool_input,pn(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),sessionKey:t.
slot||e.sessionKey})}function Jr(e,t,n){e.updatedAt=Math.max(e.updatedAt,F(t.started)),e.issue||=!!(t.done&&(t.error||t.
outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_failed",{task:t.
task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),pn(e,{kind:"agent",id:t.id,label:t.agent||
n("agent"),sessionKey:t.parent||e.sessionKey})}function Qr(e,t,n){e.issue||=t.status==="failed",t.status==="running"&&e.
state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow_failed",{name:t.
name})),pn(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function Xr(e,t){
if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"dropped":return"\
done";case"in-progress":return"running";default:return null}}function Zr(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function es(e){let t=null,n=-1;for(let r of e){let s=r.last_touched_turn??0;s>n&&(n=s,t=r)}return t}function ts(e,t){let n=e.next_steps?.find(s=>s.what?.trim())?.what?.trim();if(n)return n;let r=[...e.progress??[]].reverse().
find(s=>s.trim());return r?r.trim():e.initial_intent?.trim()||t("work_in_progress")}var ns=3;function os(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function rs(e,t){if(!t)return!1;
let n=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${n}\\b`,"u").test(e)}function Un(e,t){if(e.length===
0)return[];let n=os(t);return e.filter(r=>rs(n,r.number)).map(r=>r.ref)}function ss(e,t,n){if(!t?.enabled)return[];let r=t.
intents??[];if(r.length===0)return[];let s=uo(e),i=[],d=es(r),m=!!(e.running||e.subagents_running||e.orchestrating)?[]:r.
filter(l=>l.state==="in-progress");m.forEach(l=>{let p=r.indexOf(l),b=(l.next_steps??[]).filter(N=>N.what?.trim());i.push(
{id:`unattended:${e.key}:${p}`,title:Oe(l.title,e.title||n("untitled_work")),summary:b[0]?.what?.trim()||n("no_next_step"),
state:"needs-you",issue:ze(e),updatedAt:F(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:on(e,n),
queuedBehind:e.queue_depth||void 0,changeBlocked:ze(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...Un(s,l)],nextSteps:b,progress:(l.progress??[]).filter(
N=>N.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0})}),r.forEach((l,p)=>{if(m.includes(l))return;let b=Xr(
l,e);if(!b)return;let N=(l.next_steps??[]).filter(S=>S.what?.trim());i.push({id:`intent:${e.key}:${p}`,title:Oe(l.title,
e.title||n("untitled_work")),summary:ts(l,n),state:b,issue:!1,updatedAt:F(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.
key,provenance:on(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:ze(e)||void 0,unverified:l.verified===!1||void 0,
action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...Un(s,l)],nextSteps:N,
progress:(l.progress??[]).filter(S=>S.trim()),stale:!!t.stale,lastTouchedTurn:l.last_touched_turn??0,moving:Zr(l,e,d)||void 0})});
let f=i.filter(l=>l.state==="needs-you"),k=i.filter(l=>l.state!=="needs-you").sort((l,p)=>(p.lastTouchedTurn??0)-(l.lastTouchedTurn??
0));return[...f,...k].slice(0,Math.max(ns,f.length))}var go=new Set(["crew-manager-conductor","overwatch-conductor"]),as={
approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,run_failed:55,stalled:50,change_blocked:40,
nobody_on_it:30,queued_behind:12,waiting_a_while:8},is=3;function ls(e,t){return e.updatedAt?Math.max(0,Math.floor((t-e.
updatedAt)/36e5)):0}var $t=5;function mo(e,t,n=Date.now()){let r=gn(e),s=xo(e.filter(d=>d.state==="needs-you"),n),i=[`Fl\
eet: ${r["needs-you"]} waiting on the user, ${r.running} in progress, ${r.done} finished recently.`];return s.length===0?
(i.push("Nothing is waiting on the user."),i):(i.push(`Waiting on the user, in the order the list shows them (top ${Math.
min($t,s.length)}):`),s.slice(0,$t).forEach((d,u)=>{let m=at(Ae(d,n),t),f=d.sessionKey?` [session ${d.sessionKey}]`:"";i.
push(`${u+1}. ${d.title} \u2014 ${d.summary} (${m})${f}`)}),s.length>$t&&i.push(`\u2026and ${s.length-$t} more waiting.`),
i)}var Ge=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that","with","from","into",
"be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run","why","what","how","again",
"still","not"]),Hn=.6,Vn=2,fo=new Set;function rn(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").
split(/\s+/).filter(t=>t.length>2&&!Ge.has(t)))]}function Lt(e,t){let n=rn(e),r=rn(t);if(n.length<Vn||r.length<Vn)return 0;
let s=n.length<=r.length?n:r,i=new Set(n.length<=r.length?r:n);return s.filter(u=>i.has(u)).length/s.length}function Yn(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Jn(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function Qn(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}var ds=new Set(
["pull request","pull requests","status update","work in progress","code review","follow up","next step","next steps","a\
ction item","action items","kiro crew","in progress","needs you"]);function rt(e){let t=new Set,n=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??
[];for(let r of n){let s=r.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(i=>i.length>
3&&i.endsWith("s")&&!i.endsWith("ss")?i.slice(0,-1):i);for(;s.length&&Ge.has(s[0]);)s.shift();for(;s.length&&Ge.has(s[s.
length-1]);)s.pop();if(!(s.length<2))for(let i=s.length;i>=2;i-=1)for(let d=0;d+i<=s.length;d+=1){let u=s.slice(d,d+i).join(
" ");ds.has(u)||t.add(u)}}return[...t]}function wo(e){let t=new Set;if(e.length<cs)return t;let n=new Map;for(let r of e)
for(let s of rt(r.title))n.set(s,(n.get(s)??0)+1);for(let[r,s]of n)s/e.length>=us&&t.add(r);return t}var cs=4,us=.75;function st(e,t,n=fo){
if(Yn(e).find(d=>Yn(t).includes(d)))return"same_change";if(Jn(e).find(d=>Jn(t).includes(d)))return"same_artifact";let i=rt(
t.title).filter(d=>!n.has(d));if(rt(e.title).some(d=>i.includes(d)))return"same_deliverable";if(Lt(e.title,t.title)>=Hn)
return"same_topic";for(let d of Qn(e))for(let u of Qn(t))if(Lt(d,u)>=Hn)return"same_step";return null}function ho(e,t){return e.
parentId===t.id||t.parentId===e.id?"spawned":Xn(e).includes(t.id)||Xn(t).includes(e.id)?"references":null}function Xn(e){
let t=[];for(let n of e.references)n.kind==="artifact"?t.push(`artifact:${n.id}`):n.kind==="workflow"?t.push(`workflow:${n.
id}`):n.kind==="agent"?t.push(`agent:${n.id}`):n.kind==="monitor"&&t.push(`monitor:${n.id}`,`loop:${n.id}`);return t.filter(
n=>n!==e.id)}var kt={merged:[],split:[]};function Tt(e){return`${e.sessionKey??e.id}|${rn(e.title).join(" ")}`}function pe(e,t){
return[Tt(e),Tt(t)].sort().join("")}function ps(e,t=kt){let n=e.filter(s=>s.state!=="done"&&s.sessionKey).sort((s,i)=>(s.
updatedAt||0)-(i.updatedAt||0)),r=wo(n);for(let s=1;s<n.length;s+=1){let i=n[s];for(let d=0;d<s;d+=1){let u=n[d];if(u.sessionKey===
i.sessionKey||t.split.includes(pe(i,u)))continue;let m=st(i,u,r);if(m){i.duplicateOf={sessionKey:u.sessionKey,title:u.title,
because:m};break}}}gs(n,t,r)}var nn=3,Dt=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function gs(e,t,n=fo){
for(let r of e){let s=[],i=new Set;for(let d of e){let u=d.sessionKey;if(u===r.sessionKey||i.has(u)||t.split.includes(pe(
r,d)))continue;let m=st(r,d,n);m&&(i.add(u),s.push({sessionKey:u,title:d.title,because:m}))}s.length!==0&&(s.sort((d,u)=>Dt.
indexOf(d.because)-Dt.indexOf(u.because)),r.relatedSessions=s.slice(0,nn),s.length>nn&&(r.relatedMore=s.length-nn))}}var ms=3e4;
function bo(e,t,n=Date.now()){return Object.keys(t).length===0?e:e.map(r=>{let s=t[r.id];return!s||n-s>ms||r.state==="ru\
nning"?r:{...r,state:"running",moving:!0,instructed:!0}})}function Ae(e,t=Date.now()){let n=[],r=(i,d,u=1)=>{n.push({signal:i,
weight:as[i]*u,values:d})};e.approvalKind==="subagent"?r("subagent_gate"):e.approvalKind==="tool"&&r("approval_owed"),e.
action==="reply"&&r("input_requested"),e.unverified&&r("unverified_completion"),e.loopRepeats&&r("error_loop",{repeats:String(
e.loopRepeats)}),e.runFailed&&r("run_failed"),e.stalledFor&&r("stalled",{duration:ot(e.stalledFor)}),e.changeBlocked&&r(
"change_blocked"),e.unattendedGoals&&r("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&r("queued_behin\
d",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let s=ls(e,t);return s>0&&r("waiting_a_while",{hours:String(
s)},Math.min(s,is)),n.sort((i,d)=>d.weight-i.weight),{score:n.reduce((i,d)=>i+d.weight,0),signals:n}}var fs={approval_owed:"\
unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"\
unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function Ot(e,t=Date.now()){if(e.state!=="n\
eeds-you")return null;for(let n of Ae(e,t).signals){let r=fs[n.signal];if(r)return r}return null}var vo=14400*1e3;function yo(e,t,n,r=Date.
now()){let s=0,i=[];for(let d of e){if(d.state!=="needs-you"){i.push(d);continue}let u=t[d.id];if(u&&u>r){s+=1;continue}
let m=n[d.id];if(m!==void 0&&d.updatedAt<=m){i.push({...d,state:"done",issue:!1});continue}i.push(d)}return{items:i,snoozedCount:s}}
var ws=4320*60*1e3;function ko(e,t=Date.now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=ws}var hs={"ne\
eds-you":1,running:-1,done:-1};function bs(e,t,n){let r=e.updatedAt>0,s=t.updatedAt>0;return!r&&!s?0:r?s?(e.updatedAt-t.
updatedAt)*n:-1:1}function at(e,t){let n=e.signals.slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(s=>t(
`rank_${s.signal}`,s.values)).join(t("rank_join"))}function xo(e,t=Date.now()){let n=new Map(e.map(r=>[r.id,Ae(r,t)]));return[
...e].sort((r,s)=>{let i=qn[r.state]-qn[s.state];if(i!==0)return i;if(r.state==="needs-you"){let d=(n.get(s.id)?.score??
0)-(n.get(r.id)?.score??0);if(d!==0)return d}else if(r.issue!==s.issue)return r.issue?-1:1;return bs(r,s,hs[r.state])})}
function _o(e,t,n={},r={},s={},i=kt,d=Date.now()){let u=new Map,m=new Map;for(let l of e.slots){if(!l.key||go.has(l.key)||
l.memory_mode==="incognito")continue;let p=ss(l,n[l.key],t);if(p.length>0){for(let S of p)u.set(S.id,S);let N=p.find(S=>S.
state==="needs-you")??p[0];m.set(l.key,N);continue}let b=Vr(l,t);u.set(b.id,b),m.set(l.key,b)}for(let[l,p]of Object.entries(
r)){let b=m.get(l);b&&(b.state="needs-you",b.issue=!0,b.stalledFor=p.silent_secs,b.summary=p.reason?t("stalled_because",
{reason:p.reason,duration:ot(p.silent_secs)}):t("stalled_for",{duration:ot(p.silent_secs)}),b.action="open")}for(let[l,p]of Object.
entries(s)){let b=m.get(l);b&&(b.state="needs-you",b.issue=!0,b.loopRepeats=p.repeats,b.summary=t("error_loop",{tool:p.tool,
repeats:String(p.repeats)}),b.action="open")}for(let l of e.approvals){let p=l.slot?m.get(l.slot):void 0;if(p){Yr(p,l,t);
continue}u.set(`approval:${l.id}`,{id:`approval:${l.id}`,title:Oe(l.tool||l.source,t("approval_needed")),summary:l.tool_purpose||
t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:F(l.ts),provenance:t("approval"),action:"review-approval",approvalKind:po(
l)?"subagent":"tool",permissionId:l.id,permissionTool:l.tool||l.source,permissionPurpose:l.tool_purpose,permissionInput:l.
tool_input,references:[{kind:"approval",id:l.id,label:l.tool||l.source||t("approval")}]})}for(let l of e.agents){let p=l.
parent?m.get(l.parent):void 0;if(p){Jr(p,l,t);continue}let b=!!(l.done&&(l.error||l.outcome==="failed"));l.parent&&!b||u.
set(`agent:${l.id}`,{id:`agent:${l.id}`,title:Oe(l.task||l.agent,t("agent_work")),summary:b?l.error?.trim()||t("agent_fa\
iled",{task:l.task}):l.done?t("agent_done"):t("work_in_progress"),state:b?"needs-you":l.done?"done":"running",issue:b,runFailed:b||
void 0,retryPath:b&&!l.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(l.id)}/retry`:void 0,updatedAt:F(l.started),
provenance:l.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:l.id,label:l.agent||t("agent")}]})}for(let l of e.
workflows){let p=l.session_key?m.get(l.session_key):void 0;if(p){Qr(p,l,t);continue}let b=l.status==="failed";u.set(`wor\
kflow:${l.run_id}`,{id:`workflow:${l.run_id}`,title:Oe(l.name,l.run_id),summary:b?t("workflow_failed_generic"):l.status===
"running"?t("workflow_running"):t("workflow_finished"),state:b?"needs-you":l.status==="running"?"running":"done",issue:b,
runFailed:b||void 0,retryPath:b?`/api/workflows/runs/${encodeURIComponent(l.run_id)}/rerun`:void 0,updatedAt:0,provenance:t(
"workflow"),action:"discuss",references:[{kind:"workflow",id:l.run_id,label:l.name||l.run_id}]})}for(let l of e.crons){if(!l.
is_running&&l.last_status!=="error")continue;let p=l.last_status==="error",b=Dr(l,d),N=t(p?"monitor_failed":"monitor_run\
ning");u.set(`monitor:${l.id}`,{id:`monitor:${l.id}`,title:l.name,summary:b?`${N} ${t("monitor_next_check",{duration:b})}`:
N,state:p?"needs-you":"running",issue:p,runFailed:p||void 0,retryPath:p?`/api/crons/${encodeURIComponent(l.id)}/run`:void 0,
updatedAt:F(l.running_since||l.last_run_ts||l.created_ts),provenance:t("monitor"),action:p?"discuss":void 0,references:[
{kind:"monitor",id:l.id,label:l.name}]})}for(let l of e.loops||[]){if(!l.active)continue;let p=String(l.id||"");if(!p)continue;
let b=Math.max(0,Number(l.cycle_count)||0),N=Math.max(0,Number(l.max_cycles)||0),S=l.slot_key&&m.has(l.slot_key)?l.slot_key:
void 0;u.set(`loop:${p}`,{id:`loop:${p}`,title:Oe(l.message||"",t("loop")),summary:N?t("loop_watching_capped",{cycles:String(
b),cap:String(N)}):t("loop_watching",{cycles:String(b)}),state:"running",issue:!1,updatedAt:F(l.last_fire_ts||l.created_ts),
sessionKey:S,parentId:S?m.get(S)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(p)}`,action:S?
"open":void 0,references:[{kind:"monitor",id:p,label:t("loop"),sessionKey:S},...S?[{kind:"session",id:S,label:m.get(S)?.
title||S,sessionKey:S}]:[]]})}let f=[...e.artifacts].sort((l,p)=>F(p.updated_at)-F(l.updated_at)).slice(0,8);for(let l of f){
let p=l.session_key&&m.has(l.session_key)?l.session_key:void 0;u.set(`artifact:${l.slug}`,{id:`artifact:${l.slug}`,title:Oe(
l.name,t("artifact")),summary:l.description||t("artifact_ready",{kind:l.kind}),state:"done",issue:!1,updatedAt:F(l.updated_at||
l.created_at),sessionKey:p,parentId:p?m.get(p)?.id:void 0,provenance:l.session_title||l.source||t("artifact"),action:p?"\
open":void 0,references:[{kind:"artifact",id:l.slug,label:l.name,sessionKey:p},...p?[{kind:"session",id:p,label:l.session_title||
p,sessionKey:p}]:[]]})}let k=[...u.values()];return ps(k,i),xo(k)}function gn(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function So(e){let t=[],n=new Map;for(let r of e){let s=r.sessionKey;if(!s)continue;let i=n.get(s);if(i){i.count+=1;continue}
let d=r.references.find(m=>m.kind==="session")?.label??r.provenance,u={sessionKey:s,label:d,leading:r,count:1};n.set(s,u),
t.push(u)}return t}function mn(e,t,n=kt,r){if(t==="pr")return vs(e);if(t==="goal")return sn(e,n,r);let s=[],i=new Map;for(let d of e){
let u=d.sessionKey;if(!u){s.push({key:d.id,items:[d],header:null,sessionKey:null,changeRef:null});continue}let m=i.get(u);
if(m){m.items.push(d);continue}let f={key:u,items:[d],header:"session",sessionKey:d.sessionKey??null,changeRef:null};i.set(
u,f),s.push(f)}return s}function vs(e){let t=[],n=new Map;for(let r of e){let s=r.references.filter(i=>i.kind==="change"||
i.kind==="issue");for(let i of s){let d=`${i.kind}:${i.id}`,u=n.get(d);if(u){u.items.push(r);continue}let m={key:d,items:[
r],header:"pr",sessionKey:null,changeRef:i};n.set(d,m),t.push(m)}}return t}var No=["same_change","same_artifact","same_d\
eliverable"];function sn(e,t,n){let r=wo(e),s=e.map((f,k)=>k),i=f=>{for(;s[f]!==f;)s[f]=s[s[f]],f=s[f];return f},d=(f,k)=>{
s[i(k)]=i(f)};for(let f=0;f<e.length;f+=1)for(let k=f+1;k<e.length;k+=1){let l=e[f],p=e[k],b=pe(l,p);if(t.split.includes(
b))continue;if(ho(l,p)){d(f,k);continue}if(t.merged.includes(b)){d(f,k);continue}if(n?.has(b)){d(f,k);continue}if(!l.sessionKey||
!p.sessionKey||l.sessionKey===p.sessionKey)continue;let N=st(l,p,r);N&&No.includes(N)&&d(f,k)}let u=[],m=new Map;for(let f=0;f<
e.length;f+=1){let k=i(f),l=m.get(k);if(l){l.items.push(e[f]),l.header="goal";continue}let p={key:`goal:${e[f].id}`,items:[
e[f]],header:null,sessionKey:null,changeRef:null};m.set(k,p),u.push(p)}for(let f of u)f.key=ys(f.items);return u}function ys(e){
return`goal:${[...e.map(t=>t.id)].sort()[0]}`}var ks=.5;function xs(e,t){let n=new Set,r=new Set,s=[...e].sort((i,d)=>d.
items.length-i.items.length);for(let i of s){let d=new Set(i.items.map(Tt)),u=null;for(let m of t){if(n.has(m.key))continue;
let f=m.members.filter(l=>d.has(l)).length;if(!f)continue;let k=f/Math.min(d.size,m.members.length);k<ks||(!u||k>u.score)&&
(u={key:m.key,score:k})}if(u&&(n.add(u.key),i.key=u.key),r.has(i.key)){let m=2;for(;r.has(`${i.key}~${m}`);)m+=1;i.key=`${i.
key}~${m}`}r.add(i.key)}return e}function Ro(e){return e.map(t=>({key:t.key,members:t.items.map(Tt)}))}function an(e,t){
let n=t.split(" ").map(r=>`${_s(r)}s?`).join("[\\s/_,-]+");return e.match(new RegExp(n,"iu"))?.[0]??null}function _s(e){
return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Io(e,t=kt,n){if(e.length<2)return null;let r=null,s=null,i=null;
for(let d=0;d<e.length;d+=1)for(let u=d+1;u<e.length;u+=1){let m=e[d],f=e[u];if(ho(m,f))return`${f.parentId===m.id?f.title:
m.title} was started by this work`;if(t.merged.includes(pe(m,f)))return"you merged these";i??=n?.get(pe(m,f))??null;let k=st(
m,f);if(!(!k||!No.includes(k))&&(!r||Dt.indexOf(k)<Dt.indexOf(r))&&(r=k,k==="same_deliverable")){let l=rt(f.title),p=rt(
m.title).find(b=>l.includes(b))??null;s=p?an(m.title,p)??an(f.title,p)??p:null}}return r==="same_change"?"these sessions\
 work on the same change":r==="same_artifact"?"these sessions share the same output":r==="same_deliverable"?s?`both are \
about ${s}`:"both name the same deliverable":i}var Ss=12;function Co(e){if(e.length<2)return null;let t=new Map;for(let m of e)
for(let f of rt(m.title))t.set(f,(t.get(f)??0)+1);let n=Zn(t);if(n)return eo(e,n)??n;let r=new Map;for(let m of e)for(let f of m.
references){if(f.kind!=="change"&&f.kind!=="issue")continue;let k=r.get(f.id);r.set(f.id,{label:f.label,members:(k?.members??
0)+1})}let s=[...r.values()].filter(m=>m.members>=2).sort((m,f)=>f.members-m.members)[0];if(s)return s.label;let i=new Map;
e.forEach((m,f)=>{for(let k of Ns(m.title))i.has(k)||i.set(k,new Set),i.get(k).add(f)});let d=new Map;for(let[m,f]of i)d.
set(m,f.size);let u=Zn(d);return u?eo(e,u)??u:null}function Zn(e){return[...e.entries()].filter(([,t])=>t>=2).sort((t,n)=>n[1]-
t[1]||n[0].length-t[0].length)[0]?.[0]??null}function eo(e,t){let n=null;for(let r of e){let s=an(r.title,t);if(s){if(/^\p{Lu}/u.
test(s))return s;n??=s}}return n}function Ns(e){let t=e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(
Boolean),n=[];for(let r=Math.min(t.length,Ss);r>=2;r-=1)for(let s=0;s+r<=t.length;s+=1){let i=t.slice(s,s+r);Ge.has(i[0])||
Ge.has(i[r-1])||i[0].length<2||i[r-1].length<2||n.push(i.join(" "))}return n}function Ao(e,t){let n=e.references.find(r=>r.
kind==="session")?.label??"";for(let r of[e.title,n,e.provenance]){let s=ln(r,t);if(s)return s}return null}function ln(e,t){
let n=e.toLowerCase(),r=null;for(let s of t)for(let i of s.aliases)!i||!n.includes(i.toLowerCase())||(!r||i.length>r.length)&&
(r={name:s.name,length:i.length});return r?.name??null}function Wo(e,t){let n=e.references.find(d=>d.kind==="session")?.
label??"";if(!n)return null;let r=ln(e.title,t);if(!r)return null;let s=t.find(d=>d.name===r);if(s&&s.aliases.some(d=>d&&
n.toLowerCase().includes(d.toLowerCase())))return null;let i=ln(n,t);return!i||i===r?null:{itemGoal:r,sessionGoal:i}}function Po(e,t){
let n=t.flatMap(i=>i.aliases.map(d=>d.toLowerCase())),r=new Set(["workspace","workspaces","home","src","tmp","documents",
"desktop"]),s=new Map;for(let i of e){if(!i.key||go.has(i.key)||i.memory_mode==="incognito")continue;let d=i.project;if(!d)
continue;let u=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!u||r.has(u.toLowerCase())||n.some(m=>u.toLowerCase().
includes(m)||m.includes(u.toLowerCase()))||s.set(u,(s.get(u)??0)+1)}return[...s.entries()].map(([i,d])=>({name:i,sessions:d})).
sort((i,d)=>d.sessions-i.sessions)}function Eo(e,t){let n=new Map;for(let i of e){if(!i.sessionKey||Ao(i,t)!==null)continue;
let d=i.references.find(u=>u.kind==="session")?.label??"";for(let u of[i.title,d]){let m=u.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean);for(let f of[3,2])for(let k=0;k+f<=m.length;k+=1){let l=m.slice(k,k+f);if(Ge.has(l[0])||
Ge.has(l[f-1])||l[0].length<3||l[f-1].length<3)continue;let p=l.join(" ");n.has(p)||n.set(p,new Set),n.get(p).add(i.sessionKey)}}}
let r=[...n.entries()].map(([i,d])=>({phrase:i,sessions:d.size})).filter(i=>i.sessions>=2);return r.filter(i=>!r.some(d=>d.
phrase!==i.phrase&&d.phrase.includes(i.phrase)&&d.sessions>=i.sessions)).sort((i,d)=>d.sessions-i.sessions||d.phrase.length-
i.phrase.length).map(i=>({name:i.phrase.replace(/\p{L}+/gu,d=>d[0].toUpperCase()+d.slice(1)),sessions:i.sessions}))}function to(e){
return e.some(t=>t.state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function Bo(e,t=Date.
now()){return e.issue?"crit":e.state==="needs-you"?Ot(e,t)==="followup"?"idle":"warn":"good"}function it(e){let t=new Set,n=new Set,r=new Set,s=0,i=0,d=0,u=0,m=0;for(let f of e){f.sessionKey&&t.add(f.sessionKey);for(let k of f.
references)k.kind==="change"?n.add(k.id):k.kind==="issue"&&r.add(k.id);f.id.startsWith("workflow:")?s+=1:f.id.startsWith(
"monitor:")?i+=1:f.id.startsWith("agent:")&&(d+=1),f.state==="needs-you"&&(u+=1),f.updatedAt>m&&(m=f.updatedAt)}return{sessions:t.
size,prs:n.size,issues:r.size,loops:s,crons:i,agents:d,needsYou:u,lastActivityAt:m}}function Mo(e){let t=e.find(r=>r.moving);
if(t)return t;let n=e.find(r=>r.state==="running");return n||[...e].sort((r,s)=>(s.updatedAt||0)-(r.updatedAt||0))[0]}function Rs(e){
let t=[],n=new Set;for(let r of e){let s=r.sessionKey;!s||n.has(s)||(n.add(s),t.push(r.references.find(i=>i.kind==="sess\
ion")?.label??r.provenance))}return t}function Ko(e,t,n=kt,r=[],s){let i=new Map,d=[],u=new Map;for(let p of e){let b=Ao(
p,t);if(u.set(p.id,b),b===null){d.push(p);continue}i.has(b)||i.set(b,[]),i.get(b).push(p)}let m=xs(sn(d,n,s),r),f=new Map;
for(let p of m)f.set(p.items[0].id,p);let k=[],l=new Set;for(let p of e){let b=u.get(p.id)??null;if(b!==null){if(l.has(b))
continue;l.add(b);let S=i.get(b);k.push({key:`initiative:${b}`,name:b,status:to(S),sessions:Rs(S),blocks:sn(S,n,s)});continue}
let N=f.get(p.id);N&&k.push({key:N.key,name:null,status:to(N.items),sessions:[],blocks:[N]})}return k}function fn(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Lo(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,r)=>$o(r)-$o(n)).slice(0,12)}function $o(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function To(e,t){
let n={},r="unknown";for(let s of e)try{let i=await t(`/api/chat/slots/${encodeURIComponent(s.key)}/summary`);if(!i||typeof i!=
"object"){r="unsupported";break}if(i.enabled===!1){r="disabled";break}n[s.key]=i,r="available"}catch{r="unsupported";break}
return{summaries:n,support:r}}var Do=String.raw`
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
  .ow-conductor-header { padding: 10px 16px; border-bottom: 1px solid var(--border); }
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
`;import{Fragment as Pe,jsx as a,jsxs as w}from"react/jsx-runtime";var xt=["work","prs","loops","schedule"],qo=["prs","loo\
ps","schedule","work"],dr={work:"Goals / Sessions",prs:"PRs",loops:"Loops",schedule:"Scheduled tasks"};function zt({id:e,
onPromote:t}){return a(G,{className:"ow-promote","aria-label":`Move ${dr[e]} to the first column`,onClick:n=>{n.preventDefault(),
n.stopPropagation(),t(e)},children:"Make primary"})}function Gt({lastUpdated:e,refreshing:t,onRefresh:n}){let r=e?Ut(e):
null;return w("span",{className:"ow-refreshbar",children:[r&&w("span",{className:"ow-updated","aria-live":"polite",children:[
"updated ",r]}),a(G,{className:"ow-refresh",onClick:s=>{s.preventDefault(),s.stopPropagation(),n()},disabled:t,"aria-lab\
el":"Refresh",title:"Refresh",children:a(As,{className:`ow-icon${t?" ow-spin":""}`,"aria-hidden":"true"})})]})}var wn="c\
rew-manager.snoozed",Fo="crew-manager.handled",jo="crew-manager.done-collapsed",hn="crew-manager.goal-verdicts",Uo="crew\
-manager.goal-memory",cr="crew-manager.goal-semantic.v5",bn="crew-manager.goal-names.v2",Os=.7;function Ho(e){return j(cr,
{pairs:[...e.pairs],why:[...e.why.entries()],stamp:e.stamp}),e}var Vo="crew-manager.initiative-collapsed",vn="crew-manag\
er.stack-open-v2",Yo="crew-manager.tab",yn="crew-manager.primary-v1";function re(e,t={}){try{let n=localStorage.getItem(
e);return n?JSON.parse(n):t}catch{return t}}function j(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Ut(e,t=Date.
now()){if(!e)return null;let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let r=Math.round(n/60);if(r<60)
return`${r}m ago`;let s=Math.round(r/60);return s<24?`${s}h ago`:`${Math.round(s/24)}d ago`}function Jo(e){return e?new Date(
e).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}function lt(e,t,n){return e<=0?null:`${e} ${e===1?t:n}`}function qt(e,t=Date.
now(),n=!1){let r=it(e),s=[n?null:lt(r.sessions,"session","sessions"),lt(r.prs,"PR","PRs"),lt(r.issues,"issue","issues"),
lt(r.loops,"loop","loops"),lt(r.crons,"cron","crons"),lt(r.agents,"agent","agents")].filter(d=>!!d),i=Ut(r.lastActivityAt,
t);return i&&s.push(`last active ${i}`),s.join(" \xB7 ")}var dt="crew-manager-conductor",zs=5e3,Gs={session:"Session",approval:"\
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
 row",untitled_work:"Untitled work"};function be(e,t={}){return Gs[e].replace(/\{\{(\w+)\}\}/g,(n,r)=>t[r]??"")}var qs={
followup:"Follow up",unblock:"Unblock"},xe={"needs-you":"Needs you",running:"Running",done:"Done"},kn={all:"All","needs-\
you":"Needs you",running:"Running",done:"Done"},Qo={all:"All",failing:"Failing",running:"Running",merged:"Merged"},Fs={session:Rn,
approval:rr,agent:Is,workflow:Bs,monitor:lr,artifact:Cs,change:Nn,issue:Es};function We({children:e,onActivate:t,...n}){
return a("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),
t())},children:e})}function Xo({label:e,count:t,subtitle:n}){return w("div",{className:"ow-section-header",children:[w("\
div",{className:"ow-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow\
-section-count",children:t})]}),n&&a("p",{className:"ow-section-subtitle",children:n})]})}function js(e){if(e.state==="n\
eeds-you"){let t=Ot(e);return t?a(ee,{variant:"warn",className:"ow-verb",children:qs[t]}):null}return e.state==="running"?
e.moving?w(ee,{variant:"aim",children:[a(ir,{className:"ow-icon"}),xe[e.state]]}):a(ee,{variant:"muted",children:"Queued"}):
w(ee,{variant:"ok",children:[a(ar,{className:"ow-icon"}),xe[e.state]]})}function Us({tool:e,purpose:t,busy:n,onAnswer:r,where:s}){return w("div",{className:"ow-permission",children:[w("div",{className:"\
ow-permission-body",children:[w("div",{className:"ow-permission-head",children:[a(Ws,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),w("p",{className:"ow-permi\
ssion-what",children:[s&&w("span",{className:"ow-truncate",children:[s," "]}),s?"wants to run ":"Wants to run ",a("code",
{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),w("div",{className:"ow-permission-actions",children:[
a(G,{onClick:()=>r(!0),disabled:n,children:"Approve"}),a(G,{onClick:()=>r(!1),disabled:n,children:"Reject"})]})]})}function _t({
children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"ow-expand-inner",children:e})})}var xn=3;
function Zo(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function Hs({
item:e,busy:t,onDecide:n}){let[r,s]=_(!1),i=e.permissionInput||"",d=i.trim().split(/\s+/)[0]||e.permissionTool||"";return w(
"div",{className:"ow-formal-approval",role:"presentation",onClick:u=>u.stopPropagation(),onKeyDown:u=>u.stopPropagation(),
children:[a("div",{className:"ow-formal-badge",children:"Waiting for approval"}),w("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&w("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),w("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("span",{className:"ow-formal-val ow-formal-mon\
o",children:i||"(no input details)"})]})]}),w("div",{className:"ow-formal-actions",children:[a(G,{disabled:t,onClick:()=>n(
"approved"),children:"Allow once"}),w("span",{className:"ow-trust-wrap",children:[w(G,{disabled:t,onClick:()=>s(u=>!u),"\
aria-expanded":r,children:["Trust ",a(de,{className:"ow-icon ow-trust-caret","data-open":r?"true":void 0,"aria-hidden":"\
true"})]}),r&&w("span",{className:"ow-trust-menu",role:"menu",children:[i&&a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{s(!1),n("trust_command")},children:"Trust this exact command"}),d&&w("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{s(!1),n("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{s(!1),
n("trust")},children:"Trust everything in this session"})]})]}),a(G,{className:"ow-formal-reject",disabled:t,onClick:()=>n(
"rejected"),children:"Reject"})]})]})}function Vs({candidates:e,prominent:t,busy:n,onAdd:r}){let[s,i]=_(""),d=t?e:e.filter(
u=>u.sessions>=2);return w("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{className:"\
ow-bootstrap-head",children:t?"No big goals defined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&a(
"div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, or name\
 your own."}),d.length>0&&a("div",{className:"ow-bootstrap-chips",children:d.slice(0,4).map(u=>w("button",{type:"button",
className:"ow-bootstrap-chip",disabled:n,onClick:()=>r(u.name,[u.name]),children:[u.name," ",w("span",{className:"ow-boo\
tstrap-count",children:[u.sessions," session",u.sessions===1?"":"s"]})]},u.name))}),w("div",{className:"ow-bootstrap-cus\
tom",children:[a(Ts,{value:s,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:u=>i(u.target.
value),onKeyDown:u=>{u.key==="Enter"&&s.trim()&&(r(s),i(""))}}),a(G,{disabled:n||!s.trim(),onClick:()=>{r(s),i("")},children:"\
Add goal"})]})]})}function er({members:e}){let t=e[0],n=new Set(e.map(u=>u.sessionKey).filter(Boolean)).size,r=e.filter(
u=>u.state==="needs-you").length,s=e.filter(u=>u.state==="running").length,i=e.filter(u=>u.state==="done").length,d=[`${n}\
 session${n===1?"":"s"}`];return r&&d.push(`${r} need${r===1?"s":""} you`),s&&d.push(`${s} running`),i&&d.push(`${i} don\
e`),w("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),a("d\
iv",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}function _n({open:e,onToggle:t,label:n,flag:r,flagWarn:s,
meta:i,why:d,header:u,action:m,children:f}){return w("div",{className:"ow-block ow-goalcard","data-grouped":"true","data\
-open":e?"true":void 0,children:[w("div",{className:"ow-goalcard-summary",children:[t&&a("button",{type:"button",className:"\
ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":"Expand"} ${n??"goal"}`,onClick:t,children:a(de,{className:"\
ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-hidden":"true"})}),u,m,a("span",{className:`ow-goal-flag${s?"\
 ow-goal-flag-warn":""}`,children:r})]}),a("div",{className:"ow-goal-meta",children:i}),d&&w("div",{className:"ow-goal-w\
hy",children:["Grouped because ",d,"."]}),f]})}function Ys({block:e,status:t,folded:n,onToggle:r,onSplit:s,selected:i,onSelect:d}){
let u=e.items[0],m=new Set(e.items.map(l=>l.sessionKey).filter(Boolean)).size,f=[];for(let l=0;l<e.items.length;l+=1)for(let p=l+
1;p<e.items.length;p+=1)e.items[l].sessionKey!==e.items[p].sessionKey&&f.push(pe(e.items[l],e.items[p]));let k=w(Pe,{children:[
r&&a("button",{type:"button",className:"ow-goal-fold","aria-label":n?`Expand ${u.title}`:`Collapse ${u.title}`,"aria-exp\
anded":!n,onClick:l=>{l.stopPropagation(),r()},children:a(de,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"\
true","aria-hidden":"true"})}),a(Ft,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-bloc\
k-name",children:u.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:xe[t]}),w("span",{className:"\
ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),w("span",{className:"ow-truncate",children:[
m," sessions, one goal"]})]}),s&&a(G,{className:"ow-block-open ow-goal-split",title:"Not the same goal \u2014 split into sepa\
rate cards","aria-label":`Split ${u.title}`,onClick:l=>{l.stopPropagation(),s(f)},children:"Split"})]});return d?a(We,{onActivate:d,
className:"ow-block-tab ow-goal-tab","aria-pressed":i,"data-selected":i?"true":void 0,children:k}):a("div",{className:"o\
w-block-tab",children:k})}var Js=.3;function tr({item:e,items:t,onMerge:n}){let r=t.filter(s=>s.id!==e.id&&s.sessionKey&&
e.sessionKey&&s.sessionKey!==e.sessionKey).map(s=>({other:s,score:st(e,s)?1:Lt(e.title,s.title)})).filter(s=>s.score>=Js).
sort((s,i)=>i.score-s.score).slice(0,2);return r.length===0?null:w("div",{className:"ow-merge-hint",children:[a("span",{
className:"ow-merge-hint-label",children:"Same goal?"}),r.map(({other:s})=>w("button",{type:"button",className:"ow-merge\
-hint-btn ow-truncate",onClick:()=>n(pe(e,s)),children:["Merge with \u201C",s.title,"\u201D"]},s.id))]})}function Qs({item:e,
items:t,folded:n,onToggle:r,onOpen:s}){let d=e.references.find(l=>l.kind==="session")?.label??e.provenance,u=it(t),m=u.needsYou>
0?"needs-you":t.some(l=>l.state==="running")?"running":"done",f=u.needsYou>0?n?`${u.needsYou} need you`:null:xe[m],k=qt(
t,Date.now(),!0);return w(Pe,{children:[w("div",{className:"ow-goalcard-summary",children:[r&&a("button",{type:"button",
className:"ow-goalcard-chevron","aria-expanded":!n,"aria-label":`${n?"Expand":"Collapse"} ${d}`,onClick:r,children:a(de,
{className:"ow-icon ow-init-chevron","data-open":n?void 0:"true","aria-hidden":"true"})}),w("span",{className:"ow-goalca\
rd-header ow-goalcard-static",children:[a(Rn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncat\
e ow-block-name ow-goalcard-title",children:d})]}),a(G,{className:"ow-block-open",onClick:s,"aria-label":`Open ${d}`,children:"\
Open"}),f&&a("span",{className:`ow-goal-flag${u.needsYou>0?" ow-goal-flag-warn":""}`,children:f})]}),k&&a("div",{className:"\
ow-goal-meta",children:k})]})}function Xs(e){let t=(e.checks??[]).filter(r=>r.bucket!=="skipped"),n=e.comments??[];return{
available:!0,total:t.length,passing:t.filter(r=>r.bucket==="passed").length,failing:t.filter(r=>r.bucket==="failed").length,
pending:t.filter(r=>r.bucket==="pending").length,title:e.title,state:e.state?e.state.toUpperCase():void 0,is_draft:!!e.draft,
head:e.headBranch,base:e.baseBranch,author:e.author,updated_at:e.updatedAt,additions:e.additions,deletions:e.deletions,changed_files:e.
changedFiles,merge_state:e.mergeStateStatus?e.mergeStateStatus.toLowerCase():void 0,mergeable:e.mergeable?e.mergeable.toLowerCase():
void 0,auto_merge:!!e.autoMerge,review:so(n),unresolved:ao(n)}}function In(e,t){let n=t?.updated_at?Date.parse(t.updated_at):
0;return{status:e.status,state:t?.state,isDraft:t?.is_draft,mergeState:t?.merge_state,mergeable:t?.mergeable,autoMerge:t?.
auto_merge,base:t?.base,available:t?.available,total:t?.total,passing:t?.passing,failing:t?.failing,pending:t?.pending,unresolved:t?.
unresolved,review:t?.review,updatedAt:n||void 0}}function Zs({reference:e,checks:t,folded:n,onToggle:r}){let s=t?.title||
e.label,i=io(e.url),d=t?.updated_at?Date.parse(t.updated_at):0,u=In(e,t),m=yt(u),f=ro(u),k=d?Ut(d):null,l=w(Pe,{children:[
w("div",{className:"ow-pr-idline",children:[r&&a(de,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"true","ar\
ia-hidden":"true"}),i&&a("span",{className:"ow-pr-repo ow-truncate",children:i}),a("span",{className:"ow-pr-number",children:e.
label.replace(/^github\s*/,"")}),t?.author&&a("span",{children:t.author}),k&&a("span",{className:"ow-pr-when",children:k})]}),
a("div",{className:"ow-pr-title-line",children:a("span",{className:"ow-block-name",children:s})})]});return w("div",{className:"\
ow-pr-head",children:[w("div",{className:"ow-pr-head-row",children:[r?a(We,{onActivate:r,className:"ow-pr-head-click","a\
ria-expanded":!n,children:l}):a("div",{className:"ow-pr-head-click",children:l}),a("span",{className:"ow-pr-verdict","da\
ta-tone":no[m],children:cn[m]}),e.url&&a("a",{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noo\
pener noreferrer","aria-label":`Open ${e.label}`,onClick:p=>p.stopPropagation(),children:a(Nn,{className:"ow-icon","aria\
-hidden":"true"})})]}),f.length>0&&a("div",{className:"ow-pr-status-line",children:f.join(" \xB7 ")})]})}function ea({reference:e,
onOpenSession:t}){let n=Fs[e.kind],r=w(Pe,{children:[a(n,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.
label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noref\
errer",onClick:s=>s.stopPropagation(),children:r}):e.sessionKey?a(We,{className:"ow-reference ow-reference-link",onActivate:()=>t(
e.sessionKey),children:r}):a("span",{className:"ow-reference",children:r})}function Sn({item:e,selected:t,continuation:n,
whyRanked:r,onSelect:s,onOpenSession:i,onAnswerPermission:d,permissionBusy:u,onRetry:m,retryBusy:f,onStop:k,stopBusy:l,onPickStep:p,
onSnooze:b,onHandled:N,hideBadge:S,compact:M,headless:$,dot:E,simple:O,onDecideApproval:te,sessionMismatch:L,onFixSessionName:Y}){
let[W,_e]=_(!1);return w(We,{onActivate:s,className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?
"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.id}`,children:[w("div",{className:"ow-row\
-layout",children:[w("div",{className:"ow-row-content",children:[!$&&w("div",{className:"ow-row-heading",children:[E&&a(
"span",{className:`ow-dot ow-dot-${E}`,"aria-hidden":"true"}),!O&&(S?e.state==="done"&&a(sr,{className:"ow-icon ow-row-c\
heck","aria-hidden":"true"}):js(e)),a("span",{className:"ow-row-title",children:e.title})]}),(!M&&!O||t)&&e.summary&&!(e.
nextSteps??[]).some(I=>I.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&
(!O||t)&&w(We,{className:"ow-row-duplicate",onActivate:()=>i(e.duplicateOf.sessionKey),children:[a(Ft,{className:"ow-ico\
n","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:be(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.
title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&a(_t,{children:w("div",{className:"ow-related",children:[
a("span",{className:"ow-related-label",children:be("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.
map(I=>w(We,{className:"ow-related-row",onActivate:()=>i(I.sessionKey),children:[a(Ft,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-truncate",children:I.title}),a("span",{className:"ow-related-why",children:be(`related_${I.
because}`)})]},I.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:be("related_more",{count:String(
e.relatedMore)})}):null]})}),r&&(!O||t)&&a("div",{className:"ow-row-why",children:r}),!n&&(!O||t)&&w("div",{className:"o\
w-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),Zo(e).length>0&&a("span",{"aria-hidden":"\
true",children:"\xB7"}),a("span",{className:"ow-references",children:Zo(e).slice(0,3).map(I=>a(ea,{reference:I,onOpenSession:i},
`${I.kind}:${I.id}`))})]}),L&&Y&&w("div",{className:"ow-row-mismatch",children:[w("span",{className:"ow-truncate",children:[
"This session's name only mentions ",L.sessionGoal," \u2014 this is ",L.itemGoal," work"]}),a("button",{type:"button",className:"\
ow-mismatch-fix",onClick:I=>{I.stopPropagation(),Y()},children:"Rename session to cover both"})]})]}),a("div",{className:"\
ow-row-actions",children:a(de,{className:"ow-icon","aria-hidden":"true"})})]}),t&&p&&e.nextSteps&&e.nextSteps.length>0&&
a(_t,{children:w("div",{className:"ow-row-steps",children:[a("div",{className:"ow-steps-head",children:"Suggested next s\
teps"}),e.nextSteps.slice(0,W?void 0:xn).map((I,Se)=>a("button",{type:"button",className:"ow-quote-step",title:I.why??I.
what,onClick:ut=>{ut.stopPropagation(),p(I.what)},children:I.what},`${Se}:${I.what}`)),e.nextSteps.length>xn&&a("button",
{type:"button",className:"ow-steps-more",onClick:I=>{I.stopPropagation(),_e(Se=>!Se)},children:W?"Show fewer":`+${e.nextSteps.
length-xn} more`})]})}),t&&e.retryPath&&m&&a(_t,{children:a("div",{className:"ow-retry",children:a(G,{onClick:()=>m(e.retryPath),
disabled:!!f,children:"Retry"})})}),t&&e.stopPath&&k&&a(_t,{children:a("div",{className:"ow-retry",children:a(G,{onClick:()=>k(
e.stopPath),disabled:!!l,children:l?"Stopping\u2026":"Stop this loop"})})}),t&&e.permissionId&&te&&a(_t,{children:a(Hs,{
item:e,busy:!!u,onDecide:I=>te(e,I)})}),e.state==="needs-you"&&b&&N&&w("div",{className:"ow-row-aside",children:[a("butt\
on",{type:"button",className:"ow-aside-btn",onClick:I=>{I.stopPropagation(),b(e.id)},children:"Later"}),a("button",{type:"\
button",className:"ow-aside-btn",onClick:I=>{I.stopPropagation(),N(e.id,e.updatedAt)},children:"Handled"})]})]})}var ta=[
"unblock","followup","running","done"],na={unblock:{label:"Unblock",cls:"ow-lane-unblock"},followup:{label:"Follow up",cls:"\
ow-lane-followup"}};function oa(e){return e.state==="done"?"done":e.state==="running"?"running":Ot(e)??"unblock"}function ra({
items:e,selectedId:t,onSelect:n,onOpenSession:r,onAnswerPermission:s,onDecideApproval:i,permissionBusy:d,onRetry:u,retryBusy:m,
onPickStep:f,onSnooze:k,onHandled:l,doneTitles:p}){let[b,N]=_(!1),S=new Map;for(let M of e){let $=oa(M),E=S.get($);E?E.push(
M):S.set($,[M])}return w(Pe,{children:[ta.filter(M=>S.has(M)).map(M=>{let $=S.get(M),E=M==="unblock"||M==="followup"?na[M]:
null,O=E?$.map(L=>L.action!=="resume"?at(Ae(L),be):""):[],te=E&&O.length>0&&O.every(L=>L&&L===O[0])?O[0]:void 0;return w(
"div",{className:"ow-lane",children:[E&&w("div",{className:"ow-lane-head",children:[a("span",{className:`ow-lane-badge ${E.
cls}`,children:E.label}),te&&a("span",{className:"ow-lane-reason",children:te})]}),$.map(L=>a(Sn,{item:L,hideBadge:!0,compact:!0,
selected:t===L.id,continuation:!0,whyRanked:te?void 0:L.state==="needs-you"&&L.action!=="resume"?at(Ae(L),be):void 0,onSelect:()=>n(
L),onOpenSession:r,onAnswerPermission:s,onDecideApproval:i,permissionBusy:d,onRetry:u,retryBusy:m,onPickStep:f,onSnooze:k,
onHandled:l},L.id))]},M)}),!S.has("done")&&p&&p.length>0&&w("div",{className:"ow-lane ow-lane-done",children:[w("button",
{type:"button",className:"ow-goals-toggle","aria-expanded":b,onClick:()=>N(M=>!M),children:[a(de,{className:"ow-icon","d\
ata-open":b?"true":void 0,"aria-hidden":"true"}),p.length," done"]}),b&&a("ul",{className:"ow-done-list",children:p.map(
M=>w("li",{className:"ow-row-goal-done",children:[a(sr,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"\
ow-truncate",children:M})]},M))})]})]})}function ct({title:e,items:t,selectedId:n,onSelect:r,onOpenSession:s,onAnswerPermission:i,
onDecideApproval:d,permissionBusy:u,onRetry:m,retryBusy:f,onStop:k,stopBusy:l,onPickStep:p,onSnooze:b,onHandled:N,footer:S,
collapsed:M,onToggleCollapsed:$,groupBy:E,prChecks:O,prFilter:te,doneBySession:L,goalVerdicts:Y,onSplitGoal:W,onMergeGoal:_e,
initiativeBlocks:I,initiatives:Se,onRenameSession:ut,semanticWhy:Ht,goalNames:qe,collapsedInitiatives:Ee,onToggleInitiative:ve,
selectedGoalKey:Fe,onSelectGoal:je,subtitle:pt,hideHeader:St,emptyLabel:gt}){let J=mn(t,E,Y),Ne=E==="pr"&&te&&te!=="all"?
J.filter(y=>y.changeRef&&dn(In(y.changeRef,O?.[y.changeRef.url??""]))===te):J,se=I??[],mt=E==="goal"?se.length:E==="pr"?
Ne.length:t.length,ye=y=>{let C=y.changeRef?O?.[y.changeRef.url??""]:void 0,Q=y.header==="pr"?Ee?.[y.key]??!((C?.failing??
0)>0||y.items.some(z=>z.state==="needs-you")):!1,X=y.header==="session"?!!Ee?.[y.key]:!1;return w("div",{className:`ow-b\
lock${y.header==="session"?" ow-goalcard":""}`,"data-grouped":y.header?"true":void 0,"data-open":y.header==="session"&&!X?
"true":void 0,children:[y.header==="session"&&y.sessionKey&&a(Qs,{item:y.items[0],items:y.items,folded:X,onToggle:ve?()=>ve(
y.key,!X):void 0,onOpen:()=>s(y.sessionKey)}),y.header==="pr"&&y.changeRef&&a(Zs,{reference:y.changeRef,checks:C,folded:Q,
onToggle:ve?()=>ve(y.key,!Q):void 0}),y.header==="goal"&&a(Ys,{block:y,onSplit:W,selected:Fe===y.key,onSelect:je?()=>je(
y.key):void 0}),y.header==="pr"?!Q&&a(Pe,{children:w("div",{className:"ow-pr-sessions",children:[a("span",{className:"ow\
-pr-sublabel-inline",children:"Sessions"}),So(y.items).map(z=>w("button",{type:"button",className:"ow-reference ow-refer\
ence-link ow-pr-session-chip",onClick:()=>s(z.sessionKey),children:[a(Rn,{className:"ow-icon","aria-hidden":"true"}),a("\
span",{className:"ow-truncate",children:z.label})]},z.sessionKey))]})}):y.header==="session"?!X&&a(ra,{items:y.items,doneTitles:y.
sessionKey?L?.[y.sessionKey]:void 0,selectedId:n,onSelect:r,onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,
onRetry:m,retryBusy:f,onPickStep:p,onSnooze:b,onHandled:N}):y.items.map(z=>w(Oo,{children:[a(Sn,{item:z,selected:n===z.id,
continuation:y.header==="session",whyRanked:z.state==="needs-you"&&z.action!=="resume"?at(Ae(z),be):void 0,onSelect:()=>r(
z),onOpenSession:s,onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:m,retryBusy:f,onStop:k,stopBusy:l,onPickStep:p,
onSnooze:b,onHandled:N}),E==="goal"&&_e&&n===z.id&&a(tr,{item:z,items:t,onMerge:_e})]},z.id))]},y.key)},Be=y=>{let C=Se&&
ut?Wo(y,Se):null,Q=y.references.find(X=>X.kind==="session")?.label??"";return w(Oo,{children:[a(Sn,{item:y,selected:n===
y.id,dot:Bo(y),simple:!0,sessionMismatch:C??void 0,onFixSessionName:C&&y.sessionKey?()=>ut(y.sessionKey,`${Q} & ${C.itemGoal}`.
slice(0,200)):void 0,whyRanked:y.state==="needs-you"&&y.action!=="resume"?at(Ae(y),be):void 0,onSelect:()=>r(y),onOpenSession:s,
onAnswerPermission:i,onDecideApproval:d,permissionBusy:u,onRetry:m,retryBusy:f,onPickStep:p,onSnooze:b,onHandled:N}),_e&&
n===y.id&&a(tr,{item:y,items:t,onMerge:_e})]},y.id)},Nt=y=>{if(y.name){let q=Ee?.[y.key]??y.status!=="needs-you",ae=y.blocks.
flatMap(Z=>Z.items),ge=it(ae);return a(_n,{open:!q,onToggle:()=>ve?.(y.key,!q),label:y.name,flag:ge.needsYou>0?`${ge.needsYou}\
 need you`:xe[y.status],flagWarn:ge.needsYou>0,meta:qt(ae),header:a("span",{className:"ow-truncate ow-block-name ow-goal\
card-title",children:y.name}),children:q?a(er,{members:ae}):ae.map(Z=>Be(Z))},y.key)}let C=y.blocks[0];if(C.header==="go\
al"){let q=Ee?.[y.key]??y.status!=="needs-you",ae=C.items[0],ge=it(C.items),Z=[];for(let U=0;U<C.items.length;U+=1)for(let Ie=U+
1;Ie<C.items.length;Ie+=1)Z.push(pe(C.items[U],C.items[Ie]));let ft=new Set(C.items.map(U=>U.sessionKey).filter(Boolean)).
size,Ke=qe?.[C.key]??Co(C.items)??(ft>1?`${ft} sessions, one goal`:ae.references.find(U=>U.kind==="session")?.label??ae.
title);return a(_n,{open:!q,onToggle:()=>ve?.(y.key,!q),label:Ke,flag:ge.needsYou>0?`${ge.needsYou} need you`:xe[y.status],
flagWarn:ge.needsYou>0,meta:qt(C.items),why:Io(C.items,Y,Ht),header:a(We,{onActivate:()=>je?.(C.key),className:"ow-goalc\
ard-header ow-goal-tab","aria-pressed":Fe===C.key,"data-selected":Fe===C.key?"true":void 0,children:a("span",{className:"\
ow-truncate ow-block-name ow-goalcard-title",children:Ke})}),action:W&&a(G,{className:"ow-block-open ow-goal-split",title:"\
Not the same goal \u2014 split into separate cards","aria-label":`Split ${ae.title}`,onClick:U=>{U.stopPropagation(),W(Z)},
children:"Split"}),children:q?a(er,{members:C.items}):C.items.map(U=>Be(U))},y.key)}let Q=C.items[0],X=qe?.[`item:${Q.id}`],
z=Q.references.find(q=>q.kind==="session")?.label,Re=X??z;if(!Re||Re===Q.title)return Be(Q);let Me=it(C.items);return a(
_n,{open:!0,label:Re,flag:Me.needsYou>0?`${Me.needsYou} need you`:xe[Q.state],flagWarn:Me.needsYou>0,meta:qt(C.items),header:a(
"span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:Re}),children:Be(Q)},y.key)};return w("section",
{className:"ow-section","aria-label":e,children:[St?null:$?w(We,{onActivate:$,className:"ow-section-toggle",children:[a(
Xo,{label:e,count:mt,subtitle:pt}),a(de,{className:"ow-icon ow-section-chevron","data-open":M?void 0:"true","aria-hidden":"\
true"})]}):a(Xo,{label:e,count:mt,subtitle:pt}),M?null:a("div",{className:"ow-section-list",children:E==="goal"?se.length===
0?a("p",{className:"ow-section-empty",children:gt}):se.map(Nt):Ne.length===0?a("p",{className:"ow-section-empty",children:gt}):
Ne.map(ye)}),S]})}function sa(e,t){let n=mo(t,be);if(!e)return["Crew Manager context: workspace overview.",...n,"Answer \
the user about the state of their work. This is a conversation, not an action channel."].join(`
`);let r=e.references.map(i=>`${i.kind}: ${i.label} (${i.id})`).join(`
`),s=[e.stalledFor?`Silent for ${ot(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(i=>!!i);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,
`State: ${xe[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...s.length>0?[`Why it is on the board:
${s.join(`
`)}`]:[],`References:
${r}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(i=>!!i).join(`
`)}var nr="crew-manager.panel-widths",he={workMin:300,railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};
function jt(e,t,n,r,s){let i=Math.min(s,Math.max(n,t-r));return Math.max(n,Math.min(i,e))}function or({side:e,containerRef:t,
min:n,reserve:r,max:s,value:i,onChange:d,label:u}){let m=(l,p)=>{let b=p.getBoundingClientRect(),N=e==="start"?l-b.left:
b.right-l;return jt(N,p.clientWidth,n,r,s)};return a("div",{className:"ow-resizer",role:"separator","aria-orientation":"\
vertical","aria-label":u,tabIndex:0,onPointerDown:l=>{let p=t.current;if(!p)return;l.preventDefault(),document.body.style.
cursor="col-resize",document.body.style.userSelect="none";let b=S=>d(m(S.clientX,p)),N=()=>{window.removeEventListener("\
pointermove",b),window.removeEventListener("pointerup",N),document.body.style.cursor="",document.body.style.userSelect=""};
window.addEventListener("pointermove",b),window.addEventListener("pointerup",N)},onKeyDown:l=>{if(l.key!=="ArrowLeft"&&l.
key!=="ArrowRight")return;let p=t.current;if(!p)return;l.preventDefault();let b=(l.shiftKey?48:16)*(l.key==="ArrowRight"?
1:-1),N=i??(e==="start"?p.clientWidth/2:Math.round(p.clientWidth*.3));d(jt(N+(e==="start"?b:-b),p.clientWidth,n,r,s))}})}
function aa(){let e=Ms(),t=le(e);t.current=e;let n=Ks(),r=$s(),[s,i]=_("all"),[d,u]=_(()=>{let o=re(yn,null);return o&&xt.
includes(o)?o:"work"}),[m,f]=_(()=>{let o=re(vn,null)??"prs",c=xt.includes(o)?o:"prs",g=re(yn,null),h=g&&xt.includes(g)?
g:"work";return c===h?qo.find(v=>v!==h)??null:c}),k=D(o=>{f(c=>{let g=c===o?null:o;return j(vn,g),g})},[]),[l,p]=_(()=>re(
Yo,null)==="session"?"session":"goal"),[b,N]=_("all"),[S,M]=_({}),[$,E]=_(null),[O,te]=_("session"),[L,Y]=_(null),[W,_e]=_(
null),[I,Se]=_({}),[ut,Ht]=_("unknown"),qe=le("unknown"),Ee=le(new Map),[ve,Fe]=_({}),[je,pt]=_({}),[St,gt]=_([]),[J,Ne]=_(
null),[se,mt]=_(null),[ye,Be]=_(null),[Nt,y]=_(()=>re(wn)),[C,Q]=_(()=>re(Fo)),[X,z]=_(()=>re(hn,{merged:[],split:[]})),
Re=le(null),Me=le(null),[q,ae]=_(()=>re(nr,{work:null,conductor:null}));H(()=>{j(nr,q)},[q]),H(()=>{let o=()=>ae(c=>{let g=Me.
current?.clientWidth??0,h=Re.current?.clientWidth??0;return{work:c.work==null||g===0?c.work:jt(c.work,g,he.workMin,he.railReserve,
1/0),conductor:c.conductor==null||h===0?c.conductor:jt(c.conductor,h,he.conductorMin,he.mainReserve,he.conductorMax)}});
return o(),window.addEventListener("resize",o),()=>window.removeEventListener("resize",o)},[]);let ge=le(re(Uo,[])),[Z,ft]=_(
()=>{let o=re(cr,null);return{pairs:new Set(o?.pairs??[]),why:new Map(o?.why??[]),stamp:o?.stamp??""}}),[Ke,U]=_(()=>re(
bn,{})),Ie=le([]),Vt=le(!1),[$e,Cn]=_([]),[Ue,ur]=_(()=>re(Vo)),[Rt,It]=_(null),[pr,gr]=_(()=>re(jo,null)??!0),[An,Wn]=_(
{}),[Yt,mr]=_([]),[fr,Jt]=_(!1),He=D(o=>{if(o===d)return;let c=m===o?qo.find(g=>g!==o)??null:m;j(yn,o),j(vn,c),u(o),f(c)},
[d,m]),wr=D((o,c)=>{o.dataTransfer.setData("text/x-crew-panel",c),o.dataTransfer.effectAllowed="move";let g=o.currentTarget.
querySelector("summary");if(!g)return;let h=g.getBoundingClientRect();o.dataTransfer.setDragImage(g,Math.min(Math.max(o.
clientX-h.left,0),h.width),Math.min(Math.max(o.clientY-h.top,0),h.height))},[]),hr=D(o=>{o.preventDefault(),Jt(!1);let c=o.
dataTransfer.getData("text/x-crew-panel");!c||!xt.includes(c)||He(c)},[He]),Pn=V(()=>xt.filter(o=>o!==d),[d]),br=m&&m!==
d?String(Pn.indexOf(m)):"none",Ct=o=>{let c=o===d;return{className:"ow-card ow-stack-card",open:c||m===o,draggable:!0,"d\
ata-panel":o,"data-primary":c?"true":"false","data-rail-index":c?void 0:Pn.indexOf(o),"data-dragover":c&&fr?"true":void 0,
onDragStart:g=>wr(g,o),onDragOver:c?g=>{g.preventDefault(),Jt(!0)}:void 0,onDragLeave:c?()=>Jt(!1):void 0,onDrop:c?hr:void 0}},
En=le(!0),[vr,Bn]=_(!0),[Mn,Qt]=_(null),[At,yr]=_(null),[Ve,Kn]=_(!1),[kr,xr]=_(!1),[$n,ke]=_(null),T=le(!0),wt=le(0),Xt=le(
!1);H(()=>(T.current=!0,()=>{T.current=!1,wt.current+=1}),[]);let B=D(async()=>{let o=++wt.current,c=t.current;try{let[g,
h,v,x,ue,fe,P,ie]=await Promise.all([c.get("/api/chat/slots"),c.get("/api/approvals"),c.get("/api/spawn"),c.get("/api/wo\
rkflows/runs"),c.get("/api/crons"),c.get("/api/artifacts"),c.get("/api/autonudge").catch(()=>({loops:[]})),c.get("/api/c\
rons/history?limit=200").catch(()=>({runs:[]}))]);if(!T.current||o!==wt.current)return;_e({slots:Array.isArray(g)?g:[],approvals:Array.
isArray(h)?h:[],agents:Array.isArray(v.agents)?v.agents:[],workflows:Array.isArray(x.runs)?x.runs:[],crons:Array.isArray(
ue.jobs)?ue.jobs:[],artifacts:Array.isArray(fe.artifacts)?fe.artifacts:[],loops:Array.isArray(P?.loops)?P.loops:[]}),mr(
Array.isArray(ie?.runs)?ie.runs:[]),Qt(null),yr(Date.now())}catch(g){T.current&&o===wt.current&&Qt(g instanceof Error?g:
new Error("Unable to load Crew Manager sources"))}finally{T.current&&o===wt.current&&Bn(!1)}},[]);H(()=>{B();let o=window.
setInterval(()=>{B()},zs);return()=>window.clearInterval(o)},[B]);let _r=()=>{Bn(!0),Qt(null),B()},Wt=D(()=>{Ve||(Kn(!0),
B().finally(()=>{T.current&&Kn(!1)}))},[B,Ve]);H(()=>{if(!W||qe.current==="unsupported"||qe.current==="disabled")return;
let o=Lo(W.slots,dt).filter(g=>Ee.current.get(g.key)!==fn(g));if(o.length===0)return;let c=!1;return(async()=>{let{summaries:g,
support:h}=await To(o,v=>t.current.get(v));if(!(c||!T.current)&&(qe.current=h,Ht(h),h==="available")){for(let v of o)g[v.
key]&&Ee.current.set(v.key,fn(v));Se(v=>({...v,...g}))}})(),()=>{c=!0}},[W]),H(()=>{if(!W||!En.current)return;let o=!1;return(async()=>{
try{let c=await t.current.get("/api/apps/crew-manager/stalls");if(o||!T.current)return;let g={};for(let v of c?.stalls??
[])v?.key&&(g[v.key]=v);Fe(g);let h={};for(let v of c?.error_loops??[])v?.key&&(h[v.key]=v);Wn(h)}catch{En.current=!1,T.
current&&(Fe({}),Wn({}))}})(),()=>{o=!0}},[W]),H(()=>{let o=!1;return(async()=>{try{let c=await t.current.get("/api/apps\
/crew-manager/initiatives");if(o||!T.current)return;Cn((c?.initiatives??[]).filter(g=>g?.name))}catch{}})(),()=>{o=!0}},
[]);let Ln=V(()=>bo(_o(W??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},be,I,ve,An,X),je),
[W,I,ve,An,je,X]),Pt=V(()=>yo(Ln,Nt,C),[Ln,Nt,C]),A=V(()=>Pt.items.filter(o=>ko(o)),[Pt]),Et=V(()=>gn(A),[A]),Tn=V(()=>{
let o={};for(let c of A){if(c.state!=="done"||!c.sessionKey)continue;let g=o[c.sessionKey];g?g.push(c.title):o[c.sessionKey]=
[c.title]}return o},[A]),Ce=V(()=>A.find(o=>o.id===$)??null,[A,$]),ht=V(()=>s==="all"?A:A.filter(o=>o.state===s),[s,A]),
Bt=V(()=>{let o={all:0,failing:0,running:0,merged:0};for(let c of mn(A,"pr")){if(!c.changeRef)continue;o.all++;let g=dn(
In(c.changeRef,S[c.changeRef.url??""]));g!=="other"&&o[g]++}return o},[A,S]);H(()=>{let o=new Set;for(let g of A)for(let h of g.
references)h.kind==="change"&&h.url&&/\/pull\/\d|\/merge_requests\/\d/.test(h.url)&&o.add(h.url);let c=!1;for(let g of o)
S[g]||t.current.post("/api/source/pull-request",{url:g}).then(h=>{!c&&T.current&&h?.title&&M(v=>({...v,[g]:Xs(h)}))}).catch(
()=>{});return()=>{c=!0}},[A,S]),H(()=>r(Et["needs-you"]),[Et,r]),H(()=>{$&&!A.some(o=>o.id===$)&&E(null)},[A,$]),H(()=>{
j(Yo,l)},[l]);let Zt=W?.slots.find(o=>o.key===dt),Sr=!!(Zt||kr);H(()=>{!W||Zt||Xt.current||(Xt.current=!0,e.post("/api/c\
hat/slots",{name:dt,title:"Conductor"}).then(()=>{T.current&&(xr(!0),B())}).catch(o=>{T.current&&(Xt.current=!1,ke(o instanceof
Error?`Conductor session could not be created: ${o.message}`:"Conductor session could not be created"))}))},[e,Zt,B,W]);
let Dn=V(()=>lo(W?.approvals??[],St,o=>A.find(c=>c.sessionKey===o)?.title??W?.slots?.find(c=>c.key===o)?.title??o),[A,W,
St]),Ye=Ce&&!Ce.permissionId?Ce:null,ce=V(()=>Ko(A,$e,X,ge.current,Z.pairs),[A,$e,X,Z]);H(()=>{let o=Ro(ce.filter(c=>c.name===
null).flatMap(c=>c.blocks));ge.current=o,j(Uo,o)},[ce]),H(()=>{if(Ie.current.length===0)return;let o=ce.filter(h=>h.name===
null).flatMap(h=>h.blocks),c={},g=[];for(let h of Ie.current){let v=o.find(x=>x.items.length>1&&h.ids.filter(ue=>x.items.
some(fe=>fe.id===ue)).length>=2);v?c[v.key]=h.name:g.push(h)}Ie.current=g,Object.keys(c).length>0&&U(h=>{let v={...h,...c};
return j(bn,v),v})},[ce]),H(()=>{let o=ce.filter(v=>v.name===null).flatMap(v=>v.blocks),c=o.filter(v=>v.items.length>1).
map(v=>({key:v.key,name:Ke[v.key]??null,items:v.items.map(x=>({id:x.id,title:x.title}))})),g=o.filter(v=>v.items.length===
1).map(v=>({id:v.items[0].id,title:v.items[0].title,detail:v.items[0].summary??""}));if(g.length===0&&c.every(v=>v.name))
return;let h=JSON.stringify([c.map(v=>[v.key,v.name]),g.map(v=>v.id).sort()]);h===Z.stamp||Vt.current||(Vt.current=!0,(async()=>{
try{let v=await t.current.post("/api/apps/crew-manager/goal-pass",{clusters:c,ungrouped:g});if(!T.current)return;if(!v?.
available){ft(R=>Ho({pairs:R.pairs,why:R.why,stamp:h}));return}let x=new Map;for(let R of o)for(let K of R.items)x.set(K.
id,K);let ue=new Map(o.map(R=>[R.key,R])),fe=new Set(Z.pairs),P=new Map(Z.why),ie=new Map,oe=new Map;for(let R of v.assignments??
[]){if((R.confidence??0)<Os)continue;let K=R.item_id?x.get(R.item_id):void 0;if(!(!K?.sessionKey||!R.cluster)){if(R.cluster.
startsWith("existing:")){let we=ue.get(R.cluster.slice(9))?.items.find(Kt=>Kt.id!==K.id);if(!we)continue;let De=pe(K,we);
fe.add(De),R.why&&P.set(De,R.why)}else if(R.cluster.startsWith("new:")){let nt=ie.get(R.cluster)??[];nt.push(K),ie.set(R.
cluster,nt),R.why&&oe.set(K.id,R.why)}}}let vt=new Map;for(let R of v.names??[])R.cluster&&R.name&&vt.set(R.cluster,R.name);
let zn=[];for(let[R,K]of ie){if(K.length<2)continue;for(let we=0;we<K.length;we+=1)for(let De=we+1;De<K.length;De+=1){let Kt=pe(
K[we],K[De]);fe.add(Kt);let Gn=oe.get(K[we].id)??oe.get(K[De].id);Gn&&P.set(Kt,Gn)}let nt=vt.get(R);nt&&zn.push({ids:K.map(
we=>we.id),name:nt})}Ie.current=zn;let Mt={};for(let[R,K]of vt)R.startsWith("new:")||(R.startsWith("item:")?!Ke[R]&&x.has(
R.slice(5))&&(Mt[R]=K):ue.has(R)&&(Mt[R]=K));Object.keys(Mt).length>0&&U(R=>{let K={...R,...Mt};return j(bn,K),K}),ft(Ho(
{pairs:fe,why:P,stamp:h}))}catch{}finally{Vt.current=!1}})())},[ce,Ke,Z]);let me=V(()=>{if(!Rt)return null;for(let o of ce){
let c=o.blocks.find(g=>g.key===Rt);if(c&&c.items.length>0)return c}return null},[Rt,ce]),ne=me?Mo(me.items):null,en=V(()=>{
let o=(W?.loops??[]).filter(h=>h&&h.active!==!1&&h.slot_key);if(o.length===0)return[];let c=new Map,g=new Map;for(let h of A)
for(let v of h.references)v.kind!=="session"||!v.id||v.label&&!c.has(v.id)&&c.set(v.id,v.label);for(let h of ce)if(h.name)
for(let v of h.blocks)for(let x of v.items)x.sessionKey&&!g.has(x.sessionKey)&&g.set(x.sessionKey,h.name);return o.map(h=>{
let v=Number(h.cycle_count)||0,x=Number(h.max_cycles)||0;return{key:h.slot_key,title:c.get(h.slot_key)??h.slot_key,goalName:g.
get(h.slot_key)??null,progress:x>0?`${v}/${x}`:`${v} ${v===1?"cycle":"cycles"}`,remaining:x>0?Math.max(0,x-v):null,instruction:(h.
message??"").replace(/\s+/g," ").trim(),lastFire:F(h.last_fire_ts)}})},[W,A,ce]),Je=V(()=>{let o=new Date;o.setHours(0,0,
0,0);let c=o.getTime(),g=c+864e5,h=W?.crons??[],v=new Map;for(let P of Yt){let ie=F(P.started_at);if(!P.job_id||ie<c||ie>=
g)continue;let oe=v.get(P.job_id)??{count:0,failed:0,last:0};oe.count+=1,P.status&&P.status!=="success"&&(oe.failed+=1),
oe.last=Math.max(oe.last,ie),v.set(P.job_id,oe)}let x=h.map(P=>{let ie=v.get(P.id),oe=F(P.next_run_ts),vt=oe>=c&&oe<g;return{
job:P,ran:ie,next:oe,dueToday:vt}}).filter(P=>P.ran||P.dueToday||P.job.is_running),ue=x.filter(P=>P.ran&&P.ran.failed===
0).length,fe=x.filter(P=>P.ran&&P.ran.failed>0).length;return{rows:x,done:ue,failed:fe,total:x.length,historyKnown:Yt.length>
0}},[W,Yt]),[Nr,On]=_(!1),Rr=V(()=>{if(l!=="goal")return[];let o=Po(W?.slots??[],$e),c=Eo(A,$e),g=new Set,h=[];for(let v of[
...c,...o])g.has(v.name.toLowerCase())||(g.add(v.name.toLowerCase()),h.push(v));return h.sort((v,x)=>x.sessions-v.sessions)},
[l,W,A,$e]),Ir=D(async(o,c)=>{try{await t.current.patch(`/api/chat/slots/${encodeURIComponent(o)}/title`,{title:c}),B()}catch{}},
[B]),Cr=D(async(o,c=[])=>{if(o.trim()){On(!0);try{let g=await t.current.post("/api/apps/crew-manager/initiatives",{name:o.
trim(),aliases:c});T.current&&g?.initiatives&&Cn(g.initiatives.filter(h=>h?.name))}catch{}finally{T.current&&On(!1)}}},[]),
Le=D(async(o,c)=>{if(!J){Ne(o),ke(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(o)}/${c?"approve":
"reject"}`,{}),B()}catch(g){ke(g instanceof Error?`Could not answer that request: ${g.message}`:"Could not answer that r\
equest"),B()}finally{T.current&&Ne(null)}}},[B,J]),Qe=D(async(o,c)=>{if(!(J||!o.permissionId||!o.sessionKey)){Ne(o.permissionId),
ke(null);try{await t.current.post(`/api/chat/slots/${encodeURIComponent(o.sessionKey)}/approve`,{action:c,request_id:o.permissionId}),
B()}catch(g){ke(g instanceof Error?`Could not answer that request: ${g.message}`:"Could not answer that request"),B()}finally{
T.current&&Ne(null)}}},[B,J]),Ar=D(o=>{y(c=>{let g=Object.fromEntries(Object.entries(c).filter(([,h])=>h>Date.now()));return g[o]=
Date.now()+vo,j(wn,g),g}),E(null)},[]),Wr=D((o,c)=>{Q(g=>{let h={...g,[o]:c};return j(Fo,h),h}),E(null)},[]),Pr=D(()=>{y(
{}),j(wn,{})},[]),Er=D(o=>{z(c=>{let g={merged:c.merged.filter(h=>!o.includes(h)),split:[...new Set([...c.split,...o])]};
return j(hn,g),g})},[]),Br=D(o=>{z(c=>{let g={merged:[...new Set([...c.merged,o])],split:c.split.filter(h=>h!==o)};return j(
hn,g),g})},[]),Mr=D(()=>{gr(o=>(j(jo,!o),!o))},[]),Xe=D(async o=>{if(!se){mt(o),ke(null);try{await t.current.post(o,{}),
B()}catch(c){ke(c instanceof Error?`Could not re-run it: ${c.message}`:"Could not re-run it"),B()}finally{T.current&&mt(
null)}}},[B,se]),bt=D(async o=>{if(!ye){Be(o),ke(null);try{await t.current.del(o),Y("Stopped the monitor loop. Re-arming\
 it is done from the session itself."),B()}catch(c){let g=c instanceof Error?c.message:"";/404|not found/i.test(g)?Y("Th\
at loop had already stopped."):ke(g?`Could not stop it: ${g}`:"Could not stop it"),B()}finally{T.current&&Be(null)}}},[B,
ye]),Te=D(async o=>{if(me&&ne?.sessionKey){let g=ne.sessionKey,h=me.items.map(x=>`- ${x.references.find(ue=>ue.kind==="s\
ession")?.label??x.sessionKey}: ${xe[x.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(g)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${me.items[0].title}", which spans sessions:`,h,"You are the session actively on it, so the instructi\
on is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:g}).catch(x=>{if(!(x instanceof
SyntaxError))throw x}),!T.current)return;pt(x=>({...x,[ne.id]:Date.now()})),gt(x=>x.includes(g)?x:[...x,g]);let v=ne.references.
find(x=>x.kind==="session")?.label??ne.title;Y(ne.moving||ne.state==="running"?`Sent to ${v} \u2014 the active session on thi\
s goal`:`Sent to ${v} \u2014 resuming the last session on this goal`),It(null),B();return}let c=Ce&&!Ce.permissionId?Ce:
null;if(O==="session"&&c?.sessionKey){let g=c.sessionKey;if(await t.current.post("/api/chat",{message:o,slot:g}).catch(h=>{
if(!(h instanceof SyntaxError))throw h}),!T.current)return;pt(h=>({...h,[c.id]:Date.now()})),gt(h=>h.includes(g)?h:[...h,
g]),Y(`Sent new instructions to ${c.title}`),E(null),B();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(
dt)}/context`,{content:sa(Ce,A),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,
slot:dt}).catch(g=>{if(!(g instanceof SyntaxError))throw g})},[Ce,me,ne,A,B,O]),tn={"needs-you":ht.filter(o=>o.state==="\
needs-you"),running:ht.filter(o=>o.state==="running"),done:ht.filter(o=>o.state==="done")},Ze=D((o,c)=>{ur(g=>{let h={...g,
[o]:c};return j(Vo,h),h})},[]),Kr=D(o=>{It(c=>c===o?null:o),E(null),Y(null)},[]),et=o=>n(`/chat?sid=${encodeURIComponent(
o)}`),tt=o=>{E(c=>c===o.id?null:o.id),It(null),Y(null),te("session")};return w("div",{className:"ow-root","data-crew-man\
ager-shell":"quiet-split",children:[a("style",{children:Do}),a("div",{className:"ow-titlebar",children:a(Ds,{title:w("sp\
an",{className:"ow-title-line",children:["Crew Manager",a("span",{className:"ow-beta","aria-label":"Beta preview",children:"\
Beta"})]}),subtitle:"See what needs your input, what is still running, and what finished recently."})}),a("div",{className:"\
ow-body",children:w("div",{className:"ow-layout",ref:Re,style:q.conductor!=null?{"--ow-conductor-w":`${q.conductor}px`}:
void 0,children:[w("div",{className:"ow-main","data-open-row":br,ref:Me,style:q.work!=null?{"--ow-work-w":`${q.work}px`}:
void 0,children:[w("details",{...Ct("work"),"aria-label":"Work",children:[w("summary",{onClick:o=>{o.preventDefault(),d!==
"work"&&k("work")},children:[w("span",{className:"ow-stack-title",children:[a(de,{className:"ow-icon ow-stack-chevron"}),
a(Ft,{className:"ow-icon"}),d==="work"?a("span",{className:"ow-tabs",role:"tablist","aria-label":"View",children:["goal",
"session"].map(o=>a(G,{role:"tab","aria-selected":l===o,"data-selected":l===o,className:"ow-tab",onClick:()=>p(o),children:o===
"goal"?"Goals":"Sessions"},o))}):dr.work]}),w("span",{className:"ow-stack-actions",children:[a(ee,{variant:"muted",children:Et.
all}),d==="work"?a(Gt,{lastUpdated:At,refreshing:Ve,onRefresh:Wt}):a(zt,{id:"work",onPromote:He})]})]}),w("div",{className:"\
ow-listcard-tools",children:[a("p",{className:"ow-listcard-sub",children:l==="goal"?"Sessions consolidated by the goal o\
r topic they share":"Grouped by what each session needs from you"}),l==="session"&&a("div",{className:"ow-filters",role:"\
group","aria-label":"Filter by state",children:Object.keys(kn).map(o=>w(G,{onClick:()=>i(o),"aria-pressed":s===o,"data-s\
elected":s===o,className:"ow-filter",children:[kn[o],a("span",{className:"ow-count",children:Et[o]})]},o))})]}),a("main",
{className:"ow-work",children:a("div",{className:"ow-work-inner",children:vr?a(zo,{rows:7}):Mn&&!W?a(Go,{icon:a(rr,{className:"\
ow-icon"}),title:"Crew Manager could not load the work view",subtitle:Mn.message,action:a(G,{onClick:_r,children:"Try ag\
ain"})}):(l==="goal"?A.length===0:ht.length===0)?a(Go,{icon:a(Ps,{className:"ow-icon"}),title:"No matching work",subtitle:l===
"goal"?"No sessions are running yet.":"Change the filter to see sessions in another state."}):l==="goal"?a(ct,{title:"Wo\
rk by goal",hideHeader:!0,items:A,selectedId:$,onSelect:tt,onOpenSession:et,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{
Qe(o,c)},permissionBusy:J!==null,onRetry:o=>{Xe(o)},retryBusy:se!==null,onPickStep:o=>{Te(o)},groupBy:l,goalVerdicts:X,onSplitGoal:Er,
onMergeGoal:Br,initiativeBlocks:ce,initiatives:$e,onRenameSession:(o,c)=>{Ir(o,c)},semanticWhy:Z.why,goalNames:Ke,collapsedInitiatives:Ue,
onToggleInitiative:Ze,selectedGoalKey:Rt,onSelectGoal:Kr,footer:a(Vs,{candidates:Rr,prominent:$e.length===0,busy:Nr,onAdd:(o,c)=>{
Cr(o,c)}}),emptyLabel:"No matching work"}):s==="all"?w(Pe,{children:[a(ct,{title:"Needs you",subtitle:"Waiting on a deci\
sion or reply from you",items:tn["needs-you"],doneBySession:Tn,selectedId:$,onSelect:tt,onSnooze:Ar,onHandled:Wr,footer:Pt.
snoozedCount>0?w("button",{type:"button",className:"ow-aside-note",onClick:Pr,children:[Pt.snoozedCount," set aside for \
later \u2014 bring back"]}):void 0,onOpenSession:et,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Qe(o,c)},
permissionBusy:J!==null,onRetry:o=>{Xe(o)},retryBusy:se!==null,onStop:o=>{bt(o)},stopBusy:ye!==null,onPickStep:o=>{Te(o)},
collapsedInitiatives:Ue,onToggleInitiative:Ze,groupBy:l,emptyLabel:"Nothing needs your input right now."}),a(ct,{title:"\
In progress",subtitle:"Being worked on right now",items:tn.running,doneBySession:Tn,selectedId:$,onSelect:tt,onOpenSession:et,
onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Qe(o,c)},permissionBusy:J!==null,onRetry:o=>{Xe(o)},retryBusy:se!==
null,onStop:o=>{bt(o)},stopBusy:ye!==null,onPickStep:o=>{Te(o)},collapsedInitiatives:Ue,onToggleInitiative:Ze,groupBy:l,
emptyLabel:"Nothing is in progress right now."}),a(ct,{title:"Done recently",subtitle:"Finished in the last few days",items:tn.
done,selectedId:$,onSelect:tt,collapsed:pr,onToggleCollapsed:Mr,onOpenSession:et,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{
Qe(o,c)},permissionBusy:J!==null,onRetry:o=>{Xe(o)},retryBusy:se!==null,onStop:o=>{bt(o)},stopBusy:ye!==null,onPickStep:o=>{
Te(o)},collapsedInitiatives:Ue,onToggleInitiative:Ze,groupBy:l,emptyLabel:"No recent completed work."})]}):a(ct,{title:kn[s],
items:ht,selectedId:$,onSelect:tt,onOpenSession:et,onAnswerPermission:(o,c)=>{Le(o,c)},onDecideApproval:(o,c)=>{Qe(o,c)},
permissionBusy:J!==null,onRetry:o=>{Xe(o)},retryBusy:se!==null,onStop:o=>{bt(o)},stopBusy:ye!==null,onPickStep:o=>{Te(o)},
collapsedInitiatives:Ue,onToggleInitiative:Ze,groupBy:l,emptyLabel:"No matching work"})})})]}),w("details",{...Ct("prs"),
children:[w("summary",{onClick:o=>{o.preventDefault(),d!=="prs"&&k("prs")},children:[w("span",{className:"ow-stack-title",
children:[a(de,{className:"ow-icon ow-stack-chevron"}),a(Nn,{className:"ow-icon"}),"PRs"]}),w("span",{className:"ow-stac\
k-actions",children:[a(ee,{variant:"muted",children:Bt.all}),d==="prs"?a(Gt,{lastUpdated:At,refreshing:Ve,onRefresh:Wt}):
a(zt,{id:"prs",onPromote:He})]})]}),a("p",{className:"ow-stack-sub",children:"Pull requests your work touches, and what \
is holding each one up"}),Bt.all>0&&a("div",{className:"ow-pr-tools",children:a("div",{className:"ow-filters",role:"grou\
p","aria-label":"Filter by PR status",children:Object.keys(Qo).map(o=>w(G,{onClick:()=>N(o),"aria-pressed":b===o,"data-s\
elected":b===o,className:"ow-filter",children:[Qo[o],a("span",{className:"ow-count",children:Bt[o]})]},o))})}),a("div",{
className:"ow-stack-body",children:Bt.all===0?a("p",{className:"ow-stack-empty",children:"No work is linked to a PR righ\
t now. Work links to one when a session mentions its URL."}):a(Pe,{children:a(ct,{title:"Work by PR",hideHeader:!0,items:A,
prChecks:S,prFilter:b,collapsedInitiatives:Ue,onToggleInitiative:Ze,selectedId:$,onSelect:tt,onOpenSession:et,onAnswerPermission:(o,c)=>{
Le(o,c)},onDecideApproval:(o,c)=>{Qe(o,c)},permissionBusy:J!==null,onRetry:o=>{Xe(o)},retryBusy:se!==null,onStop:o=>{bt(
o)},stopBusy:ye!==null,onPickStep:o=>{Te(o)},groupBy:"pr",emptyLabel:"No PR matches that status."})})})]}),w("details",{
...Ct("loops"),children:[w("summary",{onClick:o=>{o.preventDefault(),d!=="loops"&&k("loops")},children:[w("span",{className:"\
ow-stack-title",children:[a(de,{className:"ow-icon ow-stack-chevron"}),a(lr,{className:"ow-icon"}),"Loops"]}),w("span",{
className:"ow-stack-actions",children:[a(ee,{variant:"muted",children:en.length}),d==="loops"?a(Gt,{lastUpdated:At,refreshing:Ve,
onRefresh:Wt}):a(zt,{id:"loops",onPromote:He})]})]}),a("p",{className:"ow-stack-sub",children:"Sessions repeating a goal\
 until it is done"}),a("div",{className:"ow-stack-body",children:en.length===0?a("p",{className:"ow-stack-empty",children:"\
No loop is running right now."}):en.map(o=>{let c=Ut(o.lastFire),g=[c&&`last tick ${c}`,o.remaining!==null&&`${o.remaining}\
 remaining`].filter(Boolean).join(" \xB7 ");return w("div",{className:"ow-mini",children:[a("span",{className:"ow-mini-r\
ail",style:{background:"var(--warn)"}}),w("div",{children:[w("div",{className:"ow-mini-title",children:[o.goalName??o.title,
a("span",{className:"ow-mini-chip",children:o.progress})]}),o.instruction&&a("div",{className:"ow-mini-desc",title:o.instruction,
children:o.instruction}),g&&a("div",{className:"ow-mini-when",children:g})]}),a(ee,{variant:"ok",children:"Active"})]},o.
key)})})]}),w("details",{...Ct("schedule"),children:[w("summary",{onClick:o=>{o.preventDefault(),d!=="schedule"&&k("sche\
dule")},children:[w("span",{className:"ow-stack-title",children:[a(de,{className:"ow-icon ow-stack-chevron"}),a(ir,{className:"\
ow-icon"}),"Scheduled tasks"]}),w("span",{className:"ow-stack-actions",children:[w(ee,{variant:Je.failed>0?"err":"muted",
children:[Je.done,"/",Je.total," today"]}),d==="schedule"?a(Gt,{lastUpdated:At,refreshing:Ve,onRefresh:Wt}):a(zt,{id:"sc\
hedule",onPromote:He})]})]}),a("p",{className:"ow-stack-sub",children:Je.historyKnown?"Today's runs only \u2014 jobs with not\
hing scheduled today are hidden":"Run history is unavailable, so completed counts may be low"}),a("div",{className:"ow-s\
tack-body",children:Je.rows.length===0?a("p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):Je.
rows.map(({job:o,ran:c,next:g,dueToday:h})=>{let v=!!(c&&c.failed>0),x=[c&&`ran today ${Jo(c.last)}${c.count>1?` (${c.count}\
x)`:""}`,h&&g?`next ${Jo(g)}`:null].filter(Boolean).join(" \xB7 ");return w("div",{className:"ow-mini",children:[a("span",
{className:"ow-mini-rail",style:{background:v?"var(--danger)":o.enabled===!1?"var(--muted)":"var(--warn)"}}),w("div",{children:[
a("div",{className:"ow-mini-title",children:o.name}),o.schedule&&w("div",{className:"ow-mini-desc",children:[o.schedule,
o.cron_expr&&a("span",{className:"ow-mini-chip",children:o.cron_expr})]}),x&&a("div",{className:"ow-mini-when",children:x})]}),
o.is_running?a(ee,{variant:"aim",children:"Running"}):v?a(ee,{variant:"err",children:"Failed"}):o.enabled===!1?a(ee,{variant:"\
muted",children:"Paused"}):c?a(ee,{variant:"ok",children:"Success"}):a(ee,{variant:"warn",children:"Pending"})]},o.id)})})]}),
a(or,{side:"start",containerRef:Me,min:he.workMin,reserve:he.railReserve,max:1/0,value:q.work,onChange:o=>ae(c=>({...c,work:o})),
label:"Resize the work column"})]}),a(or,{side:"end",containerRef:Re,min:he.conductorMin,reserve:he.mainReserve,max:he.conductorMax,
value:q.conductor,onChange:o=>ae(c=>({...c,conductor:o})),label:"Resize the Conductor panel"}),w("aside",{className:"ow-\
conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:w("div",{className:"ow-c\
onductor-title",children:[a("h2",{children:"Conductor"}),!Ye&&a("span",{className:"ow-conductor-sub",children:"select wo\
rk, or ask across all"})]})}),a("div",{className:"ow-chat",children:Sr?w("div",{className:"ow-chat-panel",children:[Dn.length>
0&&a("div",{className:"ow-permissions",role:"alert",children:Dn.map(o=>a(Us,{tool:o.tool,purpose:o.purpose,where:o.sessionLabel,
busy:J!==null,onAnswer:c=>{Le(o.id,c)}},o.id))}),L&&w("div",{className:"ow-conductor-receipt",role:"status",children:[a(
ar,{className:"ow-icon"}),L]}),$n&&a("div",{className:"ow-chat-error",role:"alert",children:$n}),a("div",{className:"ow-\
embed",children:a(Ls,{slotKey:dt,frameless:!0,startAtBottom:!0,placeholder:me?"Instruction for this goal\u2026":Ye?.sessionKey&&
O==="session"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:Te})}),me&&ne?w("div",{className:"\
ow-quote ow-quote-docked",children:[w("div",{className:"ow-quote-body ow-quote-goal",children:[w("div",{className:"ow-qu\
ote-line",children:[a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"ow-quote-title",
title:me.items[0].title,children:me.items[0].title})]}),w("span",{className:"ow-quote-route ow-truncate",children:["\u2192 ",
ne.references.find(o=>o.kind==="session")?.label??ne.title,ne.moving||ne.state==="running"?" (active)":" (will resume)"]})]}),
a(G,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{It(null),Y(null)},children:"Clear"})]}):
Ye&&w("div",{className:"ow-quote ow-quote-docked",children:[w("div",{className:"ow-quote-body",children:[Ye.sessionKey?a(
"button",{type:"button",className:"ow-scope-toggle","aria-pressed":O==="conductor","aria-label":O==="session"?"Sending t\
o this session. Activate to send to the Conductor instead.":"Sending to the Conductor. Activate to send to this session \
instead.",onClick:()=>te(o=>o==="session"?"conductor":"session"),children:O==="session"?"Instructing":"To Conductor"}):a(
"span",{className:"ow-eyebrow",children:"Quoted"}),a("span",{className:"ow-quote-title",title:Ye.title,children:Ye.title})]}),
a(G,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{E(null),Y(null)},children:"Clear"})]})]}):
a("div",{className:"ow-chat-loading",children:a(zo,{rows:4})})})]})]})})]})}export{aa as default};
