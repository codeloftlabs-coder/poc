import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, Video, Play } from 'lucide-react';
import { Meeting } from '../types';
import CreateMeetingModal from './CreateMeetingModal';
import MeetingCard from './MeetingCard';
import { RecordingsList } from './RecordingsList';
import JitsiMeetingRoom from './JitsiMeetingRoom';

interface DashboardProps {
  onJoinMeeting: (meeting: Meeting) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onJoinMeeting }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'completed' | 'recordings' | 'meeting'>('upcoming');
  const [activeMeeting, setActiveMeeting] = useState<{roomName: string, displayName: string} | null>(null);

  // Sample data
  useEffect(() => {
    const sampleMeetings: Meeting[] = [
      {
        id: '1',
        title: 'JavaScript Fundamentals - Session 1',
        description: 'Introduction to variables, functions, and basic syntax',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        duration: 90,
        students: [
          { id: '1', name: 'Alice Johnson', email: 'alice@example.com', isOnline: true },
          { id: '2', name: 'Bob Smith', email: 'bob@example.com', isOnline: false },
          { id: '3', name: 'Carol Davis', email: 'carol@example.com', isOnline: true },
        ],
        status: 'scheduled',
        recordingEnabled: true,
      },
      {
        id: '2',
        title: 'React Hooks Deep Dive',
        description: 'Advanced concepts in React hooks and state management',
        scheduledTime: new Date(),
        duration: 120,
        students: [
          { id: '4', name: 'David Wilson', email: 'david@example.com', isOnline: true },
          { id: '5', name: 'Eva Brown', email: 'eva@example.com', isOnline: true },
        ],
        status: 'active',
        recordingEnabled: true,
      },
      {
        id: '3',
        title: 'Node.js Backend Development',
        description: 'Building REST APIs with Express and MongoDB',
        scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        duration: 150,
        students: [
          { id: '6', name: 'Frank Miller', email: 'frank@example.com' },
          { id: '7', name: 'Grace Lee', email: 'grace@example.com' },
          { id: '8', name: 'Henry Taylor', email: 'henry@example.com' },
        ],
        status: 'completed',
        recordingEnabled: true,
        recordingUrl: 'https://example.com/recordings/session-3',
      },
    ];
    setMeetings(sampleMeetings);
  }, []);

  const handleCreateMeeting = (meetingData: Partial<Meeting>) => {
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title: meetingData.title || '',
      description: meetingData.description || '',
      scheduledTime: meetingData.scheduledTime || new Date(),
      duration: meetingData.duration || 60,
      students: meetingData.students || [],
      status: 'scheduled',
      recordingEnabled: meetingData.recordingEnabled || false,
    };
    setMeetings([...meetings, newMeeting]);
    setIsCreateModalOpen(false);
  };

  const handleStartJitsiMeeting = (roomName: string, displayName: string = 'Host') => {
    setActiveMeeting({ roomName, displayName });
    setActiveTab('meeting');
  };

  const handleEndMeeting = () => {
    setActiveMeeting(null);
    setActiveTab('upcoming');
  };

  const filteredMeetings = activeTab === 'recordings' ? [] : meetings.filter(meeting => meeting.status === activeTab);

  const stats = {
    totalMeetings: meetings.length,
    activeMeetings: meetings.filter(m => m.status === 'active').length,
    totalStudents: meetings.reduce((acc, m) => acc + m.students.length, 0),
    recordedSessions: meetings.filter(m => m.recordingUrl).length,
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-xl font-bold text-white">EduStream Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleStartJitsiMeeting('quick-meeting-' + Date.now(), 'Host')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Video className="h-4 w-4" />
                Quick Meeting
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Total Meetings</p>
                <p className="text-white text-2xl font-bold">{stats.totalMeetings}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Active Now</p>
                <p className="text-white text-2xl font-bold">{stats.activeMeetings}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Total Students</p>
                <p className="text-white text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-gray-400 text-sm">Recorded</p>
                <p className="text-white text-2xl font-bold">{stats.recordedSessions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
          <div className="flex">
            {(['upcoming', 'active', 'completed', 'recordings', 'meeting'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                } ${tab === 'meeting' && !activeMeeting ? 'hidden' : ''}`}
              >
                {tab === 'recordings' ? 'Recordings' : 
                 tab === 'meeting' ? 'Live Meeting' : 
                 `${tab} Meetings`}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'meeting' && activeMeeting ? (
          <JitsiMeetingRoom
            roomName={activeMeeting.roomName}
            displayName={activeMeeting.displayName}
            onMeetingEnd={handleEndMeeting}
            embedded={true}
          />
        ) : activeTab === 'recordings' ? (
          <RecordingsList />
        ) : (
          <>
            {/* Meetings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onJoin={onJoinMeeting}
                />
              ))}
            </div>

            {filteredMeetings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-gray-400 text-lg font-medium mb-2">
                  No {activeTab} meetings
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'upcoming' ? 'Create your first meeting to get started.' : `No ${activeTab} meetings found.`}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Create Meeting
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Meeting Modal */}
      {isCreateModalOpen && (
        <CreateMeetingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateMeeting}
        />
      )}
    </div>
  );
};

export default Dashboard;