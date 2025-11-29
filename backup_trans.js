// import { Validator } from "./validator.js";
// import { open } from "sqlite";
// import sqlite3 from "sqlite3";
// import fs from "fs";
// function parseError(errString) {
//   if (!errString || typeof errString !== "string") {
//     return { field: "UNKNOWN", reason: errString || "" };
//   }
//   const field = errString.split(" ")[0];
//   const reason = errString.replace(field, "").trim();
//   return { field, reason };
// }
// function logTransformDetail({
//   table,
//   rowNumber,
//   recordID,
//   field,
//   reason,
//   newVal,
// }) {
//   const csvLine = `${table},${rowNumber},${recordID},${field},"${reason}",${newVal}\n`;
//   fs.appendFileSync("./validation/logs/transform.csv", csvLine, "utf8");
// }

// // Kết nối database
// const db = await open({
//   filename: "./db/warehouse.db",
//   driver: sqlite3.Database,
// });

// // Tạo folder log nếu chưa có
// if (!fs.existsSync("./validation/logs")) {
//   fs.mkdirSync("./validation/logs", { recursive: true });
// }

// // reset transform.csv
// fs.writeFileSync(
//   "./validation/logs/transform.csv",
//   "table,rowNumber,recordID,field,reason,newValue\n",
//   "utf8"
// );
// fs.writeFileSync(
//   "./validation/logs/transform_errors.csv",
//   "table,rowNumber,recordID,errors\n",
//   "utf8"
// );

// const tables = [
//   "orders",
//   "products",
//   "payments",
//   "shipments",
//   "categories",
//   "suppliers",
//   "warehouses",
//   "customers",
// ];
// // FIX RULE
// function fixGenericRow(table, row) {
//   const fixed = { ...row };
//   // COMMON FIX
//   for (const key in fixed) {
//     if (typeof fixed[key] === "string") fixed[key] = fixed[key].trim();
//     if (fixed[key] === null || fixed[key] === undefined) fixed[key] = "";
//   }

//   switch (table) {
//     case "orders":
//       if (Number(fixed.Quantity) <= 0) fixed.Quantity = 1;
//       if (!fixed.Price || Number(fixed.Price) <= 0) fixed.Price = 100000;

//       if (!fixed.OrderDate) fixed.OrderDate = "2000-01-01";
//       if (fixed.OrderDate === "2025-13-01") fixed.OrderDate = "2025-01-13";
//       break;

//     case "products":
//       if (Number(fixed.Price) <= 0) fixed.Price = 150000;
//       if (!fixed.CategoryID) fixed.CategoryID = "C99";

//       if (Number(fixed.StockQuantity) < 0)
//         fixed.StockQuantity = Math.abs(Number(fixed.StockQuantity));
//       break;

//     case "payments":
//       if (Number(fixed.Amount) <= 0) fixed.Amount = 100000;
//       if (!fixed.PaymentDate) fixed.PaymentDate = "2000-01-01";

//       if (fixed.PaymentDate === "2025-13-01") fixed.PaymentDate = "2025-01-13";
//       break;

//     case "shipments":
//       if (!fixed.ShipperName || fixed.ShipperName === "FakeShipper")
//         fixed.ShipperName = "Unknown";

//       if (!fixed.ShipDate) fixed.ShipDate = "2000-01-01";
//       if (fixed.ShipDate === "2025-13-06") fixed.ShipDate = "2025-06-13";
//       break;

//     case "categories":
//       if (!fixed.CategoryName) fixed.CategoryName = "Unknown Category";
//       break;

//     case "suppliers":
//       if (!fixed.Name) fixed.Name = "Unknown Supplier";
//       if (!fixed.Address) fixed.Address = "N/A";

//       if (fixed.Contact) {
//         fixed.Contact = fixed.Contact.replace(/\D/g, "");
//         if (fixed.Contact.length < 10) fixed.Contact = "0900000000";
//       } else {
//         fixed.Contact = "0900000000";
//       }
//       break;

//     case "warehouses":
//       if (!fixed.Location) fixed.Location = "Unknown";

//       if (!fixed.Capacity) fixed.Capacity = 0;
//       if (Number(fixed.Capacity) < 0)
//         fixed.Capacity = Math.abs(Number(fixed.Capacity));
//       break;

//     case "customers":
//       if (!fixed.Email) {
//         fixed.Email = "unknown@gmail.com";
//       } else {
//         fixed.Email = fixed.Email.replace("_at_", "@");
//         if (!fixed.Email.includes(".")) fixed.Email += ".com";
//       }

//       if (fixed.Phone) {
//         fixed.Phone = fixed.Phone.replace(/\D/g, "");
//         if (fixed.Phone.length < 10) fixed.Phone = "0900000000";
//       } else {
//         fixed.Phone = "0900000000";
//       }
//       break;
//   }

//   return fixed;
// }
// for (const table of tables) {
//   console.log(`\n${table}...`);

//   const base = table.charAt(0).toUpperCase() + table.slice(1); // orders -> Orders
//   const stagingTable = `Staging_${base}`;
//   const dataQualityTable = `DataQuality_${base}`;

//   const rows = await db.all(`SELECT * FROM ${stagingTable}`);

//   console.log(`Tổng số dòng: ${rows.length}`);

//   const validator = new Validator(table);
//   const { validRows, errorRows } = validator.validateData(rows);

//   console.log(`Sạch: ${validRows.length} | Lỗi: ${errorRows.length}`);

//   const cleaned = [];
//   const stillErrorRows = [];
//   const validator2 = new Validator(table);
//   for (const e of errorRows) {
//     const before = { ...e.row };
//     const after = fixGenericRow(table, before);

//     const result = validator2.validateRow(after);

//     if (result.ok) {
//       cleaned.push(after);

//       const firstError = e.errors[0];
//       const { field, reason } = parseError(firstError);

//       const recordID =
//         before.OrderID ||
//         before.ProductID ||
//         before.PaymentID ||
//         before.CustomerID ||
//         before.ShipmentID ||
//         before.CategoryID ||
//         before.SupplierID ||
//         before.WarehouseID ||
//         "UNKNOWN";

//       if (before[field] !== after[field]) {
//   logTransformDetail({
//     table: base,
//     rowNumber: e.rowNumber,
//     recordID,
//     field,
//     reason,
//     newVal: after[field],
//   });
// }

//     } else {
//       stillErrorRows.push({
//         table,
//         rowNumber: e.rowNumber,
//         recordID:
//           e.row.OrderID ||
//           e.row.ProductID ||
//           e.row.PaymentID ||
//           e.row.CustomerID ||
//           e.row.ShipmentID ||
//           e.row.CategoryID ||
//           e.row.SupplierID ||
//           e.row.WarehouseID ||
//           "UNKNOWN",
//         errors: result.errors,
//       });
//     }
//   }
//   console.log(`Đã sửa hợp lệ: ${cleaned.length}`);
//   // ===== Ghi stillErrorRows vào CSV =====
//   if (stillErrorRows.length > 0) {
//     for (const err of stillErrorRows) {
//       const line = `${err.table},${err.rowNumber},${
//         err.recordID
//       },"${err.errors.join("; ")}"\n`;
//       fs.appendFileSync("./validation/logs/transform_errors.csv", line, "utf8");
//     }
//     console.log(`Vẫn lỗi: ${stillErrorRows.length} dòng không sửa được`);
//   }
//   const allCleanRows = [...validRows, ...cleaned];
//   await db.run(`
//   CREATE TABLE IF NOT EXISTS ${dataQualityTable} AS
//   SELECT * FROM ${stagingTable} WHERE 1=0
// `);

// await db.run(`DELETE FROM ${dataQualityTable}`);

//   if (allCleanRows.length > 0) {
//     const cols = Object.keys(allCleanRows[0]);
//     const placeholders = cols.map(() => "?").join(", ");
//     const insertSQL = `
//       INSERT INTO ${dataQualityTable}(${cols.join(",")})
//       VALUES (${placeholders})
//     `;
//     for (const row of allCleanRows) {
//   const values = cols.map(c => row[c]);
//   await db.run(insertSQL, values);
// }

//     console.log(`ĐÃ GHI ${allCleanRows.length} dòng sạch vào ${dataQualityTable}`);

//   }
// }