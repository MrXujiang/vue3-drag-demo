import { defineStore } from 'pinia'

export const useStore = defineStore('counter',{
  state: () => ({
    isLight:''
  }),
})
