import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    interface Request {
      body: any;
      params: any;
    }
  }
}
