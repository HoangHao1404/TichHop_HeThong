// validation/rules/base.rules.js
// * Dùng regex để viết generics dùng chung
export const regexRules = {
  // ID pattern
  productID: /^P\d{3,5}$/,
  orderID: /^DH\d{3,5}$/,
  customerID: /^C\d{3,5}$/,
  shipmentID: /^S\d{3,5}$/,
  categoryID: /^(C)\d{2,4}$/,      
  supplierID: /^(S)\d{2,4}$/, 
  paymentID: /^PM\d{3,5}$/,
  warehouseID:/^W\d{2,4}$/,    
  
  email: /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,
  phone: /^(0|\+84)\d{9}$/,
  
  date: /^\d{4}-\d{2}-\d{2}$/,
  datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
  name: /^[A-Za-zÀ-ỹĐđ\s0-9']+$/,
  address: /^[A-Za-zÀ-ỹ0-9\s,.-]+$/,
};
// * Viết logic mở rộng 
export const logicRules = {
  // TODO: Null & type
  notNull: (v) => v !== null && v !== undefined && String(v).trim() !== "",
  isNumber: (v) => v !== null && v !== "" && !isNaN(v),
  isString: (v) => typeof v === "string",

  // TODO: Numeric logic
  isPositive: (v)=> Number(v) > 0,
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
  minLength: (v, len) => String(v).trim().length >= len,
  maxLength: (v, len) => String(v).trim().length <= len,

  // TODO: Others
  inList: (v, list) => list.includes(v),
  unique: (arr) => new Set(arr).size === arr.length
};
