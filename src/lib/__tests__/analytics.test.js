import { describe,it,expect,vi,beforeEach,afterEach } from "vitest";
import { trackEvent,GA_EVENTS,sanitizeAnalyticsParams } from "../analytics";
describe("GA4 privacy allowlists",()=>{
 beforeEach(()=>{vi.unstubAllEnvs();delete globalThis.window;});afterEach(()=>{vi.unstubAllEnvs();delete globalThis.window;});
 it("uses an exact allowlist for every call site event",()=>{
  expect(sanitizeAnalyticsParams(GA_EVENTS.BOARD_SAVE,{property_id:"bgc-tower",signed_in:true,email:"x@y.com"})).toEqual({property_id:"bgc-tower",signed_in:true});
  expect(sanitizeAnalyticsParams(GA_EVENTS.INQUIRY_SENT,{channel:"deal_intro",property_slug:"bgc-tower",connects_spent:1,routed_to:"broker",extra:"drop"})).toEqual({channel:"deal_intro",property_slug:"bgc-tower",connects_spent:1,routed_to:"broker"});
  expect(sanitizeAnalyticsParams(GA_EVENTS.CONNECT_SPENT,{spend_reason:"pitch",property_id:"abc",role:"buyer",tier:"starry",amount:1})).toEqual({spend_reason:"pitch",property_id:"abc",role:"buyer",tier:"starry",amount:1});
  expect(sanitizeAnalyticsParams(GA_EVENTS.SIGNUP_COMPLETED,{role:"owner",opened_owner_wizard:false})).toEqual({role:"owner",opened_owner_wizard:false});
  expect(sanitizeAnalyticsParams(GA_EVENTS.PROPERTY_PUBLISHED,{property_id:"abc",with_declaration:true})).toEqual({property_id:"abc",with_declaration:true});
  expect(sanitizeAnalyticsParams(GA_EVENTS.SHARE_COMPLETED,{channel:"copy",property_slug:"abc",ref:"v123"})).toEqual({channel:"copy",property_slug:"abc",ref:"v123"});
 });
 it.each([
  {email:"buyer@example.com"},{nested:{email:"x@y.com"}},{items:["x@y.com"]},{alternate_email:"x@y.com"},
  {channel:"https://evil.test/path?email=x"},{channel:"evil?phone=0917"},{channel:"+63 (917) 123-4567"},
  {channel:"0917-123-4567"},{channel:Infinity},{channel:null},
 ])("drops unknown, structured, URL, and contact-bearing values: %o",(params)=>{expect(sanitizeAnalyticsParams(GA_EVENTS.SHARE_COMPLETED,params)).toEqual({});});
 it("drops unknown events and never dispatches them",()=>{vi.stubEnv("NEXT_PUBLIC_GA_ID","G-X");const gtag=vi.fn();globalThis.window={gtag};expect(trackEvent("custom_event",{channel:"copy"})).toBe(false);expect(gtag).not.toHaveBeenCalled();});
 it("stays disabled without GA config",()=>{const gtag=vi.fn();globalThis.window={gtag};expect(trackEvent(GA_EVENTS.BOARD_SAVE,{property_id:"p1"})).toBe(false);expect(gtag).not.toHaveBeenCalled();});
 it("dispatches sanitized params and never throws",()=>{vi.stubEnv("NEXT_PUBLIC_GA_ID","G-X");const gtag=vi.fn();globalThis.window={gtag};expect(trackEvent(GA_EVENTS.CONNECT_SPENT,{spend_reason:"pitch",amount:1,buyer_email:"x@y.com"})).toBe(true);expect(gtag).toHaveBeenCalledWith("event","connect_spent",{spend_reason:"pitch",amount:1});globalThis.window={gtag:()=>{throw new Error("boom")}};expect(trackEvent(GA_EVENTS.BOARD_SAVE)).toBe(false);});
});