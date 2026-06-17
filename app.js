/* HVAC Growth Decision Engine
   Repo-ready static app. No build tools, no dependencies, no arbitrary weighted scores.
*/

const REQUIRED_COLUMNS = ["date", "channel", "campaign", "spend", "leads", "appointments", "sales", "revenue"];

const sampleCsv = `date,channel,campaign,spend,leads,appointments,sales,revenue
2026-03-01,Meta,AC Replacement Financing,4200,62,22,5,67500
2026-03-01,Google Search,Emergency AC Repair,3100,34,21,7,73500
2026-03-01,LSA,HVAC Local Services,1800,19,14,5,52500
2026-03-08,Meta,AC Replacement Financing,4600,70,24,5,65000
2026-03-08,Google Search,Emergency AC Repair,3500,38,24,8,88000
2026-03-08,LSA,HVAC Local Services,2100,22,15,5,57500
2026-03-15,Meta,New System Offer,5100,76,26,6,78000
2026-03-15,Google Search,AC Replacement Search,4200,42,27,9,99000
2026-03-15,LSA,HVAC Local Services,2300,24,17,6,69000
2026-03-22,Meta,New System Offer,5600,81,27,6,75000
2026-03-22,Google Search,AC Replacement Search,4700,45,28,9,108000
2026-03-22,LSA,HVAC Local Services,2500,25,18,6,72000
2026-03-29,Meta,Tune Up Offer,3900,88,20,2,18000
2026-03-29,Google Search,Emergency AC Repair,5000,46,30,10,115000
2026-03-29,LSA,HVAC Local Services,2700,27,19,7,80500
2026-04-05,Meta,AC Replacement Financing,6100,86,29,7,87500
2026-04-05,Google Search,AC Replacement Search,5300,49,32,11,132000
2026-04-05,LSA,HVAC Local Services,2900,28,20,7,87500
2026-04-12,Meta,Tune Up Offer,4300,92,21,2,20000
2026-04-12,Google Search,Emergency AC Repair,5600,52,33,11,126500
2026-04-12,LSA,HVAC Local Services,3100,30,21,7,84000
2026-04-19,Meta,New System Offer,6400,90,30,7,98000
2026-04-19,Google Search,AC Replacement Search,5900,54,35,12,144000
2026-04-19,LSA,HVAC Local Services,3300,31,22,8,96000
2026-04-26,Meta,AC Replacement Financing,6700,94,31,7,94500
2026-04-26,Google Search,AC Replacement Search,6200,57,36,12,150000
2026-04-26,LSA,HVAC Local Services,3500,32,23,8,100000
2026-05-03,Meta,AC Replacement Financing,7000,96,32,8,112000
2026-05-03,Google Search,AC Replacement Search,6600,60,39,13,169000
2026-05-03,LSA,HVAC Local Services,3700,34,24,8,104000
2026-05-10,Meta,New System Offer,7400,102,35,8,108000
2026-05-10,Google Search,Emergency AC Repair,6900,62,41,14,175000
2026-05-10,LSA,HVAC Local Services,3900,35,25,9,112500
2026-05-17,Meta,Tune Up Offer,4800,108,23,3,28500
2026-05-17,Google Search,AC Replacement Search,7200,64,42,14,182000
2026-05-17,LSA,HVAC Local Services,4100,36,26,9,117000
2026-05-24,Meta,New System Offer,7900,106,36,9,126000
2026-05-24,Google Search,AC Replacement Search,7600,68,44,15,195000
2026-05-24,LSA,HVAC Local Services,4300,38,27,9,121500
2026-05-31,Meta,AC Replacement Financing,8200,110,37,9,121500
2026-05-31,Google Search,Emergency AC Repair,8000,70,46,16,208000
2026-05-31,LSA,HVAC Local Services,4500,39,28,10,135000`;

let allRows = [];

const $ = (id) => document.getElementById(id);

function parseCsv(text) {
  const rows = [];
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must include a header row and at least one data row.");

  const headers = splitCsvLine(lines[0]).map(h => normalizeHeader(h));
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missing.length) {
    throw new Error(`Missing required column(s): ${missing.join(", ")}`);
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    if (!parts.length) continue;
    const obj = {};
    headers.forEach((header, index) => obj[header] = parts[index] ?? "");

    const date = parseDate(obj.date);
    if (!date) continue;

    rows.push({
      date,
      dateString: toIsoDate(date),
      channel: cleanText(obj.channel) || "Unknown",
      campaign: cleanText(obj.campaign) || "Unspecified",
      spend: toNumber(obj.spend),
      leads: toNumber(obj.leads),
      appointments: toNumber(obj.appointments),
      sales: toNumber(obj.sales),
      revenue: toNumber(obj.revenue)
    });
  }

  if (!rows.length) throw new Error("No valid rows found. Check date formatting and CSV values.");
  return rows.sort((a, b) => a.date - b.date);
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(header) {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace("booked_appointments", "appointments")
    .replace("appt", "appointments")
    .replace("appts", "appointments")
    .replace("closed_sales", "sales")
    .replace("ad_spend", "spend");
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(`${String(value).trim()}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[$,%\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function getLatestDate(rows) {
  return rows.reduce((latest, row) => row.date > latest ? row.date : latest, rows[0].date);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getWindowRange(windowKey, latestDate) {
  const end = new Date(latestDate);
  let start;

  if (windowKey === "7d") start = addDays(end, -6);
  else if (windowKey === "mtd") start = startOfMonth(end);
  else if (windowKey === "30d") start = addDays(end, -29);
  else if (windowKey === "90d") start = addDays(end, -89);
  else if (windowKey === "365d") start = addDays(end, -364);
  else start = addDays(end, -29);

  return { start, end };
}

function filterByRange(rows, range) {
  return rows.filter(row => row.date >= range.start && row.date <= range.end);
}

function summarize(rows) {
  const totals = rows.reduce((acc, row) => {
    acc.spend += row.spend;
    acc.leads += row.leads;
    acc.appointments += row.appointments;
    acc.sales += row.sales;
    acc.revenue += row.revenue;
    return acc;
  }, { spend: 0, leads: 0, appointments: 0, sales: 0, revenue: 0 });

  return addMetrics(totals);
}

function addMetrics(totals) {
  const t = { ...totals };
  t.cpl = safeDiv(t.spend, t.leads);
  t.costPerAppointment = safeDiv(t.spend, t.appointments);
  t.costPerSale = safeDiv(t.spend, t.sales);
  t.mer = safeDiv(t.revenue, t.spend);
  t.leadToAppointment = safeDiv(t.appointments, t.leads);
  t.appointmentToSale = safeDiv(t.sales, t.appointments);
  t.leadToSale = safeDiv(t.sales, t.leads);
  t.revenuePerLead = safeDiv(t.revenue, t.leads);
  t.revenuePerAppointment = safeDiv(t.revenue, t.appointments);
  t.revenuePerSale = safeDiv(t.revenue, t.sales);
  return t;
}

function groupRows(rows, keys) {
  const map = new Map();

  for (const row of rows) {
    const key = keys.map(k => row[k]).join("||");
    if (!map.has(key)) {
      const base = { spend: 0, leads: 0, appointments: 0, sales: 0, revenue: 0 };
      keys.forEach(k => base[k] = row[k]);
      map.set(key, base);
    }

    const item = map.get(key);
    item.spend += row.spend;
    item.leads += row.leads;
    item.appointments += row.appointments;
    item.sales += row.sales;
    item.revenue += row.revenue;
  }

  return [...map.values()].map(addMetrics);
}

function safeDiv(a, b) {
  if (!b || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a / b;
}

function formatCurrency(value, decimals = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}

function formatRatio(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return `${formatNumber(value, decimals)}x`;
}

function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return `${(value * 100).toFixed(decimals)}%`;
}

function pctChange(current, baseline) {
  if (baseline === null || baseline === undefined || baseline === 0 || current === null || current === undefined) {
    return null;
  }
  return (current - baseline) / baseline;
}

function render() {
  if (!allRows.length) return;

  const latest = getLatestDate(allRows);
  const windowKey = $("windowSelect").value;
  const baselineKey = $("baselineSelect").value;
  const groupLevel = $("groupSelect").value;
  const scenarioBudget = Number($("budgetInput").value || 0);

  const currentRange = getWindowRange(windowKey, latest);
  const baselineRange = getWindowRange(baselineKey, latest);
  const currentRows = filterByRange(allRows, currentRange);
  const baselineRows = filterByRange(allRows, baselineRange);

  const current = summarize(currentRows);
  const baseline = summarize(baselineRows);

  $("results").classList.remove("hidden");
  $("totalSpend").textContent = formatCurrency(current.spend);
  $("totalRevenue").textContent = formatCurrency(current.revenue);
  $("totalMer").textContent = formatRatio(current.mer);
  $("totalSales").textContent = formatNumber(current.sales);
  $("leadToAppt").textContent = formatPercent(current.leadToAppointment);
  $("apptToSale").textContent = formatPercent(current.appointmentToSale);
  $("dateRangeLabel").textContent = `Selected period: ${toIsoDate(currentRange.start)} to ${toIsoDate(currentRange.end)}. Latest date is based on the most recent row in your data.`;

  renderDiagnosticCards(current, baseline, currentRows, baselineRows);
  renderBottleneck(current, baseline);
  renderBudgetRanking(currentRows, baselineRows, groupLevel, scenarioBudget);
  renderChannelTable(currentRows);
  renderCampaignTable(currentRows);
  renderTimeframeTable(allRows, latest);
}

function renderDiagnosticCards(current, baseline, currentRows, baselineRows) {
  const cards = [
    {
      label: "MER movement",
      value: `${formatRatio(current.mer)} vs ${formatRatio(baseline.mer)}`,
      detail: `Change: ${formatPercent(pctChange(current.mer, baseline.mer))}`
    },
    {
      label: "Lead handling movement",
      value: `${formatPercent(current.leadToAppointment)} vs ${formatPercent(baseline.leadToAppointment)}`,
      detail: `Change: ${formatPercent(pctChange(current.leadToAppointment, baseline.leadToAppointment))}`
    },
    {
      label: "Sales conversion movement",
      value: `${formatPercent(current.appointmentToSale)} vs ${formatPercent(baseline.appointmentToSale)}`,
      detail: `Change: ${formatPercent(pctChange(current.appointmentToSale, baseline.appointmentToSale))}`
    },
    {
      label: "Data volume",
      value: `${formatNumber(currentRows.length)} rows`,
      detail: `${formatNumber(current.leads)} leads, ${formatNumber(current.appointments)} appointments, ${formatNumber(current.sales)} sales`
    },
    {
      label: "Revenue availability",
      value: current.revenue > 0 ? "Revenue included" : "No revenue",
      detail: current.revenue > 0 ? "MER and revenue metrics are available." : "MER cannot be calculated without revenue."
    },
    {
      label: "Baseline volume",
      value: `${formatNumber(baselineRows.length)} rows`,
      detail: `${formatNumber(baseline.leads)} leads, ${formatNumber(baseline.appointments)} appointments, ${formatNumber(baseline.sales)} sales`
    }
  ];

  $("diagnosticCards").innerHTML = cards.map(card => `
    <div class="diagnostic-card">
      <span class="badge info">${card.label}</span>
      <h3>${card.value}</h3>
      <p>${card.detail}</p>
    </div>
  `).join("");
}

function renderBottleneck(current, baseline) {
  const avgSale = current.revenuePerSale || baseline.revenuePerSale || null;

  const bookingGap = Math.max(0, (baseline.leadToAppointment || 0) - (current.leadToAppointment || 0));
  const salesGap = Math.max(0, (baseline.appointmentToSale || 0) - (current.appointmentToSale || 0));

  const bookingAdditionalAppointments = current.leads * bookingGap;
  const bookingAdditionalSales = bookingAdditionalAppointments * (current.appointmentToSale || baseline.appointmentToSale || 0);
  const bookingAdditionalRevenue = avgSale ? bookingAdditionalSales * avgSale : null;

  const salesAdditionalSales = current.appointments * salesGap;
  const salesAdditionalRevenue = avgSale ? salesAdditionalSales * avgSale : null;

  let primary = "No declining funnel bottleneck vs selected baseline";
  if (bookingAdditionalSales > salesAdditionalSales && bookingAdditionalSales > 0) {
    primary = "Lead → Appointment conversion";
  } else if (salesAdditionalSales > bookingAdditionalSales && salesAdditionalSales > 0) {
    primary = "Appointment → Sale conversion";
  } else if (salesAdditionalSales === bookingAdditionalSales && salesAdditionalSales > 0) {
    primary = "Lead handling and sales conversion are tied";
  }

  $("bottleneckOutput").innerHTML = `
    <h3>Primary bottleneck: ${primary}</h3>
    <p>
      This uses the company's selected baseline, not an external benchmark. It asks:
      what would happen if the current period restored each funnel rate back to its selected baseline?
    </p>
    <ul>
      <li>
        Lead → Appointment current: <strong>${formatPercent(current.leadToAppointment)}</strong>,
        baseline: <strong>${formatPercent(baseline.leadToAppointment)}</strong>.
        Restore-to-baseline scenario:
        <strong>${formatNumber(bookingAdditionalAppointments, 1)}</strong> additional appointments,
        <strong>${formatNumber(bookingAdditionalSales, 1)}</strong> additional sales,
        <strong>${formatCurrency(bookingAdditionalRevenue)}</strong> additional revenue.
      </li>
      <li>
        Appointment → Sale current: <strong>${formatPercent(current.appointmentToSale)}</strong>,
        baseline: <strong>${formatPercent(baseline.appointmentToSale)}</strong>.
        Restore-to-baseline scenario:
        <strong>${formatNumber(salesAdditionalSales, 1)}</strong> additional sales,
        <strong>${formatCurrency(salesAdditionalRevenue)}</strong> additional revenue.
      </li>
    </ul>
    <p class="note">
      This is scenario math, not a guarantee. It assumes lead volume and average sale value stay constant.
    </p>
  `;
}

function renderBudgetRanking(currentRows, baselineRows, groupLevel, scenarioBudget) {
  const groupKeys = groupLevel === "campaign" ? ["channel", "campaign"] : ["channel"];
  const currentGroups = groupRows(currentRows, groupKeys);
  const baselineGroups = groupRows(baselineRows, groupKeys);
  const baselineMap = new Map(
    baselineGroups.map(item => [groupKeys.map(k => item[k]).join("||"), item])
  );

  const ranked = currentGroups.map(item => {
    const key = groupKeys.map(k => item[k]).join("||");
    const base = baselineMap.get(key) || {};

    const projectedLeads = (item.leads && item.spend) ? scenarioBudget * (item.leads / item.spend) : null;
    const projectedAppointments = (item.appointments && item.spend) ? scenarioBudget * (item.appointments / item.spend) : null;
    const projectedSales = (item.sales && item.spend) ? scenarioBudget * (item.sales / item.spend) : null;
    const projectedRevenue = (item.revenue && item.spend) ? scenarioBudget * (item.revenue / item.spend) : null;

    return {
      ...item,
      label: groupLevel === "campaign" ? `${item.channel} / ${item.campaign}` : item.channel,
      baselineSalesPerDollar: safeDiv(base.sales || 0, base.spend || 0),
      baselineRevenuePerDollar: safeDiv(base.revenue || 0, base.spend || 0),
      selectedSalesPerDollar: safeDiv(item.sales, item.spend),
      selectedRevenuePerDollar: safeDiv(item.revenue, item.spend),
      projectedLeads,
      projectedAppointments,
      projectedSales,
      projectedRevenue
    };
  }).sort((a, b) => (b.projectedSales || 0) - (a.projectedSales || 0));

  const rows = ranked.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${formatCurrency(item.spend)}</td>
      <td>${formatNumber(item.leads)}</td>
      <td>${formatNumber(item.appointments)}</td>
      <td>${formatNumber(item.sales)}</td>
      <td>${formatCurrency(item.revenue)}</td>
      <td>${formatRatio(item.mer)}</td>
      <td>${formatNumber(item.selectedSalesPerDollar, 4)}</td>
      <td>${formatNumber(item.baselineSalesPerDollar, 4)}</td>
      <td>${formatNumber(item.projectedLeads, 1)}</td>
      <td>${formatNumber(item.projectedAppointments, 1)}</td>
      <td>${formatNumber(item.projectedSales, 1)}</td>
      <td>${formatCurrency(item.projectedRevenue)}</td>
    </tr>
  `).join("");

  $("budgetOutput").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>${groupLevel === "campaign" ? "Channel / Campaign" : "Channel"}</th>
          <th>Spend</th>
          <th>Leads</th>
          <th>Appointments</th>
          <th>Sales</th>
          <th>Revenue</th>
          <th>MER</th>
          <th>Selected Sales/$</th>
          <th>Baseline Sales/$</th>
          <th>+$ Leads</th>
          <th>+$ Appointments</th>
          <th>+$ Sales</th>
          <th>+$ Revenue</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="note">
      Ranking is based on actual selected-window sales per dollar. Baseline Sales/$ is shown to check whether the current result is consistent with a broader window.
      The +$ columns model a ${formatCurrency(scenarioBudget)} increase if current efficiency holds.
    </p>
  `;
}

function renderChannelTable(rows) {
  const groups = groupRows(rows, ["channel"]).sort((a, b) => b.revenue - a.revenue);
  $("channelTable").innerHTML = buildPerformanceTable(groups, ["channel"]);
}

function renderCampaignTable(rows) {
  const groups = groupRows(rows, ["channel", "campaign"]).sort((a, b) => b.revenue - a.revenue);
  $("campaignTable").innerHTML = buildPerformanceTable(groups, ["channel", "campaign"]);
}

function buildPerformanceTable(groups, labelKeys) {
  const labelHeader = labelKeys.length === 1 ? "Channel" : "Channel / Campaign";
  const body = groups.map(item => {
    const label = labelKeys.map(k => item[k]).join(" / ");
    return `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td>${formatCurrency(item.spend)}</td>
        <td>${formatNumber(item.leads)}</td>
        <td>${formatNumber(item.appointments)}</td>
        <td>${formatNumber(item.sales)}</td>
        <td>${formatCurrency(item.revenue)}</td>
        <td>${formatCurrency(item.cpl)}</td>
        <td>${formatCurrency(item.costPerAppointment)}</td>
        <td>${formatCurrency(item.costPerSale)}</td>
        <td>${formatRatio(item.mer)}</td>
        <td>${formatPercent(item.leadToAppointment)}</td>
        <td>${formatPercent(item.appointmentToSale)}</td>
        <td>${formatCurrency(item.revenuePerLead)}</td>
        <td>${formatCurrency(item.revenuePerSale)}</td>
      </tr>
    `;
  }).join("");

  return `
    <table>
      <thead>
        <tr>
          <th>${labelHeader}</th>
          <th>Spend</th>
          <th>Leads</th>
          <th>Appointments</th>
          <th>Sales</th>
          <th>Revenue</th>
          <th>CPL</th>
          <th>Cost/Appt</th>
          <th>Cost/Sale</th>
          <th>MER</th>
          <th>Lead→Appt</th>
          <th>Appt→Sale</th>
          <th>Revenue/Lead</th>
          <th>Revenue/Sale</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function renderTimeframeTable(rows, latest) {
  const windows = [
    ["7d", "Past 7 days"],
    ["mtd", "Month to date"],
    ["30d", "Past 30 days"],
    ["90d", "Past 90 days"],
    ["365d", "Past 365 days"]
  ];

  const tableRows = windows.map(([key, label]) => {
    const range = getWindowRange(key, latest);
    const data = summarize(filterByRange(rows, range));
    return `
      <tr>
        <td>${label}</td>
        <td>${toIsoDate(range.start)} to ${toIsoDate(range.end)}</td>
        <td>${formatCurrency(data.spend)}</td>
        <td>${formatNumber(data.leads)}</td>
        <td>${formatNumber(data.appointments)}</td>
        <td>${formatNumber(data.sales)}</td>
        <td>${formatCurrency(data.revenue)}</td>
        <td>${formatRatio(data.mer)}</td>
        <td>${formatPercent(data.leadToAppointment)}</td>
        <td>${formatPercent(data.appointmentToSale)}</td>
        <td>${formatCurrency(data.costPerSale)}</td>
      </tr>
    `;
  }).join("");

  $("timeframeTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Window</th>
          <th>Date Range</th>
          <th>Spend</th>
          <th>Leads</th>
          <th>Appointments</th>
          <th>Sales</th>
          <th>Revenue</th>
          <th>MER</th>
          <th>Lead→Appt</th>
          <th>Appt→Sale</th>
          <th>Cost/Sale</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showStatus(message) {
  const status = $("status");
  status.textContent = message;
  status.classList.remove("hidden");
}

function hideStatus() {
  $("status").classList.add("hidden");
}

function analyzeFromTextarea() {
  try {
    hideStatus();
    allRows = parseCsv($("csvInput").value);
    render();
  } catch (error) {
    showStatus(error.message);
    $("results").classList.add("hidden");
  }
}

function download(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

$("loadSampleBtn").addEventListener("click", () => {
  $("csvInput").value = sampleCsv;
  analyzeFromTextarea();
});

$("downloadSampleBtn").addEventListener("click", () => {
  download("growth-decision-engine-template.csv", "date,channel,campaign,spend,leads,appointments,sales,revenue\n2026-06-01,Meta,AC Replacement Offer,1000,20,8,2,24000\n", "text/csv");
});

$("analyzeBtn").addEventListener("click", analyzeFromTextarea);

$("clearBtn").addEventListener("click", () => {
  $("csvInput").value = "";
  allRows = [];
  $("results").classList.add("hidden");
  hideStatus();
});

$("csvFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  $("csvInput").value = text;
  analyzeFromTextarea();
});

["windowSelect", "baselineSelect", "budgetInput", "groupSelect"].forEach(id => {
  $(id).addEventListener("input", () => {
    if (allRows.length) render();
  });
});

// Auto-load sample on first visit for easier testing.
$("csvInput").value = sampleCsv;
analyzeFromTextarea();
