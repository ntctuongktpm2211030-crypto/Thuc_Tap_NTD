import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import prisma, { withDbRetry } from '../config/db';

const seasonsData = [
  {
    "id": 1,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Hà Giang",
    "ideal_months": [10, 11],
    "ideal_period_text": "Tháng 10 – 11",
    "highlights": "Lễ hội hoa Tam giác mạch, ngắm đèo Mã Pí Lèng, Đồng văn",
    "primary_season": "Thu - Đông",
    "reference_source": "Quyết định tổ chức Lễ hội hoa UBND tỉnh Hà Giang",
    "official_website": "dulich.hagiang.gov.vn"
  },
  {
    "id": 2,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Lào Cai",
    "ideal_months": [9, 12, 1, 2],
    "ideal_period_text": "Tháng 9 (Lúa chín) & T12 – T2 (Săn mây/băng)",
    "highlights": "Ruộng bậc thang Y Tý, Fansipan, Lễ hội mùa đông Sa Pa",
    "primary_season": "Thu & Đông",
    "reference_source": "Cổng TTĐT Du lịch Lào Cai (sapa.laocai.gov.vn)",
    "official_website": "sapa.laocai.gov.vn"
  },
  {
    "id": 3,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Yên Bái",
    "ideal_months": [9, 10],
    "ideal_period_text": "Tháng 9 – 10",
    "highlights": "Danh thắng Quốc gia Mù Cang Chải mùa lúa chín",
    "primary_season": "Thu",
    "reference_source": "Bằng xếp hạng Di tích Quốc gia - Bộ VHTTDL",
    "official_website": "yenbai.gov.vn"
  },
  {
    "id": 4,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Sơn La",
    "ideal_months": [1, 2, 10, 11],
    "ideal_period_text": "Tháng 1 – 2 (Hoa đào/mận) & T10 – T11 (Cải trắng)",
    "highlights": "Mộc Châu mùa hoa nở, Lễ hội Hết Chá",
    "primary_season": "Xuân & Thu - Đông",
    "reference_source": "Cổng TTĐT Du lịch Mộc Châu (mocchau.sonla.gov.vn)",
    "official_website": "mocchau.sonla.gov.vn"
  },
  {
    "id": 5,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Điện Biên",
    "ideal_months": [3, 5],
    "ideal_period_text": "Tháng 3 (Hoa ban) & Tháng 5 (Lễ kỷ niệm)",
    "highlights": "Lễ hội Hoa Ban, Di tích Lịch sử Chiến thắng Điện Biên Phủ",
    "primary_season": "Xuân - Hè",
    "reference_source": "Đề án Lễ hội Hoa Ban hằng năm - UBND tỉnh Điện Biên",
    "official_website": "dienbientourism.vn"
  },
  {
    "id": 6,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Lai Châu",
    "ideal_months": [9, 10, 11],
    "ideal_period_text": "Tháng 9 – 11",
    "highlights": "Săn mây đỉnh Sin Suối Hồ, đèo O Quý Hồ, mùa lúa",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT Du lịch tỉnh Lai Châu (dulich.laichau.gov.vn)",
    "official_website": "dulich.laichau.gov.vn"
  },
  {
    "id": 7,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Hòa Bình",
    "ideal_months": [11, 12, 1, 2, 3, 4],
    "ideal_period_text": "Tháng 11 – 4",
    "highlights": "Du thuyền lòng hồ Thủy điện Hòa Bình, khoáng nóng Kim Bôi",
    "primary_season": "Đông - Xuân",
    "reference_source": "Sở VHTTDL tỉnh Hòa Bình",
    "official_website": "hoabinh.gov.vn"
  },
  {
    "id": 8,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Cao Bằng",
    "ideal_months": [9, 10],
    "ideal_period_text": "Tháng 9 – 10",
    "highlights": "Thác Bản Giốc mùa nước trong/xanh, mùa lúa chín",
    "primary_season": "Thu",
    "reference_source": "Cục Du lịch Quốc gia Việt Nam (vietnamtourism.gov.vn)",
    "official_website": "caobangtourism.vn"
  },
  {
    "id": 9,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Bắc Kạn",
    "ideal_months": [8, 9, 10],
    "ideal_period_text": "Tháng 8 – 10",
    "highlights": "Hồ Ba Bể mùa nước êm, Lễ hội Cầu An",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT Du lịch tỉnh Bắc Kạn",
    "official_website": "backan.gov.vn"
  },
  {
    "id": 10,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Lạng Sơn",
    "ideal_months": [1, 2, 8, 9],
    "ideal_period_text": "Tháng 1 – 2 (Lễ hội Xuân) & T8 – T9 (Mẫu Sơn)",
    "highlights": "Lễ hội Chùa Tam Thanh, Lễ hội Lồng Tồng, mùa hồng chín",
    "primary_season": "Xuân & Thu",
    "reference_source": "Sở VHTTDL tỉnh Lạng Sơn",
    "official_website": "langson.gov.vn"
  },
  {
    "id": 11,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Tuyên Quang",
    "ideal_months": [9],
    "ideal_period_text": "Tháng 8 âm lịch (Tháng 9 dương)",
    "highlights": "Lễ hội Thành Tuyên (Đêm hội Trung thu lớn nhất Việt Nam)",
    "primary_season": "Thu",
    "reference_source": "Đề án Lễ hội Thành Tuyên - UBND tỉnh Tuyên Quang",
    "official_website": "tuyenquang.gov.vn"
  },
  {
    "id": 12,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Thái Nguyên",
    "ideal_months": [9, 10, 11],
    "ideal_period_text": "Tháng 9 – 11",
    "highlights": "Đồi trà Tân Cương, Hồ Núi Cốc mùa thu",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT Du lịch Thái Nguyên",
    "official_website": "thainguyen.gov.vn"
  },
  {
    "id": 13,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Phú Thọ",
    "ideal_months": [4],
    "ideal_period_text": "Tháng 3 âm lịch (Tháng 4 dương)",
    "highlights": "Giỗ Tổ Hùng Vương - Lễ hội Đền Hùng",
    "primary_season": "Xuân",
    "reference_source": "Nghị định 145/2013/NĐ-CP về các ngày lễ lớn Quốc gia",
    "official_website": "phutho.gov.vn"
  },
  {
    "id": 14,
    "region_code": "TDMNPB",
    "region_name": "Trung du & Miền núi phía Bắc",
    "province_name": "Bắc Giang",
    "ideal_months": [6, 10, 11],
    "ideal_period_text": "Tháng 6 (Vải thiều) & Tháng 10 – 11 (Tây Yên Tử)",
    "highlights": "Thu hoạch Vải thiều Lục Ngạn, du lịch tâm linh Tây Yên Tử",
    "primary_season": "Hè & Thu",
    "reference_source": "Chỉ dẫn địa lý Vải thiều Lục Ngạn - Cục Sở hữu trí tuệ",
    "official_website": "bacgiang.gov.vn"
  },
  {
    "id": 15,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Hà Nội",
    "ideal_months": [9, 10, 11],
    "ideal_period_text": "Tháng 9 – 11",
    "highlights": "Thu Hà Nội, mùa hoa sữa, Lễ hội Áo dài Du lịch",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT Du lịch Hà Nội (dulich.hanoi.gov.vn)",
    "official_website": "dulich.hanoi.gov.vn"
  },
  {
    "id": 16,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Hải Phòng",
    "ideal_months": [5, 6, 7, 8],
    "ideal_period_text": "Tháng 5 – 8",
    "highlights": "Du lịch biển Cát Bà, Đồ Sơn, Hải Phòng Foodtour",
    "primary_season": "Hè",
    "reference_source": "Sở Du lịch Hải Phòng",
    "official_website": "haiphong.gov.vn"
  },
  {
    "id": 17,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Quảng Ninh",
    "ideal_months": [4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 4 – 8",
    "highlights": "Hạ Long mùa biển đẹp, Carnival Hạ Long",
    "primary_season": "Hè",
    "reference_source": "Chương trình kích cầu du lịch mùa hè - UBND tỉnh Quảng Ninh",
    "official_website": "halong.org.vn"
  },
  {
    "id": 18,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Ninh Bình",
    "ideal_months": [1, 2, 3, 5, 6],
    "ideal_period_text": "Tháng 1 – 3 (Tâm linh) & T5 – T6 (Mùa lúa Tràng An)",
    "highlights": "Quần thể Danh thắng Tràng An, Tam Cốc mùa lúa vàng",
    "primary_season": "Xuân & Hè",
    "reference_source": "Hồ sơ Di sản Thế giới UNESCO Tràng An",
    "official_website": "ninhbinhtourism.com.vn"
  },
  {
    "id": 19,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Vĩnh Phúc",
    "ideal_months": [5, 6, 7, 8, 9],
    "ideal_period_text": "Tháng 5 – 9",
    "highlights": "Nghỉ dưỡng Tam Đảo, Hồ Đại Lải (tránh nóng)",
    "primary_season": "Hè",
    "reference_source": "Cổng TTĐT Du lịch Vĩnh Phúc",
    "official_website": "vinhphuc.gov.vn"
  },
  {
    "id": 20,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Bắc Ninh",
    "ideal_months": [2, 3, 4],
    "ideal_period_text": "Tháng 1 – 3 âm lịch (Tháng 2 - 4 dương)",
    "highlights": "Lễ hội Hội Lim, di sản Dân ca Quan họ Bắc Ninh",
    "primary_season": "Xuân",
    "reference_source": "Hồ sơ Di sản Phi vật thể Đại diện Nhân loại UNESCO",
    "official_website": "bacninh.gov.vn"
  },
  {
    "id": 21,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Hải Dương",
    "ideal_months": [5, 6, 9],
    "ideal_period_text": "Tháng 5 – 6 (Vải thiều) & Tháng 8 âm lịch",
    "highlights": "Lễ hội Côn Sơn - Kiếp Bạc, thu hoạch vải Thanh Hà",
    "primary_season": "Hè & Thu",
    "reference_source": "Sở VHTTDL tỉnh Hải Dương",
    "official_website": "haiduong.gov.vn"
  },
  {
    "id": 22,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Hưng Yên",
    "ideal_months": [7, 8],
    "ideal_period_text": "Tháng 7 – 8",
    "highlights": "Mùa nhãn lồng Phố Hiến, di tích Phố Hiến cổ",
    "primary_season": "Hè",
    "reference_source": "Chỉ dẫn địa lý Nhãn lồng Hưng Yên - Cục SHTT",
    "official_website": "hungyen.gov.vn"
  },
  {
    "id": 23,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Thái Bình",
    "ideal_months": [12, 1],
    "ideal_period_text": "Tháng 12 – 1",
    "highlights": "Cánh đồng hoa cải, biển vô cực Thụy Xuân",
    "primary_season": "Đông",
    "reference_source": "Cổng TTĐT tỉnh Thái Bình",
    "official_website": "thaibinh.gov.vn"
  },
  {
    "id": 24,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Hà Nam",
    "ideal_months": [1, 2, 3],
    "ideal_period_text": "Tháng 1 – 3",
    "highlights": "Chùa Tam Chúc, Lễ hội Tịch điền Đổi Sơn",
    "primary_season": "Xuân",
    "reference_source": "Sở VHTTDL tỉnh Hà Nam",
    "official_website": "hanam.gov.vn"
  },
  {
    "id": 25,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Thanh Hóa",
    "ideal_months": [5, 6, 7, 8],
    "ideal_period_text": "Tháng 5 – 8",
    "highlights": "Biển Sầm Sơn, Hải Tiến, Pù Luông mùa lúa chín",
    "primary_season": "Hè",
    "reference_source": "Cổng TTĐT Du lịch Thanh Hóa",
    "official_website": "thanhhoa.gov.vn"
  },
  {
    "id": 26,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Nghệ An",
    "ideal_months": [5, 6, 7, 8, 12],
    "ideal_period_text": "Tháng 5 – 8 (Biển) & Tháng 12 (Hoa hướng dương)",
    "highlights": "Biển Cửa Lò, Làng Sen quê Bác, cánh đồng hoa Nghĩa Đàn",
    "primary_season": "Hè & Đông",
    "reference_source": "Sở Du lịch tỉnh Nghệ An",
    "official_website": "nghean.gov.vn"
  },
  {
    "id": 27,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Hà Tĩnh",
    "ideal_months": [5, 6, 7],
    "ideal_period_text": "Tháng 5 – 7",
    "highlights": "Biển Thiên Cầm, Ngã ba Đồng Lộc",
    "primary_season": "Hè",
    "reference_source": "Cổng TTĐT Du lịch Hà Tĩnh",
    "official_website": "hatinh.gov.vn"
  },
  {
    "id": 28,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Quảng Bình",
    "ideal_months": [4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 4 – 8",
    "highlights": "Khám phá hệ thống hang động Phong Nha - Kẻ Bàng, Sơn Đoòng",
    "primary_season": "Hè",
    "reference_source": "Cung cấp dữ liệu mùa khô mùa mưa - BQL Vườn Quốc gia PNKB",
    "official_website": "quangbinhtourism.vn"
  },
  {
    "id": 29,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Quảng Trị",
    "ideal_months": [4, 5, 6, 7],
    "ideal_period_text": "Tháng 4 – 7",
    "highlights": "Du lịch Hoài niệm (Thành cổ Quảng Trị, Nghĩa trang Trường Sơn)",
    "primary_season": "Hè",
    "reference_source": "Sở VHTTDL tỉnh Quảng Trị",
    "official_website": "quangtri.gov.vn"
  },
  {
    "id": 30,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Thừa Thiên Huế",
    "ideal_months": [4, 5, 6],
    "ideal_period_text": "Tháng 4 – 6",
    "highlights": "Festival Huế, Cố đô Huế, Đại Nội, du lịch sông Hương",
    "primary_season": "Hè",
    "reference_source": "Trung tâm Bảo tồn Di tích Cố đô Huế",
    "official_website": "visithue.vn"
  },
  {
    "id": 31,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Đà Nẵng",
    "ideal_months": [4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 4 – 8",
    "highlights": "Biển Mỹ Khê, Lễ hội Pháo hoa Quốc tế Đà Nẵng (DIFF)",
    "primary_season": "Hè",
    "reference_source": "Kế hoạch tổ chức DIFF hằng năm - UBND TP. Đà Nẵng",
    "official_website": "danangfantasticity.com"
  },
  {
    "id": 32,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Quảng Nam",
    "ideal_months": [2, 3, 4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 2 – 8",
    "highlights": "Phố cổ Hội An, Di tích Mỹ Sơn, biển Cù Lao Chàm",
    "primary_season": "Xuân - Hè",
    "reference_source": "Cổng TTĐT Du lịch Quảng Nam (visitquangnam.vn)",
    "official_website": "visitquangnam.vn"
  },
  {
    "id": 33,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Quảng Ngãi",
    "ideal_months": [4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 4 – 8",
    "highlights": "Đảo Lý Sơn mùa biển xanh êm",
    "primary_season": "Hè",
    "reference_source": "Sở VHTTDL tỉnh Quảng Ngãi",
    "official_website": "quangngai.gov.vn"
  },
  {
    "id": 34,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Bình Định",
    "ideal_months": [3, 4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 3 – 8",
    "highlights": "Kỳ Co, Eo Gió, biển Quy Nhơn",
    "primary_season": "Xuân - Hè",
    "reference_source": "Cổng TTĐT Du lịch Bình Định (dulichbinhdinh.com.vn)",
    "official_website": "dulichbinhdinh.com.vn"
  },
  {
    "id": 35,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Phú Yên",
    "ideal_months": [3, 4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 3 – 8",
    "highlights": "Gành Đá Đĩa, Mũi Điện (nơi đón bình minh đầu tiên)",
    "primary_season": "Xuân - Hè",
    "reference_source": "Cổng TTĐT Du lịch Phú Yên",
    "official_website": "phuyen.gov.vn"
  },
  {
    "id": 36,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Khánh Hòa",
    "ideal_months": [1, 2, 3, 4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 1 – 8",
    "highlights": "Nha Trang, Vịnh Cam Ranh, Festival Biển Nha Trang",
    "primary_season": "Xuân - Hè",
    "reference_source": "Niên giám Khí hậu tỉnh Khánh Hòa (Mùa khô kéo dài)",
    "official_website": "nhatrang-khanhhoa.com"
  },
  {
    "id": 37,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Ninh Thuận",
    "ideal_months": [8, 9, 10],
    "ideal_period_text": "Tháng 8 – 10",
    "highlights": "Mùa nho Ninh Thuận, Lễ hội Kate của người Chăm",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT tỉnh Ninh Thuận",
    "official_website": "ninhthuan.gov.vn"
  },
  {
    "id": 38,
    "region_code": "BTB_DHMT",
    "region_name": "Bắc Trung Bộ & Duyên hải Miền Trung",
    "province_name": "Bình Thuận",
    "ideal_months": [10, 11, 12, 1, 2, 3, 4],
    "ideal_period_text": "Tháng 10 – 4 (năm sau)",
    "highlights": "Phan Thiết, Mũi Né (lướt sóng, biển xanh nắng ấm)",
    "primary_season": "Thu - Đông - Xuân",
    "reference_source": "Hiệp hội Du lịch Bình Thuận",
    "official_website": "binhthuan.gov.vn"
  },
  {
    "id": 39,
    "region_code": "TN",
    "region_name": "Tây Nguyên",
    "province_name": "Lâm Đồng",
    "ideal_months": [11, 12, 1, 2, 3],
    "ideal_period_text": "Tháng 11 – 3",
    "highlights": "Đà Lạt mùa hoa Dã quỳ, Cỏ hồng, Festival Hoa Đà Lạt",
    "primary_season": "Đông - Xuân",
    "reference_source": "Đề án Festival Hoa định kỳ - UBND tỉnh Lâm Đồng",
    "official_website": "dalat.lamdong.gov.vn"
  },
  {
    "id": 40,
    "region_code": "TN",
    "region_name": "Tây Nguyên",
    "province_name": "Đắk Lắk",
    "ideal_months": [3],
    "ideal_period_text": "Tháng 3",
    "highlights": "Lễ hội Cà phê Buôn Ma Thuột, mùa hoa cà phê nở",
    "primary_season": "Xuân",
    "reference_source": "Đề án Lễ hội Cà phê Buôn Ma Thuột Quốc gia",
    "official_website": "daklak.gov.vn"
  },
  {
    "id": 41,
    "region_code": "TN",
    "region_name": "Tây Nguyên",
    "province_name": "Đắk Nông",
    "ideal_months": [11, 12, 1, 2, 3, 4],
    "ideal_period_text": "Tháng 11 – 4",
    "highlights": "Công viên Địa chất Toàn cầu UNESCO Đắk Nông, Tà Đùng",
    "primary_season": "Đông - Xuân",
    "reference_source": "Hồ sơ Công viên Địa chất UNESCO Đắk Nông",
    "official_website": "daknong.gov.vn"
  },
  {
    "id": 42,
    "region_code": "TN",
    "region_name": "Tây Nguyên",
    "province_name": "Gia Lai",
    "ideal_months": [11, 12],
    "ideal_period_text": "Tháng 11 – 12",
    "highlights": "Mùa hoa Dã quỳ Chư Đăng Ya, Biển Hồ Pleiku",
    "primary_season": "Đông",
    "reference_source": "Cổng TTĐT Du lịch Gia Lai",
    "official_website": "gialai.gov.vn"
  },
  {
    "id": 43,
    "region_code": "TN",
    "region_name": "Tây Nguyên",
    "province_name": "Kon Tum",
    "ideal_months": [11, 12],
    "ideal_period_text": "Tháng 11 – 12",
    "highlights": "Măng Đen (săn mây, hoa mai anh đào), Lễ hội Cồng chiêng",
    "primary_season": "Đông",
    "reference_source": "Cổng TTĐT Du lịch Kon Tum",
    "official_website": "kontum.gov.vn"
  },
  {
    "id": 44,
    "region_code": "DNB",
    "region_name": "Đông Nam Bộ",
    "province_name": "Thành phố Hồ Chí Minh",
    "ideal_months": [12, 1, 2, 3, 4],
    "ideal_period_text": "Tháng 12 – 4",
    "highlights": "Lễ hội Âm nhạc Quốc tế HOZO, Tuần lễ Du lịch TP.HCM",
    "primary_season": "Đông - Xuân",
    "reference_source": "Sở Du lịch TP. Hồ Chí Minh (visithochiminhcity.vn)",
    "official_website": "visithochiminhcity.vn"
  },
  {
    "id": 45,
    "region_code": "DNB",
    "region_name": "Đông Nam Bộ",
    "province_name": "Bà Rịa - Vũng Tàu",
    "ideal_months": [11, 12, 1, 2, 3, 4, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 11 – 4 (Côn Đảo) & T1 – T8 (Vũng Tàu)",
    "highlights": "Biển Vũng Tàu, Rùa đẻ trứng ở Côn Đảo (Tháng 5-10)",
    "primary_season": "Quanh năm",
    "reference_source": "BQL Vườn Quốc gia Côn Đảo",
    "official_website": "baria-vungtau.gov.vn"
  },
  {
    "id": 46,
    "region_code": "DNB",
    "region_name": "Đông Nam Bộ",
    "province_name": "Tây Ninh",
    "ideal_months": [2, 3, 4],
    "ideal_period_text": "Tháng 1 – 3 (Âm lịch)",
    "highlights": "Lễ hội Mùa xuân Núi Bà Đen, Tòa thánh Tây Ninh",
    "primary_season": "Xuân",
    "reference_source": "Cổng TTĐT Du lịch Tây Ninh",
    "official_website": "tayninh.gov.vn"
  },
  {
    "id": 47,
    "region_code": "DNB",
    "region_name": "Đông Nam Bộ",
    "province_name": "Bình Dương",
    "ideal_months": [2, 5, 6, 7, 8],
    "ideal_period_text": "Tháng 5 – 8 (Trái cây) & T1 âm (Chùa Bà)",
    "highlights": "Mùa trái cây Lái Thiêu, Chùa Bà Thiên Hậu",
    "primary_season": "Hè",
    "reference_source": "Sở VHTTDL tỉnh Bình Dương",
    "official_website": "binhduong.gov.vn"
  },
  {
    "id": 48,
    "region_code": "DNB",
    "region_name": "Đông Nam Bộ",
    "province_name": "Đồng Nai",
    "ideal_months": [5, 6, 7, 8],
    "ideal_period_text": "Tháng 5 – 8",
    "highlights": "Vườn Quốc gia Cát Tiên, vườn trái cây Long Khánh",
    "primary_season": "Hè",
    "reference_source": "BQL Vườn Quốc gia Cát Tiên",
    "official_website": "dongnai.gov.vn"
  },
  {
    "id": 49,
    "region_code": "DNB",
    "region_name": "Đông Nam Bộ",
    "province_name": "Bình Phước",
    "ideal_months": [12, 1, 2],
    "ideal_period_text": "Tháng 12 – 2",
    "highlights": "Mùa cao su trút lá, Trảng cỏ Bù Lách",
    "primary_season": "Đông - Xuân",
    "reference_source": "Cổng TTĐT tỉnh Bình Phước",
    "official_website": "binhphuoc.gov.vn"
  },
  {
    "id": 50,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Cần Thơ",
    "ideal_months": [6, 7, 8, 9, 10, 11],
    "ideal_period_text": "Tháng 6 – 8 (Trái cây) & T9 – T11 (Mùa nước nổi)",
    "highlights": "Chợ nổi Cái Răng, ngày hội Du lịch sinh thái Phong Điền",
    "primary_season": "Hè & Thu",
    "reference_source": "Cổng TTĐT Du lịch Cần Thơ (canthotourism.vn)",
    "official_website": "canthotourism.vn"
  },
  {
    "id": 51,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "An Giang",
    "ideal_months": [9, 10, 11],
    "ideal_period_text": "Tháng 9 – 11",
    "highlights": "Rừng tràm Trà Sư mùa nước nổi, Lễ hội vía Bà Chúa Xứ",
    "primary_season": "Thu",
    "reference_source": "Sở VHTTDL tỉnh An Giang",
    "official_website": "angiang.gov.vn"
  },
  {
    "id": 52,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Đồng Tháp",
    "ideal_months": [9, 10, 11, 12],
    "ideal_period_text": "Tháng 9 – 11 (Nước nổi) & Tháng 12 (Làng hoa)",
    "highlights": "Vườn Quốc gia Tràm Chim, Làng hoa Sa Đéc",
    "primary_season": "Thu - Đông",
    "reference_source": "Cổng TTĐT Du lịch Đồng Tháp",
    "official_website": "dongthap.gov.vn"
  },
  {
    "id": 53,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Kiên Giang",
    "ideal_months": [11, 12, 1, 2, 3, 4],
    "ideal_period_text": "Tháng 11 – 4 (năm sau)",
    "highlights": "Phú Quốc, Nam Du mùa khô biển lặng, nắng ấm",
    "primary_season": "Đông - Xuân",
    "reference_source": "Dữ liệu Đài Khí tượng Thủy văn Kiên Giang",
    "official_website": "kiengiang.gov.vn"
  },
  {
    "id": 54,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Bến Tre",
    "ideal_months": [5, 6, 7, 8],
    "ideal_period_text": "Tháng 5 – 8",
    "highlights": "Mùa trái cây Chợ Lách, du lịch sinh thái cồn Cổ Chiên",
    "primary_season": "Hè",
    "reference_source": "Cổng TTĐT Du lịch Bến Tre",
    "official_website": "bentre.gov.vn"
  },
  {
    "id": 55,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Tiền Giang",
    "ideal_months": [5, 6, 7, 8],
    "ideal_period_text": "Tháng 5 – 8",
    "highlights": "Chợ nổi Cái Bè, Cù lao Thới Sơn, trái cây Chợ Gạo",
    "primary_season": "Hè",
    "reference_source": "Cổng TTĐT Du lịch Tiền Giang",
    "official_website": "tiengiang.gov.vn"
  },
  {
    "id": 56,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Vĩnh Long",
    "ideal_months": [5, 6, 7, 8],
    "ideal_period_text": "Tháng 5 – 8",
    "highlights": "Du lịch sông nước Cù lao An Bình, làng gạch Mang Thít",
    "primary_season": "Hè",
    "reference_source": "Sở VHTTDL tỉnh Vĩnh Long",
    "official_website": "vinhlong.gov.vn"
  },
  {
    "id": 57,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Hậu Giang",
    "ideal_months": [9, 10, 11],
    "ideal_period_text": "Tháng 9 – 11",
    "highlights": "Khu bảo tồn thiên nhiên Lung Ngọc Hoàng mùa nước nổi",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT tỉnh Hậu Giang",
    "official_website": "haugiang.gov.vn"
  },
  {
    "id": 58,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Trà Vinh",
    "ideal_months": [10, 11],
    "ideal_period_text": "Tháng 10 âm lịch (Tháng 10-11 dương)",
    "highlights": "Lễ hội Ok Om Bok của đồng bào Khmer",
    "primary_season": "Thu",
    "reference_source": "Quyết định Di sản văn hóa phi vật thể Quốc gia - Bộ VHTTDL",
    "official_website": "travinh.gov.vn"
  },
  {
    "id": 59,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Sóc Trăng",
    "ideal_months": [10, 11],
    "ideal_period_text": "Tháng 10 âm lịch (Tháng 10-11 dương)",
    "highlights": "Lễ hội Đua ghe Ngo (Ok Om Bok)",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT Du lịch Sóc Trăng",
    "official_website": "soctrang.gov.vn"
  },
  {
    "id": 60,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Bạc Liêu",
    "ideal_months": [10, 11, 12],
    "ideal_period_text": "Tháng 10 – 12",
    "highlights": "Cánh đồng điện gió, Lễ hội Dạ cổ hoài nam",
    "primary_season": "Thu - Đông",
    "reference_source": "Sở VHTTDL tỉnh Bạc Liêu",
    "official_website": "baclieu.gov.vn"
  },
  {
    "id": 61,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Cà Mau",
    "ideal_months": [12, 1, 2, 3, 4],
    "ideal_period_text": "Tháng 12 – 4 (Mùa khô)",
    "highlights": "Đất Mũi Cà Mau, Vườn Quốc gia U Minh Hạ",
    "primary_season": "Đông - Xuân",
    "reference_source": "Cổng TTĐT Du lịch Cà Mau (camautourism.vn)",
    "official_website": "camautourism.vn"
  },
  {
    "id": 62,
    "region_code": "DBSCL",
    "region_name": "Đồng bằng Sông Cửu Long",
    "province_name": "Long An",
    "ideal_months": [9, 10, 11],
    "ideal_period_text": "Tháng 9 – 11",
    "highlights": "Làng nổi Tân Lập mùa nước nổi, đầm sen",
    "primary_season": "Thu",
    "reference_source": "Cổng TTĐT Du lịch Long An",
    "official_website": "longan.gov.vn"
  },
  {
    "id": 63,
    "region_code": "DBSH",
    "region_name": "Đồng bằng Sông Hồng",
    "province_name": "Nam Định",
    "ideal_months": [1, 2, 3, 9],
    "ideal_period_text": "Tháng 1 – 3 (Lễ hội Xuân) & Tháng 9",
    "highlights": "Lễ hội Khai ấn Đền Trần, Quần thể di tích Phủ Dầy, Nhà thờ đổ Hải Lý",
    "primary_season": "Xuân & Thu",
    "reference_source": "Sở VHTTDL tỉnh Nam Định",
    "official_website": "namdinh.gov.vn"
  }
];

async function seedData() {
  console.log('🚀 Bắt đầu nạp dữ liệu Thời điểm du lịch 63 Tỉnh Thành...');

  // 1. Lưu file JSON chuẩn cho Backend API
  const backendJsonPath = path.resolve(__dirname, '../data/travel_seasons_63_provinces.json');
  fs.mkdirSync(path.dirname(backendJsonPath), { recursive: true });
  fs.writeFileSync(backendJsonPath, JSON.stringify(seasonsData, null, 2), 'utf-8');
  console.log(`✅ Đã lưu file JSON backend: ${backendJsonPath}`);

  // 2. Lưu file Chunk chuẩn cho Knowledge Builder
  const chunks = seasonsData.map(item => {
    const provUpper = item.province_name.toUpperCase();
    return {
      id: `season_${item.id}`,
      title: `${provUpper} - Thời điểm du lịch lý tưởng`,
      category: "destination",
      province: provUpper,
      subCategory: "TỔNG QUAN",
      content: `THỜI ĐIỂM DU LỊCH LÝ TƯỞNG & ĐIỂM NHẤN TỈNH ${provUpper}\n` +
        `- Khu vực: ${item.region_name} (${item.region_code})\n` +
        `- Thời gian đi lý tưởng: ${item.ideal_period_text} (Các tháng ${item.ideal_months.join(', ')})\n` +
        `- Mùa du lịch chính: ${item.primary_season}\n` +
        `- Trải nghiệm & Điểm nhấn nổi bật: ${item.highlights}\n` +
        `- Trích dẫn & Căn cứ pháp lý/Dữ liệu: ${item.reference_source}\n` +
        `- Cổng thông tin chính thức: ${item.official_website}`,
      metadata: item
    };
  });

  const knowledgeChunkPath = path.resolve(__dirname, '../../../knowledge-builder/chunks/018_THOI_DIEM_DU_LICH_63_TINH.json');
  if (fs.existsSync(path.dirname(knowledgeChunkPath))) {
    fs.writeFileSync(knowledgeChunkPath, JSON.stringify(chunks, null, 2), 'utf-8');
    console.log(`✅ Đã lưu file Chunk RAG: ${knowledgeChunkPath}`);
  }

  // 3. Upsert dữ liệu vào PostgreSQL KnowledgeContent DB
  let countSuccess = 0;
  for (const chunk of chunks) {
    try {
      const existing = await withDbRetry(() => prisma.knowledgeContent.findFirst({
        where: { title: chunk.title }
      }));

      let contentId = existing?.id;
      if (existing) {
        await withDbRetry(() => prisma.knowledgeContent.update({
          where: { id: existing.id },
          data: {
            body: chunk.content,
            category: 'destination'
          }
        }));
      } else {
        const newDoc = await withDbRetry(() => prisma.knowledgeContent.create({
          data: {
            title: chunk.title,
            body: chunk.content,
            category: 'destination'
          }
        }));
        contentId = newDoc.id;
      }

      if (contentId) {
        const questionText = `Nên đi du lịch ${chunk.province} vào tháng mấy hay mùa nào đẹp nhất?`;
        const existingQ = await withDbRetry(() => prisma.knowledgeQuestion.findFirst({
          where: { contentId, questionText }
        }));
        if (!existingQ) {
          await withDbRetry(() => prisma.knowledgeQuestion.create({
            data: {
              contentId,
              questionText
            }
          }));
        }

        const existingA = await withDbRetry(() => prisma.knowledgeAnswer.findFirst({
          where: { contentId }
        }));
        if (!existingA) {
          await withDbRetry(() => prisma.knowledgeAnswer.create({
            data: {
              contentId,
              answerText: chunk.content
            }
          }));
        }
      }
      countSuccess++;
    } catch (err: any) {
      console.warn(`⚠️ Bỏ qua ghi DB cho ${chunk.title}:`, err.message);
    }
  }

  console.log(`🎉 Nạp thành công ${seasonsData.length} tỉnh thành (${countSuccess} bản ghi CSDL đã cập nhật).`);
}

seedData()
  .catch(e => {
    console.error('❌ Nạp data thất bại:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
