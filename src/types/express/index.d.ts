import 'express';
import type { JwtUser } from '../user';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}
export {};
