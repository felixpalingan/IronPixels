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
    description: "A heavy, battered blade forged from simple iron.",
  },
  {
    item_id: "e1010002-0000-0000-0000-000000000002",
    item_name: "Novice Leather Tunic",
    type: "armor",
    rarity: "common",
    bonus_str: 0,
    bonus_agi: 5,
    bonus_vit: 10,
    bonus_luk: 2,
    bonus_hp: 100,
    icon: "shield",
    description: "Basic leather chest piece providing minimal protection.",
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
    description: "A tarnished copper charm said to grant minor luck.",
  },
  {
    item_id: "e1020001-0000-0000-0000-000000000004",
    item_name: "Shadow Steel Katana",
    type: "weapon",
    rarity: "rare",
    bonus_str: 25,
    bonus_agi: 20,
    bonus_vit: 5,
    bonus_luk: 10,
    bonus_hp: 150,
    granted_skill_name: "Shadow Strike",
    icon: "sword",
    description: "Razor-sharp blade infused with dark steel.",
  },
  {
    item_id: "e1020002-0000-0000-0000-000000000005",
    item_name: "Guardian Chainmail",
    type: "armor",
    rarity: "rare",
    bonus_str: 5,
    bonus_agi: 0,
    bonus_vit: 35,
    bonus_luk: 5,
    bonus_hp: 300,
    granted_skill_name: "Iron Fortress",
    icon: "shield",
    description: "Interlocking steel rings forged for Vanguard defenders.",
  },
  {
    item_id: "e1020003-0000-0000-0000-000000000006",
    item_name: "Ring of Swiftness",
    type: "accessory",
    rarity: "rare",
    bonus_str: 0,
    bonus_agi: 30,
    bonus_vit: 10,
    bonus_luk: 15,
    bonus_hp: 120,
    icon: "zap",
    description: "Lightweight silver ring that accelerates reflexes.",
  },
  {
    item_id: "e1030001-0000-0000-0000-000000000007",
    item_name: "Plasma Greatsword EX",
    type: "weapon",
    rarity: "epic",
    bonus_str: 55,
    bonus_agi: 25,
    bonus_vit: 30,
    bonus_luk: 20,
    bonus_hp: 450,
    granted_skill_name: "Plasma Overload",
    icon: "zap",
    description: "Futuristic blade glowing with supercharged plasma energy.",
  },
  {
    item_id: "e1030002-0000-0000-0000-000000000008",
    item_name: "Titanium Cyber Aegis",
    type: "armor",
    rarity: "epic",
    bonus_str: 20,
    bonus_agi: 10,
    bonus_vit: 60,
    bonus_luk: 15,
    bonus_hp: 650,
    granted_skill_name: "Nanite Shield",
    icon: "shield",
    description: "Reinforced titanium plate armor with self-repair nanites.",
  },
  {
    item_id: "e1040001-0000-0000-0000-000000000009",
    item_name: "Void Relic Slayer",
    type: "weapon",
    rarity: "legendary",
    bonus_str: 110,
    bonus_agi: 65,
    bonus_vit: 50,
    bonus_luk: 50,
    bonus_hp: 1000,
    granted_skill_name: "Void Nova Buster",
    icon: "flame",
    description: "Mythical blade forged in the abyss, capable of tearing reality.",
  },
  {
    item_id: "e1040002-0000-0000-0000-000000000010",
    item_name: "Dragon Scale Cuirass",
    type: "armor",
    rarity: "legendary",
    bonus_str: 45,
    bonus_agi: 30,
    bonus_vit: 120,
    bonus_luk: 40,
    bonus_hp: 1500,
    granted_skill_name: "Dragon Roar",
    icon: "shield",
    description: "Impenetrable armor crafted from ancient dragon scales.",
  },
];
