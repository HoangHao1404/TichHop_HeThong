// validation/validator.js
import fs from "fs";
import { ruleSets } from "./rules/index.js";

export class Validator {
  constructor(tableName) {
    if (!ruleSets[tableName]) {
      throw new Error(`Không tìm thấy rule cho bảng ${tableName}`);
    }
    this.rules = ruleSets[tableName];
    this.tableName = tableName;
  }

  validateRow(row) {
    const errors = [];
    for (const [column, columnRules] of Object.entries(this.rules)) {
      const value = row[column];
      if (!columnRules?.length) continue;

      for (const rule of columnRules) {
        let ok = false;
        try { ok = rule(value); } catch { ok = false; }
        if (!ok) {
          errors.push(`${column} không hợp lệ (giá trị: ${value ?? ""})`);
          break;
        }
      }
    }
    return { ok: errors.length === 0, errors };
  }

  validateData(dataRows) {
    const validRows = [], errorRows = [];
    dataRows.forEach((row, i) => {
      const result = this.validateRow(row);
      if (result.ok) validRows.push(row);
      else errorRows.push({
        table: this.tableName,
        rowNumber: i + 1,
        errors: result.errors
      });
    });
    return { validRows, errorRows };
  }

  static logErrors(errorRows, path = "./validation/logs/error.log") {
    if (errorRows.length === 0) return;
    const lines = errorRows.map(
      e => `[${e.table}] Row ${e.rowNumber}: ${e.errors.join("; ")}`
    );
    fs.appendFileSync(path, lines.join("\n") + "\n", "utf8");
  }
}
