# API Thống Kê (Statistics API)

## Tổng Quan

API thống kê cung cấp các endpoint để lấy dữ liệu thống kê chi tiết từ toàn bộ hệ thống. Các endpoint này hỗ trợ caching để cải thiện hiệu suất và trả về dữ liệu dưới dạng JSON.

## Base URL

```
/api/v1/statistic
```

---

## Các Endpoint

### 1. Thống Kê Toàn Bộ Hệ Thống

**GET** `/statistic/overall`

Lấy tổng số lượng các thành phần trong hệ thống.

**Query Parameters:** Không có

**Response Example:**

```json
{
  "status": true,
  "data": {
    "totalUsers": 150,
    "totalConversations": 2500,
    "totalChatbots": 5,
    "totalIntents": 45,
    "totalEntities": 30,
    "totalActions": 20,
    "totalStories": 15,
    "totalResponses": 100,
    "totalRoles": 3
  },
  "message": "Get overall statistics success"
}
```

**Cache:** 60 giây

---

### 2. Thống Kê Người Dùng

**GET** `/statistic/users`

Lấy thống kê chi tiết về người dùng (tổng số, trạng thái, phân bố theo giới tính, xu hướng).

**Query Parameters:** Không có

**Response Example:**

```json
{
  "status": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "bannedUsers": 10,
    "inactiveUsers": 20,
    "usersByGender": [
      {
        "_id": "male",
        "count": 85
      },
      {
        "_id": "female",
        "count": 65
      }
    ],
    "userCreationTrend": [
      {
        "_id": "2025-12-20",
        "count": 5
      },
      {
        "_id": "2025-12-21",
        "count": 8
      }
    ]
  },
  "message": "Get user statistics success"
}
```

**Cache:** 60 giây

---

### 3. Thống Kê Cuộc Trò Chuyện

**GET** `/statistic/conversations`

Lấy thống kê về cuộc trò chuyện, bao gồm xu hướng và người dùng hàng đầu.

**Query Parameters:**

- `startDate` (optional): Ngày bắt đầu (format: YYYY-MM-DD hoặc ISO 8601)
- `endDate` (optional): Ngày kết thúc (format: YYYY-MM-DD hoặc ISO 8601)

**Example Request:**

```
GET /statistic/conversations?startDate=2025-12-01&endDate=2025-12-26
```

**Response Example:**

```json
{
  "status": true,
  "data": {
    "totalConversations": 2500,
    "avgMessagesPerConversation": 12.5,
    "topUsers": [
      {
        "_id": "user_id_1",
        "count": 150,
        "messages": 1850,
        "user": [
          {
            "_id": "user_id_1",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com"
          }
        ]
      }
    ],
    "conversationTrend": [
      {
        "_id": "2025-12-20",
        "count": 50,
        "totalMessages": 625
      }
    ]
  },
  "message": "Get conversation statistics success"
}
```

**Cache:** 30 giây

---

### 4. Thống Kê Chatbot

**GET** `/statistic/chatbots`

Lấy thống kê về các chatbot trong hệ thống.

**Query Parameters:** Không có

**Response Example:**

```json
{
  "status": true,
  "data": {
    "totalChatbots": 5,
    "chatbots": [
      {
        "_id": "chatbot_1",
        "name": "Support Bot",
        "ip": "192.168.1.100",
        "rasaPort": 5005,
        "flaskPort": 5000,
        "roles": [
          {
            "_id": "role_1",
            "name": "SUPPORT"
          }
        ]
      }
    ]
  },
  "message": "Get chatbot statistics success"
}
```

**Cache:** 60 giây

---

### 5. Thống Kê NLP (Xử Lý Ngôn Ngữ Tự Nhiên)

**GET** `/statistic/nlp`

Lấy thống kê chi tiết về các thành phần NLP (Intent, Entity, Action, Story, Response).

**Query Parameters:** Không có

**Response Example:**

```json
{
  "status": true,
  "data": {
    "totalIntents": 45,
    "totalEntities": 30,
    "totalActions": 20,
    "totalStories": 15,
    "totalResponses": 100,
    "nlpComponents": {
      "intents": {
        "total": 45,
        "topIntents": [
          {
            "_id": "greet",
            "entities": [
              {
                "_id": "entity_1",
                "name": "person"
              }
            ]
          }
        ]
      },
      "entities": {
        "total": 30
      },
      "actions": {
        "total": 20
      },
      "stories": {
        "total": 15,
        "topStories": [
          {
            "_id": "welcome_story",
            "intentsCount": 3,
            "intents": [...]
          }
        ]
      },
      "responses": {
        "total": 100
      }
    }
  },
  "message": "Get NLP statistics success"
}
```

**Cache:** 60 giây

---

### 6. Thống Kê Tài Liệu

**GET** `/statistic/documents`

Lấy thống kê chi tiết về tài liệu trong hệ thống (theo loại file, kích thước, trạng thái công khai).

**Query Parameters:** Không có

**Response Example:**

```json
{
  "status": true,
  "data": {
    "totalDocs": 150,
    "docsByType": [
      {
        "_id": "pdf",
        "count": 80,
        "totalSize": 524288000
      },
      {
        "_id": "docx",
        "count": 45,
        "totalSize": 289406976
      },
      {
        "_id": "xlsx",
        "count": 25,
        "totalSize": 51380224
      }
    ],
    "fileSizeStats": {
      "smallFiles": 100,
      "mediumFiles": 40,
      "largeFiles": 10,
      "totalSize": 864075200
    },
    "accessStats": {
      "public": 120,
      "private": 30
    }
  },
  "message": "Get document statistics success"
}
```

**Chi tiết dữ liệu:**

- `totalDocs`: Tổng số tài liệu
- `docsByType`: Danh sách loại file và thống kê
- `fileSizeStats`:
  - `smallFiles`: File < 1MB
  - `mediumFiles`: File 1MB - 10MB
  - `largeFiles`: File >= 10MB
  - `totalSize`: Tổng kích thước (bytes)
- `accessStats`: Số lượng tài liệu công khai vs riêng tư

**Cache:** 60 giây

---

### 7. Thống Kê Toàn Bộ Hệ Thống (Comprehensive)

**GET** `/statistic/system`

Lấy tất cả thống kê trong một lệnh duy nhất.

**Query Parameters:** Không có

**Response Example:**

```json
{
  "status": true,
  "data": {
    "overall": {
      "totalUsers": 150,
      "totalConversations": 2500,
      ...
    },
    "users": {
      "totalUsers": 150,
      "activeUsers": 120,
      ...
    },
    "conversations": {
      "totalConversations": 2500,
      ...
    },
    "chatbots": {
      "totalChatbots": 5,
      ...
    },
    "nlp": {
      "totalIntents": 45,
      ...
    },
    "documents": {
      "totalDocs": 150,
      ...
    }
  },
  "message": "Get system statistics success"
}
```

**Cache:** 120 giây

---

## Xác Thực

Tất cả các endpoint (ngoại trừ `/overall`) yêu cầu xác thực. Gửi token JWT trong header:

```
Authorization: Bearer <your_jwt_token>
```

## Lỗi

### Lỗi Thường Gặp

**400 Bad Request** - Khi startDate hoặc endDate không hợp lệ:

```json
{
  "status": false,
  "statusCode": 400,
  "message": "Invalid date range"
}
```

**500 Internal Server Error** - Lỗi máy chủ:

```json
{
  "status": false,
  "statusCode": 500,
  "message": "Error calculating statistics"
}
```

---

## Caching

Các endpoint sử dụng Redis caching để cải thiện hiệu suất:

- Overall: 60 giây
- Users: 60 giây
- Conversations: 30 giây
- Chatbots: 60 giây
- NLP: 60 giây
- Documents: 60 giây
- System: 120 giây

Để xóa cache, bạn có thể tạo thêm endpoint DELETE hoặc sử dụng Redis CLI.

---

## Cách Sử Dụng

### Ví Dụ cURL

```bash
# Lấy thống kê toàn bộ
curl -X GET http://localhost:3000/api/v1/statistic/overall

# Lấy thống kê người dùng
curl -X GET http://localhost:3000/api/v1/statistic/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Lấy thống kê cuộc trò chuyện trong một khoảng thời gian
curl -X GET "http://localhost:3000/api/v1/statistic/conversations?startDate=2025-12-01&endDate=2025-12-26" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Lấy thống kê tài liệu
curl -X GET http://localhost:3000/api/v1/statistic/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ví Dụ JavaScript/Fetch

```javascript
// Lấy thống kê toàn bộ
fetch('http://localhost:3000/api/v1/statistic/overall')
  .then(response => response.json())
  .then(data => console.log(data))

// Lấy thống kê cuộc trò chuyện với filter ngày
const params = new URLSearchParams({
  startDate: '2025-12-01',
  endDate: '2025-12-26',
})

fetch(`http://localhost:3000/api/v1/statistic/conversations?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then(response => response.json())
  .then(data => console.log(data))

// Lấy thống kê tài liệu
fetch('http://localhost:3000/api/v1/statistic/documents', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then(response => response.json())
  .then(data => console.log(data))
```

---

## Ghi Chú

- Các endpoint không yêu cầu bất kỳ request body
- Tất cả các phản hồi sử dụng format JSON
- Các endpoint GET là safe và idempotent
- Date parameters hỗ trợ các format tiêu chuẩn (YYYY-MM-DD, ISO 8601)
