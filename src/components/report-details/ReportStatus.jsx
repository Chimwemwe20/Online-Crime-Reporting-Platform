import { Clock, CheckCircle } from 'lucide-react';

export function ReportStatus({ resolved, resolvedBy }) {
  return (
    <p className={`flex items-center ${resolved ? 'text-green-600' : 'text-yellow-600'}`}>
      {resolved ? (
        <>
          <CheckCircle className="w-4 h-4 mr-1" />
          Resolved by {resolvedBy}
        </>
      ) : (
        <>
          <Clock className="w-4 h-4 mr-1" />
          Pending
        </>
      )}
    </p>
  );
}