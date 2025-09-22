import { Editor } from 'tldraw'

// Example showing how to properly register event listeners in tldraw v4
function setupEventListeners(editor: Editor) {
  // 1. Listen for pointer events like double-click
  editor.sideEffects.registerBeforeEventListener('pointer_down', (e) => {
    // Detect double-click (e.detail === 2)
    if (e.detail === 2) {
      console.log('Double-click detected!')
      
      // Get the shape under the pointer
      const hoveredShape = editor.getShapeAtPoint(editor.inputs.currentPagePoint)
      
      if (hoveredShape) {
        console.log('Double-clicked on shape:', hoveredShape)
        // Handle double-click on shape
        handleShapeDoubleClick(hoveredShape.id)
      } else {
        console.log('Double-clicked on canvas')
        // Handle double-click on canvas
        handleCanvasDoubleClick()
      }
    }
  })

  // 2. Listen for other pointer events
  editor.sideEffects.registerBeforeEventListener('pointer_up', (e) => {
    console.log('Pointer up event:', e)
  })

  // 3. Listen for keyboard events
  editor.sideEffects.registerBeforeEventListener('key_down', (e) => {
    console.log('Key down event:', e)
  })

  // 4. Listen for shape selection changes
  editor.sideEffects.registerBeforeChangeHandler('instance_page_state', (prev, next) => {
    // Check if selectedIds changed
    if (prev.selectedShapeIds !== next.selectedShapeIds) {
      const selectedShapes = next.selectedShapeIds
      console.log('Selection changed:', selectedShapes)
      
      if (selectedShapes.length === 1) {
        const shape = editor.getShape(selectedShapes[0])
        console.log('Single shape selected:', shape)
      } else if (selectedShapes.length > 1) {
        console.log('Multiple shapes selected')
      } else {
        console.log('No shapes selected')
      }
    }
    return next
  })

  // 5. Listen for shape creation
  editor.sideEffects.registerAfterCreateHandler('shape', (shape) => {
    console.log('New shape created:', shape)
  })

  // 6. Listen for shape updates
  editor.sideEffects.registerBeforeChangeHandler('shape', (prev, next) => {
    console.log('Shape changed:', { prev, next })
    return next
  })

  // 7. Listen for shape deletion
  editor.sideEffects.registerBeforeDeleteHandler('shape', (shape) => {
    console.log('Shape deleted:', shape)
  })
}

// Helper functions for handling specific events
function handleShapeDoubleClick(shapeId: string) {
  // Implement your double-click handling logic here
  console.log(`Handling double-click on shape ${shapeId}`)
}

function handleCanvasDoubleClick() {
  // Implement your canvas double-click handling logic here
  console.log('Handling double-click on canvas')
}

// Example usage in a React component
function MyTldrawComponent() {
  const handleMount = (editor: Editor) => {
    // Setup all event listeners when editor is mounted
    setupEventListeners(editor)
    
    // Additional editor setup...
  }

  return (
    // Your Tldraw component JSX
    // <Tldraw onMount={handleMount} />
  )
}