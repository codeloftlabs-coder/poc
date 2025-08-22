import React, { useState, useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { 
  Users, 
  Clock,
  Circle,
  Square,
  ExternalLink
} from 'lucide-react';
import { jitsiAPI } from '../services/jitsi';

interface JitsiMeetingRoomProps {
  roomName: string;
  displayName: string;
  onMeetingEnd?: () => void;
  onLeaveMeeting?: () => void;
  embedded?: boolean;
}

const JitsiMeetingRoom: React.FC<JitsiMeetingRoomProps> = ({
  roomName,
  displayName,
  onMeetingEnd,
  onLeaveMeeting,
  embedded = true
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const meetingRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (meetingStarted) {
      interval = setInterval(() => {
        setMeetingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [meetingStarted]);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await jitsiAPI.startRecording(roomName);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      await jitsiAPI.stopRecording(roomName);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setError('Failed to stop recording');
    }
  };

  const handleOpenInNewWindow = () => {
    const url = jitsiAPI.generateMeetingUrl(roomName, displayName);
    window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  const handleApiReady = (externalApi: any) => {
    meetingRef.current = externalApi;
    
    // Disable lobby features safely after API is ready
    try {
      // Set room subject
      externalApi.executeCommand('subject', roomName);
    } catch (error) {
      console.log('Subject command not available:', error);
    }
    
    // Meeting events
    externalApi.addEventListener('videoConferenceJoined', () => {
      setMeetingStarted(true);
      startTimeRef.current = Date.now();
      setError(null);
      
      // Try to disable lobby after successfully joining
      setTimeout(() => {
        try {
          externalApi.executeCommand('toggleLobby', false);
        } catch (error) {
          console.log('Lobby toggle not available:', error);
        }
      }, 1000);
    });
    
    externalApi.addEventListener('participantJoined', () => {
      setParticipantCount(prev => prev + 1);
    });
    
    externalApi.addEventListener('participantLeft', () => {
      setParticipantCount(prev => Math.max(0, prev - 1));
    });
    
    externalApi.addEventListener('videoConferenceLeft', () => {
      setMeetingStarted(false);
      setParticipantCount(0);
      setMeetingDuration(0);
      onMeetingEnd?.();
      onLeaveMeeting?.();
    });

    // Recording events
    externalApi.addEventListener('recordingStatusChanged', (event: any) => {
      setIsRecording(event.on);
    });
  };

  if (!embedded) {
    // Redirect mode - just open in new window
    useEffect(() => {
      handleOpenInNewWindow();
    }, []);

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-white text-xl mb-2">Opening Jitsi Meeting...</h2>
          <p className="text-gray-400">You should see a new window opening with your meeting.</p>
          <button
            onClick={handleOpenInNewWindow}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Open Meeting Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Meeting Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-white text-xl font-semibold">
              Meeting: {roomName}
            </h1>
            {meetingStarted && (
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDuration(meetingDuration)}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Recording Controls */}
            {meetingStarted && (
              <>
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </button>
                )}
                
                {isRecording && (
                  <div className="flex items-center text-red-400 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    REC
                  </div>
                )}
              </>
            )}
            
            {/* Open in New Window */}
            <button
              onClick={handleOpenInNewWindow}
              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Jitsi Meeting Container */}
      <div className="flex-1 relative">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableRecording: false, // Disable recording initially to avoid auth issues
            hideRecordingLabel: true,
            // Completely disable authentication features
            enableUserRolesBasedOnToken: false,
            enableInsecureRoomNameWarning: false,
            doNotFlipLocalVideo: true,
            // Disable all lobby and auth features
            enableLobbyChat: false,
            enableWelcomePage: false,
            enableClosePage: false,
            requireDisplayName: false,
            enableFeaturesBasedOnToken: false,
            disableInviteFunctions: false,
            // Force open meeting mode
            openBridgeChannel: true,
            // Disable prejoin completely
            prejoinPageEnabled: false,
            // Disable moderation features
            disableModeratorIndicator: true,
            disablePolls: true,
            disableReactions: false,
            // Performance and UI settings
            enableLayerSuspension: true,
            toolbarButtons: [
              'microphone',
              'camera', 
              'hangup',
              'fullscreen',
              'fodeviceselection',
              'stats',
              'settings'
            ],
            // Optimize for 1-to-1 meetings
            constraints: {
              video: {
                height: { ideal: 720, max: 1080, min: 240 },
                width: { ideal: 1280, max: 1920, min: 320 }
              }
            },
            // Better performance settings
            disableAudioLevels: false,
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            // Force disable any server-side lobby
            lobby: {
              enabled: false
            }
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_ALWAYS_VISIBLE: false,
            DEFAULT_BACKGROUND: '#1f2937',
            DISABLE_VIDEO_BACKGROUND: false,
            OPTIMAL_BROWSERS: ['chrome', 'chromium', 'firefox', 'safari', 'edge'],
            UNSUPPORTED_BROWSERS: []
          }}
          userInfo={{
            displayName: displayName,
            email: 'user@example.com' // Required by SDK
          }}
          onApiReady={handleApiReady}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
              iframeRef.style.border = 'none';
            }
          }}
        />
      </div>
    </div>
  );
};

export default JitsiMeetingRoom;
