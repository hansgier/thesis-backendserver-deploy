if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
require('./utils/deleteExpiredMessages');
require('express-async-errors');

const allowedOrigins = [
    "localhost:5173",
    "localhost:5000",
    "ormocpis.vercel.app",
];

// ------------------- IMPORTS ------------------- //
const cors = require('cors');
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cookie', 'Connection', 'User-Agent', 'Host', 'Content-Length', 'Accept-Encoding'],
};
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { cloudinaryConfig } = require('./config/cloudinaryConfig');
const express = require('express');
const app = express();
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const fileUpload = require("express-fileupload");

const notFoundMiddleware = require('./middlewares/not-found');
const errorHandlerMiddleware = require('./middlewares/error-handler');

const db = require('./models');

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const barangayRouter = require('./routes/barangayRoutes');
const projectRouter = require('./routes/projectRoutes');
const commentRouter = require('./routes/commentRoutes');
const reactionRouter = require('./routes/reactionRoutes');
const announcementRouter = require('./routes/announcementRoutes');
const populateRouter = require('./routes/1populateRoutes');
const chatRouter = require('./routes/chatRoutes');
const contactRouter = require('./routes/contactRoutes');
const mediaRouter = require('./routes/mediaRoutes');

// ------------------- MIDDLEWARES ------------------- //

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.urlencoded({ extended: true }));

// ------------------- DATABASE SYNC ------------------- //
db.sequelize.sync({ force: false }).then(() => {
    console.log('Database connection has been established successfully.');
    console.log('Re-sync done.');
}).catch(err => console.log('Unable to sync database connection: ' + err));

// ------------------- ROUTES ------------------- //

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/barangays', barangayRouter);
app.use('/api/projects', projectRouter);
app.use('/api/comments', commentRouter);
app.use('/api/reactions', reactionRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/populate', populateRouter);
app.use('/api/conversations', chatRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/media', mediaRouter);


// ------------------- ERROR MIDDLEWARES ------------------- //

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// ------------------- PORT ------------------- //

const port = process.env.PORT || 5000;

// ------------------- START SERVER------------------- //
const startServer = async () => {
    try {
        app.listen(port);
        console.log(`Server listening on port ${ port }...`);
    } catch (e) {
        console.error(`Failed to start the server on port ${ port }`, e);
        process.exit(1);
    }
};

startServer();
