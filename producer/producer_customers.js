//! Import các module cần thiết
import fs from "fs";
import csv from "csv-parser";  //* đọc file csv
import amqp from "amqplib";  //* giao tiếp với RabbitMQ
//! Cấu hình đường dẫn với queue
const queue = "customers_queue";                // TODO Tên queue để gửi hàng đợi lên RabbitMQ
const filePath = "./data/Customers.csv";         // TODO Đường dẫn tới file Customers.csv

//! Viết hàm kết nối đến RabbitMQ
async function sendCustomer() {
    const connection = await amqp.connect("amqp://localhost");      // Kết nối đến RabbitMQ
    const channel = await connection.createChannel();               // Tạo 1 kênh giao tiếp
    await channel.assertQueue(queue);                               // Nếu chưa có hàng đợi thì tạo

    //! Đọc file
    fs.createReadStream(filePath) 
        .pipe(csv())                // Chuyển đổi từng dòng CSV sang kiểu Object
        .on("data", (row)=>{
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(row)));
            console.log("📤 Sent:", row);
        })
        .on("end", async () => {           // Khi đọc xong toàn bộ file
            console.log("✅ Done Customers.csv nhé!");
            await channel.close();           // Đóng kênh giao tiếp
            await connection.close();        // Đóng kết nối RabbitMQ
        }); 
}
sendCustomer();