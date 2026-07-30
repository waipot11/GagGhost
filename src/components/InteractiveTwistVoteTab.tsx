import React, { useState } from 'react';
import { ShortStory } from '../types';
import { Vote, Sparkles, ThumbsUp, MessageSquare, Plus, Check } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface Props {
  stories: ShortStory[];
  onVote: (storyId: string, choice: string) => void;
}

export const InteractiveTwistVoteTab: React.FC<Props> = ({ stories, onVote }) => {
  const [votedChoices, setVotedChoices] = useState<Record<string, string>>({});
  const [customTwistInput, setCustomTwistInput] = useState<string>('');
  const [selectedStoryId, setSelectedStoryId] = useState<string>(stories[0]?.id || '');

  const handleVoteSubmit = (storyId: string, choice: string) => {
    setVotedChoices(prev => ({ ...prev, [storyId]: choice }));
    onVote(storyId, choice);
    soundEngine.playSFX('comedy_boing');
  };

  const handleCustomTwistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTwistInput.trim()) return;
    alert(`ส่งไอเดียจุดหักมุมตลกเรื่องใหม่: "${customTwistInput}" เข้าสู่ AI Director เรียบร้อยแล้ว! AI จะนำไปใช้สร้างคลิปเรื่องถัดไป`);
    setCustomTwistInput('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-purple-800/50 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-900/80 text-purple-300 border border-purple-700">
              <Vote className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              ระบบผู้ชมเลือกจุดหักมุมเอง (Interactive Twist Voting)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            มีส่วนร่วมในการกำหนดตอนจบของหนังสั้นสยองขวัญตลก! คะแนนโหวตสูงสุดจะถูก AI นำไปตัดต่อสร้างฉากจบจริงในระบบ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Left 2 Columns: Voting Stories Cards */}
        <div className="lg:col-span-2 space-y-6">
          {stories.map(story => {
            const hasVoted = votedChoices[story.id];

            return (
              <div
                key={story.id}
                className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-purple-800/60 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <img
                    src={story.thumbnailUrl}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-28 rounded-2xl object-cover shrink-0 border border-purple-900"
                  />
                  <div>
                    <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-extrabold uppercase">
                      {story.category}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">
                      👻 {story.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {story.tagline}
                    </p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      ผู้สร้าง: {story.creator} • {story.createdAt}
                    </span>
                  </div>
                </div>

                {/* Voting Choices */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                  <span className="text-xs font-bold text-purple-300 block mb-1">
                    🗳️ เลือกจุดหักมุมที่อยากให้เกิดขึ้นในฉากจบ:
                  </span>

                  <button
                    onClick={() => handleVoteSubmit(story.id, story.twistChoiceA)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      hasVoted === story.twistChoiceA
                        ? 'bg-purple-900/90 border-purple-400 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-purple-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-950 text-purple-300 flex items-center justify-center font-black text-xs">
                        A
                      </span>
                      <span>{story.twistChoiceA}</span>
                    </div>
                    {hasVoted === story.twistChoiceA && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px] bg-emerald-950 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> โหวตแล้ว
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleVoteSubmit(story.id, story.twistChoiceB)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      hasVoted === story.twistChoiceB
                        ? 'bg-purple-900/90 border-purple-400 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-purple-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-950 text-purple-300 flex items-center justify-center font-black text-xs">
                        B
                      </span>
                      <span>{story.twistChoiceB}</span>
                    </div>
                    {hasVoted === story.twistChoiceB && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px] bg-emerald-950 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> โหวตแล้ว
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 Column: Propose Custom Twist Idea */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-base font-bold text-purple-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> เสนอไอเดียจุดหักมุมของคุณ
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            พิมพ์จุดหักมุมสยองขวัญตลกไร้คาดคิดของคุณส่งให้ AI นำไปแต่งบทหนังสั้นเรื่องถัดไป!
          </p>

          <form onSubmit={handleCustomTwistSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                เลือกเรื่องที่ต้องการเสนอ:
              </label>
              <select
                value={selectedStoryId}
                onChange={e => setSelectedStoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {stories.map(s => (
                  <option key={s.id} value={s.id}>
                    👻 {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                จุดหักมุมตลกฮากริบที่คุณอยากเสนอ:
              </label>
              <textarea
                rows={4}
                value={customTwistInput}
                onChange={e => setCustomTwistInput(e.target.value)}
                placeholder="เช่น ผีถอดหัวออกมาช่วยซักผ้า, ผีบอกลืมถอดสายชาร์จแบตไอโฟนก่อนตาย..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-purple-950/50 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> ส่งไอเดียให้ AI ผู้กำกับ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
