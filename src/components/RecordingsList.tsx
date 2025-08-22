import React from 'react';
import { Play, Download, Calendar, Clock } from 'lucide-react';

interface Recording {
  id: string;
  title: string;
  date: string;
  duration: string;
  size: string;
  url: string;
}

export const RecordingsList: React.FC = () => {
  // Mock data for now - this would typically come from props or a data source
  const recordings: Recording[] = [
    {
      id: '1',
      title: 'Team Standup Meeting',
      date: '2024-01-15',
      duration: '25:30',
      size: '45.2 MB',
      url: '#'
    },
    {
      id: '2',
      title: 'Project Review Session',
      date: '2024-01-14',
      duration: '1:15:45',
      size: '128.7 MB',
      url: '#'
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Recent Recordings</h2>
      
      {recordings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recordings available</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {recording.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {recording.date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {recording.duration}
                    </div>
                    <span>{recording.size}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Play className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};