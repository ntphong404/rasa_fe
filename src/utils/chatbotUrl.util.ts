import type { IChatbot } from '@/interfaces/chatbot.interface'

function getSelectedChatbot(): IChatbot | null {
  try {
    const stored = localStorage.getItem('chatbot-storage')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    const { chatbots, selectedBotId } = parsed?.state ?? {}
    if (!chatbots || !selectedBotId) return null
    return chatbots.find((b: IChatbot) => b.botId === selectedBotId) ?? null
  } catch {
    return null
  }
}

export function getRasaUrl(): string {
  const bot = getSelectedChatbot()
  if (bot?.ip && bot?.rasaPort) return `http://${bot.ip}:${bot.rasaPort}`
  return import.meta.env.VITE_RASA_BASE_URL || 'http://localhost:5005'
}

export function getFlaskUrl(): string {
  const bot = getSelectedChatbot()
  if (bot?.ip && bot?.flaskPort) return `http://${bot.ip}:${bot.flaskPort}`
  return import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000'
}
