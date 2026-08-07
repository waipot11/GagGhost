import React, { useState, useEffect } from 'react';
import { SponsorProduct, ShortStory } from '../types';
import { exportShortVideoMP4 } from '../utils/videoExporter';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Coins,
  Plus,
  CheckCircle2,
  Share2,
  Download,
  Zap,
  Tag,
  Gift,
  ExternalLink,
  Save,
  Sparkles,
  Link2,
  Loader2
} from 'lucide-react';

interface Props {
  coins: number;
  onTopUpCoins: (amount: number) => void;
  stories?: ShortStory[];
}

export const MonetizationHub: React.FC<Props> = ({ coins, onTopUpCoins, stories = [] }) => {
  const [shopeeAffiliateId, setShopeeAffiliateId] = useState<string>('shopee_aff_gagghost_th');
  const [shopeeTag, setShopeeTag] = useState<string>('GagGhost_Shorts_AI');
  const [shopeeCategory, setShopeeCategory] = useState<string>('ของใช้สยองขวัญตลก');
  const [autoInjectShopee, setAutoInjectShopee] = useState<boolean>(true);
  const [shopeeSaveStatus, setShopeeSaveStatus] = useState<string>('');

  const [shopeePresetProducts, setShopeePresetProducts] = useState<SponsorProduct[]>([]);
  const [customShopeeUrl, setCustomShopeeUrl] = useState<string>('');
  const [convertedAffiliateUrl, setConvertedAffiliateUrl] = useState<string>('');

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  const [sponsorsList, setSponsorsList] = useState<SponsorProduct[]>([
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
    }
  ]);

  const [showAddSponsorModal, setShowAddSponsorModal] = useState<boolean>(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(150);
  const [newCode, setNewCode] = useState<string>('GAGSPECIAL');
  const [newComm, setNewComm] = useState<string>('30% (รับ 45 บาท/ชิ้น)');

  // Real YouTube OAuth & Direct Upload States
  const [ytConnected, setYtConnected] = useState<boolean>(false);
  const [ytChannelInfo, setYtChannelInfo] = useState<any>(null);
  const [ytUploading, setYtUploading] = useState<boolean>(false);
  const [ytUploadResult, setYtUploadResult] = useState<any>(null);
  const [ytManualToken, setYtManualToken] = useState<string>('');

  const checkYouTubeStatus = () => {
    fetch('/api/youtube/status')
      .then(res => res.json())
      .then(data => {
        setYtConnected(data.connected);
        setYtChannelInfo(data.channelInfo);
      })
      .catch(() => {});
  };

  // Fetch Shopee Config & Preset Products from Backend
  useEffect(() => {
    checkYouTubeStatus();

    // Check if coming back from OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      alert('🎉 เชื่อมต่อช่อง YouTube ของคุณสำเร็จแล้ว! ตอนนี้ระบบสามารถโพสต์คลิปลงช่องจริงได้ 100%');
      checkYouTubeStatus();
    } else if (params.get('youtube_error')) {
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ YouTube: ' + params.get('youtube_error'));
    }

    fetch('/api/shopee/config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setShopeeAffiliateId(data.config.affiliateId || 'shopee_aff_gagghost_th');
          setShopeeTag(data.config.customTrackingTag || 'GagGhost_Shorts_AI');
          setShopeeCategory(data.config.defaultCategory || 'ของใช้สยองขวัญตลก');
          setAutoInjectShopee(data.config.autoInjectToPipeline ?? true);
        }
      })
      .catch(() => {});

    fetch('/api/shopee/preset-products')
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setShopeePresetProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  const handleConnectYouTube = () => {
    fetch('/api/auth/youtube/url')
      .then(res => res.json())
      .then(data => {
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          alert('ไม่สามารถเรนเดอร์ Google OAuth URL ได้');
        }
      })
      .catch(err => {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ YouTube OAuth: ' + err.message);
      });
  };

  const handleSaveManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytManualToken.trim()) return;

    fetch('/api/youtube/manual-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: ytManualToken })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('ผูก Refresh Token ช่อง YouTube เรียบร้อยแล้ว!');
          checkYouTubeStatus();
          setYtManualToken('');
        } else {
          alert('ข้อผิดพลาด: ' + data.error);
        }
      });
  };

  const handleDirectYouTubeUpload = async (targetStory?: ShortStory) => {
    const storyToUpload = targetStory || stories[0];
    if (!storyToUpload) {
      alert('ไม่พบหนังสั้นที่ต้องการอัปโหลด');
      return;
    }

    setYtUploading(true);
    setYtUploadResult(null);

    try {
      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: storyToUpload,
          privacyStatus: 'public'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.needAuth) {
          if (confirm('ระบบยังไม่ได้อนุญาตการเข้าถึงช่อง YouTube จริงของคุณ คุณต้องการเชื่อมต่อบัญชี YouTube ตอนนี้เลยหรือไม่?')) {
            handleConnectYouTube();
          }
        } else {
          alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + data.error);
        }
      } else {
        setYtUploadResult(data);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
    } finally {
      setYtUploading(false);
    }
  };

  const handleSaveShopeeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setShopeeSaveStatus('กำลังบันทึก...');

    fetch('/api/shopee/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        affiliateId: shopeeAffiliateId,
        customTrackingTag: shopeeTag,
        defaultCategory: shopeeCategory,
        autoInjectToPipeline: autoInjectShopee
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShopeeSaveStatus('✓ บันทึก Shopee Affiliate ID สำเร็จ!');
          setTimeout(() => setShopeeSaveStatus(''), 3000);
        }
      })
      .catch(() => {
        setShopeeSaveStatus('เกิดข้อผิดพลาดในการบันทึก');
      });
  };

  const handleConvertShopeeLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customShopeeUrl.trim()) return;

    fetch('/api/shopee/convert-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalUrl: customShopeeUrl,
        productName: 'ShopeeProduct'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.affiliateUrl) {
          setConvertedAffiliateUrl(data.affiliateUrl);
        }
      })
      .catch(() => {});
  };

  const handleSelectShopeePreset = (product: SponsorProduct) => {
    const updatedProduct = {
      ...product,
      shopeeAffiliateId: shopeeAffiliateId,
      linkUrl: `https://shope.ee/m/affiliate?id=${encodeURIComponent(shopeeAffiliateId)}&tag=${encodeURIComponent(shopeeTag)}&item=${product.id}`
    };

    setSponsorsList(prev => [updatedProduct, ...prev.filter(p => p.id !== product.id)]);
    alert(`เลือกสินค้า Shopee ป้ายยา: "${product.name}" สำเร็จ!\nระบบได้ผูก Shopee Affiliate ID (${shopeeAffiliateId}) ของคุณเข้ากับคลิป AI หนังสั้นเรียบร้อยแล้ว`);
  };

  const handleCopyPinnedComment = (targetStory?: ShortStory) => {
    const storyToUse = targetStory || stories[0];
    const sponsor = storyToUse?.sponsorProduct || sponsorsList[0];
    const textToCopy = `👻 [หนังสั้นสยองขวัญตลก] ${storyToUse?.title || 'หนังสั้นสยองขวัญหักมุม'}
🛍️ สินค้า Shopee ป้ายยาในคลิป: ${sponsor.name}
👉 คลิกสั่งซื้อตรงนี้เลย: ${sponsor.linkUrl || 'https://shopee.co.th'}
🎁 โค้ดส่วนลดพิเศษ: ${sponsor.discountCode} (รับส่วนลด ${sponsor.commissionRate})

#Shorts #GagGhostAI #ShopeeAffiliate #ผีตลก #หนังสั้นสยองขวัญ #ShopeeTH`;

    navigator.clipboard.writeText(textToCopy);
    alert(`📋 คัดลอกข้อความ + ลิงก์ Shopee เรียบร้อยแล้ว!\n\nนำข้อความนี้ไปวางใน "คอมเมนต์ปักหมุด (Pinned Comment)" หรือ "คำอธิบายคลิป (Description)" บน YouTube Shorts หรือ TikTok ได้เลยครับ!`);
  };

  const handleStartExport = async (targetStory?: ShortStory) => {
    const storyToExport = targetStory || stories[0] || {
      id: 'demo-export',
      title: 'เรื่องเล่าสยองขวัญหักมุมตลก',
      tagline: 'ผีสิงตู้เย็นแล้วสั่ง GrabFood',
      category: 'ผีติดสปีด',
      aspectRatio: '9:16',
      scenes: [],
      twistChoiceA: 'A',
      twistChoiceB: 'B',
      vipUnlocked: true,
      likesCount: 120,
      viewsCount: 1500,
      sharesCount: 45,
      commentsCount: 30,
      creator: 'GagGhost AI Studio',
      createdAt: 'เมื่อครู่นี้',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
      isAutoPublished: true,
      sponsorProduct: sponsorsList[0]
    };

    setIsExporting(true);
    setExportProgress(5);
    setExportStatusText('กำลังเปิดเอนจิน Canvas 9:16...');

    try {
      await exportShortVideoMP4(storyToExport as ShortStory, (percent, status) => {
        setExportProgress(percent);
        setExportStatusText(status);
      });
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์วิดีโอ');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 1500);
    }
  };

  const handleAddSponsorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newSp: SponsorProduct = {
      id: `sp_${Date.now()}`,
      name: newName,
      description: newDesc || 'สินค้าสปอนเซอร์คุณภาพเนียนในคลิปหนังสั้น',
      price: newPrice,
      discountCode: newCode,
      linkUrl: `https://shope.ee/m/affiliate?id=${encodeURIComponent(shopeeAffiliateId)}&tag=${encodeURIComponent(shopeeTag)}`,
      bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
      commissionRate: newComm,
      isShopeeProduct: true,
      shopeeAffiliateId: shopeeAffiliateId
    };

    setSponsorsList(prev => [newSp, ...prev]);
    setShowAddSponsorModal(false);
    setNewName('');
    setNewDesc('');
    alert('เพิ่มสินค้าสปอนเซอร์ Shopee เข้าสู่ระบบ Auto Pipeline สำเร็จ! สินค้านี้จะถูกเนียนใส่ในหนังสั้น AI เรื่องถัดไปทันที');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 text-slate-100">
      {/* Monetization Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl border border-emerald-900/50 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-900/80 text-emerald-400 border border-emerald-700">
              <DollarSign className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              ศูนย์สร้างรายได้อัตโนมัติ (Monetization & Affiliate Hub)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            ช่องทางสร้างรายได้ครบวงจร: สปอนเซอร์ Affiliate แบนเนอร์เนียนในคลิป, ระบบรับทิปจากผู้ชม, การขายฉากหักมุม VIP, และการส่งออกคลิปไปสร้างรายได้บน TikTok/Reels/Shorts
          </p>
        </div>

        {/* Current Coins Balance Card */}
        <div className="bg-slate-950 border border-amber-600/60 p-4 rounded-2xl flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-600/80 flex items-center justify-center text-amber-300 text-2xl">
            🪙
          </div>
          <div className="text-left">
            <div className="text-xs text-amber-400 font-medium">ยอดคอยน์สะสมของคุณ</div>
            <div className="text-2xl font-black text-amber-300">{coins} คอยน์</div>
            <div className="text-[10px] text-slate-400">≈ {(coins * 0.5).toFixed(0)} บาท</div>
          </div>
        </div>
      </div>

      {/* Revenue Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-left">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-1">
            <span>คาดการณ์รายได้รวมวันนี้</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">1,450 บาท</div>
          <div className="text-[10px] text-slate-400 mt-1">+24% จากยอดเมื่อวาน</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-left">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-1">
            <span>คลิกสั่งซื้อสปอนเซอร์ (Affiliate)</span>
            <ShoppingBag className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300">142 ครั้ง</div>
          <div className="text-[10px] text-slate-400 mt-1">ยอดขาย 12 ออเดอร์ (รับคอมฯ 840฿)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-left">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-1">
            <span>คอยน์ทิปจากผู้ชม</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">750 คอยน์</div>
          <div className="text-[10px] text-slate-400 mt-1">จากผู้ชม 18 ท่าน</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-left">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-1">
            <span>ยอดขายฉากหักมุม VIP</span>
            <Gift className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">450 คอยน์</div>
          <div className="text-[10px] text-slate-400 mt-1">ผู้ชมปลดล็อก 9 คน</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Shopee Affiliate Settings & Sponsor Products List */}
        <div className="lg:col-span-2 space-y-6 text-left">

          {/* Shopee Affiliate Config & Catalog Box */}
          <div className="bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 border-2 border-orange-500/80 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500 text-slate-950 font-black text-lg">
                  🛍️
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-orange-200">
                    ตั้งค่า Shopee Affiliate ID & เลือกสินค้าป้ายยา
                  </h3>
                  <p className="text-xs text-orange-300/80">
                    ผูก Shopee Affiliate ID ของคุณ เพื่อให้ AI นำสินค้าไปเนียนป้ายยาและสร้างรายได้เข้ากระเป๋าคุณโดยตรง
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-orange-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Shopee Partner Enabled
              </span>
            </div>

            {/* Shopee Affiliate ID Settings Form */}
            <form onSubmit={handleSaveShopeeConfig} className="bg-slate-950/80 border border-orange-900/60 p-4 rounded-2xl mb-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-orange-300 mb-1">
                    Shopee Affiliate ID ของคุณ:
                  </label>
                  <input
                    type="text"
                    value={shopeeAffiliateId}
                    onChange={e => setShopeeAffiliateId(e.target.value)}
                    placeholder="เช่น shopee_aff_12345678"
                    className="w-full bg-slate-900 border border-orange-800/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-orange-300 mb-1">
                    Sub-ID / Tracking Tag (สำหรับติดตามยอด):
                  </label>
                  <input
                    type="text"
                    value={shopeeTag}
                    onChange={e => setShopeeTag(e.target.value)}
                    placeholder="เช่น GagGhost_Shorts_01"
                    className="w-full bg-slate-900 border border-orange-800/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-orange-900/40">
                <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoInjectShopee}
                    onChange={e => setAutoInjectShopee(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span>เปิดใช้ AI สุ่มดึงสินค้า Shopee ใส่ในหนังสั้น AI แบบ 100% Auto</span>
                </label>

                <div className="flex items-center gap-2">
                  {shopeeSaveStatus && (
                    <span className="text-xs text-emerald-400 font-bold animate-pulse">
                      {shopeeSaveStatus}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> บันทึก Affiliate ID
                  </button>
                </div>
              </div>
            </form>

            {/* Shopee Preset Catalog Selector */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-amber-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> เลือกสินค้า Shopee ขายดีสำหรับเนียนป้ายยาในหนังสั้น AI (1-Click Add):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shopeePresetProducts.map(p => (
                  <div
                    key={p.id}
                    className="bg-slate-950/90 border border-orange-900/50 hover:border-orange-500 p-3 rounded-2xl flex flex-col justify-between transition-all"
                  >
                    <div className="flex items-start gap-2.5 mb-2">
                      <img
                        src={p.bannerImage}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-orange-950 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-100 truncate">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-amber-400 font-extrabold mt-0.5">
                          <span>฿{p.price}</span>
                          <span>⭐ {p.shopeeRating}</span>
                          <span className="text-slate-400 font-normal">{p.shopeeSoldAmount}</span>
                        </div>
                        <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800/60 px-1.5 py-0.5 rounded font-bold inline-block mt-1">
                          คอมมิชชั่น: {p.commissionRate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectShopeePreset(p)}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-[11px] py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md"
                    >
                      <span>🛒 ดึงสินค้านี้ไปใส่ใน AI คลิป</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Shopee Raw Link Converter Tool */}
            <div className="bg-slate-950/90 border border-orange-900/50 p-3.5 rounded-2xl">
              <h4 className="text-xs font-bold text-orange-300 mb-2 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-orange-400" /> เครื่องมือแปลงลิงก์สินค้า Shopee ใดก็ได้ ให้ผูก Affiliate ID ของคุณ:
              </h4>
              <form onSubmit={handleConvertShopeeLink} className="flex gap-2">
                <input
                  type="text"
                  placeholder="วางลิงก์สินค้า Shopee (เช่น https://shopee.co.th/product/...)"
                  value={customShopeeUrl}
                  onChange={e => setCustomShopeeUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-orange-900/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shrink-0"
                >
                  แปลงลิงก์
                </button>
              </form>

              {convertedAffiliateUrl && (
                <div className="mt-2.5 p-2 bg-slate-900 border border-orange-800/80 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-mono truncate max-w-[280px]">
                    {convertedAffiliateUrl}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(convertedAffiliateUrl);
                      alert('คัดลอกลิงก์ Shopee Affiliate เรียบร้อยแล้ว!');
                    }}
                    className="bg-orange-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shrink-0 ml-2"
                  >
                    คัดลอกลิงก์
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" /> สินค้าสปอนเซอร์ในระบบ AI (Sponsor Auto Placement)
              </h3>
              <button
                onClick={() => setShowAddSponsorModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> เพิ่มสินค้าสปอนเซอร์
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              สินค้าเหล่านี้จะถูก AI นำไปแต่งเนียนใส่ในบทหนังสั้นสยองขวัญหักมุมโดยอัตโนมัติ พร้อมแสดงแถบสั่งซื้อลอยล่างคลิปสำหรับรับค่าคอมมิชชั่น!
            </p>

            <div className="space-y-3">
              {sponsorsList.map(sp => (
                <div
                  key={sp.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={sp.bannerImage}
                      alt={sp.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">
                        {sp.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sp.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded font-mono font-bold">
                          โค้ดส่วนลด: {sp.discountCode}
                        </span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-bold">
                          {sp.commissionRate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-white">
                      ฿{sp.price}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                      ✓ แสดงใน AI Feed แล้ว
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Cross-Post & Export Video Simulator */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-teal-400" /> ส่งออกและโพสต์ลงโซเชียลสร้างรายได้ (Social Cross-Posting)
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              คุณสามารถส่งออกไฟล์วิดีโอหนังสั้นที่สร้างเสร็จแล้วเพื่อนำไปโพสต์รับยอดวิวจาก TikTok, YouTube Shorts และ Facebook Reels ได้แบบ 1-Click
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleStartExport()}
                disabled={isExporting}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-200 transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>ดาวน์โหลด MP4 HD</span>
              </button>

              <button
                onClick={() => alert('จำลองการยิงคลิปโพสต์เข้า TikTok Creator Center สำเร็จ!')}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-200 transition-all"
              >
                <Share2 className="w-4 h-4 text-teal-400" />
                <span>ยิงเข้า TikTok Auto</span>
              </button>

              <button
                onClick={() => setShowYouTubeModal(true)}
                className="bg-gradient-to-r from-red-950 to-amber-950 hover:from-red-900 hover:to-amber-900 border border-red-500/60 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-100 transition-all shadow-lg"
              >
                <Zap className="w-4 h-4 text-red-400 animate-pulse" />
                <span>ยิงเข้า YT Shorts / คู่มือ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Top-Up Coins Simulator */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl text-left">
          <h3 className="text-base font-bold text-amber-300 mb-2 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" /> เติมคอยน์สร้างหนังสั้น (Coins Top-Up)
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            เติมคอยน์เพื่อไว้ทิป AI ผู้กำกับ และใช้ปลดล็อกฉากพิเศษ VIP Director Cut
          </p>

          <div className="space-y-3">
            {[
              { coinsAmt: 100, priceBaht: 50, bonus: 'โบนัส +10 คอยน์' },
              { coinsAmt: 300, priceBaht: 120, bonus: 'ยอดนิยม! โบนัส +40 คอยน์' },
              { coinsAmt: 1000, priceBaht: 350, bonus: 'คุ้มสุด! โบนัส +200 คอยน์' }
            ].map((pkg, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-4 rounded-2xl border border-amber-800/40 hover:border-amber-500 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>🪙 {pkg.coinsAmt} คอยน์</span>
                    <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                      {pkg.bonus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    เพียง ฿{pkg.priceBaht} บาท
                  </div>
                </div>

                <button
                  onClick={() => {
                    onTopUpCoins(pkg.coinsAmt);
                    alert(`เติมคอยน์สำเร็จ +${pkg.coinsAmt} คอยน์เข้าสู่กระเป๋าของคุณแล้ว!`);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md"
                >
                  เติมเงิน
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Custom Sponsor Modal */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-3">
          <div className="bg-slate-900 border border-emerald-600/80 w-full max-w-md rounded-3xl p-5 text-slate-100 shadow-2xl text-left">
            <h3 className="text-base font-bold text-emerald-300 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> เพิ่มสินค้าสปอนเซอร์ลงระบบ AI Auto Pipeline
            </h3>

            <form onSubmit={handleAddSponsorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อสินค้าสปอนเซอร์:</label>
                <input
                  type="text"
                  placeholder="เช่น ยาลมแก้ผีหลอน, สเปรย์ดับกลิ่นวิญญาณ..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">คำอธิบายสินค้า:</label>
                <input
                  type="text"
                  placeholder="สโลแกนสินค้าเด็ดๆ..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ราคา (บาท):</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">โค้ดส่วนลด:</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">อัตราค่าคอมมิชชั่น Affiliate:</label>
                <input
                  type="text"
                  value={newComm}
                  onChange={e => setNewComm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSponsorModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YouTube Shorts Export & Direct Real Upload Modal */}
      {showYouTubeModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-center p-3">
          <div className="bg-slate-900 border-2 border-red-500/80 w-full max-w-xl rounded-3xl p-6 text-slate-100 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-red-900/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-600 text-white font-black text-lg">
                  ▶
                </span>
                <div>
                  <h3 className="text-base font-black text-red-300">
                    โพสต์วิดีโอขึ้นช่อง YouTube จริงอัตโนมัติ (YouTube Data API v3)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    เชื่อมต่อ Google OAuth เพื่อส่งวิดีโอตรงเข้าช่อง YouTube Shorts ของคุณได้ใน 1 คลิก!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowYouTubeModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* YouTube Channel OAuth Connection Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-red-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {ytChannelInfo?.avatar ? (
                    <img src={ytChannelInfo.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-red-500" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-950 border border-red-600 flex items-center justify-center font-bold text-red-400 text-sm">
                      YT
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">
                        {ytConnected ? (ytChannelInfo?.title || 'ช่อง YouTube ของคุณ') : 'ยังไม่ได้เชื่อมต่อช่อง YouTube'}
                      </span>
                      {ytConnected && (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          ✓ เชื่อมต่อแล้ว
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ytConnected ? 'พร้อมสำหรับระบบ 1-Click Direct Upload' : 'สิทธิ์การอัปโหลด YouTube Shorts (https://www.googleapis.com/auth/youtube.upload)'}
                    </p>
                  </div>
                </div>

                {!ytConnected ? (
                  <button
                    onClick={handleConnectYouTube}
                    className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" /> เชื่อมต่อช่อง YouTube จริง
                  </button>
                ) : (
                  <button
                    onClick={() => handleDirectYouTubeUpload(stories[0])}
                    disabled={ytUploading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {ytUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />}
                    {ytUploading ? 'กำลังอัปโหลด...' : '🚀 โพสต์ขึ้น YouTube Shorts จริง'}
                  </button>
                )}
              </div>

              {/* Upload Result Display */}
              {ytUploadResult && (
                <div className="bg-emerald-950/80 border-2 border-emerald-500 p-4 rounded-2xl text-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      โพสต์ขึ้น YouTube Shorts จริงสำเร็จแล้ว!
                    </span>
                    <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-mono">
                      Video ID: {ytUploadResult.videoId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    วิดีโอถูกส่งไปยังช่อง YouTube ของคุณเรียบร้อยแล้ว พร้อมคำอธิบาย ป้ายยา Shopee Affiliate และแฮชแท็กครบถ้วน
                  </p>
                  <div className="pt-2 flex gap-2">
                    <a
                      href={ytUploadResult.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" /> ดูวิดีโอนี้บน YouTube Shorts
                    </a>
                  </div>
                </div>
              )}

              {/* Manual Refresh Token Option */}
              {!ytConnected && (
                <details className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-slate-400 text-[11px]">
                  <summary className="font-bold text-amber-300 cursor-pointer hover:text-amber-200">
                    🔑 หรือใส่ Refresh Token YouTube ด้วยตนเอง (Manual OAuth Token)
                  </summary>
                  <form onSubmit={handleSaveManualToken} className="mt-2 space-y-2">
                    <p className="text-slate-400">
                      หากคุณมี Google Refresh Token จาก Google Developer Console หรือ OAuth Playground สามารถระบุเพื่อล็อกอินตรงได้ทันที:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="วาง Google Refresh Token ที่นี่..."
                        value={ytManualToken}
                        onChange={(e) => setYtManualToken(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        บันทึก
                      </button>
                    </div>
                  </form>
                </details>
              )}

              <div className="bg-slate-950 p-4 rounded-2xl border border-red-900/50">
                <h4 className="font-bold text-amber-300 text-xs mb-1">
                  📌 ข้ออธิบายเกี่ยวกับคลิปและลิงก์ Shopee ในคลิป:
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  1. <strong className="text-emerald-400">ภาพเคลื่อนไหวแนวตั้ง 9:16</strong>: ระบบเรนเดอร์วิดีโอ MP4 HD แบบไดนามิก (มี Effect ซูม Ken Burns, ละอองไฟวิญญาณ, แถบคลื่นเสียง และซับไตเติลไฮไลท์ Karaoke) ให้เรียบร้อย
                </p>
                <p className="text-slate-300 leading-relaxed mt-1.5">
                  2. <strong className="text-amber-400">ทำไมลิงก์ Shopee บนหน้าจอวิดีโอถึงกดไม่ได้?</strong>: ในระบบ YouTube Shorts / TikTok วิดีโอไฟล์ MP4 เป็นไฟล์ภาพ Pixel ตัวอักษรบนภาพจึงไม่สามารถคลิกได้เหมือนหน้าเว็บ HTML
                </p>
                <p className="text-slate-200 font-bold bg-amber-950/60 p-2.5 rounded-xl border border-amber-600/50 mt-2">
                  💡 วิธีที่ระบบทำให้อัตโนมัติ: ระบบจะนำลิงก์ Shopee Affiliate และโค้ดส่วนลดของคุณไปใส่ไว้ใน <u>"คำอธิบายคลิป (Description)"</u> และเตรียมข้อความสำหรับ <u>"คอมเมนต์ปักหมุด (Pinned Comment)"</u> ให้ผู้ชมคลิกสั่งซื้อได้ทันที!
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-emerald-300 text-xs mb-2">
                  ✅ ขั้นตอนการโพสต์ลง YouTube Shorts:
                </h4>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-red-900/40">
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded mr-1.5">
                      วิธีที่ 1 (แนะนำ)
                    </span>
                    <strong className="text-slate-200">โพสต์ผ่านระบบอัตโนมัติ (1-Click Direct Upload)</strong>
                    <p className="text-slate-400 text-[11px] mt-1">กดปุ่ม "เชื่อมต่อช่อง YouTube" จากนั้นกด "🚀 โพสต์ขึ้น YouTube Shorts จริง" ระบบจะส่งคลิปตรงเข้าช่องของคุณทันที!</p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-emerald-900/40">
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded mr-1.5">
                      วิธีที่ 2
                    </span>
                    <strong className="text-slate-200">ดาวน์โหลด MP4 HD แล้วอัปโหลดเอง</strong>
                    <p className="text-slate-400 text-[11px] mt-1">กดปุ่ม "ดาวน์โหลด MP4 HD" เซฟลงเครื่อง แล้วนำไปอัปโหลดบน YouTube Studio พร้อมคัดลอกลิงก์ Shopee ปักหมุด</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" /> เปิด YouTube Studio
                  </a>

                  {ytConnected && (
                    <button
                      onClick={() => handleDirectYouTubeUpload(stories[0])}
                      disabled={ytUploading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {ytUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />}
                      โพสต์ขึ้น YouTube สด
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopyPinnedComment()}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
                  >
                    <Link2 className="w-4 h-4" /> คัดลอกลิงก์ Shopee ปักหมุด
                  </button>

                  <button
                    onClick={() => {
                      setShowYouTubeModal(false);
                      handleStartExport();
                    }}
                    disabled={isExporting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 animate-bounce" /> ดาวน์โหลด MP4 HD
                  </button>
                </div>
                <button
                  onClick={() => setShowYouTubeModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Video Rendering & Download Modal Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex justify-center items-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/80 w-full max-w-md rounded-3xl p-6 text-center text-slate-100 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
            
            <h3 className="text-lg font-black text-emerald-300 mb-1">
              กำลังเรนเดอร์และสร้างไฟล์วิดีโอ 9:16 HD...
            </h3>
            
            <p className="text-xs text-slate-400 mb-4">
              {exportStatusText || 'กำลังประมวลผลวิดีโอ...'}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 mb-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>สถานะ: {exportProgress}%</span>
              <span>กรุณารอไฟล์เด้งดาวน์โหลดอัตโนมัติ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
