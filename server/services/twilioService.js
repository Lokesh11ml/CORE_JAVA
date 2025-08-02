const twilio = require('twilio');
const Call = require('../models/Call');
const Lead = require('../models/Lead');
const User = require('../models/User');

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.webhookSecret = process.env.TWILIO_WEBHOOK_SECRET;
  }

  // Initiate a call from telecaller to lead
  async initiateCall(telecallerId, leadId, callType = 'outbound') {
    try {
      const telecaller = await User.findById(telecallerId);
      const lead = await Lead.findById(leadId);

      if (!telecaller || !lead) {
        throw new Error('Telecaller or lead not found');
      }

      // Create call record
      const call = new Call({
        telecaller: telecallerId,
        lead: leadId,
        callType,
        status: 'initiated',
        startTime: new Date()
      });

      await call.save();

      // Create TwiML for the call
      const twiml = new twilio.twiml.VoiceResponse();
      
      // Add recording
      twiml.record({
        action: `${process.env.BASE_URL}/api/calls/recording-complete`,
        maxLength: 3600, // 1 hour max
        recordingStatusCallback: `${process.env.BASE_URL}/api/calls/recording-status`,
        recordingStatusCallbackEvent: ['completed'],
        trim: 'trim-silence'
      });

      // Make the call using Twilio
      const callResult = await this.client.calls.create({
        url: `${process.env.BASE_URL}/api/calls/twiml/${call._id}`,
        to: lead.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        statusCallback: `${process.env.BASE_URL}/api/calls/status-callback`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true,
        recordingChannels: 'dual',
        recordingStatusCallback: `${process.env.BASE_URL}/api/calls/recording-status`,
        recordingStatusCallbackEvent: ['completed']
      });

      // Update call with Twilio SID
      call.twilioCallSid = callResult.sid;
      await call.save();

      return {
        success: true,
        call: call,
        twilioCall: callResult
      };

    } catch (error) {
      console.error('Call initiation error:', error);
      throw error;
    }
  }

  // Handle call status webhook from Twilio
  async handleCallStatus(callSid, callStatus, duration, recordingUrl) {
    try {
      const call = await Call.findOne({ twilioCallSid: callSid });
      
      if (!call) {
        console.error('Call not found for SID:', callSid);
        return;
      }

      // Update call status
      call.status = callStatus;
      call.duration = duration || 0;
      call.endTime = new Date();
      
      if (recordingUrl) {
        call.recordingUrl = recordingUrl;
      }

      await call.save();

      // Update lead status based on call result
      if (callStatus === 'completed' && duration > 0) {
        await this.updateLeadStatus(call.lead, 'contacted');
      }

      // Emit real-time update
      if (global.io) {
        global.io.to(`user-${call.telecaller}`).emit('call-status-updated', {
          callId: call._id,
          status: callStatus,
          duration: duration
        });
      }

      return call;

    } catch (error) {
      console.error('Call status update error:', error);
      throw error;
    }
  }

  // Handle recording status webhook
  async handleRecordingStatus(callSid, recordingUrl, recordingDuration) {
    try {
      const call = await Call.findOne({ twilioCallSid: callSid });
      
      if (!call) {
        console.error('Call not found for recording SID:', callSid);
        return;
      }

      call.recordingUrl = recordingUrl;
      call.recordingDuration = recordingDuration;
      await call.save();

      return call;

    } catch (error) {
      console.error('Recording status update error:', error);
      throw error;
    }
  }

  // Update lead status after call
  async updateLeadStatus(leadId, status) {
    try {
      const lead = await Lead.findById(leadId);
      if (lead) {
        lead.status = status;
        lead.lastContactDate = new Date();
        lead.followupCount += 1;
        await lead.save();
      }
    } catch (error) {
      console.error('Lead status update error:', error);
    }
  }

  // Generate TwiML for call
  generateTwiML(callId) {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Add a brief message
    twiml.say('Please wait while we connect you to the telecaller.');
    
    // Add recording
    twiml.record({
      action: `${process.env.BASE_URL}/api/calls/recording-complete`,
      maxLength: 3600,
      recordingStatusCallback: `${process.env.BASE_URL}/api/calls/recording-status`,
      recordingStatusCallbackEvent: ['completed'],
      trim: 'trim-silence'
    });

    return twiml.toString();
  }

  // Verify webhook signature
  verifyWebhookSignature(signature, url, params) {
    try {
      return twilio.validateRequest(
        this.webhookSecret,
        signature,
        url,
        params
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  // Get call analytics
  async getCallAnalytics(userId, startDate, endDate) {
    try {
      const query = {
        telecaller: userId,
        startTime: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const calls = await Call.find(query);
      
      const analytics = {
        totalCalls: calls.length,
        completedCalls: calls.filter(c => c.status === 'completed').length,
        totalDuration: calls.reduce((sum, c) => sum + (c.duration || 0), 0),
        averageDuration: calls.length > 0 ? 
          calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length : 0,
        missedCalls: calls.filter(c => c.status === 'no-answer').length,
        failedCalls: calls.filter(c => c.status === 'failed').length
      };

      return analytics;

    } catch (error) {
      console.error('Call analytics error:', error);
      throw error;
    }
  }
}

module.exports = new TwilioService();