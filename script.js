const data = window.REVIEW_SIGNALS_DATA;
const state = {
  market: "All",
  cluster: "All clusters",
  theme: "All themes",
};

const byId = (id) => document.getElementById(id);

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function filteredSignals() {
  return data.signals.filter((signal) => {
    const marketMatch = state.market === "All" || signal.market === state.market;
    const clusterMatch = state.cluster === "All clusters" || signal.cluster === state.cluster;
    const themeMatch = state.theme === "All themes" || signal.theme === state.theme;
    return marketMatch && clusterMatch && themeMatch;
  });
}

function renderKpis() {
  const negatives = data.signals.filter((signal) => ["Negative", "Neutral", "Mixed"].includes(signal.sentiment)).length;
  const qa = data.signals.filter((signal) => signal.evidenceType === "提问").length;
  const uniqueProducts = new Set(data.signals.map((signal) => signal.brandProduct)).size;
  const kpis = [
    ["Signals", data.meta.totalSignals, "review and Q&A rows"],
    ["China", data.meta.chinaSignals, "Taobao/Tmall/Xiaohongshu"],
    ["Overseas", data.meta.overseasSignals, "review pages and snippets"],
    ["Products", uniqueProducts, "brands and product lines"],
    ["Objections", negatives + qa, "negative, neutral, mixed, Q&A"],
  ];
  byId("kpis").innerHTML = kpis.map(([label, value, note]) => `
    <article class="kpi">
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${note}</em>
    </article>
  `).join("");
}

function renderThemeBars() {
  const items = filteredSignals();
  const counts = Object.entries(countBy(items, "theme")).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = Math.max(...counts.map(([, value]) => value), 1);
  byId("themeBars").innerHTML = counts.map(([theme, value]) => `
    <div class="bar-row">
      <div class="bar-label">${theme}</div>
      <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(8, (value / max) * 100)}%"></div></div>
      <div class="bar-value">${value}</div>
    </div>
  `).join("");
}

function renderSentiment() {
  const markets = ["China", "Overseas"];
  byId("sentimentChart").innerHTML = markets.map((market) => {
    const items = data.signals.filter((signal) => signal.market === market);
    const counts = countBy(items, "sentiment");
    const total = items.length || 1;
    const positive = Math.round(((counts.Positive || 0) / total) * 100);
    const neutral = Math.round((((counts.Neutral || 0) + (counts.Mixed || 0)) / total) * 100);
    const negative = Math.max(0, 100 - positive - neutral);
    return `
      <div class="sentiment-row">
        <div class="sentiment-head"><span>${market}</span><span>${items.length} signals</span></div>
        <div class="sentiment-stack" title="${market}">
          <span class="positive" style="width: ${positive}%"></span>
          <span class="neutral" style="width: ${neutral}%"></span>
          <span class="negative" style="width: ${negative}%"></span>
        </div>
        <div class="sentiment-head"><span>Positive ${positive}%</span><span>Risk/Neutral ${neutral + negative}%</span></div>
      </div>
    `;
  }).join("");
}

function renderInsights() {
  byId("insights").innerHTML = data.insights.map((insight) => `
    <div class="insight">
      <strong>${insight.title}</strong>
      <p>${insight.detail}</p>
    </div>
  `).join("");
}

function renderPlaybook() {
  byId("playbook").innerHTML = data.playbook.map((item) => `
    <div class="playbook">
      <small>${item.placement}</small>
      <strong>${item.area}</strong>
      <p>${item.asset}</p>
    </div>
  `).join("");
}

function fillFilters() {
  const clusters = ["All clusters", ...new Set(data.signals.map((signal) => signal.cluster))].sort();
  const themes = ["All themes", ...new Set(data.signals.map((signal) => signal.theme))].sort();
  byId("clusterFilter").innerHTML = clusters.map((value) => `<option>${value}</option>`).join("");
  byId("themeFilter").innerHTML = themes.map((value) => `<option>${value}</option>`).join("");
}

function renderTable() {
  const rows = filteredSignals().slice(0, 30);
  byId("signalRows").innerHTML = rows.map((signal) => `
    <tr>
      <td><span class="pill ${signal.market === "China" ? "pill-china" : "pill-overseas"}">${signal.market}</span></td>
      <td><strong>${signal.brandProduct}</strong><br><span>${signal.cluster}</span></td>
      <td class="theme-cell">${signal.theme}</td>
      <td class="evidence">${signal.evidencePhrase}</td>
      <td>${signal.painPoint}</td>
      <td>${signal.implication}</td>
    </tr>
  `).join("");
}

function render() {
  renderThemeBars();
  renderSentiment();
  renderTable();
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.market = button.dataset.market;
    render();
  });
});

byId("clusterFilter").addEventListener("change", (event) => {
  state.cluster = event.target.value;
  render();
});

byId("themeFilter").addEventListener("change", (event) => {
  state.theme = event.target.value;
  render();
});

renderKpis();
renderInsights();
renderPlaybook();
fillFilters();
render();
