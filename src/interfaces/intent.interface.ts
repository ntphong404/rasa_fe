export interface IIntent {
  _id: string
  name: string
  description: string
  examples: Array<{ _id: string; text: string }>
  label?: string
  botIds: string[]
  entities: string[]
  roles: string[]
  createdAt: Date
  updatedAt: Date
  deleted: boolean
  deletedAt?: Date
}
