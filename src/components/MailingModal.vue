<template>
  <div>
    <slot></slot>
    <b-modal id="mailingModal" ref="mailingModal" hide-footer :title="username">
      {{ address }}
    </b-modal>
  </div>
</template>

<script>
export default {
  name: 'mailing-modal',
  data () {
    return {
      address: '',
      username: ''
    }
  },
  methods: {
    showModal (info) {
      this.address = info.profile
      this.username = info.username
      this.$refs.mailingModal.show()
    },
    close () {
      this.$refs.mailingModal.hide()
    }
  }
}
</script>

<style scoped>
</style>
