export const baseTransform = {
  trim: (v) => typeof v === "string" ? v.trim() : v,

  toNullIfEmpty: (v) =>
    typeof v === "string" && v.trim() === "" ? null : v,

  normalizeEmail: (v) => {
    if (!v || typeof v !== "string") return v;
    return v.replace("_at_", "@").trim();
  },

  normalizePhone: (v) => {
    if (!v || typeof v !== "string") return v;
    const digits = v.replace(/\D/g, "");
    return digits || null;
  },

  normalizeDateSeparator: (v) => {
    if (!v || typeof v !== "string") return v;
    const m = v.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : v;
  }
};
