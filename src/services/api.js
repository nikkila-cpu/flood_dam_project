const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const usesFormData = options.body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { ...(usesFormData ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json();
}

export async function getOrCreateProject(name, dam) {
  const projects = await request("/api/projects");
  const existing = projects.find((project) => project.name === name);
  if (existing) return existing;
  return request("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name, dam }),
  });
}

export async function createSimulation(form, dam) {
  const project = await getOrCreateProject(form.project, dam.name);
  return request("/api/simulations", {
    method: "POST",
    body: JSON.stringify({
      project_id: project.id,
      dam: dam.name,
      model: form.model,
      water_level: Number(form.waterLevel),
      reservoir_volume: Number(form.reservoirVolume),
      breach_width: Number(form.breachWidth),
      breach_time: Number(form.breachTime),
      duration_hours: Number(form.duration),
    }),
  });
}

export function listProjects() {
  return request("/api/projects");
}

export function listSimulations() {
  return request("/api/simulations");
}

export function getSimulationResult(simulationId) {
  return request(`/api/simulations/${simulationId}/result`);
}

export function createProject(project) {
  return request("/api/projects", { method: "POST", body: JSON.stringify(project) });
}

export function listDatasets() {
  return request("/api/datasets");
}

export function uploadDataset(kind, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/api/datasets/upload?kind=${encodeURIComponent(kind)}`, { method: "POST", body: formData });
}
