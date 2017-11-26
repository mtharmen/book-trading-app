/* global localStorage */
import axios from 'axios'

// TODO: Add global error handler
// https://github.com/axios/axios/issues/367

const baseURL = window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:8080'
const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000
})

instance.interceptors.response.use(null, err => {
  if (err.response.status === 500) {
    window.location.href = 'http://localhost:8080/error?code=500'
    // return Promise.reject(err)
  }
  return Promise.reject(err.response.data)
})

function setHeaders () {
  return { headers: { 'authorization': 'Bearer ' + (localStorage.getItem('token') || '') } }
}

// Auth stuff
export function login$ (userInfo) {
  return instance.post('/auth/local/login', userInfo)
}
export function signup$ (userInfo) {
  return instance.post('/auth/local/signup', userInfo)
}
export function updateInfo$ (updateInfo) {
  return instance.post('/auth/update-info', updateInfo, setHeaders())
}

// Book Stuff
export function getBooks$ (username = '', allBooks = false, onlyISBN = false) {
  // TODO: use a parametizer for querystrings
  let query = '?'
  query += username ? 'username=' + username + '&' : ''
  query += onlyISBN ? 'onlyISBN=1&' : ''
  query += allBooks ? 'allBooks=1' : ''
  return instance.get('/api/getBooks' + query, setHeaders())
}
export function getBook$ (owner, ISBN) {
  const query = '?owner=' + owner + '&ISBN=' + ISBN
  return instance.get('/api/getBook' + query, setHeaders())
}
export function searchBooks$ (search) {
  let query = '?'
  query += search.title ? 'title=' + search.title + '&' : ''
  query += search.author ? 'author=' + search.author + '&' : ''
  query += search.isbn ? 'isbn=' + search.isbn + '&' : ''
  return instance.get('/api/search' + query, setHeaders())
}
export function addBook$ (book) {
  return instance.post('/api/addBook', book, setHeaders())
}
export function removeBook$ (id) {
  return instance.delete('/api/removeBook/' + id, setHeaders())
}

// Trade Stuff
export function makeTrade$ (tradeInfo) {
  // const query = '?owner1=' + tradeInfo.offer.owner + '?owner2=' + tradeInfo.request.owner + '?book1=' + tradeInfo.request.ISBN + '?book2=' + tradeInfo.request.ISBN
  return instance.put('/api/makeTrade', { tradeInfo }, setHeaders())
}
export function getTrades$ (type, ISBN = false, tradeID = false, allTrades = false) {
  let query = '?type=' + type
  query += ISBN ? '&ISBN=' + ISBN : ''
  query += tradeID ? '&tradeID=' + tradeID : ''
  query += allTrades ? '&allTrades=' + allTrades : ''
  return instance.get('/api/getTrades' + query, setHeaders())
}
export function respondToTrade$ (id, response) {
  return instance.put('/api/respondToTrade/' + id, { response }, setHeaders())
}
export function removeTrade$ (id) {
  return instance.delete('/api/removeTrade/' + id, setHeaders())
}
export function hideTrade$ (id, type) {
  return instance.put('/api/hideTrade/' + id, { type }, setHeaders())
}
export function getAddress$ (id) {
  return instance.get('/api/getAddress/' + id, setHeaders())
}
export function completeTrade$ (id) {
  return instance.put('/api/completeTrade/' + id, {}, setHeaders())
}

export function mockCall$ (data, error = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const res = { data: data || 'Hello World' }
      if (error) {
        reject(error || 'Oops')
      }
      resolve(res)
    }, Math.floor(Math.random() * 100 + 400))
  })
}
