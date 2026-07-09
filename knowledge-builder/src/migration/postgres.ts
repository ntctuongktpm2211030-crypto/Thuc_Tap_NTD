import { prisma } from '../db';
import { generateEmbedding } from '../embedding/embedding';
import { QaPair } from '../generate/qa-pairs';

export interface Section {
  index: number;
  title: string;
  content: string;
}

export function parseProfileIntoSections(body: string): Section[] {
  const sections: Section[] = [];
  const lines = body.split('\n');
  let currentSection: Section | null = null;
  let currentContentLines: string[] = [];

  // Khớp tiêu đề dạng "### 1. Tổng quan" hoặc "### 15. Các câu hỏi thường gặp (FAQ)"
  const headerRegex = /^###\s+(\d+)\.\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(headerRegex);
    if (match) {
      if (currentSection) {
        currentSection.content = currentContentLines.join('\n').trim();
        sections.push(currentSection);
      }
      const index = parseInt(match[1]);
      const title = match[2].trim();
      currentSection = { index, title, content: '' };
      currentContentLines = [];
    } else {
      if (currentSection) {
        currentContentLines.push(line);
      }
    }
  }

  if (currentSection) {
    currentSection.content = currentContentLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

export function getCategoryFromSectionTitle(sectionTitle: string, defaultCategory: string): string {
  const cleanTitle = sectionTitle.toLowerCase();
  
  if (
    cleanTitle.includes('mon an') || 
    cleanTitle.includes('dac san') || 
    cleanTitle.includes('am thuc') || 
    cleanTitle.includes('an uong') || 
    cleanTitle.includes('nha hang')
  ) {
    return 'food';
  }
  
  if (
    cleanTitle.includes('van hoa') ||
    cleanTitle.includes('lich su') ||
    cleanTitle.includes('le hoi') ||
    cleanTitle.includes('di tich') ||
    cleanTitle.includes('den') ||
    cleanTitle.includes('chua')
  ) {
    if (cleanTitle.includes('lich su')) return 'history';
    if (cleanTitle.includes('le hoi')) return 'festival';
    return 'culture';
  }
  
  return defaultCategory;
}

export function findBestMatchingSection(qaSection: string | undefined, sections: Section[]): Section {
  if (!qaSection || sections.length === 0) return sections[0];

  const cleanQaSection = qaSection.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

  // Tìm kiếm khớp chính xác hoặc chứa trong tiêu đề
  for (const sec of sections) {
    const cleanSecTitle = sec.title.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
    if (cleanSecTitle === cleanQaSection || cleanSecTitle.includes(cleanQaSection) || cleanQaSection.includes(cleanSecTitle)) {
      return sec;
    }
  }

  // Fallback sang so khớp số thứ tự
  const num = parseInt(cleanQaSection);
  if (!isNaN(num) && num >= 1 && num <= sections.length) {
    return sections[num - 1];
  }

  return sections[0];
}

export async function migrateItem(
  title: string,
  body: string,
  category: string,
  qaPairs: QaPair[],
  isFast = false
): Promise<any> {
  try {
    // 1. Phân tách hồ sơ tri thức 15 phần thành các phân đoạn (chunk)
    let sections = parseProfileIntoSections(body);
    
    // Fallback: nếu tài liệu không được định dạng 15 phần (chạy fast mode), coi toàn bộ là phần Tổng quan
    if (sections.length === 0) {
      sections = [{
        index: 1,
        title: 'Tổng quan',
        content: body
      }];
    }

    // 2. Dọn dẹp bản ghi chính cũ trùng title (nếu có)
    const existing = await prisma.knowledgeContent.findFirst({
      where: { title }
    });
    if (existing) {
      await prisma.knowledgeContent.delete({
        where: { id: existing.id }
      });
      console.log(`[Migration] Đã dọn dẹp bản ghi gốc cũ: "${title}"`);
    }

    // 3. Dọn dẹp tất cả các phân đoạn (chunks) cũ liên quan
    const existingChunks = await prisma.knowledgeContent.findMany({
      where: {
        title: { startsWith: `${title} - ` }
      }
    });
    if (existingChunks.length > 0) {
      for (const chunk of existingChunks) {
        await prisma.knowledgeContent.delete({
          where: { id: chunk.id }
        });
      }
      console.log(`[Migration] Đã dọn dẹp ${existingChunks.length} phân đoạn cũ của: "${title}"`);
    }

    const createdContents = [];

    // 4. Lần lượt lưu từng phân đoạn (chunk) vào cơ sở dữ liệu
    for (const sec of sections) {
      if (sec.content.trim().length < 5) {
        // Bỏ qua phân đoạn rỗng hoặc quá ngắn không có giá trị thông tin
        continue;
      }

      // Xác định category đặc trưng cho từng phân đoạn
      const sectionCategory = getCategoryFromSectionTitle(sec.title, category);
      const chunkTitle = `${title} - ${sec.title}`;

      // Tạo bản ghi KnowledgeContent cho phân đoạn hiện tại
      const content = await prisma.knowledgeContent.create({
        data: {
          title: chunkTitle,
          body: sec.content,
          category: sectionCategory,
        },
      });

      createdContents.push(content);

      // Tìm kiếm các Q&A tương ứng với phân đoạn này
      let sectionQaPairs = qaPairs.filter(
        pair => findBestMatchingSection(pair.section, sections).index === sec.index
      );

      // Nếu phân đoạn không có Q&A nào tương ứng được sinh từ AI, tự tạo câu hỏi mặc định để đảm bảo phân đoạn đó vẫn tìm thấy được
      if (sectionQaPairs.length === 0) {
        sectionQaPairs = [{
          question: `Thông tin về ${sec.title} của ${title}?`,
          similarQuestion: `Khám phá nét đặc trưng liên quan đến ${sec.title} của ${title}?`,
          answer: sec.content,
          intent: `ask_${sectionCategory}`,
          keywords: [title.toLowerCase(), sec.title.toLowerCase()],
          tags: [sectionCategory, title.toLowerCase()]
        }];
      }

      // 5. Đồng bộ câu hỏi, đáp án và sinh vector embedding
      for (const pair of sectionQaPairs) {
        await prisma.knowledgeAnswer.create({
          data: {
            contentId: content.id,
            answerText: pair.answer,
          },
        });

        const questionsToSave = [pair.question, pair.similarQuestion];
        
        for (const qText of questionsToSave) {
          if (!qText || qText.trim().length === 0) continue;

          const question = await prisma.knowledgeQuestion.create({
            data: {
              contentId: content.id,
              questionText: qText,
            },
          });

          // Sinh vector embedding cho câu hỏi mẫu
          const embedding = await generateEmbedding(qText, isFast);

          if (embedding.length === 1536) {
            await prisma.$executeRawUnsafe(
              `UPDATE "KnowledgeQuestion" SET "embeddingOpenAI" = $1::vector WHERE id = $2`,
              `[${embedding.join(',')}]`,
              question.id
            );
          } else if (embedding.length === 128) {
            await prisma.$executeRawUnsafe(
              `UPDATE "KnowledgeQuestion" SET "embeddingLocal" = $1::vector WHERE id = $2`,
              `[${embedding.join(',')}]`,
              question.id
            );
          }
        }
      }

      console.log(`[Migration] Đã đồng bộ phân đoạn: "${chunkTitle}" (${sectionQaPairs.length * 2} câu hỏi)`);
    }

    console.log(`[Migration] Hoàn thành đồng bộ cụm tri thức "${title}" thành ${createdContents.length} phân đoạn.`);
    return createdContents[0] || null;
  } catch (err) {
    console.error(`[Migration] Lỗi khi đồng bộ địa danh "${title}":`, err);
    throw err;
  }
}
