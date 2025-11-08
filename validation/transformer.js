// validation/transformer.js
// * Làm sạch dữ liệu dựa trên các lỗi validation
import { Validator } from "./validator.js";
import { regexRules } from "./rules/base.rules.js";

const describeValue = (value) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value === "" ? '""' : `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const applyChange = (draft, key, newValue, notes, reason) => {
  const before = draft[key];
  if (Object.is(before, newValue)) return false;
  draft[key] = newValue;
  const suffix = reason ? ` (${reason})` : "";
  notes.push(`${key}: ${describeValue(before)} -> ${describeValue(newValue)}${suffix}`);
  return true;
};

const trimStringValues = (draft, notes) => {
  for (const [key, value] of Object.entries(draft)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== value) {
        applyChange(draft, key, trimmed, notes, "trim khoảng trắng");
      }
    }
  }
};

const uppercaseIdColumns = (draft, notes, columns = []) => {
  const explicitTargets = new Set(columns ?? []);
  for (const [key, value] of Object.entries(draft)) {
    if (typeof value !== "string") continue;
    const shouldUppercase = explicitTargets.has(key) || /ID$/i.test(key);
    if (!shouldUppercase) continue;
    const normalized = value.trim().toUpperCase();
    if (normalized !== value) {
      applyChange(draft, key, normalized, notes, "chuẩn hoá mã (upper-case)");
    }
  }
};

const parseNumericColumns = (draft, notes, columns = []) => {
  for (const key of columns ?? []) {
    const value = draft[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "number") continue;
    if (typeof value === "string") {
      const candidate = value.trim();
      if (candidate === "") continue;
      const numericValue = Number(candidate);
      if (Number.isFinite(numericValue)) {
        applyChange(draft, key, numericValue, notes, "chuyển sang kiểu số");
      }
    } else if (value instanceof Number) {
      applyChange(draft, key, value.valueOf(), notes, "chuyển sang kiểu số");
    }
  }
};

const toDateOnly = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" || value instanceof String) {
    const candidate = value.toString().trim();
    if (candidate === "") return null;
    if (regexRules.date.test(candidate)) return candidate;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return null;
};

const normaliseDateColumns = (draft, notes, columns = []) => {
  for (const key of columns ?? []) {
    const value = draft[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && regexRules.date.test(value)) continue;
    const normalised = toDateOnly(value);
    if (normalised && normalised !== value) {
      applyChange(draft, key, normalised, notes, "định dạng ngày YYYY-MM-DD");
    }
  }
};

const normalisePhoneValue = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (regexRules.phone.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("84") && digits.length === 11) {
    const candidate = `+${digits}`;
    if (regexRules.phone.test(candidate)) return candidate;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    if (regexRules.phone.test(digits)) return digits;
  }
  if (digits.length === 9 && !digits.startsWith("0")) {
    const candidate = `0${digits}`;
    if (regexRules.phone.test(candidate)) return candidate;
  }
  return null;
};

const normalisePhoneColumns = (draft, notes, columns = []) => {
  for (const key of columns ?? []) {
    const value = draft[key];
    if (value === null || value === undefined) continue;
    if (typeof value !== "string") continue;
    const normalised = normalisePhoneValue(value);
    if (normalised && normalised !== value) {
      applyChange(draft, key, normalised, notes, "chuẩn hoá số điện thoại");
    }
  }
};

const TABLE_TRANSFORM_CONFIG = {
  orders: {
    uppercase: ["OrderID", "ProductID", "CustomerID"],
    numeric: ["Quantity", "Price"],
    date: ["OrderDate"],
  },
  products: {
    uppercase: ["ProductID", "CategoryID", "SupplierID"],
    numeric: ["StockQuantity", "Price"],
  },
  payments: {
    uppercase: ["PaymentID", "OrderID", "CustomerID"],
    numeric: ["Amount"],
    date: ["PaymentDate"],
  },
  customers: {
    uppercase: ["CustomerID"],
    phone: ["Phone"],
  },
  shipments: {
    uppercase: ["ShipmentID", "OrderID"],
    date: ["ShipDate"],
  },
  categories: {
    uppercase: ["CategoryID"],
  },
  suppliers: {
    uppercase: ["SupplierID"],
    phone: ["Phone"],
  },
  warehouses: {
    uppercase: ["WarehouseID"],
    numeric: ["Capacity"],
  },
};

export class Transformer {
  constructor(tableName, validator) {
    this.tableName = tableName;
    this.config = TABLE_TRANSFORM_CONFIG[tableName] ?? {};
    this.validator = validator ?? new Validator(tableName);
  }

  applyTransforms(row) {
    const draft = { ...row };
    const notes = [];

    trimStringValues(draft, notes);
    uppercaseIdColumns(draft, notes, this.config.uppercase);
    parseNumericColumns(draft, notes, this.config.numeric);
    normaliseDateColumns(draft, notes, this.config.date);
    normalisePhoneColumns(draft, notes, this.config.phone);

    return { row: draft, notes };
  }

  transform(errorRows) {
    const cleanedRows = [];
    const invalidRows = [];

    for (const entry of errorRows) {
      const { rowNumber, row } = entry;
      const transformed = this.applyTransforms(row);
      const validation = this.validator.validateRow(transformed.row);

      if (validation.ok) {
        cleanedRows.push({
          rowNumber,
          originalRow: row,
          transformedRow: transformed.row,
          notes: transformed.notes,
        });
      } else {
        invalidRows.push({
          rowNumber,
          originalRow: row,
          transformedRow: transformed.row,
          notes: transformed.notes,
          errors: validation.errors,
        });
      }
    }

    return { cleanedRows, invalidRows };
  }
}
