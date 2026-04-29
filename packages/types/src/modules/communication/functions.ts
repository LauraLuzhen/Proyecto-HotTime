import {
  CreateCommunicationDTO,
  CreateCommunicationResponse,
  InboxItemDTO,
  OutboxItemDTO,
  UnreadCountDTO,
} from "./dtos";

export interface CommunicationService {
  createCommunication(
    data: CreateCommunicationDTO
  ): Promise<CreateCommunicationResponse>;

  getInbox(): Promise<InboxItemDTO[]>;

  getOutbox(): Promise<OutboxItemDTO[]>;

  getCommunication(id: number): Promise<any>;

  markAsRead(id: number): Promise<void>;

  countUnread(): Promise<UnreadCountDTO>;

  deleteCommunication(id: number): Promise<void>;
}