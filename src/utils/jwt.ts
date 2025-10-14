import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { JwtUser } from '../types/user';

const accessSecret  = process.env.JWT_ACCESS_SECRET  as string;
const refreshSecret = process.env.JWT_REFRESH_SECRET as string;

export const signAccessToken = (payload: JwtUser, opts: SignOptions = {}) =>
  jwt.sign(payload, accessSecret, { expiresIn: '15m', ...opts });

export const signRefreshToken = (payload: Pick<JwtUser,'id'>, opts: SignOptions = {}) =>
  jwt.sign(payload, refreshSecret, { expiresIn: '7d', ...opts });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, accessSecret) as JwtUser & JwtPayload;
