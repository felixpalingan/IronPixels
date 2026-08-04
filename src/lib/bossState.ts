export interface BossInfo {
  boss_id: string;
  boss_name: string;
  stage: number;
  current_hp: number;
  max_hp: number;
  status: "Active" | "Defeated";
  boss_type: "orc" | "blood" | "demon" | "dragon" | "mecha" | "lich";
  description?: string;
  reward_gold?: number;
  reward_exp?: number;
}

export const STAGE_BOSSES: Array<{
  name: string;
  hp: number;
  type: BossInfo["boss_type"];
  description: string;
  reward_gold: number;
  reward_exp: number;
}> = [
  { name: "Stage 1: Goblin Berserker King", hp: 15000, type: "orc", description: "Wild chieftain of the green-skin horde.", reward_gold: 500, reward_exp: 250 },
  { name: "Stage 2: Orc Warlord Grok", hp: 35000, type: "orc", description: "Ruthless commander wielding an iron greataxe.", reward_gold: 1200, reward_exp: 600 },
  { name: "Stage 3: Minotaur Ironhide", hp: 65000, type: "blood", description: "Towering bull-beast charging through stone walls.", reward_gold: 2500, reward_exp: 1200 },
  { name: "Stage 4: Blood Beast Crimson", hp: 100000, type: "blood", description: "Fiendish predator fueled by raw crimson essence.", reward_gold: 4500, reward_exp: 2200 },
  { name: "Stage 5: Frost Giant Ymir", hp: 150000, type: "demon", description: "Ancient colossus shrouded in glacial frost.", reward_gold: 7500, reward_exp: 3500 },
  { name: "Stage 6: Demon Lord Ignis", hp: 220000, type: "demon", description: "Master of dark hellfire burning everything in sight.", reward_gold: 12000, reward_exp: 5500 },
  { name: "Stage 7: Shadow Assassin Vesper", hp: 300000, type: "lich", description: "Lethal blade wielder lurking in abyssal mist.", reward_gold: 18000, reward_exp: 8000 },
  { name: "Stage 8: Abyssal Void Dragon", hp: 400000, type: "dragon", description: "Ancient dragon radiating void energy and breath.", reward_gold: 25000, reward_exp: 12000 },
  { name: "Stage 9: Undead Lich King Malakor", hp: 550000, type: "lich", description: "Ruler of the damned commanding spectral armies.", reward_gold: 35000, reward_exp: 16000 },
  { name: "Stage 10: Cyber Mecha Omega", hp: 750000, type: "mecha", description: "Supreme war automaton equipped with photon lasers.", reward_gold: 50000, reward_exp: 22000 },
  { name: "Stage 11: Celestial Archangel Michael", hp: 1000000, type: "demon", description: "Holy warrior executing divine judgment.", reward_gold: 75000, reward_exp: 30000 },
  { name: "Stage 12: Titan Earthbreaker Atlas", hp: 1300000, type: "orc", description: "Gigantic earth titan smashing mountains into dust.", reward_gold: 100000, reward_exp: 40000 },
  { name: "Stage 13: Deep Sea Leviathan", hp: 1700000, type: "dragon", description: "Mythical abyssal sea dragon of tsunami force.", reward_gold: 135000, reward_exp: 55000 },
  { name: "Stage 14: Infernal Balrog Surtur", hp: 2200000, type: "demon", description: "Fiery demon of Ragnarok wielding a lava whip.", reward_gold: 180000, reward_exp: 75000 },
  { name: "Stage 15: Phantom Empress Nyx", hp: 2800000, type: "lich", description: "Sovereign of dark night manipulating twilight magic.", reward_gold: 240000, reward_exp: 100000 },
  { name: "Stage 16: Dread Necromancer Mortis", hp: 3500000, type: "lich", description: "Warlock raising relentless hordes of bone warriors.", reward_gold: 320000, reward_exp: 130000 },
  { name: "Stage 17: Cybernetic Overlord Zero", hp: 4500000, type: "mecha", description: "Sentient AI superintelligence harnessing orbital cannons.", reward_gold: 420000, reward_exp: 170000 },
  { name: "Stage 18: Behemoth Colossus Golgoth", hp: 6000000, type: "orc", description: "Primordial behemoth whose footsteps cause earthquakes.", reward_gold: 550000, reward_exp: 220000 },
  { name: "Stage 19: Cosmic Destroyer Nemesis", hp: 8000000, type: "dragon", description: "Cosmic entity consuming stellar systems.", reward_gold: 750000, reward_exp: 300000 },
  { name: "Stage 20: IronPixels World Boss Ragnarok", hp: 12000000, type: "demon", description: "Ultimate apocalyptic ruler of the pixel realm.", reward_gold: 1000000, reward_exp: 500000 },
];

let currentBossInstance: BossInfo = {
  boss_id: "boss-stage-1-init",
  boss_name: STAGE_BOSSES[0].name,
  stage: 1,
  current_hp: STAGE_BOSSES[0].hp,
  max_hp: STAGE_BOSSES[0].hp,
  status: "Active",
  boss_type: STAGE_BOSSES[0].type,
  description: STAGE_BOSSES[0].description,
  reward_gold: STAGE_BOSSES[0].reward_gold,
  reward_exp: STAGE_BOSSES[0].reward_exp,
};

export function getBossState(): BossInfo {
  return currentBossInstance;
}

export function updateBossHp(rvsDamage: number): {
  boss: BossInfo;
  is_defeated: boolean;
  damage_dealt: number;
  next_boss: BossInfo;
} {
  const damage = Math.round(rvsDamage);
  const newHp = Math.max(0, currentBossInstance.current_hp - damage);
  const isDefeated = newHp === 0;

  currentBossInstance.current_hp = newHp;

  let nextBossInstance = { ...currentBossInstance };

  if (isDefeated) {
    currentBossInstance.status = "Defeated";

    const nextStage = currentBossInstance.stage + 1;
    const bossConfig = STAGE_BOSSES[(nextStage - 1) % STAGE_BOSSES.length];

    nextBossInstance = {
      boss_id: `boss-stage-${nextStage}-${Date.now()}`,
      boss_name: bossConfig.name,
      stage: nextStage,
      current_hp: bossConfig.hp,
      max_hp: bossConfig.hp,
      status: "Active",
      boss_type: bossConfig.type,
      description: bossConfig.description,
      reward_gold: bossConfig.reward_gold,
      reward_exp: bossConfig.reward_exp,
    };

    currentBossInstance = nextBossInstance;
  }

  return {
    boss: currentBossInstance,
    is_defeated: isDefeated,
    damage_dealt: damage,
    next_boss: nextBossInstance,
  };
}
