import{useCallback as C,useEffect as E,useMemo as L,useRef as I,useState as v}from"react";import{AlertTriangle as Qt,Bot as eo,
Check as to,ChevronRight as $e,Check as Xt,Clock as no,Package as oo,ExternalLink as ro,MessageSquare as Zt,Shield as so,
Waves as io,Search as ao,Tag as lo,Users as co,Zap as uo}from"lucide-react";import{useAppApi as po,useNavigate as go,useNavBadge as fo}from"@kirocrew/app-sdk";
import{Badge as le,Btn as $,ContentSkeleton as jt,EmptyState as Ht,Input as wo,PageHeader as mo,SearchInput as ho,SendBtn as yo}from"@kirocrew/app-sdk/ui";function ht(e){return e.trim().length>=2}function yt(e,t){let o=new Set(t.map(l=>l.sessionKey).filter(Boolean)),n=new Set,
a=[];for(let l of e){let u=l?.session_key;!u||o.has(u)||n.has(u)||(n.add(u),a.push(l))}return a}function kn(e,t){if(!e)return 0;
let o=e>1e11?e/1e3:e,n=Math.floor((t/1e3-o)/86400);return n>0?n:0}function vt(e,t){let o=kn(e,t);if(o<=0)return"today";if(o===
1)return"yesterday";if(o<7)return`${o} days ago`;if(o<30){let a=Math.floor(o/7);return a===1?"last week":`${a} weeks ago`}
let n=Math.floor(o/30);return n===1?"last month":`${n} months ago`}var bt={unsupported:!1,hits:[]};function kt(e){return!e||
e.enabled===!1?{unsupported:!0,hits:[]}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:[]).filter(o=>!!o?.session_key)}}
function xt(e,t){return`/api/apps/crew-manager/recall?${new URLSearchParams({q:e.trim(),limit:String(t)}).toString()}`}function xe(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),n=t%
60;return n===0?`${o} hour${o===1?"":"s"}`:`${o}h ${n}m`}function At(e,t,o){let n=new Set(t.filter(Boolean));if(n.size===
0)return[];let a=new Set,l=[];for(let u of e){let k=u.slot;!k||!n.has(k)||!u.id||a.has(u.id)||(a.add(u.id),l.push({id:u.
id,sessionKey:k,sessionLabel:o(k),tool:u.tool||"a tool",purpose:u.tool_purpose}))}return l}var _t={"needs-you":0,running:1,
done:2};function W(e){if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(
t)?t:0}var St=72;function Q(e,t){let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let a=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.
trim()||o).replace(/[.;,]$/,"");if(a.length<=St)return a;let l=a.slice(0,St),u=l.lastIndexOf(" ");return`${(u>24?l.slice(
0,u):l).trim()}\u2026`}function D(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="\
conflicting"))}var xn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,_n=/^\((?:code|diff|widget|image)\)$/,
Sn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
Rn=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,Cn=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
In=/[?？]["'”’)\]]*$/;function Wt(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||_n.test(t)||xn.test(
t)?null:t}function Se(e){if(!e.waiting_for_input)return null;let t=Wt(e);return!t||Sn.test(t)||Rn.test(t)?null:Cn.test(t)||
In.test(t)?t:null}function Rt(e){return e.pending_approval||Se(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":D(e)?"needs-you":"done"}function Nn(e,t){if(e.pending_approval)return t("approval_waiting");let o=Se(e);return o||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):D(e)?t("linked_change_issue"):Wt(e)??t("recent_wo\
rk_ready"))}function _e(e,t){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function An(e){return e.pending_approval?"review-approval":Se(e)?"reply":"open"}function Wn(e,t){
let o=(e.source_links??[]).map(n=>({kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:
`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key}));return{id:`session:${e.key}`,title:e.title||t("untitled_work"),
summary:Nn(e,t),state:Rt(e),moving:Rt(e)==="running"||void 0,issue:D(e),updatedAt:W(e.last_ts||e.last_activity_ts||e.created),
sessionKey:e.key,provenance:_e(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:D(e)||void 0,action:An(e),references:[
{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...o]}}function Re(e,t){e.references.some(o=>o.
kind===t.kind&&o.id===t.id)||e.references.push(t)}function Et(e){return(e.source||"").toLowerCase()==="subagent"}function En(e,t,o){
let n=Et(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,W(t.ts)),e.summary=o(n?"subagent_gate_waiting":"approva\
l_waiting"),e.approvalKind=n?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=t.tool||t.
source,e.permissionPurpose=t.tool_purpose,Re(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),sessionKey:t.
slot||e.sessionKey})}function Kn(e,t,o){e.updatedAt=Math.max(e.updatedAt,W(t.started)),e.issue||=!!(t.done&&(t.error||t.
outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_failed",{task:t.
task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),Re(e,{kind:"agent",id:t.id,label:t.agent||
o("agent"),sessionKey:t.parent||e.sessionKey})}function On(e,t,o){e.issue||=t.status==="failed",t.status==="running"&&e.
state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow_failed",{name:t.
name})),Re(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function Tn(e,t){
if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"dropped":return"\
done";case"in-progress":return"running";default:return null}}function Ln(e,t,o){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===o}function $n(e){let t=null,o=-1;for(let n of e){let a=n.last_touched_turn??0;a>o&&(o=a,t=n)}return t}function Mn(e,t){let o=e.next_steps?.find(a=>a.what?.trim())?.what?.trim();if(o)return o;let n=[...e.progress??[]].reverse().
find(a=>a.trim());return n?n.trim():e.initial_intent?.trim()||t("work_in_progress")}var Pn=3;function Bn(e,t,o){if(!t?.enabled)
return[];let n=t.intents??[];if(n.length===0)return[];let a=(e.source_links??[]).map(d=>({kind:d.kind==="issue"?"issue":
"change",id:d.url,label:d.kind==="issue"?`issue #${d.number}`:`${d.provider} #${d.number}`,url:d.url,sessionKey:e.key})),
l=[],u=$n(n),h=!!(e.running||e.subagents_running||e.orchestrating)?[]:n.filter(d=>d.state==="in-progress");if(h.length>0){
let d=h.reduce((g,_)=>(_.last_touched_turn??0)>=(g.last_touched_turn??0)?_:g,h[0]),y=d.next_steps?.find(g=>g.what?.trim())?.
what?.trim();l.push({id:`unattended:${e.key}`,title:e.title||o("untitled_work"),summary:y||o("no_next_step"),state:"need\
s-you",issue:D(e),updatedAt:W(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:_e(e,o),queuedBehind:e.
queue_depth||void 0,changeBlocked:D(e)||void 0,unattendedGoals:h.length,action:"resume",references:[{kind:"session",id:e.
key,label:e.title||o("untitled_work"),sessionKey:e.key},...a],nextSteps:h.flatMap(g=>(g.next_steps??[]).filter(_=>_.what?.
trim())),goals:h.map(g=>g.title?.trim()).filter(g=>!!g),doneGoals:n.filter(g=>g.state==="done"||g.state==="dropped").map(
g=>g.title?.trim()).filter(g=>!!g),progress:[],stale:!!t.stale,lastTouchedTurn:d.last_touched_turn??0})}n.forEach((d,y)=>{
if(h.includes(d)||h.length>0&&(d.state==="done"||d.state==="dropped"))return;let g=Tn(d,e);if(!g)return;let _=(d.next_steps??
[]).filter(K=>K.what?.trim());l.push({id:`intent:${e.key}:${y}`,title:Q(d.title,e.title||o("untitled_work")),summary:Mn(
d,o),state:g,issue:!1,updatedAt:W(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:_e(e,o),queuedBehind:e.
queue_depth||void 0,changeBlocked:D(e)||void 0,unverified:d.verified===!1||void 0,action:"open",references:[{kind:"sessi\
on",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.key},...a],nextSteps:_,progress:(d.progress??[]).filter(K=>K.
trim()),stale:!!t.stale,lastTouchedTurn:d.last_touched_turn??0,moving:Ln(d,e,u)||void 0})});let s=l.filter(d=>d.state===
"needs-you"),w=l.filter(d=>d.state!=="needs-you").sort((d,y)=>(y.lastTouchedTurn??0)-(d.lastTouchedTurn??0));return[...s,
...w].slice(0,Math.max(Pn,s.length))}var Dn=new Set(["crew-manager-conductor","overwatch-conductor"]),qn={approval_owed:100,
subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,
queued_behind:12,waiting_a_while:8},zn=3;function Fn(e,t){return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):
0}var ae=5;function Kt(e,t,o=Date.now()){let n=Ie(e),a=Pt(e.filter(u=>u.state==="needs-you"),o),l=[`Fleet: ${n["needs-yo\
u"]} waiting on the user, ${n.running} in progress, ${n.done} finished recently.`];return a.length===0?(l.push("Nothing \
is waiting on the user."),l):(l.push(`Waiting on the user, in the order the list shows them (top ${Math.min(ae,a.length)}\
):`),a.slice(0,ae).forEach((u,k)=>{let h=Ce(X(u,o),t),s=u.sessionKey?` [session ${u.sessionKey}]`:"";l.push(`${k+1}. ${u.
title} \u2014 ${u.summary} (${h})${s}`)}),a.length>ae&&l.push(`\u2026and ${a.length-ae} more waiting.`),l)}var Un=new Set(
["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that","with","from","into","be","do","so","a\
s","by","fix","add","make","update","work","session","app","new","use","run","why","what","how","again","still","not"]),
jn=.6,Ct=2;function It(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(t=>t.length>
2&&!Un.has(t)))]}function Hn(e,t){let o=It(e),n=It(t);if(o.length<Ct||n.length<Ct)return 0;let a=o.length<=n.length?o:n,
l=new Set(o.length<=n.length?n:o);return a.filter(k=>l.has(k)).length/a.length}function Nt(e){return e.references.filter(
t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Yn(e){let t=e.filter(o=>o.state!=="done"&&o.sessionKey).sort(
(o,n)=>(o.updatedAt||0)-(n.updatedAt||0));for(let o=1;o<t.length;o+=1){let n=t[o];for(let a=0;a<o;a+=1){let l=t[a];if(l.
sessionKey===n.sessionKey)continue;if(Nt(n).find(k=>Nt(l).includes(k))){n.duplicateOf={sessionKey:l.sessionKey,title:l.title,
because:"same_change"};break}if(Hn(n.title,l.title)>=jn){n.duplicateOf={sessionKey:l.sessionKey,title:l.title,because:"s\
ame_topic"};break}}}}var Gn=3e4;function Ot(e,t,o=Date.now()){return Object.keys(t).length===0?e:e.map(n=>{let a=t[n.id];
return!a||o-a>Gn||n.state==="running"?n:{...n,state:"running",moving:!0,instructed:!0}})}function X(e,t=Date.now()){let o=[],
n=(l,u,k=1)=>{o.push({signal:l,weight:qn[l]*k,values:u})};e.approvalKind==="subagent"?n("subagent_gate"):e.approvalKind===
"tool"&&n("approval_owed"),e.action==="reply"&&n("input_requested"),e.unverified&&n("unverified_completion"),e.loopRepeats&&
n("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&n("run_failed"),e.stalledFor&&n("stalled",{duration:xe(e.stalledFor)}),
e.changeBlocked&&n("change_blocked"),e.unattendedGoals&&n("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&
n("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let a=Fn(e,t);return a>0&&n("waiting_a_whil\
e",{hours:String(a)},Math.min(a,zn)),o.sort((l,u)=>u.weight-l.weight),{score:o.reduce((l,u)=>l+u.weight,0),signals:o}}var Vn={
approval_owed:"decide",subagent_gate:"decide",input_requested:"answer",unverified_completion:"verify",error_loop:"unbloc\
k",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"resume"};function Tt(e,t=Date.now()){if(e.
state!=="needs-you")return null;for(let o of X(e,t).signals){let n=Vn[o.signal];if(n)return n}return null}var Lt=14400*1e3;
function $t(e,t,o,n=Date.now()){let a=0,l=[];for(let u of e){if(u.state!=="needs-you"){l.push(u);continue}let k=t[u.id];
if(k&&k>n){a+=1;continue}let h=o[u.id];if(h!==void 0&&u.updatedAt<=h){l.push({...u,state:"done",issue:!1});continue}l.push(
u)}return{items:l,snoozedCount:a}}var Jn=4320*60*1e3;function Mt(e,t=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:t-e.updatedAt<=Jn}var Qn={"needs-you":1,running:-1,done:-1};function Xn(e,t,o){let n=e.updatedAt>0,a=t.updatedAt>0;
return!n&&!a?0:n?a?(e.updatedAt-t.updatedAt)*o:-1:1}function Ce(e,t){let o=e.signals.slice(0,2);return o.length===0?t("r\
ank_nothing_pressing"):o.map(a=>t(`rank_${a.signal}`,a.values)).join(t("rank_join"))}function Pt(e,t=Date.now()){let o=new Map(
e.map(n=>[n.id,X(n,t)]));return[...e].sort((n,a)=>{let l=_t[n.state]-_t[a.state];if(l!==0)return l;if(n.state==="needs-y\
ou"){let u=(o.get(a.id)?.score??0)-(o.get(n.id)?.score??0);if(u!==0)return u}else if(n.issue!==a.issue)return n.issue?-1:
1;return Xn(n,a,Qn[n.state])})}function Bt(e,t,o={},n={},a={}){let l=new Map,u=new Map;for(let s of e.slots){if(!s.key||
Dn.has(s.key)||s.memory_mode==="incognito")continue;let w=Bn(s,o[s.key],t);if(w.length>0){for(let g of w)l.set(g.id,g);let y=w.
find(g=>g.state==="needs-you")??w[0];u.set(s.key,y);continue}let d=Wn(s,t);l.set(d.id,d),u.set(s.key,d)}for(let[s,w]of Object.
entries(n)){let d=u.get(s);d&&(d.state="needs-you",d.issue=!0,d.stalledFor=w.silent_secs,d.summary=w.reason?t("stalled_b\
ecause",{reason:w.reason,duration:xe(w.silent_secs)}):t("stalled_for",{duration:xe(w.silent_secs)}),d.action="open")}for(let[
s,w]of Object.entries(a)){let d=u.get(s);d&&(d.state="needs-you",d.issue=!0,d.loopRepeats=w.repeats,d.summary=t("error_l\
oop",{tool:w.tool,repeats:String(w.repeats)}),d.action="open")}for(let s of e.approvals){let w=s.slot?u.get(s.slot):void 0;
if(w){En(w,s,t);continue}l.set(`approval:${s.id}`,{id:`approval:${s.id}`,title:Q(s.tool||s.source,t("approval_needed")),
summary:s.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:W(s.ts),provenance:t("approval"),action:"\
review-approval",approvalKind:Et(s)?"subagent":"tool",permissionId:s.id,permissionTool:s.tool||s.source,permissionPurpose:s.
tool_purpose,references:[{kind:"approval",id:s.id,label:s.tool||s.source||t("approval")}]})}for(let s of e.agents){let w=s.
parent?u.get(s.parent):void 0;if(w){Kn(w,s,t);continue}let d=!!(s.done&&(s.error||s.outcome==="failed"));l.set(`agent:${s.
id}`,{id:`agent:${s.id}`,title:Q(s.task||s.agent,t("agent_work")),summary:d?s.error?.trim()||t("agent_failed",{task:s.task}):
s.done?t("recent_work_ready"):t("work_in_progress"),state:d?"needs-you":s.done?"done":"running",issue:d,runFailed:d||void 0,
retryPath:d&&!s.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(s.id)}/retry`:void 0,updatedAt:W(s.started),provenance:s.
agent||t("agent"),action:"discuss",references:[{kind:"agent",id:s.id,label:s.agent||t("agent")}]})}for(let s of e.workflows){
let w=s.session_key?u.get(s.session_key):void 0;if(w){On(w,s,t);continue}let d=s.status==="failed";l.set(`workflow:${s.run_id}`,
{id:`workflow:${s.run_id}`,title:Q(s.name,s.run_id),summary:d?t("workflow_failed_generic"):s.status==="running"?t("workf\
low_running"):t("workflow_finished"),state:d?"needs-you":s.status==="running"?"running":"done",issue:d,runFailed:d||void 0,
retryPath:d?`/api/workflows/runs/${encodeURIComponent(s.run_id)}/rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"\
discuss",references:[{kind:"workflow",id:s.run_id,label:s.name||s.run_id}]})}for(let s of e.crons){if(!s.is_running&&s.last_status!==
"error")continue;let w=s.last_status==="error";l.set(`monitor:${s.id}`,{id:`monitor:${s.id}`,title:s.name,summary:t(w?"m\
onitor_failed":"monitor_running"),state:w?"needs-you":"running",issue:w,runFailed:w||void 0,retryPath:w?`/api/crons/${encodeURIComponent(
s.id)}/run`:void 0,updatedAt:W(s.running_since||s.last_run_ts||s.created_ts),provenance:t("monitor"),action:w?"discuss":
void 0,references:[{kind:"monitor",id:s.id,label:s.name}]})}let k=[...e.artifacts].sort((s,w)=>W(w.updated_at)-W(s.updated_at)).
slice(0,8);for(let s of k){let w=s.session_key&&u.has(s.session_key)?s.session_key:void 0;l.set(`artifact:${s.slug}`,{id:`\
artifact:${s.slug}`,title:Q(s.name,t("artifact")),summary:s.description||t("artifact_ready",{kind:s.kind}),state:"done",
issue:!1,updatedAt:W(s.updated_at||s.created_at),sessionKey:w,provenance:s.session_title||s.source||t("artifact"),action:w?
"open":void 0,references:[{kind:"artifact",id:s.slug,label:s.name,sessionKey:w},...w?[{kind:"session",id:w,label:s.session_title||
w,sessionKey:w}]:[]]})}let h=[...l.values()];return Yn(h),Pt(h)}function Ie(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}
function Dt(e,t){let o=t.trim().toLowerCase();return o?e.filter(n=>[n.title,n.summary,n.provenance,...n.references.flatMap(
l=>[l.label,l.id,l.url])].join(`
`).toLowerCase().includes(o)):e}function Ne(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function zt(e,t){return e.filter(o=>o.key&&
o.key!==t&&o.memory_mode!=="incognito").sort((o,n)=>qt(n)-qt(o)).slice(0,12)}function qt(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function Ft(e,t){
let o={},n="unknown";for(let a of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(a.key)}/summary`);if(!l||typeof l!=
"object"){n="unsupported";break}if(l.enabled===!1){n="disabled";break}o[a.key]=l,n="available"}catch{n="unsupported";break}
return{summaries:o,support:n}}var Ut=String.raw`
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
    display: grid;
    grid-template-columns: 156px minmax(0, 1fr) minmax(340px, 420px);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--bg);
  }
  .ow-rail {
    min-height: 0;
    padding: 12px;
    border-right: 1px solid var(--border);
    background: var(--bg-hover);
  }
  .ow-rail-inner { display: flex; height: 100%; flex-direction: column; gap: 12px; }
  .ow-search { width: 100%; min-width: 0; }
  .ow-filters { display: flex; flex-direction: column; gap: 4px; }
  .ow-filter { width: 100%; justify-content: space-between; }
  .ow-filter[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    color: var(--accent);
  }
  .ow-count { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .ow-work {
    min-height: 0;
    overflow-y: auto;
    border-right: 1px solid var(--border);
  }
  .ow-work-inner { padding: 16px; }
  .ow-section { margin: 0 0 24px; }
  .ow-section-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ow-section-title {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    font-weight: 650;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ow-section-count { color: var(--muted); font-size: 12px; }
  .ow-section-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
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
  .ow-conductor { display: flex; min-height: 0; flex-direction: column; background: var(--bg-hover); }
  .ow-conductor-title { display: flex; align-items: center; gap: 8px; }
  .ow-conductor-title h2 { margin: 0; color: var(--text-strong); font-size: 15px; font-weight: 650; }
  .ow-private-hint { margin: 4px 0 0; color: var(--muted); font-size: 14px; line-height: 1.45; }
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
  .ow-block-tab:hover .ow-block-name { text-decoration: underline; }
  /* Rows give up their own frame: the enclosing card already provides it. */
  .ow-block[data-grouped='true'] .ow-row {
    border: 0;
    border-top: 1px solid var(--border);
    border-radius: 0;
    background: none;
  }
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
  .ow-chat-panel { display: flex; min-height: 0; width: 100%; flex-direction: column; }
  .ow-chat-messages { min-height: 0; flex: 1; overflow-y: auto; padding: 16px; }
  .ow-chat-empty, .ow-chat-status { padding: 20px 8px; color: var(--muted); font-size: 13px; text-align: center; }
  .ow-chat-message { max-width: 92%; margin-bottom: 12px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-lg, 8px); background: var(--card); }
  .ow-chat-message[data-role='user'] { margin-left: auto; background: var(--aim-subtle); }
  .ow-chat-role { margin-bottom: 4px; color: var(--muted); font-size: 11px; font-weight: 650; }
  .ow-chat-content { color: var(--text); font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; white-space: pre-wrap; }
  /* One visible way in, pushed to the trailing edge of the session header. */
  .ow-block-open { margin-left: auto; flex: none; }

  /* The quote sits inside the composer, so it exists only while something is
     quoted and never displaces the conversation. */
  /* Outside the transcript scroller: an approval that scrolls away reads as a stall. */
  .ow-chat-sent-to { color: var(--accent); font-weight: 500; }
  /* The decision inside a list row: flush to the row's own padding. */
  .ow-row .ow-permission { margin: 10px 0 2px; }

  @keyframes ow-expand { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
  .ow-expand { display: grid; animation: ow-expand 160ms ease; }
  .ow-expand-inner { min-height: 0; overflow: hidden; }
  .ow-steps-head { color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .ow-steps-more { color: var(--muted); font-size: 12px; }
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

  .ow-composer { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); }
  .ow-composer .ow-chat-composer { padding: 0; border-top: 0; }
  .ow-quote {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 10px; border-left: 3px solid var(--accent);
    border-radius: 0 var(--radius-lg, 8px) var(--radius-lg, 8px) 0;
    background: color-mix(in srgb, var(--text) 5%, var(--card));
  }
  /* One line: eyebrow, gap, title. The spans previously abutted ("InstructingCrew…"). */
  .ow-quote-body { display: flex; min-width: 0; flex: 1; align-items: baseline; gap: 8px; }
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
    .ow-filters { flex: 1; flex-direction: row; justify-content: flex-end; }
    .ow-filter { width: auto; justify-content: center; }
    .ow-work { border-right: 0; border-bottom: 1px solid var(--border); }
  }
`;import{Fragment as nn,jsx as i,jsxs as f}from"react/jsx-runtime";var Ae="crew-manager.snoozed",Yt="crew-manager.handled",
Gt="crew-manager.done-collapsed";function We(e,t={}){try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}
function de(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}var j="crew-manager-conductor",Vt=5e3,en=/<crew-manager-delivery>([\s\S]*?)<\/crew-manager-delivery>/g;
function vo(e){let t=[];for(let o of e.matchAll(en))try{let n=JSON.parse(o[1]);typeof n.session=="string"&&typeof n.message==
"string"&&n.message.trim()&&t.push({session:n.session,message:n.message.trim()})}catch{}return t}function bo(e){return e.
replace(en,"").trim()}var ko={session:"Session",approval:"Approval",agent:"Agent",workflow:"Workflow",monitor:"Monitor",
artifact:"Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"Allow or refuse a sub-\
agent held at the spawn gate",information_needed:"Answer the request in the work thread",decision_ready:"Make the decisi\
on this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"Open the linked change \u2014 a check\
 is failing or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"Review the pending\
 {{tool}} request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool call",agent_work:"\
Agent work",agent_failed:"This agent stopped before finishing \u2014 nothing to do here",workflow_failed:"This workflow \
stopped before finishing",workflow_failed_generic:"This workflow stopped before finishing",workflow_running:"Workflow is\
 running",workflow_finished:"Workflow finished",monitor_failed:"The latest check stopped before finishing",monitor_running:"\
Monitor is checking now",artifact_ready:"{{kind}} output is ready",stalled_for:"Check on it \u2014 no activity for {{duration\
}}, still marked running",stalled_because:"{{reason}} Silent for {{duration}}.",duplicate_same_change:"Also being worked\
 in \u201C{{title}}\u201D \u2014 same linked change",duplicate_same_topic:"Looks like the same work as \u201C{{title}}\u201D",
rank_approval_owed:"only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"\
the agent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failu\
re has repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{\
duration}}",rank_change_blocked:"a linked change is failing or conflicting",rank_nobody_on_it:"nobody is on {{count}} un\
finished goal(s) in this session",no_next_step:"No next step recorded \u2014 nobody is on this",rank_queued_behind:"{{co\
unt}} more prompt(s) queued in this session",rank_waiting_a_while:"waiting {{hours}}h",rank_nothing_pressing:"nothing pr\
essing \u2014 ordered by recency",rank_join:", and ",error_loop:"{{tool}} has failed the same way {{repeats}} times in a\
 row",untitled_work:"Untitled work"};function pe(e,t={}){return ko[e].replace(/\{\{(\w+)\}\}/g,(o,n)=>t[n]??"")}var xo={
decide:"DECIDE",answer:"ANSWER",verify:"VERIFY",resume:"RESUME",unblock:"UNBLOCK"},Te={"needs-you":"Needs you",running:"\
Running",done:"Done"},Ee={all:"All","needs-you":"Needs you",running:"Running",done:"Done"},_o={session:Zt,approval:Qt,agent:eo,
workflow:uo,monitor:io,artifact:oo,change:ro,issue:lo};function Z({children:e,onActivate:t,...o}){return i("div",{...o,role:"\
button",tabIndex:0,onClick:t,onKeyDown:n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t())},children:e})}function Le({
label:e,count:t}){return f("div",{className:"ow-section-header",children:[i("h2",{className:"ow-section-title",children:e}),
i("span",{className:"ow-section-count",children:t})]})}function So(e){if(e.state==="needs-you"){let t=Tt(e);return t?i(le,
{variant:"warn",className:"ow-verb",children:xo[t]}):null}return e.state==="running"?e.moving?f(le,{variant:"aim",children:[
i(no,{className:"ow-icon"}),Te[e.state]]}):i(le,{variant:"muted",children:"Queued"}):f(le,{variant:"ok",children:[i(Xt,{
className:"ow-icon"}),Te[e.state]]})}var ce=4,Ro=8;function Co({hits:e,now:t,onOpenSession:o}){return e.length===0?null:
f("section",{className:"ow-section","aria-label":"From past work",children:[i(Le,{label:"From past work",count:e.length}),
i("div",{className:"ow-section-list",children:e.map(n=>i(Z,{className:"ow-row ow-recall-row",onActivate:()=>o(n.session_key),
"data-testid":`recall-${n.session_key}`,children:f("div",{className:"ow-row-layout",children:[f("div",{className:"ow-row\
-content",children:[f("div",{className:"ow-row-heading",children:[i("span",{className:"ow-row-title",children:n.title}),
i("span",{className:"ow-recall-age",children:vt(n.modified,t)})]}),n.snippet&&i("p",{className:"ow-row-summary",children:n.
snippet})]}),f("div",{className:"ow-row-actions",children:[i($,{className:"ow-primary-action",onClick:a=>{a.stopPropagation(),
o(n.session_key)},children:"Open"}),i($e,{className:"ow-icon","aria-hidden":"true"})]})]})},n.session_key))})]})}function tn({
tool:e,purpose:t,busy:o,onAnswer:n,where:a}){return f("div",{className:"ow-permission",children:[f("div",{className:"ow-\
permission-body",children:[f("div",{className:"ow-permission-head",children:[i(so,{className:"ow-icon","aria-hidden":"tr\
ue"}),i("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),f("p",{className:"ow-permiss\
ion-what",children:[a&&f("span",{className:"ow-truncate",children:[a," "]}),a?"wants to run ":"Wants to run ",i("code",{
children:e})]}),t&&i("p",{className:"ow-permission-why",children:t})]}),f("div",{className:"ow-permission-actions",children:[
i($,{onClick:()=>n(!0),disabled:o,children:"Approve"}),i($,{onClick:()=>n(!1),disabled:o,children:"Reject"})]})]})}function Ke({
children:e}){return i("div",{className:"ow-expand",children:i("div",{className:"ow-expand-inner",children:e})})}var Oe=3;function Jt(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(o=>o.label.trim().toLowerCase()!==t)}function Io(e){
let t=[],o=new Map;return e.forEach(n=>{if(!n.sessionKey){t.push({sessionKey:null,items:[n]});return}let a=o.get(n.sessionKey);
if(a){a.push(n);return}let l={sessionKey:n.sessionKey,items:[n]};o.set(n.sessionKey,l.items),t.push(l)}),t}function No({
item:e,onOpen:t}){let o=e.references.find(a=>a.kind==="session"),n=e.references.filter(a=>a.kind!=="session");return f("\
div",{className:"ow-block-tab",children:[i(Zt,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-trunca\
te ow-block-name",children:o?.label??e.provenance}),f("span",{className:"ow-block-tab-meta",children:[i("span",{"aria-hi\
dden":"true",children:"\xB7"}),i("span",{className:"ow-truncate",children:e.provenance}),n.slice(0,2).map(a=>i("span",{className:"\
ow-truncate",children:a.label},`${a.kind}:${a.id}`))]}),i($,{className:"ow-block-open",onClick:t,"aria-label":`Open ${o?.
label??e.provenance}`,children:"Open"})]})}function Ao({reference:e,onOpenSession:t}){let o=_o[e.kind],n=f(nn,{children:[
i(o,{className:"ow-icon"}),i("span",{className:"ow-truncate",children:e.label})]});return e.url?i("a",{className:"ow-ref\
erence ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:a=>a.stopPropagation(),children:n}):
e.sessionKey?i(Z,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:n}):i("span",{className:"\
ow-reference",children:n})}function Wo({item:e,selected:t,continuation:o,whyRanked:n,onSelect:a,onOpenSession:l,onAnswerPermission:u,
permissionBusy:k,onRetry:h,retryBusy:s,onPickStep:w,onSnooze:d,onHandled:y}){return f(Z,{onActivate:a,className:"ow-row",
"aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":void 0,"data-continuation":o?"true":void 0,"dat\
a-testid":`work-item-${e.id}`,children:[f("div",{className:"ow-row-layout",children:[f("div",{className:"ow-row-content",
children:[f("div",{className:"ow-row-heading",children:[So(e),i("span",{className:"ow-row-title",children:e.title})]}),e.
summary&&!(e.nextSteps??[]).some(g=>g.what?.trim()===e.summary)&&i("p",{className:"ow-row-summary",children:e.summary}),
e.duplicateOf&&f(Z,{className:"ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[i(co,{className:"o\
w-icon","aria-hidden":"true"}),i("span",{className:"ow-truncate",children:pe(e.duplicateOf.because==="same_change"?"dupl\
icate_same_change":"duplicate_same_topic",{title:e.duplicateOf.title})})]}),e.goals&&e.goals.length>0&&f("ul",{className:"\
ow-row-goals",children:[e.goals.slice(0,ce).map(g=>i("li",{className:"ow-truncate",children:g},g)),e.goals.length>ce&&f(
"li",{className:"ow-row-goals-more",children:["+",e.goals.length-ce," more"]}),e.doneGoals?.slice(0,ce).map(g=>f("li",{className:"\
ow-row-goal-done",children:[i(to,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-truncate",children:g})]},
`done:${g}`))]}),n&&i("div",{className:"ow-row-why",children:n}),!o&&f("div",{className:"ow-row-meta",children:[i("span",
{className:"ow-truncate",children:e.provenance}),Jt(e).length>0&&i("span",{"aria-hidden":"true",children:"\xB7"}),i("spa\
n",{className:"ow-references",children:Jt(e).slice(0,3).map(g=>i(Ao,{reference:g,onOpenSession:l},`${g.kind}:${g.id}`))})]})]}),
i("div",{className:"ow-row-actions",children:i($e,{className:"ow-icon","aria-hidden":"true"})})]}),t&&w&&e.nextSteps&&e.
nextSteps.length>0&&i(Ke,{children:f("div",{className:"ow-row-steps",children:[i("div",{className:"ow-steps-head",children:"\
Open items"}),e.nextSteps.slice(0,Oe).map((g,_)=>i("button",{type:"button",className:"ow-quote-step",title:g.why??g.what,
onClick:K=>{K.stopPropagation(),w(g.what)},children:g.what},`${_}:${g.what}`)),e.nextSteps.length>Oe&&f("div",{className:"\
ow-steps-more",children:["+",e.nextSteps.length-Oe," more in the session"]})]})}),t&&e.retryPath&&h&&i(Ke,{children:i("d\
iv",{className:"ow-retry",children:i($,{onClick:()=>h(e.retryPath),disabled:!!s,children:"Retry"})})}),t&&e.permissionId&&
u&&i(Ke,{children:i(tn,{tool:e.permissionTool||"a tool",purpose:e.permissionPurpose,busy:!!k,onAnswer:g=>u(e.permissionId,
g)})}),e.state==="needs-you"&&d&&y&&f("div",{className:"ow-row-aside",children:[i("button",{type:"button",className:"ow-\
aside-btn",onClick:g=>{g.stopPropagation(),d(e.id)},children:"Later"}),i("button",{type:"button",className:"ow-aside-btn",
onClick:g=>{g.stopPropagation(),y(e.id,e.updatedAt)},children:"Handled"})]})]})}function ue({title:e,items:t,selectedId:o,
onSelect:n,onOpenSession:a,onAnswerPermission:l,permissionBusy:u,onRetry:k,retryBusy:h,onPickStep:s,onSnooze:w,onHandled:d,
footer:y,collapsed:g,onToggleCollapsed:_,emptyLabel:K}){return f("section",{className:"ow-section","aria-label":e,children:[
_?f(Z,{onActivate:_,className:"ow-section-toggle",children:[i(Le,{label:e,count:t.length}),i($e,{className:"ow-icon ow-s\
ection-chevron","data-open":g?void 0:"true","aria-hidden":"true"})]}):i(Le,{label:e,count:t.length}),g?null:i("div",{className:"\
ow-section-list",children:t.length===0?i("p",{className:"ow-section-empty",children:K}):Io(t).map(O=>f("div",{className:"\
ow-block","data-grouped":O.sessionKey?"true":void 0,children:[O.sessionKey&&i(No,{item:O.items[0],onOpen:()=>a(O.sessionKey)}),
O.items.map((T,ee)=>i(Wo,{item:T,selected:o===T.id,continuation:!!O.sessionKey,whyRanked:T.state==="needs-you"&&T.action!==
"resume"?Ce(X(T),pe):void 0,onSelect:()=>n(T),onOpenSession:a,onAnswerPermission:l,permissionBusy:u,onRetry:k,retryBusy:h,
onPickStep:s,onSnooze:w,onHandled:d},T.id))]},O.sessionKey??O.items[0].id))}),y]})}function Eo(e,t){let o=Kt(t,pe);if(!e)
return["Crew Manager context: workspace overview.",...o,"Act as the Conductor: assess the work and decide whether interv\
ention is warranted.","No referenced session is selected, so discuss only and do not emit a delivery directive.","Always\
 tell the user that you did not intervene and briefly explain why."].join(`
`);let n=e.references.map(l=>`${l.kind}: ${l.label} (${l.id})`).join(`
`),a=e.sessionKey?["You own the decision to intervene in the referenced session. Selection alone does not require interv\
ention.",`If intervention is warranted, append exactly one directive: <crew-manager-delivery>{"session":${JSON.stringify(
e.sessionKey)},"message":"your instruction"}</crew-manager-delivery>`,"Only target that referenced session. The app vali\
dates the target, delivers once, and shows the user a receipt.","Always tell the user whether you intervened and briefly\
 explain why."]:["No referenced session is available, so discuss only and do not emit a delivery directive."];return[`Cr\
ew Manager context: ${e.title}`,...o,`Selected item: ${e.title}`,`State: ${Te[e.state]}`,e.issue?"Issue detected.":void 0,
`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,e.sessionKey?`Referenced session: ${e.sessionKey}`:
"Referenced session: none",`References:
${n}`,"This context was selected silently. Act as the Conductor and decide whether another session needs direction.",...a].
filter(l=>!!l).join(`
`)}function Ko(){let e=po(),t=I(e);t.current=e;let o=go(),n=fo(),[a,l]=v("all"),[u,k]=v(""),[h,s]=v(null),[w,d]=v(null),
[y,g]=v(null),[_,K]=v({}),[O,T]=v("unknown"),ee=I("unknown"),Me=I(new Map),[Pe,Be]=v({}),[De,on]=v({}),[q,qe]=v(!1),[ze,
rn]=v([]),[M,Fe]=v(null),[z,Ue]=v(null),[je,He]=v(()=>We(Ae)),[Ye,sn]=v(()=>We(Yt)),[an,ln]=v(()=>We(Gt,null)??!0),[Ge,dn]=v(
[]),[te,ge]=v(bt),[Ve,Je]=v({}),Qe=I(!0),[cn,Xe]=v(!0),[Ze,fe]=v(null),[un,pn]=v(!1),[we,gn]=v([]),[ne,fn]=v(!1),[H,P]=v(
""),[et,R]=v(null),[F,tt]=v(!1),x=I(!0),Y=I(0),oe=I(0),me=I(!1),nt=I(!1),he=I(new Set),ot=I(null),rt=I(null),st=I(null);
E(()=>(x.current=!0,()=>{x.current=!1,Y.current+=1,oe.current+=1}),[]);let S=C(async()=>{let r=++Y.current,c=t.current;try{
let[p,m,b,ft,wt,mt]=await Promise.all([c.get("/api/chat/slots"),c.get("/api/approvals"),c.get("/api/spawn"),c.get("/api/\
workflows/runs"),c.get("/api/crons"),c.get("/api/artifacts")]);if(!x.current||r!==Y.current)return;g({slots:Array.isArray(
p)?p:[],approvals:Array.isArray(m)?m:[],agents:Array.isArray(b.agents)?b.agents:[],workflows:Array.isArray(ft.runs)?ft.runs:
[],crons:Array.isArray(wt.jobs)?wt.jobs:[],artifacts:Array.isArray(mt.artifacts)?mt.artifacts:[]}),fe(null)}catch(p){x.current&&
r===Y.current&&fe(p instanceof Error?p:new Error("Unable to load Crew Manager sources"))}finally{x.current&&r===Y.current&&
Xe(!1)}},[]);E(()=>{S();let r=window.setInterval(()=>{S()},Vt);return()=>window.clearInterval(r)},[S]);let wn=()=>{Xe(!0),
fe(null),S()};E(()=>{if(!y||ee.current==="unsupported"||ee.current==="disabled")return;let r=zt(y.slots,j).filter(p=>Me.
current.get(p.key)!==Ne(p));if(r.length===0)return;let c=!1;return(async()=>{let{summaries:p,support:m}=await Ft(r,b=>t.
current.get(b));if(!(c||!x.current)&&(ee.current=m,T(m),m==="available")){for(let b of r)p[b.key]&&Me.current.set(b.key,
Ne(b));K(b=>({...b,...p}))}})(),()=>{c=!0}},[y]),E(()=>{if(!y||!Qe.current)return;let r=!1;return(async()=>{try{let c=await t.
current.get("/api/apps/crew-manager/stalls");if(r||!x.current)return;let p={};for(let b of c?.stalls??[])b?.key&&(p[b.key]=
b);Be(p);let m={};for(let b of c?.error_loops??[])b?.key&&(m[b.key]=b);Je(m)}catch{Qe.current=!1,x.current&&(Be({}),Je({}))}})(),
()=>{r=!0}},[y]),E(()=>{if(te.unsupported)return;let r=u.trim();if(!ht(r)){ge(m=>m.hits.length?{...m,hits:[]}:m);return}
let c=!1,p=setTimeout(()=>{(async()=>{try{let m=await t.current.get(xt(r,Ro));if(c||!x.current)return;ge(kt(m))}catch{x.
current&&ge({unsupported:!0,hits:[]})}})()},300);return()=>{c=!0,clearTimeout(p)}},[u,te.unsupported]);let it=L(()=>Ot(Bt(
y??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[]},pe,_,Pe,Ve),De),[y,_,Pe,Ve,De]),re=L(()=>$t(it,je,
Ye),[it,je,Ye]),N=L(()=>re.items.filter(r=>Mt(r)),[re]),ye=L(()=>Ie(N),[N]),A=L(()=>N.find(r=>r.id===h)??null,[N,h]),B=L(
()=>{let r=Dt(N,u);return u.trim()||a==="all"?r:r.filter(c=>c.state===a)},[a,N,u]);E(()=>n(ye["needs-you"]),[ye,n]),E(()=>{
h&&!N.some(r=>r.id===h)&&s(null)},[N,h]),E(()=>{let r=c=>{(c.metaKey||c.ctrlKey)&&c.key.toLocaleLowerCase("en-US")==="k"&&
(c.preventDefault(),document.querySelector('[data-crew-manager-search="true"]')?.focus())};return window.addEventListener(
"keydown",r),()=>window.removeEventListener("keydown",r)},[]);let ve=y?.slots.find(r=>r.key===j),be=!!(ve||un);E(()=>{!y||
ve||me.current||(me.current=!0,e.post("/api/chat/slots",{name:j,title:"Conductor"}).then(()=>{x.current&&(pn(!0),S())}).
catch(r=>{x.current&&(me.current=!1,R(r instanceof Error?`Conductor session could not be created: ${r.message}`:"Conduct\
or session could not be created"))}))},[e,ve,S,y]);let at=C(async r=>{let c=r.flatMap((p,m)=>p.role==="assistant"?vo(p.content).
map(b=>({delivery:b,key:`${p.ts??m}:${b.session}:${b.message}`})):[]);if(!nt.current){c.forEach(p=>he.current.add(p.key)),
nt.current=!0;return}for(let p of c){if(he.current.has(p.key))continue;he.current.add(p.key);let m=ot.current;if(!m||p.delivery.
session!==m){R("Conductor proposed a delivery outside the selected session; Crew Manager blocked it.");continue}try{await t.
current.post("/api/chat",{message:p.delivery.message,slot:p.delivery.session})}catch(b){if(!(b instanceof SyntaxError)){
R(b instanceof Error?b.message:"Conductor delivery failed");continue}}x.current&&d(`Conductor sent direction to ${rt.current??
p.delivery.session}`)}},[]),G=C(async()=>{let r=++oe.current;try{let c=await t.current.get(`/api/chat/slots/${encodeURIComponent(
j)}`);if(!x.current||r!==oe.current)return;let p=Array.isArray(c.messages)?c.messages:[];gn(p),fn(!!c.running),R(null),await at(
p)}catch(c){x.current&&r===oe.current&&R(c instanceof Error?c.message:"Unable to load Conductor")}},[at]);E(()=>{if(!be)
return;G();let r=window.setInterval(()=>{G()},ne?1e3:Vt);return()=>window.clearInterval(r)},[be,ne,G]),E(()=>{let r=st.current;
r&&(r.scrollTop=r.scrollHeight)},[we]);let lt=C(async r=>{let c=t.current;ot.current=A?.sessionKey??null,rt.current=A?.title??
null,d(null),await c.post(`/api/chat/slots/${encodeURIComponent(j)}/context`,{content:Eo(A,N),source:"crew-manager",ephemeral:!0});
try{await c.post("/api/chat",{message:r,slot:j})}catch(p){if(!(p instanceof SyntaxError))throw p}},[A]),dt=C(async r=>{let c=r.
trim();if(!(!c||F)){R(null),tt(!0);try{await lt(c),await G()}catch(p){x.current&&R(p instanceof Error?p.message:"Unable \
to send your message")}finally{x.current&&tt(!1)}}},[F,G,lt]),ct=C(async r=>{let c=r.trim(),p=A;if(!(!c||!p?.sessionKey||
q)){qe(!0),R(null);try{try{await t.current.post("/api/chat",{message:c,slot:p.sessionKey})}catch(m){if(!(m instanceof SyntaxError))
throw m}if(!x.current)return;P(""),dn(m=>[...m,{ts:new Date().toISOString(),target:p.title,message:c}]),s(null),on(m=>({
...m,[p.id]:Date.now()})),rn(m=>m.includes(p.sessionKey)?m:[...m,p.sessionKey]),d(`Sent new instructions to ${p.title}`),
S()}catch(m){x.current&&R(m instanceof Error?`Could not send that to the session: ${m.message}`:"Could not send that to \
the session")}finally{x.current&&qe(!1)}}},[q,S,A]),ut=L(()=>At(y?.approvals??[],ze,r=>N.find(c=>c.sessionKey===r)?.title??
y?.slots?.find(c=>c.key===r)?.title??r),[N,y,ze]),U=A&&!A.permissionId?A:null,V=C(async(r,c)=>{if(!M){Fe(r),R(null);try{
await t.current.post(`/api/approvals/${encodeURIComponent(r)}/${c?"approve":"reject"}`,{}),S()}catch(p){R(p instanceof Error?
`Could not answer that request: ${p.message}`:"Could not answer that request"),S()}finally{x.current&&Fe(null)}}},[S,M]),
mn=C(r=>{He(c=>{let p=Object.fromEntries(Object.entries(c).filter(([,m])=>m>Date.now()));return p[r]=Date.now()+Lt,de(Ae,
p),p}),s(null)},[]),hn=C((r,c)=>{sn(p=>{let m={...p,[r]:c};return de(Yt,m),m}),s(null)},[]),yn=C(()=>{He({}),de(Ae,{})},
[]),vn=C(()=>{ln(r=>(de(Gt,!r),!r))},[]),se=C(async r=>{if(!z){Ue(r),R(null);try{await t.current.post(r,{}),S()}catch(c){
R(c instanceof Error?`Could not re-run it: ${c.message}`:"Could not re-run it"),S()}finally{x.current&&Ue(null)}}},[S,z]),
pt=C(async()=>{let r=H.trim();if(!(!r||F||q)){if(A?.sessionKey){await ct(r);return}P(""),await dt(r)}},[H,ct,F,q,A,dt]),
gt=L(()=>{let r=we.filter(p=>p.content?.trim()&&(p.role==="user"||p.role==="assistant")).map(p=>({...p,sentTo:void 0})),
c=Ge.map(p=>({role:"user",ts:p.ts,content:p.message,sentTo:p.target}));return[...r,...c].sort((p,m)=>(p.ts??"").localeCompare(
m.ts??""))},[we,Ge]),bn=L(()=>yt(te.hits,B),[te.hits,B]),ke={"needs-you":B.filter(r=>r.state==="needs-you"),running:B.filter(
r=>r.state==="running"),done:B.filter(r=>r.state==="done")},J=r=>o(`/chat?sid=${encodeURIComponent(r)}`),ie=r=>{s(c=>c===
r.id?null:r.id),d(null)};return f("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[i("style",
{children:Ut}),i(mo,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what finished \
recently."}),i("div",{className:"ow-body",children:f("div",{className:"ow-layout",children:[i("nav",{className:"ow-rail",
"aria-label":"Crew Manager",children:f("div",{className:"ow-rail-inner",children:[i(ho,{"data-crew-manager-search":"true",
value:u,onChange:r=>k(r.target.value),placeholder:"Search work and projects\u2026 \u2318K","aria-label":"Search work",className:"\
ow-search"}),i("div",{className:"ow-filters",children:Object.keys(Ee).map(r=>f($,{onClick:()=>l(r),"aria-pressed":a===r,
"data-selected":a===r,className:"ow-filter",children:[Ee[r],i("span",{className:"ow-count",children:ye[r]})]},r))})]})}),
i("main",{className:"ow-work",children:f("div",{className:"ow-work-inner",children:[cn?i(jt,{rows:7}):Ze&&!y?i(Ht,{icon:i(
Qt,{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:Ze.message,action:i($,{onClick:wn,children:"\
Try again"})}):B.length===0?i(Ht,{icon:i(ao,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter \
or search for a session, project, PR, or output."}):a==="all"||u.trim()?f(nn,{children:[i(ue,{title:"Needs you",items:ke["\
needs-you"],selectedId:h,onSelect:ie,onSnooze:mn,onHandled:hn,footer:re.snoozedCount>0?f("button",{type:"button",className:"\
ow-aside-note",onClick:yn,children:[re.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:J,onAnswerPermission:(r,c)=>{
V(r,c)},permissionBusy:M!==null,onRetry:r=>{se(r)},retryBusy:z!==null,onPickStep:r=>P(r),emptyLabel:"Nothing needs your \
input right now."}),i(ue,{title:"In progress",items:ke.running,selectedId:h,onSelect:ie,onOpenSession:J,onAnswerPermission:(r,c)=>{
V(r,c)},permissionBusy:M!==null,onRetry:r=>{se(r)},retryBusy:z!==null,onPickStep:r=>P(r),emptyLabel:"Nothing is in progr\
ess right now."}),i(ue,{title:"Done recently",items:ke.done,selectedId:h,onSelect:ie,collapsed:an,onToggleCollapsed:vn,onOpenSession:J,
onAnswerPermission:(r,c)=>{V(r,c)},permissionBusy:M!==null,onRetry:r=>{se(r)},retryBusy:z!==null,onPickStep:r=>P(r),emptyLabel:"\
No recent completed work."})]}):i(ue,{title:Ee[a],items:B,selectedId:h,onSelect:ie,onOpenSession:J,onAnswerPermission:(r,c)=>{
V(r,c)},permissionBusy:M!==null,onRetry:r=>{se(r)},retryBusy:z!==null,onPickStep:r=>P(r),emptyLabel:"No matching work"}),
u.trim()&&i(Co,{hits:bn,now:Date.now(),onOpenSession:J})]})}),f("aside",{className:"ow-conductor","aria-label":"Conducto\
r",children:[f("div",{className:"ow-conductor-header",children:[i("div",{className:"ow-conductor-title",children:i("h2",
{children:"Conductor"})}),i("p",{className:"ow-private-hint",children:"Select work on the left to send it instructions. \
With nothing selected, ask across your work."})]}),i("div",{className:"ow-chat",children:be?f("div",{className:"ow-chat-\
panel",children:[f("div",{ref:st,className:"ow-chat-messages","aria-live":"polite",children:[gt.length===0&&!ne?i("div",
{className:"ow-chat-empty",children:"Conductor is ready."}):gt.map((r,c)=>f("div",{className:"ow-chat-message","data-rol\
e":r.role,children:[f("div",{className:"ow-chat-role",children:[r.role==="user"?"You":"Conductor",r.sentTo&&f("span",{className:"\
ow-chat-sent-to",children:[" \u2192 ",r.sentTo]})]}),i("div",{className:"ow-chat-content",children:bo(r.content)})]},`${r.
ts??"message"}:${c}`)),ne&&i("div",{className:"ow-chat-status",children:"Conductor is working\u2026"})]}),ut.length>0&&i(
"div",{className:"ow-permissions",role:"alert",children:ut.map(r=>i(tn,{tool:r.tool,purpose:r.purpose,where:r.sessionLabel,
busy:M!==null,onAnswer:c=>{V(r.id,c)}},r.id))}),f("div",{className:"ow-composer",children:[U&&f("div",{className:"ow-quo\
te",children:[f("div",{className:"ow-quote-body",children:[i("span",{className:"ow-eyebrow",children:U.sessionKey?"Instr\
ucting":"Quoted"}),i("span",{className:"ow-quote-title",title:U.title,children:U.title})]}),i($,{className:"ow-quote-cle\
ar","aria-label":"Remove the quoted work item",onClick:()=>{s(null),d(null)},children:"Clear"})]}),f("div",{className:"o\
w-chat-composer",children:[i(wo,{value:H,onChange:r=>P(r.target.value),onKeyDown:r=>{r.key==="Enter"&&H.trim()&&(r.preventDefault(),
pt())},placeholder:U?.sessionKey?"New instructions for this session\u2026":"Ask across your work\u2026","aria-label":"Me\
ssage to Conductor",disabled:F||q}),i(yo,{onClick:()=>{pt()},disabled:!H.trim()||F||q,"aria-label":U?.sessionKey?"Send n\
ew instructions to the quoted session":"Send message to Conductor",children:"Send"})]})]}),w&&f("div",{className:"ow-con\
ductor-receipt",role:"status",children:[i(Xt,{className:"ow-icon"}),w]}),et&&i("div",{className:"ow-chat-error",role:"al\
ert",children:et})]}):i("div",{className:"ow-chat-loading",children:i(jt,{rows:4})})})]})]})})]})}export{Ko as default};
