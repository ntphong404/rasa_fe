export interface CreateIntentRequest {
  name: string
  description: string
  define: string
  botIds: string[]
  label?: string
  entities: string[]
}