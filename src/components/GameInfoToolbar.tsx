import {
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiButton,
  TldrawUiButtonIcon,
  TldrawUiButtonLabel,
} from 'tldraw'

interface GameInfoToolbarProps {
  selectedShapeId?: string | null
  onAddFeatureDetails?: () => void
  onShowHistory?: () => void
}

export function GameInfoToolbar({
  selectedShapeId,
  onAddFeatureDetails,
  onShowHistory,
}: GameInfoToolbarProps) {
  return (
    <DefaultToolbar>
      <DefaultToolbarContent />
      {selectedShapeId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: 'auto',
          }}
        >
          {onAddFeatureDetails && (
            <TldrawUiButton
              type="normal"
              onClick={onAddFeatureDetails}
              title="Add Feature Details"
            >
              <TldrawUiButtonIcon icon="plus" />
              <TldrawUiButtonLabel>Add Details</TldrawUiButtonLabel>
            </TldrawUiButton>
          )}
          {onShowHistory && (
            <TldrawUiButton
              type="normal"
              onClick={onShowHistory}
              title="Show Feature History"
            >
              <TldrawUiButtonIcon icon="history" />
              <TldrawUiButtonLabel>History</TldrawUiButtonLabel>
            </TldrawUiButton>
          )}
        </div>
      )}
    </DefaultToolbar>
  )
}
