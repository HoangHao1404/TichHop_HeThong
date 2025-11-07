// validation/rules/orders.rules.js
import { genericRules } from "./generic.rules.js";
export const orderRules = {
  OrderID: genericRules.orderID(),
  ProductID: genericRules.productID(),
  CustomerID: genericRules.customerID(),
  Quantity: genericRules.numberBetween(1, 1000, { requireValue: true }),
  Price: genericRules.positiveNumber({ requireValue: true }),
  OrderDate: genericRules.date({ requireValue: true })
};
