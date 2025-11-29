import { transformRuleSets } from "./transform.rules.js";

export class Transformer {

  constructor(table) {
    this.rules = transformRuleSets[table] || {};
  }

  apply(row) {
    const newRow = { ...row };
    const changes = [];

    for (const [field, ruleChain] of Object.entries(this.rules)) {
      const original = newRow[field];
      let value = original;

      for (const fn of ruleChain) {
        try {
          value = fn(value);
        } catch {}
      }

      newRow[field] = value;

      if (value !== original) {
        changes.push({
          field,
          oldVal: original,
          newVal: value
        });
      }
    }

    return { newRow, changes };
  }
}
