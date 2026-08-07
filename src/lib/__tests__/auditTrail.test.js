import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAuditLog } from '@/lib/auditTrail';

// The bug this module exists to prevent: `audit_logs.table_name`,
// `record_id` and `action` are NOT NULL with no default, and all three
// hand-rolled call sites omitted table_name and record_id. Every insert threw,
// every call site swallowed it, and the table has never received an
// application-written row. These tests lock the shape in.

function client({ error = null } = {}) {
  const inserts = [];
  return {
    inserts,
    from: vi.fn(() => ({
      insert: (payload) => {
        inserts.push(payload);
        return Promise.resolve({ error });
      },
    })),
  };
}

const valid = {
  action: 'PROPERTY_VERIFIED',
  tableName: 'properties',
  recordId: 'abc-123',
  userId: 'user-9',
};

describe('writeAuditLog', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends every NOT NULL column', async () => {
    const db = client();
    const result = await writeAuditLog(db, valid);

    expect(result.ok).toBe(true);
    expect(db.from).toHaveBeenCalledWith('audit_logs');

    const row = db.inserts[0];
    expect(row.action).toBe('PROPERTY_VERIFIED');
    expect(row.table_name).toBe('properties');
    expect(row.record_id).toBe('abc-123');
  });

  it('defaults resource_type/resource_id from the table and record', async () => {
    const db = client();
    await writeAuditLog(db, valid);
    expect(db.inserts[0].resource_type).toBe('properties');
    expect(db.inserts[0].resource_id).toBe('abc-123');
  });

  it('lets an explicit resource_type override the default', async () => {
    const db = client();
    await writeAuditLog(db, { ...valid, tableName: 'deals', resourceType: 'deal' });
    expect(db.inserts[0].table_name).toBe('deals');
    expect(db.inserts[0].resource_type).toBe('deal');
  });

  it('coerces ids to text, since record_id/user_id are text columns', async () => {
    const db = client();
    await writeAuditLog(db, { ...valid, recordId: 42, userId: 7 });
    expect(db.inserts[0].record_id).toBe('42');
    expect(db.inserts[0].user_id).toBe('7');
  });

  it('defaults metadata to an object rather than sending null', async () => {
    const db = client();
    await writeAuditLog(db, valid);
    expect(db.inserts[0].metadata).toEqual({});
  });

  it.each(['action', 'tableName', 'recordId'])(
    'refuses to send a doomed insert when %s is missing',
    async (field) => {
      const db = client();
      const entry = { ...valid };
      delete entry[field];

      const result = await writeAuditLog(db, entry);

      expect(result.ok).toBe(false);
      expect(result.error.message).toMatch(field);
      // The point: no statement is issued at all.
      expect(db.inserts).toHaveLength(0);
    }
  );

  it('reports a database error instead of swallowing it', async () => {
    const db = client({ error: { message: 'permission denied' } });
    const result = await writeAuditLog(db, valid);

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('permission denied');
  });

  it('returns an error rather than throwing when there is no client', async () => {
    const result = await writeAuditLog(null, valid);
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });

  it('never throws, so an audit failure cannot break the caller request', async () => {
    const exploding = { from: () => ({ insert: () => Promise.reject(new Error('boom')) }) };

    const result = await writeAuditLog(exploding, valid);

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('boom');
  });
});
