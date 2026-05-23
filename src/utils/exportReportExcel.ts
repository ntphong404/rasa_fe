import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type {
  OverallStatistics,
  UserStatistics,
  ConversationStatistics,
  ChatbotStatistics,
  NLPStatistics,
  DocumentStatistics,
  ResponseFeedbackStatistics,
} from '@/interfaces/statistic.interface'

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  headerBg: '1E3A5F',   // dark navy
  headerFg: 'FFFFFF',
  titleBg:  '2E6DA4',   // mid blue
  titleFg:  'FFFFFF',
  rowAlt:   'EBF3FB',   // light blue tint
  rowWhite: 'FFFFFF',
  border:   'B0C4DE',
  total:    'D9E8F5',   // summary row
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function styleHeader(row: ExcelJS.Row, bgColor: string = C.headerBg) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    cell.font = { bold: true, color: { argb: C.headerFg }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: C.border } },
      bottom: { style: 'thin', color: { argb: C.border } },
      left: { style: 'thin', color: { argb: C.border } },
      right: { style: 'thin', color: { argb: C.border } },
    }
  })
  row.height = 28
}

function styleTitle(row: ExcelJS.Row, colCount: number) {
  row.getCell(1).value = row.getCell(1).value
  row.height = 36
  row.getCell(1).font = { bold: true, size: 14, color: { argb: C.titleFg } }
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.titleBg } }
  row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
}

function styleDataRow(row: ExcelJS.Row, isAlt: boolean) {
  const bg = isAlt ? C.rowAlt : C.rowWhite
  row.height = 20
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cell.alignment = { vertical: 'middle', wrapText: false }
    cell.border = {
      top: { style: 'hair', color: { argb: C.border } },
      bottom: { style: 'hair', color: { argb: C.border } },
      left: { style: 'hair', color: { argb: C.border } },
      right: { style: 'hair', color: { argb: C.border } },
    }
  })
}

function styleTotalRow(row: ExcelJS.Row) {
  row.height = 22
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.total } }
    cell.font = { bold: true }
    cell.alignment = { vertical: 'middle' }
    cell.border = {
      top: { style: 'medium', color: { argb: C.headerBg } },
      bottom: { style: 'thin', color: { argb: C.border } },
      left: { style: 'hair', color: { argb: C.border } },
      right: { style: 'hair', color: { argb: C.border } },
    }
  })
}

function autoFitColumns(sheet: ExcelJS.Worksheet, minWidth = 10, maxWidth = 60) {
  sheet.columns.forEach((col) => {
    let max = minWidth
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value != null ? String(cell.value).length : 0
      if (len > max) max = len
    })
    col.width = Math.min(max + 4, maxWidth)
  })
}

function addTitleRow(sheet: ExcelJS.Worksheet, title: string, colCount: number) {
  sheet.mergeCells(1, 1, 1, colCount)
  const row = sheet.getRow(1)
  row.getCell(1).value = title
  styleTitle(row, colCount)
  return row
}

// ── Sheet builders ────────────────────────────────────────────────────────────

export function buildOverallSheet(wb: ExcelJS.Workbook, data: OverallStatistics) {
  const sheet = wb.addWorksheet('Tổng quan hệ thống')
  addTitleRow(sheet, 'THỐNG KÊ TỔNG QUAN HỆ THỐNG', 2)

  const headers = sheet.addRow(['Chỉ số', 'Giá trị'])
  styleHeader(headers)

  const rows: [string, number][] = [
    ['Tổng số người dùng', data.totalUsers],
    ['Tổng số hội thoại', data.totalConversations],
    ['Tổng số chatbot', data.totalChatbots],
    ['Tổng số intent', data.totalIntents],
    ['Tổng số entity', data.totalEntities],
    ['Tổng số action', data.totalActions],
    ['Tổng số story', data.totalStories],
    ['Tổng số response', data.totalResponses],
    ['Tổng số vai trò', data.totalRoles],
  ]
  rows.forEach(([label, val], i) => {
    const r = sheet.addRow([label, val])
    styleDataRow(r, i % 2 === 0)
    r.getCell(1).font = { ...r.getCell(1).font, bold: true }
    r.getCell(2).numFmt = '#,##0'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
  })
  autoFitColumns(sheet)
}

export function buildUserSheet(wb: ExcelJS.Workbook, data: UserStatistics) {
  const sheet = wb.addWorksheet('Người dùng')
  addTitleRow(sheet, 'THỐNG KÊ NGƯỜI DÙNG', 2)

  // Summary block
  const sh = sheet.addRow(['Trạng thái', 'Số lượng'])
  styleHeader(sh)
  const summary: [string, number][] = [
    ['Tổng số người dùng', data.totalUsers],
    ['Người dùng hoạt động', data.activeUsers],
    ['Người dùng bị khóa', data.bannedUsers],
    ['Chưa kích hoạt', data.inactiveUsers],
  ]
  summary.forEach(([l, v], i) => {
    const r = sheet.addRow([l, v])
    styleDataRow(r, i % 2 === 0)
    r.getCell(2).numFmt = '#,##0'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
  })

  sheet.addRow([])

  // Gender block
  const gh = sheet.addRow(['Giới tính', 'Số lượng'])
  styleHeader(gh)
  data.usersByGender.forEach((g, i) => {
    const r = sheet.addRow([g._id || 'Không xác định', g.count])
    styleDataRow(r, i % 2 === 0)
    r.getCell(2).numFmt = '#,##0'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
  })

  sheet.addRow([])

  // Trend block
  const th = sheet.addRow(['Ngày', 'Người dùng mới'])
  styleHeader(th)
  data.userCreationTrend.forEach((t, i) => {
    const r = sheet.addRow([t._id, t.count])
    styleDataRow(r, i % 2 === 0)
    r.getCell(2).numFmt = '#,##0'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
  })
  autoFitColumns(sheet)
}

export function buildConversationSheet(wb: ExcelJS.Workbook, data: ConversationStatistics) {
  const sheet = wb.addWorksheet('Hội thoại')
  addTitleRow(sheet, 'THỐNG KÊ HỘI THOẠI', 3)

  // Summary
  const sh = sheet.addRow(['Chỉ số', 'Giá trị', ''])
  styleHeader(sh)
  ;[
    ['Tổng số hội thoại', data.totalConversations],
    ['Trung bình tin nhắn/hội thoại', +data.avgMessagesPerConversation.toFixed(2)],
  ].forEach(([l, v], i) => {
    const r = sheet.addRow([l, v, ''])
    styleDataRow(r, i % 2 === 0)
    r.getCell(2).numFmt = '#,##0.##'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(1).font = { bold: true }
  })

  sheet.addRow([])

  // Trend
  const th = sheet.addRow(['Ngày', 'Số hội thoại', 'Tổng tin nhắn'])
  styleHeader(th)
  let totalC = 0, totalM = 0
  data.conversationTrend.forEach((t, i) => {
    totalC += t.count; totalM += t.totalMessages
    const r = sheet.addRow([t._id, t.count, t.totalMessages])
    styleDataRow(r, i % 2 === 0)
    r.getCell(2).numFmt = '#,##0'
    r.getCell(3).numFmt = '#,##0'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }
  })
  const tot = sheet.addRow(['TỔNG', totalC, totalM])
  styleTotalRow(tot)
  tot.getCell(2).numFmt = '#,##0'
  tot.getCell(3).numFmt = '#,##0'
  tot.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
  tot.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }

  sheet.addRow([])

  // Top users
  const uh = sheet.addRow(['#', 'Email', 'Họ tên', 'Số hội thoại', 'Tổng tin nhắn'])
  styleHeader(uh)
  data.topUsers.forEach((u, i) => {
    const info = u.user?.[0]
    const r = sheet.addRow([
      i + 1,
      info?.email || u._id,
      info ? `${info.firstName} ${info.lastName}`.trim() : '',
      u.count,
      u.messages,
    ])
    styleDataRow(r, i % 2 === 0)
    r.getCell(4).numFmt = '#,##0'
    r.getCell(5).numFmt = '#,##0'
    r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' }
  })
  autoFitColumns(sheet)
}

export function buildChatbotSheet(wb: ExcelJS.Workbook, data: ChatbotStatistics) {
  const sheet = wb.addWorksheet('Chatbot')
  addTitleRow(sheet, 'THỐNG KÊ CHATBOT', 6)

  const h = sheet.addRow(['#', 'Tên Chatbot', 'IP', 'Rasa Port', 'Flask Port', 'Vai trò'])
  styleHeader(h)
  data.chatbots.forEach((bot, i) => {
    const roles = bot.roles?.map((r: any) => r.name || r).join(', ') || ''
    const r = sheet.addRow([i + 1, bot.name, bot.ip, bot.rasaPort, bot.flaskPort, roles])
    styleDataRow(r, i % 2 === 0)
    r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
    r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
  })
  const tot = sheet.addRow([`Tổng: ${data.totalChatbots} chatbot`, '', '', '', '', ''])
  styleTotalRow(tot)
  sheet.mergeCells(tot.number, 1, tot.number, 6)
  tot.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  autoFitColumns(sheet)
}

export function buildNLPSheet(wb: ExcelJS.Workbook, data: NLPStatistics) {
  const sheet = wb.addWorksheet('NLP')
  addTitleRow(sheet, 'THỐNG KÊ THÀNH PHẦN NLP', 2)

  // Summary
  const sh = sheet.addRow(['Thành phần', 'Số lượng'])
  styleHeader(sh)
  ;[
    ['Intent', data.totalIntents],
    ['Entity', data.totalEntities],
    ['Action', data.totalActions],
    ['Story', data.totalStories],
    ['Response', data.totalResponses],
    ['Example', data.totalExamples],
  ].forEach(([l, v], i) => {
    const r = sheet.addRow([l, v])
    styleDataRow(r, i % 2 === 0)
    r.getCell(2).numFmt = '#,##0'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
  })

  sheet.addRow([])

  // Top intents
  const ih = sheet.addRow(['#', 'Tên Intent', 'Số Entity'])
  styleHeader(ih)
  data.nlpComponents.intents.topIntents.forEach((intent, i) => {
    const r = sheet.addRow([i + 1, intent._id, intent.entities?.length ?? 0])
    styleDataRow(r, i % 2 === 0)
    r.getCell(3).numFmt = '#,##0'
    r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
  })

  sheet.addRow([])

  // Top stories
  const stH = sheet.addRow(['#', 'Tên Story', 'Số Intent'])
  styleHeader(stH)
  data.nlpComponents.stories.topStories.forEach((story, i) => {
    const r = sheet.addRow([i + 1, story._id, story.intentsCount])
    styleDataRow(r, i % 2 === 0)
    r.getCell(3).numFmt = '#,##0'
    r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
  })
  autoFitColumns(sheet)
}

export function buildDocumentSheet(wb: ExcelJS.Workbook, data: DocumentStatistics) {
  const sheet = wb.addWorksheet('Tài liệu')
  addTitleRow(sheet, 'THỐNG KÊ TÀI LIỆU', 4)

  // Summary
  const sh = sheet.addRow(['Chỉ số', 'Giá trị', '', ''])
  styleHeader(sh)
  ;[
    ['Tổng số tài liệu', data.totalDocs],
    ['Tài liệu công khai', data.accessStats.public],
    ['Tài liệu riêng tư', data.accessStats.private],
    ['Tổng dung lượng', formatBytes(data.fileSizeStats.totalSize)],
    ['File nhỏ (< 1MB)', data.fileSizeStats.smallFiles],
    ['File vừa (1–10MB)', data.fileSizeStats.mediumFiles],
    ['File lớn (≥ 10MB)', data.fileSizeStats.largeFiles],
  ].forEach(([l, v], i) => {
    const r = sheet.addRow([l, v, '', ''])
    styleDataRow(r, i % 2 === 0)
    r.getCell(1).font = { bold: true }
    if (typeof v === 'number') {
      r.getCell(2).numFmt = '#,##0'
      r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
    }
  })

  sheet.addRow([])

  // By type
  const th = sheet.addRow(['Loại file', 'Số lượng', 'Tổng dung lượng', 'Trung bình/file'])
  styleHeader(th)
  let totCount = 0, totSize = 0
  data.docsByType.forEach((d, i) => {
    totCount += d.count; totSize += d.totalSize
    const avg = d.count > 0 ? d.totalSize / d.count : 0
    const r = sheet.addRow([
      (d._id || 'unknown').toUpperCase(),
      d.count,
      formatBytes(d.totalSize),
      formatBytes(avg),
    ])
    styleDataRow(r, i % 2 === 0)
    r.getCell(2).numFmt = '#,##0'
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    r.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
  })
  const tot = sheet.addRow(['TỔNG', totCount, formatBytes(totSize), ''])
  styleTotalRow(tot)
  tot.getCell(2).numFmt = '#,##0'
  tot.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  tot.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }
  autoFitColumns(sheet)
}

export function buildFeedbackSheet(wb: ExcelJS.Workbook, data: ResponseFeedbackStatistics) {
  const sheet = wb.addWorksheet('Phản hồi')
  addTitleRow(sheet, 'THỐNG KÊ PHẢN HỒI RESPONSE', 6)

  // Summary
  const sh = sheet.addRow(['Chỉ số', 'Giá trị', '', '', '', ''])
  styleHeader(sh)
  ;[
    ['Tổng response', data.totalResponses],
    ['Tổng lượt thích', data.totalLikes],
    ['Tổng lượt không thích', data.totalDislikes],
    ['TB thích/response', +data.avgLikesPerResponse.toFixed(2)],
    ['TB không thích/response', +data.avgDislikesPerResponse.toFixed(2)],
  ].forEach(([l, v], i) => {
    const r = sheet.addRow([l, v, '', '', '', ''])
    styleDataRow(r, i % 2 === 0)
    r.getCell(1).font = { bold: true }
    r.getCell(2).numFmt = '#,##0.##'
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
  })

  sheet.addRow([])

  // Top liked
  const lh = sheet.addRow(['#', 'Tên Response', 'Bot', 'Thích', 'Không thích', 'Điểm'])
  styleHeader(lh)
  data.topLiked.forEach((item, i) => {
    const r = sheet.addRow([i + 1, item.name, item.botId, item.likeCount, item.dislikeCount, +item.score.toFixed(2)])
    styleDataRow(r, i % 2 === 0)
    r.getCell(4).numFmt = '#,##0'; r.getCell(5).numFmt = '#,##0'; r.getCell(6).numFmt = '#,##0.##'
    r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' }
  })

  sheet.addRow([])

  // Top disliked
  const dh = sheet.addRow(['#', 'Tên Response', 'Bot', 'Thích', 'Không thích', 'Điểm'])
  styleHeader(dh, 'C0392B')
  data.topDisliked.forEach((item, i) => {
    const r = sheet.addRow([i + 1, item.name, item.botId, item.likeCount, item.dislikeCount, +item.score.toFixed(2)])
    styleDataRow(r, i % 2 === 0)
    r.getCell(4).numFmt = '#,##0'; r.getCell(5).numFmt = '#,##0'; r.getCell(6).numFmt = '#,##0.##'
    r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' }
    r.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' }
  })
  autoFitColumns(sheet)
}

// ── Main export entry ─────────────────────────────────────────────────────────

export type ExportSection =
  | 'overall'
  | 'users'
  | 'conversations'
  | 'chatbots'
  | 'nlp'
  | 'documents'
  | 'feedback'

export interface ExportData {
  overall?: OverallStatistics
  users?: UserStatistics
  conversations?: ConversationStatistics
  chatbots?: ChatbotStatistics
  nlp?: NLPStatistics
  documents?: DocumentStatistics
  feedback?: ResponseFeedbackStatistics
}

export async function exportReportToExcel(data: ExportData, sections: ExportSection[]) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'RASA Management'
  wb.created = new Date()

  if (sections.includes('overall') && data.overall)    buildOverallSheet(wb, data.overall)
  if (sections.includes('users') && data.users)         buildUserSheet(wb, data.users)
  if (sections.includes('conversations') && data.conversations) buildConversationSheet(wb, data.conversations)
  if (sections.includes('chatbots') && data.chatbots)   buildChatbotSheet(wb, data.chatbots)
  if (sections.includes('nlp') && data.nlp)             buildNLPSheet(wb, data.nlp)
  if (sections.includes('documents') && data.documents) buildDocumentSheet(wb, data.documents)
  if (sections.includes('feedback') && data.feedback)   buildFeedbackSheet(wb, data.feedback)

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  saveAs(blob, `BaoCao_${dateStr}.xlsx`)
}
