import fs from "fs";
import csv from "csv-parser";
import amqp from "amqplib";


const queue = "shipments_queue";
const filePath  = "./data/Shipments.csv";

async function sendShipment() {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row)=>{
            try {
                channel.sendToQueue(queue, Buffer.from(JSON.stringify(row)));
                console.log("📤 Sent Shipment:", row);
            } catch (err) {
                console.error("⚠️ Lỗi gửi message:", err.message);
            }
        })
        .on("end", async()=>{
            console.log("✅ Done Shipment.csv nhé");
            // 👇 Chờ nhẹ 0.2 giây để RabbitMQ nhận message cuối
            await new Promise(r => setTimeout(r, 200));
            try {
                await channel.close();
                await connection.close();
            } catch (err) {
                console.warn("⚠️ Channel đã đóng trước đó:", err.message);
            }
        });
}
sendShipment();
