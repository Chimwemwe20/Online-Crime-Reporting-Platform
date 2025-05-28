import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ClipboardList, CheckCircle, LogOut, AlertTriangle, Search } from 'lucide-react';
import { getReport, resolveCase, getReportCount } from '../ContractInteractions';
import ReportDetails from './ReportDetails';

const AdminDashboard = ({ account }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('unresolved');
  const [reports, setReports] = useState({ resolved: [], unresolved: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const reportCount = await getReportCount();
      const allReports = [];

      for (let i = 0; i < reportCount; i++) {
        try {
          const report = await getReport(i);
          if (report) {
            const sanitizedReport = {
              id: i,
              description: report.description || 'No description available',
              location: report.location || 'Location not specified',
              timestamp: report.timestamp || new Date().toLocaleString(),
              reporter: report.reporter || 'Unknown',
              resolved: report.resolved || false,
              resolvedBy: report.resolvedBy || null,
              resolutionDetails: report.resolutionDetails || '',
              mediaUrl: report.mediaUrl || '',
              ipfsHash: report.ipfsHash || '',
              name: report.name || 'Anonymous',
              isAnonymous: report.isAnonymous || false
            };
            allReports.push(sanitizedReport);
          }
        } catch (error) {
          console.error(`Error fetching report ${i}:`, error);
          // Don't add errored reports to the list
          continue;
        }
      }

      setReports({
        resolved: allReports.filter(r => r.resolved),
        unresolved: allReports.filter(r => !r.resolved)
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports. Please try again later.');
      toast.error('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (account) {
      fetchReports();
    }
  }, [account, fetchReports]);

  const handleResolveCase = async (reportId, resolutionMessage) => {
    try {
      await resolveCase(reportId, resolutionMessage);
      toast.success('Case resolved successfully');
      await fetchReports();
      setSelectedReport(null); // Close the report details after resolving
    } catch (error) {
      console.error('Error resolving case:', error);
      toast.error('Failed to resolve case');
    }
  };

  const handleLogout = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }]
        });
        // Clear any stored user data or tokens here if needed
        // For example: localStorage.removeItem('userToken');
      }
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  const filteredReports = reports[activeTab].filter(report => {
    const searchString = searchTerm.toLowerCase();
    return (
      report.description.toLowerCase().includes(searchString) ||
      report.location.toLowerCase().includes(searchString) ||
      report.name.toLowerCase().includes(searchString)
    );
  });

  const ReportCard = ({ report }) => (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-800">Report #{report.id}</h3>
        <span className={`px-2 py-1 rounded text-sm ${
          report.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {report.resolved ? 'Resolved' : 'Pending'}
        </span>
      </div>
      <p className="text-gray-600 line-clamp-2">{report.description}</p>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          <span className="font-medium">Location:</span> {report.location}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-medium">Reported by:</span> {report.isAnonymous ? 'Anonymous' : report.name}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-medium">Reported:</span> {report.timestamp}
        </p>
        {report.mediaUrl && (
          <p className="text-sm text-gray-500">
            <span className="font-medium">Evidence:</span> Available
          </p>
        )}
      </div>
      <button
        onClick={() => setSelectedReport(report)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
      >
        View Details
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('unresolved')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition duration-200 ${
                activeTab === 'unresolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span>Unresolved ({reports.unresolved.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition duration-200 ${
                activeTab === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Resolved ({reports.resolved.length})</span>
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {searchTerm ? 'No matching reports found.' : `No ${activeTab} cases found.`}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <ReportDetails 
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolve={handleResolveCase}
          isAdmin={true}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

