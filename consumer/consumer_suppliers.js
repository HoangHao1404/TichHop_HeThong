import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const queue = "suppliers_queue";
const dbPath = "./db/warehouse.db";

async function consumeSuppliers() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  console.log(`👂 Đang lắng nghe: ${queue}`);

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const supplier = JSON.parse(msg.content.toString());
      console.log("📥 Nhận Supplier:", supplier);
      const sql = `
        INSERT INTO Staging_Suppliers
        (SupplierID, Name, Contact, Address)
        VALUES (?, ?, ?, ?)
      `;
      await db.run(sql, [
        supplier.SupplierID,
        supplier.Name,
        supplier.Contact,
        supplier.Address,
      ]);
      channel.ack(msg);
    }
  });
}

consumeSuppliers().catch(console.error);
