import Login from './login.jsx'; 
import SignUp from './signup.jsx';
import Home from './home.jsx';
import JoinEvent from './joinEvent.jsx';
import ProtectedRoute from './protectedRoute.jsx'; 
import  EventForm  from './eventForm.jsx'
import  EventPage from './eventPage.jsx'

import './signup.css';
import './eventForm.css'
import './eventPage.css'
import './joinEvent.css'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/signup" element={<SignUp />} />
        
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eventForm"
          element={
            <ProtectedRoute>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/joinevent"
          element={
            <ProtectedRoute>
              <JoinEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/eventPage"
          element={
            <ProtectedRoute>
              <EventPage />

            </ProtectedRoute>
            
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

