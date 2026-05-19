import { PrismaClient, type Prisma } from "@prisma/client";
import type { CreateCommunicationDto, CommunicationInboxQueryDto } from "@hottime/types";

const prisma = new PrismaClient();

function uniqueIds(ids: number[]) {
  return [...new Set(ids)];
}

//#region Select
// Sender
const senderSelect = {
  id: true,
  fullName: true,
  email: true,
} satisfies Prisma.UserSelect;
// Recipients
const recipientSelect = {
  id: true,
  read: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} satisfies Prisma.CommunicationUserSelect;
// Communication
const communicationSelect = {
  id: true,
  title: true,
  content: true,
  type: true,
  senderId: true,
  organizationId: true,
  sentAt: true,
  sender: {
    select: senderSelect,
  },
  recipients: {
    select: recipientSelect,
    orderBy: {
      user: {
        fullName: "asc",
      },
    },
  },
} satisfies Prisma.CommunicationSelect;
//#endregion

//#region Create
// Create communication
export async function createForOrganization(data: CreateCommunicationDto, senderId: number, organizationId: number) {
  const recipientIds = await resolveRecipientIds(data, senderId, organizationId);
  return createForRecipientIds(data, senderId, organizationId, recipientIds);
}
// Create recipients del comunicado
export async function createForRecipientIds(data: CreateCommunicationDto, senderId: number, organizationId: number, recipientIds: number[]) {
  return prisma.communication.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      senderId,
      organizationId,
      recipients: {
        create: uniqueIds(recipientIds).map((userId) => ({
          userId,
          read: false,
        })),
      },
    },
    select: communicationSelect,
  });
}

//#endregion

//#region Get
// Get user by id
export function findUserById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      organizationId: true,
    },
  });
}
// Get count of inbox
export function countInbox(userId: number, organizationId: number, read: boolean) {
  return prisma.communicationUser.count({
    where: {
      userId,
      hiddenAt: null,
      read,
      communication: {
        organizationId,
        NOT: { senderId: userId },
      },
    },
  });
}
// Get inbox
export function findInbox(userId: number, organizationId: number, filters: CommunicationInboxQueryDto) {
  return prisma.communicationUser.findMany({
    where: {
      userId,
      hiddenAt: null,
      read: filters.read,
      communication: {
        organizationId,
        NOT: { senderId: userId },
      },
    },
    orderBy: {
      communication: {
        sentAt: "desc",
      },
    },
    select: {
      read: true,
      createdAt: true,
      communication: {
        select: communicationSelect,
      },
    },
  });
}
// Get outbox
export function findOutbox(userId: number, organizationId: number) {
  return prisma.communication.findMany({
    where: {
      senderId: userId,
      organizationId,
    },
    orderBy: {
      sentAt: "desc",
    },
    select: communicationSelect,
  });
}
// Get recipients del comunicado
export function findRecipientCommunication(communicationId: number, userId: number, organizationId: number) {
  return prisma.communicationUser.findFirst({
    where: {
      communicationId,
      userId,
      hiddenAt: null,
      communication: {
        organizationId,
      },
    },
    select: {
      id: true,
      read: true,
      createdAt: true,
      communication: {
        select: communicationSelect,
      },
    },
  });
}
// Get sender del comunicado
export function findSentCommunication(communicationId: number, userId: number, organizationId: number) {
  return prisma.communication.findFirst({
    where: {
      id: communicationId,
      senderId: userId,
      organizationId,
    },
    select: communicationSelect,
  });
}
//#endregion

//#region Update
// Aplica los recipients que van a recibir el comunicado
export async function resolveRecipientIds(data: CreateCommunicationDto, senderId: number, organizationId: number) {
  const recipientMode = data.recipientMode ?? "ALL_USERS";
  const categoryIds = uniqueIds(data.recipientCategoryIds ?? []);
  const categoryRecipientsWhere: Prisma.UserWhereInput[] = [];

  if (categoryIds.length) {
    categoryRecipientsWhere.push({
      userCategories: {
        some: {
          categoryId: { in: categoryIds },
          category: { organizationId },
        },
      },
    });
  }

  if (data.recipientWithoutCategory) {
    categoryRecipientsWhere.push({
      userCategories: {
        none: {},
      },
    });
  }

  const baseWhere: Prisma.UserWhereInput = {
    organizationId,
    NOT: { id: senderId },
  };

  const recipients = await prisma.user.findMany({
    where: {
      ...baseWhere,
      ...(recipientMode === "USERS"
        ? { id: { in: uniqueIds(data.recipientUserIds ?? []) } }
        : {}),
      ...(recipientMode === "CATEGORIES"
        ? { OR: categoryRecipientsWhere }
        : {}),
    },
    select: { id: true },
  });

  const recipientIds = new Set(recipients.map((recipient) => recipient.id));

  const extraUserIds = uniqueIds(data.recipientExtraUserIds ?? []);
  if (extraUserIds.length) {
    const extraRecipients = await prisma.user.findMany({
      where: {
        ...baseWhere,
        id: { in: extraUserIds },
      },
      select: { id: true },
    });

    extraRecipients.forEach((recipient) => recipientIds.add(recipient.id));
  }

  uniqueIds(data.recipientExcludedUserIds ?? []).forEach((userId) => recipientIds.delete(userId));

  return [...recipientIds];
}
// Marca como leído los comunicados y el receptor que lo ha leído
export function markRecipientAsRead(recipientCommunicationId: number) {
  return prisma.communicationUser.update({
    where: { id: recipientCommunicationId },
    data: { read: true },
    select: {
      id: true,
      read: true,
    },
  });
}
// Oculta los comunicados de inbox
export async function hideInboxCommunications(userId: number, organizationId: number, communicationIds: number[]) {
  const validCommunications = await prisma.communication.findMany({
    where: {
      id: { in: uniqueIds(communicationIds) },
      organizationId,
      NOT: { senderId: userId },
    },
    select: { id: true },
  });

  if (!validCommunications.length) return 0;

  const recipients = await prisma.communicationUser.findMany({
    where: {
      userId,
      hiddenAt: null,
      communicationId: { in: validCommunications.map((communication) => communication.id) },
    },
    select: { id: true },
  });

  if (!recipients.length) return 0;

  const result = await prisma.communicationUser.updateMany({
    where: {
      id: { in: recipients.map((recipient) => recipient.id) },
    },
    data: {
      hiddenAt: new Date(),
    },
  });

  return result.count;
}
//#endregion

//#region Delete
export async function deleteInboxCommunications(organizationId: number, communicationIds: number[]) {
  const ids = uniqueIds(communicationIds);
  if (!ids.length) return 0;

  return prisma.$transaction(async (tx) => {
    const validCommunications = await tx.communication.findMany({
      where: {
        id: { in: ids },
        organizationId,
      },
      select: { id: true },
    });

    if (!validCommunications.length) return 0;

    const validIds = validCommunications.map((communication) => communication.id);

    await tx.communicationUser.deleteMany({
      where: {
        communicationId: { in: validIds },
      },
    });

    const result = await tx.communication.deleteMany({
      where: {
        id: { in: validIds },
        organizationId,
      },
    });

    return result.count;
  });
}
//#endregion
