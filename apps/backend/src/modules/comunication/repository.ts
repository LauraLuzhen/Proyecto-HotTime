import { PrismaClient, type Prisma } from "@prisma/client";
import type { CreateCommunicationDto, CommunicationInboxQueryDto } from "@hottime/types";

const prisma = new PrismaClient();

const senderSelect = {
  id: true,
  fullName: true,
  email: true,
} satisfies Prisma.UserSelect;

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

//#region CREATE
function uniqueIds(ids: number[]) {
  return [...new Set(ids)];
}

export async function createForOrganization(data: CreateCommunicationDto, senderId: number, organizationId: number) {
  const recipientIds = await resolveRecipientIds(data, senderId, organizationId);

  return createForRecipientIds(data, senderId, organizationId, recipientIds);
}

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

  return uniqueIds(recipients.map((recipient) => recipient.id));
}

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

//#region GET
export function findUserById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      organizationId: true,
    },
  });
}

export function findInbox(userId: number, organizationId: number, filters: CommunicationInboxQueryDto) {
  return prisma.communicationUser.findMany({
    where: {
      userId,
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

export function findRecipientCommunication(communicationId: number, userId: number, organizationId: number) {
  return prisma.communicationUser.findFirst({
    where: {
      communicationId,
      userId,
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

export function countInbox(userId: number, organizationId: number, read: boolean) {
  return prisma.communicationUser.count({
    where: {
      userId,
      read,
      communication: {
        organizationId,
        NOT: { senderId: userId },
      },
    },
  });
}
