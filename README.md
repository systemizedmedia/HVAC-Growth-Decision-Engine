# Growth Decision Engine - Manual Input Version

This is a static, repo-ready tool for home service marketing budget analysis.

It does **not** require CSV upload.

Users manually enter numbers into rows:

- Timeframe
- Channel
- Campaign
- Spend
- Leads
- Appointments
- Sales
- Revenue

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
- Timeframe comparison
- Restore-to-baseline bottleneck math
- Budget increase scenario math

## Recommended Use

Enter data for:

- Past 7 days
- Month to date
- Past 30 days
- Past 90 days
- Past 365 days

For each channel and campaign.

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
