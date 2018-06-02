import { combineReducers } from 'redux'
import { remove, forEach, omit } from 'lodash'
import ColorGenerator from '../utils/colorGenerator'
import { actionTypes } from '../constants/appConstants'

export const initialState = {
  kudos: [], // this is the default state that would be used if one were not passed into the store
  error: null,
  currentTab: 'Recent',
  isFetchingKudos: false,
  totalKudos: 0,
  user: { name: '', id: '', email: '', avatar: '' },
  emails: [],
  showModal: false,
}

function getKudo(kudos, kudoId) {
  let matchingKudo = null
  forEach(kudos, (kudo, index) => {
    if (kudo.id === kudoId) {
      matchingKudo = { ...kudo }
      kudos[index] = matchingKudo
      return
    }
  })

  return matchingKudo
}

function assignKudoColor(kudo, appendBack) {
  return {
    ...kudo,
    colorClass: appendBack ? ColorGenerator.appendBack() : ColorGenerator.appendFront(),
  }
}

const kudos = (state = [], action) => {
  const { type } = action

  switch (type) {
    case actionTypes.FETCH_KUDOS_REQUEST:
      if (action.append) {
        return state
      } else {
        return []
      }
    case actionTypes.SERVER_RECEIVED_KUDO:
      const newKudo = createKudo(action)
      return [assignKudoColor(newKudo, false)].concat(state)
    case actionTypes.FETCH_KUDOS_SUCCESS:
      const kudos = action.kudos.map(kudo => assignKudoColor(kudo, true))
      if (action.append) {
        return state.concat(kudos) // append the next page
      } else {
        return kudos // clobber anything in the existing store
      }
    case actionTypes.SERVER_ACCEPTED_LIKE:
    case actionTypes.SERVER_ACCEPTED_UNLIKE:
      const newKudos = [...state]
      const { giverId, giverName, kudoId } = action

      const matchingKudo = getKudo(newKudos, kudoId)

      if (type === actionTypes.SERVER_ACCEPTED_LIKE) {
        matchingKudo.likes = matchingKudo.likes.concat({
          giver: giverName,
          giver_id: giverId,
        })
      } else {
        matchingKudo.likes = [...matchingKudo.likes]

        remove(matchingKudo.likes, like => {
          return like.giver_id === giverId
        })
      }

      return newKudos
    default:
      return state
  }
}

const createKudo = action => {
  return omit(action, 'type')
}

const error = (state = null, action) => {
  const { type, error } = action

  if (type == actionTypes.RESET_ERROR_MESSAGE) {
    return null
  } else if (error) {
    return error
  } else {
    return state
  }
}

const currentTab = (state = 'Recent', action) => {
  const { type, newActiveTab } = action

  if (type == actionTypes.SET_ACTIVE_TAB) {
    return newActiveTab
  } else {
    return state
  }
}

const isFetchingKudos = (state = false, action) => {
  const { type } = action
  if (type == actionTypes.FETCH_KUDOS_REQUEST) {
    return true
  } else if ([actionTypes.FETCH_KUDOS_SUCCESS, actionTypes.FETCH_KUDOS_FAILURE].includes(type)) {
    return false
  } else {
    return state
  }
}

const totalKudos = (state = 0, action) => {
  switch (action.type) {
    case actionTypes.FETCH_KUDOS_REQUEST:
      return 0
    case actionTypes.FETCH_KUDOS_SUCCESS:
      return action.totalKudos
    default:
      return state
  }
}

const initialize = (
  state = {
    user: { name: '', id: '', email: '', avatar: '' },
    allow_email_notifications: true,
    allow_slack_notifications: true,
  },
  action
) => {
  if (action.type === actionTypes.INITIALIZE) {
    const { user, allow_email_notifications, allow_slack_notifications, emails } = action
    return {
      ...user,
      allow_email_notifications,
      allow_slack_notifications,
    }
  }
  return state
}

const fetchEmails = (state = [], action) => {
  if (action.type === actionTypes.FETCH_EMAILS) {
    const {emails} = action;
    return emails;
  }
  return state;
}

const showModal = (state = false, action) => {
  return action.type === actionTypes.MODAL_SWITCH ? !state : state;
}

const appReducer = combineReducers({
  kudos,
  error,
  currentTab,
  isFetchingKudos,
  totalKudos,
  user: initialize,
  showModal,
  fetchEmails
})

export default appReducer
