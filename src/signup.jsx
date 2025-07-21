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

  const navigate = useNavigate(); // initialize navigation

  const submitHandler = (e) => {
    e.preventDefault(); // prevent form default submit behavior

    if (password !== confirmpassword) {
      setErrorMsg("Passwords do not match.");
      return;
    } else {
      setErrorMsg('');
    }
    
  
    axios.post('http://localhost:8080/processsignup', { email, password })
      .then((response) => {
        if (response.status === 201){
          console.log('Signup successful', response.data);
          setEmail('');
          setPassword('');
          navigate('/');

        }
        
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          console.log('User already exists:', error.response.data);
        } else {
          console.error('Signup error:', error);
        }
      });
  };


  return (
    <div className="signup-page">
      <div className="signup-block">
      {/* <div style={{ fontSize: '30px', fontWeight: 'bold',color: 'rgb(0, 0, 0)' }}>
        Sign Up
      </div> */}

        <div className="logo-block2">
                            
            <img src={logo} alt="three characters" />
            
        </div>

        <form onSubmit={submitHandler} className="signup">

          <label htmlFor='email'>Email</label>
          <input
            id="email"
            type="text"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor='password'>Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor='confirmpassword'>Confirm Password</label>
          <input
            id="confirmpassword"
            type="password"
            name="password"
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
