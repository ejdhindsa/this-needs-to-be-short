<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emits = defineEmits(["close"]);

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
        <div class="modal">
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
  width: 100vw;
  height: 100vh;
  background-color: rgb(0 0 0 / 50%);
  z-index: var(--uw-z-modal);
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: min(50rem, calc(100vw - 3rem));
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--uw-bg-surface);
  border: 1px solid var(--uw-border-subtle);
  border-radius: 10px;
  padding: 1.5rem;
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
