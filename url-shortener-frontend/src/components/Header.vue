<script setup lang="ts">
import { Cable } from "@lucide/vue";
import { RouterLink } from "vue-router";
import { Routes } from "../enums/enums";
import Theme from "./Theme.vue";
</script>

<template>
  <header class="appHeader">
    <div class="headerContainer">
      <RouterLink
        :to="{ name: Routes.Home }"
        class="brandLink"
        aria-label="This needs to be short"
      >
        <div class="logoIcon">
          <Cable :size="26" :stroke-width="2.25" class="iconSvg" />
        </div>

        <div class="logoText">
          <div class="expandPrefix">
            <div class="expandPrefixInner">
              <span class="prefixLine">This needs</span>
              <span class="prefixLine">to be</span>
            </div>
          </div>
          <span class="anchorWord">SHORT</span>
        </div>
      </RouterLink>

      <div class="headerActions">
        <Theme />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.appHeader {
  position: sticky;
  top: 0;
  z-index: var(--uw-z-sticky);
  background-color: var(--uw-bg-surface);
  border-bottom: 1px solid var(--uw-border-subtle);
}

.headerContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--uw-breakpoint-xl);
  margin: 0 auto;
  padding: 8px 16px;

  @media (min-width: 40rem) {
    padding: 8px 24px;
  }
}

.brandLink {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--uw-fg-heading);
  border-radius: 6px;
  padding: 4px 8px;
  height: 36px;
  box-sizing: border-box;

  &:hover {
    .logoIcon .iconSvg {
      transform: rotate(-12deg);
    }

    .expandPrefix {
      grid-template-columns: 1fr;
    }

    .expandPrefixInner {
      opacity: 1;
    }

    .anchorWord {
      color: var(--uw-brand-solid-hover);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }
}

.logoIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--uw-brand-solid);

  .iconSvg {
    transition: transform 0.2s ease;
    transform-origin: center;
  }
}

.logoText {
  display: none;
}

@media (min-width: 30rem) {
  .logoText {
    display: inline-flex;
    align-items: center;
    height: 100%;
    font-family: var(--uw-font-display, var(--uw-font-sans));
    cursor: pointer;
    user-select: none;
    line-height: 1;
  }

  .expandPrefix {
    display: grid;
    grid-template-columns: 0fr;
    height: 100%;
    transition: grid-template-columns 0.2s ease;
  }

  .expandPrefixInner {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    align-items: flex-end;
    padding-right: 4px;
    height: 100%;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .prefixLine {
    font-size: 11px;
    line-height: 1.1;
    font-weight: var(--uw-font-weight-semibold);
    color: var(--uw-fg-muted);
  }

  .anchorWord {
    font-weight: var(--uw-font-weight-bold);
    font-size: var(--uw-font-size-2xl);
    line-height: 1;
    letter-spacing: var(--uw-letter-spacing-tight);
    color: var(--uw-brand-solid);
    transition: color 0.15s ease;
  }
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
