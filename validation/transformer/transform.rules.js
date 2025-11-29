import { genericTransform } from "./generic.transform.js";

export const transformRuleSets = {
  orders: {
    OrderID: genericTransform.text,
    CustomerID: genericTransform.text,
    ProductID: genericTransform.text,
    OrderDate: genericTransform.date,
  },

  products: {
    ProductID: genericTransform.text,
    CategoryID: genericTransform.text,
  },

  customers: {
    CustomerID: genericTransform.text,
    Name: genericTransform.text,
    Email: genericTransform.email,
    Phone: genericTransform.phone,
    Address: genericTransform.text
  },

  categories: {
    CategoryID: genericTransform.text,
    CategoryName: genericTransform.text
  }
};
