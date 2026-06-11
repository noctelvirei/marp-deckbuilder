---
title: Sample Usage Report
subtitle: April 2026 journey volume
---

<style>
:root {
  --bg: #060D18;
  --bg-card: #0D1D36;
  --bg-subtle: #071228;
  --border: #1E3A5F;
  --border-dim: rgba(30,58,95,.45);
  --blue: #0F82F5;
  --cyan: #59D6FD;
  --purple: #5143D5;
  --green: #66CC8E;
  --orange: #F99358;
  --white: #FFFFFF;
  --text: #C8D8F0;
  --text-dim: #8B9AB5;
  --font-mono: "Consolas", "SFMono-Regular", monospace;
}
body { background: var(--bg) !important; color: var(--text) !important; }
.deck-report { background: var(--bg-subtle) !important; box-shadow: none !important; max-width: 1200px !important; }
.report-body { padding: 0 !important; }
.report-body h2 { color: var(--cyan) !important; border-top: none !important; border-bottom: 1px solid var(--border) !important; font-size: 1.15rem !important; font-weight: 500 !important; text-transform: uppercase; letter-spacing: .06em; padding-bottom: 8px; margin-top: 40px !important; }
.report-body p, .report-body li { color: var(--text) !important; font-size: .93rem; }
.report-body table { font-size: .87rem; }
.report-body th { color: var(--white) !important; background: var(--bg-card) !important; border-color: var(--border) !important; }
.report-body td { color: var(--text) !important; border-color: var(--border-dim) !important; }
.report-body tr:nth-child(even) td { background: rgba(13,31,56,.4) !important; }
.r-layout { display: grid; grid-template-columns: 200px 1fr; gap: 40px; max-width: 1200px; margin: 0 auto; padding: 32px; }
.r-sidebar { position: sticky; top: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; align-self: start; }
.r-sidebar-title { font-size: .65rem; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--text-dim); margin-bottom: 12px; }
.r-sidebar a { display: block; color: var(--text-dim); text-decoration: none; font-size: .82rem; padding: 7px 10px; border-radius: 4px; }
.r-sidebar a:hover { color: var(--cyan); background: rgba(89,214,253,.08); }
.r-main { min-width: 0; padding: 32px 40px 60px; }
.r-metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 14px; margin: 18px 0; }
.r-metric { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; text-align: center; }
.r-metric-value { font-size: 1.9rem; font-weight: 300; color: var(--white); line-height: 1; margin-bottom: 5px; }
.r-metric-label { font-size: .7rem; font-weight: 500; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); }
.r-chart-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin: 18px 0; }
.r-chart-title { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); margin-bottom: 16px; }
.r-rate-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.r-rate-label { font-size: .82rem; min-width: 90px; color: var(--text); }
.r-rate-track { flex: 1; height: 22px; background: rgba(30,58,95,.6); border-radius: 4px; overflow: hidden; }
.r-rate-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 10px; font-size: .72rem; font-weight: 600; color: var(--white); white-space: nowrap; }
.r-rate-pct { font-size: .76rem; font-family: var(--font-mono); color: var(--text-dim); min-width: 42px; text-align: right; }
.r-callout { display: flex; gap: 14px; padding: 14px 18px; border-radius: 8px; margin: 16px 0; border: 1px solid; }
.r-callout.warning { background: rgba(249,147,88,.1); border-color: rgba(249,147,88,.3); color: #fdba74; }
.r-badge { display: inline-flex; align-items: center; font-size: .66rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; padding: 2px 7px; border-radius: 999px; border: 1px solid; }
.r-badge.green { background: rgba(102,204,142,.12); color: var(--green); border-color: rgba(102,204,142,.35); }
.r-badge.orange { background: rgba(249,147,88,.12); color: var(--orange); border-color: rgba(249,147,88,.35); }
</style>

<div class="r-layout">
<aside class="r-sidebar">
<div class="r-sidebar-title">Contents</div>
<nav>
<a href="#summary">Summary</a>
<a href="#volume">Volume</a>
<a href="#breakdown">Breakdown</a>
<a href="#next-steps">Next steps</a>
</nav>
</aside>
<main class="r-main">

<h2 id="summary">Executive Summary</h2>

April volume is concentrated in one dominant journey. The top three journeys account for 92.4% of activity, while one unregistered journey requires follow-up.

<div class="r-metric-grid">
  <div class="r-metric">
    <div class="r-metric-value">77,951</div>
    <div class="r-metric-label">Total cases</div>
  </div>
  <div class="r-metric">
    <div class="r-metric-value" style="color:var(--blue)">67.1%</div>
    <div class="r-metric-label">J0107 share</div>
  </div>
  <div class="r-metric">
    <div class="r-metric-value" style="color:var(--cyan)">92.4%</div>
    <div class="r-metric-label">Top 3 journeys</div>
  </div>
</div>

<h2 id="volume">Volume Chart</h2>

<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>

<h2 id="breakdown">Breakdown</h2>

| Journey | Cases | Share | Status |
| --- | ---: | ---: | --- |
| J0107 | 52,208 | 67.1% | <span class="r-badge green">Active</span> |
| J0106 | 11,119 | 14.3% | <span class="r-badge green">Active</span> |
| J0101 | 8,648 | 11.1% | <span class="r-badge green">Active</span> |
| J0116 | 3,751 | 4.8% | <span class="r-badge orange">Review</span> |

<div class="r-rate-bar"><span class="r-rate-label">J0107</span><div class="r-rate-track"><div class="r-rate-fill" style="width:67%;background:var(--blue)">52,208</div></div><span class="r-rate-pct">67.1%</span></div>
<div class="r-rate-bar"><span class="r-rate-label">J0106</span><div class="r-rate-track"><div class="r-rate-fill" style="width:14%;background:var(--cyan)">11,119</div></div><span class="r-rate-pct">14.3%</span></div>
<div class="r-rate-bar"><span class="r-rate-label">J0101</span><div class="r-rate-track"><div class="r-rate-fill" style="width:11%;background:var(--purple)">8,648</div></div><span class="r-rate-pct">11.1%</span></div>
<div class="r-rate-bar"><span class="r-rate-label" style="color:var(--orange)">J0116</span><div class="r-rate-track"><div class="r-rate-fill" style="width:5%;background:var(--orange)">3,751</div></div><span class="r-rate-pct" style="color:var(--orange)">4.8%</span></div>

<div class="r-callout warning">
  <div><strong>Action:</strong> J0116 generated meaningful volume but is not in the registered journey profile.</div>
</div>

<h2 id="next-steps">Next Steps</h2>

1. Confirm whether J0116 is a new journey or a data quality issue.
2. Add month-over-month tracking for the top three journeys.
3. Calibrate operational monitoring to the dominant journey.

</main>
</div>
