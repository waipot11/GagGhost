export interface Scene {
  id: string;
  sceneNumber: number;
  timeRange?: string; // e.g. "0:00 - 0:20"
  sceneTitle?: string; // e.g. "ฉากที่ 1: บิ้วด์อารมณ์หลอน"
  durationSec: number;
  narrationText: string; // ภาษาไทย
  visualPrompt: string; // English prompt for AI Image / Video generator
  midjourneyPrompt?: string; // Midjourney character & scene prompt with seed code
  runwayCameraPrompt?: string; // Runway Gen-3 / Kling / Luma motion prompt
  elevenLabsVoiceStyle?: string; // ElevenLabs Thai voice emotion style
  sunoBgmPrompt?: string; // Suno AI music prompt
  visualImageUrl?: string;
  sfx: 'screaming_ghost' | 'comedy_boing' | 'scary_thunder' | 'funny_cough' | 'creepy_whisper' | 'laugh_track' | 'suspense_stinger';
  bgmMood: 'horror_creepy' | 'suspense_rising' | 'funny_twist' | 'action_panic';
  subtitles: string[];
}

export interface SponsorProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  discountCode: string;
  linkUrl: string;
  bannerImage: string;
  commissionRate: string;
  isShopeeProduct?: boolean;
  shopeeAffiliateId?: string;
  shopeeCategory?: string;
  shopeeRating?: number;
  shopeeSoldAmount?: string;
}

export interface ShopeeConfig {
  affiliateId: string;
  customTrackingTag: string;
  autoInjectToPipeline: boolean;
  defaultCategory: string;
}

export interface ShortStory {
  id: string;
  title: string;
  tagline: string;
  category: 'ผีหอพัก' | 'ผีติดสปีด' | 'ผีโซเชียล' | 'ตำนานพื้นบ้าน' | 'ผีตลกร้าย';
  aspectRatio: '9:16' | '16:9';
  scenes: Scene[];
  twistChoiceA: string;
  twistChoiceB: string;
  winningTwist?: string;
  sponsorProduct?: SponsorProduct;
  vipUnlocked: boolean;
  vipTwistScene?: Scene;
  likesCount: number;
  viewsCount: number;
  sharesCount: number;
  commentsCount: number;
  creator: string;
  createdAt: string;
  thumbnailUrl: string;
  isAutoPublished: boolean;
}

export interface Comment {
  id: string;
  storyId: string;
  userName: string;
  userAvatar: string;
  text: string;
  likes: number;
  timeAgo: string;
}

export interface AutoPipelineStep {
  stepNumber: number;
  name: string;
  description: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  detail?: string;
}

export interface PipelineLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
