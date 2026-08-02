"use client";

import { useState, useEffect } from "react";
import { Sword, Shield, Flame, Zap, Sparkles } from "lucide-react";

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
  equippedSkills?: Array<{ name: string; icon?: string }>;
  playerStr?: number;
  onSkillCast?: (
    skillName: string,
    damageDealt: number,
    newBossHp: number,
    attackType: "attack01" | "attack02" | "attack03"
  ) => void;
}

export function TacticalSkillBar({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  equippedSkills = [],
  playerStr = 85,
  onSkillCast,
}: TacticalSkillBarProps) {
  const [skills, setSkills] = useState<SkillData[]>([
    {
      skill_id: "s-default-1",
      skill_name: "Heavy Blade Slash",
      damage_multiplier: 2.5,
      cooldown_minutes: 3,
      remaining_seconds: 0,
      is_ready: true,
      icon: "sword",
      attack_type: "attack01",
    },
    {
      skill_id: "s-default-2",
      skill_name: "Shield Thrust Strike",
      damage_multiplier: 1.8,
      cooldown_minutes: 2,
      remaining_seconds: 0,
      is_ready: true,
      icon: "shield",
      attack_type: "attack02",
    },
    {
      skill_id: "s-default-3",
      skill_name: "Flame Arrow Volley",
      damage_multiplier: 4.0,
      cooldown_minutes: 5,
      remaining_seconds: 0,
      is_ready: true,
      icon: "flame",
      attack_type: "attack03",
    },
  ]);

  const [executingSkillId, setExecutingSkillId] = useState<string | null>(null);

  useEffect(() => {
    if (equippedSkills && equippedSkills.length > 0) {
      const generatedFromGear: SkillData[] = equippedSkills.map((sk, idx) => {
        const nameLower = sk.name.toLowerCase();
        let multiplier = 3.5;
        let attackType: "attack01" | "attack02" | "attack03" = "attack01";
        let icon = "sword";

        if (nameLower.includes("void") || nameLower.includes("nova") || nameLower.includes("dragon")) {
          multiplier = 8.5;
          attackType = "attack03";
          icon = "flame";
        } else if (nameLower.includes("plasma") || nameLower.includes("overload")) {
          multiplier = 5.5;
          attackType = "attack02";
          icon = "zap";
        } else if (nameLower.includes("shadow") || nameLower.includes("strike")) {
          multiplier = 4.0;
          attackType = "attack01";
          icon = "sword";
        }

        return {
          skill_id: `s-gear-${idx}-${sk.name}`,
          skill_name: sk.name,
          damage_multiplier: multiplier,
          cooldown_minutes: Math.max(2, Math.floor(multiplier)),
          remaining_seconds: 0,
          is_ready: true,
          icon: sk.icon || icon,
          attack_type: attackType,
        };
      });

      setSkills(generatedFromGear);
    }
  }, [equippedSkills]);

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

    return () => clearInterval(timer);
  }, []);

  const handleCast = async (skill: SkillData) => {
    if (!skill.is_ready || executingSkillId) return;

    setExecutingSkillId(skill.skill_id);

    const baseDmg = playerStr * 20 + Math.floor(Math.random() * 500);
    const calculatedDamage = Math.round(baseDmg * skill.damage_multiplier);

    try {
      const res = await fetch("/api/combat/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          rvs_damage: calculatedDamage,
        }),
      });

      const data = await res.json();

      setSkills((prev) =>
        prev.map((s) =>
          s.skill_id === skill.skill_id
            ? {
                ...s,
                is_ready: false,
                remaining_seconds: s.cooldown_minutes * 60,
              }
            : s
        )
      );

      if (onSkillCast) {
        onSkillCast(
          skill.skill_name,
          calculatedDamage,
          data.current_hp || 0,
          skill.attack_type || "attack01"
        );
      }
    } catch (err) {
    } finally {
      setExecutingSkillId(null);
    }
  };

  const formatCd = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case "flame":
        return <Flame className="w-5 h-5 text-amber-400" />;
      case "zap":
        return <Zap className="w-5 h-5 text-sky-400" />;
      case "shield":
        return <Shield className="w-5 h-5 text-sky-400" />;
      default:
        return <Sword className="w-5 h-5 text-[#00ff41]" />;
    }
  };

  return (
    <div className="border border-pixel-border bg-surface p-3 space-y-2 font-mono">
      <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest border-b border-pixel-border/50 pb-1">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
          EQUIPPED TACTICAL SKILLS
        </span>
        <span className="text-pixel-green font-bold">POWER: STR {playerStr}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {skills.map((skill) => {
          const isExecuting = executingSkillId === skill.skill_id;
          return (
            <button
              key={skill.skill_id}
              onClick={() => handleCast(skill)}
              disabled={!skill.is_ready || isExecuting}
              className={`p-2 border.2 relative flex flex-col items-center justify-center gap-1.5 transition-all ${
                skill.is_ready
                  ? "border-[#00ff41] bg-black hover:bg-[#00ff41]/20 text-white shadow-[0_0_15px_rgba(0,255,65,0.2)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                {getIconComponent(skill.icon)}
              </div>

              <div className="text-[10px] font-bold text-center line-clamp-1 uppercase">
                {skill.skill_name}
              </div>

              <div className="text-[9px] text-[#00ff41] font-bold">
                {skill.damage_multiplier}x DMG
              </div>

              {!skill.is_ready && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-xs font-bold text-health-red">
                  <span>COOLDOWN</span>
                  <span>{formatCd(skill.remaining_seconds)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
