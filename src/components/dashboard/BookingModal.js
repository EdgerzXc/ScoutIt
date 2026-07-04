import { useState } from "react";

export default function BookingModal({ isOpen, onClose, brokerName, dealId, onSchedule }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Mock available times for the demo
  const availableTimes = ["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    
    // Combine date and time for backend
    const scheduledAt = new Date(`${selectedDate} ${selectedTime}`).toISOString();
    
    try {
      const res = await fetch("/api/viewing-appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          scheduledAt,
          mockOwnerId: "master-dev" // or read from context if available
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to schedule appointment");
      }
      
      onSchedule(scheduledAt);
    } catch (e) {
      console.error(e);
      alert("Failed to schedule appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center p-6">
      <div className="bg-[#121212] border border-surface-variant rounded-lg p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-on-surface">
          ✕
        </button>

        <div className="mb-6">
          <span className="text-xs text-gold-accent font-mono uppercase tracking-widest bg-gold-accent/10 px-2 py-1 rounded">Live Viewing</span>
          <h2 className="font-working-title text-xl text-on-surface mt-3">Schedule with {brokerName}</h2>
          <p className="text-sm text-text-secondary mt-1">
            Pick a date and time. This will send a request to the broker's calendar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-on-surface mb-2 font-working-title">1. Select Date</label>
            <input 
              type="date" 
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-background border border-surface-variant rounded px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm text-on-surface mb-2 font-working-title">2. Select Time</label>
              <div className="grid grid-cols-2 gap-2">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 text-sm rounded border transition-colors ${
                      selectedTime === time 
                        ? "bg-gold-accent text-background border-gold-accent font-medium" 
                        : "bg-background border-surface-variant text-text-secondary hover:border-gold-accent/50"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-surface-variant">
            <button 
              type="submit"
              disabled={!selectedDate || !selectedTime || isSubmitting}
              className="w-full bg-gold-accent text-background py-3 rounded font-working-title disabled:opacity-50 hover:bg-[#F7C64E] transition-colors"
            >
              {isSubmitting ? "Requesting..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
