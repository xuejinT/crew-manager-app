import{useCallback as P,useEffect as K,useMemo as T,useRef as z,useState as k}from"react";import{AlertTriangle as Mn,Bot as $t,
Check as Mt,ChevronRight as We,Check as zn,Clock as zt,Package as Dt,ExternalLink as qt,MessageSquare as Ee,Shield as Ft,
Waves as Ut,Search as Ht,Tag as Dn,Users as jt,Zap as Gt}from"lucide-react";import{useAppApi as Yt,useNavigate as Vt,useNavBadge as Qt,
ChatEmbed as Jt}from"@kirocrew/app-sdk";import{Badge as oe,Btn as B,ContentSkeleton as Ln,EmptyState as xe,PageHeader as Xt,
SearchInput as Zt}from"@kirocrew/app-sdk/ui";function on(e){return e.trim().length>=2}function rn(e,n){let o=new Set(n.map(l=>l.sessionKey).filter(Boolean)),t=new Set,
r=[];for(let l of e){let d=l?.session_key;!d||o.has(d)||t.has(d)||(t.add(d),r.push(l))}return r}function rt(e,n){if(!e)return 0;
let o=e>1e11?e/1e3:e,t=Math.floor((n/1e3-o)/86400);return t>0?t:0}function sn(e,n){let o=rt(e,n);if(o<=0)return"today";if(o===
1)return"yesterday";if(o<7)return`${o} days ago`;if(o<30){let r=Math.floor(o/7);return r===1?"last week":`${r} weeks ago`}
let t=Math.floor(o/30);return t===1?"last month":`${t} months ago`}var an={unsupported:!1,hits:[]};function ln(e){return!e||
e.enabled===!1?{unsupported:!0,hits:[]}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:[]).filter(o=>!!o?.session_key)}}
function dn(e,n){return`/api/apps/crew-manager/recall?${new URLSearchParams({q:e.trim(),limit:String(n)}).toString()}`}function we(e){let n=Math.max(1,Math.floor(e/60));if(n<60)return`${n} minute${n===1?"":"s"}`;let o=Math.floor(n/60),t=n%
60;return t===0?`${o} hour${o===1?"":"s"}`:`${o}h ${t}m`}function mn(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function hn(e,n,o){let t=new Set(n.filter(Boolean));if(t.size===0)return[];let r=new Set,
l=[];for(let d of e){let h=d.slot;!h||!t.has(h)||!d.id||r.has(d.id)||(r.add(d.id),l.push({id:d.id,sessionKey:h,sessionLabel:o(
h),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return l}var cn={"needs-you":0,running:1,done:2};function E(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let n=Date.parse(e);return Number.isFinite(n)?n:0}var un=72;function X(e,n){
let o=e?.replace(/\s+/g," ").trim();if(!o)return n;let r=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(r.length<=un)return r;let l=r.slice(0,un),d=l.lastIndexOf(" ");return`${(d>24?l.slice(0,d):l).trim()}\u2026`}
function M(e){return!!e.source_links?.some(n=>n.kind!=="issue"&&(n.ci==="failed"||n.mergeable==="conflicting"))}var st=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
at=/^\((?:code|diff|widget|image)\)$/,it=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
lt=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,dt=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
ct=/[?？]["'”’)\]]*$/;function yn(e){let n=e.last_message?.replace(/\s+/g," ").trim();return!n||at.test(n)||st.test(
n)?null:n}function he(e){if(!e.waiting_for_input)return null;let n=yn(e);return!n||it.test(n)||lt.test(n)?null:dt.test(n)||
ct.test(n)?n:null}function pn(e){return e.pending_approval||he(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":M(e)?"needs-you":"done"}function ut(e,n){if(e.pending_approval)return n("approval_waiting");let o=he(e);return o||
(e.running||e.subagents_running||e.orchestrating?n("work_in_progress"):M(e)?n("linked_change_issue"):yn(e)??n("recent_wo\
rk_ready"))}function me(e,n){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||n("session")}function pt(e){return e.pending_approval?"review-approval":he(e)?"reply":"open"}function gt(e,n){
let o=(e.source_links??[]).map(t=>({kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.kind==="issue"?`issue #${t.number}`:
`${t.provider} #${t.number}`,url:t.url,sessionKey:e.key,status:mn(t)}));return{id:`session:${e.key}`,title:e.title||n("u\
ntitled_work"),summary:ut(e,n),state:pn(e),moving:pn(e)==="running"||void 0,issue:M(e),updatedAt:E(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:me(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:M(e)||void 0,action:pt(e),
references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...o]}}function ye(e,n){e.references.
some(o=>o.kind===n.kind&&o.id===n.id)||e.references.push(n)}function bn(e){return(e.source||"").toLowerCase()==="subagen\
t"}function ft(e,n,o){let t=bn(n);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,E(n.ts)),e.summary=o(t?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=t?"subagent":"tool",e.action="review-approval",e.permissionId=n.id,e.permissionTool=
n.tool||n.source,e.permissionPurpose=n.tool_purpose,ye(e,{kind:"approval",id:n.id,label:n.tool||n.source||o("approval"),
sessionKey:n.slot||e.sessionKey})}function wt(e,n,o){e.updatedAt=Math.max(e.updatedAt,E(n.started)),e.issue||=!!(n.done&&
(n.error||n.outcome==="failed")),n.done?(n.error||n.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_fail\
ed",{task:n.task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),ye(e,{kind:"agent",id:n.id,
label:n.agent||o("agent"),sessionKey:n.parent||e.sessionKey})}function mt(e,n,o){e.issue||=n.status==="failed",n.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),n.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow\
_failed",{name:n.name})),ye(e,{kind:"workflow",id:n.run_id,label:n.name||n.run_id,sessionKey:n.session_key||e.sessionKey})}
function ht(e,n){if(n.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function yt(e,n,o){return!(n.running||n.subagents_running||
n.orchestrating)?!1:e===o}function bt(e){let n=null,o=-1;for(let t of e){let r=t.last_touched_turn??0;r>o&&(o=r,n=t)}return n}function kt(e,n){let o=e.next_steps?.find(r=>r.what?.trim())?.what?.trim();if(o)return o;let t=[...e.progress??[]].reverse().
find(r=>r.trim());return t?t.trim():e.initial_intent?.trim()||n("work_in_progress")}var vt=3;function xt(e,n,o){if(!n?.enabled)
return[];let t=n.intents??[];if(t.length===0)return[];let r=(e.source_links??[]).map(c=>({kind:c.kind==="issue"?"issue":
"change",id:c.url,label:c.kind==="issue"?`issue #${c.number}`:`${c.provider} #${c.number}`,url:c.url,sessionKey:e.key,status:mn(
c)})),l=[],d=bt(t),y=!!(e.running||e.subagents_running||e.orchestrating)?[]:t.filter(c=>c.state==="in-progress");if(y.length>
0){let c=y.reduce((p,N)=>(N.last_touched_turn??0)>=(p.last_touched_turn??0)?N:p,y[0]),b=c.next_steps?.find(p=>p.what?.trim())?.
what?.trim();l.push({id:`unattended:${e.key}`,title:e.title||o("untitled_work"),summary:b||o("no_next_step"),state:"need\
s-you",issue:M(e),updatedAt:E(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:me(e,o),queuedBehind:e.
queue_depth||void 0,changeBlocked:M(e)||void 0,unattendedGoals:y.length,action:"resume",references:[{kind:"session",id:e.
key,label:e.title||o("untitled_work"),sessionKey:e.key},...r],nextSteps:y.flatMap(p=>(p.next_steps??[]).filter(N=>N.what?.
trim())),goals:y.map(p=>p.title?.trim()).filter(p=>!!p),doneGoals:t.filter(p=>p.state==="done"||p.state==="dropped").map(
p=>p.title?.trim()).filter(p=>!!p),progress:[],stale:!!n.stale,lastTouchedTurn:c.last_touched_turn??0})}t.forEach((c,b)=>{
if(y.includes(c)||y.length>0&&(c.state==="done"||c.state==="dropped"))return;let p=ht(c,e);if(!p)return;let N=(c.next_steps??
[]).filter(A=>A.what?.trim());l.push({id:`intent:${e.key}:${b}`,title:X(c.title,e.title||o("untitled_work")),summary:kt(
c,o),state:p,issue:!1,updatedAt:E(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:me(e,o),queuedBehind:e.
queue_depth||void 0,changeBlocked:M(e)||void 0,unverified:c.verified===!1||void 0,action:"open",references:[{kind:"sessi\
on",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.key},...r],nextSteps:N,progress:(c.progress??[]).filter(A=>A.
trim()),stale:!!n.stale,lastTouchedTurn:c.last_touched_turn??0,moving:yt(c,e,d)||void 0})});let i=l.filter(c=>c.state===
"needs-you"),g=l.filter(c=>c.state!=="needs-you").sort((c,b)=>(b.lastTouchedTurn??0)-(c.lastTouchedTurn??0));return[...i,
...g].slice(0,Math.max(vt,i.length))}var _t=new Set(["crew-manager-conductor","overwatch-conductor"]),St={approval_owed:100,
subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,
queued_behind:12,waiting_a_while:8},Rt=3;function Nt(e,n){return e.updatedAt?Math.max(0,Math.floor((n-e.updatedAt)/36e5)):
0}var te=5;function kn(e,n,o=Date.now()){let t=ke(e),r=Nn(e.filter(d=>d.state==="needs-you"),o),l=[`Fleet: ${t["needs-yo\
u"]} waiting on the user, ${t.running} in progress, ${t.done} finished recently.`];return r.length===0?(l.push("Nothing \
is waiting on the user."),l):(l.push(`Waiting on the user, in the order the list shows them (top ${Math.min(te,r.length)}\
):`),r.slice(0,te).forEach((d,h)=>{let y=be(Z(d,o),n),i=d.sessionKey?` [session ${d.sessionKey}]`:"";l.push(`${h+1}. ${d.
title} \u2014 ${d.summary} (${y})${i}`)}),r.length>te&&l.push(`\u2026and ${r.length-te} more waiting.`),l)}var Ct=new Set(
["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that","with","from","into","be","do","so","a\
s","by","fix","add","make","update","work","session","app","new","use","run","why","what","how","again","still","not"]),
It=.6,gn=2;function fn(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(n=>n.length>
2&&!Ct.has(n)))]}function At(e,n){let o=fn(e),t=fn(n);if(o.length<gn||t.length<gn)return 0;let r=o.length<=t.length?o:t,
l=new Set(o.length<=t.length?t:o);return r.filter(h=>l.has(h)).length/r.length}function wn(e){return e.references.filter(
n=>n.kind==="change"||n.kind==="issue").map(n=>n.id)}function Wt(e){let n=e.filter(o=>o.state!=="done"&&o.sessionKey).sort(
(o,t)=>(o.updatedAt||0)-(t.updatedAt||0));for(let o=1;o<n.length;o+=1){let t=n[o];for(let r=0;r<o;r+=1){let l=n[r];if(l.
sessionKey===t.sessionKey)continue;if(wn(t).find(h=>wn(l).includes(h))){t.duplicateOf={sessionKey:l.sessionKey,title:l.title,
because:"same_change"};break}if(At(t.title,l.title)>=It){t.duplicateOf={sessionKey:l.sessionKey,title:l.title,because:"s\
ame_topic"};break}}}}var Et=3e4;function vn(e,n,o=Date.now()){return Object.keys(n).length===0?e:e.map(t=>{let r=n[t.id];
return!r||o-r>Et||t.state==="running"?t:{...t,state:"running",moving:!0,instructed:!0}})}function Z(e,n=Date.now()){let o=[],
t=(l,d,h=1)=>{o.push({signal:l,weight:St[l]*h,values:d})};e.approvalKind==="subagent"?t("subagent_gate"):e.approvalKind===
"tool"&&t("approval_owed"),e.action==="reply"&&t("input_requested"),e.unverified&&t("unverified_completion"),e.loopRepeats&&
t("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&t("run_failed"),e.stalledFor&&t("stalled",{duration:we(e.stalledFor)}),
e.changeBlocked&&t("change_blocked"),e.unattendedGoals&&t("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&
t("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let r=Nt(e,n);return r>0&&t("waiting_a_whil\
e",{hours:String(r)},Math.min(r,Rt)),o.sort((l,d)=>d.weight-l.weight),{score:o.reduce((l,d)=>l+d.weight,0),signals:o}}var Bt={
approval_owed:"decide",subagent_gate:"decide",input_requested:"answer",unverified_completion:"verify",error_loop:"unbloc\
k",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"resume"};function xn(e,n=Date.now()){if(e.
state!=="needs-you")return null;for(let o of Z(e,n).signals){let t=Bt[o.signal];if(t)return t}return null}var _n=14400*1e3;
function Sn(e,n,o,t=Date.now()){let r=0,l=[];for(let d of e){if(d.state!=="needs-you"){l.push(d);continue}let h=n[d.id];
if(h&&h>t){r+=1;continue}let y=o[d.id];if(y!==void 0&&d.updatedAt<=y){l.push({...d,state:"done",issue:!1});continue}l.push(
d)}return{items:l,snoozedCount:r}}var Kt=4320*60*1e3;function Rn(e,n=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:n-e.updatedAt<=Kt}var Ot={"needs-you":1,running:-1,done:-1};function Lt(e,n,o){let t=e.updatedAt>0,r=n.updatedAt>0;
return!t&&!r?0:t?r?(e.updatedAt-n.updatedAt)*o:-1:1}function be(e,n){let o=e.signals.slice(0,2);return o.length===0?n("r\
ank_nothing_pressing"):o.map(r=>n(`rank_${r.signal}`,r.values)).join(n("rank_join"))}function Nn(e,n=Date.now()){let o=new Map(
e.map(t=>[t.id,Z(t,n)]));return[...e].sort((t,r)=>{let l=cn[t.state]-cn[r.state];if(l!==0)return l;if(t.state==="needs-y\
ou"){let d=(o.get(r.id)?.score??0)-(o.get(t.id)?.score??0);if(d!==0)return d}else if(t.issue!==r.issue)return t.issue?-1:
1;return Lt(t,r,Ot[t.state])})}function Cn(e,n,o={},t={},r={}){let l=new Map,d=new Map;for(let i of e.slots){if(!i.key||
_t.has(i.key)||i.memory_mode==="incognito")continue;let g=xt(i,o[i.key],n);if(g.length>0){for(let p of g)l.set(p.id,p);let b=g.
find(p=>p.state==="needs-you")??g[0];d.set(i.key,b);continue}let c=gt(i,n);l.set(c.id,c),d.set(i.key,c)}for(let[i,g]of Object.
entries(t)){let c=d.get(i);c&&(c.state="needs-you",c.issue=!0,c.stalledFor=g.silent_secs,c.summary=g.reason?n("stalled_b\
ecause",{reason:g.reason,duration:we(g.silent_secs)}):n("stalled_for",{duration:we(g.silent_secs)}),c.action="open")}for(let[
i,g]of Object.entries(r)){let c=d.get(i);c&&(c.state="needs-you",c.issue=!0,c.loopRepeats=g.repeats,c.summary=n("error_l\
oop",{tool:g.tool,repeats:String(g.repeats)}),c.action="open")}for(let i of e.approvals){let g=i.slot?d.get(i.slot):void 0;
if(g){ft(g,i,n);continue}l.set(`approval:${i.id}`,{id:`approval:${i.id}`,title:X(i.tool||i.source,n("approval_needed")),
summary:i.tool_purpose||n("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:E(i.ts),provenance:n("approval"),action:"\
review-approval",approvalKind:bn(i)?"subagent":"tool",permissionId:i.id,permissionTool:i.tool||i.source,permissionPurpose:i.
tool_purpose,references:[{kind:"approval",id:i.id,label:i.tool||i.source||n("approval")}]})}for(let i of e.agents){let g=i.
parent?d.get(i.parent):void 0;if(g){wt(g,i,n);continue}let c=!!(i.done&&(i.error||i.outcome==="failed"));i.parent&&!c||l.
set(`agent:${i.id}`,{id:`agent:${i.id}`,title:X(i.task||i.agent,n("agent_work")),summary:c?i.error?.trim()||n("agent_fai\
led",{task:i.task}):i.done?n("agent_done"):n("work_in_progress"),state:c?"needs-you":i.done?"done":"running",issue:c,runFailed:c||
void 0,retryPath:c&&!i.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(i.id)}/retry`:void 0,updatedAt:E(i.started),
provenance:i.agent||n("agent"),action:"discuss",references:[{kind:"agent",id:i.id,label:i.agent||n("agent")}]})}for(let i of e.
workflows){let g=i.session_key?d.get(i.session_key):void 0;if(g){mt(g,i,n);continue}let c=i.status==="failed";l.set(`wor\
kflow:${i.run_id}`,{id:`workflow:${i.run_id}`,title:X(i.name,i.run_id),summary:c?n("workflow_failed_generic"):i.status===
"running"?n("workflow_running"):n("workflow_finished"),state:c?"needs-you":i.status==="running"?"running":"done",issue:c,
runFailed:c||void 0,retryPath:c?`/api/workflows/runs/${encodeURIComponent(i.run_id)}/rerun`:void 0,updatedAt:0,provenance:n(
"workflow"),action:"discuss",references:[{kind:"workflow",id:i.run_id,label:i.name||i.run_id}]})}for(let i of e.crons){if(!i.
is_running&&i.last_status!=="error")continue;let g=i.last_status==="error";l.set(`monitor:${i.id}`,{id:`monitor:${i.id}`,
title:i.name,summary:n(g?"monitor_failed":"monitor_running"),state:g?"needs-you":"running",issue:g,runFailed:g||void 0,retryPath:g?
`/api/crons/${encodeURIComponent(i.id)}/run`:void 0,updatedAt:E(i.running_since||i.last_run_ts||i.created_ts),provenance:n(
"monitor"),action:g?"discuss":void 0,references:[{kind:"monitor",id:i.id,label:i.name}]})}let h=[...e.artifacts].sort((i,g)=>E(
g.updated_at)-E(i.updated_at)).slice(0,8);for(let i of h){let g=i.session_key&&d.has(i.session_key)?i.session_key:void 0;
l.set(`artifact:${i.slug}`,{id:`artifact:${i.slug}`,title:X(i.name,n("artifact")),summary:i.description||n("artifact_rea\
dy",{kind:i.kind}),state:"done",issue:!1,updatedAt:E(i.updated_at||i.created_at),sessionKey:g,provenance:i.session_title||
i.source||n("artifact"),action:g?"open":void 0,references:[{kind:"artifact",id:i.slug,label:i.name,sessionKey:g},...g?[{
kind:"session",id:g,label:i.session_title||g,sessionKey:g}]:[]]})}let y=[...l.values()];return Wt(y),Nn(y)}function ke(e){
return{all:e.length,"needs-you":e.filter(n=>n.state==="needs-you").length,running:e.filter(n=>n.state==="running").length,
done:e.filter(n=>n.state==="done").length}}function In(e,n){let o=n.trim().toLowerCase();return o?e.filter(t=>[t.title,t.
summary,t.provenance,...t.references.flatMap(l=>[l.label,l.id,l.url])].join(`
`).toLowerCase().includes(o)):e}function An(e){let n=[],o=new Map;for(let t of e){let r=t.sessionKey;if(!r)continue;let l=o.
get(r);if(l){l.count+=1;continue}let d=t.references.find(y=>y.kind==="session")?.label??t.provenance,h={sessionKey:r,label:d,
leading:t,count:1};o.set(r,h),n.push(h)}return n}function Wn(e,n){if(n==="pr")return Pt(e);let o=[],t=new Map;for(let r of e){
let l=r.sessionKey;if(!l){o.push({key:r.id,items:[r],header:null,sessionKey:null,changeRef:null});continue}let d=t.get(l);
if(d){d.items.push(r);continue}let h={key:l,items:[r],header:"session",sessionKey:r.sessionKey??null,changeRef:null};t.set(
l,h),o.push(h)}return o}function Pt(e){let n=[],o=new Map,t=[];for(let r of e){let l=r.references.filter(d=>d.kind==="ch\
ange"||d.kind==="issue");if(l.length===0){t.push(r);continue}for(let d of l){let h=`${d.kind}:${d.id}`,y=o.get(h);if(y){
y.items.push(r);continue}let i={key:h,items:[r],header:"pr",sessionKey:null,changeRef:d};o.set(h,i),n.push(i)}}return[...n,
...t.map(r=>({key:r.id,items:[r],header:null,sessionKey:null,changeRef:null}))]}function ve(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Bn(e,n){return e.filter(o=>o.key&&
o.key!==n&&o.memory_mode!=="incognito").sort((o,t)=>En(t)-En(o)).slice(0,12)}function En(e){let n=e.last_ts??e.last_activity_ts??
e.created;if(typeof n=="number")return n>1e10?n:n*1e3;if(!n)return 0;let o=Date.parse(n);return Number.isFinite(o)?o:0}async function Kn(e,n){
let o={},t="unknown";for(let r of e)try{let l=await n(`/api/chat/slots/${encodeURIComponent(r.key)}/summary`);if(!l||typeof l!=
"object"){t="unsupported";break}if(l.enabled===!1){t="disabled";break}o[r.key]=l,t="available"}catch{t="unsupported";break}
return{summaries:o,support:t}}var On=String.raw`
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
  .ow-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .ow-filter { justify-content: center; gap: 6px; }
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
  .ow-conductor { display: flex; min-height: 0; flex-direction: column; background: var(--bg); border-left: 1px solid var(--border); }
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
  .ow-groupby { display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-bottom: 12px; }
  .ow-groupby-label { margin-right: 2px; color: var(--muted); font-size: 12px; }
  .ow-groupby-opt { flex: 1; padding: 4px 10px; font-size: 12px; justify-content: center; }
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
`;import{Fragment as Be,jsx as a,jsxs as f}from"react/jsx-runtime";var _e="crew-manager.snoozed",Pn="crew-manager.handled",
Tn="crew-manager.done-collapsed";function Se(e,n={}){try{let o=localStorage.getItem(e);return o?JSON.parse(o):n}catch{return n}}
function re(e,n){try{localStorage.setItem(e,JSON.stringify(n))}catch{}}var H="crew-manager-conductor",eo=5e3,no={session:"\
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
function ae(e,n={}){return no[e].replace(/\{\{(\w+)\}\}/g,(o,t)=>n[t]??"")}var to={decide:"DECIDE",answer:"ANSWER",verify:"\
VERIFY",resume:"RESUME",unblock:"UNBLOCK"},Ie={"needs-you":"Needs you",running:"Running",done:"Done"},Re={all:"All","nee\
ds-you":"Needs you",running:"Running",done:"Done"},qn={session:Ee,approval:Mn,agent:$t,workflow:Gt,monitor:Ut,artifact:Dt,
change:qt,issue:Dn};function j({children:e,onActivate:n,...o}){return a("div",{...o,role:"button",tabIndex:0,onClick:n,onKeyDown:t=>{
(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),n())},children:e})}function Ae({label:e,count:n}){return f("div",{className:"\
ow-section-header",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow-section-count",children:n})]})}
function Fn(e){if(e.state==="needs-you"){let n=xn(e);return n?a(oe,{variant:"warn",className:"ow-verb",children:to[n]}):
null}return e.state==="running"?e.moving?f(oe,{variant:"aim",children:[a(zt,{className:"ow-icon"}),Ie[e.state]]}):a(oe,{
variant:"muted",children:"Queued"}):f(oe,{variant:"ok",children:[a(zn,{className:"ow-icon"}),Ie[e.state]]})}var se=4,oo=8;
function ro({hits:e,now:n,onOpenSession:o}){return e.length===0?null:f("section",{className:"ow-section","aria-label":"F\
rom past work",children:[a(Ae,{label:"From past work",count:e.length}),a("div",{className:"ow-section-list",children:e.map(
t=>a(j,{className:"ow-row ow-recall-row",onActivate:()=>o(t.session_key),"data-testid":`recall-${t.session_key}`,children:f(
"div",{className:"ow-row-layout",children:[f("div",{className:"ow-row-content",children:[f("div",{className:"ow-row-head\
ing",children:[a("span",{className:"ow-row-title",children:t.title}),a("span",{className:"ow-recall-age",children:sn(t.modified,
n)})]}),t.snippet&&a("p",{className:"ow-row-summary",children:t.snippet})]}),f("div",{className:"ow-row-actions",children:[
a(B,{className:"ow-primary-action",onClick:r=>{r.stopPropagation(),o(t.session_key)},children:"Open"}),a(We,{className:"\
ow-icon","aria-hidden":"true"})]})]})},t.session_key))})]})}function Un({tool:e,purpose:n,busy:o,onAnswer:t,where:r}){return f(
"div",{className:"ow-permission",children:[f("div",{className:"ow-permission-body",children:[f("div",{className:"ow-perm\
ission-head",children:[a(Ft,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",children:"\
Waiting for your permission"})]}),f("p",{className:"ow-permission-what",children:[r&&f("span",{className:"ow-truncate",children:[
r," "]}),r?"wants to run ":"Wants to run ",a("code",{children:e})]}),n&&a("p",{className:"ow-permission-why",children:n})]}),
f("div",{className:"ow-permission-actions",children:[a(B,{onClick:()=>t(!0),disabled:o,children:"Approve"}),a(B,{onClick:()=>t(
!1),disabled:o,children:"Reject"})]})]})}function Ne({children:e}){return a("div",{className:"ow-expand",children:a("div",
{className:"ow-expand-inner",children:e})})}var Ce=3;function $n(e){let n=e.provenance.trim().toLowerCase();return e.references.filter(o=>o.label.trim().toLowerCase()!==n)}function so({
item:e,onOpen:n}){let o=e.references.find(r=>r.kind==="session"),t=e.references.filter(r=>r.kind!=="session");return f("\
div",{className:"ow-block-tab",children:[a(Ee,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-trunca\
te ow-block-name",children:o?.label??e.provenance}),f("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hi\
dden":"true",children:"\xB7"}),a("span",{className:"ow-truncate",children:e.provenance}),t.slice(0,2).map(r=>a("span",{className:"\
ow-truncate",children:r.label},`${r.kind}:${r.id}`))]}),a(B,{className:"ow-block-open",onClick:n,"aria-label":`Open ${o?.
label??e.provenance}`,children:"Open"})]})}function ao({session:e,selected:n,onSelect:o,onOpen:t}){return f(j,{onActivate:o,
className:"ow-srow","data-selected":n,children:[a(Ee,{className:"ow-icon","aria-hidden":"true"}),f("div",{className:"ow-\
srow-body",children:[a("div",{className:"ow-srow-name ow-truncate",children:e.label}),a("div",{className:"ow-srow-state \
ow-truncate",children:e.leading.summary})]}),a("span",{className:"ow-srow-badge",children:Fn(e.leading)}),a(B,{className:"\
ow-srow-open","aria-label":`Open ${e.label}`,onClick:r=>{r.stopPropagation(),t()},children:"Open"})]})}function io({reference:e,
checks:n}){let o=qn[e.kind],t=e.status?/fail|conflict|closed/.test(e.status):!1;return f("div",{className:"ow-pr-head",children:[
f("div",{className:"ow-pr-head-top",children:[a(o,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-tr\
uncate ow-block-name",children:e.label}),e.url&&a("a",{className:"ow-block-open",href:e.url,target:"_blank",rel:"noopene\
r noreferrer",children:"Open"})]}),a("div",{className:"ow-pr-status-line",children:n?.available&&(n.total??0)>0?f("span",
{className:"ow-pr-dot","data-bad":(n.failing??0)>0?"true":void 0,children:[n.passing??0,"/",n.total," checks passing",(n.
failing??0)>0?` \xB7 ${n.failing} failing`:""]}):e.status&&a("span",{className:"ow-pr-dot","data-bad":t?"true":void 0,children:e.
status})})]})}function lo({reference:e,onOpenSession:n}){let o=qn[e.kind],t=f(Be,{children:[a(o,{className:"ow-icon"}),a(
"span",{className:"ow-truncate",children:e.label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.
url,target:"_blank",rel:"noopener noreferrer",onClick:r=>r.stopPropagation(),children:t}):e.sessionKey?a(j,{className:"o\
w-reference ow-reference-link",onActivate:()=>n(e.sessionKey),children:t}):a("span",{className:"ow-reference",children:t})}
function co({item:e,selected:n,continuation:o,whyRanked:t,onSelect:r,onOpenSession:l,onAnswerPermission:d,permissionBusy:h,
onRetry:y,retryBusy:i,onPickStep:g,onSnooze:c,onHandled:b}){return f(j,{onActivate:r,className:"ow-row","aria-pressed":n,
"data-selected":n,"data-instructed":e.instructed?"true":void 0,"data-continuation":o?"true":void 0,"data-testid":`work-i\
tem-${e.id}`,children:[f("div",{className:"ow-row-layout",children:[f("div",{className:"ow-row-content",children:[f("div",
{className:"ow-row-heading",children:[Fn(e),a("span",{className:"ow-row-title",children:e.title})]}),e.summary&&!(e.nextSteps??
[]).some(p=>p.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&f(j,{className:"\
ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[a(jt,{className:"ow-icon","aria-hidden":"true"}),
a("span",{className:"ow-truncate",children:ae(e.duplicateOf.because==="same_change"?"duplicate_same_change":"duplicate_s\
ame_topic",{title:e.duplicateOf.title})})]}),e.goals&&e.goals.length>0&&f("ul",{className:"ow-row-goals",children:[e.goals.
slice(0,se).map(p=>a("li",{className:"ow-truncate",children:p},p)),e.goals.length>se&&f("li",{className:"ow-row-goals-mo\
re",children:["+",e.goals.length-se," more"]}),e.doneGoals?.slice(0,se).map(p=>f("li",{className:"ow-row-goal-done",children:[
a(Mt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:p})]},`done:${p}`))]}),t&&a(
"div",{className:"ow-row-why",children:t}),!o&&f("div",{className:"ow-row-meta",children:[a("span",{className:"ow-trunca\
te",children:e.provenance}),$n(e).length>0&&a("span",{"aria-hidden":"true",children:"\xB7"}),a("span",{className:"ow-ref\
erences",children:$n(e).slice(0,3).map(p=>a(lo,{reference:p,onOpenSession:l},`${p.kind}:${p.id}`))})]})]}),a("div",{className:"\
ow-row-actions",children:a(We,{className:"ow-icon","aria-hidden":"true"})})]}),n&&g&&e.nextSteps&&e.nextSteps.length>0&&
a(Ne,{children:f("div",{className:"ow-row-steps",children:[a("div",{className:"ow-steps-head",children:"Open items"}),e.
nextSteps.slice(0,Ce).map((p,N)=>a("button",{type:"button",className:"ow-quote-step",title:p.why??p.what,onClick:A=>{A.stopPropagation(),
g(p.what)},children:p.what},`${N}:${p.what}`)),e.nextSteps.length>Ce&&f("div",{className:"ow-steps-more",children:["+",e.
nextSteps.length-Ce," more in the session"]})]})}),n&&e.retryPath&&y&&a(Ne,{children:a("div",{className:"ow-retry",children:a(
B,{onClick:()=>y(e.retryPath),disabled:!!i,children:"Retry"})})}),n&&e.permissionId&&d&&a(Ne,{children:a(Un,{tool:e.permissionTool||
"a tool",purpose:e.permissionPurpose,busy:!!h,onAnswer:p=>d(e.permissionId,p)})}),e.state==="needs-you"&&c&&b&&f("div",{
className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-aside-btn",onClick:p=>{p.stopPropagation(),c(
e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",onClick:p=>{p.stopPropagation(),b(e.id,e.updatedAt)},
children:"Handled"})]})]})}function ee({title:e,items:n,selectedId:o,onSelect:t,onOpenSession:r,onAnswerPermission:l,permissionBusy:d,
onRetry:h,retryBusy:y,onPickStep:i,onSnooze:g,onHandled:c,footer:b,collapsed:p,onToggleCollapsed:N,groupBy:A,prChecks:_,
emptyLabel:ie}){return f("section",{className:"ow-section","aria-label":e,children:[N?f(j,{onActivate:N,className:"ow-se\
ction-toggle",children:[a(Ae,{label:e,count:n.length}),a(We,{className:"ow-icon ow-section-chevron","data-open":p?void 0:
"true","aria-hidden":"true"})]}):a(Ae,{label:e,count:n.length}),p?null:a("div",{className:"ow-section-list",children:n.length===
0?a("p",{className:"ow-section-empty",children:ie}):Wn(n,A).map(x=>f("div",{className:"ow-block","data-grouped":x.header?
"true":void 0,children:[x.header==="session"&&x.sessionKey&&a(so,{item:x.items[0],onOpen:()=>r(x.sessionKey)}),x.header===
"pr"&&x.changeRef&&a(io,{reference:x.changeRef,checks:_?.[x.changeRef.url??""]}),x.header==="pr"?f(Be,{children:[a("div",
{className:"ow-pr-sublabel",children:"Sessions on this PR"}),An(x.items).map(R=>a(ao,{session:R,selected:o===R.leading.id,
onSelect:()=>t(R.leading),onOpen:()=>r(R.sessionKey)},R.sessionKey))]}):x.items.map(R=>a(co,{item:R,selected:o===R.id,continuation:x.
header==="session",whyRanked:R.state==="needs-you"&&R.action!=="resume"?be(Z(R),ae):void 0,onSelect:()=>t(R),onOpenSession:r,
onAnswerPermission:l,permissionBusy:d,onRetry:h,retryBusy:y,onPickStep:i,onSnooze:g,onHandled:c},R.id))]},x.key))}),b]})}
function uo(e,n){let o=kn(n,ae);if(!e)return["Crew Manager context: workspace overview.",...o,"Answer the user about the\
 state of their work. This is a conversation, not an action channel."].join(`
`);let t=e.references.map(r=>`${r.kind}: ${r.label} (${r.id})`).join(`
`);return[`Crew Manager context: ${e.title}`,...o,`Selected item: ${e.title}`,`State: ${Ie[e.state]}`,e.issue?"Issue det\
ected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,e.sessionKey?`Referenced session: ${e.
sessionKey}`:"Referenced session: none",`References:
${t}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(r=>!!r).join(`
`)}function po(){let e=Yt(),n=z(e);n.current=e;let o=Vt(),t=Qt(),[r,l]=k("all"),[d,h]=k("session"),[y,i]=k({}),[g,c]=k(""),
[b,p]=k(null),[N,A]=k(null),[_,ie]=k(null),[x,R]=k({}),[go,Hn]=k("unknown"),le=z("unknown"),Ke=z(new Map),[Oe,Le]=k({}),
[Pe,jn]=k({}),[Te,Gn]=k([]),[O,$e]=k(null),[$,Me]=k(null),[ze,De]=k(()=>Se(_e)),[qe,Yn]=k(()=>Se(Pn)),[Vn,Qn]=k(()=>Se(Tn,
null)??!0),[ne,de]=k(an),[Fe,Ue]=k({}),He=z(!0),[Jn,je]=k(!0),[Ge,ce]=k(null),[Xn,Zn]=k(!1),[Ye,G]=k(null),S=z(!0),Y=z(0),
ue=z(!1);K(()=>(S.current=!0,()=>{S.current=!1,Y.current+=1}),[]);let C=P(async()=>{let s=++Y.current,u=n.current;try{let[
w,m,v,en,nn,tn]=await Promise.all([u.get("/api/chat/slots"),u.get("/api/approvals"),u.get("/api/spawn"),u.get("/api/work\
flows/runs"),u.get("/api/crons"),u.get("/api/artifacts")]);if(!S.current||s!==Y.current)return;ie({slots:Array.isArray(w)?
w:[],approvals:Array.isArray(m)?m:[],agents:Array.isArray(v.agents)?v.agents:[],workflows:Array.isArray(en.runs)?en.runs:
[],crons:Array.isArray(nn.jobs)?nn.jobs:[],artifacts:Array.isArray(tn.artifacts)?tn.artifacts:[]}),ce(null)}catch(w){S.current&&
s===Y.current&&ce(w instanceof Error?w:new Error("Unable to load Crew Manager sources"))}finally{S.current&&s===Y.current&&
je(!1)}},[]);K(()=>{C();let s=window.setInterval(()=>{C()},eo);return()=>window.clearInterval(s)},[C]);let et=()=>{je(!0),
ce(null),C()};K(()=>{if(!_||le.current==="unsupported"||le.current==="disabled")return;let s=Bn(_.slots,H).filter(w=>Ke.
current.get(w.key)!==ve(w));if(s.length===0)return;let u=!1;return(async()=>{let{summaries:w,support:m}=await Kn(s,v=>n.
current.get(v));if(!(u||!S.current)&&(le.current=m,Hn(m),m==="available")){for(let v of s)w[v.key]&&Ke.current.set(v.key,
ve(v));R(v=>({...v,...w}))}})(),()=>{u=!0}},[_]),K(()=>{if(!_||!He.current)return;let s=!1;return(async()=>{try{let u=await n.
current.get("/api/apps/crew-manager/stalls");if(s||!S.current)return;let w={};for(let v of u?.stalls??[])v?.key&&(w[v.key]=
v);Le(w);let m={};for(let v of u?.error_loops??[])v?.key&&(m[v.key]=v);Ue(m)}catch{He.current=!1,S.current&&(Le({}),Ue({}))}})(),
()=>{s=!0}},[_]),K(()=>{if(ne.unsupported)return;let s=g.trim();if(!on(s)){de(m=>m.hits.length?{...m,hits:[]}:m);return}
let u=!1,w=setTimeout(()=>{(async()=>{try{let m=await n.current.get(dn(s,oo));if(u||!S.current)return;de(ln(m))}catch{S.
current&&de({unsupported:!0,hits:[]})}})()},300);return()=>{u=!0,clearTimeout(w)}},[g,ne.unsupported]);let Ve=T(()=>vn(Cn(
_??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[]},ae,x,Oe,Fe),Pe),[_,x,Oe,Fe,Pe]),D=T(()=>Sn(Ve,ze,
qe),[Ve,ze,qe]),I=T(()=>D.items.filter(s=>Rn(s)),[D]),pe=T(()=>ke(I),[I]),L=T(()=>I.find(s=>s.id===b)??null,[I,b]),W=T(()=>{
let s=In(I,g);return g.trim()||r==="all"?s:s.filter(u=>u.state===r)},[r,I,g]);K(()=>{if(d!=="pr")return;let s=new Set;for(let w of W)
for(let m of w.references)m.kind==="change"&&m.url&&/github\.com\/.+\/pull\//.test(m.url)&&s.add(m.url);let u=!1;for(let w of s)
y[w]||n.current.get(`/pr-checks?url=${encodeURIComponent(w)}`).then(m=>{!u&&S.current&&i(v=>({...v,[w]:m}))}).catch(()=>{});
return()=>{u=!0}},[d,W,y]),K(()=>t(pe["needs-you"]),[pe,t]),K(()=>{b&&!I.some(s=>s.id===b)&&p(null)},[I,b]),K(()=>{let s=u=>{
(u.metaKey||u.ctrlKey)&&u.key.toLocaleLowerCase("en-US")==="k"&&(u.preventDefault(),document.querySelector('[data-crew-m\
anager-search="true"]')?.focus())};return window.addEventListener("keydown",s),()=>window.removeEventListener("keydown",
s)},[]);let ge=_?.slots.find(s=>s.key===H),nt=!!(ge||Xn);K(()=>{!_||ge||ue.current||(ue.current=!0,e.post("/api/chat/slo\
ts",{name:H,title:"Conductor"}).then(()=>{S.current&&(Zn(!0),C())}).catch(s=>{S.current&&(ue.current=!1,G(s instanceof Error?
`Conductor session could not be created: ${s.message}`:"Conductor session could not be created"))}))},[e,ge,C,_]);let Qe=T(
()=>hn(_?.approvals??[],Te,s=>I.find(u=>u.sessionKey===s)?.title??_?.slots?.find(u=>u.key===s)?.title??s),[I,_,Te]),V=L&&
!L.permissionId?L:null,q=P(async(s,u)=>{if(!O){$e(s),G(null);try{await n.current.post(`/api/approvals/${encodeURIComponent(
s)}/${u?"approve":"reject"}`,{}),C()}catch(w){G(w instanceof Error?`Could not answer that request: ${w.message}`:"Could \
not answer that request"),C()}finally{S.current&&$e(null)}}},[C,O]),Je=P(s=>{De(u=>{let w=Object.fromEntries(Object.entries(
u).filter(([,m])=>m>Date.now()));return w[s]=Date.now()+_n,re(_e,w),w}),p(null)},[]),Xe=P((s,u)=>{Yn(w=>{let m={...w,[s]:u};
return re(Pn,m),m}),p(null)},[]),Ze=P(()=>{De({}),re(_e,{})},[]),tt=P(()=>{Qn(s=>(re(Tn,!s),!s))},[]),Q=P(async s=>{if(!$){
Me(s),G(null);try{await n.current.post(s,{}),C()}catch(u){G(u instanceof Error?`Could not re-run it: ${u.message}`:"Coul\
d not re-run it"),C()}finally{S.current&&Me(null)}}},[C,$]),F=P(async s=>{let u=L&&!L.permissionId?L:null;if(u?.sessionKey){
let w=u.sessionKey;if(await n.current.post("/api/chat",{message:s,slot:w}).catch(m=>{if(!(m instanceof SyntaxError))throw m}),
!S.current)return;jn(m=>({...m,[u.id]:Date.now()})),Gn(m=>m.includes(w)?m:[...m,w]),A(`Sent new instructions to ${u.title}`),
p(null),C();return}await n.current.post(`/api/chat/slots/${encodeURIComponent(H)}/context`,{content:uo(L,I),source:"crew\
-manager",ephemeral:!0}).catch(()=>{}),await n.current.post("/api/chat",{message:s,slot:H}).catch(w=>{if(!(w instanceof SyntaxError))
throw w})},[L,I,C]),ot=T(()=>rn(ne.hits,W),[ne.hits,W]),fe={"needs-you":W.filter(s=>s.state==="needs-you"),running:W.filter(
s=>s.state==="running"),done:W.filter(s=>s.state==="done")},U=s=>o(`/chat?sid=${encodeURIComponent(s)}`),J=s=>{p(u=>u===
s.id?null:s.id),A(null)};return f("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[a("style",
{children:On}),a(Xt,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what finished \
recently."}),a("div",{className:"ow-body",children:f("div",{className:"ow-layout",children:[a("nav",{className:"ow-rail",
"aria-label":"Crew Manager",children:f("div",{className:"ow-rail-inner",children:[a(Zt,{"data-crew-manager-search":"true",
value:g,onChange:s=>c(s.target.value),placeholder:"Search work and projects\u2026 \u2318K","aria-label":"Search work",className:"\
ow-search"}),f("div",{className:"ow-groupby",role:"group","aria-label":"Group by",children:[a("span",{className:"ow-grou\
pby-label",children:"Group by"}),["session","pr"].map(s=>a(B,{onClick:()=>h(s),"aria-pressed":d===s,"data-selected":d===
s,className:"ow-groupby-opt",children:s==="session"?"Session":"PR"},s))]})]})}),a("main",{className:"ow-work",children:f(
"div",{className:"ow-work-inner",children:[a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.
keys(Re).map(s=>f(B,{onClick:()=>l(s),"aria-pressed":r===s,"data-selected":r===s,className:"ow-filter",children:[Re[s],a(
"span",{className:"ow-count",children:pe[s]})]},s))}),Jn?a(Ln,{rows:7}):Ge&&!_?a(xe,{icon:a(Mn,{className:"ow-icon"}),title:"\
Crew Manager could not load the work view",subtitle:Ge.message,action:a(B,{onClick:et,children:"Try again"})}):W.length===
0?a(xe,{icon:a(Ht,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter or search for a session, p\
roject, PR, or output."}):r==="all"||g.trim()?d==="pr"?W.some(s=>s.references.some(u=>u.kind==="change"||u.kind==="issue"))?
a(ee,{title:"Work by PR",items:W,prChecks:y,selectedId:b,onSelect:J,onSnooze:Je,onHandled:Xe,footer:D.snoozedCount>0?f("\
button",{type:"button",className:"ow-aside-note",onClick:Ze,children:[D.snoozedCount," set aside for later \u2014 bring back"]}):
void 0,onOpenSession:U,onAnswerPermission:(s,u)=>{q(s,u)},permissionBusy:O!==null,onRetry:s=>{Q(s)},retryBusy:$!==null,onPickStep:s=>{
F(s)},groupBy:d,emptyLabel:"No matching work"}):a(xe,{icon:a(Dn,{className:"ow-icon"}),title:"No work is linked to a PR \
right now",subtitle:"Work links to a PR when a session mentions its URL (a GitHub/GitLab pull, merge request, or issue).\
 None of the current sessions do, so there is nothing to group by PR yet.",action:a(B,{onClick:()=>h("session"),children:"\
Back to Session view"})}):f(Be,{children:[a(ee,{title:"Needs you",items:fe["needs-you"],selectedId:b,onSelect:J,onSnooze:Je,
onHandled:Xe,footer:D.snoozedCount>0?f("button",{type:"button",className:"ow-aside-note",onClick:Ze,children:[D.snoozedCount,
" set aside for later \u2014 bring back"]}):void 0,onOpenSession:U,onAnswerPermission:(s,u)=>{q(s,u)},permissionBusy:O!==
null,onRetry:s=>{Q(s)},retryBusy:$!==null,onPickStep:s=>{F(s)},groupBy:d,emptyLabel:"Nothing needs your input right now."}),
a(ee,{title:"In progress",items:fe.running,selectedId:b,onSelect:J,onOpenSession:U,onAnswerPermission:(s,u)=>{q(s,u)},permissionBusy:O!==
null,onRetry:s=>{Q(s)},retryBusy:$!==null,onPickStep:s=>{F(s)},groupBy:d,emptyLabel:"Nothing is in progress right now."}),
a(ee,{title:"Done recently",items:fe.done,selectedId:b,onSelect:J,collapsed:Vn,onToggleCollapsed:tt,onOpenSession:U,onAnswerPermission:(s,u)=>{
q(s,u)},permissionBusy:O!==null,onRetry:s=>{Q(s)},retryBusy:$!==null,onPickStep:s=>{F(s)},groupBy:d,emptyLabel:"No recen\
t completed work."})]}):a(ee,{title:Re[r],items:W,selectedId:b,onSelect:J,onOpenSession:U,onAnswerPermission:(s,u)=>{q(s,
u)},permissionBusy:O!==null,onRetry:s=>{Q(s)},retryBusy:$!==null,onPickStep:s=>{F(s)},groupBy:d,emptyLabel:"No matching \
work"}),g.trim()&&a(ro,{hits:ot,now:Date.now(),onOpenSession:U})]})}),f("aside",{className:"ow-conductor","aria-label":"\
Conductor",children:[f("div",{className:"ow-conductor-header",children:[a("div",{className:"ow-conductor-title",children:a(
"h2",{children:"Conductor"})}),a("p",{className:"ow-private-hint",children:"Select work on the left to send it instructi\
ons. With nothing selected, ask across your work."})]}),a("div",{className:"ow-chat",children:nt?f("div",{className:"ow-\
chat-panel",children:[V&&f("div",{className:"ow-quote",children:[f("div",{className:"ow-quote-body",children:[a("span",{
className:"ow-eyebrow",children:V.sessionKey?"Instructing":"Quoted"}),a("span",{className:"ow-quote-title",title:V.title,
children:V.title})]}),a(B,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{p(null),A(
null)},children:"Clear"})]}),Qe.length>0&&a("div",{className:"ow-permissions",role:"alert",children:Qe.map(s=>a(Un,{tool:s.
tool,purpose:s.purpose,where:s.sessionLabel,busy:O!==null,onAnswer:u=>{q(s.id,u)}},s.id))}),N&&f("div",{className:"ow-co\
nductor-receipt",role:"status",children:[a(zn,{className:"ow-icon"}),N]}),Ye&&a("div",{className:"ow-chat-error",role:"a\
lert",children:Ye}),a("div",{className:"ow-embed",children:a(Jt,{slotKey:H,frameless:!0,startAtBottom:!0,placeholder:V?.
sessionKey?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:F})})]}):a("div",{className:"ow\
-chat-loading",children:a(Ln,{rows:4})})})]})]})})]})}export{po as default};
