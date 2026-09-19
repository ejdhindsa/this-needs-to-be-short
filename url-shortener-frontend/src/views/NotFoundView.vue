<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Cable } from "@lucide/vue";
import { Routes } from "../enums/enums";
</script>

<template>
  <div class="notFoundView">
    <div class="watermark">
      <Cable :size="520" :stroke-width="1" />
    </div>

    <div class="content">
      <div class="errorCode">
        <span>4</span>
        <Cable :stroke-width="2.25" class="zeroIcon" />
        <span>4</span>
      </div>

      <blockquote class="quote">
        Uh...? I think we messed it up. Pack it up boys, we are going home.
      </blockquote>

      <p class="explanation">
        The requested link or resource could not be found. It may have expired,
        been deleted, or the address might contain a typo.
      </p>

      <div class="actionRow">
        <RouterLink :to="{ name: Routes.Home }" class="homeButton">
          Back to Home
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notFoundView {
  position: relative;
  display: flex;
  align-items: flex-start;
  min-height: calc(85vh - 4rem);
  padding-top: clamp(2.5rem, 12vh, 6rem);
  padding-bottom: clamp(3rem, 8vh, 5rem);
  overflow: hidden;
  box-sizing: border-box;
}

.watermark {
  position: absolute;
  right: -4%;
  top: 45%;
  transform: translateY(-50%) rotate(12deg);
  opacity: 0.07;
  color: var(--uw-brand-solid);
  pointer-events: none;
  user-select: none;
  z-index: 0;

  @media (max-width: 52rem) {
    display: none;
  }
}

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  max-width: 580px;
  width: 100%;
  margin-left: clamp(1.5rem, 8vw, 96px);
  margin-right: clamp(1.5rem, 4vw, 3rem);
}

.errorCode {
  display: inline-flex;
  align-items: center;
  gap: 0.08em;
  font-family: var(--uw-font-display, sans-serif);
  font-size: clamp(6.5rem, 20vw, 11rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--uw-brand-solid);
  user-select: none;
  margin-bottom: clamp(2rem, 4vh, 3rem);

  &:hover .zeroIcon {
    transform: rotate(0deg) scale(1.08);
  }
}

.zeroIcon {
  width: 0.82em;
  height: 0.82em;
  color: var(--uw-brand-solid);
  transform: rotate(-12deg);
  transition: transform 0.25s ease;
}

.quote {
  margin: 0 0 clamp(1.5rem, 3.5vh, 2.25rem);
  padding-left: 1rem;
  border-left: 2px solid var(--uw-brand-solid);
  font-family: var(--uw-font-mono, monospace);
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--uw-fg-muted);
  max-width: 580px;
}

.explanation {
  font-size: clamp(0.95rem, 2vw, 1.0625rem);
  color: var(--uw-fg-muted);
  line-height: 1.7;
  max-width: 32rem;
  margin: 0;
}

.actionRow {
  margin-top: clamp(2.5rem, 6vh, 4.5rem);
}

.homeButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.9375rem;
  color: var(--uw-brand-solid);
  background-color: transparent;
  border: 1.5px solid var(--uw-brand-solid);
  border-radius: var(--uw-radius-sm, 6px);
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background-color: var(--uw-brand-bg-hover, rgba(16, 185, 129, 0.08));
    color: var(--uw-brand-solid-hover);
    border-color: var(--uw-brand-solid-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }
}
</style>
