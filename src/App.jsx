import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import SimulationForm from "./components/SimulationForm";
import { dashboardMetrics, dams, projects } from "./data/demoData";
import { createSimulation, listProjects, listSimulations } from "./services/api";
import ProjectsPage from "./components/ProjectsPage";
import DatasetsPage from "./components/DatasetsPage";
import FeaturePage from "./components/FeaturePage";
import ResultsPage from "./components/ResultsPage";
import ScenariosPage from "./components/ScenariosPage";
import SatellitePage from "./components/SatellitePage";
import ReportsPage from "./components/ReportsPage";

const navigation = ["Dashboard", "Projects", "New simulation", "Datasets", "Scenarios", "Satellite", "Results", "Reports"];

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [selectedDam, setSelectedDam] = useState(dams[0]);
  const [notice, setNotice] = useState("");
  const [liveProjects, setLiveProjects] = useState(projects);
  const [simulations, setSimulations] = useState([]);
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [projectData, simulationData] = await Promise.all([listProjects(), listSimulations()]);
        setLiveProjects(projectData.length ? projectData : projects);
        setSimulations(simulationData);
      } catch {}
    };
    loadDashboard();
    const timer = window.setInterval(loadDashboard, 5000);
    return () => window.clearInterval(timer);
  }, []);
  const locations = liveProjects.map((project) => {
    const dam = dams.find((item) => item.name === project.dam) || dams.find((item) => item.name.includes(project.dam) || project.dam?.includes(item.name));
    return dam ? { ...dam, projectName: project.name } : null;
  }).filter(Boolean);
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
    if (page === "Scenarios") return <ScenariosPage />;
    if (page === "Satellite") return <SatellitePage />;
    if (page === "Results") return <ResultsPage />;
    if (page === "Reports") return <ReportsPage />;
    return <>
      <section className="metric-grid">{dashboardMetrics.map((metric) => <article className="metric-card" key={metric.label}><div className="metric-icon">{metric.icon}</div><p>{metric.label}</p><h2>{metric.label === "Active projects" ? liveProjects.length : metric.label === "Simulations" ? simulations.length : metric.value}</h2><small>{metric.note}</small></article>)}</section>
      <section className="dashboard-grid"><article className="panel map-panel"><div className="panel-title"><div><span className="eyebrow">Live overview</span><h2>Study locations</h2></div><button className="text-button" onClick={() => setPage("Projects")}>View projects</button></div><MapView selectedDam={selectedDam} onDamSelect={setSelectedDam} locations={locations.length ? locations : dams} /></article>
      <article className="panel activity-panel"><div className="panel-title"><div><span className="eyebrow">Recent activity</span><h2>Projects</h2></div><button className="text-button" onClick={() => setPage("Projects")}>View all</button></div>{liveProjects.map((project) => <button key={project.id} className="project-row" onClick={() => { const dam = dams.find((item) => item.name === project.dam) || dams.find((item) => item.name.includes(project.dam) || project.dam?.includes(item.name)); if (dam) { setSelectedDam(dam); setPage("Dashboard"); } }}><span className="project-symbol">⌁</span><span><strong>{project.name}</strong><small>{project.river || "River basin not set"} · {project.dam || "Dam not set"}</small></span><em className={project.status === "Active" ? "badge active-badge" : "badge"}>{project.status || "Saved"}</em></button>)}<div className="risk-card"><span>⚠</span><div><strong>Critical zones</strong><small>17 locations require review</small></div><b>17</b></div></article></section>
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
