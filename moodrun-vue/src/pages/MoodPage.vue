<script setup lang="ts">
import { getMoodRunController } from '../app/controller';

const app = getMoodRunController();
</script>

<template>
  <div class="page mood-page active" id="moodPage">
    <h2 class="page-title">HOW DO YOU FEEL?</h2>
    <div class="mood-grid" id="moodGrid">
      <div class="mood-item" data-mood="stressed" @click="app.selectMood('stressed')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="8" y="7" width="5" height="5" fill="#ff3f8f" />
          <rect x="11" y="10" width="5" height="5" fill="#ff3f8f" />
          <rect x="24" y="7" width="5" height="5" fill="#ff3f8f" />
          <rect x="21" y="10" width="5" height="5" fill="#ff3f8f" />
          <rect x="9" y="23" width="4" height="3" fill="#ff3f8f" />
          <rect x="13" y="26" width="4" height="3" fill="#ff3f8f" />
          <rect x="17" y="23" width="4" height="3" fill="#ff3f8f" />
          <rect x="21" y="26" width="4" height="3" fill="#ff3f8f" />
          <rect x="25" y="23" width="4" height="3" fill="#ff3f8f" />
        </svg>
        <span>STRESSED</span>
      </div>
      <div class="mood-item" data-mood="anxious" @click="app.selectMood('anxious')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="8" y="8" width="8" height="8" fill="#00d4c0" />
          <rect x="24" y="8" width="8" height="8" fill="#00d4c0" />
          <rect x="5" y="20" width="3" height="3" fill="#00d4c0" />
          <rect x="32" y="20" width="3" height="3" fill="#00d4c0" />
          <rect x="12" y="25" width="4" height="3" fill="#00d4c0" />
          <rect x="16" y="27" width="4" height="3" fill="#00d4c0" />
          <rect x="20" y="25" width="4" height="3" fill="#00d4c0" />
          <rect x="24" y="27" width="4" height="3" fill="#00d4c0" />
        </svg>
        <span>ANXIOUS</span>
      </div>
      <div class="mood-item" data-mood="tired" @click="app.selectMood('tired')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="9" y="12" width="8" height="3" fill="#7e88a8" />
          <rect x="23" y="12" width="8" height="3" fill="#7e88a8" />
          <rect x="15" y="23" width="10" height="3" fill="#7e88a8" />
          <rect x="14" y="26" width="12" height="4" fill="#7e88a8" />
        </svg>
        <span>TIRED</span>
      </div>
      <div class="mood-item" data-mood="angry" @click="app.selectMood('angry')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="7" y="8" width="8" height="3" fill="#ff4d5f" />
          <rect x="25" y="8" width="8" height="3" fill="#ff4d5f" />
          <rect x="9" y="11" width="6" height="6" fill="#ff4d5f" />
          <rect x="25" y="11" width="6" height="6" fill="#ff4d5f" />
          <rect x="11" y="27" width="6" height="3" fill="#ff4d5f" />
          <rect x="17" y="24" width="6" height="3" fill="#ff4d5f" />
          <rect x="23" y="27" width="6" height="3" fill="#ff4d5f" />
        </svg>
        <span>ANGRY</span>
      </div>
      <div class="mood-item" data-mood="sad" @click="app.selectMood('sad')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="10" y="10" width="6" height="6" fill="#4f7eff" />
          <rect x="24" y="10" width="6" height="6" fill="#4f7eff" />
          <rect x="25" y="18" width="3" height="5" fill="#4f7eff" />
          <rect x="13" y="27" width="5" height="3" fill="#4f7eff" />
          <rect x="18" y="24" width="5" height="3" fill="#4f7eff" />
          <rect x="23" y="27" width="5" height="3" fill="#4f7eff" />
        </svg>
        <span>SAD</span>
      </div>
      <div class="mood-item" data-mood="bored" @click="app.selectMood('bored')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="10" y="12" width="7" height="2" fill="#8a92ad" />
          <rect x="23" y="12" width="7" height="2" fill="#8a92ad" />
          <rect x="18" y="18" width="4" height="4" fill="#8a92ad" />
          <rect x="13" y="26" width="14" height="2" fill="#8a92ad" />
        </svg>
        <span>BORED</span>
      </div>
      <div class="mood-item" data-mood="excited" @click="app.selectMood('excited')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="10" y="7" width="3" height="9" fill="#ffd84d" />
          <rect x="7" y="10" width="9" height="3" fill="#ffd84d" />
          <rect x="24" y="7" width="3" height="9" fill="#ffd84d" />
          <rect x="21" y="10" width="9" height="3" fill="#ffd84d" />
          <rect x="11" y="23" width="18" height="3" fill="#ffd84d" />
          <rect x="14" y="26" width="12" height="4" fill="#ffd84d" />
        </svg>
        <span>EXCITED</span>
      </div>
      <div class="mood-item" data-mood="happy" @click="app.selectMood('happy')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="9" y="10" width="6" height="6" fill="#ffe36d" />
          <rect x="25" y="10" width="6" height="6" fill="#ffe36d" />
          <rect x="9" y="22" width="4" height="3" fill="#ffe36d" />
          <rect x="27" y="22" width="4" height="3" fill="#ffe36d" />
          <rect x="13" y="25" width="14" height="3" fill="#ffe36d" />
          <rect x="15" y="28" width="10" height="2" fill="#ffe36d" />
        </svg>
        <span>HAPPY</span>
      </div>
      <div class="mood-item" data-mood="neutral" @click="app.selectMood('neutral')">
        <svg class="mood-icon" viewBox="0 0 40 40">
          <rect x="10" y="10" width="6" height="6" fill="#8fa0c4" />
          <rect x="24" y="10" width="6" height="6" fill="#8fa0c4" />
          <rect x="12" y="26" width="16" height="3" fill="#8fa0c4" />
        </svg>
        <span>NEUTRAL</span>
      </div>
    </div>
    <div class="mood-response" id="moodResponse" aria-live="polite" hidden>
      <div class="mood-response-pixels" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div>
        <div class="mood-response-tone" id="moodResponseTone">CHECK-IN</div>
        <p id="moodResponseText">Bring the feeling in.</p>
      </div>
    </div>
    <div class="thought-section">
      <label>WHAT'S ON YOUR MIND?</label>
      <textarea class="thought-input" id="thoughtInput" placeholder="Write down your thoughts..."></textarea>
      <button class="ai-assist-entry" type="button" @click="app.goToMoodAssistant()">
        <span class="ai-assist-dot" aria-hidden="true"></span>
        <span>ASK MOOD AI</span>
      </button>
    </div>
    <div class="page-actions">
      <button class="back-btn" @click="app.goHome()">BACK</button>
      <button class="retro-btn" id="moodNextBtn" disabled @click="app.goToPlan()">CONTINUE</button>
    </div>
  </div>

  <div class="page mood-ai-page" id="moodAiPage">
    <div class="ai-topbar">
      <button class="back-btn" @click="app.returnFromMoodAssistant()">BACK</button>
      <h2 class="page-title">MOOD AI</h2>
    </div>
    <button class="ai-use-btn" id="aiUseMoodBtn" hidden @click="app.acceptMoodAssistantSuggestion()">
      <span aria-hidden="true"></span>
      USE THIS MOOD
    </button>
    <div class="ai-orb-stage">
      <div class="ai-orb" aria-hidden="true">
        <span class="ai-orb-core"></span>
        <span class="ai-orb-ring"></span>
        <span class="ai-orb-spark spark-one"></span>
        <span class="ai-orb-spark spark-two"></span>
        <span class="ai-orb-spark spark-three"></span>
      </div>
      <div class="ai-chat-log" id="aiChatLog" aria-live="polite">
        <div class="ai-message assistant">Tell me what you are carrying. I will help name the mood.</div>
      </div>
    </div>
    <form class="ai-input-bar" @submit="app.sendMoodAssistantMessage($event)">
      <input id="aiMoodInput" type="text" autocomplete="off" placeholder="Type your thought..." />
      <button type="submit" aria-label="Send message">
        <span aria-hidden="true"></span>
      </button>
    </form>
  </div>

  <div class="page plan-page" id="planPage">
    <h2 class="page-title">CHOOSE YOUR RUN</h2>
    <div class="recommended-plan" id="recommendedPlan" @click="app.selectPlan('recommended')">
      <span class="recommended-label">RECOMMENDED</span>
      <h3 class="plan-name" id="recPlanName">STRESS RELIEF RUN</h3>
      <p class="plan-desc" id="recPlanDesc">High intensity to burn off stress</p>
      <div class="plan-stats">
        <span>⏱ 30MIN</span>
        <span>📍 5KM</span>
        <span>🔥 HIGH</span>
      </div>
    </div>
    <div class="plan-list" id="planList">
      <div class="plan-item" data-plan="sprint" @click="app.selectPlan('sprint')">
        <div class="plan-item-info">
          <h4>SPRINT RUN</h4>
          <p>High intensity burst training</p>
        </div>
      </div>
      <div class="plan-item" data-plan="aerobic" @click="app.selectPlan('aerobic')">
        <div class="plan-item-info">
          <h4>AEROBIC RUN</h4>
          <p>Steady pace for cardio health</p>
        </div>
      </div>
      <div class="plan-item" data-plan="scenic" @click="app.selectPlan('scenic')">
        <div class="plan-item-info">
          <h4>SCENIC JOG</h4>
          <p>Relaxed pace to enjoy the view</p>
        </div>
      </div>
    </div>
    <button class="create-own-btn" @click="app.goToCustomPlan()">CREATE YOUR OWN!</button>
    <div class="page-actions">
      <button class="back-btn" @click="app.goToMood()">BACK</button>
      <button class="retro-btn" id="planNextBtn" disabled @click="app.startRun()">START RUN</button>
    </div>
  </div>

  <div class="page custom-plan-page" id="customPlanPage">
    <h2 class="page-title">CREATE CUSTOM PLAN</h2>
    <div class="custom-form">
      <div class="form-group">
        <label>PLAN NAME</label>
        <input id="customPlanName" type="text" placeholder="e.g., Morning Blast" />
      </div>
      <div class="form-group">
        <label>TARGET DISTANCE (KM)</label>
        <input id="customPlanDistance" type="number" placeholder="5" min="1" max="50" />
      </div>
      <div class="form-group">
        <label>PACE TYPE</label>
        <select id="customPlanPace" @change="app.updatePaceDisplay()">
          <option value="">Select pace type</option>
          <option value="fast">Fast (Under 5min/km)</option>
          <option value="mixed">Mixed (5-6.5min/km)</option>
          <option value="slow">Slow (Over 6.5min/km)</option>
        </select>
      </div>
      <div class="pace-range-display" id="paceRangeDisplay">Select a pace type to see details</div>
    </div>
    <div class="page-actions">
      <button class="back-btn" @click="app.goToPlan()">BACK</button>
      <button class="retro-btn" @click="app.saveCustomPlan()">SAVE PLAN</button>
    </div>
  </div>
</template>
