import { genericRules } from "./generic.rules.js";

export const paymentRules = {
  PaymentID: genericRules.paymentID(),
  OrderID: genericRules.orderID(),
  PaymentMethod: genericRules.name(),
  Amount: genericRules.positiveNumber({ requireValue: true }),
  PaymentDate: genericRules.date({ requireValue: true })
};
