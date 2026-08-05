"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Swords, Zap, Gift, X, Skull, Crown, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { TacticalSkillBar } from "@/components/TacticalSkillBar";
import { EnemySprite } from "@/components/EnemySprite";
import { HeroSprite, HeroState } from "@/components/HeroSprite";
import { DungeonStageMap } from "@/components/DungeonStageMap";
import { EQUIPMENT_DICTIONARY, EquipmentItem, InventoryRecord } from "@/lib/equipment";
import { createClient } from "@/lib/supabase/client";
import type { EnemySpriteState } from "@/components/EnemySprite";

interface DamageParticle {
  id: string;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  color: string;
  isCritical: boolean;
}

interface EnemyData {
  enemy_id: string;
  display_name: string;
  floor: number;
  current_hp: number;
  max_hp: number;
  status: string;
  category: "mob" | "boss";
  mode: "solo" | "party";
  sprite_config: {
    spriteKey: string;
    displayName: string;
    animPrefix: string;
    hasRunAnim: boolean;
    isBig: boolean;
  };
}

interface CombatArenaProps {
  userId?: string;
  sessionDamage?: number;
  dailyRvs?: number;
  equippedSkills?: Array<{ name: string; icon?: string }>;
  playerStr?: number;
  characterClass?: string;
  gender?: "m" | "f";
  equippedWeaponIcon?: string;
  onAddItemToInventory?: (newItem: InventoryRecord) => void;
  onConsumeSessionDamage?: () => void;
  onNavigateToMultiplayer?: () => void;
}

export function CombatArena({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  sessionDamage = 0,
  dailyRvs = 0,
  equippedSkills = [],
  playerStr = 85,
  characterClass = "WARRIOR",
  gender = "m",
  equippedWeaponIcon = "/assets/items/weapons/01.png",
  onAddItemToInventory,
  onConsumeSessionDamage,
  onNavigateToMultiplayer,
}: CombatArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<DamageParticle[]>([]);
  const hasExecutedRef = useRef<boolean>(false);

  const [activeMode, setActiveMode] = useState<"solo" | "party">("solo");
  const [partyMembers, setPartyMembers] = useState<Array<{
    user_id: string;
    username: string;
    character_class: string;
    level: number;
    combat_power: number;
    role: string;
    weapon_icon?: string;
  }>>([]);

  useEffect(() => {
    const fetchPartyMembers = async () => {
      try {
        const res = await fetch("/api/multiplayer/party");
        if (res.ok) {
          const data = await res.json();
          if (data && data.party && Array.isArray(data.party.members)) {
            setPartyMembers(data.party.members);
          } else if (data && Array.isArray(data.members)) {
            setPartyMembers(data.members);
          } else {
            setPartyMembers([]);
          }
        }
      } catch (e) {}
    };
    fetchPartyMembers();
  }, [activeMode]);

  const defaultSpriteConfig = {
    spriteKey: "goblin",
    displayName: "Goblin",
    animPrefix: "idle_anim",
    hasRunAnim: true,
    isBig: false,
  };

  const [soloEnemy, setSoloEnemy] = useState<EnemyData>({
    enemy_id: "solo-floor-1-init",
    display_name: "Goblin",
    floor: 1,
    current_hp: 1000,
    max_hp: 1000,
    status: "Active",
    category: "mob",
    mode: "solo",
    sprite_config: defaultSpriteConfig,
  });

  const [partyEnemy, setPartyEnemy] = useState<EnemyData>({
    enemy_id: "party-floor-1-init",
    display_name: "Goblin Raider Squad",
    floor: 1,
    current_hp: 4000,
    max_hp: 4000,
    status: "Active",
    category: "mob",
    mode: "party",
    sprite_config: defaultSpriteConfig,
  });

  const [enemyState, setEnemyState] = useState<EnemySpriteState>("idle");
  const [heroState, setHeroState] = useState<HeroState>("idle");
  const [soloLogs, setSoloLogs] = useState<Array<{ id: string; msg: string; color: string }>>([]);
  const [partyLogs, setPartyLogs] = useState<Array<{ id: string; msg: string; color: string }>>([]);

  const [victoryLoot, setVictoryLoot] = useState<{
    enemyName: string;
    floor: number;
    droppedItem: EquipmentItem;
  } | null>(null);

  const currentEnemy = activeMode === "party" ? partyEnemy : soloEnemy;
  const currentLogs = activeMode === "party" ? partyLogs : soloLogs;

  const baseCombatPower = Math.round((dailyRvs > 0 ? dailyRvs : 50) + playerStr);
  const todayStr = new Date().toISOString().split("T")[0];
  const soloLogKey = `ironpixels_combat_log_solo_${todayStr}`;
  const partyLogKey = `ironpixels_combat_log_party_${todayStr}`;
  const isBossFloor = currentEnemy.floor % 5 === 0;

  useEffect(() => {
    try {
      const savedSoloLogs = localStorage.getItem(soloLogKey);
      if (savedSoloLogs) setSoloLogs(JSON.parse(savedSoloLogs));

      const savedPartyLogs = localStorage.getItem(partyLogKey);
      if (savedPartyLogs) setPartyLogs(JSON.parse(savedPartyLogs));
    } catch (e) {}

    try {
      const savedSolo = localStorage.getItem("ironpixels_active_solo_enemy");
      if (savedSolo) {
        const parsed = JSON.parse(savedSolo);
        if (parsed && parsed.floor && parsed.sprite_config) {
          setSoloEnemy(parsed);
        }
      }

      const savedParty = localStorage.getItem("ironpixels_active_party_enemy");
      if (savedParty) {
        const parsed = JSON.parse(savedParty);
        if (parsed && parsed.floor && parsed.sprite_config) {
          setPartyEnemy(parsed);
        }
      }
    } catch (e) {}
  }, [soloLogKey, partyLogKey]);

  const addLog = (msg: string, color = "#e5e2e1", mode: "solo" | "party" = activeMode) => {
    if (mode === "party") {
      setPartyLogs((prev) => {
        const updated = [{ id: Math.random().toString(), msg, color }, ...prev.slice(0, 9)];
        try { localStorage.setItem(partyLogKey, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    } else {
      setSoloLogs((prev) => {
        const updated = [{ id: Math.random().toString(), msg, color }, ...prev.slice(0, 9)];
        try { localStorage.setItem(soloLogKey, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
  };

  const fetchModeEnemy = async (mode: "solo" | "party") => {
    try {
      const res = await fetch(`/api/combat/boss?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.stage && data.sprite_config) {
          const mapped: EnemyData = {
            enemy_id: data.boss_id,
            display_name: data.sprite_config?.displayName || data.boss_name,
            floor: data.stage,
            current_hp: Number(data.current_hp),
            max_hp: Number(data.max_hp),
            status: data.status || "Active",
            category: data.category || "mob",
            mode,
            sprite_config: data.sprite_config || defaultSpriteConfig,
          };
          if (mode === "party") {
            setPartyEnemy(mapped);
          } else {
            setSoloEnemy(mapped);
          }
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchModeEnemy("solo");
    fetchModeEnemy("party");

    const supabase = createClient();
    const channel = supabase
      .channel("party_combat_realtime_broadcast")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dungeon_bosses",
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated && (updated.mode === "party" || updated.boss_id?.startsWith("party_"))) {
            setPartyEnemy((prev) => {
              if (prev.current_hp !== Number(updated.current_hp) || prev.floor !== updated.stage) {
                const damageDealt = prev.current_hp - Number(updated.current_hp);
                if (damageDealt > 0) {
                  spawnDamageParticle(damageDealt, true, `PARTY ATTACK -${formatNumber(damageDealt)}`);
                  setEnemyState("hit");
                  setTimeout(() => setEnemyState("idle"), 500);
                }
                return {
                  enemy_id: updated.boss_id,
                  display_name: updated.sprite_config?.displayName || updated.boss_name,
                  floor: updated.stage,
                  current_hp: Number(updated.current_hp),
                  max_hp: Number(updated.max_hp),
                  status: updated.status || "Active",
                  category: updated.category || "mob",
                  mode: "party",
                  sprite_config: updated.sprite_config || defaultSpriteConfig,
                };
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      if (activeMode === "party") {
        fetchModeEnemy("party");
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [activeMode]);

  const awardLoot = (enemyName: string, floor: number) => {
    const pool = EQUIPMENT_DICTIONARY.filter(
      (i) => i.rarity === "rare" || i.rarity === "epic" || i.rarity === "legendary" || i.rarity === "mythic"
    );
    const rewardItem = pool[Math.floor(Math.random() * pool.length)] || EQUIPMENT_DICTIONARY[0];

    const newRecord: InventoryRecord = {
      inventory_id: `floor-loot-${Date.now()}`,
      user_id: userId,
      item_id: rewardItem.item_id,
      is_equipped: false,
      item: rewardItem,
    };

    if (onAddItemToInventory) onAddItemToInventory(newRecord);
    setVictoryLoot({ enemyName, floor, droppedItem: rewardItem });
  };

  const spawnDamageParticle = (damage: number, isCritical = false, actionText?: string) => {
    particlesRef.current.push({
      id: Math.random().toString(),
      text: actionText || `-${formatNumber(damage)}`,
      x: 350 + (Math.random() * 40 - 20),
      y: 100 + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 1.8,
      vy: -2.8 - Math.random() * 1.5,
      opacity: 1.0,
      color: isCritical ? "#FF0055" : "#00FF41",
      isCritical,
    });
  };

  const executeAttack = async (
    damage: number,
    actionName = "Normal Slash",
    attackType: "attack01" | "attack02" | "attack03" = "attack01",
    targetMode: "solo" | "party" = activeMode
  ) => {
    const targetEnemy = targetMode === "party" ? partyEnemy : soloEnemy;

    if (targetEnemy.current_hp <= 0 && targetEnemy.status === "Defeated") {
      addLog(`Enemy already defeated in ${targetMode.toUpperCase()}! Advancing...`, "#f59e0b", targetMode);
      return;
    }

    setHeroState(attackType);
    setTimeout(() => setHeroState("idle"), 500);

    if (targetMode === activeMode) {
      setEnemyState("hit");
      spawnDamageParticle(damage, true, `${actionName.toUpperCase()} -${formatNumber(damage)}`);
    }

    try {
      const res = await fetch("/api/combat/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          boss_id: targetEnemy.enemy_id,
          rvs_damage: damage,
          mode: targetMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.is_defeated) {
          if (targetMode === activeMode) setEnemyState("dead");

          const wasFloor = targetEnemy.floor;
          const wasBoss = wasFloor % 5 === 0;
          addLog(`${wasBoss ? "🏆 BOSS" : "⚔️"} ${targetEnemy.display_name} DEFEATED on Floor ${wasFloor}!`, "#00ff41", targetMode);

          if (wasBoss && targetMode === activeMode) awardLoot(targetEnemy.display_name, wasFloor);

          const nextEnemyData: EnemyData = {
            enemy_id: data.boss_id,
            display_name: data.sprite_config?.displayName || data.boss_name,
            floor: data.stage,
            current_hp: data.current_hp,
            max_hp: data.max_hp,
            status: "Active",
            category: data.category || "mob",
            mode: targetMode,
            sprite_config: data.sprite_config || defaultSpriteConfig,
          };

          if (targetMode === "party") {
            setPartyEnemy(nextEnemyData);
            localStorage.setItem("ironpixels_active_party_enemy", JSON.stringify(nextEnemyData));
          } else {
            setSoloEnemy(nextEnemyData);
            localStorage.setItem("ironpixels_active_solo_enemy", JSON.stringify(nextEnemyData));
          }

          setTimeout(() => {
            if (targetMode === activeMode) setEnemyState("idle");
          }, wasBoss ? 2000 : 1200);
        } else {
          const updated: EnemyData = {
            ...targetEnemy,
            current_hp: data.current_hp,
            status: data.status,
          };

          if (targetMode === "party") {
            setPartyEnemy(updated);
            localStorage.setItem("ironpixels_active_party_enemy", JSON.stringify(updated));
          } else {
            setSoloEnemy(updated);
            localStorage.setItem("ironpixels_active_solo_enemy", JSON.stringify(updated));
          }

          if (targetMode === activeMode) {
            setTimeout(() => setEnemyState((s) => s === "dead" ? "dead" : "idle"), 600);
          }
        }
      }
    } catch (err) {
      if (targetMode === activeMode) setTimeout(() => setEnemyState("idle"), 600);
    }
  };

  const handleInstantKill = () => {
    if (currentEnemy.current_hp <= 0) return;
    const dmg = Math.max(999999, currentEnemy.current_hp);
    executeAttack(dmg, "INSTANT KILL", "attack03", activeMode);
    addLog(`⚡ INSTANT KILL! Dealt ${formatNumber(dmg)} damage!`, "#FF0055", activeMode);
  };

  useEffect(() => {
    if (sessionDamage > 0 && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      const totalDmg = sessionDamage + playerStr;

      executeAttack(totalDmg, "Gym RVS Strike", "attack01", "solo");
      executeAttack(totalDmg, "Gym RVS Strike", "attack01", "party");

      addLog(`Gym Workout Attack dealt ${formatNumber(totalDmg)} damage to BOTH Solo and Party lobbies!`, "#00ff41", "solo");
      addLog(`Gym Workout Attack dealt ${formatNumber(totalDmg)} damage to BOTH Solo and Party lobbies!`, "#00ff41", "party");

      if (onConsumeSessionDamage) onConsumeSessionDamage();
    }
  }, [sessionDamage, playerStr]);

  useEffect(() => {
    let animId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.016;
        if (p.opacity <= 0) { particlesRef.current.splice(i, 1); return; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.font = `${p.isCritical ? "bold 16px" : "13px"} monospace`;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSkillCast = (
    skillName: string,
    damageDealt: number,
    _newBossHp: number,
    attackType: "attack01" | "attack02" | "attack03"
  ) => {
    executeAttack(damageDealt, skillName, attackType, activeMode);
    addLog(`Casted ${skillName}! Dealt ${formatNumber(damageDealt)} damage to ${currentEnemy.display_name}.`, "#FFD60A", activeMode);
  };

  const hpPct = Math.max(0, Math.min(100, (currentEnemy.current_hp / currentEnemy.max_hp) * 100));

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      <AnimatePresence>
        {victoryLoot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm border-2 border-purple-500 bg-surface p-6 text-center space-y-4 shadow-[0_0_50px_rgba(168,85,247,0.6)] font-mono relative">
              <button onClick={() => setVictoryLoot(null)} className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 border-2 border-purple-500 bg-purple-950/60 text-purple-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-bounce">
                <Gift className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-headline font-extrabold text-2xl text-purple-400 uppercase tracking-wider">BOSS DEFEATED LOOT!</h3>
                <p className="text-xs text-gray-300 mt-1">YOU VANQUISHED {victoryLoot.enemyName.toUpperCase()} ON FLOOR {victoryLoot.floor}!</p>
              </div>
              <div className="bg-black/80 border border-purple-800 p-4 space-y-3">
                <div className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">1 FREE VOID CHEST REWARD</div>
                <div className="w-16 h-16 bg-black border-2 border-purple-500 mx-auto p-1 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center">
                  <img src={victoryLoot.droppedItem.image_url} alt={victoryLoot.droppedItem.item_name} className="w-12 h-12 object-contain pixelated" />
                </div>
                <div>
                  <div className="font-headline font-extrabold text-sm text-white uppercase">{victoryLoot.droppedItem.item_name}</div>
                  <div className="text-[10px] font-bold text-purple-400 uppercase mt-0.5">{victoryLoot.droppedItem.rarity} {victoryLoot.droppedItem.type}</div>
                </div>
              </div>
              <button onClick={() => setVictoryLoot(null)} className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer">
                SAVE ITEM TO INVENTORY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-1 bg-surface border border-pixel-border p-1">
        <button
          onClick={() => setActiveMode("solo")}
          className={`py-2 px-3 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
            activeMode === "solo"
              ? "bg-[#00ff41] text-black shadow-neon"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>SOLO DUNGEON</span>
        </button>

        <button
          onClick={() => setActiveMode("party")}
          className={`py-2 px-3 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
            activeMode === "party"
              ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>PARTY RAID (4X HP)</span>
        </button>
      </div>

      {activeMode === "party" && partyMembers.length === 0 ? (
        <div className="border-2 border-purple-500/80 bg-purple-950/20 p-8 text-center space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono">
          <div className="w-16 h-16 border-2 border-purple-500 bg-purple-950 text-purple-300 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse">
            <Crown className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-headline font-black text-xl text-white uppercase tracking-wider">
              NO ACTIVE PARTY FOUND
            </h3>
            <p className="text-xs text-purple-300 font-bold uppercase">
              PARTY RAID REQUIRES AN ACTIVE GUILD PARTY!
            </p>
            <p className="text-[11px] text-zinc-400 mt-2">
              You must create a Guild Squad or accept a pending party invite in the Multiplayer Realm tab before participating in Party Raid Boss battles.
            </p>
          </div>

          <button
            onClick={() => onNavigateToMultiplayer?.()}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>GO TO MULTIPLAYER REALM TO JOIN / CREATE PARTY</span>
          </button>
        </div>
      ) : (
        <>

      <div className="border border-pixel-border bg-surface p-3 flex items-center justify-between text-xs font-bold border-l-4 border-l-[#00ff41] shadow-neon">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00ff41]" />
          <span>BASE COMBAT POWER:</span>
          <span className="text-[#00ff41] text-sm">{formatNumber(baseCombatPower)} DMG</span>
        </div>
        <button
          onClick={handleInstantKill}
          className="px-2.5 py-1 border border-red-500/80 bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white text-[10px] font-headline font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-red-glow"
        >
          <Skull className="w-3.5 h-3.5 text-red-400" />
          <span>INSTANT KILL</span>
        </button>
      </div>

      <div className="border border-pixel-border bg-surface p-4 space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBossFloor ? (
              <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <Flame className="w-5 h-5 text-health-red animate-pulse" />
            )}
            <span className="font-headline font-extrabold text-base text-white uppercase tracking-wider">
              FLOOR {currentEnemy.floor}: {currentEnemy.display_name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {activeMode === "party" && (
              <span className="px-1.5 py-0.5 border border-purple-500 text-purple-300 bg-purple-950/60 text-[9px] uppercase font-bold">
                GUILD RAID
              </span>
            )}
            {isBossFloor && (
              <span className="px-1.5 py-0.5 border border-amber-400 text-amber-400 bg-amber-400/10 text-[9px] uppercase font-bold">
                BOSS
              </span>
            )}
            <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
              currentEnemy.status === "Defeated"
                ? "border-pixel-green text-pixel-green bg-pixel-green/10"
                : "border-health-red text-health-red bg-health-red/10 shadow-red-glow"
            }`}>
              {currentEnemy.status}
            </span>
          </div>
        </div>

        <div className="w-full bg-surface border border-pixel-border p-2 shadow-red-glow">
          <div className="flex justify-between text-xs font-mono text-health-red font-bold mb-1">
            <span>{activeMode === "party" ? "PARTY RAID MONSTER HP (4X HP)" : isBossFloor ? "BOSS HP" : "MOB HP"}</span>
            <span>{formatNumber(currentEnemy.current_hp)} / {formatNumber(currentEnemy.max_hp)}</span>
          </div>
          <div className="w-full bg-black h-3 border border-pixel-border overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${activeMode === "party" ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" : isBossFloor ? "bg-amber-500 shadow-gold-glow" : "bg-health-red shadow-red-glow"}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        <div className="relative overflow-hidden flex justify-center">
          <DungeonStageMap floor={currentEnemy.floor}>
            <div className="pointer-events-auto flex items-center justify-start gap-1 sm:gap-2 px-1 overflow-visible z-20">
              {activeMode === "party" && partyMembers.length > 0 ? (
                partyMembers.slice(0, 5).map((member, idx) => {
                  const yOffset = idx === 0 ? "translate-y-2" : idx === 1 || idx === 2 ? "translate-y-0" : "-translate-y-2";
                  const tagPos = idx % 2 === 0 ? "top" : "bottom";
                  return (
                    <div key={member.user_id || idx} className={`transition-transform duration-300 ${yOffset}`}>
                      <HeroSprite
                        currentState={heroState}
                        characterClass={member.character_class}
                        gender={idx % 2 === 0 ? "m" : "f"}
                        scale={1.25}
                        weaponIcon={member.weapon_icon || "/assets/items/weapons/01.png"}
                        showNameTag={member.username.split(" ")[0]}
                        nameTagPosition={tagPos}
                      />
                    </div>
                  );
                })
              ) : (
                <HeroSprite
                  currentState={heroState}
                  characterClass={characterClass}
                  gender={gender}
                  scale={2.0}
                  weaponIcon={equippedWeaponIcon}
                />
              )}
            </div>
            <div className="pointer-events-auto z-10 flex items-center justify-end">
              <EnemySprite currentState={enemyState} spriteConfig={currentEnemy.sprite_config} />
            </div>
          </DungeonStageMap>

          <canvas
            ref={canvasRef}
            width={512}
            height={192}
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
          />
        </div>
      </div>

      <TacticalSkillBar
        userId={userId}
        dailyRvs={dailyRvs}
        playerStr={playerStr}
        mode={activeMode}
        equippedSkills={equippedSkills}
        onSkillCast={handleSkillCast}
      />

      <div className="border border-pixel-border bg-surface p-3 space-y-1.5 font-mono">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-1 text-[10px] text-gray-400 uppercase tracking-widest">
          <span>{activeMode.toUpperCase()} DUNGEON LOG — FLOOR {currentEnemy.floor}</span>
          <span className="text-pixel-green font-bold">{currentLogs.length} ENTRIES</span>
        </div>
        <div className="space-y-1 max-h-28 overflow-y-auto pt-1">
          {currentLogs.length === 0 ? (
            <div className="text-[11px] text-gray-500 italic">No actions logged in {activeMode} mode yet. Cast skills or finish a gym session!</div>
          ) : (
            currentLogs.map((log) => (
              <div key={log.id} className="text-[11px] flex items-center gap-1.5 border-b border-dashed border-pixel-border/30 pb-0.5">
                <Swords className="w-3 h-3 text-pixel-green flex-shrink-0" />
                <span style={{ color: log.color }}>{log.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
