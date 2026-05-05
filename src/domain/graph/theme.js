export const GRAPH_COLORS = {
  bg:           '#1a1a2e',
  idleLink:     '#334455',
  dimLink:      '#1f2a36',
  pathNode:     '#ffd166',
  pathLink:     '#ffd166',
  selectedRing: '#ffffff',
}

export const GRAPH_DIMS = {
  nodeRadius: {
    default:   4,
    highlight: 7,
  },
  ringWidth: {
    path:     2,
    selected: 1.5,
  },
  linkWidth: {
    path: 2.5,
    idle: 1,
  },
  dimNodeAlpha:      0.2,
  labelVisibleScale: 1.2,
  centerDurationMs:    400,
  fitDurationMs:         0,
  finalFitDurationMs:  400,
  fitPaddingPx:         60,
  warmupTicks:          60,
  cooldownTicks:       120,
  revealDelayMs:        80,
  closeFitDurationMs:    400,
  openCenterDelayMs:     280,
  closeFitDelayMs:       200,
}
