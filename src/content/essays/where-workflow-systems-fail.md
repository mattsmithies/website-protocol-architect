---
title: "Where workflow systems fail"
category: "Workflow"
order: 4
summary: "Workflow systems fail when they model sequence instead of the truth conditions that make a process valid under pressure."
---

Most workflow engines model the happy path well. Step one, step two, step three, done. But real workflows involve exceptions, partial completion, authority changes mid-process, evidence requirements that vary by context, and rollback conditions that nobody anticipated at design time.

The failure mode is always the same: the workflow engine cannot express what actually needs to happen, so humans work around it. They email approvals. They skip steps and backfill later. They create shadow processes that the system does not know about. At that point, the workflow engine is not modelling the workflow — it is modelling a fantasy that the real process has already abandoned.

Designing workflow systems that hold under pressure means modelling exceptions as first-class states, not error conditions. It means making evidence binding explicit at every step. It means designing for the process as it actually is, not as a product manager imagined it might be.
