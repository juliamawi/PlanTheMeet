import image from './assets/PlanTheMeet.png'
import logo from './assets/logo.png'
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';



function Login(){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate  = useNavigate();


    const submitLogin = (e) => {
        e.preventDefault();
      
        axios.post('http://localhost:8080/processlogin', { email, password })
          .then((response) => {
            if (response.status === 200 && response.data.token) {
              console.log('Login successful:', response.data);

              localStorage.setItem('token',response.data.token)
              //clear up email and password
              setEmail('');
              setPassword('');
              navigate('/home');  
            } else {
              alert(response.data.message || 'Login failed');
            }
          })
          .catch((error) => {
            console.error('Login error:', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Login failed');
          });
      };
      

    

    return(
        <div className="login-background"> 
            <div className="login-block">
                <div className = "image-box">
                    <img src = {image} alt = "Plan The Meet"></img>
                </div>

                <div className="logo-block">
                    
                    <img src={logo} alt="three characters" />
    
                </div>

                
                <form className="login" onSubmit={submitLogin} >

                    <label htmlFor='email'>Email</label>
                    <input 
                        id="email" 
                        type="email" 
                        className="login-email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required
                    />

                    <label htmlFor='password'>Password</label>

                    <input 
                        id="password" 
                        type="password" 
                        className="login-password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                    />

                    <button type = "submit" className="login-submit">Log In</button>
                   
                    <Link to="/signup" className="SignUp">Sign Up</Link>
                </form>
            </div>
        </div>
    );

}

export default Login