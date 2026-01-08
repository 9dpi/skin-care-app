const https = require('https');
const fs = require('fs');
const path = require('path');

// --- CẤU HÌNH ---
const DATABASE_FILE = path.join(__dirname, 'products_database.csv');
const LOG_FILE = path.join(__dirname, 'hunter_log.txt');

// --- BỘ TỪ KHÓA ĐỂ PHÂN LOẠI (AI LOGIC CƠ BẢN) ---
const KEYWORDS = {
    SKIN_TYPE: {
        'da dầu': 'Oily',
        'kiềm dầu': 'Oily',
        'da khô': 'Dry',
        'cấp ẩm': 'Dry',
        'da mụn': 'Acne',
        'giảm mụn': 'Acne',
        'nhạy cảm': 'Sensitive',
        'phục hồi': 'Sensitive'
    },
    INGREDIENTS: {
        'b5': 'Vitamin B5',
        'vitamin c': 'Vitamin C',
        'retinol': 'Retinol',
        'aha': 'AHA',
        'bha': 'BHA',
        'niacinamide': 'Niacinamide',
        'kem chống nắng': 'Sunscreen',
        'sữa rửa mặt': 'Cleanser'
    }
};

// --- DANH SÁCH VIDEO NGUỒN (MOCKUP ĐỂ TEST) ---
const SOURCE_VIDEOS = [
    'https://www.tiktok.com/@vtm_da_lieu_shun/video/7313840781700681006',
    'https://www.tiktok.com/@halinh_official/video/7279745131019259141',
];

// --- HÀM GHI LOG ---
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const msg = `[${timestamp}] ${message}`;
    console.log(msg);
    if (!fs.existsSync(path.dirname(LOG_FILE))) fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

// --- KHỞI TẠO DATABASE NẾU CHƯA CÓ ---
if (!fs.existsSync(DATABASE_FILE)) {
    const header = "ID,Product_Name_Guess,Active_Ingredients,Skin_Type,TikTok_Link,Status,Decision\n";
    fs.writeFileSync(DATABASE_FILE, header);
    log("📝 Đã tạo file Database mới: products_database.csv");
}

// --- HÀM PHÂN TÍCH METADATA ---
function analyzeContent(text) {
    let detectedSkin = [];
    let detectedIngredients = [];

    const lowerText = text.toLowerCase();

    // Quét loại da
    for (const [key, value] of Object.entries(KEYWORDS.SKIN_TYPE)) {
        if (lowerText.includes(key)) detectedSkin.push(value);
    }

    // Quét hoạt chất
    for (const [key, value] of Object.entries(KEYWORDS.INGREDIENTS)) {
        if (lowerText.includes(key)) detectedIngredients.push(value);
    }

    return {
        skin: [...new Set(detectedSkin)].join('; ') || "Unknown",
        ingredients: [...new Set(detectedIngredients)].join('; ') || "Unknown"
    };
}

// --- HÀM LẤY INFO TỪ TIKTOK API ---
function fetchTikTokInfo(url) {
    return new Promise((resolve) => {
        const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        };

        const req = https.get(apiUrl, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.id) {
                        resolve(json);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.setTimeout(5000, () => { // Timeout 5s
            req.destroy();
            resolve(null);
        });
    });
}

// --- HÀM GIẢ LẬP DỮ LIỆU (FALLBACK) ---
function getMockData(url) {
    const id = Math.floor(Math.random() * 1000000000);
    let title = "Video TikTok Không Tiêu Đề";

    if (url.includes('vtm_da_lieu_shun')) title = "Review Toner Pad cho da dầu mụn, chứa BHA giảm mụn cực đỉnh";
    if (url.includes('halinh_official')) title = "Đánh giá kem dưỡng B5 phục hồi da nhạy cảm giá bình dân";

    return {
        id: id,
        title: title
    };
}

// --- HÀM TẠO LỜI KHUYÊN AI (AI ADVICE GENERATOR) ---
function generateAdvice(skinType, ingredient) {
    const templates = {
        'Oily': [
            `Sản phẩm chứa ${ingredient} cực hợp để kiềm dầu thừa.`,
            `Da dầu nên dùng cái này để tránh bít tắc lỗ chân lông.`
        ],
        'Dry': [
            `Cấp ẩm sâu với ${ingredient}, cứu tinh cho da khô nẻ.`,
            `Khóa ẩm tức thì, giúp da căng mọng nhờ ${ingredient}.`
        ],
        'Acne': [
            `${ingredient} giúp gom cồi mụn nhanh, giảm sưng viêm.`,
            `Giải pháp diệt khuẩn mụn hiệu quả với nồng độ ${ingredient} chuẩn.`
        ],
        'Sensitive': [
            `Phục hồi hàng rào bảo vệ da, rất êm dịu vì có ${ingredient}.`,
            `Lành tính cho da nhạy cảm, giảm đỏ rát nhờ ${ingredient}.`
        ]
    };

    // Tìm template phù hợp, nếu không có thì lấy mặc định
    const type = skinType.split(';')[0].trim(); // Lấy loại da đầu tiên tìm thấy
    const possibleAdvice = templates[type] || [`Sản phẩm đa năng chứa ${ingredient}, dùng được cho mọi loại da.`];

    // Random 1 câu
    return possibleAdvice[Math.floor(Math.random() * possibleAdvice.length)];
}

// --- MAIN FUNCTION ---
async function startHunting() {
    log("🚀 BẮT ĐẦU CHIẾN DỊCH SĂN SẢN PHẨM...");

    let newCount = 0;

    // Cập nhật Header nếu tạo file mới
    if (!fs.existsSync(DATABASE_FILE)) {
        const header = "ID,Product_Name_Guess,Active_Ingredients,Skin_Type,AI_Advice,TikTok_Link,Status,Decision\n";
        fs.writeFileSync(DATABASE_FILE, header);
        log("📝 Đã tạo file Database mới: products_database.csv");
    }

    for (const url of SOURCE_VIDEOS) {
        log(`🔍 Đang soi: ${url}`);

        let info = await fetchTikTokInfo(url);

        // CƠ CHẾ DỰ PHÒNG
        if (!info) {
            log(`⚠️ API đang bận/lỗi, dùng chế độ Phân tích Giả lập để tạo mẫu...`);
            info = getMockData(url);
        }

        if (info) {
            const title = (info.title || "").replace(/,/g, ' ');
            const analysis = analyzeContent(title);

            // TẠO LỜI KHUYÊN
            const advice = generateAdvice(analysis.skin, analysis.ingredients);

            // Ghi thêm cột Advice vào CSV
            const csvLine = `${info.id},"${title}",${analysis.ingredients},${analysis.skin},"${advice}",${url},New,PENDING\n`;

            let currentDB = "";
            if (fs.existsSync(DATABASE_FILE)) currentDB = fs.readFileSync(DATABASE_FILE, 'utf-8');

            if (!currentDB.includes(info.id.toString())) {
                fs.appendFileSync(DATABASE_FILE, csvLine);
                log(`✅ Đã thêm: ${title.substring(0, 30)}... [Da: ${analysis.skin}, Tư vấn: ${advice}]`);
                newCount++;
            } else {
                log(`⚠️ Đã tồn tại.`);
            }
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    log(`🏁 KẾT THÚC. Đã thêm ${newCount} sản phẩm.`);
    log(`👉 Hãy mở file 'products_database.csv' để kiểm tra!`);
}

startHunting();
