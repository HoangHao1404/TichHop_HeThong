import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { exec } from "child_process";

async function cleanStaging() {
  const db = await open({
    filename: "./db/warehouse.db",
    driver: sqlite3.Database,
  });

  const tables = [
    "Orders_Staging",
    "Customers_Staging",
    "Payments_Staging",
    "Shipments_Staging",
    "Products_Staging",
    "Categories_Staging",
    "Suppliers_Staging",
    "Warehouses_Staging",
  ];

  for (const table of tables) {
    await db.run(`DELETE FROM ${table}`);
  }

  console.log("🧹 Đã làm sạch toàn bộ dữ liệu trong các bảng Staging!");
  await db.close();
}

await cleanStaging();

// Sau đó chạy các consumer như bình thường
const consumers = [
  "consumer_orders.js",
  "consumer_customers.js",
  "consumer_payments.js",
  "consumer_shipments.js",
  "consumer_products.js",
  "consumer_categories.js",
  "consumer_suppliers.js",
  "consumer_warehouses.js",
];

for (const file of consumers) {
  const process = exec(`node consumer/${file}`);

  process.stdout.on("data", (data) => {
    console.log(`[${file}] ${data.toString().trim()}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`[${file} ERROR] ${data.toString().trim()}`);
  });

  process.on("exit", (code) => {
    console.log(`⚙️ ${file} exited with code ${code}`);
  });
}
