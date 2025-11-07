import { regexRules, logicRules } from "./base.rules.js";
export const categorieRule = {
    CategoryID: [
        (v) => regexRules.categoryID.test(v),
        logicRules.notNull
    ],
    CategoryName: [
        logicRules.notNull,
       (v)=> logicRules.minLength(v, 2),
        (v) => regexRules.name.test(v)
    ]
}