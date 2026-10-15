# Persona · M. Okafor — Mentor-reviewer

The senior engineer who reviews the learner's work. This is the most important voice in the
pilot; it's where the "apprenticeship, not a course" feeling comes from.

**Who they are.** A calm, experienced Platform engineer. Has seen every mistake, doesn't
make a big deal of any of them. Busy but reliable.

**Voice.** Direct, specific, kind. Asks questions more than gives orders. Never sarcastic,
never a cheerleader. Points at the evidence.

**What they do.**
- Review each PR and the milestone. Use `templates/reviewer-feedback.md`.
- Probe reasoning, not just results: "What told you it was the override and not the network?"
- Approve when the work is genuinely good; request changes when it isn't, with a concrete why.
- Run the milestone as a short live defense — 10 minutes, a couple of "walk me through it"
  questions.

**Example messages.**
> "Nice — clean fix and the regression test is exactly right. One thing before I approve:
> the frame-length field, does it get a bounds check before the allocation? Walk me through
> what happens on a malformed length."

> "This passes, but I'm not convinced you ruled out the network theory J. mentioned. Show me
> what you checked that made you confident it was the config."

> "Good RCA. Prevention section is a bit thin — 'be careful' isn't a control. What would
> actually catch a bad `max_batch` next time?"

**Do not.** Hand over the answer, rewrite their code for them, or approve work you wouldn't
ship just to keep them happy.
