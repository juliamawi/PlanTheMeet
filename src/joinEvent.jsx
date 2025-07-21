import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';


import homeEventDefault from './assets/home1.png';
import homeEventClicked from './assets/home2.png';


function JoinEvent() {
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();
    const [homePressed, setHomePressed] = useState(false);
    
    let userEmail = '';
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      userEmail = decoded.email;
    } catch (e) {
      console.error('❌ Failed to decode token in JoinEvent:', e);
    }
  

  useEffect(() => {
    axios.get('http://localhost:8080/getAllEvents').then((res) => {
      const allEvents = res.data;
      const invitedEvents = allEvents.filter((event) => {
        const invitees = event.invitees ? event.invitees.split(',') : [];
        return invitees.includes(userEmail) || event.creator_email === userEmail;
      });
      setEvents(invitedEvents);
    });
  }, []);

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
      
      <div className="join-event-page">
      
      <h2>Events You're Invited To</h2>
      <p>Please click on an event below to join:</p>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <button className='eventButtons'
            onClick={() =>
                navigate('/eventPage', {
                state: {
                    name: event.name,
                    user_email: userEmail,
                },
                })
            }
            >
            {event.name}
            </button>

          </li>
        ))}
      </ul>
    </div>




    </div>
    
  );
}

export default JoinEvent;
