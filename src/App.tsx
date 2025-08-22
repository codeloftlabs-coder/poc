import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import MeetingRoom from './components/MeetingRoom';
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
        <MeetingRoom 
          meeting={selectedMeeting!} 
          onLeaveMeeting={handleLeaveMeeting} 
        />
      )}
    </div>
  );
}

export default App;