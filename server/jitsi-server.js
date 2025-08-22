import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Create recordings directory
const RECORDINGS_DIR = path.join(__dirname, '../recordings');
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Jitsi Meet configuration
const JITSI_CONFIG = {
  domain: "meet.jit.si", // Using public Jitsi server for demo
  // For production, use your own domain:
  // domain: "your-domain.com"
};

// In-memory storage for demo (use database in production)
let meetings = new Map();
let recordings = [];

// Helper functions
function generateRoomName(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function getMeetingUrl(roomName, displayName, options = {}) {
  const params = new URLSearchParams();
  
  if (displayName) {
    params.append('userInfo.displayName', displayName);
  }
  
  if (options.startWithVideoMuted) {
    params.append('config.startWithVideoMuted', 'true');
  }
  
  if (options.startWithAudioMuted) {
    params.append('config.startWithAudioMuted', 'true');
  }
  
  const queryString = params.toString();
  return `https://${JITSI_CONFIG.domain}/${encodeURIComponent(roomName)}${queryString ? '?' + queryString : ''}`;
}

// API Routes

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Jitsi Meet API Server is running!',
    domain: JITSI_CONFIG.domain,
    timestamp: new Date().toISOString()
  });
});

// Create meeting
app.post('/api/jitsi/create-meeting', (req, res) => {
  try {
    const { title, displayName, duration, startWithVideoMuted, startWithAudioMuted } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Meeting title is required'
      });
    }
    
    const roomName = generateRoomName(title);
    const meetingId = Date.now().toString();
    
    const meeting = {
      id: meetingId,
      roomName,
      title,
      url: getMeetingUrl(roomName, displayName, { startWithVideoMuted, startWithAudioMuted }),
      createdAt: new Date().toISOString(),
      duration: duration || 60,
      participants: [],
      isActive: false,
      recordingEnabled: true
    };
    
    meetings.set(meetingId, meeting);
    
    res.json({
      success: true,
      meeting: {
        id: meetingId,
        roomName,
        title,
        url: meeting.url,
        joinUrl: meeting.url,
        createdAt: meeting.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting'
    });
  }
});

// Generate join URL
app.post('/api/jitsi/join', (req, res) => {
  try {
    const { roomName, displayName, startWithVideoMuted, startWithAudioMuted } = req.body;
    
    if (!roomName || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Room name and display name are required'
      });
    }
    
    const url = getMeetingUrl(roomName, displayName, { startWithVideoMuted, startWithAudioMuted });
    
    res.json({
      success: true,
      joinUrl: url,
      roomName,
      displayName
    });
  } catch (error) {
    console.error('Error generating join URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate join URL'
    });
  }
});

// Get meeting info
app.get('/api/jitsi/meeting-info', (req, res) => {
  try {
    const { roomName } = req.query;
    
    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }
    
    // In a real implementation, you would get this from Jitsi API or database
    const meeting = Array.from(meetings.values()).find(m => m.roomName === roomName);
    
    if (!meeting) {
      return res.json({
        success: true,
        roomName,
        participantCount: 0,
        isRecording: false,
        isActive: false
      });
    }
    
    res.json({
      success: true,
      roomName: meeting.roomName,
      title: meeting.title,
      participantCount: meeting.participants.length,
      isRecording: meeting.isRecording || false,
      isActive: meeting.isActive || false,
      createdAt: meeting.createdAt
    });
  } catch (error) {
    console.error('Error getting meeting info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get meeting info'
    });
  }
});

// Start recording (placeholder - in production you'd use Jibri)
app.post('/api/jitsi/start-recording', (req, res) => {
  try {
    const { roomName } = req.body;
    
    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }
    
    // In production, start Jibri recording here
    console.log(`Starting recording for room: ${roomName}`);
    
    // Update meeting recording status
    const meeting = Array.from(meetings.values()).find(m => m.roomName === roomName);
    if (meeting) {
      meeting.isRecording = true;
    }
    
    res.json({
      success: true,
      message: 'Recording started',
      roomName
    });
  } catch (error) {
    console.error('Error starting recording:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start recording'
    });
  }
});

// Stop recording
app.post('/api/jitsi/stop-recording', (req, res) => {
  try {
    const { roomName } = req.body;
    
    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }
    
    // In production, stop Jibri recording here
    console.log(`Stopping recording for room: ${roomName}`);
    
    // Update meeting recording status and create recording entry
    const meeting = Array.from(meetings.values()).find(m => m.roomName === roomName);
    if (meeting) {
      meeting.isRecording = false;
      
      // Create recording entry
      const recording = {
        id: Date.now().toString(),
        roomName,
        title: meeting.title,
        startTime: new Date(meeting.createdAt).getTime(),
        endTime: Date.now(),
        fileName: `${roomName}_${Date.now()}.mp4`,
        size: Math.floor(Math.random() * 100000000), // Mock file size
        url: `/recordings/${roomName}_${Date.now()}.mp4`,
        status: 'completed'
      };
      
      recordings.push(recording);
    }
    
    res.json({
      success: true,
      message: 'Recording stopped',
      roomName
    });
  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop recording'
    });
  }
});

// Get recordings
app.get('/api/jitsi/recordings', (req, res) => {
  try {
    const { roomName } = req.query;
    
    let filteredRecordings = recordings;
    
    if (roomName) {
      filteredRecordings = recordings.filter(r => r.roomName === roomName);
    }
    
    res.json({
      success: true,
      recordings: filteredRecordings.map(recording => ({
        recordID: recording.id,
        meetingID: recording.roomName,
        name: recording.title,
        published: true,
        state: recording.status,
        startTime: recording.startTime,
        endTime: recording.endTime,
        participants: Math.floor(Math.random() * 5) + 1, // Mock participant count
        playbackUrl: `http://localhost:${PORT}${recording.url}`,
        size: recording.size
      }))
    });
  } catch (error) {
    console.error('Error getting recordings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recordings'
    });
  }
});

// Get all meetings
app.get('/api/jitsi/meetings', (req, res) => {
  try {
    const meetingsList = Array.from(meetings.values()).map(meeting => ({
      id: meeting.id,
      roomName: meeting.roomName,
      title: meeting.title,
      url: meeting.url,
      createdAt: meeting.createdAt,
      participantCount: meeting.participants.length,
      isActive: meeting.isActive,
      isRecording: meeting.isRecording
    }));
    
    res.json({
      success: true,
      meetings: meetingsList
    });
  } catch (error) {
    console.error('Error getting meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get meetings'
    });
  }
});

// Serve recording files (placeholder)
app.get('/recordings/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(RECORDINGS_DIR, fileName);
  
  // In production, serve actual video files
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Recording not found' });
  }
  
  res.sendFile(filePath);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Jitsi Meet API',
    timestamp: new Date().toISOString(),
    domain: JITSI_CONFIG.domain
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Jitsi Meet API Server running on http://localhost:${PORT}`);
  console.log(`🌐 Using Jitsi domain: ${JITSI_CONFIG.domain}`);
  console.log(`📁 Recordings stored in: ${RECORDINGS_DIR}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /api/test - Test endpoint`);
  console.log(`   POST /api/jitsi/create-meeting - Create meeting`);
  console.log(`   POST /api/jitsi/join - Generate join URL`);
  console.log(`   GET  /api/jitsi/meeting-info - Get meeting info`);
  console.log(`   GET  /api/jitsi/meetings - Get all meetings`);
  console.log(`   POST /api/jitsi/start-recording - Start recording`);
  console.log(`   POST /api/jitsi/stop-recording - Stop recording`);
  console.log(`   GET  /api/jitsi/recordings - Get recordings`);
  console.log(`   GET  /recordings/:fileName - Serve recording files`);
  console.log(`   GET  /health - Health check`);
  console.log();
  console.log(`💡 Ready for 1-to-1 meetings with recording capability!`);
});
