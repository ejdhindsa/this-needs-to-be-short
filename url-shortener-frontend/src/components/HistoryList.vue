<script setup lang="ts">
import { ref, computed } from "vue";
import { Copy, Check, ExternalLink, BarChart2, Trash2 } from "@lucide/vue";
import { useHistoryStore } from "../stores/historyStore";
import { useToast } from "../composables/useToast";
import ResponsiveModal from "./ResponsiveModal.vue";

const historyStore = useHistoryStore();
const { successToast, errorToast, infoToast } = useToast();

const copiedCode = ref<string | null>(null);
const isDeleteModalOpen = ref(false);

const PAGE_SIZE = 5;
const visibleCount = ref(PAGE_SIZE);

const visibleLinks = computed(() => {
  return historyStore.links.slice(0, visibleCount.value);
});

const hasMore = computed(() => {
  return historyStore.links.length > visibleCount.value;
});

const remainingCount = computed(() => {
  return Math.max(0, historyStore.links.length - visibleCount.value);
});

const handleShowMore = () => {
  visibleCount.value += PAGE_SIZE;
};

const handleShowLess = () => {
  visibleCount.value = PAGE_SIZE;
};

const baseUrl = import.meta.env.VITE_SHORT_BASE_URL || "http://localhost:3000";
const getFullUrl = (code: string) => `${baseUrl}/${code}`;

const handleCopy = async (code: string) => {
  try {
    await navigator.clipboard.writeText(getFullUrl(code));
    copiedCode.value = code;
    successToast("Copy it, copy it good.");
    setTimeout(() => {
      if (copiedCode.value === code) {
        copiedCode.value = null;
      }
    }, 2000);
  } catch {
    errorToast("Nah, can't copy, try again.");
  }
};

const handleConfirmClear = () => {
  historyStore.clearHistory();
  isDeleteModalOpen.value = false;
  infoToast("History cleared.");
};

const formatDate = (isoString: string) => {
  if (!isoString) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(isoString));
};
</script>

<template>
  <section v-if="historyStore.links.length > 0" class="historySection">
    <div class="historyHeader">
      <h2 class="historyTitle">Recent links</h2>
      <button
        type="button"
        class="clearAllButton"
        title="Delete all history"
        @click="isDeleteModalOpen = true"
      >
        <Trash2 :size="14" />
        <span class="clearAllText">Delete all</span>
      </button>
    </div>

    <div class="historyCard">
      <TransitionGroup name="listFade" tag="ul" class="historyList">
        <li
          v-for="(item, index) in visibleLinks"
          :key="item.shortCode"
          class="historyItem"
        >
          <div class="itemDetails">
            <div class="shortLinkRow">
              <a
                :href="getFullUrl(item.shortCode)"
                target="_blank"
                rel="noopener noreferrer"
                class="shortCode"
                title="Open link in new tab"
              >
                s.unwreck.dev/{{ item.shortCode }}
              </a>
              <span v-if="index === 0" class="linkBadge latestBadge">
                Latest
              </span>
              <span
                v-if="item.linkType === 'Custom'"
                class="linkBadge customBadge"
              >
                Custom
              </span>
            </div>
            <span class="originalUrl" :title="item.originalURL">
              {{ item.originalURL }}
            </span>
            <span v-if="item.createdAt" class="itemDate">
              {{ formatDate(item.createdAt) }}
            </span>
          </div>

          <div class="itemActions">
            <button
              type="button"
              class="copyActionButton"
              :class="{ isCopied: copiedCode === item.shortCode }"
              :title="
                copiedCode === item.shortCode ? 'Copied!' : 'Copy to clipboard'
              "
              @click="handleCopy(item.shortCode)"
            >
              <Check v-if="copiedCode === item.shortCode" :size="14" />
              <Copy v-else :size="14" />
              <span>{{
                copiedCode === item.shortCode ? "Copied" : "Copy"
              }}</span>
            </button>

            <div class="secondaryActions">
              <a
                :href="getFullUrl(item.shortCode)"
                target="_blank"
                rel="noopener noreferrer"
                class="iconActionBtn"
                title="Open in new tab"
              >
                <ExternalLink :size="15" />
              </a>

              <RouterLink
                :to="`/analytics/${item.shortCode}`"
                class="iconActionBtn"
                title="View analytics"
              >
                <BarChart2 :size="15" />
              </RouterLink>
            </div>

            <div class="actionDivider" />

            <button
              type="button"
              class="iconActionBtn deleteActionBtn"
              title="Remove from history"
              @click="historyStore.removeLink(item.shortCode)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </li>
      </TransitionGroup>

      <div v-if="historyStore.links.length > PAGE_SIZE" class="historyFooter">
        <button
          v-if="hasMore"
          type="button"
          class="linkListOpener"
          @click="handleShowMore"
        >
          Show {{ Math.min(PAGE_SIZE, remainingCount) }} more ↓
        </button>
        <button
          v-else
          type="button"
          class="linkListOpener"
          @click="handleShowLess"
        >
          Show less ↑
        </button>
      </div>
    </div>
  </section>

  <ResponsiveModal
    :isOpen="isDeleteModalOpen"
    size="compact"
    @close="isDeleteModalOpen = false"
  >
    <div class="confirmModal">
      <h3 class="confirmTitle">
        <Trash2 :size="16" class="confirmTitleIcon" />
        <span>Clear link history?</span>
      </h3>
      <p class="confirmDescription">
        All shortened links saved in your local browser history will be removed.
        You won't be able to recover them here.
      </p>
      <div class="confirmActions">
        <button
          type="button"
          class="confirmBtn destructiveLinkBtn"
          @click="handleConfirmClear"
        >
          Yes, wipe history
        </button>
        <button
          type="button"
          class="confirmBtn safeActionBtn"
          @click="isDeleteModalOpen = false"
        >
          Keep my links
        </button>
      </div>
    </div>
  </ResponsiveModal>
</template>

<style scoped lang="scss">
.historySection {
  width: 100%;
  max-width: min(44rem, 92vw);
  margin: 0.25rem auto 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.historyHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.25rem;
}

.historyTitle {
  font-family: var(--uw-font-display, sans-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--uw-fg-heading);
  letter-spacing: -0.015em;
  margin: 0;
}

.clearAllButton {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--uw-danger-fg);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--uw-danger-solid-hover);
    background: var(--uw-danger-bg);
    border-color: var(--uw-danger-border);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 1px;
  }
}

.clearAllText {
  display: none;

  @media (min-width: 40rem) {
    display: inline;
  }
}

.historyCard {
  background: var(--uw-bg-surface);
  border: 1px solid var(--uw-border-subtle);
  border-radius: 12px;
  overflow: hidden;
}

.historyList {
  list-style: none;
  margin: 0;
  padding: 0;
}

.historyItem {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--uw-border-subtle);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--uw-bg-surface-hover);
  }

  @media (min-width: 40rem) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
  }

  &.listFade-enter-active {
    transition:
      opacity 0.3s ease-out,
      transform 0.3s ease-out;
  }

  &.listFade-leave-active {
    transition:
      opacity 0.2s ease-in,
      transform 0.2s ease-in;
  }

  &.listFade-enter-from {
    opacity: 0;
    transform: translateY(-10px);
  }

  &.listFade-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
}

.historyFooter {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--uw-border-subtle);
  background: transparent;
}

.linkListOpener {
  background: transparent;
  border: none;
  font-family: var(--uw-font-sans, inherit);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--uw-fg-muted);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.15s ease;

  &:hover {
    color: var(--uw-fg-heading);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }
}

.itemDetails {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.shortLinkRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.shortCode {
  font-family: var(--uw-font-mono, monospace);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--uw-brand-solid);
  letter-spacing: -0.015em;
  white-space: nowrap;
  text-decoration: none;
  transition:
    opacity 0.15s ease,
    text-decoration 0.15s ease;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
    border-radius: 2px;
  }
}

.linkBadge {
  font-family: var(--uw-font-sans, sans-serif);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: none;
  line-height: 1.2;
}

.latestBadge {
  background: var(--uw-bg-subtle);
  color: var(--uw-fg-muted);
}

.customBadge {
  background: var(--uw-bg-subtle);
  color: var(--uw-fg-subtle);
}

.originalUrl {
  font-size: 0.8rem;
  color: var(--uw-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.itemDate {
  font-size: 0.75rem;
  color: var(--uw-fg-subtle);
  line-height: 1;
}

.itemActions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.copyActionButton {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--uw-border-subtle);
  background: var(--uw-bg-subtle);
  color: var(--uw-fg-default);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--uw-bg-surface-hover);
    border-color: var(--uw-border-default);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 1px;
  }

  &.isCopied {
    background: var(--uw-brand-solid);
    color: var(--uw-brand-on-solid);
    border-color: var(--uw-brand-solid);
  }
}

.secondaryActions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.iconActionBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  border: 1px solid var(--uw-border-subtle);
  background: var(--uw-bg-subtle);
  color: var(--uw-fg-muted);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: var(--uw-bg-surface-hover);
    border-color: var(--uw-border-default);
    color: var(--uw-fg-default);
  }

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 1px;
  }
}

.actionDivider {
  width: 1px;
  height: 1rem;
  background: var(--uw-border-subtle);
  margin: 0 0.35rem;
}

.deleteActionBtn {
  color: var(--uw-danger-fg);
  border: 1px solid transparent;
  background: transparent;

  &:hover,
  &:focus-visible {
    color: var(--uw-danger-solid-hover);
    background: var(--uw-danger-bg);
    border-color: var(--uw-danger-border);
  }
}

/* Modal Styling */
.confirmModal {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

.confirmTitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--uw-font-display, sans-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--uw-fg-heading);
  letter-spacing: -0.015em;
  margin: 0;
}

.confirmTitleIcon {
  color: var(--uw-danger-fg);
  flex-shrink: 0;
}

.confirmDescription {
  font-size: 0.85rem;
  color: var(--uw-fg-muted);
  line-height: 1.5;
  margin: 0;
}

.confirmActions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--uw-border-subtle);
}

.confirmBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.15s ease;

  &:focus-visible {
    outline: 2px solid var(--uw-focus-ring);
    outline-offset: 2px;
  }
}

.destructiveLinkBtn {
  background: transparent;
  border: none;
  color: var(--uw-danger-fg);
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 0.4rem 0.5rem;

  &:hover {
    color: var(--uw-danger-solid-hover);
  }
}

.safeActionBtn {
  background: var(--uw-bg-surface-hover);
  border: 1px solid var(--uw-border-default);
  color: var(--uw-fg-heading);
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--uw-bg-subtle);
    border-color: var(--uw-brand-solid);
  }
}
</style>
