import { genericRules } from "./generic.rules.js";
export const warehouseRule = {
      WarehouseID: genericRules.warehouseID(),
  Location: genericRules.address({ minLength: 3 }),
  Capacity: genericRules.nonNegativeNumber({ requireValue: true })
}