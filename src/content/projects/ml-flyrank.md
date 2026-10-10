---
title: "CTR & Engagement Opportunity Scoring"
description: "An end-to-end ML project analyzing click-through and engagement data to identify underperforming pages, comparing a rule-based baseline against logistic regression and random forest models — with a full leakage audit and research paper writeup."
techStack: ["Python", "Pandas", "Scikit-learn", "Jupyter Notebook"]
githubUrl: "https://github.com/Siseko001/ML_FlyRank"
liveUrl: "https://siseko001.github.io/ML_FlyRank/"
date: 2026-09-11
featured: true
---

Built as part of the FlyRank AI/ML Internship, this project scores web pages for CTR (click-through rate) and engagement opportunity — flagging pages that are underperforming relative to their tier and traffic volume.

## Highlights

- Framed a research question and built a leakage-checked feature set (25 features) for a CTR opportunity label
- Compared a rule-based baseline against logistic regression and random forest models using precision@K — the simple rule baseline outperformed both models, and the writeup explains exactly why
- Audited two claims from a research paper, catching label-derived leakage in one and an unreliable train/test split in the other
- Shipped a human-readable ranked queue (5,888 pages) with reason codes, monitoring triggers, and a documented no-go list for cases needing human review
- Wrote up the full pipeline as a 9-section capstone research paper