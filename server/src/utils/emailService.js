const nodemailer = require('nodemailer');
const User = require('../models/userModel');

const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'yahoo';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('Email config: EMAIL_USER or EMAIL_PASS missing. Emails will fail until set.');
}

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Verify transporter at startup to fail fast and log actionable errors
transporter.verify((err, success) => {
  if (err) {
    console.error('Mail transporter verification failed:', err);
  } else {
    console.log(`Mail transporter is ready (service=${EMAIL_SERVICE})`);
  }
});

const sendMentionEmail = async (toEmail, mentionerName, workspaceId, taskId, taskTitle) => {
  const recipient = await User.findOne({ email: toEmail }).select('emailNotifications');
  if (recipient && recipient.emailNotifications === false) {
    return;
  }

  if (!EMAIL_USER || !EMAIL_PASS) {
    const err = new Error('Email credentials not configured');
    console.error('sendMentionEmail aborted:', err.message);
    throw err;
  }

  const clientUrl = (process.env.CLIENT_URL && process.env.CLIENT_URL !== 'undefined')
    ? process.env.CLIENT_URL
    : 'http://localhost:5173';

  const mailOptions = {
    from: `"SyncNode Notifications" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `You were mentioned in SyncNode`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #001E2B;">Collaboration Alert</h2>
        <p>Hi,</p>
        <p><strong>${mentionerName}</strong> mentioned you in the task: <strong>${taskTitle}</strong>.</p>
        <div style="margin-top: 20px;">
          <a href="${clientUrl}/workspace/${workspaceId}/task/${taskId}"
             style="background: #00ED64; color: #001E2B; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Discussion
          </a>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Mention email sent to ${toEmail} messageId=${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Email error sending to ${toEmail}:`, error);
    throw error; 
  }
};

module.exports = { sendMentionEmail };