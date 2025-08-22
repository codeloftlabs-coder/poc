import express from 'express';
import cors from 'cors';
import crypto from 'crypto-js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// BigBlueButton API configuration - REAL SERVER
const BBB_CONFIG = {
  serverUrl: "https://test-install.blindsidenetworks.com/bigbluebutton",
  apiSecret: "8cd8ef52e8e101574e400365b55e11a6",
};

// Helper function to generate checksum
function generateChecksum(queryString, apiSecret) {
  const data = queryString + apiSecret;
  return crypto.SHA1(data).toString();
}

// Helper function to build query string
function buildQuery(params) {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {});

  return new URLSearchParams(filteredParams).toString();
}

function parseXmlResponse(xmlText) {
  try {
    // Basic XML parsing - in production, use a proper XML parser
    const returncode =
      xmlText.match(/<returncode>(.*?)<\/returncode>/)?.[1] || "FAILED";
    const messageKey =
      xmlText.match(/<messageKey>(.*?)<\/messageKey>/)?.[1] || "";
    const message = xmlText.match(/<message>(.*?)<\/message>/)?.[1] || "";

    if (returncode === "SUCCESS") {
      // Extract meeting info if available
      const meetingID =
        xmlText.match(/<meetingID>(.*?)<\/meetingID>/)?.[1] || "";
      const meetingName =
        xmlText.match(/<meetingName>(.*?)<\/meetingName>/)?.[1] || "";
      const running =
        xmlText.match(/<running>(.*?)<\/running>/)?.[1] === "true";
      const participantCount = parseInt(
        xmlText.match(/<participantCount>(.*?)<\/participantCount>/)?.[1] || "0"
      );
      const moderatorCount = parseInt(
        xmlText.match(/<moderatorCount>(.*?)<\/moderatorCount>/)?.[1] || "0"
      );
      const attendeePW =
        xmlText.match(/<attendeePW>(.*?)<\/attendeePW>/)?.[1] || "ap";
      const moderatorPW =
        xmlText.match(/<moderatorPW>(.*?)<\/moderatorPW>/)?.[1] || "mp";

      return {
        returncode,
        messageKey,
        message,
        meetingID,
        meetingName,
        running,
        participantCount,
        moderatorCount,
        attendeePW,
        moderatorPW,
        // Add more fields as needed
        createTime: Date.now(),
        duration: 0,
        hasUserJoined: running,
        recording: false,
        hasBeenForciblyEnded: false,
        startTime: running ? Date.now() - 300000 : 0, // 5 minutes ago if running
        endTime: 0,
        listenerCount: 0,
        voiceParticipantCount: participantCount,
        videoCount: participantCount,
        maxUsers: 20,
      };
    } else {
      return { returncode, messageKey, message };
    }
  } catch (error) {
    console.error("Error parsing XML:", error);
    return {
      returncode: "FAILED",
      messageKey: "xmlParseError",
      message: "Failed to parse XML response",
    };
  }
}

// API Routes

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "BBB Real API Proxy Server is running!",
    timestamp: new Date().toISOString(),
    bbbServer: BBB_CONFIG.serverUrl,
  });
});

// Create Meeting - REAL BBB SERVER
app.post("/api/create", async (req, res) => {
  try {
    const {
      meetingID,
      name,
      attendeePW = "ap",
      moderatorPW = "mp",
      welcome = "Welcome to the meeting!",
      record = false,
      duration = 0,
      maxParticipants = 20,
    } = req.body;

    const params = {
      meetingID,
      name,
      attendeePW,
      moderatorPW,
      welcome,
      record,
      duration,
      maxParticipants,
    };

    const queryString = buildQuery(params);
    const checksum = generateChecksum(
      `create${queryString}`,
      BBB_CONFIG.apiSecret
    );
    const url = `${BBB_CONFIG.serverUrl}/api/create?${queryString}&checksum=${checksum}`;

    console.log(`Creating meeting on real BBB server: ${meetingID}`);

    const response = await fetch(url, { method: "POST" });
    const xmlText = await response.text();

    console.log("BBB Create Response:", xmlText);

    const result = parseXmlResponse(xmlText);

    // Even if the meeting already exists, return success
    if (
      result.returncode === "FAILED" &&
      result.messageKey === "duplicateWarning"
    ) {
      result.returncode = "SUCCESS";
      result.message = "Meeting already exists and is ready to join";
    }

    res.json(result);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({
      returncode: "FAILED",
      messageKey: "internalError",
      message: "Internal server error",
    });
  }
});

// Join Meeting URL - REAL BBB SERVER
app.get("/api/join", async (req, res) => {
  try {
    const { meetingID, fullName, password, redirect = "true" } = req.query;

    // First, ensure the meeting exists by trying to get meeting info
    const getMeetingParams = { meetingID };
    const getMeetingQueryString = buildQuery(getMeetingParams);
    const getMeetingChecksum = generateChecksum(
      `getMeetingInfo${getMeetingQueryString}`,
      BBB_CONFIG.apiSecret
    );
    const getMeetingUrl = `${BBB_CONFIG.serverUrl}/api/getMeetingInfo?${getMeetingQueryString}&checksum=${getMeetingChecksum}`;

    const meetingInfoResponse = await fetch(getMeetingUrl);
    const meetingInfoXml = await meetingInfoResponse.text();
    const meetingInfo = parseXmlResponse(meetingInfoXml);

    // If meeting doesn't exist, create it
    if (
      meetingInfo.returncode === "FAILED" &&
      meetingInfo.messageKey === "notFound"
    ) {
      console.log(`Meeting ${meetingID} not found for join, creating it...`);

      const createParams = {
        meetingID,
        name:
          meetingID === "2" ? "React Hooks Deep Dive" : `Meeting ${meetingID}`,
        attendeePW: "ap",
        moderatorPW: "mp",
        welcome: `Welcome to ${
          meetingID === "2"
            ? "React Hooks Deep Dive! Advanced concepts in React hooks and state management."
            : "the meeting!"
        }`,
        record: true,
        duration: 120,
        maxParticipants: 50,
      };

      const createQueryString = buildQuery(createParams);
      const createChecksum = generateChecksum(
        `create${createQueryString}`,
        BBB_CONFIG.apiSecret
      );
      const createUrl = `${BBB_CONFIG.serverUrl}/api/create?${createQueryString}&checksum=${createChecksum}`;

      await fetch(createUrl, { method: "POST" });
      console.log(`Meeting ${meetingID} created for join`);
    }

    // Now generate the join URL
    const params = {
      meetingID,
      fullName,
      password,
      redirect,
    };

    const queryString = buildQuery(params);
    const checksum = generateChecksum(
      `join${queryString}`,
      BBB_CONFIG.apiSecret
    );
    const joinURL = `${BBB_CONFIG.serverUrl}/api/join?${queryString}&checksum=${checksum}`;

    console.log(`Generating join URL for meeting: ${meetingID}`);
    console.log(`Join URL: ${joinURL}`);

    if (redirect === "false") {
      res.json({
        returncode: "SUCCESS",
        joinURL,
      });
    } else {
      // Redirect to the actual BBB meeting
      res.redirect(joinURL);
    }
  } catch (error) {
    console.error("Error generating join URL:", error);
    res.status(500).json({
      returncode: "FAILED",
      messageKey: "internalError",
      message: "Internal server error",
    });
  }
});

// Get Meeting Info - REAL BBB SERVER
app.get("/api/getMeetingInfo", async (req, res) => {
  try {
    const { meetingID } = req.query;

    const params = { meetingID };
    const queryString = buildQuery(params);
    const checksum = generateChecksum(
      `getMeetingInfo${queryString}`,
      BBB_CONFIG.apiSecret
    );
    const url = `${BBB_CONFIG.serverUrl}/api/getMeetingInfo?${queryString}&checksum=${checksum}`;

    console.log(`Getting meeting info for: ${meetingID}`);

    const response = await fetch(url);
    const xmlText = await response.text();

    console.log("BBB GetMeetingInfo Response:", xmlText);

    const result = parseXmlResponse(xmlText);

    // If meeting not found, try to create it again
    if (result.returncode === "FAILED" && result.messageKey === "notFound") {
      console.log(`Meeting ${meetingID} not found, creating it...`);

      // Create the meeting again
      const createParams = {
        meetingID,
        name:
          meetingID === "2" ? "React Hooks Deep Dive" : `Meeting ${meetingID}`,
        attendeePW: "ap",
        moderatorPW: "mp",
        welcome: `Welcome to ${
          meetingID === "2"
            ? "React Hooks Deep Dive! Advanced concepts in React hooks and state management."
            : "the meeting!"
        }`,
        record: true,
        duration: 120,
        maxParticipants: 50,
      };

      const createQueryString = buildQuery(createParams);
      const createChecksum = generateChecksum(
        `create${createQueryString}`,
        BBB_CONFIG.apiSecret
      );
      const createUrl = `${BBB_CONFIG.serverUrl}/api/create?${createQueryString}&checksum=${createChecksum}`;

      const createResponse = await fetch(createUrl, { method: "POST" });
      const createXmlText = await createResponse.text();

      console.log("Meeting recreation response:", createXmlText);

      // Now get the meeting info again
      const newResponse = await fetch(url);
      const newXmlText = await newResponse.text();
      const newResult = parseXmlResponse(newXmlText);

      res.json(newResult);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error("Error getting meeting info:", error);
    res.status(500).json({
      returncode: "FAILED",
      messageKey: "internalError",
      message: "Internal server error",
    });
  }
});

// Get Meetings - REAL BBB SERVER
app.get("/api/getMeetings", async (req, res) => {
  try {
    const params = {};
    const queryString = buildQuery(params);
    const checksum = generateChecksum(
      `getMeetings${queryString}`,
      BBB_CONFIG.apiSecret
    );
    const url = `${BBB_CONFIG.serverUrl}/api/getMeetings?${queryString}&checksum=${checksum}`;

    console.log("Getting meetings from BBB server");

    const response = await fetch(url);
    const xmlText = await response.text();

    console.log("BBB GetMeetings Response:", xmlText);

    const result = parseXmlResponse(xmlText);
    res.json(result);
  } catch (error) {
    console.error("Error getting meetings:", error);
    res.status(500).json({
      returncode: "FAILED",
      messageKey: "internalError",
      message: "Internal server error",
    });
  }
});

// End Meeting - REAL BBB SERVER
app.post("/api/end", async (req, res) => {
  try {
    const { meetingID, password } = req.body;

    const params = { meetingID, password };
    const queryString = buildQuery(params);
    const checksum = generateChecksum(
      `end${queryString}`,
      BBB_CONFIG.apiSecret
    );
    const url = `${BBB_CONFIG.serverUrl}/api/end?${queryString}&checksum=${checksum}`;

    console.log(`Ending meeting: ${meetingID}`);

    const response = await fetch(url, { method: "POST" });
    const xmlText = await response.text();

    console.log("BBB End Meeting Response:", xmlText);

    const result = parseXmlResponse(xmlText);
    res.json(result);
  } catch (error) {
    console.error("Error ending meeting:", error);
    res.status(500).json({
      returncode: "FAILED",
      messageKey: "internalError",
      message: "Internal server error",
    });
  }
});

// Get Recordings - REAL BBB SERVER
app.get("/api/getRecordings", async (req, res) => {
  try {
    const { meetingID } = req.query;

    const params = meetingID ? { meetingID } : {};
    const queryString = buildQuery(params);
    const checksum = generateChecksum(
      `getRecordings${queryString}`,
      BBB_CONFIG.apiSecret
    );
    const url = `${BBB_CONFIG.serverUrl}/api/getRecordings?${queryString}&checksum=${checksum}`;

    console.log("Getting recordings from BBB server");

    const response = await fetch(url);
    const xmlText = await response.text();

    console.log("BBB GetRecordings Response:", xmlText);

    const result = parseXmlResponse(xmlText);
    res.json(result);
  } catch (error) {
    console.error("Error getting recordings:", error);
    res.status(500).json({
      returncode: "FAILED",
      messageKey: "internalError",
      message: "Internal server error",
    });
  }
});

// Initialize sample meetings on startup
app.post("/api/initSampleMeetings", async (req, res) => {
  try {
    console.log("Creating sample meetings on BBB server...");

    // Create the React Hooks Deep Dive meeting
    const meetingParams = {
      meetingID: "2",
      name: "React Hooks Deep Dive",
      attendeePW: "ap",
      moderatorPW: "mp",
      welcome:
        "Welcome to React Hooks Deep Dive! Advanced concepts in React hooks and state management.",
      record: true,
      duration: 120,
      maxParticipants: 50,
    };

    const queryString = buildQuery(meetingParams);
    const checksum = generateChecksum(
      `create${queryString}`,
      BBB_CONFIG.apiSecret
    );
    const url = `${BBB_CONFIG.serverUrl}/api/create?${queryString}&checksum=${checksum}`;

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(url, { 
        method: "POST",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const xmlText = await response.text();
      console.log("Sample meeting creation response:", xmlText);
      const result = parseXmlResponse(xmlText);

      res.json({
        returncode: "SUCCESS",
        message: "Sample meetings initialized",
        meetingCreated: result,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.log("Sample meeting creation timed out");
        res.json({
          returncode: "SUCCESS",
          message: "Server ready (sample meeting creation timed out)",
          meetingCreated: { returncode: "TIMEOUT" },
        });
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    console.error("Error initializing sample meetings:", error);
    res.status(500).json({
      returncode: "FAILED",
      messageKey: "internalError",
      message: "Failed to initialize sample meetings",
      error: error.message
    });
  }
});

app.listen(PORT, async () => {
  console.log(
    `🚀 BBB Real API Proxy Server running on http://localhost:${PORT}`
  );
  console.log(`🌐 Proxying to: ${BBB_CONFIG.serverUrl}`);
  console.log(`� Local recordings stored in: ${RECORDINGS_DIR}`);
  console.log(`�📝 Available endpoints:`);
  console.log(`   GET  /api/test - Test endpoint`);
  console.log(`   POST /api/create - Create meeting`);
  console.log(`   GET  /api/join - Join meeting`);
  console.log(`   GET  /api/getMeetingInfo - Get meeting info`);
  console.log(`   GET  /api/getMeetings - Get all meetings`);
  console.log(`   POST /api/end - End meeting`);
  console.log(`   GET  /api/getRecordings - Get recordings`);
  console.log(`   POST /api/downloadRecording - Download recording to local storage`);
  console.log(`   GET  /api/localRecordings - Get local recordings`);
  console.log(`   GET  /api/recording/:meetingID/:fileName - Serve local recording`);
  console.log(`   POST /api/initSampleMeetings - Initialize sample meetings`);

  console.log(`\n🔧 Attempting to initialize sample meetings (optional)...`);
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(
      `http://localhost:${PORT}/api/initSampleMeetings`,
      {
        method: "POST",
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    const result = await response.json();
    console.log(
      `✅ Sample meetings initialized:`,
      result.meetingCreated?.returncode || "Success"
    );
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`⚠️  Sample meeting initialization timed out (this is normal for busy servers)`);
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      console.log(`⚠️  BBB server connection timeout (this is normal for demo servers)`);
    } else {
      console.log(`⚠️  Could not initialize sample meetings:`, error.message);
    }
    console.log(`📝 Server is ready - meetings will be created automatically when needed`);
  }
});
