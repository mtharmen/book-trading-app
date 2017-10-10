<template>
  <div>
    <app-update-form></app-update-form>
  </div>
</template>

<script>
import UpdateForm from '@/components/UpdateForm'

export default {
  name: 'profile',
  components: {
    'app-update-form': UpdateForm
  },
  data () {
    return {
      msg: 'Profile'
    }
  }
}
</script>

<style scoped>

</style>
