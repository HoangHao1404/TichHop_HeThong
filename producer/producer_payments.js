import fs from "fs";
import csv from "csv-parser";
import amqp from "amqplib";

const queue = "payments_queue";
const filePath = "./data/Payments.csv";

async function sendPayments() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(row)));
      console.log("📤 Sent Payment:", row);
    })
    .on("end", async () => {
      console.log("Done Payments.csv nhé");
      await channel.close();
      await connection.close();
    });
}
sendPayments().catch((err) => console.error("❌ Error:", err));
