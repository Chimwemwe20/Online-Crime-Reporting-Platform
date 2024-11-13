import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Shield, LogIn, UserPlus } from 'lucide-react';
import { initialize, isRegistered, isAdmin, getOwner } from '../ContractInteractions';

function Authentication({ onAccountChange, isAuthenticated, isAdmin: isAdminUser }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdminUser) {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    }
  }, [isAuthenticated, isAdminUser, navigate]);

  const handleAuth = async (isRegistering) => {
    setIsLoading(true);
    try {
      const success = await initialize();
      if (!success) {
        toast.error('Failed to initialize MetaMask connection');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        toast.error('No MetaMask account found');
        return;
      }

      const currentAccount = accounts[0];
      setAccount(currentAccount);

      // Check if the account is the owner
      const ownerAddress = await getOwner();
      if (currentAccount.toLowerCase() === ownerAddress.toLowerCase()) {
        toast.success('Owner recognized as admin');
        onAccountChange(currentAccount);
        navigate('/admin-dashboard');
        return;
      }

      const userRegistered = await isRegistered(currentAccount);
      if (!userRegistered && !isRegistering) {
        toast.info('Account not registered. Please register first.');
        return;
      }

      if (userRegistered && isRegistering) {
        toast.info('Account already registered. Please login.');
        return;
      }

      if (isRegistering && !userRegistered) {
        await registerUser();
        toast.success('Registration successful!');
      }

      const adminStatus = await isAdmin(currentAccount);
      onAccountChange(currentAccount);

      if (adminStatus) {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Shield className="w-16 h-16 text-blue-600" />
          <h2 className="text-3xl font-bold text-center text-gray-800">
            Welcome to Crime Report
          </h2>
          <p className="text-gray-600 text-center">
            Connect with MetaMask to access the platform
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleAuth(false)}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 
                     text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5" />
            <span>{isLoading ? 'Processing...' : 'Login with MetaMask'}</span>
          </button>

          <button
            onClick={() => handleAuth(true)}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white 
                     text-blue-600 border-2 border-blue-600 rounded-lg font-semibold 
                     hover:bg-blue-50 transition duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            <span>{isLoading ? 'Processing...' : 'Register New Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Authentication;
