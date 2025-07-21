//only get acces to certain pages if they have a token
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />; //redirect to home page if user isn't logged in
}

export default ProtectedRoute;
