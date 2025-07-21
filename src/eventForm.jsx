import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

import createEventDefault from './assets/pixil-frame-4.png';
import createEventClicked from './assets/pixil-frame-5.png';



import homeEventDefault from './assets/home1.png';
import homeEventClicked from './assets/home2.png';

function EventForm() {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(''); 
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [invitees, setInvitees] = useState('');

  const navigate = useNavigate();
  
  const [createPressed, setCreatePressed] = useState(false);
  
  const [homePressed, setHomePressed] = useState(false);

  /* get the creator email*/
  let creatorEmail = '';
  try {
        const token = localStorage.getItem('token');
        if (token) {
              const decoded = jwtDecode(token);
              creatorEmail = decoded.email;
              
        } else {
          console.error('❌ Token not found in localStorage');
        }
  } catch (e) {
          console.error('❌ Failed to decode token:', e);
        }

  const submitEvent = (e) => {
    e.preventDefault();

    axios.post('http://localhost:8080/createEvent', {name, startDate, endDate, startTime, endTime, invitees, creatorEmail})
    .then(() => {
          console.log('Event Created Successfully');
          console.log('Navigating to eventPage with:', { name, creatorEmail });

          navigate('/eventPage', {
            state: {
              name,
              user_email: creatorEmail,
            }
          });
    })
    .catch((error) => {
          if (error.response && error.response.status === 409) {
            console.log('Event already exists:', error.response.data)
          } else {
            console.error('Event creation failed:', error)
          }
    })
  }

  return (
    
      <div>

          <button
            type="button"
            className="home-button"
            onMouseDown={() => setHomePressed(true)}
            onMouseUp={() => {
              setHomePressed(false);
              navigate('/home');
            }}
            onMouseLeave={() => setHomePressed(false)}
          >
            <img
              src={homePressed ? homeEventClicked : homeEventDefault}
              alt="Go Home"
            />
          </button>

          <form className="event" onSubmit={submitEvent}>
          <div className='eventName'>
              <label htmlFor='name-event'>Event Name</label>
              <input id="name-event" type="text" value={name} onChange={(e) => setName(e.target.value)} required/>

          </div>

          <div className='date'>
              <div className = 'start'>
                <label htmlFor="start-date">Start Date</label>
                <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required/>
              </div>
              

              <div className = 'end'>
                <label htmlFor="end-date">End Date</label>
                <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required/>
              </div>
              
          </div>

          <div className='time'>

              <div className='first'>
                  <label htmlFor="start-time">Start Time</label>
                  <input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required/>

              </div>
              
              <div className='second'>
                  <label htmlFor="end-time">End Time</label>
                  <input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required/>
              </div>
            
          </div>


          <div className='invitees-block'>
              <label htmlFor="invitees">Invitee Emails (comma-separated)</label>
              <textarea id="invitees" type="email"  placeholder="email1@example.com, email2@example.com"  value={invitees} onChange={(e) => setInvitees(e.target.value)} required></textarea>
          </div>

          <button
              type="submit"
              className="create-button"
              onMouseDown={() => setCreatePressed(true)}
              onMouseUp={() => setCreatePressed(false)}
              onMouseLeave={() => setCreatePressed(false)}
            >
              <img
                  src={createPressed ? createEventClicked : createEventDefault}
                  alt="Create Event"
                />

            </button>

          </form>




      </div>
      
    
  );
}

export default EventForm;
