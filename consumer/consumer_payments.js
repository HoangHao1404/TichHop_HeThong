import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const queue = "payments_queue";
const dbPath = "./db/warehouse.db";

async function consumePayments() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  console.log(`👂 Đang lắng nghe: ${queue}`);

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const payment = JSON.parse(msg.content.toString());
      console.log("📥 Nhận Payment:", payment);
      const sql = `
        INSERT INTO Payments_Staging
        (PaymentID, OrderID, PaymentMethod, Amount, PaymentDate)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.run(sql, [
        payment.PaymentID,
        payment.OrderID,
        payment.PaymentMethod,
        payment.Amount,
        payment.PaymentDate,
      ]);
      channel.ack(msg);
    }
  });
}

consumePayments().catch(console.error);
