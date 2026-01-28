import React from 'react';
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
  const { chatbots, loading, selectedBotId, setSelectedBotId } = useChatbots();

  if (loading && chatbots.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading chatbots...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <label className="text-sm font-medium text-muted-foreground min-w-fit">
        Chatbot:
      </label>
      <Select value={selectedBotId || ''} onValueChange={setSelectedBotId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a chatbot..." />
        </SelectTrigger>
        <SelectContent>
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
