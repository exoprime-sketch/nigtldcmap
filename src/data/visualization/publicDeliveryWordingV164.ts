/**
 * V164-3: the spec's notes describe the data in the project's procurement words
 * ("4차 납품분은 …", "이번 납품에서 값이 제거됐다", "납품된 지표는"). A reader
 * of the public page has no delivery to refer to, so the same sentence reads
 * with "수록 자료" - what the platform holds. Only these words change; the
 * facts in the sentence stay as written.
 */

/** "납품분" ends in a consonant, "자료" in a vowel: the particle after it follows. */
const PARTICLE_AFTER_VOWEL_V164: Record<string, string> = { 은: "는", 이: "가", 을: "를", 과: "와", 으로: "로" };

function afterVowel(particle: string | undefined): string {
  if (!particle) return "";
  return PARTICLE_AFTER_VOWEL_V164[particle] ?? particle;
}

export function publicDeliveryWordingV164(text: string | null | undefined): string {
  const value = String(text ?? "");
  if (!value.includes("납품")) return value;
  return value
    .replace(/\d+\s*차\s*납품분(으로|은|이|을|과|에서|에|의)?/gu, (_match, particle?: string) => `이번 수록 자료${afterVowel(particle)}`)
    .replace(/이번\s*납품물(으로|은|이|을|과|에서|에|의)?/gu, (_match, particle?: string) => `이번 수록 자료${afterVowel(particle)}`)
    .replace(/이번\s*납품(에서|에|의|으로)/gu, (_match, particle: string) => `이번 수록 자료${afterVowel(particle)}`)
    .replace(/납품\s*(\d+)\s*개국분/gu, "수록된 $1개국분")
    .replace(/납품된/gu, "수록된")
    .replace(/납품되지/gu, "수록되지")
    .replace(/납품물(으로|은|이|을|과|에서|에|의)?/gu, (_match, particle?: string) => `수록 자료${afterVowel(particle)}`)
    .replace(/납품분(으로|은|이|을|과|에서|에|의)?/gu, (_match, particle?: string) => `수록 자료${afterVowel(particle)}`);
}
