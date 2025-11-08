// validation/run_validation.js
// * Chạy toàn bộ validation, tách dữ liệu sạch - lỗi và ghi log theo pipeline
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { Validator } from "./validator.js";
import { Transformer } from "./transformer.js";
import { errorHandler } from "./errorHandler.js";

const TABLES = [
  { key: "orders", staging: "Orders_Staging", output: "Orders_Cleaned.json" },
  { key: "products", staging: "Products_Staging", output: "Products_Cleaned.json" },
  { key: "payments", staging: "Payments_Staging", output: "Payments_Cleaned.json" },
  { key: "customers", staging: "Customers_Staging", output: "Customers_Cleaned.json" },
  { key: "shipments", staging: "Shipments_Staging", output: "Shipments_Cleaned.json" },
  { key: "categories", staging: "Categories_Staging", output: "Categories_Cleaned.json" },
  { key: "suppliers", staging: "Suppliers_Staging", output: "Suppliers_Cleaned.json" },
  { key: "warehouses", staging: "Warehouses_Staging", output: "Warehouses_Cleaned.json" },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");

const ensureDataDirectory = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readTable = async (db, stagingName) => {
  try {
    return await db.all(`SELECT * FROM ${stagingName}`);
  } catch (error) {
    console.error(`[Validation] Không thể đọc ${stagingName}: ${error.message}`);
    return null;
  }
};

const persistValidRows = (tableConfig, rows) => {
  const outputPath = path.join(DATA_DIR, tableConfig.output);
  fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), "utf8");
  return outputPath;
};

const run = async () => {
  errorHandler.initialiseLogStore();
  ensureDataDirectory();

  const db = await open({
    filename: path.join(ROOT_DIR, "db", "warehouse.db"),
    driver: sqlite3.Database,
  });

  const summaryItems = [];

  for (const table of TABLES) {
    console.log(`[Validation] Đang đọc dữ liệu từ ${table.staging}...`);
    const rows = await readTable(db, table.staging);
    const summaryTitle = `${table.key.charAt(0).toUpperCase()}${table.key.slice(1)}`;

    if (!rows) {
      summaryItems.push({
        title: summaryTitle,
        total: 0,
        valid: 0,
        transformed: 0,
        finalValid: 0,
        invalid: 0,
      });
      continue;
    }

    console.log(`[Validation] ${table.staging}: ${rows.length} dòng`);

    const validator = new Validator(table.key);
    const { validRows, errorRows } = validator.validateData(rows);

    errorHandler.appendGlobalErrors(table.key, errorRows, "validation");
    errorHandler.writeTableErrorLog(table.key, errorRows, "validation");
    errorHandler.writeInvalidSnapshot(table.key, errorRows, "validation");

    let cleanedRows = [];
    let transformInvalid = [];

    if (errorRows.length) {
      const transformer = new Transformer(table.key, validator);
      const transformResult = transformer.transform(errorRows);
      cleanedRows = transformResult.cleanedRows;
      transformInvalid = transformResult.invalidRows;

      if (cleanedRows.length) {
        errorHandler.writeTransformLog(table.key, cleanedRows);
        errorHandler.writeTransformSnapshot(table.key, cleanedRows);
      } else {
        errorHandler.writeTransformLog(table.key, []);
        errorHandler.writeTransformSnapshot(table.key, []);
      }

      if (transformInvalid.length) {
        errorHandler.appendGlobalErrors(table.key, transformInvalid, "transform");
      }
      errorHandler.writeTableErrorLog(table.key, transformInvalid, "transform");
      errorHandler.writeInvalidSnapshot(table.key, transformInvalid, "transform");
    } else {
      errorHandler.writeTransformLog(table.key, []);
      errorHandler.writeTransformSnapshot(table.key, []);
      errorHandler.writeTableErrorLog(table.key, [], "transform");
      errorHandler.writeInvalidSnapshot(table.key, [], "transform");
    }

    const transformedRows = cleanedRows.map((entry) => entry.transformedRow);
    const finalValidRows = [...validRows, ...transformedRows];
    persistValidRows(table, finalValidRows);

    summaryItems.push({
      title: summaryTitle,
      total: rows.length,
      valid: validRows.length,
      transformed: transformedRows.length,
      finalValid: finalValidRows.length,
      invalid: transformInvalid.length,
    });

    console.log(
      `[Validation] ${table.key}: hợp lệ ${validRows.length} | lỗi ${errorRows.length}`
    );
    if (errorRows.length) {
      console.log(
        `[Transform] ${table.key}: làm sạch thêm ${transformedRows.length} | còn lại ${transformInvalid.length}`
      );
    }
  }

  const summaryContent = errorHandler.writeSummary(summaryItems);
  console.log(summaryContent);

  await db.close();
};

run().catch((error) => {
  console.error("[Validation] Pipeline thất bại:", error);
  process.exitCode = 1;
});
