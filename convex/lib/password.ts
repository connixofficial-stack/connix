import bcrypt from "bcryptjs";

const LEGACY_PREFIX = "sh_";
const BCRYPT_ROUNDS = 10;

export function legacyHashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.codePointAt(i);
    if (char === undefined) {
      continue;
    }
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  return `${LEGACY_PREFIX}${Math.abs(hash).toString(16)}_${password.length}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!hashedPassword) {return false;}
  if (hashedPassword.startsWith(LEGACY_PREFIX)) {
    return legacyHashPassword(password) === hashedPassword;
  }
  return bcrypt.compareSync(password, hashedPassword);
}
