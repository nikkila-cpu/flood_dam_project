import { useEffect, useState } from "react";
import { getImpactSummary } from "../services/api";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null); const [message, setMessage] = useState("");
  const load = async () => { try { setSummary(await getImpactSummary()); } catch (error) { setMessage(error.message); } };
  useEffect(() => { load(); }, []);
  return <div className="page-stack"><section className="page-heading"><div><p className="eyebrow">Phase 9 · decision support</p><h2>Impact reports</h2><p>Export completed flood extents and headline exposure metrics for downstream review.</p></div><a className="primary-button report-link" href="http://127.0.0.1:8000/api/reports/impact.csv">Download CSV report</a></section>{message && <div className="notice">{message}</div>}<section className="metric-grid report-metrics"><article className="metric-card"><p>Completed runs</p><h2>{summary?.completed_runs ?? "-"}</h2></article><article className="metric-card"><p>Total inundated area</p><h2>{summary ? `${summary.total_inundated_area_km2} km²` : "-"}</h2></article><article className="metric-card"><p>Maximum depth</p><h2>{summary ? `${summary.maximum_depth_m} m` : "-"}</h2></article><article className="metric-card"><p>Flooded cells</p><h2>{summary?.total_flooded_cells ?? "-"}</h2></article></section><article className="panel report-note"><span className="eyebrow">Export contents</span><h2>Results ready for review</h2><p>The CSV includes simulation assumptions, depth, velocity, arrival time, inundated area, and flooded-cell counts for every completed run.</p></article></div>;
}
