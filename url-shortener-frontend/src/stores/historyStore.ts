import { defineStore } from "pinia";
import { ref } from "vue";
import type { ShortenResponse } from "../api/types";

export const useHistoryStore = defineStore("history", () => {
  const saved = localStorage.getItem("shortener_history");
  const initialLinks: ShortenResponse[] = saved ? JSON.parse(saved) : [];

  const links = ref<ShortenResponse[]>(initialLinks);

  function addLink(newLink: ShortenResponse) {
    const alreadyExists = links.value.some(
      (link) => link.shortCode === newLink.shortCode,
    );

    if (alreadyExists) {
      return;
    }

    links.value.unshift(newLink);
    localStorage.setItem("shortener_history", JSON.stringify(links.value));
  }

  function removeLink(shortCode: string) {
    links.value = links.value.filter((link) => link.shortCode !== shortCode);
    localStorage.setItem("shortener_history", JSON.stringify(links.value));
  }

  function clearHistory() {
    links.value = [];
    localStorage.removeItem("shortener_history");
  }

  return {
    links,
    addLink,
    removeLink,
    clearHistory,
  };
});
