import { regexRules, logicRules } from "./base.rules.js";
const isNil = (value) => value === null || value === undefined;
const ensureString = (value) => {
  if (typeof value === "string") return value;
  if (value instanceof String) return value.valueOf();
  return null;
};
const createRegexRule = (regex, { allowNull = false } = {}) => {
  const rules = [];
  if (!allowNull) {
    rules.push(logicRules.notNull);
  }
  rules.push((value) => {
    if (isNil(value)) {
      return allowNull;
    }
    const normalized = ensureString(value);
    if (normalized === null) return false;
    return regex.test(normalized);
  });
  return rules;
};
const createIdRule = (regex, options) => createRegexRule(regex, options);
const appendRequired = (rules, requireValue) => {
  if (requireValue) {
    return [logicRules.notNull, ...rules];
  }
  return rules;
};
export const genericRules = {
  // ID helpers
  productID: (options) => createIdRule(regexRules.productID, options),
  orderID: (options) => createIdRule(regexRules.orderID, options),
  customerID: (options) => createIdRule(regexRules.customerID, options),
  shipmentID: (options) => createIdRule(regexRules.shipmentID, options),
  categoryID: (options) => createIdRule(regexRules.categoryID, options),
  supplierID: (options) => createIdRule(regexRules.supplierID, options),
  paymentID: (options) => createIdRule(regexRules.paymentID, options),
  warehouseID: (options) => createIdRule(regexRules.warehouseID, options),
  // Text helpers
  name: ({ minLength = 2 } = {}) => [
    logicRules.notNull,
    (value) => logicRules.minLength(value, minLength),
    (value) => {
      const normalized = ensureString(value);
      if (normalized === null) return false;
      return regexRules.name.test(normalized);
    }
  ],
  email: (options) => createRegexRule(regexRules.email, options),
  phone: (options) => createRegexRule(regexRules.phone, options),
  address: ({ minLength = 2, allowNull = false } = {}) => {
    const rules = createRegexRule(regexRules.address, { allowNull });
    rules.push((value) => {
      if (isNil(value)) return allowNull;
      return logicRules.minLength(value, minLength);
    });
    return rules;
  },

  // Date helpers
  date: ({ allowFuture = false, requireValue = false, allowNull = false } = {}) => {
    const rules = [];
    if (requireValue && !allowNull) {
      rules.push(logicRules.notNull);
    }
    rules.push((value) => {
      if (isNil(value)) {
        return allowNull;
      }
      const normalized = ensureString(value);
      if (normalized === null) return false;
      return regexRules.date.test(normalized);
    });
    rules.push((value) => {
      if (isNil(value)) {
        return allowNull;
      }
      return logicRules.validDate(value);
    });
    if (!allowFuture) {
      rules.push((value) => {
        if (isNil(value)) {
          return allowNull;
        }
        return logicRules.notFutureDate(value);
      });
    }
    return rules;
  },

  // Numeric helpers
  positiveNumber: ({ requireValue = false } = {}) =>
    appendRequired([logicRules.isNumber, logicRules.isPositive], requireValue),
  nonNegativeNumber: ({ requireValue = false } = {}) =>
    appendRequired([logicRules.isNumber, logicRules.nonNegative], requireValue),
  numberBetween: (min, max, { requireValue = false } = {}) =>
    appendRequired(
      [logicRules.isNumber, (value) => logicRules.between(value, min, max)],
      requireValue
    ),
  // Other helpers
  enum: (values, { allowNull = false } = {}) => {
    const rules = [];
    if (!allowNull) {
      rules.push(logicRules.notNull);
    }
    rules.push((value) => {
      if (isNil(value)) {
        return allowNull;
      }
      return logicRules.inList(value, values);
    });
    return rules;
  },
  regex: (regex, options) => createRegexRule(regex, options)
};