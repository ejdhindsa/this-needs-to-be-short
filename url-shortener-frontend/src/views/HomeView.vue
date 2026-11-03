<script setup lang="ts">
import axios from "axios";
import { ref } from "vue";
import {
  Scissors,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  X,
  ShieldCheck,
} from "@lucide/vue";
import { useToast } from "../composables/useToast";
import { useHistoryStore } from "../stores/historyStore";
import { shortenURL } from "../api/clients";
import { normalizeUrl, isValidUrl } from "../utils/url";
import ResultCard from "../components/ResultCard.vue";
import ResponsiveModal from "../components/ResponsiveModal.vue";
import HistoryList from "../components/HistoryList.vue";
import TurnstileWidget from "../components/TurnstileWidget.vue";
import type { ShortenResponse } from "../api/types";

const originalURL = ref("");
const customCode = ref("");
const showCustomInput = ref(false);
const isLoading = ref(false);
const shortenResult = ref<ShortenResponse>();
const turnstileToken = ref("");
const turnstileWidgetRef = ref<InstanceType<typeof TurnstileWidget> | null>(null);
const pendingPayload = ref<{ url: string; customCode?: string } | null>(null);
const isModalOpen = ref(false);

const { successToast, infoToast, errorToast } = useToast();
const historyStore = useHistoryStore();

const RESERVED_ALIASES = [
  "api",
  "ping",
  "shorten",
  "analytics",
  "health",
  "admin",
  "static",
  "assets",
];

const shortBaseUrl =
  import.meta.env.VITE_SHORT_BASE_URL || "http://localhost:3000";
const displayHost = (() => {
  try {
    return new URL(shortBaseUrl).host;
  } catch {
    return "s.unwreck.dev";
  }
})();

const handleTurnstileVerify = async (token: string) => {
  if (isLoading.value || !pendingPayload.value) {
    return;
  }

  turnstileToken.value = token;
  isLoading.value = true;

  try {
    const result = await shortenURL({
      url: pendingPayload.value.url,
      customCode: pendingPayload.value.customCode,
      turnstileToken: token,
    });

    shortenResult.value = result;
    historyStore.addLink(result);

    if (pendingPayload.value.customCode) {
      successToast("See, custom is always better.");
    } else {
      successToast("Link Unwrecked! Much better.");
    }

    originalURL.value = "";
    customCode.value = "";
    showCustomInput.value = false;
    pendingPayload.value = null;
  } catch (error) {
    isModalOpen.value = false;
    pendingPayload.value = null;
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        const issueMsg =
          error.response.data?.issues?.[0]?.message ||
          error.response.data?.error ||
          "Validation failed";
        errorToast(issueMsg);
      } else if (error.response?.status === 403) {
        errorToast(error.response.data?.error || "Captcha verification failed");
      } else if (error.response?.status === 409) {
        errorToast("No, not this one. She's taken.");
      } else if (error.response?.status === 429) {
        errorToast("Slow down, try again in a minute");
      } else if (!error.response || error.code === "ERR_NETWORK") {
        errorToast("The network took a nap. Check your connection!");
      } else {
        errorToast("I am as clueless as you are, maybe try again?");
      }
    } else {
      errorToast("I am as clueless as you are, maybe try again?");
    }
  } finally {
    isLoading.value = false;
    turnstileToken.value = "";
  }
};

const handleTurnstileExpire = () => {
  turnstileToken.value = "";
  turnstileWidgetRef.value?.reset();
};

const handleTurnstileError = () => {
  turnstileToken.value = "";
  errorToast("Captcha verification encountered an issue. Please try again.");
};

const handleSubmit = () => {
  const rawUrl = originalURL.value.trim();
  if (!rawUrl) {
    errorToast("Are you sure you have entered something?");
    return;
  }

  const normalizedUrl = normalizeUrl(rawUrl);
  if (!isValidUrl(normalizedUrl)) {
    errorToast("Are you sure that's a real URL?");
    return;
  }

  const trimmedCode = customCode.value.trim();

  if (showCustomInput.value && trimmedCode) {
    if (trimmedCode.length < 3) {
      errorToast("Custom code must be at least 3 characters long");
      return;
    }
    if (trimmedCode.length > 32) {
      errorToast("Custom code must be at most 32 characters long");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedCode)) {
      errorToast(
        "Custom code can only contain letters, numbers, underscores, and hyphens",
      );
      return;
    }
    if (RESERVED_ALIASES.includes(trimmedCode.toLowerCase())) {
      errorToast("This alias is reserved");
      return;
    }
  }

  pendingPayload.value = {
    url: normalizedUrl,
    customCode: showCustomInput.value && trimmedCode ? trimmedCode : undefined,
  };

  shortenResult.value = undefined;
  turnstileToken.value = "";
  isModalOpen.value = true;
};

const handleCloseModal = () => {
  isModalOpen.value = false;
  shortenResult.value = undefined;
  pendingPayload.value = null;
  isLoading.value = false;
  turnstileToken.value = "";
};

//TODO: Maybe take this function out and make it its own composable
const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      errorToast("You can't paste what isn't there.");
      return;
    }
    originalURL.value = text.trim();
    infoToast("Paste it, paste it like it's hot!");
  } catch {
    errorToast("The gods of internet have blocked clipboard actions!");
  }
};

const handleClear = () => {
  originalURL.value = "";
};

//TODO: This should be sanitised a bit better, I will revisit this
// later when the need arises
const formatCustomCode = () => {
  customCode.value = customCode.value.replace(/\s+/g, "-");
};
</script>

<template>
  <div class="homeContainer">
    <section class="heroSection">
      <h1 class="heroTitle">
        This needs to be <span class="brandAccent">SHORT</span>
      </h1>
      <p class="heroSubtitle">
        Because long URLs are UGLY! Paste a URL and get a short one, with
        optional custom aliases and a QR code to take home.
      </p>
    </section>

    <form class="shortenerForm" @submit.prevent="handleSubmit">
      <div class="mainInputRow">
        <div class="inputWrapper">
          <span class="urlBadge">URL</span>
          <input
            v-model="originalURL"
            type="text"
            placeholder="Paste a long URL (e.g. youtube.com or https://...)"
            :disabled="isLoading"
            required
            class="urlInput"
          />

          <button
            type="button"
            class="inputActionBtn"
            :title="originalURL ? 'Clear input' : 'Paste from clipboard'"
            :aria-label="originalURL ? 'Clear input' : 'Paste from clipboard'"
            @click="originalURL ? handleClear() : handlePaste()"
          >
            <X v-if="originalURL" :size="16" />
            <template v-else>
              <Clipboard :size="14" />
              <span>Paste</span>
            </template>
          </button>
        </div>

        <button
          type="submit"
          class="submitButton"
          :disabled="isLoading || !originalURL.trim()"
        >
          <Loader2 v-if="isLoading" :size="18" class="spinnerIcon" />
          <Scissors v-else :size="18" />
          <span>{{ isLoading ? "Shortening..." : "SHORTEN" }}</span>
        </button>
      </div>

      <button
        type="button"
        class="toggleButton"
        @click="showCustomInput = !showCustomInput"
      >
        <span>Custom alias (optional)</span>
        <ChevronUp v-if="showCustomInput" :size="16" />
        <ChevronDown v-else :size="16" />
      </button>

      <Transition name="expand">
        <div v-show="showCustomInput" class="customInputRow">
          <span class="customPrefix">{{ displayHost }}/</span>
          <input
            v-model="customCode"
            type="text"
            placeholder="custom-slug"
            :disabled="isLoading"
            class="customInput"
            @input="formatCustomCode"
          />
        </div>
      </Transition>
    </form>
  </div>
  <div class="linkHistory">
    <HistoryList />
  </div>
  <ResponsiveModal
    :isOpen="isModalOpen"
    :size="shortenResult ? 'default' : 'compact'"
    @close="handleCloseModal"
  >
    <Transition name="fade-switch" mode="out-in">
      <ResultCard
        v-if="shortenResult"
        key="result"
        :originalURL="shortenResult.originalURL"
        :shortCode="shortenResult.shortCode"
        @close="handleCloseModal"
      />
      <div v-else key="verify" class="verificationModal">
        <div class="verificationHeader">
          <div class="headerTopRow">
            <div class="modalIconBadge">
              <Loader2 v-if="isLoading" :size="20" class="spinnerIcon" />
              <ShieldCheck v-else :size="20" />
            </div>
            <button
              type="button"
              class="modalCloseBtn"
              title="Cancel"
              aria-label="Cancel"
              @click="handleCloseModal"
            >
              <X :size="16" />
            </button>
          </div>
          <h2 class="verificationTitle">
            {{ isLoading ? "Shortening Link..." : "Security Verification" }}
          </h2>
          <p class="verificationSubtitle">
            {{
              isLoading
                ? "Generating your shortened URL and QR code..."
                : "Please complete the verification below to proceed."
            }}
          </p>
        </div>

        <div v-show="!isLoading" class="turnstileModalWrapper">
          <TurnstileWidget
            ref="turnstileWidgetRef"
            @verify="handleTurnstileVerify"
            @expire="handleTurnstileExpire"
            @error="handleTurnstileError"
          />
        </div>

        <div v-if="isLoading" class="verificationLoading">
          <div class="loadingBarTrack">
            <div class="loadingBarProgress"></div>
          </div>
        </div>
      </div>
    </Transition>
  </ResponsiveModal>
</template>

<style lang="scss" scoped>
.homeContainer {
  width: 100%;
  max-width: min(44rem, 92vw);
  margin: 0 auto;
  padding: 2.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (min-width: 40rem) {
    padding: 4rem 1rem 5rem;
  }
}

.heroSection {
  text-align: center;
  margin-bottom: 2.75rem;

  @media (min-width: 40rem) {
    margin-bottom: 3.5rem;
  }
}

.heroTitle {
  font-family: var(--uw-font-display, sans-serif);
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--uw-fg-heading);
  margin-bottom: 0.25rem;

  .brandAccent {
    color: var(--uw-brand-solid);
  }
}

.heroSubtitle {
  font-size: 0.9375rem;
  color: var(--uw-fg-muted);
  line-height: 1.5;
  max-width: 30rem;
  margin: 0 auto;
}

.shortenerForm {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mainInputRow {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 40rem) {
    flex-direction: row;
  }
}

.inputWrapper {
  flex: 1;
  width: 100%;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
}

.urlBadge {
  position: absolute;
  left: 0.5rem;
  font-family: var(--uw-font-mono, monospace);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--uw-fg-muted);
  background: var(--uw-bg-subtle);
  padding: 0.125rem 0.5rem;
  border-radius: var(--uw-radius-xs);
  border: 1px solid var(--uw-border-subtle);
  user-select: none;
  pointer-events: none;
}

.urlInput {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.875rem 4.5rem 0.875rem 3rem;
  background: var(--uw-bg-surface);
  border: 2px solid var(--uw-border-default);
  border-radius: var(--uw-radius-md);
  color: var(--uw-fg-default);
  font-size: 0.875rem;
  font-family: var(--uw-font-sans, inherit);
  outline: none;
  transition: border-color 0.2s ease;

  @media (min-width: 40rem) {
    padding: 0.875rem 5rem 0.875rem 3.25rem;
  }

  &:focus {
    border-color: var(--uw-brand-solid);
  }

  &::placeholder {
    color: var(--uw-fg-subtle);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.inputActionBtn {
  position: absolute;
  right: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--uw-bg-subtle);
  border: 1px solid var(--uw-border-subtle);
  border-radius: var(--uw-radius-sm);
  color: var(--uw-fg-muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--uw-fg-default);
    background: var(--uw-bg-surface);
    border-color: var(--uw-border-default);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 1px;
  }
}

.submitButton {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: var(--uw-brand-solid);
  color: var(--uw-brand-on-solid);
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  border-radius: var(--uw-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;

  @media (min-width: 40rem) {
    width: auto;
  }

  &:hover:not(:disabled) {
    background: var(--uw-brand-solid-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.spinnerIcon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.toggleButton {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: none;
  color: var(--uw-fg-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: color 0.15s ease;

  &:hover {
    color: var(--uw-fg-default);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }
}

.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.customInputRow {
  min-height: 3rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--uw-bg-surface);
  border: 2px solid var(--uw-border-default);
  border-radius: var(--uw-radius-md);
  padding: 0.375rem 0.75rem;
  min-width: 0;
  margin-top: 0.25rem;
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: var(--uw-brand-solid);
  }
}

.customPrefix {
  font-family: var(--uw-font-mono, monospace);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--uw-fg-muted);
  background: var(--uw-bg-subtle);
  padding: 0.125rem 0.5rem;
  border-radius: var(--uw-radius-xs);
  border: 1px solid var(--uw-border-subtle);
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.customInput {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0.25rem 0;
  color: var(--uw-fg-default);
  font-size: 0.8125rem;
  font-family: var(--uw-font-mono, monospace);

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--uw-fg-subtle);
    font-family: var(--uw-font-sans, inherit);
  }
}

.fade-switch-enter-active,
.fade-switch-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-switch-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-switch-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.verificationModal {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.verificationHeader {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
}

.headerTopRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.modalIconBadge {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--uw-radius-sm);
  background: var(--uw-bg-subtle);
  border: 1px solid var(--uw-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--uw-brand-solid);
}

.modalCloseBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--uw-radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--uw-fg-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--uw-bg-subtle);
    color: var(--uw-fg-default);
  }
}

.verificationTitle {
  font-family: var(--uw-font-display, sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--uw-fg-heading);
  margin: 0;
}

.verificationSubtitle {
  font-size: 0.8125rem;
  color: var(--uw-fg-muted);
  margin: 0;
  line-height: 1.4;
}

.turnstileModalWrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 65px;
}

.verificationLoading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0 0.5rem;
  width: 100%;
}

.loadingBarTrack {
  width: 100%;
  height: 4px;
  background: var(--uw-bg-subtle);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.loadingBarProgress {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 40%;
  background: var(--uw-brand-solid);
  border-radius: 999px;
  animation: indeterminateBar 1.2s infinite ease-in-out;
}

@keyframes indeterminateBar {
  0% {
    left: -40%;
    width: 40%;
  }
  50% {
    left: 30%;
    width: 50%;
  }
  100% {
    left: 100%;
    width: 40%;
  }
}
</style>
