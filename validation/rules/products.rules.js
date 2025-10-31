// validation/rules/products.rules.js
import { regexRules, logicRules } from "./base.rules.js";
export const productRules = {
  ProductID:[
    (v) => regexRules.productID.test(v),
    logicRules.notNull
  ],
  Name: [
    logicRules.notNull,
    (v) => logicRules.minLength(v, 2),
    (v) => regexRules.name.test(v)
  ],
  CategoryID: [
    (v) => regexRules.categoryID.test(v),
    logicRules.notNull
  ],
  SupplierID: [
    (v) => regexRules.supplierID.test(v),
    logicRules.notNull
  ],
  StockQuantity: [
    logicRules.isNumber,
    logicRules.nonNegative
  ],
  Price: [
    logicRules.isNumber,
    logicRules.isPositive
  ]
};
