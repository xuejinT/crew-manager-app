import{useCallback as D,useEffect as Y,useId as Xo,useMemo as F,useRef as V,useState as _}from"react";import{AlertTriangle as Kt,
Bot as Zo,Check as Dt,ChevronRight as ae,Check as Ot,Clock as Lt,Package as er,ExternalLink as nr,MessageSquare as zt,RefreshCw as tr,
Shield as or,Waves as qt,Search as rr,Tag as sr,Users as In,Zap as ar}from"lucide-react";import{useAppApi as ir,useNavigate as lr,
useNavBadge as dr,ChatEmbed as cr}from"@kirocrew/app-sdk";import{Badge as L,Btn as q,ContentSkeleton as Nt,EmptyState as Ct,
PageHeader as ur}from"@kirocrew/app-sdk/ui";function ce(e){let n=Math.max(1,Math.floor(e/60));if(n<60)return`${n} minute${n===1?"":"s"}`;let o=Math.floor(n/60),r=n%
60;return r===0?`${o} hour${o===1?"":"s"}`:`${o}h ${r}m`}function fo(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function it(e,n,o){let r=new Set(n.filter(Boolean));if(r.size===0)return[];let i=new Set,
c=[];for(let d of e){let g=d.slot;!g||!r.has(g)||!d.id||i.has(d.id)||(i.add(d.id),c.push({id:d.id,sessionKey:g,sessionLabel:o(
g),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return c}var Yn=5,Vn={"needs-you":0,running:1,done:2};function M(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let n=Date.parse(e);return Number.isFinite(n)?n:0}function mo(e,n){if(e.paused)
return"";let o=M(e.next_run_ts);if(!o)return"";let r=Math.round((o-n)/1e3);return r<=0?"":ce(r)}var Jn=72;function de(e,n){
let o=e?.replace(/\s+/g," ").trim();if(!o)return n;let i=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(i.length<=Jn)return i;let c=i.slice(0,Jn),d=c.lastIndexOf(" ");return`${(d>24?c.slice(0,d):c).trim()}\u2026`}
function he(e){return!!e.source_links?.some(n=>n.kind!=="issue"&&(n.ci==="failed"||n.mergeable==="conflicting"))}var wo=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
ho=/^\((?:code|diff|widget|image)\)$/,bo=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
vo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,yo=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
xo=/[?？]["'”’)\]]*$/;function lt(e){let n=e.last_message?.replace(/\s+/g," ").trim();return!n||ho.test(n)||wo.test(
n)?null:n}function pn(e){if(!e.waiting_for_input)return null;let n=lt(e);return!n||bo.test(n)||vo.test(n)?null:yo.test(n)||
xo.test(n)?n:null}function Qn(e){return e.pending_approval||pn(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":"done"}function ko(e,n){if(e.pending_approval)return n("approval_waiting");let o=pn(e);return o||(e.running||e.
subagents_running||e.orchestrating?n("work_in_progress"):he(e)?n("linked_change_issue"):lt(e)??n("recent_work_ready"))}function ln(e,n){
let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop()||n("session")}function _o(e){
return e.pending_approval?"review-approval":pn(e)?"reply":"open"}function dt(e){return(e.source_links??[]).map(n=>({number:String(
n.number??""),ref:{kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:`${n.provider}\
 #${n.number}`,url:n.url,sessionKey:e.key,status:fo(n)}}))}function So(e,n){let o=dt(e).map(r=>r.ref);return{id:`session\
:${e.key}`,title:e.title||n("untitled_work"),summary:ko(e,n),state:Qn(e),moving:Qn(e)==="running"||void 0,issue:he(e),updatedAt:M(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:ln(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:he(
e)||void 0,action:_o(e),references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.key},...o]}}
function gn(e,n){e.references.some(o=>o.kind===n.kind&&o.id===n.id)||e.references.push(n)}function ct(e){return(e.source||
"").toLowerCase()==="subagent"}function Ro(e,n,o){let r=ct(n);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,M(n.ts)),
e.summary=o(r?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=r?"subagent":"tool",e.action="review-approval",
e.permissionId=n.id,e.permissionTool=n.tool||n.source,e.permissionPurpose=n.tool_purpose,e.permissionInput=n.tool_input,
gn(e,{kind:"approval",id:n.id,label:n.tool||n.source||o("approval"),sessionKey:n.slot||e.sessionKey})}function No(e,n,o){
e.updatedAt=Math.max(e.updatedAt,M(n.started)),e.issue||=!!(n.done&&(n.error||n.outcome==="failed")),n.done?(n.error||n.
outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_failed",{task:n.task})):e.state!=="needs-you"&&(e.state=
"running",e.summary=o("work_in_progress")),gn(e,{kind:"agent",id:n.id,label:n.agent||o("agent"),sessionKey:n.parent||e.sessionKey})}
function Co(e,n,o){e.issue||=n.status==="failed",n.status==="running"&&e.state!=="needs-you"&&(e.state="running"),n.status===
"failed"&&e.state!=="needs-you"&&(e.summary=o("workflow_failed",{name:n.name})),gn(e,{kind:"workflow",id:n.run_id,label:n.
name||n.run_id,sessionKey:n.session_key||e.sessionKey})}function Io(e,n){if(n.pending_approval)return"needs-you";switch(e.
state){case"needs-you":return"needs-you";case"done":case"dropped":return"done";case"in-progress":return"running";default:
return null}}function Ao(e,n,o){return!(n.running||n.subagents_running||n.orchestrating)?!1:e===o}function Wo(e){let n=null,
o=-1;for(let r of e){let i=r.last_touched_turn??0;i>o&&(o=i,n=r)}return n}function Eo(e,n){let o=e.next_steps?.find(i=>i.what?.trim())?.what?.trim();if(o)return o;let r=[...e.progress??[]].reverse().
find(i=>i.trim());return r?r.trim():e.initial_intent?.trim()||n("work_in_progress")}var To=3;function Po(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(n=>n.what??"")].join(" ")}function Bo(e,n){if(!n)return!1;
let o=n.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${o}\\b`,"u").test(e)}function Xn(e,n){if(e.length===
0)return[];let o=Po(n);return e.filter(r=>Bo(o,r.number)).map(r=>r.ref)}function $o(e,n,o){if(!n?.enabled)return[];let r=n.
intents??[];if(r.length===0)return[];let i=dt(e),c=[],d=Wo(r),b=!!(e.running||e.subagents_running||e.orchestrating)?[]:r.
filter(s=>s.state==="in-progress");b.forEach(s=>{let p=r.indexOf(s),w=(s.next_steps??[]).filter(S=>S.what?.trim());c.push(
{id:`unattended:${e.key}:${p}`,title:de(s.title,e.title||o("untitled_work")),summary:w[0]?.what?.trim()||o("no_next_step"),
state:"needs-you",issue:he(e),updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:ln(e,o),
queuedBehind:e.queue_depth||void 0,changeBlocked:he(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.key},...Xn(i,s)],nextSteps:w,initialIntent:s.initial_intent?.
trim()||void 0,progress:(s.progress??[]).filter(S=>S.trim()),stale:!!n.stale,lastTouchedTurn:s.last_touched_turn??0})}),
r.forEach((s,p)=>{if(b.includes(s))return;let w=Io(s,e);if(!w)return;let S=(s.next_steps??[]).filter(v=>v.what?.trim());
c.push({id:`intent:${e.key}:${p}`,title:de(s.title,e.title||o("untitled_work")),summary:Eo(s,o),state:w,issue:!1,updatedAt:M(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:ln(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:he(
e)||void 0,unverified:s.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...Xn(i,s)],nextSteps:S,initialIntent:s.initial_intent?.trim()||void 0,progress:(s.progress??
[]).filter(v=>v.trim()),stale:!!n.stale,lastTouchedTurn:s.last_touched_turn??0,moving:Ao(s,e,d)||void 0})});let R=c.filter(
s=>s.state==="needs-you"),A=c.filter(s=>s.state!=="needs-you").sort((s,p)=>(p.lastTouchedTurn??0)-(s.lastTouchedTurn??0));
return[...R,...A].slice(0,Math.max(To,R.length))}var Mo=new Set(["crew-manager-conductor","overwatch-conductor"]),Ko={approval_owed:100,
subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,stalled:50,
change_blocked:40,merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Do=3;function Oo(e,n){
return e.updatedAt?Math.max(0,Math.floor((n-e.updatedAt)/36e5)):0}var Fe=5;function ut(e,n,o=Date.now()){let r=wn(e),i=yt(
e.filter(d=>d.state==="needs-you"),o),c=[`Fleet: ${r["needs-you"]} waiting on the user, ${r.running} in progress, ${r.done}\
 finished recently.`];return i.length===0?(c.push("Nothing is waiting on the user."),c):(c.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Fe,i.length)}):`),i.slice(0,Fe).forEach((d,g)=>{let b=Re(ue(d,o),n),R=d.sessionKey?
` [session ${d.sessionKey}]`:"";c.push(`${g+1}. ${d.title} \u2014 ${d.summary} (${b})${R}`)}),i.length>Fe&&c.push(`\u2026and ${i.
length-Fe} more waiting.`),c)}var dn=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),Zn=.6,et=2,pt=new Set;function cn(e){return[...new Set(e.toLowerCase().replace(
/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(n=>n.length>2&&!dn.has(n)))]}function nt(e,n){let o=cn(e),r=cn(n);if(o.length<
et||r.length<et)return 0;let i=o.length<=r.length?o:r,c=new Set(o.length<=r.length?r:o);return i.filter(g=>c.has(g)).length/
i.length}function tt(e){return e.references.filter(n=>n.kind==="change"||n.kind==="issue").map(n=>n.id)}function ot(e){return e.
references.filter(n=>n.kind==="artifact").map(n=>n.id)}function rt(e){return(e.nextSteps??[]).map(n=>n.what).filter(Boolean)}
var Lo=new Set(["pull request","pull requests","status update","work in progress","code review","follow up","next step",
"next steps","action item","action items","kiro crew","in progress","needs you"]);function un(e){let n=new Set,o=e.match(
/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??[];for(let r of o){let i=r.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean).map(c=>c.length>3&&c.endsWith("s")&&!c.endsWith("ss")?c.slice(0,-1):c);for(;i.length&&
dn.has(i[0]);)i.shift();for(;i.length&&dn.has(i[i.length-1]);)i.pop();if(!(i.length<2))for(let c=i.length;c>=2;c-=1)for(let d=0;d+
c<=i.length;d+=1){let g=i.slice(d,d+c).join(" ");Lo.has(g)||n.add(g)}}return[...n]}function zo(e){let n=new Set;if(e.length<
qo)return n;let o=new Map;for(let r of e)for(let i of un(r.title))o.set(i,(o.get(i)??0)+1);for(let[r,i]of o)i/e.length>=
Fo&&n.add(r);return n}var qo=4,Fo=.75;function gt(e,n,o=pt){if(tt(e).find(d=>tt(n).includes(d)))return"same_change";if(ot(
e).find(d=>ot(n).includes(d)))return"same_artifact";let c=un(n.title).filter(d=>!o.has(d));if(un(e.title).some(d=>c.includes(
d)))return"same_deliverable";if(nt(e.title,n.title)>=Zn)return"same_topic";for(let d of rt(e))for(let g of rt(n))if(nt(d,
g)>=Zn)return"same_step";return null}var ft={merged:[],split:[]};function st(e){return`${e.sessionKey??e.id}|${cn(e.title).
join(" ")}`}function mt(e,n){return[st(e),st(n)].sort().join("")}function Ho(e,n=ft){let o=e.filter(i=>i.state!=="done"&&
i.sessionKey).sort((i,c)=>(i.updatedAt||0)-(c.updatedAt||0)),r=zo(o);for(let i=1;i<o.length;i+=1){let c=o[i];for(let d=0;d<
i;d+=1){let g=o[d];if(g.sessionKey===c.sessionKey||n.split.includes(mt(c,g)))continue;let b=gt(c,g,r);if(b){c.duplicateOf=
{sessionKey:g.sessionKey,title:g.title,because:b};break}}}Uo(o,n,r)}var an=3,at=["same_change","same_artifact","same_del\
iverable","same_topic","same_step"];function Uo(e,n,o=pt){for(let r of e){let i=[],c=new Set;for(let d of e){let g=d.sessionKey;
if(g===r.sessionKey||c.has(g)||n.split.includes(mt(r,d)))continue;let b=gt(r,d,o);b&&(c.add(g),i.push({sessionKey:g,title:d.
title,because:b}))}i.length!==0&&(i.sort((d,g)=>at.indexOf(d.because)-at.indexOf(g.because)),r.relatedSessions=i.slice(0,
an),i.length>an&&(r.relatedMore=i.length-an))}}var jo=3e4;function wt(e,n,o=Date.now()){return Object.keys(n).length===0?
e:e.map(r=>{let i=n[r.id];return!i||o-i>jo||r.state==="running"?r:{...r,state:"running",moving:!0,instructed:!0}})}function ue(e,n=Date.
now()){let o=[],r=(c,d,g=1)=>{o.push({signal:c,weight:Ko[c]*g,values:d})};e.approvalKind==="subagent"?r("subagent_gate"):
e.approvalKind==="tool"&&r("approval_owed"),e.action==="reply"&&r("input_requested"),e.unverified&&r("unverified_complet\
ion"),e.loopRepeats&&r("error_loop",{repeats:String(e.loopRepeats)}),e.changesRequested&&r("changes_requested"),e.runFailed&&
r("run_failed"),e.stalledFor&&r("stalled",{duration:ce(e.stalledFor)}),e.assignedToYou&&r("assigned_to_you"),e.changeBlocked&&
r("change_blocked"),e.mergeReady&&r("merge_ready"),e.unattendedGoals&&r("nobody_on_it",{count:String(e.unattendedGoals)}),
e.queuedBehind&&r("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let i=Oo(e,n);return i>0&&r(
"waiting_a_while",{hours:String(i)},Math.min(i,Do)),o.sort((c,d)=>d.weight-c.weight),{score:o.reduce((c,d)=>c+d.weight,0),
signals:o}}var Go={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unbl\
ock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"\
unblock",assigned_to_you:"followup",nobody_on_it:"followup"};function fn(e,n=Date.now()){if(e.state!=="needs-you")return null;
for(let o of ue(e,n).signals){let r=Go[o.signal];if(r)return r}return null}var ht=14400*1e3;function bt(e,n,o,r=Date.now()){
let i=0,c=[];for(let d of e){if(d.state!=="needs-you"){c.push(d);continue}let g=n[d.id];if(g&&g>r){i+=1;continue}let b=o[d.
id];if(b!==void 0&&d.updatedAt<=b){c.push({...d,state:"done",issue:!1});continue}c.push(d)}return{items:c,snoozedCount:i}}
var mn=4320*60*1e3;function vt(e,n=Date.now()){return e.state!=="done"||e.updatedAt===0?!0:n-e.updatedAt<=mn}var Yo={"ne\
eds-you":1,running:-1,done:-1};function Vo(e,n,o){let r=e.updatedAt>0,i=n.updatedAt>0;return!r&&!i?0:r?i?(e.updatedAt-n.
updatedAt)*o:-1:1}function Re(e,n){let o=e.signals.slice(0,2);return o.length===0?n("rank_nothing_pressing"):o.map(i=>n(
`rank_${i.signal}`,i.values)).join(n("rank_join"))}function yt(e,n=Date.now()){let o=new Map(e.map(r=>[r.id,ue(r,n)]));return[
...e].sort((r,i)=>{let c=Vn[r.state]-Vn[i.state];if(c!==0)return c;if(r.state==="needs-you"){let d=(o.get(i.id)?.score??
0)-(o.get(r.id)?.score??0);if(d!==0)return d}else if(r.issue!==i.issue)return r.issue?-1:1;return Vo(r,i,Yo[r.state])})}
function xt(e,n,o={},r={},i={},c=ft,d=Date.now()){let g=new Map,b=new Map;for(let s of e.slots){if(!s.key||Mo.has(s.key)||
s.memory_mode==="incognito")continue;let p=$o(s,o[s.key],n);if(p.length>0){for(let v of p)g.set(v.id,v);let S=p.find(v=>v.
state==="needs-you")??p[0];b.set(s.key,S);continue}let w=So(s,n);g.set(w.id,w),b.set(s.key,w)}if(e.assigned?.length){let s=new Map;
for(let m of g.values())for(let x of m.references)(x.kind==="change"||x.kind==="issue")&&x.url&&!s.has(x.url)&&s.set(x.url,
m);let p={changes_requested:0,conflict:1,checks_failing:2,ready_to_merge:3,assigned:4},w=new Map;for(let m of e.assigned){
if(!m?.url||s.has(m.url)||!(m.status in p))continue;let x=w.get(m.status);x?x.push(m):w.set(m.status,[m])}let S=[...w.entries()].
sort((m,x)=>(p[m[0]]??9)-(p[x[0]]??9)).map(m=>m[1]),v=[];for(let m=0;v.length<Yn;m+=1){let x=!1;for(let T of S){if(v.length>=
Yn)break;let $=T[m];$&&(v.push($),x=!0)}if(!x)break}let N=new Set(v.map(m=>m.url));for(let m of e.assigned){if(!m?.url||
!s.has(m.url)&&!N.has(m.url))continue;let x=m.kind==="issue"?"issue":"pull",T=m.status==="conflict"||m.status==="checks_\
failing",$=m.status==="changes_requested",C=m.status==="ready_to_merge",H=x==="issue",P=s.get(m.url);if(P){P.owned=x,T&&
(P.changeBlocked=!0,P.issue=!0),$&&(P.changesRequested=!0),C&&(P.mergeReady=!0),(T||$||C)&&P.state==="done"&&(P.state="n\
eeds-you");continue}let U=T||$||C||H,Q=x==="issue"?"owned_issue_assigned":m.status==="conflict"?"owned_pull_conflict":m.
status==="checks_failing"?"owned_pull_failing":m.status==="changes_requested"?"owned_pull_changes_requested":m.status===
"ready_to_merge"?"owned_pull_merge_ready":m.status==="checks_running"?"owned_pull_checks_running":"owned_pull_awaiting_r\
eview",I=x==="issue"?`issue #${m.number}`:`#${m.number}`;g.set(`owned:${m.url}`,{id:`owned:${m.url}`,title:m.title||I,summary:n(
Q,{count:String(m.status==="checks_failing"?m.failing:m.pending)}),state:U?"needs-you":"running",issue:T,updatedAt:M(m.updated_at),
provenance:n("owned_provenance",{repo:m.repo}),references:[{kind:x==="issue"?"issue":"change",id:m.url,label:`${m.repo} ${I}`,
url:m.url,status:m.status==="awaiting_review"?void 0:m.status.replace(/_/g," ")}],action:void 0,owned:x,changeBlocked:T||
void 0,changesRequested:$||void 0,mergeReady:C||void 0,assignedToYou:H||void 0})}}for(let[s,p]of Object.entries(r)){let w=b.
get(s);w&&(w.state="needs-you",w.issue=!0,w.stalledFor=p.silent_secs,w.summary=p.reason?n("stalled_because",{reason:p.reason,
duration:ce(p.silent_secs)}):n("stalled_for",{duration:ce(p.silent_secs)}),w.action="open")}for(let[s,p]of Object.entries(
i)){let w=b.get(s);w&&(w.state="needs-you",w.issue=!0,w.loopRepeats=p.repeats,w.summary=n("error_loop",{tool:p.tool,repeats:String(
p.repeats)}),w.action="open")}for(let s of e.approvals){let p=s.slot?b.get(s.slot):void 0;if(p){Ro(p,s,n);continue}g.set(
`approval:${s.id}`,{id:`approval:${s.id}`,title:de(s.tool||s.source,n("approval_needed")),summary:s.tool_purpose||n("too\
l_call_waiting"),state:"needs-you",issue:!1,updatedAt:M(s.ts),provenance:n("approval"),action:"review-approval",approvalKind:ct(
s)?"subagent":"tool",permissionId:s.id,permissionTool:s.tool||s.source,permissionPurpose:s.tool_purpose,permissionInput:s.
tool_input,references:[{kind:"approval",id:s.id,label:s.tool||s.source||n("approval")}]})}for(let s of e.agents){let p=s.
parent?b.get(s.parent):void 0;if(p){No(p,s,n);continue}let w=!!(s.done&&(s.error||s.outcome==="failed"));s.parent&&!w||g.
set(`agent:${s.id}`,{id:`agent:${s.id}`,title:de(s.task||s.agent,n("agent_work")),summary:w?s.error?.trim()||n("agent_fa\
iled",{task:s.task}):s.done?n("agent_done"):n("work_in_progress"),state:w?"needs-you":s.done?"done":"running",issue:w,runFailed:w||
void 0,retryPath:w&&!s.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(s.id)}/retry`:void 0,updatedAt:M(s.started),
provenance:s.agent||n("agent"),action:"discuss",references:[{kind:"agent",id:s.id,label:s.agent||n("agent")}]})}for(let s of e.
workflows){let p=s.session_key?b.get(s.session_key):void 0;if(p){Co(p,s,n);continue}let w=s.status==="failed";g.set(`wor\
kflow:${s.run_id}`,{id:`workflow:${s.run_id}`,title:de(s.name,s.run_id),summary:w?n("workflow_failed_generic"):s.status===
"running"?n("workflow_running"):n("workflow_finished"),state:w?"needs-you":s.status==="running"?"running":"done",issue:w,
runFailed:w||void 0,retryPath:w?`/api/workflows/runs/${encodeURIComponent(s.run_id)}/rerun`:void 0,updatedAt:0,provenance:n(
"workflow"),action:"discuss",references:[{kind:"workflow",id:s.run_id,label:s.name||s.run_id}]})}for(let s of e.crons){if(!s.
is_running&&s.last_status!=="error")continue;let p=s.last_status==="error",w=mo(s,d),S=n(p?"monitor_failed":"monitor_run\
ning");g.set(`monitor:${s.id}`,{id:`monitor:${s.id}`,title:s.name,summary:w?`${S} ${n("monitor_next_check",{duration:w})}`:
S,state:p?"needs-you":"running",issue:p,runFailed:p||void 0,retryPath:p?`/api/crons/${encodeURIComponent(s.id)}/run`:void 0,
updatedAt:M(s.running_since||s.last_run_ts||s.created_ts),provenance:n("monitor"),action:p?"discuss":void 0,references:[
{kind:"monitor",id:s.id,label:s.name}]})}for(let s of e.loops||[]){if(!s.active)continue;let p=String(s.id||"");if(!p)continue;
let w=Math.max(0,Number(s.cycle_count)||0),S=Math.max(0,Number(s.max_cycles)||0),v=s.slot_key&&b.has(s.slot_key)?s.slot_key:
void 0;g.set(`loop:${p}`,{id:`loop:${p}`,title:de(s.message||"",n("loop")),summary:S?n("loop_watching_capped",{cycles:String(
w),cap:String(S)}):n("loop_watching",{cycles:String(w)}),state:"running",issue:!1,updatedAt:M(s.last_fire_ts||s.created_ts),
sessionKey:v,parentId:v?b.get(v)?.id:void 0,provenance:n("loop"),stopPath:`/api/autonudge/${encodeURIComponent(p)}`,action:v?
"open":void 0,references:[{kind:"monitor",id:p,label:n("loop"),sessionKey:v},...v?[{kind:"session",id:v,label:b.get(v)?.
title||v,sessionKey:v}]:[]]})}let R=[...e.artifacts].sort((s,p)=>M(p.updated_at)-M(s.updated_at)).slice(0,8);for(let s of R){
let p=s.session_key&&b.has(s.session_key)?s.session_key:void 0;g.set(`artifact:${s.slug}`,{id:`artifact:${s.slug}`,title:de(
s.name,n("artifact")),summary:s.description||n("artifact_ready",{kind:s.kind}),state:"done",issue:!1,updatedAt:M(s.updated_at||
s.created_at),sessionKey:p,parentId:p?b.get(p)?.id:void 0,provenance:s.session_title||s.source||n("artifact"),action:p?"\
open":void 0,references:[{kind:"artifact",id:s.slug,label:s.name,sessionKey:p},...p?[{kind:"session",id:p,label:s.session_title||
p,sessionKey:p}]:[]]})}let A=[...g.values()];return Ho(A,c),yt(A)}function wn(e){return{all:e.length,"needs-you":e.filter(
n=>n.state==="needs-you").length,running:e.filter(n=>n.state==="running").length,done:e.filter(n=>n.state==="done").length}}function kt(e){let n=[],o=new Map;for(let r of e){let i=r.sessionKey;if(!i){n.push({key:r.id,items:[r],header:null,sessionKey:null});
continue}let c=o.get(i);if(c){c.items.push(r);continue}let d={key:i,items:[r],header:"session",sessionKey:r.sessionKey??
null};o.set(i,d),n.push(d)}return n}function hn(e){let n=new Set,o=new Set,r=new Set,i=0,c=0,d=0,g=0,b=0;for(let R of e){
R.sessionKey&&n.add(R.sessionKey);for(let A of R.references)A.kind==="change"?o.add(A.id):A.kind==="issue"&&r.add(A.id);
R.id.startsWith("workflow:")?i+=1:R.id.startsWith("monitor:")?c+=1:R.id.startsWith("agent:")&&(d+=1),R.state==="needs-yo\
u"&&(g+=1),R.updatedAt>b&&(b=R.updatedAt)}return{sessions:n.size,prs:o.size,issues:r.size,loops:i,crons:c,agents:d,needsYou:g,
lastActivityAt:b}}var Jo=12;function vn(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Qo(e,n=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let o=bn(e);return o===0?!0:n-o<=mn}function _t(e,n,o=Date.
now(),r=()=>!1){return e.filter(i=>i.key&&i.key!==n&&i.memory_mode!=="incognito").filter(i=>Qo(i,o)).filter(i=>!r(i)).sort(
(i,c)=>bn(c)-bn(i)).slice(0,Jo)}function bn(e){let n=e.last_ts??e.last_activity_ts??e.created;if(typeof n=="number")return n>
1e10?n:n*1e3;if(!n)return 0;let o=Date.parse(n);return Number.isFinite(o)?o:0}async function St(e,n){let o={},r="unknown";
for(let i of e)try{let c=await n(`/api/chat/slots/${encodeURIComponent(i.key)}/summary`);if(!c||typeof c!="object"){r="u\
nsupported";break}if(c.enabled===!1){r="disabled";break}o[i.key]=c,r="available"}catch{r="unsupported";break}return{summaries:o,
support:r}}var Rt=String.raw`
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
  /* Title line. The chevron is pushed to the trailing edge by the title's own
     flex growth, so it lands in the same place on every card. */
  .ow-row-heading { display: flex; min-width: 0; align-items: flex-start; gap: 8px; }
  .ow-row-chevron { margin-top: 3px; margin-left: auto; color: var(--muted); transition: transform 140ms ease; }
  .ow-row-chevron[data-expanded='true'] { transform: rotate(90deg); }
  /* State, then turn. The turn is monospace so a number reads as a coordinate
     into the transcript rather than as prose. */
  .ow-row-metaline { display: flex; min-width: 0; align-items: center; gap: 8px; margin-top: 5px; }
  .ow-row-turn {
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    white-space: nowrap;
  }
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
    .ow-conductor { min-height: 560px; border-left: 0; border-top: 1px solid var(--border); }
  }
`;import{Fragment as Ae,jsx as a,jsxs as f}from"react/jsx-runtime";var Ne=["work","loops","schedule"],It=["loops","schedul\
e","work"],Ft={work:"Sessions",loops:"Loops",schedule:"Scheduled tasks"};function yn({id:e,onPromote:n}){return a(q,{className:"\
ow-promote","aria-label":`Move ${Ft[e]} to the first column`,onClick:o=>{o.preventDefault(),o.stopPropagation(),n(e)},children:"\
Make primary"})}function xn({lastUpdated:e,refreshing:n,onRefresh:o}){let r=e?An(e):null;return f("span",{className:"ow-\
refreshbar",children:[r&&f("span",{className:"ow-updated","aria-live":"polite",children:["updated ",r]}),a(q,{className:"\
ow-refresh",onClick:i=>{i.preventDefault(),i.stopPropagation(),o()},disabled:n,"aria-label":"Refresh",title:"Refresh",children:a(
tr,{className:`ow-icon${n?" ow-spin":""}`,"aria-hidden":"true"})})]})}var kn="crew-manager.snoozed",At="crew-manager.han\
dled",Wt="crew-manager.done-collapsed",Et="crew-manager.card-collapsed",_n="crew-manager.stack-open-v2",Sn="crew-manager\
.primary-v1";function se(e,n={}){try{let o=localStorage.getItem(e);return o?JSON.parse(o):n}catch{return n}}function ne(e,n){
try{localStorage.setItem(e,JSON.stringify(n))}catch{}}function An(e,n=Date.now()){if(!e)return null;let o=Math.max(0,Math.
round((n-e)/1e3));if(o<60)return"just now";let r=Math.round(o/60);if(r<60)return`${r}m ago`;let i=Math.round(r/60);return i<
24?`${i}h ago`:`${Math.round(i/24)}d ago`}function Tt(e){return e?new Date(e).toLocaleTimeString([],{hour:"numeric",minute:"\
2-digit"}):""}function be(e,n,o){return e<=0?null:`${e} ${e===1?n:o}`}function pr(e,n=Date.now(),o=!1){let r=hn(e),i=[o?
null:be(r.sessions,"session","sessions"),be(r.prs,"PR","PRs"),be(r.issues,"issue","issues"),be(r.loops,"loop","loops"),be(
r.crons,"cron","crons"),be(r.agents,"agent","agents")].filter(d=>!!d),c=An(r.lastActivityAt,n);return c&&i.push(`last ac\
tive ${c}`),i.join(" \xB7 ")}var pe="crew-manager-conductor",gr=5e3,fr={session:"Session",approval:"Approval",agent:"Age\
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
{{tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work",card_asked_for:"You asked for",
card_where_it_stands:"Where it stands",card_suggested_next:"Suggested next",card_turn:"turn {{turn}}"};function z(e,n={}){
return fr[e].replace(/\{\{(\w+)\}\}/g,(o,r)=>n[r]??"")}var mr={followup:"Follow up",unblock:"Unblock"},Ue={"needs-you":"\
Needs you",running:"Running",done:"Done"},Rn={all:"All","needs-you":"Needs you",running:"Running",done:"Done"},wr={session:zt,
approval:Kt,agent:Zo,workflow:ar,monitor:qt,artifact:er,change:nr,issue:sr};function Ie({children:e,onActivate:n,...o}){
return a("div",{...o,role:"button",tabIndex:0,onClick:n,onKeyDown:r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),
n())},children:e})}function Pt({label:e,count:n,subtitle:o}){return f("div",{className:"ow-section-header",children:[f("\
div",{className:"ow-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow\
-section-count",children:n})]}),o&&a("p",{className:"ow-section-subtitle",children:o})]})}function hr(e){if(e.state==="n\
eeds-you"){let n=fn(e);return n?a(L,{variant:"warn",className:"ow-verb",children:mr[n]}):null}return e.state==="running"?
e.moving?f(L,{variant:"aim",children:[a(Lt,{className:"ow-icon"}),Ue[e.state]]}):a(L,{variant:"muted",children:"Queued"}):
f(L,{variant:"ok",children:[a(Ot,{className:"ow-icon"}),Ue[e.state]]})}function br({tool:e,purpose:n,busy:o,onAnswer:r,where:i}){
return f("div",{className:"ow-permission",children:[f("div",{className:"ow-permission-body",children:[f("div",{className:"\
ow-permission-head",children:[a(or,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",
children:"Waiting for your permission"})]}),f("p",{className:"ow-permission-what",children:[i&&f("span",{className:"ow-t\
runcate",children:[i," "]}),i?"wants to run ":"Wants to run ",a("code",{children:e})]}),n&&a("p",{className:"ow-permissi\
on-why",children:n})]}),f("div",{className:"ow-permission-actions",children:[a(q,{onClick:()=>r(!0),disabled:o,children:"\
Approve"}),a(q,{onClick:()=>r(!1),disabled:o,children:"Reject"})]})]})}function Ce({children:e}){return a("div",{className:"\
ow-expand",children:a("div",{className:"ow-expand-inner",children:e})})}function Nn({label:e,children:n}){let o=Xo();return f(
"div",{className:"ow-detail",role:"group","aria-labelledby":o,children:[a("div",{className:"ow-detail-label",id:o,children:e}),
n]})}var Cn=3;function Bt(e){let n=e.provenance.trim().toLowerCase();return e.references.filter(o=>o.label.trim().toLowerCase()!==
n)}function vr({item:e,busy:n,onDecide:o}){let[r,i]=_(!1),c=e.permissionInput||"",d=c.trim().split(/\s+/)[0]||e.permissionTool||
"";return f("div",{className:"ow-formal-approval",role:"presentation",onClick:g=>g.stopPropagation(),onKeyDown:g=>g.stopPropagation(),
children:[a("div",{className:"ow-formal-badge",children:"Waiting for approval"}),f("div",{className:"ow-formal-detail",children:[
e.permissionPurpose&&f("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:"__tool_us\
e_purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),f("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("span",{className:"ow-formal-val ow-formal-mon\
o",children:c||"(no input details)"})]})]}),f("div",{className:"ow-formal-actions",children:[a(q,{disabled:n,onClick:()=>o(
"approved"),children:"Allow once"}),f("span",{className:"ow-trust-wrap",children:[f(q,{disabled:n,onClick:()=>i(g=>!g),"\
aria-expanded":r,children:["Trust ",a(ae,{className:"ow-icon ow-trust-caret","data-open":r?"true":void 0,"aria-hidden":"\
true"})]}),r&&f("span",{className:"ow-trust-menu",role:"menu",children:[c&&a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:n,onClick:()=>{i(!1),o("trust_command")},children:"Trust this exact command"}),d&&f("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:n,onClick:()=>{i(!1),o("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:n,onClick:()=>{i(!1),
o("trust")},children:"Trust everything in this session"})]})]}),a(q,{className:"ow-formal-reject",disabled:n,onClick:()=>o(
"rejected"),children:"Reject"})]})]})}function yr({item:e,items:n,folded:o,onToggle:r,onOpen:i}){let d=e.references.find(
s=>s.kind==="session")?.label??e.provenance,g=hn(n),b=g.needsYou>0?"needs-you":n.some(s=>s.state==="running")?"running":
"done",R=g.needsYou>0?o?`${g.needsYou} need you`:null:Ue[b],A=pr(n,Date.now(),!0);return f(Ae,{children:[f("div",{className:"\
ow-goalcard-summary",children:[r&&a("button",{type:"button",className:"ow-goalcard-chevron","aria-expanded":!o,"aria-lab\
el":`${o?"Expand":"Collapse"} ${d}`,onClick:r,children:a(ae,{className:"ow-icon ow-init-chevron","data-open":o?void 0:"t\
rue","aria-hidden":"true"})}),f("span",{className:"ow-goalcard-header ow-goalcard-static",children:[a(zt,{className:"ow-\
icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:d})]}),a(q,{className:"\
ow-block-open",onClick:i,"aria-label":`Open ${d}`,children:"Open"}),R&&a("span",{className:`ow-goal-flag${g.needsYou>0?"\
 ow-goal-flag-warn":""}`,children:R})]}),A&&a("div",{className:"ow-goal-meta",children:A})]})}function xr({reference:e,onOpenSession:n}){
let o=wr[e.kind],r=f(Ae,{children:[a(o,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.label})]});return e.
url?a("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:i=>i.
stopPropagation(),children:r}):e.sessionKey?a(Ie,{className:"ow-reference ow-reference-link",onActivate:()=>n(e.sessionKey),
children:r}):a("span",{className:"ow-reference",children:r})}function Ht({item:e,selected:n,continuation:o,whyRanked:r,onSelect:i,
onOpenSession:c,onAnswerPermission:d,permissionBusy:g,onRetry:b,retryBusy:R,onStop:A,stopBusy:s,onPickStep:p,onSnooze:w,
onHandled:S,hideBadge:v,compact:N,headless:m,onDecideApproval:x}){let[T,$]=_(!1),C=(e.nextSteps??[]).filter(y=>y.what?.trim()),
H=(e.progress??[]).filter(y=>y.trim()),P=e.initialIntent?.trim(),U=!!p&&C.length>0,Q=!!P||H.length>0||U,I=T?C:C.slice(0,
Cn),j=v?e.state==="done"?a(Dt,{className:"ow-icon ow-row-check","aria-hidden":"true"}):null:hr(e),O=e.lastTouchedTurn?z(
"card_turn",{turn:String(e.lastTouchedTurn)}):null;return f(Ie,{onActivate:i,className:"ow-row","aria-label":e.title,"ar\
ia-pressed":n,"aria-expanded":Q?n:void 0,"data-selected":n,"data-instructed":e.instructed?"true":void 0,"data-continuati\
on":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[a("div",{className:"ow-row-layout",children:f("div",{className:"\
ow-row-content",children:[!m&&f(Ae,{children:[f("div",{className:"ow-row-heading",children:[a("span",{className:"ow-row-\
title",children:e.title}),a(ae,{className:"ow-icon ow-row-chevron","data-expanded":n?"true":void 0,"aria-hidden":"true"})]}),
(j||O)&&f("div",{className:"ow-row-metaline",children:[j,O&&a("span",{className:"ow-row-turn",children:O})]})]}),(!N||n)&&
e.summary&&!(e.nextSteps??[]).some(y=>y.what?.trim()===e.summary)&&!(n&&P===e.summary.trim())&&a("p",{className:"ow-row-\
summary",children:e.summary}),e.duplicateOf&&f(Ie,{className:"ow-row-duplicate",onActivate:()=>c(e.duplicateOf.sessionKey),
children:[a(In,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:z(`duplicate_${e.duplicateOf.
because}`,{title:e.duplicateOf.title})})]}),n&&e.relatedSessions&&e.relatedSessions.length>0&&a(Ce,{children:f("div",{className:"\
ow-related",children:[a("span",{className:"ow-related-label",children:z("related_sessions",{count:String(e.relatedSessions.
length)})}),e.relatedSessions.map(y=>f(Ie,{className:"ow-related-row",onActivate:()=>c(y.sessionKey),children:[a(In,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:y.title}),a("span",{className:"ow-related-why",
children:z(`related_${y.because}`)})]},y.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:z("re\
lated_more",{count:String(e.relatedMore)})}):null]})}),r&&a("div",{className:"ow-row-why",children:r}),!o&&f("div",{className:"\
ow-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),Bt(e).length>0&&a("span",{"aria-hidden":"\
true",children:"\xB7"}),a("span",{className:"ow-references",children:Bt(e).slice(0,3).map(y=>a(xr,{reference:y,onOpenSession:c},
`${y.kind}:${y.id}`))})]})]})}),n&&Q&&a(Ce,{children:f("div",{className:"ow-row-detail",children:[P&&a(Nn,{label:z("card\
_asked_for"),children:a("blockquote",{className:"ow-detail-quote",children:P})}),H.length>0&&a(Nn,{label:z("card_where_i\
t_stands"),children:a("ul",{className:"ow-detail-facts",children:H.map((y,ie)=>a("li",{children:y},`${ie}:${y}`))})}),U&&
f(Nn,{label:z("card_suggested_next"),children:[I.map((y,ie)=>f("button",{type:"button",className:"ow-quote-step ow-detai\
l-step",title:y.why??y.what,onClick:We=>{We.stopPropagation(),p?.(y.what)},children:[a("span",{className:"ow-detail-step\
-what",children:y.what}),y.why&&a("span",{className:"ow-detail-step-why",children:y.why}),y.expect&&a("span",{className:"\
ow-detail-step-expect",children:y.expect})]},`${ie}:${y.what}`)),C.length>Cn&&a("button",{type:"button",className:"ow-st\
eps-more",onClick:y=>{y.stopPropagation(),$(ie=>!ie)},children:T?"Show fewer":`+${C.length-Cn} more`})]})]})}),n&&e.retryPath&&
b&&a(Ce,{children:a("div",{className:"ow-retry",children:a(q,{onClick:()=>b(e.retryPath),disabled:!!R,children:"Retry"})})}),
n&&e.stopPath&&A&&a(Ce,{children:a("div",{className:"ow-retry",children:a(q,{onClick:()=>A(e.stopPath),disabled:!!s,children:s?
"Stopping\u2026":"Stop this loop"})})}),n&&e.permissionId&&x&&a(Ce,{children:a(vr,{item:e,busy:!!g,onDecide:y=>x(e,y)})}),
e.state==="needs-you"&&w&&S&&f("div",{className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-aside-b\
tn",onClick:y=>{y.stopPropagation(),w(e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",onClick:y=>{
y.stopPropagation(),S(e.id,e.updatedAt)},children:"Handled"})]})]})}var kr=["unblock","followup","running","done"],_r={unblock:{
label:"Unblock",cls:"ow-lane-unblock"},followup:{label:"Follow up",cls:"ow-lane-followup"}};function Sr(e){return e.state===
"done"?"done":e.state==="running"?"running":fn(e)??"unblock"}function Rr({items:e,selectedId:n,onSelect:o,onOpenSession:r,
onAnswerPermission:i,onDecideApproval:c,permissionBusy:d,onRetry:g,retryBusy:b,onPickStep:R,onSnooze:A,onHandled:s,doneTitles:p}){
let[w,S]=_(!1),v=new Map;for(let N of e){let m=Sr(N),x=v.get(m);x?x.push(N):v.set(m,[N])}return f(Ae,{children:[kr.filter(
N=>v.has(N)).map(N=>{let m=v.get(N),x=N==="unblock"||N==="followup"?_r[N]:null,T=x?m.map(C=>C.action!=="resume"?Re(ue(C),
z):""):[],$=x&&T.length>0&&T.every(C=>C&&C===T[0])?T[0]:void 0;return f("div",{className:"ow-lane",children:[x&&f("div",
{className:"ow-lane-head",children:[a("span",{className:`ow-lane-badge ${x.cls}`,children:x.label}),$&&a("span",{className:"\
ow-lane-reason",children:$})]}),m.map(C=>a(Ht,{item:C,hideBadge:!0,compact:!0,selected:n===C.id,continuation:!0,whyRanked:$?
void 0:C.state==="needs-you"&&C.action!=="resume"?Re(ue(C),z):void 0,onSelect:()=>o(C),onOpenSession:r,onAnswerPermission:i,
onDecideApproval:c,permissionBusy:d,onRetry:g,retryBusy:b,onPickStep:R,onSnooze:A,onHandled:s},C.id))]},N)}),!v.has("don\
e")&&p&&p.length>0&&f("div",{className:"ow-lane ow-lane-done",children:[f("button",{type:"button",className:"ow-goals-to\
ggle","aria-expanded":w,onClick:()=>S(N=>!N),children:[a(ae,{className:"ow-icon","data-open":w?"true":void 0,"aria-hidde\
n":"true"}),p.length," done"]}),w&&a("ul",{className:"ow-done-list",children:p.map(N=>f("li",{className:"ow-row-goal-don\
e",children:[a(Dt,{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate",children:N})]},N))})]})]})}
function He({title:e,items:n,selectedId:o,onSelect:r,onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,permissionBusy:g,
onRetry:b,retryBusy:R,onStop:A,stopBusy:s,onPickStep:p,onSnooze:w,onHandled:S,footer:v,collapsed:N,onToggleCollapsed:m,doneBySession:x,
collapsedCards:T,onToggleCard:$,subtitle:C,hideHeader:H,emptyLabel:P}){let U=kt(n),Q=I=>{let j=I.header==="session"?!!T?.[I.
key]:!1;return f("div",{className:`ow-block${I.header==="session"?" ow-goalcard":""}`,"data-grouped":I.header?"true":void 0,
"data-open":I.header==="session"&&!j?"true":void 0,children:[I.header==="session"&&I.sessionKey&&a(yr,{item:I.items[0],items:I.
items,folded:j,onToggle:$?()=>$(I.key,!j):void 0,onOpen:()=>i(I.sessionKey)}),I.header==="session"?!j&&a(Rr,{items:I.items,
doneTitles:I.sessionKey?x?.[I.sessionKey]:void 0,selectedId:o,onSelect:r,onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,
permissionBusy:g,onRetry:b,retryBusy:R,onPickStep:p,onSnooze:w,onHandled:S}):I.items.map(O=>a(Ht,{item:O,selected:o===O.
id,whyRanked:O.state==="needs-you"&&O.action!=="resume"?Re(ue(O),z):void 0,onSelect:()=>r(O),onOpenSession:i,onAnswerPermission:c,
onDecideApproval:d,permissionBusy:g,onRetry:b,retryBusy:R,onStop:A,stopBusy:s,onPickStep:p,onSnooze:w,onHandled:S},O.id))]},
I.key)};return f("section",{className:"ow-section","aria-label":e,children:[H?null:m?f(Ie,{onActivate:m,className:"ow-se\
ction-toggle",children:[a(Pt,{label:e,count:n.length,subtitle:C}),a(ae,{className:"ow-icon ow-section-chevron","data-ope\
n":N?void 0:"true","aria-hidden":"true"})]}):a(Pt,{label:e,count:n.length,subtitle:C}),N?null:a("div",{className:"ow-sec\
tion-list",children:U.length===0?a("p",{className:"ow-section-empty",children:P}):U.map(Q)}),v]})}function Nr(e,n,o=[]){
let r=ut(n,z),i=o.length?[`Noticed since you last spoke (${o.length}):`,...o.map(g=>`- ${g}`),"Mention these only if the\
y matter to what the user asked."]:[];if(!e)return["Crew Manager context: workspace overview.",...r,...i,"Answer the use\
r about the state of their work. This is a conversation, not an action channel."].join(`
`);let c=e.references.map(g=>`${g.kind}: ${g.label} (${g.id})`).join(`
`),d=[e.stalledFor?`Silent for ${ce(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(g=>!!g);return[`Crew Manager context: ${e.title}`,...r,`Selected item: ${e.title}`,
`State: ${Ue[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...d.length>0?[`Why it is on the board:
${d.join(`
`)}`]:[],`References:
${c}`,...i,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(g=>!!g).join(`
`)}var $t="crew-manager.panel-widths";function Cr(e,n){let o=e?.first_seen;if(!o)return[];let r=typeof n=="number"?n<=1e10?
n*1e3:n:n?Date.parse(n):NaN;if(!Number.isFinite(r))return[];let i=[];for(let d of e?.stalls??[]){let g=o[d.key];typeof g==
"number"&&(g*1e3<=r||i.push(d.reason?`${d.label} went quiet \u2014 ${d.reason}`:`${d.label} went quiet after ${ce(d.silent_secs)}`))}
for(let d of e?.error_loops??[]){let g=o[d.key];typeof g=="number"&&(g*1e3<=r||i.push(`${d.label} repeated the same ${d.
tool} failure ${d.repeats} times`))}let c=5;return i.length>c?[...i.slice(0,c),`and ${i.length-c} more`]:i}var J={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function je(e,n,o,r,i){let c=Math.min(i,Math.max(o,n-
r));return Math.max(o,Math.min(c,e))}function Mt({side:e,containerRef:n,min:o,reserve:r,max:i,value:c,onChange:d,label:g}){
let b=(s,p)=>{let w=p.getBoundingClientRect(),S=e==="start"?s-w.left:w.right-s;return je(S,p.clientWidth,o,r,i)};return a(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":g,tabIndex:0,onPointerDown:s=>{
let p=n.current;if(!p)return;s.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let w=v=>d(b(v.clientX,p)),S=()=>{window.removeEventListener("pointermove",w),window.removeEventListener("pointeru\
p",S),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",w),window.addEventListener(
"pointerup",S)},onKeyDown:s=>{if(s.key!=="ArrowLeft"&&s.key!=="ArrowRight")return;let p=n.current;if(!p)return;s.preventDefault();
let w=(s.shiftKey?48:16)*(s.key==="ArrowRight"?1:-1),S=c??(e==="start"?p.clientWidth/2:Math.round(p.clientWidth*.3));d(je(
S+(e==="start"?w:-w),p.clientWidth,o,r,i))}})}function Ir(){let e=ir(),n=V(e);n.current=e;let o=lr(),r=dr(),[i,c]=_("all"),
[d,g]=_(()=>{let t=se(Sn,null);return t&&Ne.includes(t)?t:"work"}),[b,R]=_(()=>{let t=se(_n,null)??"loops",l=Ne.includes(
t)?t:"loops",u=se(Sn,null),h=u&&Ne.includes(u)?u:"work";return l===h?It.find(k=>k!==h)??null:l}),A=D(t=>{R(l=>{let u=l===
t?null:t;return ne(_n,u),u})},[]),[s,p]=_(null),[w,S]=_("session"),[v,N]=_(null),[m,x]=_(null),[T,$]=_({}),[C,H]=_("unkn\
own"),P=V("unknown"),U=V(new Map),[Q,I]=_({}),[j,O]=_(null),[y,ie]=_({}),[We,Ut]=_([]),[X,Ee]=_(null),[ge,Wn]=_(null),[fe,
En]=_(null),[Tn,Pn]=_(()=>se(kn)),[Bn,jt]=_(()=>se(At)),Ge=V(null),Ye=V(null),[te,Ve]=_(()=>se($t,{work:null,conductor:null}));
Y(()=>{ne($t,te)},[te]),Y(()=>{let t=()=>Ve(l=>{let u=Ye.current?.clientWidth??0,h=Ge.current?.clientWidth??0;return{work:l.
work==null||u===0?l.work:je(l.work,u,J.workMin,J.railReserve,1/0),conductor:l.conductor==null||h===0?l.conductor:je(l.conductor,
h,J.conductorMin,J.mainReserve,J.conductorMax)}});return t(),window.addEventListener("resize",t),()=>window.removeEventListener(
"resize",t)},[]);let[Te,Gt]=_(()=>se(Et)),[Yt,Vt]=_(()=>se(Wt,null)??!0),[$n,Mn]=_({}),[Kn,Je]=_([]),[Qe,Jt]=_([]),[Qt,Xe]=_(
!1),ve=D(t=>{if(t===d)return;let l=b===t?It.find(u=>u!==t)??null:b;ne(Sn,t),ne(_n,l),g(t),R(l)},[d,b]),Xt=D((t,l)=>{t.dataTransfer.
setData("text/x-crew-panel",l),t.dataTransfer.effectAllowed="move";let u=t.currentTarget.querySelector("summary");if(!u)
return;let h=u.getBoundingClientRect();t.dataTransfer.setDragImage(u,Math.min(Math.max(t.clientX-h.left,0),h.width),Math.
min(Math.max(t.clientY-h.top,0),h.height))},[]),Zt=D(t=>{t.preventDefault(),Xe(!1);let l=t.dataTransfer.getData("text/x-\
crew-panel");!l||!Ne.includes(l)||ve(l)},[ve]),Dn=F(()=>Ne.filter(t=>t!==d),[d]),eo=b&&b!==d?String(Dn.indexOf(b)):"none",
Ze=t=>{let l=t===d;return{className:"ow-card ow-stack-card",open:l||b===t,draggable:!0,"data-panel":t,"data-primary":l?"\
true":"false","data-rail-index":l?void 0:Dn.indexOf(t),"data-dragover":l&&Qt?"true":void 0,onDragStart:u=>Xt(u,t),onDragOver:l?
u=>{u.preventDefault(),Xe(!0)}:void 0,onDragLeave:l?()=>Xe(!1):void 0,onDrop:l?Zt:void 0}},On=V(!0),[no,Ln]=_(!0),[zn,en]=_(
null),[nn,to]=_(null),[ye,qn]=_(!1),[oo,ro]=_(!1),[Fn,Z]=_(null),B=V(!0),xe=V(0),tn=V(!1);Y(()=>(B.current=!0,()=>{B.current=
!1,xe.current+=1}),[]);let W=D(async()=>{let t=++xe.current,l=n.current;try{let[u,h,k,G,ze,qe,E,re]=await Promise.all([l.
get("/api/chat/slots"),l.get("/api/approvals"),l.get("/api/spawn"),l.get("/api/workflows/runs"),l.get("/api/crons"),l.get(
"/api/artifacts"),l.get("/api/autonudge").catch(()=>({loops:[]})),l.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);
if(!B.current||t!==xe.current)return;x({slots:Array.isArray(u)?u:[],approvals:Array.isArray(h)?h:[],agents:Array.isArray(
k.agents)?k.agents:[],workflows:Array.isArray(G.runs)?G.runs:[],crons:Array.isArray(ze.jobs)?ze.jobs:[],artifacts:Array.
isArray(qe.artifacts)?qe.artifacts:[],loops:Array.isArray(E?.loops)?E.loops:[]}),Jt(Array.isArray(re?.runs)?re.runs:[]),
en(null),to(Date.now())}catch(u){B.current&&t===xe.current&&en(u instanceof Error?u:new Error("Unable to load Crew Manag\
er sources"))}finally{B.current&&t===xe.current&&Ln(!1)}},[]);Y(()=>{W();let t=window.setInterval(()=>{W()},gr);return()=>window.
clearInterval(t)},[W]);let so=()=>{Ln(!0),en(null),W()},on=D(()=>{ye||(qn(!0),W().finally(()=>{B.current&&qn(!1)}))},[W,
ye]);Y(()=>{if(!m||P.current==="unsupported"||P.current==="disabled")return;let t=_t(m.slots,pe,Date.now(),u=>U.current.
get(u.key)===vn(u));if(t.length===0)return;let l=!1;return(async()=>{let{summaries:u,support:h}=await St(t,k=>n.current.
get(k));if(!(l||!B.current)&&(P.current=h,H(h),h==="available")){for(let k of t)u[k.key]&&U.current.set(k.key,vn(k));$(k=>({
...k,...u}))}})(),()=>{l=!0}},[m]),Y(()=>{if(!m||!On.current)return;let t=!1;return(async()=>{try{let l=await n.current.
get("/api/apps/crew-manager/stalls");if(t||!B.current)return;let u={};for(let k of l?.stalls??[])k?.key&&(u[k.key]=k);I(
u);let h={};for(let k of l?.error_loops??[])k?.key&&(h[k.key]=k);Mn(h),O(l??null);try{let k=await n.current.get("/api/ap\
ps/crew-manager/assigned");!t&&B.current&&Je(k?.available&&Array.isArray(k.rows)?k.rows:[])}catch{B.current&&Je([])}}catch{
On.current=!1,B.current&&(I({}),Mn({}),O(null),Je([]))}})(),()=>{t=!0}},[m]);let Hn=F(()=>wt(xt({...m??{slots:[],approvals:[],
agents:[],workflows:[],crons:[],artifacts:[],loops:[]},assigned:Kn},z,T,Q,$n),y),[m,T,Q,$n,y,Kn]),Pe=F(()=>bt(Hn,Tn,Bn),
[Hn,Tn,Bn]),K=F(()=>Pe.items.filter(t=>vt(t)),[Pe]),Be=F(()=>wn(K),[K]),Un=F(()=>{let t={};for(let l of K){if(l.state!==
"done"||!l.sessionKey)continue;let u=t[l.sessionKey];u?u.push(l.title):t[l.sessionKey]=[l.title]}return t},[K]),oe=F(()=>K.
find(t=>t.id===s)??null,[K,s]),ke=F(()=>i==="all"?K:K.filter(t=>t.state===i),[i,K]);Y(()=>r(Be["needs-you"]),[Be,r]),Y(()=>{
s&&!K.some(t=>t.id===s)&&p(null)},[K,s]);let le=m?.slots.find(t=>t.key===pe),ao=!!(le||oo),jn=V(!1);Y(()=>{let t=le;if(!t||
jn.current||t.agent)return;jn.current=!0;let l=n.current;l.get("/api/apps/crew-manager/conductor-agent").then(u=>u?.available&&
u.agent?u.agent:null).catch(()=>null).then(u=>{if(!(!u||!B.current))return l.post(`/api/chat/slots/${encodeURIComponent(
pe)}/agent`,{agent:u}).then(()=>{W()})}).catch(()=>{})},[le,W]),Y(()=>{!m||le||tn.current||(tn.current=!0,e.get("/api/ap\
ps/crew-manager/conductor-agent").then(t=>t?.available&&t.agent?t.agent:null).catch(()=>null).then(t=>e.post("/api/chat/\
slots",{name:pe,title:"Conductor",...t?{agent:t}:{}})).then(()=>{B.current&&(ro(!0),W())}).catch(t=>{B.current&&(tn.current=
!1,Z(t instanceof Error?`Conductor session could not be created: ${t.message}`:"Conductor session could not be created"))}))},
[e,le,W,m]);let Gn=F(()=>it(m?.approvals??[],We,t=>K.find(l=>l.sessionKey===t)?.title??m?.slots?.find(l=>l.key===t)?.title??
t),[K,m,We]),me=oe&&!oe.permissionId?oe:null,rn=F(()=>{let t=(m?.loops??[]).filter(u=>u&&u.active!==!1&&u.slot_key);if(t.
length===0)return[];let l=new Map;for(let u of K)for(let h of u.references)h.kind!=="session"||!h.id||h.label&&!l.has(h.
id)&&l.set(h.id,h.label);return t.map(u=>{let h=Number(u.cycle_count)||0,k=Number(u.max_cycles)||0;return{key:u.slot_key,
title:l.get(u.slot_key)??u.slot_key,progress:k>0?`${h}/${k}`:`${h} ${h===1?"cycle":"cycles"}`,remaining:k>0?Math.max(0,k-
h):null,instruction:(u.message??"").replace(/\s+/g," ").trim(),lastFire:M(u.last_fire_ts)}})},[m,K]),we=F(()=>{let t=new Date;
t.setHours(0,0,0,0);let l=t.getTime(),u=l+864e5,h=m?.crons??[],k=new Map;for(let E of Qe){let re=M(E.started_at);if(!E.job_id||
re<l||re>=u)continue;let ee=k.get(E.job_id)??{count:0,failed:0,last:0};ee.count+=1,E.status&&E.status!=="success"&&(ee.failed+=
1),ee.last=Math.max(ee.last,re),k.set(E.job_id,ee)}let G=h.map(E=>{let re=k.get(E.id),ee=M(E.next_run_ts),go=ee>=l&&ee<u;
return{job:E,ran:re,next:ee,dueToday:go}}).filter(E=>E.ran||E.dueToday||E.job.is_running),ze=G.filter(E=>E.ran&&E.ran.failed===
0).length,qe=G.filter(E=>E.ran&&E.ran.failed>0).length;return{rows:G,done:ze,failed:qe,total:G.length,historyKnown:Qe.length>
0}},[m,Qe]),_e=D(async(t,l)=>{if(!X){Ee(t),Z(null);try{await n.current.post(`/api/approvals/${encodeURIComponent(t)}/${l?
"approve":"reject"}`,{}),W()}catch(u){Z(u instanceof Error?`Could not answer that request: ${u.message}`:"Could not answ\
er that request"),W()}finally{B.current&&Ee(null)}}},[W,X]),$e=D(async(t,l)=>{if(!(X||!t.permissionId||!t.sessionKey)){Ee(
t.permissionId),Z(null);try{await n.current.post(`/api/chat/slots/${encodeURIComponent(t.sessionKey)}/approve`,{action:l,
request_id:t.permissionId}),W()}catch(u){Z(u instanceof Error?`Could not answer that request: ${u.message}`:"Could not a\
nswer that request"),W()}finally{B.current&&Ee(null)}}},[W,X]),io=D(t=>{Pn(l=>{let u=Object.fromEntries(Object.entries(l).
filter(([,h])=>h>Date.now()));return u[t]=Date.now()+ht,ne(kn,u),u}),p(null)},[]),lo=D((t,l)=>{jt(u=>{let h={...u,[t]:l};
return ne(At,h),h}),p(null)},[]),co=D(()=>{Pn({}),ne(kn,{})},[]),uo=D(()=>{Vt(t=>(ne(Wt,!t),!t))},[]),Me=D(async t=>{if(!ge){
Wn(t),Z(null);try{await n.current.post(t,{}),W()}catch(l){Z(l instanceof Error?`Could not re-run it: ${l.message}`:"Coul\
d not re-run it"),W()}finally{B.current&&Wn(null)}}},[W,ge]),Ke=D(async t=>{if(!fe){En(t),Z(null);try{await n.current.del(
t),N("Stopped the monitor loop. Re-arming it is done from the session itself."),W()}catch(l){let u=l instanceof Error?l.
message:"";/404|not found/i.test(u)?N("That loop had already stopped."):Z(u?`Could not stop it: ${u}`:"Could not stop it"),
W()}finally{B.current&&En(null)}}},[W,fe]),Se=D(async t=>{let l=oe&&!oe.permissionId?oe:null;if(w==="session"&&l?.sessionKey){
let u=l.sessionKey;if(await n.current.post("/api/chat",{message:t,slot:u}).catch(h=>{if(!(h instanceof SyntaxError))throw h}),
!B.current)return;ie(h=>({...h,[l.id]:Date.now()})),Ut(h=>h.includes(u)?h:[...h,u]),N(`Sent new instructions to ${l.title}`),
p(null),W();return}await n.current.post(`/api/chat/slots/${encodeURIComponent(pe)}/context`,{content:Nr(oe,K,Cr(j,le?.last_ts)),
source:"crew-manager",ephemeral:!0}).catch(()=>{}),await n.current.post("/api/chat",{message:t,slot:pe}).catch(u=>{if(!(u instanceof
SyntaxError))throw u})},[oe,K,W,w,j,le]),sn={"needs-you":ke.filter(t=>t.state==="needs-you"),running:ke.filter(t=>t.state===
"running"),done:ke.filter(t=>t.state==="done")},De=D((t,l)=>{Gt(u=>{let h={...u,[t]:l};return ne(Et,h),h})},[]),Oe=t=>o(
`/chat?sid=${encodeURIComponent(t)}`),Le=t=>{p(l=>l===t.id?null:t.id),N(null),S("session")},po=me?f("div",{className:"ow\
-quote ow-quote-docked",children:[f("div",{className:"ow-quote-body",children:[me.sessionKey?a("button",{type:"button",className:"\
ow-scope-toggle","aria-pressed":w==="conductor","aria-label":w==="session"?"Sending to this session. Activate to send to\
 the Conductor instead.":"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>S(t=>t==="ses\
sion"?"conductor":"session"),children:w==="session"?"Instructing":"To Conductor"}):a("span",{className:"ow-eyebrow",children:"\
Quoted"}),a("span",{className:"ow-quote-title",title:me.title,children:me.title})]}),a(q,{className:"ow-quote-clear","ar\
ia-label":"Remove the quoted work item",onClick:()=>{p(null),N(null)},children:"Clear"})]}):null;return f("div",{className:"\
ow-root","data-crew-manager-shell":"quiet-split",children:[a("style",{children:Rt}),a("div",{className:"ow-titlebar",children:a(
ur,{title:f("span",{className:"ow-title-line",children:["Crew Manager",a("span",{className:"ow-beta","aria-label":"Beta \
preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still running, and what finished recently."})}),
a("div",{className:"ow-body",children:f("div",{className:"ow-layout",ref:Ge,style:te.conductor!=null?{"--ow-conductor-w":`${te.
conductor}px`}:void 0,children:[f("div",{className:"ow-main","data-open-row":eo,ref:Ye,style:te.work!=null?{"--ow-work-w":`${te.
work}px`}:void 0,children:[f("details",{...Ze("work"),"aria-label":"Work",children:[f("summary",{onClick:t=>{t.preventDefault(),
d!=="work"&&A("work")},children:[f("span",{className:"ow-stack-title",children:[a(ae,{className:"ow-icon ow-stack-chevro\
n"}),a(In,{className:"ow-icon"}),Ft.work]}),f("span",{className:"ow-stack-actions",children:[a(L,{variant:"muted",children:Be.
all}),d==="work"?a(xn,{lastUpdated:nn,refreshing:ye,onRefresh:on}):a(yn,{id:"work",onPromote:ve})]})]}),f("div",{className:"\
ow-listcard-tools",children:[a("p",{className:"ow-listcard-sub",children:"Grouped by what each session needs from you"}),
a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.keys(Rn).map(t=>f(q,{onClick:()=>c(
t),"aria-pressed":i===t,"data-selected":i===t,className:"ow-filter",children:[Rn[t],a("span",{className:"ow-count",children:Be[t]})]},
t))})]}),a("main",{className:"ow-work",children:a("div",{className:"ow-work-inner",children:no?a(Nt,{rows:7}):zn&&!m?a(Ct,
{icon:a(Kt,{className:"ow-icon"}),title:"Crew Manager could not load the work view",subtitle:zn.message,action:a(q,{onClick:so,
children:"Try again"})}):ke.length===0?a(Ct,{icon:a(rr,{className:"ow-icon"}),title:"No matching work",subtitle:"Change \
the filter to see sessions in another state."}):i==="all"?f(Ae,{children:[a(He,{title:"Needs you",subtitle:"Waiting on a\
 decision or reply from you",items:sn["needs-you"],doneBySession:Un,selectedId:s,onSelect:Le,onSnooze:io,onHandled:lo,footer:Pe.
snoozedCount>0?f("button",{type:"button",className:"ow-aside-note",onClick:co,children:[Pe.snoozedCount," set aside for \
later \u2014 bring back"]}):void 0,onOpenSession:Oe,onAnswerPermission:(t,l)=>{_e(t,l)},onDecideApproval:(t,l)=>{$e(t,l)},
permissionBusy:X!==null,onRetry:t=>{Me(t)},retryBusy:ge!==null,onStop:t=>{Ke(t)},stopBusy:fe!==null,onPickStep:t=>{Se(t)},
collapsedCards:Te,onToggleCard:De,emptyLabel:"Nothing needs your input right now."}),a(He,{title:"In progress",subtitle:"\
Being worked on right now",items:sn.running,doneBySession:Un,selectedId:s,onSelect:Le,onOpenSession:Oe,onAnswerPermission:(t,l)=>{
_e(t,l)},onDecideApproval:(t,l)=>{$e(t,l)},permissionBusy:X!==null,onRetry:t=>{Me(t)},retryBusy:ge!==null,onStop:t=>{Ke(
t)},stopBusy:fe!==null,onPickStep:t=>{Se(t)},collapsedCards:Te,onToggleCard:De,emptyLabel:"Nothing is in progress right \
now."}),a(He,{title:"Done recently",subtitle:"Finished in the last few days",items:sn.done,selectedId:s,onSelect:Le,collapsed:Yt,
onToggleCollapsed:uo,onOpenSession:Oe,onAnswerPermission:(t,l)=>{_e(t,l)},onDecideApproval:(t,l)=>{$e(t,l)},permissionBusy:X!==
null,onRetry:t=>{Me(t)},retryBusy:ge!==null,onStop:t=>{Ke(t)},stopBusy:fe!==null,onPickStep:t=>{Se(t)},collapsedCards:Te,
onToggleCard:De,emptyLabel:"No recent completed work."})]}):a(He,{title:Rn[i],items:ke,selectedId:s,onSelect:Le,onOpenSession:Oe,
onAnswerPermission:(t,l)=>{_e(t,l)},onDecideApproval:(t,l)=>{$e(t,l)},permissionBusy:X!==null,onRetry:t=>{Me(t)},retryBusy:ge!==
null,onStop:t=>{Ke(t)},stopBusy:fe!==null,onPickStep:t=>{Se(t)},collapsedCards:Te,onToggleCard:De,emptyLabel:"No matchin\
g work"})})})]}),f("details",{...Ze("loops"),children:[f("summary",{onClick:t=>{t.preventDefault(),d!=="loops"&&A("loops")},
children:[f("span",{className:"ow-stack-title",children:[a(ae,{className:"ow-icon ow-stack-chevron"}),a(qt,{className:"o\
w-icon"}),"Loops"]}),f("span",{className:"ow-stack-actions",children:[a(L,{variant:"muted",children:rn.length}),d==="loo\
ps"?a(xn,{lastUpdated:nn,refreshing:ye,onRefresh:on}):a(yn,{id:"loops",onPromote:ve})]})]}),a("p",{className:"ow-stack-s\
ub",children:"Sessions repeating a goal until it is done"}),a("div",{className:"ow-stack-body",children:rn.length===0?a(
"p",{className:"ow-stack-empty",children:"No loop is running right now."}):rn.map(t=>{let l=An(t.lastFire),u=[l&&`last t\
ick ${l}`,t.remaining!==null&&`${t.remaining} remaining`].filter(Boolean).join(" \xB7 ");return f("div",{className:"ow-m\
ini",children:[a("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),f("div",{children:[f("div",{className:"\
ow-mini-title",children:[t.title,a("span",{className:"ow-mini-chip",children:t.progress})]}),t.instruction&&a("div",{className:"\
ow-mini-desc",title:t.instruction,children:t.instruction}),u&&a("div",{className:"ow-mini-when",children:u})]}),a(L,{variant:"\
ok",children:"Active"})]},t.key)})})]}),f("details",{...Ze("schedule"),children:[f("summary",{onClick:t=>{t.preventDefault(),
d!=="schedule"&&A("schedule")},children:[f("span",{className:"ow-stack-title",children:[a(ae,{className:"ow-icon ow-stac\
k-chevron"}),a(Lt,{className:"ow-icon"}),"Scheduled tasks"]}),f("span",{className:"ow-stack-actions",children:[f(L,{variant:we.
failed>0?"err":"muted",children:[we.done,"/",we.total," today"]}),d==="schedule"?a(xn,{lastUpdated:nn,refreshing:ye,onRefresh:on}):
a(yn,{id:"schedule",onPromote:ve})]})]}),a("p",{className:"ow-stack-sub",children:we.historyKnown?"Today's runs only \u2014 j\
obs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be low"}),a("div",{className:"\
ow-stack-body",children:we.rows.length===0?a("p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):
we.rows.map(({job:t,ran:l,next:u,dueToday:h})=>{let k=!!(l&&l.failed>0),G=[l&&`ran today ${Tt(l.last)}${l.count>1?` (${l.
count}x)`:""}`,h&&u?`next ${Tt(u)}`:null].filter(Boolean).join(" \xB7 ");return f("div",{className:"ow-mini",children:[a(
"span",{className:"ow-mini-rail",style:{background:k?"var(--danger)":t.enabled===!1?"var(--muted)":"var(--warn)"}}),f("d\
iv",{children:[a("div",{className:"ow-mini-title",children:t.name}),t.schedule&&f("div",{className:"ow-mini-desc",children:[
t.schedule,t.cron_expr&&a("span",{className:"ow-mini-chip",children:t.cron_expr})]}),G&&a("div",{className:"ow-mini-when",
children:G})]}),t.is_running?a(L,{variant:"aim",children:"Running"}):k?a(L,{variant:"err",children:"Failed"}):t.enabled===
!1?a(L,{variant:"muted",children:"Paused"}):l?a(L,{variant:"ok",children:"Success"}):a(L,{variant:"warn",children:"Pendi\
ng"})]},t.id)})})]}),a(Mt,{side:"start",containerRef:Ye,min:J.workMin,reserve:J.railReserve,max:1/0,value:te.work,onChange:t=>Ve(
l=>({...l,work:t})),label:"Resize the work column"})]}),a(Mt,{side:"end",containerRef:Ge,min:J.conductorMin,reserve:J.mainReserve,
max:J.conductorMax,value:te.conductor,onChange:t=>Ve(l=>({...l,conductor:t})),label:"Resize the Conductor panel"}),f("as\
ide",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:f("d\
iv",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!me&&a("span",{className:"ow-conductor-sub",
children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:ao?f("div",{className:"ow-chat-pa\
nel",children:[Gn.length>0&&a("div",{className:"ow-permissions",role:"alert",children:Gn.map(t=>a(br,{tool:t.tool,purpose:t.
purpose,where:t.sessionLabel,busy:X!==null,onAnswer:l=>{_e(t.id,l)}},t.id))}),v&&f("div",{className:"ow-conductor-receip\
t",role:"status",children:[a(Ot,{className:"ow-icon"}),v]}),Fn&&a("div",{className:"ow-chat-error",role:"alert",children:Fn}),
a("div",{className:"ow-embed",children:a(cr,{slotKey:pe,frameless:!0,startAtBottom:!0,slotControls:!0,placeholder:me?.sessionKey&&
w==="session"?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:Se,aboveComposer:po})})]}):a(
"div",{className:"ow-chat-loading",children:a(Nt,{rows:4})})})]})]})})]})}export{Ir as default,Cr as noticedSinceLastTurn};
