import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, Users, Settings, Phone, PhoneOff, SwordIcon as Record, Square, Maximize2, Minimize2, Volume2, MessageCircle, MoreVertical } from 'lucide-react';
import { Meeting, Student } from '../types';
import { bbbAPI } from '../services/bigbluebutton';

interface MeetingRoomProps {
  meeting: Meeting;
  onLeaveMeeting: () => void;
}

interface MeetingControls {
  video: boolean;
  audio: boolean;
  screenShare: boolean;
  recording: boolean;
  chat: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: 'moderator' | 'viewer';
  hasVideo: boolean;
  hasAudio: boolean;
  isPresenter: boolean;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ meeting, onLeaveMeeting }) => {
  const [controls, setControls] = useState<MeetingControls>({
    video: false,
    audio: false,
    screenShare: false,
    recording: false,
    chat: false
  });
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [showIframe, setShowIframe] = useState(false);
  const [meetingCreated, setMeetingCreated] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const meetingContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeMeeting();
  }, [meeting]);

  const initializeMeeting = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      // Create or get meeting info from BigBlueButton
      let meetingResponse;
      
      if (meeting.status === 'scheduled') {
        // Create new meeting
        meetingResponse = await bbbAPI.createMeeting({
          meetingID: meeting.id,
          name: meeting.title,
          attendeePW: 'attendee123',
          moderatorPW: 'moderator123',
          welcome: `Welcome to ${meeting.title}!`,
          record: meeting.recordingEnabled,
          duration: meeting.duration,
          maxParticipants: 50
        });
      } else {
        // Get existing meeting info
        meetingResponse = await bbbAPI.getMeetingInfo(meeting.id);
      }

      setMeetingInfo(meetingResponse);

      // Generate join URL for moderator
      const joinURL = bbbAPI.generateJoinURL({
        meetingID: meeting.id,
        fullName: 'Instructor', // In production, get from user context
        password: 'moderator123', // Use moderator password
        joinViaHtml5: true,
        userID: 'instructor-' + Date.now(),
        redirect: false
      });

      setJoinUrl(joinURL);
      setMeetingCreated(true);
      
      // Mock participants data
      setParticipants([
        {
          id: 'instructor',
          name: 'Instructor',
          role: 'moderator',
          hasVideo: true,
          hasAudio: true,
          isPresenter: true
        },
        ...meeting.students.slice(0, 3).map((student, index) => ({
          id: student.id,
          name: student.name,
          role: 'viewer' as const,
          hasVideo: Math.random() > 0.5,
          hasAudio: Math.random() > 0.3,
          isPresenter: false
        }))
      ]);
      
    } catch (error) {
      console.error('Error initializing meeting:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    if (joinUrl) {
      // Open BigBlueButton in a new window/tab instead of iframe
      window.open(joinUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      setConnectionStatus('connected');
      setShowIframe(false);
    }
  };

  const handleEmbedMeeting = () => {
    setShowIframe(true);
    setConnectionStatus('connected');
  };
  const toggleControl = (control: keyof MeetingControls) => {
    setControls(prev => ({
      ...prev,
      [control]: !prev[control]
    }));

    // Handle specific control actions
    switch (control) {
      case 'recording':
        if (!controls.recording) {
          console.log('Starting recording...');
          // In production, send command to BigBlueButton
        } else {
          console.log('Stopping recording...');
        }
        break;
      case 'screenShare':
        if (!controls.screenShare) {
          console.log('Starting screen share...');
          // BigBlueButton handles this through the iframe
        } else {
          console.log('Stopping screen share...');
        }
        break;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && meetingContainerRef.current) {
      meetingContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleEndMeeting = async () => {
    try {
      await bbbAPI.endMeeting(meeting.id, 'moderator123');
      onLeaveMeeting();
    } catch (error) {
      console.error('Error ending meeting:', error);
      onLeaveMeeting(); // Still leave the meeting view
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting to meeting...</h2>
          <p className="text-gray-400">Please wait while we set up your session</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={meetingContainerRef} className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-lg font-semibold text-white">{meeting.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className={`flex items-center ${connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                  {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
                <span>Duration: {formatDuration(meeting.duration)}</span>
                <span>{participants.length} participants</span>
                {controls.recording && (
                  <span className="flex items-center text-red-400">
                    <Record className="w-3 h-3 mr-1 animate-pulse" />
                    Recording
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleEndMeeting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              End Meeting
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 bg-black relative">
          {showIframe && joinUrl ? (
            <iframe
              ref={iframeRef}
              src={joinUrl}
              className="w-full h-full border-0"
              allow="camera; microphone; display-capture; fullscreen"
              title="BigBlueButton Meeting Room"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
          ) : meetingCreated ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Video className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                <h3 className="text-white text-xl font-semibold mb-4">Meeting Ready</h3>
                <p className="text-gray-400 mb-6">
                  Your BigBlueButton meeting has been created successfully. Choose how you'd like to join:
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleJoinMeeting}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Open in New Window (Recommended)
                  </button>
                  
                  <button
                    onClick={handleEmbedMeeting}
                    className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Monitor className="w-5 h-5" />
                    Embed Here (May have limitations)
                  </button>
                </div>
                
                <p className="text-gray-500 text-sm mt-4">
                  Opening in a new window provides the best experience with full BigBlueButton features.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">
                  {connectionStatus === 'connecting' ? 'Connecting to meeting...' : 'Unable to connect'}
                </h3>
                <p className="text-gray-400">
                  {connectionStatus === 'connecting' 
                    ? 'Please wait while we establish the connection'
                    : 'Please check your connection and try again'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Meeting Controls Overlay */}
          {(showIframe || connectionStatus === 'connected') && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-full px-6 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleControl('audio')}
                className={`p-3 rounded-full transition-colors ${
                  controls.audio 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                title={controls.audio ? 'Mute microphone' : 'Unmute microphone'}
              >
                {controls.audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => toggleControl('video')}
                className={`p-3 rounded-full transition-colors ${
                  controls.video 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                title={controls.video ? 'Stop camera' : 'Start camera'}
              >
                {controls.video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => toggleControl('screenShare')}
                className={`p-3 rounded-full transition-colors ${
                  controls.screenShare 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                title={controls.screenShare ? 'Stop screen share' : 'Share screen'}
              >
                <Monitor className="w-5 h-5" />
              </button>

              <button
                onClick={() => toggleControl('recording')}
                className={`p-3 rounded-full transition-colors ${
                  controls.recording 
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                title={controls.recording ? 'Stop recording' : 'Start recording'}
              >
                {controls.recording ? <Square className="w-5 h-5" /> : <Record className="w-5 h-5" />}
              </button>

              <button
                onClick={() => toggleControl('chat')}
                className={`p-3 rounded-full transition-colors ${
                  controls.chat 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                title="Toggle chat"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              <div className="w-px h-8 bg-gray-600 mx-2"></div>

              <button
                onClick={handleEndMeeting}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                title="Leave meeting"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
            </div>
          )}
        </div>

        {/* Participants Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Participants ({participants.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {participants.map((participant) => (
              <div key={participant.id} className="p-3 border-b border-gray-700 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      {participant.role === 'moderator' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-black font-bold">M</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{participant.name}</div>
                      <div className="text-xs text-gray-400">
                        {participant.isPresenter && <span className="text-blue-400">Presenter • </span>}
                        {participant.role}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${participant.hasAudio ? 'bg-green-400' : 'bg-gray-500'}`} title={participant.hasAudio ? 'Audio on' : 'Audio off'} />
                    <div className={`w-2 h-2 rounded-full ${participant.hasVideo ? 'bg-blue-400' : 'bg-gray-500'}`} title={participant.hasVideo ? 'Video on' : 'Video off'} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;