import { regexRules, logicRules } from "./base.rules";
export const categoryRules = {
    CategoryID: [
        (v) => regexRules.categoryID.test(v),
        logicRules.notNull
    ],
    CategoryName: [
        logicRules.notNull,
        logicRules.minLength(v, 2),
        (v) => regexRules.name.test(v)
    ]
}