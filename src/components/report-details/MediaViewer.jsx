import { useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export function MediaViewer({ ipfsHash }) {
  const [mediaError, setMediaError] = useState(false);

  if (!ipfsHash) return null;

  if (mediaError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Failed to load media</p>
        <a 
          href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        >
          Open in New Tab
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="media-container">
      <img
        src={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
        alt="Report evidence"
        className="max-w-full h-auto rounded-lg"
        onError={() => setMediaError(true)}
      />
    </div>
  );
}