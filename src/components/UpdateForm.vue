<template>
  <div class="row justify-content-center">
    <div class="col-8">
      <div class="card">

        <div class="card-header">
          <ul class="nav nav-pills nav-fill">
            <li class="nav-item fake-pointer" @click="switchTab('personal')">
              <a class="nav-link" :class="tab === 'personal' ? 'active' : ''">Personal Info</a>
            </li>
            <li class="nav-item fake-pointer" @click="switchTab('email')">
              <a class="nav-link" :class="tab === 'email' ? 'active' : ''">Email</a>
            </li>
            <li class="nav-item fake-pointer" @click="switchTab('password')">
              <a class="nav-link" :class="tab === 'password' ? 'active' : ''">Password</a>
            </li>
          </ul>
        </div>

        <div class="card-body">
          <form @submit.stop.prevent="update">
            <!-- Current Password -->
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input name="currentPassword" type="password" class="form-control" v-validate="'required'"  data-vv-as="current password" v-model="updateForm.currentPassword">
              <span v-show="errors.has('currentPassword')" class="small text-danger">{{ errors.first('currentPassword') }}</span>
            </div>

            <!-- Email -->
            <div class="form-group" v-if="tab === 'email'">
              <label for="email">Email</label>
              <input name="email" type="email" class="form-control" :placeholder="user.email" v-validate="'required|email'" v-model="updateForm.email">
              <span v-show="errors.has('email')" class="small text-danger">{{ errors.first('email') }}</span>
            </div>

            <!-- First Name -->
            <div class="form-group" v-if="tab === 'personal'">
              <label for="firstname">First Name</label>
              <input name="firstname" type="text" class="form-control" :placeholder="user.firstname" v-validate="'required|alpha|max:50'" maxlength="50" v-model="updateForm.firstname">
              <span v-show="errors.has('firstname')" class="small text-danger">{{ errors.first('firstname') }}</span>
            </div>

            <!-- Last Name -->
            <div class="form-group" v-if="tab === 'personal'">
              <label for="lastname">Last Name</label>
              <input name="lastname" type="text" class="form-control" :placeholder="user.lastname" v-validate="'required|alpha|max:50'" maxlength="50" v-model="updateForm.lastname">
              <span v-show="errors.has('lastname')" class="small text-danger">{{ errors.first('lastname') }}</span>
            </div>

            <!-- Province -->
            <div class="form-group" v-if="tab === 'personal'">
              <label for="province">Province/Territory</label>
              <select name="province" class="form-control" id="province" v-model="updateForm.province">
                <option v-for="(choice, i) in choices" :key="i">{{choice}}</option>
              </select>
              <span v-show="errors.has('province')" class="small text-danger">{{ errors.first('province') }}</span>
            </div>

            <!-- City -->
            <div class="form-group" v-if="tab === 'personal'">
              <label for="city">City</label>
              <input name="city" type="text" class="form-control" :placeholder="user.city" v-validate="'required|alpha|max:50'" maxlength="50" v-model="updateForm.city">
              <span v-show="errors.has('city')" class="small text-danger">{{ errors.first('city') }}</span>
            </div>

            <!-- Password -->
            <div class="form-group" v-if="tab === 'password'">
              <label for="password">Password</label>
              <input name="password" type="password" class="form-control" v-validate="'required|min:4'" v-model="updateForm.password">
              <span v-show="errors.has('password')" class="small text-danger">{{ errors.first('password') }}</span>
            </div>

            <!-- Password Confirm -->
            <div class="form-group" v-if="tab === 'password'">
              <label for="password2">Password Confirmation</label>
              <input name="password2" type="password" class="form-control" v-validate="'required|confirmed:password'" data-vv-as="password confirmation" v-model="updateForm.password2">
              <span v-show="errors.has('password2')" class="small text-danger">{{ errors.first('password2') }}</span>
            </div>

            <div class="alert alert-danger text-center" v-if="error"><strong>Error:</strong> {{error}}</div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary btn-block" :disabled="!formCheck">
              <app-loading v-if="submitting">Submitting...</app-loading>
              <span v-if="!submitting">Submit</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '@/components/Loading'
import userStore from '@/userStore'
import { updateInfo$ } from '@/http-request'

export default {
  name: 'update-form',
  components: {
    'app-loading': Loading
  },
  data () {
    return {
      submitting: false,
      tab: 'personal',
      error: '',
      updateForm: {
        currentPassword: '',
        email: '',
        firstname: '',
        lastname: '',
        city: '',
        province: userStore.user.province,
        password: '',
        password2: ''
      },
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
      user: userStore.user
    }
  },
  computed: {
    formCheck () {
      const fields = Object.keys(this.fields).filter(field => field !== 'currentPassword')
      const currentPassword = this.fields['currentPassword'] ? this.fields['currentPassword'].valid : null
      // console.log('Password: ' + currentPassword)
      return fields.some(key => {
        // console.log(key + ': ' + this.fields[key].valid)
        return this.fields[key].valid
      }) && currentPassword
    }
  },
  methods: {
    switchTab (type) {
      this.tab = type
      this.clear()
    },
    update () {
      this.error = ''
      const updateInfo = {
        currentPassword: this.updateForm.currentPassword
      }
      if (this.tab === 'personal') {
        updateInfo.firstname = this.updateForm.firstname
        updateInfo.lastname = this.updateForm.lastname
        updateInfo.city = this.updateForm.city
        updateInfo.province = this.updateForm.province
      } else if (this.tab === 'email') {
        updateInfo.email = this.updateForm.email
      } else {
        updateInfo.password = this.updateForm.password
        updateInfo.password2 = this.updateForm.password2
      }
      this.submitting = true
      updateInfo$(updateInfo)
        .then(res => {
          this.submitting = false
          userStore.login(res.data)
          this.clear()
        })
        .catch(err => {
          this.submitting = false
          this.error = err.message
        })
    },
    clear () {
      Object.keys(this.updateForm).forEach(field => {
        this.updateForm[field] = ''
      })
      // NOTE: Vue batches model changes so it could be done asynchronously
      this.$nextTick(() => {
        this.errors.clear()
      })
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
