import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";

export default function GuestPage() {
  const [isFirst, setIsFirst] = useState(true);
  const [selectedGender, setSelectedGender] = useState("Female");
  // Defaulting myGender to 'Other' since the field is removed from UI as per design
  const [myGender, setMyGender] = useState("Other");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const userDataRef = useRef(null);

  const tagsList = ["Love", "Games", "Music", "Movies"];
  const navigate = useNavigate();

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const guestId = Math.floor(Math.random() * 100000).toString();
    const userData = {
      id: guestId,
      name: `Guest ${guestId}`,
      isGuest: true,
      preferredGender: selectedGender,
      tags: selectedTags.length ? selectedTags : ["General"],
      gender: myGender,
    };

    console.log("Joining pool with:", userData);
    userDataRef.current = userData;

    socket.emit("joinPool", userData);
    setIsFirst(false);
    setIsLoading(true);
  };

  // When matched → redirect to ChatRoom
  useEffect(() => {
    socket.on("matched", ({ roomId, users }) => {
      console.log("Matched successfully:", { roomId, users });
      setIsLoading(false);
      navigate(`/room/${roomId}`, { state: { users, roomId, userData: userDataRef.current } });
    });

    return () => {
      socket.off("matched");
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative"
      style={{ backgroundImage: `url('/images/Background.png')`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>

      {/* Header */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 relative">
        {/* Branding */}
        <div className="flex items-center gap-2">
          <img src="/images/logo.svg" alt="Logo" className="w-10 h-10" />
          <span className="text-3xl font-extrabold text-[#0C3C66] tracking-tight">ChatsUP</span>
        </div>

        {/* Nav */}
        <div className="bg-white px-6 py-2 rounded-full shadow-sm flex items-center gap-6 border border-gray-200">
          <button onClick={() => navigate('/')} className="text-sm font-bold text-[#0C3C66]">Home</button>
          <button className="text-sm text-gray-500 hover:text-[#0C3C66] transition">Terms and Conditions</button>
          <button className="text-sm text-gray-500 hover:text-[#0C3C66] transition">Privacy policy</button>
          <div className="w-8 h-8 rounded-full bg-orange-100 p-1 flex items-center justify-center border border-gray-200">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="User"
              className="w-full h-full rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area - Glass Card */}
      <div className="flex-1 px-10 py-6 flex justify-center items-center">
        <div className="bg-white/80 backdrop-blur-md w-full max-w-6xl rounded-[40px] shadow-xl p-10 min-h-[600px] flex items-center justify-center border border-white/50 relative">

          {isFirst ? (
            <div className="bg-[#0C3C66] text-white p-10 rounded-2xl shadow-2xl w-full max-w-lg text-center relative overflow-hidden">

              <h2 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-80">Who are you looking for?</h2>

              {/* Gender Select */}
              <div className="flex justify-center gap-2 mb-6">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setSelectedGender(g)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedGender === g
                      ? "bg-white text-[#0C3C66] shadow-md"
                      : "bg-[#1A5276] text-white/70 hover:bg-[#22638a] hover:text-white"
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="bg-white text-[#0C3C66] rounded-xl text-[10px] px-4 py-3 mb-8 leading-tight font-medium shadow-sm mx-4">
                This doesn’t ensure that you will get the selected gender always. <br />
                This will give priority to the selected gender.
              </div>

              <h2 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-80">Tags</h2>

              {/* Tags */}
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {tagsList.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-5 py-2 rounded-full text-xs font-medium transition-all ${selectedTags.includes(tag)
                      ? "bg-white text-[#0C3C66] shadow-sm"
                      : "bg-[#1A5276] text-white/70 hover:bg-[#22638a] hover:text-white"
                      }`}
                  >
                    {tag}
                  </button>
                ))}
                <button
                  type="button"
                  className="bg-[#1A5276] px-5 py-2 rounded-full text-xs text-white/60 hover:bg-[#22638a] hover:text-white transition-all"
                >
                  + Add one
                </button>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handleFormSubmit}
                disabled={!selectedGender}
                className="bg-[#FF5C5C] hover:bg-[#ff4646] text-white font-bold px-10 py-3 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Take me there
              </button>

            </div>
          ) : (
            <div className="flex flex-col justify-center items-center">
              <div className="text-3xl text-[#0C3C66] font-bold animate-pulse mb-6">
                {isLoading ? "Finding your match..." : "Matched!"}
              </div>
              {isLoading && (
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-[#0C3C66]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#FF5C5C] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
