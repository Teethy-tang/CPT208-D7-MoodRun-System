<script setup lang="ts">
import { getMoodRunController } from '../app/controller';

const app = getMoodRunController();
</script>

<template>
  <div class="page profile-page active" id="profilePage">
    <h2 class="page-title">YOUR PROFILE</h2>
    <div class="profile-header">
      <div class="profile-avatar-block">
        <button class="profile-avatar avatar-button" type="button" aria-label="Edit avatar" @click="app.goToAvatar()">
          <span id="profileAvatar"></span>
        </button>
        <div class="profile-avatar-label">EDIT AVATAR</div>
      </div>
      <div class="profile-info">
        <button class="profile-name-button" type="button" aria-label="Edit profile details" @click="app.goToProfileEdit()">
          <span id="profileNickname">RUNNER_01</span>
        </button>
        <div class="profile-details">
          <span id="profileAge">AGE: 25</span>
          <span id="profileRunningLevel">DEV</span>
        </div>
      </div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat">
        <div class="profile-stat-value" id="totalRuns">0</div>
        <div class="profile-stat-label">TOTAL RUNS</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-value" id="totalDistance">0</div>
        <div class="profile-stat-label">KM TOTAL</div>
      </div>
    </div>
    <div class="history-section">
      <h3>RUN HISTORY</h3>
      <div class="history-list" id="historyList"></div>
    </div>
  </div>

  <div class="page profile-edit-page" id="profileEditPage">
    <h2 class="page-title">EDIT PROFILE</h2>
    <form class="profile-edit-panel" @submit.prevent="app.saveProfileDetails()">
      <label class="profile-field" for="profileNicknameInput">
        <span>NICKNAME</span>
        <input id="profileNicknameInput" type="text" maxlength="16" autocomplete="nickname" />
      </label>
      <label class="profile-field" for="profileAgeInput">
        <span>AGE</span>
        <input id="profileAgeInput" type="number" min="1" max="99" inputmode="numeric" />
      </label>
      <label class="profile-field" for="profileLevelInput">
        <span>RUNNING LEVEL</span>
        <select id="profileLevelInput">
          <option value="BEGINNER">BEGINNER</option>
          <option value="CASUAL">CASUAL</option>
          <option value="DEV">DEV</option>
          <option value="PACER">PACER</option>
          <option value="PRO">PRO</option>
          <option value="ELITE">ELITE</option>
        </select>
      </label>
      <div class="page-actions profile-edit-actions">
        <button class="back-btn" type="button" @click="app.cancelProfileEdit()">CANCEL</button>
        <button class="retro-btn" type="submit">SAVE PROFILE</button>
      </div>
    </form>
  </div>

  <div class="page avatar-page" id="avatarPage">
    <h2 class="page-title">AVATAR STUDIO</h2>
    <div class="avatar-studio">
      <div class="avatar-preview-panel">
        <div class="avatar-preview-frame">
          <div id="avatarPreview"></div>
        </div>
        <button class="create-own-btn" @click="app.randomizeAvatar()">RANDOMIZE</button>
      </div>
      <div class="avatar-controls" id="avatarControls"></div>
    </div>
    <div class="page-actions">
      <button class="back-btn" @click="app.goHome()">CANCEL</button>
      <button class="retro-btn" @click="app.saveAvatarChoice()">SAVE AVATAR</button>
    </div>
  </div>
</template>
