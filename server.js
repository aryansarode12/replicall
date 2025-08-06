require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Make call endpoint
app.post("/make-call", async (req, res) => {
  const { phone_number, task, first_sentence } = req.body;

  // Validate input
  if (!phone_number || !task) {
    return res.status(400).json({ 
      success: false,
      error: "Phone number and script are required" 
    });
  }

  try {
    // Prepare call payload with default values
    const callPayload = {
      phone_number,
      task,
      voice: "Alena",
      wait_for_greeting: false,
      record: true,
      answered_by_enabled: true,
      noise_cancellation: false,
      interruption_threshold: 100,
      block_interruptions: false,
      max_duration: 12,
      model: "base",
      language: "hi",
      background_track: "none",
      endpoint: "https://api.bland.ai",
      voicemail_action: "hangup"
    };

    // Add first sentence if provided
    if (first_sentence) {
      callPayload.first_sentence = first_sentence;
    }

    // Make the API call
    const callResponse = await axios.post(
      "https://api.bland.ai/v1/calls",
      callPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.BLAND_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    // Verify response
    if (!callResponse.data?.call_id) {
      throw new Error("Invalid response from Bland.ai API");
    }

    // Successful response
    res.json({ 
      success: true,
      call_id: callResponse.data.call_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Call error:", error.message);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    if (error.response) {
      errorResponse.api_error = error.response.data;
      errorResponse.status_code = error.response.status;
    }

    res.status(500).json(errorResponse);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔑 Using BLAND_API_KEY: ${process.env.BLAND_API_KEY ? 'Configured' : 'Missing'}`);
});