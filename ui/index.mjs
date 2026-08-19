import{Fragment as gn,useCallback as T,useEffect as F,useMemo as $,useRef as ne,useState as _}from"react";import{AlertTriangle as xn,
Bot as Bo,Check as _n,ChevronRight as Ie,Check as Sn,Clock as Ko,Package as Eo,ExternalLink as Rn,MessageSquare as ft,Shield as Lo,
Waves as Oo,Search as Po,Tag as Nn,Users as In,Zap as To}from"lucide-react";import{useAppApi as $o,useNavigate as Mo,useNavBadge as qo,
ChatEmbed as zo}from"@kirocrew/app-sdk";import{Badge as qe,Btn as E,ContentSkeleton as fn,EmptyState as at,Input as Do,PageHeader as Fo,
SearchInput as Go}from"@kirocrew/app-sdk/ui";function Wt(e){return e.trim().length>=2}function At(e,t){let o=new Set(t.map(d=>d.sessionKey).filter(Boolean)),n=new Set,
r=[];for(let d of e){let l=d?.session_key;!l||o.has(l)||n.has(l)||(n.add(l),r.push(d))}return r}function Jn(e,t){if(!e)return 0;
let o=e>1e11?e/1e3:e,n=Math.floor((t/1e3-o)/86400);return n>0?n:0}function Bt(e,t){let o=Jn(e,t);if(o<=0)return"today";if(o===
1)return"yesterday";if(o<7)return`${o} days ago`;if(o<30){let r=Math.floor(o/7);return r===1?"last week":`${r} weeks ago`}
let n=Math.floor(o/30);return n===1?"last month":`${n} months ago`}var Kt={unsupported:!1,hits:[]};function Et(e){return!e||
e.enabled===!1?{unsupported:!0,hits:[]}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:[]).filter(o=>!!o?.session_key)}}
function Lt(e,t){return`/api/apps/crew-manager/recall?${new URLSearchParams({q:e.trim(),limit:String(t)}).toString()}`}function Ye(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),n=t%
60;return n===0?`${o} hour${o===1?"":"s"}`:`${o}h ${n}m`}function Ut(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function Ze(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function jt(e,t,o){let n=new Set(t.filter(Boolean));if(n.size===0)return[];
let r=new Set,d=[];for(let l of e){let u=l.slot;!u||!n.has(u)||!l.id||r.has(l.id)||(r.add(l.id),d.push({id:l.id,sessionKey:u,
sessionLabel:o(u),tool:l.tool||"a tool",purpose:l.tool_purpose}))}return d}var Ot={"needs-you":0,running:1,done:2};function D(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}var Pt=72;function pe(e,t){
let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let r=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(r.length<=Pt)return r;let d=r.slice(0,Pt),l=d.lastIndexOf(" ");return`${(l>24?d.slice(0,l):d).trim()}\u2026`}
function te(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var Xn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
Zn=/^\((?:code|diff|widget|image)\)$/,eo=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
to=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,no=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
oo=/[?？]["'”’)\]]*$/;function Ht(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||Zn.test(t)||Xn.test(
t)?null:t}function et(e){if(!e.waiting_for_input)return null;let t=Ht(e);return!t||eo.test(t)||to.test(t)?null:no.test(t)||
oo.test(t)?t:null}function Tt(e){return e.pending_approval||et(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":te(e)?"needs-you":"done"}function ro(e,t){if(e.pending_approval)return t("approval_waiting");let o=et(e);return o||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):te(e)?t("linked_change_issue"):Ht(e)??t("recent_w\
ork_ready"))}function Qe(e,t){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function so(e){return e.pending_approval?"review-approval":et(e)?"reply":"open"}function ao(e,t){
let o=(e.source_links??[]).map(n=>({kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:
`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key,status:Ut(n)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:ro(e,t),state:Tt(e),moving:Tt(e)==="running"||void 0,issue:te(e),updatedAt:D(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:Qe(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:te(e)||void 0,action:so(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...o]}}function tt(e,t){e.references.
some(o=>o.kind===t.kind&&o.id===t.id)||e.references.push(t)}function Vt(e){return(e.source||"").toLowerCase()==="subagen\
t"}function io(e,t,o){let n=Vt(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,D(t.ts)),e.summary=o(n?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=n?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,tt(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),
sessionKey:t.slot||e.sessionKey})}function lo(e,t,o){e.updatedAt=Math.max(e.updatedAt,D(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),tt(e,{kind:"agent",id:t.id,
label:t.agent||o("agent"),sessionKey:t.parent||e.sessionKey})}function co(e,t,o){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow\
_failed",{name:t.name})),tt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function uo(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function po(e,t,o){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===o}function go(e){let t=null,o=-1;for(let n of e){let r=n.last_touched_turn??0;r>o&&(o=r,t=n)}return t}function fo(e,t){let o=e.next_steps?.find(r=>r.what?.trim())?.what?.trim();if(o)return o;let n=[...e.progress??[]].reverse().
find(r=>r.trim());return n?n.trim():e.initial_intent?.trim()||t("work_in_progress")}var mo=3;function wo(e,t,o){if(!t?.enabled)
return[];let n=t.intents??[];if(n.length===0)return[];let r=(e.source_links??[]).map(c=>({kind:c.kind==="issue"?"issue":
"change",id:c.url,label:c.kind==="issue"?`issue #${c.number}`:`${c.provider} #${c.number}`,url:c.url,sessionKey:e.key,status:Ut(
c)})),d=[],l=go(n),h=!!(e.running||e.subagents_running||e.orchestrating)?[]:n.filter(c=>c.state==="in-progress");h.forEach(
c=>{let m=n.indexOf(c),C=(c.next_steps??[]).filter(x=>x.what?.trim());d.push({id:`unattended:${e.key}:${m}`,title:pe(c.title,
e.title||o("untitled_work")),summary:C[0]?.what?.trim()||o("no_next_step"),state:"needs-you",issue:te(e),updatedAt:D(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:Qe(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:te(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.
key},...r],nextSteps:C,progress:(c.progress??[]).filter(x=>x.trim()),stale:!!t.stale,lastTouchedTurn:c.last_touched_turn??
0})}),n.forEach((c,m)=>{if(h.includes(c))return;let C=uo(c,e);if(!C)return;let x=(c.next_steps??[]).filter(v=>v.what?.trim());
d.push({id:`intent:${e.key}:${m}`,title:pe(c.title,e.title||o("untitled_work")),summary:fo(c,o),state:C,issue:!1,updatedAt:D(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:Qe(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:te(
e)||void 0,unverified:c.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...r],nextSteps:x,progress:(c.progress??[]).filter(v=>v.trim()),stale:!!t.stale,lastTouchedTurn:c.
last_touched_turn??0,moving:po(c,e,l)||void 0})});let y=d.filter(c=>c.state==="needs-you"),i=d.filter(c=>c.state!=="need\
s-you").sort((c,m)=>(m.lastTouchedTurn??0)-(c.lastTouchedTurn??0));return[...y,...i].slice(0,Math.max(mo,y.length))}var Yt=new Set(
["crew-manager-conductor","overwatch-conductor"]),ho={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},bo=3;function ko(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Pe=5;function Qt(e,t,o=Date.now()){let n=ot(e),r=tn(
e.filter(l=>l.state==="needs-you"),o),d=[`Fleet: ${n["needs-you"]} waiting on the user, ${n.running} in progress, ${n.done}\
 finished recently.`];return r.length===0?(d.push("Nothing is waiting on the user."),d):(d.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Pe,r.length)}):`),r.slice(0,Pe).forEach((l,u)=>{let h=ge(Y(l,o),t),y=l.sessionKey?
` [session ${l.sessionKey}]`:"";d.push(`${u+1}. ${l.title} \u2014 ${l.summary} (${h})${y}`)}),r.length>Pe&&d.push(`\u2026and ${r.
length-Pe} more waiting.`),d)}var yo=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),$t=.6,Mt=2;function Je(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!yo.has(t)))]}function Te(e,t){let o=Je(e),n=Je(t);if(o.length<Mt||n.length<Mt)return 0;
let r=o.length<=n.length?o:n,d=new Set(o.length<=n.length?n:o);return r.filter(u=>d.has(u)).length/r.length}function qt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function zt(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function Dt(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function $e(e,t){
if(qt(e).find(r=>qt(t).includes(r)))return"same_change";if(zt(e).find(r=>zt(t).includes(r)))return"same_artifact";if(Te(
e.title,t.title)>=$t)return"same_topic";for(let r of Dt(e))for(let d of Dt(t))if(Te(r,d)>=$t)return"same_step";return null}
var Me={merged:[],split:[]};function Ft(e){return`${e.sessionKey??e.id}|${Je(e.title).join(" ")}`}function Re(e,t){return[
Ft(e),Ft(t)].sort().join("")}function vo(e,t=Me){let o=e.filter(n=>n.state!=="done"&&n.sessionKey).sort((n,r)=>(n.updatedAt||
0)-(r.updatedAt||0));for(let n=1;n<o.length;n+=1){let r=o[n];for(let d=0;d<n;d+=1){let l=o[d];if(l.sessionKey===r.sessionKey||
t.split.includes(Re(r,l)))continue;let u=$e(r,l);if(u){r.duplicateOf={sessionKey:l.sessionKey,title:l.title,because:u};break}}}}
var xo=3e4;function Jt(e,t,o=Date.now()){return Object.keys(t).length===0?e:e.map(n=>{let r=t[n.id];return!r||o-r>xo||n.
state==="running"?n:{...n,state:"running",moving:!0,instructed:!0}})}function Y(e,t=Date.now()){let o=[],n=(d,l,u=1)=>{o.
push({signal:d,weight:ho[d]*u,values:l})};e.approvalKind==="subagent"?n("subagent_gate"):e.approvalKind==="tool"&&n("app\
roval_owed"),e.action==="reply"&&n("input_requested"),e.unverified&&n("unverified_completion"),e.loopRepeats&&n("error_l\
oop",{repeats:String(e.loopRepeats)}),e.runFailed&&n("run_failed"),e.stalledFor&&n("stalled",{duration:Ye(e.stalledFor)}),
e.changeBlocked&&n("change_blocked"),e.unattendedGoals&&n("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&
n("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let r=ko(e,t);return r>0&&n("waiting_a_whil\
e",{hours:String(r)},Math.min(r,bo)),o.sort((d,l)=>l.weight-d.weight),{score:o.reduce((d,l)=>d+l.weight,0),signals:o}}var _o={
approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"un\
block",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function nt(e,t=Date.now()){
if(e.state!=="needs-you")return null;for(let o of Y(e,t).signals){let n=_o[o.signal];if(n)return n}return null}var Xt=14400*
1e3;function Zt(e,t,o,n=Date.now()){let r=0,d=[];for(let l of e){if(l.state!=="needs-you"){d.push(l);continue}let u=t[l.
id];if(u&&u>n){r+=1;continue}let h=o[l.id];if(h!==void 0&&l.updatedAt<=h){d.push({...l,state:"done",issue:!1});continue}
d.push(l)}return{items:d,snoozedCount:r}}var So=4320*60*1e3;function en(e,t=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:t-e.updatedAt<=So}var Ro={"needs-you":1,running:-1,done:-1};function No(e,t,o){let n=e.updatedAt>0,r=t.updatedAt>0;
return!n&&!r?0:n?r?(e.updatedAt-t.updatedAt)*o:-1:1}function ge(e,t){let o=e.signals.slice(0,2);return o.length===0?t("r\
ank_nothing_pressing"):o.map(r=>t(`rank_${r.signal}`,r.values)).join(t("rank_join"))}function tn(e,t=Date.now()){let o=new Map(
e.map(n=>[n.id,Y(n,t)]));return[...e].sort((n,r)=>{let d=Ot[n.state]-Ot[r.state];if(d!==0)return d;if(n.state==="needs-y\
ou"){let l=(o.get(r.id)?.score??0)-(o.get(n.id)?.score??0);if(l!==0)return l}else if(n.issue!==r.issue)return n.issue?-1:
1;return No(n,r,Ro[n.state])})}function nn(e,t,o={},n={},r={},d=Me){let l=new Map,u=new Map;for(let i of e.slots){if(!i.
key||Yt.has(i.key)||i.memory_mode==="incognito")continue;let c=wo(i,o[i.key],t);if(c.length>0){for(let x of c)l.set(x.id,
x);let C=c.find(x=>x.state==="needs-you")??c[0];u.set(i.key,C);continue}let m=ao(i,t);l.set(m.id,m),u.set(i.key,m)}for(let[
i,c]of Object.entries(n)){let m=u.get(i);m&&(m.state="needs-you",m.issue=!0,m.stalledFor=c.silent_secs,m.summary=c.reason?
t("stalled_because",{reason:c.reason,duration:Ye(c.silent_secs)}):t("stalled_for",{duration:Ye(c.silent_secs)}),m.action=
"open")}for(let[i,c]of Object.entries(r)){let m=u.get(i);m&&(m.state="needs-you",m.issue=!0,m.loopRepeats=c.repeats,m.summary=
t("error_loop",{tool:c.tool,repeats:String(c.repeats)}),m.action="open")}for(let i of e.approvals){let c=i.slot?u.get(i.
slot):void 0;if(c){io(c,i,t);continue}l.set(`approval:${i.id}`,{id:`approval:${i.id}`,title:pe(i.tool||i.source,t("appro\
val_needed")),summary:i.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:D(i.ts),provenance:t("\
approval"),action:"review-approval",approvalKind:Vt(i)?"subagent":"tool",permissionId:i.id,permissionTool:i.tool||i.source,
permissionPurpose:i.tool_purpose,references:[{kind:"approval",id:i.id,label:i.tool||i.source||t("approval")}]})}for(let i of e.
agents){let c=i.parent?u.get(i.parent):void 0;if(c){lo(c,i,t);continue}let m=!!(i.done&&(i.error||i.outcome==="failed"));
i.parent&&!m||l.set(`agent:${i.id}`,{id:`agent:${i.id}`,title:pe(i.task||i.agent,t("agent_work")),summary:m?i.error?.trim()||
t("agent_failed",{task:i.task}):i.done?t("agent_done"):t("work_in_progress"),state:m?"needs-you":i.done?"done":"running",
issue:m,runFailed:m||void 0,retryPath:m&&!i.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(i.id)}/retry`:void 0,
updatedAt:D(i.started),provenance:i.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:i.id,label:i.agent||
t("agent")}]})}for(let i of e.workflows){let c=i.session_key?u.get(i.session_key):void 0;if(c){co(c,i,t);continue}let m=i.
status==="failed";l.set(`workflow:${i.run_id}`,{id:`workflow:${i.run_id}`,title:pe(i.name,i.run_id),summary:m?t("workflo\
w_failed_generic"):i.status==="running"?t("workflow_running"):t("workflow_finished"),state:m?"needs-you":i.status==="run\
ning"?"running":"done",issue:m,runFailed:m||void 0,retryPath:m?`/api/workflows/runs/${encodeURIComponent(i.run_id)}/reru\
n`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:i.run_id,label:i.name||i.
run_id}]})}for(let i of e.crons){if(!i.is_running&&i.last_status!=="error")continue;let c=i.last_status==="error";l.set(
`monitor:${i.id}`,{id:`monitor:${i.id}`,title:i.name,summary:t(c?"monitor_failed":"monitor_running"),state:c?"needs-you":
"running",issue:c,runFailed:c||void 0,retryPath:c?`/api/crons/${encodeURIComponent(i.id)}/run`:void 0,updatedAt:D(i.running_since||
i.last_run_ts||i.created_ts),provenance:t("monitor"),action:c?"discuss":void 0,references:[{kind:"monitor",id:i.id,label:i.
name}]})}let h=[...e.artifacts].sort((i,c)=>D(c.updated_at)-D(i.updated_at)).slice(0,8);for(let i of h){let c=i.session_key&&
u.has(i.session_key)?i.session_key:void 0;l.set(`artifact:${i.slug}`,{id:`artifact:${i.slug}`,title:pe(i.name,t("artifac\
t")),summary:i.description||t("artifact_ready",{kind:i.kind}),state:"done",issue:!1,updatedAt:D(i.updated_at||i.created_at),
sessionKey:c,provenance:i.session_title||i.source||t("artifact"),action:c?"open":void 0,references:[{kind:"artifact",id:i.
slug,label:i.name,sessionKey:c},...c?[{kind:"session",id:c,label:i.session_title||c,sessionKey:c}]:[]]})}let y=[...l.values()];
return vo(y,d),tn(y)}function ot(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.
filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function on(e,t){let o=t.trim().toLowerCase();
return o?e.filter(n=>[n.title,n.summary,n.provenance,...n.references.flatMap(d=>[d.label,d.id,d.url])].join(`
`).toLowerCase().includes(o)):e}function rn(e){let t=[],o=new Map;for(let n of e){let r=n.sessionKey;if(!r)continue;let d=o.
get(r);if(d){d.count+=1;continue}let l=n.references.find(h=>h.kind==="session")?.label??n.provenance,u={sessionKey:r,label:l,
leading:n,count:1};o.set(r,u),t.push(u)}return t}function rt(e,t,o=Me){if(t==="pr")return Io(e);if(t==="goal")return Xe(
e,o);let n=[],r=new Map;for(let d of e){let l=d.sessionKey;if(!l){n.push({key:d.id,items:[d],header:null,sessionKey:null,
changeRef:null});continue}let u=r.get(l);if(u){u.items.push(d);continue}let h={key:l,items:[d],header:"session",sessionKey:d.
sessionKey??null,changeRef:null};r.set(l,h),n.push(h)}return n}function Io(e){let t=[],o=new Map;for(let n of e){let r=n.
references.filter(d=>d.kind==="change"||d.kind==="issue");for(let d of r){let l=`${d.kind}:${d.id}`,u=o.get(l);if(u){u.items.
push(n);continue}let h={key:l,items:[n],header:"pr",sessionKey:null,changeRef:d};o.set(l,h),t.push(h)}}return t}function Xe(e,t){
let o=e.map((u,h)=>h),n=u=>{for(;o[u]!==u;)o[u]=o[o[u]],u=o[u];return u},r=(u,h)=>{o[n(h)]=n(u)};for(let u=0;u<e.length;u+=
1)for(let h=u+1;h<e.length;h+=1){let y=e[u],i=e[h];if(!y.sessionKey||!i.sessionKey||y.sessionKey===i.sessionKey)continue;
let c=Re(y,i);t.split.includes(c)||(t.merged.includes(c)||$e(y,i))&&r(u,h)}let d=[],l=new Map;for(let u=0;u<e.length;u+=
1){let h=n(u),y=l.get(h);if(y){y.items.push(e[u]),y.header="goal";continue}let i={key:`goal:${e[u].id}`,items:[e[u]],header:null,
sessionKey:null,changeRef:null};l.set(h,i),d.push(i)}return d}function Co(e,t){let o=e.references.find(n=>n.kind==="sess\
ion")?.label??"";for(let n of[e.title,o,e.provenance]){let r=n.toLowerCase();for(let d of t)if(d.aliases.some(l=>l&&r.includes(
l.toLowerCase())))return d.name}return null}function sn(e,t){let o=t.flatMap(d=>d.aliases.map(l=>l.toLowerCase())),n=new Set(
["workspace","workspaces","home","src","tmp","documents","desktop"]),r=new Map;for(let d of e){if(!d.key||Yt.has(d.key)||
d.memory_mode==="incognito")continue;let l=d.project;if(!l)continue;let u=l.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop();!u||n.has(u.toLowerCase())||o.some(h=>u.toLowerCase().includes(h)||h.includes(u.toLowerCase()))||r.set(u,(r.get(
u)??0)+1)}return[...r.entries()].map(([d,l])=>({name:d,sessions:l})).sort((d,l)=>l.sessions-d.sessions)}function Gt(e){return e.
some(t=>t.state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function an(e){let t=e.find(n=>n.
moving);if(t)return t;let o=e.find(n=>n.state==="running");return o||[...e].sort((n,r)=>(r.updatedAt||0)-(n.updatedAt||0))[0]}
function Wo(e){let t=[],o=new Set;for(let n of e){let r=n.sessionKey;!r||o.has(r)||(o.add(r),t.push(n.references.find(d=>d.
kind==="session")?.label??n.provenance))}return t}function ln(e,t,o=Me){let n=new Map,r=[],d=new Map;for(let i of e){let c=Co(
i,t);if(d.set(i.id,c),c===null){r.push(i);continue}n.has(c)||n.set(c,[]),n.get(c).push(i)}let l=Xe(r,o),u=new Map;for(let i of l)
u.set(i.items[0].id,i);let h=[],y=new Set;for(let i of e){let c=d.get(i.id)??null;if(c!==null){if(y.has(c))continue;y.add(
c);let C=n.get(c);h.push({key:`initiative:${c}`,name:c,status:Gt(C),sessions:Wo(C),blocks:Xe(C,o)});continue}let m=u.get(
i.id);m&&h.push({key:m.key,name:null,status:Gt(m.items),sessions:[],blocks:[m]})}return h}function st(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function cn(e,t){return e.filter(o=>o.key&&
o.key!==t&&o.memory_mode!=="incognito").sort((o,n)=>dn(n)-dn(o)).slice(0,12)}function dn(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function un(e,t){
let o={},n="unknown";for(let r of e)try{let d=await t(`/api/chat/slots/${encodeURIComponent(r.key)}/summary`);if(!d||typeof d!=
"object"){n="unsupported";break}if(d.enabled===!1){n="disabled";break}o[r.key]=d,n="available"}catch{n="unsupported";break}
return{summaries:o,support:n}}var pn=String.raw`
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
`;import{Fragment as Ce,jsx as a,jsxs as g}from"react/jsx-runtime";var it="crew-manager.snoozed",mn="crew-manager.handled",
wn="crew-manager.done-collapsed",lt="crew-manager.goal-verdicts",hn="crew-manager.initiative-collapsed";function Ne(e,t={}){
try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}function oe(e,t){try{localStorage.setItem(e,JSON.
stringify(t))}catch{}}var fe="crew-manager-conductor",Uo=5e3,jo={session:"Session",approval:"Approval",agent:"Agent",workflow:"\
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
untitled_work:"Untitled work"};function re(e,t={}){return jo[e].replace(/\{\{(\w+)\}\}/g,(o,n)=>t[n]??"")}var Ho={followup:"\
FOLLOW UP",unblock:"UNBLOCK"},we={"needs-you":"Needs you",running:"Running",done:"Done"},dt={all:"All","needs-you":"Need\
s you",running:"Running",done:"Done"},bn={all:"All",failing:"Failing",running:"Running",merged:"Merged"},Vo={session:ft,
approval:xn,agent:Bo,workflow:To,monitor:Oo,artifact:Eo,change:Rn,issue:Nn};function j({children:e,onActivate:t,...o}){return a(
"div",{...o,role:"button",tabIndex:0,onClick:t,onKeyDown:n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t())},children:e})}
function pt({label:e,count:t,subtitle:o}){return g("div",{className:"ow-section-header",children:[g("div",{className:"ow\
-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow-section-count",children:t})]}),
o&&a("p",{className:"ow-section-subtitle",children:o})]})}function mt(e){if(e.state==="needs-you"){let t=nt(e);return t?
a(qe,{variant:"warn",className:"ow-verb",children:Ho[t]}):null}return e.state==="running"?e.moving?g(qe,{variant:"aim",children:[
a(Ko,{className:"ow-icon"}),we[e.state]]}):a(qe,{variant:"muted",children:"Queued"}):g(qe,{variant:"ok",children:[a(Sn,{
className:"ow-icon"}),we[e.state]]})}var Yo=8;function Qo({hits:e,now:t,onOpenSession:o}){return e.length===0?null:g("section",{className:"ow-section","aria-\
label":"From past work",children:[a(pt,{label:"From past work",count:e.length}),a("div",{className:"ow-section-list",children:e.
map(n=>a(j,{className:"ow-row ow-recall-row",onActivate:()=>o(n.session_key),"data-testid":`recall-${n.session_key}`,children:g(
"div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[g("div",{className:"ow-row-head\
ing",children:[a("span",{className:"ow-row-title",children:n.title}),a("span",{className:"ow-recall-age",children:Bt(n.modified,
t)})]}),n.snippet&&a("p",{className:"ow-row-summary",children:n.snippet})]}),g("div",{className:"ow-row-actions",children:[
a(E,{className:"ow-primary-action",onClick:r=>{r.stopPropagation(),o(n.session_key)},children:"Open"}),a(Ie,{className:"\
ow-icon","aria-hidden":"true"})]})]})},n.session_key))})]})}function Cn({tool:e,purpose:t,busy:o,onAnswer:n,where:r}){return g(
"div",{className:"ow-permission",children:[g("div",{className:"ow-permission-body",children:[g("div",{className:"ow-perm\
ission-head",children:[a(Lo,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",children:"\
Waiting for your permission"})]}),g("p",{className:"ow-permission-what",children:[r&&g("span",{className:"ow-truncate",children:[
r," "]}),r?"wants to run ":"Wants to run ",a("code",{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),
g("div",{className:"ow-permission-actions",children:[a(E,{onClick:()=>n(!0),disabled:o,children:"Approve"}),a(E,{onClick:()=>n(
!1),disabled:o,children:"Reject"})]})]})}function ct({children:e}){return a("div",{className:"ow-expand",children:a("div",
{className:"ow-expand-inner",children:e})})}var ut=3;function kn(e){let t=e.provenance.trim().toLowerCase();return e.references.
filter(o=>o.label.trim().toLowerCase()!==t)}function Jo({candidates:e,prominent:t,busy:o,onAdd:n}){let[r,d]=_(""),l=t?e:
e.filter(u=>u.sessions>=2);return g("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{
className:"ow-bootstrap-head",children:t?"No big goals defined yet":"Add a goal"}),(t||l.length>0)&&a("div",{className:"\
ow-bootstrap-sub",children:"A goal gathers the same job across sessions. Make one from a project you are working in:"}),
l.length>0&&a("div",{className:"ow-bootstrap-chips",children:l.slice(0,4).map(u=>g("button",{type:"button",className:"ow\
-bootstrap-chip",disabled:o,onClick:()=>n(u.name,[u.name]),children:[u.name," ",g("span",{className:"ow-bootstrap-count",
children:[u.sessions," session",u.sessions===1?"":"s"]})]},u.name))}),g("div",{className:"ow-bootstrap-custom",children:[
a(Do,{value:r,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:u=>d(u.target.value),onKeyDown:u=>{
u.key==="Enter"&&r.trim()&&(n(r),d(""))}}),a(E,{disabled:o||!r.trim(),onClick:()=>{n(r),d("")},children:"Add goal"})]})]})}
function yn({block:e,status:t,onSplit:o,selected:n,onSelect:r}){let d=e.items[0],l=new Set(e.items.map(y=>y.sessionKey).
filter(Boolean)).size,u=[];for(let y=0;y<e.items.length;y+=1)for(let i=y+1;i<e.items.length;i+=1)e.items[y].sessionKey!==
e.items[i].sessionKey&&u.push(Re(e.items[y],e.items[i]));let h=g(Ce,{children:[a(In,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-truncate ow-block-name",children:d.title}),t&&a("span",{className:"ow-init-status","data\
-status":t,children:we[t]}),g("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),
g("span",{className:"ow-truncate",children:[l," sessions, one goal"]})]}),o&&a(E,{className:"ow-block-open",title:"Not t\
he same goal \u2014 split into separate cards","aria-label":`Split ${d.title}`,onClick:y=>{y.stopPropagation(),o(u)},children:"\
Split"})]});return r?a(j,{onActivate:r,className:"ow-block-tab ow-goal-tab","aria-pressed":n,"data-selected":n?"true":void 0,
children:h}):a("div",{className:"ow-block-tab",children:h})}var Xo=.3;function vn({item:e,items:t,onMerge:o}){let n=t.filter(
r=>r.id!==e.id&&r.sessionKey&&e.sessionKey&&r.sessionKey!==e.sessionKey).map(r=>({other:r,score:$e(e,r)?1:Te(e.title,r.title)})).
filter(r=>r.score>=Xo).sort((r,d)=>d.score-r.score).slice(0,2);return n.length===0?null:g("div",{className:"ow-merge-hin\
t",children:[a("span",{className:"ow-merge-hint-label",children:"Same goal?"}),n.map(({other:r})=>g("button",{type:"butt\
on",className:"ow-merge-hint-btn ow-truncate",onClick:()=>o(Re(e,r)),children:["Merge with \u201C",r.title,"\u201D"]},r.
id))]})}function Zo({item:e,onOpen:t}){let o=e.references.find(r=>r.kind==="session"),n=e.references.filter(r=>r.kind!==
"session");return g("div",{className:"ow-block-tab",children:[a(ft,{className:"ow-icon","aria-hidden":"true"}),a("span",
{className:"ow-truncate ow-block-name",children:o?.label??e.provenance}),g("span",{className:"ow-block-tab-meta",children:[
a("span",{"aria-hidden":"true",children:"\xB7"}),a("span",{className:"ow-truncate",children:e.provenance}),n.slice(0,2).
map(r=>a("span",{className:"ow-truncate",children:r.label},`${r.kind}:${r.id}`))]}),a(E,{className:"ow-block-open",onClick:t,
"aria-label":`Open ${o?.label??e.provenance}`,children:"Open"})]})}function er({session:e,selected:t,onSelect:o,onOpen:n}){
return g(j,{onActivate:o,className:"ow-srow","data-selected":t,children:[a(ft,{className:"ow-icon","aria-hidden":"true"}),
g("div",{className:"ow-srow-body",children:[a("div",{className:"ow-srow-name ow-truncate",children:e.label}),a("div",{className:"\
ow-srow-state ow-truncate",children:e.leading.summary})]}),a("span",{className:"ow-srow-badge",children:mt(e.leading)}),
a(E,{className:"ow-srow-open","aria-label":`Open ${e.label}`,onClick:r=>{r.stopPropagation(),n()},children:"Open"})]})}function tr({
reference:e,checks:t}){let o=e.status?/fail|conflict|closed/.test(e.status):!1;return g("div",{className:"ow-pr-head",children:[
g("div",{className:"ow-pr-head-top",children:[a("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&
a("a",{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.
label}`,children:a(Rn,{className:"ow-icon","aria-hidden":"true"})})]}),a("div",{className:"ow-pr-status-line",children:t?.
available&&(t.total??0)>0?g("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??
0,"/",t.total," checks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&a("span",{className:"ow-pr\
-dot","data-bad":o?"true":void 0,children:e.status})})]})}function nr({reference:e,onOpenSession:t}){let o=Vo[e.kind],n=g(
Ce,{children:[a(o,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.label})]});return e.url?a("a",{className:"\
ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:r=>r.stopPropagation(),children:n}):
e.sessionKey?a(j,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:n}):a("span",{className:"\
ow-reference",children:n})}function gt({item:e,selected:t,continuation:o,whyRanked:n,onSelect:r,onOpenSession:d,onAnswerPermission:l,
permissionBusy:u,onRetry:h,retryBusy:y,onPickStep:i,onSnooze:c,onHandled:m,hideBadge:C,compact:x,headless:v}){let[L,N]=_(
!1);return g(j,{onActivate:r,className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":
void 0,"data-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[g("div",{className:"ow-row-layout",
children:[g("div",{className:"ow-row-content",children:[!v&&g("div",{className:"ow-row-heading",children:[C?e.state==="d\
one"&&a(_n,{className:"ow-icon ow-row-check","aria-hidden":"true"}):mt(e),a("span",{className:"ow-row-title",children:e.
title})]}),(!x||t)&&e.summary&&!(e.nextSteps??[]).some(k=>k.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",
children:e.summary}),e.duplicateOf&&g(j,{className:"ow-row-duplicate",onActivate:()=>d(e.duplicateOf.sessionKey),children:[
a(In,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:re(`duplicate_${e.duplicateOf.
because}`,{title:e.duplicateOf.title})})]}),n&&a("div",{className:"ow-row-why",children:n}),!o&&g("div",{className:"ow-r\
ow-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),kn(e).length>0&&a("span",{"aria-hidden":"tr\
ue",children:"\xB7"}),a("span",{className:"ow-references",children:kn(e).slice(0,3).map(k=>a(nr,{reference:k,onOpenSession:d},
`${k.kind}:${k.id}`))})]})]}),a("div",{className:"ow-row-actions",children:a(Ie,{className:"ow-icon","aria-hidden":"true"})})]}),
t&&i&&e.nextSteps&&e.nextSteps.length>0&&a(ct,{children:g("div",{className:"ow-row-steps",children:[a("div",{className:"\
ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,L?void 0:ut).map((k,z)=>a("button",{type:"button",className:"\
ow-quote-step",title:k.why??k.what,onClick:I=>{I.stopPropagation(),i(k.what)},children:k.what},`${z}:${k.what}`)),e.nextSteps.
length>ut&&a("button",{type:"button",className:"ow-steps-more",onClick:k=>{k.stopPropagation(),N(z=>!z)},children:L?"Sho\
w fewer":`+${e.nextSteps.length-ut} more`})]})}),t&&e.retryPath&&h&&a(ct,{children:a("div",{className:"ow-retry",children:a(
E,{onClick:()=>h(e.retryPath),disabled:!!y,children:"Retry"})})}),t&&e.permissionId&&l&&a(ct,{children:a(Cn,{tool:e.permissionTool||
"a tool",purpose:e.permissionPurpose,busy:!!u,onAnswer:k=>l(e.permissionId,k)})}),e.state==="needs-you"&&c&&m&&g("div",{
className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-aside-btn",onClick:k=>{k.stopPropagation(),c(
e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",onClick:k=>{k.stopPropagation(),m(e.id,e.updatedAt)},
children:"Handled"})]})]})}var or=["unblock","followup","running","done"],rr={unblock:{label:"UNBLOCK",cls:"ow-lane-unbl\
ock"},followup:{label:"FOLLOW UP",cls:"ow-lane-followup"}};function sr(e){return e.state==="done"?"done":e.state==="runn\
ing"?"running":nt(e)??"unblock"}function ar({items:e,selectedId:t,onSelect:o,onOpenSession:n,onAnswerPermission:r,permissionBusy:d,
onRetry:l,retryBusy:u,onPickStep:h,onSnooze:y,onHandled:i,doneTitles:c}){let[m,C]=_(!1),x=new Map;for(let v of e){let L=sr(
v),N=x.get(L);N?N.push(v):x.set(L,[v])}return g(Ce,{children:[or.filter(v=>x.has(v)).map(v=>{let L=x.get(v),N=v==="unblo\
ck"||v==="followup"?rr[v]:null,k=N?L.map(I=>I.action!=="resume"?ge(Y(I),re):""):[],z=N&&k.length>0&&k.every(I=>I&&I===k[0])?
k[0]:void 0;return g("div",{className:"ow-lane",children:[N&&g("div",{className:"ow-lane-head",children:[a("span",{className:`\
ow-lane-badge ${N.cls}`,children:N.label}),z&&a("span",{className:"ow-lane-reason",children:z})]}),L.map(I=>a(gt,{item:I,
hideBadge:!0,compact:!0,selected:t===I.id,continuation:!0,whyRanked:z?void 0:I.state==="needs-you"&&I.action!=="resume"?
ge(Y(I),re):void 0,onSelect:()=>o(I),onOpenSession:n,onAnswerPermission:r,permissionBusy:d,onRetry:l,retryBusy:u,onPickStep:h,
onSnooze:y,onHandled:i},I.id))]},v)}),!x.has("done")&&c&&c.length>0&&g("div",{className:"ow-lane ow-lane-done",children:[
g("button",{type:"button",className:"ow-goals-toggle","aria-expanded":m,onClick:()=>C(v=>!v),children:[a(Ie,{className:"\
ow-icon","data-open":m?"true":void 0,"aria-hidden":"true"}),c.length," done"]}),m&&a("ul",{className:"ow-done-list",children:c.
map(v=>g("li",{className:"ow-row-goal-done",children:[a(_n,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"\
ow-truncate",children:v})]},v))})]})]})}function me({title:e,items:t,selectedId:o,onSelect:n,onOpenSession:r,onAnswerPermission:d,
permissionBusy:l,onRetry:u,retryBusy:h,onPickStep:y,onSnooze:i,onHandled:c,footer:m,collapsed:C,onToggleCollapsed:x,groupBy:v,
prChecks:L,prFilter:N,doneBySession:k,goalVerdicts:z,onSplitGoal:I,onMergeGoal:se,initiativeBlocks:wt,collapsedInitiatives:ze,
onToggleInitiative:he,selectedGoalKey:be,onSelectGoal:Q,subtitle:ke,emptyLabel:ye}){let ve=rt(t,v,z),ae=v==="pr"&&N&&N!==
"all"?ve.filter(w=>w.changeRef&&Ze(w.changeRef,L?.[w.changeRef.url??""])===N):ve,ie=wt??[],M=v==="goal"?ie.length:v==="p\
r"?ae.length:t.length,We=w=>g("div",{className:"ow-block","data-grouped":w.header?"true":void 0,children:[w.header==="se\
ssion"&&w.sessionKey&&a(Zo,{item:w.items[0],onOpen:()=>r(w.sessionKey)}),w.header==="pr"&&w.changeRef&&a(tr,{reference:w.
changeRef,checks:L?.[w.changeRef.url??""]}),w.header==="goal"&&a(yn,{block:w,onSplit:I,selected:be===w.key,onSelect:Q?()=>Q(
w.key):void 0}),w.header==="pr"?g(Ce,{children:[a("div",{className:"ow-pr-sublabel",children:"Sessions on this PR"}),rn(
w.items).map(S=>a(er,{session:S,selected:o===S.leading.id,onSelect:()=>n(S.leading),onOpen:()=>r(S.sessionKey)},S.sessionKey))]}):
w.header==="session"?a(ar,{items:w.items,doneTitles:w.sessionKey?k?.[w.sessionKey]:void 0,selectedId:o,onSelect:n,onOpenSession:r,
onAnswerPermission:d,permissionBusy:l,onRetry:u,retryBusy:h,onPickStep:y,onSnooze:i,onHandled:c}):w.items.map(S=>g(gn,{children:[
a(gt,{item:S,selected:o===S.id,continuation:w.header==="session",whyRanked:S.state==="needs-you"&&S.action!=="resume"?ge(
Y(S),re):void 0,onSelect:()=>n(S),onOpenSession:r,onAnswerPermission:d,permissionBusy:l,onRetry:u,retryBusy:h,onPickStep:y,
onSnooze:i,onHandled:c}),v==="goal"&&se&&o===S.id&&a(vn,{item:S,items:t,onMerge:se})]},S.id))]},w.key),q=(w,S)=>g(gn,{children:[
a(gt,{item:w,selected:o===w.id,headless:S!==null&&w.title===S,whyRanked:w.state==="needs-you"&&w.action!=="resume"?ge(Y(
w),re):void 0,onSelect:()=>n(w),onOpenSession:r,onAnswerPermission:d,permissionBusy:l,onRetry:u,retryBusy:h,onPickStep:y,
onSnooze:i,onHandled:c}),se&&o===w.id&&a(vn,{item:w,items:t,onMerge:se})]},w.id),Ae=w=>{if(w.name){let H=ze?.[w.key]??w.
status!=="needs-you",J=w.blocks.flatMap(le=>le.items);return g("div",{className:"ow-block","data-grouped":"true",children:[
g(j,{onActivate:()=>he?.(w.key,!H),className:"ow-block-tab","aria-expanded":!H,children:[a(Ie,{className:"ow-icon ow-ini\
t-chevron","data-open":H?void 0:"true","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",children:w.
name}),a("span",{className:"ow-init-status","data-status":w.status,children:we[w.status]}),g("span",{className:"ow-block\
-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),g("span",{className:"ow-truncate",children:[w.sessions.
slice(0,3).join(" \xB7 "),w.sessions.length>3?` +${w.sessions.length-3}`:""]})]})]}),!H&&J.map(le=>q(le,null))]},w.key)}
let S=w.blocks[0];if(S.header==="goal")return g("div",{className:"ow-block","data-grouped":"true",children:[a(yn,{block:S,
status:w.status,onSplit:I,selected:be===S.key,onSelect:Q?()=>Q(S.key):void 0}),S.items.map(H=>q(H,S.items[0].title))]},w.
key);let G=S.items[0];return g("div",{className:"ow-block","data-grouped":"true",children:[g(j,{onActivate:()=>n(G),className:"\
ow-block-tab ow-goal-tab","aria-pressed":o===G.id,"data-selected":o===G.id?"true":void 0,children:[mt(G),a("span",{className:"\
ow-truncate ow-block-name",children:G.title})]}),q(G,G.title)]},w.key)};return g("section",{className:"ow-section","aria\
-label":e,children:[x?g(j,{onActivate:x,className:"ow-section-toggle",children:[a(pt,{label:e,count:M,subtitle:ke}),a(Ie,
{className:"ow-icon ow-section-chevron","data-open":C?void 0:"true","aria-hidden":"true"})]}):a(pt,{label:e,count:M,subtitle:ke}),
C?null:a("div",{className:"ow-section-list",children:v==="goal"?ie.length===0?a("p",{className:"ow-section-empty",children:ye}):
ie.map(Ae):ae.length===0?a("p",{className:"ow-section-empty",children:ye}):ae.map(We)}),m]})}function ir(e,t){let o=Qt(t,
re);if(!e)return["Crew Manager context: workspace overview.",...o,"Answer the user about the state of their work. This i\
s a conversation, not an action channel."].join(`
`);let n=e.references.map(r=>`${r.kind}: ${r.label} (${r.id})`).join(`
`);return[`Crew Manager context: ${e.title}`,...o,`Selected item: ${e.title}`,`State: ${we[e.state]}`,e.issue?"Issue det\
ected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,e.sessionKey?`Referenced session: ${e.
sessionKey}`:"Referenced session: none",`References:
${n}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(r=>!!r).join(`
`)}function lr(){let e=$o(),t=ne(e);t.current=e;let o=Mo(),n=qo(),[r,d]=_("all"),[l,u]=_("session"),[h,y]=_("all"),[i,c]=_(
{}),[m,C]=_(""),[x,v]=_(null),[L,N]=_(null),[k,z]=_(null),[I,se]=_({}),[wt,ze]=_("unknown"),he=ne("unknown"),be=ne(new Map),
[Q,ke]=_({}),[ye,ve]=_({}),[ae,ie]=_([]),[M,We]=_(null),[q,Ae]=_(null),[w,S]=_(()=>Ne(it)),[G,H]=_(()=>Ne(mn)),[J,le]=_(
()=>Ne(lt,{merged:[],split:[]})),[xe,ht]=_([]),[Wn,An]=_(()=>Ne(hn)),[Be,Ke]=_(null),[Bn,Kn]=_(()=>Ne(wn,null)??!0),[Ee,
De]=_(Kt),[bt,kt]=_({}),yt=ne(!0),[En,vt]=_(!0),[xt,Fe]=_(null),[Ln,On]=_(!1),[_t,_e]=_(null),W=ne(!0),Se=ne(0),Ge=ne(!1);
F(()=>(W.current=!0,()=>{W.current=!1,Se.current+=1}),[]);let K=T(async()=>{let s=++Se.current,p=t.current;try{let[f,b,R,
A,Oe,Ct]=await Promise.all([p.get("/api/chat/slots"),p.get("/api/approvals"),p.get("/api/spawn"),p.get("/api/workflows/r\
uns"),p.get("/api/crons"),p.get("/api/artifacts")]);if(!W.current||s!==Se.current)return;z({slots:Array.isArray(f)?f:[],
approvals:Array.isArray(b)?b:[],agents:Array.isArray(R.agents)?R.agents:[],workflows:Array.isArray(A.runs)?A.runs:[],crons:Array.
isArray(Oe.jobs)?Oe.jobs:[],artifacts:Array.isArray(Ct.artifacts)?Ct.artifacts:[]}),Fe(null)}catch(f){W.current&&s===Se.
current&&Fe(f instanceof Error?f:new Error("Unable to load Crew Manager sources"))}finally{W.current&&s===Se.current&&vt(
!1)}},[]);F(()=>{K();let s=window.setInterval(()=>{K()},Uo);return()=>window.clearInterval(s)},[K]);let Pn=()=>{vt(!0),Fe(
null),K()};F(()=>{if(!k||he.current==="unsupported"||he.current==="disabled")return;let s=cn(k.slots,fe).filter(f=>be.current.
get(f.key)!==st(f));if(s.length===0)return;let p=!1;return(async()=>{let{summaries:f,support:b}=await un(s,R=>t.current.
get(R));if(!(p||!W.current)&&(he.current=b,ze(b),b==="available")){for(let R of s)f[R.key]&&be.current.set(R.key,st(R));
se(R=>({...R,...f}))}})(),()=>{p=!0}},[k]),F(()=>{if(!k||!yt.current)return;let s=!1;return(async()=>{try{let p=await t.
current.get("/api/apps/crew-manager/stalls");if(s||!W.current)return;let f={};for(let R of p?.stalls??[])R?.key&&(f[R.key]=
R);ke(f);let b={};for(let R of p?.error_loops??[])R?.key&&(b[R.key]=R);kt(b)}catch{yt.current=!1,W.current&&(ke({}),kt({}))}})(),
()=>{s=!0}},[k]),F(()=>{let s=!1;return(async()=>{try{let p=await t.current.get("/api/apps/crew-manager/initiatives");if(s||
!W.current)return;ht((p?.initiatives??[]).filter(f=>f?.name))}catch{}})(),()=>{s=!0}},[]),F(()=>{if(Ee.unsupported)return;
let s=m.trim();if(!Wt(s)){De(b=>b.hits.length?{...b,hits:[]}:b);return}let p=!1,f=setTimeout(()=>{(async()=>{try{let b=await t.
current.get(Lt(s,Yo));if(p||!W.current)return;De(Et(b))}catch{W.current&&De({unsupported:!0,hits:[]})}})()},300);return()=>{
p=!0,clearTimeout(f)}},[m,Ee.unsupported]);let St=$(()=>Jt(nn(k??{slots:[],approvals:[],agents:[],workflows:[],crons:[],
artifacts:[]},re,I,Q,bt,J),ye),[k,I,Q,bt,ye,J]),Le=$(()=>Zt(St,w,G),[St,w,G]),O=$(()=>Le.items.filter(s=>en(s)),[Le]),Ue=$(
()=>ot(O),[O]),Rt=$(()=>{let s={};for(let p of O){if(p.state!=="done"||!p.sessionKey)continue;let f=s[p.sessionKey];f?f.
push(p.title):s[p.sessionKey]=[p.title]}return s},[O]),V=$(()=>O.find(s=>s.id===x)??null,[O,x]),B=$(()=>{let s=on(O,m);return l===
"pr"||l==="goal"||m.trim()||r==="all"?s:s.filter(p=>p.state===r)},[r,O,m,l]),Tn=$(()=>{let s={all:0,failing:0,running:0,
merged:0};for(let p of rt(B,"pr")){if(!p.changeRef)continue;s.all++;let f=Ze(p.changeRef,i[p.changeRef.url??""]);f!=="ot\
her"&&s[f]++}return s},[B,i]);F(()=>{if(l!=="pr")return;let s=new Set;for(let f of B)for(let b of f.references)b.kind===
"change"&&b.url&&/github\.com\/.+\/pull\//.test(b.url)&&s.add(b.url);let p=!1;for(let f of s)i[f]||t.current.get(`/pr-ch\
ecks?url=${encodeURIComponent(f)}`).then(b=>{!p&&W.current&&c(R=>({...R,[f]:b}))}).catch(()=>{});return()=>{p=!0}},[l,B,
i]),F(()=>n(Ue["needs-you"]),[Ue,n]),F(()=>{x&&!O.some(s=>s.id===x)&&v(null)},[O,x]),F(()=>{let s=p=>{(p.metaKey||p.ctrlKey)&&
p.key.toLocaleLowerCase("en-US")==="k"&&(p.preventDefault(),document.querySelector('[data-crew-manager-search="true"]')?.
focus())};return window.addEventListener("keydown",s),()=>window.removeEventListener("keydown",s)},[]);let je=k?.slots.find(
s=>s.key===fe),$n=!!(je||Ln);F(()=>{!k||je||Ge.current||(Ge.current=!0,e.post("/api/chat/slots",{name:fe,title:"Conducto\
r"}).then(()=>{W.current&&(On(!0),K())}).catch(s=>{W.current&&(Ge.current=!1,_e(s instanceof Error?`Conductor session co\
uld not be created: ${s.message}`:"Conductor session could not be created"))}))},[e,je,K,k]);let Nt=$(()=>jt(k?.approvals??
[],ae,s=>O.find(p=>p.sessionKey===s)?.title??k?.slots?.find(p=>p.key===s)?.title??s),[O,k,ae]),de=V&&!V.permissionId?V:null,
He=$(()=>l==="goal"?ln(B,xe,J):[],[l,B,xe,J]),U=$(()=>{if(!Be)return null;for(let s of He){let p=s.blocks.find(f=>f.key===
Be);if(p&&p.items.length>0)return p}return null},[Be,He]),P=U?an(U.items):null,[Mn,It]=_(!1),qn=$(()=>l==="goal"?sn(k?.slots??
[],xe):[],[l,k,xe]),zn=T(async(s,p=[])=>{if(s.trim()){It(!0);try{let f=await t.current.post("/api/apps/crew-manager/init\
iatives",{name:s.trim(),aliases:p});W.current&&f?.initiatives&&ht(f.initiatives.filter(b=>b?.name))}catch{}finally{W.current&&
It(!1)}}},[]),X=T(async(s,p)=>{if(!M){We(s),_e(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(s)}/${p?
"approve":"reject"}`,{}),K()}catch(f){_e(f instanceof Error?`Could not answer that request: ${f.message}`:"Could not ans\
wer that request"),K()}finally{W.current&&We(null)}}},[K,M]),Dn=T(s=>{S(p=>{let f=Object.fromEntries(Object.entries(p).filter(
([,b])=>b>Date.now()));return f[s]=Date.now()+Xt,oe(it,f),f}),v(null)},[]),Fn=T((s,p)=>{H(f=>{let b={...f,[s]:p};return oe(
mn,b),b}),v(null)},[]),Gn=T(()=>{S({}),oe(it,{})},[]),Un=T(s=>{le(p=>{let f={merged:p.merged.filter(b=>!s.includes(b)),split:[
...new Set([...p.split,...s])]};return oe(lt,f),f})},[]),jn=T(s=>{le(p=>{let f={merged:[...new Set([...p.merged,s])],split:p.
split.filter(b=>b!==s)};return oe(lt,f),f})},[]),Hn=T(()=>{Kn(s=>(oe(wn,!s),!s))},[]),ce=T(async s=>{if(!q){Ae(s),_e(null);
try{await t.current.post(s,{}),K()}catch(p){_e(p instanceof Error?`Could not re-run it: ${p.message}`:"Could not re-run \
it"),K()}finally{W.current&&Ae(null)}}},[K,q]),Z=T(async s=>{if(U&&P?.sessionKey){let f=P.sessionKey,b=U.items.map(A=>`-\
 ${A.references.find(Oe=>Oe.kind==="session")?.label??A.sessionKey}: ${we[A.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(f)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${U.items[0].title}", which spans sessions:`,b,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:f}).catch(A=>{if(!(A instanceof
SyntaxError))throw A}),!W.current)return;ve(A=>({...A,[P.id]:Date.now()})),ie(A=>A.includes(f)?A:[...A,f]);let R=P.references.
find(A=>A.kind==="session")?.label??P.title;N(P.moving||P.state==="running"?`Sent to ${R} \u2014 the active session on this g\
oal`:`Sent to ${R} \u2014 resuming the last session on this goal`),Ke(null),K();return}let p=V&&!V.permissionId?V:null;if(p?.
sessionKey){let f=p.sessionKey;if(await t.current.post("/api/chat",{message:s,slot:f}).catch(b=>{if(!(b instanceof SyntaxError))
throw b}),!W.current)return;ve(b=>({...b,[p.id]:Date.now()})),ie(b=>b.includes(f)?b:[...b,f]),N(`Sent new instructions t\
o ${p.title}`),v(null),K();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(fe)}/context`,{content:ir(V,
O),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:fe}).catch(f=>{if(!(f instanceof
SyntaxError))throw f})},[V,U,P,O,K]),Vn=$(()=>At(Ee.hits,B),[Ee.hits,B]),Ve={"needs-you":B.filter(s=>s.state==="needs-yo\
u"),running:B.filter(s=>s.state==="running"),done:B.filter(s=>s.state==="done")},Yn=T((s,p)=>{An(f=>{let b={...f,[s]:p};
return oe(hn,b),b})},[]),Qn=T(s=>{Ke(p=>p===s?null:s),v(null),N(null)},[]),ee=s=>o(`/chat?sid=${encodeURIComponent(s)}`),
ue=s=>{v(p=>p===s.id?null:s.id),Ke(null),N(null)};return g("div",{className:"ow-root","data-crew-manager-shell":"quiet-s\
plit",children:[a("style",{children:pn}),a(Fo,{title:"Crew Manager",subtitle:"See what needs your input, what is still r\
unning, and what finished recently."}),a("div",{className:"ow-body",children:g("div",{className:"ow-layout",children:[a(
"nav",{className:"ow-rail","aria-label":"Crew Manager",children:a("div",{className:"ow-rail-inner",children:g("div",{className:"\
ow-groupby",role:"group","aria-label":"Group by",children:[a("span",{className:"ow-groupby-label",children:"Group by"}),
["session","pr","goal"].map(s=>a(E,{onClick:()=>u(s),"aria-pressed":l===s,"data-selected":l===s,className:"ow-groupby-op\
t",children:s==="session"?"Session":s==="pr"?"PR":"Goal"},s))]})})}),a("main",{className:"ow-work",children:g("div",{className:"\
ow-work-inner",children:[g("div",{className:"ow-toolbar",children:[a(Go,{"data-crew-manager-search":"true",value:m,onChange:s=>C(
s.target.value),placeholder:"Search work and projects\u2026 \u2318K","aria-label":"Search work",className:"ow-search"}),
l==="pr"?a("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(bn).map(s=>g(
E,{onClick:()=>y(s),"aria-pressed":h===s,"data-selected":h===s,className:"ow-filter",children:[bn[s],a("span",{className:"\
ow-count",children:Tn[s]})]},s))}):l==="goal"?null:a("div",{className:"ow-filters",role:"group","aria-label":"Filter by \
state",children:Object.keys(dt).map(s=>g(E,{onClick:()=>d(s),"aria-pressed":r===s,"data-selected":r===s,className:"ow-fi\
lter",children:[dt[s],a("span",{className:"ow-count",children:Ue[s]})]},s))})]}),En?a(fn,{rows:7}):xt&&!k?a(at,{icon:a(xn,
{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:xt.message,action:a(E,{onClick:Pn,children:"\
Try again"})}):B.length===0?a(at,{icon:a(Po,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter \
or search for a session, project, PR, or output."}):r==="all"||m.trim()?l==="pr"?B.some(s=>s.references.some(p=>p.kind===
"change"||p.kind==="issue"))?a(me,{title:"Work by PR",subtitle:"Every pull request your work touches",items:B,prChecks:i,
prFilter:h,selectedId:x,onSelect:ue,onOpenSession:ee,onAnswerPermission:(s,p)=>{X(s,p)},permissionBusy:M!==null,onRetry:s=>{
ce(s)},retryBusy:q!==null,onPickStep:s=>{Z(s)},groupBy:l,emptyLabel:"No matching work"}):a(at,{icon:a(Nn,{className:"ow-\
icon"}),title:"No work is linked to a PR right now",subtitle:"Work links to a PR when a session mentions its URL (a GitH\
ub/GitLab pull, merge request, or issue). None of the current sessions do, so there is nothing to group by PR yet.",action:a(
E,{onClick:()=>u("session"),children:"Back to Session view"})}):l==="goal"?a(me,{title:"Work by goal",subtitle:"The same\
 job across sessions, merged into one card",items:B,selectedId:x,onSelect:ue,onOpenSession:ee,onAnswerPermission:(s,p)=>{
X(s,p)},permissionBusy:M!==null,onRetry:s=>{ce(s)},retryBusy:q!==null,onPickStep:s=>{Z(s)},groupBy:l,goalVerdicts:J,onSplitGoal:Un,
onMergeGoal:jn,initiativeBlocks:He,collapsedInitiatives:Wn,onToggleInitiative:Yn,selectedGoalKey:Be,onSelectGoal:Qn,footer:a(
Jo,{candidates:qn,prominent:xe.length===0,busy:Mn,onAdd:(s,p)=>{zn(s,p)}}),emptyLabel:"No matching work"}):g(Ce,{children:[
a(me,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:Ve["needs-you"],doneBySession:Rt,selectedId:x,
onSelect:ue,onSnooze:Dn,onHandled:Fn,footer:Le.snoozedCount>0?g("button",{type:"button",className:"ow-aside-note",onClick:Gn,
children:[Le.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:ee,onAnswerPermission:(s,p)=>{
X(s,p)},permissionBusy:M!==null,onRetry:s=>{ce(s)},retryBusy:q!==null,onPickStep:s=>{Z(s)},groupBy:l,emptyLabel:"Nothing\
 needs your input right now."}),a(me,{title:"In progress",subtitle:"Being worked on right now",items:Ve.running,doneBySession:Rt,
selectedId:x,onSelect:ue,onOpenSession:ee,onAnswerPermission:(s,p)=>{X(s,p)},permissionBusy:M!==null,onRetry:s=>{ce(s)},
retryBusy:q!==null,onPickStep:s=>{Z(s)},groupBy:l,emptyLabel:"Nothing is in progress right now."}),a(me,{title:"Done rec\
ently",subtitle:"Finished in the last few days",items:Ve.done,selectedId:x,onSelect:ue,collapsed:Bn,onToggleCollapsed:Hn,
onOpenSession:ee,onAnswerPermission:(s,p)=>{X(s,p)},permissionBusy:M!==null,onRetry:s=>{ce(s)},retryBusy:q!==null,onPickStep:s=>{
Z(s)},groupBy:l,emptyLabel:"No recent completed work."})]}):a(me,{title:dt[r],items:B,selectedId:x,onSelect:ue,onOpenSession:ee,
onAnswerPermission:(s,p)=>{X(s,p)},permissionBusy:M!==null,onRetry:s=>{ce(s)},retryBusy:q!==null,onPickStep:s=>{Z(s)},groupBy:l,
emptyLabel:"No matching work"}),m.trim()&&a(Qo,{hits:Vn,now:Date.now(),onOpenSession:ee})]})}),g("aside",{className:"ow-\
conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:g("div",{className:"ow-c\
onductor-title",children:[a("h2",{children:"Conductor"}),!de&&a("span",{className:"ow-conductor-sub",children:"select wo\
rk, or ask across all"})]})}),a("div",{className:"ow-chat",children:$n?g("div",{className:"ow-chat-panel",children:[Nt.length>
0&&a("div",{className:"ow-permissions",role:"alert",children:Nt.map(s=>a(Cn,{tool:s.tool,purpose:s.purpose,where:s.sessionLabel,
busy:M!==null,onAnswer:p=>{X(s.id,p)}},s.id))}),L&&g("div",{className:"ow-conductor-receipt",role:"status",children:[a(Sn,
{className:"ow-icon"}),L]}),_t&&a("div",{className:"ow-chat-error",role:"alert",children:_t}),a("div",{className:"ow-emb\
ed",children:a(zo,{slotKey:fe,frameless:!0,startAtBottom:!0,placeholder:U?"Instruction for this goal\u2026":de?.sessionKey?
"New instructions for this session\u2026":"Ask across your work\u2026",onSend:Z})}),U&&P?g("div",{className:"ow-quote ow\
-quote-docked",children:[g("div",{className:"ow-quote-body ow-quote-goal",children:[g("div",{className:"ow-quote-line",children:[
a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"ow-quote-title",title:U.items[0].title,
children:U.items[0].title})]}),g("span",{className:"ow-quote-route ow-truncate",children:["\u2192 ",P.references.find(s=>s.
kind==="session")?.label??P.title,P.moving||P.state==="running"?" (active)":" (will resume)"]})]}),a(E,{className:"ow-qu\
ote-clear","aria-label":"Remove the quoted goal",onClick:()=>{Ke(null),N(null)},children:"Clear"})]}):de&&g("div",{className:"\
ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-body",children:[a("span",{className:"ow-eyebrow",children:de.
sessionKey?"Instructing":"Quoted"}),a("span",{className:"ow-quote-title",title:de.title,children:de.title})]}),a(E,{className:"\
ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{v(null),N(null)},children:"Clear"})]})]}):a("div",
{className:"ow-chat-loading",children:a(fn,{rows:4})})})]})]})})]})}export{lr as default};
