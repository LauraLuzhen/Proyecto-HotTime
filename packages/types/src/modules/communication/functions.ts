import type { CommunicationCountResponse, CommunicationDetailResponse, CommunicationInboxQueryDto, CommunicationInboxResponse, CommunicationOutboxResponse, CreateCommunicationDto } from "./dtos";

export type CreateCommunicationFn = (data: CreateCommunicationDto, senderId: number, organizationId: number) => Promise<CommunicationOutboxResponse>;
export type GetInboxCommunicationsFn = (userId: number, organizationId: number, filters: CommunicationInboxQueryDto) => Promise<CommunicationInboxResponse[]>;
export type GetOutboxCommunicationsFn = (userId: number, organizationId: number) => Promise<CommunicationOutboxResponse[]>;
export type GetCommunicationByIdFn = (communicationId: number, userId: number, organizationId: number) => Promise<CommunicationDetailResponse>;
export type CountInboxCommunicationsFn = (userId: number,organizationId: number, read: boolean) => Promise<CommunicationCountResponse>;
