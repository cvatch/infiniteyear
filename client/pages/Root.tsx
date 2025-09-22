import { Navigate } from 'react-router-dom'
import { uniqueId } from 'tldraw'

// Generate a new room ID each time for a fresh game
const myLocalRoomId = 'game-' + uniqueId()

export function Root() {
	return <Navigate to={`/${myLocalRoomId}`} />
}
