// validation/rules/products.rules.js
import { genericRules } from "./generic.rules.js";

export const productRules = {
  ProductID: genericRules.productID(),
  Name: genericRules.name(),
  CategoryID: genericRules.categoryID(),
  SupplierID: genericRules.supplierID(),
  StockQuantity: genericRules.nonNegativeNumber({ requireValue: true }),
  Price: genericRules.positiveNumber({ requireValue: true })
};
