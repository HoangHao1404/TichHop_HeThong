import { genericRules } from "./generic.rules.js";

export const supplierRule = {
  SupplierID: genericRules.supplierID(),
  Name: genericRules.name(),
  Contact: genericRules.phone(),
  Address: genericRules.address({ minLength: 1 })
};
