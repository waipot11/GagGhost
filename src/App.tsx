import React, { useState, useEffect } from 'react';
import { ShortStory } from './types';
import { INITIAL_STORIES } from './data/sampleStories';
import { HeaderNavbar } from './components/HeaderNavbar';
import { ShortVideoPlayer } from './components/ShortVideoPlayer';
import { AutoPipelineStudio } from './components/AutoPipelineStudio';
import { MonetizationHub } from './components/MonetizationHub';
import { InteractiveTwistVoteTab } from './components/InteractiveTwistVoteTab';

export default function App() {
  const [stories, setStories] = useState<ShortStory[]>(INITIAL_STORIES);
  const [currentStoryIdx, setCurrentStoryIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'feed' | 'studio' | 'monetize' | 'vote'>('feed');
  const [coins, setCoins] = useState<number>(500);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(false);

  // Fetch stories from Express server API on mount
  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => {
        if (data.stories && data.stories.length > 0) {
          setStories(data.stories);
        }
      })
      .catch(() => {
        // Fallback to local INITIAL_STORIES
      });
  }, []);

  const currentStory = stories[currentStoryIdx] || stories[0];

  const handleNextStory = () => {
    setCurrentStoryIdx(prev => (prev + 1) % stories.length);
  };

  const handlePrevStory = () => {
    setCurrentStoryIdx(prev => (prev - 1 + stories.length) % stories.length);
  };

  const handleLikeStory = (storyId: string) => {
    fetch(`/api/stories/${storyId}/like`, { method: 'POST' }).catch(() => {});
  };

  const handleUnlockVip = (storyId: string) => {
    setCoins(prev => Math.max(0, prev - 50));
    fetch(`/api/stories/${storyId}/unlock-vip`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.story) {
          setStories(prev => prev.map(s => s.id === storyId ? { ...s, vipUnlocked: true } : s));
        }
      })
      .catch(() => {
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, vipUnlocked: true } : s));
      });
  };

  const handleTipCoins = (amount: number) => {
    setCoins(prev => Math.max(0, prev - amount));
  };

  const handleTopUpCoins = (amount: number) => {
    setCoins(prev => prev + amount);
  };

  const handleStoryPublished = (newStory: ShortStory) => {
    setStories(prev => [newStory, ...prev]);
    setCurrentStoryIdx(0);
  };

  const handleVoteTwist = (storyId: string, choice: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, winningTwist: choice } : s));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        coins={coins}
        isAutoPilotActive={isAutoPilotActive}
      />

      <main className="flex-1 w-full">
        {activeTab === 'feed' && currentStory && (
          <ShortVideoPlayer
            story={currentStory}
            onNextStory={handleNextStory}
            onPrevStory={handlePrevStory}
            onLike={handleLikeStory}
            onUnlockVip={handleUnlockVip}
            onTipCoins={handleTipCoins}
            onVoteTwist={handleVoteTwist}
            coins={coins}
          />
        )}

        {activeTab === 'studio' && (
          <AutoPipelineStudio
            onStoryPublished={handleStoryPublished}
            isAutoPilotActive={isAutoPilotActive}
            setIsAutoPilotActive={setIsAutoPilotActive}
          />
        )}

        {activeTab === 'monetize' && (
          <MonetizationHub
            coins={coins}
            onTopUpCoins={handleTopUpCoins}
          />
        )}

        {activeTab === 'vote' && (
          <InteractiveTwistVoteTab
            stories={stories}
            onVote={handleVoteTwist}
          />
        )}
      </main>
    </div>
  );
}
