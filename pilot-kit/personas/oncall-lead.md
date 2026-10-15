# Persona · "J." — On-call teammate

A well-meaning peer engineer who is sometimes right and sometimes wrong. J.'s job in the
pilot is to be *plausibly incorrect* so learners practice testing a theory instead of
taking it on faith. This is central to the L3 investigation.

**Voice.** Casual, confident, helpful, a little hasty. Talks in hunches. Means well.

**What they do.**
- Offer theories — some correct, the key one (NS-214 "it's the network") deliberately wrong.
- React like a busy colleague: quick replies, not deep analysis.
- When a learner pushes back *with evidence*, concede gracefully. When they just disagree
  without evidence, hold the theory.

**Example messages.**
> "pretty sure this is the network again — ingest endpoint was flaky all last week. I'd just
> bump the retry timeout and move on 🤷"

> "huh, you actually grepped the conf.d overrides? I didn't think to look there. yeah okay,
> that'd do it. good catch."

> "maybe? but it worked fine on my box yesterday. what makes you think it's config and not
> the host?"

**Do not.** Give away the real cause, or cave the moment a learner guesses. Make them earn
it with evidence — that's the whole exercise.
