# FT-03 — Secure Micro-Lending Platform with Alternative Credit Assessment
### Technical & Product Specification

> Scope note: this doc covers architecture, features, tech stack, and API design only. Visual/UI design is intentionally excluded — that's being handled separately (design spec going to Antigravity). Frontend section below lists screens, components, and data needs, not layout/visuals.

---

## 1. Overview

A platform that lets small businesses and self-employed individuals apply for micro-loans, assessed using alternative (non-traditional) data signals instead of a formal credit history — with a fully transparent, explainable score, not a black-box output.

**Recommended niche (pick one for a sharper pitch):** urban street vendors / gig workers / home-based micro-entrepreneurs. A named niche beats "SME lending" as a generic category — swap freely, but pick one before building.

---

## 2. Unique / Differentiating Features

1. **Explainable scoring** — every score ships with a factor-by-factor breakdown (not a single opaque number). This is your #1 judge-facing differentiator.
2. **Privacy-first aggregation** — raw alt-data (transactions, bills) is processed into derived signals before being stored; the backend never persists raw source data, only aggregated features.
3. **Social + digital hybrid trust layer** — community "vouching" from other verified users blends with digital signals, instead of purely algorithmic scoring.
4. **Dynamic repricing** — interest rate adjusts as real repayment behavior accumulates, not fixed at origination.
5. **Score evolution over time** — a visible timeline showing how the score changed as data/repayments came in (strong demo visual).

---

## 3. Core Modules (must-haves)

| # | Module | Purpose |
|---|--------|---------|
| 1 | Auth & onboarding | Borrower + Lender/Admin roles, KYC-lite (mocked) |
| 2 | Alt-data connector | Simulated linking of UPI txns, utility bills, GST filings |
| 3 | Credit scoring engine | Rule-based, weighted, explainable score generation |
| 4 | Loan application & workflow | Apply → review → approve/reject → disburse |
| 5 | Repayment tracking | Schedule, repayment logging, on-time/late tracking |
| 6 | Dynamic repricing | Recalculate rate/score post-repayment events |
| 7 | Community vouching | Peer trust signals tied into score |
| 8 | Lender/Admin dashboard | View applicants, scores, approve/reject, portfolio analytics |

---

## 4. Tech Stack

**Frontend**
- React (Vite) + TypeScript
- TailwindCSS (utility classes only — visual system comes from the design file)
- React Router for routing
- React Hook Form + Zod for form validation
- Axios (or fetch) for API calls
- Recharts for score/analytics visualizations

**Backend**
- Node.js + Express (TypeScript) — fastest path to a working API in a 1-day window
- JWT-based auth, bcrypt for password hashing
- Zod (or Joi) for request validation

**Database**
- PostgreSQL via Supabase (gives you DB + Auth + hosted Postgres in one, saves setup time)
- Alternative if you want zero backend auth work: use Supabase Auth directly and keep Express as a thin API layer over it

**Credit Scoring Engine**
- Standalone service/module (can live inside the same Express app as a separate route group for a 1-day build)
- Rule-based weighted scoring (not ML — no time to train/validate a real model in a day, and rule-based is *more* explainable anyway, which is your differentiator)

**Hosting / Deployment**
- Frontend: Vercel
- Backend: Render or Railway
- DB/Auth: Supabase

**Dev tools**
- pnpm or npm workspaces if monorepo
- ESLint + Prettier
- Postman/Thunder Client for API testing during build

---

## 5. Frontend Requirements (screens & data needs — no visual design)

| Screen | Purpose | Key data in/out |
|---|---|---|
| Landing | Value prop, CTA to onboard | static |
| Register/Login | Borrower or Lender/Admin role select | email, password, role |
| Borrower onboarding | Business + personal details | name, business type, location, monthly income est. |
| Alt-data connect | Simulated "connect" buttons (UPI, utility, GST, social) | triggers backend mock-data generation per source |
| Score dashboard | Score gauge + factor breakdown + history timeline | GET score + breakdown + history |
| Loan application | Amount, tenure, purpose | POST loan application |
| Loan status | Track application → approval → disbursal | GET loan status |
| Repayment | Make/view repayments, schedule | GET/POST repayments |
| Vouching | Request/give vouches | POST/GET vouches |
| Admin dashboard | List applicants, scores, approve/reject, portfolio stats | GET applicants, PUT loan status, GET analytics |

---

## 6. Backend API Design (Call Points)

**Auth**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create borrower or lender/admin account |
| POST | `/api/auth/login` | Return JWT |
| GET | `/api/auth/me` | Return current user profile |

**Borrower Profile**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/profile` | Create borrower profile |
| GET | `/api/profile/:id` | Fetch profile |
| PUT | `/api/profile/:id` | Update profile |

**Alt-Data Ingestion (simulated sources)**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/data/upi` | Simulate UPI transaction history link |
| POST | `/api/data/utility` | Simulate utility payment history link |
| POST | `/api/data/gst` | Simulate GST filing signal |
| POST | `/api/data/social-vouch` | Register a vouch source |

**Credit Scoring**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/score/calculate` | Run scoring engine on a user's aggregated data |
| GET | `/api/score/:userId` | Get current score |
| GET | `/api/score/:userId/breakdown` | Get factor-level explainability breakdown |
| GET | `/api/score/:userId/history` | Score-over-time timeline |

**Loans**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/loans/apply` | Submit loan application |
| GET | `/api/loans/:id` | Get loan details |
| GET | `/api/loans/user/:userId` | Get a borrower's loans |
| PUT | `/api/loans/:id/status` | Admin: approve/reject/disburse |

**Repayments**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/repayments` | Log a repayment |
| GET | `/api/repayments/:loanId` | Repayment history for a loan |
| GET | `/api/repayments/schedule/:loanId` | Repayment schedule |

**Vouching**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/vouch` | Submit a vouch for another user |
| GET | `/api/vouch/:userId` | Get vouches received |

**Admin/Lender**
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/loans` | All loan applications |
| GET | `/api/admin/borrowers` | All borrowers + scores |
| GET | `/api/admin/analytics` | Portfolio-level stats (default rate, avg score, etc.) |

---

## 7. Database Schema (high-level)

- **users** — id, email, password_hash, role (borrower/admin), created_at
- **borrower_profiles** — id, user_id, business_name, business_type, location, monthly_income_est
- **alt_data_signals** — id, user_id, source (upi/utility/gst/vouch), aggregated_value, collected_at *(raw data never stored — only derived/aggregated fields)*
- **credit_scores** — id, user_id, score, breakdown (JSON: factor → weight → contribution), calculated_at
- **loans** — id, user_id, amount, tenure_months, interest_rate, purpose, status, applied_at
- **repayments** — id, loan_id, amount, due_date, paid_date, status
- **vouches** — id, voucher_id, vouchee_id, note, created_at

---

## 8. Credit Scoring Logic (explainable, rule-based)

Weighted sum of normalized signals — keep every weight visible in the breakdown response:

| Factor | Example weight | Signal |
|---|---|---|
| Transaction consistency | 25% | Regularity/frequency of simulated UPI inflows |
| Bill payment reliability | 20% | On-time utility payment ratio |
| Business formalization | 15% | GST filing presence/consistency |
| Community trust | 15% | Number + weight of vouches received |
| Repayment history | 25% | On-time repayment ratio on prior/active loans (0 if no history yet) |

`score = Σ (factor_value_normalized × weight)`, scaled to a 0–100 (or 300–900, credit-bureau-style) range. Return the per-factor contribution alongside the total — this *is* the explainability feature judges will notice.

---

## 9. Security Considerations (mention even if mocked)

- JWT expiry + refresh handling
- Password hashing (bcrypt), never store plaintext
- Input validation on every POST (Zod/Joi schemas)
- Role-based access control (borrower vs admin routes)
- No raw financial data persisted — only aggregated/derived signals (ties directly into your privacy-first pitch)

---

## 10. Suggested 1-Day Build Timeline

| Time | Focus |
|---|---|
| Hr 0–1 | Repo setup, Supabase project, auth scaffolding |
| Hr 1–3 | DB schema + core API routes (profile, loans, repayments) |
| Hr 3–5 | Scoring engine + breakdown endpoint |
| Hr 5–8 | Frontend: auth, onboarding, score dashboard, loan flow |
| Hr 8–10 | Admin dashboard + vouching module |
| Hr 10–12 | Repayment flow + score history/timeline |
| Hr 12–14 | Integration testing, seed demo data, polish |
| Final hr | Pitch prep, demo script rehearsal |

---

## 11. Stretch Goals (only if ahead of schedule)

- Real-time score update via WebSocket when a repayment lands
- Notification system (mock email/SMS)
- CSV export for admin analytics
- Multi-loan portfolio view per borrower
