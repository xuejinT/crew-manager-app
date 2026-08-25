import{useCallback as O,useEffect as Q,useId as Zn,useMemo as G,useRef as X,useState as S}from"react";import{AlertTriangle as Oo,
ArrowRight as er,Bot as tr,Check as or,ChevronRight as ee,Check as Lo,Clock as nr,Package as rr,ExternalLink as sr,MessageSquare as qo,
RefreshCw as ar,Shield as ir,Waves as Fo,Search as lr,Tag as dr,Users as Rt,Zap as cr}from"lucide-react";import{useAppApi as ur,
useNavigate as pr,useNavBadge as gr,ChatEmbed as wr}from"@kirocrew/app-sdk";import{Badge as ne,Btn as U,ContentSkeleton as Po,
EmptyState as xt,PageHeader as hr}from"@kirocrew/app-sdk/ui";function ce(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let r=Math.floor(t/60),s=t%
60;return s===0?`${r} hour${r===1?"":"s"}`:`${r}h ${s}m`}function wn(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function ao(e,t,r){let s=new Set(t.filter(Boolean));if(s.size===0)return[];let a=new Set,
c=[];for(let d of e){let w=d.slot;!w||!s.has(w)||!d.id||a.has(d.id)||(a.add(d.id),c.push({id:d.id,sessionKey:w,sessionLabel:r(
w),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return c}var Gt=5,Yt={"needs-you":0,running:1,done:2};function K(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function hn(e,t){if(e.paused)
return"";let r=K(e.next_run_ts);if(!r)return"";let s=Math.round((r-t)/1e3);return s<=0?"":ce(s)}var Vt=72;function ye(e,t){
let r=e?.replace(/\s+/g," ").trim();if(!r)return t;let a=(r.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||r).replace(
/[.;,]$/,"");if(a.length<=Vt)return a;let c=a.slice(0,Vt),d=c.lastIndexOf(" ");return`${(d>24?c.slice(0,d):c).trim()}\u2026`}
function Ue(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var fn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
mn=/^\((?:code|diff|widget|image)\)$/,bn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
xn=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,vn=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
yn=/[?？]["'”’)\]]*$/;function io(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||mn.test(t)||fn.test(
t)?null:t}function pt(e){if(!e.waiting_for_input)return null;let t=io(e);return!t||bn.test(t)||xn.test(t)?null:vn.test(t)||
yn.test(t)?t:null}function Jt(e){return e.pending_approval||pt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":"done"}function kn(e,t){if(e.pending_approval)return t("approval_waiting");let r=pt(e);return r||(e.running||e.
subagents_running||e.orchestrating?t("work_in_progress"):Ue(e)?t("linked_change_issue"):io(e)??t("recent_work_ready"))}function lo(e,t){
let r=e.project||e.workspace||e.agent;return r&&r.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop()||t("session")}function _n(e){
return e.pending_approval?"review-approval":pt(e)?"reply":"open"}function co(e){return(e.source_links??[]).map(t=>({number:String(
t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.kind==="issue"?`issue #${t.number}`:`${t.provider===
"gitlab"?"MR":"PR"} #${t.number}`,url:t.url,sessionKey:e.key,status:wn(t)}}))}function Sn(e,t){let r=co(e).map(s=>s.ref);
return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:kn(e,t),state:Jt(e),moving:Jt(e)==="running"||void 0,
issue:Ue(e),updatedAt:K(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lo(e,t),queuedBehind:e.queue_depth||
void 0,changeBlocked:Ue(e)||void 0,action:_n(e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.
key},...r]}}function gt(e,t){e.references.some(r=>r.kind===t.kind&&r.id===t.id)||e.references.push(t)}function uo(e){return(e.
source||"").toLowerCase()==="subagent"}function Nn(e,t,r){let s=uo(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,
K(t.ts)),e.summary=r(s?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=s?"subagent":"tool",e.action="review-a\
pproval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=t.tool_purpose,e.permissionInput=t.tool_input,
gt(e,{kind:"approval",id:t.id,label:t.tool||t.source||r("approval"),sessionKey:t.slot||e.sessionKey})}function Rn(e,t,r){
e.updatedAt=Math.max(e.updatedAt,K(t.started)),e.issue||=!!(t.done&&(t.error||t.outcome==="failed")),t.done?(t.error||t.
outcome==="failed")&&e.state!=="needs-you"&&(e.summary=r("agent_failed",{task:t.task})):e.state!=="needs-you"&&(e.state=
"running",e.summary=r("work_in_progress")),gt(e,{kind:"agent",id:t.id,label:t.agent||r("agent"),sessionKey:t.parent||e.sessionKey})}
var Qt=160;function po(e,t){let r=[],s=e.last_log?.trim(),a=e.phase?.trim();s&&r.push(t("workflow_fact_last_log",{log:s})),
a&&!(s&&s.toLowerCase().includes(a.toLowerCase()))&&r.push(t("workflow_fact_phase",{phase:a}));let c=e.error?.trim();c&&
r.push(t("workflow_fact_error",{error:go(c)}));let d=e.agent_error_count??0;d>0&&r.push(t("workflow_fact_agent_errors",{
count:String(d)}));let w=e.partial_result_count??0;return w>0&&r.push(t("workflow_fact_partials",{count:String(w)})),r}function go(e){
let t=/^([A-Za-z_][\w.]*)\((['"])([\s\S]*)\2,?\s*\)$/.exec(e.trim()),r=(t?t[3]:e).trim()||e.trim();return r.length>Qt?`${r.
slice(0,Qt-1)}\u2026`:r}function wo(e,t){if(e.status!=="failed")return[];let r=e.error?.trim(),s=e.name||e.run_id;return[
{what:t("workflow_step_diagnose",{name:s}),why:r?t("workflow_step_why_error",{error:go(r)}):t("workflow_step_why_generic"),
expect:(e.partial_result_count??0)>0?t("workflow_step_expect_partials",{count:String(e.partial_result_count??0)}):t("wor\
kflow_step_expect_generic")}]}function Cn(e,t,r){e.issue||=t.status==="failed",t.status==="running"&&e.state!=="needs-yo\
u"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=r("workflow_failed",{name:t.name}));let s=po(
t,r);s.length>0&&(e.progress=[...e.progress??[],...s.filter(c=>!(e.progress??[]).includes(c))]);let a=wo(t,r);a.length>0&&
(e.nextSteps=[...e.nextSteps??[],...a.filter(c=>!(e.nextSteps??[]).some(d=>d.what===c.what))]),gt(e,{kind:"workflow",id:t.
run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function In(e){switch(e.state){case"needs-you":return"\
needs-you";case"done":case"dropped":return"done";case"in-progress":return"running";default:return null}}function An(e,t,r){
return!(t.running||t.subagents_running||t.orchestrating)?!1:e===r}function Wn(e){let t=null,r=-1;for(let s of e){let a=s.
last_touched_turn??0;a>r&&(r=a,t=s)}return t}function Tn(e,t){let r=e.next_steps?.find(a=>a.what?.trim())?.what?.trim();if(r)return r;let s=[...e.progress??[]].reverse().
find(a=>a.trim());return s?s.trim():e.initial_intent?.trim()||t("work_in_progress")}var Pn=3;function En(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function Mn(e,t){if(!t)return!1;
let r=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${r}\\b`,"u").test(e)}function $n(e,t){if(e.length===
0)return[];let r=En(t);return e.filter(s=>Mn(r,s.number)).map(s=>s.ref)}function Bn(e,t,r){if(!t?.enabled)return[];let s=t.
intents??[];if(s.length===0)return[];let a=co(e),c=[],d=Wn(s),w=!!(e.running||e.subagents_running||e.orchestrating);s.forEach(
(y,i)=>{let u=!w&&y.state==="in-progress",f=u?"needs-you":In(y);if(!f)return;let N=(y.next_steps??[]).filter(k=>k.what?.
trim());c.push({id:`intent:${e.key}:${i}`,title:ye(y.title,e.title||r("untitled_work")),summary:Tn(y,r),state:f,issue:!1,
updatedAt:K(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lo(e,r),queuedBehind:e.queue_depth||void 0,
changeBlocked:Ue(e)||void 0,unverified:y.verified===!1||void 0,unattendedGoals:u?1:void 0,action:u?"resume":"open",references:[
{kind:"session",id:e.key,label:e.title||r("untitled_work"),sessionKey:e.key},...$n(a,y)],nextSteps:N,initialIntent:y.initial_intent?.
trim()||void 0,progress:(y.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:y.last_touched_turn??0,sessionTurns:t.
user_turns||void 0,sessionChanges:a.map(k=>k.ref),moving:An(y,e,d)||void 0})});let x=c.filter(y=>y.state==="needs-you"),
R=c.filter(y=>y.state!=="needs-you").sort((y,i)=>(i.lastTouchedTurn??0)-(y.lastTouchedTurn??0));return[...x,...R].slice(
0,Math.max(Pn,x.length))}var Kn=new Set(["crew-manager-conductor","overwatch-conductor"]),zn={approval_owed:100,subagent_gate:95,
input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,stalled:50,change_blocked:40,
merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Dn=3;function On(e,t){return e.updatedAt?
Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var je=5;function ho(e,t,r=Date.now()){let s=ft(e),a=No(e.filter(d=>d.state===
"needs-you"),r),c=[`Fleet: ${s["needs-you"]} waiting on the user, ${s.running} in progress, ${s.done} finished recently.`];
return a.length===0?(c.push("Nothing is waiting on the user."),c):(c.push(`Waiting on the user, in the order the list sh\
ows them (top ${Math.min(je,a.length)}):`),a.slice(0,je).forEach((d,w)=>{let x=ht($e(d,r),t),R=d.sessionKey?` [session ${d.
sessionKey}]`:"";c.push(`${w+1}. ${d.title} \u2014 ${d.summary} (${x})${R}`)}),a.length>je&&c.push(`\u2026and ${a.length-
je} more waiting.`),c)}var dt=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that",
"with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run","why",
"what","how","again","still","not"]),Xt=.6,Zt=2,fo=new Set;function ct(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!dt.has(t)))]}function eo(e,t){let r=ct(e),s=ct(t);if(r.length<Zt||s.length<Zt)return 0;
let a=r.length<=s.length?r:s,c=new Set(r.length<=s.length?s:r);return a.filter(w=>c.has(w)).length/a.length}function to(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function oo(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function no(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}var Ln=new Set(
["pull request","pull requests","status update","work in progress","code review","follow up","next step","next steps","a\
ction item","action items","kiro crew","in progress","needs you"]);function ut(e){let t=new Set,r=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??
[];for(let s of r){let a=s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(c=>c.length>
3&&c.endsWith("s")&&!c.endsWith("ss")?c.slice(0,-1):c);for(;a.length&&dt.has(a[0]);)a.shift();for(;a.length&&dt.has(a[a.
length-1]);)a.pop();if(!(a.length<2))for(let c=a.length;c>=2;c-=1)for(let d=0;d+c<=a.length;d+=1){let w=a.slice(d,d+c).join(
" ");Ln.has(w)||t.add(w)}}return[...t]}function qn(e){let t=new Set;if(e.length<Fn)return t;let r=new Map;for(let s of e)
for(let a of ut(s.title))r.set(a,(r.get(a)??0)+1);for(let[s,a]of r)a/e.length>=jn&&t.add(s);return t}var Fn=4,jn=.75;function mo(e,t,r=fo){
if(to(e).find(d=>to(t).includes(d)))return"same_change";if(oo(e).find(d=>oo(t).includes(d)))return"same_artifact";let c=ut(
t.title).filter(d=>!r.has(d));if(ut(e.title).some(d=>c.includes(d)))return"same_deliverable";if(eo(e.title,t.title)>=Xt)
return"same_topic";for(let d of no(e))for(let w of no(t))if(eo(d,w)>=Xt)return"same_step";return null}var bo={merged:[],
split:[]};function ro(e){return`${e.sessionKey??e.id}|${ct(e.title).join(" ")}`}function xo(e,t){return[ro(e),ro(t)].sort().
join("")}function Un(e,t=bo){let r=e.filter(a=>a.state!=="done"&&a.sessionKey).sort((a,c)=>(a.updatedAt||0)-(c.updatedAt||
0)),s=qn(r);for(let a=1;a<r.length;a+=1){let c=r[a];for(let d=0;d<a;d+=1){let w=r[d];if(w.sessionKey===c.sessionKey||t.split.
includes(xo(c,w)))continue;let x=mo(c,w,s);if(x){c.duplicateOf={sessionKey:w.sessionKey,title:w.title,because:x};break}}}
Hn(r,t,s)}var lt=3,so=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function Hn(e,t,r=fo){
for(let s of e){let a=[],c=new Set;for(let d of e){let w=d.sessionKey;if(w===s.sessionKey||c.has(w)||t.split.includes(xo(
s,d)))continue;let x=mo(s,d,r);x&&(c.add(w),a.push({sessionKey:w,title:d.title,because:x}))}a.length!==0&&(a.sort((d,w)=>so.
indexOf(d.because)-so.indexOf(w.because)),s.relatedSessions=a.slice(0,lt),a.length>lt&&(s.relatedMore=a.length-lt))}}var Gn=3e4;
function vo(e,t,r=Date.now()){return Object.keys(t).length===0?e:e.map(s=>{let a=t[s.id];return!a||r-a>Gn||s.state==="ru\
nning"?s:{...s,state:"running",moving:!0,instructed:!0}})}function $e(e,t=Date.now()){let r=[],s=(c,d,w=1)=>{r.push({signal:c,
weight:zn[c]*w,values:d})};e.approvalKind==="subagent"?s("subagent_gate"):e.approvalKind==="tool"&&s("approval_owed"),e.
action==="reply"&&s("input_requested"),e.unverified&&s("unverified_completion"),e.loopRepeats&&s("error_loop",{repeats:String(
e.loopRepeats)}),e.changesRequested&&s("changes_requested"),e.runFailed&&s("run_failed"),e.stalledFor&&s("stalled",{duration:ce(
e.stalledFor)}),e.assignedToYou&&s("assigned_to_you"),e.changeBlocked&&s("change_blocked"),e.mergeReady&&s("merge_ready"),
e.unattendedGoals&&s("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&s("queued_behind",{count:String(e.
queuedBehind)},Math.min(e.queuedBehind,3));let a=On(e,t);return a>0&&s("waiting_a_while",{hours:String(a)},Math.min(a,Dn)),
r.sort((c,d)=>d.weight-c.weight),{score:r.reduce((c,d)=>c+d.weight,0),signals:r}}var Yn={approval_owed:"unblock",subagent_gate:"\
unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"un\
block",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"unblock",assigned_to_you:"followup",nobody_on_it:"\
followup"};function yo(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let r of $e(e,t).signals){let s=Yn[r.signal];
if(s)return s}return null}var ko=14400*1e3;function _o(e,t,r,s=Date.now()){let a=0,c=[];for(let d of e){if(d.state!=="ne\
eds-you"){c.push(d);continue}let w=t[d.id];if(w&&w>s){a+=1;continue}let x=r[d.id];if(x!==void 0&&d.updatedAt<=x){c.push(
{...d,state:"done",issue:!1});continue}c.push(d)}return{items:c,snoozedCount:a}}var wt=4320*60*1e3;function So(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=wt}var Vn={"needs-you":1,running:-1,done:-1};function Jn(e,t,r){
let s=e.updatedAt>0,a=t.updatedAt>0;return!s&&!a?0:s?a?(e.updatedAt-t.updatedAt)*r:-1:1}function ht(e,t){let r=e.signals.
slice(0,2);return r.length===0?t("rank_nothing_pressing"):r.map(a=>t(`rank_${a.signal}`,a.values)).join(t("rank_join"))}
function No(e,t=Date.now()){let r=new Map(e.map(s=>[s.id,$e(s,t)]));return[...e].sort((s,a)=>{let c=Yt[s.state]-Yt[a.state];
if(c!==0)return c;if(s.state==="needs-you"){let d=(r.get(a.id)?.score??0)-(r.get(s.id)?.score??0);if(d!==0)return d}else if(s.
issue!==a.issue)return s.issue?-1:1;return Jn(s,a,Vn[s.state])})}function Ro(e,t,r={},s={},a={},c=bo,d=Date.now()){let w=new Map,
x=new Map;for(let i of e.slots){if(!i.key||Kn.has(i.key)||i.memory_mode==="incognito")continue;let u=Bn(i,r[i.key],t);if(u.
length>0){for(let k of u)w.set(k.id,k);let N=u.find(k=>k.state==="needs-you")??u[0];x.set(i.key,N);continue}let f=Sn(i,t);
w.set(f.id,f),x.set(i.key,f)}if(e.assigned?.length){let i=new Map;for(let h of w.values())for(let b of h.references)(b.kind===
"change"||b.kind==="issue")&&b.url&&!i.has(b.url)&&i.set(b.url,h);let u={changes_requested:0,conflict:1,checks_failing:2,
ready_to_merge:3,assigned:4},f=new Map;for(let h of e.assigned){if(!h?.url||i.has(h.url)||!(h.status in u))continue;let b=f.
get(h.status);b?b.push(h):f.set(h.status,[h])}let N=[...f.entries()].sort((h,b)=>(u[h[0]]??9)-(u[b[0]]??9)).map(h=>h[1]),
k=[];for(let h=0;k.length<Gt;h+=1){let b=!1;for(let P of N){if(k.length>=Gt)break;let B=P[h];B&&(k.push(B),b=!0)}if(!b)break}
let L=new Set(k.map(h=>h.url));for(let h of e.assigned){if(!h?.url||!i.has(h.url)&&!L.has(h.url))continue;let b=h.kind===
"issue"?"issue":"pull",P=h.status==="conflict"||h.status==="checks_failing",B=h.status==="changes_requested",z=h.status===
"ready_to_merge",H=b==="issue",E=i.get(h.url);if(E){E.owned=b,P&&(E.changeBlocked=!0,E.issue=!0),B&&(E.changesRequested=
!0),z&&(E.mergeReady=!0),(P||B||z)&&E.state==="done"&&(E.state="needs-you");continue}let W=P||B||z||H,$=b==="issue"?"own\
ed_issue_assigned":h.status==="conflict"?"owned_pull_conflict":h.status==="checks_failing"?"owned_pull_failing":h.status===
"changes_requested"?"owned_pull_changes_requested":h.status==="ready_to_merge"?"owned_pull_merge_ready":h.status==="chec\
ks_running"?"owned_pull_checks_running":"owned_pull_awaiting_review",j=b==="issue"?`issue #${h.number}`:`#${h.number}`;w.
set(`owned:${h.url}`,{id:`owned:${h.url}`,title:h.title||j,summary:t($,{count:String(h.status==="checks_failing"?h.failing:
h.pending)}),state:W?"needs-you":"running",issue:P,updatedAt:K(h.updated_at),provenance:t("owned_provenance",{repo:h.repo}),
references:[{kind:b==="issue"?"issue":"change",id:h.url,label:`${h.repo} ${j}`,url:h.url,status:h.status==="awaiting_rev\
iew"?void 0:h.status.replace(/_/g," ")}],action:void 0,owned:b,changeBlocked:P||void 0,changesRequested:B||void 0,mergeReady:z||
void 0,assignedToYou:H||void 0})}}for(let[i,u]of Object.entries(s)){let f=x.get(i);f&&(f.state="needs-you",f.issue=!0,f.
stalledFor=u.silent_secs,f.summary=u.reason?t("stalled_because",{reason:u.reason,duration:ce(u.silent_secs)}):t("stalled\
_for",{duration:ce(u.silent_secs)}),f.action="open")}for(let[i,u]of Object.entries(a)){let f=x.get(i);f&&(f.state="needs\
-you",f.issue=!0,f.loopRepeats=u.repeats,f.summary=t("error_loop",{tool:u.tool,repeats:String(u.repeats)}),f.action="ope\
n")}for(let i of e.approvals){let u=i.slot?x.get(i.slot):void 0;if(u){Nn(u,i,t);continue}w.set(`approval:${i.id}`,{id:`a\
pproval:${i.id}`,title:ye(i.tool||i.source,t("approval_needed")),summary:i.tool_purpose||t("tool_call_waiting"),state:"n\
eeds-you",issue:!1,updatedAt:K(i.ts),provenance:t("approval"),action:"review-approval",approvalKind:uo(i)?"subagent":"to\
ol",permissionId:i.id,permissionTool:i.tool||i.source,permissionPurpose:i.tool_purpose,permissionInput:i.tool_input,references:[
{kind:"approval",id:i.id,label:i.tool||i.source||t("approval")}]})}for(let i of e.agents){let u=i.parent?x.get(i.parent):
void 0;if(u){Rn(u,i,t);continue}let f=!!(i.done&&(i.error||i.outcome==="failed"));i.parent&&!f||w.set(`agent:${i.id}`,{id:`\
agent:${i.id}`,title:ye(i.task||i.agent,t("agent_work")),summary:f?i.error?.trim()||t("agent_failed",{task:i.task}):i.done?
t("agent_done"):t("work_in_progress"),state:f?"needs-you":i.done?"done":"running",issue:f,runFailed:f||void 0,retryPath:f&&
!i.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(i.id)}/retry`:void 0,updatedAt:K(i.started),provenance:i.agent||
t("agent"),action:"discuss",references:[{kind:"agent",id:i.id,label:i.agent||t("agent")}]})}for(let i of e.workflows){let u=i.
session_key?x.get(i.session_key):void 0;if(u){Cn(u,i,t);continue}let f=i.status==="failed";w.set(`workflow:${i.run_id}`,
{id:`workflow:${i.run_id}`,title:ye(i.name,i.run_id),summary:f?t("workflow_failed_generic"):i.status==="running"?t("work\
flow_running"):t("workflow_finished"),state:f?"needs-you":i.status==="running"?"running":"done",issue:f,runFailed:f||void 0,
progress:po(i,t),nextSteps:wo(i,t),retryPath:f?`/api/workflows/runs/${encodeURIComponent(i.run_id)}/rerun`:void 0,updatedAt:0,
provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:i.run_id,label:i.name||i.run_id}]})}for(let i of e.
crons){if(!i.is_running&&i.last_status!=="error")continue;let u=i.last_status==="error",f=hn(i,d),N=t(u?"monitor_failed":
"monitor_running");w.set(`monitor:${i.id}`,{id:`monitor:${i.id}`,title:i.name,summary:f?`${N} ${t("monitor_next_check",{
duration:f})}`:N,state:u?"needs-you":"running",issue:u,runFailed:u||void 0,retryPath:u?`/api/crons/${encodeURIComponent(
i.id)}/run`:void 0,updatedAt:K(i.running_since||i.last_run_ts||i.created_ts),provenance:t("monitor"),action:u?"discuss":
void 0,references:[{kind:"monitor",id:i.id,label:i.name}]})}for(let i of e.loops||[]){if(!i.active)continue;let u=String(
i.id||"");if(!u)continue;let f=Math.max(0,Number(i.cycle_count)||0),N=Math.max(0,Number(i.max_cycles)||0),k=i.slot_key&&
x.has(i.slot_key)?i.slot_key:void 0;w.set(`loop:${u}`,{id:`loop:${u}`,title:ye(i.message||"",t("loop")),summary:N?t("loo\
p_watching_capped",{cycles:String(f),cap:String(N)}):t("loop_watching",{cycles:String(f)}),state:"running",issue:!1,updatedAt:K(
i.last_fire_ts||i.created_ts),sessionKey:k,parentId:k?x.get(k)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(
u)}`,action:k?"open":void 0,references:[{kind:"monitor",id:u,label:t("loop"),sessionKey:k},...k?[{kind:"session",id:k,label:x.
get(k)?.title||k,sessionKey:k}]:[]]})}let R=[...e.artifacts].sort((i,u)=>K(u.updated_at)-K(i.updated_at)).slice(0,8);for(let i of R){
let u=i.session_key&&x.has(i.session_key)?i.session_key:void 0;w.set(`artifact:${i.slug}`,{id:`artifact:${i.slug}`,title:ye(
i.name,t("artifact")),summary:i.description||t("artifact_ready",{kind:i.kind}),state:"done",issue:!1,updatedAt:K(i.updated_at||
i.created_at),sessionKey:u,parentId:u?x.get(u)?.id:void 0,provenance:i.session_title||i.source||t("artifact"),action:u?"\
open":void 0,references:[{kind:"artifact",id:i.slug,label:i.name,sessionKey:u},...u?[{kind:"session",id:u,label:i.session_title||
u,sessionKey:u}]:[]]})}let y=[...w.values()];return Un(y,c),No(y)}function ft(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function Co(e){let t=[],r=new Map;for(let s of e){let a=s.sessionKey;if(!a){t.push({key:s.id,items:[s],header:null,sessionKey:null});
continue}let c=r.get(a);if(c){c.items.push(s);continue}let d={key:a,items:[s],header:"session",sessionKey:s.sessionKey??
null};r.set(a,d),t.push(d)}return t}function Io(e){let t=new Set,r=new Set,s=new Set,a=0,c=0,d=0,w=0,x=0;for(let R of e){
R.sessionKey&&t.add(R.sessionKey);for(let y of R.references)y.kind==="change"?r.add(y.id):y.kind==="issue"&&s.add(y.id);
R.id.startsWith("workflow:")?a+=1:R.id.startsWith("monitor:")?c+=1:R.id.startsWith("agent:")&&(d+=1),R.state==="needs-yo\
u"&&(w+=1),R.updatedAt>x&&(x=R.updatedAt)}return{sessions:t.size,prs:r.size,issues:s.size,loops:a,crons:c,agents:d,needsYou:w,
lastActivityAt:x}}var Qn=12;function bt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Xn(e,t=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let r=mt(e);return r===0?!0:t-r<=wt}function Ao(e,t,r=Date.
now(),s=()=>!1){return e.filter(a=>a.key&&a.key!==t&&a.memory_mode!=="incognito").filter(a=>Xn(a,r)).filter(a=>!s(a)).sort(
(a,c)=>mt(c)-mt(a)).slice(0,Qn)}function mt(e){let t=e.last_ts??e.last_activity_ts??e.created;if(typeof t=="number")return t>
1e10?t:t*1e3;if(!t)return 0;let r=Date.parse(t);return Number.isFinite(r)?r:0}async function Wo(e,t){let r={},s="unknown";
for(let a of e)try{let c=await t(`/api/chat/slots/${encodeURIComponent(a.key)}/summary`);if(!c||typeof c!="object"){s="u\
nsupported";break}if(c.enabled===!1){s="disabled";break}r[a.key]=c,s="available"}catch{s="unsupported";break}return{summaries:r,
support:s}}var To=String.raw`
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
  /* Focus ring via outline, not box-shadow, so it never replaces the lane rail.
     Keyboard-focus only; a mouse click to select shows nothing. */
  .ow-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  /* Selection recolours nothing on the row — the expanded detail and the
     Conductor quote are the feedback, so the rail and edges never change. */
  .ow-row-layout { display: flex; align-items: flex-start; gap: 12px; }
  .ow-row-content { min-width: 0; flex: 1; }
  /* Title line. The chevron is pushed to the trailing edge by the title's own
     flex growth, so it lands in the same place on every card. */
  .ow-row-heading { display: flex; min-width: 0; align-items: flex-start; gap: 8px; }
  .ow-row-chevron { flex: none; margin-top: 3px; color: var(--muted); transition: transform 140ms ease, color 140ms ease; }
  .ow-row-chevron[data-expanded='true'] { transform: rotate(90deg); }
  .ow-row:hover .ow-row-chevron { color: var(--text-strong); }
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
  /* --- Session card: one session = one card (status/name/turns, PRs, latest
     goal summary + first next step, everything else behind expand). --- */
  .ow-sessioncard {
    position: relative; display: flex; flex-direction: column;
  }
  /* Selection tints the WHOLE goal card, not just the headline: the expanded
     section is a sibling of .ow-sessioncard, so the tint lives on the enclosing
     card container and covers both (headline + expanded). The card body itself
     is inert — quoting is the deliberate "Reference in chat" hover action, not a
     stray click, so no pointer cursor / focus ring here. */
  .ow-block[data-grouped='true']:has(.ow-sessioncard[data-selected='true']) { background: var(--aim-subtle); }
  .ow-sessioncard:hover .ow-row-aside,
  .ow-sessioncard:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  .ow-card-top { display: flex; align-items: center; gap: 8px; }
  .ow-card-meta {
    margin-left: auto; display: flex; align-items: center; gap: 6px;
    min-width: 0; color: var(--muted); font-size: 12px;
  }
  .ow-card-meta > * + *::before { content: '·'; margin-right: 6px; color: var(--border); }
  .ow-card-name {
    padding: 0; border: 0; background: none; font: inherit; font-size: 12px;
    color: var(--muted); font-weight: 500; max-width: 240px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; cursor: pointer;
  }
  .ow-card-name:hover { color: var(--accent); text-decoration: underline; }
  .ow-card-metapart { white-space: nowrap; }
  .ow-card-title { margin: 8px 0 0; color: var(--text-strong); font-size: 16px; font-weight: 600; line-height: 1.3; }
  .ow-card-prs { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; }
  .ow-card-pr {
    display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px;
    font-size: 12px; color: var(--text); background: var(--bg-hover);
    border: 1px solid var(--border); text-decoration: none; white-space: nowrap;
  }
  .ow-card-pr:hover { border-color: var(--border-strong); }
  .ow-card-pr-status { color: var(--muted); }
  .ow-card-pr[data-status='merged'] { color: var(--ok); background: var(--ok-subtle, rgba(52,211,153,.12)); border-color: transparent; }
  .ow-card-pr[data-status='merged'] .ow-card-pr-status { color: var(--ok); }
  .ow-card-pr[data-status='checks running'] { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
  .ow-card-pr[data-status='checks running'] .ow-card-pr-status { color: var(--accent); }
  .ow-card-pr[data-status='checks failing'], .ow-card-pr[data-status='conflict'] { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  .ow-card-pr[data-status='checks failing'] .ow-card-pr-status, .ow-card-pr[data-status='conflict'] .ow-card-pr-status { color: var(--warn); }
  .ow-card-pr[data-status='closed'] { color: var(--muted); }
  .ow-card-summary { margin: 10px 0 0; color: var(--text); font-size: 13px; line-height: 1.5; }
  /* Suggested next step: a label, then the step as one CTA (arrow + what + its
     quieter "why"). The whole button is the hit area and highlights together. */
  /* Spacing-only wrapper: the "Suggested next step" heading now uses the shared
     .ow-detail-label (a caption + trailing rule) so it matches "You asked for". */
  .ow-card-nextstep { margin-top: 12px; }
  .ow-card-step {
    display: flex; gap: 8px; align-items: flex-start; width: 100%;
    padding: 6px 8px; margin: 0 -8px; border: 0; border-radius: 6px;
    background: none; text-align: left; cursor: pointer; color: var(--text);
  }
  .ow-card-step:hover { background: var(--bg-hover); }
  .ow-card-step:hover .ow-card-step-what { color: var(--accent); }
  .ow-card-step-arrow { flex: none; margin-top: 1px; color: var(--warn); }
  .ow-card-step-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .ow-card-step-what { font-size: 13px; }
  .ow-card-step-why { color: var(--muted); font-size: 12px; font-style: italic; }
  .ow-card-expanded { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
  /* The collapse control is the card's last row; keep its hit area tight to its
     own text rather than letting the flex column stretch it full width. */
  .ow-card-collapse { align-self: flex-start; margin-top: 2px; }
  /* Up-chevron: the host's icon stub has no ChevronUp, so turn the right one. */
  .ow-card-collapse .ow-icon { transform: rotate(-90deg); }
  /* A clear section break: the session's OTHER items are distinct from the
     headline goal's own detail above, so give the group a rule + real space. */
  .ow-card-morelabel {
    margin: 20px 0 4px; padding-top: 16px; border-top: 1px solid var(--border-strong, var(--border));
    color: var(--muted-strong, var(--muted)); font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .04em;
  }
  /* One of the session's other items, in the expand — same treatment as the
     headline (status, title, its own next-step CTA, hover actions). */
  .ow-moreitem {
    position: relative; display: flex; flex-direction: column; gap: 6px;
    padding-top: 8px; border-top: 1px solid var(--border);
  }
  /* The first item sits directly under the section label's rule — don't draw a
     second line right beneath it. */
  .ow-card-morelabel + .ow-moreitem { border-top: 0; padding-top: 4px; }
  .ow-moreitem:hover .ow-row-aside,
  .ow-moreitem:focus-within .ow-row-aside { opacity: 1; pointer-events: auto; }
  .ow-moreitem-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .ow-moreitem-title { min-width: 0; color: var(--text-strong); font-size: 13px; font-weight: 600; }
  .ow-moreitem-summary { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
  /* A more-item's own expanded detail (rest of its steps + ask/progress). */
  .ow-moreitem-detail { display: flex; flex-direction: column; gap: 8px; padding: 2px 0 6px; }
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
  /* Management CTAs (Later / Handled) float top-right and appear on hover/focus
     only, so the resting row stays clean. */
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
  /* The primary aside action: quote this goal to the Conductor. */
  .ow-aside-btn--ref { color: var(--accent); font-weight: 600; }
  .ow-aside-btn--ref:hover { background: var(--accent-subtle, var(--bg-hover)); color: var(--accent); }
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
`;import{Fragment as ze,jsx as n,jsxs as p}from"react/jsx-runtime";var ue=["work"],Eo=["work"],jo={work:"Sessions",loops:"\
Loops",schedule:"Scheduled tasks"};function vt({id:e,onPromote:t}){return n(U,{className:"ow-promote","aria-label":`Move\
 ${jo[e]} to the first column`,onClick:r=>{r.preventDefault(),r.stopPropagation(),t(e)},children:"Make primary"})}function yt({
lastUpdated:e,refreshing:t,onRefresh:r}){let s=e?Ct(e):null;return p("span",{className:"ow-refreshbar",children:[s&&p("s\
pan",{className:"ow-updated","aria-live":"polite",children:["updated ",s]}),n(U,{className:"ow-refresh",onClick:a=>{a.preventDefault(),
a.stopPropagation(),r()},disabled:t,"aria-label":"Refresh",title:"Refresh",children:n(ar,{className:`ow-icon${t?" ow-spi\
n":""}`,"aria-hidden":"true"})})]})}var kt="crew-manager.snoozed",Mo="crew-manager.handled",_t="crew-manager.stack-open-\
v2",St="crew-manager.primary-v1";function ke(e,t={}){try{let r=localStorage.getItem(e);return r?JSON.parse(r):t}catch{return t}}
function pe(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Ct(e,t=Date.now()){if(!e)return null;let r=Math.
max(0,Math.round((t-e)/1e3));if(r<60)return"just now";let s=Math.round(r/60);if(s<60)return`${s}m ago`;let a=Math.round(
s/60);return a<24?`${a}h ago`:`${Math.round(a/24)}d ago`}function $o(e){return e?new Date(e).toLocaleTimeString([],{hour:"\
numeric",minute:"2-digit"}):""}var ge="crew-manager-conductor",fr=5e3,mr={session:"Session",approval:"Approval",agent:"Agent",workflow:"Workflow",monitor:"\
Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"Allow or refu\
se a sub-agent held at the spawn gate",information_needed:"Answer the request in the work thread",decision_ready:"Make t\
he decision this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"Open the linked change \
\u2014 a check is failing or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"Revi\
ew the pending {{tool}} request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool cal\
l",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"This agent stopped before finishing \u2014 noth\
ing to do here",workflow_failed:"This workflow stopped before finishing",workflow_failed_generic:"This workflow stopped \
before finishing",workflow_running:"Workflow is running",workflow_finished:"Workflow finished",workflow_fact_last_log:"G\
ot as far as: {{log}}",workflow_fact_phase:"It was in the {{phase}} phase",workflow_fact_error:"It stopped with: {{error\
}}",workflow_fact_agent_errors:"{{count}} of its agents reported an error",workflow_fact_partials:"{{count}} agents fini\
shed first, so their output survived",workflow_step_diagnose:"Find out why {{name}} stopped, then re-run it",workflow_step_why_error:"\
it failed with {{error}}, so re-running it as-is repeats that",workflow_step_why_generic:"it has not been re-run, and no\
thing says the cause is fixed",workflow_step_expect_partials:"a diagnosis, and {{count}} finished agents worth reusing",
workflow_step_expect_generic:"a diagnosis you can act on before spending another run",monitor_failed:"The latest check s\
topped before finishing",monitor_running:"Monitor is checking now",monitor_next_check:"Checks again in {{duration}}.",loop:"\
Monitor loop",loop_watching:"Re-prompting its own session \u2014 {{cycles}} cycles so far, no limit set",loop_watching_capped:"\
Re-prompting its own session \u2014 cycle {{cycles}} of {{cap}}",artifact_ready:"{{kind}} output is ready",stalled_for:"\
Check on it \u2014 no activity for {{duration}}, still marked running",stalled_because:"{{reason}} Silent for {{duration\
}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same linked change",duplicate_same_artifact:"\
Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_deliverable:"Also being worked in \u201C{{tit\
le}}\u201D \u2014 same deliverable",duplicate_same_topic:"Looks like the same work as \u201C{{title}}\u201D",duplicate_same_step:"\
Next step matches \u201C{{title}}\u201D \u2014 may be the same work",related_sessions:"{{count}} other session(s) on thi\
s same work",related_same_change:"same change",related_same_artifact:"same artifact",related_same_deliverable:"same deli\
verable",related_same_topic:"similar item",related_same_step:"same next step",related_more:"and {{count}} more",rank_approval_owed:"\
only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"the a\
gent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failure ha\
s repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{durat\
ion}}",rank_change_blocked:"a linked change is failing or conflicting",rank_changes_requested:"a reviewer asked you for \
changes",rank_assigned_to_you:"assigned to you and nobody has started it",rank_merge_ready:"approved and green \u2014 only yo\
u can merge it",rank_nobody_on_it:"nobody is on {{count}} unfinished item(s) in this session",no_next_step:"No next step\
 recorded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",owned_pull_conflict:"Your pull request has a conflict to resolve.",owned_pull_failing:"Your pull req\
uest has {{count}} failing check(s).",owned_pull_changes_requested:"A reviewer has requested changes on your pull reques\
t.",owned_pull_merge_ready:"Approved with nothing red. Only you can merge it.",owned_pull_awaiting_review:"Waiting on re\
viewers, not on you.",owned_pull_checks_running:"{{count}} check(s) still running.",owned_issue_assigned:"Assigned to yo\
u.",owned_provenance:"{{repo}}",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"\
{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work",card_asked_for:"You asked for",
card_where_it_stands:"Where it stands",card_suggested_next:"Suggested next",card_turn:"turn {{turn}}"};function F(e,t={}){
return mr[e].replace(/\{\{(\w+)\}\}/g,(r,s)=>t[s]??"")}var br={"needs-you":"Needs you",running:"Running",done:"Done"},Nt={
all:"All","needs-you":"Needs you","follow-up":"Follow up",running:"Running",done:"Done"},xr={session:qo,approval:Oo,agent:tr,
workflow:cr,monitor:Fo,artifact:rr,change:sr,issue:dr};function Ke({children:e,onActivate:t,...r}){return n("div",{...r,
role:"button",tabIndex:0,onClick:t,onKeyDown:s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),t())},children:e})}
function Bo({label:e,count:t,subtitle:r}){return p("div",{className:"ow-section-header",children:[p("div",{className:"ow\
-section-heading",children:[n("h2",{className:"ow-section-title",children:e}),n("span",{className:"ow-section-count",children:t})]}),
r&&n("p",{className:"ow-section-subtitle",children:r})]})}function It(e){let t=we(e);return t==="unblock"?p("span",{className:"\
ow-rowstate ow-rowstate--need",children:[n("span",{className:"ow-rowstate-dot","aria-hidden":"true"}),"Needs you"]}):t===
"followup"?p("span",{className:"ow-rowstate ow-rowstate--follow",children:[n("span",{className:"ow-rowstate-dot","aria-h\
idden":"true"}),"Follow up"]}):t==="running"?e.moving?p("span",{className:"ow-rowstate ow-rowstate--run",children:[n("sp\
an",{className:"ow-rowstate-spin","aria-hidden":"true"}),"Running"]}):n("span",{className:"ow-rowstate ow-rowstate--queu\
ed",children:"Queued"}):p("span",{className:"ow-rowstate ow-rowstate--done",children:[n(Lo,{className:"ow-icon","aria-hi\
dden":"true"}),"Done"]})}function vr({tool:e,purpose:t,busy:r,onAnswer:s,where:a}){return p("div",{className:"ow-permiss\
ion",children:[p("div",{className:"ow-permission-body",children:[p("div",{className:"ow-permission-head",children:[n(ir,
{className:"ow-icon","aria-hidden":"true"}),n("span",{className:"ow-permission-title",children:"Waiting for your permiss\
ion"})]}),p("p",{className:"ow-permission-what",children:[a&&p("span",{className:"ow-truncate",children:[a," "]}),a?"wan\
ts to run ":"Wants to run ",n("code",{children:e})]}),t&&n("p",{className:"ow-permission-why",children:t})]}),p("div",{className:"\
ow-permission-actions",children:[n(U,{onClick:()=>s(!0),disabled:r,children:"Approve"}),n(U,{onClick:()=>s(!1),disabled:r,
children:"Reject"})]})]})}function _e({children:e}){return n("div",{className:"ow-expand",children:n("div",{className:"o\
w-expand-inner",children:e})})}function he({label:e,children:t}){let r=Zn();return p("div",{className:"ow-detail",role:"\
group","aria-labelledby":r,children:[n("div",{className:"ow-detail-label",id:r,children:e}),t]})}function Ko(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(r=>r.label.trim().toLowerCase()!==t)}function Uo({
item:e,busy:t,onDecide:r}){let[s,a]=S(!1),c=e.permissionInput||"",d=c.trim().split(/\s+/)[0]||e.permissionTool||"";return p(
"div",{className:"ow-formal-approval",role:"presentation",onClick:w=>w.stopPropagation(),onKeyDown:w=>w.stopPropagation(),
children:[n("div",{className:"ow-formal-badge",children:"Waiting for approval"}),p("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&p("div",{className:"ow-formal-kv",children:[n("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),n("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),p("div",{className:"ow-formal-kv",children:[
n("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),n("span",{className:"ow-formal-val ow-formal-mon\
o",children:c||"(no input details)"})]})]}),p("div",{className:"ow-formal-actions",children:[n(U,{disabled:t,onClick:()=>r(
"approved"),children:"Allow once"}),p("span",{className:"ow-trust-wrap",children:[p(U,{disabled:t,onClick:()=>a(w=>!w),"\
aria-expanded":s,children:["Trust ",n(ee,{className:"ow-icon ow-trust-caret","data-open":s?"true":void 0,"aria-hidden":"\
true"})]}),s&&p("span",{className:"ow-trust-menu",role:"menu",children:[c&&n("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{a(!1),r("trust_command")},children:"Trust this exact command"}),d&&p("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),r("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),n("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),
r("trust")},children:"Trust everything in this session"})]})]}),n(U,{className:"ow-formal-reject",disabled:t,onClick:()=>r(
"rejected"),children:"Reject"})]})]})}function yr({reference:e,onOpenSession:t}){let r=xr[e.kind],s=p(ze,{children:[n(r,{className:"ow-icon"}),n("span",{className:"\
ow-truncate",children:e.label})]});return e.url?n("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_bl\
ank",rel:"noopener noreferrer",onClick:a=>a.stopPropagation(),children:s}):e.sessionKey?n(Ke,{className:"ow-reference ow\
-reference-link",onActivate:()=>t(e.sessionKey),children:s}):n("span",{className:"ow-reference",children:s})}function kr({
item:e,selected:t,continuation:r,whyRanked:s,onSelect:a,onOpenSession:c,onAnswerPermission:d,permissionBusy:w,onRetry:x,
retryBusy:R,onStop:y,stopBusy:i,onPickStep:u,onSnooze:f,onHandled:N,compact:k,headless:L,showBadge:h=!0,onDecideApproval:b}){
let P=(e.nextSteps??[]).filter(C=>C.what?.trim()),B=(e.progress??[]).filter(C=>C.trim()),z=e.initialIntent?.trim(),H=!!z||
B.length>0,E=It(e),W=e.lastTouchedTurn?F("card_turn",{turn:String(e.lastTouchedTurn)}):null,$=!!e.summary&&(P.some(C=>C.
what?.trim()===e.summary)||t&&z===e.summary?.trim()),j=!!e.summary&&(k&&!t?!s:!$),Y=s||(j?e.summary:null);return p(Ke,{onActivate:a,
className:"ow-row","aria-label":e.title,"aria-pressed":t,"aria-expanded":H?t:void 0,"data-selected":t,"data-lane":we(e),
"data-instructed":e.instructed?"true":void 0,"data-continuation":r?"true":void 0,"data-testid":`work-item-${e.id}`,children:[
n("div",{className:"ow-row-layout",children:p("div",{className:"ow-row-content",children:[!L&&p(ze,{children:[p("div",{className:"\
ow-row-heading",children:[n("span",{className:"ow-row-title",children:e.title}),W&&n("span",{className:"ow-row-turn",children:W}),
n(ee,{className:"ow-icon ow-row-chevron","data-expanded":t?"true":void 0,"aria-hidden":"true"})]}),(h&&E||Y)&&p("div",{className:"\
ow-row-status",children:[h&&E,Y&&n("span",{className:"ow-row-statustext",children:Y})]})]}),e.duplicateOf&&p(Ke,{className:"\
ow-row-duplicate",onActivate:()=>c(e.duplicateOf.sessionKey),children:[n(Rt,{className:"ow-icon","aria-hidden":"true"}),
n("span",{className:"ow-truncate",children:F(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.title})})]}),t&&e.
relatedSessions&&e.relatedSessions.length>0&&n(_e,{children:p("div",{className:"ow-related",children:[n("span",{className:"\
ow-related-label",children:F("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.map(C=>p(Ke,
{className:"ow-related-row",onActivate:()=>c(C.sessionKey),children:[n(Rt,{className:"ow-icon","aria-hidden":"true"}),n(
"span",{className:"ow-truncate",children:C.title}),n("span",{className:"ow-related-why",children:F(`related_${C.because}`)})]},
C.sessionKey)),e.relatedMore?n("span",{className:"ow-related-more",children:F("related_more",{count:String(e.relatedMore)})}):
null]})}),!r&&p("div",{className:"ow-row-meta",children:[n("span",{className:"ow-truncate",children:e.provenance}),Ko(e).
length>0&&n("span",{"aria-hidden":"true",children:"\xB7"}),n("span",{className:"ow-references",children:Ko(e).slice(0,3).
map(C=>n(yr,{reference:C,onOpenSession:c},`${C.kind}:${C.id}`))})]})]})}),t&&H&&n(_e,{children:p("div",{className:"ow-ro\
w-detail",children:[z&&n(he,{label:F("card_asked_for"),children:n("blockquote",{className:"ow-detail-quote",children:z})}),
B.length>0&&n(he,{label:F("card_where_it_stands"),children:n("ul",{className:"ow-detail-facts",children:B.map((C,ie)=>n(
"li",{children:C},`${ie}:${C}`))})})]})}),e.retryPath&&x&&n(_e,{children:n("div",{className:"ow-retry",children:n(U,{onClick:()=>x(
e.retryPath),disabled:!!R,children:"Retry"})})}),e.stopPath&&y&&n(_e,{children:n("div",{className:"ow-retry",children:n(
U,{onClick:()=>y(e.stopPath),disabled:!!i,children:i?"Stopping\u2026":"Stop this loop"})})}),e.permissionId&&b&&n(_e,{children:n(
Uo,{item:e,busy:!!w,onDecide:C=>b(e,C)})}),e.state==="needs-you"&&f&&N&&p("div",{className:"ow-row-aside",children:[n("b\
utton",{type:"button",className:"ow-aside-btn",onClick:C=>{C.stopPropagation(),f(e.id)},children:"Later"}),n("button",{type:"\
button",className:"ow-aside-btn",onClick:C=>{C.stopPropagation(),N(e.id,e.updatedAt)},children:"Handled"})]})]})}function we(e){
return e.state==="done"?"done":e.state==="running"?"running":yo(e)??"unblock"}function He({step:e,onPick:t}){return p("b\
utton",{type:"button",className:"ow-card-step",title:e.why??e.what,onClick:r=>{r.stopPropagation(),t?.(e.what)},children:[
n(er,{className:"ow-icon ow-card-step-arrow","aria-hidden":"true"}),p("span",{className:"ow-card-step-body",children:[n(
"span",{className:"ow-card-step-what",children:e.what}),e.why&&n("span",{className:"ow-card-step-why",children:e.why})]})]})}
function _r({item:e,selected:t,onSelect:r,onSnooze:s,onHandled:a,onPickStep:c}){let[d,w]=S(!1),x=e.state==="done"?[]:(e.
nextSteps??[]).filter(u=>u.what?.trim()),R=e.initialIntent?.trim(),y=(e.progress??[]).filter(u=>u.trim()),i=x.length>1||
!!R||y.length>0;return p(ze,{children:[p("div",{className:"ow-moreitem","data-selected":t?"true":void 0,"data-testid":`w\
ork-item-${e.id}`,children:[p("div",{className:"ow-moreitem-head",children:[It(e),n("span",{className:"ow-moreitem-title\
 ow-truncate",children:e.title})]}),e.summary&&n("p",{className:"ow-moreitem-summary",children:e.summary}),x[0]&&n(He,{step:x[0],
onPick:c}),i&&p("button",{type:"button",className:"ow-goals-toggle","aria-expanded":d,onClick:()=>w(u=>!u),children:[n(ee,
{className:"ow-icon","data-open":d?"true":void 0,"aria-hidden":"true"}),d?"Show less":"Show more"]}),p("div",{className:"\
ow-row-aside",children:[n("button",{type:"button",className:"ow-aside-btn ow-aside-btn--ref",onClick:()=>r(e),children:"\
Reference in chat"}),e.state==="needs-you"&&s&&n("button",{type:"button",className:"ow-aside-btn",onClick:()=>s(e.id),children:"\
Later"}),e.state==="needs-you"&&a&&n("button",{type:"button",className:"ow-aside-btn",onClick:()=>a(e.id,e.updatedAt),children:"\
Already done"})]})]}),d&&p("div",{className:"ow-moreitem-detail",children:[x.slice(1).map((u,f)=>n(He,{step:u,onPick:c},
`${e.id}:${f+1}`)),R&&n(he,{label:F("card_asked_for"),children:n("blockquote",{className:"ow-detail-quote",children:R})}),
y.length>0&&n(he,{label:F("card_where_it_stands"),children:n("ul",{className:"ow-detail-facts",children:y.map((u,f)=>n("\
li",{children:u},`${f}:${u}`))})})]})]})}function Sr({items:e,doneTitles:t,selectedId:r,onSelect:s,onOpenSession:a,onAnswerPermission:c,
onDecideApproval:d,permissionBusy:w,onRetry:x,retryBusy:R,onPickStep:y,onSnooze:i,onHandled:u}){let[f,N]=S(!1),[k,L]=S(!1),
h=[...e].sort((m,D)=>(D.lastTouchedTurn??0)-(m.lastTouchedTurn??0)),b=h[0],P=h.slice(1),B=b.sessionKey,z=e.find(m=>m.state===
"needs-you")??e.find(m=>m.state==="running")??b,H=Io(e),E=b.references.find(m=>m.kind==="session")?.label??b.provenance,
W=Ct(H.lastActivityAt),$=b.sessionTurns?`${b.sessionTurns} ${b.sessionTurns===1?"turn":"turns"}`:null,j=[W,$].filter(Boolean),
Y=[],C=new Set;for(let m of b.sessionChanges??[])m.url&&!C.has(m.url)&&(C.add(m.url),Y.push(m));let ie=(b.progress??[]).
map(m=>m.trim()).filter(Boolean).map(m=>/[.!?]$/.test(m)?m:`${m}.`).join(" "),De=ie?ie.split(/(?<=[.!?])\s+/).filter(m=>m.
trim()).slice(0,2).join(" "):"",le=b.state==="done"?[]:(b.nextSteps??[]).filter(m=>m.what?.trim()),Se=b.initialIntent?.trim(),
q=(b.progress??[]).filter(m=>m.trim()),fe=le.length>1||!!Se||q.length>0||P.length>0,V=r===b.id;return p(ze,{children:[p(
"div",{className:"ow-sessioncard","data-selected":V?"true":void 0,"data-testid":`work-item-${b.id}`,children:[p("div",{className:"\
ow-card-top",children:[It(z),p("span",{className:"ow-card-meta",children:[n("button",{type:"button",className:"ow-card-n\
ame",onClick:m=>{m.stopPropagation(),a(B)},children:E}),j.map(m=>n("span",{className:"ow-card-metapart",children:m},m))]})]}),
n("h3",{className:"ow-card-title",children:b.title}),Y.length>0&&n("div",{className:"ow-card-prs",children:Y.map(m=>p("a",
{className:"ow-card-pr","data-status":m.status||void 0,href:m.url,target:"_blank",rel:"noopener noreferrer",onClick:D=>D.
stopPropagation(),children:[m.label,m.status&&p("span",{className:"ow-card-pr-status",children:[" \xB7 ",m.status]})]},m.
id))}),De&&n("p",{className:"ow-card-summary",children:De}),le[0]&&n("div",{className:"ow-card-nextstep",children:n(he,{
label:"Suggested next step",children:n(He,{step:le[0],onPick:y})})}),V&&b.permissionId&&d&&n(_e,{children:n(Uo,{item:b,busy:!!w,
onDecide:m=>d(b,m)})}),fe&&!f&&p("button",{type:"button",className:"ow-goals-toggle","aria-expanded":!1,onClick:m=>{m.stopPropagation(),
N(!0)},children:[n(ee,{className:"ow-icon","aria-hidden":"true"}),"Show more"]}),p("div",{className:"ow-row-aside",children:[
n("button",{type:"button",className:"ow-aside-btn ow-aside-btn--ref",onClick:()=>s(b),children:"Reference in chat"}),b.state===
"needs-you"&&i&&n("button",{type:"button",className:"ow-aside-btn",onClick:()=>i(b.id),children:"Later"}),b.state==="nee\
ds-you"&&u&&n("button",{type:"button",className:"ow-aside-btn",onClick:()=>u(b.id,b.updatedAt),children:"Already done"})]})]}),
f&&p("div",{className:"ow-card-expanded",children:[le.slice(1).map((m,D)=>n(He,{step:m,onPick:y},`${D+1}:${m.what}`)),Se&&
n(he,{label:F("card_asked_for"),children:n("blockquote",{className:"ow-detail-quote",children:Se})}),q.length>0&&n(he,{label:F(
"card_where_it_stands"),children:n("ul",{className:"ow-detail-facts",children:q.map((m,D)=>n("li",{children:m},`${D}:${m}`))})}),
P.length>0&&n("div",{className:"ow-card-morelabel",children:b.state==="needs-you"?"More that needs you":b.state==="runni\
ng"?"More in progress":"More done"}),P.map(m=>n(_r,{item:m,selected:r===m.id,onSelect:s,onSnooze:i,onHandled:u,onPickStep:y},
m.id)),t&&t.length>0&&p("div",{className:"ow-lane ow-lane-done",children:[p("button",{type:"button",className:"ow-goals-\
toggle","aria-expanded":k,onClick:()=>L(m=>!m),children:[n(ee,{className:"ow-icon","data-open":k?"true":void 0,"aria-hid\
den":"true"}),t.length," done"]}),k&&n("ul",{className:"ow-done-list",children:t.map(m=>p("li",{className:"ow-row-goal-d\
one",children:[n(or,{className:"ow-icon","aria-hidden":"true"}),n("span",{className:"ow-truncate",children:m})]},m))})]}),
p("button",{type:"button",className:"ow-goals-toggle ow-card-collapse","aria-expanded":!0,onClick:m=>{m.stopPropagation(),
N(!1)},children:[n(ee,{className:"ow-icon","aria-hidden":"true"}),"Show less"]})]})]})}function Be({title:e,items:t,selectedId:r,
onSelect:s,onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:x,retryBusy:R,onStop:y,stopBusy:i,
onPickStep:u,onSnooze:f,onHandled:N,footer:k,collapsed:L,onToggleCollapsed:h,doneBySession:b,subtitle:P,hideHeader:B,emptyLabel:z}){
let H=Co(t).sort((W,$)=>Math.max(...$.items.map(j=>j.updatedAt))-Math.max(...W.items.map(j=>j.updatedAt))),E=W=>n("div",
{className:`ow-block${W.header==="session"?" ow-goalcard":""}`,"data-grouped":W.header?"true":void 0,"data-open":W.header===
"session"?"true":void 0,children:W.header==="session"&&W.sessionKey?n(Sr,{items:W.items,doneTitles:b?.[W.sessionKey],selectedId:r,
onSelect:s,onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:x,retryBusy:R,onPickStep:u,onSnooze:f,
onHandled:N}):W.items.map($=>n(kr,{item:$,selected:r===$.id,whyRanked:$.state==="needs-you"&&$.action!=="resume"?ht($e($),
F):void 0,onSelect:()=>s($),onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:x,retryBusy:R,
onStop:y,stopBusy:i,onPickStep:u,onSnooze:f,onHandled:N},$.id))},W.key);return p("section",{className:"ow-section","aria\
-label":e,children:[B?null:h?p(Ke,{onActivate:h,className:"ow-section-toggle",children:[n(Bo,{label:e,count:t.length,subtitle:P}),
n(ee,{className:"ow-icon ow-section-chevron","data-open":L?void 0:"true","aria-hidden":"true"})]}):n(Bo,{label:e,count:t.
length,subtitle:P}),L?null:n("div",{className:"ow-section-list",children:H.length===0?n("p",{className:"ow-section-empty",
children:z}):H.map(E)}),k]})}function Nr(e,t,r=[]){let s=ho(t,F),a=r.length?[`Noticed since you last spoke (${r.length})\
:`,...r.map(w=>`- ${w}`),"Mention these only if they matter to what the user asked."]:[];if(!e)return["Crew Manager cont\
ext: workspace overview.",...s,...a,"Answer the user about the state of their work. This is a conversation, not an actio\
n channel."].join(`
`);let c=e.references.map(w=>`${w.kind}: ${w.label} (${w.id})`).join(`
`),d=[e.stalledFor?`Silent for ${ce(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(w=>!!w);return[`Crew Manager context: ${e.title}`,...s,`Selected item: ${e.title}`,
`State: ${br[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...d.length>0?[`Why it is on the board:
${d.join(`
`)}`]:[],`References:
${c}`,...a,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(w=>!!w).join(`
`)}var zo="crew-manager.panel-widths";function Rr(e,t){let r=e?.first_seen;if(!r)return[];let s=typeof t=="number"?t<=1e10?
t*1e3:t:t?Date.parse(t):NaN;if(!Number.isFinite(s))return[];let a=[];for(let d of e?.stalls??[]){let w=r[d.key];typeof w==
"number"&&(w*1e3<=s||a.push(d.reason?`${d.label} went quiet \u2014 ${d.reason}`:`${d.label} went quiet after ${ce(d.silent_secs)}`))}
for(let d of e?.error_loops??[]){let w=r[d.key];typeof w=="number"&&(w*1e3<=s||a.push(`${d.label} repeated the same ${d.
tool} failure ${d.repeats} times`))}let c=5;return a.length>c?[...a.slice(0,c),`and ${a.length-c} more`]:a}var Z={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function Ge(e,t,r,s,a){let c=Math.min(a,Math.max(r,t-
s));return Math.max(r,Math.min(c,e))}function Do({side:e,containerRef:t,min:r,reserve:s,max:a,value:c,onChange:d,label:w}){
let x=(i,u)=>{let f=u.getBoundingClientRect(),N=e==="start"?i-f.left:f.right-i;return Ge(N,u.clientWidth,r,s,a)};return n(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":w,tabIndex:0,onPointerDown:i=>{
let u=t.current;if(!u)return;i.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let f=k=>d(x(k.clientX,u)),N=()=>{window.removeEventListener("pointermove",f),window.removeEventListener("pointeru\
p",N),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",f),window.addEventListener(
"pointerup",N)},onKeyDown:i=>{if(i.key!=="ArrowLeft"&&i.key!=="ArrowRight")return;let u=t.current;if(!u)return;i.preventDefault();
let f=(i.shiftKey?48:16)*(i.key==="ArrowRight"?1:-1),N=c??(e==="start"?u.clientWidth/2:Math.round(u.clientWidth*.3));d(Ge(
N+(e==="start"?f:-f),u.clientWidth,r,s,a))}})}function Cr(){let e=ur(),t=X(e);t.current=e;let r=pr(),s=gr(),[a,c]=S("all"),
[d,w]=S(()=>{let o=ke(St,null);return o&&ue.includes(o)?o:"work"}),[x,R]=S(()=>{let o=ke(_t,null),l=o&&ue.includes(o)?o:
null,g=ke(St,null),v=g&&ue.includes(g)?g:"work";return l&&l!==v?l:Eo.find(_=>_!==v)??null}),y=O(o=>{R(l=>{let g=l===o?null:
o;return pe(_t,g),g})},[]),[i,u]=S(null),[f,N]=S("session"),[k,L]=S(null),[h,b]=S(null),[P,B]=S({}),[z,H]=S("unknown"),E=X(
"unknown"),W=X(new Map),[$,j]=S({}),[Y,C]=S(null),[ie,De]=S({}),[le,Se]=S([]),[q,fe]=S(null),[V,m]=S(null),[D,At]=S(null),
[Wt,Tt]=S(()=>ke(kt)),[Pt,Ho]=S(()=>ke(Mo)),Ye=X(null),Ve=X(null),[re,Je]=S(()=>ke(zo,{work:null,conductor:null}));Q(()=>{
pe(zo,re)},[re]),Q(()=>{let o=()=>Je(l=>{let g=Ve.current?.clientWidth??0,v=Ye.current?.clientWidth??0;return{work:l.work==
null||g===0?l.work:Ge(l.work,g,Z.workMin,Z.railReserve,1/0),conductor:l.conductor==null||v===0?l.conductor:Ge(l.conductor,
v,Z.conductorMin,Z.mainReserve,Z.conductorMax)}});return o(),window.addEventListener("resize",o),()=>window.removeEventListener(
"resize",o)},[]);let[Go,Yo]=S(!0),[Et,Mt]=S({}),[$t,Qe]=S([]),[Xe,Vo]=S([]),[Jo,Ze]=S(!1),Ne=O(o=>{if(o===d)return;let l=x===
o?Eo.find(g=>g!==o)??null:x;pe(St,o),pe(_t,l),w(o),R(l)},[d,x]),Qo=O((o,l)=>{o.dataTransfer.setData("text/x-crew-panel",
l),o.dataTransfer.effectAllowed="move";let g=o.currentTarget.querySelector("summary");if(!g)return;let v=g.getBoundingClientRect();
o.dataTransfer.setDragImage(g,Math.min(Math.max(o.clientX-v.left,0),v.width),Math.min(Math.max(o.clientY-v.top,0),v.height))},
[]),Xo=O(o=>{o.preventDefault(),Ze(!1);let l=o.dataTransfer.getData("text/x-crew-panel");!l||!ue.includes(l)||Ne(l)},[Ne]),
et=G(()=>ue.filter(o=>o!==d),[d]),Zo=x&&x!==d?String(et.indexOf(x)):"none",tt=o=>{let l=o===d;return{className:"ow-card \
ow-stack-card",open:l||x===o,draggable:!0,"data-panel":o,"data-primary":l?"true":"false","data-rail-index":l?void 0:et.indexOf(
o),"data-dragover":l&&Jo?"true":void 0,onDragStart:g=>Qo(g,o),onDragOver:l?g=>{g.preventDefault(),Ze(!0)}:void 0,onDragLeave:l?
()=>Ze(!1):void 0,onDrop:l?Xo:void 0}},Bt=X(!0),[en,Kt]=S(!0),[zt,ot]=S(null),[nt,tn]=S(null),[Re,Dt]=S(!1),[on,nn]=S(!1),
[Ot,te]=S(null),M=X(!0),Ce=X(0),rt=X(!1);Q(()=>(M.current=!0,()=>{M.current=!1,Ce.current+=1}),[]);let I=O(async()=>{let o=++Ce.
current,l=t.current;try{let[g,v,_,J,qe,Fe,A,ae]=await Promise.all([l.get("/api/chat/slots"),l.get("/api/approvals"),l.get(
"/api/spawn"),l.get("/api/workflows/runs"),l.get("/api/crons"),l.get("/api/artifacts"),l.get("/api/autonudge").catch(()=>({
loops:[]})),l.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!M.current||o!==Ce.current)return;b({slots:Array.
isArray(g)?g:[],approvals:Array.isArray(v)?v:[],agents:Array.isArray(_.agents)?_.agents:[],workflows:Array.isArray(J.runs)?
J.runs:[],crons:Array.isArray(qe.jobs)?qe.jobs:[],artifacts:Array.isArray(Fe.artifacts)?Fe.artifacts:[],loops:Array.isArray(
A?.loops)?A.loops:[]}),Vo(Array.isArray(ae?.runs)?ae.runs:[]),ot(null),tn(Date.now())}catch(g){M.current&&o===Ce.current&&
ot(g instanceof Error?g:new Error("Unable to load Crew Manager sources"))}finally{M.current&&o===Ce.current&&Kt(!1)}},[]);
Q(()=>{I();let o=window.setInterval(()=>{I()},fr);return()=>window.clearInterval(o)},[I]);let rn=()=>{Kt(!0),ot(null),I()},
st=O(()=>{Re||(Dt(!0),I().finally(()=>{M.current&&Dt(!1)}))},[I,Re]);Q(()=>{if(!h||E.current==="unsupported"||E.current===
"disabled")return;let o=Ao(h.slots,ge,Date.now(),g=>W.current.get(g.key)===bt(g));if(o.length===0)return;let l=!1;return(async()=>{
let{summaries:g,support:v}=await Wo(o,_=>t.current.get(_));if(!(l||!M.current)&&(E.current=v,H(v),v==="available")){for(let _ of o)
g[_.key]&&W.current.set(_.key,bt(_));B(_=>({..._,...g}))}})(),()=>{l=!0}},[h]),Q(()=>{if(!h||!Bt.current)return;let o=!1;
return(async()=>{try{let l=await t.current.get("/api/apps/crew-manager/stalls");if(o||!M.current)return;let g={};for(let _ of l?.
stalls??[])_?.key&&(g[_.key]=_);j(g);let v={};for(let _ of l?.error_loops??[])_?.key&&(v[_.key]=_);Mt(v),C(l??null);try{
let _=await t.current.get("/api/apps/crew-manager/assigned");!o&&M.current&&Qe(_?.available&&Array.isArray(_.rows)?_.rows:
[])}catch{M.current&&Qe([])}}catch{Bt.current=!1,M.current&&(j({}),Mt({}),C(null),Qe([]))}})(),()=>{o=!0}},[h]);let Lt=G(
()=>vo(Ro({...h??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},assigned:$t},F,P,$,Et),ie),
[h,P,$,Et,ie,$t]),Oe=G(()=>_o(Lt,Wt,Pt),[Lt,Wt,Pt]),T=G(()=>Oe.items.filter(o=>So(o)),[Oe]),Ie=G(()=>ft(T),[T]),qt=G(()=>T.
filter(o=>o.state==="needs-you"&&we(o)==="followup").length,[T]),sn={...Ie,"needs-you":Math.max(0,(Ie["needs-you"]??0)-qt),
"follow-up":qt},at=G(()=>{let o={};for(let l of T){if(l.state!=="done"||!l.sessionKey)continue;let g=o[l.sessionKey];g?g.
push(l.title):o[l.sessionKey]=[l.title]}return o},[T]),se=G(()=>T.find(o=>o.id===i)??null,[T,i]),Ae=G(()=>a==="all"?T:a===
"follow-up"?T.filter(o=>o.state==="needs-you"&&we(o)==="followup"):a==="needs-you"?T.filter(o=>o.state==="needs-you"&&we(
o)!=="followup"):T.filter(o=>o.state===a),[a,T]);Q(()=>s(Ie["needs-you"]),[Ie,s]),Q(()=>{i&&!T.some(o=>o.id===i)&&u(null)},
[T,i]);let de=h?.slots.find(o=>o.key===ge),an=!!(de||on),Ft=X(!1);Q(()=>{let o=de;if(!o||Ft.current||o.agent)return;Ft.current=
!0;let l=t.current;l.get("/api/apps/crew-manager/conductor-agent").then(g=>g?.available&&g.agent?g.agent:null).catch(()=>null).
then(g=>{if(!(!g||!M.current))return l.post(`/api/chat/slots/${encodeURIComponent(ge)}/agent`,{agent:g}).then(()=>{I()})}).
catch(()=>{})},[de,I]),Q(()=>{!h||de||rt.current||(rt.current=!0,e.get("/api/apps/crew-manager/conductor-agent").then(o=>o?.
available&&o.agent?o.agent:null).catch(()=>null).then(o=>e.post("/api/chat/slots",{name:ge,title:"Conductor",...o?{agent:o}:
{}})).then(()=>{M.current&&(nn(!0),I())}).catch(o=>{M.current&&(rt.current=!1,te(o instanceof Error?`Conductor session c\
ould not be created: ${o.message}`:"Conductor session could not be created"))}))},[e,de,I,h]);let jt=G(()=>ao(h?.approvals??
[],le,o=>T.find(l=>l.sessionKey===o)?.title??h?.slots?.find(l=>l.key===o)?.title??o),[T,h,le]),me=se&&!se.permissionId?se:
null,it=G(()=>{let o=(h?.loops??[]).filter(g=>g&&g.active!==!1&&g.slot_key);if(o.length===0)return[];let l=new Map;for(let g of T)
for(let v of g.references)v.kind!=="session"||!v.id||v.label&&!l.has(v.id)&&l.set(v.id,v.label);return o.map(g=>{let v=Number(
g.cycle_count)||0,_=Number(g.max_cycles)||0;return{key:g.slot_key,title:l.get(g.slot_key)??g.slot_key,progress:_>0?`${v}\
/${_}`:`${v} ${v===1?"cycle":"cycles"}`,remaining:_>0?Math.max(0,_-v):null,instruction:(g.message??"").replace(/\s+/g," ").
trim(),lastFire:K(g.last_fire_ts)}})},[h,T]),be=G(()=>{let o=new Date;o.setHours(0,0,0,0);let l=o.getTime(),g=l+864e5,v=h?.
crons??[],_=new Map;for(let A of Xe){let ae=K(A.started_at);if(!A.job_id||ae<l||ae>=g)continue;let oe=_.get(A.job_id)??{
count:0,failed:0,last:0};oe.count+=1,A.status&&A.status!=="success"&&(oe.failed+=1),oe.last=Math.max(oe.last,ae),_.set(A.
job_id,oe)}let J=v.map(A=>{let ae=_.get(A.id),oe=K(A.next_run_ts),gn=oe>=l&&oe<g;return{job:A,ran:ae,next:oe,dueToday:gn}}).
filter(A=>A.ran||A.dueToday||A.job.is_running),qe=J.filter(A=>A.ran&&A.ran.failed===0).length,Fe=J.filter(A=>A.ran&&A.ran.
failed>0).length;return{rows:J,done:qe,failed:Fe,total:J.length,historyKnown:Xe.length>0}},[h,Xe]),xe=O(async(o,l)=>{if(!q){
fe(o),te(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(o)}/${l?"approve":"reject"}`,{}),I()}catch(g){
te(g instanceof Error?`Could not answer that request: ${g.message}`:"Could not answer that request"),I()}finally{M.current&&
fe(null)}}},[I,q]),We=O(async(o,l)=>{if(!(q||!o.permissionId||!o.sessionKey)){fe(o.permissionId),te(null);try{await t.current.
post(`/api/chat/slots/${encodeURIComponent(o.sessionKey)}/approve`,{action:l,request_id:o.permissionId}),I()}catch(g){te(
g instanceof Error?`Could not answer that request: ${g.message}`:"Could not answer that request"),I()}finally{M.current&&
fe(null)}}},[I,q]),Ut=O(o=>{Tt(l=>{let g=Object.fromEntries(Object.entries(l).filter(([,v])=>v>Date.now()));return g[o]=
Date.now()+ko,pe(kt,g),g}),u(null)},[]),Ht=O((o,l)=>{Ho(g=>{let v={...g,[o]:l};return pe(Mo,v),v}),u(null)},[]),ln=O(()=>{
Tt({}),pe(kt,{})},[]),dn=O(()=>{Yo(o=>!o)},[]),Te=O(async o=>{if(!V){m(o),te(null);try{await t.current.post(o,{}),I()}catch(l){
te(l instanceof Error?`Could not re-run it: ${l.message}`:"Could not re-run it"),I()}finally{M.current&&m(null)}}},[I,V]),
Pe=O(async o=>{if(!D){At(o),te(null);try{await t.current.del(o),L("Stopped the monitor loop. Re-arming it is done from t\
he session itself."),I()}catch(l){let g=l instanceof Error?l.message:"";/404|not found/i.test(g)?L("That loop had alread\
y stopped."):te(g?`Could not stop it: ${g}`:"Could not stop it"),I()}finally{M.current&&At(null)}}},[I,D]),ve=O(async o=>{
let l=se&&!se.permissionId?se:null;if(f==="session"&&l?.sessionKey){let g=l.sessionKey;if(await t.current.post("/api/cha\
t",{message:o,slot:g}).catch(v=>{if(!(v instanceof SyntaxError))throw v}),!M.current)return;De(v=>({...v,[l.id]:Date.now()})),
Se(v=>v.includes(g)?v:[...v,g]),L(`Sent new instructions to ${l.title}`),u(null),I();return}await t.current.post(`/api/c\
hat/slots/${encodeURIComponent(ge)}/context`,{content:Nr(se,T,Rr(Y,de?.last_ts)),source:"crew-manager",ephemeral:!0}).catch(
()=>{}),await t.current.post("/api/chat",{message:o,slot:ge}).catch(g=>{if(!(g instanceof SyntaxError))throw g})},[se,T,
I,f,Y,de]),Le={"needs-you":Ae.filter(o=>o.state==="needs-you"),running:Ae.filter(o=>o.state==="running"),done:Ae.filter(
o=>o.state==="done")},cn=Le["needs-you"].filter(o=>we(o)!=="followup"),un=Le["needs-you"].filter(o=>we(o)==="followup"),
Ee=o=>r(`/chat?sid=${encodeURIComponent(o)}`),Me=o=>{u(l=>l===o.id?null:o.id),L(null),N("session")},pn=me?p("div",{className:"\
ow-quote ow-quote-docked",children:[p("div",{className:"ow-quote-body",children:[me.sessionKey?n("button",{type:"button",
className:"ow-scope-toggle","aria-pressed":f==="conductor","aria-label":f==="session"?"Sending to this session. Activate\
 to send to the Conductor instead.":"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>N(
o=>o==="session"?"conductor":"session"),children:f==="session"?"Instructing":"To Conductor"}):n("span",{className:"ow-ey\
ebrow",children:"Quoted"}),n("span",{className:"ow-quote-title",title:me.title,children:me.title})]}),n(U,{className:"ow\
-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{u(null),L(null)},children:"Clear"})]}):null;return p(
"div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[n("style",{children:To}),n("div",{className:"\
ow-titlebar",children:n(hr,{title:p("span",{className:"ow-title-line",children:["Crew Manager",n("span",{className:"ow-b\
eta","aria-label":"Beta preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still running, and wh\
at finished recently."})}),n("div",{className:"ow-body",children:p("div",{className:"ow-layout",ref:Ye,style:re.conductor!=
null?{"--ow-conductor-w":`${re.conductor}px`}:void 0,children:[p("div",{className:"ow-main","data-open-row":Zo,ref:Ve,style:re.
work!=null?{"--ow-work-w":`${re.work}px`}:void 0,children:[p("details",{...tt("work"),"aria-label":"Work",children:[p("s\
ummary",{onClick:o=>{o.preventDefault(),d!=="work"&&y("work")},children:[p("span",{className:"ow-stack-title",children:[
n(ee,{className:"ow-icon ow-stack-chevron"}),n(Rt,{className:"ow-icon"}),jo.work,n(ne,{variant:"muted",children:Ie.all})]}),
n("span",{className:"ow-stack-actions",children:d==="work"?n(yt,{lastUpdated:nt,refreshing:Re,onRefresh:st}):n(vt,{id:"w\
ork",onPromote:Ne})})]}),p("div",{className:"ow-worksplit",children:[n("nav",{className:"ow-railnav",role:"group","aria-\
label":"Filter by state",children:Object.keys(Nt).map(o=>p(U,{onClick:()=>c(o),"aria-pressed":a===o,"data-selected":a===
o,className:"ow-filter ow-railitem",children:[n("span",{className:"ow-railitem-label",children:Nt[o]}),n("span",{className:"\
ow-count",children:sn[o]})]},o))}),n("main",{className:"ow-work",children:n("div",{className:"ow-work-inner",children:en?
n(Po,{rows:7}):zt&&!h?n(xt,{icon:n(Oo,{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:zt.
message,action:n(U,{onClick:rn,children:"Try again"})}):z==="disabled"?n(xt,{icon:n(qo,{className:"ow-icon"}),title:"Tur\
n on session summaries to see your work",subtitle:"Crew Manager reads each session's summary to show what needs you, wha\
t's in progress, and what's done. Summaries are off right now \u2014 turn them on in Settings \u2192 Chat \u2192 Sessions.",
action:n(U,{onClick:()=>r("/settings"),children:"Open settings"})}):Ae.length===0?n(xt,{icon:n(lr,{className:"ow-icon"}),
title:"No matching work",subtitle:"Change the filter to see sessions in another state."}):a==="all"?p(ze,{children:[n(Be,
{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:cn,doneBySession:at,selectedId:i,onSelect:Me,
onSnooze:Ut,onHandled:Ht,footer:Oe.snoozedCount>0?p("button",{type:"button",className:"ow-aside-note",onClick:ln,children:[
Oe.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:Ee,onAnswerPermission:(o,l)=>{xe(o,l)},
onDecideApproval:(o,l)=>{We(o,l)},permissionBusy:q!==null,onRetry:o=>{Te(o)},retryBusy:V!==null,onStop:o=>{Pe(o)},stopBusy:D!==
null,onPickStep:o=>{ve(o)},emptyLabel:"Nothing needs your input right now."}),n(Be,{title:"Follow up",subtitle:"Pick bac\
k up where a session left off",items:un,doneBySession:at,selectedId:i,onSelect:Me,onSnooze:Ut,onHandled:Ht,onOpenSession:Ee,
onAnswerPermission:(o,l)=>{xe(o,l)},onDecideApproval:(o,l)=>{We(o,l)},permissionBusy:q!==null,onRetry:o=>{Te(o)},retryBusy:V!==
null,onStop:o=>{Pe(o)},stopBusy:D!==null,onPickStep:o=>{ve(o)},emptyLabel:"Nothing to follow up on."}),n(Be,{title:"In p\
rogress",subtitle:"Being worked on right now",items:Le.running,doneBySession:at,selectedId:i,onSelect:Me,onOpenSession:Ee,
onAnswerPermission:(o,l)=>{xe(o,l)},onDecideApproval:(o,l)=>{We(o,l)},permissionBusy:q!==null,onRetry:o=>{Te(o)},retryBusy:V!==
null,onStop:o=>{Pe(o)},stopBusy:D!==null,onPickStep:o=>{ve(o)},emptyLabel:"Nothing is in progress right now."}),n(Be,{title:"\
Done recently",subtitle:"Finished in the last few days",items:Le.done,selectedId:i,onSelect:Me,collapsed:Go,onToggleCollapsed:dn,
onOpenSession:Ee,onAnswerPermission:(o,l)=>{xe(o,l)},onDecideApproval:(o,l)=>{We(o,l)},permissionBusy:q!==null,onRetry:o=>{
Te(o)},retryBusy:V!==null,onStop:o=>{Pe(o)},stopBusy:D!==null,onPickStep:o=>{ve(o)},emptyLabel:"No recent completed work\
."})]}):n(Be,{title:Nt[a],items:Ae,selectedId:i,onSelect:Me,onOpenSession:Ee,onAnswerPermission:(o,l)=>{xe(o,l)},onDecideApproval:(o,l)=>{
We(o,l)},permissionBusy:q!==null,onRetry:o=>{Te(o)},retryBusy:V!==null,onStop:o=>{Pe(o)},stopBusy:D!==null,onPickStep:o=>{
ve(o)},emptyLabel:"No matching work"})})})]})]}),ue.includes("loops")&&p("details",{...tt("loops"),children:[p("summary",
{onClick:o=>{o.preventDefault(),d!=="loops"&&y("loops")},children:[p("span",{className:"ow-stack-title",children:[n(ee,{
className:"ow-icon ow-stack-chevron"}),n(Fo,{className:"ow-icon"}),"Loops"]}),p("span",{className:"ow-stack-actions",children:[
n(ne,{variant:"muted",children:it.length}),d==="loops"?n(yt,{lastUpdated:nt,refreshing:Re,onRefresh:st}):n(vt,{id:"loops",
onPromote:Ne})]})]}),n("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),n("div",{className:"\
ow-stack-body",children:it.length===0?n("p",{className:"ow-stack-empty",children:"No loop is running right now."}):it.map(
o=>{let l=Ct(o.lastFire),g=[l&&`last tick ${l}`,o.remaining!==null&&`${o.remaining} remaining`].filter(Boolean).join(" \xB7\
 ");return p("div",{className:"ow-mini",children:[n("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),
p("div",{children:[p("div",{className:"ow-mini-title",children:[o.title,n("span",{className:"ow-mini-chip",children:o.progress})]}),
o.instruction&&n("div",{className:"ow-mini-desc",title:o.instruction,children:o.instruction}),g&&n("div",{className:"ow-\
mini-when",children:g})]}),n(ne,{variant:"ok",children:"Active"})]},o.key)})})]}),ue.includes("schedule")&&p("details",{
...tt("schedule"),children:[p("summary",{onClick:o=>{o.preventDefault(),d!=="schedule"&&y("schedule")},children:[p("span",
{className:"ow-stack-title",children:[n(ee,{className:"ow-icon ow-stack-chevron"}),n(nr,{className:"ow-icon"}),"Schedule\
d tasks"]}),p("span",{className:"ow-stack-actions",children:[p(ne,{variant:be.failed>0?"err":"muted",children:[be.done,"\
/",be.total," today"]}),d==="schedule"?n(yt,{lastUpdated:nt,refreshing:Re,onRefresh:st}):n(vt,{id:"schedule",onPromote:Ne})]})]}),
n("p",{className:"ow-stack-sub",children:be.historyKnown?"Today's runs only \u2014 jobs with nothing scheduled today are hidd\
en":"Run history is unavailable, so completed counts may be low"}),n("div",{className:"ow-stack-body",children:be.rows.length===
0?n("p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):be.rows.map(({job:o,ran:l,next:g,dueToday:v})=>{
let _=!!(l&&l.failed>0),J=[l&&`ran today ${$o(l.last)}${l.count>1?` (${l.count}x)`:""}`,v&&g?`next ${$o(g)}`:null].filter(
Boolean).join(" \xB7 ");return p("div",{className:"ow-mini",children:[n("span",{className:"ow-mini-rail",style:{background:_?
"var(--danger)":o.enabled===!1?"var(--muted)":"var(--warn)"}}),p("div",{children:[n("div",{className:"ow-mini-title",children:o.
name}),o.schedule&&p("div",{className:"ow-mini-desc",children:[o.schedule,o.cron_expr&&n("span",{className:"ow-mini-chip",
children:o.cron_expr})]}),J&&n("div",{className:"ow-mini-when",children:J})]}),o.is_running?n(ne,{variant:"aim",children:"\
Running"}):_?n(ne,{variant:"err",children:"Failed"}):o.enabled===!1?n(ne,{variant:"muted",children:"Paused"}):l?n(ne,{variant:"\
ok",children:"Success"}):n(ne,{variant:"warn",children:"Pending"})]},o.id)})})]}),et.length>0&&n(Do,{side:"start",containerRef:Ve,
min:Z.workMin,reserve:Z.railReserve,max:1/0,value:re.work,onChange:o=>Je(l=>({...l,work:o})),label:"Resize the work colu\
mn"})]}),n(Do,{side:"end",containerRef:Ye,min:Z.conductorMin,reserve:Z.mainReserve,max:Z.conductorMax,value:re.conductor,
onChange:o=>Je(l=>({...l,conductor:o})),label:"Resize the Conductor panel"}),p("aside",{className:"ow-conductor","aria-l\
abel":"Conductor",children:[n("div",{className:"ow-conductor-header",children:p("div",{className:"ow-conductor-title",children:[
n("h2",{children:"Conductor"}),!me&&n("span",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),
n("div",{className:"ow-chat",children:an?p("div",{className:"ow-chat-panel",children:[jt.length>0&&n("div",{className:"o\
w-permissions",role:"alert",children:jt.map(o=>n(vr,{tool:o.tool,purpose:o.purpose,where:o.sessionLabel,busy:q!==null,onAnswer:l=>{
xe(o.id,l)}},o.id))}),k&&p("div",{className:"ow-conductor-receipt",role:"status",children:[n(Lo,{className:"ow-icon"}),k]}),
Ot&&n("div",{className:"ow-chat-error",role:"alert",children:Ot}),n("div",{className:"ow-embed",children:n(wr,{slotKey:ge,
frameless:!0,startAtBottom:!0,slotControls:!0,placeholder:me?.sessionKey&&f==="session"?"New instructions for this sessi\
on\u2026":"Ask across your work\u2026",onSend:ve,aboveComposer:pn})})]}):n("div",{className:"ow-chat-loading",children:n(
Po,{rows:4})})})]})]})})]})}export{Cr as default,Rr as noticedSinceLastTurn};
