package com.nexuschat.app.data.webrtc

import android.content.Context
import com.google.firebase.database.ChildEventListener
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.nexuschat.app.data.firebase.FirebaseManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import org.webrtc.*

class WebRTCClient(
    private val context: Context,
    private val callId: String,
    private val userId: String,
    private val isVideo: Boolean
) {
    private val coroutineScope = CoroutineScope(Dispatchers.Main)
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private val peerConnections = mutableMapOf<String, PeerConnection>()
    
    private var localAudioTrack: AudioTrack? = null
    private var localVideoTrack: VideoTrack? = null
    private var videoCapturer: CameraVideoCapturer? = null
    private var localSurfaceView: SurfaceViewRenderer? = null
    private var remoteSurfaceView: SurfaceViewRenderer? = null

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _isAudioMuted = MutableStateFlow(false)
    val isAudioMuted: StateFlow<Boolean> = _isAudioMuted.asStateFlow()

    private val _isVideoMuted = MutableStateFlow(!isVideo)
    val isVideoMuted: StateFlow<Boolean> = _isVideoMuted.asStateFlow()

    private val eglBase = EglBase.create()

    private val iceServers = listOf(
        PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun2.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:global.stun.twilio.com:3478").createIceServer()
    )

    fun initialize(localView: SurfaceViewRenderer?, remoteView: SurfaceViewRenderer?) {
        this.localSurfaceView = localView
        this.remoteSurfaceView = remoteView

        // Initialize PeerConnectionFactory options
        val initOptions = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(false)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initOptions)

        val factoryOptions = PeerConnectionFactory.Options()
        val defaultVideoEncoderFactory = DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true)
        val defaultVideoDecoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setOptions(factoryOptions)
            .setVideoEncoderFactory(defaultVideoEncoderFactory)
            .setVideoDecoderFactory(defaultVideoDecoderFactory)
            .createPeerConnectionFactory()

        setupLocalMedia()
        registerInCall()
        listenForSignals()
    }

    private fun setupLocalMedia() {
        val factory = peerConnectionFactory ?: return

        // Audio
        val audioConstraints = MediaConstraints()
        val audioSource = factory.createAudioSource(audioConstraints)
        localAudioTrack = factory.createAudioTrack("ARDAMSa0", audioSource)
        localAudioTrack?.setEnabled(true)

        // Video
        if (isVideo && localSurfaceView != null) {
            localSurfaceView?.init(eglBase.eglBaseContext, null)
            localSurfaceView?.setMirror(true)
            localSurfaceView?.setZOrderMediaOverlay(true)

            remoteSurfaceView?.init(eglBase.eglBaseContext, null)

            videoCapturer = createCameraCapturer()
            videoCapturer?.let { capturer ->
                val surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglBase.eglBaseContext)
                val videoSource = factory.createVideoSource(capturer.isScreencast)
                capturer.initialize(surfaceTextureHelper, context, videoSource.capturerObserver)
                capturer.startCapture(1280, 720, 30)

                localVideoTrack = factory.createVideoTrack("ARDAMSv0", videoSource)
                localVideoTrack?.setEnabled(true)
                localSurfaceView?.let { localVideoTrack?.addSink(it) }
            }
        }
    }

    private fun createCameraCapturer(): CameraVideoCapturer? {
        val enumerator = Camera2Enumerator(context)
        val deviceNames = enumerator.deviceNames
        for (deviceName in deviceNames) {
            if (enumerator.isFrontFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null)
            }
        }
        for (deviceName in deviceNames) {
            if (!enumerator.isFrontFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null)
            }
        }
        return null
    }

    private fun registerInCall() {
        val participantsRef = FirebaseManager.database.getReference("webrtc/$callId/participants/$userId")
        participantsRef.setValue(System.currentTimeMillis())
        participantsRef.onDisconnect().removeValue()
        _isConnected.value = true
    }

    private fun getOrCreatePeerConnection(targetId: String): PeerConnection? {
        peerConnections[targetId]?.let { return it }

        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
        }

        val pc = peerConnectionFactory?.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onIceCandidate(candidate: IceCandidate?) {
                if (candidate != null) {
                    val signalRef = FirebaseManager.database.getReference("webrtc/$callId/signals/$targetId").push()
                    val payload = JSONObject().apply {
                        put("candidate", candidate.sdp)
                        put("sdpMid", candidate.sdpMid)
                        put("sdpMLineIndex", candidate.sdpMLineIndex)
                    }
                    val data = mapOf(
                        "sender" to userId,
                        "type" to "ice-candidate",
                        "payload" to payload.toString()
                    )
                    signalRef.setValue(data)
                }
            }

            override fun onTrack(transceiver: RtpTransceiver?) {
                val track = transceiver?.receiver?.track()
                if (track is VideoTrack && remoteSurfaceView != null) {
                    coroutineScope.launch {
                        track.addSink(remoteSurfaceView)
                    }
                }
            }

            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
            override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {}
            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
            override fun onAddStream(stream: MediaStream?) {}
            override fun onRemoveStream(stream: MediaStream?) {}
            override fun onDataChannel(channel: DataChannel?) {}
            override fun onRenegotiationNeeded() {}
        })

        if (pc != null) {
            localAudioTrack?.let { pc.addTrack(it) }
            localVideoTrack?.let { pc.addTrack(it) }
            peerConnections[targetId] = pc
        }

        return pc
    }

    private fun listenForSignals() {
        val signalsRef = FirebaseManager.database.getReference("webrtc/$callId/signals/$userId")
        signalsRef.addChildEventListener(object : ChildEventListener {
            override fun onChildAdded(snapshot: DataSnapshot, previousChildName: String?) {
                val sender = snapshot.child("sender").getValue(String::class.java) ?: return
                val type = snapshot.child("type").getValue(String::class.java) ?: return
                val payloadStr = snapshot.child("payload").getValue(String::class.java) ?: return

                handleSignal(sender, type, payloadStr)
                snapshot.ref.removeValue()
            }

            override fun onChildChanged(snapshot: DataSnapshot, previousChildName: String?) {}
            override fun onChildRemoved(snapshot: DataSnapshot) {}
            override fun onChildMoved(snapshot: DataSnapshot, previousChildName: String?) {}
            override fun onCancelled(error: DatabaseError) {}
        })
    }

    private fun handleSignal(targetId: String, type: String, payload: String) {
        val pc = getOrCreatePeerConnection(targetId) ?: return
        when (type) {
            "offer" -> {
                val json = JSONObject(payload)
                val sdp = json.optString("sdp", "")
                val description = SessionDescription(SessionDescription.Type.OFFER, sdp)
                pc.setRemoteDescription(SimpleSdpObserver(), description)
                pc.createAnswer(object : SimpleSdpObserver() {
                    override fun onCreateSuccess(desc: SessionDescription?) {
                        desc?.let { answerDesc ->
                            pc.setLocalDescription(SimpleSdpObserver(), answerDesc)
                            val signalRef = FirebaseManager.database.getReference("webrtc/$callId/signals/$targetId").push()
                            val answerPayload = JSONObject().apply {
                                put("type", "answer")
                                put("sdp", answerDesc.description)
                            }
                            signalRef.setValue(mapOf(
                                "sender" to userId,
                                "type" to "answer",
                                "payload" to answerPayload.toString()
                            ))
                        }
                    }
                }, MediaConstraints())
            }
            "answer" -> {
                val json = JSONObject(payload)
                val sdp = json.optString("sdp", "")
                val description = SessionDescription(SessionDescription.Type.ANSWER, sdp)
                pc.setRemoteDescription(SimpleSdpObserver(), description)
            }
            "ice-candidate" -> {
                val json = JSONObject(payload)
                val candidate = IceCandidate(
                    json.optString("sdpMid", ""),
                    json.optInt("sdpMLineIndex", 0),
                    json.optString("candidate", "")
                )
                pc.addIceCandidate(candidate)
            }
        }
    }

    fun startCall(targetId: String) {
        val pc = getOrCreatePeerConnection(targetId) ?: return
        pc.createOffer(object : SimpleSdpObserver() {
            override fun onCreateSuccess(desc: SessionDescription?) {
                desc?.let { offerDesc ->
                    pc.setLocalDescription(SimpleSdpObserver(), offerDesc)
                    val signalRef = FirebaseManager.database.getReference("webrtc/$callId/signals/$targetId").push()
                    val payload = JSONObject().apply {
                        put("type", "offer")
                        put("sdp", offerDesc.description)
                    }
                    signalRef.setValue(mapOf(
                        "sender" to userId,
                        "type" to "offer",
                        "payload" to payload.toString()
                    ))
                }
            }
        }, MediaConstraints())
    }

    fun toggleAudio() {
        val enabled = localAudioTrack?.enabled() ?: true
        localAudioTrack?.setEnabled(!enabled)
        _isAudioMuted.value = enabled
    }

    fun toggleVideo() {
        val enabled = localVideoTrack?.enabled() ?: true
        localVideoTrack?.setEnabled(!enabled)
        _isVideoMuted.value = enabled
    }

    fun switchCamera() {
        videoCapturer?.switchCamera(null)
    }

    fun endCall() {
        try {
            val participantRef = FirebaseManager.database.getReference("webrtc/$callId/participants/$userId")
            participantRef.removeValue()
            
            videoCapturer?.stopCapture()
            videoCapturer?.dispose()
            
            localAudioTrack?.dispose()
            localVideoTrack?.dispose()

            peerConnections.values.forEach { it.close() }
            peerConnections.clear()
            peerConnectionFactory?.dispose()

            localSurfaceView?.release()
            remoteSurfaceView?.release()
            eglBase.release()
            _isConnected.value = false
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    open class SimpleSdpObserver : SdpObserver {
        override fun onCreateSuccess(p0: SessionDescription?) {}
        override fun onSetSuccess() {}
        override fun onCreateFailure(p0: String?) {}
        override fun onSetFailure(p0: String?) {}
    }
}
