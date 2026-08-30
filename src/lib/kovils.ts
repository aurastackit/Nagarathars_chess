export type Kovil = {
  value: string;
  label: string;
  pirivus: string[];
};

export const KOVILS: Kovil[] = [
  {
    value: "ilayathangudi",
    label: "Ilayathangudi Kovil",
    pirivus: [
      "Okkurudaiyar",
      "Pattinasamiyar",
      "Perumaruthurudaiyar",
      "Kazhanivasaludaiyar",
      "Kinginikoorudaiyar",
      "Perasenthurudaiyar",
      "Sirusenthurudaiyar",
    ],
  },
  {
    value: "mathur",
    label: "Mathur Kovil",
    pirivus: [
      "Uraiyurudaiyar",
      "Arumbakkurudaiyar",
      "Mannurudaiyar",
      "Manalurudaiyar",
      "Kannurudaiyar",
      "Karuppurudaiyar",
      "Kulathurudaiyar",
    ],
  },
  {
    value: "vairavan",
    label: "Vairavan Kovil",
    pirivus: [
      "Sirukulathurudaiyar – Periya Vaguppu",
      "Sirukulathurudaiyar – Theiyanar Vaguppu",
      "Sirukulathurudaiyar – Pillaiyar Vaguppu",
      "Kazhanivasaludaiyar",
      "Maruthendhrapuramudaiyar",
    ],
  },
  { value: "iraniyur", label: "Iraniyur Kovil", pirivus: [] },
  { value: "pillayarpatti", label: "Pillayarpatti Kovil", pirivus: [] },
  { value: "nemam", label: "Nemam Kovil", pirivus: [] },
  { value: "iluppaikkudi", label: "Iluppaikkudi Kovil", pirivus: [] },
  { value: "soorakudi", label: "Soorakudi Kovil", pirivus: [] },
  { value: "velankudi", label: "Velankudi Kovil", pirivus: [] },
];

export function kovilByValue(value: string | null | undefined) {
  return KOVILS.find((k) => k.value === value);
}
