import { Validator } from "./validator.js";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import fs from "fs";

// =================
// Helper functions
// =================
function parseError(errString) {
  if (!errString || typeof errString !== "string") {
    return { field: "UNKNOWN", reason: errString || "" };
  }
  const field = errString.split(" ")[0];
  const reason = errString.replace(field, "").trim();
  return { field, reason };
}

function logTransformDetail({ table, rowNumber, recordID, field, reason, newVal }) {
  const csvLine = `${table},${rowNumber},${recordID},${field},"${reason}",${newVal}\n`;
  fs.appendFileSync("./validation/logs/transform.csv", csvLine, "utf8");
}
// =================
// Database connect
// =================
const db = await open({
  filename: "./db/warehouse.db",
  driver: sqlite3.Database
});

// Tạo folder log nếu chưa có
if (!fs.existsSync("./validation/logs")) {
  fs.mkdirSync("./validation/logs", { recursive: true });
}

// reset transform.log
fs.writeFileSync(
  "./validation/logs/transform.csv",
  "table,rowNumber,recordID,field,reason,newValue\n",
  "utf8"
);

const tables = ["orders", "products", "payments", "shipments", "categories", "suppliers", "warehouses", "customers"];

// =================
// Fix rules
// =================
function fixGenericRow(table, row) {
  const fixed = { ...row };

  // ===== COMMON FIX =====
  // trim chuỗi, null => "" hoặc 0
  for (const key in fixed) {
    if (typeof fixed[key] === "string") fixed[key] = fixed[key].trim();
    if (fixed[key] === null || fixed[key] === undefined) fixed[key] = "";
  }

  switch (table) {

    // =======================
    // ORDERS
    // =======================
    case "orders":
      if (Number(fixed.Quantity) <= 0) fixed.Quantity = 1;
      if (!fixed.Price || Number(fixed.Price) <= 0) fixed.Price = 100000;

      // sửa OrderDate
      if (fixed.OrderDate === "" || fixed.OrderDate === null)
        fixed.OrderDate = "2000-01-01";
      if (fixed.OrderDate === "2025-13-01")
        fixed.OrderDate = "2025-01-13";
      break;

    // =======================
    // PRODUCTS
    // =======================
    case "products":
      if (Number(fixed.Price) <= 0) fixed.Price = 150000;
      if (!fixed.CategoryID) fixed.CategoryID = "C99";

      if (Number(fixed.StockQuantity) < 0)
        fixed.StockQuantity = Math.abs(Number(fixed.StockQuantity));
      break;

    // =======================
    // PAYMENTS
    // =======================
    case "payments":
      if (Number(fixed.Amount) <= 0) fixed.Amount = 100000;

      if (fixed.PaymentDate === "2025-13-01")
        fixed.PaymentDate = "2025-01-13";
      if (!fixed.PaymentDate)
        fixed.PaymentDate = "2000-01-01";
      break;

    // =======================
    // SHIPMENTS
    // =======================
    case "shipments":
      if (!fixed.ShipperName || fixed.ShipperName === "FakeShipper")
        fixed.ShipperName = "Unknown";

      if (fixed.ShipDate === "" || fixed.ShipDate === null)
        fixed.ShipDate = "2000-01-01";

      if (fixed.ShipDate === "2025-13-06")
        fixed.ShipDate = "2025-06-13";
      break;

    // =======================
    // CATEGORIES
    // =======================
    case "categories":
      if (!fixed.CategoryName)
        fixed.CategoryName = "Unknown Category";
      break;

    // =======================
    // SUPPLIERS
    // =======================
    case "suppliers":
      if (!fixed.Name) fixed.Name = "Unknown Supplier";
      if (!fixed.Address) fixed.Address = "N/A";

      if (fixed.Contact) {
        fixed.Contact = fixed.Contact.replace(/\D/g, "");
        if (fixed.Contact.length < 10)
          fixed.Contact = "0900000000";
      } else {
        fixed.Contact = "0900000000";
      }
      break;

    // =======================
    // WAREHOUSES
    // =======================
    case "warehouses":
      if (!fixed.Location) fixed.Location = "Unknown";

      if (fixed.Capacity === "" || fixed.Capacity === null)
        fixed.Capacity = 0;

      if (Number(fixed.Capacity) < 0)
        fixed.Capacity = Math.abs(Number(fixed.Capacity));
      break;

    // =======================
    // CUSTOMERS
    // =======================
    case "customers":
      if (!fixed.Email) {
        fixed.Email = "unknown@gmail.com";
      } else {
        // sửa format email
        fixed.Email = fixed.Email.replace("_at_", "@");
        if (!fixed.Email.includes(".")) fixed.Email += ".com";
      }

      if (fixed.Phone) {
        fixed.Phone = fixed.Phone.replace(/\D/g, "");
        if (fixed.Phone.length < 10)
          fixed.Phone = "0900000000";
      } else {
        fixed.Phone = "0900000000";
      }

      break;
  }

  return fixed;
}


// =================
// MAIN LOOP
// =================
for (const table of tables) {
  console.log(`\nĐang đọc dữ liệu bảng ${table}...`);

  // 1. Load rows
  const rows = await db.all(
    `SELECT * FROM ${table.charAt(0).toUpperCase() + table.slice(1)}_Staging`
  );

  console.log(`[${table}] Tổng số dòng: ${rows.length}`);

  // 2. Validate Pass 1
  const validator = new Validator(table);
  const { validRows, errorRows } = validator.validateData(rows);

  console.log(`[${table}] Sạch: ${validRows.length} | Lỗi: ${errorRows.length}`);

  // 3. Transform Pass 2
  const cleaned = [];
  const validator2 = new Validator(table);

  for (const e of errorRows) {
    const before = { ...e.row };
    const after = fixGenericRow(table, before);

    const result = validator2.validateRow(after);
    if (result.ok) {
      cleaned.push(after);

      const firstError = e.errors[0]; 
      const { field, reason } = parseError(firstError);

      const recordID =
        before.OrderID ||
        before.ProductID ||
        before.PaymentID ||
        before.CustomerID ||
        before.ShipmentID ||
        before.CategoryID ||
        before.SupplierID ||
        before.WarehouseID ||
        "UNKNOWN";

      if (before[field] !== after[field]) {
        logTransformDetail({
          table,
          rowNumber: e.rowNumber,
          recordID,
          field,
          reason,
          newVal: after[field]
        });
      }
    }
  }

  console.log(`[${table}] Đã sửa hợp lệ: ${cleaned.length}`);

  // 4. Gộp dữ liệu sạch
  const allCleanRows = [...validRows, ...cleaned];

  // 5. Ghi DataQuality
  const tableName = table.charAt(0).toUpperCase() + table.slice(1);

  await db.run(`
    CREATE TABLE IF NOT EXISTS ${tableName}_DataQuality AS
    SELECT * FROM ${tableName}_Staging WHERE 1=0
  `);

  await db.run(`DELETE FROM ${tableName}_DataQuality`);

  if (allCleanRows.length > 0) {
    const cols = Object.keys(allCleanRows[0]);
    const placeholders = cols.map(() => "?").join(", ");
    
    const insertSQL = `
      INSERT INTO ${tableName}_DataQuality (${cols.join(",")})
      VALUES (${placeholders})
    `;

    for (const row of allCleanRows) {
      const values = cols.map(c => row[c]);
      await db.run(insertSQL, values);
    }

    console.log(`[${table}] ĐÃ GHI ${allCleanRows.length} dòng sạch vào ${tableName}_DataQuality`);
  }

}
