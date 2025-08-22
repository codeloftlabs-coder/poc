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

  async createMeeting(params: CreateMeetingParams): Promise<any> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating BigBlueButton meeting:', error);
      throw error;
    }
  }

  async generateJoinURL(params: JoinMeetingParams): Promise<string> {
    const queryParams = new URLSearchParams({
      meetingID: params.meetingID,
      fullName: params.fullName,
      password: params.password,
      redirect: 'false'
    }).toString();

    try {
      const response = await fetch(`${this.config.serverUrl}/api/join?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.joinURL;
    } catch (error) {
      console.error('Error generating join URL:', error);
      throw error;
    }
  }

  async getMeetingInfo(meetingID: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/getMeetingInfo?meetingID=${meetingID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting meeting info:', error);
      throw error;
    }
  }

  async endMeeting(meetingID: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingID, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  }

  async getRecordings(meetingID?: string): Promise<any> {
    try {
      const url = meetingID
        ? `${this.config.serverUrl}/api/getRecordings?meetingID=${meetingID}`
        : `${this.config.serverUrl}/api/getRecordings`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recordings:', error);
      throw error;
    }
  }
}// Default configuration for local test server - no CORS issues!
export const defaultBBBConfig: BigBlueButtonConfig = {
  serverUrl: 'http://localhost:3001', // Local test API server
  apiSecret: '8cd8ef52e8e101574e400365b55e11a6' // Not used by test server, but kept for compatibility
};

export const bbbAPI = new BigBlueButtonAPI(defaultBBBConfig);