import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not defined.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
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

// POST Generate Script using Gemini AI (Step 1)
app.post("/api/generate-story-script", async (req, res) => {
  try {
    const { topic, category } = req.body;
    const ai = getGeminiClient();

    const userPrompt = `คุณคือ AI ผู้กำกับหนังสั้นสยองขวัญหักมุมตลกสไตล์ TikTok/Reels ยอดนิยม!
ช่วยคิดบทหนังสั้นสยองขวัญภาษาไทย ความยาว 1 นาที (แบ่งเป็น 3-4 ฉาก) 
หัวข้อเรื่อง: "${topic || 'ผีในชีวิตประจำวันยุคดิจิทัล'}"
หมวดหมู่: "${category || 'ผีติดสปีด'}"

เงื่อนไขที่ต้องมี:
1. เรื่องราวเริ่มแบบสยองขวัญ ตื่นเต้น น่ากลัว บิ้วท์อารมณ์สยอง
2. ตอนจบฉากสุดท้ายหักมุมตลก ฮากริบ ไร้คาดคิด สะใจคนดู
3. เขียนบทพากย์ภาษาไทยสั้นกระชับ สนุกสนาน พร้อมคำซับไตเติ้ล
4. กำหนด Prompt ภาษาอังกฤษสร้างภาพฉากสยอง/ตลกในแต่ละฉาก
5. มีเสียงเอฟเฟกต์ SFX (เลือกจาก: screaming_ghost, comedy_boing, scary_thunder, funny_cough, creepy_whisper, laugh_track, suspense_stinger)
6. มีสินค้าสปอนเซอร์ตลกๆ ที่เนียนประกอบในเรื่อง เพื่อเปิดช่องทางสร้างรายได้

โปรดตอบกลับในรูปแบบ JSON ตามโครงสร้าง schema นี้เท่านั้น!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "ชื่อเรื่องสั้นตลกสยองขวัญ" },
            tagline: { type: Type.STRING, description: "สโลแกนเรียกลูกค้า" },
            category: { type: Type.STRING, description: "หมวดหมู่" },
            twistChoiceA: { type: Type.STRING, description: "ตัวเลือกจุดหักมุม A" },
            twistChoiceB: { type: Type.STRING, description: "ตัวเลือกจุดหักมุม B" },
            winningTwist: { type: Type.STRING, description: "จุดหักมุมหลัก" },
            sponsorProduct: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "ชื่อสินค้าสปอนเซอร์ตลกๆ" },
                description: { type: Type.STRING, description: "คำอธิบายสินค้า" },
                price: { type: Type.NUMBER, description: "ราคาสินค้า" },
                discountCode: { type: Type.STRING, description: "โค้ดส่วนลด" },
                commissionRate: { type: Type.STRING, description: "เปอร์เซ็นต์ค่าคอมมิชชั่น" }
              }
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  durationSec: { type: Type.INTEGER },
                  narrationText: { type: Type.STRING, description: "บทพากย์เสียงภาษาไทย" },
                  visualPrompt: { type: Type.STRING, description: "English prompt for AI image generator" },
                  sfx: { type: Type.STRING, description: "SFX type" },
                  bgmMood: { type: Type.STRING, description: "BGM mood" },
                  subtitles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["sceneNumber", "durationSec", "narrationText", "visualPrompt", "sfx", "bgmMood", "subtitles"]
              }
            }
          },
          required: ["title", "tagline", "category", "scenes", "twistChoiceA", "twistChoiceB", "winningTwist"]
        }
      }
    });

    const scriptJson = JSON.parse(response.text || "{}");
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
    const ai = getGeminiClient();

    // Step 1: Script Writing
    const userPrompt = `คิดบทหนังสั้นสยองขวัญหักมุมตลก 1 นาที แนวไวรัล TikTok/Reels ภาษาไทย
หัวข้อ: "${topic || 'ผีสิงของใช้ใกล้ตัว'}"
หมวดหมู่: "${category || 'ผีติดสปีด'}"

ต้องมี:
- ชื่อเรื่องสั้นกระชับ
- สโลแกนดึงดูด
- 3 ฉากหลักสยองฮา
- บทพากย์ไทยกระชับ สนุก ตลก
- Visual prompt ภาษาอังกฤษสำหรับเจนรูปภาพ
- เอฟเฟกต์ SFX`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
                  durationSec: { type: Type.INTEGER },
                  narrationText: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  sfx: { type: Type.STRING },
                  bgmMood: { type: Type.STRING },
                  subtitles: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });

    const script = JSON.parse(response.text || "{}");

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
