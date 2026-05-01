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
      <svg class="map-path" viewBox="0 0 300 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color: #e06991; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #fff780; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #a4dae9; stop-opacity: 1" />
          </linearGradient>
        </defs>
        <polyline class="route-trail" id="routeTrail" points="" stroke="url(#pathGradient)" />
        <circle id="routeStart" cx="150" cy="75" r="5" fill="#79e1d6" stroke="#fff" stroke-width="2" hidden></circle>
        <circle id="runnerPosition" cx="20" cy="120" r="8" fill="#ffee00" stroke="#fff" stroke-width="2">
          <animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
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
