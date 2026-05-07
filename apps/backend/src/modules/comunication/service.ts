import type { CommunicationDetailResponse, CommunicationInboxResponse, CommunicationOutboxResponse, CountInboxCommunicationsFn, CreateCommunicationFn, GetCommunicationByIdFn, GetInboxCommunicationsFn, GetOutboxCommunicationsFn, } from "@hottime/types";
import { httpError } from "@/lib/httpError";
import * as repo from "@/modules/comunication/repository";

function toOutboxResponse(communication: any): CommunicationOutboxResponse {
  const recipients = communication.recipients.filter((recipient: { user: { id: number } }) => recipient.user.id !== communication.senderId);
  const readCount = recipients.filter((recipient: { read: boolean }) => recipient.read).length;
  const unreadCount = recipients.length - readCount;
  return {
    ...communication,
    recipients,
    readCount,
    unreadCount,
  };
}
function toInboxResponse(item: any): CommunicationInboxResponse {
  const { recipients, ...communication } = item.communication;
  return {
    ...communication,
    read: item.read,
    receivedAt: item.createdAt,
  };
}
function toDetailFromRecipient(item: any): CommunicationDetailResponse {
  const { recipients, ...base } = item.communication;
  return {
    ...base,
    read: true,
    receivedAt: item.createdAt,
  };
}

// Create communication
export const createCommunication: CreateCommunicationFn = async (data, senderId, organizationId) => {
  const sender = await repo.findUserById(senderId);
  if (!sender) throw httpError("User not found", 404, "USER_NOT_FOUND");
  if (sender.organizationId !== organizationId) throw httpError("User does not belong to your organization", 403, "USER_FORBIDDEN");
  const communication = await repo.createForOrganization(data, senderId, organizationId);
  return toOutboxResponse(communication);
};

// Get inbox communications
export const getInboxCommunications: GetInboxCommunicationsFn = async (userId, organizationId, filters) => {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  if (user.organizationId !== organizationId) throw httpError("User does not belong to your organization", 403, "USER_FORBIDDEN");
  const inbox = await repo.findInbox(userId, organizationId, filters);
  return inbox.map(toInboxResponse);
};

// Get outbox communications
export const getOutboxCommunications: GetOutboxCommunicationsFn = async (userId, organizationId) => {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  if (user.organizationId !== organizationId) throw httpError("User does not belong to your organization", 403, "USER_FORBIDDEN");
  const outbox = await repo.findOutbox(userId, organizationId);
  return outbox.map(toOutboxResponse);
};

// Get communication by id
export const getCommunicationById: GetCommunicationByIdFn = async (communicationId, userId, organizationId) => {
  const sentCommunication = await repo.findSentCommunication(communicationId, userId, organizationId);
  if (sentCommunication) {
    return {
      ...toOutboxResponse(sentCommunication),
      read: null,
      receivedAt: null,
    };
  }
  const recipientCommunication = await repo.findRecipientCommunication(communicationId, userId, organizationId);
  if (recipientCommunication) {
    if (!recipientCommunication.read) await repo.markRecipientAsRead(recipientCommunication.id);
    return toDetailFromRecipient(recipientCommunication);
  }
  throw httpError("Communication not found", 404, "COMMUNICATION_NOT_FOUND");
};

// Couny communications
export const countInboxCommunications: CountInboxCommunicationsFn = async (userId, organizationId, read) => {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError("User not found", 404, "USER_NOT_FOUND");
  if (user.organizationId !== organizationId) throw httpError("User does not belong to your organization", 403, "USER_FORBIDDEN");
  const count = await repo.countInbox(userId, organizationId, read);
  return { count };
};
