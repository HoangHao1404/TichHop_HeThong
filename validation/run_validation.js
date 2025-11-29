// validation/run_validation.js
import { Validator } from "./validator.js";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import fs from "fs";
import csv from "csv-parser";
// 1 Mở kết nối đến DB Staging
const db = await open({
  filename: "./db/warehouse.db",
  driver: sqlite3.Database,
});
// 2 Danh sách bảng Staging cần kiểm tra
const tables = [
  "orders",
  "products",
  "payments",
  "customers",
  "shipments",
  "categories",
  "suppliers",
  "warehouses",
];
// 3. Chuẩn bị thư mục log
if (!fs.existsSync("./validation/logs"))
  fs.mkdirSync("./validation/logs", { recursive: true });
// Reset log cũ để mỗi lần chạy có file mới
fs.writeFileSync("./validation/logs/error.log", "");
fs.writeFileSync("./validation/logs/etl.log", "");
// 4 Chạy lần lượt từng bảng
const summary = [];
for (const table of tables) {
  // 4.1 Đọc dữ liệu từ bảng Staging
  const base = table.charAt(0).toUpperCase() + table.slice(1);
const stagingTable = `Staging_${base}`;

const rows = await db.all(`SELECT * FROM ${stagingTable}`);

  // 4.2 Khởi tạo validator
  const validator = new Validator(table);
  // 4.3 Chạy validate
  const idKeyMap = {
    orders: "OrderID",
    products: "ProductID",
    payments: "PaymentID",
    customers: "CustomerID",
    shipments: "ShipmentID",
    categories: "CategoryID",
    suppliers: "SupplierID",
    warehouses: "WarehouseID",
  };
  const sourceTableMap = {
    products: "Products",
    categories: "Categories",
    suppliers: "Suppliers",
    warehouses: "Warehouses",
  };
  const idKey = idKeyMap[table];
  const dataPath = `./data/${base}.csv`;
  const idToRowNumber = {};
  if (fs.existsSync(dataPath) && idKey) {
    let line = 2;
    await new Promise((resolve) => {
      fs.createReadStream(dataPath)
        .pipe(csv())
        .on("data", (r) => {
          const id = r[idKey];
          if (id) idToRowNumber[id] = line;
          line++;
        })
        .on("end", resolve);
    });
  } else if (sourceTableMap[table] && idKey) {
    const srcTable = sourceTableMap[table];
    const srcRows = await db.all(`SELECT ${idKey} AS id FROM ${srcTable} ORDER BY rowid`);
    let line = 1;
    for (const r of srcRows) {
      if (r.id) idToRowNumber[r.id] = line;
      line++;
    }
  }
  const { validRows, errorRows } = validator.validateData(rows, { idToRowNumber });
  // 4.4 Ghi log lỗi
  Validator.logErrors(errorRows); // ghi log lỗi
  // 4.7 Ghi vào bảng tổng hợp
  summary.push({
    name: table,
    valid: validRows.length,
    errors: errorRows.length,
  });
}
// 5 Ghi tổng kết ETL giống bản cũ
let report = `
`;
for (const s of summary) {
  report += `${s.name.charAt(0).toUpperCase() + s.name.slice(1)}:
  Hợp lệ: ${s.valid}
  Lỗi: ${s.errors}
`;
}
fs.appendFileSync("./validation/logs/etl.log", report);
console.log("\n" + report);
// 6 Đóng DB
await db.close();
