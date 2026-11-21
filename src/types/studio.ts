export type ElementType =
  | 'text'
  | 'shape'
  | 'image'
  | 'path'
  | 'chart'
  | 'qrcode'
  | 'table'
  | 'form'
  | 'mockup'
  | 'frame'
  | 'grid'
  | 'media'
  | 'graphic';

export type ShapeKind =
  | 'rectangle'
  | 'rounded'
  | 'circle'
  | 'oval'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'arrow'
  | 'line'
  | 'curve'
  | 'blob'
  | 'half-circle'
  | 'diamond'
  | 'hexagon'
  | 'pentagon'
  | 'octagon'
  | 'ring'
  | 'pill'
  | 'cross'
  | 'cloud'
  | 'crescent'
  | 'shield';

export type AnimationEffect =
  | 'none'
  | 'fade'
  | 'bounce'
  | 'slide'
  | 'zoom'
  | 'spin'
  | 'pop'
  | 'float'
  | 'shake';

export type TextEffect = 'none' | 'shadow' | 'lift' | 'hollow' | 'echo' | 'background';

export type ApprovalStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved';

export type PMProvider = 'jira' | 'linear' | 'asana' | 'slack';

export type PMTicketStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';

export type PMTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ImageFilters {
  brightness: number; // 100 default
  contrast: number;   // 100 default
  saturate: number;   // 100 default
  blur: number;       // 0 default
  grayscale: number;  // 0 default
  sepia: number;      // 0 default
  preset?: 'none' | 'vivid' | 'mono' | 'warm' | 'cool';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
  flipX?: boolean;
  flipY?: boolean;
  groupId?: string;
  animationEffect?: AnimationEffect;

  // Text properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  textEffect?: TextEffect;
  textHighlightColor?: string;
  listStyle?: 'none' | 'bullet';
  dynamicField?: 'pageNumber' | 'date' | 'projectTitle' | 'author';

  // Shape properties
  shapeKind?: ShapeKind;
  fill?: string;
  fillGradient?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed';
  borderRadius?: number;

  // Image properties
  src?: string;
  objectFit?: 'cover' | 'contain';
  filters?: ImageFilters;

  // Freehand Path properties
  svgPath?: string;
  viewBoxWidth?: number;
  viewBoxHeight?: number;

  // Chart properties
  chartKind?: 'bar' | 'pie' | 'line' | 'donut';
  chartTitle?: string;
  chartData?: ChartDataPoint[];

  // QR Code properties
  qrValue?: string;

  // Table / Sheet properties
  tableRows?: string[][];
  tableHeaderBg?: string;

  // Form properties
  formTitle?: string;
  formFields?: { label: string; placeholder: string; fieldType?: 'text' | 'checkbox' | 'radio' }[];
  formCta?: string;

  // Mockup properties
  mockupKind?:
    | 'tshirt'
    | 'visiting-card'
    | 'poster-wall'
    | 'phone'
    | 'book'
    | 'mug'
    | 'laptop'
    | 'tablet'
    | 'browser'
    | 'tote'
    | 'billboard'
    | 'box';
  mockupCaption?: string;

  // Frame properties
  frameKind?:
    | 'circle'
    | 'square'
    | 'heart'
    | 'phone'
    | 'polaroid'
    | 'arch'
    | 'star'
    | 'rounded'
    | 'hex'
    | 'pill'
    | 'blob'
    | 'diamond';

  // Grid properties
  gridCols?: number;
  gridRows?: number;
  gridImages?: string[];

  // Media (Video / Audio / Animation) properties
  mediaKind?: 'video' | 'audio' | 'animation';
  mediaDuration?: string;
  audioMood?: string;

  // Graphics & 3D properties
  graphicVariant?: string;
  graphicSvgPath?: string;
  graphicSvgViewBox?: string;
  graphicEmoji?: string;
  is3D?: boolean;
}

export interface DesignPage {
  id: string;
  title: string;
  backgroundColor: string;
  backgroundGradient?: string;
  notes: string;
  durationSec: number;
  elements: CanvasElement[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  designId: string;
  pageId: string;
  pinX: number | null;
  pinY: number | null;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  linkedTicketId?: string;
  replies: CommentReply[];
}

export interface ApprovalStage {
  id: string;
  roleTitle: string;
  reviewerName: string;
  status: 'pending' | 'approved' | 'changes_requested';
  updatedAt: string;
  note?: string;
}

export interface VersionSnapshot {
  id: string;
  label: string;
  authorName: string;
  createdAt: string;
  summary: string;
  pages: DesignPage[];
}

export interface DesignProject {
  id: string;
  title: string;
  folder: string;
  formatLabel: string;
  width: number;
  height: number;
  approvalStatus: ApprovalStatus;
  linkedTicketIds: string[];
  updatedAt: string;
  updatedBy: string;
  shareAccess: 'view' | 'comment' | 'edit';
  pages: DesignPage[];
  approvalStages: ApprovalStage[];
  versions: VersionSnapshot[];
}

export interface BrandKit {
  id: string;
  orgName: string;
  colors: { name: string; hex: string }[];
  fonts: {
    heading: string;
    subheading: string;
    body: string;
  };
  uploadedLogoSrc?: string;
  uploadedLogoName?: string;
  logos: { id: string; name: string; primaryColor: string; accentColor: string; mark: 'northstar' | 'monogram' | 'wordmark' }[];
}

export interface PMTicket {
  id: string;
  key: string;
  provider: PMProvider;
  title: string;
  description: string;
  status: PMTicketStatus;
  priority: PMTicketPriority;
  assignee: string;
  sprint: string;
  dueDate: string;
  linkedDesignId?: string;
  linkedPageId?: string;
  updatedAt: string;
}

export interface PMIntegrationConfig {
  provider: PMProvider;
  label: string;
  workspaceName: string;
  connected: boolean;
  autoSyncApprovals: boolean;
  notifyChannel?: string;
  lastSyncedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  avatarUrl?: string;
}

export interface CollaboratorPresence {
  clientId: string;
  userId: string;
  name: string;
  role: string;
  color: string;
  avatarUrl?: string;
  designId: string;
  pageId: string;
  cursorX: number | null;
  cursorY: number | null;
  selectedElementId: string | null;
  lastActiveAt: number;
}

export type TemplateCategory =
  | 'Presentation'
  | 'Portfolio'
  | 'Business'
  | 'Education'
  | 'Social Media'
  | 'Lab Report'
  | 'Banner'
  | 'Poster'
  | 'Brand';

export interface DesignTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  style: 'Minimal' | 'Editorial' | 'Bold' | 'Corporate';
  language: 'English' | 'Spanish' | 'French' | 'German';
  width: number;
  height: number;
  formatLabel: string;
  previewBg: string;
  pageCount: number;
  page: Omit<DesignPage, 'id'>;
}

export interface StockPhotoItem {
  id: string;
  title: string;
  category: string;
  src: string;
  thumbUrl: string;
  width: number;
  height: number;
  author?: string;
  section?: 'recommended' | 'trending';
}

export interface UploadedAsset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  uploadedAt: string;
}

export interface WorkspaceState {
  workspaceName: string;
  brandKit: BrandKit;
  team: TeamMember[];
  designs: DesignProject[];
  comments: CommentThread[];
  pmTickets: PMTicket[];
  integrations: PMIntegrationConfig[];
  uploads: UploadedAsset[];
}
