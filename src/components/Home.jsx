import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <Shield className="w-20 h-20 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-800">
            Online Crime Reporting Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            A secure and anonymous platform for reporting crimes using blockchain technology.
            Your voice matters in making our community safer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-800">Secure</h3>
            <p className="text-gray-600">Blockchain-powered security for all reports</p>
          </div>
          <div className="p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-800">Anonymous</h3>
            <p className="text-gray-600">Optional anonymous reporting available</p>
          </div>
          <div className="p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-800">Transparent</h3>
            <p className="text-gray-600">Track your report status in real-time</p>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold 
                     hover:bg-blue-700 transform transition duration-200 hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;