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
} from "@lucide/vue";
import { useToast } from "../composables/useToast";
import { useHistoryStore } from "../stores/historyStore";
import { shortenURL } from "../api/clients";
import { normalizeUrl, isValidUrl } from "../utils/url";

const originalURL = ref("");
const customCode = ref("");
const showCustomInput = ref(false);
const isLoading = ref(false);

const { successToast, infoToast, errorToast } = useToast();
const historyStore = useHistoryStore();

const handleSubmit = async () => {
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
  isLoading.value = true;

  try {
    const result = await shortenURL({
      url: normalizedUrl,
      customCode:
        showCustomInput.value && trimmedCode ? trimmedCode : undefined,
    });

    historyStore.addLink(result);

    if (trimmedCode) {
      successToast("See, custom is always better.");
    } else {
      successToast("Link Unwrecked! Much better.");
    }

    originalURL.value = "";
    customCode.value = "";
    showCustomInput.value = false;
  } catch (error) {
    //TODO: Maybe the Axios errors should exist in clients.ts not here
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      errorToast("No, not this one. She's taken.");
    } else {
      errorToast("I am as clueless as you are, maybe try again?");
    }
  } finally {
    isLoading.value = false;
  }
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

//TODO: This should be sanitised a bit better, I willl revist this
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

      <div class="customAccordion" :class="{ isExpanded: showCustomInput }">
        <div class="customInputRow">
          <span class="customPrefix">unwreck.dev/</span>
          <input
            v-model="customCode"
            type="text"
            placeholder="custom-slug"
            :disabled="isLoading"
            class="customInput"
            @input="formatCustomCode"
          />
        </div>
      </div>
    </form>
  </div>
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

.customAccordion {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;

  &.isExpanded {
    grid-template-rows: 1fr;
  }
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
</style>
