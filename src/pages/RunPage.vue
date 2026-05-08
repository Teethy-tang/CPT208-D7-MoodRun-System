<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { getMoodRunController } from '../app/controller';
import type { RunMapMode } from '../types/moodrun';

const app = getMoodRunController();
const isMapExpanded = ref(false);
const isMapClosing = ref(false);
const selectedMapMode = ref<RunMapMode>(app.getRunMapMode());

function toggleMapMode() {
  selectedMapMode.value = app.selectRunMapMode(selectedMapMode.value === 'mood' ? 'classic' : 'mood');
}

async function toggleMapExpansion() {
  if (isMapExpanded.value) {
    isMapClosing.value = true;
    window.setTimeout(async () => {
      isMapExpanded.value = false;
      isMapClosing.value = false;
      await nextTick();
      window.dispatchEvent(new CustomEvent('moodrun:map-resize'));
    }, 320);
    return;
  }

  isMapExpanded.value = true;
  await nextTick();

  window.dispatchEvent(new CustomEvent('moodrun:map-resize'));
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('moodrun:map-resize'));
  }, 360);
}
</script>

<template>
  <div class="page running-page active" id="runningPage">
    <div class="running-header">
      <h2 class="running-title">RUNNING...</h2>
      <button
        class="demo-toggle"
        id="runDemoToggle"
        type="button"
        aria-label="Start demo mode"
        aria-pressed="false"
        @click="app.toggleRunDemo()"
      >
        <span class="run-control-icon demo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M5 5 H10 V10 H5 Z" />
            <path d="M14 4 L20 12 L14 20 Z" />
            <path d="M5 15 H10 V20 H5 Z" />
          </svg>
        </span>
      </button>
      <button class="music-toggle active" id="musicToggle" type="button" @click="app.toggleMusic()">
        <span class="run-control-icon music-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M9 18 V6 L18 4 V16" />
            <path d="M9 18 C9 19.7 7.7 21 6 21 C4.3 21 3 19.7 3 18 C3 16.3 4.3 15 6 15 C7.7 15 9 16.3 9 18 Z" />
            <path d="M18 16 C18 17.7 16.7 19 15 19 C13.3 19 12 17.7 12 16 C12 14.3 13.3 13 15 13 C16.7 13 18 14.3 18 16 Z" />
          </svg>
        </span>
      </button>
      <button class="voice-toggle active" id="voiceToggle" type="button" @click="app.toggleVoice()">
        <span class="run-control-icon voice-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 10 H8 L13 5 V19 L8 14 H4 Z" />
            <path d="M16 9 C17.2 10.2 17.2 13.8 16 15" />
            <path d="M18.5 6.5 C21.3 9.3 21.3 14.7 18.5 17.5" />
          </svg>
        </span>
        <span class="run-control-state">ON</span>
      </button>
      <button class="voice-control-toggle" id="voiceControlToggle" type="button" @click="app.toggleVoiceControl()">
        <span class="run-control-icon voice-control-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 4 C10.3 4 9 5.3 9 7 V12 C9 13.7 10.3 15 12 15 C13.7 15 15 13.7 15 12 V7 C15 5.3 13.7 4 12 4 Z" />
            <path d="M6 11 C6 14.3 8.7 17 12 17 C15.3 17 18 14.3 18 11" />
            <path d="M12 17 V21" />
            <path d="M9 21 H15" />
          </svg>
        </span>
        <span class="run-control-state">OFF</span>
      </button>
    </div>
    <div class="map-stage" :class="{ 'map-stage-expanded': isMapExpanded }">
      <div
        class="map-container"
        :class="{ 'map-container-expanded': isMapExpanded, 'map-container-collapsing': isMapClosing }"
        :data-map-mode="selectedMapMode"
      >
        <div class="run-map-canvas" id="runLiveMap" aria-label="Live run map"></div>
        <div class="run-map-message" id="runMapMessage" aria-live="polite">LIVE MAP LOADING...</div>
        <div class="map-overlay">
          <span id="routePointCount">0 PTS</span>
          <span id="gpsQualityLabel">SEARCHING</span>
        </div>
        <div class="map-mode-switch">
          <button
            class="map-mode-button"
            type="button"
            :data-map-mode="selectedMapMode"
            :aria-label="selectedMapMode === 'mood' ? 'Switch to classic map' : 'Switch to mood map'"
            @click="toggleMapMode"
          >
            <span class="map-mode-dot" aria-hidden="true"></span>
            <span>{{ selectedMapMode === 'mood' ? 'MOOD' : 'CLASSIC' }}</span>
          </button>
        </div>
        <div class="route-guidance-pill" id="routeGuidancePill" data-tone="info" hidden>
          <span id="routeGuidanceTitle">ROUTE GUIDE</span>
          <span id="routeGuidanceDetail">Recommended route active.</span>
        </div>
        <button
          class="map-expand-toggle"
          type="button"
          :aria-expanded="isMapExpanded"
          aria-controls="runLiveMap"
          @click="toggleMapExpansion"
        >
          <span class="map-expand-icon" aria-hidden="true">{{ isMapExpanded ? '^' : 'v' }}</span>
          <span>{{ isMapExpanded ? 'CLOSE MAP' : 'VIEW MAP' }}</span>
        </button>
      </div>
    </div>
    <div class="main-stats-display">
      <div class="distance-display" id="distanceDisplay">0.00</div>
      <div class="distance-label">KILOMETERS</div>
      <div class="distance-subline">
        <span id="remainingDistanceDisplay">0.00 KM LEFT</span>
      </div>
    </div>
    <div class="secondary-stats">
      <div class="secondary-stat">
        <div class="secondary-stat-value" id="paceDisplay">--:--</div>
        <div class="secondary-stat-label">LIVE PACE</div>
      </div>
      <div class="secondary-stat">
        <div class="secondary-stat-value" id="avgPaceDisplay">--:--</div>
        <div class="secondary-stat-label">AVG PACE</div>
      </div>
      <div class="secondary-stat">
        <div class="secondary-stat-value" id="timeDisplay">00:00</div>
        <div class="secondary-stat-label">TIME</div>
      </div>
      <div class="secondary-stat">
        <div class="secondary-stat-value" id="calDisplay">0</div>
        <div class="secondary-stat-label">KCAL</div>
      </div>
    </div>
    <div class="progress-container">
      <div class="progress-header">
        <span id="runTargetLabel">TARGET 5KM</span>
        <span id="progressPercent">0%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
      </div>
      <div class="pace-indicator">
        <div class="pace-zone" id="zoneFast">FAST</div>
        <div class="pace-zone" id="zoneMixed">MIXED</div>
        <div class="pace-zone" id="zoneAerobic">AEROBIC</div>
      </div>
    </div>
    <button class="stop-btn" id="runActionBtn" type="button" @click="app.stopRun()">STOP RUN</button>
  </div>
</template>
