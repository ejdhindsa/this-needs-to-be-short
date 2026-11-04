<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

interface Props {
  isOpen: boolean;
  size?: "default" | "compact";
}

const props = withDefaults(defineProps<Props>(), {
  size: "default",
});

const emits = defineEmits<{
  close: [];
}>();

const handleKeyDown = (pressed: KeyboardEvent) => {
  if (pressed.key === "Escape" && props.isOpen) {
    emits("close");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div class="background" v-if="isOpen" @click.self="emits('close')">
        <div class="modal" :class="{ isCompact: props.size === 'compact' }">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.background {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 50%);
  z-index: var(--uw-z-modal);
  padding: 1rem;
  padding: max(1rem, env(safe-area-inset-top, 1rem))
    max(1rem, env(safe-area-inset-right, 1rem))
    max(1rem, env(safe-area-inset-bottom, 1rem))
    max(1rem, env(safe-area-inset-left, 1rem));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal {
  width: 100%;
  max-width: min(50rem, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  background-color: var(--uw-bg-surface);
  border: 1px solid var(--uw-border-subtle);
  border-radius: 10px;
  padding: 1.25rem;
  margin: auto;
  transition: max-width 0.25s ease;

  @media (min-width: 40rem) {
    padding: 1.5rem;
  }

  &.isCompact {
    max-width: min(24rem, calc(100vw - 2rem));
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease;
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;

  .modal {
    transform: scale(0.95);
  }
}
</style>
