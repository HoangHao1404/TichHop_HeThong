import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const queue = "customers_queue";
const dbPath = "./db/warehouse.db";

async function consumeCustomers() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  console.log(`👂 Đang lắng nghe: ${queue}`);

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const customer = JSON.parse(msg.content.toString());
      console.log("📥 Nhận Customer:", customer);
      const sql = `
        INSERT INTO Customers_Staging
        (CustomerID, Name, Email, Phone, Address)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.run(sql, [
        customer.CustomerID,
        customer.Name,
        customer.Email,
        customer.Phone,
        customer.Address,
      ]);
      channel.ack(msg);
    }
  });
}

consumeCustomers().catch(console.error);
