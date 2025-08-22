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
  meetingId?: string;
  attendeePassword?: string;
  moderatorPassword?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface BigBlueButtonConfig {
  serverUrl: string;
  apiSecret: string;
}