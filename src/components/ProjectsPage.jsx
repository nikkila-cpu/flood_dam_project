import { useEffect, useState } from "react";
import { createProject, listProjects, listSimulations } from "../services/api";

const blankProject = { name: "", river: "", dam: "", description: "" };

export default function ProjectsPage({ onNewSimulation }) {
  const [projects, setProjects] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [form, setForm] = useState(blankProject);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [projectData, simulationData] = await Promise.all([listProjects(), listSimulations()]);
      setProjects(projectData);
      setSimulations(simulationData);
    } catch (error) { setMessage(`Could not load the API: ${error.message}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const project = await createProject(form);
      setProjects((items) => [project, ...items]);
      setForm(blankProject);
      setMessage(`Project “${project.name}” was created.`);
    } catch (error) { setMessage(error.message); }
  };
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">Phase 2 · persistent workspace</p><h2>Projects</h2><p>Create a river-basin study, then attach simulations and datasets to it.</p></div><button className="primary-button compact" onClick={onNewSimulation}>+ New simulation</button></section>
    {message && <div className="notice">{message}<button onClick={() => setMessage("")}>×</button></div>}
    <section className="content-grid"><article className="panel project-list"><div className="panel-title"><div><span className="eyebrow">Saved in API</span><h2>All projects</h2></div><button className="text-button" onClick={load}>Refresh</button></div>
      {loading ? <p className="empty-state">Loading projects…</p> : projects.length === 0 ? <p className="empty-state">No projects yet. Create your first study using the form.</p> : projects.map((project) => {
        const count = simulations.filter((simulation) => simulation.project_id === project.id).length;
        return <div className="api-project" key={project.id}><div className="project-symbol">⌁</div><div><strong>{project.name}</strong><small>{project.river || "River not set"} · {project.dam || "Dam not set"}</small><small>{count} simulation{count === 1 ? "" : "s"}</small></div><span className="project-id">#{project.id}</span></div>;
      })}</article>
      <form className="panel mini-form" onSubmit={submit}><div className="panel-title"><div><span className="eyebrow">New study</span><h2>Create project</h2></div></div>
        <label>Project name<input required minLength="3" name="name" value={form.name} onChange={update} placeholder="e.g. Tehri Downstream Risk" /></label>
        <label>River<input name="river" value={form.river} onChange={update} placeholder="e.g. Bhagirathi" /></label>
        <label>Dam<input name="dam" value={form.dam} onChange={update} placeholder="e.g. Tehri Dam" /></label>
        <label>Description<textarea name="description" value={form.description} onChange={update} placeholder="Purpose and study boundary" /></label>
        <button className="primary-button" type="submit">Create project</button>
      </form></section>
    <section className="panel table-panel"><div className="panel-title"><div><span className="eyebrow">Run history</span><h2>Simulations</h2></div></div>
      {loading ? <p className="empty-state">Loading simulations…</p> : simulations.length === 0 ? <p className="empty-state">No simulations queued. Create one from the New simulation page.</p> : <div className="table-wrap"><table><thead><tr><th>ID</th><th>Dam</th><th>Model</th><th>Water level</th><th>Status</th></tr></thead><tbody>{simulations.map((simulation) => <tr key={simulation.id}><td>#{simulation.id}</td><td>{simulation.dam}</td><td>{simulation.model}</td><td>{simulation.water_level} m</td><td><span className="badge queued-badge">{simulation.status}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
