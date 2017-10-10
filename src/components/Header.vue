<template>
  <b-navbar toggleable="md" type="light" variant="light">
    <div class="container">
      <b-nav-toggle target="nav_collapse"></b-nav-toggle>
      <b-navbar-brand class="ml-auto"  to="/">Book Trading App</b-navbar-brand>
      <b-collapse is-nav id="nav_collapse">
        <slot name="nav-items"></slot>
      </b-collapse>
    </div>
  </b-navbar>
</template>

<script>
export default {
  name: 'header'
}
</script>

<style scoped>

</style>
