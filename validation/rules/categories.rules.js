import { genericRules } from "./generic.rules.js";
export const categorieRule = {
    CategoryID: genericRules.categoryID(),
    CategoryName: genericRules.name()
}