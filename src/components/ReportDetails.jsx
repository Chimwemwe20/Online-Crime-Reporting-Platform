import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { X, MapPin, FileText, Clock, User, CheckCircle, FileImage } from 'lucide-react';
import MapComponent from './Map';

const ReportDetails = ({ report, onClose, onResolve, isAdmin }) => {
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const handleResolve = async () => {
    if (!resolutionMessage.trim()) {
      toast.error('Please provide a resolution message');
      return;
    }
    setIsResolving(true);
    try {
      await onResolve(report.id, resolutionMessage);
      toast.success('Case resolved successfully');
    } catch (error) {
      toast.error(`Failed to resolve case: ${error.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const MediaViewer = ({ url }) => {
    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);

    if (isImage) {
      return (
        <div className="relative group cursor-pointer" onClick={() => setShowFullImage(true)}>
          <img
            src={url}
            alt="Evidence"
            className="w-full h-auto rounded-lg object-cover transition-transform group-hover:scale-[0.99]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Failed+to+load+image';
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
            <FileImage className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          controls
          className="w-full h-auto rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.parentElement.innerHTML = 'Failed to load video';
          }}
        >
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <div className="p-4 bg-gray-100 rounded-lg text-gray-600 text-center">
        <FileText className="w-8 h-8 mx-auto mb-2" />
        <p>File type not supported for preview</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b sticky top-0 bg-white z-10">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-800">Report Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{report.timestamp}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{report.isAnonymous ? 'Anonymous' : report.name}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap p-4 bg-gray-50 rounded-lg">
                {report.description}
              </p>
            </div>

            {/* Location */}
            {report.location && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Location</h3>
                <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <span className="text-gray-600">{report.location}</span>
                </div>
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <MapComponent
                    initialLocation={report.location}
                    readOnly={true}
                    onClose={() => {}}
                  />
                </div>
              </div>
            )}

            {/* Evidence */}
            {report.mediaUrl && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Evidence</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <MediaViewer url={report.mediaUrl} />
                </div>
              </div>
            )}

            {/* Resolution */}
            {report.resolved && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Resolution</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Resolved by {report.resolvedBy}</span>
                  </div>
                  <p className="text-green-700 whitespace-pre-wrap">{report.resolutionDetails}</p>
                </div>
              </div>
            )}

            {/* Resolution Form for Admins */}
            {isAdmin && !report.resolved && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Resolve Case</h3>
                <textarea
                  value={resolutionMessage}
                  onChange={(e) => setResolutionMessage(e.target.value)}
                  placeholder="Enter resolution details..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 
                           focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
                <button
                  onClick={handleResolve}
                  disabled={isResolving || !resolutionMessage.trim()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors font-medium"
                >
                  {isResolving ? 'Resolving...' : 'Resolve Case'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && report.mediaUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={report.mediaUrl}
            alt="Evidence (Full Size)"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ReportDetails;