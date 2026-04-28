import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CREATE
export async function createCommunication(data: any) {
  return prisma.communication.create({
    data,
  });
}

export async function createRecipients(data: any[]) {
  return prisma.communicationUser.createMany({
    data,
  });
}

// GET INBOX
export function getInbox(userId: number) {
  return prisma.communicationUser.findMany({
    where: { userId },
    include: {
      communication: {
        include: {
          sender: true,
        },
      },
    },
    orderBy: {
      communication: {
        createdAt: "desc",
      },
    },
  });
}

// GET OUTBOX
export function getOutbox(userId: number) {
  return prisma.communication.findMany({
    where: { senderId: userId },
    include: {
      recipients: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// GET ONE
export function getById(id: number) {
  return prisma.communication.findUnique({
    where: { id },
    include: {
      sender: true,
      recipients: {
        include: {
          user: true,
        },
      },
    },
  });
}

// MARK AS READ
export function markAsRead(userId: number, communicationId: number) {
  return prisma.communicationUser.update({
    where: {
      communicationId_userId: {
        communicationId,
        userId,
      },
    },
    data: {
      read: true
    },
  });
}

// COUNT UNREAD
export function countUnread(userId: number) {
  return prisma.communicationUser.count({
    where: {
      userId,
      read: false,
    },
  });
}

// DELETE (solo sender)
export function deleteCommunication(id: number) {
  return prisma.communication.delete({
    where: { id },
  });
}