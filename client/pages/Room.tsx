import { useSync } from '@tldraw/sync'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tldraw, Editor, TLShapeId } from 'tldraw'
import { getBookmarkPreview } from '../getBookmarkPreview'
import { multiplayerAssetStore } from '../multiplayerAssetStore'
import { GameEngine } from '../../src/game/engine'
import { Player } from '../../src/game/types'
import { StartScreen } from '../../src/components/StartScreen'
import { Sidebar } from '../../src/components/Sidebar'
import { GameInfoToolbar } from '../../src/components/GameInfoToolbar'
import { GameMainMenu } from '../../src/components/GameMainMenu'
import { GameDateBanner } from '../../src/components/GameDateBanner'

export function Room() {
	const { roomId } = useParams<{ roomId: string }>()

	// Create a store connected to multiplayer.
	const store = useSync({
		// We need to know the websockets URI...
		uri: `${window.location.origin}/api/connect/${roomId}`,
		// ...and how to handle static assets like images & videos
		assets: multiplayerAssetStore,
	})

	const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
	const [editor, setEditor] = useState<Editor | null>(null)
	const [selectedShapeId, setSelectedShapeId] = useState<TLShapeId | null>(null)
	const [gameStarted, setGameStarted] = useState(false)
	const [gameStateVersion, setGameStateVersion] = useState(0) // Used to trigger re-renders when game state changes
	const [sidebarAction, setSidebarAction] = useState<'details' | 'history' | null>(null)

	// Add beforeunload event listener to warn users about unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (gameStarted && gameEngine) {
				e.preventDefault()
				e.returnValue = 'You have an active game that has not been exported. Are you sure you want to leave?'
				return e.returnValue
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [gameStarted, gameEngine])

	const handleStartGame = (players: Player[], turnsPerPlayer: number) => {
		const engine = new GameEngine(players, turnsPerPlayer)
		setGameEngine(engine)
		setGameStarted(true)
	}

	const handleImportGame = (engine: GameEngine) => {
		setGameEngine(engine)
		setGameStarted(true)
	}

	const handleMount = (editor: Editor) => {
		// when the editor is ready, we need to register our bookmark unfurling service
		editor.registerExternalAssetHandler('url', getBookmarkPreview)

		// Listen for shape selection changes
		editor.sideEffects.registerBeforeChangeHandler('instance_page_state', (prev, next) => {
			// Check if selectedIds changed
			if (prev.selectedShapeIds !== next.selectedShapeIds) {
				const selectedShapes = next.selectedShapeIds
				if (selectedShapes.length === 1) {
					setSelectedShapeId(selectedShapes[0])
				} else {
					setSelectedShapeId(null)
				}
			}
			return next
		})

		setEditor(editor)
	}

	const handleEndTurn = () => {
		if (gameEngine) {
			gameEngine.endTurn()
			// Trigger a re-render by updating the game state version
			setGameStateVersion(prev => prev + 1)
		}
	}

	const handleFeatureSelect = (shapeId: TLShapeId, action: 'details' | 'history' | null = null) => {
		if (!editor) return
		editor.setSelectedShapes([shapeId])
		editor.zoomToSelection({ animation: { duration: 250 } })
		setSidebarAction(action)
	}

	if (!gameStarted) {
		return (
			<div className="room-wrapper">
				<StartScreen onStartGame={handleStartGame} onImportGame={handleImportGame} />
			</div>
		)
	}

	const handleExport = () => {
		if (gameEngine) {
			try {
				const json = gameEngine.exportGame()
				const blob = new Blob([json], { type: 'application/json' })
				const url = URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = 'quiet-year-save.json'
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
			} catch (error) {
				console.error('Error exporting game:', error)
				alert('Error exporting game: ' + (error as Error).message)
			}
		}
	};

	const handleImport = () => {
		// This would typically open a file dialog or import panel
		alert('Import functionality would be implemented here')
	};

	return (
		<div className="RoomWrapper">
			<div className="game-shell">
				<Sidebar
					gameEngine={gameEngine}
					editor={editor}
					selectedShapeId={selectedShapeId}
					onSelectFeature={handleFeatureSelect}
					gameStateVersion={gameStateVersion}
					activeAction={sidebarAction}
					onActionHandled={() => setSidebarAction(null)}
				/>
				<div className="game-main">
					<GameDateBanner
						turnInfo={gameEngine?.getCurrentTurnInfo() ?? null}
						currentPlayer={gameEngine?.getCurrentPlayer() ?? null}
						prompt={gameEngine?.getCurrentPrompt() ?? ''}
						onEndTurn={handleEndTurn}
					/>
					<div className="game-main__canvas">
						<Tldraw
							store={store}
							deepLinks
							onMount={handleMount}
							components={{
								Toolbar: () => (
									<GameInfoToolbar
										selectedShapeId={selectedShapeId}
										onAddFeatureDetails={() => {
											if (selectedShapeId) {
												handleFeatureSelect(selectedShapeId, 'details')
											}
									}}
										onShowHistory={() => {
											if (selectedShapeId) {
												handleFeatureSelect(selectedShapeId, 'history')
											}
									}}
									/>
								),
								MainMenu: () => (
									<GameMainMenu
										onExport={handleExport}
										onImport={handleImport}
									/>
								)
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
