"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Swords } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { TacticalSkillBar } from "@/components/TacticalSkillBar";
import { BossSprite, BossState } from "@/components/BossSprite";
import { HeroSprite, HeroState } from "@/components/HeroSprite";

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
}

interface CombatArenaProps {
  userId?: string;
  sessionDamage?: number;
  equippedSkills?: Array<{ name: string; icon?: string }>;
  playerStr?: number;
}

export function CombatArena({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  sessionDamage = 0,
  equippedSkills = [],
  playerStr = 85,
}: CombatArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<DamageParticle[]>([]);

  const [boss, setBoss] = useState<BossData>({
    boss_id: "b055d7ac-1234-4567-89ab-cdef01234567",
    boss_name: "Demon Lord Ignis",
    stage: 1,
    current_hp: 50000,
    max_hp: 50000,
    status: "Active",
  });

  const [bossState, setBossState] = useState<BossState>("idle");
  const [heroState, setHeroState] = useState<HeroState>("idle");
  const [combatLog, setCombatLog] = useState<Array<{ id: string; msg: string; color: string }>>([]);

  const todayKey = `ironpixels_combat_log_${new Date().toISOString().split("T")[0]}`;

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(todayKey);
      if (savedLogs) {
        setCombatLog(JSON.parse(savedLogs));
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
        setBoss(data);
        if (data.current_hp === 0 || data.status === "Defeated") {
          setBossState("dead");
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchBossData();
  }, []);

  const spawnDamageParticle = (amount: number, isCritical = false, customText?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const textStr = customText || `-${formatNumber(amount)} HP`;
    const particle: DamageParticle = {
      id: Math.random().toString(),
      text: textStr,
      x: canvas.width * 0.75 + (Math.random() * 30 - 15),
      y: canvas.height * 0.35 + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.7 - Math.random() * 0.4,
      opacity: 1.0,
      scale: isCritical ? 1.4 : 1.0,
      color: isCritical ? "#FFD60A" : "#ff3b30",
      isCritical,
    };

    particlesRef.current.push(particle);
  };

  const executeAttack = async (
    damage: number,
    actionName: string,
    attackType: "attack01" | "attack02" | "attack03" = "attack01"
  ) => {
    if (damage <= 0 || bossState === "dead") return;

    setHeroState(attackType);
    const duration = attackType === "attack03" ? 700 : 500;
    setTimeout(() => {
      setHeroState("idle");
    }, duration);

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
        setBoss((prev) => ({
          ...prev,
          current_hp: data.current_hp,
          status: data.status,
          boss_name: data.boss_name || prev.boss_name,
        }));

        if (data.is_defeated) {
          setBossState("dead");
          addLog(`BOSS DEFEATED! ${boss.boss_name} fell in battle!`, "#00ff41");
          setTimeout(() => {
            fetchBossData();
            setBossState("idle");
          }, 3200);
        } else {
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

  useEffect(() => {
    if (sessionDamage > 0) {
      executeAttack(sessionDamage, "Gym RVS Strike", "attack01");
      addLog(`RVS Gym Attack dealt ${formatNumber(sessionDamage)} damage to ${boss.boss_name}!`, "#00ff41");
    }
  }, [sessionDamage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.005;

        if (p.opacity <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.font = `${p.isCritical ? "bold 20px" : "bold 16px"} 'JetBrains Mono', monospace`;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
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
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4 font-mono">
      <div className="border border-pixel-border bg-surface p-4 space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-health-red animate-pulse" />
            <span className="font-headline font-extrabold text-base text-white uppercase tracking-wider">
              STAGE {boss.stage || 1}: {boss.boss_name}
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

        <div className="relative border border-pixel-border dungeon-bg-stage overflow-hidden flex items-end justify-between px-6 pb-11 pt-12 min-h-[240px]">
          <div className="z-20 relative bottom-1">
            <HeroSprite currentState={heroState} />
          </div>

          <div className="z-20 relative bottom-1">
            <BossSprite
              currentState={bossState}
              currentHp={boss.current_hp}
              maxHp={boss.max_hp}
              flipHorizontal={true}
            />
          </div>

          <div className="dungeon-floor-tile" />

          <canvas
            ref={canvasRef}
            width={520}
            height={240}
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
          />
        </div>
      </div>

      <TacticalSkillBar
        userId={userId}
        equippedSkills={equippedSkills}
        playerStr={playerStr}
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
