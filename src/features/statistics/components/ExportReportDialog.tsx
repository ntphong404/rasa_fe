import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileDown, Loader2, CheckSquare, Square } from 'lucide-react'
import { statisticService } from '../api/service'
import { useChatbotStore } from '@/store/chatbot'
import { useChatbots } from '@/hooks/useChatbots'
import { exportReportToExcel, type ExportSection, type ExportData } from '@/utils/exportReportExcel'

interface SectionOption {
  id: ExportSection
  label: string
  description: string
}

const SECTIONS: SectionOption[] = [
  { id: 'overall',       label: 'Tổng quan hệ thống',    description: 'Số lượng người dùng, chatbot, intent, story...' },
  { id: 'users',         label: 'Người dùng',             description: 'Trạng thái, giới tính, xu hướng đăng ký' },
  { id: 'conversations', label: 'Hội thoại',              description: 'Xu hướng, top người dùng hoạt động nhất' },
  { id: 'chatbots',      label: 'Chatbot',                description: 'Danh sách chatbot, cấu hình IP và cổng' },
  { id: 'nlp',           label: 'Thành phần NLP',         description: 'Intent, entity, action, story, response, example' },
  { id: 'documents',     label: 'Tài liệu',               description: 'Phân loại file, dung lượng, quyền truy cập' },
  { id: 'feedback',      label: 'Phản hồi response',      description: 'Top response được thích / không thích' },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultSections?: ExportSection[]
}

export function ExportReportDialog({ open, onOpenChange, defaultSections }: Props) {
  const { t } = useTranslation()
  const { chatbots } = useChatbots()
  const selectedBotId = useChatbotStore((state) => state.selectedBotId)
  const [exportBotId, setExportBotId] = useState<string>("")

  useEffect(() => {
    const validBots = chatbots.filter((bot) => bot.botId !== 'global')
    if (selectedBotId && selectedBotId !== 'global') {
      setExportBotId(selectedBotId)
    } else if (validBots.length > 0) {
      setExportBotId(validBots[0].botId)
    }
  }, [selectedBotId, chatbots])

  const [selected, setSelected] = useState<Set<ExportSection>>(
    new Set(defaultSections ?? SECTIONS.map((s) => s.id))
  )
  const [loading, setLoading] = useState(false)

  const toggle = (id: ExportSection) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectAll = () => setSelected(new Set(SECTIONS.map((s) => s.id)))
  const clearAll  = () => setSelected(new Set())

  const handleExport = async () => {
    if (selected.size === 0) {
      toast.warning('Vui lòng chọn ít nhất một mục để xuất')
      return
    }
    setLoading(true)
    try {
      const scopedBotId = exportBotId && exportBotId !== 'global' ? exportBotId : undefined
      const params = { botId: scopedBotId }
      const sections = [...selected] as ExportSection[]
      const data: ExportData = {}

      await Promise.all([
        sections.includes('overall') && statisticService.getOverallStatistics(params)
          .then((r) => { data.overall = r.data }),
        sections.includes('users') && statisticService.getUserStatistics(params)
          .then((r) => { data.users = r.data }),
        sections.includes('conversations') && statisticService.getConversationStatistics(params)
          .then((r) => { data.conversations = r.data }),
        sections.includes('chatbots') && statisticService.getChatbotStatistics(params)
          .then((r) => { data.chatbots = r.data }),
        sections.includes('nlp') && statisticService.getNLPStatistics(params)
          .then((r) => { data.nlp = r.data }),
        sections.includes('documents') && statisticService.getDocumentStatistics(params)
          .then((r) => { data.documents = r.data }),
        sections.includes('feedback') && statisticService.getResponseFeedbackStatistics(params)
          .then((r) => { data.feedback = r.data }),
      ].filter(Boolean))

      await exportReportToExcel(data, sections)
      toast.success(`Đã xuất ${sections.length} sheet thành công`)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Xuất báo cáo thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileDown className="h-5 w-5 text-green-600" />
            Xuất báo cáo Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chatbot Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="export-chatbot">Chọn Chatbot báo cáo</Label>
            <Select value={exportBotId} onValueChange={setExportBotId}>
              <SelectTrigger id="export-chatbot">
                <SelectValue placeholder="Chọn chatbot" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.filter((bot) => bot.botId !== 'global').map((bot) => (
                  <SelectItem key={bot._id} value={bot.botId}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Chọn các mục cần xuất. Mỗi mục sẽ là một sheet riêng.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 px-2 text-xs">
                <CheckSquare className="h-3 w-3 mr-1" />
                Tất cả
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2 text-xs">
                <Square className="h-3 w-3 mr-1" />
                Bỏ chọn
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border rounded-md border">
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer select-none transition-colors"
                onClick={() => toggle(section.id)}
              >
                <Checkbox
                  id={`export-${section.id}`}
                  checked={selected.has(section.id)}
                  onCheckedChange={() => toggle(section.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`export-${section.id}`}
                    className="font-medium cursor-pointer text-sm"
                  >
                    {section.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
              </div>
            ))}
          </div>

          {selected.size > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              Đã chọn <span className="font-semibold text-foreground">{selected.size}</span> sheet
            </p>
          )}
        </div>
      </div>

      <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || selected.size === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Xuất Excel ({selected.size} sheet)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
