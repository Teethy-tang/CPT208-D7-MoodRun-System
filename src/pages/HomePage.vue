<script setup lang="ts">
import { getMoodRunController } from '../app/controller';

const app = getMoodRunController();
</script>

<template>
  <div class="page home-page active" id="homePage">
    <div class="header-area">
      <div class="slogan-container" id="slogan">
        <div class="slogan-main">MOOD<br />RUN</div>
        <div class="slogan-sub">
          <span class="slogan-sub-line">Your Emotion-Aware</span>
          <span class="slogan-sub-line">Running Companion</span>
        </div>
      </div>
      <button class="home-avatar-prompt avatar-button" type="button" aria-label="Enter avatar studio" @click="app.goToAvatar()">
        <span class="decoration-icon" aria-hidden="true">
          <span id="homeAvatar"></span>
        </span>
        <span class="avatar-speech">ENTER AVATAR STUDIO</span>
      </button>
    </div>
    <div class="bottom-area">
      <div class="button-group">
        <button class="retro-btn home-action-btn" @click="app.goToMood()">
          <svg class="action-icon sparkle-icon" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="14" y="2" width="4" height="8" fill="currentColor" />
            <rect x="14" y="22" width="4" height="8" fill="currentColor" />
            <rect x="2" y="14" width="8" height="4" fill="currentColor" />
            <rect x="22" y="14" width="8" height="4" fill="currentColor" />
            <rect x="10" y="10" width="4" height="4" fill="currentColor" />
            <rect x="18" y="10" width="4" height="4" fill="currentColor" />
            <rect x="10" y="18" width="4" height="4" fill="currentColor" />
            <rect x="18" y="18" width="4" height="4" fill="currentColor" />
          </svg>
          <span>Start Running</span>
          <span class="action-arrow" aria-hidden="true"></span>
        </button>
        <button class="retro-btn secondary home-action-btn" @click="app.goToMeditation()">
          <svg class="action-icon lotus-icon" viewBox="0 0 40 40" aria-hidden="true">
            <path
              d="M20 30 C12 25 11 17 18 11 C20 15 22 20 20 30 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path
              d="M20 30 C28 25 29 17 22 11 C20 15 18 20 20 30 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path
              d="M17 30 C9 31 5 25 6 18 C11 20 15 24 17 30 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path
              d="M23 30 C31 31 35 25 34 18 C29 20 25 24 23 30 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path d="M7 31 H33" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" />
          </svg>
          <span>Meditation Mode</span>
          <span class="action-arrow" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </div>

  <div class="page meditation-page" id="meditationPage">
    <h2 class="page-title">MEDITATION MODE</h2>
    <div class="breath-container">
      <div class="breath-circle">
        <span class="breath-text" id="breathText">BREATHE</span>
      </div>
      <p class="breath-instruction">Follow the circle rhythm</p>
    </div>
    <div class="sound-options">
      <div class="sound-option" data-sound="rain" @click="app.selectSound('rain')">
        <span class="sound-icon" aria-hidden="true">
          <svg class="sound-svg rain-icon" viewBox="0 0 48 40" focusable="false">
            <path d="M16 5 L11 19" />
            <path d="M28 5 L23 19" />
            <path d="M39 7 L34 21" />
            <path d="M12 25 L8 36" />
            <path d="M25 25 L21 36" />
            <path d="M37 25 L33 36" />
          </svg>
        </span>
        <span class="sound-name">RAIN</span>
      </div>
      <div class="sound-option" data-sound="ocean" @click="app.selectSound('ocean')">
        <span class="sound-icon" aria-hidden="true">
          <svg class="sound-svg ocean-icon" viewBox="0 0 48 40" focusable="false">
            <path d="M5 27 C11 15, 19 13, 27 22 C33 29, 39 30, 44 23" />
            <path d="M5 32 C13 35, 21 35, 29 32 S39 29, 44 32" />
            <path d="M23 20 C27 13, 34 10, 40 14" />
          </svg>
        </span>
        <span class="sound-name">OCEAN</span>
      </div>
      <div class="sound-option" data-sound="forest" @click="app.selectSound('forest')">
        <span class="sound-icon" aria-hidden="true">
          <svg class="sound-svg forest-icon" viewBox="0 0 48 40" focusable="false">
            <path d="M24 7 L12 24 H36 Z" />
            <path d="M24 24 V35" />
          </svg>
        </span>
        <span class="sound-name">FOREST</span>
      </div>
      <div class="sound-option" data-sound="wind" @click="app.selectSound('wind')">
        <span class="sound-icon" aria-hidden="true">
          <svg class="sound-svg wind-icon" viewBox="0 0 48 40" focusable="false">
            <path d="M5 13 H30 C35 13, 35 7, 30 7" />
            <path d="M10 22 H41 C47 22, 47 14, 41 14" />
            <path d="M6 31 H27 C32 31, 32 25, 27 25" />
          </svg>
        </span>
        <span class="sound-name">WIND</span>
      </div>
    </div>
    <div class="page-actions">
      <button class="back-btn" @click="app.goHome()">BACK</button>
    </div>
  </div>
</template>
