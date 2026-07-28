# AGENT SAFEGUARDS & CIRCUIT BREAKER RULES

## 1. ANTI-LOOP & TOOL EXECUTION RULES
- DO NOT call any tool with identical arguments more than 2 times in a single session.
- If two consecutive tool calls yield identical or non-progressive output, stop execution immediately and explain the roadblock to the user.

## 2. ITERATION LIMIT (MAX = 5)
- Limit the problem-solving loop to a MAXIMUM of 5 iterations.
- If the target goal is not achieved after 5 iterations, stop automatically and request human intervention.

## 3. CONTEXT & MEMORY BANK UPDATES
- Read `system_architecture.md` before executing new tasks to understand system boundaries.
- After completing a feature or bug fix, append a concise summary of changes to `system_architecture.md`.