/* IWS Estimator — pricing model
   Mirrors the structure of IWS's Cabinet Vision "_Materials and Labor" pricing template:
   Material + Hardware + Buyout + Labor budgets per room, then overhead & profit %, then the finish quote.
   Rates come straight from the five historical breakdowns. Per-cabinet quantity drivers are fitted from
   the rooms with known cabinet counts (Steve Robles, Chris Lang, Bhimani). Everything is editable in the app. */
(function (global) {
  'use strict';

  // ---- Rate card (observed on the breakdowns) ----------------------------------------------
  const RATES = {
    shopLaborHr: 75,          // "Labor" line
    machiningHr: 150,         // "Machining" line
    drawerAsmHr: 75,          // "Drawer Assembly Labor"
    faceFramePart: 15,        // "# Face Frame Parts"
    installPerCab: 90,        // "Add-On Per Cab / Install Labor"
    installMarkupPct: 50,     // the 50 in the markup column on the install line
    overheadPct: 50,          // "Add-On %Total" (Bhimani used 63.6)
    hinge: 7.20,              // Blum inset or frameless
    guide: 26,                // Tandem 563H (some jobs 20)
    shelfPin: 0.22,
    pilotScrew: 0.03,
    materialMarkupPct: 20,    // sheet goods and boards
    bandingMarkupPct: 10,
  };

  // Door styles: $/sq ft as seen on the breakdowns, plus the markup % IWS applied to that line
  const DOOR_STYLES = [
    { id: 'shaker_paint',  label: 'Shaker, paint grade',          rate: 20.00, markup: 10, finish: 'painted' },
    { id: 'shaker_paint_lo', label: 'Shaker, paint grade (economy $16.80)', rate: 16.80, markup: 10, finish: 'painted' },
    { id: 'raised_panel',  label: 'Raised panel, paint grade',    rate: 20.00, markup: 0,  finish: 'painted' },
    { id: 'slab',          label: 'Slab',                         rate: 30.00, markup: 10, finish: 'painted' },
    { id: 'glass',         label: 'Shaker glass / mullion',       rate: 30.00, markup: 10, finish: 'painted' },
    { id: 'skinny_stained',label: 'Skinny shaker, stained',       rate: 36.00, markup: 10, finish: 'stained' },
    { id: 'shaker_stained',label: 'Shaker, stained hardwood',     rate: 53.20, markup: 10, finish: 'stained' },
    { id: 'reeded',        label: 'Reeded / fluted',              rate: 100.00, markup: 10, finish: 'stained' },
    { id: 'none',          label: 'No doors (open shelving)',     rate: 0,     markup: 0,  finish: 'painted' },
  ];

  const DRAWER_BOXES = [
    { id: 'vortex',   label: 'Vortex / Blum (buyout)', rate: 20 },
    { id: 'dovetail', label: 'IWS dovetail',           rate: 75 },
    { id: 'dovetail_premium', label: 'IWS dovetail, hardwood', rate: 85 },
  ];

  const MATERIAL_TIERS = [
    { id: 'paint',    label: 'Paint grade (UV birch / maple)',  mult: 1.00 },
    { id: 'hardwood', label: 'Stain grade (rift oak, walnut)', mult: 1.15 },
    { id: 'premium',  label: 'Premium / exotic',               mult: 1.40 },
  ];

  const FINISH_OPTIONS = [
    { id: 'painted',   label: 'Painted (outsourced finisher)', perCab: 220 },
    { id: 'stained',   label: 'Stained / clear (outsourced)',  perCab: 250 },
    { id: 'unfinished',label: 'Unfinished / by others',        perCab: 0 },
  ];

  // ---- Per-cabinet drivers (fitted) ----------------------------------------------------------
  // Observed per cabinet: material $124-151 (kitchens), hardware $38-41, door area 4-9 sq ft,
  // drawers 0.45-0.70, shop 1.1-1.3 hrs (1.9 on the newest template), machining 0.5-0.85 hrs,
  // face frame parts 3.6-4.9 (inset only).
  const DRIVERS = {
    materialPerCab: 135,      // $ per cabinet, already includes the 20% material markup
    hardwarePerCab: 38,       // $ per cabinet for hinges, guides, pins, screws (no organizers)
    doorSqFtPerCab: 6.0,      // sq ft of doors + drawer fronts + applied panels per cabinet
    drawersPerCab: 0.6,       // drawer boxes per cabinet
    shopHrsPerCab: 1.25,      // "Labor" hours
    machiningHrsPerCab: 0.70, // CNC hours
    faceFramePartsPerCab: 4.3,// inset only
    drawerAsmHrsPerDrawer: 0.25, // inset only (drawer assembly labor line)
    insetShopHrsMult: 1.0,    // extra shop time multiplier for inset (data says none beyond face frames)
  };

  const DEFAULTS = { rates: RATES, drivers: DRIVERS };

  function byId(list, id) { return list.find((x) => x.id === id) || list[0]; }

  // ---- Room estimate -------------------------------------------------------------------------
  // room: { name, cabinets, construction:'frameless'|'inset', doorStyle, materialTier, drawerBox,
  //         drawersPerCab?, doorSqFtPerCab?, organizers, installMode:'percab'|'hours'|'lump',
  //         installHrs, installLump, travel, otherAddons, overrides:{...} }
  function estimateRoom(room, cfg) {
    const R = cfg.rates, D = cfg.drivers, o = room.overrides || {};
    const cabs = Number(room.cabinets) || 0;
    const inset = room.construction === 'inset';
    const door = byId(DOOR_STYLES, room.doorStyle);
    const tier = byId(MATERIAL_TIERS, room.materialTier);
    const box = byId(DRAWER_BOXES, room.drawerBox);

    // Quantities (model unless overridden)
    const q = {
      doorSqFt: num(o.doorSqFt, cabs * (num(room.doorSqFtPerCab, D.doorSqFtPerCab))),
      drawers: num(o.drawers, cabs * num(room.drawersPerCab, D.drawersPerCab)),
      shopHrs: num(o.shopHrs, cabs * D.shopHrsPerCab * (inset ? D.insetShopHrsMult : 1)),
      machiningHrs: num(o.machiningHrs, cabs * D.machiningHrsPerCab),
      faceFrameParts: num(o.faceFrameParts, inset ? cabs * D.faceFramePartsPerCab : 0),
      material: num(o.material, cabs * D.materialPerCab * tier.mult),
      hardware: num(o.hardware, cabs * D.hardwarePerCab * (door.id === 'none' ? 0.3 : 1)),
    };
    q.drawerAsmHrs = num(o.drawerAsmHrs, inset ? q.drawers * D.drawerAsmHrsPerDrawer : 0);

    const lines = [];
    const add = (group, label, qty, unit, rate, markupPct, total) => lines.push({ group, label, qty, unit, rate, markupPct, total });

    // Material & hardware budgets
    add('Material', `Sheet goods, boards, banding (${tier.label})`, cabs, 'cab', D.materialPerCab * tier.mult, R.materialMarkupPct, q.material);
    add('Hardware', 'Hinges, guides, pins, fasteners', cabs, 'cab', D.hardwarePerCab, 0, q.hardware);
    const organizers = Number(room.organizers) || 0;
    if (organizers) add('Hardware', 'Organizers, inserts, pull-outs', 1, 'lot', organizers, 0, organizers);

    // Buyout budget
    const doorTotal = q.doorSqFt * door.rate * (1 + door.markup / 100);
    add('Buyout', `Doors & panels: ${door.label}`, q.doorSqFt, 'sq ft', door.rate, door.markup, doorTotal);
    const drawerTotal = q.drawers * box.rate;
    add('Buyout', `Drawer boxes: ${box.label}`, q.drawers, 'ea', box.rate, 0, drawerTotal);

    // Labor budget
    add('Labor', 'Shop labor', q.shopHrs, 'hrs', R.shopLaborHr, 0, q.shopHrs * R.shopLaborHr);
    add('Labor', 'Machining (CNC)', q.machiningHrs, 'hrs', R.machiningHr, 0, q.machiningHrs * R.machiningHr);
    if (inset) {
      add('Labor', 'Drawer assembly labor', q.drawerAsmHrs, 'hrs', R.drawerAsmHr, 0, q.drawerAsmHrs * R.drawerAsmHr);
      add('Labor', 'Face frame parts', q.faceFrameParts, 'ea', R.faceFramePart, 0, q.faceFrameParts * R.faceFramePart);
    }
    let install = 0;
    if (room.installMode === 'hours') { install = (Number(room.installHrs) || 0) * R.installPerCab; add('Labor', 'Install labor (hours)', Number(room.installHrs) || 0, 'hrs', R.installPerCab, 0, install); }
    else if (room.installMode === 'lump') { install = Number(room.installLump) || 0; add('Labor', 'Install labor (lump sum)', 1, 'lot', install, 0, install); }
    else if (room.installMode !== 'none') { install = cabs * R.installPerCab * (1 + R.installMarkupPct / 100); add('Labor', 'Install labor', cabs, 'cab', R.installPerCab, R.installMarkupPct, install); }
    const travel = Number(room.travel) || 0; if (travel) add('Labor', 'Travel', 1, 'lot', travel, 0, travel);
    const other = Number(room.otherAddons) || 0; if (other) add('Labor', room.otherLabel || 'Other add-ons', 1, 'lot', other, 0, other);

    const budgets = { Material: 0, Hardware: 0, Buyout: 0, Labor: 0 };
    lines.forEach((l) => { budgets[l.group] += l.total; });
    const subtotal = Object.values(budgets).reduce((a, b) => a + b, 0);
    return { name: room.name, cabinets: cabs, construction: room.construction, quantities: q, lines, budgets, subtotal, doorFinish: door.finish };
  }

  // ---- Job estimate --------------------------------------------------------------------------
  // job: { rooms:[...], overheadPct?, finish:'painted'|'stained'|'unfinished', finishQuote? (overrides), finishPerCab? }
  function estimateJob(job, cfg) {
    cfg = cfg || DEFAULTS;
    const rooms = (job.rooms || []).map((r) => estimateRoom(r, cfg));
    const subtotal = rooms.reduce((a, r) => a + r.subtotal, 0);
    const cabs = rooms.reduce((a, r) => a + r.cabinets, 0);
    const overheadPct = num(job.overheadPct, cfg.rates.overheadPct);
    const overhead = subtotal * overheadPct / 100;
    const fin = byId(FINISH_OPTIONS, job.finish);
    const finishPerCab = num(job.finishPerCab, fin.perCab);
    const finishQuote = num(job.finishQuote, cabs * finishPerCab);
    const total = subtotal + overhead + finishQuote;
    const budgets = { Material: 0, Hardware: 0, Buyout: 0, Labor: 0 };
    rooms.forEach((r) => Object.keys(budgets).forEach((k) => { budgets[k] += r.budgets[k]; }));
    return { rooms, cabinets: cabs, budgets, subtotal, overheadPct, overhead, finish: fin, finishQuote, finishPerCab, total,
      perCab: cabs ? total / cabs : 0, low: total * 0.88, high: total * 1.12 };
  }

  function num(v, fallback) { return (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) ? fallback : Number(v); }

  // ---- Historical jobs, expressed as quick-estimate inputs for calibration -------------------
  const HISTORY = [
    { job: 'Steve Robles', actual: 15992.11, note: 'Inset kitchen, painted. Newest template (Sep 2026).',
      input: { finish: 'painted', finishQuote: 3600, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 10, construction: 'inset', doorStyle: 'raised_panel', materialTier: 'paint', drawerBox: 'vortex', installMode: 'percab', travel: 720 } ] } },
    { job: 'McCasland', actual: 26742.33, note: 'Frameless kitchen, walnut + paint. Cabinet count estimated at 20. Finish was inside the 50%.',
      input: { finish: 'painted', finishQuote: 4000, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 20, construction: 'frameless', doorStyle: 'shaker_paint', materialTier: 'hardwood', drawerBox: 'dovetail', installMode: 'lump', installLump: 2600, otherAddons: 300, otherLabel: 'Pull-outs' } ] } },
    { job: 'Chris Lang Home', actual: 54430.87, note: 'Frameless rift oak kitchen, 42 cabinets, reeded + skinny shaker stained doors.',
      input: { finish: 'stained', finishQuote: 8100, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 42, construction: 'frameless', doorStyle: 'skinny_stained', materialTier: 'hardwood', drawerBox: 'dovetail_premium', installMode: 'percab', organizers: 678 } ] } },
    { job: 'Herlinda Blair', actual: 25024.08, note: 'Frameless kitchen + laundry, painted. Cabinet counts estimated (14 + 9). Finish was inside the 50%.',
      input: { finish: 'painted', finishQuote: 3600, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 14, construction: 'frameless', doorStyle: 'shaker_paint_lo', materialTier: 'paint', drawerBox: 'vortex', installMode: 'hours', installHrs: 17.5, otherAddons: 140, otherLabel: 'Molding miters' },
        { name: 'Laundry', cabinets: 9, construction: 'frameless', doorStyle: 'shaker_paint_lo', materialTier: 'paint', drawerBox: 'vortex', installMode: 'hours', installHrs: 9, otherAddons: 35, otherLabel: 'Molding miter' } ] } },
    { job: 'Bhimani Residence', actual: 66535.32, note: 'Inset, 7 rooms, 53 cabinets, unfinished. Overhead was 63.6% on this one.',
      input: { finish: 'unfinished', finishQuote: 0, overheadPct: 63.6, rooms: [
        { name: 'Kitchen', cabinets: 23, construction: 'inset', doorStyle: 'shaker_paint', materialTier: 'paint', drawerBox: 'dovetail', installMode: 'percab', doorSqFtPerCab: 7.6 },
        { name: 'Dining', cabinets: 7, construction: 'inset', doorStyle: 'shaker_paint', materialTier: 'paint', drawerBox: 'dovetail', installMode: 'percab' },
        { name: 'Laundry', cabinets: 8, construction: 'inset', doorStyle: 'shaker_paint', materialTier: 'paint', drawerBox: 'dovetail', installMode: 'percab' },
        { name: 'Family Room', cabinets: 6, construction: 'inset', doorStyle: 'none', materialTier: 'paint', drawerBox: 'dovetail', installMode: 'percab' },
        { name: 'Bathroom', cabinets: 2, construction: 'frameless', doorStyle: 'shaker_paint_lo', materialTier: 'paint', drawerBox: 'vortex', installMode: 'percab', drawersPerCab: 0 },
        { name: "Isla's Room", cabinets: 4, construction: 'inset', doorStyle: 'none', materialTier: 'paint', drawerBox: 'vortex', installMode: 'percab', drawersPerCab: 0 },
        { name: "Isla's Room (2)", cabinets: 3, construction: 'inset', doorStyle: 'none', materialTier: 'paint', drawerBox: 'vortex', installMode: 'percab', drawersPerCab: 0 } ] } },
    { job: 'Haney Home Projects', actual: 80177.65, note: 'First-try estimate, Sep 2026 template. 50 cabinets, frameless, big island, bar and pantry, glass uppers, open shelving. $3,000 inserts, $14,000 finish. Not part of the original fit.',
      input: { finish: 'painted', finishQuote: 14000, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 50, construction: 'frameless', doorStyle: 'shaker_paint', materialTier: 'paint', drawerBox: 'vortex', installMode: 'percab', organizers: 3000, doorSqFtPerCab: 6.8 } ] } },
  ];

  function calibrate(cfg) {
    return HISTORY.map((h) => { const e = estimateJob(h.input, cfg); return { job: h.job, note: h.note, actual: h.actual, model: e.total, errorPct: (e.total - h.actual) / h.actual * 100, cabinets: e.cabinets }; });
  }

  global.IWSModel = { RATES, DRIVERS, DEFAULTS, DOOR_STYLES, DRAWER_BOXES, MATERIAL_TIERS, FINISH_OPTIONS, HISTORY, estimateRoom, estimateJob, calibrate };
})(typeof window !== 'undefined' ? window : globalThis);
