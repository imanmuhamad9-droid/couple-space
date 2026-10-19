import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = 'rahasia-super-aman-untuk-jwt'
const encodedKey = new TextEncoder().encode(secretKey)

export async function createSession() {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await new SignJWT({ loggedIn: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)

  ;(await cookies()).set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function verifySession() {
  const cookie = (await cookies()).get('session')?.value
  if (!cookie) return false
  try {
    await jwtVerify(cookie, encodedKey, { algorithms: ['HS256'] })
    return true
  } catch (error) {
    return false
  }
}