import{Fragment as xn,useCallback as E,useEffect as G,useMemo as P,useRef as se,useState as N}from"react";import{AlertTriangle as Tn,
Bot as Go,Check as On,ChevronRight as re,Check as zn,Clock as Dn,Package as Uo,ExternalLink as Rt,MessageSquare as It,Shield as jo,
Waves as qn,Search as Vo,Tag as Ho,Users as St,Zap as Yo}from"lucide-react";import{useAppApi as Jo,useNavigate as Xo,useNavBadge as Qo,
ChatEmbed as Zo}from"@kirocrew/app-sdk";import{Badge as D,Btn as M,ContentSkeleton as _n,EmptyState as Sn,Input as es,PageHeader as ts}from"@kirocrew/app-sdk/ui";function Ne(e){let t=Math.max(1,Math.floor(e/60));if(t<60)return`${t} minute${t===1?"":"s"}`;let s=Math.floor(t/60),n=t%
60;return n===0?`${s} hour${s===1?"":"s"}`:`${s}h ${n}m`}function Zt(e){if(e.state==="merged")return"merged";if(e.state===
"closed")return"closed";if(e.mergeable==="conflicting")return"conflict";if(e.ci==="failed")return"checks failing";if(e.ci===
"pending")return"checks running"}function gt(e,t){return e.status==="merged"?"merged":e.status==="conflict"?"failing":t?.
available&&(t.total??0)>0?(t.failing??0)>0?"failing":(t.pending??0)>0?"running":"other":e.status==="checks failing"?"fai\
ling":e.status==="checks running"?"running":"other"}function en(e,t,s){let n=new Set(t.filter(Boolean));if(n.size===0)return[];
let i=new Set,l=[];for(let d of e){let c=d.slot;!c||!n.has(c)||!d.id||i.has(d.id)||(i.add(d.id),l.push({id:d.id,sessionKey:c,
sessionLabel:s(c),tool:d.tool||"a tool",purpose:d.tool_purpose}))}return l}var qt={"needs-you":0,running:1,done:2};function $(e){
if(typeof e=="number")return e>1e10?e:e*1e3;if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}function go(e,t){
if(e.paused)return"";let s=$(e.next_run_ts);if(!s)return"";let n=Math.round((s-t)/1e3);return n<=0?"":Ne(n)}var Ft=72;function pe(e,t){
let s=e?.replace(/\s+/g," ").trim();if(!s)return t;let i=(s.split(/(?<=[.!?])\s+|;\s+|\s+[–—-]\s+/)[0]?.trim()||s).replace(
/[.;,]$/,"");if(i.length<=Ft)return i;let l=i.slice(0,Ft),d=l.lastIndexOf(" ");return`${(d>24?l.slice(0,d):l).trim()}\u2026`}
function ge(e){return!!e.source_links?.some(t=>t.kind!=="issue"&&(t.ci==="failed"||t.mergeable==="conflicting"))}var fo=/<\/?(?:invoke|parameter|function_calls|antml)|<[a-z_-]+\s+name="/i,
mo=/^\((?:code|diff|widget|image)\)$/,wo=/(?:^|\s)(?:🎉|✅|✔|🚀)|^(?:goal completed|done\b|completed\b|finished\b|success\b|merged\b)|完成|已合并|已完成|完了/i,
ho=/\bwhat next\??$|\bwould you like\b|\blet me know if\b|\bfeel free to\b|\banything else\b/i,bo=/\b(?:please|need your|need you to|needs? your|requires? your|waiting for you|waiting on you|blocked until|before i can|to proceed|to continue)\b/i,
yo=/[?？]["'”’)\]]*$/;function tn(e){let t=e.last_message?.replace(/\s+/g," ").trim();return!t||mo.test(t)||fo.test(
t)?null:t}function ft(e){if(!e.waiting_for_input)return null;let t=tn(e);return!t||wo.test(t)||ho.test(t)?null:bo.test(t)||
yo.test(t)?t:null}function Gt(e){return e.pending_approval||ft(e)?"needs-you":e.running||e.subagents_running||e.orchestrating?
"running":ge(e)?"needs-you":"done"}function ko(e,t){if(e.pending_approval)return t("approval_waiting");let s=ft(e);return s||
(e.running||e.subagents_running||e.orchestrating?t("work_in_progress"):ge(e)?t("linked_change_issue"):tn(e)??t("recent_w\
ork_ready"))}function dt(e,t){let s=e.project||e.workspace||e.agent;return s&&s.replace(/\\/g,"/").replace(/\/+$/,"").split(
"/").pop()||t("session")}function vo(e){return e.pending_approval?"review-approval":ft(e)?"reply":"open"}function xo(e,t){
let s=(e.source_links??[]).map(n=>({kind:n.kind==="issue"?"issue":"change",id:n.url,label:n.kind==="issue"?`issue #${n.number}`:
`${n.provider} #${n.number}`,url:n.url,sessionKey:e.key,status:Zt(n)}));return{id:`session:${e.key}`,title:e.title||t("u\
ntitled_work"),summary:ko(e,t),state:Gt(e),moving:Gt(e)==="running"||void 0,issue:ge(e),updatedAt:$(e.last_ts||e.last_activity_ts||
e.created),sessionKey:e.key,provenance:dt(e,t),queuedBehind:e.queue_depth||void 0,changeBlocked:ge(e)||void 0,action:vo(
e),references:[{kind:"session",id:e.key,label:e.title||t("untitled_work"),sessionKey:e.key},...s]}}function mt(e,t){e.references.
some(s=>s.kind===t.kind&&s.id===t.id)||e.references.push(t)}function nn(e){return(e.source||"").toLowerCase()==="subagen\
t"}function _o(e,t,s){let n=nn(t);e.state="needs-you",e.updatedAt=Math.max(e.updatedAt,$(t.ts)),e.summary=s(n?"subagent_\
gate_waiting":"approval_waiting"),e.approvalKind=n?"subagent":"tool",e.action="review-approval",e.permissionId=t.id,e.permissionTool=
t.tool||t.source,e.permissionPurpose=t.tool_purpose,mt(e,{kind:"approval",id:t.id,label:t.tool||t.source||s("approval"),
sessionKey:t.slot||e.sessionKey})}function So(e,t,s){e.updatedAt=Math.max(e.updatedAt,$(t.started)),e.issue||=!!(t.done&&
(t.error||t.outcome==="failed")),t.done?(t.error||t.outcome==="failed")&&e.state!=="needs-you"&&(e.summary=s("agent_fail\
ed",{task:t.task})):e.state!=="needs-you"&&(e.state="running",e.summary=s("work_in_progress")),mt(e,{kind:"agent",id:t.id,
label:t.agent||s("agent"),sessionKey:t.parent||e.sessionKey})}function No(e,t,s){e.issue||=t.status==="failed",t.status===
"running"&&e.state!=="needs-you"&&(e.state="running"),t.status==="failed"&&e.state!=="needs-you"&&(e.summary=s("workflow\
_failed",{name:t.name})),mt(e,{kind:"workflow",id:t.run_id,label:t.name||t.run_id,sessionKey:t.session_key||e.sessionKey})}
function Ro(e,t){if(t.pending_approval)return"needs-you";switch(e.state){case"needs-you":return"needs-you";case"done":case"\
dropped":return"done";case"in-progress":return"running";default:return null}}function Io(e,t,s){return!(t.running||t.subagents_running||
t.orchestrating)?!1:e===s}function Co(e){let t=null,s=-1;for(let n of e){let i=n.last_touched_turn??0;i>s&&(s=i,t=n)}return t}function Wo(e,t){let s=e.next_steps?.find(i=>i.what?.trim())?.what?.trim();if(s)return s;let n=[...e.progress??[]].reverse().
find(i=>i.trim());return n?n.trim():e.initial_intent?.trim()||t("work_in_progress")}var Ao=3;function Bo(e,t,s){if(!t?.enabled)
return[];let n=t.intents??[];if(n.length===0)return[];let i=(e.source_links??[]).map(r=>({kind:r.kind==="issue"?"issue":
"change",id:r.url,label:r.kind==="issue"?`issue #${r.number}`:`${r.provider} #${r.number}`,url:r.url,sessionKey:e.key,status:Zt(
r)})),l=[],d=Co(n),w=!!(e.running||e.subagents_running||e.orchestrating)?[]:n.filter(r=>r.state==="in-progress");w.forEach(
r=>{let g=n.indexOf(r),h=(r.next_steps??[]).filter(W=>W.what?.trim());l.push({id:`unattended:${e.key}:${g}`,title:pe(r.title,
e.title||s("untitled_work")),summary:h[0]?.what?.trim()||s("no_next_step"),state:"needs-you",issue:ge(e),updatedAt:$(e.last_ts||
e.last_activity_ts||e.created),sessionKey:e.key,provenance:dt(e,s),queuedBehind:e.queue_depth||void 0,changeBlocked:ge(e)||
void 0,unattendedGoals:1,action:"resume",references:[{kind:"session",id:e.key,label:e.title||s("untitled_work"),sessionKey:e.
key},...i],nextSteps:h,progress:(r.progress??[]).filter(W=>W.trim()),stale:!!t.stale,lastTouchedTurn:r.last_touched_turn??
0})}),n.forEach((r,g)=>{if(w.includes(r))return;let h=Ro(r,e);if(!h)return;let W=(r.next_steps??[]).filter(k=>k.what?.trim());
l.push({id:`intent:${e.key}:${g}`,title:pe(r.title,e.title||s("untitled_work")),summary:Wo(r,s),state:h,issue:!1,updatedAt:$(
e.last_ts||e.last_activity_ts||e.created),sessionKey:e.key,provenance:dt(e,s),queuedBehind:e.queue_depth||void 0,changeBlocked:ge(
e)||void 0,unverified:r.verified===!1||void 0,action:"open",references:[{kind:"session",id:e.key,label:e.title||s("untit\
led_work"),sessionKey:e.key},...i],nextSteps:W,progress:(r.progress??[]).filter(k=>k.trim()),stale:!!t.stale,lastTouchedTurn:r.
last_touched_turn??0,moving:Io(r,e,d)||void 0})});let S=l.filter(r=>r.state==="needs-you"),v=l.filter(r=>r.state!=="need\
s-you").sort((r,g)=>(g.lastTouchedTurn??0)-(r.lastTouchedTurn??0));return[...S,...v].slice(0,Math.max(Ao,S.length))}var on=new Set(
["crew-manager-conductor","overwatch-conductor"]),Ko={approval_owed:100,subagent_gate:95,input_requested:80,unverified_completion:70,
error_loop:60,run_failed:55,stalled:50,change_blocked:40,nobody_on_it:30,queued_behind:12,waiting_a_while:8},Lo=3;function $o(e,t){
return e.updatedAt?Math.max(0,Math.floor((t-e.updatedAt)/36e5)):0}var Ye=5;function sn(e,t,s=Date.now()){let n=ht(e),i=cn(
e.filter(d=>d.state==="needs-you"),s),l=[`Fleet: ${n["needs-you"]} waiting on the user, ${n.running} in progress, ${n.done}\
 finished recently.`];return i.length===0?(l.push("Nothing is waiting on the user."),l):(l.push(`Waiting on the user, in\
 the order the list shows them (top ${Math.min(Ye,i.length)}):`),i.slice(0,Ye).forEach((d,c)=>{let w=Ie(oe(d,s),t),S=d.sessionKey?
` [session ${d.sessionKey}]`:"";l.push(`${c+1}. ${d.title} \u2014 ${d.summary} (${w})${S}`)}),i.length>Ye&&l.push(`\u2026and ${i.
length-Ye} more waiting.`),l)}var ct=new Set(["the","a","an","and","or","to","for","of","in","on","at","is","it","this",
"that","with","from","into","be","do","so","as","by","fix","add","make","update","work","session","app","new","use","run",
"why","what","how","again","still","not"]),Ut=.6,jt=2;function ut(e){return[...new Set(e.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,
" ").split(/\s+/).filter(t=>t.length>2&&!ct.has(t)))]}function Je(e,t){let s=ut(e),n=ut(t);if(s.length<jt||n.length<jt)return 0;
let i=s.length<=n.length?s:n,l=new Set(s.length<=n.length?n:s);return i.filter(c=>l.has(c)).length/i.length}function Vt(e){
return e.references.filter(t=>t.kind==="change"||t.kind==="issue").map(t=>t.id)}function Ht(e){return e.references.filter(
t=>t.kind==="artifact").map(t=>t.id)}function Yt(e){return(e.nextSteps??[]).map(t=>t.what).filter(Boolean)}function ze(e,t){
if(Vt(e).find(i=>Vt(t).includes(i)))return"same_change";if(Ht(e).find(i=>Ht(t).includes(i)))return"same_artifact";if(Je(
e.title,t.title)>=Ut)return"same_topic";for(let i of Yt(e))for(let l of Yt(t))if(Je(i,l)>=Ut)return"same_step";return null}
var Xe={merged:[],split:[]};function Jt(e){return`${e.sessionKey??e.id}|${ut(e.title).join(" ")}`}function Re(e,t){return[
Jt(e),Jt(t)].sort().join("")}function Eo(e,t=Xe){let s=e.filter(n=>n.state!=="done"&&n.sessionKey).sort((n,i)=>(n.updatedAt||
0)-(i.updatedAt||0));for(let n=1;n<s.length;n+=1){let i=s[n];for(let l=0;l<n;l+=1){let d=s[l];if(d.sessionKey===i.sessionKey||
t.split.includes(Re(i,d)))continue;let c=ze(i,d);if(c){i.duplicateOf={sessionKey:d.sessionKey,title:d.title,because:c};break}}}
Po(s,t)}var lt=3,Xt=["same_change","same_artifact","same_topic","same_step"];function Po(e,t){for(let s of e){let n=[],i=new Set;
for(let l of e){let d=l.sessionKey;if(d===s.sessionKey||i.has(d)||t.split.includes(Re(s,l)))continue;let c=ze(s,l);c&&(i.
add(d),n.push({sessionKey:d,title:l.title,because:c}))}n.length!==0&&(n.sort((l,d)=>Xt.indexOf(l.because)-Xt.indexOf(d.because)),
s.relatedSessions=n.slice(0,lt),n.length>lt&&(s.relatedMore=n.length-lt))}}var Mo=3e4;function rn(e,t,s=Date.now()){return Object.
keys(t).length===0?e:e.map(n=>{let i=t[n.id];return!i||s-i>Mo||n.state==="running"?n:{...n,state:"running",moving:!0,instructed:!0}})}
function oe(e,t=Date.now()){let s=[],n=(l,d,c=1)=>{s.push({signal:l,weight:Ko[l]*c,values:d})};e.approvalKind==="subagen\
t"?n("subagent_gate"):e.approvalKind==="tool"&&n("approval_owed"),e.action==="reply"&&n("input_requested"),e.unverified&&
n("unverified_completion"),e.loopRepeats&&n("error_loop",{repeats:String(e.loopRepeats)}),e.runFailed&&n("run_failed"),e.
stalledFor&&n("stalled",{duration:Ne(e.stalledFor)}),e.changeBlocked&&n("change_blocked"),e.unattendedGoals&&n("nobody_o\
n_it",{count:String(e.unattendedGoals)}),e.queuedBehind&&n("queued_behind",{count:String(e.queuedBehind)},Math.min(e.queuedBehind,
3));let i=$o(e,t);return i>0&&n("waiting_a_while",{hours:String(i)},Math.min(i,Lo)),s.sort((l,d)=>d.weight-l.weight),{score:s.
reduce((l,d)=>l+d.weight,0),signals:s}}var To={approval_owed:"unblock",subagent_gate:"unblock",input_requested:"unblock",
unverified_completion:"unblock",error_loop:"unblock",run_failed:"unblock",stalled:"unblock",change_blocked:"unblock",nobody_on_it:"\
followup"};function wt(e,t=Date.now()){if(e.state!=="needs-you")return null;for(let s of oe(e,t).signals){let n=To[s.signal];
if(n)return n}return null}var an=14400*1e3;function ln(e,t,s,n=Date.now()){let i=0,l=[];for(let d of e){if(d.state!=="ne\
eds-you"){l.push(d);continue}let c=t[d.id];if(c&&c>n){i+=1;continue}let w=s[d.id];if(w!==void 0&&d.updatedAt<=w){l.push(
{...d,state:"done",issue:!1});continue}l.push(d)}return{items:l,snoozedCount:i}}var Oo=4320*60*1e3;function dn(e,t=Date.
now()){return e.state!=="done"||e.updatedAt===0?!0:t-e.updatedAt<=Oo}var zo={"needs-you":1,running:-1,done:-1};function Do(e,t,s){
let n=e.updatedAt>0,i=t.updatedAt>0;return!n&&!i?0:n?i?(e.updatedAt-t.updatedAt)*s:-1:1}function Ie(e,t){let s=e.signals.
slice(0,2);return s.length===0?t("rank_nothing_pressing"):s.map(i=>t(`rank_${i.signal}`,i.values)).join(t("rank_join"))}
function cn(e,t=Date.now()){let s=new Map(e.map(n=>[n.id,oe(n,t)]));return[...e].sort((n,i)=>{let l=qt[n.state]-qt[i.state];
if(l!==0)return l;if(n.state==="needs-you"){let d=(s.get(i.id)?.score??0)-(s.get(n.id)?.score??0);if(d!==0)return d}else if(n.
issue!==i.issue)return n.issue?-1:1;return Do(n,i,zo[n.state])})}function un(e,t,s={},n={},i={},l=Xe,d=Date.now()){let c=new Map,
w=new Map;for(let r of e.slots){if(!r.key||on.has(r.key)||r.memory_mode==="incognito")continue;let g=Bo(r,s[r.key],t);if(g.
length>0){for(let k of g)c.set(k.id,k);let W=g.find(k=>k.state==="needs-you")??g[0];w.set(r.key,W);continue}let h=xo(r,t);
c.set(h.id,h),w.set(r.key,h)}for(let[r,g]of Object.entries(n)){let h=w.get(r);h&&(h.state="needs-you",h.issue=!0,h.stalledFor=
g.silent_secs,h.summary=g.reason?t("stalled_because",{reason:g.reason,duration:Ne(g.silent_secs)}):t("stalled_for",{duration:Ne(
g.silent_secs)}),h.action="open")}for(let[r,g]of Object.entries(i)){let h=w.get(r);h&&(h.state="needs-you",h.issue=!0,h.
loopRepeats=g.repeats,h.summary=t("error_loop",{tool:g.tool,repeats:String(g.repeats)}),h.action="open")}for(let r of e.
approvals){let g=r.slot?w.get(r.slot):void 0;if(g){_o(g,r,t);continue}c.set(`approval:${r.id}`,{id:`approval:${r.id}`,title:pe(
r.tool||r.source,t("approval_needed")),summary:r.tool_purpose||t("tool_call_waiting"),state:"needs-you",issue:!1,updatedAt:$(
r.ts),provenance:t("approval"),action:"review-approval",approvalKind:nn(r)?"subagent":"tool",permissionId:r.id,permissionTool:r.
tool||r.source,permissionPurpose:r.tool_purpose,references:[{kind:"approval",id:r.id,label:r.tool||r.source||t("approval")}]})}
for(let r of e.agents){let g=r.parent?w.get(r.parent):void 0;if(g){So(g,r,t);continue}let h=!!(r.done&&(r.error||r.outcome===
"failed"));r.parent&&!h||c.set(`agent:${r.id}`,{id:`agent:${r.id}`,title:pe(r.task||r.agent,t("agent_work")),summary:h?r.
error?.trim()||t("agent_failed",{task:r.task}):r.done?t("agent_done"):t("work_in_progress"),state:h?"needs-you":r.done?"\
done":"running",issue:h,runFailed:h||void 0,retryPath:h&&!r.id.startsWith("native:")?`/api/spawn/${encodeURIComponent(r.
id)}/retry`:void 0,updatedAt:$(r.started),provenance:r.agent||t("agent"),action:"discuss",references:[{kind:"agent",id:r.
id,label:r.agent||t("agent")}]})}for(let r of e.workflows){let g=r.session_key?w.get(r.session_key):void 0;if(g){No(g,r,
t);continue}let h=r.status==="failed";c.set(`workflow:${r.run_id}`,{id:`workflow:${r.run_id}`,title:pe(r.name,r.run_id),
summary:h?t("workflow_failed_generic"):r.status==="running"?t("workflow_running"):t("workflow_finished"),state:h?"needs-\
you":r.status==="running"?"running":"done",issue:h,runFailed:h||void 0,retryPath:h?`/api/workflows/runs/${encodeURIComponent(
r.run_id)}/rerun`:void 0,updatedAt:0,provenance:t("workflow"),action:"discuss",references:[{kind:"workflow",id:r.run_id,
label:r.name||r.run_id}]})}for(let r of e.crons){if(!r.is_running&&r.last_status!=="error")continue;let g=r.last_status===
"error",h=go(r,d),W=t(g?"monitor_failed":"monitor_running");c.set(`monitor:${r.id}`,{id:`monitor:${r.id}`,title:r.name,summary:h?
`${W} ${t("monitor_next_check",{duration:h})}`:W,state:g?"needs-you":"running",issue:g,runFailed:g||void 0,retryPath:g?`\
/api/crons/${encodeURIComponent(r.id)}/run`:void 0,updatedAt:$(r.running_since||r.last_run_ts||r.created_ts),provenance:t(
"monitor"),action:g?"discuss":void 0,references:[{kind:"monitor",id:r.id,label:r.name}]})}for(let r of e.loops||[]){if(!r.
active)continue;let g=String(r.id||"");if(!g)continue;let h=Math.max(0,Number(r.cycle_count)||0),W=Math.max(0,Number(r.max_cycles)||
0),k=r.slot_key&&w.has(r.slot_key)?r.slot_key:void 0;c.set(`loop:${g}`,{id:`loop:${g}`,title:pe(r.message||"",t("loop")),
summary:W?t("loop_watching_capped",{cycles:String(h),cap:String(W)}):t("loop_watching",{cycles:String(h)}),state:"runnin\
g",issue:!1,updatedAt:$(r.last_fire_ts||r.created_ts),sessionKey:k,provenance:t("loop"),stopPath:`/api/autonudge/${encodeURIComponent(
g)}`,action:k?"open":void 0,references:[{kind:"monitor",id:g,label:t("loop"),sessionKey:k},...k?[{kind:"session",id:k,label:w.
get(k)?.title||k,sessionKey:k}]:[]]})}let S=[...e.artifacts].sort((r,g)=>$(g.updated_at)-$(r.updated_at)).slice(0,8);for(let r of S){
let g=r.session_key&&w.has(r.session_key)?r.session_key:void 0;c.set(`artifact:${r.slug}`,{id:`artifact:${r.slug}`,title:pe(
r.name,t("artifact")),summary:r.description||t("artifact_ready",{kind:r.kind}),state:"done",issue:!1,updatedAt:$(r.updated_at||
r.created_at),sessionKey:g,provenance:r.session_title||r.source||t("artifact"),action:g?"open":void 0,references:[{kind:"\
artifact",id:r.slug,label:r.name,sessionKey:g},...g?[{kind:"session",id:g,label:r.session_title||g,sessionKey:g}]:[]]})}
let v=[...c.values()];return Eo(v,l),cn(v)}function ht(e){return{all:e.length,"needs-you":e.filter(t=>t.state==="needs-y\
ou").length,running:e.filter(t=>t.state==="running").length,done:e.filter(t=>t.state==="done").length}}function pn(e){let t=[],s=new Map;for(let n of e){let i=n.sessionKey;if(!i)continue;let l=s.get(i);if(l){l.count+=1;continue}
let d=n.references.find(w=>w.kind==="session")?.label??n.provenance,c={sessionKey:i,label:d,leading:n,count:1};s.set(i,c),
t.push(c)}return t}function bt(e,t,s=Xe){if(t==="pr")return qo(e);if(t==="goal")return pt(e,s);let n=[],i=new Map;for(let l of e){
let d=l.sessionKey;if(!d){n.push({key:l.id,items:[l],header:null,sessionKey:null,changeRef:null});continue}let c=i.get(d);
if(c){c.items.push(l);continue}let w={key:d,items:[l],header:"session",sessionKey:l.sessionKey??null,changeRef:null};i.set(
d,w),n.push(w)}return n}function qo(e){let t=[],s=new Map;for(let n of e){let i=n.references.filter(l=>l.kind==="change"||
l.kind==="issue");for(let l of i){let d=`${l.kind}:${l.id}`,c=s.get(d);if(c){c.items.push(n);continue}let w={key:d,items:[
n],header:"pr",sessionKey:null,changeRef:l};s.set(d,w),t.push(w)}}return t}function pt(e,t){let s=e.map((c,w)=>w),n=c=>{
for(;s[c]!==c;)s[c]=s[s[c]],c=s[c];return c},i=(c,w)=>{s[n(w)]=n(c)};for(let c=0;c<e.length;c+=1)for(let w=c+1;w<e.length;w+=
1){let S=e[c],v=e[w];if(!S.sessionKey||!v.sessionKey||S.sessionKey===v.sessionKey)continue;let r=Re(S,v);t.split.includes(
r)||(t.merged.includes(r)||ze(S,v))&&i(c,w)}let l=[],d=new Map;for(let c=0;c<e.length;c+=1){let w=n(c),S=d.get(w);if(S){
S.items.push(e[c]),S.header="goal";continue}let v={key:`goal:${e[c].id}`,items:[e[c]],header:null,sessionKey:null,changeRef:null};
d.set(w,v),l.push(v)}return l}function gn(e,t){let s=e.references.find(n=>n.kind==="session")?.label??"";for(let n of[e.
title,s,e.provenance]){let i=n.toLowerCase();for(let l of t)if(l.aliases.some(d=>d&&i.includes(d.toLowerCase())))return l.
name}return null}function fn(e,t){let s=t.flatMap(l=>l.aliases.map(d=>d.toLowerCase())),n=new Set(["workspace","workspac\
es","home","src","tmp","documents","desktop"]),i=new Map;for(let l of e){if(!l.key||on.has(l.key)||l.memory_mode==="inco\
gnito")continue;let d=l.project;if(!d)continue;let c=d.replace(/\\/g,"/").replace(/\/+$/,"").split("/").pop();!c||n.has(
c.toLowerCase())||s.some(w=>c.toLowerCase().includes(w)||w.includes(c.toLowerCase()))||i.set(c,(i.get(c)??0)+1)}return[...i.
entries()].map(([l,d])=>({name:l,sessions:d})).sort((l,d)=>d.sessions-l.sessions)}function mn(e,t){let s=new Map;for(let l of e){
if(!l.sessionKey||gn(l,t)!==null)continue;let d=l.references.find(c=>c.kind==="session")?.label??"";for(let c of[l.title,
d]){let w=c.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);for(let S of[3,2])for(let v=0;v+
S<=w.length;v+=1){let r=w.slice(v,v+S);if(ct.has(r[0])||ct.has(r[S-1])||r[0].length<3||r[S-1].length<3)continue;let g=r.
join(" ");s.has(g)||s.set(g,new Set),s.get(g).add(l.sessionKey)}}}let n=[...s.entries()].map(([l,d])=>({phrase:l,sessions:d.
size})).filter(l=>l.sessions>=2);return n.filter(l=>!n.some(d=>d.phrase!==l.phrase&&d.phrase.includes(l.phrase)&&d.sessions>=
l.sessions)).sort((l,d)=>d.sessions-l.sessions||d.phrase.length-l.phrase.length).map(l=>({name:l.phrase.replace(/\p{L}+/gu,
d=>d[0].toUpperCase()+d.slice(1)),sessions:l.sessions}))}function Qt(e){return e.some(t=>t.state==="needs-you")?"needs-y\
ou":e.some(t=>t.state==="running")?"running":"done"}function wn(e){let t=e.find(n=>n.moving);if(t)return t;let s=e.find(
n=>n.state==="running");return s||[...e].sort((n,i)=>(i.updatedAt||0)-(n.updatedAt||0))[0]}function Fo(e){let t=[],s=new Set;
for(let n of e){let i=n.sessionKey;!i||s.has(i)||(s.add(i),t.push(n.references.find(l=>l.kind==="session")?.label??n.provenance))}
return t}function hn(e,t,s=Xe){let n=new Map,i=[],l=new Map;for(let v of e){let r=gn(v,t);if(l.set(v.id,r),r===null){i.push(
v);continue}n.has(r)||n.set(r,[]),n.get(r).push(v)}let d=pt(i,s),c=new Map;for(let v of d)c.set(v.items[0].id,v);let w=[],
S=new Set;for(let v of e){let r=l.get(v.id)??null;if(r!==null){if(S.has(r))continue;S.add(r);let h=n.get(r);w.push({key:`\
initiative:${r}`,name:r,status:Qt(h),sessions:Fo(h),blocks:pt(h,s)});continue}let g=c.get(v.id);g&&w.push({key:g.key,name:null,
status:Qt(g.items),sessions:[],blocks:[g]})}return w}function yt(e){return`${e.last_ts??e.last_activity_ts??""}:${e.messages??0}`}function yn(e,t){return e.filter(s=>s.key&&
s.key!==t&&s.memory_mode!=="incognito").sort((s,n)=>bn(n)-bn(s)).slice(0,12)}function bn(e){let t=e.last_ts??e.last_activity_ts??
e.created;if(typeof t=="number")return t>1e10?t:t*1e3;if(!t)return 0;let s=Date.parse(t);return Number.isFinite(s)?s:0}async function kn(e,t){
let s={},n="unknown";for(let i of e)try{let l=await t(`/api/chat/slots/${encodeURIComponent(i.key)}/summary`);if(!l||typeof l!=
"object"){n="unsupported";break}if(l.enabled===!1){n="disabled";break}s[i.key]=l,n="available"}catch{n="unsupported";break}
return{summaries:s,support:n}}var vn=String.raw`
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
`;import{Fragment as Be,jsx as a,jsxs as p}from"react/jsx-runtime";var kt="crew-manager.snoozed",Nn="crew-manager.handled",
Rn="crew-manager.done-collapsed",vt="crew-manager.goal-verdicts",In="crew-manager.initiative-collapsed",Cn="crew-manager\
.split",Wn="crew-manager.tab",An=40,ns=25,os=75;function fe(e,t={}){try{let s=localStorage.getItem(e);return s?JSON.parse(
s):t}catch{return t}}function Q(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function ss(e,t=Date.now()){if(!e)
return null;let s=Math.max(0,Math.round((t-e)/1e3));if(s<60)return"just now";let n=Math.round(s/60);if(n<60)return`${n}m\
 ago`;let i=Math.round(n/60);return i<24?`${i}h ago`:`${Math.round(i/24)}d ago`}function Bn(e){return e?new Date(e).toLocaleTimeString(
[],{hour:"numeric",minute:"2-digit"}):""}var Ce="crew-manager-conductor",rs=5e3,as={session:"Session",approval:"Approval",
agent:"Agent",workflow:"Workflow",monitor:"Monitor",artifact:"Artifact",approval_waiting:"Review the pending approval re\
quest",subagent_gate_waiting:"Allow or refuse a sub-agent held at the spawn gate",information_needed:"Answer the request\
 in the work thread",decision_ready:"Make the decision this work is waiting on",work_in_progress:"Work is in progress",linked_change_issue:"\
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
untitled_work:"Untitled work"};function J(e,t={}){return as[e].replace(/\{\{(\w+)\}\}/g,(s,n)=>t[n]??"")}var is={followup:"\
FOLLOW UP",unblock:"UNBLOCK"},Ae={"needs-you":"Needs you",running:"Running",done:"Done"},xt={all:"All","needs-you":"Need\
s you",running:"Running",done:"Done"},Kn={all:"All",failing:"Failing",running:"Running",merged:"Merged"},ls={session:It,
approval:Tn,agent:Go,workflow:Yo,monitor:qn,artifact:Uo,change:Rt,issue:Ho};function Z({children:e,onActivate:t,...s}){return a(
"div",{...s,role:"button",tabIndex:0,onClick:t,onKeyDown:n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t())},children:e})}
function Ln({label:e,count:t,subtitle:s}){return p("div",{className:"ow-section-header",children:[p("div",{className:"ow\
-section-heading",children:[a("h2",{className:"ow-section-title",children:e}),a("span",{className:"ow-section-count",children:t})]}),
s&&a("p",{className:"ow-section-subtitle",children:s})]})}function Ct(e){if(e.state==="needs-you"){let t=wt(e);return t?
a(D,{variant:"warn",className:"ow-verb",children:is[t]}):null}return e.state==="running"?e.moving?p(D,{variant:"aim",children:[
a(Dn,{className:"ow-icon"}),Ae[e.state]]}):a(D,{variant:"muted",children:"Queued"}):p(D,{variant:"ok",children:[a(zn,{className:"\
ow-icon"}),Ae[e.state]]})}function Fn({tool:e,purpose:t,busy:s,onAnswer:n,where:i}){return p("div",{className:"ow-permission",children:[p("div",{className:"\
ow-permission-body",children:[p("div",{className:"ow-permission-head",children:[a(jo,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-permission-title",children:"Waiting for your permission"})]}),p("p",{className:"ow-permi\
ssion-what",children:[i&&p("span",{className:"ow-truncate",children:[i," "]}),i?"wants to run ":"Wants to run ",a("code",
{children:e})]}),t&&a("p",{className:"ow-permission-why",children:t})]}),p("div",{className:"ow-permission-actions",children:[
a(M,{onClick:()=>n(!0),disabled:s,children:"Approve"}),a(M,{onClick:()=>n(!1),disabled:s,children:"Reject"})]})]})}function De({
children:e}){return a("div",{className:"ow-expand",children:a("div",{className:"ow-expand-inner",children:e})})}var _t=3;
function $n(e){let t=e.provenance.trim().toLowerCase();return e.references.filter(s=>s.label.trim().toLowerCase()!==t)}function ds({
candidates:e,prominent:t,busy:s,onAdd:n}){let[i,l]=N(""),d=t?e:e.filter(c=>c.sessions>=2);return p("div",{className:"ow-\
bootstrap","data-prominent":t?"true":void 0,children:[a("div",{className:"ow-bootstrap-head",children:t?"No big goals de\
fined yet":d.length>0?"Suggested goals":"Add a goal"}),(t||d.length>0)&&a("div",{className:"ow-bootstrap-sub",children:"\
Found in your unassigned work \u2014 click one to confirm it as a goal, or name your own."}),d.length>0&&a("div",{className:"\
ow-bootstrap-chips",children:d.slice(0,4).map(c=>p("button",{type:"button",className:"ow-bootstrap-chip",disabled:s,onClick:()=>n(
c.name,[c.name]),children:[c.name," ",p("span",{className:"ow-bootstrap-count",children:[c.sessions," session",c.sessions===
1?"":"s"]})]},c.name))}),p("div",{className:"ow-bootstrap-custom",children:[a(es,{value:i,placeholder:"Or name a goal yo\
urself\u2026","aria-label":"New goal name",onChange:c=>l(c.target.value),onKeyDown:c=>{c.key==="Enter"&&i.trim()&&(n(i),
l(""))}}),a(M,{disabled:s||!i.trim(),onClick:()=>{n(i),l("")},children:"Add goal"})]})]})}function En({members:e}){let t=e[0],
s=new Set(e.map(c=>c.sessionKey).filter(Boolean)).size,n=e.filter(c=>c.state==="needs-you").length,i=e.filter(c=>c.state===
"running").length,l=e.filter(c=>c.state==="done").length,d=[`${s} session${s===1?"":"s"}`];return n&&d.push(`${n} need${n===
1?"s":""} you`),i&&d.push(`${i} running`),l&&d.push(`${l} done`),p("div",{className:"ow-goal-digest",children:[t.summary&&
a("p",{className:"ow-digest-line",children:t.summary}),a("div",{className:"ow-digest-counts",children:d.join(" \xB7 ")})]})}
function Pn({block:e,status:t,folded:s,onToggle:n,onSplit:i,selected:l,onSelect:d}){let c=e.items[0],w=new Set(e.items.map(
r=>r.sessionKey).filter(Boolean)).size,S=[];for(let r=0;r<e.items.length;r+=1)for(let g=r+1;g<e.items.length;g+=1)e.items[r].
sessionKey!==e.items[g].sessionKey&&S.push(Re(e.items[r],e.items[g]));let v=p(Be,{children:[n&&a("button",{type:"button",
className:"ow-goal-fold","aria-label":s?`Expand ${c.title}`:`Collapse ${c.title}`,"aria-expanded":!s,onClick:r=>{r.stopPropagation(),
n()},children:a(re,{className:"ow-icon ow-init-chevron","data-open":s?void 0:"true","aria-hidden":"true"})}),a(St,{className:"\
ow-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",children:c.title}),t&&a("span",{className:"\
ow-init-status","data-status":t,children:Ae[t]}),p("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidde\
n":"true",children:"\xB7"}),p("span",{className:"ow-truncate",children:[w," sessions, one goal"]})]}),i&&a(M,{className:"\
ow-block-open",title:"Not the same goal \u2014 split into separate cards","aria-label":`Split ${c.title}`,onClick:r=>{r.
stopPropagation(),i(S)},children:"Split"})]});return d?a(Z,{onActivate:d,className:"ow-block-tab ow-goal-tab","aria-pres\
sed":l,"data-selected":l?"true":void 0,children:v}):a("div",{className:"ow-block-tab",children:v})}var cs=.3;function Mn({
item:e,items:t,onMerge:s}){let n=t.filter(i=>i.id!==e.id&&i.sessionKey&&e.sessionKey&&i.sessionKey!==e.sessionKey).map(i=>({
other:i,score:ze(e,i)?1:Je(e.title,i.title)})).filter(i=>i.score>=cs).sort((i,l)=>l.score-i.score).slice(0,2);return n.length===
0?null:p("div",{className:"ow-merge-hint",children:[a("span",{className:"ow-merge-hint-label",children:"Same goal?"}),n.
map(({other:i})=>p("button",{type:"button",className:"ow-merge-hint-btn ow-truncate",onClick:()=>s(Re(e,i)),children:["M\
erge with \u201C",i.title,"\u201D"]},i.id))]})}function us({item:e,onOpen:t}){let s=e.references.find(i=>i.kind==="sessi\
on"),n=e.references.filter(i=>i.kind!=="session");return p("div",{className:"ow-block-tab",children:[a(It,{className:"ow\
-icon","aria-hidden":"true"}),a("span",{className:"ow-truncate ow-block-name",children:s?.label??e.provenance}),p("span",
{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\xB7"}),a("span",{className:"ow-trunca\
te",children:e.provenance}),n.slice(0,2).map(i=>a("span",{className:"ow-truncate",children:i.label},`${i.kind}:${i.id}`))]}),
a(M,{className:"ow-block-open",onClick:t,"aria-label":`Open ${s?.label??e.provenance}`,children:"Open"})]})}function ps({
session:e,selected:t,onSelect:s,onOpen:n}){return p(Z,{onActivate:s,className:"ow-srow","data-selected":t,children:[a(It,
{className:"ow-icon","aria-hidden":"true"}),p("div",{className:"ow-srow-body",children:[a("div",{className:"ow-srow-name\
 ow-truncate",children:e.label}),a("div",{className:"ow-srow-state ow-truncate",children:e.leading.summary})]}),a("span",
{className:"ow-srow-badge",children:Ct(e.leading)}),a(M,{className:"ow-srow-open","aria-label":`Open ${e.label}`,onClick:i=>{
i.stopPropagation(),n()},children:"Open"})]})}function gs({reference:e,checks:t}){let s=e.status?/fail|conflict|closed/.
test(e.status):!1;return p("div",{className:"ow-pr-head",children:[p("div",{className:"ow-pr-head-top",children:[a("span",
{className:"ow-truncate ow-block-name",children:e.label}),e.url&&a("a",{className:"ow-block-open ow-icon-link",href:e.url,
target:"_blank",rel:"noopener noreferrer","aria-label":`Open ${e.label}`,children:a(Rt,{className:"ow-icon","aria-hidden":"\
true"})})]}),a("div",{className:"ow-pr-status-line",children:t?.available&&(t.total??0)>0?p("span",{className:"ow-pr-dot",
"data-bad":(t.failing??0)>0?"true":void 0,children:[t.passing??0,"/",t.total," checks passing",(t.failing??0)>0?` \xB7 ${t.
failing} failing`:""]}):e.status&&a("span",{className:"ow-pr-dot","data-bad":s?"true":void 0,children:e.status})})]})}function fs({
reference:e,onOpenSession:t}){let s=ls[e.kind],n=p(Be,{children:[a(s,{className:"ow-icon"}),a("span",{className:"ow-trun\
cate",children:e.label})]});return e.url?a("a",{className:"ow-reference ow-reference-link",href:e.url,target:"_blank",rel:"\
noopener noreferrer",onClick:i=>i.stopPropagation(),children:n}):e.sessionKey?a(Z,{className:"ow-reference ow-reference-\
link",onActivate:()=>t(e.sessionKey),children:n}):a("span",{className:"ow-reference",children:n})}function Nt({item:e,selected:t,
continuation:s,whyRanked:n,onSelect:i,onOpenSession:l,onAnswerPermission:d,permissionBusy:c,onRetry:w,retryBusy:S,onStop:v,
stopBusy:r,onPickStep:g,onSnooze:h,onHandled:W,hideBadge:k,compact:R,headless:B}){let[T,U]=N(!1);return p(Z,{onActivate:i,
className:"ow-row","aria-pressed":t,"data-selected":t,"data-instructed":e.instructed?"true":void 0,"data-continuation":s?
"true":void 0,"data-testid":`work-item-${e.id}`,children:[p("div",{className:"ow-row-layout",children:[p("div",{className:"\
ow-row-content",children:[!B&&p("div",{className:"ow-row-heading",children:[k?e.state==="done"&&a(On,{className:"ow-icon\
 ow-row-check","aria-hidden":"true"}):Ct(e),a("span",{className:"ow-row-title",children:e.title})]}),(!R||t)&&e.summary&&
!(e.nextSteps??[]).some(x=>x.what?.trim()===e.summary)&&a("p",{className:"ow-row-summary",children:e.summary}),e.duplicateOf&&
p(Z,{className:"ow-row-duplicate",onActivate:()=>l(e.duplicateOf.sessionKey),children:[a(St,{className:"ow-icon","aria-h\
idden":"true"}),a("span",{className:"ow-truncate",children:J(`duplicate_${e.duplicateOf.because}`,{title:e.duplicateOf.title})})]}),
t&&e.relatedSessions&&e.relatedSessions.length>0&&a(De,{children:p("div",{className:"ow-related",children:[a("span",{className:"\
ow-related-label",children:J("related_sessions",{count:String(e.relatedSessions.length)})}),e.relatedSessions.map(x=>p(Z,
{className:"ow-related-row",onActivate:()=>l(x.sessionKey),children:[a(St,{className:"ow-icon","aria-hidden":"true"}),a(
"span",{className:"ow-truncate",children:x.title}),a("span",{className:"ow-related-why",children:J(`related_${x.because}`)})]},
x.sessionKey)),e.relatedMore?a("span",{className:"ow-related-more",children:J("related_more",{count:String(e.relatedMore)})}):
null]})}),n&&a("div",{className:"ow-row-why",children:n}),!s&&p("div",{className:"ow-row-meta",children:[a("span",{className:"\
ow-truncate",children:e.provenance}),$n(e).length>0&&a("span",{"aria-hidden":"true",children:"\xB7"}),a("span",{className:"\
ow-references",children:$n(e).slice(0,3).map(x=>a(fs,{reference:x,onOpenSession:l},`${x.kind}:${x.id}`))})]})]}),a("div",
{className:"ow-row-actions",children:a(re,{className:"ow-icon","aria-hidden":"true"})})]}),t&&g&&e.nextSteps&&e.nextSteps.
length>0&&a(De,{children:p("div",{className:"ow-row-steps",children:[a("div",{className:"ow-steps-head",children:"Sugges\
ted next steps"}),e.nextSteps.slice(0,T?void 0:_t).map((x,ae)=>a("button",{type:"button",className:"ow-quote-step",title:x.
why??x.what,onClick:ee=>{ee.stopPropagation(),g(x.what)},children:x.what},`${ae}:${x.what}`)),e.nextSteps.length>_t&&a("\
button",{type:"button",className:"ow-steps-more",onClick:x=>{x.stopPropagation(),U(ae=>!ae)},children:T?"Show fewer":`+${e.
nextSteps.length-_t} more`})]})}),t&&e.retryPath&&w&&a(De,{children:a("div",{className:"ow-retry",children:a(M,{onClick:()=>w(
e.retryPath),disabled:!!S,children:"Retry"})})}),t&&e.stopPath&&v&&a(De,{children:a("div",{className:"ow-retry",children:a(
M,{onClick:()=>v(e.stopPath),disabled:!!r,children:r?"Stopping\u2026":"Stop this loop"})})}),t&&e.permissionId&&d&&a(De,
{children:a(Fn,{tool:e.permissionTool||"a tool",purpose:e.permissionPurpose,busy:!!c,onAnswer:x=>d(e.permissionId,x)})}),
e.state==="needs-you"&&h&&W&&p("div",{className:"ow-row-aside",children:[a("button",{type:"button",className:"ow-aside-b\
tn",onClick:x=>{x.stopPropagation(),h(e.id)},children:"Later"}),a("button",{type:"button",className:"ow-aside-btn",onClick:x=>{
x.stopPropagation(),W(e.id,e.updatedAt)},children:"Handled"})]})]})}var ms=["unblock","followup","running","done"],ws={unblock:{
label:"UNBLOCK",cls:"ow-lane-unblock"},followup:{label:"FOLLOW UP",cls:"ow-lane-followup"}};function hs(e){return e.state===
"done"?"done":e.state==="running"?"running":wt(e)??"unblock"}function bs({items:e,selectedId:t,onSelect:s,onOpenSession:n,
onAnswerPermission:i,permissionBusy:l,onRetry:d,retryBusy:c,onPickStep:w,onSnooze:S,onHandled:v,doneTitles:r}){let[g,h]=N(
!1),W=new Map;for(let k of e){let R=hs(k),B=W.get(R);B?B.push(k):W.set(R,[k])}return p(Be,{children:[ms.filter(k=>W.has(
k)).map(k=>{let R=W.get(k),B=k==="unblock"||k==="followup"?ws[k]:null,T=B?R.map(x=>x.action!=="resume"?Ie(oe(x),J):""):[],
U=B&&T.length>0&&T.every(x=>x&&x===T[0])?T[0]:void 0;return p("div",{className:"ow-lane",children:[B&&p("div",{className:"\
ow-lane-head",children:[a("span",{className:`ow-lane-badge ${B.cls}`,children:B.label}),U&&a("span",{className:"ow-lane-\
reason",children:U})]}),R.map(x=>a(Nt,{item:x,hideBadge:!0,compact:!0,selected:t===x.id,continuation:!0,whyRanked:U?void 0:
x.state==="needs-you"&&x.action!=="resume"?Ie(oe(x),J):void 0,onSelect:()=>s(x),onOpenSession:n,onAnswerPermission:i,permissionBusy:l,
onRetry:d,retryBusy:c,onPickStep:w,onSnooze:S,onHandled:v},x.id))]},k)}),!W.has("done")&&r&&r.length>0&&p("div",{className:"\
ow-lane ow-lane-done",children:[p("button",{type:"button",className:"ow-goals-toggle","aria-expanded":g,onClick:()=>h(k=>!k),
children:[a(re,{className:"ow-icon","data-open":g?"true":void 0,"aria-hidden":"true"}),r.length," done"]}),g&&a("ul",{className:"\
ow-done-list",children:r.map(k=>p("li",{className:"ow-row-goal-done",children:[a(On,{className:"ow-icon","aria-hidden":"\
true"}),a("span",{className:"ow-truncate",children:k})]},k))})]})]})}function We({title:e,items:t,selectedId:s,onSelect:n,
onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:w,onStop:S,stopBusy:v,onPickStep:r,onSnooze:g,
onHandled:h,footer:W,collapsed:k,onToggleCollapsed:R,groupBy:B,prChecks:T,prFilter:U,doneBySession:x,goalVerdicts:ae,onSplitGoal:ee,
onMergeGoal:ie,initiativeBlocks:qe,collapsedInitiatives:Ke,onToggleInitiative:me,selectedGoalKey:Le,onSelectGoal:le,subtitle:$e,
emptyLabel:q}){let Ee=bt(t,B,ae),F=B==="pr"&&U&&U!=="all"?Ee.filter(b=>b.changeRef&&gt(b.changeRef,T?.[b.changeRef.url??
""])===U):Ee,we=qe??[],H=B==="goal"?we.length:B==="pr"?F.length:t.length,Fe=b=>p("div",{className:"ow-block","data-group\
ed":b.header?"true":void 0,children:[b.header==="session"&&b.sessionKey&&a(us,{item:b.items[0],onOpen:()=>i(b.sessionKey)}),
b.header==="pr"&&b.changeRef&&a(gs,{reference:b.changeRef,checks:T?.[b.changeRef.url??""]}),b.header==="goal"&&a(Pn,{block:b,
onSplit:ee,selected:Le===b.key,onSelect:le?()=>le(b.key):void 0}),b.header==="pr"?p(Be,{children:[a("div",{className:"ow\
-pr-sublabel",children:"Sessions on this PR"}),pn(b.items).map(I=>a(ps,{session:I,selected:s===I.leading.id,onSelect:()=>n(
I.leading),onOpen:()=>i(I.sessionKey)},I.sessionKey))]}):b.header==="session"?a(bs,{items:b.items,doneTitles:b.sessionKey?
x?.[b.sessionKey]:void 0,selectedId:s,onSelect:n,onOpenSession:i,onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:w,
onPickStep:r,onSnooze:g,onHandled:h}):b.items.map(I=>p(xn,{children:[a(Nt,{item:I,selected:s===I.id,continuation:b.header===
"session",whyRanked:I.state==="needs-you"&&I.action!=="resume"?Ie(oe(I),J):void 0,onSelect:()=>n(I),onOpenSession:i,onAnswerPermission:l,
permissionBusy:d,onRetry:c,retryBusy:w,onStop:S,stopBusy:v,onPickStep:r,onSnooze:g,onHandled:h}),B==="goal"&&ie&&s===I.id&&
a(Mn,{item:I,items:t,onMerge:ie})]},I.id))]},b.key),he=(b,I)=>p(xn,{children:[a(Nt,{item:b,selected:s===b.id,headless:I!==
null&&b.title===I,whyRanked:b.state==="needs-you"&&b.action!=="resume"?Ie(oe(b),J):void 0,onSelect:()=>n(b),onOpenSession:i,
onAnswerPermission:l,permissionBusy:d,onRetry:c,retryBusy:w,onPickStep:r,onSnooze:g,onHandled:h}),ie&&s===b.id&&a(Mn,{item:b,
items:t,onMerge:ie})]},b.id),Ge=b=>{if(b.name){let j=Ke?.[b.key]??b.status!=="needs-you",V=b.blocks.flatMap(be=>be.items);
return p("div",{className:"ow-block","data-grouped":"true",children:[p(Z,{onActivate:()=>me?.(b.key,!j),className:"ow-bl\
ock-tab","aria-expanded":!j,children:[a(re,{className:"ow-icon ow-init-chevron","data-open":j?void 0:"true","aria-hidden":"\
true"}),a("span",{className:"ow-truncate ow-block-name",children:b.name}),a("span",{className:"ow-init-status","data-sta\
tus":b.status,children:Ae[b.status]}),p("span",{className:"ow-block-tab-meta",children:[a("span",{"aria-hidden":"true",children:"\
\xB7"}),p("span",{className:"ow-truncate",children:[b.sessions.length," session",b.sessions.length===1?"":"s"]})]})]}),j?
a(En,{members:V}):V.map(be=>he(be,null))]},b.key)}let I=b.blocks[0];if(I.header==="goal"){let j=Ke?.[b.key]??b.status!==
"needs-you";return p("div",{className:"ow-block","data-grouped":"true",children:[a(Pn,{block:I,status:b.status,folded:j,
onToggle:me?()=>me(b.key,!j):void 0,onSplit:ee,selected:Le===I.key,onSelect:le?()=>le(I.key):void 0}),j?a(En,{members:I.
items}):I.items.map(V=>he(V,I.items[0].title))]},b.key)}let O=I.items[0];return p("div",{className:"ow-block","data-grou\
ped":"true",children:[p(Z,{onActivate:()=>n(O),className:"ow-block-tab ow-goal-tab","aria-pressed":s===O.id,"data-select\
ed":s===O.id?"true":void 0,children:[Ct(O),a("span",{className:"ow-truncate ow-block-name",children:O.title})]}),he(O,O.
title)]},b.key)};return p("section",{className:"ow-section","aria-label":e,children:[R?p(Z,{onActivate:R,className:"ow-s\
ection-toggle",children:[a(Ln,{label:e,count:H,subtitle:$e}),a(re,{className:"ow-icon ow-section-chevron","data-open":k?
void 0:"true","aria-hidden":"true"})]}):a(Ln,{label:e,count:H,subtitle:$e}),k?null:a("div",{className:"ow-section-list",
children:B==="goal"?we.length===0?a("p",{className:"ow-section-empty",children:q}):we.map(Ge):F.length===0?a("p",{className:"\
ow-section-empty",children:q}):F.map(Fe)}),W]})}function ys(e,t){let s=sn(t,J);if(!e)return["Crew Manager context: works\
pace overview.",...s,"Answer the user about the state of their work. This is a conversation, not an action channel."].join(
`
`);let n=e.references.map(l=>`${l.kind}: ${l.label} (${l.id})`).join(`
`),i=[e.stalledFor?`Silent for ${Ne(e.stalledFor)} while still marked running.`:void 0,e.loopRepeats?`The same failure h\
as repeated ${e.loopRepeats} times.`:void 0,e.unverified?"Reported finished but never verified.":void 0,e.changeBlocked?
"A linked change is failing or conflicting.":void 0,e.queuedBehind?`${e.queuedBehind} further prompt(s) are queued in th\
is same session.`:void 0,e.approvalKind?`An approval is owed (${e.approvalKind}). Only the user can answer it; recommend\
, do not attempt it.`:void 0,e.runFailed?e.retryPath?"This run failed. The user has a Retry button on the card.":"This r\
un failed and the platform cannot re-run it, so there is no retry to recommend.":void 0,e.stopPath?"This is a live monit\
or loop: it re-prompts its own session unattended. The user has a Stop button on the card. You cannot stop it yourself.":
void 0,e.sessionKey?void 0:"This is background work with no session to instruct, so any recommendation must be something\
 the user does on the card."].filter(l=>!!l);return[`Crew Manager context: ${e.title}`,...s,`Selected item: ${e.title}`,
`State: ${Ae[e.state]}`,e.issue?"Issue detected.":void 0,`Latest meaningful update: ${e.summary}`,`Provenance: ${e.provenance}`,
e.sessionKey?`Referenced session: ${e.sessionKey}`:"Referenced session: none",...i.length>0?[`Why it is on the board:
${i.join(`
`)}`]:[],`References:
${n}`,"This context was selected silently. Answer the user about it; the user sends any instruction to a session themsel\
ves."].filter(l=>!!l).join(`
`)}function ks(){let e=Jo(),t=se(e);t.current=e;let s=Xo(),n=Qo(),[i,l]=N("all"),[d,c]=N(()=>fe(Wn,null)==="session"?"se\
ssion":"goal"),[w,S]=N("all"),[v,r]=N({}),[g,h]=N(null),[W,k]=N(null),[R,B]=N(null),[T,U]=N({}),[x,ae]=N("unknown"),ee=se(
"unknown"),ie=se(new Map),[qe,Ke]=N({}),[me,Le]=N({}),[le,$e]=N([]),[q,Ee]=N(null),[F,we]=N(null),[H,Fe]=N(null),[he,Ge]=N(
()=>fe(kt)),[b,I]=N(()=>fe(Nn)),[O,j]=N(()=>fe(vt,{merged:[],split:[]})),[V,be]=N([]),[Gn,Un]=N(()=>fe(In)),[Ue,je]=N(null),
[jn,Vn]=N(()=>fe(Rn,null)??!0),[Wt,At]=N({}),[Qe,Hn]=N([]),[Ze,Bt]=N(()=>fe(Cn,null)??An),[et,Kt]=N(!1),Lt=se(!0),[Yn,$t]=N(
!0),[Et,tt]=N(null),[Jn,Xn]=N(!1),[Pt,de]=N(null),K=se(!0),Pe=se(0),nt=se(!1);G(()=>(K.current=!0,()=>{K.current=!1,Pe.current+=
1}),[]);let L=E(async()=>{let o=++Pe.current,u=t.current;try{let[f,m,y,_,Se,He,A,ne]=await Promise.all([u.get("/api/chat\
/slots"),u.get("/api/approvals"),u.get("/api/spawn"),u.get("/api/workflows/runs"),u.get("/api/crons"),u.get("/api/artifa\
cts"),u.get("/api/autonudge").catch(()=>({loops:[]})),u.get("/api/crons/history?limit=200").catch(()=>({runs:[]}))]);if(!K.
current||o!==Pe.current)return;B({slots:Array.isArray(f)?f:[],approvals:Array.isArray(m)?m:[],agents:Array.isArray(y.agents)?
y.agents:[],workflows:Array.isArray(_.runs)?_.runs:[],crons:Array.isArray(Se.jobs)?Se.jobs:[],artifacts:Array.isArray(He.
artifacts)?He.artifacts:[],loops:Array.isArray(A?.loops)?A.loops:[]}),Hn(Array.isArray(ne?.runs)?ne.runs:[]),tt(null)}catch(f){
K.current&&o===Pe.current&&tt(f instanceof Error?f:new Error("Unable to load Crew Manager sources"))}finally{K.current&&
o===Pe.current&&$t(!1)}},[]);G(()=>{L();let o=window.setInterval(()=>{L()},rs);return()=>window.clearInterval(o)},[L]);let Qn=()=>{
$t(!0),tt(null),L()};G(()=>{if(!R||ee.current==="unsupported"||ee.current==="disabled")return;let o=yn(R.slots,Ce).filter(
f=>ie.current.get(f.key)!==yt(f));if(o.length===0)return;let u=!1;return(async()=>{let{summaries:f,support:m}=await kn(o,
y=>t.current.get(y));if(!(u||!K.current)&&(ee.current=m,ae(m),m==="available")){for(let y of o)f[y.key]&&ie.current.set(
y.key,yt(y));U(y=>({...y,...f}))}})(),()=>{u=!0}},[R]),G(()=>{if(!R||!Lt.current)return;let o=!1;return(async()=>{try{let u=await t.
current.get("/api/apps/crew-manager/stalls");if(o||!K.current)return;let f={};for(let y of u?.stalls??[])y?.key&&(f[y.key]=
y);Ke(f);let m={};for(let y of u?.error_loops??[])y?.key&&(m[y.key]=y);At(m)}catch{Lt.current=!1,K.current&&(Ke({}),At({}))}})(),
()=>{o=!0}},[R]),G(()=>{let o=!1;return(async()=>{try{let u=await t.current.get("/api/apps/crew-manager/initiatives");if(o||
!K.current)return;be((u?.initiatives??[]).filter(f=>f?.name))}catch{}})(),()=>{o=!0}},[]);let Mt=P(()=>rn(un(R??{slots:[],
approvals:[],agents:[],workflows:[],crons:[],artifacts:[],loops:[]},J,T,qe,Wt,O),me),[R,T,qe,Wt,me,O]),Ve=P(()=>ln(Mt,he,
b),[Mt,he,b]),C=P(()=>Ve.items.filter(o=>dn(o)),[Ve]),ot=P(()=>ht(C),[C]),Tt=P(()=>{let o={};for(let u of C){if(u.state!==
"done"||!u.sessionKey)continue;let f=o[u.sessionKey];f?f.push(u.title):o[u.sessionKey]=[u.title]}return o},[C]),te=P(()=>C.
find(o=>o.id===g)??null,[C,g]),Me=P(()=>i==="all"?C:C.filter(o=>o.state===i),[i,C]),st=P(()=>{let o={all:0,failing:0,running:0,
merged:0};for(let u of bt(C,"pr")){if(!u.changeRef)continue;o.all++;let f=gt(u.changeRef,v[u.changeRef.url??""]);f!=="ot\
her"&&o[f]++}return o},[C,v]);G(()=>{let o=new Set;for(let f of C)for(let m of f.references)m.kind==="change"&&m.url&&/github\.com\/.+\/pull\//.
test(m.url)&&o.add(m.url);let u=!1;for(let f of o)v[f]||t.current.get(`/pr-checks?url=${encodeURIComponent(f)}`).then(m=>{
!u&&K.current&&r(y=>({...y,[f]:m}))}).catch(()=>{});return()=>{u=!0}},[C,v]),G(()=>n(ot["needs-you"]),[ot,n]),G(()=>{g&&
!C.some(o=>o.id===g)&&h(null)},[C,g]),G(()=>{Q(Wn,d)},[d]),G(()=>{Q(Cn,Ze)},[Ze]);let Ot=se(null);G(()=>{if(!et)return;let o=f=>{
let m=Ot.current?.getBoundingClientRect();if(!m||m.width===0)return;let y=(f.clientX-m.left)/m.width*100;Bt(Math.max(ns,
Math.min(os,y)))},u=()=>Kt(!1);return window.addEventListener("mousemove",o),window.addEventListener("mouseup",u),()=>{window.
removeEventListener("mousemove",o),window.removeEventListener("mouseup",u)}},[et]);let rt=R?.slots.find(o=>o.key===Ce),Zn=!!(rt||
Jn);G(()=>{!R||rt||nt.current||(nt.current=!0,e.post("/api/chat/slots",{name:Ce,title:"Conductor"}).then(()=>{K.current&&
(Xn(!0),L())}).catch(o=>{K.current&&(nt.current=!1,de(o instanceof Error?`Conductor session could not be created: ${o.message}`:
"Conductor session could not be created"))}))},[e,rt,L,R]);let zt=P(()=>en(R?.approvals??[],le,o=>C.find(u=>u.sessionKey===
o)?.title??R?.slots?.find(u=>u.key===o)?.title??o),[C,R,le]),ye=te&&!te.permissionId?te:null,Te=P(()=>hn(C,V,O),[C,V,O]),
Y=P(()=>{if(!Ue)return null;for(let o of Te){let u=o.blocks.find(f=>f.key===Ue);if(u&&u.items.length>0)return u}return null},
[Ue,Te]),z=Y?wn(Y.items):null,at=P(()=>{let o=(R?.loops??[]).filter(m=>m&&m.active!==!1&&m.slot_key);if(o.length===0)return[];
let u=new Map,f=new Map;for(let m of C)for(let y of m.references)y.kind!=="session"||!y.id||y.label&&!u.has(y.id)&&u.set(
y.id,y.label);for(let m of Te)if(m.name)for(let y of m.blocks)for(let _ of y.items)_.sessionKey&&!f.has(_.sessionKey)&&f.
set(_.sessionKey,m.name);return o.map(m=>{let y=Number(m.cycle_count)||0,_=Number(m.max_cycles)||0;return{key:m.slot_key,
title:u.get(m.slot_key)??m.slot_key,goalName:f.get(m.slot_key)??null,progress:_>0?`${y}/${_}`:`${y} ${y===1?"cycle":"cyc\
les"}`,remaining:_>0?Math.max(0,_-y):null,instruction:(m.message??"").replace(/\s+/g," ").trim(),lastFire:$(m.last_fire_ts)}})},
[R,C,Te]),ke=P(()=>{let o=new Date;o.setHours(0,0,0,0);let u=o.getTime(),f=u+864e5,m=R?.crons??[],y=new Map;for(let A of Qe){
let ne=$(A.started_at);if(!A.job_id||ne<u||ne>=f)continue;let X=y.get(A.job_id)??{count:0,failed:0,last:0};X.count+=1,A.
status&&A.status!=="success"&&(X.failed+=1),X.last=Math.max(X.last,ne),y.set(A.job_id,X)}let _=m.map(A=>{let ne=y.get(A.
id),X=$(A.next_run_ts),po=X>=u&&X<f;return{job:A,ran:ne,next:X,dueToday:po}}).filter(A=>A.ran||A.dueToday||A.job.is_running),
Se=_.filter(A=>A.ran&&A.ran.failed===0).length,He=_.filter(A=>A.ran&&A.ran.failed>0).length;return{rows:_,done:Se,failed:He,
total:_.length,historyKnown:Qe.length>0}},[R,Qe]),[eo,Dt]=N(!1),to=P(()=>{if(d!=="goal")return[];let o=fn(R?.slots??[],V),
u=mn(C,V),f=new Set,m=[];for(let y of[...u,...o])f.has(y.name.toLowerCase())||(f.add(y.name.toLowerCase()),m.push(y));return m.
sort((y,_)=>_.sessions-y.sessions)},[d,R,C,V]),no=E(async(o,u=[])=>{if(o.trim()){Dt(!0);try{let f=await t.current.post("\
/api/apps/crew-manager/initiatives",{name:o.trim(),aliases:u});K.current&&f?.initiatives&&be(f.initiatives.filter(m=>m?.
name))}catch{}finally{K.current&&Dt(!1)}}},[]),ce=E(async(o,u)=>{if(!q){Ee(o),de(null);try{await t.current.post(`/api/ap\
provals/${encodeURIComponent(o)}/${u?"approve":"reject"}`,{}),L()}catch(f){de(f instanceof Error?`Could not answer that \
request: ${f.message}`:"Could not answer that request"),L()}finally{K.current&&Ee(null)}}},[L,q]),oo=E(o=>{Ge(u=>{let f=Object.
fromEntries(Object.entries(u).filter(([,m])=>m>Date.now()));return f[o]=Date.now()+an,Q(kt,f),f}),h(null)},[]),so=E((o,u)=>{
I(f=>{let m={...f,[o]:u};return Q(Nn,m),m}),h(null)},[]),ro=E(()=>{Ge({}),Q(kt,{})},[]),ao=E(o=>{j(u=>{let f={merged:u.merged.
filter(m=>!o.includes(m)),split:[...new Set([...u.split,...o])]};return Q(vt,f),f})},[]),io=E(o=>{j(u=>{let f={merged:[...new Set(
[...u.merged,o])],split:u.split.filter(m=>m!==o)};return Q(vt,f),f})},[]),lo=E(()=>{Vn(o=>(Q(Rn,!o),!o))},[]),ve=E(async o=>{
if(!F){we(o),de(null);try{await t.current.post(o,{}),L()}catch(u){de(u instanceof Error?`Could not re-run it: ${u.message}`:
"Could not re-run it"),L()}finally{K.current&&we(null)}}},[L,F]),Oe=E(async o=>{if(!H){Fe(o),de(null);try{await t.current.
del(o),k("Stopped the monitor loop. Re-arming it is done from the session itself."),L()}catch(u){let f=u instanceof Error?
u.message:"";/404|not found/i.test(f)?k("That loop had already stopped."):de(f?`Could not stop it: ${f}`:"Could not stop\
 it"),L()}finally{K.current&&Fe(null)}}},[L,H]),ue=E(async o=>{if(Y&&z?.sessionKey){let f=z.sessionKey,m=Y.items.map(_=>`\
- ${_.references.find(Se=>Se.kind==="session")?.label??_.sessionKey}: ${Ae[_.state]}`).join(`
`);if(await t.current.post(`/api/chat/slots/${encodeURIComponent(f)}/context`,{content:[`Crew Manager: this instruction \
concerns the goal "${Y.items[0].title}", which spans sessions:`,m,"You are the session actively on it, so the instructio\
n is routed to you. Do not duplicate work already done in the other sessions."].join(`
`),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:f}).catch(_=>{if(!(_ instanceof
SyntaxError))throw _}),!K.current)return;Le(_=>({..._,[z.id]:Date.now()})),$e(_=>_.includes(f)?_:[..._,f]);let y=z.references.
find(_=>_.kind==="session")?.label??z.title;k(z.moving||z.state==="running"?`Sent to ${y} \u2014 the active session on this g\
oal`:`Sent to ${y} \u2014 resuming the last session on this goal`),je(null),L();return}let u=te&&!te.permissionId?te:null;
if(u?.sessionKey){let f=u.sessionKey;if(await t.current.post("/api/chat",{message:o,slot:f}).catch(m=>{if(!(m instanceof
SyntaxError))throw m}),!K.current)return;Le(m=>({...m,[u.id]:Date.now()})),$e(m=>m.includes(f)?m:[...m,f]),k(`Sent new i\
nstructions to ${u.title}`),h(null),L();return}await t.current.post(`/api/chat/slots/${encodeURIComponent(Ce)}/context`,
{content:ys(te,C),source:"crew-manager",ephemeral:!0}).catch(()=>{}),await t.current.post("/api/chat",{message:o,slot:Ce}).
catch(f=>{if(!(f instanceof SyntaxError))throw f})},[te,Y,z,C,L]),it={"needs-you":Me.filter(o=>o.state==="needs-you"),running:Me.
filter(o=>o.state==="running"),done:Me.filter(o=>o.state==="done")},co=E((o,u)=>{Un(f=>{let m={...f,[o]:u};return Q(In,m),
m})},[]),uo=E(o=>{je(u=>u===o?null:o),h(null),k(null)},[]),xe=o=>s(`/chat?sid=${encodeURIComponent(o)}`),_e=o=>{h(u=>u===
o.id?null:o.id),je(null),k(null)};return p("div",{className:"ow-root","data-crew-manager-shell":"quiet-split",children:[
a("style",{children:vn}),a(ts,{title:"Crew Manager",subtitle:"See what needs your input, what is still running, and what\
 finished recently."}),a("div",{className:"ow-body",children:p("div",{className:"ow-layout",ref:Ot,children:[p("div",{className:"\
ow-main",style:{flexBasis:`${Ze}%`},children:[p("section",{className:"ow-card ow-listcard","aria-label":"Work",children:[
p("div",{className:"ow-listcard-head",children:[a("div",{className:"ow-tabs",role:"tablist","aria-label":"View",children:[
"goal","session"].map(o=>a(M,{role:"tab","aria-selected":d===o,"data-selected":d===o,className:"ow-tab",onClick:()=>c(o),
children:o==="goal"?"Goals":"Sessions"},o))}),p("div",{className:"ow-listcard-tools",children:[a("p",{className:"ow-list\
card-sub",children:d==="goal"?"Sessions consolidated by the goal or topic they share":"Grouped by what each session need\
s from you"}),d==="session"&&a("div",{className:"ow-filters",role:"group","aria-label":"Filter by state",children:Object.
keys(xt).map(o=>p(M,{onClick:()=>l(o),"aria-pressed":i===o,"data-selected":i===o,className:"ow-filter",children:[xt[o],a(
"span",{className:"ow-count",children:ot[o]})]},o))})]})]}),a("main",{className:"ow-work",children:a("div",{className:"o\
w-work-inner",children:Yn?a(_n,{rows:7}):Et&&!R?a(Sn,{icon:a(Tn,{className:"ow-icon"}),title:"Crew Manager could not loa\
d the work view",subtitle:Et.message,action:a(M,{onClick:Qn,children:"Try again"})}):(d==="goal"?C.length===0:Me.length===
0)?a(Sn,{icon:a(Vo,{className:"ow-icon"}),title:"No matching work",subtitle:d==="goal"?"No sessions are running yet.":"C\
hange the filter to see sessions in another state."}):d==="goal"?a(We,{title:"Work by goal",subtitle:"The same job acros\
s sessions, merged into one card",items:C,selectedId:g,onSelect:_e,onOpenSession:xe,onAnswerPermission:(o,u)=>{ce(o,u)},
permissionBusy:q!==null,onRetry:o=>{ve(o)},retryBusy:F!==null,onPickStep:o=>{ue(o)},groupBy:d,goalVerdicts:O,onSplitGoal:ao,
onMergeGoal:io,initiativeBlocks:Te,collapsedInitiatives:Gn,onToggleInitiative:co,selectedGoalKey:Ue,onSelectGoal:uo,footer:a(
ds,{candidates:to,prominent:V.length===0,busy:eo,onAdd:(o,u)=>{no(o,u)}}),emptyLabel:"No matching work"}):i==="all"?p(Be,
{children:[a(We,{title:"Needs you",subtitle:"Waiting on a decision or reply from you",items:it["needs-you"],doneBySession:Tt,
selectedId:g,onSelect:_e,onSnooze:oo,onHandled:so,footer:Ve.snoozedCount>0?p("button",{type:"button",className:"ow-aside\
-note",onClick:ro,children:[Ve.snoozedCount," set aside for later \u2014 bring back"]}):void 0,onOpenSession:xe,onAnswerPermission:(o,u)=>{
ce(o,u)},permissionBusy:q!==null,onRetry:o=>{ve(o)},retryBusy:F!==null,onStop:o=>{Oe(o)},stopBusy:H!==null,onPickStep:o=>{
ue(o)},groupBy:d,emptyLabel:"Nothing needs your input right now."}),a(We,{title:"In progress",subtitle:"Being worked on \
right now",items:it.running,doneBySession:Tt,selectedId:g,onSelect:_e,onOpenSession:xe,onAnswerPermission:(o,u)=>{ce(o,u)},
permissionBusy:q!==null,onRetry:o=>{ve(o)},retryBusy:F!==null,onStop:o=>{Oe(o)},stopBusy:H!==null,onPickStep:o=>{ue(o)},
groupBy:d,emptyLabel:"Nothing is in progress right now."}),a(We,{title:"Done recently",subtitle:"Finished in the last fe\
w days",items:it.done,selectedId:g,onSelect:_e,collapsed:jn,onToggleCollapsed:lo,onOpenSession:xe,onAnswerPermission:(o,u)=>{
ce(o,u)},permissionBusy:q!==null,onRetry:o=>{ve(o)},retryBusy:F!==null,onStop:o=>{Oe(o)},stopBusy:H!==null,onPickStep:o=>{
ue(o)},groupBy:d,emptyLabel:"No recent completed work."})]}):a(We,{title:xt[i],items:Me,selectedId:g,onSelect:_e,onOpenSession:xe,
onAnswerPermission:(o,u)=>{ce(o,u)},permissionBusy:q!==null,onRetry:o=>{ve(o)},retryBusy:F!==null,onStop:o=>{Oe(o)},stopBusy:H!==
null,onPickStep:o=>{ue(o)},groupBy:d,emptyLabel:"No matching work"})})})]}),p("div",{className:"ow-stack",children:[p("d\
etails",{className:"ow-card ow-stack-card",children:[p("summary",{children:[p("span",{className:"ow-stack-title",children:[
a(re,{className:"ow-icon ow-stack-chevron"}),a(Rt,{className:"ow-icon"}),"PRs"]}),p(D,{variant:"muted",children:[st.all,
" open"]})]}),a("p",{className:"ow-stack-sub",children:"Open pull requests your work touches"}),a("div",{className:"ow-s\
tack-body",children:st.all===0?a("p",{className:"ow-stack-empty",children:"No work is linked to a PR right now. Work lin\
ks to one when a session mentions its URL."}):p(Be,{children:[a("div",{className:"ow-filters",role:"group","aria-label":"\
Filter by PR status",children:Object.keys(Kn).map(o=>p(M,{onClick:()=>S(o),"aria-pressed":w===o,"data-selected":w===o,className:"\
ow-filter",children:[Kn[o],a("span",{className:"ow-count",children:st[o]})]},o))}),a(We,{title:"Work by PR",items:C,prChecks:v,
prFilter:w,selectedId:g,onSelect:_e,onOpenSession:xe,onAnswerPermission:(o,u)=>{ce(o,u)},permissionBusy:q!==null,onRetry:o=>{
ve(o)},retryBusy:F!==null,onStop:o=>{Oe(o)},stopBusy:H!==null,onPickStep:o=>{ue(o)},groupBy:"pr",emptyLabel:"No PR match\
es that status."})]})})]}),p("details",{className:"ow-card ow-stack-card",children:[p("summary",{children:[p("span",{className:"\
ow-stack-title",children:[a(re,{className:"ow-icon ow-stack-chevron"}),a(qn,{className:"ow-icon"}),"Loops"]}),a(D,{variant:"\
muted",children:at.length})]}),a("p",{className:"ow-stack-sub",children:"Sessions repeating a goal until it is done"}),a(
"div",{className:"ow-stack-body",children:at.length===0?a("p",{className:"ow-stack-empty",children:"No loop is running r\
ight now."}):at.map(o=>{let u=ss(o.lastFire),f=[u&&`last tick ${u}`,o.remaining!==null&&`${o.remaining} remaining`].filter(
Boolean).join(" \xB7 ");return p("div",{className:"ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:"\
var(--warn)"}}),p("div",{children:[p("div",{className:"ow-mini-title",children:[o.goalName??o.title,a("span",{className:"\
ow-mini-chip",children:o.progress})]}),o.instruction&&a("div",{className:"ow-mini-desc",title:o.instruction,children:o.instruction}),
f&&a("div",{className:"ow-mini-when",children:f})]}),a(D,{variant:"ok",children:"Active"})]},o.key)})})]}),p("details",{
className:"ow-card ow-stack-card",children:[p("summary",{children:[p("span",{className:"ow-stack-title",children:[a(re,{
className:"ow-icon ow-stack-chevron"}),a(Dn,{className:"ow-icon"}),"Scheduled tasks"]}),p(D,{variant:ke.failed>0?"err":"\
muted",children:[ke.done,"/",ke.total," today"]})]}),a("p",{className:"ow-stack-sub",children:ke.historyKnown?"Today's r\
uns only \u2014 jobs with nothing scheduled today are hidden":"Run history is unavailable, so completed counts may be lo\
w"}),a("div",{className:"ow-stack-body",children:ke.rows.length===0?a("p",{className:"ow-stack-empty",children:"Nothing \
is scheduled for today."}):ke.rows.map(({job:o,ran:u,next:f,dueToday:m})=>{let y=!!(u&&u.failed>0),_=[u&&`ran today ${Bn(
u.last)}${u.count>1?` (${u.count}x)`:""}`,m&&f?`next ${Bn(f)}`:null].filter(Boolean).join(" \xB7 ");return p("div",{className:"\
ow-mini",children:[a("span",{className:"ow-mini-rail",style:{background:y?"var(--danger)":o.enabled===!1?"var(--muted)":
"var(--warn)"}}),p("div",{children:[a("div",{className:"ow-mini-title",children:o.name}),o.schedule&&p("div",{className:"\
ow-mini-desc",children:[o.schedule,o.cron_expr&&a("span",{className:"ow-mini-chip",children:o.cron_expr})]}),_&&a("div",
{className:"ow-mini-when",children:_})]}),o.is_running?a(D,{variant:"aim",children:"Running"}):y?a(D,{variant:"err",children:"\
Failed"}):o.enabled===!1?a(D,{variant:"muted",children:"Paused"}):u?a(D,{variant:"ok",children:"Success"}):a(D,{variant:"\
warn",children:"Pending"})]},o.id)})})]})]})]}),a("button",{type:"button",className:"ow-resizer","aria-label":"Resize co\
lumns","data-dragging":et?"true":void 0,onMouseDown:o=>{o.preventDefault(),Kt(!0)},onDoubleClick:()=>Bt(An)}),p("aside",
{className:"ow-conductor","aria-label":"Conductor",children:[a("div",{className:"ow-conductor-header",children:p("div",{
className:"ow-conductor-title",children:[a("h2",{children:"Conductor"}),!ye&&a("span",{className:"ow-conductor-sub",children:"\
select work, or ask across all"})]})}),a("div",{className:"ow-chat",children:Zn?p("div",{className:"ow-chat-panel",children:[
zt.length>0&&a("div",{className:"ow-permissions",role:"alert",children:zt.map(o=>a(Fn,{tool:o.tool,purpose:o.purpose,where:o.
sessionLabel,busy:q!==null,onAnswer:u=>{ce(o.id,u)}},o.id))}),W&&p("div",{className:"ow-conductor-receipt",role:"status",
children:[a(zn,{className:"ow-icon"}),W]}),Pt&&a("div",{className:"ow-chat-error",role:"alert",children:Pt}),a("div",{className:"\
ow-embed",children:a(Zo,{slotKey:Ce,frameless:!0,startAtBottom:!0,placeholder:Y?"Instruction for this goal\u2026":ye?.sessionKey?
"New instructions for this session\u2026":"Ask across your work\u2026",onSend:ue})}),Y&&z?p("div",{className:"ow-quote o\
w-quote-docked",children:[p("div",{className:"ow-quote-body ow-quote-goal",children:[p("div",{className:"ow-quote-line",
children:[a("span",{className:"ow-eyebrow",children:"Instructing goal"}),a("span",{className:"ow-quote-title",title:Y.items[0].
title,children:Y.items[0].title})]}),p("span",{className:"ow-quote-route ow-truncate",children:["\u2192 ",z.references.find(
o=>o.kind==="session")?.label??z.title,z.moving||z.state==="running"?" (active)":" (will resume)"]})]}),a(M,{className:"\
ow-quote-clear","aria-label":"Remove the quoted goal",onClick:()=>{je(null),k(null)},children:"Clear"})]}):ye&&p("div",{
className:"ow-quote ow-quote-docked",children:[p("div",{className:"ow-quote-body",children:[a("span",{className:"ow-eyeb\
row",children:ye.sessionKey?"Instructing":"Quoted"}),a("span",{className:"ow-quote-title",title:ye.title,children:ye.title})]}),
a(M,{className:"ow-quote-clear","aria-label":"Remove the quoted work item",onClick:()=>{h(null),k(null)},children:"Clear"})]})]}):
a("div",{className:"ow-chat-loading",children:a(_n,{rows:4})})})]})]})})]})}export{ks as default};
