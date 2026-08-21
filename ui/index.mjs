import{useCallback as $,useEffect as U,useId as Jo,useMemo as F,useRef as G,useState as S}from"react";import{AlertTriangle as $n,
Bot as Qo,Check as Xo,ChevronRight as pe,Check as Dn,Clock as Zo,Package as er,ExternalLink as tr,MessageSquare as nr,RefreshCw as or,
Shield as rr,Waves as On,Search as sr,Tag as ar,Users as It,Zap as ir}from"lucide-react";import{useAppApi as lr,useNavigate as dr,
useNavBadge as cr,ChatEmbed as ur}from"@kirocrew/app-sdk";import{Badge as Q,Btn as z,ContentSkeleton as An,EmptyState as Cn,
PageHeader as pr}from"@kirocrew/app-sdk/ui";function le(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let o=Math.floor(t/60),s=t%
60;return s===0?`${o} hour${o===1?"":"s"}`:`${o}h ${s}m`}function po(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function ln(e,t,o){let s=new Set(t.filter(Boolean));if(s.size===0)return[];let i=new Set,
c=[];for(let d of e){let w=d.slot;!w||!s.has(w)||!d.id||i.has(d.id)||(i.add(d.id),c.push({id:d.id,sessionKey:w,sessionLabel:o(
w),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return c}var Yt=5,Vt={"needs-you":0,running:1,done:2};function M(e){if(typeof e==
"number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function go(e,t){if(e.paused)
return"";let o=M(e.next_run_ts);if(!o)return"";let s=Math.round((o-t)/1e3);return s<=0?"":le(s)}var Jt=72;function ie(e,t){
let o=e?.replace(/\s+/g," ").trim();if(!o)return t;let i=(o.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||o).replace(
/[.;,]$/,"");if(i.length<=Jt)return i;let c=i.slice(0,Jt),d=c.lastIndexOf(" ");return`${(d>24?c.slice(0,d):c).trim()}\u2026`}
function me(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var wo=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
fo=/^\((?:code|diff|widget|image)\)$/,ho=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
mo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,bo=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
vo=/[?？]["'”’)\]]*$/;function dn(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||fo.test(t)||wo.test(
t)?null:t}function pt(e){if(!e.waiting_for_input)return null;let t=dn(e);return!t||ho.test(t)||mo.test(t)?null:bo.test(t)||
vo.test(t)?t:null}function Qt(e){return e.pending_approval||pt(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":"done"}function xo(e,t){if(e.pending_approval)return t("approval_waiting");let o=pt(e);return o||(e.running||e.
subagents_running||e.orchestrating?t("work_in_progress"):me(e)?t("linked_change_issue"):dn(e)??t("recent_work_ready"))}function lt(e,t){
let o=e.project||e.workspace||e.agent;return o&&o.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop()||t("session")}function yo(e){
return e.pending_approval?"review-approval":pt(e)?"reply":"open"}function cn(e){return(e.source_links??[]).map(t=>({number:String(
t.number??""),ref:{kind:t.kind==="issue"?"issue":"change",id:t.url,label:t.kind==="issue"?`issue #${t.number}`:`${t.provider===
"gitlab"?"MR":"PR"} #${t.number}`,url:t.url,sessionKey:e.key,status:po(t)}}))}function ko(e,t){let o=cn(e).map(s=>s.ref);
return{id:`session:${e.key}`,title:e.title||t("untitled_work"),summary:xo(e,t),state:Qt(e),moving:Qt(e)==="running"||void 0,
issue:me(e),updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lt(e,t),queuedBehind:e.queue_depth||
void 0,changeBlocked:me(e)||void 0,action:yo(e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.
key},...o]}}function gt(e,t){e.references.some(o=>o.kind===t.kind&&o.id===t.id)||e.references.push(t)}function un(e){return(e.
source||"").toLowerCase()==="subagent"}function _o(e,t,o){let s=un(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,
M(t.ts)),e.summary=o(s?"subagent_gate_waiting":"approval_waiting"),e.approvalKind=s?"subagent":"tool",e.action="review-a\
pproval",e.permissionId=t.id,e.permissionTool=t.tool||t.source,e.permissionPurpose=t.tool_purpose,e.permissionInput=t.tool_input,
gt(e,{kind:"approval",id:t.id,label:t.tool||t.source||o("approval"),sessionKey:t.slot||e.sessionKey})}function So(e,t,o){
e.updatedAt=Math.max(e.updatedAt,M(t.started)),e.issue||=!!(t.done&&(t.error||t.outcome==="failed")),t.done?(t.error||t.
outcome==="failed")&&e.state!=="needs-you"&&(e.summary=o("agent_failed",{task:t.task})):e.state!=="needs-you"&&(e.state=
"running",e.summary=o("work_in_progress")),gt(e,{kind:"agent",id:t.id,label:t.agent||o("agent"),sessionKey:t.parent||e.sessionKey})}
function Ro(e,t,o){e.issue||=t.status==="failed",t.status==="running"&&e.state!=="needs-you"&&(e.state="running"),t.status===
"failed"&&e.state!=="needs-you"&&(e.summary=o("workflow_failed",{name:t.name})),gt(e,{kind:"workflow",id:t.run_id,label:t.
name||t.run_id,sessionKey:t.session_key||e.sessionKey})}function No(e,t){if(t.pending_approval)return"needs-you";switch(e.
state){case"needs-you":return"needs-you";case"done":case"dropped":return"done";case"in-progress":return"running";default:
return null}}function Io(e,t,o){return!(t.running||t.subagents_running||t.orchestrating)?!1:e===o}function Ao(e){let t=null,
o=-1;for(let s of e){let i=s.last_touched_turn??0;i>o&&(o=i,t=s)}return t}function Co(e,t){let o=e.next_steps?.find(i=>i.what?.trim())?.what?.trim();if(o)return o;let s=[...e.progress??[]].reverse().
find(i=>i.trim());return s?s.trim():e.initial_intent?.trim()||t("work_in_progress")}var Wo=3;function To(e){return[e.title??
"",e.initial_intent??"",...e.progress??[],...(e.next_steps??[]).map(t=>t.what??"")].join(" ")}function Po(e,t){if(!t)return!1;
let o=t.replace(/[.*+?^${}()|[\]\\]/gu,"\\$&");return new RegExp(`#\\s?${o}\\b`,"u").test(e)}function Xt(e,t){if(e.length===
0)return[];let o=To(t);return e.filter(s=>Po(o,s.number)).map(s=>s.ref)}function Eo(e,t,o){if(!t?.enabled)return[];let s=t.
intents??[];if(s.length===0)return[];let i=cn(e),c=[],d=Ao(s),m=!!(e.running||e.subagents_running||e.orchestrating)?[]:s.
filter(r=>r.state==="in-progress");m.forEach(r=>{let u=s.indexOf(r),g=(r.next_steps??[]).filter(k=>k.what?.trim());c.push(
{id:`unattended:${e.key}:${u}`,title:ie(r.title,e.title||o("untitled_work")),summary:g[0]?.what?.trim()||o("no_next_step"),
state:"needs-you",issue:me(e),updatedAt:M(e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lt(e,o),
queuedBehind:e.queue_depth||void 0,changeBlocked:me(e)||void 0,unattendedGoals:1,action:"resume",references:[{kind:"sess\
ion",id:e.key,label:e.title||o("untitled_work"),sessionKey:e.key},...Xt(i,r)],nextSteps:g,initialIntent:r.initial_intent?.
trim()||void 0,progress:(r.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:r.last_touched_turn??0})}),
s.forEach((r,u)=>{if(m.includes(r))return;let g=No(r,e);if(!g)return;let k=(r.next_steps??[]).filter(v=>v.what?.trim());
c.push({id:`intent:${e.key}:${u}`,title:ie(r.title,e.title||o("untitled_work")),summary:Co(r,o),state:g,issue:!1,updatedAt:M(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:lt(e,o),queuedBehind:e.queue_depth||void 0,changeBlocked:me(
e)||void 0,unverified:r.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||o("untit\
led_work"),sessionKey:e.key},...Xt(i,r)],nextSteps:k,initialIntent:r.initial_intent?.trim()||void 0,progress:(r.progress??
[]).filter(v=>v.trim()),stale:!!t.stale,lastTouchedTurn:r.last_touched_turn??0,moving:Io(r,e,d)||void 0})});let R=c.filter(
r=>r.state==="needs-you"),I=c.filter(r=>r.state!=="needs-you").sort((r,u)=>(u.lastTouchedTurn??0)-(r.lastTouchedTurn??0));
return[...R,...I].slice(0,Math.max(Wo,R.length))}var Mo=new Set(["crew-manager-conductor","overwatch-conductor"]),Bo={approval_owed:100,
subagent_gate:95,input_requested:80,unverified_completion:70,error_loop:60,changes_requested:58,run_failed:55,stalled:50,
change_blocked:40,merge_ready:34,assigned_to_you:32,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Ko=3;function $o(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Fe=5;function pn(e,t,o=Date.now()){let s=ft(e),i=kn(
e.filter(d=>d.state==="needs-you"),o),c=[`Fleet: ${s["needs-you"]} waiting on the user, ${s.running} in progress, ${s.done}\
 finished recently.`];return i.length===0?(c.push("Nothing is waiting on the user."),c):(c.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Fe,i.length)}):`),i.slice(0,Fe).forEach((d,w)=>{let m=je(be(d,o),t),R=d.sessionKey?
` [session ${d.sessionKey}]`:"";c.push(`${w+1}. ${d.title} \u2014 ${d.summary} (${m})${R}`)}),i.length>Fe&&c.push(`\u2026and ${i.
length-Fe} more waiting.`),c)}var dt=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),Zt=.6,en=2,gn=new Set;function ct(e){return[...new Set(e.toLowerCase().replace(
/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(t=>t.length>2&&!dt.has(t)))]}function tn(e,t){let o=ct(e),s=ct(t);if(o.length<
en||s.length<en)return 0;let i=o.length<=s.length?o:s,c=new Set(o.length<=s.length?s:o);return i.filter(w=>c.has(w)).length/
i.length}function nn(e){return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function on(e){return e.
references.filter(t=>t.kind==="artifact").map(t=>t.id)}function rn(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}
var Do=new Set(["pull request","pull requests","status update","work in progress","code review","follow up","next step",
"next steps","action item","action items","kiro crew","in progress","needs you"]);function ut(e){let t=new Set,o=e.match(
/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??[];for(let s of o){let i=s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean).map(c=>c.length>3&&c.endsWith("s")&&!c.endsWith("ss")?c.slice(0,-1):c);for(;i.length&&
dt.has(i[0]);)i.shift();for(;i.length&&dt.has(i[i.length-1]);)i.pop();if(!(i.length<2))for(let c=i.length;c>=2;c-=1)for(let d=0;d+
c<=i.length;d+=1){let w=i.slice(d,d+c).join(" ");Do.has(w)||t.add(w)}}return[...t]}function Oo(e){let t=new Set;if(e.length<
zo)return t;let o=new Map;for(let s of e)for(let i of ut(s.title))o.set(i,(o.get(i)??0)+1);for(let[s,i]of o)i/e.length>=
Lo&&t.add(s);return t}var zo=4,Lo=.75;function wn(e,t,o=gn){if(nn(e).find(d=>nn(t).includes(d)))return"same_change";if(on(
e).find(d=>on(t).includes(d)))return"same_artifact";let c=ut(t.title).filter(d=>!o.has(d));if(ut(e.title).some(d=>c.includes(
d)))return"same_deliverable";if(tn(e.title,t.title)>=Zt)return"same_topic";for(let d of rn(e))for(let w of rn(t))if(tn(d,
w)>=Zt)return"same_step";return null}var fn={merged:[],split:[]};function sn(e){return`${e.sessionKey??e.id}|${ct(e.title).
join(" ")}`}function hn(e,t){return[sn(e),sn(t)].sort().join("")}function qo(e,t=fn){let o=e.filter(i=>i.state!=="done"&&
i.sessionKey).sort((i,c)=>(i.updatedAt||0)-(c.updatedAt||0)),s=Oo(o);for(let i=1;i<o.length;i+=1){let c=o[i];for(let d=0;d<
i;d+=1){let w=o[d];if(w.sessionKey===c.sessionKey||t.split.includes(hn(c,w)))continue;let m=wn(c,w,s);if(m){c.duplicateOf=
{sessionKey:w.sessionKey,title:w.title,because:m};break}}}Fo(o,t,s)}var it=3,an=["same_change","same_artifact","same_del\
iverable","same_topic","same_step"];function Fo(e,t,o=gn){for(let s of e){let i=[],c=new Set;for(let d of e){let w=d.sessionKey;
if(w===s.sessionKey||c.has(w)||t.split.includes(hn(s,d)))continue;let m=wn(s,d,o);m&&(c.add(w),i.push({sessionKey:w,title:d.
title,because:m}))}i.length!==0&&(i.sort((d,w)=>an.indexOf(d.because)-an.indexOf(w.because)),s.relatedSessions=i.slice(0,
it),i.length>it&&(s.relatedMore=i.length-it))}}var jo=3e4;function mn(e,t,o=Date.now()){return Object.keys(t).length===0?
e:e.map(s=>{let i=t[s.id];return!i||o-i>jo||s.state==="running"?s:{...s,state:"running",moving:!0,instructed:!0}})}function be(e,t=Date.
now()){let o=[],s=(c,d,w=1)=>{o.push({signal:c,weight:Bo[c]*w,values:d})};e.approvalKind==="subagent"?s("subagent_gate"):
e.approvalKind==="tool"&&s("approval_owed"),e.action==="reply"&&s("input_requested"),e.unverified&&s("unverified_complet\
ion"),e.loopRepeats&&s("error_loop",{repeats:String(e.loopRepeats)}),e.changesRequested&&s("changes_requested"),e.runFailed&&
s("run_failed"),e.stalledFor&&s("stalled",{duration:le(e.stalledFor)}),e.assignedToYou&&s("assigned_to_you"),e.changeBlocked&&
s("change_blocked"),e.mergeReady&&s("merge_ready"),e.unattendedGoals&&s("nobody_on_it",{count:String(e.unattendedGoals)}),
e.queuedBehind&&s("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,3));let i=$o(e,t);return i>0&&s(
"waiting_a_while",{hours:String(i)},Math.min(i,Ko)),o.sort((c,d)=>d.weight-c.weight),{score:o.reduce((c,d)=>c+d.weight,0),
signals:o}}var Ho={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",unverified_completion:"unbl\
ock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",changes_requested:"unblock",change_blocked:"unblock",merge_ready:"\
unblock",assigned_to_you:"followup",nobody_on_it:"followup"};function bn(e,t=Date.now()){if(e.state!=="needs-you")return null;
for(let o of be(e,t).signals){let s=Ho[o.signal];if(s)return s}return null}var vn=14400*1e3;function xn(e,t,o,s=Date.now()){
let i=0,c=[];for(let d of e){if(d.state!=="needs-you"){c.push(d);continue}let w=t[d.id];if(w&&w>s){i+=1;continue}let m=o[d.
id];if(m!==void 0&&d.updatedAt<=m){c.push({...d,state:"done",issue:!1});continue}c.push(d)}return{items:c,snoozedCount:i}}
var wt=4320*60*1e3;function yn(e,t=Date.now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=wt}var Uo={"ne\
eds-you":1,running:-1,done:-1};function Go(e,t,o){let s=e.updatedAt>0,i=t.updatedAt>0;return!s&&!i?0:s?i?(e.updatedAt-t.
updatedAt)*o:-1:1}function je(e,t){let o=e.signals.slice(0,2);return o.length===0?t("rank_nothing_pressing"):o.map(i=>t(
`rank_${i.signal}`,i.values)).join(t("rank_join"))}function kn(e,t=Date.now()){let o=new Map(e.map(s=>[s.id,be(s,t)]));return[
...e].sort((s,i)=>{let c=Vt[s.state]-Vt[i.state];if(c!==0)return c;if(s.state==="needs-you"){let d=(o.get(i.id)?.score??
0)-(o.get(s.id)?.score??0);if(d!==0)return d}else if(s.issue!==i.issue)return s.issue?-1:1;return Go(s,i,Uo[s.state])})}
function _n(e,t,o={},s={},i={},c=fn,d=Date.now()){let w=new Map,m=new Map;for(let r of e.slots){if(!r.key||Mo.has(r.key)||
r.memory_mode==="incognito")continue;let u=Eo(r,o[r.key],t);if(u.length>0){for(let v of u)w.set(v.id,v);let k=u.find(v=>v.
state==="needs-you")??u[0];m.set(r.key,k);continue}let g=ko(r,t);w.set(g.id,g),m.set(r.key,g)}if(e.assigned?.length){let r=new Map;
for(let h of w.values())for(let x of h.references)(x.kind==="change"||x.kind==="issue")&&x.url&&!r.has(x.url)&&r.set(x.url,
h);let u={changes_requested:0,conflict:1,checks_failing:2,ready_to_merge:3,assigned:4},g=new Map;for(let h of e.assigned){
if(!h?.url||r.has(h.url)||!(h.status in u))continue;let x=g.get(h.status);x?x.push(h):g.set(h.status,[h])}let k=[...g.entries()].
sort((h,x)=>(u[h[0]]??9)-(u[x[0]]??9)).map(h=>h[1]),v=[];for(let h=0;v.length<Yt;h+=1){let x=!1;for(let K of k){if(v.length>=
Yt)break;let E=K[h];E&&(v.push(E),x=!0)}if(!x)break}let N=new Set(v.map(h=>h.url));for(let h of e.assigned){if(!h?.url||
!r.has(h.url)&&!N.has(h.url))continue;let x=h.kind==="issue"?"issue":"pull",K=h.status==="conflict"||h.status==="checks_\
failing",E=h.status==="changes_requested",j=h.status==="ready_to_merge",L=x==="issue",B=r.get(h.url);if(B){B.owned=x,K&&
(B.changeBlocked=!0,B.issue=!0),E&&(B.changesRequested=!0),j&&(B.mergeReady=!0),(K||E||j)&&B.state==="done"&&(B.state="n\
eeds-you");continue}let W=K||E||j||L,D=x==="issue"?"owned_issue_assigned":h.status==="conflict"?"owned_pull_conflict":h.
status==="checks_failing"?"owned_pull_failing":h.status==="changes_requested"?"owned_pull_changes_requested":h.status===
"ready_to_merge"?"owned_pull_merge_ready":h.status==="checks_running"?"owned_pull_checks_running":"owned_pull_awaiting_r\
eview",X=x==="issue"?`issue #${h.number}`:`#${h.number}`;w.set(`owned:${h.url}`,{id:`owned:${h.url}`,title:h.title||X,summary:t(
D,{count:String(h.status==="checks_failing"?h.failing:h.pending)}),state:W?"needs-you":"running",issue:K,updatedAt:M(h.updated_at),
provenance:t("owned_provenance",{repo:h.repo}),references:[{kind:x==="issue"?"issue":"change",id:h.url,label:`${h.repo} ${X}`,
url:h.url,status:h.status==="awaiting_review"?void 0:h.status.replace(/_/g," ")}],action:void 0,owned:x,changeBlocked:K||
void 0,changesRequested:E||void 0,mergeReady:j||void 0,assignedToYou:L||void 0})}}for(let[r,u]of Object.entries(s)){let g=m.
get(r);g&&(g.state="needs-you",g.issue=!0,g.stalledFor=u.silent_secs,g.summary=u.reason?t("stalled_because",{reason:u.reason,
duration:le(u.silent_secs)}):t("stalled_for",{duration:le(u.silent_secs)}),g.action="open")}for(let[r,u]of Object.entries(
i)){let g=m.get(r);g&&(g.state="needs-you",g.issue=!0,g.loopRepeats=u.repeats,g.summary=t("error_loop",{tool:u.tool,repeats:String(
u.repeats)}),g.action="open")}for(let r of e.approvals){let u=r.slot?m.get(r.slot):void 0;if(u){_o(u,r,t);continue}w.set(
`approval:${r.id}`,{id:`approval:${r.id}`,title:ie(r.tool||r.source,t("approval_needed")),summary:r.tool_purpose||t("too\
l_call_waiting"),state:"needs-you",issue:!1,updatedAt:M(r.ts),provenance:t("approval"),action:"review-approval",approvalKind:un(
r)?"subagent":"tool",permissionId:r.id,permissionTool:r.tool||r.source,permissionPurpose:r.tool_purpose,permissionInput:r.
tool_input,references:[{kind:"approval",id:r.id,label:r.tool||r.source||t("approval")}]})}for(let r of e.agents){let u=r.
parent?m.get(r.parent):void 0;if(u){So(u,r,t);continue}let g=!!(r.done&&(r.error||r.outcome==="failed"));r.parent&&!g||w.
set(`agent:${r.id}`,{id:`agent:${r.id}`,title:ie(r.task||r.agent,t("agent_work")),summary:g?r.error?.trim()||t("agent_fa\
iled",{task:r.task}):r.done?t("agent_done"):t("work_in_progress"),state:g?"needs-you":r.done?"done":"running",issue:g,runFailed:g||
void 0,retryPath:g&&!r.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(r.id)}/retry`:void 0,updatedAt:M(r.started),
provenance:r.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:r.id,label:r.agent||t("agent")}]})}for(let r of e.
workflows){let u=r.session_key?m.get(r.session_key):void 0;if(u){Ro(u,r,t);continue}let g=r.status==="failed";w.set(`wor\
kflow:${r.run_id}`,{id:`workflow:${r.run_id}`,title:ie(r.name,r.run_id),summary:g?t("workflow_failed_generic"):r.status===
"running"?t("workflow_running"):t("workflow_finished"),state:g?"needs-you":r.status==="running"?"running":"done",issue:g,
runFailed:g||void 0,retryPath:g?`/api/workflows/runs/${encodeURIComponent(r.run_id)}/rerun`:void 0,updatedAt:0,provenance:t(
"workflow"),action:"discuss",references:[{kind:"workflow",id:r.run_id,label:r.name||r.run_id}]})}for(let r of e.crons){if(!r.
is_running&&r.last_status!=="error")continue;let u=r.last_status==="error",g=go(r,d),k=t(u?"monitor_failed":"monitor_run\
ning");w.set(`monitor:${r.id}`,{id:`monitor:${r.id}`,title:r.name,summary:g?`${k} ${t("monitor_next_check",{duration:g})}`:
k,state:u?"needs-you":"running",issue:u,runFailed:u||void 0,retryPath:u?`/api/crons/${encodeURIComponent(r.id)}/run`:void 0,
updatedAt:M(r.running_since||r.last_run_ts||r.created_ts),provenance:t("monitor"),action:u?"discuss":void 0,references:[
{kind:"monitor",id:r.id,label:r.name}]})}for(let r of e.loops||[]){if(!r.active)continue;let u=String(r.id||"");if(!u)continue;
let g=Math.max(0,Number(r.cycle_count)||0),k=Math.max(0,Number(r.max_cycles)||0),v=r.slot_key&&m.has(r.slot_key)?r.slot_key:
void 0;w.set(`loop:${u}`,{id:`loop:${u}`,title:ie(r.message||"",t("loop")),summary:k?t("loop_watching_capped",{cycles:String(
g),cap:String(k)}):t("loop_watching",{cycles:String(g)}),state:"running",issue:!1,updatedAt:M(r.last_fire_ts||r.created_ts),
sessionKey:v,parentId:v?m.get(v)?.id:void 0,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(u)}`,action:v?
"open":void 0,references:[{kind:"monitor",id:u,label:t("loop"),sessionKey:v},...v?[{kind:"session",id:v,label:m.get(v)?.
title||v,sessionKey:v}]:[]]})}let R=[...e.artifacts].sort((r,u)=>M(u.updated_at)-M(r.updated_at)).slice(0,8);for(let r of R){
let u=r.session_key&&m.has(r.session_key)?r.session_key:void 0;w.set(`artifact:${r.slug}`,{id:`artifact:${r.slug}`,title:ie(
r.name,t("artifact")),summary:r.description||t("artifact_ready",{kind:r.kind}),state:"done",issue:!1,updatedAt:M(r.updated_at||
r.created_at),sessionKey:u,parentId:u?m.get(u)?.id:void 0,provenance:r.session_title||r.source||t("artifact"),action:u?"\
open":void 0,references:[{kind:"artifact",id:r.slug,label:r.name,sessionKey:u},...u?[{kind:"session",id:u,label:r.session_title||
u,sessionKey:u}]:[]]})}let I=[...w.values()];return qo(I,c),kn(I)}function ft(e){return{all:e.length,"needs-you":e.filter(
t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function Sn(e){let t=[],o=new Map;for(let s of e){let i=s.sessionKey;if(!i){t.push({key:s.id,items:[s],header:null,sessionKey:null});
continue}let c=o.get(i);if(c){c.items.push(s);continue}let d={key:i,items:[s],header:"session",sessionKey:s.sessionKey??
null};o.set(i,d),t.push(d)}return t}function ht(e){let t=new Set,o=new Set,s=new Set,i=0,c=0,d=0,w=0,m=0;for(let R of e){
R.sessionKey&&t.add(R.sessionKey);for(let I of R.references)I.kind==="change"?o.add(I.id):I.kind==="issue"&&s.add(I.id);
R.id.startsWith("workflow:")?i+=1:R.id.startsWith("monitor:")?c+=1:R.id.startsWith("agent:")&&(d+=1),R.state==="needs-yo\
u"&&(w+=1),R.updatedAt>m&&(m=R.updatedAt)}return{sessions:t.size,prs:o.size,issues:s.size,loops:i,crons:c,agents:d,needsYou:w,
lastActivityAt:m}}var Yo=12;function bt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function Vo(e,t=Date.now()){if(e.
running||e.subagents_running||e.orchestrating||e.pending_approval)return!0;let o=mt(e);return o===0?!0:t-o<=wt}function Rn(e,t,o=Date.
now(),s=()=>!1){return e.filter(i=>i.key&&i.key!==t&&i.memory_mode!=="incognito").filter(i=>Vo(i,o)).filter(i=>!s(i)).sort(
(i,c)=>mt(c)-mt(i)).slice(0,Yo)}function mt(e){let t=e.last_ts??e.last_activity_ts??e.created;if(typeof t=="number")return t>
1e10?t:t*1e3;if(!t)return 0;let o=Date.parse(t);return Number.isFinite(o)?o:0}async function Nn(e,t){let o={},s="unknown";
for(let i of e)try{let c=await t(`/api/chat/slots/${encodeURIComponent(i.key)}/summary`);if(!c||typeof c!="object"){s="u\
nsupported";break}if(c.enabled===!1){s="disabled";break}o[i.key]=c,s="available"}catch{s="unsupported";break}return{summaries:o,
support:s}}var In=String.raw`
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
`;import{Fragment as Ue,jsx as a,jsxs as f}from"react/jsx-runtime";var de=["work"],Wn=["work"],zn={work:"Sessions",loops:"\
Loops",schedule:"Scheduled tasks"};function vt({id:e,onPromote:t}){return a(z,{className:"ow-promote","aria-label":`Move\
 ${zn[e]} to the first column`,onClick:o=>{o.preventDefault(),o.stopPropagation(),t(e)},children:"Make primary"})}function xt({
lastUpdated:e,refreshing:t,onRefresh:o}){let s=e?At(e):null;return f("span",{className:"ow-refreshbar",children:[s&&f("s\
pan",{className:"ow-updated","aria-live":"polite",children:["updated ",s]}),a(z,{className:"ow-refresh",onClick:i=>{i.preventDefault(),
i.stopPropagation(),o()},disabled:t,"aria-label":"Refresh",title:"Refresh",children:a(or,{className:`ow-icon${t?" ow-spi\
n":""}`,"aria-hidden":"true"})})]})}var yt="crew-manager.snoozed",Tn="crew-manager.handled",kt="crew-manager.stack-open-\
v2",_t="crew-manager.primary-v1";function ve(e,t={}){try{let o=localStorage.getItem(e);return o?JSON.parse(o):t}catch{return t}}
function ce(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function At(e,t=Date.now()){if(!e)return null;let o=Math.
max(0,Math.round((t-e)/1e3));if(o<60)return"just now";let s=Math.round(o/60);if(s<60)return`${s}m ago`;let i=Math.round(
s/60);return i<24?`${i}h ago`:`${Math.round(i/24)}d ago`}function Pn(e){return e?new Date(e).toLocaleTimeString([],{hour:"\
numeric",minute:"2-digit"}):""}function xe(e,t,o){return e<=0?null:`${e} ${e===1?t:o}`}function gr(e,t=Date.now(),o=!1,s=!1){
let i=ht(e),c=[o?null:xe(i.sessions,"session","sessions"),s?null:xe(i.prs,"PR","PRs"),s?null:xe(i.issues,"issue","issues"),
xe(i.loops,"loop","loops"),xe(i.crons,"cron","crons"),xe(i.agents,"agent","agents")].filter(w=>!!w),d=At(i.lastActivityAt,
t);return d&&c.push(`last active ${d}`),c.join(" \xB7 ")}var ue="crew-manager-conductor",wr=5e3,fr={session:"Session",approval:"\
Approval",agent:"Agent",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending a\
pproval request",subagent_gate_waiting:"Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer t\
he request in the work thread",decision_ready:"Make the decision this work is waiting on",work_in_progress:"Work is in p\
rogress",linked_change_issue:"Open the linked change \u2014 a check is failing or it conflicts",recent_work_ready:"Pick \
this back up, or let it go",approval_needed_for:"Review the pending {{tool}} request",approval_needed:"Approval needed",
tool_call_waiting:"Allow or refuse a waiting tool call",agent_work:"Agent work",agent_done:"This agent run finished",agent_failed:"\
This agent stopped before finishing \u2014 nothing to do here",workflow_failed:"This workflow stopped before finishing",
workflow_failed_generic:"This workflow stopped before finishing",workflow_running:"Workflow is running",workflow_finished:"\
Workflow finished",monitor_failed:"The latest check stopped before finishing",monitor_running:"Monitor is checking now",
monitor_next_check:"Checks again in {{duration}}.",loop:"Monitor loop",loop_watching:"Re-prompting its own session \u2014 {{c\
ycles}} cycles so far, no limit set",loop_watching_capped:"Re-prompting its own session \u2014 cycle {{cycles}} of {{cap}}",
artifact_ready:"{{kind}} output is ready",stalled_for:"Check on it \u2014 no activity for {{duration}}, still marked running",
stalled_because:"{{reason}} Silent for {{duration}}.",duplicate_same_change:"Also being worked in \u201C{{title}}\u201D \u2014 same lin\
ked change",duplicate_same_artifact:"Also being worked in \u201C{{title}}\u201D \u2014 same artifact",duplicate_same_deliverable:"\
Also being worked in \u201C{{title}}\u201D \u2014 same deliverable",duplicate_same_topic:"Looks like the same work as \u201C{\
{title}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same work",related_sessions:"\
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
return fr[e].replace(/\{\{(\w+)\}\}/g,(o,s)=>t[s]??"")}var Ln={"needs-you":"Needs you",running:"Running",done:"Done"},St={
all:"All","needs-you":"Needs you","follow-up":"Follow up",running:"Running",done:"Done"},hr={session:nr,approval:$n,agent:Qo,
workflow:ir,monitor:On,artifact:er,change:tr,issue:ar};function Be({children:e,onActivate:t,...o}){return a("div",{...o,
role:"button",tabIndex:0,onClick:t,onKeyDown:s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),t())},children:e})}
function En({label:e,count:t,subtitle:o}){return f("div",{className:"ow-section-header",children:[f("div",{className:"ow\
-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow-section-count",children:t})]}),
o&&a("p",{className:"ow-section-subtitle",children:o})]})}function mr(e){let t=ne(e);return t==="unblock"?f("span",{className:"\
ow-rowstate ow-rowstate--need",children:[a("span",{className:"ow-rowstate-dot","aria-hidden":"true"}),"Needs you"]}):t===
"followup"?f("span",{className:"ow-rowstate ow-rowstate--follow",children:[a("span",{className:"ow-rowstate-dot","aria-h\
idden":"true"}),"Follow up"]}):t==="running"?e.moving?f("span",{className:"ow-rowstate ow-rowstate--run",children:[a("sp\
an",{className:"ow-rowstate-spin","aria-hidden":"true"}),"Running"]}):a("span",{className:"ow-rowstate ow-rowstate--queu\
ed",children:"Queued"}):f("span",{className:"ow-rowstate ow-rowstate--done",children:[a(Dn,{className:"ow-icon","aria-hi\
dden":"true"}),"Done"]})}function br({tool:e,purpose:t,busy:o,onAnswer:s,where:i}){return f("div",{className:"ow-permiss\
ion",children:[f("div",{className:"ow-permission-body",children:[f("div",{className:"ow-permission-head",children:[a(rr,
{className:"ow-icon","aria-hidden":"true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permiss\
ion"})]}),f("p",{className:"ow-permission-what",children:[i&&f("span",{className:"ow-truncate",children:[i," "]}),i?"wan\
ts to run ":"Wants to run ",a("code",{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),f("div",{className:"\
ow-permission-actions",children:[a(z,{onClick:()=>s(!0),disabled:o,children:"Approve"}),a(z,{onClick:()=>s(!1),disabled:o,
children:"Reject"})]})]})}function Ee({children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"o\
w-expand-inner",children:e})})}function Rt({label:e,children:t}){let o=Jo();return f("div",{className:"ow-detail",role:"\
group","aria-labelledby":o,children:[a("div",{className:"ow-detail-label",id:o,children:e}),t]})}var Nt=3;function Mn(e){
let t=e.provenance.trim().toLowerCase();return e.references.filter(o=>o.label.trim().toLowerCase()!==t)}function vr({item:e,
busy:t,onDecide:o}){let[s,i]=S(!1),c=e.permissionInput||"",d=c.trim().split(/\s+/)[0]||e.permissionTool||"";return f("di\
v",{className:"ow-formal-approval",role:"presentation",onClick:w=>w.stopPropagation(),onKeyDown:w=>w.stopPropagation(),children:[
a("div",{className:"ow-formal-badge",children:"Waiting for approval"}),f("div",{className:"ow-formal-detail",children:[e.
permissionPurpose&&f("div",{className:"ow-formal-kv",children:[a("span",{className:"ow-formal-key",children:"__tool_use_\
purpose"}),a("span",{className:"ow-formal-val",children:e.permissionPurpose})]}),f("div",{className:"ow-formal-kv",children:[
a("span",{className:"ow-formal-key",children:e.permissionTool||"tool"}),a("span",{className:"ow-formal-val ow-formal-mon\
o",children:c||"(no input details)"})]})]}),f("div",{className:"ow-formal-actions",children:[a(z,{disabled:t,onClick:()=>o(
"approved"),children:"Allow once"}),f("span",{className:"ow-trust-wrap",children:[f(z,{disabled:t,onClick:()=>i(w=>!w),"\
aria-expanded":s,children:["Trust ",a(pe,{className:"ow-icon ow-trust-caret","data-open":s?"true":void 0,"aria-hidden":"\
true"})]}),s&&f("span",{className:"ow-trust-menu",role:"menu",children:[c&&a("button",{type:"button",role:"menuitem",className:"\
ow-trust-item",disabled:t,onClick:()=>{i(!1),o("trust_command")},children:"Trust this exact command"}),d&&f("button",{type:"\
button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{i(!1),o("trust_base")},children:["Trust \u201C",
d,"\u201D commands"]}),a("button",{type:"button",role:"menuitem",className:"ow-trust-item",disabled:t,onClick:()=>{i(!1),
o("trust")},children:"Trust everything in this session"})]})]}),a(z,{className:"ow-formal-reject",disabled:t,onClick:()=>o(
"rejected"),children:"Reject"})]})]})}function xr({item:e,items:t,onOpen:o}){let i=e.references.find(g=>g.kind==="sessio\
n")?.label??e.provenance,c=ht(t),d=c.needsYou>0?"needs-you":t.some(g=>g.state==="running")?"running":"done",w=c.needsYou>
0?null:Ln[d],m=[],R=new Set;for(let g of t.flatMap(k=>k.references))(g.kind==="change"||g.kind==="issue")&&g.url&&!R.has(
g.url)&&(R.add(g.url),m.push(g));let I=t.reduce((g,k)=>Math.max(g,k.queuedBehind??0),0),r=I>0?O("rank_queued_behind",{count:String(
I)}):null,u=gr(t,Date.now(),!0,m.length>0);return f("div",{className:"ow-goalcard-head",children:[f("div",{className:"ow\
-goalcard-summary",children:[a("span",{className:"ow-goalcard-header ow-goalcard-static",children:a("span",{className:"o\
w-truncate ow-block-name ow-goalcard-title",children:i})}),a(z,{className:"ow-block-open",onClick:o,"aria-label":`Open ${i}`,
children:"Open"}),w&&a("span",{className:`ow-goal-flag${c.needsYou>0?" ow-goal-flag-warn":""}`,children:w})]}),(m.length>
0||u||r)&&f("div",{className:"ow-goal-meta ow-goal-meta-row",children:[u&&a("span",{children:u}),m.map(g=>a(qn,{reference:g,
onOpenSession:()=>o()},`${g.kind}:${g.id}`)),r&&a("span",{children:r})]})]})}function qn({reference:e,onOpenSession:t}){
let o=hr[e.kind],s=f(Ue,{children:[a(o,{className:"ow-icon"}),a("span",{className:"ow-truncate",children:e.label})]});return e.
url?a("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:i=>i.
stopPropagation(),children:s}):e.sessionKey?a(Be,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),
children:s}):a("span",{className:"ow-reference",children:s})}function Fn({item:e,selected:t,continuation:o,whyRanked:s,onSelect:i,
onOpenSession:c,onAnswerPermission:d,permissionBusy:w,onRetry:m,retryBusy:R,onStop:I,stopBusy:r,onPickStep:u,onSnooze:g,
onHandled:k,compact:v,headless:N,onDecideApproval:h}){let[x,K]=S(!1),E=(e.nextSteps??[]).filter(y=>y.what?.trim()),j=(e.
progress??[]).filter(y=>y.trim()),L=e.initialIntent?.trim(),B=!!u&&E.length>0,W=!!L||j.length>0||B,D=x?E:E.slice(0,Nt),X=mr(
e),ye=e.lastTouchedTurn?O("card_turn",{turn:String(e.lastTouchedTurn)}):null,Ke=!!e.summary&&(E.some(y=>y.what?.trim()===
e.summary)||t&&L===e.summary?.trim()),$e=!!e.summary&&(v&&!t?!s:!Ke),ke=s||($e?e.summary:null);return f(Be,{onActivate:i,
className:"ow-row","aria-label":e.title,"aria-pressed":t,"aria-expanded":W?t:void 0,"data-selected":t,"data-lane":ne(e),
"data-instructed":e.instructed?"true":void 0,"data-continuation":o?"true":void 0,"data-testid":`work-item-${e.id}`,children:[
a("div",{className:"ow-row-layout",children:f("div",{className:"ow-row-content",children:[!N&&f(Ue,{children:[f("div",{className:"\
ow-row-heading",children:[a("span",{className:"ow-row-title",children:e.title}),ye&&a("span",{className:"ow-row-turn",children:ye}),
a(pe,{className:"ow-icon ow-row-chevron","data-expanded":t?"true":void 0,"aria-hidden":"true"})]}),(X||ke)&&f("div",{className:"\
ow-row-status",children:[X,ke&&a("span",{className:"ow-row-statustext",children:ke})]})]}),e.duplicateOf&&f(Be,{className:"\
ow-row-duplicate",onActivate:()=>c(e.duplicateOf.sessionKey),children:[a(It,{className:"ow-icon","aria-hidden":"true"}),
a("span",{className:"ow-truncate",children:O(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.title})})]}),t&&e.
relatedSessions&&e.relatedSessions.length>0&&a(Ee,{children:f("div",{className:"ow-related",children:[a("span",{className:"\
ow-related-label",children:O("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.map(y=>f(Be,
{className:"ow-related-row",onActivate:()=>c(y.sessionKey),children:[a(It,{className:"ow-icon","aria-hidden":"true"}),a(
"span",{className:"ow-truncate",children:y.title}),a("span",{className:"ow-related-why",children:O(`related_${y.because}`)})]},
y.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:O("related_more",{count:String(e.relatedMore)})}):
null]})}),!o&&f("div",{className:"ow-row-meta",children:[a("span",{className:"ow-truncate",children:e.provenance}),Mn(e).
length>0&&a("span",{"aria-hidden":"true",children:"\xB7"}),a("span",{className:"ow-references",children:Mn(e).slice(0,3).
map(y=>a(qn,{reference:y,onOpenSession:c},`${y.kind}:${y.id}`))})]})]})}),t&&W&&a(Ee,{children:f("div",{className:"ow-ro\
w-detail",children:[L&&a(Rt,{label:O("card_asked_for"),children:a("blockquote",{className:"ow-detail-quote",children:L})}),
j.length>0&&a(Rt,{label:O("card_where_it_stands"),children:a("ul",{className:"ow-detail-facts",children:j.map((y,oe)=>a(
"li",{children:y},`${oe}:${y}`))})}),B&&f(Rt,{label:O("card_suggested_next"),children:[D.map((y,oe)=>f("button",{type:"b\
utton",className:"ow-quote-step ow-detail-step",title:y.why??y.what,onClick:q=>{q.stopPropagation(),u?.(y.what)},children:[
a("span",{className:"ow-detail-step-what",children:y.what}),y.why&&a("span",{className:"ow-detail-step-why",children:y.why}),
y.expect&&a("span",{className:"ow-detail-step-expect",children:y.expect})]},`${oe}:${y.what}`)),E.length>Nt&&a("button",
{type:"button",className:"ow-steps-more",onClick:y=>{y.stopPropagation(),K(oe=>!oe)},children:x?"Show fewer":`+${E.length-
Nt} more`})]})]})}),e.retryPath&&m&&a(Ee,{children:a("div",{className:"ow-retry",children:a(z,{onClick:()=>m(e.retryPath),
disabled:!!R,children:"Retry"})})}),e.stopPath&&I&&a(Ee,{children:a("div",{className:"ow-retry",children:a(z,{onClick:()=>I(
e.stopPath),disabled:!!r,children:r?"Stopping\u2026":"Stop this loop"})})}),e.permissionId&&h&&a(Ee,{children:a(vr,{item:e,
busy:!!w,onDecide:y=>h(e,y)})}),e.state==="needs-you"&&g&&k&&f("div",{className:"ow-row-aside",children:[a("button",{type:"\
button",className:"ow-aside-btn",onClick:y=>{y.stopPropagation(),g(e.id)},children:"Later"}),a("button",{type:"button",className:"\
ow-aside-btn",onClick:y=>{y.stopPropagation(),k(e.id,e.updatedAt)},children:"Handled"})]})]})}var yr=["unblock","followu\
p","running","done"];function ne(e){return e.state==="done"?"done":e.state==="running"?"running":bn(e)??"unblock"}function kr({
items:e,selectedId:t,onSelect:o,onOpenSession:s,onAnswerPermission:i,onDecideApproval:c,permissionBusy:d,onRetry:w,retryBusy:m,
onPickStep:R,onSnooze:I,onHandled:r,doneTitles:u}){let[g,k]=S(!1),v=new Map;for(let N of e){let h=ne(N),x=v.get(h);x?x.push(
N):v.set(h,[N])}return f(Ue,{children:[yr.filter(N=>v.has(N)).map(N=>{let h=v.get(N);return a("div",{className:"ow-lane",
children:h.map(x=>a(Fn,{item:x,compact:!0,selected:t===x.id,continuation:!0,whyRanked:x.state==="needs-you"&&x.action!==
"resume"?je(be(x),O):void 0,onSelect:()=>o(x),onOpenSession:s,onAnswerPermission:i,onDecideApproval:c,permissionBusy:d,onRetry:w,
retryBusy:m,onPickStep:R,onSnooze:I,onHandled:r},x.id))},N)}),!v.has("done")&&u&&u.length>0&&f("div",{className:"ow-lane\
 ow-lane-done",children:[f("button",{type:"button",className:"ow-goals-toggle","aria-expanded":g,onClick:()=>k(N=>!N),children:[
a(pe,{className:"ow-icon","data-open":g?"true":void 0,"aria-hidden":"true"}),u.length," done"]}),g&&a("ul",{className:"o\
w-done-list",children:u.map(N=>f("li",{className:"ow-row-goal-done",children:[a(Xo,{className:"ow-icon","aria-hidden":"t\
rue"}),a("span",{className:"ow-truncate",children:N})]},N))})]})]})}function Me({title:e,items:t,selectedId:o,onSelect:s,
onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:m,retryBusy:R,onStop:I,stopBusy:r,onPickStep:u,
onSnooze:g,onHandled:k,footer:v,collapsed:N,onToggleCollapsed:h,doneBySession:x,subtitle:K,hideHeader:E,emptyLabel:j}){let L=Sn(
t),B=W=>f("div",{className:`ow-block${W.header==="session"?" ow-goalcard":""}`,"data-grouped":W.header?"true":void 0,"da\
ta-open":W.header==="session"?"true":void 0,children:[W.header==="session"&&W.sessionKey&&a(xr,{item:W.items[0],items:W.
items,onOpen:()=>i(W.sessionKey)}),W.header==="session"?a(kr,{items:W.items,doneTitles:W.sessionKey?x?.[W.sessionKey]:void 0,
selectedId:o,onSelect:s,onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:m,retryBusy:R,onPickStep:u,
onSnooze:g,onHandled:k}):W.items.map(D=>a(Fn,{item:D,selected:o===D.id,whyRanked:D.state==="needs-you"&&D.action!=="resu\
me"?je(be(D),O):void 0,onSelect:()=>s(D),onOpenSession:i,onAnswerPermission:c,onDecideApproval:d,permissionBusy:w,onRetry:m,
retryBusy:R,onStop:I,stopBusy:r,onPickStep:u,onSnooze:g,onHandled:k},D.id))]},W.key);return f("section",{className:"ow-s\
ection","aria-label":e,children:[E?null:h?f(Be,{onActivate:h,className:"ow-section-toggle",children:[a(En,{label:e,count:t.
length,subtitle:K}),a(pe,{className:"ow-icon ow-section-chevron","data-open":N?void 0:"true","aria-hidden":"true"})]}):a(
En,{label:e,count:t.length,subtitle:K}),N?null:a("div",{className:"ow-section-list",children:L.length===0?a("p",{className:"\
ow-section-empty",children:j}):L.map(B)}),v]})}function _r(e,t,o=[]){let s=pn(t,O),i=o.length?[`Noticed since you last s\
poke (${o.length}):`,...o.map(w=>`- ${w}`),"Mention these only if they matter to what the user asked."]:[];if(!e)return[
"Crew Manager context: workspace overview.",...s,...i,"Answer the user about the state of their work. This is a conversa\
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
 the user does on the card."].filter(w=>!!w);return[`Crew Manager context: ${e.title}`,...s,`Selected item: ${e.title}`,
`State: ${Ln[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...d.length>0?[`Why it is on the board:
${d.join(`
`)}`]:[],`References:
${c}`,...i,"This context was selected silently. Answer the user about it; the user sends any instruction to a session th\
emselves."].filter(w=>!!w).join(`
`)}var Bn="crew-manager.panel-widths";function Sr(e,t){let o=e?.first_seen;if(!o)return[];let s=typeof t=="number"?t<=1e10?
t*1e3:t:t?Date.parse(t):NaN;if(!Number.isFinite(s))return[];let i=[];for(let d of e?.stalls??[]){let w=o[d.key];typeof w==
"number"&&(w*1e3<=s||i.push(d.reason?`${d.label} went quiet \u2014 ${d.reason}`:`${d.label} went quiet after ${le(d.silent_secs)}`))}
for(let d of e?.error_loops??[]){let w=o[d.key];typeof w=="number"&&(w*1e3<=s||i.push(`${d.label} repeated the same ${d.
tool} failure ${d.repeats} times`))}let c=5;return i.length>c?[...i.slice(0,c),`and ${i.length-c} more`]:i}var Y={workMin:300,
railReserve:370,conductorMin:300,conductorMax:620,mainReserve:676};function He(e,t,o,s,i){let c=Math.min(i,Math.max(o,t-
s));return Math.max(o,Math.min(c,e))}function Kn({side:e,containerRef:t,min:o,reserve:s,max:i,value:c,onChange:d,label:w}){
let m=(r,u)=>{let g=u.getBoundingClientRect(),k=e==="start"?r-g.left:g.right-r;return He(k,u.clientWidth,o,s,i)};return a(
"div",{className:"ow-resizer",role:"separator","aria-orientation":"vertical","aria-label":w,tabIndex:0,onPointerDown:r=>{
let u=t.current;if(!u)return;r.preventDefault(),document.body.style.cursor="col-resize",document.body.style.userSelect="\
none";let g=v=>d(m(v.clientX,u)),k=()=>{window.removeEventListener("pointermove",g),window.removeEventListener("pointeru\
p",k),document.body.style.cursor="",document.body.style.userSelect=""};window.addEventListener("pointermove",g),window.addEventListener(
"pointerup",k)},onKeyDown:r=>{if(r.key!=="ArrowLeft"&&r.key!=="ArrowRight")return;let u=t.current;if(!u)return;r.preventDefault();
let g=(r.shiftKey?48:16)*(r.key==="ArrowRight"?1:-1),k=c??(e==="start"?u.clientWidth/2:Math.round(u.clientWidth*.3));d(He(
k+(e==="start"?g:-g),u.clientWidth,o,s,i))}})}function Rr(){let e=lr(),t=G(e);t.current=e;let o=dr(),s=cr(),[i,c]=S("all"),
[d,w]=S(()=>{let n=ve(_t,null);return n&&de.includes(n)?n:"work"}),[m,R]=S(()=>{let n=ve(kt,null),l=n&&de.includes(n)?n:
null,p=ve(_t,null),b=p&&de.includes(p)?p:"work";return l&&l!==b?l:Wn.find(_=>_!==b)??null}),I=$(n=>{R(l=>{let p=l===n?null:
n;return ce(kt,p),p})},[]),[r,u]=S(null),[g,k]=S("session"),[v,N]=S(null),[h,x]=S(null),[K,E]=S({}),[j,L]=S("unknown"),B=G(
"unknown"),W=G(new Map),[D,X]=S({}),[ye,Ke]=S(null),[$e,ke]=S({}),[y,oe]=S([]),[q,De]=S(null),[re,Ct]=S(null),[se,Wt]=S(
null),[Tt,Pt]=S(()=>ve(yt)),[Et,jn]=S(()=>ve(Tn)),Ge=G(null),Ye=G(null),[Z,Ve]=S(()=>ve(Bn,{work:null,conductor:null}));
U(()=>{ce(Bn,Z)},[Z]),U(()=>{let n=()=>Ve(l=>{let p=Ye.current?.clientWidth??0,b=Ge.current?.clientWidth??0;return{work:l.
work==null||p===0?l.work:He(l.work,p,Y.workMin,Y.railReserve,1/0),conductor:l.conductor==null||b===0?l.conductor:He(l.conductor,
b,Y.conductorMin,Y.mainReserve,Y.conductorMax)}});return n(),window.addEventListener("resize",n),()=>window.removeEventListener(
"resize",n)},[]);let[Hn,Un]=S(!0),[Mt,Bt]=S({}),[Kt,Je]=S([]),[Qe,Gn]=S([]),[Yn,Xe]=S(!1),_e=$(n=>{if(n===d)return;let l=m===
n?Wn.find(p=>p!==n)??null:m;ce(_t,n),ce(kt,l),w(n),R(l)},[d,m]),Vn=$((n,l)=>{n.dataTransfer.setData("text/x-crew-panel",
l),n.dataTransfer.effectAllowed="move";let p=n.currentTarget.querySelector("summary");if(!p)return;let b=p.getBoundingClientRect();
n.dataTransfer.setDragImage(p,Math.min(Math.max(n.clientX-b.left,0),b.width),Math.min(Math.max(n.clientY-b.top,0),b.height))},
[]),Jn=$(n=>{n.preventDefault(),Xe(!1);let l=n.dataTransfer.getData("text/x-crew-panel");!l||!de.includes(l)||_e(l)},[_e]),
Ze=F(()=>de.filter(n=>n!==d),[d]),Qn=m&&m!==d?String(Ze.indexOf(m)):"none",et=n=>{let l=n===d;return{className:"ow-card \
ow-stack-card",open:l||m===n,draggable:!0,"data-panel":n,"data-primary":l?"true":"false","data-rail-index":l?void 0:Ze.indexOf(
n),"data-dragover":l&&Yn?"true":void 0,onDragStart:p=>Vn(p,n),onDragOver:l?p=>{p.preventDefault(),Xe(!0)}:void 0,onDragLeave:l?
()=>Xe(!1):void 0,onDrop:l?Jn:void 0}},$t=G(!0),[Xn,Dt]=S(!0),[Ot,tt]=S(null),[nt,Zn]=S(null),[Se,zt]=S(!1),[eo,to]=S(!1),
[Lt,V]=S(null),P=G(!0),Re=G(0),ot=G(!1);U(()=>(P.current=!0,()=>{P.current=!1,Re.current+=1}),[]);let A=$(async()=>{let n=++Re.
current,l=t.current;try{let[p,b,_,H,Le,qe,C,te]=await Promise.all([l.get("/api/chat/slots"),l.get("/api/approvals"),l.get(
"/api/spawn"),l.get("/api/workflows/runs"),l.get("/api/crons"),l.get("/api/artifacts"),l.get("/api/autonudge").catch(()=>({
loops:[]})),l.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!P.current||n!==Re.current)return;x({slots:Array.
isArray(p)?p:[],approvals:Array.isArray(b)?b:[],agents:Array.isArray(_.agents)?_.agents:[],workflows:Array.isArray(H.runs)?
H.runs:[],crons:Array.isArray(Le.jobs)?Le.jobs:[],artifacts:Array.isArray(qe.artifacts)?qe.artifacts:[],loops:Array.isArray(
C?.loops)?C.loops:[]}),Gn(Array.isArray(te?.runs)?te.runs:[]),tt(null),Zn(Date.now())}catch(p){P.current&&n===Re.current&&
tt(p instanceof Error?p:new Error("Unable to load Crew Manager sources"))}finally{P.current&&n===Re.current&&Dt(!1)}},[]);
U(()=>{A();let n=window.setInterval(()=>{A()},wr);return()=>window.clearInterval(n)},[A]);let no=()=>{Dt(!0),tt(null),A()},
rt=$(()=>{Se||(zt(!0),A().finally(()=>{P.current&&zt(!1)}))},[A,Se]);U(()=>{if(!h||B.current==="unsupported"||B.current===
"disabled")return;let n=Rn(h.slots,ue,Date.now(),p=>W.current.get(p.key)===bt(p));if(n.length===0)return;let l=!1;return(async()=>{
let{summaries:p,support:b}=await Nn(n,_=>t.current.get(_));if(!(l||!P.current)&&(B.current=b,L(b),b==="available")){for(let _ of n)
p[_.key]&&W.current.set(_.key,bt(_));E(_=>({..._,...p}))}})(),()=>{l=!0}},[h]),U(()=>{if(!h||!$t.current)return;let n=!1;
return(async()=>{try{let l=await t.current.get("/api/apps/crew-manager/stalls");if(n||!P.current)return;let p={};for(let _ of l?.
stalls??[])_?.key&&(p[_.key]=_);X(p);let b={};for(let _ of l?.error_loops??[])_?.key&&(b[_.key]=_);Bt(b),Ke(l??null);try{
let _=await t.current.get("/api/apps/crew-manager/assigned");!n&&P.current&&Je(_?.available&&Array.isArray(_.rows)?_.rows:
[])}catch{P.current&&Je([])}}catch{$t.current=!1,P.current&&(X({}),Bt({}),Ke(null),Je([]))}})(),()=>{n=!0}},[h]);let qt=F(
()=>mn(_n({...h??{slots:[],approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},assigned:Kt},O,K,D,Mt),$e),
[h,K,D,Mt,$e,Kt]),Oe=F(()=>xn(qt,Tt,Et),[qt,Tt,Et]),T=F(()=>Oe.items.filter(n=>yn(n)),[Oe]),Ne=F(()=>ft(T),[T]),Ft=F(()=>T.
filter(n=>n.state==="needs-you"&&ne(n)==="followup").length,[T]),oo={...Ne,"needs-you":Math.max(0,(Ne["needs-you"]??0)-Ft),
"follow-up":Ft},st=F(()=>{let n={};for(let l of T){if(l.state!=="done"||!l.sessionKey)continue;let p=n[l.sessionKey];p?p.
push(l.title):n[l.sessionKey]=[l.title]}return n},[T]),ee=F(()=>T.find(n=>n.id===r)??null,[T,r]),Ie=F(()=>i==="all"?T:i===
"follow-up"?T.filter(n=>n.state==="needs-you"&&ne(n)==="followup"):i==="needs-you"?T.filter(n=>n.state==="needs-you"&&ne(
n)!=="followup"):T.filter(n=>n.state===i),[i,T]);U(()=>s(Ne["needs-you"]),[Ne,s]),U(()=>{r&&!T.some(n=>n.id===r)&&u(null)},
[T,r]);let ae=h?.slots.find(n=>n.key===ue),ro=!!(ae||eo),jt=G(!1);U(()=>{let n=ae;if(!n||jt.current||n.agent)return;jt.current=
!0;let l=t.current;l.get("/api/apps/crew-manager/conductor-agent").then(p=>p?.available&&p.agent?p.agent:null).catch(()=>null).
then(p=>{if(!(!p||!P.current))return l.post(`/api/chat/slots/${encodeURIComponent(ue)}/agent`,{agent:p}).then(()=>{A()})}).
catch(()=>{})},[ae,A]),U(()=>{!h||ae||ot.current||(ot.current=!0,e.get("/api/apps/crew-manager/conductor-agent").then(n=>n?.
available&&n.agent?n.agent:null).catch(()=>null).then(n=>e.post("/api/chat/slots",{name:ue,title:"Conductor",...n?{agent:n}:
{}})).then(()=>{P.current&&(to(!0),A())}).catch(n=>{P.current&&(ot.current=!1,V(n instanceof Error?`Conductor session co\
uld not be created: ${n.message}`:"Conductor session could not be created"))}))},[e,ae,A,h]);let Ht=F(()=>ln(h?.approvals??
[],y,n=>T.find(l=>l.sessionKey===n)?.title??h?.slots?.find(l=>l.key===n)?.title??n),[T,h,y]),ge=ee&&!ee.permissionId?ee:
null,at=F(()=>{let n=(h?.loops??[]).filter(p=>p&&p.active!==!1&&p.slot_key);if(n.length===0)return[];let l=new Map;for(let p of T)
for(let b of p.references)b.kind!=="session"||!b.id||b.label&&!l.has(b.id)&&l.set(b.id,b.label);return n.map(p=>{let b=Number(
p.cycle_count)||0,_=Number(p.max_cycles)||0;return{key:p.slot_key,title:l.get(p.slot_key)??p.slot_key,progress:_>0?`${b}\
/${_}`:`${b} ${b===1?"cycle":"cycles"}`,remaining:_>0?Math.max(0,_-b):null,instruction:(p.message??"").replace(/\s+/g," ").
trim(),lastFire:M(p.last_fire_ts)}})},[h,T]),we=F(()=>{let n=new Date;n.setHours(0,0,0,0);let l=n.getTime(),p=l+864e5,b=h?.
crons??[],_=new Map;for(let C of Qe){let te=M(C.started_at);if(!C.job_id||te<l||te>=p)continue;let J=_.get(C.job_id)??{count:0,
failed:0,last:0};J.count+=1,C.status&&C.status!=="success"&&(J.failed+=1),J.last=Math.max(J.last,te),_.set(C.job_id,J)}let H=b.
map(C=>{let te=_.get(C.id),J=M(C.next_run_ts),uo=J>=l&&J<p;return{job:C,ran:te,next:J,dueToday:uo}}).filter(C=>C.ran||C.
dueToday||C.job.is_running),Le=H.filter(C=>C.ran&&C.ran.failed===0).length,qe=H.filter(C=>C.ran&&C.ran.failed>0).length;
return{rows:H,done:Le,failed:qe,total:H.length,historyKnown:Qe.length>0}},[h,Qe]),fe=$(async(n,l)=>{if(!q){De(n),V(null);
try{await t.current.post(`/api/approvals/${encodeURIComponent(n)}/${l?"approve":"reject"}`,{}),A()}catch(p){V(p instanceof
Error?`Could not answer that request: ${p.message}`:"Could not answer that request"),A()}finally{P.current&&De(null)}}},
[A,q]),Ae=$(async(n,l)=>{if(!(q||!n.permissionId||!n.sessionKey)){De(n.permissionId),V(null);try{await t.current.post(`/\
api/chat/slots/${encodeURIComponent(n.sessionKey)}/approve`,{action:l,request_id:n.permissionId}),A()}catch(p){V(p instanceof
Error?`Could not answer that request: ${p.message}`:"Could not answer that request"),A()}finally{P.current&&De(null)}}},
[A,q]),Ut=$(n=>{Pt(l=>{let p=Object.fromEntries(Object.entries(l).filter(([,b])=>b>Date.now()));return p[n]=Date.now()+vn,
ce(yt,p),p}),u(null)},[]),Gt=$((n,l)=>{jn(p=>{let b={...p,[n]:l};return ce(Tn,b),b}),u(null)},[]),so=$(()=>{Pt({}),ce(yt,
{})},[]),ao=$(()=>{Un(n=>!n)},[]),Ce=$(async n=>{if(!re){Ct(n),V(null);try{await t.current.post(n,{}),A()}catch(l){V(l instanceof
Error?`Could not re-run it: ${l.message}`:"Could not re-run it"),A()}finally{P.current&&Ct(null)}}},[A,re]),We=$(async n=>{
if(!se){Wt(n),V(null);try{await t.current.del(n),N("Stopped the monitor loop. Re-arming it is done from the session itse\
lf."),A()}catch(l){let p=l instanceof Error?l.message:"";/404|not found/i.test(p)?N("That loop had already stopped."):V(
p?`Could not stop it: ${p}`:"Could not stop it"),A()}finally{P.current&&Wt(null)}}},[A,se]),he=$(async n=>{let l=ee&&!ee.
permissionId?ee:null;if(g==="session"&&l?.sessionKey){let p=l.sessionKey;if(await t.current.post("/api/chat",{message:n,
slot:p}).catch(b=>{if(!(b instanceof SyntaxError))throw b}),!P.current)return;ke(b=>({...b,[l.id]:Date.now()})),oe(b=>b.
includes(p)?b:[...b,p]),N(`Sent new instructions to ${l.title}`),u(null),A();return}await t.current.post(`/api/chat/slot\
s/${encodeURIComponent(ue)}/context`,{content:_r(ee,T,Sr(ye,ae?.last_ts)),source:"crew-manager",ephemeral:!0}).catch(()=>{}),
await t.current.post("/api/chat",{message:n,slot:ue}).catch(p=>{if(!(p instanceof SyntaxError))throw p})},[ee,T,A,g,ye,ae]),
ze={"needs-you":Ie.filter(n=>n.state==="needs-you"),running:Ie.filter(n=>n.state==="running"),done:Ie.filter(n=>n.state===
"done")},io=ze["needs-you"].filter(n=>ne(n)!=="followup"),lo=ze["needs-you"].filter(n=>ne(n)==="followup"),Te=n=>o(`/cha\
t?sid=${encodeURIComponent(n)}`),Pe=n=>{u(l=>l===n.id?null:n.id),N(null),k("session")},co=ge?f("div",{className:"ow-quot\
e ow-quote-docked",children:[f("div",{className:"ow-quote-body",children:[ge.sessionKey?a("button",{type:"button",className:"\
ow-scope-toggle","aria-pressed":g==="conductor","aria-label":g==="session"?"Sending to this session. Activate to send to\
 the Conductor instead.":"Sending to the Conductor. Activate to send to this session instead.",onClick:()=>k(n=>n==="ses\
sion"?"conductor":"session"),children:g==="session"?"Instructing":"To Conductor"}):a("span",{className:"ow-eyebrow",children:"\
Quoted"}),a("span",{className:"ow-quote-title",title:ge.title,children:ge.title})]}),a(z,{className:"ow-quote-clear","ar\
ia-label":"Remove the quoted work item",onClick:()=>{u(null),N(null)},children:"Clear"})]}):null;return f("div",{className:"\
ow-root","data-crew-manager-shell":"quiet-split",children:[a("style",{children:In}),a("div",{className:"ow-titlebar",children:a(
pr,{title:f("span",{className:"ow-title-line",children:["Crew Manager",a("span",{className:"ow-beta","aria-label":"Beta \
preview",children:"Beta"})]}),subtitle:"See what needs your input, what is still running, and what finished recently."})}),
a("div",{className:"ow-body",children:f("div",{className:"ow-layout",ref:Ge,style:Z.conductor!=null?{"--ow-conductor-w":`${Z.
conductor}px`}:void 0,children:[f("div",{className:"ow-main","data-open-row":Qn,ref:Ye,style:Z.work!=null?{"--ow-work-w":`${Z.
work}px`}:void 0,children:[f("details",{...et("work"),"aria-label":"Work",children:[f("summary",{onClick:n=>{n.preventDefault(),
d!=="work"&&I("work")},children:[f("span",{className:"ow-stack-title",children:[a(pe,{className:"ow-icon ow-stack-chevro\
n"}),a(It,{className:"ow-icon"}),zn.work,a(Q,{variant:"muted",children:Ne.all})]}),a("span",{className:"ow-stack-actions",
children:d==="work"?a(xt,{lastUpdated:nt,refreshing:Se,onRefresh:rt}):a(vt,{id:"work",onPromote:_e})})]}),f("div",{className:"\
ow-worksplit",children:[a("nav",{className:"ow-railnav",role:"group","aria-label":"Filter by state",children:Object.keys(
St).map(n=>f(z,{onClick:()=>c(n),"aria-pressed":i===n,"data-selected":i===n,className:"ow-filter ow-railitem",children:[
a("span",{className:"ow-railitem-label",children:St[n]}),a("span",{className:"ow-count",children:oo[n]})]},n))}),a("main",
{className:"ow-work",children:a("div",{className:"ow-work-inner",children:Xn?a(An,{rows:7}):Ot&&!h?a(Cn,{icon:a($n,{className:"\
ow-icon"}),title:"Crew Manager could not load the work view",subtitle:Ot.message,action:a(z,{onClick:no,children:"Try ag\
ain"})}):Ie.length===0?a(Cn,{icon:a(sr,{className:"ow-icon"}),title:"No matching work",subtitle:"Change the filter to se\
e sessions in another state."}):i==="all"?f(Ue,{children:[a(Me,{title:"Needs you",subtitle:"Waiting on a decision or rep\
ly from you",items:io,doneBySession:st,selectedId:r,onSelect:Pe,onSnooze:Ut,onHandled:Gt,footer:Oe.snoozedCount>0?f("but\
ton",{type:"button",className:"ow-aside-note",onClick:so,children:[Oe.snoozedCount," set aside for later \u2014 bring back"]}):
void 0,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{Ae(n,l)},permissionBusy:q!==null,onRetry:n=>{
Ce(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{he(n)},emptyLabel:"Nothing needs your inp\
ut right now."}),a(Me,{title:"Follow up",subtitle:"Pick back up where a session left off",items:lo,doneBySession:st,selectedId:r,
onSelect:Pe,onSnooze:Ut,onHandled:Gt,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{Ae(n,
l)},permissionBusy:q!==null,onRetry:n=>{Ce(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{he(
n)},emptyLabel:"Nothing to follow up on."}),a(Me,{title:"In progress",subtitle:"Being worked on right now",items:ze.running,
doneBySession:st,selectedId:r,onSelect:Pe,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{
Ae(n,l)},permissionBusy:q!==null,onRetry:n=>{Ce(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{
he(n)},emptyLabel:"Nothing is in progress right now."}),a(Me,{title:"Done recently",subtitle:"Finished in the last few d\
ays",items:ze.done,selectedId:r,onSelect:Pe,collapsed:Hn,onToggleCollapsed:ao,onOpenSession:Te,onAnswerPermission:(n,l)=>{
fe(n,l)},onDecideApproval:(n,l)=>{Ae(n,l)},permissionBusy:q!==null,onRetry:n=>{Ce(n)},retryBusy:re!==null,onStop:n=>{We(
n)},stopBusy:se!==null,onPickStep:n=>{he(n)},emptyLabel:"No recent completed work."})]}):a(Me,{title:St[i],items:Ie,selectedId:r,
onSelect:Pe,onOpenSession:Te,onAnswerPermission:(n,l)=>{fe(n,l)},onDecideApproval:(n,l)=>{Ae(n,l)},permissionBusy:q!==null,
onRetry:n=>{Ce(n)},retryBusy:re!==null,onStop:n=>{We(n)},stopBusy:se!==null,onPickStep:n=>{he(n)},emptyLabel:"No matchin\
g work"})})})]})]}),de.includes("loops")&&f("details",{...et("loops"),children:[f("summary",{onClick:n=>{n.preventDefault(),
d!=="loops"&&I("loops")},children:[f("span",{className:"ow-stack-title",children:[a(pe,{className:"ow-icon ow-stack-chev\
ron"}),a(On,{className:"ow-icon"}),"Loops"]}),f("span",{className:"ow-stack-actions",children:[a(Q,{variant:"muted",children:at.
length}),d==="loops"?a(xt,{lastUpdated:nt,refreshing:Se,onRefresh:rt}):a(vt,{id:"loops",onPromote:_e})]})]}),a("p",{className:"\
ow-stack-sub",children:"Sessions repeating a goal until it is done"}),a("div",{className:"ow-stack-body",children:at.length===
0?a("p",{className:"ow-stack-empty",children:"No loop is running right now."}):at.map(n=>{let l=At(n.lastFire),p=[l&&`la\
st tick ${l}`,n.remaining!==null&&`${n.remaining} remaining`].filter(Boolean).join(" \xB7 ");return f("div",{className:"\
ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),f("div",{children:[f("div",{className:"\
ow-mini-title",children:[n.title,a("span",{className:"ow-mini-chip",children:n.progress})]}),n.instruction&&a("div",{className:"\
ow-mini-desc",title:n.instruction,children:n.instruction}),p&&a("div",{className:"ow-mini-when",children:p})]}),a(Q,{variant:"\
ok",children:"Active"})]},n.key)})})]}),de.includes("schedule")&&f("details",{...et("schedule"),children:[f("summary",{onClick:n=>{
n.preventDefault(),d!=="schedule"&&I("schedule")},children:[f("span",{className:"ow-stack-title",children:[a(pe,{className:"\
ow-icon ow-stack-chevron"}),a(Zo,{className:"ow-icon"}),"Scheduled tasks"]}),f("span",{className:"ow-stack-actions",children:[
f(Q,{variant:we.failed>0?"err":"muted",children:[we.done,"/",we.total," today"]}),d==="schedule"?a(xt,{lastUpdated:nt,refreshing:Se,
onRefresh:rt}):a(vt,{id:"schedule",onPromote:_e})]})]}),a("p",{className:"ow-stack-sub",children:we.historyKnown?"Today'\
s runs only \u2014 jobs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be\
 low"}),a("div",{className:"ow-stack-body",children:we.rows.length===0?a("p",{className:"ow-stack-empty",children:"Nothi\
ng is scheduled for today."}):we.rows.map(({job:n,ran:l,next:p,dueToday:b})=>{let _=!!(l&&l.failed>0),H=[l&&`ran today ${Pn(
l.last)}${l.count>1?` (${l.count}x)`:""}`,b&&p?`next ${Pn(p)}`:null].filter(Boolean).join(" \xB7 ");return f("div",{className:"\
ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:_?"var(--danger)":n.enabled===!1?"var(--muted)":
"var(--warn)"}}),f("div",{children:[a("div",{className:"ow-mini-title",children:n.name}),n.schedule&&f("div",{className:"\
ow-mini-desc",children:[n.schedule,n.cron_expr&&a("span",{className:"ow-mini-chip",children:n.cron_expr})]}),H&&a("div",
{className:"ow-mini-when",children:H})]}),n.is_running?a(Q,{variant:"aim",children:"Running"}):_?a(Q,{variant:"err",children:"\
Failed"}):n.enabled===!1?a(Q,{variant:"muted",children:"Paused"}):l?a(Q,{variant:"ok",children:"Success"}):a(Q,{variant:"\
warn",children:"Pending"})]},n.id)})})]}),Ze.length>0&&a(Kn,{side:"start",containerRef:Ye,min:Y.workMin,reserve:Y.railReserve,
max:1/0,value:Z.work,onChange:n=>Ve(l=>({...l,work:n})),label:"Resize the work column"})]}),a(Kn,{side:"end",containerRef:Ge,
min:Y.conductorMin,reserve:Y.mainReserve,max:Y.conductorMax,value:Z.conductor,onChange:n=>Ve(l=>({...l,conductor:n})),label:"\
Resize the Conductor panel"}),f("aside",{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"\
ow-conductor-header",children:f("div",{className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!ge&&a("s\
pan",{className:"ow-conductor-sub",children:"select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:ro?
f("div",{className:"ow-chat-panel",children:[Ht.length>0&&a("div",{className:"ow-permissions",role:"alert",children:Ht.map(
n=>a(br,{tool:n.tool,purpose:n.purpose,where:n.sessionLabel,busy:q!==null,onAnswer:l=>{fe(n.id,l)}},n.id))}),v&&f("div",
{className:"ow-conductor-receipt",role:"status",children:[a(Dn,{className:"ow-icon"}),v]}),Lt&&a("div",{className:"ow-ch\
at-error",role:"alert",children:Lt}),a("div",{className:"ow-embed",children:a(ur,{slotKey:ue,frameless:!0,startAtBottom:!0,
slotControls:!0,placeholder:ge?.sessionKey&&g==="session"?"New instructions for this session\u2026":"Ask across your wor\
k\u2026",onSend:he,aboveComposer:co})})]}):a("div",{className:"ow-chat-loading",children:a(An,{rows:4})})})]})]})})]})}export{Rr as default,Sr as noticedSinceLastTurn};
