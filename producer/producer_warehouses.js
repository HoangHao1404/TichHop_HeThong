//! 1. Import thư viện cần thiết
import amqp from "amqplib";     // Giao tiếp RabbitMQ
import sqlite3 from "sqlite3";   // Kết nối SQLite
import { open } from "sqlite";   // Dễ dùng với async/await

//! 2. Cấu hình cơ bản
const queue = "warehouses_queue";      // Tên hàng đợi RabbitMQ
const dbPath = "./db/warehouse.db";  // Đường dẫn tới file database

//! 3. Hàm chính xử lý gửi dữ liệu
async function sendWarehouses() {
    //! 4. Kết nối tới Database
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    //! 5. Truy vấn toàn bộ dữ liệu từ bảng Warehouses
    const rows = await db.all("SELECT * FROM Warehouses"); // Mỗi row là 1 object nhà cung cấp

    //! 6. Kết nối tới RabbitMQ và tạo hàng đợi
    const connection = await amqp.connect("amqp://localhost"); // Kết nối tới RabbitMQ
    const channel = await connection.createChannel();           // Tạo kênh giao tiếp
    await channel.assertQueue(queue);                           // Tạo hàng đợi nếu chưa có

    //! 7. Gửi từng bản ghi lên hàng đợi
    for (const row of rows) {
        const message = Buffer.from(JSON.stringify(row));        // Chuyển object thành Buffer
        channel.sendToQueue(queue, message);                     // Gửi message lên queue
        console.log("📤 Sent Warehouses:", row);                    // Log mỗi bản ghi
    }

    //! 8. Đóng kết nối gọn gàng
    await channel.close();
    await connection.close();
    await db.close();
    console.log("✅ Done Warehouses");
}

//! 9. Thực thi hàm và xử lý lỗi
sendWarehouses()
    .then(() => console.log("✅ Done sending warehouses"))
    .catch(err => console.error("❌ Error:", err));
