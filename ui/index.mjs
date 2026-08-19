import{Fragment as Wo,useCallback as O,useEffect as F,useMemo as z,useRef as ie,useState as N}from"react";import{AlertTriangle as Fo,
Bot as Yn,Check as jo,ChevronRight as le,Check as Uo,Clock as Vo,Package as Jn,ExternalLink as $t,MessageSquare as Lt,Shield as Xn,
Waves as Ho,Search as Qn,Tag as Zn,Users as st,Zap as es}from"lucide-react";import{useAppApi as ts,useNavigate as os,useNavBadge as ns,
ChatEmbed as ss}from"@kirocrew/app-sdk";import{Badge as G,Btn as T,ContentSkeleton as Ao,EmptyState as Bo,Input as rs,PageHeader as as}from"@kirocrew/app-sdk/ui";function Ae(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),o=t%
60;return o===0?`${n} hour${n===1?"":"s"}`:`${n}h ${o}m`}function ro(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function vt(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function ao(e,t,n){let o=new Set(t.filter(Boolean));if(o.size===0)return[];
let i=new Set,l=[];for(let d of e){let c=d.slot;!c||!o.has(c)||!d.id||i.has(d.id)||(i.add(d.id),l.push({id:d.id,sessionKey:c,
sessionLabel:n(c),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return l}var Ht={"needs-you":0,running:1,done:2};function P(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function bn(e,t){
if(e.paused)return"";let n=P(e.next_run_ts);if(!n)return"";let o=Math.round((n-t)/1e3);return o<=0?"":Ae(o)}var Yt=72;function fe(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let i=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(i.length<=Yt)return i;let l=i.slice(0,Yt),d=l.lastIndexOf(" ");return`${(d>24?l.slice(0,d):l).trim()}\u2026`}
function me(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var yn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
vn=/^\((?:code|diff|widget|image)\)$/,kn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
xn=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,_n=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
Sn=/[?？]["'”’)\]]*$/;function io(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||vn.test(t)||yn.test(
t)?null:t}function kt(e){if(!e.waiting_for_input)return null;let t=io(e);return!t||kn.test(t)||xn.test(t)?null:_n.test(t)||
Sn.test(t)?t:null}function Jt(e){return e.pending_approval||kt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":me(e)?"needs-you":"done"}function Nn(e,t){if(e.pending_approval)return t("approval_waiting");let n=kt(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):me(e)?t("linked_change_issue"):io(e)??t("recent_w\
ork_ready"))}function wt(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function Rn(e){return e.pending_approval?"review-approval":kt(e)?"reply":"open"}function In(e,t){
let n=(e.source_links??[]).map(o=>({kind:o.kind==="issue"?"issue":"change",id:o.url,label:o.kind==="issue"?`issue #${o.number}`:
`${o.provider} #${o.number}`,url:o.url,sessionKey:e.key,status:ro(o)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:Nn(e,t),state:Jt(e),moving:Jt(e)==="running"||void 0,issue:me(e),updatedAt:P(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:wt(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:me(e)||void 0,action:Rn(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...n]}}function xt(e,t){e.references.
some(n=>n.kind===t.kind&&n.id===t.id)||e.references.push(t)}function lo(e){return(e.source||"").toLowerCase()==="subagen\
t"}function Cn(e,t,n){let o=lo(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,P(t.ts)),e.summary=n(o?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=o?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,xt(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),
sessionKey:t.slot||e.sessionKey})}function Wn(e,t,n){e.updatedAt=Math.max(e.updatedAt,P(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),xt(e,{kind:"agent",id:t.id,
label:t.agent||n("agent"),sessionKey:t.parent||e.sessionKey})}function An(e,t,n){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow\
_failed",{name:t.name})),xt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function Bn(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function Kn(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function $n(e){let t=null,n=-1;for(let o of e){let i=o.last_touched_turn??0;i>n&&(n=i,t=o)}return t}function Ln(e,t){let n=e.next_steps?.find(i=>i.what?.trim())?.what?.trim();if(n)return n;let o=[...e.progress??[]].reverse().
find(i=>i.trim());return o?o.trim():e.initial_intent?.trim()||t("work_in_progress")}var Mn=3;function Pn(e,t,n){if(!t?.enabled)
return[];let o=t.intents??[];if(o.length===0)return[];let i=(e.source_links??[]).map(a=>({kind:a.kind==="issue"?"issue":
"change",id:a.url,label:a.kind==="issue"?`issue #${a.number}`:`${a.provider} #${a.number}`,url:a.url,sessionKey:e.key,status:ro(
a)})),l=[],d=$n(o),w=!!(e.running||e.subagents_running||e.orchestrating)?[]:o.filter(a=>a.state==="in-progress");w.forEach(
a=>{let g=o.indexOf(a),h=(a.next_steps??[]).filter(W=>W.what?.trim());l.push({id:`unattended:${e.key}:${g}`,title:fe(a.title,
e.title||n("untitled_work")),summary:h[0]?.what?.trim()||n("no_next_step"),state:"needs-you",issue:me(e),updatedAt:P(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:wt(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:me(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.
key},...i],nextSteps:h,progress:(a.progress??[]).filter(W=>W.trim()),stale:!!t.stale,lastTouchedTurn:a.last_touched_turn??
0})}),o.forEach((a,g)=>{if(w.includes(a))return;let h=Bn(a,e);if(!h)return;let W=(a.next_steps??[]).filter(k=>k.what?.trim());
l.push({id:`intent:${e.key}:${g}`,title:fe(a.title,e.title||n("untitled_work")),summary:Ln(a,n),state:h,issue:!1,updatedAt:P(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:wt(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:me(
e)||void 0,unverified:a.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untit\
led_work"),sessionKey:e.key},...i],nextSteps:W,progress:(a.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:a.
last_touched_turn??0,moving:Kn(a,e,d)||void 0})});let x=l.filter(a=>a.state==="needs-you"),v=l.filter(a=>a.state!=="need\
s-you").sort((a,g)=>(g.lastTouchedTurn??0)-(a.lastTouchedTurn??0));return[...x,...v].slice(0,Math.max(Mn,x.length))}var co=new Set(
["crew-manager-conductor","overwatch-conductor"]),En={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Tn=3;function On(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var et=5;function uo(e,t,n=Date.now()){let o=_t(e),i=wo(
e.filter(d=>d.state==="needs-you"),n),l=[`Fleet: ${o["needs-you"]} waiting on the user, ${o.running} in progress, ${o.done}\
 finished recently.`];return i.length===0?(l.push("Nothing is waiting on the user."),l):(l.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(et,i.length)}):`),i.slice(0,et).forEach((d,c)=>{let w=Be(ae(d,n),t),x=d.sessionKey?
` [session ${d.sessionKey}]`:"";l.push(`${c+1}. ${d.title} \u2014 ${d.summary} (${w})${x}`)}),i.length>et&&l.push(`\u2026and ${i.
length-et} more waiting.`),l)}var ht=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),Xt=.6,Qt=2;function bt(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!ht.has(t)))]}function tt(e,t){let n=bt(e),o=bt(t);if(n.length<Qt||o.length<Qt)return 0;
let i=n.length<=o.length?n:o,l=new Set(n.length<=o.length?o:n);return i.filter(c=>l.has(c)).length/i.length}function Zt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function eo(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function to(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function Ve(e,t){
if(Zt(e).find(i=>Zt(t).includes(i)))return"same_change";if(eo(e).find(i=>eo(t).includes(i)))return"same_artifact";if(tt(
e.title,t.title)>=Xt)return"same_topic";for(let i of to(e))for(let l of to(t))if(tt(i,l)>=Xt)return"same_step";return null}
var ot={merged:[],split:[]};function oo(e){return`${e.sessionKey??e.id}|${bt(e.title).join(" ")}`}function we(e,t){return[
oo(e),oo(t)].sort().join("")}function zn(e,t=ot){let n=e.filter(o=>o.state!=="done"&&o.sessionKey).sort((o,i)=>(o.updatedAt||
0)-(i.updatedAt||0));for(let o=1;o<n.length;o+=1){let i=n[o];for(let l=0;l<o;l+=1){let d=n[l];if(d.sessionKey===i.sessionKey||
t.split.includes(we(i,d)))continue;let c=Ve(i,d);if(c){i.duplicateOf={sessionKey:d.sessionKey,title:d.title,because:c};break}}}
Dn(n,t)}var mt=3,no=["same_change","same_artifact","same_topic","same_step"];function Dn(e,t){for(let n of e){let o=[],i=new Set;
for(let l of e){let d=l.sessionKey;if(d===n.sessionKey||i.has(d)||t.split.includes(we(n,l)))continue;let c=Ve(n,l);c&&(i.
add(d),o.push({sessionKey:d,title:l.title,because:c}))}o.length!==0&&(o.sort((l,d)=>no.indexOf(l.because)-no.indexOf(d.because)),
n.relatedSessions=o.slice(0,mt),o.length>mt&&(n.relatedMore=o.length-mt))}}var qn=3e4;function po(e,t,n=Date.now()){return Object.
keys(t).length===0?e:e.map(o=>{let i=t[o.id];return!i||n-i>qn||o.state==="running"?o:{...o,state:"running",moving:!0,instructed:!0}})}
function ae(e,t=Date.now()){let n=[],o=(l,d,c=1)=>{n.push({signal:l,weight:En[l]*c,values:d})};e.approvalKind==="subagen\
t"?o("subagent_gate"):e.approvalKind==="tool"&&o("approval_owed"),e.action==="reply"&&o("input_requested"),e.unverified&&
o("unverified_completion"),e.loopRepeats&&o("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&o("run_failed"),e.
stalledFor&&o("stalled",{duration:Ae(e.stalledFor)}),e.changeBlocked&&o("change_blocked"),e.unattendedGoals&&o("nobody_o\
n_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&o("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,
3));let i=On(e,t);return i>0&&o("waiting_a_while",{hours:String(i)},Math.min(i,Tn)),n.sort((l,d)=>d.weight-l.weight),{score:n.
reduce((l,d)=>l+d.weight,0),signals:n}}var Gn={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",
unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"\
followup"};function nt(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let n of ae(e,t).signals){let o=Gn[n.signal];
if(o)return o}return null}var go=14400*1e3;function fo(e,t,n,o=Date.now()){let i=0,l=[];for(let d of e){if(d.state!=="ne\
eds-you"){l.push(d);continue}let c=t[d.id];if(c&&c>o){i+=1;continue}let w=n[d.id];if(w!==void 0&&d.updatedAt<=w){l.push(
{...d,state:"done",issue:!1});continue}l.push(d)}return{items:l,snoozedCount:i}}var Fn=4320*60*1e3;function mo(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=Fn}var jn={"needs-you":1,running:-1,done:-1};function Un(e,t,n){
let o=e.updatedAt>0,i=t.updatedAt>0;return!o&&!i?0:o?i?(e.updatedAt-t.updatedAt)*n:-1:1}function Be(e,t){let n=e.signals.
slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(i=>t(`rank_${i.signal}`,i.values)).join(t("rank_join"))}
function wo(e,t=Date.now()){let n=new Map(e.map(o=>[o.id,ae(o,t)]));return[...e].sort((o,i)=>{let l=Ht[o.state]-Ht[i.state];
if(l!==0)return l;if(o.state==="needs-you"){let d=(n.get(i.id)?.score??0)-(n.get(o.id)?.score??0);if(d!==0)return d}else if(o.
issue!==i.issue)return o.issue?-1:1;return Un(o,i,jn[o.state])})}function ho(e,t,n={},o={},i={},l=ot,d=Date.now()){let c=new Map,
w=new Map;for(let a of e.slots){if(!a.key||co.has(a.key)||a.memory_mode==="incognito")continue;let g=Pn(a,n[a.key],t);if(g.
length>0){for(let k of g)c.set(k.id,k);let W=g.find(k=>k.state==="needs-you")??g[0];w.set(a.key,W);continue}let h=In(a,t);
c.set(h.id,h),w.set(a.key,h)}for(let[a,g]of Object.entries(o)){let h=w.get(a);h&&(h.state="needs-you",h.issue=!0,h.stalledFor=
g.silent_secs,h.summary=g.reason?t("stalled_because",{reason:g.reason,duration:Ae(g.silent_secs)}):t("stalled_for",{duration:Ae(
g.silent_secs)}),h.action="open")}for(let[a,g]of Object.entries(i)){let h=w.get(a);h&&(h.state="needs-you",h.issue=!0,h.
loopRepeats=g.repeats,h.summary=t("error_loop",{tool:g.tool,repeats:String(g.repeats)}),h.action="open")}for(let a of e.
approvals){let g=a.slot?w.get(a.slot):void 0;if(g){Cn(g,a,t);continue}c.set(`approval:${a.id}`,{id:`approval:${a.id}`,title:fe(
a.tool||a.source,t("approval_needed")),summary:a.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:P(
a.ts),provenance:t("approval"),action:"review-approval",approvalKind:lo(a)?"subagent":"tool",permissionId:a.id,permissionTool:a.
tool||a.source,permissionPurpose:a.tool_purpose,references:[{kind:"approval",id:a.id,label:a.tool||a.source||t("approval")}]})}
for(let a of e.agents){let g=a.parent?w.get(a.parent):void 0;if(g){Wn(g,a,t);continue}let h=!!(a.done&&(a.error||a.outcome===
"failed"));a.parent&&!h||c.set(`agent:${a.id}`,{id:`agent:${a.id}`,title:fe(a.task||a.agent,t("agent_work")),summary:h?a.
error?.trim()||t("agent_failed",{task:a.task}):a.done?t("agent_done"):t("work_in_progress"),state:h?"needs-you":a.done?"\
done":"running",issue:h,runFailed:h||void 0,retryPath:h&&!a.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(a.
id)}/retry`:void 0,updatedAt:P(a.started),provenance:a.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:a.
id,label:a.agent||t("agent")}]})}for(let a of e.workflows){let g=a.session_key?w.get(a.session_key):void 0;if(g){An(g,a,
t);continue}let h=a.status==="failed";c.set(`workflow:${a.run_id}`,{id:`workflow:${a.run_id}`,title:fe(a.name,a.run_id),
summary:h?t("workflow_failed_generic"):a.status==="running"?t("workflow_running"):t("workflow_finished"),state:h?"needs-\
you":a.status==="running"?"running":"done",issue:h,runFailed:h||void 0,retryPath:h?`/api/workflows/runs/${encodeURIComponent(
a.run_id)}/rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:a.run_id,
label:a.name||a.run_id}]})}for(let a of e.crons){if(!a.is_running&&a.last_status!=="error")continue;let g=a.last_status===
"error",h=bn(a,d),W=t(g?"monitor_failed":"monitor_running");c.set(`monitor:${a.id}`,{id:`monitor:${a.id}`,title:a.name,summary:h?
`${W} ${t("monitor_next_check",{duration:h})}`:W,state:g?"needs-you":"running",issue:g,runFailed:g||void 0,retryPath:g?`\
/api/crons/${encodeURIComponent(a.id)}/run`:void 0,updatedAt:P(a.running_since||a.last_run_ts||a.created_ts),provenance:t(
"monitor"),action:g?"discuss":void 0,references:[{kind:"monitor",id:a.id,label:a.name}]})}for(let a of e.loops||[]){if(!a.
active)continue;let g=String(a.id||"");if(!g)continue;let h=Math.max(0,Number(a.cycle_count)||0),W=Math.max(0,Number(a.max_cycles)||
0),k=a.slot_key&&w.has(a.slot_key)?a.slot_key:void 0;c.set(`loop:${g}`,{id:`loop:${g}`,title:fe(a.message||"",t("loop")),
summary:W?t("loop_watching_capped",{cycles:String(h),cap:String(W)}):t("loop_watching",{cycles:String(h)}),state:"runnin\
g",issue:!1,updatedAt:P(a.last_fire_ts||a.created_ts),sessionKey:k,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(
g)}`,action:k?"open":void 0,references:[{kind:"monitor",id:g,label:t("loop"),sessionKey:k},...k?[{kind:"session",id:k,label:w.
get(k)?.title||k,sessionKey:k}]:[]]})}let x=[...e.artifacts].sort((a,g)=>P(g.updated_at)-P(a.updated_at)).slice(0,8);for(let a of x){
let g=a.session_key&&w.has(a.session_key)?a.session_key:void 0;c.set(`artifact:${a.slug}`,{id:`artifact:${a.slug}`,title:fe(
a.name,t("artifact")),summary:a.description||t("artifact_ready",{kind:a.kind}),state:"done",issue:!1,updatedAt:P(a.updated_at||
a.created_at),sessionKey:g,provenance:a.session_title||a.source||t("artifact"),action:g?"open":void 0,references:[{kind:"\
artifact",id:a.slug,label:a.name,sessionKey:g},...g?[{kind:"session",id:g,label:a.session_title||g,sessionKey:g}]:[]]})}
let v=[...c.values()];return zn(v,l),wo(v)}function _t(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-y\
ou").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function bo(e){let t=[],n=new Map;for(let o of e){let i=o.sessionKey;if(!i)continue;let l=n.get(i);if(l){l.count+=1;continue}
let d=o.references.find(w=>w.kind==="session")?.label??o.provenance,c={sessionKey:i,label:d,leading:o,count:1};n.set(i,c),
t.push(c)}return t}function St(e,t,n=ot){if(t==="pr")return Vn(e);if(t==="goal")return yt(e,n);let o=[],i=new Map;for(let l of e){
let d=l.sessionKey;if(!d){o.push({key:l.id,items:[l],header:null,sessionKey:null,changeRef:null});continue}let c=i.get(d);
if(c){c.items.push(l);continue}let w={key:d,items:[l],header:"session",sessionKey:l.sessionKey??null,changeRef:null};i.set(
d,w),o.push(w)}return o}function Vn(e){let t=[],n=new Map;for(let o of e){let i=o.references.filter(l=>l.kind==="change"||
l.kind==="issue");for(let l of i){let d=`${l.kind}:${l.id}`,c=n.get(d);if(c){c.items.push(o);continue}let w={key:d,items:[
o],header:"pr",sessionKey:null,changeRef:l};n.set(d,w),t.push(w)}}return t}function yt(e,t){let n=e.map((c,w)=>w),o=c=>{
for(;n[c]!==c;)n[c]=n[n[c]],c=n[c];return c},i=(c,w)=>{n[o(w)]=o(c)};for(let c=0;c<e.length;c+=1)for(let w=c+1;w<e.length;w+=
1){let x=e[c],v=e[w];if(!x.sessionKey||!v.sessionKey||x.sessionKey===v.sessionKey)continue;let a=we(x,v);t.split.includes(
a)||(t.merged.includes(a)||Ve(x,v))&&i(c,w)}let l=[],d=new Map;for(let c=0;c<e.length;c+=1){let w=o(c),x=d.get(w);if(x){
x.items.push(e[c]),x.header="goal";continue}let v={key:`goal:${e[c].id}`,items:[e[c]],header:null,sessionKey:null,changeRef:null};
d.set(w,v),l.push(v)}return l}function yo(e,t){let n=e.references.find(o=>o.kind==="session")?.label??"";for(let o of[e.
title,n,e.provenance]){let i=o.toLowerCase();for(let l of t)if(l.aliases.some(d=>d&&i.includes(d.toLowerCase())))return l.
name}return null}function vo(e,t){let n=t.flatMap(l=>l.aliases.map(d=>d.toLowerCase())),o=new Set(["workspace","workspac\
es","home","src","tmp","documents","desktop"]),i=new Map;for(let l of e){if(!l.key||co.has(l.key)||l.memory_mode==="inco\
gnito")continue;let d=l.project;if(!d)continue;let c=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!c||o.has(
c.toLowerCase())||n.some(w=>c.toLowerCase().includes(w)||w.includes(c.toLowerCase()))||i.set(c,(i.get(c)??0)+1)}return[...i.
entries()].map(([l,d])=>({name:l,sessions:d})).sort((l,d)=>d.sessions-l.sessions)}function ko(e,t){let n=new Map;for(let l of e){
if(!l.sessionKey||yo(l,t)!==null)continue;let d=l.references.find(c=>c.kind==="session")?.label??"";for(let c of[l.title,
d]){let w=c.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);for(let x of[3,2])for(let v=0;v+
x<=w.length;v+=1){let a=w.slice(v,v+x);if(ht.has(a[0])||ht.has(a[x-1])||a[0].length<3||a[x-1].length<3)continue;let g=a.
join(" ");n.has(g)||n.set(g,new Set),n.get(g).add(l.sessionKey)}}}let o=[...n.entries()].map(([l,d])=>({phrase:l,sessions:d.
size})).filter(l=>l.sessions>=2);return o.filter(l=>!o.some(d=>d.phrase!==l.phrase&&d.phrase.includes(l.phrase)&&d.sessions>=
l.sessions)).sort((l,d)=>d.sessions-l.sessions||d.phrase.length-l.phrase.length).map(l=>({name:l.phrase.replace(/\p{L}+/gu,
d=>d[0].toUpperCase()+d.slice(1)),sessions:l.sessions}))}function so(e){return e.some(t=>t.state==="needs-you")?"needs-y\
ou":e.some(t=>t.state==="running")?"running":"done"}function xo(e,t=Date.now()){return e.issue?"crit":e.state==="needs-y\
ou"?nt(e,t)==="followup"?"idle":"warn":"good"}function He(e){let t=new Set,n=new Set,o=new Set,i=0,l=0,d=0,c=0,w=0;for(let x of e){x.sessionKey&&t.add(x.sessionKey);for(let v of x.
references)v.kind==="change"?n.add(v.id):v.kind==="issue"&&o.add(v.id);x.id.startsWith("workflow:")?i+=1:x.id.startsWith(
"monitor:")?l+=1:x.id.startsWith("agent:")&&(d+=1),x.state==="needs-you"&&(c+=1),x.updatedAt>w&&(w=x.updatedAt)}return{sessions:t.
size,prs:n.size,issues:o.size,loops:i,crons:l,agents:d,needsYou:c,lastActivityAt:w}}function _o(e){let t=e.find(o=>o.moving);
if(t)return t;let n=e.find(o=>o.state==="running");return n||[...e].sort((o,i)=>(i.updatedAt||0)-(o.updatedAt||0))[0]}function Hn(e){
let t=[],n=new Set;for(let o of e){let i=o.sessionKey;!i||n.has(i)||(n.add(i),t.push(o.references.find(l=>l.kind==="sess\
ion")?.label??o.provenance))}return t}function So(e,t,n=ot){let o=new Map,i=[],l=new Map;for(let v of e){let a=yo(v,t);if(l.
set(v.id,a),a===null){i.push(v);continue}o.has(a)||o.set(a,[]),o.get(a).push(v)}let d=yt(i,n),c=new Map;for(let v of d)c.
set(v.items[0].id,v);let w=[],x=new Set;for(let v of e){let a=l.get(v.id)??null;if(a!==null){if(x.has(a))continue;x.add(
a);let h=o.get(a);w.push({key:`initiative:${a}`,name:a,status:so(h),sessions:Hn(h),blocks:yt(h,n)});continue}let g=c.get(
v.id);g&&w.push({key:g.key,name:null,status:so(g.items),sessions:[],blocks:[g]})}return w}function Nt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Ro(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,o)=>No(o)-No(n)).slice(0,12)}function No(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Io(e,t){
let n={},o="unknown";for(let i of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(i.key)}/summary`);if(!l||typeof l!=
"object"){o="unsupported";break}if(l.enabled===!1){o="disabled";break}n[i.key]=l,o="available"}catch{o="unsupported";break}
return{summaries:n,support:o}}var Co=String.raw`
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
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--bg);
  }
  /*
   * The left column. Group by is gone from a 156px rail: Goal and Session became
   * the tabs of the list card, and PR became the bottom stack's PRs card, so no
   * lens was deleted — each just has a permanent home instead of a switch.
   *
   * Flex, not viewport maths. This app renders as a flex child of the dashboard
   * shell (.ow-root{flex:1;min-height:0}), so a calc(100vh - …) height would
   * ignore the chrome above it and overflow. Height comes from the parent and
   * every scroll container below repeats min-height:0, which is what lets an
   * internal scroller actually shrink instead of growing.
   *
   * flex-basis is the resizer's live handle; min-width keeps a dragged-shut
   * column readable rather than collapsed to nothing.
   */
  .ow-main {
    display: flex;
    flex: 0 0 40%;
    min-width: 320px;
    min-height: 0;
    flex-direction: column;
    gap: 10px;
    padding: 16px 0 16px 16px;
  }
  /* A 10px hit area around a 3px visual line: the line stays hairline-quiet at
     rest, the target stays large enough to grab. */
  .ow-resizer {
    display: flex;
    flex: 0 0 10px;
    align-self: stretch;
    align-items: center;
    justify-content: center;
    border: 0;
    padding: 0;
    background: none;
    cursor: col-resize;
  }
  .ow-resizer::before {
    content: '';
    width: 3px;
    height: 44px;
    border-radius: 999px;
    background: var(--border);
    transition: background 140ms ease;
  }
  .ow-resizer:hover::before,
  .ow-resizer[data-dragging='true']::before { background: var(--muted); }
  .ow-resizer:focus-visible::before { background: var(--accent); }
  /* Dragging must not leave the cursor flickering between the I-beam and the
     resize arrow, nor select the text it sweeps over. */
  .ow-root[data-resizing='true'] { cursor: col-resize; user-select: none; }
  .ow-filter[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    color: var(--accent);
  }
  .ow-count { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  /* Card shell, shared by the tabbed list and every bottom-stack card. */
  .ow-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    background: var(--card);
  }
  /*
   * The Goals/Sessions card owns the column's remaining height and scrolls
   * INSIDE itself, so its tabs, subtitle and filter pills stay put while the
   * list moves — and so the bottom stack below can never be pushed off screen.
   */
  .ow-listcard {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  .ow-listcard-head { flex: none; padding: 12px 14px 0; }
  .ow-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
  /* Underline tabs, not the pill treatment the rail used: these switch what the
     list IS, so they read as the card's own title row rather than a filter. */
  .ow-tab {
    margin-bottom: -1px;
    padding: 2px 10px 8px;
    border: 0;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: none;
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
  }
  .ow-tab:hover { background: none; color: var(--text); }
  .ow-tab[data-selected='true'] {
    border-bottom-color: var(--text-strong);
    color: var(--text-strong);
  }
  .ow-listcard-tools { display: flex; flex-direction: column; gap: 10px; padding: 10px 0 12px; }
  .ow-listcard-sub { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* The only scroll container in the column. */
  .ow-work { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .ow-work-inner { padding: 0 14px 14px; }
  /* Bottom stack: companion surfaces pinned below the scrolling list. Each is a
     real <details>, so the browser owns the disclosure state and keyboard. */
  .ow-stack { display: flex; flex: none; flex-direction: column; gap: 10px; }
  .ow-stack-card { overflow: hidden; }
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
  /* Capped so an open card cannot eat the list above it; scrolls past the cap. */
  .ow-stack-body { max-height: 40vh; overflow-y: auto; padding: 6px 14px 12px; }
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
  /* Sizing only: the layout moved from a grid track to a flex row, so the column
     takes its width from flex + the resizer instead of a grid template. Nothing
     inside the Conductor changed. */
  .ow-conductor { display: flex; flex: 1 1 auto; min-width: 0; min-height: 0; flex-direction: column; background: var(--bg); border-left: 1px solid var(--border); }
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
  .ow-goalcard-header[data-selected='true'] .ow-goalcard-title { color: var(--accent); }
  .ow-goalcard-title { flex: 1; min-width: 0; overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: none; }
  .ow-goalcard .ow-block-open { flex: none; margin: 0; }
  .ow-goal-flag {
    flex: none; margin-left: auto; padding: 1px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
    color: var(--muted); background: var(--bg-hover); border: 1px solid var(--border);
  }
  .ow-goal-flag-warn { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  /* A lone goal has no name above its single item — this empty span just holds
     the summary row's height so the chevron area and flag sit on one clean line. */
  .ow-goalcard-lone { flex: 1; min-height: 18px; }
  .ow-goal-meta { margin: 4px 0 0 26px; color: var(--muted); font-size: 11px; }
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
`;import{Fragment as Me,jsx as r,jsxs as p}from"react/jsx-runtime";var Rt="crew-manager.snoozed",Ko="crew-manager.handled",
$o="crew-manager.done-collapsed",It="crew-manager.goal-verdicts",Lo="crew-manager.initiative-collapsed",Mo="crew-manager\
.split",Po="crew-manager.tab",Eo=40,is=25,ls=75;function he(e,t={}){try{let n=localStorage.getItem(e);return n?JSON.parse(
n):t}catch{return t}}function oe(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Yo(e,t=Date.now()){
if(!e)return null;let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let o=Math.round(n/60);if(o<60)return`${o}\
m ago`;let i=Math.round(o/60);return i<24?`${i}h ago`:`${Math.round(i/24)}d ago`}function To(e){return e?new Date(e).toLocaleTimeString(
[],{hour:"numeric",minute:"2-digit"}):""}function Ke(e,t,n){return e<=0?null:`${e} ${e===1?t:n}`}function Ct(e,t=Date.now()){
let n=He(e),o=[Ke(n.sessions,"session","sessions"),Ke(n.prs,"PR","PRs"),Ke(n.issues,"issue","issues"),Ke(n.loops,"loop",
"loops"),Ke(n.crons,"cron","crons"),Ke(n.agents,"agent","agents")].filter(l=>!!l),i=Yo(n.lastActivityAt,t);return i&&o.push(
`last active ${i}`),o.join(" \xB7 ")}var $e="crew-manager-conductor",ds=5e3,cs={session:"Session",approval:"Approval",agent:"\
Agent",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval request",
subagent_gate_waiting:"Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer the request in the\
 work thread",decision_ready:"Make the decision this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"\
Open the linked change \u2014 a check is failing or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"\
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
same artifact",related_same_topic:"similar goal",related_same_step:"same next step",related_more:"and {{count}} more",rank_approval_owed:"\
only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"the a\
gent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failure ha\
s repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{durat\
ion}}",rank_change_blocked:"a linked change is failing or conflicting",rank_nobody_on_it:"nobody is on {{count}} unfinis\
hed goal(s) in this session",no_next_step:"No next step recorded \u2014 nobody is on this",rank_queued_behind:"{{count}}\
 more prompt(s) queued in this session",rank_waiting_a_while:"waiting {{hours}}h",rank_nothing_pressing:"nothing pressin\
g \u2014 ordered by recency",rank_join:", and ",error_loop:"{{tool}} has failed the same way {{repeats}} times in a row",
untitled_work:"Untitled work"};function Z(e,t={}){return cs[e].replace(/\{\{(\w+)\}\}/g,(n,o)=>t[o]??"")}var us={followup:"\
FOLLOW UP",unblock:"UNBLOCK"},de={"needs-you":"Needs you",running:"Running",done:"Done"},Wt={all:"All","needs-you":"Need\
s you",running:"Running",done:"Done"},Oo={all:"All",failing:"Failing",running:"Running",merged:"Merged"},ps={session:Lt,
approval:Fo,agent:Yn,workflow:es,monitor:Ho,artifact:Jn,change:$t,issue:Zn};function ce({children:e,onActivate:t,...n}){
return r("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),
t())},children:e})}function zo({label:e,count:t,subtitle:n}){return p("div",{className:"ow-section-header",children:[p("\
div",{className:"ow-section-heading",children:[r("h2",{className:"ow-section-title",children:e}),r("span",{className:"ow\
-section-count",children:t})]}),n&&r("p",{className:"ow-section-subtitle",children:n})]})}function Jo(e){if(e.state==="n\
eeds-you"){let t=nt(e);return t?r(G,{variant:"warn",className:"ow-verb",children:us[t]}):null}return e.state==="running"?
e.moving?p(G,{variant:"aim",children:[r(Vo,{className:"ow-icon"}),de[e.state]]}):r(G,{variant:"muted",children:"Queued"}):
p(G,{variant:"ok",children:[r(Uo,{className:"ow-icon"}),de[e.state]]})}function Xo({tool:e,purpose:t,busy:n,onAnswer:o,where:i}){return p("div",{className:"ow-permission",children:[p("div",{className:"\
ow-permission-body",children:[p("div",{className:"ow-permission-head",children:[r(Xn,{className:"ow-icon","aria-hidden":"\
true"}),r("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),p("p",{className:"ow-permi\
ssion-what",children:[i&&p("span",{className:"ow-truncate",children:[i," "]}),i?"wants to run ":"Wants to run ",r("code",
{children:e})]}),t&&r("p",{className:"ow-permission-why",children:t})]}),p("div",{className:"ow-permission-actions",children:[
r(T,{onClick:()=>o(!0),disabled:n,children:"Approve"}),r(T,{onClick:()=>o(!1),disabled:n,children:"Reject"})]})]})}function Ye({
children:e}){return r("div",{className:"ow-expand",children:r("div",{className:"ow-expand-inner",children:e})})}var At=3;
function Do(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function gs({
candidates:e,prominent:t,busy:n,onAdd:o}){let[i,l]=N(""),d=t?e:e.filter(c=>c.sessions>=2);return p("div",{className:"ow-\
bootstrap","data-prominent":t?"true":void 0,children:[r("div",{className:"ow-bootstrap-head",children:t?"No big goals de\
fined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&r("div",{className:"ow-bootstrap-sub",children:"\
Found in your unassigned work \u2014 click one to confirm it as a goal, or name your own."}),d.length>0&&r("div",{className:"\
ow-bootstrap-chips",children:d.slice(0,4).map(c=>p("button",{type:"button",className:"ow-bootstrap-chip",disabled:n,onClick:()=>o(
c.name,[c.name]),children:[c.name," ",p("span",{className:"ow-bootstrap-count",children:[c.sessions," session",c.sessions===
1?"":"s"]})]},c.name))}),p("div",{className:"ow-bootstrap-custom",children:[r(rs,{value:i,placeholder:"Or name a goal yo\
urself\u2026","aria-label":"New goal name",onChange:c=>l(c.target.value),onKeyDown:c=>{c.key==="Enter"&&i.trim()&&(o(i),
l(""))}}),r(T,{disabled:n||!i.trim(),onClick:()=>{o(i),l("")},children:"Add goal"})]})]})}function qo({members:e}){let t=e[0],
n=new Set(e.map(c=>c.sessionKey).filter(Boolean)).size,o=e.filter(c=>c.state==="needs-you").length,i=e.filter(c=>c.state===
"running").length,l=e.filter(c=>c.state==="done").length,d=[`${n} session${n===1?"":"s"}`];return o&&d.push(`${o} need${o===
1?"s":""} you`),i&&d.push(`${i} running`),l&&d.push(`${l} done`),p("div",{className:"ow-goal-digest",children:[t.summary&&
r("p",{className:"ow-digest-line",children:t.summary}),r("div",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}
function Bt({open:e,onToggle:t,label:n,flag:o,flagWarn:i,meta:l,header:d,action:c,children:w}){return p("div",{className:"\
ow-block ow-goalcard","data-grouped":"true","data-open":e?"true":void 0,children:[p("div",{className:"ow-goalcard-summar\
y",children:[t&&r("button",{type:"button",className:"ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":
"Expand"} ${n??"goal"}`,onClick:t,children:r(le,{className:"ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-h\
idden":"true"})}),d,c,r("span",{className:`ow-goal-flag${i?" ow-goal-flag-warn":""}`,children:o})]}),r("div",{className:"\
ow-goal-meta",children:l}),w]})}function fs({block:e,status:t,folded:n,onToggle:o,onSplit:i,selected:l,onSelect:d}){let c=e.
items[0],w=new Set(e.items.map(a=>a.sessionKey).filter(Boolean)).size,x=[];for(let a=0;a<e.items.length;a+=1)for(let g=a+
1;g<e.items.length;g+=1)e.items[a].sessionKey!==e.items[g].sessionKey&&x.push(we(e.items[a],e.items[g]));let v=p(Me,{children:[
o&&r("button",{type:"button",className:"ow-goal-fold","aria-label":n?`Expand ${c.title}`:`Collapse ${c.title}`,"aria-exp\
anded":!n,onClick:a=>{a.stopPropagation(),o()},children:r(le,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"\
true","aria-hidden":"true"})}),r(st,{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate ow-bloc\
k-name",children:c.title}),t&&r("span",{className:"ow-init-status","data-status":t,children:de[t]}),p("span",{className:"\
ow-block-tab-meta",children:[r("span",{"aria-hidden":"true",children:"\xB7"}),p("span",{className:"ow-truncate",children:[
w," sessions, one goal"]})]}),i&&r(T,{className:"ow-block-open",title:"Not the same goal \u2014 split into separate cards",
"aria-label":`Split ${c.title}`,onClick:a=>{a.stopPropagation(),i(x)},children:"Split"})]});return d?r(ce,{onActivate:d,
className:"ow-block-tab ow-goal-tab","aria-pressed":l,"data-selected":l?"true":void 0,children:v}):r("div",{className:"o\
w-block-tab",children:v})}var ms=.3;function Go({item:e,items:t,onMerge:n}){let o=t.filter(i=>i.id!==e.id&&i.sessionKey&&
e.sessionKey&&i.sessionKey!==e.sessionKey).map(i=>({other:i,score:Ve(e,i)?1:tt(e.title,i.title)})).filter(i=>i.score>=ms).
sort((i,l)=>l.score-i.score).slice(0,2);return o.length===0?null:p("div",{className:"ow-merge-hint",children:[r("span",{
className:"ow-merge-hint-label",children:"Same goal?"}),o.map(({other:i})=>p("button",{type:"button",className:"ow-merge\
-hint-btn ow-truncate",onClick:()=>n(we(e,i)),children:["Merge with \u201C",i.title,"\u201D"]},i.id))]})}function ws({item:e,
onOpen:t}){let n=e.references.find(i=>i.kind==="session"),o=e.references.filter(i=>i.kind!=="session");return p("div",{className:"\
ow-block-tab",children:[r(Lt,{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate ow-block-name",
children:n?.label??e.provenance}),p("span",{className:"ow-block-tab-meta",children:[r("span",{"aria-hidden":"true",children:"\
\xB7"}),r("span",{className:"ow-truncate",children:e.provenance}),o.slice(0,2).map(i=>r("span",{className:"ow-truncate",
children:i.label},`${i.kind}:${i.id}`))]}),r(T,{className:"ow-block-open",onClick:t,"aria-label":`Open ${n?.label??e.provenance}`,
children:"Open"})]})}function hs({session:e,selected:t,onSelect:n,onOpen:o}){return p(ce,{onActivate:n,className:"ow-sro\
w","data-selected":t,children:[r(Lt,{className:"ow-icon","aria-hidden":"true"}),p("div",{className:"ow-srow-body",children:[
r("div",{className:"ow-srow-name ow-truncate",children:e.label}),r("div",{className:"ow-srow-state ow-truncate",children:e.
leading.summary})]}),r("span",{className:"ow-srow-badge",children:Jo(e.leading)}),r(T,{className:"ow-srow-open","aria-la\
bel":`Open ${e.label}`,onClick:i=>{i.stopPropagation(),o()},children:"Open"})]})}function bs({reference:e,checks:t}){let n=e.
status?/fail|conflict|closed/.test(e.status):!1;return p("div",{className:"ow-pr-head",children:[p("div",{className:"ow-\
pr-head-top",children:[r("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&r("a",{className:"ow-bl\
ock-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,children:r($t,
{className:"ow-icon","aria-hidden":"true"})})]}),r("div",{className:"ow-pr-status-line",children:t?.available&&(t.total??
0)>0?p("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total," chec\
ks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&r("span",{className:"ow-pr-dot","data-bad":n?"\
true":void 0,children:e.status})})]})}function ys({reference:e,onOpenSession:t}){let n=ps[e.kind],o=p(Me,{children:[r(n,
{className:"ow-icon"}),r("span",{className:"ow-truncate",children:e.label})]});return e.url?r("a",{className:"ow-referen\
ce ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:i=>i.stopPropagation(),children:o}):e.
sessionKey?r(ce,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:o}):r("span",{className:"\
ow-reference",children:o})}function Kt({item:e,selected:t,continuation:n,whyRanked:o,onSelect:i,onOpenSession:l,onAnswerPermission:d,
permissionBusy:c,onRetry:w,retryBusy:x,onStop:v,stopBusy:a,onPickStep:g,onSnooze:h,onHandled:W,hideBadge:k,compact:I,headless:B,
dot:D,simple:E}){let[K,Pe]=N(!1);return p(ce,{onActivate:i,className:"ow-row","aria-pressed":t,"data-selected":t,"data-i\
nstructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.id}`,children:[p(
"div",{className:"ow-row-layout",children:[p("div",{className:"ow-row-content",children:[!B&&p("div",{className:"ow-row-\
heading",children:[D&&r("span",{className:`ow-dot ow-dot-${D}`,"aria-hidden":"true"}),!E&&(k?e.state==="done"&&r(jo,{className:"\
ow-icon ow-row-check","aria-hidden":"true"}):Jo(e)),r("span",{className:"ow-row-title",children:e.title})]}),(!I&&!E||t)&&
e.summary&&!(e.nextSteps??[]).some(R=>R.what?.trim()===e.summary)&&r("p",{className:"ow-row-summary",children:e.summary}),
e.duplicateOf&&(!E||t)&&p(ce,{className:"ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[r(st,{className:"\
ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:Z(`duplicate_${e.duplicateOf.because}`,{title:e.
duplicateOf.title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&r(Ye,{children:p("div",{className:"ow-related",
children:[r("span",{className:"ow-related-label",children:Z("related_sessions",{count:String(e.relatedSessions.length)})}),
e.relatedSessions.map(R=>p(ce,{className:"ow-related-row",onActivate:()=>l(R.sessionKey),children:[r(st,{className:"ow-i\
con","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:R.title}),r("span",{className:"ow-related-why",children:Z(
`related_${R.because}`)})]},R.sessionKey)),e.relatedMore?r("span",{className:"ow-related-more",children:Z("related_more",
{count:String(e.relatedMore)})}):null]})}),o&&(!E||t)&&r("div",{className:"ow-row-why",children:o}),!n&&(!E||t)&&p("div",
{className:"ow-row-meta",children:[r("span",{className:"ow-truncate",children:e.provenance}),Do(e).length>0&&r("span",{"\
aria-hidden":"true",children:"\xB7"}),r("span",{className:"ow-references",children:Do(e).slice(0,3).map(R=>r(ys,{reference:R,
onOpenSession:l},`${R.kind}:${R.id}`))})]})]}),r("div",{className:"ow-row-actions",children:r(le,{className:"ow-icon","a\
ria-hidden":"true"})})]}),t&&g&&e.nextSteps&&e.nextSteps.length>0&&r(Ye,{children:p("div",{className:"ow-row-steps",children:[
r("div",{className:"ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,K?void 0:At).map((R,j)=>r("butt\
on",{type:"button",className:"ow-quote-step",title:R.why??R.what,onClick:be=>{be.stopPropagation(),g(R.what)},children:R.
what},`${j}:${R.what}`)),e.nextSteps.length>At&&r("button",{type:"button",className:"ow-steps-more",onClick:R=>{R.stopPropagation(),
Pe(j=>!j)},children:K?"Show fewer":`+${e.nextSteps.length-At} more`})]})}),t&&e.retryPath&&w&&r(Ye,{children:r("div",{className:"\
ow-retry",children:r(T,{onClick:()=>w(e.retryPath),disabled:!!x,children:"Retry"})})}),t&&e.stopPath&&v&&r(Ye,{children:r(
"div",{className:"ow-retry",children:r(T,{onClick:()=>v(e.stopPath),disabled:!!a,children:a?"Stopping\u2026":"Stop this \
loop"})})}),t&&e.permissionId&&d&&r(Ye,{children:r(Xo,{tool:e.permissionTool||"a tool",purpose:e.permissionPurpose,busy:!!c,
onAnswer:R=>d(e.permissionId,R)})}),e.state==="needs-you"&&h&&W&&p("div",{className:"ow-row-aside",children:[r("button",
{type:"button",className:"ow-aside-btn",onClick:R=>{R.stopPropagation(),h(e.id)},children:"Later"}),r("button",{type:"bu\
tton",className:"ow-aside-btn",onClick:R=>{R.stopPropagation(),W(e.id,e.updatedAt)},children:"Handled"})]})]})}var vs=["\
unblock","followup","running","done"],ks={unblock:{label:"UNBLOCK",cls:"ow-lane-unblock"},followup:{label:"FOLLOW UP",cls:"\
ow-lane-followup"}};function xs(e){return e.state==="done"?"done":e.state==="running"?"running":nt(e)??"unblock"}function _s({
items:e,selectedId:t,onSelect:n,onOpenSession:o,onAnswerPermission:i,permissionBusy:l,onRetry:d,retryBusy:c,onPickStep:w,
onSnooze:x,onHandled:v,doneTitles:a}){let[g,h]=N(!1),W=new Map;for(let k of e){let I=xs(k),B=W.get(I);B?B.push(k):W.set(
I,[k])}return p(Me,{children:[vs.filter(k=>W.has(k)).map(k=>{let I=W.get(k),B=k==="unblock"||k==="followup"?ks[k]:null,D=B?
I.map(K=>K.action!=="resume"?Be(ae(K),Z):""):[],E=B&&D.length>0&&D.every(K=>K&&K===D[0])?D[0]:void 0;return p("div",{className:"\
ow-lane",children:[B&&p("div",{className:"ow-lane-head",children:[r("span",{className:`ow-lane-badge ${B.cls}`,children:B.
label}),E&&r("span",{className:"ow-lane-reason",children:E})]}),I.map(K=>r(Kt,{item:K,hideBadge:!0,compact:!0,selected:t===
K.id,continuation:!0,whyRanked:E?void 0:K.state==="needs-you"&&K.action!=="resume"?Be(ae(K),Z):void 0,onSelect:()=>n(K),
onOpenSession:o,onAnswerPermission:i,permissionBusy:l,onRetry:d,retryBusy:c,onPickStep:w,onSnooze:x,onHandled:v},K.id))]},
k)}),!W.has("done")&&a&&a.length>0&&p("div",{className:"ow-lane ow-lane-done",children:[p("button",{type:"button",className:"\
ow-goals-toggle","aria-expanded":g,onClick:()=>h(k=>!k),children:[r(le,{className:"ow-icon","data-open":g?"true":void 0,
"aria-hidden":"true"}),a.length," done"]}),g&&r("ul",{className:"ow-done-list",children:a.map(k=>p("li",{className:"ow-r\
ow-goal-done",children:[r(jo,{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:k})]},
k))})]})]})}function Le({title:e,items:t,selectedId:n,onSelect:o,onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,
retryBusy:w,onStop:x,stopBusy:v,onPickStep:a,onSnooze:g,onHandled:h,footer:W,collapsed:k,onToggleCollapsed:I,groupBy:B,prChecks:D,
prFilter:E,doneBySession:K,goalVerdicts:Pe,onSplitGoal:R,onMergeGoal:j,initiativeBlocks:be,collapsedInitiatives:Ee,onToggleInitiative:Te,
selectedGoalKey:ye,onSelectGoal:ve,subtitle:Oe,hideHeader:U,emptyLabel:ze}){let V=St(t,B,Pe),ke=B==="pr"&&E&&E!=="all"?V.
filter(b=>b.changeRef&&vt(b.changeRef,D?.[b.changeRef.url??""])===E):V,H=be??[],De=B==="goal"?H.length:B==="pr"?ke.length:
t.length,Je=b=>p("div",{className:"ow-block","data-grouped":b.header?"true":void 0,children:[b.header==="session"&&b.sessionKey&&
r(ws,{item:b.items[0],onOpen:()=>i(b.sessionKey)}),b.header==="pr"&&b.changeRef&&r(bs,{reference:b.changeRef,checks:D?.[b.
changeRef.url??""]}),b.header==="goal"&&r(fs,{block:b,onSplit:R,selected:ye===b.key,onSelect:ve?()=>ve(b.key):void 0}),b.
header==="pr"?p(Me,{children:[r("div",{className:"ow-pr-sublabel",children:"Sessions on this PR"}),bo(b.items).map(_=>r(
hs,{session:_,selected:n===_.leading.id,onSelect:()=>o(_.leading),onOpen:()=>i(_.sessionKey)},_.sessionKey))]}):b.header===
"session"?r(_s,{items:b.items,doneTitles:b.sessionKey?K?.[b.sessionKey]:void 0,selectedId:n,onSelect:o,onOpenSession:i,onAnswerPermission:l,
permissionBusy:d,onRetry:c,retryBusy:w,onPickStep:a,onSnooze:g,onHandled:h}):b.items.map(_=>p(Wo,{children:[r(Kt,{item:_,
selected:n===_.id,continuation:b.header==="session",whyRanked:_.state==="needs-you"&&_.action!=="resume"?Be(ae(_),Z):void 0,
onSelect:()=>o(_),onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:w,onStop:x,stopBusy:v,onPickStep:a,
onSnooze:g,onHandled:h}),B==="goal"&&j&&n===_.id&&r(Go,{item:_,items:t,onMerge:j})]},_.id))]},b.key),xe=b=>p(Wo,{children:[
r(Kt,{item:b,selected:n===b.id,dot:xo(b),simple:!0,whyRanked:b.state==="needs-you"&&b.action!=="resume"?Be(ae(b),Z):void 0,
onSelect:()=>o(b),onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:w,onPickStep:a,onSnooze:g,onHandled:h}),
j&&n===b.id&&r(Go,{item:b,items:t,onMerge:j})]},b.id),Xe=b=>{if(b.name){let X=Ee?.[b.key]??b.status!=="needs-you",ne=b.blocks.
flatMap(Y=>Y.items),ee=He(ne);return r(Bt,{open:!X,onToggle:()=>Te?.(b.key,!X),label:b.name,flag:ee.needsYou>0?`${ee.needsYou}\
 need you`:de[b.status],flagWarn:ee.needsYou>0,meta:Ct(ne),header:r("span",{className:"ow-truncate ow-block-name ow-goal\
card-title",children:b.name}),children:X?r(qo,{members:ne}):ne.map(Y=>xe(Y))},b.key)}let _=b.blocks[0];if(_.header==="go\
al"){let X=Ee?.[b.key]??b.status!=="needs-you",ne=_.items[0],ee=He(_.items),Y=[];for(let L=0;L<_.items.length;L+=1)for(let _e=L+
1;_e<_.items.length;_e+=1)_.items[L].sessionKey!==_.items[_e].sessionKey&&Y.push(we(_.items[L],_.items[_e]));return r(Bt,
{open:!X,onToggle:()=>Te?.(b.key,!X),label:`${new Set(_.items.map(L=>L.sessionKey).filter(Boolean)).size} sessions, one \
goal`,flag:ee.needsYou>0?`${ee.needsYou} need you`:de[b.status],flagWarn:ee.needsYou>0,meta:Ct(_.items),header:p(ce,{onActivate:()=>ve?.(
_.key),className:"ow-goalcard-header ow-goal-tab","aria-pressed":ye===_.key,"data-selected":ye===_.key?"true":void 0,children:[
r(st,{className:"ow-icon","aria-hidden":"true"}),p("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:[
new Set(_.items.map(L=>L.sessionKey).filter(Boolean)).size," sessions, one goal"]})]}),action:R&&r(T,{className:"ow-bloc\
k-open",title:"Not the same goal \u2014 split into separate cards","aria-label":`Split ${ne.title}`,onClick:L=>{L.stopPropagation(),
R(Y)},children:"Split"}),children:X?r(qo,{members:_.items}):_.items.map(L=>xe(L))},b.key)}let qe=_.items[0],J=He(_.items);
return r(Bt,{open:!0,flag:J.needsYou>0?`${J.needsYou} need you`:de[qe.state],flagWarn:J.needsYou>0,meta:Ct(_.items),header:r(
"span",{className:"ow-goalcard-title ow-goalcard-lone","aria-hidden":"true"}),children:xe(qe)},b.key)};return p("section",
{className:"ow-section","aria-label":e,children:[U?null:I?p(ce,{onActivate:I,className:"ow-section-toggle",children:[r(zo,
{label:e,count:De,subtitle:Oe}),r(le,{className:"ow-icon ow-section-chevron","data-open":k?void 0:"true","aria-hidden":"\
true"})]}):r(zo,{label:e,count:De,subtitle:Oe}),k?null:r("div",{className:"ow-section-list",children:B==="goal"?H.length===
0?r("p",{className:"ow-section-empty",children:ze}):H.map(Xe):ke.length===0?r("p",{className:"ow-section-empty",children:ze}):
ke.map(Je)}),W]})}function Ss(e,t){let n=uo(t,Z);if(!e)return["Crew Manager context: workspace overview.",...n,"Answer t\
he user about the state of their work. This is a conversation, not an action channel."].join(`
`);let o=e.references.map(l=>`${l.kind}: ${l.label} (${l.id})`).join(`
`),i=[e.stalledFor?`Silent for ${Ae(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(l=>!!l);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,
`State: ${de[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...i.length>0?[`Why it is on the board:
${i.join(`
`)}`]:[],`References:
${o}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(l=>!!l).join(`
`)}function Ns(){let e=ts(),t=ie(e);t.current=e;let n=os(),o=ns(),[i,l]=N("all"),[d,c]=N(()=>he(Po,null)==="session"?"se\
ssion":"goal"),[w,x]=N("all"),[v,a]=N({}),[g,h]=N(null),[W,k]=N(null),[I,B]=N(null),[D,E]=N({}),[K,Pe]=N("unknown"),R=ie(
"unknown"),j=ie(new Map),[be,Ee]=N({}),[Te,ye]=N({}),[ve,Oe]=N([]),[U,ze]=N(null),[V,ke]=N(null),[H,De]=N(null),[Je,xe]=N(
()=>he(Rt)),[Xe,b]=N(()=>he(Ko)),[_,qe]=N(()=>he(It,{merged:[],split:[]})),[J,X]=N([]),[ne,ee]=N(()=>he(Lo)),[Y,L]=N(null),
[_e,Qo]=N(()=>he($o,null)??!0),[Mt,Pt]=N({}),[rt,Zo]=N([]),[at,Et]=N(()=>he(Mo,null)??Eo),[it,Tt]=N(!1),Ot=ie(!0),[en,zt]=N(
!0),[Dt,lt]=N(null),[tn,on]=N(!1),[qt,ue]=N(null),$=ie(!0),Ge=ie(0),dt=ie(!1);F(()=>($.current=!0,()=>{$.current=!1,Ge.current+=
1}),[]);let M=O(async()=>{let s=++Ge.current,u=t.current;try{let[f,m,y,S,We,Ze,A,re]=await Promise.all([u.get("/api/chat\
/slots"),u.get("/api/approvals"),u.get("/api/spawn"),u.get("/api/workflows/runs"),u.get("/api/crons"),u.get("/api/artifa\
cts"),u.get("/api/autonudge").catch(()=>({loops:[]})),u.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!$.
current||s!==Ge.current)return;B({slots:Array.isArray(f)?f:[],approvals:Array.isArray(m)?m:[],agents:Array.isArray(y.agents)?
y.agents:[],workflows:Array.isArray(S.runs)?S.runs:[],crons:Array.isArray(We.jobs)?We.jobs:[],artifacts:Array.isArray(Ze.
artifacts)?Ze.artifacts:[],loops:Array.isArray(A?.loops)?A.loops:[]}),Zo(Array.isArray(re?.runs)?re.runs:[]),lt(null)}catch(f){
$.current&&s===Ge.current&&lt(f instanceof Error?f:new Error("Unable to load Crew Manager sources"))}finally{$.current&&
s===Ge.current&&zt(!1)}},[]);F(()=>{M();let s=window.setInterval(()=>{M()},ds);return()=>window.clearInterval(s)},[M]);let nn=()=>{
zt(!0),lt(null),M()};F(()=>{if(!I||R.current==="unsupported"||R.current==="disabled")return;let s=Ro(I.slots,$e).filter(
f=>j.current.get(f.key)!==Nt(f));if(s.length===0)return;let u=!1;return(async()=>{let{summaries:f,support:m}=await Io(s,
y=>t.current.get(y));if(!(u||!$.current)&&(R.current=m,Pe(m),m==="available")){for(let y of s)f[y.key]&&j.current.set(y.
key,Nt(y));E(y=>({...y,...f}))}})(),()=>{u=!0}},[I]),F(()=>{if(!I||!Ot.current)return;let s=!1;return(async()=>{try{let u=await t.
current.get("/api/apps/crew-manager/stalls");if(s||!$.current)return;let f={};for(let y of u?.stalls??[])y?.key&&(f[y.key]=
y);Ee(f);let m={};for(let y of u?.error_loops??[])y?.key&&(m[y.key]=y);Pt(m)}catch{Ot.current=!1,$.current&&(Ee({}),Pt({}))}})(),
()=>{s=!0}},[I]),F(()=>{let s=!1;return(async()=>{try{let u=await t.current.get("/api/apps/crew-manager/initiatives");if(s||
!$.current)return;X((u?.initiatives??[]).filter(f=>f?.name))}catch{}})(),()=>{s=!0}},[]);let Gt=z(()=>po(ho(I??{slots:[],
approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},Z,D,be,Mt,_),Te),[I,D,be,Mt,Te,_]),Qe=z(()=>fo(Gt,Je,
Xe),[Gt,Je,Xe]),C=z(()=>Qe.items.filter(s=>mo(s)),[Qe]),ct=z(()=>_t(C),[C]),Ft=z(()=>{let s={};for(let u of C){if(u.state!==
"done"||!u.sessionKey)continue;let f=s[u.sessionKey];f?f.push(u.title):s[u.sessionKey]=[u.title]}return s},[C]),se=z(()=>C.
find(s=>s.id===g)??null,[C,g]),Fe=z(()=>i==="all"?C:C.filter(s=>s.state===i),[i,C]),ut=z(()=>{let s={all:0,failing:0,running:0,
merged:0};for(let u of St(C,"pr")){if(!u.changeRef)continue;s.all++;let f=vt(u.changeRef,v[u.changeRef.url??""]);f!=="ot\
her"&&s[f]++}return s},[C,v]);F(()=>{let s=new Set;for(let f of C)for(let m of f.references)m.kind==="change"&&m.url&&/github\.com\/.+\/pull\//.
test(m.url)&&s.add(m.url);let u=!1;for(let f of s)v[f]||t.current.get(`/pr-checks?url=${encodeURIComponent(f)}`).then(m=>{
!u&&$.current&&a(y=>({...y,[f]:m}))}).catch(()=>{});return()=>{u=!0}},[C,v]),F(()=>o(ct["needs-you"]),[ct,o]),F(()=>{g&&
!C.some(s=>s.id===g)&&h(null)},[C,g]),F(()=>{oe(Po,d)},[d]),F(()=>{oe(Mo,at)},[at]);let jt=ie(null);F(()=>{if(!it)return;
let s=f=>{let m=jt.current?.getBoundingClientRect();if(!m||m.width===0)return;let y=(f.clientX-m.left)/m.width*100;Et(Math.
max(is,Math.min(ls,y)))},u=()=>Tt(!1);return window.addEventListener("mousemove",s),window.addEventListener("mouseup",u),
()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",u)}},[it]);let pt=I?.slots.find(s=>s.
key===$e),sn=!!(pt||tn);F(()=>{!I||pt||dt.current||(dt.current=!0,e.post("/api/chat/slots",{name:$e,title:"Conductor"}).
then(()=>{$.current&&(on(!0),M())}).catch(s=>{$.current&&(dt.current=!1,ue(s instanceof Error?`Conductor session could n\
ot be created: ${s.message}`:"Conductor session could not be created"))}))},[e,pt,M,I]);let Ut=z(()=>ao(I?.approvals??[],
ve,s=>C.find(u=>u.sessionKey===s)?.title??I?.slots?.find(u=>u.key===s)?.title??s),[C,I,ve]),Se=se&&!se.permissionId?se:null,
je=z(()=>So(C,J,_),[C,J,_]),Q=z(()=>{if(!Y)return null;for(let s of je){let u=s.blocks.find(f=>f.key===Y);if(u&&u.items.
length>0)return u}return null},[Y,je]),q=Q?_o(Q.items):null,gt=z(()=>{let s=(I?.loops??[]).filter(m=>m&&m.active!==!1&&m.
slot_key);if(s.length===0)return[];let u=new Map,f=new Map;for(let m of C)for(let y of m.references)y.kind!=="session"||
!y.id||y.label&&!u.has(y.id)&&u.set(y.id,y.label);for(let m of je)if(m.name)for(let y of m.blocks)for(let S of y.items)S.
sessionKey&&!f.has(S.sessionKey)&&f.set(S.sessionKey,m.name);return s.map(m=>{let y=Number(m.cycle_count)||0,S=Number(m.
max_cycles)||0;return{key:m.slot_key,title:u.get(m.slot_key)??m.slot_key,goalName:f.get(m.slot_key)??null,progress:S>0?`${y}\
/${S}`:`${y} ${y===1?"cycle":"cycles"}`,remaining:S>0?Math.max(0,S-y):null,instruction:(m.message??"").replace(/\s+/g," ").
trim(),lastFire:P(m.last_fire_ts)}})},[I,C,je]),Ne=z(()=>{let s=new Date;s.setHours(0,0,0,0);let u=s.getTime(),f=u+864e5,
m=I?.crons??[],y=new Map;for(let A of rt){let re=P(A.started_at);if(!A.job_id||re<u||re>=f)continue;let te=y.get(A.job_id)??
{count:0,failed:0,last:0};te.count+=1,A.status&&A.status!=="success"&&(te.failed+=1),te.last=Math.max(te.last,re),y.set(
A.job_id,te)}let S=m.map(A=>{let re=y.get(A.id),te=P(A.next_run_ts),hn=te>=u&&te<f;return{job:A,ran:re,next:te,dueToday:hn}}).
filter(A=>A.ran||A.dueToday||A.job.is_running),We=S.filter(A=>A.ran&&A.ran.failed===0).length,Ze=S.filter(A=>A.ran&&A.ran.
failed>0).length;return{rows:S,done:We,failed:Ze,total:S.length,historyKnown:rt.length>0}},[I,rt]),[rn,Vt]=N(!1),an=z(()=>{
if(d!=="goal")return[];let s=vo(I?.slots??[],J),u=ko(C,J),f=new Set,m=[];for(let y of[...u,...s])f.has(y.name.toLowerCase())||
(f.add(y.name.toLowerCase()),m.push(y));return m.sort((y,S)=>S.sessions-y.sessions)},[d,I,C,J]),ln=O(async(s,u=[])=>{if(s.
trim()){Vt(!0);try{let f=await t.current.post("/api/apps/crew-manager/initiatives",{name:s.trim(),aliases:u});$.current&&
f?.initiatives&&X(f.initiatives.filter(m=>m?.name))}catch{}finally{$.current&&Vt(!1)}}},[]),pe=O(async(s,u)=>{if(!U){ze(
s),ue(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(s)}/${u?"approve":"reject"}`,{}),M()}catch(f){
ue(f instanceof Error?`Could not answer that request: ${f.message}`:"Could not answer that request"),M()}finally{$.current&&
ze(null)}}},[M,U]),dn=O(s=>{xe(u=>{let f=Object.fromEntries(Object.entries(u).filter(([,m])=>m>Date.now()));return f[s]=
Date.now()+go,oe(Rt,f),f}),h(null)},[]),cn=O((s,u)=>{b(f=>{let m={...f,[s]:u};return oe(Ko,m),m}),h(null)},[]),un=O(()=>{
xe({}),oe(Rt,{})},[]),pn=O(s=>{qe(u=>{let f={merged:u.merged.filter(m=>!s.includes(m)),split:[...new Set([...u.split,...s])]};
return oe(It,f),f})},[]),gn=O(s=>{qe(u=>{let f={merged:[...new Set([...u.merged,s])],split:u.split.filter(m=>m!==s)};return oe(
It,f),f})},[]),fn=O(()=>{Qo(s=>(oe($o,!s),!s))},[]),Re=O(async s=>{if(!V){ke(s),ue(null);try{await t.current.post(s,{}),
M()}catch(u){ue(u instanceof Error?`Could not re-run it: ${u.message}`:"Could not re-run it"),M()}finally{$.current&&ke(
null)}}},[M,V]),Ue=O(async s=>{if(!H){De(s),ue(null);try{await t.current.del(s),k("Stopped the monitor loop. Re-arming i\
t is done from the session itself."),M()}catch(u){let f=u instanceof Error?u.message:"";/404|not found/i.test(f)?k("That\
 loop had already stopped."):ue(f?`Could not stop it: ${f}`:"Could not stop it"),M()}finally{$.current&&De(null)}}},[M,H]),
ge=O(async s=>{if(Q&&q?.sessionKey){let f=q.sessionKey,m=Q.items.map(S=>`- ${S.references.find(We=>We.kind==="session")?.
label??S.sessionKey}: ${de[S.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(f)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${Q.items[0].title}", which spans sessions:`,m,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:f}).catch(S=>{if(!(S instanceof
SyntaxError))throw S}),!$.current)return;ye(S=>({...S,[q.id]:Date.now()})),Oe(S=>S.includes(f)?S:[...S,f]);let y=q.references.
find(S=>S.kind==="session")?.label??q.title;k(q.moving||q.state==="running"?`Sent to ${y} \u2014 the active session on this g\
oal`:`Sent to ${y} \u2014 resuming the last session on this goal`),L(null),M();return}let u=se&&!se.permissionId?se:null;
if(u?.sessionKey){let f=u.sessionKey;if(await t.current.post("/api/chat",{message:s,slot:f}).catch(m=>{if(!(m instanceof
SyntaxError))throw m}),!$.current)return;ye(m=>({...m,[u.id]:Date.now()})),Oe(m=>m.includes(f)?m:[...m,f]),k(`Sent new i\
nstructions to ${u.title}`),h(null),M();return}await t.current.post(`/api/chat/slots/${encodeURIComponent($e)}/context`,
{content:Ss(se,C),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:$e}).
catch(f=>{if(!(f instanceof SyntaxError))throw f})},[se,Q,q,C,M]),ft={"needs-you":Fe.filter(s=>s.state==="needs-you"),running:Fe.
filter(s=>s.state==="running"),done:Fe.filter(s=>s.state==="done")},mn=O((s,u)=>{ee(f=>{let m={...f,[s]:u};return oe(Lo,
m),m})},[]),wn=O(s=>{L(u=>u===s?null:s),h(null),k(null)},[]),Ie=s=>n(`/chat?sid=${encodeURIComponent(s)}`),Ce=s=>{h(u=>u===
s.id?null:s.id),L(null),k(null)};return p("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[r(
"style",{children:Co}),r(as,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what f\
inished recently."}),r("div",{className:"ow-body",children:p("div",{className:"ow-layout",ref:jt,children:[p("div",{className:"\
ow-main",style:{flexBasis:`${at}%`},children:[p("section",{className:"ow-card ow-listcard","aria-label":"Work",children:[
p("div",{className:"ow-listcard-head",children:[r("div",{className:"ow-tabs",role:"tablist","aria-label":"View",children:[
"goal","session"].map(s=>r(T,{role:"tab","aria-selected":d===s,"data-selected":d===s,className:"ow-tab",onClick:()=>c(s),
children:s==="goal"?"Goals":"Sessions"},s))}),p("div",{className:"ow-listcard-tools",children:[r("p",{className:"ow-list\
card-sub",children:d==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each session need\
s from you"}),d==="session"&&r("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.
keys(Wt).map(s=>p(T,{onClick:()=>l(s),"aria-pressed":i===s,"data-selected":i===s,className:"ow-filter",children:[Wt[s],r(
"span",{className:"ow-count",children:ct[s]})]},s))})]})]}),r("main",{className:"ow-work",children:r("div",{className:"o\
w-work-inner",children:en?r(Ao,{rows:7}):Dt&&!I?r(Bo,{icon:r(Fo,{className:"ow-icon"}),title:"Crew Manager could not loa\
d the work view",subtitle:Dt.message,action:r(T,{onClick:nn,children:"Try again"})}):(d==="goal"?C.length===0:Fe.length===
0)?r(Bo,{icon:r(Qn,{className:"ow-icon"}),title:"No matching work",subtitle:d==="goal"?"No sessions are running yet.":"C\
hange the filter to see sessions in another state."}):d==="goal"?r(Le,{title:"Work by goal",hideHeader:!0,items:C,selectedId:g,
onSelect:Ce,onOpenSession:Ie,onAnswerPermission:(s,u)=>{pe(s,u)},permissionBusy:U!==null,onRetry:s=>{Re(s)},retryBusy:V!==
null,onPickStep:s=>{ge(s)},groupBy:d,goalVerdicts:_,onSplitGoal:pn,onMergeGoal:gn,initiativeBlocks:je,collapsedInitiatives:ne,
onToggleInitiative:mn,selectedGoalKey:Y,onSelectGoal:wn,footer:r(gs,{candidates:an,prominent:J.length===0,busy:rn,onAdd:(s,u)=>{
ln(s,u)}}),emptyLabel:"No matching work"}):i==="all"?p(Me,{children:[r(Le,{title:"Needs you",subtitle:"Waiting on a deci\
sion or reply from you",items:ft["needs-you"],doneBySession:Ft,selectedId:g,onSelect:Ce,onSnooze:dn,onHandled:cn,footer:Qe.
snoozedCount>0?p("button",{type:"button",className:"ow-aside-note",onClick:un,children:[Qe.snoozedCount," set aside for \
later \u2014 bring back"]}):void 0,onOpenSession:Ie,onAnswerPermission:(s,u)=>{pe(s,u)},permissionBusy:U!==null,onRetry:s=>{
Re(s)},retryBusy:V!==null,onStop:s=>{Ue(s)},stopBusy:H!==null,onPickStep:s=>{ge(s)},groupBy:d,emptyLabel:"Nothing needs \
your input right now."}),r(Le,{title:"In progress",subtitle:"Being worked on right now",items:ft.running,doneBySession:Ft,
selectedId:g,onSelect:Ce,onOpenSession:Ie,onAnswerPermission:(s,u)=>{pe(s,u)},permissionBusy:U!==null,onRetry:s=>{Re(s)},
retryBusy:V!==null,onStop:s=>{Ue(s)},stopBusy:H!==null,onPickStep:s=>{ge(s)},groupBy:d,emptyLabel:"Nothing is in progres\
s right now."}),r(Le,{title:"Done recently",subtitle:"Finished in the last few days",items:ft.done,selectedId:g,onSelect:Ce,
collapsed:_e,onToggleCollapsed:fn,onOpenSession:Ie,onAnswerPermission:(s,u)=>{pe(s,u)},permissionBusy:U!==null,onRetry:s=>{
Re(s)},retryBusy:V!==null,onStop:s=>{Ue(s)},stopBusy:H!==null,onPickStep:s=>{ge(s)},groupBy:d,emptyLabel:"No recent comp\
leted work."})]}):r(Le,{title:Wt[i],items:Fe,selectedId:g,onSelect:Ce,onOpenSession:Ie,onAnswerPermission:(s,u)=>{pe(s,u)},
permissionBusy:U!==null,onRetry:s=>{Re(s)},retryBusy:V!==null,onStop:s=>{Ue(s)},stopBusy:H!==null,onPickStep:s=>{ge(s)},
groupBy:d,emptyLabel:"No matching work"})})})]}),p("div",{className:"ow-stack",children:[p("details",{className:"ow-card\
 ow-stack-card",children:[p("summary",{children:[p("span",{className:"ow-stack-title",children:[r(le,{className:"ow-icon\
 ow-stack-chevron"}),r($t,{className:"ow-icon"}),"PRs"]}),p(G,{variant:"muted",children:[ut.all," open"]})]}),r("p",{className:"\
ow-stack-sub",children:"Open pull requests your work touches"}),r("div",{className:"ow-stack-body",children:ut.all===0?r(
"p",{className:"ow-stack-empty",children:"No work is linked to a PR right now. Work links to one when a session mentions\
 its URL."}):p(Me,{children:[r("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.
keys(Oo).map(s=>p(T,{onClick:()=>x(s),"aria-pressed":w===s,"data-selected":w===s,className:"ow-filter",children:[Oo[s],r(
"span",{className:"ow-count",children:ut[s]})]},s))}),r(Le,{title:"Work by PR",items:C,prChecks:v,prFilter:w,selectedId:g,
onSelect:Ce,onOpenSession:Ie,onAnswerPermission:(s,u)=>{pe(s,u)},permissionBusy:U!==null,onRetry:s=>{Re(s)},retryBusy:V!==
null,onStop:s=>{Ue(s)},stopBusy:H!==null,onPickStep:s=>{ge(s)},groupBy:"pr",emptyLabel:"No PR matches that status."})]})})]}),
p("details",{className:"ow-card ow-stack-card",children:[p("summary",{children:[p("span",{className:"ow-stack-title",children:[
r(le,{className:"ow-icon ow-stack-chevron"}),r(Ho,{className:"ow-icon"}),"Loops"]}),r(G,{variant:"muted",children:gt.length})]}),
r("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),r("div",{className:"ow-stack-bod\
y",children:gt.length===0?r("p",{className:"ow-stack-empty",children:"No loop is running right now."}):gt.map(s=>{let u=Yo(
s.lastFire),f=[u&&`last tick ${u}`,s.remaining!==null&&`${s.remaining} remaining`].filter(Boolean).join(" \xB7 ");return p(
"div",{className:"ow-mini",children:[r("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),p("div",{children:[
p("div",{className:"ow-mini-title",children:[s.goalName??s.title,r("span",{className:"ow-mini-chip",children:s.progress})]}),
s.instruction&&r("div",{className:"ow-mini-desc",title:s.instruction,children:s.instruction}),f&&r("div",{className:"ow-\
mini-when",children:f})]}),r(G,{variant:"ok",children:"Active"})]},s.key)})})]}),p("details",{className:"ow-card ow-stac\
k-card",children:[p("summary",{children:[p("span",{className:"ow-stack-title",children:[r(le,{className:"ow-icon ow-stac\
k-chevron"}),r(Vo,{className:"ow-icon"}),"Scheduled tasks"]}),p(G,{variant:Ne.failed>0?"err":"muted",children:[Ne.done,"\
/",Ne.total," today"]})]}),r("p",{className:"ow-stack-sub",children:Ne.historyKnown?"Today's runs only \u2014 jobs with nothi\
ng scheduled today are hidden":"Run history is unavailable, so completed counts may be low"}),r("div",{className:"ow-sta\
ck-body",children:Ne.rows.length===0?r("p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):Ne.rows.
map(({job:s,ran:u,next:f,dueToday:m})=>{let y=!!(u&&u.failed>0),S=[u&&`ran today ${To(u.last)}${u.count>1?` (${u.count}x\
)`:""}`,m&&f?`next ${To(f)}`:null].filter(Boolean).join(" \xB7 ");return p("div",{className:"ow-mini",children:[r("span",
{className:"ow-mini-rail",style:{background:y?"var(--danger)":s.enabled===!1?"var(--muted)":"var(--warn)"}}),p("div",{children:[
r("div",{className:"ow-mini-title",children:s.name}),s.schedule&&p("div",{className:"ow-mini-desc",children:[s.schedule,
s.cron_expr&&r("span",{className:"ow-mini-chip",children:s.cron_expr})]}),S&&r("div",{className:"ow-mini-when",children:S})]}),
s.is_running?r(G,{variant:"aim",children:"Running"}):y?r(G,{variant:"err",children:"Failed"}):s.enabled===!1?r(G,{variant:"\
muted",children:"Paused"}):u?r(G,{variant:"ok",children:"Success"}):r(G,{variant:"warn",children:"Pending"})]},s.id)})})]})]})]}),
r("button",{type:"button",className:"ow-resizer","aria-label":"Resize columns","data-dragging":it?"true":void 0,onMouseDown:s=>{
s.preventDefault(),Tt(!0)},onDoubleClick:()=>Et(Eo)}),p("aside",{className:"ow-conductor","aria-label":"Conductor",children:[
r("div",{className:"ow-conductor-header",children:p("div",{className:"ow-conductor-title",children:[r("h2",{children:"Co\
nductor"}),!Se&&r("span",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),r("div",{className:"\
ow-chat",children:sn?p("div",{className:"ow-chat-panel",children:[Ut.length>0&&r("div",{className:"ow-permissions",role:"\
alert",children:Ut.map(s=>r(Xo,{tool:s.tool,purpose:s.purpose,where:s.sessionLabel,busy:U!==null,onAnswer:u=>{pe(s.id,u)}},
s.id))}),W&&p("div",{className:"ow-conductor-receipt",role:"status",children:[r(Uo,{className:"ow-icon"}),W]}),qt&&r("di\
v",{className:"ow-chat-error",role:"alert",children:qt}),r("div",{className:"ow-embed",children:r(ss,{slotKey:$e,frameless:!0,
startAtBottom:!0,placeholder:Q?"Instruction for this goal\u2026":Se?.sessionKey?"New instructions for this session\u2026":
"Ask across your work\u2026",onSend:ge})}),Q&&q?p("div",{className:"ow-quote ow-quote-docked",children:[p("div",{className:"\
ow-quote-body ow-quote-goal",children:[p("div",{className:"ow-quote-line",children:[r("span",{className:"ow-eyebrow",children:"\
Instructing goal"}),r("span",{className:"ow-quote-title",title:Q.items[0].title,children:Q.items[0].title})]}),p("span",
{className:"ow-quote-route ow-truncate",children:["\u2192 ",q.references.find(s=>s.kind==="session")?.label??q.title,q.moving||
q.state==="running"?" (active)":" (will resume)"]})]}),r(T,{className:"ow-quote-clear","aria-label":"Remove the quoted g\
oal",onClick:()=>{L(null),k(null)},children:"Clear"})]}):Se&&p("div",{className:"ow-quote ow-quote-docked",children:[p("\
div",{className:"ow-quote-body",children:[r("span",{className:"ow-eyebrow",children:Se.sessionKey?"Instructing":"Quoted"}),
r("span",{className:"ow-quote-title",title:Se.title,children:Se.title})]}),r(T,{className:"ow-quote-clear","aria-label":"\
Remove the quoted work item",onClick:()=>{h(null),k(null)},children:"Clear"})]})]}):r("div",{className:"ow-chat-loading",
children:r(Ao,{rows:4})})})]})]})})]})}export{Ns as default};
