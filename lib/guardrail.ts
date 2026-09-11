const RISK_KEYWORDS = [
  "bunuh diri",
  "mengakhiri hidup",
  "mati saja",
  "tidak mau hidup",
  "lebih baik mati",
  "self harm",
  "menyakiti diri",
  "cedera diri",
  "depresi berat",
  "gangguan mental",
  "psikotik",
  "halusinasi",
  "bunuh",
  "bunuh diriku",
  "hidup ini sia",
  "tidak ada gunanya hidup",
  "lelah hidup",
  "putus asa sekali",
  "tidak ada harapan",
  "menyelamatkan diri",
  "benci diri",
  "benci saya",
  "benci diriku",
  "benci hidup",
  "muak hidup",
  "tidak berharga",
  "tidak berguna",
  "tidak pantas hidup",
];

export function checkGuardrail(text: string): boolean {
  const lower = text.toLowerCase();
  return RISK_KEYWORDS.some((keyword) => lower.includes(keyword));
}
