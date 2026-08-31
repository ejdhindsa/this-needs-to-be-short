<script setup lang="ts">
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import ToastComponent from "./components/ToastComponent.vue";
</script>

<template>
  <div class="layout">
    <Header />
    <main class="mainLayout">
      <RouterView />
    </main>
    <Footer />
    <ToastComponent />
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.mainLayout {
  flex: 1;
}
</style>

