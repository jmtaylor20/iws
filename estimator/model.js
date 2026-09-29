/* IWS Estimator — pricing model, version 2
   Mirrors IWS's Cabinet Vision "_Materials and Labor" template: Material + Hardware + Buyout + Labor budgets per
   room, then overhead & profit %, then the finisher's quote (always outside the %).
   Version 2 prices from quantities that can be read off the drawing (door area by style, drawer boxes, face-frame
   parts, inserts) and derives hardware, hours and box material from them. Every derived quantity can be overridden.
   Rates come straight from six real breakdowns (Jul 2025 to Sep 2026). */
(function (global) {
  'use strict';

  const RATES = {
    shopLaborHr: 75, machiningHr: 150, drawerAsmHr: 75, faceFramePart: 15,
    installPerCab: 90, installMarkupPct: 50, overheadPct: 50,
    hinge: 7.20, guide: 26, materialMarkupPct: 20,
  };

  // $/sq ft and line markup as seen on the breakdowns
  const DOOR_STYLES = [
    { id: 'shaker_paint',    label: 'Shaker, paint grade',              rate: 20.00,  markup: 10 },
    { id: 'shaker_paint_lo', label: 'Shaker, paint grade (economy)',    rate: 16.80,  markup: 10 },
    { id: 'raised_panel',    label: 'Raised panel, paint grade',        rate: 20.00,  markup: 0 },
    { id: 'slab',            label: 'Slab',                             rate: 30.00,  markup: 10 },
    { id: 'glass',           label: 'Shaker glass / mullion',           rate: 30.00,  markup: 10 },
    { id: 'skinny_stained',  label: 'Skinny shaker, stained',           rate: 36.00,  markup: 10 },
    { id: 'shaker_stained',  label: 'Shaker, stained hardwood',         rate: 53.20,  markup: 10 },
    { id: 'reeded',          label: 'Reeded / fluted',                  rate: 100.00, markup: 10 },
    { id: 'panel_rail',      label: 'Applied panel / rail (no markup)', rate: 16.80,  markup: 0 },
  ];
  const DRAWER_BOXES = [
    { id: 'vortex',           label: 'Vortex / Blum (bought)',   rate: 20 },
    { id: 'dovetail',         label: 'IWS dovetail',             rate: 75 },
    { id: 'dovetail_premium', label: 'IWS dovetail, hardwood',   rate: 85 },
  ];
  const FINISH_OPTIONS = [
    { id: 'painted',    label: 'Painted (outsourced finisher)',  perDoorSqFt: 36 },
    { id: 'stained',    label: 'Stained / clear (outsourced)',   perDoorSqFt: 34 },
    { id: 'unfinished', label: 'Unfinished / by others',         perDoorSqFt: 0 },
  ];

  // Fitted from the six jobs (rooms with known cabinet counts)
  const DRIVERS = {
    materialPerCab: 135,        // box material $ per cabinet incl. the 20% markup; specialty material is entered separately
    doorSqFtPerCab: 6.0,        // used only when no door lines are entered yet
    drawersPerCab: 0.7,         // used only when drawer count is blank
    hingesPerDoorSqFt: 0.35,    // hinges scale with door area (0.34 to 0.36 on Lang, Bhimani, Haney)
    sundriesPerCab: 1.5,        // shelf pins and screws, $ per cabinet
    shopSetupHrs: 3.9,          // per job, once
    shopHrsPerCab: 1.13,
    machiningHrsPerCab: 0.68,
    drawerAsmHrsPerBox: 0.33,   // 2026 template: assembly labor on every drawer box, bought or not
    faceFramePartsPerCab: 4.3,  // inset only, when the count is blank
  };

  const DEFAULTS = { rates: RATES, drivers: DRIVERS };
  const num = (v, fb) => (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) ? fb : Number(v);
  const blank = (v) => v === undefined || v === null || v === '';
  const byId = (list, id) => list.find((x) => x.id === id) || list[0];

  // room: { name, cabinets, construction, doorLines:[{style, sqft}], drawers, drawerBox, faceFrameParts,
  //         organizers, specialMaterial, installMode, installHrs, installLump, travel, otherAddons, otherLabel, overrides:{} }
  function estimateRoom(room, cfg) {
    const R = cfg.rates, D = cfg.drivers, o = room.overrides || {};
    const cabs = num(room.cabinets, 0);
    const inset = room.construction === 'inset';
    const box = byId(DRAWER_BOXES, room.drawerBox);
    const lines = [];
    const add = (group, label, qty, unit, rate, markupPct, total, derived) => lines.push({ group, label, qty, unit, rate, markupPct, total, derived: !!derived });

    let doorLines = (room.doorLines || []).filter((l) => num(l.sqft, 0) > 0).map((l) => ({ style: byId(DOOR_STYLES, l.style), sqft: num(l.sqft, 0), derived: false }));
    const doorsDerived = !doorLines.length;
    if (doorsDerived) doorLines = [{ style: byId(DOOR_STYLES, room.defaultDoorStyle || 'shaker_paint'), sqft: cabs * D.doorSqFtPerCab, derived: true }];
    const doorSqFt = doorLines.reduce((a, l) => a + l.sqft, 0);
    const drawersDerived = blank(room.drawers);
    const drawers = drawersDerived ? cabs * D.drawersPerCab : num(room.drawers, 0);
    const ffDerived = blank(room.faceFrameParts);
    const ffParts = ffDerived ? (inset ? cabs * D.faceFramePartsPerCab : 0) : num(room.faceFrameParts, 0);

    // Material
    const material = num(o.material, cabs * D.materialPerCab);
    add('Material', 'Box material: sheet goods, boards, banding', cabs, 'cab', D.materialPerCab, R.materialMarkupPct, material, blank(o.material));
    const special = num(room.specialMaterial, 0);
    if (special) add('Material', room.specialLabel || 'Specialty material (open shelving, thick shelves, panels)', 1, 'lot', special, 0, special);

    // Hardware, derived from doors and drawers
    const hinges = num(o.hinges, Math.round(doorSqFt * D.hingesPerDoorSqFt));
    add('Hardware', 'Hinges (Blum)', hinges, 'ea', R.hinge, 0, hinges * R.hinge, blank(o.hinges));
    add('Hardware', 'Drawer guides (Tandem)', drawers, 'ea', R.guide, 0, drawers * R.guide, drawersDerived);
    add('Hardware', 'Shelf pins, screws', cabs, 'cab', D.sundriesPerCab, 0, cabs * D.sundriesPerCab, true);
    const organizers = num(room.organizers, 0);
    if (organizers) add('Hardware', 'Inserts, organizers, pull-outs', 1, 'lot', organizers, 0, organizers);

    // Buyout
    doorLines.forEach((l) => add('Buyout', `Doors: ${l.style.label}`, l.sqft, 'sq ft', l.style.rate, l.style.markup, l.sqft * l.style.rate * (1 + l.style.markup / 100), l.derived));
    add('Buyout', `Drawer boxes: ${box.label}`, drawers, 'ea', box.rate, 0, drawers * box.rate, drawersDerived);

    // Labor (room share; the one-time job setup is added in estimateJob)
    const shopHrs = num(o.shopHrs, cabs * D.shopHrsPerCab);
    const machHrs = num(o.machiningHrs, cabs * D.machiningHrsPerCab);
    const asmHrs = num(o.drawerAsmHrs, cfg.drawerAsm === false ? 0 : drawers * D.drawerAsmHrsPerBox);
    add('Labor', 'Shop labor', shopHrs, 'hrs', R.shopLaborHr, 0, shopHrs * R.shopLaborHr, blank(o.shopHrs));
    add('Labor', 'Machining (CNC)', machHrs, 'hrs', R.machiningHr, 0, machHrs * R.machiningHr, blank(o.machiningHrs));
    if (asmHrs) add('Labor', 'Drawer assembly labor', asmHrs, 'hrs', R.drawerAsmHr, 0, asmHrs * R.drawerAsmHr, blank(o.drawerAsmHrs));
    if (ffParts) add('Labor', 'Face frame parts', ffParts, 'ea', R.faceFramePart, 0, ffParts * R.faceFramePart, ffDerived);
    let install = 0;
    if (room.installMode === 'hours') { const h = num(room.installHrs, 0); install = h * R.installPerCab; add('Labor', 'Install labor (hours)', h, 'hrs', R.installPerCab, 0, install); }
    else if (room.installMode === 'lump') { install = num(room.installLump, 0); add('Labor', 'Install labor (lump sum)', 1, 'lot', install, 0, install); }
    else if (room.installMode !== 'none') { install = cabs * R.installPerCab * (1 + R.installMarkupPct / 100); add('Labor', 'Install labor', cabs, 'cab', R.installPerCab, R.installMarkupPct, install); }
    const travel = num(room.travel, 0); if (travel) add('Labor', 'Travel', 1, 'lot', travel, 0, travel);
    const other = num(room.otherAddons, 0); if (other) add('Labor', room.otherLabel || 'Other add-ons', 1, 'lot', other, 0, other);

    const budgets = { Material: 0, Hardware: 0, Buyout: 0, Labor: 0 };
    lines.forEach((l) => { budgets[l.group] += l.total; });
    const subtotal = Object.values(budgets).reduce((a, b) => a + b, 0);
    return { name: room.name, cabinets: cabs, construction: room.construction, doorSqFt, drawers, lines, budgets, subtotal,
      quantities: { doorSqFt, drawers, hinges, shopHrs, machHrs, asmHrs, ffParts, material } };
  }

  // job: { rooms, overheadPct, finish, finishQuote, finishPerDoorSqFt, setupHrs, drawerAsm }
  function estimateJob(job, cfg) {
    cfg = Object.assign({}, DEFAULTS, cfg || {}, { drawerAsm: job.drawerAsm !== false });
    const rooms = (job.rooms || []).map((r) => estimateRoom(r, cfg));
    const cabs = rooms.reduce((a, r) => a + r.cabinets, 0);
    const doorSqFt = rooms.reduce((a, r) => a + r.doorSqFt, 0);
    const setupHrs = num(job.setupHrs, cabs ? cfg.drivers.shopSetupHrs : 0);
    const setup = setupHrs * cfg.rates.shopLaborHr;
    if (rooms.length && setup) { rooms[0].lines.push({ group: 'Labor', label: 'Job setup (drawings, programming), once per job', qty: setupHrs, unit: 'hrs', rate: cfg.rates.shopLaborHr, markupPct: 0, total: setup, derived: blank(job.setupHrs) }); rooms[0].budgets.Labor += setup; rooms[0].subtotal += setup; }
    const budgets = { Material: 0, Hardware: 0, Buyout: 0, Labor: 0 };
    rooms.forEach((r) => Object.keys(budgets).forEach((k) => { budgets[k] += r.budgets[k]; }));
    const subtotal = Object.values(budgets).reduce((a, b) => a + b, 0);
    const overheadPct = num(job.overheadPct, cfg.rates.overheadPct);
    const overhead = subtotal * overheadPct / 100;
    const fin = byId(FINISH_OPTIONS, job.finish);
    const finishSuggested = doorSqFt * num(job.finishPerDoorSqFt, fin.perDoorSqFt);
    const finishEntered = !blank(job.finishQuote);
    const finishQuote = finishEntered ? num(job.finishQuote, 0) : finishSuggested;
    const total = subtotal + overhead + finishQuote;
    return { rooms, cabinets: cabs, doorSqFt, budgets, subtotal, overheadPct, overhead, finish: fin, finishQuote, finishSuggested, finishEntered, total,
      perCab: cabs ? total / cabs : 0, low: total * 0.92, high: total * 1.08 };
  }

  // ---- The six real jobs, as the quantities a user would type from the drawing ----------------
  // actual = IWS's printed total. actualStd = the same job with the finish outside the 50% (the app's rule);
  // it differs only on McCasland and Herlinda, where the finish sat inside the 50%.
  const L = (style, sqft) => ({ style, sqft });
  const HISTORY = [
    { job: 'Steve Robles', actual: 15992.11, actualStd: 15992.11, note: 'Inset kitchen, painted. Sep 2026 template.',
      input: { finish: 'painted', finishQuote: 3600, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 10, construction: 'inset', doorLines: [L('shaker_paint_lo', 14.35), L('raised_panel', 4), L('raised_panel', 21.3)], drawers: 7, drawerBox: 'vortex', faceFrameParts: 48, installMode: 'percab', travel: 720 } ] } },
    { job: 'McCasland', actual: 26742.33, actualStd: 24742.33, note: 'Frameless kitchen, walnut + paint. Cabinet count estimated at 20. IWS put the finish inside the 50%; compared here with it outside.',
      input: { finish: 'painted', finishQuote: 4000, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 20, construction: 'frameless', doorLines: [L('raised_panel', 83.92), L('raised_panel', 17.9), L('raised_panel', 10)], drawers: 14, drawerBox: 'dovetail', installMode: 'lump', installLump: 2600, otherAddons: 300, otherLabel: 'Pull-outs' } ] } },
    { job: 'Chris Lang Home', actual: 54430.87, actualStd: 54430.87, note: 'Frameless rift oak kitchen, 42 cabinets, reeded + skinny shaker stained doors, $678 of inserts.',
      input: { finish: 'stained', finishQuote: 8100, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 42, construction: 'frameless', doorLines: [L('glass', 20.67), L('slab', 42.12), L('reeded', 12.76), L('skinny_stained', 142.35), L('panel_rail', 17.49)], drawers: 19, drawerBox: 'dovetail_premium', installMode: 'percab', organizers: 678 } ] } },
    { job: 'Herlinda Blair', actual: 25024.08, actualStd: 23224.08, note: 'Frameless kitchen + laundry, painted. Cabinet counts estimated (14 + 9). IWS put the finish inside the 50%; compared here with it outside.',
      input: { finish: 'painted', finishQuote: 3600, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 14, construction: 'frameless', doorLines: [L('shaker_paint_lo', 72.65), L('shaker_paint_lo', 9.56), L('panel_rail', 3.28)], drawers: 12, drawerBox: 'vortex', installMode: 'hours', installHrs: 17.5, otherAddons: 140, otherLabel: 'Molding miters' },
        { name: 'Laundry', cabinets: 9, construction: 'frameless', doorLines: [L('shaker_paint_lo', 40.35)], drawers: 8, drawerBox: 'vortex', installMode: 'hours', installHrs: 9, otherAddons: 35, otherLabel: 'Molding miter' } ] } },
    { job: 'Bhimani Residence', actual: 66535.32, actualStd: 66535.32, note: 'Inset, 7 rooms, 53 cabinets, unfinished. IWS used 63.6% overhead on this one.',
      input: { finish: 'unfinished', finishQuote: 0, overheadPct: 63.6, rooms: [
        { name: 'Kitchen', cabinets: 23, construction: 'inset', doorLines: [L('shaker_paint', 39.55), L('shaker_paint', 18.47), L('panel_rail', 12.02), L('shaker_stained', 31.11), L('shaker_paint', 5.43), L('shaker_stained', 2.01), L('shaker_paint', 2), L('shaker_paint', 4.21), L('shaker_stained', 16.53), L('shaker_paint', 42.44)], drawers: 16, drawerBox: 'dovetail', faceFrameParts: 99, installMode: 'percab' },
        { name: 'Dining', cabinets: 7, construction: 'inset', doorLines: [L('shaker_paint', 18.72), L('shaker_stained', 5.43), L('shaker_paint', 11.6), L('panel_rail', 2), L('panel_rail', 14.98), L('shaker_stained', 11.14)], drawers: 9, drawerBox: 'dovetail', faceFrameParts: 34, installMode: 'percab' },
        { name: 'Laundry', cabinets: 8, construction: 'inset', doorLines: [L('shaker_paint', 9.78), L('panel_rail', 28.5), L('shaker_paint', 4.19), L('panel_rail', 13.36), L('shaker_paint', 18)], drawers: 2, drawerBox: 'dovetail', faceFrameParts: 29, installMode: 'percab' },
        { name: 'Family Room', cabinets: 6, construction: 'inset', doorLines: [], drawers: 2, drawerBox: 'dovetail', faceFrameParts: 23, installMode: 'percab', overrides: { hinges: 8 } },
        { name: 'Bathroom', cabinets: 2, construction: 'frameless', doorLines: [L('shaker_paint_lo', 1.62)], drawers: 0, drawerBox: 'vortex', installMode: 'percab', overrides: { hinges: 2 } },
        { name: "Isla's Room", cabinets: 4, construction: 'inset', doorLines: [], drawers: 0, drawerBox: 'vortex', faceFrameParts: 9, installMode: 'percab', overrides: { hinges: 0 } },
        { name: "Isla's Room (2)", cabinets: 3, construction: 'inset', doorLines: [], drawers: 0, drawerBox: 'vortex', faceFrameParts: 7, installMode: 'percab', overrides: { hinges: 0 } } ] } },
    { job: 'Haney Home Projects', actual: 80177.65, actualStd: 80177.65, note: 'First-try estimate, Sep 2026 template. 50 cabinets, island, bar, pantry, glass uppers, open shelving. Includes $5,658 of 1/2 maple board that may be a quantity error.',
      input: { finish: 'painted', finishQuote: 14000, overheadPct: 50, rooms: [
        { name: 'Kitchen', cabinets: 50, construction: 'frameless', doorLines: [L('raised_panel', 200.18), L('raised_panel', 62.75), L('raised_panel', 59.22), L('raised_panel', 15.86)], drawers: 48, drawerBox: 'vortex', faceFrameParts: 59, installMode: 'percab', organizers: 3000, specialMaterial: 5658, specialLabel: '1/2 maple board, 539 sq ft (as estimated)' } ] } },
  ];

  function calibrate(cfg) {
    return HISTORY.map((h) => { const e = estimateJob(h.input, cfg); return { job: h.job, note: h.note, actual: h.actual, actualStd: h.actualStd, model: e.total, errorPct: (e.total - h.actualStd) / h.actualStd * 100, cabinets: e.cabinets }; });
  }

  global.IWSModel = { RATES, DRIVERS, DEFAULTS, DOOR_STYLES, DRAWER_BOXES, FINISH_OPTIONS, HISTORY, estimateRoom, estimateJob, calibrate };
})(typeof window !== 'undefined' ? window : globalThis);
