import{useCallback as K,useEffect as j,useMemo as L,useRef as U,useState as _}from"react";import{AlertTriangle as $t,Bot as Qo,
Check as Bt,ChevronRight as te,Check as Kt,Clock as Dt,Package as Xo,ExternalLink as Zo,MessageSquare as Ot,RefreshCw as er,
Shield as nr,Waves as Lt,Search as tr,Tag as or,Users as Sn,Zap as rr}from"lucide-react";import{useAppApi as sr,useNavigate as ar,
useNavBadge as ir,ChatEmbed as lr}from"@kirocrew/app-sdk";import{Badge as D,Btn as O,ContentSkeleton as St,EmptyState as Rt,
PageHeader as dr}from"@kirocrew/app-sdk/ui";function le(e){let n=Math.max(1,Math.floor(e/60));if(n<60)return`${n} minute${n===1?"":"s"}`;let o=Math.floor(n/60),r=n%
60;return r===0?`${o} hour${o===1?"":"s"}`:`${o}h ${r}m`}function go(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function st(e,n,o){let r=new Set(n.filter(Boolean));if(r.size===0)return[];let i=new Set,
c=[];for(let d of e){let g=d.slot;!g||!r.has(g)||!d.id||i.has(d.id)||(i.add(d.id),c.push({id:d.id,sessionKey:g,sessionLabel:o(
g),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return c}var Hn=5,Gn={"needs-you":0,running:1,done:2};function M(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let n=Date.parse(e);return Number.isFinite(n)?n:0}function fo(e,n){if(e.paused)
return"";let o=M(e.next_run_ts);if(!o)return"";let r=Math.round((o-n)/1e3);return r<=0?"":le(r)}var Yn=72;function ae(e,n){
let o=e?.replace(/\s+/g," ").trim();if(!o)return n;let i=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(i.length<=Yn)return i;let c=i.slice(0,Yn),d=c.lastIndexOf(" ");return`${(d>24?c.slice(0,d):c).trim()}\u2026`}
function ie(e){return!!e.source_links?.some(n=>n.kind!=="issue"&&(n.ci==="failed"||n.mergeable==="conflicting"))}var mo=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
wo=/^\((?:code|diff|widget|image)\)$/,ho=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
bo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,yo=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
vo=/[?？]["'”’)\]]*$/;function at(e){let n=e.last_message?.replace(/\s+/g," ").trim();return!n||wo.test(n)||mo.test(
n)?null:n}function dn(e){if(!e.waiting_for_input)return null;let n=at(e);return!n||ho.test(n)||bo.test(n)?null:yo.test(n)||
vo.test(n)?n:null}function Vn(e){return e.pending_approval||dn(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":ie(e)?"needs-you":"done"}function ko(e,n){if(e.pending_approval)return n("approval_waiting");let o=dn(e);return o||
(e.running||e.subagents_running||e.orchestrating?n("work_in_progress"):ie(e)?n("linked_change_issue"):at(e)??n("recent_w\
ork_ready"))}function rn(e,n){let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||n("session")}function xo(e){return e.pending_approval?"review-approval":dn(e)?"reply":"open"}function it(e){
return(e.source_links??[]).map(n=>({number:String(n.number??""),ref:{kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.
kind==="issue"?`issue #${n.number}`:`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key,status:go(n)}}))}function _o(e,n){
let o=it(e).map(r=>r.ref);return{id:`session:${e.key}`,title:e.title||n("untitled_work"),summary:ko(e,n),state:Vn(e),moving:Vn(
e)==="running"||void 0,issue:ie(e),updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:rn(
e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:ie(e)||void 0,action:xo(e),references:[{kind:"session",id:e.key,label:e.
title||n("untitled_work"),sessionKey:e.key},...o]}}function cn(e,n){e.references.some(o=>o.kind===n.kind&&o.id===n.id)||
e.references.push(n)}function lt(e){return(e.source||"").toLowerCase()==="subagent"}function So(e,n,o){let r=lt(n);e.state=
"needs-you",e.updatedAt=Math.max(e.updatedAt,M(n.ts)),e.summary=o(r?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=
r?"subagent":"tool",e.action="review-approval",e.permissionId=n.id,e.permissionTool=n.tool||n.source,e.permissionPurpose=
n.tool_purpose,e.permissionInput=n.tool_input,cn(e,{kind:"approval",id:n.id,label:n.tool||n.source||o("approval"),sessionKey:n.
slot||e.sessionKey})}function Ro(e,n,o){e.updatedAt=Math.max(e.updatedAt,M(n.started)),e.issue||=!!(n.done&&(n.error||n.
outcome==="failed")),n.done?(n.error||n.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_failed",{task:n.
task})):e.state!=="needs-you"&&(e.state="running",e.summary=o("work_in_progress")),cn(e,{kind:"agent",id:n.id,label:n.agent||
o("agent"),sessionKey:n.parent||e.sessionKey})}function No(e,n,o){e.issue||=n.status==="failed",n.status==="running"&&e.
state!=="needs-you"&&(e.state="running"),n.status==="failed"&&e.state!=="needs-you"&&(e.summary=o("workflow_failed",{name:n.
name})),cn(e,{kind:"workflow",id:n.run_id,label:n.name||n.run_id,sessionKey:n.session_key||e.sessionKey})}function Co(e,n){
if(n.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"dropped":return"\
done";case"in-progress":return"running";default:return null}}function Ao(e,n,o){return!(n.running||n.subagents_running||
n.orchestrating)?!1:e===o}function Io(e){let n=null,o=-1;for(let r of e){let i=r.last_touched_turn??0;i>o&&(o=i,n=r)}return n}function Wo(e,n){let o=e.next_steps?.find(i=>i.what?.trim())?.what?.trim();if(o)return o;let r=[...e.progress??[]].reverse().
find(i=>i.trim());return r?r.trim():e.initial_intent?.trim()||n("work_in_progress")}var Eo=3;function Po(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(n=>n.what??"")].join(" ")}function To(e,n){if(!n)return!1;
let o=n.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${o}\\b`,"u").test(e)}function Jn(e,n){if(e.length===
0)return[];let o=Po(n);return e.filter(r=>To(o,r.number)).map(r=>r.ref)}function Mo(e,n,o){if(!n?.enabled)return[];let r=n.
intents??[];if(r.length===0)return[];let i=it(e),c=[],d=Io(r),b=!!(e.running||e.subagents_running||e.orchestrating)?[]:r.
filter(s=>s.state==="in-progress");b.forEach(s=>{let p=r.indexOf(s),w=(s.next_steps??[]).filter(S=>S.what?.trim());c.push(
{id:`unattended:${e.key}:${p}`,title:ae(s.title,e.title||o("untitled_work")),summary:w[0]?.what?.trim()||o("no_next_step"),
state:"needs-you",issue:ie(e),updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:rn(e,o),
queuedBehind:e.queue_depth||void 0,changeBlocked:ie(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.key},...Jn(i,s)],nextSteps:w,progress:(s.progress??[]).filter(
S=>S.trim()),stale:!!n.stale,lastTouchedTurn:s.last_touched_turn??0})}),r.forEach((s,p)=>{if(b.includes(s))return;let w=Co(
s,e);if(!w)return;let S=(s.next_steps??[]).filter(v=>v.what?.trim());c.push({id:`intent:${e.key}:${p}`,title:ae(s.title,
e.title||o("untitled_work")),summary:Wo(s,o),state:w,issue:!1,updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.
key,provenance:rn(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:ie(e)||void 0,unverified:s.verified===!1||void 0,
action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.key},...Jn(i,s)],nextSteps:S,
progress:(s.progress??[]).filter(v=>v.trim()),stale:!!n.stale,lastTouchedTurn:s.last_touched_turn??0,moving:Ao(s,e,d)||void 0})});
let R=c.filter(s=>s.state==="needs-you"),C=c.filter(s=>s.state!=="needs-you").sort((s,p)=>(p.lastTouchedTurn??0)-(s.lastTouchedTurn??
0));return[...R,...C].slice(0,Math.max(Eo,R.length))}var $o=new Set(["crew-manager-conductor","overwatch-conductor"]),Bo={
approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,
stalled:50,change_blocked:40,merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Ko=3;
function Do(e,n){return e.updatedAt?Math.max(0,Math.floor((n-e.updatedAt)/36e5)):0}var Oe=5;function dt(e,n,o=Date.now()){
let r=gn(e),i=bt(e.filter(d=>d.state==="needs-you"),o),c=[`Fleet: ${r["needs-you"]} waiting on the user, ${r.running} in\
 progress, ${r.done} finished recently.`];return i.length===0?(c.push("Nothing is waiting on the user."),c):(c.push(`Wai\
ting on the user, in the order the list shows them (top ${Math.min(Oe,i.length)}):`),i.slice(0,Oe).forEach((d,g)=>{let b=_e(
de(d,o),n),R=d.sessionKey?` [session ${d.sessionKey}]`:"";c.push(`${g+1}. ${d.title} \u2014 ${d.summary} (${b})${R}`)}),
i.length>Oe&&c.push(`\u2026and ${i.length-Oe} more waiting.`),c)}var sn=new Set(["the","a","an","and","or","to","for","o\
f","in","on","at","is","it","this","that","with","from","into","be","do","so","as","by","fix","add","make","update","wor\
k","session","app","new","use","run","why","what","how","again","still","not"]),Qn=.6,Xn=2,ct=new Set;function an(e){return[
...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(n=>n.length>2&&!sn.has(n)))]}function Zn(e,n){
let o=an(e),r=an(n);if(o.length<Xn||r.length<Xn)return 0;let i=o.length<=r.length?o:r,c=new Set(o.length<=r.length?r:o);
return i.filter(g=>c.has(g)).length/i.length}function et(e){return e.references.filter(n=>n.kind==="change"||n.kind==="i\
ssue").map(n=>n.id)}function nt(e){return e.references.filter(n=>n.kind==="artifact").map(n=>n.id)}function tt(e){return(e.
nextSteps??[]).map(n=>n.what).filter(Boolean)}var Oo=new Set(["pull request","pull requests","status update","work in pr\
ogress","code review","follow up","next step","next steps","action item","action items","kiro crew","in progress","needs\
 you"]);function ln(e){let n=new Set,o=e.match(/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??[];for(let r of o){
let i=r.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean).map(c=>c.length>3&&c.endsWith("s")&&
!c.endsWith("ss")?c.slice(0,-1):c);for(;i.length&&sn.has(i[0]);)i.shift();for(;i.length&&sn.has(i[i.length-1]);)i.pop();
if(!(i.length<2))for(let c=i.length;c>=2;c-=1)for(let d=0;d+c<=i.length;d+=1){let g=i.slice(d,d+c).join(" ");Oo.has(g)||
n.add(g)}}return[...n]}function Lo(e){let n=new Set;if(e.length<zo)return n;let o=new Map;for(let r of e)for(let i of ln(
r.title))o.set(i,(o.get(i)??0)+1);for(let[r,i]of o)i/e.length>=qo&&n.add(r);return n}var zo=4,qo=.75;function ut(e,n,o=ct){
if(et(e).find(d=>et(n).includes(d)))return"same_change";if(nt(e).find(d=>nt(n).includes(d)))return"same_artifact";let c=ln(
n.title).filter(d=>!o.has(d));if(ln(e.title).some(d=>c.includes(d)))return"same_deliverable";if(Zn(e.title,n.title)>=Qn)
return"same_topic";for(let d of tt(e))for(let g of tt(n))if(Zn(d,g)>=Qn)return"same_step";return null}var pt={merged:[],
split:[]};function ot(e){return`${e.sessionKey??e.id}|${an(e.title).join(" ")}`}function gt(e,n){return[ot(e),ot(n)].sort().
join("")}function Fo(e,n=pt){let o=e.filter(i=>i.state!=="done"&&i.sessionKey).sort((i,c)=>(i.updatedAt||0)-(c.updatedAt||
0)),r=Lo(o);for(let i=1;i<o.length;i+=1){let c=o[i];for(let d=0;d<i;d+=1){let g=o[d];if(g.sessionKey===c.sessionKey||n.split.
includes(gt(c,g)))continue;let b=ut(c,g,r);if(b){c.duplicateOf={sessionKey:g.sessionKey,title:g.title,because:b};break}}}
jo(o,n,r)}var on=3,rt=["same_change","same_artifact","same_deliverable","same_topic","same_step"];function jo(e,n,o=ct){
for(let r of e){let i=[],c=new Set;for(let d of e){let g=d.sessionKey;if(g===r.sessionKey||c.has(g)||n.split.includes(gt(
r,d)))continue;let b=ut(r,d,o);b&&(c.add(g),i.push({sessionKey:g,title:d.title,because:b}))}i.length!==0&&(i.sort((d,g)=>rt.
indexOf(d.because)-rt.indexOf(g.because)),r.relatedSessions=i.slice(0,on),i.length>on&&(r.relatedMore=i.length-on))}}var Uo=3e4;
function ft(e,n,o=Date.now()){return Object.keys(n).length===0?e:e.map(r=>{let i=n[r.id];return!i||o-i>Uo||r.state==="ru\
nning"?r:{...r,state:"running",moving:!0,instructed:!0}})}function de(e,n=Date.now()){let o=[],r=(c,d,g=1)=>{o.push({signal:c,
weight:Bo[c]*g,values:d})};e.approvalKind==="subagent"?r("subagent_gate"):e.approvalKind==="tool"&&r("approval_owed"),e.
action==="reply"&&r("input_requested"),e.unverified&&r("unverified_completion"),e.loopRepeats&&r("error_loop",{repeats:String(
e.loopRepeats)}),e.changesRequested&&r("changes_requested"),e.runFailed&&r("run_failed"),e.stalledFor&&r("stalled",{duration:le(
e.stalledFor)}),e.assignedToYou&&r("assigned_to_you"),e.changeBlocked&&r("change_blocked"),e.mergeReady&&r("merge_ready"),
e.unattendedGoals&&r("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&r("queued_behind",{count:String(e.
queuedBehind)},Math.min(e.queuedBehind,3));let i=Do(e,n);return i>0&&r("waiting_a_while",{hours:String(i)},Math.min(i,Ko)),
o.sort((c,d)=>d.weight-c.weight),{score:o.reduce((c,d)=>c+d.weight,0),signals:o}}var Ho={approval_owed:"unblock",subagent_gate:"\
unblock",input_requested:"unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"un\
block",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"unblock",assigned_to_you:"followup",nobody_on_it:"\
followup"};function un(e,n=Date.now()){if(e.state!=="needs-you")return null;for(let o of de(e,n).signals){let r=Ho[o.signal];
if(r)return r}return null}var mt=14400*1e3;function wt(e,n,o,r=Date.now()){let i=0,c=[];for(let d of e){if(d.state!=="ne\
eds-you"){c.push(d);continue}let g=n[d.id];if(g&&g>r){i+=1;continue}let b=o[d.id];if(b!==void 0&&d.updatedAt<=b){c.push(
{...d,state:"done",issue:!1});continue}c.push(d)}return{items:c,snoozedCount:i}}var pn=4320*60*1e3;function ht(e,n=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:n-e.updatedAt<=pn}var Go={"needs-you":1,running:-1,done:-1};function Yo(e,n,o){
let r=e.updatedAt>0,i=n.updatedAt>0;return!r&&!i?0:r?i?(e.updatedAt-n.updatedAt)*o:-1:1}function _e(e,n){let o=e.signals.
slice(0,2);return o.length===0?n("rank_nothing_pressing"):o.map(i=>n(`rank_${i.signal}`,i.values)).join(n("rank_join"))}
function bt(e,n=Date.now()){let o=new Map(e.map(r=>[r.id,de(r,n)]));return[...e].sort((r,i)=>{let c=Gn[r.state]-Gn[i.state];
if(c!==0)return c;if(r.state==="needs-you"){let d=(o.get(i.id)?.score??0)-(o.get(r.id)?.score??0);if(d!==0)return d}else if(r.
issue!==i.issue)return r.issue?-1:1;return Yo(r,i,Go[r.state])})}function yt(e,n,o={},r={},i={},c=pt,d=Date.now()){let g=new Map,
b=new Map;for(let s of e.slots){if(!s.key||$o.has(s.key)||s.memory_mode==="incognito")continue;let p=Mo(s,o[s.key],n);if(p.
length>0){for(let v of p)g.set(v.id,v);let S=p.find(v=>v.state==="needs-you")??p[0];b.set(s.key,S);continue}let w=_o(s,n);
g.set(w.id,w),b.set(s.key,w)}if(e.assigned?.length){let s=new Map;for(let f of g.values())for(let k of f.references)(k.kind===
"change"||k.kind==="issue")&&k.url&&!s.has(k.url)&&s.set(k.url,f);let p={changes_requested:0,conflict:1,checks_failing:2,
ready_to_merge:3,assigned:4},w=new Map;for(let f of e.assigned){if(!f?.url||s.has(f.url)||!(f.status in p))continue;let k=w.
get(f.status);k?k.push(f):w.set(f.status,[f])}let S=[...w.entries()].sort((f,k)=>(p[f[0]]??9)-(p[k[0]]??9)).map(f=>f[1]),
v=[];for(let f=0;v.length<Hn;f+=1){let k=!1;for(let E of S){if(v.length>=Hn)break;let T=E[f];T&&(v.push(T),k=!0)}if(!k)break}
let N=new Set(v.map(f=>f.url));for(let f of e.assigned){if(!f?.url||!s.has(f.url)&&!N.has(f.url))continue;let k=f.kind===
"issue"?"issue":"pull",E=f.status==="conflict"||f.status==="checks_failing",T=f.status==="changes_requested",y=f.status===
"ready_to_merge",z=k==="issue",B=s.get(f.url);if(B){B.owned=k,E&&(B.changeBlocked=!0,B.issue=!0),T&&(B.changesRequested=
!0),y&&(B.mergeReady=!0),(E||T||y)&&B.state==="done"&&(B.state="needs-you");continue}let oe=E||T||y||z,ue=k==="issue"?"o\
wned_issue_assigned":f.status==="conflict"?"owned_pull_conflict":f.status==="checks_failing"?"owned_pull_failing":f.status===
"changes_requested"?"owned_pull_changes_requested":f.status==="ready_to_merge"?"owned_pull_merge_ready":f.status==="chec\
ks_running"?"owned_pull_checks_running":"owned_pull_awaiting_review",I=k==="issue"?`issue #${f.number}`:`#${f.number}`;g.
set(`owned:${f.url}`,{id:`owned:${f.url}`,title:f.title||I,summary:n(ue,{count:String(f.status==="checks_failing"?f.failing:
f.pending)}),state:oe?"needs-you":"running",issue:E,updatedAt:M(f.updated_at),provenance:n("owned_provenance",{repo:f.repo}),
references:[{kind:k==="issue"?"issue":"change",id:f.url,label:`${f.repo} ${I}`,url:f.url,status:f.status==="awaiting_rev\
iew"?void 0:f.status.replace(/_/g," ")}],action:void 0,owned:k,changeBlocked:E||void 0,changesRequested:T||void 0,mergeReady:y||
void 0,assignedToYou:z||void 0})}}for(let[s,p]of Object.entries(r)){let w=b.get(s);w&&(w.state="needs-you",w.issue=!0,w.
stalledFor=p.silent_secs,w.summary=p.reason?n("stalled_because",{reason:p.reason,duration:le(p.silent_secs)}):n("stalled\
_for",{duration:le(p.silent_secs)}),w.action="open")}for(let[s,p]of Object.entries(i)){let w=b.get(s);w&&(w.state="needs\
-you",w.issue=!0,w.loopRepeats=p.repeats,w.summary=n("error_loop",{tool:p.tool,repeats:String(p.repeats)}),w.action="ope\
n")}for(let s of e.approvals){let p=s.slot?b.get(s.slot):void 0;if(p){So(p,s,n);continue}g.set(`approval:${s.id}`,{id:`a\
pproval:${s.id}`,title:ae(s.tool||s.source,n("approval_needed")),summary:s.tool_purpose||n("tool_call_waiting"),state:"n\
eeds-you",issue:!1,updatedAt:M(s.ts),provenance:n("approval"),action:"review-approval",approvalKind:lt(s)?"subagent":"to\
ol",permissionId:s.id,permissionTool:s.tool||s.source,permissionPurpose:s.tool_purpose,permissionInput:s.tool_input,references:[
{kind:"approval",id:s.id,label:s.tool||s.source||n("approval")}]})}for(let s of e.agents){let p=s.parent?b.get(s.parent):
void 0;if(p){Ro(p,s,n);continue}let w=!!(s.done&&(s.error||s.outcome==="failed"));s.parent&&!w||g.set(`agent:${s.id}`,{id:`\
agent:${s.id}`,title:ae(s.task||s.agent,n("agent_work")),summary:w?s.error?.trim()||n("agent_failed",{task:s.task}):s.done?
n("agent_done"):n("work_in_progress"),state:w?"needs-you":s.done?"done":"running",issue:w,runFailed:w||void 0,retryPath:w&&
!s.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(s.id)}/retry`:void 0,updatedAt:M(s.started),provenance:s.agent||
n("agent"),action:"discuss",references:[{kind:"agent",id:s.id,label:s.agent||n("agent")}]})}for(let s of e.workflows){let p=s.
session_key?b.get(s.session_key):void 0;if(p){No(p,s,n);continue}let w=s.status==="failed";g.set(`workflow:${s.run_id}`,
{id:`workflow:${s.run_id}`,title:ae(s.name,s.run_id),summary:w?n("workflow_failed_generic"):s.status==="running"?n("work\
flow_running"):n("workflow_finished"),state:w?"needs-you":s.status==="running"?"running":"done",issue:w,runFailed:w||void 0,
retryPath:w?`/api/workflows/runs/${encodeURIComponent(s.run_id)}/rerun`:void 0,updatedAt:0,provenance:n("workflow"),action:"\
discuss",references:[{kind:"workflow",id:s.run_id,label:s.name||s.run_id}]})}for(let s of e.crons){if(!s.is_running&&s.last_status!==
"error")continue;let p=s.last_status==="error",w=fo(s,d),S=n(p?"monitor_failed":"monitor_running");g.set(`monitor:${s.id}`,
{id:`monitor:${s.id}`,title:s.name,summary:w?`${S} ${n("monitor_next_check",{duration:w})}`:S,state:p?"needs-you":"runni\
ng",issue:p,runFailed:p||void 0,retryPath:p?`/api/crons/${encodeURIComponent(s.id)}/run`:void 0,updatedAt:M(s.running_since||
s.last_run_ts||s.created_ts),provenance:n("monitor"),action:p?"discuss":void 0,references:[{kind:"monitor",id:s.id,label:s.
name}]})}for(let s of e.loops||[]){if(!s.active)continue;let p=String(s.id||"");if(!p)continue;let w=Math.max(0,Number(s.
cycle_count)||0),S=Math.max(0,Number(s.max_cycles)||0),v=s.slot_key&&b.has(s.slot_key)?s.slot_key:void 0;g.set(`loop:${p}`,
{id:`loop:${p}`,title:ae(s.message||"",n("loop")),summary:S?n("loop_watching_capped",{cycles:String(w),cap:String(S)}):n(
"loop_watching",{cycles:String(w)}),state:"running",issue:!1,updatedAt:M(s.last_fire_ts||s.created_ts),sessionKey:v,parentId:v?
b.get(v)?.id:void 0,provenance:n("loop"),stopPath:`/api/autonudge/${encodeURIComponent(p)}`,action:v?"open":void 0,references:[
{kind:"monitor",id:p,label:n("loop"),sessionKey:v},...v?[{kind:"session",id:v,label:b.get(v)?.title||v,sessionKey:v}]:[]]})}
let R=[...e.artifacts].sort((s,p)=>M(p.updated_at)-M(s.updated_at)).slice(0,8);for(let s of R){let p=s.session_key&&b.has(
s.session_key)?s.session_key:void 0;g.set(`artifact:${s.slug}`,{id:`artifact:${s.slug}`,title:ae(s.name,n("artifact")),summary:s.
description||n("artifact_ready",{kind:s.kind}),state:"done",issue:!1,updatedAt:M(s.updated_at||s.created_at),sessionKey:p,
parentId:p?b.get(p)?.id:void 0,provenance:s.session_title||s.source||n("artifact"),action:p?"open":void 0,references:[{kind:"\
artifact",id:s.slug,label:s.name,sessionKey:p},...p?[{kind:"session",id:p,label:s.session_title||p,sessionKey:p}]:[]]})}
let C=[...g.values()];return Fo(C,c),bt(C)}function gn(e){return{all:e.length,"needs-you":e.filter(n=>n.state==="needs-y\
ou").length,running:e.filter(n=>n.state==="running").length,done:e.filter(n=>n.state==="done").length}}function vt(e){let n=[],o=new Map;for(let r of e){let i=r.sessionKey;if(!i){n.push({key:r.id,items:[r],header:null,sessionKey:null});
continue}let c=o.get(i);if(c){c.items.push(r);continue}let d={key:i,items:[r],header:"session",sessionKey:r.sessionKey??
null};o.set(i,d),n.push(d)}return n}function fn(e){let n=new Set,o=new Set,r=new Set,i=0,c=0,d=0,g=0,b=0;for(let R of e){
R.sessionKey&&n.add(R.sessionKey);for(let C of R.references)C.kind==="change"?o.add(C.id):C.kind==="issue"&&r.add(C.id);
R.id.startsWith("workflow:")?i+=1:R.id.startsWith("monitor:")?c+=1:R.id.startsWith("agent:")&&(d+=1),R.state==="needs-yo\
u"&&(g+=1),R.updatedAt>b&&(b=R.updatedAt)}return{sessions:n.size,prs:o.size,issues:r.size,loops:i,crons:c,agents:d,needsYou:g,
lastActivityAt:b}}var Vo=12;function wn(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Jo(e,n=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let o=mn(e);return o===0?!0:n-o<=pn}function kt(e,n,o=Date.
now(),r=()=>!1){return e.filter(i=>i.key&&i.key!==n&&i.memory_mode!=="incognito").filter(i=>Jo(i,o)).filter(i=>!r(i)).sort(
(i,c)=>mn(c)-mn(i)).slice(0,Vo)}function mn(e){let n=e.last_ts??e.last_activity_ts??e.created;if(typeof n=="number")return n>
1e10?n:n*1e3;if(!n)return 0;let o=Date.parse(n);return Number.isFinite(o)?o:0}async function xt(e,n){let o={},r="unknown";
for(let i of e)try{let c=await n(`/api/chat/slots/${encodeURIComponent(i.key)}/summary`);if(!c||typeof c!="object"){r="u\
nsupported";break}if(c.enabled===!1){r="disabled";break}o[i.key]=c,r="available"}catch{r="unsupported";break}return{summaries:o,
support:r}}var _t=String.raw`
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
    grid-template-columns: var(--ow-work-w, minmax(0, 1fr)) 6px minmax(0, 1fr);
    gap: 12px;
    padding: 16px;
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
    background: var(--border);
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
  /* Hugs its text like the "N need you" count pill so the two read as one
     family; sentence-case labels make a fixed alignment width pointless. */
  .ow-verb { flex: none; font-size: 11px; }
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
  .ow-row-actions { display: flex; flex-shrink: 0; align-self: center; align-items: center; gap: 4px; }
  .ow-primary-action { flex-shrink: 0; }
  .ow-icon { width: 14px; height: 14px; flex-shrink: 0; }
  /* Sizing only. The resizer hairline to its left is the divider now, so the
     column carries no border-left of its own. */
  .ow-conductor {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background: var(--bg);
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
  /* Group by — vertical in the rail: label, then the two modes stacked. */
  .ow-groupby { display: flex; flex-direction: column; gap: 4px; }
  .ow-groupby-label { color: var(--muted); font-size: 12px; }
  .ow-groupby-opt { width: 100%; justify-content: center; padding: 4px 12px; font-size: 12px; }
  .ow-groupby-opt[data-selected='true'] {
    border-color: var(--accent);
    background: var(--aim-subtle);
    color: var(--accent);
  }
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
  /* A jump-link, not a title: quieter and smaller than the PR name above it,
     matching the goal card's secondary text rather than inheriting the 14px base. */
  .ow-pr-session-chip .ow-icon { width: 13px; height: 13px; }
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
  .ow-goalcard-title { flex: 1; min-width: 0; overflow: hidden; color: var(--text-strong); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: none; }
  .ow-goalcard .ow-block-open { flex: none; margin: 0; }
  .ow-goal-flag {
    flex: none; margin-left: auto; padding: 1px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
    color: var(--muted); background: var(--bg-hover); border: 1px solid var(--border);
  }
  .ow-goal-flag-warn { color: var(--warn); background: var(--warn-subtle, rgba(251,191,36,.12)); border-color: transparent; }
  .ow-goal-meta { margin: 4px 0 0 26px; color: var(--muted); font-size: 11px; }
  /* Why the merge happened. Subdued below the meta: it answers a question the
     user only asks when the grouping looks wrong, so it must not compete with
     the goal's own name or its composition. */
  /* Member rows: indent under the title, a divider between them, lighter label. */
  .ow-goalcard .ow-row { padding: 7px 4px 7px 26px; }
  .ow-goalcard .ow-row + .ow-row { border-top: 1px solid var(--border); }
  .ow-goalcard .ow-row-title { color: var(--text); font-weight: 500; }
  .ow-goalcard .ow-row-actions .ow-icon { transition: transform 0.15s ease; }
  .ow-goalcard .ow-row[data-selected='true'] .ow-row-actions .ow-icon { transform: rotate(90deg); }
  .ow-goalcard .ow-row[data-selected='true'] .ow-row-title { color: var(--text-strong); font-weight: 700; }
  .ow-goalcard .ow-goal-digest { border-top: 0; padding: 8px 0 0 26px; }
  /* Status dot on a goal member row (mockup goal-item language). */
  .ow-goal-tab .ow-block-open { flex: none; }
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
    .ow-conductor { min-height: 560px; border-left: 0; border-top: 1px solid var(--border); }
  }
`;import{Fragment as Fe,jsx as a,jsxs as m}from"react/jsx-runtime";var Se=["work","loops","schedule"],Nt=["loops","schedul\
e","work"],zt={work:"Sessions",loops:"Loops",schedule:"Scheduled tasks"};function hn({id:e,onPromote:n}){return a(O,{className:"\
ow-promote","aria-label":`Move ${zt[e]} to the first column`,onClick:o=>{o.preventDefault(),o.stopPropagation(),n(e)},children:"\
Make primary"})}function bn({lastUpdated:e,refreshing:n,onRefresh:o}){let r=e?Rn(e):null;return m("span",{className:"ow-\
refreshbar",children:[r&&m("span",{className:"ow-updated","aria-live":"polite",children:["updated ",r]}),a(O,{className:"\
ow-refresh",onClick:i=>{i.preventDefault(),i.stopPropagation(),o()},disabled:n,"aria-label":"Refresh",title:"Refresh",children:a(
er,{className:`ow-icon${n?" ow-spin":""}`,"aria-hidden":"true"})})]})}var yn="crew-manager.snoozed",Ct="crew-manager.han\
dled",At="crew-manager.done-collapsed",It="crew-manager.card-collapsed",vn="crew-manager.stack-open-v2",kn="crew-manager\
.primary-v1";function ne(e,n={}){try{let o=localStorage.getItem(e);return o?JSON.parse(o):n}catch{return n}}function J(e,n){
try{localStorage.setItem(e,JSON.stringify(n))}catch{}}function Rn(e,n=Date.now()){if(!e)return null;let o=Math.max(0,Math.
round((n-e)/1e3));if(o<60)return"just now";let r=Math.round(o/60);if(r<60)return`${r}m ago`;let i=Math.round(r/60);return i<
24?`${i}h ago`:`${Math.round(i/24)}d ago`}function Wt(e){return e?new Date(e).toLocaleTimeString([],{hour:"numeric",minute:"\
2-digit"}):""}function we(e,n,o){return e<=0?null:`${e} ${e===1?n:o}`}function cr(e,n=Date.now(),o=!1){let r=fn(e),i=[o?
null:we(r.sessions,"session","sessions"),we(r.prs,"PR","PRs"),we(r.issues,"issue","issues"),we(r.loops,"loop","loops"),we(
r.crons,"cron","crons"),we(r.agents,"agent","agents")].filter(d=>!!d),c=Rn(r.lastActivityAt,n);return c&&i.push(`last ac\
tive ${c}`),i.join(" \xB7 ")}var ce="crew-manager-conductor",ur=5e3,pr={session:"Session",approval:"Approval",agent:"Age\
nt",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"\
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
{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work"};function Q(e,n={}){return pr[e].
replace(/\{\{(\w+)\}\}/g,(o,r)=>n[r]??"")}var gr={followup:"Follow up",unblock:"Unblock"},ze={"needs-you":"Needs you",running:"\
Running",done:"Done"},xn={all:"All","needs-you":"Needs you",running:"Running",done:"Done"},fr={session:Ot,approval:$t,agent:Qo,
workflow:rr,monitor:Lt,artifact:Xo,change:Zo,issue:or};function Ne({children:e,onActivate:n,...o}){return a("div",{...o,
role:"button",tabIndex:0,onClick:n,onKeyDown:r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),n())},children:e})}
function Et({label:e,count:n,subtitle:o}){return m("div",{className:"ow-section-header",children:[m("div",{className:"ow\
-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow-section-count",children:n})]}),
o&&a("p",{className:"ow-section-subtitle",children:o})]})}function mr(e){if(e.state==="needs-you"){let n=un(e);return n?
a(D,{variant:"warn",className:"ow-verb",children:gr[n]}):null}return e.state==="running"?e.moving?m(D,{variant:"aim",children:[
a(Dt,{className:"ow-icon"}),ze[e.state]]}):a(D,{variant:"muted",children:"Queued"}):m(D,{variant:"ok",children:[a(Kt,{className:"\
ow-icon"}),ze[e.state]]})}function wr({tool:e,purpose:n,busy:o,onAnswer:r,where:i}){return m("div",{className:"ow-permis\
sion",children:[m("div",{className:"ow-permission-body",children:[m("div",{className:"ow-permission-head",children:[a(nr,
{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permiss\
ion"})]}),m("p",{className:"ow-permission-what",children:[i&&m("span",{className:"ow-truncate",children:[i," "]}),i?"wan\
ts to run ":"Wants to run ",a("code",{children:e})]}),n&&a("p",{className:"ow-permission-why",children:n})]}),m("div",{className:"\
ow-permission-actions",children:[a(O,{onClick:()=>r(!0),disabled:o,children:"Approve"}),a(O,{onClick:()=>r(!1),disabled:o,
children:"Reject"})]})]})}function Re({children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"o\
w-expand-inner",children:e})})}var _n=3;function Pt(e){let n=e.provenance.trim().toLowerCase();return e.references.filter(
o=>o.label.trim().toLowerCase()!==n)}function hr({item:e,busy:n,onDecide:o}){let[r,i]=_(!1),c=e.permissionInput||"",d=c.
trim().split(/\s+/)[0]||e.permissionTool||"";return m("div",{className:"ow-formal-approval",role:"presentation",onClick:g=>g.
stopPropagation(),onKeyDown:g=>g.stopPropagation(),children:[a("div",{className:"ow-formal-badge",children:"Waiting for \
approval"}),m("div",{className:"ow-formal-detail",children:[e.permissionPurpose&&m("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:"__tool_use_purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),
m("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("s\
pan",{className:"ow-formal-val ow-formal-mono",children:c||"(no input details)"})]})]}),m("div",{className:"ow-formal-ac\
tions",children:[a(O,{disabled:n,onClick:()=>o("approved"),children:"Allow once"}),m("span",{className:"ow-trust-wrap",children:[
m(O,{disabled:n,onClick:()=>i(g=>!g),"aria-expanded":r,children:["Trust ",a(te,{className:"ow-icon ow-trust-caret","data\
-open":r?"true":void 0,"aria-hidden":"true"})]}),r&&m("span",{className:"ow-trust-menu",role:"menu",children:[c&&a("butt\
on",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:n,onClick:()=>{i(!1),o("trust_command")},children:"\
Trust this exact command"}),d&&m("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:n,onClick:()=>{
i(!1),o("trust_base")},children:["Trust \u201C",d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:n,onClick:()=>{i(!1),o("trust")},children:"Trust everything in this session"})]})]}),a(O,{className:"\
ow-formal-reject",disabled:n,onClick:()=>o("rejected"),children:"Reject"})]})]})}function br({item:e,items:n,folded:o,onToggle:r,
onOpen:i}){let d=e.references.find(s=>s.kind==="session")?.label??e.provenance,g=fn(n),b=g.needsYou>0?"needs-you":n.some(
s=>s.state==="running")?"running":"done",R=g.needsYou>0?o?`${g.needsYou} need you`:null:ze[b],C=cr(n,Date.now(),!0);return m(
Fe,{children:[m("div",{className:"ow-goalcard-summary",children:[r&&a("button",{type:"button",className:"ow-goalcard-che\
vron","aria-expanded":!o,"aria-label":`${o?"Expand":"Collapse"} ${d}`,onClick:r,children:a(te,{className:"ow-icon ow-ini\
t-chevron","data-open":o?void 0:"true","aria-hidden":"true"})}),m("span",{className:"ow-goalcard-header ow-goalcard-stat\
ic",children:[a(Ot,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name ow-goalcar\
d-title",children:d})]}),a(O,{className:"ow-block-open",onClick:i,"aria-label":`Open ${d}`,children:"Open"}),R&&a("span",
{className:`ow-goal-flag${g.needsYou>0?" ow-goal-flag-warn":""}`,children:R})]}),C&&a("div",{className:"ow-goal-meta",children:C})]})}
function yr({reference:e,onOpenSession:n}){let o=fr[e.kind],r=m(Fe,{children:[a(o,{className:"ow-icon"}),a("span",{className:"\
ow-truncate",children:e.label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_bl\
ank",rel:"noopener noreferrer",onClick:i=>i.stopPropagation(),children:r}):e.sessionKey?a(Ne,{className:"ow-reference ow\
-reference-link",onActivate:()=>n(e.sessionKey),children:r}):a("span",{className:"ow-reference",children:r})}function qt({
item:e,selected:n,continuation:o,whyRanked:r,onSelect:i,onOpenSession:c,onAnswerPermission:d,permissionBusy:g,onRetry:b,
retryBusy:R,onStop:C,stopBusy:s,onPickStep:p,onSnooze:w,onHandled:S,hideBadge:v,compact:N,headless:f,onDecideApproval:k}){
let[E,T]=_(!1);return m(Ne,{onActivate:i,className:"ow-row","aria-pressed":n,"data-selected":n,"data-instructed":e.instructed?
"true":void 0,"data-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[m("div",{className:"ow-row\
-layout",children:[m("div",{className:"ow-row-content",children:[!f&&m("div",{className:"ow-row-heading",children:[v?e.state===
"done"&&a(Bt,{className:"ow-icon ow-row-check","aria-hidden":"true"}):mr(e),a("span",{className:"ow-row-title",children:e.
title})]}),(!N||n)&&e.summary&&!(e.nextSteps??[]).some(y=>y.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",
children:e.summary}),e.duplicateOf&&m(Ne,{className:"ow-row-duplicate",onActivate:()=>c(e.duplicateOf.sessionKey),children:[
a(Sn,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:Q(`duplicate_${e.duplicateOf.
because}`,{title:e.duplicateOf.title})})]}),n&&e.relatedSessions&&e.relatedSessions.length>0&&a(Re,{children:m("div",{className:"\
ow-related",children:[a("span",{className:"ow-related-label",children:Q("related_sessions",{count:String(e.relatedSessions.
length)})}),e.relatedSessions.map(y=>m(Ne,{className:"ow-related-row",onActivate:()=>c(y.sessionKey),children:[a(Sn,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:y.title}),a("span",{className:"ow-related-why",
children:Q(`related_${y.because}`)})]},y.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:Q("re\
lated_more",{count:String(e.relatedMore)})}):null]})}),r&&a("div",{className:"ow-row-why",children:r}),!o&&m("div",{className:"\
ow-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),Pt(e).length>0&&a("span",{"aria-hidden":"\
true",children:"\xB7"}),a("span",{className:"ow-references",children:Pt(e).slice(0,3).map(y=>a(yr,{reference:y,onOpenSession:c},
`${y.kind}:${y.id}`))})]})]}),a("div",{className:"ow-row-actions",children:a(te,{className:"ow-icon","aria-hidden":"true"})})]}),
n&&p&&e.nextSteps&&e.nextSteps.length>0&&a(Re,{children:m("div",{className:"ow-row-steps",children:[a("div",{className:"\
ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,E?void 0:_n).map((y,z)=>a("button",{type:"button",className:"\
ow-quote-step",title:y.why??y.what,onClick:B=>{B.stopPropagation(),p(y.what)},children:y.what},`${z}:${y.what}`)),e.nextSteps.
length>_n&&a("button",{type:"button",className:"ow-steps-more",onClick:y=>{y.stopPropagation(),T(z=>!z)},children:E?"Sho\
w fewer":`+${e.nextSteps.length-_n} more`})]})}),n&&e.retryPath&&b&&a(Re,{children:a("div",{className:"ow-retry",children:a(
O,{onClick:()=>b(e.retryPath),disabled:!!R,children:"Retry"})})}),n&&e.stopPath&&C&&a(Re,{children:a("div",{className:"o\
w-retry",children:a(O,{onClick:()=>C(e.stopPath),disabled:!!s,children:s?"Stopping\u2026":"Stop this loop"})})}),n&&e.permissionId&&
k&&a(Re,{children:a(hr,{item:e,busy:!!g,onDecide:y=>k(e,y)})}),e.state==="needs-you"&&w&&S&&m("div",{className:"ow-row-a\
side",children:[a("button",{type:"button",className:"ow-aside-btn",onClick:y=>{y.stopPropagation(),w(e.id)},children:"La\
ter"}),a("button",{type:"button",className:"ow-aside-btn",onClick:y=>{y.stopPropagation(),S(e.id,e.updatedAt)},children:"\
Handled"})]})]})}var vr=["unblock","followup","running","done"],kr={unblock:{label:"Unblock",cls:"ow-lane-unblock"},followup:{
label:"Follow up",cls:"ow-lane-followup"}};function xr(e){return e.state==="done"?"done":e.state==="running"?"running":un(
e)??"unblock"}function _r({items:e,selectedId:n,onSelect:o,onOpenSession:r,onAnswerPermission:i,onDecideApproval:c,permissionBusy:d,
onRetry:g,retryBusy:b,onPickStep:R,onSnooze:C,onHandled:s,doneTitles:p}){let[w,S]=_(!1),v=new Map;for(let N of e){let f=xr(
N),k=v.get(f);k?k.push(N):v.set(f,[N])}return m(Fe,{children:[vr.filter(N=>v.has(N)).map(N=>{let f=v.get(N),k=N==="unblo\
ck"||N==="followup"?kr[N]:null,E=k?f.map(y=>y.action!=="resume"?_e(de(y),Q):""):[],T=k&&E.length>0&&E.every(y=>y&&y===E[0])?
E[0]:void 0;return m("div",{className:"ow-lane",children:[k&&m("div",{className:"ow-lane-head",children:[a("span",{className:`\
ow-lane-badge ${k.cls}`,children:k.label}),T&&a("span",{className:"ow-lane-reason",children:T})]}),f.map(y=>a(qt,{item:y,
hideBadge:!0,compact:!0,selected:n===y.id,continuation:!0,whyRanked:T?void 0:y.state==="needs-you"&&y.action!=="resume"?
_e(de(y),Q):void 0,onSelect:()=>o(y),onOpenSession:r,onAnswerPermission:i,onDecideApproval:c,permissionBusy:d,onRetry:g,
retryBusy:b,onPickStep:R,onSnooze:C,onHandled:s},y.id))]},N)}),!v.has("done")&&p&&p.length>0&&m("div",{className:"ow-lan\
e ow-lane-done",children:[m("button",{type:"button",className:"ow-goals-toggle","aria-expanded":w,onClick:()=>S(N=>!N),children:[
a(te,{className:"ow-icon","data-open":w?"true":void 0,"aria-hidden":"true"}),p.length," done"]}),w&&a("ul",{className:"o\
w-done-list",children:p.map(N=>m("li",{className:"ow-row-goal-done",children:[a(Bt,{className:"ow-icon","aria-hidden":"t\
rue"}),a("span",{className:"ow-truncate",children:N})]},N))})]})]})}function Le({title:e,items:n,selectedId:o,onSelect:r,
onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,permissionBusy:g,onRetry:b,retryBusy:R,onStop:C,stopBusy:s,onPickStep:p,
onSnooze:w,onHandled:S,footer:v,collapsed:N,onToggleCollapsed:f,doneBySession:k,collapsedCards:E,onToggleCard:T,subtitle:y,
hideHeader:z,emptyLabel:B}){let oe=vt(n),ue=I=>{let re=I.header==="session"?!!E?.[I.key]:!1;return m("div",{className:`o\
w-block${I.header==="session"?" ow-goalcard":""}`,"data-grouped":I.header?"true":void 0,"data-open":I.header==="session"&&
!re?"true":void 0,children:[I.header==="session"&&I.sessionKey&&a(br,{item:I.items[0],items:I.items,folded:re,onToggle:T?
()=>T(I.key,!re):void 0,onOpen:()=>i(I.sessionKey)}),I.header==="session"?!re&&a(_r,{items:I.items,doneTitles:I.sessionKey?
k?.[I.sessionKey]:void 0,selectedId:o,onSelect:r,onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,permissionBusy:g,
onRetry:b,retryBusy:R,onPickStep:p,onSnooze:w,onHandled:S}):I.items.map(q=>a(qt,{item:q,selected:o===q.id,whyRanked:q.state===
"needs-you"&&q.action!=="resume"?_e(de(q),Q):void 0,onSelect:()=>r(q),onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,
permissionBusy:g,onRetry:b,retryBusy:R,onStop:C,stopBusy:s,onPickStep:p,onSnooze:w,onHandled:S},q.id))]},I.key)};return m(
"section",{className:"ow-section","aria-label":e,children:[z?null:f?m(Ne,{onActivate:f,className:"ow-section-toggle",children:[
a(Et,{label:e,count:n.length,subtitle:y}),a(te,{className:"ow-icon ow-section-chevron","data-open":N?void 0:"true","aria\
-hidden":"true"})]}):a(Et,{label:e,count:n.length,subtitle:y}),N?null:a("div",{className:"ow-section-list",children:oe.length===
0?a("p",{className:"ow-section-empty",children:B}):oe.map(ue)}),v]})}function Sr(e,n,o=[]){let r=dt(n,Q),i=o.length?[`No\
ticed since you last spoke (${o.length}):`,...o.map(g=>`- ${g}`),"Mention these only if they matter to what the user ask\
ed."]:[];if(!e)return["Crew Manager context: workspace overview.",...r,...i,"Answer the user about the state of their wo\
rk. This is a conversation, not an action channel."].join(`
`);let c=e.references.map(g=>`${g.kind}: ${g.label} (${g.id})`).join(`
`),d=[e.stalledFor?`Silent for ${le(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(g=>!!g);return[`Crew Manager context: ${e.title}`,...r,`Selected item: ${e.title}`,
`State: ${ze[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...d.length>0?[`Why it is on the board:
${d.join(`
`)}`]:[],`References:
${c}`,...i,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(g=>!!g).join(`
`)}var Tt="crew-manager.panel-widths";function Rr(e,n){let o=e?.first_seen;if(!o)return[];let r=typeof n=="number"?n<=1e10?
n*1e3:n:n?Date.parse(n):NaN;if(!Number.isFinite(r))return[];let i=[];for(let d of e?.stalls??[]){let g=o[d.key];typeof g==
"number"&&(g*1e3<=r||i.push(d.reason?`${d.label} went quiet \u2014 ${d.reason}`:`${d.label} went quiet after ${le(d.silent_secs)}`))}
for(let d of e?.error_loops??[]){let g=o[d.key];typeof g=="number"&&(g*1e3<=r||i.push(`${d.label} repeated the same ${d.
tool} failure ${d.repeats} times`))}let c=5;return i.length>c?[...i.slice(0,c),`and ${i.length-c} more`]:i}var H={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function qe(e,n,o,r,i){let c=Math.min(i,Math.max(o,n-
r));return Math.max(o,Math.min(c,e))}function Mt({side:e,containerRef:n,min:o,reserve:r,max:i,value:c,onChange:d,label:g}){
let b=(s,p)=>{let w=p.getBoundingClientRect(),S=e==="start"?s-w.left:w.right-s;return qe(S,p.clientWidth,o,r,i)};return a(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":g,tabIndex:0,onPointerDown:s=>{
let p=n.current;if(!p)return;s.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let w=v=>d(b(v.clientX,p)),S=()=>{window.removeEventListener("pointermove",w),window.removeEventListener("pointeru\
p",S),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",w),window.addEventListener(
"pointerup",S)},onKeyDown:s=>{if(s.key!=="ArrowLeft"&&s.key!=="ArrowRight")return;let p=n.current;if(!p)return;s.preventDefault();
let w=(s.shiftKey?48:16)*(s.key==="ArrowRight"?1:-1),S=c??(e==="start"?p.clientWidth/2:Math.round(p.clientWidth*.3));d(qe(
S+(e==="start"?w:-w),p.clientWidth,o,r,i))}})}function Nr(){let e=sr(),n=U(e);n.current=e;let o=ar(),r=ir(),[i,c]=_("all"),
[d,g]=_(()=>{let t=ne(kn,null);return t&&Se.includes(t)?t:"work"}),[b,R]=_(()=>{let t=ne(vn,null)??"loops",l=Se.includes(
t)?t:"loops",u=ne(kn,null),h=u&&Se.includes(u)?u:"work";return l===h?Nt.find(x=>x!==h)??null:l}),C=K(t=>{R(l=>{let u=l===
t?null:t;return J(vn,u),u})},[]),[s,p]=_(null),[w,S]=_("session"),[v,N]=_(null),[f,k]=_(null),[E,T]=_({}),[y,z]=_("unkno\
wn"),B=U("unknown"),oe=U(new Map),[ue,I]=_({}),[re,q]=_(null),[Nn,Ft]=_({}),[Cn,jt]=_([]),[G,Ce]=_(null),[pe,An]=_(null),
[ge,In]=_(null),[Wn,En]=_(()=>ne(yn)),[Pn,Ut]=_(()=>ne(Ct)),je=U(null),Ue=U(null),[X,He]=_(()=>ne(Tt,{work:null,conductor:null}));
j(()=>{J(Tt,X)},[X]),j(()=>{let t=()=>He(l=>{let u=Ue.current?.clientWidth??0,h=je.current?.clientWidth??0;return{work:l.
work==null||u===0?l.work:qe(l.work,u,H.workMin,H.railReserve,1/0),conductor:l.conductor==null||h===0?l.conductor:qe(l.conductor,
h,H.conductorMin,H.mainReserve,H.conductorMax)}});return t(),window.addEventListener("resize",t),()=>window.removeEventListener(
"resize",t)},[]);let[Ae,Ht]=_(()=>ne(It)),[Gt,Yt]=_(()=>ne(At,null)??!0),[Tn,Mn]=_({}),[$n,Ge]=_([]),[Ye,Vt]=_([]),[Jt,Ve]=_(
!1),he=K(t=>{if(t===d)return;let l=b===t?Nt.find(u=>u!==t)??null:b;J(kn,t),J(vn,l),g(t),R(l)},[d,b]),Qt=K((t,l)=>{t.dataTransfer.
setData("text/x-crew-panel",l),t.dataTransfer.effectAllowed="move";let u=t.currentTarget.querySelector("summary");if(!u)
return;let h=u.getBoundingClientRect();t.dataTransfer.setDragImage(u,Math.min(Math.max(t.clientX-h.left,0),h.width),Math.
min(Math.max(t.clientY-h.top,0),h.height))},[]),Xt=K(t=>{t.preventDefault(),Ve(!1);let l=t.dataTransfer.getData("text/x-\
crew-panel");!l||!Se.includes(l)||he(l)},[he]),Bn=L(()=>Se.filter(t=>t!==d),[d]),Zt=b&&b!==d?String(Bn.indexOf(b)):"none",
Je=t=>{let l=t===d;return{className:"ow-card ow-stack-card",open:l||b===t,draggable:!0,"data-panel":t,"data-primary":l?"\
true":"false","data-rail-index":l?void 0:Bn.indexOf(t),"data-dragover":l&&Jt?"true":void 0,onDragStart:u=>Qt(u,t),onDragOver:l?
u=>{u.preventDefault(),Ve(!0)}:void 0,onDragLeave:l?()=>Ve(!1):void 0,onDrop:l?Xt:void 0}},Kn=U(!0),[eo,Dn]=_(!0),[On,Qe]=_(
null),[Xe,no]=_(null),[be,Ln]=_(!1),[to,oo]=_(!1),[zn,Y]=_(null),P=U(!0),ye=U(0),Ze=U(!1);j(()=>(P.current=!0,()=>{P.current=
!1,ye.current+=1}),[]);let A=K(async()=>{let t=++ye.current,l=n.current;try{let[u,h,x,F,Ke,De,W,ee]=await Promise.all([l.
get("/api/chat/slots"),l.get("/api/approvals"),l.get("/api/spawn"),l.get("/api/workflows/runs"),l.get("/api/crons"),l.get(
"/api/artifacts"),l.get("/api/autonudge").catch(()=>({loops:[]})),l.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);
if(!P.current||t!==ye.current)return;k({slots:Array.isArray(u)?u:[],approvals:Array.isArray(h)?h:[],agents:Array.isArray(
x.agents)?x.agents:[],workflows:Array.isArray(F.runs)?F.runs:[],crons:Array.isArray(Ke.jobs)?Ke.jobs:[],artifacts:Array.
isArray(De.artifacts)?De.artifacts:[],loops:Array.isArray(W?.loops)?W.loops:[]}),Vt(Array.isArray(ee?.runs)?ee.runs:[]),
Qe(null),no(Date.now())}catch(u){P.current&&t===ye.current&&Qe(u instanceof Error?u:new Error("Unable to load Crew Manag\
er sources"))}finally{P.current&&t===ye.current&&Dn(!1)}},[]);j(()=>{A();let t=window.setInterval(()=>{A()},ur);return()=>window.
clearInterval(t)},[A]);let ro=()=>{Dn(!0),Qe(null),A()},en=K(()=>{be||(Ln(!0),A().finally(()=>{P.current&&Ln(!1)}))},[A,
be]);j(()=>{if(!f||B.current==="unsupported"||B.current==="disabled")return;let t=kt(f.slots,ce,Date.now(),u=>oe.current.
get(u.key)===wn(u));if(t.length===0)return;let l=!1;return(async()=>{let{summaries:u,support:h}=await xt(t,x=>n.current.
get(x));if(!(l||!P.current)&&(B.current=h,z(h),h==="available")){for(let x of t)u[x.key]&&oe.current.set(x.key,wn(x));T(
x=>({...x,...u}))}})(),()=>{l=!0}},[f]),j(()=>{if(!f||!Kn.current)return;let t=!1;return(async()=>{try{let l=await n.current.
get("/api/apps/crew-manager/stalls");if(t||!P.current)return;let u={};for(let x of l?.stalls??[])x?.key&&(u[x.key]=x);I(
u);let h={};for(let x of l?.error_loops??[])x?.key&&(h[x.key]=x);Mn(h),q(l??null);try{let x=await n.current.get("/api/ap\
ps/crew-manager/assigned");!t&&P.current&&Ge(x?.available&&Array.isArray(x.rows)?x.rows:[])}catch{P.current&&Ge([])}}catch{
Kn.current=!1,P.current&&(I({}),Mn({}),q(null),Ge([]))}})(),()=>{t=!0}},[f]);let qn=L(()=>ft(yt({...f??{slots:[],approvals:[],
agents:[],workflows:[],crons:[],artifacts:[],loops:[]},assigned:$n},Q,E,ue,Tn),Nn),[f,E,ue,Tn,Nn,$n]),Ie=L(()=>wt(qn,Wn,
Pn),[qn,Wn,Pn]),$=L(()=>Ie.items.filter(t=>ht(t)),[Ie]),We=L(()=>gn($),[$]),Fn=L(()=>{let t={};for(let l of $){if(l.state!==
"done"||!l.sessionKey)continue;let u=t[l.sessionKey];u?u.push(l.title):t[l.sessionKey]=[l.title]}return t},[$]),Z=L(()=>$.
find(t=>t.id===s)??null,[$,s]),ve=L(()=>i==="all"?$:$.filter(t=>t.state===i),[i,$]);j(()=>r(We["needs-you"]),[We,r]),j(()=>{
s&&!$.some(t=>t.id===s)&&p(null)},[$,s]);let se=f?.slots.find(t=>t.key===ce),so=!!(se||to),jn=U(!1);j(()=>{let t=se;if(!t||
jn.current||t.agent)return;jn.current=!0;let l=n.current;l.get("/api/apps/crew-manager/conductor-agent").then(u=>u?.available&&
u.agent?u.agent:null).catch(()=>null).then(u=>{if(!(!u||!P.current))return l.post(`/api/chat/slots/${encodeURIComponent(
ce)}/agent`,{agent:u}).then(()=>{A()})}).catch(()=>{})},[se,A]),j(()=>{!f||se||Ze.current||(Ze.current=!0,e.get("/api/ap\
ps/crew-manager/conductor-agent").then(t=>t?.available&&t.agent?t.agent:null).catch(()=>null).then(t=>e.post("/api/chat/\
slots",{name:ce,title:"Conductor",...t?{agent:t}:{}})).then(()=>{P.current&&(oo(!0),A())}).catch(t=>{P.current&&(Ze.current=
!1,Y(t instanceof Error?`Conductor session could not be created: ${t.message}`:"Conductor session could not be created"))}))},
[e,se,A,f]);let Un=L(()=>st(f?.approvals??[],Cn,t=>$.find(l=>l.sessionKey===t)?.title??f?.slots?.find(l=>l.key===t)?.title??
t),[$,f,Cn]),fe=Z&&!Z.permissionId?Z:null,nn=L(()=>{let t=(f?.loops??[]).filter(u=>u&&u.active!==!1&&u.slot_key);if(t.length===
0)return[];let l=new Map;for(let u of $)for(let h of u.references)h.kind!=="session"||!h.id||h.label&&!l.has(h.id)&&l.set(
h.id,h.label);return t.map(u=>{let h=Number(u.cycle_count)||0,x=Number(u.max_cycles)||0;return{key:u.slot_key,title:l.get(
u.slot_key)??u.slot_key,progress:x>0?`${h}/${x}`:`${h} ${h===1?"cycle":"cycles"}`,remaining:x>0?Math.max(0,x-h):null,instruction:(u.
message??"").replace(/\s+/g," ").trim(),lastFire:M(u.last_fire_ts)}})},[f,$]),me=L(()=>{let t=new Date;t.setHours(0,0,0,
0);let l=t.getTime(),u=l+864e5,h=f?.crons??[],x=new Map;for(let W of Ye){let ee=M(W.started_at);if(!W.job_id||ee<l||ee>=
u)continue;let V=x.get(W.job_id)??{count:0,failed:0,last:0};V.count+=1,W.status&&W.status!=="success"&&(V.failed+=1),V.last=
Math.max(V.last,ee),x.set(W.job_id,V)}let F=h.map(W=>{let ee=x.get(W.id),V=M(W.next_run_ts),po=V>=l&&V<u;return{job:W,ran:ee,
next:V,dueToday:po}}).filter(W=>W.ran||W.dueToday||W.job.is_running),Ke=F.filter(W=>W.ran&&W.ran.failed===0).length,De=F.
filter(W=>W.ran&&W.ran.failed>0).length;return{rows:F,done:Ke,failed:De,total:F.length,historyKnown:Ye.length>0}},[f,Ye]),
ke=K(async(t,l)=>{if(!G){Ce(t),Y(null);try{await n.current.post(`/api/approvals/${encodeURIComponent(t)}/${l?"approve":"\
reject"}`,{}),A()}catch(u){Y(u instanceof Error?`Could not answer that request: ${u.message}`:"Could not answer that req\
uest"),A()}finally{P.current&&Ce(null)}}},[A,G]),Ee=K(async(t,l)=>{if(!(G||!t.permissionId||!t.sessionKey)){Ce(t.permissionId),
Y(null);try{await n.current.post(`/api/chat/slots/${encodeURIComponent(t.sessionKey)}/approve`,{action:l,request_id:t.permissionId}),
A()}catch(u){Y(u instanceof Error?`Could not answer that request: ${u.message}`:"Could not answer that request"),A()}finally{
P.current&&Ce(null)}}},[A,G]),ao=K(t=>{En(l=>{let u=Object.fromEntries(Object.entries(l).filter(([,h])=>h>Date.now()));return u[t]=
Date.now()+mt,J(yn,u),u}),p(null)},[]),io=K((t,l)=>{Ut(u=>{let h={...u,[t]:l};return J(Ct,h),h}),p(null)},[]),lo=K(()=>{
En({}),J(yn,{})},[]),co=K(()=>{Yt(t=>(J(At,!t),!t))},[]),Pe=K(async t=>{if(!pe){An(t),Y(null);try{await n.current.post(t,
{}),A()}catch(l){Y(l instanceof Error?`Could not re-run it: ${l.message}`:"Could not re-run it"),A()}finally{P.current&&
An(null)}}},[A,pe]),Te=K(async t=>{if(!ge){In(t),Y(null);try{await n.current.del(t),N("Stopped the monitor loop. Re-armi\
ng it is done from the session itself."),A()}catch(l){let u=l instanceof Error?l.message:"";/404|not found/i.test(u)?N("\
That loop had already stopped."):Y(u?`Could not stop it: ${u}`:"Could not stop it"),A()}finally{P.current&&In(null)}}},[
A,ge]),xe=K(async t=>{let l=Z&&!Z.permissionId?Z:null;if(w==="session"&&l?.sessionKey){let u=l.sessionKey;if(await n.current.
post("/api/chat",{message:t,slot:u}).catch(h=>{if(!(h instanceof SyntaxError))throw h}),!P.current)return;Ft(h=>({...h,[l.
id]:Date.now()})),jt(h=>h.includes(u)?h:[...h,u]),N(`Sent new instructions to ${l.title}`),p(null),A();return}await n.current.
post(`/api/chat/slots/${encodeURIComponent(ce)}/context`,{content:Sr(Z,$,Rr(re,se?.last_ts)),source:"crew-manager",ephemeral:!0}).
catch(()=>{}),await n.current.post("/api/chat",{message:t,slot:ce}).catch(u=>{if(!(u instanceof SyntaxError))throw u})},
[Z,$,A,w,re,se]),tn={"needs-you":ve.filter(t=>t.state==="needs-you"),running:ve.filter(t=>t.state==="running"),done:ve.filter(
t=>t.state==="done")},Me=K((t,l)=>{Ht(u=>{let h={...u,[t]:l};return J(It,h),h})},[]),$e=t=>o(`/chat?sid=${encodeURIComponent(
t)}`),Be=t=>{p(l=>l===t.id?null:t.id),N(null),S("session")},uo=fe?m("div",{className:"ow-quote ow-quote-docked",children:[
m("div",{className:"ow-quote-body",children:[fe.sessionKey?a("button",{type:"button",className:"ow-scope-toggle","aria-p\
ressed":w==="conductor","aria-label":w==="session"?"Sending to this session. Activate to send to the Conductor instead.":
"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>S(t=>t==="session"?"conductor":"sessio\
n"),children:w==="session"?"Instructing":"To Conductor"}):a("span",{className:"ow-eyebrow",children:"Quoted"}),a("span",
{className:"ow-quote-title",title:fe.title,children:fe.title})]}),a(O,{className:"ow-quote-clear","aria-label":"Remove t\
he quoted work item",onClick:()=>{p(null),N(null)},children:"Clear"})]}):null;return m("div",{className:"ow-root","data-\
crew-manager-shell":"quiet-split",children:[a("style",{children:_t}),a("div",{className:"ow-titlebar",children:a(dr,{title:m(
"span",{className:"ow-title-line",children:["Crew Manager",a("span",{className:"ow-beta","aria-label":"Beta preview",children:"\
Beta"})]}),subtitle:"See what needs your input, what is still running, and what finished recently."})}),a("div",{className:"\
ow-body",children:m("div",{className:"ow-layout",ref:je,style:X.conductor!=null?{"--ow-conductor-w":`${X.conductor}px`}:
void 0,children:[m("div",{className:"ow-main","data-open-row":Zt,ref:Ue,style:X.work!=null?{"--ow-work-w":`${X.work}px`}:
void 0,children:[m("details",{...Je("work"),"aria-label":"Work",children:[m("summary",{onClick:t=>{t.preventDefault(),d!==
"work"&&C("work")},children:[m("span",{className:"ow-stack-title",children:[a(te,{className:"ow-icon ow-stack-chevron"}),
a(Sn,{className:"ow-icon"}),zt.work]}),m("span",{className:"ow-stack-actions",children:[a(D,{variant:"muted",children:We.
all}),d==="work"?a(bn,{lastUpdated:Xe,refreshing:be,onRefresh:en}):a(hn,{id:"work",onPromote:he})]})]}),m("div",{className:"\
ow-listcard-tools",children:[a("p",{className:"ow-listcard-sub",children:"Grouped by what each session needs from you"}),
a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.keys(xn).map(t=>m(O,{onClick:()=>c(
t),"aria-pressed":i===t,"data-selected":i===t,className:"ow-filter",children:[xn[t],a("span",{className:"ow-count",children:We[t]})]},
t))})]}),a("main",{className:"ow-work",children:a("div",{className:"ow-work-inner",children:eo?a(St,{rows:7}):On&&!f?a(Rt,
{icon:a($t,{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:On.message,action:a(O,{onClick:ro,
children:"Try again"})}):ve.length===0?a(Rt,{icon:a(tr,{className:"ow-icon"}),title:"No matching work",subtitle:"Change \
the filter to see sessions in another state."}):i==="all"?m(Fe,{children:[a(Le,{title:"Needs you",subtitle:"Waiting on a\
 decision or reply from you",items:tn["needs-you"],doneBySession:Fn,selectedId:s,onSelect:Be,onSnooze:ao,onHandled:io,footer:Ie.
snoozedCount>0?m("button",{type:"button",className:"ow-aside-note",onClick:lo,children:[Ie.snoozedCount," set aside for \
later \u2014 bring back"]}):void 0,onOpenSession:$e,onAnswerPermission:(t,l)=>{ke(t,l)},onDecideApproval:(t,l)=>{Ee(t,l)},
permissionBusy:G!==null,onRetry:t=>{Pe(t)},retryBusy:pe!==null,onStop:t=>{Te(t)},stopBusy:ge!==null,onPickStep:t=>{xe(t)},
collapsedCards:Ae,onToggleCard:Me,emptyLabel:"Nothing needs your input right now."}),a(Le,{title:"In progress",subtitle:"\
Being worked on right now",items:tn.running,doneBySession:Fn,selectedId:s,onSelect:Be,onOpenSession:$e,onAnswerPermission:(t,l)=>{
ke(t,l)},onDecideApproval:(t,l)=>{Ee(t,l)},permissionBusy:G!==null,onRetry:t=>{Pe(t)},retryBusy:pe!==null,onStop:t=>{Te(
t)},stopBusy:ge!==null,onPickStep:t=>{xe(t)},collapsedCards:Ae,onToggleCard:Me,emptyLabel:"Nothing is in progress right \
now."}),a(Le,{title:"Done recently",subtitle:"Finished in the last few days",items:tn.done,selectedId:s,onSelect:Be,collapsed:Gt,
onToggleCollapsed:co,onOpenSession:$e,onAnswerPermission:(t,l)=>{ke(t,l)},onDecideApproval:(t,l)=>{Ee(t,l)},permissionBusy:G!==
null,onRetry:t=>{Pe(t)},retryBusy:pe!==null,onStop:t=>{Te(t)},stopBusy:ge!==null,onPickStep:t=>{xe(t)},collapsedCards:Ae,
onToggleCard:Me,emptyLabel:"No recent completed work."})]}):a(Le,{title:xn[i],items:ve,selectedId:s,onSelect:Be,onOpenSession:$e,
onAnswerPermission:(t,l)=>{ke(t,l)},onDecideApproval:(t,l)=>{Ee(t,l)},permissionBusy:G!==null,onRetry:t=>{Pe(t)},retryBusy:pe!==
null,onStop:t=>{Te(t)},stopBusy:ge!==null,onPickStep:t=>{xe(t)},collapsedCards:Ae,onToggleCard:Me,emptyLabel:"No matchin\
g work"})})})]}),m("details",{...Je("loops"),children:[m("summary",{onClick:t=>{t.preventDefault(),d!=="loops"&&C("loops")},
children:[m("span",{className:"ow-stack-title",children:[a(te,{className:"ow-icon ow-stack-chevron"}),a(Lt,{className:"o\
w-icon"}),"Loops"]}),m("span",{className:"ow-stack-actions",children:[a(D,{variant:"muted",children:nn.length}),d==="loo\
ps"?a(bn,{lastUpdated:Xe,refreshing:be,onRefresh:en}):a(hn,{id:"loops",onPromote:he})]})]}),a("p",{className:"ow-stack-s\
ub",children:"Sessions repeating a goal until it is done"}),a("div",{className:"ow-stack-body",children:nn.length===0?a(
"p",{className:"ow-stack-empty",children:"No loop is running right now."}):nn.map(t=>{let l=Rn(t.lastFire),u=[l&&`last t\
ick ${l}`,t.remaining!==null&&`${t.remaining} remaining`].filter(Boolean).join(" \xB7 ");return m("div",{className:"ow-m\
ini",children:[a("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),m("div",{children:[m("div",{className:"\
ow-mini-title",children:[t.title,a("span",{className:"ow-mini-chip",children:t.progress})]}),t.instruction&&a("div",{className:"\
ow-mini-desc",title:t.instruction,children:t.instruction}),u&&a("div",{className:"ow-mini-when",children:u})]}),a(D,{variant:"\
ok",children:"Active"})]},t.key)})})]}),m("details",{...Je("schedule"),children:[m("summary",{onClick:t=>{t.preventDefault(),
d!=="schedule"&&C("schedule")},children:[m("span",{className:"ow-stack-title",children:[a(te,{className:"ow-icon ow-stac\
k-chevron"}),a(Dt,{className:"ow-icon"}),"Scheduled tasks"]}),m("span",{className:"ow-stack-actions",children:[m(D,{variant:me.
failed>0?"err":"muted",children:[me.done,"/",me.total," today"]}),d==="schedule"?a(bn,{lastUpdated:Xe,refreshing:be,onRefresh:en}):
a(hn,{id:"schedule",onPromote:he})]})]}),a("p",{className:"ow-stack-sub",children:me.historyKnown?"Today's runs only \u2014 j\
obs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be low"}),a("div",{className:"\
ow-stack-body",children:me.rows.length===0?a("p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):
me.rows.map(({job:t,ran:l,next:u,dueToday:h})=>{let x=!!(l&&l.failed>0),F=[l&&`ran today ${Wt(l.last)}${l.count>1?` (${l.
count}x)`:""}`,h&&u?`next ${Wt(u)}`:null].filter(Boolean).join(" \xB7 ");return m("div",{className:"ow-mini",children:[a(
"span",{className:"ow-mini-rail",style:{background:x?"var(--danger)":t.enabled===!1?"var(--muted)":"var(--warn)"}}),m("d\
iv",{children:[a("div",{className:"ow-mini-title",children:t.name}),t.schedule&&m("div",{className:"ow-mini-desc",children:[
t.schedule,t.cron_expr&&a("span",{className:"ow-mini-chip",children:t.cron_expr})]}),F&&a("div",{className:"ow-mini-when",
children:F})]}),t.is_running?a(D,{variant:"aim",children:"Running"}):x?a(D,{variant:"err",children:"Failed"}):t.enabled===
!1?a(D,{variant:"muted",children:"Paused"}):l?a(D,{variant:"ok",children:"Success"}):a(D,{variant:"warn",children:"Pendi\
ng"})]},t.id)})})]}),a(Mt,{side:"start",containerRef:Ue,min:H.workMin,reserve:H.railReserve,max:1/0,value:X.work,onChange:t=>He(
l=>({...l,work:t})),label:"Resize the work column"})]}),a(Mt,{side:"end",containerRef:je,min:H.conductorMin,reserve:H.mainReserve,
max:H.conductorMax,value:X.conductor,onChange:t=>He(l=>({...l,conductor:t})),label:"Resize the Conductor panel"}),m("asi\
de",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:m("di\
v",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!fe&&a("span",{className:"ow-conductor-sub",
children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:so?m("div",{className:"ow-chat-pa\
nel",children:[Un.length>0&&a("div",{className:"ow-permissions",role:"alert",children:Un.map(t=>a(wr,{tool:t.tool,purpose:t.
purpose,where:t.sessionLabel,busy:G!==null,onAnswer:l=>{ke(t.id,l)}},t.id))}),v&&m("div",{className:"ow-conductor-receip\
t",role:"status",children:[a(Kt,{className:"ow-icon"}),v]}),zn&&a("div",{className:"ow-chat-error",role:"alert",children:zn}),
a("div",{className:"ow-embed",children:a(lr,{slotKey:ce,frameless:!0,startAtBottom:!0,slotControls:!0,placeholder:fe?.sessionKey&&
w==="session"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:xe,aboveComposer:uo})})]}):a(
"div",{className:"ow-chat-loading",children:a(St,{rows:4})})})]})]})})]})}export{Nr as default,Rr as noticedSinceLastTurn};
