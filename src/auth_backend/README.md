# Game Collection Auth Backend

Global authentication and collection management backend for the Game Collection application.

## Features

- User authentication (register, login, refresh token)
- GPU endpoint management for local processing
- Collection storage with file-based image storage
- PostgreSQL database
- JWT-based authentication
- Docker support with multi-stage builds
- Environment-based configuration

## Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- PostgreSQL (if running locally without Docker)

### Environment Variables

Copy the `.env.example` file to `.env` and adjust the values:


Key variables:
```
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=auth_db
DB_PORT=5432

# Application Database URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_MINUTES=10080

# Server Configuration
HOST=0.0.0.0
PORT=8080

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Running with Docker

1. Build and start the services:
```bash
docker-compose up --build
```

The services will be available at:
- API: `http://localhost:8080`
- API Documentation: `http://localhost:8080/docs`
- PostgreSQL: `localhost:5432`


## API Endpoints

### Authentication
- `POST /auth/register` - Register new user with email, password, and GPU endpoint
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `PUT /auth/gpu-endpoint` - Update GPU endpoint URL

### Collection
- `GET /collection/items` - Get user's collection
- `POST /collection/items` - Add item to collection
- `DELETE /collection/items/{item_id}` - Remove item from collection
- `GET /collection/items/{item_id}/image` - Get base64 encoded image for a collection item

## Development

### Database Schema

The database schema is automatically created on first run. For manual initialization:

```python
from database import init_db
init_db()
```

### Database Migrations

The application uses Alembic for database migrations. Migrations are automatically run when the server starts.

#### Running Migrations Manually

You can run migrations manually using the provided script:

```bash
# From the auth_backend directory
./run_alembic.py
```

Or directly using Alembic:

```bash
# From the auth_backend directory
alembic upgrade head
```

#### Creating New Migrations

To create a new migration:

```bash
# From the auth_backend directory
alembic revision -m "description of changes"
```

Then edit the generated migration file in the `alembic/versions` directory.

### Adding New Endpoints

1. Create new router in `auth/` directory
2. Add models to `models/`
3. Add schemas to `models/schemas.py`
4. Include router in `main.py`

## Security Notes

For production:
1. Generate a secure `JWT_SECRET_KEY`
2. Update `ALLOWED_ORIGINS` to your frontend domain
3. Use HTTPS
4. Set secure cookie options
5. Configure proper PostgreSQL credentials
6. Use strong passwords for database users
7. Consider using environment-specific .env files
8. Review Docker security best practices

## Docker Configuration

The application uses a multi-stage Docker build for smaller image size and better security:
- Builder stage: Compiles dependencies
- Runtime stage: Minimal image with only required components
- Non-root user for security
- Environment variable support
- Health checks for PostgreSQL
- Automatic container restart
- Named volumes and networks
- Persistent image storage with Docker volumes

## Image Storage

Images are stored on the filesystem instead of in the database:
- Images are saved to `/src/data/images` in the container
- Each user has their own directory for images
- The database stores the relative path to the image file
- Images are automatically deleted when collection items are removed
- A Docker volume (`auth_images`) ensures images persist between container restarts
