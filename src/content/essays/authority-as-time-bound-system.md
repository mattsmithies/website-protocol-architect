---
title: "Authority as a time-bound system"
category: "Authority"
order: 3
---

Most permission models treat authority as a static property. A user has a role. The role has permissions. The permissions are checked. But this misses the dimension that causes most real-world failures: time.

Authority expires. Delegations have windows. Approvals are valid for a period. A signatory who was authorised last quarter may not be authorised today. If your system cannot express this, it will silently enforce stale authority — and you will not know until an audit finds it.

Treating time as a first-class primitive in authority design means modelling expiration, delegation chains, validity windows, and temporal revocation as system objects, not afterthoughts. The systems that survive real-world pressure are the ones that got this right from the beginning.
