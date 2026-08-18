# Crew Manager

> Product spec, as supplied by the product owner. Kept verbatim so every audit can
> quote it rather than paraphrase it. `docs/audit.md` is the line-by-line
> assessment against this text.

## The situation

A developer using Kiro Crew can run a session per task, hand work to subagents, run a workflow with quality gates, and put recurring jobs on a schedule they create, reachable from the desktop app, the web dashboard, Slack, Telegram, WeCom, and the CLI. Each of those surfaces reports the state of the thing it owns, and the dashboard already shows whether a session is working, idle, or waiting on approval, with a notification when a task needs a decision. That reporting is accurate and it holds up while two or three sessions are running.

Past that it stops helping in a specific way. Four sessions waiting on approvals arrive as four equal signals, and nothing says which one holds up a release or has another session queued behind it. A session that stopped because it needs a decision looks the same as one that quietly gave up, and finding out which means opening it and reading back through what happened. Work gets repeated because nothing checks whether this issue was already investigated last week. The developer becomes the thing that polls, cycling through sessions to find the one that needs them, and the cost of that polling rises with every agent added. Adding agents currently adds supervision about as fast as it adds output, which is the opposite of the trade the product is supposed to offer.

## What we are building

One place that answers what needs you and what everything is doing, and that you can ask questions of. Crew Manager reasons across every session at once rather than reporting on each one, so it can order what is waiting on you, explain why something stopped, and tell you when work has been done before.

Ordering is the core of it. Everything waiting on the developer lands in one list where position comes from what the block actually costs. Something only a person can clear, where other work is queued behind it, comes before something that has merely gone quiet, and within any group the thing that has been stuck longest comes first. The order is derived from the current state of the fleet rather than assigned when a session parked, so it changes as circumstances change and an item can always say in one sentence why it is where it is. That last property is what makes the list worth trusting instead of scanning.

Alongside the list, the same view answers what everything is doing, including work that is healthy and needs nothing. Each item shows what it is working on, the issue behind it, whether its checks are passing, and a way into the session. This is what makes the experience feel like a place you check rather than an alarm that fires.

Each stalled item carries a short explanation of why it stopped, so the developer decides from the list instead of opening a session to find out. Before new work starts, the Manager says whether comparable work has been done, naming the earlier session and what came of it, as advice rather than a gate.

And it is something you talk to. Asking what needs attention, what everything is doing, or whether we have solved this before is a conversation with its own history rather than a search box, and it answers from the same understanding the list is built on, so the two never disagree.

## The experience in use

Coming back to it. A developer opens the tab after a couple of hours away. The first item says a session is waiting on approval to run a migration and that a second session is blocked behind it. The second says a session has been quiet for forty minutes after repeated permission errors. The third says a session finished and is waiting on a decision about its output. Everything else appears below as work in progress with its issues and check status. Three decisions get made in about a minute, and nothing was opened to figure out what was being asked.

Being pulled instead of polling. The developer is writing code and not looking at the tab. A session parks on an approval that a release depends on, and the notification arrives where they already are, carrying the reason and the approve action, so the decision happens without a context switch into the dashboard.

Not redoing the work. A developer starts a session on a flaky test. The Manager notes that a session three days ago touched the same test and concluded the flake came from a shared fixture, and links it. The developer reads the earlier conclusion and starts from there rather than from nothing. If they want to investigate again anyway, nothing stops them.

Asking rather than reading. Before a meeting the developer asks what is in flight and gets a short answer covering what is running, what is blocked and on whom, and what finished overnight. The answer comes from the same state the list renders, so it is not a second version of the truth.

## Requirements

**Order what needs the developer.** Everything waiting on a person appears in one list whose position is derived from the current state of the fleet rather than assigned when a session parked. A block only a person can clear, with other work queued behind it, outranks a session that has gone quiet, and within any group the longest-stalled comes first. Every item can state in one sentence why it is where it is, and the order updates as circumstances change rather than as new events arrive.

**Explain why work stopped.** Each stalled item carries a short reason, so a developer decides from the list instead of opening a session to find out what is being asked. A reason is written once per stall rather than repeated while the session stays stuck.

**Answer what everything is doing.** Alongside the list, the same view covers work that is healthy and needs nothing, with what each session is working on, the issue behind it, whether its checks are passing, and a way into the session. A session with no linked issue or no checks appears without those fields rather than with blanks.

**Know whether the work has been done.** Before new work starts, and on request, the Manager says whether comparable work has happened, naming the earlier session, when it ran, and what came of it. Recall is advice and never a gate, so a developer who wants to redo the work proceeds. Duplicates among sessions running right now are caught as well as ones in history.

**Be something you can ask.** Asking what needs attention, what is in flight, or whether this has been solved before is a conversation with its own history rather than a query box, and it answers from the same understanding the list is built on so the two cannot disagree.

**Reach the developer where they already are.** An item that needs a person arrives through the channels the developer has already connected, carrying its reason and the action to take, so a decision does not require opening the dashboard. Nothing is sent to a place they have not configured.

**Keep work moving without taking authority.** Where a session has stalled on a missing fact rather than a missing decision, the Manager supplies the fact and the work continues. Approvals, permissions, anything irreversible, and any question about what the developer actually wants go to the developer. Every action the Manager takes is visible afterward with the reason it was taken, can be undone, and any session can be marked so the Manager reports on it without ever touching it. A session that stalls the same way twice comes to the developer rather than being nudged again.

**Start work in the shape that fits it.** Given a task, the Manager runs it as one session, several parallel sessions, subagents, or a workflow when the work has ordered steps and quality gates, then tracks it and brings the results back attributed to what was asked.

**Propose work and propose schedules.** The Manager surfaces candidate work from connected sources such as issues, product logs, and stale feature flags, and from what it observes across sessions. When a task keeps recurring it proposes a schedule. Every proposal cites where it came from and can be dismissed, and the developer creates the schedule.

**Stay yours in a shared Crew.** The list and the conversation belong to the individual developer even when several people use the same Crew, and work with no clear owner is raised to whoever set it up.

## What it does not do

It does not replace what the dashboard already does well. Per-session state, the sessions list, and workflow views all stay as they are, and the Manager consumes them rather than competing with them.

It does not show other people's work. In a Crew shared by several people the list is yours, because surfacing approvals you cannot answer above ones you can would defeat the ordering, and because what a colleague is working on is not this surface's business. A team view is a later question.

It does not change how you already reach a session from Slack or Telegram. Sending a direct message continues to do exactly what it does today.

## How we know it worked

The measure is not how much the Manager does on its own. It is how rarely a developer has to go looking for something.

Concretely, we expect the time between a session stalling and a developer resolving it to fall, and we expect that fall to hold as the number of concurrent sessions rises, which is the whole claim. We expect developers to act on items from the list rather than navigating to sessions to discover state, so the share of decisions made from the list is worth watching. We expect the top item to be the right one often enough that people trust the order, which shows up as items being handled roughly in the order given rather than skipped. And we expect duplicate work to be caught before it starts often enough to be noticed, which we can count directly.

The failure mode to watch for is a list that is technically correct and practically ignored, which would show up as developers continuing to poll sessions while the tab sits unread. If that happens the problem is ordering quality or explanation quality rather than anything about coverage, and adding more to the view would make it worse rather than better.

## What already exists

A code audit against the repo found meaningful overlap worth crediting rather than rebuilding. The dashboard already derives pending-approval state per slot and renders working, idle, and waiting-on-approval. The local notification bus has five phases shipped, and the notification bridge fans out to Slack, Discord, Telegram, Webex, and WeCom. The orchestrator chat sessions RFC defines an OrchestratorManager with spawn, steer, and ask vocabulary.

The genuine delta is narrower than it first appears. Cross-session attention ranking, stall-triggered detection, a model-written explanation of why a session stopped, and past-work recall.

## Dependencies and impact

Blocks Team Crew, which depends on the Manager as its primary chat interface and to handle the task queue against a configured maximum number of concurrent tasks.

Crew in the Mobile Apps also depends on it, since the Manager's ranked summary is the highest-value screen on a small display.

The half of this that acts on sessions, meaning supplying a missing fact so stalled work continues, is blocked on amending the per-session scope invariant in the orchestrator chat sessions RFC. That invariant is load bearing for its concurrency design, so widening it to fleet scope is a joint decision with zezhexu rather than a unilateral one. Everything that reads and reports carries no such dependency.

## Implementation note

Crew Manager is the product name. The implementation symbol must not be CrewManager, to avoid collision with the existing OrchestratorManager.
