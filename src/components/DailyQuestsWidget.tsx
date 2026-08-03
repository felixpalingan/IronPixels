"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Dumbbell, Swords, ShieldCheck, Gift, Coins, Sparkles } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: "gym" | "boss" | "survival";
  currentProgress: number;
  maxProgress: number;
  rewardGold: number;
  rewardExp: number;
}

interface DailyQuestsWidgetProps {
  dailyRvs?: number;
  currentHp?: number;
  maxHp?: number;
  onClaimReward: (reward: { gold: number; exp: number }) => void;
}

export function DailyQuestsWidget({
  dailyRvs = 0,
  currentHp = 1000,
  maxHp = 1000,
  onClaimReward,
}: DailyQuestsWidgetProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ironpixels_claimed_quests_${todayStr}`);
      if (saved) {
        setClaimedQuests(JSON.parse(saved));
      }
    } catch (e) {}
  }, [todayStr]);

  const saveClaimed = (updated: Record<string, boolean>) => {
    setClaimedQuests(updated);
    try {
      localStorage.setItem(`ironpixels_claimed_quests_${todayStr}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 100;
  const isGymDone = dailyRvs > 0;
  const isBossDone = dailyRvs >= 300;
  const isSurvivalDone = hpPercent >= 50;

  const QUESTS: DailyQuest[] = [
    {
      id: "q_gym",
      title: "Daily Gym Raid",
      description: "Log 1 workout session today",
      icon: "gym",
      currentProgress: isGymDone ? 1 : 0,
      maxProgress: 1,
      rewardGold: 250,
      rewardExp: 200,
    },
    {
      id: "q_boss",
      title: "Boss Raid Striker",
      description: "Deal 300+ RVS damage to dungeon boss",
      icon: "boss",
      currentProgress: Math.min(300, dailyRvs),
      maxProgress: 300,
      rewardGold: 350,
      rewardExp: 500,
    },
    {
      id: "q_survival",
      title: "Iron Survivor",
      description: "Keep Hero HP above 50%",
      icon: "survival",
      currentProgress: isSurvivalDone ? 1 : 0,
      maxProgress: 1,
      rewardGold: 150,
      rewardExp: 150,
    },
  ];

  const handleClaim = (quest: DailyQuest) => {
    if (claimedQuests[quest.id]) return;

    const updated = { ...claimedQuests, [quest.id]: true };
    saveClaimed(updated);

    onClaimReward({
      gold: quest.rewardGold,
      exp: quest.rewardExp,
    });
  };

  const getQuestIcon = (iconType: string) => {
    switch (iconType) {
      case "gym":
        return <Dumbbell className="w-5 h-5 text-[#00ff41]" />;
      case "boss":
        return <Swords className="w-5 h-5 text-health-red" />;
      case "survival":
      default:
        return <ShieldCheck className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="border border-pixel-border bg-surface p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-pixel-border/60 pb-2">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-gold-loot" />
          <span className="font-headline font-extrabold text-sm text-white uppercase tracking-wider">
            DAILY QUESTS & BOUNTIES
          </span>
        </div>

        <span className="text-[10px] text-pixel-green font-bold uppercase tracking-widest">
          RESET DAILY
        </span>
      </div>

      <div className="space-y-2">
        {QUESTS.map((quest) => {
          const isComplete = quest.currentProgress >= quest.maxProgress;
          const isClaimed = Boolean(claimedQuests[quest.id]);

          return (
            <div
              key={quest.id}
              className={`p-3 border flex items-center justify-between gap-3 transition-all ${
                isClaimed
                  ? "border-zinc-800 bg-black/40 opacity-60"
                  : isComplete
                  ? "border-[#00ff41]/60 bg-[#00ff41]/5 shadow-[0_0_15px_rgba(0,255,65,0.1)]"
                  : "border-pixel-border/60 bg-black/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 border border-pixel-border bg-black flex items-center justify-center flex-shrink-0">
                  {getQuestIcon(quest.icon)}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-headline font-extrabold text-xs text-white uppercase tracking-wider line-clamp-1 flex items-center gap-2">
                    <span>{quest.title}</span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      ({formatNumber(quest.currentProgress)} / {formatNumber(quest.maxProgress)})
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1">
                    {quest.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right text-[10px] font-bold">
                  {quest.rewardGold > 0 && <div className="text-gold-loot">+{quest.rewardGold} GOLD</div>}
                  {quest.rewardExp > 0 && <div className="text-exp-blue">+{quest.rewardExp} EXP</div>}
                </div>

                {isClaimed ? (
                  <button
                    disabled
                    className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold uppercase tracking-wider cursor-not-allowed"
                  >
                    CLAIMED
                  </button>
                ) : isComplete ? (
                  <button
                    onClick={() => handleClaim(quest)}
                    className="px-3 py-1 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-headline font-black text-[10px] uppercase tracking-wider shadow-neon cursor-pointer animate-pulse"
                  >
                    CLAIM
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-2.5 py-1 bg-black border border-pixel-border text-zinc-600 text-[10px] font-bold uppercase tracking-wider cursor-not-allowed"
                  >
                    IN PROGRESS
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
