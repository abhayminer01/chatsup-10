import React from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function ConnectedVideoView({
    localStream,
    remoteStream,
    onDisconnect,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled
}) {
    // No need for useRefs if we use callback refs for direct attachment

    return (
        <div className="w-full flex-1 flex gap-4 p-4 h-full relative overflow-hidden bg-gray-900">

            {/* Remote Video (Main) */}
            <div className="flex-1 bg-black rounded-[30px] overflow-hidden relative shadow-2xl border border-white/10 group w-full h-full">
                {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50">
                        <p className="animate-pulse">Waiting for video...</p>
                    </div>
                )}
                <video
                    ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }}
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Local Video (Floating / Split) */}
            <div className="w-1/3 max-w-[400px] hidden md:block bg-black rounded-[30px] overflow-hidden relative shadow-xl border border-white/10">
                <video
                    ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
                />
                {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white/50">
                        <VideoOff size={48} />
                    </div>
                )}
                {!isAudioEnabled && (
                    <div className="absolute bottom-4 right-4 bg-red-500/80 p-2 rounded-full">
                        <MicOff size={16} className="text-white" />
                    </div>
                )}
            </div>

            {/* Mobile Local Video Overlay */}
            <div className="md:hidden absolute top-4 right-4 w-28 h-36 bg-black rounded-xl overflow-hidden shadow-lg border-2 border-white/20 z-10">
                <video
                    ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
                />
                {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <VideoOff size={24} className="text-white/50" />
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#0C3C66]/90 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl flex items-center gap-4 z-20">

                <button
                    onClick={toggleAudio}
                    className={`p-4 rounded-full transition-all ${isAudioEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
                >
                    {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all ${isVideoEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
                >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>

                <button
                    onClick={onDisconnect}
                    className="bg-[#179db3] hover:bg-[#148da3] text-white px-8 py-4 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                    Disconnect
                </button>
            </div>

        </div>
    );
}
