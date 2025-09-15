# Ormoc City Project Information System — Backend Server

This repository contains the backend server for the Ormoc City Project Information System (PIS), a thesis project that aims to bridge the communication gap between residents and the city administration regarding local infrastructure projects.

The server exposes a RESTful API that powers the web application by handling authentication, user and role management, project and announcement publishing, citizen feedback (comments and reactions), media handling, simple chat/conversation features, and integrations such as Cloudinary for asset storage and email for notifications.

## Thesis Summary
This study focused on developing a web-based infrastructure project information system for the Ormoc City Planning and Development Office to address the significant communication gap between residents and the city administration regarding local projects. The existing methods of project information dissemination—including word-of-mouth, social media, announcement boards, and the city website—proved inefficient, resulting in limited public awareness of ongoing projects in various barangays. Additionally, the absence of a streamlined digital feedback mechanism required residents to physically visit government offices to provide input or file complaints.

The system was implemented using a three-tier software architecture pattern. The technology stack comprised React and Tailwind CSS for the frontend interface, Node.js and Express for the backend services, MySQL for database management, Sequelize as the ORM, and integrated services such as Cloudinary and Git for development and deployment.

## Architecture
- Presentation tier: React + Tailwind CSS (separate frontend repository)
- Application tier: Node.js + Express (this repository)
- Data tier: MySQL managed via Sequelize ORM
- Supporting services:
  - Cloudinary for image and media storage
  - Redis for caching/rate limiting and temporary data
  - Nodemailer for email (verification, password reset)

## Tech Stack
- Runtime: Node.js 20.x
- Framework: Express 4
- Database: MySQL (mysql2 driver) + Sequelize ORM
- Caching/Queues: Redis (via ioredis/redis packages)
- Auth: JWT-based authentication with httpOnly cookies
- File Uploads: Multer + Sharp + Cloudinary
- Validation: Joi, validator
- Logging/Security: morgan, helmet, cors, rate-limiter-flexible

## Repository Structure
- server.js — App entry point and HTTP server
- config/ — Third-party service configuration (Cloudinary, multer, Redis, etc.)
- controllers/ — Request handlers for various resources
- routes/ — Express routers (e.g., auth, users, projects, comments, announcements, media, chat)
- models/ — Sequelize models and associations
- db/ — Database configuration (env-driven)
- middlewares/ — Error handling, authentication, caching, etc.
- services/ — Reusable application services
- utils/ — Helpers (email, scheduled tasks, etc.)
- public/, uploads/ — Public/static or temporary upload storage

## Environment Variables
Create a .env file in the project root. Below is a reference template based on the current codebase.

Note: Never commit real secrets to version control.

```
# Server
PORT=5000
NODE_ENV=development

# JWT / Cookies
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=replace_with_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=replace_with_cookie_signing_secret

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ormoc_pis

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis
REDIS_URL=redis://localhost:6379
# Or configure using separate host/port variables if your config/redis uses them.

# Email (Nodemailer)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Ormoc PIS" <no-reply@yourdomain.com>

# Client origins (used by CORS and/or frontend)
CLIENT_URL=http://localhost:5173
```

Some variables are inferred from code usage (e.g., JWT and email settings). If a variable isn't used directly in your fork, you can omit it, but the sections above reflect common settings for this project shape.

## Installation and Setup
Prerequisites:
- Node.js 20.x
- MySQL 8.x (or compatible)
- Redis (optional but recommended if enabled in your config)
- Cloudinary account for media handling (optional for local development if you stub uploads)

Steps:
1. Clone the repository.
2. Navigate into the project directory.
3. Create a .env file with the variables listed above.
4. Install dependencies:
   - npm install
5. Prepare the database:
   - Create a MySQL database that matches DB_NAME.
   - Ensure DB user has privileges for the database.
6. Start the development server:
   - npm run dev
7. For production:
   - npm run start

The server starts by default on PORT or 5000. A health check is available at GET /. You should see "Server live".

## Available Scripts
- npm run dev — Start with nodemon (auto-reload on changes)
- npm start — Start the server with Node
- npm test — Placeholder

## API Overview
The base path for the API is /api. Key route groups (see routes/ and controllers/ for details):
- Auth: /api/auth
  - POST /register, POST /login, DELETE /logout, POST /forgot-password, POST /reset-password, POST /refresh, GET /verify-email
- Users: /api/users
- Barangays: /api/barangays
- Projects: /api/projects
- Comments: /api/comments
- Reactions: /api/reactions
- Announcements: /api/announcements
- Media: /api/media
- Conversations/Chat: /api/conversations
- Contacts: /api/contacts
- Populate: /api/populate (development/administrative utilities)

Many endpoints require authentication via JWT stored in httpOnly cookies. See middlewares/authentication for details.

## Database Sync and Migrations
This project uses Sequelize. The current startup script performs sequelize.sync({ force: false }) on boot, creating tables if they do not exist.

If you prefer migrations, sequelize-cli is included in devDependencies. You can adopt migrations/seeds by adding a proper Sequelize CLI configuration and scripts.

## CORS
Allowed origins are configured in server.js. By default, the following are permitted:
- localhost:5173
- localhost:5000
- ormocpis.vercel.app

Adjust allowedOrigins in server.js to match your deployment domains and development hosts.

## File Uploads and Media
Uploads are handled using Multer and may be processed with Sharp, then uploaded to Cloudinary. Ensure Cloudinary credentials are present in .env. See:
- config/cloudinaryConfig.js
- routes/projectRoutes.js, routes/commentRoutes.js
- utils/helpers/* for media-related helpers

## Email and Verification
Nodemailer is used to send verification and password reset emails. Configure SMTP settings in the .env. See utils/sendEmail.js and utils/sendVerificationEmail.js.

## Redis Usage
Redis may be used for caching, rate limiting, or ephemeral data. Ensure your Redis server is running and connection settings match your environment. See config/redis (and usage in controllers) for details.

## Development Notes
- Error handling middleware is registered globally (middlewares/not-found, middlewares/error-handler).
- Logging is handled with morgan.
- JSON parsing, URL encoding, and cookie parsing are enabled.
- Scheduled/maintenance tasks may live under utils (e.g., utils/deleteExpiredMessages).

## Security Considerations
- Keep JWT secrets, SMTP credentials, and Cloudinary keys secure.
- Use HTTPS in production and set secure cookie flags appropriately.
- Validate and sanitize inputs (Joi/validator already integrated in code).
- Review CORS and allowed origins before deployment.

## License
This project is licensed under the ISC License (see package.json). You may choose a different license as appropriate for academic submission requirements.

## Acknowledgments
- Ormoc City Planning and Development Office for the problem context
- Open-source libraries and services listed above

## Contact
Author: Hans Gier
For questions regarding this backend or the thesis project, please open an issue or contact the author directly.
