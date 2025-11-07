//* Kiểm tra dữ liệu Pattern CoR + Composite 
// validation/validator.js
import { ruleSets } from "./rules/index.js";
import fs from "fs";

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

      if (!columnRules || columnRules.length === 0) continue;

      for (const rule of columnRules) {
        let isValid = false;
        try {
          isValid = rule(value);
        } catch (err) {
          isValid = false;
        }

        if (!isValid) {
          errors.push(` ${column} không hợp lệ (giá trị: ${value})`);
          break; // Dừng ở rule sai đầu tiên
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors
    };
  }

  // Hàm kiểm tra toàn bộ dataset
validateData(dataRows) {
  const validRows = [];
  const errorRows = [];

  dataRows.forEach((row, i) => {
    const result = this.validateRow(row);

    if (result.ok) validRows.push(row);
    else errorRows.push({
      table: this.tableName,   // ✅ Thêm tên bảng vào đây
      rowNumber: i + 1,
      row,
      errors: result.errors
    });
  });

  return { validRows, errorRows };
}

static logErrors(errorRows, path = "./validation/logs/error.log") {
  if (errorRows.length === 0) return;

  const lines = errorRows.map(
    (e) => `[${e.table}] Row ${e.rowNumber}: ${e.errors.join("; ")}` // ✅ đổi format log
  );

  fs.appendFileSync(path, lines.join("\n") + "\n", "utf8");
}

}
