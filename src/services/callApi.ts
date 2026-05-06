export const CALL_API_BASE = '';

const makeRequest = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
  const url = `${CALL_API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      console.warn(`Call API warning (${response.status}): ${endpoint} not found on server yet.`);
      return {}; // return empty object so app doesn't crash on unimplemented routes
    }
    
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  } catch (e) {
    console.warn(`Call API error: ${endpoint}`, e);
    return {};
  }
};

export const callApi = {
  // 1 a 10: Criação Básica e Controle
  create1v1Voice: (data?: any) => makeRequest('/api/calls/voice/1v1/create', 'POST', data),
  get1v1Voice: (callId: string) => makeRequest(`/api/calls/voice/1v1/${callId}`),
  create1v1Video: (data?: any) => makeRequest('/api/calls/video/1v1/create', 'POST', data),
  get1v1Video: (callId: string) => makeRequest(`/api/calls/video/1v1/${callId}`),
  createGroupVoice: (data?: any) => makeRequest('/api/calls/voice/group/create', 'POST', data),
  getGroupVoice: (callId: string) => makeRequest(`/api/calls/voice/group/${callId}`),
  createGroupVideo: (data?: any) => makeRequest('/api/calls/video/group/create', 'POST', data),
  getGroupVideo: (callId: string) => makeRequest(`/api/calls/video/group/${callId}`),
  acceptCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/accept`, 'POST', data),
  getCallStatus: (callId: string) => makeRequest(`/api/calls/${callId}/status`),
  rejectCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/reject`, 'POST', data),
  cancelCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/cancel`, 'POST', data),
  endCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/end`, 'POST', data),
  getCallSummary: (callId: string) => makeRequest(`/api/calls/${callId}/summary`),
  holdCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/hold`, 'POST', data),
  getCallHoldStatus: (callId: string) => makeRequest(`/api/calls/${callId}/hold-status`),
  resumeCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/resume`, 'POST', data),

  // 11 a 20: Listagens e Participantes
  filterActiveCalls: (data?: any) => makeRequest('/api/calls/active/filter', 'POST', data),
  getActiveCalls: () => makeRequest('/api/calls/active'),
  searchCallHistory: (data?: any) => makeRequest('/api/calls/history/search', 'POST', data),
  getCallHistory: () => makeRequest('/api/calls/history'),
  requestCallDetails: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/details/request`, 'POST', data),
  getCallDetails: (callId: string) => makeRequest(`/api/calls/${callId}/details`),
  refreshDuration: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/duration/refresh`, 'POST', data),
  getDuration: (callId: string) => makeRequest(`/api/calls/${callId}/duration`),
  syncParticipants: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/participants/sync`, 'POST', data),
  getParticipants: (callId: string) => makeRequest(`/api/calls/${callId}/participants`),
  addParticipant: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/participants/add`, 'POST', data),
  removeParticipant: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/participants/remove`, 'POST', data),
  muteAudio: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/audio/mute`, 'POST', data),
  getAudioState: (callId: string) => makeRequest(`/api/calls/${callId}/audio/state`),
  unmuteAudio: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/audio/unmute`, 'POST', data),
  deafenAudio: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/audio/deafen`, 'POST', data),

  // 21 a 30: Mídia e Dispositivos
  undeafenAudio: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/audio/undeafen`, 'POST', data),
  enableVideo: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/enable`, 'POST', data),
  disableVideo: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/disable`, 'POST', data),
  switchCamera: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/switch-camera`, 'POST', data),
  refreshAudioDevices: (data?: any) => makeRequest('/api/devices/audio/refresh', 'POST', data),
  getAudioDevices: () => makeRequest('/api/devices/audio'),
  refreshVideoDevices: (data?: any) => makeRequest('/api/devices/video/refresh', 'POST', data),
  getVideoDevices: () => makeRequest('/api/devices/video'),
  setAudioInput: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/audio/input-device`, 'POST', data),
  setAudioOutput: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/audio/output-device`, 'POST', data),
  createPublicVoiceRoom: (data?: any) => makeRequest('/api/rooms/voice/public/create', 'POST', data),
  getPublicVoiceRooms: () => makeRequest('/api/rooms/voice/public'),
  createPrivateVoiceRoom: (data?: any) => makeRequest('/api/rooms/voice/private/create', 'POST', data),
  getPrivateVoiceRooms: () => makeRequest('/api/rooms/voice/private'),

  // 31 a 40: Salas e Tela
  createPublicVideoRoom: (data?: any) => makeRequest('/api/rooms/video/public/create', 'POST', data),
  getPublicVideoRooms: () => makeRequest('/api/rooms/video/public'),
  createPrivateVideoRoom: (data?: any) => makeRequest('/api/rooms/video/private/create', 'POST', data),
  getPrivateVideoRooms: () => makeRequest('/api/rooms/video/private'),
  joinRoom: (roomId: string, data?: any) => makeRequest(`/api/rooms/${roomId}/join`, 'POST', data),
  getRoom: (roomId: string) => makeRequest(`/api/rooms/${roomId}`),
  leaveRoom: (roomId: string, data?: any) => makeRequest(`/api/rooms/${roomId}/leave`, 'POST', data),
  syncRoomUsers: (roomId: string, data?: any) => makeRequest(`/api/rooms/${roomId}/users/sync`, 'POST', data),
  getRoomUsers: (roomId: string) => makeRequest(`/api/rooms/${roomId}/users`),
  updateSpeakingState: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/speaking/update`, 'POST', data),
  getSpeakingState: (callId: string) => makeRequest(`/api/calls/${callId}/speaking`),
  startScreenShare: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/start`, 'POST', data),
  getScreenShareStatus: (callId: string) => makeRequest(`/api/calls/${callId}/screen-share/status`),
  stopScreenShare: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/stop`, 'POST', data),
  pauseScreenShare: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/pause`, 'POST', data),
  resumeScreenShare: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/resume`, 'POST', data),

  // 41 a 50: Compartilhamento e Qualidade
  startDesktopShare: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/desktop/start`, 'POST', data),
  startMobileShare: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/mobile/start`, 'POST', data),
  setScreenShare720p: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/quality/720p`, 'POST', data),
  setScreenShare1080p: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/quality/1080p`, 'POST', data),
  setScreenShare1080p60: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/screen-share/quality/1080p60`, 'POST', data),
  setVideoLowQuality: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/quality/low`, 'POST', data),
  getVideoQuality: (callId: string) => makeRequest(`/api/calls/${callId}/video/quality`),
  setVideoMediumQuality: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/quality/medium`, 'POST', data),
  setVideoHighQuality: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/quality/high`, 'POST', data),
  setVideo720p: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/quality/720p`, 'POST', data),
  setVideo1080p: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/quality/1080p`, 'POST', data),

  // 51 a 60: WebRTC
  setVideo1080p60: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/video/quality/1080p60`, 'POST', data),
  enableDataSaver: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/quality/data-saver/enable`, 'POST', data),
  getDataSaverState: (callId: string) => makeRequest(`/api/calls/${callId}/quality/data-saver`),
  disableDataSaver: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/quality/data-saver/disable`, 'POST', data),
  enableAutoQuality: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/quality/auto/enable`, 'POST', data),
  disableAutoQuality: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/quality/auto/disable`, 'POST', data),
  sendWebrtcOffer: (callId: string, data?: any) => makeRequest(`/api/webrtc/${callId}/offer`, 'POST', data),
  getWebrtcOffer: (callId: string) => makeRequest(`/api/webrtc/${callId}/offer`),
  sendWebrtcAnswer: (callId: string, data?: any) => makeRequest(`/api/webrtc/${callId}/answer`, 'POST', data),
  getWebrtcAnswer: (callId: string) => makeRequest(`/api/webrtc/${callId}/answer`),
  sendIceCandidate: (callId: string, data?: any) => makeRequest(`/api/webrtc/${callId}/ice-candidate`, 'POST', data),
  getIceCandidates: (callId: string) => makeRequest(`/api/webrtc/${callId}/ice-candidates`),
  restartIce: (callId: string, data?: any) => makeRequest(`/api/webrtc/${callId}/ice-restart`, 'POST', data),
  getConnectionState: (callId: string) => makeRequest(`/api/webrtc/${callId}/connection-state`),
  refreshWebrtcConfig: (data?: any) => makeRequest('/api/webrtc/config/refresh', 'POST', data),
  getWebrtcConfig: () => makeRequest('/api/webrtc/config'),

  // 61 a 70: Testes e Métricas
  startMicTest: (data?: any) => makeRequest('/api/tests/microphone/start', 'POST', data),
  getMicTestResult: () => makeRequest('/api/tests/microphone/result'),
  startCameraTest: (data?: any) => makeRequest('/api/tests/camera/start', 'POST', data),
  getCameraTestResult: () => makeRequest('/api/tests/camera/result'),
  startSpeakerTest: (data?: any) => makeRequest('/api/tests/speaker/start', 'POST', data),
  getSpeakerTestResult: () => makeRequest('/api/tests/speaker/result'),
  startConnectionTest: (data?: any) => makeRequest('/api/tests/connection/start', 'POST', data),
  getConnectionTestResult: () => makeRequest('/api/tests/connection/result'),
  updatePing: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/ping/update`, 'POST', data),
  getPing: (callId: string) => makeRequest(`/api/calls/${callId}/metrics/ping`),
  updateJitter: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/jitter/update`, 'POST', data),
  getJitter: (callId: string) => makeRequest(`/api/calls/${callId}/metrics/jitter`),
  updatePacketLoss: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/packet-loss/update`, 'POST', data),
  updateAudioBitrate: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/audio-bitrate/update`, 'POST', data),
  updateVideoBitrate: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/video-bitrate/update`, 'POST', data),
  updateVideoFps: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/video-fps/update`, 'POST', data),

  // 71 a 80: Logs e Sincronização
  updateVideoResolution: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/video-resolution/update`, 'POST', data),
  updateQualityMetric: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/metrics/quality/update`, 'POST', data),
  getQualityMetric: (callId: string) => makeRequest(`/api/calls/${callId}/metrics/quality`),
  logWebrtcError: (data?: any) => makeRequest('/api/logs/webrtc/error', 'POST', data),
  getWebrtcErrors: () => makeRequest('/api/logs/webrtc/errors'),
  logWebrtcEvent: (data?: any) => makeRequest('/api/logs/webrtc/event', 'POST', data),
  getWebrtcEvents: () => makeRequest('/api/logs/webrtc/events'),
  logCallEvent: (data?: any) => makeRequest('/api/logs/calls/event', 'POST', data),
  getCallEvents: () => makeRequest('/api/logs/calls/events'),
  logMediaError: (data?: any) => makeRequest('/api/logs/media/error', 'POST', data),
  getMediaErrors: () => makeRequest('/api/logs/media/errors'),
  reconnectCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/reconnect`, 'POST', data),
  getReconnectStatus: (callId: string) => makeRequest(`/api/calls/${callId}/reconnect-status`),
  syncCall: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/sync`, 'POST', data),
  getCallState: (callId: string) => makeRequest(`/api/calls/${callId}/state`),
  checkUserBusy: (userId: string, data?: any) => makeRequest(`/api/users/${userId}/busy/check`, 'POST', data),
  checkUserOffline: (userId: string, data?: any) => makeRequest(`/api/users/${userId}/offline/check`, 'POST', data),
  getUserStatus: (userId: string) => makeRequest(`/api/users/${userId}/status`),

  // 81 a 90: Presença e Convites
  setUserAvailable: (userId: string, data?: any) => makeRequest(`/api/users/${userId}/call-status/available`, 'POST', data),
  getUserCallStatus: (userId: string) => makeRequest(`/api/users/${userId}/call-status`),
  setUserBusy: (userId: string, data?: any) => makeRequest(`/api/users/${userId}/call-status/busy`, 'POST', data),
  setUserAway: (userId: string, data?: any) => makeRequest(`/api/users/${userId}/call-status/away`, 'POST', data),
  sendInvites: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/invites/send`, 'POST', data),
  getInvites: (callId: string) => makeRequest(`/api/calls/${callId}/invites`),
  acceptInvite: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/invites/accept`, 'POST', data),
  rejectInvite: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/invites/reject`, 'POST', data),
  createCallLink: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/link/create`, 'POST', data),
  getCallLink: (callId: string) => makeRequest(`/api/calls/${callId}/link`),
  revokeCallLink: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/link/revoke`, 'POST', data),
  pinParticipant: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/layout/pin-participant`, 'POST', data),
  getLayout: (callId: string) => makeRequest(`/api/calls/${callId}/layout`),
  setGridLayout: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/layout/grid`, 'POST', data),

  // 91 a 100: Gravação e Admin
  setFocusLayout: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/layout/focus`, 'POST', data),
  setScreenShareLayout: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/layout/screen-share`, 'POST', data),
  startRecording: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/recording/start`, 'POST', data),
  getRecordingStatus: (callId: string) => makeRequest(`/api/calls/${callId}/recording/status`),
  stopRecording: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/recording/stop`, 'POST', data),
  searchRecordings: (data?: any) => makeRequest('/api/recordings/search', 'POST', data),
  getRecordings: () => makeRequest('/api/recordings'),
  requestRecording: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/recording/request`, 'POST', data),
  generateTechnicalSummary: (callId: string, data?: any) => makeRequest(`/api/calls/${callId}/technical-summary/generate`, 'POST', data),
  getTechnicalSummary: (callId: string) => makeRequest(`/api/calls/${callId}/technical-summary`),
  refreshAdminStats: (data?: any) => makeRequest('/api/admin/stats/refresh', 'POST', data),
  getAdminStats: () => makeRequest('/api/admin/stats'),
  dropAdminCall: (callId: string, data?: any) => makeRequest(`/api/admin/calls/${callId}/drop`, 'POST', data),
  searchAdminErrors: (data?: any) => makeRequest('/api/admin/calls/errors/search', 'POST', data),
  getAdminErrors: () => makeRequest('/api/admin/calls/errors')
};
