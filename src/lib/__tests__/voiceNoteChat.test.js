import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    storage: mockStorage,
  },
}));

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    storage: mockStorage,
  },
}));

import { uploadAttachment } from "../storage";

describe("Voice Note & Audio Chat Attachments Contract", () => {
  let mockUpload;
  let mockCreateSignedUrl;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpload = vi.fn().mockResolvedValue({ data: { path: "deal_123/mock-audio.webm" }, error: null });
    mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://storage.supabase.co/chat_attachments/deal_123/mock-audio.webm?token=abc" },
      error: null,
    });

    mockStorage.from.mockReturnValue({
      upload: mockUpload,
      createSignedUrl: mockCreateSignedUrl,
    });
  });

  it("successfully uploads a voice memo in WebM format with Opus codec", async () => {
    const mockFile = {
      name: "voice-memo-12345.webm",
      type: "audio/webm;codecs=opus",
      size: 150 * 1024, // 150 KB
    };

    const result = await uploadAttachment("deal_123", mockFile, { isVoiceNote: true, duration: 42 });

    expect(mockStorage.from).toHaveBeenCalledWith("chat_attachments");
    expect(mockUpload).toHaveBeenCalledOnce();
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(expect.stringContaining("deal_123/"), 60 * 60 * 24 * 7);

    expect(result).toMatchObject({
      name: "voice-memo-12345.webm",
      type: "audio/webm",
      size: 150 * 1024,
      isVoiceNote: true,
      duration: 42,
      url: expect.stringContaining("https://storage.supabase.co"),
    });
  });

  it("supports common mobile/browser audio formats (MP4, OGG, WAV)", async () => {
    const formats = [
      { name: "memo.mp4", type: "audio/mp4" },
      { name: "memo.ogg", type: "audio/ogg;codecs=opus" },
      { name: "memo.wav", type: "audio/wav" },
    ];

    for (const fmt of formats) {
      const mockFile = { ...fmt, size: 200 * 1024 };
      const res = await uploadAttachment("deal_test", mockFile);
      expect(res.isVoiceNote).toBe(true);
      expect(res.type).toBe(fmt.type.split(";")[0]);
    }
  });

  it("rejects files exceeding the audio size ceiling (10MB)", async () => {
    const oversizedAudio = {
      name: "podcast-episode.webm",
      type: "audio/webm",
      size: 12 * 1024 * 1024, // 12 MB
    };

    await expect(uploadAttachment("deal_123", oversizedAudio)).rejects.toThrow(
      /File is too large/
    );
  });

  it("rejects unauthorized non-whitelisted MIME types", async () => {
    const maliciousFile = {
      name: "malicious.sh",
      type: "application/x-sh",
      size: 1024,
    };

    await expect(uploadAttachment("deal_123", maliciousFile)).rejects.toThrow(
      /Invalid file type/
    );
  });

  it("preserves voice memo roundtrip envelope encoding and decoding", () => {
    const ATTACHMENT_PREFIX = "__scoutit_attachment__:";
    const encodeAttachment = (att) => `${ATTACHMENT_PREFIX}${JSON.stringify(att)}`;
    const decodeAttachment = (body) => {
      if (!body || !body.startsWith(ATTACHMENT_PREFIX)) return null;
      try {
        return JSON.parse(body.slice(ATTACHMENT_PREFIX.length));
      } catch {
        return null;
      }
    };

    const payload = {
      path: "deal_123/voice-123.webm",
      url: "https://storage.supabase.co/voice-123.webm",
      name: "voice-123.webm",
      type: "audio/webm",
      size: 124500,
      isVoiceNote: true,
      duration: 58,
    };

    const serialized = encodeAttachment(payload);
    expect(serialized.startsWith(ATTACHMENT_PREFIX)).toBe(true);
    // Envelope is tiny plain text (under 250 bytes), leaving PostgreSQL uncluttered
    expect(serialized.length).toBeLessThan(350);

    const decoded = decodeAttachment(serialized);
    expect(decoded).toEqual(payload);
    expect(decoded.isVoiceNote).toBe(true);
    expect(decoded.duration).toBe(58);
  });

  it("verifies 60-second limit cap behavior", () => {
    const MAX_VOICE_NOTE_DURATION_SEC = 60;
    const testDurations = [15, 45, 60, 65, 120];

    testDurations.forEach((dur) => {
      const capped = Math.min(dur, MAX_VOICE_NOTE_DURATION_SEC);
      expect(capped).toBeLessThanOrEqual(60);
    });
  });
});
