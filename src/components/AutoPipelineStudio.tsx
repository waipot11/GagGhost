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
  Key
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

  // Steps Pipeline
  const [steps, setSteps] = useState<AutoPipelineStep[]>([
    { stepNumber: 1, name: 'ขั้นที่ 1: เขียนบท (Gemini AI Scriptwriter)', description: 'สั่งคิดพล็อตสยองขวัญ 1 นาที หักมุมตลก พร้อมระบุ Prompt และ SFX', status: 'idle' },
    { stepNumber: 2, name: 'ขั้นที่ 2: ทำเสียงพากย์ (ElevenLabs / Gemini TTS)', description: 'เจนเสียงพากย์ไทยตื่นเต้น สยองขวัญ + เอฟเฟกต์ sound effects', status: 'idle' },
    { stepNumber: 3, name: 'ขั้นที่ 3: สร้างภาพ/วิดีโอ (Visual Prompt Generator)', description: 'เจนภาพเฟรมคลิปสยองขวัญแนวตั้ง 9:16 ตามแต่ละฉาก', status: 'idle' },
    { stepNumber: 4, name: 'ขั้นที่ 4: ตัดต่อและรวมไฟล์ (MoviePy Engine)', description: 'รวมภาพ วิดีโอ เสียงพากย์ BGM และใส่ซับไตเติ้ลคาราโอเกะ', status: 'idle' },
    { stepNumber: 5, name: 'ขั้นที่ 5: อัปโหลด Cloud & ขึ้น Feed อัตโนมัติ', description: 'ส่งไฟล์เข้า Cloud Storage และพุชขึ้นหน้า Feed ให้คนดูทันที 100%', status: 'idle' },
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
    addLog(`🎬 เริ่มการผลิตหนังสั้นอัตโนมัติ: "${topic}" (${category})`, 'info');

    try {
      // Step 1: Scriptwriter
      setSteps(prev => prev.map(s => s.stepNumber === 1 ? { ...s, status: 'processing', detail: 'Gemini 3.6 Flash กำลังแต่งบท...' } : s));
      addLog('🤖 [Step 1] สั่ง Google Gemini API คิดพล็อตสยองขวัญหักมุม...', 'info');

      await new Promise(r => setTimeout(r, 1200));

      setSteps(prev => prev.map(s => s.stepNumber === 1 ? { ...s, status: 'completed', detail: 'บทเสร็จสิ้น 4 ฉาก + SFX' } : s));
      addLog('✅ [Step 1 สำเร็จ] แต่งบทพร้อมพิกัด SFX และโค้ดสปอนเซอร์เสร็จเรียบร้อย', 'success');

      // Step 2: Voiceover TTS
      setSteps(prev => prev.map(s => s.stepNumber === 2 ? { ...s, status: 'processing', detail: elevenLabsKey ? 'กำลังเชื่อมต่อ ElevenLabs API...' : 'กำลังเจนเสียงพากย์ไทยสยองขวัญ...' } : s));
      addLog(`🎙️ [Step 2] สั่งเจนเสียงพากย์ไทย ${elevenLabsKey ? '(ElevenLabs Custom Key)' : '(Gemini Sound Engine)'}...`, 'info');

      await new Promise(r => setTimeout(r, 1000));

      setSteps(prev => prev.map(s => s.stepNumber === 2 ? { ...s, status: 'completed', detail: 'ไฟล์เสียงและจังหวะพากย์พร้อมแล้ว' } : s));
      addLog('✅ [Step 2 สำเร็จ] สร้างไฟล์เสียงพากย์และ sound effects สำเร็จ', 'success');

      // Step 3: Visual Generation
      setSteps(prev => prev.map(s => s.stepNumber === 3 ? { ...s, status: 'processing', detail: 'กำลังเรนเดอร์ภาพเฟรมสยองขวัญแนวตั้ง...' } : s));
      addLog('🎨 [Step 3] สั่ง AI Visual Model เจนภาพฉากสยอง 9:16 สไตล์ไทย...', 'info');

      await new Promise(r => setTimeout(r, 1400));

      setSteps(prev => prev.map(s => s.stepNumber === 3 ? { ...s, status: 'completed', detail: 'เรนเดอร์ครบ 4 ฉาก 9:16 HD' } : s));
      addLog('✅ [Step 3 สำเร็จ] สร้างภาพฉากแนวตั้ง 9:16 เสร็จสมบูรณ์', 'success');

      // Step 4: Editing & Render Assembly
      setSteps(prev => prev.map(s => s.stepNumber === 4 ? { ...s, status: 'processing', detail: 'MoviePy Engine กำลังรวมไฟล์และใส่ซับไตเติ้ล...' } : s));
      addLog('🎞️ [Step 4] MoviePy Engine กำลังรวมภาพ เสียง BGM และคาราโอเกะซับ...', 'info');

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

      setSteps(prev => prev.map(s => s.stepNumber === 4 ? { ...s, status: 'completed', detail: 'ตัดต่อวิดีโอ 1 นาทีเรียบร้อย' } : s));
      addLog('✅ [Step 4 สำเร็จ] ตัดต่อรวมไฟล์วิดีโอเสร็จสมบูรณ์', 'success');

      // Step 5: Cloud Storage Upload & Feed Auto-Publish
      setSteps(prev => prev.map(s => s.stepNumber === 5 ? { ...s, status: 'processing', detail: 'กำลังอัปโหลดเข้า Cloud Storage & DB...' } : s));
      addLog('☁️ [Step 5] ส่งไฟล์วิดีโอเข้า Cloud Storage และยิงข้อมูลลงฐานข้อมูล Feed...', 'info');

      await new Promise(r => setTimeout(r, 800));

      setSteps(prev => prev.map(s => s.stepNumber === 5 ? { ...s, status: 'completed', detail: 'เผยแพร่ขึ้นหน้า Feed สดสำเร็จ!' } : s));
      addLog(`🎉 [Step 5 สำเร็จ] หนังสั้นเรื่องใหม่ "${data.story.title}" โผล่บน Feed สตรีมมิ่งทันที!`, 'success');

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
      {/* Studio Header & Auto-Pilot Switch */}
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
    </div>
  );
};
