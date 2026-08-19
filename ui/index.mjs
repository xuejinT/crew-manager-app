import{Fragment as Sn,useCallback as P,useEffect as G,useMemo as z,useRef as ie,useState as S}from"react";import{AlertTriangle as En,
Bot as Go,Check as Pn,ChevronRight as xe,Check as On,Clock as Fo,Package as Uo,ExternalLink as $n,MessageSquare as vt,Shield as jo,
Waves as Ho,Search as Vo,Tag as Mn,Users as bt,Zap as Yo}from"lucide-react";import{useAppApi as Qo,useNavigate as Jo,useNavBadge as Xo,
ChatEmbed as Zo}from"@kirocrew/app-sdk";import{Badge as He,Btn as E,ContentSkeleton as Rn,EmptyState as gt,Input as es,PageHeader as ts,
SearchInput as ns}from"@kirocrew/app-sdk/ui";function $t(e){return e.trim().length>=2}function Mt(e,t){let o=new Set(t.map(l=>l.sessionKey).filter(Boolean)),n=new Set,
i=[];for(let l of e){let c=l?.session_key;!c||o.has(c)||n.has(c)||(n.add(c),i.push(l))}return i}function co(e,t){if(!e)return 0;
let o=e>1e11?e/1e3:e,n=Math.floor((t/1e3-o)/86400);return n>0?n:0}function Tt(e,t){let o=co(e,t);if(o<=0)return"today";if(o===
1)return"yesterday";if(o<7)return`${o} days ago`;if(o<30){let i=Math.floor(o/7);return i===1?"last week":`${i} weeks ago`}
let n=Math.floor(o/30);return n===1?"last month":`${n} months ago`}var zt={unsupported:!1,hits:[],scope:"workspace"};function qt(e){
return!e||e.enabled===!1?{unsupported:!0,hits:[],scope:"workspace"}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:
[]).filter(o=>!!o?.session_key),scope:e.scope==="all"?"all":"workspace"}}function Dt(e,t,o="workspace"){let n=new URLSearchParams(
{q:e.trim(),limit:String(t)});return o==="all"&&n.set("scope","all"),`/api/apps/crew-manager/recall?${n.toString()}`}function he(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),n=t%
60;return n===0?`${o} hour${o===1?"":"s"}`:`${o}h ${n}m`}function en(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function at(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function tn(e,t,o){let n=new Set(t.filter(Boolean));if(n.size===0)return[];
let i=new Set,l=[];for(let c of e){let d=c.slot;!d||!n.has(d)||!c.id||i.has(c.id)||(i.add(c.id),l.push({id:c.id,sessionKey:d,
sessionLabel:o(d),tool:c.tool||"a tool",purpose:c.tool_purpose}))}return l}var Gt={"needs-you":0,running:1,done:2};function T(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function uo(e,t){
if(e.paused)return"";let o=T(e.next_run_ts);if(!o)return"";let n=Math.round((o-t)/1e3);return n<=0?"":he(n)}var Ft=72;function re(e,t){
let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let i=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(i.length<=Ft)return i;let l=i.slice(0,Ft),c=l.lastIndexOf(" ");return`${(c>24?l.slice(0,c):l).trim()}\u2026`}
function ae(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var po=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
go=/^\((?:code|diff|widget|image)\)$/,fo=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
mo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,wo=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
ho=/[?？]["'”’)\]]*$/;function nn(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||go.test(t)||po.test(
t)?null:t}function it(e){if(!e.waiting_for_input)return null;let t=nn(e);return!t||fo.test(t)||mo.test(t)?null:wo.test(t)||
ho.test(t)?t:null}function Ut(e){return e.pending_approval||it(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":ae(e)?"needs-you":"done"}function bo(e,t){if(e.pending_approval)return t("approval_waiting");let o=it(e);return o||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):ae(e)?t("linked_change_issue"):nn(e)??t("recent_w\
ork_ready"))}function nt(e,t){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function ko(e){return e.pending_approval?"review-approval":it(e)?"reply":"open"}function yo(e,t){
let o=(e.source_links??[]).map(n=>({kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:
`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key,status:en(n)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:bo(e,t),state:Ut(e),moving:Ut(e)==="running"||void 0,issue:ae(e),updatedAt:T(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:nt(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:ae(e)||void 0,action:ko(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...o]}}function lt(e,t){e.references.
some(o=>o.kind===t.kind&&o.id===t.id)||e.references.push(t)}function on(e){return(e.source||"").toLowerCase()==="subagen\
t"}function vo(e,t,o){let n=on(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,T(t.ts)),e.summary=o(n?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=n?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,lt(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),
sessionKey:t.slot||e.sessionKey})}function xo(e,t,o){e.updatedAt=Math.max(e.updatedAt,T(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),lt(e,{kind:"agent",id:t.id,
label:t.agent||o("agent"),sessionKey:t.parent||e.sessionKey})}function _o(e,t,o){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow\
_failed",{name:t.name})),lt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function So(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function Ro(e,t,o){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===o}function No(e){let t=null,o=-1;for(let n of e){let i=n.last_touched_turn??0;i>o&&(o=i,t=n)}return t}function Io(e,t){let o=e.next_steps?.find(i=>i.what?.trim())?.what?.trim();if(o)return o;let n=[...e.progress??[]].reverse().
find(i=>i.trim());return n?n.trim():e.initial_intent?.trim()||t("work_in_progress")}var Co=3;function Wo(e,t,o){if(!t?.enabled)
return[];let n=t.intents??[];if(n.length===0)return[];let i=(e.source_links??[]).map(s=>({kind:s.kind==="issue"?"issue":
"change",id:s.url,label:s.kind==="issue"?`issue #${s.number}`:`${s.provider} #${s.number}`,url:s.url,sessionKey:e.key,status:en(
s)})),l=[],c=No(n),m=!!(e.running||e.subagents_running||e.orchestrating)?[]:n.filter(s=>s.state==="in-progress");m.forEach(
s=>{let p=n.indexOf(s),h=(s.next_steps??[]).filter(x=>x.what?.trim());l.push({id:`unattended:${e.key}:${p}`,title:re(s.title,
e.title||o("untitled_work")),summary:h[0]?.what?.trim()||o("no_next_step"),state:"needs-you",issue:ae(e),updatedAt:T(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:nt(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:ae(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.
key},...i],nextSteps:h,progress:(s.progress??[]).filter(x=>x.trim()),stale:!!t.stale,lastTouchedTurn:s.last_touched_turn??
0})}),n.forEach((s,p)=>{if(m.includes(s))return;let h=So(s,e);if(!h)return;let x=(s.next_steps??[]).filter(k=>k.what?.trim());
l.push({id:`intent:${e.key}:${p}`,title:re(s.title,e.title||o("untitled_work")),summary:Io(s,o),state:h,issue:!1,updatedAt:T(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:nt(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:ae(
e)||void 0,unverified:s.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...i],nextSteps:x,progress:(s.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:s.
last_touched_turn??0,moving:Ro(s,e,c)||void 0})});let _=l.filter(s=>s.state==="needs-you"),y=l.filter(s=>s.state!=="need\
s-you").sort((s,p)=>(p.lastTouchedTurn??0)-(s.lastTouchedTurn??0));return[..._,...y].slice(0,Math.max(Co,_.length))}var sn=new Set(
["crew-manager-conductor","overwatch-conductor"]),Ao={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Bo=3;function Ko(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Fe=5;function rn(e,t,o=Date.now()){let n=dt(e),i=un(
e.filter(c=>c.state==="needs-you"),o),l=[`Fleet: ${n["needs-you"]} waiting on the user, ${n.running} in progress, ${n.done}\
 finished recently.`];return i.length===0?(l.push("Nothing is waiting on the user."),l):(l.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Fe,i.length)}):`),i.slice(0,Fe).forEach((c,d)=>{let m=ke(X(c,o),t),_=c.sessionKey?
` [session ${c.sessionKey}]`:"";l.push(`${d+1}. ${c.title} \u2014 ${c.summary} (${m})${_}`)}),i.length>Fe&&l.push(`\u2026and ${i.
length-Fe} more waiting.`),l)}var ot=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),jt=.6,Ht=2;function st(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!ot.has(t)))]}function Ue(e,t){let o=st(e),n=st(t);if(o.length<Ht||n.length<Ht)return 0;
let i=o.length<=n.length?o:n,l=new Set(o.length<=n.length?n:o);return i.filter(d=>l.has(d)).length/i.length}function Vt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Yt(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function Qt(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function Le(e,t){
if(Vt(e).find(i=>Vt(t).includes(i)))return"same_change";if(Yt(e).find(i=>Yt(t).includes(i)))return"same_artifact";if(Ue(
e.title,t.title)>=jt)return"same_topic";for(let i of Qt(e))for(let l of Qt(t))if(Ue(i,l)>=jt)return"same_step";return null}
var je={merged:[],split:[]};function Jt(e){return`${e.sessionKey??e.id}|${st(e.title).join(" ")}`}function be(e,t){return[
Jt(e),Jt(t)].sort().join("")}function Lo(e,t=je){let o=e.filter(n=>n.state!=="done"&&n.sessionKey).sort((n,i)=>(n.updatedAt||
0)-(i.updatedAt||0));for(let n=1;n<o.length;n+=1){let i=o[n];for(let l=0;l<n;l+=1){let c=o[l];if(c.sessionKey===i.sessionKey||
t.split.includes(be(i,c)))continue;let d=Le(i,c);if(d){i.duplicateOf={sessionKey:c.sessionKey,title:c.title,because:d};break}}}
Eo(o,t)}var tt=3,Xt=["same_change","same_artifact","same_topic","same_step"];function Eo(e,t){for(let o of e){let n=[],i=new Set;
for(let l of e){let c=l.sessionKey;if(c===o.sessionKey||i.has(c)||t.split.includes(be(o,l)))continue;let d=Le(o,l);d&&(i.
add(c),n.push({sessionKey:c,title:l.title,because:d}))}n.length!==0&&(n.sort((l,c)=>Xt.indexOf(l.because)-Xt.indexOf(c.because)),
o.relatedSessions=n.slice(0,tt),n.length>tt&&(o.relatedMore=n.length-tt))}}var Po=3e4;function an(e,t,o=Date.now()){return Object.
keys(t).length===0?e:e.map(n=>{let i=t[n.id];return!i||o-i>Po||n.state==="running"?n:{...n,state:"running",moving:!0,instructed:!0}})}
function X(e,t=Date.now()){let o=[],n=(l,c,d=1)=>{o.push({signal:l,weight:Ao[l]*d,values:c})};e.approvalKind==="subagent"?
n("subagent_gate"):e.approvalKind==="tool"&&n("approval_owed"),e.action==="reply"&&n("input_requested"),e.unverified&&n(
"unverified_completion"),e.loopRepeats&&n("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&n("run_failed"),e.stalledFor&&
n("stalled",{duration:he(e.stalledFor)}),e.changeBlocked&&n("change_blocked"),e.unattendedGoals&&n("nobody_on_it",{count:String(
e.unattendedGoals)}),e.queuedBehind&&n("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let i=Ko(
e,t);return i>0&&n("waiting_a_while",{hours:String(i)},Math.min(i,Bo)),o.sort((l,c)=>c.weight-l.weight),{score:o.reduce(
(l,c)=>l+c.weight,0),signals:o}}var Oo={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"\
unblock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function ct(e,t=Date.
now()){if(e.state!=="needs-you")return null;for(let o of X(e,t).signals){let n=Oo[o.signal];if(n)return n}return null}var ln=14400*
1e3;function cn(e,t,o,n=Date.now()){let i=0,l=[];for(let c of e){if(c.state!=="needs-you"){l.push(c);continue}let d=t[c.
id];if(d&&d>n){i+=1;continue}let m=o[c.id];if(m!==void 0&&c.updatedAt<=m){l.push({...c,state:"done",issue:!1});continue}
l.push(c)}return{items:l,snoozedCount:i}}var $o=4320*60*1e3;function dn(e,t=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:t-e.updatedAt<=$o}var Mo={"needs-you":1,running:-1,done:-1};function To(e,t,o){let n=e.updatedAt>0,i=t.updatedAt>0;
return!n&&!i?0:n?i?(e.updatedAt-t.updatedAt)*o:-1:1}function ke(e,t){let o=e.signals.slice(0,2);return o.length===0?t("r\
ank_nothing_pressing"):o.map(i=>t(`rank_${i.signal}`,i.values)).join(t("rank_join"))}function un(e,t=Date.now()){let o=new Map(
e.map(n=>[n.id,X(n,t)]));return[...e].sort((n,i)=>{let l=Gt[n.state]-Gt[i.state];if(l!==0)return l;if(n.state==="needs-y\
ou"){let c=(o.get(i.id)?.score??0)-(o.get(n.id)?.score??0);if(c!==0)return c}else if(n.issue!==i.issue)return n.issue?-1:
1;return To(n,i,Mo[n.state])})}function pn(e,t,o={},n={},i={},l=je,c=Date.now()){let d=new Map,m=new Map;for(let s of e.
slots){if(!s.key||sn.has(s.key)||s.memory_mode==="incognito")continue;let p=Wo(s,o[s.key],t);if(p.length>0){for(let k of p)
d.set(k.id,k);let x=p.find(k=>k.state==="needs-you")??p[0];m.set(s.key,x);continue}let h=yo(s,t);d.set(h.id,h),m.set(s.key,
h)}for(let[s,p]of Object.entries(n)){let h=m.get(s);h&&(h.state="needs-you",h.issue=!0,h.stalledFor=p.silent_secs,h.summary=
p.reason?t("stalled_because",{reason:p.reason,duration:he(p.silent_secs)}):t("stalled_for",{duration:he(p.silent_secs)}),
h.action="open")}for(let[s,p]of Object.entries(i)){let h=m.get(s);h&&(h.state="needs-you",h.issue=!0,h.loopRepeats=p.repeats,
h.summary=t("error_loop",{tool:p.tool,repeats:String(p.repeats)}),h.action="open")}for(let s of e.approvals){let p=s.slot?
m.get(s.slot):void 0;if(p){vo(p,s,t);continue}d.set(`approval:${s.id}`,{id:`approval:${s.id}`,title:re(s.tool||s.source,
t("approval_needed")),summary:s.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:T(s.ts),provenance:t(
"approval"),action:"review-approval",approvalKind:on(s)?"subagent":"tool",permissionId:s.id,permissionTool:s.tool||s.source,
permissionPurpose:s.tool_purpose,references:[{kind:"approval",id:s.id,label:s.tool||s.source||t("approval")}]})}for(let s of e.
agents){let p=s.parent?m.get(s.parent):void 0;if(p){xo(p,s,t);continue}let h=!!(s.done&&(s.error||s.outcome==="failed"));
s.parent&&!h||d.set(`agent:${s.id}`,{id:`agent:${s.id}`,title:re(s.task||s.agent,t("agent_work")),summary:h?s.error?.trim()||
t("agent_failed",{task:s.task}):s.done?t("agent_done"):t("work_in_progress"),state:h?"needs-you":s.done?"done":"running",
issue:h,runFailed:h||void 0,retryPath:h&&!s.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(s.id)}/retry`:void 0,
updatedAt:T(s.started),provenance:s.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:s.id,label:s.agent||
t("agent")}]})}for(let s of e.workflows){let p=s.session_key?m.get(s.session_key):void 0;if(p){_o(p,s,t);continue}let h=s.
status==="failed";d.set(`workflow:${s.run_id}`,{id:`workflow:${s.run_id}`,title:re(s.name,s.run_id),summary:h?t("workflo\
w_failed_generic"):s.status==="running"?t("workflow_running"):t("workflow_finished"),state:h?"needs-you":s.status==="run\
ning"?"running":"done",issue:h,runFailed:h||void 0,retryPath:h?`/api/workflows/runs/${encodeURIComponent(s.run_id)}/reru\
n`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:s.run_id,label:s.name||s.
run_id}]})}for(let s of e.crons){if(!s.is_running&&s.last_status!=="error")continue;let p=s.last_status==="error",h=uo(s,
c),x=t(p?"monitor_failed":"monitor_running");d.set(`monitor:${s.id}`,{id:`monitor:${s.id}`,title:s.name,summary:h?`${x} ${t(
"monitor_next_check",{duration:h})}`:x,state:p?"needs-you":"running",issue:p,runFailed:p||void 0,retryPath:p?`/api/crons\
/${encodeURIComponent(s.id)}/run`:void 0,updatedAt:T(s.running_since||s.last_run_ts||s.created_ts),provenance:t("monitor"),
action:p?"discuss":void 0,references:[{kind:"monitor",id:s.id,label:s.name}]})}for(let s of e.loops||[]){if(!s.active)continue;
let p=String(s.id||"");if(!p)continue;let h=Math.max(0,Number(s.cycle_count)||0),x=Math.max(0,Number(s.max_cycles)||0),k=s.
slot_key&&m.has(s.slot_key)?s.slot_key:void 0;d.set(`loop:${p}`,{id:`loop:${p}`,title:re(s.message||"",t("loop")),summary:x?
t("loop_watching_capped",{cycles:String(h),cap:String(x)}):t("loop_watching",{cycles:String(h)}),state:"running",issue:!1,
updatedAt:T(s.last_fire_ts||s.created_ts),sessionKey:k,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(
p)}`,action:k?"open":void 0,references:[{kind:"monitor",id:p,label:t("loop"),sessionKey:k},...k?[{kind:"session",id:k,label:m.
get(k)?.title||k,sessionKey:k}]:[]]})}let _=[...e.artifacts].sort((s,p)=>T(p.updated_at)-T(s.updated_at)).slice(0,8);for(let s of _){
let p=s.session_key&&m.has(s.session_key)?s.session_key:void 0;d.set(`artifact:${s.slug}`,{id:`artifact:${s.slug}`,title:re(
s.name,t("artifact")),summary:s.description||t("artifact_ready",{kind:s.kind}),state:"done",issue:!1,updatedAt:T(s.updated_at||
s.created_at),sessionKey:p,provenance:s.session_title||s.source||t("artifact"),action:p?"open":void 0,references:[{kind:"\
artifact",id:s.slug,label:s.name,sessionKey:p},...p?[{kind:"session",id:p,label:s.session_title||p,sessionKey:p}]:[]]})}
let y=[...d.values()];return Lo(y,l),un(y)}function dt(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-y\
ou").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function gn(e,t){
let o=t.trim().toLowerCase();return o?e.filter(n=>[n.title,n.summary,n.provenance,...n.references.flatMap(l=>[l.label,l.
id,l.url])].join(`
`).toLowerCase().includes(o)):e}function fn(e){let t=[],o=new Map;for(let n of e){let i=n.sessionKey;if(!i)continue;let l=o.
get(i);if(l){l.count+=1;continue}let c=n.references.find(m=>m.kind==="session")?.label??n.provenance,d={sessionKey:i,label:c,
leading:n,count:1};o.set(i,d),t.push(d)}return t}function ut(e,t,o=je){if(t==="pr")return zo(e);if(t==="goal")return rt(
e,o);let n=[],i=new Map;for(let l of e){let c=l.sessionKey;if(!c){n.push({key:l.id,items:[l],header:null,sessionKey:null,
changeRef:null});continue}let d=i.get(c);if(d){d.items.push(l);continue}let m={key:c,items:[l],header:"session",sessionKey:l.
sessionKey??null,changeRef:null};i.set(c,m),n.push(m)}return n}function zo(e){let t=[],o=new Map;for(let n of e){let i=n.
references.filter(l=>l.kind==="change"||l.kind==="issue");for(let l of i){let c=`${l.kind}:${l.id}`,d=o.get(c);if(d){d.items.
push(n);continue}let m={key:c,items:[n],header:"pr",sessionKey:null,changeRef:l};o.set(c,m),t.push(m)}}return t}function rt(e,t){
let o=e.map((d,m)=>m),n=d=>{for(;o[d]!==d;)o[d]=o[o[d]],d=o[d];return d},i=(d,m)=>{o[n(m)]=n(d)};for(let d=0;d<e.length;d+=
1)for(let m=d+1;m<e.length;m+=1){let _=e[d],y=e[m];if(!_.sessionKey||!y.sessionKey||_.sessionKey===y.sessionKey)continue;
let s=be(_,y);t.split.includes(s)||(t.merged.includes(s)||Le(_,y))&&i(d,m)}let l=[],c=new Map;for(let d=0;d<e.length;d+=
1){let m=n(d),_=c.get(m);if(_){_.items.push(e[d]),_.header="goal";continue}let y={key:`goal:${e[d].id}`,items:[e[d]],header:null,
sessionKey:null,changeRef:null};c.set(m,y),l.push(y)}return l}function mn(e,t){let o=e.references.find(n=>n.kind==="sess\
ion")?.label??"";for(let n of[e.title,o,e.provenance]){let i=n.toLowerCase();for(let l of t)if(l.aliases.some(c=>c&&i.includes(
c.toLowerCase())))return l.name}return null}function wn(e,t){let o=t.flatMap(l=>l.aliases.map(c=>c.toLowerCase())),n=new Set(
["workspace","workspaces","home","src","tmp","documents","desktop"]),i=new Map;for(let l of e){if(!l.key||sn.has(l.key)||
l.memory_mode==="incognito")continue;let c=l.project;if(!c)continue;let d=c.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop();!d||n.has(d.toLowerCase())||o.some(m=>d.toLowerCase().includes(m)||m.includes(d.toLowerCase()))||i.set(d,(i.get(
d)??0)+1)}return[...i.entries()].map(([l,c])=>({name:l,sessions:c})).sort((l,c)=>c.sessions-l.sessions)}function hn(e,t){
let o=new Map;for(let l of e){if(!l.sessionKey||mn(l,t)!==null)continue;let c=l.references.find(d=>d.kind==="session")?.
label??"";for(let d of[l.title,c]){let m=d.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);
for(let _ of[3,2])for(let y=0;y+_<=m.length;y+=1){let s=m.slice(y,y+_);if(ot.has(s[0])||ot.has(s[_-1])||s[0].length<3||s[_-
1].length<3)continue;let p=s.join(" ");o.has(p)||o.set(p,new Set),o.get(p).add(l.sessionKey)}}}let n=[...o.entries()].map(
([l,c])=>({phrase:l,sessions:c.size})).filter(l=>l.sessions>=2);return n.filter(l=>!n.some(c=>c.phrase!==l.phrase&&c.phrase.
includes(l.phrase)&&c.sessions>=l.sessions)).sort((l,c)=>c.sessions-l.sessions||c.phrase.length-l.phrase.length).map(l=>({
name:l.phrase.replace(/\p{L}+/gu,c=>c[0].toUpperCase()+c.slice(1)),sessions:l.sessions}))}function Zt(e){return e.some(t=>t.
state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function bn(e){let t=e.find(n=>n.moving);
if(t)return t;let o=e.find(n=>n.state==="running");return o||[...e].sort((n,i)=>(i.updatedAt||0)-(n.updatedAt||0))[0]}function qo(e){
let t=[],o=new Set;for(let n of e){let i=n.sessionKey;!i||o.has(i)||(o.add(i),t.push(n.references.find(l=>l.kind==="sess\
ion")?.label??n.provenance))}return t}function kn(e,t,o=je){let n=new Map,i=[],l=new Map;for(let y of e){let s=mn(y,t);if(l.
set(y.id,s),s===null){i.push(y);continue}n.has(s)||n.set(s,[]),n.get(s).push(y)}let c=rt(i,o),d=new Map;for(let y of c)d.
set(y.items[0].id,y);let m=[],_=new Set;for(let y of e){let s=l.get(y.id)??null;if(s!==null){if(_.has(s))continue;_.add(
s);let h=n.get(s);m.push({key:`initiative:${s}`,name:s,status:Zt(h),sessions:qo(h),blocks:rt(h,o)});continue}let p=d.get(
y.id);p&&m.push({key:p.key,name:null,status:Zt(p.items),sessions:[],blocks:[p]})}return m}function pt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function vn(e,t){return e.filter(o=>o.key&&
o.key!==t&&o.memory_mode!=="incognito").sort((o,n)=>yn(n)-yn(o)).slice(0,12)}function yn(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function xn(e,t){
let o={},n="unknown";for(let i of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(i.key)}/summary`);if(!l||typeof l!=
"object"){n="unsupported";break}if(l.enabled===!1){n="disabled";break}o[i.key]=l,n="available"}catch{n="unsupported";break}
return{summaries:o,support:n}}var _n=String.raw`
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
`;import{Fragment as Oe,jsx as a,jsxs as g}from"react/jsx-runtime";var ft="crew-manager.snoozed",Nn="crew-manager.handled",
In="crew-manager.done-collapsed",mt="crew-manager.goal-verdicts",Cn="crew-manager.initiative-collapsed";function Ee(e,t={}){
try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}function le(e,t){try{localStorage.setItem(e,JSON.
stringify(t))}catch{}}var ye="crew-manager-conductor",os=5e3,ss={session:"Session",approval:"Approval",agent:"Agent",workflow:"\
Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"\
Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer the request in the work thread",decision_ready:"\
Make the decision this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"Open the linked c\
hange \u2014 a check is failing or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"\
Review the pending {{tool}} request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool\
 call",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"This agent stopped before finishing \u2014 \
nothing to do here",workflow_failed:"This workflow stopped before finishing",workflow_failed_generic:"This workflow stop\
ped before finishing",workflow_running:"Workflow is running",workflow_finished:"Workflow finished",monitor_failed:"The l\
atest check stopped before finishing",monitor_running:"Monitor is checking now",monitor_next_check:"Checks again in {{du\
ration}}.",loop:"Monitor loop",loop_watching:"Re-prompting its own session \u2014 {{cycles}} cycles so far, no limit set",
loop_watching_capped:"Re-prompting its own session \u2014 cycle {{cycles}} of {{cap}}",artifact_ready:"{{kind}} output i\
s ready",stalled_for:"Check on it \u2014 no activity for {{duration}}, still marked running",stalled_because:"{{reason}}\
 Silent for {{duration}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same linked change",
duplicate_same_artifact:"Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_topic:"Looks li\
ke the same work as \u201C{{title}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same work",
related_sessions:"{{count}} other session(s) on this same work",related_same_change:"same change",related_same_artifact:"\
same artifact",related_same_topic:"similar goal",related_same_step:"same next step",related_more:"and {{count}} more",recall_scope_workspace:"\
This workspace",recall_scope_all:"All workspaces",rank_approval_owed:"only you can clear this approval",rank_subagent_gate:"\
a sub-agent is held at the spawn gate",rank_input_requested:"the agent asked you a question",rank_unverified_completion:"\
finished but never verified",rank_error_loop:"the same failure has repeated {{repeats}} times",rank_run_failed:"the run \
failed and has not been retried",rank_stalled:"silent for {{duration}}",rank_change_blocked:"a linked change is failing \
or conflicting",rank_nobody_on_it:"nobody is on {{count}} unfinished goal(s) in this session",no_next_step:"No next step\
 recorded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"{{\
tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work"};function F(e,t={}){return ss[e].
replace(/\{\{(\w+)\}\}/g,(o,n)=>t[n]??"")}var rs={followup:"FOLLOW UP",unblock:"UNBLOCK"},_e={"needs-you":"Needs you",running:"\
Running",done:"Done"},wt={all:"All","needs-you":"Needs you",running:"Running",done:"Done"},Wn={all:"All",failing:"Failin\
g",running:"Running",merged:"Merged"},as={session:vt,approval:En,agent:Go,workflow:Yo,monitor:Ho,artifact:Uo,change:$n,issue:Mn};
function U({children:e,onActivate:t,...o}){return a("div",{...o,role:"button",tabIndex:0,onClick:t,onKeyDown:n=>{(n.key===
"Enter"||n.key===" ")&&(n.preventDefault(),t())},children:e})}function kt({label:e,count:t,subtitle:o}){return g("div",{
className:"ow-section-header",children:[g("div",{className:"ow-section-heading",children:[a("h2",{className:"ow-section-\
title",children:e}),a("span",{className:"ow-section-count",children:t})]}),o&&a("p",{className:"ow-section-subtitle",children:o})]})}
function xt(e){if(e.state==="needs-you"){let t=ct(e);return t?a(He,{variant:"warn",className:"ow-verb",children:rs[t]}):
null}return e.state==="running"?e.moving?g(He,{variant:"aim",children:[a(Fo,{className:"ow-icon"}),_e[e.state]]}):a(He,{
variant:"muted",children:"Queued"}):g(He,{variant:"ok",children:[a(On,{className:"ow-icon"}),_e[e.state]]})}var is=8;function ls({hits:e,now:t,onOpenSession:o,scope:n,onScopeChange:i}){return e.length===0?null:g("section",{className:"\
ow-section","aria-label":"From past work",children:[a(kt,{label:"From past work",count:e.length}),a("div",{className:"ow\
-recall-scope",children:a(U,{className:"ow-recall-scope-toggle",onActivate:()=>i(n==="all"?"workspace":"all"),children:a(
"span",{children:F(n==="all"?"recall_scope_all":"recall_scope_workspace")})})}),a("div",{className:"ow-section-list",children:e.
map(l=>a(U,{className:"ow-row ow-recall-row",onActivate:()=>o(l.session_key),"data-testid":`recall-${l.session_key}`,children:g(
"div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[g("div",{className:"ow-row-head\
ing",children:[a("span",{className:"ow-row-title",children:l.title}),a("span",{className:"ow-recall-age",children:Tt(l.modified,
t)}),n==="all"&&l.workspace&&a("span",{className:"ow-recall-workspace",children:l.workspace})]}),l.snippet&&a("p",{className:"\
ow-row-summary",children:l.snippet})]}),g("div",{className:"ow-row-actions",children:[a(E,{className:"ow-primary-action",
onClick:c=>{c.stopPropagation(),o(l.session_key)},children:"Open"}),a(xe,{className:"ow-icon","aria-hidden":"true"})]})]})},
l.session_key))})]})}function Tn({tool:e,purpose:t,busy:o,onAnswer:n,where:i}){return g("div",{className:"ow-permission",
children:[g("div",{className:"ow-permission-body",children:[g("div",{className:"ow-permission-head",children:[a(jo,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),g(
"p",{className:"ow-permission-what",children:[i&&g("span",{className:"ow-truncate",children:[i," "]}),i?"wants to run ":
"Wants to run ",a("code",{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),g("div",{className:"ow\
-permission-actions",children:[a(E,{onClick:()=>n(!0),disabled:o,children:"Approve"}),a(E,{onClick:()=>n(!1),disabled:o,
children:"Reject"})]})]})}function Pe({children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"o\
w-expand-inner",children:e})})}var ht=3;function An(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(
o=>o.label.trim().toLowerCase()!==t)}function cs({candidates:e,prominent:t,busy:o,onAdd:n}){let[i,l]=S(""),c=t?e:e.filter(
d=>d.sessions>=2);return g("div",{className:"ow-bootstrap","data-prominent":t?"true":void 0,children:[a("div",{className:"\
ow-bootstrap-head",children:t?"No big goals defined yet":c.length>0?"Suggested goals":"Add a goal"}),(t||c.length>0)&&a(
"div",{className:"ow-bootstrap-sub",children:"Found in your unassigned work \u2014 click one to confirm it as a goal, or name\
 your own."}),c.length>0&&a("div",{className:"ow-bootstrap-chips",children:c.slice(0,4).map(d=>g("button",{type:"button",
className:"ow-bootstrap-chip",disabled:o,onClick:()=>n(d.name,[d.name]),children:[d.name," ",g("span",{className:"ow-boo\
tstrap-count",children:[d.sessions," session",d.sessions===1?"":"s"]})]},d.name))}),g("div",{className:"ow-bootstrap-cus\
tom",children:[a(es,{value:i,placeholder:"Or name a goal yourself\u2026","aria-label":"New goal name",onChange:d=>l(d.target.
value),onKeyDown:d=>{d.key==="Enter"&&i.trim()&&(n(i),l(""))}}),a(E,{disabled:o||!i.trim(),onClick:()=>{n(i),l("")},children:"\
Add goal"})]})]})}function Bn({members:e}){let t=e[0],o=new Set(e.map(d=>d.sessionKey).filter(Boolean)).size,n=e.filter(
d=>d.state==="needs-you").length,i=e.filter(d=>d.state==="running").length,l=e.filter(d=>d.state==="done").length,c=[`${o}\
 session${o===1?"":"s"}`];return n&&c.push(`${n} need${n===1?"s":""} you`),i&&c.push(`${i} running`),l&&c.push(`${l} don\
e`),g("div",{className:"ow-goal-digest",children:[t.summary&&a("p",{className:"ow-digest-line",children:t.summary}),a("d\
iv",{className:"ow-digest-counts",children:c.join(" \xB7 ")})]})}function Kn({block:e,status:t,folded:o,onToggle:n,onSplit:i,
selected:l,onSelect:c}){let d=e.items[0],m=new Set(e.items.map(s=>s.sessionKey).filter(Boolean)).size,_=[];for(let s=0;s<
e.items.length;s+=1)for(let p=s+1;p<e.items.length;p+=1)e.items[s].sessionKey!==e.items[p].sessionKey&&_.push(be(e.items[s],
e.items[p]));let y=g(Oe,{children:[n&&a("button",{type:"button",className:"ow-goal-fold","aria-label":o?`Expand ${d.title}`:
`Collapse ${d.title}`,"aria-expanded":!o,onClick:s=>{s.stopPropagation(),n()},children:a(xe,{className:"ow-icon ow-init-\
chevron","data-open":o?void 0:"true","aria-hidden":"true"})}),a(bt,{className:"ow-icon","aria-hidden":"true"}),a("span",
{className:"ow-truncate ow-block-name",children:d.title}),t&&a("span",{className:"ow-init-status","data-status":t,children:_e[t]}),
g("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),g("span",{className:"\
ow-truncate",children:[m," sessions, one goal"]})]}),i&&a(E,{className:"ow-block-open",title:"Not the same goal \u2014 split \
into separate cards","aria-label":`Split ${d.title}`,onClick:s=>{s.stopPropagation(),i(_)},children:"Split"})]});return c?
a(U,{onActivate:c,className:"ow-block-tab ow-goal-tab","aria-pressed":l,"data-selected":l?"true":void 0,children:y}):a("\
div",{className:"ow-block-tab",children:y})}var ds=.3;function Ln({item:e,items:t,onMerge:o}){let n=t.filter(i=>i.id!==e.
id&&i.sessionKey&&e.sessionKey&&i.sessionKey!==e.sessionKey).map(i=>({other:i,score:Le(e,i)?1:Ue(e.title,i.title)})).filter(
i=>i.score>=ds).sort((i,l)=>l.score-i.score).slice(0,2);return n.length===0?null:g("div",{className:"ow-merge-hint",children:[
a("span",{className:"ow-merge-hint-label",children:"Same goal?"}),n.map(({other:i})=>g("button",{type:"button",className:"\
ow-merge-hint-btn ow-truncate",onClick:()=>o(be(e,i)),children:["Merge with \u201C",i.title,"\u201D"]},i.id))]})}function us({
item:e,onOpen:t}){let o=e.references.find(i=>i.kind==="session"),n=e.references.filter(i=>i.kind!=="session");return g("\
div",{className:"ow-block-tab",children:[a(vt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-trunca\
te ow-block-name",children:o?.label??e.provenance}),g("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hi\
dden":"true",children:"\xB7"}),a("span",{className:"ow-truncate",children:e.provenance}),n.slice(0,2).map(i=>a("span",{className:"\
ow-truncate",children:i.label},`${i.kind}:${i.id}`))]}),a(E,{className:"ow-block-open",onClick:t,"aria-label":`Open ${o?.
label??e.provenance}`,children:"Open"})]})}function ps({session:e,selected:t,onSelect:o,onOpen:n}){return g(U,{onActivate:o,
className:"ow-srow","data-selected":t,children:[a(vt,{className:"ow-icon","aria-hidden":"true"}),g("div",{className:"ow-\
srow-body",children:[a("div",{className:"ow-srow-name ow-truncate",children:e.label}),a("div",{className:"ow-srow-state \
ow-truncate",children:e.leading.summary})]}),a("span",{className:"ow-srow-badge",children:xt(e.leading)}),a(E,{className:"\
ow-srow-open","aria-label":`Open ${e.label}`,onClick:i=>{i.stopPropagation(),n()},children:"Open"})]})}function gs({reference:e,
checks:t}){let o=e.status?/fail|conflict|closed/.test(e.status):!1;return g("div",{className:"ow-pr-head",children:[g("d\
iv",{className:"ow-pr-head-top",children:[a("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&a("a",
{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,
children:a($n,{className:"ow-icon","aria-hidden":"true"})})]}),a("div",{className:"ow-pr-status-line",children:t?.available&&
(t.total??0)>0?g("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total,
" checks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&a("span",{className:"ow-pr-dot","data-ba\
d":o?"true":void 0,children:e.status})})]})}function fs({reference:e,onOpenSession:t}){let o=as[e.kind],n=g(Oe,{children:[
a(o,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.label})]});return e.url?a("a",{className:"ow-ref\
erence ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:i=>i.stopPropagation(),children:n}):
e.sessionKey?a(U,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:n}):a("span",{className:"\
ow-reference",children:n})}function yt({item:e,selected:t,continuation:o,whyRanked:n,onSelect:i,onOpenSession:l,onAnswerPermission:c,
permissionBusy:d,onRetry:m,retryBusy:_,onStop:y,stopBusy:s,onPickStep:p,onSnooze:h,onHandled:x,hideBadge:k,compact:O,headless:C}){
let[I,q]=S(!1);return g(U,{onActivate:i,className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?
"true":void 0,"data-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[g("div",{className:"ow-row\
-layout",children:[g("div",{className:"ow-row-content",children:[!C&&g("div",{className:"ow-row-heading",children:[k?e.state===
"done"&&a(Pn,{className:"ow-icon ow-row-check","aria-hidden":"true"}):xt(e),a("span",{className:"ow-row-title",children:e.
title})]}),(!O||t)&&e.summary&&!(e.nextSteps??[]).some(v=>v.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",
children:e.summary}),e.duplicateOf&&g(U,{className:"ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[
a(bt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:F(`duplicate_${e.duplicateOf.
because}`,{title:e.duplicateOf.title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&a(Pe,{children:g("div",{className:"\
ow-related",children:[a("span",{className:"ow-related-label",children:F("related_sessions",{count:String(e.relatedSessions.
length)})}),e.relatedSessions.map(v=>g(U,{className:"ow-related-row",onActivate:()=>l(v.sessionKey),children:[a(bt,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:v.title}),a("span",{className:"ow-related-why",
children:F(`related_${v.because}`)})]},v.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:F("re\
lated_more",{count:String(e.relatedMore)})}):null]})}),n&&a("div",{className:"ow-row-why",children:n}),!o&&g("div",{className:"\
ow-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),An(e).length>0&&a("span",{"aria-hidden":"\
true",children:"\xB7"}),a("span",{className:"ow-references",children:An(e).slice(0,3).map(v=>a(fs,{reference:v,onOpenSession:l},
`${v.kind}:${v.id}`))})]})]}),a("div",{className:"ow-row-actions",children:a(xe,{className:"ow-icon","aria-hidden":"true"})})]}),
t&&p&&e.nextSteps&&e.nextSteps.length>0&&a(Pe,{children:g("div",{className:"ow-row-steps",children:[a("div",{className:"\
ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,I?void 0:ht).map((v,Z)=>a("button",{type:"button",className:"\
ow-quote-step",title:v.why??v.what,onClick:Se=>{Se.stopPropagation(),p(v.what)},children:v.what},`${Z}:${v.what}`)),e.nextSteps.
length>ht&&a("button",{type:"button",className:"ow-steps-more",onClick:v=>{v.stopPropagation(),q(Z=>!Z)},children:I?"Sho\
w fewer":`+${e.nextSteps.length-ht} more`})]})}),t&&e.retryPath&&m&&a(Pe,{children:a("div",{className:"ow-retry",children:a(
E,{onClick:()=>m(e.retryPath),disabled:!!_,children:"Retry"})})}),t&&e.stopPath&&y&&a(Pe,{children:a("div",{className:"o\
w-retry",children:a(E,{onClick:()=>y(e.stopPath),disabled:!!s,children:s?"Stopping\u2026":"Stop this loop"})})}),t&&e.permissionId&&
c&&a(Pe,{children:a(Tn,{tool:e.permissionTool||"a tool",purpose:e.permissionPurpose,busy:!!d,onAnswer:v=>c(e.permissionId,
v)})}),e.state==="needs-you"&&h&&x&&g("div",{className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-\
aside-btn",onClick:v=>{v.stopPropagation(),h(e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",
onClick:v=>{v.stopPropagation(),x(e.id,e.updatedAt)},children:"Handled"})]})]})}var ms=["unblock","followup","running","\
done"],ws={unblock:{label:"UNBLOCK",cls:"ow-lane-unblock"},followup:{label:"FOLLOW UP",cls:"ow-lane-followup"}};function hs(e){
return e.state==="done"?"done":e.state==="running"?"running":ct(e)??"unblock"}function bs({items:e,selectedId:t,onSelect:o,
onOpenSession:n,onAnswerPermission:i,permissionBusy:l,onRetry:c,retryBusy:d,onPickStep:m,onSnooze:_,onHandled:y,doneTitles:s}){
let[p,h]=S(!1),x=new Map;for(let k of e){let O=hs(k),C=x.get(O);C?C.push(k):x.set(O,[k])}return g(Oe,{children:[ms.filter(
k=>x.has(k)).map(k=>{let O=x.get(k),C=k==="unblock"||k==="followup"?ws[k]:null,I=C?O.map(v=>v.action!=="resume"?ke(X(v),
F):""):[],q=C&&I.length>0&&I.every(v=>v&&v===I[0])?I[0]:void 0;return g("div",{className:"ow-lane",children:[C&&g("div",
{className:"ow-lane-head",children:[a("span",{className:`ow-lane-badge ${C.cls}`,children:C.label}),q&&a("span",{className:"\
ow-lane-reason",children:q})]}),O.map(v=>a(yt,{item:v,hideBadge:!0,compact:!0,selected:t===v.id,continuation:!0,whyRanked:q?
void 0:v.state==="needs-you"&&v.action!=="resume"?ke(X(v),F):void 0,onSelect:()=>o(v),onOpenSession:n,onAnswerPermission:i,
permissionBusy:l,onRetry:c,retryBusy:d,onPickStep:m,onSnooze:_,onHandled:y},v.id))]},k)}),!x.has("done")&&s&&s.length>0&&
g("div",{className:"ow-lane ow-lane-done",children:[g("button",{type:"button",className:"ow-goals-toggle","aria-expanded":p,
onClick:()=>h(k=>!k),children:[a(xe,{className:"ow-icon","data-open":p?"true":void 0,"aria-hidden":"true"}),s.length," d\
one"]}),p&&a("ul",{className:"ow-done-list",children:s.map(k=>g("li",{className:"ow-row-goal-done",children:[a(Pn,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:k})]},k))})]})]})}function ve({title:e,items:t,
selectedId:o,onSelect:n,onOpenSession:i,onAnswerPermission:l,permissionBusy:c,onRetry:d,retryBusy:m,onStop:_,stopBusy:y,
onPickStep:s,onSnooze:p,onHandled:h,footer:x,collapsed:k,onToggleCollapsed:O,groupBy:C,prChecks:I,prFilter:q,doneBySession:v,
goalVerdicts:Z,onSplitGoal:Se,onMergeGoal:ce,initiativeBlocks:Re,collapsedInitiatives:Ne,onToggleInitiative:de,selectedGoalKey:Ie,
onSelectGoal:ee,subtitle:Ce,emptyLabel:We}){let Ae=ut(t,C,Z),$=C==="pr"&&q&&q!=="all"?Ae.filter(w=>w.changeRef&&at(w.changeRef,
I?.[w.changeRef.url??""])===q):Ae,ue=Re??[],D=C==="goal"?ue.length:C==="pr"?$.length:t.length,$e=w=>g("div",{className:"\
ow-block","data-grouped":w.header?"true":void 0,children:[w.header==="session"&&w.sessionKey&&a(us,{item:w.items[0],onOpen:()=>i(
w.sessionKey)}),w.header==="pr"&&w.changeRef&&a(gs,{reference:w.changeRef,checks:I?.[w.changeRef.url??""]}),w.header==="\
goal"&&a(Kn,{block:w,onSplit:Se,selected:Ie===w.key,onSelect:ee?()=>ee(w.key):void 0}),w.header==="pr"?g(Oe,{children:[a(
"div",{className:"ow-pr-sublabel",children:"Sessions on this PR"}),fn(w.items).map(R=>a(ps,{session:R,selected:o===R.leading.
id,onSelect:()=>n(R.leading),onOpen:()=>i(R.sessionKey)},R.sessionKey))]}):w.header==="session"?a(bs,{items:w.items,doneTitles:w.
sessionKey?v?.[w.sessionKey]:void 0,selectedId:o,onSelect:n,onOpenSession:i,onAnswerPermission:l,permissionBusy:c,onRetry:d,
retryBusy:m,onPickStep:s,onSnooze:p,onHandled:h}):w.items.map(R=>g(Sn,{children:[a(yt,{item:R,selected:o===R.id,continuation:w.
header==="session",whyRanked:R.state==="needs-you"&&R.action!=="resume"?ke(X(R),F):void 0,onSelect:()=>n(R),onOpenSession:i,
onAnswerPermission:l,permissionBusy:c,onRetry:d,retryBusy:m,onStop:_,stopBusy:y,onPickStep:s,onSnooze:p,onHandled:h}),C===
"goal"&&ce&&o===R.id&&a(Ln,{item:R,items:t,onMerge:ce})]},R.id))]},w.key),j=(w,R)=>g(Sn,{children:[a(yt,{item:w,selected:o===
w.id,headless:R!==null&&w.title===R,whyRanked:w.state==="needs-you"&&w.action!=="resume"?ke(X(w),F):void 0,onSelect:()=>n(
w),onOpenSession:i,onAnswerPermission:l,permissionBusy:c,onRetry:d,retryBusy:m,onPickStep:s,onSnooze:p,onHandled:h}),ce&&
o===w.id&&a(Ln,{item:w,items:t,onMerge:ce})]},w.id),Me=w=>{if(w.name){let V=Ne?.[w.key]??w.status!=="needs-you",Y=w.blocks.
flatMap(pe=>pe.items);return g("div",{className:"ow-block","data-grouped":"true",children:[g(U,{onActivate:()=>de?.(w.key,
!V),className:"ow-block-tab","aria-expanded":!V,children:[a(xe,{className:"ow-icon ow-init-chevron","data-open":V?void 0:
"true","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",children:w.name}),a("span",{className:"ow-\
init-status","data-status":w.status,children:_e[w.status]}),g("span",{className:"ow-block-tab-meta",children:[a("span",{
"aria-hidden":"true",children:"\xB7"}),g("span",{className:"ow-truncate",children:[w.sessions.length," session",w.sessions.
length===1?"":"s"]})]})]}),V?a(Bn,{members:Y}):Y.map(pe=>j(pe,null))]},w.key)}let R=w.blocks[0];if(R.header==="goal"){let V=Ne?.[w.
key]??w.status!=="needs-you";return g("div",{className:"ow-block","data-grouped":"true",children:[a(Kn,{block:R,status:w.
status,folded:V,onToggle:de?()=>de(w.key,!V):void 0,onSplit:Se,selected:Ie===R.key,onSelect:ee?()=>ee(R.key):void 0}),V?
a(Bn,{members:R.items}):R.items.map(Y=>j(Y,R.items[0].title))]},w.key)}let H=R.items[0];return g("div",{className:"ow-bl\
ock","data-grouped":"true",children:[g(U,{onActivate:()=>n(H),className:"ow-block-tab ow-goal-tab","aria-pressed":o===H.
id,"data-selected":o===H.id?"true":void 0,children:[xt(H),a("span",{className:"ow-truncate ow-block-name",children:H.title})]}),
j(H,H.title)]},w.key)};return g("section",{className:"ow-section","aria-label":e,children:[O?g(U,{onActivate:O,className:"\
ow-section-toggle",children:[a(kt,{label:e,count:D,subtitle:Ce}),a(xe,{className:"ow-icon ow-section-chevron","data-open":k?
void 0:"true","aria-hidden":"true"})]}):a(kt,{label:e,count:D,subtitle:Ce}),k?null:a("div",{className:"ow-section-list",
children:C==="goal"?ue.length===0?a("p",{className:"ow-section-empty",children:We}):ue.map(Me):$.length===0?a("p",{className:"\
ow-section-empty",children:We}):$.map($e)}),x]})}function ks(e,t){let o=rn(t,F);if(!e)return["Crew Manager context: work\
space overview.",...o,"Answer the user about the state of their work. This is a conversation, not an action channel."].join(
`
`);let n=e.references.map(l=>`${l.kind}: ${l.label} (${l.id})`).join(`
`),i=[e.stalledFor?`Silent for ${he(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(l=>!!l);return[`Crew Manager context: ${e.title}`,...o,`Selected item: ${e.title}`,
`State: ${_e[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...i.length>0?[`Why it is on the board:
${i.join(`
`)}`]:[],`References:
${n}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(l=>!!l).join(`
`)}function ys(){let e=Qo(),t=ie(e);t.current=e;let o=Jo(),n=Xo(),[i,l]=S("all"),[c,d]=S("session"),[m,_]=S("all"),[y,s]=S(
{}),[p,h]=S(""),[x,k]=S(null),[O,C]=S(null),[I,q]=S(null),[v,Z]=S({}),[Se,ce]=S("unknown"),Re=ie("unknown"),Ne=ie(new Map),
[de,Ie]=S({}),[ee,Ce]=S({}),[We,Ae]=S([]),[$,ue]=S(null),[D,$e]=S(null),[j,Me]=S(null),[w,R]=S(()=>Ee(ft)),[H,V]=S(()=>Ee(
Nn)),[Y,pe]=S(()=>Ee(mt,{merged:[],split:[]})),[ge,_t]=S([]),[zn,qn]=S(()=>Ee(Cn)),[Te,ze]=S(null),[Dn,Gn]=S(()=>Ee(In,null)??
!0),[Be,Ve]=S(zt),[St,Fn]=S("workspace"),[Rt,Nt]=S({}),It=ie(!0),[Un,Ct]=S(!0),[Wt,Ye]=S(null),[jn,Hn]=S(!1),[At,te]=S(null),
W=ie(!0),Ke=ie(0),Qe=ie(!1);G(()=>(W.current=!0,()=>{W.current=!1,Ke.current+=1}),[]);let B=P(async()=>{let r=++Ke.current,
u=t.current;try{let[f,b,N,A,Ge,Pt,Ot]=await Promise.all([u.get("/api/chat/slots"),u.get("/api/approvals"),u.get("/api/sp\
awn"),u.get("/api/workflows/runs"),u.get("/api/crons"),u.get("/api/artifacts"),u.get("/api/autonudge").catch(()=>({loops:[]}))]);
if(!W.current||r!==Ke.current)return;q({slots:Array.isArray(f)?f:[],approvals:Array.isArray(b)?b:[],agents:Array.isArray(
N.agents)?N.agents:[],workflows:Array.isArray(A.runs)?A.runs:[],crons:Array.isArray(Ge.jobs)?Ge.jobs:[],artifacts:Array.
isArray(Pt.artifacts)?Pt.artifacts:[],loops:Array.isArray(Ot?.loops)?Ot.loops:[]}),Ye(null)}catch(f){W.current&&r===Ke.current&&
Ye(f instanceof Error?f:new Error("Unable to load Crew Manager sources"))}finally{W.current&&r===Ke.current&&Ct(!1)}},[]);
G(()=>{B();let r=window.setInterval(()=>{B()},os);return()=>window.clearInterval(r)},[B]);let Vn=()=>{Ct(!0),Ye(null),B()};
G(()=>{if(!I||Re.current==="unsupported"||Re.current==="disabled")return;let r=vn(I.slots,ye).filter(f=>Ne.current.get(f.
key)!==pt(f));if(r.length===0)return;let u=!1;return(async()=>{let{summaries:f,support:b}=await xn(r,N=>t.current.get(N));
if(!(u||!W.current)&&(Re.current=b,ce(b),b==="available")){for(let N of r)f[N.key]&&Ne.current.set(N.key,pt(N));Z(N=>({...N,
...f}))}})(),()=>{u=!0}},[I]),G(()=>{if(!I||!It.current)return;let r=!1;return(async()=>{try{let u=await t.current.get("\
/api/apps/crew-manager/stalls");if(r||!W.current)return;let f={};for(let N of u?.stalls??[])N?.key&&(f[N.key]=N);Ie(f);let b={};
for(let N of u?.error_loops??[])N?.key&&(b[N.key]=N);Nt(b)}catch{It.current=!1,W.current&&(Ie({}),Nt({}))}})(),()=>{r=!0}},
[I]),G(()=>{let r=!1;return(async()=>{try{let u=await t.current.get("/api/apps/crew-manager/initiatives");if(r||!W.current)
return;_t((u?.initiatives??[]).filter(f=>f?.name))}catch{}})(),()=>{r=!0}},[]),G(()=>{if(Be.unsupported)return;let r=p.trim();
if(!$t(r)){Ve(b=>b.hits.length?{...b,hits:[]}:b);return}let u=!1,f=setTimeout(()=>{(async()=>{try{let b=await t.current.
get(Dt(r,is,St));if(u||!W.current)return;Ve(qt(b))}catch{W.current&&Ve({unsupported:!0,hits:[],scope:"workspace"})}})()},
300);return()=>{u=!0,clearTimeout(f)}},[p,Be.unsupported,St]);let Bt=z(()=>an(pn(I??{slots:[],approvals:[],agents:[],workflows:[],
crons:[],artifacts:[],loops:[]},F,v,de,Rt,Y),ee),[I,v,de,Rt,ee,Y]),qe=z(()=>cn(Bt,w,H),[Bt,w,H]),K=z(()=>qe.items.filter(
r=>dn(r)),[qe]),Je=z(()=>dt(K),[K]),Kt=z(()=>{let r={};for(let u of K){if(u.state!=="done"||!u.sessionKey)continue;let f=r[u.
sessionKey];f?f.push(u.title):r[u.sessionKey]=[u.title]}return r},[K]),J=z(()=>K.find(r=>r.id===x)??null,[K,x]),L=z(()=>{
let r=gn(K,p);return c==="pr"||c==="goal"||p.trim()||i==="all"?r:r.filter(u=>u.state===i)},[i,K,p,c]),Yn=z(()=>{let r={all:0,
failing:0,running:0,merged:0};for(let u of ut(L,"pr")){if(!u.changeRef)continue;r.all++;let f=at(u.changeRef,y[u.changeRef.
url??""]);f!=="other"&&r[f]++}return r},[L,y]);G(()=>{if(c!=="pr")return;let r=new Set;for(let f of L)for(let b of f.references)
b.kind==="change"&&b.url&&/github\.com\/.+\/pull\//.test(b.url)&&r.add(b.url);let u=!1;for(let f of r)y[f]||t.current.get(
`/pr-checks?url=${encodeURIComponent(f)}`).then(b=>{!u&&W.current&&s(N=>({...N,[f]:b}))}).catch(()=>{});return()=>{u=!0}},
[c,L,y]),G(()=>n(Je["needs-you"]),[Je,n]),G(()=>{x&&!K.some(r=>r.id===x)&&k(null)},[K,x]),G(()=>{let r=u=>{(u.metaKey||u.
ctrlKey)&&u.key.toLocaleLowerCase("en-US")==="k"&&(u.preventDefault(),document.querySelector('[data-crew-manager-search=\
"true"]')?.focus())};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[]);let Xe=I?.
slots.find(r=>r.key===ye),Qn=!!(Xe||jn);G(()=>{!I||Xe||Qe.current||(Qe.current=!0,e.post("/api/chat/slots",{name:ye,title:"\
Conductor"}).then(()=>{W.current&&(Hn(!0),B())}).catch(r=>{W.current&&(Qe.current=!1,te(r instanceof Error?`Conductor se\
ssion could not be created: ${r.message}`:"Conductor session could not be created"))}))},[e,Xe,B,I]);let Lt=z(()=>tn(I?.
approvals??[],We,r=>K.find(u=>u.sessionKey===r)?.title??I?.slots?.find(u=>u.key===r)?.title??r),[K,I,We]),fe=J&&!J.permissionId?
J:null,Ze=z(()=>c==="goal"?kn(L,ge,Y):[],[c,L,ge,Y]),Q=z(()=>{if(!Te)return null;for(let r of Ze){let u=r.blocks.find(f=>f.
key===Te);if(u&&u.items.length>0)return u}return null},[Te,Ze]),M=Q?bn(Q.items):null,[Jn,Et]=S(!1),Xn=z(()=>{if(c!=="goa\
l")return[];let r=wn(I?.slots??[],ge),u=hn(K,ge),f=new Set,b=[];for(let N of[...u,...r])f.has(N.name.toLowerCase())||(f.
add(N.name.toLowerCase()),b.push(N));return b.sort((N,A)=>A.sessions-N.sessions)},[c,I,K,ge]),Zn=P(async(r,u=[])=>{if(r.
trim()){Et(!0);try{let f=await t.current.post("/api/apps/crew-manager/initiatives",{name:r.trim(),aliases:u});W.current&&
f?.initiatives&&_t(f.initiatives.filter(b=>b?.name))}catch{}finally{W.current&&Et(!1)}}},[]),ne=P(async(r,u)=>{if(!$){ue(
r),te(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(r)}/${u?"approve":"reject"}`,{}),B()}catch(f){
te(f instanceof Error?`Could not answer that request: ${f.message}`:"Could not answer that request"),B()}finally{W.current&&
ue(null)}}},[B,$]),eo=P(r=>{R(u=>{let f=Object.fromEntries(Object.entries(u).filter(([,b])=>b>Date.now()));return f[r]=Date.
now()+ln,le(ft,f),f}),k(null)},[]),to=P((r,u)=>{V(f=>{let b={...f,[r]:u};return le(Nn,b),b}),k(null)},[]),no=P(()=>{R({}),
le(ft,{})},[]),oo=P(r=>{pe(u=>{let f={merged:u.merged.filter(b=>!r.includes(b)),split:[...new Set([...u.split,...r])]};return le(
mt,f),f})},[]),so=P(r=>{pe(u=>{let f={merged:[...new Set([...u.merged,r])],split:u.split.filter(b=>b!==r)};return le(mt,
f),f})},[]),ro=P(()=>{Gn(r=>(le(In,!r),!r))},[]),me=P(async r=>{if(!D){$e(r),te(null);try{await t.current.post(r,{}),B()}catch(u){
te(u instanceof Error?`Could not re-run it: ${u.message}`:"Could not re-run it"),B()}finally{W.current&&$e(null)}}},[B,D]),
De=P(async r=>{if(!j){Me(r),te(null);try{await t.current.del(r),C("Stopped the monitor loop. Re-arming it is done from t\
he session itself."),B()}catch(u){let f=u instanceof Error?u.message:"";/404|not found/i.test(f)?C("That loop had alread\
y stopped."):te(f?`Could not stop it: ${f}`:"Could not stop it"),B()}finally{W.current&&Me(null)}}},[B,j]),oe=P(async r=>{
if(Q&&M?.sessionKey){let f=M.sessionKey,b=Q.items.map(A=>`- ${A.references.find(Ge=>Ge.kind==="session")?.label??A.sessionKey}\
: ${_e[A.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(f)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${Q.items[0].title}", which spans sessions:`,b,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:f}).catch(A=>{if(!(A instanceof
SyntaxError))throw A}),!W.current)return;Ce(A=>({...A,[M.id]:Date.now()})),Ae(A=>A.includes(f)?A:[...A,f]);let N=M.references.
find(A=>A.kind==="session")?.label??M.title;C(M.moving||M.state==="running"?`Sent to ${N} \u2014 the active session on this g\
oal`:`Sent to ${N} \u2014 resuming the last session on this goal`),ze(null),B();return}let u=J&&!J.permissionId?J:null;if(u?.
sessionKey){let f=u.sessionKey;if(await t.current.post("/api/chat",{message:r,slot:f}).catch(b=>{if(!(b instanceof SyntaxError))
throw b}),!W.current)return;Ce(b=>({...b,[u.id]:Date.now()})),Ae(b=>b.includes(f)?b:[...b,f]),C(`Sent new instructions t\
o ${u.title}`),k(null),B();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(ye)}/context`,{content:ks(J,
K),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:ye}).catch(f=>{if(!(f instanceof
SyntaxError))throw f})},[J,Q,M,K,B]),ao=z(()=>Mt(Be.hits,L),[Be.hits,L]),et={"needs-you":L.filter(r=>r.state==="needs-yo\
u"),running:L.filter(r=>r.state==="running"),done:L.filter(r=>r.state==="done")},io=P((r,u)=>{qn(f=>{let b={...f,[r]:u};
return le(Cn,b),b})},[]),lo=P(r=>{ze(u=>u===r?null:r),k(null),C(null)},[]),se=r=>o(`/chat?sid=${encodeURIComponent(r)}`),
we=r=>{k(u=>u===r.id?null:r.id),ze(null),C(null)};return g("div",{className:"ow-root","data-crew-manager-shell":"quiet-s\
plit",children:[a("style",{children:_n}),a(ts,{title:"Crew Manager",subtitle:"See what needs your input, what is still r\
unning, and what finished recently."}),a("div",{className:"ow-body",children:g("div",{className:"ow-layout",children:[a(
"nav",{className:"ow-rail","aria-label":"Crew Manager",children:a("div",{className:"ow-rail-inner",children:g("div",{className:"\
ow-groupby",role:"group","aria-label":"Group by",children:[a("span",{className:"ow-groupby-label",children:"Group by"}),
["session","pr","goal"].map(r=>a(E,{onClick:()=>d(r),"aria-pressed":c===r,"data-selected":c===r,className:"ow-groupby-op\
t",children:r==="session"?"Session":r==="pr"?"PR":"Goal"},r))]})})}),a("main",{className:"ow-work",children:g("div",{className:"\
ow-work-inner",children:[g("div",{className:"ow-toolbar",children:[a(ns,{"data-crew-manager-search":"true",value:p,onChange:r=>h(
r.target.value),placeholder:"Search work and projects\u2026 \u2318K","aria-label":"Search work",className:"ow-search"}),
c==="pr"?a("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(Wn).map(r=>g(
E,{onClick:()=>_(r),"aria-pressed":m===r,"data-selected":m===r,className:"ow-filter",children:[Wn[r],a("span",{className:"\
ow-count",children:Yn[r]})]},r))}):c==="goal"?null:a("div",{className:"ow-filters",role:"group","aria-label":"Filter by \
state",children:Object.keys(wt).map(r=>g(E,{onClick:()=>l(r),"aria-pressed":i===r,"data-selected":i===r,className:"ow-fi\
lter",children:[wt[r],a("span",{className:"ow-count",children:Je[r]})]},r))})]}),Un?a(Rn,{rows:7}):Wt&&!I?a(gt,{icon:a(En,
{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:Wt.message,action:a(E,{onClick:Vn,children:"\
Try again"})}):L.length===0?a(gt,{icon:a(Vo,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter \
or search for a session, project, PR, or output."}):i==="all"||p.trim()?c==="pr"?L.some(r=>r.references.some(u=>u.kind===
"change"||u.kind==="issue"))?a(ve,{title:"Work by PR",subtitle:"Every pull request your work touches",items:L,prChecks:y,
prFilter:m,selectedId:x,onSelect:we,onOpenSession:se,onAnswerPermission:(r,u)=>{ne(r,u)},permissionBusy:$!==null,onRetry:r=>{
me(r)},retryBusy:D!==null,onPickStep:r=>{oe(r)},groupBy:c,emptyLabel:"No matching work"}):a(gt,{icon:a(Mn,{className:"ow\
-icon"}),title:"No work is linked to a PR right now",subtitle:"Work links to a PR when a session mentions its URL (a Git\
Hub/GitLab pull, merge request, or issue). None of the current sessions do, so there is nothing to group by PR yet.",action:a(
E,{onClick:()=>d("session"),children:"Back to Session view"})}):c==="goal"?a(ve,{title:"Work by goal",subtitle:"The same\
 job across sessions, merged into one card",items:L,selectedId:x,onSelect:we,onOpenSession:se,onAnswerPermission:(r,u)=>{
ne(r,u)},permissionBusy:$!==null,onRetry:r=>{me(r)},retryBusy:D!==null,onPickStep:r=>{oe(r)},groupBy:c,goalVerdicts:Y,onSplitGoal:oo,
onMergeGoal:so,initiativeBlocks:Ze,collapsedInitiatives:zn,onToggleInitiative:io,selectedGoalKey:Te,onSelectGoal:lo,footer:a(
cs,{candidates:Xn,prominent:ge.length===0,busy:Jn,onAdd:(r,u)=>{Zn(r,u)}}),emptyLabel:"No matching work"}):g(Oe,{children:[
a(ve,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:et["needs-you"],doneBySession:Kt,selectedId:x,
onSelect:we,onSnooze:eo,onHandled:to,footer:qe.snoozedCount>0?g("button",{type:"button",className:"ow-aside-note",onClick:no,
children:[qe.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:se,onAnswerPermission:(r,u)=>{
ne(r,u)},permissionBusy:$!==null,onRetry:r=>{me(r)},retryBusy:D!==null,onStop:r=>{De(r)},stopBusy:j!==null,onPickStep:r=>{
oe(r)},groupBy:c,emptyLabel:"Nothing needs your input right now."}),a(ve,{title:"In progress",subtitle:"Being worked on \
right now",items:et.running,doneBySession:Kt,selectedId:x,onSelect:we,onOpenSession:se,onAnswerPermission:(r,u)=>{ne(r,u)},
permissionBusy:$!==null,onRetry:r=>{me(r)},retryBusy:D!==null,onStop:r=>{De(r)},stopBusy:j!==null,onPickStep:r=>{oe(r)},
groupBy:c,emptyLabel:"Nothing is in progress right now."}),a(ve,{title:"Done recently",subtitle:"Finished in the last fe\
w days",items:et.done,selectedId:x,onSelect:we,collapsed:Dn,onToggleCollapsed:ro,onOpenSession:se,onAnswerPermission:(r,u)=>{
ne(r,u)},permissionBusy:$!==null,onRetry:r=>{me(r)},retryBusy:D!==null,onStop:r=>{De(r)},stopBusy:j!==null,onPickStep:r=>{
oe(r)},groupBy:c,emptyLabel:"No recent completed work."})]}):a(ve,{title:wt[i],items:L,selectedId:x,onSelect:we,onOpenSession:se,
onAnswerPermission:(r,u)=>{ne(r,u)},permissionBusy:$!==null,onRetry:r=>{me(r)},retryBusy:D!==null,onStop:r=>{De(r)},stopBusy:j!==
null,onPickStep:r=>{oe(r)},groupBy:c,emptyLabel:"No matching work"}),p.trim()&&a(ls,{hits:ao,now:Date.now(),onOpenSession:se,
scope:Be.scope,onScopeChange:Fn})]})}),g("aside",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"\
ow-conductor-header",children:g("div",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!fe&&a("s\
pan",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:Qn?
g("div",{className:"ow-chat-panel",children:[Lt.length>0&&a("div",{className:"ow-permissions",role:"alert",children:Lt.map(
r=>a(Tn,{tool:r.tool,purpose:r.purpose,where:r.sessionLabel,busy:$!==null,onAnswer:u=>{ne(r.id,u)}},r.id))}),O&&g("div",
{className:"ow-conductor-receipt",role:"status",children:[a(On,{className:"ow-icon"}),O]}),At&&a("div",{className:"ow-ch\
at-error",role:"alert",children:At}),a("div",{className:"ow-embed",children:a(Zo,{slotKey:ye,frameless:!0,startAtBottom:!0,
placeholder:Q?"Instruction for this goal\u2026":fe?.sessionKey?"New instructions for this session\u2026":"Ask across you\
r work\u2026",onSend:oe})}),Q&&M?g("div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-bo\
dy ow-quote-goal",children:[g("div",{className:"ow-quote-line",children:[a("span",{className:"ow-eyebrow",children:"Inst\
ructing goal"}),a("span",{className:"ow-quote-title",title:Q.items[0].title,children:Q.items[0].title})]}),g("span",{className:"\
ow-quote-route ow-truncate",children:["\u2192 ",M.references.find(r=>r.kind==="session")?.label??M.title,M.moving||M.state===
"running"?" (active)":" (will resume)"]})]}),a(E,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{
ze(null),C(null)},children:"Clear"})]}):fe&&g("div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"\
ow-quote-body",children:[a("span",{className:"ow-eyebrow",children:fe.sessionKey?"Instructing":"Quoted"}),a("span",{className:"\
ow-quote-title",title:fe.title,children:fe.title})]}),a(E,{className:"ow-quote-clear","aria-label":"Remove the quoted wo\
rk item",onClick:()=>{k(null),C(null)},children:"Clear"})]})]}):a("div",{className:"ow-chat-loading",children:a(Rn,{rows:4})})})]})]})})]})}export{ys as default};
