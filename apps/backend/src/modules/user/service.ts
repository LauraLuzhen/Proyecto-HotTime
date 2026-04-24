import * as repo from "./repository";
import { hashPassword, comparePassword } from "../../lib/hash";

export async function createUser(data: any) {
  // 🔐 HASHEAR PASSWORD
  const hashedPassword = await hashPassword(data.password);

  return repo.create({
    ...data,
    password: hashedPassword,
    birthDate: new Date(data.birthDate),
    initDate: new Date(data.initDate),
  });
}

export async function getUsers() {
  return repo.findAll();
}