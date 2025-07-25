import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

import homeEventDefault from './assets/home1.png';
import homeEventClicked from './assets/home2.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function EventPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const name = location.state?.name;
  const userEmail = location.state?.user_email;

  const STORAGE_KEY = `cellModes-${name}-${userEmail}`;

  const [eventData, setEventData] = useState(null);
  const [mode, setMode] = useState('available');
  const [isDragging, setIsDragging] = useState(false);
  const [homePressed, setHomePressed] = useState(false);
  const [cellModes, setCellModes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (_) {
      return {};
    }
  });

  // Tooltip state for heatmap
  const [tooltip, setTooltip] = useState({
    visible: false,
    users: [],
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!name || !userEmail) {
      navigate('/eventForm');
      return;
    }

    axios.get(`${API_BASE_URL}/getEventByName?name=${encodeURIComponent(name)}&user_email=${encodeURIComponent(userEmail)}`)
      .then((res) => {
        setEventData(res.data);
        setCellModes(res.data.availability || {});
      })
      .catch((err) => {
        console.error('Fetch failed:', err);
        navigate('/eventForm');
      });
  }, [name, userEmail, navigate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cellModes));
    } catch (_) {}
  }, [cellModes, STORAGE_KEY]);

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  if (!eventData) return null;

  const startDate = new Date(eventData.start_date);
  const endDate = new Date(eventData.end_date);

  const getDatesBetween = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const dateList = getDatesBetween(startDate, endDate);

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

  const timeSlots = getTimeSlots(eventData.start_time, eventData.end_time);

  const handleCellClick = (date, timeSlot) => {
    const cellKey = `${date}-${timeSlot}`;

    setCellModes((prevCellModes) => {
      const newStatus =
        mode === 'available' ? 'available' :
        mode === 'maybe' ? 'maybe' :
        'unavailable';

      const updatedCellModes = {
        ...prevCellModes,
        [cellKey]: newStatus,
      };

      axios.post(`${API_BASE_URL}/updateAvailability`, {
        event_name: eventData.name,
        user_email: userEmail,
        date: date,
        time_slot: timeSlot,
        status: newStatus,
      })
      .then(() => {
        return axios.get(`${API_BASE_URL}/getEventByName?name=${encodeURIComponent(name)}&user_email=${encodeURIComponent(userEmail)}`);
      })
      .then(res => {
        setEventData(res.data);
      })
      .catch(error => {
        console.error('Failed to update availability on backend:', error);
      });

      return updatedCellModes;
    });
  };

  const handleCellMouseDown = (date, timeSlot) => {
    setIsDragging(true);
    handleCellClick(date, timeSlot);
  };

  const handleCellMouseEnter = (date, timeSlot) => {
    if (isDragging) {
      handleCellClick(date, timeSlot);
    }
  };

  const getCellColor = (date, timeSlot) => {
    const cellKey = `${date}-${timeSlot}`;
    switch (cellModes[cellKey]) {
      case 'available': return 'lightgreen';
      case 'maybe': return 'yellow';
      case 'unavailable': return 'lightcoral';
      default: return 'hsl(0, 0.00%, 100.00%)';
    }
  };

  const getHeatColor = (cellKey) => {
    const heatMapData = eventData.groupAvailability || {};
    const count = heatMapData[cellKey] || 0;

    if (count === 0) return 'white';

    const maxCount = 10;
    const intensity = Math.min(count / maxCount, 1);
    const lightness = 90 - intensity * 60;

    return `hsl(120, 100%, ${lightness}%)`;
  };

  const handleHeatCellMouseEnter = (e, cellKey) => {
    const users = eventData.groupAvailabilityUsers?.[cellKey] || [];
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      users,
      x: rect.right + 10,
      y: rect.top,
    });
  };

  const handleHeatCellMouseLeave = () => {
    setTooltip({ visible: false, users: [], x: 0, y: 0 });
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

      <div className='calendar-wrapper'>
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
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

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
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => handleHeatCellMouseEnter(e, cellKey)}
                      onMouseLeave={handleHeatCellMouseLeave}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {tooltip.visible && (
            <div
              style={{
                position: 'fixed',
                top: tooltip.y,
                left: tooltip.x,
                backgroundColor: 'white',
                border: '1px solid black',
                padding: '8px',
                zIndex: 1000,
                maxWidth: '250px',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                fontSize: '14px',
              }}
            >
              <strong>Available Users:</strong>
              <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                {tooltip.users.length === 0 ? (
                  <li>No one available</li>
                ) : (
                  tooltip.users.map((email) => <li key={email}>{email}</li>)
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventPage;