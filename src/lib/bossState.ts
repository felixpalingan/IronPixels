export type EnemyCategory = "mob" | "boss";

export interface EnemyConfig {
  spriteKey: string;
  displayName: string;
  animPrefix: string;
  hasRunAnim: boolean;
  isBig: boolean;
}

export const MOB_POOL: EnemyConfig[] = [
  { spriteKey: "goblin", displayName: "Goblin", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "imp", displayName: "Imp", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "skelet", displayName: "Skeleton", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "tiny_zombie", displayName: "Tiny Zombie", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "muddy", displayName: "Muddy", animPrefix: "anim", hasRunAnim: false, isBig: false },
  { spriteKey: "swampy", displayName: "Swampy", animPrefix: "anim", hasRunAnim: false, isBig: false },
  { spriteKey: "slug", displayName: "Slug", animPrefix: "anim", hasRunAnim: false, isBig: false },
  { spriteKey: "masked_orc", displayName: "Masked Orc", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "orc_warrior", displayName: "Orc Warrior", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "wogol", displayName: "Wogol", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "chort", displayName: "Chort", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "ice_zombie", displayName: "Ice Zombie", animPrefix: "anim", hasRunAnim: false, isBig: false },
  { spriteKey: "necromancer", displayName: "Necromancer", animPrefix: "anim", hasRunAnim: false, isBig: false },
  { spriteKey: "pumpkin_dude", displayName: "Pumpkin Dude", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
  { spriteKey: "orc_shaman", displayName: "Orc Shaman", animPrefix: "idle_anim", hasRunAnim: true, isBig: false },
];

export const BOSS_POOL: EnemyConfig[] = [
  { spriteKey: "big_demon", displayName: "Demon Lord", animPrefix: "idle_anim", hasRunAnim: true, isBig: true },
  { spriteKey: "big_zombie", displayName: "Undead Giant", animPrefix: "idle_anim", hasRunAnim: true, isBig: true },
  { spriteKey: "ogre", displayName: "Ogre King", animPrefix: "idle_anim", hasRunAnim: true, isBig: true },
];

export interface FloorEnemy {
  enemy_id: string;
  floor: number;
  display_name: string;
  current_hp: number;
  max_hp: number;
  status: "Active" | "Defeated";
  category: EnemyCategory;
  sprite_config: EnemyConfig;
  reward_gold: number;
  reward_exp: number;
  mode: "solo" | "party";
}

function seededRandom(seed: number): number {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const DUNGEON_STAGES_CATALOG: Record<
  number,
  { name: string; category: EnemyCategory; config: EnemyConfig; hp: number; gold: number; exp: number }
> = {
  1: { name: "Stage 1: Imp", category: "mob", config: { spriteKey: "imp", displayName: "Imp", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 1500, gold: 120, exp: 60 },
  2: { name: "Stage 2: Swampy", category: "mob", config: { spriteKey: "swampy", displayName: "Swampy", animPrefix: "anim", hasRunAnim: false, isBig: false }, hp: 2200, gold: 140, exp: 70 },
  3: { name: "Stage 3: Goblin", category: "mob", config: { spriteKey: "goblin", displayName: "Goblin", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 3200, gold: 170, exp: 85 },
  4: { name: "Stage 4: Skeleton", category: "mob", config: { spriteKey: "skelet", displayName: "Skeleton", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 4500, gold: 200, exp: 100 },
  5: { name: "Stage 5: [BOSS] Ogre King", category: "boss", config: { spriteKey: "ogre", displayName: "Ogre King", animPrefix: "idle_anim", hasRunAnim: true, isBig: true }, hp: 12000, gold: 750, exp: 400 },
  6: { name: "Stage 6: Masked Orc", category: "mob", config: { spriteKey: "masked_orc", displayName: "Masked Orc", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 6500, gold: 250, exp: 125 },
  7: { name: "Stage 7: Poison Slug", category: "mob", config: { spriteKey: "slug", displayName: "Poison Slug", animPrefix: "anim", hasRunAnim: false, isBig: false }, hp: 8500, gold: 290, exp: 145 },
  8: { name: "Stage 8: Tiny Zombie", category: "mob", config: { spriteKey: "tiny_zombie", displayName: "Tiny Zombie", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 11000, gold: 340, exp: 170 },
  9: { name: "Stage 9: Muddy", category: "mob", config: { spriteKey: "muddy", displayName: "Muddy", animPrefix: "anim", hasRunAnim: false, isBig: false }, hp: 14500, gold: 400, exp: 200 },
  10: { name: "Stage 10: [BOSS] Undead Giant", category: "boss", config: { spriteKey: "big_zombie", displayName: "Undead Giant", animPrefix: "idle_anim", hasRunAnim: true, isBig: true }, hp: 30000, gold: 1200, exp: 700 },
  11: { name: "Stage 11: Dark Necromancer", category: "mob", config: { spriteKey: "necromancer", displayName: "Dark Necromancer", animPrefix: "anim", hasRunAnim: false, isBig: false }, hp: 18000, gold: 480, exp: 240 },
  12: { name: "Stage 12: Pumpkin Dude", category: "mob", config: { spriteKey: "pumpkin_dude", displayName: "Pumpkin Dude", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 22000, gold: 560, exp: 280 },
  13: { name: "Stage 13: Orc Warrior", category: "mob", config: { spriteKey: "orc_warrior", displayName: "Orc Warrior", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 27000, gold: 650, exp: 325 },
  14: { name: "Stage 14: Wogol", category: "mob", config: { spriteKey: "wogol", displayName: "Wogol", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 33000, gold: 750, exp: 375 },
  15: { name: "Stage 15: [BOSS] Demon Lord", category: "boss", config: { spriteKey: "big_demon", displayName: "Demon Lord", animPrefix: "idle_anim", hasRunAnim: true, isBig: true }, hp: 65000, gold: 2200, exp: 1200 },
  16: { name: "Stage 16: Chort Fiend", category: "mob", config: { spriteKey: "chort", displayName: "Chort Fiend", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 40000, gold: 880, exp: 440 },
  17: { name: "Stage 17: Ice Zombie", category: "mob", config: { spriteKey: "ice_zombie", displayName: "Ice Zombie", animPrefix: "anim", hasRunAnim: false, isBig: false }, hp: 48000, gold: 1000, exp: 500 },
  18: { name: "Stage 18: Orc Shaman", category: "mob", config: { spriteKey: "orc_shaman", displayName: "Orc Shaman", animPrefix: "idle_anim", hasRunAnim: true, isBig: false }, hp: 58000, gold: 1150, exp: 575 },
  19: { name: "Stage 19: Shadow Lich", category: "mob", config: { spriteKey: "necromancer", displayName: "Shadow Lich", animPrefix: "anim", hasRunAnim: false, isBig: false }, hp: 70000, gold: 1300, exp: 650 },
  20: { name: "Stage 20: [BOSS] Abyssal Overlord", category: "boss", config: { spriteKey: "big_demon", displayName: "Abyssal Overlord", animPrefix: "idle_anim", hasRunAnim: true, isBig: true }, hp: 125000, gold: 3500, exp: 2000 },
};

export function getEnemyForFloor(floor: number): { config: EnemyConfig; category: EnemyCategory } {
  if (DUNGEON_STAGES_CATALOG[floor]) {
    return {
      config: DUNGEON_STAGES_CATALOG[floor].config,
      category: DUNGEON_STAGES_CATALOG[floor].category,
    };
  }

  const isBossFloor = floor % 5 === 0;
  if (isBossFloor) {
    const bossIdx = Math.floor(seededRandom(floor) * BOSS_POOL.length);
    return { config: BOSS_POOL[bossIdx], category: "boss" };
  } else {
    const mobIdx = Math.floor(seededRandom(floor) * MOB_POOL.length);
    return { config: MOB_POOL[mobIdx], category: "mob" };
  }
}

export function getHpForFloor(floor: number, category: EnemyCategory, mode: "solo" | "party" = "solo"): number {
  let baseHp: number;
  if (floor <= 20 && DUNGEON_STAGES_CATALOG[floor]) {
    baseHp = DUNGEON_STAGES_CATALOG[floor].hp;
  } else {
    // Proportional Infinite scaling starting from floor 20 base (70,000 HP mob / 125,000 HP boss)
    // Smooth +10% per floor for mobs, and 2.5x multiplier for bosses
    const baseMobHp = Math.round(70000 * Math.pow(1.10, floor - 20));
    baseHp = category === "boss" ? Math.round(baseMobHp * 2.5) : baseMobHp;
  }

  if (mode === "party") {
    baseHp = baseHp * 2;
  }
  return baseHp;
}

export function getRewardsForFloor(floor: number, category: EnemyCategory, mode: "solo" | "party" = "solo"): { gold: number; exp: number } {
  const mult = mode === "party" ? 2.5 : 1.0;
  let baseGold: number;
  let baseExp: number;

  if (floor <= 20 && DUNGEON_STAGES_CATALOG[floor]) {
    baseGold = DUNGEON_STAGES_CATALOG[floor].gold;
    baseExp = DUNGEON_STAGES_CATALOG[floor].exp;
  } else {
    // Proportional Infinite rewards starting from floor 20 base (+8% per floor)
    const mobGold = Math.round(1300 * Math.pow(1.08, floor - 20));
    const mobExp = Math.round(650 * Math.pow(1.08, floor - 20));

    baseGold = category === "boss" ? Math.round(mobGold * 2.7) : mobGold;
    baseExp = category === "boss" ? Math.round(mobExp * 2.7) : mobExp;
  }

  return {
    gold: Math.round(baseGold * mult),
    exp: Math.round(baseExp * mult),
  };
}

export function buildFloorEnemy(floor: number, mode: "solo" | "party" = "solo"): FloorEnemy {
  const { config, category } = getEnemyForFloor(floor);
  const hp = getHpForFloor(floor, category, mode);
  const rewards = getRewardsForFloor(floor, category, mode);
  const suffix = category === "boss" ? "BOSS" : "MOB";

  const displayName = floor <= 20 && DUNGEON_STAGES_CATALOG[floor]
    ? DUNGEON_STAGES_CATALOG[floor].name
    : category === "boss"
      ? `Floor ${floor}: [BOSS] ${config.displayName}`
      : `Floor ${floor}: ${config.displayName}`;

  return {
    enemy_id: `${mode}-floor-${floor}-${suffix}-${Date.now()}`,
    floor,
    display_name: displayName,
    current_hp: hp,
    max_hp: hp,
    status: "Active",
    category,
    sprite_config: config,
    reward_gold: rewards.gold,
    reward_exp: rewards.exp,
    mode,
  };
}

let soloEnemyState: FloorEnemy = buildFloorEnemy(1, "solo");
let partyEnemyState: FloorEnemy = buildFloorEnemy(1, "party");

export function getFloorState(mode: "solo" | "party" = "solo"): FloorEnemy {
  return mode === "party" ? partyEnemyState : soloEnemyState;
}

export function setFloorState(enemy: FloorEnemy, mode: "solo" | "party" = "solo") {
  if (mode === "party") {
    partyEnemyState = enemy;
  } else {
    soloEnemyState = enemy;
  }
}

export function attackEnemy(rvsDamage: number, mode: "solo" | "party" = "solo"): {
  enemy: FloorEnemy;
  is_defeated: boolean;
  damage_dealt: number;
  next_enemy: FloorEnemy | null;
} {
  const targetState = mode === "party" ? partyEnemyState : soloEnemyState;
  const damage = Math.round(rvsDamage);
  const newHp = Math.max(0, targetState.current_hp - damage);
  const isDefeated = newHp === 0;

  targetState.current_hp = newHp;

  let nextEnemy: FloorEnemy | null = null;

  if (isDefeated) {
    targetState.status = "Defeated";
    const nextFloor = targetState.floor + 1;
    nextEnemy = buildFloorEnemy(nextFloor, mode);
    if (mode === "party") {
      partyEnemyState = nextEnemy;
    } else {
      soloEnemyState = nextEnemy;
    }
  }

  return {
    enemy: targetState,
    is_defeated: isDefeated,
    damage_dealt: damage,
    next_enemy: nextEnemy,
  };
}

export function getBossState(mode: "solo" | "party" = "solo", targetFloor?: number) {
  let e = getFloorState(mode);
  if (targetFloor && targetFloor > e.floor) {
    e = buildFloorEnemy(targetFloor, mode);
    setFloorState(e, mode);
  }
  return {
    boss_id: e.enemy_id,
    boss_name: e.display_name,
    stage: e.floor,
    current_hp: e.current_hp,
    max_hp: e.max_hp,
    status: e.status,
    boss_type: e.sprite_config.spriteKey as any,
    category: e.category,
    sprite_config: e.sprite_config,
    mode: e.mode,
  };
}

export function updateBossHp(rvsDamage: number, mode: "solo" | "party" = "solo") {
  const result = attackEnemy(rvsDamage, mode);
  const next = result.next_enemy || result.enemy;
  return {
    boss: {
      boss_id: result.enemy.enemy_id,
      boss_name: result.enemy.display_name,
      stage: result.enemy.floor,
      current_hp: result.enemy.current_hp,
      max_hp: result.enemy.max_hp,
      status: result.enemy.status,
      boss_type: result.enemy.sprite_config.spriteKey as any,
      category: result.enemy.category,
      sprite_config: result.enemy.sprite_config,
      mode: result.enemy.mode,
    },
    is_defeated: result.is_defeated,
    damage_dealt: result.damage_dealt,
    next_boss: {
      boss_id: next.enemy_id,
      boss_name: next.display_name,
      stage: next.floor,
      current_hp: next.current_hp,
      max_hp: next.max_hp,
      status: next.status,
      boss_type: next.sprite_config.spriteKey as any,
      category: next.category,
      sprite_config: next.sprite_config,
      mode: next.mode,
    },
  };
}
