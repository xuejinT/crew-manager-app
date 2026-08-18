import{Fragment as sn,useCallback as $,useEffect as z,useMemo as M,useRef as X,useState as _}from"react";import{AlertTriangle as gn,
Bot as So,Check as fn,ChevronRight as xe,Check as wn,Clock as Ro,Package as No,ExternalLink as mn,MessageSquare as lt,Shield as Io,
Waves as Co,Search as Wo,Tag as hn,Users as bn,Zap as Ao}from"lucide-react";import{useAppApi as Bo,useNavigate as Ko,useNavBadge as Eo,
ChatEmbed as Lo}from"@kirocrew/app-sdk";import{Badge as Oe,Btn as L,ContentSkeleton as an,EmptyState as tt,PageHeader as Oo,
SearchInput as Po}from"@kirocrew/app-sdk/ui";function St(e){return e.trim().length>=2}function Rt(e,t){let o=new Set(t.map(c=>c.sessionKey).filter(Boolean)),n=new Set,
s=[];for(let c of e){let l=c?.session_key;!l||o.has(l)||n.has(l)||(n.add(l),s.push(c))}return s}function Gn(e,t){if(!e)return 0;
let o=e>1e11?e/1e3:e,n=Math.floor((t/1e3-o)/86400);return n>0?n:0}function Nt(e,t){let o=Gn(e,t);if(o<=0)return"today";if(o===
1)return"yesterday";if(o<7)return`${o} days ago`;if(o<30){let s=Math.floor(o/7);return s===1?"last week":`${s} weeks ago`}
let n=Math.floor(o/30);return n===1?"last month":`${n} months ago`}var It={unsupported:!1,hits:[]};function Ct(e){return!e||
e.enabled===!1?{unsupported:!0,hits:[]}:{unsupported:!1,hits:(Array.isArray(e.results)?e.results:[]).filter(o=>!!o?.session_key)}}
function Wt(e,t){return`/api/apps/crew-manager/recall?${new URLSearchParams({q:e.trim(),limit:String(t)}).toString()}`}function Fe(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),n=t%
60;return n===0?`${o} hour${o===1?"":"s"}`:`${o}h ${n}m`}function qt(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function Ve(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function zt(e,t,o){let n=new Set(t.filter(Boolean));if(n.size===0)return[];
let s=new Set,c=[];for(let l of e){let p=l.slot;!p||!n.has(p)||!l.id||s.has(l.id)||(s.add(l.id),c.push({id:l.id,sessionKey:p,
sessionLabel:o(p),tool:l.tool||"a tool",purpose:l.tool_purpose}))}return c}var At={"needs-you":0,running:1,done:2};function q(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}var Bt=72;function ie(e,t){
let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let s=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(s.length<=Bt)return s;let c=s.slice(0,Bt),l=c.lastIndexOf(" ");return`${(l>24?c.slice(0,l):c).trim()}\u2026`}
function Q(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var Fn=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
Un=/^\((?:code|diff|widget|image)\)$/,jn=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
Hn=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,Vn=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
Yn=/[?？]["'”’)\]]*$/;function Dt(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||Un.test(t)||Fn.test(
t)?null:t}function Ye(e){if(!e.waiting_for_input)return null;let t=Dt(e);return!t||jn.test(t)||Hn.test(t)?null:Vn.test(t)||
Yn.test(t)?t:null}function Kt(e){return e.pending_approval||Ye(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":Q(e)?"needs-you":"done"}function Qn(e,t){if(e.pending_approval)return t("approval_waiting");let o=Ye(e);return o||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):Q(e)?t("linked_change_issue"):Dt(e)??t("recent_wo\
rk_ready"))}function Ue(e,t){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function Jn(e){return e.pending_approval?"review-approval":Ye(e)?"reply":"open"}function Xn(e,t){
let o=(e.source_links??[]).map(n=>({kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:
`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key,status:qt(n)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:Qn(e,t),state:Kt(e),moving:Kt(e)==="running"||void 0,issue:Q(e),updatedAt:q(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:Ue(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:Q(e)||void 0,action:Jn(e),
references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...o]}}function Qe(e,t){e.references.
some(o=>o.kind===t.kind&&o.id===t.id)||e.references.push(t)}function Gt(e){return(e.source||"").toLowerCase()==="subagen\
t"}function Zn(e,t,o){let n=Gt(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,q(t.ts)),e.summary=o(n?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=n?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,Qe(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),
sessionKey:t.slot||e.sessionKey})}function eo(e,t,o){e.updatedAt=Math.max(e.updatedAt,q(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),Qe(e,{kind:"agent",id:t.id,
label:t.agent||o("agent"),sessionKey:t.parent||e.sessionKey})}function to(e,t,o){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow\
_failed",{name:t.name})),Qe(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function no(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function oo(e,t,o){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===o}function ro(e){let t=null,o=-1;for(let n of e){let s=n.last_touched_turn??0;s>o&&(o=s,t=n)}return t}function so(e,t){let o=e.next_steps?.find(s=>s.what?.trim())?.what?.trim();if(o)return o;let n=[...e.progress??[]].reverse().
find(s=>s.trim());return n?n.trim():e.initial_intent?.trim()||t("work_in_progress")}var io=3;function ao(e,t,o){if(!t?.enabled)
return[];let n=t.intents??[];if(n.length===0)return[];let s=(e.source_links??[]).map(d=>({kind:d.kind==="issue"?"issue":
"change",id:d.url,label:d.kind==="issue"?`issue #${d.number}`:`${d.provider} #${d.number}`,url:d.url,sessionKey:e.key,status:qt(
d)})),c=[],l=ro(n),m=!!(e.running||e.subagents_running||e.orchestrating)?[]:n.filter(d=>d.state==="in-progress");m.forEach(
d=>{let w=n.indexOf(d),I=(d.next_steps??[]).filter(x=>x.what?.trim());c.push({id:`unattended:${e.key}:${w}`,title:ie(d.title,
e.title||o("untitled_work")),summary:I[0]?.what?.trim()||o("no_next_step"),state:"needs-you",issue:Q(e),updatedAt:q(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:Ue(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:Q(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.
key},...s],nextSteps:I,progress:(d.progress??[]).filter(x=>x.trim()),stale:!!t.stale,lastTouchedTurn:d.last_touched_turn??
0})}),n.forEach((d,w)=>{if(m.includes(d))return;let I=no(d,e);if(!I)return;let x=(d.next_steps??[]).filter(k=>k.what?.trim());
c.push({id:`intent:${e.key}:${w}`,title:ie(d.title,e.title||o("untitled_work")),summary:so(d,o),state:I,issue:!1,updatedAt:q(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:Ue(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:Q(
e)||void 0,unverified:d.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...s],nextSteps:x,progress:(d.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:d.
last_touched_turn??0,moving:oo(d,e,l)||void 0})});let v=c.filter(d=>d.state==="needs-you"),a=c.filter(d=>d.state!=="need\
s-you").sort((d,w)=>(w.lastTouchedTurn??0)-(d.lastTouchedTurn??0));return[...v,...a].slice(0,Math.max(io,v.length))}var lo=new Set(
["crew-manager-conductor","overwatch-conductor"]),co={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},uo=3;function po(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Be=5;function Ft(e,t,o=Date.now()){let n=Xe(e),s=Yt(
e.filter(l=>l.state==="needs-you"),o),c=[`Fleet: ${n["needs-you"]} waiting on the user, ${n.running} in progress, ${n.done}\
 finished recently.`];return s.length===0?(c.push("Nothing is waiting on the user."),c):(c.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Be,s.length)}):`),s.slice(0,Be).forEach((l,p)=>{let m=ye(J(l,o),t),v=l.sessionKey?
` [session ${l.sessionKey}]`:"";c.push(`${p+1}. ${l.title} \u2014 ${l.summary} (${m})${v}`)}),s.length>Be&&c.push(`\u2026and ${s.
length-Be} more waiting.`),c)}var go=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),Et=.6,Lt=2;function je(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!go.has(t)))]}function Ke(e,t){let o=je(e),n=je(t);if(o.length<Lt||n.length<Lt)return 0;
let s=o.length<=n.length?o:n,c=new Set(o.length<=n.length?n:o);return s.filter(p=>c.has(p)).length/s.length}function Ot(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Pt(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function Tt(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function Ee(e,t){
if(Ot(e).find(s=>Ot(t).includes(s)))return"same_change";if(Pt(e).find(s=>Pt(t).includes(s)))return"same_artifact";if(Ke(
e.title,t.title)>=Et)return"same_topic";for(let s of Tt(e))for(let c of Tt(t))if(Ke(s,c)>=Et)return"same_step";return null}
var Le={merged:[],split:[]};function $t(e){return`${e.sessionKey??e.id}|${je(e.title).join(" ")}`}function be(e,t){return[
$t(e),$t(t)].sort().join("")}function fo(e,t=Le){let o=e.filter(n=>n.state!=="done"&&n.sessionKey).sort((n,s)=>(n.updatedAt||
0)-(s.updatedAt||0));for(let n=1;n<o.length;n+=1){let s=o[n];for(let c=0;c<n;c+=1){let l=o[c];if(l.sessionKey===s.sessionKey||
t.split.includes(be(s,l)))continue;let p=Ee(s,l);if(p){s.duplicateOf={sessionKey:l.sessionKey,title:l.title,because:p};break}}}}
var wo=3e4;function Ut(e,t,o=Date.now()){return Object.keys(t).length===0?e:e.map(n=>{let s=t[n.id];return!s||o-s>wo||n.
state==="running"?n:{...n,state:"running",moving:!0,instructed:!0}})}function J(e,t=Date.now()){let o=[],n=(c,l,p=1)=>{o.
push({signal:c,weight:co[c]*p,values:l})};e.approvalKind==="subagent"?n("subagent_gate"):e.approvalKind==="tool"&&n("app\
roval_owed"),e.action==="reply"&&n("input_requested"),e.unverified&&n("unverified_completion"),e.loopRepeats&&n("error_l\
oop",{repeats:String(e.loopRepeats)}),e.runFailed&&n("run_failed"),e.stalledFor&&n("stalled",{duration:Fe(e.stalledFor)}),
e.changeBlocked&&n("change_blocked"),e.unattendedGoals&&n("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&
n("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let s=po(e,t);return s>0&&n("waiting_a_whil\
e",{hours:String(s)},Math.min(s,uo)),o.sort((c,l)=>l.weight-c.weight),{score:o.reduce((c,l)=>c+l.weight,0),signals:o}}var mo={
approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"un\
block",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"followup"};function Je(e,t=Date.now()){
if(e.state!=="needs-you")return null;for(let o of J(e,t).signals){let n=mo[o.signal];if(n)return n}return null}var jt=14400*
1e3;function Ht(e,t,o,n=Date.now()){let s=0,c=[];for(let l of e){if(l.state!=="needs-you"){c.push(l);continue}let p=t[l.
id];if(p&&p>n){s+=1;continue}let m=o[l.id];if(m!==void 0&&l.updatedAt<=m){c.push({...l,state:"done",issue:!1});continue}
c.push(l)}return{items:c,snoozedCount:s}}var ho=4320*60*1e3;function Vt(e,t=Date.now()){return e.state!=="done"||e.updatedAt===
0?!0:t-e.updatedAt<=ho}var bo={"needs-you":1,running:-1,done:-1};function yo(e,t,o){let n=e.updatedAt>0,s=t.updatedAt>0;
return!n&&!s?0:n?s?(e.updatedAt-t.updatedAt)*o:-1:1}function ye(e,t){let o=e.signals.slice(0,2);return o.length===0?t("r\
ank_nothing_pressing"):o.map(s=>t(`rank_${s.signal}`,s.values)).join(t("rank_join"))}function Yt(e,t=Date.now()){let o=new Map(
e.map(n=>[n.id,J(n,t)]));return[...e].sort((n,s)=>{let c=At[n.state]-At[s.state];if(c!==0)return c;if(n.state==="needs-y\
ou"){let l=(o.get(s.id)?.score??0)-(o.get(n.id)?.score??0);if(l!==0)return l}else if(n.issue!==s.issue)return n.issue?-1:
1;return yo(n,s,bo[n.state])})}function Qt(e,t,o={},n={},s={},c=Le){let l=new Map,p=new Map;for(let a of e.slots){if(!a.
key||lo.has(a.key)||a.memory_mode==="incognito")continue;let d=ao(a,o[a.key],t);if(d.length>0){for(let x of d)l.set(x.id,
x);let I=d.find(x=>x.state==="needs-you")??d[0];p.set(a.key,I);continue}let w=Xn(a,t);l.set(w.id,w),p.set(a.key,w)}for(let[
a,d]of Object.entries(n)){let w=p.get(a);w&&(w.state="needs-you",w.issue=!0,w.stalledFor=d.silent_secs,w.summary=d.reason?
t("stalled_because",{reason:d.reason,duration:Fe(d.silent_secs)}):t("stalled_for",{duration:Fe(d.silent_secs)}),w.action=
"open")}for(let[a,d]of Object.entries(s)){let w=p.get(a);w&&(w.state="needs-you",w.issue=!0,w.loopRepeats=d.repeats,w.summary=
t("error_loop",{tool:d.tool,repeats:String(d.repeats)}),w.action="open")}for(let a of e.approvals){let d=a.slot?p.get(a.
slot):void 0;if(d){Zn(d,a,t);continue}l.set(`approval:${a.id}`,{id:`approval:${a.id}`,title:ie(a.tool||a.source,t("appro\
val_needed")),summary:a.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:q(a.ts),provenance:t("\
approval"),action:"review-approval",approvalKind:Gt(a)?"subagent":"tool",permissionId:a.id,permissionTool:a.tool||a.source,
permissionPurpose:a.tool_purpose,references:[{kind:"approval",id:a.id,label:a.tool||a.source||t("approval")}]})}for(let a of e.
agents){let d=a.parent?p.get(a.parent):void 0;if(d){eo(d,a,t);continue}let w=!!(a.done&&(a.error||a.outcome==="failed"));
a.parent&&!w||l.set(`agent:${a.id}`,{id:`agent:${a.id}`,title:ie(a.task||a.agent,t("agent_work")),summary:w?a.error?.trim()||
t("agent_failed",{task:a.task}):a.done?t("agent_done"):t("work_in_progress"),state:w?"needs-you":a.done?"done":"running",
issue:w,runFailed:w||void 0,retryPath:w&&!a.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(a.id)}/retry`:void 0,
updatedAt:q(a.started),provenance:a.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:a.id,label:a.agent||
t("agent")}]})}for(let a of e.workflows){let d=a.session_key?p.get(a.session_key):void 0;if(d){to(d,a,t);continue}let w=a.
status==="failed";l.set(`workflow:${a.run_id}`,{id:`workflow:${a.run_id}`,title:ie(a.name,a.run_id),summary:w?t("workflo\
w_failed_generic"):a.status==="running"?t("workflow_running"):t("workflow_finished"),state:w?"needs-you":a.status==="run\
ning"?"running":"done",issue:w,runFailed:w||void 0,retryPath:w?`/api/workflows/runs/${encodeURIComponent(a.run_id)}/reru\
n`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:a.run_id,label:a.name||a.
run_id}]})}for(let a of e.crons){if(!a.is_running&&a.last_status!=="error")continue;let d=a.last_status==="error";l.set(
`monitor:${a.id}`,{id:`monitor:${a.id}`,title:a.name,summary:t(d?"monitor_failed":"monitor_running"),state:d?"needs-you":
"running",issue:d,runFailed:d||void 0,retryPath:d?`/api/crons/${encodeURIComponent(a.id)}/run`:void 0,updatedAt:q(a.running_since||
a.last_run_ts||a.created_ts),provenance:t("monitor"),action:d?"discuss":void 0,references:[{kind:"monitor",id:a.id,label:a.
name}]})}let m=[...e.artifacts].sort((a,d)=>q(d.updated_at)-q(a.updated_at)).slice(0,8);for(let a of m){let d=a.session_key&&
p.has(a.session_key)?a.session_key:void 0;l.set(`artifact:${a.slug}`,{id:`artifact:${a.slug}`,title:ie(a.name,t("artifac\
t")),summary:a.description||t("artifact_ready",{kind:a.kind}),state:"done",issue:!1,updatedAt:q(a.updated_at||a.created_at),
sessionKey:d,provenance:a.session_title||a.source||t("artifact"),action:d?"open":void 0,references:[{kind:"artifact",id:a.
slug,label:a.name,sessionKey:d},...d?[{kind:"session",id:d,label:a.session_title||d,sessionKey:d}]:[]]})}let v=[...l.values()];
return fo(v,c),Yt(v)}function Xe(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.
filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function Jt(e,t){let o=t.trim().toLowerCase();
return o?e.filter(n=>[n.title,n.summary,n.provenance,...n.references.flatMap(c=>[c.label,c.id,c.url])].join(`
`).toLowerCase().includes(o)):e}function Xt(e){let t=[],o=new Map;for(let n of e){let s=n.sessionKey;if(!s)continue;let c=o.
get(s);if(c){c.count+=1;continue}let l=n.references.find(m=>m.kind==="session")?.label??n.provenance,p={sessionKey:s,label:l,
leading:n,count:1};o.set(s,p),t.push(p)}return t}function Ze(e,t,o=Le){if(t==="pr")return ko(e);if(t==="goal")return He(
e,o);let n=[],s=new Map;for(let c of e){let l=c.sessionKey;if(!l){n.push({key:c.id,items:[c],header:null,sessionKey:null,
changeRef:null});continue}let p=s.get(l);if(p){p.items.push(c);continue}let m={key:l,items:[c],header:"session",sessionKey:c.
sessionKey??null,changeRef:null};s.set(l,m),n.push(m)}return n}function ko(e){let t=[],o=new Map;for(let n of e){let s=n.
references.filter(c=>c.kind==="change"||c.kind==="issue");for(let c of s){let l=`${c.kind}:${c.id}`,p=o.get(l);if(p){p.items.
push(n);continue}let m={key:l,items:[n],header:"pr",sessionKey:null,changeRef:c};o.set(l,m),t.push(m)}}return t}function He(e,t){
let o=e.map((p,m)=>m),n=p=>{for(;o[p]!==p;)o[p]=o[o[p]],p=o[p];return p},s=(p,m)=>{o[n(m)]=n(p)};for(let p=0;p<e.length;p+=
1)for(let m=p+1;m<e.length;m+=1){let v=e[p],a=e[m];if(!v.sessionKey||!a.sessionKey||v.sessionKey===a.sessionKey)continue;
let d=be(v,a);t.split.includes(d)||(t.merged.includes(d)||Ee(v,a))&&s(p,m)}let c=[],l=new Map;for(let p=0;p<e.length;p+=
1){let m=n(p),v=l.get(m);if(v){v.items.push(e[p]),v.header="goal";continue}let a={key:`goal:${e[p].id}`,items:[e[p]],header:null,
sessionKey:null,changeRef:null};l.set(m,a),c.push(a)}return c}function vo(e,t){let o=e.references.find(s=>s.kind==="sess\
ion")?.label??"",n=`${e.title}
${o}
${e.provenance}`.toLowerCase();for(let s of t)if(s.aliases.some(c=>c&&n.includes(c.toLowerCase())))return s.name;return null}
function Mt(e){return e.some(t=>t.state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function Zt(e){
let t=e.find(n=>n.moving);if(t)return t;let o=e.find(n=>n.state==="running");return o||[...e].sort((n,s)=>(s.updatedAt||
0)-(n.updatedAt||0))[0]}function xo(e){let t=[],o=new Set;for(let n of e){let s=n.sessionKey;!s||o.has(s)||(o.add(s),t.push(
n.references.find(c=>c.kind==="session")?.label??n.provenance))}return t}function en(e,t,o=Le){let n=new Map,s=[],c=new Map;
for(let a of e){let d=vo(a,t);if(c.set(a.id,d),d===null){s.push(a);continue}n.has(d)||n.set(d,[]),n.get(d).push(a)}let l=He(
s,o),p=new Map;for(let a of l)p.set(a.items[0].id,a);let m=[],v=new Set;for(let a of e){let d=c.get(a.id)??null;if(d!==null){
if(v.has(d))continue;v.add(d);let I=n.get(d);m.push({key:`initiative:${d}`,name:d,status:Mt(I),sessions:xo(I),blocks:He(
I,o)});continue}let w=p.get(a.id);w&&m.push({key:w.key,name:null,status:Mt(w.items),sessions:[],blocks:[w]})}return m}function et(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function nn(e,t){return e.filter(o=>o.key&&
o.key!==t&&o.memory_mode!=="incognito").sort((o,n)=>tn(n)-tn(o)).slice(0,12)}function tn(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function on(e,t){
let o={},n="unknown";for(let s of e)try{let c=await t(`/api/chat/slots/${encodeURIComponent(s.key)}/summary`);if(!c||typeof c!=
"object"){n="unsupported";break}if(c.enabled===!1){n="disabled";break}o[s.key]=c,n="available"}catch{n="unsupported";break}
return{summaries:o,support:n}}var rn=String.raw`
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
  /* The big goal shell. Deliberately NOT a card: a soft left rail + indented
     body keeps one visual language — cards stay the item/goal level. */
  .ow-initiative { display: flex; flex-direction: column; gap: 8px; }
  .ow-init-head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 8px 10px;
    border: 0;
    border-radius: var(--radius-lg, 8px);
    background: none;
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
    text-align: left;
  }
  .ow-init-head:hover { background: var(--bg-hover); }
  .ow-init-chevron { flex: none; transition: transform 0.15s ease; }
  .ow-init-chevron[data-open='true'] { transform: rotate(90deg); }
  /* The NAME is the point of the header — it never yields to the session list. */
  .ow-init-name { flex: none; max-width: 40ch; font-weight: 650; color: var(--text-strong); }
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
  .ow-init-sessions { flex: 1; min-width: 0; color: var(--muted); font-size: 12px; }
  .ow-init-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-left: 10px;
    padding-left: 12px;
    border-left: 2px solid var(--border);
  }
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
`;import{Fragment as _e,jsx as i,jsxs as g}from"react/jsx-runtime";var nt="crew-manager.snoozed",ln="crew-manager.handled",
dn="crew-manager.done-collapsed",ot="crew-manager.goal-verdicts",cn="crew-manager.initiative-collapsed";function ke(e,t={}){
try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}function Z(e,t){try{localStorage.setItem(e,JSON.
stringify(t))}catch{}}var ae="crew-manager-conductor",To=5e3,$o={session:"Session",approval:"Approval",agent:"Agent",workflow:"\
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
untitled_work:"Untitled work"};function de(e,t={}){return $o[e].replace(/\{\{(\w+)\}\}/g,(o,n)=>t[n]??"")}var Mo={followup:"\
FOLLOW UP",unblock:"UNBLOCK"},ve={"needs-you":"Needs you",running:"Running",done:"Done"},rt={all:"All","needs-you":"Need\
s you",running:"Running",done:"Done"},un={all:"All",failing:"Failing",running:"Running",merged:"Merged"},qo={session:lt,
approval:gn,agent:So,workflow:Ao,monitor:Co,artifact:No,change:mn,issue:hn};function j({children:e,onActivate:t,...o}){return i(
"div",{...o,role:"button",tabIndex:0,onClick:t,onKeyDown:n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t())},children:e})}
function at({label:e,count:t,subtitle:o}){return g("div",{className:"ow-section-header",children:[g("div",{className:"ow\
-section-heading",children:[i("h2",{className:"ow-section-title",children:e}),i("span",{className:"ow-section-count",children:t})]}),
o&&i("p",{className:"ow-section-subtitle",children:o})]})}function yn(e){if(e.state==="needs-you"){let t=Je(e);return t?
i(Oe,{variant:"warn",className:"ow-verb",children:Mo[t]}):null}return e.state==="running"?e.moving?g(Oe,{variant:"aim",children:[
i(Ro,{className:"ow-icon"}),ve[e.state]]}):i(Oe,{variant:"muted",children:"Queued"}):g(Oe,{variant:"ok",children:[i(wn,{
className:"ow-icon"}),ve[e.state]]})}var zo=8;function Do({hits:e,now:t,onOpenSession:o}){return e.length===0?null:g("section",{className:"ow-section","aria-\
label":"From past work",children:[i(at,{label:"From past work",count:e.length}),i("div",{className:"ow-section-list",children:e.
map(n=>i(j,{className:"ow-row ow-recall-row",onActivate:()=>o(n.session_key),"data-testid":`recall-${n.session_key}`,children:g(
"div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[g("div",{className:"ow-row-head\
ing",children:[i("span",{className:"ow-row-title",children:n.title}),i("span",{className:"ow-recall-age",children:Nt(n.modified,
t)})]}),n.snippet&&i("p",{className:"ow-row-summary",children:n.snippet})]}),g("div",{className:"ow-row-actions",children:[
i(L,{className:"ow-primary-action",onClick:s=>{s.stopPropagation(),o(n.session_key)},children:"Open"}),i(xe,{className:"\
ow-icon","aria-hidden":"true"})]})]})},n.session_key))})]})}function kn({tool:e,purpose:t,busy:o,onAnswer:n,where:s}){return g(
"div",{className:"ow-permission",children:[g("div",{className:"ow-permission-body",children:[g("div",{className:"ow-perm\
ission-head",children:[i(Io,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-permission-title",children:"\
Waiting for your permission"})]}),g("p",{className:"ow-permission-what",children:[s&&g("span",{className:"ow-truncate",children:[
s," "]}),s?"wants to run ":"Wants to run ",i("code",{children:e})]}),t&&i("p",{className:"ow-permission-why",children:t})]}),
g("div",{className:"ow-permission-actions",children:[i(L,{onClick:()=>n(!0),disabled:o,children:"Approve"}),i(L,{onClick:()=>n(
!1),disabled:o,children:"Reject"})]})]})}function st({children:e}){return i("div",{className:"ow-expand",children:i("div",
{className:"ow-expand-inner",children:e})})}var it=3;function pn(e){let t=e.provenance.trim().toLowerCase();return e.references.
filter(o=>o.label.trim().toLowerCase()!==t)}function Go({block:e,collapsed:t,onToggle:o}){return g(j,{onActivate:o,className:"\
ow-init-head","aria-expanded":!t,children:[i(xe,{className:"ow-icon ow-init-chevron","data-open":t?void 0:"true","aria-h\
idden":"true"}),i("span",{className:"ow-truncate ow-init-name",children:e.name}),i("span",{className:"ow-init-status","d\
ata-status":e.status,children:ve[e.status]}),g("span",{className:"ow-init-sessions ow-truncate",children:[e.sessions.slice(
0,3).join(" \xB7 "),e.sessions.length>3?` +${e.sessions.length-3}`:""]})]})}function Fo({block:e,onSplit:t,selected:o,onSelect:n}){
let s=e.items[0],c=new Set(e.items.map(m=>m.sessionKey).filter(Boolean)).size,l=[];for(let m=0;m<e.items.length;m+=1)for(let v=m+
1;v<e.items.length;v+=1)e.items[m].sessionKey!==e.items[v].sessionKey&&l.push(be(e.items[m],e.items[v]));let p=g(_e,{children:[
i(bn,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-truncate ow-block-name",children:s.title}),g("s\
pan",{className:"ow-block-tab-meta",children:[i("span",{"aria-hidden":"true",children:"\xB7"}),g("span",{className:"ow-t\
runcate",children:[c," sessions, one goal"]})]}),t&&i(L,{className:"ow-block-open",title:"Not the same goal \u2014 split into\
 separate cards","aria-label":`Split ${s.title}`,onClick:m=>{m.stopPropagation(),t(l)},children:"Split"})]});return n?i(
j,{onActivate:n,className:"ow-block-tab ow-goal-tab","aria-pressed":o,"data-selected":o?"true":void 0,children:p}):i("di\
v",{className:"ow-block-tab",children:p})}var Uo=.3;function jo({item:e,items:t,onMerge:o}){let n=t.filter(s=>s.id!==e.id&&
s.sessionKey&&e.sessionKey&&s.sessionKey!==e.sessionKey).map(s=>({other:s,score:Ee(e,s)?1:Ke(e.title,s.title)})).filter(
s=>s.score>=Uo).sort((s,c)=>c.score-s.score).slice(0,2);return n.length===0?null:g("div",{className:"ow-merge-hint",children:[
i("span",{className:"ow-merge-hint-label",children:"Same goal?"}),n.map(({other:s})=>g("button",{type:"button",className:"\
ow-merge-hint-btn ow-truncate",onClick:()=>o(be(e,s)),children:["Merge with \u201C",s.title,"\u201D"]},s.id))]})}function Ho({
item:e,onOpen:t}){let o=e.references.find(s=>s.kind==="session"),n=e.references.filter(s=>s.kind!=="session");return g("\
div",{className:"ow-block-tab",children:[i(lt,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-trunca\
te ow-block-name",children:o?.label??e.provenance}),g("span",{className:"ow-block-tab-meta",children:[i("span",{"aria-hi\
dden":"true",children:"\xB7"}),i("span",{className:"ow-truncate",children:e.provenance}),n.slice(0,2).map(s=>i("span",{className:"\
ow-truncate",children:s.label},`${s.kind}:${s.id}`))]}),i(L,{className:"ow-block-open",onClick:t,"aria-label":`Open ${o?.
label??e.provenance}`,children:"Open"})]})}function Vo({session:e,selected:t,onSelect:o,onOpen:n}){return g(j,{onActivate:o,
className:"ow-srow","data-selected":t,children:[i(lt,{className:"ow-icon","aria-hidden":"true"}),g("div",{className:"ow-\
srow-body",children:[i("div",{className:"ow-srow-name ow-truncate",children:e.label}),i("div",{className:"ow-srow-state \
ow-truncate",children:e.leading.summary})]}),i("span",{className:"ow-srow-badge",children:yn(e.leading)}),i(L,{className:"\
ow-srow-open","aria-label":`Open ${e.label}`,onClick:s=>{s.stopPropagation(),n()},children:"Open"})]})}function Yo({reference:e,
checks:t}){let o=e.status?/fail|conflict|closed/.test(e.status):!1;return g("div",{className:"ow-pr-head",children:[g("d\
iv",{className:"ow-pr-head-top",children:[i("span",{className:"ow-truncate ow-block-name",children:e.label}),e.url&&i("a",
{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,
children:i(mn,{className:"ow-icon","aria-hidden":"true"})})]}),i("div",{className:"ow-pr-status-line",children:t?.available&&
(t.total??0)>0?g("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total,
" checks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&i("span",{className:"ow-pr-dot","data-ba\
d":o?"true":void 0,children:e.status})})]})}function Qo({reference:e,onOpenSession:t}){let o=qo[e.kind],n=g(_e,{children:[
i(o,{className:"ow-icon"}),i("span",{className:"ow-truncate",children:e.label})]});return e.url?i("a",{className:"ow-ref\
erence ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:s=>s.stopPropagation(),children:n}):
e.sessionKey?i(j,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:n}):i("span",{className:"\
ow-reference",children:n})}function vn({item:e,selected:t,continuation:o,whyRanked:n,onSelect:s,onOpenSession:c,onAnswerPermission:l,
permissionBusy:p,onRetry:m,retryBusy:v,onPickStep:a,onSnooze:d,onHandled:w,hideBadge:I,compact:x}){let[k,O]=_(!1);return g(
j,{onActivate:s,className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":void 0,"data\
-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[g("div",{className:"ow-row-layout",children:[
g("div",{className:"ow-row-content",children:[g("div",{className:"ow-row-heading",children:[I?e.state==="done"&&i(fn,{className:"\
ow-icon ow-row-check","aria-hidden":"true"}):yn(e),i("span",{className:"ow-row-title",children:e.title})]}),(!x||t)&&e.summary&&
!(e.nextSteps??[]).some(y=>y.what?.trim()===e.summary)&&i("p",{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&
g(j,{className:"ow-row-duplicate",onActivate:()=>c(e.duplicateOf.sessionKey),children:[i(bn,{className:"ow-icon","aria-h\
idden":"true"}),i("span",{className:"ow-truncate",children:de(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.
title})})]}),n&&i("div",{className:"ow-row-why",children:n}),!o&&g("div",{className:"ow-row-meta",children:[i("span",{className:"\
ow-truncate",children:e.provenance}),pn(e).length>0&&i("span",{"aria-hidden":"true",children:"\xB7"}),i("span",{className:"\
ow-references",children:pn(e).slice(0,3).map(y=>i(Qo,{reference:y,onOpenSession:c},`${y.kind}:${y.id}`))})]})]}),i("div",
{className:"ow-row-actions",children:i(xe,{className:"ow-icon","aria-hidden":"true"})})]}),t&&a&&e.nextSteps&&e.nextSteps.
length>0&&i(st,{children:g("div",{className:"ow-row-steps",children:[i("div",{className:"ow-steps-head",children:"Sugges\
ted next steps"}),e.nextSteps.slice(0,k?void 0:it).map((y,S)=>i("button",{type:"button",className:"ow-quote-step",title:y.
why??y.what,onClick:F=>{F.stopPropagation(),a(y.what)},children:y.what},`${S}:${y.what}`)),e.nextSteps.length>it&&i("but\
ton",{type:"button",className:"ow-steps-more",onClick:y=>{y.stopPropagation(),O(S=>!S)},children:k?"Show fewer":`+${e.nextSteps.
length-it} more`})]})}),t&&e.retryPath&&m&&i(st,{children:i("div",{className:"ow-retry",children:i(L,{onClick:()=>m(e.retryPath),
disabled:!!v,children:"Retry"})})}),t&&e.permissionId&&l&&i(st,{children:i(kn,{tool:e.permissionTool||"a tool",purpose:e.
permissionPurpose,busy:!!p,onAnswer:y=>l(e.permissionId,y)})}),e.state==="needs-you"&&d&&w&&g("div",{className:"ow-row-a\
side",children:[i("button",{type:"button",className:"ow-aside-btn",onClick:y=>{y.stopPropagation(),d(e.id)},children:"La\
ter"}),i("button",{type:"button",className:"ow-aside-btn",onClick:y=>{y.stopPropagation(),w(e.id,e.updatedAt)},children:"\
Handled"})]})]})}var Jo=["unblock","followup","running","done"],Xo={unblock:{label:"UNBLOCK",cls:"ow-lane-unblock"},followup:{
label:"FOLLOW UP",cls:"ow-lane-followup"}};function Zo(e){return e.state==="done"?"done":e.state==="running"?"running":Je(
e)??"unblock"}function er({items:e,selectedId:t,onSelect:o,onOpenSession:n,onAnswerPermission:s,permissionBusy:c,onRetry:l,
retryBusy:p,onPickStep:m,onSnooze:v,onHandled:a,doneTitles:d}){let[w,I]=_(!1),x=new Map;for(let k of e){let O=Zo(k),y=x.
get(O);y?y.push(k):x.set(O,[k])}return g(_e,{children:[Jo.filter(k=>x.has(k)).map(k=>{let O=x.get(k),y=k==="unblock"||k===
"followup"?Xo[k]:null,S=y?O.map(C=>C.action!=="resume"?ye(J(C),de):""):[],F=y&&S.length>0&&S.every(C=>C&&C===S[0])?S[0]:
void 0;return g("div",{className:"ow-lane",children:[y&&g("div",{className:"ow-lane-head",children:[i("span",{className:`\
ow-lane-badge ${y.cls}`,children:y.label}),F&&i("span",{className:"ow-lane-reason",children:F})]}),O.map(C=>i(vn,{item:C,
hideBadge:!0,compact:!0,selected:t===C.id,continuation:!0,whyRanked:F?void 0:C.state==="needs-you"&&C.action!=="resume"?
ye(J(C),de):void 0,onSelect:()=>o(C),onOpenSession:n,onAnswerPermission:s,permissionBusy:c,onRetry:l,retryBusy:p,onPickStep:m,
onSnooze:v,onHandled:a},C.id))]},k)}),!x.has("done")&&d&&d.length>0&&g("div",{className:"ow-lane ow-lane-done",children:[
g("button",{type:"button",className:"ow-goals-toggle","aria-expanded":w,onClick:()=>I(k=>!k),children:[i(xe,{className:"\
ow-icon","data-open":w?"true":void 0,"aria-hidden":"true"}),d.length," done"]}),w&&i("ul",{className:"ow-done-list",children:d.
map(k=>g("li",{className:"ow-row-goal-done",children:[i(fn,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"\
ow-truncate",children:k})]},k))})]})]})}function le({title:e,items:t,selectedId:o,onSelect:n,onOpenSession:s,onAnswerPermission:c,
permissionBusy:l,onRetry:p,retryBusy:m,onPickStep:v,onSnooze:a,onHandled:d,footer:w,collapsed:I,onToggleCollapsed:x,groupBy:k,
prChecks:O,prFilter:y,doneBySession:S,goalVerdicts:F,onSplitGoal:C,onMergeGoal:Se,initiativeBlocks:dt,collapsedInitiatives:Pe,
onToggleInitiative:ce,selectedGoalKey:Re,onSelectGoal:ue,subtitle:pe,emptyLabel:ge}){let fe=Ze(t,k,F),ee=k==="pr"&&y&&y!==
"all"?fe.filter(b=>b.changeRef&&Ve(b.changeRef,O?.[b.changeRef.url??""])===y):fe,te=dt??[],T=k==="goal"?te.length:k==="p\
r"?ee.length:t.length,ne=b=>g("div",{className:"ow-block","data-grouped":b.header?"true":void 0,children:[b.header==="se\
ssion"&&b.sessionKey&&i(Ho,{item:b.items[0],onOpen:()=>s(b.sessionKey)}),b.header==="pr"&&b.changeRef&&i(Yo,{reference:b.
changeRef,checks:O?.[b.changeRef.url??""]}),b.header==="goal"&&i(Fo,{block:b,onSplit:C,selected:Re===b.key,onSelect:ue?()=>ue(
b.key):void 0}),b.header==="pr"||b.header==="goal"?g(_e,{children:[i("div",{className:"ow-pr-sublabel",children:b.header===
"pr"?"Sessions on this PR":"Sessions on this goal"}),Xt(b.items).map(N=>i(Vo,{session:N,selected:o===N.leading.id,onSelect:()=>n(
N.leading),onOpen:()=>s(N.sessionKey)},N.sessionKey))]}):b.header==="session"?i(er,{items:b.items,doneTitles:b.sessionKey?
S?.[b.sessionKey]:void 0,selectedId:o,onSelect:n,onOpenSession:s,onAnswerPermission:c,permissionBusy:l,onRetry:p,retryBusy:m,
onPickStep:v,onSnooze:a,onHandled:d}):b.items.map(N=>g(sn,{children:[i(vn,{item:N,selected:o===N.id,continuation:b.header===
"session",whyRanked:N.state==="needs-you"&&N.action!=="resume"?ye(J(N),de):void 0,onSelect:()=>n(N),onOpenSession:s,onAnswerPermission:c,
permissionBusy:l,onRetry:p,retryBusy:m,onPickStep:v,onSnooze:a,onHandled:d}),k==="goal"&&Se&&o===N.id&&i(jo,{item:N,items:t,
onMerge:Se})]},N.id))]},b.key),D=b=>{if(!b.name)return i(sn,{children:ne(b.blocks[0])},b.key);let N=Pe?.[b.key]??b.status!==
"needs-you";return g("div",{className:"ow-initiative","data-status":b.status,children:[i(Go,{block:b,collapsed:N,onToggle:()=>ce?.(
b.key,!N)}),!N&&i("div",{className:"ow-init-body",children:b.blocks.map(ne)})]},b.key)};return g("section",{className:"o\
w-section","aria-label":e,children:[x?g(j,{onActivate:x,className:"ow-section-toggle",children:[i(at,{label:e,count:T,subtitle:pe}),
i(xe,{className:"ow-icon ow-section-chevron","data-open":I?void 0:"true","aria-hidden":"true"})]}):i(at,{label:e,count:T,
subtitle:pe}),I?null:i("div",{className:"ow-section-list",children:k==="goal"?te.length===0?i("p",{className:"ow-section\
-empty",children:ge}):te.map(D):ee.length===0?i("p",{className:"ow-section-empty",children:ge}):ee.map(ne)}),w]})}function tr(e,t){
let o=Ft(t,de);if(!e)return["Crew Manager context: workspace overview.",...o,"Answer the user about the state of their w\
ork. This is a conversation, not an action channel."].join(`
`);let n=e.references.map(s=>`${s.kind}: ${s.label} (${s.id})`).join(`
`);return[`Crew Manager context: ${e.title}`,...o,`Selected item: ${e.title}`,`State: ${ve[e.state]}`,e.issue?"Issue det\
ected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,e.sessionKey?`Referenced session: ${e.
sessionKey}`:"Referenced session: none",`References:
${n}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(s=>!!s).join(`
`)}function nr(){let e=Bo(),t=X(e);t.current=e;let o=Ko(),n=Eo(),[s,c]=_("all"),[l,p]=_("session"),[m,v]=_("all"),[a,d]=_(
{}),[w,I]=_(""),[x,k]=_(null),[O,y]=_(null),[S,F]=_(null),[C,Se]=_({}),[dt,Pe]=_("unknown"),ce=X("unknown"),Re=X(new Map),
[ue,pe]=_({}),[ge,fe]=_({}),[ee,te]=_([]),[T,ne]=_(null),[D,b]=_(null),[N,ct]=_(()=>ke(nt)),[ut,xn]=_(()=>ke(ln)),[we,pt]=_(
()=>ke(ot,{merged:[],split:[]})),[gt,_n]=_([]),[Sn,Rn]=_(()=>ke(cn)),[Ne,Ie]=_(null),[Nn,In]=_(()=>ke(dn,null)??!0),[Ce,
Te]=_(It),[ft,wt]=_({}),mt=X(!0),[Cn,ht]=_(!0),[bt,$e]=_(null),[Wn,An]=_(!1),[yt,me]=_(null),W=X(!0),he=X(0),Me=X(!1);z(
()=>(W.current=!0,()=>{W.current=!1,he.current+=1}),[]);let K=$(async()=>{let r=++he.current,u=t.current;try{let[f,h,R,A,
Ae,_t]=await Promise.all([u.get("/api/chat/slots"),u.get("/api/approvals"),u.get("/api/spawn"),u.get("/api/workflows/run\
s"),u.get("/api/crons"),u.get("/api/artifacts")]);if(!W.current||r!==he.current)return;F({slots:Array.isArray(f)?f:[],approvals:Array.
isArray(h)?h:[],agents:Array.isArray(R.agents)?R.agents:[],workflows:Array.isArray(A.runs)?A.runs:[],crons:Array.isArray(
Ae.jobs)?Ae.jobs:[],artifacts:Array.isArray(_t.artifacts)?_t.artifacts:[]}),$e(null)}catch(f){W.current&&r===he.current&&
$e(f instanceof Error?f:new Error("Unable to load Crew Manager sources"))}finally{W.current&&r===he.current&&ht(!1)}},[]);
z(()=>{K();let r=window.setInterval(()=>{K()},To);return()=>window.clearInterval(r)},[K]);let Bn=()=>{ht(!0),$e(null),K()};
z(()=>{if(!S||ce.current==="unsupported"||ce.current==="disabled")return;let r=nn(S.slots,ae).filter(f=>Re.current.get(f.
key)!==et(f));if(r.length===0)return;let u=!1;return(async()=>{let{summaries:f,support:h}=await on(r,R=>t.current.get(R));
if(!(u||!W.current)&&(ce.current=h,Pe(h),h==="available")){for(let R of r)f[R.key]&&Re.current.set(R.key,et(R));Se(R=>({
...R,...f}))}})(),()=>{u=!0}},[S]),z(()=>{if(!S||!mt.current)return;let r=!1;return(async()=>{try{let u=await t.current.
get("/api/apps/crew-manager/stalls");if(r||!W.current)return;let f={};for(let R of u?.stalls??[])R?.key&&(f[R.key]=R);pe(
f);let h={};for(let R of u?.error_loops??[])R?.key&&(h[R.key]=R);wt(h)}catch{mt.current=!1,W.current&&(pe({}),wt({}))}})(),
()=>{r=!0}},[S]),z(()=>{let r=!1;return(async()=>{try{let u=await t.current.get("/api/apps/crew-manager/initiatives");if(r||
!W.current)return;_n((u?.initiatives??[]).filter(f=>f?.name))}catch{}})(),()=>{r=!0}},[]),z(()=>{if(Ce.unsupported)return;
let r=w.trim();if(!St(r)){Te(h=>h.hits.length?{...h,hits:[]}:h);return}let u=!1,f=setTimeout(()=>{(async()=>{try{let h=await t.
current.get(Wt(r,zo));if(u||!W.current)return;Te(Ct(h))}catch{W.current&&Te({unsupported:!0,hits:[]})}})()},300);return()=>{
u=!0,clearTimeout(f)}},[w,Ce.unsupported]);let kt=M(()=>Ut(Qt(S??{slots:[],approvals:[],agents:[],workflows:[],crons:[],
artifacts:[]},de,C,ue,ft,we),ge),[S,C,ue,ft,ge,we]),We=M(()=>Ht(kt,N,ut),[kt,N,ut]),E=M(()=>We.items.filter(r=>Vt(r)),[We]),
qe=M(()=>Xe(E),[E]),vt=M(()=>{let r={};for(let u of E){if(u.state!=="done"||!u.sessionKey)continue;let f=r[u.sessionKey];
f?f.push(u.title):r[u.sessionKey]=[u.title]}return r},[E]),U=M(()=>E.find(r=>r.id===x)??null,[E,x]),B=M(()=>{let r=Jt(E,
w);return l==="pr"||l==="goal"||w.trim()||s==="all"?r:r.filter(u=>u.state===s)},[s,E,w,l]),Kn=M(()=>{let r={all:0,failing:0,
running:0,merged:0};for(let u of Ze(B,"pr")){if(!u.changeRef)continue;r.all++;let f=Ve(u.changeRef,a[u.changeRef.url??""]);
f!=="other"&&r[f]++}return r},[B,a]);z(()=>{if(l!=="pr")return;let r=new Set;for(let f of B)for(let h of f.references)h.
kind==="change"&&h.url&&/github\.com\/.+\/pull\//.test(h.url)&&r.add(h.url);let u=!1;for(let f of r)a[f]||t.current.get(
`/pr-checks?url=${encodeURIComponent(f)}`).then(h=>{!u&&W.current&&d(R=>({...R,[f]:h}))}).catch(()=>{});return()=>{u=!0}},
[l,B,a]),z(()=>n(qe["needs-you"]),[qe,n]),z(()=>{x&&!E.some(r=>r.id===x)&&k(null)},[E,x]),z(()=>{let r=u=>{(u.metaKey||u.
ctrlKey)&&u.key.toLocaleLowerCase("en-US")==="k"&&(u.preventDefault(),document.querySelector('[data-crew-manager-search=\
"true"]')?.focus())};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[]);let ze=S?.
slots.find(r=>r.key===ae),En=!!(ze||Wn);z(()=>{!S||ze||Me.current||(Me.current=!0,e.post("/api/chat/slots",{name:ae,title:"\
Conductor"}).then(()=>{W.current&&(An(!0),K())}).catch(r=>{W.current&&(Me.current=!1,me(r instanceof Error?`Conductor se\
ssion could not be created: ${r.message}`:"Conductor session could not be created"))}))},[e,ze,K,S]);let xt=M(()=>zt(S?.
approvals??[],ee,r=>E.find(u=>u.sessionKey===r)?.title??S?.slots?.find(u=>u.key===r)?.title??r),[E,S,ee]),oe=U&&!U.permissionId?
U:null,De=M(()=>l==="goal"?en(B,gt,we):[],[l,B,gt,we]),G=M(()=>{if(!Ne)return null;for(let r of De){let u=r.blocks.find(
f=>f.key===Ne);if(u&&u.items.length>0)return u}return null},[Ne,De]),P=G?Zt(G.items):null,H=$(async(r,u)=>{if(!T){ne(r),
me(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(r)}/${u?"approve":"reject"}`,{}),K()}catch(f){me(
f instanceof Error?`Could not answer that request: ${f.message}`:"Could not answer that request"),K()}finally{W.current&&
ne(null)}}},[K,T]),Ln=$(r=>{ct(u=>{let f=Object.fromEntries(Object.entries(u).filter(([,h])=>h>Date.now()));return f[r]=
Date.now()+jt,Z(nt,f),f}),k(null)},[]),On=$((r,u)=>{xn(f=>{let h={...f,[r]:u};return Z(ln,h),h}),k(null)},[]),Pn=$(()=>{
ct({}),Z(nt,{})},[]),Tn=$(r=>{pt(u=>{let f={merged:u.merged.filter(h=>!r.includes(h)),split:[...new Set([...u.split,...r])]};
return Z(ot,f),f})},[]),$n=$(r=>{pt(u=>{let f={merged:[...new Set([...u.merged,r])],split:u.split.filter(h=>h!==r)};return Z(
ot,f),f})},[]),Mn=$(()=>{In(r=>(Z(dn,!r),!r))},[]),re=$(async r=>{if(!D){b(r),me(null);try{await t.current.post(r,{}),K()}catch(u){
me(u instanceof Error?`Could not re-run it: ${u.message}`:"Could not re-run it"),K()}finally{W.current&&b(null)}}},[K,D]),
V=$(async r=>{if(G&&P?.sessionKey){let f=P.sessionKey,h=G.items.map(A=>`- ${A.references.find(Ae=>Ae.kind==="session")?.
label??A.sessionKey}: ${ve[A.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(f)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${G.items[0].title}", which spans sessions:`,h,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:f}).catch(A=>{if(!(A instanceof
SyntaxError))throw A}),!W.current)return;fe(A=>({...A,[P.id]:Date.now()})),te(A=>A.includes(f)?A:[...A,f]);let R=P.references.
find(A=>A.kind==="session")?.label??P.title;y(P.moving||P.state==="running"?`Sent to ${R} \u2014 the active session on this g\
oal`:`Sent to ${R} \u2014 resuming the last session on this goal`),Ie(null),K();return}let u=U&&!U.permissionId?U:null;if(u?.
sessionKey){let f=u.sessionKey;if(await t.current.post("/api/chat",{message:r,slot:f}).catch(h=>{if(!(h instanceof SyntaxError))
throw h}),!W.current)return;fe(h=>({...h,[u.id]:Date.now()})),te(h=>h.includes(f)?h:[...h,f]),y(`Sent new instructions t\
o ${u.title}`),k(null),K();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(ae)}/context`,{content:tr(U,
E),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:ae}).catch(f=>{if(!(f instanceof
SyntaxError))throw f})},[U,G,P,E,K]),qn=M(()=>Rt(Ce.hits,B),[Ce.hits,B]),Ge={"needs-you":B.filter(r=>r.state==="needs-yo\
u"),running:B.filter(r=>r.state==="running"),done:B.filter(r=>r.state==="done")},zn=$((r,u)=>{Rn(f=>{let h={...f,[r]:u};
return Z(cn,h),h})},[]),Dn=$(r=>{Ie(u=>u===r?null:r),k(null),y(null)},[]),Y=r=>o(`/chat?sid=${encodeURIComponent(r)}`),se=r=>{
k(u=>u===r.id?null:r.id),Ie(null),y(null)};return g("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[
i("style",{children:rn}),i(Oo,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what\
 finished recently."}),i("div",{className:"ow-body",children:g("div",{className:"ow-layout",children:[i("nav",{className:"\
ow-rail","aria-label":"Crew Manager",children:i("div",{className:"ow-rail-inner",children:g("div",{className:"ow-groupby",
role:"group","aria-label":"Group by",children:[i("span",{className:"ow-groupby-label",children:"Group by"}),["session","\
pr","goal"].map(r=>i(L,{onClick:()=>p(r),"aria-pressed":l===r,"data-selected":l===r,className:"ow-groupby-opt",children:r===
"session"?"Session":r==="pr"?"PR":"Goal"},r))]})})}),i("main",{className:"ow-work",children:g("div",{className:"ow-work-\
inner",children:[g("div",{className:"ow-toolbar",children:[i(Po,{"data-crew-manager-search":"true",value:w,onChange:r=>I(
r.target.value),placeholder:"Search work and projects\u2026 \u2318K","aria-label":"Search work",className:"ow-search"}),
l==="pr"?i("div",{className:"ow-filters",role:"group","aria-label":"Filter by PR status",children:Object.keys(un).map(r=>g(
L,{onClick:()=>v(r),"aria-pressed":m===r,"data-selected":m===r,className:"ow-filter",children:[un[r],i("span",{className:"\
ow-count",children:Kn[r]})]},r))}):l==="goal"?null:i("div",{className:"ow-filters",role:"group","aria-label":"Filter by \
state",children:Object.keys(rt).map(r=>g(L,{onClick:()=>c(r),"aria-pressed":s===r,"data-selected":s===r,className:"ow-fi\
lter",children:[rt[r],i("span",{className:"ow-count",children:qe[r]})]},r))})]}),Cn?i(an,{rows:7}):bt&&!S?i(tt,{icon:i(gn,
{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:bt.message,action:i(L,{onClick:Bn,children:"\
Try again"})}):B.length===0?i(tt,{icon:i(Wo,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter \
or search for a session, project, PR, or output."}):s==="all"||w.trim()?l==="pr"?B.some(r=>r.references.some(u=>u.kind===
"change"||u.kind==="issue"))?i(le,{title:"Work by PR",subtitle:"Every pull request your work touches",items:B,prChecks:a,
prFilter:m,selectedId:x,onSelect:se,onOpenSession:Y,onAnswerPermission:(r,u)=>{H(r,u)},permissionBusy:T!==null,onRetry:r=>{
re(r)},retryBusy:D!==null,onPickStep:r=>{V(r)},groupBy:l,emptyLabel:"No matching work"}):i(tt,{icon:i(hn,{className:"ow-\
icon"}),title:"No work is linked to a PR right now",subtitle:"Work links to a PR when a session mentions its URL (a GitH\
ub/GitLab pull, merge request, or issue). None of the current sessions do, so there is nothing to group by PR yet.",action:i(
L,{onClick:()=>p("session"),children:"Back to Session view"})}):l==="goal"?i(le,{title:"Work by goal",subtitle:"The same\
 job across sessions, merged into one card",items:B,selectedId:x,onSelect:se,onOpenSession:Y,onAnswerPermission:(r,u)=>{
H(r,u)},permissionBusy:T!==null,onRetry:r=>{re(r)},retryBusy:D!==null,onPickStep:r=>{V(r)},groupBy:l,goalVerdicts:we,onSplitGoal:Tn,
onMergeGoal:$n,initiativeBlocks:De,collapsedInitiatives:Sn,onToggleInitiative:zn,selectedGoalKey:Ne,onSelectGoal:Dn,emptyLabel:"\
No matching work"}):g(_e,{children:[i(le,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:Ge["\
needs-you"],doneBySession:vt,selectedId:x,onSelect:se,onSnooze:Ln,onHandled:On,footer:We.snoozedCount>0?g("button",{type:"\
button",className:"ow-aside-note",onClick:Pn,children:[We.snoozedCount," set aside for later \u2014 bring back"]}):void 0,
onOpenSession:Y,onAnswerPermission:(r,u)=>{H(r,u)},permissionBusy:T!==null,onRetry:r=>{re(r)},retryBusy:D!==null,onPickStep:r=>{
V(r)},groupBy:l,emptyLabel:"Nothing needs your input right now."}),i(le,{title:"In progress",subtitle:"Being worked on r\
ight now",items:Ge.running,doneBySession:vt,selectedId:x,onSelect:se,onOpenSession:Y,onAnswerPermission:(r,u)=>{H(r,u)},
permissionBusy:T!==null,onRetry:r=>{re(r)},retryBusy:D!==null,onPickStep:r=>{V(r)},groupBy:l,emptyLabel:"Nothing is in p\
rogress right now."}),i(le,{title:"Done recently",subtitle:"Finished in the last few days",items:Ge.done,selectedId:x,onSelect:se,
collapsed:Nn,onToggleCollapsed:Mn,onOpenSession:Y,onAnswerPermission:(r,u)=>{H(r,u)},permissionBusy:T!==null,onRetry:r=>{
re(r)},retryBusy:D!==null,onPickStep:r=>{V(r)},groupBy:l,emptyLabel:"No recent completed work."})]}):i(le,{title:rt[s],items:B,
selectedId:x,onSelect:se,onOpenSession:Y,onAnswerPermission:(r,u)=>{H(r,u)},permissionBusy:T!==null,onRetry:r=>{re(r)},retryBusy:D!==
null,onPickStep:r=>{V(r)},groupBy:l,emptyLabel:"No matching work"}),w.trim()&&i(Do,{hits:qn,now:Date.now(),onOpenSession:Y})]})}),
g("aside",{className:"ow-conductor","aria-label":"Conductor",children:[i("div",{className:"ow-conductor-header",children:g(
"div",{className:"ow-conductor-title",children:[i("h2",{children:"Conductor"}),!oe&&i("span",{className:"ow-conductor-su\
b",children:"select work, or ask across all"})]})}),i("div",{className:"ow-chat",children:En?g("div",{className:"ow-chat\
-panel",children:[xt.length>0&&i("div",{className:"ow-permissions",role:"alert",children:xt.map(r=>i(kn,{tool:r.tool,purpose:r.
purpose,where:r.sessionLabel,busy:T!==null,onAnswer:u=>{H(r.id,u)}},r.id))}),O&&g("div",{className:"ow-conductor-receipt",
role:"status",children:[i(wn,{className:"ow-icon"}),O]}),yt&&i("div",{className:"ow-chat-error",role:"alert",children:yt}),
i("div",{className:"ow-embed",children:i(Lo,{slotKey:ae,frameless:!0,startAtBottom:!0,placeholder:G?"Instruction for thi\
s goal\u2026":oe?.sessionKey?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:V})}),G&&P?g(
"div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-body ow-quote-goal",children:[g("div",
{className:"ow-quote-line",children:[i("span",{className:"ow-eyebrow",children:"Instructing goal"}),i("span",{className:"\
ow-quote-title",title:G.items[0].title,children:G.items[0].title})]}),g("span",{className:"ow-quote-route ow-truncate",children:[
"\u2192 ",P.references.find(r=>r.kind==="session")?.label??P.title,P.moving||P.state==="running"?" (active)":" (will res\
ume)"]})]}),i(L,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{Ie(null),y(null)},children:"\
Clear"})]}):oe&&g("div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-body",children:[i("\
span",{className:"ow-eyebrow",children:oe.sessionKey?"Instructing":"Quoted"}),i("span",{className:"ow-quote-title",title:oe.
title,children:oe.title})]}),i(L,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{k(null),
y(null)},children:"Clear"})]})]}):i("div",{className:"ow-chat-loading",children:i(an,{rows:4})})})]})]})})]})}export{nr as default};
