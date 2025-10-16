export interface IIntent {
   _id: string
  name: string
  description: string
  define: string // yalm text
  entities: string[]

  roles: string[]

  createdAt: Date
  updatedAt: Date
  deleted: boolean
  deletedAt?: Date
}