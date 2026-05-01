const PRESET_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function clampCount(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function closestStep(steps, target) {
  if (!steps.length) return target;
  let best = steps[0];
  let delta = Math.abs(best - target);
  for (const step of steps) {
    const current = Math.abs(step - target);
    if (current < delta) {
      best = step;
      delta = current;
    }
  }
  return best;
}

function basePatternSteps(pattern) {
  if (pattern === "hundreds") {
    return [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  }
  return [...PRESET_STEPS];
}

function pickSubset(baseSteps, count) {
  if (count >= baseSteps.length) return [...baseSteps];
  if (count <= 1) return [baseSteps[Math.floor(baseSteps.length / 2)]];

  const points = new Set();
  for (let i = 0; i < count; i += 1) {
    points.add(Math.round((i * (baseSteps.length - 1)) / (count - 1)));
  }

  const base500Index = baseSteps.indexOf(500);
  if (base500Index >= 0 && !points.has(base500Index) && count >= 3) {
    const sorted = Array.from(points);
    let replace = sorted[0];
    let distance = Math.abs(replace - base500Index);
    for (const point of sorted) {
      if (point === 0 || point === baseSteps.length - 1) continue;
      const delta = Math.abs(point - base500Index);
      if (delta < distance) {
        replace = point;
        distance = delta;
      }
    }
    points.delete(replace);
    points.add(base500Index);
  }

  return Array.from(points)
    .sort((a, b) => a - b)
    .map((index) => baseSteps[index]);
}

function nextShadeStep(previous) {
  return previous === 950 ? 1000 : previous + 100;
}

function extendSteps(baseSteps, count) {
  const unique = Array.from(new Set(baseSteps)).sort((a, b) => a - b);
  while (unique.length < count) {
    unique.push(nextShadeStep(unique[unique.length - 1]));
  }
  return unique.slice(0, count);
}

function deriveShadeSteps(pattern, shadeCount) {
  const base = basePatternSteps(pattern);
  const requested = clampCount(shadeCount, 6, 14, 11);
  if (requested <= base.length) return pickSubset(base, requested);
  return extendSteps(base, requested);
}

function resolveBaseStep(shadeSteps) {
  if (shadeSteps.includes(500)) return 500;
  const midpoint = (shadeSteps[0] + shadeSteps[shadeSteps.length - 1]) / 2;
  return closestStep(shadeSteps, midpoint);
}

export {
  basePatternSteps,
  closestStep,
  deriveShadeSteps,
  extendSteps,
  nextShadeStep,
  pickSubset,
  resolveBaseStep,
};
