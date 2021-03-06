import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import biri from 'biri'
import io from 'socket.io-client'

Vue.use(Vuex)

axios.defaults.baseURL = process.env.VUE_APP_BASE_PATH
axios.defaults.withCredentials = true

const mutations = {
  SET_PROPERTY: 'setProperty',
  UPDATE_QUESTIONS: 'updateQuestions',
  SET_COMPUTER_ID: 'setComputerId',
  SET_USER: 'setUser'
}

const socket = io(process.env.VUE_APP_SOCKET_PATH)

const store = new Vuex.Store({
  state: {
    loading: false,
    eventId: null,
    event: {},
    computerId: 0,
    user: null
  },
  mutations: {
    [mutations.SET_PROPERTY](state, obj) {
      for (var key in obj) {
        state[key] = obj[key]
      }
    },
    [mutations.UPDATE_QUESTIONS](state, obj) {
      state.event.questions = obj
    },
    [mutations.SET_COMPUTER_ID](state, computerId) {
      state.computerId = computerId
    },
    [mutations.SET_USER](state, user) {
      state.user = user
    }
  },
  actions: {
    async fetchEventIdByCode(ctx, code) {
      const res = await axios.get(`/events?code=${code}`)
      return res.data
    },
    async submitQuestion({ commit, dispatch, state }, { question, name }) {
      commit(mutations.SET_PROPERTY, { loading: true })

      try {
        await axios.post(`/events/${state.eventId}/questions`, { text: question, user: name })
      } catch (e) {
        throw e
      } finally {
        commit(mutations.SET_PROPERTY, { loading: false })
      }
    },
    async fetchEvent({ commit, state }) {
      const req = await axios.get(`/events/${state.eventId}`)

      commit(mutations.SET_PROPERTY, { event: req.data })
    },
    async vote({ commit, state }, { questionId, vote }) {
      commit(mutations.SET_PROPERTY, { loading: true })

      try {
        await axios.patch(`/events/${state.eventId}/questions/${questionId}`, { vote })
      } catch (e) {
        throw e
      } finally {
        commit(mutations.SET_PROPERTY, { loading: false })
      }
    },
    async setProperty({ commit }, obj) {
      commit(mutations.SET_PROPERTY, obj)
    },
    async joinEvent({ commit, dispatch, state }) {
      console.log('join event')
      socket.emit('join-room', state.eventId)
      dispatch('fetchEvent')
    },
    async withdrawQuestion({ state }, questionId) {
      await axios.delete(`/events/${state.eventId}/questions/${questionId}`)
    },
    updateQuestions({ commit }, questions) {
      commit(mutations.UPDATE_QUESTIONS, questions)
    },
    async registerComputerId({ commit }, computerId) {
      commit(mutations.SET_COMPUTER_ID, computerId)

      await axios.post('/singularity', { computerId })
    },
    async registerUser(store, user) {
      return axios.post('/account/register', { user })
    },
    async login({ commit }, credentials) {
      try {
        const user = await axios.post('/account/session', credentials)
        commit(mutations.SET_USER, user.data)
      } catch (e) {
        throw e
      }
    },
    async logout({ commit }) {
      await axios.delete('/account/session')
      commit(mutations.SET_USER, null)
    },
    async fetchSession({ commit }) {
      const user = await axios.get('/account/session')
      commit(mutations.SET_USER, user.data)
    },
    async createEvent({ dispatch }, event) {
      await axios.post('/events', event)
      await dispatch('fetchSession')
    }
  }
})

socket.on('questions updated', () => {
  store.dispatch('fetchEvent')
})

export default async function init() {
  await store.dispatch('registerComputerId', await biri())
  await store.dispatch('fetchSession')
  return store
}
