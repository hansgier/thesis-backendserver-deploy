if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
require('express-async-errors');

// ------------------- IMPORTS ------------------- //

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();

const notFoundMiddleware = require('./middlewares/not-found');
const errorHandlerMiddleware = require('./middlewares/error-handler');

const db = require('./models');

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const barangayRouter = require('./routes/barangayRoutes');
const projectRouter = require('./routes/projectRoutes');
const commentRouter = require('./routes/commentRoutes');
const reactionRouter = require('./routes/reactionRoutes');
const reportRouter = require('./routes/reportRoutes');
const announcementRouter = require('./routes/announcementRoutes');
const populateRouter = require('./routes/1populateRoutes');

// ------------------- MIDDLEWARES ------------------- //

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
app.use('/api/reports', reportRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/populate', populateRouter);


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
