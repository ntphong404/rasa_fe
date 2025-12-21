# Hướng dẫn sử dụng Private-GPT API

## Thông tin chung

- **Base URL**: `http://116.118.48.169:8001`
- **Version**: 0.1.0
- **OpenAPI Spec**: `http://116.118.48.169:8001/openapi.json`

---

## 1. Chat Completions (Khuyến nghị sử dụng)

### Endpoint: POST `/v1/chat/completions`

Tạo response dựa trên danh sách các message trong cuộc hội thoại. Đây là API mạnh mẽ và linh hoạt nhất.

#### Request Body

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a rapper. Always answer with a rap."
    },
    {
      "role": "user",
      "content": "How do you fry an egg?"
    }
  ],
  "use_context": true,
  "include_sources": true,
  "stream": false,
  "context_filter": {
    "docs_ids": ["c202d5e6-7b69-4869-81cc-dd574ee8ee11"]
  }
}
```

#### Tham số quan trọng

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `messages` | array | **Bắt buộc**. Danh sách tin nhắn với `role` (`system`, `user`, `assistant`) và `content` |
| `use_context` | boolean | Sử dụng tài liệu đã ingest để tạo câu trả lời (mặc định: false) |
| `include_sources` | boolean | Trả về nguồn thông tin từ tài liệu (mặc định: false) |
| `stream` | boolean | Streaming response theo kiểu OpenAI (mặc định: false) |
| `context_filter` | object | Lọc tài liệu theo ID. Bỏ qua để dùng tất cả tài liệu |

#### Ví dụ cURL

```bash
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/chat/completions' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "messages": [
    {
      "role": "system",
      "content": "Bạn là trợ lý AI thông minh và hữu ích."
    },
    {
      "role": "user",
      "content": "Doanh số quý 3 năm 2023 như thế nào?"
    }
  ],
  "use_context": true,
  "include_sources": true,
  "stream": false
}'
```

#### Response (200 OK)

```json
{
  "id": "string",
  "object": "completion",
  "created": 1623340000,
  "model": "private-gpt",
  "choices": [
    {
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "Doanh số bán hàng outbound tăng 20%..."
      },
      "sources": [
        {
          "object": "context.chunk",
          "score": 0.023,
          "document": {
            "object": "ingest.document",
            "doc_id": "c202d5e6-7b69-4869-81cc-dd574ee8ee11",
            "doc_metadata": {
              "file_name": "Sales Report Q3 2023.pdf",
              "page_label": "2"
            }
          },
          "text": "Outbound sales increased 20%, driven by new leads.",
          "previous_texts": [
            "SALES REPORT 2023",
            "Inbound didn't show major changes."
          ],
          "next_texts": [
            "New leads came from Google Ads campaign.",
            "The campaign was run by the Marketing Department"
          ]
        }
      ],
      "index": 0
    }
  ]
}
```

#### Streaming Response

Khi `stream: true`, response sẽ được trả về theo chunks:

```json
{"id":"12345","object":"completion.chunk","created":1694268190,
"model":"private-gpt","choices":[{"index":0,"delta":{"content":"Hello"},
"finish_reason":null}]}
```

---

## 2. Chunks Retrieval (Tìm kiếm nhanh)

### Endpoint: POST `/v1/chunks`

Tìm kiếm các đoạn văn bản liên quan nhất từ tài liệu đã ingest. API này **rất nhanh** vì chỉ sử dụng Embeddings model, không cần LLM.

#### Request Body

```json
{
  "text": "Q3 2023 sales",
  "limit": 10,
  "prev_next_chunks": 2,
  "context_filter": {
    "docs_ids": ["c202d5e6-7b69-4869-81cc-dd574ee8ee11"]
  }
}
```

#### Tham số

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `text` | string | **Bắt buộc**. Văn bản cần tìm kiếm |
| `limit` | integer | Số lượng chunks tối đa trả về (mặc định: 10) |
| `prev_next_chunks` | integer | Số chunks trước/sau để lấy thêm ngữ cảnh |
| `context_filter` | object | Lọc tài liệu theo ID |

#### Ví dụ cURL

```bash
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/chunks' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "doanh số quý 3",
  "limit": 5,
  "prev_next_chunks": 1
}'
```

#### Response (200 OK)

```json
{
  "object": "list",
  "model": "private-gpt",
  "data": [
    {
      "object": "context.chunk",
      "score": 0.023,
      "document": {
        "object": "ingest.document",
        "doc_id": "c202d5e6-7b69-4869-81cc-dd574ee8ee11",
        "doc_metadata": {
          "file_name": "Sales Report Q3 2023.pdf",
          "page_label": "2"
        }
      },
      "text": "Outbound sales increased 20%, driven by new leads.",
      "previous_texts": [
        "SALES REPORT 2023",
        "Inbound didn't show major changes."
      ],
      "next_texts": [
        "New leads came from Google Ads campaign.",
        "The campaign was run by the Marketing Department"
      ]
    }
  ]
}
```

---

## 3. Ingestion (Quản lý tài liệu)

### 3.1. Ingest File

#### Endpoint: POST `/v1/ingest/file`

Upload và xử lý file tài liệu. Hỗ trợ nhiều định dạng (PDF, DOCX, TXT, v.v.). Một file có thể tạo ra nhiều Documents (ví dụ: PDF tạo 1 Document/trang).

#### Request

```bash
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/ingest/file' \
  -H 'accept: application/json' \
  -F 'file=@/path/to/your/document.pdf'
```

#### Response (200 OK)

```json
{
  "object": "list",
  "model": "private-gpt",
  "data": [
    {
      "object": "ingest.document",
      "doc_id": "c202d5e6-7b69-4869-81cc-dd574ee8ee11",
      "doc_metadata": {
        "file_name": "Sales Report Q3 2023.pdf",
        "page_label": "2"
      }
    }
  ]
}
```

### 3.2. Ingest Text

#### Endpoint: POST `/v1/ingest/text`

Ingest văn bản trực tiếp mà không cần file.

#### Request Body

```json
{
  "file_name": "Avatar: The Last Airbender",
  "text": "Avatar is set in an Asian and Arctic-inspired world in which some people can telekinetically manipulate one of the four elements—water, earth, fire or air—through practices known as 'bending', inspired by Chinese martial arts."
}
```

#### Ví dụ cURL

```bash
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/ingest/text' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "file_name": "My Notes",
  "text": "Nội dung văn bản cần lưu trữ và tìm kiếm..."
}'
```

#### Response (200 OK)

```json
{
  "object": "list",
  "model": "private-gpt",
  "data": [
    {
      "object": "ingest.document",
      "doc_id": "9ffd4f35-0327-4d3b-b799-6a4d8ede98b9",
      "doc_metadata": {
        "file_name": "Avatar: The Last Airbender"
      }
    }
  ]
}
```

### 3.3. List Ingested Documents

#### Endpoint: GET `/v1/ingest/list`

Liệt kê tất cả tài liệu đã được ingest, bao gồm Document ID và metadata.

#### Request

```bash
curl -X 'GET' \
  'http://116.118.48.169:8001/v1/ingest/list' \
  -H 'accept: application/json'
```

#### Response (200 OK)

```json
{
  "object": "list",
  "model": "private-gpt",
  "data": [
    {
      "object": "ingest.document",
      "doc_id": "684025a3-0963-4e00-8822-a712e4699358",
      "doc_metadata": {
        "file_name": "55.2024.QH15.docx"
      }
    },
    {
      "object": "ingest.document",
      "doc_id": "9ffd4f35-0327-4d3b-b799-6a4d8ede98b9",
      "doc_metadata": {
        "file_name": "Avatar: The Last Airbender"
      }
    }
  ]
}
```

### 3.4. Delete Ingested Document

#### Endpoint: DELETE `/v1/ingest/{doc_id}`

Xóa tài liệu đã ingest theo Document ID.

#### Request

```bash
curl -X 'DELETE' \
  'http://116.118.48.169:8001/v1/ingest/684025a3-0963-4e00-8822-a712e4699358' \
  -H 'accept: application/json'
```

#### Response (200 OK)

```json
null
```

---

## 4. Summarize (Tóm tắt)

### Endpoint: POST `/v1/summarize`

Tóm tắt văn bản với khả năng sử dụng context từ tài liệu đã ingest.

#### Request Body

```json
{
  "text": "Văn bản dài cần tóm tắt...",
  "use_context": false,
  "context_filter": {
    "docs_ids": ["c202d5e6-7b69-4869-81cc-dd574ee8ee11"]
  },
  "prompt": "Custom prompt for summarization",
  "instructions": "Tóm tắt ngắn gọn trong 3 câu",
  "stream": false
}
```

#### Tham số

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `text` | string | **Bắt buộc**. Văn bản cần tóm tắt |
| `use_context` | boolean | Sử dụng tài liệu đã ingest (mặc định: false) |
| `context_filter` | object | Lọc tài liệu theo ID |
| `prompt` | string | Custom prompt (nếu không có sẽ dùng prompt mặc định) |
| `instructions` | string | Hướng dẫn cách tóm tắt |
| `stream` | boolean | Streaming response |

#### Ví dụ cURL

```bash
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/summarize' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "Văn bản dài cần tóm tắt...",
  "instructions": "Tóm tắt thành 3 điểm chính",
  "stream": false
}'
```

#### Response (200 OK)

```json
{
  "summary": "Bản tóm tắt của văn bản..."
}
```

---

## 5. Embeddings Generation

### Endpoint: POST `/v1/embeddings`

Tạo vector representation của văn bản, phục vụ cho machine learning và semantic search.

#### Request Body

```json
{
  "input": "Text to embed"
}
```

#### Ví dụ cURL

```bash
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/embeddings' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "input": "Văn bản cần tạo embedding"
}'
```

#### Response (200 OK)

```json
{
  "object": "list",
  "model": "private-gpt",
  "data": [
    {
      "index": 0,
      "object": "embedding",
      "embedding": [
        0.0023064255,
        -0.009327292,
        0.0012345678
      ]
    }
  ]
}
```

---

## 6. Health Check

### Endpoint: GET `/health`

Kiểm tra trạng thái hoạt động của API server.

#### Request

```bash
curl -X 'GET' \
  'http://116.118.48.169:8001/health' \
  -H 'accept: application/json'
```

#### Response (200 OK)

```json
{
  "status": "ok"
}
```

---

## Các luồng làm việc thực tế

### Workflow 1: Chat đơn giản (không dùng tài liệu)

```bash
# Gọi trực tiếp Chat Completions
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -d '{
  "messages": [
    {"role": "user", "content": "Giải thích về trí tuệ nhân tạo"}
  ],
  "use_context": false
}'
```

### Workflow 2: RAG - Chat với tài liệu riêng

```bash
# Bước 1: Upload tài liệu
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/ingest/file' \
  -F 'file=@company_report.pdf'

# Response: {"data": [{"doc_id": "abc-123", ...}]}

# Bước 2: Kiểm tra danh sách tài liệu
curl -X 'GET' \
  'http://116.118.48.169:8001/v1/ingest/list'

# Bước 3: Chat với context từ tài liệu
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -d '{
  "messages": [
    {"role": "user", "content": "Doanh thu quý 3 như thế nào?"}
  ],
  "use_context": true,
  "include_sources": true,
  "context_filter": {
    "docs_ids": ["abc-123"]
  }
}'
```

### Workflow 3: Tìm kiếm nhanh trong tài liệu

```bash
# Tìm kiếm chunks liên quan (không cần LLM - cực nhanh)
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/chunks' \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "doanh thu quý 3",
  "limit": 5,
  "prev_next_chunks": 2
}'
```

### Workflow 4: Hệ thống Q&A với nhiều tài liệu

```bash
# Bước 1: Upload nhiều tài liệu
curl -X 'POST' 'http://116.118.48.169:8001/v1/ingest/file' -F 'file=@doc1.pdf'
curl -X 'POST' 'http://116.118.48.169:8001/v1/ingest/file' -F 'file=@doc2.pdf'
curl -X 'POST' 'http://116.118.48.169:8001/v1/ingest/text' \
  -d '{"file_name": "notes.txt", "text": "Important notes..."}'

# Bước 2: Chat với TẤT CẢ tài liệu (không dùng context_filter)
curl -X 'POST' \
  'http://116.118.48.169:8001/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -d '{
  "messages": [
    {"role": "user", "content": "Tổng hợp thông tin từ tất cả báo cáo"}
  ],
  "use_context": true,
  "include_sources": true
}'
```

---

## Error Handling

### HTTP Status Codes

| Code | Mô tả |
|------|-------|
| **200** | Thành công |
| **422** | Validation Error - Kiểm tra request body |
| **500** | Internal Server Error |
| **502** | Bad Gateway - Service không khả dụng |
| **504** | Gateway Timeout - Request quá lâu |

### Validation Error (422)

```json
{
  "detail": [
    {
      "loc": ["body", "messages"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Best Practices

### 1. Quản lý tài liệu hiệu quả

- **Kiểm tra trước khi upload**: Dùng `/v1/ingest/list` để xem tài liệu đã tồn tại chưa
- **Xóa tài liệu cũ**: Định kỳ xóa tài liệu không cần thiết để tối ưu performance
- **Đặt tên file rõ ràng**: Metadata `file_name` giúp dễ quản lý

### 2. Tối ưu context

- **Lọc tài liệu cụ thể**: Dùng `context_filter.docs_ids` thay vì dùng tất cả tài liệu
- **Kiểm tra sources**: Luôn bật `include_sources: true` để verify thông tin
- **Chunk size**: Dùng `prev_next_chunks` để lấy thêm ngữ cảnh khi cần

### 3. Performance

- **Dùng `/chunks` cho search**: Nhanh hơn nhiều so với `/chat/completions`
- **Streaming cho UI**: Bật `stream: true` cho trải nghiệm real-time
- **Cache doc_ids**: Lưu document IDs để tránh gọi `/ingest/list` liên tục

### 4. Prompt Engineering

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Bạn là chuyên gia phân tích tài chính. Luôn trích dẫn số liệu cụ thể từ báo cáo."
    },
    {
      "role": "user",
      "content": "Phân tích xu hướng doanh thu 3 quý gần nhất"
    }
  ],
  "use_context": true,
  "include_sources": true
}
```

---

## Code Examples

### Python

```python
import requests
import json

BASE_URL = "http://116.118.48.169:8001"

class PrivateGPTClient:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
        self.headers = {
            "accept": "application/json",
            "Content-Type": "application/json"
        }
    
    def ingest_file(self, file_path):
        """Upload file và trả về document IDs"""
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(
                f"{self.base_url}/v1/ingest/file",
                files=files
            )
        return response.json()
    
    def ingest_text(self, file_name, text):
        """Ingest văn bản trực tiếp"""
        payload = {
            "file_name": file_name,
            "text": text
        }
        response = requests.post(
            f"{self.base_url}/v1/ingest/text",
            headers=self.headers,
            data=json.dumps(payload)
        )
        return response.json()
    
    def list_documents(self):
        """Liệt kê tất cả tài liệu"""
        response = requests.get(
            f"{self.base_url}/v1/ingest/list",
            headers=self.headers
        )
        return response.json()
    
    def delete_document(self, doc_id):
        """Xóa tài liệu theo ID"""
        response = requests.delete(
            f"{self.base_url}/v1/ingest/{doc_id}",
            headers=self.headers
        )
        return response.json()
    
    def chat(self, messages, use_context=True, include_sources=True, 
             doc_ids=None, stream=False):
        """Chat với hoặc không có context"""
        payload = {
            "messages": messages,
            "use_context": use_context,
            "include_sources": include_sources,
            "stream": stream
        }
        
        if doc_ids:
            payload["context_filter"] = {"docs_ids": doc_ids}
        
        response = requests.post(
            f"{self.base_url}/v1/chat/completions",
            headers=self.headers,
            data=json.dumps(payload)
        )
        return response.json()
    
    def search_chunks(self, text, limit=10, prev_next_chunks=2, doc_ids=None):
        """Tìm kiếm chunks liên quan"""
        payload = {
            "text": text,
            "limit": limit,
            "prev_next_chunks": prev_next_chunks
        }
        
        if doc_ids:
            payload["context_filter"] = {"docs_ids": doc_ids}
        
        response = requests.post(
            f"{self.base_url}/v1/chunks",
            headers=self.headers,
            data=json.dumps(payload)
        )
        return response.json()
    
    def summarize(self, text, instructions=None, use_context=False):
        """Tóm tắt văn bản"""
        payload = {
            "text": text,
            "use_context": use_context,
            "stream": False
        }
        
        if instructions:
            payload["instructions"] = instructions
        
        response = requests.post(
            f"{self.base_url}/v1/summarize",
            headers=self.headers,
            data=json.dumps(payload)
        )
        return response.json()
    
    def get_embeddings(self, text):
        """Lấy embeddings của văn bản"""
        payload = {"input": text}
        response = requests.post(
            f"{self.base_url}/v1/embeddings",
            headers=self.headers,
            data=json.dumps(payload)
        )
        return response.json()
    
    def health_check(self):
        """Kiểm tra health"""
        response = requests.get(f"{self.base_url}/health")
        return response.json()

# Sử dụng
client = PrivateGPTClient()

# 1. Upload tài liệu
result = client.ingest_file("report.pdf")
doc_id = result["data"][0]["doc_id"]
print(f"Uploaded document ID: {doc_id}")

# 2. Chat với tài liệu
messages = [
    {"role": "system", "content": "Bạn là chuyên gia phân tích dữ liệu"},
    {"role": "user", "content": "Phân tích doanh thu quý 3"}
]
response = client.chat(messages, use_context=True, doc_ids=[doc_id])
print(f"Answer: {response['choices'][0]['message']['content']}")

# 3. Xem sources
if response['choices'][0].get('sources'):
    for source in response['choices'][0]['sources']:
        print(f"Source: {source['document']['doc_metadata']['file_name']}")
        print(f"Text: {source['text']}")

# 4. Tìm kiếm nhanh
chunks = client.search_chunks("doanh thu", limit=5, doc_ids=[doc_id])
for chunk in chunks['data']:
    print(f"Score: {chunk['score']}, Text: {chunk['text']}")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

class PrivateGPTClient {
  constructor(baseURL = 'http://116.118.48.169:8001') {
    this.baseURL = baseURL;
    this.headers = {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  async ingestText(fileName, text) {
    const response = await axios.post(
      `${this.baseURL}/v1/ingest/text`,
      { file_name: fileName, text: text },
      { headers: this.headers }
    );
    return response.data;
  }

  async listDocuments() {
    const response = await axios.get(
      `${this.baseURL}/v1/ingest/list`,
      { headers: this.headers }
    );
    return response.data;
  }

  async chat(messages, useContext = true, includeSources = true, docIds = null) {
    const payload = {
      messages,
      use_context: useContext,
      include_sources: includeSources,
      stream: false
    };

    if (docIds) {
      payload.context_filter = { docs_ids: docIds };
    }

    const response = await axios.post(
      `${this.baseURL}/v1/chat/completions`,
      payload,
      { headers: this.headers }
    );
    return response.data;
  }

  async searchChunks(text, limit = 10, docIds = null) {
    const payload = { text, limit };
    
    if (docIds) {
      payload.context_filter = { docs_ids: docIds };
    }

    const response = await axios.post(
      `${this.baseURL}/v1/chunks`,
      payload,
      { headers: this.headers }
    );
    return response.data;
  }
}

// Sử dụng
(async () => {
  const client = new PrivateGPTClient();

  // Upload text
  const result = await client.ingestText('notes.txt', 'Nội dung quan trọng...');
  const docId = result.data[0].doc_id;
  console.log(`Doc ID: ${docId}`);

  // Chat
  const messages = [
    { role: 'user', content: 'Tóm tắt nội dung' }
  ];
  const response = await client.chat(messages, true, true, [docId]);
  console.log(response.choices[0].message.content);
})();
```

---

## Troubleshooting

### Vấn đề thường gặp

**1. 502 Bad Gateway khi gọi `/v1/embeddings`**
- **Nguyên nhân**: Service embeddings chưa khởi động hoặc đang quá tải
- **Giải pháp**: Đợi vài giây và thử lại, hoặc liên hệ admin

**2. 504 Gateway Timeout khi `/v1/summarize`**
- **Nguyên nhân**: Văn bản quá dài hoặc LLM đang xử lý chậm
- **Giải pháp**: Chia nhỏ văn bản hoặc tăng timeout

**3. Chat không trả về sources**
- **Nguyên nhân**: Thiếu `include_sources: true` hoặc `use_context: false`
- **Giải pháp**: Đảm bảo cả 2 tham số đều `true`

**4. Không tìm thấy document**
- **Nguyên nhân**: Document chưa được ingest hoặc doc_id sai
- **Giải pháp**: Gọi `/v1/ingest/list` để verify doc_id

**5. Response không có thông tin từ tài liệu**
- **Nguyên nhân**: `context_filter` quá hạn chế hoặc tài liệu không liên quan
- **Giải pháp**: Bỏ `context_filter` để dùng t