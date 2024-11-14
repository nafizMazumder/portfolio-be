const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OAuth2 Client Setup for Gmail API
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
});

// Create a function to send an email using Gmail API
const sendEmail = async (to, subject, message) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const rawMessage = createRawMessage(to, subject, message);

        // Send the email
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage,
            },
        });

        return res.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email.');
    }
};

// Helper function to encode the email message in base64
const createRawMessage = (to, subject, message) => {
    const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `Content-Transfer-Encoding: 7bit`,
        '',
        message,
    ];

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return encodedEmail;
};

// Contact form route
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const subject = `Portfolio Contact: ${name}`;
        const to = 'nafizuddin80@gmail.com'; // Recipient email address

        const emailResponse = await sendEmail(to, subject, `You have a new message from ${name} (${email}):\n\n${message}`);

        console.log('Email sent:', emailResponse);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Error sending email' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
