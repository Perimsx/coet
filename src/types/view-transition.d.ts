interface ViewTransition {
  ready: Promise<void>
}

interface Document {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>
  ) => ViewTransition
}
