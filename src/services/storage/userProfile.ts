import type { UserProfile } from '../../types/moodrun';

const PROFILE_KEY = 'moodrun_profile';

export const defaultUserProfile: UserProfile = {
  nickname: 'RUNNER_01',
  age: 25,
  runningLevel: 'DEV',
};

export function normalizeUserProfile(profile: Partial<UserProfile> = {}): UserProfile {
  const nickname = String(profile.nickname || defaultUserProfile.nickname)
    .trim()
    .slice(0, 16);
  const ageValue = Number(profile.age);
  const age = Number.isFinite(ageValue) ? Math.min(99, Math.max(1, Math.round(ageValue))) : defaultUserProfile.age;
  const runningLevel = String(profile.runningLevel || defaultUserProfile.runningLevel)
    .trim()
    .slice(0, 14);

  return {
    nickname: nickname || defaultUserProfile.nickname,
    age,
    runningLevel: runningLevel || defaultUserProfile.runningLevel,
  };
}

export function loadUserProfile() {
  try {
    return normalizeUserProfile(JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') as Partial<UserProfile>);
  } catch (error) {
    console.warn('Could not read saved profile.', error);
    return defaultUserProfile;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizeUserProfile(profile)));
}
