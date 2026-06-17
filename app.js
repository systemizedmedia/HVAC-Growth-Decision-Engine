/* Growth Decision Engine - Manual Input Version
   Plain JS, no dependencies, no CSV upload, no arbitrary weighted scoring.
*/

const WINDOWS = [
  { value: "7d", label: "Past 7 days" },
  { value: "mtd", label: "Month to date" },
  { value: "30d", label: "Past 30 days" },
  { value: "90d", label: "Past 90 days" },
  { value: "365d", label: "Past 365 days" }
];

const SAMPLE_ROWS = [
  ["7d", "Meta", "AC Replacement Financing", 8200, 110, 37, 9, 121500],
  ["7d", "Google Search", "Emergency AC Repair", 8000, 70, 46, 16, 208000],
  ["7d", "LSA", "HVAC Local Services", 4500, 39, 28, 10, 135000],

  ["mtd", "Meta", "AC Replacement Financing", 22000, 305, 103, 24, 324000],
  ["mtd", "Google Search", "Emergency AC Repair", 21500, 188, 124, 42, 546000],
  ["mtd", "LSA", "HVAC Local Services", 12800, 111, 79, 27, 364500],

  ["30d", "Meta", "AC Replacement Financing", 30000, 420, 140, 32, 432000],
  ["30d", "Google Search", "Emergency AC Repair", 28500, 250, 163, 55, 715000],
  ["30d", "LSA", "HVAC Local Services", 17000, 148, 105, 36, 486000],
  ["30d", "Meta", "Tune Up Offer", 12000, 260, 58, 6, 57000],

  ["90d", "Meta", "AC Replacement Financing", 86000, 1180, 400, 92, 1242000],
  ["90d", "Google Search", "Emergency AC Repair", 76000, 690, 450, 145, 1885000],
  ["90d", "LSA", "HVAC Local Services", 46000, 400, 285, 96, 1296000],
  ["90d", "Meta", "Tune Up Offer", 36000, 780, 170, 18, 171000],

  ["365d", "Meta", "AC Replacement Financing", 300000, 4250, 1485, 345, 4657500],
  ["365d", "Google Search", "Emergency AC Repair", 280000, 2580, 1675, 530, 6890000],
  ["365d", "LSA", "HVAC Local Services", 175000, 1540, 1080, 360, 4860000],
  ["365d", "Meta", "Tune Up Offer", 120000, 2650, 585, 62, 589000]
];

const $ = (id) => document.getElementById(id);

function createRow(values = ["mtd", "", "", "", "", "", "", ""]) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>
      <select class="timeframe">
        ${WINDOWS.map(w => `<option value="${w.value}">${w.label}</option>`).join("")}
      </select>
    </td>
    <td><input class="channel" type="text" placeholder="Meta" /></td>
    <td><input class="campaign" type="text" placeholder="Campaign name" /></td>
    <td><input class="spend" type="number" min="0" step="0.01" placeholder="0" /></td>
    <td><input class="leads" type="number" min="0" step="1" placeholder="0" /></td>
    <td><input class="appointments" type="number" min="0" step="1" placeholder="0" /></td>
    <td><input class="sales" type="number" min="0" step="1" placeholder="0" /></td>
    <td><input class="revenue" type="number" min="0" step="0.01" placeholder="0" /></td>
    <td><button class="remove-row" type="button">Remove</button></td>
  `;

  $("inputBody").appendChild(tr);

  tr.querySelector(".timeframe").value = values[0] || "mtd";
  tr.querySelector(".channel").value = values[1] || "";
  tr.querySelector(".campaign").value = values[2] || "";
  tr.querySelector(".spend").value = values[3] ?? "";
  tr.querySelector(".leads").value = values[4] ?? "";
  tr.querySelector(".appointments").value = values[5] ?? "";
  tr.querySelector(".sales").value = values[6] ?? "";
  tr.querySelector(".revenue").value = values[7] ?? "";

  tr.querySelector(".remove-row").addEventListener("click", () => {
    tr.remove();
  });
}

function collectRows() {
  const rows = [];
  const trs = [...$("inputBody").querySelectorAll("tr")];

  for (const tr of trs) {
    const timeframe = tr.querySelector(".timeframe").value;
    const channel = cleanText(tr.querySelector(".channel").value) || "Unknown";
    const campaign = cleanText(tr.querySelector(".campaign").value) || "Unspecified";

    const row = {
      timeframe,
      channel,
      campaign,
      spend: toNumber(tr.querySelector(".spend").value),
      leads: toNumber(tr.querySelector(".leads").value),
      appointments: toNumber(tr.querySelector(".appointments").value),
      sales: toNumber(tr.querySelector(".sales").value),
      revenue: toNumber(tr.querySelector(".revenue").value)
    };

    const hasAnyNumbers = row.spend || row.leads || row.appointments || row.sales || row.revenue;
    if (hasAnyNumbers) rows.push(row);
  }

  return rows;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function safeDiv(a, b) {
  if (!b || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a / b;
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

function rowsForWindow(rows, windowKey) {
  return rows.filter(row => row.timeframe === windowKey);
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

function analyze() {
  const rows = collectRows();

  if (!rows.length) {
    showStatus("Add at least one row with numbers before analyzing.");
    $("results").classList.add("hidden");
    return;
  }

  hideStatus();

  const currentWindow = $("currentWindow").value;
  const baselineWindow = $("baselineWindow").value;
  const currentRows = rowsForWindow(rows, currentWindow);
  const baselineRows = rowsForWindow(rows, baselineWindow);

  if (!currentRows.length) {
    showStatus(`No rows found for selected primary timeframe: ${getWindowLabel(currentWindow)}.`);
    $("results").classList.add("hidden");
    return;
  }

  if (!baselineRows.length) {
    showStatus(`No rows found for selected baseline timeframe: ${getWindowLabel(baselineWindow)}.`);
    $("results").classList.add("hidden");
    return;
  }

  const current = summarize(currentRows);
  const baseline = summarize(baselineRows);

  $("results").classList.remove("hidden");
  $("selectedWindowLabel").textContent = `Primary timeframe: ${getWindowLabel(currentWindow)}. Baseline: ${getWindowLabel(baselineWindow)}.`;

  $("totalSpend").textContent = formatCurrency(current.spend);
  $("totalRevenue").textContent = formatCurrency(current.revenue);
  $("totalMer").textContent = formatRatio(current.mer);
  $("totalSales").textContent = formatNumber(current.sales);
  $("leadToAppt").textContent = formatPercent(current.leadToAppointment);
  $("apptToSale").textContent = formatPercent(current.appointmentToSale);

  renderDiagnosticCards(current, baseline, currentRows, baselineRows);
  renderBottleneck(current, baseline);
  renderBudgetRanking(currentRows, baselineRows);
  renderChannelTable(currentRows);
  renderCampaignTable(currentRows);
  renderTimeframeTable(rows);
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
      label: "Current data volume",
      value: `${formatNumber(currentRows.length)} rows`,
      detail: `${formatNumber(current.leads)} leads, ${formatNumber(current.appointments)} appointments, ${formatNumber(current.sales)} sales`
    },
    {
      label: "Revenue availability",
      value: current.revenue > 0 ? "Revenue included" : "No revenue",
      detail: current.revenue > 0 ? "MER and revenue metrics are available." : "MER cannot be calculated without revenue."
    },
    {
      label: "Baseline data volume",
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
      This compares the primary timeframe to the selected baseline. It does not use external benchmarks or arbitrary weights.
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

function renderBudgetRanking(currentRows, baselineRows) {
  const level = $("rankLevel").value;
  const scenarioBudget = Number($("budgetInput").value || 0);
  const groupKeys = level === "campaign" ? ["channel", "campaign"] : ["channel"];

  const currentGroups = groupRows(currentRows, groupKeys);
  const baselineGroups = groupRows(baselineRows, groupKeys);
  const baselineMap = new Map(
    baselineGroups.map(item => [groupKeys.map(k => item[k]).join("||"), item])
  );

  const ranked = currentGroups.map(item => {
    const key = groupKeys.map(k => item[k]).join("||");
    const base = baselineMap.get(key) || {};

    return {
      ...item,
      label: level === "campaign" ? `${item.channel} / ${item.campaign}` : item.channel,
      selectedSalesPerDollar: safeDiv(item.sales, item.spend),
      baselineSalesPerDollar: safeDiv(base.sales || 0, base.spend || 0),
      projectedLeads: item.spend ? scenarioBudget * (item.leads / item.spend) : null,
      projectedAppointments: item.spend ? scenarioBudget * (item.appointments / item.spend) : null,
      projectedSales: item.spend ? scenarioBudget * (item.sales / item.spend) : null,
      projectedRevenue: item.spend ? scenarioBudget * (item.revenue / item.spend) : null
    };
  }).sort((a, b) => (b.projectedSales || 0) - (a.projectedSales || 0));

  const body = ranked.map((item, index) => `
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
          <th>${level === "campaign" ? "Channel / Campaign" : "Channel"}</th>
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
      <tbody>${body}</tbody>
    </table>
    <p class="note">
      This models what a ${formatCurrency(scenarioBudget)} increase would be associated with if the selected timeframe's current efficiency held.
      It is not a guaranteed forecast.
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

function renderTimeframeTable(rows) {
  const body = WINDOWS.map(w => {
    const data = summarize(rowsForWindow(rows, w.value));
    return `
      <tr>
        <td>${w.label}</td>
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
          <th>Timeframe</th>
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
      <tbody>${body}</tbody>
    </table>
  `;
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

function getWindowLabel(value) {
  return WINDOWS.find(w => w.value === value)?.label || value;
}

function pctChange(current, baseline) {
  if (baseline === null || baseline === undefined || baseline === 0 || current === null || current === undefined) return null;
  return (current - baseline) / baseline;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showStatus(message) {
  $("status").textContent = message;
  $("status").classList.remove("hidden");
}

function hideStatus() {
  $("status").classList.add("hidden");
}

function clearTable() {
  $("inputBody").innerHTML = "";
}

function loadSample() {
  clearTable();
  SAMPLE_ROWS.forEach(row => createRow(row));
  analyze();
}

function saveInputs() {
  const rows = collectRows();
  localStorage.setItem("growthDecisionEngineRows", JSON.stringify(rows));
  showStatus("Inputs saved in this browser.");
}

function loadSavedOrSample() {
  const saved = localStorage.getItem("growthDecisionEngineRows");
  if (saved) {
    try {
      const rows = JSON.parse(saved);
      clearTable();
      rows.forEach(row => createRow([
        row.timeframe,
        row.channel,
        row.campaign,
        row.spend,
        row.leads,
        row.appointments,
        row.sales,
        row.revenue
      ]));
      analyze();
      return;
    } catch (e) {
      localStorage.removeItem("growthDecisionEngineRows");
    }
  }

  loadSample();
}

$("addRowBtn").addEventListener("click", () => createRow());
$("loadSampleBtn").addEventListener("click", loadSample);
$("clearRowsBtn").addEventListener("click", () => {
  clearTable();
  createRow();
  $("results").classList.add("hidden");
  hideStatus();
});
$("analyzeBtn").addEventListener("click", analyze);
$("saveBtn").addEventListener("click", saveInputs);

["currentWindow", "baselineWindow", "budgetInput", "rankLevel"].forEach(id => {
  $(id).addEventListener("input", () => {
    if (collectRows().length) analyze();
  });
});

loadSavedOrSample();
