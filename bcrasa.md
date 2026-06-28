# BÁO CÁO TIẾN ĐỘ PHÁT TRIỂN RASA CHATBOT

## **1. Cải thiện Quy trình Xác thực Email (Email Verification Flow)**

### Vấn đề

Sau khi đăng ký, nếu người dùng đóng browser mà chưa xác thực email, khi vào lại không thể quay lại trang xác thực được.

### Giải pháp thực hiện

- Thêm trạng thái `isPreAccess` và `preAccessType` vào auth store (Zustand) để lưu trữ thông tin tài khoản chưa xác thực
- Cập nhật logic Guard ở `AuthLayout` cho phép người dùng với trạng thái `isPreAccess: true` truy cập trang verify
- Lưu trữ state vào localStorage để duy trì khi reload page
- Hiển thị thông báo "✓ Xác thực email thành công" trên LoginPage sau khi verify xong
- Tự động pre-fill email trên LoginPage khi quay lại từ trang verify

### Kết quả

Người dùng có thể quay lại trang verify ngay cả sau khi đóng browser

### Files thay đổi

- `src/store/auth.ts`
- `src/hooks/useLogin.ts`
- `src/layouts/auth-layout.tsx`
- `src/features/auth/pages/LoginPage.tsx`
- `src/features/auth/pages/VerifyPage.tsx`

---

## **2. Tính năng Gửi lại Mã Xác thực (Resend OTP)**

### Vấn đề

Nút "Gửi lại mã xác thực" không hoạt động, mã OTP cũ vẫn còn hiệu lực

### Giải pháp thực hiện

- Triển khai API call thực tế đến `/api/v1/auth/resend-ve` gửi request resend OTP
- Tích hợp gọi API tự động khi người dùng vào trang VerifyPage từ màn hình login
- Thêm logic xóa trạng thái pre-access sau khi xác thực thành công
- Hiển thị thông báo phản hồi (success/error) cho người dùng
- Thêm endpoint `RESEND_VERIFY_EMAIL: "/api/v1/auth/resend-ve"` vào API endpoints

### Kết quả

- OTP mới được gửi tự động
- Mã cũ bị vô hiệu hóa
- Người dùng có trải nghiệm tốt hơn khi xác thực email

### Files thay đổi

- `src/api/endpoints.tsx`
- `src/features/auth/api/service.ts`
- `src/features/auth/pages/VerifyPage.tsx`
- `src/api/axios.ts` (debug logs)

---

## **3. Tính năng Import Dữ liệu Intent từ File YAML (Dual-File Support)**

### Vấn đề

Hệ thống chỉ hỗ trợ import từ Excel, không thể import từ file `.yml` có sẵn của Rasa. Thêm vào đó, cần hỗ trợ upload 2 file riêng biệt:

- File NLU chứa định nghĩa intent và ví dụ
- File Response chứa định nghĩa câu trả lời (utterances)

### Giải pháp thực hiện

#### 3.1 Parser YAML NLU

- Phát triển hàm `parseYAML()` để phân tích cú pháp Rasa NLU chuẩn:
  ```yaml
  version: "3.1"
  nlu:
    - intent: intent_name
      examples: |
        - example 1
        - example 2
  ```
- Xử lý indentation, skip empty lines và comments
- Auto-detect NLU section và intent blocks
- Output: `ParsedRow[]` chứa { intent, examples, responseContent (để mở rộng) }

#### 3.2 Parser YAML Response (NEW)

- Phát triển hàm `parseResponseYAML()` để phân tích file response:
  ```yaml
  version: "3.1"
  responses:
    utter_intent_name:
      - text: "Câu trả lời 1"
    utter_another_intent:
      - text: "Câu trả lời 2"
  ```
- Trích xuất response content theo pattern `utter_<intent_name>`
- Output: `ResponseMap` type ({ [key: string]: string })

#### 3.3 Merge NLU + Response Data

- Phát triển hàm `mergeNLUWithResponses()` kết hợp dữ liệu:
  - INPUT: `ParsedRow[]` từ file NLU, `ResponseMap` từ file Response
  - LOGIC: Match response via `utter_<intent_name>` pattern → gắn vào `responseContent` field
  - OUTPUT: `ParsedRow[]` hoàn chỉnh với both intent examples + response text
- Xử lý fallback nếu response không tìm được

#### 3.4 File Format Detection

- Tích hợp vào `parseFile()` để tự động nhận diện định dạng file:
  - `.xlsx`, `.xls` → Excel parser
  - `.yaml`, `.yml` → YAML parser (NLU hoặc Response)
  - `.csv`, `.tsv`, `.txt` → CSV parser
- Thêm hỗ trợ `.yaml`, `.yml` vào input file accept

#### 3.5 Template Generator

- Cung cấp file mẫu YAML để người dùng tham khảo:
  - NLU template: `nlu_template.yaml`
  - Response template: `response_template.yaml`
- Cải thiện hàm `generateTemplate()` hỗ trợ multiple format

#### 3.6 UI/UX Improvement - Dual File Upload

- **Mode Selection Tabs:**
  - "Nhập từ Excel" - Single file upload (Excel/CSV)
  - "Nhập từ YAML (2 files)" - Dual file upload for NLU + Domain
  - Tabs appear before file upload area, allow mode switching
- **Excel Mode:**
  - Drag-drop or click to select single .xlsx/.csv file
  - Auto-detect format and parse
  - Show preview table
- **YAML Mode (NEW - IMPLEMENTED):**
  - Two file input boxes stacked vertically:
    - File 1: "Chọn file NLU (.yaml)" - NLU intent definitions with examples
    - File 2: "Chọn file Domain/Response (.yaml)" - Response utterances definitions
  - File selection shows checkmark + filename when selected
  - "Xử lý 2 file và xem trước" button appears when both files selected
  - Auto-parse NLU → Response merge → Show merged preview with response content
- **Template Download Menu:**
  - Dropdown: "Tải file mẫu"
  - Options: Mẫu Excel, Mẫu YAML (for reference)
  - Guide text explains each format

### Kết quả

- ✅ Users can choose between Excel (simple) or YAML (dual-file) workflows
- ✅ Excel mode: Single file upload → parse → preview
- ✅ YAML mode: Two files (NLU + Domain) → merge → preview with responses
- ✅ Response content populated in preview from Domain file
- ✅ All 3 formats supported: Excel, YAML NLU, YAML Response

### Files thay đổi

- `src/features/data-entry/pages/ImportIntentPage.tsx` - **NEW**: importMode state, dual file YAML handlers, two-tab UI for mode selection
- `src/features/data-entry/utils/fileParser.ts` - Thêm `parseYAML()`, `parseResponseYAML()`, `mergeNLUWithResponses()`
- `src/features/data-entry/utils/templateGenerator.ts` - YAML template generators

---

## **4. Sửa lỗi Lấy Danh sách Chatbot (Chatbot Selector)**

### Vấn đề

Dropdown chatbot trên trang không login không hiển thị danh sách, selector không lấy được dữ liệu

### Giải pháp thực hiện

#### 4.1 Backend Changes

- Thêm field `botId` bắt buộc vào model Chatbot:
  - Schema: `botId` (String, Required, Unique)
  - Validator: Joi validation cho `botId`
  - Interface: `IChatbot`, `ICreateChatbot`
- Cập nhật `ChatbotService.getPublic()` trả về đầy đủ fields:
  - `_id`, `botId`, `name`, `ip`, `rasaPort`, `flaskUrl`
- Đảm bảo endpoint `/api/v1/chatbot/public/list` use middleware `authOptional` thay vì `auth`

#### 4.2 Frontend Hook

- Phát triển hook `useChatbots()` với fallback logic:
  - **Primary:** Gọi endpoint authenticated `/api/v1/chatbot` (cho user đã login)
  - **Fallback:** Gọi public endpoint `/api/v1/chatbot/public/list` (cho user chưa login)
- Xử lý Authorization header động từ localStorage
- Tự động select chatbot đầu tiên khi dữ liệu load xong
- Debug logs để dễ troubleshoot

#### 4.3 Component Integration

- Integrate `useChatbots()` vào `home_chat_without_login.tsx`
- Render dropdown với danh sách chatbot từ API
- Auto-select first chatbot on load

### Kết quả

Dropdown chatbot hiển thị đầy đủ danh sách, user có thể chọn chatbot để chat ngay trên trang không login

### Files thay đổi

- **Backend:**
  - `rasa_m_be/src/interfaces/models/chatbot.interface.ts`
  - `rasa_m_be/src/models/chatbot.model.ts`
  - `rasa_m_be/src/validators/chatbot.validator.ts`
  - `rasa_m_be/src/services/chatbot.service.ts`
- **Frontend:**
  - `src/hooks/useChatbots.ts`
  - `src/components/home_chat_without_login.tsx`
  - `src/features/chatbot/pages/CreateChatBotPage.tsx`
  - `src/features/chatbot/pages/EditChatBotPage.tsx`
  - `src/features/chatbot/api/dto/ChatBotResponse.ts`
  - `src/features/chatbot/api/dto/ChatBotRequests.ts`

---

## **5. Cải thiện Cấu trúc Dữ liệu Chatbot**

### Thêm Field `botId`

- **Định nghĩa:** String, Required, Unique
- **Ví dụ:** `pccc_namdinh`, `tuyen_sinh_kma`, `rasa-flask-api`
- **Mục đích:**
  - Tách biệt định danh (`botId`) từ tên hiển thị (`name`)
  - Giúp linh hoạt trong quản lý chatbot
  - Dùng cho selector/dropdown

### Validation

- Backend: Joi validation bắt buộc `botId`
- Frontend: Zod schema validation bắt buộc
- UI: Display `* (required)` marker

---

## **Tóm tắt Thay đổi**

| Tính năng               | Backend | Frontend | Status     |
| ----------------------- | ------- | -------- | ---------- |
| Email Verification Flow | ✅      | ✅       | Hoàn thành |
| Resend OTP              | ✅      | ✅       | Hoàn thành |
| Import YAML             | N/A     | ✅       | Hoàn thành |
| Chatbot Selector Fix    | ✅      | ✅       | Hoàn thành |
| Bot ID Field            | ✅      | ✅       | Hoàn thành |

---

## **Hiệu Quả Đạt Được**

### User Experience

- ✅ User không mất session khi reload page sau đăng ký
- ✅ OTP hoạt động đúng, mã cũ tự động vô hiệu hóa
- ✅ Có thể import data từ multiple format (Excel, YAML, CSV)
- ✅ Dropdown chatbot hiển thị đầy đủ ngay khi vào trang

### System Architecture

- ✅ Tách biệt `botId` và `name` cho chatbot entity
- ✅ Public endpoint `/api/v1/chatbot/public/list` hoạt động đúng
- ✅ Auth middleware xử lý correctly cho pre-access tokens
- ✅ Fallback logic cho chatbot fetching

### Code Quality

- ✅ Structured error handling
- ✅ Debug logs để troubleshoot
- ✅ TypeScript interfaces well-defined
- ✅ Validation ở cả backend và frontend

---

## **Ghi chú**

- Tất cả thay đổi đã test và hoạt động ổn định
- Cần restart server để load route changes (middleware updates)
- localStorage được dùng để persist pre-access state
