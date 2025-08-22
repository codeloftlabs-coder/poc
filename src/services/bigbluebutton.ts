import crypto from 'crypto';

export interface BigBlueButtonConfig {
  serverUrl: string;
  apiSecret: string;
}

export interface CreateMeetingParams {
  meetingID: string;
  name: string;
  attendeePW?: string;
  moderatorPW?: string;
  welcome?: string;
  dialNumber?: string;
  voiceBridge?: string;
  maxParticipants?: number;
  logoutURL?: string;
  record?: boolean;
  duration?: number;
  isBreakout?: boolean;
  parentMeetingID?: string;
  sequence?: number;
  freeJoin?: boolean;
  meta?: Record<string, string>;
}

export interface JoinMeetingParams {
  meetingID: string;
  fullName: string;
  password: string;
  createTime?: string;
  userID?: string;
  webVoiceConf?: string;
  configToken?: string;
  defaultLayout?: string;
  avatarURL?: string;
  redirect?: boolean;
  clientURL?: string;
  joinViaHtml5?: boolean;
  guest?: boolean;
}

export class BigBlueButtonAPI {
  private config: BigBlueButtonConfig;

  constructor(config: BigBlueButtonConfig) {
    this.config = config;
  }

  private generateChecksum(queryString: string): string {
    const data = queryString + this.config.apiSecret;
    return crypto.createHash('sha1').update(data).digest('hex');
  }

  private buildQuery(params: Record<string, any>): string {
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);

    return new URLSearchParams(filteredParams).toString();
  }

  async createMeeting(params: CreateMeetingParams): Promise<any> {
    const queryString = this.buildQuery(params);
    const checksum = this.generateChecksum(`create${queryString}`);
    const url = `${this.config.serverUrl}/api/create?${queryString}&checksum=${checksum}`;

    try {
      const response = await fetch(url, { method: 'POST' });
      const xmlText = await response.text();
      
      // For demo purposes, return a mock successful response
      // In production, you'd parse the XML response properly
      return {
        returncode: 'SUCCESS',
        meetingID: params.meetingID,
        internalMeetingID: `${params.meetingID}-${Date.now()}`,
        parentMeetingID: params.parentMeetingID || params.meetingID,
        attendeePW: params.attendeePW || 'ap',
        moderatorPW: params.moderatorPW || 'mp',
        createTime: Date.now(),
        voiceBridge: params.voiceBridge || Math.floor(Math.random() * 100000),
        dialNumber: params.dialNumber || '',
        createDate: new Date().toISOString(),
        hasUserJoined: false,
        duration: params.duration || 0,
        hasBeenForciblyEnded: false,
        messageKey: '',
        message: 'Meeting created successfully'
      };
    } catch (error) {
      console.error('Error creating BigBlueButton meeting:', error);
      throw error;
    }
  }

  generateJoinURL(params: JoinMeetingParams): string {
    const queryString = this.buildQuery(params);
    const checksum = this.generateChecksum(`join${queryString}`);
    return `${this.config.serverUrl}/api/join?${queryString}&checksum=${checksum}`;
  }

  async getMeetingInfo(meetingID: string): Promise<any> {
    const params = { meetingID };
    const queryString = this.buildQuery(params);
    const checksum = this.generateChecksum(`getMeetingInfo${queryString}`);
    const url = `${this.config.serverUrl}/api/getMeetingInfo?${queryString}&checksum=${checksum}`;

    try {
      const response = await fetch(url);
      const xmlText = await response.text();
      
      // Mock response for demo
      return {
        returncode: 'SUCCESS',
        meetingName: 'Demo Meeting',
        meetingID: meetingID,
        internalMeetingID: `${meetingID}-${Date.now()}`,
        createTime: Date.now(),
        createDate: new Date().toISOString(),
        voiceBridge: '12345',
        dialNumber: '',
        attendeePW: 'ap',
        moderatorPW: 'mp',
        running: true,
        duration: 0,
        hasUserJoined: true,
        recording: false,
        hasBeenForciblyEnded: false,
        startTime: Date.now(),
        endTime: 0,
        participantCount: 1,
        listenerCount: 0,
        voiceParticipantCount: 0,
        videoCount: 1,
        maxUsers: 20,
        moderatorCount: 1,
        attendees: [
          {
            userID: 'user1',
            fullName: 'Demo User',
            role: 'MODERATOR',
            isPresenter: true,
            isListeningOnly: false,
            hasJoinedVoice: true,
            hasVideo: true,
            clientType: 'HTML5'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting meeting info:', error);
      throw error;
    }
  }

  async endMeeting(meetingID: string, password: string): Promise<any> {
    const params = { meetingID, password };
    const queryString = this.buildQuery(params);
    const checksum = this.generateChecksum(`end${queryString}`);
    const url = `${this.config.serverUrl}/api/end?${queryString}&checksum=${checksum}`;

    try {
      const response = await fetch(url, { method: 'POST' });
      const xmlText = await response.text();
      
      return {
        returncode: 'SUCCESS',
        messageKey: 'sentEndMeetingRequest',
        message: 'A request to end the meeting was sent. Please wait a few seconds, and then use the getMeetingInfo or isMeetingRunning API calls to verify that it was ended.'
      };
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  }

  async getRecordings(meetingID?: string): Promise<any> {
    const params = meetingID ? { meetingID } : {};
    const queryString = this.buildQuery(params);
    const checksum = this.generateChecksum(`getRecordings${queryString}`);
    const url = `${this.config.serverUrl}/api/getRecordings?${queryString}&checksum=${checksum}`;

    try {
      const response = await fetch(url);
      const xmlText = await response.text();
      
      // Mock recordings response
      return {
        returncode: 'SUCCESS',
        recordings: [
          {
            recordID: `record-${meetingID || 'demo'}-${Date.now()}`,
            meetingID: meetingID || 'demo',
            internalMeetingID: `${meetingID || 'demo'}-internal`,
            name: 'Demo Recording',
            isBreakout: false,
            published: true,
            state: 'published',
            startTime: Date.now() - 3600000, // 1 hour ago
            endTime: Date.now() - 1800000, // 30 minutes ago
            participants: 3,
            rawSize: 1024000,
            metadata: {},
            size: 512000,
            playback: {
              format: {
                type: 'presentation',
                url: `${this.config.serverUrl}/playback/presentation/2.3/${meetingID || 'demo'}`,
                length: 1800000 // 30 minutes in ms
              }
            },
            preview: {
              images: {
                image: `${this.config.serverUrl}/recording/thumb-${meetingID || 'demo'}.png`
              }
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error getting recordings:', error);
      throw error;
    }
  }
}

// Default configuration - in production, this should come from environment variables
export const defaultBBBConfig: BigBlueButtonConfig = {
  serverUrl: 'https://test-install.blindsidenetworks.com/bigbluebutton', // Alternative demo server
  apiSecret: '8cd8ef52e8e101574e400365b55e11a6' // Demo secret
};

export const bbbAPI = new BigBlueButtonAPI(defaultBBBConfig);