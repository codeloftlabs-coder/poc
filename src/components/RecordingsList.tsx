import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Eye, Calendar, Clock, Users } from 'lucide-react';
import { bbbAPI } from '../services/bigbluebutton';

interface Recording {
  recordID: string;
  meetingID: string;
  name: string;
  published: boolean;
  state: string;
  startTime: number;
  endTime: number;
  participants: number;
  playbackUrl: string;
  previewImage?: string;
  size: number;
}

const RecordingsList: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const response = await bbbAPI.getRecordings();
      
      if (response.returncode === 'SUCCESS' && response.recordings) {
        const formattedRecordings = response.recordings.map((rec: any) => ({
          recordID: rec.recordID,
          meetingID: rec.meetingID,
          name: rec.name,
          published: rec.published,
          state: rec.state,
          startTime: rec.startTime,
          endTime: rec.endTime,
          participants: rec.participants,
          playbackUrl: rec.playback?.format?.url || '',
          previewImage: rec.preview?.images?.image,
          size: rec.size || 0
        }));
        setRecordings(formattedRecordings);
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePlayRecording = (recording: Recording) => {
    if (recording.playbackUrl) {
      window.open(recording.playbackUrl, '_blank');
    }
  };

  const handleDownloadRecording = (recording: Recording) => {
    // In a real implementation, you would provide download functionality
    console.log('Download recording:', recording.recordID);
    // For demo purposes, we'll just show an alert
    alert('Download functionality would be implemented here');
  };

  const handleDeleteRecording = async (recordID: string) => {
    if (window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      try {
        // In real implementation, call delete API
        console.log('Deleting recording:', recordID);
        setRecordings(recordings.filter(rec => rec.recordID !== recordID));
      } catch (error) {
        console.error('Error deleting recording:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-center text-gray-400 mt-4">Loading recordings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Session Recordings</h2>
        <button
          onClick={loadRecordings}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-12">
          <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-400 text-lg font-medium mb-2">No recordings found</h3>
          <p className="text-gray-500">Recordings from your meetings will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {recordings.map((recording) => (
            <div key={recording.recordID} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
              {/* Preview Image */}
              <div className="relative h-48 bg-gray-900">
                {recording.previewImage ? (
                  <img
                    src={recording.previewImage}
                    alt={recording.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-12 w-12 text-gray-600" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    recording.published 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {recording.published ? 'Published' : recording.state}
                  </span>
                </div>

                {/* Play Button Overlay */}
                {recording.published && (
                  <button
                    onClick={() => handlePlayRecording(recording)}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-16 w-16 text-white" />
                  </button>
                )}
              </div>

              {/* Recording Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 truncate">{recording.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-400 text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(recording.startTime)}
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatDuration(recording.startTime, recording.endTime)}
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Users className="h-4 w-4 mr-2" />
                    {recording.participants} participants
                  </div>
                  {recording.size > 0 && (
                    <div className="text-gray-400 text-sm">
                      Size: {formatFileSize(recording.size)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {recording.published && recording.playbackUrl && (
                    <button
                      onClick={() => handlePlayRecording(recording)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      Play
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDownloadRecording(recording)}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    title="Download recording"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRecording(recording.recordID)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="h-4 w-4" />
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

export default RecordingsList;