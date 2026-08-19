import{Fragment as qn,useCallback as O,useEffect as j,useMemo as D,useRef as se,useState as N}from"react";import{AlertTriangle as ao,
Bot as vs,Check as io,ChevronRight as pe,Check as lo,Clock as co,Package as xs,ExternalLink as zt,MessageSquare as Gt,Shield as _s,
Waves as uo,Search as Ss,Tag as Ns,Users as ut,Zap as Rs}from"lucide-react";import{useAppApi as Is,useNavigate as Cs,useNavBadge as Ws,
ChatEmbed as As}from"@kirocrew/app-sdk";import{Badge as U,Btn as z,ContentSkeleton as Fn,EmptyState as jn,Input as Bs,PageHeader as Ks}from"@kirocrew/app-sdk/ui";function Me(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let n=Math.floor(t/60),o=t%
60;return o===0?`${n} hour${n===1?"":"s"}`:`${n}h ${o}m`}function fn(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function It(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function mn(e,t,n){let o=new Set(t.filter(Boolean));if(o.size===0)return[];
let s=new Set,l=[];for(let d of e){let c=d.slot;!c||!o.has(c)||!d.id||s.has(d.id)||(s.add(d.id),l.push({id:d.id,sessionKey:c,
sessionLabel:n(c),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return l}var tn={"needs-you":0,running:1,done:2};function T(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function Eo(e,t){
if(e.paused)return"";let n=T(e.next_run_ts);if(!n)return"";let o=Math.round((n-t)/1e3);return o<=0?"":Me(o)}var nn=72;function ye(e,t){
let n=e?.replace(/\s+/g," ").trim();if(!n)return t;let s=(n.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||n).replace(
/[.;,]$/,"");if(s.length<=nn)return s;let l=s.slice(0,nn),d=l.lastIndexOf(" ");return`${(d>24?l.slice(0,d):l).trim()}\u2026`}
function ve(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var Lo=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
Po=/^\((?:code|diff|widget|image)\)$/,To=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
Oo=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,zo=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
Go=/[?？]["'”’)\]]*$/;function wn(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||Po.test(t)||Lo.test(
t)?null:t}function Ct(e){if(!e.waiting_for_input)return null;let t=wn(e);return!t||To.test(t)||Oo.test(t)?null:zo.test(t)||
Go.test(t)?t:null}function on(e){return e.pending_approval||Ct(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":ve(e)?"needs-you":"done"}function Do(e,t){if(e.pending_approval)return t("approval_waiting");let n=Ct(e);return n||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):ve(e)?t("linked_change_issue"):wn(e)??t("recent_w\
ork_ready"))}function _t(e,t){let n=e.project||e.workspace||e.agent;return n&&n.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function qo(e){return e.pending_approval?"review-approval":Ct(e)?"reply":"open"}function Fo(e,t){
let n=(e.source_links??[]).map(o=>({kind:o.kind==="issue"?"issue":"change",id:o.url,label:o.kind==="issue"?`issue #${o.number}`:
`${o.provider} #${o.number}`,url:o.url,sessionKey:e.key,status:fn(o)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:Do(e,t),state:on(e),moving:on(e)==="running"||void 0,issue:ve(e),updatedAt:T(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:_t(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:ve(e)||void 0,action:qo(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...n]}}function Wt(e,t){e.references.
some(n=>n.kind===t.kind&&n.id===t.id)||e.references.push(t)}function hn(e){return(e.source||"").toLowerCase()==="subagen\
t"}function jo(e,t,n){let o=hn(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,T(t.ts)),e.summary=n(o?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=o?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,Wt(e,{kind:"approval",id:t.id,label:t.tool||t.source||n("approval"),
sessionKey:t.slot||e.sessionKey})}function Uo(e,t,n){e.updatedAt=Math.max(e.updatedAt,T(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=n("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=n("work_in_progress")),Wt(e,{kind:"agent",id:t.id,
label:t.agent||n("agent"),sessionKey:t.parent||e.sessionKey})}function Vo(e,t,n){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=n("workflow\
_failed",{name:t.name})),Wt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function Yo(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function Ho(e,t,n){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===n}function Jo(e){let t=null,n=-1;for(let o of e){let s=o.last_touched_turn??0;s>n&&(n=s,t=o)}return t}function Xo(e,t){let n=e.next_steps?.find(s=>s.what?.trim())?.what?.trim();if(n)return n;let o=[...e.progress??[]].reverse().
find(s=>s.trim());return o?o.trim():e.initial_intent?.trim()||t("work_in_progress")}var Qo=3;function Zo(e,t,n){if(!t?.enabled)
return[];let o=t.intents??[];if(o.length===0)return[];let s=(e.source_links??[]).map(a=>({kind:a.kind==="issue"?"issue":
"change",id:a.url,label:a.kind==="issue"?`issue #${a.number}`:`${a.provider} #${a.number}`,url:a.url,sessionKey:e.key,status:fn(
a)})),l=[],d=Jo(o),p=!!(e.running||e.subagents_running||e.orchestrating)?[]:o.filter(a=>a.state==="in-progress");p.forEach(
a=>{let f=o.indexOf(a),b=(a.next_steps??[]).filter(I=>I.what?.trim());l.push({id:`unattended:${e.key}:${f}`,title:ye(a.title,
e.title||n("untitled_work")),summary:b[0]?.what?.trim()||n("no_next_step"),state:"needs-you",issue:ve(e),updatedAt:T(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:_t(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:ve(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||n("untitled_work"),sessionKey:e.
key},...s],nextSteps:b,progress:(a.progress??[]).filter(I=>I.trim()),stale:!!t.stale,lastTouchedTurn:a.last_touched_turn??
0})}),o.forEach((a,f)=>{if(p.includes(a))return;let b=Yo(a,e);if(!b)return;let I=(a.next_steps??[]).filter(y=>y.what?.trim());
l.push({id:`intent:${e.key}:${f}`,title:ye(a.title,e.title||n("untitled_work")),summary:Xo(a,n),state:b,issue:!1,updatedAt:T(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:_t(e,n),queuedBehind:e.queue_depth||void 0,changeBlocked:ve(
e)||void 0,unverified:a.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||n("untit\
led_work"),sessionKey:e.key},...s],nextSteps:I,progress:(a.progress??[]).filter(y=>y.trim()),stale:!!t.stale,lastTouchedTurn:a.
last_touched_turn??0,moving:Ho(a,e,d)||void 0})});let m=l.filter(a=>a.state==="needs-you"),v=l.filter(a=>a.state!=="need\
s-you").sort((a,f)=>(f.lastTouchedTurn??0)-(a.lastTouchedTurn??0));return[...m,...v].slice(0,Math.max(Qo,m.length))}var bn=new Set(
["crew-manager-conductor","overwatch-conductor"]),es={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},ts=3;function ns(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var at=5;function kn(e,t,n=Date.now()){let o=At(e),s=In(
e.filter(d=>d.state==="needs-you"),n),l=[`Fleet: ${o["needs-you"]} waiting on the user, ${o.running} in progress, ${o.done}\
 finished recently.`];return s.length===0?(l.push("Nothing is waiting on the user."),l):(l.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(at,s.length)}):`),s.slice(0,at).forEach((d,c)=>{let p=Pe(ue(d,n),t),m=d.sessionKey?
` [session ${d.sessionKey}]`:"";l.push(`${c+1}. ${d.title} \u2014 ${d.summary} (${p})${m}`)}),s.length>at&&l.push(`\u2026and ${s.
length-at} more waiting.`),l)}var xe=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),sn=.6,rn=2,yn=new Set;function St(e){return[...new Set(e.toLowerCase().replace(
/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(t=>t.length>2&&!xe.has(t)))]}function it(e,t){let n=St(e),o=St(t);if(n.length<
rn||o.length<rn)return 0;let s=n.length<=o.length?n:o,l=new Set(n.length<=o.length?o:n);return s.filter(c=>l.has(c)).length/
s.length}function an(e){return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function ln(e){return e.
references.filter(t=>t.kind==="artifact").map(t=>t.id)}function dn(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}
var os=new Set(["pull request","pull requests","status update","work in progress","code review","follow up","next step",
"next steps","action item","action items","kiro crew","in progress","needs you"]);function Ee(e){let t=new Set,n=e.match(
/\b\p{Lu}[\p{L}\p{N}]*(?:\s+\p{Lu}[\p{L}\p{N}]*)+/gu)??[];for(let o of n){let s=o.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean).map(l=>l.length>3&&l.endsWith("s")&&!l.endsWith("ss")?l.slice(0,-1):l);for(;s.length&&
xe.has(s[0]);)s.shift();for(;s.length&&xe.has(s[s.length-1]);)s.pop();if(!(s.length<2))for(let l=s.length;l>=2;l-=1)for(let d=0;d+
l<=s.length;d+=1){let c=s.slice(d,d+l).join(" ");os.has(c)||t.add(c)}}return[...t]}function vn(e){let t=new Set;if(e.length<
ss)return t;let n=new Map;for(let o of e)for(let s of Ee(o.title))n.set(s,(n.get(s)??0)+1);for(let[o,s]of n)s/e.length>=
rs&&t.add(o);return t}var ss=4,rs=.75;function Le(e,t,n=yn){if(an(e).find(d=>an(t).includes(d)))return"same_change";if(ln(
e).find(d=>ln(t).includes(d)))return"same_artifact";let l=Ee(t.title).filter(d=>!n.has(d));if(Ee(e.title).some(d=>l.includes(
d)))return"same_deliverable";if(it(e.title,t.title)>=sn)return"same_topic";for(let d of dn(e))for(let c of dn(t))if(it(d,
c)>=sn)return"same_step";return null}function xn(e,t){return e.parentId===t.id||t.parentId===e.id?"spawned":cn(e).includes(
t.id)||cn(t).includes(e.id)?"references":null}function cn(e){let t=[];for(let n of e.references)n.kind==="artifact"?t.push(
`artifact:${n.id}`):n.kind==="workflow"?t.push(`workflow:${n.id}`):n.kind==="agent"?t.push(`agent:${n.id}`):n.kind==="mo\
nitor"&&t.push(`monitor:${n.id}`,`loop:${n.id}`);return t.filter(n=>n!==e.id)}var Je={merged:[],split:[]};function lt(e){
return`${e.sessionKey??e.id}|${St(e.title).join(" ")}`}function ce(e,t){return[lt(e),lt(t)].sort().join("")}function as(e,t=Je){
let n=e.filter(s=>s.state!=="done"&&s.sessionKey).sort((s,l)=>(s.updatedAt||0)-(l.updatedAt||0)),o=vn(n);for(let s=1;s<n.
length;s+=1){let l=n[s];for(let d=0;d<s;d+=1){let c=n[d];if(c.sessionKey===l.sessionKey||t.split.includes(ce(l,c)))continue;
let p=Le(l,c,o);if(p){l.duplicateOf={sessionKey:c.sessionKey,title:c.title,because:p};break}}}is(n,t,o)}var xt=3,dt=["sa\
me_change","same_artifact","same_deliverable","same_topic","same_step"];function is(e,t,n=yn){for(let o of e){let s=[],l=new Set;
for(let d of e){let c=d.sessionKey;if(c===o.sessionKey||l.has(c)||t.split.includes(ce(o,d)))continue;let p=Le(o,d,n);p&&
(l.add(c),s.push({sessionKey:c,title:d.title,because:p}))}s.length!==0&&(s.sort((d,c)=>dt.indexOf(d.because)-dt.indexOf(
c.because)),o.relatedSessions=s.slice(0,xt),s.length>xt&&(o.relatedMore=s.length-xt))}}var ls=3e4;function _n(e,t,n=Date.
now()){return Object.keys(t).length===0?e:e.map(o=>{let s=t[o.id];return!s||n-s>ls||o.state==="running"?o:{...o,state:"r\
unning",moving:!0,instructed:!0}})}function ue(e,t=Date.now()){let n=[],o=(l,d,c=1)=>{n.push({signal:l,weight:es[l]*c,values:d})};
e.approvalKind==="subagent"?o("subagent_gate"):e.approvalKind==="tool"&&o("approval_owed"),e.action==="reply"&&o("input_\
requested"),e.unverified&&o("unverified_completion"),e.loopRepeats&&o("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&
o("run_failed"),e.stalledFor&&o("stalled",{duration:Me(e.stalledFor)}),e.changeBlocked&&o("change_blocked"),e.unattendedGoals&&
o("nobody_on_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&o("queued_behind",{count:String(e.queuedBehind)},Math.
min(e.queuedBehind,3));let s=ns(e,t);return s>0&&o("waiting_a_while",{hours:String(s)},Math.min(s,ts)),n.sort((l,d)=>d.weight-
l.weight),{score:n.reduce((l,d)=>l+d.weight,0),signals:n}}var ds={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"\
unblock",unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",change_blocked:"unb\
lock",nobody_on_it:"followup"};function ct(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let n of ue(e,t).signals){
let o=ds[n.signal];if(o)return o}return null}var Sn=14400*1e3;function Nn(e,t,n,o=Date.now()){let s=0,l=[];for(let d of e){
if(d.state!=="needs-you"){l.push(d);continue}let c=t[d.id];if(c&&c>o){s+=1;continue}let p=n[d.id];if(p!==void 0&&d.updatedAt<=
p){l.push({...d,state:"done",issue:!1});continue}l.push(d)}return{items:l,snoozedCount:s}}var cs=4320*60*1e3;function Rn(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=cs}var us={"needs-you":1,running:-1,done:-1};function ps(e,t,n){
let o=e.updatedAt>0,s=t.updatedAt>0;return!o&&!s?0:o?s?(e.updatedAt-t.updatedAt)*n:-1:1}function Pe(e,t){let n=e.signals.
slice(0,2);return n.length===0?t("rank_nothing_pressing"):n.map(s=>t(`rank_${s.signal}`,s.values)).join(t("rank_join"))}
function In(e,t=Date.now()){let n=new Map(e.map(o=>[o.id,ue(o,t)]));return[...e].sort((o,s)=>{let l=tn[o.state]-tn[s.state];
if(l!==0)return l;if(o.state==="needs-you"){let d=(n.get(s.id)?.score??0)-(n.get(o.id)?.score??0);if(d!==0)return d}else if(o.
issue!==s.issue)return o.issue?-1:1;return ps(o,s,us[o.state])})}function Cn(e,t,n={},o={},s={},l=Je,d=Date.now()){let c=new Map,
p=new Map;for(let a of e.slots){if(!a.key||bn.has(a.key)||a.memory_mode==="incognito")continue;let f=Zo(a,n[a.key],t);if(f.
length>0){for(let y of f)c.set(y.id,y);let I=f.find(y=>y.state==="needs-you")??f[0];p.set(a.key,I);continue}let b=Fo(a,t);
c.set(b.id,b),p.set(a.key,b)}for(let[a,f]of Object.entries(o)){let b=p.get(a);b&&(b.state="needs-you",b.issue=!0,b.stalledFor=
f.silent_secs,b.summary=f.reason?t("stalled_because",{reason:f.reason,duration:Me(f.silent_secs)}):t("stalled_for",{duration:Me(
f.silent_secs)}),b.action="open")}for(let[a,f]of Object.entries(s)){let b=p.get(a);b&&(b.state="needs-you",b.issue=!0,b.
loopRepeats=f.repeats,b.summary=t("error_loop",{tool:f.tool,repeats:String(f.repeats)}),b.action="open")}for(let a of e.
approvals){let f=a.slot?p.get(a.slot):void 0;if(f){jo(f,a,t);continue}c.set(`approval:${a.id}`,{id:`approval:${a.id}`,title:ye(
a.tool||a.source,t("approval_needed")),summary:a.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:T(
a.ts),provenance:t("approval"),action:"review-approval",approvalKind:hn(a)?"subagent":"tool",permissionId:a.id,permissionTool:a.
tool||a.source,permissionPurpose:a.tool_purpose,references:[{kind:"approval",id:a.id,label:a.tool||a.source||t("approval")}]})}
for(let a of e.agents){let f=a.parent?p.get(a.parent):void 0;if(f){Uo(f,a,t);continue}let b=!!(a.done&&(a.error||a.outcome===
"failed"));a.parent&&!b||c.set(`agent:${a.id}`,{id:`agent:${a.id}`,title:ye(a.task||a.agent,t("agent_work")),summary:b?a.
error?.trim()||t("agent_failed",{task:a.task}):a.done?t("agent_done"):t("work_in_progress"),state:b?"needs-you":a.done?"\
done":"running",issue:b,runFailed:b||void 0,retryPath:b&&!a.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(a.
id)}/retry`:void 0,updatedAt:T(a.started),provenance:a.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:a.
id,label:a.agent||t("agent")}]})}for(let a of e.workflows){let f=a.session_key?p.get(a.session_key):void 0;if(f){Vo(f,a,
t);continue}let b=a.status==="failed";c.set(`workflow:${a.run_id}`,{id:`workflow:${a.run_id}`,title:ye(a.name,a.run_id),
summary:b?t("workflow_failed_generic"):a.status==="running"?t("workflow_running"):t("workflow_finished"),state:b?"needs-\
you":a.status==="running"?"running":"done",issue:b,runFailed:b||void 0,retryPath:b?`/api/workflows/runs/${encodeURIComponent(
a.run_id)}/rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:a.run_id,
label:a.name||a.run_id}]})}for(let a of e.crons){if(!a.is_running&&a.last_status!=="error")continue;let f=a.last_status===
"error",b=Eo(a,d),I=t(f?"monitor_failed":"monitor_running");c.set(`monitor:${a.id}`,{id:`monitor:${a.id}`,title:a.name,summary:b?
`${I} ${t("monitor_next_check",{duration:b})}`:I,state:f?"needs-you":"running",issue:f,runFailed:f||void 0,retryPath:f?`\
/api/crons/${encodeURIComponent(a.id)}/run`:void 0,updatedAt:T(a.running_since||a.last_run_ts||a.created_ts),provenance:t(
"monitor"),action:f?"discuss":void 0,references:[{kind:"monitor",id:a.id,label:a.name}]})}for(let a of e.loops||[]){if(!a.
active)continue;let f=String(a.id||"");if(!f)continue;let b=Math.max(0,Number(a.cycle_count)||0),I=Math.max(0,Number(a.max_cycles)||
0),y=a.slot_key&&p.has(a.slot_key)?a.slot_key:void 0;c.set(`loop:${f}`,{id:`loop:${f}`,title:ye(a.message||"",t("loop")),
summary:I?t("loop_watching_capped",{cycles:String(b),cap:String(I)}):t("loop_watching",{cycles:String(b)}),state:"runnin\
g",issue:!1,updatedAt:T(a.last_fire_ts||a.created_ts),sessionKey:y,parentId:y?p.get(y)?.id:void 0,provenance:t("loop"),stopPath:`\
/api/autonudge/${encodeURIComponent(f)}`,action:y?"open":void 0,references:[{kind:"monitor",id:f,label:t("loop"),sessionKey:y},
...y?[{kind:"session",id:y,label:p.get(y)?.title||y,sessionKey:y}]:[]]})}let m=[...e.artifacts].sort((a,f)=>T(f.updated_at)-
T(a.updated_at)).slice(0,8);for(let a of m){let f=a.session_key&&p.has(a.session_key)?a.session_key:void 0;c.set(`artifa\
ct:${a.slug}`,{id:`artifact:${a.slug}`,title:ye(a.name,t("artifact")),summary:a.description||t("artifact_ready",{kind:a.
kind}),state:"done",issue:!1,updatedAt:T(a.updated_at||a.created_at),sessionKey:f,parentId:f?p.get(f)?.id:void 0,provenance:a.
session_title||a.source||t("artifact"),action:f?"open":void 0,references:[{kind:"artifact",id:a.slug,label:a.name,sessionKey:f},
...f?[{kind:"session",id:f,label:a.session_title||f,sessionKey:f}]:[]]})}let v=[...c.values()];return as(v,l),In(v)}function At(e){
return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-you").length,running:e.filter(t=>t.state==="running").length,
done:e.filter(t=>t.state==="done").length}}function Wn(e){let t=[],n=new Map;for(let o of e){let s=o.sessionKey;if(!s)continue;let l=n.get(s);if(l){l.count+=1;continue}
let d=o.references.find(p=>p.kind==="session")?.label??o.provenance,c={sessionKey:s,label:d,leading:o,count:1};n.set(s,c),
t.push(c)}return t}function Bt(e,t,n=Je){if(t==="pr")return gs(e);if(t==="goal")return Nt(e,n);let o=[],s=new Map;for(let l of e){
let d=l.sessionKey;if(!d){o.push({key:l.id,items:[l],header:null,sessionKey:null,changeRef:null});continue}let c=s.get(d);
if(c){c.items.push(l);continue}let p={key:d,items:[l],header:"session",sessionKey:l.sessionKey??null,changeRef:null};s.set(
d,p),o.push(p)}return o}function gs(e){let t=[],n=new Map;for(let o of e){let s=o.references.filter(l=>l.kind==="change"||
l.kind==="issue");for(let l of s){let d=`${l.kind}:${l.id}`,c=n.get(d);if(c){c.items.push(o);continue}let p={key:d,items:[
o],header:"pr",sessionKey:null,changeRef:l};n.set(d,p),t.push(p)}}return t}function Nt(e,t){let n=vn(e),o=e.map((p,m)=>m),
s=p=>{for(;o[p]!==p;)o[p]=o[o[p]],p=o[p];return p},l=(p,m)=>{o[s(m)]=s(p)};for(let p=0;p<e.length;p+=1)for(let m=p+1;m<e.
length;m+=1){let v=e[p],a=e[m],f=ce(v,a);if(!t.split.includes(f)){if(xn(v,a)){l(p,m);continue}if(t.merged.includes(f)){l(
p,m);continue}!v.sessionKey||!a.sessionKey||v.sessionKey===a.sessionKey||Le(v,a,n)&&l(p,m)}}let d=[],c=new Map;for(let p=0;p<
e.length;p+=1){let m=s(p),v=c.get(m);if(v){v.items.push(e[p]),v.header="goal";continue}let a={key:`goal:${e[p].id}`,items:[
e[p]],header:null,sessionKey:null,changeRef:null};c.set(m,a),d.push(a)}for(let p of d)p.key=fs(p.items);return d}function fs(e){
return`goal:${[...e.map(t=>t.id)].sort()[0]}`}var ms=.5;function ws(e,t){let n=new Set,o=[...e].sort((s,l)=>l.items.length-
s.items.length);for(let s of o){let l=new Set(s.items.map(lt)),d=null;for(let c of t){if(n.has(c.key))continue;let p=c.members.
filter(v=>l.has(v)).length;if(!p)continue;let m=p/Math.min(l.size,c.members.length);m<ms||(!d||m>d.score)&&(d={key:c.key,
score:m})}d&&(n.add(d.key),s.key=d.key)}return e}function An(e){return e.map(t=>({key:t.key,members:t.items.map(lt)}))}function Rt(e,t){
let n=t.split(" ").map(o=>`${hs(o)}s?`).join("[\\s/_,-]+");return e.match(new RegExp(n,"iu"))?.[0]??null}function hs(e){
return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Bn(e,t=Je){if(e.length<2)return null;let n=null,o=null;for(let s=0;s<
e.length;s+=1)for(let l=s+1;l<e.length;l+=1){let d=e[s],c=e[l];if(xn(d,c))return`${c.parentId===d.id?c.title:d.title} wa\
s started by this work`;if(t.merged.includes(ce(d,c)))return"you merged these";let p=Le(d,c);if(p&&(!n||dt.indexOf(p)<dt.
indexOf(n))&&(n=p,p==="same_deliverable")){let m=Ee(c.title),v=Ee(d.title).find(a=>m.includes(a))??null;o=v?Rt(d.title,v)??
Rt(c.title,v)??v:null}}return n?n==="same_change"?"these sessions work on the same change":n==="same_artifact"?"these se\
ssions share the same output":n==="same_deliverable"?o?`both are about ${o}`:"both name the same deliverable":n==="same_\
step"?"these sessions have the same next step":"these sessions describe the same work":null}var bs=12;function Kn(e){if(e.
length<2)return null;let t=new Map;for(let p of e)for(let m of Ee(p.title))t.set(m,(t.get(m)??0)+1);let n=un(t);if(n)return pn(
e,n)??n;let o=new Map;for(let p of e)for(let m of p.references){if(m.kind!=="change"&&m.kind!=="issue")continue;let v=o.
get(m.id);o.set(m.id,{label:m.label,members:(v?.members??0)+1})}let s=[...o.values()].filter(p=>p.members>=2).sort((p,m)=>m.
members-p.members)[0];if(s)return s.label;let l=new Map;e.forEach((p,m)=>{for(let v of ks(p.title))l.has(v)||l.set(v,new Set),
l.get(v).add(m)});let d=new Map;for(let[p,m]of l)d.set(p,m.size);let c=un(d);return c?pn(e,c)??c:null}function un(e){return[
...e.entries()].filter(([,t])=>t>=2).sort((t,n)=>n[1]-t[1]||n[0].length-t[0].length)[0]?.[0]??null}function pn(e,t){let n=null;
for(let o of e){let s=Rt(o.title,t);if(s){if(/^\p{Lu}/u.test(s))return s;n??=s}}return n}function ks(e){let t=e.toLowerCase().
replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean),n=[];for(let o=Math.min(t.length,bs);o>=2;o-=1)for(let s=0;s+
o<=t.length;s+=1){let l=t.slice(s,s+o);xe.has(l[0])||xe.has(l[o-1])||l[0].length<2||l[o-1].length<2||n.push(l.join(" "))}
return n}function $n(e,t){let n=e.references.find(o=>o.kind==="session")?.label??"";for(let o of[e.title,n,e.provenance]){
let s=o.toLowerCase();for(let l of t)if(l.aliases.some(d=>d&&s.includes(d.toLowerCase())))return l.name}return null}function Mn(e,t){
let n=t.flatMap(l=>l.aliases.map(d=>d.toLowerCase())),o=new Set(["workspace","workspaces","home","src","tmp","documents",
"desktop"]),s=new Map;for(let l of e){if(!l.key||bn.has(l.key)||l.memory_mode==="incognito")continue;let d=l.project;if(!d)
continue;let c=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!c||o.has(c.toLowerCase())||n.some(p=>c.toLowerCase().
includes(p)||p.includes(c.toLowerCase()))||s.set(c,(s.get(c)??0)+1)}return[...s.entries()].map(([l,d])=>({name:l,sessions:d})).
sort((l,d)=>d.sessions-l.sessions)}function En(e,t){let n=new Map;for(let l of e){if(!l.sessionKey||$n(l,t)!==null)continue;
let d=l.references.find(c=>c.kind==="session")?.label??"";for(let c of[l.title,d]){let p=c.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(Boolean);for(let m of[3,2])for(let v=0;v+m<=p.length;v+=1){let a=p.slice(v,v+m);if(xe.has(a[0])||
xe.has(a[m-1])||a[0].length<3||a[m-1].length<3)continue;let f=a.join(" ");n.has(f)||n.set(f,new Set),n.get(f).add(l.sessionKey)}}}
let o=[...n.entries()].map(([l,d])=>({phrase:l,sessions:d.size})).filter(l=>l.sessions>=2);return o.filter(l=>!o.some(d=>d.
phrase!==l.phrase&&d.phrase.includes(l.phrase)&&d.sessions>=l.sessions)).sort((l,d)=>d.sessions-l.sessions||d.phrase.length-
l.phrase.length).map(l=>({name:l.phrase.replace(/\p{L}+/gu,d=>d[0].toUpperCase()+d.slice(1)),sessions:l.sessions}))}function gn(e){
return e.some(t=>t.state==="needs-you")?"needs-you":e.some(t=>t.state==="running")?"running":"done"}function Ln(e,t=Date.
now()){return e.issue?"crit":e.state==="needs-you"?ct(e,t)==="followup"?"idle":"warn":"good"}function Xe(e){let t=new Set,n=new Set,o=new Set,s=0,l=0,d=0,c=0,p=0;for(let m of e){m.sessionKey&&t.add(m.sessionKey);for(let v of m.
references)v.kind==="change"?n.add(v.id):v.kind==="issue"&&o.add(v.id);m.id.startsWith("workflow:")?s+=1:m.id.startsWith(
"monitor:")?l+=1:m.id.startsWith("agent:")&&(d+=1),m.state==="needs-you"&&(c+=1),m.updatedAt>p&&(p=m.updatedAt)}return{sessions:t.
size,prs:n.size,issues:o.size,loops:s,crons:l,agents:d,needsYou:c,lastActivityAt:p}}function Pn(e){let t=e.find(o=>o.moving);
if(t)return t;let n=e.find(o=>o.state==="running");return n||[...e].sort((o,s)=>(s.updatedAt||0)-(o.updatedAt||0))[0]}function ys(e){
let t=[],n=new Set;for(let o of e){let s=o.sessionKey;!s||n.has(s)||(n.add(s),t.push(o.references.find(l=>l.kind==="sess\
ion")?.label??o.provenance))}return t}function Tn(e,t,n=Je,o=[]){let s=new Map,l=[],d=new Map;for(let a of e){let f=$n(a,
t);if(d.set(a.id,f),f===null){l.push(a);continue}s.has(f)||s.set(f,[]),s.get(f).push(a)}let c=ws(Nt(l,n),o),p=new Map;for(let a of c)
p.set(a.items[0].id,a);let m=[],v=new Set;for(let a of e){let f=d.get(a.id)??null;if(f!==null){if(v.has(f))continue;v.add(
f);let I=s.get(f);m.push({key:`initiative:${f}`,name:f,status:gn(I),sessions:ys(I),blocks:Nt(I,n)});continue}let b=p.get(
a.id);b&&m.push({key:b.key,name:null,status:gn(b.items),sessions:[],blocks:[b]})}return m}function Kt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function zn(e,t){return e.filter(n=>n.key&&
n.key!==t&&n.memory_mode!=="incognito").sort((n,o)=>On(o)-On(n)).slice(0,12)}function On(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let n=Date.parse(t);return Number.isFinite(n)?n:0}async function Gn(e,t){
let n={},o="unknown";for(let s of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(s.key)}/summary`);if(!l||typeof l!=
"object"){o="unsupported";break}if(l.enabled===!1){o="disabled";break}n[s.key]=l,o="available"}catch{o="unsupported";break}
return{summaries:n,support:o}}var Dn=String.raw`
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
  .ow-goal-meta { margin: 4px 0 0 26px; color: var(--muted); font-size: 11px; }
  /* Why the merge happened. Subdued below the meta: it answers a question the
     user only asks when the grouping looks wrong, so it must not compete with
     the goal's own name or its composition. */
  .ow-goal-why { margin: 2px 0 0 26px; color: var(--muted); font-size: 11px; font-style: italic; opacity: 0.85; }
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
`;import{Fragment as Ge,jsx as i,jsxs as g}from"react/jsx-runtime";var $t="crew-manager.snoozed",Un="crew-manager.handled",
Vn="crew-manager.done-collapsed",Mt="crew-manager.goal-verdicts",Yn="crew-manager.goal-memory",Hn="crew-manager.initiati\
ve-collapsed",Jn="crew-manager.open-stack",Xn="crew-manager.split",Qn="crew-manager.tab",Zn=40,$s=25,Ms=75;function re(e,t={}){
try{let n=localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}function X(e,t){try{localStorage.setItem(e,JSON.
stringify(t))}catch{}}function po(e,t=Date.now()){if(!e)return null;let n=Math.max(0,Math.round((t-e)/1e3));if(n<60)return"\
just now";let o=Math.round(n/60);if(o<60)return`${o}m ago`;let s=Math.round(o/60);return s<24?`${s}h ago`:`${Math.round(
s/24)}d ago`}function eo(e){return e?new Date(e).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}function Te(e,t,n){
return e<=0?null:`${e} ${e===1?t:n}`}function Et(e,t=Date.now()){let n=Xe(e),o=[Te(n.sessions,"session","sessions"),Te(n.
prs,"PR","PRs"),Te(n.issues,"issue","issues"),Te(n.loops,"loop","loops"),Te(n.crons,"cron","crons"),Te(n.agents,"agent",
"agents")].filter(l=>!!l),s=po(n.lastActivityAt,t);return s&&o.push(`last active ${s}`),o.join(" \xB7 ")}var Oe="crew-ma\
nager-conductor",Es=5e3,Ls={session:"Session",approval:"Approval",agent:"Agent",workflow:"Workflow",monitor:"Monitor",artifact:"\
Artifact",approval_waiting:"Review the pending approval request",subagent_gate_waiting:"Allow or refuse a sub-agent held\
 at the spawn gate",information_needed:"Answer the request in the work thread",decision_ready:"Make the decision this wo\
rk is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"Open the linked change \u2014 a check is failin\
g or it conflicts",recent_work_ready:"Pick this back up, or let it go",approval_needed_for:"Review the pending {{tool}} \
request",approval_needed:"Approval needed",tool_call_waiting:"Allow or refuse a waiting tool call",agent_work:"Agent wor\
k",agent_done:"This agent run finished",agent_failed:"This agent stopped before finishing \u2014 nothing to do here",workflow_failed:"\
This workflow stopped before finishing",workflow_failed_generic:"This workflow stopped before finishing",workflow_running:"\
Workflow is running",workflow_finished:"Workflow finished",monitor_failed:"The latest check stopped before finishing",monitor_running:"\
Monitor is checking now",monitor_next_check:"Checks again in {{duration}}.",loop:"Monitor loop",loop_watching:"Re-prompt\
ing its own session \u2014 {{cycles}} cycles so far, no limit set",loop_watching_capped:"Re-prompting its own session \u2014 \
cycle {{cycles}} of {{cap}}",artifact_ready:"{{kind}} output is ready",stalled_for:"Check on it \u2014 no activity for {{dura\
tion}}, still marked running",stalled_because:"{{reason}} Silent for {{duration}}.",duplicate_same_change:"Also being wo\
rked in \u201C{{title}}\u201D \u2014 same linked change",duplicate_same_artifact:"Also being worked in \u201C{{title}}\u201D \u2014 sam\
e artifact",duplicate_same_deliverable:"Also being worked in \u201C{{title}}\u201D \u2014 same deliverable",duplicate_same_topic:"\
Looks like the same work as \u201C{{title}}\u201D",duplicate_same_step:"Next step matches \u201C{{title}}\u201D \u2014 may be the same \
work",related_sessions:"{{count}} other session(s) on this same work",related_same_change:"same change",related_same_artifact:"\
same artifact",related_same_deliverable:"same deliverable",related_same_topic:"similar goal",related_same_step:"same nex\
t step",related_more:"and {{count}} more",rank_approval_owed:"only you can clear this approval",rank_subagent_gate:"a su\
b-agent is held at the spawn gate",rank_input_requested:"the agent asked you a question",rank_unverified_completion:"fin\
ished but never verified",rank_error_loop:"the same failure has repeated {{repeats}} times",rank_run_failed:"the run fai\
led and has not been retried",rank_stalled:"silent for {{duration}}",rank_change_blocked:"a linked change is failing or \
conflicting",rank_nobody_on_it:"nobody is on {{count}} unfinished goal(s) in this session",no_next_step:"No next step re\
corded \u2014 nobody is on this",rank_queued_behind:"{{count}} more prompt(s) queued in this session",rank_waiting_a_while:"\
waiting {{hours}}h",rank_nothing_pressing:"nothing pressing \u2014 ordered by recency",rank_join:", and ",error_loop:"{{\
tool}} has failed the same way {{repeats}} times in a row",untitled_work:"Untitled work"};function Z(e,t={}){return Ls[e].
replace(/\{\{(\w+)\}\}/g,(n,o)=>t[o]??"")}var Ps={followup:"FOLLOW UP",unblock:"UNBLOCK"},ge={"needs-you":"Needs you",running:"\
Running",done:"Done"},Lt={all:"All","needs-you":"Needs you",running:"Running",done:"Done"},to={all:"All",failing:"Failin\
g",running:"Running",merged:"Merged"},Ts={session:Gt,approval:ao,agent:vs,workflow:Rs,monitor:uo,artifact:xs,change:zt,issue:Ns};
function fe({children:e,onActivate:t,...n}){return i("div",{...n,role:"button",tabIndex:0,onClick:t,onKeyDown:o=>{(o.key===
"Enter"||o.key===" ")&&(o.preventDefault(),t())},children:e})}function no({label:e,count:t,subtitle:n}){return g("div",{
className:"ow-section-header",children:[g("div",{className:"ow-section-heading",children:[i("h2",{className:"ow-section-\
title",children:e}),i("span",{className:"ow-section-count",children:t})]}),n&&i("p",{className:"ow-section-subtitle",children:n})]})}
function go(e){if(e.state==="needs-you"){let t=ct(e);return t?i(U,{variant:"warn",className:"ow-verb",children:Ps[t]}):null}
return e.state==="running"?e.moving?g(U,{variant:"aim",children:[i(co,{className:"ow-icon"}),ge[e.state]]}):i(U,{variant:"\
muted",children:"Queued"}):g(U,{variant:"ok",children:[i(lo,{className:"ow-icon"}),ge[e.state]]})}function fo({tool:e,purpose:t,busy:n,onAnswer:o,where:s}){return g("div",{className:"ow-permission",children:[g("div",{className:"\
ow-permission-body",children:[g("div",{className:"ow-permission-head",children:[i(_s,{className:"ow-icon","aria-hidden":"\
true"}),i("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),g("p",{className:"ow-permi\
ssion-what",children:[s&&g("span",{className:"ow-truncate",children:[s," "]}),s?"wants to run ":"Wants to run ",i("code",
{children:e})]}),t&&i("p",{className:"ow-permission-why",children:t})]}),g("div",{className:"ow-permission-actions",children:[
i(z,{onClick:()=>o(!0),disabled:n,children:"Approve"}),i(z,{onClick:()=>o(!1),disabled:n,children:"Reject"})]})]})}function Qe({
children:e}){return i("div",{className:"ow-expand",children:i("div",{className:"ow-expand-inner",children:e})})}var Pt=3;
function oo(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(n=>n.label.trim().toLowerCase()!==t)}function Os({
candidates:e,prominent:t,busy:n,onAdd:o}){let[s,l]=N(""),d=t?e:e.filter(c=>c.sessions>=2);return g("div",{className:"ow-\
bootstrap","data-prominent":t?"true":void 0,children:[i("div",{className:"ow-bootstrap-head",children:t?"No big goals de\
fined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&i("div",{className:"ow-bootstrap-sub",children:"\
Found in your unassigned work \u2014 click one to confirm it as a goal, or name your own."}),d.length>0&&i("div",{className:"\
ow-bootstrap-chips",children:d.slice(0,4).map(c=>g("button",{type:"button",className:"ow-bootstrap-chip",disabled:n,onClick:()=>o(
c.name,[c.name]),children:[c.name," ",g("span",{className:"ow-bootstrap-count",children:[c.sessions," session",c.sessions===
1?"":"s"]})]},c.name))}),g("div",{className:"ow-bootstrap-custom",children:[i(Bs,{value:s,placeholder:"Or name a goal yo\
urself\u2026","aria-label":"New goal name",onChange:c=>l(c.target.value),onKeyDown:c=>{c.key==="Enter"&&s.trim()&&(o(s),
l(""))}}),i(z,{disabled:n||!s.trim(),onClick:()=>{o(s),l("")},children:"Add goal"})]})]})}function so({members:e}){let t=e[0],
n=new Set(e.map(c=>c.sessionKey).filter(Boolean)).size,o=e.filter(c=>c.state==="needs-you").length,s=e.filter(c=>c.state===
"running").length,l=e.filter(c=>c.state==="done").length,d=[`${n} session${n===1?"":"s"}`];return o&&d.push(`${o} need${o===
1?"s":""} you`),s&&d.push(`${s} running`),l&&d.push(`${l} done`),g("div",{className:"ow-goal-digest",children:[t.summary&&
i("p",{className:"ow-digest-line",children:t.summary}),i("div",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}
function Tt({open:e,onToggle:t,label:n,flag:o,flagWarn:s,meta:l,why:d,header:c,action:p,children:m}){return g("div",{className:"\
ow-block ow-goalcard","data-grouped":"true","data-open":e?"true":void 0,children:[g("div",{className:"ow-goalcard-summar\
y",children:[t&&i("button",{type:"button",className:"ow-goalcard-chevron","aria-expanded":e,"aria-label":`${e?"Collapse":
"Expand"} ${n??"goal"}`,onClick:t,children:i(pe,{className:"ow-icon ow-init-chevron","data-open":e?"true":void 0,"aria-h\
idden":"true"})}),c,p,i("span",{className:`ow-goal-flag${s?" ow-goal-flag-warn":""}`,children:o})]}),i("div",{className:"\
ow-goal-meta",children:l}),d&&g("div",{className:"ow-goal-why",children:["Grouped because ",d,"."]}),m]})}function zs({block:e,
status:t,folded:n,onToggle:o,onSplit:s,selected:l,onSelect:d}){let c=e.items[0],p=new Set(e.items.map(a=>a.sessionKey).filter(
Boolean)).size,m=[];for(let a=0;a<e.items.length;a+=1)for(let f=a+1;f<e.items.length;f+=1)e.items[a].sessionKey!==e.items[f].
sessionKey&&m.push(ce(e.items[a],e.items[f]));let v=g(Ge,{children:[o&&i("button",{type:"button",className:"ow-goal-fold",
"aria-label":n?`Expand ${c.title}`:`Collapse ${c.title}`,"aria-expanded":!n,onClick:a=>{a.stopPropagation(),o()},children:i(
pe,{className:"ow-icon ow-init-chevron","data-open":n?void 0:"true","aria-hidden":"true"})}),i(ut,{className:"ow-icon","\
aria-hidden":"true"}),i("span",{className:"ow-truncate ow-block-name",children:c.title}),t&&i("span",{className:"ow-init\
-status","data-status":t,children:ge[t]}),g("span",{className:"ow-block-tab-meta",children:[i("span",{"aria-hidden":"tru\
e",children:"\xB7"}),g("span",{className:"ow-truncate",children:[p," sessions, one goal"]})]}),s&&i(z,{className:"ow-blo\
ck-open",title:"Not the same goal \u2014 split into separate cards","aria-label":`Split ${c.title}`,onClick:a=>{a.stopPropagation(),
s(m)},children:"Split"})]});return d?i(fe,{onActivate:d,className:"ow-block-tab ow-goal-tab","aria-pressed":l,"data-sele\
cted":l?"true":void 0,children:v}):i("div",{className:"ow-block-tab",children:v})}var Gs=.3;function ro({item:e,items:t,
onMerge:n}){let o=t.filter(s=>s.id!==e.id&&s.sessionKey&&e.sessionKey&&s.sessionKey!==e.sessionKey).map(s=>({other:s,score:Le(
e,s)?1:it(e.title,s.title)})).filter(s=>s.score>=Gs).sort((s,l)=>l.score-s.score).slice(0,2);return o.length===0?null:g(
"div",{className:"ow-merge-hint",children:[i("span",{className:"ow-merge-hint-label",children:"Same goal?"}),o.map(({other:s})=>g(
"button",{type:"button",className:"ow-merge-hint-btn ow-truncate",onClick:()=>n(ce(e,s)),children:["Merge with \u201C",s.
title,"\u201D"]},s.id))]})}function Ds({item:e,onOpen:t}){let n=e.references.find(s=>s.kind==="session"),o=e.references.
filter(s=>s.kind!=="session");return g("div",{className:"ow-block-tab",children:[i(Gt,{className:"ow-icon","aria-hidden":"\
true"}),i("span",{className:"ow-truncate ow-block-name",children:n?.label??e.provenance}),g("span",{className:"ow-block-\
tab-meta",children:[i("span",{"aria-hidden":"true",children:"\xB7"}),i("span",{className:"ow-truncate",children:e.provenance}),
o.slice(0,2).map(s=>i("span",{className:"ow-truncate",children:s.label},`${s.kind}:${s.id}`))]}),i(z,{className:"ow-bloc\
k-open",onClick:t,"aria-label":`Open ${n?.label??e.provenance}`,children:"Open"})]})}function qs({session:e,selected:t,onSelect:n,
onOpen:o}){return g(fe,{onActivate:n,className:"ow-srow","data-selected":t,children:[i(Gt,{className:"ow-icon","aria-hid\
den":"true"}),g("div",{className:"ow-srow-body",children:[i("div",{className:"ow-srow-name ow-truncate",children:e.label}),
i("div",{className:"ow-srow-state ow-truncate",children:e.leading.summary})]}),i("span",{className:"ow-srow-badge",children:go(
e.leading)}),i(z,{className:"ow-srow-open","aria-label":`Open ${e.label}`,onClick:s=>{s.stopPropagation(),o()},children:"\
Open"})]})}function Fs({reference:e,checks:t}){let n=e.status?/fail|conflict|closed/.test(e.status):!1;return g("div",{className:"\
ow-pr-head",children:[g("div",{className:"ow-pr-head-top",children:[i("span",{className:"ow-truncate ow-block-name",children:e.
label}),e.url&&i("a",{className:"ow-block-open ow-icon-link",href:e.url,target:"_blank",rel:"noopener noreferrer","aria-\
label":`Open ${e.label}`,children:i(zt,{className:"ow-icon","aria-hidden":"true"})})]}),i("div",{className:"ow-pr-status\
-line",children:t?.available&&(t.total??0)>0?g("span",{className:"ow-pr-dot","data-bad":(t.failing??0)>0?"true":void 0,children:[
t.passing??0,"/",t.total," checks passing",(t.failing??0)>0?` \xB7 ${t.failing} failing`:""]}):e.status&&i("span",{className:"\
ow-pr-dot","data-bad":n?"true":void 0,children:e.status})})]})}function js({reference:e,onOpenSession:t}){let n=Ts[e.kind],
o=g(Ge,{children:[i(n,{className:"ow-icon"}),i("span",{className:"ow-truncate",children:e.label})]});return e.url?i("a",
{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"noopener noreferrer",onClick:s=>s.stopPropagation(),
children:o}):e.sessionKey?i(fe,{className:"ow-reference ow-reference-link",onActivate:()=>t(e.sessionKey),children:o}):i(
"span",{className:"ow-reference",children:o})}function Ot({item:e,selected:t,continuation:n,whyRanked:o,onSelect:s,onOpenSession:l,
onAnswerPermission:d,permissionBusy:c,onRetry:p,retryBusy:m,onStop:v,stopBusy:a,onPickStep:f,onSnooze:b,onHandled:I,hideBadge:y,
compact:E,headless:B,dot:$,simple:R}){let[K,me]=N(!1);return g(fe,{onActivate:s,className:"ow-row","aria-pressed":t,"dat\
a-selected":t,"data-instructed":e.instructed?"true":void 0,"data-continuation":n?"true":void 0,"data-testid":`work-item-${e.
id}`,children:[g("div",{className:"ow-row-layout",children:[g("div",{className:"ow-row-content",children:[!B&&g("div",{className:"\
ow-row-heading",children:[$&&i("span",{className:`ow-dot ow-dot-${$}`,"aria-hidden":"true"}),!R&&(y?e.state==="done"&&i(
io,{className:"ow-icon ow-row-check","aria-hidden":"true"}):go(e)),i("span",{className:"ow-row-title",children:e.title})]}),
(!E&&!R||t)&&e.summary&&!(e.nextSteps??[]).some(C=>C.what?.trim()===e.summary)&&i("p",{className:"ow-row-summary",children:e.
summary}),e.duplicateOf&&(!R||t)&&g(fe,{className:"ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[
i(ut,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-truncate",children:Z(`duplicate_${e.duplicateOf.
because}`,{title:e.duplicateOf.title})})]}),t&&e.relatedSessions&&e.relatedSessions.length>0&&i(Qe,{children:g("div",{className:"\
ow-related",children:[i("span",{className:"ow-related-label",children:Z("related_sessions",{count:String(e.relatedSessions.
length)})}),e.relatedSessions.map(C=>g(fe,{className:"ow-related-row",onActivate:()=>l(C.sessionKey),children:[i(ut,{className:"\
ow-icon","aria-hidden":"true"}),i("span",{className:"ow-truncate",children:C.title}),i("span",{className:"ow-related-why",
children:Z(`related_${C.because}`)})]},C.sessionKey)),e.relatedMore?i("span",{className:"ow-related-more",children:Z("re\
lated_more",{count:String(e.relatedMore)})}):null]})}),o&&(!R||t)&&i("div",{className:"ow-row-why",children:o}),!n&&(!R||
t)&&g("div",{className:"ow-row-meta",children:[i("span",{className:"ow-truncate",children:e.provenance}),oo(e).length>0&&
i("span",{"aria-hidden":"true",children:"\xB7"}),i("span",{className:"ow-references",children:oo(e).slice(0,3).map(C=>i(
js,{reference:C,onOpenSession:l},`${C.kind}:${C.id}`))})]})]}),i("div",{className:"ow-row-actions",children:i(pe,{className:"\
ow-icon","aria-hidden":"true"})})]}),t&&f&&e.nextSteps&&e.nextSteps.length>0&&i(Qe,{children:g("div",{className:"ow-row-\
steps",children:[i("div",{className:"ow-steps-head",children:"Suggested next steps"}),e.nextSteps.slice(0,K?void 0:Pt).map(
(C,ee)=>i("button",{type:"button",className:"ow-quote-step",title:C.why??C.what,onClick:De=>{De.stopPropagation(),f(C.what)},
children:C.what},`${ee}:${C.what}`)),e.nextSteps.length>Pt&&i("button",{type:"button",className:"ow-steps-more",onClick:C=>{
C.stopPropagation(),me(ee=>!ee)},children:K?"Show fewer":`+${e.nextSteps.length-Pt} more`})]})}),t&&e.retryPath&&p&&i(Qe,
{children:i("div",{className:"ow-retry",children:i(z,{onClick:()=>p(e.retryPath),disabled:!!m,children:"Retry"})})}),t&&
e.stopPath&&v&&i(Qe,{children:i("div",{className:"ow-retry",children:i(z,{onClick:()=>v(e.stopPath),disabled:!!a,children:a?
"Stopping\u2026":"Stop this loop"})})}),t&&e.permissionId&&d&&i(Qe,{children:i(fo,{tool:e.permissionTool||"a tool",purpose:e.
permissionPurpose,busy:!!c,onAnswer:C=>d(e.permissionId,C)})}),e.state==="needs-you"&&b&&I&&g("div",{className:"ow-row-a\
side",children:[i("button",{type:"button",className:"ow-aside-btn",onClick:C=>{C.stopPropagation(),b(e.id)},children:"La\
ter"}),i("button",{type:"button",className:"ow-aside-btn",onClick:C=>{C.stopPropagation(),I(e.id,e.updatedAt)},children:"\
Handled"})]})]})}var Us=["unblock","followup","running","done"],Vs={unblock:{label:"UNBLOCK",cls:"ow-lane-unblock"},followup:{
label:"FOLLOW UP",cls:"ow-lane-followup"}};function Ys(e){return e.state==="done"?"done":e.state==="running"?"running":ct(
e)??"unblock"}function Hs({items:e,selectedId:t,onSelect:n,onOpenSession:o,onAnswerPermission:s,permissionBusy:l,onRetry:d,
retryBusy:c,onPickStep:p,onSnooze:m,onHandled:v,doneTitles:a}){let[f,b]=N(!1),I=new Map;for(let y of e){let E=Ys(y),B=I.
get(E);B?B.push(y):I.set(E,[y])}return g(Ge,{children:[Us.filter(y=>I.has(y)).map(y=>{let E=I.get(y),B=y==="unblock"||y===
"followup"?Vs[y]:null,$=B?E.map(K=>K.action!=="resume"?Pe(ue(K),Z):""):[],R=B&&$.length>0&&$.every(K=>K&&K===$[0])?$[0]:
void 0;return g("div",{className:"ow-lane",children:[B&&g("div",{className:"ow-lane-head",children:[i("span",{className:`\
ow-lane-badge ${B.cls}`,children:B.label}),R&&i("span",{className:"ow-lane-reason",children:R})]}),E.map(K=>i(Ot,{item:K,
hideBadge:!0,compact:!0,selected:t===K.id,continuation:!0,whyRanked:R?void 0:K.state==="needs-you"&&K.action!=="resume"?
Pe(ue(K),Z):void 0,onSelect:()=>n(K),onOpenSession:o,onAnswerPermission:s,permissionBusy:l,onRetry:d,retryBusy:c,onPickStep:p,
onSnooze:m,onHandled:v},K.id))]},y)}),!I.has("done")&&a&&a.length>0&&g("div",{className:"ow-lane ow-lane-done",children:[
g("button",{type:"button",className:"ow-goals-toggle","aria-expanded":f,onClick:()=>b(y=>!y),children:[i(pe,{className:"\
ow-icon","data-open":f?"true":void 0,"aria-hidden":"true"}),a.length," done"]}),f&&i("ul",{className:"ow-done-list",children:a.
map(y=>g("li",{className:"ow-row-goal-done",children:[i(io,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"\
ow-truncate",children:y})]},y))})]})]})}function ze({title:e,items:t,selectedId:n,onSelect:o,onOpenSession:s,onAnswerPermission:l,
permissionBusy:d,onRetry:c,retryBusy:p,onStop:m,stopBusy:v,onPickStep:a,onSnooze:f,onHandled:b,footer:I,collapsed:y,onToggleCollapsed:E,
groupBy:B,prChecks:$,prFilter:R,doneBySession:K,goalVerdicts:me,onSplitGoal:C,onMergeGoal:ee,initiativeBlocks:De,collapsedInitiatives:_e,
onToggleInitiative:qe,selectedGoalKey:Se,onSelectGoal:Ne,subtitle:Fe,hideHeader:Ze,emptyLabel:je}){let Ue=Bt(t,B,me),q=B===
"pr"&&R&&R!=="all"?Ue.filter(k=>k.changeRef&&It(k.changeRef,$?.[k.changeRef.url??""])===R):Ue,Re=De??[],H=B==="goal"?Re.
length:B==="pr"?q.length:t.length,et=k=>g("div",{className:"ow-block","data-grouped":k.header?"true":void 0,children:[k.
header==="session"&&k.sessionKey&&i(Ds,{item:k.items[0],onOpen:()=>s(k.sessionKey)}),k.header==="pr"&&k.changeRef&&i(Fs,
{reference:k.changeRef,checks:$?.[k.changeRef.url??""]}),k.header==="goal"&&i(zs,{block:k,onSplit:C,selected:Se===k.key,
onSelect:Ne?()=>Ne(k.key):void 0}),k.header==="pr"?g(Ge,{children:[i("div",{className:"ow-pr-sublabel",children:"Session\
s on this PR"}),Wn(k.items).map(_=>i(qs,{session:_,selected:n===_.leading.id,onSelect:()=>o(_.leading),onOpen:()=>s(_.sessionKey)},
_.sessionKey))]}):k.header==="session"?i(Hs,{items:k.items,doneTitles:k.sessionKey?K?.[k.sessionKey]:void 0,selectedId:n,
onSelect:o,onOpenSession:s,onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:p,onPickStep:a,onSnooze:f,onHandled:b}):
k.items.map(_=>g(qn,{children:[i(Ot,{item:_,selected:n===_.id,continuation:k.header==="session",whyRanked:_.state==="nee\
ds-you"&&_.action!=="resume"?Pe(ue(_),Z):void 0,onSelect:()=>o(_),onOpenSession:s,onAnswerPermission:l,permissionBusy:d,
onRetry:c,retryBusy:p,onStop:m,stopBusy:v,onPickStep:a,onSnooze:f,onHandled:b}),B==="goal"&&ee&&n===_.id&&i(ro,{item:_,items:t,
onMerge:ee})]},_.id))]},k.key),V=k=>g(qn,{children:[i(Ot,{item:k,selected:n===k.id,dot:Ln(k),simple:!0,whyRanked:k.state===
"needs-you"&&k.action!=="resume"?Pe(ue(k),Z):void 0,onSelect:()=>o(k),onOpenSession:s,onAnswerPermission:l,permissionBusy:d,
onRetry:c,retryBusy:p,onPickStep:a,onSnooze:f,onHandled:b}),ee&&n===k.id&&i(ro,{item:k,items:t,onMerge:ee})]},k.id),tt=k=>{
if(k.name){let Y=_e?.[k.key]??k.status!=="needs-you",J=k.blocks.flatMap(ne=>ne.items),G=Xe(J);return i(Tt,{open:!Y,onToggle:()=>qe?.(
k.key,!Y),label:k.name,flag:G.needsYou>0?`${G.needsYou} need you`:ge[k.status],flagWarn:G.needsYou>0,meta:Et(J),header:i(
"span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:k.name}),children:Y?i(so,{members:J}):J.map(ne=>V(
ne))},k.key)}let _=k.blocks[0];if(_.header==="goal"){let Y=_e?.[k.key]??k.status!=="needs-you",J=_.items[0],G=Xe(_.items),
ne=[];for(let P=0;P<_.items.length;P+=1)for(let ie=P+1;ie<_.items.length;ie+=1)ne.push(ce(_.items[P],_.items[ie]));let nt=new Set(
_.items.map(P=>P.sessionKey).filter(Boolean)).size,ot=Kn(_.items)??(nt>1?`${nt} sessions, one goal`:J.references.find(P=>P.
kind==="session")?.label??J.title);return i(Tt,{open:!Y,onToggle:()=>qe?.(k.key,!Y),label:ot,flag:G.needsYou>0?`${G.needsYou}\
 need you`:ge[k.status],flagWarn:G.needsYou>0,meta:Et(_.items),why:Bn(_.items,me),header:g(fe,{onActivate:()=>Ne?.(_.key),
className:"ow-goalcard-header ow-goal-tab","aria-pressed":Se===_.key,"data-selected":Se===_.key?"true":void 0,children:[
i(ut,{className:"ow-icon","aria-hidden":"true"}),i("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:ot})]}),
action:C&&i(z,{className:"ow-block-open",title:"Not the same goal \u2014 split into separate cards","aria-label":`Split ${J.
title}`,onClick:P=>{P.stopPropagation(),C(ne)},children:"Split"}),children:Y?i(so,{members:_.items}):_.items.map(P=>V(P))},
k.key)}let ae=_.items[0],Ie=ae.references.find(Y=>Y.kind==="session")?.label;if(!Ie||Ie===ae.title)return V(ae);let te=Xe(
_.items);return i(Tt,{open:!0,label:Ie,flag:te.needsYou>0?`${te.needsYou} need you`:ge[ae.state],flagWarn:te.needsYou>0,
meta:Et(_.items),header:i("span",{className:"ow-truncate ow-block-name ow-goalcard-title",children:Ie}),children:V(ae)},
k.key)};return g("section",{className:"ow-section","aria-label":e,children:[Ze?null:E?g(fe,{onActivate:E,className:"ow-s\
ection-toggle",children:[i(no,{label:e,count:H,subtitle:Fe}),i(pe,{className:"ow-icon ow-section-chevron","data-open":y?
void 0:"true","aria-hidden":"true"})]}):i(no,{label:e,count:H,subtitle:Fe}),y?null:i("div",{className:"ow-section-list",
children:B==="goal"?Re.length===0?i("p",{className:"ow-section-empty",children:je}):Re.map(tt):q.length===0?i("p",{className:"\
ow-section-empty",children:je}):q.map(et)}),I]})}function Js(e,t){let n=kn(t,Z);if(!e)return["Crew Manager context: work\
space overview.",...n,"Answer the user about the state of their work. This is a conversation, not an action channel."].join(
`
`);let o=e.references.map(l=>`${l.kind}: ${l.label} (${l.id})`).join(`
`),s=[e.stalledFor?`Silent for ${Me(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(l=>!!l);return[`Crew Manager context: ${e.title}`,...n,`Selected item: ${e.title}`,
`State: ${ge[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...s.length>0?[`Why it is on the board:
${s.join(`
`)}`]:[],`References:
${o}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(l=>!!l).join(`
`)}function Xs(){let e=Is(),t=se(e);t.current=e;let n=Cs(),o=Ws(),[s,l]=N("all"),[d,c]=N(()=>re(Jn,null)??"prs"),p=O(r=>{
c(u=>{let w=u===r?null:r;return X(Jn,w),w})},[]),[m,v]=N(()=>re(Qn,null)==="session"?"session":"goal"),[a,f]=N("all"),[b,
I]=N({}),[y,E]=N(null),[B,$]=N(null),[R,K]=N(null),[me,C]=N({}),[ee,De]=N("unknown"),_e=se("unknown"),qe=se(new Map),[Se,
Ne]=N({}),[Fe,Ze]=N({}),[je,Ue]=N([]),[q,Re]=N(null),[H,et]=N(null),[V,tt]=N(null),[k,_]=N(()=>re($t)),[ae,Ie]=N(()=>re(
Un)),[te,Y]=N(()=>re(Mt,{merged:[],split:[]})),J=se(re(Yn,[])),[G,ne]=N([]),[nt,ot]=N(()=>re(Hn)),[P,ie]=N(null),[mo,wo]=N(
()=>re(Vn,null)??!0),[Dt,qt]=N({}),[pt,ho]=N([]),[gt,Ft]=N(()=>re(Xn,null)??Zn),[ft,jt]=N(!1),Ut=se(!0),[bo,Vt]=N(!0),[Yt,
mt]=N(null),[ko,yo]=N(!1),[Ht,we]=N(null),M=se(!0),Ve=se(0),wt=se(!1);j(()=>(M.current=!0,()=>{M.current=!1,Ve.current+=
1}),[]);let L=O(async()=>{let r=++Ve.current,u=t.current;try{let[w,h,x,S,$e,rt,A,de]=await Promise.all([u.get("/api/chat\
/slots"),u.get("/api/approvals"),u.get("/api/spawn"),u.get("/api/workflows/runs"),u.get("/api/crons"),u.get("/api/artifa\
cts"),u.get("/api/autonudge").catch(()=>({loops:[]})),u.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!M.
current||r!==Ve.current)return;K({slots:Array.isArray(w)?w:[],approvals:Array.isArray(h)?h:[],agents:Array.isArray(x.agents)?
x.agents:[],workflows:Array.isArray(S.runs)?S.runs:[],crons:Array.isArray($e.jobs)?$e.jobs:[],artifacts:Array.isArray(rt.
artifacts)?rt.artifacts:[],loops:Array.isArray(A?.loops)?A.loops:[]}),ho(Array.isArray(de?.runs)?de.runs:[]),mt(null)}catch(w){
M.current&&r===Ve.current&&mt(w instanceof Error?w:new Error("Unable to load Crew Manager sources"))}finally{M.current&&
r===Ve.current&&Vt(!1)}},[]);j(()=>{L();let r=window.setInterval(()=>{L()},Es);return()=>window.clearInterval(r)},[L]);let vo=()=>{
Vt(!0),mt(null),L()};j(()=>{if(!R||_e.current==="unsupported"||_e.current==="disabled")return;let r=zn(R.slots,Oe).filter(
w=>qe.current.get(w.key)!==Kt(w));if(r.length===0)return;let u=!1;return(async()=>{let{summaries:w,support:h}=await Gn(r,
x=>t.current.get(x));if(!(u||!M.current)&&(_e.current=h,De(h),h==="available")){for(let x of r)w[x.key]&&qe.current.set(
x.key,Kt(x));C(x=>({...x,...w}))}})(),()=>{u=!0}},[R]),j(()=>{if(!R||!Ut.current)return;let r=!1;return(async()=>{try{let u=await t.
current.get("/api/apps/crew-manager/stalls");if(r||!M.current)return;let w={};for(let x of u?.stalls??[])x?.key&&(w[x.key]=
x);Ne(w);let h={};for(let x of u?.error_loops??[])x?.key&&(h[x.key]=x);qt(h)}catch{Ut.current=!1,M.current&&(Ne({}),qt({}))}})(),
()=>{r=!0}},[R]),j(()=>{let r=!1;return(async()=>{try{let u=await t.current.get("/api/apps/crew-manager/initiatives");if(r||
!M.current)return;ne((u?.initiatives??[]).filter(w=>w?.name))}catch{}})(),()=>{r=!0}},[]);let Jt=D(()=>_n(Cn(R??{slots:[],
approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},Z,me,Se,Dt,te),Fe),[R,me,Se,Dt,Fe,te]),st=D(()=>Nn(Jt,
k,ae),[Jt,k,ae]),W=D(()=>st.items.filter(r=>Rn(r)),[st]),ht=D(()=>At(W),[W]),Xt=D(()=>{let r={};for(let u of W){if(u.state!==
"done"||!u.sessionKey)continue;let w=r[u.sessionKey];w?w.push(u.title):r[u.sessionKey]=[u.title]}return r},[W]),le=D(()=>W.
find(r=>r.id===y)??null,[W,y]),Ye=D(()=>s==="all"?W:W.filter(r=>r.state===s),[s,W]),bt=D(()=>{let r={all:0,failing:0,running:0,
merged:0};for(let u of Bt(W,"pr")){if(!u.changeRef)continue;r.all++;let w=It(u.changeRef,b[u.changeRef.url??""]);w!=="ot\
her"&&r[w]++}return r},[W,b]);j(()=>{let r=new Set;for(let w of W)for(let h of w.references)h.kind==="change"&&h.url&&/github\.com\/.+\/pull\//.
test(h.url)&&r.add(h.url);let u=!1;for(let w of r)b[w]||t.current.get(`/pr-checks?url=${encodeURIComponent(w)}`).then(h=>{
!u&&M.current&&I(x=>({...x,[w]:h}))}).catch(()=>{});return()=>{u=!0}},[W,b]),j(()=>o(ht["needs-you"]),[ht,o]),j(()=>{y&&
!W.some(r=>r.id===y)&&E(null)},[W,y]),j(()=>{X(Qn,m)},[m]),j(()=>{X(Xn,gt)},[gt]);let Qt=se(null);j(()=>{if(!ft)return;let r=w=>{
let h=Qt.current?.getBoundingClientRect();if(!h||h.width===0)return;let x=(w.clientX-h.left)/h.width*100;Ft(Math.max($s,
Math.min(Ms,x)))},u=()=>jt(!1);return window.addEventListener("mousemove",r),window.addEventListener("mouseup",u),()=>{window.
removeEventListener("mousemove",r),window.removeEventListener("mouseup",u)}},[ft]);let kt=R?.slots.find(r=>r.key===Oe),xo=!!(kt||
ko);j(()=>{!R||kt||wt.current||(wt.current=!0,e.post("/api/chat/slots",{name:Oe,title:"Conductor"}).then(()=>{M.current&&
(yo(!0),L())}).catch(r=>{M.current&&(wt.current=!1,we(r instanceof Error?`Conductor session could not be created: ${r.message}`:
"Conductor session could not be created"))}))},[e,kt,L,R]);let Zt=D(()=>mn(R?.approvals??[],je,r=>W.find(u=>u.sessionKey===
r)?.title??R?.slots?.find(u=>u.key===r)?.title??r),[W,R,je]),Ce=le&&!le.permissionId?le:null,he=D(()=>Tn(W,G,te,J.current),
[W,G,te]);j(()=>{let r=An(he.filter(u=>u.name===null).flatMap(u=>u.blocks));J.current=r,X(Yn,r)},[he]);let Q=D(()=>{if(!P)
return null;for(let r of he){let u=r.blocks.find(w=>w.key===P);if(u&&u.items.length>0)return u}return null},[P,he]),F=Q?
Pn(Q.items):null,yt=D(()=>{let r=(R?.loops??[]).filter(h=>h&&h.active!==!1&&h.slot_key);if(r.length===0)return[];let u=new Map,
w=new Map;for(let h of W)for(let x of h.references)x.kind!=="session"||!x.id||x.label&&!u.has(x.id)&&u.set(x.id,x.label);
for(let h of he)if(h.name)for(let x of h.blocks)for(let S of x.items)S.sessionKey&&!w.has(S.sessionKey)&&w.set(S.sessionKey,
h.name);return r.map(h=>{let x=Number(h.cycle_count)||0,S=Number(h.max_cycles)||0;return{key:h.slot_key,title:u.get(h.slot_key)??
h.slot_key,goalName:w.get(h.slot_key)??null,progress:S>0?`${x}/${S}`:`${x} ${x===1?"cycle":"cycles"}`,remaining:S>0?Math.
max(0,S-x):null,instruction:(h.message??"").replace(/\s+/g," ").trim(),lastFire:T(h.last_fire_ts)}})},[R,W,he]),We=D(()=>{
let r=new Date;r.setHours(0,0,0,0);let u=r.getTime(),w=u+864e5,h=R?.crons??[],x=new Map;for(let A of pt){let de=T(A.started_at);
if(!A.job_id||de<u||de>=w)continue;let oe=x.get(A.job_id)??{count:0,failed:0,last:0};oe.count+=1,A.status&&A.status!=="s\
uccess"&&(oe.failed+=1),oe.last=Math.max(oe.last,de),x.set(A.job_id,oe)}let S=h.map(A=>{let de=x.get(A.id),oe=T(A.next_run_ts),
Mo=oe>=u&&oe<w;return{job:A,ran:de,next:oe,dueToday:Mo}}).filter(A=>A.ran||A.dueToday||A.job.is_running),$e=S.filter(A=>A.
ran&&A.ran.failed===0).length,rt=S.filter(A=>A.ran&&A.ran.failed>0).length;return{rows:S,done:$e,failed:rt,total:S.length,
historyKnown:pt.length>0}},[R,pt]),[_o,en]=N(!1),So=D(()=>{if(m!=="goal")return[];let r=Mn(R?.slots??[],G),u=En(W,G),w=new Set,
h=[];for(let x of[...u,...r])w.has(x.name.toLowerCase())||(w.add(x.name.toLowerCase()),h.push(x));return h.sort((x,S)=>S.
sessions-x.sessions)},[m,R,W,G]),No=O(async(r,u=[])=>{if(r.trim()){en(!0);try{let w=await t.current.post("/api/apps/crew\
-manager/initiatives",{name:r.trim(),aliases:u});M.current&&w?.initiatives&&ne(w.initiatives.filter(h=>h?.name))}catch{}finally{
M.current&&en(!1)}}},[]),be=O(async(r,u)=>{if(!q){Re(r),we(null);try{await t.current.post(`/api/approvals/${encodeURIComponent(
r)}/${u?"approve":"reject"}`,{}),L()}catch(w){we(w instanceof Error?`Could not answer that request: ${w.message}`:"Could\
 not answer that request"),L()}finally{M.current&&Re(null)}}},[L,q]),Ro=O(r=>{_(u=>{let w=Object.fromEntries(Object.entries(
u).filter(([,h])=>h>Date.now()));return w[r]=Date.now()+Sn,X($t,w),w}),E(null)},[]),Io=O((r,u)=>{Ie(w=>{let h={...w,[r]:u};
return X(Un,h),h}),E(null)},[]),Co=O(()=>{_({}),X($t,{})},[]),Wo=O(r=>{Y(u=>{let w={merged:u.merged.filter(h=>!r.includes(
h)),split:[...new Set([...u.split,...r])]};return X(Mt,w),w})},[]),Ao=O(r=>{Y(u=>{let w={merged:[...new Set([...u.merged,
r])],split:u.split.filter(h=>h!==r)};return X(Mt,w),w})},[]),Bo=O(()=>{wo(r=>(X(Vn,!r),!r))},[]),Ae=O(async r=>{if(!H){et(
r),we(null);try{await t.current.post(r,{}),L()}catch(u){we(u instanceof Error?`Could not re-run it: ${u.message}`:"Could\
 not re-run it"),L()}finally{M.current&&et(null)}}},[L,H]),He=O(async r=>{if(!V){tt(r),we(null);try{await t.current.del(
r),$("Stopped the monitor loop. Re-arming it is done from the session itself."),L()}catch(u){let w=u instanceof Error?u.
message:"";/404|not found/i.test(w)?$("That loop had already stopped."):we(w?`Could not stop it: ${w}`:"Could not stop i\
t"),L()}finally{M.current&&tt(null)}}},[L,V]),ke=O(async r=>{if(Q&&F?.sessionKey){let w=F.sessionKey,h=Q.items.map(S=>`-\
 ${S.references.find($e=>$e.kind==="session")?.label??S.sessionKey}: ${ge[S.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(w)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${Q.items[0].title}", which spans sessions:`,h,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:w}).catch(S=>{if(!(S instanceof
SyntaxError))throw S}),!M.current)return;Ze(S=>({...S,[F.id]:Date.now()})),Ue(S=>S.includes(w)?S:[...S,w]);let x=F.references.
find(S=>S.kind==="session")?.label??F.title;$(F.moving||F.state==="running"?`Sent to ${x} \u2014 the active session on this g\
oal`:`Sent to ${x} \u2014 resuming the last session on this goal`),ie(null),L();return}let u=le&&!le.permissionId?le:null;
if(u?.sessionKey){let w=u.sessionKey;if(await t.current.post("/api/chat",{message:r,slot:w}).catch(h=>{if(!(h instanceof
SyntaxError))throw h}),!M.current)return;Ze(h=>({...h,[u.id]:Date.now()})),Ue(h=>h.includes(w)?h:[...h,w]),$(`Sent new i\
nstructions to ${u.title}`),E(null),L();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(Oe)}/context`,
{content:Js(le,W),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:r,slot:Oe}).
catch(w=>{if(!(w instanceof SyntaxError))throw w})},[le,Q,F,W,L]),vt={"needs-you":Ye.filter(r=>r.state==="needs-you"),running:Ye.
filter(r=>r.state==="running"),done:Ye.filter(r=>r.state==="done")},Ko=O((r,u)=>{ot(w=>{let h={...w,[r]:u};return X(Hn,h),
h})},[]),$o=O(r=>{ie(u=>u===r?null:r),E(null),$(null)},[]),Be=r=>n(`/chat?sid=${encodeURIComponent(r)}`),Ke=r=>{E(u=>u===
r.id?null:r.id),ie(null),$(null)};return g("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[
i("style",{children:Dn}),i(Ks,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what\
 finished recently."}),i("div",{className:"ow-body",children:g("div",{className:"ow-layout",ref:Qt,children:[g("div",{className:"\
ow-main",style:{flexBasis:`${gt}%`},children:[g("section",{className:"ow-card ow-listcard","aria-label":"Work",children:[
g("div",{className:"ow-listcard-head",children:[i("div",{className:"ow-tabs",role:"tablist","aria-label":"View",children:[
"goal","session"].map(r=>i(z,{role:"tab","aria-selected":m===r,"data-selected":m===r,className:"ow-tab",onClick:()=>v(r),
children:r==="goal"?"Goals":"Sessions"},r))}),g("div",{className:"ow-listcard-tools",children:[i("p",{className:"ow-list\
card-sub",children:m==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each session need\
s from you"}),m==="session"&&i("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.
keys(Lt).map(r=>g(z,{onClick:()=>l(r),"aria-pressed":s===r,"data-selected":s===r,className:"ow-filter",children:[Lt[r],i(
"span",{className:"ow-count",children:ht[r]})]},r))})]})]}),i("main",{className:"ow-work",children:i("div",{className:"o\
w-work-inner",children:bo?i(Fn,{rows:7}):Yt&&!R?i(jn,{icon:i(ao,{className:"ow-icon"}),title:"Crew Manager could not loa\
d the work view",subtitle:Yt.message,action:i(z,{onClick:vo,children:"Try again"})}):(m==="goal"?W.length===0:Ye.length===
0)?i(jn,{icon:i(Ss,{className:"ow-icon"}),title:"No matching work",subtitle:m==="goal"?"No sessions are running yet.":"C\
hange the filter to see sessions in another state."}):m==="goal"?i(ze,{title:"Work by goal",hideHeader:!0,items:W,selectedId:y,
onSelect:Ke,onOpenSession:Be,onAnswerPermission:(r,u)=>{be(r,u)},permissionBusy:q!==null,onRetry:r=>{Ae(r)},retryBusy:H!==
null,onPickStep:r=>{ke(r)},groupBy:m,goalVerdicts:te,onSplitGoal:Wo,onMergeGoal:Ao,initiativeBlocks:he,collapsedInitiatives:nt,
onToggleInitiative:Ko,selectedGoalKey:P,onSelectGoal:$o,footer:i(Os,{candidates:So,prominent:G.length===0,busy:_o,onAdd:(r,u)=>{
No(r,u)}}),emptyLabel:"No matching work"}):s==="all"?g(Ge,{children:[i(ze,{title:"Needs you",subtitle:"Waiting on a deci\
sion or reply from you",items:vt["needs-you"],doneBySession:Xt,selectedId:y,onSelect:Ke,onSnooze:Ro,onHandled:Io,footer:st.
snoozedCount>0?g("button",{type:"button",className:"ow-aside-note",onClick:Co,children:[st.snoozedCount," set aside for \
later \u2014 bring back"]}):void 0,onOpenSession:Be,onAnswerPermission:(r,u)=>{be(r,u)},permissionBusy:q!==null,onRetry:r=>{
Ae(r)},retryBusy:H!==null,onStop:r=>{He(r)},stopBusy:V!==null,onPickStep:r=>{ke(r)},groupBy:m,emptyLabel:"Nothing needs \
your input right now."}),i(ze,{title:"In progress",subtitle:"Being worked on right now",items:vt.running,doneBySession:Xt,
selectedId:y,onSelect:Ke,onOpenSession:Be,onAnswerPermission:(r,u)=>{be(r,u)},permissionBusy:q!==null,onRetry:r=>{Ae(r)},
retryBusy:H!==null,onStop:r=>{He(r)},stopBusy:V!==null,onPickStep:r=>{ke(r)},groupBy:m,emptyLabel:"Nothing is in progres\
s right now."}),i(ze,{title:"Done recently",subtitle:"Finished in the last few days",items:vt.done,selectedId:y,onSelect:Ke,
collapsed:mo,onToggleCollapsed:Bo,onOpenSession:Be,onAnswerPermission:(r,u)=>{be(r,u)},permissionBusy:q!==null,onRetry:r=>{
Ae(r)},retryBusy:H!==null,onStop:r=>{He(r)},stopBusy:V!==null,onPickStep:r=>{ke(r)},groupBy:m,emptyLabel:"No recent comp\
leted work."})]}):i(ze,{title:Lt[s],items:Ye,selectedId:y,onSelect:Ke,onOpenSession:Be,onAnswerPermission:(r,u)=>{be(r,u)},
permissionBusy:q!==null,onRetry:r=>{Ae(r)},retryBusy:H!==null,onStop:r=>{He(r)},stopBusy:V!==null,onPickStep:r=>{ke(r)},
groupBy:m,emptyLabel:"No matching work"})})})]}),g("div",{className:"ow-stack",children:[g("details",{className:"ow-card\
 ow-stack-card",open:d==="prs",children:[g("summary",{onClick:r=>{r.preventDefault(),p("prs")},children:[g("span",{className:"\
ow-stack-title",children:[i(pe,{className:"ow-icon ow-stack-chevron"}),i(zt,{className:"ow-icon"}),"PRs"]}),g(U,{variant:"\
muted",children:[bt.all," open"]})]}),i("p",{className:"ow-stack-sub",children:"Open pull requests your work touches"}),
i("div",{className:"ow-stack-body",children:bt.all===0?i("p",{className:"ow-stack-empty",children:"No work is linked to \
a PR right now. Work links to one when a session mentions its URL."}):g(Ge,{children:[i("div",{className:"ow-filters",role:"\
group","aria-label":"Filter by PR status",children:Object.keys(to).map(r=>g(z,{onClick:()=>f(r),"aria-pressed":a===r,"da\
ta-selected":a===r,className:"ow-filter",children:[to[r],i("span",{className:"ow-count",children:bt[r]})]},r))}),i(ze,{title:"\
Work by PR",items:W,prChecks:b,prFilter:a,selectedId:y,onSelect:Ke,onOpenSession:Be,onAnswerPermission:(r,u)=>{be(r,u)},
permissionBusy:q!==null,onRetry:r=>{Ae(r)},retryBusy:H!==null,onStop:r=>{He(r)},stopBusy:V!==null,onPickStep:r=>{ke(r)},
groupBy:"pr",emptyLabel:"No PR matches that status."})]})})]}),g("details",{className:"ow-card ow-stack-card",open:d==="\
loops",children:[g("summary",{onClick:r=>{r.preventDefault(),p("loops")},children:[g("span",{className:"ow-stack-title",
children:[i(pe,{className:"ow-icon ow-stack-chevron"}),i(uo,{className:"ow-icon"}),"Loops"]}),i(U,{variant:"muted",children:yt.
length})]}),i("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),i("div",{className:"\
ow-stack-body",children:yt.length===0?i("p",{className:"ow-stack-empty",children:"No loop is running right now."}):yt.map(
r=>{let u=po(r.lastFire),w=[u&&`last tick ${u}`,r.remaining!==null&&`${r.remaining} remaining`].filter(Boolean).join(" \xB7\
 ");return g("div",{className:"ow-mini",children:[i("span",{className:"ow-mini-rail",style:{background:"var(--warn)"}}),
g("div",{children:[g("div",{className:"ow-mini-title",children:[r.goalName??r.title,i("span",{className:"ow-mini-chip",children:r.
progress})]}),r.instruction&&i("div",{className:"ow-mini-desc",title:r.instruction,children:r.instruction}),w&&i("div",{
className:"ow-mini-when",children:w})]}),i(U,{variant:"ok",children:"Active"})]},r.key)})})]}),g("details",{className:"o\
w-card ow-stack-card",open:d==="schedule",children:[g("summary",{onClick:r=>{r.preventDefault(),p("schedule")},children:[
g("span",{className:"ow-stack-title",children:[i(pe,{className:"ow-icon ow-stack-chevron"}),i(co,{className:"ow-icon"}),
"Scheduled tasks"]}),g(U,{variant:We.failed>0?"err":"muted",children:[We.done,"/",We.total," today"]})]}),i("p",{className:"\
ow-stack-sub",children:We.historyKnown?"Today's runs only \u2014 jobs with nothing scheduled today are hidden":"Run hist\
ory is unavailable, so completed counts may be low"}),i("div",{className:"ow-stack-body",children:We.rows.length===0?i("\
p",{className:"ow-stack-empty",children:"Nothing is scheduled for today."}):We.rows.map(({job:r,ran:u,next:w,dueToday:h})=>{
let x=!!(u&&u.failed>0),S=[u&&`ran today ${eo(u.last)}${u.count>1?` (${u.count}x)`:""}`,h&&w?`next ${eo(w)}`:null].filter(
Boolean).join(" \xB7 ");return g("div",{className:"ow-mini",children:[i("span",{className:"ow-mini-rail",style:{background:x?
"var(--danger)":r.enabled===!1?"var(--muted)":"var(--warn)"}}),g("div",{children:[i("div",{className:"ow-mini-title",children:r.
name}),r.schedule&&g("div",{className:"ow-mini-desc",children:[r.schedule,r.cron_expr&&i("span",{className:"ow-mini-chip",
children:r.cron_expr})]}),S&&i("div",{className:"ow-mini-when",children:S})]}),r.is_running?i(U,{variant:"aim",children:"\
Running"}):x?i(U,{variant:"err",children:"Failed"}):r.enabled===!1?i(U,{variant:"muted",children:"Paused"}):u?i(U,{variant:"\
ok",children:"Success"}):i(U,{variant:"warn",children:"Pending"})]},r.id)})})]})]})]}),i("button",{type:"button",className:"\
ow-resizer","aria-label":"Resize columns","data-dragging":ft?"true":void 0,onMouseDown:r=>{r.preventDefault(),jt(!0)},onDoubleClick:()=>Ft(
Zn)}),g("aside",{className:"ow-conductor","aria-label":"Conductor",children:[i("div",{className:"ow-conductor-header",children:g(
"div",{className:"ow-conductor-title",children:[i("h2",{children:"Conductor"}),!Ce&&i("span",{className:"ow-conductor-su\
b",children:"select work, or ask across all"})]})}),i("div",{className:"ow-chat",children:xo?g("div",{className:"ow-chat\
-panel",children:[Zt.length>0&&i("div",{className:"ow-permissions",role:"alert",children:Zt.map(r=>i(fo,{tool:r.tool,purpose:r.
purpose,where:r.sessionLabel,busy:q!==null,onAnswer:u=>{be(r.id,u)}},r.id))}),B&&g("div",{className:"ow-conductor-receip\
t",role:"status",children:[i(lo,{className:"ow-icon"}),B]}),Ht&&i("div",{className:"ow-chat-error",role:"alert",children:Ht}),
i("div",{className:"ow-embed",children:i(As,{slotKey:Oe,frameless:!0,startAtBottom:!0,placeholder:Q?"Instruction for thi\
s goal\u2026":Ce?.sessionKey?"New instructions for this session\u2026":"Ask across your work\u2026",onSend:ke})}),Q&&F?g(
"div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-body ow-quote-goal",children:[g("div",
{className:"ow-quote-line",children:[i("span",{className:"ow-eyebrow",children:"Instructing goal"}),i("span",{className:"\
ow-quote-title",title:Q.items[0].title,children:Q.items[0].title})]}),g("span",{className:"ow-quote-route ow-truncate",children:[
"\u2192 ",F.references.find(r=>r.kind==="session")?.label??F.title,F.moving||F.state==="running"?" (active)":" (will res\
ume)"]})]}),i(z,{className:"ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{ie(null),$(null)},children:"\
Clear"})]}):Ce&&g("div",{className:"ow-quote ow-quote-docked",children:[g("div",{className:"ow-quote-body",children:[i("\
span",{className:"ow-eyebrow",children:Ce.sessionKey?"Instructing":"Quoted"}),i("span",{className:"ow-quote-title",title:Ce.
title,children:Ce.title})]}),i(z,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{E(null),
$(null)},children:"Clear"})]})]}):i("div",{className:"ow-chat-loading",children:i(Fn,{rows:4})})})]})]})})]})}export{Xs as default};
