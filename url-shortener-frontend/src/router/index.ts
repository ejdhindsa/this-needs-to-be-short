import { createRouter, createWebHistory } from "vue-router";
import { Routes } from "../enums/enums";
import HomeView from "../views/HomeView.vue";
import AnalyticsView from "../views/AnalyticsView.vue";
import NotFoundView from "../views/NotFoundView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: HomeView,
      name: Routes.Home,
      meta: { title: "Home" },
    },
    {
      path: "/analytics/:shortCode",
      component: AnalyticsView,
      name: Routes.Analytics,
      props: true,
      meta: { title: "Analytics" },
    },
    {
      path: "/:pathMatch(.*)*",
      component: NotFoundView,
      name: Routes.NotFound,
      meta: { title: "404 Not Found" },
    },
  ],

  scrollBehavior(_to, _from, savedPosition) {
    // if browser has a saved position, save it
    if (savedPosition) {
      return savedPosition;
    }

    // otherwise return to the top
    return {
      top: 0,
      behavior: "smooth",
    };
  },
});

router.afterEach((to, _from, failure) => {
  if (!failure && typeof to.meta.title === "string") {
    document.title = to.meta.title + " | Unwreck Shortener";
  }
});

export default router;
