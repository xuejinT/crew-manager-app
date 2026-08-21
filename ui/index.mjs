import{useCallback as D,useEffect as J,useId as Xn,useMemo as U,useRef as Q,useState as N}from"react";import{AlertTriangle as zo,
ArrowRight as Zn,Bot as er,Check as tr,ChevronRight as le,Check as Do,Clock as or,Package as nr,ExternalLink as rr,MessageSquare as sr,
RefreshCw as ar,Shield as ir,Waves as Oo,Search as lr,Tag as dr,Users as St,Zap as cr}from"lucide-react";import{useAppApi as ur,
useNavigate as pr,useNavBadge as gr,ChatEmbed as wr}from"@kirocrew/app-sdk";import{Badge as ne,Btn as G,ContentSkeleton as Ao,
EmptyState as Wo,PageHeader as hr}from"@kirocrew/app-sdk/ui";function ce(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),s=t%
60;return s===0?`${n} hour${n===1?"":"s"}`:`${n}h ${s}m`}function gn(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function no(e,t,n){let s=new Set(t.filter(Boolean));if(s.size===0)return[];let a=new Set,
c=[];for(let d of e){let p=d.slot;!p||!s.has(p)||!d.id||a.has(d.id)||(a.add(d.id),c.push({id:d.id,sessionKey:p,sessionLabel:n(
p),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return c}var Ht=5,jt={"needs-you":0,running:1,done:2};function z(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function wn(e,t){if(e.paused)
return"";let n=z(e.next_run_ts);if(!n)return"";let s=Math.round((n-t)/1e3);return s<=0?"":ce(s)}var Ut=72;function ve(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let a=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(a.length<=Ut)return a;let c=a.slice(0,Ut),d=c.lastIndexOf(" ");return`${(d>24?c.slice(0,d):c).trim()}\u2026`}
function Fe(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var hn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
fn=/^\((?:code|diff|widget|image)\)$/,mn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
bn=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,xn=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
vn=/[?？]["'”’)\]]*$/;function ro(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||fn.test(t)||hn.test(
t)?null:t}function pt(e){if(!e.waiting_for_input)return null;let t=ro(e);return!t||mn.test(t)||bn.test(t)?null:xn.test(t)||
vn.test(t)?t:null}function Gt(e){return e.pending_approval||pt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":"done"}function yn(e,t){if(e.pending_approval)return t("approval_waiting");let n=pt(e);return n||(e.running||e.
subagents_running||e.orchestrating?t("work_in_progress"):Fe(e)?t("linked_change_issue"):ro(e)??t("recent_work_ready"))}function so(e,t){
let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop()||t("session")}function kn(e){
return e.pending_approval?"review-approval":pt(e)?"reply":"open"}function ao(e){return(e.source_links??[]).map(t=>({number:String(
t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.kind==="issue"?`issue #${t.number}`:`${t.provider===
"gitlab"?"MR":"PR"} #${t.number}`,url:t.url,sessionKey:e.key,status:gn(t)}}))}function _n(e,t){let n=ao(e).map(s=>s.ref);
return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:yn(e,t),state:Gt(e),moving:Gt(e)==="running"||void 0,
issue:Fe(e),updatedAt:z(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:so(e,t),queuedBehind:e.queue_depth||
void 0,changeBlocked:Fe(e)||void 0,action:kn(e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.
key},...n]}}function gt(e,t){e.references.some(n=>n.kind===t.kind&&n.id===t.id)||e.references.push(t)}function io(e){return(e.
source||"").toLowerCase()==="subagent"}function Sn(e,t,n){let s=io(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,
z(t.ts)),e.summary=n(s?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=s?"subagent":"tool",e.action="review-a\
pproval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=t.tool_purpose,e.permissionInput=t.tool_input,
gt(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),sessionKey:t.slot||e.sessionKey})}function Rn(e,t,n){
e.updatedAt=Math.max(e.updatedAt,z(t.started)),e.issue||=!!(t.done&&(t.error||t.outcome==="failed")),t.done?(t.error||t.
outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_failed",{task:t.task})):e.state!=="needs-you"&&(e.state=
"running",e.summary=n("work_in_progress")),gt(e,{kind:"agent",id:t.id,label:t.agent||n("agent"),sessionKey:t.parent||e.sessionKey})}
var Yt=160;function lo(e,t){let n=[],s=e.last_log?.trim(),a=e.phase?.trim();s&&n.push(t("workflow_fact_last_log",{log:s})),
a&&!(s&&s.toLowerCase().includes(a.toLowerCase()))&&n.push(t("workflow_fact_phase",{phase:a}));let c=e.error?.trim();c&&
n.push(t("workflow_fact_error",{error:co(c)}));let d=e.agent_error_count??0;d>0&&n.push(t("workflow_fact_agent_errors",{
count:String(d)}));let p=e.partial_result_count??0;return p>0&&n.push(t("workflow_fact_partials",{count:String(p)})),n}function co(e){
let t=/^([A-Za-z_][\w.]*)\((['"])([\s\S]*)\2,?\s*\)$/.exec(e.trim()),n=(t?t[3]:e).trim()||e.trim();return n.length>Yt?`${n.
slice(0,Yt-1)}\u2026`:n}function uo(e,t){if(e.status!=="failed")return[];let n=e.error?.trim(),s=e.name||e.run_id;return[
{what:t("workflow_step_diagnose",{name:s}),why:n?t("workflow_step_why_error",{error:co(n)}):t("workflow_step_why_generic"),
expect:(e.partial_result_count??0)>0?t("workflow_step_expect_partials",{count:String(e.partial_result_count??0)}):t("wor\
kflow_step_expect_generic")}]}function Nn(e,t,n){e.issue||=t.status==="failed",t.status==="running"&&e.state!=="needs-yo\
u"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow_failed",{name:t.name}));let s=lo(
t,n);s.length>0&&(e.progress=[...e.progress??[],...s.filter(c=>!(e.progress??[]).includes(c))]);let a=uo(t,n);a.length>0&&
(e.nextSteps=[...e.nextSteps??[],...a.filter(c=>!(e.nextSteps??[]).some(d=>d.what===c.what))]),gt(e,{kind:"workflow",id:t.
run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function Cn(e){switch(e.state){case"needs-you":return"\
needs-you";case"done":case"dropped":return"done";case"in-progress":return"running";default:return null}}function In(e,t,n){
return!(t.running||t.subagents_running||t.orchestrating)?!1:e===n}function An(e){let t=null,n=-1;for(let s of e){let a=s.
last_touched_turn??0;a>n&&(n=a,t=s)}return t}function Wn(e,t){let n=e.next_steps?.find(a=>a.what?.trim())?.what?.trim();if(n)return n;let s=[...e.progress??[]].reverse().
find(a=>a.trim());return s?s.trim():e.initial_intent?.trim()||t("work_in_progress")}var Tn=3;function Pn(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function En(e,t){if(!t)return!1;
let n=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${n}\\b`,"u").test(e)}function Mn(e,t){if(e.length===
0)return[];let n=Pn(t);return e.filter(s=>En(n,s.number)).map(s=>s.ref)}function $n(e,t,n){if(!t?.enabled)return[];let s=t.
intents??[];if(s.length===0)return[];let a=ao(e),c=[],d=An(s),p=!!(e.running||e.subagents_running||e.orchestrating);s.forEach(
(k,i)=>{let g=!p&&k.state==="in-progress",f=g?"needs-you":Cn(k);if(!f)return;let C=(k.next_steps??[]).filter(v=>v.what?.
trim());c.push({id:`intent:${e.key}:${i}`,title:ve(k.title,e.title||n("untitled_work")),summary:Wn(k,n),state:f,issue:!1,
updatedAt:z(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:so(e,n),queuedBehind:e.queue_depth||void 0,
changeBlocked:Fe(e)||void 0,unverified:k.verified===!1||void 0,unattendedGoals:g?1:void 0,action:g?"resume":"open",references:[
{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...Mn(a,k)],nextSteps:C,initialIntent:k.initial_intent?.
trim()||void 0,progress:(k.progress??[]).filter(v=>v.trim()),stale:!!t.stale,lastTouchedTurn:k.last_touched_turn??0,sessionTurns:t.
user_turns||void 0,sessionChanges:a.map(v=>v.ref),moving:In(k,e,d)||void 0})});let b=c.filter(k=>k.state==="needs-you"),
A=c.filter(k=>k.state!=="needs-you").sort((k,i)=>(i.lastTouchedTurn??0)-(k.lastTouchedTurn??0));return[...b,...A].slice(
0,Math.max(Tn,b.length))}var Bn=new Set(["crew-manager-conductor","overwatch-conductor"]),Kn={approval_owed:100,subagent_gate:95,
input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,stalled:50,change_blocked:40,
merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},zn=3;function Dn(e,t){return e.updatedAt?
Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var qe=5;function po(e,t,n=Date.now()){let s=ht(e),a=ko(e.filter(d=>d.state===
"needs-you"),n),c=[`Fleet: ${s["needs-you"]} waiting on the user, ${s.running} in progress, ${s.done} finished recently.`];
return a.length===0?(c.push("Nothing is waiting on the user."),c):(c.push(`Waiting on the user, in the order the list sh\
ows them (top ${Math.min(qe,a.length)}):`),a.slice(0,qe).forEach((d,p)=>{let b=He(ye(d,n),t),A=d.sessionKey?` [session ${d.
sessionKey}]`:"";c.push(`${p+1}. ${d.title} \u2014 ${d.summary} (${b})${A}`)}),a.length>qe&&c.push(`\u2026and ${a.length-
qe} more waiting.`),c)}var dt=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this","that",
"with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run","why",
"what","how","again","still","not"]),Vt=.6,Jt=2,go=new Set;function ct(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!dt.has(t)))]}function Qt(e,t){let n=ct(e),s=ct(t);if(n.length<Jt||s.length<Jt)return 0;
let a=n.length<=s.length?n:s,c=new Set(n.length<=s.length?s:n);return a.filter(p=>c.has(p)).length/a.length}function Xt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Zt(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function eo(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}var On=new Set(
["pull request","pull requests","status update","work in progress","code review","follow up","next step","next steps","a\
ction item","action items","kiro crew","in progress","needs you"]);function ut(e){let t=new Set,n=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??
[];for(let s of n){let a=s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(c=>c.length>
3&&c.endsWith("s")&&!c.endsWith("ss")?c.slice(0,-1):c);for(;a.length&&dt.has(a[0]);)a.shift();for(;a.length&&dt.has(a[a.
length-1]);)a.pop();if(!(a.length<2))for(let c=a.length;c>=2;c-=1)for(let d=0;d+c<=a.length;d+=1){let p=a.slice(d,d+c).join(
" ");On.has(p)||t.add(p)}}return[...t]}function Ln(e){let t=new Set;if(e.length<qn)return t;let n=new Map;for(let s of e)
for(let a of ut(s.title))n.set(a,(n.get(a)??0)+1);for(let[s,a]of n)a/e.length>=Fn&&t.add(s);return t}var qn=4,Fn=.75;function wo(e,t,n=go){
if(Xt(e).find(d=>Xt(t).includes(d)))return"same_change";if(Zt(e).find(d=>Zt(t).includes(d)))return"same_artifact";let c=ut(
t.title).filter(d=>!n.has(d));if(ut(e.title).some(d=>c.includes(d)))return"same_deliverable";if(Qt(e.title,t.title)>=Vt)
return"same_topic";for(let d of eo(e))for(let p of eo(t))if(Qt(d,p)>=Vt)return"same_step";return null}var ho={merged:[],
split:[]};function to(e){return`${e.sessionKey??e.id}|${ct(e.title).join(" ")}`}function fo(e,t){return[to(e),to(t)].sort().
join("")}function Hn(e,t=ho){let n=e.filter(a=>a.state!=="done"&&a.sessionKey).sort((a,c)=>(a.updatedAt||0)-(c.updatedAt||
0)),s=Ln(n);for(let a=1;a<n.length;a+=1){let c=n[a];for(let d=0;d<a;d+=1){let p=n[d];if(p.sessionKey===c.sessionKey||t.split.
includes(fo(c,p)))continue;let b=wo(c,p,s);if(b){c.duplicateOf={sessionKey:p.sessionKey,title:p.title,because:b};break}}}
jn(n,t,s)}var lt=3,oo=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function jn(e,t,n=go){
for(let s of e){let a=[],c=new Set;for(let d of e){let p=d.sessionKey;if(p===s.sessionKey||c.has(p)||t.split.includes(fo(
s,d)))continue;let b=wo(s,d,n);b&&(c.add(p),a.push({sessionKey:p,title:d.title,because:b}))}a.length!==0&&(a.sort((d,p)=>oo.
indexOf(d.because)-oo.indexOf(p.because)),s.relatedSessions=a.slice(0,lt),a.length>lt&&(s.relatedMore=a.length-lt))}}var Un=3e4;
function mo(e,t,n=Date.now()){return Object.keys(t).length===0?e:e.map(s=>{let a=t[s.id];return!a||n-a>Un||s.state==="ru\
nning"?s:{...s,state:"running",moving:!0,instructed:!0}})}function ye(e,t=Date.now()){let n=[],s=(c,d,p=1)=>{n.push({signal:c,
weight:Kn[c]*p,values:d})};e.approvalKind==="subagent"?s("subagent_gate"):e.approvalKind==="tool"&&s("approval_owed"),e.
action==="reply"&&s("input_requested"),e.unverified&&s("unverified_completion"),e.loopRepeats&&s("error_loop",{repeats:String(
e.loopRepeats)}),e.changesRequested&&s("changes_requested"),e.runFailed&&s("run_failed"),e.stalledFor&&s("stalled",{duration:ce(
e.stalledFor)}),e.assignedToYou&&s("assigned_to_you"),e.changeBlocked&&s("change_blocked"),e.mergeReady&&s("merge_ready"),
e.unattendedGoals&&s("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&s("queued_behind",{count:String(e.
queuedBehind)},Math.min(e.queuedBehind,3));let a=Dn(e,t);return a>0&&s("waiting_a_while",{hours:String(a)},Math.min(a,zn)),
n.sort((c,d)=>d.weight-c.weight),{score:n.reduce((c,d)=>c+d.weight,0),signals:n}}var Gn={approval_owed:"unblock",subagent_gate:"\
unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"un\
block",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"unblock",assigned_to_you:"followup",nobody_on_it:"\
followup"};function bo(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let n of ye(e,t).signals){let s=Gn[n.signal];
if(s)return s}return null}var xo=14400*1e3;function vo(e,t,n,s=Date.now()){let a=0,c=[];for(let d of e){if(d.state!=="ne\
eds-you"){c.push(d);continue}let p=t[d.id];if(p&&p>s){a+=1;continue}let b=n[d.id];if(b!==void 0&&d.updatedAt<=b){c.push(
{...d,state:"done",issue:!1});continue}c.push(d)}return{items:c,snoozedCount:a}}var wt=4320*60*1e3;function yo(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=wt}var Yn={"needs-you":1,running:-1,done:-1};function Vn(e,t,n){
let s=e.updatedAt>0,a=t.updatedAt>0;return!s&&!a?0:s?a?(e.updatedAt-t.updatedAt)*n:-1:1}function He(e,t){let n=e.signals.
slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(a=>t(`rank_${a.signal}`,a.values)).join(t("rank_join"))}
function ko(e,t=Date.now()){let n=new Map(e.map(s=>[s.id,ye(s,t)]));return[...e].sort((s,a)=>{let c=jt[s.state]-jt[a.state];
if(c!==0)return c;if(s.state==="needs-you"){let d=(n.get(a.id)?.score??0)-(n.get(s.id)?.score??0);if(d!==0)return d}else if(s.
issue!==a.issue)return s.issue?-1:1;return Vn(s,a,Yn[s.state])})}function _o(e,t,n={},s={},a={},c=ho,d=Date.now()){let p=new Map,
b=new Map;for(let i of e.slots){if(!i.key||Bn.has(i.key)||i.memory_mode==="incognito")continue;let g=$n(i,n[i.key],t);if(g.
length>0){for(let v of g)p.set(v.id,v);let C=g.find(v=>v.state==="needs-you")??g[0];b.set(i.key,C);continue}let f=_n(i,t);
p.set(f.id,f),b.set(i.key,f)}if(e.assigned?.length){let i=new Map;for(let h of p.values())for(let R of h.references)(R.kind===
"change"||R.kind==="issue")&&R.url&&!i.has(R.url)&&i.set(R.url,h);let g={changes_requested:0,conflict:1,checks_failing:2,
ready_to_merge:3,assigned:4},f=new Map;for(let h of e.assigned){if(!h?.url||i.has(h.url)||!(h.status in g))continue;let R=f.
get(h.status);R?R.push(h):f.set(h.status,[h])}let C=[...f.entries()].sort((h,R)=>(g[h[0]]??9)-(g[R[0]]??9)).map(h=>h[1]),
v=[];for(let h=0;v.length<Ht;h+=1){let R=!1;for(let _ of C){if(v.length>=Ht)break;let $=_[h];$&&(v.push($),R=!0)}if(!R)break}
let y=new Set(v.map(h=>h.url));for(let h of e.assigned){if(!h?.url||!i.has(h.url)&&!y.has(h.url))continue;let R=h.kind===
"issue"?"issue":"pull",_=h.status==="conflict"||h.status==="checks_failing",$=h.status==="changes_requested",O=h.status===
"ready_to_merge",j=R==="issue",B=i.get(h.url);if(B){B.owned=R,_&&(B.changeBlocked=!0,B.issue=!0),$&&(B.changesRequested=
!0),O&&(B.mergeReady=!0),(_||$||O)&&B.state==="done"&&(B.state="needs-you");continue}let P=_||$||O||j,M=R==="issue"?"own\
ed_issue_assigned":h.status==="conflict"?"owned_pull_conflict":h.status==="checks_failing"?"owned_pull_failing":h.status===
"changes_requested"?"owned_pull_changes_requested":h.status==="ready_to_merge"?"owned_pull_merge_ready":h.status==="chec\
ks_running"?"owned_pull_checks_running":"owned_pull_awaiting_review",L=R==="issue"?`issue #${h.number}`:`#${h.number}`;p.
set(`owned:${h.url}`,{id:`owned:${h.url}`,title:h.title||L,summary:t(M,{count:String(h.status==="checks_failing"?h.failing:
h.pending)}),state:P?"needs-you":"running",issue:_,updatedAt:z(h.updated_at),provenance:t("owned_provenance",{repo:h.repo}),
references:[{kind:R==="issue"?"issue":"change",id:h.url,label:`${h.repo} ${L}`,url:h.url,status:h.status==="awaiting_rev\
iew"?void 0:h.status.replace(/_/g," ")}],action:void 0,owned:R,changeBlocked:_||void 0,changesRequested:$||void 0,mergeReady:O||
void 0,assignedToYou:j||void 0})}}for(let[i,g]of Object.entries(s)){let f=b.get(i);f&&(f.state="needs-you",f.issue=!0,f.
stalledFor=g.silent_secs,f.summary=g.reason?t("stalled_because",{reason:g.reason,duration:ce(g.silent_secs)}):t("stalled\
_for",{duration:ce(g.silent_secs)}),f.action="open")}for(let[i,g]of Object.entries(a)){let f=b.get(i);f&&(f.state="needs\
-you",f.issue=!0,f.loopRepeats=g.repeats,f.summary=t("error_loop",{tool:g.tool,repeats:String(g.repeats)}),f.action="ope\
n")}for(let i of e.approvals){let g=i.slot?b.get(i.slot):void 0;if(g){Sn(g,i,t);continue}p.set(`approval:${i.id}`,{id:`a\
pproval:${i.id}`,title:ve(i.tool||i.source,t("approval_needed")),summary:i.tool_purpose||t("tool_call_waiting"),state:"n\
eeds-you",issue:!1,updatedAt:z(i.ts),provenance:t("approval"),action:"review-approval",approvalKind:io(i)?"subagent":"to\
ol",permissionId:i.id,permissionTool:i.tool||i.source,permissionPurpose:i.tool_purpose,permissionInput:i.tool_input,references:[
{kind:"approval",id:i.id,label:i.tool||i.source||t("approval")}]})}for(let i of e.agents){let g=i.parent?b.get(i.parent):
void 0;if(g){Rn(g,i,t);continue}let f=!!(i.done&&(i.error||i.outcome==="failed"));i.parent&&!f||p.set(`agent:${i.id}`,{id:`\
agent:${i.id}`,title:ve(i.task||i.agent,t("agent_work")),summary:f?i.error?.trim()||t("agent_failed",{task:i.task}):i.done?
t("agent_done"):t("work_in_progress"),state:f?"needs-you":i.done?"done":"running",issue:f,runFailed:f||void 0,retryPath:f&&
!i.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(i.id)}/retry`:void 0,updatedAt:z(i.started),provenance:i.agent||
t("agent"),action:"discuss",references:[{kind:"agent",id:i.id,label:i.agent||t("agent")}]})}for(let i of e.workflows){let g=i.
session_key?b.get(i.session_key):void 0;if(g){Nn(g,i,t);continue}let f=i.status==="failed";p.set(`workflow:${i.run_id}`,
{id:`workflow:${i.run_id}`,title:ve(i.name,i.run_id),summary:f?t("workflow_failed_generic"):i.status==="running"?t("work\
flow_running"):t("workflow_finished"),state:f?"needs-you":i.status==="running"?"running":"done",issue:f,runFailed:f||void 0,
progress:lo(i,t),nextSteps:uo(i,t),retryPath:f?`/api/workflows/runs/${encodeURIComponent(i.run_id)}/rerun`:void 0,updatedAt:0,
provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:i.run_id,label:i.name||i.run_id}]})}for(let i of e.
crons){if(!i.is_running&&i.last_status!=="error")continue;let g=i.last_status==="error",f=wn(i,d),C=t(g?"monitor_failed":
"monitor_running");p.set(`monitor:${i.id}`,{id:`monitor:${i.id}`,title:i.name,summary:f?`${C} ${t("monitor_next_check",{
duration:f})}`:C,state:g?"needs-you":"running",issue:g,runFailed:g||void 0,retryPath:g?`/api/crons/${encodeURIComponent(
i.id)}/run`:void 0,updatedAt:z(i.running_since||i.last_run_ts||i.created_ts),provenance:t("monitor"),action:g?"discuss":
void 0,references:[{kind:"monitor",id:i.id,label:i.name}]})}for(let i of e.loops||[]){if(!i.active)continue;let g=String(
i.id||"");if(!g)continue;let f=Math.max(0,Number(i.cycle_count)||0),C=Math.max(0,Number(i.max_cycles)||0),v=i.slot_key&&
b.has(i.slot_key)?i.slot_key:void 0;p.set(`loop:${g}`,{id:`loop:${g}`,title:ve(i.message||"",t("loop")),summary:C?t("loo\
p_watching_capped",{cycles:String(f),cap:String(C)}):t("loop_watching",{cycles:String(f)}),state:"running",issue:!1,updatedAt:z(
i.last_fire_ts||i.created_ts),sessionKey:v,parentId:v?b.get(v)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(
g)}`,action:v?"open":void 0,references:[{kind:"monitor",id:g,label:t("loop"),sessionKey:v},...v?[{kind:"session",id:v,label:b.
get(v)?.title||v,sessionKey:v}]:[]]})}let A=[...e.artifacts].sort((i,g)=>z(g.updated_at)-z(i.updated_at)).slice(0,8);for(let i of A){
let g=i.session_key&&b.has(i.session_key)?i.session_key:void 0;p.set(`artifact:${i.slug}`,{id:`artifact:${i.slug}`,title:ve(
i.name,t("artifact")),summary:i.description||t("artifact_ready",{kind:i.kind}),state:"done",issue:!1,updatedAt:z(i.updated_at||
i.created_at),sessionKey:g,parentId:g?b.get(g)?.id:void 0,provenance:i.session_title||i.source||t("artifact"),action:g?"\
open":void 0,references:[{kind:"artifact",id:i.slug,label:i.name,sessionKey:g},...g?[{kind:"session",id:g,label:i.session_title||
g,sessionKey:g}]:[]]})}let k=[...p.values()];return Hn(k,c),ko(k)}function ht(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function So(e){let t=[],n=new Map;for(let s of e){let a=s.sessionKey;if(!a){t.push({key:s.id,items:[s],header:null,sessionKey:null});
continue}let c=n.get(a);if(c){c.items.push(s);continue}let d={key:a,items:[s],header:"session",sessionKey:s.sessionKey??
null};n.set(a,d),t.push(d)}return t}function Ro(e){let t=new Set,n=new Set,s=new Set,a=0,c=0,d=0,p=0,b=0;for(let A of e){
A.sessionKey&&t.add(A.sessionKey);for(let k of A.references)k.kind==="change"?n.add(k.id):k.kind==="issue"&&s.add(k.id);
A.id.startsWith("workflow:")?a+=1:A.id.startsWith("monitor:")?c+=1:A.id.startsWith("agent:")&&(d+=1),A.state==="needs-yo\
u"&&(p+=1),A.updatedAt>b&&(b=A.updatedAt)}return{sessions:t.size,prs:n.size,issues:s.size,loops:a,crons:c,agents:d,needsYou:p,
lastActivityAt:b}}var Jn=12;function mt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Qn(e,t=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let n=ft(e);return n===0?!0:t-n<=wt}function No(e,t,n=Date.
now(),s=()=>!1){return e.filter(a=>a.key&&a.key!==t&&a.memory_mode!=="incognito").filter(a=>Qn(a,n)).filter(a=>!s(a)).sort(
(a,c)=>ft(c)-ft(a)).slice(0,Jn)}function ft(e){let t=e.last_ts??e.last_activity_ts??e.created;if(typeof t=="number")return t>
1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Co(e,t){let n={},s="unknown";
for(let a of e)try{let c=await t(`/api/chat/slots/${encodeURIComponent(a.key)}/summary`);if(!c||typeof c!="object"){s="u\
nsupported";break}if(c.enabled===!1){s="disabled";break}n[a.key]=c,s="available"}catch{s="unsupported";break}return{summaries:n,
support:s}}var Io=String.raw`
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
    padding: 8px 10px; margin: -8px -10px 0; border-radius: 6px;
    cursor: pointer; outline: none;
  }
  /* No hover background: the enclosing .ow-block[data-grouped] is ALREADY the
     card, so filling it on hover read as the whole session container being the
     target. Hover only reveals the aside; selection gets a contained tint. NOTE:
     this must NOT be named .ow-card — that is the app's generic panel card
     (border + --card bg), which drew a second frame line inside the container. */
  .ow-sessioncard:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  /* Selection tints the WHOLE goal card, not just the headline: the expanded
     section is a sibling of .ow-sessioncard, so the tint lives on the enclosing
     card container and covers both (headline + expanded). */
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
  .ow-card-nextstep { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
  .ow-card-nextstep-label {
    margin: 0 0 6px 2px; color: var(--muted); font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .04em;
  }
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
`;import{Fragment as Ke,jsx as r,jsxs as w}from"react/jsx-runtime";var ue=["work"],To=["work"],Lo={work:"Sessions",loops:"\
Loops",schedule:"Scheduled tasks"};function bt({id:e,onPromote:t}){return r(G,{className:"ow-promote","aria-label":`Move\
 ${Lo[e]} to the first column`,onClick:n=>{n.preventDefault(),n.stopPropagation(),t(e)},children:"Make primary"})}function xt({
lastUpdated:e,refreshing:t,onRefresh:n}){let s=e?Rt(e):null;return w("span",{className:"ow-refreshbar",children:[s&&w("s\
pan",{className:"ow-updated","aria-live":"polite",children:["updated ",s]}),r(G,{className:"ow-refresh",onClick:a=>{a.preventDefault(),
a.stopPropagation(),n()},disabled:t,"aria-label":"Refresh",title:"Refresh",children:r(ar,{className:`ow-icon${t?" ow-spi\
n":""}`,"aria-hidden":"true"})})]})}var vt="crew-manager.snoozed",Po="crew-manager.handled",yt="crew-manager.stack-open-\
v2",kt="crew-manager.primary-v1";function ke(e,t={}){try{let n=localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}
function pe(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function Rt(e,t=Date.now()){if(!e)return null;let n=Math.
max(0,Math.round((t-e)/1e3));if(n<60)return"just now";let s=Math.round(n/60);if(s<60)return`${s}m ago`;let a=Math.round(
s/60);return a<24?`${a}h ago`:`${Math.round(a/24)}d ago`}function Eo(e){return e?new Date(e).toLocaleTimeString([],{hour:"\
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
verable",related_same_topic:"similar goal",related_same_step:"same next step",related_more:"and {{count}} more",rank_approval_owed:"\
only you can clear this approval",rank_subagent_gate:"a sub-agent is held at the spawn gate",rank_input_requested:"the a\
gent asked you a question",rank_unverified_completion:"finished but never verified",rank_error_loop:"the same failure ha\
s repeated {{repeats}} times",rank_run_failed:"the run failed and has not been retried",rank_stalled:"silent for {{durat\
ion}}",rank_change_blocked:"a linked change is failing or conflicting",rank_changes_requested:"a reviewer asked you for \
changes",rank_assigned_to_you:"assigned to you and nobody has started it",rank_merge_ready:"approved and green \u2014 only yo\
u can merge it",rank_nobody_on_it:"nobody is on {{count}} unfinished goal(s) in this session",no_next_step:"No next step\
 recorded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",owned_pull_conflict:"Your pull request has a conflict to resolve.",owned_pull_failing:"Your pull req\
uest has {{count}} failing check(s).",owned_pull_changes_requested:"A reviewer has requested changes on your pull reques\
t.",owned_pull_merge_ready:"Approved with nothing red. Only you can merge it.",owned_pull_awaiting_review:"Waiting on re\
viewers, not on you.",owned_pull_checks_running:"{{count}} check(s) still running.",owned_issue_assigned:"Assigned to yo\
u.",owned_provenance:"{{repo}}",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"\
{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work",card_asked_for:"You asked for",
card_where_it_stands:"Where it stands",card_suggested_next:"Suggested next",card_turn:"turn {{turn}}"};function H(e,t={}){
return mr[e].replace(/\{\{(\w+)\}\}/g,(n,s)=>t[s]??"")}var br={"needs-you":"Needs you",running:"Running",done:"Done"},_t={
all:"All","needs-you":"Needs you","follow-up":"Follow up",running:"Running",done:"Done"},xr={session:sr,approval:zo,agent:er,
workflow:cr,monitor:Oo,artifact:nr,change:rr,issue:dr};function Se({children:e,onActivate:t,...n}){return r("div",{...n,
role:"button",tabIndex:0,onClick:t,onKeyDown:s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),t())},children:e})}
function Mo({label:e,count:t,subtitle:n}){return w("div",{className:"ow-section-header",children:[w("div",{className:"ow\
-section-heading",children:[r("h2",{className:"ow-section-title",children:e}),r("span",{className:"ow-section-count",children:t})]}),
n&&r("p",{className:"ow-section-subtitle",children:n})]})}function qo(e){let t=we(e);return t==="unblock"?w("span",{className:"\
ow-rowstate ow-rowstate--need",children:[r("span",{className:"ow-rowstate-dot","aria-hidden":"true"}),"Needs you"]}):t===
"followup"?w("span",{className:"ow-rowstate ow-rowstate--follow",children:[r("span",{className:"ow-rowstate-dot","aria-h\
idden":"true"}),"Follow up"]}):t==="running"?e.moving?w("span",{className:"ow-rowstate ow-rowstate--run",children:[r("sp\
an",{className:"ow-rowstate-spin","aria-hidden":"true"}),"Running"]}):r("span",{className:"ow-rowstate ow-rowstate--queu\
ed",children:"Queued"}):w("span",{className:"ow-rowstate ow-rowstate--done",children:[r(Do,{className:"ow-icon","aria-hi\
dden":"true"}),"Done"]})}function vr({tool:e,purpose:t,busy:n,onAnswer:s,where:a}){return w("div",{className:"ow-permiss\
ion",children:[w("div",{className:"ow-permission-body",children:[w("div",{className:"ow-permission-head",children:[r(ir,
{className:"ow-icon","aria-hidden":"true"}),r("span",{className:"ow-permission-title",children:"Waiting for your permiss\
ion"})]}),w("p",{className:"ow-permission-what",children:[a&&w("span",{className:"ow-truncate",children:[a," "]}),a?"wan\
ts to run ":"Wants to run ",r("code",{children:e})]}),t&&r("p",{className:"ow-permission-why",children:t})]}),w("div",{className:"\
ow-permission-actions",children:[r(G,{onClick:()=>s(!0),disabled:n,children:"Approve"}),r(G,{onClick:()=>s(!1),disabled:n,
children:"Reject"})]})]})}function _e({children:e}){return r("div",{className:"ow-expand",children:r("div",{className:"o\
w-expand-inner",children:e})})}function je({label:e,children:t}){let n=Xn();return w("div",{className:"ow-detail",role:"\
group","aria-labelledby":n,children:[r("div",{className:"ow-detail-label",id:n,children:e}),t]})}function $o(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function Fo({
item:e,busy:t,onDecide:n}){let[s,a]=N(!1),c=e.permissionInput||"",d=c.trim().split(/\s+/)[0]||e.permissionTool||"";return w(
"div",{className:"ow-formal-approval",role:"presentation",onClick:p=>p.stopPropagation(),onKeyDown:p=>p.stopPropagation(),
children:[r("div",{className:"ow-formal-badge",children:"Waiting for approval"}),w("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&w("div",{className:"ow-formal-kv",children:[r("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),r("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),w("div",{className:"ow-formal-kv",children:[
r("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),r("span",{className:"ow-formal-val ow-formal-mon\
o",children:c||"(no input details)"})]})]}),w("div",{className:"ow-formal-actions",children:[r(G,{disabled:t,onClick:()=>n(
"approved"),children:"Allow once"}),w("span",{className:"ow-trust-wrap",children:[w(G,{disabled:t,onClick:()=>a(p=>!p),"\
aria-expanded":s,children:["Trust ",r(le,{className:"ow-icon ow-trust-caret","data-open":s?"true":void 0,"aria-hidden":"\
true"})]}),s&&w("span",{className:"ow-trust-menu",role:"menu",children:[c&&r("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{a(!1),n("trust_command")},children:"Trust this exact command"}),d&&w("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),n("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),r("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{a(!1),
n("trust")},children:"Trust everything in this session"})]})]}),r(G,{className:"ow-formal-reject",disabled:t,onClick:()=>n(
"rejected"),children:"Reject"})]})]})}function yr({reference:e,onOpenSession:t}){let n=xr[e.kind],s=w(Ke,{children:[r(n,{className:"ow-icon"}),r("span",{className:"\
ow-truncate",children:e.label})]});return e.url?r("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_bl\
ank",rel:"noopener noreferrer",onClick:a=>a.stopPropagation(),children:s}):e.sessionKey?r(Se,{className:"ow-reference ow\
-reference-link",onActivate:()=>t(e.sessionKey),children:s}):r("span",{className:"ow-reference",children:s})}function Ho({
item:e,selected:t,continuation:n,whyRanked:s,onSelect:a,onOpenSession:c,onAnswerPermission:d,permissionBusy:p,onRetry:b,
retryBusy:A,onStop:k,stopBusy:i,onPickStep:g,onSnooze:f,onHandled:C,compact:v,headless:y,showBadge:h=!0,onDecideApproval:R}){
let _=(e.nextSteps??[]).filter(I=>I.what?.trim()),$=(e.progress??[]).filter(I=>I.trim()),O=e.initialIntent?.trim(),j=!!O||
$.length>0,B=qo(e),P=e.lastTouchedTurn?H("card_turn",{turn:String(e.lastTouchedTurn)}):null,M=!!e.summary&&(_.some(I=>I.
what?.trim()===e.summary)||t&&O===e.summary?.trim()),L=!!e.summary&&(v&&!t?!s:!M),Z=s||(L?e.summary:null);return w(Se,{onActivate:a,
className:"ow-row","aria-label":e.title,"aria-pressed":t,"aria-expanded":j?t:void 0,"data-selected":t,"data-lane":we(e),
"data-instructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.id}`,children:[
r("div",{className:"ow-row-layout",children:w("div",{className:"ow-row-content",children:[!y&&w(Ke,{children:[w("div",{className:"\
ow-row-heading",children:[r("span",{className:"ow-row-title",children:e.title}),P&&r("span",{className:"ow-row-turn",children:P}),
r(le,{className:"ow-icon ow-row-chevron","data-expanded":t?"true":void 0,"aria-hidden":"true"})]}),(h&&B||Z)&&w("div",{className:"\
ow-row-status",children:[h&&B,Z&&r("span",{className:"ow-row-statustext",children:Z})]})]}),e.duplicateOf&&w(Se,{className:"\
ow-row-duplicate",onActivate:()=>c(e.duplicateOf.sessionKey),children:[r(St,{className:"ow-icon","aria-hidden":"true"}),
r("span",{className:"ow-truncate",children:H(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.title})})]}),t&&e.
relatedSessions&&e.relatedSessions.length>0&&r(_e,{children:w("div",{className:"ow-related",children:[r("span",{className:"\
ow-related-label",children:H("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.map(I=>w(Se,
{className:"ow-related-row",onActivate:()=>c(I.sessionKey),children:[r(St,{className:"ow-icon","aria-hidden":"true"}),r(
"span",{className:"ow-truncate",children:I.title}),r("span",{className:"ow-related-why",children:H(`related_${I.because}`)})]},
I.sessionKey)),e.relatedMore?r("span",{className:"ow-related-more",children:H("related_more",{count:String(e.relatedMore)})}):
null]})}),!n&&w("div",{className:"ow-row-meta",children:[r("span",{className:"ow-truncate",children:e.provenance}),$o(e).
length>0&&r("span",{"aria-hidden":"true",children:"\xB7"}),r("span",{className:"ow-references",children:$o(e).slice(0,3).
map(I=>r(yr,{reference:I,onOpenSession:c},`${I.kind}:${I.id}`))})]})]})}),t&&j&&r(_e,{children:w("div",{className:"ow-ro\
w-detail",children:[O&&r(je,{label:H("card_asked_for"),children:r("blockquote",{className:"ow-detail-quote",children:O})}),
$.length>0&&r(je,{label:H("card_where_it_stands"),children:r("ul",{className:"ow-detail-facts",children:$.map((I,Y)=>r("\
li",{children:I},`${Y}:${I}`))})})]})}),e.retryPath&&b&&r(_e,{children:r("div",{className:"ow-retry",children:r(G,{onClick:()=>b(
e.retryPath),disabled:!!A,children:"Retry"})})}),e.stopPath&&k&&r(_e,{children:r("div",{className:"ow-retry",children:r(
G,{onClick:()=>k(e.stopPath),disabled:!!i,children:i?"Stopping\u2026":"Stop this loop"})})}),e.permissionId&&R&&r(_e,{children:r(
Fo,{item:e,busy:!!p,onDecide:I=>R(e,I)})}),e.state==="needs-you"&&f&&C&&w("div",{className:"ow-row-aside",children:[r("b\
utton",{type:"button",className:"ow-aside-btn",onClick:I=>{I.stopPropagation(),f(e.id)},children:"Later"}),r("button",{type:"\
button",className:"ow-aside-btn",onClick:I=>{I.stopPropagation(),C(e.id,e.updatedAt)},children:"Handled"})]})]})}function we(e){
return e.state==="done"?"done":e.state==="running"?"running":bo(e)??"unblock"}function kr({items:e,selectedId:t,onSelect:n,
onOpenSession:s,onAnswerPermission:a,onDecideApproval:c,permissionBusy:d,onRetry:p,retryBusy:b,onPickStep:A,onSnooze:k,onHandled:i,
doneTitles:g}){let[f,C]=N(!1),v=[...e].filter(_=>_.state==="needs-you").sort((_,$)=>($.lastTouchedTurn??0)-(_.lastTouchedTurn??
0)),y=e.filter(_=>_.state==="running"),h=e.filter(_=>_.state==="done"),R=_=>r(Ho,{item:_,compact:!0,showBadge:!1,selected:t===
_.id,continuation:!0,whyRanked:_.state==="needs-you"&&_.action!=="resume"?He(ye(_),H):void 0,onSelect:()=>n(_),onOpenSession:s,
onAnswerPermission:a,onDecideApproval:c,permissionBusy:d,onRetry:p,retryBusy:b,onPickStep:A,onSnooze:k,onHandled:i},_.id);
return w(Ke,{children:[v.length>0&&r("div",{className:"ow-lane",children:v.map(R)}),y.length>0&&r("div",{className:"ow-l\
ane",children:y.map(R)}),h.length>0&&r("div",{className:"ow-lane",children:h.map(R)}),h.length===0&&g&&g.length>0&&w("di\
v",{className:"ow-lane ow-lane-done",children:[w("button",{type:"button",className:"ow-goals-toggle","aria-expanded":f,onClick:()=>C(
_=>!_),children:[r(le,{className:"ow-icon","data-open":f?"true":void 0,"aria-hidden":"true"}),g.length," done"]}),f&&r("\
ul",{className:"ow-done-list",children:g.map(_=>w("li",{className:"ow-row-goal-done",children:[r(tr,{className:"ow-icon",
"aria-hidden":"true"}),r("span",{className:"ow-truncate",children:_})]},_))})]})]})}function _r({items:e,doneTitles:t,selectedId:n,
onSelect:s,onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:p,onRetry:b,retryBusy:A,onPickStep:k,onSnooze:i,
onHandled:g}){let[f,C]=N(!1),v=[...e].sort((m,q)=>(q.lastTouchedTurn??0)-(m.lastTouchedTurn??0)),y=v[0],h=v.slice(1),R=y.
sessionKey,_=e.find(m=>m.state==="needs-you")??e.find(m=>m.state==="running")??y,$=Ro(e),O=y.references.find(m=>m.kind===
"session")?.label??y.provenance,j=Rt($.lastActivityAt),B=y.sessionTurns?`${y.sessionTurns} ${y.sessionTurns===1?"turn":"\
turns"}`:null,P=[j,B].filter(Boolean),M=[],L=new Set;for(let m of y.sessionChanges??[])m.url&&!L.has(m.url)&&(L.add(m.url),
M.push(m));let Z=(y.progress??[]).map(m=>m.trim()).filter(Boolean).map(m=>/[.!?]$/.test(m)?m:`${m}.`).join(" "),I=Z?Z.split(
/(?<=[.!?])\s+/).filter(m=>m.trim()).slice(0,2).join(" "):"",Y=y.state==="done"?[]:(y.nextSteps??[]).filter(m=>m.what?.trim()),
Re=y.initialIntent?.trim(),he=(y.progress??[]).filter(m=>m.trim()),Ge=Y.length>1||!!Re||he.length>0||h.length>0,F=(m,q)=>w(
"button",{type:"button",className:"ow-card-step",title:m.why??m.what,onClick:ee=>{ee.stopPropagation(),k?.(m.what)},children:[
r(Zn,{className:"ow-icon ow-card-step-arrow","aria-hidden":"true"}),w("span",{className:"ow-card-step-body",children:[r(
"span",{className:"ow-card-step-what",children:m.what}),m.why&&r("span",{className:"ow-card-step-why",children:m.why})]})]},
q),re=n===y.id;return w(Ke,{children:[w(Se,{className:"ow-sessioncard",onActivate:()=>s(y),"aria-label":y.title,"aria-pr\
essed":re,"data-selected":re?"true":void 0,"data-testid":`work-item-${y.id}`,children:[w("div",{className:"ow-card-top",
children:[qo(_),w("span",{className:"ow-card-meta",children:[r("button",{type:"button",className:"ow-card-name",onClick:m=>{
m.stopPropagation(),a(R)},children:O}),P.map(m=>r("span",{className:"ow-card-metapart",children:m},m))]})]}),r("h3",{className:"\
ow-card-title",children:y.title}),M.length>0&&r("div",{className:"ow-card-prs",children:M.map(m=>w("a",{className:"ow-ca\
rd-pr","data-status":m.status||void 0,href:m.url,target:"_blank",rel:"noopener noreferrer",onClick:q=>q.stopPropagation(),
children:[m.label,m.status&&w("span",{className:"ow-card-pr-status",children:[" \xB7 ",m.status]})]},m.id))}),I&&r("p",{
className:"ow-card-summary",children:I}),Y[0]&&w("div",{className:"ow-card-nextstep",children:[r("div",{className:"ow-ca\
rd-nextstep-label",children:"Suggested next step"}),F(Y[0],`0:${Y[0].what}`)]}),re&&y.permissionId&&d&&r(_e,{children:r(
Fo,{item:y,busy:!!p,onDecide:m=>d(y,m)})}),Ge&&w("button",{type:"button",className:"ow-goals-toggle","aria-expanded":f,onClick:m=>{
m.stopPropagation(),C(q=>!q)},children:[r(le,{className:"ow-icon","data-open":f?"true":void 0,"aria-hidden":"true"}),f?"\
Show less":"Show more"]}),y.state==="needs-you"&&i&&g&&w("div",{className:"ow-row-aside",children:[r("button",{type:"but\
ton",className:"ow-aside-btn",onClick:m=>{m.stopPropagation(),i(y.id)},children:"Later"}),r("button",{type:"button",className:"\
ow-aside-btn",onClick:m=>{m.stopPropagation(),g(y.id,y.updatedAt)},children:"Already done"})]})]}),f&&w("div",{className:"\
ow-card-expanded",children:[Y.slice(1).map((m,q)=>F(m,`${q+1}:${m.what}`)),Re&&r(je,{label:H("card_asked_for"),children:r(
"blockquote",{className:"ow-detail-quote",children:Re})}),he.length>0&&r(je,{label:H("card_where_it_stands"),children:r(
"ul",{className:"ow-detail-facts",children:he.map((m,q)=>r("li",{children:m},`${q}:${m}`))})}),h.length>0&&r(kr,{items:h,
doneTitles:t,selectedId:n,onSelect:s,onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:p,onRetry:b,
retryBusy:A,onPickStep:k,onSnooze:i,onHandled:g})]})]})}function Be({title:e,items:t,selectedId:n,onSelect:s,onOpenSession:a,
onAnswerPermission:c,onDecideApproval:d,permissionBusy:p,onRetry:b,retryBusy:A,onStop:k,stopBusy:i,onPickStep:g,onSnooze:f,
onHandled:C,footer:v,collapsed:y,onToggleCollapsed:h,doneBySession:R,subtitle:_,hideHeader:$,emptyLabel:O}){let j=So(t).
sort((P,M)=>Math.max(...M.items.map(L=>L.updatedAt))-Math.max(...P.items.map(L=>L.updatedAt))),B=P=>r("div",{className:`\
ow-block${P.header==="session"?" ow-goalcard":""}`,"data-grouped":P.header?"true":void 0,"data-open":P.header==="session"?
"true":void 0,children:P.header==="session"&&P.sessionKey?r(_r,{items:P.items,doneTitles:R?.[P.sessionKey],selectedId:n,
onSelect:s,onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:p,onRetry:b,retryBusy:A,onPickStep:g,onSnooze:f,
onHandled:C}):P.items.map(M=>r(Ho,{item:M,selected:n===M.id,whyRanked:M.state==="needs-you"&&M.action!=="resume"?He(ye(M),
H):void 0,onSelect:()=>s(M),onOpenSession:a,onAnswerPermission:c,onDecideApproval:d,permissionBusy:p,onRetry:b,retryBusy:A,
onStop:k,stopBusy:i,onPickStep:g,onSnooze:f,onHandled:C},M.id))},P.key);return w("section",{className:"ow-section","aria\
-label":e,children:[$?null:h?w(Se,{onActivate:h,className:"ow-section-toggle",children:[r(Mo,{label:e,count:t.length,subtitle:_}),
r(le,{className:"ow-icon ow-section-chevron","data-open":y?void 0:"true","aria-hidden":"true"})]}):r(Mo,{label:e,count:t.
length,subtitle:_}),y?null:r("div",{className:"ow-section-list",children:j.length===0?r("p",{className:"ow-section-empty",
children:O}):j.map(B)}),v]})}function Sr(e,t,n=[]){let s=po(t,H),a=n.length?[`Noticed since you last spoke (${n.length})\
:`,...n.map(p=>`- ${p}`),"Mention these only if they matter to what the user asked."]:[];if(!e)return["Crew Manager cont\
ext: workspace overview.",...s,...a,"Answer the user about the state of their work. This is a conversation, not an actio\
n channel."].join(`
`);let c=e.references.map(p=>`${p.kind}: ${p.label} (${p.id})`).join(`
`),d=[e.stalledFor?`Silent for ${ce(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(p=>!!p);return[`Crew Manager context: ${e.title}`,...s,`Selected item: ${e.title}`,
`State: ${br[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...d.length>0?[`Why it is on the board:
${d.join(`
`)}`]:[],`References:
${c}`,...a,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(p=>!!p).join(`
`)}var Bo="crew-manager.panel-widths";function Rr(e,t){let n=e?.first_seen;if(!n)return[];let s=typeof t=="number"?t<=1e10?
t*1e3:t:t?Date.parse(t):NaN;if(!Number.isFinite(s))return[];let a=[];for(let d of e?.stalls??[]){let p=n[d.key];typeof p==
"number"&&(p*1e3<=s||a.push(d.reason?`${d.label} went quiet \u2014 ${d.reason}`:`${d.label} went quiet after ${ce(d.silent_secs)}`))}
for(let d of e?.error_loops??[]){let p=n[d.key];typeof p=="number"&&(p*1e3<=s||a.push(`${d.label} repeated the same ${d.
tool} failure ${d.repeats} times`))}let c=5;return a.length>c?[...a.slice(0,c),`and ${a.length-c} more`]:a}var X={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function Ue(e,t,n,s,a){let c=Math.min(a,Math.max(n,t-
s));return Math.max(n,Math.min(c,e))}function Ko({side:e,containerRef:t,min:n,reserve:s,max:a,value:c,onChange:d,label:p}){
let b=(i,g)=>{let f=g.getBoundingClientRect(),C=e==="start"?i-f.left:f.right-i;return Ue(C,g.clientWidth,n,s,a)};return r(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":p,tabIndex:0,onPointerDown:i=>{
let g=t.current;if(!g)return;i.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let f=v=>d(b(v.clientX,g)),C=()=>{window.removeEventListener("pointermove",f),window.removeEventListener("pointeru\
p",C),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",f),window.addEventListener(
"pointerup",C)},onKeyDown:i=>{if(i.key!=="ArrowLeft"&&i.key!=="ArrowRight")return;let g=t.current;if(!g)return;i.preventDefault();
let f=(i.shiftKey?48:16)*(i.key==="ArrowRight"?1:-1),C=c??(e==="start"?g.clientWidth/2:Math.round(g.clientWidth*.3));d(Ue(
C+(e==="start"?f:-f),g.clientWidth,n,s,a))}})}function Nr(){let e=ur(),t=Q(e);t.current=e;let n=pr(),s=gr(),[a,c]=N("all"),
[d,p]=N(()=>{let o=ke(kt,null);return o&&ue.includes(o)?o:"work"}),[b,A]=N(()=>{let o=ke(yt,null),l=o&&ue.includes(o)?o:
null,u=ke(kt,null),x=u&&ue.includes(u)?u:"work";return l&&l!==x?l:To.find(S=>S!==x)??null}),k=D(o=>{A(l=>{let u=l===o?null:
o;return pe(yt,u),u})},[]),[i,g]=N(null),[f,C]=N("session"),[v,y]=N(null),[h,R]=N(null),[_,$]=N({}),[O,j]=N("unknown"),B=Q(
"unknown"),P=Q(new Map),[M,L]=N({}),[Z,I]=N(null),[Y,Re]=N({}),[he,Ge]=N([]),[F,re]=N(null),[m,q]=N(null),[ee,Nt]=N(null),
[Ct,It]=N(()=>ke(vt)),[At,jo]=N(()=>ke(Po)),Ye=Q(null),Ve=Q(null),[se,Je]=N(()=>ke(Bo,{work:null,conductor:null}));J(()=>{
pe(Bo,se)},[se]),J(()=>{let o=()=>Je(l=>{let u=Ve.current?.clientWidth??0,x=Ye.current?.clientWidth??0;return{work:l.work==
null||u===0?l.work:Ue(l.work,u,X.workMin,X.railReserve,1/0),conductor:l.conductor==null||x===0?l.conductor:Ue(l.conductor,
x,X.conductorMin,X.mainReserve,X.conductorMax)}});return o(),window.addEventListener("resize",o),()=>window.removeEventListener(
"resize",o)},[]);let[Uo,Go]=N(!0),[Wt,Tt]=N({}),[Pt,Qe]=N([]),[Xe,Yo]=N([]),[Vo,Ze]=N(!1),Ne=D(o=>{if(o===d)return;let l=b===
o?To.find(u=>u!==o)??null:b;pe(kt,o),pe(yt,l),p(o),A(l)},[d,b]),Jo=D((o,l)=>{o.dataTransfer.setData("text/x-crew-panel",
l),o.dataTransfer.effectAllowed="move";let u=o.currentTarget.querySelector("summary");if(!u)return;let x=u.getBoundingClientRect();
o.dataTransfer.setDragImage(u,Math.min(Math.max(o.clientX-x.left,0),x.width),Math.min(Math.max(o.clientY-x.top,0),x.height))},
[]),Qo=D(o=>{o.preventDefault(),Ze(!1);let l=o.dataTransfer.getData("text/x-crew-panel");!l||!ue.includes(l)||Ne(l)},[Ne]),
et=U(()=>ue.filter(o=>o!==d),[d]),Xo=b&&b!==d?String(et.indexOf(b)):"none",tt=o=>{let l=o===d;return{className:"ow-card \
ow-stack-card",open:l||b===o,draggable:!0,"data-panel":o,"data-primary":l?"true":"false","data-rail-index":l?void 0:et.indexOf(
o),"data-dragover":l&&Vo?"true":void 0,onDragStart:u=>Jo(u,o),onDragOver:l?u=>{u.preventDefault(),Ze(!0)}:void 0,onDragLeave:l?
()=>Ze(!1):void 0,onDrop:l?Qo:void 0}},Et=Q(!0),[Zo,Mt]=N(!0),[$t,ot]=N(null),[nt,en]=N(null),[Ce,Bt]=N(!1),[tn,on]=N(!1),
[Kt,te]=N(null),K=Q(!0),Ie=Q(0),rt=Q(!1);J(()=>(K.current=!0,()=>{K.current=!1,Ie.current+=1}),[]);let W=D(async()=>{let o=++Ie.
current,l=t.current;try{let[u,x,S,V,Oe,Le,T,ie]=await Promise.all([l.get("/api/chat/slots"),l.get("/api/approvals"),l.get(
"/api/spawn"),l.get("/api/workflows/runs"),l.get("/api/crons"),l.get("/api/artifacts"),l.get("/api/autonudge").catch(()=>({
loops:[]})),l.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!K.current||o!==Ie.current)return;R({slots:Array.
isArray(u)?u:[],approvals:Array.isArray(x)?x:[],agents:Array.isArray(S.agents)?S.agents:[],workflows:Array.isArray(V.runs)?
V.runs:[],crons:Array.isArray(Oe.jobs)?Oe.jobs:[],artifacts:Array.isArray(Le.artifacts)?Le.artifacts:[],loops:Array.isArray(
T?.loops)?T.loops:[]}),Yo(Array.isArray(ie?.runs)?ie.runs:[]),ot(null),en(Date.now())}catch(u){K.current&&o===Ie.current&&
ot(u instanceof Error?u:new Error("Unable to load Crew Manager sources"))}finally{K.current&&o===Ie.current&&Mt(!1)}},[]);
J(()=>{W();let o=window.setInterval(()=>{W()},fr);return()=>window.clearInterval(o)},[W]);let nn=()=>{Mt(!0),ot(null),W()},
st=D(()=>{Ce||(Bt(!0),W().finally(()=>{K.current&&Bt(!1)}))},[W,Ce]);J(()=>{if(!h||B.current==="unsupported"||B.current===
"disabled")return;let o=No(h.slots,ge,Date.now(),u=>P.current.get(u.key)===mt(u));if(o.length===0)return;let l=!1;return(async()=>{
let{summaries:u,support:x}=await Co(o,S=>t.current.get(S));if(!(l||!K.current)&&(B.current=x,j(x),x==="available")){for(let S of o)
u[S.key]&&P.current.set(S.key,mt(S));$(S=>({...S,...u}))}})(),()=>{l=!0}},[h]),J(()=>{if(!h||!Et.current)return;let o=!1;
return(async()=>{try{let l=await t.current.get("/api/apps/crew-manager/stalls");if(o||!K.current)return;let u={};for(let S of l?.
stalls??[])S?.key&&(u[S.key]=S);L(u);let x={};for(let S of l?.error_loops??[])S?.key&&(x[S.key]=S);Tt(x),I(l??null);try{
let S=await t.current.get("/api/apps/crew-manager/assigned");!o&&K.current&&Qe(S?.available&&Array.isArray(S.rows)?S.rows:
[])}catch{K.current&&Qe([])}}catch{Et.current=!1,K.current&&(L({}),Tt({}),I(null),Qe([]))}})(),()=>{o=!0}},[h]);let zt=U(
()=>mo(_o({...h??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},assigned:Pt},H,_,M,Wt),Y),
[h,_,M,Wt,Y,Pt]),ze=U(()=>vo(zt,Ct,At),[zt,Ct,At]),E=U(()=>ze.items.filter(o=>yo(o)),[ze]),Ae=U(()=>ht(E),[E]),Dt=U(()=>E.
filter(o=>o.state==="needs-you"&&we(o)==="followup").length,[E]),rn={...Ae,"needs-you":Math.max(0,(Ae["needs-you"]??0)-Dt),
"follow-up":Dt},at=U(()=>{let o={};for(let l of E){if(l.state!=="done"||!l.sessionKey)continue;let u=o[l.sessionKey];u?u.
push(l.title):o[l.sessionKey]=[l.title]}return o},[E]),ae=U(()=>E.find(o=>o.id===i)??null,[E,i]),We=U(()=>a==="all"?E:a===
"follow-up"?E.filter(o=>o.state==="needs-you"&&we(o)==="followup"):a==="needs-you"?E.filter(o=>o.state==="needs-you"&&we(
o)!=="followup"):E.filter(o=>o.state===a),[a,E]);J(()=>s(Ae["needs-you"]),[Ae,s]),J(()=>{i&&!E.some(o=>o.id===i)&&g(null)},
[E,i]);let de=h?.slots.find(o=>o.key===ge),sn=!!(de||tn),Ot=Q(!1);J(()=>{let o=de;if(!o||Ot.current||o.agent)return;Ot.current=
!0;let l=t.current;l.get("/api/apps/crew-manager/conductor-agent").then(u=>u?.available&&u.agent?u.agent:null).catch(()=>null).
then(u=>{if(!(!u||!K.current))return l.post(`/api/chat/slots/${encodeURIComponent(ge)}/agent`,{agent:u}).then(()=>{W()})}).
catch(()=>{})},[de,W]),J(()=>{!h||de||rt.current||(rt.current=!0,e.get("/api/apps/crew-manager/conductor-agent").then(o=>o?.
available&&o.agent?o.agent:null).catch(()=>null).then(o=>e.post("/api/chat/slots",{name:ge,title:"Conductor",...o?{agent:o}:
{}})).then(()=>{K.current&&(on(!0),W())}).catch(o=>{K.current&&(rt.current=!1,te(o instanceof Error?`Conductor session c\
ould not be created: ${o.message}`:"Conductor session could not be created"))}))},[e,de,W,h]);let Lt=U(()=>no(h?.approvals??
[],he,o=>E.find(l=>l.sessionKey===o)?.title??h?.slots?.find(l=>l.key===o)?.title??o),[E,h,he]),fe=ae&&!ae.permissionId?ae:
null,it=U(()=>{let o=(h?.loops??[]).filter(u=>u&&u.active!==!1&&u.slot_key);if(o.length===0)return[];let l=new Map;for(let u of E)
for(let x of u.references)x.kind!=="session"||!x.id||x.label&&!l.has(x.id)&&l.set(x.id,x.label);return o.map(u=>{let x=Number(
u.cycle_count)||0,S=Number(u.max_cycles)||0;return{key:u.slot_key,title:l.get(u.slot_key)??u.slot_key,progress:S>0?`${x}\
/${S}`:`${x} ${x===1?"cycle":"cycles"}`,remaining:S>0?Math.max(0,S-x):null,instruction:(u.message??"").replace(/\s+/g," ").
trim(),lastFire:z(u.last_fire_ts)}})},[h,E]),me=U(()=>{let o=new Date;o.setHours(0,0,0,0);let l=o.getTime(),u=l+864e5,x=h?.
crons??[],S=new Map;for(let T of Xe){let ie=z(T.started_at);if(!T.job_id||ie<l||ie>=u)continue;let oe=S.get(T.job_id)??{
count:0,failed:0,last:0};oe.count+=1,T.status&&T.status!=="success"&&(oe.failed+=1),oe.last=Math.max(oe.last,ie),S.set(T.
job_id,oe)}let V=x.map(T=>{let ie=S.get(T.id),oe=z(T.next_run_ts),pn=oe>=l&&oe<u;return{job:T,ran:ie,next:oe,dueToday:pn}}).
filter(T=>T.ran||T.dueToday||T.job.is_running),Oe=V.filter(T=>T.ran&&T.ran.failed===0).length,Le=V.filter(T=>T.ran&&T.ran.
failed>0).length;return{rows:V,done:Oe,failed:Le,total:V.length,historyKnown:Xe.length>0}},[h,Xe]),be=D(async(o,l)=>{if(!F){
re(o),te(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(o)}/${l?"approve":"reject"}`,{}),W()}catch(u){
te(u instanceof Error?`Could not answer that request: ${u.message}`:"Could not answer that request"),W()}finally{K.current&&
re(null)}}},[W,F]),Te=D(async(o,l)=>{if(!(F||!o.permissionId||!o.sessionKey)){re(o.permissionId),te(null);try{await t.current.
post(`/api/chat/slots/${encodeURIComponent(o.sessionKey)}/approve`,{action:l,request_id:o.permissionId}),W()}catch(u){te(
u instanceof Error?`Could not answer that request: ${u.message}`:"Could not answer that request"),W()}finally{K.current&&
re(null)}}},[W,F]),qt=D(o=>{It(l=>{let u=Object.fromEntries(Object.entries(l).filter(([,x])=>x>Date.now()));return u[o]=
Date.now()+xo,pe(vt,u),u}),g(null)},[]),Ft=D((o,l)=>{jo(u=>{let x={...u,[o]:l};return pe(Po,x),x}),g(null)},[]),an=D(()=>{
It({}),pe(vt,{})},[]),ln=D(()=>{Go(o=>!o)},[]),Pe=D(async o=>{if(!m){q(o),te(null);try{await t.current.post(o,{}),W()}catch(l){
te(l instanceof Error?`Could not re-run it: ${l.message}`:"Could not re-run it"),W()}finally{K.current&&q(null)}}},[W,m]),
Ee=D(async o=>{if(!ee){Nt(o),te(null);try{await t.current.del(o),y("Stopped the monitor loop. Re-arming it is done from \
the session itself."),W()}catch(l){let u=l instanceof Error?l.message:"";/404|not found/i.test(u)?y("That loop had alrea\
dy stopped."):te(u?`Could not stop it: ${u}`:"Could not stop it"),W()}finally{K.current&&Nt(null)}}},[W,ee]),xe=D(async o=>{
let l=ae&&!ae.permissionId?ae:null;if(f==="session"&&l?.sessionKey){let u=l.sessionKey;if(await t.current.post("/api/cha\
t",{message:o,slot:u}).catch(x=>{if(!(x instanceof SyntaxError))throw x}),!K.current)return;Re(x=>({...x,[l.id]:Date.now()})),
Ge(x=>x.includes(u)?x:[...x,u]),y(`Sent new instructions to ${l.title}`),g(null),W();return}await t.current.post(`/api/c\
hat/slots/${encodeURIComponent(ge)}/context`,{content:Sr(ae,E,Rr(Z,de?.last_ts)),source:"crew-manager",ephemeral:!0}).catch(
()=>{}),await t.current.post("/api/chat",{message:o,slot:ge}).catch(u=>{if(!(u instanceof SyntaxError))throw u})},[ae,E,
W,f,Z,de]),De={"needs-you":We.filter(o=>o.state==="needs-you"),running:We.filter(o=>o.state==="running"),done:We.filter(
o=>o.state==="done")},dn=De["needs-you"].filter(o=>we(o)!=="followup"),cn=De["needs-you"].filter(o=>we(o)==="followup"),
Me=o=>n(`/chat?sid=${encodeURIComponent(o)}`),$e=o=>{g(l=>l===o.id?null:o.id),y(null),C("session")},un=fe?w("div",{className:"\
ow-quote ow-quote-docked",children:[w("div",{className:"ow-quote-body",children:[fe.sessionKey?r("button",{type:"button",
className:"ow-scope-toggle","aria-pressed":f==="conductor","aria-label":f==="session"?"Sending to this session. Activate\
 to send to the Conductor instead.":"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>C(
o=>o==="session"?"conductor":"session"),children:f==="session"?"Instructing":"To Conductor"}):r("span",{className:"ow-ey\
ebrow",children:"Quoted"}),r("span",{className:"ow-quote-title",title:fe.title,children:fe.title})]}),r(G,{className:"ow\
-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{g(null),y(null)},children:"Clear"})]}):null;return w(
"div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[r("style",{children:Io}),r("div",{className:"\
ow-titlebar",children:r(hr,{title:w("span",{className:"ow-title-line",children:["Crew Manager",r("span",{className:"ow-b\
eta","aria-label":"Beta preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still running, and wh\
at finished recently."})}),r("div",{className:"ow-body",children:w("div",{className:"ow-layout",ref:Ye,style:se.conductor!=
null?{"--ow-conductor-w":`${se.conductor}px`}:void 0,children:[w("div",{className:"ow-main","data-open-row":Xo,ref:Ve,style:se.
work!=null?{"--ow-work-w":`${se.work}px`}:void 0,children:[w("details",{...tt("work"),"aria-label":"Work",children:[w("s\
ummary",{onClick:o=>{o.preventDefault(),d!=="work"&&k("work")},children:[w("span",{className:"ow-stack-title",children:[
r(le,{className:"ow-icon ow-stack-chevron"}),r(St,{className:"ow-icon"}),Lo.work,r(ne,{variant:"muted",children:Ae.all})]}),
r("span",{className:"ow-stack-actions",children:d==="work"?r(xt,{lastUpdated:nt,refreshing:Ce,onRefresh:st}):r(bt,{id:"w\
ork",onPromote:Ne})})]}),w("div",{className:"ow-worksplit",children:[r("nav",{className:"ow-railnav",role:"group","aria-\
label":"Filter by state",children:Object.keys(_t).map(o=>w(G,{onClick:()=>c(o),"aria-pressed":a===o,"data-selected":a===
o,className:"ow-filter ow-railitem",children:[r("span",{className:"ow-railitem-label",children:_t[o]}),r("span",{className:"\
ow-count",children:rn[o]})]},o))}),r("main",{className:"ow-work",children:r("div",{className:"ow-work-inner",children:Zo?
r(Ao,{rows:7}):$t&&!h?r(Wo,{icon:r(zo,{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:$t.
message,action:r(G,{onClick:nn,children:"Try again"})}):We.length===0?r(Wo,{icon:r(lr,{className:"ow-icon"}),title:"No m\
atching work",subtitle:"Change the filter to see sessions in another state."}):a==="all"?w(Ke,{children:[r(Be,{title:"Ne\
eds you",subtitle:"Waiting on a decision or reply from you",items:dn,doneBySession:at,selectedId:i,onSelect:$e,onSnooze:qt,
onHandled:Ft,footer:ze.snoozedCount>0?w("button",{type:"button",className:"ow-aside-note",onClick:an,children:[ze.snoozedCount,
" set aside for later \u2014 bring back"]}):void 0,onOpenSession:Me,onAnswerPermission:(o,l)=>{be(o,l)},onDecideApproval:(o,l)=>{
Te(o,l)},permissionBusy:F!==null,onRetry:o=>{Pe(o)},retryBusy:m!==null,onStop:o=>{Ee(o)},stopBusy:ee!==null,onPickStep:o=>{
xe(o)},emptyLabel:"Nothing needs your input right now."}),r(Be,{title:"Follow up",subtitle:"Pick back up where a session\
 left off",items:cn,doneBySession:at,selectedId:i,onSelect:$e,onSnooze:qt,onHandled:Ft,onOpenSession:Me,onAnswerPermission:(o,l)=>{
be(o,l)},onDecideApproval:(o,l)=>{Te(o,l)},permissionBusy:F!==null,onRetry:o=>{Pe(o)},retryBusy:m!==null,onStop:o=>{Ee(o)},
stopBusy:ee!==null,onPickStep:o=>{xe(o)},emptyLabel:"Nothing to follow up on."}),r(Be,{title:"In progress",subtitle:"Bei\
ng worked on right now",items:De.running,doneBySession:at,selectedId:i,onSelect:$e,onOpenSession:Me,onAnswerPermission:(o,l)=>{
be(o,l)},onDecideApproval:(o,l)=>{Te(o,l)},permissionBusy:F!==null,onRetry:o=>{Pe(o)},retryBusy:m!==null,onStop:o=>{Ee(o)},
stopBusy:ee!==null,onPickStep:o=>{xe(o)},emptyLabel:"Nothing is in progress right now."}),r(Be,{title:"Done recently",subtitle:"\
Finished in the last few days",items:De.done,selectedId:i,onSelect:$e,collapsed:Uo,onToggleCollapsed:ln,onOpenSession:Me,
onAnswerPermission:(o,l)=>{be(o,l)},onDecideApproval:(o,l)=>{Te(o,l)},permissionBusy:F!==null,onRetry:o=>{Pe(o)},retryBusy:m!==
null,onStop:o=>{Ee(o)},stopBusy:ee!==null,onPickStep:o=>{xe(o)},emptyLabel:"No recent completed work."})]}):r(Be,{title:_t[a],
items:We,selectedId:i,onSelect:$e,onOpenSession:Me,onAnswerPermission:(o,l)=>{be(o,l)},onDecideApproval:(o,l)=>{Te(o,l)},
permissionBusy:F!==null,onRetry:o=>{Pe(o)},retryBusy:m!==null,onStop:o=>{Ee(o)},stopBusy:ee!==null,onPickStep:o=>{xe(o)},
emptyLabel:"No matching work"})})})]})]}),ue.includes("loops")&&w("details",{...tt("loops"),children:[w("summary",{onClick:o=>{
o.preventDefault(),d!=="loops"&&k("loops")},children:[w("span",{className:"ow-stack-title",children:[r(le,{className:"ow\
-icon ow-stack-chevron"}),r(Oo,{className:"ow-icon"}),"Loops"]}),w("span",{className:"ow-stack-actions",children:[r(ne,{
variant:"muted",children:it.length}),d==="loops"?r(xt,{lastUpdated:nt,refreshing:Ce,onRefresh:st}):r(bt,{id:"loops",onPromote:Ne})]})]}),
r("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),r("div",{className:"ow-stack-bod\
y",children:it.length===0?r("p",{className:"ow-stack-empty",children:"No loop is running right now."}):it.map(o=>{let l=Rt(
o.lastFire),u=[l&&`last tick ${l}`,o.remaining!==null&&`${o.remaining} remaining`].filter(Boolean).join(" \xB7 ");return w(
"div",{className:"ow-mini",children:[r("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),w("div",{children:[
w("div",{className:"ow-mini-title",children:[o.title,r("span",{className:"ow-mini-chip",children:o.progress})]}),o.instruction&&
r("div",{className:"ow-mini-desc",title:o.instruction,children:o.instruction}),u&&r("div",{className:"ow-mini-when",children:u})]}),
r(ne,{variant:"ok",children:"Active"})]},o.key)})})]}),ue.includes("schedule")&&w("details",{...tt("schedule"),children:[
w("summary",{onClick:o=>{o.preventDefault(),d!=="schedule"&&k("schedule")},children:[w("span",{className:"ow-stack-title",
children:[r(le,{className:"ow-icon ow-stack-chevron"}),r(or,{className:"ow-icon"}),"Scheduled tasks"]}),w("span",{className:"\
ow-stack-actions",children:[w(ne,{variant:me.failed>0?"err":"muted",children:[me.done,"/",me.total," today"]}),d==="sche\
dule"?r(xt,{lastUpdated:nt,refreshing:Ce,onRefresh:st}):r(bt,{id:"schedule",onPromote:Ne})]})]}),r("p",{className:"ow-st\
ack-sub",children:me.historyKnown?"Today's runs only \u2014 jobs with nothing scheduled today are hidden":"Run history i\
s unavailable, so completed counts may be low"}),r("div",{className:"ow-stack-body",children:me.rows.length===0?r("p",{className:"\
ow-stack-empty",children:"Nothing is scheduled for today."}):me.rows.map(({job:o,ran:l,next:u,dueToday:x})=>{let S=!!(l&&
l.failed>0),V=[l&&`ran today ${Eo(l.last)}${l.count>1?` (${l.count}x)`:""}`,x&&u?`next ${Eo(u)}`:null].filter(Boolean).join(
" \xB7 ");return w("div",{className:"ow-mini",children:[r("span",{className:"ow-mini-rail",style:{background:S?"var(--da\
nger)":o.enabled===!1?"var(--muted)":"var(--warn)"}}),w("div",{children:[r("div",{className:"ow-mini-title",children:o.name}),
o.schedule&&w("div",{className:"ow-mini-desc",children:[o.schedule,o.cron_expr&&r("span",{className:"ow-mini-chip",children:o.
cron_expr})]}),V&&r("div",{className:"ow-mini-when",children:V})]}),o.is_running?r(ne,{variant:"aim",children:"Running"}):
S?r(ne,{variant:"err",children:"Failed"}):o.enabled===!1?r(ne,{variant:"muted",children:"Paused"}):l?r(ne,{variant:"ok",
children:"Success"}):r(ne,{variant:"warn",children:"Pending"})]},o.id)})})]}),et.length>0&&r(Ko,{side:"start",containerRef:Ve,
min:X.workMin,reserve:X.railReserve,max:1/0,value:se.work,onChange:o=>Je(l=>({...l,work:o})),label:"Resize the work colu\
mn"})]}),r(Ko,{side:"end",containerRef:Ye,min:X.conductorMin,reserve:X.mainReserve,max:X.conductorMax,value:se.conductor,
onChange:o=>Je(l=>({...l,conductor:o})),label:"Resize the Conductor panel"}),w("aside",{className:"ow-conductor","aria-l\
abel":"Conductor",children:[r("div",{className:"ow-conductor-header",children:w("div",{className:"ow-conductor-title",children:[
r("h2",{children:"Conductor"}),!fe&&r("span",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),
r("div",{className:"ow-chat",children:sn?w("div",{className:"ow-chat-panel",children:[Lt.length>0&&r("div",{className:"o\
w-permissions",role:"alert",children:Lt.map(o=>r(vr,{tool:o.tool,purpose:o.purpose,where:o.sessionLabel,busy:F!==null,onAnswer:l=>{
be(o.id,l)}},o.id))}),v&&w("div",{className:"ow-conductor-receipt",role:"status",children:[r(Do,{className:"ow-icon"}),v]}),
Kt&&r("div",{className:"ow-chat-error",role:"alert",children:Kt}),r("div",{className:"ow-embed",children:r(wr,{slotKey:ge,
frameless:!0,startAtBottom:!0,slotControls:!0,placeholder:fe?.sessionKey&&f==="session"?"New instructions for this sessi\
on\u2026":"Ask across your work\u2026",onSend:xe,aboveComposer:un})})]}):r("div",{className:"ow-chat-loading",children:r(
Ao,{rows:4})})})]})]})})]})}export{Nr as default,Rr as noticedSinceLastTurn};
