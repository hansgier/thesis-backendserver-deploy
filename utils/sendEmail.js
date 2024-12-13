const nodemailer = require('nodemailer');
const nodeMailerConfig = require('./node-mailer');
require("dotenv").config();

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

    try {
        // Send the email using the transporter
        await transporter.sendMail({
            from: {
                name: 'Ormoc City Project Information System',
                address: process.env.SMTP_EMAIL,
            },
            to,
            subject,
            html,
        });
        console.log(`${ email_type } sent successfully!`);
    } catch (error) {
        console.error(`Error sending ${ email_type }:`, error);
        throw error; // Re-throw the error so it can be handled by the caller
    }
};

module.exports = { sendEmail };