const sendEmail = require('./sendEmail');

/**
 * Sends a password reset email to the specified email address.
 *
 * @param {Object} options - The options for sending the password reset email.
 * @param {string} options.name - The name of the recipient.
 * @param {string} options.email - The email address of the recipient.
 * @param {string} options.token - The password reset token.
 * @param {string} options.origin - The origin URL of the application.
 * @returns {Promise<void>} - A promise that resolves when the email is sent.
 */
const sendResetPasswordEmail = async ({ name, email, token, origin }) => {
    // Generate the reset password URL with the token and email as query parameters
    const resetPasswordUrl = `${ origin }/auth/reset-password?token=${ token }&email=${ email }`;

    // Send the password reset email
    await sendEmail({
        email_type: 'Password reset email',
        to: email,
        subject: 'Reset Password',
        html: `
            <h1>Reset Password</h1>
            <p>Hello ${ name }, please click the following link to reset your password:</p>
            <a href='${ resetPasswordUrl }'>${ resetPasswordUrl }</a>`,
    });
};

module.exports = sendResetPasswordEmail;