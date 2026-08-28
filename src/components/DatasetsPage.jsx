import { useEffect, useState } from "react";
import { listDatasets, uploadDataset } from "../services/api";

const acceptFor = { dem: ".tif,.tiff,.asc", hydrological: ".csv,.json", vector: ".geojson,.json,.kml,.shp" };

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [kind, setKind] = useState("dem");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => { try { setDatasets(await listDatasets()); } catch (error) { setMessage(`Could not load datasets: ${error.message}`); } };
  useEffect(() => { load(); }, []);
  const submit = async (event) => {
    event.preventDefault();
    if (!file) { setMessage("Choose a file before uploading."); return; }
    setLoading(true);
    try { const dataset = await uploadDataset(kind, file); setDatasets((items) => [dataset, ...items]); setFile(null); event.target.reset(); setMessage(`“${dataset.filename}” uploaded successfully.`); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };
  return <div className="page-stack"><section className="page-heading"><div><p className="eyebrow">Phase 2 · input management</p><h2>Datasets</h2><p>Upload DEM, hydrological, and vector data for upcoming analysis runs.</p></div></section>
    {message && <div className="notice">{message}<button onClick={() => setMessage("")}>×</button></div>}
    <section className="content-grid"><form className="panel mini-form" onSubmit={submit}><div className="panel-title"><div><span className="eyebrow">Validated upload</span><h2>Add dataset</h2></div></div><label>Dataset type<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="dem">DEM / terrain</option><option value="hydrological">Hydrological data</option><option value="vector">Vector data</option></select></label><label>File<input key={kind} type="file" accept={acceptFor[kind]} onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><small className="form-help">Accepted: {acceptFor[kind]}</small><button className="primary-button" disabled={loading} type="submit">{loading ? "Uploading…" : "Upload dataset"}</button></form>
      <article className="panel dataset-info"><span className="info-icon">i</span><h2>Next: DEM processing</h2><p>Phase 3 will inspect CRS, elevation bounds, resolution, and raster coverage before terrain processing.</p><ul><li>Files are stored outside the database.</li><li>Metadata is kept by the API.</li><li>Invalid extensions are rejected.</li></ul></article></section>
    <section className="panel table-panel"><div className="panel-title"><div><span className="eyebrow">Stored datasets</span><h2>Upload history</h2></div><button className="text-button" onClick={load}>Refresh</button></div>{datasets.length === 0 ? <p className="empty-state">No datasets uploaded yet.</p> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>File</th><th>Size</th></tr></thead><tbody>{datasets.map((dataset) => <tr key={dataset.id}><td>{dataset.name}</td><td>{dataset.kind}</td><td>{dataset.filename}</td><td>{(dataset.size_bytes / 1024).toFixed(1)} KB</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
