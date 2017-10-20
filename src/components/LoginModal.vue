<template>
  <div>
    <b-nav-item v-b-modal.loginModal>
      <slot></slot>
    </b-nav-item>
    <!-- Modal -->
    <b-modal id="loginModal" ref="loginModal" hide-footer size="lg" no-close-on-backdrop no-close-on-esc @shown="clear">
      <template slot="modal-header">
        <ul class="nav nav-pills nav-fill">
          <li class="nav-item fake-pointer" @click="loginType(false)">
            <a class="nav-link" :class="{'active': !signup}">Login</a>
          </li>
          <li class="nav-item fake-pointer" @click="loginType(true)">
            <a class="nav-link" :class="{'active': signup}">Sign Up</a>
          </li>
        </ul>
        <button type="button" class="close" slot="close-button" @click="close">
          <span>&times;</span>
        </button>
      </template>

      <form @submit.stop.prevent="login">
        <!-- Email -->
        <div class="form-group">
          <label for="email">Email</label>
          <input name="email" type="email" class="form-control" v-validate="'required|email'" v-model="userForm.email">
          <span v-show="errors.has('email')" class="small text-danger">{{ errors.first('email') }}</span>
        </div>

        <!-- Username -->
        <div class="form-group" v-if="signup">
          <label for="username">Username</label>
          <input name="username" type="text" class="form-control" v-validate="'required|alpha|min:2|max:24'" maxlength="24" v-model="userForm.username">
          <span v-show="errors.has('username')" class="small text-danger">{{ errors.first('username') }}</span>
        </div>

        <!-- First Name -->
        <div class="form-group" v-if="signup">
          <label for="firstname">First Name</label>
          <input name="firstname" type="text" class="form-control" v-validate="'required|alpha|max:50'" maxlength="50" v-model="userForm.firstname">
          <span v-show="errors.has('firstname')" class="small text-danger">{{ errors.first('firstname') }}</span>
        </div>

        <!-- Last Name -->
        <div class="form-group" v-if="signup">
          <label for="lastname">Last Name</label>
          <input name="lastname" type="text" class="form-control" v-validate="'required|alpha|max:50'" maxlength="50" v-model="userForm.lastname">
          <span v-show="errors.has('lastname')" class="small text-danger">{{ errors.first('lastname') }}</span>
        </div>

        <!-- Address -->
        <div class="row" v-if="signup">
          <!-- Province -->
          <div class="form-group col-6">
            <label for="province">Province/Territory</label>
            <select name="province" class="form-control" id="province" v-validate="'required'" v-model="userForm.province">
              <option v-for="(choice, i) in choices" :key="i">{{choice}}</option>
            </select>
            <span v-show="errors.has('province')" class="small text-danger">{{ errors.first('province') }}</span>
          </div>

          <!-- City -->
          <div class="form-group col-6">
            <label for="city">City</label>
            <input name="city" type="text" class="form-control" v-validate="'required|alpha|max:50'" maxlength="50" v-model="userForm.city">
            <span v-show="errors.has('city')" class="small text-danger">{{ errors.first('city') }}</span>
          </div>
          
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password">Password</label>
          <input name="password" type="password" class="form-control" v-validate="'required|min:4'" v-model="userForm.password">
          <span v-show="errors.has('password')" class="small text-danger">{{ errors.first('password') }}</span>
        </div>

        <!-- Password Confirm -->
        <div class="form-group" v-if="signup">
          <label for="password2">Password Confirmation</label>
          <input name="password2" type="password" class="form-control" v-validate="'required|confirmed:password'" data-vv-as="password confirmation" v-model="userForm.password2">
          <span v-show="errors.has('password2')" class="small text-danger">{{ errors.first('password2') }}</span>
        </div>

        <div class="alert alert-danger text-center" v-if="error"><strong>Error:</strong> {{error}}</div>

        <!-- Submit -->
        <button type="submit" class="btn btn-primary btn-block" :disabled="errors.any() || formCheck">
          <app-loading v-if="submitting">Submitting...</app-loading>
          <span v-if="!submitting">Submit</span>
        </button>
      </form>
    </b-modal>
  </div>
</template>

<script>
import Loading from '@/components/Loading'
import userStore from '@/userStore'
import router from '@/router/index.js'
import { login$, signup$ } from '@/http-request'

export default {
  name: 'login-modal',
  components: {
    'app-loading': Loading
  },
  data () {
    return {
      submitting: false,
      signup: false,
      error: '',
      choices: [
        'Alberta',
        'British Columbia',
        'Manitoba',
        'New Brunswick',
        'Newfoundland and Labrador',
        'Northwest Territories',
        'Nova Scotia',
        'Nunavut',
        'Ontario',
        'Prince Edward Island',
        'Quebec',
        'Saskatchewan',
        'Yukon'
      ],
      userForm: {
        email: '',
        username: '',
        password: '',
        password2: '',
        firstname: '',
        lastname: '',
        city: '',
        province: ''
      }
    }
  },
  computed: {
    formCheck () {
      return Object.keys(this.fields).some(key => this.fields[key].pristine)
    }
  },
  methods: {
    loginType (type) {
      this.signup = type
      this.clear()
    },
    login () {
      const userInfo = {
        email: this.userForm.email,
        password: this.userForm.password
      }
      if (this.signup) {
        userInfo.username = this.userForm.username
        userInfo.firstname = this.userForm.firstname
        userInfo.lastname = this.userForm.lastname
        userInfo.city = this.userForm.city
        userInfo.province = this.userForm.province
      }
      this.submitting = true
      const local$ = this.signup ? signup$ : login$
      local$(userInfo)
      // mockCall$(userInfo)
        .then(res => {
          this.submitting = false
          // update userStore
          userStore.login(res.data)
          // redirect to profile page
          router.push('my-books')
        })
        .catch(err => {
          this.submitting = false
          this.error = err.message
        })
    },
    clear () {
      Object.keys(this.userForm).forEach(field => {
        this.userForm[field] = ''
      })
      this.error = ''
      // NOTE: Vue batches model changes so it could be done asynchronously
      this.$nextTick(() => {
        this.errors.clear()
      })
    },
    close () {
      if (!this.submitting) {
        this.$refs.loginModal.hide()
      }
    }
  }
}
</script>

<style scoped>
  .fake-pointer {
    cursor: pointer;
    user-select: none;
  }
</style>
