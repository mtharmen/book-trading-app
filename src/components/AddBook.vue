<template>
  <div>
    <app-search></app-search>
  </div>
</template>

<script>
import Search from '@/components/Search'

export default {
  name: 'add-book',
  components: {
    'app-search': Search
  },
  data () {
    return {
    }
  }
}
</script>

<style scoped>
</style>
