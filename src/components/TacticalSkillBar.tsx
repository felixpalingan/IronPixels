"use client";

import { useState, useEffect } from "react";
import { Sparkles, Zap } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

export interface SkillData {
  skill_id: string;
  skill_name: string;
  slotType: "weapon" | "armor" | "accessory";
  damage_multiplier: number;
  cooldown_minutes: number;
  remaining_seconds: number;
  is_ready: boolean;
  icon_url: string;
  attack_type?: "attack01" | "attack02" | "attack03";
}

interface TacticalSkillBarProps {
  userId?: string;
  dailyRvs?: number;
  playerStr?: number;
  mode?: "solo" | "party";
  equippedSkills?: Array<{ name: string; icon?: string; slotType?: "weapon" | "armor" | "accessory" }>;
  onSkillCast?: (
    skillName: string,
    damageDealt: number,
    newBossHp: number,
    attackType: "attack01" | "attack02" | "attack03"
  ) => void;
}

export function TacticalSkillBar({
  userId = "e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  dailyRvs = 0,
  playerStr = 85,
  mode = "solo",
  equippedSkills = [],
  onSkillCast,
}: TacticalSkillBarProps) {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [executingSkillId, setExecutingSkillId] = useState<string | null>(null);

  const baseCombatPower = Math.round((dailyRvs > 0 ? dailyRvs : 50) + playerStr);

  const getSavedSlotCdSecs = (slotKey: string) => {
    try {
      const cdUntil = localStorage.getItem(`ironpixels_slot_cd_${mode}_${slotKey}`);
      if (!cdUntil) return 0;
      const remainingMs = Number(cdUntil) - Date.now();
      return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    let sourceSkills = equippedSkills && equippedSkills.length > 0 ? equippedSkills.slice(0, 4) : [
      { name: "Heavy Iron Slash", icon: "/assets/skills/swordsman/Icon1.png", slotType: "weapon" as const },
      { name: "Novice Shield Thrust", icon: "/assets/skills/swordsman/Icon2.png", slotType: "armor" as const },
      { name: "Copper Lucky Charm", icon: "/assets/skills/undead/Icon3.png", slotType: "accessory" as const },
      { name: "Iron Power Surge", icon: "/assets/skills/swordsman/Icon8.png", slotType: "accessory" as const },
    ];

    let accCount = 0;
    const generated: SkillData[] = sourceSkills.slice(0, 4).map((sk, idx) => {
      const type = sk.slotType || (idx === 0 ? "weapon" : idx === 1 ? "armor" : "accessory");
      let slotKey: string = type;
      if (type === "accessory") {
        accCount += 1;
        slotKey = `accessory_${accCount}`;
      }

      let multiplier = 2.0;
      let attackType: "attack01" | "attack02" | "attack03" = "attack01";
      let cdMins = 3;

      if (type === "weapon") {
        multiplier = 5.0;
        attackType = "attack03";
        cdMins = 4;
      } else if (type === "armor") {
        multiplier = 3.2;
        attackType = "attack02";
        cdMins = 3;
      } else {
        multiplier = 2.2;
        attackType = "attack01";
        cdMins = 2;
      }

      const cdSecs = getSavedSlotCdSecs(slotKey);

      return {
        skill_id: `sk-${mode}-${slotKey}-${idx}`,
        skill_name: sk.name,
        slotType: type,
        damage_multiplier: multiplier,
        cooldown_minutes: cdMins,
        remaining_seconds: cdSecs,
        is_ready: cdSecs === 0,
        icon_url: sk.icon || "/assets/skills/swordsman/Icon1.png",
        attack_type: attackType,
      };
    });

    setSkills(generated);
  }, [equippedSkills, mode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSkills((prevSkills) => {
        let accCount = 0;
        return prevSkills.map((sk) => {
          let slotKey: string = sk.slotType;
          if (sk.slotType === "accessory") {
            accCount += 1;
            slotKey = `accessory_${accCount}`;
          }
          const cdSecs = getSavedSlotCdSecs(slotKey);
          return {
            ...sk,
            remaining_seconds: cdSecs,
            is_ready: cdSecs === 0,
          };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  const handleCast = async (skill: SkillData, index: number) => {
    if (!skill.is_ready || executingSkillId) return;

    let slotKey = skill.slotType as string;
    if (skill.slotType === "accessory") {
      const accIndex = skills.slice(0, index + 1).filter((s) => s.slotType === "accessory").length;
      slotKey = `accessory_${accIndex}`;
    }

    setExecutingSkillId(skill.skill_id);

    const calculatedDamage = Math.round(baseCombatPower * skill.damage_multiplier);
    const cdMs = skill.cooldown_minutes * 60 * 1000;

    try {
      localStorage.setItem(`ironpixels_slot_cd_${mode}_${slotKey}`, (Date.now() + cdMs).toString());
    } catch (e) {}

    setSkills((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          return {
            ...s,
            remaining_seconds: skill.cooldown_minutes * 60,
            is_ready: false,
          };
        }
        return s;
      })
    );

    try {
      await fetch("/api/combat/execute-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          skill_id: skill.skill_id,
          calculated_damage: calculatedDamage,
          cooldown_minutes: skill.cooldown_minutes,
          mode,
        }),
      });
    } catch (err) {}

    if (onSkillCast) {
      onSkillCast(skill.skill_name, calculatedDamage, 0, skill.attack_type || "attack01");
    }

    setTimeout(() => {
      setExecutingSkillId(null);
    }, 600);
  };

  const formatCdTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="border border-pixel-border bg-surface p-3 space-y-2 font-mono">
      <div className="flex items-center justify-between border-b border-pixel-border/50 pb-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-[#00ff41]" />
          <span>EQUIPPED GEAR SKILLS ({mode.toUpperCase()} COOLDOWNS)</span>
        </div>
        <span className="text-zinc-500 text-[9px]">4 SLOTS MAX</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {skills.map((skill, index) => {
          const isSlotExecuting = executingSkillId === skill.skill_id;

          return (
            <button
              key={skill.skill_id}
              onClick={() => handleCast(skill, index)}
              disabled={!skill.is_ready || Boolean(executingSkillId)}
              className={`relative border p-2 flex flex-col items-center justify-between min-h-[96px] transition-all overflow-hidden ${
                skill.is_ready
                  ? "border-[#00ff41] bg-black hover:bg-[#00ff41]/10 text-white cursor-pointer shadow-neon hover:scale-102"
                  : "border-zinc-800 bg-black/60 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <div className="w-9 h-9 border border-pixel-border bg-surface p-1 flex items-center justify-center relative">
                <img
                  src={skill.icon_url}
                  alt={skill.skill_name}
                  className={`w-full h-full object-contain pixelated ${
                    !skill.is_ready ? "grayscale opacity-40" : ""
                  }`}
                />

                {isSlotExecuting && (
                  <div className="absolute inset-0 bg-[#00ff41]/40 animate-ping" />
                )}
              </div>

              <div className="text-center w-full my-1">
                <div className="text-[9px] font-bold text-white uppercase truncate px-0.5">
                  {skill.skill_name}
                </div>
                <div className="text-[8px] text-zinc-400 font-extrabold uppercase">
                  {skill.slotType} ({skill.damage_multiplier}x)
                </div>
              </div>

              <div className="w-full">
                {skill.is_ready ? (
                  <div className="bg-[#00ff41]/20 border border-[#00ff41]/60 text-[#00ff41] text-[8px] font-extrabold uppercase py-0.5 text-center shadow-neon">
                    READY
                  </div>
                ) : (
                  <div className="bg-red-950/40 border border-red-900 text-red-400 text-[8px] font-extrabold py-0.5 text-center">
                    CD {formatCdTime(skill.remaining_seconds)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
