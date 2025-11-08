// validation/errorHandler.js
// Tiện ích ghi log phục vụ pipeline validation -> transform
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, "logs");

const ensureLogDir = () => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
};

const resolveLogPath = (fileName) => path.join(LOG_DIR, fileName);

const formatValue = (value) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const stagePrefixes = {
  validation: "[Validation]",
  transform: "[Transform]",
};

const toErrorLines = (tableName, errorRows, { stage = "validation" } = {}) =>
  errorRows.map((entry) => {
    const detail = (entry.errors || [])
      .map((error) =>
        error.message ? error.message : `${error.column} không hợp lệ (giá trị: ${formatValue(error.value)})`
      )
      .join("; ");
    const notes = entry.notes?.length ? ` | Transform ghi chú: ${entry.notes.join("; ")}` : "";
    return `${stagePrefixes[stage] ?? "[Validation]"} [${tableName}] Row ${entry.rowNumber}: ${detail}${notes}`;
  });

const toTransformLines = (tableName, cleanedRows) =>
  cleanedRows.map((entry) => {
    const note = entry.notes?.length
      ? entry.notes.join("; ")
      : "Đã làm sạch dữ liệu";
    return `[${tableName}] Row ${entry.rowNumber}: ${note}`;
  });

export const errorHandler = {
  initialiseLogStore() {
    ensureLogDir();

    const baseLogs = ["error.log", "etl.log", "transform.log"];

    for (const baseFile of baseLogs) {
      fs.writeFileSync(resolveLogPath(baseFile), "", "utf8");
    }

    for (const entry of fs.readdirSync(LOG_DIR)) {
      if (!baseLogs.includes(entry)) {
        fs.rmSync(resolveLogPath(entry));
      }
    }
  },

  appendGlobalErrors(tableName, errorRows, stage = "validation") {
    if (!errorRows.length) return;
    ensureLogDir();
    const lines = toErrorLines(tableName, errorRows, { stage });
    fs.appendFileSync(resolveLogPath("error.log"), `${lines.join("\n")}\n`, "utf8");
  },

  writeTableErrorLog(tableName, errorRows, stage = "validation") {
    ensureLogDir();
    const suffix = stage === "validation" ? "validation_errors" : `${stage}_errors`;
    const filePath = resolveLogPath(`${tableName}_${suffix}.log`);
    if (!errorRows.length) {
      fs.writeFileSync(
        filePath,
        `# ${tableName} ${stage}\n# Không phát hiện lỗi\n`,
        "utf8"
      );
      return filePath;
    }

    const header = `# ${tableName} ${stage} errors (${errorRows.length})`;
    const lines = [header, ...toErrorLines(tableName, errorRows, { stage })];
    fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
    return filePath;
  },

  writeInvalidSnapshot(tableName, errorRows, stage = "validation") {
    ensureLogDir();
    const payload = errorRows.map((entry) => ({
      rowNumber: entry.rowNumber,
      ...(entry.originalRow ? { originalRow: entry.originalRow } : {}),
      row: entry.row ?? entry.transformedRow ?? entry.originalRow,
      errors: (entry.errors || []).map((error) => ({
        column: error.column,
        value: error.value,
        message: error.message,
        ruleIndex: error.ruleIndex,
      })),
      ...(entry.notes?.length ? { notes: entry.notes } : {}),
    }));

    const suffix = stage === "validation" ? "invalid" : `${stage}_invalid`;
    const filePath = resolveLogPath(`${tableName}_${suffix}.json`);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
    return filePath;
  },

  writeTransformLog(tableName, cleanedRows) {
    ensureLogDir();
    const filePath = resolveLogPath(`${tableName}_transform.log`);
    if (!cleanedRows.length) {
      fs.writeFileSync(
        filePath,
        `# ${tableName} transform\n# Không có dòng nào được làm sạch\n`,
        "utf8"
      );
      return filePath;
    }

    const lines = [`# ${tableName} transform cleaned (${cleanedRows.length})`, ...toTransformLines(tableName, cleanedRows)];
    fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");

    const globalLines = toTransformLines(tableName, cleanedRows).map((line) => `${stagePrefixes.transform} ${line}`);
    fs.appendFileSync(resolveLogPath("transform.log"), `${globalLines.join("\n")}\n`, "utf8");
    return filePath;
  },

  writeTransformSnapshot(tableName, cleanedRows) {
    ensureLogDir();
    const payload = cleanedRows.map((entry) => ({
      rowNumber: entry.rowNumber,
      originalRow: entry.originalRow,
      transformedRow: entry.transformedRow,
      notes: entry.notes,
    }));
    const filePath = resolveLogPath(`${tableName}_transform_cleaned.json`);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
    return filePath;
  },

  writeSummary(summaryItems) {
    ensureLogDir();
    const summaryLines = [
      "=============================",
      "ETL VALIDATION SUMMARY",
      "=============================",
      ...summaryItems.flatMap((item) => [
        `${item.title}:`,
        `  Tổng staging: ${item.total}`,
        `  Hợp lệ ban đầu: ${item.valid}`,
        `  Được làm sạch thêm: ${item.transformed}`,
        `  Tổng hợp lệ cuối: ${item.finalValid}`,
        `  Còn lỗi: ${item.invalid}`,
        "-----------------------------",
      ]),
    ];

    const content = `${summaryLines.join("\n")}\n`;
    fs.writeFileSync(resolveLogPath("etl.log"), content, "utf8");
    return content;
  },
};
