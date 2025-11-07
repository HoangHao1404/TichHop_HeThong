import { regexRules, logicRules } from "./base.rules.js";

export const shipmentRule = {
  ShipmentID: [
    (v) => regexRules.shipmentID.test(v),
    logicRules.notNull
  ],
  OrderID: [
    (v) => regexRules.orderID.test(v),
    logicRules.notNull
  ],
  ShipperName: [
    logicRules.notNull,
    (v) => logicRules.inList(v, [
      "GHTK",
      "GHN",
      "ViettelPost",
      "J&T Express"
    ])
  ],
  ShipDate: [
    (v) => regexRules.date.test(v),
    logicRules.validDate,
    logicRules.notFutureDate
  ],
  DeliveryStatus: [
    logicRules.notNull,
    (v) => logicRules.inList(v, [
      "Delivered",
      "Pending",
      "Unknown",
      "Cancelled"
    ])
  ]
};
