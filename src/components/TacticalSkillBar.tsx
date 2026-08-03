"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
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

  const GOD_MODE_TEST_BONUS = 25000;
  const baseCombatPower = Math.round((dailyRvs > 0 ? dailyRvs : 50) + playerStr + GOD_MODE_TEST_BONUS);

  const getSavedSlotCdSecs = (slotType: string) => {
    try {
      const cdUntil = localStorage.getItem(`ironpixels_slot_cd_${slotType}`);
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
        { name: "Heavy Iron Slash", icon: "/assets/skills/Icon1.png", slotType: "weapon" },
        { name: "Novice Shield Thrust", icon: "/assets/skills/Icon10.png", slotType: "armor" },
        { name: "Flame Arrow Volley", icon: "/assets/skills/Icon24.png", slotType: "accessory" },
      ];
    }

    const SKILL_ICON_POOL = [
      "/assets/skills/Icon1.png",
      "/assets/skills/Icon10.png",
      "/assets/skills/Icon24.png",
      "/assets/skills/Icon35.png",
      "/assets/skills/Icon42.png",
      "/assets/skills/Icon7.png",
      "/assets/skills/Icon15.png",
      "/assets/skills/Icon28.png",
    ];

    const generated: SkillData[] = sourceSkills.map((sk, idx) => {
      const slot = sk.slotType || (idx === 0 ? "weapon" : idx === 1 ? "armor" : "accessory");
      const nameLower = sk.name.toLowerCase();
      let multiplier = 2.5;
      let attackType: "attack01" | "attack02" | "attack03" = "attack01";
      let cdMins = 3;
      let iconUrl = SKILL_ICON_POOL[idx % SKILL_ICON_POOL.length];

      if (nameLower.includes("void") || nameLower.includes("nova") || nameLower.includes("dragon")) {
        multiplier = 4.5;
        attackType = "attack03";
        cdMins = 5;
        iconUrl = "/assets/skills/Icon42.png";
      } else if (nameLower.includes("plasma") || nameLower.includes("overload")) {
        multiplier = 3.5;
        attackType = "attack02";
        cdMins = 4;
        iconUrl = "/assets/skills/Icon35.png";
      } else if (nameLower.includes("shadow") || nameLower.includes("strike")) {
        multiplier = 2.8;
        attackType = "attack01";
        cdMins = 3;
        iconUrl = "/assets/skills/Icon7.png";
      } else if (nameLower.includes("shield") || nameLower.includes("defender")) {
        multiplier = 2.2;
        attackType = "attack01";
        cdMins = 2;
        iconUrl = "/assets/skills/Icon10.png";
      }

      const cdSecs = getSavedSlotCdSecs(slot);

      return {
        skill_id: `s-slot-${slot}-${sk.name}`,
        skill_name: sk.name,
        slotType: slot,
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
      setSkills((prevSkills) =>
        prevSkills.map((sk) => {
          const cdSecs = getSavedSlotCdSecs(sk.slotType);
          return {
            ...sk,
            remaining_seconds: cdSecs,
            is_ready: cdSecs === 0,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCast = async (skill: SkillData) => {
    if (!skill.is_ready || executingSkillId) return;

    setExecutingSkillId(skill.skill_id);

    const calculatedDamage = Math.round(baseCombatPower * skill.damage_multiplier);
    const cdMs = skill.cooldown_minutes * 60 * 1000;

    try {
      localStorage.setItem(
        `ironpixels_slot_cd_${skill.slotType}`,
        (Date.now() + cdMs).toString()
      );

      const res = await fetch("/api/combat/execute-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          skill_id: skill.skill_id,
          slot_type: skill.slotType,
          cooldown_minutes: skill.cooldown_minutes,
          damage_multiplier: skill.damage_multiplier,
          base_damage: baseCombatPower,
        }),
      });

      const data = await res.json();

      setSkills((prev) =>
        prev.map((s) =>
          s.slotType === skill.slotType
            ? {
                ...s,
                is_ready: false,
                remaining_seconds: skill.cooldown_minutes * 60,
              }
            : s
        )
      );

      if (onSkillCast) {
        onSkillCast(
          skill.skill_name,
          calculatedDamage,
          data.boss_current_hp || 0,
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

  return (
    <div className="border border-pixel-border bg-surface p-3 space-y-2 font-mono">
      <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest border-b border-pixel-border/50 pb-1">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#00ff41]" />
          EQUIPPED GEAR SKILLS (SLOT COOLDOWN)
        </span>
        <span className="text-[#00ff41] font-bold">
          COMBAT POWER: {formatNumber(baseCombatPower)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {skills.map((skill) => {
          const isExecuting = executingSkillId === skill.skill_id;
          const projectedSkillDmg = Math.round(baseCombatPower * skill.damage_multiplier);
          const isDisabled = !skill.is_ready || isExecuting;

          return (
            <button
              key={skill.skill_id}
              onClick={() => handleCast(skill)}
              disabled={isDisabled}
              className={`p-2 border-2 relative flex flex-col items-center justify-center gap-1.5 transition-all ${
                !isDisabled
                  ? "border-[#00ff41] bg-black hover:bg-[#00ff41]/20 text-white shadow-[0_0_15px_rgba(0,255,65,0.2)] cursor-pointer"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <div className="w-9 h-9 flex items-center justify-center bg-black/60 border border-pixel-border/60 p-1">
                <img
                  src={skill.icon_url}
                  alt={skill.skill_name}
                  className="w-7 h-7 object-contain pixelated"
                />
              </div>

              <div className="text-[10px] font-bold text-center line-clamp-1 uppercase">
                {skill.skill_name}
              </div>

              <div className="text-[8px] text-zinc-400 uppercase font-bold">
                SLOT: {skill.slotType}
              </div>

              <div className="text-[9px] text-[#00ff41] font-bold">
                {skill.damage_multiplier}x ({formatNumber(projectedSkillDmg)} DMG)
              </div>

              {!skill.is_ready && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-xs font-bold text-health-red">
                  <span className="text-[9px]">SLOT COOLDOWN</span>
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
