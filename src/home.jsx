import { Link } from 'react-router-dom';
import { useState } from 'react';
import './home.css'; 

import joinEventDefault from './assets/pixil-frame-1.png';
import joinEventClicked from './assets/pixil-frame-0.png';

import newEventDefault from './assets/pixil-frame-3.png';
import newEventClicked from './assets/pixil-frame-2.png';


function Home() {
  const [newPressed, setNewPressed] = useState(false);
  const [joinPressed, setJoinPressed] = useState(false);

  return (
    <div className='home-background'>
      <div className='links'>
        <div>

            <Link
              to='/eventForm'
              onMouseDown={() => setNewPressed(true)}
              onMouseUp={() => setNewPressed(false)}
              onMouseLeave={() => setNewPressed(false)}
            >
              <img
                src={newPressed ? newEventClicked : newEventDefault}
                alt='New Event'
                className='pixel-button'
              />
            </Link>

        </div>
        
        <div>
            <Link
              to='/joinevent'
              onMouseDown={() => setJoinPressed(true)}
              onMouseUp={() => setJoinPressed(false)}
              onMouseLeave={() => setJoinPressed(false)}
            >
              <img
                src={joinPressed ? joinEventClicked : joinEventDefault}
                alt='Join Event'
                className='pixel-button'
              />
            </Link>



        </div>
        
        
      </div>
    </div>
  );
}

export default Home;
