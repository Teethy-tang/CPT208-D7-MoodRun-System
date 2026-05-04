<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { getMoodRunController } from '../app/controller';

const app = getMoodRunController();
const isMapExpanded = ref(false);

async function toggleMapExpansion() {
  isMapExpanded.value = !isMapExpanded.value;
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
      <button class="mode-toggle" id="runModeToggle" type="button" @click="app.toggleRunTestMode()">LIVE</button>
      <button class="music-toggle active" id="musicToggle" type="button" @click="app.toggleMusic()">
        <span class="music-icon" aria-hidden="true">MUS</span>
        <span>ON</span>
      </button>
      <button class="voice-toggle active" id="voiceToggle" type="button" @click="app.toggleVoice()">
        <span class="voice-icon" aria-hidden="true">)))</span>
        <span>ON</span>
      </button>
    </div>
    <div class="map-stage" :class="{ 'map-stage-expanded': isMapExpanded }">
      <div class="map-container" :class="{ 'map-container-expanded': isMapExpanded }">
        <div class="run-map-canvas" id="runLiveMap" aria-label="Live run map"></div>
        <div class="run-map-message" id="runMapMessage" aria-live="polite">LIVE MAP LOADING...</div>
        <div class="map-overlay">
          <span id="routePointCount">0 PTS</span>
          <span id="gpsQualityLabel">SEARCHING</span>
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
