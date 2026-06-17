# HVAC Growth Decision Engine

A static, repo-ready growth diagnostic tool for HVAC and home service businesses.

It helps answer:

- Which channel or campaign is performing better?
- Where should additional budget go?
- What is the current MER?
- What is the funnel bottleneck?
- Is the last 7 days aligned with the month-to-date, 30-day, 90-day, and 365-day trend?

## Important Logic

This tool intentionally avoids arbitrary weighted scores.

It does **not** use:

- Growth scores
- Marketing scores
- Made-up channel scores
- Subjective weights like "Marketing = 30%"

It uses only:

- Actual input data
- Funnel math
- MER
- Cost per lead
- Cost per appointment
- Cost per sale
- Revenue per lead
- Timeframe comparisons
- Restore-to-baseline scenario math
- Budget increase scenario math

## Required CSV Columns

```csv
date,channel,campaign,spend,leads,appointments,sales,revenue
```

Example:

```csv
2026-06-01,Meta,AC Replacement Offer,1000,20,8,2,24000
```

## Timeframes

The app uses the latest date in your uploaded data as the "to date" anchor.

It calculates:

- Past 7 days to date
- Month to date
- Past 30 days to date
- Past 90 days to date
- Past 365 days to date

## How Bottleneck Detection Works

The bottleneck engine compares the selected timeframe against the selected baseline.

Example:

- Current Lead → Appointment rate: 30%
- Baseline Lead → Appointment rate: 40%

The tool models how many additional appointments and sales would occur if the current period restored that rate back to baseline.

It does the same for:

- Lead → Appointment
- Appointment → Sale

The bigger restore-to-baseline opportunity becomes the primary bottleneck.

## How Budget Ranking Works

For each channel or campaign, the app calculates actual selected-window efficiency:

- Leads per dollar
- Appointments per dollar
- Sales per dollar
- Revenue per dollar

Then it models what an additional budget amount would be associated with if current efficiency held.

This is not a guaranteed forecast. It is scenario math.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload these files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `sample-data.csv`
   - `README.md`
3. Go to **Settings → Pages**.
4. Set source to your main branch and root folder.
5. Open the GitHub Pages URL.

No build step required.
No React, Vite, Babel, or npm needed.

## Why no React?

The goal is to avoid build issues and CDN/Babel problems. This runs directly in the browser.
