export interface CreateIntentRequest {
  name: string
  description: string
  examples: string[]
  botIds: string[]
  label?: string
  entities: string[]
}
