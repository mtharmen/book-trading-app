<template>
  <div class="row">
    <div class="input-group mb-4" v-if="type !== 'add'">
      <div class="input-group-addon">Filter by title</div>
      <span class="input-group-btn">
        <div class="btn-group" role="group">
          <!-- <button class="btn btn-info" :class="{'active': filter.type === 'title'}" @click="filter.type = 'title'">Title</button> -->
          <!-- <button class="btn btn-info" :class="{'active': filter.type === 'ISBN'}" @click="filter.type = 'ISBN'">ISBN</button> -->
          <!-- <button class="btn btn-primary" @click="filter.type = 'authors'">Author</button> -->
        </div>
      </span>
      <input class="form-control" v-model="filter.term">
    </div>
    <template v-for="(book, i) in filtered">
      <img class="image-fixed p-1" :src="book.image" @click="moreDetail(book)" :key="i">
    </template>
    <app-detail-modal ref="details" :type="type"></app-detail-modal>
  </div>
</template>

<script>
import DetailModal from '@/components/DetailModal'

export default {
  name: 'book-grid',
  props: ['books', 'type'],
  components: {
    'app-detail-modal': DetailModal
  },
  data () {
    return {
      filter: {
        term: '',
        type: 'title'
      }
    }
  },
  computed: {
    filtered () {
      return this.books.filter(book => book[this.filter.type].toLowerCase().indexOf(this.filter.term) > -1)
    }
  },
  methods: {
    moreDetail (book) {
      this.$refs.details.showModal(book)
    }
  }
}
</script>

<style scoped>
  .no-outline {
    border: none;
  }

  .image-fixed {
    object-fit: contain;
  }

  .flip-list-move {
  transition: transform 1s;
}
</style>