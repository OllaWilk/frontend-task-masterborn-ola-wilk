# Submission: Aleksandra Wilk

## Time Spent

Total time: 4h

## Ticket Triage

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

1. **CFG-148**: Investigated crash scenario when deselecting "Include Packaging" (blocker / white screen) — could not reproduce reliably in my environment.
2. **CFG-142**: Fixed incorrect/stale price after rapid option changes (race condition in async pricing).
3. **CFG-156**: Fixed missing/unstable keys in list rendering to improve UI stability.

### Tickets I Deprioritized

List tickets you intentionally skipped and why:

| Ticket  | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CFG-148 | Blocker, but I could not reproduce it reliably in my environment within the timebox. Without a consistent repro + stack trace, fixing it would be guesswork and could introduce regressions.                                                                                                                                                                                                                                                                                                                                   |
| CFG-152 | Important (enterprise compliance), but it requires broader UI changes and careful testing. I prioritized revenue/core correctness items first within 4 hours.                                                                                                                                                                                                                                                                                                                                                                  |
| CFG-147 | Likely related to URL encoding / special characters, but I did not have a concrete failing share link to reproduce and debug efficiently.                                                                                                                                                                                                                                                                                                                                                                                      |
| CFG-143 | This ticket requires proper profiling (Chrome DevTools Performance/Memory and the React DevTools Profiler). Due to the time spent on CFG-148 and then focusing on CFG-142 and CFG-156 within the 4-hour limit, I deprioritized it to avoid a rushed, unverified fix. As a next step, I would record a Performance profile while repeatedly changing options and resizing the window, then check for increasing memory usage (e.g., detached DOM nodes/event listeners) and React commit times to identify the main bottleneck. |
| CFG-151 | UX improvement (user-friendly errors), but not a blocker compared to crash/pricing. Left for later once stability is ensured.                                                                                                                                                                                                                                                                                                                                                                                                  |
| CFG-149 | Nice-to-have polish; I focused on fixing correctness first (CFG-142).                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CFG-150 | Mobile layout issue; lower impact than pricing/reliability. Would address after core flow is stable.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| CFG-146 | Cosmetic timezone issue; low impact for the demo compared to core flow issues.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| CFG-154 | Ticket is ambiguous (business rule vs UI copy). Needs product clarification before changing behaviour.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| CFG-144 | Requires product decision before implementation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| CFG-145 | Requires product decision before implementation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| CFG-157 | UX improvement, but not critical for the demo and larger in scope to implement/test properly                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| CFG-155 | Nice-to-have feature; not critical within a 4-hour scope.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| CFG-153 | Large feature (estimated weeks). Out of scope for the 4-hour assignment.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Tickets That Need Clarification

List any tickets where you couldn't proceed due to ambiguity:

| Ticket             | Question                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CFG-144 vs CFG-145 | No design is needed for CFG-144 (it's removal), but the requirements conflict: remove Quick Add vs improve it. Please confirm the product decision before implementation. |
| CFG-154            | Requirements are unclear and the ticket notes are inconsistent. Waiting for Sarah's update/confirmation on the intended discount threshold and UI wording.                |

---

## Technical Write-Up

### Critical Issues Found

Describe the most important bugs you identified:

#### Issue 1: Incorrect price after rapid option changes

**Ticket(s):** CFG-142

**What was the bug?**

The price updates are asynchronous and can be triggered multiple times during rapid option changes. The hook had a "latest request" guard: it stored `latestRequestRef.current = Date.now()` and only applied the response when `response.timestamp >= latestRequestRef.current`. The API, however, returned `timestamp` as its own internal counter (1, 2, 3…). So the client was comparing **client time** (Date.now()) with **server request ids** (small integers)—different scales and meaning—so the condition was unreliable. Valid responses could be ignored, or an older response could overwrite the newest one, leading to stale or wrong price (e.g. $0.00 or a value for a previous configuration).

**How did you find it?**

I noticed the Total Price was not updating correctly in my environment (often staying at $0.00 or jumping to wrong values). I traced the value from the UI (`formattedTotal` in ProductConfigurator) back to the `usePriceCalculation` hook. Pricing is mocked on the frontend (no real HTTP calls), so there were no requests or responses in the Network tab—I used the DevTools console and temporary logs/breakpoints inside the hook and the mock API to observe the async flow and see when responses were applied or ignored. I compared what the API returns for `timestamp` with what the hook stored in its ref and confirmed the mismatch.

**How did you fix it?**

I fixed the guard entirely on the client: the hook keeps a generation counter and only applies a response if it still belongs to the latest request. No change to the API contract is required.

**What I did:**

- **In the hook only** (`usePriceCalculation.ts`): I use a ref `requestVersionRef` (a counter). At the start of each `fetchPrice` I do `const myVersion = ++requestVersionRef.current` and call `calculatePrice(config, product)` with no third argument. When the response comes back, I update state only when `myVersion === requestVersionRef.current` (same for `setError` and `setIsLoading(false)` in catch/finally). Only the response that still matches the current generation updates the UI; older responses are ignored.
- **api.ts (reverted):** At first I made changes in the API (added optional `clientRequestId` and echoed it in `timestamp`) to fix the race condition. I then noticed that this is a mock of the backend—the response shape is data that comes from the backend—and I shouldn't be changing it. I reverted those API changes and left the API as-is; the fix is client-only (generation counter in the hook).

**Why this approach?**

Debouncing would only reduce the number of calls and could make the UI feel slower. The root cause was that the "latest response" check used incompatible identifiers. Fixing it on the client with a generation counter is minimal, reliable, doesn't delay user feedback, and doesn't require touching the API layer.

---

#### Issue 2: Missing/unstable keys in list rendering

**Ticket(s):** CFG-156

**What was the bug?**

Several lists in `ProductConfigurator` used missing or unstable keys: array index (`key={index}` or `key={i}`) or non-unique values like `addOn.name`. That can cause React reconciliation issues (wrong updates, flicker, inconsistent selection) and triggers React key warnings in the console.

**How did you find it?**

I followed the ticket hints and checked the console for React key warnings, then searched the codebase for `.map(` and inspected what was used as `key` for each list.

**How did you fix it?**

I replaced unstable keys with stable, unique identifiers from the data:

- **Option groups** (select, color, quantity, toggle): already used `key={option.id}` (no change).
- **Color swatches**: `key={index}` → `key={choice.id}`.
- **Add-on checkboxes**: `key={addOn.name}` → `key={addOn.id}`.
- **Price breakdown rows**: `key={i}` → `key={mod.optionId}` for option modifiers and `key={cost.addOnId}` for add-on costs.
- **Validation warnings**: `key={i}` → `key={\`validation-warning-${i}\`}` (no stable id from API, so a composite key to avoid duplicate key warnings).

This removed the React key warnings and makes list updates predictable.

**Why this approach?**

Stable, unique keys are the recommended React pattern and a low-risk change. They prevent subtle reconciliation bugs and improve maintainability without changing business logic.

---

### Other Changes Made

Brief description of any other modifications:

- None. All changes are confined to CFG-142 (hook only; api.ts was not changed—see note above on reverting api.ts) and CFG-156 (ProductConfigurator keys). Formatting/whitespace changes (e.g. in `usePriceCalculation.ts` and `ProductConfigurator.tsx`) were kept minimal and do not affect behaviour.

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

List any issues you noticed but intentionally left:

| Issue                                                                                                                                                                                                                                        | Why I Left It                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Preview image does not reflect the selected color (image stays the same / looks static). When I change the color option, the preview area still shows the same placeholder image, so the UI does not clearly confirm the selection visually. | Out of scope for the assigned tickets. Without defined requirements I didn't want to implement speculative behaviour. |

### Potential Improvements for the Future

If you had more time, what would you improve?

1. Add unit tests (e.g. in Jest) for the pricing flow (`usePriceCalculation`), especially for async race conditions and the "latest response only" behaviour, to prevent regressions.

---

## Questions for the Team

Questions you would ask in a real scenario:

1. —

---

## Assumptions Made

List any assumptions you made to proceed:

1. I intentionally focused only on the backlog items listed in TICKETS.md. Since this is a time-boxed recruitment task, I assumed the evaluation is based on how I prioritize and deliver requested fixes, not on adding extra features or speculative improvements outside the defined scope.

---

## Self-Assessment

### What went well?

I’m happy with how I debugged the code and how quickly I was able to locate the problem areas. I used the browser DevTools (Inspector + Console) to trace issues from the UI back to the source: I inspected DOM elements, followed class names, and searched the codebase based on what I saw in the rendered component. This helped me navigate the project efficiently, understand the flow, and find the relevant logic (pricing/UI rendering) without wasting time. AI helped me double-check the expected flow of the component and organize my next debugging steps, but I verified everything in the code and in DevTools myself.

### What was challenging?

Time management under a strict timebox was the main challenge for me. At the beginning, I was a bit too ambitious and spent too much time trying to tackle a high-impact ticket that I couldn’t reproduce reliably. Even though the ticket included reproduction steps, I couldn’t trigger the issue on my machine within the timebox. Without a reproducible case locally and a captured stack trace from my environment, continuing the investigation became inefficient and would have risked a guess-based fix.

Another challenge was maintaining focus once I realised I was behind schedule. At one point, I used AI to help explain parts of the flow, but the output wasn’t reliable for this specific codebase without full context and added noise rather than clarity. I then intentionally switched back to evidence-based debugging (DevTools + reading the source) and focused on issues I could reproduce and validate within the remaining time.

### What would you do differently with more time?

If I had more time, I would continue with another ticket from the backlog to further stabilise and polish the configurator. Several items looked valuable, but I prioritised verified fixes within the timebox.

---

## Additional Notes

I worked on two separate branches in my fork and merged them into main after completing the tasks. This Pull Request is created to include my analysis and submission details, as requested in the instructions.

I used a simple prioritization framework to decide what to work on within the 4-hour timebox:

- **Hotfix / Blockers first** – anything that crashes the app or breaks the critical user flow must be addressed first.
- **Revenue & core value next** – issues that affect the main purpose of the product (e.g. correct pricing, ability to complete configuration and add to cart) come before cosmetic improvements.
- **Stability & correctness** – fixes that reduce UI inconsistency and prevent subtle rendering issues (e.g. stable React keys, preventing state mismatches) are high value and usually low risk.
- **Performance investigations** – important but require profiling and time to verify; I avoid rushed fixes without evidence.
- **UX polish** – improvements like loading indicators or nicer error copy come after stability and core correctness.
- **Out of scope / unclear requirements** – I deprioritized tasks that were too large for 4 hours or had conflicting/ambiguous requirements, and documented them instead of making risky assumptions.
