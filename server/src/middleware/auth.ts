import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserAttributes } from '../models/User';

export const auth = (roles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserAttributes;
      
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden access' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Please authenticate' });
    }
  };
};
