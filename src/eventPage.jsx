import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

import homeEventDefault from './assets/home1.png';
import homeEventClicked from './assets/home2.png';


function EventPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const name = location.state?.name;
  const userEmail = location.state?.user_email;

  const STORAGE_KEY = `cellModes-${name}-${userEmail}`; /*creates a unique local storage key to store user' availability*/

  const [eventData, setEventData] = useState(null);
  const [mode, setMode] = useState('available');
  const [isDragging, setIsDragging] = useState(false);

  const [homePressed, setHomePressed] = useState(false);
 
  /*update user availability based on local storage*/
  const [cellModes, setCellModes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (_) {
      return {};
    }
  });

  /* fetch data when componenet loads or when name, userEmail and navigate changes */
  useEffect(() => {
    if (!name || !userEmail) {
      navigate('/eventForm');
      return;
    }

    axios.get(`http://localhost:8080/getEventByName?name=${encodeURIComponent(name)}&user_email=${encodeURIComponent(userEmail)}`)
      .then((res) => {
        setEventData(res.data);
        setCellModes(res.data.availability || {});
      })
      .catch((err) => {
        console.error('Fetch failed:', err);
        navigate('/eventForm');
      });
  }, [name, userEmail, navigate]); /*run it when any of these changes*/


  /*whenever cell modes (user availibity data) or storage key changes then save it to local storage*/
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cellModes));
    } catch (_) {}
  }, [cellModes, STORAGE_KEY]);


  /*global event listener that listens to mouse button releases anywhere on pgae*/
  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  if (!eventData) return null; /*render nothing if evenData is null*/

  const startDate = new Date(eventData.start_date);
  const endDate = new Date(eventData.end_date);

  /*gets all dates between these two strings*/
  const getDatesBetween = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  /*calls function above*/
  const dateList = getDatesBetween(startDate, endDate);


  /*gest times in 30 minute increments between start and end time*/
  const getTimeSlots = (start, end) => {
    const slots = [];
    let [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);
  
    let currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);
  
    let endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);
  
    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
      const slotEnd = new Date(currentTime);
  
      const formatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
  
      const timeRange = `${slotStart.toLocaleTimeString('en-US', formatOptions)} - ${slotEnd.toLocaleTimeString('en-US', formatOptions)}`;
      slots.push(timeRange);
    }
  
    return slots;
  };
  
  /*calls code above to get the time slots*/
  const timeSlots = getTimeSlots(eventData.start_time, eventData.end_time);

  const handleCellClick = (date, timeSlot) => {
    //unique key for each cell
    const cellKey = `${date}-${timeSlot}`;


    //update cell mode using privous states
    //react automatically gives the previous state
    setCellModes((prevCellModes) => {
      const currentStatus = prevCellModes[cellKey] || 'unavailable';

      const newStatus =
        mode === 'available' ? 'available' :
        mode === 'maybe' ? 'maybe' :
        'unavailable';

      
      //updates object with new cell mode
      const updatedCellModes = {
        ...prevCellModes, //copies all existing cell modes
        [cellKey]: newStatus,
      };

      //send new data to the backend
      axios.post('http://localhost:8080/updateAvailability', {
        event_name: eventData.name,
        user_email: userEmail,
        date: date,
        time_slot: timeSlot,
        status: newStatus,
      })
      .then(response => {
        console.log('Availability updated on backend:', response.data);
        //refetch updated event data to reflect changes
        axios.get(`http://localhost:8080/getEventByName?name=${encodeURIComponent(name)}&user_email=${encodeURIComponent(userEmail)}`)
          .then(res => {
            setEventData(res.data); //update frontend with new data
          })
          .catch(err => console.error('Failed to refetch event data:', err));
      })
      .catch(error => {
        console.error('Failed to update availability on backend:', error);
      });


      //return new updated state for cell mode
      return updatedCellModes;
    });
  };

  const handleCellMouseDown = (date, timeSlot) => {
    setIsDragging(true);
    handleCellClick(date, timeSlot);
  };

  /*if there is a dragging occuring*/
  const handleCellMouseEnter = (date, timeSlot) => {
    if (isDragging) {
      handleCellClick(date, timeSlot);
    }
  };

  /*for the available modes */
  const getCellColor = (date, timeSlot) => {
    const cellKey = `${date}-${timeSlot}`;
    switch (cellModes[cellKey]) {
      case 'available':
        return 'lightgreen';
      case 'maybe':
        return 'yellow';
      case 'unavailable':
        return 'lightcoral';
      default:
        return 'hsl(0, 0.00%, 100.00%)';
    }
  };

  const getHeatColor = (cellKey) => {
    const heatMapData = eventData.groupAvailability || {};
    const count = heatMapData[cellKey] || 0;
  
    if (count === 0) return 'white'; //nobody available → white
  
    const maxCount = 10;
    const intensity = Math.min(count / maxCount, 1);
    const lightness = 90 - intensity * 60;
  
    return `hsl(120, 100%, ${lightness}%)`; // gradually darker green
  };
  

  return (
    <div className='Event-Details'>

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

      <div className='Header'>
        <div className='event-name'>
          <h1>Event Name: {eventData.name}</h1>
        </div>

        <div className='event-settings'>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value='available'>Available</option>
              <option value='maybe'>Maybe</option>
              <option value='unavailable'>Unavailable</option>
          </select>
        </div>
      </div>

      <div className = 'calendar-wrapper'>
              {/* User's Availability Calendar */}  
              <div className='User-Availability'>
                <h2>Your Availability</h2>
                <div className='table-columns'>
                  <div className='table-time'>Time</div>
                  <div className='date-range'>
                    {dateList.map((date, index) => {
                      const dateObj = new Date(date);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <div className='table-date' key={index}>
                          <div>{date}</div>
                          <div>{dayName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className='table-rows'>
                  {timeSlots.map((timeSlot, rowIndex) => (
                    <div className='table-row' key={rowIndex}>
                      <div className='time-label'>{timeSlot}</div>
                      {dateList.map((date) => {
                        const cellKey = `${date}-${timeSlot}`;
                        return (
                          <div
                            key={cellKey}
                            className='calendar-cell'
                            style={{ backgroundColor: getCellColor(date, timeSlot) }}
                            onMouseDown={() => handleCellMouseDown(date, timeSlot)}
                            onMouseEnter={() => handleCellMouseEnter(date, timeSlot)}
                          ></div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heat Map Calendar */}
              
              <div className='HeatMap'>
                <h2>Group Availability (Heat Map)</h2>
                <div className='table-columns'>
                  <div className='table-time2'>Time</div>
                  <div className='date-range2'>
                    {dateList.map((date, index) => {
                      const dateObj = new Date(date);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <div className='table-date' key={index}>
                          <div>{date}</div>
                          <div>{dayName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className='table-rows'>
                  {timeSlots.map((timeSlot, rowIndex) => (
                    <div className='table-row' key={rowIndex}>
                      <div className='time-label'>{timeSlot}</div>
                      {dateList.map((date) => {
                        const cellKey = `${date}-${timeSlot}`;
                        return (
                          <div
                            key={cellKey}
                            className='calendar-cell'
                            style={{
                              backgroundColor: getHeatColor(cellKey),
                              border: '1px solid #ccc',
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
      </div>
    </div>
  );
}

export default EventPage;
