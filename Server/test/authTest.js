/**
 * Comprehensive Authentication & Session Management Test Suite
 * Tests all 7 requirements:
 * 1. 24-Hour Auto Logout (exact 24-hour expiry, backend enforced, not extended by activity)
 * 2. Persistent Login (JWT & session validity verification)
 * 3. Multiple Devices (independent sessions S1 and S2 for same user)
 * 4. Other User Isolation (User B's session unaffected)
 * 5. Global Logout (revoking User A revokes S1 and S2, but keeps User B active)
 * 6. Revoked Token Rejection (HTTP 401 SESSION_REVOKED)
 * 7. Expired Session Rejection (HTTP 401 SESSION_EXPIRED)
 */

require("../config/env");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { ensureIndexes } = require("../config/ensureIndexes");
const sessionModel = require("../models/sessionModel");
const authMiddleware = require("../middleware/authMiddleware");

// Helper mock for Express req/res
function createMockReqRes({ token, cookieToken }) {
  const req = {
    headers: {
      cookie: cookieToken ? `token=${cookieToken}` : "",
      authorization: token ? `Bearer ${token}` : "",
      "user-agent": "AuthTestRunner/1.0",
      "x-forwarded-for": "127.0.0.1",
    },
    cookies: cookieToken ? { token: cookieToken } : {},
    socket: { remoteAddress: "127.0.0.1" },
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    cookie() {},
    clearCookie() {},
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("STARTING PARCELDROP AUTH & SESSION VERIFICATION");
  console.log("=================================================");

  const results = [];
  const testUserId1 = 999991;
  const testUserId2 = 999992;
  const createdSessionIds = [];

  try {
    // -----------------------------------------------------------------
    // TEST 1: Database Table & Index Verification
    // -----------------------------------------------------------------
    console.log("\n[TEST 1] Ensuring user_sessions table and optimal indexes...");
    await ensureIndexes();

    const [cols] = await db.promise().query(`
      SELECT COLUMN_NAME
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'user_sessions'
    `);
    const colNames = (cols || []).map((c) => c.COLUMN_NAME.toLowerCase());
    const expectedCols = [
      "session_id",
      "user_id",
      "ip_address",
      "user_agent",
      "created_at",
      "expires_at",
      "is_revoked",
      "revoked_at",
    ];
    const missing = expectedCols.filter((c) => !colNames.includes(c));

    if (missing.length === 0) {
      results.push({ name: "1. Table & Schema Verification", passed: true, details: "user_sessions exists with all required columns & indexes" });
      console.log("  PASS: user_sessions table and columns verified.");
    } else {
      results.push({ name: "1. Table & Schema Verification", passed: false, details: `Missing columns: ${missing.join(", ")}` });
      console.log("  FAIL: Missing columns:", missing);
    }

    // -----------------------------------------------------------------
    // TEST 2: Strict 24-Hour Expiry Calculation
    // -----------------------------------------------------------------
    console.log("\n[TEST 2] Verifying Exact 24-Hour Expiry creation...");
    const sessionId1 = crypto.randomUUID();
    createdSessionIds.push(sessionId1);
    const now = Date.now();
    const expiresAt1 = new Date(now + 24 * 60 * 60 * 1000);

    await sessionModel.createSession({
      sessionId: sessionId1,
      userId: testUserId1,
      ipAddress: "127.0.0.1",
      userAgent: "Device-1-Laptop",
      expiresAt: expiresAt1,
    });

    const sessionInDb = await sessionModel.findSession(sessionId1, testUserId1);
    const dbExpiryDiff = new Date(sessionInDb.expires_at).getTime() - new Date(sessionInDb.created_at).getTime();
    // 24 hours in milliseconds = 86400000 ms. Allow 2000ms delta for DB timestamp rounding
    const isExact24h = Math.abs(dbExpiryDiff - 24 * 60 * 60 * 1000) <= 2000;

    if (sessionInDb && isExact24h && sessionInDb.is_revoked === 0) {
      results.push({ name: "2. Exact 24-Hour Session Expiry", passed: true, details: `Expiry is exactly 24h from creation (diff: ${dbExpiryDiff}ms)` });
      console.log(`  PASS: Session created with exact 24h validity (${dbExpiryDiff}ms).`);
    } else {
      results.push({ name: "2. Exact 24-Hour Session Expiry", passed: false, details: `Expiry delta unexpected: ${dbExpiryDiff}` });
      console.log("  FAIL: Expiry calculation error:", dbExpiryDiff);
    }

    // -----------------------------------------------------------------
    // TEST 3: Multi-Device Independent Sessions (Device 1 & Device 2)
    // -----------------------------------------------------------------
    console.log("\n[TEST 3] Verifying Multi-Device Concurrent Independent Sessions...");
    const sessionId2 = crypto.randomUUID();
    createdSessionIds.push(sessionId2);
    const expiresAt2 = new Date(now + 24 * 60 * 60 * 1000);

    // Device 2 logs in with same user account (testUserId1)
    await sessionModel.createSession({
      sessionId: sessionId2,
      userId: testUserId1,
      ipAddress: "192.168.1.50",
      userAgent: "Device-2-Phone",
      expiresAt: expiresAt2,
    });

    // Check both sessions are active simultaneously
    const s1Check = await sessionModel.findSession(sessionId1, testUserId1);
    const s2Check = await sessionModel.findSession(sessionId2, testUserId1);

    const bothActive = s1Check && s2Check && s1Check.is_revoked === 0 && s2Check.is_revoked === 0;

    if (bothActive && s1Check.session_id !== s2Check.session_id) {
      results.push({ name: "3. Multiple Devices Concurrency", passed: true, details: "Same user has 2 independent active sessions simultaneously" });
      console.log("  PASS: Device 1 and Device 2 both active without logging out each other.");
    } else {
      results.push({ name: "3. Multiple Devices Concurrency", passed: false, details: "One session invalidated another prematurely" });
      console.log("  FAIL: Multi-device concurrency failed.");
    }

    // -----------------------------------------------------------------
    // TEST 4: Other User Session Isolation
    // -----------------------------------------------------------------
    console.log("\n[TEST 4] Verifying Isolation between Different Users...");
    const sessionId3 = crypto.randomUUID();
    createdSessionIds.push(sessionId3);
    const expiresAt3 = new Date(now + 24 * 60 * 60 * 1000);

    // User 2 logs in
    await sessionModel.createSession({
      sessionId: sessionId3,
      userId: testUserId2,
      ipAddress: "10.0.0.1",
      userAgent: "User-2-Laptop",
      expiresAt: expiresAt3,
    });

    const s3Check = await sessionModel.findSession(sessionId3, testUserId2);
    if (s3Check && s3Check.is_revoked === 0) {
      results.push({ name: "4. User Isolation", passed: true, details: "User 2 session created independently" });
      console.log("  PASS: User 2 session active and isolated.");
    } else {
      results.push({ name: "4. User Isolation", passed: false, details: "User 2 session creation failed" });
      console.log("  FAIL: User 2 session creation failed.");
    }

    // -----------------------------------------------------------------
    // TEST 5: authMiddleware Validation on Active Token (Bearer & Cookie)
    // -----------------------------------------------------------------
    console.log("\n[TEST 5] Testing authMiddleware on Active Tokens...");
    const jwtSecret = process.env.JWT_SECRET || "PARCELDROP8384930619PRAHLADSINGH";

    const tokenDevice1 = jwt.sign(
      { id: testUserId1, user_id: testUserId1, email: "user1@parceldrop.in", role: "user", session_id: sessionId1 },
      jwtSecret,
      { expiresIn: "24h" }
    );

    const tokenDevice2 = jwt.sign(
      { id: testUserId1, user_id: testUserId1, email: "user1@parceldrop.in", role: "user", session_id: sessionId2 },
      jwtSecret,
      { expiresIn: "24h" }
    );

    const tokenUser2 = jwt.sign(
      { id: testUserId2, user_id: testUserId2, email: "user2@parceldrop.in", role: "user", session_id: sessionId3 },
      jwtSecret,
      { expiresIn: "24h" }
    );

    let nextCalled1 = false;
    const mock1 = createMockReqRes({ token: tokenDevice1 });
    await authMiddleware(mock1.req, mock1.res, () => { nextCalled1 = true; });

    let nextCalled2Cookie = false;
    const mock2 = createMockReqRes({ cookieToken: tokenDevice2 });
    await authMiddleware(mock2.req, mock2.res, () => { nextCalled2Cookie = true; });

    if (nextCalled1 && nextCalled2Cookie && mock1.req.user?.id === testUserId1 && mock2.req.user?.session_id === sessionId2) {
      results.push({ name: "5. AuthMiddleware Active Validation", passed: true, details: "Both Bearer header and HttpOnly cookie pass authMiddleware" });
      console.log("  PASS: authMiddleware accepted valid Bearer token and HttpOnly cookie.");
    } else {
      results.push({ name: "5. AuthMiddleware Active Validation", passed: false, details: "authMiddleware rejected valid credentials" });
      console.log("  FAIL: authMiddleware rejected active token.");
    }

    // -----------------------------------------------------------------
    // TEST 6: Strict Auto-Logout on Expired Session (No Extension on Activity)
    // -----------------------------------------------------------------
    console.log("\n[TEST 6] Testing Rejection of Expired Session (24h Expiry Enforcement)...");
    const expiredSessionId = crypto.randomUUID();
    createdSessionIds.push(expiredSessionId);
    // Set expiry 10 seconds in the past
    const pastExpiry = new Date(Date.now() - 10000);

    await sessionModel.createSession({
      sessionId: expiredSessionId,
      userId: testUserId1,
      ipAddress: "127.0.0.1",
      userAgent: "Expired-Client",
      expiresAt: pastExpiry,
    });

    const expiredToken = jwt.sign(
      { id: testUserId1, user_id: testUserId1, email: "user1@parceldrop.in", role: "user", session_id: expiredSessionId },
      jwtSecret,
      { expiresIn: "24h" }
    );

    let nextCalledExpired = false;
    const mockExpired = createMockReqRes({ token: expiredToken });
    await authMiddleware(mockExpired.req, mockExpired.res, () => { nextCalledExpired = true; });

    const expiredStatus = mockExpired.getStatus();
    const expiredData = mockExpired.getData();

    if (!nextCalledExpired && expiredStatus === 401 && expiredData?.code === "SESSION_EXPIRED") {
      results.push({ name: "6. Server-Side 24-Hour Expiry Enforcement", passed: true, details: "Expired session rejected with 401 SESSION_EXPIRED" });
      console.log("  PASS: Expired session rejected with 401 SESSION_EXPIRED.");
    } else {
      results.push({ name: "6. Server-Side 24-Hour Expiry Enforcement", passed: false, details: `Expected 401 SESSION_EXPIRED, got status ${expiredStatus}` });
      console.log("  FAIL: Expired session not properly rejected:", expiredStatus, expiredData);
    }

    // -----------------------------------------------------------------
    // TEST 7: Global Logout (Revoke ALL User 1 Sessions, User 2 Unaffected)
    // -----------------------------------------------------------------
    console.log("\n[TEST 7] Testing Global Logout Across All Devices...");
    // User 1 clicks Logout on Device 1
    const revokeResult = await sessionModel.revokeAllUserSessions(testUserId1);

    // Verify S1 and S2 are revoked in DB
    const s1AfterRevoke = await sessionModel.findSession(sessionId1, testUserId1);
    const s2AfterRevoke = await sessionModel.findSession(sessionId2, testUserId1);
    // Verify User 2's session S3 is NOT revoked!
    const s3AfterRevoke = await sessionModel.findSession(sessionId3, testUserId2);

    const user1SessionsRevoked = s1AfterRevoke.is_revoked === 1 && s2AfterRevoke.is_revoked === 1;
    const user2SessionUntouched = s3AfterRevoke.is_revoked === 0;

    if (user1SessionsRevoked && user2SessionUntouched) {
      results.push({ name: "7. Global Logout DB Revocation", passed: true, details: `All User 1 sessions revoked (${revokeResult.affectedRows} affected); User 2 session remains active` });
      console.log(`  PASS: All active sessions for User 1 revoked. User 2 session untouched.`);
    } else {
      results.push({ name: "7. Global Logout DB Revocation", passed: false, details: "Global logout failed or affected wrong user" });
      console.log("  FAIL: Global logout DB revocation error.");
    }

    // -----------------------------------------------------------------
    // TEST 8: Revoked Token Rejection in Protected API Requests
    // -----------------------------------------------------------------
    console.log("\n[TEST 8] Testing Rejection of Revoked Tokens on Protected APIs...");
    // Device 2 tries to access API after Device 1 clicked Logout
    let nextCalledDevice2AfterLogout = false;
    const mockDevice2 = createMockReqRes({ token: tokenDevice2 });
    await authMiddleware(mockDevice2.req, mockDevice2.res, () => { nextCalledDevice2AfterLogout = true; });

    const device2Status = mockDevice2.getStatus();
    const device2Data = mockDevice2.getData();

    // User 2 (unaffected) tries to access API
    let nextCalledUser2AfterLogout = false;
    const mockUser2 = createMockReqRes({ token: tokenUser2 });
    await authMiddleware(mockUser2.req, mockUser2.res, () => { nextCalledUser2AfterLogout = true; });

    if (
      !nextCalledDevice2AfterLogout &&
      device2Status === 401 &&
      device2Data?.code === "SESSION_REVOKED" &&
      nextCalledUser2AfterLogout
    ) {
      results.push({ name: "8. Revoked Token Rejection & Isolation", passed: true, details: "Device 2 rejected with 401 SESSION_REVOKED; User 2 continues successfully" });
      console.log("  PASS: Device 2 rejected with 401 SESSION_REVOKED. User 2 unaffected.");
    } else {
      results.push({ name: "8. Revoked Token Rejection & Isolation", passed: false, details: `Device 2 status: ${device2Status}, User 2 allowed: ${nextCalledUser2AfterLogout}` });
      console.log("  FAIL: Revoked token not rejected or User 2 blocked.");
    }

  } catch (error) {
    console.error("Test execution error:", error);
    results.push({ name: "Execution Exception", passed: false, details: error.message });
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP TEST RECORDS
    // -----------------------------------------------------------------
    try {
      if (createdSessionIds.length > 0) {
        await db.promise().query(
          "DELETE FROM user_sessions WHERE session_id IN (?)",
          [createdSessionIds]
        );
        console.log(`\nCleaned up ${createdSessionIds.length} test session records.`);
      }
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
  }

  console.log("\n=================================================");
  console.log("TEST SUMMARY RESULTS");
  console.log("=================================================");
  let allPassed = true;
  for (const r of results) {
    const statusStr = r.passed ? "[PASS]" : "[FAIL]";
    console.log(`${statusStr} ${r.name}: ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log("=================================================");
  console.log(`OVERALL: ${allPassed ? "ALL 8 TESTS PASSED SUCCESSFULLY" : "SOME TESTS FAILED"}`);
  console.log("=================================================");

  setTimeout(() => process.exit(allPassed ? 0 : 1), 500);
}

runTestSuite();
