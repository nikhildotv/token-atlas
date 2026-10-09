(function () {
  const data = window.TOKEN_ATLAS_DATA;
  if (!data || typeof Chart === "undefined") return;

  const fmtCompact = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const fmtCurrency = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const fmtPct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

  document.getElementById("as-of").textContent = `As of ${new Date(
    data.asOf
  ).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })} UTC`;

  const s = data.summary;
  document.getElementById("metric-total").textContent = fmtCompact.format(
    s.totalTokens
  );
  document.getElementById("metric-total-delta").textContent =
    `${fmtPct(s.totalTokensDeltaPct)} vs prior 30d`;

  document.getElementById("metric-io").textContent =
    `${fmtCompact.format(s.inputTokens)} / ${fmtCompact.format(s.outputTokens)}`;
  const inShare = (s.inputTokens / s.totalTokens) * 100;
  document.getElementById("metric-io-split").textContent =
    `${inShare.toFixed(0)}% input · ${(100 - inShare).toFixed(0)}% output`;

  document.getElementById("metric-regions").textContent = String(
    s.activeRegions
  );
  document.getElementById("metric-top-region").textContent =
    `Top: ${s.topRegion}`;

  document.getElementById("metric-spend").textContent = fmtCurrency.format(
    s.estimatedSpendUsd
  );
  const spendEl = document.getElementById("metric-spend-delta");
  spendEl.textContent = `${fmtPct(s.spendDeltaPct)} vs prior 30d`;
  spendEl.className = `metric-delta ${s.spendDeltaPct < 0 ? "down" : "up"}`;

  const labels = data.daily.map((d) =>
    new Date(d.date + "T00:00:00Z").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })
  );

  const gridColor = "rgba(143, 163, 179, 0.12)";
  const tickColor = "#8fa3b3";

  Chart.defaults.color = tickColor;
  Chart.defaults.font.family = "'Outfit', sans-serif";

  new Chart(document.getElementById("trend-chart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Input (M)",
          data: data.daily.map((d) => d.input),
          borderColor: "#2ec4b6",
          backgroundColor: "rgba(46, 196, 182, 0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: "Output (M)",
          data: data.daily.map((d) => d.output),
          borderColor: "#f0a05a",
          backgroundColor: "rgba(240, 160, 90, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { boxWidth: 10, usePointStyle: true, pointStyle: "circle" },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, color: tickColor },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            callback: (v) => `${v}M`,
          },
        },
      },
    },
  });

  const regionTotal = data.regions.reduce((a, r) => a + r.tokens, 0);
  new Chart(document.getElementById("region-chart"), {
    type: "doughnut",
    data: {
      labels: data.regions.map((r) => r.name),
      datasets: [
        {
          data: data.regions.map((r) => r.tokens),
          backgroundColor: data.regions.map((r) => r.color),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      cutout: "68%",
      plugins: {
        legend: { display: false },
      },
    },
  });

  const legend = document.getElementById("region-legend");
  legend.innerHTML = data.regions
    .map((r) => {
      const share = ((r.tokens / regionTotal) * 100).toFixed(1);
      return `<li>
        <span class="name"><span class="swatch" style="background:${r.color}"></span>${r.name}</span>
        <span class="mono">${fmtCompact.format(r.tokens)} · ${share}%</span>
      </li>`;
    })
    .join("");

  new Chart(document.getElementById("model-chart"), {
    type: "bar",
    data: {
      labels: data.models.map((m) => m.name),
      datasets: [
        {
          label: "Tokens",
          data: data.models.map((m) => m.tokens),
          backgroundColor: [
            "#2ec4b6",
            "#4f8fbf",
            "#f0a05a",
            "#8fd3c8",
            "#c4a35a",
          ],
          borderRadius: 8,
          barThickness: 28,
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            callback: (v) => fmtCompact.format(v),
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#e7eef4" },
        },
      },
    },
  });

  const body = document.getElementById("consumers-body");
  body.innerHTML = data.consumers
    .map((c) => {
      const trendClass = c.trendPct >= 0 ? "up" : "down";
      return `<tr>
        <td>${c.workspace}</td>
        <td>${c.region}</td>
        <td class="mono">${fmtCompact.format(c.tokens)}</td>
        <td class="mono">${c.sharePct.toFixed(1)}%</td>
        <td class="trend ${trendClass}">${fmtPct(c.trendPct)}</td>
      </tr>`;
    })
    .join("");
})();
