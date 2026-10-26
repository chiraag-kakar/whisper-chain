<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { post } from './api';
import NeuralBackground from './components/NeuralBackground.vue';
import { session } from './session';

const route = useRoute();
const router = useRouter();

async function logout(): Promise<void> {
  await post('/api/auth/logout');
  session.setParticipant(null);
  await router.push({ name: 'login' });
}
</script>

<template>
  <NeuralBackground />
  <div class="container">
    <header class="topbar">
      <RouterLink class="brand" to="/">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <defs>
            <linearGradient id="wc-logo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#6d5cff" />
              <stop offset="1" stop-color="#14b8c4" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="10" fill="url(#wc-logo)" />
          <path d="M7 16h2.5l2-5 3 10 3-13 3 11 2-3H25" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Whisper Chain
      </RouterLink>
      <div v-if="session.participant.value && route.name !== 'admin'" class="row">
        <span class="muted who">{{ session.participant.value.name || session.participant.value.email }}</span>
        <button class="secondary" @click="logout">Sign out</button>
      </div>
    </header>
    <RouterView />
  </div>
</template>
