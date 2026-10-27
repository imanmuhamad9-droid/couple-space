import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = 'rahasia-super-aman-untuk-jwt'
const encodedKey = new TextEncoder().encode(secretKey)

export async function createSession() {
  // 10 MENIT
  // 10 * 60 * 1000 = 600.000 milidetik
  const sessionDuration = 10 * 60 * 1000 
  const expires = new Date(Date.now() + sessionDuration)
  
  const session = await new SignJWT({ loggedIn: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m') // <--- Set 10 menit
    .sign(encodedKey)

  ;(await cookies()).set('session', session, {
    expires: expires,
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