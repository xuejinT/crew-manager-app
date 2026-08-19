import{Fragment as Co,useCallback as z,useEffect as V,useMemo as D,useRef as le,useState as N}from"react";import{AlertTriangle as Go,
Bot as Hn,Check as Fo,ChevronRight as de,Check as jo,Clock as Uo,Package as Jn,ExternalLink as Kt,MessageSquare as $t,Shield as Xn,
Waves as Vo,Search as Qn,Tag as Zn,Users as nt,Zap as es}from"lucide-react";import{useAppApi as ts,useNavigate as os,useNavBadge as ns,
ChatEmbed as ss}from"@kirocrew/app-sdk";import{Badge as F,Btn as T,ContentSkeleton as Wo,EmptyState as Ao,Input as rs,PageHeader as as}from"@kirocrew/app-sdk/ui";function Be(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),o=t%
60;return o===0?`${n} hour${n===1?"":"s"}`:`${n}h ${o}m`}function so(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function yt(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function ro(e,t,n){let o=new Set(t.filter(Boolean));if(o.size===0)return[];
let i=new Set,l=[];for(let d of e){let c=d.slot;!c||!o.has(c)||!d.id||i.has(d.id)||(i.add(d.id),l.push({id:d.id,sessionKey:c,
sessionLabel:n(c),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return l}var Vt={"needs-you":0,running:1,done:2};function P(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function bn(e,t){
if(e.paused)return"";let n=P(e.next_run_ts);if(!n)return"";let o=Math.round((n-t)/1e3);return o<=0?"":Be(o)}var Yt=72;function me(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let i=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(i.length<=Yt)return i;let l=i.slice(0,Yt),d=l.lastIndexOf(" ");return`${(d>24?l.slice(0,d):l).trim()}\u2026`}
function we(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var yn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
vn=/^\((?:code|diff|widget|image)\)$/,kn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
xn=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,_n=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
Sn=/[?？]["'”’)\]]*$/;function ao(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||vn.test(t)||yn.test(
t)?null:t}function vt(e){if(!e.waiting_for_input)return null;let t=ao(e);return!t||kn.test(t)||xn.test(t)?null:_n.test(t)||
Sn.test(t)?t:null}function Ht(e){return e.pending_approval||vt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":we(e)?"needs-you":"done"}function Nn(e,t){if(e.pending_approval)return t("approval_waiting");let n=vt(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):we(e)?t("linked_change_issue"):ao(e)??t("recent_w\
ork_ready"))}function mt(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function Rn(e){return e.pending_approval?"review-approval":vt(e)?"reply":"open"}function In(e,t){
let n=(e.source_links??[]).map(o=>({kind:o.kind==="issue"?"issue":"change",id:o.url,label:o.kind==="issue"?`issue #${o.number}`:
`${o.provider} #${o.number}`,url:o.url,sessionKey:e.key,status:so(o)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:Nn(e,t),state:Ht(e),moving:Ht(e)==="running"||void 0,issue:we(e),updatedAt:P(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:mt(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:we(e)||void 0,action:Rn(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...n]}}function kt(e,t){e.references.
some(n=>n.kind===t.kind&&n.id===t.id)||e.references.push(t)}function io(e){return(e.source||"").toLowerCase()==="subagen\
t"}function Cn(e,t,n){let o=io(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,P(t.ts)),e.summary=n(o?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=o?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,kt(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),
sessionKey:t.slot||e.sessionKey})}function Wn(e,t,n){e.updatedAt=Math.max(e.updatedAt,P(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),kt(e,{kind:"agent",id:t.id,
label:t.agent||n("agent"),sessionKey:t.parent||e.sessionKey})}function An(e,t,n){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow\
_failed",{name:t.name})),kt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function Bn(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function Kn(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function $n(e){let t=null,n=-1;for(let o of e){let i=o.last_touched_turn??0;i>n&&(n=i,t=o)}return t}function Ln(e,t){let n=e.next_steps?.find(i=>i.what?.trim())?.what?.trim();if(n)return n;let o=[...e.progress??[]].reverse().
find(i=>i.trim());return o?o.trim():e.initial_intent?.trim()||t("work_in_progress")}var Mn=3;function Pn(e,t,n){if(!t?.enabled)
return[];let o=t.intents??[];if(o.length===0)return[];let i=(e.source_links??[]).map(a=>({kind:a.kind==="issue"?"issue":
"change",id:a.url,label:a.kind==="issue"?`issue #${a.number}`:`${a.provider} #${a.number}`,url:a.url,sessionKey:e.key,status:so(
a)})),l=[],d=$n(o),w=!!(e.running||e.subagents_running||e.orchestrating)?[]:o.filter(a=>a.state==="in-progress");w.forEach(
a=>{let g=o.indexOf(a),h=(a.next_steps??[]).filter(W=>W.what?.trim());l.push({id:`unattended:${e.key}:${g}`,title:me(a.title,
e.title||n("untitled_work")),summary:h[0]?.what?.trim()||n("no_next_step"),state:"needs-you",issue:we(e),updatedAt:P(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:mt(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:we(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.
key},...i],nextSteps:h,progress:(a.progress??[]).filter(W=>W.trim()),stale:!!t.stale,lastTouchedTurn:a.last_touched_turn??
0})}),o.forEach((a,g)=>{if(w.includes(a))return;let h=Bn(a,e);if(!h)return;let W=(a.next_steps??[]).filter(k=>k.what?.trim());
l.push({id:`intent:${e.key}:${g}`,title:me(a.title,e.title||n("untitled_work")),summary:Ln(a,n),state:h,issue:!1,updatedAt:P(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:mt(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:we(
e)||void 0,unverified:a.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untit\
led_work"),sessionKey:e.key},...i],nextSteps:W,progress:(a.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:a.
last_touched_turn??0,moving:Kn(a,e,d)||void 0})});let x=l.filter(a=>a.state==="needs-you"),v=l.filter(a=>a.state!=="need\
s-you").sort((a,g)=>(g.lastTouchedTurn??0)-(a.lastTouchedTurn??0));return[...x,...v].slice(0,Math.max(Mn,x.length))}var lo=new Set(
["crew-manager-conductor","overwatch-conductor"]),En={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Tn=3;function On(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Ze=5;function co(e,t,n=Date.now()){let o=xt(e),i=mo(
e.filter(d=>d.state==="needs-you"),n),l=[`Fleet: ${o["needs-you"]} waiting on the user, ${o.running} in progress, ${o.done}\
 finished recently.`];return i.length===0?(l.push("Nothing is waiting on the user."),l):(l.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Ze,i.length)}):`),i.slice(0,Ze).forEach((d,c)=>{let w=Ke(ie(d,n),t),x=d.sessionKey?
` [session ${d.sessionKey}]`:"";l.push(`${c+1}. ${d.title} \u2014 ${d.summary} (${w})${x}`)}),i.length>Ze&&l.push(`\u2026and ${i.
length-Ze} more waiting.`),l)}var wt=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),Jt=.6,Xt=2;function ht(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!wt.has(t)))]}function et(e,t){let n=ht(e),o=ht(t);if(n.length<Xt||o.length<Xt)return 0;
let i=n.length<=o.length?n:o,l=new Set(n.length<=o.length?o:n);return i.filter(c=>l.has(c)).length/i.length}function Qt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Zt(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function eo(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function Ue(e,t){
if(Qt(e).find(i=>Qt(t).includes(i)))return"same_change";if(Zt(e).find(i=>Zt(t).includes(i)))return"same_artifact";if(et(
e.title,t.title)>=Jt)return"same_topic";for(let i of eo(e))for(let l of eo(t))if(et(i,l)>=Jt)return"same_step";return null}
var tt={merged:[],split:[]};function to(e){return`${e.sessionKey??e.id}|${ht(e.title).join(" ")}`}function he(e,t){return[
to(e),to(t)].sort().join("")}function zn(e,t=tt){let n=e.filter(o=>o.state!=="done"&&o.sessionKey).sort((o,i)=>(o.updatedAt||
0)-(i.updatedAt||0));for(let o=1;o<n.length;o+=1){let i=n[o];for(let l=0;l<o;l+=1){let d=n[l];if(d.sessionKey===i.sessionKey||
t.split.includes(he(i,d)))continue;let c=Ue(i,d);if(c){i.duplicateOf={sessionKey:d.sessionKey,title:d.title,because:c};break}}}
Dn(n,t)}var ft=3,oo=["same_change","same_artifact","same_topic","same_step"];function Dn(e,t){for(let n of e){let o=[],i=new Set;
for(let l of e){let d=l.sessionKey;if(d===n.sessionKey||i.has(d)||t.split.includes(he(n,l)))continue;let c=Ue(n,l);c&&(i.
add(d),o.push({sessionKey:d,title:l.title,because:c}))}o.length!==0&&(o.sort((l,d)=>oo.indexOf(l.because)-oo.indexOf(d.because)),
n.relatedSessions=o.slice(0,ft),o.length>ft&&(n.relatedMore=o.length-ft))}}var qn=3e4;function uo(e,t,n=Date.now()){return Object.
keys(t).length===0?e:e.map(o=>{let i=t[o.id];return!i||n-i>qn||o.state==="running"?o:{...o,state:"running",moving:!0,instructed:!0}})}
function ie(e,t=Date.now()){let n=[],o=(l,d,c=1)=>{n.push({signal:l,weight:En[l]*c,values:d})};e.approvalKind==="subagen\
t"?o("subagent_gate"):e.approvalKind==="tool"&&o("approval_owed"),e.action==="reply"&&o("input_requested"),e.unverified&&
o("unverified_completion"),e.loopRepeats&&o("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&o("run_failed"),e.
stalledFor&&o("stalled",{duration:Be(e.stalledFor)}),e.changeBlocked&&o("change_blocked"),e.unattendedGoals&&o("nobody_o\
n_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&o("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,
3));let i=On(e,t);return i>0&&o("waiting_a_while",{hours:String(i)},Math.min(i,Tn)),n.sort((l,d)=>d.weight-l.weight),{score:n.
reduce((l,d)=>l+d.weight,0),signals:n}}var Gn={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",
unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"\
followup"};function ot(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let n of ie(e,t).signals){let o=Gn[n.signal];
if(o)return o}return null}var po=14400*1e3;function go(e,t,n,o=Date.now()){let i=0,l=[];for(let d of e){if(d.state!=="ne\
eds-you"){l.push(d);continue}let c=t[d.id];if(c&&c>o){i+=1;continue}let w=n[d.id];if(w!==void 0&&d.updatedAt<=w){l.push(
{...d,state:"done",issue:!1});continue}l.push(d)}return{items:l,snoozedCount:i}}var Fn=4320*60*1e3;function fo(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=Fn}var jn={"needs-you":1,running:-1,done:-1};function Un(e,t,n){
let o=e.updatedAt>0,i=t.updatedAt>0;return!o&&!i?0:o?i?(e.updatedAt-t.updatedAt)*n:-1:1}function Ke(e,t){let n=e.signals.
slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(i=>t(`rank_${i.signal}`,i.values)).join(t("rank_join"))}
function mo(e,t=Date.now()){let n=new Map(e.map(o=>[o.id,ie(o,t)]));return[...e].sort((o,i)=>{let l=Vt[o.state]-Vt[i.state];
if(l!==0)return l;if(o.state==="needs-you"){let d=(n.get(i.id)?.score??0)-(n.get(o.id)?.score??0);if(d!==0)return d}else if(o.
issue!==i.issue)return o.issue?-1:1;return Un(o,i,jn[o.state])})}function wo(e,t,n={},o={},i={},l=tt,d=Date.now()){let c=new Map,
w=new Map;for(let a of e.slots){if(!a.key||lo.has(a.key)||a.memory_mode==="incognito")continue;let g=Pn(a,n[a.key],t);if(g.
length>0){for(let k of g)c.set(k.id,k);let W=g.find(k=>k.state==="needs-you")??g[0];w.set(a.key,W);continue}let h=In(a,t);
c.set(h.id,h),w.set(a.key,h)}for(let[a,g]of Object.entries(o)){let h=w.get(a);h&&(h.state="needs-you",h.issue=!0,h.stalledFor=
g.silent_secs,h.summary=g.reason?t("stalled_because",{reason:g.reason,duration:Be(g.silent_secs)}):t("stalled_for",{duration:Be(
g.silent_secs)}),h.action="open")}for(let[a,g]of Object.entries(i)){let h=w.get(a);h&&(h.state="needs-you",h.issue=!0,h.
loopRepeats=g.repeats,h.summary=t("error_loop",{tool:g.tool,repeats:String(g.repeats)}),h.action="open")}for(let a of e.
approvals){let g=a.slot?w.get(a.slot):void 0;if(g){Cn(g,a,t);continue}c.set(`approval:${a.id}`,{id:`approval:${a.id}`,title:me(
a.tool||a.source,t("approval_needed")),summary:a.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:P(
a.ts),provenance:t("approval"),action:"review-approval",approvalKind:io(a)?"subagent":"tool",permissionId:a.id,permissionTool:a.
tool||a.source,permissionPurpose:a.tool_purpose,references:[{kind:"approval",id:a.id,label:a.tool||a.source||t("approval")}]})}
for(let a of e.agents){let g=a.parent?w.get(a.parent):void 0;if(g){Wn(g,a,t);continue}let h=!!(a.done&&(a.error||a.outcome===
"failed"));a.parent&&!h||c.set(`agent:${a.id}`,{id:`agent:${a.id}`,title:me(a.task||a.agent,t("agent_work")),summary:h?a.
error?.trim()||t("agent_failed",{task:a.task}):a.done?t("agent_done"):t("work_in_progress"),state:h?"needs-you":a.done?"\
done":"running",issue:h,runFailed:h||void 0,retryPath:h&&!a.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(a.
id)}/retry`:void 0,updatedAt:P(a.started),provenance:a.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:a.
id,label:a.agent||t("agent")}]})}for(let a of e.workflows){let g=a.session_key?w.get(a.session_key):void 0;if(g){An(g,a,
t);continue}let h=a.status==="failed";c.set(`workflow:${a.run_id}`,{id:`workflow:${a.run_id}`,title:me(a.name,a.run_id),
summary:h?t("workflow_failed_generic"):a.status==="running"?t("workflow_running"):t("workflow_finished"),state:h?"needs-\
you":a.status==="running"?"running":"done",issue:h,runFailed:h||void 0,retryPath:h?`/api/workflows/runs/${encodeURIComponent(
a.run_id)}/rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:a.run_id,
label:a.name||a.run_id}]})}for(let a of e.crons){if(!a.is_running&&a.last_status!=="error")continue;let g=a.last_status===
"error",h=bn(a,d),W=t(g?"monitor_failed":"monitor_running");c.set(`monitor:${a.id}`,{id:`monitor:${a.id}`,title:a.name,summary:h?
`${W} ${t("monitor_next_check",{duration:h})}`:W,state:g?"needs-you":"running",issue:g,runFailed:g||void 0,retryPath:g?`\
/api/crons/${encodeURIComponent(a.id)}/run`:void 0,updatedAt:P(a.running_since||a.last_run_ts||a.created_ts),provenance:t(
"monitor"),action:g?"discuss":void 0,references:[{kind:"monitor",id:a.id,label:a.name}]})}for(let a of e.loops||[]){if(!a.
active)continue;let g=String(a.id||"");if(!g)continue;let h=Math.max(0,Number(a.cycle_count)||0),W=Math.max(0,Number(a.max_cycles)||
0),k=a.slot_key&&w.has(a.slot_key)?a.slot_key:void 0;c.set(`loop:${g}`,{id:`loop:${g}`,title:me(a.message||"",t("loop")),
summary:W?t("loop_watching_capped",{cycles:String(h),cap:String(W)}):t("loop_watching",{cycles:String(h)}),state:"runnin\
g",issue:!1,updatedAt:P(a.last_fire_ts||a.created_ts),sessionKey:k,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(
g)}`,action:k?"open":void 0,references:[{kind:"monitor",id:g,label:t("loop"),sessionKey:k},...k?[{kind:"session",id:k,label:w.
get(k)?.title||k,sessionKey:k}]:[]]})}let x=[...e.artifacts].sort((a,g)=>P(g.updated_at)-P(a.updated_at)).slice(0,8);for(let a of x){
let g=a.session_key&&w.has(a.session_key)?a.session_key:void 0;c.set(`artifact:${a.slug}`,{id:`artifact:${a.slug}`,title:me(
a.name,t("artifact")),summary:a.description||t("artifact_ready",{kind:a.kind}),state:"done",issue:!1,updatedAt:P(a.updated_at||
a.created_at),sessionKey:g,provenance:a.session_title||a.source||t("artifact"),action:g?"open":void 0,references:[{kind:"\
artifact",id:a.slug,label:a.name,sessionKey:g},...g?[{kind:"session",id:g,label:a.session_title||g,sessionKey:g}]:[]]})}
let v=[...c.values()];return zn(v,l),mo(v)}function xt(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-y\
ou").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function ho(e){let t=[],n=new Map;for(let o of e){let i=o.sessionKey;if(!i)continue;let l=n.get(i);if(l){l.count+=1;continue}
let d=o.references.find(w=>w.kind==="session")?.label??o.provenance,c={sessionKey:i,label:d,leading:o,count:1};n.set(i,c),
t.push(c)}return t}function _t(e,t,n=tt){if(t==="pr")return Vn(e);if(t==="goal")return bt(e,n);let o=[],i=new Map;for(let l of e){
let d=l.sessionKey;if(!d){o.push({key:l.id,items:[l],header:null,sessionKey:null,changeRef:null});continue}let c=i.get(d);
if(c){c.items.push(l);continue}let w={key:d,items:[l],header:"session",sessionKey:l.sessionKey??null,changeRef:null};i.set(
d,w),o.push(w)}return o}function Vn(e){let t=[],n=new Map;for(let o of e){let i=o.references.filter(l=>l.kind==="change"||
l.kind==="issue");for(let l of i){let d=`${l.kind}:${l.id}`,c=n.get(d);if(c){c.items.push(o);continue}let w={key:d,items:[
o],header:"pr",sessionKey:null,changeRef:l};n.set(d,w),t.push(w)}}return t}function bt(e,t){let n=e.map((c,w)=>w),o=c=>{
for(;n[c]!==c;)n[c]=n[n[c]],c=n[c];return c},i=(c,w)=>{n[o(w)]=o(c)};for(let c=0;c<e.length;c+=1)for(let w=c+1;w<e.length;w+=
1){let x=e[c],v=e[w];if(!x.sessionKey||!v.sessionKey||x.sessionKey===v.sessionKey)continue;let a=he(x,v);t.split.includes(
a)||(t.merged.includes(a)||Ue(x,v))&&i(c,w)}let l=[],d=new Map;for(let c=0;c<e.length;c+=1){let w=o(c),x=d.get(w);if(x){
x.items.push(e[c]),x.header="goal";continue}let v={key:`goal:${e[c].id}`,items:[e[c]],header:null,sessionKey:null,changeRef:null};
d.set(w,v),l.push(v)}return l}function bo(e,t){let n=e.references.find(o=>o.kind==="session")?.label??"";for(let o of[e.
title,n,e.provenance]){let i=o.toLowerCase();for(let l of t)if(l.aliases.some(d=>d&&i.includes(d.toLowerCase())))return l.
name}return null}function yo(e,t){let n=t.flatMap(l=>l.aliases.map(d=>d.toLowerCase())),o=new Set(["workspace","workspac\
es","home","src","tmp","documents","desktop"]),i=new Map;for(let l of e){if(!l.key||lo.has(l.key)||l.memory_mode==="inco\
gnito")continue;let d=l.project;if(!d)continue;let c=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!c||o.has(
c.toLowerCase())||n.some(w=>c.toLowerCase().includes(w)||w.includes(c.toLowerCase()))||i.set(c,(i.get(c)??0)+1)}return[...i.
entries()].map(([l,d])=>({name:l,sessions:d})).sort((l,d)=>d.sessions-l.sessions)}function vo(e,t){let n=new Map;for(let l of e){
if(!l.sessionKey||bo(l,t)!==null)continue;let d=l.references.find(c=>c.kind==="session")?.label??"";for(let c of[l.title,
d]){let w=c.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);for(let x of[3,2])for(let v=0;v+
x<=w.length;v+=1){let a=w.slice(v,v+x);if(wt.has(a[0])||wt.has(a[x-1])||a[0].length<3||a[x-1].length<3)continue;let g=a.
join(" ");n.has(g)||n.set(g,new Set),n.get(g).add(l.sessionKey)}}}let o=[...n.entries()].map(([l,d])=>({phrase:l,sessions:d.
size})).filter(l=>l.sessions>=2);return o.filter(l=>!o.some(d=>d.phrase!==l.phrase&&d.phrase.includes(l.phrase)&&d.sessions>=
l.sessions)).sort((l,d)=>d.sessions-l.sessions||d.phrase.length-l.phrase.length).map(l=>({name:l.phrase.replace(/\p{L}+/gu,
d=>d[0].toUpperCase()+d.slice(1)),sessions:l.sessions}))}function no(e){return e.some(t=>t.state==="needs-you")?"needs-y\
ou":e.some(t=>t.state==="running")?"running":"done"}function ko(e,t=Date.now()){return e.issue?"crit":e.state==="needs-y\
ou"?ot(e,t)==="followup"?"idle":"warn":"good"}function Ve(e){let t=new Set,n=new Set,o=new Set,i=0,l=0,d=0,c=0,w=0;for(let x of e){x.sessionKey&&t.add(x.sessionKey);for(let v of x.
references)v.kind==="change"?n.add(v.id):v.kind==="issue"&&o.add(v.id);x.id.startsWith("workflow:")?i+=1:x.id.startsWith(
"monitor:")?l+=1:x.id.startsWith("agent:")&&(d+=1),x.state==="needs-you"&&(c+=1),x.updatedAt>w&&(w=x.updatedAt)}return{sessions:t.
size,prs:n.size,issues:o.size,loops:i,crons:l,agents:d,needsYou:c,lastActivityAt:w}}function xo(e){let t=e.find(o=>o.moving);
if(t)return t;let n=e.find(o=>o.state==="running");return n||[...e].sort((o,i)=>(i.updatedAt||0)-(o.updatedAt||0))[0]}function Yn(e){
let t=[],n=new Set;for(let o of e){let i=o.sessionKey;!i||n.has(i)||(n.add(i),t.push(o.references.find(l=>l.kind==="sess\
ion")?.label??o.provenance))}return t}function _o(e,t,n=tt){let o=new Map,i=[],l=new Map;for(let v of e){let a=bo(v,t);if(l.
set(v.id,a),a===null){i.push(v);continue}o.has(a)||o.set(a,[]),o.get(a).push(v)}let d=bt(i,n),c=new Map;for(let v of d)c.
set(v.items[0].id,v);let w=[],x=new Set;for(let v of e){let a=l.get(v.id)??null;if(a!==null){if(x.has(a))continue;x.add(
a);let h=o.get(a);w.push({key:`initiative:${a}`,name:a,status:no(h),sessions:Yn(h),blocks:bt(h,n)});continue}let g=c.get(
v.id);g&&w.push({key:g.key,name:null,status:no(g.items),sessions:[],blocks:[g]})}return w}function St(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function No(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,o)=>So(o)-So(n)).slice(0,12)}function So(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Ro(e,t){
let n={},o="unknown";for(let i of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(i.key)}/summary`);if(!l||typeof l!=
"object"){o="unsupported";break}if(l.enabled===!1){o="disabled";break}n[i.key]=l,o="available"}catch{o="unsupported";break}
return{summaries:n,support:o}}var Io=String.raw`
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
`;import{Fragment as Pe,jsx as r,jsxs as p}from"react/jsx-runtime";var Nt="crew-manager.snoozed",Bo="crew-manager.handled",
Ko="crew-manager.done-collapsed",Rt="crew-manager.goal-verdicts",$o="crew-manager.initiative-collapsed",Lo="crew-manager\
.split",Mo="crew-manager.tab",Po=40,is=25,ls=75;function be(e,t={}){try{let n=localStorage.getItem(e);return n?JSON.parse(
n):t}catch{return t}}function oe(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Yo(e,t=Date.now()){
if(!e)return null;let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let o=Math.round(n/60);if(o<60)return`${o}\
m ago`;let i=Math.round(o/60);return i<24?`${i}h ago`:`${Math.round(i/24)}d ago`}function Eo(e){return e?new Date(e).toLocaleTimeString(
[],{hour:"numeric",minute:"2-digit"}):""}function $e(e,t,n){return e<=0?null:`${e} ${e===1?t:n}`}function It(e,t=Date.now()){
let n=Ve(e),o=[$e(n.sessions,"session","sessions"),$e(n.prs,"PR","PRs"),$e(n.issues,"issue","issues"),$e(n.loops,"loop",
"loops"),$e(n.crons,"cron","crons"),$e(n.agents,"agent","agents")].filter(l=>!!l),i=Yo(n.lastActivityAt,t);return i&&o.push(
`last active ${i}`),o.join(" \xB7 ")}var Le="crew-manager-conductor",ds=5e3,cs={session:"Session",approval:"Approval",agent:"\
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
untitled_work:"Untitled work"};function X(e,t={}){return cs[e].replace(/\{\{(\w+)\}\}/g,(n,o)=>t[o]??"")}var us={followup:"\
FOLLOW UP",unblock:"UNBLOCK"},ce={"needs-you":"Needs you",running:"Running",done:"Done"},Ct={all:"All","needs-you":"Need\
s you",running:"Running",done:"Done"},To={all:"All",failing:"Failing",running:"Running",merged:"Merged"},ps={session:$t,
approval:Go,agent:Hn,workflow:es,monitor:Vo,artifact:Jn,change:Kt,issue:Zn};function ue({children:e,onActivate:t,...n}){
return r("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),
t())},children:e})}function Oo({label:e,count:t,subtitle:n}){return p("div",{className:"ow-section-header",children:[p("\
div",{className:"ow-section-heading",children:[r("h2",{className:"ow-section-title",children:e}),r("span",{className:"ow\
-section-count",children:t})]}),n&&r("p",{className:"ow-section-subtitle",children:n})]})}function Ho(e){if(e.state==="n\
eeds-you"){let t=ot(e);return t?r(F,{variant:"warn",className:"ow-verb",children:us[t]}):null}return e.state==="running"?
e.moving?p(F,{variant:"aim",children:[r(Uo,{className:"ow-icon"}),ce[e.state]]}):r(F,{variant:"muted",children:"Queued"}):
p(F,{variant:"ok",children:[r(jo,{className:"ow-icon"}),ce[e.state]]})}function Jo({tool:e,purpose:t,busy:n,onAnswer:o,where:i}){return p("div",{className:"ow-permission",children:[p("div",{className:"\
ow-permission-body",children:[p("div",{className:"ow-permission-head",children:[r(Xn,{className:"ow-icon","aria-hidden":"\
true"}),r("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),p("p",{className:"ow-permi\
ssion-what",children:[i&&p("span",{className:"ow-truncate",children:[i," "]}),i?"wants to run ":"Wants to run ",r("code",
{children:e})]}),t&&r("p",{className:"ow-permission-why",children:t})]}),p("div",{className:"ow-permission-actions",children:[
r(T,{onClick:()=>o(!0),disabled:n,children:"Approve"}),r(T,{onClick:()=>o(!1),disabled:n,children:"Reject"})]})]})}function Ye({
children:e}){return r("div",{className:"ow-expand",children:r("div",{className:"ow-expand-inner",children:e})})}var Wt=3;
function zo(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function gs({
candidates:e,prominent:t,busy:n,onAdd:o}){let[i,l]=N(""),d=t?e:e.filter(c=>c.sessions>=2);return p("div",{className:"ow-\
bootstrap","data-prominent":t?"true":void 0,children:[r("div",{className:"ow-bootstrap-head",children:t?"No big goals de\
fined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&r("div",{className:"ow-bootstrap-sub",children:"\
Found in your unassigned work \u2014 click one to confirm it as a goal, or name your own."}),d.length>0&&r("div",{className:"\
ow-bootstrap-chips",children:d.slice(0,4).map(c=>p("button",{type:"button",className:"ow-bootstrap-chip",disabled:n,onClick:()=>o(
c.name,[c.name]),children:[c.name," ",p("span",{className:"ow-bootstrap-count",children:[c.sessions," session",c.sessions===
1?"":"s"]})]},c.name))}),p("div",{className:"ow-bootstrap-custom",children:[r(rs,{value:i,placeholder:"Or name a goal yo\
urself\u2026","aria-label":"New goal name",onChange:c=>l(c.target.value),onKeyDown:c=>{c.key==="Enter"&&i.trim()&&(o(i),
l(""))}}),r(T,{disabled:n||!i.trim(),onClick:()=>{o(i),l("")},children:"Add goal"})]})]})}function Do({members:e}){let t=e[0],
n=new Set(e.map(c=>c.sessionKey).filter(Boolean)).size,o=e.filter(c=>c.state==="needs-you").length,i=e.filter(c=>c.state===
"running").length,l=e.filter(c=>c.state==="done").length,d=[`${n} session${n===1?"":"s"}`];return o&&d.push(`${o} need${o===
1?"s":""} you`),i&&d.push(`${i} running`),l&&d.push(`${l} done`),p("div",{className:"ow-goal-digest",children:[t.summary&&
r("p",{className:"ow-digest-line",children:t.summary}),r("div",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}
function At({open:e,onToggle:t,label:n,flag:o,flagWarn:i,meta:l,header:d,action:c,children:w}){return p("div",{className:"\
ow-block ow-goalcard","data-grouped":"true","data-open":e?"true":void 0,children:[p("div",{className:"ow-goalcard-summar\
y",children:[t&&r("button",{type:"button",className:"ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":
"Expand"} ${n??"goal"}`,onClick:t,children:r(de,{className:"ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-h\
idden":"true"})}),d,c,r("span",{className:`ow-goal-flag${i?" ow-goal-flag-warn":""}`,children:o})]}),r("div",{className:"\
ow-goal-meta",children:l}),w]})}function fs({block:e,status:t,folded:n,onToggle:o,onSplit:i,selected:l,onSelect:d}){let c=e.
items[0],w=new Set(e.items.map(a=>a.sessionKey).filter(Boolean)).size,x=[];for(let a=0;a<e.items.length;a+=1)for(let g=a+
1;g<e.items.length;g+=1)e.items[a].sessionKey!==e.items[g].sessionKey&&x.push(he(e.items[a],e.items[g]));let v=p(Pe,{children:[
o&&r("button",{type:"button",className:"ow-goal-fold","aria-label":n?`Expand ${c.title}`:`Collapse ${c.title}`,"aria-exp\
anded":!n,onClick:a=>{a.stopPropagation(),o()},children:r(de,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"\
true","aria-hidden":"true"})}),r(nt,{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate ow-bloc\
k-name",children:c.title}),t&&r("span",{className:"ow-init-status","data-status":t,children:ce[t]}),p("span",{className:"\
ow-block-tab-meta",children:[r("span",{"aria-hidden":"true",children:"\xB7"}),p("span",{className:"ow-truncate",children:[
w," sessions, one goal"]})]}),i&&r(T,{className:"ow-block-open",title:"Not the same goal \u2014 split into separate cards",
"aria-label":`Split ${c.title}`,onClick:a=>{a.stopPropagation(),i(x)},children:"Split"})]});return d?r(ue,{onActivate:d,
className:"ow-block-tab ow-goal-tab","aria-pressed":l,"data-selected":l?"true":void 0,children:v}):r("div",{className:"o\
w-block-tab",children:v})}var ms=.3;function qo({item:e,items:t,onMerge:n}){let o=t.filter(i=>i.id!==e.id&&i.sessionKey&&
e.sessionKey&&i.sessionKey!==e.sessionKey).map(i=>({other:i,score:Ue(e,i)?1:et(e.title,i.title)})).filter(i=>i.score>=ms).
sort((i,l)=>l.score-i.score).slice(0,2);return o.length===0?null:p("div",{className:"ow-merge-hint",children:[r("span",{
className:"ow-merge-hint-label",children:"Same goal?"}),o.map(({other:i})=>p("button",{type:"button",className:"ow-merge\
-hint-btn ow-truncate",onClick:()=>n(he(e,i)),children:["Merge with \u201C",i.title,"\u201D"]},i.id))]})}function ws({item:e,
onOpen:t}){let n=e.references.find(i=>i.kind==="session"),o=e.references.filter(i=>i.kind!=="session");return p("div",{className:"\
ow-block-tab",children:[r($t,{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate ow-block-name",
children:n?.label??e.provenance}),p("span",{className:"ow-block-tab-meta",children:[r("span",{"aria-hidden":"true",children:"\
\xB7"}),r("span",{className:"ow-truncate",children:e.provenance}),o.slice(0,2).map(i=>r("span",{className:"ow-truncate",
children:i.label},`${i.kind}:${i.id}`))]}),r(T,{className:"ow-block-open",onClick:t,"aria-label":`Open ${n?.label??e.provenance}`,
children:"Open"})]})}function hs({session:e,selected:t,onSelect:n,onOpen:o}){return p(ue,{onActivate:n,className:"ow-sro\
w","data-selected":t,children:[r($t,{className:"ow-icon","aria-hidden":"true"}),p("div",{className:"ow-srow-body",children:[
r("div",{className:"ow-srow-name ow-truncate",children:e.label}),r("div",{className:"ow-srow-state ow-truncate",children:e.
leading.summary})]}),r("span",{className:"ow-srow-badge",children:Ho(e.leading)}),r(T,{className:"ow-srow-open","aria-la\
bel":`Open ${e.label}`,onClick:i=>{i.stopPropagation(),o()},children:"Open"})]})}function bs({reference:e,checks:t}){let n=e.
status?/fail|conflict|closed/.test(e.status):!1;return p("div",{className:"ow-pr-head",children:[p("div",{className:"ow-\
pr-head-top",children:[r("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&r("a",{className:"ow-bl\
ock-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,children:r(Kt,
{className:"ow-icon","aria-hidden":"true"})})]}),r("div",{className:"ow-pr-status-line",children:t?.available&&(t.total??
0)>0?p("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total," chec\
ks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&r("span",{className:"ow-pr-dot","data-bad":n?"\
true":void 0,children:e.status})})]})}function ys({reference:e,onOpenSession:t}){let n=ps[e.kind],o=p(Pe,{children:[r(n,
{className:"ow-icon"}),r("span",{className:"ow-truncate",children:e.label})]});return e.url?r("a",{className:"ow-referen\
ce ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:i=>i.stopPropagation(),children:o}):e.
sessionKey?r(ue,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:o}):r("span",{className:"\
ow-reference",children:o})}function Bt({item:e,selected:t,continuation:n,whyRanked:o,onSelect:i,onOpenSession:l,onAnswerPermission:d,
permissionBusy:c,onRetry:w,retryBusy:x,onStop:v,stopBusy:a,onPickStep:g,onSnooze:h,onHandled:W,hideBadge:k,compact:I,headless:B,
dot:q,simple:E}){let[K,Ee]=N(!1);return p(ue,{onActivate:i,className:"ow-row","aria-pressed":t,"data-selected":t,"data-i\
nstructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.id}`,children:[p(
"div",{className:"ow-row-layout",children:[p("div",{className:"ow-row-content",children:[!B&&p("div",{className:"ow-row-\
heading",children:[q&&r("span",{className:`ow-dot ow-dot-${q}`,"aria-hidden":"true"}),!E&&(k?e.state==="done"&&r(Fo,{className:"\
ow-icon ow-row-check","aria-hidden":"true"}):Ho(e)),r("span",{className:"ow-row-title",children:e.title})]}),(!I&&!E||t)&&
e.summary&&!(e.nextSteps??[]).some(R=>R.what?.trim()===e.summary)&&r("p",{className:"ow-row-summary",children:e.summary}),
e.duplicateOf&&(!E||t)&&p(ue,{className:"ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[r(nt,{className:"\
ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:X(`duplicate_${e.duplicateOf.because}`,{title:e.
duplicateOf.title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&r(Ye,{children:p("div",{className:"ow-related",
children:[r("span",{className:"ow-related-label",children:X("related_sessions",{count:String(e.relatedSessions.length)})}),
e.relatedSessions.map(R=>p(ue,{className:"ow-related-row",onActivate:()=>l(R.sessionKey),children:[r(nt,{className:"ow-i\
con","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:R.title}),r("span",{className:"ow-related-why",children:X(
`related_${R.because}`)})]},R.sessionKey)),e.relatedMore?r("span",{className:"ow-related-more",children:X("related_more",
{count:String(e.relatedMore)})}):null]})}),o&&(!E||t)&&r("div",{className:"ow-row-why",children:o}),!n&&(!E||t)&&p("div",
{className:"ow-row-meta",children:[r("span",{className:"ow-truncate",children:e.provenance}),zo(e).length>0&&r("span",{"\
aria-hidden":"true",children:"\xB7"}),r("span",{className:"ow-references",children:zo(e).slice(0,3).map(R=>r(ys,{reference:R,
onOpenSession:l},`${R.kind}:${R.id}`))})]})]}),r("div",{className:"ow-row-actions",children:r(de,{className:"ow-icon","a\
ria-hidden":"true"})})]}),t&&g&&e.nextSteps&&e.nextSteps.length>0&&r(Ye,{children:p("div",{className:"ow-row-steps",children:[
r("div",{className:"ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,K?void 0:Wt).map((R,Y)=>r("butt\
on",{type:"button",className:"ow-quote-step",title:R.why??R.what,onClick:ye=>{ye.stopPropagation(),g(R.what)},children:R.
what},`${Y}:${R.what}`)),e.nextSteps.length>Wt&&r("button",{type:"button",className:"ow-steps-more",onClick:R=>{R.stopPropagation(),
Ee(Y=>!Y)},children:K?"Show fewer":`+${e.nextSteps.length-Wt} more`})]})}),t&&e.retryPath&&w&&r(Ye,{children:r("div",{className:"\
ow-retry",children:r(T,{onClick:()=>w(e.retryPath),disabled:!!x,children:"Retry"})})}),t&&e.stopPath&&v&&r(Ye,{children:r(
"div",{className:"ow-retry",children:r(T,{onClick:()=>v(e.stopPath),disabled:!!a,children:a?"Stopping\u2026":"Stop this \
loop"})})}),t&&e.permissionId&&d&&r(Ye,{children:r(Jo,{tool:e.permissionTool||"a tool",purpose:e.permissionPurpose,busy:!!c,
onAnswer:R=>d(e.permissionId,R)})}),e.state==="needs-you"&&h&&W&&p("div",{className:"ow-row-aside",children:[r("button",
{type:"button",className:"ow-aside-btn",onClick:R=>{R.stopPropagation(),h(e.id)},children:"Later"}),r("button",{type:"bu\
tton",className:"ow-aside-btn",onClick:R=>{R.stopPropagation(),W(e.id,e.updatedAt)},children:"Handled"})]})]})}var vs=["\
unblock","followup","running","done"],ks={unblock:{label:"UNBLOCK",cls:"ow-lane-unblock"},followup:{label:"FOLLOW UP",cls:"\
ow-lane-followup"}};function xs(e){return e.state==="done"?"done":e.state==="running"?"running":ot(e)??"unblock"}function _s({
items:e,selectedId:t,onSelect:n,onOpenSession:o,onAnswerPermission:i,permissionBusy:l,onRetry:d,retryBusy:c,onPickStep:w,
onSnooze:x,onHandled:v,doneTitles:a}){let[g,h]=N(!1),W=new Map;for(let k of e){let I=xs(k),B=W.get(I);B?B.push(k):W.set(
I,[k])}return p(Pe,{children:[vs.filter(k=>W.has(k)).map(k=>{let I=W.get(k),B=k==="unblock"||k==="followup"?ks[k]:null,q=B?
I.map(K=>K.action!=="resume"?Ke(ie(K),X):""):[],E=B&&q.length>0&&q.every(K=>K&&K===q[0])?q[0]:void 0;return p("div",{className:"\
ow-lane",children:[B&&p("div",{className:"ow-lane-head",children:[r("span",{className:`ow-lane-badge ${B.cls}`,children:B.
label}),E&&r("span",{className:"ow-lane-reason",children:E})]}),I.map(K=>r(Bt,{item:K,hideBadge:!0,compact:!0,selected:t===
K.id,continuation:!0,whyRanked:E?void 0:K.state==="needs-you"&&K.action!=="resume"?Ke(ie(K),X):void 0,onSelect:()=>n(K),
onOpenSession:o,onAnswerPermission:i,permissionBusy:l,onRetry:d,retryBusy:c,onPickStep:w,onSnooze:x,onHandled:v},K.id))]},
k)}),!W.has("done")&&a&&a.length>0&&p("div",{className:"ow-lane ow-lane-done",children:[p("button",{type:"button",className:"\
ow-goals-toggle","aria-expanded":g,onClick:()=>h(k=>!k),children:[r(de,{className:"ow-icon","data-open":g?"true":void 0,
"aria-hidden":"true"}),a.length," done"]}),g&&r("ul",{className:"ow-done-list",children:a.map(k=>p("li",{className:"ow-r\
ow-goal-done",children:[r(Fo,{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-truncate",children:k})]},
k))})]})]})}function Me({title:e,items:t,selectedId:n,onSelect:o,onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,
retryBusy:w,onStop:x,stopBusy:v,onPickStep:a,onSnooze:g,onHandled:h,footer:W,collapsed:k,onToggleCollapsed:I,groupBy:B,prChecks:q,
prFilter:E,doneBySession:K,goalVerdicts:Ee,onSplitGoal:R,onMergeGoal:Y,initiativeBlocks:ye,collapsedInitiatives:Te,onToggleInitiative:Oe,
selectedGoalKey:ve,onSelectGoal:ke,subtitle:ze,emptyLabel:j}){let De=_t(t,B,Ee),U=B==="pr"&&E&&E!=="all"?De.filter(b=>b.
changeRef&&yt(b.changeRef,q?.[b.changeRef.url??""])===E):De,xe=ye??[],H=B==="goal"?xe.length:B==="pr"?U.length:t.length,
He=b=>p("div",{className:"ow-block","data-grouped":b.header?"true":void 0,children:[b.header==="session"&&b.sessionKey&&
r(ws,{item:b.items[0],onOpen:()=>i(b.sessionKey)}),b.header==="pr"&&b.changeRef&&r(bs,{reference:b.changeRef,checks:q?.[b.
changeRef.url??""]}),b.header==="goal"&&r(fs,{block:b,onSplit:R,selected:ve===b.key,onSelect:ke?()=>ke(b.key):void 0}),b.
header==="pr"?p(Pe,{children:[r("div",{className:"ow-pr-sublabel",children:"Sessions on this PR"}),ho(b.items).map(_=>r(
hs,{session:_,selected:n===_.leading.id,onSelect:()=>o(_.leading),onOpen:()=>i(_.sessionKey)},_.sessionKey))]}):b.header===
"session"?r(_s,{items:b.items,doneTitles:b.sessionKey?K?.[b.sessionKey]:void 0,selectedId:n,onSelect:o,onOpenSession:i,onAnswerPermission:l,
permissionBusy:d,onRetry:c,retryBusy:w,onPickStep:a,onSnooze:g,onHandled:h}):b.items.map(_=>p(Co,{children:[r(Bt,{item:_,
selected:n===_.id,continuation:b.header==="session",whyRanked:_.state==="needs-you"&&_.action!=="resume"?Ke(ie(_),X):void 0,
onSelect:()=>o(_),onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:w,onStop:x,stopBusy:v,onPickStep:a,
onSnooze:g,onHandled:h}),B==="goal"&&Y&&n===_.id&&r(qo,{item:_,items:t,onMerge:Y})]},_.id))]},b.key),_e=b=>p(Co,{children:[
r(Bt,{item:b,selected:n===b.id,dot:ko(b),simple:!0,whyRanked:b.state==="needs-you"&&b.action!=="resume"?Ke(ie(b),X):void 0,
onSelect:()=>o(b),onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:w,onPickStep:a,onSnooze:g,onHandled:h}),
Y&&n===b.id&&r(qo,{item:b,items:t,onMerge:Y})]},b.id),Je=b=>{if(b.name){let O=Te?.[b.key]??b.status!=="needs-you",Q=b.blocks.
flatMap(se=>se.items),Z=Ve(Q);return r(At,{open:!O,onToggle:()=>Oe?.(b.key,!O),label:b.name,flag:Z.needsYou>0?`${Z.needsYou}\
 need you`:ce[b.status],flagWarn:Z.needsYou>0,meta:It(Q),header:r("span",{className:"ow-truncate ow-block-name ow-goalca\
rd-title",children:b.name}),children:O?r(Do,{members:Q}):Q.map(se=>_e(se))},b.key)}let _=b.blocks[0];if(_.header==="goal"){
let O=Te?.[b.key]??b.status!=="needs-you",Q=_.items[0],Z=Ve(_.items),se=[];for(let L=0;L<_.items.length;L+=1)for(let ee=L+
1;ee<_.items.length;ee+=1)_.items[L].sessionKey!==_.items[ee].sessionKey&&se.push(he(_.items[L],_.items[ee]));return r(At,
{open:!O,onToggle:()=>Oe?.(b.key,!O),label:`${new Set(_.items.map(L=>L.sessionKey).filter(Boolean)).size} sessions, one \
goal`,flag:Z.needsYou>0?`${Z.needsYou} need you`:ce[b.status],flagWarn:Z.needsYou>0,meta:It(_.items),header:p(ue,{onActivate:()=>ke?.(
_.key),className:"ow-goalcard-header ow-goal-tab","aria-pressed":ve===_.key,"data-selected":ve===_.key?"true":void 0,children:[
r(nt,{className:"ow-icon","aria-hidden":"true"}),p("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:[
new Set(_.items.map(L=>L.sessionKey).filter(Boolean)).size," sessions, one goal"]})]}),action:R&&r(T,{className:"ow-bloc\
k-open",title:"Not the same goal \u2014 split into separate cards","aria-label":`Split ${Q.title}`,onClick:L=>{L.stopPropagation(),
R(se)},children:"Split"}),children:O?r(Do,{members:_.items}):_.items.map(L=>_e(L))},b.key)}let ne=_.items[0],Se=Ve(_.items);
return r(At,{open:!0,flag:Se.needsYou>0?`${Se.needsYou} need you`:ce[ne.state],flagWarn:Se.needsYou>0,meta:It(_.items),header:r(
"span",{className:"ow-goalcard-title ow-goalcard-lone","aria-hidden":"true"}),children:_e(ne)},b.key)};return p("section",
{className:"ow-section","aria-label":e,children:[I?p(ue,{onActivate:I,className:"ow-section-toggle",children:[r(Oo,{label:e,
count:H,subtitle:ze}),r(de,{className:"ow-icon ow-section-chevron","data-open":k?void 0:"true","aria-hidden":"true"})]}):
r(Oo,{label:e,count:H,subtitle:ze}),k?null:r("div",{className:"ow-section-list",children:B==="goal"?xe.length===0?r("p",
{className:"ow-section-empty",children:j}):xe.map(Je):U.length===0?r("p",{className:"ow-section-empty",children:j}):U.map(
He)}),W]})}function Ss(e,t){let n=co(t,X);if(!e)return["Crew Manager context: workspace overview.",...n,"Answer the user\
 about the state of their work. This is a conversation, not an action channel."].join(`
`);let o=e.references.map(l=>`${l.kind}: ${l.label} (${l.id})`).join(`
`),i=[e.stalledFor?`Silent for ${Be(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(l=>!!l);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,
`State: ${ce[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...i.length>0?[`Why it is on the board:
${i.join(`
`)}`]:[],`References:
${o}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(l=>!!l).join(`
`)}function Ns(){let e=ts(),t=le(e);t.current=e;let n=os(),o=ns(),[i,l]=N("all"),[d,c]=N(()=>be(Mo,null)==="session"?"se\
ssion":"goal"),[w,x]=N("all"),[v,a]=N({}),[g,h]=N(null),[W,k]=N(null),[I,B]=N(null),[q,E]=N({}),[K,Ee]=N("unknown"),R=le(
"unknown"),Y=le(new Map),[ye,Te]=N({}),[Oe,ve]=N({}),[ke,ze]=N([]),[j,De]=N(null),[U,xe]=N(null),[H,He]=N(null),[_e,Je]=N(
()=>be(Nt)),[b,_]=N(()=>be(Bo)),[ne,Se]=N(()=>be(Rt,{merged:[],split:[]})),[O,Q]=N([]),[Z,se]=N(()=>be($o)),[L,ee]=N(null),
[Xo,Qo]=N(()=>be(Ko,null)??!0),[Lt,Mt]=N({}),[st,Zo]=N([]),[rt,Pt]=N(()=>be(Lo,null)??Po),[at,Et]=N(!1),Tt=le(!0),[en,Ot]=N(
!0),[zt,it]=N(null),[tn,on]=N(!1),[Dt,pe]=N(null),$=le(!0),qe=le(0),lt=le(!1);V(()=>($.current=!0,()=>{$.current=!1,qe.current+=
1}),[]);let M=z(async()=>{let s=++qe.current,u=t.current;try{let[f,m,y,S,Ae,Qe,A,ae]=await Promise.all([u.get("/api/chat\
/slots"),u.get("/api/approvals"),u.get("/api/spawn"),u.get("/api/workflows/runs"),u.get("/api/crons"),u.get("/api/artifa\
cts"),u.get("/api/autonudge").catch(()=>({loops:[]})),u.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!$.
current||s!==qe.current)return;B({slots:Array.isArray(f)?f:[],approvals:Array.isArray(m)?m:[],agents:Array.isArray(y.agents)?
y.agents:[],workflows:Array.isArray(S.runs)?S.runs:[],crons:Array.isArray(Ae.jobs)?Ae.jobs:[],artifacts:Array.isArray(Qe.
artifacts)?Qe.artifacts:[],loops:Array.isArray(A?.loops)?A.loops:[]}),Zo(Array.isArray(ae?.runs)?ae.runs:[]),it(null)}catch(f){
$.current&&s===qe.current&&it(f instanceof Error?f:new Error("Unable to load Crew Manager sources"))}finally{$.current&&
s===qe.current&&Ot(!1)}},[]);V(()=>{M();let s=window.setInterval(()=>{M()},ds);return()=>window.clearInterval(s)},[M]);let nn=()=>{
Ot(!0),it(null),M()};V(()=>{if(!I||R.current==="unsupported"||R.current==="disabled")return;let s=No(I.slots,Le).filter(
f=>Y.current.get(f.key)!==St(f));if(s.length===0)return;let u=!1;return(async()=>{let{summaries:f,support:m}=await Ro(s,
y=>t.current.get(y));if(!(u||!$.current)&&(R.current=m,Ee(m),m==="available")){for(let y of s)f[y.key]&&Y.current.set(y.
key,St(y));E(y=>({...y,...f}))}})(),()=>{u=!0}},[I]),V(()=>{if(!I||!Tt.current)return;let s=!1;return(async()=>{try{let u=await t.
current.get("/api/apps/crew-manager/stalls");if(s||!$.current)return;let f={};for(let y of u?.stalls??[])y?.key&&(f[y.key]=
y);Te(f);let m={};for(let y of u?.error_loops??[])y?.key&&(m[y.key]=y);Mt(m)}catch{Tt.current=!1,$.current&&(Te({}),Mt({}))}})(),
()=>{s=!0}},[I]),V(()=>{let s=!1;return(async()=>{try{let u=await t.current.get("/api/apps/crew-manager/initiatives");if(s||
!$.current)return;Q((u?.initiatives??[]).filter(f=>f?.name))}catch{}})(),()=>{s=!0}},[]);let qt=D(()=>uo(wo(I??{slots:[],
approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},X,q,ye,Lt,ne),Oe),[I,q,ye,Lt,Oe,ne]),Xe=D(()=>go(qt,
_e,b),[qt,_e,b]),C=D(()=>Xe.items.filter(s=>fo(s)),[Xe]),dt=D(()=>xt(C),[C]),Gt=D(()=>{let s={};for(let u of C){if(u.state!==
"done"||!u.sessionKey)continue;let f=s[u.sessionKey];f?f.push(u.title):s[u.sessionKey]=[u.title]}return s},[C]),re=D(()=>C.
find(s=>s.id===g)??null,[C,g]),Ge=D(()=>i==="all"?C:C.filter(s=>s.state===i),[i,C]),ct=D(()=>{let s={all:0,failing:0,running:0,
merged:0};for(let u of _t(C,"pr")){if(!u.changeRef)continue;s.all++;let f=yt(u.changeRef,v[u.changeRef.url??""]);f!=="ot\
her"&&s[f]++}return s},[C,v]);V(()=>{let s=new Set;for(let f of C)for(let m of f.references)m.kind==="change"&&m.url&&/github\.com\/.+\/pull\//.
test(m.url)&&s.add(m.url);let u=!1;for(let f of s)v[f]||t.current.get(`/pr-checks?url=${encodeURIComponent(f)}`).then(m=>{
!u&&$.current&&a(y=>({...y,[f]:m}))}).catch(()=>{});return()=>{u=!0}},[C,v]),V(()=>o(dt["needs-you"]),[dt,o]),V(()=>{g&&
!C.some(s=>s.id===g)&&h(null)},[C,g]),V(()=>{oe(Mo,d)},[d]),V(()=>{oe(Lo,rt)},[rt]);let Ft=le(null);V(()=>{if(!at)return;
let s=f=>{let m=Ft.current?.getBoundingClientRect();if(!m||m.width===0)return;let y=(f.clientX-m.left)/m.width*100;Pt(Math.
max(is,Math.min(ls,y)))},u=()=>Et(!1);return window.addEventListener("mousemove",s),window.addEventListener("mouseup",u),
()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",u)}},[at]);let ut=I?.slots.find(s=>s.
key===Le),sn=!!(ut||tn);V(()=>{!I||ut||lt.current||(lt.current=!0,e.post("/api/chat/slots",{name:Le,title:"Conductor"}).
then(()=>{$.current&&(on(!0),M())}).catch(s=>{$.current&&(lt.current=!1,pe(s instanceof Error?`Conductor session could n\
ot be created: ${s.message}`:"Conductor session could not be created"))}))},[e,ut,M,I]);let jt=D(()=>ro(I?.approvals??[],
ke,s=>C.find(u=>u.sessionKey===s)?.title??I?.slots?.find(u=>u.key===s)?.title??s),[C,I,ke]),Ne=re&&!re.permissionId?re:null,
Fe=D(()=>_o(C,O,ne),[C,O,ne]),J=D(()=>{if(!L)return null;for(let s of Fe){let u=s.blocks.find(f=>f.key===L);if(u&&u.items.
length>0)return u}return null},[L,Fe]),G=J?xo(J.items):null,pt=D(()=>{let s=(I?.loops??[]).filter(m=>m&&m.active!==!1&&m.
slot_key);if(s.length===0)return[];let u=new Map,f=new Map;for(let m of C)for(let y of m.references)y.kind!=="session"||
!y.id||y.label&&!u.has(y.id)&&u.set(y.id,y.label);for(let m of Fe)if(m.name)for(let y of m.blocks)for(let S of y.items)S.
sessionKey&&!f.has(S.sessionKey)&&f.set(S.sessionKey,m.name);return s.map(m=>{let y=Number(m.cycle_count)||0,S=Number(m.
max_cycles)||0;return{key:m.slot_key,title:u.get(m.slot_key)??m.slot_key,goalName:f.get(m.slot_key)??null,progress:S>0?`${y}\
/${S}`:`${y} ${y===1?"cycle":"cycles"}`,remaining:S>0?Math.max(0,S-y):null,instruction:(m.message??"").replace(/\s+/g," ").
trim(),lastFire:P(m.last_fire_ts)}})},[I,C,Fe]),Re=D(()=>{let s=new Date;s.setHours(0,0,0,0);let u=s.getTime(),f=u+864e5,
m=I?.crons??[],y=new Map;for(let A of st){let ae=P(A.started_at);if(!A.job_id||ae<u||ae>=f)continue;let te=y.get(A.job_id)??
{count:0,failed:0,last:0};te.count+=1,A.status&&A.status!=="success"&&(te.failed+=1),te.last=Math.max(te.last,ae),y.set(
A.job_id,te)}let S=m.map(A=>{let ae=y.get(A.id),te=P(A.next_run_ts),hn=te>=u&&te<f;return{job:A,ran:ae,next:te,dueToday:hn}}).
filter(A=>A.ran||A.dueToday||A.job.is_running),Ae=S.filter(A=>A.ran&&A.ran.failed===0).length,Qe=S.filter(A=>A.ran&&A.ran.
failed>0).length;return{rows:S,done:Ae,failed:Qe,total:S.length,historyKnown:st.length>0}},[I,st]),[rn,Ut]=N(!1),an=D(()=>{
if(d!=="goal")return[];let s=yo(I?.slots??[],O),u=vo(C,O),f=new Set,m=[];for(let y of[...u,...s])f.has(y.name.toLowerCase())||
(f.add(y.name.toLowerCase()),m.push(y));return m.sort((y,S)=>S.sessions-y.sessions)},[d,I,C,O]),ln=z(async(s,u=[])=>{if(s.
trim()){Ut(!0);try{let f=await t.current.post("/api/apps/crew-manager/initiatives",{name:s.trim(),aliases:u});$.current&&
f?.initiatives&&Q(f.initiatives.filter(m=>m?.name))}catch{}finally{$.current&&Ut(!1)}}},[]),ge=z(async(s,u)=>{if(!j){De(
s),pe(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(s)}/${u?"approve":"reject"}`,{}),M()}catch(f){
pe(f instanceof Error?`Could not answer that request: ${f.message}`:"Could not answer that request"),M()}finally{$.current&&
De(null)}}},[M,j]),dn=z(s=>{Je(u=>{let f=Object.fromEntries(Object.entries(u).filter(([,m])=>m>Date.now()));return f[s]=
Date.now()+po,oe(Nt,f),f}),h(null)},[]),cn=z((s,u)=>{_(f=>{let m={...f,[s]:u};return oe(Bo,m),m}),h(null)},[]),un=z(()=>{
Je({}),oe(Nt,{})},[]),pn=z(s=>{Se(u=>{let f={merged:u.merged.filter(m=>!s.includes(m)),split:[...new Set([...u.split,...s])]};
return oe(Rt,f),f})},[]),gn=z(s=>{Se(u=>{let f={merged:[...new Set([...u.merged,s])],split:u.split.filter(m=>m!==s)};return oe(
Rt,f),f})},[]),fn=z(()=>{Qo(s=>(oe(Ko,!s),!s))},[]),Ie=z(async s=>{if(!U){xe(s),pe(null);try{await t.current.post(s,{}),
M()}catch(u){pe(u instanceof Error?`Could not re-run it: ${u.message}`:"Could not re-run it"),M()}finally{$.current&&xe(
null)}}},[M,U]),je=z(async s=>{if(!H){He(s),pe(null);try{await t.current.del(s),k("Stopped the monitor loop. Re-arming i\
t is done from the session itself."),M()}catch(u){let f=u instanceof Error?u.message:"";/404|not found/i.test(f)?k("That\
 loop had already stopped."):pe(f?`Could not stop it: ${f}`:"Could not stop it"),M()}finally{$.current&&He(null)}}},[M,H]),
fe=z(async s=>{if(J&&G?.sessionKey){let f=G.sessionKey,m=J.items.map(S=>`- ${S.references.find(Ae=>Ae.kind==="session")?.
label??S.sessionKey}: ${ce[S.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(f)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${J.items[0].title}", which spans sessions:`,m,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:f}).catch(S=>{if(!(S instanceof
SyntaxError))throw S}),!$.current)return;ve(S=>({...S,[G.id]:Date.now()})),ze(S=>S.includes(f)?S:[...S,f]);let y=G.references.
find(S=>S.kind==="session")?.label??G.title;k(G.moving||G.state==="running"?`Sent to ${y} \u2014 the active session on this g\
oal`:`Sent to ${y} \u2014 resuming the last session on this goal`),ee(null),M();return}let u=re&&!re.permissionId?re:null;
if(u?.sessionKey){let f=u.sessionKey;if(await t.current.post("/api/chat",{message:s,slot:f}).catch(m=>{if(!(m instanceof
SyntaxError))throw m}),!$.current)return;ve(m=>({...m,[u.id]:Date.now()})),ze(m=>m.includes(f)?m:[...m,f]),k(`Sent new i\
nstructions to ${u.title}`),h(null),M();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(Le)}/context`,
{content:Ss(re,C),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:s,slot:Le}).
catch(f=>{if(!(f instanceof SyntaxError))throw f})},[re,J,G,C,M]),gt={"needs-you":Ge.filter(s=>s.state==="needs-you"),running:Ge.
filter(s=>s.state==="running"),done:Ge.filter(s=>s.state==="done")},mn=z((s,u)=>{se(f=>{let m={...f,[s]:u};return oe($o,
m),m})},[]),wn=z(s=>{ee(u=>u===s?null:s),h(null),k(null)},[]),Ce=s=>n(`/chat?sid=${encodeURIComponent(s)}`),We=s=>{h(u=>u===
s.id?null:s.id),ee(null),k(null)};return p("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[
r("style",{children:Io}),r(as,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what\
 finished recently."}),r("div",{className:"ow-body",children:p("div",{className:"ow-layout",ref:Ft,children:[p("div",{className:"\
ow-main",style:{flexBasis:`${rt}%`},children:[p("section",{className:"ow-card ow-listcard","aria-label":"Work",children:[
p("div",{className:"ow-listcard-head",children:[r("div",{className:"ow-tabs",role:"tablist","aria-label":"View",children:[
"goal","session"].map(s=>r(T,{role:"tab","aria-selected":d===s,"data-selected":d===s,className:"ow-tab",onClick:()=>c(s),
children:s==="goal"?"Goals":"Sessions"},s))}),p("div",{className:"ow-listcard-tools",children:[r("p",{className:"ow-list\
card-sub",children:d==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each session need\
s from you"}),d==="session"&&r("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.
keys(Ct).map(s=>p(T,{onClick:()=>l(s),"aria-pressed":i===s,"data-selected":i===s,className:"ow-filter",children:[Ct[s],r(
"span",{className:"ow-count",children:dt[s]})]},s))})]})]}),r("main",{className:"ow-work",children:r("div",{className:"o\
w-work-inner",children:en?r(Wo,{rows:7}):zt&&!I?r(Ao,{icon:r(Go,{className:"ow-icon"}),title:"Crew Manager could not loa\
d the work view",subtitle:zt.message,action:r(T,{onClick:nn,children:"Try again"})}):(d==="goal"?C.length===0:Ge.length===
0)?r(Ao,{icon:r(Qn,{className:"ow-icon"}),title:"No matching work",subtitle:d==="goal"?"No sessions are running yet.":"C\
hange the filter to see sessions in another state."}):d==="goal"?r(Me,{title:"Work by goal",subtitle:"The same job acros\
s sessions, merged into one card",items:C,selectedId:g,onSelect:We,onOpenSession:Ce,onAnswerPermission:(s,u)=>{ge(s,u)},
permissionBusy:j!==null,onRetry:s=>{Ie(s)},retryBusy:U!==null,onPickStep:s=>{fe(s)},groupBy:d,goalVerdicts:ne,onSplitGoal:pn,
onMergeGoal:gn,initiativeBlocks:Fe,collapsedInitiatives:Z,onToggleInitiative:mn,selectedGoalKey:L,onSelectGoal:wn,footer:r(
gs,{candidates:an,prominent:O.length===0,busy:rn,onAdd:(s,u)=>{ln(s,u)}}),emptyLabel:"No matching work"}):i==="all"?p(Pe,
{children:[r(Me,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:gt["needs-you"],doneBySession:Gt,
selectedId:g,onSelect:We,onSnooze:dn,onHandled:cn,footer:Xe.snoozedCount>0?p("button",{type:"button",className:"ow-aside\
-note",onClick:un,children:[Xe.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:Ce,onAnswerPermission:(s,u)=>{
ge(s,u)},permissionBusy:j!==null,onRetry:s=>{Ie(s)},retryBusy:U!==null,onStop:s=>{je(s)},stopBusy:H!==null,onPickStep:s=>{
fe(s)},groupBy:d,emptyLabel:"Nothing needs your input right now."}),r(Me,{title:"In progress",subtitle:"Being worked on \
right now",items:gt.running,doneBySession:Gt,selectedId:g,onSelect:We,onOpenSession:Ce,onAnswerPermission:(s,u)=>{ge(s,u)},
permissionBusy:j!==null,onRetry:s=>{Ie(s)},retryBusy:U!==null,onStop:s=>{je(s)},stopBusy:H!==null,onPickStep:s=>{fe(s)},
groupBy:d,emptyLabel:"Nothing is in progress right now."}),r(Me,{title:"Done recently",subtitle:"Finished in the last fe\
w days",items:gt.done,selectedId:g,onSelect:We,collapsed:Xo,onToggleCollapsed:fn,onOpenSession:Ce,onAnswerPermission:(s,u)=>{
ge(s,u)},permissionBusy:j!==null,onRetry:s=>{Ie(s)},retryBusy:U!==null,onStop:s=>{je(s)},stopBusy:H!==null,onPickStep:s=>{
fe(s)},groupBy:d,emptyLabel:"No recent completed work."})]}):r(Me,{title:Ct[i],items:Ge,selectedId:g,onSelect:We,onOpenSession:Ce,
onAnswerPermission:(s,u)=>{ge(s,u)},permissionBusy:j!==null,onRetry:s=>{Ie(s)},retryBusy:U!==null,onStop:s=>{je(s)},stopBusy:H!==
null,onPickStep:s=>{fe(s)},groupBy:d,emptyLabel:"No matching work"})})})]}),p("div",{className:"ow-stack",children:[p("d\
etails",{className:"ow-card ow-stack-card",children:[p("summary",{children:[p("span",{className:"ow-stack-title",children:[
r(de,{className:"ow-icon ow-stack-chevron"}),r(Kt,{className:"ow-icon"}),"PRs"]}),p(F,{variant:"muted",children:[ct.all,
" open"]})]}),r("p",{className:"ow-stack-sub",children:"Open pull requests your work touches"}),r("div",{className:"ow-s\
tack-body",children:ct.all===0?r("p",{className:"ow-stack-empty",children:"No work is linked to a PR right now. Work lin\
ks to one when a session mentions its URL."}):p(Pe,{children:[r("div",{className:"ow-filters",role:"group","aria-label":"\
Filter by PR status",children:Object.keys(To).map(s=>p(T,{onClick:()=>x(s),"aria-pressed":w===s,"data-selected":w===s,className:"\
ow-filter",children:[To[s],r("span",{className:"ow-count",children:ct[s]})]},s))}),r(Me,{title:"Work by PR",items:C,prChecks:v,
prFilter:w,selectedId:g,onSelect:We,onOpenSession:Ce,onAnswerPermission:(s,u)=>{ge(s,u)},permissionBusy:j!==null,onRetry:s=>{
Ie(s)},retryBusy:U!==null,onStop:s=>{je(s)},stopBusy:H!==null,onPickStep:s=>{fe(s)},groupBy:"pr",emptyLabel:"No PR match\
es that status."})]})})]}),p("details",{className:"ow-card ow-stack-card",children:[p("summary",{children:[p("span",{className:"\
ow-stack-title",children:[r(de,{className:"ow-icon ow-stack-chevron"}),r(Vo,{className:"ow-icon"}),"Loops"]}),r(F,{variant:"\
muted",children:pt.length})]}),r("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),r(
"div",{className:"ow-stack-body",children:pt.length===0?r("p",{className:"ow-stack-empty",children:"No loop is running r\
ight now."}):pt.map(s=>{let u=Yo(s.lastFire),f=[u&&`last tick ${u}`,s.remaining!==null&&`${s.remaining} remaining`].filter(
Boolean).join(" \xB7 ");return p("div",{className:"ow-mini",children:[r("span",{className:"ow-mini-rail",style:{background:"\
var(--warn)"}}),p("div",{children:[p("div",{className:"ow-mini-title",children:[s.goalName??s.title,r("span",{className:"\
ow-mini-chip",children:s.progress})]}),s.instruction&&r("div",{className:"ow-mini-desc",title:s.instruction,children:s.instruction}),
f&&r("div",{className:"ow-mini-when",children:f})]}),r(F,{variant:"ok",children:"Active"})]},s.key)})})]}),p("details",{
className:"ow-card ow-stack-card",children:[p("summary",{children:[p("span",{className:"ow-stack-title",children:[r(de,{
className:"ow-icon ow-stack-chevron"}),r(Uo,{className:"ow-icon"}),"Scheduled tasks"]}),p(F,{variant:Re.failed>0?"err":"\
muted",children:[Re.done,"/",Re.total," today"]})]}),r("p",{className:"ow-stack-sub",children:Re.historyKnown?"Today's r\
uns only \u2014 jobs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be lo\
w"}),r("div",{className:"ow-stack-body",children:Re.rows.length===0?r("p",{className:"ow-stack-empty",children:"Nothing \
is scheduled for today."}):Re.rows.map(({job:s,ran:u,next:f,dueToday:m})=>{let y=!!(u&&u.failed>0),S=[u&&`ran today ${Eo(
u.last)}${u.count>1?` (${u.count}x)`:""}`,m&&f?`next ${Eo(f)}`:null].filter(Boolean).join(" \xB7 ");return p("div",{className:"\
ow-mini",children:[r("span",{className:"ow-mini-rail",style:{background:y?"var(--danger)":s.enabled===!1?"var(--muted)":
"var(--warn)"}}),p("div",{children:[r("div",{className:"ow-mini-title",children:s.name}),s.schedule&&p("div",{className:"\
ow-mini-desc",children:[s.schedule,s.cron_expr&&r("span",{className:"ow-mini-chip",children:s.cron_expr})]}),S&&r("div",
{className:"ow-mini-when",children:S})]}),s.is_running?r(F,{variant:"aim",children:"Running"}):y?r(F,{variant:"err",children:"\
Failed"}):s.enabled===!1?r(F,{variant:"muted",children:"Paused"}):u?r(F,{variant:"ok",children:"Success"}):r(F,{variant:"\
warn",children:"Pending"})]},s.id)})})]})]})]}),r("button",{type:"button",className:"ow-resizer","aria-label":"Resize co\
lumns","data-dragging":at?"true":void 0,onMouseDown:s=>{s.preventDefault(),Et(!0)},onDoubleClick:()=>Pt(Po)}),p("aside",
{className:"ow-conductor","aria-label":"Conductor",children:[r("div",{className:"ow-conductor-header",children:p("div",{
className:"ow-conductor-title",children:[r("h2",{children:"Conductor"}),!Ne&&r("span",{className:"ow-conductor-sub",children:"\
select work, or ask across all"})]})}),r("div",{className:"ow-chat",children:sn?p("div",{className:"ow-chat-panel",children:[
jt.length>0&&r("div",{className:"ow-permissions",role:"alert",children:jt.map(s=>r(Jo,{tool:s.tool,purpose:s.purpose,where:s.
sessionLabel,busy:j!==null,onAnswer:u=>{ge(s.id,u)}},s.id))}),W&&p("div",{className:"ow-conductor-receipt",role:"status",
children:[r(jo,{className:"ow-icon"}),W]}),Dt&&r("div",{className:"ow-chat-error",role:"alert",children:Dt}),r("div",{className:"\
ow-embed",children:r(ss,{slotKey:Le,frameless:!0,startAtBottom:!0,placeholder:J?"Instruction for this goal\u2026":Ne?.sessionKey?
"New instructions for this session\u2026":"Ask across your work\u2026",onSend:fe})}),J&&G?p("div",{className:"ow-quote o\
w-quote-docked",children:[p("div",{className:"ow-quote-body ow-quote-goal",children:[p("div",{className:"ow-quote-line",
children:[r("span",{className:"ow-eyebrow",children:"Instructing goal"}),r("span",{className:"ow-quote-title",title:J.items[0].
title,children:J.items[0].title})]}),p("span",{className:"ow-quote-route ow-truncate",children:["\u2192 ",G.references.find(
s=>s.kind==="session")?.label??G.title,G.moving||G.state==="running"?" (active)":" (will resume)"]})]}),r(T,{className:"\
ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{ee(null),k(null)},children:"Clear"})]}):Ne&&p("div",{
className:"ow-quote ow-quote-docked",children:[p("div",{className:"ow-quote-body",children:[r("span",{className:"ow-eyeb\
row",children:Ne.sessionKey?"Instructing":"Quoted"}),r("span",{className:"ow-quote-title",title:Ne.title,children:Ne.title})]}),
r(T,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{h(null),k(null)},children:"Clear"})]})]}):
r("div",{className:"ow-chat-loading",children:r(Wo,{rows:4})})})]})]})})]})}export{Ns as default};
