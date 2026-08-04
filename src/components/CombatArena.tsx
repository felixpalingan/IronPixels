"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Swords, Zap, Gift, X, Skull, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { TacticalSkillBar } from "@/components/TacticalSkillBar";
import { EnemySprite } from "@/components/EnemySprite";
import { HeroSprite, HeroState } from "@/components/HeroSprite";
import { DungeonStageMap } from "@/components/DungeonStageMap";
import { EQUIPMENT_DICTIONARY, EquipmentItem, InventoryRecord } from "@/lib/equipment";
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
  onAddItemToInventory?: (newItem: InventoryRecord) => void;
  onConsumeSessionDamage?: () => void;
}

export function CombatArena({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  sessionDamage = 0,
  dailyRvs = 0,
  equippedSkills = [],
  playerStr = 85,
  characterClass = "WARRIOR",
  gender = "m",
  onAddItemToInventory,
  onConsumeSessionDamage,
}: CombatArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<DamageParticle[]>([]);
  const hasExecutedRef = useRef<boolean>(false);

  const defaultSpriteConfig = {
    spriteKey: "goblin",
    displayName: "Goblin",
    animPrefix: "idle_anim",
    hasRunAnim: true,
    isBig: false,
  };

  const [enemy, setEnemy] = useState<EnemyData>({
    enemy_id: "floor-1-MOB-init",
    display_name: "Goblin",
    floor: 1,
    current_hp: 1000,
    max_hp: 1000,
    status: "Active",
    category: "mob",
    sprite_config: defaultSpriteConfig,
  });

  const [enemyState, setEnemyState] = useState<EnemySpriteState>("idle");
  const [heroState, setHeroState] = useState<HeroState>("idle");
  const [combatLog, setCombatLog] = useState<Array<{ id: string; msg: string; color: string }>>([]);
  const [victoryLoot, setVictoryLoot] = useState<{
    enemyName: string;
    floor: number;
    droppedItem: EquipmentItem;
  } | null>(null);

  const baseCombatPower = Math.round((dailyRvs > 0 ? dailyRvs : 50) + playerStr);
  const todayKey = `ironpixels_combat_log_${new Date().toISOString().split("T")[0]}`;
  const isBossFloor = enemy.floor % 5 === 0;

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(todayKey);
      if (savedLogs) setCombatLog(JSON.parse(savedLogs));
    } catch (e) {}

    try {
      const saved = localStorage.getItem("ironpixels_active_enemy");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.floor && parsed.sprite_config) {
          setEnemy(parsed);
        }
      }
    } catch (e) {}
  }, [todayKey]);

  const addLog = (msg: string, color = "#e5e2e1") => {
    setCombatLog((prev) => {
      const updated = [{ id: Math.random().toString(), msg, color }, ...prev.slice(0, 9)];
      try { localStorage.setItem(todayKey, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/combat/boss");
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
              sprite_config: data.sprite_config || defaultSpriteConfig,
            };
            setEnemy(mapped);
            localStorage.setItem("ironpixels_active_enemy", JSON.stringify(mapped));
            if (data.current_hp === 0 || data.status === "Defeated") setEnemyState("dead");
          }
        }
      } catch (err) {}
    })();
  }, []);

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
    attackType: "attack01" | "attack02" | "attack03" = "attack01"
  ) => {
    if (enemy.current_hp <= 0 && enemy.status === "Defeated") {
      addLog("Enemy already defeated! Advancing to next floor...", "#f59e0b");
      return;
    }

    setHeroState(attackType);
    setTimeout(() => setHeroState("idle"), 500);

    setEnemyState("hit");
    spawnDamageParticle(damage, true, `${actionName.toUpperCase()} -${formatNumber(damage)}`);

    try {
      const res = await fetch("/api/combat/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, boss_id: enemy.enemy_id, rvs_damage: damage }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.is_defeated) {
          setEnemyState("dead");
          const wasFloor = enemy.floor;
          const wasBoss = wasFloor % 5 === 0;
          addLog(`${wasBoss ? "🏆 BOSS" : "⚔️"} ${enemy.display_name} DEFEATED on Floor ${wasFloor}!`, "#00ff41");

          // Boss floors give loot
          if (wasBoss) awardLoot(enemy.display_name, wasFloor);

          const nextEnemy: EnemyData = {
            enemy_id: data.boss_id,
            display_name: data.sprite_config?.displayName || data.boss_name,
            floor: data.stage,
            current_hp: data.current_hp,
            max_hp: data.max_hp,
            status: "Active",
            category: data.category || "mob",
            sprite_config: data.sprite_config || defaultSpriteConfig,
          };

          localStorage.setItem("ironpixels_active_enemy", JSON.stringify(nextEnemy));

          setTimeout(() => {
            setEnemy(nextEnemy);
            setEnemyState("idle");
          }, wasBoss ? 2000 : 1200);
        } else {
          const updated: EnemyData = {
            ...enemy,
            current_hp: data.current_hp,
            status: data.status,
          };
          setEnemy(updated);
          localStorage.setItem("ironpixels_active_enemy", JSON.stringify(updated));
          setTimeout(() => setEnemyState((s) => s === "dead" ? "dead" : "idle"), 600);
        }
      }
    } catch (err) {
      setTimeout(() => setEnemyState("idle"), 600);
    }
  };

  const handleInstantKill = () => {
    if (enemy.current_hp <= 0) return;
    const dmg = Math.max(999999, enemy.current_hp);
    executeAttack(dmg, "INSTANT KILL", "attack03");
    addLog(`⚡ INSTANT KILL! Dealt ${formatNumber(dmg)} damage!`, "#FF0055");
  };

  useEffect(() => {
    if (sessionDamage > 0 && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      const totalDmg = sessionDamage + playerStr;
      executeAttack(totalDmg, "Gym RVS Strike", "attack01");
      addLog(`Gym Attack dealt ${formatNumber(totalDmg)} damage (RVS: ${sessionDamage} + STR: ${playerStr})!`, "#00ff41");
      if (onConsumeSessionDamage) onConsumeSessionDamage();
    }
  }, [sessionDamage, playerStr]);

  // Canvas particle renderer
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
    executeAttack(damageDealt, skillName, attackType);
    addLog(`Casted ${skillName}! Dealt ${formatNumber(damageDealt)} damage to ${enemy.display_name}.`, "#FFD60A");
  };

  const hpPct = Math.max(0, Math.min(100, (enemy.current_hp / enemy.max_hp) * 100));

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      {/* Victory Loot Modal (Boss floors only) */}
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

      {/* Combat Power & Test Bar */}
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

      {/* Arena Panel */}
      <div className="border border-pixel-border bg-surface p-4 space-y-3 relative">
        {/* Floor Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBossFloor ? (
              <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <Flame className="w-5 h-5 text-health-red animate-pulse" />
            )}
            <span className="font-headline font-extrabold text-base text-white uppercase tracking-wider">
              FLOOR {enemy.floor}: {enemy.display_name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isBossFloor && (
              <span className="px-1.5 py-0.5 border border-amber-400 text-amber-400 bg-amber-400/10 text-[9px] uppercase font-bold">
                BOSS
              </span>
            )}
            <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
              enemy.status === "Defeated"
                ? "border-pixel-green text-pixel-green bg-pixel-green/10"
                : "border-health-red text-health-red bg-health-red/10 shadow-red-glow"
            }`}>
              {enemy.status}
            </span>
          </div>
        </div>

        {/* HP Bar */}
        <div className="w-full bg-surface border border-pixel-border p-2 shadow-red-glow">
          <div className="flex justify-between text-xs font-mono text-health-red font-bold mb-1">
            <span>{isBossFloor ? "BOSS HP" : "MOB HP"}</span>
            <span>{formatNumber(enemy.current_hp)} / {formatNumber(enemy.max_hp)}</span>
          </div>
          <div className="w-full bg-black h-3 border border-pixel-border overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isBossFloor ? "bg-amber-500 shadow-gold-glow" : "bg-health-red shadow-red-glow"}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        {/* Dungeon Map & Characters */}
        <div className="relative overflow-hidden flex justify-center">
          <DungeonStageMap floor={enemy.floor}>
            <div className="pointer-events-auto">
              <HeroSprite currentState={heroState} characterClass={characterClass} gender={gender} />
            </div>
            <div className="pointer-events-auto">
              <EnemySprite currentState={enemyState} spriteConfig={enemy.sprite_config} />
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

      {/* Tactical Skill Bar */}
      <TacticalSkillBar
        userId={userId}
        dailyRvs={dailyRvs}
        playerStr={playerStr}
        equippedSkills={equippedSkills}
        onSkillCast={handleSkillCast}
      />

      {/* Combat Log */}
      <div className="border border-pixel-border bg-surface p-3 space-y-1.5 font-mono">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-1 text-[10px] text-gray-400 uppercase tracking-widest">
          <span>DUNGEON LOG — FLOOR {enemy.floor}</span>
          <span className="text-pixel-green font-bold">{combatLog.length} ENTRIES</span>
        </div>
        <div className="space-y-1 max-h-28 overflow-y-auto pt-1">
          {combatLog.length === 0 ? (
            <div className="text-[11px] text-gray-500 italic">No actions logged yet. Cast skills or finish a gym session to attack!</div>
          ) : (
            combatLog.map((log) => (
              <div key={log.id} className="text-[11px] flex items-center gap-1.5 border-b border-dashed border-pixel-border/30 pb-0.5">
                <Swords className="w-3 h-3 text-pixel-green flex-shrink-0" />
                <span style={{ color: log.color }}>{log.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
