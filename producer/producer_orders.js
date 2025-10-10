//! 1. Import các module cần thiết
import fs from "fs";
import csv from "csv-parser";   //* đọc file CSV
import amqp from "amqplib";     //* giao tiếp với RabbitMQ

//! 2. Cấu hình đường dẫn và queue
const queue = "orders_queue";            // TODO: Tên queue để gửi hàng đợi lên RabbitMQ
const filePath = "./data/Orders.csv";    // TODO: Đường dẫn tới file Orders.csv

//! 3. Viết hàm kết nối tới RabbitMQ
async function sendOrders() {

  //! 4. Tạo kết nối đến RabbitMQ
  const connection = await amqp.connect("amqp://localhost");  // Kết nối tới RabbitMQ
  const channel = await connection.createChannel();           // Tạo kênh giao tiếp
  await channel.assertQueue(queue);                           // Tạo hàng đợi nếu chưa tồn tại

  //! 5. Đọc file CSV và gửi từng dòng lên RabbitMQ
  fs.createReadStream(filePath)        // Đọc file Orders.csv
    .pipe(csv())                       // Chuyển đổi từng dòng CSV thành object
    .on("data", (row) => {             // Duyệt từng hàng trong file CSV
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(row)));  // Gửi từng hàng lên hàng đợi
      console.log("📤 Sent:", row);
    })
    .on("end", async () => {           // Khi đọc xong toàn bộ file
      console.log("✅ Done Orders.csv nhé!");
      await channel.close();           // Đóng kênh giao tiếp
      await connection.close();        // Đóng kết nối RabbitMQ
    });
}

//! 6. Gọi hàm
sendOrders();
