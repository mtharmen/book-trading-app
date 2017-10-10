/* global localStorage */

export default {
  user: {
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    city: '',
    province: '',
    role: ''
  },

  login (userInfo) {
    this.setLocalStorage(userInfo)
    this.setUserInfo(userInfo)
  },
  logout () {
    this.removeLocalStorage()
  },
  setLocalStorage (userInfo) {
    localStorage.setItem('token', userInfo.token)
    localStorage.setItem('exp', userInfo.exp)
    localStorage.setItem('username', userInfo.username)
    localStorage.setItem('email', userInfo.email)
    localStorage.setItem('profile', userInfo.profile)
    localStorage.setItem('role', userInfo.role)
  },
  setUserInfo (userInfo = false) {
    userInfo = userInfo || {
      username: localStorage.getItem('username'),
      email: localStorage.getItem('email'),
      profile: localStorage.getItem('profile'),
      role: localStorage.getItem('role')
    }
    this.user.username = userInfo.username
    this.user.email = userInfo.email
    const profile = JSON.parse(userInfo.profile)
    this.user.firstname = profile.firstname
    this.user.lastname = profile.lastname
    this.user.province = profile.province
    this.user.city = profile.city
    this.user.role = userInfo.role
  },
  removeLocalStorage () {
    localStorage.removeItem('token')
    localStorage.removeItem('exp')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('profile')
    localStorage.removeItem('role')
    Object.keys(this.user).forEach(field => {
      this.user[field] = ''
    })
  },
  checkToken () {
    return Date.now() < JSON.parse(localStorage.getItem('exp') * 1000)
  },
  checkAdmin () {
    return localStorage.getItem('role') === 'admin'
  }
}
