const inMemorySkillCooldowns: Record<string, number> = {};

export function setSkillCooldown(userId: string, skillId: string, cooldownMinutes: number) {
  const cdUntil = Date.now() + cooldownMinutes * 60 * 1000;
  inMemorySkillCooldowns[`${userId}_${skillId}`] = cdUntil;
}

export function getSkillRemainingSeconds(userId: string, skillId: string): number {
  const cdUntil = inMemorySkillCooldowns[`${userId}_${skillId}`];
  if (!cdUntil) return 0;
  const remainingMs = cdUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}
