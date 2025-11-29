// validation/validator.js
import fs from "fs";
import { ruleSets } from "./rules/index.js";
// Whitelist category hợp lệ
const VALID_CATEGORIES = {
  C01: "Thời trang",
  C02: "Điện tử",
  C03: "Phụ kiện",
  C04: "Gia dụng",
  C10: "Thiết bị",
};

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
    if (this.tableName === "categories") {
      const whitelist = {
        C01: "Thời trang",
        C02: "Điện tử",
        C03: "Phụ kiện",
        C04: "Gia dụng",
        C10: "Thiết bị",
      };
      const id = row.CategoryID;
      const name = row.CategoryName;
      const idAllowed = !!whitelist[id];
      if (!idAllowed) {
        errors.push(`CategoryID không hợp lệ (giá trị: ${id ?? ""})`);
      } else if (whitelist[id] !== name) {
        errors.push(`CategoryName không hợp lệ (giá trị: ${name ?? ""})`);
      }
    }
    return { ok: errors.length === 0, errors };
  }

  validateData(dataRows, options = {}) {
    const validRows = [], errorRows = [];
    const idToRowNumber = options.idToRowNumber || {};
    const preferredOrder = {
      orders: ["OrderID"],
      products: ["ProductID"],
      payments: ["PaymentID", "OrderID"],
      customers: ["CustomerID"],
      shipments: ["ShipmentID", "OrderID"],
      categories: ["CategoryID"],
      suppliers: ["SupplierID"],
      warehouses: ["WarehouseID"],
    };
    dataRows.forEach((row, i) => {
      const result = this.validateRow(row);
      if (result.ok) {
        validRows.push(row);
      } else {
        let recordID = "UNKNOWN";
        const fields = preferredOrder[this.tableName] || [];
        for (const f of fields) {
          if (row[f]) { recordID = row[f]; break; }
        }
        if (recordID === "UNKNOWN") {
          recordID = row.OrderID || row.ProductID || row.PaymentID ||
            row.CustomerID || row.ShipmentID || row.CategoryID ||
            row.SupplierID || row.WarehouseID || "UNKNOWN";
        }
        const mapped = idToRowNumber[recordID];
        const rowNumber = typeof mapped === "number" ? mapped : (i + 1);
        errorRows.push({
          table: this.tableName,
          rowNumber,
          row,
          errors: result.errors
        });
      }
    });
    return { validRows, errorRows };
  }

  static logErrors(errorRows, path="./validation/logs/error.log") {
    if (!errorRows.length) return;

    for (const e of errorRows) {
      const msg = e.errors[0];
      const field = msg.split(" ")[0];
      const preferredOrder = {
        orders: ["OrderID"],
        products: ["ProductID"],
        payments: ["PaymentID", "OrderID"],
        customers: ["CustomerID"],
        shipments: ["ShipmentID", "OrderID"],
        categories: ["CategoryID"],
        suppliers: ["SupplierID"],
        warehouses: ["WarehouseID"],
      };
      let recordID = "UNKNOWN";
      const fields = preferredOrder[e.table] || [];
      for (const f of fields) {
        if (e.row[f]) { recordID = e.row[f]; break; }
      }
      if (recordID === "UNKNOWN") {
        recordID =
          e.row.OrderID || e.row.ProductID || e.row.PaymentID ||
          e.row.CustomerID || e.row.ShipmentID || e.row.CategoryID ||
          e.row.SupplierID || e.row.WarehouseID || "UNKNOWN";
      }

      fs.appendFileSync(path,
        `[${e.table}] Row ${e.rowNumber} | ID: ${recordID} | Field: ${field} | Lỗi: ${msg.replace(field, "").trim()}\n`
      );
    }
  }


}
