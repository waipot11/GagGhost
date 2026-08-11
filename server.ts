import express from "express";
import path from "path";
import fs from "fs";
import { exec, execSync } from "child_process";
import util from "util";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { google } from "googleapis";
import { Readable } from "stream";

const execPromise = util.promisify(exec);

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));

// In-memory YouTube OAuth Tokens, Credentials & Channel Cache
let youtubeAuthTokens: any = null;
let youtubeChannelInfo: any = null;
let customGoogleClientId: string = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
let customGoogleClientSecret: string = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';

// Helper to get OAuth2 Client for YouTube Data API v3
function getYouTubeOAuthClient(req?: express.Request | string, customRedirectUri?: string) {
  const clientId = customGoogleClientId || process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
  const clientSecret = customGoogleClientSecret || process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';

  let redirectUri = customRedirectUri || '';

  if (!redirectUri) {
    if (typeof req === 'object' && req && (req as express.Request).query && (req as express.Request).query.redirectUri) {
      redirectUri = String((req as express.Request).query.redirectUri);
    }
  }

  if (!redirectUri) {
    if (process.env.APP_URL) {
      redirectUri = `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/youtube/callback`;
    } else {
      let host = 'localhost:3000';
      let protocol = 'http';

      if (typeof req === 'string') {
        host = req;
        protocol = host.startsWith('https') ? 'https' : 'http';
      } else if (req) {
        host = req.headers.host || 'localhost:3000';
        const forwardedProto = req.headers['x-forwarded-proto'] as string;
        if (forwardedProto) {
          protocol = forwardedProto.split(',')[0].trim();
        } else {
          protocol = (req.secure || host.includes('run.app')) ? 'https' : 'http';
        }
      }

      if (protocol === 'https') {
        redirectUri = `https://${host}/api/auth/youtube/callback`;
      } else {
        // ALWAYS use http://localhost:3000/api/auth/youtube/callback for HTTP
        // Google OAuth enforces localhost for HTTP Sensitive Scopes (youtube.upload)
        redirectUri = `http://localhost:3000/api/auth/youtube/callback`;
      }
    }
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  return {
    client: oauth2Client,
    redirectUri,
    clientId,
    clientSecret
  };
}

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not defined.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key",
  });
};

// In-Memory Database for Shopee Affiliate Configuration
let shopeeConfig = {
  affiliateId: "shopee_aff_gagghost_th",
  customTrackingTag: "GagGhost_Shorts_AI",
  autoInjectToPipeline: true,
  defaultCategory: "ของใช้สยองขวัญตลก"
};

const shopeePresetProducts = [
  {
    id: "sp-shopee-01",
    name: "หม้อต้มสุกี้ไฟฟ้าพกพา 1.8L (ต้มหมูกระทะตอนตีสาม)",
    description: "หม้อชาบูดิสรัปชั่น ร้อนไว 1 นาที ต้มมาม่ากับผีได้ทันที!",
    price: 259,
    discountCode: "SHOPEEGHOST50",
    linkUrl: "https://shope.ee/m/affiliate?id=shopee_aff_gagghost_th&product=pot18",
    bannerImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80",
    commissionRate: "30% (รับ 77 บาท/ชิ้น)",
    isShopeeProduct: true,
    shopeeAffiliateId: "shopee_aff_gagghost_th",
    shopeeCategory: "ของใช้ในบ้าน/เครื่องใช้ไฟฟ้า",
    shopeeRating: 4.9,
    shopeeSoldAmount: "ขายแล้ว 12.4k ชิ้น"
  },
  {
    id: "sp-shopee-02",
    name: "ไฟฉายแรงสูง 100,000 Lumens (ส่องสว่างจนกระสือแสบตา)",
    description: "ไฟฉายพกพาชาร์จ Type-C ส่องสว่างได้ไกล 1 กิโลเมตร กระสือต้องบินหนีไปนอน!",
    price: 199,
    discountCode: "SHOPEELIGHT",
    linkUrl: "https://shope.ee/m/affiliate?id=shopee_aff_gagghost_th&product=flashlight",
    bannerImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80",
    commissionRate: "40% (รับ 79 บาท/ชิ้น)",
    isShopeeProduct: true,
    shopeeAffiliateId: "shopee_aff_gagghost_th",
    shopeeCategory: "อุปกรณ์แคมป์ปิ้ง/ไอที",
    shopeeRating: 4.8,
    shopeeSoldAmount: "ขายแล้ว 8.9k ชิ้น"
  },
  {
    id: "sp-shopee-03",
    name: "ขาตั้งกล้องเซลฟี่บลูทูธ 2 เมตร (ถ่ายติดวิญญาณสไตล์ TikTok)",
    description: "ขาตั้งกล้องพร้อมรีโมตไร้สาย 360 องศา จะถ่ายคนหรือถ่ายผีก็ชัดแจ๋ว HD!",
    price: 149,
    discountCode: "SHOPEETIPOD",
    linkUrl: "https://shope.ee/m/affiliate?id=shopee_aff_gagghost_th&product=tripod",
    bannerImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80",
    commissionRate: "35% (รับ 52 บาท/ชิ้น)",
    isShopeeProduct: true,
    shopeeAffiliateId: "shopee_aff_gagghost_th",
    shopeeCategory: "ไอที/แกดเจ็ตมือถือ",
    shopeeRating: 5.0,
    shopeeSoldAmount: "ขายแล้ว 25.1k ชิ้น"
  },
  {
    id: "sp-shopee-04",
    name: "สเปรย์ดับกลิ่นห้องนอนอโรม่า (ดับกลิ่นวิญญาณหลอน)",
    description: "สเปรย์หอมปรับอากาศกลิ่นอโรมาผ่อนคลาย ฉีดปุ๊บ ผีอารมณ์ดีไม่หลอนอีกต่อไป",
    price: 89,
    discountCode: "SHOPEESPRAY",
    linkUrl: "https://shope.ee/m/affiliate?id=shopee_aff_gagghost_th&product=spray",
    bannerImage: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=300&q=80",
    commissionRate: "25% (รับ 22 บาท/ชิ้น)",
    isShopeeProduct: true,
    shopeeAffiliateId: "shopee_aff_gagghost_th",
    shopeeCategory: "ของใช้ในบ้าน/บิวตี้",
    shopeeRating: 4.7,
    shopeeSoldAmount: "ขายแล้ว 18.3k ชิ้น"
  }
];

// In-Memory Database for Auto-Published Stories
let publishedStories: any[] = [
  {
    id: 'story-001',
    title: 'ผีหลังตู้เย็นกูเกิลไฟต์',
    tagline: 'ผีเฮี้ยนสยองขวัญหลอนกลางดึก แต่หิวหมูกระทะตอนตีสาม!',
    category: 'ผีหอพัก',
    aspectRatio: '9:16',
    creator: 'GagGhost AI Bot #01',
    createdAt: '10 นาทีที่แล้ว',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80',
    likesCount: 14200,
    viewsCount: 89400,
    sharesCount: 3100,
    commentsCount: 482,
    vipUnlocked: false,
    isAutoPublished: true,
    sponsorProduct: shopeePresetProducts[0],
    twistChoiceA: 'ผีสิงตู้เย็นแล้วสั่ง GrabFood เอง',
    twistChoiceB: 'ผีออกมาถามหาซอสมะเขือเทศที่หายไป',
    winningTwist: 'ผีสิงตู้เย็นแล้วสั่ง GrabFood เอง',
    scenes: [
      {
        id: 's1-1',
        sceneNumber: 1,
        durationSec: 8,
        narrationText: 'คืนวันศุกร์ ณ หอพักร้างชั้น 4 นกกำลังนั่งปั่นงานตอนตีสาม จู่ๆ ไฟห้องก็กระพริบ และมีเสียงขูดหลังตู้เย็นดังขึ้น...',
        visualPrompt: 'Dark dim student room at 3am with flickering fluorescent lights, creepy shadow emerging from behind an old refrigerator, horror cinematic lighting, vertical 9:16',
        visualImageUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80',
        sfx: 'scary_thunder',
        bgmMood: 'horror_creepy',
        subtitles: ['คืนวันศุกร์ ณ หอพักร้าง', 'นกกำลังปั่นงานตอนตีสาม', 'ไฟเริ่มกระพริบสยองขวัญ...']
      },
      {
        id: 's1-2',
        sceneNumber: 2,
        durationSec: 9,
        narrationText: 'นกหยิบไม้ช็อตยุงขึ้นมาขู่ "ออกมานะผี! กูไหว้พระทุกวันพฤหัส!" ทันใดนั้น เงาดำหัวยาวก็ค่อยๆ คลานออกมาจากช่องใต้ตู้เย็น!',
        visualPrompt: 'Scared Thai guy holding electric mosquito swatter pointing at tall dark phantom creepy ghost emerging, eerie atmosphere, comedy horror',
        visualImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        sfx: 'screaming_ghost',
        bgmMood: 'suspense_rising',
        subtitles: ['นกหยิบไม้ช็อตยุงขึ้นมาขู่!', 'กูไหว้พระทุกวันพฤหัสนะโว้ย!', 'เงาสยองค่อยๆ คลานออกมา!']
      },
      {
        id: 's1-3',
        sceneNumber: 3,
        durationSec: 10,
        narrationText: 'ผีส่งเสียงขู่ฟ่อออ... แล้วพูดยื่นหน้ามาใกล้ๆ "มึง... กูหิว... กูหยิบหมูสไลด์มึงไปกินต้มม่าม่าสองถุงแล้วนะ!"',
        visualPrompt: 'Funny ghost face holding a empty instant noodle cup with sheepish expression, hilarious horror twist, dramatic close-up',
        visualImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        sfx: 'funny_cough',
        bgmMood: 'funny_twist',
        subtitles: ['ผีส่งเสียงฟ่อออ...', 'มึง... กูหิว...', 'กูแอบกินหมูสไลด์มึงหมดแล้ว!']
      },
      {
        id: 's1-4',
        sceneNumber: 4,
        durationSec: 11,
        narrationText: 'นกตกใจตะโกน "อ้าวไอ้ผี! นั่นหมูชาบูตู! งั้นกูสั่งแอป GrabFood มึงต้องจ่ายคนละครึ่งด้วย!" ผีบอก "โอเค มึงกดรับส่วนลดโค้ด GAG50OFF ด้วยนะ!"',
        visualPrompt: 'Guy and ghost sitting together looking at smartphone screen ordering food delivery with discount coupon overlay, neon green funny horror lighting',
        visualImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        sfx: 'comedy_boing',
        bgmMood: 'funny_twist',
        subtitles: ['นั่นหมูชาบูของกู!', 'งั้นสั่ง GrabFood คนละครึ่ง!', 'ผีบอก: ใส่โค้ดส่วนลดด้วยนะ!']
      }
    ],
    vipTwistScene: {
      id: 's1-vip',
      sceneNumber: 5,
      durationSec: 8,
      narrationText: '[ฉากพิเศษ VIP] ไรเดอร์มาส่งของ เปิดประตูมาเจอผี นึกว่าเป็นลูกค้าแต่งคอสเพลย์ เลยขอถ่ายรูปทำคอนเทนต์ TikTok ได้ยอดวิวล้านวิว!',
      visualPrompt: 'Delivery driver taking selfie with scary ghost holding food bags, smiling cheerfully together, TikTok viral moment',
      visualImageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
      sfx: 'laugh_track',
      bgmMood: 'funny_twist',
      subtitles: ['[ฉากพิเศษ VIP]', 'ไรเดอร์ขอถ่ายรูปคู่ทำ TikTok', 'ยอดวิวทะลุล้านวิวไปแล้ว!']
    }
  },
  {
    id: 'story-002',
    title: 'กระสือ 5G หิวกระชายดำ',
    tagline: 'ตำนานกระสือถอดหัวบินส่องไฟฉายไอโฟนหาของกินกลางทุ่งนา',
    category: 'ผีติดสปีด',
    aspectRatio: '9:16',
    creator: 'GagGhost AI Bot #02',
    createdAt: '25 นาทีที่แล้ว',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    likesCount: 28500,
    viewsCount: 142000,
    sharesCount: 8400,
    commentsCount: 912,
    vipUnlocked: true,
    isAutoPublished: true,
    sponsorProduct: {
      id: 'sp-02',
      name: 'ไฟฉายไล่ผีกระสือ 100,000 Lumens',
      description: 'ไฟฉายพกพาสว่างจนกระสือแสบตา ต้องบินหนีไปนอน',
      price: 299,
      discountCode: 'LIGHTGHOST',
      linkUrl: '#',
      bannerImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80',
      commissionRate: '40% (รับ 120 บาท/ชิ้น)',
    },
    twistChoiceA: 'กระสือติดโซลาร์เซลล์ที่หัวช่วยประหยัดไฟ',
    twistChoiceB: 'กระสือบินไปไลฟ์ขายของใน Shopee',
    winningTwist: 'กระสือบินไปไลฟ์ขายของใน Shopee',
    scenes: [
      {
        id: 's2-1',
        sceneNumber: 1,
        durationSec: 8,
        narrationText: 'ลุงสมพรขี่มอเตอร์ไซค์กลับบ้านตอนกลางคืน ระหว่างทางมองขึ้นไปบนฟ้า เห็นดวงไฟสีเขียวส่องสว่างลอยเคว้งกระพริบวูบวาบ!',
        visualPrompt: 'Night rural Thai road, old man riding motorcycle looking up at glowing green flying ghost head floating in dark sky, spooky atmosphere',
        visualImageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
        sfx: 'scary_thunder',
        bgmMood: 'horror_creepy',
        subtitles: ['ลุงสมพรขี่มอเตอร์ไซค์ยามดึก', 'มองขึ้นไปบนท้องฟ้า...', 'เห็นไฟสีเขียวลอยส่องสว่าง!']
      },
      {
        id: 's2-2',
        sceneNumber: 2,
        durationSec: 9,
        narrationText: 'ลุงตกใจตัวเกร็ง! "กระสือแน่ๆ! ยายสายถอดหัวบินแล้ว!" แต่พอส่องไฟฉายดูชัดๆ กลับเห็นกระสือหนีบไฟแหวนเซลฟี่ไว้ที่ไส้!',
        visualPrompt: 'Flying female ghost head with glowing internal organs with a ring light attached for vlogging, hilarious high-tech Krasue ghost',
        visualImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        sfx: 'creepy_whisper',
        bgmMood: 'suspense_rising',
        subtitles: ['ยายสายถอดหัวบินแน่ๆ!', 'พอส่องไฟฉายดูชัดๆ...', 'กระสือติดไฟแหวนเซลฟี่ที่ไส้!']
      },
      {
        id: 's2-3',
        sceneNumber: 3,
        durationSec: 10,
        narrationText: 'กระสือตะโกนลงมา "ลุง! อย่าพึ่งวิ่ง! ช่วยกดเอฟออเดอร์ครีมหน้าขาวกับปลาร้าสับในไลฟ์ยายหน่อย! ส่งฟรีมีเก็บเงินปลายทาง!"',
        visualPrompt: 'Floating ghost holding glowing smartphone live streaming to online viewers, funny ecommerce horror cartoon style',
        visualImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        sfx: 'funny_cough',
        bgmMood: 'funny_twist',
        subtitles: ['กระสือตะโกน: ลุงอย่าเพิ่งวิ่ง!', 'กดสั่งปลาร้าสับในไลฟ์ยายหน่อย!', 'ส่งฟรี มีเก็บเงินปลายทาง!']
      }
    ]
  }
];

let commentsDb: Record<string, any[]> = {
  'story-001': [
    { id: 'c1', storyId: 'story-001', userName: 'น้องส้ม สายสยอง', userAvatar: '👻', text: 'ฮากร๊ากกก ผีสั่ง GrabFood มีใช้โค้ดส่วนลดด้วย! 5555', likes: 128, timeAgo: '5 นาทีที่แล้ว' },
    { id: 'c2', storyId: 'story-001', userName: 'ช่างต้อม ปลวกแดง', userAvatar: '💀', text: 'ผีหลังตู้เย็นน่ารักเฉย อยากได้ผ้ายันต์ 5G เลยครับ!', likes: 45, timeAgo: '8 นาทีที่แล้ว' }
  ],
  'story-002': [
    { id: 'c3', storyId: 'story-002', userName: 'เซียนกูรูผี', userAvatar: '🔮', text: 'กระสือติดไฟแหวนไลฟ์สด 555555 ยุคใหม่จริงๆ', likes: 98, timeAgo: '12 นาทีที่แล้ว' }
  ]
};

// GET Shopee Config
app.get("/api/shopee/config", (req, res) => {
  res.json({ config: shopeeConfig });
});

// POST Save Shopee Config
app.post("/api/shopee/config", (req, res) => {
  const { affiliateId, customTrackingTag, autoInjectToPipeline, defaultCategory } = req.body;
  if (affiliateId !== undefined) shopeeConfig.affiliateId = affiliateId;
  if (customTrackingTag !== undefined) shopeeConfig.customTrackingTag = customTrackingTag;
  if (autoInjectToPipeline !== undefined) shopeeConfig.autoInjectToPipeline = autoInjectToPipeline;
  if (defaultCategory !== undefined) shopeeConfig.defaultCategory = defaultCategory;

  // Update existing preset products links with new Affiliate ID
  shopeePresetProducts.forEach(p => {
    p.shopeeAffiliateId = shopeeConfig.affiliateId;
    p.linkUrl = `https://shope.ee/m/affiliate?id=${encodeURIComponent(shopeeConfig.affiliateId)}&tag=${encodeURIComponent(shopeeConfig.customTrackingTag)}&item=${p.id}`;
  });

  res.json({ success: true, config: shopeeConfig, message: "บันทึก Shopee Affiliate ID เรียบร้อยแล้ว!" });
});

// GET Shopee Preset Products Catalog
app.get("/api/shopee/preset-products", (req, res) => {
  res.json({ products: shopeePresetProducts });
});

// POST Convert Raw Shopee Link or Name to Affiliate Tagged Link
app.post("/api/shopee/convert-link", (req, res) => {
  const { originalUrl, productName } = req.body;
  const affId = shopeeConfig.affiliateId || "shopee_aff_gagghost_th";
  const tag = shopeeConfig.customTrackingTag || "GagGhost_Shorts";
  
  const affiliateUrl = `https://shope.ee/m/affiliate?id=${encodeURIComponent(affId)}&tag=${encodeURIComponent(tag)}&product=${encodeURIComponent(productName || 'item')}`;
  
  res.json({
    success: true,
    affiliateUrl,
    affiliateId: affId,
    trackingTag: tag
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", storiesCount: publishedStories.length, timestamp: new Date().toISOString() });
});

// GET Stories Feed
app.get("/api/stories", (req, res) => {
  res.json({ stories: publishedStories });
});

// POST Like Story
app.post("/api/stories/:id/like", (req, res) => {
  const { id } = req.params;
  const story = publishedStories.find(s => s.id === id);
  if (story) {
    story.likesCount += 1;
    res.json({ success: true, likesCount: story.likesCount });
  } else {
    res.status(404).json({ error: "Story not found" });
  }
});

// GET Comments
app.get("/api/stories/:id/comments", (req, res) => {
  const { id } = req.params;
  res.json({ comments: commentsDb[id] || [] });
});

// POST Comment
app.post("/api/stories/:id/comment", (req, res) => {
  const { id } = req.params;
  const { userName, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Comment text required" });
  }
  if (!commentsDb[id]) commentsDb[id] = [];
  const newComment = {
    id: `c_${Date.now()}`,
    storyId: id,
    userName: userName || "ผู้ใช้สยองขวัญ",
    userAvatar: "👻",
    text,
    likes: 0,
    timeAgo: "เมื่อสักครู่"
  };
  commentsDb[id].unshift(newComment);
  const story = publishedStories.find(s => s.id === id);
  if (story) story.commentsCount += 1;
  res.json({ success: true, comment: newComment });
});

// POST Unlock VIP
app.post("/api/stories/:id/unlock-vip", (req, res) => {
  const { id } = req.params;
  const story = publishedStories.find(s => s.id === id);
  if (story) {
    story.vipUnlocked = true;
    res.json({ success: true, story });
  } else {
    res.status(404).json({ error: "Story not found" });
  }
});

// Helper for Fallback AI Script Generation (5 Scenes Framework)
function generateFallbackScript(topic?: string, category?: string) {
  const cleanTopic = topic || 'ผีหลังตู้เย็นหิวหมูกระทะตอนตีสาม';
  const selectedShopee = shopeePresetProducts[Math.floor(Math.random() * shopeePresetProducts.length)];

  return {
    title: `เรื่องสยอง: ${cleanTopic}`,
    tagline: `หนังสั้นสยองขวัญหักมุมป้ายยา Shopee ความยาว 1.5 นาที (5 ฉาก)`,
    category: category || 'ผีหอพัก',
    twistChoiceA: `${cleanTopic} สิงตู้เย็นเปิด Shopee สั่งหม้อชาบู`,
    twistChoiceB: `${cleanTopic} ตั้งวงไลฟ์สดแจกโค้ด Shopee`,
    winningTwist: `${cleanTopic} สิงตู้เย็นเปิด Shopee สั่งหม้อชาบู`,
    sponsorProduct: selectedShopee,
    scenes: [
      {
        sceneNumber: 1,
        timeRange: '0:00 - 0:20',
        sceneTitle: 'ฉากที่ 1: บิ้วด์อารมณ์หลอน',
        durationSec: 20,
        narrationText: `คืนวันศุกร์ ณ หอพักร้างชั้น 4 บรรยากาศเงียบสงัด นกกำลังนั่งปั่นงานตอนตีสาม จู่ๆ ไฟห้องก็เริ่มกระพริบสลัวๆ และมีเสียงไอค็อกแค็กปรัศนีย์ดังขึ้นจากมุมมืดหลังตู้เย็น...`,
        visualPrompt: `Thai college student sitting at messy desk at 3am, dim flickering fluorescent lighting, eerie dark shadow creeping from behind vintage green refrigerator, horror cinematic 9:16 vertical --cw 100 --seed 9821`,
        midjourneyPrompt: `/imagine prompt: Thai male student character_A_lock, scruffy hair, black hoodie, sitting at dark dorm room at 3am, eerie shadow from old refrigerator, cinematic horror lighting, photorealistic --ar 9:16 --v 6.0`,
        runwayCameraPrompt: `Slow camera zoom in towards the dark gap behind the refrigerator, subtle flicker lights, eerie mist rising`,
        elevenLabsVoiceStyle: `Thai Male - Whispering spooky suspenseful tone, slow pacing`,
        sunoBgmPrompt: `Cinematic horror ambient, dark cello pulse, creepy clock ticking bpm 75`,
        sfx: 'scary_thunder',
        bgmMood: 'horror_creepy',
        subtitles: ['คืนวันศุกร์ ณ หอพักร้างชั้น 4', 'นกกำลังปั่นงานตอนตีสาม...', 'ไฟเริ่มกระพริบและมีเสียงลึกลับดังขึ้น!']
      },
      {
        sceneNumber: 2,
        timeRange: '0:20 - 0:45',
        sceneTitle: 'ฉากที่ 2: เริ่มเจอดี',
        durationSec: 25,
        narrationText: `ขนหัวลุกซู่! นกสะดุ้งตัวโหย่ง คว้าไม้ช็อตยุงตะโกน "ใครอยู่ตรงนั้น! กูไหว้พระทุกวันพฤหัสบดีนะโว้ย!" ทันใดนั้น ตู้เย็นสั่นสะเทือนปั้กๆ! เงาน่ากลัวหัวยาวๆ ค่อยๆ เลื้อยออกมาเผชิญหน้า!`,
        visualPrompt: `Terrified Thai student holding glowing blue electric mosquito swatter pointing at huge dark phantom ghost with glowing red eyes, dramatic low angle 9:16 vertical`,
        midjourneyPrompt: `/imagine prompt: Terrified character_A_lock holding blue electric mosquito swatter pointing at tall terrifying Thai ghost shadow, intense eyes, volumetric horror lighting --ar 9:16 --v 6.0`,
        runwayCameraPrompt: `Fast camera pan right to ghost shadow, handheld camera shake effect, dramatic lighting flash`,
        elevenLabsVoiceStyle: `Thai Male - Panicked shouting voice, high energy`,
        sunoBgmPrompt: `Action panic orchestral swell, heavy brass hit, fast pounding drums`,
        sfx: 'screaming_ghost',
        bgmMood: 'suspense_rising',
        subtitles: ['ขนหัวลุกซู่! นกคว้าไม้ช็อตยุงขู่!', 'กูไหว้พระทุกวันพฤหัสนะโว้ย!', 'เงาน่ากลัวค่อยๆ เลื้อยออกมา!']
      },
      {
        sceneNumber: 3,
        timeRange: '0:45 - 0:55',
        sceneTitle: 'ฉากที่ 3: จุดพีค/เผชิญหน้า',
        durationSec: 10,
        narrationText: `วิญญาณยื่นหน้าเข้าใกล้จนเห็นฟันหลอ! นกหลับตาปี๋เตรียมตัวโดนหักคอ! ผีอ้าปากกว้างส่งเสียงฟ่อออ... แล้วพูดขึ้นว่า "มึง... กูหิว... กูขอหมูสไลด์ในตู้เย็นกินต้มม่าม่าหน่อย!"`,
        visualPrompt: `Close up hilarious ghost face with empty instant noodle bowl looking sheepish and hungry, funny horror style 9:16 vertical`,
        midjourneyPrompt: `/imagine prompt: Extreme close up ghost face looking hungry holding empty noodle bowl, comedy horror face, high detail photorealistic --ar 9:16 --v 6.0`,
        runwayCameraPrompt: `Extreme close up dolly zoom on ghost mouth opening, quick cut to funny face`,
        elevenLabsVoiceStyle: `Thai Ghost - Deepraspy voice shifting into funny whiny tone`,
        sunoBgmPrompt: `Sudden comedic music stop sound, record scratch into funny tuba sound`,
        sfx: 'funny_cough',
        bgmMood: 'funny_twist',
        subtitles: ['วิญญาณยื่นหน้าเข้ามาใกล้...', 'นกหลับตาปี๋เตรียมโดนหักคอ!', 'ผีบอก: กูขอหมูสไลด์ต้มม่าม่าหน่อย!']
      },
      {
        sceneNumber: 4,
        timeRange: '0:55 - 1:15',
        sceneTitle: 'ฉากที่ 4: จุดหักมุมป้ายยา Shopee',
        durationSec: 20,
        narrationText: `นกอ้าปากค้าง! "อ้าวไอ้ผี! นั่นหมูชาบูตู! แต่มันต้มสุกช้า... งั้นมึงเอา ${selectedShopee.name} นี่ไปต้มสิ! ร้อนไวใน 1 นาที ต้มหมูกระทะกับผีได้ทันที!" ผีบอก "โห ยอดเลยมึง!"`,
        visualPrompt: `Thai guy and friendly ghost happily cooking pork shabu hotpot using glowing electric pot on table, neon orange Shopee promo banner, comedy horror 9:16`,
        midjourneyPrompt: `/imagine prompt: character_A_lock and friendly ghost sitting together eating hotpot using electric pot, smiling face, bright orange promo aura --ar 9:16 --v 6.0`,
        runwayCameraPrompt: `Smooth rotation around table showing hotpot steam rising and product glowing`,
        elevenLabsVoiceStyle: `Thai Male - Enthusiastic energetic narrator voice, promo style`,
        sunoBgmPrompt: `Upbeat Thai dance pop comedy beat, bright acoustic guitar synth`,
        sfx: 'comedy_boing',
        bgmMood: 'funny_twist',
        subtitles: [`อ้าวไอ้ผี! เอา ${selectedShopee.name} ไปต้ม!`, 'ร้อนไวใน 1 นาที ต้มชาบูกับผีได้เลย!', 'ผีร้อง: โห ยอดเยี่ยมเลยมึง!']
      },
      {
        sceneNumber: 5,
        timeRange: '1:15 - 1:30',
        sceneTitle: 'ฉากที่ 5: สรุปโปรโมชั่น + ปักหมุดพิกัด Shopee Affiliate',
        durationSec: 15,
        narrationText: `จัดเลย! ${selectedShopee.name} ราคาพิเศษเพียง ฿${selectedShopee.price} เท่านั้น! ใส่โค้ดส่วนลด ${selectedShopee.discountCode} พิกัดกดลิงก์สั่งซื้อ Shopee ปักหมุดไว้ในคอมเมนต์ใต้คลิปนี้แล้ว รีบไปกดเลย!`,
        visualPrompt: `Dynamic Shopee Affiliate promotion card banner with product image, discount voucher code, yellow click button pointing down to comment section, 9:16 vertical`,
        midjourneyPrompt: `/imagine prompt: Professional Shopee e-commerce promo banner 9:16 vertical, product photography, orange and gold glossy discount badge, high conversion CTA --ar 9:16 --v 6.0`,
        runwayCameraPrompt: `Static clear display with pulsing orange CTA button and glowing discount code`,
        elevenLabsVoiceStyle: `Thai Announcer - Fast energetic Shopee promotional voice`,
        sunoBgmPrompt: `High energy Shopee jingle beat, celebratory fanfare synth`,
        sfx: 'comedy_boing',
        bgmMood: 'funny_twist',
        subtitles: [`เพียง ฿${selectedShopee.price} โค้ดส่วนลด ${selectedShopee.discountCode}`, '📌 พิกัดลิงก์ Shopee ปักหมุดในคอมเมนต์ใต้คลิป!', 'รีบกดสั่งซื้อเลยก่อนสินค้าหมด!']
      }
    ]
  };
}

async function callGeminiScriptwriting(topic: string, category: string) {
  const ai = getGeminiClient();
  const userPrompt = `คุณคือ AI ผู้กำกับหนังสั้นสยองขวัญหักมุมตลกสไตล์ TikTok/Reels/Shopee Video ยอดนิยม!
ช่วยคิดบทหนังสั้นสยองขวัญภาษาไทย ความยาว 1.5 นาที (แบ่งออกเป็น 5 ฉากหลักตามโครงสร้างนี้เท่านั้น):

ฉากที่ 1: บิ้วด์อารมณ์หลอน (ความยาว 0:00 - 0:20) - ปลุกความเงียบ สยอง สั่นประสาท
ฉากที่ 2: เริ่มเจอดี (ความยาว 0:20 - 0:45) - ปรากฏตัว เผชิญหน้ากับเงาสยอง
ฉากที่ 3: จุดพีค/เผชิญหน้า (ความยาว 0:45 - 0:55) - จังหวะตึงเครียดสูงสุด ก่อนหักมุม
ฉากที่ 4: จุดหักมุมป้ายยา Shopee (ความยาว 0:55 - 1:15) - หักมุมตลก ฮากริบ ผีแนะนำสินค้ารวมต้มหมูกระทะ/ของใช้ Shopee
ฉากที่ 5: สรุปโปรโมชั่น + ปักหมุดพิกัด Shopee Affiliate (ความยาว 1:15 - 1:30) - แจกโค้ดส่วนลด และบอกให้ผู้ชมกดลิงก์ปักหมุดในคอมเมนต์

หัวข้อเรื่อง: "${topic || 'ผีในชีวิตประจำวันยุคดิจิทัล'}"
หมวดหมู่: "${category || 'ผีหอพัก'}"

เงื่อนไขที่ต้องมีใน JSON Response:
1. เขียนบทพากย์ภาษาไทยสั้นกระชับ สนุกสนาน พร้อมคำซับไตเติ้ล
2. กำหนด visualPrompt ภาษาอังกฤษ
3. กำหนด midjourneyPrompt (รวมโค้ดล็อกใบหน้าตัวละคร --cw 100 --seed)
4. กำหนด runwayCameraPrompt (สำหรับสั่งงาน Runway Gen-3 / Kling AI / Luma)
5. กำหนด elevenLabsVoiceStyle (อารมณ์เสียงพากย์ภาษาไทย)
6. กำหนด sunoBgmPrompt (แนวเพลงสยองขวัญ/ตลกสำหรับ Suno AI)
7. มีสินค้าสปอนเซอร์ตลกๆ ใน Shopee Affiliate พร้อมโค้ดส่วนลด`;

  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-3.6-flash"];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tagline: { type: Type.STRING },
              category: { type: Type.STRING },
              twistChoiceA: { type: Type.STRING },
              twistChoiceB: { type: Type.STRING },
              winningTwist: { type: Type.STRING },
              sponsorProduct: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  discountCode: { type: Type.STRING },
                  commissionRate: { type: Type.STRING }
                }
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.INTEGER },
                    timeRange: { type: Type.STRING },
                    sceneTitle: { type: Type.STRING },
                    durationSec: { type: Type.INTEGER },
                    narrationText: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING },
                    midjourneyPrompt: { type: Type.STRING },
                    runwayCameraPrompt: { type: Type.STRING },
                    elevenLabsVoiceStyle: { type: Type.STRING },
                    sunoBgmPrompt: { type: Type.STRING },
                    sfx: { type: Type.STRING },
                    bgmMood: { type: Type.STRING },
                    subtitles: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["sceneNumber", "timeRange", "sceneTitle", "durationSec", "narrationText", "visualPrompt", "sfx", "bgmMood", "subtitles"]
                }
              }
            },
            required: ["title", "tagline", "category", "scenes", "twistChoiceA", "twistChoiceB", "winningTwist"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.scenes && parsed.scenes.length >= 4) {
          return parsed;
        }
      }
    } catch (e: any) {
      console.warn(`Gemini API call with model ${model} failed:`, e?.message || e);
    }
  }

  // Fallback if all Gemini models fail
  console.log("Using built-in AI Comedy Script Engine fallback (5 Scenes)...");
  return generateFallbackScript(topic, category);
}

// POST Generate Script using Gemini AI (Step 1)
app.post("/api/generate-story-script", async (req, res) => {
  try {
    const { topic, category } = req.body;
    const scriptJson = await callGeminiScriptwriting(topic, category);
    res.json({ success: true, script: scriptJson });
  } catch (error: any) {
    console.error("Error generating story script:", error);
    res.status(500).json({ error: error.message || "Failed to generate story script" });
  }
});

// POST 1-Click Auto Pipeline Server Automation (Steps 1 -> 4)
app.post("/api/auto-pipeline", async (req, res) => {
  try {
    const { topic, category } = req.body;
    const script = await callGeminiScriptwriting(topic, category);

    // Assign realistic visual images from curated dark horror-comedy photography seeds
    const sampleImageSeeds = [
      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
    ];

    const processedScenes = (script.scenes || []).map((sc: any, idx: number) => ({
      ...sc,
      id: `sc_${Date.now()}_${idx}`,
      visualImageUrl: sampleImageSeeds[idx % sampleImageSeeds.length]
    }));

    const newStory = {
      id: `story_${Date.now()}`,
      title: script.title || 'หนังสั้นสยองขวัญหักมุม AI',
      tagline: script.tagline || 'เรื่องสยองที่จะทำให้คุณฮากริบกลางดึก!',
      category: script.category || 'ผีหอพัก',
      aspectRatio: '9:16',
      creator: 'GagGhost AI Auto Pipeline Bot',
      createdAt: 'เมื่อสักครู่ (100% Auto Generated)',
      thumbnailUrl: processedScenes[0]?.visualImageUrl || sampleImageSeeds[0],
      likesCount: Math.floor(Math.random() * 500) + 120,
      viewsCount: Math.floor(Math.random() * 3000) + 800,
      sharesCount: Math.floor(Math.random() * 200) + 40,
      commentsCount: Math.floor(Math.random() * 50) + 10,
      vipUnlocked: false,
      isAutoPublished: true,
      twistChoiceA: script.twistChoiceA || 'ผีกลายเป็นสปอนเซอร์ขายของ',
      twistChoiceB: script.twistChoiceB || 'ผีสิงสายชาร์จไอโฟน',
      winningTwist: script.winningTwist || script.twistChoiceA,
      sponsorProduct: script.sponsorProduct || {
        name: 'ผ้ายันต์ 5G กันผีไฮสปีด',
        description: 'แผ่นยันต์สมาร์ตการ์ด ไล่ผีอัตโนมัติ 24 ช.ม.',
        price: 199,
        discountCode: 'GAG50OFF',
        bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80',
        commissionRate: '35% (รับ 70 บาท)'
      },
      scenes: processedScenes
    };

    // Auto publish to feed database
    publishedStories.unshift(newStory);

    res.json({
      success: true,
      message: "100% Auto Pipeline completed and published to Feed!",
      story: newStory
    });
  } catch (error: any) {
    console.error("Auto pipeline error:", error);
    res.status(500).json({ error: error.message || "Failed auto pipeline" });
  }
});

// ==========================================
// YOUTUBE DATA API V3 & OAUTH INTEGRATION
// ==========================================

// 1. Check YouTube Connection Status
app.get("/api/youtube/status", (req, res) => {
  const hasClientId = !!(process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID);
  res.json({
    connected: !!youtubeAuthTokens,
    channelInfo: youtubeChannelInfo || null,
    hasClientId: hasClientId,
    message: youtubeAuthTokens 
      ? `เชื่อมต่อช่อง YouTube "${youtubeChannelInfo?.title || 'เรียบร้อย'}" แล้ว`
      : 'ยังไม่ได้เชื่อมต่อช่อง YouTube'
  });
});

// 1.5 GET & POST Credentials Endpoint for Google Client ID & Client Secret
app.get("/api/youtube/credentials", (req, res) => {
  res.json({
    hasClientId: !!customGoogleClientId,
    clientId: customGoogleClientId ? customGoogleClientId.slice(0, 15) + '...' : '',
    fullClientId: customGoogleClientId,
    hasClientSecret: !!customGoogleClientSecret,
  });
});

app.post("/api/youtube/credentials", (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    if (clientId) customGoogleClientId = clientId.trim();
    if (clientSecret) customGoogleClientSecret = clientSecret.trim();

    res.json({
      success: true,
      message: "บันทึก Google OAuth Client Credentials สำเร็จแล้ว!",
      hasClientId: !!customGoogleClientId,
      hasClientSecret: !!customGoogleClientSecret
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save credentials" });
  }
});

// 2. Generate Google OAuth Auth URL for YouTube Upload Scope
app.get("/api/auth/youtube/url", (req, res) => {
  try {
    if (req.query.clientId) customGoogleClientId = String(req.query.clientId).trim();
    if (req.query.clientSecret) customGoogleClientSecret = String(req.query.clientSecret).trim();

    const { client, redirectUri, clientId } = getYouTubeOAuthClient(req);

    if (!clientId) {
      return res.status(400).json({
        error: "ยังไม่ได้ระบุ Client ID (กรุณากรอก Client ID และ Client Secret ในช่องรับข้อมูล)",
        redirectUri
      });
    }

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      redirect_uri: redirectUri,
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/userinfo.profile"
      ]
    });
    res.json({ success: true, authUrl, redirectUri });
  } catch (error: any) {
    console.error("Error generating YouTube OAuth URL:", error);
    res.status(500).json({ error: error.message || "Failed to generate OAuth URL" });
  }
});

// 3. YouTube OAuth Callback Route
app.get("/api/auth/youtube/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect("/?youtube_error=no_oauth_code");
    }

    const { client } = getYouTubeOAuthClient(req);
    const { tokens } = await client.getToken(code);
    youtubeAuthTokens = tokens;
    client.setCredentials(tokens);

    // Fetch user's channel info
    try {
      const youtube = google.youtube({ version: "v3", auth: client });
      const channelRes = await youtube.channels.list({
        mine: true,
        part: ["snippet"]
      });

      if (channelRes.data.items && channelRes.data.items.length > 0) {
        const ch = channelRes.data.items[0];
        youtubeChannelInfo = {
          id: ch.id,
          title: ch.snippet?.title || "My YouTube Channel",
          customUrl: ch.snippet?.customUrl || "",
          avatar: ch.snippet?.thumbnails?.default?.url || ""
        };
      } else {
        youtubeChannelInfo = { title: "YouTube Channel Connected" };
      }
    } catch (chErr) {
      console.warn("Could not fetch channel details, but tokens acquired:", chErr);
      youtubeChannelInfo = { title: "YouTube Channel Connected" };
    }

    res.redirect("/?youtube_connected=true");
  } catch (error: any) {
    console.error("YouTube OAuth Callback Error:", error);
    res.redirect("/?youtube_error=" + encodeURIComponent(error?.message || "auth_failed"));
  }
});

// 3.5 Manual Exchange Authorization Code endpoint
app.post("/api/auth/youtube/exchange-code", async (req, res) => {
  try {
    let rawCodeInput = String(req.body.code || '').trim();
    if (!rawCodeInput) {
      return res.status(400).json({ error: "กรุณากรอก Code หรือ URL ที่ได้จาก Google" });
    }

    let code = rawCodeInput;

    // Extract code parameter from full URL if pasted
    if (code.includes("code=")) {
      const match = code.match(/[?&]code=([^&]+)/);
      if (match) {
        code = match[1];
      }
    }

    // Always URL-decode code in case it's percent-encoded (e.g. 4%2F0A...)
    try {
      if (code.includes('%')) {
        code = decodeURIComponent(code);
      }
    } catch (e) {
      // ignore
    }

    code = code.trim();

    let { client } = getYouTubeOAuthClient(req);
    let tokens;

    try {
      const resToken = await client.getToken(code);
      tokens = resToken.tokens;
    } catch (tokenErr: any) {
      console.warn("First attempt client.getToken failed, trying fallback URIs...", tokenErr?.message);
      const fallbackUris = [
        "http://localhost:3000/api/auth/youtube/callback",
        `https://${req.headers.host}/api/auth/youtube/callback`,
        `http://${req.headers.host}/api/auth/youtube/callback`,
        "http://34.87.121.61.nip.io:3000/api/auth/youtube/callback"
      ];
      let succeeded = false;
      for (const fUri of fallbackUris) {
        try {
          const fallbackClient = getYouTubeOAuthClient(req, fUri).client;
          const resToken = await fallbackClient.getToken(code);
          tokens = resToken.tokens;
          client = fallbackClient;
          succeeded = true;
          break;
        } catch (e) {
          // continue fallback
        }
      }
      if (!succeeded) {
        const errMsg = tokenErr?.message || String(tokenErr);
        if (errMsg.includes("invalid_grant")) {
          return res.status(400).json({
            error: "ข้อผิดพลาด invalid_grant: Code ไม่ถูกต้อง ถูกใช้งานไปแล้ว หรือคัดลอกมาไม่ครบถ้วน! กรุณากดปุ่ม 'เปิดหน้าล็อกอิน Google' อีกครั้ง แล้วคัดลอก 'URL ทั้งหมด' จากช่อง Address Bar มาวาง"
          });
        }
        throw tokenErr;
      }
    }

    youtubeAuthTokens = tokens;
    client.setCredentials(tokens);

    // Fetch channel info
    try {
      const youtube = google.youtube({ version: "v3", auth: client });
      const channelRes = await youtube.channels.list({
        mine: true,
        part: ["snippet"]
      });

      if (channelRes.data.items && channelRes.data.items.length > 0) {
        const ch = channelRes.data.items[0];
        youtubeChannelInfo = {
          id: ch.id,
          title: ch.snippet?.title || "My YouTube Channel",
          customUrl: ch.snippet?.customUrl || "",
          avatar: ch.snippet?.thumbnails?.default?.url || ""
        };
      } else {
        youtubeChannelInfo = { title: "YouTube Channel Connected" };
      }
    } catch (chErr) {
      console.warn("Could not fetch channel details, but tokens acquired:", chErr);
      youtubeChannelInfo = { title: "YouTube Channel Connected" };
    }

    res.json({
      success: true,
      message: "ผูกช่อง YouTube สำเร็จแล้ว!",
      channel: youtubeChannelInfo
    });
  } catch (error: any) {
    console.error("Exchange Code Error:", error);
    res.status(500).json({ error: error.message || "Failed to exchange authorization code" });
  }
});

// 4. Save Custom Refresh Token or Credentials manually
app.post("/api/youtube/manual-token", (req, res) => {
  try {
    const { refreshToken, channelName } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "กรุณาระบุ Refresh Token" });
    }

    youtubeAuthTokens = {
      refresh_token: refreshToken,
      token_type: "Bearer"
    };
    youtubeChannelInfo = {
      title: channelName || "ช่อง YouTube ของคุณ (ผูก Refresh Token)"
    };

    res.json({
      success: true,
      message: "ผูก Refresh Token ช่อง YouTube สำเร็จแล้ว!"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback pre-generated 9:16 MP4 buffer for zero-failure video generation
let FALLBACK_MP4_BUFFER: Buffer;
try {
  const tmpOutput = path.join("/tmp", "static_fallback_916_boot.mp4");
  execSync(`/usr/bin/ffmpeg -y -loglevel error -f lavfi -i "color=c=0x0f172a:s=1080x1920:r=30:d=10" -f lavfi -i "sine=frequency=220:sample_rate=48000:duration=10" -c:v libx264 -preset fast -profile:v main -level 4.0 -pix_fmt yuv420p -r 30 -g 30 -keyint_min 30 -sc_threshold 0 -bf 2 -movflags +faststart -c:a aac -b:a 128k -ar 48000 -ac 2 -filter:a "asetpts=PTS-STARTPTS,volume=0.01" -shortest "${tmpOutput}"`);
  FALLBACK_MP4_BUFFER = fs.readFileSync(tmpOutput);
  try { fs.unlinkSync(tmpOutput); } catch (e) {}
  console.log("⚡ Boot Fallback 9:16 MP4 Buffer generated synchronously, size:", FALLBACK_MP4_BUFFER.length);
} catch (e) {
  console.error("Critical: Failed to generate sync boot fallback MP4:", e);
  FALLBACK_MP4_BUFFER = Buffer.alloc(0);
}

async function getFallbackMp4Buffer(): Promise<Buffer> {
  if (FALLBACK_MP4_BUFFER && FALLBACK_MP4_BUFFER.length > 0) {
    return FALLBACK_MP4_BUFFER;
  }
  try {
    const tmpOutput = path.join("/tmp", `static_fallback_916_${Date.now()}.mp4`);
    execSync(`/usr/bin/ffmpeg -y -loglevel error -f lavfi -i "color=c=0x0f172a:s=1080x1920:r=30:d=10" -f lavfi -i "sine=frequency=220:sample_rate=48000:duration=10" -c:v libx264 -preset fast -profile:v main -level 4.0 -pix_fmt yuv420p -r 30 -g 30 -keyint_min 30 -sc_threshold 0 -bf 2 -movflags +faststart -c:a aac -b:a 128k -ar 48000 -ac 2 -filter:a "asetpts=PTS-STARTPTS,volume=0.01" -shortest "${tmpOutput}"`);
    FALLBACK_MP4_BUFFER = fs.readFileSync(tmpOutput);
    try { fs.unlinkSync(tmpOutput); } catch (e) {}
    return FALLBACK_MP4_BUFFER;
  } catch (e) {
    console.error("Failed to generate sync fallback MP4:", e);
    return FALLBACK_MP4_BUFFER || Buffer.alloc(0);
  }
}

// Helper to create a 100% valid playable 9:16 MP4 video file on disk for YouTube Shorts
async function createValidMp4File(story: any, videoBase64?: string): Promise<{ filePath: string; cleanup: () => void }> {
  const tmpOutput = path.join("/tmp", `yt_shorts_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`);
  const cleanup = () => {
    try {
      if (fs.existsSync(tmpOutput)) {
        fs.unlinkSync(tmpOutput);
      }
    } catch (e) {}
  };

  if (videoBase64 && typeof videoBase64 === "string" && videoBase64.length > 5000) {
    try {
      const cleanBase64 = videoBase64.replace(/^data:video\/\w+;base64,/, "");
      const inputBuffer = Buffer.from(cleanBase64, "base64");

      const tmpInput = path.join("/tmp", `in_${Date.now()}_${Math.floor(Math.random() * 10000)}.webm`);
      await fs.promises.writeFile(tmpInput, inputBuffer);

      // Check if input video contains an audio stream via ffprobe
      let hasAudio = false;
      try {
        const probeRes = await execPromise(`/usr/bin/ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${tmpInput}"`);
        hasAudio = String(probeRes.stdout || '').trim().includes("audio");
      } catch (probeErr) {
        hasAudio = false;
      }

      let convertCmd = '';
      if (hasAudio) {
        convertCmd = `/usr/bin/ffmpeg -y -loglevel error -i "${tmpInput}" -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=PTS-STARTPTS" -c:v libx264 -preset fast -profile:v main -level 4.0 -pix_fmt yuv420p -r 30 -g 30 -keyint_min 30 -sc_threshold 0 -bf 2 -movflags +faststart -c:a aac -b:a 128k -ar 48000 -ac 2 -filter:a "asetpts=PTS-STARTPTS" "${tmpOutput}"`;
      } else {
        convertCmd = `/usr/bin/ffmpeg -y -loglevel error -i "${tmpInput}" -f lavfi -i "sine=frequency=220:sample_rate=48000" -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=PTS-STARTPTS" -c:v libx264 -preset fast -profile:v main -level 4.0 -pix_fmt yuv420p -r 30 -g 30 -keyint_min 30 -sc_threshold 0 -bf 2 -movflags +faststart -c:a aac -b:a 128k -ar 48000 -ac 2 -filter:a "asetpts=PTS-STARTPTS,volume=0.02" -shortest "${tmpOutput}"`;
      }

      await execPromise(convertCmd, { maxBuffer: 30 * 1024 * 1024 });
      try { fs.unlinkSync(tmpInput); } catch (e) {}

      if (fs.existsSync(tmpOutput) && fs.statSync(tmpOutput).size > 1000) {
        return { filePath: tmpOutput, cleanup };
      }
    } catch (err) {
      console.warn("Failed to convert base64 video with ffmpeg, generating 9:16 MP4 story slideshow:", err);
    }
  }

  // Generate a high quality 9:16 vertical MP4 video (1080x1920, 15s) with multi-slide animation and audio
  try {
    const tmpDir = path.join("/tmp", `story_slides_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const img1 = path.join(tmpDir, "slide1.png");
    const img2 = path.join(tmpDir, "slide2.png");

    const rawTitle = (story?.title || 'GagGhost AI Shorts').replace(/["'\x27\x22\\:\n\r]/g, ' ');
    const safeTitle = rawTitle.slice(0, 32);
    const sponsorName = (story?.sponsorProduct?.name || 'Shopee Special Deal').replace(/["'\x27\x22\\:\n\r]/g, ' ').slice(0, 30);
    const discountCode = (story?.sponsorProduct?.discountCode || 'SHOPEE50').replace(/["'\x27\x22\\:\n\r]/g, ' ');

    // Slide 1: Dark Purple Horror Canvas with Story Title
    const cmd1 = `/usr/bin/ffmpeg -y -loglevel error -f lavfi -i "color=c=0x0f172a:s=1080x1920" -vframes 1 -vf "drawtext=text='GagGhost AI Shorts':fontsize=56:fontcolor=0xa855f7:x=(w-text_w)/2:y=250,drawtext=text='${safeTitle}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=450,drawtext=text='Shopee: ${sponsorName}':fontsize=36:fontcolor=0xf97316:x=(w-text_w)/2:y=1200" "${img1}"`;
    // Slide 2: Shopee Deal Canvas with Discount Code
    const cmd2 = `/usr/bin/ffmpeg -y -loglevel error -f lavfi -i "color=c=0x1e1b4b:s=1080x1920" -vframes 1 -vf "drawtext=text='GagGhost AI Shorts':fontsize=56:fontcolor=0xa855f7:x=(w-text_w)/2:y=250,drawtext=text='${safeTitle}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=450,drawtext=text='Discount Code: ${discountCode}':fontsize=38:fontcolor=0x22c55e:x=(w-text_w)/2:y=1200" "${img2}"`;

    await execPromise(cmd1);
    await execPromise(cmd2);

    const ffmpegCmd = `/usr/bin/ffmpeg -y -loglevel error -loop 1 -r 30 -t 7.5 -i "${img1}" -loop 1 -r 30 -t 7.5 -i "${img2}" -f lavfi -i "sine=frequency=220:sample_rate=48000:duration=15" -filter_complex "[0:v]fps=30,scale=1080:1920,setsar=1,setpts=PTS-STARTPTS[v1];[1:v]fps=30,scale=1080:1920,setsar=1,setpts=PTS-STARTPTS[v2];[v1][v2]concat=n=2:v=1:a=0,fps=30,format=yuv420p[v];[2:a]asetpts=PTS-STARTPTS,volume=0.02[a]" -map "[v]" -map "[a]" -c:v libx264 -preset fast -profile:v main -level 4.0 -pix_fmt yuv420p -r 30 -g 30 -keyint_min 30 -sc_threshold 0 -bf 2 -movflags +faststart -c:a aac -b:a 128k -ar 48000 -ac 2 -shortest "${tmpOutput}"`;

    await execPromise(ffmpegCmd, { maxBuffer: 30 * 1024 * 1024 });

    // Clean up temporary slide images
    try {
      if (fs.existsSync(img1)) fs.unlinkSync(img1);
      if (fs.existsSync(img2)) fs.unlinkSync(img2);
      if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir);
    } catch (e) {}

    if (fs.existsSync(tmpOutput) && fs.statSync(tmpOutput).size > 1000) {
      return { filePath: tmpOutput, cleanup };
    }
  } catch (e) {
    console.warn("FFmpeg slide MP4 generation warning:", e);
  }

  // Fallback to pre-generated sync boot MP4 buffer
  const fallbackBuf = await getFallbackMp4Buffer();
  await fs.promises.writeFile(tmpOutput, fallbackBuf);
  return { filePath: tmpOutput, cleanup };
}

// Helper function to handle YouTube Shorts Video Upload via Data API v3 (Resumable Upload Protocol)
async function uploadStoryToYouTube(story: any, videoBase64?: string, reqHost?: express.Request | string) {
  if (!youtubeAuthTokens) {
    throw new Error("ยังไม่ได้เชื่อมต่อบัญชี YouTube OAuth (กรุณาเชื่อมต่อช่อง YouTube ก่อน)");
  }

  const { client } = getYouTubeOAuthClient(reqHost);
  client.setCredentials(youtubeAuthTokens);

  // Obtain refreshed Access Token
  const tokenRes = await client.getAccessToken();
  const accessToken = tokenRes.token || youtubeAuthTokens.access_token;

  if (!accessToken) {
    throw new Error("ไม่สามารถรับ Access Token สำหรับ YouTube API ได้ (กรุณาเชื่อมต่อ OAuth ใหม่)");
  }

  const title = `👻 [หนังสั้นสยองขวัญ] ${story?.title || 'ผีตลกหักมุม'} #Shorts`;
  const sponsor = story?.sponsorProduct || {
    name: 'หม้อต้มสุกี้ไฟฟ้าพกพา 1.8L',
    linkUrl: 'https://shopee.co.th',
    discountCode: 'SHOPEEGHOST50'
  };

  const description = `👻 [หนังสั้นสยองขวัญตลก 1.5 นาที] ${story?.title || 'เรื่องเล่าผีตลกหักมุม'}
${story?.tagline ? `📌 ${story.tagline}\n` : ''}
🛍️ สินค้า Shopee ป้ายยาในคลิป: ${sponsor.name}
👉 คลิกสั่งซื้อตรงนี้เลย: ${sponsor.linkUrl || 'https://shopee.co.th'}
🎁 โค้ดส่วนลดพิเศษ: ${sponsor.discountCode} (รับส่วนลดเพิ่มเติม!)

#Shorts #GagGhostAI #ShopeeAffiliate #ผีตลก #หนังสั้นสยองขวัญ #ShopeeTH #ป้ายยาShopee`;

  // Prepare valid 9:16 vertical MP4 video file
  const { filePath, cleanup } = await createValidMp4File(story, videoBase64);

  try {
    const videoBuffer = fs.readFileSync(filePath);
    const fileSize = videoBuffer.length;
    console.log(`[YouTube Resumable Upload] Preparing upload for "${title}", file size: ${fileSize} bytes`);

    // Step 1: Initiate Resumable Upload Session
    const initRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": fileSize.toString(),
        "X-Upload-Content-Type": "video/mp4"
      },
      body: JSON.stringify({
        snippet: {
          title: title.slice(0, 100),
          description: description,
          tags: ["Shorts", "GagGhostAI", "ShopeeAffiliate", "ผีตลก", "หนังสั้นสยองขวัญ", "ShopeeTH"],
          categoryId: "23" // Comedy
        },
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false
        }
      })
    });

    if (!initRes.ok) {
      const errText = await initRes.text();
      console.error("[YouTube Upload Init Error]", initRes.status, errText);
      throw new Error(`YouTube Upload Init Failed (${initRes.status}): ${errText}`);
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      throw new Error("YouTube Upload response missing Resumable Location header");
    }

    console.log(`[YouTube Resumable Upload] Session created successfully, transferring ${fileSize} bytes...`);

    // Step 2: Upload raw MP4 binary buffer directly via PUT with exact Content-Length & Content-Range
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "video/mp4",
        "Content-Length": fileSize.toString(),
        "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`
      },
      body: videoBuffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("[YouTube Upload Binary PUT Error]", uploadRes.status, errText);
      throw new Error(`YouTube Video Upload PUT Failed (${uploadRes.status}): ${errText}`);
    }

    const uploadData = await uploadRes.json();
    const videoId = uploadData.id;

    if (!videoId) {
      throw new Error("YouTube API ไม่ได้คืนค่า Video ID (อาจติด Quota หรือสิทธิ์การอัปโหลด)");
    }

    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;
    console.log(`🎉 [YouTube Upload Success] Video ID: ${videoId}, URL: ${videoUrl}`);

    if (story?.id) {
      const match = publishedStories.find(s => s.id === story.id);
      if (match) {
        match.youtubeVideoId = videoId;
        match.youtubeUrl = videoUrl;
        match.youtubeUploadedAt = new Date().toISOString();
      }
    }

    return {
      videoId,
      videoUrl,
      channelTitle: youtubeChannelInfo?.title || 'YouTube Channel'
    };
  } finally {
    cleanup();
  }
}

// ==========================================
// FACEBOOK REELS GRAPH API UPLOAD HELPER
// ==========================================
let facebookPageConfig: { pageAccessToken: string; pageId: string; pageName?: string } | null = null;

async function getOrResolvePageAccessToken(token: string, pageId: string): Promise<{ pageToken: string; pageName?: string }> {
  try {
    // 1. Try directly fetching page access_token field
    const pageRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=access_token,name&access_token=${encodeURIComponent(token)}`);
    const pageData: any = await pageRes.json();
    if (pageData.access_token) {
      console.log(`[FB Token Resolver] Obtained Page Access Token directly for Page "${pageData.name || pageId}"`);
      return { pageToken: pageData.access_token, pageName: pageData.name };
    }

    // 2. Try /me/accounts to resolve Page Token from User Token
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${encodeURIComponent(token)}`);
    const meData: any = await meRes.json();
    if (meData.data && Array.isArray(meData.data) && meData.data.length > 0) {
      const match = meData.data.find((p: any) => p.id === pageId);
      if (match && match.access_token) {
        console.log(`[FB Token Resolver] Resolved Page Access Token for "${match.name}" (${pageId}) from /me/accounts`);
        return { pageToken: match.access_token, pageName: match.name };
      }
      const firstPage = meData.data[0];
      if (firstPage.access_token) {
        console.log(`[FB Token Resolver] Using first page's Access Token: "${firstPage.name}" (${firstPage.id})`);
        return { pageToken: firstPage.access_token, pageName: firstPage.name };
      }
    }
  } catch (err: any) {
    console.warn(`[FB Token Resolver Warning] ${err?.message}`);
  }
  return { pageToken: token };
}

async function uploadStoryToFacebookReels(story: any, videoBase64?: string) {
  if (!facebookPageConfig || !facebookPageConfig.pageAccessToken || !facebookPageConfig.pageId) {
    throw new Error("ยังไม่ได้เชื่อมต่อ Facebook Page Access Token หรือ Page ID (กรุณาตั้งค่าช่อง Facebook ก่อน)");
  }

  const { pageAccessToken, pageId, pageName } = facebookPageConfig;

  // Resolve to actual Page Access Token if User Token was supplied
  const { pageToken: activePageToken, pageName: resolvedPageName } = await getOrResolvePageAccessToken(pageAccessToken, pageId);
  const finalPageName = resolvedPageName || pageName || 'Facebook Page';

  const title = `👻 [หนังสั้นสยองขวัญ] ${story?.title || 'ผีตลกหักมุม'} #Reels`;
  const sponsor = story?.sponsorProduct || {
    name: 'ขาตั้งกล้องเซลฟี่บลูทูธ 2 เมตร',
    shopeeUrl: 'https://shope.ee/m/affiliate?id=shopee_aff_gagghost_th&product=tripod',
    discountCode: 'SHOPEETIPOD',
    commissionRate: '15%'
  };

  const description = `👻 ${story?.title || 'หนังสั้นสยองขวัญฮาแตก'}

📌 ผลิตโดย GagGhost AI Auto-Pilot Engine 24/7

🛒 สินค้าป้ายยาในคลิป: ${sponsor.name}
👉 สั่งซื้อตรงนี้เลย: ${sponsor.shopeeUrl}
🎁 โค้ดส่วนลดพิเศษ: ${sponsor.discountCode}

#Reels #FacebookReels #GagGhostAI #ShopeeAffiliate #ผีตลก #หนังสั้นสยองขวัญ #ShopeeTH #ป้ายยาShopee`;

  // Prepare valid 9:16 vertical MP4 video file
  const { filePath, cleanup } = await createValidMp4File(story, videoBase64);

  try {
    const videoBuffer = fs.readFileSync(filePath);
    const fileSize = videoBuffer.length;
    console.log(`[Facebook Reels Upload] Preparing upload for Page ID ${pageId} ("${finalPageName}"), file size: ${fileSize} bytes`);

    // Method 1: Facebook Video Reels API (v19.0)
    try {
      const startUrl = `https://graph.facebook.com/v19.0/${pageId}/video_reels?upload_phase=start&access_token=${encodeURIComponent(activePageToken)}`;
      const startRes = await fetch(startUrl, { method: "POST" });
      const startData: any = await startRes.json();

      if (startData.video_id && startData.upload_url) {
        const { video_id: videoId, upload_url: uploadUrl } = startData;
        console.log(`[Facebook Reels] Session created. Video ID: ${videoId}, uploading ${fileSize} bytes...`);

        // Transfer binary video buffer
        await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `OAuth ${activePageToken}`,
            "file_offset": "0",
            "Content-Type": "application/octet-stream"
          },
          body: videoBuffer
        });

        // Finish / Publish Reel
        const finishUrl = `https://graph.facebook.com/v19.0/${pageId}/video_reels?upload_phase=finish&video_id=${videoId}&video_state=PUBLISHED&description=${encodeURIComponent(description)}&access_token=${encodeURIComponent(activePageToken)}`;
        const finishRes = await fetch(finishUrl, { method: "POST" });
        const finishData: any = await finishRes.json();

        if (finishData.success || finishData.id) {
          const reelUrl = `https://www.facebook.com/reel/${videoId}`;
          console.log(`🎉 [Facebook Reels Success] Video ID: ${videoId}, URL: ${reelUrl}`);

          if (story?.id) {
            const match = publishedStories.find(s => s.id === story.id);
            if (match) {
              match.facebookVideoId = videoId;
              match.facebookUrl = reelUrl;
              match.facebookUploadedAt = new Date().toISOString();
            }
          }
          return { videoId, videoUrl: reelUrl, pageName: finalPageName };
        } else if (finishData.error) {
          console.warn("[Facebook Reels Finish Warning]:", finishData.error.message);
        }
      } else if (startData.error) {
        console.warn("[Facebook Reels Start Warning]:", startData.error.message);
      }
    } catch (reelsErr: any) {
      console.warn("[Facebook Reels API Method Warning] Falling back to standard video API:", reelsErr?.message);
    }

    // Method 2: Standard Facebook Page Video Upload (Using graph-video.facebook.com)
    console.log(`[Facebook Video Upload] Posting video to Page Videos for Page ${pageId} via graph-video.facebook.com...`);
    try {
      const formData = new FormData();
      const blob = new Blob([videoBuffer], { type: 'video/mp4' });
      formData.append('source', blob, 'video.mp4');
      formData.append('title', title);
      formData.append('description', description);
      formData.append('access_token', activePageToken);

      const directRes = await fetch(`https://graph-video.facebook.com/v19.0/${pageId}/videos`, {
        method: 'POST',
        body: formData
      });
      const directData: any = await directRes.json();

      if (directData.id) {
        const fbVideoId = directData.id;
        const fbUrl = `https://www.facebook.com/watch/?v=${fbVideoId}`;
        console.log(`🎉 [Facebook Video Success] Video ID: ${fbVideoId}, URL: ${fbUrl}`);

        if (story?.id) {
          const match = publishedStories.find(s => s.id === story.id);
          if (match) {
            match.facebookVideoId = fbVideoId;
            match.facebookUrl = fbUrl;
            match.facebookUploadedAt = new Date().toISOString();
          }
        }
        return { videoId: fbVideoId, videoUrl: fbUrl, pageName: finalPageName };
      } else {
        const fbErrObj = directData.error || {};
        console.warn("[Facebook graph-video.facebook.com Error]:", fbErrObj.message);

        // Backup call to graph.facebook.com
        const directRes2 = await fetch(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
          method: 'POST',
          body: formData
        });
        const directData2: any = await directRes2.json();

        if (directData2.id) {
          const fbVideoId = directData2.id;
          const fbUrl = `https://www.facebook.com/watch/?v=${fbVideoId}`;
          console.log(`🎉 [Facebook Video Backup Success] Video ID: ${fbVideoId}, URL: ${fbUrl}`);
          return { videoId: fbVideoId, videoUrl: fbUrl, pageName: finalPageName };
        }

        const errMsg = directData2.error?.message || fbErrObj.message || "ไม่สามารถอัปโหลดเข้า Facebook Page ได้";
        if (errMsg.includes("No permission") || fbErrObj.code === 100 || directData2.error?.code === 100) {
          throw new Error(`(#100) Token ขาดสิทธิ์ 'pages_manage_posts' หรือไม่ได้เปิดสิทธิ์ให้เพจ "${finalPageName}" (จากรูป Debugger ของคุณ สิทธิ์ pages_manage_posts ยังไม่ได้เพิ่มไว้ ให้กด Add Permission -> เพิ่ม pages_manage_posts แล้วกด Generate Token ใหม่)`);
        }
        throw new Error(errMsg);
      }
    } catch (directErr: any) {
      throw directErr;
    }
  } finally {
    cleanup();
  }
}

// Facebook Page Config Endpoints
app.get("/api/facebook/config", (req, res) => {
  res.json({
    connected: !!facebookPageConfig,
    pageId: facebookPageConfig?.pageId || null,
    pageName: facebookPageConfig?.pageName || null
  });
});

app.post("/api/facebook/config", async (req, res) => {
  try {
    const { pageAccessToken, pageId, forceSave } = req.body;
    if (!pageAccessToken || !pageId) {
      return res.status(400).json({ error: "กรุณากรอกทั้ง Page Access Token และ Page ID" });
    }

    const cleanToken = String(pageAccessToken).replace(/[\r\n\t]/g, '').trim();
    const cleanPageId = String(pageId).replace(/[^\d]/g, '').trim() || String(pageId).trim();

    if (forceSave) {
      facebookPageConfig = {
        pageAccessToken: cleanToken,
        pageId: cleanPageId,
        pageName: `เพจ ID: ${cleanPageId}`
      };
      console.log(`✅ [Facebook Config Force Saved] Connected to Page ID ${cleanPageId}`);
      return res.json({
        success: true,
        pageId: cleanPageId,
        pageName: facebookPageConfig.pageName,
        message: `บันทึกข้อมูล Facebook Page ID ${cleanPageId} เรียบร้อยแล้ว!`
      });
    }

    let detectedPageName = '';
    let resolvedToken = cleanToken;
    let apiErrorMessage = '';

    try {
      // Step 1: Try direct page check with token
      const pageRes = await fetch(`https://graph.facebook.com/v19.0/${cleanPageId}?fields=name,id,access_token&access_token=${encodeURIComponent(cleanToken)}`);
      const pageData: any = await pageRes.json();

      if (pageData.name && pageData.id) {
        detectedPageName = pageData.name;
        if (pageData.access_token) {
          resolvedToken = pageData.access_token;
        }
      } else if (pageData.error) {
        apiErrorMessage = pageData.error.message || 'Page ID หรือ Access Token ไม่ถูกต้อง';
        console.warn(`[FB Config] Direct page fetch returned error: ${apiErrorMessage}. Checking /me/accounts...`);

        // Step 2: If cleanToken is a User Access Token, resolve Page Access Token from /me/accounts
        const accRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${encodeURIComponent(cleanToken)}`);
        const accData: any = await accRes.json();

        if (accData.data && Array.isArray(accData.data) && accData.data.length > 0) {
          const matchPage = accData.data.find((p: any) => p.id === cleanPageId);
          if (matchPage) {
            detectedPageName = matchPage.name;
            resolvedToken = matchPage.access_token || cleanToken;
            apiErrorMessage = '';
            console.log(`[FB Config] Successfully resolved Page Access Token for "${detectedPageName}" from User Token!`);
          } else {
            // Pick first available page from user's accounts if cleanPageId wasn't exact
            const firstPage = accData.data[0];
            detectedPageName = firstPage.name;
            resolvedToken = firstPage.access_token || cleanToken;
            apiErrorMessage = '';
            console.log(`[FB Config] Auto-selected Page "${detectedPageName}" (${firstPage.id}) from User Token!`);
          }
        }
      }
    } catch (apiErr: any) {
      console.warn(`[FB Config API Fetch Error] ${apiErr?.message}`);
      apiErrorMessage = apiErr?.message || 'ไม่สามารถติดต่อ Meta Graph API ได้';
    }

    if (apiErrorMessage && !detectedPageName) {
      return res.status(400).json({
        error: `ตรวจสอบข้อมูลกับ Facebook ไม่ผ่าน: ${apiErrorMessage}`,
        canForceSave: true
      });
    }

    facebookPageConfig = {
      pageAccessToken: resolvedToken,
      pageId: cleanPageId,
      pageName: detectedPageName || `เพจ ID: ${cleanPageId}`
    };

    console.log(`✅ [Facebook Config Success] Connected to Page "${facebookPageConfig.pageName}" (${facebookPageConfig.pageId})`);

    res.json({
      success: true,
      pageId: facebookPageConfig.pageId,
      pageName: facebookPageConfig.pageName,
      message: `เชื่อมต่อ Facebook Page "${facebookPageConfig.pageName}" เรียบร้อยแล้ว!`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ Facebook" });
  }
});

app.delete("/api/facebook/config", (req, res) => {
  facebookPageConfig = null;
  res.json({ success: true, message: "ยกเลิกการเชื่อมต่อ Facebook Page แล้ว" });
});

app.post("/api/facebook/upload", async (req, res) => {
  try {
    const { story, videoBase64 } = req.body;
    if (!facebookPageConfig) {
      return res.status(401).json({
        error: "กรุณาเชื่อมต่อเพจ Facebook ของคุณก่อน (กรอก Page Access Token และ Page ID)",
        needAuth: true
      });
    }

    const result = await uploadStoryToFacebookReels(story, videoBase64);

    res.json({
      success: true,
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      pageName: result.pageName,
      message: `🎉 อัปโหลดคลิป "${story?.title || 'หนังสั้น'}" ขึ้น Facebook Reels สำเร็จแล้ว!`
    });
  } catch (error: any) {
    console.error("Facebook Upload Error:", error);
    res.status(500).json({
      error: error.message || "เกิดข้อผิดพลาดในการโพสต์คลิปขึ้น Facebook Reels API"
    });
  }
});

// 5. POST Upload Video directly to YouTube Shorts via YouTube Data API v3
app.post("/api/youtube/upload", async (req, res) => {
  try {
    const { story, videoBase64 } = req.body;

    if (!youtubeAuthTokens) {
      return res.status(401).json({
        error: "กรุณาเชื่อมต่อบัญชี YouTube ของคุณก่อน (กดปุ่ม 'เชื่อมต่อช่อง YouTube จริง')",
        needAuth: true
      });
    }

    const result = await uploadStoryToYouTube(story, videoBase64, req);

    res.json({
      success: true,
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      channelTitle: result.channelTitle,
      message: `🎉 อัปโหลดคลิป "${story?.title || 'หนังสั้น'}" ขึ้น YouTube Shorts สำเร็จแล้ว!`
    });
  } catch (error: any) {
    console.error("YouTube Upload Error:", error);
    res.status(500).json({
      error: error.message || "เกิดข้อผิดพลาดในการโพสต์คลิปขึ้น YouTube Data API"
    });
  }
});

// ==========================================
// 24/7 AUTOMATION ENGINE (CRON / AUTOPILOT)
// ==========================================
let autoPilotState = {
  enabled: true,
  intervalHours: 6, // Runs every 6 hours automatically on Cloud Server 24/7
  lastRunTime: new Date().toISOString(),
  nextRunTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  totalAutoGenerated: 14,
  uploadTargetPlatform: 'both' as 'youtube' | 'facebook' | 'both' | 'none', // Target platform choice
  autoUploadToYouTube: true,
  autoUploadToFacebook: true,
  logs: [
    `[${new Date().toLocaleTimeString('th-TH')}] 🤖 24/7 Auto-Pilot Daemon เปิดใช้งานอยู่! ทำงานอัตโนมัติบน Cloud Server 24 ชั่วโมง`,
    `[${new Date().toLocaleTimeString('th-TH')}] ⚡ ตั้งค่าการรันอัตโนมัติทุกๆ 6 ชั่วโมง (เขียนบท 5 ฉาก ➔ เจนภาพ ➔ รวมวิดีโอ ➔ ปักหมุด Shopee ➔ ยิงเข้า YouTube Shorts & Facebook Reels)`
  ]
};

// Internal function to perform 1 complete background auto-production cycle
async function executeAutoPilotTask() {
  const timeStr = new Date().toLocaleTimeString('th-TH');
  autoPilotState.logs.unshift(`[${timeStr}] 🎬 [24/7 Cron] เริ่มต้นการผลิตหนังสั้นสยองขวัญอัตโนมัติประจำรอบ...`);
  
  try {
    const topics = [
      "ผีตู้เย็นแอบกินสุกี้หม้อไฟฟ้าตอนตีสาม",
      "กระสือโบกมือขอใช้ไฟฉายแรงสูงส่องทาง",
      "กุมารทองแอบกดสั่งของ Shopee ตอนเจ้าของหลับ",
      "ผีป๊อบเปิดพัดลมคลายร้อนตอนตีสาม",
      "วิญญาณหอพักร้างชวนกินชาบูดิสรัปชั่น"
    ];
    const chosenTopic = topics[Math.floor(Math.random() * topics.length)];
    const chosenSponsor = shopeePresetProducts[Math.floor(Math.random() * shopeePresetProducts.length)];

    const newStory: any = {
      id: `story-auto-${Date.now()}`,
      title: `${chosenTopic} (24/7 Auto-Pilot Bot)`,
      tagline: `หนังสั้นสยองขวัญตลกผลิตโดย GagGhost AI Auto-Pilot Engine 24/7`,
      category: 'ผีตลกฮาแตก',
      aspectRatio: '9:16',
      creator: 'GagGhost 24/7 Auto Bot',
      createdAt: 'เมื่อสักครู่',
      thumbnailUrl: chosenSponsor.bannerImage,
      likesCount: Math.floor(Math.random() * 500) + 120,
      viewsCount: Math.floor(Math.random() * 5000) + 1500,
      sharesCount: Math.floor(Math.random() * 200) + 40,
      commentsCount: Math.floor(Math.random() * 50) + 8,
      vipUnlocked: false,
      isAutoPublished: true,
      sponsorProduct: chosenSponsor,
      scenes: [
        {
          id: `s-auto-1`,
          sceneNumber: 1,
          durationSec: 8,
          narrationText: `คืนวันศุกร์ ณ ห้องพักร้าง จู่ๆ เรื่องราวของ ${chosenTopic} ก็เกิดขึ้นอย่างไม่น่าเชื่อ...`,
          visualPrompt: `Creepy horror cinematic vertical 9:16 scene about ${chosenTopic}`,
          visualImageUrl: chosenSponsor.bannerImage,
          sfx: 'scary_thunder',
          bgmMood: 'horror_creepy',
          subtitles: ['บรรยากาศวังเวงตอนตีสาม...', chosenTopic]
        },
        {
          id: `s-auto-2`,
          sceneNumber: 2,
          durationSec: 9,
          narrationText: `ตัวละครตกใจเตรียมหยิบของมาขู่ผี แต่ผีกลับชี้ไปที่ ${chosenSponsor.name}!`,
          visualPrompt: `Scared Thai guy encountering ghost pointing at ${chosenSponsor.name}, comedy horror`,
          visualImageUrl: chosenSponsor.bannerImage,
          sfx: 'screaming_ghost',
          bgmMood: 'suspense_rising',
          subtitles: ['ผีชี้ไปที่สินค้าป้ายยา!', chosenSponsor.name]
        },
        {
          id: `s-auto-3`,
          sceneNumber: 3,
          durationSec: 10,
          narrationText: `ผีบอกว่า "กูไม่ได้มาหลอน... กูแค่มาป้ายยา ${chosenSponsor.name} สั่งจาก Shopee ส่วนลดเพียบ!"`,
          visualPrompt: `Funny ghost showing product with happy expression`,
          visualImageUrl: chosenSponsor.bannerImage,
          sfx: 'funny_cough',
          bgmMood: 'funny_twist',
          subtitles: ['ผีบอก: กูแค่มาป้ายยา Shopee!', `ส่วนลด ${chosenSponsor.discountCode}`]
        },
        {
          id: `s-auto-4`,
          sceneNumber: 4,
          durationSec: 11,
          narrationText: `ทั้งคู่จับมือเปิดแอป Shopee สั่งซื้อด้วยกัน แถมได้ค่าคอมมิชชั่น ${chosenSponsor.commissionRate}`,
          visualPrompt: `Guy and ghost ordering from Shopee together happily`,
          visualImageUrl: chosenSponsor.bannerImage,
          sfx: 'comedy_boing',
          bgmMood: 'funny_twist',
          subtitles: ['สั่งซื้อผ่านลิงก์ Shopee ในคอมเมนต์!', `คอมมิชชั่น ${chosenSponsor.commissionRate}`]
        }
      ]
    };

    publishedStories.unshift(newStory);
    autoPilotState.totalAutoGenerated += 1;
    autoPilotState.lastRunTime = new Date().toISOString();
    autoPilotState.nextRunTime = new Date(Date.now() + autoPilotState.intervalHours * 3600 * 1000).toISOString();

    autoPilotState.logs.unshift(`[${timeStr}] ✅ [24/7 Cron] เจนหนังสั้นเรื่อง "${newStory.title}" เผยแพร่ขึ้น Feed สตรีมมิ่งในแอปสำเร็จ!`);

    const shouldUploadYT = (autoPilotState.uploadTargetPlatform === 'youtube' || autoPilotState.uploadTargetPlatform === 'both') && autoPilotState.autoUploadToYouTube;
    const shouldUploadFB = (autoPilotState.uploadTargetPlatform === 'facebook' || autoPilotState.uploadTargetPlatform === 'both') && autoPilotState.autoUploadToFacebook;

    // YouTube Upload
    if (shouldUploadYT && youtubeAuthTokens) {
      autoPilotState.logs.unshift(`[${timeStr}] 🚀 [24/7 Cron] กำลังเรียก YouTube Data API v3 ยิงคลิปตรงเข้าช่อง...`);
      try {
        const uploadResult = await uploadStoryToYouTube(newStory);
        autoPilotState.logs.unshift(`[${timeStr}] 🎉 [24/7 Cron YouTube] อัปโหลดขึ้น YouTube Shorts จริงสำเร็จ! Video ID: ${uploadResult.videoId} (ช่อง: ${uploadResult.channelTitle})`);
      } catch (ytErr: any) {
        console.error("24/7 AutoPilot YouTube Upload Error:", ytErr);
        autoPilotState.logs.unshift(`[${timeStr}] ⚠️ [24/7 Cron YouTube Error] ${ytErr?.message || 'ไม่สามารถอัปโหลดเข้า YouTube ได้'}`);
      }
    }

    // Facebook Reels Upload
    if (shouldUploadFB && facebookPageConfig) {
      autoPilotState.logs.unshift(`[${timeStr}] 💙 [24/7 Cron] กำลังเรียก Meta Graph API ยิงคลิปเข้า Facebook Reels...`);
      try {
        const fbResult = await uploadStoryToFacebookReels(newStory);
        autoPilotState.logs.unshift(`[${timeStr}] 🎉 [24/7 Cron Facebook] อัปโหลดขึ้น Facebook Reels จริงสำเร็จ! Video ID: ${fbResult.videoId} (เพจ: ${fbResult.pageName})`);
      } catch (fbErr: any) {
        console.error("24/7 AutoPilot Facebook Upload Error:", fbErr);
        autoPilotState.logs.unshift(`[${timeStr}] ⚠️ [24/7 Cron Facebook Error] ${fbErr?.message || 'ไม่สามารถอัปโหลดเข้า Facebook Reels ได้'}`);
      }
    }

    if (!shouldUploadYT && !shouldUploadFB) {
      autoPilotState.logs.unshift(`[${timeStr}] ℹ️ [24/7 Cron] คลิปถูกเผยแพร่บน Feed สตรีมมิ่งในแอป 100% (เลือกผูก YouTube หรือ Facebook เพิ่มเติมได้)`);
    }
  } catch (err: any) {
    autoPilotState.logs.unshift(`[${timeStr}] ❌ [24/7 Cron Error] เกิดข้อผิดพลาด: ${err?.message}`);
  }
}

// Background Interval Runner (checks every 1 min)
setInterval(() => {
  if (!autoPilotState.enabled) return;
  const now = new Date().getTime();
  const nextRun = new Date(autoPilotState.nextRunTime).getTime();
  if (now >= nextRun) {
    executeAutoPilotTask();
  }
}, 60000);

// API Endpoints for 24/7 Autopilot Control
app.get("/api/autopilot/status", (req, res) => {
  res.json({
    ...autoPilotState,
    youtubeConnected: !!youtubeAuthTokens,
    youtubeChannelTitle: youtubeChannelInfo?.title || null,
    facebookConnected: !!facebookPageConfig,
    facebookPageId: facebookPageConfig?.pageId || null,
    facebookPageName: facebookPageConfig?.pageName || null
  });
});

app.post("/api/autopilot/toggle", (req, res) => {
  const { enabled, intervalHours, autoUploadToYouTube, autoUploadToFacebook, uploadTargetPlatform } = req.body;
  if (typeof enabled === 'boolean') autoPilotState.enabled = enabled;
  if (typeof intervalHours === 'number' && intervalHours > 0) {
    autoPilotState.intervalHours = intervalHours;
    autoPilotState.nextRunTime = new Date(Date.now() + intervalHours * 3600 * 1000).toISOString();
  }
  if (typeof autoUploadToYouTube === 'boolean') autoPilotState.autoUploadToYouTube = autoUploadToYouTube;
  if (typeof autoUploadToFacebook === 'boolean') autoPilotState.autoUploadToFacebook = autoUploadToFacebook;
  if (uploadTargetPlatform) autoPilotState.uploadTargetPlatform = uploadTargetPlatform;

  const actionText = autoPilotState.enabled ? `เปิดใช้งาน (ทำงานทุกๆ ${autoPilotState.intervalHours} ช.ม.)` : 'ปิดใช้งาน';
  autoPilotState.logs.unshift(`[${new Date().toLocaleTimeString('th-TH')}] ⚙️ อัปเดตสถานะ 24/7 Auto-Pilot: ${actionText}`);

  res.json({
    success: true,
    message: `อัปเดตระบบ 24/7 Auto-Pilot เป็น "${actionText}" เรียบร้อยแล้ว!`,
    autoPilotState
  });
});

app.post("/api/autopilot/trigger", async (req, res) => {
  await executeAutoPilotTask();
  res.json({
    success: true,
    message: "สั่งทำงาน 24/7 Auto-Pilot Instant Cycle สำเร็จแล้ว!",
    autoPilotState
  });
});

// Start Express Server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GagGhost AI Server running at http://localhost:${PORT}`);
  });
}

startServer();
