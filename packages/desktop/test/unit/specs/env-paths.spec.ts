import { describe, expect, it } from 'vitest'
import path from 'node:path'
import EnvPaths from 'common/envPaths'

describe('EnvPaths', () => {
  it('uses the electron-store preferences filename', () => {
    const userDataPath = path.join('tmp', 'marktext-user-data')
    const paths = new EnvPaths(userDataPath)

    expect(paths.preferencesFilePath).to.equal(
      path.join(userDataPath, 'preferences.json')
    )
  })
})
