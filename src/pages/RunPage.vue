<script setup lang="ts">
import { getMoodRunController } from '../app/controller';

const app = getMoodRunController();
</script>

<template>
  <div class="page running-page active" id="runningPage">
    <div class="running-header">
      <h2 class="running-title">RUNNING...</h2>
      <button class="mode-toggle" id="runModeToggle" type="button" @click="app.toggleRunTestMode()">LIVE</button>
      <button class="music-toggle active" id="musicToggle" @click="app.toggleMusic()">
        <span class="music-icon">♪</span>
        <span>ON</span>
      </button>
    </div>
    <div class="run-status-bar">
      <div class="run-status-label" id="runStatusLabel" data-tone="info" aria-live="polite">Requesting GPS access...</div>
      <div class="run-accuracy-pill" id="runAccuracyDisplay">ACC --</div>
    </div>
    <div class="map-container">
      <div class="run-map-canvas" id="runLiveMap" aria-label="Live run map"></div>
      <div class="run-map-message" id="runMapMessage" aria-live="polite">LIVE MAP LOADING...</div>
      <div class="map-overlay">
        <span id="routePointCount">0 PTS</span>
        <span id="gpsQualityLabel">SEARCHING</span>
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
    <button class="stop-btn" id="runActionBtn" @click="app.stopRun()">STOP RUN</button>
  </div>
</template>
