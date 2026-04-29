import { CommunicationType } from "../../shared/common";

export interface CommunicationEntity {
  id: number;
  title: string;
  content: string;
  type: CommunicationType;

  senderId: number;
  organizationId: number;

  createdAt: Date;
}