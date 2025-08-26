/**
 * 修复版本：快手助推订单API调用脚本
 * 修复内容：
 * 1. 修正API地址（ad.kaishou.com → ad.e.kuaishou.com）
 * 2. 添加缺失的account-id请求头
 * 3. 优化CORS处理和错误处理机制
 * 4. 完善请求头匹配实际API调用格式
 */

/**
 * 工具函数：将毫秒级时间戳转为API要求的日期字符串（格式：yyyy-MM-dd HH:mm:ss）
 * @param {Number} timestamp - 毫秒级时间戳（如1738339200000）
 * @returns {String} 格式化后的日期字符串
 */
function formatTimestampToDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 修复版本：封装API请求函数
 * @param {Object} params - 请求参数
 * @param {String} accessToken - 认证Token
 * @param {String} accountId - 账号ID
 * @returns {Promise<Object>} API响应数据
 */
async function fetchKuaiShouSupplementOrderList(params, accessToken, accountId) {
  // 前置检查
  if (!accessToken || accessToken.trim() === '') {
    throw new Error('access token为空，请检查input中的accessToken配置');
  }
  if (!accountId) {
    throw new Error('account ID为空，请检查accountId配置');
  }

  // 修复：使用正确的API地址
  const apiUrl = 'https://ad.e.kuaishou.com/rest/openapi/v1/ad_social/supplement_order/list';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'accept-language': 'zh-CN,zh;q=0.9',
        'account-id': accountId, // 修复：添加缺失的account-id请求头
        'authorization': `Bearer ${accessToken}`,
        'content-type': 'application/json',
        // 添加浏览器标准请求头以避免CORS检测
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      referrer: 'https://k.kuaishou.com/',
      body: JSON.stringify(params),
      method: 'POST',
      mode: 'cors',
      credentials: 'include'
    });

    // 改进错误处理逻辑
    if (!response.ok) {
      let errorDetails = '无法获取错误详情';
      try {
        // 尝试获取错误响应内容
        const errorText = await response.text();
        errorDetails = errorText || `HTTP ${response.status} ${response.statusText}`;
      } catch (e) {
        errorDetails = `HTTP ${response.status} - ${e.message}`;
      }
      throw new Error(`API请求失败：${errorDetails}`);
    }

    const responseData = await response.json();
    
    // 验证响应数据结构
    if (!responseData.data) {
      throw new Error(`API响应格式异常：缺少data字段，响应：${JSON.stringify(responseData)}`);
    }
    
    if (!Array.isArray(responseData.data.items)) {
      // 如果items不存在，可能是空结果，创建空数组避免崩溃
      responseData.data.items = responseData.data.items || [];
    }
    
    return responseData;
  } catch (error) {
    // 增强错误信息，便于调试
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('网络请求失败，可能原因：');
      console.error('1. CORS跨域限制 - 请确保在 https://k.kuaishou.com 页面运行');
      console.error('2. 网络连接问题');
      console.error('3. API服务不可用');
      throw new Error(`网络请求失败：${error.message}（建议在快手广告后台页面运行此脚本）`);
    }
    
    console.error('API请求出错：', error.message);
    throw error;
  }
}

/**
 * 数据过滤函数：根据API实际返回字段调整
 * @param {Object} response - API完整响应
 * @returns {Array} 过滤后的订单列表
 */
function filterResponseData(response) {
  if (!response.data || !Array.isArray(response.data.items)) {
    console.warn('响应数据格式异常，返回空数组');
    return [];
  }
  
  return response.data.items.map(item => ({
    videoDetail: {
      supplementOrderId: item.supplement_order_id || '',
      orderId: item.order_id || '',
      missionId: item.mission_id || '',
      missionName: item.mission_name || '',
      starUserId: item.star_user_id || '',
      statusDesc: item.status_desc || '',
      promoteBeginTime: item.promote_begin_time || '',
      promoteEndTime: item.promote_end_time || '',
      targetTypeDesc: item.target_type_desc || '',
      coverUnitPriceAndRoi: item.cover_unit_price_and_roi || {},
      deepCoverUnitPriceAndRoi: item.deep_cover_unit_price_and_roi || {},
      freezeAmount: item.freeze_amount || 0,
      consumeAmount: item.consume_amount || 0,
      createTime: item.create_time || ''
    }
  }));
}

/**
 * 范围数据获取函数：自动分页+时间分片
 * @param {Number} startTime - 起始时间戳（毫秒）
 * @param {Number} endTime - 结束时间戳（毫秒）
 * @param {String} accountId - 聚星账号ID
 * @param {String} accessToken - 认证Token
 * @returns {Promise<Array>} 该时间范围内的所有订单数据
 */
async function fetchAllDataInRange(startTime, endTime, accountId, accessToken) {
  const pageSize = 500;
  const maxTotalPerRequest = 10000;
  let rangeData = [];

  const createStartTime = formatTimestampToDateTime(startTime);
  const createEndTime = formatTimestampToDateTime(endTime);

  const firstRequestParams = {
    advertiser_id: Number(accountId),
    social_account_id: Number(accountId),
    create_start_time: createStartTime,
    create_end_time: createEndTime,
    supplement_order_type: 1,
    page_num: 1,
    page_size: pageSize
  };

  try {
    // 修复：传递accountId参数
    const firstResponse = await fetchKuaiShouSupplementOrderList(firstRequestParams, accessToken, accountId);
    const total = firstResponse.data.total || 0;
    console.log(`时间范围[${createStartTime} ~ ${createEndTime}]：总订单数${total}条`);

    if (total === 0) {
      console.log('该时间范围内无订单数据');
      return [];
    }

    // 大数据量时间分片
    if (total > maxTotalPerRequest) {
      const midTime = Math.floor((startTime + endTime) / 2);
      console.log(`订单数超过${maxTotalPerRequest}条，拆分时间范围`);
      
      const [firstHalfData, secondHalfData] = await Promise.all([
        fetchAllDataInRange(startTime, midTime, accountId, accessToken),
        fetchAllDataInRange(midTime + 1, endTime, accountId, accessToken)
      ]);
      return [...firstHalfData, ...secondHalfData];
    }

    // 分页请求所有数据
    const firstPageData = filterResponseData(firstResponse);
    rangeData.push(...firstPageData);
    console.log(`第1页：获取${firstPageData.length}条，累计${rangeData.length}/${total}条`);

    const totalPages = Math.ceil(total / pageSize);
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
      const pageParams = { ...firstRequestParams, page_num: pageNum };
      // 修复：传递accountId参数
      const pageResponse = await fetchKuaiShouSupplementOrderList(pageParams, accessToken, accountId);
      const pageData = filterResponseData(pageResponse);
      
      rangeData.push(...pageData);
      console.log(`第${pageNum}页：获取${pageData.length}条，累计${rangeData.length}/${total}条`);

      // 请求间隔：避免限流
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return rangeData;
  } catch (error) {
    console.error(`时间范围[${createStartTime} ~ ${createEndTime}]获取失败：`, error.message);
    throw error;
  }
}

/**
 * 单时间段数据获取入口
 * @param {String} input - 配置JSON字符串
 * @param {String} accountId - 聚星账号ID
 * @returns {Promise<Array>} 该时间段的所有订单数据
 */
async function test(input, accountId) {
  try {
    const { startTime, endTime, accessToken } = JSON.parse(input);
    if (!startTime || !endTime) throw new Error('input缺少startTime或endTime');
    if (!accessToken) throw new Error('input缺少accessToken');

    console.log(`=== 开始获取时间段数据：${formatTimestampToDateTime(startTime)} ~ ${formatTimestampToDateTime(endTime)} ===`);
    const allData = await fetchAllDataInRange(startTime, endTime, accountId, accessToken);
    console.log(`=== 该时间段数据获取完成，共${allData.length}条 ===\n`);
    return allData;
  } catch (error) {
    console.error('单时间段数据获取失败：', error.message);
    throw error;
  }
}

/**
 * 多时间段批量请求入口
 * @param {Array} inputList - 多个input配置数组
 * @param {String} accountId - 聚星账号ID
 * @returns {Promise<Array>} 所有时间段的合并订单数据
 */
async function batchFetch(inputList, accountId) {
  if (!Array.isArray(inputList) || inputList.length === 0) {
    throw new Error('inputList必须是非空数组');
  }

  console.log(`=== 开始多时间段批量获取，共${inputList.length}个时间段 ===\n`);
  
  // 修改为串行请求，避免并发过多导致限流
  const allTimeRangeData = [];
  for (let i = 0; i < inputList.length; i++) {
    try {
      console.log(`处理第${i + 1}/${inputList.length}个时间段`);
      const data = await test(inputList[i], accountId);
      allTimeRangeData.push(data);
      
      // 时间段之间的间隔
      if (i < inputList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`第${i + 1}个时间段获取失败：`, error.message);
      allTimeRangeData.push([]); // 失败时推入空数组
    }
  }

  // 合并并去重
  const mergedData = allTimeRangeData.flat().filter((item, index, self) => 
    self.findIndex(i => i.videoDetail.supplementOrderId === item.videoDetail.supplementOrderId) === index
  );

  console.log(`=== 所有时间段数据获取完成 ===`);
  console.log(`- 成功请求时间段数：${allTimeRangeData.filter(data => data.length > 0).length}/${inputList.length}`);
  console.log(`- 合并后总订单数：${mergedData.length}条（已去重）`);
  return mergedData;
}

// ============================== 配置与执行 ==============================
// 基础配置
const accountId = '69407758';
const accessToken = 'ChFvYXV0aC5hY2Nlc3NUb2tlbhIwNnxB_SZ6CUN8bobwqKZCX7w8BhWXoyQUC6T1z5l8jsGyqJ7FXpFd1fHEQ__NBz2BGhIUJin3hnZBFYAERUiTeEwxp4IiINt0cAw6PewN-IiCjk1Qu2Tr8zq6kgd3srME-MAdKX-wKAUwAQ';

// 多时间段配置
const inputList = [
  '{"startTime": 1746115200000, "endTime": 1748707199999, "accessToken": "' + accessToken + '"}'
];

// 增加执行前的环境检查
console.log('=== 环境检查 ===');
console.log('当前页面URL:', window.location.href);
console.log('建议运行环境: https://k.kuaishou.com/');

if (!window.location.href.includes('kuaishou.com')) {
  console.warn('⚠️  警告：建议在快手相关页面运行此脚本以避免CORS问题');
}

// 执行批量获取
console.log('=== 开始执行 ===');
batchFetch(inputList, accountId)
  .then(mergedData => {
    console.log('=== 执行成功 ===');
    console.log(`总共获取到 ${mergedData.length} 条订单数据`);
    
    if (mergedData.length > 0) {
      // 导出JSON文件
      const blob = new Blob([JSON.stringify(mergedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `快手助推订单_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✅ 数据已导出为JSON文件');
    } else {
      console.log('⚠️  未获取到任何数据，请检查时间范围和Token有效性');
    }
  })
  .catch(error => {
    console.error('=== 执行失败 ===');
    console.error('错误详情：', error.message);
    console.error('问题排查：');
    console.error('1. 确认在 https://k.kuaishou.com 页面运行');
    console.error('2. 确认accessToken有效且未过期');
    console.error('3. 确认account ID正确');
    console.error('4. 检查网络连接和API可用性');
  });