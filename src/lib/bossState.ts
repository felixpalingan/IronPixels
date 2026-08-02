export interface BossInfo {
  boss_id: string;
  boss_name: string;
  stage: number;
  current_hp: number;
  max_hp: number;
  status: "Active" | "Defeated";
}

export const STAGE_BOSSES: Array<{ name: string; hp: number }> = [
  { name: "Demon Lord Ignis", hp: 50000 },
  { name: "Abyssal Void Dragon", hp: 150000 },
  { name: "Cyber Mecha Omega", hp: 350000 },
  { name: "Shadow Behemoth Apex", hp: 750000 },
];

let currentBossInstance: BossInfo = {
  boss_id: "b055d7ac-1234-4567-89ab-cdef01234567",
  boss_name: STAGE_BOSSES[0].name,
  stage: 1,
  current_hp: STAGE_BOSSES[0].hp,
  max_hp: STAGE_BOSSES[0].hp,
  status: "Active",
};

export function getBossState(): BossInfo {
  return currentBossInstance;
}

export function updateBossHp(rvsDamage: number): {
  boss: BossInfo;
  is_defeated: boolean;
  damage_dealt: number;
} {
  const damage = Math.round(rvsDamage);
  const newHp = Math.max(0, currentBossInstance.current_hp - damage);
  const isDefeated = newHp === 0;

  currentBossInstance.current_hp = newHp;

  if (isDefeated) {
    currentBossInstance.status = "Defeated";

    setTimeout(() => {
      const nextStage = currentBossInstance.stage + 1;
      const bossConfig = STAGE_BOSSES[(nextStage - 1) % STAGE_BOSSES.length];

      currentBossInstance = {
        boss_id: `boss-stage-${nextStage}-${Date.now()}`,
        boss_name: bossConfig.name,
        stage: nextStage,
        current_hp: bossConfig.hp,
        max_hp: bossConfig.hp,
        status: "Active",
      };
    }, 3000);
  }

  return {
    boss: currentBossInstance,
    is_defeated: isDefeated,
    damage_dealt: damage,
  };
}
