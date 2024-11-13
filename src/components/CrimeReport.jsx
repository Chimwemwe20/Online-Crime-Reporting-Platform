import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Upload, MapPin } from 'lucide-react';
import { reportCrime, checkIPFSStatus } from '../ContractInteractions';
import MapComponent from './Map';

export default function CrimeReport({ account }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    media: null,
    isAnonymous: false
  });
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ipfsStatus, setIpfsStatus] = useState(null);

  useEffect(() => {
    checkIPFSConnection();
  }, []);

  const checkIPFSConnection = async () => {
    try {
      const status = await checkIPFSStatus();
      setIpfsStatus(status);
      if (status.status === 'Error') {
        toast.error(`IPFS connection issue: ${status.message}`);
      }
    } catch (error) {
      console.error('Error checking IPFS connection:', error);
      toast.error('Failed to check IPFS connection');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description) {
      toast.error('Description is required');
      return;
    }
    if (!formData.isAnonymous && !formData.name.trim()) {
      toast.error('Name is required when not reporting anonymously');
      return;
    }

    if (ipfsStatus?.status !== 'OK') {
      toast.error('IPFS connection is not available. Please try again later.');
      return;
    }

    setIsSubmitting(true);
    try {
      const txHash = await reportCrime(
        formData.name,
        formData.description,
        formData.location,
        formData.isAnonymous,
        formData.media
      );
      toast.success(`Crime reported successfully. Transaction hash: ${txHash}`);
      navigate('/user-dashboard');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(`Failed to submit report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      setFormData(prevData => ({ ...prevData, media: file }));
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prevData => ({ ...prevData, location }));
    setShowMap(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/user-dashboard')}
          className="flex items-center space-x-2 text-blue-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Report a Crime</h1>

          {ipfsStatus?.status === 'Error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">IPFS Connection Error: </strong>
              <span className="block sm:inline">{ipfsStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!formData.isAnonymous && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prevData => ({ ...prevData, name: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                  required={!formData.isAnonymous}
                />
              </div>
            )}

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData(prevData => ({ ...prevData, description: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Describe the incident in detail"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  readOnly
                  className="flex-1 p-3 border rounded-lg bg-gray-50"
                  placeholder="Select location on map (optional)"
                />
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="media" className="block text-sm font-medium text-gray-700 mb-2">
                Evidence/Media
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue-50 transition duration-200">
                  <Upload className="w-8 h-8 text-blue-600" />
                  <span className="mt-2 text-base leading-normal">Select a file</span>
                  <input
                    id="media"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                  />
                </label>
              </div>
              {formData.media && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected file: {formData.media.name}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prevData => ({ 
                  ...prevData, 
                  isAnonymous: e.target.checked, 
                  name: e.target.checked ? '' : prevData.name 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                Submit anonymously
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || ipfsStatus?.status !== 'OK'}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed
                       transition duration-200"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>

      {showMap && (
        <MapComponent 
          onLocationSelect={handleLocationSelect} 
          onClose={() => setShowMap(false)} 
        />
      )}
    </div>
  );
}