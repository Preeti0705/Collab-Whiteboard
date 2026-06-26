# 🎯 Interview Prep

> System design and distributed systems interview questions drawn directly from what we build.

## How to Use This

After completing each lesson, the relevant interview questions are added here. Practice by:
1. Explaining the concept out loud (rubber duck method)
2. Drawing the architecture on a whiteboard
3. Discussing tradeoffs (there's never one right answer)

---

## System Design Questions

### Q1: Design a collaborative whiteboard (like Figma)
**Status**: Building it right now!  
**Key Topics**: CRDTs, WebSockets, Canvas rendering, Rooms, Presence  
**Your Answer Will Cover**: Everything in this project.

---

## Distributed Systems Questions

| Question | Related Lesson | Difficulty |
|---|---|---|
| What is the CAP theorem? Give an example. | Lesson 1 | Medium |
| Explain eventual consistency. When is it acceptable? | Lesson 1 | Medium |
| CRDTs vs OT — compare and contrast. | Lesson 1 | Hard |
| How would you handle offline editing in a collaborative app? | Lesson 5 (planned) | Hard |
| Explain vector clocks. Why not just use timestamps? | Lesson 3 (planned) | Hard |

---

## Behavioral Spin

> "Tell me about a technically challenging project you built."

Your answer: This entire project. Be ready to discuss:
- Why you chose CRDTs over OT
- How you handled conflict resolution
- Performance challenges with Canvas rendering
- What you'd do differently at scale

---

> Updated as lessons are completed.
