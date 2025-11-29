import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const queue = "categories_queue";
const dbPath = "./db/warehouse.db";

async function consumeCategories() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  console.log(`👂 Đang lắng nghe: ${queue}`);

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const category = JSON.parse(msg.content.toString());
      console.log("📥 Nhận Category:", category);
      const sql = `
        INSERT INTO Staging_Categories
        (CategoryID, CategoryName)
        VALUES (?, ?)
      `;
      await db.run(sql, [category.CategoryID, category.CategoryName]);
      channel.ack(msg);
    }
  });
}

consumeCategories().catch(console.error);
