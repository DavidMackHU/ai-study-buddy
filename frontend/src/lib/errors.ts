type ErrorContext = 'auth' | 'chat' | 'upload' | 'flashcards'

export function friendlyError(err: unknown, context?: ErrorContext): string {
  // Network / server unreachable
  if (
    err instanceof TypeError ||
    (err instanceof Error &&
      (err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('networkerror')))
  ) {
    return 'Server is waking up, please wait 60 seconds and try again.'
  }

  switch (context) {
    case 'auth':
      return 'Incorrect email or password. Please try again.'
    case 'chat':
      return "Couldn't reach the AI tutor. Please try again."
    case 'upload':
      return 'Upload failed. Check your file size (max 10MB) and try again.'
    case 'flashcards':
      return "Couldn't generate flashcards. Please try again in a moment."
    default:
      return 'Something went wrong. Please try again.'
  }
}
