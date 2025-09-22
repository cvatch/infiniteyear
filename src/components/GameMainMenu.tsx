import { 
  DefaultMainMenu,
  DefaultMainMenuContent,
  TldrawUiMenuGroup,
  TldrawUiMenuItem
} from 'tldraw'

interface GameMainMenuProps {
  onExport?: () => void
  onImport?: () => void
}

export function GameMainMenu({ onExport, onImport }: GameMainMenuProps) {
  return (
    <DefaultMainMenu>
      <DefaultMainMenuContent />
      <TldrawUiMenuGroup id="game-actions" label="Game Actions">
        <TldrawUiMenuItem
          id="export-game"
          label="Export Game"
          icon="external-link"
          readonlyOk
          onSelect={() => onExport?.()}
        />
        <TldrawUiMenuItem
          id="import-game"
          label="Import Game"
          icon="upload"
          readonlyOk
          onSelect={() => onImport?.()}
        />
      </TldrawUiMenuGroup>
    </DefaultMainMenu>
  )
}