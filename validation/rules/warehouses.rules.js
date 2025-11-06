import { regexRules, logicRules } from "./base.rules";
export const warehouseRules = {
    WarehouseID: [
        (v) => regexRules.warehouseID.test(v),
        logicRules.notNull
    ],
    Location: [
        logicRules.notNull,
        (v) => logicRules.minLength(v, 3),
        (v) => regexRules.address.test(v)
    ],
    Capacity: [
        logicRules.notNull,
        logicRules.isNumber,
        logicRules.nonNegative
    ]
}