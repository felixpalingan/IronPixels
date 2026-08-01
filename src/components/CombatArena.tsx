"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldAlert, Flame, Swords, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/formatters";
import { TacticalSkillBar } from "@/components/TacticalSkillBar";

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

interface BossState {
  boss_id: string;
  boss_name: string;
  current_hp: number;
  max_hp: number;
  status: string;
}

interface CombatArenaProps {
  userId?: string;
  sessionDamage?: number;
}

export function CombatArena({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  sessionDamage = 0,
}: CombatArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<DamageParticle[]>([]);
  const dragonImgRef = useRef<HTMLImageElement | null>(null);
  const bossHitFlashRef = useRef<number>(0);

  const [boss, setBoss] = useState<BossState>({
    boss_id: "b055d7ac-1234-4567-89ab-cdef01234567",
    boss_name: "Shadow Dragon Ignis",
    current_hp: 250000,
    max_hp: 500000,
    status: "Active",
  });

  const [combatLog, setCombatLog] = useState<Array<{ id: string; msg: string; color: string }>>([]);

  useEffect(() => {
    async function fetchBoss() {
      try {
        const res = await fetch("/api/combat/boss");
        if (res.ok) {
          const data = await res.json();
          setBoss(data);
        }
      } catch (err) {
      }
    }
    fetchBoss();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/shadow-dragon.jpeg";
    img.onload = () => {
      dragonImgRef.current = img;
    };
  }, []);

  const spawnDamageParticle = (amount: number, isCritical = false, customText?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const textStr = customText || `-${formatNumber(amount)} HP`;
    const particle: DamageParticle = {
      id: Math.random().toString(),
      text: textStr,
      x: canvas.width / 2 + (Math.random() * 80 - 40),
      y: canvas.height / 2 + (Math.random() * 40 - 20),
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2.5 - Math.random() * 1.5,
      opacity: 1.0,
      scale: isCritical ? 1.4 : 1.0,
      color: isCritical ? "#FFD60A" : "#ff3b30",
      isCritical,
    };

    particlesRef.current.push(particle);
    bossHitFlashRef.current = 10;
  };

  useEffect(() => {
    if (sessionDamage > 0) {
      spawnDamageParticle(sessionDamage, true, `CRITICAL RVS -${formatNumber(sessionDamage)}`);
      setBoss((prev) => ({
        ...prev,
        current_hp: Math.max(0, prev.current_hp - sessionDamage),
      }));
      addLog(`RVS Gym Attack dealt ${formatNumber(sessionDamage)} damage to ${boss.boss_name}!`, "#00ff41");
    }
  }, [sessionDamage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#1F1F23";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const dragonYOffset = Math.sin(tick * 0.05) * 8;
      const dragonWidth = 180;
      const dragonHeight = 160;
      const dragonX = (canvas.width - dragonWidth) / 2;
      const dragonY = (canvas.height - dragonHeight) / 2 + dragonYOffset;

      if (dragonImgRef.current) {
        ctx.save();
        if (bossHitFlashRef.current > 0) {
          ctx.filter = "brightness(2.2) sepia(1) hue-rotate(-50deg)";
          bossHitFlashRef.current--;
        }
        ctx.drawImage(dragonImgRef.current, dragonX, dragonY, dragonWidth, dragonHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = bossHitFlashRef.current > 0 ? "#ff3b30" : "#7d01b1";
        ctx.fillRect(dragonX, dragonY, dragonWidth, dragonHeight);
        if (bossHitFlashRef.current > 0) bossHitFlashRef.current--;
      }

      for (let i = 0; i < 5; i++) {
        const px = dragonX + Math.random() * dragonWidth;
        const py = dragonY + dragonHeight - Math.random() * 30;
        ctx.fillStyle = "rgba(0, 255, 65, 0.4)";
        ctx.fillRect(px, py - (tick % 20), 2, 2);
      }

      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.015;
        p.scale += 0.003;

        if (p.opacity <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.font = `${p.isCritical ? "bold 16px" : "bold 13px"} 'JetBrains Mono', monospace`;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });

      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const addLog = (msg: string, color = "#e5e2e1") => {
    setCombatLog((prev) => [
      { id: Math.random().toString(), msg, color },
      ...prev.slice(0, 4),
    ]);
  };

  const handleSkillCast = (skillName: string, damageDealt: number, newBossHp: number) => {
    spawnDamageParticle(damageDealt, true, `${skillName.toUpperCase()} -${formatNumber(damageDealt)}`);
    setBoss((prev) => ({
      ...prev,
      current_hp: newBossHp,
      status: newBossHp === 0 ? "Defeated" : "Active",
    }));
    addLog(`Casted ${skillName}! Dealt ${formatNumber(damageDealt)} damage to ${boss.boss_name}.`, "#FFD60A");
  };

  const bossHpPercent = Math.min(100, Math.max(0, (boss.current_hp / boss.max_hp) * 100));

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 space-y-4">
      <div className="border border-pixel-border bg-surface p-4 space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-health-red animate-pulse" />
            <span className="font-headline font-extrabold text-base text-white uppercase tracking-wider">
              {boss.boss_name}
            </span>
          </div>

          <span className={`px-2 py-0.5 border font-mono text-[10px] uppercase font-bold ${
            boss.status === "Defeated"
              ? "border-pixel-green text-pixel-green bg-pixel-green/10"
              : "border-health-red text-health-red bg-health-red/10 shadow-red-glow"
          }`}>
            {boss.status}
          </span>
        </div>

        <div>
          <div className="flex justify-between font-mono text-[10px] mb-1">
            <span className="text-health-red font-bold">BOSS HP</span>
            <span className="text-gray-300">
              {formatNumber(boss.current_hp)} / {formatNumber(boss.max_hp)}
            </span>
          </div>
          <div className="w-full h-3.5 bg-black border border-pixel-border overflow-hidden relative">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${bossHpPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-health-red relative shadow-red-glow"
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:4px_100%]" />
            </motion.div>
          </div>
        </div>

        <div className="relative border border-pixel-border bg-black overflow-hidden flex justify-center items-center my-2">
          <canvas
            ref={canvasRef}
            width={520}
            height={260}
            className="w-full h-[240px] block object-contain"
          />
        </div>
      </div>

      <TacticalSkillBar userId={userId} onSkillCast={handleSkillCast} />

      <div className="border border-pixel-border bg-surface p-3 space-y-1.5">
        <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest border-b border-pixel-border/50 pb-1">
          COMBAT LOG
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {combatLog.length === 0 ? (
            <div className="font-mono text-[11px] text-gray-500 italic">
              No battle actions logged yet. Perform gym sets or cast skills to attack!
            </div>
          ) : (
            combatLog.map((log) => (
              <div key={log.id} className="font-mono text-[11px] flex items-center gap-1.5 border-b border-dashed border-pixel-border/30 pb-0.5">
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
