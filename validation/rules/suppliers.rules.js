import { regexRules, logicRules } from "./base.rules.js";
export const supplierRule = {
    SupplierID:[
        (v) => regexRules.supplierID.test(v),
        logicRules.notNull
    ],
    Name:[
        (v) => regexRules.name.test(v),
        logicRules.notNull,
        (v) => logicRules.minLength(v, 2)
    ],
    Contact:[
        (v) => regexRules.phone.test(v),
        logicRules.notNull
    ],
    Address:[
        logicRules.notNull,
        (v) => regexRules.address.test(v),
    ],
}