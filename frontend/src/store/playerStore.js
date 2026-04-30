import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const XP_PER_LEVEL = 120;

function defaultDailyQuests() {
  return [
    { id: 'cities-2', title: 'Clear 2 cities', progress: 0, target: 2, rewardXp: 40 },
    { id: 'boss-1', title: 'Win 1 boss battle', progress: 0, target: 1, rewardXp: 70 },
  ];
}

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      username: 'QuestPilot',
      level: 1,
      xp: 0,
      avatar: 'N',
      unlockedSkills: [],
      currentRole: '',
      achievements: [],
      streakCount: 1,
      lastLogin: new Date().toISOString(),
      recentMistakes: [],
      completedCities: {},
      unlockedCities: {},
      activeCity: null,
      dailyQuests: defaultDailyQuests(),
      gainXP: (amount, source = 'quest') => {
        const numeric = Math.max(0, Number(amount) || 0);
        if (!numeric) return;
        set((state) => {
          const nextXp = state.xp + numeric;
          const nextLevel = Math.floor(nextXp / XP_PER_LEVEL) + 1;
          const nextAchievements = [...state.achievements];
          if (nextLevel > state.level) {
            nextAchievements.push(`Level ${nextLevel} reached`);
          }
          return {
            xp: nextXp,
            level: nextLevel,
            achievements: Array.from(new Set([...nextAchievements, `${source} +${numeric} XP`])),
          };
        });
      },
      levelUp: () =>
        set((state) => ({
          level: state.level + 1,
          achievements: Array.from(new Set([...state.achievements, `Level ${state.level + 1} reached`])),
        })),
      unlockSkill: (skillId) =>
        set((state) => ({
          unlockedSkills: Array.from(new Set([...state.unlockedSkills, skillId])),
        })),
      setCurrentRole: (roleId) => set({ currentRole: roleId }),
      setUsername: (username) => set({ username: username?.trim() || 'QuestPilot' }),
      setAvatar: (avatar) => set({ avatar: avatar?.slice(0, 1)?.toUpperCase() || 'N' }),
      addMistake: (mistake) =>
        set((state) => ({
          recentMistakes: [mistake, ...state.recentMistakes].slice(0, 6),
        })),
      clearMistakes: () => set({ recentMistakes: [] }),
      setActiveCity: (cityId) => set({ activeCity: cityId }),
      markCityCompleted: (stateId, cityId, xpReward) =>
        set((state) => {
          const currentCompleted = state.completedCities[stateId] || [];
          const nextCompleted = Array.from(new Set([...currentCompleted, cityId]));
          const currentUnlocked = state.unlockedCities[stateId] || [];
          const nextUnlocked = Array.from(new Set([...currentUnlocked, cityId]));
          const quests = state.dailyQuests.map((quest) =>
            quest.id === 'cities-2'
              ? { ...quest, progress: Math.min(quest.target, quest.progress + 1) }
              : quest
          );
          return {
            completedCities: {
              ...state.completedCities,
              [stateId]: nextCompleted,
            },
            unlockedCities: {
              ...state.unlockedCities,
              [stateId]: nextUnlocked,
            },
            dailyQuests: quests,
            xp: state.xp + (Number(xpReward) || 0),
            level: Math.floor((state.xp + (Number(xpReward) || 0)) / XP_PER_LEVEL) + 1,
          };
        }),
      unlockCity: (stateId, cityId) =>
        set((state) => ({
          unlockedCities: {
            ...state.unlockedCities,
            [stateId]: Array.from(new Set([...(state.unlockedCities[stateId] || []), cityId])),
          },
        })),
      winBossBattle: () =>
        set((state) => ({
          dailyQuests: state.dailyQuests.map((quest) =>
            quest.id === 'boss-1'
              ? { ...quest, progress: Math.min(quest.target, quest.progress + 1) }
              : quest
          ),
        })),
      refreshDailyQuests: () => set({ dailyQuests: defaultDailyQuests() }),
    }),
    {
      name: 'skillquest-player-store',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        username: state.username,
        level: state.level,
        xp: state.xp,
        avatar: state.avatar,
        unlockedSkills: state.unlockedSkills,
        currentRole: state.currentRole,
        achievements: state.achievements,
        streakCount: state.streakCount,
        lastLogin: state.lastLogin,
        recentMistakes: state.recentMistakes,
        completedCities: state.completedCities,
        unlockedCities: state.unlockedCities,
        dailyQuests: state.dailyQuests,
      }),
    }
  )
);
