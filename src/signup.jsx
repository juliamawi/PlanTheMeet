import image from './assets/PlanTheMeet.png';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmpassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();

    if (password !== confirmpassword) {
      setErrorMsg("Passwords do not match.");
      return;
    } else {
      setErrorMsg('');
    }

    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/processsignup`, { email, password })
      .then((response) => {
        if (response.status === 201) {
          console.log('Signup successful', response.data);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          navigate('/');
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          console.log('User already exists:', error.response.data);
          setErrorMsg('User already exists. Please log in.');
        } else {
          console.error('Signup error:', error);
          setErrorMsg('Signup failed. Please try again.');
        }
      });
  };

  return (
    <div className="signup-page">
      <div className="signup-block">
        <div className="logo-block2">
          <img src={logo} alt="three characters" />
        </div>

        <form onSubmit={submitHandler} className="signup">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="text"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor="confirmpassword">Confirm Password</label>
          <input
            id="confirmpassword"
            type="password"
            name="confirmpassword"
            value={confirmpassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {errorMsg && <p className="error-message">{errorMsg}</p>}

          <button type="submit" className="signup-submit">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
