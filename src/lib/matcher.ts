/**
 * Normalizes text for comparison by:
 * - Converting to lowercase
 * - Stripping punctuation
 * - Compressing whitespace
 * - Removing common titles (mr, mrs, ms, dr, doctor, sir, etc.)
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  
  let normalized = text.toLowerCase().trim();
  
  // Replace punctuation characters with space
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g, " ");
  
  // Replace multiple whitespace with a single space
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  // Remove common prefix titles
  const titles = ["mr", "mrs", "miss", "ms", "dr", "doctor", "sir", "chief"];
  const words = normalized.split(" ");
  const filteredWords = words.filter((word, idx) => {
    // Only remove title if it's the first word and followed by other words
    if (idx === 0 && words.length > 1 && titles.includes(word)) {
      return false;
    }
    return true;
  });
  
  normalized = filteredWords.join(" ");

  // 1. Normalize dates / month formats
  // Replace full month names with standard abbreviations
  const monthMap: Record<string, string> = {
    january: "jan", february: "feb", march: "mar", april: "apr",
    may: "may", june: "jun", july: "jul", august: "aug",
    september: "sep", october: "oct", november: "nov", december: "dec"
  };
  for (const [full, abbr] of Object.entries(monthMap)) {
    normalized = normalized.replace(new RegExp(`\\b${full}\\b`, "g"), abbr);
  }

  // Strip ordinal suffixes (e.g. 10th -> 10, 1st -> 1, 2nd -> 2, 3rd -> 3)
  normalized = normalized.replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1");

  // Remove "of" stop word
  normalized = normalized.replace(/\bof\b/g, "");

  // Compress whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();

  // Reorder "day month" to "month day" format (e.g., "10 jan" -> "jan 10")
  normalized = normalized.replace(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/g, "$2 $1");

  // Compress whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  return normalized;
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j;
  const alen = a.length;
  const blen = b.length;
  
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  
  for (i = 0; i <= alen; i++) {
    tmp[i] = [i];
  }
  
  for (j = 0; j <= blen; j++) {
    tmp[0][j] = j;
  }
  
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  
  return tmp[alen][blen];
}

/**
 * Calculates a match score between 0 and 100.
 */
export function calculateMatchScore(expected: string, submitted: string): number {
  if (!expected || !submitted) return 0;

  // 1. Phone last 4 digits matching
  const expectedDigits = expected.replace(/\D/g, "");
  const submittedDigits = submitted.replace(/\D/g, "");
  const isExpectedPhone = expectedDigits.length >= 10 && expectedDigits.length <= 15;
  const isSubmittedPhone = submittedDigits.length >= 10 && submittedDigits.length <= 15;

  if (isExpectedPhone || isSubmittedPhone) {
    const expLast4 = expectedDigits.slice(-4);
    const subLast4 = submittedDigits.slice(-4);
    if (expLast4 && subLast4 && expLast4 === subLast4) {
      return 100;
    }
  }

  // 2. Standardize normalization
  const normExpected = normalizeText(expected);
  const normSubmitted = normalizeText(submitted);
  
  if (!normExpected || !normSubmitted) return 0;
  if (normExpected === normSubmitted) return 100;
  
  const expWords = normExpected.split(" ");
  const subWords = normSubmitted.split(" ");

  // 3. Reversed names check
  if (expWords.length > 1 && subWords.length > 1) {
    const expSorted = [...expWords].sort().join(" ");
    const subSorted = [...subWords].sort().join(" ");
    if (expSorted === subSorted) {
      return 100;
    }
  }

  // 4. First-name-only match
  if (expWords.length > 1 && subWords.length === 1) {
    if (expWords.includes(subWords[0])) {
      return 100;
    }
  }
  if (subWords.length > 1 && expWords.length === 1) {
    if (subWords.includes(expWords[0])) {
      return 100;
    }
  }

  // 5. Initials match
  if (expWords.length === subWords.length && expWords.length > 1) {
    let match = true;
    for (let i = 0; i < expWords.length; i++) {
      const ew = expWords[i];
      const sw = subWords[i];
      if (ew !== sw) {
        // Check if one is a single-letter initial of the other
        const isInitial = (ew.length === 1 && sw.startsWith(ew)) || (sw.length === 1 && ew.startsWith(sw));
        if (!isInitial) {
          match = false;
          break;
        }
      }
    }
    if (match) return 100;
  }

  // 6. Levenshtein fallback score
  const distance = getLevenshteinDistance(normExpected, normSubmitted);
  const maxLength = Math.max(normExpected.length, normSubmitted.length);
  
  const score = Math.round((1 - distance / maxLength) * 100);
  return Math.max(0, Math.min(100, score));
}

export type SafetyClassification = "safe" | "risky" | "blocked" | "requires_admin_review";

interface BlockedKeywordItem {
  keyword: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
}

/**
 * Classifies custom question text based on keyword violations and pattern detections.
 */
export function classifyQuestion(
  text: string, 
  dbBlockedKeywords: BlockedKeywordItem[]
): { classification: SafetyClassification; reason?: string } {
  if (!text) return { classification: "blocked", reason: "Question content is empty" };
  const lowerText = text.toLowerCase();
  
  // 1. Evaluate Blocked Keywords (built-in + database overrides)
  const localBlocked: BlockedKeywordItem[] = [
    { keyword: "password", severity: "HIGH" },
    { keyword: "passcode", severity: "HIGH" },
    { keyword: "otp", severity: "HIGH" },
    { keyword: "pin", severity: "HIGH" },
    { keyword: "bvn", severity: "HIGH" },
    { keyword: "nin", severity: "HIGH" },
    { keyword: "cvv", severity: "HIGH" },
    { keyword: "card number", severity: "HIGH" },
    { keyword: "debit card", severity: "HIGH" },
    { keyword: "credit card", severity: "HIGH" },
    { keyword: "atm card", severity: "HIGH" },
    { keyword: "bank login", severity: "HIGH" },
    { keyword: "account number", severity: "HIGH" },
    { keyword: "email password", severity: "HIGH" },
    { keyword: "social media password", severity: "HIGH" },
    { keyword: "bank account login", severity: "HIGH" },
    { keyword: "security question", severity: "HIGH" },
    { keyword: "financial credential", severity: "HIGH" },
    { keyword: "government id", severity: "HIGH" },
    
    { keyword: "address", severity: "MEDIUM" },
    { keyword: "location", severity: "MEDIUM" },
    { keyword: "private picture", severity: "MEDIUM" },
    { keyword: "private photo", severity: "MEDIUM" },
    { keyword: "nude", severity: "HIGH" },
    { keyword: "account balance", severity: "MEDIUM" }
  ];

  // Merge list prioritizing database severities
  const allKeywords = [...dbBlockedKeywords];
  for (const local of localBlocked) {
    if (!allKeywords.some(k => k.keyword.toLowerCase() === local.keyword.toLowerCase())) {
      allKeywords.push(local);
    }
  }

  // Check matching keywords
  for (const kw of allKeywords) {
    if (lowerText.includes(kw.keyword.toLowerCase())) {
      const severity = kw.severity.toUpperCase();
      if (severity === "HIGH") {
        return { classification: "blocked", reason: `Contains blocked keyword: "${kw.keyword}"` };
      }
      if (severity === "MEDIUM") {
        return { classification: "requires_admin_review", reason: `Contains sensitive keyword: "${kw.keyword}"` };
      }
      if (severity === "LOW") {
        return { classification: "risky", reason: `Contains risky keyword: "${kw.keyword}"` };
      }
    }
  }
  
  // 2. Pattern Detections (phishing vectors)
  
  // Credit card check (13 to 19 digit number sequences)
  if (/\b\d{13,19}\b/.test(text)) {
    return { classification: "blocked", reason: "Prohibited ATMs/Card digits sequence detected" };
  }
  
  // 11 digit BVN/NIN check
  // (In Nigeria, BVN and NIN are exactly 11 digits)
  if (/\b\d{11}\b/.test(text)) {
    return { classification: "blocked", reason: "Prohibited 11-digit credential (BVN/NIN) pattern detected" };
  }

  // 4 to 6 digit OTP request check
  if (/\b\d{4,6}\b/.test(text)) {
    return { classification: "blocked", reason: "Prohibited numeric verification code (OTP/PIN) pattern detected" };
  }

  // 10 digit bank account number check
  if (/\b\d{10}\b/.test(text)) {
    return { classification: "requires_admin_review", reason: "Potential 10-digit bank account number detected" };
  }

  // Full phone number check (10 or 11 digits starting with phone prefixes)
  // Let's capture general 10/11 digit sequences
  if (/\b\d{10,11}\b/.test(text)) {
    return { classification: "blocked", reason: "Prohibited full phone number sequence detected" };
  }

  return { classification: "safe" };
}

/**
 * Backward compatible wrapper for validateQuestionSafety.
 */
export function validateQuestionSafety(text: string, dbBlockedKeywords: string[]): { safe: boolean; reason?: string } {
  const keywordItems = dbBlockedKeywords.map(k => ({ keyword: k, severity: "HIGH" }));
  const result = classifyQuestion(text, keywordItems);
  return {
    safe: result.classification === "safe",
    reason: result.reason
  };
}

/**
 * Validates and normalizes Nigerian phone numbers to +234 format.
 * Returns null if invalid, or normalized string if valid.
 */
export function validateAndNormalizeNigerianPhone(phone: string): string | null {
  if (!phone) return null;
  
  const match = phone.trim().replace(/\s+/g, "").match(/^(?:\+?234|0)?([789][01]\d{8})$/);
  
  if (match && match[1]) {
    return `+234${match[1]}`;
  }
  
  return null;
}
