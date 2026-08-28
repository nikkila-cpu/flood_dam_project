import { useState } from "react";
import { dams } from "../data/demoData";

const initialForm = {
  project: "Uttarakhand Flood Analysis", dam: "rishi", resolution: "30 m", waterLevel: "1850",
  reservoirVolume: "5.7", breachWidth: "100", breachTime: "30", roughness: "0.035", duration: "24", model: "basic",
};

export default function SimulationForm({ onRun }) {
  const [form, setForm] = useState(initialForm);
  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const submit = (event) => { event.preventDefault(); onRun(form); };

  return (
    <form className="simulation-form" onSubmit={submit}>
      <div className="form-heading"><span className="eyebrow">New analysis</span><h2>Create simulation</h2><p>Set the dam-break assumptions for a new model run.</p></div>
      <label>Project<select name="project" value={form.project} onChange={update}><option>Uttarakhand Flood Analysis</option><option>Tehri Downstream Risk</option><option>Sikkim Glacial Flood Study</option></select></label>
      <div className="form-grid">
        <label>Dam<select name="dam" value={form.dam} onChange={update}>{dams.map((dam) => <option key={dam.id} value={dam.id}>{dam.name}</option>)}</select></label>
        <label>DEM resolution<select name="resolution" value={form.resolution} onChange={update}><option>30 m</option><option>10 m</option><option>5 m</option></select></label>
        <label>Water level (m)<input name="waterLevel" type="number" value={form.waterLevel} onChange={update} /></label>
        <label>Reservoir volume (MCM)<input name="reservoirVolume" type="number" step="0.1" value={form.reservoirVolume} onChange={update} /></label>
        <label>Breach width (m)<input name="breachWidth" type="number" value={form.breachWidth} onChange={update} /></label>
        <label>Formation time (min)<input name="breachTime" type="number" value={form.breachTime} onChange={update} /></label>
        <label>Manning roughness<input name="roughness" type="number" step="0.001" value={form.roughness} onChange={update} /></label>
        <label>Duration (hours)<input name="duration" type="number" value={form.duration} onChange={update} /></label>
      </div>
      <fieldset><legend>Model</legend><div className="model-options">
        {[['basic', 'Basic flood model'], ['delft3d', 'Delft3D'], ['sph', 'SPH / DualSPHysics']].map(([value, label]) => <label key={value} className="radio"><input type="radio" name="model" value={value} checked={form.model === value} onChange={update} />{label}</label>)}
      </div></fieldset>
      <button className="primary-button" type="submit">Queue simulation <span>→</span></button>
    </form>
  );
}
