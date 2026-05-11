import type { 
    CreateUserDto, 
    CreateUserResponse, 
    DeleteUserResponse, 
    GetUsersQueryDto, 
    GeneralUserResponse, 
    GetUserByIdResponse,
    UpdateMeDto, 
    UpdateUsersDto, 
    MeResponse } from "./dtos";

export type CreateUserFn = (data: CreateUserDto, organizationId: number) => Promise<CreateUserResponse>;
export type GetMeFn = (userId: number) => Promise<MeResponse>;
export type GetUsersFn = (organizationId: number, filters: GetUsersQueryDto, userId: number) => Promise<GeneralUserResponse[]>;
export type GetUserByIdFn = (id: number, organizationId: number, currentUserId: number) => Promise<GetUserByIdResponse>;
export type UpdateMeFn = (userId: number, data: UpdateMeDto) => Promise<GeneralUserResponse>;
export type UpdateUsersFn = (userId: number, adminOrganizationId: number, currentUserId: number, data: UpdateUsersDto) => Promise<GeneralUserResponse>;
export type DeleteUserFn = (userId: number, organizationId: number, currentUserId: number) => Promise<DeleteUserResponse>;
