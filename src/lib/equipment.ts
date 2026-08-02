export type ItemType = "weapon" | "armor" | "accessory";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export interface EquipmentItem {
  item_id: string;
  item_name: string;
  type: ItemType;
  rarity: ItemRarity;
  bonus_str: number;
  bonus_agi: number;
  bonus_vit: number;
  bonus_luk: number;
  bonus_hp: number;
  granted_skill_name?: string;
  granted_skill_icon?: string;
  icon: string;
  image_url: string;
  description: string;
}

export interface InventoryRecord {
  inventory_id: string;
  user_id: string;
  item_id: string;
  is_equipped: boolean;
  item: EquipmentItem;
}

export const EQUIPMENT_DICTIONARY: EquipmentItem[] = [
  {
    item_id: "e1010001-0000-0000-0000-000000000001",
    item_name: "Rusty Iron Broadsword",
    type: "weapon",
    rarity: "common",
    bonus_str: 10,
    bonus_agi: 0,
    bonus_vit: 5,
    bonus_luk: 0,
    bonus_hp: 50,
    granted_skill_name: "Iron Slash",
    icon: "sword",
    image_url: "/assets/items/weapons/rusty-sword.png",
    description: "A heavy, battered blade forged from simple iron.",
  },
  {
    item_id: "e1010002-0000-0000-0000-000000000002",
    item_name: "Novice Defender Shield",
    type: "armor",
    rarity: "common",
    bonus_str: 0,
    bonus_agi: 5,
    bonus_vit: 15,
    bonus_luk: 2,
    bonus_hp: 120,
    icon: "shield",
    image_url: "/assets/items/shields/wooden-shield.png",
    description: "Basic wooden shield providing fundamental physical blocking.",
  },
  {
    item_id: "e1010003-0000-0000-0000-000000000003",
    item_name: "Copper Amulet",
    type: "accessory",
    rarity: "common",
    bonus_str: 2,
    bonus_agi: 2,
    bonus_vit: 2,
    bonus_luk: 5,
    bonus_hp: 30,
    icon: "heart",
    image_url: "/assets/items/amulets/copper-amulet.png",
    description: "A tarnished copper charm said to grant minor luck.",
  },
  {
    item_id: "e1020001-0000-0000-0000-000000000004",
    item_name: "Shadow Steel Katana",
    type: "weapon",
    rarity: "rare",
    bonus_str: 28,
    bonus_agi: 22,
    bonus_vit: 5,
    bonus_luk: 10,
    bonus_hp: 180,
    granted_skill_name: "Shadow Strike",
    icon: "sword",
    image_url: "/assets/items/weapons/shadow-katana.png",
    description: "Razor-sharp blade infused with dark steel.",
  },
  {
    item_id: "e1020002-0000-0000-0000-000000000005",
    item_name: "Guardian Heavy Shield",
    type: "armor",
    rarity: "rare",
    bonus_str: 8,
    bonus_agi: 0,
    bonus_vit: 40,
    bonus_luk: 5,
    bonus_hp: 350,
    granted_skill_name: "Iron Fortress",
    icon: "shield",
    image_url: "/assets/items/shields/guardian-shield.png",
    description: "Reinforced iron shield forged for Vanguard defenders.",
  },
  {
    item_id: "e1020003-0000-0000-0000-000000000006",
    item_name: "Ring of Swiftness",
    type: "accessory",
    rarity: "rare",
    bonus_str: 0,
    bonus_agi: 35,
    bonus_vit: 10,
    bonus_luk: 15,
    bonus_hp: 150,
    icon: "zap",
    image_url: "/assets/items/amulets/swiftness-ring.png",
    description: "Lightweight silver ring that accelerates reflexes.",
  },
  {
    item_id: "e1030001-0000-0000-0000-000000000007",
    item_name: "Plasma Greatsword EX",
    type: "weapon",
    rarity: "epic",
    bonus_str: 60,
    bonus_agi: 30,
    bonus_vit: 35,
    bonus_luk: 25,
    bonus_hp: 500,
    granted_skill_name: "Plasma Overload",
    icon: "zap",
    image_url: "/assets/items/weapons/plasma-greatsword.png",
    description: "Futuristic blade glowing with supercharged plasma energy.",
  },
  {
    item_id: "e1030002-0000-0000-0000-000000000008",
    item_name: "Titanium Cyber Shield",
    type: "armor",
    rarity: "epic",
    bonus_str: 25,
    bonus_agi: 15,
    bonus_vit: 75,
    bonus_luk: 20,
    bonus_hp: 750,
    granted_skill_name: "Nanite Shield",
    icon: "shield",
    image_url: "/assets/items/shields/cyber-aegis.png",
    description: "Futuristic titanium barrier with self-repair nanite drones.",
  },
  {
    item_id: "e1030003-0000-0000-0000-000000000011",
    item_name: "Aether Celestial Talisman",
    type: "accessory",
    rarity: "epic",
    bonus_str: 30,
    bonus_agi: 45,
    bonus_vit: 30,
    bonus_luk: 40,
    bonus_hp: 400,
    icon: "sparkles",
    image_url: "/assets/items/amulets/aether-talisman.png",
    description: "Mystical amulet humming with celestial energy.",
  },
  {
    item_id: "e1040001-0000-0000-0000-000000000009",
    item_name: "Void Relic Slayer",
    type: "weapon",
    rarity: "legendary",
    bonus_str: 125,
    bonus_agi: 75,
    bonus_vit: 60,
    bonus_luk: 60,
    bonus_hp: 1200,
    granted_skill_name: "Void Nova Buster",
    icon: "flame",
    image_url: "/assets/items/weapons/void-slayer.png",
    description: "Mythical blade forged in the abyss, capable of tearing reality.",
  },
  {
    item_id: "e1040002-0000-0000-0000-000000000010",
    item_name: "Dragon Scale Greatshield",
    type: "armor",
    rarity: "legendary",
    bonus_str: 50,
    bonus_agi: 35,
    bonus_vit: 140,
    bonus_luk: 45,
    bonus_hp: 1800,
    granted_skill_name: "Dragon Roar",
    icon: "shield",
    image_url: "/assets/items/shields/dragon-scale.png",
    description: "Impenetrable shield crafted from ancient dragon scales.",
  },
  {
    item_id: "e1040003-0000-0000-0000-000000000012",
    item_name: "Void Star Pendant",
    type: "accessory",
    rarity: "legendary",
    bonus_str: 60,
    bonus_agi: 80,
    bonus_vit: 60,
    bonus_luk: 90,
    bonus_hp: 800,
    icon: "sparkles",
    image_url: "/assets/items/amulets/void-pendant.png",
    description: "An ancient artifact containing the power of a collapsed star.",
  },
];
