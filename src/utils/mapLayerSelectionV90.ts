export interface MapLayerSelectionStateV90 {
  activeKeys: string[];
  opacities: Record<string, number>;
  years: Record<string, number | null>;
  focusKey: string | null;
}

export function removeRecordKey<T>(
  record: Record<string, T>,
  key: string
): Record<string, T> {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}

export function toggleLayerSelectionV90(
  state: MapLayerSelectionStateV90,
  key: string,
  defaultOpacity: number
): MapLayerSelectionStateV90 {
  const exists = state.activeKeys.includes(key);

  if (exists) {
    const nextKeys = state.activeKeys.filter((candidate) => candidate !== key);
    return {
      activeKeys: nextKeys,
      opacities: removeRecordKey(state.opacities, key),
      years: removeRecordKey(state.years, key),
      focusKey:
        state.focusKey === key
          ? nextKeys[nextKeys.length - 1] ?? null
          : state.focusKey && nextKeys.includes(state.focusKey)
          ? state.focusKey
          : nextKeys[nextKeys.length - 1] ?? null,
    };
  }

  return {
    activeKeys: [...state.activeKeys, key],
    opacities: {
      ...state.opacities,
      [key]: state.opacities[key] ?? defaultOpacity,
    },
    years: { ...state.years },
    focusKey: key,
  };
}

export function bringLayerToFrontV90(
  state: MapLayerSelectionStateV90,
  key: string
): MapLayerSelectionStateV90 {
  if (!state.activeKeys.includes(key)) return state;
  const nextKeys = [
    ...state.activeKeys.filter((candidate) => candidate !== key),
    key,
  ];
  return {
    ...state,
    activeKeys: nextKeys,
    focusKey: key,
  };
}

export function clearLayerSelectionV90(): MapLayerSelectionStateV90 {
  return {
    activeKeys: [],
    opacities: {},
    years: {},
    focusKey: null,
  };
}

export function mapLayerSelectionSignatureV90(
  state: MapLayerSelectionStateV90
): string {
  const opacityPart = state.activeKeys
    .map((key) => `${key}:${state.opacities[key] ?? ""}`)
    .join("|");
  const yearPart = state.activeKeys
    .map((key) => `${key}:${state.years[key] ?? "none"}`)
    .join("|");
  return `${state.activeKeys.join("|")}::${opacityPart}::${yearPart}::${
    state.focusKey ?? "none"
  }`;
}
