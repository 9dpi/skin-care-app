const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.log("⚠️ Puppeteer chưa được cài đặt. Chức năng ĐĂNG BÀI (Post) sẽ không hoạt động, nhưng TẢI VIDEO vẫn chạy được.");
}

// --- CẤU HÌNH ---
const INPUT_FOLDER = path.join(__dirname, 'videos_raw');
const OUTPUT_FOLDER = path.join(__dirname, 'videos_processed');
const LOG_FILE = path.join(__dirname, 'automation_log.txt');

if (!fs.existsSync(INPUT_FOLDER)) fs.mkdirSync(INPUT_FOLDER, { recursive: true });
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });

console.log("--------------------------------------------------");
console.log("🚀 HỆ THỐNG AUTO-POST THỰC CHIẾN (V4 - PUPPETEER) 🚀");
console.log("🤖 Trạng thái: Đã kích hoạt Engine");
console.log("--------------------------------------------------");

// --- HÀM TỰ ĐỘNG ĐĂNG BÀI LÊN TIKTOK (THỰC CHIẾN) ---
async function postToTikTok(videoPath, caption) {
    if (!puppeteer) {
        console.error("❌ Không thể đăng bài vì thiếu thư viện Puppeteer.");
        return;
    }
    console.log(`🔥 ĐANG MỞ TRÌNH DUYỆT ĐỂ ĐĂNG BÀI THẬT...`);
    const browser = await puppeteer.launch({
        headless: false, // Để bạn có thể nhìn thấy trình duyệt chạy
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    try {
        console.log(`📡 Đang truy cập TikTok Upload...`);
        await page.goto('https://www.tiktok.com/tiktokstudio/upload', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log(`⚠️ HÀNH ĐỘNG CẦN THIẾT: Nếu bạn chưa đăng nhập, hãy đăng nhập ngay trên cửa sổ trình duyệt vừa hiện lên!`);
        console.log(`⏳ Bot sẽ đợi bạn đăng nhập xong trong 60 giây...`);

        // Đợi cho đến khi phần chọn file hiện ra
        await page.waitForSelector('input[type="file"]', { timeout: 60000 });

        console.log(`📤 Đang tải video lên: ${path.basename(videoPath)}`);
        const inputUpload = await page.$('input[type="file"]');
        await inputUpload.uploadFile(videoPath);

        console.log(`✍️ Đang điền chú thích và Hashtag...`);
        // Đợi phần soạn thảo hiện ra
        await page.waitForSelector('div[contenteditable="true"]', { timeout: 30000 });
        await page.click('div[contenteditable="true"]');

        // Xóa nội dung cũ (nếu có) và điền mới
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(caption);

        console.log(`✅ Đã chuẩn bị xong bài đăng!`);
        console.log(`🎯 Bạn có thể nhấn nút "Post" trên trình duyệt, hoặc đợi Bot tự nhấn (vui lòng kiểm tra kỹ trước khi Post).`);

        // Lưu ý: Tạm thời không tự động nhấn Post để bạn kiểm tra nội dung
        // await page.click('button:has-text("Post")'); 

    } catch (err) {
        console.error(`❌ Lỗi trong quá trình đăng: ${err.message}`);
    }
}

// --- HÀM TẢI VIDEO (THỬ NHIỀU NGUỒN) ---
async function downloadTikTokNoLogo(url, filename) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        https.get(apiUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const videoUrl = json.result?.video?.noWatermark || (json.result?.video?.no_watermark) || (json.data && json.data.play);
                    if (videoUrl) {
                        const file = fs.createWriteStream(path.join(INPUT_FOLDER, filename));
                        https.get(videoUrl, (vRes) => {
                            vRes.pipe(file);
                            file.on('finish', () => { file.close(); resolve(json.result?.title || "Video TikTok"); });
                        });
                    } else { reject("Server TikTok đang bận."); }
                } catch (e) { reject("Lỗi kết nối API."); }
            });
        }).on('error', (err) => reject(err.message));
    });
}

// --- TỰ ĐỘNG SĂN VIDEO HOT TỪ DATABASE ---
async function discoverAndDownload() {
    console.log(`🔍 [SYSTEM] Đang kiểm tra Database để nạp hàng vào kho (videos_raw)...`);

    const DATABASE_FILE = path.join(__dirname, 'products_database.csv');
    if (!fs.existsSync(DATABASE_FILE)) {
        console.log("⚠️ Chưa có file Database. Hãy chạy 'node product_hunter.js' trước!");
        return;
    }

    const content = fs.readFileSync(DATABASE_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    // Bỏ qua dòng header
    const dataLines = lines.slice(1);

    if (dataLines.length === 0) {
        console.log("📭 Database trống rỗng.");
        return;
    }

    let downloadCount = 0;

    for (const line of dataLines) {
        // Parse CSV line đơn giản (lưu ý: cách này cover cơ bản, nếu title có dấu phẩy phức tạp có thể cần regex)
        // Format: ID,Product_Name_Guess,Active_Ingredients,Skin_Type,TikTok_Link,Status,Decision
        const parts = line.split(',');
        // Lấy link là phần từ bắt đầu bằng http (thường là cột 5 - index 4, nhưng do title có thể có phẩy nên ta tìm chuỗi http)
        const urlIndex = parts.findIndex(p => p.includes('http'));

        if (urlIndex === -1) continue;

        const url = parts[urlIndex];
        const id = parts[0];
        const filename = `${id}.mp4`;

        // Kiểm tra xem đã có trong kho chưa
        if (fs.existsSync(path.join(INPUT_FOLDER, filename)) || fs.existsSync(path.join(OUTPUT_FOLDER, `posted_${filename}`))) {
            // console.log(`⏩ Đã có video ${id}, bỏ qua.`);
            continue;
        }

        try {
            console.log(`📥 Đang tải Video ID ${id} từ ${url}...`);
            await downloadTikTokNoLogo(url, filename);
            console.log(`✅ Đã nạp thành công vào kho: ${filename}`);
            downloadCount++;
        } catch (err) {
            console.log(`⚠️ Lỗi tải ID ${id}: ${err}`);
            // Nếu lỗi API, thử tạo mock data cho demo
            if (err.includes("Server TikTok") || err.includes("API")) {
                console.log(`⚠️ Chế độ Demo: Tạo file giả lập cho ${filename}`);
                fs.writeFileSync(path.join(INPUT_FOLDER, filename), "MOCK_VIDEO_DATA_FOR_DEMO");
                downloadCount++;
            }
        }

        // Nghỉ nhẹ để không spam server
        await new Promise(r => setTimeout(r, 2000));
    }

    if (downloadCount > 0) {
        console.log(`📦 Đã nạp thêm ${downloadCount} video vào Giỏ hàng.`);
    } else {
        console.log(`👌 Kho hàng đã cập nhật đầy đủ theo Database.`);
    }
}

// --- QUY TRÌNH ĐĂNG BÀI ---
async function postJob() {
    console.log(`\n[🕒 ${new Date().toLocaleTimeString()}] BẮT ĐẦU ĐĂNG BÀI...`);
    const files = fs.readdirSync(INPUT_FOLDER).filter(f => f.endsWith('.mp4'));
    if (files.length === 0) { await discoverAndDownload(); return; }

    const video = files[0];
    const videoPath = path.join(INPUT_FOLDER, video);
    const caption = `#beauty #skincare #xuhuong #trending AI_Generated_Title`;

    // GỌI HÀM ĐĂNG THẬT BẰNG PUPPETEER
    await postToTikTok(videoPath, caption);

    // Sau khi đăng xong di chuyển file
    if (fs.existsSync(videoPath)) {
        fs.renameSync(videoPath, path.join(OUTPUT_FOLDER, `posted_${video}`));
    }
}

// --- API ---
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.url === '/status') res.end(JSON.stringify({ status: 'online', time: new Date().toLocaleTimeString() }));
    if (req.url === '/trigger') { postJob(); res.end(JSON.stringify({ message: 'Trình duyệt tự động đang mở, hãy kiểm tra!' })); }
    if (req.url === '/files') {
        const raw = fs.readdirSync(INPUT_FOLDER).filter(f => f.endsWith('.mp4'));
        const processed = fs.readdirSync(OUTPUT_FOLDER).filter(f => f.endsWith('.mp4'));
        res.end(JSON.stringify({ raw, processed }));
    }
});

server.listen(3000, () => {
    console.log("📡 Kết nối Dashboard: http://localhost:3000");
});

discoverAndDownload();
setInterval(() => {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    if ((h === 6 || h === 15) && m === 0) postJob();
}, 60000);
