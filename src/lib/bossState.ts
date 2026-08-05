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

export function getEnemyForFloor(floor: number): { config: EnemyConfig; category: EnemyCategory } {
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
  let baseHp = category === "boss"
    ? Math.round(5000 * Math.pow(1.35, floor / 5))
    : Math.round(1000 * Math.pow(1.2, floor));

  if (mode === "party") {
    baseHp = baseHp * 2;
  }
  return baseHp;
}

export function getRewardsForFloor(floor: number, category: EnemyCategory, mode: "solo" | "party" = "solo"): { gold: number; exp: number } {
  const mult = mode === "party" ? 2.5 : 1.0;
  if (category === "boss") {
    return {
      gold: Math.round(500 * Math.pow(1.3, floor / 5) * mult),
      exp: Math.round(250 * Math.pow(1.3, floor / 5) * mult),
    };
  }
  return {
    gold: Math.round(100 * Math.pow(1.15, floor) * mult),
    exp: Math.round(50 * Math.pow(1.15, floor) * mult),
  };
}

export function buildFloorEnemy(floor: number, mode: "solo" | "party" = "solo"): FloorEnemy {
  const { config, category } = getEnemyForFloor(floor);
  const hp = getHpForFloor(floor, category, mode);
  const rewards = getRewardsForFloor(floor, category, mode);
  const suffix = category === "boss" ? "BOSS" : "MOB";

  return {
    enemy_id: `${mode}-floor-${floor}-${suffix}-${Date.now()}`,
    floor,
    display_name: config.displayName,
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
