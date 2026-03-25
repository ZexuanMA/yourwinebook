import { describe, it, expect } from "vitest";
import { getBusinessStatus, type HoursMap } from "@ywb/domain";

describe("getBusinessStatus()", () => {
  it("returns closed for null hours", () => {
    expect(getBusinessStatus(null).status).toBe("closed");
  });

  it("returns closed for empty hours", () => {
    expect(getBusinessStatus({}).status).toBe("closed");
  });

  it("returns open during business hours", () => {
    const hours: HoursMap = { mon: { open: "10:00", close: "21:00" } };
    // Monday at 15:00
    const now = new Date("2026-03-23T15:00:00"); // 2026-03-23 is Monday
    const result = getBusinessStatus(hours, now);
    expect(result.status).toBe("open");
    expect(result.closesAt).toBe("21:00");
  });

  it("returns closed outside business hours", () => {
    const hours: HoursMap = { mon: { open: "10:00", close: "21:00" } };
    // Monday at 22:00
    const now = new Date("2026-03-23T22:00:00");
    expect(getBusinessStatus(hours, now).status).toBe("closed");
  });

  it("returns closing-soon within 30 minutes of close", () => {
    const hours: HoursMap = { mon: { open: "10:00", close: "21:00" } };
    // Monday at 20:45 (15 min before close)
    const now = new Date("2026-03-23T20:45:00");
    expect(getBusinessStatus(hours, now).status).toBe("closing-soon");
  });

  it("handles cross-day hours (open late, close next morning)", () => {
    const hours: HoursMap = { fri: { open: "18:00", close: "02:00" } };
    // Friday at 23:00
    const now = new Date("2026-03-27T23:00:00"); // 2026-03-27 is Friday
    const result = getBusinessStatus(hours, now);
    expect(result.status).toBe("open");
  });

  it("handles cross-day hours (still open in early morning)", () => {
    const hours: HoursMap = { fri: { open: "18:00", close: "02:00" } };
    // Saturday at 01:00 (still within Friday's cross-day hours)
    const now = new Date("2026-03-28T01:00:00"); // Saturday
    const result = getBusinessStatus(hours, now);
    expect(result.status).toBe("open");
  });

  it("returns closing-soon near end of cross-day hours", () => {
    const hours: HoursMap = { fri: { open: "18:00", close: "02:00" } };
    // Saturday at 01:45 (15 min before 02:00 close)
    const now = new Date("2026-03-28T01:45:00");
    const result = getBusinessStatus(hours, now);
    expect(result.status).toBe("closing-soon");
  });

  it("returns closed with opensAt when before opening", () => {
    const hours: HoursMap = { mon: { open: "10:00", close: "21:00" } };
    // Monday at 08:00
    const now = new Date("2026-03-23T08:00:00");
    const result = getBusinessStatus(hours, now);
    expect(result.status).toBe("closed");
    expect(result.opensAt).toBe("10:00");
  });

  it("returns closed on days not in the schedule", () => {
    const hours: HoursMap = { mon: { open: "10:00", close: "21:00" } };
    // Tuesday at 15:00
    const now = new Date("2026-03-24T15:00:00");
    expect(getBusinessStatus(hours, now).status).toBe("closed");
  });
});
