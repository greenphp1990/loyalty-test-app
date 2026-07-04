import { calculateMatchScore } from "./matcher";

function assertTest(
  expected: string, 
  submitted: string, 
  expectedPass: boolean, 
  description: string
) {
  const score = calculateMatchScore(expected, submitted);
  const passed = score >= 90;
  const status = passed ? "PASSED" : (score >= 50 ? "PARTIAL PASS" : "FAILED");
  const success = passed === expectedPass;
  
  console.log(`[TEST] ${description}\n       "${expected}" vs "${submitted}" -> Score: ${score}% (${status}) | ${success ? "✅ SUCCESS" : "❌ FAILURE"}`);
  if (!success) {
    throw new Error(`Assertion failed: "${expected}" vs "${submitted}" should have yielded passed=${expectedPass}`);
  }
}

try {
  console.log("==================================================");
  console.log("🧪 Running Answer Matching Engine Unit Tests...");
  console.log("==================================================");
  
  // 1. Abel Johnson vs Abel (First-name-only match, should pass)
  assertTest(
    "Abel Johnson", 
    "Abel", 
    true, 
    "First-name-only matching (expected 'Abel Johnson', answered 'Abel')"
  );
  
  // 2. Abel Johnson vs A. Johnson (Initials match, should pass)
  assertTest(
    "Abel Johnson", 
    "A. Johnson", 
    true, 
    "Initials matching (expected 'Abel Johnson', answered 'A. Johnson')"
  );
  
  // 3. 08012345678 vs 5678 (Phone last 4 digits match, should pass)
  assertTest(
    "08012345678", 
    "5678", 
    true, 
    "Phone last-4 digit extraction (expected '08012345678', answered '5678')"
  );
  
  // 4. January 10 vs Jan 10 (Date/Month abbreviation normalization, should pass)
  assertTest(
    "January 10", 
    "Jan 10", 
    true, 
    "Date abbreviation normalization (expected 'January 10', answered 'Jan 10')"
  );

  // 5. Abel Johnson vs Johnson Abel (Reversed name check, should pass)
  assertTest(
    "Abel Johnson", 
    "Johnson Abel", 
    true, 
    "Reversed names support (expected 'Abel Johnson', answered 'Johnson Abel')"
  );

  // 6. Wrong answer cases (should fail)
  assertTest(
    "Abel Johnson", 
    "Bisi", 
    false, 
    "Incorrect name mismatch (expected 'Abel Johnson', answered 'Bisi')"
  );
  
  assertTest(
    "January 10", 
    "Feb 10", 
    false, 
    "Incorrect month mismatch (expected 'January 10', answered 'Feb 10')"
  );

  assertTest(
    "08012345678", 
    "1234", 
    false, 
    "Incorrect phone digits mismatch (expected '08012345678', answered '1234')"
  );
  
  console.log("==================================================");
  console.log("🎉 All unit tests passed successfully!");
  console.log("==================================================");
  process.exit(0);
} catch (error: any) {
  console.error("==================================================");
  console.error("❌ Test execution failed:", error.message);
  console.error("==================================================");
  process.exit(1);
}
