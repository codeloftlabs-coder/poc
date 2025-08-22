import React from 'react';
import { Calendar, Clock, Users, Video, Play, Eye } from 'lucide-react';
import { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin: (meeting: Meeting) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onJoin }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const canJoin = meeting.status === 'scheduled' || meeting.status === 'active';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-2">{meeting.title}</h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{meeting.description}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor(meeting.status)} flex-shrink-0 mt-1`} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-400 text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          {formatTime(meeting.scheduledTime)}
        </div>
        <div className="flex items-center text-gray-400 text-sm">
          <Clock className="h-4 w-4 mr-2" />
          {meeting.duration} minutes
        </div>
        <div className="flex items-center text-gray-400 text-sm">
          <Users className="h-4 w-4 mr-2" />
          {meeting.students.length} students
          {meeting.status === 'active' && (
            <span className="ml-2 text-green-400">
              ({meeting.students.filter(s => s.isOnline).length} online)
            </span>
          )}
        </div>
        {meeting.recordingEnabled && (
          <div className="flex items-center text-gray-400 text-sm">
            <Video className="h-4 w-4 mr-2" />
            Recording enabled
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {canJoin && (
          <button
            onClick={() => onJoin(meeting)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              meeting.status === 'active'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Play className="h-4 w-4" />
            {meeting.status === 'active' ? 'Join Meeting' : 'Start Meeting'}
          </button>
        )}
        
        {meeting.status === 'completed' && meeting.recordingUrl && (
          <button
            onClick={() => window.open(meeting.recordingUrl, '_blank')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Recording
          </button>
        )}
      </div>

      {meeting.status === 'active' && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex -space-x-2">
            {meeting.students.filter(s => s.isOnline).slice(0, 3).map((student, index) => (
              <div
                key={student.id}
                className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-gray-800"
                title={student.name}
              >
                {student.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {meeting.students.filter(s => s.isOnline).length > 3 && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-gray-800">
                +{meeting.students.filter(s => s.isOnline).length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingCard;