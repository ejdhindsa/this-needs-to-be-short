<script setup lang="ts">
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
</script>

<template>
  <div class="layout">
    <Header />
    <main class="mainLayout">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.maincontent {
  flex: 1;
}
</style>
