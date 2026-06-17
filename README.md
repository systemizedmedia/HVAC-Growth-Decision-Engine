# Growth Decision Engine - Channel Input Version

This is a static, repo-ready tool for home service marketing budget analysis.

The user chooses one analysis timeframe, then enters each channel/platform's numbers for that same timeframe.

Example timeframes:

- Past 1 day
- Past 3 days
- Past 7 days
- Month to date
- Past 30 days
- May 1 to May 31
- Custom period

## User Flow

1. Enter the timeframe being analyzed.
2. Pull numbers from ServiceTitan, Meta, Google, LSA, or other platforms for that same timeframe.
3. Add one row per channel or campaign.
4. Click Analyze Numbers.

## Input Fields

- Channel / Platform
- Campaign / Segment Optional
- Spend
- Leads
- Appointments
- Sales
- Revenue

Revenue is optional, but MER requires revenue.

## Core Logic

This tool avoids arbitrary weighted scores.

It does not use:

- Growth scores
- Marketing scores
- Channel scores
- Made-up weights

It uses:

- MER
- CPL
- Cost per appointment
- Cost per sale
- Lead to appointment rate
- Appointment to sale rate
- Revenue per lead
- Revenue per sale
- Budget increase scenario math
- Funnel leak math

## Important Note

The tool does not pull data from ServiceTitan automatically. The user manually enters numbers based on whatever timeframe they want to analyze.

## GitHub Pages Deployment

1. Upload these files to your repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
2. Go to repository **Settings**.
3. Click **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose:
   - Branch: `main`
   - Folder: `/root`
6. Click **Save**.

No build step needed.
No React, Vite, Babel, or npm needed.
