import { checkRateLimit, getRouteRateLimitTier } from "../src/lib/rateLimit";

export function runRateLimitTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  console.log("\n🧪 Running Rate Limiter & API Security Test Suite...");

  // Test 1: First request under limit
  const res1 = checkRateLimit("test-runner-ip-1", 5, 10);
  assert(res1.allowed === true, "First request should be allowed");
  assert(res1.remaining === 4, "Remaining count should be 4");
  assert(res1.limit === 5, "Limit should be 5");
  assert(res1.resetInSeconds <= 10, "Reset seconds should be within window");

  // Test 2: Requests up to limit
  for (let i = 0; i < 4; i++) {
    checkRateLimit("test-runner-ip-1", 5, 10);
  }
  const blocked = checkRateLimit("test-runner-ip-1", 5, 10);
  assert(blocked.allowed === false, "6th request should be blocked (exceeded limit 5)");
  assert(blocked.remaining === 0, "Remaining tokens should be 0 when blocked");
  assert(blocked.resetInSeconds > 0, "Reset seconds should be > 0 when blocked");

  // Test 3: Isolated IP keys
  const isolated = checkRateLimit("test-runner-ip-2", 5, 10);
  assert(isolated.allowed === true, "Separate IP address should not be blocked");
  assert(isolated.remaining === 4, "Separate IP remaining count should be 4");

  // Test 4: Route tier classifications
  const combatTier = getRouteRateLimitTier("/api/combat/attack");
  assert(combatTier.limit === 30, "Combat attack should be tiered at 30 req/min");
  assert(combatTier.windowSecs === 60, "Combat attack window should be 60s");

  const gachaTier = getRouteRateLimitTier("/api/shop/gacha");
  assert(gachaTier.limit === 30, "Gacha should be tiered at 30 req/min");

  const submitTier = getRouteRateLimitTier("/api/workout/submit");
  assert(submitTier.limit === 15, "Workout submit should be tiered at 15 req/min");
  assert(submitTier.windowSecs === 60, "Workout submit window should be 60s");

  const generalTier = getRouteRateLimitTier("/api/user/profile");
  assert(generalTier.limit === 100, "General API should be tiered at 100 req/min");

  return { passed, failed };
}
