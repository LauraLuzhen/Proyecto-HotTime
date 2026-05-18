import type { Role } from "../../shared/common";
import type { CommunicationCountResponse, CommunicationDeleteResponse, CommunicationDetailResponse, CommunicationInboxQueryDto, CommunicationInboxResponse, CommunicationOutboxResponse, CreateCommunicationDto, DeleteInboxCommunicationsDto } from "./dtos";

export type CreateCommunicationFn = (data: CreateCommunicationDto, senderId: number, organizationId: number) => Promise<CommunicationOutboxResponse>;
export type GetInboxCommunicationsFn = (userId: number, organizationId: number, filters: CommunicationInboxQueryDto) => Promise<CommunicationInboxResponse[]>;
export type GetOutboxCommunicationsFn = (userId: number, organizationId: number) => Promise<CommunicationOutboxResponse[]>;
export type GetCommunicationByIdFn = (communicationId: number, userId: number, organizationId: number) => Promise<CommunicationDetailResponse>;
export type CountInboxCommunicationsFn = (userId: number,organizationId: number, read: boolean) => Promise<CommunicationCountResponse>;
export type HideInboxCommunicationsFn = (userId: number, organizationId: number, data: DeleteInboxCommunicationsDto) => Promise<CommunicationDeleteResponse>;
export type DeleteCommunicationsFn = (userId: number, organizationId: number, role: Role, data: DeleteInboxCommunicationsDto) => Promise<CommunicationDeleteResponse>;
