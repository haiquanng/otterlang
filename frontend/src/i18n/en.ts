export const en = {
  appName: 'OtterLang',
  common: {
    retry: 'Try again',
  },
  session: {
    waking: 'Waking up the server. The first visit after a break can take up to a minute.',
    unreachable: "Can't reach the server right now. It may still be waking up.",
  },
  signIn: {
    title: 'Welcome back',
    subtitle: 'Sign in to keep learning.',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    wrongCredentials: 'Wrong email or password.',
    tooManyAttempts: 'Too many attempts. Wait a few minutes and try again.',
    invalidEmail: 'That email address does not look right.',
    genericError: 'Something went wrong. Please try again.',
    inviteOnly: 'OtterLang is invite-only for now.',
  },
  nav: {
    today: 'Today',
    library: 'Library',
    add: 'Add',
    documents: 'Documents',
    settings: 'Settings',
  },
  today: {
    title: 'Today',
    body: 'Cards due for review and your latest documents will show up here.',
  },
  library: {
    title: 'Library',
    body: 'Every word, collocation and pattern you save lives here.',
  },
  add: {
    title: 'Add',
    body: 'Paste a tech blog post or an IELTS passage and pick the words worth learning.',
  },
  documents: {
    title: 'Documents',
    body: 'The texts you learned from, with every saved word in context.',
  },
  settings: {
    title: 'Settings',
    account: 'Your account',
    signOut: 'Sign out',
    server: 'Server',
    serverOnline: 'Online',
    serverWaking: 'Waking up…',
    serverWakingHint: 'The free server sleeps when idle. The first request can take up to a minute.',
    serverDown: 'Unreachable',
  },
} as const
