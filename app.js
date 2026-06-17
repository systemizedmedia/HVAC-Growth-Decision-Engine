/* Growth Decision Engine - Budget Allocation Version
   User chooses one analysis timeframe, enters channel/platform data, and models extra budget allocation.
   Plain JS, no dependencies, no arbitrary weighted scoring.
*/

const SAMPLE_ROWS = [
  [true, "Meta", "AC Replacement Financing", 30000, 420, 140, 32, 432000],
  [true, "Google Search", "Emergency AC Repair", 28500, 250, 163, 55, 715000],
  [true, "LSA", "HVAC Local Services", 17000, 148, 105, 36, 486000],
  [true, "Meta", "Tune Up Offer", 12000, 260, 58, 6, 57000]
];

const OBJECTIVE_LABELS = {
  leads: "Leads",
  appointments: "Appointments",
  sales: "Closed Jobs",
  revenue: "Revenue"
};

const $ = (id) => document.getElementById(id);

function createRow(values = [true, "", "", "", "", "", "", ""]) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="include" type="checkbox" checked /></td>
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

  tr.querySelector(".include").checked = values[0] !== false;
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
    const channel = cleanText(tr.querySelector(".channel").value) || "Unknown";
    const campaign = cleanText(tr.querySelector(".campaign").value) || "Unspecified";

    const row = {
      include: tr.querySelector(".include").checked,
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
      const base = { include: false, spend: 0, leads: 0, appointments: 0, sales: 0, revenue: 0 };
      keys.forEach(k => base[k] = row[k]);
      map.set(key, base);
    }

    const item = map.get(key);
    item.include = item.include || row.include;
    item.spend += row.spend;
    item.leads += row.leads;
    item.appointments += row.appointments;
    item.sales += row.sales;
    item.revenue += row.revenue;
  }

  return [...map.values()].map(addMetrics);
}

function getObjectiveMetric(item, objective) {
  if (objective === "leads") return item.leadsPerDollar || 0;
  if (objective === "appointments") return item.appointmentsPerDollar || 0;
  if (objective === "sales") return item.salesPerDollar || 0;
  if (objective === "revenue") return item.revenuePerDollar || 0;
  return item.salesPerDollar || 0;
}

function getProjectedValue(item, objective, budget) {
  return budget * getObjectiveMetric(item, objective);
}


function getCompanyMerInputs(rowSummary) {
  const companyRevenue = toNumber($("companyRevenueInput")?.value || "");
  const companyMarketingSpend = toNumber($("companyMarketingSpendInput")?.value || "");

  const merRevenue = companyRevenue > 0 ? companyRevenue : rowSummary.revenue;
  const merSpend = companyMarketingSpend > 0 ? companyMarketingSpend : rowSummary.spend;

  return {
    merRevenue,
    merSpend,
    companyMer: safeDiv(merRevenue, merSpend),
    usesCompanyRevenue: companyRevenue > 0,
    usesCompanySpend: companyMarketingSpend > 0
  };
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

  const merInputs = getCompanyMerInputs(summary);

  $("totalSpend").textContent = formatCurrency(summary.spend);
  $("totalRevenue").textContent = formatCurrency(summary.revenue);
  $("totalMer").textContent = formatRatio(merInputs.companyMer);
  $("totalSales").textContent = formatNumber(summary.sales);
  $("leadToAppt").textContent = formatPercent(summary.leadToAppointment);
  $("apptToSale").textContent = formatPercent(summary.appointmentToSale);

  renderDiagnosticCards(summary, rows, merInputs);
  renderAllocation(rows);
  renderSpecificScenarios(rows);
  renderBottleneck(summary);
  renderChannelTable(rows);
  renderCampaignTable(rows);
}

function renderDiagnosticCards(summary, rows, merInputs) {
  const level = $("rankLevel").value;
  const keys = level === "campaign" ? ["channel", "campaign"] : ["channel"];
  const groups = groupRows(rows, keys);
  const objective = $("objectiveSelect").value;
  const bestByObjective = [...groups].sort((a, b) => getObjectiveMetric(b, objective) - getObjectiveMetric(a, objective))[0];
  const bestByMer = [...groups].sort((a, b) => (b.mer || 0) - (a.mer || 0))[0];
  const bestByAppt = [...groups].sort((a, b) => (b.appointmentsPerDollar || 0) - (a.appointmentsPerDollar || 0))[0];

  const cards = [
    {
      label: `Best ${OBJECTIVE_LABELS[objective]} Efficiency`,
      value: bestByObjective ? getGroupLabel(bestByObjective, level) : "N/A",
      detail: bestByObjective ? `${formatNumber(getObjectiveMetric(bestByObjective, objective), 4)} ${OBJECTIVE_LABELS[objective].toLowerCase()} per $1 spent` : "No data available."
    },
    {
      label: "Best Channel Revenue Efficiency",
      value: bestByMer ? getGroupLabel(bestByMer, level) : "N/A",
      detail: bestByMer ? `${formatRatio(bestByMer.mer)} revenue per $1 spent` : "Revenue is required for channel revenue efficiency."
    },
    {
      label: "Best Appointment Efficiency",
      value: bestByAppt ? getGroupLabel(bestByAppt, level) : "N/A",
      detail: bestByAppt ? `${formatNumber(bestByAppt.appointmentsPerDollar, 4)} appointments per $1 spent` : "No appointment data available."
    },
    {
      label: "Overall Funnel",
      value: `${formatPercent(summary.leadToAppointment)} → ${formatPercent(summary.appointmentToSale)}`,
      detail: "Lead → Appointment, then Appointment → Closed Job."
    },
    {
      label: "Company MER Basis",
      value: formatRatio(merInputs.companyMer),
      detail: `MER uses ${merInputs.usesCompanyRevenue ? "company revenue input" : "summed row revenue"} ÷ ${merInputs.usesCompanySpend ? "marketing spend input" : "summed row spend"}.`
    },
    {
      label: "Rows Entered",
      value: formatNumber(rows.length),
      detail: `${formatNumber(rows.filter(r => r.include).length)} rows included in allocation.`
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

function renderAllocation(rows) {
  const level = $("rankLevel").value;
  const objective = $("objectiveSelect").value;
  const scenarioBudget = toNumber($("budgetInput").value);
  const keys = level === "campaign" ? ["channel", "campaign"] : ["channel"];
  const groups = groupRows(rows, keys).filter(g => g.include && g.spend > 0);

  if (!groups.length || !scenarioBudget) {
    $("allocationOutput").innerHTML = `
      <div class="allocation-card">
        <h3>No allocation available</h3>
        <p>Check at least one row and enter an extra budget amount.</p>
      </div>
    `;
    return;
  }

  const ranked = [...groups].sort((a, b) => getObjectiveMetric(b, objective) - getObjectiveMetric(a, objective));
  const best = ranked[0];

  const bestProjected = projectFromBudget(best, scenarioBudget);

  const totalObjectiveRate = groups.reduce((sum, item) => sum + getObjectiveMetric(item, objective), 0);
  const proportional = groups.map(item => {
    const rate = getObjectiveMetric(item, objective);
    const allocatedBudget = totalObjectiveRate ? scenarioBudget * (rate / totalObjectiveRate) : 0;
    return {
      item,
      allocatedBudget,
      projection: projectFromBudget(item, allocatedBudget)
    };
  });

  const propTotals = proportional.reduce((acc, row) => {
    acc.budget += row.allocatedBudget;
    acc.leads += row.projection.leads;
    acc.appointments += row.projection.appointments;
    acc.sales += row.projection.sales;
    acc.revenue += row.projection.revenue;
    return acc;
  }, { budget: 0, leads: 0, appointments: 0, sales: 0, revenue: 0 });

  const proportionalRows = proportional
    .sort((a, b) => b.allocatedBudget - a.allocatedBudget)
    .map(row => `
      <tr>
        <td>${escapeHtml(getGroupLabel(row.item, level))}</td>
        <td>${formatCurrency(row.allocatedBudget)}</td>
        <td>${formatNumber(row.projection.leads, 1)}</td>
        <td>${formatNumber(row.projection.appointments, 1)}</td>
        <td>${formatNumber(row.projection.sales, 1)}</td>
        <td>${formatCurrency(row.projection.revenue)}</td>
      </tr>
    `).join("");

  $("allocationOutput").innerHTML = `
    <div class="allocation-card">
      <span class="badge good">Best Single Allocation</span>
      <h3>Put the full ${formatCurrency(scenarioBudget)} into:</h3>
      <div class="big">${escapeHtml(getGroupLabel(best, level))}</div>
      <p>
        This has the highest ${OBJECTIVE_LABELS[objective].toLowerCase()} per dollar among checked rows.
      </p>
      <ul>
        <li>Projected leads: <strong>${formatNumber(bestProjected.leads, 1)}</strong></li>
        <li>Projected appointments: <strong>${formatNumber(bestProjected.appointments, 1)}</strong></li>
        <li>Projected closed jobs: <strong>${formatNumber(bestProjected.sales, 1)}</strong></li>
        <li>Projected revenue: <strong>${formatCurrency(bestProjected.revenue)}</strong></li>
      </ul>
    </div>

    <div class="allocation-card">
      <span class="badge info">Proportional Allocation</span>
      <h3>Split ${formatCurrency(scenarioBudget)} based on ${OBJECTIVE_LABELS[objective].toLowerCase()} efficiency</h3>
      <p>
        This spreads budget across checked rows in proportion to their actual ${OBJECTIVE_LABELS[objective].toLowerCase()} per dollar.
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>${level === "campaign" ? "Channel / Campaign" : "Channel"}</th>
              <th>Budget</th>
              <th>Leads</th>
              <th>Appointments</th>
              <th>Closed Jobs</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${proportionalRows}
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>${formatCurrency(propTotals.budget)}</strong></td>
              <td><strong>${formatNumber(propTotals.leads, 1)}</strong></td>
              <td><strong>${formatNumber(propTotals.appointments, 1)}</strong></td>
              <td><strong>${formatNumber(propTotals.sales, 1)}</strong></td>
              <td><strong>${formatCurrency(propTotals.revenue)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSpecificScenarios(rows) {
  const level = $("rankLevel").value;
  const objective = $("objectiveSelect").value;
  const scenarioBudget = toNumber($("budgetInput").value);
  const keys = level === "campaign" ? ["channel", "campaign"] : ["channel"];
  const groups = groupRows(rows, keys);

  const ranked = groups.map(item => {
    return {
      ...item,
      label: getGroupLabel(item, level),
      projection: projectFromBudget(item, scenarioBudget),
      objectiveRate: getObjectiveMetric(item, objective)
    };
  }).sort((a, b) => b.objectiveRate - a.objectiveRate);

  const body = ranked.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.label)}</td>
      <td>${item.include ? "Yes" : "No"}</td>
      <td>${formatCurrency(item.spend)}</td>
      <td>${formatNumber(item.leads)}</td>
      <td>${formatNumber(item.appointments)}</td>
      <td>${formatNumber(item.sales)}</td>
      <td>${formatCurrency(item.revenue)}</td>
      <td>${formatRatio(item.mer)}</td>
      <td>${formatNumber(item.objectiveRate, 4)}</td>
      <td>${formatNumber(item.projection.leads, 1)}</td>
      <td>${formatNumber(item.projection.appointments, 1)}</td>
      <td>${formatNumber(item.projection.sales, 1)}</td>
      <td>${formatCurrency(item.projection.revenue)}</td>
    </tr>
  `).join("");

  $("scenarioOutput").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>${level === "campaign" ? "Channel / Campaign" : "Channel"}</th>
          <th>Included?</th>
          <th>Current Spend</th>
          <th>Leads</th>
          <th>Appointments</th>
          <th>Closed Jobs</th>
          <th>Revenue</th>
          <th>Rev/Spend</th>
          <th>${OBJECTIVE_LABELS[objective]}/$</th>
          <th>If full budget goes here: Leads</th>
          <th>Appointments</th>
          <th>Closed Jobs</th>
          <th>Revenue</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
    <p class="note">
      Each row is a separate scenario: what happens if the full ${formatCurrency(scenarioBudget)} goes only to that channel or campaign.
    </p>
  `;
}

function projectFromBudget(item, budget) {
  return {
    leads: item.spend ? budget * (item.leads / item.spend) : 0,
    appointments: item.spend ? budget * (item.appointments / item.spend) : 0,
    sales: item.spend ? budget * (item.sales / item.spend) : 0,
    revenue: item.spend ? budget * (item.revenue / item.spend) : 0
  };
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
      : "Appointment → Closed Job conversion";
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
        Appointments not closed:
        <strong>${formatNumber(appointmentsNotSold)}</strong>
        out of <strong>${formatNumber(summary.appointments)}</strong>
        appointments.
      </li>
      <li>
        Revenue per closed job:
        <strong>${formatCurrency(summary.revenuePerSale)}</strong>
      </li>
    </ul>
    <p class="note">
      For a stronger bottleneck diagnosis, compare the same company across another timeframe separately, such as 7D vs 30D or 30D vs 90D.
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
          <th>Closed Jobs</th>
          <th>Revenue</th>
          <th>CPL</th>
          <th>Cost/Appt</th>
          <th>Cost/Closed Job</th>
          <th>Rev/Spend</th>
          <th>Lead→Appt</th>
          <th>Appt→Closed</th>
          <th>Revenue/Lead</th>
          <th>Revenue/Closed Job</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function getGroupLabel(item, level) {
  return level === "campaign" ? `${item.channel} / ${item.campaign}` : item.channel;
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
  $("companyRevenueInput").value = "";
  $("companyMarketingSpendInput").value = "";
  clearTable();
  SAMPLE_ROWS.forEach(row => createRow(row));
  analyze();
}

function saveInputs() {
  const payload = {
    timeframeName: $("timeframeName").value,
    budgetInput: $("budgetInput").value,
    rankLevel: $("rankLevel").value,
    objectiveSelect: $("objectiveSelect").value,
    companyRevenueInput: $("companyRevenueInput").value,
    companyMarketingSpendInput: $("companyMarketingSpendInput").value,
    rows: collectRows()
  };

  localStorage.setItem("growthDecisionEngineBudgetAllocationRows", JSON.stringify(payload));
  showStatus("Inputs saved in this browser.");
}

function loadSavedOrSample() {
  const saved = localStorage.getItem("growthDecisionEngineBudgetAllocationRows");

  if (saved) {
    try {
      const payload = JSON.parse(saved);
      $("timeframeName").value = payload.timeframeName || "Past 30 Days";
      $("budgetInput").value = payload.budgetInput || "10000";
      $("rankLevel").value = payload.rankLevel || "channel";
      $("objectiveSelect").value = payload.objectiveSelect || "sales";
      $("companyRevenueInput").value = payload.companyRevenueInput || "";
      $("companyMarketingSpendInput").value = payload.companyMarketingSpendInput || "";

      clearTable();
      payload.rows.forEach(row => createRow([
        row.include,
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
      localStorage.removeItem("growthDecisionEngineBudgetAllocationRows");
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

["timeframeName", "budgetInput", "rankLevel", "objectiveSelect", "companyRevenueInput", "companyMarketingSpendInput"].forEach(id => {
  $(id).addEventListener("input", () => {
    if (collectRows().length) analyze();
  });
});

loadSavedOrSample();
