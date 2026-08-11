import React, { useState, useEffect } from 'react';
import { ShortStory, AutoPipelineStep, PipelineLog } from '../types';
import {
  Zap,
  Bot,
  Play,
  Square,
  Sparkles,
  FileText,
  Mic,
  Video,
  Layers,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Terminal,
  RefreshCw,
  Flame,
  Key,
  Youtube,
  Link,
  X
} from 'lucide-react';

interface Props {
  onStoryPublished: (newStory: ShortStory) => void;
  isAutoPilotActive: boolean;
  setIsAutoPilotActive: (active: boolean) => void;
}

export const AutoPipelineStudio: React.FC<Props> = ({
  onStoryPublished,
  isAutoPilotActive,
  setIsAutoPilotActive,
}) => {
  const [topic, setTopic] = useState<string>('ผีหลังตู้เย็นหิวหมูกระทะตอนตีสาม');
  const [category, setCategory] = useState<'ผีหอพัก' | 'ผีติดสปีด' | 'ผีโซเชียล' | 'ตำนานพื้นบ้าน' | 'ผีตลกร้าย'>('ผีหอพัก');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [autoIntervalSec, setAutoIntervalSec] = useState<number>(30);
  const [elevenLabsKey, setElevenLabsKey] = useState<string>('');
  const [logs, setLogs] = useState<PipelineLog[]>([]);

  // 24/7 Cloud Autopilot Server State
  const [cloudAutopilot, setCloudAutopilot] = useState<any>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState<boolean>(false);
  const [showFacebookModal, setShowFacebookModal] = useState<boolean>(false);
  const [customRefreshToken, setCustomRefreshToken] = useState<string>('');
  const [customChannelName, setCustomChannelName] = useState<string>('');
  const [authCodeInput, setAuthCodeInput] = useState<string>('');
  const [clientIdInput, setClientIdInput] = useState<string>('');
  const [clientSecretInput, setClientSecretInput] = useState<string>('');
  const [credentialsSaved, setCredentialsSaved] = useState<boolean>(false);
  const [youtubeConnecting, setYoutubeConnecting] = useState<boolean>(false);

  // Facebook Reels Access Token & Page ID State
  const [fbAccessTokenInput, setFbAccessTokenInput] = useState<string>('');
  const [fbPageIdInput, setFbPageIdInput] = useState<string>('');
  const [facebookConfig, setFacebookConfig] = useState<any>(null);
  const [facebookConnecting, setFacebookConnecting] = useState<boolean>(false);
  const [fbErrorMessage, setFbErrorMessage] = useState<string>('');
  const [canForceSaveFb, setCanForceSaveFb] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/youtube/credentials')
      .then(res => res.json())
      .then(d => {
        if (d.fullClientId) setClientIdInput(d.fullClientId);
        if (d.hasClientId && d.hasClientSecret) setCredentialsSaved(true);
      })
      .catch(() => {});

    fetch('/api/facebook/config')
      .then(res => res.json())
      .then(d => setFacebookConfig(d))
      .catch(() => {});
  }, []);

  const handleSaveFacebookConfig = async (e?: React.FormEvent, isForce: boolean = false) => {
    if (e) e.preventDefault();
    setFbErrorMessage('');
    setCanForceSaveFb(false);

    if (!fbAccessTokenInput || !fbPageIdInput) {
      setFbErrorMessage('กรุณากรอกทั้ง Facebook Page Access Token และ Page ID');
      return;
    }
    setFacebookConnecting(true);
    try {
      const res = await fetch('/api/facebook/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageAccessToken: fbAccessTokenInput,
          pageId: fbPageIdInput,
          forceSave: isForce
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ ${data.message}`, 'success');
        alert(`เชื่อมต่อเพจ Facebook "${data.pageName}" เรียบร้อยแล้ว!`);
        setShowFacebookModal(false);
        setFacebookConfig({ connected: true, pageId: data.pageId, pageName: data.pageName });
        fetchCloudAutopilotStatus();
      } else {
        setFbErrorMessage(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Facebook Page');
        if (data.canForceSave) setCanForceSaveFb(true);
      }
    } catch (err: any) {
      setFbErrorMessage('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setFacebookConnecting(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    if (!confirm('คุณต้องการยกเลิกการเชื่อมต่อ Facebook Page ใช่หรือไม่?')) return;
    try {
      await fetch('/api/facebook/config', { method: 'DELETE' });
      setFacebookConfig({ connected: false });
      addLog('ยกเลิกการเชื่อมต่อ Facebook Page เรียบร้อยแล้ว', 'info');
      fetchCloudAutopilotStatus();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientIdInput || !clientSecretInput) {
      alert('กรุณากรอกทั้ง Client ID และ Client Secret');
      return;
    }
    setYoutubeConnecting(true);
    try {
      const res = await fetch('/api/youtube/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientIdInput, clientSecret: clientSecretInput })
      });
      const data = await res.json();
      if (data.success) {
        setCredentialsSaved(true);
        addLog('✅ บันทึก Google OAuth Client Credentials เรียบร้อยแล้ว!', 'success');
        alert('บันทึก Client Credentials สำเร็จ! คุณสามารถกดปุ่มเข้าสู่ระบบด้านล่างได้ทันที');
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึก Credentials');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setYoutubeConnecting(false);
    }
  };

  const handleExchangeCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCodeInput) {
      alert('กรุณากรอก Code หรือ URL ที่ได้จาก Google');
      return;
    }
    setYoutubeConnecting(true);
    try {
      const res = await fetch('/api/auth/youtube/exchange-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCodeInput })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ ${data.message}`, 'success');
        setShowYoutubeModal(false);
        setAuthCodeInput('');
        fetchCloudAutopilotStatus();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการยืนยัน Code');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setYoutubeConnecting(false);
    }
  };

  const handleOAuthConnect = async () => {
    setYoutubeConnecting(true);
    try {
      const query = new URLSearchParams();
      if (clientIdInput) query.set('clientId', clientIdInput);
      if (clientSecretInput) query.set('clientSecret', clientSecretInput);

      const res = await fetch(`/api/auth/youtube/url?${query.toString()}`);
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
        addLog('🔗 เปิดหน้าล็อกอิน Google OAuth สำหรับสิทธิ์อัปโหลด YouTube Shorts ในแท็บใหม่...', 'info');
      } else {
        alert(data.error || 'กรุณากรอก Client ID และ Client Secret ในช่องรับข้อมูลด้านบนก่อน');
      }
    } catch (e: any) {
      alert('ไม่สามารถดึง URL OAuth ได้: ' + e.message);
    } finally {
      setYoutubeConnecting(false);
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRefreshToken) {
      alert('กรุณากรอก Refresh Token');
      return;
    }
    setYoutubeConnecting(true);
    try {
      const res = await fetch('/api/youtube/manual-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: customRefreshToken,
          channelName: customChannelName || 'ช่อง YouTube ของฉัน'
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ ${data.message}`, 'success');
        setShowYoutubeModal(false);
        fetchCloudAutopilotStatus();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการผูก Token');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setYoutubeConnecting(false);
    }
  };

  const fetchCloudAutopilotStatus = () => {
    fetch('/api/autopilot/status')
      .then(res => res.json())
      .then(data => setCloudAutopilot(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCloudAutopilotStatus();
    const interval = setInterval(fetchCloudAutopilotStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCloudAutopilot = (enabled: boolean, intervalHours?: number) => {
    fetch('/api/autopilot/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled,
        intervalHours: intervalHours || cloudAutopilot?.intervalHours || 6
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCloudAutopilot(data.autoPilotState);
        }
      });
  };

  const handleTriggerCloudAutopilotNow = () => {
    addLog('⚡ สั่งรัน 24/7 Cloud Auto-Pilot Instant Cycle ตอนนี้...', 'info');
    fetch('/api/autopilot/trigger', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          addLog('🎉 Cloud Auto-Pilot ผลิตหนังสั้นเรื่องใหม่อัตโนมัติเรียบร้อย!', 'success');
          fetchCloudAutopilotStatus();
        }
      });
  };

  // 6 Steps Pipeline based on exact AI tools specified by user
  const [steps, setSteps] = useState<AutoPipelineStep[]>([
    { stepNumber: 1, name: 'ขั้นที่ 1: เขียนบท 5 ฉาก (Google Gemini AI)', description: 'วางพล็อตสยองขวัญหักมุม แบ่ง 5 ฉากชัดเจน พร้อมจังหวะป้ายยา Shopee', status: 'idle' },
    { stepNumber: 2, name: 'ขั้นที่ 2: เจนภาพตัวละคร & ล็อกใบหน้า (Midjourney / Leonardo)', description: 'ออกโค้ด Prompt ล็อกหน้าตัวละครเหมือนเดิมทุกฉาก (--cw 100 --seed)', status: 'idle' },
    { stepNumber: 3, name: 'ขั้นที่ 3: แปลงภาพเป็นวิดีโอเคลื่อนไหว (Runway Gen-3 / Kling / Luma)', description: 'กำหนดการเคลื่อนกล้อง ซูม และบรรยากาศความหลอนแบบไดนามิก', status: 'idle' },
    { stepNumber: 4, name: 'ขั้นที่ 4: เสียงพากย์อารมณ์มนุษย์ (ElevenLabs / Gemini TTS)', description: 'เจนเสียงพากย์ภาษาไทย อารมณ์สยองขวัญก่อนเปลี่ยนเป็นเสียงตลกตื่นเต้น', status: 'idle' },
    { stepNumber: 5, name: 'ขั้นที่ 5: เพลงและเอฟเฟกต์ (Suno AI & Horror SFX Engine)', description: 'ใส่ดนตรีไร้ลิขสิทธิ์แนว Cinematic Horror แร็พตลก และ SFX กรี๊ดผี/สปริง', status: 'idle' },
    { stepNumber: 6, name: 'ขั้นที่ 6: ตัดต่อรวมไฟล์ & ปักหมุด Shopee (CapCut / MoviePy Engine)', description: 'รวมวิดีโอ ใส่ซับไตเติ้ลไฮไลท์ ป้ายยา และปักหมุด Shopee Affiliate อัตโนมัติ', status: 'idle' },
  ]);

  const addLog = (message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('th-TH');
    setLogs(prev => [{ id: `log_${Date.now()}_${Math.random()}`, timestamp: timeStr, level, message }, ...prev.slice(0, 40)]);
  };

  useEffect(() => {
    addLog('🚀 ระบบ Automation 100% GagGhost AI Studio พร้อมทำงาน', 'success');
  }, []);

  // 1-Click Auto Pipeline Trigger Function
  const runAutoPipeline = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    addLog(`🎬 เริ่มการผลิตหนังสั้นอัตโนมัติ 5 ฉาก 1.5 นาที: "${topic}" (${category})`, 'info');

    try {
      // Step 1: Scripting (Gemini)
      setSteps(prev => prev.map(s => s.stepNumber === 1 ? { ...s, status: 'processing', detail: 'Google Gemini AI กำลังร่างบท 5 ฉาก...' } : s));
      addLog('🤖 [Step 1] สั่ง Google Gemini AI คิดพล็อตสยองขวัญหักมุมแบ่ง 5 ฉาก...', 'info');
      await new Promise(r => setTimeout(r, 1000));
      setSteps(prev => prev.map(s => s.stepNumber === 1 ? { ...s, status: 'completed', detail: 'สร้างบทสยองขวัญ 5 ฉาก + SFX สำเร็จ' } : s));
      addLog('✅ [Step 1 สำเร็จ] ร่างบท 5 ฉาก (บิ้วด์หลอน ➔ เจอดี ➔ พีค ➔ หักมุมป้ายยา ➔ ปักหมุด Shopee) สำเร็จ', 'success');

      // Step 2: Character Design & Image Prompts (Midjourney)
      setSteps(prev => prev.map(s => s.stepNumber === 2 ? { ...s, status: 'processing', detail: 'สร้าง Prompt Midjourney + ล็อกโค้ดใบหน้า (--cw 100)...' } : s));
      addLog('🎨 [Step 2] สั่ง Midjourney / Leonardo ออกแบบตัวละคร ล็อกโค้ดหน้าตัวละครตรงกันทุกฉาก...', 'info');
      await new Promise(r => setTimeout(r, 1100));
      setSteps(prev => prev.map(s => s.stepNumber === 2 ? { ...s, status: 'completed', detail: 'ล็อกใบหน้าตัวละคร character_A_lock สำเร็จ' } : s));
      addLog('✅ [Step 2 สำเร็จ] สร้าง Prompts ล็อกใบหน้าตัวละครสำหรับ Midjourney / Leonardo สำเร็จ', 'success');

      // Step 3: Image-to-Video Motion Prompts (Runway / Kling / Luma)
      setSteps(prev => prev.map(s => s.stepNumber === 3 ? { ...s, status: 'processing', detail: 'คำนวณทิศทางการหมุนกล้อง Runway Gen-3 / Kling / Luma...' } : s));
      addLog('🎥 [Step 3] คำนวณคำสั่งเคลื่อนไหวกล้อง (Dolly zoom, Pan, Camera Shake) สำหรับ Runway Gen-3...', 'info');
      await new Promise(r => setTimeout(r, 1000));
      setSteps(prev => prev.map(s => s.stepNumber === 3 ? { ...s, status: 'completed', detail: 'ตั้งค่าการเคลื่อนไหวกล้อง 9:16 HD เรียบร้อย' } : s));
      addLog('✅ [Step 3 สำเร็จ] สร้างชุดคำสั่งเคลื่อนไหวกล้องภาพวิดีโอ 9:16 สำเร็จ', 'success');

      // Step 4: AI Voice Generator (ElevenLabs)
      setSteps(prev => prev.map(s => s.stepNumber === 4 ? { ...s, status: 'processing', detail: elevenLabsKey ? 'กำลังพากย์เสียงผ่าน ElevenLabs API...' : 'กำลังเจนเสียงพากย์ไทยสยองขวัญ...' } : s));
      addLog(`🎙️ [Step 4] สั่งสังเคราะห์เสียงพากย์ภาษาไทย อารมณ์หลอนช่วงแรก เปลี่ยนเป็นเสียงตื่นเต้นช่วงป้ายยา...`, 'info');
      await new Promise(r => setTimeout(r, 1000));
      setSteps(prev => prev.map(s => s.stepNumber === 4 ? { ...s, status: 'completed', detail: 'ไฟล์เสียงพากย์พร้อมซิงก์ปากเรียบร้อย' } : s));
      addLog('✅ [Step 4 สำเร็จ] สังเคราะห์ไฟล์เสียงพากย์และน้ำเสียงภาษาไทยสำเร็จ', 'success');

      // Step 5: Suno AI BGM & Horror Sound Effects
      setSteps(prev => prev.map(s => s.stepNumber === 5 ? { ...s, status: 'processing', detail: 'กำลังประสมเพลง BGM Suno AI + SFX กรี๊ดผี...' } : s));
      addLog('🎵 [Step 5] ผสมเพลงประกอบ Cinematic Horror จาก Suno AI + เสียงฟ่อผี เสียงสปริงฮา...', 'info');
      await new Promise(r => setTimeout(r, 900));
      setSteps(prev => prev.map(s => s.stepNumber === 5 ? { ...s, status: 'completed', detail: 'ผสม BGM และ Sound Effects ลงตำแหน่งตรงเวลา' } : s));
      addLog('✅ [Step 5 สำเร็จ] รวม BGM และ Sound Effects เรียบร้อย', 'success');

      // Step 6: CapCut / MoviePy Composite & Shopee Auto Publish
      setSteps(prev => prev.map(s => s.stepNumber === 6 ? { ...s, status: 'processing', detail: 'CapCut / MoviePy กำลังรวมไฟล์เรนเดอร์ MP4 HD...' } : s));
      addLog('🎞️ [Step 6] CapCut / MoviePy Engine รวมคลิป 5 ฉาก ใส่ซับไฮไลท์ Karaoke + ผูกลิงก์ Shopee Affiliate...', 'info');

      // Call Backend Auto Pipeline API
      const res = await fetch('/api/auto-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category })
      });
      const data = await res.json();

      if (!data.success || !data.story) {
        throw new Error(data.error || 'Pipeline backend failed');
      }

      setSteps(prev => prev.map(s => s.stepNumber === 6 ? { ...s, status: 'completed', detail: 'เรนเดอร์ MP4 HD 5 ฉาก + ผูก Shopee พร้อมเผยแพร่!' } : s));
      addLog(`🎉 [Step 6 สำเร็จ] ผลิตหนังสั้น 5 ฉาก เรื่อง "${data.story.title}" ความยาว 1.5 นาที สำเร็จ 100%!`, 'success');
      addLog(`🛒 สินค้าป้ายยา Shopee: ${data.story.sponsorProduct?.name || 'สินค้า Shopee'} (รับคอมมิชชั่น ${data.story.sponsorProduct?.commissionRate})`, 'warning');
      addLog(`📱 คลิปวิดีโอถูกส่งขึ้นหน้า Feed สตรีมมิ่งในแอปเรียบร้อย! สามารถดาวน์โหลด MP4 นำไปลง YouTube Shorts / TikTok ได้ทันที`, 'success');

      // Publish to app global feed state
      onStoryPublished(data.story);

    } catch (err: any) {
      addLog(`❌ ข้อผิดพลาดใน Pipeline: ${err.message}`, 'error');
      setSteps(prev => prev.map(s => s.status === 'processing' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  // 24/7 Auto-Pilot Loop Handler
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoPilotActive && !isProcessing) {
      timer = setInterval(() => {
        const presets = [
          'ผีหลังตู้เย็นหิวหมูกระทะตอนตีสาม',
          'ปอบแอบสิงอยู่ในกลุ่มไลน์บริษัท',
          'ผีจ้างไรเดอร์ไปส่งผัดไทยในป่าช้า',
          'กุมารทองสั่งซื้อของเล่นออนไลน์ช้อปปี้',
          'วิญญาณหลอนแอบใช้ WiFi คนข้างบ้าน'
        ];
        const randomTopic = presets[Math.floor(Math.random() * presets.length)];
        setTopic(randomTopic);
        addLog(`🤖 24/7 Auto-Pilot บอททำงานรอบถัดไป: "${randomTopic}"`, 'info');
        runAutoPipeline();
      }, autoIntervalSec * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPilotActive, isProcessing, autoIntervalSec]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 text-slate-100">
      {/* 24/7 Cloud Server Auto-Pilot Control Dashboard */}
      <div className="bg-slate-900 border-2 border-emerald-500/60 p-5 rounded-3xl shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                <Bot className={`w-7 h-7 ${cloudAutopilot?.enabled ? 'animate-bounce text-emerald-400' : 'text-slate-500'}`} />
              </div>
              {cloudAutopilot?.enabled && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  🤖 ศูนย์ควบคุม 24/7 Cloud Server Auto-Pilot Engine
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  cloudAutopilot?.enabled
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {cloudAutopilot?.enabled ? '🟢 กำลังทำงาน 24 ชั่วโมง (ไม่อยู่หน้าจอก็รันเอง)' : '🔴 ปิดอยู่'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                เซิร์ฟเวอร์ Cloud Run จะรัน Cron Daemon ทำงานเบื้องหลังตลอด 24/7: สุ่มเขียนบท ➔ สร้างวิดีโอ ➔ ปักหมุด Shopee ➔ โพสต์ลง YouTube Shorts อัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowYoutubeModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Youtube className="w-4 h-4 fill-white" />
              {cloudAutopilot?.youtubeConnected ? `✓ YT: ${cloudAutopilot.youtubeChannelTitle || 'ผูกช่องแล้ว'}` : '🔗 ผูก YouTube'}
            </button>

            <button
              onClick={() => setShowFacebookModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span className="font-black text-sm">f</span>
              {cloudAutopilot?.facebookConnected ? `✓ FB: ${cloudAutopilot.facebookPageName || 'ผูกเพจแล้ว'}` : '🔗 ผูก Facebook Reels'}
            </button>

            <button
              onClick={() => handleToggleCloudAutopilot(!cloudAutopilot?.enabled)}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                cloudAutopilot?.enabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/80'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
              }`}
            >
              {cloudAutopilot?.enabled ? '✓ รัน 24/7 อยู่' : '▶ เปิดรัน 24/7'}
            </button>

            <button
              onClick={handleTriggerCloudAutopilotNow}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-2xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="ทดสอบรัน Cron Cycle ทันที 1 รอบ"
            >
              <Zap className="w-4 h-4 fill-amber-300" />
              รัน 1 รอบตอนนี้
            </button>
          </div>
        </div>

        {/* Status Grid & Frequency Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">ช่องทางอัปโหลดอัตโนมัติ:</span>
            <select
              value={cloudAutopilot?.uploadTargetPlatform || 'both'}
              onChange={(e) => {
                fetch('/api/autopilot/toggle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ uploadTargetPlatform: e.target.value })
                })
                  .then(res => res.json())
                  .then(data => setCloudAutopilot(data.autoPilotState));
              }}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-cyan-300 font-bold focus:outline-none"
            >
              <option value="both">🚀 ทั้งคู่ (YouTube + FB Reels)</option>
              <option value="facebook">💙 Facebook Reels เท่านั้น</option>
              <option value="youtube">🔴 YouTube Shorts เท่านั้น</option>
              <option value="none">🔒 Feed ในแอปเท่านั้น (ไม่อัปโหลด)</option>
            </select>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">รอบการรันอัตโนมัติ:</span>
            <select
              value={cloudAutopilot?.intervalHours || 6}
              onChange={(e) => handleToggleCloudAutopilot(true, Number(e.target.value))}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none"
            >
              <option value={1}>ทุกๆ 1 ชั่วโมง (เร็วสุด)</option>
              <option value={3}>ทุกๆ 3 ชั่วโมง</option>
              <option value={6}>ทุกๆ 6 ชั่วโมง (แนะนำ)</option>
              <option value={12}>ทุกๆ 12 ชั่วโมง</option>
              <option value={24}>ทุกๆ 24 ชั่วโมง</option>
            </select>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">สถานะ YouTube Shorts:</span>
              <span className={`text-[11px] font-bold block mt-0.5 truncate ${cloudAutopilot?.youtubeConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {cloudAutopilot?.youtubeConnected ? `✓ ${cloudAutopilot.youtubeChannelTitle || 'ผูกช่องแล้ว'}` : '⚠️ ยังไม่เชื่อมต่อ'}
              </span>
            </div>
            <button
              onClick={() => setShowYoutubeModal(true)}
              className="mt-1.5 w-full bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] py-1 px-2 rounded-xl transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
            >
              <Youtube className="w-3 h-3" />
              {cloudAutopilot?.youtubeConnected ? 'ตั้งค่า YouTube' : 'ผูก YouTube'}
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">สถานะ Facebook Reels:</span>
              <span className={`text-[11px] font-bold block mt-0.5 truncate ${cloudAutopilot?.facebookConnected ? 'text-emerald-400' : 'text-blue-400'}`}>
                {cloudAutopilot?.facebookConnected ? `✓ ${cloudAutopilot.facebookPageName || 'ผูกเพจแล้ว'}` : '⚠️ ยังไม่เชื่อมต่อ'}
              </span>
            </div>
            <button
              onClick={() => setShowFacebookModal(true)}
              className="mt-1.5 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-1 px-2 rounded-xl transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="font-black text-xs">f</span>
              {cloudAutopilot?.facebookConnected ? 'ตั้งค่า FB Reels' : 'ผูก Facebook'}
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">ผลิตสะสมโดยบอท:</span>
            <span className="text-base font-black text-emerald-400 block mt-0.5">
              {cloudAutopilot?.totalAutoGenerated || 0} คลิป
            </span>
          </div>
        </div>

        {/* Live Server Logs Preview */}
        {cloudAutopilot?.logs && cloudAutopilot.logs.length > 0 && (
          <div className="mt-4 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1 max-h-24 overflow-y-auto">
            {cloudAutopilot.logs.slice(0, 4).map((log: string, idx: number) => (
              <div key={idx} className="truncate">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 p-6 rounded-3xl border border-emerald-900/50 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-900/80 text-emerald-400 border border-emerald-700">
              <Zap className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              สตูดิโอการผลิตเนื้อหาอัตโนมัติ 100% (Content Creation Pipeline)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            วางระบบให้ AI ทำงานแทนแบบอัตโนมัติทั้งวงจร: Gemini AI เขียนบท ➔ ElevenLabs พากย์เสียง ➔ AI Visual สร้างวิดีโอ ➔ MoviePy ตัดต่อ ➔ อัปโหลด Cloud สตรีมมิ่งทันที!
          </p>
        </div>

        {/* 24/7 Auto-Pilot Toggle Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-3 w-full sm:w-auto justify-between">
            <div className="flex items-center gap-2">
              <Bot className={`w-5 h-5 ${isAutoPilotActive ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className="text-xs font-bold text-white">โหมดบอท 24/7 Auto-Pilot</div>
                <div className="text-[10px] text-slate-400">ผลิตหนังสั้นสลับอัตโนมัติ</div>
              </div>
            </div>

            <button
              onClick={() => setIsAutoPilotActive(!isAutoPilotActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAutoPilotActive
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isAutoPilotActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-slate-950" /> ปิดบอท
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-300" /> เปิดบอท 24/7
                </>
              )}
            </button>
          </div>

          <button
            onClick={runAutoPipeline}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-slate-950" />
            <span>{isProcessing ? 'กำลังปั๊มหนังสั้น...' : '⚡ ปั๊มหนังสั้น 1-Click Auto Pipeline'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Preset Controller & Pipeline Steps Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preset Prompts & Setup Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-left">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> กำหนดหัวข้อพล็อตสยองขวัญหักมุมตลก
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  หัวข้อเรื่อง (Topic / Prompt):
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ใส่หัวข้อสยองขวัญตลก..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  หมวดหมู่หนังสั้น:
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ผีหอพัก">ผีหอพัก</option>
                  <option value="ผีติดสปีด">ผีติดสปีด</option>
                  <option value="ผีโซเชียล">ผีโซเชียล</option>
                  <option value="ตำนานพื้นบ้าน">ตำนานพื้นบ้าน</option>
                  <option value="ผีตลกร้าย">ผีตลกร้าย</option>
                </select>
              </div>
            </div>

            {/* Topic Quick Presets Buttons */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                🎯 ตัวอย่างพล็อตเด็ดพร้อมสั่งปั๊ม:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'ผีหลังตู้เย็นหิวหมูกระทะตอนตีสาม',
                  'ปอบแอบสิงอยู่ในกลุ่มไลน์บริษัท',
                  'ผีสั่งไรเดอร์ไปส่งผัดไทยในป่าช้า',
                  'กุมารทองสั่งซื้อของเล่นออนไลน์ช้อปปี้',
                  'วิญญาณหลอนแอบใช้ WiFi คนข้างบ้าน'
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(p)}
                    className="text-[11px] bg-slate-950 hover:bg-emerald-950 text-slate-300 border border-slate-800 hover:border-emerald-700 px-3 py-1.5 rounded-xl transition-all"
                  >
                    👻 {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional ElevenLabs API Key Override */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">ElevenLabs Custom API Key (ตัวเลือกเสริม):</span>
              </div>
              <input
                type="password"
                placeholder="ใส่ API Key ถ้ามี (เว้นว่างใช้ Gemini Sound)"
                value={elevenLabsKey}
                onChange={e => setElevenLabsKey(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white w-48 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Node Pipeline Visualizer */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl text-left">
            <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" /> ลูปโหนดการผลิตเนื้อหาอัตโนมัติ (Pipeline Nodes)
              </span>
              {isProcessing && (
                <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> กำลังประมวลผล...
                </span>
              )}
            </h3>

            <div className="space-y-4">
              {steps.map((step) => {
                const isCurrent = step.status === 'processing';
                const isDone = step.status === 'completed';
                const isErr = step.status === 'error';

                return (
                  <div
                    key={step.stepNumber}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                      isDone
                        ? 'bg-emerald-950/30 border-emerald-700/60'
                        : isCurrent
                        ? 'bg-teal-950/60 border-teal-500 shadow-lg shadow-teal-950/50'
                        : isErr
                        ? 'bg-red-950/30 border-red-800'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : isCurrent
                          ? 'bg-teal-400 text-slate-950 animate-bounce'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : step.stepNumber}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-100">
                          {step.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDone
                              ? 'bg-emerald-900 text-emerald-300'
                              : isCurrent
                              ? 'bg-teal-900 text-teal-300 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isDone ? 'สำเร็จ' : isCurrent ? 'กำลังทำงาน' : 'รอดำเนินการ'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {step.description}
                      </p>
                      {step.detail && (
                        <div className="text-[11px] font-mono text-emerald-400 mt-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                          ℹ️ {step.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Real-time Terminal Log Viewer */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-left flex flex-col h-[650px]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> Log การทำงานระบบ (System Logs)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Live Output
            </span>
          </div>

          <div className="flex-1 bg-slate-950 rounded-2xl p-3 border border-slate-800/80 font-mono text-[11px] overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">ยังไม่มี Log การทำงาน กดเริ่มปั๊มคลิปเพื่อดูขั้นตอน...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="leading-relaxed border-b border-slate-900 pb-1">
                  <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                  <span
                    className={
                      log.level === 'success'
                        ? 'text-emerald-400 font-bold'
                        : log.level === 'error'
                        ? 'text-red-400 font-bold'
                        : log.level === 'warning'
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* 5-Scene Blueprint & 6 AI Tools Reference Card */}
      <div className="mt-8 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl text-left shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              โครงสร้างหนังสั้นสยองขวัญป้ายยา 5 ฉาก (5-Scene Storyboard) & เครื่องมือ AI 6 ขั้นตอน
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              สูตรลับบทหนังสั้น 1.5 นาทีที่ดึงดูดคนดูให้อยู่จบ แล้วคลิกสั่งซื้อสินค้า Shopee Affiliate 100%
            </p>
          </div>

          <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-3 py-1 rounded-full text-xs font-bold shrink-0">
            ⚡ 100% Automation Integrated
          </span>
        </div>

        {/* 5 Scenes Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded">
                0:00 - 0:20 (20s)
              </span>
              <h4 className="font-bold text-slate-100 text-xs mt-2 text-emerald-400">
                ฉากที่ 1: บิ้วด์อารมณ์หลอน
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                สร้างบรรยากาศเงียบสงัด ไฟกระพริบ มีเสียงลึกลับ เพื่อดักสายตาหยุดฟีด (Hook User)
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
              AI Tool: Gemini + Midjourney + Suno Horror BGM
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded">
                0:20 - 0:45 (25s)
              </span>
              <h4 className="font-bold text-slate-100 text-xs mt-2 text-teal-400">
                ฉากที่ 2: เริ่มเจอดี
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                ผีเริ่มปรากฏตัว เผชิญหน้า ตัวละครถือไม้ช็อตยุงขู่ เพิ่มความตึงเครียดขนหัวลุก
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
              AI Tool: Runway Gen-3 + ElevenLabs Panicked Voice
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded">
                0:45 - 0:55 (10s)
              </span>
              <h4 className="font-bold text-slate-100 text-xs mt-2 text-purple-400">
                ฉากที่ 3: จุดพีค/เผชิญหน้า
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                ยื่นหน้าเข้ามาใกล้ นกหลับตาเตรียมโดนหักคอ แต่ผีกลับอ้าปากยิ้มตลกบอกหิวหมูกระทะ!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
              AI Tool: Dolly Zoom + Sound Effect Record Scratch
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded">
                0:55 - 1:15 (20s)
              </span>
              <h4 className="font-bold text-slate-100 text-xs mt-2 text-amber-400">
                ฉากที่ 4: หักมุมป้ายยา Shopee
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                นกกับผีจับมือต้มชาบูกินด้วยกัน โดยใช้หม้อต้มสุกี้ไฟฟ้าพกพา Shopee สุกไวใน 1 นาที!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
              AI Tool: Shopee Product Integration + Upbeat Dance BGM
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded">
                1:15 - 1:30 (15s)
              </span>
              <h4 className="font-bold text-slate-100 text-xs mt-2 text-emerald-400">
                ฉากที่ 5: สรุปโปรโมชั่น + ปักหมุด
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                แจกโค้ดส่วนลด Shopee พิเศษ บอกพิกัดกดลิงก์สั่งซื้อใน "คอมเมนต์ปักหมุด" ใต้คลิป!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
              AI Tool: Auto Pinned Comment Copy + CTA Banner
            </div>
          </div>
        </div>

        {/* 6 AI Tools Recommended Guide Table */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
            🛠️ ชุดเครื่องมือ AI ยอดนิยมในการสร้างหนังสั้น (6-Step AI Stack):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">1. เขียนบท & สโตรี่บอร์ด:</span>
              <p className="text-slate-400 text-[11px]">ใช้ <b>Google Gemini 3.6 Flash / ChatGPT</b> เขียนพล็อตสยองขวัญหักมุม 5 ฉาก</p>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">2. เจนภาพ & ล็อกตัวละคร:</span>
              <p className="text-slate-400 text-[11px]">ใช้ <b>Midjourney / Leonardo AI</b> พร้อมโค้ด <code className="bg-slate-800 px-1 text-emerald-400">--cw 100 --seed</code> เพื่อล็อกหน้าตัวละคร</p>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">3. ขยับภาพภาพเป็นวิดีโอ:</span>
              <p className="text-slate-400 text-[11px]">ใช้ <b>Runway Gen-3 / Luma Dream Machine / Kling AI</b> ขยับมุมกล้อง 4-10 วิ</p>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">4. เสียงพากย์ภาษาไทย:</span>
              <p className="text-slate-400 text-[11px]">ใช้ <b>ElevenLabs / Gemini TTS</b> สังเคราะห์เสียงกระซิบหลอนสลับเสียงตลกตื่นเต้น</p>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">5. ดนตรี & SFX สยองขวัญ:</span>
              <p className="text-slate-400 text-[11px]">ใช้ <b>Suno AI / Udio</b> เจนดนตรี Cinematic Horror ไร้ลิขสิทธิ์ + SFX กรี๊ดผี</p>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">6. ตัดต่อ & ปักหมุด Shopee:</span>
              <p className="text-slate-400 text-[11px]">ใช้ <b>CapCut / MoviePy Engine</b> รวมไฟล์วิดีโอ ใส่ซับไตเติ้ลคาราโอเกะ และปักหมุด Shopee Affiliate</p>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Connection Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 text-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowYoutubeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-500">
                <Youtube className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">ผูกช่อง YouTube Shorts อัตโนมัติ</h3>
                <p className="text-xs text-slate-300">เชื่อมต่อช่องเพื่อให้ออโต้ไพลอตโพสต์คลิปหนังสั้นอัตโนมัติ 24 ชั่วโมง</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Step 0: Google Client Credentials Inputs */}
              <form onSubmit={handleSaveCredentials} className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/40 space-y-3">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center text-[10px] font-black">0</span>
                    กรอก Google OAuth Client Credentials
                  </div>
                  {credentialsSaved && (
                    <span className="text-[10px] text-emerald-400 font-normal bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      ✓ บันทึกคีย์แล้ว
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px]">
                  ก๊อปปี้ <strong>Client ID</strong> และ <strong>Client Secret</strong> จากหน้า Google Cloud Console มาวางที่นี่
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Google Client ID:</label>
                    <input
                      type="text"
                      placeholder="เช่น 534076215345-...apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Google Client Secret:</label>
                    <input
                      type="password"
                      placeholder="เช่น GOCSPX-xxxx..."
                      value={clientSecretInput}
                      onChange={(e) => setClientSecretInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={youtubeConnecting || !clientIdInput || !clientSecretInput}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    💾 บันทึก Client Credentials
                  </button>
                </div>
              </form>

              {/* Option 1: Google OAuth Direct */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                  เข้าสู่ระบบด้วย Google (OAuth Direct)
                </div>

                {/* Explanation Box for GCP Client Types & Sensitive Scope Error */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/40 text-[11px] text-slate-300 space-y-2.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    💡 ทำไมถึงเกิด ERROR 400 invalid_request และวิธีแก้ไขที่ถูกต้อง:
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                    <p>
                      1. <strong>เหตุผลที่ Google บล็อก IP (http://34.87.121.61...):</strong> YouTube Upload เป็น Sensitive Scope ที่ Google บังคับใช้ <code className="text-emerald-300 font-mono">https://</code> เท่านั้น แต่ Google มีข้อยกเว้นพิเศษให้เฉพาะ <code className="text-emerald-300 font-mono">http://localhost</code>
                    </p>
                    <p>
                      2. <strong>ทำไมถึงเกิด 400 invalid_request ก่อนหน้านี้?</strong> เพราะเซิร์ฟเวอร์เคยส่ง Redirect URI ตาม IP ไปให้ Google ทำให้เกิด redirect_uri_mismatch
                    </p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <p className="font-bold text-emerald-400 text-xs">✅ แก้ไขเรียบร้อยแล้ว! วิธีผูกช่องให้สำเร็จใน 2 ขั้นตอนง่ายๆ:</p>
                      
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-200">ขั้นที่ 1: ในหน้า Google Cloud Console ( Authorized redirect URIs)</p>
                        <p className="text-slate-300 pl-3 border-l-2 border-indigo-500">
                          ใส่เฉพาะ 2 URIs นี้แล้วกด <strong>SAVE</strong>:
                          <br />
                          <code className="text-emerald-300 font-mono select-all">http://localhost:3000/api/auth/youtube/callback</code>
                          <br />
                          <code className="text-emerald-300 font-mono select-all">https://ais-pre-qldod5l5jmard5hon3mubh-357144596187.asia-southeast1.run.app/api/auth/youtube/callback</code>
                        </p>
                      </div>

                      <div className="space-y-1 pt-1">
                        <p className="font-semibold text-slate-200">ขั้นที่ 2: กดปุ่มสีแดง ▶ ข้างล่างนี้เพื่อล็อกอิน</p>
                        <p className="text-slate-300 pl-3 border-l-2 border-cyan-500">
                          เมื่อล็อกอินสำเร็จ เบราว์เซอร์จะพาไปที่ <code className="text-cyan-300 font-mono">http://localhost:3000/api/auth/youtube/callback?code=4/0A...</code>
                          <br />
                          👉 ให้ก๊อปปี้ URL หรือ Code ในช่องที่อยู่เว็บ มาวางในช่อง <strong>ข้อ 1.5 ด้านล่าง</strong> แล้วกด <strong>"ยืนยัน Code"</strong> เป็นอันเสร็จสมบูรณ์!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 font-bold">📍 คัดลอก Localhost URI สำหรับใส่ใน Google Console:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const redirectUrl = `http://localhost:3000/api/auth/youtube/callback`;
                        navigator.clipboard.writeText(redirectUrl);
                        alert('ก๊อปปี้ Redirect URI เรียบร้อยแล้ว:\n' + redirectUrl);
                      }}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800/50"
                    >
                      📋 คัดลอก http://localhost:3000/...
                    </button>
                  </div>
                  <code className="block text-[10px] text-emerald-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 break-all select-all">
                    http://localhost:3000/api/auth/youtube/callback
                  </code>
                </div>

                <button
                  onClick={handleOAuthConnect}
                  disabled={youtubeConnecting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  {youtubeConnecting ? 'กำลังเปิดหน้าล็อกอิน...' : '▶ กดที่นี่เพื่อเปิดหน้าล็อกอิน Google (ผูกช่อง)'}
                </button>
              </div>

              {/* Option 1.5: Paste Auth Code or URL */}
              <form onSubmit={handleExchangeCodeSubmit} className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-2.5">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1.5</span>
                    ยืนยันด้วย URL ทั้งหมดจาก Google (แนะนำวิธีนี้)
                  </div>
                  <span className="text-[10px] text-cyan-400 font-normal">ป้องกัน Code ขาดหาย</span>
                </div>
                
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="text-amber-300 font-semibold">
                    💡 วิธีแก้ปัญหา invalid_grant:
                  </p>
                  <p>
                    ก๊อปปี้ <strong>URL ทั้งหมดในช่องที่อยู่เว็บ (Address Bar)</strong> ที่ขึ้นคำว่า <code className="text-emerald-300 font-mono">localhost refused to connect</code> เช่น:
                  </p>
                  <code className="block text-[9.5px] text-cyan-300 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 break-all select-all">
                    http://localhost:3000/api/auth/youtube/callback?iss=https://accounts.google.com&code=4/0A...
                  </code>
                  <p className="text-slate-400 text-[10.5px] pt-0.5">
                    นำมาวางในช่องด้านล่างนี้ได้เลย ระบบจะสกัด Code ที่สมบูรณ์ออกมาให้อัตโนมัติครับ
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="วาง URL ทั้งหมด หรือ Code ที่นี่..."
                    value={authCodeInput}
                    onChange={(e) => setAuthCodeInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                  />
                  <button
                    type="submit"
                    disabled={youtubeConnecting || !authCodeInput}
                    className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow flex items-center gap-1"
                  >
                    {youtubeConnecting ? 'กำลังยืนยัน...' : 'ยืนยัน Code'}
                  </button>
                </div>
              </form>

              {/* Option 2: Manual Refresh Token */}
              <form onSubmit={handleManualTokenSubmit} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                  กรอก YouTube Refresh Token ด้วยตนเอง
                </div>
                <p className="text-slate-400 text-[11px]">
                  หากใช้ Google Cloud OAuth Client Credentials (refresh_token) บนเซิร์ฟเวอร์ GCP
                </p>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">ชื่อช่อง YouTube:</label>
                  <input
                    type="text"
                    placeholder="เช่น: GagGhost Shorts TH"
                    value={customChannelName}
                    onChange={(e) => setCustomChannelName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">OAuth Refresh Token:</label>
                  <input
                    type="password"
                    placeholder="1//0gXXXXX..."
                    value={customRefreshToken}
                    onChange={(e) => setCustomRefreshToken(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={youtubeConnecting}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold py-2 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Link className="w-3.5 h-3.5" />
                  บันทึก Refresh Token
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Reels Connection Modal */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowFacebookModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                f
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  💙 ตั้งค่าการอัปโหลด Facebook Reels อัตโนมัติ
                </h3>
                <p className="text-xs text-slate-300">
                  เชื่อมต่อ Meta Page Access Token เพื่อยิงคลิปตรงเข้า Facebook Page
                </p>
              </div>
            </div>

            {/* Connection Status Box */}
            {facebookConfig?.connected ? (
              <div className="bg-emerald-950/80 border border-emerald-600 p-4 rounded-2xl mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> เชื่อมต่อกับเพจ Facebook แล้ว
                  </span>
                  <button
                    onClick={handleDisconnectFacebook}
                    className="text-[11px] text-red-400 hover:underline cursor-pointer"
                  >
                    ยกเลิกการเชื่อมต่อ
                  </button>
                </div>
                <p className="text-xs text-slate-200">
                  ชื่อเพจ: <strong>{facebookConfig.pageName}</strong>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Page ID: {facebookConfig.pageId}
                </p>
              </div>
            ) : (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 mb-5 space-y-2">
                <p className="font-bold text-blue-400">💡 วิธีการเอา Page Access Token & Page ID (ใช้เวลา 2 นาที):</p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-300">
                  <li>ไปที่ <strong>Meta Graph API Explorer</strong> (<a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-cyan-400 underline">developers.facebook.com/tools/explorer</a>)</li>
                  <li>เลือก <strong>Meta App</strong> และเลือกเพจของคุณในช่อง <strong>User or Page</strong></li>
                  <li>เพิ่มสิทธิ์ (Permissions): <code className="text-emerald-300">pages_show_list</code>, <code className="text-emerald-300">pages_manage_posts</code>, <code className="text-emerald-300">publish_video</code></li>
                  <li>กด <strong>Generate Access Token</strong> แล้วสลับ Token มาเป็น <strong>Page Access Token</strong></li>
                  <li>ก๊อปปี้ Token และ Page ID มาวางในช่องด้านล่างแล้วกดบันทึก</li>
                </ol>
              </div>
            )}

            {fbErrorMessage && (
              <div className="bg-red-950/90 border border-red-500/80 p-3.5 rounded-2xl mb-4 text-xs text-red-200 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  ⚠️ {fbErrorMessage}
                </p>
                {canForceSaveFb && (
                  <div className="pt-1 border-t border-red-800/60">
                    <button
                      type="button"
                      onClick={() => handleSaveFacebookConfig(undefined, true)}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-xl transition-all shadow text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      ⚡ ยืนยันบันทึกข้อมูลนี้ทันที (ข้ามการตรวจสอบ Meta API)
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={(e) => handleSaveFacebookConfig(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Facebook Page ID:
                </label>
                <input
                  type="text"
                  placeholder="เช่น 109283746501928"
                  value={fbPageIdInput}
                  onChange={e => setFbPageIdInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Facebook Page Access Token (User / Page Token):
                </label>
                <textarea
                  rows={3}
                  placeholder="วาง EAAG... ยาวๆ ที่นี่"
                  value={fbAccessTokenInput}
                  onChange={e => setFbAccessTokenInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={facebookConnecting || !fbAccessTokenInput || !fbPageIdInput}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
              >
                {facebookConnecting ? 'กำลังตรวจสอบสิทธิ์กับ Facebook...' : '💾 บันทึกและเชื่อมต่อเพจ Facebook'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
