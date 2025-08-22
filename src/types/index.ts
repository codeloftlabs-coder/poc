export interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledTime: Date;
  duration: number;
  students: Student[];
  status: 'scheduled' | 'active' | 'completed';
  recordingEnabled: boolean;
  recordingUrl?: string;
  roomName?: string;
  joinUrl?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface JitsiConfig {
  domain: string;
  appId?: string;
}

export interface Recording {
  id: string;
  meetingId: string;
  filename: string;
  createdAt: string;
  size: number;
  duration?: number;
}