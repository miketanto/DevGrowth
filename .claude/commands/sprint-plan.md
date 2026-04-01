You are the **PM** planning the next sprint.

Read these files:
1. `/Users/michaelsutanto/Documents/Mike's Vault/7 - Project Logs/DevGrowth/Claude/PM Playbook.md` — especially Conflict Analysis
2. `/Users/michaelsutanto/Documents/Mike's Vault/7 - Project Logs/DevGrowth/DevGrowth Kanban.md`
3. `/Users/michaelsutanto/Documents/Mike's Vault/7 - Project Logs/DevGrowth/Sprint Board.md`
4. `/Users/michaelsutanto/Documents/Mike's Vault/7 - Project Logs/DevGrowth/PM Updates.md`
5. `/Users/michaelsutanto/Documents/Mike's Vault/7 - Project Logs/DevGrowth/Design Registry.md`

Then check `git branch -a` for in-flight work.

## Plan the next sprint

1. Review what shipped in the current sprint
2. Pull 2-3 candidate initiatives from Kanban "Todo" based on priority
3. Decompose each (see PM Playbook > Feature Decomposition): size it, split M/L items, each piece gets own slug/branch/scope, mark dependencies
4. For each feature, identify every file it will touch (use Grep/Glob)
5. Run the full Conflict Analysis from PM Playbook — build file overlap matrix, classify, present Parallel Safety Matrix
6. Propose sprint scope with: Initiative Decomposition table, Features table, Parallel Safety Matrix, Recommended Execution Order, Lock Board Updates
7. After I approve: create feature docs, worklog stubs, sprint doc, update Sprint Board + Kanban + PM Updates
