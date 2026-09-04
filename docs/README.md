# Lovable Interview Presentation

`lovable-presentation.html` is a self-contained slide deck (open it directly in a browser — arrow keys / on-screen buttons to navigate, plus a speaker-notes drawer) built for the "Project Presentation" round of Lovable's Forward Deployed Engineer interview loop. It walks through this repo's project: the problem, the architecture decisions, the real bugs hit along the way, and the outcome.

## Why it wasn't used

Lovable's loop had three rounds after the initial screens: System Design, Backend, and Project Presentation. Nikhil cleared System Design (2026-08-25) but was rejected the morning of 2026-08-27, before Backend or Project Presentation were ever held — both were cancelled by Lovable rather than conducted. So this deck was fully built but never actually presented or rehearsed live.

It's kept here because the deck itself — and the project retrospective it forced — is solid work independent of the interview outcome.

## What was left unfinished

Work on the deck stopped opportunistically around 2026-08-24/25 as prep time shifted to System Design (the nearer, and as it turned out decisive, round). At that point:

- **Slide-by-slide close review hadn't reached the back half of the deck.** The opening sections (Context/Problem/Solution, and the system diagrams) had gone through detailed, element-by-element review. The "Key Technical Decisions," "Key Challenges," and "Wrapping Up" sections had only had a structural pass (breadcrumb eyebrows added, banner tags folded in) — not the same close read.
- **A known content gap was flagged but never written in**, on the "There's no free NBA schedule API" slide — its speaker notes still carry a literal `TODO (Nikhil, 2026-08-22)` acknowledging that the scraped/static-JSON approach doesn't handle games getting rescheduled after the annual scrape, unlike a live API. Flagged so it wouldn't get lost, but never formatted into the actual slide content.
- **A small styling inconsistency was never resolved**: the "Key Technical Decisions" agenda cards still use an older green-pill numbering style, while the rest of the deck had moved to the cursive red-italic numbering (`.agenda-num`) used on the main Agenda slide.
- **The biggest gap is structural, not cosmetic**: this HTML deck was always meant as a prototype/spec rather than the final deliverable. The plan was to use it as a reference and have Lovable's own product recreate the actual presentation in their tool — that step never happened.

None of this blocks reading or presenting the deck as-is — it's a coherent, mostly-polished walkthrough — but if it's ever picked back up (for a future interview, a portfolio piece, etc.), that's the honest list of what's rough.
