import { describe, it, expect } from "vitest";
import {
  STORE_EVENTS,
  COMMUNITY_EVENTS,
  AUTH_EVENTS,
  EVENT_TYPES,
} from "@ywb/domain";

describe("STORE_EVENTS", () => {
  it("has all expected store funnel events", () => {
    expect(STORE_EVENTS.LOCATION_PERMISSION_REQUESTED).toBeDefined();
    expect(STORE_EVENTS.STORE_LIST_VIEWED).toBeDefined();
    expect(STORE_EVENTS.STORE_CARD_CLICKED).toBeDefined();
    expect(STORE_EVENTS.STORE_DETAIL_VIEWED).toBeDefined();
    expect(STORE_EVENTS.STORE_BOOKMARKED).toBeDefined();
    expect(STORE_EVENTS.STORE_UNBOOKMARKED).toBeDefined();
    expect(STORE_EVENTS.STORE_NAVIGATE_CLICKED).toBeDefined();
  });

  it("all values are non-empty strings", () => {
    for (const value of Object.values(STORE_EVENTS)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe("COMMUNITY_EVENTS", () => {
  it("has post lifecycle events", () => {
    expect(COMMUNITY_EVENTS.POST_CREATE_STARTED).toBeDefined();
    expect(COMMUNITY_EVENTS.POST_CREATE_SUBMITTED).toBeDefined();
    expect(COMMUNITY_EVENTS.POST_CREATE_SUCCESS).toBeDefined();
    expect(COMMUNITY_EVENTS.POST_CREATE_FAILED).toBeDefined();
  });

  it("has interaction events", () => {
    expect(COMMUNITY_EVENTS.POST_LIKED).toBeDefined();
    expect(COMMUNITY_EVENTS.POST_UNLIKED).toBeDefined();
    expect(COMMUNITY_EVENTS.POST_BOOKMARKED).toBeDefined();
    expect(COMMUNITY_EVENTS.COMMENT_SUBMITTED).toBeDefined();
    expect(COMMUNITY_EVENTS.REPORT_SUBMITTED).toBeDefined();
    expect(COMMUNITY_EVENTS.USER_BLOCKED).toBeDefined();
  });
});

describe("AUTH_EVENTS", () => {
  it("has login, register, and logout events", () => {
    expect(AUTH_EVENTS.LOGIN).toBe("user_logged_in");
    expect(AUTH_EVENTS.REGISTER).toBe("user_registered");
    expect(AUTH_EVENTS.LOGOUT).toBe("user_logged_out");
  });
});

describe("EVENT_TYPES", () => {
  it("has 3 legacy event types", () => {
    expect(EVENT_TYPES).toEqual(["pageview", "wine_view", "price_click"]);
  });
});
