import{Fragment as bn,useCallback as T,useEffect as U,useMemo as G,useRef as oe,useState as _}from"react";import{AlertTriangle as Cn,
Bot as Po,Check as Wn,ChevronRight as be,Check as An,Clock as $o,Package as To,ExternalLink as Bn,MessageSquare as bt,Shield as Mo,
Waves as zo,Search as qo,Tag as Kn,Users as Ln,Zap as Go}from"lucide-react";import{useAppApi as Do,useNavigate as Fo,useNavBadge as Uo,
ChatEmbed as jo}from"@kirocrew/app-sdk";import{Badge as De,Btn as P,ContentSkeleton as kn,EmptyState as ct,Input as Ho,PageHeader as Vo,
SearchInput as Yo}from"@kirocrew/app-sdk/ui";function Bt(e){return e.trim().length>=2}function Kt(e,t){let o=new Set(t.map(d=>d.sessionKey).filter(Boolean)),n=new Set,
s=[];for(let d of e){let i=d?.session_key;!i||o.has(i)||n.has(i)||(n.add(i),s.push(d))}return s}function so(e,t){if(!e)return 0;
let o=e>1e11?e/1e3:e,n=Math.floor((t/1e3-o)/86400);return n>0?n:0}function Lt(e,t){let o=so(e,t);if(o<=0)return"today";if(o===
1)return"yesterday";if(o<7)return`${o} days ago`;if(o<30){let s=Math.floor(o/7);return s===1?"last week":`${s} weeks ago`}
let n=Math.floor(o/30);return n===1?"last month":`${n} months ago`}var Et={unsupported:!1,hits:[]};function Ot(e){return!e||
e.enabled===!1?{unsupported:!0,hits:[]}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:[]).filter(o=>!!o?.session_key)}}
function Pt(e,t){return`/api/apps/crew-manager/recall?${new URLSearchParams({q:e.trim(),limit:String(t)}).toString()}`}function Je(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),n=t%
60;return n===0?`${o} hour${o===1?"":"s"}`:`${o}h ${n}m`}function Ht(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function ot(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function Vt(e,t,o){let n=new Set(t.filter(Boolean));if(n.size===0)return[];
let s=new Set,d=[];for(let i of e){let u=i.slot;!u||!n.has(u)||!i.id||s.has(i.id)||(s.add(i.id),d.push({id:i.id,sessionKey:u,
sessionLabel:o(u),tool:i.tool||"a tool",purpose:i.tool_purpose}))}return d}var $t={"needs-you":0,running:1,done:2};function F(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}var Tt=72;function fe(e,t){
let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let s=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(s.length<=Tt)return s;let d=s.slice(0,Tt),i=d.lastIndexOf(" ");return`${(i>24?d.slice(0,i):d).trim()}\u2026`}
function ne(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var ro=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
ao=/^\((?:code|diff|widget|image)\)$/,io=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
lo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,co=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
uo=/[?？]["'”’)\]]*$/;function Yt(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||ao.test(t)||ro.test(
t)?null:t}function st(e){if(!e.waiting_for_input)return null;let t=Yt(e);return!t||io.test(t)||lo.test(t)?null:co.test(t)||
uo.test(t)?t:null}function Mt(e){return e.pending_approval||st(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":ne(e)?"needs-you":"done"}function po(e,t){if(e.pending_approval)return t("approval_waiting");let o=st(e);return o||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):ne(e)?t("linked_change_issue"):Yt(e)??t("recent_w\
ork_ready"))}function Xe(e,t){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function go(e){return e.pending_approval?"review-approval":st(e)?"reply":"open"}function fo(e,t){
let o=(e.source_links??[]).map(n=>({kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:
`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key,status:Ht(n)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:po(e,t),state:Mt(e),moving:Mt(e)==="running"||void 0,issue:ne(e),updatedAt:F(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:Xe(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:ne(e)||void 0,action:go(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...o]}}function rt(e,t){e.references.
some(o=>o.kind===t.kind&&o.id===t.id)||e.references.push(t)}function Qt(e){return(e.source||"").toLowerCase()==="subagen\
t"}function mo(e,t,o){let n=Qt(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,F(t.ts)),e.summary=o(n?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=n?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,rt(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),
sessionKey:t.slot||e.sessionKey})}function wo(e,t,o){e.updatedAt=Math.max(e.updatedAt,F(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),rt(e,{kind:"agent",id:t.id,
label:t.agent||o("agent"),sessionKey:t.parent||e.sessionKey})}function ho(e,t,o){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow\
_failed",{name:t.name})),rt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function bo(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function ko(e,t,o){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===o}function yo(e){let t=null,o=-1;for(let n of e){let s=n.last_touched_turn??0;s>o&&(o=s,t=n)}return t}function vo(e,t){let o=e.next_steps?.find(s=>s.what?.trim())?.what?.trim();if(o)return o;let n=[...e.progress??[]].reverse().
find(s=>s.trim());return n?n.trim():e.initial_intent?.trim()||t("work_in_progress")}var xo=3;function _o(e,t,o){if(!t?.enabled)
return[];let n=t.intents??[];if(n.length===0)return[];let s=(e.source_links??[]).map(c=>({kind:c.kind==="issue"?"issue":
"change",id:c.url,label:c.kind==="issue"?`issue #${c.number}`:`${c.provider} #${c.number}`,url:c.url,sessionKey:e.key,status:Ht(
c)})),d=[],i=yo(n),h=!!(e.running||e.subagents_running||e.orchestrating)?[]:n.filter(c=>c.state==="in-progress");h.forEach(
c=>{let f=n.indexOf(c),C=(c.next_steps??[]).filter(x=>x.what?.trim());d.push({id:`unattended:${e.key}:${f}`,title:fe(c.title,
e.title||o("untitled_work")),summary:C[0]?.what?.trim()||o("no_next_step"),state:"needs-you",issue:ne(e),updatedAt:F(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:Xe(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:ne(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.
key},...s],nextSteps:C,progress:(c.progress??[]).filter(x=>x.trim()),stale:!!t.stale,lastTouchedTurn:c.last_touched_turn??
0})}),n.forEach((c,f)=>{if(h.includes(c))return;let C=bo(c,e);if(!C)return;let x=(c.next_steps??[]).filter(v=>v.what?.trim());
d.push({id:`intent:${e.key}:${f}`,title:fe(c.title,e.title||o("untitled_work")),summary:vo(c,o),state:C,issue:!1,updatedAt:F(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:Xe(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:ne(
e)||void 0,unverified:c.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...s],nextSteps:x,progress:(c.progress??[]).filter(v=>v.trim()),stale:!!t.stale,lastTouchedTurn:c.
last_touched_turn??0,moving:ko(c,e,i)||void 0})});let y=d.filter(c=>c.state==="needs-you"),l=d.filter(c=>c.state!=="need\
s-you").sort((c,f)=>(f.lastTouchedTurn??0)-(c.lastTouchedTurn??0));return[...y,...l].slice(0,Math.max(xo,y.length))}var Jt=new Set(
["crew-manager-conductor","overwatch-conductor"]),So={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Ro=3;function No(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Me=5;function Xt(e,t,o=Date.now()){let n=it(e),s=on(
e.filter(i=>i.state==="needs-you"),o),d=[`Fleet: ${n["needs-you"]} waiting on the user, ${n.running} in progress, ${n.done}\
 finished recently.`];return s.length===0?(d.push("Nothing is waiting on the user."),d):(d.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Me,s.length)}):`),s.slice(0,Me).forEach((i,u)=>{let h=me(J(i,o),t),y=i.sessionKey?
` [session ${i.sessionKey}]`:"";d.push(`${u+1}. ${i.title} \u2014 ${i.summary} (${h})${y}`)}),s.length>Me&&d.push(`\u2026and ${s.
length-Me} more waiting.`),d)}var Ze=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),zt=.6,qt=2;function et(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!Ze.has(t)))]}function ze(e,t){let o=et(e),n=et(t);if(o.length<qt||n.length<qt)return 0;
let s=o.length<=n.length?o:n,d=new Set(o.length<=n.length?n:o);return s.filter(u=>d.has(u)).length/s.length}function Gt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Dt(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function Ft(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function qe(e,t){
if(Gt(e).find(s=>Gt(t).includes(s)))return"same_change";if(Dt(e).find(s=>Dt(t).includes(s)))return"same_artifact";if(ze(
e.title,t.title)>=zt)return"same_topic";for(let s of Ft(e))for(let d of Ft(t))if(ze(s,d)>=zt)return"same_step";return null}
var Ge={merged:[],split:[]};function Ut(e){return`${e.sessionKey??e.id}|${et(e.title).join(" ")}`}function Ie(e,t){return[
Ut(e),Ut(t)].sort().join("")}function Io(e,t=Ge){let o=e.filter(n=>n.state!=="done"&&n.sessionKey).sort((n,s)=>(n.updatedAt||
0)-(s.updatedAt||0));for(let n=1;n<o.length;n+=1){let s=o[n];for(let d=0;d<n;d+=1){let i=o[d];if(i.sessionKey===s.sessionKey||
t.split.includes(Ie(s,i)))continue;let u=qe(s,i);if(u){s.duplicateOf={sessionKey:i.sessionKey,title:i.title,because:u};break}}}}
var Co=3e4;function Zt(e,t,o=Date.now()){return Object.keys(t).length===0?e:e.map(n=>{let s=t[n.id];return!s||o-s>Co||n.
state==="running"?n:{...n,state:"running",moving:!0,instructed:!0}})}function J(e,t=Date.now()){let o=[],n=(d,i,u=1)=>{o.
push({signal:d,weight:So[d]*u,values:i})};e.approvalKind==="subagent"?n("subagent_gate"):e.approvalKind==="tool"&&n("app\
roval_owed"),e.action==="reply"&&n("input_requested"),e.unverified&&n("unverified_completion"),e.loopRepeats&&n("error_l\
oop",{repeats:String(e.loopRepeats)}),e.runFailed&&n("run_failed"),e.stalledFor&&n("stalled",{duration:Je(e.stalledFor)}),
e.changeBlocked&&n("change_blocked"),e.unattendedGoals&&n("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&
n("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let s=No(e,t);return s>0&&n("waiting_a_whil\
e",{hours:String(s)},Math.min(s,Ro)),o.sort((d,i)=>i.weight-d.weight),{score:o.reduce((d,i)=>d+i.weight,0),signals:o}}var Wo={
approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"un\
block",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function at(e,t=Date.now()){
if(e.state!=="needs-you")return null;for(let o of J(e,t).signals){let n=Wo[o.signal];if(n)return n}return null}var en=14400*
1e3;function tn(e,t,o,n=Date.now()){let s=0,d=[];for(let i of e){if(i.state!=="needs-you"){d.push(i);continue}let u=t[i.
id];if(u&&u>n){s+=1;continue}let h=o[i.id];if(h!==void 0&&i.updatedAt<=h){d.push({...i,state:"done",issue:!1});continue}
d.push(i)}return{items:d,snoozedCount:s}}var Ao=4320*60*1e3;function nn(e,t=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:t-e.updatedAt<=Ao}var Bo={"needs-you":1,running:-1,done:-1};function Ko(e,t,o){let n=e.updatedAt>0,s=t.updatedAt>0;
return!n&&!s?0:n?s?(e.updatedAt-t.updatedAt)*o:-1:1}function me(e,t){let o=e.signals.slice(0,2);return o.length===0?t("r\
ank_nothing_pressing"):o.map(s=>t(`rank_${s.signal}`,s.values)).join(t("rank_join"))}function on(e,t=Date.now()){let o=new Map(
e.map(n=>[n.id,J(n,t)]));return[...e].sort((n,s)=>{let d=$t[n.state]-$t[s.state];if(d!==0)return d;if(n.state==="needs-y\
ou"){let i=(o.get(s.id)?.score??0)-(o.get(n.id)?.score??0);if(i!==0)return i}else if(n.issue!==s.issue)return n.issue?-1:
1;return Ko(n,s,Bo[n.state])})}function sn(e,t,o={},n={},s={},d=Ge){let i=new Map,u=new Map;for(let l of e.slots){if(!l.
key||Jt.has(l.key)||l.memory_mode==="incognito")continue;let c=_o(l,o[l.key],t);if(c.length>0){for(let x of c)i.set(x.id,
x);let C=c.find(x=>x.state==="needs-you")??c[0];u.set(l.key,C);continue}let f=fo(l,t);i.set(f.id,f),u.set(l.key,f)}for(let[
l,c]of Object.entries(n)){let f=u.get(l);f&&(f.state="needs-you",f.issue=!0,f.stalledFor=c.silent_secs,f.summary=c.reason?
t("stalled_because",{reason:c.reason,duration:Je(c.silent_secs)}):t("stalled_for",{duration:Je(c.silent_secs)}),f.action=
"open")}for(let[l,c]of Object.entries(s)){let f=u.get(l);f&&(f.state="needs-you",f.issue=!0,f.loopRepeats=c.repeats,f.summary=
t("error_loop",{tool:c.tool,repeats:String(c.repeats)}),f.action="open")}for(let l of e.approvals){let c=l.slot?u.get(l.
slot):void 0;if(c){mo(c,l,t);continue}i.set(`approval:${l.id}`,{id:`approval:${l.id}`,title:fe(l.tool||l.source,t("appro\
val_needed")),summary:l.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:F(l.ts),provenance:t("\
approval"),action:"review-approval",approvalKind:Qt(l)?"subagent":"tool",permissionId:l.id,permissionTool:l.tool||l.source,
permissionPurpose:l.tool_purpose,references:[{kind:"approval",id:l.id,label:l.tool||l.source||t("approval")}]})}for(let l of e.
agents){let c=l.parent?u.get(l.parent):void 0;if(c){wo(c,l,t);continue}let f=!!(l.done&&(l.error||l.outcome==="failed"));
l.parent&&!f||i.set(`agent:${l.id}`,{id:`agent:${l.id}`,title:fe(l.task||l.agent,t("agent_work")),summary:f?l.error?.trim()||
t("agent_failed",{task:l.task}):l.done?t("agent_done"):t("work_in_progress"),state:f?"needs-you":l.done?"done":"running",
issue:f,runFailed:f||void 0,retryPath:f&&!l.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(l.id)}/retry`:void 0,
updatedAt:F(l.started),provenance:l.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:l.id,label:l.agent||
t("agent")}]})}for(let l of e.workflows){let c=l.session_key?u.get(l.session_key):void 0;if(c){ho(c,l,t);continue}let f=l.
status==="failed";i.set(`workflow:${l.run_id}`,{id:`workflow:${l.run_id}`,title:fe(l.name,l.run_id),summary:f?t("workflo\
w_failed_generic"):l.status==="running"?t("workflow_running"):t("workflow_finished"),state:f?"needs-you":l.status==="run\
ning"?"running":"done",issue:f,runFailed:f||void 0,retryPath:f?`/api/workflows/runs/${encodeURIComponent(l.run_id)}/reru\
n`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:l.run_id,label:l.name||l.
run_id}]})}for(let l of e.crons){if(!l.is_running&&l.last_status!=="error")continue;let c=l.last_status==="error";i.set(
`monitor:${l.id}`,{id:`monitor:${l.id}`,title:l.name,summary:t(c?"monitor_failed":"monitor_running"),state:c?"needs-you":
"running",issue:c,runFailed:c||void 0,retryPath:c?`/api/crons/${encodeURIComponent(l.id)}/run`:void 0,updatedAt:F(l.running_since||
l.last_run_ts||l.created_ts),provenance:t("monitor"),action:c?"discuss":void 0,references:[{kind:"monitor",id:l.id,label:l.
name}]})}let h=[...e.artifacts].sort((l,c)=>F(c.updated_at)-F(l.updated_at)).slice(0,8);for(let l of h){let c=l.session_key&&
u.has(l.session_key)?l.session_key:void 0;i.set(`artifact:${l.slug}`,{id:`artifact:${l.slug}`,title:fe(l.name,t("artifac\
t")),summary:l.description||t("artifact_ready",{kind:l.kind}),state:"done",issue:!1,updatedAt:F(l.updated_at||l.created_at),
sessionKey:c,provenance:l.session_title||l.source||t("artifact"),action:c?"open":void 0,references:[{kind:"artifact",id:l.
slug,label:l.name,sessionKey:c},...c?[{kind:"session",id:c,label:l.session_title||c,sessionKey:c}]:[]]})}let y=[...i.values()];
return Io(y,d),on(y)}function it(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.
filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function rn(e,t){let o=t.trim().toLowerCase();
return o?e.filter(n=>[n.title,n.summary,n.provenance,...n.references.flatMap(d=>[d.label,d.id,d.url])].join(`
`).toLowerCase().includes(o)):e}function an(e){let t=[],o=new Map;for(let n of e){let s=n.sessionKey;if(!s)continue;let d=o.
get(s);if(d){d.count+=1;continue}let i=n.references.find(h=>h.kind==="session")?.label??n.provenance,u={sessionKey:s,label:i,
leading:n,count:1};o.set(s,u),t.push(u)}return t}function lt(e,t,o=Ge){if(t==="pr")return Lo(e);if(t==="goal")return tt(
e,o);let n=[],s=new Map;for(let d of e){let i=d.sessionKey;if(!i){n.push({key:d.id,items:[d],header:null,sessionKey:null,
changeRef:null});continue}let u=s.get(i);if(u){u.items.push(d);continue}let h={key:i,items:[d],header:"session",sessionKey:d.
sessionKey??null,changeRef:null};s.set(i,h),n.push(h)}return n}function Lo(e){let t=[],o=new Map;for(let n of e){let s=n.
references.filter(d=>d.kind==="change"||d.kind==="issue");for(let d of s){let i=`${d.kind}:${d.id}`,u=o.get(i);if(u){u.items.
push(n);continue}let h={key:i,items:[n],header:"pr",sessionKey:null,changeRef:d};o.set(i,h),t.push(h)}}return t}function tt(e,t){
let o=e.map((u,h)=>h),n=u=>{for(;o[u]!==u;)o[u]=o[o[u]],u=o[u];return u},s=(u,h)=>{o[n(h)]=n(u)};for(let u=0;u<e.length;u+=
1)for(let h=u+1;h<e.length;h+=1){let y=e[u],l=e[h];if(!y.sessionKey||!l.sessionKey||y.sessionKey===l.sessionKey)continue;
let c=Ie(y,l);t.split.includes(c)||(t.merged.includes(c)||qe(y,l))&&s(u,h)}let d=[],i=new Map;for(let u=0;u<e.length;u+=
1){let h=n(u),y=i.get(h);if(y){y.items.push(e[u]),y.header="goal";continue}let l={key:`goal:${e[u].id}`,items:[e[u]],header:null,
sessionKey:null,changeRef:null};i.set(h,l),d.push(l)}return d}function ln(e,t){let o=e.references.find(n=>n.kind==="sess\
ion")?.label??"";for(let n of[e.title,o,e.provenance]){let s=nt(n,t);if(s)return s}return null}function nt(e,t){let o=e.
toLowerCase();for(let n of t)if(n.aliases.some(s=>s&&o.includes(s.toLowerCase())))return n.name;return null}function dn(e,t){
let o=e.references.find(i=>i.kind==="session")?.label??"";if(!o)return null;let n=nt(e.title,t);if(!n)return null;let s=t.
find(i=>i.name===n);if(s&&s.aliases.some(i=>i&&o.toLowerCase().includes(i.toLowerCase())))return null;let d=nt(o,t);return!d||
d===n?null:{itemGoal:n,sessionGoal:d}}function cn(e,t){let o=t.flatMap(d=>d.aliases.map(i=>i.toLowerCase())),n=new Set([
"workspace","workspaces","home","src","tmp","documents","desktop"]),s=new Map;for(let d of e){if(!d.key||Jt.has(d.key)||
d.memory_mode==="incognito")continue;let i=d.project;if(!i)continue;let u=i.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop();!u||n.has(u.toLowerCase())||o.some(h=>u.toLowerCase().includes(h)||h.includes(u.toLowerCase()))||s.set(u,(s.get(
u)??0)+1)}return[...s.entries()].map(([d,i])=>({name:d,sessions:i})).sort((d,i)=>i.sessions-d.sessions)}function un(e,t){
let o=new Map;for(let d of e){if(!d.sessionKey||ln(d,t)!==null)continue;let i=d.references.find(u=>u.kind==="session")?.
label??"";for(let u of[d.title,i]){let h=u.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);
for(let y of[3,2])for(let l=0;l+y<=h.length;l+=1){let c=h.slice(l,l+y);if(Ze.has(c[0])||Ze.has(c[y-1])||c[0].length<3||c[y-
1].length<3)continue;let f=c.join(" ");o.has(f)||o.set(f,new Set),o.get(f).add(d.sessionKey)}}}let n=[...o.entries()].map(
([d,i])=>({phrase:d,sessions:i.size})).filter(d=>d.sessions>=2);return n.filter(d=>!n.some(i=>i.phrase!==d.phrase&&i.phrase.
includes(d.phrase)&&i.sessions>=d.sessions)).sort((d,i)=>i.sessions-d.sessions||i.phrase.length-d.phrase.length).map(d=>({
name:d.phrase.replace(/\p{L}+/gu,i=>i[0].toUpperCase()+i.slice(1)),sessions:d.sessions}))}function jt(e){return e.some(t=>t.
state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function pn(e){let t=e.find(n=>n.moving);
if(t)return t;let o=e.find(n=>n.state==="running");return o||[...e].sort((n,s)=>(s.updatedAt||0)-(n.updatedAt||0))[0]}function Eo(e){
let t=[],o=new Set;for(let n of e){let s=n.sessionKey;!s||o.has(s)||(o.add(s),t.push(n.references.find(d=>d.kind==="sess\
ion")?.label??n.provenance))}return t}function gn(e,t,o=Ge){let n=new Map,s=[],d=new Map;for(let l of e){let c=ln(l,t);if(d.
set(l.id,c),c===null){s.push(l);continue}n.has(c)||n.set(c,[]),n.get(c).push(l)}let i=tt(s,o),u=new Map;for(let l of i)u.
set(l.items[0].id,l);let h=[],y=new Set;for(let l of e){let c=d.get(l.id)??null;if(c!==null){if(y.has(c))continue;y.add(
c);let C=n.get(c);h.push({key:`initiative:${c}`,name:c,status:jt(C),sessions:Eo(C),blocks:tt(C,o)});continue}let f=u.get(
l.id);f&&h.push({key:f.key,name:null,status:jt(f.items),sessions:[],blocks:[f]})}return h}function dt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function mn(e,t){return e.filter(o=>o.key&&
o.key!==t&&o.memory_mode!=="incognito").sort((o,n)=>fn(n)-fn(o)).slice(0,12)}function fn(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function wn(e,t){
let o={},n="unknown";for(let s of e)try{let d=await t(`/api/chat/slots/${encodeURIComponent(s.key)}/summary`);if(!d||typeof d!=
"object"){n="unsupported";break}if(d.enabled===!1){n="disabled";break}o[s.key]=d,n="available"}catch{n="unsupported";break}
return{summaries:o,support:n}}var hn=String.raw`
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
  .ow-conductor { display: flex; min-height: 0; flex-direction: column; background: var(--bg); border-left: 1px solid var(--border); }
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
  .ow-pr-status-line { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; color: var(--muted); font-size: 12px; }
  .ow-pr-dot { display: inline-flex; align-items: center; gap: 6px; color: var(--ok); }
  .ow-pr-dot::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .ow-pr-dot[data-bad='true'] { color: var(--danger); }
  .ow-pr-sublabel { padding: 6px 12px 2px; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
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
  .ow-init-chevron { flex: none; transition: transform 0.15s ease; }
  .ow-init-chevron[data-open='true'] { transform: rotate(90deg); }
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
`;import{Fragment as We,jsx as a,jsxs as g}from"react/jsx-runtime";var ut="crew-manager.snoozed",yn="crew-manager.handled",
vn="crew-manager.done-collapsed",pt="crew-manager.goal-verdicts",xn="crew-manager.initiative-collapsed";function Ce(e,t={}){
try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}function se(e,t){try{localStorage.setItem(e,JSON.
stringify(t))}catch{}}var we="crew-manager-conductor",Qo=5e3,Jo={session:"Session",approval:"Approval",agent:"Agent",workflow:"\
Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"\
Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer the request in the work thread",decision_ready:"\
Make the decision this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"Open the linked c\
hange \u2014 a check is failing or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"\
Review the pending {{tool}} request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool\
 call",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"This agent stopped before finishing \u2014 \
nothing to do here",workflow_failed:"This workflow stopped before finishing",workflow_failed_generic:"This workflow stop\
ped before finishing",workflow_running:"Workflow is running",workflow_finished:"Workflow finished",monitor_failed:"The l\
atest check stopped before finishing",monitor_running:"Monitor is checking now",artifact_ready:"{{kind}} output is ready",
stalled_for:"Check on it \u2014 no activity for {{duration}}, still marked running",stalled_because:"{{reason}} Silent f\
or {{duration}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same linked change",duplicate_same_artifact:"\
Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_topic:"Looks like the same work as \u201C{{ti\
tle}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same work",rank_approval_owed:"\
only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"the a\
gent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failure ha\
s repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{durat\
ion}}",rank_change_blocked:"a linked change is failing or conflicting",rank_nobody_on_it:"nobody is on {{count}} unfinis\
hed goal(s) in this session",no_next_step:"No next step recorded \u2014 nobody is on this",rank_queued_behind:"{{count}}\
 more prompt(s) queued in this session",rank_waiting_a_while:"waiting {{hours}}h",rank_nothing_pressing:"nothing pressin\
g \u2014 ordered by recency",rank_join:", and ",error_loop:"{{tool}} has failed the same way {{repeats}} times in a row",
untitled_work:"Untitled work"};function re(e,t={}){return Jo[e].replace(/\{\{(\w+)\}\}/g,(o,n)=>t[n]??"")}var Xo={followup:"\
FOLLOW UP",unblock:"UNBLOCK"},ke={"needs-you":"Needs you",running:"Running",done:"Done"},gt={all:"All","needs-you":"Need\
s you",running:"Running",done:"Done"},_n={all:"All",failing:"Failing",running:"Running",merged:"Merged"},Zo={session:bt,
approval:Cn,agent:Po,workflow:Go,monitor:zo,artifact:To,change:Bn,issue:Kn};function Y({children:e,onActivate:t,...o}){return a(
"div",{...o,role:"button",tabIndex:0,onClick:t,onKeyDown:n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t())},children:e})}
function wt({label:e,count:t,subtitle:o}){return g("div",{className:"ow-section-header",children:[g("div",{className:"ow\
-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow-section-count",children:t})]}),
o&&a("p",{className:"ow-section-subtitle",children:o})]})}function kt(e){if(e.state==="needs-you"){let t=at(e);return t?
a(De,{variant:"warn",className:"ow-verb",children:Xo[t]}):null}return e.state==="running"?e.moving?g(De,{variant:"aim",children:[
a($o,{className:"ow-icon"}),ke[e.state]]}):a(De,{variant:"muted",children:"Queued"}):g(De,{variant:"ok",children:[a(An,{
className:"ow-icon"}),ke[e.state]]})}var es=8;function ts({hits:e,now:t,onOpenSession:o}){return e.length===0?null:g("section",{className:"ow-section","aria-\
label":"From past work",children:[a(wt,{label:"From past work",count:e.length}),a("div",{className:"ow-section-list",children:e.
map(n=>a(Y,{className:"ow-row ow-recall-row",onActivate:()=>o(n.session_key),"data-testid":`recall-${n.session_key}`,children:g(
"div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[g("div",{className:"ow-row-head\
ing",children:[a("span",{className:"ow-row-title",children:n.title}),a("span",{className:"ow-recall-age",children:Lt(n.modified,
t)})]}),n.snippet&&a("p",{className:"ow-row-summary",children:n.snippet})]}),g("div",{className:"ow-row-actions",children:[
a(P,{className:"ow-primary-action",onClick:s=>{s.stopPropagation(),o(n.session_key)},children:"Open"}),a(be,{className:"\
ow-icon","aria-hidden":"true"})]})]})},n.session_key))})]})}function En({tool:e,purpose:t,busy:o,onAnswer:n,where:s}){return g(
"div",{className:"ow-permission",children:[g("div",{className:"ow-permission-body",children:[g("div",{className:"ow-perm\
ission-head",children:[a(Mo,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",children:"\
Waiting for your permission"})]}),g("p",{className:"ow-permission-what",children:[s&&g("span",{className:"ow-truncate",children:[
s," "]}),s?"wants to run ":"Wants to run ",a("code",{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),
g("div",{className:"ow-permission-actions",children:[a(P,{onClick:()=>n(!0),disabled:o,children:"Approve"}),a(P,{onClick:()=>n(
!1),disabled:o,children:"Reject"})]})]})}function ft({children:e}){return a("div",{className:"ow-expand",children:a("div",
{className:"ow-expand-inner",children:e})})}var mt=3;function Sn(e){let t=e.provenance.trim().toLowerCase();return e.references.
filter(o=>o.label.trim().toLowerCase()!==t)}function ns({candidates:e,prominent:t,busy:o,onAdd:n}){let[s,d]=_(""),i=t?e:
e.filter(u=>u.sessions>=2);return g("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{
className:"ow-bootstrap-head",children:t?"No big goals defined yet":i.length>0?"Suggested goals":"Add a goal"}),(t||i.length>
0)&&a("div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, o\
r name your own."}),i.length>0&&a("div",{className:"ow-bootstrap-chips",children:i.slice(0,4).map(u=>g("button",{type:"b\
utton",className:"ow-bootstrap-chip",disabled:o,onClick:()=>n(u.name,[u.name]),children:[u.name," ",g("span",{className:"\
ow-bootstrap-count",children:[u.sessions," session",u.sessions===1?"":"s"]})]},u.name))}),g("div",{className:"ow-bootstr\
ap-custom",children:[a(Ho,{value:s,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:u=>d(
u.target.value),onKeyDown:u=>{u.key==="Enter"&&s.trim()&&(n(s),d(""))}}),a(P,{disabled:o||!s.trim(),onClick:()=>{n(s),d(
"")},children:"Add goal"})]})]})}function Rn({members:e}){let t=e[0],o=new Set(e.map(u=>u.sessionKey).filter(Boolean)).size,
n=e.filter(u=>u.state==="needs-you").length,s=e.filter(u=>u.state==="running").length,d=e.filter(u=>u.state==="done").length,
i=[`${o} session${o===1?"":"s"}`];return n&&i.push(`${n} need${n===1?"s":""} you`),s&&i.push(`${s} running`),d&&i.push(`${d}\
 done`),g("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),
a("div",{className:"ow-digest-counts",children:i.join(" \xB7 ")})]})}function Nn({block:e,status:t,folded:o,onToggle:n,onSplit:s,
selected:d,onSelect:i}){let u=e.items[0],h=new Set(e.items.map(c=>c.sessionKey).filter(Boolean)).size,y=[];for(let c=0;c<
e.items.length;c+=1)for(let f=c+1;f<e.items.length;f+=1)e.items[c].sessionKey!==e.items[f].sessionKey&&y.push(Ie(e.items[c],
e.items[f]));let l=g(We,{children:[n&&a("button",{type:"button",className:"ow-goal-fold","aria-label":o?`Expand ${u.title}`:
`Collapse ${u.title}`,"aria-expanded":!o,onClick:c=>{c.stopPropagation(),n()},children:a(be,{className:"ow-icon ow-init-\
chevron","data-open":o?void 0:"true","aria-hidden":"true"})}),a(Ln,{className:"ow-icon","aria-hidden":"true"}),a("span",
{className:"ow-truncate ow-block-name",children:u.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:ke[t]}),
g("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),g("span",{className:"\
ow-truncate",children:[h," sessions, one goal"]})]}),s&&a(P,{className:"ow-block-open",title:"Not the same goal \u2014 split \
into separate cards","aria-label":`Split ${u.title}`,onClick:c=>{c.stopPropagation(),s(y)},children:"Split"})]});return i?
a(Y,{onActivate:i,className:"ow-block-tab ow-goal-tab","aria-pressed":d,"data-selected":d?"true":void 0,children:l}):a("\
div",{className:"ow-block-tab",children:l})}var os=.3;function In({item:e,items:t,onMerge:o}){let n=t.filter(s=>s.id!==e.
id&&s.sessionKey&&e.sessionKey&&s.sessionKey!==e.sessionKey).map(s=>({other:s,score:qe(e,s)?1:ze(e.title,s.title)})).filter(
s=>s.score>=os).sort((s,d)=>d.score-s.score).slice(0,2);return n.length===0?null:g("div",{className:"ow-merge-hint",children:[
a("span",{className:"ow-merge-hint-label",children:"Same goal?"}),n.map(({other:s})=>g("button",{type:"button",className:"\
ow-merge-hint-btn ow-truncate",onClick:()=>o(Ie(e,s)),children:["Merge with \u201C",s.title,"\u201D"]},s.id))]})}function ss({
item:e,onOpen:t}){let o=e.references.find(s=>s.kind==="session"),n=e.references.filter(s=>s.kind!=="session");return g("\
div",{className:"ow-block-tab",children:[a(bt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-trunca\
te ow-block-name",children:o?.label??e.provenance}),g("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hi\
dden":"true",children:"\xB7"}),a("span",{className:"ow-truncate",children:e.provenance}),n.slice(0,2).map(s=>a("span",{className:"\
ow-truncate",children:s.label},`${s.kind}:${s.id}`))]}),a(P,{className:"ow-block-open",onClick:t,"aria-label":`Open ${o?.
label??e.provenance}`,children:"Open"})]})}function rs({session:e,selected:t,onSelect:o,onOpen:n}){return g(Y,{onActivate:o,
className:"ow-srow","data-selected":t,children:[a(bt,{className:"ow-icon","aria-hidden":"true"}),g("div",{className:"ow-\
srow-body",children:[a("div",{className:"ow-srow-name ow-truncate",children:e.label}),a("div",{className:"ow-srow-state \
ow-truncate",children:e.leading.summary})]}),a("span",{className:"ow-srow-badge",children:kt(e.leading)}),a(P,{className:"\
ow-srow-open","aria-label":`Open ${e.label}`,onClick:s=>{s.stopPropagation(),n()},children:"Open"})]})}function as({reference:e,
checks:t}){let o=e.status?/fail|conflict|closed/.test(e.status):!1;return g("div",{className:"ow-pr-head",children:[g("d\
iv",{className:"ow-pr-head-top",children:[a("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&a("a",
{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,
children:a(Bn,{className:"ow-icon","aria-hidden":"true"})})]}),a("div",{className:"ow-pr-status-line",children:t?.available&&
(t.total??0)>0?g("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total,
" checks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&a("span",{className:"ow-pr-dot","data-ba\
d":o?"true":void 0,children:e.status})})]})}function is({reference:e,onOpenSession:t}){let o=Zo[e.kind],n=g(We,{children:[
a(o,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.label})]});return e.url?a("a",{className:"ow-ref\
erence ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:s=>s.stopPropagation(),children:n}):
e.sessionKey?a(Y,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:n}):a("span",{className:"\
ow-reference",children:n})}function ht({item:e,selected:t,continuation:o,whyRanked:n,onSelect:s,onOpenSession:d,onAnswerPermission:i,
permissionBusy:u,onRetry:h,retryBusy:y,onPickStep:l,onSnooze:c,onHandled:f,hideBadge:C,compact:x,headless:v,sessionMismatch:O,
onFixSessionName:I}){let[N,V]=_(!1);return g(Y,{onActivate:s,className:"ow-row","aria-pressed":t,"data-selected":t,"data\
-instructed":e.instructed?"true":void 0,"data-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[
g("div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[!v&&g("div",{className:"ow-ro\
w-heading",children:[C?e.state==="done"&&a(Wn,{className:"ow-icon ow-row-check","aria-hidden":"true"}):kt(e),a("span",{className:"\
ow-row-title",children:e.title})]}),(!x||t)&&e.summary&&!(e.nextSteps??[]).some(k=>k.what?.trim()===e.summary)&&a("p",{className:"\
ow-row-summary",children:e.summary}),e.duplicateOf&&g(Y,{className:"ow-row-duplicate",onActivate:()=>d(e.duplicateOf.sessionKey),
children:[a(Ln,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:re(`duplicate_${e.
duplicateOf.because}`,{title:e.duplicateOf.title})})]}),n&&a("div",{className:"ow-row-why",children:n}),!o&&g("div",{className:"\
ow-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),Sn(e).length>0&&a("span",{"aria-hidden":"\
true",children:"\xB7"}),a("span",{className:"ow-references",children:Sn(e).slice(0,3).map(k=>a(is,{reference:k,onOpenSession:d},
`${k.kind}:${k.id}`))})]}),O&&I&&g("div",{className:"ow-row-mismatch",children:[g("span",{className:"ow-truncate",children:[
"This session's name only mentions ",O.sessionGoal," \u2014 this is ",O.itemGoal," work"]}),a("button",{type:"button",className:"\
ow-mismatch-fix",onClick:k=>{k.stopPropagation(),I()},children:"Rename session to cover both"})]})]}),a("div",{className:"\
ow-row-actions",children:a(be,{className:"ow-icon","aria-hidden":"true"})})]}),t&&l&&e.nextSteps&&e.nextSteps.length>0&&
a(ft,{children:g("div",{className:"ow-row-steps",children:[a("div",{className:"ow-steps-head",children:"Suggested next s\
teps"}),e.nextSteps.slice(0,N?void 0:mt).map((k,j)=>a("button",{type:"button",className:"ow-quote-step",title:k.why??k.what,
onClick:Ae=>{Ae.stopPropagation(),l(k.what)},children:k.what},`${j}:${k.what}`)),e.nextSteps.length>mt&&a("button",{type:"\
button",className:"ow-steps-more",onClick:k=>{k.stopPropagation(),V(j=>!j)},children:N?"Show fewer":`+${e.nextSteps.length-
mt} more`})]})}),t&&e.retryPath&&h&&a(ft,{children:a("div",{className:"ow-retry",children:a(P,{onClick:()=>h(e.retryPath),
disabled:!!y,children:"Retry"})})}),t&&e.permissionId&&i&&a(ft,{children:a(En,{tool:e.permissionTool||"a tool",purpose:e.
permissionPurpose,busy:!!u,onAnswer:k=>i(e.permissionId,k)})}),e.state==="needs-you"&&c&&f&&g("div",{className:"ow-row-a\
side",children:[a("button",{type:"button",className:"ow-aside-btn",onClick:k=>{k.stopPropagation(),c(e.id)},children:"La\
ter"}),a("button",{type:"button",className:"ow-aside-btn",onClick:k=>{k.stopPropagation(),f(e.id,e.updatedAt)},children:"\
Handled"})]})]})}var ls=["unblock","followup","running","done"],ds={unblock:{label:"UNBLOCK",cls:"ow-lane-unblock"},followup:{
label:"FOLLOW UP",cls:"ow-lane-followup"}};function cs(e){return e.state==="done"?"done":e.state==="running"?"running":at(
e)??"unblock"}function us({items:e,selectedId:t,onSelect:o,onOpenSession:n,onAnswerPermission:s,permissionBusy:d,onRetry:i,
retryBusy:u,onPickStep:h,onSnooze:y,onHandled:l,doneTitles:c}){let[f,C]=_(!1),x=new Map;for(let v of e){let O=cs(v),I=x.
get(O);I?I.push(v):x.set(O,[v])}return g(We,{children:[ls.filter(v=>x.has(v)).map(v=>{let O=x.get(v),I=v==="unblock"||v===
"followup"?ds[v]:null,N=I?O.map(k=>k.action!=="resume"?me(J(k),re):""):[],V=I&&N.length>0&&N.every(k=>k&&k===N[0])?N[0]:
void 0;return g("div",{className:"ow-lane",children:[I&&g("div",{className:"ow-lane-head",children:[a("span",{className:`\
ow-lane-badge ${I.cls}`,children:I.label}),V&&a("span",{className:"ow-lane-reason",children:V})]}),O.map(k=>a(ht,{item:k,
hideBadge:!0,compact:!0,selected:t===k.id,continuation:!0,whyRanked:V?void 0:k.state==="needs-you"&&k.action!=="resume"?
me(J(k),re):void 0,onSelect:()=>o(k),onOpenSession:n,onAnswerPermission:s,permissionBusy:d,onRetry:i,retryBusy:u,onPickStep:h,
onSnooze:y,onHandled:l},k.id))]},v)}),!x.has("done")&&c&&c.length>0&&g("div",{className:"ow-lane ow-lane-done",children:[
g("button",{type:"button",className:"ow-goals-toggle","aria-expanded":f,onClick:()=>C(v=>!v),children:[a(be,{className:"\
ow-icon","data-open":f?"true":void 0,"aria-hidden":"true"}),c.length," done"]}),f&&a("ul",{className:"ow-done-list",children:c.
map(v=>g("li",{className:"ow-row-goal-done",children:[a(Wn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"\
ow-truncate",children:v})]},v))})]})]})}function he({title:e,items:t,selectedId:o,onSelect:n,onOpenSession:s,onAnswerPermission:d,
permissionBusy:i,onRetry:u,retryBusy:h,onPickStep:y,onSnooze:l,onHandled:c,footer:f,collapsed:C,onToggleCollapsed:x,groupBy:v,
prChecks:O,prFilter:I,doneBySession:N,goalVerdicts:V,onSplitGoal:k,onMergeGoal:j,initiativeBlocks:Ae,initiatives:Be,onRenameSession:ae,
collapsedInitiatives:ye,onToggleInitiative:ie,selectedGoalKey:ve,onSelectGoal:X,subtitle:xe,emptyLabel:_e}){let Se=lt(t,
v,V),M=v==="pr"&&I&&I!=="all"?Se.filter(w=>w.changeRef&&ot(w.changeRef,O?.[w.changeRef.url??""])===I):Se,le=Ae??[],D=v===
"goal"?le.length:v==="pr"?M.length:t.length,Ke=w=>g("div",{className:"ow-block","data-grouped":w.header?"true":void 0,children:[
w.header==="session"&&w.sessionKey&&a(ss,{item:w.items[0],onOpen:()=>s(w.sessionKey)}),w.header==="pr"&&w.changeRef&&a(as,
{reference:w.changeRef,checks:O?.[w.changeRef.url??""]}),w.header==="goal"&&a(Nn,{block:w,onSplit:k,selected:ve===w.key,
onSelect:X?()=>X(w.key):void 0}),w.header==="pr"?g(We,{children:[a("div",{className:"ow-pr-sublabel",children:"Sessions \
on this PR"}),an(w.items).map(S=>a(rs,{session:S,selected:o===S.leading.id,onSelect:()=>n(S.leading),onOpen:()=>s(S.sessionKey)},
S.sessionKey))]}):w.header==="session"?a(us,{items:w.items,doneTitles:w.sessionKey?N?.[w.sessionKey]:void 0,selectedId:o,
onSelect:n,onOpenSession:s,onAnswerPermission:d,permissionBusy:i,onRetry:u,retryBusy:h,onPickStep:y,onSnooze:l,onHandled:c}):
w.items.map(S=>g(bn,{children:[a(ht,{item:S,selected:o===S.id,continuation:w.header==="session",whyRanked:S.state==="nee\
ds-you"&&S.action!=="resume"?me(J(S),re):void 0,onSelect:()=>n(S),onOpenSession:s,onAnswerPermission:d,permissionBusy:i,
onRetry:u,retryBusy:h,onPickStep:y,onSnooze:l,onHandled:c}),v==="goal"&&j&&o===S.id&&a(In,{item:S,items:t,onMerge:j})]},
S.id))]},w.key),de=(w,S)=>{let B=Be&&ae?dn(w,Be):null,z=w.references.find($=>$.kind==="session")?.label??"";return g(bn,
{children:[a(ht,{item:w,selected:o===w.id,headless:S!==null&&w.title===S,sessionMismatch:B??void 0,onFixSessionName:B&&w.
sessionKey?()=>ae(w.sessionKey,`${z} & ${B.itemGoal}`.slice(0,200)):void 0,whyRanked:w.state==="needs-you"&&w.action!=="\
resume"?me(J(w),re):void 0,onSelect:()=>n(w),onOpenSession:s,onAnswerPermission:d,permissionBusy:i,onRetry:u,retryBusy:h,
onPickStep:y,onSnooze:l,onHandled:c}),j&&o===w.id&&a(In,{item:w,items:t,onMerge:j})]},w.id)},Le=w=>{if(w.name){let z=ye?.[w.
key]??w.status!=="needs-you",$=w.blocks.flatMap(ce=>ce.items);return g("div",{className:"ow-block","data-grouped":"true",
children:[g(Y,{onActivate:()=>ie?.(w.key,!z),className:"ow-block-tab","aria-expanded":!z,children:[a(be,{className:"ow-i\
con ow-init-chevron","data-open":z?void 0:"true","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",
children:w.name}),a("span",{className:"ow-init-status","data-status":w.status,children:ke[w.status]}),g("span",{className:"\
ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),g("span",{className:"ow-truncate",children:[
w.sessions.length," session",w.sessions.length===1?"":"s"]})]})]}),z?a(Rn,{members:$}):$.map(ce=>de(ce,null))]},w.key)}let S=w.
blocks[0];if(S.header==="goal"){let z=ye?.[w.key]??w.status!=="needs-you";return g("div",{className:"ow-block","data-gro\
uped":"true",children:[a(Nn,{block:S,status:w.status,folded:z,onToggle:ie?()=>ie(w.key,!z):void 0,onSplit:k,selected:ve===
S.key,onSelect:X?()=>X(S.key):void 0}),z?a(Rn,{members:S.items}):S.items.map($=>de($,S.items[0].title))]},w.key)}let B=S.
items[0];return g("div",{className:"ow-block","data-grouped":"true",children:[g(Y,{onActivate:()=>n(B),className:"ow-blo\
ck-tab ow-goal-tab","aria-pressed":o===B.id,"data-selected":o===B.id?"true":void 0,children:[kt(B),a("span",{className:"\
ow-truncate ow-block-name",children:B.title})]}),de(B,B.title)]},w.key)};return g("section",{className:"ow-section","ari\
a-label":e,children:[x?g(Y,{onActivate:x,className:"ow-section-toggle",children:[a(wt,{label:e,count:D,subtitle:xe}),a(be,
{className:"ow-icon ow-section-chevron","data-open":C?void 0:"true","aria-hidden":"true"})]}):a(wt,{label:e,count:D,subtitle:xe}),
C?null:a("div",{className:"ow-section-list",children:v==="goal"?le.length===0?a("p",{className:"ow-section-empty",children:_e}):
le.map(Le):M.length===0?a("p",{className:"ow-section-empty",children:_e}):M.map(Ke)}),f]})}function ps(e,t){let o=Xt(t,re);
if(!e)return["Crew Manager context: workspace overview.",...o,"Answer the user about the state of their work. This is a \
conversation, not an action channel."].join(`
`);let n=e.references.map(s=>`${s.kind}: ${s.label} (${s.id})`).join(`
`);return[`Crew Manager context: ${e.title}`,...o,`Selected item: ${e.title}`,`State: ${ke[e.state]}`,e.issue?"Issue det\
ected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,e.sessionKey?`Referenced session: ${e.
sessionKey}`:"Referenced session: none",`References:
${n}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(s=>!!s).join(`
`)}function gs(){let e=Do(),t=oe(e);t.current=e;let o=Fo(),n=Uo(),[s,d]=_("all"),[i,u]=_("session"),[h,y]=_("all"),[l,c]=_(
{}),[f,C]=_(""),[x,v]=_(null),[O,I]=_(null),[N,V]=_(null),[k,j]=_({}),[Ae,Be]=_("unknown"),ae=oe("unknown"),ye=oe(new Map),
[ie,ve]=_({}),[X,xe]=_({}),[_e,Se]=_([]),[M,le]=_(null),[D,Ke]=_(null),[de,Le]=_(()=>Ce(ut)),[w,S]=_(()=>Ce(yn)),[B,z]=_(
()=>Ce(pt,{merged:[],split:[]})),[$,ce]=_([]),[On,Pn]=_(()=>Ce(xn)),[Ee,Oe]=_(null),[$n,Tn]=_(()=>Ce(vn,null)??!0),[Pe,Fe]=_(
Et),[yt,vt]=_({}),xt=oe(!0),[Mn,_t]=_(!0),[St,Ue]=_(null),[zn,qn]=_(!1),[Rt,Re]=_(null),W=oe(!0),Ne=oe(0),je=oe(!1);U(()=>(W.
current=!0,()=>{W.current=!1,Ne.current+=1}),[]);let K=T(async()=>{let r=++Ne.current,p=t.current;try{let[m,b,R,A,Te,At]=await Promise.
all([p.get("/api/chat/slots"),p.get("/api/approvals"),p.get("/api/spawn"),p.get("/api/workflows/runs"),p.get("/api/crons"),
p.get("/api/artifacts")]);if(!W.current||r!==Ne.current)return;V({slots:Array.isArray(m)?m:[],approvals:Array.isArray(b)?
b:[],agents:Array.isArray(R.agents)?R.agents:[],workflows:Array.isArray(A.runs)?A.runs:[],crons:Array.isArray(Te.jobs)?Te.
jobs:[],artifacts:Array.isArray(At.artifacts)?At.artifacts:[]}),Ue(null)}catch(m){W.current&&r===Ne.current&&Ue(m instanceof
Error?m:new Error("Unable to load Crew Manager sources"))}finally{W.current&&r===Ne.current&&_t(!1)}},[]);U(()=>{K();let r=window.
setInterval(()=>{K()},Qo);return()=>window.clearInterval(r)},[K]);let Gn=()=>{_t(!0),Ue(null),K()};U(()=>{if(!N||ae.current===
"unsupported"||ae.current==="disabled")return;let r=mn(N.slots,we).filter(m=>ye.current.get(m.key)!==dt(m));if(r.length===
0)return;let p=!1;return(async()=>{let{summaries:m,support:b}=await wn(r,R=>t.current.get(R));if(!(p||!W.current)&&(ae.current=
b,Be(b),b==="available")){for(let R of r)m[R.key]&&ye.current.set(R.key,dt(R));j(R=>({...R,...m}))}})(),()=>{p=!0}},[N]),
U(()=>{if(!N||!xt.current)return;let r=!1;return(async()=>{try{let p=await t.current.get("/api/apps/crew-manager/stalls");
if(r||!W.current)return;let m={};for(let R of p?.stalls??[])R?.key&&(m[R.key]=R);ve(m);let b={};for(let R of p?.error_loops??
[])R?.key&&(b[R.key]=R);vt(b)}catch{xt.current=!1,W.current&&(ve({}),vt({}))}})(),()=>{r=!0}},[N]),U(()=>{let r=!1;return(async()=>{
try{let p=await t.current.get("/api/apps/crew-manager/initiatives");if(r||!W.current)return;ce((p?.initiatives??[]).filter(
m=>m?.name))}catch{}})(),()=>{r=!0}},[]),U(()=>{if(Pe.unsupported)return;let r=f.trim();if(!Bt(r)){Fe(b=>b.hits.length?{
...b,hits:[]}:b);return}let p=!1,m=setTimeout(()=>{(async()=>{try{let b=await t.current.get(Pt(r,es));if(p||!W.current)return;
Fe(Ot(b))}catch{W.current&&Fe({unsupported:!0,hits:[]})}})()},300);return()=>{p=!0,clearTimeout(m)}},[f,Pe.unsupported]);
let Nt=G(()=>Zt(sn(N??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[]},re,k,ie,yt,B),X),[N,k,ie,yt,X,
B]),$e=G(()=>tn(Nt,de,w),[Nt,de,w]),L=G(()=>$e.items.filter(r=>nn(r)),[$e]),He=G(()=>it(L),[L]),It=G(()=>{let r={};for(let p of L){
if(p.state!=="done"||!p.sessionKey)continue;let m=r[p.sessionKey];m?m.push(p.title):r[p.sessionKey]=[p.title]}return r},
[L]),Q=G(()=>L.find(r=>r.id===x)??null,[L,x]),E=G(()=>{let r=rn(L,f);return i==="pr"||i==="goal"||f.trim()||s==="all"?r:
r.filter(p=>p.state===s)},[s,L,f,i]),Dn=G(()=>{let r={all:0,failing:0,running:0,merged:0};for(let p of lt(E,"pr")){if(!p.
changeRef)continue;r.all++;let m=ot(p.changeRef,l[p.changeRef.url??""]);m!=="other"&&r[m]++}return r},[E,l]);U(()=>{if(i!==
"pr")return;let r=new Set;for(let m of E)for(let b of m.references)b.kind==="change"&&b.url&&/github\.com\/.+\/pull\//.test(
b.url)&&r.add(b.url);let p=!1;for(let m of r)l[m]||t.current.get(`/pr-checks?url=${encodeURIComponent(m)}`).then(b=>{!p&&
W.current&&c(R=>({...R,[m]:b}))}).catch(()=>{});return()=>{p=!0}},[i,E,l]),U(()=>n(He["needs-you"]),[He,n]),U(()=>{x&&!L.
some(r=>r.id===x)&&v(null)},[L,x]),U(()=>{let r=p=>{(p.metaKey||p.ctrlKey)&&p.key.toLocaleLowerCase("en-US")==="k"&&(p.preventDefault(),
document.querySelector('[data-crew-manager-search="true"]')?.focus())};return window.addEventListener("keydown",r),()=>window.
removeEventListener("keydown",r)},[]);let Ve=N?.slots.find(r=>r.key===we),Fn=!!(Ve||zn);U(()=>{!N||Ve||je.current||(je.current=
!0,e.post("/api/chat/slots",{name:we,title:"Conductor"}).then(()=>{W.current&&(qn(!0),K())}).catch(r=>{W.current&&(je.current=
!1,Re(r instanceof Error?`Conductor session could not be created: ${r.message}`:"Conductor session could not be created"))}))},
[e,Ve,K,N]);let Ct=G(()=>Vt(N?.approvals??[],_e,r=>L.find(p=>p.sessionKey===r)?.title??N?.slots?.find(p=>p.key===r)?.title??
r),[L,N,_e]),ue=Q&&!Q.permissionId?Q:null,Ye=G(()=>i==="goal"?gn(E,$,B):[],[i,E,$,B]),H=G(()=>{if(!Ee)return null;for(let r of Ye){
let p=r.blocks.find(m=>m.key===Ee);if(p&&p.items.length>0)return p}return null},[Ee,Ye]),q=H?pn(H.items):null,[Un,Wt]=_(
!1),jn=G(()=>{if(i!=="goal")return[];let r=cn(N?.slots??[],$),p=un(L,$),m=new Set,b=[];for(let R of[...p,...r])m.has(R.name.
toLowerCase())||(m.add(R.name.toLowerCase()),b.push(R));return b.sort((R,A)=>A.sessions-R.sessions)},[i,N,L,$]),Hn=T(async(r,p)=>{
try{await t.current.patch(`/api/chat/slots/${encodeURIComponent(r)}/title`,{title:p}),K()}catch{}},[K]),Vn=T(async(r,p=[])=>{
if(r.trim()){Wt(!0);try{let m=await t.current.post("/api/apps/crew-manager/initiatives",{name:r.trim(),aliases:p});W.current&&
m?.initiatives&&ce(m.initiatives.filter(b=>b?.name))}catch{}finally{W.current&&Wt(!1)}}},[]),Z=T(async(r,p)=>{if(!M){le(
r),Re(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(r)}/${p?"approve":"reject"}`,{}),K()}catch(m){
Re(m instanceof Error?`Could not answer that request: ${m.message}`:"Could not answer that request"),K()}finally{W.current&&
le(null)}}},[K,M]),Yn=T(r=>{Le(p=>{let m=Object.fromEntries(Object.entries(p).filter(([,b])=>b>Date.now()));return m[r]=
Date.now()+en,se(ut,m),m}),v(null)},[]),Qn=T((r,p)=>{S(m=>{let b={...m,[r]:p};return se(yn,b),b}),v(null)},[]),Jn=T(()=>{
Le({}),se(ut,{})},[]),Xn=T(r=>{z(p=>{let m={merged:p.merged.filter(b=>!r.includes(b)),split:[...new Set([...p.split,...r])]};
return se(pt,m),m})},[]),Zn=T(r=>{z(p=>{let m={merged:[...new Set([...p.merged,r])],split:p.split.filter(b=>b!==r)};return se(
pt,m),m})},[]),eo=T(()=>{Tn(r=>(se(vn,!r),!r))},[]),pe=T(async r=>{if(!D){Ke(r),Re(null);try{await t.current.post(r,{}),
K()}catch(p){Re(p instanceof Error?`Could not re-run it: ${p.message}`:"Could not re-run it"),K()}finally{W.current&&Ke(
null)}}},[K,D]),ee=T(async r=>{if(H&&q?.sessionKey){let m=q.sessionKey,b=H.items.map(A=>`- ${A.references.find(Te=>Te.kind===
"session")?.label??A.sessionKey}: ${ke[A.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(m)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${H.items[0].title}", which spans sessions:`,b,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:m}).catch(A=>{if(!(A instanceof
SyntaxError))throw A}),!W.current)return;xe(A=>({...A,[q.id]:Date.now()})),Se(A=>A.includes(m)?A:[...A,m]);let R=q.references.
find(A=>A.kind==="session")?.label??q.title;I(q.moving||q.state==="running"?`Sent to ${R} \u2014 the active session on this g\
oal`:`Sent to ${R} \u2014 resuming the last session on this goal`),Oe(null),K();return}let p=Q&&!Q.permissionId?Q:null;if(p?.
sessionKey){let m=p.sessionKey;if(await t.current.post("/api/chat",{message:r,slot:m}).catch(b=>{if(!(b instanceof SyntaxError))
throw b}),!W.current)return;xe(b=>({...b,[p.id]:Date.now()})),Se(b=>b.includes(m)?b:[...b,m]),I(`Sent new instructions t\
o ${p.title}`),v(null),K();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(we)}/context`,{content:ps(Q,
L),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:we}).catch(m=>{if(!(m instanceof
SyntaxError))throw m})},[Q,H,q,L,K]),to=G(()=>Kt(Pe.hits,E),[Pe.hits,E]),Qe={"needs-you":E.filter(r=>r.state==="needs-yo\
u"),running:E.filter(r=>r.state==="running"),done:E.filter(r=>r.state==="done")},no=T((r,p)=>{Pn(m=>{let b={...m,[r]:p};
return se(xn,b),b})},[]),oo=T(r=>{Oe(p=>p===r?null:r),v(null),I(null)},[]),te=r=>o(`/chat?sid=${encodeURIComponent(r)}`),
ge=r=>{v(p=>p===r.id?null:r.id),Oe(null),I(null)};return g("div",{className:"ow-root","data-crew-manager-shell":"quiet-s\
plit",children:[a("style",{children:hn}),a(Vo,{title:"Crew Manager",subtitle:"See what needs your input, what is still r\
unning, and what finished recently."}),a("div",{className:"ow-body",children:g("div",{className:"ow-layout",children:[a(
"nav",{className:"ow-rail","aria-label":"Crew Manager",children:a("div",{className:"ow-rail-inner",children:g("div",{className:"\
ow-groupby",role:"group","aria-label":"Group by",children:[a("span",{className:"ow-groupby-label",children:"Group by"}),
["session","pr","goal"].map(r=>a(P,{onClick:()=>u(r),"aria-pressed":i===r,"data-selected":i===r,className:"ow-groupby-op\
t",children:r==="session"?"Session":r==="pr"?"PR":"Goal"},r))]})})}),a("main",{className:"ow-work",children:g("div",{className:"\
ow-work-inner",children:[g("div",{className:"ow-toolbar",children:[a(Yo,{"data-crew-manager-search":"true",value:f,onChange:r=>C(
r.target.value),placeholder:"Search work and projects\u2026 \u2318K","aria-label":"Search work",className:"ow-search"}),
i==="pr"?a("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(_n).map(r=>g(
P,{onClick:()=>y(r),"aria-pressed":h===r,"data-selected":h===r,className:"ow-filter",children:[_n[r],a("span",{className:"\
ow-count",children:Dn[r]})]},r))}):i==="goal"?null:a("div",{className:"ow-filters",role:"group","aria-label":"Filter by \
state",children:Object.keys(gt).map(r=>g(P,{onClick:()=>d(r),"aria-pressed":s===r,"data-selected":s===r,className:"ow-fi\
lter",children:[gt[r],a("span",{className:"ow-count",children:He[r]})]},r))})]}),Mn?a(kn,{rows:7}):St&&!N?a(ct,{icon:a(Cn,
{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:St.message,action:a(P,{onClick:Gn,children:"\
Try again"})}):E.length===0?a(ct,{icon:a(qo,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter \
or search for a session, project, PR, or output."}):s==="all"||f.trim()?i==="pr"?E.some(r=>r.references.some(p=>p.kind===
"change"||p.kind==="issue"))?a(he,{title:"Work by PR",subtitle:"Every pull request your work touches",items:E,prChecks:l,
prFilter:h,selectedId:x,onSelect:ge,onOpenSession:te,onAnswerPermission:(r,p)=>{Z(r,p)},permissionBusy:M!==null,onRetry:r=>{
pe(r)},retryBusy:D!==null,onPickStep:r=>{ee(r)},groupBy:i,emptyLabel:"No matching work"}):a(ct,{icon:a(Kn,{className:"ow\
-icon"}),title:"No work is linked to a PR right now",subtitle:"Work links to a PR when a session mentions its URL (a Git\
Hub/GitLab pull, merge request, or issue). None of the current sessions do, so there is nothing to group by PR yet.",action:a(
P,{onClick:()=>u("session"),children:"Back to Session view"})}):i==="goal"?a(he,{title:"Work by goal",subtitle:"The same\
 job across sessions, merged into one card",items:E,selectedId:x,onSelect:ge,onOpenSession:te,onAnswerPermission:(r,p)=>{
Z(r,p)},permissionBusy:M!==null,onRetry:r=>{pe(r)},retryBusy:D!==null,onPickStep:r=>{ee(r)},groupBy:i,goalVerdicts:B,onSplitGoal:Xn,
onMergeGoal:Zn,initiativeBlocks:Ye,initiatives:$,onRenameSession:(r,p)=>{Hn(r,p)},collapsedInitiatives:On,onToggleInitiative:no,
selectedGoalKey:Ee,onSelectGoal:oo,footer:a(ns,{candidates:jn,prominent:$.length===0,busy:Un,onAdd:(r,p)=>{Vn(r,p)}}),emptyLabel:"\
No matching work"}):g(We,{children:[a(he,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:Qe["\
needs-you"],doneBySession:It,selectedId:x,onSelect:ge,onSnooze:Yn,onHandled:Qn,footer:$e.snoozedCount>0?g("button",{type:"\
button",className:"ow-aside-note",onClick:Jn,children:[$e.snoozedCount," set aside for later \u2014 bring back"]}):void 0,
onOpenSession:te,onAnswerPermission:(r,p)=>{Z(r,p)},permissionBusy:M!==null,onRetry:r=>{pe(r)},retryBusy:D!==null,onPickStep:r=>{
ee(r)},groupBy:i,emptyLabel:"Nothing needs your input right now."}),a(he,{title:"In progress",subtitle:"Being worked on \
right now",items:Qe.running,doneBySession:It,selectedId:x,onSelect:ge,onOpenSession:te,onAnswerPermission:(r,p)=>{Z(r,p)},
permissionBusy:M!==null,onRetry:r=>{pe(r)},retryBusy:D!==null,onPickStep:r=>{ee(r)},groupBy:i,emptyLabel:"Nothing is in \
progress right now."}),a(he,{title:"Done recently",subtitle:"Finished in the last few days",items:Qe.done,selectedId:x,onSelect:ge,
collapsed:$n,onToggleCollapsed:eo,onOpenSession:te,onAnswerPermission:(r,p)=>{Z(r,p)},permissionBusy:M!==null,onRetry:r=>{
pe(r)},retryBusy:D!==null,onPickStep:r=>{ee(r)},groupBy:i,emptyLabel:"No recent completed work."})]}):a(he,{title:gt[s],
items:E,selectedId:x,onSelect:ge,onOpenSession:te,onAnswerPermission:(r,p)=>{Z(r,p)},permissionBusy:M!==null,onRetry:r=>{
pe(r)},retryBusy:D!==null,onPickStep:r=>{ee(r)},groupBy:i,emptyLabel:"No matching work"}),f.trim()&&a(ts,{hits:to,now:Date.
now(),onOpenSession:te})]})}),g("aside",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"\
ow-conductor-header",children:g("div",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!ue&&a("s\
pan",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:Fn?
g("div",{className:"ow-chat-panel",children:[Ct.length>0&&a("div",{className:"ow-permissions",role:"alert",children:Ct.map(
r=>a(En,{tool:r.tool,purpose:r.purpose,where:r.sessionLabel,busy:M!==null,onAnswer:p=>{Z(r.id,p)}},r.id))}),O&&g("div",{
className:"ow-conductor-receipt",role:"status",children:[a(An,{className:"ow-icon"}),O]}),Rt&&a("div",{className:"ow-cha\
t-error",role:"alert",children:Rt}),a("div",{className:"ow-embed",children:a(jo,{slotKey:we,frameless:!0,startAtBottom:!0,
placeholder:H?"Instruction for this goal\u2026":ue?.sessionKey?"New instructions for this session\u2026":"Ask across you\
r work\u2026",onSend:ee})}),H&&q?g("div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-bo\
dy ow-quote-goal",children:[g("div",{className:"ow-quote-line",children:[a("span",{className:"ow-eyebrow",children:"Inst\
ructing goal"}),a("span",{className:"ow-quote-title",title:H.items[0].title,children:H.items[0].title})]}),g("span",{className:"\
ow-quote-route ow-truncate",children:["\u2192 ",q.references.find(r=>r.kind==="session")?.label??q.title,q.moving||q.state===
"running"?" (active)":" (will resume)"]})]}),a(P,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{
Oe(null),I(null)},children:"Clear"})]}):ue&&g("div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"\
ow-quote-body",children:[a("span",{className:"ow-eyebrow",children:ue.sessionKey?"Instructing":"Quoted"}),a("span",{className:"\
ow-quote-title",title:ue.title,children:ue.title})]}),a(P,{className:"ow-quote-clear","aria-label":"Remove the quoted wo\
rk item",onClick:()=>{v(null),I(null)},children:"Clear"})]})]}):a("div",{className:"ow-chat-loading",children:a(kn,{rows:4})})})]})]})})]})}export{gs as default};
