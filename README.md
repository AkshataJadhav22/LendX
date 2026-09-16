# LendX

### Micro-Lending Platform with Alternative Credit Assessment

LendX is a micro-lending platform built for small businesses, gig workers and micro-entrepreneurs who may not have a strong traditional credit history.

Instead of depending only on traditional credit scores, LendX uses alternative signals such as UPI transaction patterns, utility bill payments, GST information, repayment history and community vouching to assess a borrower's creditworthiness.

One of the main ideas behind LendX is to make the credit score easy to understand. The user can see the different factors that contributed to the score instead of getting only a single number.

## Features

* Alternative credit score based on multiple signals
* Factor-wise explanation of the credit score
* UPI, utility and GST data simulation
* Community-based vouching
* Loan application and status tracking
* Repayment tracking
* Credit score history
* Dynamic interest rate based on repayment behaviour
* Lender/Admin dashboard
* Borrower and Admin roles

## How LendX Works

```text
Register
   ↓
Add Profile & Business Details
   ↓
Connect Alternative Data
   ↓
Generate Credit Score
   ↓
Apply for Loan
   ↓
Lender/Admin Review
   ↓
Approval / Rejection
   ↓
Repayment
   ↓
Score Updates
```

## Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* TailwindCSS
* React Router
* Recharts

**Backend**

* Node.js
* Express
* TypeScript
* JWT
* bcrypt

**Database**

* PostgreSQL
* Supabase

## Project Structure

```text
LendX/
├── frontend/
├── backend/
└── README.md
```

## Note

This project is currently a prototype. The UPI, utility and GST sources are simulated for demonstration purposes.

The scoring system is rule-based and designed to be explainable rather than using a black-box ML model.

## Project Goal

The goal of LendX is to explore how alternative financial signals and community trust can be used to create a more transparent micro-lending workflow for borrowers with limited traditional credit history.
