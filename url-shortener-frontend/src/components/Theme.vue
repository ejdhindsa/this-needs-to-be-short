<script setup lang="ts">
import { Moon, Sun } from "@lucide/vue";
import { getPreference, setTheme } from "@unwreck/core/theme";
import { ref } from "vue";

const currentTheme = ref(getPreference());

const toggleTheme = () => {
  const altTheme = currentTheme.value === "dark" ? "light" : "dark";

  if (!document.startViewTransition) {
    setTheme(altTheme);
    currentTheme.value = altTheme;
    return;
  }

  document.startViewTransition(() => {
    setTheme(altTheme);
    currentTheme.value = altTheme;
  });
};
</script>

<template>
  <button
    @click="toggleTheme"
    class="themeButton"
    aria-label="Toggle theme"
  >
    <Transition name="themeIcon" mode="out-in">
      <span :key="currentTheme" class="iconWrapper">
        <Sun v-if="currentTheme === 'dark'" :size="18" :stroke-width="2" />
        <Moon v-else :size="18" :stroke-width="2" />
      </span>
    </Transition>
  </button>
</template>

<style lang="scss" scoped>
.themeButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: var(--uw-bg-subtle);
  color: var(--uw-fg-default);
  border: 1px solid var(--uw-border-subtle);
  cursor: pointer;
  overflow: hidden;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--uw-bg-surface-hover);
    color: var(--uw-fg-heading);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }
}

.iconWrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@keyframes spinIn {
  from {
    opacity: 0;
    transform: rotate(-120deg) scale(0.5);
  }
  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}

@keyframes spinOut {
  from {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
  to {
    opacity: 0;
    transform: rotate(120deg) scale(0.5);
  }
}

.themeIcon-enter-active {
  animation: spinIn 0.2s ease;
}

.themeIcon-leave-active {
  animation: spinOut 0.15s ease;
}
</style>
