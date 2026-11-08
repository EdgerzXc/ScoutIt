import { describe, it, expect } from "vitest";
import { classifyContactSpam } from "../contactSpamPolicy.mjs";

describe("Zero-Cost Contact Spam Policy (classifyContactSpam)", () => {
  describe("Legitimate Inquiries (must NOT be flagged)", () => {
    it("allows a legitimate commercial property owner inquiry", () => {
      const res = classifyContactSpam({
        name: "Carlos Mendoza",
        email: "carlos@mendoza-holdings.ph",
        subject: "Listing an entire office floor in Bonifacio Global City",
        message: "Hello ScoutIt team, I own a 1,200 sqm prime office floor at One Bonifacio High Street and would like to verify how to list it on your 3D directory. Thank you.",
      });
      expect(res.isSpam).toBe(false);
      expect(res.reason).toBeNull();
    });

    it("allows a legitimate broker inquiry with a reference property link", () => {
      const res = classifyContactSpam({
        name: "Maria Santos",
        email: "maria.santos@remax.ph",
        subject: "Question about co-brokering terms",
        message: "Hi, I am an accredited broker for the listing at https://www.scoutit.space/property/one-ecom-center. What is the process for submitting client viewings through your platform?",
      });
      expect(res.isSpam).toBe(false);
      expect(res.reason).toBeNull();
    });

    it("allows a partner photographer portfolio inquiry with one URL", () => {
      const res = classifyContactSpam({
        name: "Juan Dela Cruz",
        email: "juan@architecturalphotos.ph",
        subject: "Spatial Photographer Application",
        message: "Good day! I am a commercial architectural photographer in Metro Manila. You can see my past work here: https://portfolio.juanphotos.ph. I would love to be listed on your Layer 4 directory.",
      });
      expect(res.isSpam).toBe(false);
      expect(res.reason).toBeNull();
    });

    it("allows short seeker inquiries", () => {
      const res = classifyContactSpam({
        name: "Elena Perez",
        email: "elena@gmail.com",
        subject: "Rental in Makati",
        message: "Do you have 2-bedroom units available in Salcedo Village for immediate move-in?",
      });
      expect(res.isSpam).toBe(false);
      expect(res.reason).toBeNull();
    });
  });

  describe("Automated Spam Detection (must be flagged as spam)", () => {
    it("flags crypto & bitcoin investment pitches", () => {
      const res = classifyContactSpam({
        name: "Crypto Queen",
        email: "invest@crypto-yields-daily.com",
        subject: "High yield Bitcoin investment opportunity",
        message: "Discover our automated trading bot that guarantees 20% passive income guaranteed every week. Connect your wallet now.",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("solicitation_keyword");
    });

    it("flags online casino & gambling blasts", () => {
      const res = classifyContactSpam({
        name: "Lucky Spin",
        email: "promo@jilislots777.com",
        subject: "Exclusive bonus for ScoutIt users",
        message: "Play at the best online casino in the Philippines with 100 free spins bonus and live baccarat online.",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("solicitation_keyword");
    });

    it("flags SEO guest post and backlink solicitations", () => {
      const res = classifyContactSpam({
        name: "Alex Linkbuilder",
        email: "alex@outreach-seo-masters.net",
        subject: "Guest post outreach for scoutit.space",
        message: "Hello Webmaster, I would like to buy backlinks and provide a high da backlink or collaborative post for your website to increase your website traffic.",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("solicitation_keyword");
    });

    it("flags messaging redirect scam links (t.me / wa.me)", () => {
      const res = classifyContactSpam({
        name: "Fast Money",
        email: "contact@anon-mail.org",
        subject: "Partnership proposal",
        message: "We have an urgent business proposal. Reach out on Telegram: t.me/fastprofits2026 for details.",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("solicitation_keyword");
    });

    it("flags BBCode and HTML anchor injection", () => {
      const res = classifyContactSpam({
        name: "Bot Spammer",
        email: "spambot@mail.ru",
        subject: "Check this out",
        message: "Visit our store here: [url=https://bad-site.com]cheap deals[/url]",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("markup_injection");
    });

    it("flags HTML anchor injection", () => {
      const res = classifyContactSpam({
        name: "Bot Spammer",
        email: "spambot@mail.ru",
        subject: "Offer",
        message: 'Click here <a href="https://phish-site.com">Claim Prize</a>',
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("markup_injection");
    });

    it("flags excessive link stuffing (> 2 URLs)", () => {
      const res = classifyContactSpam({
        name: "Spammer",
        email: "spammer@links.com",
        subject: "Great resources",
        message: "Check these: https://site1.com and https://site2.com and also https://site3.com",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("excessive_links");
    });

    it("flags Cyrillic spam blasts", () => {
      const res = classifyContactSpam({
        name: "Иван Иванов",
        email: "ivan@yandex.ru",
        subject: "Коммерческое предложение",
        message: "Здравствуйте, предлагаем продвижение вашего сайта в поисковых системах с гарантией результата.",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("non_target_script");
    });

    it("flags repetitive gibberish", () => {
      const res = classifyContactSpam({
        name: "Gibberish Bot",
        email: "bot@test.com",
        subject: "Hello",
        message: "aaaaaaaaaaaaaaaaaaaa please contact me",
      });
      expect(res.isSpam).toBe(true);
      expect(res.reason).toBe("repetitive_gibberish");
    });
  });
});
