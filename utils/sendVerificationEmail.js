const { sendEmail } = require("./sendEmail");
require("dotenv").config();
const sendVerificationEmail = async ({ name, email, token, origin }) => {
    const verifyEmail = `${ origin }/verify-email?token=${ token }&email=${ email }`;
    const message = `<p>Please confirm your email by clicking on the following link : 
    <a href="${ verifyEmail }">Verify Email</a> </p>`;

    try {
        await sendEmail({
            email_type: "Verification Email",
            to: email,
            subject: 'Email Confirmation',
            html: `<h4> Hello, ${ name }</h4>
            ${ message }
            `,
        });
    } catch (e) {
        console.error('Error sending verification email:', e);
    }
};

module.exports = {
    sendVerificationEmail,
};