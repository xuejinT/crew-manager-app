import{Fragment as wn,useCallback as $,useEffect as F,useMemo as T,useRef as oe,useState as _}from"react";import{AlertTriangle as Nn,
Bot as Lo,Check as In,ChevronRight as be,Check as Cn,Clock as Eo,Package as Oo,ExternalLink as Wn,MessageSquare as mt,Shield as Po,
Waves as $o,Search as To,Tag as An,Users as Bn,Zap as Mo}from"lucide-react";import{useAppApi as zo,useNavigate as qo,useNavBadge as Do,
ChatEmbed as Fo}from"@kirocrew/app-sdk";import{Badge as qe,Btn as E,ContentSkeleton as hn,EmptyState as it,Input as Go,PageHeader as Uo,
SearchInput as jo}from"@kirocrew/app-sdk/ui";function At(e){return e.trim().length>=2}function Bt(e,t){let o=new Set(t.map(d=>d.sessionKey).filter(Boolean)),n=new Set,
r=[];for(let d of e){let i=d?.session_key;!i||o.has(i)||n.has(i)||(n.add(i),r.push(d))}return r}function to(e,t){if(!e)return 0;
let o=e>1e11?e/1e3:e,n=Math.floor((t/1e3-o)/86400);return n>0?n:0}function Kt(e,t){let o=to(e,t);if(o<=0)return"today";if(o===
1)return"yesterday";if(o<7)return`${o} days ago`;if(o<30){let r=Math.floor(o/7);return r===1?"last week":`${r} weeks ago`}
let n=Math.floor(o/30);return n===1?"last month":`${n} months ago`}var Lt={unsupported:!1,hits:[]};function Et(e){return!e||
e.enabled===!1?{unsupported:!0,hits:[]}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:[]).filter(o=>!!o?.session_key)}}
function Ot(e,t){return`/api/apps/crew-manager/recall?${new URLSearchParams({q:e.trim(),limit:String(t)}).toString()}`}function Ye(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),n=t%
60;return n===0?`${o} hour${o===1?"":"s"}`:`${o}h ${n}m`}function jt(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function et(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function Ht(e,t,o){let n=new Set(t.filter(Boolean));if(n.size===0)return[];
let r=new Set,d=[];for(let i of e){let u=i.slot;!u||!n.has(u)||!i.id||r.has(i.id)||(r.add(i.id),d.push({id:i.id,sessionKey:u,
sessionLabel:o(u),tool:i.tool||"a tool",purpose:i.tool_purpose}))}return d}var Pt={"needs-you":0,running:1,done:2};function D(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}var $t=72;function fe(e,t){
let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let r=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(r.length<=$t)return r;let d=r.slice(0,$t),i=d.lastIndexOf(" ");return`${(i>24?d.slice(0,i):d).trim()}\u2026`}
function ne(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var no=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
oo=/^\((?:code|diff|widget|image)\)$/,ro=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
so=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,ao=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
io=/[?？]["'”’)\]]*$/;function Vt(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||oo.test(t)||no.test(
t)?null:t}function tt(e){if(!e.waiting_for_input)return null;let t=Vt(e);return!t||ro.test(t)||so.test(t)?null:ao.test(t)||
io.test(t)?t:null}function Tt(e){return e.pending_approval||tt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":ne(e)?"needs-you":"done"}function lo(e,t){if(e.pending_approval)return t("approval_waiting");let o=tt(e);return o||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):ne(e)?t("linked_change_issue"):Vt(e)??t("recent_w\
ork_ready"))}function Qe(e,t){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function co(e){return e.pending_approval?"review-approval":tt(e)?"reply":"open"}function uo(e,t){
let o=(e.source_links??[]).map(n=>({kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:
`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key,status:jt(n)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:lo(e,t),state:Tt(e),moving:Tt(e)==="running"||void 0,issue:ne(e),updatedAt:D(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:Qe(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:ne(e)||void 0,action:co(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...o]}}function nt(e,t){e.references.
some(o=>o.kind===t.kind&&o.id===t.id)||e.references.push(t)}function Yt(e){return(e.source||"").toLowerCase()==="subagen\
t"}function po(e,t,o){let n=Yt(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,D(t.ts)),e.summary=o(n?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=n?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,nt(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),
sessionKey:t.slot||e.sessionKey})}function go(e,t,o){e.updatedAt=Math.max(e.updatedAt,D(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),nt(e,{kind:"agent",id:t.id,
label:t.agent||o("agent"),sessionKey:t.parent||e.sessionKey})}function fo(e,t,o){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow\
_failed",{name:t.name})),nt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function mo(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function wo(e,t,o){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===o}function ho(e){let t=null,o=-1;for(let n of e){let r=n.last_touched_turn??0;r>o&&(o=r,t=n)}return t}function bo(e,t){let o=e.next_steps?.find(r=>r.what?.trim())?.what?.trim();if(o)return o;let n=[...e.progress??[]].reverse().
find(r=>r.trim());return n?n.trim():e.initial_intent?.trim()||t("work_in_progress")}var ko=3;function yo(e,t,o){if(!t?.enabled)
return[];let n=t.intents??[];if(n.length===0)return[];let r=(e.source_links??[]).map(c=>({kind:c.kind==="issue"?"issue":
"change",id:c.url,label:c.kind==="issue"?`issue #${c.number}`:`${c.provider} #${c.number}`,url:c.url,sessionKey:e.key,status:jt(
c)})),d=[],i=ho(n),h=!!(e.running||e.subagents_running||e.orchestrating)?[]:n.filter(c=>c.state==="in-progress");h.forEach(
c=>{let f=n.indexOf(c),C=(c.next_steps??[]).filter(x=>x.what?.trim());d.push({id:`unattended:${e.key}:${f}`,title:fe(c.title,
e.title||o("untitled_work")),summary:C[0]?.what?.trim()||o("no_next_step"),state:"needs-you",issue:ne(e),updatedAt:D(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:Qe(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:ne(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.
key},...r],nextSteps:C,progress:(c.progress??[]).filter(x=>x.trim()),stale:!!t.stale,lastTouchedTurn:c.last_touched_turn??
0})}),n.forEach((c,f)=>{if(h.includes(c))return;let C=mo(c,e);if(!C)return;let x=(c.next_steps??[]).filter(v=>v.what?.trim());
d.push({id:`intent:${e.key}:${f}`,title:fe(c.title,e.title||o("untitled_work")),summary:bo(c,o),state:C,issue:!1,updatedAt:D(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:Qe(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:ne(
e)||void 0,unverified:c.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...r],nextSteps:x,progress:(c.progress??[]).filter(v=>v.trim()),stale:!!t.stale,lastTouchedTurn:c.
last_touched_turn??0,moving:wo(c,e,i)||void 0})});let y=d.filter(c=>c.state==="needs-you"),l=d.filter(c=>c.state!=="need\
s-you").sort((c,f)=>(f.lastTouchedTurn??0)-(c.lastTouchedTurn??0));return[...y,...l].slice(0,Math.max(ko,y.length))}var Qt=new Set(
["crew-manager-conductor","overwatch-conductor"]),vo={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},xo=3;function _o(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var $e=5;function Jt(e,t,o=Date.now()){let n=rt(e),r=nn(
e.filter(i=>i.state==="needs-you"),o),d=[`Fleet: ${n["needs-you"]} waiting on the user, ${n.running} in progress, ${n.done}\
 finished recently.`];return r.length===0?(d.push("Nothing is waiting on the user."),d):(d.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min($e,r.length)}):`),r.slice(0,$e).forEach((i,u)=>{let h=me(Q(i,o),t),y=i.sessionKey?
` [session ${i.sessionKey}]`:"";d.push(`${u+1}. ${i.title} \u2014 ${i.summary} (${h})${y}`)}),r.length>$e&&d.push(`\u2026and ${r.
length-$e} more waiting.`),d)}var Je=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),Mt=.6,zt=2;function Xe(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!Je.has(t)))]}function Te(e,t){let o=Xe(e),n=Xe(t);if(o.length<zt||n.length<zt)return 0;
let r=o.length<=n.length?o:n,d=new Set(o.length<=n.length?n:o);return r.filter(u=>d.has(u)).length/r.length}function qt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Dt(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function Ft(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function Me(e,t){
if(qt(e).find(r=>qt(t).includes(r)))return"same_change";if(Dt(e).find(r=>Dt(t).includes(r)))return"same_artifact";if(Te(
e.title,t.title)>=Mt)return"same_topic";for(let r of Ft(e))for(let d of Ft(t))if(Te(r,d)>=Mt)return"same_step";return null}
var ze={merged:[],split:[]};function Gt(e){return`${e.sessionKey??e.id}|${Xe(e.title).join(" ")}`}function Ne(e,t){return[
Gt(e),Gt(t)].sort().join("")}function So(e,t=ze){let o=e.filter(n=>n.state!=="done"&&n.sessionKey).sort((n,r)=>(n.updatedAt||
0)-(r.updatedAt||0));for(let n=1;n<o.length;n+=1){let r=o[n];for(let d=0;d<n;d+=1){let i=o[d];if(i.sessionKey===r.sessionKey||
t.split.includes(Ne(r,i)))continue;let u=Me(r,i);if(u){r.duplicateOf={sessionKey:i.sessionKey,title:i.title,because:u};break}}}}
var Ro=3e4;function Xt(e,t,o=Date.now()){return Object.keys(t).length===0?e:e.map(n=>{let r=t[n.id];return!r||o-r>Ro||n.
state==="running"?n:{...n,state:"running",moving:!0,instructed:!0}})}function Q(e,t=Date.now()){let o=[],n=(d,i,u=1)=>{o.
push({signal:d,weight:vo[d]*u,values:i})};e.approvalKind==="subagent"?n("subagent_gate"):e.approvalKind==="tool"&&n("app\
roval_owed"),e.action==="reply"&&n("input_requested"),e.unverified&&n("unverified_completion"),e.loopRepeats&&n("error_l\
oop",{repeats:String(e.loopRepeats)}),e.runFailed&&n("run_failed"),e.stalledFor&&n("stalled",{duration:Ye(e.stalledFor)}),
e.changeBlocked&&n("change_blocked"),e.unattendedGoals&&n("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&
n("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let r=_o(e,t);return r>0&&n("waiting_a_whil\
e",{hours:String(r)},Math.min(r,xo)),o.sort((d,i)=>i.weight-d.weight),{score:o.reduce((d,i)=>d+i.weight,0),signals:o}}var No={
approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"un\
block",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function ot(e,t=Date.now()){
if(e.state!=="needs-you")return null;for(let o of Q(e,t).signals){let n=No[o.signal];if(n)return n}return null}var Zt=14400*
1e3;function en(e,t,o,n=Date.now()){let r=0,d=[];for(let i of e){if(i.state!=="needs-you"){d.push(i);continue}let u=t[i.
id];if(u&&u>n){r+=1;continue}let h=o[i.id];if(h!==void 0&&i.updatedAt<=h){d.push({...i,state:"done",issue:!1});continue}
d.push(i)}return{items:d,snoozedCount:r}}var Io=4320*60*1e3;function tn(e,t=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:t-e.updatedAt<=Io}var Co={"needs-you":1,running:-1,done:-1};function Wo(e,t,o){let n=e.updatedAt>0,r=t.updatedAt>0;
return!n&&!r?0:n?r?(e.updatedAt-t.updatedAt)*o:-1:1}function me(e,t){let o=e.signals.slice(0,2);return o.length===0?t("r\
ank_nothing_pressing"):o.map(r=>t(`rank_${r.signal}`,r.values)).join(t("rank_join"))}function nn(e,t=Date.now()){let o=new Map(
e.map(n=>[n.id,Q(n,t)]));return[...e].sort((n,r)=>{let d=Pt[n.state]-Pt[r.state];if(d!==0)return d;if(n.state==="needs-y\
ou"){let i=(o.get(r.id)?.score??0)-(o.get(n.id)?.score??0);if(i!==0)return i}else if(n.issue!==r.issue)return n.issue?-1:
1;return Wo(n,r,Co[n.state])})}function on(e,t,o={},n={},r={},d=ze){let i=new Map,u=new Map;for(let l of e.slots){if(!l.
key||Qt.has(l.key)||l.memory_mode==="incognito")continue;let c=yo(l,o[l.key],t);if(c.length>0){for(let x of c)i.set(x.id,
x);let C=c.find(x=>x.state==="needs-you")??c[0];u.set(l.key,C);continue}let f=uo(l,t);i.set(f.id,f),u.set(l.key,f)}for(let[
l,c]of Object.entries(n)){let f=u.get(l);f&&(f.state="needs-you",f.issue=!0,f.stalledFor=c.silent_secs,f.summary=c.reason?
t("stalled_because",{reason:c.reason,duration:Ye(c.silent_secs)}):t("stalled_for",{duration:Ye(c.silent_secs)}),f.action=
"open")}for(let[l,c]of Object.entries(r)){let f=u.get(l);f&&(f.state="needs-you",f.issue=!0,f.loopRepeats=c.repeats,f.summary=
t("error_loop",{tool:c.tool,repeats:String(c.repeats)}),f.action="open")}for(let l of e.approvals){let c=l.slot?u.get(l.
slot):void 0;if(c){po(c,l,t);continue}i.set(`approval:${l.id}`,{id:`approval:${l.id}`,title:fe(l.tool||l.source,t("appro\
val_needed")),summary:l.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:D(l.ts),provenance:t("\
approval"),action:"review-approval",approvalKind:Yt(l)?"subagent":"tool",permissionId:l.id,permissionTool:l.tool||l.source,
permissionPurpose:l.tool_purpose,references:[{kind:"approval",id:l.id,label:l.tool||l.source||t("approval")}]})}for(let l of e.
agents){let c=l.parent?u.get(l.parent):void 0;if(c){go(c,l,t);continue}let f=!!(l.done&&(l.error||l.outcome==="failed"));
l.parent&&!f||i.set(`agent:${l.id}`,{id:`agent:${l.id}`,title:fe(l.task||l.agent,t("agent_work")),summary:f?l.error?.trim()||
t("agent_failed",{task:l.task}):l.done?t("agent_done"):t("work_in_progress"),state:f?"needs-you":l.done?"done":"running",
issue:f,runFailed:f||void 0,retryPath:f&&!l.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(l.id)}/retry`:void 0,
updatedAt:D(l.started),provenance:l.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:l.id,label:l.agent||
t("agent")}]})}for(let l of e.workflows){let c=l.session_key?u.get(l.session_key):void 0;if(c){fo(c,l,t);continue}let f=l.
status==="failed";i.set(`workflow:${l.run_id}`,{id:`workflow:${l.run_id}`,title:fe(l.name,l.run_id),summary:f?t("workflo\
w_failed_generic"):l.status==="running"?t("workflow_running"):t("workflow_finished"),state:f?"needs-you":l.status==="run\
ning"?"running":"done",issue:f,runFailed:f||void 0,retryPath:f?`/api/workflows/runs/${encodeURIComponent(l.run_id)}/reru\
n`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:l.run_id,label:l.name||l.
run_id}]})}for(let l of e.crons){if(!l.is_running&&l.last_status!=="error")continue;let c=l.last_status==="error";i.set(
`monitor:${l.id}`,{id:`monitor:${l.id}`,title:l.name,summary:t(c?"monitor_failed":"monitor_running"),state:c?"needs-you":
"running",issue:c,runFailed:c||void 0,retryPath:c?`/api/crons/${encodeURIComponent(l.id)}/run`:void 0,updatedAt:D(l.running_since||
l.last_run_ts||l.created_ts),provenance:t("monitor"),action:c?"discuss":void 0,references:[{kind:"monitor",id:l.id,label:l.
name}]})}let h=[...e.artifacts].sort((l,c)=>D(c.updated_at)-D(l.updated_at)).slice(0,8);for(let l of h){let c=l.session_key&&
u.has(l.session_key)?l.session_key:void 0;i.set(`artifact:${l.slug}`,{id:`artifact:${l.slug}`,title:fe(l.name,t("artifac\
t")),summary:l.description||t("artifact_ready",{kind:l.kind}),state:"done",issue:!1,updatedAt:D(l.updated_at||l.created_at),
sessionKey:c,provenance:l.session_title||l.source||t("artifact"),action:c?"open":void 0,references:[{kind:"artifact",id:l.
slug,label:l.name,sessionKey:c},...c?[{kind:"session",id:c,label:l.session_title||c,sessionKey:c}]:[]]})}let y=[...i.values()];
return So(y,d),nn(y)}function rt(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.
filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function rn(e,t){let o=t.trim().toLowerCase();
return o?e.filter(n=>[n.title,n.summary,n.provenance,...n.references.flatMap(d=>[d.label,d.id,d.url])].join(`
`).toLowerCase().includes(o)):e}function sn(e){let t=[],o=new Map;for(let n of e){let r=n.sessionKey;if(!r)continue;let d=o.
get(r);if(d){d.count+=1;continue}let i=n.references.find(h=>h.kind==="session")?.label??n.provenance,u={sessionKey:r,label:i,
leading:n,count:1};o.set(r,u),t.push(u)}return t}function st(e,t,o=ze){if(t==="pr")return Ao(e);if(t==="goal")return Ze(
e,o);let n=[],r=new Map;for(let d of e){let i=d.sessionKey;if(!i){n.push({key:d.id,items:[d],header:null,sessionKey:null,
changeRef:null});continue}let u=r.get(i);if(u){u.items.push(d);continue}let h={key:i,items:[d],header:"session",sessionKey:d.
sessionKey??null,changeRef:null};r.set(i,h),n.push(h)}return n}function Ao(e){let t=[],o=new Map;for(let n of e){let r=n.
references.filter(d=>d.kind==="change"||d.kind==="issue");for(let d of r){let i=`${d.kind}:${d.id}`,u=o.get(i);if(u){u.items.
push(n);continue}let h={key:i,items:[n],header:"pr",sessionKey:null,changeRef:d};o.set(i,h),t.push(h)}}return t}function Ze(e,t){
let o=e.map((u,h)=>h),n=u=>{for(;o[u]!==u;)o[u]=o[o[u]],u=o[u];return u},r=(u,h)=>{o[n(h)]=n(u)};for(let u=0;u<e.length;u+=
1)for(let h=u+1;h<e.length;h+=1){let y=e[u],l=e[h];if(!y.sessionKey||!l.sessionKey||y.sessionKey===l.sessionKey)continue;
let c=Ne(y,l);t.split.includes(c)||(t.merged.includes(c)||Me(y,l))&&r(u,h)}let d=[],i=new Map;for(let u=0;u<e.length;u+=
1){let h=n(u),y=i.get(h);if(y){y.items.push(e[u]),y.header="goal";continue}let l={key:`goal:${e[u].id}`,items:[e[u]],header:null,
sessionKey:null,changeRef:null};i.set(h,l),d.push(l)}return d}function an(e,t){let o=e.references.find(n=>n.kind==="sess\
ion")?.label??"";for(let n of[e.title,o,e.provenance]){let r=n.toLowerCase();for(let d of t)if(d.aliases.some(i=>i&&r.includes(
i.toLowerCase())))return d.name}return null}function ln(e,t){let o=t.flatMap(d=>d.aliases.map(i=>i.toLowerCase())),n=new Set(
["workspace","workspaces","home","src","tmp","documents","desktop"]),r=new Map;for(let d of e){if(!d.key||Qt.has(d.key)||
d.memory_mode==="incognito")continue;let i=d.project;if(!i)continue;let u=i.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop();!u||n.has(u.toLowerCase())||o.some(h=>u.toLowerCase().includes(h)||h.includes(u.toLowerCase()))||r.set(u,(r.get(
u)??0)+1)}return[...r.entries()].map(([d,i])=>({name:d,sessions:i})).sort((d,i)=>i.sessions-d.sessions)}function dn(e,t){
let o=new Map;for(let d of e){if(!d.sessionKey||an(d,t)!==null)continue;let i=d.references.find(u=>u.kind==="session")?.
label??"";for(let u of[d.title,i]){let h=u.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);
for(let y of[3,2])for(let l=0;l+y<=h.length;l+=1){let c=h.slice(l,l+y);if(Je.has(c[0])||Je.has(c[y-1])||c[0].length<3||c[y-
1].length<3)continue;let f=c.join(" ");o.has(f)||o.set(f,new Set),o.get(f).add(d.sessionKey)}}}let n=[...o.entries()].map(
([d,i])=>({phrase:d,sessions:i.size})).filter(d=>d.sessions>=2);return n.filter(d=>!n.some(i=>i.phrase!==d.phrase&&i.phrase.
includes(d.phrase)&&i.sessions>=d.sessions)).sort((d,i)=>i.sessions-d.sessions||i.phrase.length-d.phrase.length).map(d=>({
name:d.phrase.replace(/\p{L}+/gu,i=>i[0].toUpperCase()+i.slice(1)),sessions:d.sessions}))}function Ut(e){return e.some(t=>t.
state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function cn(e){let t=e.find(n=>n.moving);
if(t)return t;let o=e.find(n=>n.state==="running");return o||[...e].sort((n,r)=>(r.updatedAt||0)-(n.updatedAt||0))[0]}function Bo(e){
let t=[],o=new Set;for(let n of e){let r=n.sessionKey;!r||o.has(r)||(o.add(r),t.push(n.references.find(d=>d.kind==="sess\
ion")?.label??n.provenance))}return t}function un(e,t,o=ze){let n=new Map,r=[],d=new Map;for(let l of e){let c=an(l,t);if(d.
set(l.id,c),c===null){r.push(l);continue}n.has(c)||n.set(c,[]),n.get(c).push(l)}let i=Ze(r,o),u=new Map;for(let l of i)u.
set(l.items[0].id,l);let h=[],y=new Set;for(let l of e){let c=d.get(l.id)??null;if(c!==null){if(y.has(c))continue;y.add(
c);let C=n.get(c);h.push({key:`initiative:${c}`,name:c,status:Ut(C),sessions:Bo(C),blocks:Ze(C,o)});continue}let f=u.get(
l.id);f&&h.push({key:f.key,name:null,status:Ut(f.items),sessions:[],blocks:[f]})}return h}function at(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function gn(e,t){return e.filter(o=>o.key&&
o.key!==t&&o.memory_mode!=="incognito").sort((o,n)=>pn(n)-pn(o)).slice(0,12)}function pn(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function fn(e,t){
let o={},n="unknown";for(let r of e)try{let d=await t(`/api/chat/slots/${encodeURIComponent(r.key)}/summary`);if(!d||typeof d!=
"object"){n="unsupported";break}if(d.enabled===!1){n="disabled";break}o[r.key]=d,n="available"}catch{n="unsupported";break}
return{summaries:o,support:n}}var mn=String.raw`
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
`;import{Fragment as Ce,jsx as a,jsxs as g}from"react/jsx-runtime";var lt="crew-manager.snoozed",bn="crew-manager.handled",
kn="crew-manager.done-collapsed",dt="crew-manager.goal-verdicts",yn="crew-manager.initiative-collapsed";function Ie(e,t={}){
try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}function re(e,t){try{localStorage.setItem(e,JSON.
stringify(t))}catch{}}var we="crew-manager-conductor",Ho=5e3,Vo={session:"Session",approval:"Approval",agent:"Agent",workflow:"\
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
untitled_work:"Untitled work"};function se(e,t={}){return Vo[e].replace(/\{\{(\w+)\}\}/g,(o,n)=>t[n]??"")}var Yo={followup:"\
FOLLOW UP",unblock:"UNBLOCK"},ke={"needs-you":"Needs you",running:"Running",done:"Done"},ct={all:"All","needs-you":"Need\
s you",running:"Running",done:"Done"},vn={all:"All",failing:"Failing",running:"Running",merged:"Merged"},Qo={session:mt,
approval:Nn,agent:Lo,workflow:Mo,monitor:$o,artifact:Oo,change:Wn,issue:An};function V({children:e,onActivate:t,...o}){return a(
"div",{...o,role:"button",tabIndex:0,onClick:t,onKeyDown:n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t())},children:e})}
function gt({label:e,count:t,subtitle:o}){return g("div",{className:"ow-section-header",children:[g("div",{className:"ow\
-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow-section-count",children:t})]}),
o&&a("p",{className:"ow-section-subtitle",children:o})]})}function wt(e){if(e.state==="needs-you"){let t=ot(e);return t?
a(qe,{variant:"warn",className:"ow-verb",children:Yo[t]}):null}return e.state==="running"?e.moving?g(qe,{variant:"aim",children:[
a(Eo,{className:"ow-icon"}),ke[e.state]]}):a(qe,{variant:"muted",children:"Queued"}):g(qe,{variant:"ok",children:[a(Cn,{
className:"ow-icon"}),ke[e.state]]})}var Jo=8;function Xo({hits:e,now:t,onOpenSession:o}){return e.length===0?null:g("section",{className:"ow-section","aria-\
label":"From past work",children:[a(gt,{label:"From past work",count:e.length}),a("div",{className:"ow-section-list",children:e.
map(n=>a(V,{className:"ow-row ow-recall-row",onActivate:()=>o(n.session_key),"data-testid":`recall-${n.session_key}`,children:g(
"div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[g("div",{className:"ow-row-head\
ing",children:[a("span",{className:"ow-row-title",children:n.title}),a("span",{className:"ow-recall-age",children:Kt(n.modified,
t)})]}),n.snippet&&a("p",{className:"ow-row-summary",children:n.snippet})]}),g("div",{className:"ow-row-actions",children:[
a(E,{className:"ow-primary-action",onClick:r=>{r.stopPropagation(),o(n.session_key)},children:"Open"}),a(be,{className:"\
ow-icon","aria-hidden":"true"})]})]})},n.session_key))})]})}function Kn({tool:e,purpose:t,busy:o,onAnswer:n,where:r}){return g(
"div",{className:"ow-permission",children:[g("div",{className:"ow-permission-body",children:[g("div",{className:"ow-perm\
ission-head",children:[a(Po,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",children:"\
Waiting for your permission"})]}),g("p",{className:"ow-permission-what",children:[r&&g("span",{className:"ow-truncate",children:[
r," "]}),r?"wants to run ":"Wants to run ",a("code",{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),
g("div",{className:"ow-permission-actions",children:[a(E,{onClick:()=>n(!0),disabled:o,children:"Approve"}),a(E,{onClick:()=>n(
!1),disabled:o,children:"Reject"})]})]})}function ut({children:e}){return a("div",{className:"ow-expand",children:a("div",
{className:"ow-expand-inner",children:e})})}var pt=3;function xn(e){let t=e.provenance.trim().toLowerCase();return e.references.
filter(o=>o.label.trim().toLowerCase()!==t)}function Zo({candidates:e,prominent:t,busy:o,onAdd:n}){let[r,d]=_(""),i=t?e:
e.filter(u=>u.sessions>=2);return g("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{
className:"ow-bootstrap-head",children:t?"No big goals defined yet":i.length>0?"Suggested goals":"Add a goal"}),(t||i.length>
0)&&a("div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, o\
r name your own."}),i.length>0&&a("div",{className:"ow-bootstrap-chips",children:i.slice(0,4).map(u=>g("button",{type:"b\
utton",className:"ow-bootstrap-chip",disabled:o,onClick:()=>n(u.name,[u.name]),children:[u.name," ",g("span",{className:"\
ow-bootstrap-count",children:[u.sessions," session",u.sessions===1?"":"s"]})]},u.name))}),g("div",{className:"ow-bootstr\
ap-custom",children:[a(Go,{value:r,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:u=>d(
u.target.value),onKeyDown:u=>{u.key==="Enter"&&r.trim()&&(n(r),d(""))}}),a(E,{disabled:o||!r.trim(),onClick:()=>{n(r),d(
"")},children:"Add goal"})]})]})}function _n({members:e}){let t=e[0],o=new Set(e.map(u=>u.sessionKey).filter(Boolean)).size,
n=e.filter(u=>u.state==="needs-you").length,r=e.filter(u=>u.state==="running").length,d=e.filter(u=>u.state==="done").length,
i=[`${o} session${o===1?"":"s"}`];return n&&i.push(`${n} need${n===1?"s":""} you`),r&&i.push(`${r} running`),d&&i.push(`${d}\
 done`),g("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),
a("div",{className:"ow-digest-counts",children:i.join(" \xB7 ")})]})}function Sn({block:e,status:t,folded:o,onToggle:n,onSplit:r,
selected:d,onSelect:i}){let u=e.items[0],h=new Set(e.items.map(c=>c.sessionKey).filter(Boolean)).size,y=[];for(let c=0;c<
e.items.length;c+=1)for(let f=c+1;f<e.items.length;f+=1)e.items[c].sessionKey!==e.items[f].sessionKey&&y.push(Ne(e.items[c],
e.items[f]));let l=g(Ce,{children:[n&&a("button",{type:"button",className:"ow-goal-fold","aria-label":o?`Expand ${u.title}`:
`Collapse ${u.title}`,"aria-expanded":!o,onClick:c=>{c.stopPropagation(),n()},children:a(be,{className:"ow-icon ow-init-\
chevron","data-open":o?void 0:"true","aria-hidden":"true"})}),a(Bn,{className:"ow-icon","aria-hidden":"true"}),a("span",
{className:"ow-truncate ow-block-name",children:u.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:ke[t]}),
g("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),g("span",{className:"\
ow-truncate",children:[h," sessions, one goal"]})]}),r&&a(E,{className:"ow-block-open",title:"Not the same goal \u2014 split \
into separate cards","aria-label":`Split ${u.title}`,onClick:c=>{c.stopPropagation(),r(y)},children:"Split"})]});return i?
a(V,{onActivate:i,className:"ow-block-tab ow-goal-tab","aria-pressed":d,"data-selected":d?"true":void 0,children:l}):a("\
div",{className:"ow-block-tab",children:l})}var er=.3;function Rn({item:e,items:t,onMerge:o}){let n=t.filter(r=>r.id!==e.
id&&r.sessionKey&&e.sessionKey&&r.sessionKey!==e.sessionKey).map(r=>({other:r,score:Me(e,r)?1:Te(e.title,r.title)})).filter(
r=>r.score>=er).sort((r,d)=>d.score-r.score).slice(0,2);return n.length===0?null:g("div",{className:"ow-merge-hint",children:[
a("span",{className:"ow-merge-hint-label",children:"Same goal?"}),n.map(({other:r})=>g("button",{type:"button",className:"\
ow-merge-hint-btn ow-truncate",onClick:()=>o(Ne(e,r)),children:["Merge with \u201C",r.title,"\u201D"]},r.id))]})}function tr({
item:e,onOpen:t}){let o=e.references.find(r=>r.kind==="session"),n=e.references.filter(r=>r.kind!=="session");return g("\
div",{className:"ow-block-tab",children:[a(mt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-trunca\
te ow-block-name",children:o?.label??e.provenance}),g("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hi\
dden":"true",children:"\xB7"}),a("span",{className:"ow-truncate",children:e.provenance}),n.slice(0,2).map(r=>a("span",{className:"\
ow-truncate",children:r.label},`${r.kind}:${r.id}`))]}),a(E,{className:"ow-block-open",onClick:t,"aria-label":`Open ${o?.
label??e.provenance}`,children:"Open"})]})}function nr({session:e,selected:t,onSelect:o,onOpen:n}){return g(V,{onActivate:o,
className:"ow-srow","data-selected":t,children:[a(mt,{className:"ow-icon","aria-hidden":"true"}),g("div",{className:"ow-\
srow-body",children:[a("div",{className:"ow-srow-name ow-truncate",children:e.label}),a("div",{className:"ow-srow-state \
ow-truncate",children:e.leading.summary})]}),a("span",{className:"ow-srow-badge",children:wt(e.leading)}),a(E,{className:"\
ow-srow-open","aria-label":`Open ${e.label}`,onClick:r=>{r.stopPropagation(),n()},children:"Open"})]})}function or({reference:e,
checks:t}){let o=e.status?/fail|conflict|closed/.test(e.status):!1;return g("div",{className:"ow-pr-head",children:[g("d\
iv",{className:"ow-pr-head-top",children:[a("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&a("a",
{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,
children:a(Wn,{className:"ow-icon","aria-hidden":"true"})})]}),a("div",{className:"ow-pr-status-line",children:t?.available&&
(t.total??0)>0?g("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total,
" checks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&a("span",{className:"ow-pr-dot","data-ba\
d":o?"true":void 0,children:e.status})})]})}function rr({reference:e,onOpenSession:t}){let o=Qo[e.kind],n=g(Ce,{children:[
a(o,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.label})]});return e.url?a("a",{className:"ow-ref\
erence ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:r=>r.stopPropagation(),children:n}):
e.sessionKey?a(V,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:n}):a("span",{className:"\
ow-reference",children:n})}function ft({item:e,selected:t,continuation:o,whyRanked:n,onSelect:r,onOpenSession:d,onAnswerPermission:i,
permissionBusy:u,onRetry:h,retryBusy:y,onPickStep:l,onSnooze:c,onHandled:f,hideBadge:C,compact:x,headless:v}){let[O,N]=_(
!1);return g(V,{onActivate:r,className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":
void 0,"data-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[g("div",{className:"ow-row-layout",
children:[g("div",{className:"ow-row-content",children:[!v&&g("div",{className:"ow-row-heading",children:[C?e.state==="d\
one"&&a(In,{className:"ow-icon ow-row-check","aria-hidden":"true"}):wt(e),a("span",{className:"ow-row-title",children:e.
title})]}),(!x||t)&&e.summary&&!(e.nextSteps??[]).some(k=>k.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",
children:e.summary}),e.duplicateOf&&g(V,{className:"ow-row-duplicate",onActivate:()=>d(e.duplicateOf.sessionKey),children:[
a(Bn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:se(`duplicate_${e.duplicateOf.
because}`,{title:e.duplicateOf.title})})]}),n&&a("div",{className:"ow-row-why",children:n}),!o&&g("div",{className:"ow-r\
ow-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),xn(e).length>0&&a("span",{"aria-hidden":"tr\
ue",children:"\xB7"}),a("span",{className:"ow-references",children:xn(e).slice(0,3).map(k=>a(rr,{reference:k,onOpenSession:d},
`${k.kind}:${k.id}`))})]})]}),a("div",{className:"ow-row-actions",children:a(be,{className:"ow-icon","aria-hidden":"true"})})]}),
t&&l&&e.nextSteps&&e.nextSteps.length>0&&a(ut,{children:g("div",{className:"ow-row-steps",children:[a("div",{className:"\
ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,O?void 0:pt).map((k,q)=>a("button",{type:"button",className:"\
ow-quote-step",title:k.why??k.what,onClick:I=>{I.stopPropagation(),l(k.what)},children:k.what},`${q}:${k.what}`)),e.nextSteps.
length>pt&&a("button",{type:"button",className:"ow-steps-more",onClick:k=>{k.stopPropagation(),N(q=>!q)},children:O?"Sho\
w fewer":`+${e.nextSteps.length-pt} more`})]})}),t&&e.retryPath&&h&&a(ut,{children:a("div",{className:"ow-retry",children:a(
E,{onClick:()=>h(e.retryPath),disabled:!!y,children:"Retry"})})}),t&&e.permissionId&&i&&a(ut,{children:a(Kn,{tool:e.permissionTool||
"a tool",purpose:e.permissionPurpose,busy:!!u,onAnswer:k=>i(e.permissionId,k)})}),e.state==="needs-you"&&c&&f&&g("div",{
className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-aside-btn",onClick:k=>{k.stopPropagation(),c(
e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",onClick:k=>{k.stopPropagation(),f(e.id,e.updatedAt)},
children:"Handled"})]})]})}var sr=["unblock","followup","running","done"],ar={unblock:{label:"UNBLOCK",cls:"ow-lane-unbl\
ock"},followup:{label:"FOLLOW UP",cls:"ow-lane-followup"}};function ir(e){return e.state==="done"?"done":e.state==="runn\
ing"?"running":ot(e)??"unblock"}function lr({items:e,selectedId:t,onSelect:o,onOpenSession:n,onAnswerPermission:r,permissionBusy:d,
onRetry:i,retryBusy:u,onPickStep:h,onSnooze:y,onHandled:l,doneTitles:c}){let[f,C]=_(!1),x=new Map;for(let v of e){let O=ir(
v),N=x.get(O);N?N.push(v):x.set(O,[v])}return g(Ce,{children:[sr.filter(v=>x.has(v)).map(v=>{let O=x.get(v),N=v==="unblo\
ck"||v==="followup"?ar[v]:null,k=N?O.map(I=>I.action!=="resume"?me(Q(I),se):""):[],q=N&&k.length>0&&k.every(I=>I&&I===k[0])?
k[0]:void 0;return g("div",{className:"ow-lane",children:[N&&g("div",{className:"ow-lane-head",children:[a("span",{className:`\
ow-lane-badge ${N.cls}`,children:N.label}),q&&a("span",{className:"ow-lane-reason",children:q})]}),O.map(I=>a(ft,{item:I,
hideBadge:!0,compact:!0,selected:t===I.id,continuation:!0,whyRanked:q?void 0:I.state==="needs-you"&&I.action!=="resume"?
me(Q(I),se):void 0,onSelect:()=>o(I),onOpenSession:n,onAnswerPermission:r,permissionBusy:d,onRetry:i,retryBusy:u,onPickStep:h,
onSnooze:y,onHandled:l},I.id))]},v)}),!x.has("done")&&c&&c.length>0&&g("div",{className:"ow-lane ow-lane-done",children:[
g("button",{type:"button",className:"ow-goals-toggle","aria-expanded":f,onClick:()=>C(v=>!v),children:[a(be,{className:"\
ow-icon","data-open":f?"true":void 0,"aria-hidden":"true"}),c.length," done"]}),f&&a("ul",{className:"ow-done-list",children:c.
map(v=>g("li",{className:"ow-row-goal-done",children:[a(In,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"\
ow-truncate",children:v})]},v))})]})]})}function he({title:e,items:t,selectedId:o,onSelect:n,onOpenSession:r,onAnswerPermission:d,
permissionBusy:i,onRetry:u,retryBusy:h,onPickStep:y,onSnooze:l,onHandled:c,footer:f,collapsed:C,onToggleCollapsed:x,groupBy:v,
prChecks:O,prFilter:N,doneBySession:k,goalVerdicts:q,onSplitGoal:I,onMergeGoal:ae,initiativeBlocks:ht,collapsedInitiatives:We,
onToggleInitiative:J,selectedGoalKey:ye,onSelectGoal:X,subtitle:ve,emptyLabel:xe}){let _e=st(t,v,q),ie=v==="pr"&&N&&N!==
"all"?_e.filter(w=>w.changeRef&&et(w.changeRef,O?.[w.changeRef.url??""])===N):_e,le=ht??[],M=v==="goal"?le.length:v==="p\
r"?ie.length:t.length,Ae=w=>g("div",{className:"ow-block","data-grouped":w.header?"true":void 0,children:[w.header==="se\
ssion"&&w.sessionKey&&a(tr,{item:w.items[0],onOpen:()=>r(w.sessionKey)}),w.header==="pr"&&w.changeRef&&a(or,{reference:w.
changeRef,checks:O?.[w.changeRef.url??""]}),w.header==="goal"&&a(Sn,{block:w,onSplit:I,selected:ye===w.key,onSelect:X?()=>X(
w.key):void 0}),w.header==="pr"?g(Ce,{children:[a("div",{className:"ow-pr-sublabel",children:"Sessions on this PR"}),sn(
w.items).map(S=>a(nr,{session:S,selected:o===S.leading.id,onSelect:()=>n(S.leading),onOpen:()=>r(S.sessionKey)},S.sessionKey))]}):
w.header==="session"?a(lr,{items:w.items,doneTitles:w.sessionKey?k?.[w.sessionKey]:void 0,selectedId:o,onSelect:n,onOpenSession:r,
onAnswerPermission:d,permissionBusy:i,onRetry:u,retryBusy:h,onPickStep:y,onSnooze:l,onHandled:c}):w.items.map(S=>g(wn,{children:[
a(ft,{item:S,selected:o===S.id,continuation:w.header==="session",whyRanked:S.state==="needs-you"&&S.action!=="resume"?me(
Q(S),se):void 0,onSelect:()=>n(S),onOpenSession:r,onAnswerPermission:d,permissionBusy:i,onRetry:u,retryBusy:h,onPickStep:y,
onSnooze:l,onHandled:c}),v==="goal"&&ae&&o===S.id&&a(Rn,{item:S,items:t,onMerge:ae})]},S.id))]},w.key),z=(w,S)=>g(wn,{children:[
a(ft,{item:w,selected:o===w.id,headless:S!==null&&w.title===S,whyRanked:w.state==="needs-you"&&w.action!=="resume"?me(Q(
w),se):void 0,onSelect:()=>n(w),onOpenSession:r,onAnswerPermission:d,permissionBusy:i,onRetry:u,retryBusy:h,onPickStep:y,
onSnooze:l,onHandled:c}),ae&&o===w.id&&a(Rn,{item:w,items:t,onMerge:ae})]},w.id),Be=w=>{if(w.name){let U=We?.[w.key]??w.
status!=="needs-you",j=w.blocks.flatMap(de=>de.items);return g("div",{className:"ow-block","data-grouped":"true",children:[
g(V,{onActivate:()=>J?.(w.key,!U),className:"ow-block-tab","aria-expanded":!U,children:[a(be,{className:"ow-icon ow-init\
-chevron","data-open":U?void 0:"true","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",children:w.
name}),a("span",{className:"ow-init-status","data-status":w.status,children:ke[w.status]}),g("span",{className:"ow-block\
-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),g("span",{className:"ow-truncate",children:[w.sessions.
length," session",w.sessions.length===1?"":"s"]})]})]}),U?a(_n,{members:j}):j.map(de=>z(de,null))]},w.key)}let S=w.blocks[0];
if(S.header==="goal"){let U=We?.[w.key]??w.status!=="needs-you";return g("div",{className:"ow-block","data-grouped":"tru\
e",children:[a(Sn,{block:S,status:w.status,folded:U,onToggle:J?()=>J(w.key,!U):void 0,onSplit:I,selected:ye===S.key,onSelect:X?
()=>X(S.key):void 0}),U?a(_n,{members:S.items}):S.items.map(j=>z(j,S.items[0].title))]},w.key)}let G=S.items[0];return g(
"div",{className:"ow-block","data-grouped":"true",children:[g(V,{onActivate:()=>n(G),className:"ow-block-tab ow-goal-tab",
"aria-pressed":o===G.id,"data-selected":o===G.id?"true":void 0,children:[wt(G),a("span",{className:"ow-truncate ow-block\
-name",children:G.title})]}),z(G,G.title)]},w.key)};return g("section",{className:"ow-section","aria-label":e,children:[
x?g(V,{onActivate:x,className:"ow-section-toggle",children:[a(gt,{label:e,count:M,subtitle:ve}),a(be,{className:"ow-icon\
 ow-section-chevron","data-open":C?void 0:"true","aria-hidden":"true"})]}):a(gt,{label:e,count:M,subtitle:ve}),C?null:a(
"div",{className:"ow-section-list",children:v==="goal"?le.length===0?a("p",{className:"ow-section-empty",children:xe}):le.
map(Be):ie.length===0?a("p",{className:"ow-section-empty",children:xe}):ie.map(Ae)}),f]})}function dr(e,t){let o=Jt(t,se);
if(!e)return["Crew Manager context: workspace overview.",...o,"Answer the user about the state of their work. This is a \
conversation, not an action channel."].join(`
`);let n=e.references.map(r=>`${r.kind}: ${r.label} (${r.id})`).join(`
`);return[`Crew Manager context: ${e.title}`,...o,`Selected item: ${e.title}`,`State: ${ke[e.state]}`,e.issue?"Issue det\
ected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,e.sessionKey?`Referenced session: ${e.
sessionKey}`:"Referenced session: none",`References:
${n}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(r=>!!r).join(`
`)}function cr(){let e=zo(),t=oe(e);t.current=e;let o=qo(),n=Do(),[r,d]=_("all"),[i,u]=_("session"),[h,y]=_("all"),[l,c]=_(
{}),[f,C]=_(""),[x,v]=_(null),[O,N]=_(null),[k,q]=_(null),[I,ae]=_({}),[ht,We]=_("unknown"),J=oe("unknown"),ye=oe(new Map),
[X,ve]=_({}),[xe,_e]=_({}),[ie,le]=_([]),[M,Ae]=_(null),[z,Be]=_(null),[w,S]=_(()=>Ie(lt)),[G,U]=_(()=>Ie(bn)),[j,de]=_(
()=>Ie(dt,{merged:[],split:[]})),[ce,bt]=_([]),[Ln,En]=_(()=>Ie(yn)),[Ke,Le]=_(null),[On,Pn]=_(()=>Ie(kn,null)??!0),[Ee,
De]=_(Lt),[kt,yt]=_({}),vt=oe(!0),[$n,xt]=_(!0),[_t,Fe]=_(null),[Tn,Mn]=_(!1),[St,Se]=_(null),W=oe(!0),Re=oe(0),Ge=oe(!1);
F(()=>(W.current=!0,()=>{W.current=!1,Re.current+=1}),[]);let L=$(async()=>{let s=++Re.current,p=t.current;try{let[m,b,R,
A,Pe,Wt]=await Promise.all([p.get("/api/chat/slots"),p.get("/api/approvals"),p.get("/api/spawn"),p.get("/api/workflows/r\
uns"),p.get("/api/crons"),p.get("/api/artifacts")]);if(!W.current||s!==Re.current)return;q({slots:Array.isArray(m)?m:[],
approvals:Array.isArray(b)?b:[],agents:Array.isArray(R.agents)?R.agents:[],workflows:Array.isArray(A.runs)?A.runs:[],crons:Array.
isArray(Pe.jobs)?Pe.jobs:[],artifacts:Array.isArray(Wt.artifacts)?Wt.artifacts:[]}),Fe(null)}catch(m){W.current&&s===Re.
current&&Fe(m instanceof Error?m:new Error("Unable to load Crew Manager sources"))}finally{W.current&&s===Re.current&&xt(
!1)}},[]);F(()=>{L();let s=window.setInterval(()=>{L()},Ho);return()=>window.clearInterval(s)},[L]);let zn=()=>{xt(!0),Fe(
null),L()};F(()=>{if(!k||J.current==="unsupported"||J.current==="disabled")return;let s=gn(k.slots,we).filter(m=>ye.current.
get(m.key)!==at(m));if(s.length===0)return;let p=!1;return(async()=>{let{summaries:m,support:b}=await fn(s,R=>t.current.
get(R));if(!(p||!W.current)&&(J.current=b,We(b),b==="available")){for(let R of s)m[R.key]&&ye.current.set(R.key,at(R));ae(
R=>({...R,...m}))}})(),()=>{p=!0}},[k]),F(()=>{if(!k||!vt.current)return;let s=!1;return(async()=>{try{let p=await t.current.
get("/api/apps/crew-manager/stalls");if(s||!W.current)return;let m={};for(let R of p?.stalls??[])R?.key&&(m[R.key]=R);ve(
m);let b={};for(let R of p?.error_loops??[])R?.key&&(b[R.key]=R);yt(b)}catch{vt.current=!1,W.current&&(ve({}),yt({}))}})(),
()=>{s=!0}},[k]),F(()=>{let s=!1;return(async()=>{try{let p=await t.current.get("/api/apps/crew-manager/initiatives");if(s||
!W.current)return;bt((p?.initiatives??[]).filter(m=>m?.name))}catch{}})(),()=>{s=!0}},[]),F(()=>{if(Ee.unsupported)return;
let s=f.trim();if(!At(s)){De(b=>b.hits.length?{...b,hits:[]}:b);return}let p=!1,m=setTimeout(()=>{(async()=>{try{let b=await t.
current.get(Ot(s,Jo));if(p||!W.current)return;De(Et(b))}catch{W.current&&De({unsupported:!0,hits:[]})}})()},300);return()=>{
p=!0,clearTimeout(m)}},[f,Ee.unsupported]);let Rt=T(()=>Xt(on(k??{slots:[],approvals:[],agents:[],workflows:[],crons:[],
artifacts:[]},se,I,X,kt,j),xe),[k,I,X,kt,xe,j]),Oe=T(()=>en(Rt,w,G),[Rt,w,G]),B=T(()=>Oe.items.filter(s=>tn(s)),[Oe]),Ue=T(
()=>rt(B),[B]),Nt=T(()=>{let s={};for(let p of B){if(p.state!=="done"||!p.sessionKey)continue;let m=s[p.sessionKey];m?m.
push(p.title):s[p.sessionKey]=[p.title]}return s},[B]),Y=T(()=>B.find(s=>s.id===x)??null,[B,x]),K=T(()=>{let s=rn(B,f);return i===
"pr"||i==="goal"||f.trim()||r==="all"?s:s.filter(p=>p.state===r)},[r,B,f,i]),qn=T(()=>{let s={all:0,failing:0,running:0,
merged:0};for(let p of st(K,"pr")){if(!p.changeRef)continue;s.all++;let m=et(p.changeRef,l[p.changeRef.url??""]);m!=="ot\
her"&&s[m]++}return s},[K,l]);F(()=>{if(i!=="pr")return;let s=new Set;for(let m of K)for(let b of m.references)b.kind===
"change"&&b.url&&/github\.com\/.+\/pull\//.test(b.url)&&s.add(b.url);let p=!1;for(let m of s)l[m]||t.current.get(`/pr-ch\
ecks?url=${encodeURIComponent(m)}`).then(b=>{!p&&W.current&&c(R=>({...R,[m]:b}))}).catch(()=>{});return()=>{p=!0}},[i,K,
l]),F(()=>n(Ue["needs-you"]),[Ue,n]),F(()=>{x&&!B.some(s=>s.id===x)&&v(null)},[B,x]),F(()=>{let s=p=>{(p.metaKey||p.ctrlKey)&&
p.key.toLocaleLowerCase("en-US")==="k"&&(p.preventDefault(),document.querySelector('[data-crew-manager-search="true"]')?.
focus())};return window.addEventListener("keydown",s),()=>window.removeEventListener("keydown",s)},[]);let je=k?.slots.find(
s=>s.key===we),Dn=!!(je||Tn);F(()=>{!k||je||Ge.current||(Ge.current=!0,e.post("/api/chat/slots",{name:we,title:"Conducto\
r"}).then(()=>{W.current&&(Mn(!0),L())}).catch(s=>{W.current&&(Ge.current=!1,Se(s instanceof Error?`Conductor session co\
uld not be created: ${s.message}`:"Conductor session could not be created"))}))},[e,je,L,k]);let It=T(()=>Ht(k?.approvals??
[],ie,s=>B.find(p=>p.sessionKey===s)?.title??k?.slots?.find(p=>p.key===s)?.title??s),[B,k,ie]),ue=Y&&!Y.permissionId?Y:null,
He=T(()=>i==="goal"?un(K,ce,j):[],[i,K,ce,j]),H=T(()=>{if(!Ke)return null;for(let s of He){let p=s.blocks.find(m=>m.key===
Ke);if(p&&p.items.length>0)return p}return null},[Ke,He]),P=H?cn(H.items):null,[Fn,Ct]=_(!1),Gn=T(()=>{if(i!=="goal")return[];
let s=ln(k?.slots??[],ce),p=dn(B,ce),m=new Set,b=[];for(let R of[...p,...s])m.has(R.name.toLowerCase())||(m.add(R.name.toLowerCase()),
b.push(R));return b.sort((R,A)=>A.sessions-R.sessions)},[i,k,B,ce]),Un=$(async(s,p=[])=>{if(s.trim()){Ct(!0);try{let m=await t.
current.post("/api/apps/crew-manager/initiatives",{name:s.trim(),aliases:p});W.current&&m?.initiatives&&bt(m.initiatives.
filter(b=>b?.name))}catch{}finally{W.current&&Ct(!1)}}},[]),Z=$(async(s,p)=>{if(!M){Ae(s),Se(null);try{await t.current.post(
`/api/approvals/${encodeURIComponent(s)}/${p?"approve":"reject"}`,{}),L()}catch(m){Se(m instanceof Error?`Could not answ\
er that request: ${m.message}`:"Could not answer that request"),L()}finally{W.current&&Ae(null)}}},[L,M]),jn=$(s=>{S(p=>{
let m=Object.fromEntries(Object.entries(p).filter(([,b])=>b>Date.now()));return m[s]=Date.now()+Zt,re(lt,m),m}),v(null)},
[]),Hn=$((s,p)=>{U(m=>{let b={...m,[s]:p};return re(bn,b),b}),v(null)},[]),Vn=$(()=>{S({}),re(lt,{})},[]),Yn=$(s=>{de(p=>{
let m={merged:p.merged.filter(b=>!s.includes(b)),split:[...new Set([...p.split,...s])]};return re(dt,m),m})},[]),Qn=$(s=>{
de(p=>{let m={merged:[...new Set([...p.merged,s])],split:p.split.filter(b=>b!==s)};return re(dt,m),m})},[]),Jn=$(()=>{Pn(
s=>(re(kn,!s),!s))},[]),pe=$(async s=>{if(!z){Be(s),Se(null);try{await t.current.post(s,{}),L()}catch(p){Se(p instanceof
Error?`Could not re-run it: ${p.message}`:"Could not re-run it"),L()}finally{W.current&&Be(null)}}},[L,z]),ee=$(async s=>{
if(H&&P?.sessionKey){let m=P.sessionKey,b=H.items.map(A=>`- ${A.references.find(Pe=>Pe.kind==="session")?.label??A.sessionKey}\
: ${ke[A.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(m)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${H.items[0].title}", which spans sessions:`,b,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:m}).catch(A=>{if(!(A instanceof
SyntaxError))throw A}),!W.current)return;_e(A=>({...A,[P.id]:Date.now()})),le(A=>A.includes(m)?A:[...A,m]);let R=P.references.
find(A=>A.kind==="session")?.label??P.title;N(P.moving||P.state==="running"?`Sent to ${R} \u2014 the active session on this g\
oal`:`Sent to ${R} \u2014 resuming the last session on this goal`),Le(null),L();return}let p=Y&&!Y.permissionId?Y:null;if(p?.
sessionKey){let m=p.sessionKey;if(await t.current.post("/api/chat",{message:s,slot:m}).catch(b=>{if(!(b instanceof SyntaxError))
throw b}),!W.current)return;_e(b=>({...b,[p.id]:Date.now()})),le(b=>b.includes(m)?b:[...b,m]),N(`Sent new instructions t\
o ${p.title}`),v(null),L();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(we)}/context`,{content:dr(Y,
B),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:we}).catch(m=>{if(!(m instanceof
SyntaxError))throw m})},[Y,H,P,B,L]),Xn=T(()=>Bt(Ee.hits,K),[Ee.hits,K]),Ve={"needs-you":K.filter(s=>s.state==="needs-yo\
u"),running:K.filter(s=>s.state==="running"),done:K.filter(s=>s.state==="done")},Zn=$((s,p)=>{En(m=>{let b={...m,[s]:p};
return re(yn,b),b})},[]),eo=$(s=>{Le(p=>p===s?null:s),v(null),N(null)},[]),te=s=>o(`/chat?sid=${encodeURIComponent(s)}`),
ge=s=>{v(p=>p===s.id?null:s.id),Le(null),N(null)};return g("div",{className:"ow-root","data-crew-manager-shell":"quiet-s\
plit",children:[a("style",{children:mn}),a(Uo,{title:"Crew Manager",subtitle:"See what needs your input, what is still r\
unning, and what finished recently."}),a("div",{className:"ow-body",children:g("div",{className:"ow-layout",children:[a(
"nav",{className:"ow-rail","aria-label":"Crew Manager",children:a("div",{className:"ow-rail-inner",children:g("div",{className:"\
ow-groupby",role:"group","aria-label":"Group by",children:[a("span",{className:"ow-groupby-label",children:"Group by"}),
["session","pr","goal"].map(s=>a(E,{onClick:()=>u(s),"aria-pressed":i===s,"data-selected":i===s,className:"ow-groupby-op\
t",children:s==="session"?"Session":s==="pr"?"PR":"Goal"},s))]})})}),a("main",{className:"ow-work",children:g("div",{className:"\
ow-work-inner",children:[g("div",{className:"ow-toolbar",children:[a(jo,{"data-crew-manager-search":"true",value:f,onChange:s=>C(
s.target.value),placeholder:"Search work and projects\u2026 \u2318K","aria-label":"Search work",className:"ow-search"}),
i==="pr"?a("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(vn).map(s=>g(
E,{onClick:()=>y(s),"aria-pressed":h===s,"data-selected":h===s,className:"ow-filter",children:[vn[s],a("span",{className:"\
ow-count",children:qn[s]})]},s))}):i==="goal"?null:a("div",{className:"ow-filters",role:"group","aria-label":"Filter by \
state",children:Object.keys(ct).map(s=>g(E,{onClick:()=>d(s),"aria-pressed":r===s,"data-selected":r===s,className:"ow-fi\
lter",children:[ct[s],a("span",{className:"ow-count",children:Ue[s]})]},s))})]}),$n?a(hn,{rows:7}):_t&&!k?a(it,{icon:a(Nn,
{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:_t.message,action:a(E,{onClick:zn,children:"\
Try again"})}):K.length===0?a(it,{icon:a(To,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter \
or search for a session, project, PR, or output."}):r==="all"||f.trim()?i==="pr"?K.some(s=>s.references.some(p=>p.kind===
"change"||p.kind==="issue"))?a(he,{title:"Work by PR",subtitle:"Every pull request your work touches",items:K,prChecks:l,
prFilter:h,selectedId:x,onSelect:ge,onOpenSession:te,onAnswerPermission:(s,p)=>{Z(s,p)},permissionBusy:M!==null,onRetry:s=>{
pe(s)},retryBusy:z!==null,onPickStep:s=>{ee(s)},groupBy:i,emptyLabel:"No matching work"}):a(it,{icon:a(An,{className:"ow\
-icon"}),title:"No work is linked to a PR right now",subtitle:"Work links to a PR when a session mentions its URL (a Git\
Hub/GitLab pull, merge request, or issue). None of the current sessions do, so there is nothing to group by PR yet.",action:a(
E,{onClick:()=>u("session"),children:"Back to Session view"})}):i==="goal"?a(he,{title:"Work by goal",subtitle:"The same\
 job across sessions, merged into one card",items:K,selectedId:x,onSelect:ge,onOpenSession:te,onAnswerPermission:(s,p)=>{
Z(s,p)},permissionBusy:M!==null,onRetry:s=>{pe(s)},retryBusy:z!==null,onPickStep:s=>{ee(s)},groupBy:i,goalVerdicts:j,onSplitGoal:Yn,
onMergeGoal:Qn,initiativeBlocks:He,collapsedInitiatives:Ln,onToggleInitiative:Zn,selectedGoalKey:Ke,onSelectGoal:eo,footer:a(
Zo,{candidates:Gn,prominent:ce.length===0,busy:Fn,onAdd:(s,p)=>{Un(s,p)}}),emptyLabel:"No matching work"}):g(Ce,{children:[
a(he,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:Ve["needs-you"],doneBySession:Nt,selectedId:x,
onSelect:ge,onSnooze:jn,onHandled:Hn,footer:Oe.snoozedCount>0?g("button",{type:"button",className:"ow-aside-note",onClick:Vn,
children:[Oe.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:te,onAnswerPermission:(s,p)=>{
Z(s,p)},permissionBusy:M!==null,onRetry:s=>{pe(s)},retryBusy:z!==null,onPickStep:s=>{ee(s)},groupBy:i,emptyLabel:"Nothin\
g needs your input right now."}),a(he,{title:"In progress",subtitle:"Being worked on right now",items:Ve.running,doneBySession:Nt,
selectedId:x,onSelect:ge,onOpenSession:te,onAnswerPermission:(s,p)=>{Z(s,p)},permissionBusy:M!==null,onRetry:s=>{pe(s)},
retryBusy:z!==null,onPickStep:s=>{ee(s)},groupBy:i,emptyLabel:"Nothing is in progress right now."}),a(he,{title:"Done re\
cently",subtitle:"Finished in the last few days",items:Ve.done,selectedId:x,onSelect:ge,collapsed:On,onToggleCollapsed:Jn,
onOpenSession:te,onAnswerPermission:(s,p)=>{Z(s,p)},permissionBusy:M!==null,onRetry:s=>{pe(s)},retryBusy:z!==null,onPickStep:s=>{
ee(s)},groupBy:i,emptyLabel:"No recent completed work."})]}):a(he,{title:ct[r],items:K,selectedId:x,onSelect:ge,onOpenSession:te,
onAnswerPermission:(s,p)=>{Z(s,p)},permissionBusy:M!==null,onRetry:s=>{pe(s)},retryBusy:z!==null,onPickStep:s=>{ee(s)},groupBy:i,
emptyLabel:"No matching work"}),f.trim()&&a(Xo,{hits:Xn,now:Date.now(),onOpenSession:te})]})}),g("aside",{className:"ow-\
conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:g("div",{className:"ow-c\
onductor-title",children:[a("h2",{children:"Conductor"}),!ue&&a("span",{className:"ow-conductor-sub",children:"select wo\
rk, or ask across all"})]})}),a("div",{className:"ow-chat",children:Dn?g("div",{className:"ow-chat-panel",children:[It.length>
0&&a("div",{className:"ow-permissions",role:"alert",children:It.map(s=>a(Kn,{tool:s.tool,purpose:s.purpose,where:s.sessionLabel,
busy:M!==null,onAnswer:p=>{Z(s.id,p)}},s.id))}),O&&g("div",{className:"ow-conductor-receipt",role:"status",children:[a(Cn,
{className:"ow-icon"}),O]}),St&&a("div",{className:"ow-chat-error",role:"alert",children:St}),a("div",{className:"ow-emb\
ed",children:a(Fo,{slotKey:we,frameless:!0,startAtBottom:!0,placeholder:H?"Instruction for this goal\u2026":ue?.sessionKey?
"New instructions for this session\u2026":"Ask across your work\u2026",onSend:ee})}),H&&P?g("div",{className:"ow-quote o\
w-quote-docked",children:[g("div",{className:"ow-quote-body ow-quote-goal",children:[g("div",{className:"ow-quote-line",
children:[a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"ow-quote-title",title:H.items[0].
title,children:H.items[0].title})]}),g("span",{className:"ow-quote-route ow-truncate",children:["\u2192 ",P.references.find(
s=>s.kind==="session")?.label??P.title,P.moving||P.state==="running"?" (active)":" (will resume)"]})]}),a(E,{className:"\
ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{Le(null),N(null)},children:"Clear"})]}):ue&&g("div",{
className:"ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-body",children:[a("span",{className:"ow-eyeb\
row",children:ue.sessionKey?"Instructing":"Quoted"}),a("span",{className:"ow-quote-title",title:ue.title,children:ue.title})]}),
a(E,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{v(null),N(null)},children:"Clear"})]})]}):
a("div",{className:"ow-chat-loading",children:a(hn,{rows:4})})})]})]})})]})}export{cr as default};
