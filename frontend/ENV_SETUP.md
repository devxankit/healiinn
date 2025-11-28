# Frontend Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Backend API Base URL
# For development (local): http://localhost:5000/api
# For production: https://your-backend-domain.com/api
# Note: Do NOT include trailing slash
VITE_API_BASE_URL=http://localhost:5000/api
```

## Development Setup

1. Copy the example:
   ```bash
   # In frontend directory
   echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
   ```

2. Make sure your backend is running on port 5000

## Production Setup

1. Update `.env` with your production backend URL:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

2. Rebuild the frontend:
   ```bash
   npm run build
   ```

## Important Notes

- All environment variables in Vite must be prefixed with `VITE_`
- After changing `.env`, restart the development server
- Never commit `.env` file to version control (it's already in `.gitignore`)

