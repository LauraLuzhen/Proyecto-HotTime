import { httpError } from "../../lib/httpError";
import * as repo from "./repository";
import * as userRepo from "../user/repository";

// 🔐 VALIDAR ROLES
function validateRecipients(senderRole: string, recipients: any[]) {
  for (const user of recipients) {
    if (senderRole === "EMPLOYEE") {
      if (!["MANAGER", "ADMIN"].includes(user.role)) {
        throw httpError("Invalid recipient role", 403, "INVALID_ROLE");
      }
    }

    if (senderRole === "MANAGER") {
      if (!["EMPLOYEE", "ADMIN"].includes(user.role)) {
        throw httpError("Invalid recipient role", 403, "INVALID_ROLE");
      }
    }

    if (senderRole === "ADMIN") {
      if (!["EMPLOYEE", "MANAGER"].includes(user.role)) {
        throw httpError("Invalid recipient role", 403, "INVALID_ROLE");
      }
    }
  }
}

// CREATE
export async function createCommunication(
  data: any,
  senderId: number,
  organizationId: number,
  senderRole: string
) {
  const recipients = await Promise.all(
    data.recipientIds.map((id: number) => userRepo.findById(id))
  );

  if (recipients.some((u) => !u)) {
    throw httpError("Recipient not found", 404, "USER_NOT_FOUND");
  }

  // 🔒 misma organización
  recipients.forEach((user) => {
    if (user!.organizationId !== organizationId) {
      throw httpError("User not in your organization", 403, "FORBIDDEN");
    }
  });

  // 🔥 validar roles
  validateRecipients(senderRole, recipients);

  const communication = await repo.createCommunication({
    title: data.title,
    content: data.content,
    type: data.type,
    senderId,
    organizationId,
  });

  await repo.createRecipients(
    data.recipientIds.map((userId: number) => ({
      userId,
      communicationId: communication.id,
    }))
  );

  return communication;
}

// INBOX
export async function getInbox(userId: number) {
  return repo.getInbox(userId);
}

// OUTBOX
export async function getOutbox(userId: number) {
  return repo.getOutbox(userId);
}

// GET ONE
export async function getCommunication(
  id: number,
  userId: number
) {
  const communication = await repo.getById(id);

  if (!communication) {
    throw httpError("Communication not found", 404, "NOT_FOUND");
  }

  const isSender = communication.senderId === userId;
  const isRecipient = communication.recipients.some(
    (r) => r.userId === userId
  );

  if (!isSender && !isRecipient) {
    throw httpError("Forbidden", 403, "FORBIDDEN");
  }

  return communication;
}

// MARK AS READ
export async function markAsRead(
  userId: number,
  communicationId: number
) {
  try {
    return await repo.markAsRead(userId, communicationId);
  } catch {
    throw httpError("Communication not found", 404, "NOT_FOUND");
  }
}

// COUNT UNREAD
export async function countUnread(userId: number) {
  return repo.countUnread(userId);
}

// DELETE
export async function deleteCommunication(
  id: number,
  userId: number
) {
  const communication = await repo.getById(id);

  if (!communication) {
    throw httpError("Not found", 404, "NOT_FOUND");
  }

  if (communication.senderId !== userId) {
    throw httpError("Forbidden", 403, "FORBIDDEN");
  }

  return repo.deleteCommunication(id);
}