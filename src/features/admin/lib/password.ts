import crypto from 'crypto'

const KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':')

  if (!salt || !storedHash) {
    return false
  }

  const storedHashBuffer = Buffer.from(storedHash, 'hex')
  const suppliedHashBuffer = crypto.scryptSync(password, salt, KEY_LENGTH)

  if (storedHashBuffer.length !== suppliedHashBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(storedHashBuffer, suppliedHashBuffer)
}
