# Racing Gameplay Overhaul Plan

## Goal Description
The current race feels like a prototype with inconsistent road widths, corner-cutting loopholes, manual checkpoints, and janky spawn mechanics. We will overhaul the racing system to behave like a polished arcade racer by deriving the entire track (visuals, collision, checkpoints, and minimap) from a **single authoritative centerline curve** (`THREE.CatmullRomCurve3`).

## Proposed Changes

### 1. `src/game/data/viceCoastCircuit.ts`
- **[MODIFY]**: Remove manual `CHECKPOINTS` and `WORLD_BOUNDS`. 
- **[MODIFY]**: Introduce a `TrackCurve` utility that builds a `THREE.CatmullRomCurve3` from `TRACK_WAYPOINTS`.
- **[MODIFY]**: Add helper methods to sample the track: `getPointAt(u)`, `getTangentAt(u)`, `getNearestPoint(pos)`.
- **[MODIFY]**: Auto-generate checkpoint definitions at specific path intervals (e.g., 10%, 25%, 50%, 75%).

### 2. `src/game/components/Track.tsx`
- **[MODIFY]**: Refactor `buildRoadGeometry` and `buildCurbGeometry` to iterate over densely sampled points from the `CatmullRomCurve3` rather than the sparse jagged waypoints.
- **[MODIFY]**: Generate a seamless, constant-width road that loops cleanly.
- **[MODIFY]**: Generate physical collision walls/barriers directly adjacent to the road edges.

### 3. `src/game/hooks/useCarPhysics.ts`
- **[MODIFY]**: **Spawn:** On start, snap the car to `curve.getPointAt(0)` and align its rotation exactly with `curve.getTangentAt(0)`.
- **[MODIFY]**: **Collision:** Remove the naive `WORLD_BOUNDS` check. Instead, continuously check the car's distance to the nearest point on the track centerline. If `distance > roadWidth / 2 - carRadius`, the car is "off-road".
  - Clamp position to the track edge.
  - Apply `velocity *= 0.3` (soft bounce/friction).
- **[MODIFY]**: **Reset (R Key):** Snap the car to the nearest track point and align it to the local tangent.
- **[MODIFY]**: **Countdown Lock:** Ignore acceleration inputs if `phase !== 'racing'` (during 3-2-1).

### 4. `src/game/hooks/useRaceState.ts`
- **[MODIFY]**: **Checkpoints:** Update the crossing logic. A checkpoint triggers if the car is within distance AND `dot(carVelocity, checkpointTangent) > 0` (preventing backward triggering).
- **[MODIFY]**: **Strict Order:** Enforce strict sequential checkpoint clearing.
- **[MODIFY]**: **Timer:** Ensure the race timer starts exactly on "GO!".

### 5. `src/game/components/RaceHUD.tsx`
- **[MODIFY]**: Update the minimap SVG to be generated from the exact same smooth `CatmullRomCurve3` points, ensuring perfect 1:1 synchronization with the 3D world.

### 6. `src/game/components/RaceCamera.tsx` (If exists / needed)
- **[MODIFY]**: Ensure the chase camera smoothly interpolates to match the car's forward axis (`+Z`) to make cornering feel dynamic.

## User Review Required
> [!IMPORTANT]
> Since we are moving to a smooth spline, some corners (like the hairpin) will become sweeping curves rather than sharp 90-degree angles. I will adjust the tension of the curve to keep them tight, but let me know if you want the track to remain blocky instead of smooth.

> [!WARNING]
> The custom collision detection (distance to centerline) is highly performant but assumes the road doesn't overlap itself vertically at the exact same XZ coordinates. (Vice Coast is flat, so this is safe).

## Verification Plan
1. **Automated / Manual Validation:** 
   - Start the race. Verify the car points forward.
   - Hold W during countdown. Verify car does not move until GO.
   - Attempt to drive off the track. Verify the car bumps into the invisible/visible walls generated at the road's edges.
   - Attempt to drive backward through a checkpoint. Verify it does not register.
   - Press 'R' after crashing. Verify the car resets exactly onto the centerline facing the correct direction.
