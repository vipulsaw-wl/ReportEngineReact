/**
 * theme.js — Worldline ServiceNow-style theme
 * All C.* and font.* values now map to the WL light enterprise palette.
 * This replaces the old dark navy theme globally across every page.
 */

export const C = {
  // Primary brand
  navy:    '#00897B',   // was dark navy — now WL teal
  navyD:   '#1A2332',   // deep text / dark surfaces
  navyL:   '#00A99D',   // WL teal accent
  navyM:   '#006B63',   // pressed teal

  // Neutrals
  slate:   '#4A5568',
  slateL:  '#6B7A8D',
  muted:   '#8A97A8',
  border:  '#DDE3EC',
  bg:      '#F5F7FA',
  bgD:     '#EAECF0',
  white:   '#FFFFFF',

  // Semantic
  green:   '#00A651',
  greenL:  '#E6F5ED',
  greenB:  '#80D9A0',
  red:     '#D0021B',
  redL:    '#FEECEE',
  redB:    '#FFAAAA',
  blue:    '#0066CC',
  blueL:   '#E6F0FF',
  blueB:   '#99BBFF',
  amber:   '#F5A623',
  amberL:  '#FEF9EC',

  // Form fields
  fieldBg:     '#F0F2F5',
  fieldBorder: '#CDD3DC',
  fieldText:   '#1A2332',
};

export const font = {
  // DM Sans replaces Libre Baskerville / Source Sans
  serif: "'DM Sans', 'Segoe UI', sans-serif",
  sans:  "'DM Sans', 'Segoe UI', sans-serif",
  mono:  "'DM Mono', 'Consolas', monospace",
};

export const FREQS = ['ONE_TIME','DAILY','WEEKLY','MONTHLY','END_OF_QUARTER','CUSTOM_CRON'];
export const FMTS  = ['PDF','EXCEL','CSV','HTML'];
export const RTYPES = [
  'PL_STATEMENT','BALANCE_SHEET','CASH_FLOW',
  'BUDGET_VS_ACTUAL','AR_AGING','GL_SUMMARY','CUSTOM',
];
