//* Chạy toàn bộ thư mục validation
// validation/run_validation.js
import { Validator } from "./validator.js";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import fs from "fs";
import { log } from "console";

// 1. Mở kết nối đến DB Staging
const db = await open({
  filename: "./db/warehouse.db",
  driver: sqlite3.Database,
});

// 2. Đọc dữ liệu từ các bảng Staging
console.log("Đang đọc dữ liệu từ Staging...");
const orders = await db.all("SELECT * FROM Orders_Staging");
const products = await db.all("SELECT * FROM Products_Staging");
const payments = await db.all("SELECT * FROM  Payments_Staging");

console.log(`Orders_Staging: ${orders.length} dòng`);
console.log(`Products_Staging: ${products.length} dòng`);
console.log(`Payments_Staging: ${payments.length} dòng`);

// 3. Tạo validator cho từng bảng
const orderValidator = new Validator("orders");
const productValidator = new Validator("products");
const paymentValidator = new Validator("payments");

// 4. Chạy validation
console.log("Đang kiểm tra dữ liệu Orders...");
const orderResult = orderValidator.validateData(orders);
Validator.logErrors(orderResult.errorRows);

console.log("Đang kiểm tra dữ liệu Products...");
const productResult = productValidator.validateData(products);
Validator.logErrors(productResult.errorRows);

console.log("Đang kiểm tra dữ liệu Payments...");
const paymentResult = paymentValidator.validateData(payments);
Validator.logErrors(paymentResult.errorRows);
// 5. Ghi dữ liệu hợp lệ ra file JSON (tạm thời)
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
fs.writeFileSync(
  "./data/Orders_Cleaned.json",
  JSON.stringify(orderResult.validRows, null, 2),
  "utf8"
);
fs.writeFileSync(
  "./data/Products_Cleaned.json",
  JSON.stringify(productResult.validRows, null, 2),
  "utf8"
);
fs.writeFileSync(
  "./data/Payments_Cleaned.json",
  JSON.stringify(paymentResult.validRows, null, 2),
  "utf8"
);
// 6. Ghi log tổng kết
const summary = `
=============================
📊 ETL VALIDATION SUMMARY
=============================
Orders:
  Hợp lệ: ${orderResult.validRows.length}
  Lỗi: ${orderResult.errorRows.length}
Products:
  Hợp lệ: ${productResult.validRows.length}
  Lỗi: ${productResult.errorRows.length}
Payments:
  Hợp lệ: ${paymentResult.validRows.length}
  Lỗi: ${paymentResult.errorRows.length}
-----------------------------`
;
fs.appendFileSync("./validation/logs/etl.log", summary);
console.log(summary);

// 7. Đóng DB
await db.close();
