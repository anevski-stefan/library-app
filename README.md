# BookHive - Library Management System

BookHive is a modern library management system built with React, TypeScript, and Node.js. It provides a comprehensive solution for managing books, user borrowing, and book requests in a library setting.

## Features

- 📚 Book Management
  - Add, edit, and remove books
  - Barcode/QR code scanning for quick book entry
  - Track book availability and quantities
  - Categorize books by genre

- 👥 User Management
  - Role-based access control (Admin/User)
  - User authentication and authorization
  - Personal borrowing history

- 📱 Smart Features
  - Real-time notifications
  - Book request system
  - Due date reminders
  - Overdue notifications
  - Book availability tracking

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- TailwindCSS for styling
- Vite as build tool
- WebSocket for real-time notifications

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Sequelize ORM
- WebSocket for real-time communication
- JWT for authentication

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anevski-stefan/library-app.git
cd library-app
```

2. Install dependencies:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:

Create `.env` files in both client and server directories:

Server `.env`:
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=library_db
JWT_SECRET=your_jwt_secret
```

4. Start the development servers:

```bash
# Start the backend server
cd server
npm run dev

# Start the frontend development server
cd client
npm run dev
```

### Docker Setup

Alternatively, you can use Docker Compose to run the entire application:

```bash
docker-compose up --build
```

## License

This project is licensed under the [MIT License](./LICENSE) - see the [LICENSE](./LICENSE) file for details.