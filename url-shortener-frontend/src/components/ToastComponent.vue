<script setup lang="ts">
import { useToast } from "../composables/useToast";
import { CircleCheckBig, CircleAlert, Info, X } from "@lucide/vue";

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="toastContainer" aria-live="polite" role="region">
    <TransitionGroup name="toast" tag="div" class="toastList">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toastCard', toast.type]"
        role="alert"
      >
        <div class="toastIcon">
          <CircleCheckBig v-if="toast.type === 'success'" :size="18" />
          <CircleAlert v-if="toast.type === 'error'" :size="18" />
          <Info v-if="toast.type === 'info'" :size="18" />
        </div>

        <div class="toastMessage">
          {{ toast.message }}
        </div>

        <button
          type="button"
          class="dismissButton"
          aria-label="Dismiss notification"
          @click="removeToast(toast.id)"
        >
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.toastContainer {
  position: fixed;
  bottom: var(--uw-space-16);
  left: 0;
  right: 0;
  margin-inline: auto;
  z-index: var(--uw-z-toast);
  pointer-events: none;
  max-width: calc(100vw - var(--uw-space-8));
  width: 24rem;
}

.toastList {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--uw-space-2);
}

.toastCard {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--uw-space-3);
  padding: var(--uw-space-3) var(--uw-space-4);
  background-color: var(--uw-bg-surface);
  border: 1px solid var(--uw-border-subtle);
  border-radius: var(--uw-radius-lg);
  box-shadow: var(--uw-shadow-lg);
  color: var(--uw-fg-default);
  font-size: var(--uw-font-size-sm);
  line-height: 1.4;

  &.success {
    border-color: var(--uw-success-border);
    .toastIcon {
      color: var(--uw-success-solid);
    }
  }

  &.error {
    border-color: var(--uw-danger-border);
    .toastIcon {
      color: var(--uw-danger-solid);
    }
  }

  &.info {
    border-color: var(--uw-info-border);
    .toastIcon {
      color: var(--uw-info-solid);
    }
  }
}

.toastIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toastMessage {
  flex: 1;
  word-break: break-word;
}

.dismissButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: var(--uw-space-1);
  margin: calc(-1 * var(--uw-space-1));
  color: var(--uw-fg-muted);
  border-radius: var(--uw-radius-sm);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    color: var(--uw-fg-default);
    background-color: var(--uw-bg-subtle);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 1px;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(4px);
}

.toast-move {
  transition: transform 0.25s ease;
}
</style>
