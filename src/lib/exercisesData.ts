export type MovementType = "compound" | "isolation";

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Cardio";
  difficultyRank: number;
  difficultyLabel: "Novice" | "Intermediate" | "Advanced" | "Master";
  equipment: "Barbell" | "Dumbbell" | "Bodyweight" | "Machine" | "Cable";
  targetMuscles: string[];
  instructions: string[];
  rvsMultiplier: number;
  scalingStat?: "STR" | "AGI";
  movementType?: MovementType;
  isUnilateral?: boolean;
  aliases?: string[];
  isCustom?: boolean;
}

export function getExerciseScalingStat(ex: { category?: string; equipment?: string; scalingStat?: "STR" | "AGI" }): "STR" | "AGI" {
  if (ex.scalingStat) return ex.scalingStat;
  if (ex.equipment === "Bodyweight" || ex.category === "Cardio" || ex.category === "Core") {
    return "AGI";
  }
  return "STR";
}

export function getExerciseMovementType(ex: {
  category?: string;
  movementType?: MovementType;
  name?: string;
  equipment?: string;
}): MovementType {
  if (ex.movementType) return ex.movementType;
  const name = (ex.name || "").toLowerCase();
  const category = (ex.category || "").toLowerCase();

  // Known multi-joint compound patterns (even if placed under Arms, Core, or Shoulders)
  if (
    name.includes("dip") ||
    name.includes("bench press") ||
    name.includes("pushup") ||
    name.includes("push-up") ||
    name.includes("pullup") ||
    name.includes("pull-up") ||
    name.includes("chin-up") ||
    name.includes("chin up") ||
    name.includes("muscle-up") ||
    name.includes("muscle up") ||
    name.includes("squat") ||
    name.includes("deadlift") ||
    name.includes("row") ||
    name.includes("overhead press") ||
    name.includes("shoulder press") ||
    name.includes("military press") ||
    name.includes("arnold press") ||
    name.includes("clean") ||
    name.includes("snatch")
  ) {
    if (
      !name.includes("french press") &&
      !name.includes("pressdown") &&
      !name.includes("pushdown") &&
      !name.includes("pec deck")
    ) {
      return "compound";
    }
  }

  if (category === "arms") return "isolation";
  if (
    name.includes("curl") ||
    name.includes("extension") ||
    name.includes("raise") ||
    name.includes("fly") ||
    name.includes("flye") ||
    name.includes("kickback") ||
    name.includes("pushdown") ||
    name.includes("calf") ||
    name.includes("shrug") ||
    name.includes("crunch") ||
    name.includes("wrist") ||
    name.includes("pec deck")
  ) {
    return "isolation";
  }

  return "compound";
}

export function isExerciseUnilateral(ex: {
  isUnilateral?: boolean;
  name?: string;
}): boolean {
  if (typeof ex.isUnilateral === "boolean") return ex.isUnilateral;
  const name = (ex.name || "").toLowerCase();
  return (
    name.includes("alternate") ||
    name.includes("single-arm") ||
    name.includes("single arm") ||
    name.includes("one-arm") ||
    name.includes("one arm") ||
    name.includes("single-leg") ||
    name.includes("single leg") ||
    name.includes("one leg") ||
    name.includes("one hand") ||
    name.includes("pistol") ||
    name.includes("split squat") ||
    name.includes("split squad") ||
    name.includes("bulgarian") ||
    name.includes("lunge") ||
    name.includes("archer") ||
    name.includes("concentration curl") ||
    name.includes("hammer curl") ||
    name.includes("lateral raise") ||
    name.includes("front raise") ||
    name.includes("dumbbell row")
  );
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  {
    id: "barbell-bench-press",
    name: "Barbell Flat Bench Press",
    category: "Chest",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Barbell",
    targetMuscles: ["Pectoralis Major", "Triceps Brachii", "Anterior Deltoids"],
    instructions: [
      "Lie flat on the bench with feet planted firmly on the floor. Grip the barbell slightly wider than shoulder-width.",
      "Unrack the bar and lower it under control to the middle of your chest while keeping elbows tucked at a 45-degree angle.",
      "Drive through your feet and press the bar explosively back to starting position without locking out elbows abruptly.",
    ],
    rvsMultiplier: 1.0,
  },
  {
    id: "barbell-incline-bench-press",
    name: "Barbell Incline Bench Press",
    category: "Chest",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Barbell",
    targetMuscles: ["Upper Pectoralis Major", "Anterior Deltoids", "Triceps"],
    instructions: [
      "Set bench to a 30 to 45 degree angle. Unrack the bar and position it over your upper chest.",
      "Lower the bar steadily toward your upper chest right below collarbones.",
      "Press the weight vertically back up to starting position with core tight.",
    ],
    rvsMultiplier: 1.0,
  },
  {
    id: "dumbbell-flat-press",
    name: "Dumbbell Flat Bench Press",
    category: "Chest",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Dumbbell",
    targetMuscles: ["Pectoralis Major", "Triceps", "Anterior Deltoids"],
    instructions: [
      "Sit on flat bench holding dumbbells on knees, then lie back and bring dumbbells to chest level.",
      "Press dumbbells upward until arms are extended above chest.",
      "Lower dumbbells with full control until you feel a comfortable stretch in your chest.",
    ],
    rvsMultiplier: 0.95,
  },
  {
    id: "dumbbell-incline-press",
    name: "Incline Dumbbell Press",
    category: "Chest",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Dumbbell",
    targetMuscles: ["Upper Pectoralis Major", "Anterior Deltoids", "Triceps"],
    instructions: [
      "Lie on 30-degree incline bench with dumbbells held at shoulder width.",
      "Press dumbbells upward until arms are straight, keeping wrists stacked over elbows.",
      "Lower dumbbells slowly until upper arms are parallel with torso.",
    ],
    rvsMultiplier: 0.95,
  },
  {
    id: "chest-dips",
    name: "Chest Dips (Parallel Bars)",
    category: "Chest",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Lower Pectoralis Major", "Triceps Brachii", "Anterior Deltoids"],
    instructions: [
      "Mount parallel dip bars and lock out arms. Lean torso forward approximately 30 degrees.",
      "Lower body by bending elbows until shoulders are slightly lower than elbows.",
      "Push body back up to top locked-out position while squeezing lower chest.",
    ],
    rvsMultiplier: 1.1,
    aliases: ["chest dips", "dips", "parallel bar dips", "dip", "dips dada"],
  },
  {
    id: "push-up-standard",
    name: "Standard Push-Up",
    category: "Chest",
    difficultyRank: 1,
    difficultyLabel: "Novice",
    equipment: "Bodyweight",
    targetMuscles: ["Pectoralis Major", "Triceps", "Anterior Deltoids", "Core"],
    instructions: [
      "Place hands on floor shoulder-width apart with body forming a straight plank line from head to heels.",
      "Lower body until chest almost touches the floor, keeping elbows at 45 degrees.",
      "Push back up to starting plank position.",
    ],
    rvsMultiplier: 0.85,
  },
  {
    id: "wide-push-up",
    name: "Wide Grip Push-Up",
    category: "Chest",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Bodyweight",
    targetMuscles: ["Outer Pectoralis Major", "Anterior Deltoids"],
    instructions: [
      "Set hands significantly wider than shoulder-width on floor.",
      "Lower chest until parallel to floor, emphasizing outer chest engagement.",
      "Drive back up smoothly through palms.",
    ],
    rvsMultiplier: 0.85,
  },
  {
    id: "cable-crossover-fly",
    name: "Cable Chest Crossover Fly",
    category: "Chest",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Cable",
    targetMuscles: ["Pectoralis Major (Sternal Head)"],
    instructions: [
      "Set dual cable pulleys at shoulder height and grip handles. Step forward with one foot for balance.",
      "With elbows slightly bent, bring handles together in front of chest in a hugging motion.",
      "Pause and squeeze chest, then allow handles to return back with control.",
    ],
    rvsMultiplier: 0.85,
  },
  {
    id: "barbell-deadlift",
    name: "Barbell Conventional Deadlift",
    category: "Back",
    difficultyRank: 5,
    difficultyLabel: "Master",
    equipment: "Barbell",
    targetMuscles: ["Erector Spinae", "Hamstrings", "Glutes", "Latissimus Dorsi", "Trapezius"],
    instructions: [
      "Stand with feet hip-width apart under the barbell over mid-foot. Hinge at hips to grip bar.",
      "Flatten lower back, engage lats, pull slack out of bar, and take deep breath.",
      "Drive legs into ground to lift bar, standing tall at lockout without leaning back excessively.",
    ],
    rvsMultiplier: 1.25,
  },
  {
    id: "bent-over-barbell-row",
    name: "Bent-Over Barbell Row",
    category: "Back",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Barbell",
    targetMuscles: ["Latissimus Dorsi", "Rhomboids", "Middle Trapezius", "Biceps"],
    instructions: [
      "Hinge forward at hips at 45 degrees with knees soft and back flat.",
      "Pull barbell towards lower ribcage while squeezing shoulder blades together.",
      "Lower weight with control without letting torso collapse.",
    ],
    rvsMultiplier: 1.0,
  },
  {
    id: "pull-up",
    name: "Bodyweight Pull-Up (Overhand)",
    category: "Back",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Latissimus Dorsi", "Biceps Brachii", "Rear Deltoids"],
    instructions: [
      "Grip pull-up bar wider than shoulders with knuckles facing you.",
      "Pull chest toward bar by driving elbows down into ribs until chin clears bar.",
      "Lower back down to dead hang under control.",
    ],
    rvsMultiplier: 1.1,
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown (Wide Grip)",
    category: "Back",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Cable",
    targetMuscles: ["Latissimus Dorsi", "Rhomboids", "Biceps"],
    instructions: [
      "Sit at pulldown machine and adjust thigh pad. Grip wide bar overhand.",
      "Lean back slightly and pull bar down to upper chest while squeezing lats.",
      "Slowly return bar upward until lats are fully stretched.",
    ],
    rvsMultiplier: 0.9,
  },
  {
    id: "single-arm-dumbbell-row",
    name: "Single-Arm Dumbbell Row",
    category: "Back",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Dumbbell",
    targetMuscles: ["Latissimus Dorsi", "Rhomboids", "Biceps"],
    instructions: [
      "Place same-side knee and hand on flat bench. Hold dumbbell in free hand.",
      "Pull dumbbell up toward hip while driving elbow toward ceiling.",
      "Lower dumbbell with stretch at bottom without rotating torso.",
    ],
    rvsMultiplier: 0.95,
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    category: "Back",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Cable",
    targetMuscles: ["Middle Trapezius", "Rhomboids", "Latissimus Dorsi"],
    instructions: [
      "Sit with feet against footrests and knees soft. Grip V-bar handle.",
      "Keep torso upright and pull handle into abdomen while retracting shoulder blades.",
      "Extend arms back out with controlled tempo.",
    ],
    rvsMultiplier: 0.9,
  },
  {
    id: "barbell-back-squat",
    name: "Barbell Back Squat",
    category: "Legs",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Barbell",
    targetMuscles: ["Quadriceps", "Gluteus Maximus", "Hamstrings", "Core"],
    instructions: [
      "Position bar across upper trapezius muscles. Unrack bar and stand with feet shoulder-width apart.",
      "Hinge hips and bend knees to descend until thighs are parallel to ground or lower.",
      "Drive up through heels and mid-foot to starting position.",
    ],
    rvsMultiplier: 1.15,
  },
  {
    id: "barbell-front-squat",
    name: "Barbell Front Squat",
    category: "Legs",
    difficultyRank: 5,
    difficultyLabel: "Master",
    equipment: "Barbell",
    targetMuscles: ["Quadriceps", "Upper Back", "Core"],
    instructions: [
      "Rest barbell on front deltoids with fingertips under bar and elbows high.",
      "Keep chest tall and squat down deeply between knees.",
      "Drive back up while maintaining high elbow position.",
    ],
    rvsMultiplier: 1.2,
  },
  {
    id: "leg-press-machine",
    name: "Leg Press (45-Degree Machine)",
    category: "Legs",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Machine",
    targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    instructions: [
      "Sit in leg press seat and place feet shoulder-width apart on sled.",
      "Unlatch safety handles and lower sled until knees form 90-degree angle.",
      "Press sled back up without locking out knees completely.",
    ],
    rvsMultiplier: 0.95,
  },
  {
    id: "bulgarian-split-squat",
    name: "Dumbbell Bulgarian Split Squat",
    category: "Legs",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Dumbbell",
    targetMuscles: ["Quadriceps", "Gluteus Medius", "Hamstrings"],
    instructions: [
      "Place rear foot elevated on bench behind you. Hold dumbbells at sides.",
      "Lower front thigh until parallel to ground, keeping front knee aligned over ankle.",
      "Push through front heel to return to top.",
    ],
    rvsMultiplier: 1.1,
    aliases: ["bulgarian split squat", "split squad", "split squat", "bulgarian split squad", "elevated split squat"],
  },
  {
    id: "dumbbell-walking-lunge",
    name: "Dumbbell Walking Lunge",
    category: "Legs",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Dumbbell",
    targetMuscles: ["Quadriceps", "Glutes", "Hamstrings", "Calves"],
    instructions: [
      "Step forward with right leg and lower hips until both knees bend at 90 degrees.",
      "Drive through front heel to step forward into next lunge with left leg.",
      "Maintain upright torso throughout walking motion.",
    ],
    rvsMultiplier: 1.0,
  },
  {
    id: "lying-leg-curl",
    name: "Lying Leg Curl (Hamstring)",
    category: "Legs",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Machine",
    targetMuscles: ["Hamstrings (Biceps Femoris)"],
    instructions: [
      "Lie face down on machine with pad against lower calves.",
      "Curl pad upward toward glutes as far as possible.",
      "Lower pad slowly back to extended starting position.",
    ],
    rvsMultiplier: 0.85,
  },
  {
    id: "standing-calf-raise",
    name: "Standing Machine Calf Raise",
    category: "Legs",
    difficultyRank: 1,
    difficultyLabel: "Novice",
    equipment: "Machine",
    targetMuscles: ["Gastrocnemius", "Soleus"],
    instructions: [
      "Place balls of feet on platform with shoulders under pads.",
      "Lower heels down into full calf stretch.",
      "Raise up onto tiptoes as high as possible and squeeze calves.",
    ],
    rvsMultiplier: 0.75,
  },
  {
    id: "overhead-press",
    name: "Barbell Standing Overhead Press",
    category: "Shoulders",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Barbell",
    targetMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps", "Upper Chest"],
    instructions: [
      "Rack bar at collarbone height. Grip bar overhand slightly wider than shoulders.",
      "Press bar straight overhead while squeezing glutes and abs.",
      "Lower bar back down to collarbone under full control.",
    ],
    rvsMultiplier: 1.05,
  },
  {
    id: "dumbbell-seated-shoulder-press",
    name: "Dumbbell Seated Shoulder Press",
    category: "Shoulders",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Dumbbell",
    targetMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps"],
    instructions: [
      "Sit upright on bench. Raise dumbbells to shoulder height palms facing forward.",
      "Press dumbbells overhead until arms are extended overhead.",
      "Lower dumbbells smoothly back to ear height.",
    ],
    rvsMultiplier: 0.95,
    aliases: ["dumbbell seated shoulder press", "seated shoulder press", "shoulder press dumbell", "db shoulder press", "seated db press"],
  },
  {
    id: "dumbbell-lateral-raise",
    name: "Dumbbell Standing Lateral Raise",
    category: "Shoulders",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Dumbbell",
    targetMuscles: ["Lateral Deltoids"],
    instructions: [
      "Stand holding dumbbells at sides with slight elbow bend.",
      "Raise arms out to sides until parallel to floor.",
      "Lower weights with control without swinging torso.",
    ],
    rvsMultiplier: 0.8,
  },
  {
    id: "arnold-press",
    name: "Dumbbell Seated Arnold Press",
    category: "Shoulders",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Dumbbell",
    targetMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps"],
    instructions: [
      "Sit holding dumbbells in front of chest with palms facing you.",
      "As you press overhead, rotate palms outward 180 degrees so palms face forward at top.",
      "Reverse rotation as you lower back down.",
    ],
    rvsMultiplier: 1.0,
  },
  {
    id: "face-pull-cable",
    name: "Cable Face Pull",
    category: "Shoulders",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Cable",
    targetMuscles: ["Rear Deltoids", "Infraspinatus", "Trapezius"],
    instructions: [
      "Attach rope handle to high cable pulley. Grip rope with thumbs pointing back.",
      "Pull rope straight toward face, separating hands and squeezing rear delts.",
      "Slowly return to start position.",
    ],
    rvsMultiplier: 0.85,
  },
  {
    id: "barbell-bicep-curl",
    name: "Standing Barbell Bicep Curl",
    category: "Arms",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Barbell",
    targetMuscles: ["Biceps Brachii", "Brachialis"],
    instructions: [
      "Stand holding EZ-bar or straight barbell underhand shoulder-width apart.",
      "Curl bar upward toward shoulders keeping elbows pinned at sides.",
      "Squeeze biceps at top, then lower with tempo.",
    ],
    rvsMultiplier: 0.85,
  },
  {
    id: "dumbbell-hammer-curl",
    name: "Standing Dumbbell Hammer Curl",
    category: "Arms",
    difficultyRank: 1,
    difficultyLabel: "Novice",
    equipment: "Dumbbell",
    targetMuscles: ["Brachioradialis", "Biceps Brachii"],
    instructions: [
      "Hold dumbbells at sides with palms facing each other (neutral grip).",
      "Curl weights up while maintaining neutral palm position.",
      "Squeeze forearms and biceps, then lower down.",
    ],
    rvsMultiplier: 0.85,
    movementType: "isolation",
    isUnilateral: true,
    aliases: [
      "hammer curl",
      "hammer curls",
      "alternate hammer curl",
      "alternating hammer curl",
      "standing hammer curl",
      "db hammer curl",
      "dumbbell hammer curl"
    ],
  },
  {
    id: "tricep-rope-pushdown",
    name: "Cable Tricep Rope Pushdown",
    category: "Arms",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Cable",
    targetMuscles: ["Triceps Brachii"],
    instructions: [
      "Grip rope ends attached to high pulley. Keep elbows locked near ribs.",
      "Push rope down until arms are fully locked out, flaring rope outward.",
      "Return up to 90 degrees with control.",
    ],
    rvsMultiplier: 0.8,
  },
  {
    id: "skullcrusher-triceps",
    name: "Lying EZ-Bar Skullcrusher",
    category: "Arms",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Barbell",
    targetMuscles: ["Triceps Brachii (Long Head)"],
    instructions: [
      "Lie on bench holding EZ-bar over chest with arms extended.",
      "Bend elbows to lower bar toward forehead while keeping upper arms vertical.",
      "Extend arms back up to starting lockout.",
    ],
    rvsMultiplier: 0.9,
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Abdominal Leg Raise",
    category: "Core",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Rectus Abdominis", "Hip Flexors"],
    instructions: [
      "Hang from pull-up bar with overhand grip.",
      "Raise straight legs up until parallel to floor without swinging.",
      "Lower legs slowly back down.",
    ],
    rvsMultiplier: 0.85,
  },
  {
    id: "plank-hold",
    name: "Isometric Forearm Plank Hold",
    category: "Core",
    difficultyRank: 1,
    difficultyLabel: "Novice",
    equipment: "Bodyweight",
    targetMuscles: ["Transverse Abdominis", "Rectus Abdominis", "Core"],
    instructions: [
      "Rest on forearms and toes with elbows under shoulders.",
      "Hold rigid straight plank line from shoulders to ankles.",
      "Keep glutes and abs engaged continuously.",
    ],
    rvsMultiplier: 0.75,
  },
  {
    id: "step-jack-cardio",
    name: "Step Jack Low Impact Cardio",
    category: "Cardio",
    difficultyRank: 1,
    difficultyLabel: "Novice",
    equipment: "Bodyweight",
    targetMuscles: ["Quadriceps", "Glutes", "Shoulders"],
    instructions: [
      "Stand upright with feet together.",
      "Step right foot out while swinging arms overhead.",
      "Return right foot and repeat with left foot rhythmically.",
    ],
    rvsMultiplier: 0.7,
  },
  {
    id: "burpee-full-body",
    name: "Full Body Burpee",
    category: "Cardio",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Full Body", "Quads", "Chest", "Core"],
    instructions: [
      "Drop from standing into a squat, kick feet back into plank, perform a push-up.",
      "Pop feet back to hands and jump explosively into the air with hands overhead.",
      "Land softly and repeat continuously.",
    ],
    rvsMultiplier: 1.15,
  },
  {
    id: "archer-push-up",
    name: "Archer Push-Up",
    category: "Chest",
    difficultyRank: 3,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Pectoralis Major", "Triceps Brachii", "Anterior Deltoids", "Core"],
    instructions: [
      "Assume a wide push-up position with hands well outside shoulder width.",
      "Shift bodyweight toward one side, bending that arm while extending the opposite arm straight out horizontally.",
      "Press through the working hand back to center, then alternate to the opposite arm.",
    ],
    rvsMultiplier: 1.15,
    aliases: ["archer pushups", "archer push up", "archer push-up", "archer push-ups", "archer pushup"],
  },
  {
    id: "one-arm-push-up",
    name: "One-Arm Push-Up",
    category: "Chest",
    difficultyRank: 5,
    difficultyLabel: "Master",
    equipment: "Bodyweight",
    targetMuscles: ["Pectoralis Major", "Triceps Brachii", "Anterior Deltoids", "Obliques", "Core"],
    instructions: [
      "Place one hand centered directly under your chest with feet placed wide for anti-rotational stability.",
      "Keep opposite hand resting behind your lower back and brace core and glutes firmly.",
      "Lower chest under full control until hovering above the floor, then press explosively to lockout.",
    ],
    rvsMultiplier: 1.35,
    aliases: ["one hand push ups", "one hand push-up", "one hand pushup", "one hand pushups", "one arm push up", "one arm push-up", "single arm push up"],
  },
  {
    id: "diamond-push-up",
    name: "Diamond Push-Up (Close Grip)",
    category: "Chest",
    difficultyRank: 2,
    difficultyLabel: "Intermediate",
    equipment: "Bodyweight",
    targetMuscles: ["Triceps Brachii", "Pectoralis Major (Inner)", "Anterior Deltoids"],
    instructions: [
      "Form a diamond shape with thumbs and index fingers placed directly beneath the center of your chest.",
      "Lower chest until lightly grazing hands, keeping elbows angled slightly back.",
      "Press back up smoothly to full lockout while squeezing triceps and chest.",
    ],
    rvsMultiplier: 0.95,
    aliases: ["diamond pushups", "triangle push ups", "close grip push up", "diamond push up"],
  },
  {
    id: "pseudo-planche-push-up",
    name: "Pseudo Planche Push-Up",
    category: "Chest",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Anterior Deltoids", "Pectoralis Major", "Biceps Tendon", "Core"],
    instructions: [
      "Place hands at hip level with fingers turned outward or backward at 45 degrees.",
      "Lean shoulders forward far past wrists into a planche lean posture.",
      "Lower chest while maintaining the forward lean, then push back up into full scapular protraction.",
    ],
    rvsMultiplier: 1.25,
    aliases: ["planche push up", "planche pushups", "pseudo planche pushups", "pseudo planche push up"],
  },
  {
    id: "gymnastic-ring-dips",
    name: "Gymnastic Ring Dips",
    category: "Chest",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Pectoralis Major", "Triceps Brachii", "Anterior Deltoids", "Rotator Cuff"],
    instructions: [
      "Support yourself on gymnastic rings with arms straight and rings turned slightly outward (RTO).",
      "Lower body with control, keeping rings close to ribs until shoulders reach below elbows.",
      "Press up forcefully and turn rings outward at top support position.",
    ],
    rvsMultiplier: 1.2,
    aliases: ["ring dips", "gymnastic ring dips", "ring dip", "dips on rings"],
  },
  {
    id: "pike-push-up",
    name: "Pike Push-Up",
    category: "Shoulders",
    difficultyRank: 2,
    difficultyLabel: "Intermediate",
    equipment: "Bodyweight",
    targetMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps Brachii", "Upper Chest"],
    instructions: [
      "From a push-up position, walk feet forward toward hands and hike hips high to form an inverted V pike shape.",
      "Lower head diagonally forward toward the floor between hands, creating a tripod shape.",
      "Press forcefully through shoulders and palms back up into the pike position.",
    ],
    rvsMultiplier: 1.0,
    aliases: ["pike pushups", "pike push up", "pike push-up", "pike push-ups"],
  },
  {
    id: "handstand-push-up",
    name: "Handstand Push-Up (Wall / Free)",
    category: "Shoulders",
    difficultyRank: 5,
    difficultyLabel: "Master",
    equipment: "Bodyweight",
    targetMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps Brachii", "Trapezius", "Core"],
    instructions: [
      "Kick up into a handstand against a wall or freestanding with hands shoulder-width apart.",
      "Lower head under control until gently touching floor or mat, maintaining a tight hollow body.",
      "Drive vertically through palms to press all the way back up to straight arm lockout.",
    ],
    rvsMultiplier: 1.35,
    aliases: ["hspu", "handstand push up", "handstand pushups", "wall handstand pushup", "handstand push-up"],
  },
  {
    id: "dumbbell-standing-shoulder-press",
    name: "Dumbbell Standing Shoulder Press",
    category: "Shoulders",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Dumbbell",
    targetMuscles: ["Anterior Deltoids", "Lateral Deltoids", "Triceps", "Core"],
    instructions: [
      "Stand tall holding dumbbells at shoulder height with palms facing forward.",
      "Brace core and glutes, then press dumbbells overhead until arms are fully extended.",
      "Lower dumbbells smoothly back to shoulder level without arching lower back.",
    ],
    rvsMultiplier: 1.0,
    aliases: ["shoulder press dumbell", "standing dumbbell shoulder press", "dumbbell overhead press", "db shoulder press", "dumbbell shoulder press", "standing db press", "standing shoulder press"],
  },
  {
    id: "archer-pull-up",
    name: "Archer Pull-Up",
    category: "Back",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Latissimus Dorsi", "Biceps Brachii", "Forearms", "Rear Deltoids"],
    instructions: [
      "Take a very wide overhand grip on pull-up bar.",
      "Pull body up toward one hand while keeping the opposite arm straight and sliding along the bar.",
      "Lower back down to a dead hang with control, then alternate pulling toward the opposite arm.",
    ],
    rvsMultiplier: 1.25,
    aliases: ["archer pullups", "archer pull up", "archer pull-up", "archer pull-ups"],
  },
  {
    id: "one-arm-pull-up",
    name: "One-Arm Pull-Up",
    category: "Back",
    difficultyRank: 5,
    difficultyLabel: "Master",
    equipment: "Bodyweight",
    targetMuscles: ["Latissimus Dorsi", "Biceps Brachii", "Brachioradialis", "Forearms / Grip", "Core"],
    instructions: [
      "Hang from pull-up bar with a single hand using a strong grip and packed shoulder.",
      "Engage lats and drive working elbow forcefully downward into ribs to pull chin above the bar.",
      "Control the eccentric descent back to dead hang without uncontrolled spinning.",
    ],
    rvsMultiplier: 1.45,
    aliases: ["one hand pulls ups", "one hand pull ups", "one hand pull up", "one hand pull-up", "one arm pull up", "one arm pull-up", "single arm pull up", "one arm chin up"],
  },
  {
    id: "bar-muscle-up",
    name: "Bar Muscle-Up",
    category: "Back",
    difficultyRank: 5,
    difficultyLabel: "Master",
    equipment: "Bodyweight",
    targetMuscles: ["Latissimus Dorsi", "Pectoralis Major", "Triceps Brachii", "Core", "Forearms"],
    instructions: [
      "Hang from pull-up bar with a deep or false overhand grip.",
      "Pull explosively toward lower chest, whipping elbows forward and over bar into transition.",
      "Press through palms to lockout the dip above the bar.",
    ],
    rvsMultiplier: 1.4,
    aliases: ["muscle up", "muscle-up", "bar muscle up", "calisthenic muscle up", "muscle ups"],
  },
  {
    id: "chin-up-underhand",
    name: "Bodyweight Chin-Up (Underhand Grip)",
    category: "Back",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Bodyweight",
    targetMuscles: ["Biceps Brachii", "Latissimus Dorsi", "Brachialis", "Lower Trapezius"],
    instructions: [
      "Grip pull-up bar with an underhand (supinated) grip at shoulder width.",
      "Pull chest upward until chin clears bar, driving elbows down and back.",
      "Lower body slowly back to full hang at the bottom.",
    ],
    rvsMultiplier: 1.05,
    aliases: ["chin ups", "chin up", "chin-ups", "underhand pull up", "underhand pullups"],
  },
  {
    id: "australian-pull-up",
    name: "Australian Pull-Up / Inverted Row",
    category: "Back",
    difficultyRank: 1,
    difficultyLabel: "Novice",
    equipment: "Bodyweight",
    targetMuscles: ["Rhomboids", "Middle Trapezius", "Latissimus Dorsi", "Rear Deltoids", "Biceps"],
    instructions: [
      "Hang under waist-height bar with heels on floor and body forming a rigid straight plank.",
      "Pull chest up to touch bar by retracting shoulder blades.",
      "Lower body slowly back to straight arms with core braced.",
    ],
    rvsMultiplier: 0.85,
    aliases: ["inverted row", "horizontal pull up", "australian pull up", "australian pullups", "bodyweight row"],
  },
  {
    id: "parallel-bar-dips",
    name: "Parallel Bar Dips (Tricep Dips)",
    category: "Arms",
    difficultyRank: 3,
    difficultyLabel: "Intermediate",
    equipment: "Bodyweight",
    targetMuscles: ["Triceps Brachii", "Anterior Deltoids", "Pectoralis Major"],
    instructions: [
      "Mount parallel bars with arms locked out and torso upright.",
      "Lower body by bending elbows until upper arms are parallel to the ground.",
      "Press powerfully through palms to lock out triceps at the top.",
    ],
    rvsMultiplier: 1.05,
    aliases: ["dips", "tricep dips", "bar dips", "parallel bar dips", "bodyweight dips"],
  },
  {
    id: "bench-dips",
    name: "Bench Dips",
    category: "Arms",
    difficultyRank: 1,
    difficultyLabel: "Novice",
    equipment: "Bodyweight",
    targetMuscles: ["Triceps Brachii", "Anterior Deltoids"],
    instructions: [
      "Place hands shoulder-width on the edge of a flat bench behind you with legs extended forward.",
      "Lower hips by bending elbows until upper arms form a 90-degree angle.",
      "Push through palms to return to full arm extension.",
    ],
    rvsMultiplier: 0.8,
    aliases: ["bench dips", "chair dips", "tricep bench dips", "bench dip"],
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat (Dumbbell/Kettlebell)",
    category: "Legs",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Dumbbell",
    targetMuscles: ["Quadriceps", "Gluteus Maximus", "Hamstrings", "Core", "Upper Back"],
    instructions: [
      "Stand tall with feet shoulder-width apart, holding a dumbbell or kettlebell vertically against your upper chest.",
      "Squat deeply between your knees while keeping chest proud and elbows inside knees at bottom.",
      "Drive through mid-foot and heels to stand back up into full hip extension.",
    ],
    rvsMultiplier: 1.0,
    aliases: ["goblit squad", "goblet squad", "goblet squat", "goblet squat dumbbell", "kettlebell goblet squat", "goblet squats"],
  },
  {
    id: "bodyweight-split-squat",
    name: "Bodyweight Split Squat",
    category: "Legs",
    difficultyRank: 2,
    difficultyLabel: "Novice",
    equipment: "Bodyweight",
    targetMuscles: ["Quadriceps", "Gluteus Maximus", "Hamstrings", "Calves", "Hip Flexors"],
    instructions: [
      "Take a staggered stance with one foot forward and the back foot rested on the ball of the foot.",
      "Lower back knee vertically toward the floor until both knees reach a 90-degree bend.",
      "Drive through front heel to push back up into starting staggered stance without moving feet.",
    ],
    rvsMultiplier: 0.9,
    aliases: ["split squad", "split squat", "split squads", "split squats", "bodyweight split squat", "static lunge"],
  },
  {
    id: "pistol-squat",
    name: "Single-Leg Pistol Squat",
    category: "Legs",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Quadriceps", "Gluteus Maximus", "Hamstrings", "Calves", "Core"],
    instructions: [
      "Stand on one leg with arms forward and opposite leg extended straight out in front.",
      "Squat all the way down on standing leg until hamstring touches calf while keeping elevated leg off floor.",
      "Drive through heel to stand back up to starting position.",
    ],
    rvsMultiplier: 1.25,
    aliases: ["pistol squats", "pistol squat", "single leg squat", "one leg squat"],
  },
  {
    id: "l-sit-hold",
    name: "L-Sit Hold (Parallettes / Floor)",
    category: "Core",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Rectus Abdominis", "Hip Flexors", "Triceps", "Lats"],
    instructions: [
      "Place hands on parallettes, dip bars, or floor, pressing down to lift torso up.",
      "Extend straight legs forward at a 90-degree angle to torso, forming an 'L' shape.",
      "Hold isometric position without letting heels touch the ground.",
    ],
    rvsMultiplier: 1.1,
    aliases: ["l sit", "l-sit", "l sit hold", "parallette l sit", "lsit"],
  },
  {
    id: "dragon-flag",
    name: "Dragon Flag (Bruce Lee Core Hold)",
    category: "Core",
    difficultyRank: 5,
    difficultyLabel: "Master",
    equipment: "Bodyweight",
    targetMuscles: ["Rectus Abdominis", "Obliques", "Erector Spinae", "Latissimus Dorsi"],
    instructions: [
      "Lie on a flat bench and grip bench firmly beside your head.",
      "Lift entire body up in a straight rigid line, resting weight solely on your upper back and shoulders.",
      "Slowly lower body as a rigid plank until hovering just above bench, then lift back up.",
    ],
    rvsMultiplier: 1.35,
    aliases: ["dragon flag", "dragonflag", "bruce lee core hold", "dragon flags"],
  },
  {
    id: "toes-to-bar",
    name: "Hanging Toes-To-Bar",
    category: "Core",
    difficultyRank: 4,
    difficultyLabel: "Advanced",
    equipment: "Bodyweight",
    targetMuscles: ["Rectus Abdominis", "Hip Flexors", "Latissimus Dorsi", "Grip Strength"],
    instructions: [
      "Hang from pull-up bar with an overhand grip.",
      "Engage lats and flex abs to swing straight legs upward until toes touch the bar between hands.",
      "Lower legs back down with control without swinging excessively.",
    ],
    rvsMultiplier: 1.05,
    aliases: ["toes to bar", "t2b", "hanging toes to bar", "toes-to-bar"],
  },
];
