const GITLAB_URL = import.meta.env.VITE_GITLAB_URL
const CLIENT_ID = import.meta.env.VITE_GITLAB_CLIENT_ID

const REDIRECT_URI = new URL(import.meta.env.BASE_URL, window.location.origin).href

console.log("Gitlab url : " + GITLAB_URL)
console.log(`Redircect uri : ${REDIRECT_URI}`)

function generateRandomString(length = 64) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)

  return Array.from(randomValues, (value) => characters[value % characters.length]).join('')
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier)

  const digest = await crypto.subtle.digest('SHA-256', data)

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function loginWithGitLab() {
  const codeVerifier = generateRandomString()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateRandomString(32)

  sessionStorage.setItem('gitlab_code_verifier', codeVerifier)
  sessionStorage.setItem('gitlab_oauth_state', state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'api',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${GITLAB_URL}/oauth/authorize?${params}`
}

export async function exchangeCodeForToken(code) {
  const codeVerifier = sessionStorage.getItem('gitlab_code_verifier')

  if (!codeVerifier) {
    throw new Error('PKCE code verifier introuvable')
  }

  const redirectUri = `${window.location.origin}/auth/gitlab/callback`

  const response = await fetch(`${GITLAB_URL}/oauth/token`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },

    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    throw new Error(`Impossible de récupérer le token GitLab (${response.status})`)
  }

  const tokens = await response.json()

  sessionStorage.removeItem('gitlab_code_verifier')

  return tokens
}
