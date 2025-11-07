// validation/rules/base.rules.js
// * Dùng regex để viết generics dùng chung
export const regexRules = {
  // ID pattern
  productID: /^P\d{3,5}$/,
  orderID: /^DH\d{3,5}$/,
  customerID: /^C\d{3,5}$/,
  shipmentID: /^SHP\d{3,5}$/,
  categoryID: /^(C)\d{2,4}$/,      
  supplierID: /^(S)\d{2,4}$/, 
  paymentID: /^PM\d{3,5}$/,
  warehouseID:/^W\d{2,4}$/,    
  // Email & phone
  email: /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,
  phone: /^(0|\+84)\d{9}$/,
  // Date & time
  date: /^\d{4}-\d{2}-\d{2}$/,
  datetime: /^\d{4}-\d{2}-\d{2}T\d{2}/,
  // Text fields
  name: /^[A-Za-zÀ-ỹĐđ\s0-9']+$/,
  upcase: /^\b[A-Z][a-z]*\b/,
  address: /^[A-Za-zÀ-ỹ0-9\s,.-]+$/,
};
const isStringValue = (value) =>
  typeof value === "string" || value instanceof String;

const asPrimitiveString = (value) =>
  value instanceof String ? value.valueOf() : value;

const hasValidDateValue = (value) => {
  if (value === null || value === undefined) return false;
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  if (isStringValue(value)) {
    const candidate = asPrimitiveString(value).trim();
    if (candidate === "") return false;
    return !Number.isNaN(new Date(candidate).getTime());
  }
  return false;
};

const toFiniteNumber = (value) => {
  if (typeof value === "number") return value;
  if (value instanceof Number) return value.valueOf();
  if (isStringValue(value)) {
    const candidate = asPrimitiveString(value).trim();
    if (candidate === "") return NaN;
    return Number(candidate);
  }
  return Number(value);
};
// * Viết logic mở rộng 
export const logicRules = {
  // TODO: Null & type
  notNull: (v) => {
    if (v === null || v === undefined) return false;
    if (isStringValue(v)) {
      return asPrimitiveString(v).trim().length > 0;
    }
    return true;
  },
  isNumber: (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "boolean") return false;
    const numericValue = toFiniteNumber(v);
    return Number.isFinite(numericValue);
  },
  isString: (v) => isStringValue(v),

  // TODO: Numeric logic
  isPositive: (v) => Number(v) > 0,
  nonNegative: (v) => Number(v) >= 0,
  lessThan: (v, max) => Number(v) < max,
  between: (v, min, max) => Number(v) >= min && Number(v) <= max,

  // TODO: Date & time
  validDate: (v) => !isNaN(new Date(v).getTime()),
  notFutureDate: (v) => {
    const d = new Date(v);
    return d <= new Date();
  },

  // TODO: String format
  minLength: (v, len) => {
    if (!isStringValue(v)) return false;
    return asPrimitiveString(v).trim().length >= len;
  },
  maxLength: (v, len) => {
    if (!isStringValue(v)) return false;
    return asPrimitiveString(v).trim().length <= len;
  },

  // TODO: Others
  inList: (v, list) => {
    const value = isStringValue(v) ? asPrimitiveString(v).trim() : v;
    return list.includes(value);
  },
  unique: (arr) => new Set(arr).size === arr.length,
};
