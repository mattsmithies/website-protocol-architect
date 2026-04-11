---
title: "Designing for replayability"
category: "Architecture"
order: 7
---

If you cannot reconstruct how a system reached its current state, you cannot audit it, you cannot debug it, and you cannot trust it. Replayability is not a feature you add later. It is an architectural property that shapes every design decision from the start.

This means treating events as the source of truth, not database rows. It means separating the system of record from derived views so that current state can always be rebuilt from first principles. It means accepting that storage is cheap but trust is expensive, and that the ability to prove what happened is worth more than the ability to query what exists now.

Systems designed for replayability are systems that can survive an audit, a dispute, a regulatory inquiry, or a catastrophic failure. Systems designed without it are systems that hope none of those things ever happen.
