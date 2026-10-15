# Reviewer feedback template

Use on every PR and the milestone. The auto-grader already confirmed the outcome; your job
is the part it can't see — reasoning, judgment, and communication. Keep it specific and kind.
**Start a timer when you open the submission; stop when you post this. Log the minutes in
`measurement/review-log.csv`.**

---

**Verdict:** Approve / Request changes

**What worked**
- [One or two specific things they did well — name the file, the line, the decision.]

**What to change**
- [Concrete, actionable. Not "improve error handling" but "handle the case where the frame
  length is larger than the buffer before you allocate."]

**A question to think about** (for L3+)
- [Probe the reasoning: "What ruled out the network theory for you?" / "What happens if two
  clients send at once?"]

**Reasoning & communication**
- [Did they explain *why*, test the coworker's theory, write clearly? This is where the
  real feedback lives.]

---

After posting, record in the review log:
`learner, unit, minutes, outcome (approve/changes), needed-final-hint (y/n), one-line note`
