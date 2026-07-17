import jwt from 'jsonwebtoken';


const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (toEmail, username, token) => {
    try {

        const verificationUrl = `http://localhost:${process.env.PORT || 5000}/users/verify/${token}`;

        const mailOptions = {
            from: '"Write On App" <welcome@writeonapp.com>',
            to: toEmail,
            subject: 'Welcome to Write On!',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Hi ${username},</h2>
                    <p>Your account has been successfully created.</p>
                    <p>Please click the link below to verify your email address and activate your account:</p>
                    <br>
                    <p style="margin: 20px 0;">
                        <a href="${verificationUrl}" style="background-color: #263b56; color: #94a3b8; font-size: 20px; font-weight: bold; padding: 20px 20px; text-decoration: none; border-radius: 5px;">
                            Verify Email
                        </a>
                    </p>
                    <br>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${verificationUrl}</p>
                    <br>
                    <p>- The Write On Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email send successfully:', info.messageId);
        return info;
    } catch (err) {
        console.error('Failed to dispatch notification email:', err);
    }
};

const sendPasswordResetEmail = async (toEmail, token) => {
    try {
        const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

        const mailOptions = {
            from: '"Write On App" <welcome@writeonapp.com>',
            to: toEmail,
            subject: 'Reset your Write On Password',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset the password for your Write On account.</p>
                    <p>Click the button below to choose a new password. This link will expire in 1 hour.</p>
                    <br>
                    <p style="margin: 20px 0;">
                        <a href="${resetUrl}" style="background-color: #263b56; color: #94a3b8; font-weight: bold; padding: 30px 30px; text-decoration: none; border-radius: 5px;">
                            Reset Password
                        </a>
                    </p>
                    <br>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <br>
                    <p>- The Write On Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent succssfully');
    } catch (err) {
        console.error('Failed to dispatch password reset email:', err);
    }
};

const sendGroupInviteEmail = async (toEmail, groupName, ownerName, groupId) => {

    try {

        const inviteToken = jwt.sign(
            { email: toEmail, groupId: groupId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        const inviteUrl = `http://localhost:3000/accept-invite?token=${inviteToken}`;

        const mailOptions = {
            from:'"Write On App" <welcome@writeonapp.com>',
            to: toEmail,
            subject: `You've been invited to join ${groupName} on Write On!`,
            html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin 0 auto;">
                <h2>You've been invited!</h2>
                <p><strong>${ownerName}</strong> invites you to join the group <strong>${groupName}</strong>. Click the button below to view your invitation and get started.</p>
                <div style="margin: 30px 0;">
                    <a href="${inviteUrl}" style="background-color: #263b56; color: #94a3b8; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        View Invitation
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p>Happy writing!</p>
                <br>
                <p>- The Write On Team</p>
            </div>
            `
        }

       

    } catch (err) {
        console.error(`Failed to send invitation email to: ${toEmail} - Error:`, err);
    }

};

module.exports = { sendConfirmationEmail, sendPasswordResetEmail, sendGroupInviteEmail };