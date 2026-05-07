import type { CommunicationType } from "../../shared/common";
import type { CommunicationBase, CommunicationRecipient, CommunicationSender } from "./entities";

export interface CreateCommunicationDto {
  title: string;
  content: string;
  type: CommunicationType;
}

export interface CommunicationInboxQueryDto {
  read?: boolean;
}

export interface CommunicationInboxResponse extends CommunicationBase {
  sender: CommunicationSender;
  read: boolean;
  receivedAt: Date;
}

export interface CommunicationOutboxResponse extends CommunicationBase {
  sender: CommunicationSender;
  recipients: CommunicationRecipient[];
  readCount: number;
  unreadCount: number;
}

export interface CommunicationDetailResponse extends CommunicationBase {
  sender: CommunicationSender;
  read: boolean | null;
  receivedAt: Date | null;
  recipients?: CommunicationRecipient[];
  readCount?: number;
  unreadCount?: number;
}

export interface CommunicationCountResponse {
  count: number;
}
