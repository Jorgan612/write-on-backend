const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.emitWarning.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (toEmail, username) => {
    try {
        const mailOptions = {
            from: '"Write On App" <welcome@writeonapp.com>',
            to: toEmail,
            subject: 'Welcome to Write On!',
            html: `
                <div> style="font-family: sans-serif; padding: 20px; color: #333">
                    <h2>Hi ${username},</h2>
                    <p>Your account has been successfully created.</p>
                    <p>Log in anytime to track your daily word count and make progress towards your writing goals!</p>
                    </br>
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

module.exports = { sendConfirmationEmail };