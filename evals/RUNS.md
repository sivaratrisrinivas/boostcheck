# Eval runs

20 cases in `cases.json`, written by hand before the checker existed (see the first commit).
A case passes when the decision is right, every flag quotes the post word for word, and every flag names a policy section.
Pass bar: 17/20. Model: Groq `openai/gpt-oss-120b`, temperature 0. Rules run first.

| Run (UTC) | IST | Score | Failed | Code state |
|---|---|---|---|---|
| 2026-10-09 21:00 | Oct 10 02:30 | 19/20 | E02 | First run. The model prompt had an "allowed" example phrase that matched case E02 word for word. That is a leak, so this run does not count. |
| 2026-10-09 21:02 | Oct 10 02:32 | 18/20 | E02, E04 | Leaked phrase replaced with one from the dev set. |
| 2026-10-09 21:05 | Oct 10 02:35 | 19/20 | E02 | Same code, rerun to see the spread. |
| 2026-10-09 21:07 | Oct 10 02:37 | 18/20 | E02, E03 | Added a code check that overrules model discount flags when the % matches the landing page. This change came from the E04 failure, so it is tuned on the eval. |

Failure types (all on clean posts, all from the model):
- Over-reading a personal benefit as a promised result: "helps me not overspend on takeout" (E02, every run) and "the streak reminder actually got me off the couch today" (E03).
- Flagging a discount that matched the landing page ("up to 30% off" vs "up to 30% off", E04). Fixed by the code check above.

No case with a real policy problem was missed in any run. The misses are all false alarms, which cost a reviewer click, not a rejected ad.

Other things to know:
- I wrote the cases, the rules and the prompt, with the cases visible. Two prompt lines came from the 120-post dev set (`data/posts.json`), not from the eval, but the bias is real. A fresh case set written by someone else is the honest next test.
- Scores move by one case between identical runs, even at temperature 0.
