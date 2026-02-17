# Submission: Aleksandra Wilk

## Time Spent

Total time: 4h

## Ticket Triage

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

1. **CFG-148**: Investigated crash scenario when deselecting “Include Packaging” (blocker / white screen) — could not reproduce reliably in my environment.
2. **CFG-142**: Fixed incorrect/stale price after rapid option changes (race condition in async pricing).
3. **CFG-156**: Fixed missing/unstable keys in list rendering to improve UI stability.

### Tickets I Deprioritized

List tickets you intentionally skipped and why:

| Ticket  | Reason                 |
| ------- | ---------------------- |
| CFG-148 | Blocker, but I could not reproduce it reliably in my environment within the timebox. Without a consistent repro + stack trace, fixing it would be guesswork and could introduce regressions. |
| CFG-152 | Important (enterprise compliance), but it requires broader UI changes and careful testing. I prioritized revenue/core correctness items first within 4 hours. |
| CFG-147 | Likely related to URL encoding / special characters, but I did not have a concrete failing share link to reproduce and debug efficiently. |
| CFG-143 | This ticket requires proper profiling (Chrome DevTools Performance/Memory and the React DevTools Profiler). Due to the time spent on CFG-148 and then focusing on CFG-142 and CFG-156 within the 4-hour limit, I deprioritized it to avoid a rushed, unverified fix. As a next step, I would record a Performance profile while repeatedly changing options and resizing the window, then check for increasing memory usage (e.g., detached DOM nodes/event listeners) and React commit times to identify the main bottleneck. |
| CFG-151 | UX improvement (user-friendly errors), but not a blocker compared to crash/pricing. Left for later once stability is ensured. |
| CFG-149 |Nice-to-have polish; I focused on fixing correctness first (CFG-142). |
| CFG-150 | Mobile layout issue; lower impact than pricing/reliability. Would address after core flow is stable. |
| CFG-146 | Cosmetic timezone issue; low impact for the demo compared to core flow issues. |
| CFG-154 | Ticket is ambiguous (business rule vs UI copy). Needs product clarification before changing behaviour. |
| CFG-144 | Requires product decision before implementation. |
| CFG-145 | Requires product decision before implementation. |
| CFG-157 | UX improvement, but not critical for the demo and larger to implement/test properly |
| CFG-155 | Nice-to-have feature; not critical within a 4-hour scope. |
| CFG-153 | Large feature (estimated weeks). Out of scope for the 4-hour assignment. |

### Tickets That Need Clarification

List any tickets where you couldn't proceed due to ambiguity:

| Ticket  | Question                  |
| ------- | ------------------------- |
| CFG-144 vs CFG-145 |No design is needed for CFG-144 (it’s removal), but the requirements conflict: remove Quick Add vs improve it. Please confirm the product decision before implementation. |
| CFG-154 | Requirements are unclear and the ticket notes are inconsistent. Waiting for Sarah’s update/confirmation on the intended discount threshold and UI wording. |

---

## Technical Write-Up

### Critical Issues Found

Describe the most important bugs you identified:

#### Issue 1: [Title]

**Ticket(s):** CFG-XXX

**What was the bug?**

[Describe the root cause]

**How did you find it?**

[Your debugging process]

**How did you fix it?**

[Explain your solution]

**Why this approach?**

[Any alternatives you considered]

---

#### Issue 2: [Title]

[Same structure as above]

---

### Other Changes Made

Brief description of any other modifications:

- [Change 1]
- [Change 2]

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

List any issues you noticed but intentionally left:

| Issue   | Why I Left It                                         |
| ------- | ----------------------------------------------------- |
| [Issue] | [Reason - out of scope, time, needs discussion, etc.] |

### Potential Improvements for the Future

If you had more time, what would you improve?

1. [Improvement 1]
2. [Improvement 2]

---

## Questions for the Team

Questions you would ask in a real scenario:

1. [Question 1]
2. [Question 2]

---

## Assumptions Made

List any assumptions you made to proceed:

1. [Assumption 1]
2. [Assumption 2]

---

## Self-Assessment

### What went well?

[Your reflection]

### What was challenging?

[Your reflection]

### What would you do differently with more time?

[Your reflection]

---

## Additional Notes

I used a simple prioritization framework to decide what to work on within the 4-hour timebox:

Hotfix / Blockers first – anything that crashes the app or breaks the critical user flow must be addressed first, because it can completely prevent usage and directly impact revenue.

Revenue & core value next – issues that affect the main purpose of the product (e.g., correct pricing, ability to complete configuration and add to cart) come before cosmetic improvements.

Stability & correctness – fixes that reduce UI inconsistency and prevent subtle rendering issues (e.g., stable React keys, preventing state mismatches) are high value and usually low risk.

Performance investigations – performance/memory issues are important, but they require profiling and time to verify the root cause. I avoid rushed fixes without evidence.

UX polish – improvements like loading indicators or nicer error copy are valuable, but they come after stability and core correctness.

Out of scope / unclear requirements – I deprioritized tasks that were too large for 4 hours (multi-week features) or had conflicting/ambiguous requirements. For example, CFG-144 vs CFG-145 requires a clear product decision (remove Quick Add vs improve it). I documented such cases instead of making risky assumptions.

Anything else you want us to know:

[Your notes]
