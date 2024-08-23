// src/components/EmailForm.jsx
import React, { useState } from 'react';

const EmailForm = ({ setEmailSent }) => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous error message

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, subject, text }),
    };

    try {
      const response = await fetch('/send-email', options);
      const data = await response.json();
      if (response.ok) {
        console.log('Email sent:', data);
        setEmailSent(true);
      } else {
        console.error('Error response:', data);
        setError(data.error || 'Error sending email. Please try again.');
      }
    } catch (error) {
      
      console.error('Error sending email:', error);
      setError('Error sending email. Please try again. notfound');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Subject:</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <label>Message:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        ></textarea>

        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default EmailForm;
