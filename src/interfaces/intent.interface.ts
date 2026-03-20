export interface IIntent {
  _id: string
  name: string
  description: string
  define: string // yaml text
  label?: string // T\u00ean sheet ho\u1eb7c lo\u1ea1i
  botIds: string[]
  entities: string[]
  roles: string[]
  createdAt: Date
  updatedAt: Date
  deleted: boolean
  deletedAt?: Date
}