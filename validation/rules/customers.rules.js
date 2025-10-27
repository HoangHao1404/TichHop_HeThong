import { regexRules, logicRules } from "./base.rules";
export const customerRules = {
    CustomerID: [
        (v) => regexRules.customerID.test(v),
        logicRules.notNull
    ],
    Name: [
        logicRules.notNull,
        (v) => logicRules.minLength(v, 2),
        (v) => logicRules.name.test(v)
     ],
    Email: [],
    Phone: [],
    Address: []
}