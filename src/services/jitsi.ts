export interface JitsiMeetConfig {
    domain: string;
    appId?: string;
}

export interface CreateMeetingParams {
    roomName: string;
    displayName: string;
    subject?: string;
    password?: string;
}

export interface JitsiMeetingInfo {
    roomName: string;
    participantCount: number;
    isRecording: boolean;
    startTime?: number;
}

export class JitsiMeetAPI {
    private config: JitsiMeetConfig;

    constructor(config: JitsiMeetConfig) {
        this.config = config;
    }

    generateMeetingUrl(roomName: string, displayName: string, options?: {
        startWithVideoMuted?: boolean;
        startWithAudioMuted?: boolean;
        password?: string;
    }): string {
        const params = new URLSearchParams();

        if (displayName) {
            params.append('userInfo.displayName', displayName);
        }

        if (options?.startWithVideoMuted) {
            params.append('config.startWithVideoMuted', 'true');
        }

        if (options?.startWithAudioMuted) {
            params.append('config.startWithAudioMuted', 'true');
        }

        if (options?.password) {
            params.append('config.roomPassword', options.password);
        }

        const queryString = params.toString();
        return `https://${this.config.domain}/${encodeURIComponent(roomName)}${queryString ? '?' + queryString : ''}`;
    }

    openMeeting(roomName: string, displayName: string, options?: {
        newWindow?: boolean;
        windowFeatures?: string;
    }): Window | null {
        const url = this.generateMeetingUrl(roomName, displayName);

        if (options?.newWindow !== false) {
            const features = options?.windowFeatures || 'width=1200,height=800,scrollbars=yes,resizable=yes';
            return window.open(url, '_blank', features);
        } else {
            window.location.href = url;
            return null;
        }
    }

    // For server-side recording management
    async startRecording(roomName: string): Promise<any> {
        try {
            const response = await fetch('/api/jitsi/start-recording', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomName }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    async stopRecording(roomName: string): Promise<any> {
        try {
            const response = await fetch('/api/jitsi/stop-recording', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomName }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error stopping recording:', error);
            throw error;
        }
    }

    async getRecordings(roomName?: string): Promise<any> {
        try {
            const url = roomName
                ? `/api/jitsi/recordings?roomName=${encodeURIComponent(roomName)}`
                : '/api/jitsi/recordings';

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

    async deleteRecording(recordingId: string): Promise<any> {
        try {
            const response = await fetch(`/api/jitsi/recordings/${recordingId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting recording:', error);
            throw error;
        }
    }

    async getMeetingInfo(roomName: string): Promise<JitsiMeetingInfo> {
        try {
            const response = await fetch(`/api/jitsi/meeting-info?roomName=${encodeURIComponent(roomName)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting meeting info:', error);
            throw error;
        }
    }
}

// Default configuration
export const defaultJitsiConfig: JitsiMeetConfig = {
    domain: 'meet.jit.si', // Free public Jitsi server
    // For production, replace with your own domain:
    // domain: 'your-domain.com'
};

export const jitsiAPI = new JitsiMeetAPI(defaultJitsiConfig);
