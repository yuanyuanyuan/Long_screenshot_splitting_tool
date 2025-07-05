# 長截圖分割工具

**一個強大的、純客戶端的網頁工具，用於智能地將長截圖分割成多個易於管理的片段。**  
**[體驗工具 »](https://yuanyuanyuan.github.io/Long_screenshot_splitting_tool/)**

---

[English](../readme.md) | [简体中文](./README.zh-CN.md) | 繁體中文

---

## 關於專案

**長截圖分割工具** 是一個純客戶端的網頁工具，旨在解決管理和分享過長截圖的普遍問題。無論是一段冗長的聊天記錄、一個長篇網頁，還是一篇詳細的文章，這個工具都能讓您上傳圖片，根據指定的高度將其分割成易於管理的片段，選擇最相關的部分，然後將它們匯出為ZIP壓縮包中的獨立圖片或一個整合的PDF文檔。

它速度快，安全（因為所有處理都在您的瀏覽器中完成，檔案不會上傳到任何伺服器），而且極其直觀。

### 技術棧

-   **HTML5, CSS3, JavaScript (ES6+)**
-   **Tailwind CSS**: 用於構建現代化的響應式介面。
-   **JSZip.js**: 用於在客戶端創建ZIP壓縮包。
-   **jsPDF.js**: 用於在瀏覽器中直接生成PDF文檔。
-   **FileSaver.js**: 用於在瀏覽器中下載檔案。

## 主要功能

✨ **純客戶端處理**: 無需上傳檔案。您的資料 100% 安全，保留在您的瀏覽器中。
🖼️ **自訂分割**: 您可以定義一個自訂的像素高度，將長截圖精確地切割成大小合適的片段。
🖱️ **互動式選擇**: 輕鬆選擇或取消選擇您想要保留的圖片片段。
📦 **多種匯出選項**: 將您選擇的片段下載為 `.zip` 壓縮包，或將它們編譯成一個 `.pdf` 檔案。
🌍 **多語言支援**: 完整的用戶介面支援英語、簡體中文和繁體中文。
🚀 **輕量且快速**: 無需後端依賴，確保了快速流暢的使用體驗。

## 如何開始

無需安裝！只需訪問我們的官方網站：

**[https://yuanyuanyuan.github.io/Long_screenshot_splitting_tool/](https://yuanyuanyuan.github.io/Long_screenshot_splitting_tool/)**

### 使用方法

1.  **訪問網站**: 開啟上面的連結。
2.  **上傳圖片**: 將您的長截圖拖放到上傳區域，或點擊選擇檔案。
3.  **設定分割高度**: 調整每個片段所需的高度。
4.  **處理**: 點擊"開始分割"按鈕。
5.  **選擇片段**: 勾選您希望匯出的片段。
6.  **下載**: 選擇將您的成果下載為 ZIP 或 PDF 檔案。

## 發展路線圖

-   [x] 核心分割與匯出邏輯 (ZIP/PDF)
-   [x] 多語言支援
-   [x] 現代化的響應式介面
-   [x] 為保護隱私而設的純客戶端處理
-   [ ] OCR文字識別，使圖片內容可搜尋
-   [ ] 為PDF匯出提供智能排版/佈局選項
-   [ ] 支援更多圖片格式

請查看開放的 issues 以獲取完整的功能建議（和已知問題）列表。

## 貢獻

開源社群因貢獻而成為一個學習、啟發和創造的絕佳場所。我們**非常感謝**您所做的任何貢獻。

如果您有任何能讓這個專案變得更好的建議，請 fork 本倉庫並創建一個 pull request。您也可以直接提交一個帶有 "enhancement" 標籤的 issue。

1.  Fork 本專案
2.  創建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的變更 (`git commit -m 'Add some AmazingFeature'`)
4.  將分支推送到遠端 (`git push origin feature/AmazingFeature`)
5.  開啟一個 Pull Request

## 授權條款

本專案採用 MIT 授權條款。

## 聯絡方式

Stark Yuan - [@StarkYuan_Pro](https://x.com/StarkYuan_Pro)

專案連結: [https://github.com/yuanyuanyuan/Long_screenshot_splitting_tool](https://github.com/yuanyuanyuan/Long_screenshot_splitting_tool)

---

Crafted with ❤️ by Stark Yuan 