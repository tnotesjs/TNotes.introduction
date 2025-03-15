import minimist from 'minimist'

import ReadmeUpdater from './update.js'
import { mergeNotes, distributeNotes } from './merge_distribute.js'
import { syncRepo } from './utils/index.js'
import { newNotes } from './new.js'
import { __dirname } from './constants.js'

;(async () => {
  const args = minimist(process.argv)

  switch (true) {
    case args.update:
      const updater = new ReadmeUpdater()
      updater.updateReadme()
      // await syncRepo();
      break
    case args.sync:
      await syncRepo()
      break
    case args.new:
      newNotes()
      break
    case args.merge:
      mergeNotes()
      break
    case args.distribute:
      distributeNotes()
      break
    default:
      console.log('No valid command provided.')
      break
  }
})()
