import { genericRules } from "./generic.rules.js";

export const customerRules = {
  CustomerID: genericRules.customerID(),
  Name: genericRules.name(),
  Email: genericRules.email(),
  Phone: genericRules.phone(),
  Address: genericRules.address()
};
