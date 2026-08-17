import { readFileSync } from "node:fs";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { hasValidLeadExportReceipt, normalizeLeadIds } from "../leadExport";

const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const P="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const RECEIPT="99999999-9999-4999-8999-999999999999";
const mocks=vi.hoisted(()=>({resolveUserId:vi.fn(),dealsSelect:vi.fn(),auditInsert:vi.fn()}));
vi.mock("@/lib/serverAuth",()=>({resolveUserId:mocks.resolveUserId}));
vi.mock("@/lib/supabaseAdmin",()=>({supabaseAdmin:{from:(table)=>{
  if(table==="deals") return {select:()=>({in:mocks.dealsSelect})};
  if(table==="lead_export_audit_log") return {insert:mocks.auditInsert};
  throw new Error(`Unexpected table ${table}`);
}}}));
import { POST } from "@/app/api/leads/export-audit/route";
const request=(body)=>new Request("https://scoutit.space/api/leads/export-audit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
const deal=(id=A, overrides={})=>({id,broker_id:"broker-1",buyer_id:"buyer-1",property_id:P,status:"accepted",properties:{owner_id:"owner-1"},deal_handshakes:[{handshake_type:"transaction_handshake",status:"completed"}],...overrides});

describe("lead export fail-closed contract",()=>{
  const original=process.env.LEAD_EXPORT_AUDIT_ACTIVE;
  beforeEach(()=>{vi.clearAllMocks();process.env.LEAD_EXPORT_AUDIT_ACTIVE="true";mocks.resolveUserId.mockResolvedValue("broker-1");mocks.dealsSelect.mockResolvedValue({data:[deal()],error:null});mocks.auditInsert.mockReturnValue({select:()=>({single:vi.fn().mockResolvedValue({data:{id:RECEIPT,created_at:"2026-08-14T01:00:00Z"},error:null})})});});
  afterEach(()=>{if(original===undefined) delete process.env.LEAD_EXPORT_AUDIT_ACTIVE; else process.env.LEAD_EXPORT_AUDIT_ACTIVE=original;});

  it("disables export before querying schema when gate is false",async()=>{delete process.env.LEAD_EXPORT_AUDIT_ACTIVE;const res=await POST(request({leadIds:[A],format:"csv"}));expect(res.status).toBe(503);expect(mocks.dealsSelect).not.toHaveBeenCalled();});
  it("rejects anonymous and malformed identifier sets",async()=>{mocks.resolveUserId.mockResolvedValue(null);expect((await POST(request({leadIds:[A],format:"csv"}))).status).toBe(401);mocks.resolveUserId.mockResolvedValue("broker-1");for(const ids of [[],["not-uuid"],[A,A]]) expect((await POST(request({leadIds:ids,format:"csv"}))).status).toBe(400);});
  it("requires exact set equality for zero and partial database results",async()=>{for(const rows of [[],[deal(A)]]){mocks.dealsSelect.mockResolvedValueOnce({data:rows,error:null});const ids=rows.length?[A,B]:[A];expect((await POST(request({leadIds:ids,format:"csv"}))).status).toBe(403);}});
  it("rejects mixed authority",async()=>{mocks.dealsSelect.mockResolvedValue({data:[deal(A),deal(B,{broker_id:"other",properties:{owner_id:"other-owner"}})],error:null});expect((await POST(request({leadIds:[A,B],format:"csv"}))).status).toBe(403);expect(mocks.auditInsert).not.toHaveBeenCalled();});
  it.each(["pending","connected","closed","declined"])("rejects deal state %s",async(status)=>{mocks.dealsSelect.mockResolvedValue({data:[deal(A,{status})],error:null});expect((await POST(request({leadIds:[A],format:"csv"}))).status).toBe(409);});
  it.each([[],[{handshake_type:"transaction_handshake",status:"pending"}],[{handshake_type:"representation_handshake",status:"completed"}]])("rejects unreleased handshake evidence",async(handshakes)=>{mocks.dealsSelect.mockResolvedValue({data:[deal(A,{deal_handshakes:handshakes})],error:null});expect((await POST(request({leadIds:[A],format:"csv"}))).status).toBe(409);});
  it("derives privacy-safe scope and returns persisted receipt",async()=>{const res=await POST(request({leadIds:[A],format:"clipboard_copy"}));expect(res.status).toBe(200);const inserted=mocks.auditInsert.mock.calls[0][0];expect(inserted).toMatchObject({actor_id:"broker-1",format:"clipboard_copy",lead_count:1,property_count:1,purpose_code:"crm_export"});expect(inserted.lead_scope_hash).toMatch(/^[a-f0-9]{64}$/);expect(inserted).not.toHaveProperty("leadIds");expect((await res.json()).auditId).toBe(RECEIPT);});
  it.each([{data:null,error:new Error("write")},{data:{id:RECEIPT},error:null}])("blocks when receipt persistence is not proven",async(result)=>{mocks.auditInsert.mockReturnValue({select:()=>({single:vi.fn().mockResolvedValue(result)})});expect((await POST(request({leadIds:[A],format:"csv"}))).status).toBe(503);});
});

describe("lead export client receipt checks",()=>{
  const good={ok:true,status:200,data:{success:true,authorized:true,auditId:RECEIPT,auditedAt:"2026-08-14T01:00:00Z",leadCount:1,format:"csv"}};
  it("normalizes only unique UUIDs",()=>{expect(normalizeLeadIds([{deal_id:A.toUpperCase()}])).toEqual([A]);expect(normalizeLeadIds([{id:A},{id:A}])).toBeNull();expect(normalizeLeadIds([{}])).toBeNull();});
  it("accepts only a complete matching receipt",()=>{expect(hasValidLeadExportReceipt(good,1,"csv")).toBe(true);for(const bad of [{...good,ok:false},{...good,status:500},{...good,data:null},{...good,data:{...good.data,authorized:false}},{...good,data:{...good.data,auditId:"fabricated"}},{...good,data:{...good.data,leadCount:2}},{error:"network"}]) expect(hasValidLeadExportReceipt(bad,1,"csv")).toBe(false);});
});
describe("lead audit database permissions",()=>{
 const sql=readFileSync("supabase/migrations/20260814000004_lead_export_audit_log.sql","utf8");
 it("revokes browser writes and makes receipts immutable",()=>{
  expect(sql).toContain("REVOKE ALL ON TABLE public.lead_export_audit_log FROM PUBLIC, anon, authenticated");
  expect(sql).toContain("BEFORE UPDATE OR DELETE");
  expect(sql).toContain("purpose_code TEXT NOT NULL CHECK (purpose_code = 'crm_export')");
  expect(sql).toContain("lead_scope_hash");
  expect(sql).not.toMatch(/email|phone|message|buyer_name/);
 });
});