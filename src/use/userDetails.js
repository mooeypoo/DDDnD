import { computed } from 'vue'
// import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

export function userDetails() {
  const store = useUserStore()

  const nameChoice = computed({
    get() {
      return store.getName
    },
    set(val) {
      store.setName(val)
    }
  })

  const chars = ['knight', 'mage', 'rogue']
  const charImagePaths = chars.map((char) => {
    return './images/characters/' + char + '_standing.png'
  })

  const charChoice = computed({
    get() {
      if (chars.indexOf(store.getCharacter) === -1) {
        return ''
      }
      return store.getCharacter
    },
    set(char) {
      if (chars.indexOf(char) === -1) {
        store.setCharacter('')
      } else {
        store.setCharacter(char)
      }
    }
  })

  const userAvatarPath = computed({
    get() {
      const i = chars.indexOf(store.getCharacter)
      if (i === -1) {
        return ''
      }
      return './images/characters/' + chars[i] + '_standing.png'
    },
    set(index) {
      const i = chars.indexOf(store.getCharacter)
      if (i === -1) {
        store.setCharacter('')
      } else {
        store.setCharacter(chars[index])
      }
    }
  })

  return {
    userAvatarPath,
    chars,
    charImagePaths,
    vUsername: nameChoice,
    vUserChar: charChoice
  }
}
