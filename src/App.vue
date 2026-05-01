<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { initMoodRunController } from './app/controller';
import { useMoodRunStore } from './app/stores/moodRun';

const router = useRouter();
const route = useRoute();
const store = useMoodRunStore();
const app = initMoodRunController(store, router);

onMounted(() => {
  void app.init();
});

watch(
  () => route.name,
  () => {
    void app.syncRoute();
  },
);
</script>

<template>
  <div class="cursor-glow" id="cursorGlow"></div>
  <canvas class="bg-grid" id="gravityGrid" aria-hidden="true"></canvas>

  <div class="app-container">
    <RouterView />
    <div class="celebration-toast" id="celebrationToast"></div>
  </div>

  <nav class="bottom-nav">
    <div class="nav-item active" @click="app.goHome()">
      <span class="nav-icon" aria-hidden="true">
        <svg class="pixel-nav-icon home-nav-icon" viewBox="0 0 40 40">
          <path
            d="M5 20 L20 6 L35 20 H31 V35 H9 V20 Z"
            fill="#9beee6"
            stroke="currentColor"
            stroke-width="3"
            stroke-linejoin="miter"
          />
          <rect x="17" y="25" width="6" height="10" fill="#ff7fca" stroke="currentColor" stroke-width="3" />
        </svg>
      </span>
      <span>HOME</span>
    </div>
    <div class="nav-item" @click="app.goToProfile()">
      <span class="nav-icon" aria-hidden="true">
        <svg class="pixel-nav-icon profile-nav-icon" viewBox="0 0 40 40">
          <path
            d="M15 5 H25 V8 H29 V18 H26 V22 H14 V18 H11 V8 H15 Z"
            fill="#a679ff"
            stroke="currentColor"
            stroke-width="3"
            stroke-linejoin="miter"
          />
          <path
            d="M12 23 H28 V27 H32 V35 H8 V27 H12 Z"
            fill="#a679ff"
            stroke="currentColor"
            stroke-width="3"
            stroke-linejoin="miter"
          />
          <rect x="14" y="22" width="12" height="4" fill="#f3e9ff" />
        </svg>
      </span>
      <span>PROFILE</span>
    </div>
  </nav>
</template>
