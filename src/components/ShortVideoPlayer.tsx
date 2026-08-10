import React, { useState, useEffect, useRef } from 'react';
import { ShortStory, Scene, Comment } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { exportShortVideoMP4 } from '../utils/videoExporter';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  Lock,
  Unlock,
  Coins,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Award,
  Radio,
  Vote,
  Download,
  Loader2,
  Link2
} from 'lucide-react';

interface Props {
  story: ShortStory;
  onNextStory: () => void;
  onPrevStory: () => void;
  onLike: (storyId: string) => void;
  onUnlockVip: (storyId: string) => void;
  onTipCoins: (amount: number) => void;
  onVoteTwist: (storyId: string, choice: string) => void;
  coins: number;
}

export const ShortVideoPlayer: React.FC<Props> = ({
  story,
  onNextStory,
  onPrevStory,
  onLike,
  onUnlockVip,
  onTipCoins,
  onVoteTwist,
  coins,
}) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [localLikes, setLocalLikes] = useState<number>(story.likesCount);
  const [showCommentDrawer, setShowCommentDrawer] = useState<boolean>(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [showTwistVoteModal, setShowTwistVoteModal] = useState<boolean>(false);
  const [showTipModal, setShowTipModal] = useState<boolean>(false);
  const [selectedTwist, setSelectedTwist] = useState<string | null>(story.winningTwist || null);
  const [aspectRatioMode, setAspectRatioMode] = useState<'9:16' | '16:9'>('9:16');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatusText, setDownloadStatusText] = useState<string>('');

  const [ytUploading, setYtUploading] = useState<boolean>(false);

  const handleYouTubeDirectUpload = async () => {
    if (ytUploading) return;
    setYtUploading(true);
    try {
      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          privacyStatus: 'public'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.needAuth) {
          if (confirm('คุณยังไม่ได้เชื่อมต่อช่อง YouTube จริงของคุณ ต้องการกดเชื่อมต่อช่อง YouTube เดี๋ยวนี้หรือไม่?')) {
            const urlRes = await fetch('/api/auth/youtube/url').then(r => r.json());
            if (urlRes.authUrl) {
              window.location.href = urlRes.authUrl;
            } else {
              alert('ไม่สามารถเปิดหน้าเชื่อมต่อ Google OAuth ได้');
            }
          }
        } else {
          alert('เกิดข้อผิดพลาดในการโพสต์คลิปขึ้น YouTube: ' + data.error);
        }
      } else {
        alert(`🎉 โพสต์ขึ้น YouTube Shorts จริงสำเร็จแล้ว!\n\nชื่อวิดีโอ: ${data.title}\nURL วิดีโอ: ${data.videoUrl}`);
        window.open(data.videoUrl, '_blank');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setYtUploading(false);
    }
  };

  const handleCopyPinnedComment = () => {
    const sponsor = story.sponsorProduct;
    const textToCopy = `👻 [หนังสั้นสยองขวัญตลก] ${story.title}
${sponsor ? `🛍️ สินค้า Shopee ป้ายยาในคลิป: ${sponsor.name}\n👉 คลิกสั่งซื้อตรงนี้เลย: ${sponsor.linkUrl}\n🎁 โค้ดส่วนลดพิเศษ: ${sponsor.discountCode}\n` : ''}
#Shorts #GagGhostAI #ShopeeAffiliate #ผีตลก #หนังสั้นสยองขวัญ #ShopeeTH`;

    navigator.clipboard.writeText(textToCopy);
    alert(`📋 คัดลอกข้อความ + ลิงก์ Shopee เรียบร้อยแล้ว!\n\nนำข้อความนี้ไปวางใน "คอมเมนต์ปักหมุด (Pinned Comment)" หรือ "คำอธิบายคลิป (Description)" บน YouTube Shorts เพื่อให้ผู้ชมคลิกสั่งซื้อได้ 100%!`);
  };

  const handleDownloadMP4 = async () => {
    setIsDownloading(true);
    setDownloadProgress(5);
    setDownloadStatusText('กำลังเตรียมเรนเดอร์วิดีโอ 9:16...');

    try {
      await exportShortVideoMP4(story, (percent, status) => {
        setDownloadProgress(percent);
        setDownloadStatusText(status);
      });
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดวิดีโอ');
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, 1500);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scenesToPlay = story.vipUnlocked && story.vipTwistScene
    ? [...story.scenes, story.vipTwistScene]
    : story.scenes;

  const currentScene: Scene = scenesToPlay[currentSceneIdx] || story.scenes[0];

  // Fetch comments
  useEffect(() => {
    fetch(`/api/stories/${story.id}/comments`)
      .then(res => res.json())
      .then(data => {
        if (data.comments) setCommentsList(data.comments);
      })
      .catch(() => {});
  }, [story.id]);

  // Handle scene timeline progression & voiceover
  useEffect(() => {
    setCurrentSceneIdx(0);
    setIsPlaying(true);
  }, [story.id]);

  useEffect(() => {
    if (!isPlaying) {
      soundEngine.stopAllSpeech();
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let isSceneActive = true;

    const advanceScene = () => {
      if (!isSceneActive) return;
      if (currentSceneIdx < scenesToPlay.length - 1) {
        setCurrentSceneIdx(prev => prev + 1);
      } else {
        // End of movie -> check if twist choice vote popup should open
        if (!story.winningTwist && !selectedTwist) {
          setShowTwistVoteModal(true);
        }
      }
    };

    if (!isMuted && currentScene) {
      // Play sound effect
      soundEngine.playSFX(currentScene.sfx);

      // Speak narration and move to next scene when speech completes or timer expires
      const isComedy = currentScene.bgmMood === 'funny_twist' || currentSceneIdx === scenesToPlay.length - 1;
      soundEngine.speakThai(currentScene.narrationText, isComedy, () => {
        // Delay slightly after speech ends before advancing
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(advanceScene, 800);
      });
    }

    // Safety fallback timer if voiceover is muted or takes too long
    const durationMs = (currentScene?.durationSec || 7) * 1000;
    timerRef.current = setTimeout(advanceScene, durationMs);

    return () => {
      isSceneActive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSceneIdx, isPlaying, isMuted, story.id]);

  const handleLikeClick = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLocalLikes(prev => prev + 1);
      soundEngine.playSFX('comedy_boing');
      onLike(story.id);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    fetch(`/api/stories/${story.id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: 'คุณ (ผู้ชมไฮสปีด)', text: newCommentText })
    })
      .then(res => res.json())
      .then(data => {
        if (data.comment) {
          setCommentsList(prev => [data.comment, ...prev]);
          setNewCommentText('');
        }
      })
      .catch(() => {});
  };

  const handleVoteSubmit = (choice: string) => {
    setSelectedTwist(choice);
    setShowTwistVoteModal(false);
    onVoteTwist(story.id, choice);
    soundEngine.playSFX('comedy_boing');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] bg-slate-950 py-4 px-2">
      {/* Aspect Ratio Toggle Bar */}
      <div className="flex items-center gap-3 mb-3 bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full text-xs text-slate-300">
        <span className="text-slate-400 font-medium">โหมดมุมมอง:</span>
        <button
          onClick={() => setAspectRatioMode('9:16')}
          className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
            aspectRatioMode === '9:16'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📱 9:16 แนวตั้ง (TikTok/Reels)
        </button>
        <button
          onClick={() => setAspectRatioMode('16:9')}
          className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${
            aspectRatioMode === '16:9'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🖥️ 16:9 แนวนอน (YouTube Shorts)
        </button>
      </div>

      <div className="relative flex items-center justify-center max-w-full">
        {/* Short Player Frame Container */}
        <div
          className={`relative overflow-hidden bg-slate-900 rounded-3xl border-2 border-emerald-950 shadow-2xl shadow-emerald-950/80 transition-all ${
            aspectRatioMode === '9:16'
              ? 'w-[360px] sm:w-[400px] h-[640px] sm:h-[680px]'
              : 'w-[90vw] max-w-[800px] h-[450px]'
          }`}
        >
          {/* Visual Frame Image with Motion Ken Burns */}
          <div className="absolute inset-0 bg-black">
            {currentScene?.visualImageUrl ? (
              <img
                src={currentScene.visualImageUrl}
                alt={story.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transform scale-110 transition-transform duration-10000 ease-linear ${
                  isPlaying ? 'scale-125 translate-y-1' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-slate-400">
                <Sparkles className="w-12 h-12 animate-spin text-emerald-400" />
              </div>
            )}
            {/* Dark Vignette Overlay for Creepy Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/60 pointer-events-none" />
          </div>

          {/* Top Info Bar */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-slate-950 uppercase tracking-wider">
                {story.category}
              </span>
              <span className="text-xs text-slate-300 font-medium truncate max-w-[150px]">
                {story.creator}
              </span>
            </div>

            {/* Mute & Play Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-all"
                title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Timeline Scene Indicators (Top) */}
          <div className="absolute top-12 left-3 right-3 flex gap-1 z-20">
            {scenesToPlay.map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 rounded-full bg-slate-800 overflow-hidden"
              >
                <div
                  className={`h-full bg-emerald-400 transition-all duration-300 ${
                    idx < currentSceneIdx
                      ? 'w-full'
                      : idx === currentSceneIdx && isPlaying
                      ? 'w-full animate-pulse'
                      : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Title & Tagline Header (Upper Middle) */}
          <div className="absolute top-16 left-3 right-3 z-10 text-left">
            <h2 className="text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center gap-2">
              👻 {story.title}
            </h2>
            <p className="text-xs text-emerald-300 font-medium drop-shadow-md line-clamp-1">
              {story.tagline}
            </p>
          </div>

          {/* Subtitle narration text removed per requirement */}

          {/* Sponsor Product Affiliate Overlay (Shopee / Custom) */}
          {story.sponsorProduct && (
            <div className="absolute bottom-2 left-3 right-16 z-20">
              <a
                href={story.sponsorProduct.linkUrl || `https://shopee.co.th/search?keyword=${encodeURIComponent(story.sponsorProduct.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  // Directly open Shopee link in new tab without breaking or hiding player
                  const targetUrl = story.sponsorProduct?.linkUrl && story.sponsorProduct.linkUrl !== '#'
                    ? story.sponsorProduct.linkUrl
                    : `https://shopee.co.th/search?keyword=${encodeURIComponent(story.sponsorProduct?.name || 'สินค้า Shopee')}`;
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                }}
                className={`flex items-center gap-2 p-2 rounded-2xl text-left text-slate-100 shadow-xl group transition-all border ${
                  story.sponsorProduct.isShopeeProduct || story.sponsorProduct.linkUrl?.includes('shopee')
                    ? 'bg-gradient-to-r from-orange-950 via-slate-900 to-amber-950 border-orange-500/70 hover:border-orange-400'
                    : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/50 hover:border-emerald-400'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                  story.sponsorProduct.isShopeeProduct || story.sponsorProduct.linkUrl?.includes('shopee')
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-950'
                    : 'bg-emerald-900 text-emerald-300'
                }`}>
                  {story.sponsorProduct.isShopeeProduct ? '🛍️' : <ShoppingBag className="w-4 h-4 text-emerald-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      story.sponsorProduct.isShopeeProduct
                        ? 'bg-orange-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950'
                    }`}>
                      {story.sponsorProduct.isShopeeProduct ? 'Shopee Affiliate' : 'สปอนเซอร์'}
                    </span>
                    <span className="text-xs font-bold text-orange-200 truncate">
                      {story.sponsorProduct.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-amber-300">
                      ฿{story.sponsorProduct.price}
                    </span>
                    {story.sponsorProduct.shopeeRating && (
                      <span className="text-[10px] text-amber-400 font-bold">
                        ⭐ {story.sponsorProduct.shopeeRating}
                      </span>
                    )}
                    {story.sponsorProduct.shopeeSoldAmount && (
                      <span className="text-[10px] text-slate-400">
                        {story.sponsorProduct.shopeeSoldAmount}
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-800 text-orange-300 px-1 rounded border border-orange-900/60 font-mono">
                      โค้ด: {story.sponsorProduct.discountCode}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-orange-400 group-hover:scale-110 shrink-0 mr-1" />
              </a>
            </div>
          )}

          {/* Right Action Sidebar (TikTok/Reels format) */}
          <div className="absolute right-2 bottom-12 z-30 flex flex-col items-center gap-4">
            {/* Like Button */}
            <button
              onClick={handleLikeClick}
              className="flex flex-col items-center group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                  isLiked
                    ? 'bg-red-600 text-white scale-110 shadow-lg shadow-red-900/50'
                    : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-200 mt-1">
                {localLikes >= 1000 ? `${(localLikes / 1000).toFixed(1)}k` : localLikes}
              </span>
            </button>

            {/* Comment Drawer Button */}
            <button
              onClick={() => setShowCommentDrawer(!showCommentDrawer)}
              className="flex flex-col items-center group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center transition-all">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-200 mt-1">
                {commentsList.length || story.commentsCount}
              </span>
            </button>

            {/* Twist Vote Button */}
            <button
              onClick={() => setShowTwistVoteModal(true)}
              className="flex flex-col items-center group"
              title="โหวตจุดหักมุม"
            >
              <div className="w-10 h-10 rounded-full bg-purple-950/80 text-purple-300 hover:bg-purple-900 border border-purple-600/60 flex items-center justify-center transition-all">
                <Vote className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[10px] font-bold text-purple-300 mt-1">
                โหวตหักมุม
              </span>
            </button>

            {/* VIP Director Cut Unlock */}
            {story.vipTwistScene && (
              <button
                onClick={() => {
                  if (story.vipUnlocked) {
                    alert('คุณได้ปลดล็อกฉากพิเศษ VIP แล้ว!');
                  } else {
                    if (coins >= 50) {
                      onUnlockVip(story.id);
                      soundEngine.playSFX('comedy_boing');
                    } else {
                      alert('คอยน์ไม่พอ! ต้องการ 50 คอยน์เพื่อปลดล็อกฉากพิเศษ');
                    }
                  }
                }}
                className="flex flex-col items-center group"
                title="ปลดล็อกฉากหักมุมพิเศษ VIP"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    story.vipUnlocked
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/50'
                      : 'bg-amber-950/90 text-amber-400 hover:bg-amber-900 border border-amber-600/80'
                  }`}
                >
                  {story.vipUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-bold text-amber-300 mt-1">
                  {story.vipUnlocked ? 'VIP ปลดแล้ว' : '50 คอยน์'}
                </span>
              </button>
            )}

            {/* Tip Director */}
            <button
              onClick={() => setShowTipModal(true)}
              className="flex flex-col items-center group"
              title="ทิปสนับสนุน AI ผู้กำกับ"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-600/60 flex items-center justify-center transition-all">
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-300 mt-1">
                ทิป AI
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('คัดลอกลิงก์แชร์หนังสั้นเรียบร้อยแล้ว!');
              }}
              className="flex flex-col items-center group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center transition-all">
                <Share2 className="w-5 h-5 text-teal-300" />
              </div>
              <span className="text-[10px] font-bold text-slate-200 mt-1">
                แชร์
              </span>
            </button>

            {/* Copy Pinned Link Button */}
            <button
              onClick={handleCopyPinnedComment}
              className="flex flex-col items-center group"
              title="คัดลอกลิงก์ Shopee ไปวางในคอมเมนต์ปักหมุด YouTube Shorts"
            >
              <div className="w-10 h-10 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-500/80 text-amber-300 flex items-center justify-center transition-all shadow-lg">
                <Link2 className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-amber-300 mt-1">
                ลิงก์ปักหมุด
              </span>
            </button>

            {/* 1-Click Direct YouTube Upload Button */}
            <button
              onClick={handleYouTubeDirectUpload}
              disabled={ytUploading}
              className="flex flex-col items-center group"
              title="โพสต์วิดีโอนี้ขึ้น YouTube Shorts จริงทันที"
            >
              <div className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white hover:scale-110 border border-red-400 flex items-center justify-center transition-all shadow-lg shadow-red-950">
                {ytUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="font-black text-xs">▶</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-red-300 mt-1">
                {ytUploading ? 'กำลังอัปโหลด' : 'โพสต์ YouTube'}
              </span>
            </button>

            {/* Download MP4 HD Button */}
            <button
              onClick={handleDownloadMP4}
              disabled={isDownloading}
              className="flex flex-col items-center group"
              title="ดาวน์โหลดไฟล์วิดีโอ MP4 HD"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white hover:scale-110 border border-emerald-400/80 flex items-center justify-center transition-all shadow-lg shadow-emerald-950">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <span className="text-[10px] font-bold text-emerald-300 mt-1">
                โหลด MP4
              </span>
            </button>
          </div>
        </div>

        {/* Up / Down Navigation Controls (Next/Prev story) */}
        <div className="flex flex-col gap-3 ml-3 sm:ml-4">
          <button
            onClick={onPrevStory}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60 shadow-lg hover:scale-105 transition-all"
            title="เรื่องก่อนหน้า (ปัดขึ้น)"
          >
            <ChevronUp className="w-6 h-6 text-emerald-400" />
          </button>
          <button
            onClick={onNextStory}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60 shadow-lg hover:scale-105 transition-all"
            title="เรื่องถัดไป (ปัดลง)"
          >
            <ChevronDown className="w-6 h-6 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Comment Drawer */}
      {showCommentDrawer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end sm:items-center p-2">
          <div className="bg-slate-900 border border-emerald-900/50 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-4 text-slate-100 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
              <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                💬 คอมเมนต์สยองฮา ({commentsList.length})
              </h3>
              <button
                onClick={() => setShowCommentDrawer(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ปิด ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-3 text-left">
              {commentsList.map(c => (
                <div key={c.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-300 mb-1">
                    <span>{c.userAvatar} {c.userName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{c.timeAgo}</span>
                  </div>
                  <p className="text-slate-200">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="พิมพ์คอมเมนต์ตลกสยอง..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                ส่ง
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Twist Voting Modal */}
      {showTwistVoteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-3">
          <div className="bg-slate-900 border-2 border-purple-600/80 w-full max-w-md rounded-3xl p-5 text-slate-100 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center mx-auto mb-3 text-2xl border border-purple-600">
              🗳️
            </div>
            <h3 className="text-lg font-black text-purple-300 mb-1">
              ผู้ชมเลือกจุดหักมุมเอง! (Interactive Twist)
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              คุณต้องการให้ผีเรื่องนี้หักมุมลงเอยด้วยฉากไหน?
            </p>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => handleVoteSubmit(story.twistChoiceA)}
                className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  selectedTwist === story.twistChoiceA
                    ? 'bg-purple-900/90 border-purple-400 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-purple-600'
                }`}
              >
                <span>Option A: {story.twistChoiceA}</span>
                <span className="text-emerald-400 font-extrabold text-[10px] bg-emerald-950 px-2 py-0.5 rounded">
                  ยอดนิยม 68%
                </span>
              </button>

              <button
                onClick={() => handleVoteSubmit(story.twistChoiceB)}
                className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  selectedTwist === story.twistChoiceB
                    ? 'bg-purple-900/90 border-purple-400 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-purple-600'
                }`}
              >
                <span>Option B: {story.twistChoiceB}</span>
                <span className="text-purple-400 font-extrabold text-[10px] bg-purple-950 px-2 py-0.5 rounded">
                  ฮากริบ 32%
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowTwistVoteModal(false)}
              className="text-xs text-slate-400 underline hover:text-slate-200"
            >
              ข้ามไปก่อน
            </button>
          </div>
        </div>
      )}

      {/* Tip Director Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-3">
          <div className="bg-slate-900 border-2 border-emerald-600/80 w-full max-w-sm rounded-3xl p-5 text-slate-100 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-2xl border border-emerald-600">
              🪙
            </div>
            <h3 className="text-lg font-black text-emerald-300 mb-1">
              ทิปสนับสนุน AI ผู้กำกับหนังสั้น
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              คอยน์ทิปจะถูกนำไปจ่ายค่าประมวลผล AI เพื่อผลิตคลิปอัตโนมัติ 24 ช.ม.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[20, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    if (coins >= amount) {
                      onTipCoins(amount);
                      setShowTipModal(false);
                      soundEngine.playSFX('comedy_boing');
                      alert(`ขอบคุณสำหรับการทิป ${amount} คอยน์! AI กำลังปั๊มคลิปเรื่องใหม่ให้ต่อทันที!`);
                    } else {
                      alert('คอยน์ไม่พอ สามารถเติมคอยน์ได้ที่ศูนย์สร้างรายได้!');
                    }
                  }}
                  className="bg-slate-950 hover:bg-emerald-950 border border-emerald-800/60 p-3 rounded-2xl flex flex-col items-center gap-1 transition-all"
                >
                  <span className="text-base font-black text-amber-300">🪙 {amount}</span>
                  <span className="text-[10px] text-slate-400">คอยน์</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTipModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Live Video Render & Export Progress Modal */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex justify-center items-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/80 w-full max-w-md rounded-3xl p-6 text-center text-slate-100 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>

            <h3 className="text-lg font-black text-emerald-300 mb-1">
              กำลังเรนเดอร์และสร้างไฟล์วิดีโอ 9:16 HD...
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              {downloadStatusText || 'กำลังประมวลผลวิดีโอ...'}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 mb-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>สถานะ: {downloadProgress}%</span>
              <span>กรุณารอไฟล์เด้งดาวน์โหลดอัตโนมัติ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
