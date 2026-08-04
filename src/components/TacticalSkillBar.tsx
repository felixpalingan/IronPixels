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
  equippedSkills = [],
  onSkillCast,
}: TacticalSkillBarProps) {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [executingSkillId, setExecutingSkillId] = useState<string | null>(null);

  const baseCombatPower = Math.round((dailyRvs > 0 ? dailyRvs : 50) + playerStr);

  const getSavedSlotCdSecs = (slotKey: string) => {
    try {
      const cdUntil = localStorage.getItem(`ironpixels_slot_cd_${slotKey}`);
      if (!cdUntil) return 0;
      const remainingMs = Number(cdUntil) - Date.now();
      return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    let sourceSkills = equippedSkills;

    if (!sourceSkills || sourceSkills.length === 0) {
      sourceSkills = [
        { name: "Heavy Iron Slash", icon: "/assets/skills/swordsman/Icon1.png", slotType: "weapon" },
        { name: "Novice Shield Thrust", icon: "/assets/skills/swordsman/Icon2.png", slotType: "armor" },
        { name: "Copper Lucky Charm", icon: "/assets/skills/undead/Icon3.png", slotType: "accessory" },
        { name: "Iron Power Surge", icon: "/assets/skills/swordsman/Icon8.png", slotType: "accessory" },
      ];
    }

    let accCount = 0;
    const generated: SkillData[] = sourceSkills.map((sk, idx) => {
      const type = sk.slotType || (idx === 0 ? "weapon" : idx === 1 ? "armor" : "accessory");
      let slotKey: string = type;
      if (type === "accessory") {
        accCount += 1;
        slotKey = `accessory_${accCount}`;
      }

      const nameLower = sk.name.toLowerCase();
      let multiplier = 2.0;
      let attackType: "attack01" | "attack02" | "attack03" = "attack01";
      let cdMins = 3;

      if (type === "weapon") {
        multiplier = 5.0;
        attackType = "attack03";
        cdMins = 4;
        if (nameLower.includes("void") || nameLower.includes("singularity") || nameLower.includes("excalibur")) {
          multiplier = 6.5;
        }
      } else if (type === "armor") {
        multiplier = 3.5;
        attackType = "attack02";
        cdMins = 3;
      } else {
        multiplier = 2.0;
        attackType = "attack01";
        cdMins = 2;
      }

      const iconUrl = sk.icon || `/assets/skills/swordsman/Icon${idx + 1}.png`;
      const cdSecs = getSavedSlotCdSecs(slotKey);

      return {
        skill_id: `s-slot-${slotKey}-${sk.name}`,
        skill_name: sk.name,
        slotType: type,
        damage_multiplier: multiplier,
        cooldown_minutes: cdMins,
        remaining_seconds: cdSecs,
        is_ready: cdSecs === 0,
        icon_url: iconUrl,
        attack_type: attackType,
      };
    });

    setSkills(generated);
  }, [equippedSkills]);

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
  }, []);

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
      localStorage.setItem(`ironpixels_slot_cd_${slotKey}`, (Date.now() + cdMs).toString());
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
      const res = await fetch("/api/combat/execute-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          skill_id: skill.skill_id,
          calculated_damage: calculatedDamage,
          cooldown_minutes: skill.cooldown_minutes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (onSkillCast) {
          onSkillCast(
            skill.skill_name,
            calculatedDamage,
            data.new_boss_hp,
            skill.attack_type || "attack01"
          );
        }
      }
    } catch (err) {
      if (onSkillCast) {
        onSkillCast(skill.skill_name, calculatedDamage, 0, skill.attack_type || "attack01");
      }
    } finally {
      setExecutingSkillId(null);
    }
  };

  const formatCdTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border border-pixel-border bg-surface p-3 space-y-2.5 font-mono select-none shadow-neon">
      <div className="flex items-center justify-between border-b border-pixel-border/50 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-gold-loot animate-pulse" />
          <span>TACTICAL GEAR SKILLS (4 SLOTS)</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-bold">
          WEAPON & ARMOR SLOTS HIGH DMG
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {skills.map((sk, idx) => {
          return (
            <button
              key={`${sk.skill_id}-${idx}`}
              onClick={() => handleCast(sk, idx)}
              disabled={!sk.is_ready || Boolean(executingSkillId)}
              className={`p-1.5 border flex flex-col items-center justify-between text-center relative transition-all cursor-pointer ${
                sk.is_ready
                  ? sk.slotType === "weapon"
                    ? "border-[#00ff41] bg-black/90 hover:bg-[#00ff41]/20 text-white shadow-neon"
                    : sk.slotType === "armor"
                    ? "border-sky-400 bg-black/90 hover:bg-sky-400/20 text-white shadow-blue-glow"
                    : "border-amber-400 bg-black/90 hover:bg-amber-400/20 text-white shadow-gold-glow"
                  : "border-zinc-800 bg-black/40 text-zinc-600 opacity-60 cursor-not-allowed"
              }`}
            >
              {!sk.is_ready && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-0.5">
                  <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">
                    COOLDOWN
                  </div>
                  <div className="font-headline font-black text-xs text-red-500 tracking-wider">
                    {formatCdTime(sk.remaining_seconds)}
                  </div>
                </div>
              )}

              <div className="w-9 h-9 bg-black border border-pixel-border p-1 flex items-center justify-center relative mb-1 shadow-neon">
                {sk.icon_url ? (
                  <img
                    src={sk.icon_url}
                    alt={sk.skill_name}
                    className="w-7 h-7 object-contain pixelated"
                  />
                ) : (
                  <Zap className="w-4 h-4 text-[#00ff41]" />
                )}

                <span
                  className={`absolute -top-1.5 -right-1.5 font-extrabold text-[7px] px-1 uppercase ${
                    sk.slotType === "weapon"
                      ? "bg-[#00ff41] text-black"
                      : sk.slotType === "armor"
                      ? "bg-sky-400 text-black"
                      : "bg-amber-400 text-black"
                  }`}
                >
                  {sk.slotType === "weapon" ? "WPN" : sk.slotType === "armor" ? "ARM" : `ACC`}
                </span>
              </div>

              <div className="space-y-0.5 w-full">
                <div className="font-headline font-extrabold text-[9px] text-white uppercase tracking-tight line-clamp-1">
                  {sk.skill_name}
                </div>

                <div
                  className={`text-[8px] font-extrabold ${
                    sk.slotType === "weapon"
                      ? "text-[#00ff41]"
                      : sk.slotType === "armor"
                      ? "text-sky-400"
                      : "text-amber-400"
                  }`}
                >
                  {sk.damage_multiplier}x DMG
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
