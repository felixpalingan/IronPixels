"use client";

import { useState, useEffect } from "react";
import { Sword, Shield, Flame, Lock } from "lucide-react";
import { motion } from "framer-motion";

export interface SkillData {
  skill_id: string;
  skill_name: string;
  damage_multiplier: number;
  cooldown_minutes: number;
  remaining_seconds: number;
  is_ready: boolean;
  icon?: string;
  attack_type?: "attack01" | "attack02" | "attack03";
}

interface TacticalSkillBarProps {
  userId?: string;
  onSkillCast?: (skillName: string, damageDealt: number, newBossHp: number, attackType: "attack01" | "attack02" | "attack03") => void;
}

export function TacticalSkillBar({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  onSkillCast,
}: TacticalSkillBarProps) {
  const [skills, setSkills] = useState<SkillData[]>([
    {
      skill_id: "11111111-1111-1111-1111-111111111111",
      skill_name: "Heavy Blade Slash",
      damage_multiplier: 2.5,
      cooldown_minutes: 5,
      remaining_seconds: 0,
      is_ready: true,
      icon: "sword",
      attack_type: "attack01",
    },
    {
      skill_id: "22222222-2222-2222-2222-222222222222",
      skill_name: "Shield Thrust Strike",
      damage_multiplier: 1.8,
      cooldown_minutes: 3,
      remaining_seconds: 0,
      is_ready: true,
      icon: "shield",
      attack_type: "attack02",
    },
    {
      skill_id: "33333333-3333-3333-3333-333333333333",
      skill_name: "Flame Arrow Volley",
      damage_multiplier: 4.0,
      cooldown_minutes: 10,
      remaining_seconds: 0,
      is_ready: true,
      icon: "flame",
      attack_type: "attack03",
    },
  ]);

  const [executingSkillId, setExecutingSkillId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch(`/api/combat/skills?user_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setSkills(
              data.map((sk: SkillData) => {
                let attackType: "attack01" | "attack02" | "attack03" = "attack01";
                if (sk.skill_name.toLowerCase().includes("shield") || sk.skill_name.toLowerCase().includes("thrust")) {
                  attackType = "attack02";
                } else if (sk.skill_name.toLowerCase().includes("arrow") || sk.skill_name.toLowerCase().includes("flare")) {
                  attackType = "attack03";
                }
                return { ...sk, attack_type: attackType };
              })
            );
          }
        }
      } catch (err) {
      }
    }
    fetchSkills();
  }, [userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSkills((prevSkills) =>
        prevSkills.map((sk) => {
          if (sk.remaining_seconds > 0) {
            const nextSecs = sk.remaining_seconds - 1;
            return {
              ...sk,
              remaining_seconds: nextSecs,
              is_ready: nextSecs === 0,
            };
          }
          return sk;
        })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCastSkill = async (skill: SkillData) => {
    if (!skill.is_ready || executingSkillId) return;
    setExecutingSkillId(skill.skill_id);

    try {
      const res = await fetch("/api/combat/execute-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          skill_id: skill.skill_id,
          base_damage: 2500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSkills((prev) =>
          prev.map((s) => {
            if (s.skill_id === skill.skill_id) {
              return {
                ...s,
                remaining_seconds: s.cooldown_minutes * 60,
                is_ready: false,
              };
            }
            return s;
          })
        );

        if (onSkillCast) {
          onSkillCast(
            data.skill_name,
            data.damage_dealt,
            data.boss_current_hp,
            skill.attack_type || "attack01"
          );
        }
      }
    } catch (err) {
    } finally {
      setExecutingSkillId(null);
    }
  };

  const formatCd = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-surface border border-pixel-border p-3 my-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-pixel-green uppercase font-bold">
          TACTICAL SKILL BAR
        </span>
        <span className="font-mono text-[9px] text-gray-400">
          COOLDOWN VERIFIED SERVER-SIDE
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {skills.map((sk) => {
          const isCd = !sk.is_ready;
          const isExecuting = executingSkillId === sk.skill_id;

          return (
            <motion.button
              key={sk.skill_id}
              whileTap={{ scale: isCd ? 1 : 0.96 }}
              disabled={isCd || isExecuting}
              onClick={() => handleCastSkill(sk)}
              className={`relative flex flex-col items-center justify-center p-2.5 border transition-all overflow-hidden text-left ${
                isCd
                  ? "border-pixel-border/50 bg-black/60 text-gray-500 cursor-not-allowed"
                  : "border-pixel-green bg-pixel-green/10 text-pixel-green hover:bg-pixel-green/20 shadow-neon cursor-pointer"
              }`}
            >
              {isCd && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 font-mono text-[11px] font-bold text-health-red">
                  <Lock className="w-3.5 h-3.5 mb-1" />
                  <span>{formatCd(sk.remaining_seconds)}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 mb-1">
                {sk.attack_type === "attack01" && <Sword className="w-4 h-4 text-pixel-green" />}
                {sk.attack_type === "attack02" && <Shield className="w-4 h-4 text-exp-blue" />}
                {sk.attack_type === "attack03" && <Flame className="w-4 h-4 text-gold-loot" />}
                <span className="font-headline font-bold text-xs truncate text-white">
                  {sk.skill_name}
                </span>
              </div>

              <div className="w-full flex justify-between font-mono text-[9px] text-gray-400 mt-1">
                <span>{sk.damage_multiplier}x DMG</span>
                <span>{sk.cooldown_minutes}m CD</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
