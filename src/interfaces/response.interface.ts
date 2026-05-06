export interface IMyResponse {
  _id: string
  name: string
  description: string
  define: string // yalm text
  label?: string
  botIds?: string[]
  botId?: string
  roles: string[]
  likeCount?: number
  dislikeCount?: number
  deleted: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}