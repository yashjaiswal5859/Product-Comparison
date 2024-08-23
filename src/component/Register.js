import React, { useState } from 'react';
import './Register.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [otpData, setOtpData] = useState({
    email: '',
    otp: ''
  });

  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOtpChange = (e) => {
    const { name, value } = e.target;
    setOtpData({
      ...otpData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const userCheckResponse = await axios.post('http://localhost:5000/api/auth/check-user', { email });
      if (userCheckResponse.status === 200) {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate random 6-digit OTP
        setGeneratedOtp(otp);

        setTimeout(async () => {
          try {
            await axios.post('http://localhost:5000/api/email/send-email', {
              email,
              subject: 'Your OTP Code',
              text: `Your OTP code is ${otp}`
            });
          } catch (error) {
            console.error('Error sending OTP:', error);
            setInfo(null);
            setError('Error sending OTP');
          }
          }, 0);

        console.log('OTP sent to email');
        setError(null);
        setInfo('OTP sent to email. Please check your email.');
        setIsOtpSent(true);
      } else {
        setError('User already exists');
      }
    } catch (error) {
      console.error('Error checking user or sending OTP:', error);
      setInfo(null);
      setError(error.response?.data?.message || 'Error sending OTP');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const { otp } = otpData;

    if (parseInt(otp) === generatedOtp) {
      try {
        await axios.post('http://localhost:5000/api/auth/register', formData);
        console.log('User registered successfully');
        const name=formData.name;
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setOtpData({
          email: '',
          otp: ''
        });
        setError(null);
        setInfo('User registered successfully');
        setIsOtpSent(false);
        setGeneratedOtp(null);
        navigate('/product', { state: { userName: name } }); // Navigate to /product with state

      } catch (error) {
        console.error('Error registering user:', error);
        setInfo(null);
        setError('Error registering user');
      }
    } else {
      setError('Invalid OTP');
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      {!isOtpSent ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required  
            />
          </div>
          <button type="submit">Send OTP</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {info && <p style={{ color: 'green' }}>{info}</p>}
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <div className="form-group">
            <label htmlFor="otp">OTP</label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={otpData.otp}
              onChange={handleOtpChange}
              required
            />
          </div>
          <button type="submit">Verify OTP</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {info && <p style={{ color: 'green' }}>{info}</p>}
        </form>
      )}
    </div>
  );
};

export default Register;
