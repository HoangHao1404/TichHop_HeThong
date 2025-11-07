import { genericRules } from "./generic.rules.js";

export const shipmentRule = {
  ShipmentID: genericRules.shipmentID(),
  OrderID: genericRules.orderID(),
  ShipperName: genericRules.enum([
    "GHTK",
    "GHN",
    "ViettelPost",
    "J&T Express"
  ]),
  ShipDate: genericRules.date({ requireValue: true }),
  DeliveryStatus: genericRules.enum([
    "Delivered",
    "Pending",
    "Unknown",
    "Cancelled"
  ])
};
