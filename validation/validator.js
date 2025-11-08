// validation/validator.js
// * Kiểm tra dữ liệu Pattern CoR + Composite với 3 lớp Base -> Generic -> Table rules
import fs from "fs";
import { ruleSets } from "./rules/index.js";

const formatValue = (value) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const normaliseRules = (columnRules) => {
  if (!columnRules) return [];
  return Array.isArray(columnRules) ? columnRules : [columnRules];
};

export class Validator {
  constructor(tableName) {
    if (!ruleSets[tableName]) {
      throw new Error(`Không tìm thấy rule cho bảng ${tableName}`);
    }
    this.rules = ruleSets[tableName];
    this.tableName = tableName;
  }

  // Hàm chạy toàn bộ rule cho một dòng dữ liệu
  validateRow(row) {
    const errors = [];

    for (const [column, columnRules] of Object.entries(this.rules)) {
      const value = row[column];
      const rules = normaliseRules(columnRules);

      if (!rules.length) continue;

      for (const [ruleIndex, rule] of rules.entries()) {
        let isValid = false;
        try {
          isValid = Boolean(rule(value, row));
        } catch (error) {
          isValid = false;
        }

        if (!isValid) {
          const message = `${column} không hợp lệ (giá trị: ${formatValue(value)})`;
          errors.push({ column, value, ruleIndex, message });
          break; // Dừng ở rule sai đầu tiên
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  // Hàm kiểm tra toàn bộ dataset
  validateData(dataRows) {
    const validRows = [];
    const errorRows = [];

    dataRows.forEach((row, index) => {
      const result = this.validateRow(row);

      if (result.ok) {
        validRows.push(row);
      } else {
        errorRows.push({
          table: this.tableName,
          rowNumber: index + 1,
          row,
          errors: result.errors,
        });
      }
    });

    return { validRows, errorRows };
  }

  static logErrors(errorRows, path = "./validation/logs/error.log") {
    if (!errorRows.length) return;

    const lines = errorRows.map((entry) => {
      const detail = entry.errors.map((err) => err.message).join("; ");
      return `[${entry.table}] Row ${entry.rowNumber}: ${detail}`;
    });

    fs.appendFileSync(path, `${lines.join("\n")}\n`, "utf8");
  }
}
