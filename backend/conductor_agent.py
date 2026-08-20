"""Is this app's Conductor agent actually bindable on THIS install?

The frontend cannot answer this. Binding a chat slot to an agent takes a name,
and the create-slot endpoint validates only the charset -- so a name that no
agent answers to passes validation, the slot is created, and the Conductor then
accepts a message and never replies. That failure is indistinguishable from a
broken app, which is why the slot has shipped with no agent at all rather than
with a guess.

Two facts make a runtime check necessary rather than merely tidy.

First, the bindable name is the agent's DECLARED name, not the namespaced one.
``apps/bridges.py`` appends ``<app>/<agent>`` to its *reporting* list and writes
the file as ``<app>--<agent>.json``, but records only the declared name as
dispatchable, with the reason stated inline: kiro-cli enumerates agents by their
``name`` field, so neither the namespaced form nor the filename stem is a name it
can resolve. So the name to bind is exactly what our own spec declares.

Second, registration is CONDITIONAL. An app's agents are materialized only if the
app clears the same execution-admission gate that lets its Python run at all --
builtin, or an explicit per-app trust grant, or a blanket third-party allowance.
On an install without that trust the agent is never written, and every name is
wrong. The app cannot assume its own agent exists just because it shipped one.

So this module asks the filesystem the platform writes to, and the frontend binds
only on a positive answer. A negative answer is not an error: the Conductor still
works on the default agent, exactly as it does today, just without the manager
role. Degrading to a working generic Conductor beats binding a dead one.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

#: The name our own agent spec declares, and therefore the only name a session
#: can bind. Kept as a literal rather than read from agents/*.json because this
#: must state what the FRONTEND will send; a test asserts the two agree, so a
#: rename that touches only the spec fails the suite instead of silently
#: producing a slot bound to a name nothing answers to.
CONDUCTOR_AGENT = "crew-manager-conductor"

#: Written by the platform as ``<app>--<agent>.json`` under the kiro agents dir.
_LINK_NAME = f"crew-manager--{CONDUCTOR_AGENT}.json"


def _agents_dir() -> Path:
    """Where the platform materializes agent configs.

    ``KIRO_HOME`` is honoured because the test harness and a pod install both
    relocate it; without that this module would read the developer's real agent
    dir while under test.
    """
    home = os.environ.get("KIRO_HOME")
    base = Path(home) if home else Path.home() / ".kiro"
    return base / "agents"


def _declared_name(path: Path) -> str | None:
    """The ``name`` field of a materialized agent config, or None.

    The file is the platform's own output, but it is still parsed defensively:
    a half-written or hand-edited config must read as "not available" rather
    than raise inside a route.
    """
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.debug("crew-manager: unreadable agent config %s: %s", path, exc)
        return None
    if not isinstance(data, dict):
        return None
    name = data.get("name")
    return name if isinstance(name, str) and name else None


def conductor_agent() -> dict[str, Any]:
    """Whether the Conductor agent is registered, and the name to bind.

    Never raises. ``available: False`` always carries a reason, because the
    difference between "this install does not trust app agents" and "the file is
    corrupt" is the difference between a settings change and a bug report.
    """
    path = _agents_dir() / _LINK_NAME
    if not path.is_file():
        return {
            "available": False,
            "reason": "agent not registered on this install",
            "agent": None,
        }
    declared = _declared_name(path)
    if declared is None:
        return {
            "available": False,
            "reason": "agent config is unreadable",
            "agent": None,
        }
    # The registered file must actually declare the name we are about to bind.
    # If a future rename lands in the spec but not here (or vice versa) this is
    # the check that refuses instead of handing the frontend a dead name.
    if declared != CONDUCTOR_AGENT:
        return {
            "available": False,
            "reason": f"registered agent declares {declared!r}, not {CONDUCTOR_AGENT!r}",
            "agent": None,
        }
    return {"available": True, "agent": CONDUCTOR_AGENT}
