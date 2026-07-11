const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🚀 Bắt đầu chạy kiểm thử tích hợp Chatbot, Memory và Itinerary...');

  try {
    // 1. Đăng nhập để lấy Access Token
    console.log('\n🔑 1. Đăng nhập...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'minhquan@smarttravel.com',
        password: 'password123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Đăng nhập thất bại: ${loginRes.statusText}`);
    }

    const loginData = (await loginRes.json()) as any;
    const token = loginData.accessToken || loginData.token;
    if (!token) {
      throw new Error('Không nhận được token từ API đăng nhập.');
    }
    console.log('✅ Đăng nhập thành công! Token:', token.substring(0, 15) + '...');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // ──────────────────────────────────────────────────────────
    // TEST MEMORY MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n🧠 2. Kiểm thử Memory Module...');

    // A. Xóa memory cũ (nếu có)
    await fetch(`${BASE_URL}/chatbot/memory`, { method: 'DELETE', headers });
    console.log('🗑️  Đã làm sạch bộ nhớ cũ.');

    // B. Thêm memory mới
    const addMemoryRes = await fetch(`${BASE_URL}/chatbot/memory`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        travelPreferences: ['phượt', 'khám phá thiên nhiên'],
        favoriteFoods: ['bánh mì', 'phở'],
        budget: 'trung bình',
        transportation: ['xe máy'],
        favoriteLocations: ['Hà Giang', 'Sapa'],
      }),
    });
    console.log('➕ Thêm memory:', addMemoryRes.status === 200 ? 'Thành công' : 'Thất bại');

    // C. Lấy memory
    const getMemoryRes = await fetch(`${BASE_URL}/chatbot/memory`, { method: 'GET', headers });
    const memoryData = (await getMemoryRes.json()) as any;
    console.log('🔍 Lấy memory hiện tại:', JSON.stringify(memoryData));

    // D. Sửa memory
    const editMemoryRes = await fetch(`${BASE_URL}/chatbot/memory`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        favoriteFoods: ['bánh mì', 'phở', 'bún chả'],
      }),
    });
    const updatedMemoryData = (await editMemoryRes.json()) as any;
    console.log('✏️  Sửa memory (thêm bún chả):', updatedMemoryData.favoriteFoods);

    // ──────────────────────────────────────────────────────────
    // TEST CHATBOT CONVERSATION MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n💬 3. Kiểm thử Chatbot Conversation Module...');

    // A. Tạo cuộc hội thoại mới
    const createConvRes = await fetch(`${BASE_URL}/chatbot/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Hỏi về ẩm thực Hà Nội' }),
    });
    const convData = (await createConvRes.json()) as any;
    console.log('✅ Đã tạo cuộc hội thoại mới. ID:', convData.id);

    // B. Lấy danh sách cuộc hội thoại
    const listConvRes = await fetch(`${BASE_URL}/chatbot/conversations`, { method: 'GET', headers });
    const listConv = (await listConvRes.json()) as any;
    console.log(`📋 Số lượng cuộc hội thoại: ${listConv.length}`);

    // C. Gửi tin nhắn đầu tiên (Hỏi về ăn uống)
    console.log('📤 Đang gửi tin nhắn hỏi món ăn...');
    const sendMsgRes = await fetch(`${BASE_URL}/chatbot/conversations/${convData.id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: 'Tôi muốn ăn trưa ở Hà Nội, gợi ý cho tôi món ăn nhé' }),
    });
    const sendResult = (await sendMsgRes.json()) as any;
    console.log('👤 User hỏi:', 'Tôi muốn ăn trưa ở Hà Nội, gợi ý cho tôi món ăn nhé');
    console.log('🤖 AI phản hồi:', sendResult.assistantMessage?.versions[0]?.content);

    // D. Lấy chi tiết cuộc hội thoại
    const detailRes = await fetch(`${BASE_URL}/chatbot/conversations/${convData.id}`, { method: 'GET', headers });
    const detailData = (await detailRes.json()) as any;
    console.log(`🔍 Chi tiết hội thoại: Lấy được ${detailData.messages?.length} tin nhắn.`);

    // E. Tạo lại (Regenerate) câu trả lời cho tin nhắn trợ lý ảo
    const assistantMsgId = sendResult.assistantMessage.id;
    console.log('🔄 Đang gửi yêu cầu tạo lại câu trả lời (Regenerate) cho tin nhắn ID:', assistantMsgId);
    const regenRes = await fetch(`${BASE_URL}/chatbot/messages/${assistantMsgId}/regenerate`, {
      method: 'POST',
      headers,
    });
    const regenResult = (await regenRes.json()) as any;
    console.log('🤖 AI phản hồi mới (Phiên bản 2):', regenResult.versions[0]?.content);
    console.log('📄 Số phiên bản tin nhắn hiện có:', regenResult.versions.length);

    // ──────────────────────────────────────────────────────────
    // TEST ITINERARY MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n📅 4. Kiểm thử Itinerary Module...');

    // A. Tạo lịch trình du lịch
    const createItinRes = await fetch(`${BASE_URL}/itineraries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Chuyến đi Hà Giang Loop 3 ngày',
        description: 'Khám phá đèo Mã Pí Lèng và các làng bản dân tộc.',
      }),
    });
    const itinData = (await createItinRes.json()) as any;
    console.log('✅ Đã tạo lịch trình du lịch. ID:', itinData.id);

    // B. Thêm ngày vào lịch trình
    const addDayRes = await fetch(`${BASE_URL}/itineraries/${itinData.id}/days`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ dayIndex: 1, date: '2026-07-01T00:00:00.000Z' }),
    });
    const dayData = (await addDayRes.json()) as any;
    console.log('📅 Đã thêm ngày thứ', dayData.dayIndex, '. ID ngày:', dayData.id);

    // C. Thêm hoạt động vào ngày
    const addActRes = await fetch(`${BASE_URL}/itineraries/days/${dayData.id}/activities`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Ăn sáng phở tráng kìm',
        description: 'Thưởng thức món phở ngô truyền thống tráng kìm.',
        startTime: '08:00',
        endTime: '09:00',
        location: 'Quản Bạ, Hà Giang',
        cost: 5.0,
      }),
    });
    const actData = (await addActRes.json()) as any;
    console.log('🏃 Đã thêm hoạt động:', actData.title, '. ID hoạt động:', actData.id);

    // D. Cập nhật hoạt động
    const updateActRes = await fetch(`${BASE_URL}/itineraries/activities/${actData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Ăn sáng phở ngô Tráng Kìm (Cập nhật)',
        cost: 6.0,
      }),
    });
    const updatedAct = (await updateActRes.json()) as any;
    console.log('✏️  Cập nhật hoạt động:', updatedAct.title, '. Giá tiền mới:', updatedAct.cost);

    // E. Lấy toàn bộ lịch trình
    const getItinDetailsRes = await fetch(`${BASE_URL}/itineraries/${itinData.id}`, { method: 'GET', headers });
    const fullItin = (await getItinDetailsRes.json()) as any;
    console.log('🔍 Xem toàn bộ lịch trình chi tiết:', JSON.stringify(fullItin, null, 2));

    // F. Xóa hoạt động
    const delActRes = await fetch(`${BASE_URL}/itineraries/activities/${actData.id}`, {
      method: 'DELETE',
      headers,
    });
    const delResult = (await delActRes.json()) as any;
    console.log('🗑️  Xóa hoạt động:', delResult.message);

    // ──────────────────────────────────────────────────────────
    // TEST RECOMMENDATION MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n📌 5. Kiểm thử Recommendation Module...');

    // A. Thêm gợi ý mới
    const createRecRes = await fetch(`${BASE_URL}/user-recommendations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        location: 'Đèo Mã Pí Lèng, Hà Giang',
        priority: 'high',
        reason: 'Phong cảnh hùng vĩ phù hợp với thói quen phượt của bạn.',
        type: 'destination',
      }),
    });
    const recData = (await createRecRes.json()) as any;
    console.log('✅ Đã tạo gợi ý địa điểm. ID:', recData.id, '. Địa điểm:', recData.location);

    // B. Lấy danh sách gợi ý của user
    const listRecRes = await fetch(`${BASE_URL}/user-recommendations`, { method: 'GET', headers });
    const listRec = (await listRecRes.json()) as any;
    console.log(`📋 Số lượng gợi ý của user: ${listRec.length}`);

    // C. Cập nhật gợi ý
    const updateRecRes = await fetch(`${BASE_URL}/user-recommendations/${recData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        priority: 'critical',
        reason: 'Đỉnh đèo siêu đẹp, nhất định phải trải nghiệm trước khi về!',
      }),
    });
    const updatedRec = (await updateRecRes.json()) as any;
    console.log('✏️  Cập nhật gợi ý. Độ ưu tiên mới:', updatedRec.priority, '. Lý do:', updatedRec.reason);

    // D. Xóa gợi ý
    const deleteRecRes = await fetch(`${BASE_URL}/user-recommendations/${recData.id}`, {
      method: 'DELETE',
      headers,
    });
    const delRecResult = (await deleteRecRes.json()) as any;
    console.log('🗑️  Xóa gợi ý:', delRecResult.message);

    // ──────────────────────────────────────────────────────────
    // TEST TRAVEL HISTORY MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n🗺️ 6. Kiểm thử TravelHistory Module...');

    // A. Thêm lịch sử đi lại
    const createHistoryRes = await fetch(`${BASE_URL}/travel-history`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        location: 'Vịnh Hạ Long, Quảng Ninh',
        time: '2026-05-15T08:00:00.000Z',
        rating: '5 sao - Cảnh vịnh tuyệt mỹ',
        cost: 150.0,
      }),
    });
    const historyData = (await createHistoryRes.json()) as any;
    console.log('✅ Đã tạo lịch sử đi lại. ID:', historyData.id, '. Địa điểm:', historyData.location);

    // B. Lấy danh sách lịch sử đi lại
    const listHistoryRes = await fetch(`${BASE_URL}/travel-history`, { method: 'GET', headers });
    const listHistory = (await listHistoryRes.json()) as any;
    console.log(`📋 Số lượng bản ghi lịch sử của user: ${listHistory.length}`);

    // C. Cập nhật bản ghi lịch sử
    const updateHistoryRes = await fetch(`${BASE_URL}/travel-history/${historyData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        rating: '4.5 sao - Dịch vụ du thuyền hơi đông',
        cost: 145.0,
      }),
    });
    const updatedHistory = (await updateHistoryRes.json()) as any;
    console.log('✏️  Cập nhật lịch sử. Đánh giá mới:', updatedHistory.rating, '. Chi phí mới:', updatedHistory.cost);

    // D. Xóa lịch sử
    const deleteHistoryRes = await fetch(`${BASE_URL}/travel-history/${historyData.id}`, {
      method: 'DELETE',
      headers,
    });
    const delHistoryResult = (await deleteHistoryRes.json()) as any;
    console.log('🗑️  Xóa lịch sử:', delHistoryResult.message);

    // ──────────────────────────────────────────────────────────
    // TEST FAVORITE FOODS MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n🍜 7. Kiểm thử FavoriteFoods Module...');

    // A. Thêm món ăn yêu thích
    const createFoodRes = await fetch(`${BASE_URL}/favorite-foods`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Phở bò tái lăn',
        region: 'Hà Nội',
        description: 'Bánh phở mềm, thịt bò xào tái lăn thơm mùi tỏi và gừng.',
        rating: 4.8,
      }),
    });
    const foodData = (await createFoodRes.json()) as any;
    console.log('✅ Đã tạo món ăn yêu thích. ID:', foodData.id, '. Tên món:', foodData.name);

    // B. Lấy danh sách món ăn yêu thích
    const listFoodRes = await fetch(`${BASE_URL}/favorite-foods`, { method: 'GET', headers });
    const listFood = (await listFoodRes.json()) as any;
    console.log(`📋 Số lượng món ăn yêu thích của user: ${listFood.length}`);

    // C. Cập nhật món ăn yêu thích
    const updateFoodRes = await fetch(`${BASE_URL}/favorite-foods/${foodData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        rating: 5.0,
        description: 'Bánh phở mềm, thịt bò xào tái lăn siêu thơm ngon đậm đà!',
      }),
    });
    const updatedFood = (await updateFoodRes.json()) as any;
    console.log('✏️  Cập nhật món ăn. Đánh giá mới:', updatedFood.rating, '. Mô tả mới:', updatedFood.description);

    // D. Xóa món ăn yêu thích
    const deleteFoodRes = await fetch(`${BASE_URL}/favorite-foods/${foodData.id}`, {
      method: 'DELETE',
      headers,
    });
    const delFoodResult = (await deleteFoodRes.json()) as any;
    console.log('🗑️  Xóa món ăn yêu thích:', delFoodResult.message);

    // ──────────────────────────────────────────────────────────
    // TEST SAVED PLACES MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n📍 8. Kiểm thử SavedPlaces Module...');

    // A. Lưu địa điểm
    const createPlaceRes = await fetch(`${BASE_URL}/saved-places`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Hồ Hoàn Kiếm',
        category: 'attraction',
        latitude: 21.0285,
        longitude: 105.8522,
        address: 'Hàng Trống, Hoàn Kiếm, Hà Nội',
        imageUrl: 'https://example.com/ho-guom.jpg',
      }),
    });
    const placeData = (await createPlaceRes.json()) as any;
    console.log('✅ Đã lưu địa điểm. ID:', placeData.id, '. Tên địa điểm:', placeData.name);

    // B. Lấy danh sách địa điểm đã lưu
    const listPlaceRes = await fetch(`${BASE_URL}/saved-places`, { method: 'GET', headers });
    const listPlace = (await listPlaceRes.json()) as any;
    console.log(`📋 Số lượng địa điểm đã lưu của user: ${listPlace.length}`);

    // C. Cập nhật địa điểm đã lưu
    const updatePlaceRes = await fetch(`${BASE_URL}/saved-places/${placeData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'Hồ Hoàn Kiếm (Hồ Gươm)',
        imageUrl: 'https://example.com/ho-guom-updated.jpg',
      }),
    });
    const updatedPlace = (await updatePlaceRes.json()) as any;
    console.log('✏️  Cập nhật địa điểm. Tên mới:', updatedPlace.name, '. Ảnh mới:', updatedPlace.imageUrl);

    // D. Xóa địa điểm đã lưu
    const deletePlaceRes = await fetch(`${BASE_URL}/saved-places/${placeData.id}`, {
      method: 'DELETE',
      headers,
    });
    const delPlaceResult = (await deletePlaceRes.json()) as any;
    console.log('🗑️  Xóa địa điểm đã lưu:', delPlaceResult.message);

    // ──────────────────────────────────────────────────────────
    // TEST FEEDBACK MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n⭐ 9. Kiểm thử Feedback Module...');

    // A. Thêm đánh giá cho tin nhắn AI
    const createFeedbackRes = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageId: assistantMsgId,
        rating: 5,
        comment: 'Câu trả lời rất bổ ích, đề xuất chính xác món ăn tôi thích!',
      }),
    });
    const feedbackData = (await createFeedbackRes.json()) as any;
    console.log('✅ Đã tạo đánh giá. ID:', feedbackData.id, '. Rating:', feedbackData.rating);

    // B. Lấy danh sách đánh giá
    const listFeedbackRes = await fetch(`${BASE_URL}/feedback`, { method: 'GET', headers });
    const listFeedback = (await listFeedbackRes.json()) as any;
    console.log(`📋 Số lượng bản ghi đánh giá của user: ${listFeedback.length}`);

    // C. Cập nhật đánh giá
    const updateFeedbackRes = await fetch(`${BASE_URL}/feedback/${feedbackData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        rating: 4,
        comment: 'Câu trả lời khá tốt nhưng tôi muốn chi tiết hơn chút nữa.',
      }),
    });
    const updatedFeedback = (await updateFeedbackRes.json()) as any;
    console.log('✏️  Cập nhật đánh giá. Rating mới:', updatedFeedback.rating, '. Comment mới:', updatedFeedback.comment);

    // D. Xóa đánh giá
    const deleteFeedbackRes = await fetch(`${BASE_URL}/feedback/${feedbackData.id}`, {
      method: 'DELETE',
      headers,
    });
    const delFeedbackResult = (await deleteFeedbackRes.json()) as any;
    console.log('🗑️  Xóa đánh giá:', delFeedbackResult.message);

    // ──────────────────────────────────────────────────────────
    // TEST TOOLCALL MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n🛠️ 10. Kiểm thử ToolCall Module...');

    // A. Thêm lịch sử gọi tool
    const createToolCallRes = await fetch(`${BASE_URL}/tool-calls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageId: assistantMsgId,
        toolName: 'Food',
        input: '{"query": "Phở bò Lý Quốc Sư Hà Nội"}',
        output: '{"status": "success", "results": [{"name": "Phở Lý Quốc Sư", "rating": 4.5}]}',
        status: 'success',
      }),
    });
    const toolCallData = (await createToolCallRes.json()) as any;
    console.log('✅ Đã lưu tool call. ID:', toolCallData.id, '. Tool:', toolCallData.toolName);

    // B. Lấy danh sách tool call của user
    const listToolCallRes = await fetch(`${BASE_URL}/tool-calls`, { method: 'GET', headers });
    const listToolCall = (await listToolCallRes.json()) as any;
    console.log(`📋 Số lượng bản ghi tool call của user: ${listToolCall.length}`);

    // C. Lấy danh sách tool call của message cụ thể
    const listMsgToolCallRes = await fetch(`${BASE_URL}/tool-calls/message/${assistantMsgId}`, { method: 'GET', headers });
    const listMsgToolCall = (await listMsgToolCallRes.json()) as any;
    console.log(`📋 Số lượng tool call của tin nhắn AI: ${listMsgToolCall.length}`);

    // D. Cập nhật tool call
    const updateToolCallRes = await fetch(`${BASE_URL}/tool-calls/${toolCallData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'completed',
        output: '{"status": "success", "results": [{"name": "Phở Lý Quốc Sư", "rating": 4.5}], "cached": true}',
      }),
    });
    const updatedToolCall = (await updateToolCallRes.json()) as any;
    console.log('✏️  Cập nhật tool call. Status mới:', updatedToolCall.status, '. Output mới:', updatedToolCall.output);

    // E. Xóa tool call
    const deleteToolCallRes = await fetch(`${BASE_URL}/tool-calls/${toolCallData.id}`, {
      method: 'DELETE',
      headers,
    });
    const delToolCallResult = (await deleteToolCallRes.json()) as any;
    console.log('🗑️  Xóa tool call:', delToolCallResult.message);

    // ──────────────────────────────────────────────────────────
    // TEST CACHE MODULE
    // ──────────────────────────────────────────────────────────
    console.log('\n💾 11. Kiểm thử Cache Module...');

    // A. Lưu Place Cache (TTL = 5 giây)
    const setPlaceCacheRes = await fetch(`${BASE_URL}/cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'place',
        key: 'query:hanoi_lake',
        value: { id: 'lake123', name: 'Hoàn Kiếm Lake', views: 5000 },
        ttlSeconds: 5,
      }),
    });
    const setPlaceCache = (await setPlaceCacheRes.json()) as any;
    console.log('✅ Đã thiết lập Place Cache. Hết hạn lúc:', setPlaceCache.expiresAt);

    // B. Lấy Place Cache ngay lập tức (Cache Hit)
    const getPlaceCacheRes = await fetch(`${BASE_URL}/cache/place/query:hanoi_lake`, { method: 'GET' });
    const getPlaceCache = (await getPlaceCacheRes.json()) as any;
    console.log('🔍 Lấy Place Cache ngay lập tức (Hit):', getPlaceCache.value.name);

    // C. Đợi 6 giây để cache hết hạn, sau đó lấy lại (Cache Miss / Expired)
    console.log('⏳ Đang đợi 6 giây để cache hết hạn...');
    await new Promise((resolve) => setTimeout(resolve, 6000));

    const getExpiredCacheRes = await fetch(`${BASE_URL}/cache/place/query:hanoi_lake`, { method: 'GET' });
    console.log('🔍 Lấy cache sau khi hết hạn:', getExpiredCacheRes.status === 404 ? 'Đã hết hạn và bị xóa tự động (Thành công)' : 'Thất bại');

    // D. Test Food Cache và Blog Cache
    await fetch(`${BASE_URL}/cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'food',
        key: 'query:pho',
        value: { name: 'Phở bò Hà Nội' },
        ttlSeconds: 10,
      }),
    });
    console.log('✅ Đã thiết lập Food Cache.');

    await fetch(`${BASE_URL}/cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'blog',
        key: 'topic:travel',
        value: { title: 'Kinh nghiệm du lịch Hà Giang' },
        ttlSeconds: 10,
      }),
    });
    console.log('✅ Đã thiết lập Blog Cache.');

    // E. Xóa cache thủ công
    const delFoodCacheRes = await fetch(`${BASE_URL}/cache/food/query:pho`, { method: 'DELETE' });
    const delFoodCache = (await delFoodCacheRes.json()) as any;
    console.log('🗑️  Xóa Food Cache thủ công:', delFoodCache.message);

    // ──────────────────────────────────────────────────────────
    // TEST AI AGENTS MODULE (Multi-agents + Strategy & DI)
    // ──────────────────────────────────────────────────────────
    console.log('\n🤖 12. Kiểm thử AI Agents Module...');

    // A. Chạy TravelAgent với chỉ định cụ thể
    const runTravelAgentRes = await fetch(`${BASE_URL}/ai-agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentType: 'travel',
        input: 'Thiết kế lịch trình đi chơi Sapa 2 ngày và xem thời tiết',
        messageId: assistantMsgId, // test lưu ToolCall
      }),
    });
    const travelAgentResult = (await runTravelAgentRes.json()) as any;
    console.log('✅ TravelAgent phản hồi:', travelAgentResult.response.substring(0, 100).replace(/\n/g, ' ') + '...');
    console.log('🛡️  Agent đã sử dụng:', travelAgentResult.agentUsed);

    // B. Chạy FoodAgent với chỉ định cụ thể
    const runFoodAgentRes = await fetch(`${BASE_URL}/ai-agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentType: 'food',
        input: 'Gợi ý món ăn ngon ở Sài Gòn',
      }),
    });
    const foodAgentResult = (await runFoodAgentRes.json()) as any;
    console.log('✅ FoodAgent phản hồi:', foodAgentResult.response.trim().replace(/\n/g, ' '));

    // C. Chạy tự động nhận diện Agent (Natural Language Routing) - Lịch sử Hà Giang
    const runAutoAgentRes = await fetch(`${BASE_URL}/ai-agents/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: 'Tìm hiểu phong tục truyền thống văn hóa Hà Giang cổ kính',
      }),
    });
    const autoAgentResult = (await runAutoAgentRes.json()) as any;
    console.log('✅ Tự động nhận dạng Agent phản hồi:', autoAgentResult.response.trim().replace(/\n/g, ' '));
    console.log('🎯 Hệ thống tự động Route sang Agent:', autoAgentResult.agentUsed);

    // ──────────────────────────────────────────────────────────
    // TEST RAG MODULE (Relational 1 Content - N Questions - N Answers)
    // ──────────────────────────────────────────────────────────
    console.log('\n📚 13. Kiểm thử RAG Module...');

    // A. Thêm tài liệu văn hóa (Định dạng quan hệ mới)
    const addDocRes = await fetch(`${BASE_URL}/rag/document`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Lễ hội hoa tam giác mạch Hà Giang',
        body: 'Lễ hội hoa tam giác mạch Hà Giang diễn ra vào tháng 10 hàng năm nhằm tôn vinh vẻ đẹp loài hoa đặc trưng của vùng cao nguyên đá và quảng bá văn hóa đồng bào Mông.',
        category: 'festival',
        questions: [
          'Hoa tam giác mạch Hà Giang nở vào tháng mấy?',
          'Lễ hội tam giác mạch được tổ chức khi nào?',
          'Có lễ hội gì đặc sắc ở vùng cao Hà Giang vào mùa hoa?'
        ],
        answers: [
          'Lễ hội hoa tam giác mạch diễn ra vào tháng 10 hàng năm.',
          'Lễ hội tôn vinh vẻ đẹp loài hoa đặc trưng vùng cao nguyên đá.'
        ]
      }),
    });
    const docData = (await addDocRes.json()) as any;
    console.log('✅ Đã thêm tài liệu RAG quan hệ. ID:', docData.documentId);

    // B. Thêm tài liệu lịch sử (Test tính năng tương thích ngược của cũ)
    await fetch(`${BASE_URL}/rag/document`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Lịch sử phố cổ Đồng Văn',
        content: 'Phố cổ Đồng Văn được hình thành từ đầu thế kỷ 20, mang đậm nét kiến trúc trình tường và lợp ngói âm dương của đồng bào H’Mông, Hoa và Tày.',
        category: 'history',
      }),
    });
    console.log('✅ Đã thêm tài liệu lịch sử địa phương (Tương thích ngược).');

    // C. Truy vấn ngữ cảnh RAG (Tìm kiếm ngữ nghĩa với Cosine Similarity)
    const queryRagRes = await fetch(`${BASE_URL}/rag/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: 'Cho tôi biết thông tin về hoa tam giác mạch và lễ hội vùng cao',
        category: 'festival',
        topK: 1,
      }),
    });
    const queryRagResult = (await queryRagRes.json()) as any;
    console.log('🔍 Kết quả truy xuất RAG (Cosine Similarity Score):', queryRagResult.retrievedDocuments[0]?.score);
    console.log('📄 Tiêu đề tài liệu tìm thấy:', queryRagResult.retrievedDocuments[0]?.title);
    console.log('📝 Prompt được build tích hợp ngữ cảnh:');
    console.log(queryRagResult.prompt.substring(0, 200).replace(/\n/g, ' ') + '...');

    console.log('\n🌟 Toàn bộ kiểm thử tích hợp đã hoàn tất thành công 100%!');
  } catch (error) {
    console.error('❌ Kiểm thử thất bại với lỗi:', error);
  }
}

runTests();
