/* Growth Decision Engine - Channel Input Version
   User chooses one analysis timeframe, then enters channel/platform data for that same timeframe.
   Plain JS, no dependencies, no arbitrary weighted scoring.
*/

const SAMPLE_ROWS = [
  ["Meta", "AC Replacement Financing", 30000, 420, 140, 32, 432000],
  ["Google Search", "Emergency AC Repair", 28500, 250, 163, 55, 715000],
  ["LSA", "HVAC Local Services", 17000, 148, 105, 36, 486000],
  ["Meta", "Tune Up Offer", 12000, 260, 58, 6, 57000]
];

const $ = (id) => document.getElementById(id);

function createRow(values = ["", "", "", "", "", "", ""]) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="channel" type="text" placeholder="Meta, Google, LSA, SEO" /></td>
    <td><input class="campaign" type="text" placeholder="Optional" /></td>
    <td><input class="spend" type="text" inputmode="decimal" placeholder="0" /></td>
    <td><input class="leads" type="text" inputmode="numeric" placeholder="0" /></td>
    <td><input class="appointments" type="text" inputmode="numeric" placeholder="0" /></td>
    <td><input class="sales" type="text" inputmode="numeric" placeholder="0" /></td>
    <td><input class="revenue" type="text" inputmode="decimal" placeholder="0" /></td>
    <td><button class="remove-row" type="button">Remove</button></td>
  `;

  $("inputBody").appendChild(tr);

  tr.querySelector(".channel").value = values[0] || "";
  tr.querySelector(".campaign").value = values[1] || "";
  tr.querySelector(".spend").value = values[2] ?? "";
  tr.querySelector(".leads").value = values[3] ?? "";
  tr.querySelector(".appointments").value = values[4] ?? "";
  tr.querySelector(".sales").value = values[5] ?? "";
  tr.querySelector(".revenue").value = values[6] ?? "";

  tr.querySelector(".remove-row").addEventListener("click", () => {
    tr.remove();
  });
}

function collectRows() {
  const rows = [];
  const trs = [...$("inputBody").querySelectorAll("tr")];

  for (const tr of trs) {
    const channel = cleanText(tr.querySelector(".channel").value) || "Unknown";
    const campaign = cleanText(tr.querySelector(".campaign").value) || "Unspecified";

    const row = {
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
  const cleaned = String(value).replace(/[$,%\s,]/g, "");
  const n = Number(cleaned);
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
  t.leadsPerDollar = safeDiv(t.leads, t.spend);
  t.appointmentsPerDollar = safeDiv(t.appointments, t.spend);
  t.salesPerDollar = safeDiv(t.sales, t.spend);
  t.revenuePerDollar = safeDiv(t.revenue, t.spend);
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
    showStatus("Add at least one channel with numbers before analyzing.");
    $("results").classList.add("hidden");
    return;
  }

  hideStatus();

  const timeframe = cleanText($("timeframeName").value) || "Selected Timeframe";
  const summary = summarize(rows);

  $("results").classList.remove("hidden");
  $("selectedWindowLabel").textContent = `Analysis timeframe: ${timeframe}. All rows should use data from this same timeframe.`;

  $("totalSpend").textContent = formatCurrency(summary.spend);
  $("totalRevenue").textContent = formatCurrency(summary.revenue);
  $("totalMer").textContent = formatRatio(summary.mer);
  $("totalSales").textContent = formatNumber(summary.sales);
  $("leadToAppt").textContent = formatPercent(summary.leadToAppointment);
  $("apptToSale").textContent = formatPercent(summary.appointmentToSale);

  renderDiagnosticCards(summary, rows);
  renderBudgetRanking(rows);
  renderBottleneck(summary);
  renderChannelTable(rows);
  renderCampaignTable(rows);
}

function renderDiagnosticCards(summary, rows) {
  const channelGroups = groupRows(rows, ["channel"]);
  const bestBySales = [...channelGroups].sort((a, b) => (b.salesPerDollar || 0) - (a.salesPerDollar || 0))[0];
  const bestByMer = [...channelGroups].sort((a, b) => (b.mer || 0) - (a.mer || 0))[0];
  const bestByAppt = [...channelGroups].sort((a, b) => (b.appointmentsPerDollar || 0) - (a.appointmentsPerDollar || 0))[0];

  const cards = [
    {
      label: "Best Sales Efficiency",
      value: bestBySales ? bestBySales.channel : "N/A",
      detail: bestBySales ? `${formatNumber(bestBySales.salesPerDollar, 4)} sales per $1 spent` : "No channel data available."
    },
    {
      label: "Best MER",
      value: bestByMer ? bestByMer.channel : "N/A",
      detail: bestByMer ? `${formatRatio(bestByMer.mer)} MER` : "Revenue is required for MER."
    },
    {
      label: "Best Appointment Efficiency",
      value: bestByAppt ? bestByAppt.channel : "N/A",
      detail: bestByAppt ? `${formatNumber(bestByAppt.appointmentsPerDollar, 4)} appointments per $1 spent` : "No appointment data available."
    },
    {
      label: "Overall Funnel",
      value: `${formatPercent(summary.leadToAppointment)} → ${formatPercent(summary.appointmentToSale)}`,
      detail: "Lead → Appointment, then Appointment → Sale."
    },
    {
      label: "Revenue Availability",
      value: summary.revenue > 0 ? "Revenue included" : "No revenue",
      detail: summary.revenue > 0 ? "MER and revenue metrics are available." : "MER cannot be calculated without revenue."
    },
    {
      label: "Channels Entered",
      value: formatNumber(channelGroups.length),
      detail: `${formatNumber(rows.length)} total rows entered.`
    }
  ];

  $("diagnosticCards").innerHTML = cards.map(card => `
    <div class="diagnostic-card">
      <span class="badge info">${card.label}</span>
      <h3>${escapeHtml(card.value)}</h3>
      <p>${card.detail}</p>
    </div>
  `).join("");
}

function renderBottleneck(summary) {
  const leadsNotBooked = Math.max(0, summary.leads - summary.appointments);
  const appointmentsNotSold = Math.max(0, summary.appointments - summary.sales);

  const lostAtBookingRate = safeDiv(leadsNotBooked, summary.leads);
  const lostAtSalesRate = safeDiv(appointmentsNotSold, summary.appointments);

  let primary = "No bottleneck available";
  if (summary.leads > 0 && summary.appointments > 0) {
    primary = lostAtBookingRate > lostAtSalesRate
      ? "Lead → Appointment conversion"
      : "Appointment → Sale conversion";
  } else if (summary.leads > 0) {
    primary = "Lead → Appointment conversion";
  }

  $("bottleneckOutput").innerHTML = `
    <h3>Current largest funnel leak: ${primary}</h3>
    <p>
      This uses only the selected timeframe. It does not compare to external benchmarks or use weighted scoring.
    </p>
    <ul>
      <li>
        Leads not booked:
        <strong>${formatNumber(leadsNotBooked)}</strong>
        out of <strong>${formatNumber(summary.leads)}</strong>
        leads.
      </li>
      <li>
        Appointments not sold:
        <strong>${formatNumber(appointmentsNotSold)}</strong>
        out of <strong>${formatNumber(summary.appointments)}</strong>
        appointments.
      </li>
      <li>
        Revenue per sale:
        <strong>${formatCurrency(summary.revenuePerSale)}</strong>
      </li>
    </ul>
    <p class="note">
      For a stronger bottleneck diagnosis, compare the same company across another timeframe separately, such as 7D vs 30D or 30D vs 90D.
    </p>
  `;
}

function renderBudgetRanking(rows) {
  const level = $("rankLevel").value;
  const scenarioBudget = toNumber($("budgetInput").value);
  const groupKeys = level === "campaign" ? ["channel", "campaign"] : ["channel"];

  const groups = groupRows(rows, groupKeys);

  const ranked = groups.map(item => {
    return {
      ...item,
      label: level === "campaign" ? `${item.channel} / ${item.campaign}` : item.channel,
      projectedLeads: item.spend ? scenarioBudget * (item.leads / item.spend) : null,
      projectedAppointments: item.spend ? scenarioBudget * (item.appointments / item.spend) : null,
      projectedSales: item.spend ? scenarioBudget * (item.sales / item.spend) : null,
      projectedRevenue: item.spend ? scenarioBudget * (item.revenue / item.spend) : null
    };
  }).sort((a, b) => {
    const salesDiff = (b.projectedSales || 0) - (a.projectedSales || 0);
    if (salesDiff !== 0) return salesDiff;
    return (b.projectedRevenue || 0) - (a.projectedRevenue || 0);
  });

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
      <td>${formatNumber(item.salesPerDollar, 4)}</td>
      <td>${formatNumber(item.appointmentsPerDollar, 4)}</td>
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
          <th>Sales/$</th>
          <th>Appts/$</th>
          <th>+$ Leads</th>
          <th>+$ Appointments</th>
          <th>+$ Sales</th>
          <th>+$ Revenue</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
    <p class="note">
      This models what a ${formatCurrency(scenarioBudget)} increase would be associated with if the entered timeframe's efficiency held.
      This is scenario math, not a guaranteed forecast.
    </p>
  `;
}

function renderChannelTable(rows) {
  const groups = groupRows(rows, ["channel"]).sort((a, b) => b.sales - a.sales);
  $("channelTable").innerHTML = buildPerformanceTable(groups, ["channel"]);
}

function renderCampaignTable(rows) {
  const groups = groupRows(rows, ["channel", "campaign"]).sort((a, b) => b.sales - a.sales);
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
  $("timeframeName").value = "Past 30 Days";
  clearTable();
  SAMPLE_ROWS.forEach(row => createRow(row));
  analyze();
}

function saveInputs() {
  const payload = {
    timeframeName: $("timeframeName").value,
    budgetInput: $("budgetInput").value,
    rankLevel: $("rankLevel").value,
    rows: collectRows()
  };

  localStorage.setItem("growthDecisionEngineChannelRows", JSON.stringify(payload));
  showStatus("Inputs saved in this browser.");
}

function loadSavedOrSample() {
  const saved = localStorage.getItem("growthDecisionEngineChannelRows");

  if (saved) {
    try {
      const payload = JSON.parse(saved);
      $("timeframeName").value = payload.timeframeName || "Past 30 Days";
      $("budgetInput").value = payload.budgetInput || "10000";
      $("rankLevel").value = payload.rankLevel || "channel";

      clearTable();
      payload.rows.forEach(row => createRow([
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
      localStorage.removeItem("growthDecisionEngineChannelRows");
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

["timeframeName", "budgetInput", "rankLevel"].forEach(id => {
  $(id).addEventListener("input", () => {
    if (collectRows().length) analyze();
  });
});

loadSavedOrSample();
