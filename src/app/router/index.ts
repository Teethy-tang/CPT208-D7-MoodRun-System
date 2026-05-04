import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import HomePage from '../../pages/HomePage.vue';
import MoodPage from '../../pages/MoodPage.vue';
import ProfilePage from '../../pages/ProfilePage.vue';
import RunPage from '../../pages/RunPage.vue';
import SummaryPage from '../../pages/SummaryPage.vue';
import type { PageId, RouteGroupName } from '../../types/moodrun';

export const pageRouteMap: Record<PageId, RouteGroupName> = {
  homePage: 'home',
  meditationPage: 'home',
  moodPage: 'mood',
  moodAiPage: 'mood',
  planPage: 'mood',
  routeSetupPage: 'mood',
  customPlanPage: 'mood',
  runningPage: 'run',
  summaryPage: 'summary',
  wisdomPage: 'summary',
  profilePage: 'profile',
  profileEditPage: 'profile',
  avatarPage: 'profile',
};

export const defaultPageByRoute: Record<RouteGroupName, PageId> = {
  home: 'homePage',
  mood: 'moodPage',
  run: 'runningPage',
  summary: 'summaryPage',
  profile: 'profilePage',
};

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/mood',
    name: 'mood',
    component: MoodPage,
  },
  {
    path: '/run',
    name: 'run',
    component: RunPage,
  },
  {
    path: '/summary',
    name: 'summary',
    component: SummaryPage,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
  },
];

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes,
  });
}
