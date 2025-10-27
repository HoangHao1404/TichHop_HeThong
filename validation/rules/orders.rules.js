// validation/rules/orders.rules.js
import { regexRules, logicRules } from "./base.rules.js";

export const orderRules = {
  OrderID: [
    (v) => regexRules.orderID.test(v),
    logicRules.notNull
  ],
  ProductID: [
    (v) => regexRules.productID.test(v),
    logicRules.notNull
  ],
  CustomerID: [
    (v) => regexRules.customerID.test(v),
    logicRules.notNull
  ],
  Quantity: [
    logicRules.isNumber,
    (v) => logicRules.between(v, 1, 1000)   // Giới hạn 1–1000 sản phẩm
  ],
  Price: [
    logicRules.isNumber,
    logicRules.isPositive
  ],
  OrderDate: [
    (v) => regexRules.date.test(v),
    logicRules.validDate,
    logicRules.notFutureDate
  ]
};
