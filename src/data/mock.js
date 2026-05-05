// Mock data for the Wiki Knowledge Graph — espresso machine domain.
// Mirrors the shape of the real /api/* responses so components need no changes
// beyond swapping fetch() calls for these helpers.

const NODES = [
  { slug: 'brewing-cycle',    title: 'Brewing Cycle',     type: 'process_stage' },
  { slug: 'pre-infusion',     title: 'Pre-infusion',      type: 'process_stage' },
  { slug: 'extraction',       title: 'Extraction',        type: 'process_stage' },
  { slug: 'cooldown',         title: 'Cooldown & Rest',   type: 'process_stage' },
  { slug: 'boiler',           title: 'Boiler',            type: 'machine_element' },
  { slug: 'pump',             title: 'Rotary Pump',       type: 'machine_element' },
  { slug: 'group-head',       title: 'Group Head',        type: 'machine_element' },
  { slug: 'pid-controller',   title: 'PID Controller',    type: 'machine_element' },
  { slug: 'portafilter',      title: 'Portafilter',       type: 'machine_part' },
  { slug: 'basket',           title: 'Filter Basket',     type: 'machine_part' },
  { slug: 'group-gasket',     title: 'Group Gasket',      type: 'machine_part' },
  { slug: 'backflushing',     title: 'Backflushing',      type: 'procedure' },
  { slug: 'descaling',        title: 'Descaling',         type: 'procedure' },
  { slug: 'crema',            title: 'Crema',             type: 'concept' },
  { slug: 'channeling',       title: 'Channeling',        type: 'concept' },
  { slug: 'extraction-ratio', title: 'Extraction Ratio',  type: 'concept' },
]

const LINKS = [
  { source: 'brewing-cycle',    target: 'pre-infusion',     label: 'begins_with' },
  { source: 'brewing-cycle',    target: 'extraction',       label: 'progresses_to' },
  { source: 'brewing-cycle',    target: 'cooldown',         label: 'ends_with' },
  { source: 'boiler',           target: 'pre-infusion',     label: 'heats_water_for' },
  { source: 'boiler',           target: 'extraction',       label: 'pressurises' },
  { source: 'pid-controller',   target: 'boiler',           label: 'regulates' },
  { source: 'pump',             target: 'boiler',           label: 'feeds' },
  { source: 'pre-infusion',     target: 'pump',             label: 'uses' },
  { source: 'extraction',       target: 'group-head',       label: 'passes_through' },
  { source: 'extraction',       target: 'basket',           label: 'filtered_by' },
  { source: 'extraction',       target: 'crema',            label: 'produces' },
  { source: 'extraction',       target: 'channeling',       label: 'risk_of' },
  { source: 'extraction',       target: 'extraction-ratio', label: 'quantified_by' },
  { source: 'group-head',       target: 'portafilter',      label: 'accepts' },
  { source: 'group-head',       target: 'group-gasket',     label: 'sealed_by' },
  { source: 'portafilter',      target: 'basket',           label: 'holds' },
  { source: 'channeling',       target: 'extraction-ratio', label: 'degrades' },
  { source: 'backflushing',     target: 'group-head',       label: 'cleans' },
  { source: 'backflushing',     target: 'group-gasket',     label: 'preserves' },
  { source: 'descaling',        target: 'boiler',           label: 'treats' },
]

// Build outgoing/incoming link maps keyed by slug
const outMap = {}
const inMap  = {}
LINKS.forEach(({ source, target, label }) => {
  const src = NODES.find(n => n.slug === source)
  const tgt = NODES.find(n => n.slug === target)
  ;(outMap[source] ??= []).push({ direction: 'out', slug: target,  title: tgt.title, label })
  ;(inMap[target]  ??= []).push({ direction: 'in',  slug: source,  title: src.title, label })
})

function chunkLinks(slug) {
  return [...(outMap[slug] ?? []), ...(inMap[slug] ?? [])]
}

// Per-node rich content
const DETAILS = {
  'brewing-cycle': {
    summary: 'End-to-end shot sequence from water heating to cup delivery, taking 25–35 seconds total.',
    body_markdown: `## Overview

The brewing cycle covers every step the machine performs from the moment the user
triggers a shot to the final delivery of espresso into the cup.

### Typical timing

| Phase | Duration |
|---|---|
| Pre-infusion | 3–8 s |
| Extraction | 20–28 s |
| Cooldown | passive |

### Key parameters

- **Water temperature**: 90–96 °C at the group head
- **Brew pressure**: 9 bar (±0.5 bar)
- **Yield ratio**: 1 : 2 (dry coffee in : liquid espresso out)

> Small deviations in any parameter propagate non-linearly — a 1 °C
> drop in brew temperature can shift extraction yield by 2–3 %.`,
    sources: [
      { source_name: 'espresso_fundamentals.mp4', part_index: 1, start_seconds: 0,   end_seconds: 312, note: 'Cycle overview and parameter table' },
      { source_name: 'espresso_fundamentals.mp4', part_index: 2, start_seconds: 312, end_seconds: 598, note: 'Timing deep-dive' },
    ],
  },

  'extraction': {
    summary: 'The 20–28 second phase where pressurised hot water is forced through the compacted coffee puck.',
    body_markdown: `## Extraction

Hot water at 9 bar is forced through the compacted coffee puck inside the
**filter basket**. Soluble compounds dissolve in sequence:

1. Acids and fruity esters (early extraction)
2. Sugars and caramels (mid extraction)
3. Bitter phenols and tannins (late extraction)

### Yield window

The ideal **extraction ratio** sits between 18 % and 22 % of the dry coffee
weight dissolved into the liquid. Going under produces sour, thin espresso;
going over produces harsh bitterness.

### Channeling risk

If the puck has uneven density — from poor distribution or tamping — water
finds the path of least resistance and punches a channel through the puck,
dramatically under-extracting the rest of the bed. See **Channeling**.`,
    sources: [
      { source_name: 'espresso_fundamentals.mp4', part_index: 3, start_seconds: 598, end_seconds: 921, note: 'Extraction chemistry and yield window' },
      { source_name: 'machine_maintenance_guide.pdf', part_index: 2, start_seconds: null, end_seconds: null, note: 'Troubleshooting uneven extraction' },
    ],
  },

  'boiler': {
    summary: 'Stainless-steel pressure vessel that heats and stores water for brewing and steam generation.',
    body_markdown: `## Boiler

Prosumer machines typically use one of three boiler architectures:

| Type | Description |
|---|---|
| Single boiler | One boiler switches between brew and steam temps |
| Heat exchanger | Steam boiler with a brew-water loop inside |
| Dual boiler | Separate brew and steam boilers — independent control |

### Temperature stability

The PID controller samples the boiler's thermocouple every 200 ms and adjusts
the heating element duty cycle to hold brew temperature to ±0.3 °C. Thermal
mass of the group head means the water temperature at the puck is typically
1–2 °C lower than the boiler set point.

### Maintenance

Scale build-up on the heating element increases thermal resistance, raising
energy consumption and reducing temperature stability. **Descaling** with a
mild citric acid solution removes calcium carbonate deposits.`,
    sources: [
      { source_name: 'espresso_fundamentals.mp4', part_index: 2, start_seconds: 312, end_seconds: 598, note: 'Boiler architecture comparison' },
      { source_name: 'machine_maintenance_guide.pdf', part_index: 3, start_seconds: null, end_seconds: null, note: 'Scale removal procedures' },
    ],
  },

  'channeling': {
    summary: 'A defect where water finds a low-resistance path through the puck, causing uneven extraction.',
    body_markdown: `## Channeling

Channeling occurs when the coffee puck has a **density gradient** — a crack,
void, or area of uneven tamp — that water exploits preferentially.

### Visual signs

- Pale, watery stream early in the shot
- Uneven colour on spent puck after extraction
- Drastic deviation of actual vs target extraction ratio

### Root causes

1. Uneven distribution before tamping
2. Tamper not level (>2° tilt creates a pressure ramp)
3. Group gasket failure allowing water to bypass the puck edge
4. Stale coffee with excessive fines migration

### Mitigation

Use a distribution tool (WDT) before tamping, and a calibrated
tamper with a flat base. Inspect the group gasket every 3 months.`,
    sources: [
      { source_name: 'espresso_fundamentals.mp4', part_index: 3, start_seconds: 598, end_seconds: 921, note: 'Channeling causes and prevention' },
    ],
  },

  'backflushing': {
    summary: 'Routine procedure that forces water back through the group head to dissolve coffee oil build-up.',
    body_markdown: `## Backflushing

Backflushing is performed by inserting a **blind basket** (no holes) into the
portafilter. When the pump runs, pressure builds until the OPV (over-pressure
valve) opens and forces water backward through the shower screen and solenoid
valve, dislodging coffee oils and residue.

### Schedule

| Machine type | Frequency |
|---|---|
| Home (1–2 shots/day) | Weekly |
| Office (10–20 shots/day) | Daily |
| Café (100+ shots/day) | Every 2–3 hours |

### With detergent

Once per week, add one tablet or 1 g of **Puly Caff** or equivalent espresso
machine detergent to the blind basket. Run 5 cycles × 10 seconds, then 5
rinse cycles without detergent.

> Never use backflushing detergent more frequently than weekly — it can
> degrade rubber seals including the group gasket.`,
    sources: [
      { source_name: 'machine_maintenance_guide.pdf', part_index: 1, start_seconds: null, end_seconds: null, note: 'Daily cleaning protocol' },
    ],
  },

  'crema': {
    summary: 'The reddish-brown emulsion of CO₂ bubbles and coffee oils that forms on top of espresso.',
    body_markdown: `## Crema

Crema is a **colloidal foam** stabilised by surfactant-like coffee oils. It
forms because CO₂ — dissolved in the bean during roasting — comes out of
solution under the pressure drop as espresso exits the basket.

### Crema as a freshness indicator

CO₂ degasses from roasted coffee over 2–4 weeks. Very fresh coffee (< 5 days
post-roast) produces thick, bitter crema; coffee roasted > 3 weeks ago
produces little crema regardless of technique.

### Common misconceptions

- **Dark tiger-striping** is not a quality indicator — it's caused by oil
  droplet size variation, not extraction quality.
- Crema thickness alone does not indicate a good shot; a well-extracted
  shot with older coffee may have thin but well-flavoured crema.`,
    sources: [
      { source_name: 'espresso_fundamentals.mp4', part_index: 3, start_seconds: 598, end_seconds: 921, note: 'Crema chemistry' },
    ],
  },

  'pid-controller': {
    summary: 'Digital controller that maintains boiler temperature within ±0.3 °C using PID feedback.',
    body_markdown: `## PID Controller

A **Proportional-Integral-Derivative** controller samples the boiler
thermocouple and adjusts element duty cycle to minimise temperature error.

### Tuning parameters

| Term | Effect when increased |
|---|---|
| P (proportional) | Faster response, more oscillation |
| I (integral) | Eliminates steady-state error, slower |
| D (derivative) | Dampens oscillation, noise-sensitive |

Factory default values are calibrated for the thermal mass of the specific
boiler. Re-tuning is rarely needed unless the boiler or thermocouple is
replaced.`,
    sources: [
      { source_name: 'espresso_fundamentals.mp4', part_index: 2, start_seconds: 312, end_seconds: 598, note: 'Temperature control systems' },
    ],
  },

  'descaling': {
    summary: 'Procedure to dissolve calcium carbonate deposits from the boiler and internal water paths.',
    body_markdown: `## Descaling

Hard water deposits calcium carbonate (limescale) on any surface in contact
with heated water. The boiler heating element is the most affected component.

### Descaling agent

Use a purpose-made machine descaler or a **citric acid solution** (1 g per
100 mL water). Never use vinegar — acetic acid attacks brass fittings.

### Procedure (generic)

1. Fill reservoir with descaling solution
2. Run half the volume through the machine
3. Pause for 15 minutes (soak)
4. Run remainder through
5. Rinse with three full reservoirs of fresh water

### Frequency

Depends on water hardness. At 300 ppm TDS (hard water) descale every
4–6 weeks; at 100 ppm (soft water) every 3–4 months.`,
    sources: [
      { source_name: 'machine_maintenance_guide.pdf', part_index: 3, start_seconds: null, end_seconds: null, note: 'Scale removal procedures' },
    ],
  },
}

// Default detail for nodes without a DETAILS entry
function defaultDetail(node) {
  return {
    summary: null,
    body_markdown: `## ${node.title}\n\nNo detailed content available for this node yet.`,
    sources: [],
  }
}

// ── Exported data ────────────────────────────────────────────────────────────

export const graphData = {
  nodes: NODES.map(n => ({ slug: n.slug, title: n.title, type: n.type })),
  links: LINKS.map(l => ({ source: l.source, target: l.target, label: l.label })),
}

export function getChunk(slug) {
  const node = NODES.find(n => n.slug === slug)
  if (!node) return null
  const detail = DETAILS[slug] ?? defaultDetail(node)
  return {
    slug:          node.slug,
    title:         node.title,
    type:          node.type,
    summary:       detail.summary,
    body_markdown: detail.body_markdown,
    links:         chunkLinks(slug),
    sources:       detail.sources,
  }
}

export const sources = [
  {
    source_name:       'espresso_fundamentals.mp4',
    source_path:       '/recordings/espresso_fundamentals.mp4',
    source_sha256:     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    source_part_count: 4,
    processor:         'whisper',
    processor_version: '1.5.4',
    processed_at:      '2024-03-15T10:23:00Z',
    parts: [
      { part_index: 1, title: 'Introduction & Brewing Cycle',   start_seconds: 0,    end_seconds: 312,  duration_seconds: 312, language: 'en' },
      { part_index: 2, title: 'Water, Pressure & Temperature',  start_seconds: 312,  end_seconds: 624,  duration_seconds: 312, language: 'en' },
      { part_index: 3, title: 'Extraction Chemistry',           start_seconds: 624,  end_seconds: 921,  duration_seconds: 297, language: 'en' },
      { part_index: 4, title: 'Maintenance Overview',           start_seconds: 921,  end_seconds: 1380, duration_seconds: 459, language: 'en' },
    ],
  },
  {
    source_name:       'machine_maintenance_guide.pdf',
    source_path:       '/docs/machine_maintenance_guide.pdf',
    source_sha256:     'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5',
    source_part_count: 3,
    processor:         'pdf_parser',
    processor_version: '2.3.1',
    processed_at:      '2024-03-20T14:45:00Z',
    parts: [
      { part_index: 1, title: 'Daily Cleaning Protocol',   start_seconds: null, end_seconds: null, duration_seconds: null, language: 'en' },
      { part_index: 2, title: 'Weekly Maintenance',        start_seconds: null, end_seconds: null, duration_seconds: null, language: 'en' },
      { part_index: 3, title: 'Descaling & Troubleshooting', start_seconds: null, end_seconds: null, duration_seconds: null, language: 'en' },
    ],
  },
  {
    source_name:       'group_head_teardown.mp4',
    source_path:       '/recordings/group_head_teardown.mp4',
    source_sha256:     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    source_part_count: 2,
    processor:         'whisper',
    processor_version: '1.5.4',
    processed_at:      '2024-04-02T09:10:00Z',
    parts: [
      { part_index: 1, title: 'Disassembly & Gasket Replacement', start_seconds: 0,   end_seconds: 540,  duration_seconds: 540, language: 'en' },
      { part_index: 2, title: 'Shower Screen & Reassembly',       start_seconds: 540, end_seconds: 1020, duration_seconds: 480, language: 'en' },
    ],
  },
]

const PART_CONTENT = {
  'espresso_fundamentals.mp4__1': `## Introduction & Brewing Cycle

This section introduces the fundamental concepts of espresso extraction and
walks through the complete brewing cycle from cold start to cup.

### What is espresso?

Espresso is produced by forcing water at high pressure (9 bar) through finely
ground, compacted coffee. The short contact time (25–35 s) and high pressure
produce a concentrated, flavour-dense beverage topped with crema.

### The three phases

1. **Pre-infusion** — low-pressure wetting of the puck to equalise density
2. **Extraction** — full pressure extraction of soluble compounds
3. **Cooldown** — passive temperature drop as water recirculates`,

  'espresso_fundamentals.mp4__2': `## Water, Pressure & Temperature

### The role of temperature

Water temperature at the group head — not at the boiler — determines
extraction chemistry. Target range is **90–96 °C**, with darker roasts
preferring the lower end to avoid exacerbating bitterness.

### Pressure profiling

Modern machines allow dynamic pressure control across the shot:
- Start at 3–4 bar during pre-infusion
- Ramp to 9 bar for extraction
- Optional pressure drop to 6 bar in the final third to reduce bitterness

### PID temperature control

The PID controller samples the boiler thermocouple every 200 ms. Accurate
temperature control reduces shot-to-shot variance by up to 40 % compared
to a simple on/off thermostat.`,

  'espresso_fundamentals.mp4__3': `## Extraction Chemistry

### Compound dissolution sequence

Soluble compounds leave the coffee bed in a predictable order:

| Compound class | Extraction phase | Flavour note |
|---|---|---|
| Organic acids | Early (0–8 s) | Bright, fruity |
| Sugars, melanoidins | Mid (8–20 s) | Sweet, caramel |
| Phenols, tannins | Late (20–28 s) | Bitter, dry |

### Extraction yield

Total dissolved solids (TDS) measured in the cup divided by dry coffee weight.
Target: **18–22 %**. Below 18 % is under-extracted (sour); above 22 % is
over-extracted (bitter).

### Channeling

A density gradient in the puck causes water to channel, bypassing most of the
bed. The resulting espresso is simultaneously over-extracted (the channel) and
under-extracted (the rest) — acrid and sour at once.`,

  'espresso_fundamentals.mp4__4': `## Maintenance Overview

Regular maintenance is the single biggest factor in shot-to-shot consistency.

### Daily
- Purge group head before and after each session
- Wipe portafilter and basket immediately after use
- Empty and rinse drip tray

### Weekly
- Backflush with blind basket (water only × 5)
- Backflush with detergent × 5, then rinse × 5
- Inspect group gasket for cracks or deformation

### Monthly
- Clean portafilter spouts with a pin or fine brush
- Check pump pressure with a portafilter gauge
- Inspect water reservoir for algae or mineral film`,

  'machine_maintenance_guide.pdf__1': `## Daily Cleaning Protocol

### Before first use
1. Flush 100 mL through the group head without a portafilter to purge any
   stale water from overnight.
2. Run the steam wand for 3 seconds to clear condensate.

### After each shot
1. Remove portafilter immediately — coffee deteriorates the gasket if left.
2. Knock out spent puck; rinse basket under hot water.
3. Wipe shower screen with a damp cloth.

### End of day
1. Backflush with plain water (5 × 10 s cycles).
2. Empty and rinse drip tray and grinds drawer.
3. Wipe exterior with a damp microfibre cloth.
4. Leave group head lever or button in the off position.`,

  'machine_maintenance_guide.pdf__2': `## Weekly Maintenance

### Backflush with detergent
1. Insert blind basket into portafilter.
2. Add 1 g Puly Caff (or equivalent).
3. Run 5 × 10 s cycles with 5 s rest between.
4. Remove detergent; run 5 plain-water rinse cycles.
5. Remove portafilter, rinse basket thoroughly.

### Basket inspection
Check the basket for:
- Blocked holes (use a pin if blocked)
- Deformation of the rim (replace if not seating flush)
- Pitting or corrosion on the inner surface

### Water softener check (if fitted)
Regenerate the ion-exchange resin per manufacturer schedule.`,

  'machine_maintenance_guide.pdf__3': `## Descaling & Troubleshooting

### Descaling step-by-step
1. Mix descaling solution: 8 g citric acid per litre of water.
2. Fill reservoir; run half the volume at low flow.
3. Pause 15 minutes — acid dissolves carbonate deposits.
4. Resume; run remainder through.
5. Rinse with three full reservoirs of fresh water.
6. Test TDS of rinse water — should match input water TDS.

### Common faults

| Symptom | Likely cause | Fix |
|---|---|---|
| Slow flow / high pressure | Blocked basket or grind too fine | Clean basket; adjust grinder |
| No crema | Old coffee or water too cool | Fresh beans; check temp set point |
| Leaking around portafilter | Worn group gasket | Replace gasket |
| Steam pressure low | Scale on boiler element | Descale |`,

  'group_head_teardown.mp4__1': `## Disassembly & Gasket Replacement

### Tools required
- Flathead screwdriver (large, for shower screen screw)
- 14 mm socket or spanner (for group nut on some models)
- Group gasket tool or wooden dowel

### Procedure
1. Remove portafilter.
2. Unscrew the shower screen (usually a single central screw).
3. Pull out the shower screen and diffuser plate.
4. The group gasket is now visible as a rubber ring in the group head recess.
5. Use a gasket pick or flat screwdriver to lever it out.
6. Clean recess with a brush and group head cleaner.
7. Press new gasket firmly into the recess — it should sit flush.

> Gaskets are **model-specific**. Verify the inner diameter, outer
> diameter, and thickness before ordering.`,

  'group_head_teardown.mp4__2': `## Shower Screen & Reassembly

### Shower screen inspection
- Hold the screen up to light — all holes should be open and uniform.
- A blocked or corroded screen causes uneven water distribution and
  is a common cause of channeling.
- Replace if more than 10 % of holes are blocked or the metal is pitted.

### Reassembly
1. Seat the diffuser plate with the ribbed face down.
2. Place the shower screen face-up against the diffuser.
3. Thread the screw by hand to avoid cross-threading.
4. Tighten finger-tight plus ¼ turn — do not over-torque.
5. Reinsert portafilter; run 100 mL to check for leaks.

### Post-reassembly test
Pull a shot: watch for even, symmetrical extraction across the puck
surface after removing the portafilter immediately after the shot.`,
}

export function getPart(sourceName, partIndex) {
  const key = `${sourceName}__${partIndex}`
  const source = sources.find(s => s.source_name === sourceName)
  const part   = source?.parts.find(p => p.part_index === partIndex)
  if (!part) return null
  return {
    source_name:   sourceName,
    part_index:    partIndex,
    title:         part.title,
    start_seconds: part.start_seconds,
    end_seconds:   part.end_seconds,
    language:      part.language,
    body_markdown: PART_CONTENT[key] ?? `## ${part.title}\n\nTranscript not available.`,
  }
}
