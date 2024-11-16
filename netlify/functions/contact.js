const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
});

const sendEmail = async (to, subject, message) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const rawMessage = createRawMessage(to, subject, message);

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: rawMessage },
        });

        return res.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email.');
    }
};

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
    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const subject = `Portfolio Contact: ${name}`;
        const to = 'nafizuddin80@gmail.com';

        const emailResponse = await sendEmail(to, subject, `You have a new message from ${name} (${email}):\n\n${message}`);

        console.log('Email sent:', emailResponse);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Error sending email' });
    }
});

module.exports.handler = serverless(app);
