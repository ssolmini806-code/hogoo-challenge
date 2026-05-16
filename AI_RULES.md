# AI_RULES.md

## Core Development Rules

### 1. Ask Before Large Changes

If the requested task requires:

* major refactoring
* architecture changes
* dependency replacement
* database structure changes
* changes affecting multiple systems

DO NOT proceed immediately.

First:

* explain what will change
* explain why it is necessary
* explain risks/tradeoffs
* ask for confirmation

---

### 2. Never Put Everything in One File

Avoid oversized files and tightly coupled logic.

Always:

* separate responsibilities
* modularize by feature
* split API, UI, logic, utilities, types
* prefer maintainable structure over fast dumping

Bad:

* massive page.tsx
* giant API route
* mixed business logic/UI/database code

Good:

* reusable modules
* isolated logic
* clean folder structure

---

### 3. Do Not Assume Ambiguous Requests

If the request is unclear:

* do not infer silently
* do not implement speculative features
* do not make hidden assumptions

Instead:

1. explain your understanding
2. point out ambiguous parts
3. ask concise clarification questions

---

## Implementation Philosophy

* prioritize production stability
* avoid hacks unless explicitly requested
* avoid fake/mock implementations
* avoid unnecessary complexity
* preserve existing functionality
* optimize for maintainability
* think about scaling early

---

## Mandatory Self-Review

Before finalizing any implementation:

Check:

* broken logic
* duplicated code
* unnecessary complexity
* inconsistent naming
* edge cases
* hidden bugs
* security risks
* maintainability issues

Then answer:

1. What is most likely to fail in production?
2. What assumptions were made?
3. Is there a simpler solution?
4. Could this break existing functionality?

Fix issues before finalizing.

### 4. Preserve Existing Features
Before changing existing code:
- identify what currently works
- avoid breaking working flows
- explain possible side effects before modifying core logic