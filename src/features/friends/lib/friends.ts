import defaultFriends from '@/../content/friends.json'

export type Friend = {
  name: string
  url: string
  avatar: string
  description: string
  group?: string
}

export function getPublishedFriends(): Friend[] {
  return (defaultFriends as Friend[]) || []
}
