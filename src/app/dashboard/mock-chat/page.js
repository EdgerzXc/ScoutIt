"use client";
import ChatBox from "../../../components/dashboard/ChatBox";

export default function MockChatPage() {
  const mockDeal = {
    id: "fake-deal-123",
    other_party: "Jane Doe (Broker)",
    property_title: "Luxurious Penthouse in BGC",
    status: "accepted",
    myRole: "owner",
    handshakeState: "none",
    pitch_message: "Hi, I represent several high-net-worth clients looking for penthouses in BGC. I can offer a 2.5% commission rate and a full digital marketing package. Let's connect!",
    other_party_contact: {
      name: "Jane Doe (Broker)",
      email: "jane.doe@luxuryestates.ph",
      phone: "+63 917 123 4567"
    }
  };

  // Mock fetch to simulate chat loading and sending
  if (typeof window !== "undefined" && !window.fetchMocked) {
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      if (url.includes("/api/deals/fake-deal-123/messages")) {
        if (options?.method === "POST") {
          const body = JSON.parse(options.body);
          return {
            ok: true,
            json: async () => ({
              message: {
                id: Math.random().toString(),
                sender_id: "master-dev",
                body: body.body,
                created_at: new Date().toISOString()
              }
            })
          };
        }
        return {
          ok: true,
          json: async () => ({
            messages: [
              { id: "1", sender_id: "other", sender_role: "broker", body: "Hi there! Is this property still available?", created_at: new Date(Date.now() - 3600000).toISOString() },
              { id: "2", sender_id: "master-dev", sender_role: "owner", body: "Yes, it is! Let me know if you'd like to schedule a viewing.", created_at: new Date(Date.now() - 3000000).toISOString() }
            ]
          })
        };
      }
      return originalFetch(url, options);
    };
    window.fetchMocked = true;
  }

  return (
    <div className="flex h-screen bg-[#0d0d0d] items-center justify-center p-10">
      <div className="w-full max-w-4xl h-[600px] rounded-2xl overflow-hidden border border-surface-variant shadow-2xl relative">
        {/* Mock out the API call by using an iframe or just letting it run */}
        <ChatBox 
          deal={mockDeal} 
          onCloseDeal={() => {}} 
          onOfferHandshake={() => {}} 
          onAcceptHandshake={() => {}} 
        />
      </div>
    </div>
  );
}
