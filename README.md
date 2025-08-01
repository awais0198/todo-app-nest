# Todo API - NestJS

A comprehensive Todo management API built with NestJS, TypeORM, and PostgreSQL. Features full CRUD operations, advanced filtering, pagination, and complete Swagger documentation.

## Features

- ✅ **Full CRUD Operations** - Create, Read, Update, Delete tasks
- 📊 **Advanced Filtering** - Filter by status, priority, active status, and search by name
- 📄 **Pagination** - Efficient pagination with metadata
- 🔍 **Sorting** - Sort by multiple fields (name, due date, status, priority, creation date)
- 📚 **Swagger Documentation** - Complete API documentation with examples
- 🛡️ **Validation** - Comprehensive input validation and error handling
- 🐳 **Docker Support** - Easy PostgreSQL setup with Docker Compose
- 🎯 **Statistics** - Task statistics endpoint

## Tech Stack

- **Backend Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Validation**: Class Validator & Class Transformer
- **Documentation**: Swagger/OpenAPI
- **Environment**: Node.js

## Task Schema

```typescript
{
  id: string (UUID)
  name: string (1-255 characters)
  dueDate: Date
  status: 'Pending' | 'Done' | 'In Progress' | 'Paused'
  priority: 'Red' (High) | 'Yellow' (Medium) | 'Blue' (Normal)
  isActive: boolean
  dateOfCreation: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

## API Endpoints

### Tasks
- `POST /tasks` - Create a new task
- `GET /tasks` - Get all tasks with filtering and pagination
- `GET /tasks/:id` - Get a specific task by ID
- `PATCH /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task
- `GET /tasks/stats` - Get task statistics

### Query Parameters for GET /tasks
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status
- `priority` - Filter by priority
- `isActive` - Filter by active status
- `search` - Search by task name
- `sortBy` - Sort field (name, dueDate, status, priority, dateOfCreation)
- `sortOrder` - Sort order (ASC, DESC)

## Quick Start

### 🚀 One Command Setup (Recommended)
```bash
git clone <repository-url>
cd greeka-test
npm run dev
```
That's it! This single command will:
- ✅ Start PostgreSQL database
- ✅ Build the NestJS application  
- ✅ Initialize database with sample data
- ✅ Start the development server with hot reload

### Alternative Setup Methods

#### Development with Docker
```bash
npm run dev        
npm run dev:down   
```

#### Manual Setup (if you prefer local development)
```bash
docker-compose up postgres -d

npm install
cp env.sample .env
npm run db:init

npm run start:dev
```

### 🌐 Access the API
- **API Base URL**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api
- **Statistics Endpoint**: http://localhost:3000/tasks/stats

## Environment Variables

```env
NODE_ENV=development
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=todo_db
```

## API Examples

### Create a Task
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Complete project documentation",
    "dueDate": "2024-12-31",
    "status": "Pending",
    "priority": "Red"
  }'
```

### Get Tasks with Filtering
```bash
# Get all pending tasks with high priority
curl "http://localhost:3000/tasks?status=Pending&priority=Red&page=1&limit=10"

# Search tasks by name
curl "http://localhost:3000/tasks?search=project&sortBy=dueDate&sortOrder=ASC"
```

### Update a Task
```bash
curl -X PATCH http://localhost:3000/tasks/{task-id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress",
    "priority": "Yellow"
  }'
```

## Response Format

### Success Response
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

## Development

```bash
# Primary Commands (Recommended)
npm run dev                   # Start everything (database + API) with Docker
npm run dev:down              # Stop all development containers

# Database Scripts
npm run db:init               # Initialize database with sample data
npm run db:create             # Create database only
npm run db:drop               # Drop database

# Application Scripts (Local Development)
npm install                   # Install dependencies
npm run start:dev             # Development mode with hot reload
npm run start:prod            # Production mode
npm run build                 # Build for production

# Testing & Quality
npm run test                  # Run unit tests
npm run test:e2e              # Run e2e tests
npm run test:cov              # Run tests with coverage
npm run format                # Format code
npm run lint                  # Lint code
```

## Deployment

The API is designed to be easily deployable. Key considerations:

1. **Environment Variables**: Set all required environment variables
2. **Database**: Ensure PostgreSQL is accessible
3. **Port**: Application runs on PORT environment variable (default: 3000)
4. **Swagger**: Available at `/api` endpoint in all environments

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set secure database credentials
- [ ] Configure CORS for your frontend domain
- [ ] Set up SSL/HTTPS
- [ ] Configure logging
- [ ] Set up monitoring

## License

This project is licensed under the MIT License.