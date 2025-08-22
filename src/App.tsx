import { useState } from 'react';
import Dashboard from './components/Dashboard';
import JitsiMeetingRoom from './components/JitsiMeetingRoom';
import { Meeting } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'meeting'>('dashboard');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const handleJoinMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setCurrentView('meeting');
  };

  const handleLeaveMeeting = () => {
    setCurrentView('dashboard');
    setSelectedMeeting(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {currentView === 'dashboard' ? (
        <Dashboard onJoinMeeting={handleJoinMeeting} />
      ) : (
        <JitsiMeetingRoom 
          roomName={selectedMeeting?.roomName || selectedMeeting?.id || 'meeting'}
          displayName="User"
          onLeaveMeeting={handleLeaveMeeting} 
        />
      )}
    </div>
  );
}

export default App;