import { useState } from "react";
import MapView from "./components/MapView";
import SimulationForm from "./components/SimulationForm";
import { dashboardMetrics, dams, projects } from "./data/demoData";
import { createSimulation } from "./services/api";
import ProjectsPage from "./components/ProjectsPage";
import DatasetsPage from "./components/DatasetsPage";
import FeaturePage from "./components/FeaturePage";

const navigation = ["Dashboard", "Projects", "New simulation", "Datasets", "Scenarios", "Satellite", "Results", "Reports"];

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [selectedDam, setSelectedDam] = useState(dams[0]);
  const [notice, setNotice] = useState("");
  const queueSimulation = async (form) => {
    const dam = dams.find((item) => item.id === form.dam);
    setSelectedDam(dam);
    try {
      const simulation = await createSimulation(form, dam);
      setNotice(`Simulation #${simulation.id} is queued for ${dam.name}.`);
    } catch (error) {
      setNotice(`Could not reach the API: ${error.message}. Start the Phase 2 backend, then try again.`);
    }
    setPage("Dashboard");
  };

  const pageContent = (() => {
    if (page === "New simulation") return <SimulationForm onRun={queueSimulation} />;
    if (page === "Projects") return <ProjectsPage onNewSimulation={() => setPage("New simulation")} />;
    if (page === "Datasets") return <DatasetsPage />;
    if (page === "Scenarios") return <FeaturePage title="Scenario comparison" kicker="Phase 7" description="Compare normal, moderate, and extreme dam-break assumptions once results are available." nextStep="Run and process multiple model configurations." />;
    if (page === "Satellite") return <FeaturePage title="Satellite monitoring" kicker="Phase 8" description="Sentinel and Google Earth Engine flood-extent analysis will appear here." nextStep="Connect satellite sources and change-detection processing." />;
    if (page === "Results") return <FeaturePage title="Simulation results" kicker="Phase 4" description="Queued simulations are recorded in Projects. Flood depths, velocities, and arrival times will be shown here after the basic model is added." nextStep="Implement the first flood-propagation worker." />;
    if (page === "Reports") return <FeaturePage title="Impact reports" kicker="Phase 9" description="Export-ready loss, damage, and exposure reports will be generated from the flood extent." nextStep="Add spatial impact analysis and export generators." />;
    return <>
      <section className="metric-grid">{dashboardMetrics.map((metric) => <article className="metric-card" key={metric.label}><div className="metric-icon">{metric.icon}</div><p>{metric.label}</p><h2>{metric.value}</h2><small>{metric.note}</small></article>)}</section>
      <section className="dashboard-grid"><article className="panel map-panel"><div className="panel-title"><div><span className="eyebrow">Live overview</span><h2>Study locations</h2></div><button className="text-button" onClick={() => setPage("Projects")}>View projects</button></div><MapView selectedDam={selectedDam} onDamSelect={setSelectedDam} /></article>
      <article className="panel activity-panel"><div className="panel-title"><div><span className="eyebrow">Recent activity</span><h2>Projects</h2></div></div>{projects.map((project) => <button key={project.id} className="project-row" onClick={() => setSelectedDam(dams.find((dam) => dam.name === project.dam) || dams[0])}><span className="project-symbol">⌁</span><span><strong>{project.name}</strong><small>{project.river} · {project.dam}</small></span><em className={project.status === "Active" ? "badge active-badge" : "badge"}>{project.status}</em></button>)}<div className="risk-card"><span>⚠</span><div><strong>Critical zones</strong><small>17 locations require review</small></div><b>17</b></div></article></section>
    </>;
  })();
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">≋</div><div>Flood<span>Sim</span><small>Dam-break analysis</small></div></div>
      <nav>{navigation.map((item) => <button key={item} className={page === item ? "nav-item active" : "nav-item"} onClick={() => setPage(item)}><span>{item === "Dashboard" ? "⌂" : item === "Projects" ? "▣" : item === "New simulation" ? "+" : "○"}</span>{item}</button>)}</nav>
      <div className="sidebar-footer"><span className="status-dot" /> System ready<br /><small>Phase 1 · Interface</small></div>
    </aside>
    <main className="content">
      <header className="topbar"><div><p className="eyebrow">Disaster-risk modelling platform</p><h1>{page === "New simulation" ? "New simulation" : "Flood intelligence dashboard"}</h1></div><button className="outline-button" onClick={() => setPage("New simulation")}>+ New simulation</button></header>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {pageContent}
    </main>
  </div>;
}
