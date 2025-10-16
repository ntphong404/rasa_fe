export interface IEntity {
  _id: string
  name: string
  description: string
  define: string // yalm text
  createdAt: string
  updatedAt: string
  deleted: boolean
  deletedAt?: string

}