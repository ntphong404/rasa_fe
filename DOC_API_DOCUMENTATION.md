# 📄 Doc API - Chi Tiết Tất Cả Endpoints

## 📋 Tổng Quan

Document Management API cho phép quản lý toàn bộ vòng đời tài liệu (PDF, Word, Excel, PowerPoint, v.v.):

- ✅ Upload tài liệu
- ✅ Lấy danh sách & chi tiết
- ✅ Cập nhật tài liệu
- ✅ Soft delete / Hard delete
- ✅ Restore tài liệu đã xóa

---

## 🔐 Authentication

Tất cả API endpoints yêu cầu **JWT Bearer Token**:

```
Header: Authorization: Bearer <JWT_TOKEN>
```

Lấy token bằng endpoint `/auth/login`

---

## 📚 Endpoints Chi Tiết

### **1️⃣ GET /documents (Lấy danh sách - Phân trang)**

#### **Request:**

```http
GET /api/v1/documents?page=1&limit=10&search=contract&sort=desc&tags=important&createdBy=userId&startDate=2024-01-01&endDate=2024-12-31&deleted=false
```

#### **Query Parameters:**

| Parameter   | Type     | Required | Mô tả                                        | Ví dụ                  |
| ----------- | -------- | -------- | -------------------------------------------- | ---------------------- |
| `page`      | number   | ❌       | Trang (default: 1)                           | `page=1`               |
| `limit`     | number   | ❌       | Items/page (default: 10)                     | `limit=20`             |
| `search`    | string   | ❌       | Tìm kiếm full-text (name, description, tags) | `search=contract`      |
| `sort`      | string   | ❌       | ASC/DESC (default: DESC)                     | `sort=asc`             |
| `deleted`   | boolean  | ❌       | Bao gồm deleted items                        | `deleted=true`         |
| `tags`      | string   | ❌       | Lọc theo tags (cách nhau bởi dấu phẩy)       | `tags=important,work`  |
| `createdBy` | ObjectId | ❌       | Lọc theo người tạo                           | `createdBy=userId`     |
| `updatedBy` | ObjectId | ❌       | Lọc theo người cập nhật                      | `updatedBy=userId`     |
| `startDate` | date     | ❌       | Từ ngày (ISO format)                         | `startDate=2024-01-01` |
| `endDate`   | date     | ❌       | Đến ngày (ISO format)                        | `endDate=2024-12-31`   |

#### **Response:**

```json
{
  "data": [
    {
      "_id": "671a1234567890abc",
      "name": "Employment Contract",
      "description": "2024 employment contract",
      "tags": ["important", "work"],
      "url": "http://103.101.163.198:9100/document/Sanitized_Filename_uuid.pdf",
      "fileType": ".pdf",
      "fileSize": 2048576,
      "isPublic": true,
      "createdBy": {
        "_id": "user_id",
        "email": "admin@example.com"
      },
      "updatedBy": {
        "_id": "user_id",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-02T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  },
  "message": "Get paginate documents success"
}
```

#### **HTTP Status:**

- `200 OK` - Thành công
- `400 Bad Request` - Tham số sai
- `401 Unauthorized` - Thiếu token
- `500 Internal Server Error` - Lỗi server

---

### **2️⃣ GET /documents/:id (Lấy chi tiết tài liệu)**

#### **Request:**

```http
GET /api/v1/documents/671a1234567890abc
```

#### **URL Parameters:**

| Parameter | Type     | Required | Mô tả       |
| --------- | -------- | -------- | ----------- |
| `id`      | ObjectId | ✅       | Document ID |

#### **Response:**

```json
{
  "data": {
    "_id": "671a1234567890abc",
    "name": "Employment Contract",
    "description": "2024 employment contract",
    "tags": ["important", "work"],
    "url": "https://minio.example.com/documents/file.pdf",
    "objectKey": "documents/671a1234567890abc.pdf",
    "fileType": ".pdf",
    "fileSize": 2048576,
    "isPublic": true,
    "createdBy": {
      "_id": "user_id",
      "email": "admin@example.com",
      "fullName": "Admin User"
    },
    "updatedBy": {
      "_id": "user_id",
      "email": "admin@example.com",
      "fullName": "Admin User"
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-02T10:00:00Z",
    "deletedAt": null,
    "deletedBy": null
  },
  "message": "Get document by id success"
}
```

#### **Error Responses:**

**404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Document not found",
  "data": null
}
```

---

### **3️⃣ POST /documents (Tạo tài liệu - Upload file)**

#### **Request (multipart/form-data):**

```http
POST /api/v1/documents
Content-Type: multipart/form-data
Authorization: Bearer <TOKEN>

name=Employment Contract
description=2024 employment contract
tags=important,work
isPublic=true
document=<binary>
```

#### **Body Parameters:**

| Parameter     | Type    | Required | Mô tả                                                     | Ví dụ                  |
| ------------- | ------- | -------- | --------------------------------------------------------- | ---------------------- |
| `name`        | string  | ✅       | Tên tài liệu                                              | `Employment Contract`  |
| `description` | string  | ❌       | Mô tả                                                     | `2024 contract`        |
| `tags`        | array   | ❌       | Gắn nhãn (JSON array hoặc string)                         | `["important","work"]` |
| `isPublic`    | boolean | ❌       | Công khai? (default: true)                                | `true`                 |
| `document`    | File    | ✅       | File upload (.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx) | `<file>`               |

#### **Accepted File Types:**

- `.pdf` - PDF documents
- `.doc`, `.docx` - Microsoft Word
- `.xls`, `.xlsx` - Microsoft Excel
- `.ppt`, `.pptx` - Microsoft PowerPoint

#### **Response:**

```json
{
  "data": {
    "_id": "671a5678901234def",
    "name": "Employment Contract",
    "description": "2024 employment contract",
    "tags": ["important", "work"],
    "url": "https://minio.example.com/documents/file.pdf",
    "objectKey": "documents/671a5678901234def.pdf",
    "fileType": ".pdf",
    "fileSize": 2048576,
    "isPublic": true,
    "createdBy": "user_id",
    "updatedBy": "user_id",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "message": "Create document success"
}
```

#### **Error Responses:**

**400 Bad Request (File Required):**

```json
{
  "statusCode": 400,
  "message": "File is required when creating document",
  "data": null
}
```

**415 Unsupported Media Type (Invalid File):**

```json
{
  "statusCode": 415,
  "message": "Invalid file type. Only pdf, doc, docx, xls, xlsx, ppt, pptx are allowed",
  "data": null
}
```

---

### **4️⃣ PUT /documents/:id (Cập nhật tài liệu)**

#### **Request (multipart/form-data):**

```http
PUT /api/v1/documents/671a5678901234def
Content-Type: multipart/form-data
Authorization: Bearer <TOKEN>

_id=671a5678901234def
name=Employment Contract Updated
description=Updated contract
tags=important,work,reviewed
isPublic=true
document=<binary> (optional)
```

#### **Body Parameters:**

| Parameter     | Type     | Required | Mô tả               |
| ------------- | -------- | -------- | ------------------- |
| `_id`         | ObjectId | ✅       | Document ID         |
| `name`        | string   | ❌       | Tên mới             |
| `description` | string   | ❌       | Mô tả mới           |
| `tags`        | array    | ❌       | Tags mới            |
| `isPublic`    | boolean  | ❌       | Công khai?          |
| `document`    | File     | ❌       | File mới (optional) |

#### **Response:**

```json
{
  "data": {
    "_id": "671a5678901234def",
    "name": "Employment Contract Updated",
    "description": "Updated contract",
    "tags": ["important", "work", "reviewed"],
    "url": "https://minio.example.com/documents/new-file.pdf",
    "objectKey": "documents/new-file.pdf",
    "fileType": ".pdf",
    "fileSize": 2150000,
    "isPublic": true,
    "createdBy": "user_id",
    "updatedBy": "user_id",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-16T15:30:00Z"
  },
  "message": "Update document success"
}
```

#### **Flow:**

1. Validate document exists
2. Nếu có file mới:
   - Validate file type
   - **Xóa file cũ** từ MinIO
   - **Upload file mới**
   - Update url & fileSize
3. Update metadata (name, description, tags, isPublic)
4. Clear cache

---

### **5️⃣ DELETE /documents/:id/soft (Xóa mềm - Mark as deleted)**

#### **Request:**

```http
DELETE /api/v1/documents/671a5678901234def/soft
Authorization: Bearer <TOKEN>
```

#### **Response:**

```json
{
  "data": {},
  "message": "Soft delete document success"
}
```

#### **Chi tiết:**

- ✅ Đánh dấu `deletedAt = now`
- ✅ Ghi `deletedBy = userId`
- ✅ **Giữ data** trong database
- ✅ File **vẫn ở MinIO**
- ✅ Có thể khôi phục sau

#### **Document sau soft delete:**

```json
{
  "_id": "671a5678901234def",
  "name": "Employment Contract",
  "deletedAt": "2024-01-20T10:00:00Z",
  "deletedBy": "user_id",
  ...
}
```

---

### **6️⃣ DELETE /documents/:id/hard (Xóa vĩnh viễn)**

#### **Request:**

```http
DELETE /api/v1/documents/671a5678901234def/hard
Authorization: Bearer <TOKEN>
```

#### **Response:**

```json
{
  "data": {},
  "message": "Hard delete document success"
}
```

#### **Chi tiết:**

- ✅ **Xóa hoàn toàn** khỏi MongoDB
- ✅ **Xóa file** từ MinIO (objectKey)
- ❌ **KHÔNG THỂ KHÔI PHỤC**
- ⚠️ Dữ liệu mất vĩnh viễn

#### **Error Response:**

**404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Document not found",
  "data": null
}
```

---

### **7️⃣ PATCH /documents/:id/restore (Khôi phục)**

#### **Request:**

```http
PATCH /api/v1/documents/671a5678901234def/restore
Authorization: Bearer <TOKEN>
```

#### **Response:**

```json
{
  "data": {
    "_id": "671a5678901234def",
    "name": "Employment Contract",
    "description": "2024 contract",
    "tags": ["important"],
    "url": "https://minio.example.com/documents/file.pdf",
    "fileType": ".pdf",
    "fileSize": 2048576,
    "isPublic": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "deletedAt": null,
    "deletedBy": null
  },
  "message": "Restore document success"
}
```

#### **Chi tiết:**

- ✅ Xóa `deletedAt` & `deletedBy`
- ✅ Document trở lại bình thường
- ✅ Có thể query bình thường
- ✅ Cache sẽ clear

---

## 🧪 Ví Dụ Thực Tế

### **Scenario 1: Upload tài liệu mới**

```bash
# 1. Tạo tài liệu
curl -X POST http://localhost:7777/api/v1/documents \
  -H "Authorization: Bearer <TOKEN>" \
  -F "name=My Contract" \
  -F "description=Sample contract" \
  -F "tags=important,work" \
  -F "isPublic=true" \
  -F "document=@contract.pdf"

# Response:
# {
#   "data": {
#     "_id": "671a5678901234def",
#     "name": "My Contract",
#     ...
#   }
# }
```

### **Scenario 2: Tìm kiếm tài liệu**

```bash
# Tìm tài liệu chứa "contract" được tạo trong tháng 1
curl -X GET "http://localhost:7777/api/v1/documents?search=contract&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <TOKEN>"
```

### **Scenario 3: Cập nhật & đổi file**

```bash
# Cập nhật tài liệu và thay file
curl -X PUT http://localhost:7777/api/v1/documents/671a5678901234def \
  -H "Authorization: Bearer <TOKEN>" \
  -F "_id=671a5678901234def" \
  -F "name=Updated Contract" \
  -F "description=New version" \
  -F "document=@updated-contract.pdf"
```

### **Scenario 4: Xóa mềm & khôi phục**

```bash
# Xóa mềm (còn có thể khôi phục)
curl -X DELETE http://localhost:7777/api/v1/documents/671a5678901234def/soft \
  -H "Authorization: Bearer <TOKEN>"

# Sau đó có thể khôi phục
curl -X PATCH http://localhost:7777/api/v1/documents/671a5678901234def/restore \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔄 Cache & Performance

### **Cache Configuration:**

- **TTL**: 30 giây
- **Keys**:
  - `DOC:PAGINATE:...` - Cached list queries
  - `DOC:BY_ID:{id}` - Cached single document
  - `DOC:ALL` - Prefix để clear tất cả cache

### **Cache Clear Events:**

- ✅ CREATE (POST) - Clear PAGINATE, ALL
- ✅ UPDATE (PUT) - Clear BY_ID, PAGINATE, ALL
- ✅ SOFT DELETE - Clear BY_ID, PAGINATE, ALL
- ✅ HARD DELETE - Clear BY_ID, PAGINATE, ALL
- ✅ RESTORE - Clear BY_ID, PAGINATE, ALL

---

## 📊 Data Model (IDoc Interface)

```typescript
interface IDoc {
  _id: ObjectId
  name: string // Tên tài liệu (required)
  description: string // Mô tả
  tags: string[] // Gắn nhãn
  url: string // Public URL từ MinIO (http://minio-host/document/filename_uuid.ext)
  objectKey: string // Key lưu ở MinIO (filename_uuid.ext)
  fileType: string // Đuôi file (.pdf, .docx, v.v.)
  fileSize: number // Kích thước (bytes)
  isPublic: boolean // Công khai? (default: true)
  createdBy: ObjectId // Người tạo
  updatedBy: ObjectId // Người cập nhật cuối
  createdAt: Date // Thời gian tạo
  updatedAt: Date // Thời gian cập nhật
  deletedAt: Date | null // Thời gian xóa mềm
  deletedBy: ObjectId | null // Người xóa
}
```

## 🌏 Vietnamese Filename Support

### **Filename Sanitization:**

Hệ thống tự động xử lý tên file tiếng Việt:

1. **Fix Encoding**: Convert Latin1 → UTF-8 (fix lỗi browser encoding)
2. **Vietnamese → ASCII**: "Ghi chú" → "Ghi_chu", "Nhúng" → "Nhung"
3. **Sanitize**: Spaces → underscore, special chars → underscore
4. **Final Format**: `Sanitized_Name_UUID.ext`

**Ví dụ:**

```
Original: "Báo cáo tài chính 2024.pdf"
Result:   "Bao_cao_tai_chinh_2024_a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6.pdf"
URL:      "http://103.101.163.198:9100/document/Bao_cao_tai_chinh_2024_a1b2c3d4...pdf"
```

### **Character Mapping:**

- à, á, ả, ã, ạ → a
- ă, ằ, ắ, ẳ, ẵ, ặ → a
- â, ầ, ấ, ẩ, ẫ, ậ → a
- è, é, ẻ, ẽ, ẹ → e
- ê, ề, ế, ể, ễ, ệ → e
- ì, í, ỉ, ĩ, ị → i
- ò, ó, ỏ, õ, ọ → o
- ô, ồ, ố, ổ, ỗ, ộ → o
- ơ, ờ, ớ, ở, ỡ, ợ → o
- ù, ú, ủ, ũ, ụ → u
- ư, ừ, ứ, ử, ữ, ự → u
- ỳ, ý, ỷ, ỹ, ỵ → y
- đ → d
- Uppercase: À, Á, Ă, Â... → A, Đ → D

---

## 🎯 Validation Rules

| Field         | Type     | Required  | Rules                                       | Error           |
| ------------- | -------- | --------- | ------------------------------------------- | --------------- |
| `name`        | string   | ✅        | 1-255 chars, trim                           | 400 Bad Request |
| `description` | string   | ❌        | Trim, allow empty                           | -               |
| `tags`        | string[] | ❌        | Trimmed strings                             | -               |
| `isPublic`    | boolean  | ❌        | true/false                                  | -               |
| `document`    | File     | ✅ (POST) | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx | 415 Unsupported |

---

## 🚀 HTTP Status Codes

| Code | Meaning                | Scenario                            |
| ---- | ---------------------- | ----------------------------------- |
| 200  | OK                     | GET, PUT, DELETE (soft/hard), PATCH |
| 201  | Created                | POST                                |
| 400  | Bad Request            | Invalid params, missing file        |
| 401  | Unauthorized           | Thiếu/sai token                     |
| 404  | Not Found              | Document không tồn tại              |
| 415  | Unsupported Media Type | File type không được phép           |
| 500  | Internal Server Error  | Lỗi server/MinIO                    |

---

## 💡 Best Practices

### **1. Naming & Searching**

```
✅ name="Employment Contract 2024"
✅ Tìm: search=contract (sẽ tìm trong name, description, tags)
```

### **2. Tags Management**

```
✅ tags=["important", "work", "2024"]
✅ Lọc: tags=important,work (find all với 1 trong 2 tags)
```

### **3. Soft vs Hard Delete**

```
✅ Soft Delete (/soft): Cho users xóa vô tình
❌ Hard Delete (/hard): Chỉ admins, full remove
```

### **4. Update Strategy**

```
✅ Cập nhật metadata: PUT không gồm file
✅ Đổi file: PUT gồm file mới (xóa cũ tự động)
```

---

## 🔗 Related Endpoints

- **Auth**: POST `/auth/login` - Lấy JWT token
- **User**: GET `/user/:id` - Info người tạo/cập nhật
- **Response**: GET `/my-response` - Liên quan chatbot responses
