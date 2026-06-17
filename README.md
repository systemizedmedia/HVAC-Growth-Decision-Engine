# Growth Decision Engine - Budget Allocation Version

This is a static, repo-ready tool for home service marketing budget analysis.

The user chooses one analysis timeframe, then enters each channel/platform's numbers for that same timeframe.

## Important MER vs ROAS Clarification

True MER is:

```text
Total Company Revenue / Total Marketing Spend
```

Channel-level revenue divided by channel spend is not true company MER. It is closer to channel ROAS or channel revenue efficiency.

This version separates those concepts:

- **Company MER** = total company revenue ÷ total marketing spend.
- **Rev/Spend** in channel tables = channel revenue ÷ channel spend.

If the company-level fields are left blank, the app uses the summed row revenue and summed row spend as the Company MER basis. That is only accurate if the rows represent the full company revenue and full marketing spend for the timeframe.

## User Flow

1. Enter the timeframe being analyzed.
2. Enter extra budget available.
3. Choose what to optimize for:
   - Closed Jobs
   - Revenue
   - Appointments
   - Leads
4. Optional: enter total company revenue and total marketing spend for true MER.
5. Pull numbers from ServiceTitan, Meta, Google, LSA, or other platforms for that same timeframe.
6. Add one row per channel or campaign.
7. Check which rows should be included in the allocation.
8. Click Analyze Numbers.

## Input Fields

- Use? Checkbox
- Channel / Platform
- Campaign / Segment Optional
- Spend
- Leads
- Appointments
- Closed Jobs
- Revenue

Revenue is optional, but channel revenue efficiency requires revenue.

## Budget Outputs

The tool shows three budget views:

### 1. Best Single Allocation

This puts the full extra budget into the row with the highest efficiency for the selected objective.

Example:

If optimizing for Closed Jobs, it selects the channel with the highest closed jobs per dollar.

### 2. Proportional Allocation

This splits the extra budget across checked rows in proportion to each row's actual efficiency for the selected objective.

Example:

If optimizing for Revenue, a channel with higher revenue per dollar receives a larger share.

### 3. Specific Platform Scenarios

This shows what would happen if the full extra budget went to each channel individually.

## Core Logic

This tool avoids arbitrary weighted scores.

It does not use:

- Growth scores
- Marketing scores
- Channel scores
- Made-up weights

It uses:

- Company MER
- Channel revenue/spend
- CPL
- Cost per appointment
- Cost per closed job
- Lead to appointment rate
- Appointment to closed job rate
- Revenue per lead
- Revenue per closed job
- Budget increase scenario math
- Funnel leak math

## Important Note

This is scenario math, not a guaranteed forecast. It assumes the current input efficiency holds after adding budget.

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
