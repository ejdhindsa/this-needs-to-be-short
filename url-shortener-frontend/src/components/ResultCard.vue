<script setup lang="ts">
import { ref, computed } from "vue";
import { Copy, Check, ExternalLink, Link, Download } from "@lucide/vue";
import QrcodeVue from "qrcode.vue";
import { useToast } from "../composables/useToast";

interface Props {
  originalURL: string;
  shortCode: string;
}

const props = defineProps<Props>();

const emits = defineEmits<{
  close: [];
}>();

const { successToast, errorToast } = useToast();
const isCopied = ref(false);
const qrRef = ref<InstanceType<typeof QrcodeVue> | null>(null);

const displayUrl = computed(() => `unwreck.dev/${props.shortCode}`);
const fullUrl = computed(() => `https://unwreck.dev/${props.shortCode}`);

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(fullUrl.value);
    isCopied.value = true;
    successToast("Copy it, copy it good.");
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch {
    errorToast("Nah, can't copy, try again.");
  }
};

const handleDownloadQr = () => {
  const canvas = qrRef.value?.$el as HTMLCanvasElement | undefined;
  if (!canvas) {
    errorToast("Can't download, womp womp...");
    return;
  }

  try {
    const downloadLink = document.createElement("a");
    downloadLink.download = `${props.shortCode}-qr.png`;
    downloadLink.href = canvas.toDataURL("image/png");
    downloadLink.click();

    successToast("There you have it, take it home!");
  } catch {
    errorToast("Try again, I guess?");
  }
};
</script>

<template>
  <div class="resultCard">
    <div class="detailsCol">
      <div class="headerSection">
        <div class="iconBadge">
          <Link :size="20" class="badgeIcon" />
        </div>
        <h2 class="title">Your link is ready!</h2>
        <p class="subtitle">Use the shortened URL below or scan the QR code.</p>
      </div>

      <div class="shortLinkRow">
        <div class="urlDisplay">
          <span class="urlText">{{ displayUrl }}</span>
        </div>
        <div class="linkActions">
          <button
            type="button"
            class="actionButton copyButton"
            :class="{ isCopied }"
            :title="isCopied ? 'Copied!' : 'Copy to clipboard'"
            @click="handleCopy"
          >
            <Check v-if="isCopied" :size="16" />
            <Copy v-else :size="16" />
            <span>{{ isCopied ? "Copied" : "Copy" }}</span>
          </button>

          <a
            :href="fullUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="actionButton openButton"
            title="Open in new tab"
          >
            <ExternalLink :size="16" />
          </a>
        </div>
      </div>

      <div class="destinationRow">
        <span class="destinationLabel">Destination:</span>
        <span class="destinationUrl" :title="originalURL">{{
          originalURL
        }}</span>
      </div>

      <div class="footerActions">
        <button type="button" class="resetButton" @click="emits('close')">
          Shorten Another Link
        </button>
      </div>
    </div>

    <div class="qrSection">
      <div class="qrWrapper">
        <QrcodeVue
          ref="qrRef"
          :value="fullUrl"
          :size="140"
          level="H"
          render-as="canvas"
          background="#ffffff"
          foreground="#000000"
        />
      </div>

      <button type="button" class="downloadButton" @click="handleDownloadQr">
        <Download :size="16" />
        <span>Download PNG</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.resultCard {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 44rem) {
    flex-direction: row;
    align-items: stretch;
  }
}

.detailsCol {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.headerSection {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.iconBadge {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--uw-radius-sm);
  background: var(--uw-bg-subtle);
  border: 1px solid var(--uw-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
  color: var(--uw-brand-solid);
}

.title {
  font-family: var(--uw-font-display, sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--uw-fg-heading);
  margin: 0;
}

.subtitle {
  font-size: 0.8125rem;
  color: var(--uw-fg-muted);
  margin: 0;
}

.shortLinkRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--uw-bg-subtle);
  border: 1px solid var(--uw-border-default);
  border-radius: var(--uw-radius-md);
  min-width: 0;
}

.urlDisplay {
  flex: 1;
  min-width: 0;
  padding-left: 0.25rem;
}

.urlText {
  font-family: var(--uw-font-mono, monospace);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--uw-brand-solid);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.linkActions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.actionButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.4rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--uw-radius-sm);
  border: 1px solid var(--uw-border-subtle);
  background: var(--uw-bg-surface);
  color: var(--uw-fg-default);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: var(--uw-bg-subtle);
    border-color: var(--uw-border-default);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 1px;
  }
}

.copyButton.isCopied {
  background: var(--uw-brand-solid);
  color: var(--uw-brand-on-solid);
  border-color: var(--uw-brand-solid);
}

.openButton {
  padding: 0.4rem 0.5rem;
  color: var(--uw-fg-muted);

  &:hover {
    color: var(--uw-fg-default);
  }
}

.destinationRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--uw-bg-surface);
  border: 1px solid var(--uw-border-subtle);
  border-radius: var(--uw-radius-sm);
  min-width: 0;
}

.destinationLabel {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--uw-fg-muted);
  flex-shrink: 0;
}

.destinationUrl {
  font-size: 0.75rem;
  font-family: var(--uw-font-mono, monospace);
  color: var(--uw-fg-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.footerActions {
  display: flex;
  flex-direction: column;
  margin-top: auto;
  padding-top: 0.25rem;
}

.resetButton {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: var(--uw-radius-md);
  border: none;
  background: var(--uw-brand-solid);
  color: var(--uw-brand-on-solid);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--uw-brand-solid-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }
}

.qrSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: var(--uw-bg-subtle);
  border: 1px solid var(--uw-border-subtle);
  border-radius: var(--uw-radius-md);
  flex-shrink: 0;

  @media (min-width: 44rem) {
    min-width: 11.5rem;
  }
}

.qrWrapper {
  background: #ffffff;
  padding: 0.5rem;
  border-radius: var(--uw-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  line-height: 0;
}

.downloadButton {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--uw-radius-sm);
  border: 1px solid var(--uw-border-default);
  background: var(--uw-bg-surface);
  color: var(--uw-fg-default);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--uw-bg-subtle);
    border-color: var(--uw-brand-solid);
    color: var(--uw-brand-solid);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 1px;
  }
}
</style>
