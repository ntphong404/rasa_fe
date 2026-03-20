import React from 'react';
import { useTranslation } from 'react-i18next';
import { useChatbots } from '@/hooks/useChatbots';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export function ChatbotSelector() {
  const { t } = useTranslation();
  const { chatbots, loading, selectedBotId, setSelectedBotId } = useChatbots();

  if (loading && chatbots.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">{t('Loading chatbot list...')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <label className="text-sm font-medium text-muted-foreground min-w-fit">
        {t('Chatbot')}:
      </label>
      <Select value={selectedBotId || ''} onValueChange={setSelectedBotId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t('Select chatbot...')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="global">{t('Global (All chatbots)')}</SelectItem>
          {chatbots.map((bot) => (
            <SelectItem key={bot._id} value={bot.botId}>
              {bot.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
