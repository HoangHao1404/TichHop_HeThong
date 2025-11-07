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
const customers = await db.all("SELECT * FROM Customers_Staging");
const shipments = await db.all("SELECT * FROM Shipments_Staging");
const categories = await db.all("SELECT * FROM Categories_Staging");
const suppliers = await db.all("SELECT * FROM Suppliers_Staging");
const warehouses = await db.all("SELECT * FROM Warehouses_Staging");

console.log(`Orders_Staging: ${orders.length} dòng`);
console.log(`Products_Staging: ${products.length} dòng`);
console.log(`Payments_Staging: ${payments.length} dòng`);
console.log(`Customers_Staging: ${customers.length} dòng`);
console.log(`Shipments_Staging: ${shipments.length} dòng`);
console.log(`Categories_Staging: ${categories.length} dòng`);
console.log(`Suppliers_Staging: ${suppliers.length} dòng`);
console.log(`Warehouses_Staging: ${warehouses.length} dòng`);

// 3. Tạo validator cho từng bảng
const orderValidator = new Validator("orders");
const productValidator = new Validator("products");
const paymentValidator = new Validator("payments");
const customerValidator = new Validator("customers");
const shipmentValidator = new Validator("shipments");
const categorieValidator = new Validator("categories");
const supplierValidator = new Validator("suppliers");
const warehouseValidator = new Validator("warehouses");



// 4. Chạy validation
console.log("Đang kiểm tra dữ liệu Orders...");
const orderResult = orderValidator.validateData(orders);
Validator.logErrors(orderResult.errorRows);

console.log("Đang kiểm tra dữ liệu Shipments...");
const shipmentResult = shipmentValidator.validateData(shipments);
Validator.logErrors(shipmentResult.errorRows);

console.log("Đang kiểm tra dữ liệu Categories...");
const categorieResult = categorieValidator.validateData(categories);
Validator.logErrors(categorieResult.errorRows);

console.log("Đang kiểm tra dữ liệu Suppliers...");
const supplierResult = supplierValidator.validateData(suppliers);
Validator.logErrors(supplierResult.errorRows);

console.log("Đang kiểm tra dữ liệu Warehouses...");
const warehouseResult = warehouseValidator.validateData(warehouses);
Validator.logErrors(warehouseResult.errorRows);

console.log("Đang kiểm tra dữ liệu Products...");
const productResult = productValidator.validateData(products);
Validator.logErrors(productResult.errorRows);

console.log("Đang kiểm tra dữ liệu Payments...");
const paymentResult = paymentValidator.validateData(payments);
Validator.logErrors(paymentResult.errorRows);

console.log("Đang kiểm tra dữ liệu Payments...");
const customerResult = customerValidator.validateData(customers);
Validator.logErrors(customerResult.errorRows);
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

fs.writeFileSync(
  "./data/Customers_Cleaned.json",
  JSON.stringify(customerResult.validRows, null, 2),
  "utf8"
);

fs.writeFileSync(
  "./data/Shipments_Cleaned.json",
  JSON.stringify(shipmentResult.validRows, null, 2),
  "utf8"
);

fs.writeFileSync(
  "./data/Categories_Cleaned.json",
  JSON.stringify(categorieResult.validRows, null, 2),
  "utf8"
);

fs.writeFileSync(
  "./data/Suppliers_Cleaned.json",
  JSON.stringify(supplierResult.validRows, null, 2),
  "utf8"
);

fs.writeFileSync(
  "./data/Warehouses_Cleaned.json",
  JSON.stringify(warehouseResult.validRows, null, 2),
  "utf8"
);
// 6. Ghi log tổng kết
const summary = `
=============================
ETL VALIDATION SUMMARY
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
Customers:
  Hợp lệ: ${customerResult.validRows.length}
  Lỗi: ${customerResult.errorRows.length}
Shipments:
  Hợp lệ: ${shipmentResult.validRows.length}
  Lỗi: ${shipmentResult.errorRows.length}
Categories:
  Hợp lệ: ${categorieResult.validRows.length}
  Lỗi: ${categorieResult.errorRows.length}
Suppliers:
  Hợp lệ: ${supplierResult.validRows.length}
  Lỗi: ${supplierResult.errorRows.length}
Warehouses:
  Hợp lệ: ${warehouseResult.validRows.length}
  Lỗi: ${warehouseResult.errorRows.length}
-----------------------------`
;
fs.appendFileSync("./validation/logs/etl.log", summary);
console.log(summary);

// 7. Đóng DB
await db.close();
