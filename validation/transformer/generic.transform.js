import { baseTransform } from "./base.transform.js";

export const genericTransform = {
  email: [
    baseTransform.trim,
    baseTransform.normalizeEmail
  ],

  phone: [
    baseTransform.trim,
    baseTransform.normalizePhone
  ],

  text: [
    baseTransform.trim,
    baseTransform.toNullIfEmpty
  ],

  date: [
    baseTransform.trim,
    baseTransform.normalizeDateSeparator
  ],
  number: [
  baseTransform.trim
    ]

};
