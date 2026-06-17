# Growth Decision Engine - Budget Allocation Version

This is a static, repo-ready tool for home service marketing budget analysis.

The user chooses one analysis timeframe, then enters each channel/platform's numbers for that same timeframe.

## MER and Rev/Spend

The tool calculates MER automatically from the rows entered:

```text
Entered Rows MER = Total Entered Revenue / Total Entered Spend
```

No separate company revenue or total marketing spend fields are needed in this version.

Channel-level tables show:

```text
Rev/Spend = Channel Revenue / Channel Spend
```

This is similar to channel ROAS or revenue efficiency.

## Projected MER

The tool now shows projected MER after extra budget is applied.

```text
Projected MER = (Current Entered Revenue + Projected Added Revenue)
/
(Current Entered Spend + Extra Budget)
```

This appears in:

- Best Single Allocation
- Proportional Allocation
- Specific Platform Scenarios

This is based on the entered channel efficiency holding after the budget increase. It is scenario math, not a guaranteed forecast.

## User Flow

1. Enter the timeframe being analyzed.
2. Enter extra budget available.
3. Choose what to optimize for:
   - Closed Jobs
   - Revenue
   - Appointments
   - Leads
4. Pull numbers from ServiceTitan, Meta, Google, LSA, or other platforms for that same timeframe.
5. Add one row per channel or campaign.
6. Check which rows should be included in the allocation.
7. Click Analyze Numbers.

## Input Fields

- Use? Checkbox
- Channel / Platform
- Campaign / Segment Optional
- Spend
- Leads
- Appointments
- Closed Jobs
- Revenue

Revenue is optional, but MER and Rev/Spend require revenue.

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

- Entered rows MER
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
