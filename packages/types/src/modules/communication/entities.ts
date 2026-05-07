import type { CommunicationType } from "../../shared/common";

export interface CommunicationSender {
  id: number;
  fullName: string;
  email: string;
}

export interface CommunicationRecipient {
  id: number;
  read: boolean;
  createdAt: Date;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CommunicationBase {
  id: number;
  title: string;
  content: string;
  type: CommunicationType;
  senderId: number;
  organizationId: number;
  sentAt: Date;
}
