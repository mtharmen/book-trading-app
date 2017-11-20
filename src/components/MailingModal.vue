<template>
  <div>
    <slot></slot>
    <b-modal id="mailingModal" ref="mailingModal" hide-footer :title="username">
      <p>Name: {{ fullname }}</p>
      <p>Address: {{ address.city}}, {{ address.province }}</p>
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
  computed: {
    fullname () {
      return this.address.firstname + ' ' + this.address.lastname
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
