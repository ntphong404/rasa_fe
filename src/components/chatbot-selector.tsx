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
  const {
    chatbots,
    loading,
    selectedManagementBotId,
    setSelectedManagementBotId,
    selectedChatBotId,
    setSelectedChatBotId,
  } = useChatbots();

  const isChatPage =
    location.pathname === '/' ||
    location.pathname === '/home_chat' ||
    location.pathname === '/home_chat_demo';

  // Disable global selection on pages that require a concrete chatbot id.
  const disableGlobalSelectionPaths = ['/context-docs', '/uquestion', '/suggested-questions', '/message-feedback'];
  const isGlobalSelectionDisabled = disableGlobalSelectionPaths.some((path) =>
    location.pathname.endsWith(path)
  );

  // Auto-switch from global to first bot when landing on pages that disable global selection
  useEffect(() => {
    if (isChatPage || !isGlobalSelectionDisabled || selectedManagementBotId !== 'global' || chatbots.length === 0) {
      return;
    }
    
    const firstBot = chatbots[0];
    if (firstBot) {
      setSelectedManagementBotId(firstBot.botId, firstBot._id);
    }
  }, [isGlobalSelectionDisabled, location.pathname, isChatPage]);
  
  // Keep the state in sync when chatbots list changes
  useEffect(() => {
    if (isChatPage || !isGlobalSelectionDisabled || selectedManagementBotId !== 'global' || chatbots.length === 0) {
      return;
    }
    
    const firstBot = chatbots[0];
    if (firstBot) {
      setSelectedManagementBotId(firstBot.botId, firstBot._id);
    }
  }, [chatbots, isGlobalSelectionDisabled, selectedManagementBotId, setSelectedManagementBotId, isChatPage]);

  if (loading && chatbots.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">{t('Loading chatbot list...')}</span>
      </div>
    );
  }

  // Determine standard binding values depending on the page mode
  const currentValue = isChatPage ? selectedChatBotId : selectedManagementBotId;
  const onValueChange = (val: string) => {
    const matched = chatbots.find((b) => b.botId === val);
    if (isChatPage) {
      if (matched) {
        setSelectedChatBotId(matched.botId, matched._id);
      }
    } else {
      setSelectedManagementBotId(val, matched?._id);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <label className="text-sm font-medium text-muted-foreground min-w-fit">
        {t('Chatbot')}:
      </label>
      <Select value={currentValue || ''} onValueChange={onValueChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t('Select chatbot...')} />
        </SelectTrigger>
        <SelectContent>
          {!isChatPage && !isGlobalSelectionDisabled && (
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
