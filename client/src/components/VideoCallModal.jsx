import React from "react";
import { Mic, Video as VideoIcon } from "lucide-react";

export default function VideoCallModal({ isOpen, onCancel, onConnect, localStream }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-[30px] p-6 w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">

                {/* Left Side: Video Preview */}
                <div className="relative w-full md:w-1/2 aspect-video bg-black/50 rounded-2xl overflow-hidden shadow-inner border border-white/10 group">
                    {localStream ? (
                        <video
                            ref={(el) => {
                                if (el && localStream) {
                                    el.srcObject = localStream;
                                }
                            }}
                            playsInline
                            muted
                            autoPlay
                            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white/50">
                            Loading camera...
                        </div>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <Mic size={20} className="text-white" />
                        </div>
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <VideoIcon size={20} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Right Side: Action Area */}
                <div className="flex flex-col items-center justify-center w-full md:w-1/2 text-center text-white space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Ready to connect?</h2>
                        <p className="text-white/60">Make sure you look good! 📸</p>
                    </div>

                    <div className="flex flex-col w-full max-w-xs gap-3">
                        <button
                            onClick={onConnect}
                            className="bg-[#FF5C5C] hover:bg-[#ff4646] text-white font-bold py-3.5 rounded-full shadow-lg transition-transform active:scale-95 text-lg"
                        >
                            Connect now
                        </button>
                        <button
                            onClick={onCancel}
                            className="bg-[#179db3] hover:bg-[#148da3] text-white font-bold py-3.5 rounded-full shadow-lg transition-transform active:scale-95 text-lg"
                        >
                            Cancel
                        </button>
                    </div>

                    <p className="text-xs text-white/40 mt-4">
                        By connecting, you agree to our terms of video conduct.
                    </p>
                </div>
            </div>
        </div>
    );
}
