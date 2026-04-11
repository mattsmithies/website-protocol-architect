---
title: "Why auditability is a systems problem, not a logging problem"
category: "Auditability"
order: 3
---

Teams often confuse auditability with logging. They add log lines, store events in a database, and assume the system is auditable. It is not. Logging records what happened. Auditability proves what happened, to whom, under what authority, and whether it was legitimate.

Real auditability requires intentional architecture: event sourcing where state is derived from an immutable sequence of facts. Separation of the system of record from derived views. Designed-in replayability where any state can be reconstructed from its history. Without these, your logs are just text files that nobody trusts when it matters.

The gap between logging and auditability is the gap between recording noise and preserving evidence. One is a feature. The other is an architectural property that must be designed in from the start.
