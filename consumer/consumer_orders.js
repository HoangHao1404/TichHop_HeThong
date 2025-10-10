import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const queue = "orders_queue";
const dbPath = "./db/warehouse.db";

async function consumeOrders() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  console.log(`👂 Đang lắng nghe: ${queue}`);

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString());
      console.log("📥 Nhận Order:", order);
      const sql = `
        INSERT INTO Orders_Staging
        (OrderID, ProductID, CustomerID, Quantity, Price, OrderDate)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.run(sql, [
        order.OrderID,
        order.ProductID,
        order.CustomerID,
        order.Quantity,
        order.Price,
        order.OrderDate,
      ]);
      channel.ack(msg);
    }
  });
}

consumeOrders().catch(console.error);
