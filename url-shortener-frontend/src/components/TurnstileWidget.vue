<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

interface Props {
  sitekey?: string;
  theme?: "light" | "dark" | "auto";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "verify", token: string): void;
  (e: "expire"): void;
  (e: "error"): void;
}>();

const widgetContainer = ref<HTMLElement | null>(null);
const widgetId = ref<string | null>(null);
let checkInterval: ReturnType<typeof setInterval> | null = null;
let themeObserver: MutationObserver | null = null;

const siteKey =
  props.sitekey ||
  import.meta.env.VITE_TURNSTILE_SITE_KEY ||
  "1x00000000000000000000AA";

function getActiveTheme(): "light" | "dark" | "auto" {
  if (props.theme) {
    return props.theme;
  }
  const currentAttr = document.documentElement.getAttribute("data-theme");
  if (currentAttr === "dark" || currentAttr === "light") {
    return currentAttr;
  }
  return "auto";
}

function renderWidget() {
  if (!widgetContainer.value || !window.turnstile || widgetId.value !== null) {
    return;
  }

  try {
    widgetId.value = window.turnstile.render(widgetContainer.value, {
      sitekey: siteKey,
      theme: getActiveTheme(),
      callback: (token: string) => {
        emit("verify", token);
      },
      "expired-callback": () => {
        emit("expire");
      },
      "error-callback": () => {
        emit("error");
      },
    });
  } catch (error) {
    console.error("Failed to render Turnstile widget:", error);
    emit("error");
  }
}

function reRenderWidget() {
  if (widgetId.value !== null && window.turnstile) {
    try {
      window.turnstile.remove(widgetId.value);
    } catch (error) {
      console.error("Failed to remove widget on theme change:", error);
    }
    widgetId.value = null;
    emit("expire");
  }
  renderWidget();
}

function reset() {
  if (widgetId.value !== null && window.turnstile) {
    try {
      window.turnstile.reset(widgetId.value);
    } catch (error) {
      console.error("Failed to reset Turnstile widget:", error);
    }
  }
}

defineExpose({
  reset,
});

onMounted(() => {
  if (window.turnstile) {
    renderWidget();
  } else {
    checkInterval = setInterval(() => {
      if (window.turnstile) {
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        renderWidget();
      }
    }, 50);
  }

  // Observe theme changes on <html data-theme="..."> to dynamically update the widget
  themeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-theme"
      ) {
        reRenderWidget();
      }
    }
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
});

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }

  if (widgetId.value !== null && window.turnstile) {
    try {
      window.turnstile.remove(widgetId.value);
    } catch (error) {
      console.error("Failed to remove Turnstile widget:", error);
    }
    widgetId.value = null;
  }
});
</script>

<template>
  <div class="turnstileWrapper">
    <div ref="widgetContainer" class="turnstileBox"></div>
  </div>
</template>

<style scoped>
.turnstileWrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 65px;
  width: 100%;
}

.turnstileBox {
  display: inline-flex;
  justify-content: center;
  border-radius: var(--uw-radius-md, 8px);
  overflow: hidden;
}
</style>
