<script>
import { mapState, mapActions } from 'vuex'
import { notification } from 'ant-design-vue'
import moment from 'moment'

export default {
  name: 'event-detail',
  data() {
    return {
      question: '',
      name: undefined,
      moment,
      sortBy: 'popular',
      orderBy: -1,
      questions: []
    }
  },
  created() {
    this.setProperty({ eventId: this.$route.params.eventId })
    this.joinEvent(this.$route.params.eventId)
  },
  methods: {
    ...mapActions(['submitQuestion', 'setProperty', 'joinEvent', 'vote', 'withdrawQuestion']),
    async sendQuestion() {
      try {
        await this.submitQuestion({ question: this.question, name: this.name })

        this.question = ''
      } catch (e) {
        notification.error({ message: e.message })
      }
    },
    updateSorting(e) {
      if (this.sortBy == e.target.value) {
        this.orderBy = -this.orderBy
      }

      this.sortBy = e.target.value

      this.sortQuestions({ intentional: true })
    },
    sortQuestions({ intentional = false } = {}) {
      if (this.sortBy == 'random' && !intentional) {
        this.previousQuestionsSortedIds.reverse().forEach(cq => {
          const i = this.questions.findIndex(q => q._id == cq)
          if (i == -1) return
          this.questions.unshift(this.questions.splice(i, 1)[0])
        })

        return
      }

      this.questions.sort((a, b) => {
        if (this.sortBy == 'popular') return (a.votes - b.votes) * this.orderBy
        else if (this.sortBy == 'random') return Math.random() * 2 - 1
        return (new Date(a.createdAt) - new Date(b.createdAt)) * this.orderBy
      })
    }
  },
  computed: {
    ...mapState(['event', 'loading']),
    popularSortOrderIndicator() {
      if (this.sortBy != 'popular') return ''
      if (this.orderBy == -1) return ' ▼'
      return ' ▲'
    },
    recentSortOrderIndicator() {
      if (this.sortBy != 'recent') return ''
      if (this.orderBy == -1) return ' ▼'
      return ' ▲'
    },
    randomSortOrderIndicator() {
      if (this.sortBy != 'random') return ''
      return '◆'
    }
  },
  watch: {
    'event.questions'(questions) {
      this.previousQuestionsSortedIds = this.questions.map(q => q._id)

      this.questions = questions.slice()
      this.sortQuestions()
    }
  }
}
</script>

<template lang="pug">
.event-detail
  .content
    h1 {{ event.title }}
    h3 {{ event.description }}
    a-card
      form(@submit.prevent="sendQuestion")
        h2 Ask the speaker
        a-textarea(
          placeholder="Type your question"
          :autoSize="{ minRows: 2, maxRows: 6 }"
          v-model="question"
        )
        a-input(placeholder="Your name (optional)" v-model="name")
        a-button(type="primary" @click="sendQuestion" :loading="loading" icon="message") Send
    a-card
      .questions
        div.questions-header
          h2 Questions
            a-avatar.question-count {{ questions.length }}
          .sort-container
            div(v-if="questions.length")
              span Sort questions by &nbsp;
              a-radio-group(size="small" defaultValue="popular" buttonStyle="solid" :value="sortBy")
                a-radio-button(value="popular" @click="updateSorting") Popular {{ popularSortOrderIndicator }}
                a-radio-button(value="recent" @click="updateSorting") Recent {{ recentSortOrderIndicator }}
                a-radio-button(value="random" @click="updateSorting") Random {{ randomSortOrderIndicator }}
        div.questions-container
          p.no-questions(v-if="!questions.length") This event has no questions, be the first one and ask the first question!
          a-card(v-for="question in questions" :key="question._id" :bordered="false")
            a-comment
              template(slot="actions")
                a-tooltip(:title="question.voted ? 'Dislike' : 'Like'" @click="vote({ questionId: question._id, vote: question.voted ? 'dislike' : 'like' })")
                  span(key="comment-basic-like")
                    a-icon(type="like" :theme="question.voted ? 'filled' : 'outlined'")
                  span(style="padding-left: 4px") {{ question.votes }}
                span
                  a-button(type="secondary" v-if="question.ownQuestion" @click="withdrawQuestion(question._id)") Withdraw
              a(slot="author") {{ question.author }}
              a-avatar(
                src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
                alt="Default avatar"
                slot="avatar")
              p(slot="content") {{ question.text }}
              a-tooltip(slot="datetime" :title="moment(question.createdAt).format('YYYY-MM-DD HH:mm:ss')")
                span(:id="'question-' + question._id.slice(-4)") {{ moment(question.createdAt).fromNow() }}
            div.question-id {{ '#' + question._id.slice(-4) }}
            hr
</template>

<style lang="scss">
.questions {
  .ant-card {
    .ant-card-body {
      padding: 0px 24px;

      hr {
        height: 1px;
        border: 0;
        border-bottom: 1px solid #e8e8e8;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.questions {
  .questions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media (max-width: 680px) {
      display: block;
    }
  }

  .ant-card {
    margin: 0;
    padding-bottom: 16px;
  }

  .questions-container {
    margin-top: 24px;
  }
}

.no-questions {
  margin-top: 1em;
}

.questions h2 {
  margin-bottom: 0;
}

.question-count {
  margin-left: 8px;
}

.sort-container {
  margin-top: 1em;
}

@media (min-width: 681px) {
  .sort-container {
    margin-top: 0;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }
}

.question-id {
  position: absolute;
  right: 0em;
  top: 0em;
  padding: 18px;
  font-size: 12px;
  line-height: 18px;
  color: #ccc;
}

.questions-tag {
  margin-right: 0;
}

.ant-comment {
  background: white;
}

.ant-card {
  margin: 24px 0;
}

form > * {
  margin: 8px 0 !important;
}

textarea {
  padding: 8px;
}
</style>
