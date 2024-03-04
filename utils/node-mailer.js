module.exports = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.APP_PASSWORD,
    },
};