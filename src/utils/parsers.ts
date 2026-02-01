export const parseBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string");
    if (typeof first === "string") {
      if (first.toLowerCase() === "true") return true;
      if (first.toLowerCase() === "false") return false;
    }
  }
  return null;
};

export const parseIntValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string");
    if (typeof first === "string" && first.trim() !== "") {
      const parsed = Number(first);
      if (Number.isInteger(parsed)) return parsed;
    }
  }
  return null;
};

export const parseString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string");
    if (typeof first !== "string") return null;
    const trimmed = first.trim();
    return trimmed ? trimmed : null;
  }
  return null;
};
