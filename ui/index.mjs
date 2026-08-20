import{useCallback as K,useEffect as U,useId as er,useMemo as F,useRef as G,useState as S}from"react";import{AlertTriangle as zn,
Bot as tr,Check as nr,ChevronRight as pe,Check as qn,Clock as or,Package as rr,ExternalLink as sr,MessageSquare as ar,RefreshCw as ir,
Shield as lr,Waves as Fn,Search as dr,Tag as cr,Users as It,Zap as ur}from"lucide-react";import{useAppApi as pr,useNavigate as gr,
useNavBadge as wr,ChatEmbed as fr}from"@kirocrew/app-sdk";import{Badge as Q,Btn as L,ContentSkeleton as Pn,EmptyState as En,
PageHeader as hr}from"@kirocrew/app-sdk/ui";function le(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),r=t%
60;return r===0?`${o} hour${o===1?"":"s"}`:`${o}h ${r}m`}function ho(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function dn(e,t,o){let r=new Set(t.filter(Boolean));if(r.size===0)return[];let a=new Set,
c=[];for(let d of e){let w=d.slot;!w||!r.has(w)||!d.id||a.has(d.id)||(a.add(d.id),c.push({id:d.id,sessionKey:w,sessionLabel:o(
w),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return c}var Yt=5,Vt={"needs-you":0,running:1,done:2};function M(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function mo(e,t){if(e.paused)
return"";let o=M(e.next_run_ts);if(!o)return"";let r=Math.round((o-t)/1e3);return r<=0?"":le(r)}var Jt=72;function ie(e,t){
let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let a=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(a.length<=Jt)return a;let c=a.slice(0,Jt),d=c.lastIndexOf(" ");return`${(d>24?c.slice(0,d):c).trim()}\u2026`}
function me(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var bo=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
xo=/^\((?:code|diff|widget|image)\)$/,vo=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
yo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,ko=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
_o=/[?？]["'”’)\]]*$/;function cn(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||xo.test(t)||bo.test(
t)?null:t}function pt(e){if(!e.waiting_for_input)return null;let t=cn(e);return!t||vo.test(t)||yo.test(t)?null:ko.test(t)||
_o.test(t)?t:null}function Qt(e){return e.pending_approval||pt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":"done"}function So(e,t){if(e.pending_approval)return t("approval_waiting");let o=pt(e);return o||(e.running||e.
subagents_running||e.orchestrating?t("work_in_progress"):me(e)?t("linked_change_issue"):cn(e)??t("recent_work_ready"))}function lt(e,t){
let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop()||t("session")}function Ro(e){
return e.pending_approval?"review-approval":pt(e)?"reply":"open"}function un(e){return(e.source_links??[]).map(t=>({number:String(
t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.kind==="issue"?`issue #${t.number}`:`${t.provider===
"gitlab"?"MR":"PR"} #${t.number}`,url:t.url,sessionKey:e.key,status:ho(t)}}))}function No(e,t){let o=un(e).map(r=>r.ref);
return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:So(e,t),state:Qt(e),moving:Qt(e)==="running"||void 0,
issue:me(e),updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lt(e,t),queuedBehind:e.queue_depth||
void 0,changeBlocked:me(e)||void 0,action:Ro(e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.
key},...o]}}function gt(e,t){e.references.some(o=>o.kind===t.kind&&o.id===t.id)||e.references.push(t)}function pn(e){return(e.
source||"").toLowerCase()==="subagent"}function Io(e,t,o){let r=pn(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,
M(t.ts)),e.summary=o(r?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=r?"subagent":"tool",e.action="review-a\
pproval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=t.tool_purpose,e.permissionInput=t.tool_input,
gt(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),sessionKey:t.slot||e.sessionKey})}function Co(e,t,o){
e.updatedAt=Math.max(e.updatedAt,M(t.started)),e.issue||=!!(t.done&&(t.error||t.outcome==="failed")),t.done?(t.error||t.
outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_failed",{task:t.task})):e.state!=="needs-you"&&(e.state=
"running",e.summary=o("work_in_progress")),gt(e,{kind:"agent",id:t.id,label:t.agent||o("agent"),sessionKey:t.parent||e.sessionKey})}
var Xt=160;function gn(e,t){let o=[],r=e.last_log?.trim(),a=e.phase?.trim();r&&o.push(t("workflow_fact_last_log",{log:r})),
a&&!(r&&r.toLowerCase().includes(a.toLowerCase()))&&o.push(t("workflow_fact_phase",{phase:a}));let c=e.error?.trim();c&&
o.push(t("workflow_fact_error",{error:wn(c)}));let d=e.agent_error_count??0;d>0&&o.push(t("workflow_fact_agent_errors",{
count:String(d)}));let w=e.partial_result_count??0;return w>0&&o.push(t("workflow_fact_partials",{count:String(w)})),o}function wn(e){
let t=/^([A-Za-z_][\w.]*)\((['"])([\s\S]*)\2,?\s*\)$/.exec(e.trim()),o=(t?t[3]:e).trim()||e.trim();return o.length>Xt?`${o.
slice(0,Xt-1)}\u2026`:o}function fn(e,t){if(e.status!=="failed")return[];let o=e.error?.trim(),r=e.name||e.run_id;return[
{what:t("workflow_step_diagnose",{name:r}),why:o?t("workflow_step_why_error",{error:wn(o)}):t("workflow_step_why_generic"),
expect:(e.partial_result_count??0)>0?t("workflow_step_expect_partials",{count:String(e.partial_result_count??0)}):t("wor\
kflow_step_expect_generic")}]}function Ao(e,t,o){e.issue||=t.status==="failed",t.status==="running"&&e.state!=="needs-yo\
u"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow_failed",{name:t.name}));let r=gn(
t,o);r.length>0&&(e.progress=[...e.progress??[],...r.filter(c=>!(e.progress??[]).includes(c))]);let a=fn(t,o);a.length>0&&
(e.nextSteps=[...e.nextSteps??[],...a.filter(c=>!(e.nextSteps??[]).some(d=>d.what===c.what))]),gt(e,{kind:"workflow",id:t.
run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function Wo(e,t){if(t.pending_approval)return"nee\
ds-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"dropped":return"done";case"in-progress":return"\
running";default:return null}}function To(e,t,o){return!(t.running||t.subagents_running||t.orchestrating)?!1:e===o}function Po(e){
let t=null,o=-1;for(let r of e){let a=r.last_touched_turn??0;a>o&&(o=a,t=r)}return t}function Eo(e,t){let o=e.next_steps?.find(a=>a.what?.trim())?.what?.trim();if(o)return o;let r=[...e.progress??[]].reverse().
find(a=>a.trim());return r?r.trim():e.initial_intent?.trim()||t("work_in_progress")}var Mo=3;function Bo(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function $o(e,t){if(!t)return!1;
let o=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${o}\\b`,"u").test(e)}function Zt(e,t){if(e.length===
0)return[];let o=Bo(t);return e.filter(r=>$o(o,r.number)).map(r=>r.ref)}function Ko(e,t,o){if(!t?.enabled)return[];let r=t.
intents??[];if(r.length===0)return[];let a=un(e),c=[],d=Po(r),m=!!(e.running||e.subagents_running||e.orchestrating)?[]:r.
filter(s=>s.state==="in-progress");m.forEach(s=>{let u=r.indexOf(s),g=(s.next_steps??[]).filter(k=>k.what?.trim());c.push(
{id:`unattended:${e.key}:${u}`,title:ie(s.title,e.title||o("untitled_work")),summary:g[0]?.what?.trim()||o("no_next_step"),
state:"needs-you",issue:me(e),updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lt(e,o),
queuedBehind:e.queue_depth||void 0,changeBlocked:me(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.key},...Zt(a,s)],nextSteps:g,initialIntent:s.initial_intent?.
trim()||void 0,progress:(s.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:s.last_touched_turn??0})}),
r.forEach((s,u)=>{if(m.includes(s))return;let g=Wo(s,e);if(!g)return;let k=(s.next_steps??[]).filter(x=>x.what?.trim());
c.push({id:`intent:${e.key}:${u}`,title:ie(s.title,e.title||o("untitled_work")),summary:Eo(s,o),state:g,issue:!1,updatedAt:M(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lt(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:me(
e)||void 0,unverified:s.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...Zt(a,s)],nextSteps:k,initialIntent:s.initial_intent?.trim()||void 0,progress:(s.progress??
[]).filter(x=>x.trim()),stale:!!t.stale,lastTouchedTurn:s.last_touched_turn??0,moving:To(s,e,d)||void 0})});let R=c.filter(
s=>s.state==="needs-you"),I=c.filter(s=>s.state!=="needs-you").sort((s,u)=>(u.lastTouchedTurn??0)-(s.lastTouchedTurn??0));
return[...R,...I].slice(0,Math.max(Mo,R.length))}var Do=new Set(["crew-manager-conductor","overwatch-conductor"]),Oo={approval_owed:100,
subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,stalled:50,
change_blocked:40,merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Lo=3;function zo(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Fe=5;function hn(e,t,o=Date.now()){let r=ft(e),a=Nn(
e.filter(d=>d.state==="needs-you"),o),c=[`Fleet: ${r["needs-you"]} waiting on the user, ${r.running} in progress, ${r.done}\
 finished recently.`];return a.length===0?(c.push("Nothing is waiting on the user."),c):(c.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Fe,a.length)}):`),a.slice(0,Fe).forEach((d,w)=>{let m=He(be(d,o),t),R=d.sessionKey?
` [session ${d.sessionKey}]`:"";c.push(`${w+1}. ${d.title} \u2014 ${d.summary} (${m})${R}`)}),a.length>Fe&&c.push(`\u2026and ${a.
length-Fe} more waiting.`),c)}var dt=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),en=.6,tn=2,mn=new Set;function ct(e){return[...new Set(e.toLowerCase().replace(
/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(t=>t.length>2&&!dt.has(t)))]}function nn(e,t){let o=ct(e),r=ct(t);if(o.length<
tn||r.length<tn)return 0;let a=o.length<=r.length?o:r,c=new Set(o.length<=r.length?r:o);return a.filter(w=>c.has(w)).length/
a.length}function on(e){return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function rn(e){return e.
references.filter(t=>t.kind==="artifact").map(t=>t.id)}function sn(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}
var qo=new Set(["pull request","pull requests","status update","work in progress","code review","follow up","next step",
"next steps","action item","action items","kiro crew","in progress","needs you"]);function ut(e){let t=new Set,o=e.match(
/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??[];for(let r of o){let a=r.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean).map(c=>c.length>3&&c.endsWith("s")&&!c.endsWith("ss")?c.slice(0,-1):c);for(;a.length&&
dt.has(a[0]);)a.shift();for(;a.length&&dt.has(a[a.length-1]);)a.pop();if(!(a.length<2))for(let c=a.length;c>=2;c-=1)for(let d=0;d+
c<=a.length;d+=1){let w=a.slice(d,d+c).join(" ");qo.has(w)||t.add(w)}}return[...t]}function Fo(e){let t=new Set;if(e.length<
Ho)return t;let o=new Map;for(let r of e)for(let a of ut(r.title))o.set(a,(o.get(a)??0)+1);for(let[r,a]of o)a/e.length>=
jo&&t.add(r);return t}var Ho=4,jo=.75;function bn(e,t,o=mn){if(on(e).find(d=>on(t).includes(d)))return"same_change";if(rn(
e).find(d=>rn(t).includes(d)))return"same_artifact";let c=ut(t.title).filter(d=>!o.has(d));if(ut(e.title).some(d=>c.includes(
d)))return"same_deliverable";if(nn(e.title,t.title)>=en)return"same_topic";for(let d of sn(e))for(let w of sn(t))if(nn(d,
w)>=en)return"same_step";return null}var xn={merged:[],split:[]};function an(e){return`${e.sessionKey??e.id}|${ct(e.title).
join(" ")}`}function vn(e,t){return[an(e),an(t)].sort().join("")}function Uo(e,t=xn){let o=e.filter(a=>a.state!=="done"&&
a.sessionKey).sort((a,c)=>(a.updatedAt||0)-(c.updatedAt||0)),r=Fo(o);for(let a=1;a<o.length;a+=1){let c=o[a];for(let d=0;d<
a;d+=1){let w=o[d];if(w.sessionKey===c.sessionKey||t.split.includes(vn(c,w)))continue;let m=bn(c,w,r);if(m){c.duplicateOf=
{sessionKey:w.sessionKey,title:w.title,because:m};break}}}Go(o,t,r)}var it=3,ln=["same_change","same_artifact","same_del\
iverable","same_topic","same_step"];function Go(e,t,o=mn){for(let r of e){let a=[],c=new Set;for(let d of e){let w=d.sessionKey;
if(w===r.sessionKey||c.has(w)||t.split.includes(vn(r,d)))continue;let m=bn(r,d,o);m&&(c.add(w),a.push({sessionKey:w,title:d.
title,because:m}))}a.length!==0&&(a.sort((d,w)=>ln.indexOf(d.because)-ln.indexOf(w.because)),r.relatedSessions=a.slice(0,
it),a.length>it&&(r.relatedMore=a.length-it))}}var Yo=3e4;function yn(e,t,o=Date.now()){return Object.keys(t).length===0?
e:e.map(r=>{let a=t[r.id];return!a||o-a>Yo||r.state==="running"?r:{...r,state:"running",moving:!0,instructed:!0}})}function be(e,t=Date.
now()){let o=[],r=(c,d,w=1)=>{o.push({signal:c,weight:Oo[c]*w,values:d})};e.approvalKind==="subagent"?r("subagent_gate"):
e.approvalKind==="tool"&&r("approval_owed"),e.action==="reply"&&r("input_requested"),e.unverified&&r("unverified_complet\
ion"),e.loopRepeats&&r("error_loop",{repeats:String(e.loopRepeats)}),e.changesRequested&&r("changes_requested"),e.runFailed&&
r("run_failed"),e.stalledFor&&r("stalled",{duration:le(e.stalledFor)}),e.assignedToYou&&r("assigned_to_you"),e.changeBlocked&&
r("change_blocked"),e.mergeReady&&r("merge_ready"),e.unattendedGoals&&r("nobody_on_it",{count:String(e.unattendedGoals)}),
e.queuedBehind&&r("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let a=zo(e,t);return a>0&&r(
"waiting_a_while",{hours:String(a)},Math.min(a,Lo)),o.sort((c,d)=>d.weight-c.weight),{score:o.reduce((c,d)=>c+d.weight,0),
signals:o}}var Vo={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unbl\
ock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"\
unblock",assigned_to_you:"followup",nobody_on_it:"followup"};function kn(e,t=Date.now()){if(e.state!=="needs-you")return null;
for(let o of be(e,t).signals){let r=Vo[o.signal];if(r)return r}return null}var _n=14400*1e3;function Sn(e,t,o,r=Date.now()){
let a=0,c=[];for(let d of e){if(d.state!=="needs-you"){c.push(d);continue}let w=t[d.id];if(w&&w>r){a+=1;continue}let m=o[d.
id];if(m!==void 0&&d.updatedAt<=m){c.push({...d,state:"done",issue:!1});continue}c.push(d)}return{items:c,snoozedCount:a}}
var wt=4320*60*1e3;function Rn(e,t=Date.now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=wt}var Jo={"ne\
eds-you":1,running:-1,done:-1};function Qo(e,t,o){let r=e.updatedAt>0,a=t.updatedAt>0;return!r&&!a?0:r?a?(e.updatedAt-t.
updatedAt)*o:-1:1}function He(e,t){let o=e.signals.slice(0,2);return o.length===0?t("rank_nothing_pressing"):o.map(a=>t(
`rank_${a.signal}`,a.values)).join(t("rank_join"))}function Nn(e,t=Date.now()){let o=new Map(e.map(r=>[r.id,be(r,t)]));return[
...e].sort((r,a)=>{let c=Vt[r.state]-Vt[a.state];if(c!==0)return c;if(r.state==="needs-you"){let d=(o.get(a.id)?.score??
0)-(o.get(r.id)?.score??0);if(d!==0)return d}else if(r.issue!==a.issue)return r.issue?-1:1;return Qo(r,a,Jo[r.state])})}
function In(e,t,o={},r={},a={},c=xn,d=Date.now()){let w=new Map,m=new Map;for(let s of e.slots){if(!s.key||Do.has(s.key)||
s.memory_mode==="incognito")continue;let u=Ko(s,o[s.key],t);if(u.length>0){for(let x of u)w.set(x.id,x);let k=u.find(x=>x.
state==="needs-you")??u[0];m.set(s.key,k);continue}let g=No(s,t);w.set(g.id,g),m.set(s.key,g)}if(e.assigned?.length){let s=new Map;
for(let h of w.values())for(let v of h.references)(v.kind==="change"||v.kind==="issue")&&v.url&&!s.has(v.url)&&s.set(v.url,
h);let u={changes_requested:0,conflict:1,checks_failing:2,ready_to_merge:3,assigned:4},g=new Map;for(let h of e.assigned){
if(!h?.url||s.has(h.url)||!(h.status in u))continue;let v=g.get(h.status);v?v.push(h):g.set(h.status,[h])}let k=[...g.entries()].
sort((h,v)=>(u[h[0]]??9)-(u[v[0]]??9)).map(h=>h[1]),x=[];for(let h=0;x.length<Yt;h+=1){let v=!1;for(let $ of k){if(x.length>=
Yt)break;let E=$[h];E&&(x.push(E),v=!0)}if(!v)break}let N=new Set(x.map(h=>h.url));for(let h of e.assigned){if(!h?.url||
!s.has(h.url)&&!N.has(h.url))continue;let v=h.kind==="issue"?"issue":"pull",$=h.status==="conflict"||h.status==="checks_\
failing",E=h.status==="changes_requested",H=h.status==="ready_to_merge",z=v==="issue",B=s.get(h.url);if(B){B.owned=v,$&&
(B.changeBlocked=!0,B.issue=!0),E&&(B.changesRequested=!0),H&&(B.mergeReady=!0),($||E||H)&&B.state==="done"&&(B.state="n\
eeds-you");continue}let W=$||E||H||z,D=v==="issue"?"owned_issue_assigned":h.status==="conflict"?"owned_pull_conflict":h.
status==="checks_failing"?"owned_pull_failing":h.status==="changes_requested"?"owned_pull_changes_requested":h.status===
"ready_to_merge"?"owned_pull_merge_ready":h.status==="checks_running"?"owned_pull_checks_running":"owned_pull_awaiting_r\
eview",X=v==="issue"?`issue #${h.number}`:`#${h.number}`;w.set(`owned:${h.url}`,{id:`owned:${h.url}`,title:h.title||X,summary:t(
D,{count:String(h.status==="checks_failing"?h.failing:h.pending)}),state:W?"needs-you":"running",issue:$,updatedAt:M(h.updated_at),
provenance:t("owned_provenance",{repo:h.repo}),references:[{kind:v==="issue"?"issue":"change",id:h.url,label:`${h.repo} ${X}`,
url:h.url,status:h.status==="awaiting_review"?void 0:h.status.replace(/_/g," ")}],action:void 0,owned:v,changeBlocked:$||
void 0,changesRequested:E||void 0,mergeReady:H||void 0,assignedToYou:z||void 0})}}for(let[s,u]of Object.entries(r)){let g=m.
get(s);g&&(g.state="needs-you",g.issue=!0,g.stalledFor=u.silent_secs,g.summary=u.reason?t("stalled_because",{reason:u.reason,
duration:le(u.silent_secs)}):t("stalled_for",{duration:le(u.silent_secs)}),g.action="open")}for(let[s,u]of Object.entries(
a)){let g=m.get(s);g&&(g.state="needs-you",g.issue=!0,g.loopRepeats=u.repeats,g.summary=t("error_loop",{tool:u.tool,repeats:String(
u.repeats)}),g.action="open")}for(let s of e.approvals){let u=s.slot?m.get(s.slot):void 0;if(u){Io(u,s,t);continue}w.set(
`approval:${s.id}`,{id:`approval:${s.id}`,title:ie(s.tool||s.source,t("approval_needed")),summary:s.tool_purpose||t("too\
l_call_waiting"),state:"needs-you",issue:!1,updatedAt:M(s.ts),provenance:t("approval"),action:"review-approval",approvalKind:pn(
s)?"subagent":"tool",permissionId:s.id,permissionTool:s.tool||s.source,permissionPurpose:s.tool_purpose,permissionInput:s.
tool_input,references:[{kind:"approval",id:s.id,label:s.tool||s.source||t("approval")}]})}for(let s of e.agents){let u=s.
parent?m.get(s.parent):void 0;if(u){Co(u,s,t);continue}let g=!!(s.done&&(s.error||s.outcome==="failed"));s.parent&&!g||w.
set(`agent:${s.id}`,{id:`agent:${s.id}`,title:ie(s.task||s.agent,t("agent_work")),summary:g?s.error?.trim()||t("agent_fa\
iled",{task:s.task}):s.done?t("agent_done"):t("work_in_progress"),state:g?"needs-you":s.done?"done":"running",issue:g,runFailed:g||
void 0,retryPath:g&&!s.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(s.id)}/retry`:void 0,updatedAt:M(s.started),
provenance:s.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:s.id,label:s.agent||t("agent")}]})}for(let s of e.
workflows){let u=s.session_key?m.get(s.session_key):void 0;if(u){Ao(u,s,t);continue}let g=s.status==="failed";w.set(`wor\
kflow:${s.run_id}`,{id:`workflow:${s.run_id}`,title:ie(s.name,s.run_id),summary:g?t("workflow_failed_generic"):s.status===
"running"?t("workflow_running"):t("workflow_finished"),state:g?"needs-you":s.status==="running"?"running":"done",issue:g,
runFailed:g||void 0,progress:gn(s,t),nextSteps:fn(s,t),retryPath:g?`/api/workflows/runs/${encodeURIComponent(s.run_id)}/\
rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:s.run_id,label:s.name||
s.run_id}]})}for(let s of e.crons){if(!s.is_running&&s.last_status!=="error")continue;let u=s.last_status==="error",g=mo(
s,d),k=t(u?"monitor_failed":"monitor_running");w.set(`monitor:${s.id}`,{id:`monitor:${s.id}`,title:s.name,summary:g?`${k}\
 ${t("monitor_next_check",{duration:g})}`:k,state:u?"needs-you":"running",issue:u,runFailed:u||void 0,retryPath:u?`/api/\
crons/${encodeURIComponent(s.id)}/run`:void 0,updatedAt:M(s.running_since||s.last_run_ts||s.created_ts),provenance:t("mo\
nitor"),action:u?"discuss":void 0,references:[{kind:"monitor",id:s.id,label:s.name}]})}for(let s of e.loops||[]){if(!s.active)
continue;let u=String(s.id||"");if(!u)continue;let g=Math.max(0,Number(s.cycle_count)||0),k=Math.max(0,Number(s.max_cycles)||
0),x=s.slot_key&&m.has(s.slot_key)?s.slot_key:void 0;w.set(`loop:${u}`,{id:`loop:${u}`,title:ie(s.message||"",t("loop")),
summary:k?t("loop_watching_capped",{cycles:String(g),cap:String(k)}):t("loop_watching",{cycles:String(g)}),state:"runnin\
g",issue:!1,updatedAt:M(s.last_fire_ts||s.created_ts),sessionKey:x,parentId:x?m.get(x)?.id:void 0,provenance:t("loop"),stopPath:`\
/api/autonudge/${encodeURIComponent(u)}`,action:x?"open":void 0,references:[{kind:"monitor",id:u,label:t("loop"),sessionKey:x},
...x?[{kind:"session",id:x,label:m.get(x)?.title||x,sessionKey:x}]:[]]})}let R=[...e.artifacts].sort((s,u)=>M(u.updated_at)-
M(s.updated_at)).slice(0,8);for(let s of R){let u=s.session_key&&m.has(s.session_key)?s.session_key:void 0;w.set(`artifa\
ct:${s.slug}`,{id:`artifact:${s.slug}`,title:ie(s.name,t("artifact")),summary:s.description||t("artifact_ready",{kind:s.
kind}),state:"done",issue:!1,updatedAt:M(s.updated_at||s.created_at),sessionKey:u,parentId:u?m.get(u)?.id:void 0,provenance:s.
session_title||s.source||t("artifact"),action:u?"open":void 0,references:[{kind:"artifact",id:s.slug,label:s.name,sessionKey:u},
...u?[{kind:"session",id:u,label:s.session_title||u,sessionKey:u}]:[]]})}let I=[...w.values()];return Uo(I,c),Nn(I)}function ft(e){
return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,
done:e.filter(t=>t.state==="done").length}}function Cn(e){let t=[],o=new Map;for(let r of e){let a=r.sessionKey;if(!a){t.push({key:r.id,items:[r],header:null,sessionKey:null});
continue}let c=o.get(a);if(c){c.items.push(r);continue}let d={key:a,items:[r],header:"session",sessionKey:r.sessionKey??
null};o.set(a,d),t.push(d)}return t}function ht(e){let t=new Set,o=new Set,r=new Set,a=0,c=0,d=0,w=0,m=0;for(let R of e){
R.sessionKey&&t.add(R.sessionKey);for(let I of R.references)I.kind==="change"?o.add(I.id):I.kind==="issue"&&r.add(I.id);
R.id.startsWith("workflow:")?a+=1:R.id.startsWith("monitor:")?c+=1:R.id.startsWith("agent:")&&(d+=1),R.state==="needs-yo\
u"&&(w+=1),R.updatedAt>m&&(m=R.updatedAt)}return{sessions:t.size,prs:o.size,issues:r.size,loops:a,crons:c,agents:d,needsYou:w,
lastActivityAt:m}}var Xo=12;function bt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Zo(e,t=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let o=mt(e);return o===0?!0:t-o<=wt}function An(e,t,o=Date.
now(),r=()=>!1){return e.filter(a=>a.key&&a.key!==t&&a.memory_mode!=="incognito").filter(a=>Zo(a,o)).filter(a=>!r(a)).sort(
(a,c)=>mt(c)-mt(a)).slice(0,Xo)}function mt(e){let t=e.last_ts??e.last_activity_ts??e.created;if(typeof t=="number")return t>
1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function Wn(e,t){let o={},r="unknown";
for(let a of e)try{let c=await t(`/api/chat/slots/${encodeURIComponent(a.key)}/summary`);if(!c||typeof c!="object"){r="u\
nsupported";break}if(c.enabled===!1){r="disabled";break}o[a.key]=c,r="available"}catch{r="unsupported";break}return{summaries:o,
support:r}}var Tn=String.raw`
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
  .ow-body { flex: 1; min-height: 0; padding: 0; }
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
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    padding: 6px 6px 16px 16px;
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
    background: transparent;
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
  .ow-listcard-tools { display: flex; flex: none; flex-direction: column; gap: 10px; padding: 0 14px 12px; }
  .ow-listcard-sub { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
  /* The only scroll container in the column. */
  .ow-work { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .ow-work-inner { padding: 0 14px 14px; }
  /* Layout C — left rail: the state filter as a vertical nav beside the list.
     The rail holds still (its own scroll); .ow-work scrolls the list. */
  .ow-worksplit { flex: 1 1 auto; min-height: 0; display: flex; align-items: stretch; }
  .ow-railnav {
    flex: none; width: 150px; display: flex; flex-direction: column; gap: 2px;
    padding: 2px 10px 14px 14px; border-right: 1px solid var(--border); overflow-y: auto;
  }
  .ow-railnav .ow-railitem { width: 100%; justify-content: space-between; text-align: left; padding: 7px 10px; font-size: 12.5px; }
  .ow-railitem-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ow-stack-card > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 14px;
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
  .ow-section { margin: 0 0 28px; }
  /* Airy, and pinned: the header sticks to the top of the scrolling list so you
     always know which group you are in. The --card background covers rows that
     scroll up beneath it. */
  .ow-section-header {
    display: flex; flex-direction: column; gap: 3px;
    position: sticky; top: 0; z-index: 2;
    background: var(--card);
    padding: 14px 0 10px;
  }
  /* The first section sits right under the panel header, so it needs no airy
     top gap — that space reads as empty at the top of the list. */
  .ow-section:first-child .ow-section-header { padding-top: 2px; }
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
  /* State rail on the left edge (option D). The selected / instructed accent
     rails are defined later in this sheet and outrank these, so an active row
     still reads as accent rather than its lane colour. */
  .ow-row[data-lane='unblock'] { box-shadow: inset 3px 0 0 var(--warn); }
  .ow-row[data-lane='followup'] { box-shadow: inset 3px 0 0 color-mix(in srgb, var(--warn) 55%, transparent); }
  .ow-row[data-lane='running'] { box-shadow: inset 3px 0 0 var(--accent); }
  .ow-row[data-lane='done'] { box-shadow: inset 3px 0 0 var(--ok); }
  .ow-row:hover { border-color: var(--border-strong); background: var(--bg-hover); }
  .ow-row:focus-visible { box-shadow: 0 0 0 2px var(--accent); }
  .ow-row[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .ow-row-layout { display: flex; align-items: flex-start; gap: 12px; }
  .ow-row-content { min-width: 0; flex: 1; }
  /* Title line. The chevron is pushed to the trailing edge by the title's own
     flex growth, so it lands in the same place on every card. */
  .ow-row-heading { display: flex; min-width: 0; align-items: flex-start; gap: 8px; }
  .ow-row-chevron { margin-top: 3px; color: var(--muted); transition: transform 140ms ease; }
  .ow-row-chevron[data-expanded='true'] { transform: rotate(90deg); }
  /* Status line (option B): the state badge, then the one-line reason. */
  .ow-row-status { display: flex; min-width: 0; align-items: center; gap: 8px; margin-top: 6px; }
  .ow-row-statustext {
    min-width: 0;
    flex: 1 1 auto;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Turn rides at the trailing edge of the title line; monospace so a number
     reads as a coordinate into the transcript rather than as prose. */
  .ow-row-turn {
    flex: none;
    margin-left: auto;
    margin-top: 1px;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    white-space: nowrap;
  }
  /* State pill — one shape for all four states, colour + leading glyph vary.
     Translucent fills are mixed from the theme tokens so they track the theme. */
  .ow-rowstate {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .ow-rowstate .ow-icon { width: 11px; height: 11px; }
  .ow-rowstate-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .ow-rowstate-spin {
    flex: none; width: 9px; height: 9px; border-radius: 50%;
    border: 1.5px solid currentColor; border-right-color: transparent;
    animation: ow-rowstate-spin 0.9s linear infinite;
  }
  @keyframes ow-rowstate-spin { to { transform: rotate(360deg); } }
  .ow-rowstate--need   { color: var(--warn);   background: color-mix(in srgb, var(--warn) 14%, transparent);   border-color: color-mix(in srgb, var(--warn) 34%, transparent); }
  .ow-rowstate--follow { color: var(--warn);   background: color-mix(in srgb, var(--warn) 7%, transparent);    border-color: color-mix(in srgb, var(--warn) 20%, transparent); }
  .ow-rowstate--run    { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); border-color: color-mix(in srgb, var(--accent) 34%, transparent); }
  .ow-rowstate--queued { color: var(--muted);  background: color-mix(in srgb, var(--muted) 12%, transparent);  border-color: color-mix(in srgb, var(--muted) 26%, transparent); }
  .ow-rowstate--done   { color: var(--ok);     background: color-mix(in srgb, var(--ok) 13%, transparent);     border-color: color-mix(in srgb, var(--ok) 30%, transparent); }
  .ow-row-title {
    min-width: 0;
    color: var(--text-strong);
    font-weight: 650;
    /* TWO lines, not one line with an ellipsis.
       Auto-generated session titles frequently share a long leading phrase, so a
       single-line clamp cut away the only part that differed: five separate rows
       all read "Open ONE PR on kirodotdev/KiroCrew fixin…" and were impossible to
       tell apart. Two lines is still bounded -- the row cannot grow without
       limit -- while reaching the words that distinguish one from another. */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
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
  .ow-primary-action { flex-shrink: 0; }
  .ow-icon { width: 14px; height: 14px; flex-shrink: 0; }
  /* Sizing only. The resizer hairline to its left is the divider now, so the
     column carries no border-left of its own. */
  .ow-conductor {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
    /* Match the Sessions card's inset so the two boxes read as siblings and the
       border never hugs the resizer hairline. Left inset is tighter than the
       outer edge so the gutter between the two boxes stays small. */
    margin: 6px 16px 16px 6px;
  }
  .ow-conductor-header { padding: 8px 10px; border-bottom: 1px solid var(--border); }
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
  .ow-block-name { font-weight: 600; }
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
  .ow-chat-panel { position: relative; display: flex; min-height: 0; width: 100%; flex-direction: column; padding: 8px 10px; gap: 8px; }
  .ow-chat-panel > .ow-quote,
  .ow-chat-panel > .ow-permissions,
  .ow-chat-panel > .ow-conductor-receipt,
  .ow-chat-panel > .ow-chat-error { flex: none; }
  /* The embed fills the rest and scrolls inside itself, so the banner above it
     stays put instead of being overrun by the transcript. */
  .ow-embed { display: flex; flex: 1; min-height: 0; }
  .ow-embed > * { flex: 1; min-height: 0; }
  /* The shared chat message rows carry px-4 (16px) on top of the panel's own
     side padding, which pushes the transcript further in than the title/composer.
     Cancel it inside the embed only, so the transcript lines up at the panel's
     10px edge like the header row. */
  .ow-embed .px-4 { padding-left: 0; padding-right: 0; }
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
  /* The session name reads as a labelled chip now that the icon is gone: a
     subtle background marks "this is a session" in the icon's place, hugging the
     name (flex 0 1 auto) and still truncating a long one. */
  .ow-goalcard-title { flex: 1; min-width: 0; overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: none; }
  .ow-goalcard .ow-block-open { flex: none; margin: 0; }
  .ow-goal-flag {
    flex: none; margin-left: auto; padding: 1px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
    color: var(--muted); background: var(--bg-hover); border: 1px solid var(--border);
  }
  .ow-goal-flag-warn { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  /* The whole header is a filled band that bleeds to the card's inner edges
     (cancelling the card's 12/14 padding); the card's overflow:hidden rounds its
     top corners. Left padding lands the content at 23px, aligned with the rows. */
  .ow-goalcard-head {
    margin: -12px -14px 10px;
    padding: 10px 14px 10px 23px;
    background: var(--bg-hover);
  }
  .ow-goal-meta { margin: 4px 0 0; color: var(--muted); font-size: 11px; }
  /* PR/issue links share the line and the muted look of the rest of the meta;
     a dot separates each piece the way the text parts are joined. */
  .ow-goal-meta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .ow-goal-meta-row > * + *::before { content: '·'; margin-right: 6px; color: var(--border); }
  .ow-goal-meta-row .ow-reference { color: var(--muted); font-size: 11px; }
  .ow-goal-meta-row .ow-reference .ow-icon { width: 12px; height: 12px; }
  .ow-goal-meta-row .ow-reference-link:hover { color: var(--text); text-decoration: underline; }
  /* Why the merge happened. Subdued below the meta: it answers a question the
     user only asks when the grouping looks wrong, so it must not compete with
     the goal's own name or its composition. */
  /* Member rows: content aligns with the header title's text (the icon that
     used to force a 26px indent is gone); the state rail sits in the gutter. */
  .ow-goalcard .ow-row { padding: 7px 4px 7px 9px; }
  .ow-goalcard .ow-row + .ow-row { border-top: 1px solid var(--border); }
  .ow-goalcard .ow-row-title { color: var(--text); font-weight: 500; }
  .ow-goalcard .ow-row[data-selected='true'] .ow-row-title { color: var(--text-strong); font-weight: 700; }
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
  .ow-steps-more { padding: 2px 0; border: 0; background: none; color: var(--muted); font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
  .ow-steps-more:hover { color: var(--text); text-decoration: underline; }
  /*
   * The expanded card's three sections. One rule per section, drawn as part of
   * the LABEL rather than as a separate element, so a section that has no data
   * takes its rule with it when it is not rendered — no stray hairline over a
   * gap.
   */
  .ow-row-detail { display: flex; flex-direction: column; gap: 12px; margin: 12px 0 2px; }
  .ow-detail { display: flex; flex-direction: column; gap: 6px; }
  .ow-detail-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ow-detail-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  /* Indented with a left border: the visual grammar of a quotation, because this
     is the user's own sentence reproduced rather than the app's account of it. */
  .ow-detail-quote {
    margin: 0;
    padding: 2px 0 2px 10px;
    border-left: 2px solid var(--border-strong, var(--border));
    color: var(--text);
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .ow-detail-facts {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text);
    font-size: 13px;
    line-height: 1.45;
  }
  .ow-detail-facts li { position: relative; padding-left: 12px; overflow-wrap: anywhere; }
  .ow-detail-facts li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 8px;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
  }
  /* Each suggestion is one clickable block of three tiers. The accent edge marks
     it as the actionable part of the card — the only thing here that does
     something when clicked. Two classes deep on purpose: .ow-quote-step sets the
     border SHORTHAND further down this sheet, which at equal specificity would
     win on source order and flatten this edge back to a plain hairline. */
  .ow-quote-step.ow-detail-step {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    border-left: 2px solid var(--accent);
    border-radius: 0 8px 8px 0;
  }
  .ow-detail-step-what { color: var(--text); font-size: 13px; font-weight: 400; line-height: 1.45; }
  .ow-detail-step-why { color: var(--muted); font-size: 12px; line-height: 1.45; }
  .ow-detail-step-expect { color: var(--muted); font-size: 12px; font-style: italic; line-height: 1.45; opacity: 0.8; }
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
  /* Rendered in ChatEmbed's aboveComposer slot: normal flow directly above the
     composer, so there is no absolute offset to keep in sync with its height. */
  .ow-quote-docked { margin: 0 0 6px; }
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
    .ow-conductor { min-height: 560px; margin: 0 16px 16px; }
    /* The left rail folds back into a horizontal filter row above the list. */
    .ow-worksplit { flex-direction: column; }
    .ow-railnav {
      flex-direction: row; flex-wrap: wrap; width: auto; overflow: visible;
      border-right: 0; border-bottom: 1px solid var(--border); padding: 0 14px 10px;
    }
    .ow-railnav .ow-railitem { width: auto; }
  }
`;import{Fragment as Ue,jsx as i,jsxs as f}from"react/jsx-runtime";var de=["work"],Mn=["work"],Hn={work:"Sessions",loops:"\
Loops",schedule:"Scheduled tasks"};function xt({id:e,onPromote:t}){return i(L,{className:"ow-promote","aria-label":`Move\
 ${Hn[e]} to the first column`,onClick:o=>{o.preventDefault(),o.stopPropagation(),t(e)},children:"Make primary"})}function vt({
lastUpdated:e,refreshing:t,onRefresh:o}){let r=e?Ct(e):null;return f("span",{className:"ow-refreshbar",children:[r&&f("s\
pan",{className:"ow-updated","aria-live":"polite",children:["updated ",r]}),i(L,{className:"ow-refresh",onClick:a=>{a.preventDefault(),
a.stopPropagation(),o()},disabled:t,"aria-label":"Refresh",title:"Refresh",children:i(ir,{className:`ow-icon${t?" ow-spi\
n":""}`,"aria-hidden":"true"})})]})}var yt="crew-manager.snoozed",Bn="crew-manager.handled",kt="crew-manager.stack-open-\
v2",_t="crew-manager.primary-v1";function xe(e,t={}){try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}
function ce(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Ct(e,t=Date.now()){if(!e)return null;let o=Math.
max(0,Math.round((t-e)/1e3));if(o<60)return"just now";let r=Math.round(o/60);if(r<60)return`${r}m ago`;let a=Math.round(
r/60);return a<24?`${a}h ago`:`${Math.round(a/24)}d ago`}function $n(e){return e?new Date(e).toLocaleTimeString([],{hour:"\
numeric",minute:"2-digit"}):""}function ve(e,t,o){return e<=0?null:`${e} ${e===1?t:o}`}function mr(e,t=Date.now(),o=!1,r=!1){
let a=ht(e),c=[o?null:ve(a.sessions,"session","sessions"),r?null:ve(a.prs,"PR","PRs"),r?null:ve(a.issues,"issue","issues"),
ve(a.loops,"loop","loops"),ve(a.crons,"cron","crons"),ve(a.agents,"agent","agents")].filter(w=>!!w),d=Ct(a.lastActivityAt,
t);return d&&c.push(`last active ${d}`),c.join(" \xB7 ")}var ue="crew-manager-conductor",br=5e3,xr={session:"Session",approval:"\
Approval",agent:"Agent",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending a\
pproval request",subagent_gate_waiting:"Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer t\
he request in the work thread",decision_ready:"Make the decision this work is waiting on",work_in_progress:"Work is in p\
rogress",linked_change_issue:"Open the linked change \u2014 a check is failing or it conflicts",recent_work_ready:"Pick \
this back up, or let it go",approval_needed_for:"Review the pending {{tool}} request",approval_needed:"Approval needed",
tool_call_waiting:"Allow or refuse a waiting tool call",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"\
This agent stopped before finishing \u2014 nothing to do here",workflow_failed:"This workflow stopped before finishing",
workflow_failed_generic:"This workflow stopped before finishing",workflow_running:"Workflow is running",workflow_finished:"\
Workflow finished",workflow_fact_last_log:"Got as far as: {{log}}",workflow_fact_phase:"It was in the {{phase}} phase",workflow_fact_error:"\
It stopped with: {{error}}",workflow_fact_agent_errors:"{{count}} of its agents reported an error",workflow_fact_partials:"\
{{count}} agents finished first, so their output survived",workflow_step_diagnose:"Find out why {{name}} stopped, then r\
e-run it",workflow_step_why_error:"it failed with {{error}}, so re-running it as-is repeats that",workflow_step_why_generic:"\
it has not been re-run, and nothing says the cause is fixed",workflow_step_expect_partials:"a diagnosis, and {{count}} f\
inished agents worth reusing",workflow_step_expect_generic:"a diagnosis you can act on before spending another run",monitor_failed:"\
The latest check stopped before finishing",monitor_running:"Monitor is checking now",monitor_next_check:"Checks again in\
 {{duration}}.",loop:"Monitor loop",loop_watching:"Re-prompting its own session \u2014 {{cycles}} cycles so far, no limit set",
loop_watching_capped:"Re-prompting its own session \u2014 cycle {{cycles}} of {{cap}}",artifact_ready:"{{kind}} output i\
s ready",stalled_for:"Check on it \u2014 no activity for {{duration}}, still marked running",stalled_because:"{{reason}}\
 Silent for {{duration}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same linked change",
duplicate_same_artifact:"Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_deliverable:"Al\
so being worked in \u201C{{title}}\u201D \u2014 same deliverable",duplicate_same_topic:"Looks like the same work as \u201C{{t\
itle}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same work",related_sessions:"\
{{count}} other session(s) on this same work",related_same_change:"same change",related_same_artifact:"same artifact",related_same_deliverable:"\
same deliverable",related_same_topic:"similar goal",related_same_step:"same next step",related_more:"and {{count}} more",
rank_approval_owed:"only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"\
the agent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failu\
re has repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{\
duration}}",rank_change_blocked:"a linked change is failing or conflicting",rank_changes_requested:"a reviewer asked you\
 for changes",rank_assigned_to_you:"assigned to you and nobody has started it",rank_merge_ready:"approved and green \u2014 on\
ly you can merge it",rank_nobody_on_it:"nobody is on {{count}} unfinished goal(s) in this session",no_next_step:"No next\
 step recorded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",owned_pull_conflict:"Your pull request has a conflict to resolve.",owned_pull_failing:"Your pull req\
uest has {{count}} failing check(s).",owned_pull_changes_requested:"A reviewer has requested changes on your pull reques\
t.",owned_pull_merge_ready:"Approved with nothing red. Only you can merge it.",owned_pull_awaiting_review:"Waiting on re\
viewers, not on you.",owned_pull_checks_running:"{{count}} check(s) still running.",owned_issue_assigned:"Assigned to yo\
u.",owned_provenance:"{{repo}}",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"\
{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work",card_asked_for:"You asked for",
card_where_it_stands:"Where it stands",card_suggested_next:"Suggested next",card_turn:"turn {{turn}}"};function O(e,t={}){
return xr[e].replace(/\{\{(\w+)\}\}/g,(o,r)=>t[r]??"")}var jn={"needs-you":"Needs you",running:"Running",done:"Done"},St={
all:"All","needs-you":"Needs you","follow-up":"Follow up",running:"Running",done:"Done"},vr={session:ar,approval:zn,agent:tr,
workflow:ur,monitor:Fn,artifact:rr,change:sr,issue:cr};function Be({children:e,onActivate:t,...o}){return i("div",{...o,
role:"button",tabIndex:0,onClick:t,onKeyDown:r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),t())},children:e})}
function Kn({label:e,count:t,subtitle:o}){return f("div",{className:"ow-section-header",children:[f("div",{className:"ow\
-section-heading",children:[i("h2",{className:"ow-section-title",children:e}),i("span",{className:"ow-section-count",children:t})]}),
o&&i("p",{className:"ow-section-subtitle",children:o})]})}function yr(e){let t=ne(e);return t==="unblock"?f("span",{className:"\
ow-rowstate ow-rowstate--need",children:[i("span",{className:"ow-rowstate-dot","aria-hidden":"true"}),"Needs you"]}):t===
"followup"?f("span",{className:"ow-rowstate ow-rowstate--follow",children:[i("span",{className:"ow-rowstate-dot","aria-h\
idden":"true"}),"Follow up"]}):t==="running"?e.moving?f("span",{className:"ow-rowstate ow-rowstate--run",children:[i("sp\
an",{className:"ow-rowstate-spin","aria-hidden":"true"}),"Running"]}):i("span",{className:"ow-rowstate ow-rowstate--queu\
ed",children:"Queued"}):f("span",{className:"ow-rowstate ow-rowstate--done",children:[i(qn,{className:"ow-icon","aria-hi\
dden":"true"}),"Done"]})}function kr({tool:e,purpose:t,busy:o,onAnswer:r,where:a}){return f("div",{className:"ow-permiss\
ion",children:[f("div",{className:"ow-permission-body",children:[f("div",{className:"ow-permission-head",children:[i(lr,
{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-permission-title",children:"Waiting for your permiss\
ion"})]}),f("p",{className:"ow-permission-what",children:[a&&f("span",{className:"ow-truncate",children:[a," "]}),a?"wan\
ts to run ":"Wants to run ",i("code",{children:e})]}),t&&i("p",{className:"ow-permission-why",children:t})]}),f("div",{className:"\
ow-permission-actions",children:[i(L,{onClick:()=>r(!0),disabled:o,children:"Approve"}),i(L,{onClick:()=>r(!1),disabled:o,
children:"Reject"})]})]})}function Ee({children:e}){return i("div",{className:"ow-expand",children:i("div",{className:"o\
w-expand-inner",children:e})})}function Rt({label:e,children:t}){let o=er();return f("div",{className:"ow-detail",role:"\
group","aria-labelledby":o,children:[i("div",{className:"ow-detail-label",id:o,children:e}),t]})}var Nt=3;function Dn(e){
let t=e.provenance.trim().toLowerCase();return e.references.filter(o=>o.label.trim().toLowerCase()!==t)}function _r({item:e,
busy:t,onDecide:o}){let[r,a]=S(!1),c=e.permissionInput||"",d=c.trim().split(/\s+/)[0]||e.permissionTool||"";return f("di\
v",{className:"ow-formal-approval",role:"presentation",onClick:w=>w.stopPropagation(),onKeyDown:w=>w.stopPropagation(),children:[
i("div",{className:"ow-formal-badge",children:"Waiting for approval"}),f("div",{className:"ow-formal-detail",children:[e.
permissionPurpose&&f("div",{className:"ow-formal-kv",children:[i("span",{className:"ow-formal-key",children:"__tool_use_\
purpose"}),i("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),f("div",{className:"ow-formal-kv",children:[
i("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),i("span",{className:"ow-formal-val ow-formal-mon\
o",children:c||"(no input details)"})]})]}),f("div",{className:"ow-formal-actions",children:[i(L,{disabled:t,onClick:()=>o(
"approved"),children:"Allow once"}),f("span",{className:"ow-trust-wrap",children:[f(L,{disabled:t,onClick:()=>a(w=>!w),"\
aria-expanded":r,children:["Trust ",i(pe,{className:"ow-icon ow-trust-caret","data-open":r?"true":void 0,"aria-hidden":"\
true"})]}),r&&f("span",{className:"ow-trust-menu",role:"menu",children:[c&&i("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{a(!1),o("trust_command")},children:"Trust this exact command"}),d&&f("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),o("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),i("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),
o("trust")},children:"Trust everything in this session"})]})]}),i(L,{className:"ow-formal-reject",disabled:t,onClick:()=>o(
"rejected"),children:"Reject"})]})]})}function Sr({item:e,items:t,onOpen:o}){let a=e.references.find(g=>g.kind==="sessio\
n")?.label??e.provenance,c=ht(t),d=c.needsYou>0?"needs-you":t.some(g=>g.state==="running")?"running":"done",w=c.needsYou>
0?null:jn[d],m=[],R=new Set;for(let g of t.flatMap(k=>k.references))(g.kind==="change"||g.kind==="issue")&&g.url&&!R.has(
g.url)&&(R.add(g.url),m.push(g));let I=t.reduce((g,k)=>Math.max(g,k.queuedBehind??0),0),s=I>0?O("rank_queued_behind",{count:String(
I)}):null,u=mr(t,Date.now(),!0,m.length>0);return f("div",{className:"ow-goalcard-head",children:[f("div",{className:"ow\
-goalcard-summary",children:[i("span",{className:"ow-goalcard-header ow-goalcard-static",children:i("span",{className:"o\
w-truncate ow-block-name ow-goalcard-title",children:a})}),i(L,{className:"ow-block-open",onClick:o,"aria-label":`Open ${a}`,
children:"Open"}),w&&i("span",{className:`ow-goal-flag${c.needsYou>0?" ow-goal-flag-warn":""}`,children:w})]}),(m.length>
0||u||s)&&f("div",{className:"ow-goal-meta ow-goal-meta-row",children:[u&&i("span",{children:u}),m.map(g=>i(Un,{reference:g,
onOpenSession:()=>o()},`${g.kind}:${g.id}`)),s&&i("span",{children:s})]})]})}function Un({reference:e,onOpenSession:t}){
let o=vr[e.kind],r=f(Ue,{children:[i(o,{className:"ow-icon"}),i("span",{className:"ow-truncate",children:e.label})]});return e.
url?i("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:a=>a.
stopPropagation(),children:r}):e.sessionKey?i(Be,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),
children:r}):i("span",{className:"ow-reference",children:r})}function Gn({item:e,selected:t,continuation:o,whyRanked:r,onSelect:a,
onOpenSession:c,onAnswerPermission:d,permissionBusy:w,onRetry:m,retryBusy:R,onStop:I,stopBusy:s,onPickStep:u,onSnooze:g,
onHandled:k,compact:x,headless:N,onDecideApproval:h}){let[v,$]=S(!1),E=(e.nextSteps??[]).filter(y=>y.what?.trim()),H=(e.
progress??[]).filter(y=>y.trim()),z=e.initialIntent?.trim(),B=!!u&&E.length>0,W=!!z||H.length>0||B,D=v?E:E.slice(0,Nt),X=yr(
e),ye=e.lastTouchedTurn?O("card_turn",{turn:String(e.lastTouchedTurn)}):null,$e=!!e.summary&&(E.some(y=>y.what?.trim()===
e.summary)||t&&z===e.summary?.trim()),Ke=!!e.summary&&(x&&!t?!r:!$e),ke=r||(Ke?e.summary:null);return f(Be,{onActivate:a,
className:"ow-row","aria-label":e.title,"aria-pressed":t,"aria-expanded":W?t:void 0,"data-selected":t,"data-lane":ne(e),
"data-instructed":e.instructed?"true":void 0,"data-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[
i("div",{className:"ow-row-layout",children:f("div",{className:"ow-row-content",children:[!N&&f(Ue,{children:[f("div",{className:"\
ow-row-heading",children:[i("span",{className:"ow-row-title",children:e.title}),ye&&i("span",{className:"ow-row-turn",children:ye}),
i(pe,{className:"ow-icon ow-row-chevron","data-expanded":t?"true":void 0,"aria-hidden":"true"})]}),(X||ke)&&f("div",{className:"\
ow-row-status",children:[X,ke&&i("span",{className:"ow-row-statustext",children:ke})]})]}),e.duplicateOf&&f(Be,{className:"\
ow-row-duplicate",onActivate:()=>c(e.duplicateOf.sessionKey),children:[i(It,{className:"ow-icon","aria-hidden":"true"}),
i("span",{className:"ow-truncate",children:O(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.title})})]}),t&&e.
relatedSessions&&e.relatedSessions.length>0&&i(Ee,{children:f("div",{className:"ow-related",children:[i("span",{className:"\
ow-related-label",children:O("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.map(y=>f(Be,
{className:"ow-related-row",onActivate:()=>c(y.sessionKey),children:[i(It,{className:"ow-icon","aria-hidden":"true"}),i(
"span",{className:"ow-truncate",children:y.title}),i("span",{className:"ow-related-why",children:O(`related_${y.because}`)})]},
y.sessionKey)),e.relatedMore?i("span",{className:"ow-related-more",children:O("related_more",{count:String(e.relatedMore)})}):
null]})}),!o&&f("div",{className:"ow-row-meta",children:[i("span",{className:"ow-truncate",children:e.provenance}),Dn(e).
length>0&&i("span",{"aria-hidden":"true",children:"\xB7"}),i("span",{className:"ow-references",children:Dn(e).slice(0,3).
map(y=>i(Un,{reference:y,onOpenSession:c},`${y.kind}:${y.id}`))})]})]})}),t&&W&&i(Ee,{children:f("div",{className:"ow-ro\
w-detail",children:[z&&i(Rt,{label:O("card_asked_for"),children:i("blockquote",{className:"ow-detail-quote",children:z})}),
H.length>0&&i(Rt,{label:O("card_where_it_stands"),children:i("ul",{className:"ow-detail-facts",children:H.map((y,oe)=>i(
"li",{children:y},`${oe}:${y}`))})}),B&&f(Rt,{label:O("card_suggested_next"),children:[D.map((y,oe)=>f("button",{type:"b\
utton",className:"ow-quote-step ow-detail-step",title:y.why??y.what,onClick:q=>{q.stopPropagation(),u?.(y.what)},children:[
i("span",{className:"ow-detail-step-what",children:y.what}),y.why&&i("span",{className:"ow-detail-step-why",children:y.why}),
y.expect&&i("span",{className:"ow-detail-step-expect",children:y.expect})]},`${oe}:${y.what}`)),E.length>Nt&&i("button",
{type:"button",className:"ow-steps-more",onClick:y=>{y.stopPropagation(),$(oe=>!oe)},children:v?"Show fewer":`+${E.length-
Nt} more`})]})]})}),e.retryPath&&m&&i(Ee,{children:i("div",{className:"ow-retry",children:i(L,{onClick:()=>m(e.retryPath),
disabled:!!R,children:"Retry"})})}),e.stopPath&&I&&i(Ee,{children:i("div",{className:"ow-retry",children:i(L,{onClick:()=>I(
e.stopPath),disabled:!!s,children:s?"Stopping\u2026":"Stop this loop"})})}),e.permissionId&&h&&i(Ee,{children:i(_r,{item:e,
busy:!!w,onDecide:y=>h(e,y)})}),e.state==="needs-you"&&g&&k&&f("div",{className:"ow-row-aside",children:[i("button",{type:"\
button",className:"ow-aside-btn",onClick:y=>{y.stopPropagation(),g(e.id)},children:"Later"}),i("button",{type:"button",className:"\
ow-aside-btn",onClick:y=>{y.stopPropagation(),k(e.id,e.updatedAt)},children:"Handled"})]})]})}var Rr=["unblock","followu\
p","running","done"];function ne(e){return e.state==="done"?"done":e.state==="running"?"running":kn(e)??"unblock"}function Nr({
items:e,selectedId:t,onSelect:o,onOpenSession:r,onAnswerPermission:a,onDecideApproval:c,permissionBusy:d,onRetry:w,retryBusy:m,
onPickStep:R,onSnooze:I,onHandled:s,doneTitles:u}){let[g,k]=S(!1),x=new Map;for(let N of e){let h=ne(N),v=x.get(h);v?v.push(
N):x.set(h,[N])}return f(Ue,{children:[Rr.filter(N=>x.has(N)).map(N=>{let h=x.get(N);return i("div",{className:"ow-lane",
children:h.map(v=>i(Gn,{item:v,compact:!0,selected:t===v.id,continuation:!0,whyRanked:v.state==="needs-you"&&v.action!==
"resume"?He(be(v),O):void 0,onSelect:()=>o(v),onOpenSession:r,onAnswerPermission:a,onDecideApproval:c,permissionBusy:d,onRetry:w,
retryBusy:m,onPickStep:R,onSnooze:I,onHandled:s},v.id))},N)}),!x.has("done")&&u&&u.length>0&&f("div",{className:"ow-lane\
 ow-lane-done",children:[f("button",{type:"button",className:"ow-goals-toggle","aria-expanded":g,onClick:()=>k(N=>!N),children:[
i(pe,{className:"ow-icon","data-open":g?"true":void 0,"aria-hidden":"true"}),u.length," done"]}),g&&i("ul",{className:"o\
w-done-list",children:u.map(N=>f("li",{className:"ow-row-goal-done",children:[i(nr,{className:"ow-icon","aria-hidden":"t\
rue"}),i("span",{className:"ow-truncate",children:N})]},N))})]})]})}function Me({title:e,items:t,selectedId:o,onSelect:r,
onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:m,retryBusy:R,onStop:I,stopBusy:s,onPickStep:u,
onSnooze:g,onHandled:k,footer:x,collapsed:N,onToggleCollapsed:h,doneBySession:v,subtitle:$,hideHeader:E,emptyLabel:H}){let z=Cn(
t),B=W=>f("div",{className:`ow-block${W.header==="session"?" ow-goalcard":""}`,"data-grouped":W.header?"true":void 0,"da\
ta-open":W.header==="session"?"true":void 0,children:[W.header==="session"&&W.sessionKey&&i(Sr,{item:W.items[0],items:W.
items,onOpen:()=>a(W.sessionKey)}),W.header==="session"?i(Nr,{items:W.items,doneTitles:W.sessionKey?v?.[W.sessionKey]:void 0,
selectedId:o,onSelect:r,onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:m,retryBusy:R,onPickStep:u,
onSnooze:g,onHandled:k}):W.items.map(D=>i(Gn,{item:D,selected:o===D.id,whyRanked:D.state==="needs-you"&&D.action!=="resu\
me"?He(be(D),O):void 0,onSelect:()=>r(D),onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:m,
retryBusy:R,onStop:I,stopBusy:s,onPickStep:u,onSnooze:g,onHandled:k},D.id))]},W.key);return f("section",{className:"ow-s\
ection","aria-label":e,children:[E?null:h?f(Be,{onActivate:h,className:"ow-section-toggle",children:[i(Kn,{label:e,count:t.
length,subtitle:$}),i(pe,{className:"ow-icon ow-section-chevron","data-open":N?void 0:"true","aria-hidden":"true"})]}):i(
Kn,{label:e,count:t.length,subtitle:$}),N?null:i("div",{className:"ow-section-list",children:z.length===0?i("p",{className:"\
ow-section-empty",children:H}):z.map(B)}),x]})}function Ir(e,t,o=[]){let r=hn(t,O),a=o.length?[`Noticed since you last s\
poke (${o.length}):`,...o.map(w=>`- ${w}`),"Mention these only if they matter to what the user asked."]:[];if(!e)return[
"Crew Manager context: workspace overview.",...r,...a,"Answer the user about the state of their work. This is a conversa\
tion, not an action channel."].join(`
`);let c=e.references.map(w=>`${w.kind}: ${w.label} (${w.id})`).join(`
`),d=[e.stalledFor?`Silent for ${le(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(w=>!!w);return[`Crew Manager context: ${e.title}`,...r,`Selected item: ${e.title}`,
`State: ${jn[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...d.length>0?[`Why it is on the board:
${d.join(`
`)}`]:[],`References:
${c}`,...a,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(w=>!!w).join(`
`)}var On="crew-manager.panel-widths";function Cr(e,t){let o=e?.first_seen;if(!o)return[];let r=typeof t=="number"?t<=1e10?
t*1e3:t:t?Date.parse(t):NaN;if(!Number.isFinite(r))return[];let a=[];for(let d of e?.stalls??[]){let w=o[d.key];typeof w==
"number"&&(w*1e3<=r||a.push(d.reason?`${d.label} went quiet \u2014 ${d.reason}`:`${d.label} went quiet after ${le(d.silent_secs)}`))}
for(let d of e?.error_loops??[]){let w=o[d.key];typeof w=="number"&&(w*1e3<=r||a.push(`${d.label} repeated the same ${d.
tool} failure ${d.repeats} times`))}let c=5;return a.length>c?[...a.slice(0,c),`and ${a.length-c} more`]:a}var Y={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function je(e,t,o,r,a){let c=Math.min(a,Math.max(o,t-
r));return Math.max(o,Math.min(c,e))}function Ln({side:e,containerRef:t,min:o,reserve:r,max:a,value:c,onChange:d,label:w}){
let m=(s,u)=>{let g=u.getBoundingClientRect(),k=e==="start"?s-g.left:g.right-s;return je(k,u.clientWidth,o,r,a)};return i(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":w,tabIndex:0,onPointerDown:s=>{
let u=t.current;if(!u)return;s.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let g=x=>d(m(x.clientX,u)),k=()=>{window.removeEventListener("pointermove",g),window.removeEventListener("pointeru\
p",k),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",g),window.addEventListener(
"pointerup",k)},onKeyDown:s=>{if(s.key!=="ArrowLeft"&&s.key!=="ArrowRight")return;let u=t.current;if(!u)return;s.preventDefault();
let g=(s.shiftKey?48:16)*(s.key==="ArrowRight"?1:-1),k=c??(e==="start"?u.clientWidth/2:Math.round(u.clientWidth*.3));d(je(
k+(e==="start"?g:-g),u.clientWidth,o,r,a))}})}function Ar(){let e=pr(),t=G(e);t.current=e;let o=gr(),r=wr(),[a,c]=S("all"),
[d,w]=S(()=>{let n=xe(_t,null);return n&&de.includes(n)?n:"work"}),[m,R]=S(()=>{let n=xe(kt,null),l=n&&de.includes(n)?n:
null,p=xe(_t,null),b=p&&de.includes(p)?p:"work";return l&&l!==b?l:Mn.find(_=>_!==b)??null}),I=K(n=>{R(l=>{let p=l===n?null:
n;return ce(kt,p),p})},[]),[s,u]=S(null),[g,k]=S("session"),[x,N]=S(null),[h,v]=S(null),[$,E]=S({}),[H,z]=S("unknown"),B=G(
"unknown"),W=G(new Map),[D,X]=S({}),[ye,$e]=S(null),[Ke,ke]=S({}),[y,oe]=S([]),[q,De]=S(null),[re,At]=S(null),[se,Wt]=S(
null),[Tt,Pt]=S(()=>xe(yt)),[Et,Yn]=S(()=>xe(Bn)),Ge=G(null),Ye=G(null),[Z,Ve]=S(()=>xe(On,{work:null,conductor:null}));
U(()=>{ce(On,Z)},[Z]),U(()=>{let n=()=>Ve(l=>{let p=Ye.current?.clientWidth??0,b=Ge.current?.clientWidth??0;return{work:l.
work==null||p===0?l.work:je(l.work,p,Y.workMin,Y.railReserve,1/0),conductor:l.conductor==null||b===0?l.conductor:je(l.conductor,
b,Y.conductorMin,Y.mainReserve,Y.conductorMax)}});return n(),window.addEventListener("resize",n),()=>window.removeEventListener(
"resize",n)},[]);let[Vn,Jn]=S(!0),[Mt,Bt]=S({}),[$t,Je]=S([]),[Qe,Qn]=S([]),[Xn,Xe]=S(!1),_e=K(n=>{if(n===d)return;let l=m===
n?Mn.find(p=>p!==n)??null:m;ce(_t,n),ce(kt,l),w(n),R(l)},[d,m]),Zn=K((n,l)=>{n.dataTransfer.setData("text/x-crew-panel",
l),n.dataTransfer.effectAllowed="move";let p=n.currentTarget.querySelector("summary");if(!p)return;let b=p.getBoundingClientRect();
n.dataTransfer.setDragImage(p,Math.min(Math.max(n.clientX-b.left,0),b.width),Math.min(Math.max(n.clientY-b.top,0),b.height))},
[]),eo=K(n=>{n.preventDefault(),Xe(!1);let l=n.dataTransfer.getData("text/x-crew-panel");!l||!de.includes(l)||_e(l)},[_e]),
Ze=F(()=>de.filter(n=>n!==d),[d]),to=m&&m!==d?String(Ze.indexOf(m)):"none",et=n=>{let l=n===d;return{className:"ow-card \
ow-stack-card",open:l||m===n,draggable:!0,"data-panel":n,"data-primary":l?"true":"false","data-rail-index":l?void 0:Ze.indexOf(
n),"data-dragover":l&&Xn?"true":void 0,onDragStart:p=>Zn(p,n),onDragOver:l?p=>{p.preventDefault(),Xe(!0)}:void 0,onDragLeave:l?
()=>Xe(!1):void 0,onDrop:l?eo:void 0}},Kt=G(!0),[no,Dt]=S(!0),[Ot,tt]=S(null),[nt,oo]=S(null),[Se,Lt]=S(!1),[ro,so]=S(!1),
[zt,V]=S(null),P=G(!0),Re=G(0),ot=G(!1);U(()=>(P.current=!0,()=>{P.current=!1,Re.current+=1}),[]);let C=K(async()=>{let n=++Re.
current,l=t.current;try{let[p,b,_,j,ze,qe,A,te]=await Promise.all([l.get("/api/chat/slots"),l.get("/api/approvals"),l.get(
"/api/spawn"),l.get("/api/workflows/runs"),l.get("/api/crons"),l.get("/api/artifacts"),l.get("/api/autonudge").catch(()=>({
loops:[]})),l.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!P.current||n!==Re.current)return;v({slots:Array.
isArray(p)?p:[],approvals:Array.isArray(b)?b:[],agents:Array.isArray(_.agents)?_.agents:[],workflows:Array.isArray(j.runs)?
j.runs:[],crons:Array.isArray(ze.jobs)?ze.jobs:[],artifacts:Array.isArray(qe.artifacts)?qe.artifacts:[],loops:Array.isArray(
A?.loops)?A.loops:[]}),Qn(Array.isArray(te?.runs)?te.runs:[]),tt(null),oo(Date.now())}catch(p){P.current&&n===Re.current&&
tt(p instanceof Error?p:new Error("Unable to load Crew Manager sources"))}finally{P.current&&n===Re.current&&Dt(!1)}},[]);
U(()=>{C();let n=window.setInterval(()=>{C()},br);return()=>window.clearInterval(n)},[C]);let ao=()=>{Dt(!0),tt(null),C()},
rt=K(()=>{Se||(Lt(!0),C().finally(()=>{P.current&&Lt(!1)}))},[C,Se]);U(()=>{if(!h||B.current==="unsupported"||B.current===
"disabled")return;let n=An(h.slots,ue,Date.now(),p=>W.current.get(p.key)===bt(p));if(n.length===0)return;let l=!1;return(async()=>{
let{summaries:p,support:b}=await Wn(n,_=>t.current.get(_));if(!(l||!P.current)&&(B.current=b,z(b),b==="available")){for(let _ of n)
p[_.key]&&W.current.set(_.key,bt(_));E(_=>({..._,...p}))}})(),()=>{l=!0}},[h]),U(()=>{if(!h||!Kt.current)return;let n=!1;
return(async()=>{try{let l=await t.current.get("/api/apps/crew-manager/stalls");if(n||!P.current)return;let p={};for(let _ of l?.
stalls??[])_?.key&&(p[_.key]=_);X(p);let b={};for(let _ of l?.error_loops??[])_?.key&&(b[_.key]=_);Bt(b),$e(l??null);try{
let _=await t.current.get("/api/apps/crew-manager/assigned");!n&&P.current&&Je(_?.available&&Array.isArray(_.rows)?_.rows:
[])}catch{P.current&&Je([])}}catch{Kt.current=!1,P.current&&(X({}),Bt({}),$e(null),Je([]))}})(),()=>{n=!0}},[h]);let qt=F(
()=>yn(In({...h??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},assigned:$t},O,$,D,Mt),Ke),
[h,$,D,Mt,Ke,$t]),Oe=F(()=>Sn(qt,Tt,Et),[qt,Tt,Et]),T=F(()=>Oe.items.filter(n=>Rn(n)),[Oe]),Ne=F(()=>ft(T),[T]),Ft=F(()=>T.
filter(n=>n.state==="needs-you"&&ne(n)==="followup").length,[T]),io={...Ne,"needs-you":Math.max(0,(Ne["needs-you"]??0)-Ft),
"follow-up":Ft},st=F(()=>{let n={};for(let l of T){if(l.state!=="done"||!l.sessionKey)continue;let p=n[l.sessionKey];p?p.
push(l.title):n[l.sessionKey]=[l.title]}return n},[T]),ee=F(()=>T.find(n=>n.id===s)??null,[T,s]),Ie=F(()=>a==="all"?T:a===
"follow-up"?T.filter(n=>n.state==="needs-you"&&ne(n)==="followup"):a==="needs-you"?T.filter(n=>n.state==="needs-you"&&ne(
n)!=="followup"):T.filter(n=>n.state===a),[a,T]);U(()=>r(Ne["needs-you"]),[Ne,r]),U(()=>{s&&!T.some(n=>n.id===s)&&u(null)},
[T,s]);let ae=h?.slots.find(n=>n.key===ue),lo=!!(ae||ro),Ht=G(!1);U(()=>{let n=ae;if(!n||Ht.current||n.agent)return;Ht.current=
!0;let l=t.current;l.get("/api/apps/crew-manager/conductor-agent").then(p=>p?.available&&p.agent?p.agent:null).catch(()=>null).
then(p=>{if(!(!p||!P.current))return l.post(`/api/chat/slots/${encodeURIComponent(ue)}/agent`,{agent:p}).then(()=>{C()})}).
catch(()=>{})},[ae,C]),U(()=>{!h||ae||ot.current||(ot.current=!0,e.get("/api/apps/crew-manager/conductor-agent").then(n=>n?.
available&&n.agent?n.agent:null).catch(()=>null).then(n=>e.post("/api/chat/slots",{name:ue,title:"Conductor",...n?{agent:n}:
{}})).then(()=>{P.current&&(so(!0),C())}).catch(n=>{P.current&&(ot.current=!1,V(n instanceof Error?`Conductor session co\
uld not be created: ${n.message}`:"Conductor session could not be created"))}))},[e,ae,C,h]);let jt=F(()=>dn(h?.approvals??
[],y,n=>T.find(l=>l.sessionKey===n)?.title??h?.slots?.find(l=>l.key===n)?.title??n),[T,h,y]),ge=ee&&!ee.permissionId?ee:
null,at=F(()=>{let n=(h?.loops??[]).filter(p=>p&&p.active!==!1&&p.slot_key);if(n.length===0)return[];let l=new Map;for(let p of T)
for(let b of p.references)b.kind!=="session"||!b.id||b.label&&!l.has(b.id)&&l.set(b.id,b.label);return n.map(p=>{let b=Number(
p.cycle_count)||0,_=Number(p.max_cycles)||0;return{key:p.slot_key,title:l.get(p.slot_key)??p.slot_key,progress:_>0?`${b}\
/${_}`:`${b} ${b===1?"cycle":"cycles"}`,remaining:_>0?Math.max(0,_-b):null,instruction:(p.message??"").replace(/\s+/g," ").
trim(),lastFire:M(p.last_fire_ts)}})},[h,T]),we=F(()=>{let n=new Date;n.setHours(0,0,0,0);let l=n.getTime(),p=l+864e5,b=h?.
crons??[],_=new Map;for(let A of Qe){let te=M(A.started_at);if(!A.job_id||te<l||te>=p)continue;let J=_.get(A.job_id)??{count:0,
failed:0,last:0};J.count+=1,A.status&&A.status!=="success"&&(J.failed+=1),J.last=Math.max(J.last,te),_.set(A.job_id,J)}let j=b.
map(A=>{let te=_.get(A.id),J=M(A.next_run_ts),fo=J>=l&&J<p;return{job:A,ran:te,next:J,dueToday:fo}}).filter(A=>A.ran||A.
dueToday||A.job.is_running),ze=j.filter(A=>A.ran&&A.ran.failed===0).length,qe=j.filter(A=>A.ran&&A.ran.failed>0).length;
return{rows:j,done:ze,failed:qe,total:j.length,historyKnown:Qe.length>0}},[h,Qe]),fe=K(async(n,l)=>{if(!q){De(n),V(null);
try{await t.current.post(`/api/approvals/${encodeURIComponent(n)}/${l?"approve":"reject"}`,{}),C()}catch(p){V(p instanceof
Error?`Could not answer that request: ${p.message}`:"Could not answer that request"),C()}finally{P.current&&De(null)}}},
[C,q]),Ce=K(async(n,l)=>{if(!(q||!n.permissionId||!n.sessionKey)){De(n.permissionId),V(null);try{await t.current.post(`/\
api/chat/slots/${encodeURIComponent(n.sessionKey)}/approve`,{action:l,request_id:n.permissionId}),C()}catch(p){V(p instanceof
Error?`Could not answer that request: ${p.message}`:"Could not answer that request"),C()}finally{P.current&&De(null)}}},
[C,q]),Ut=K(n=>{Pt(l=>{let p=Object.fromEntries(Object.entries(l).filter(([,b])=>b>Date.now()));return p[n]=Date.now()+_n,
ce(yt,p),p}),u(null)},[]),Gt=K((n,l)=>{Yn(p=>{let b={...p,[n]:l};return ce(Bn,b),b}),u(null)},[]),co=K(()=>{Pt({}),ce(yt,
{})},[]),uo=K(()=>{Jn(n=>!n)},[]),Ae=K(async n=>{if(!re){At(n),V(null);try{await t.current.post(n,{}),C()}catch(l){V(l instanceof
Error?`Could not re-run it: ${l.message}`:"Could not re-run it"),C()}finally{P.current&&At(null)}}},[C,re]),We=K(async n=>{
if(!se){Wt(n),V(null);try{await t.current.del(n),N("Stopped the monitor loop. Re-arming it is done from the session itse\
lf."),C()}catch(l){let p=l instanceof Error?l.message:"";/404|not found/i.test(p)?N("That loop had already stopped."):V(
p?`Could not stop it: ${p}`:"Could not stop it"),C()}finally{P.current&&Wt(null)}}},[C,se]),he=K(async n=>{let l=ee&&!ee.
permissionId?ee:null;if(g==="session"&&l?.sessionKey){let p=l.sessionKey;if(await t.current.post("/api/chat",{message:n,
slot:p}).catch(b=>{if(!(b instanceof SyntaxError))throw b}),!P.current)return;ke(b=>({...b,[l.id]:Date.now()})),oe(b=>b.
includes(p)?b:[...b,p]),N(`Sent new instructions to ${l.title}`),u(null),C();return}await t.current.post(`/api/chat/slot\
s/${encodeURIComponent(ue)}/context`,{content:Ir(ee,T,Cr(ye,ae?.last_ts)),source:"crew-manager",ephemeral:!0}).catch(()=>{}),
await t.current.post("/api/chat",{message:n,slot:ue}).catch(p=>{if(!(p instanceof SyntaxError))throw p})},[ee,T,C,g,ye,ae]),
Le={"needs-you":Ie.filter(n=>n.state==="needs-you"),running:Ie.filter(n=>n.state==="running"),done:Ie.filter(n=>n.state===
"done")},po=Le["needs-you"].filter(n=>ne(n)!=="followup"),go=Le["needs-you"].filter(n=>ne(n)==="followup"),Te=n=>o(`/cha\
t?sid=${encodeURIComponent(n)}`),Pe=n=>{u(l=>l===n.id?null:n.id),N(null),k("session")},wo=ge?f("div",{className:"ow-quot\
e ow-quote-docked",children:[f("div",{className:"ow-quote-body",children:[ge.sessionKey?i("button",{type:"button",className:"\
ow-scope-toggle","aria-pressed":g==="conductor","aria-label":g==="session"?"Sending to this session. Activate to send to\
 the Conductor instead.":"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>k(n=>n==="ses\
sion"?"conductor":"session"),children:g==="session"?"Instructing":"To Conductor"}):i("span",{className:"ow-eyebrow",children:"\
Quoted"}),i("span",{className:"ow-quote-title",title:ge.title,children:ge.title})]}),i(L,{className:"ow-quote-clear","ar\
ia-label":"Remove the quoted work item",onClick:()=>{u(null),N(null)},children:"Clear"})]}):null;return f("div",{className:"\
ow-root","data-crew-manager-shell":"quiet-split",children:[i("style",{children:Tn}),i("div",{className:"ow-titlebar",children:i(
hr,{title:f("span",{className:"ow-title-line",children:["Crew Manager",i("span",{className:"ow-beta","aria-label":"Beta \
preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still running, and what finished recently."})}),
i("div",{className:"ow-body",children:f("div",{className:"ow-layout",ref:Ge,style:Z.conductor!=null?{"--ow-conductor-w":`${Z.
conductor}px`}:void 0,children:[f("div",{className:"ow-main","data-open-row":to,ref:Ye,style:Z.work!=null?{"--ow-work-w":`${Z.
work}px`}:void 0,children:[f("details",{...et("work"),"aria-label":"Work",children:[f("summary",{onClick:n=>{n.preventDefault(),
d!=="work"&&I("work")},children:[f("span",{className:"ow-stack-title",children:[i(pe,{className:"ow-icon ow-stack-chevro\
n"}),i(It,{className:"ow-icon"}),Hn.work,i(Q,{variant:"muted",children:Ne.all})]}),i("span",{className:"ow-stack-actions",
children:d==="work"?i(vt,{lastUpdated:nt,refreshing:Se,onRefresh:rt}):i(xt,{id:"work",onPromote:_e})})]}),f("div",{className:"\
ow-worksplit",children:[i("nav",{className:"ow-railnav",role:"group","aria-label":"Filter by state",children:Object.keys(
St).map(n=>f(L,{onClick:()=>c(n),"aria-pressed":a===n,"data-selected":a===n,className:"ow-filter ow-railitem",children:[
i("span",{className:"ow-railitem-label",children:St[n]}),i("span",{className:"ow-count",children:io[n]})]},n))}),i("main",
{className:"ow-work",children:i("div",{className:"ow-work-inner",children:no?i(Pn,{rows:7}):Ot&&!h?i(En,{icon:i(zn,{className:"\
ow-icon"}),title:"Crew Manager could not load the work view",subtitle:Ot.message,action:i(L,{onClick:ao,children:"Try ag\
ain"})}):Ie.length===0?i(En,{icon:i(dr,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter to se\
e sessions in another state."}):a==="all"?f(Ue,{children:[i(Me,{title:"Needs you",subtitle:"Waiting on a decision or rep\
ly from you",items:po,doneBySession:st,selectedId:s,onSelect:Pe,onSnooze:Ut,onHandled:Gt,footer:Oe.snoozedCount>0?f("but\
ton",{type:"button",className:"ow-aside-note",onClick:co,children:[Oe.snoozedCount," set aside for later \u2014 bring back"]}):
void 0,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{Ce(n,l)},permissionBusy:q!==null,onRetry:n=>{
Ae(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{he(n)},emptyLabel:"Nothing needs your inp\
ut right now."}),i(Me,{title:"Follow up",subtitle:"Pick back up where a session left off",items:go,doneBySession:st,selectedId:s,
onSelect:Pe,onSnooze:Ut,onHandled:Gt,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{Ce(n,
l)},permissionBusy:q!==null,onRetry:n=>{Ae(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{he(
n)},emptyLabel:"Nothing to follow up on."}),i(Me,{title:"In progress",subtitle:"Being worked on right now",items:Le.running,
doneBySession:st,selectedId:s,onSelect:Pe,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{
Ce(n,l)},permissionBusy:q!==null,onRetry:n=>{Ae(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{
he(n)},emptyLabel:"Nothing is in progress right now."}),i(Me,{title:"Done recently",subtitle:"Finished in the last few d\
ays",items:Le.done,selectedId:s,onSelect:Pe,collapsed:Vn,onToggleCollapsed:uo,onOpenSession:Te,onAnswerPermission:(n,l)=>{
fe(n,l)},onDecideApproval:(n,l)=>{Ce(n,l)},permissionBusy:q!==null,onRetry:n=>{Ae(n)},retryBusy:re!==null,onStop:n=>{We(
n)},stopBusy:se!==null,onPickStep:n=>{he(n)},emptyLabel:"No recent completed work."})]}):i(Me,{title:St[a],items:Ie,selectedId:s,
onSelect:Pe,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{Ce(n,l)},permissionBusy:q!==null,
onRetry:n=>{Ae(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{he(n)},emptyLabel:"No matchin\
g work"})})})]})]}),de.includes("loops")&&f("details",{...et("loops"),children:[f("summary",{onClick:n=>{n.preventDefault(),
d!=="loops"&&I("loops")},children:[f("span",{className:"ow-stack-title",children:[i(pe,{className:"ow-icon ow-stack-chev\
ron"}),i(Fn,{className:"ow-icon"}),"Loops"]}),f("span",{className:"ow-stack-actions",children:[i(Q,{variant:"muted",children:at.
length}),d==="loops"?i(vt,{lastUpdated:nt,refreshing:Se,onRefresh:rt}):i(xt,{id:"loops",onPromote:_e})]})]}),i("p",{className:"\
ow-stack-sub",children:"Sessions repeating a goal until it is done"}),i("div",{className:"ow-stack-body",children:at.length===
0?i("p",{className:"ow-stack-empty",children:"No loop is running right now."}):at.map(n=>{let l=Ct(n.lastFire),p=[l&&`la\
st tick ${l}`,n.remaining!==null&&`${n.remaining} remaining`].filter(Boolean).join(" \xB7 ");return f("div",{className:"\
ow-mini",children:[i("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),f("div",{children:[f("div",{className:"\
ow-mini-title",children:[n.title,i("span",{className:"ow-mini-chip",children:n.progress})]}),n.instruction&&i("div",{className:"\
ow-mini-desc",title:n.instruction,children:n.instruction}),p&&i("div",{className:"ow-mini-when",children:p})]}),i(Q,{variant:"\
ok",children:"Active"})]},n.key)})})]}),de.includes("schedule")&&f("details",{...et("schedule"),children:[f("summary",{onClick:n=>{
n.preventDefault(),d!=="schedule"&&I("schedule")},children:[f("span",{className:"ow-stack-title",children:[i(pe,{className:"\
ow-icon ow-stack-chevron"}),i(or,{className:"ow-icon"}),"Scheduled tasks"]}),f("span",{className:"ow-stack-actions",children:[
f(Q,{variant:we.failed>0?"err":"muted",children:[we.done,"/",we.total," today"]}),d==="schedule"?i(vt,{lastUpdated:nt,refreshing:Se,
onRefresh:rt}):i(xt,{id:"schedule",onPromote:_e})]})]}),i("p",{className:"ow-stack-sub",children:we.historyKnown?"Today'\
s runs only \u2014 jobs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be\
 low"}),i("div",{className:"ow-stack-body",children:we.rows.length===0?i("p",{className:"ow-stack-empty",children:"Nothi\
ng is scheduled for today."}):we.rows.map(({job:n,ran:l,next:p,dueToday:b})=>{let _=!!(l&&l.failed>0),j=[l&&`ran today ${$n(
l.last)}${l.count>1?` (${l.count}x)`:""}`,b&&p?`next ${$n(p)}`:null].filter(Boolean).join(" \xB7 ");return f("div",{className:"\
ow-mini",children:[i("span",{className:"ow-mini-rail",style:{background:_?"var(--danger)":n.enabled===!1?"var(--muted)":
"var(--warn)"}}),f("div",{children:[i("div",{className:"ow-mini-title",children:n.name}),n.schedule&&f("div",{className:"\
ow-mini-desc",children:[n.schedule,n.cron_expr&&i("span",{className:"ow-mini-chip",children:n.cron_expr})]}),j&&i("div",
{className:"ow-mini-when",children:j})]}),n.is_running?i(Q,{variant:"aim",children:"Running"}):_?i(Q,{variant:"err",children:"\
Failed"}):n.enabled===!1?i(Q,{variant:"muted",children:"Paused"}):l?i(Q,{variant:"ok",children:"Success"}):i(Q,{variant:"\
warn",children:"Pending"})]},n.id)})})]}),Ze.length>0&&i(Ln,{side:"start",containerRef:Ye,min:Y.workMin,reserve:Y.railReserve,
max:1/0,value:Z.work,onChange:n=>Ve(l=>({...l,work:n})),label:"Resize the work column"})]}),i(Ln,{side:"end",containerRef:Ge,
min:Y.conductorMin,reserve:Y.mainReserve,max:Y.conductorMax,value:Z.conductor,onChange:n=>Ve(l=>({...l,conductor:n})),label:"\
Resize the Conductor panel"}),f("aside",{className:"ow-conductor","aria-label":"Conductor",children:[i("div",{className:"\
ow-conductor-header",children:f("div",{className:"ow-conductor-title",children:[i("h2",{children:"Conductor"}),!ge&&i("s\
pan",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),i("div",{className:"ow-chat",children:lo?
f("div",{className:"ow-chat-panel",children:[jt.length>0&&i("div",{className:"ow-permissions",role:"alert",children:jt.map(
n=>i(kr,{tool:n.tool,purpose:n.purpose,where:n.sessionLabel,busy:q!==null,onAnswer:l=>{fe(n.id,l)}},n.id))}),x&&f("div",
{className:"ow-conductor-receipt",role:"status",children:[i(qn,{className:"ow-icon"}),x]}),zt&&i("div",{className:"ow-ch\
at-error",role:"alert",children:zt}),i("div",{className:"ow-embed",children:i(fr,{slotKey:ue,frameless:!0,startAtBottom:!0,
slotControls:!0,placeholder:ge?.sessionKey&&g==="session"?"New instructions for this session\u2026":"Ask across your wor\
k\u2026",onSend:he,aboveComposer:wo})})]}):i("div",{className:"ow-chat-loading",children:i(Pn,{rows:4})})})]})]})})]})}export{Ar as default,Cr as noticedSinceLastTurn};
