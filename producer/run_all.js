import { exec } from "child_process";

const producers = [
  "producer_orders.js",
  "producer_customers.js",
  "producer_payments.js",
  "producer_shipments.js",
  "producer_products.js",
  "producer_categories.js",
  "producer_suppliers.js",
  "producer_warehouses.js",
];

for (const file of producers) {
  exec(`node producer/${file}`, (err, stdout, stderr) => {
    if (err) {
      console.error(` Lỗi khi chạy ${file}:`, err.message);
      return;
    }
    console.log(` ${file} hoàn tất`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
}
