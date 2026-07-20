import 'dotenv/config'
import { runAllSeeders } from './index'

const runCli = async (): Promise<void> => {
  try {
    await runAllSeeders()
  } catch {
    process.exitCode = 1
  }
}

void runCli()
