import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const appDirectory = path.join(projectDirectory, 'insights')
const source = path.join(appDirectory, 'public', 'frontend', 'index.html')
const destination = path.join(appDirectory, 'www', '_insights.html')

mkdirSync(path.dirname(destination), { recursive: true })
copyFileSync(source, destination)
