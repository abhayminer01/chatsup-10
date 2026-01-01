import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guestLogin } from '../services/auth-api';

export default function LaunchPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGuest = async () => {
    try {
      setLoading(true);
      const res = await guestLogin();
      if (res?.success) {
        navigate('/guest');
      } else {
        alert(res.err);
      }
      setLoading(false);
    } catch (error) {
      alert(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center relative overflow-hidden font-sans text-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: `url('/images/Background.png')` }}>
      </div>

      {/* Header Nav */}
      <div className="z-10 mt-8">
        <div className="bg-white/80 backdrop-blur-sm px-8 py-3 rounded-full border border-gray-300 shadow-sm flex gap-8 text-sm font-medium text-gray-600">
          <button className="hover:text-[#0C3C66] transition font-bold text-[#0C3C66]">Home</button>
          <button className="hover:text-[#0C3C66] transition">Terms and Conditions</button>
          <button className="hover:text-[#0C3C66] transition">Privacy policy</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 text-center mt-[-40px]">
        {/* Logo */}
        <div className="mb-2">
          <img src="/images/logo.svg" alt="ChatsUp Logo" className="w-28 h-28 mx-auto" />
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold text-[#0C3C66] mb-2 tracking-tight">ChatsUP</h1>

        {/* Subtitle */}
        <p className="text-[#179db3] text-lg font-medium mb-6">They all start with a “SUP!”</p>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-10 leading-relaxed max-w-xs mx-auto">
          Lorem ipsum dolor sit amet consectetur. Augue eu ullamcorper cum urna ut aliquet sem at quis.
        </p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-4 items-center">

          {/* Google Sign In */}
          <button className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium py-2.5 rounded-full shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="flex items-center w-full gap-4 opacity-50 my-1">
            <div className="h-[1px] bg-gray-400 flex-1"></div>
            <span className="text-xs text-gray-500 font-medium">or</span>
            <div className="h-[1px] bg-gray-400 flex-1"></div>
          </div>

          {/* Guest Login */}
          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full bg-[#179db3] hover:bg-[#148da3] text-white font-medium py-3 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Logging In..." : "Chat as a guest"}
          </button>
        </div>
      </div>
    </div>
  );
}
