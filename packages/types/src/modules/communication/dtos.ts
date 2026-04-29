import { CommunicationEntity } from "./entities";
import { CommunicationType } from "../../shared/common";

export interface CommunicationWithSender extends CommunicationEntity {
  sender: {
    id: number;
    fullName: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  };
}

export interface CommunicationRecipient {
  userId: number;
  read: boolean;
  createdAt: Date;

  user: {
    id: number;
    fullName: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  };
}

export interface CommunicationFull extends CommunicationWithSender {
  recipients: CommunicationRecipient[];
}

/**
 * CREATE
 */
export interface CreateCommunicationDTO {
  title: string;
  content: string;
  type: CommunicationType;
  recipientIds: number[];
}

/**
 * RESPONSE CREATE
 */
export interface CreateCommunicationResponse {
  id: number;
  title: string;
  content: string;
  type: CommunicationType;
  createdAt: Date;
}

/**
 * INBOX ITEM
 */
export interface InboxItemDTO {
  communicationId: number;
  read: boolean;
  createdAt: Date;

  communication: {
    id: number;
    title: string;
    content: string;
    type: CommunicationType;
    createdAt: Date;

    sender: {
      id: number;
      fullName: string;
      role: string;
    };
  };
}

/**
 * OUTBOX ITEM
 */
export interface OutboxItemDTO {
  id: number;
  title: string;
  content: string;
  type: CommunicationType;
  createdAt: Date;

  recipients: {
    userId: number;
    read: boolean;
    user: {
      id: number;
      fullName: string;
      role: string;
    };
  }[];
}

/**
 * COUNT
 */
export interface UnreadCountDTO {
  count: number;
}