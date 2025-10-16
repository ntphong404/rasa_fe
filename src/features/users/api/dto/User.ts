
export enum EUserStatus {
  BANNED = 'BANNED',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
}


export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  avatar: string;
  is2FAEnabled: boolean;
  status?: EUserStatus;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserQuery {
    page?: number;
    limit?: number;
    search?: string;
    deleted?: boolean;
    sort?: string;
}