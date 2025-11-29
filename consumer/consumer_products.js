//! 1. Import thư viện
import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

//! 2. Cấu hình
const queue = "products_queue";
const dbPath = "./db/warehouse.db";

//! 3. Hàm chính
async function consumeProducts() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  console.log(`👂 Đang lắng nghe hàng đợi: ${queue}`);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const product = JSON.parse(msg.content.toString());
      console.log("📥 Nhận Product:", product);

      // Ghi xuống bảng Products_Staging
      const sql = `
        INSERT INTO Staging_Products
        (ProductID, Name, CategoryID, SupplierID, StockQuantity, Price)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.run(sql, [
        product.ProductID,
        product.Name,
        product.CategoryID,
        product.SupplierID,
        product.StockQuantity,
        product.Price,
      ]);

      channel.ack(msg); // xác nhận đã xử lý
    }
  });
}

consumeProducts().catch((err) => console.error("❌ Lỗi:", err));
