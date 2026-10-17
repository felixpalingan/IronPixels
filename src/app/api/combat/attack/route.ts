import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildFloorEnemy, getRewardsForFloor, getEnemyForFloor } from "@/lib/bossState";
import { EQUIPMENT_DICTIONARY } from "@/lib/equipment";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = user.id;

    const body = await request.json();
    const { action, party_id, rvs_damage, mode = "solo", floor } = body;

    // Fetch attacker username
    let attackerUsername = "Warrior";
    try {
      const { data: profRec } = await supabase
        .from("profiles")
        .select("username")
        .or(`id.eq.${currentUserId},user_id.eq.${currentUserId}`)
        .limit(1);
      if (profRec && profRec.length > 0) {
        attackerUsername = profRec[0].username || "Warrior";
      }
    } catch (e) {}

    // Handle distribute_party_loot action
    if (action === "distribute_party_loot" && floor) {
      try {
        // Resolve party
        let resolvedPid = party_id;
        if (!resolvedPid) {
          const { data: mRec } = await supabase
            .from("Party_Members")
            .select("party_id")
            .eq("user_id", currentUserId)
            .limit(1);
          if (mRec && mRec.length > 0) resolvedPid = mRec[0].party_id;
        }

        if (resolvedPid) {
          const { data: members } = await supabase
            .from("Party_Members")
            .select("user_id")
            .eq("party_id", resolvedPid);

          if (members && members.length > 0) {
            const lootPool = EQUIPMENT_DICTIONARY.filter(
              (i) => i.rarity === "rare" || i.rarity === "epic" || i.rarity === "legendary" || i.rarity === "mythic"
            );
            const rewards = getRewardsForFloor(floor, "boss", "party");

            for (const m of members) {
              const rewardItem = lootPool[Math.floor(Math.random() * lootPool.length)] || EQUIPMENT_DICTIONARY[0];
              try {
                await supabase.from("user_inventory").insert({
                  user_id: m.user_id,
                  item_id: rewardItem.item_id,
                  item_data: rewardItem,
                  is_equipped: false,
                });
              } catch (e) {}

              // Award gold and exp
              try {
                const { data: profData } = await supabase
                  .from("profiles")
                  .select("gold, exp, max_exp, level, available_ap")
                  .or(`id.eq.${m.user_id},user_id.eq.${m.user_id}`)
                  .limit(1);

                if (profData && profData.length > 0) {
                  const p = profData[0];
                  let newExp = (p.exp || 0) + rewards.exp;
                  let newLevel = p.level || 1;
                  let newMaxExp = p.max_exp || 1000;
                  let newAp = p.available_ap || 0;

                  while (newExp >= newMaxExp) {
                    newExp -= newMaxExp;
                    newLevel += 1;
                    newMaxExp = Math.round(newMaxExp * 1.5);
                    newAp += 5;
                  }

                  await supabase
                    .from("profiles")
                    .update({
                      gold: (p.gold || 0) + rewards.gold,
                      exp: newExp,
                      max_exp: newMaxExp,
                      level: newLevel,
                      available_ap: newAp,
                    })
                    .or(`id.eq.${m.user_id},user_id.eq.${m.user_id}`);
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      return NextResponse.json({ success: true, action: "distribute_party_loot" });
    }

    if (!rvs_damage || rvs_damage <= 0) {
      return NextResponse.json(
        { error: "Valid rvs_damage > 0 is required." },
        { status: 400 }
      );
    }

    let bossKey = `solo_${currentUserId}`;
    let resolvedPartyId = party_id;

    if (mode === "party") {
      if (!resolvedPartyId) {
        const { data: memberRec } = await supabase
          .from("Party_Members")
          .select("party_id")
          .eq("user_id", currentUserId)
          .limit(1);

        if (memberRec && memberRec.length > 0) {
          resolvedPartyId = memberRec[0].party_id;
        } else {
          const { data: leaderRec } = await supabase
            .from("Party")
            .select("party_id")
            .eq("leader_id", currentUserId)
            .limit(1);

          if (leaderRec && leaderRec.length > 0) {
            resolvedPartyId = leaderRec[0].party_id;
          }
        }
      }

      if (resolvedPartyId) {
        bossKey = `party_${resolvedPartyId}`;
      } else {
        bossKey = `party_solo_${currentUserId}`;
      }
    }

    // 1. Resolve current floor & authoritatively saved enemy HP
    let currentFloor = 1;
    let savedEnemyHp: number | null = null;

    if (mode === "party" && resolvedPartyId) {
      const { data: partyRec } = await supabase
        .from("Party")
        .select("total_party_floor, current_boss_hp")
        .eq("party_id", resolvedPartyId)
        .single();
      currentFloor = partyRec?.total_party_floor || 1;
      if (partyRec?.current_boss_hp !== undefined && partyRec?.current_boss_hp !== null) {
        savedEnemyHp = Number(partyRec.current_boss_hp);
      }
    } else {
      const { data: profRec } = await supabase
        .from("profiles")
        .select("max_floor, dungeon_enemy_hp")
        .or(`id.eq.${currentUserId},user_id.eq.${currentUserId}`)
        .single();
      currentFloor = profRec?.max_floor || 1;
      if (profRec?.dungeon_enemy_hp !== undefined && profRec?.dungeon_enemy_hp !== null) {
        savedEnemyHp = Number(profRec.dungeon_enemy_hp);
      }
    }

    // 2. Fetch canonical current enemy from dungeon_bosses
    const { data: stageRows } = await supabase
      .from("dungeon_bosses")
      .select("*")
      .eq("stage", currentFloor)
      .limit(1);

    const currentEnemy = stageRows?.[0] || buildFloorEnemy(currentFloor, mode);
    const maxHp = Number(mode === "party" ? currentEnemy.max_hp * 2 : currentEnemy.max_hp);

    // SERVER-AUTHORITATIVE HP:
    // Determine the true starting HP from the server database ONLY.
    // If savedEnemyHp is null or not found, the enemy starts at full maxHp.
    // Client-supplied body.current_hp is strictly ignored to prevent cheat injection.
    const prevHp = savedEnemyHp !== null ? Math.min(maxHp, Math.max(0, savedEnemyHp)) : maxHp;

    if (prevHp <= 0) {
      return NextResponse.json({
        success: true,
        boss_id: currentEnemy.boss_id || (currentEnemy as any).enemy_id || `floor-${currentFloor}`,
        boss_name: currentEnemy.boss_name || (currentEnemy as any).display_name,
        boss_type: currentEnemy.sprite_config?.spriteKey || "imp",
        stage: currentFloor,
        rvs_damage_dealt: 0,
        current_hp: 0,
        max_hp: maxHp,
        is_defeated: true,
        status: "Defeated",
        category: currentEnemy.category || "mob",
        sprite_config: currentEnemy.sprite_config,
        mode,
        attacker_username: attackerUsername,
        message: "Enemy already defeated on this floor.",
      });
    }

    // Security bounds: cap single attack damage to prevent arbitrary client payload manipulation
    const MAX_SINGLE_HIT_DAMAGE = 25000;
    const dmg = Math.min(MAX_SINGLE_HIT_DAMAGE, Math.max(1, Math.round(Number(rvs_damage) || 0)));
    const newHp = Math.max(0, prevHp - dmg);
    const isDefeated = newHp === 0;

    if (isDefeated) {
      const nextFloor = currentFloor + 1;
      const isBossFloor = currentFloor % 5 === 0;
      const clearedCategory = currentEnemy.category || (isBossFloor ? "boss" : "mob");
      const rewards = getRewardsForFloor(currentFloor, clearedCategory, mode);

      // Fetch user profile for reward distribution
      const { data: profRows } = await supabase
        .from("profiles")
        .select("gold, exp, max_exp, level, available_ap")
        .or(`id.eq.${currentUserId},user_id.eq.${currentUserId}`)
        .limit(1);

      const userProf = profRows?.[0];
      const currentGold = Number(userProf?.gold ?? 500);
      const currentExp = Number(userProf?.exp ?? 0);
      let currentMaxExp = Number(userProf?.max_exp ?? 1000);
      let currentLevel = Number(userProf?.level ?? 1);
      let currentAp = Number(userProf?.available_ap ?? 0);
      let leveledUp = false;

      const newGold = currentGold + rewards.gold;
      let newExp = currentExp + rewards.exp;
      while (newExp >= currentMaxExp) {
        newExp -= currentMaxExp;
        currentLevel += 1;
        currentMaxExp = Math.round(currentMaxExp * 1.5);
        currentAp += 5;
        leveledUp = true;
      }

      // Update solo profile
      if (mode === "solo") {
        try {
          await supabase
            .from("profiles")
            .update({
              max_floor: nextFloor,
              dungeon_enemy_hp: null,
              gold: newGold,
              exp: newExp,
              max_exp: currentMaxExp,
              level: currentLevel,
              available_ap: currentAp,
              updated_at: new Date().toISOString(),
            })
            .or(`id.eq.${currentUserId},user_id.eq.${currentUserId}`);
        } catch (e) {}
      } else if (mode === "party" && resolvedPartyId) {
        try {
          await supabase
            .from("Party")
            .update({
              total_party_floor: nextFloor,
              current_boss_hp: null,
              updated_at: new Date().toISOString(),
            })
            .eq("party_id", resolvedPartyId);

          // Update current attacker's gold and exp
          await supabase
            .from("profiles")
            .update({
              gold: newGold,
              exp: newExp,
              max_exp: currentMaxExp,
              level: currentLevel,
              available_ap: currentAp,
              updated_at: new Date().toISOString(),
            })
            .or(`id.eq.${currentUserId},user_id.eq.${currentUserId}`);

          // Also distribute to all other party members
          const { data: partyMembers } = await supabase
            .from("Party_Members")
            .select("user_id")
            .eq("party_id", resolvedPartyId);

          if (partyMembers && partyMembers.length > 0) {
            const others = partyMembers.filter((m) => m.user_id !== currentUserId);
            for (const m of others) {
              const { data: mProfRows } = await supabase
                .from("profiles")
                .select("gold, exp, max_exp, level, available_ap")
                .or(`id.eq.${m.user_id},user_id.eq.${m.user_id}`)
                .limit(1);

              if (mProfRows && mProfRows.length > 0) {
                const mp = mProfRows[0];
                let mExp = (mp.exp || 0) + rewards.exp;
                let mLevel = mp.level || 1;
                let mMaxExp = mp.max_exp || 1000;
                let mAp = mp.available_ap || 0;
                while (mExp >= mMaxExp) {
                  mExp -= mMaxExp;
                  mLevel += 1;
                  mMaxExp = Math.round(mMaxExp * 1.5);
                  mAp += 5;
                }

                await supabase
                  .from("profiles")
                  .update({
                    gold: (mp.gold || 0) + rewards.gold,
                    exp: mExp,
                    max_exp: mMaxExp,
                    level: mLevel,
                    available_ap: mAp,
                  })
                  .or(`id.eq.${m.user_id},user_id.eq.${m.user_id}`);
              }
            }
          }
        } catch (e) {}
      }

      // Authoritative item loot drop on boss floor or 25% chance on mob floor
      let droppedItemRecord: any = null;
      const shouldDropLoot = isBossFloor || Math.random() < 0.25;

      if (shouldDropLoot) {
        const lootPool = isBossFloor
          ? EQUIPMENT_DICTIONARY.filter(
              (i) => i.rarity === "rare" || i.rarity === "epic" || i.rarity === "legendary" || i.rarity === "mythic"
            )
          : EQUIPMENT_DICTIONARY;

        const rewardItem = lootPool[Math.floor(Math.random() * lootPool.length)] || EQUIPMENT_DICTIONARY[0];

        try {
          const { data: insertedInv } = await supabase
            .from("user_inventory")
            .insert({
              user_id: currentUserId,
              item_id: rewardItem.item_id,
              is_equipped: false,
            })
            .select("inventory_id, user_id, item_id, is_equipped")
            .single();

          if (insertedInv) {
            droppedItemRecord = {
              inventory_id: insertedInv.inventory_id,
              user_id: currentUserId,
              item_id: rewardItem.item_id,
              is_equipped: false,
              item: rewardItem,
            };
          }
        } catch (e) {
          console.error("Failed to insert dropped loot item:", e);
        }
      }

      const { data: nextStageRows } = await supabase
        .from("dungeon_bosses")
        .select("*")
        .eq("stage", nextFloor)
        .limit(1);

      const nextEnemy = nextStageRows?.[0]
        ? {
            display_name: nextStageRows[0].boss_name,
            floor: nextStageRows[0].stage,
            current_hp: Number(mode === "party" ? nextStageRows[0].max_hp * 2 : nextStageRows[0].max_hp),
            max_hp: Number(mode === "party" ? nextStageRows[0].max_hp * 2 : nextStageRows[0].max_hp),
            category: nextStageRows[0].category,
            sprite_config: nextStageRows[0].sprite_config,
          }
        : buildFloorEnemy(nextFloor, mode);

      return NextResponse.json({
        success: true,
        boss_id: (nextEnemy as any).enemy_id || (nextEnemy as any).boss_id || `floor-${nextFloor}`,
        boss_name: (nextEnemy as any).display_name || (nextEnemy as any).boss_name,
        boss_type: nextEnemy.sprite_config?.spriteKey || "imp",
        stage: nextFloor,
        cleared_floor: currentFloor,
        was_boss: isBossFloor,
        rvs_damage_dealt: dmg,
        current_hp: nextEnemy.current_hp,
        max_hp: nextEnemy.max_hp,
        is_defeated: true,
        status: "Active",
        category: nextEnemy.category,
        sprite_config: nextEnemy.sprite_config,
        mode,
        attacker_username: attackerUsername,
        rewards: {
          gold: rewards.gold,
          exp: rewards.exp,
          leveled_up: leveledUp,
          new_level: currentLevel,
          dropped_item: droppedItemRecord,
        },
        user_stats: {
          gold: newGold,
          exp: newExp,
          max_exp: currentMaxExp,
          level: currentLevel,
          available_ap: currentAp,
          max_floor: nextFloor,
        },
      });
    }

    // Persist damaged enemy HP to DB so page refresh never resets enemy health
    if (mode === "solo") {
      try {
        await supabase
          .from("profiles")
          .update({
            dungeon_enemy_hp: newHp,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${currentUserId},user_id.eq.${currentUserId}`);
      } catch (e) {}
    } else if (mode === "party" && resolvedPartyId) {
      try {
        await supabase
          .from("Party")
          .update({
            current_boss_hp: newHp,
            updated_at: new Date().toISOString(),
          })
          .eq("party_id", resolvedPartyId);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      boss_id: currentEnemy.boss_id || (currentEnemy as any).enemy_id || `floor-${currentFloor}`,
      boss_name: currentEnemy.boss_name || (currentEnemy as any).display_name,
      boss_type: currentEnemy.sprite_config?.spriteKey || "imp",
      stage: currentFloor,
      rvs_damage_dealt: dmg,
      current_hp: newHp,
      max_hp: Number(currentEnemy.max_hp),
      is_defeated: false,
      status: "Active",
      category: currentEnemy.category || "mob",
      sprite_config: currentEnemy.sprite_config,
      mode,
      attacker_username: attackerUsername,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute combat attack." },
      { status: 500 }
    );
  }
}

