import Vue from 'vue'
import App from './App'
import router from './router'

import BootstrapVue from 'bootstrap-vue'
import VeeValidate from 'vee-validate'
Vue.use(BootstrapVue)

VeeValidate.Validator.updateDictionary({
  en: {
    messages: {
      confirmed: function () {
        return 'Your passwords not match'
      }
    }
  }
})
Vue.use(VeeValidate)

Vue.config.productionTip = false

new Vue({ // eslint-disable-line no-new
  el: '#app',
  router,
  render: h => h(App)
})
