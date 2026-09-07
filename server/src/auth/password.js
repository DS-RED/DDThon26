import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

/** bcrypt password hashing (P1). Used by auth and by seed. */

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, config.bcryptRounds);
}

export function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compareSync(plain, hash);
}
