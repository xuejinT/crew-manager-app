import{useCallback as T,useEffect as K,useMemo as O,useRef as q,useState as y}from"react";import{AlertTriangle as qt,Bot as Un,
Check as Gn,ChevronRight as Le,Check as Dt,Clock as Hn,Package as jn,ExternalLink as Ft,MessageSquare as Te,Shield as Yn,
Waves as Vn,Search as Qn,Tag as Ut,Users as Jn,Zap as Xn}from"lucide-react";import{useAppApi as Zn,useNavigate as eo,useNavBadge as to,
ChatEmbed as no}from"@kirocrew/app-sdk";import{Badge as ie,Btn as E,ContentSkeleton as Lt,EmptyState as Ie,PageHeader as oo,
SearchInput as ro}from"@kirocrew/app-sdk/ui";function at(e){return e.trim().length>=2}function it(e,t){let n=new Set(t.map(l=>l.sessionKey).filter(Boolean)),o=new Set,
a=[];for(let l of e){let d=l?.session_key;!d||n.has(d)||o.has(d)||(o.add(d),a.push(l))}return a}function cn(e,t){if(!e)return 0;
let n=e>1e11?e/1e3:e,o=Math.floor((t/1e3-n)/86400);return o>0?o:0}function lt(e,t){let n=cn(e,t);if(n<=0)return"today";if(n===
1)return"yesterday";if(n<7)return`${n} days ago`;if(n<30){let a=Math.floor(n/7);return a===1?"last week":`${a} weeks ago`}
let o=Math.floor(n/30);return o===1?"last month":`${o} months ago`}var dt={unsupported:!1,hits:[]};function ct(e){return!e||
e.enabled===!1?{unsupported:!0,hits:[]}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:[]).filter(n=>!!n?.session_key)}}
function ut(e,t){return`/api/apps/crew-manager/recall?${new URLSearchParams({q:e.trim(),limit:String(t)}).toString()}`}function ye(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),o=t%
60;return o===0?`${n} hour${n===1?"":"s"}`:`${n}h ${o}m`}function bt(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function ve(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function yt(e,t,n){let o=new Set(t.filter(Boolean));if(o.size===0)return[];
let a=new Set,l=[];for(let d of e){let h=d.slot;!h||!o.has(h)||!d.id||a.has(d.id)||(a.add(d.id),l.push({id:d.id,sessionKey:h,
sessionLabel:n(h),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return l}var pt={"needs-you":0,running:1,done:2};function B(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}var gt=72;function te(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let a=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(a.length<=gt)return a;let l=a.slice(0,gt),d=l.lastIndexOf(" ");return`${(d>24?l.slice(0,d):l).trim()}\u2026`}
function z(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var un=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
pn=/^\((?:code|diff|widget|image)\)$/,gn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
fn=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,wn=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
mn=/[?？]["'”’)\]]*$/;function kt(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||pn.test(t)||un.test(
t)?null:t}function xe(e){if(!e.waiting_for_input)return null;let t=kt(e);return!t||gn.test(t)||fn.test(t)?null:wn.test(t)||
mn.test(t)?t:null}function ft(e){return e.pending_approval||xe(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":z(e)?"needs-you":"done"}function hn(e,t){if(e.pending_approval)return t("approval_waiting");let n=xe(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):z(e)?t("linked_change_issue"):kt(e)??t("recent_wo\
rk_ready"))}function ke(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function bn(e){return e.pending_approval?"review-approval":xe(e)?"reply":"open"}function yn(e,t){
let n=(e.source_links??[]).map(o=>({kind:o.kind==="issue"?"issue":"change",id:o.url,label:o.kind==="issue"?`issue #${o.number}`:
`${o.provider} #${o.number}`,url:o.url,sessionKey:e.key,status:bt(o)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:hn(e,t),state:ft(e),moving:ft(e)==="running"||void 0,issue:z(e),updatedAt:B(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:ke(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:z(e)||void 0,action:bn(e),
references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...n]}}function _e(e,t){e.references.
some(n=>n.kind===t.kind&&n.id===t.id)||e.references.push(t)}function vt(e){return(e.source||"").toLowerCase()==="subagen\
t"}function kn(e,t,n){let o=vt(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,B(t.ts)),e.summary=n(o?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=o?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,_e(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),
sessionKey:t.slot||e.sessionKey})}function vn(e,t,n){e.updatedAt=Math.max(e.updatedAt,B(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),_e(e,{kind:"agent",id:t.id,
label:t.agent||n("agent"),sessionKey:t.parent||e.sessionKey})}function xn(e,t,n){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow\
_failed",{name:t.name})),_e(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function _n(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function Sn(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function Rn(e){let t=null,n=-1;for(let o of e){let a=o.last_touched_turn??0;a>n&&(n=a,t=o)}return t}function Nn(e,t){let n=e.next_steps?.find(a=>a.what?.trim())?.what?.trim();if(n)return n;let o=[...e.progress??[]].reverse().
find(a=>a.trim());return o?o.trim():e.initial_intent?.trim()||t("work_in_progress")}var Cn=3;function In(e,t,n){if(!t?.enabled)
return[];let o=t.intents??[];if(o.length===0)return[];let a=(e.source_links??[]).map(c=>({kind:c.kind==="issue"?"issue":
"change",id:c.url,label:c.kind==="issue"?`issue #${c.number}`:`${c.provider} #${c.number}`,url:c.url,sessionKey:e.key,status:bt(
c)})),l=[],d=Rn(o),b=!!(e.running||e.subagents_running||e.orchestrating)?[]:o.filter(c=>c.state==="in-progress");if(b.length>
0){let c=b.reduce((p,k)=>(k.last_touched_turn??0)>=(p.last_touched_turn??0)?k:p,b[0]),v=c.next_steps?.find(p=>p.what?.trim())?.
what?.trim();l.push({id:`unattended:${e.key}`,title:e.title||n("untitled_work"),summary:v||n("no_next_step"),state:"need\
s-you",issue:z(e),updatedAt:B(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:ke(e,n),queuedBehind:e.
queue_depth||void 0,changeBlocked:z(e)||void 0,unattendedGoals:b.length,action:"resume",references:[{kind:"session",id:e.
key,label:e.title||n("untitled_work"),sessionKey:e.key},...a],nextSteps:b.flatMap(p=>(p.next_steps??[]).filter(k=>k.what?.
trim())),goals:b.map(p=>p.title?.trim()).filter(p=>!!p),doneGoals:o.filter(p=>p.state==="done"||p.state==="dropped").map(
p=>p.title?.trim()).filter(p=>!!p),progress:[],stale:!!t.stale,lastTouchedTurn:c.last_touched_turn??0})}o.forEach((c,v)=>{
if(b.includes(c)||b.length>0&&(c.state==="done"||c.state==="dropped"))return;let p=_n(c,e);if(!p)return;let k=(c.next_steps??
[]).filter(N=>N.what?.trim());l.push({id:`intent:${e.key}:${v}`,title:te(c.title,e.title||n("untitled_work")),summary:Nn(
c,n),state:p,issue:!1,updatedAt:B(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:ke(e,n),queuedBehind:e.
queue_depth||void 0,changeBlocked:z(e)||void 0,unverified:c.verified===!1||void 0,action:"open",references:[{kind:"sessi\
on",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...a],nextSteps:k,progress:(c.progress??[]).filter(N=>N.
trim()),stale:!!t.stale,lastTouchedTurn:c.last_touched_turn??0,moving:Sn(c,e,d)||void 0})});let i=l.filter(c=>c.state===
"needs-you"),f=l.filter(c=>c.state!=="needs-you").sort((c,v)=>(v.lastTouchedTurn??0)-(c.lastTouchedTurn??0));return[...i,
...f].slice(0,Math.max(Cn,i.length))}var An=new Set(["crew-manager-conductor","overwatch-conductor"]),Wn={approval_owed:100,
subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,
queued_behind:12,waiting_a_while:8},En=3;function Bn(e,t){return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):
0}var ae=5;function xt(e,t,n=Date.now()){let o=Re(e),a=It(e.filter(d=>d.state==="needs-you"),n),l=[`Fleet: ${o["needs-yo\
u"]} waiting on the user, ${o.running} in progress, ${o.done} finished recently.`];return a.length===0?(l.push("Nothing \
is waiting on the user."),l):(l.push(`Waiting on the user, in the order the list shows them (top ${Math.min(ae,a.length)}\
):`),a.slice(0,ae).forEach((d,h)=>{let b=Se(ne(d,n),t),i=d.sessionKey?` [session ${d.sessionKey}]`:"";l.push(`${h+1}. ${d.
title} \u2014 ${d.summary} (${b})${i}`)}),a.length>ae&&l.push(`\u2026and ${a.length-ae} more waiting.`),l)}var Kn=new Set(
["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that","with","from","into","be","do","so","a\
s","by","fix","add","make","update","work","session","app","new","use","run","why","what","how","again","still","not"]),
On=.6,wt=2;function mt(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(t=>t.length>
2&&!Kn.has(t)))]}function Pn(e,t){let n=mt(e),o=mt(t);if(n.length<wt||o.length<wt)return 0;let a=n.length<=o.length?n:o,
l=new Set(n.length<=o.length?o:n);return a.filter(h=>l.has(h)).length/a.length}function ht(e){return e.references.filter(
t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Ln(e){let t=e.filter(n=>n.state!=="done"&&n.sessionKey).sort(
(n,o)=>(n.updatedAt||0)-(o.updatedAt||0));for(let n=1;n<t.length;n+=1){let o=t[n];for(let a=0;a<n;a+=1){let l=t[a];if(l.
sessionKey===o.sessionKey)continue;if(ht(o).find(h=>ht(l).includes(h))){o.duplicateOf={sessionKey:l.sessionKey,title:l.title,
because:"same_change"};break}if(Pn(o.title,l.title)>=On){o.duplicateOf={sessionKey:l.sessionKey,title:l.title,because:"s\
ame_topic"};break}}}}var Tn=3e4;function _t(e,t,n=Date.now()){return Object.keys(t).length===0?e:e.map(o=>{let a=t[o.id];
return!a||n-a>Tn||o.state==="running"?o:{...o,state:"running",moving:!0,instructed:!0}})}function ne(e,t=Date.now()){let n=[],
o=(l,d,h=1)=>{n.push({signal:l,weight:Wn[l]*h,values:d})};e.approvalKind==="subagent"?o("subagent_gate"):e.approvalKind===
"tool"&&o("approval_owed"),e.action==="reply"&&o("input_requested"),e.unverified&&o("unverified_completion"),e.loopRepeats&&
o("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&o("run_failed"),e.stalledFor&&o("stalled",{duration:ye(e.stalledFor)}),
e.changeBlocked&&o("change_blocked"),e.unattendedGoals&&o("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&
o("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let a=Bn(e,t);return a>0&&o("waiting_a_whil\
e",{hours:String(a)},Math.min(a,En)),n.sort((l,d)=>d.weight-l.weight),{score:n.reduce((l,d)=>l+d.weight,0),signals:n}}var $n={
approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"un\
block",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function St(e,t=Date.now()){
if(e.state!=="needs-you")return null;for(let n of ne(e,t).signals){let o=$n[n.signal];if(o)return o}return null}var Rt=14400*
1e3;function Nt(e,t,n,o=Date.now()){let a=0,l=[];for(let d of e){if(d.state!=="needs-you"){l.push(d);continue}let h=t[d.
id];if(h&&h>o){a+=1;continue}let b=n[d.id];if(b!==void 0&&d.updatedAt<=b){l.push({...d,state:"done",issue:!1});continue}
l.push(d)}return{items:l,snoozedCount:a}}var Mn=4320*60*1e3;function Ct(e,t=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:t-e.updatedAt<=Mn}var zn={"needs-you":1,running:-1,done:-1};function qn(e,t,n){let o=e.updatedAt>0,a=t.updatedAt>0;
return!o&&!a?0:o?a?(e.updatedAt-t.updatedAt)*n:-1:1}function Se(e,t){let n=e.signals.slice(0,2);return n.length===0?t("r\
ank_nothing_pressing"):n.map(a=>t(`rank_${a.signal}`,a.values)).join(t("rank_join"))}function It(e,t=Date.now()){let n=new Map(
e.map(o=>[o.id,ne(o,t)]));return[...e].sort((o,a)=>{let l=pt[o.state]-pt[a.state];if(l!==0)return l;if(o.state==="needs-\
you"){let d=(n.get(a.id)?.score??0)-(n.get(o.id)?.score??0);if(d!==0)return d}else if(o.issue!==a.issue)return o.issue?-1:
1;return qn(o,a,zn[o.state])})}function At(e,t,n={},o={},a={}){let l=new Map,d=new Map;for(let i of e.slots){if(!i.key||
An.has(i.key)||i.memory_mode==="incognito")continue;let f=In(i,n[i.key],t);if(f.length>0){for(let p of f)l.set(p.id,p);let v=f.
find(p=>p.state==="needs-you")??f[0];d.set(i.key,v);continue}let c=yn(i,t);l.set(c.id,c),d.set(i.key,c)}for(let[i,f]of Object.
entries(o)){let c=d.get(i);c&&(c.state="needs-you",c.issue=!0,c.stalledFor=f.silent_secs,c.summary=f.reason?t("stalled_b\
ecause",{reason:f.reason,duration:ye(f.silent_secs)}):t("stalled_for",{duration:ye(f.silent_secs)}),c.action="open")}for(let[
i,f]of Object.entries(a)){let c=d.get(i);c&&(c.state="needs-you",c.issue=!0,c.loopRepeats=f.repeats,c.summary=t("error_l\
oop",{tool:f.tool,repeats:String(f.repeats)}),c.action="open")}for(let i of e.approvals){let f=i.slot?d.get(i.slot):void 0;
if(f){kn(f,i,t);continue}l.set(`approval:${i.id}`,{id:`approval:${i.id}`,title:te(i.tool||i.source,t("approval_needed")),
summary:i.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:B(i.ts),provenance:t("approval"),action:"\
review-approval",approvalKind:vt(i)?"subagent":"tool",permissionId:i.id,permissionTool:i.tool||i.source,permissionPurpose:i.
tool_purpose,references:[{kind:"approval",id:i.id,label:i.tool||i.source||t("approval")}]})}for(let i of e.agents){let f=i.
parent?d.get(i.parent):void 0;if(f){vn(f,i,t);continue}let c=!!(i.done&&(i.error||i.outcome==="failed"));i.parent&&!c||l.
set(`agent:${i.id}`,{id:`agent:${i.id}`,title:te(i.task||i.agent,t("agent_work")),summary:c?i.error?.trim()||t("agent_fa\
iled",{task:i.task}):i.done?t("agent_done"):t("work_in_progress"),state:c?"needs-you":i.done?"done":"running",issue:c,runFailed:c||
void 0,retryPath:c&&!i.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(i.id)}/retry`:void 0,updatedAt:B(i.started),
provenance:i.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:i.id,label:i.agent||t("agent")}]})}for(let i of e.
workflows){let f=i.session_key?d.get(i.session_key):void 0;if(f){xn(f,i,t);continue}let c=i.status==="failed";l.set(`wor\
kflow:${i.run_id}`,{id:`workflow:${i.run_id}`,title:te(i.name,i.run_id),summary:c?t("workflow_failed_generic"):i.status===
"running"?t("workflow_running"):t("workflow_finished"),state:c?"needs-you":i.status==="running"?"running":"done",issue:c,
runFailed:c||void 0,retryPath:c?`/api/workflows/runs/${encodeURIComponent(i.run_id)}/rerun`:void 0,updatedAt:0,provenance:t(
"workflow"),action:"discuss",references:[{kind:"workflow",id:i.run_id,label:i.name||i.run_id}]})}for(let i of e.crons){if(!i.
is_running&&i.last_status!=="error")continue;let f=i.last_status==="error";l.set(`monitor:${i.id}`,{id:`monitor:${i.id}`,
title:i.name,summary:t(f?"monitor_failed":"monitor_running"),state:f?"needs-you":"running",issue:f,runFailed:f||void 0,retryPath:f?
`/api/crons/${encodeURIComponent(i.id)}/run`:void 0,updatedAt:B(i.running_since||i.last_run_ts||i.created_ts),provenance:t(
"monitor"),action:f?"discuss":void 0,references:[{kind:"monitor",id:i.id,label:i.name}]})}let h=[...e.artifacts].sort((i,f)=>B(
f.updated_at)-B(i.updated_at)).slice(0,8);for(let i of h){let f=i.session_key&&d.has(i.session_key)?i.session_key:void 0;
l.set(`artifact:${i.slug}`,{id:`artifact:${i.slug}`,title:te(i.name,t("artifact")),summary:i.description||t("artifact_re\
ady",{kind:i.kind}),state:"done",issue:!1,updatedAt:B(i.updated_at||i.created_at),sessionKey:f,provenance:i.session_title||
i.source||t("artifact"),action:f?"open":void 0,references:[{kind:"artifact",id:i.slug,label:i.name,sessionKey:f},...f?[{
kind:"session",id:f,label:i.session_title||f,sessionKey:f}]:[]]})}let b=[...l.values()];return Ln(b),It(b)}function Re(e){
return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,
done:e.filter(t=>t.state==="done").length}}function Wt(e,t){let n=t.trim().toLowerCase();return n?e.filter(o=>[o.title,o.
summary,o.provenance,...o.references.flatMap(l=>[l.label,l.id,l.url])].join(`
`).toLowerCase().includes(n)):e}function Et(e){let t=[],n=new Map;for(let o of e){let a=o.sessionKey;if(!a)continue;let l=n.
get(a);if(l){l.count+=1;continue}let d=o.references.find(b=>b.kind==="session")?.label??o.provenance,h={sessionKey:a,label:d,
leading:o,count:1};n.set(a,h),t.push(h)}return t}function Ne(e,t){if(t==="pr")return Dn(e);let n=[],o=new Map;for(let a of e){
let l=a.sessionKey;if(!l){n.push({key:a.id,items:[a],header:null,sessionKey:null,changeRef:null});continue}let d=o.get(l);
if(d){d.items.push(a);continue}let h={key:l,items:[a],header:"session",sessionKey:a.sessionKey??null,changeRef:null};o.set(
l,h),n.push(h)}return n}function Dn(e){let t=[],n=new Map;for(let o of e){let a=o.references.filter(l=>l.kind==="change"||
l.kind==="issue");for(let l of a){let d=`${l.kind}:${l.id}`,h=n.get(d);if(h){h.items.push(o);continue}let b={key:d,items:[
o],header:"pr",sessionKey:null,changeRef:l};n.set(d,b),t.push(b)}}return t}function Ce(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Kt(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,o)=>Bt(o)-Bt(n)).slice(0,12)}function Bt(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Ot(e,t){
let n={},o="unknown";for(let a of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(a.key)}/summary`);if(!l||typeof l!=
"object"){o="unsupported";break}if(l.enabled===!1){o="disabled";break}n[a.key]=l,o="available"}catch{o="unsupported";break}
return{summaries:n,support:o}}var Pt=String.raw`
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
  .ow-chat-panel { display: flex; min-height: 0; width: 100%; flex-direction: column; padding: 12px 16px; gap: 8px; }
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
    .ow-work { border-right: 0; border-bottom: 1px solid var(--border); }
  }
`;import{Fragment as $e,jsx as s,jsxs as g}from"react/jsx-runtime";var Ae="crew-manager.snoozed",Tt="crew-manager.handled",
$t="crew-manager.done-collapsed";function We(e,t={}){try{let n=localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}
function le(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}var H="crew-manager-conductor",so=5e3,ao={session:"\
Session",approval:"Approval",agent:"Agent",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"R\
eview the pending approval request",subagent_gate_waiting:"Allow or refuse a sub-agent held at the spawn gate",information_needed:"\
Answer the request in the work thread",decision_ready:"Make the decision this work is waiting on",work_in_progress:"Work\
 is in progress",linked_change_issue:"Open the linked change \u2014 a check is failing or it conflicts",recent_work_ready:"\
Pick this back up, or let it go",approval_needed_for:"Review the pending {{tool}} request",approval_needed:"Approval nee\
ded",tool_call_waiting:"Allow or refuse a waiting tool call",agent_work:"Agent work",agent_done:"This agent run finished",
agent_failed:"This agent stopped before finishing \u2014 nothing to do here",workflow_failed:"This workflow stopped befo\
re finishing",workflow_failed_generic:"This workflow stopped before finishing",workflow_running:"Workflow is running",workflow_finished:"\
Workflow finished",monitor_failed:"The latest check stopped before finishing",monitor_running:"Monitor is checking now",
artifact_ready:"{{kind}} output is ready",stalled_for:"Check on it \u2014 no activity for {{duration}}, still marked running",
stalled_because:"{{reason}} Silent for {{duration}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same lin\
ked change",duplicate_same_topic:"Looks like the same work as \u201C{{title}}\u201D",rank_approval_owed:"only you can cl\
ear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"the agent asked you \
a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failure has repeated {{re\
peats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{duration}}",rank_change_blocked:"\
a linked change is failing or conflicting",rank_nobody_on_it:"nobody is on {{count}} unfinished goal(s) in this session",
no_next_step:"No next step recorded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in thi\
s session",rank_waiting_a_while:"waiting {{hours}}h",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",
rank_join:", and ",error_loop:"{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work"};
function ce(e,t={}){return ao[e].replace(/\{\{(\w+)\}\}/g,(n,o)=>t[o]??"")}var io={followup:"FOLLOW UP",unblock:"UNBLOCK"},
Oe={"needs-you":"Needs you",running:"Running",done:"Done"},Ee={all:"All","needs-you":"Needs you",running:"Running",done:"\
Done"},Mt={all:"All",failing:"Failing",running:"Running",merged:"Merged"},lo={session:Te,approval:qt,agent:Un,workflow:Xn,
monitor:Vn,artifact:jn,change:Ft,issue:Ut};function j({children:e,onActivate:t,...n}){return s("div",{...n,role:"button",
tabIndex:0,onClick:t,onKeyDown:o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),t())},children:e})}function Pe({label:e,
count:t,subtitle:n}){return g("div",{className:"ow-section-header",children:[g("div",{className:"ow-section-heading",children:[
s("h2",{className:"ow-section-title",children:e}),s("span",{className:"ow-section-count",children:t})]}),n&&s("p",{className:"\
ow-section-subtitle",children:n})]})}function Gt(e){if(e.state==="needs-you"){let t=St(e);return t?s(ie,{variant:"warn",
className:"ow-verb",children:io[t]}):null}return e.state==="running"?e.moving?g(ie,{variant:"aim",children:[s(Hn,{className:"\
ow-icon"}),Oe[e.state]]}):s(ie,{variant:"muted",children:"Queued"}):g(ie,{variant:"ok",children:[s(Dt,{className:"ow-ico\
n"}),Oe[e.state]]})}var de=4,co=8;function uo({hits:e,now:t,onOpenSession:n}){return e.length===0?null:g("section",{className:"\
ow-section","aria-label":"From past work",children:[s(Pe,{label:"From past work",count:e.length}),s("div",{className:"ow\
-section-list",children:e.map(o=>s(j,{className:"ow-row ow-recall-row",onActivate:()=>n(o.session_key),"data-testid":`re\
call-${o.session_key}`,children:g("div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[
g("div",{className:"ow-row-heading",children:[s("span",{className:"ow-row-title",children:o.title}),s("span",{className:"\
ow-recall-age",children:lt(o.modified,t)})]}),o.snippet&&s("p",{className:"ow-row-summary",children:o.snippet})]}),g("di\
v",{className:"ow-row-actions",children:[s(E,{className:"ow-primary-action",onClick:a=>{a.stopPropagation(),n(o.session_key)},
children:"Open"}),s(Le,{className:"ow-icon","aria-hidden":"true"})]})]})},o.session_key))})]})}function Ht({tool:e,purpose:t,
busy:n,onAnswer:o,where:a}){return g("div",{className:"ow-permission",children:[g("div",{className:"ow-permission-body",
children:[g("div",{className:"ow-permission-head",children:[s(Yn,{className:"ow-icon","aria-hidden":"true"}),s("span",{className:"\
ow-permission-title",children:"Waiting for your permission"})]}),g("p",{className:"ow-permission-what",children:[a&&g("s\
pan",{className:"ow-truncate",children:[a," "]}),a?"wants to run ":"Wants to run ",s("code",{children:e})]}),t&&s("p",{className:"\
ow-permission-why",children:t})]}),g("div",{className:"ow-permission-actions",children:[s(E,{onClick:()=>o(!0),disabled:n,
children:"Approve"}),s(E,{onClick:()=>o(!1),disabled:n,children:"Reject"})]})]})}function Be({children:e}){return s("div",
{className:"ow-expand",children:s("div",{className:"ow-expand-inner",children:e})})}var Ke=3;function zt(e){let t=e.provenance.
trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function po({item:e,onOpen:t}){let n=e.
references.find(a=>a.kind==="session"),o=e.references.filter(a=>a.kind!=="session");return g("div",{className:"ow-block-\
tab",children:[s(Te,{className:"ow-icon","aria-hidden":"true"}),s("span",{className:"ow-truncate ow-block-name",children:n?.
label??e.provenance}),g("span",{className:"ow-block-tab-meta",children:[s("span",{"aria-hidden":"true",children:"\xB7"}),
s("span",{className:"ow-truncate",children:e.provenance}),o.slice(0,2).map(a=>s("span",{className:"ow-truncate",children:a.
label},`${a.kind}:${a.id}`))]}),s(E,{className:"ow-block-open",onClick:t,"aria-label":`Open ${n?.label??e.provenance}`,children:"\
Open"})]})}function go({session:e,selected:t,onSelect:n,onOpen:o}){return g(j,{onActivate:n,className:"ow-srow","data-se\
lected":t,children:[s(Te,{className:"ow-icon","aria-hidden":"true"}),g("div",{className:"ow-srow-body",children:[s("div",
{className:"ow-srow-name ow-truncate",children:e.label}),s("div",{className:"ow-srow-state ow-truncate",children:e.leading.
summary})]}),s("span",{className:"ow-srow-badge",children:Gt(e.leading)}),s(E,{className:"ow-srow-open","aria-label":`Op\
en ${e.label}`,onClick:a=>{a.stopPropagation(),o()},children:"Open"})]})}function fo({reference:e,checks:t}){let n=e.status?
/fail|conflict|closed/.test(e.status):!1;return g("div",{className:"ow-pr-head",children:[g("div",{className:"ow-pr-head\
-top",children:[s("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&s("a",{className:"ow-block-ope\
n ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,children:s(Ft,{className:"\
ow-icon","aria-hidden":"true"})})]}),s("div",{className:"ow-pr-status-line",children:t?.available&&(t.total??0)>0?g("spa\
n",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total," checks passing",
(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&s("span",{className:"ow-pr-dot","data-bad":n?"true":void 0,
children:e.status})})]})}function wo({reference:e,onOpenSession:t}){let n=lo[e.kind],o=g($e,{children:[s(n,{className:"o\
w-icon"}),s("span",{className:"ow-truncate",children:e.label})]});return e.url?s("a",{className:"ow-reference ow-referen\
ce-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:a=>a.stopPropagation(),children:o}):e.sessionKey?s(
j,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:o}):s("span",{className:"ow-refere\
nce",children:o})}function mo({item:e,selected:t,continuation:n,whyRanked:o,onSelect:a,onOpenSession:l,onAnswerPermission:d,
permissionBusy:h,onRetry:b,retryBusy:i,onPickStep:f,onSnooze:c,onHandled:v}){return g(j,{onActivate:a,className:"ow-row",
"aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"dat\
a-testid":`work-item-${e.id}`,children:[g("div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",
children:[g("div",{className:"ow-row-heading",children:[Gt(e),s("span",{className:"ow-row-title",children:e.title})]}),e.
summary&&!(e.nextSteps??[]).some(p=>p.what?.trim()===e.summary)&&s("p",{className:"ow-row-summary",children:e.summary}),
e.duplicateOf&&g(j,{className:"ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[s(Jn,{className:"o\
w-icon","aria-hidden":"true"}),s("span",{className:"ow-truncate",children:ce(e.duplicateOf.because==="same_change"?"dupl\
icate_same_change":"duplicate_same_topic",{title:e.duplicateOf.title})})]}),e.goals&&e.goals.length>0&&g("ul",{className:"\
ow-row-goals",children:[e.goals.slice(0,de).map(p=>s("li",{className:"ow-truncate",children:p},p)),e.goals.length>de&&g(
"li",{className:"ow-row-goals-more",children:["+",e.goals.length-de," more"]}),e.doneGoals?.slice(0,de).map(p=>g("li",{className:"\
ow-row-goal-done",children:[s(Gn,{className:"ow-icon","aria-hidden":"true"}),s("span",{className:"ow-truncate",children:p})]},
`done:${p}`))]}),o&&s("div",{className:"ow-row-why",children:o}),!n&&g("div",{className:"ow-row-meta",children:[s("span",
{className:"ow-truncate",children:e.provenance}),zt(e).length>0&&s("span",{"aria-hidden":"true",children:"\xB7"}),s("spa\
n",{className:"ow-references",children:zt(e).slice(0,3).map(p=>s(wo,{reference:p,onOpenSession:l},`${p.kind}:${p.id}`))})]})]}),
s("div",{className:"ow-row-actions",children:s(Le,{className:"ow-icon","aria-hidden":"true"})})]}),t&&f&&e.nextSteps&&e.
nextSteps.length>0&&s(Be,{children:g("div",{className:"ow-row-steps",children:[s("div",{className:"ow-steps-head",children:"\
Open items"}),e.nextSteps.slice(0,Ke).map((p,k)=>s("button",{type:"button",className:"ow-quote-step",title:p.why??p.what,
onClick:N=>{N.stopPropagation(),f(p.what)},children:p.what},`${k}:${p.what}`)),e.nextSteps.length>Ke&&g("div",{className:"\
ow-steps-more",children:["+",e.nextSteps.length-Ke," more in the session"]})]})}),t&&e.retryPath&&b&&s(Be,{children:s("d\
iv",{className:"ow-retry",children:s(E,{onClick:()=>b(e.retryPath),disabled:!!i,children:"Retry"})})}),t&&e.permissionId&&
d&&s(Be,{children:s(Ht,{tool:e.permissionTool||"a tool",purpose:e.permissionPurpose,busy:!!h,onAnswer:p=>d(e.permissionId,
p)})}),e.state==="needs-you"&&c&&v&&g("div",{className:"ow-row-aside",children:[s("button",{type:"button",className:"ow-\
aside-btn",onClick:p=>{p.stopPropagation(),c(e.id)},children:"Later"}),s("button",{type:"button",className:"ow-aside-btn",
onClick:p=>{p.stopPropagation(),v(e.id,e.updatedAt)},children:"Handled"})]})]})}function oe({title:e,items:t,selectedId:n,
onSelect:o,onOpenSession:a,onAnswerPermission:l,permissionBusy:d,onRetry:h,retryBusy:b,onPickStep:i,onSnooze:f,onHandled:c,
footer:v,collapsed:p,onToggleCollapsed:k,groupBy:N,prChecks:Y,prFilter:$,subtitle:S,emptyLabel:ue}){let V=Ne(t,N),Q=N===
"pr"&&$&&$!=="all"?V.filter(x=>x.changeRef&&ve(x.changeRef,Y?.[x.changeRef.url??""])===$):V,pe=N==="pr"?Q.length:t.length;
return g("section",{className:"ow-section","aria-label":e,children:[k?g(j,{onActivate:k,className:"ow-section-toggle",children:[
s(Pe,{label:e,count:pe,subtitle:S}),s(Le,{className:"ow-icon ow-section-chevron","data-open":p?void 0:"true","aria-hidde\
n":"true"})]}):s(Pe,{label:e,count:pe,subtitle:S}),p?null:s("div",{className:"ow-section-list",children:Q.length===0?s("\
p",{className:"ow-section-empty",children:ue}):Q.map(x=>g("div",{className:"ow-block","data-grouped":x.header?"true":void 0,
children:[x.header==="session"&&x.sessionKey&&s(po,{item:x.items[0],onOpen:()=>a(x.sessionKey)}),x.header==="pr"&&x.changeRef&&
s(fo,{reference:x.changeRef,checks:Y?.[x.changeRef.url??""]}),x.header==="pr"?g($e,{children:[s("div",{className:"ow-pr-\
sublabel",children:"Sessions on this PR"}),Et(x.items).map(R=>s(go,{session:R,selected:n===R.leading.id,onSelect:()=>o(R.
leading),onOpen:()=>a(R.sessionKey)},R.sessionKey))]}):x.items.map(R=>s(mo,{item:R,selected:n===R.id,continuation:x.header===
"session",whyRanked:R.state==="needs-you"&&R.action!=="resume"?Se(ne(R),ce):void 0,onSelect:()=>o(R),onOpenSession:a,onAnswerPermission:l,
permissionBusy:d,onRetry:h,retryBusy:b,onPickStep:i,onSnooze:f,onHandled:c},R.id))]},x.key))}),v]})}function ho(e,t){let n=xt(
t,ce);if(!e)return["Crew Manager context: workspace overview.",...n,"Answer the user about the state of their work. This\
 is a conversation, not an action channel."].join(`
`);let o=e.references.map(a=>`${a.kind}: ${a.label} (${a.id})`).join(`
`);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,`State: ${Oe[e.state]}`,e.issue?"Issue det\
ected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,e.sessionKey?`Referenced session: ${e.
sessionKey}`:"Referenced session: none",`References:
${o}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(a=>!!a).join(`
`)}function bo(){let e=Zn(),t=q(e);t.current=e;let n=eo(),o=to(),[a,l]=y("all"),[d,h]=y("session"),[b,i]=y("all"),[f,c]=y(
{}),[v,p]=y(""),[k,N]=y(null),[Y,$]=y(null),[S,ue]=y(null),[V,Q]=y({}),[pe,x]=y("unknown"),R=q("unknown"),Me=q(new Map),
[ze,qe]=y({}),[De,jt]=y({}),[Fe,Yt]=y([]),[P,Ue]=y(null),[M,Ge]=y(null),[He,je]=y(()=>We(Ae)),[Ye,Vt]=y(()=>We(Tt)),[Qt,
Jt]=y(()=>We($t,null)??!0),[re,ge]=y(dt),[Ve,Qe]=y({}),Je=q(!0),[Xt,Xe]=y(!0),[Ze,fe]=y(null),[Zt,en]=y(!1),[et,J]=y(null),
C=q(!0),X=q(0),we=q(!1);K(()=>(C.current=!0,()=>{C.current=!1,X.current+=1}),[]);let I=T(async()=>{let r=++X.current,u=t.
current;try{let[w,m,_,ot,rt,st]=await Promise.all([u.get("/api/chat/slots"),u.get("/api/approvals"),u.get("/api/spawn"),
u.get("/api/workflows/runs"),u.get("/api/crons"),u.get("/api/artifacts")]);if(!C.current||r!==X.current)return;ue({slots:Array.
isArray(w)?w:[],approvals:Array.isArray(m)?m:[],agents:Array.isArray(_.agents)?_.agents:[],workflows:Array.isArray(ot.runs)?
ot.runs:[],crons:Array.isArray(rt.jobs)?rt.jobs:[],artifacts:Array.isArray(st.artifacts)?st.artifacts:[]}),fe(null)}catch(w){
C.current&&r===X.current&&fe(w instanceof Error?w:new Error("Unable to load Crew Manager sources"))}finally{C.current&&r===
X.current&&Xe(!1)}},[]);K(()=>{I();let r=window.setInterval(()=>{I()},so);return()=>window.clearInterval(r)},[I]);let tn=()=>{
Xe(!0),fe(null),I()};K(()=>{if(!S||R.current==="unsupported"||R.current==="disabled")return;let r=Kt(S.slots,H).filter(w=>Me.
current.get(w.key)!==Ce(w));if(r.length===0)return;let u=!1;return(async()=>{let{summaries:w,support:m}=await Ot(r,_=>t.
current.get(_));if(!(u||!C.current)&&(R.current=m,x(m),m==="available")){for(let _ of r)w[_.key]&&Me.current.set(_.key,Ce(
_));Q(_=>({..._,...w}))}})(),()=>{u=!0}},[S]),K(()=>{if(!S||!Je.current)return;let r=!1;return(async()=>{try{let u=await t.
current.get("/api/apps/crew-manager/stalls");if(r||!C.current)return;let w={};for(let _ of u?.stalls??[])_?.key&&(w[_.key]=
_);qe(w);let m={};for(let _ of u?.error_loops??[])_?.key&&(m[_.key]=_);Qe(m)}catch{Je.current=!1,C.current&&(qe({}),Qe({}))}})(),
()=>{r=!0}},[S]),K(()=>{if(re.unsupported)return;let r=v.trim();if(!at(r)){ge(m=>m.hits.length?{...m,hits:[]}:m);return}
let u=!1,w=setTimeout(()=>{(async()=>{try{let m=await t.current.get(ut(r,co));if(u||!C.current)return;ge(ct(m))}catch{C.
current&&ge({unsupported:!0,hits:[]})}})()},300);return()=>{u=!0,clearTimeout(w)}},[v,re.unsupported]);let tt=O(()=>_t(At(
S??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[]},ce,V,ze,Ve),De),[S,V,ze,Ve,De]),se=O(()=>Nt(tt,He,
Ye),[tt,He,Ye]),W=O(()=>se.items.filter(r=>Ct(r)),[se]),me=O(()=>Re(W),[W]),L=O(()=>W.find(r=>r.id===k)??null,[W,k]),A=O(
()=>{let r=Wt(W,v);return d==="pr"||v.trim()||a==="all"?r:r.filter(u=>u.state===a)},[a,W,v,d]),nn=O(()=>{let r={all:0,failing:0,
running:0,merged:0};for(let u of Ne(A,"pr")){if(!u.changeRef)continue;r.all++;let w=ve(u.changeRef,f[u.changeRef.url??""]);
w!=="other"&&r[w]++}return r},[A,f]);K(()=>{if(d!=="pr")return;let r=new Set;for(let w of A)for(let m of w.references)m.
kind==="change"&&m.url&&/github\.com\/.+\/pull\//.test(m.url)&&r.add(m.url);let u=!1;for(let w of r)f[w]||t.current.get(
`/pr-checks?url=${encodeURIComponent(w)}`).then(m=>{!u&&C.current&&c(_=>({..._,[w]:m}))}).catch(()=>{});return()=>{u=!0}},
[d,A,f]),K(()=>o(me["needs-you"]),[me,o]),K(()=>{k&&!W.some(r=>r.id===k)&&N(null)},[W,k]),K(()=>{let r=u=>{(u.metaKey||u.
ctrlKey)&&u.key.toLocaleLowerCase("en-US")==="k"&&(u.preventDefault(),document.querySelector('[data-crew-manager-search=\
"true"]')?.focus())};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[]);let he=S?.
slots.find(r=>r.key===H),on=!!(he||Zt);K(()=>{!S||he||we.current||(we.current=!0,e.post("/api/chat/slots",{name:H,title:"\
Conductor"}).then(()=>{C.current&&(en(!0),I())}).catch(r=>{C.current&&(we.current=!1,J(r instanceof Error?`Conductor ses\
sion could not be created: ${r.message}`:"Conductor session could not be created"))}))},[e,he,I,S]);let nt=O(()=>yt(S?.approvals??
[],Fe,r=>W.find(u=>u.sessionKey===r)?.title??S?.slots?.find(u=>u.key===r)?.title??r),[W,S,Fe]),D=L&&!L.permissionId?L:null,
F=T(async(r,u)=>{if(!P){Ue(r),J(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(r)}/${u?"approve":"r\
eject"}`,{}),I()}catch(w){J(w instanceof Error?`Could not answer that request: ${w.message}`:"Could not answer that requ\
est"),I()}finally{C.current&&Ue(null)}}},[I,P]),rn=T(r=>{je(u=>{let w=Object.fromEntries(Object.entries(u).filter(([,m])=>m>
Date.now()));return w[r]=Date.now()+Rt,le(Ae,w),w}),N(null)},[]),sn=T((r,u)=>{Vt(w=>{let m={...w,[r]:u};return le(Tt,m),
m}),N(null)},[]),an=T(()=>{je({}),le(Ae,{})},[]),ln=T(()=>{Jt(r=>(le($t,!r),!r))},[]),Z=T(async r=>{if(!M){Ge(r),J(null);
try{await t.current.post(r,{}),I()}catch(u){J(u instanceof Error?`Could not re-run it: ${u.message}`:"Could not re-run i\
t"),I()}finally{C.current&&Ge(null)}}},[I,M]),U=T(async r=>{let u=L&&!L.permissionId?L:null;if(u?.sessionKey){let w=u.sessionKey;
if(await t.current.post("/api/chat",{message:r,slot:w}).catch(m=>{if(!(m instanceof SyntaxError))throw m}),!C.current)return;
jt(m=>({...m,[u.id]:Date.now()})),Yt(m=>m.includes(w)?m:[...m,w]),$(`Sent new instructions to ${u.title}`),N(null),I();return}
await t.current.post(`/api/chat/slots/${encodeURIComponent(H)}/context`,{content:ho(L,W),source:"crew-manager",ephemeral:!0}).
catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:H}).catch(w=>{if(!(w instanceof SyntaxError))throw w})},[
L,W,I]),dn=O(()=>it(re.hits,A),[re.hits,A]),be={"needs-you":A.filter(r=>r.state==="needs-you"),running:A.filter(r=>r.state===
"running"),done:A.filter(r=>r.state==="done")},G=r=>n(`/chat?sid=${encodeURIComponent(r)}`),ee=r=>{N(u=>u===r.id?null:r.
id),$(null)};return g("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[s("style",{children:Pt}),
s(oo,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what finished recently."}),s(
"div",{className:"ow-body",children:g("div",{className:"ow-layout",children:[s("nav",{className:"ow-rail","aria-label":"\
Crew Manager",children:s("div",{className:"ow-rail-inner",children:g("div",{className:"ow-groupby",role:"group","aria-la\
bel":"Group by",children:[s("span",{className:"ow-groupby-label",children:"Group by"}),["session","pr"].map(r=>s(E,{onClick:()=>h(
r),"aria-pressed":d===r,"data-selected":d===r,className:"ow-groupby-opt",children:r==="session"?"Session":"PR"},r))]})})}),
s("main",{className:"ow-work",children:g("div",{className:"ow-work-inner",children:[g("div",{className:"ow-toolbar",children:[
s(ro,{"data-crew-manager-search":"true",value:v,onChange:r=>p(r.target.value),placeholder:"Search work and projects\u2026 \u2318K",
"aria-label":"Search work",className:"ow-search"}),d==="pr"?s("div",{className:"ow-filters",role:"group","aria-label":"F\
ilter by PR status",children:Object.keys(Mt).map(r=>g(E,{onClick:()=>i(r),"aria-pressed":b===r,"data-selected":b===r,className:"\
ow-filter",children:[Mt[r],s("span",{className:"ow-count",children:nn[r]})]},r))}):s("div",{className:"ow-filters",role:"\
group","aria-label":"Filter by state",children:Object.keys(Ee).map(r=>g(E,{onClick:()=>l(r),"aria-pressed":a===r,"data-s\
elected":a===r,className:"ow-filter",children:[Ee[r],s("span",{className:"ow-count",children:me[r]})]},r))})]}),Xt?s(Lt,
{rows:7}):Ze&&!S?s(Ie,{icon:s(qt,{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:Ze.message,
action:s(E,{onClick:tn,children:"Try again"})}):A.length===0?s(Ie,{icon:s(Qn,{className:"ow-icon"}),title:"No matching w\
ork",subtitle:"Change the filter or search for a session, project, PR, or output."}):a==="all"||v.trim()?d==="pr"?A.some(
r=>r.references.some(u=>u.kind==="change"||u.kind==="issue"))?s(oe,{title:"Work by PR",subtitle:"Every pull request your\
 work touches",items:A,prChecks:f,prFilter:b,selectedId:k,onSelect:ee,onOpenSession:G,onAnswerPermission:(r,u)=>{F(r,u)},
permissionBusy:P!==null,onRetry:r=>{Z(r)},retryBusy:M!==null,onPickStep:r=>{U(r)},groupBy:d,emptyLabel:"No matching work"}):
s(Ie,{icon:s(Ut,{className:"ow-icon"}),title:"No work is linked to a PR right now",subtitle:"Work links to a PR when a s\
ession mentions its URL (a GitHub/GitLab pull, merge request, or issue). None of the current sessions do, so there is no\
thing to group by PR yet.",action:s(E,{onClick:()=>h("session"),children:"Back to Session view"})}):g($e,{children:[s(oe,
{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:be["needs-you"],selectedId:k,onSelect:ee,onSnooze:rn,
onHandled:sn,footer:se.snoozedCount>0?g("button",{type:"button",className:"ow-aside-note",onClick:an,children:[se.snoozedCount,
" set aside for later \u2014 bring back"]}):void 0,onOpenSession:G,onAnswerPermission:(r,u)=>{F(r,u)},permissionBusy:P!==
null,onRetry:r=>{Z(r)},retryBusy:M!==null,onPickStep:r=>{U(r)},groupBy:d,emptyLabel:"Nothing needs your input right now."}),
s(oe,{title:"In progress",subtitle:"Being worked on right now",items:be.running,selectedId:k,onSelect:ee,onOpenSession:G,
onAnswerPermission:(r,u)=>{F(r,u)},permissionBusy:P!==null,onRetry:r=>{Z(r)},retryBusy:M!==null,onPickStep:r=>{U(r)},groupBy:d,
emptyLabel:"Nothing is in progress right now."}),s(oe,{title:"Done recently",subtitle:"Finished in the last few days",items:be.
done,selectedId:k,onSelect:ee,collapsed:Qt,onToggleCollapsed:ln,onOpenSession:G,onAnswerPermission:(r,u)=>{F(r,u)},permissionBusy:P!==
null,onRetry:r=>{Z(r)},retryBusy:M!==null,onPickStep:r=>{U(r)},groupBy:d,emptyLabel:"No recent completed work."})]}):s(oe,
{title:Ee[a],items:A,selectedId:k,onSelect:ee,onOpenSession:G,onAnswerPermission:(r,u)=>{F(r,u)},permissionBusy:P!==null,
onRetry:r=>{Z(r)},retryBusy:M!==null,onPickStep:r=>{U(r)},groupBy:d,emptyLabel:"No matching work"}),v.trim()&&s(uo,{hits:dn,
now:Date.now(),onOpenSession:G})]})}),g("aside",{className:"ow-conductor","aria-label":"Conductor",children:[s("div",{className:"\
ow-conductor-header",children:g("div",{className:"ow-conductor-title",children:[s("h2",{children:"Conductor"}),!D&&s("sp\
an",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),s("div",{className:"ow-chat",children:on?
g("div",{className:"ow-chat-panel",children:[D&&g("div",{className:"ow-quote",children:[g("div",{className:"ow-quote-bod\
y",children:[s("span",{className:"ow-eyebrow",children:D.sessionKey?"Instructing":"Quoted"}),s("span",{className:"ow-quo\
te-title",title:D.title,children:D.title})]}),s(E,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",
onClick:()=>{N(null),$(null)},children:"Clear"})]}),nt.length>0&&s("div",{className:"ow-permissions",role:"alert",children:nt.
map(r=>s(Ht,{tool:r.tool,purpose:r.purpose,where:r.sessionLabel,busy:P!==null,onAnswer:u=>{F(r.id,u)}},r.id))}),Y&&g("di\
v",{className:"ow-conductor-receipt",role:"status",children:[s(Dt,{className:"ow-icon"}),Y]}),et&&s("div",{className:"ow\
-chat-error",role:"alert",children:et}),s("div",{className:"ow-embed",children:s(no,{slotKey:H,frameless:!0,startAtBottom:!0,
placeholder:D?.sessionKey?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:U})})]}):s("div",
{className:"ow-chat-loading",children:s(Lt,{rows:4})})})]})]})})]})}export{bo as default};
