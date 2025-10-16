export interface IMyResponse {
  _id: string
  name: string
  description: string
  define: string // yalm text
  roles: string[]
  deleted: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}