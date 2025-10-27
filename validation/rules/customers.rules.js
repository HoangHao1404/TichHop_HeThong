import { regexRules, logicRules } from "./base.rules.js";
export const customerRules = {
    CustomerID: [
        (v) => regexRules.customerID.test(v),
        logicRules.notNull
    ],
    Name: [
        logicRules.notNull,
        (v) => logicRules.minLength(v, 2),
        (v) => regexRules.name.test(v)
     ],
    Email: [
        (v) => regexRules.email.test(v),
        logicRules.notNull
    ],
    Phone: [
        (v)=>regexRules.phone.test(v),
        logicRules.notNull,

    ],
    Address: [
        logicRules.notNull,
        (v) => regexRules.address.test(v),
        (v) =>logicRules.minLength(v,2),
        logicRules.isString
    ]
}