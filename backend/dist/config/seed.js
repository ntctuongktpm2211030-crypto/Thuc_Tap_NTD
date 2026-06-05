"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoSeed = autoSeed;
const db_1 = __importDefault(require("./db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const LONG_JOURNEY_BODY = `Ngày 1 — Di chuyển từ Hà Nội, chúng tôi có mặt ở thị trấn Đồng Văn lúc chiều muộn. Sương mù phủ kín các sườn núi đá vôi, không khí trong lành đến lạ. Homestay nhỏ của gia đình người H'Mông rất ấm cúng, bữa tối đơn giản nhưng đậm đà.

Ngày 2 — Cung đường Mã Pí Lèng và đèo Mã Pí Lèng được mệnh danh là một trong tứ đại đỉnh đèo của Tây Bắc. Từng cua ôm sườn núi, bên dưới là thung lũng sâu thẳm. Chúng tôi dừng chân nhiều lần chỉ để thở và chụp ảnh — không gian quá rộng để gói vào khung hình.

Ngày 3 — Làng văn hóa Lô Lô Chải, gặp gỡ người dân địa phương, thử rượu ngô và thêu thổ cẩm. Buổi tối trời se lạnh, ngồi quanh bếp lửa nghe kể chuyện về mùa lúa chín.

Ngày 4 — Hồ Thăng Hen, cánh đồng hoa cải vàng rực (đúng mùa). Trở về Hà Giang với vali đầy ảnh và vài kg thổ cẩm mua ủng hộ làng nghề.`;
const LONG_FOOD_BODY = `Hà Nội không chỉ có phở. Buổi sáng bắt đầu ở góc phố Lý Quốc Sư với bánh cuốn nóng hổi, nước mắm pha chanh ớt đúng bài. Trưa là bún chả Hương Liên — quán từng đón cựu Tổng thống Mỹ — vẫn đông khách vì chất lượng ổn định.

Chiều lang thang Phố cổ: bánh mì chảo, nộm bò khô, và ly cà phê trứng ở Giảng. Tối thử bánh tôm Hồ Tây bên hồ, gió hồ lùa vào mặt, vừa ăn vừa nghe xe máy rền rĩ — đúng nhịp sống thủ đô.

Mẹo: đi nhóm 3–4 người, gọi mỗi quán một món signature, chia sẻ để thử được nhiều hơn. Mang tiền mặt, nhiều quán nhỏ chưa nhận chuyển khoản.`;
async function autoSeed() {
    try {
        console.log('🌱 Starting database auto-seeding & syncing...');
        // 1. Create or Update Mock Users
        const passwordHash = await bcryptjs_1.default.hash('password123', 12);
        const mockUsersData = [
            { email: 'minhquan@smarttravel.com', fullName: 'Minh Quân Nguyễn', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80' },
            { email: 'sarah@smarttravel.com', fullName: 'Sarah Miller', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
            { email: 'linhtran@smarttravel.com', fullName: 'Linh Trần', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80' },
            { email: 'alexchen@smarttravel.com', fullName: 'Alex Chen', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80' },
            { email: 'tomvu@smarttravel.com', fullName: 'Tom Vũ', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80' },
            { email: 'davidkim@smarttravel.com', fullName: 'David Kim', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80' },
            { email: 'anhthu@smarttravel.com', fullName: 'Anh Thư', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80' }
        ];
        const users = {};
        for (const u of mockUsersData) {
            let user = await db_1.default.user.findUnique({ where: { email: u.email } });
            if (!user) {
                user = await db_1.default.user.create({
                    data: {
                        email: u.email,
                        passwordHash,
                        profile: {
                            create: {
                                fullName: u.fullName,
                                avatarUrl: u.avatarUrl
                            }
                        }
                    }
                });
            }
            else {
                await db_1.default.profile.upsert({
                    where: { userId: user.id },
                    update: { avatarUrl: u.avatarUrl, fullName: u.fullName },
                    create: { userId: user.id, fullName: u.fullName, avatarUrl: u.avatarUrl }
                });
            }
            users[u.fullName] = user.id;
        }
        // 2. Create or Update Mock Posts with hardcoded IDs matching the frontend
        const postsToSeed = [
            {
                id: 'h1',
                authorId: users['Minh Quân Nguyễn'],
                mediaUrls: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1400&q=80'],
                content: JSON.stringify({
                    type: 'journey',
                    displayType: 'hero',
                    category: 'Phiêu Lưu',
                    isFeatured: true,
                    destination: 'Hà Giang, Việt Nam',
                    headline: 'Con đường đèo đẹp nhất thế giới: Hành trình Hà Giang Loop 4 ngày khó quên',
                    excerpt: 'Lách qua những đỉnh karst, làng dân tộc thiểu số và ruộng lúa bậc thang — Hà Giang Loop là bí mật đẹp nhất Việt Nam đang dần lộ diện.',
                    body: LONG_JOURNEY_BODY
                })
            },
            {
                id: 'p1',
                authorId: users['Sarah Miller'],
                mediaUrls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'],
                content: JSON.stringify({
                    type: 'post',
                    displayType: 'magazine',
                    category: 'Phiêu Lưu',
                    destination: 'Sapa, Lào Cai',
                    headline: 'Chinh phục Fansipan: Bình minh sẽ thay đổi cuộc đời bạn',
                    excerpt: 'Ở độ cao 3.143m, Fansipan là "Nóc nhà Đông Dương" — cảnh bình minh từ đỉnh núi xứng đáng từng bước trong chuyến leo 2 ngày.',
                    body: 'Trekking Sapa chinh phục Fansipan qua cung Trạm Tôn dài 2 ngày 1 đêm thực sự là trải nghiệm kỳ diệu. Bạn sẽ đi xuyên qua những tán rừng trúc rậm rạp, những con dốc đá dựng đứng và đón bình minh rực rỡ tại đỉnh chóp Fansipan.'
                })
            },
            {
                id: 'p2',
                authorId: users['Linh Trần'],
                mediaUrls: [
                    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1540202403-b7abd6747a18?auto=format&fit=crop&w=600&q=80'
                ],
                content: JSON.stringify({
                    type: 'journey',
                    displayType: 'social',
                    destination: 'Phố cổ Hội An → Bãi biển An Bàng → Làng rau Trà Quế',
                    body: 'Vừa đến Hội An và tôi đã mê hoàn toàn! Những chiếc đèn lồng về đêm thật kỳ diệu! Mẹo nhỏ: thuê xe đạp (100k/ngày) và khám phá cánh đồng lúa lúc bình minh — không một bóng người.',
                    excerpt: 'Vừa đến Hội An và tôi đã mê hoàn toàn! Những chiếc đèn lồng về đêm thật kỳ diệu!',
                    location: { name: 'Phố cổ Hội An', lat: 15.8801, lng: 108.338 },
                    route: {
                        points: [
                            { name: 'Phố cổ Hội An', address: 'Phố cổ Hội An, Minh An, Hội An, Quảng Nam, Việt Nam', lat: 15.8801, lng: 108.338 },
                            { name: 'Bãi biển An Bàng', address: 'An Bàng, Cẩm An, Hội An, Quảng Nam, Việt Nam', lat: 15.916, lng: 108.365 },
                            { name: 'Làng rau Trà Quế', address: 'Trà Quế, Cẩm Hà, Hội An, Quảng Nam, Việt Nam', lat: 15.895, lng: 108.352 }
                        ]
                    }
                })
            },
            {
                id: 'p3',
                authorId: users['Alex Chen'],
                mediaUrls: ['https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=800&q=80'],
                content: JSON.stringify({
                    type: 'post',
                    displayType: 'magazine',
                    category: 'Ẩm Thực',
                    destination: 'Hà Nội, Việt Nam',
                    headline: '12 món ăn đường phố Hà Nội sẽ thay đổi cuộc đời bạn mãi mãi',
                    excerpt: 'Từ Bún Chả Obama đến Bánh Mì Trứng bí ẩn — hướng dẫn toàn diện ăn uống xuyên thủ đô trong 24 giờ.',
                    body: LONG_FOOD_BODY
                })
            },
            {
                id: 'p4',
                authorId: users['Tom Vũ'],
                mediaUrls: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
                content: JSON.stringify({
                    type: 'journey',
                    displayType: 'social',
                    destination: 'Đảo Phú Quốc',
                    body: 'Bình minh Phú Quốc — đi bộ dọc bãi biển lúc 5h sáng và có cả dải cát chỉ một mình. Nước trong vắt, ấm 28°C đầu tháng 6.',
                    excerpt: 'Bình minh Phú Quốc — đi bộ dọc bãi biển lúc 5h sáng và có cả dải cát chỉ một mình.',
                    location: { name: 'Đảo Phú Quốc', lat: 10.2289, lng: 103.9572 }
                })
            }
        ];
        for (const p of postsToSeed) {
            await db_1.default.post.upsert({
                where: { id: p.id },
                update: {
                    content: p.content,
                    mediaUrls: p.mediaUrls,
                    authorId: p.authorId,
                    deletedAt: null
                },
                create: p
            });
        }
        console.log('🌿 Database auto-seeding completed successfully.');
    }
    catch (err) {
        console.error('❌ Error during auto-seed:', err);
    }
}
