"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Swords, Zap, Gift, X, Skull } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { TacticalSkillBar } from "@/components/TacticalSkillBar";
import { BossSprite, BossState } from "@/components/BossSprite";
import { HeroSprite, HeroState } from "@/components/HeroSprite";
import { DungeonStageMap } from "@/components/DungeonStageMap";
import { EQUIPMENT_DICTIONARY, EquipmentItem, InventoryRecord } from "@/lib/equipment";

interface DamageParticle {
  id: string;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  scale: number;
  color: string;
  isCritical: boolean;
}

interface BossData {
  boss_id: string;
  boss_name: string;
  stage: number;
  current_hp: number;
  max_hp: number;
  status: string;
  boss_type?: "orc" | "blood" | "demon" | "dragon" | "mecha" | "lich";
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

  const [boss, setBoss] = useState<BossData>({
    boss_id: "b055d7ac-1234-4567-89ab-cdef01234567",
    boss_name: "Goblin Berserker King",
    stage: 1,
    current_hp: 15000,
    max_hp: 15000,
    status: "Active",
    boss_type: "orc",
  });

  const [bossState, setBossState] = useState<BossState>("idle");
  const [heroState, setHeroState] = useState<HeroState>("idle");
  const [combatLog, setCombatLog] = useState<Array<{ id: string; msg: string; color: string }>>([]);
  const [bossVictoryLoot, setBossVictoryLoot] = useState<{
    bossName: string;
    stage: number;
    droppedItem: EquipmentItem;
  } | null>(null);

  const baseCombatPower = Math.round((dailyRvs > 0 ? dailyRvs : 50) + playerStr);
  const todayKey = `ironpixels_combat_log_${new Date().toISOString().split("T")[0]}`;

  const getCleanBossTitle = (name: string, stageNum: number) => {
    const raw = name || "DUNGEON BOSS";
    const cleaned = raw.replace(/^stage\s*\d+\s*:\s*/i, "");
    return `STAGE ${stageNum}: ${cleaned.toUpperCase()}`;
  };

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(todayKey);
      if (savedLogs) {
        setCombatLog(JSON.parse(savedLogs));
      }
    } catch (e) {}

    try {
      const savedBoss = localStorage.getItem("ironpixels_active_boss");
      if (savedBoss) {
        const parsed = JSON.parse(savedBoss);
        if (parsed && parsed.stage) {
          setBoss(parsed);
        }
      }
    } catch (e) {}
  }, [todayKey]);

  const addLog = (msg: string, color = "#e5e2e1") => {
    setCombatLog((prev) => {
      const updated = [{ id: Math.random().toString(), msg, color }, ...prev.slice(0, 9)];
      try {
        localStorage.setItem(todayKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const fetchBossData = async () => {
    try {
      const res = await fetch("/api/combat/boss");
      if (res.ok) {
        const data = await res.json();
        if (data && data.stage) {
          setBoss(data);
          try {
            localStorage.setItem("ironpixels_active_boss", JSON.stringify(data));
          } catch (e) {}
        }
        if (data.current_hp === 0 || data.status === "Defeated") {
          setBossState("dead");
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchBossData();
  }, []);

  const awardVoidChestLoot = (bossName: string, stage: number) => {
    const epicLegendaryPool = EQUIPMENT_DICTIONARY.filter(
      (i) => i.rarity === "rare" || i.rarity === "epic" || i.rarity === "legendary" || i.rarity === "mythic"
    );
    const rewardItem =
      epicLegendaryPool[Math.floor(Math.random() * epicLegendaryPool.length)] || EQUIPMENT_DICTIONARY[0];

    const newRecord: InventoryRecord = {
      inventory_id: `boss-loot-${Date.now()}`,
      user_id: userId,
      item_id: rewardItem.item_id,
      is_equipped: false,
      item: rewardItem,
    };

    if (onAddItemToInventory) {
      onAddItemToInventory(newRecord);
    }

    setBossVictoryLoot({
      bossName,
      stage,
      droppedItem: rewardItem,
    });
  };

  const spawnDamageParticle = (damage: number, isCritical = false, actionText?: string) => {
    const text = actionText || `-${formatNumber(damage)}`;
    const color = isCritical ? "#FF0055" : "#00FF41";
    const newParticle: DamageParticle = {
      id: Math.random().toString(),
      text,
      x: 350 + (Math.random() * 40 - 20),
      y: 100 + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 1.8,
      vy: -2.8 - Math.random() * 1.5,
      opacity: 1.0,
      scale: isCritical ? 1.6 : 1.2,
      color,
      isCritical,
    };
    particlesRef.current.push(newParticle);
  };

  const executeAttack = async (
    damage: number,
    actionName = "Normal Slash",
    attackType: "attack01" | "attack02" | "attack03" = "attack01"
  ) => {
    if (boss.current_hp <= 0 && boss.status === "Defeated") {
      addLog("Boss is already defeated! Preparing next Stage Boss...", "#f59e0b");
      return;
    }

    setHeroState(attackType);
    setTimeout(() => {
      setHeroState("idle");
    }, 500);

    setBossState("hit");
    spawnDamageParticle(damage, true, `${actionName.toUpperCase()} -${formatNumber(damage)}`);

    try {
      const res = await fetch("/api/combat/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          boss_id: boss.boss_id,
          rvs_damage: damage,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.is_defeated) {
          setBossState("dead");
          addLog(`BOSS DEFEATED! ${boss.boss_name} fell in battle!`, "#00ff41");

          awardVoidChestLoot(boss.boss_name, boss.stage);

          const newNextBoss: BossData = {
            boss_id: data.boss_id,
            boss_name: data.boss_name,
            stage: data.stage,
            current_hp: data.current_hp,
            max_hp: data.max_hp,
            status: "Active",
            boss_type: data.boss_type,
          };

          try {
            localStorage.setItem("ironpixels_active_boss", JSON.stringify(newNextBoss));
          } catch (e) {}

          setTimeout(() => {
            setBoss(newNextBoss);
            setBossState("idle");
          }, 2000);
        } else {
          const updatedBossState: BossData = {
            ...boss,
            current_hp: data.current_hp,
            status: data.status,
            boss_name: data.boss_name || boss.boss_name,
            boss_type: data.boss_type || boss.boss_type,
          };
          setBoss(updatedBossState);

          try {
            localStorage.setItem("ironpixels_active_boss", JSON.stringify(updatedBossState));
          } catch (e) {}

          setTimeout(() => {
            setBossState((current) => (current === "dead" ? "dead" : "idle"));
          }, 600);
        }
      }
    } catch (err) {
      setTimeout(() => {
        setBossState("idle");
      }, 600);
    }
  };

  const handleInstantKill = () => {
    if (boss.current_hp <= 0) return;
    const instantKillDmg = Math.max(999999, boss.current_hp);
    executeAttack(instantKillDmg, "INSTANT KILL TEST", "attack03");
    addLog(`⚡ INSTANT KILL ACTIVATED! Dealt ${formatNumber(instantKillDmg)} TEST DAMAGE!`, "#FF0055");
  };

  useEffect(() => {
    if (sessionDamage > 0 && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      const totalAttackDmg = sessionDamage + playerStr;
      executeAttack(totalAttackDmg, "Gym RVS Strike", "attack01");
      addLog(`Gym Workout Attack dealt ${formatNumber(totalAttackDmg)} damage (RVS: ${sessionDamage} + STR: ${playerStr})!`, "#00ff41");
      if (onConsumeSessionDamage) {
        onConsumeSessionDamage();
      }
    }
  }, [sessionDamage, playerStr]);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.016;

        if (p.opacity <= 0) {
          particlesRef.current.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.font = `${p.isCritical ? "bold 16px" : "13px"} monospace`;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSkillCast = (
    skillName: string,
    damageDealt: number,
    newBossHp: number,
    attackType: "attack01" | "attack02" | "attack03"
  ) => {
    executeAttack(damageDealt, skillName, attackType);
    addLog(`Casted ${skillName}! Dealt ${formatNumber(damageDealt)} damage to ${boss.boss_name}.`, "#FFD60A");
  };

  const hpPercentage = Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100));

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono select-none">
      <AnimatePresence>
        {bossVictoryLoot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm border-2 border-purple-500 bg-surface p-6 text-center space-y-4 shadow-[0_0_50px_rgba(168,85,247,0.6)] font-mono relative">
              <button
                onClick={() => setBossVictoryLoot(null)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 border-2 border-purple-500 bg-purple-950/60 text-purple-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-bounce">
                <Gift className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-headline font-extrabold text-2xl text-purple-400 uppercase tracking-wider">
                  BOSS DEFEATED LOOT!
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  YOU VANQUISHED {bossVictoryLoot.bossName.toUpperCase()}!
                </p>
              </div>

              <div className="bg-black/80 border border-purple-800 p-4 space-y-3">
                <div className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">
                  1 FREE VOID CHEST REWARD
                </div>

                <div className="w-16 h-16 bg-black border-2 border-purple-500 mx-auto p-1 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center">
                  <img
                    src={bossVictoryLoot.droppedItem.image_url}
                    alt={bossVictoryLoot.droppedItem.item_name}
                    className="w-12 h-12 object-contain pixelated"
                  />
                </div>

                <div>
                  <div className="font-headline font-extrabold text-sm text-white uppercase">
                    {bossVictoryLoot.droppedItem.item_name}
                  </div>
                  <div className="text-[10px] font-bold text-purple-400 uppercase mt-0.5">
                    {bossVictoryLoot.droppedItem.rarity} {bossVictoryLoot.droppedItem.type}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setBossVictoryLoot(null)}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer"
              >
                SAVE ITEM TO INVENTORY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border border-pixel-border bg-surface p-3 flex items-center justify-between text-xs font-bold border-l-4 border-l-[#00ff41] shadow-neon">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00ff41]" />
          <span>BASE COMBAT POWER:</span>
          <span className="text-[#00ff41] text-sm">{formatNumber(baseCombatPower)} DMG</span>
        </div>

        <button
          onClick={handleInstantKill}
          className="px-2.5 py-1 border border-red-500/80 bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white text-[10px] font-headline font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-red-glow"
          title="Testing Instant Kill"
        >
          <Skull className="w-3.5 h-3.5 text-red-400" />
          <span>INSTANT KILL TEST</span>
        </button>
      </div>

      <div className="border border-pixel-border bg-surface p-4 space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-health-red animate-pulse" />
            <span className="font-headline font-extrabold text-base text-white uppercase tracking-wider">
              {getCleanBossTitle(boss.boss_name, boss.stage || 1)}
            </span>
          </div>

          <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
            boss.status === "Defeated"
              ? "border-pixel-green text-pixel-green bg-pixel-green/10"
              : "border-health-red text-health-red bg-health-red/10 shadow-red-glow"
          }`}>
            {boss.status}
          </span>
        </div>

        <div className="w-full bg-surface border border-pixel-border p-2 shadow-red-glow">
          <div className="flex justify-between text-xs font-mono text-health-red font-bold mb-1">
            <span>BOSS HP</span>
            <span>
              {formatNumber(boss.current_hp)} / {formatNumber(boss.max_hp)}
            </span>
          </div>
          <div className="w-full bg-black h-3 border border-pixel-border overflow-hidden">
            <div
              className="bg-health-red h-full transition-all duration-300 shadow-red-glow"
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>

        <div className="relative overflow-hidden flex justify-center">
          <DungeonStageMap stage={boss.stage || 1} bossType={boss.boss_type || "demon"}>
            <div className="pointer-events-auto">
              <HeroSprite
                currentState={heroState}
                characterClass={characterClass}
                gender={gender}
              />
            </div>

            <div className="pointer-events-auto">
              <BossSprite
                currentState={bossState}
                currentHp={boss.current_hp}
                maxHp={boss.max_hp}
                bossType={boss.boss_type || "demon"}
                flipHorizontal={true}
              />
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
        equippedSkills={equippedSkills}
        onSkillCast={handleSkillCast}
      />

      <div className="border border-pixel-border bg-surface p-3 space-y-1.5 font-mono">
        <div className="flex items-center justify-between border-b border-pixel-border/50 pb-1 text-[10px] text-gray-400 uppercase tracking-widest">
          <span>DAILY COMBAT LOG ({new Date().toISOString().split("T")[0]})</span>
          <span className="text-pixel-green font-bold">{combatLog.length} LOGS</span>
        </div>
        <div className="space-y-1 max-h-28 overflow-y-auto pt-1">
          {combatLog.length === 0 ? (
            <div className="text-[11px] text-gray-500 italic">
              No battle actions logged today yet. Perform gym sets or cast skills to attack!
            </div>
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
