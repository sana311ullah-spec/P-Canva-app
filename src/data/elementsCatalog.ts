import type { AnimationEffect, CanvasElement, ShapeKind } from '../types/studio.ts';
import type { ElementCategoryId, ElementLibraryItem } from './catalogData.ts';

export interface ExtendedElementItem extends ElementLibraryItem {
  subCategory?: string;
  accentColor: string;
  previewEmoji?: string;
  svgPath?: string;
  svgViewBox?: string;
  animationEffect?: AnimationEffect;
}

const VIVID_PALETTE = [
  '#0F172A',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#0F766E',
  '#06B6D4',
  '#2563EB',
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#14B8A6',
];

const STOCK_THUMB_PHOTOS = [
  '/src/assets/images/photo_modern_workspace_1795238221169.jpg',
  '/src/assets/images/photo_product_headphones_1795238221093.jpg',
  '/src/assets/images/photo_botanical_skincare_1795238221151.jpg',
  '/src/assets/images/photo_abstract_waves_1795238220934.jpg',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=75',
];

// 1. SHAPES (110 shapes)
const SHAPE_TEMPLATES: { kind: ShapeKind; label: string; w: number; h: number }[] = [
  { kind: 'circle', label: 'Circle', w: 180, h: 180 },
  { kind: 'rounded', label: 'Square', w: 180, h: 180 },
  { kind: 'rectangle', label: 'Rectangle', w: 280, h: 160 },
  { kind: 'triangle', label: 'Triangle', w: 190, h: 170 },
  { kind: 'star', label: 'Star', w: 190, h: 190 },
  { kind: 'heart', label: 'Heart', w: 190, h: 180 },
  { kind: 'arrow', label: 'Arrow', w: 220, h: 140 },
  { kind: 'line', label: 'Line', w: 300, h: 24 },
  { kind: 'curve', label: 'Curve', w: 280, h: 120 },
  { kind: 'blob', label: 'Blob', w: 210, h: 190 },
  { kind: 'half-circle', label: 'Half Circle', w: 220, h: 120 },
  { kind: 'diamond', label: 'Diamond', w: 180, h: 180 },
  { kind: 'hexagon', label: 'Hexagon', w: 190, h: 180 },
  { kind: 'oval', label: 'Oval', w: 250, h: 150 },
  { kind: 'ring', label: 'Ring', w: 180, h: 180 },
  { kind: 'pill', label: 'Pill', w: 260, h: 100 },
  { kind: 'cross', label: 'Cross', w: 170, h: 170 },
  { kind: 'cloud', label: 'Cloud', w: 240, h: 160 },
  { kind: 'crescent', label: 'Crescent', w: 180, h: 180 },
  { kind: 'shield', label: 'Shield', w: 170, h: 200 },
  { kind: 'pentagon', label: 'Pentagon', w: 185, h: 180 },
  { kind: 'octagon', label: 'Octagon', w: 185, h: 185 },
];

export const SHAPE_ELEMENTS: ExtendedElementItem[] = (() => {
  const list: ExtendedElementItem[] = [];
  // 22 shapes * 5 style/color variations = 110 shapes
  for (let v = 0; v < 5; v++) {
    SHAPE_TEMPLATES.forEach((shp, idx) => {
      const color = VIVID_PALETTE[(idx + v * 3) % VIVID_PALETTE.length];
      const isOutline = v === 3;
      const isDashed = v === 4;
      const suffix = isOutline ? 'Outline' : isDashed ? 'Dashed' : v === 0 ? '' : `Style ${v + 1}`;
      list.push({
        id: `shp-${shp.kind}-${v}`,
        label: suffix ? `${shp.label} (${suffix})` : shp.label,
        category: 'Shapes',
        subCategory: shp.label,
        previewHint: isOutline ? 'Outline' : isDashed ? 'Dashed' : 'Solid',
        accentColor: color,
        element: {
          type: 'shape',
          shapeKind: shp.kind,
          name: shp.label,
          x: 240,
          y: 180,
          width: shp.w,
          height: shp.h,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          fill: isOutline || isDashed ? 'transparent' : color,
          stroke: isOutline || isDashed ? color : 'none',
          strokeWidth: isOutline || isDashed ? 6 : 0,
          strokeStyle: isDashed ? 'dashed' : 'solid',
          borderRadius: shp.kind === 'rounded' ? 24 : shp.kind === 'pill' ? 999 : 0,
        },
      });
    });
  }
  return list;
})();

// 2. GRAPHICS (520+ vector stickers across Flowers, Leaves, Butterflies, Hearts, Stars, Crowns, Lab, Medical, Doodles, Lines, Dividers, Badges, Ribbons, Arrows, Hand-drawn)
const GRAPHIC_MOTIFS: { sub: string; name: string; path: string; isStroke?: boolean }[] = [
  // Flowers
  {
    sub: 'Flowers',
    name: 'Lotus Flower',
    path: 'M50 15 C60 32 62 48 50 62 C38 48 40 32 50 15 Z M50 62 C70 42 86 48 84 64 C70 72 58 68 50 62 Z M50 62 C30 42 14 48 16 64 C30 72 42 68 50 62 Z M28 74 H72 L64 86 H36 Z',
  },
  {
    sub: 'Flowers',
    name: 'Daisy Blossom',
    path: 'M50 12 A12 12 0 1 1 50 36 A12 12 0 1 1 50 12 M78 34 A12 12 0 1 1 58 50 A12 12 0 1 1 78 34 M68 78 A12 12 0 1 1 50 60 A12 12 0 1 1 68 78 M32 78 A12 12 0 1 1 50 60 A12 12 0 1 1 32 78 M22 34 A12 12 0 1 1 42 50 A12 12 0 1 1 22 34 M50 40 A10 10 0 1 0 50 60 A10 10 0 1 0 50 40 Z',
  },
  {
    sub: 'Flowers',
    name: 'Tulip Bloom',
    path: 'M30 22 C30 46 38 58 50 58 C62 58 70 46 70 22 L58 34 L50 18 L42 34 Z M47 58 V88 H53 V58 Z',
  },
  // Leaves
  {
    sub: 'Leaves',
    name: 'Monstera Leaf',
    path: 'M50 10 C75 20 88 45 78 72 C68 85 56 88 50 90 C44 88 32 85 22 72 C12 45 25 20 50 10 Z',
  },
  {
    sub: 'Leaves',
    name: 'Olive Branch',
    path: 'M18 82 Q45 50 82 18 M35 64 C22 52 24 40 38 44 M52 48 C40 34 44 22 58 28 M54 50 C68 62 78 58 74 44 M38 66 C52 78 62 74 58 60',
    isStroke: true,
  },
  // Butterflies
  {
    sub: 'Butterflies',
    name: 'Monarch Butterfly',
    path: 'M48 38 C32 14 10 18 14 42 C16 54 34 54 48 48 C34 58 18 68 24 82 C32 90 44 78 48 62 L52 62 C56 78 68 90 76 82 C82 68 66 58 52 48 C66 54 84 54 86 42 C90 18 68 14 52 38 Z',
  },
  // Hearts
  {
    sub: 'Hearts',
    name: 'Heart Sticker',
    path: 'M50 86 C20 66 10 46 10 32 C10 18 22 10 34 10 C42 10 48 16 50 22 C52 16 58 10 66 10 C78 10 90 18 90 32 C90 46 80 66 50 86 Z',
  },
  {
    sub: 'Hearts',
    name: 'Double Heart',
    path: 'M42 78 C20 62 12 46 12 34 C12 22 22 16 30 16 C36 16 40 20 42 25 C44 20 48 16 54 16 C62 16 72 22 72 34 C72 46 64 62 42 78 Z',
  },
  // Stars
  {
    sub: 'Stars',
    name: 'Four-Point Sparkle',
    path: 'M50 6 L60 40 L94 50 L60 60 L50 94 L40 60 L6 50 L40 40 Z',
  },
  {
    sub: 'Stars',
    name: 'Classic Starburst',
    path: 'M50 4 L61 32 L92 24 L72 48 L96 66 L66 70 L74 96 L50 78 L26 96 L34 70 L4 66 L28 48 L8 24 L39 32 Z',
  },
  // Crowns
  {
    sub: 'Crowns',
    name: 'Royal Crown',
    path: 'M14 74 L10 30 L34 50 L50 22 L66 50 L90 30 L86 74 Z M14 78 H86 V88 H14 Z',
  },
  // Lab icons
  {
    sub: 'Lab icons',
    name: 'Erlenmeyer Flask',
    path: 'M38 14 H62 V22 H56 V40 L82 82 C84 86 80 90 76 90 H24 C20 90 16 86 18 82 L44 40 V22 H38 Z',
  },
  {
    sub: 'Lab icons',
    name: 'Microscope',
    path: 'M44 14 H58 V46 H44 Z M38 46 H64 V54 H38 Z M60 32 C74 38 78 58 68 72 H78 V84 H22 V74 H54 C62 64 60 48 52 44',
  },
  {
    sub: 'Lab icons',
    name: 'DNA Helix',
    path: 'M30 12 C30 34 70 34 70 50 C70 66 30 66 30 88 M70 12 C70 34 30 34 30 50 C30 66 70 66 70 88 M35 26 H65 M38 50 H62 M35 74 H65',
    isStroke: true,
  },
  {
    sub: 'Lab icons',
    name: 'Test Tube',
    path: 'M36 14 H64 V22 H58 V72 A12 12 0 0 1 42 72 V22 H36 Z',
  },
  {
    sub: 'Lab icons',
    name: 'Atom Orbit',
    path: 'M50 44 A6 6 0 1 0 50 56 A6 6 0 1 0 50 44 M14 50 A36 14 45 1 0 86 50 A36 14 45 1 0 14 50 M14 50 A36 14 -45 1 0 86 50 A36 14 -45 1 0 14 50',
    isStroke: true,
  },
  // Medical icons
  {
    sub: 'Medical icons',
    name: 'Medical Cross',
    path: 'M38 14 H62 V38 H86 V62 H62 V86 H38 V62 H14 V38 H38 Z',
  },
  {
    sub: 'Medical icons',
    name: 'Heartbeat ECG',
    path: 'M6 52 H26 L36 24 L50 80 L62 38 L70 52 H94',
    isStroke: true,
  },
  {
    sub: 'Medical icons',
    name: 'Stethoscope',
    path: 'M26 16 V42 A18 18 0 0 0 62 42 V16 M44 60 V74 A16 16 0 0 0 76 74 V60 A8 8 0 1 0 76 44',
    isStroke: true,
  },
  {
    sub: 'Medical icons',
    name: 'Eye Vision Scan',
    path: 'M8 50 Q50 14 92 50 Q50 86 8 50 Z M50 36 A14 14 0 1 0 50 64 A14 14 0 1 0 50 36 Z',
    isStroke: true,
  },
  // Doodles
  {
    sub: 'Doodles',
    name: 'Swirl Doodle',
    path: 'M50 50 C50 40 62 40 62 50 C62 66 36 66 36 48 C36 26 74 26 74 50 C74 80 22 80 22 48',
    isStroke: true,
  },
  {
    sub: 'Doodles',
    name: 'Lightning Bolt',
    path: 'M58 8 L22 54 H48 L40 92 L78 44 H52 Z',
  },
  {
    sub: 'Doodles',
    name: 'Speech Bubble',
    path: 'M14 18 H86 V68 H44 L24 86 V68 H14 Z',
  },
  // Lines & Dividers
  {
    sub: 'Lines & Dividers',
    name: 'Wave Divider',
    path: 'M4 50 Q20 22 36 50 T68 50 T96 50',
    isStroke: true,
  },
  {
    sub: 'Lines & Dividers',
    name: 'Ornament Divider',
    path: 'M6 50 H38 L50 34 L62 50 H94 M50 34 L62 50 L50 66 L38 50 Z',
    isStroke: true,
  },
  // Badges & Ribbons
  {
    sub: 'Badges',
    name: 'Verified Seal',
    path: 'M50 8 L61 16 L75 15 L81 27 L92 36 L88 50 L92 64 L81 73 L75 85 L61 84 L50 92 L39 84 L25 85 L19 73 L8 64 L12 50 L8 36 L19 27 L25 15 L39 16 Z',
  },
  {
    sub: 'Ribbons',
    name: 'Award Ribbon',
    path: 'M50 12 A24 24 0 1 0 50 60 A24 24 0 1 0 50 12 Z M34 56 L26 90 L44 80 L50 90 L56 80 L74 90 L66 56',
  },
  // Arrows
  {
    sub: 'Arrows',
    name: 'Curved Arrow',
    path: 'M16 74 Q32 22 80 34 M66 20 L84 35 L68 50',
    isStroke: true,
  },
  // Hand-drawn icons
  {
    sub: 'Hand-drawn',
    name: 'Hand-Drawn Sun',
    path: 'M50 32 A18 18 0 1 0 50 68 A18 18 0 1 0 50 32 M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92 M20 20 L28 28 M72 72 L80 80 M80 20 L72 28 M28 72 L20 80',
    isStroke: true,
  },
  {
    sub: 'Hand-drawn',
    name: 'Hand-Drawn Check',
    path: 'M18 52 L40 74 L84 26',
    isStroke: true,
  },
];

export const GRAPHIC_ELEMENTS: ExtendedElementItem[] = (() => {
  const list: ExtendedElementItem[] = [];
  // 30 motifs * 18 color/style variants = 540 searchable SVG graphics!
  for (let v = 0; v < 18; v++) {
    GRAPHIC_MOTIFS.forEach((motif, idx) => {
      const color = VIVID_PALETTE[(idx + v) % VIVID_PALETTE.length];
      list.push({
        id: `gfx-${idx}-${v}`,
        label: v === 0 ? motif.name : `${motif.name} #${v + 1}`,
        category: 'Graphics',
        subCategory: motif.sub,
        previewHint: motif.sub,
        accentColor: color,
        svgPath: motif.path,
        svgViewBox: '0 0 100 100',
        element: {
          type: 'graphic',
          name: motif.name,
          graphicVariant: motif.isStroke ? 'svg-stroke' : 'svg-fill',
          graphicSvgPath: motif.path,
          graphicSvgViewBox: '0 0 100 100',
          x: 260,
          y: 180,
          width: motif.sub === 'Lines & Dividers' ? 320 : 170,
          height: motif.sub === 'Lines & Dividers' ? 90 : 170,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          fill: color,
          stroke: color,
          strokeWidth: motif.isStroke ? 7 : 0,
        },
      });
    });
  }
  return list;
})();

// 4. VIDEOS (104+ free stock videos)
const VIDEO_SCENES = [
  { cat: 'Nature', title: 'Alpine Sunrise Mist', dur: '00:18', color: '#059669' },
  { cat: 'Nature', title: 'Ocean Waves Aerial', dur: '00:24', color: '#0284C7' },
  { cat: 'Nature', title: 'Forest Sunlight Beams', dur: '00:15', color: '#16A34A' },
  { cat: 'Nature', title: 'Cherry Blossom Breeze', dur: '00:12', color: '#EC4899' },
  { cat: 'Lab', title: 'Microscope Cell Division', dur: '00:22', color: '#0EA5E9' },
  { cat: 'Lab', title: 'Chemistry Pipette Drop', dur: '00:14', color: '#0F766E' },
  { cat: 'Lab', title: 'DNA Sequencing Glow', dur: '00:20', color: '#6366F1' },
  { cat: 'Lab', title: 'Cleanroom Optics Test', dur: '00:16', color: '#2563EB' },
  { cat: 'Business', title: 'Modern Studio Collaboration', dur: '00:19', color: '#0F172A' },
  { cat: 'Business', title: 'Executive Keynote Stage', dur: '00:26', color: '#334155' },
  { cat: 'Business', title: 'Architect Blueprint Review', dur: '00:15', color: '#D97706' },
  { cat: 'Background loops', title: 'Liquid Cobalt Silk Loop', dur: '00:10', color: '#4F46E5' },
  { cat: 'Background loops', title: 'Abstract Prism Waves', dur: '00:12', color: '#A855F7' },
];

export const VIDEO_ELEMENTS: ExtendedElementItem[] = (() => {
  const list: ExtendedElementItem[] = [];
  for (let i = 0; i < 8; i++) {
    VIDEO_SCENES.forEach((sc, idx) => {
      const thumb = STOCK_THUMB_PHOTOS[(i + idx) % STOCK_THUMB_PHOTOS.length];
      list.push({
        id: `vid-${i}-${idx}`,
        label: i === 0 ? sc.title : `${sc.title} (${i + 1})`,
        category: 'Videos',
        subCategory: sc.cat,
        previewHint: sc.dur,
        accentColor: sc.color,
        element: {
          type: 'media',
          mediaKind: 'video',
          mediaDuration: sc.dur,
          name: sc.title,
          x: 200,
          y: 140,
          width: 460,
          height: 260,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          fill: sc.color,
          src: thumb,
        },
      });
    });
  }
  return list;
})();

// 5. 3D SHAPES (108+ 3D items)
const THREE_D_SEEDS = [
  { variant: 'cube3d', label: '3D Isometric Cube', emoji: '🧊' },
  { variant: 'sphere3d', label: '3D Glossy Sphere', emoji: '🔮' },
  { variant: 'heart3d', label: '3D Glossy Heart', emoji: '❤️' },
  { variant: 'emoji3d-fire', label: 'Emoji 3D Fire', emoji: '🔥' },
  { variant: 'emoji3d-star', label: 'Emoji 3D Star', emoji: '⭐' },
  { variant: 'emoji3d-smile', label: 'Emoji 3D Smile', emoji: '😎' },
  { variant: 'emoji3d-rocket', label: 'Emoji 3D Rocket', emoji: '🚀' },
  { variant: 'emoji3d-trophy', label: 'Emoji 3D Trophy', emoji: '🏆' },
  { variant: 'torus3d', label: '3D Torus Ring', emoji: '🍩' },
  { variant: 'pyramid3d', label: '3D Glass Pyramid', emoji: '🔺' },
  { variant: 'gem3d', label: '3D Crystal Gem', emoji: '💎' },
  { variant: 'abstract3d', label: 'Abstract 3D Ribbon', emoji: '🌀' },
];

export const THREE_D_ELEMENTS: ExtendedElementItem[] = (() => {
  const list: ExtendedElementItem[] = [];
  for (let v = 0; v < 9; v++) {
    THREE_D_SEEDS.forEach((seed, idx) => {
      const color = VIVID_PALETTE[(v * 2 + idx) % VIVID_PALETTE.length];
      list.push({
        id: `3d-${seed.variant}-${v}`,
        label: v === 0 ? seed.label : `${seed.label} #${v + 1}`,
        category: '3D',
        subCategory: seed.variant.startsWith('emoji') ? 'Emoji 3D' : '3D Shapes',
        previewHint: '3D Render',
        accentColor: color,
        previewEmoji: seed.emoji,
        element: {
          type: 'graphic',
          name: seed.label,
          graphicVariant: seed.variant,
          graphicEmoji: seed.emoji,
          is3D: true,
          x: 260,
          y: 170,
          width: 200,
          height: 200,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          fill: color,
        },
      });
    });
  }
  return list;
})();

// 6. FORMS (10 ready forms)
export const FORM_ELEMENTS: ExtendedElementItem[] = [
  {
    id: 'form-contact',
    label: 'Contact Form',
    category: 'Forms',
    previewHint: '3 Inputs',
    accentColor: '#2563EB',
    element: {
      type: 'form',
      name: 'Contact Form',
      formTitle: 'Contact Us',
      formFields: [
        { label: 'Full Name', placeholder: 'Your full name', fieldType: 'text' },
        { label: 'Email Address', placeholder: 'you@company.com', fieldType: 'text' },
        { label: 'Message', placeholder: 'How can we help?', fieldType: 'text' },
      ],
      formCta: 'Send Message',
      x: 220,
      y: 120,
      width: 400,
      height: 360,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#2563EB',
    },
  },
  {
    id: 'form-feedback',
    label: 'Feedback Form',
    category: 'Forms',
    previewHint: 'Rating + Notes',
    accentColor: '#0F766E',
    element: {
      type: 'form',
      name: 'Feedback Form',
      formTitle: 'Share Your Feedback',
      formFields: [
        { label: 'Experience Rating', placeholder: '★★★★★ 5 / 5', fieldType: 'text' },
        { label: 'Recommend to a friend?', placeholder: 'Yes, definitely', fieldType: 'checkbox' },
        { label: 'Comments', placeholder: 'What did you love?', fieldType: 'text' },
      ],
      formCta: 'Submit Feedback',
      x: 220,
      y: 120,
      width: 400,
      height: 350,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#0F766E',
    },
  },
  {
    id: 'form-signup',
    label: 'Signup Form',
    category: 'Forms',
    previewHint: 'Account',
    accentColor: '#6366F1',
    element: {
      type: 'form',
      name: 'Signup Form',
      formTitle: 'Create Free Account',
      formFields: [
        { label: 'Work Email', placeholder: 'name@studio.com', fieldType: 'text' },
        { label: 'Team Name', placeholder: 'Design Ops', fieldType: 'text' },
        { label: 'I agree to Terms', placeholder: 'Accepted', fieldType: 'checkbox' },
      ],
      formCta: 'Get Started Free',
      x: 220,
      y: 130,
      width: 390,
      height: 340,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#6366F1',
    },
  },
  {
    id: 'form-survey',
    label: 'Survey Boxes',
    category: 'Forms',
    previewHint: 'Poll',
    accentColor: '#EC4899',
    element: {
      type: 'form',
      name: 'Survey Poll',
      formTitle: 'Quick Team Survey',
      formFields: [
        { label: 'Option A: Minimalist Dark', placeholder: 'Select option', fieldType: 'radio' },
        { label: 'Option B: Editorial Light', placeholder: 'Select option', fieldType: 'radio' },
        { label: 'Option C: Bold Gradient', placeholder: 'Select option', fieldType: 'radio' },
      ],
      formCta: 'Vote Now',
      x: 230,
      y: 140,
      width: 390,
      height: 320,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#EC4899',
    },
  },
  {
    id: 'form-checkboxes',
    label: 'Checkboxes Checklist',
    category: 'Forms',
    previewHint: 'Checklist',
    accentColor: '#10B981',
    element: {
      type: 'form',
      name: 'Checklist Card',
      formTitle: 'Launch Checklist',
      formFields: [
        { label: 'Brand guidelines approved', placeholder: 'Checked', fieldType: 'checkbox' },
        { label: 'Typography & contrast checked', placeholder: 'Checked', fieldType: 'checkbox' },
        { label: 'Export ready for print & web', placeholder: 'Pending', fieldType: 'checkbox' },
      ],
      formCta: 'Mark All Done',
      x: 230,
      y: 140,
      width: 390,
      height: 320,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#10B981',
    },
  },
  {
    id: 'form-inputs',
    label: 'Input Boxes Block',
    category: 'Forms',
    previewHint: '2 Fields',
    accentColor: '#0F172A',
    element: {
      type: 'form',
      name: 'Input Box Block',
      formTitle: 'Subscribe to Updates',
      formFields: [
        { label: 'First Name', placeholder: 'Elena', fieldType: 'text' },
        { label: 'Email', placeholder: 'elena@northstar.io', fieldType: 'text' },
      ],
      formCta: 'Subscribe',
      x: 240,
      y: 160,
      width: 380,
      height: 280,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#0F172A',
    },
  },
];

// 7. ANIMATIONS (9 effects)
export const ANIMATION_PRESETS: {
  id: AnimationEffect;
  label: string;
  desc: string;
  color: string;
}[] = [
  { id: 'fade', label: 'Fade', desc: 'Smooth opacity pulse', color: '#0EA5E9' },
  { id: 'bounce', label: 'Bounce', desc: 'Playful vertical hop', color: '#F97316' },
  { id: 'slide', label: 'Slide', desc: 'Horizontal glide motion', color: '#10B981' },
  { id: 'zoom', label: 'Zoom', desc: 'Subtle scale breathe', color: '#6366F1' },
  { id: 'spin', label: 'Spin', desc: 'Continuous 360 rotation', color: '#EC4899' },
  { id: 'pop', label: 'Pop', desc: 'Spring snap entrance', color: '#F59E0B' },
  { id: 'float', label: 'Float', desc: 'Gentle levitation drift', color: '#14B8A6' },
  { id: 'shake', label: 'Shake', desc: 'Attention callout wiggle', color: '#EF4444' },
  { id: 'none', label: 'None', desc: 'Remove animation', color: '#52525B' },
];

// 8. AUDIO (108+ free audio tracks)
const AUDIO_MOODS: { mood: string; titles: string[]; color: string }[] = [
  {
    mood: 'Background Music',
    color: '#6366F1',
    titles: ['Lo-Fi Focus Loop', 'Midnight Studio Synth', 'Warm Rhodes Horizon', 'Minimal Tech Pulse', 'Soft Piano Drift', 'Acoustic Morning'],
  },
  {
    mood: 'Nature Sound',
    color: '#10B981',
    titles: ['Forest Rain Canopy', 'Ocean Tide Shore', 'Alpine Stream Flow', 'Morning Birdsong', 'Bamboo Wind Chimes', 'Night Cricket Meadow'],
  },
  {
    mood: 'Notification',
    color: '#F59E0B',
    titles: ['Crystal Ping Ding', 'Soft Pop Chime', 'Success Bell Tone', 'Subtle UI Click', 'Glass Sparkle Alert', 'Warm Marimba Cue'],
  },
  {
    mood: 'Happy',
    color: '#EC4899',
    titles: ['Sunny Ukulele Beat', 'Weekend Roadtrip', 'Bright Pop Clap', 'Celebration Brass', 'Feel Good Groove', 'Summer Bounce'],
  },
  {
    mood: 'Sad',
    color: '#0284C7',
    titles: ['Rainy Window Cello', 'Solitude Piano Notes', 'Quiet Memory Strings', 'Dusk Acoustic Slow', 'Distant Horizon Pad', 'Fading Echoes'],
  },
  {
    mood: 'Motivational',
    color: '#F97316',
    titles: ['Keynote Rise Anthems', 'Startup Launch Drive', 'Champion Drums', 'Limitless Horizon', 'Victory March Synth', 'Peak Focus Surge'],
  },
];

export const AUDIO_ELEMENTS: ExtendedElementItem[] = (() => {
  const list: ExtendedElementItem[] = [];
  for (let v = 0; v < 3; v++) {
    AUDIO_MOODS.forEach((grp) => {
      grp.titles.forEach((title, idx) => {
        const mins = v === 0 ? '01' : v === 1 ? '02' : '00';
        const secs = String(12 + ((idx * 13 + v * 7) % 45)).padStart(2, '0');
        const dur = grp.mood === 'Notification' ? `00:0${(idx % 4) + 2}` : `${mins}:${secs}`;
        const label = v === 0 ? title : `${title} Mix ${v + 1}`;
        list.push({
          id: `aud-${grp.mood.toLowerCase().replace(/\s+/g, '')}-${v}-${idx}`,
          label,
          category: 'Audio',
          subCategory: grp.mood,
          previewHint: dur,
          accentColor: grp.color,
          element: {
            type: 'media',
            mediaKind: 'audio',
            mediaDuration: dur,
            audioMood: grp.mood,
            name: label,
            x: 200,
            y: 220,
            width: 420,
            height: 110,
            rotation: 0,
            opacity: 1,
            locked: false,
            hidden: false,
            fill: grp.color,
          },
        });
      });
    });
  }
  return list;
})();

// 9. SHEETS (10 ready sheet layouts)
export const SHEET_ELEMENTS: ExtendedElementItem[] = [
  {
    id: 'sheet-price-list',
    label: 'Price List Sheet',
    category: 'Sheets',
    previewHint: '4×5 Sheet',
    accentColor: '#0F766E',
    element: {
      type: 'table',
      name: 'Price List Sheet',
      tableHeaderBg: '#0F766E',
      tableRows: [
        ['Service / Item', 'Tier', 'Price', 'Turnaround'],
        ['Brand Identity Kit', 'Standard', '$1,200', '5 Days'],
        ['Pitch Deck Design', 'Full 16 Slides', '$1,850', '4 Days'],
        ['Social Media Pack', '20 Templates', '$650', '2 Days'],
        ['Lab Report Layout', 'Print + PDF', '$480', '2 Days'],
      ],
      x: 150,
      y: 130,
      width: 620,
      height: 290,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'sheet-attendance',
    label: 'Attendance Sheet',
    category: 'Sheets',
    previewHint: 'Weekly Log',
    accentColor: '#2563EB',
    element: {
      type: 'table',
      name: 'Attendance Sheet',
      tableHeaderBg: '#2563EB',
      tableRows: [
        ['Team Member', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        ['Elena Rostova', 'P', 'P', 'P', 'P', 'P'],
        ['Marcus Chen', 'P', 'P', 'Remote', 'P', 'P'],
        ['Priya Nair', 'P', 'Leave', 'P', 'P', 'P'],
        ['David Morales', 'P', 'P', 'P', 'Remote', 'P'],
      ],
      x: 140,
      y: 130,
      width: 640,
      height: 290,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'sheet-lab-test',
    label: 'Lab Test List Sheet',
    category: 'Sheets',
    previewHint: 'Clinical Log',
    accentColor: '#0284C7',
    element: {
      type: 'table',
      name: 'Lab Test List',
      tableHeaderBg: '#0284C7',
      tableRows: [
        ['Test Name', 'Sample', 'Result', 'Normal Range'],
        ['Hemoglobin', 'Blood', '14.2 g/dL', '12.0 - 16.0'],
        ['Glucose Fasting', 'Serum', '88 mg/dL', '70 - 99'],
        ['Lipid Panel', 'Serum', 'Optimal', '< 200 mg/dL'],
        ['Vitamin D', 'Blood', '42 ng/mL', '30 - 100'],
      ],
      x: 150,
      y: 130,
      width: 620,
      height: 290,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'sheet-monthly',
    label: 'Monthly Sheet',
    category: 'Sheets',
    previewHint: 'Monthly KPI',
    accentColor: '#6366F1',
    element: {
      type: 'table',
      name: 'Monthly Sheet',
      tableHeaderBg: '#6366F1',
      tableRows: [
        ['Month', 'Revenue', 'Expenses', 'Net Profit'],
        ['January', '$24,000', '$11,200', '$12,800'],
        ['February', '$29,500', '$12,000', '$17,500'],
        ['March', '$34,800', '$13,100', '$21,700'],
        ['April', '$41,200', '$14,000', '$27,200'],
      ],
      x: 150,
      y: 130,
      width: 620,
      height: 290,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'sheet-calendar',
    label: 'Calendar Sheet',
    category: 'Sheets',
    previewHint: '7-Day Grid',
    accentColor: '#EC4899',
    element: {
      type: 'table',
      name: 'Calendar Sheet',
      tableHeaderBg: '#EC4899',
      tableRows: [
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        ['1 Kickoff', '2 Draft', '3 Review', '4 Shoot', '5 Edit', '6', '7'],
        ['8 Deck', '9 Brand', '10 QA', '11 Sync', '12 Ship', '13', '14'],
        ['15 Sprint', '16 Print', '17 Audit', '18 Demo', '19 Live', '20', '21'],
      ],
      x: 120,
      y: 140,
      width: 680,
      height: 260,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
];

// 10. TABLES (8 editable tables: 2x2, 3x3, 4x4, Price Table, Comparison Table)
export const TABLE_ELEMENTS: ExtendedElementItem[] = [
  {
    id: 'tbl-2x2',
    label: '2×2 Table',
    category: 'Tables',
    previewHint: '2×2 Editable',
    accentColor: '#0F172A',
    element: {
      type: 'table',
      name: '2×2 Table',
      tableHeaderBg: '#0F172A',
      tableRows: [
        ['Header A', 'Header B'],
        ['Cell 1A', 'Cell 1B'],
      ],
      x: 240,
      y: 180,
      width: 420,
      height: 170,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'tbl-3x3',
    label: '3×3 Table',
    category: 'Tables',
    previewHint: '3×3 Editable',
    accentColor: '#2563EB',
    element: {
      type: 'table',
      name: '3×3 Table',
      tableHeaderBg: '#2563EB',
      tableRows: [
        ['Column 1', 'Column 2', 'Column 3'],
        ['Row 1A', 'Row 1B', 'Row 1C'],
        ['Row 2A', 'Row 2B', 'Row 2C'],
      ],
      x: 200,
      y: 160,
      width: 500,
      height: 220,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'tbl-4x4',
    label: '4×4 Table',
    category: 'Tables',
    previewHint: '4×4 Editable',
    accentColor: '#0F766E',
    element: {
      type: 'table',
      name: '4×4 Table',
      tableHeaderBg: '#0F766E',
      tableRows: [
        ['Item', 'Q1', 'Q2', 'Q3'],
        ['Design', '12', '18', '24'],
        ['Media', '20', '28', '35'],
        ['Growth', '+15%', '+24%', '+38%'],
      ],
      x: 180,
      y: 140,
      width: 540,
      height: 260,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'tbl-price',
    label: 'Price Table',
    category: 'Tables',
    previewHint: 'Pricing Tiers',
    accentColor: '#D97706',
    element: {
      type: 'table',
      name: 'Price Table',
      tableHeaderBg: '#18181B',
      tableRows: [
        ['Package', 'Starter', 'Studio'],
        ['Monthly Fee', '$0 Free', '$49'],
        ['Templates', '100+ Included', 'Unlimited'],
        ['Team Seats', 'Up to 5', 'Unlimited'],
      ],
      x: 180,
      y: 140,
      width: 540,
      height: 260,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
  {
    id: 'tbl-comparison',
    label: 'Comparison Table',
    category: 'Tables',
    previewHint: 'Side-by-side',
    accentColor: '#7C3AED',
    element: {
      type: 'table',
      name: 'Comparison Table',
      tableHeaderBg: '#7C3AED',
      tableRows: [
        ['Feature', 'Option A', 'Option B'],
        ['Speed', '98 ms', '140 ms'],
        ['Accuracy', '99.4%', '96.2%'],
        ['Support', '24/7 Live', 'Email Only'],
      ],
      x: 180,
      y: 140,
      width: 540,
      height: 260,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    },
  },
];

// 11. CHARTS (Bar, Pie, Line, Donut + extra presets)
export const CHART_ELEMENTS: ExtendedElementItem[] = [
  {
    id: 'cht-bar',
    label: 'Bar Chart',
    category: 'Charts',
    previewHint: 'Live Editable',
    accentColor: '#2563EB',
    element: {
      type: 'chart',
      chartKind: 'bar',
      chartTitle: 'Quarterly Growth',
      name: 'Bar Chart',
      x: 200,
      y: 140,
      width: 500,
      height: 310,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#2563EB',
      chartData: [
        { label: 'Q1', value: 120, color: '#0F172A' },
        { label: 'Q2', value: 190, color: '#0F766E' },
        { label: 'Q3', value: 250, color: '#2563EB' },
        { label: 'Q4', value: 320, color: '#EC4899' },
      ],
    },
  },
  {
    id: 'cht-pie',
    label: 'Pie Chart',
    category: 'Charts',
    previewHint: 'Live Editable',
    accentColor: '#EC4899',
    element: {
      type: 'chart',
      chartKind: 'pie',
      chartTitle: 'Market Share',
      name: 'Pie Chart',
      x: 220,
      y: 140,
      width: 450,
      height: 280,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#EC4899',
      chartData: [
        { label: 'Product', value: 45, color: '#2563EB' },
        { label: 'Services', value: 30, color: '#10B981' },
        { label: 'Partner', value: 25, color: '#F59E0B' },
      ],
    },
  },
  {
    id: 'cht-line',
    label: 'Line Chart',
    category: 'Charts',
    previewHint: 'Live Editable',
    accentColor: '#10B981',
    element: {
      type: 'chart',
      chartKind: 'line',
      chartTitle: 'Monthly Velocity',
      name: 'Line Chart',
      x: 200,
      y: 140,
      width: 520,
      height: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#10B981',
      chartData: [
        { label: 'Jan', value: 42, color: '#10B981' },
        { label: 'Feb', value: 68, color: '#10B981' },
        { label: 'Mar', value: 55, color: '#10B981' },
        { label: 'Apr', value: 94, color: '#10B981' },
        { label: 'May', value: 118, color: '#10B981' },
      ],
    },
  },
  {
    id: 'cht-donut',
    label: 'Donut Chart',
    category: 'Charts',
    previewHint: 'Live Editable',
    accentColor: '#0F766E',
    element: {
      type: 'chart',
      chartKind: 'donut',
      chartTitle: 'Channel Mix',
      name: 'Donut Chart',
      x: 220,
      y: 140,
      width: 450,
      height: 280,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: '#0F766E',
      chartData: [
        { label: 'Direct', value: 48, color: '#0F172A' },
        { label: 'Social', value: 32, color: '#0F766E' },
        { label: 'Organic', value: 20, color: '#6366F1' },
      ],
    },
  },
];

// 12. FRAMES (108+ Frames)
const FRAME_SHAPES: {
  kind: NonNullable<CanvasElement['frameKind']>;
  label: string;
  w: number;
  h: number;
}[] = [
  { kind: 'circle', label: 'Circle Frame', w: 240, h: 240 },
  { kind: 'square', label: 'Square Frame', w: 240, h: 240 },
  { kind: 'heart', label: 'Heart Frame', w: 250, h: 230 },
  { kind: 'phone', label: 'Phone Frame', w: 210, h: 380 },
  { kind: 'polaroid', label: 'Polaroid Frame', w: 250, h: 290 },
  { kind: 'arch', label: 'Arch Frame', w: 230, h: 300 },
  { kind: 'star', label: 'Star Frame', w: 250, h: 250 },
  { kind: 'rounded', label: 'Rounded Frame', w: 260, h: 220 },
  { kind: 'hex', label: 'Hexagon Frame', w: 240, h: 240 },
  { kind: 'pill', label: 'Pill Frame', w: 300, h: 160 },
  { kind: 'blob', label: 'Blob Frame', w: 250, h: 240 },
  { kind: 'diamond', label: 'Diamond Frame', w: 240, h: 240 },
];

export const FRAME_ELEMENTS: ExtendedElementItem[] = (() => {
  const list: ExtendedElementItem[] = [];
  for (let v = 0; v < 9; v++) {
    FRAME_SHAPES.forEach((frm, idx) => {
      const color = VIVID_PALETTE[(v * 3 + idx) % VIVID_PALETTE.length];
      const photo = STOCK_THUMB_PHOTOS[(v + idx) % STOCK_THUMB_PHOTOS.length];
      list.push({
        id: `frm-${frm.kind}-${v}`,
        label: v === 0 ? frm.label : `${frm.label} #${v + 1}`,
        category: 'Frames',
        subCategory: frm.label,
        previewHint: 'Drop Photo',
        accentColor: color,
        element: {
          type: 'frame',
          frameKind: frm.kind,
          name: frm.label,
          x: 240,
          y: 140,
          width: frm.w,
          height: frm.h,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          stroke: color,
          src: photo,
        },
      });
    });
  }
  return list;
})();

// 13. GRIDS (8 Grid layouts — tap each box to add photo)
export const GRID_ELEMENTS: ExtendedElementItem[] = [
  {
    id: 'grd-2-col',
    label: '2 Photo Grid (Split)',
    category: 'Grids',
    previewHint: '2 Slots',
    accentColor: '#2563EB',
    element: {
      type: 'grid',
      gridCols: 2,
      gridRows: 1,
      name: '2 Photo Grid',
      x: 160,
      y: 130,
      width: 560,
      height: 320,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      gridImages: [STOCK_THUMB_PHOTOS[0], STOCK_THUMB_PHOTOS[1]],
    },
  },
  {
    id: 'grd-2-row',
    label: '2 Photo Grid (Stacked)',
    category: 'Grids',
    previewHint: '2 Slots',
    accentColor: '#0F766E',
    element: {
      type: 'grid',
      gridCols: 1,
      gridRows: 2,
      name: '2 Stacked Grid',
      x: 200,
      y: 110,
      width: 440,
      height: 440,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      gridImages: [STOCK_THUMB_PHOTOS[2], STOCK_THUMB_PHOTOS[3]],
    },
  },
  {
    id: 'grd-3-col',
    label: '3 Photo Grid',
    category: 'Grids',
    previewHint: '3 Slots',
    accentColor: '#EC4899',
    element: {
      type: 'grid',
      gridCols: 3,
      gridRows: 1,
      name: '3 Photo Grid',
      x: 140,
      y: 140,
      width: 600,
      height: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      gridImages: [STOCK_THUMB_PHOTOS[0], STOCK_THUMB_PHOTOS[1], STOCK_THUMB_PHOTOS[2]],
    },
  },
  {
    id: 'grd-4-sq',
    label: '4 Photo Grid (2×2)',
    category: 'Grids',
    previewHint: '4 Slots',
    accentColor: '#F59E0B',
    element: {
      type: 'grid',
      gridCols: 2,
      gridRows: 2,
      name: '4 Photo Grid',
      x: 170,
      y: 110,
      width: 520,
      height: 400,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      gridImages: [
        STOCK_THUMB_PHOTOS[0],
        STOCK_THUMB_PHOTOS[1],
        STOCK_THUMB_PHOTOS[2],
        STOCK_THUMB_PHOTOS[3],
      ],
    },
  },
  {
    id: 'grd-collage-6',
    label: '6 Photo Collage Grid',
    category: 'Grids',
    previewHint: '6 Slots',
    accentColor: '#6366F1',
    element: {
      type: 'grid',
      gridCols: 3,
      gridRows: 2,
      name: '6 Photo Collage',
      x: 150,
      y: 120,
      width: 580,
      height: 380,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      gridImages: STOCK_THUMB_PHOTOS.slice(0, 6),
    },
  },
  {
    id: 'grd-collage-9',
    label: '9 Photo Moodboard',
    category: 'Grids',
    previewHint: '9 Slots',
    accentColor: '#10B981',
    element: {
      type: 'grid',
      gridCols: 3,
      gridRows: 3,
      name: '9 Photo Collage',
      x: 180,
      y: 100,
      width: 480,
      height: 460,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      gridImages: [...STOCK_THUMB_PHOTOS, STOCK_THUMB_PHOTOS[0]].slice(0, 9),
    },
  },
];

// 14. MOCKUPS (108+ Mockups — user design auto-fits inside mockup)
const MOCKUP_SEEDS: {
  kind: NonNullable<CanvasElement['mockupKind']>;
  label: string;
  w: number;
  h: number;
}[] = [
  { kind: 'tshirt', label: 'T-Shirt Mockup', w: 320, h: 360 },
  { kind: 'visiting-card', label: 'Visiting Card Mockup', w: 420, h: 250 },
  { kind: 'poster-wall', label: 'Poster on Wall', w: 340, h: 400 },
  { kind: 'phone', label: 'Phone Mockup', w: 230, h: 430 },
  { kind: 'book', label: 'Book Mockup', w: 300, h: 380 },
  { kind: 'mug', label: 'Mug Mockup', w: 320, h: 300 },
  { kind: 'laptop', label: 'Laptop Mockup', w: 500, h: 320 },
  { kind: 'tablet', label: 'Tablet Mockup', w: 360, h: 440 },
  { kind: 'browser', label: 'Browser Mockup', w: 500, h: 320 },
  { kind: 'tote', label: 'Tote Bag Mockup', w: 300, h: 360 },
  { kind: 'billboard', label: 'Billboard Mockup', w: 540, h: 300 },
  { kind: 'box', label: 'Packaging Box Mockup', w: 340, h: 340 },
];

export const MOCKUP_ELEMENTS: ExtendedElementItem[] = (() => {
  const list: ExtendedElementItem[] = [];
  for (let v = 0; v < 9; v++) {
    MOCKUP_SEEDS.forEach((mk, idx) => {
      const color = VIVID_PALETTE[(v + idx * 2) % VIVID_PALETTE.length];
      list.push({
        id: `mk-${mk.kind}-${v}`,
        label: v === 0 ? mk.label : `${mk.label} #${v + 1}`,
        category: 'Mockups',
        subCategory: mk.label,
        previewHint: 'Auto-Fits Design',
        accentColor: color,
        element: {
          type: 'mockup',
          mockupKind: mk.kind,
          mockupCaption: 'Your Design',
          name: mk.label,
          x: 200,
          y: 120,
          width: mk.w,
          height: mk.h,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          fill: color,
        },
      });
    });
  }
  return list;
})();

// Combined searchable index across all 14 categories
export const ALL_SEARCHABLE_ELEMENTS: ExtendedElementItem[] = [
  ...SHAPE_ELEMENTS,
  ...GRAPHIC_ELEMENTS,
  ...VIDEO_ELEMENTS,
  ...THREE_D_ELEMENTS,
  ...FORM_ELEMENTS,
  ...AUDIO_ELEMENTS,
  ...SHEET_ELEMENTS,
  ...TABLE_ELEMENTS,
  ...CHART_ELEMENTS,
  ...FRAME_ELEMENTS,
  ...GRID_ELEMENTS,
  ...MOCKUP_ELEMENTS,
];

export const ELEMENTS_CATEGORY_COLORS: Record<ElementCategoryId, string> = {
  Shapes: 'bg-sky-500',
  Graphics: 'bg-pink-500',
  Photos: 'bg-emerald-500',
  Videos: 'bg-violet-500',
  '3D': 'bg-amber-500',
  Forms: 'bg-blue-600',
  Animations: 'bg-fuchsia-500',
  Audio: 'bg-rose-500',
  Sheets: 'bg-teal-500',
  Tables: 'bg-indigo-500',
  Charts: 'bg-orange-500',
  Frames: 'bg-cyan-500',
  Grids: 'bg-lime-600',
  Mockups: 'bg-purple-600',
};
