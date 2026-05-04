<script setup lang="ts">
import { getMoodRunController } from '../app/controller';

const app = getMoodRunController();
</script>

<template>
  <div class="page summary-page active" id="summaryPage">
    <div class="pixel-fireworks-container" id="fireworksContainer"></div>
    <h2 class="page-title">RUN COMPLETE!</h2>
    <div class="summary-stats">
      <div class="summary-stat">
        <div class="summary-stat-label">TOTAL DISTANCE</div>
        <div class="summary-stat-value" id="summaryDistance">0.00 KM</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-label">AVERAGE PACE</div>
        <div class="summary-stat-value" id="summaryPace">--:-- /KM</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-label">DURATION</div>
        <div class="summary-stat-value" id="summaryTime">00:00</div>
      </div>
    </div>
    <div class="mood-arc-card">
      <div class="mood-arc-heading">
        <span>MOOD ARC</span>
        <span id="summaryPlanName">MOOD RUN</span>
      </div>
      <div class="mood-arc-flow">
        <span id="summaryMoodBefore">NEUTRAL</span>
        <span class="mood-arc-arrow">-&gt;</span>
        <span id="summaryMoodAfter">BALANCED</span>
      </div>
      <p id="summaryMoodInsight">A steady run gave the day a shape.</p>
    </div>
    <div class="calorie-analogy">
      <h3>CALORIES BURNED</h3>
      <p id="calorieAnalogy">You earned a treat! Great job!</p>
    </div>
    <button class="retro-btn summary-continue-btn" @click="app.goToWisdom()">CONTINUE</button>
  </div>

  <div class="page wisdom-page" id="wisdomPage">
    <h2 class="page-title">WISDOM BOOK</h2>
    <div class="thought-review">
      <h3>YOUR THOUGHTS BEFORE THE RUN:</h3>
      <p id="wisdomThought">No thoughts recorded.</p>
    </div>
    <div class="book-container">
      <p class="wisdom-text" id="wisdomText">Click to reveal...</p>
    </div>
    <button class="reveal-btn" id="revealBtn" @click="app.revealWisdom()">REVEAL WISDOM</button>
    <div class="page-actions wisdom-actions">
      <button class="back-btn" @click="app.goHome()">BACK TO HOME</button>
      <button class="retro-btn" @click="app.goToProfile()">VIEW PROFILE</button>
    </div>
  </div>
</template>
