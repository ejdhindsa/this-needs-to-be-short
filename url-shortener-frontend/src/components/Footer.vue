<script setup lang="ts">
import { computed } from "vue";

const currentYear = computed(() => new Date().getFullYear());
</script>

<template>
  <footer class="footer">
    <div class="footerContainer">
      <p class="copyrightText">
        &copy; {{ currentYear }} This needs to be short
      </p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  border-top: 1px solid var(--uw-border-subtle);
  background-color: var(--uw-bg-surface);
  margin-top: auto;
}

.footerContainer {
  max-width: var(--uw-breakpoint-xl);
  margin: 0 auto;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 40rem) {
    padding: 16px 24px;
  }
}

.copyrightText {
  font-size: var(--uw-font-size-xs);
  color: var(--uw-fg-muted);
}
</style>
