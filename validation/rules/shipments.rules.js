import { regexRules, logicRules } from "./base.rules.js";
export const shipmentRule = {
    ShipmentRule:[
        (v) => regexRules.shipmentID.test(v),
        logicRules.notNull
    ],
    OrderID:[
        (v) => regexRules.OrderID.test(v),
        logicRules.notNull
    ],
    ShipperName:[
        (v) => regexRules.ShipperName.test(v),
        logicRules.notNull,
        (v) => regexRules.upcase.test(v)
    ],
    ShipDate:[
        (v) => regexRules.date.test(v),
        logicRules.validDate,
        logicRules.notFutureDate
    ],
    DeliveryStatus:[
        logicRules.notNull,
        (v) => logicRules.inList(v, ["Pending", "Unknown", "Delivered", "Cancelled"])
    ]
}