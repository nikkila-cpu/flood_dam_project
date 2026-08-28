import { useEffect, useState } from "react";
import { getSimulationResult, listSimulations } from "../services/api";

export default function ResultsPage() {
  const [simulations, setSimulations] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const items = await listSimulations();
      const completed = await Promise.all(items.map(async (simulation) => {
        if (simulation.status !== "completed") return { simulation, result: null };
        try { return { simulation, result: await getSimulationResult(simulation.id) }; }
        catch { return { simulation, result: null }; }
      }));
      setSimulations(completed);
    } catch (error) { setMessage(error.message); }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, []);

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">Phase 4 · basic flood model</p><h2>Simulation results</h2><p>Flood depth, velocity, arrival time, and inundated area from completed runs.</p></div><button className="text-button" onClick={load}>Refresh</button></section>
    {message && <div className="notice">Could not load results: {message}</div>}
    <section className="panel table-panel"><div className="panel-title"><div><span className="eyebrow">Worker output</span><h2>Run history</h2></div></div>
      {simulations.length === 0 ? <p className="empty-state">No simulations have been created yet.</p> : <div className="table-wrap"><table><thead><tr><th>ID</th><th>Status</th><th>Max depth</th><th>Max velocity</th><th>Arrival</th><th>Area</th></tr></thead><tbody>{simulations.map(({ simulation, result }) => <tr key={simulation.id}><td>#{simulation.id}</td><td><span className="badge queued-badge">{simulation.status}</span></td><td>{result ? `${result.max_depth} m` : "-"}</td><td>{result ? `${result.max_velocity} m/s` : "-"}</td><td>{result ? `${result.arrival_time_minutes} min` : "-"}</td><td>{result ? `${result.inundated_area_km2} km²` : "-"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
