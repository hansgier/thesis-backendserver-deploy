const nodemailer = require('nodemailer');
const nodeMailerConfig = require('./node-mailer');

/**
 * Sends an email using the provided parameters.
 *
 * @param {Object} options - The options for sending the email.
 * @param {string} options.email_type - The type of email.
 * @param {string} options.to - The recipient's email address.
 * @param {string} options.subject - The subject of the email.
 * @param {string} options.html - The HTML content of the email.
 */
const sendEmail = async ({ email_type, to, subject, html }) => {
    // Create a nodemailer transporter using the configuration
    const transporter = nodemailer.createTransport(nodeMailerConfig);

    // Send the email using the transporter
    await transporter.sendMail({
        from: {
            name: 'ORMOC Project Tracking System',
            address: process.env.SMTP_EMAIL,
        },
        to,
        subject,
        html,
    }, (err) => {
        // Log any errors that occur during sending
        if (err) {
            console.log(err);
        } else {
            console.log(`${ email_type } sent successfully!`);
        }
    });
};

module.exports = sendEmail;