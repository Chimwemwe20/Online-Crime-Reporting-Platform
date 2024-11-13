import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { initialize, isAdmin } from './ContractInteractions';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isAdminUser, setIsAdminUser] = React.useState(false);
  const [account, setAccount] = React.useState(null);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        if (account) {
          await initialize();
          const adminStatus = await isAdmin(account);
          setIsAdminUser(adminStatus);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [account]);

  const handleAccountChange = async (newAccount) => {
    try {
      setAccount(newAccount);
      if (newAccount) {
        await initialize();
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setIsAdminUser(false);
      }
    } catch (error) {
      console.error('Account change error:', error);
      setIsAuthenticated(false);
      setIsAdminUser(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/auth" 
              element={
                <Authentication 
                  onAccountChange={handleAccountChange}
                  isAuthenticated={isAuthenticated}
                  isAdmin={isAdminUser}
                />
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                isAuthenticated && isAdminUser ? (
                  <AdminDashboard account={account} />
                ) : (
                  <Navigate to="/auth" replace state={{ from: '/admin-dashboard' }} />
                )
              } 
            />
            <Route 
              path="/user-dashboard" 
              element={
                isAuthenticated && !isAdminUser ? (
                  <UserDashboard account={account} />
                ) : (
                  <Navigate to="/auth" replace state={{ from: '/user-dashboard' }} />
                )
              } 
            />
            <Route 
              path="/report-crime" 
              element={
                isAuthenticated ? (
                  <CrimeReport account={account} />
                ) : (
                  <Navigate to="/auth" replace state={{ from: '/report-crime' }} />
                )
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

// Lazy load components
const Home = React.lazy(() => import('./components/Home'));
const Authentication = React.lazy(() => import('./components/Authentication'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const UserDashboard = React.lazy(() => import('./components/UserDashboard'));
const CrimeReport = React.lazy(() => import('./components/CrimeReport'));

export default App;