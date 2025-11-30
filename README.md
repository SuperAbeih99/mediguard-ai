# MediGuard AI

MediGuard AI helps patients understand and challenge their medical bills.  
Upload a bill (image or PDF) or paste the text, and the app uses AI to:

- Summarize the bill in plain language
- Flag suspicious or potentially incorrect charges
- Estimate potential savings
- Generate a draft dispute letter you can send to the provider

---

## Features

- 🧾 **Bill input options**
  - Upload image/PDF of your bill
  - Or paste bill text directly

- 🤖 **AI-powered analysis**
  - Clear summary of key charges
  - Highlights line items that may be incorrect
  - Suggests potential savings based on typical CPT ranges

- ✉️ **Dispute letter generator**
  - Draft dispute letter using the issues found
  - Copy-to-clipboard for easy use in email/portal

- 👤 **Authentication & history**
  - Email/password signup & login (via Supabase)
  - Per-user saved analyses (bills + AI results)
  - Guest mode with up to 3 free analyses (no saved history)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React, TypeScript, Tailwind CSS
- **animations:** Framer Motion (for loading/animations)
- **Auth & DB:** Supabase (email/password auth, Postgres)
- **AI:** OpenAI API (bill analysis + dispute letter)
- **State / Data:** TanStack Query for API + error handling

---

## Getting Started

### 1. Clone the repo

```bash
git clone git@github.com:SuperAbeih99/mediguard-ai.git
cd mediguard-ai
```
### 2. Install dependencies
```
npm install
# or
yarn
# or
pnpm install
```
### 3. Environment variables
```
touch .env.local
Add your keys:
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
### Run the dev server
```
npm run dev
```



