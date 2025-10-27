// * Tổng hợp các rule
// validation/rules/index.js
import { orderRules } from "./orders.rules.js";
import { productRules } from "./products.rules.js";
import { paymentRules } from "./payments.rules.js";

export const ruleSets = {
  orders: orderRules,
  products: productRules,
  payments: paymentRules
};
