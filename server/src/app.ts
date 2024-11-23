import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { wsService } from './services/websocketService';
import { sequelize } from './config/database';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import borrowRoutes from './routes/borrowRoutes';
import notificationRoutes from './routes/notificationRoutes';
import bookRequestRoutes from './routes/bookRequestRoutes';
import { startScheduledTasks } from './utils/scheduler';
import User from './models/User';
import BookRequest from './models/BookRequest';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/book-requests', bookRequestRoutes);

const PORT = process.env.PORT || 5000;

// Initialize associations
const models = {
  User,
  BookRequest
};

Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    await sequelize.sync(); // This will create the tables if they don't exist
    console.log('Database synchronized');
    
    // Initialize WebSocket service
    wsService.initialize(httpServer);
    
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    startScheduledTasks();
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
