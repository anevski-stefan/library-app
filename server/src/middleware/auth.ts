import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const auth = (allowedRoles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No authentication token, access denied' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      req.user = decoded;

      if (allowedRoles && allowedRoles.length > 0) {
        console.log('Auth check:', {
          userRole: decoded.role,
          allowedRoles,
          hasPermission: allowedRoles.includes(decoded.role)
        });
        
        if (!allowedRoles.includes(decoded.role)) {
          return res.status(403).json({ 
            message: 'You do not have permission to perform this action',
            requiredRoles: allowedRoles,
            userRole: decoded.role
          });
        }
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Token is invalid' });
    }
  };
};
