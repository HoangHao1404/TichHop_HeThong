import { exec } from "child_process";

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
