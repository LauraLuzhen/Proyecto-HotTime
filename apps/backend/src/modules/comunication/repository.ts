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

export function findUserById(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      organizationId: true,
    },
  });
}

export async function createForOrganization(data: CreateCommunicationDto, senderId: number, organizationId: number) {
  return prisma.$transaction(async (tx) => {
    const recipients = await tx.user.findMany({
      where: {
        organizationId,
        NOT: { id: senderId },
      },
      select: { id: true },
    });

    return tx.communication.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        senderId,
        organizationId,
        recipients: {
          create: recipients.map((recipient) => ({
            userId: recipient.id,
            read: false,
          })),
        },
      },
      select: communicationSelect,
    });
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
