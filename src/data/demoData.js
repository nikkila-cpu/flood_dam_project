export const projects = [
  { id: 1, name: "Uttarakhand Flood Analysis", river: "Rishi Ganga", dam: "Rishi Ganga HEP", status: "Active" },
  { id: 2, name: "Tehri Downstream Risk", river: "Bhagirathi", dam: "Tehri Dam", status: "Draft" },
  { id: 3, name: "Sikkim Glacial Flood Study", river: "Teesta", dam: "Teesta III", status: "Active" },
];

export const dams = [
  { id: "rishi", name: "Rishi Ganga HEP", river: "Rishi Ganga", position: [30.55, 79.58], capacity: "5.7 MCM" },
  { id: "tehri", name: "Tehri Dam", river: "Bhagirathi", position: [30.38, 78.48], capacity: "3,540 MCM" },
  { id: "teesta", name: "Teesta III", river: "Teesta", position: [27.55, 88.57], capacity: "12.5 MCM" },
];

export const dashboardMetrics = [
  { label: "Active projects", value: "3", note: "Across three river basins", icon: "◫" },
  { label: "Simulations", value: "24", note: "7 completed this month", icon: "◌" },
  { label: "Inundated area", value: "183.4 km²", note: "Latest extreme scenario", icon: "◒" },
  { label: "Affected population", value: "42,500", note: "Estimated exposure", icon: "♧" },
];
