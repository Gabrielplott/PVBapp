export const PLANOS = [
  { id: "mensal", label: "Mensal", meses: 1 },
  { id: "trimestral", label: "Trimestral", meses: 3 },
  { id: "semestral", label: "Semestral", meses: 6 },
];

export function planoInfo(id) {
  return PLANOS.find((p) => p.id === id) || PLANOS[0];
}
