export interface MeRequest {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    address: string;
    phoneNumber: string;
    avatar: string;
    roles: string[];
    is2FAEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}