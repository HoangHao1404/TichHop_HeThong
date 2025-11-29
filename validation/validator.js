// validation/validator.js
import fs from "fs";
import { ruleSets } from "./rules/index.js";
function logValidationError({ table, rowNumber, recordID, field, reason, value }) {
  const line =
    `[${table}] Row ${rowNumber} | ` +
    `ID: ${recordID} | ` +
    `Field: ${field} | ` +
    `Lỗi: ${reason} (giá trị: ${value})\n`;

  fs.appendFileSync("./validation/logs/error.log", line, "utf8");
}
function parseError(errString) {
  if (!errString || typeof errString !== "string") {
    return { field: "UNKNOWN", reason: errString || "" };
  }
  const field = errString.split(" ")[0];
  const reason = errString.replace(field, "").trim();
  return { field, reason };
}

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
        row,
        errors: result.errors
      });
    });
    return { validRows, errorRows };
  }

static logErrors(errorRows, path="./validation/logs/error.log") {
  if (!errorRows.length) return;

  for (const e of errorRows) {
    const msg = e.errors[0];
    const field = msg.split(" ")[0];
    const recordID =
      e.row.OrderID || e.row.ProductID || e.row.PaymentID ||
      e.row.CustomerID || e.row.ShipmentID || e.row.CategoryID ||
      e.row.SupplierID || e.row.WarehouseID || "UNKNOWN";

    fs.appendFileSync(path,
      `[${e.table}] Row ${e.rowNumber} | ID: ${recordID} | Field: ${field} | Lỗi: ${msg.replace(field, "").trim()}\n`
    );
  }
}


}
