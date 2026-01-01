import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../services/socket";
import {
  ArrowLeft,
  Video,
  UserPlus,
  Menu,
  Plus,
  Send,
  HelpCircle
} from "lucide-react";

import Peer from "simple-peer";
import VideoCallModal from "../components/VideoCallModal";
import ConnectedVideoView from "../components/ConnectedVideoView";

export default function ChatRoom() {
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [roomId, setRoomId] = useState(location.state?.roomId || "");
  const [partner, setPartner] = useState(() => {
    const users = location.state?.users || [];
    const userData = location.state?.userData || {};
    return users.find(u => u.id !== userData.id) || null;
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // New state for searching UI
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isVideoUnlocked, setIsVideoUnlocked] = useState(false);
  const [isVideoUnlockModalOpen, setIsVideoUnlockModalOpen] = useState(false);

  // Video Call State
  const [callState, setCallState] = useState('idle'); // idle, preparing, calling, incoming, connected
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [caller, setCaller] = useState("");
  const connectionRef = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // User Data for re-queueing
  const userData = location.state?.userData || {};

  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const localStreamRef = useRef(null);

  // Sync ref with state for cleanup
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // 🔌 Setup socket
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    console.log("✅ Using persistent socket:", socket.id);

    const handleReceiveMessage = (msg) => {
      const from = msg.senderId === socket.id ? "me" : "partner";
      setMessages((p) => [...p, { from, text: msg.text }]);
      setPartnerTyping(false);
    };

    const handlePartnerLeft = () => {
      // Replaced alert with system message
      setMessages((p) => [...p, { from: "system", text: "Partner has left the chat." }]);
      setPartner(null); // Partner is gone
    };

    const handleThinking = (isThinking) => {
      setPartnerTyping(isThinking);
    }

    // Handle new match if we skipped
    const handleMatched = ({ roomId: newRoomId, users }) => {
      console.log("Matched again:", newRoomId);
      setRoomId(newRoomId);
      setIsSearching(false);
      setMessages([]); // Clear previous chat

      // Find partner details
      const otherUser = users.find(u => u.id !== userData.id);
      navigate(`/room/${newRoomId}`, { state: { users, roomId: newRoomId, userData }, replace: true });
    };

    const handleCallUser = (data) => {
      console.log("📞 Incoming call from:", data.from);
      setCallState('incoming');
      setCallerSignal(data.signal);
      setCaller(data.from);
    };

    const handleCallAccepted = (signal) => {
      console.log("✅ Call accepted!");
      setCallState('connected');
      connectionRef.current.signal(signal);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("partnerLeft", handlePartnerLeft);
    socket.on("typing", handleThinking);
    socket.on("matched", handleMatched);
    socket.on("callUser", handleCallUser);
    socket.on("callAccepted", handleCallAccepted);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("partnerLeft", handlePartnerLeft);
      socket.off("typing", handleThinking);
      socket.off("matched", handleMatched);
      socket.off("callUser", handleCallUser);
      socket.off("callAccepted", handleCallAccepted);

      // Cleanup stream on unmount using Ref to avoid dependency cycle
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
    };
  }, [roomId, navigate, partner, userData]); // Removed localStream

  // 📹 Video Unlock Timer
  useEffect(() => {
    setIsVideoUnlocked(false);
    const timer = setTimeout(() => {
      setIsVideoUnlocked(true);
      setIsVideoUnlockModalOpen(true);
    }, 1000); // 1 second for testing

    return () => clearTimeout(timer);
  }, [roomId]);

  // ... (Typing and Scroll logic remains similar, ensure they don't break) ...
  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);


  // ⌨️ Typing Handler
  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { roomId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { roomId, isTyping: false });
    }, 1000);
  };

  // ✉️ Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !roomId || isSearching) return; // Disable send if searching
    const message = { text: input };

    socket.emit("sendMessage", { roomId, message });
    setMessages((p) => [...p, { from: "me", text: input }]);
    setInput("");

    setIsTyping(false);
    socket.emit("typing", { roomId, isTyping: false });
  };

  const handleSkip = () => {
    if (isSearching) return; // Prevent double click
    setIsSkipModalOpen(true);
  };

  const confirmSkip = () => {
    setIsSkipModalOpen(false);

    // 1. Leave current room
    if (roomId) {
      socket.emit("leaveRoom", { roomId });
    }

    // 2. Clear State
    setMessages([]);
    setPartner(null);
    setRoomId("");
    setIsSearching(true);

    // 3. Re-join pool
    if (userData && userData.id) {
      console.log("Skipping... re-joining pool with", userData);
      socket.emit("joinPool", userData);
    } else {
      console.error("No userData found for re-joining");
      navigate('/guest');
    }
  };

  const cancelSkip = () => {
    setIsSkipModalOpen(false);
  };

  // --- Video Call Logic ---

  const createDummyStream = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 640, 480);

      // Bouncing ball
      const t = Date.now() / 1000;
      const x = 320 + Math.cos(t) * 100;
      const y = 240 + Math.sin(t) * 100;

      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = "#f8fafc";
      ctx.font = "30px sans-serif";
      ctx.fillText("Simulated Camera", 50, 50);
      ctx.fillText(new Date().toLocaleTimeString(), 50, 100);

      requestAnimationFrame(draw);
    };
    draw();

    const stream = canvas.captureStream(30);

    // Fake audio
    const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    const dest = ctxAudio.createMediaStreamDestination();
    const osc = ctxAudio.createOscillator();
    osc.frequency.setValueAtTime(440, ctxAudio.currentTime);
    // osc.connect(dest); // Silent by default, uncomment to hear beep
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      stream.addTrack(audioTrack);
    }

    return stream;
  };

  const prepareVideoCall = async () => {
    try {
      console.log("Enumerating devices...");
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("Devices:", devices.map(d => `${d.kind}: ${d.label}`));
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCallState('preparing');
    } catch (err) {
      console.error("Failed to get local stream", err);

      // Check for missing device errors
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError" || (err.message && err.message.includes("The object can not be found"))) {
        console.warn("Camera/Mic not found. Switching to dummy stream for testing.");
        alert("No camera/microphone found! Switching to SIMULATED video for testing.");
        const dummy = createDummyStream();
        setLocalStream(dummy);
        setCallState('preparing');
      } else {
        alert(`Could not access camera/microphone: ${err.name} - ${err.message}\nMake sure you are on HTTPS or localhost.`);
      }
    }
  };

  const startVideoCall = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: partner?.id, // Assuming partner ID is sufficient or server handles mapping
        signalData: data,
        fromId: userData.id,
        roomId // Send roomId so server broadcast to room
      });
    });

    peer.on("stream", (stream) => {
      setRemoteStream(stream);
    });

    peer.on("close", () => {
      endCall();
    });

    connectionRef.current = peer;
    setCallState('calling');
  };

  const acceptCall = async () => {
    setCallState('connected');
    try {
      // Ensure we have local stream before answering
      let stream = localStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (data) => {
        socket.emit("answerCall", { signal: data, to: caller, roomId });
      });

      peer.on("stream", (stream) => {
        setRemoteStream(stream);
      });

      peer.on("close", () => {
        endCall();
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;

    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };

  const endCall = () => {
    setCallState('idle');
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  };

  const toggleAudio = () => {
    console.log("Toggle Audio clicked. Stream:", localStream?.id);
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log("Audio track enabled:", audioTrack.enabled);
      } else {
        console.warn("No audio track found");
      }
    }
  }

  const toggleVideo = () => {
    console.log("Toggle Video clicked. Stream:", localStream?.id);
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log("Video track enabled:", videoTrack.enabled);
      } else {
        console.warn("No video track found");
      }
    }
  }


  if (callState === 'connected') {
    return (
      <ConnectedVideoView
        localStream={localStream}
        remoteStream={remoteStream}
        onDisconnect={endCall}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#F0F4F8] font-sans">
      {/* Header */}
      <div className="bg-[#0C3C66] text-white px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/guest')} className="hover:bg-white/10 p-2 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0C3C66]">
              <HelpCircle size={28} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#0C3C66] rounded-full"></div>
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">{partner?.name || "Stranger"}</h2>
            <div className="text-xs text-green-300 opacity-90">Online</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-white/90">
          <button
            onClick={prepareVideoCall}
            disabled={!isVideoUnlocked || callState !== 'idle'}
            className={`transition ${!isVideoUnlocked ? "opacity-50 cursor-not-allowed" : "hover:text-white"}`}
            title={!isVideoUnlocked ? "Video call unlocks in 30s" : "Start Video Call"}
          >
            <Video size={24} />
          </button>
          {!(userData.isGuest || partner?.isGuest) && (
            <button className="hover:text-white transition"><UserPlus size={24} /></button>
          )}
          <button className="hover:text-white transition"><Menu size={24} /></button>
        </div>
      </div>

      {/* Ads Banner (Mock) */}
      <div className="bg-gray-200 py-1 flex justify-center items-center shadow-inner">
        <div className="bg-white px-3 py-1 rounded border border-gray-300 text-xs text-gray-500 uppercase flex items-center gap-2">
          <span className="font-bold text-green-600">InStream</span> Video Ads <span className="text-[10px] bg-gray-300 px-1 rounded ml-2 cursor-pointer">Close</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" style={{ backgroundImage: `url('/images/Background.png')` }}>
        {/* Note: The background pattern is a placeholder. In a real app we'd use a local svg or similar */}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex w-full ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm relative ${msg.from === "me"
                ? "bg-[#0C3C66] text-white rounded-br-none"
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {partnerTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl rounded-bl-none text-xs border border-gray-200 shadow-sm">
              Writing...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Bar */}
      <div className="p-4 bg-transparent absolute bottom-0 w-full pointer-events-none">
        <div className="flex items-end gap-2 pointer-events-auto">

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={isSearching}
            className={`font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${isSearching
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#179db3] hover:bg-[#148da3] text-white"
              }`}
          >
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <>
                <span className="text-xs uppercase border border-white/40 px-1 rounded">ESC</span> Skip
              </>
            )}
          </button>

          {/* Input Area */}
          <form
            onSubmit={handleSend}
            className="flex-1 bg-[#0C3C66] p-2 rounded-lg shadow-xl flex items-center gap-2"
          >
            <input
              value={input}
              onChange={handleInput}
              placeholder="Enter your text here"
              className="flex-1 bg-transparent text-white placeholder-white/50 px-3 outline-none"
            />

            <button type="button" className="text-white/80 hover:text-white p-2">
              <Plus size={24} />
            </button>

            <button
              type="submit"
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition transform hover:rotate-12"
            >
              <Send size={20} />
            </button>
          </form>

        </div>
      </div>

      {/* Spacer for bottom bar interaction since it overlays */}
      <div className="h-24"></div>

      {/* Skip Confirmation Modal */}
      {isSkipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-[#0C3C66] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center transform transition-all scale-100">
            <h3 className="text-white text-xl font-bold mb-1">Are you sure?</h3>
            <p className="text-white/80 text-sm mb-6">You really wanna skip?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={cancelSkip}
                className="flex-1 bg-[#179db3] hover:bg-[#148da3] text-white py-2.5 rounded-full font-medium transition-colors"
                style={{ borderRadius: '9999px' }} // Ensure pill shape
              >
                Cancel
              </button>
              <button
                onClick={confirmSkip}
                className="flex-1 bg-[#FF5C5C] hover:bg-[#ff4646] text-white py-2.5 rounded-full font-medium transition-colors"
                style={{ borderRadius: '9999px' }} // Ensure pill shape
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Unlock Modal */}
      {isVideoUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-[#0C3C66] rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center transform transition-all scale-100">
            <h3 className="text-white text-xl font-bold mb-4">Video call unlocked! 🎥</h3>
            <button
              onClick={() => setIsVideoUnlockModalOpen(false)}
              className="w-full bg-[#179db3] hover:bg-[#148da3] text-white py-2.5 rounded-full font-medium transition-colors"
              style={{ borderRadius: '9999px' }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Video Connecting Modal (Outgoing) */}
      <VideoCallModal
        isOpen={callState === 'preparing'}
        onCancel={() => {
          if (localStream) localStream.getTracks().forEach(t => t.stop());
          setCallState('idle');
        }}
        onConnect={startVideoCall}
        localStream={localStream}
      />

      {/* Incoming Call Modal */}
      {callState === 'incoming' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0C3C66] rounded-[30px] p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                <Video size={40} className="text-white" />
              </div>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Incoming Video Call</h3>
            <p className="text-white/60 mb-8">{partner?.name || "Stranger"} wants to connect!</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={acceptCall}
                className="w-full bg-[#FF5C5C] hover:bg-[#ff4646] text-white font-bold py-3.5 rounded-full shadow-lg transition-transform active:scale-95"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  setCallState('idle'); // Should ideally emit reject
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-full transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
