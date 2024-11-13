import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FileText, PlusCircle, LogOut, CheckCircle, Clock } from 'lucide-react';
import { getUserReports } from '../ContractInteractions';
import ReportDetails from './ReportDetails';

const UserDashboard = ({ account }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState({ resolved: [], unresolved: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unresolved');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchUserReports();
  }, [account]);

  const fetchUserReports = async () => {
    try {
      setIsLoading(true);
      const userReports = await getUserReports(account);
      const validReports = userReports.map((report) => ({
        ...report,
        description: typeof report.description === 'string' ? report.description : 'No description available',
        location: typeof report.location === 'string' ? report.location : 'Location not specified',
        timestamp: typeof report.timestamp === 'string' ? report.timestamp : 'Timestamp not available'
      }));

      setReports({
        resolved: validReports.filter((report) => report.resolved),
        unresolved: validReports.filter((report) => !report.resolved)
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  const ReportCard = ({ report }) => (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-800">Report #{report.id}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${
          report.resolved
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {report.resolved ? 'Resolved' : 'Pending'}
        </span>
      </div>
      <p className="text-gray-600">
        {report.description.length > 100 
          ? `${report.description.slice(0, 100)}...` 
          : report.description}
      </p>
      <div className="flex items-center text-sm text-gray-500">
        <Clock className="w-4 h-4 mr-1" />
        <span>{report.timestamp}</span>
      </div>
      <button
        onClick={() => setSelectedReport(report)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
      >
        View Details
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">User Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/report-crime')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Report Crime</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">My Reports</h2>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('unresolved')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition duration-200 ${
                activeTab === 'unresolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Unresolved ({reports.unresolved.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition duration-200 ${
                activeTab === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Resolved ({reports.resolved.length})</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          ) : reports[activeTab].length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No {activeTab} reports found. {activeTab === 'unresolved' && 'Click "Report Crime" to submit a new report.'}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reports[activeTab].map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedReport && (
        <ReportDetails 
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          isAdmin={false}
        />
      )}
    </div>
  );
};

export default UserDashboard;