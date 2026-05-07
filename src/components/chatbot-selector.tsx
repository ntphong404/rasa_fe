import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { chatbots, loading, selectedManagementBotId, setSelectedManagementBotId } = useChatbots();

  // Disable global selection on pages that require a concrete chatbot id.
  const disableGlobalSelectionPaths = ['/context-docs', '/uquestion', '/suggested-questions'];
  const isGlobalSelectionDisabled = disableGlobalSelectionPaths.some((path) =>
    location.pathname.endsWith(path)
  );

  useEffect(() => {
    if (!isGlobalSelectionDisabled) return;
    if (selectedManagementBotId !== 'global') return;

    const firstBot = chatbots[0];
    if (firstBot) {
      setSelectedManagementBotId(firstBot.botId, firstBot._id);
    }
  }, [isGlobalSelectionDisabled, selectedManagementBotId, chatbots, setSelectedManagementBotId]);

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
      <Select value={selectedManagementBotId || ''} onValueChange={setSelectedManagementBotId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t('Select chatbot...')} />
        </SelectTrigger>
        <SelectContent>
          {!isGlobalSelectionDisabled && (
            <SelectItem value="global">{t('Global (All chatbots)')}</SelectItem>
          )}
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
