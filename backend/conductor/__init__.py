"""The Conductor: a deterministic control loop that pursues operator goals.

Fifteen modules, one rule about how they see each other: the three that encode
the *contract* — :mod:`intents` (the vocabulary), :mod:`store` (durability) and
:mod:`policy` (authority) — are pure, stdlib-only, and import nothing from the
gateway, so they are re-exported here eagerly. Everything above them is reached
through :func:`__getattr__`.

Lazy submodules are not tidiness. ``import conductor.intents`` runs this file,
and an eager ``from . import loop`` here would mean that reading ``Tier.OFF`` —
which the dashboard's own route layer does — drags in the judge, the executor,
the observer and the whole step table. Two costs follow from that, and the
second is the one that matters:

* every consumer pays the whole package's import time to touch one enum;
* a module that fails to import (a gateway that moved a private symbol, an
  ``aiohttp`` that is not installed) takes the authority table down with it.
  House rule 3 says the app must still load its UI on a gateway that moved a
  symbol; that promise is worth very little if ``conductor/__init__.py`` is the
  thing that breaks first.

Rejected alternative: re-exporting :func:`store.conductor_dir` and
:func:`store.goals_dir` for symmetry with the rest. A name bound *here* is a
second binding, and the offline selftest redirects the data directory by
replacing ``store.conductor_dir`` — a caller who imported the alias would keep
writing into the real ``data/`` tree while every other module wrote into the
temp one, and the test would pass while polluting the repo. Reach those two
through :mod:`store`, always.
"""

from __future__ import annotations

import importlib
from typing import Any

from . import intents, policy, store
from .intents import (
    ACTION_CLASSES,
    DENY_HARD,
    ActionSpec,
    Decision,
    Proposal,
    Reversibility,
    Tier,
    Verdict,
    is_hard_denied,
    spec_for,
    tier_min,
)
from .policy import HALT_MARKER, Mode, effective, marker_name

#: Submodules resolved on first attribute access. Listed explicitly rather than
#: discovered from the directory so that a stray file in this package is not
#: silently part of its public surface.
_LAZY_SUBMODULES: frozenset[str] = frozenset({
    "act",
    "breaker",
    "budget",
    "control",
    "gate",
    "goals",
    "judge",
    "ledger",
    "loop",
    "observe",
    "routes",
    "steps",
})


def __getattr__(name: str) -> Any:
    """Import a submodule on first use (PEP 562), then cache it in globals.

    The cache is what keeps this cheap: after the first touch, attribute lookup
    never reaches this function again.
    """
    if name in _LAZY_SUBMODULES:
        module = importlib.import_module(f".{name}", __name__)
        globals()[name] = module
        return module
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__() -> list[str]:
    return sorted(set(globals()) | _LAZY_SUBMODULES)


__all__ = [
    # the three contract modules, eager
    "intents",
    "policy",
    "store",
    # intents
    "ACTION_CLASSES",
    "DENY_HARD",
    "ActionSpec",
    "Decision",
    "Proposal",
    "Reversibility",
    "Tier",
    "Verdict",
    "is_hard_denied",
    "spec_for",
    "tier_min",
    # policy
    "HALT_MARKER",
    "Mode",
    "effective",
    "marker_name",
    # lazy
    *sorted(_LAZY_SUBMODULES),
]
