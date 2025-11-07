// * Tổng hợp các rule
// validation/rules/index.js
import { orderRules } from "./orders.rules.js";
import { productRules } from "./products.rules.js";
import { paymentRules } from "./payments.rules.js";
import { customerRules } from "./customers.rules.js";
import { shipmentRule } from "./shipments.rules.js";
import {categorieRule} from "./categories.rules.js";
import {supplierRule} from "./suppliers.rules.js";
import {warehouseRule} from "./warehouses.rules.js";

export const ruleSets = {
  orders: orderRules,
  products: productRules,
  payments: paymentRules,
  customers: customerRules,
  shipments: shipmentRule,
  categories: categorieRule,
  suppliers: supplierRule,
  warehouses: warehouseRule
};
