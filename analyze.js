import { analyzeMetadata } from 'vite'

analyzeMetadata({
  root: process.cwd(),
  logLevel: 'info',
}).then(({ metadata }) => {
  console.log(metadata)
})