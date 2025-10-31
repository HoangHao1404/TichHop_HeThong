//! 1. Import thư viện cần thiết
import amqp from "amqplib";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
//! 2. Cấu hình cơ bản
const queue = "suppliers_queue";
const dbPath = "./db/warehouse.db";
//! 3. Hàm chính xử lý gửi dữ liệu
async function sendSuppliers() {
    //! 4. Mở Kết nối tới Database
    const db = await open({             // Mở kết nối tới database
        filename: dbPath,               // Đường dẫn tới file database
        driver: sqlite3.Database,       // Sử dụng driver SQLite3
    });
    //! 5. Truy vấn toàn bộ dữ liệu từ bảng Suppliers
    const rows = await db.all("SELECT * FROM Suppliers");
    //! 6. Kết nối tới RabbitMQ và tạo hàng đợi
    const connection = await amqp.connect("amqp://localhost"); // Kết nối đến RabbitMQ
    const channel = await connection.createChannel();           // Tạo kênh giao tiếp
    await channel.assertQueue(queue);                           // Tạo hàng đợi nếu chưa có
    //! 7. Gửi từng bản ghi lên hàng đợi
     for (const row of rows) {
        const message = Buffer.from(JSON.stringify(row));        // Chuyển object thành Buffer
        channel.sendToQueue(queue, message);                     // Gửi message lên queue
        console.log("📤 Sent Supplier:", row);                    // Log mỗi bản ghi
    }
    //! 8. Đóng kết nối gọn gàng
    await channel.close();
    await connection.close();
    await db.close();
    console.log("✅ Done Suppliers");
}
//! 9. Thực thi hàm và xử lý lỗi
sendSuppliers()
    .then(() => console.log("✅ Done sending suppliers"))
    .catch(err => console.error("❌ Error:", err));
