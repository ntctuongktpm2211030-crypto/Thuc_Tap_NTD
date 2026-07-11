import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createOpenAIClient } from './generate/client';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env'), override: true });

const SUGGESTED_TOPICS = [
  // Địa danh
  "Mũi Cà Mau",
  "Vườn quốc gia Mũi Cà Mau",
  "Vườn quốc gia U Minh Hạ",
  "Khu du lịch sinh thái Hòn Đá Bạc",
  "Đảo Hòn Khoai",
  "Sân chim Ngọc Hiển",
  "Sân chim Cà Mau",
  "Khu du lịch sinh thái cộng đồng Đất Mũi",
  "Khu sinh thái rừng ngập mặn sinh thái 184",
  "Lâm viên Cà Mau",
  "Chợ nổi Cà Mau",
  "Đầm Thị Tường",
  "Khu du lịch sinh thái Hương Tràm",
  "Tuyến đường xuyên rừng Đất Mũi",
  "Cột cờ Hà Nội tại Mũi Cà Mau",
  "Bãi bồi Mũi Cà Mau",
  "Khu du lịch sinh thái Mười Ngọt",
  "Cầu Năm Căn",
  "Khu du lịch sinh thái Thư Duy",
  "Cánh đồng điện gió ven biển Cà Mau",
  "Hòn Ông Ngộ",
  "Chùa Monivangsa Bopharam",
  "Chùa Quan Âm Cổ Tự thành phố Cà Mau",
  "Chùa Cao Dân Thới Bình",
  "Chùa Bà Thiên Hậu Cà Mau",
  "Di tích Căn cứ Tỉnh ủy tại Xẻo Đước",
  "Di tích lịch sử Hồng Anh Thư Quán",
  "Khu tưởng niệm Chủ tịch Hồ Chí Minh tại Cà Mau",
  "Di tích lịch sử Đình Tân Hưng",
  "Cửa biển Sông Đốc",
  "Cửa biển Gành Hào",
  "Cửa biển Khánh Hội U Minh",
  "Làng chài Rạch Gốc",
  "Khu du lịch sinh thái Hoa Rừng U Minh",
  
  // Ẩm thực
  "Cua Năm Căn Cà Mau",
  "Lẩu mắm U Minh",
  "Cá thòi lòi nướng muối ớt",
  "Tôm khô Rạch Gốc",
  "Gỏi nhộng ong U Minh",
  "Bồn bồn muối chua",
  "Bánh tằm cay Cà Mau",
  "Cá lóc nướng trui đất mũi",
  "Vọp nướng mỡ hành",
  "Ba khía rạch gốc muối",
  "Mật ong rừng U Minh Hạ",
  "Chả trứng mực Đất Mũi",
  "Cháo cá kèo rau đắng",
  "Đuông chà là nướng",
  "Mắm ba khía trộn gỏi đu đủ",
  "Bánh phồng tôm Năm Căn",
  "Cá kho tộ đất mũi",
  "Hàu đá nướng trui Hòn Đá Bạc",
  "Rượu trái giác Cà Mau",
  "Khô cá sặc bổi U Minh",
  "Khô cá kèo Cà Mau đặc sản",
  "Khô cá khoai Cái Đôi Vàm",
  "Bồn bồn Cái Nước Cà Mau",
  "Mắm ba khía Rạch Gốc muối chua",
  "Cá lóc đồng nướng trui U Minh",
  "Tôm đất luộc nước dừa Năm Căn",
  "Món cá lóc kho tộ nước cốt dừa",
  "Cháo mực đêm cửa biển Sông Đốc",
  "Bánh phồng tôm Năm Căn đạt chuẩn OCOP",
  "Canh chua cá chẽm nấu với bông bần",
  "Cá nâu nấu trái giác Cà Mau",
  "Gỏi bồn bồn tai heo",
  "Canh chua cá ngát nấu bắp chuối",
  "Cá rô đồng kho trái bần",
  "Chả cá thòi lòi chiên cốm Năm Căn",
  "Mắm tép trộn đu đủ Cà Mau",
  
  // Văn hóa & Lối sống
  "Đờn ca tài tử Nam Bộ tại Cà Mau",
  "Văn hóa sông nước Cà Mau",
  "Nghề gác kèo ong U Minh",
  "Nghề muối ba khía Cà Mau",
  "Áo bà ba và chiếc khăn rằn",
  "Nghệ thuật sân khấu cải lương Cà Mau",
  "Văn hóa ẩm thực khẩn hoang Cà Mau",
  "Nghề làm tôm khô truyền thống Rạch Gốc",
  "Lối kiến trúc nhà sàn vùng ngập mặn",
  "Giao thoa văn hóa Kinh - Khmer - Hoa",
  "Hò chèo ghe Cà Mau",
  "Tục thờ cá Ông của ngư dân vùng biển",
  "Nghề dệt chiếu Tân Thành",
  "Nghề đan đát lá dừa nước",
  "Truyện bác Ba Phi",
  "Nghề làm mắm cá đồng U Minh",
  "Văn hóa giao thông đường thủy Cà Mau",
  "Phong tục ăn Tết Chôl Chnăm Thmây của người Khmer",
  "Tín ngưỡng thờ Mẫu Thiên Hậu của người Hoa",
  "Nghề làm đũa đước Năm Căn",
  "Văn hóa ăn ong lấy mật U Minh",
  "Lối sống mở và phóng khoáng của con người Cà Mau",
  "Tục cúng vuông đầu mùa của người nuôi tôm Cà Mau",
  "Nghề làm tôm khô chà chổi Năm Căn",
  "Văn hóa mặc trang phục truyền thống Xăm-pốt của người Khmer Cà Mau",
  "Tri thức dân gian xem con nước đi biển của ngư dân",
  "Nghề gác chông bẫy thú của thợ rừng U Minh xưa",
  "Tục thờ cúng ông Tà của người Khmer Cà Mau",
  "Nghề chằm nón lá dừa nước Cà Mau",
  "Văn hóa kể chuyện tiếu lâm bên bàn trà của người Cà Mau",
  "Nghề làm đũa đước Năm Căn Cà Mau",
  
  // Lịch sử & Địa lý cách mạng
  "Chiến dịch CM12 tại Hòn Đá Bạc",
  "Khởi nghĩa Hòn Khoai (1940)",
  "Anh hùng Phan Ngọc Hiển",
  "Bến Vàm Lũng - Đường Hồ Chí Minh trên biển",
  "Huyện Ngọc Hiển lịch sử",
  "Lịch sử khẩn hoang vùng đất U Minh",
  "Đầm Dơi và di tích lịch sử trận Đầm Dơi",
  "Di tích Biệt khu Hải Yến Bình Hưng",
  
  // Lễ hội
  "Lễ hội Nghinh Ông Sông Đốc",
  "Lễ hội Vía Bà Chúa Xứ Hòn Đá Bạc",
  "Lễ hội Kỳ yên Đình Tân Hưng",
  "Lễ hội Sen Đôlta của người Khmer Cà Mau",
  "Lễ cúng Trăng Ok Om Bok",
  "Ngày hội Cua Cà Mau",
  "Lễ hội Vía Bà Thiên Hậu Thánh Mẫu",
  "Ngày hội Bánh dân gian Nam Bộ tại Cà Mau",
  "Lễ hội Giỗ tổ Hùng Vương tại Cà Mau",
  "Giải Marathon Đất Mũi Cà Mau",
  "Ngày hội văn hóa thể thao các dân tộc thiểu số",
  "Lễ hội thả diều nghệ thuật Đất Mũi",
  "Lễ hội trái cây cua và sản vật U Minh",
  "Lễ hội đua xuồng ba lá trên sông rạch",
  "Lễ hội ẩm thực sông nước Năm Căn",
  "Lễ hội hoa đăng trên sông Gành Hào",
  "Hội chợ thương mại và triển lãm sản phẩm OCOP Cà Mau"
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_key_here') {
    console.error('❌ Lỗi: Chưa cấu hình OPENAI_API_KEY trong file .env.');
    process.exit(1);
  }

  const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';
  const openai = createOpenAIClient(apiKey);

  const filePath = path.resolve(process.cwd(), 'import-data-camau.json');
  console.log(`🚀 Khởi động tiến trình tự động sinh 100 dữ liệu Cà Mau...`);
  console.log(`- File đích: ${filePath}`);
  console.log(`- Model sử dụng: ${modelName}`);

  // Đọc dữ liệu hiện tại
  let existingItems: any[] = [];
  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingItems = JSON.parse(fileContent);
      if (!Array.isArray(existingItems)) {
        existingItems = [];
      }
    } catch (e) {
      console.warn('⚠️ Không thể đọc file hiện tại hoặc file rỗng, sẽ tạo mới.');
      existingItems = [];
    }
  }

  const existingTitles = new Set(existingItems.map(item => item.title.toLowerCase().trim()));
  console.log(`📊 Hiện tại đã có ${existingItems.length} mục trong file.`);

  const args = parseArgs();
  const totalTarget = args.total ? parseInt(args.total) : 100;
  const currentCount = existingItems.length;

  if (currentCount >= totalTarget) {
    console.log(`✅ File hiện tại đã có ${currentCount} mục, đạt hoặc vượt mục tiêu ${totalTarget} mục. Không cần sinh thêm!`);
    return;
  }

  const targetNewCount = totalTarget - currentCount;
  let addedCount = 0;
  const batchSize = 5;

  console.log(`🎯 Mục tiêu tổng: ${totalTarget} mục. Cần sinh thêm: ${targetNewCount} mục.`);

  while (addedCount < targetNewCount) {
    const remaining = targetNewCount - addedCount;
    const countToGenerate = Math.min(batchSize, remaining);
    
    console.log(`\n--------------------------------------------------`);
    console.log(`⏳ [Tiến trình: ${currentCount + addedCount}/${totalTarget}] Đang sinh ${countToGenerate} mục tiếp theo...`);

    const remainingSuggested = SUGGESTED_TOPICS.filter(
      topic => !existingTitles.has(topic.toLowerCase().trim())
    );

    const selectedTopics = remainingSuggested.slice(0, countToGenerate);
    let prompt = '';

    if (selectedTopics.length > 0) {
      console.log(`📌 Các chủ đề được lựa chọn để sinh (Không trùng lặp): ${selectedTopics.join(', ')}`);
      prompt = `Bạn là một chuyên gia địa phương, nhà nghiên cứu văn hóa, lịch sử và du lịch Cà Mau chuyên nghiệp.
Hãy tạo ra đúng ${countToGenerate} mục dữ liệu tri thức mới, đặc sắc về vùng đất Cà Mau dựa trên các chủ đề được chỉ định cụ thể dưới đây:

Chủ đề chỉ định: [${selectedTopics.join(', ')}]
(Lưu ý quan trọng: Bạn bắt buộc phải viết bài về đúng các chủ đề này. Hãy tự phân loại category phù hợp nhất cho mỗi chủ đề từ 5 thể loại bên dưới).

Các thể loại hợp lệ (trường 'category'):
1. "destination" (Địa điểm du lịch, tham quan, check-in)
2. "food" (Món ăn ngon, đặc sản địa phương)
3. "culture" (Văn hóa vùng miền, phong tục tập quán, lối sống)
4. "history" (Lịch sử địa danh, trận đánh, di tích cách mạng)
5. "festival" (Lễ hội truyền thống - thể loại này bắt buộc PHẢI có thêm trường 'date')

YÊU CẦU CỰC KỲ QUAN TRỌNG:
1. Độ dài và chi tiết: Mỗi mục cần phải viết cực kỳ chi tiết, dài và sâu sắc. Trường 'content' phải dài từ 800 đến 1500 ký tự, mô tả sinh động, giàu cảm xúc truyền cảm hứng, giới thiệu rõ nguồn gốc, giá trị hoặc trải nghiệm.
2. Tuyệt đối KHÔNG sử dụng dấu nháy kép (") bên trong nội dung văn bản của trường 'title' hoặc 'content'. Nếu muốn nhấn mạnh hoặc viết tên riêng trích dẫn, bắt buộc phải dùng dấu nháy đơn (') để thay thế.
3. Chỉ trả về duy nhất chuỗi JSON là một đối tượng chứa thuộc tính "items" là mảng gồm ${countToGenerate} đối tượng theo định dạng sau:
{
  "items": [
    {
      "title": "Tên chủ đề từ danh sách chỉ định",
      "content": "Nội dung chi tiết dài sâu sắc mô tả về chủ đề...",
      "category": "destination|food|culture|history|festival",
      "date": "Thông tin thời gian tổ chức (chỉ có ở festival)"
    }
  ]
}`;
    } else {
      console.log(`📌 Hết danh sách chủ đề gợi ý. Sinh tự do không trùng các tiêu đề cũ...`);
      const titlesList = Array.from(existingTitles).slice(-100);
      const titlesString = titlesList.join(', ');
      prompt = `Bạn là một chuyên gia địa phương, nhà nghiên cứu văn hóa, lịch sử và du lịch Cà Mau chuyên nghiệp.
Hãy tạo ra đúng ${countToGenerate} mục dữ liệu tri thức mới, đặc sắc về vùng đất Cà Mau (bao gồm: địa danh, ẩm thực đặc sản, văn hóa, lịch sử, hoặc lễ hội truyền thống).

Các thể loại hợp lệ (trường 'category'):
1. "destination" (Địa điểm du lịch, tham quan, check-in)
2. "food" (Món ăn ngon, đặc sản địa phương)
3. "culture" (Văn hóa vùng miền, phong tục tập quán, lối sống)
4. "history" (Lịch sử địa danh, trận đánh, di tích cách mạng)
5. "festival" (Lễ hội truyền thống - thể loại này bắt buộc PHẢI có thêm trường 'date')

YÊU CẦU CỰC KỲ QUAN TRỌNG:
1. Độ dài và chi tiết: Mỗi mục cần phải viết cực kỳ chi tiết, dài và sâu sắc. Trường 'content' phải dài từ 800 đến 1500 ký tự, mô tả sinh động, giàu cảm xúc truyền cảm hứng, giới thiệu rõ nguồn gốc, giá trị hoặc trải nghiệm.
2. Không trùng lặp: Tuyệt đối KHÔNG trùng tên (trường 'title') với các chủ đề sau: [${titlesString}]. Hãy nghĩ ra những chủ đề mới lạ khác của Cà Mau.
3. Tuyệt đối KHÔNG sử dụng dấu nháy kép (") bên trong nội dung văn bản của trường 'title' hoặc 'content'. Nếu muốn nhấn mạnh hoặc viết tên riêng trích dẫn, bắt buộc phải dùng dấu nháy đơn (') để thay thế.
4. Chỉ trả về duy nhất chuỗi JSON là một đối tượng chứa thuộc tính "items" là mảng gồm ${countToGenerate} đối tượng theo định dạng sau:
{
  "items": [
    {
      "title": "Tên chủ đề độc đáo về Cà Mau",
      "content": "Nội dung chi tiết dài sâu sắc mô tả về chủ đề...",
      "category": "destination|food|culture|history|festival",
      "date": "Thông tin thời gian tổ chức (chỉ có ở festival)"
    }
  ]
}`;
    }

    try {
      const response = await callOpenAIWithRetry(openai, {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const resText = response.choices[0].message.content?.trim() || '{}';
      const cleanJson = cleanJsonString(resText);
      const parsed = JSON.parse(cleanJson);
      
      let newItems: any[] = [];
      if (parsed && Array.isArray(parsed.items)) {
        newItems = parsed.items;
      } else {
        const firstBracket = cleanJson.indexOf('[');
        const lastBracket = cleanJson.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          const jsonBlock = cleanJson.substring(firstBracket, lastBracket + 1);
          newItems = JSON.parse(jsonBlock);
        }
      }

      if (Array.isArray(newItems) && newItems.length > 0) {
        let validBatchCount = 0;
        for (const item of newItems) {
          const titleLower = item.title.toLowerCase().trim();
          if (!existingTitles.has(titleLower)) {
            existingItems.push(item);
            existingTitles.add(titleLower);
            validBatchCount++;
            addedCount++;
            console.log(`   + Đã tạo: "${item.title}" [${item.category}] (Độ dài: ${item.content.length} ký tự)`);
          } else {
            console.warn(`   ⚠️ Bỏ qua trùng lặp: "${item.title}"`);
          }
        }

        if (validBatchCount > 0) {
          fs.writeFileSync(filePath, JSON.stringify(existingItems, null, 2), 'utf8');
          console.log(`💾 Đã ghi nhận lưu thành công. Tổng cộng file hiện tại: ${existingItems.length} mục.`);
        }
      } else {
        throw new Error('Đầu ra không phải là mảng JSON hợp lệ.');
      }
    } catch (err: any) {
      console.error(`❌ Lỗi đợt sinh này thất bại:`, err.message || err);
      console.log('⏳ Nghỉ 5 giây trước khi thử lại...');
      await delay(5000);
      continue;
    }

    // Nghỉ 3 giây giữa các lượt gọi để tránh rate limit
    if (addedCount < targetNewCount) {
      console.log(`⏳ Nghỉ 3 giây để tránh giới hạn API...`);
      await delay(3000);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 HOÀN THÀNH: Đã tự động sinh thành công thêm ${addedCount} dữ liệu tri thức về Cà Mau!`);
  console.log(`📂 Kết quả được lưu tại: ${filePath}`);
}

main().catch(err => {
  console.error('Fatal error in generate script:', err);
});

function cleanJsonString(str: string): string {
  let result = '';
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (char === '"' && !escape) {
      inString = !inString;
      result += char;
    } else if (char === '\\' && inString) {
      escape = !escape;
      result += char;
    } else {
      escape = false;
      if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char.charCodeAt(0) < 32) {
          // Bỏ qua các ký tự điều khiển không hợp lệ khác
        } else {
          result += char;
        }
      } else {
        result += char;
      }
    }
  }
  return result;
}

async function callOpenAIWithRetry(openai: any, params: any, maxRetries = 5): Promise<any> {
  let delayMs = 2000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (err: any) {
      const isRateLimit = err.status === 429 || 
                          (err.message && err.message.includes('429')) || 
                          (err.code && err.code === 'rate_limit_exceeded');
                          
      if (isRateLimit && attempt < maxRetries) {
        let retryAfter = 5000;
        if (err.headers && err.headers['retry-after']) {
          retryAfter = (parseInt(err.headers['retry-after']) + 1) * 1000;
        } else {
          retryAfter = delayMs * attempt;
        }
        console.warn(`⚠️ Gặp Rate Limit (429). Đang chờ ${retryAfter / 1000} giây trước khi thử lại (Lần thử ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
      } else {
        throw err;
      }
    }
  }
}

function parseArgs() {
  const args: any = {};
  process.argv.slice(2).forEach(val => {
    if (val.startsWith('--')) {
      const [key, value] = val.split('=');
      const cleanKey = key.replace('--', '');
      args[cleanKey] = value ? value.replace(/['"]/g, '') : true;
    }
  });
  return args;
}
