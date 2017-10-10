<template>
  <span>
    <slot></slot>
    <img src="../assets/loading.svg">
  </span>
</template>

<script>
export default {
  name: 'loading'
}
</script>

<style scoped>
  img {
    margin: -20px auto;
    width: 50px;
  }
</style>
