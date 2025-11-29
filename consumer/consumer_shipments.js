import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const queue = "shipments_queue";
const dbPath = "./db/warehouse.db";

async function consumeShipments() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  console.log(`👂 Đang lắng nghe: ${queue}`);

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const shipment = JSON.parse(msg.content.toString());
      console.log("📥 Nhận Shipment:", shipment);
      const sql = `
  INSERT INTO Staging_Shipments
  (ShipmentID, OrderID, ShipperName, ShipDate, DeliveryStatus)
  VALUES (?, ?, ?, ?, ?)
`;
      await db.run(sql, [
        shipment.ShipmentID,
        shipment.OrderID,
        shipment.ShipperName,
        shipment.ShipDate,
        shipment.DeliveryStatus,
      ]);

      channel.ack(msg);
    }
  });
}

consumeShipments().catch(console.error);
