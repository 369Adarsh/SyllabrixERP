const prisma = require('../../config/prisma');

// ── Default Exercise Library ──────────────────────────────────────────────────

const DEFAULT_EXERCISES = [
  // ── Strength — Chest ─────────────────────────────────────────────────────────
  { name: 'Bench Press',         category: 'Strength',    muscleGroup: 'Chest',     equipment: 'Barbell',    difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10', isDefault: true,
    description: 'Compound chest builder using a flat bench and barbell.',
    instructions: '1. Lie flat on the bench, grip barbell slightly wider than shoulders.\n2. Unrack and lower bar to mid-chest with control.\n3. Press back up explosively until arms are fully extended.\n4. Keep feet flat, back slightly arched, and core tight throughout.' },
  { name: 'Incline Bench Press', category: 'Strength',    muscleGroup: 'Chest',     equipment: 'Barbell',    difficulty: 'Intermediate', defaultSets: 3, defaultReps: '10-12', isDefault: true,
    description: 'Targets upper chest at a 30-45° incline angle.',
    instructions: '1. Set bench to 30-45° incline.\n2. Grip barbell slightly wider than shoulder-width.\n3. Lower bar to upper chest with control.\n4. Press upward until arms are extended. Avoid bouncing bar off chest.' },
  { name: 'Dumbbell Flyes',      category: 'Strength',    muscleGroup: 'Chest',     equipment: 'Dumbbell',   difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Isolation move for chest stretch and contraction.',
    instructions: '1. Lie flat on bench, hold dumbbells above chest with slight elbow bend.\n2. Open arms wide in a wide arc until you feel a deep chest stretch.\n3. Squeeze chest as you bring dumbbells back together.\n4. Keep elbows slightly bent throughout — never lock.' },
  { name: 'Cable Crossover',     category: 'Strength',    muscleGroup: 'Chest',     equipment: 'Cable',      difficulty: 'Intermediate', defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Cable fly variation for constant chest tension.',
    instructions: '1. Set pulleys to chest height. Stand in center with one foot forward.\n2. Hold handles and lean slightly forward.\n3. Bring hands together in front of your chest in a hugging motion.\n4. Slowly return to start. Keep core stable throughout.' },
  { name: 'Push-ups',            category: 'Strength',    muscleGroup: 'Chest',     equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '15-20', isDefault: true,
    description: 'Classic bodyweight chest and tricep exercise.',
    instructions: '1. Start in plank position, hands slightly wider than shoulders.\n2. Lower your chest to just above the floor.\n3. Push back up explosively.\n4. Keep core tight and body in a straight line throughout. No sagging hips.' },
  // ── Strength — Back ──────────────────────────────────────────────────────────
  { name: 'Pull-ups',            category: 'Strength',    muscleGroup: 'Back',      equipment: 'Bodyweight', difficulty: 'Advanced',     defaultSets: 4, defaultReps: '6-10', isDefault: true,
    description: 'Best bodyweight exercise for building lat width.',
    instructions: '1. Hang from bar with overhand grip, shoulder-width apart.\n2. Engage lats and pull yourself up until chin is above bar.\n3. Lower slowly with full control — 2-3 second descent.\n4. Fully extend arms at the bottom before next rep.' },
  { name: 'Lat Pulldown',        category: 'Strength',    muscleGroup: 'Back',      equipment: 'Cable',      difficulty: 'Beginner',     defaultSets: 4, defaultReps: '10-12', isDefault: true,
    description: 'Machine-assisted lat builder, great for beginners.',
    instructions: '1. Sit at cable machine, grip bar wider than shoulder-width.\n2. Lean back slightly, pull bar down to upper chest.\n3. Squeeze shoulder blades together at bottom.\n4. Slowly raise bar back up with control.' },
  { name: 'Barbell Row',         category: 'Strength',    muscleGroup: 'Back',      equipment: 'Barbell',    difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10', isDefault: true,
    description: 'Heavy compound row for thickness and overall back strength.',
    instructions: '1. Hinge at hips, keep back flat and nearly parallel to floor.\n2. Grip barbell shoulder-width.\n3. Pull bar to lower abdomen, driving elbows back.\n4. Lower with control. Avoid rounding your lower back.' },
  { name: 'Dumbbell Row',        category: 'Strength',    muscleGroup: 'Back',      equipment: 'Dumbbell',   difficulty: 'Beginner',     defaultSets: 3, defaultReps: '10-12', isDefault: true,
    description: 'Unilateral back exercise allowing good range of motion.',
    instructions: '1. Place one knee and hand on bench for support.\n2. Hold dumbbell in opposite hand, arm hanging straight.\n3. Row dumbbell up to hip, elbow driving back.\n4. Lower slowly. Complete all reps one side then switch.' },
  { name: 'Seated Cable Row',    category: 'Strength',    muscleGroup: 'Back',      equipment: 'Cable',      difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Seated row targeting mid-back and lats.',
    instructions: '1. Sit at cable station, feet on footrests, knees slightly bent.\n2. Pull handle to your abdomen, elbows tucked.\n3. Squeeze shoulder blades together at end.\n4. Extend arms back with control, keeping torso upright.' },
  { name: 'Deadlift',            category: 'Strength',    muscleGroup: 'Back',      equipment: 'Barbell',    difficulty: 'Advanced',     defaultSets: 4, defaultReps: '5-6', isDefault: true,
    description: 'King of all exercises. Builds total body strength.',
    instructions: '1. Stand with feet hip-width, bar over mid-foot.\n2. Hinge at hips, grip bar just outside knees.\n3. Drive through heels, keep bar close to body as you stand.\n4. Lock hips and shoulders at top. Lower bar with control. Never round lower back.' },
  // ── Strength — Legs ──────────────────────────────────────────────────────────
  { name: 'Barbell Squat',       category: 'Strength',    muscleGroup: 'Legs',      equipment: 'Barbell',    difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10', isDefault: true,
    description: 'The foundational lower body compound movement.',
    instructions: '1. Bar rests on upper traps. Feet shoulder-width, toes slightly out.\n2. Brace core and squat down until thighs are parallel to floor.\n3. Drive through heels to stand.\n4. Keep chest up and knees tracking over toes throughout.' },
  { name: 'Leg Press',           category: 'Strength',    muscleGroup: 'Legs',      equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 4, defaultReps: '10-12', isDefault: true,
    description: 'Machine squat alternative, great for quads.',
    instructions: '1. Sit in leg press machine. Place feet shoulder-width on platform.\n2. Lower platform until knees form 90° angle.\n3. Press through heels until legs are nearly straight.\n4. Never lock knees. Control descent on each rep.' },
  { name: 'Romanian Deadlift',   category: 'Strength',    muscleGroup: 'Legs',      equipment: 'Barbell',    difficulty: 'Intermediate', defaultSets: 3, defaultReps: '10-12', isDefault: true,
    description: 'Hamstring-dominant hip hinge movement.',
    instructions: '1. Stand holding barbell at hip height, slight knee bend.\n2. Push hips back as you lower bar along thighs.\n3. Feel a deep hamstring stretch, back stays flat.\n4. Drive hips forward to return to standing.' },
  { name: 'Leg Curl',            category: 'Strength',    muscleGroup: 'Legs',      equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Isolation exercise for hamstrings.',
    instructions: '1. Lie face down on leg curl machine.\n2. Place pad just above heels.\n3. Curl legs toward glutes as far as possible.\n4. Squeeze hamstrings at top, lower slowly.' },
  { name: 'Leg Extension',       category: 'Strength',    muscleGroup: 'Legs',      equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Quad isolation on the leg extension machine.',
    instructions: '1. Sit on machine, pad resting on front of lower leg.\n2. Extend legs fully until nearly straight.\n3. Squeeze quads at top.\n4. Lower slowly — 3 second descent for best results.' },
  { name: 'Lunges',              category: 'Strength',    muscleGroup: 'Legs',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12 each leg', isDefault: true,
    description: 'Bodyweight unilateral leg exercise for balance and strength.',
    instructions: '1. Stand with feet together.\n2. Step forward and lower back knee toward floor.\n3. Front thigh should be parallel to floor.\n4. Push off front heel to return. Alternate legs.' },
  { name: 'Calf Raises',         category: 'Strength',    muscleGroup: 'Legs',      equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 4, defaultReps: '15-20', isDefault: true,
    description: 'Isolation for calf muscles (gastrocnemius & soleus).',
    instructions: '1. Stand on edge of step or calf raise machine.\n2. Rise up on toes as high as possible.\n3. Hold 1 second at top.\n4. Lower heels below step level for full stretch.' },
  // ── Strength — Shoulders ─────────────────────────────────────────────────────
  { name: 'Overhead Press',      category: 'Strength',    muscleGroup: 'Shoulders', equipment: 'Barbell',    difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10', isDefault: true,
    description: 'Compound shoulder press for mass and strength.',
    instructions: '1. Stand holding barbell at shoulder height, grip just outside shoulders.\n2. Press bar directly overhead until arms are locked.\n3. Lower bar back to shoulder height with control.\n4. Keep core braced and avoid excessive back arch.' },
  { name: 'Dumbbell Shoulder Press', category: 'Strength', muscleGroup: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '10-12', isDefault: true,
    description: 'Seated or standing shoulder press with dumbbells.',
    instructions: '1. Hold dumbbells at shoulder height, palms forward.\n2. Press both dumbbells overhead until arms are nearly straight.\n3. Lower slowly to start position.\n4. Keep elbows slightly forward of wrists throughout.' },
  { name: 'Lateral Raises',      category: 'Strength',    muscleGroup: 'Shoulders', equipment: 'Dumbbell',   difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Side delt isolation for shoulder width.',
    instructions: '1. Hold dumbbells at sides, slight elbow bend.\n2. Raise arms out to sides to shoulder height.\n3. Lead with elbows, not wrists.\n4. Lower slowly — the slow descent builds the most muscle.' },
  { name: 'Front Raises',        category: 'Strength',    muscleGroup: 'Shoulders', equipment: 'Dumbbell',   difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Anterior deltoid isolation exercise.',
    instructions: '1. Hold dumbbells in front of thighs, palms facing you.\n2. Raise both arms forward to shoulder height.\n3. Hold briefly at top.\n4. Lower with control. Avoid swinging torso.' },
  { name: 'Face Pulls',          category: 'Strength',    muscleGroup: 'Shoulders', equipment: 'Cable',      difficulty: 'Beginner',     defaultSets: 3, defaultReps: '15-20', isDefault: true,
    description: 'Rear delt and rotator cuff health exercise.',
    instructions: '1. Set cable pulley to face height, attach rope.\n2. Pull rope toward face, flaring elbows out to sides.\n3. Externally rotate shoulders at end — thumbs should point behind you.\n4. Return with control. Essential for shoulder health.' },
  // ── Strength — Arms ──────────────────────────────────────────────────────────
  { name: 'Barbell Curl',        category: 'Strength',    muscleGroup: 'Arms',      equipment: 'Barbell',    difficulty: 'Beginner',     defaultSets: 3, defaultReps: '10-12', isDefault: true,
    description: 'Classic barbell bicep curl for peak and mass.',
    instructions: '1. Stand with barbell at hip height, underhand grip.\n2. Curl barbell to shoulder height, squeezing bicep at top.\n3. Lower slowly over 2-3 seconds.\n4. Keep elbows tucked to sides — no swinging.' },
  { name: 'Dumbbell Curl',       category: 'Strength',    muscleGroup: 'Arms',      equipment: 'Dumbbell',   difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Dumbbell version allowing supination for better bicep peak.',
    instructions: '1. Hold dumbbells at sides, palms facing body.\n2. Curl both arms simultaneously, rotating palms upward as you lift.\n3. Squeeze biceps at top.\n4. Lower slowly — do not drop.' },
  { name: 'Hammer Curl',         category: 'Strength',    muscleGroup: 'Arms',      equipment: 'Dumbbell',   difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Neutral grip curl that targets brachialis and brachioradialis.',
    instructions: '1. Hold dumbbells with neutral grip (thumbs up).\n2. Curl both dumbbells up toward shoulders.\n3. Keep elbows close to torso.\n4. Lower with control. Great for forearm thickness.' },
  { name: 'Tricep Dips',         category: 'Strength',    muscleGroup: 'Arms',      equipment: 'Bodyweight', difficulty: 'Intermediate', defaultSets: 3, defaultReps: '10-15', isDefault: true,
    description: 'Bodyweight tricep exercise using parallel bars or bench.',
    instructions: '1. Grip parallel bars, arms straight, body vertical.\n2. Lower body by bending elbows until upper arms are parallel to floor.\n3. Push back up to starting position.\n4. Keep torso upright for tricep focus (leaning forward hits chest more).' },
  { name: 'Skull Crushers',      category: 'Strength',    muscleGroup: 'Arms',      equipment: 'Barbell',    difficulty: 'Intermediate', defaultSets: 3, defaultReps: '10-12', isDefault: true,
    description: 'Lying tricep extension for mass and strength.',
    instructions: '1. Lie on bench, hold barbell above chest with narrow grip.\n2. Lower bar toward forehead by bending elbows only.\n3. Extend arms back to start, squeezing triceps.\n4. Keep upper arms perpendicular to floor throughout.' },
  { name: 'Tricep Pushdown',     category: 'Strength',    muscleGroup: 'Arms',      equipment: 'Cable',      difficulty: 'Beginner',     defaultSets: 3, defaultReps: '12-15', isDefault: true,
    description: 'Cable isolation exercise for all three tricep heads.',
    instructions: '1. Stand at cable machine with rope or bar attachment at chest height.\n2. Push handle downward until arms are fully extended.\n3. Squeeze triceps at bottom.\n4. Let elbows rise back to start — do not let upper arms move.' },
  // ── Core ─────────────────────────────────────────────────────────────────────
  { name: 'Plank',               category: 'Core',        muscleGroup: 'Core',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '30-60 sec', isDefault: true,
    description: 'Isometric core stabilizer that builds total core endurance.',
    instructions: '1. Forearms on floor, elbows under shoulders.\n2. Body in a straight line from head to heels.\n3. Squeeze glutes, brace abs — do not let hips sag or rise.\n4. Hold for target time. Breathe steadily throughout.' },
  { name: 'Crunches',            category: 'Core',        muscleGroup: 'Core',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '20-25', isDefault: true,
    description: 'Basic ab exercise targeting rectus abdominis.',
    instructions: '1. Lie on back, knees bent, hands behind head.\n2. Curl shoulders off floor, contracting abs.\n3. Do not pull neck — lead with your chest.\n4. Lower slowly. Focus on the squeeze, not height.' },
  { name: 'Russian Twists',      category: 'Core',        muscleGroup: 'Core',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '20 each side', isDefault: true,
    description: 'Rotational core exercise for obliques.',
    instructions: '1. Sit on floor, lean back 45°, knees bent and feet raised.\n2. Hold hands or a weight at chest.\n3. Rotate torso side to side, touching floor on each side.\n4. Keep chest up. Add weight plate or medicine ball to increase difficulty.' },
  { name: 'Leg Raises',          category: 'Core',        muscleGroup: 'Core',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '15-20', isDefault: true,
    description: 'Lower ab exercise targeting hip flexors and lower rectus abdominis.',
    instructions: '1. Lie flat on back, hands under glutes for support.\n2. Raise straight legs to 90° angle.\n3. Lower legs slowly without touching the floor.\n4. Keep lower back pressed into floor throughout.' },
  { name: 'Ab Wheel Rollout',    category: 'Core',        muscleGroup: 'Core',      equipment: 'Machine',    difficulty: 'Advanced',     defaultSets: 3, defaultReps: '8-12', isDefault: true,
    description: 'Advanced core stability and strength exercise.',
    instructions: '1. Kneel on floor, hold ab wheel with both hands.\n2. Roll forward slowly, extending body until nearly parallel to floor.\n3. Engage core and pull wheel back using abs.\n4. Never let lower back sag. Start with short range until strong enough.' },
  { name: 'Cable Crunch',        category: 'Core',        muscleGroup: 'Core',      equipment: 'Cable',      difficulty: 'Intermediate', defaultSets: 3, defaultReps: '15-20', isDefault: true,
    description: 'Weighted cable crunch for ab development with added resistance.',
    instructions: '1. Kneel in front of cable with rope attachment at high pulley.\n2. Hold rope behind head, elbows in.\n3. Crunch downward, rounding spine, until elbows approach knees.\n4. Return slowly. Only your trunk should move.' },
  { name: 'Side Plank',          category: 'Core',        muscleGroup: 'Core',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 3, defaultReps: '30-45 sec each', isDefault: true,
    description: 'Lateral core stability exercise for obliques.',
    instructions: '1. Lie on side, support on one forearm and side of foot.\n2. Lift hips to form a straight diagonal line.\n3. Hold position. Keep hips from dropping.\n4. Switch sides. Can add hip dips for extra challenge.' },
  // ── Cardio ───────────────────────────────────────────────────────────────────
  { name: 'Treadmill Run',       category: 'Cardio',      muscleGroup: 'Full Body', equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 1, defaultReps: '20-30 min', isDefault: true,
    description: 'Steady-state cardio for fat burn and endurance.',
    instructions: '1. Start with 5 min warm-up walk at 4-5 km/h.\n2. Increase to comfortable run pace (7-10 km/h).\n3. Maintain for target duration.\n4. Cool down with 3-5 min walk. Aim for 120-150 bpm heart rate zone.' },
  { name: 'Cycling',             category: 'Cardio',      muscleGroup: 'Full Body', equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 1, defaultReps: '20-40 min', isDefault: true,
    description: 'Low-impact cardio on stationary or outdoor bike.',
    instructions: '1. Adjust seat so knee has slight bend at bottom of pedal stroke.\n2. Start at comfortable resistance.\n3. Maintain steady cadence of 70-90 RPM.\n4. Increase resistance as fitness improves.' },
  { name: 'Jump Rope',           category: 'Cardio',      muscleGroup: 'Full Body', equipment: 'Bodyweight', difficulty: 'Intermediate', defaultSets: 5, defaultReps: '1 min on, 30 sec off', isDefault: true,
    description: 'High-calorie burn cardio with coordination benefits.',
    instructions: '1. Hold rope handles at hip height, rope behind you.\n2. Swing rope overhead and jump over it with both feet.\n3. Land softly on balls of feet.\n4. Start with 30-second intervals, work up to 1-minute sets.' },
  { name: 'Elliptical',          category: 'Cardio',      muscleGroup: 'Full Body', equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 1, defaultReps: '20-30 min', isDefault: true,
    description: 'Low-impact full body cardio machine.',
    instructions: '1. Step onto pedals and grip handlebars.\n2. Push/pull handlebars while pedaling for full body engagement.\n3. Maintain upright posture — do not lean on handles.\n4. Target 130-150 bpm heart rate.' },
  { name: 'Rowing Machine',      category: 'Cardio',      muscleGroup: 'Full Body', equipment: 'Machine',    difficulty: 'Intermediate', defaultSets: 1, defaultReps: '15-20 min', isDefault: true,
    description: 'Total body cardio engaging 86% of muscles.',
    instructions: '1. Catch: arms straight, lean forward from hips, knees bent.\n2. Drive: legs push first, then lean back, then pull handle to lower chest.\n3. Finish: lean back slightly, handle at abdomen.\n4. Recovery: reverse the order. Ratio: legs 60%, back 20%, arms 20%.' },
  { name: 'Stair Climber',       category: 'Cardio',      muscleGroup: 'Legs',      equipment: 'Machine',    difficulty: 'Intermediate', defaultSets: 1, defaultReps: '15-20 min', isDefault: true,
    description: 'Glute and leg focused cardio on the step machine.',
    instructions: '1. Step onto machine and select resistance level.\n2. Step at a consistent pace — push through full foot, not just toes.\n3. Keep torso upright, minimal leaning on rails.\n4. Great for glutes — try a slower, deeper step for more activation.' },
  // ── HIIT ─────────────────────────────────────────────────────────────────────
  { name: 'Burpees',             category: 'HIIT',        muscleGroup: 'Full Body', equipment: 'Bodyweight', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '10-15', isDefault: true,
    description: 'Total body explosive movement burning maximum calories.',
    instructions: '1. Stand, then squat down and place hands on floor.\n2. Jump feet back to push-up position.\n3. Do one push-up.\n4. Jump feet to hands, then explode up with arms overhead.\n5. Land softly. Scale by removing the push-up for beginners.' },
  { name: 'Box Jumps',           category: 'HIIT',        muscleGroup: 'Legs',      equipment: 'Bodyweight', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10', isDefault: true,
    description: 'Explosive plyometric exercise for power and athleticism.',
    instructions: '1. Stand in front of sturdy box, feet hip-width.\n2. Hinge at hips, swing arms back.\n3. Explode upward, swing arms forward and land softly on box.\n4. Step down (don\'t jump down). Reset and repeat.' },
  { name: 'Battle Ropes',        category: 'HIIT',        muscleGroup: 'Full Body', equipment: 'Bands',      difficulty: 'Intermediate', defaultSets: 5, defaultReps: '30 sec on, 30 sec rest', isDefault: true,
    description: 'Upper body dominant HIIT using heavy ropes.',
    instructions: '1. Hold one rope end in each hand, stand with slight knee bend.\n2. Alternate arms rapidly creating waves in the rope.\n3. Engage core throughout.\n4. Try: alternating waves, double slams, or lateral waves for variety.' },
  { name: 'Kettlebell Swing',    category: 'HIIT',        muscleGroup: 'Full Body', equipment: 'Kettlebell', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '15-20', isDefault: true,
    description: 'Posterior chain power exercise with cardio benefit.',
    instructions: '1. Feet wider than shoulders, toes slightly out, KB between feet.\n2. Hike KB back between legs, then drive hips forward explosively.\n3. KB swings to shoulder height — do NOT squat; it\'s a hip hinge.\n4. Let KB fall back, hinge hips and repeat.' },
  { name: 'Mountain Climbers',   category: 'HIIT',        muscleGroup: 'Full Body', equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 4, defaultReps: '30 sec', isDefault: true,
    description: 'Core-heavy full body HIIT movement.',
    instructions: '1. Start in high plank position, arms straight.\n2. Drive one knee toward chest rapidly.\n3. Alternate legs in a running motion.\n4. Keep hips level, core braced. Faster = more cardio, slower = more core.' },
  { name: 'Jump Squats',         category: 'HIIT',        muscleGroup: 'Legs',      equipment: 'Bodyweight', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '12-15', isDefault: true,
    description: 'Explosive squat variation for power and calorie burn.',
    instructions: '1. Stand feet shoulder-width.\n2. Squat until thighs are parallel to floor.\n3. Explode upward and jump, fully extending body.\n4. Land softly with bent knees and immediately go into next squat.' },
  { name: 'High Knees',          category: 'HIIT',        muscleGroup: 'Full Body', equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 4, defaultReps: '30 sec', isDefault: true,
    description: 'Running in place with exaggerated knee drive.',
    instructions: '1. Stand with feet hip-width.\n2. Drive one knee up to hip height while pumping opposite arm.\n3. Alternate legs rapidly as if running in place.\n4. Land on balls of feet. Keep chest up and arms bent at 90°.' },
  // ── Flexibility ──────────────────────────────────────────────────────────────
  { name: 'Hip Flexor Stretch',  category: 'Flexibility', muscleGroup: 'Legs',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 2, defaultReps: '30-45 sec each side', isDefault: true,
    description: 'Essential stretch for desk workers and gym-goers alike.',
    instructions: '1. Kneel on one knee, other foot forward (lunge position).\n2. Push hips forward gently until you feel stretch in front of back thigh.\n3. Keep torso upright, core engaged.\n4. Hold, breathe deeply. Switch sides.' },
  { name: 'Hamstring Stretch',   category: 'Flexibility', muscleGroup: 'Legs',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 2, defaultReps: '30-45 sec each side', isDefault: true,
    description: 'Standing or seated stretch for the back of the thigh.',
    instructions: '1. Sit on floor with one leg straight, one bent.\n2. Reach forward toward toes of straight leg.\n3. Keep back flat — do not round the spine.\n4. Hold at point of tension. Switch legs.' },
  { name: "Child's Pose",        category: 'Flexibility', muscleGroup: 'Back',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 2, defaultReps: '45-60 sec', isDefault: true,
    description: 'Yoga rest pose stretching lower back, hips, and shoulders.',
    instructions: '1. Kneel on floor, big toes touching, knees wide.\n2. Sit back on heels and fold forward, extending arms overhead.\n3. Rest forehead on the mat.\n4. Breathe deeply and relax into the stretch.' },
  { name: 'Cat-Cow Stretch',     category: 'Flexibility', muscleGroup: 'Back',      equipment: 'Bodyweight', difficulty: 'Beginner',     defaultSets: 2, defaultReps: '10-15 reps', isDefault: true,
    description: 'Spinal mobility drill often used in yoga warm-ups.',
    instructions: '1. Start on hands and knees, spine neutral.\n2. Cow: inhale and drop belly toward floor, lifting head and tailbone.\n3. Cat: exhale and round spine toward ceiling, tucking chin and pelvis.\n4. Flow between both positions slowly.' },
  { name: 'Pigeon Pose',         category: 'Flexibility', muscleGroup: 'Legs',      equipment: 'Bodyweight', difficulty: 'Intermediate', defaultSets: 2, defaultReps: '60 sec each side', isDefault: true,
    description: 'Deep hip opener targeting glutes and hip rotators.',
    instructions: '1. From plank, bring one knee forward toward same-side wrist.\n2. Extend opposite leg straight back.\n3. Fold forward over front shin.\n4. Hold 60 seconds. This is intense — breathe and relax into it.' },
  { name: 'Foam Rolling',        category: 'Flexibility', muscleGroup: 'Full Body', equipment: 'Machine',    difficulty: 'Beginner',     defaultSets: 1, defaultReps: '60-90 sec per area', isDefault: true,
    description: 'Self-myofascial release for muscle recovery.',
    instructions: '1. Place foam roller under target muscle group.\n2. Use bodyweight to apply pressure and roll slowly.\n3. Pause on tight spots for 20-30 seconds.\n4. Roll quads, hamstrings, calves, upper back. Avoid rolling directly on joints.' },
];

// ── Exercises ─────────────────────────────────────────────────────────────────

const listExercises = (tenantId) =>
  prisma.exercise.findMany({
    where: { tenantId },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

const createExercise = (tenantId, data) =>
  prisma.exercise.create({ data: { ...data, tenantId } });

const updateExercise = (tenantId, id, data) => {
  const allowed = ['name', 'category', 'muscleGroup', 'equipment', 'description', 'instructions', 'difficulty', 'defaultSets', 'defaultReps', 'imageUrl'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.exercise.update({ where: { id, tenantId }, data: payload });
};

const deleteExercise = (tenantId, id) =>
  prisma.exercise.delete({ where: { id, tenantId } });

const seedExercises = async (tenantId) => {
  // Delete existing default exercises so we can re-seed with enriched data
  await prisma.exercise.deleteMany({ where: { tenantId, isDefault: true } });
  await prisma.exercise.createMany({ data: DEFAULT_EXERCISES.map(e => ({ ...e, tenantId })) });
  return { seeded: DEFAULT_EXERCISES.length };
};

// ── Templates ─────────────────────────────────────────────────────────────────

const listTemplates = (tenantId) =>
  prisma.workoutTemplate.findMany({
    where: { tenantId },
    include: {
      trainer: { select: { id: true, name: true, specialization: true } },
      _count: { select: { days: true, memberPlans: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

const getTemplate = (tenantId, id) =>
  prisma.workoutTemplate.findFirst({
    where: { id, tenantId },
    include: {
      trainer: { select: { id: true, name: true } },
      days: {
        orderBy: { dayNumber: 'asc' },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
        },
      },
      _count: { select: { memberPlans: true } },
    },
  });

const createTemplate = (tenantId, data) =>
  prisma.workoutTemplate.create({
    data: { ...data, tenantId },
    include: {
      trainer: { select: { id: true, name: true } },
      _count: { select: { days: true, memberPlans: true } },
    },
  });

const updateTemplate = (tenantId, id, data) => {
  const allowed = ['name', 'description', 'goal', 'level', 'durationWeeks', 'daysPerWeek', 'isPublic'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.workoutTemplate.update({
    where: { id, tenantId },
    data: payload,
    include: {
      trainer: { select: { id: true, name: true } },
      days: {
        orderBy: { dayNumber: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' }, include: { exercise: true } } },
      },
    },
  });
};

const deleteTemplate = (tenantId, id) =>
  prisma.workoutTemplate.delete({ where: { id, tenantId } });

// ── Template Days ─────────────────────────────────────────────────────────────

const addDay = (templateId, data) =>
  prisma.workoutTemplateDay.create({
    data: { templateId, ...data },
    include: { exercises: { include: { exercise: true } } },
  });

const updateDay = (dayId, data) => {
  const allowed = ['label', 'isRestDay', 'dayNumber'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.workoutTemplateDay.update({
    where: { id: dayId },
    data: payload,
    include: { exercises: { include: { exercise: true } } },
  });
};

const deleteDay = (dayId) =>
  prisma.workoutTemplateDay.delete({ where: { id: dayId } });

const addExerciseToDay = (dayId, data) =>
  prisma.workoutTemplateExercise.create({
    data: { dayId, ...data },
    include: { exercise: true },
  });

const updateDayExercise = (id, data) => {
  const allowed = ['order', 'sets', 'reps', 'duration', 'restSeconds', 'weight', 'notes'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.workoutTemplateExercise.update({ where: { id }, data: payload, include: { exercise: true } });
};

const removeDayExercise = (id) =>
  prisma.workoutTemplateExercise.delete({ where: { id } });

// ── Member Plans ──────────────────────────────────────────────────────────────

const listMemberPlans = (tenantId, trainerId = null) =>
  prisma.memberPlan.findMany({
    where: { tenantId, ...(trainerId ? { trainerId } : {}) },
    include: {
      member:   { select: { id: true, name: true, phone: true, email: true } },
      trainer:  { select: { id: true, name: true } },
      template: { select: { id: true, name: true, goal: true, level: true, daysPerWeek: true, durationWeeks: true } },
      _count:   { select: { sessions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

const assignPlan = (tenantId, data) =>
  prisma.memberPlan.create({
    data: { ...data, tenantId },
    include: {
      member:   { select: { id: true, name: true } },
      trainer:  { select: { id: true, name: true } },
      template: { select: { id: true, name: true, goal: true } },
    },
  });

const updateMemberPlan = (tenantId, id, data) => {
  const allowed = ['status', 'notes', 'endDate'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.memberPlan.update({ where: { id, tenantId }, data: payload });
};

const deleteMemberPlan = (tenantId, id) =>
  prisma.memberPlan.delete({ where: { id, tenantId } });

// ── Sessions ──────────────────────────────────────────────────────────────────

const listSessions = (planId) =>
  prisma.workoutSession.findMany({
    where: { planId },
    include: { logs: true },
    orderBy: { date: 'desc' },
  });

const logSession = async (planId, data) => {
  const { logs, ...sessionData } = data;
  return prisma.workoutSession.create({
    data: {
      planId,
      ...sessionData,
      ...(logs?.length ? { logs: { create: logs } } : {}),
    },
    include: { logs: true },
  });
};

// ── Activity Feed ─────────────────────────────────────────────────────────────

const getActivity = async (tenantId, trainerId = null) => {
  const planWhere = { tenantId, ...(trainerId ? { trainerId } : {}) };
  const [plans, sessions, templates] = await Promise.all([
    prisma.memberPlan.findMany({
      where: planWhere,
      include: {
        member:   { select: { name: true } },
        trainer:  { select: { name: true } },
        template: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    prisma.workoutSession.findMany({
      where: { plan: planWhere },
      include: {
        plan: {
          include: {
            member:  { select: { name: true } },
            trainer: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    prisma.workoutTemplate.findMany({
      where: { tenantId, ...(trainerId ? { trainerId } : {}) },
      include: { trainer: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ]);
  return { plans, sessions, templates };
};

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = async (tenantId, trainerId = null) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const planWhere = { tenantId, ...(trainerId ? { trainerId } : {}) };
  const [totalTemplates, activePlans, membersWithPlans, sessionsThisWeek] = await Promise.all([
    trainerId
      ? prisma.workoutTemplate.count({ where: { tenantId, trainerId } })
      : prisma.workoutTemplate.count({ where: { tenantId } }),
    prisma.memberPlan.count({ where: { ...planWhere, status: 'ACTIVE' } }),
    prisma.memberPlan.findMany({ where: { ...planWhere, status: 'ACTIVE' }, distinct: ['memberId'], select: { memberId: true } }),
    prisma.workoutSession.count({ where: { plan: { ...planWhere }, date: { gte: weekAgo } } }),
  ]);
  return { totalTemplates, activePlans, membersWithPlans: membersWithPlans.length, sessionsThisWeek };
};

// ── Member Card (full profile) ────────────────────────────────────────────────

const getMemberCard = async (tenantId, memberId) => {
  const [member, plans, bodyStats, trainerNotes] = await Promise.all([
    prisma.customer.findFirst({ where: { id: memberId, tenantId } }),
    prisma.memberPlan.findMany({
      where: { tenantId, memberId },
      include: {
        template: {
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                exercises: {
                  orderBy: { order: 'asc' },
                  include: { exercise: true },
                },
              },
            },
          },
        },
        trainer: { select: { id: true, name: true, specialization: true } },
        sessions: {
          orderBy: { date: 'desc' },
          take: 60,
          include: { logs: { include: { session: false } } },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.memberBodyStats.findMany({
      where: { tenantId, memberId },
      orderBy: { recordedAt: 'asc' },
    }),
    prisma.trainerNote.findMany({
      where: { tenantId, memberId },
      include: { trainer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  return { member, plans, bodyStats, trainerNotes };
};

// ── Body Stats ────────────────────────────────────────────────────────────────

const addBodyStats = (tenantId, data) =>
  prisma.memberBodyStats.create({ data: { ...data, tenantId } });

const getBodyStats = (tenantId, memberId) =>
  prisma.memberBodyStats.findMany({
    where: { tenantId, memberId },
    orderBy: { recordedAt: 'asc' },
  });

// ── Trainer Notes ─────────────────────────────────────────────────────────────

const addTrainerNote = (tenantId, data) =>
  prisma.trainerNote.create({
    data: { ...data, tenantId },
    include: { trainer: { select: { id: true, name: true } } },
  });

const getTrainerNotes = (tenantId, memberId) =>
  prisma.trainerNote.findMany({
    where: { tenantId, memberId },
    include: { trainer: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

// ── Trainer Board ─────────────────────────────────────────────────────────────

const getTrainerBoard = async (tenantId, trainerId = null) => {
  const plans = await prisma.memberPlan.findMany({
    where: { tenantId, status: 'ACTIVE', ...(trainerId ? { trainerId } : {}) },
    include: {
      member:  { select: { id: true, name: true, phone: true, email: true, gymMembershipId: true, personalTrainerId: true } },
      trainer: { select: { id: true, name: true, specialization: true } },
      template: {
        select: {
          id: true, name: true, goal: true, level: true,
          daysPerWeek: true, durationWeeks: true,
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: { exercise: { select: { id: true, name: true, category: true, muscleGroup: true } } },
              },
            },
          },
        },
      },
      sessions: { orderBy: { date: 'desc' }, take: 60 },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 1=Mon … 7=Sun
  const todayDayOfWeek = ((new Date().getDay() + 6) % 7) + 1;

  return plans.map(plan => {
    const sessions = plan.sessions;
    const completedSessions = sessions.filter(s => s.completed).length;
    const daysSinceStart = Math.max(0, Math.floor((Date.now() - new Date(plan.startDate).getTime()) / 86400000));
    const expectedSessions = Math.ceil(daysSinceStart * plan.template.daysPerWeek / 7);
    const completionRate = expectedSessions > 0
      ? Math.min(100, Math.round(completedSessions / expectedSessions * 100)) : 0;

    // Consecutive completed-day streak (backwards from today)
    const sessionDates = new Set(
      sessions.filter(s => s.completed).map(s => new Date(s.date).toISOString().slice(0, 10))
    );
    let streak = 0;
    const d = new Date(); d.setHours(0, 0, 0, 0);
    while (sessionDates.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    const lastSession = sessions.find(s => s.completed);
    const daysSinceLastSession = lastSession
      ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000) : null;

    const todaysDay = plan.template.days.find(d => d.dayNumber === todayDayOfWeek) || null;

    return {
      plan:     { id: plan.id, memberId: plan.memberId, startDate: plan.startDate, status: plan.status, notes: plan.notes },
      member:   plan.member,
      template: { id: plan.template.id, name: plan.template.name, goal: plan.template.goal, level: plan.template.level, daysPerWeek: plan.template.daysPerWeek, durationWeeks: plan.template.durationWeeks },
      trainer:  plan.trainer,
      totalSessions: sessions.length,
      sessionCount: completedSessions,
      completionRate,
      streak,
      daysSinceLastSession,
      lastSession: lastSession ? { date: lastSession.date, completed: lastSession.completed, dayNumber: lastSession.dayNumber } : null,
      todaysDay,
      isRestDay: !todaysDay || todaysDay.isRestDay,
    };
  });
};

// ── Trainer Performance (admin overview) ─────────────────────────────────────

const getTrainerPerformance = async (tenantId) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [plans, sessionsThisWeek] = await Promise.all([
    prisma.memberPlan.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: {
        trainer:  { select: { id: true, name: true, specialization: true } },
        sessions: { where: { date: { gte: weekAgo } }, select: { completed: true } },
        _count: { select: { sessions: true } },
      },
    }),
    prisma.workoutSession.findMany({
      where: { plan: { tenantId }, date: { gte: weekAgo }, completed: true },
      include: { plan: { select: { trainerId: true } } },
    }),
  ]);

  const byTrainer = {};
  for (const plan of plans) {
    const tid = plan.trainerId;
    if (!byTrainer[tid]) {
      byTrainer[tid] = { trainer: plan.trainer, clients: 0, sessionsThisWeek: 0, completedThisWeek: 0 };
    }
    byTrainer[tid].clients++;
    const weekSessions = plan.sessions;
    byTrainer[tid].sessionsThisWeek += weekSessions.length;
    byTrainer[tid].completedThisWeek += weekSessions.filter(s => s.completed).length;
  }

  return Object.values(byTrainer).map(t => ({
    ...t,
    complianceRate: t.sessionsThisWeek > 0
      ? Math.round(t.completedThisWeek / t.sessionsThisWeek * 100) : 0,
  }));
};

module.exports = {
  listExercises, createExercise, updateExercise, deleteExercise, seedExercises,
  listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate,
  addDay, updateDay, deleteDay, addExerciseToDay, updateDayExercise, removeDayExercise,
  listMemberPlans, assignPlan, updateMemberPlan, deleteMemberPlan,
  listSessions, logSession, getActivity, getStats,
  getMemberCard, addBodyStats, getBodyStats, addTrainerNote, getTrainerNotes,
  getTrainerBoard, getTrainerPerformance,
};
