# BookHive Library Management System

BookHive is a modern library management system built with React, TypeScript, and Node.js. It provides a comprehensive solution for managing books, user borrowings, and library administration.

## Features

- 📚 Book Management
  - Add, edit, and remove books
  - Barcode/QR code scanning for quick book entry
  - Track book availability and quantities
  - Categorize books by genre

- 👥 User Management
  - Role-based access control (Admin/User)
  - Company email domain restriction
  - Secure authentication system
  - Password reset functionality

- 📖 Borrowing System
  - Borrow and return books
  - Track due dates
  - View borrowing history
  - Automated overdue notifications

- 📱 Modern UI/UX
  - Responsive design
  - Real-time notifications
  - Search and filter capabilities
  - Dashboard with key metrics

## Tech Stack

### Frontend
- React 18
- TypeScript
- Redux Toolkit
- TailwindCSS
- Vite
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- WebSocket
- JWT Authentication

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn
- Docker (optional)

## Installation

1. Clone the repository:
bash
git clone https://github.com/anevski-stefan/bookhive.git
cd bookhive

2. Install dependencies:
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Update the variables with your configuration

4. Start the development servers:
```bash
# Start backend server
cd server
npm run dev

# Start frontend development server
cd client
npm run dev
```

## Docker Deployment

The application includes Docker configuration for easy deployment:

```bash
docker-compose up -d
```

This will start the frontend, backend, and PostgreSQL database services.

## Project Structure

```
bookhive/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── features/      # Redux slices and features
│   │   ├── services/      # API services
│   │   └── store/         # Redux store configuration
│   └── ...
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   └── ...
└── docker-compose.yml     # Docker composition file
```