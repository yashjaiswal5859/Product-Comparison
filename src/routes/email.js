const express = require('express');
const router = express.Router();
const sendEmail = require('./sendEmail.js');



router.post('/send-email', async (req, res) => {
    const { email, subject, text } = req.body;
    console.log(email);
    try {
      const info = await sendEmail({ email, subject, text });
      console.log('Email sent:', info.response);
      console.log(email, subject, text, info);
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Error sending email' });
    }
  });
  
module.exports = router;
