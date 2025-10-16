export interface IAction {
  _id: string
  name: string
  description: string
  define: string
  createdAt: string
  updatedAt: string
  deleted: boolean
  deletedAt?: string

}