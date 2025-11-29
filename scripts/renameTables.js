// scripts/renameTables.js
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const renameMap = {
  Orders_Staging: "Staging_Orders",
  Products_Staging: "Staging_Products",
  Customers_Staging: "Staging_Customers",
  Categories_Staging: "Staging_Categories",
  Suppliers_Staging: "Staging_Suppliers",
  Shipments_Staging: "Staging_Shipments",
  Warehouses_Staging: "Staging_Warehouses",
  Payments_Staging: "Staging_Payments",

  Orders_DataQuality: "DataQuality_Orders",
  Products_DataQuality: "DataQuality_Products",
  Customers_DataQuality: "DataQuality_Customers",
  Categories_DataQuality: "DataQuality_Categories",
  Suppliers_DataQuality: "DataQuality_Suppliers",
  Shipments_DataQuality: "DataQuality_Shipments",
  Warehouses_DataQuality: "DataQuality_Warehouses",
  Payments_DataQuality: "DataQuality_Payments",
};

async function main() {
  const db = await open({
    filename: "./db/warehouse.db",
    driver: sqlite3.Database,
  });

  for (const [oldName, newName] of Object.entries(renameMap)) {
    // kiểm tra bảng cũ có tồn tại không
    const row = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      oldName
    );
    if (!row) {
      console.log(`[SKIP] Table ${oldName} không tồn tại, bỏ qua`);
      continue;
    }

    console.log(`[RENAME] ${oldName} -> ${newName}`);
    await db.run(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
  }

  await db.close();
  console.log("DONE rename");
}

main().catch((err) => {
  console.error("Rename failed:", err);
});
